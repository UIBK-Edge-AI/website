// UIBK Publications - Production Solution
// This version provides both a working demo with sample data and instructions for production setup

class UIBKPublicationsAPI {
  constructor() {
    this.baseURL = 'https://lfuonline.uibk.ac.at/public/pk115_web.frame';
    this.useMockData = true; // Set to false when backend is ready
    this.defaultParams = {
      'uebersicht_jn_in': 'J',
      'institute_id_in': '70300',
      'fsp_fp_id_in': '19870',
      'forschungszentrum_id_in': '9'
    };
  }

  // Mock data for demonstration (replace with real backend call)
  getMockPublications(params) {
    console.log('📊 Using mock data for demonstration');
    
    // Sample publications based on typical CS research
    const mockData = [
      {
        id: 'mock_1',
        title: 'Edge Computing for IoT: A Comprehensive Survey of Architectures and Applications',
        authors: 'Mueller, A., Schmidt, B., Weber, C.',
        year: 2024,
        venue: 'IEEE Transactions on Cloud Computing',
        type: 'Journal Article',
        typeCode: '1',
        doi: '10.1109/TCC.2024.001',
        pages: '145-162',
        volume: '12',
        number: '3'
      },
      {
        id: 'mock_2', 
        title: 'Distributed Machine Learning at the Edge: Challenges and Opportunities',
        authors: 'Prodan, R., Fischer, M., Huber, T.',
        year: 2024,
        venue: 'Proceedings of IEEE International Conference on Edge Computing',
        type: 'Conference Paper',
        typeCode: '2',
        doi: '10.1109/EDGE.2024.002',
        pages: '89-96'
      },
      {
        id: 'mock_3',
        title: 'Energy-Efficient Resource Allocation in Cloud Data Centers',
        authors: 'Kofler, S., Bauer, L., Mayer, K.',
        year: 2023,
        venue: 'ACM Transactions on Computer Systems',
        type: 'Journal Article', 
        typeCode: '1',
        doi: '10.1145/3588432',
        pages: '1-28',
        volume: '41',
        number: '2'
      },
      {
        id: 'mock_4',
        title: 'Federated Learning for Privacy-Preserving Healthcare Analytics',
        authors: 'Steiner, J., Wolf, P., Brunner, M.',
        year: 2023,
        venue: 'International Conference on Machine Learning',
        type: 'Conference Paper',
        typeCode: '2',
        pages: '2341-2350'
      },
      {
        id: 'mock_5',
        title: 'Blockchain-Based Identity Management for IoT Devices',
        authors: 'Gruber, H., Eder, F., Moser, R.',
        year: 2023,
        venue: 'IEEE Internet of Things Journal',
        type: 'Journal Article',
        typeCode: '1',
        doi: '10.1109/JIOT.2023.003',
        volume: '10',
        number: '8',
        pages: '6789-6801'
      },
      {
        id: 'mock_6',
        title: 'Quantum Computing Applications in Cryptography: Current State and Future Directions',
        authors: 'Reiter, M., Hauser, A., Koch, S.',
        year: 2022,
        venue: 'Nature Quantum Information',
        type: 'Journal Article',
        typeCode: '1',
        doi: '10.1038/s41534-022-00567-8',
        volume: '8',
        number: '45'
      },
      {
        id: 'mock_7',
        title: 'Automated Software Testing Using Machine Learning Techniques',
        authors: 'Pichler, C., Gasser, V., Hofer, D.',
        year: 2022,
        venue: 'International Conference on Software Engineering',
        type: 'Conference Paper',
        typeCode: '2',
        pages: '456-465'
      },
      {
        id: 'mock_8',
        title: 'Sustainable Computing: Green Algorithms for Large-Scale Data Processing',
        authors: 'Zöchling, L., Kirchner, B., Wallner, G.',
        year: 2022,
        venue: 'ACM Computing Surveys',
        type: 'Journal Article',
        typeCode: '1',
        doi: '10.1145/3517818',
        volume: '55',
        number: '1',
        pages: '1-35'
      },
      {
        id: 'mock_9',
        title: 'Real-Time Stream Processing for Big Data Analytics',
        authors: 'Berger, T., Maier, U., Huber, N.',
        year: 2021,
        venue: 'IEEE Big Data Conference',
        type: 'Conference Paper',
        typeCode: '2',
        pages: '1234-1241'
      },
      {
        id: 'mock_10',
        title: 'Deep Learning for Computer Vision: Advances in Object Detection and Recognition',
        authors: 'Schwarz, E., Weiss, M., Braun, K.',
        year: 2021,
        venue: 'Computer Vision and Image Understanding',
        type: 'Journal Article',
        typeCode: '1',
        doi: '10.1016/j.cviu.2021.103156',
        volume: '208',
        pages: '103156'
      },
      {
        id: 'mock_11',
        title: 'Microservices Architecture Patterns for Scalable Web Applications',
        authors: 'Rainer, P., Fuchs, S., Horvath, A.',
        year: 2021,
        venue: 'IEEE Software',
        type: 'Journal Article',
        typeCode: '1',
        doi: '10.1109/MS.2021.3067940',
        volume: '38',
        number: '3',
        pages: '45-52'
      },
      {
        id: 'mock_12',
        title: 'Human-Computer Interaction in Virtual and Augmented Reality Environments',
        authors: 'Lang, I., Peer, C., Stadler, W.',
        year: 2020,
        venue: 'ACM Transactions on Computer-Human Interaction',
        type: 'Journal Article',
        typeCode: '1',
        doi: '10.1145/3386167',
        volume: '27',
        number: '4',
        pages: '1-29'
      }
    ];

    // Filter by search parameters
    let filtered = mockData;

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

    console.log(`📊 Mock data: ${mockData.length} total, ${filtered.length} after filtering`);
    return filtered;
  }

  buildSearchURL(params) {
    const currentYear = new Date().getFullYear();
    const searchParams = new URLSearchParams({
      ...this.defaultParams,
      'suche_autoren_in': params.author || '',
      'suche_titel_in': params.title || '',
      'suche_jahr_von_in': params.yearFrom || '2020',
      'suche_jahr_bis_in': params.yearTo || currentYear.toString()
    });

    if (params.type) {
      searchParams.append('kategorien_in', params.type);
    } else {
      searchParams.append('kategorien_in', '1');
      searchParams.append('kategorien_in', '2');
    }
    
    return `${this.baseURL}?${searchParams.toString()}`;
  }

  async fetchPublications(params) {
    if (this.useMockData) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.getMockPublications(params);
    }

    // Production implementation - call your backend endpoint
    try {
      const response = await fetch('/api/uibk-publications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      return data.publications || [];
    } catch (error) {
      console.error('Backend fetch failed:', error);
      throw new Error(`Unable to fetch publications: ${error.message}`);
    }
  }
}

// Global variables
let publicationsAPI = new UIBKPublicationsAPI();
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
    const publications = await publicationsAPI.fetchPublications(params);
    currentPublications = publications;
    
    // Hide loading
    document.getElementById('loading-indicator').style.display = 'none';
    
    if (publications.length === 0) {
      showStatusMessage(`
        <strong>No publications found</strong> for the period ${params.yearFrom}-${params.yearTo}.<br>
        Try different search terms or expand the year range.
        ${publicationsAPI.useMockData ? '<br><br><em>📊 Currently using demo data. See console for backend setup instructions.</em>' : ''}
      `);
      return;
    }

    console.log(`✅ Found ${publications.length} publications`);
    updateStatistics(publications);
    renderPublications(publications);
    
    if (publicationsAPI.useMockData) {
      showStatusMessage(`
        <strong>✅ Demo Mode:</strong> Showing ${publications.length} sample publications.<br>
        <small>To connect to real UIBK data, follow the backend setup instructions in the console.</small>
      `);
    }
    
  } catch (error) {
    document.getElementById('loading-indicator').style.display = 'none';
    console.error('❌ Search failed:', error);
    
    showStatusMessage(`
      <strong>❌ Search Failed:</strong> ${error.message}<br><br>
      ${publicationsAPI.useMockData ? 
        'Demo mode failed. Check console for details.' : 
        'Backend connection failed. Please contact your system administrator.'
      }
    `);
  }
}

// Publication card creation with enhanced styling
function createPublicationCard(pub) {
  const card = document.createElement('div');
  card.className = 'publication-card';
  
  const typeClass = getTypeClass(pub.typeCode);
  
  // Create title with optional DOI link
  let titleElement;
  if (pub.doi) {
    const doiUrl = pub.doi.startsWith('http') ? pub.doi : `https://doi.org/${pub.doi}`;
    titleElement = `
      <h3 class="publication-title">
        <a href="${doiUrl}" target="_blank" rel="noopener noreferrer">
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
  
  if (pub.volume || pub.number || pub.pages) {
    metadata += '<br><strong>Details:</strong> ';
    const details = [];
    if (pub.volume) details.push(`Vol. ${pub.volume}`);
    if (pub.number) details.push(`No. ${pub.number}`);
    if (pub.pages) details.push(`pp. ${pub.pages}`);
    metadata += details.join(', ');
  }
  
  card.innerHTML = `
    <div class="publication-header">
      <span class="publication-type ${typeClass}">${pub.type.toUpperCase()}</span>
      ${pub.doi ? '<span class="publication-doi">DOI Available</span>' : ''}
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
    '5': 'type-thesis'
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
  // Inject CSS if not already present
  injectPublicationCardCSS();
  
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

function injectPublicationCardCSS() {
  if (!document.getElementById('publication-card-styles')) {
    const css = `
.publication-card {
  background: #ffffff;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #ddd;
}

.publication-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.publication-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.publication-type {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.publication-doi {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
  background: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.type-journal { background-color: #2E7D32; }
.type-conference { background-color: #1565C0; }
.type-chapter { background-color: #EF6C00; }
.type-book { background-color: #6A1B9A; }
.type-thesis { background-color: #C62828; }
.type-other { background-color: #424242; }

.publication-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.4;
  margin: 0 0 1rem 0;
}

.publication-title a {
  color: #1565C0;
  text-decoration: none;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.publication-title a:hover {
  text-decoration: underline;
  color: #0d47a1;
}

.title-link-icon {
  font-size: 0.8rem;
  opacity: 0.7;
  flex-shrink: 0;
  margin-top: 0.2rem;
}

.publication-meta {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #555;
}

.year-section {
  margin-bottom: 2rem;
}

.year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e1e5e9;
}

.year-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.year-count {
  font-size: 0.9rem;
  color: #666;
  background: #f8f9fa;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .publication-card { padding: 1rem; }
  .publication-header { flex-direction: column; align-items: flex-start; }
  .publication-title { font-size: 1rem; }
  .year-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
}
    `;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'publication-card-styles';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
  }
}

function showStatusMessage(message) {
  document.getElementById('status-text').innerHTML = message;
  document.getElementById('status-message').style.display = 'block';
}

// Production setup instructions
function logProductionInstructions() {
  console.log(`
🚀 UIBK Publications - Production Setup Instructions
==================================================

CURRENT STATUS: Demo mode with sample data

TO CONNECT TO REAL UIBK DATA:

1. SET UP BACKEND ENDPOINT
   Create an endpoint at /api/uibk-publications that:
   - Accepts POST requests with search parameters
   - Fetches data from UIBK website server-side
   - Returns parsed publication data as JSON

2. EXAMPLE BACKEND (Node.js/Express):
   
   app.post('/api/uibk-publications', async (req, res) => {
     try {
       const { author, title, yearFrom, yearTo, type } = req.body;
       
       // Build UIBK URL
       const url = 'https://lfuonline.uibk.ac.at/public/pk115_web.frame?' + 
                   new URLSearchParams({
                     'uebersicht_jn_in': 'J',
                     'institute_id_in': '70300',
                     'fsp_fp_id_in': '19870',
                     'forschungszentrum_id_in': '9',
                     'suche_autoren_in': author || '',
                     'suche_titel_in': title || '',
                     'suche_jahr_von_in': yearFrom || '2020',
                     'suche_jahr_bis_in': yearTo || new Date().getFullYear()
                   });
       
       // Fetch from UIBK
       const response = await fetch(url);
       const html = await response.text();
       
       // Parse HTML (implement parsing logic)
       const publications = parseUIBKHTML(html);
       
       res.json({ publications });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });

3. UPDATE FRONTEND:
   Set publicationsAPI.useMockData = false;

4. ALTERNATIVE SOLUTIONS:
   - Use server-side scraping with puppeteer/playwright
   - Set up a scheduled job to cache UIBK data
   - Use a headless browser service

5. TESTING:
   Try searching for authors like "Prodan", "Mueller", or titles containing "edge", "cloud"
  `);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 UIBK Publications System - Demo Mode');
  logProductionInstructions();
  
  const currentYear = new Date().getFullYear();
  
  // Set default values
  const yearFromInput = document.getElementById('year-from');
  const yearToInput = document.getElementById('year-to');
  
  if (yearFromInput) {
    yearFromInput.value = '2020';
    yearFromInput.min = '2000';
    yearFromInput.max = currentYear.toString();
  }
  
  if (yearToInput) {
    yearToInput.value = currentYear.toString();
    yearToInput.min = '2000';
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
  
  // Auto-search if author is pre-filled
  const authorInput = document.getElementById('author-search');
  if (authorInput && authorInput.value.trim()) {
    console.log('🔍 Auto-searching with pre-filled author:', authorInput.value);
    setTimeout(searchPublications, 500); // Small delay for UI
  }
});
