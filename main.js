let scrollPos;

const modeBtn = document.querySelector("#mode-btn");
const backBtn = document.querySelector("#back-btn");
const searchEl = document.querySelector("header search");
const formEl = searchEl.querySelector("search form");
const inputEl = searchEl.querySelector(`input[name="country"]`);
const selectEl = searchEl.querySelector(`select[name="region"]`);
const mainEl = document.querySelector("main");

// dynamic routing and content load
async function handleRouting() {
  const path = window.location.hash.slice(1);

  if (!scrollPos && !path) {
    scrollPos = window.scrollY;
  }

  if (!path) {
    // mainEl.scrollTo(0, scrollPos || 0);
    updateStyle("home");

    const resp = await fetch("https://restcountries.com/v3.1/all?fields=name,flags,cca3,population,region,capital");

    const data = await resp.json();

    mainEl.innerHTML = data.map((country) => `
    <article data-country="${country.cca3}" data-region="${country.region}">
      <figure>
        <img src="${country.flags.png}" alt="${country.flags.alt || `The flag of ${country.name.common}`}">
      </figure>
      <div>
        <h2>${country.name.common}</h2>
        <p><strong>Population</strong>: ${country.population.toLocaleString()}</p>
        <p><strong>Region</strong>: ${country.region}</p>
        <p><strong>Capital</strong>: ${country.capital.join(", ")}</p>
      </div>
    </article>
    `).join("");
  } else {
    mainEl.scrollTo(0, 0);
    updateStyle("country");

    const resp = await fetch(`https://restcountries.com/v3.1/alpha/${path}?fields=name,flags,population,region,subregion,capital,tld,currencies,languages,borders`);

    const country = await resp?.json();

    if (!resp.ok || !country)
      return mainEl.innerHTML = `<p class="not-found">Error: No data found for this country code!</p>`;

    // Extracting nativeName
    const nativeName = Object.values(country.name.nativeName)[0].common || "N/A";

    // Extracting currencies 
    const currencies = Object.values(country.currencies).map(ccy => ccy.name).join(", ") || "None";

    // Extracting languages
    const languages = Object.values(country.languages).map(lang => lang).join(", ") || "None";

    // Generating border country links
    const borders = country.borders.map((border) => `
      <a href="#/${border}">${border}</a>`).join("") || `<a href="javascript:void(0);">N/A</a>`;

    // Injecting country details
    mainEl.innerHTML = `
      <figure>
        <img src="${country.flags.png}" alt="${country.flags.alt || `The flag of ${country.name.common}`}">
      </figure>
      <article>
        <h2>${country.name.common}</h2>
        <section class="details">
          <div>
            <p><strong>Native Name:</strong> ${nativeName}</p>
            <p><strong>Population:</strong> ${country.population.toLocaleString()}</p>
            <p><strong>Region:</strong> ${country.region}</p>
            <p><strong>Sub Region:</strong> ${country.subregion}</p>
            <p><strong>Capital:</strong> ${country.capital.join(", ")}</p>
          </div>
          <div>
            <p><strong>Top Level Domain:</strong> ${country.tld.join(", ") || "N/A"}</p>
            <p><strong>Currencies:</strong> ${currencies}</p>
            <p><strong>Languages:</strong> ${languages}</p>
          </div>
        </section>
        <section class="borders">
          <h3><strong>Border&nbsp;Countries:</strong></h3>
          <div class="border-links">${borders}</div>
        </section>
      </article>
    `;
  }
}

function updateStyle(param) {
  mainEl.className = param;
  backBtn.style.display = (param === "country") ? "block" : "none";
  searchEl.style.display = (param === "home") ? "flex" : "none";
}

// Event listener for country details 
mainEl.addEventListener("click", (event) => {
  const article = event.target.closest("article");
  if (!article || !article.closest(".home")) return;

  const cca3 = article.dataset.country;

  window.location.href = `#/${cca3}`;
});

// search function 
formEl.addEventListener("submit", (event) => {
  event.preventDefault();

  const cca3 = inputEl.value?.trim()?.toUpperCase();

  if (!cca3)
    return alert("Please enter a country code first!");

  window.location.href = `#/${cca3}`;
});

// filter based on region 
selectEl.addEventListener("change", () => {
  const value = selectEl.value;
  if (!value) return;

  const articles = mainEl.querySelectorAll("article");

  articles.forEach(el => {
    if (el.dataset.region === value) el.style.display = "block";
    else el.style.display = "none";
  })
})

// set theme (dark/light)
function setTheme(newTheme) {
  document.body.dataset.theme = newTheme;
  localStorage.setItem("theme", newTheme);

  modeBtn.innerHTML = newTheme === "dark" ? "<span>&#9788;</span> Light mode" : "<span>&#9790;</span> Dark mode";
}

// toggle theme button event listener 
modeBtn.addEventListener("click", () => {
  const newTheme = localStorage.getItem("theme") === "light" ? "dark" : "light";

  setTheme(newTheme);
});

// back button event listener 
backBtn.addEventListener("click", () => {
  history.back();
});

// initialisation 
window.addEventListener("DOMContentLoaded", () => {
  // initial content load
  handleRouting();

  // Set the initial theme
  const currentTheme = localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)")?.matches ? "dark" : "light");
  setTheme(currentTheme);
});

// routing 
window.addEventListener("hashchange", handleRouting);