# Replace your _plugins/bibtex_reader.rb with this file
# This version requires NO external gems

module Jekyll
  class SimpleBibtexReader < Generator
    safe true
    priority :high

    def generate(site)
      # Try multiple possible locations for the BibTeX file
      possible_paths = [
        File.join(site.source, 'files', 'bibtex.bib'),
        File.join(site.source, 'bibtex.bib'),
        File.join(site.source, '_data', 'bibtex.bib')
      ]
      
      bibtex_file = possible_paths.find { |path| File.exist?(path) }
      
      if bibtex_file
        # puts "✓ Found BibTeX file: #{bibtex_file}"
        
        begin
          content = File.read(bibtex_file, encoding: 'UTF-8')
          entries = parse_bibtex_simple(content)
          
          site.data['bibtex'] = entries
          # puts "✓ Successfully loaded #{entries.size} BibTeX entries"
          
          # Debug: print entry keys
          puts "✓ Entry keys: #{entries.keys.join(', ')}"
          
        rescue => e
          puts "✗ Error reading BibTeX file: #{e.message}"
          site.data['bibtex'] = {}
        end
      else
        puts "✗ BibTeX file not found in any of these locations:"
        possible_paths.each { |path| puts "   - #{path}" }
        site.data['bibtex'] = {}
      end
    end

    private

    def parse_bibtex_simple(content)
      entries = {}
      
      # Clean up the content
      content = content.gsub(/\r\n?/, "\n")  # Normalize line endings
      
      # Find all entries starting with @
      entry_matches = content.scan(/@(\w+)\{([^,\s]+),\s*\n(.*?)\n\}/m)
      
      entry_matches.each do |type, key, fields_content|
        # Parse fields
        fields = {}
        
        # Extract field = {value} pairs
        fields_content.scan(/(\w+)\s*=\s*\{([^}]*)\}/m) do |field, value|
          # Clean up the value
          clean_value = value.strip
                           .gsub(/\s+/, ' ')           # Normalize whitespace
                           .gsub(/\\&/, '&')           # Fix escaped ampersands
                           .gsub(/\{\}/, '')           # Remove empty braces
                           .gsub(/[{}]/, '')           # Remove remaining braces
          
          fields[field.downcase] = clean_value
        end
        
        # Create standardized entry
        entry = {
          'title' => fields['title'] || '',
          'author' => fields['author'] || '',
          'year' => fields['year'] || '',
          'venue' => get_venue_from_fields(fields, type.downcase),
          'pages' => fields['pages'] || '',
          'publisher' => fields['publisher'] || '',
          'address' => fields['address'] || '',
          'url' => fields['url'] || '',
          'publisherurl' => fields['publisherurl'] || '',
          'type' => type.downcase
        }
        
        # Generate citation
        entry['citation'] = generate_citation(entry)
        
        entries[key] = entry
      end
      
      entries
    end
    
    def get_venue_from_fields(fields, type)
      case type
      when 'inproceedings'
        fields['booktitle'] || ''
      when 'article'
        fields['journal'] || ''
      when 'book'
        fields['publisher'] || ''
      else
        fields['booktitle'] || fields['journal'] || fields['venue'] || ''
      end
    end
    
    def generate_citation(entry)
      parts = []
      
      parts << entry['author'] unless entry['author'].empty?
      parts << "\"#{entry['title']}\"" unless entry['title'].empty?
      parts << entry['venue'] unless entry['venue'].empty?
      parts << entry['year'] unless entry['year'].empty?
      
      parts.join('. ') + '.'
    end
  end
end
