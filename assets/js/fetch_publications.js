// UIBK Publications Database Integration with Real API Calls
class UIBKPublicationsAPI {
  constructor() {
    this.baseURL = 'https://lfuonline.uibk.ac.at/public/pk115_web.frame';
    this.proxyURL = 'http://localhost:8080/'; // CORS proxy - change as needed
    this.useProxy = true; // Set to false if CORS is handled server-side
    
    this.defaultParams = {
      'uebersicht_jn_in': 'J',
      'institute_id_in': '70300',
      'fsp_fp_id_in': '19870',
      'forschungszentrum_id_in': '9'
    };
  }

  buildSearchURL(params) {
    const searchParams = new URLSearchParams({
      ...this.defaultParams,
      'suche_autoren_in': params.author || '',
      'suche_titel_in': params.title || '',
      'suche_jahr_von_in': params.yearFrom || '',
      'suche_jahr_bis_in': params.yearTo || ''
    });

    // Add publication type filters
    if (params.type) {
      searchParams.append('kategorien_in', params.type);
    } else {
      // Default to journals and conferences
      searchParams.append('kategorien_in', '1');
      searchParams.append('kategorien_in', '2');
    }
    
    const fullURL = `${this.baseURL}?${searchParams.toString()}`;
    return this.useProxy ? `${this.proxyURL}${fullURL}` : fullURL;
  }

  async fetchPublications(params) {
    const url = this.buildSearchURL(params);
    console.log('Fetching from:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; PublicationsSearch/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const htmlContent = await response.text();
      return this.parseUIBKResponse(htmlContent, params);

    } catch (error) {
      console.error('Error fetching publications:', error);
      
      if (error.message.includes('CORS') || error.message.includes('NetworkError')) {
        throw new Error('CORS_ERROR');
      }
      
      throw error;
    }
  }

  parseUIBKResponse(htmlContent, searchParams) {
    // Create a DOM parser to extract publication data
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    const publications = [];
    
    try {
      // UIBK publications are typically in table rows or div containers
      // This is a generic parser - you may need to adjust based on actual HTML structure
      const publicationElements = doc.querySelectorAll('.publikation, .publication-item, tr[class*="pub"]');
      
      if (publicationElements.length === 0) {
        // Try alternative selectors
        const alternativeElements = doc.querySelectorAll('table tr, .result-item, .item');
        console.log(`Found ${alternativeElements.length} potential publication elements`);
        
        alternativeElements.forEach((element, index) => {
          const publication = this.extractPublicationData(element, index);
          if (publication) {
            publications.push(publication);
          }
        });
      } else {
        publicationElements.forEach((element, index) => {
          const publication = this.extractPublicationData(element, index);
          if (publication) {
            publications.push(publication);
          }
        });
      }

      // If no structured data found, try to extract from general content
      if (publications.length === 0) {
        console.warn('No publications found with standard selectors, attempting text parsing');
        return this.parseTextContent(htmlContent, searchParams);
      }

      return publications;
      
    } catch (error) {
      console.error('Error parsing UIBK response:', error);
      return [];
    }
  }

  extractPublicationData(element, index) {
    try {
      const textContent = element.textContent || '';
      
      // Skip if element is too short to contain publication data
      if (textContent.length < 50) {
        return null;
      }

      // Extract title (usually the longest text or in strong/b tags)
      let title = '';
      const titleElement = element.querySelector('strong, b, h1, h2, h3, h4, .title');
      if (titleElement) {
        title = titleElement.textContent.trim();
      } else {
        // Try to find title from text patterns
        const titleMatch = textContent.match(/([A-Z][^.!?]*[.!?])/);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }
      }

      // Extract year
      const yearMatch = textContent.match(/\b(20\d{2}|19\d{2})\b/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

      // Extract authors (text before title or after certain patterns)
      let authors = '';
      const authorPatterns = [
        /^([^.]+?)(?=\s*["""])/,  // Text before quotes
        /^([^.]+?)(?=\s*\d{4})/,  // Text before year
        /^([^.]+?)(?=\s*\.|$)/    // Text before first period
      ];
      
      for (const pattern of authorPatterns) {
        const match = textContent.match(pattern);
        if (match && match[1].length > 5 && match[1].length < 200) {
          authors = match[1].trim();
          break;
        }
      }

      // Extract venue/journal
      let venue = '';
      const venuePatterns = [
        /(?:in|In)\s+([^.]+)/,
        /(?:journal|Journal|conference|Conference|proceedings|Proceedings)[:\s]+([^.]+)/
      ];
      
      for (const pattern of venuePatterns) {
        const match = textContent.match(pattern);
        if (match) {
          venue = match[1].trim();
          break;
        }
      }

      // Determine publication type
      let type = 'Unknown';
      let typeCode = '0';
      
      if (textContent.toLowerCase().includes('journal')) {
        type = 'Journal Article';
        typeCode = '1';
      } else if (textContent.toLowerCase().includes('conference') || 
                 textContent.toLowerCase().includes('proceedings')) {
        type = 'Conference Paper';
        typeCode = '2';
      } else if (textContent.toLowerCase().includes('book')) {
        type = 'Book Chapter';
        typeCode = '3';
      }

      // Only return if we have at least title or authors
      if (title || authors) {
        return {
          id: `uibk_${index}_${Date.now()}`,
          title: title || 'No title available',
          authors: authors || 'Unknown authors',
          year: year,
          venue: venue || 'Unknown venue',
          type: type,
          typeCode: typeCode,
          rawText: textContent.trim()
        };
      }

      return null;
      
    } catch (error) {
      console.error('Error extracting publication data:', error);
      return null;
    }
  }

  parseTextContent(htmlContent, searchParams) {
    // Fallback text parsing method
    const publications = [];
    
    // Remove HTML tags for cleaner text parsing
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    
    // Split by potential publication separators
    const chunks = textContent.split(/\n\n|\r\n\r\n|(?=\d{4})|(?=20\d{2})/);
    
    chunks.forEach((chunk, index) => {
      if (chunk.trim().length > 50) {
        const publication = this.extractPublicationData({ textContent: chunk }, index);
        if (publication) {
          publications.push(publication);
        }
      }
    });

    return publications.slice(0, 50); // Limit results
  }
}

// Global variables
let publicationsAPI = new UIBKPublicationsAPI();
let currentPublications = [];

// Search function
async function searchPublications() {
  const params = {
    author: document.getElementById('author-search').value,
    title: document.getElementById('title-search').value,
    yearFrom: document.getElementById('year-from').value,
    yearTo: document.getElementById('year-to').value,
    type: document.getElementById('pub-type').value
  };

  // Show loading
  document.getElementById('loading-indicator').style.display = 'block';
  document.getElementById('publications-list').innerHTML = '';
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('status-message').style.display = 'none';

  try {
    const publications = await publicationsAPI.fetchPublications(params);
    currentPublications = publications;
    
    // Hide loading
    document.getElementById('loading-indicator').style.display = 'none';
    
    if (publications.length === 0) {
      showStatusMessage('No publications found matching your search criteria. The UIBK database may be temporarily unavailable or your search terms may be too specific.');
      return;
    }

    // Update statistics
    updateStatistics(publications);
    
    // Group by year and render
    renderPublications(publications);
    
  } catch (error) {
    document.getElementById('loading-indicator').style.display = 'none';
    
    if (error.message === 'CORS_ERROR') {
      showStatusMessage(`
        <strong>CORS Error Detected</strong><br>
        Unable to access UIBK database due to browser security restrictions.<br><br>
        <strong>Solutions:</strong><br>
        1. Set up a CORS proxy (see instructions above)<br>
        2. Use a browser extension to disable CORS<br>
        3. Access this page through a server that handles CORS<br><br>
        <em>This is a browser limitation, not a problem with the website.</em>
      `);
    } else {
      showStatusMessage(`Error fetching publications: ${error.message}. Please check your network connection and try again.`);
    }
    
    console.error('Search error:', error);
  }
}

function updateStatistics(publications) {
  const currentYear = new Date().getFullYear();
  const recentPubs = publications.filter(pub => pub.year >= currentYear - 5);
  const journalPubs = publications.filter(pub => pub.typeCode === '1');
  const confPubs = publications.filter(pub => pub.typeCode === '2');

  document.getElementById('total-pubs').textContent = publications.length;
  document.getElementById('recent-pubs').textContent = recentPubs.length;
  document.getElementById('journal-pubs').textContent = journalPubs.length;
  document.getElementById('conf-pubs').textContent = confPubs.length;
  
  document.getElementById('stats-bar').style.display = 'flex';
}

function renderPublications(publications) {
  // Group publications by year
  const groupedByYear = publications.reduce((acc, pub) => {
    if (!acc[pub.year]) {
      acc[pub.year] = [];
    }
    acc[pub.year].push(pub);
    return acc;
  }, {});

  // Sort years in descending order
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b - a);
  
  const listContainer = document.getElementById('publications-list');
  listContainer.innerHTML = '';

  sortedYears.forEach(year => {
    const yearSection = document.createElement('div');
    yearSection.className = 'year-section';
    
    const yearHeader = document.createElement('div');
    yearHeader.className = 'year-header';
    yearHeader.innerHTML = `
      <h3 class="year-title">${year}</h3>
      <span class="year-count">${groupedByYear[year].length} publication${groupedByYear[year].length !== 1 ? 's' : ''}</span>
    `;
    
    yearSection.appendChild(yearHeader);
    
    groupedByYear[year].forEach(pub => {
      const pubCard = createPublicationCard(pub);
      yearSection.appendChild(pubCard);
    });
    
    listContainer.appendChild(yearSection);
  });
}

function createPublicationCard(pub) {
  const card = document.createElement('div');
  card.className = 'publication-card';
  
  const links = [];
  
  // Add Google Scholar search link
  const cleanTitle = pub.title.replace(/[^\w\s]/g, '').replace(/\s+/g, '+');
  links.push(`<a href="https://scholar.google.com/scholar?q=${encodeURIComponent(cleanTitle)}" target="_blank" class="pub-link">
    <i class="fas fa-search"></i> Google Scholar
  </a>`);
  
  // Add raw text toggle if available
  if (pub.rawText && pub.rawText.length > 100) {
    links.push(`<a href="#" onclick="toggleRawText('${pub.id}')" class="pub-link">
      <i class="fas fa-code"></i> Raw Data
    </a>`);
  }
  
  card.innerHTML = `
    <div class="publication-header">
      <span class="publication-type">${pub.type}</span>
      <span class="publication-year">${pub.year}</span>
    </div>
    
    <h3 class="publication-title">${escapeHtml(pub.title)}</h3>
    
    <p class="publication-authors">${escapeHtml(pub.authors)}</p>
    
    <p class="publication-venue">${escapeHtml(pub.venue)}</p>
    
    <div class="publication-links">
      ${links.join('')}
    </div>
    
    ${pub.rawText ? `
      <div id="raw-${pub.id}" class="publication-raw" style="display: none; margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px; font-size: 0.8rem; line-height: 1.4; font-family: monospace; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">
        ${escapeHtml(pub.rawText)}
      </div>
    ` : ''}
  `;
  
  return card;
}

function toggleRawText(pubId) {
  const rawDiv = document.getElementById(`raw-${pubId}`);
  if (rawDiv) {
    if (rawDiv.style.display === 'none') {
      rawDiv.style.display = 'block';
    } else {
      rawDiv.style.display = 'none';
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showStatusMessage(message) {
  document.getElementById('status-text').innerHTML = message;
  document.getElementById('status-message').style.display = 'block';
}

// Initialize with default search when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Set up proxy detection
  detectProxy();
  
  // Auto-search on page load with default author
  if (document.getElementById('author-search').value) {
    searchPublications();
  }
});

// Proxy detection and configuration
function detectProxy() {
  // Test if CORS proxy is available
  fetch('http://localhost:8080/', { mode: 'no-cors' })
    .then(() => {
      console.log('CORS proxy detected at localhost:8080');
      publicationsAPI.useProxy = true;
      publicationsAPI.proxyURL = 'http://localhost:8080/';
    })
    .catch(() => {
      console.log('No CORS proxy detected, will attempt direct connection');
      publicationsAPI.useProxy = false;
    });
}

// Add enter key support for search inputs
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchPublications();
    }
  });
});

// Advanced parsing functions for better data extraction
class UIBKParserUtils {
  static extractDOI(text) {
    const doiPattern = /10\.\d{4,}\/[^\s]+/;
    const match = text.match(doiPattern);
    return match ? match[0] : null;
  }
  
  static extractISBN(text) {
    const isbnPattern = /ISBN[-\s]*((?:\d[-\s]*){9}[\dXx])/;
    const match = text.match(isbnPattern);
    return match ? match[1].replace(/[-\s]/g, '') : null;
  }
  
  static cleanTitle(title) {
    // Remove common prefixes and clean up title
    return title
      .replace(/^(Title:|Titel:)\s*/i, '')
      .replace(/^\d+\.\s*/, '') // Remove numbering
      .replace(/^["""''„"]\s*/, '') // Remove opening quotes
      .replace(/\s*["""''„""]$/, '') // Remove closing quotes
      .trim();
  }
  
  static extractAuthors(text) {
    // Common author patterns in academic publications
    const patterns = [
      /^([^.]+?)(?=\s*["""''„"])/,  // Authors before quoted title
      /^([^.]+?)(?=\s*\(\d{4}\))/,  // Authors before year in parentheses
      /^([^.]+?)(?=\s*\d{4})/,      // Authors before standalone year
      /([^.]+?)(?=\s*[Ii]n:)/,      // Authors before "In:"
      /([^.]+?)(?=\s*[Jj]ournal)/   // Authors before "Journal"
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1].length > 3 && match[1].length < 300) {
        let authors = match[1].trim();
        
        // Clean up common author formatting
        authors = authors.replace(/^\d+\.\s*/, ''); // Remove numbering
        authors = authors.replace(/;$/, ''); // Remove trailing semicolon
        
        // Validate that this looks like authors (contains names)
        if (this.looksLikeAuthors(authors)) {
          return authors;
        }
      }
    }
    
    return 'Unknown authors';
  }
  
  static looksLikeAuthors(text) {
    // Check if text looks like a list of author names
    const namePattern = /[A-Z][a-z]+ [A-Z][a-z]+/; // FirstName LastName pattern
    const commaPattern = /,/; // Authors often separated by commas
    const andPattern = /\band\b|\&/; // "and" or "&" between authors
    
    return namePattern.test(text) || (commaPattern.test(text) && text.length < 200);
  }
  
  static extractVenue(text) {
    const venuePatterns = [
      /[Ii]n:?\s*([^.]+?)(?:\s*\d{4}|$)/,
      /[Jj]ournal:?\s*([^.]+?)(?:\s*\d{4}|$)/,
      /[Pp]roceedings:?\s*([^.]+?)(?:\s*\d{4}|$)/,
      /[Cc]onference:?\s*([^.]+?)(?:\s*\d{4}|$)/
    ];
    
    for (const pattern of venuePatterns) {
      const match = text.match(pattern);
      if (match && match[1].trim().length > 3) {
        return match[1].trim();
      }
    }
    
    return 'Unknown venue';
  }
}

// Enhanced publication extraction with better parsing
publicationsAPI.extractPublicationData = function(element, index) {
  try {
    const textContent = element.textContent || element.innerText || '';
    
    // Skip if element is too short to contain publication data
    if (textContent.length < 30) {
      return null;
    }

    // Clean up the text
    const cleanText = textContent.replace(/\s+/g, ' ').trim();
    
    // Extract components using enhanced parsing
    const title = UIBKParserUtils.cleanTitle(
      UIBKParserUtils.extractTitle(cleanText) || 'No title available'
    );
    
    const authors = UIBKParserUtils.extractAuthors(cleanText);
    const venue = UIBKParserUtils.extractVenue(cleanText);
    
    // Extract year
    const yearMatch = cleanText.match(/\b(20\d{2}|19[89]\d)\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    // Determine publication type with better detection
    let type = 'Unknown';
    let typeCode = '0';
    
    const lowerText = cleanText.toLowerCase();
    if (lowerText.includes('journal') || lowerText.includes('transactions')) {
      type = 'Journal Article';
      typeCode = '1';
    } else if (lowerText.includes('conference') || lowerText.includes('proceedings') || 
               lowerText.includes('workshop') || lowerText.includes('symposium')) {
      type = 'Conference Paper';
      typeCode = '2';
    } else if (lowerText.includes('book chapter') || lowerText.includes('chapter')) {
      type = 'Book Chapter';
      typeCode = '3';
    } else if (lowerText.includes('book')) {
      type = 'Book';
      typeCode = '4';
    }

    // Extract DOI and other identifiers
    const doi = UIBKParserUtils.extractDOI(cleanText);
    const isbn = UIBKParserUtils.extractISBN(cleanText);

    // Only return if we have meaningful data
    if (title.length > 10 || authors !== 'Unknown authors') {
      return {
        id: `uibk_${index}_${Date.now()}`,
        title: title,
        authors: authors,
        year: year,
        venue: venue,
        type: type,
        typeCode: typeCode,
        doi: doi,
        isbn: isbn,
        rawText: cleanText
      };
    }

    return null;
    
  } catch (error) {
    console.error('Error extracting publication data:', error);
    return null;
  }
};

// Add helper method for title extraction
UIBKParserUtils.extractTitle = function(text) {
  // Try to find title in quotes first
  const quotedTitle = text.match(/["""''„"]\s*([^"""''„"]+)\s*["""''„""]/);
  if (quotedTitle) {
    return quotedTitle[1].trim();
  }
  
  // Try to find title after authors and before year
  const titlePattern = text.match(/^[^""".]+?\.\s*([^.]+?)(?:\s*\d{4})/);
  if (titlePattern && titlePattern[1].length > 10) {
    return titlePattern[1].trim();
  }
  
  // Try to find title as the longest sentence
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10);
  if (sentences.length > 0) {
    const longestSentence = sentences.reduce((a, b) => a.length > b.length ? a : b);
    if (longestSentence.length > 15) {
      return longestSentence.trim();
    }
  }
  
  return null;
};

// Add configuration for different CORS proxy services
const CORS_PROXIES = {
  local: 'http://localhost:8080/',
  allorigins: 'https://api.allorigins.win/get?url=',
  corsproxy: 'https://corsproxy.io/?',
  // Add more proxy services as backups
};

// Enhanced proxy detection with fallbacks
async function detectAndConfigureProxy() {
  for (const [name, url] of Object.entries(CORS_PROXIES)) {
    try {
      if (name === 'local') {
        await fetch(url, { mode: 'no-cors' });
        publicationsAPI.proxyURL = url;
        publicationsAPI.useProxy = true;
        console.log(`Using ${name} proxy: ${url}`);
        return;
      }
      // Test other proxies here if needed
    } catch (error) {
      console.log(`${name} proxy not available`);
    }
  }
  
  console.log('No proxy available, attempting direct connection');
  publicationsAPI.useProxy = false;
}

// Update the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
  detectAndConfigureProxy().then(() => {
    // Auto-search on page load with default author
    if (document.getElementById('author-search').value) {
      searchPublications();
    }
  });
});
