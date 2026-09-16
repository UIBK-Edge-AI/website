#!/usr/bin/env python3
"""
Read publications from FLD-EdgeAI-RADU-ONLY.xlsx, resolve BibTeX via DOI
content-negotiation or CrossRef title search, and append new entries to
files/edgeai.bib.

All sheets (except 'Categories') are processed in order.
Rows without a Title, or whose Category is not in CITABLE_CATEGORIES, are
skipped automatically.  Titles already present in edgeai.bib are not added
again.

Usage (local):
  source .venv/bin/activate
  python scripts/fetch_excel_publications.py

  # Or with the venv interpreter directly:
  .venv/bin/python3 scripts/fetch_excel_publications.py
"""

import os
import re
import sys
import time

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl not installed.  Run:  pip install openpyxl")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: requests not installed.  Run:  pip install requests")
    sys.exit(1)

try:
    import bibtexparser
    from bibtexparser.bparser import BibTexParser as _BibTexParser
    _HAS_BIBTEXPARSER = True
except ImportError:
    _HAS_BIBTEXPARSER = False

EXCEL_FILE    = "files/FLD-EdgeAI-RADU-ONLY.xlsx"
BIBTEX_FILE   = "files/edgeai.bib"
REQUEST_DELAY = 1.5   # seconds between outbound HTTP requests

# Categories (case-insensitive) that correspond to citable publications.
# Rows whose Category is NOT in this set are silently skipped.
CITABLE_CATEGORIES = {
    "journal articles",
    "conference papers",
    "book chapters",
    "technical reports",
    "posters",
    "workshop papers",
    "tutorials and demonstrations",
    "patents",
}

CATEGORY_TO_PUBTYPE = {
    "journal articles":             "journal",
    "conference papers":            "conference",
    "book chapters":                "book",
    "technical reports":            "techreport",
    "posters":                      "conference",
    "workshop papers":              "workshop",
    "tutorials and demonstrations": "conference",
    "patents":                      "misc",
}

# Polite-pool User-Agent for CrossRef
_CROSSREF_UA = "EdgeAI-BibSync/1.0 (mailto:radu.prodan@uibk.ac.at)"

# ---------------------------------------------------------------------------
# Title normalisation / deduplication (same logic as fetch_scholar_publications)
# ---------------------------------------------------------------------------

def normalise_title(title):
    title = re.sub(r":\s+[A-Z][a-z]+.*?\bet al\.?\s*$", "", title).strip()
    return re.sub(r"[^a-z0-9]", "", title.lower())


def load_existing_bibtex(path):
    """Return (set_of_keys, set_of_normalised_titles) from a .bib file."""
    keys, titles = set(), set()
    if not os.path.exists(path):
        return keys, titles

    with open(path, encoding="utf-8") as f:
        content = f.read()

    for m in re.finditer(r"@\w+\s*\{\s*([^,\s]+)\s*,", content):
        keys.add(m.group(1))

    for tm in re.finditer(r'\btitle\s*=\s*', content, re.IGNORECASE):
        pos = tm.end()
        if pos >= len(content) or content[pos] != '{':
            continue
        depth, buf = 0, []
        for ch in content[pos:]:
            if ch == '{':
                depth += 1
                if depth > 1:
                    buf.append(ch)
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    break
                buf.append(ch)
            else:
                buf.append(ch)
        raw = ''.join(buf).replace('{', '').replace('}', '').strip()
        if raw:
            titles.add(normalise_title(raw))

    return keys, titles


# ---------------------------------------------------------------------------
# Citation-key generation
# ---------------------------------------------------------------------------

def _last_name(token):
    parts = token.strip().split()
    return parts[-1] if parts else ""


def make_key_initials(authors_str):
    """
    Derive uppercase last-name initials from an Excel-style author string
    (comma-separated "First Last" tokens).
    e.g. "Reza Farahani, Christian Timmerer, Radu Prodan" → "FTP"
    """
    # Split on ", " only when followed by an uppercase letter to avoid
    # splitting "Jr." suffixes or compound names.
    tokens = re.split(r",\s+(?=[A-Z\u00C0-\u024F])", authors_str)
    return "".join(
        _last_name(t)[0].upper() for t in tokens if _last_name(t)
    )[:6]


def make_title_slug(title):
    """CamelCase slug from the first 3 meaningful words of the title."""
    stop = {
        "a", "an", "the", "of", "in", "on", "for", "and", "to", "with",
        "from", "via", "using", "towards", "toward", "based", "is", "are",
    }
    words = re.sub(r"[^\w\s]", " ", title).split()
    slug_words = [w for w in words if w.lower() not in stop and re.match(r'[A-Za-z]', w)]
    return "".join(w.capitalize() for w in slug_words[:3])


def unique_key(base_key, existing_keys):
    key = base_key
    for ch in "abcdefghijklmnopqrstuvwxyz":
        if key not in existing_keys:
            return key
        key = base_key + ch
    return base_key + str(int(time.time()))[-4:]


# ---------------------------------------------------------------------------
# BibTeX formatting  (matches house style in edgeai.bib)
# ---------------------------------------------------------------------------

PAD = 13   # field name column width


def entry_to_bibtex(entry_type, key, fields):
    """Render a BibTeX entry in project house style."""
    lines = [f"@{entry_type}{{{key},"]
    for name, value in fields.items():
        padded = (name + " " * PAD)[:PAD]
        lines.append(f"  {padded} = {{{value}}},")
    if lines[-1].endswith(","):
        lines[-1] = lines[-1][:-1]
    lines.append("}")
    return "\n".join(lines)


def format_authors_bibtex(author_str):
    """
    Convert an Excel author string to BibTeX "Last, First and Last, First".
    Handles both "First Last, First Last" and "First Last and First Last".
    """
    and_tokens = [t.strip() for t in re.split(r"\s+and\s+", author_str) if t.strip()]
    if len(and_tokens) > 1 and all(", " in t for t in and_tokens):
        return " and ".join(and_tokens)

    author_str = author_str.replace(" and ", ", ")
    tokens = [t.strip() for t in author_str.split(",") if t.strip()]
    result = []
    for token in tokens:
        parts = token.split()
        if len(parts) >= 2:
            result.append(f"{parts[-1]}, {' '.join(parts[:-1])}")
        else:
            result.append(token)
    return " and ".join(result)


# ---------------------------------------------------------------------------
# DOI resolution
# ---------------------------------------------------------------------------

def extract_doi_from_url(url):
    """Extract a DOI from doi.org, ACM, IEEE, Springer, Elsevier URL patterns."""
    if not url:
        return None
    # doi.org/10.xxx/...
    m = re.search(r'doi\.org/([^?#\s]+)', url)
    if m:
        return m.group(1)
    # dl.acm.org/doi/10.xxx/...  or  /doi/abs/10.xxx/...
    m = re.search(r'/doi/(?:abs/|full/)?(10\.[^?#\s]+)', url)
    if m:
        return m.group(1)
    # link.springer.com/article/10.xxx/...
    m = re.search(r'springer\.com/(?:article|chapter)/(10\.[^?#\s]+)', url)
    if m:
        return m.group(1)
    return None


def _title_match(query_norm, candidate_norm):
    """True when two normalised titles are close enough to be the same paper."""
    if not query_norm or not candidate_norm:
        return False
    shorter = min(query_norm, candidate_norm, key=len)
    longer  = max(query_norm, candidate_norm, key=len)
    return (
        len(shorter) > 12
        and len(shorter) / len(longer) > 0.75
        and shorter in longer
    )


def search_doi_crossref(title):
    """Search CrossRef for a DOI matching the given title string."""
    try:
        resp = requests.get(
            "https://api.crossref.org/works",
            params={"query.title": title, "rows": 5},
            headers={"User-Agent": _CROSSREF_UA},
            timeout=20,
        )
        resp.raise_for_status()
        norm_q = normalise_title(title)
        for item in resp.json().get("message", {}).get("items", []):
            raw = (item.get("title") or [""])[0]
            if _title_match(norm_q, normalise_title(raw)):
                doi = item.get("DOI")
                if doi:
                    return doi
    except Exception as exc:
        print(f"    [CrossRef] {exc}")
    return None


def search_doi_semantic_scholar(title):
    """
    Fallback DOI lookup via Semantic Scholar API (no key required).
    """
    try:
        resp = requests.get(
            "https://api.semanticscholar.org/graph/v1/paper/search",
            params={"query": title, "fields": "title,externalIds", "limit": 5},
            timeout=20,
        )
        resp.raise_for_status()
        norm_q = normalise_title(title)
        for paper in resp.json().get("data", []):
            norm_p = normalise_title(paper.get("title") or "")
            if _title_match(norm_q, norm_p):
                doi = (paper.get("externalIds") or {}).get("DOI")
                if doi:
                    return doi
    except Exception as exc:
        print(f"    [SemanticScholar] {exc}")
    return None


def fetch_bibtex_from_doi(doi):
    """Fetch BibTeX via DOI content negotiation (doi.org)."""
    try:
        resp = requests.get(
            f"https://doi.org/{doi}",
            headers={"Accept": "application/x-bibtex"},
            timeout=20,
            allow_redirects=True,
        )
        if resp.ok and "@" in resp.text:
            return resp.text.strip()
    except Exception as exc:
        print(f"    [DOI fetch] {exc}")
    return None


# ---------------------------------------------------------------------------
# Fetched-BibTeX parser
# ---------------------------------------------------------------------------

def _parse_fetched_bibtex(bibtex_str):
    """
    Parse a single-entry BibTeX string.
    Returns a bibtexparser entry dict (field keys are lower-case strings),
    or None on failure.
    """
    if not _HAS_BIBTEXPARSER:
        return None
    try:
        parser = _BibTexParser(common_strings=True)
        parser.ignore_nonstandard_types = False
        db = bibtexparser.loads(bibtex_str, parser)
        return db.entries[0] if db.entries else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Entry construction
# ---------------------------------------------------------------------------

def _entry_type_from_category(cat_lower):
    if "journal" in cat_lower:
        return "article"
    if "book" in cat_lower:
        return "incollection"
    if "technical report" in cat_lower:
        return "techreport"
    if "patent" in cat_lower:
        return "misc"
    return "inproceedings"


def build_entry(row, existing_keys, bibtex_str=None):
    """
    Build a (key, bib_string) tuple from an Excel row dict, optionally
    enriched with field data from a fetched BibTeX string.

    The Excel data is always preferred for title/author/year (it's curated);
    the fetched BibTeX contributes venue details, DOI, pages, etc.
    """
    title    = row["title"]
    authors  = row["authors"]
    year     = row["year"]
    venue    = row["venue"] or ""
    link     = row["link"] or ""
    cat_low  = row["category"].lower()
    pubtype  = CATEGORY_TO_PUBTYPE.get(cat_low, "conference")

    initials = make_key_initials(authors)
    slug     = make_title_slug(title)
    base_key = f"{initials}{year}-{slug}"
    key      = unique_key(base_key, existing_keys)

    parsed = _parse_fetched_bibtex(bibtex_str) if bibtex_str else None
    entry_type = (
        (parsed or {}).get("ENTRYTYPE", _entry_type_from_category(cat_low))
        if parsed
        else _entry_type_from_category(cat_low)
    )
    entry_type = entry_type.lower()

    fields = {}

    # Title: double-braced for BibTeX case preservation
    fields["title"] = f"{{{title}}}"

    # Authors from Excel (always more complete than fetched BibTeX abbreviations)
    fields["author"] = format_authors_bibtex(authors)

    # Venue: fetched BibTeX takes precedence over Excel (has canonical form)
    if entry_type == "article":
        journal = (parsed or {}).get("journal") or venue
        if journal:
            fields["journal"] = journal
    elif entry_type == "techreport":
        inst = (parsed or {}).get("institution") or venue
        if inst:
            fields["institution"] = inst
    else:
        booktitle = (parsed or {}).get("booktitle") or venue
        if booktitle:
            fields["booktitle"] = booktitle

    # Bibliographic detail from fetched BibTeX
    for f in ("volume", "number", "pages", "series", "publisher", "address", "doi"):
        val = (parsed or {}).get(f)
        if val:
            if f == "pages":
                val = re.sub(r"[\u2013\u2014\-]{1,2}", "--", val)
            fields[f] = val

    fields["year"] = str(year)

    # URL: prefer curated Excel link over generic DOI redirect
    if link and "scholar.google.com" not in link:
        fields["url"] = link
    elif parsed and parsed.get("url"):
        fields["url"] = parsed["url"]

    fields["pubtype"] = pubtype

    existing_keys.add(key)
    return key, entry_to_bibtex(entry_type, key, fields)


# ---------------------------------------------------------------------------
# Excel reader
# ---------------------------------------------------------------------------

def read_excel_rows(excel_path):
    """
    Yield one dict per citable publication row across all non-'Categories' sheets.
    Expected columns (row 1 = header):
      FLD | Title | Authors | Category | Date | Venue | Peer-reviewed | Link
    """
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    for sheet_name in wb.sheetnames:
        if sheet_name.strip().lower() == "categories":
            continue
        ws = wb[sheet_name]
        for row_idx, row_vals in enumerate(ws.iter_rows(values_only=True)):
            if row_idx == 0:
                continue   # skip header

            cells = list(row_vals) + [None] * 8
            _, title, authors, category, date_cell, venue, _peer, link = cells[:8]

            if not title or not str(title).strip():
                continue
            if not category or str(category).strip().lower() not in CITABLE_CATEGORIES:
                continue
            if not authors or not str(authors).strip():
                continue

            # Extract year from date cell (datetime object or string)
            year = None
            if hasattr(date_cell, "year"):
                year = date_cell.year
            elif date_cell:
                m = re.search(r"\b(20|19)\d{2}\b", str(date_cell))
                year = int(m.group()) if m else None
            if not year:
                continue

            yield {
                "title":    str(title).strip(),
                "authors":  str(authors).strip(),
                "category": str(category).strip(),
                "year":     year,
                "venue":    str(venue).strip() if venue else "",
                "link":     str(link).strip() if link else "",
                "sheet":    sheet_name,
            }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not os.path.exists(EXCEL_FILE):
        print(f"ERROR: Excel file not found: {EXCEL_FILE}")
        sys.exit(1)

    print(f"Loading existing entries from {BIBTEX_FILE} …")
    existing_keys, existing_titles = load_existing_bibtex(BIBTEX_FILE)
    print(f"  {len(existing_keys)} existing entries.\n")

    new_entries = []

    for row in read_excel_rows(EXCEL_FILE):
        title = row["title"]
        norm  = normalise_title(title)

        if norm in existing_titles:
            print(f"[skip – exists]  {title[:65]}")
            continue

        print(f"\n[new]  {title[:65]}")
        print(f"       {row['category']}  |  {row['authors'][:55]}  |  {row['year']}")

        bibtex_str = None
        doi = extract_doi_from_url(row["link"])

        if doi:
            print(f"       DOI (from URL): {doi}")
            time.sleep(REQUEST_DELAY)
            bibtex_str = fetch_bibtex_from_doi(doi)
            if bibtex_str:
                print(f"       BibTeX fetched via DOI.")
            else:
                print(f"       DOI fetch returned nothing – building manual entry.")
        else:
            print(f"       No DOI in URL – searching CrossRef …")
            time.sleep(REQUEST_DELAY)
            doi = search_doi_crossref(title)
            if doi:
                print(f"       CrossRef DOI: {doi}")
                time.sleep(REQUEST_DELAY)
                bibtex_str = fetch_bibtex_from_doi(doi)
                if bibtex_str:
                    print(f"       BibTeX fetched via DOI.")
                else:
                    print(f"       DOI fetch failed – trying Semantic Scholar …")
            if not bibtex_str and not doi:
                print(f"       CrossRef: no match – trying Semantic Scholar …")
            if not bibtex_str:
                time.sleep(REQUEST_DELAY)
                doi = search_doi_semantic_scholar(title)
                if doi:
                    print(f"       Semantic Scholar DOI: {doi}")
                    time.sleep(REQUEST_DELAY)
                    bibtex_str = fetch_bibtex_from_doi(doi)
                    if bibtex_str:
                        print(f"       BibTeX fetched via DOI.")
                    else:
                        print(f"       DOI fetch failed – building manual entry.")
                else:
                    print(f"       Semantic Scholar: no match – building manual entry.")

        key, entry_str = build_entry(row, existing_keys, bibtex_str)
        new_entries.append(entry_str)
        existing_titles.add(norm)
        print(f"       → added as [{key}]")

    if not new_entries:
        print("\nNo new publications found. edgeai.bib is already up to date.")
        return

    with open(BIBTEX_FILE, "a", encoding="utf-8") as f:
        f.write("\n\n% === Auto-generated from Excel spreadsheet ===\n\n")
        f.write("\n\n".join(new_entries))
        f.write("\n")

    print(f"\nDone. Added {len(new_entries)} new publication(s) to {BIBTEX_FILE}.")


if __name__ == "__main__":
    main()
