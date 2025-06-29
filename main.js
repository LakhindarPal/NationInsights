const appContainer = document.getElementById('app-container');
const themeBtn = document.getElementById('theme-toggle');

const API_BASE_URL = 'https://restcountries.com/v3.1';

let allCountries = [];
let regionFilter = 'All';
let searchTerm = '';

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Data not found for URL: ${url}`);
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    if (appContainer.innerHTML.includes('Loading countries...')) {
      appContainer.innerHTML = `<p class="error-message">Failed to load data. Please check your internet connection or try again later.</p>`;
    }
    return null;
  }
}

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  const icon = theme === 'dark' ? 'moon' : 'sun';
  themeBtn.innerHTML = `
    <span class="theme-icon" data-icon="${icon}" aria-hidden="true"></span>
    ${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode
  `;
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
}

const userTheme = localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)') ? 'dark' : 'light');
applyTheme(userTheme);
if (themeBtn) {
  themeBtn.addEventListener('click', toggleTheme);
}

function createCountryCard(country) {
  const card = document.createElement('div');
  card.classList.add('country-card');
  card.dataset.countryCode = country.cca3;
  
  card.innerHTML = `
        <img src="${country.flags.png}" alt="${country.name.common} flag">
        <div class="card-info">
            <h2>${country.name.common}</h2>
            <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
            <p><strong>Region:</strong> ${country.region}</p>
            <p><strong>Capital:</strong> ${country.capital ? country.capital[0] : 'N/A'}</p>
        </div>
    `;
  
  card.addEventListener('click', () => {
    navigateTo(`/${encodeURIComponent(country.cca3)}`);
  });
  
  return card;
}

async function renderHomePage() {
  appContainer.innerHTML = `
        <div class="controls">
            <div class="search-container">
                <img src="./assets/search-icon.svg" alt="Search Icon" class="search-icon">
                <input type="text" id="search-input" placeholder="Search for a country..." value="${searchTerm}">
            </div>
            <div class="filter-container" id="filter-container">
                <div class="filter-dropdown-header" id="filter-dropdown-header">
                    Filter by Region
                    <img src="./assets/chevron-down-icon.svg" alt="Dropdown Icon" class="dropdown-icon">
                </div>
                <ul class="filter-options" id="filter-options">
                    <li data-region="Africa">Africa</li>
                    <li data-region="Americas">Americas</li>
                    <li data-region="Asia">Asia</li>
                    <li data-region="Europe">Europe</li>
                    <li data-region="Oceania">Oceania</li>
                    <li data-region="All">All Regions</li>
                </ul>
            </div>
        </div>
        <div class="countries-grid" id="countries-grid">
            <p>Loading countries...</p>
        </div>
    `;
  
  const searchInput = document.getElementById('search-input');
  const filterContainer = document.getElementById('filter-container');
  const filterDropdownHeader = document.getElementById('filter-dropdown-header');
  const filterOptions = document.getElementById('filter-options');
  const countriesGrid = document.getElementById('countries-grid');
  
  filterOptions.querySelectorAll('li').forEach(li => {
    if (li.dataset.region === regionFilter) {
      li.classList.add('selected');
      filterDropdownHeader.firstChild.nodeValue = regionFilter !== 'All' ? li.textContent : 'Filter by Region';
    }
  });
  
  if (allCountries.length === 0) {
    countriesGrid.innerHTML = `<p>Loading countries...</p>`;
    const data = await fetchData(`${API_BASE_URL}/all?fields=name,flags,cca3,population,region,capital`);
    if (data) {
      allCountries = data;
      populateCountriesGrid();
    } else {
      countriesGrid.innerHTML = `<p class="error-message">Failed to load countries.</p>`;
    }
  } else {
    populateCountriesGrid();
  }
  
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    populateCountriesGrid();
  });
  
  filterDropdownHeader.addEventListener('click', (e) => {
    e.stopPropagation();
    filterContainer.classList.toggle('active');
  });
  
  filterOptions.addEventListener('click', (e) => {
    if (e.target.tagName !== 'LI') return;
    
    regionFilter = e.target.dataset.region;
    filterContainer.classList.remove('active');
    filterDropdownHeader.firstChild.nodeValue = regionFilter !== 'All' ? e.target.textContent : 'Filter by Region';
    
    filterOptions.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
    e.target.classList.add('selected');
    
    populateCountriesGrid();
  });
  
  document.addEventListener('click', (e) => {
    if (!filterContainer.contains(e.target) && filterContainer.classList.contains('active')) {
      filterContainer.classList.remove('active');
    }
  });
}

function populateCountriesGrid() {
  const countriesGrid = document.getElementById('countries-grid');
  if (!countriesGrid) return;
  
  countriesGrid.innerHTML = '';
  
  const filteredCountries = allCountries.filter(country => {
    const matchesSearch = country.name.common.toLowerCase().includes(searchTerm);
    const matchesRegion = regionFilter === 'All' || country.region === regionFilter;
    return matchesSearch && matchesRegion;
  });
  
  if (filteredCountries.length === 0) {
    countriesGrid.innerHTML = `<p class="no-results-message">No countries found matching your criteria.</p>`;
  } else {
    filteredCountries.forEach(country => {
      countriesGrid.appendChild(createCountryCard(country));
    });
  }
}

async function renderDetailPage(countryCode) {
  appContainer.innerHTML = `
        <button class="back-button" id="back-button">
            <img src="./assets/arrow-left-icon.svg" alt="Back Arrow Icon">
            Back
        </button>
        <div class="country-detail-content" id="country-detail-content">
            <p>Loading country details...</p>
        </div>
    `;
  
  const backButton = document.getElementById('back-button');
  const countryDetailContent = document.getElementById('country-detail-content');
  
  backButton.addEventListener('click', () => {
    navigateTo('/');
  });
  
  const countryData = await fetchData(`${API_BASE_URL}/alpha/${encodeURIComponent(countryCode)}?fields=name,flags,population,region,subregion,capital,tld,currencies,languages,borders,cca3`);
  
  if (!countryData) {
    countryDetailContent.innerHTML = `<p class="error-message">Failed to load country details or country not found.</p>`;
    return;
  }
  
  const nativeName = countryData.name.nativeName ?
    Object.values(countryData.name.nativeName)[0]?.common || 'N/A' :
    'N/A';
  const currencies = countryData.currencies ?
    Object.values(countryData.currencies).map(c => c.name).join(', ') :
    'N/A';
  const languages = countryData.languages ?
    Object.values(countryData.languages).join(', ') :
    'N/A';
  
  let borderCountryTagsHTML = '<p>N/A</p>';
  if (countryData.borders && countryData.borders.length > 0) {
    borderCountryTagsHTML = countryData.borders.map(borderCCA3 => `
            <button class="border-country-tag" data-country-code="${borderCCA3}">
                ${borderCCA3}
            </button>
        `).join('');
  }
  
  countryDetailContent.innerHTML = `
        <img src="${countryData.flags.png}" alt="${countryData.name.common} flag" class="detail-flag">
        <div class="detail-info">
            <h2>${countryData.name.common}</h2>
            <div class="info-columns">
                <div class="info-column">
                    <p><strong>Native Name:</strong> ${nativeName}</p>
                    <p><strong>Population:</strong> ${countryData.population.toLocaleString()}</p>
                    <p><strong>Region:</strong> ${countryData.region}</p>
                    <p><strong>Sub Region:</strong> ${countryData.subregion || 'N/A'}</p>
                    <p><strong>Capital:</strong> ${countryData.capital ? countryData.capital[0] : 'N/A'}</p>
                </div>
                <div class="info-column">
                    <p><strong>Top Level Domain:</strong> ${countryData.tld ? countryData.tld[0] : 'N/A'}</p>
                    <p><strong>Currencies:</strong> ${currencies}</p>
                    <p><strong>Languages:</strong> ${languages}</p>
                </div>
            </div>
            <div class="border-countries">
                <h3>Border Countries:</h3>
                <div class="border-tags">
                    ${borderCountryTagsHTML}
                </div>
            </div>
        </div>
    `;
  
  document.querySelectorAll('.border-country-tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      const borderCountryCode = e.target.dataset.countryCode;
      if (borderCountryCode) {
        navigateTo(`/${encodeURIComponent(borderCountryCode)}`);
      }
    });
  });
}

function navigateTo(path) {
  history.pushState(null, '', path);
  renderApp();
}

function renderApp() {
  const path = window.location.pathname;
  
  if (path === '/') {
    renderHomePage();
  } else {
    const countryCode = decodeURIComponent(path.slice(1));
    if (countryCode?.length === 3) {
      renderDetailPage(countryCode);
    } else {
      appContainer.innerHTML = `<p class="error-message">Page not found. <a href="/">Go to Home</a></p>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', renderApp);
window.addEventListener('popstate', renderApp);