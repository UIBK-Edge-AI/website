class BibTeXParser {
  constructor() {
    this.publications = [];
  }

  // Parse BibTeX content
  parseBibTeX(bibContent) {
    const publications = [];
    
    // Regular expression to match BibTeX entries
    const entryRegex = /@(\w+)\s*\{\s*([^,]+),\s*([\s\S]*?)\n\}/g;
    
    let match;
    while ((match = entryRegex.exec(bibContent)) !== null) {
      const [, type, key, fields] = match;
      
      try {
        const publication = this.parseEntry(type, key, fields);
        if (publication) {
          publications.push(publication);
        }
      } catch (error) {
        console.warn(`Error parsing entry ${key}:`, error);
      }
    }
    
    return publications;
  }

  // Parse individual BibTeX entry
  parseEntry(type, key, fieldsContent) {
    const fields = {};
    
    // Regular expression to match field = {value} pairs
    const fieldRegex = /(\w+)\s*=\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
    
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(fieldsContent)) !== null) {
      const [, fieldName, fieldValue] = fieldMatch;
      fields[fieldName.toLowerCase()] = this.cleanFieldValue(fieldValue);
    }

    // Determine publication type
    const pubType = this.getPublicationType(type.toLowerCase());
    
    // Extract venue based on publication type
    const venue = this.getVenue(fields, type.toLowerCase());
    
    // Parse authors
    const authors = this.parseAuthors(fields.author || '');
    
    // Create standardized publication object
    return {
      id: key,
      title: fields.title || 'Untitled',
      authors: authors,
      year: parseInt(fields.year) || new Date().getFullYear(),
      venue: venue,
      type: pubType.label,
      typeCode: pubType.code,
      pages: fields.pages || '',
      volume: fields.volume || '',
      number: fields.number || '',
      publisher: fields.publisher || '',
      address: fields.address || '',
      doi: fields.doi || '',
      url: fields.publisherurl || fields.url || '',
      booktitle: fields.booktitle || '',
      journal: fields.journal || '',
      note: fields.note || ''
    };
  }

  // Clean field values (remove extra whitespace, handle special characters)
  cleanFieldValue(value) {
    return value
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/\\&/g, '&')           // Fix escaped ampersands
      .replace(/\{\}/g, '')           // Remove empty braces
      .replace(/[{}]/g, '')           // Remove remaining braces
      .replace(/\\"/g, '"')           // Fix escaped quotes
      .trim();
  }

  // Parse authors string into array
  parseAuthors(authorString) {
    if (!authorString) return '';
    
    // Split by "and" but be careful about names that might contain "and"
    const authors = authorString.split(' and ').map(author => {
      // Handle "Last, First" format
      if (author.includes(',')) {
        const [last, first] = author.split(',').map(s => s.trim());
        return `${first} ${last}`.trim();
      }
      return author.trim();
    });
    
    return authors.join(', ');
  }

  // Determine publication type and code
  getPublicationType(bibtexType) {
    const typeMap = {
      'article': { code: '1', label: 'Journal Article' },
      'inproceedings': { code: '2', label: 'Conference Paper' },
      'incollection': { code: '3', label: 'Book Chapter' },
      'inbook': { code: '3', label: 'Book Chapter' },
      'book': { code: '4', label: 'Book' },
      'phdthesis': { code: '5', label: 'PhD Thesis' },
      'mastersthesis': { code: '5', label: 'Master\'s Thesis' },
      'techreport': { code: '6', label: 'Technical Report' },
      'misc': { code: '7', label: 'Miscellaneous' }
    };
    
    return typeMap[bibtexType] || { code: '7', label: 'Other' };
  }

  // Extract venue based on publication type
  getVenue(fields, type) {
    switch (type) {
      case 'article':
        return fields.journal || '';
      case 'inproceedings':
        return fields.booktitle || '';
      case 'incollection':
      case 'inbook':
        return fields.booktitle || fields.publisher || '';
      case 'book':
        return fields.publisher || '';
      default:
        return fields.booktitle || fields.journal || fields.venue || fields.publisher || '';
    }
  }
}

class EdgeAIPublicationsAPI {
  constructor() {
    this.parser = new BibTeXParser();
    this.publications = [];
    
    // REPLACE 'website' WITH YOUR ACTUAL BASEURL
    // Examples:
    // - If your site is at yourdomain.com/edgeai → use '/edgeai'
    // - If your site is at yourdomain.com/research → use '/research'
    // - If your site is at yourdomain.com (root) → use ''
    // - If your site is at username.github.io/repository → use '/repository'
    
    const baseurl = '/website';  // <-- CHANGE THIS TO YOUR ACTUAL BASEURL
    
    this.bibFilePath = `${baseurl}/files/edgeai.bib`;
    
    console.log('🌐 Using baseurl:', baseurl);
    console.log('📚 BibTeX file path:', this.bibFilePath);
  }

  // Load and parse the BibTeX file
  async loadPublications() {
    try {
      console.log('📚 Loading publications from', this.bibFilePath);
      
      const response = await fetch(this.bibFilePath);
      if (!response.ok) {
        throw new Error(`Failed to load ${this.bibFilePath}: ${response.status} ${response.statusText}`);
      }
      
      const bibContent = await response.text();
      console.log('📄 BibTeX file loaded successfully, parsing entries...');
      
      // Parse the BibTeX content
      this.publications = this.parser.parseBibTeX(bibContent);
      
      console.log(`✅ Successfully parsed ${this.publications.length} publications`);
      return this.publications;
      
    } catch (error) {
      console.error('❌ Failed to load publications:', error);
      throw new Error(`Unable to load publications: ${error.message}`);
    }
  }

  // Filter publications based on search parameters
  filterPublications(params) {
    let filtered = [...this.publications];

    // Filter by author
    if (params.author && params.author.trim()) {
      const authorQuery = params.author.toLowerCase();
      filtered = filtered.filter(pub => 
        pub.authors.toLowerCase().includes(authorQuery)
      );
    }

    // Filter by title
    if (params.title && params.title.trim()) {
      const titleQuery = params.title.toLowerCase();
      filtered = filtered.filter(pub => 
        pub.title.toLowerCase().includes(titleQuery)
      );
    }

    // Filter by year range
    const yearFrom = parseInt(params.yearFrom) || 2020;
    const yearTo = parseInt(params.yearTo) || new Date().getFullYear();
    filtered = filtered.filter(pub => 
      pub.year >= yearFrom && pub.year <= yearTo
    );

    // Filter by type
    if (params.type && params.type !== '') {
      filtered = filtered.filter(pub => pub.typeCode === params.type);
    }

    return filtered;
  }

  // Search publications with parameters
  async searchPublications(params) {
    // Load publications if not already loaded
    if (this.publications.length === 0) {
      await this.loadPublications();
    }

    // Filter and return results
    return this.filterPublications(params);
  }
}

// Global variables
let publicationsAPI = new EdgeAIPublicationsAPI();
let currentPublications = [];

// Main search function
async function searchPublications() {
  const currentYear = new Date().getFullYear();
  const params = {
    author: document.getElementById('author-search').value,
    title: document.getElementById('title-search').value,
    yearFrom: document.getElementById('year-from').value || '2020',
    yearTo: document.getElementById('year-to').value || currentYear.toString(),
    type: document.getElementById('pub-type').value
  };

  console.log('🔍 Starting search with parameters:', params);

  // Show loading
  document.getElementById('loading-indicator').style.display = 'block';
  document.getElementById('publications-list').innerHTML = '';
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('status-message').style.display = 'none';

  try {
    const publications = await publicationsAPI.searchPublications(params);
    currentPublications = publications;
    
    // Hide loading
    document.getElementById('loading-indicator').style.display = 'none';
    
    if (publications.length === 0) {
      showStatusMessage(`
        <strong>No publications found</strong> for the specified criteria.<br>
        Try different search terms or expand the year range.
      `);
      return;
    }

    console.log(`✅ Found ${publications.length} publications`);
    updateStatistics(publications);
    renderPublications(publications);
    
    showStatusMessage(`
      <strong>✅ Search Complete:</strong> Found ${publications.length} publication${publications.length !== 1 ? 's' : ''} from the Edge AI research group.
    `);
    
  } catch (error) {
    document.getElementById('loading-indicator').style.display = 'none';
    console.error('❌ Search failed:', error);
    
    showStatusMessage(`
      <strong>❌ Search Failed:</strong> ${error.message}
    `);
  }
}

// Publication card creation
function createPublicationCard(pub) {
  const card = document.createElement('div');
  card.className = 'publication-card';
  
  const typeClass = getTypeClass(pub.typeCode);
  
  // Create title with optional DOI/URL link
  let titleElement;
  if (pub.url || pub.doi) {
    const linkUrl = pub.url || (pub.doi.startsWith('http') ? pub.doi : `https://doi.org/${pub.doi}`);
    titleElement = `
      <h3 class="publication-title">
        <a href="${linkUrl}" target="_blank" rel="noopener noreferrer">
          ${pub.title}
          <i class="fas fa-external-link-alt title-link-icon"></i>
        </a>
      </h3>`;
  } else {
    titleElement = `<h3 class="publication-title">${pub.title}</h3>`;
  }
  
  // Build metadata
  let metadata = `<strong>Authors:</strong> ${pub.authors}<br>`;
  metadata += `<strong>Year:</strong> ${pub.year}<br>`;
  metadata += `<strong>Venue:</strong> ${pub.venue}`;
  
  // Add additional details if available
  const details = [];
  if (pub.volume) details.push(`Vol. ${pub.volume}`);
  if (pub.number) details.push(`No. ${pub.number}`);
  if (pub.pages) details.push(`pp. ${pub.pages}`);
  if (pub.publisher && !pub.venue.includes(pub.publisher)) details.push(`Publisher: ${pub.publisher}`);
  
  if (details.length > 0) {
    metadata += '<br><strong>Details:</strong> ' + details.join(', ');
  }
  
  card.innerHTML = `
    <div class="publication-header">
      <span class="publication-type ${typeClass}">${pub.type.toUpperCase()}</span>

    </div>
    ${titleElement}
    <div class="publication-meta">${metadata}</div>
  `;
  
  return card;
}

function getTypeClass(typeCode) {
  const typeClasses = {
    '1': 'type-journal',
    '2': 'type-conference', 
    '3': 'type-chapter',
    '4': 'type-book',
    '5': 'type-thesis',
    '6': 'type-report',
    '7': 'type-other'
  };
  return typeClasses[typeCode] || 'type-other';
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
  // Group by year
  const groupedByYear = publications.reduce((acc, pub) => {
    if (!acc[pub.year]) {
      acc[pub.year] = [];
    }
    acc[pub.year].push(pub);
    return acc;
  }, {});

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
    
    const sortedPubs = groupedByYear[year].sort((a, b) => 
      a.title.localeCompare(b.title)
    );
    
    sortedPubs.forEach(pub => {
      const pubCard = createPublicationCard(pub);
      yearSection.appendChild(pubCard);
    });
    
    listContainer.appendChild(yearSection);
  });
}

function showStatusMessage(message) {
  document.getElementById('status-text').innerHTML = message;
  document.getElementById('status-message').style.display = 'block';
}

// Auto-load publications on page load
async function initializePublications() {
  try {
    console.log('🚀 Edge AI Publications System - Loading from BibTeX file');
    
    // Show all publications by default
    setTimeout(searchPublications, 500);
  } catch (error) {
    console.error('Failed to initialize publications:', error);
    showStatusMessage(`
      <strong>❌ Initialization Failed:</strong> ${error.message}
    `);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const currentYear = new Date().getFullYear();
  
  // Set default values
  const yearFromInput = document.getElementById('year-from');
  const yearToInput = document.getElementById('year-to');
  
  if (yearFromInput) {
    yearFromInput.value = '2020';
    yearFromInput.min = '2020';
    yearFromInput.max = currentYear.toString();
  }
  
  if (yearToInput) {
    yearToInput.value = currentYear.toString();
    yearToInput.min = '2020';
    yearToInput.max = currentYear.toString();
  }
  
  // Add enter key support
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchPublications();
      }
    });
  });
  
  // Initialize the publications system
  initializePublications();
});
