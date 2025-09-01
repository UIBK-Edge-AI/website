#!/usr/bin/env python
# coding: utf-8

"""
Process bibtext1.bib and generate markdown files for publications
"""

from pybtex.database.input import bibtex
import pybtex.database.input.bibtex 
from time import strptime
import string
import html
import os
import re

# HTML escape function
html_escape_table = {
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;"
}

def html_escape(text):
    """Produce entities within text."""
    return "".join(html_escape_table.get(c, c) for c in text)

def normalize_author_name(author):
    """Normalize author names for consistent matching"""
    first_names = " ".join(author.first_names)
    last_names = " ".join(author.last_names)
    return f"{first_names} {last_names}".strip()

def create_bibtex_file(bib_id, entry, output_dir):
    """Create individual BibTeX file for each publication"""
    bibtex_content = f"@{entry.type}{{{bib_id},\n"
    
    for field, value in entry.fields.items():
        bibtex_content += f"  {field} = {{{value}}},\n"
    
    # Add authors
    if 'author' in entry.persons:
        authors_str = " and ".join([
            f"{' '.join(author.first_names)} {' '.join(author.last_names)}"
            for author in entry.persons['author']
        ])
        bibtex_content += f"  author = {{{authors_str}}},\n"
    
    bibtex_content = bibtex_content.rstrip(',\n') + "\n}\n"
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Write BibTeX file
    bibtex_filename = f"{bib_id}.bib"
    bibtex_path = os.path.join(output_dir, bibtex_filename)
    
    with open(bibtex_path, 'w', encoding='utf-8') as f:
        f.write(bibtex_content)
    
    return f"/files/bibtex/{bibtex_filename}"

def process_publications():
    """Process bibtext1.bib and generate markdown publications"""
    
    # Create directories
    os.makedirs("../_publications", exist_ok=True)
    os.makedirs("../files/", exist_ok=True)
    
    # Parse the BibTeX file
    parser = bibtex.Parser(common_strings=True)
    bib_file = "bibtex1.bib"
    
    if not os.path.exists(bib_file):
        print(f"Error: {bib_file} not found!")
        print("Make sure you're running this script from the directory containing bibtext1.bib")
        return
        
    try:
        bibdata = parser.parse_file(bib_file)
    except Exception as e:
        print(f"Error parsing {bib_file}: {e}")
        return

    print(f"Found {len(bibdata.entries)} publications in {bib_file}")

    # Process each entry
    for bib_id in bibdata.entries:
        b = bibdata.entries[bib_id].fields
        entry = bibdata.entries[bib_id]
        
        try:
            # Extract publication date
            pub_year = b.get("year", "")
            if "month" in b:
                try:
                    pub_month = strptime(b["month"][:3], '%b').tm_mon
                except:
                    pub_month = 1
            else:
                pub_month = 1
            
            pub_date = f"{pub_year}-{pub_month:02d}-01"

            # Generate URL slug
            clean_title = re.sub("[^a-zA-Z0-9_-]", "", b["title"].replace(" ", "-").lower())
            url_slug = re.sub("--+", "-", clean_title)[:50]  # Limit length

            md_filename = f"{pub_date}-{url_slug}.md"
            html_filename = f"{pub_date}-{url_slug}"

            # Build citation and collect authors
            citation = ""
            authors_list = []
            author_identifiers = []
            
            # Process authors
            if "author" in entry.persons:
                for author in entry.persons["author"]:
                    author_name = normalize_author_name(author)
                    authors_list.append(author_name)
                    
                    # Create various identifier formats for matching
                    author_identifiers.append(author_name)
                    author_identifiers.append(" ".join(author.last_names))
                    
                    # Add to citation
                    first_initial = author.first_names[0][0] if author.first_names and author.first_names[0] else ""
                    citation += f" {first_initial}. {' '.join(author.last_names)},"
            
            # Remove trailing comma and add title
            citation = citation.rstrip(", ")
            title_clean = b["title"].replace("{", "").replace("}", "").replace("\\", "")
            citation += f' "{html_escape(title_clean)}"'

            # Add venue based on type
            venue = ""
            if entry.type == "inproceedings":
                venue = b.get("booktitle", "").replace("{", "").replace("}", "").replace("\\", "")
            elif entry.type == "article":
                venue = b.get("journal", "").replace("{", "").replace("}", "").replace("\\", "")
            elif entry.type == "book":
                venue = b.get("publisher", "").replace("{", "").replace("}", "").replace("\\", "")
            
            citation += f" {html_escape(venue)}, {pub_year}."

            # Create individual BibTeX file
            bibtex_url = create_bibtex_file(bib_id, entry, "../files/bibtex")

            # Generate markdown content
            md = f'---\ntitle: "{html_escape(title_clean)}"\n'
            md += f'collection: publications\n'
            md += f'permalink: /publication/{html_filename}\n'
            
            # Add excerpt if available
            if "note" in b and len(str(b["note"])) > 5:
                md += f'excerpt: \'{html_escape(b["note"])}\'\n'
            
            md += f'date: {pub_date}\n'
            md += f'venue: \'{html_escape(venue)}\'\n'
            
            # Add paper URL
            if "publisherurl" in b and len(str(b["publisherurl"])) > 5:
                md += f'paperurl: \'{b["publisherurl"]}\'\n'
            elif "url" in b and len(str(b["url"])) > 5:
                md += f'paperurl: \'{b["url"]}\'\n'
            
            # Add BibTeX URL
            md += f'bibtexurl: \'{bibtex_url}\'\n'
            
            # Add authors for filtering - IMPORTANT: This enables filtering by author
            md += f'authors:\n'
            for author_id in author_identifiers:
                md += f'  - "{author_id}"\n'
            
            md += f'citation: \'{html_escape(citation)}\'\n'
            md += '---\n\n'

            # Add content
            if "note" in b and len(str(b["note"])) > 5:
                md += f'{html_escape(b["note"])}\n\n'

            if "publisherurl" in b and len(str(b["publisherurl"])) > 5:
                md += f'[Access paper here]({b["publisherurl"]}){{:target="_blank"}}\n\n'
            elif "url" in b and len(str(b["url"])) > 5:
                md += f'[Access paper here]({b["url"]}){{:target="_blank"}}\n\n'
            else:
                clean_search_title = clean_title.replace("-", "+")
                md += f'Use [Google Scholar](https://scholar.google.com/scholar?q={html.escape(clean_search_title)}){{:target="_blank"}} for full citation\n\n'

            md += f'[Download BibTeX]({bibtex_url})\n\n'
            md += f'Recommended citation: {citation}'

            # Write markdown file
            md_filepath = os.path.join("../_publications", md_filename)
            with open(md_filepath, 'w', encoding="utf-8") as f:
                f.write(md)
            
            print(f'✓ Successfully processed {bib_id}: "{title_clean[:60]}{"..." if len(title_clean) > 60 else ""}"')
            
        except KeyError as e:
            print(f'⚠ Warning: Missing field {e} in entry {bib_id}: "{b.get("title", "Unknown")[:30]}{"..." if len(b.get("title", "")) > 30 else ""}"')
            continue
        except Exception as e:
            print(f'✗ Error processing {bib_id}: {e}')
            continue

if __name__ == "__main__":
    process_publications()
    print("\n🎉 Publication processing complete!")
    print("📁 Generated files:")
    print("   - Markdown files in _publications/")
    print("   - Individual BibTeX files in files/bibtex/")
    print("\nNext steps:")
    print("1. Update your person markdown files to remove the old publication syntax")
    print("2. The publications will now appear automatically based on author matching")