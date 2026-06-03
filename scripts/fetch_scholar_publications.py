#!/usr/bin/env python3
"""
Fetch publications from Google Scholar andappend
new entries to files/edgeai.bib.

Each _team/*.md file must have:
  scholar_id: <Google Scholar user ID>        # e.g. "ABC123XYZ"
  NOTE: copy only the ID from the URL, not the full URL.
        scholar.google.com/citations?user=ABC123XYZ  →  ABC123XYZ
        Do NOT include &hl=en or any other URL parameters.

The script reads each member's UIBK start year from their positions list
(the earliest position whose inst or inst_uri contains "uibk" or
"University of Innsbruck") and only imports publications from
max(EARLIEST_YEAR, uibk_start_year) onward.

Usage (local):
  # Activate the project venv first:
  source .venv/bin/activate
  python scripts/fetch_scholar_publications.py

  # Or run directly with the venv interpreter:
  .venv/bin/python3 scripts/fetch_scholar_publications.py

  # Optional – set SerpAPI key for more reliable Scholar access:
  export SERPAPI_KEY=your_serpapi_key
  .venv/bin/python3 scripts/fetch_scholar_publications.py

In GitHub Actions the workflow installs dependencies automatically.
"""

import os
import re
import sys
import time
import frontmatter

TEAM_DIR      = "_team"
BIBTEX_FILE   = "files/edgeai.bib"
PERSONAL_BIB  = "files/bibtex.bib"   # personal/member bib — entries are synced into edgeai.bib
REQUEST_DELAY = 4          # seconds between Scholar requests

# Global lower bound: never import publications older than this year.
# Per-member cutoff = max(EARLIEST_YEAR, uibk_start_year).
# Former members still keep all previously-added entries (we only append).
EARLIEST_YEAR = 2025

UIBK_MARKERS = [
    "uibk.ac.at",
    "university of innsbruck",
    "universität innsbruck",
]

# ---------------------------------------------------------------------------
#finding UIBK start year
# ---------------------------------------------------------------------------

def get_uibk_start_year(positions):
    """Return the earliest `from` year of a UIBK position, or None."""
    uibk_years = []
    for pos in (positions or []):
        inst_uri = str(pos.get("inst_uri", "")).lower()
        inst     = str(pos.get("inst", "")).lower()
        combined = inst_uri + " " + inst
        if any(marker in combined for marker in UIBK_MARKERS):
            try:
                uibk_years.append(int(pos["from"]))
            except (KeyError, ValueError):
                pass
    return min(uibk_years) if uibk_years else None


# ---------------------------------------------------------------------------
# BibTeX key generation
# ---------------------------------------------------------------------------
"""Return the uppercased first letter of the last name in a token."""
def _last_name_initial(author_token):

    parts = author_token.strip().split()
    return parts[-1][0].upper() if parts else ""


def make_initials(author_str):
    """
    Derive initials string from a scholarly author string.
    scholarly may return:  "First Last, First Last"
                       or  "First Last and First Last"
    Caps at 6 characters.
    """
    author_str = author_str.replace(" and ", ", ")
    tokens = [t.strip() for t in author_str.split(",") if t.strip()]
    return "".join(_last_name_initial(t) for t in tokens)[:6]


def make_venue_abbr(venue):
    """
    Best-effort venue abbreviation.
    Prefers an acronym in parentheses: 'Conference on X (ICML)' → 'ICML'.
    Falls back to initials of capitalised words.
    """
    if not venue:
        return "MISC"
    m = re.search(r"\(([A-Z][A-Z0-9\-]{1,9})\)", venue)
    if m:
        return m.group(1)
    stop = {"the", "of", "in", "and", "on", "for", "a", "an", "at", "to",
            "with", "its", "from", "via", "using"}
    abbr = "".join(
        w[0].upper() for w in venue.split()
        if w and w[0].isupper() and w.lower() not in stop
    )
    return abbr[:6] or "MISC"


def unique_key(base_key, existing_keys):
    """Append 'a', 'b', … until the key is not in existing_keys."""
    key = base_key
    for ch in "abcdefghijklmnopqrstuvwxyz":
        if key not in existing_keys:
            return key
        key = base_key + ch
    return base_key + str(int(time.time()))[-4:]


# ---------------------------------------------------------------------------
# Helpers – String / title normalisation
# ---------------------------------------------------------------------------

def normalise_title(title):
    """
    Lowercase + strip punctuation/spaces for deduplication.
    Also strips the trailing ': First et al.' suffix that Google Scholar
    sometimes appends to titles (e.g. 'A review: P. Czarnul et al.'),
    so near-duplicates are correctly detected.
    """
    # Strip trailing ": First et al." or ": Surname et al" appended by Scholar
    title = re.sub(r":\s+[A-Z][a-z]+.*?\bet al\.?\s*$", "", title).strip()
    return re.sub(r"[^a-z0-9]", "", title.lower())


def _strip_bibtex_braces(value):
    """Strip leading/trailing { } used in BibTeX values."""
    return value.strip("{}").strip()


# ---------------------------------------------------------------------------
# Helpers – author reformatting
# ---------------------------------------------------------------------------

def format_authors_bibtex(author_str):
    """
    Convert scholarly author string to BibTeX  "Last, First and Last, First".
    scholarly: "First Last, First Last"  or  "First Last and First Last"

    If the input is already in BibTeX "Last, First and Last, First" form
    (detected by splitting on " and " and checking every token has a comma),
    it is returned unchanged.
    """
    and_tokens = [t.strip() for t in re.split(r"\s+and\s+", author_str) if t.strip()]
    # Detect "Last, First and Last, First" BibTeX format:
    # multiple authors separated by " and " where every token has ", "
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
# BibTeX entry formatter (house style)
# ---------------------------------------------------------------------------

PAD = 13   # field name column width (matches house style)

def entry_to_bibtex(entry_type, key, fields):
    """
    Render a BibTeX entry in the project house style:
      @type{key,
        fieldname      = {value},
        ...
      }
    """
    lines = [f"@{entry_type}{{{key},"]
    for name, value in fields.items():
        padded = (name + " " * PAD)[:PAD]
        lines.append(f"  {padded} = {{{value}}},")
    # Remove trailing comma from last field (optional but tidy)
    if lines[-1].endswith(","):
        lines[-1] = lines[-1][:-1]
    lines.append("}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Scholarly publication → BibTeX dict
# ---------------------------------------------------------------------------

def _clean_venue(venue):
    """
    Strip trailing page/volume info from SerpAPI venue strings.
    e.g. "EIRP Proceedings 20 (1), 282-290" → "EIRP Proceedings"
         "IEEE Transactions on Foo 15 (3), 1-8" → "IEEE Transactions on Foo"
    """
    if not venue:
        return venue
    # Strip trailing ", PAGES" pattern: ", 282-290" or ", 1–9"
    venue = re.sub(r",\s*\d+[\u2013\-]\d+$", "", venue).strip()
    # Strip trailing " VOLUME (ISSUE), PAGES" pattern:  " 20 (1), 282-290"
    venue = re.sub(r"\s+\d+\s*\(\d+\),?\s*\d*[\u2013\-]?\d*$", "", venue).strip()
    # Strip trailing year if present: "IEEE Conference, 2025"
    venue = re.sub(r",?\s*(20|19)\d{2}$", "", venue).strip()
    return venue


def _arxiv_id_from_venue(venue):
    """Extract arXiv ID if venue string indicates an arXiv preprint."""
    if not venue:
        return None
    m = re.search(r"arXiv[:\s]+(\d{4}\.\d{4,5})", venue, re.IGNORECASE)
    return m.group(1) if m else None


def pub_to_bibtex(pub, existing_keys, existing_titles):
    """
    Convert a scholarly publication object to a (key, entry_str) tuple.
    Returns None if the publication should be skipped.
    """
    bib = pub.get("bib", {})

    title    = _strip_bibtex_braces(bib.get("title", "")).strip()
    year_raw = bib.get("pub_year", "")
    authors  = bib.get("author", "")
    venue    = bib.get("venue", "") or bib.get("journal", "") or bib.get("conference", "")

    if not title or not year_raw:
        return None

    norm = normalise_title(title)
    if norm in existing_titles:
        return None            # already in bibtex.bib or edgeai.bib

    year = str(year_raw).strip()

    # --- Detect arXiv preprints – skip, not peer-reviewed ---
    arxiv_id = _arxiv_id_from_venue(venue)
    is_arxiv = bool(arxiv_id) or "arxiv preprint" in venue.lower()
    if is_arxiv:
        return None

    # --- Clean venue (remove page numbers, volume etc. embedded in venue) ---
    venue_clean = _clean_venue(venue)

    # --- key ---
    initials    = make_initials(authors)
    venue_abbr  = make_venue_abbr(venue_clean)
    base_key    = f"{initials}{year}-{venue_abbr}"
    key         = unique_key(base_key, existing_keys)

    # --- entry type & fields ---
    if any(w in venue_clean.lower() for w in
             ["journal", "transactions", "letters", "magazine", "review",
              "acm computing", "records", "sigm"]):
        entry_type = "article"
    else:
        entry_type = "inproceedings"

    fields = {}
    fields["title"]  = f"{{{title}}}"
    # Use pre-formatted BibTeX authors when available (already "Last, First and")
    bibtex_author = pub.get("bibtex_author", "")
    fields["author"] = bibtex_author if bibtex_author else format_authors_bibtex(authors)

    if entry_type == "article":
        if venue_clean:
            fields["journal"] = f"{{{venue_clean}}}"
    else:
        if venue_clean:
            fields["booktitle"] = f"{{{venue_clean}}}"

    pages = bib.get("pages", "")
    if pages:
        fields["pages"] = pages.replace("\u2013", "--").replace("-", "--")

    fields["year"] = year

    # Only use pub_url if it is NOT a Google Scholar URL
    pub_url = pub.get("pub_url", "") or pub.get("eprint_url", "")
    if pub_url and "scholar.google.com" not in pub_url:
        fields["publisherurl"] = pub_url

    # pubtype inference
    if entry_type == "article":
        fields["pubtype"] = "journal"
    else:
        fields["pubtype"] = "conference"

    existing_keys.add(key)
    existing_titles.add(norm)

    return key, entry_to_bibtex(entry_type, key, fields)


# ---------------------------------------------------------------------------
# Clean edgeai.bib  (remove personal-bib duplicates + internal duplicates)
# ---------------------------------------------------------------------------

def _split_bib_blocks(content):
    """
    Split raw BibTeX content into a list of raw entry strings.
    Comment lines and blank lines between entries are discarded.
    """
    blocks = []
    for block in re.split(r'(?=@\w+\s*\{)', content):
        block = block.strip()
        if block and not block.startswith('%'):
            blocks.append(block)
    return blocks


def clean_edgeai_bib(target_path, personal_path):
    """
    Rewrite target_path (edgeai.bib) so that:
      1. Any entry whose normalised title also appears in personal_path
         (bibtex.bib) is removed.
      2. Any internal duplicate title (keeping first occurrence) is removed.

    Prints a summary of what was removed.
    Returns the number of entries removed.
    """
    if not os.path.exists(target_path):
        return 0

    # Load personal bib titles
    _, personal_titles = load_existing_bibtex(personal_path) if os.path.exists(personal_path) else (set(), set())

    with open(target_path, encoding="utf-8") as f:
        raw = f.read()

    # Preserve the leading comment header (everything before the first @)
    header_match = re.match(r'^(.*?)(?=@\w+\s*\{)', raw, re.DOTALL)
    header = header_match.group(1) if header_match else ""

    blocks  = _split_bib_blocks(raw)
    kept    = []
    seen_titles = set()
    removed = 0

    for block in blocks:
        title_norm = ""
        title_m = re.search(r'\btitle\s*=\s*', block, re.IGNORECASE)
        if title_m:
            pos = title_m.end()
            if pos < len(block) and block[pos] == '{':
                depth, buf = 0, []
                for ch in block[pos:]:
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
                title_str = ''.join(buf).replace('{', '').replace('}', '').strip()
                title_norm = normalise_title(title_str)

        key_m = re.match(r'@\w+\s*\{\s*([^,\s]+)\s*,', block)
        key   = key_m.group(1) if key_m else "?"

        if title_norm and title_norm in personal_titles:
            print(f"  [clean – in bibtex.bib]  {key}")
            removed += 1
            continue

        if title_norm and title_norm in seen_titles:
            print(f"  [clean – duplicate]      {key}")
            removed += 1
            continue

        if title_norm:
            seen_titles.add(title_norm)
        kept.append(block)

    if removed == 0:
        print(f"[clean] edgeai.bib is already clean – nothing removed.\n")
        return 0

    with open(target_path, "w", encoding="utf-8") as f:
        if header.strip():
            f.write(header.rstrip() + "\n\n")
        f.write("\n\n".join(kept))
        f.write("\n")

    print(f"[clean] Removed {removed} entry/entries from {target_path}.\n")
    return removed


# ---------------------------------------------------------------------------
# Load existing bibtex.bib – extract known keys and titles
# ---------------------------------------------------------------------------

def load_existing_bibtex(path):
    """Return (set_of_keys, set_of_normalised_titles)."""
    keys   = set()
    titles = set()
    if not os.path.exists(path):
        return keys, titles

    with open(path, encoding="utf-8") as f:
        content = f.read()

    # Extract citation keys:  @type{KEY,
    for m in re.finditer(r"@\w+\s*\{\s*([^,\s]+)\s*,", content):
        keys.add(m.group(1))

    # Extract titles using brace-counting so nested braces (e.g. {5G}, {{Title}})
    # are handled correctly.  A simple [^}]+ regex stops at the first inner },
    # causing partial titles that fail deduplication checks.
    for tm in re.finditer(r'\btitle\s*=\s*', content, re.IGNORECASE):
        pos = tm.end()
        if pos >= len(content) or content[pos] != '{':
            continue
        depth, buf = 0, []
        for ch in content[pos:]:
            if ch == '{':
                depth += 1
                if depth > 1:       # keep inner content, skip outermost brace
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
# SerpAPI fetch  (used when SERPAPI_KEY is set)
# SerpAPI has a native Google Scholar Author endpoint – no scraping needed.
# ---------------------------------------------------------------------------

def _serpapi_fetch_pubs(scholar_id, api_key):
    """
    Fetch all publications for an author via SerpAPI's Google Scholar Author API.
    Returns a list of dicts in the same shape as scholarly's pub objects so
    pub_to_bibtex() can consume them without modification.
    API docs: https://serpapi.com/google-scholar-author-api
    """
    import requests

    results = []
    start   = 0

    while True:
        params = {
            "engine":    "google_scholar_author",
            "author_id": scholar_id,
            "api_key":   api_key,
            "num":       100,
            "start":     start,
            "sort":      "pubdate",
        }
        resp = requests.get("https://serpapi.com/search.json", params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        articles = data.get("articles", [])
        if not articles:
            break

        for article in articles:
            # Extract year – SerpAPI puts it in article["year"] as int,
            # or sometimes buried in article["publication"] as "..., 2025"
            year = article.get("year")
            if not year:
                pub_str = article.get("publication", "")
                m = re.search(r"\b(20\d{2}|19\d{2})\b", pub_str)
                year = int(m.group(1)) if m else None

            # Parse venue and journal/conference from "publication" field
            # e.g. "IEEE Transactions on Foo, 2025" or "ICARC 2024"
            pub_str  = article.get("publication", "")
            venue    = re.sub(r",?\s*(20|19)\d{2}$", "", pub_str).strip()

            # Fetch full author list via per-article citation API
            # SerpAPI's author endpoint only gives abbreviated authors like
            # "A. Author, B. Author" which can't be expanded without this call.
            authors = article.get("authors", "")
            citation_id = article.get("citation_id", "")
            if citation_id:
                try:
                    cit_resp = requests.get(
                        "https://serpapi.com/search.json",
                        params={"engine": "google_scholar_citation",
                                "citation_id": citation_id,
                                "api_key": api_key},
                        timeout=30,
                    )
                    if cit_resp.ok:
                        cit_data   = cit_resp.json()
                        cit_links  = cit_data.get("citation", {})

                        # Prefer BibTeX format — gives "Last, First and Last, First"
                        # which is already correct for BibTeX author fields.
                        bibtex_text = cit_links.get("BibTeX", cit_links.get("bibtex", ""))
                        bibtex_auths = ""
                        if bibtex_text:
                            am = re.search(
                                r'\bauthor\s*=\s*[{"](.*?)[}"]',
                                bibtex_text, re.IGNORECASE | re.DOTALL,
                            )
                            if am:
                                bibtex_auths = am.group(1).strip()

                        if bibtex_auths:
                            # Store separately so pub_to_bibtex skips format_authors_bibtex
                            article["_bibtex_author"] = bibtex_auths
                        else:
                            # Fallback: MLA format; split before the first quoted title
                            # ("Surname, First, et al. \"Title...\"" → author part)
                            mla_text = cit_links.get("MLA", cit_links.get("mla", ""))
                            if mla_text:
                                full_auths = re.split(r'\.[\s\u201c\u2018\"]', mla_text)[0].strip()
                                if full_auths:
                                    authors = full_auths
                except Exception as cit_err:
                    pass  # keep abbreviated authors on error
                time.sleep(0.5)

            # article.get('link') is often a Google Scholar URL – store separately
            # so pub_to_bibtex() can decide whether to use it
            article_link = article.get("link", "")

            # Build a scholarly-compatible pub dict
            results.append({
                "bib": {
                    "title":    article.get("title", ""),
                    "author":   authors,
                    "pub_year": str(year) if year else "",
                    "venue":    venue,
                    "abstract": article.get("description", ""),
                },
                # Pre-formatted BibTeX authors ("Last, First and ...") when available
                "bibtex_author": article.get("_bibtex_author", ""),
                "pub_url": article_link,
            })

        # Pagination
        next_page = data.get("serpapi_pagination", {}).get("next")
        if not next_page or len(articles) < 100:
            break
        start += 100
        time.sleep(1)

    return results


# ---------------------------------------------------------------------------
# Scholarly fetch  (fallback when no SERPAPI_KEY)
# ---------------------------------------------------------------------------

def _scholarly_fetch_pubs(scholar_id):
    """
    Fetch publications via the scholarly library (scrapes Google Scholar).
    Returns a list of scholarly pub dicts, or None on failure.
    """
    try:
        from scholarly import scholarly as _scholarly
    except ImportError:
        print("ERROR: 'scholarly' not installed. Run:  pip install scholarly")
        sys.exit(1)

    # Try free proxies to avoid immediate rate-limiting
    try:
        from scholarly import ProxyGenerator
        pg = ProxyGenerator()
        ok = pg.FreeProxies()
        if ok:
            _scholarly.use_proxy(pg)
        else:
            print("  FreeProxies init returned False – trying direct access.")
    except Exception as proxy_err:
        print(f"  FreeProxies unavailable ({proxy_err}) – trying direct access.")

    for attempt in range(1, 4):
        try:
            author = _scholarly.search_author_id(scholar_id)
            time.sleep(REQUEST_DELAY)
            _scholarly.fill(author, sections=["publications"])
            pubs = author.get("publications", [])
            # Fill each pub for full metadata
            filled = []
            for pub in pubs:
                try:
                    time.sleep(REQUEST_DELAY)
                    _scholarly.fill(pub)
                except Exception:
                    pass
                filled.append(pub)
            return filled
        except Exception as exc:
            wait = REQUEST_DELAY * (2 ** attempt)
            print(f"  [attempt {attempt}/3 failed] {exc}")
            if attempt < 3:
                print(f"  Retrying in {wait}s …")
                time.sleep(wait)

    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    serpapi_key = os.environ.get("SERPAPI_KEY", "").strip()

    if serpapi_key:
        print("SERPAPI_KEY found – using SerpAPI Google Scholar Author API.\n")
        fetch_mode = "serpapi"
    else:
        print("No SERPAPI_KEY set – using scholarly + FreeProxies (may hit rate limits).")
        print("Tip: export SERPAPI_KEY=<your_key>  for reliable access.\n")
        fetch_mode = "scholarly"

    # --- Step 1: clean edgeai.bib (remove bibtex.bib overlaps + duplicates) ---
    print("=== Step 1: Cleaning edgeai.bib ===")
    clean_edgeai_bib(BIBTEX_FILE, PERSONAL_BIB)

    # Reload after cleaning so the exclusion sets are accurate
    existing_keys, existing_titles = load_existing_bibtex(BIBTEX_FILE)
    print(f"edgeai.bib now has {len(existing_keys)} entries.")

    # Load personal bib titles as exclusions so Scholar fetch never re-adds them
    _, personal_titles = load_existing_bibtex(PERSONAL_BIB)
    existing_titles.update(personal_titles)
    print(f"Loaded {len(personal_titles)} titles from {PERSONAL_BIB} as exclusions.\n")

    new_entries = []

    for filename in sorted(os.listdir(TEAM_DIR)):
        if not filename.endswith(".md"):
            continue

        filepath = os.path.join(TEAM_DIR, filename)
        post     = frontmatter.load(filepath)
        meta     = post.metadata

        scholar_id = str(meta.get("scholar_id", "")).strip()
        # Strip URL query parameters accidentally pasted, e.g. "ABC123&hl=en"
        scholar_id = scholar_id.split("&")[0].split("?")[0].strip()
        if not scholar_id:
            print(f"[{filename}] No scholar_id – skipping.")
            continue

        positions = meta.get("positions", [])
        uibk_year = get_uibk_start_year(positions)
        name      = meta.get("title", filename)

        if uibk_year is None:
            print(f"[{filename}] Could not determine UIBK start year – skipping.")
            continue

        min_year = max(EARLIEST_YEAR, uibk_year)
        print(f"Processing: {name}  (UIBK since {uibk_year}, fetching from {min_year})")

        # --- fetch ---
        if fetch_mode == "serpapi":
            try:
                pubs = _serpapi_fetch_pubs(scholar_id, serpapi_key)
            except Exception as exc:
                print(f"  [ERROR] SerpAPI request failed: {exc}")
                continue
        else:
            pubs = _scholarly_fetch_pubs(scholar_id)
            if pubs is None:
                print(f"  [ERROR] Could not fetch author after 3 attempts – skipping.")
                continue

        print(f"  Total publications on Scholar: {len(pubs)}")

        member_added = 0
        for pub in pubs:
            bib      = pub.get("bib", {})
            year_raw = bib.get("pub_year")
            if not year_raw:
                continue
            try:
                pub_year = int(year_raw)
            except ValueError:
                continue

            if pub_year < min_year:
                continue

            result = pub_to_bibtex(pub, existing_keys, existing_titles)
            if result is None:
                print(f"  [skip – exists] {bib.get('title', '')[:55]}")
                continue

            key, entry_str = result
            new_entries.append(entry_str)
            member_added += 1
            print(f"  [added] {key}  –  {bib.get('title', '')[:55]}")

        print(f"  → {member_added} new entries from {name}\n")

    # --- Step 2 write results ---
    # NOTE: We only ever APPEND to edgeai.bib. Entries from members who have
    # left the team are preserved; removing their _team/*.md file (or clearing
    # their scholar_id) simply stops NEW publications from being fetched for
    # them — it does not touch anything already in the file.
    if not new_entries:
        print("No new Scholar publications found. edgeai.bib unchanged by Scholar fetch.")
        return

    with open(BIBTEX_FILE, "a", encoding="utf-8") as f:
        f.write("\n\n% === Auto-generated from Google Scholar ===\n\n")
        f.write("\n\n".join(new_entries))
        f.write("\n")

    print(f"\nDone. Added {len(new_entries)} new publication(s) from Scholar to {BIBTEX_FILE}.")


if __name__ == "__main__":
    main()
