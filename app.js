// Application State
let properties = [];
let favorites = [];
let currentCategory = "Todos";
let searchQuery = "";
let maxPrice = 5000000;
let isAdmin = false;
let currentTheme = "light";
let currentType = "alquiler";

// Selected property for detail view & slider state
let selectedProperty = null;
let currentSlideIndex = 0;

// Leaflet Map instances
let mainMap = null;
let mainMapMarkers = [];
let pickerMap = null;
let pickerMarker = null;
let openPopupPropertyId = null; // Track currently open popup property ID

// Constant Categories definition
const CATEGORIES = [
  { id: "Todos", name: "Todos", icon: "compass" },
  { id: "Favoritos", name: "Favoritos", icon: "heart" },
  { id: "Casas", name: "Casas", icon: "home" },
  { id: "Habitaciones", name: "Habitaciones", icon: "bed" },
  { id: "Departamentos", name: "Departamentos", icon: "building" }
];

// Supabase Integration Configuration
const SUPABASE_URL = "https://hgvhsdmyfsenkjebdgtr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndmhzZG15ZnNlbmtqZWJkZ3RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NTgxNzAsImV4cCI6MjA5OTAzNDE3MH0.lF01g1DP0ezh2qWJV9PlnvjVpm7fIaGDaJgovmwBFkY";
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Admin Credentials
const ADMIN_EMAIL = "admin@mialqui.com";
const ADMIN_PASSWORD = "oviedo2026";
const ADMIN_WHATSAPP = "595981234567"; // Teléfono default (puede ser modificado o parametrizado)

// Category name mapping helpers (DB uses singular, app uses plural)
function mapCategoryToDb(appCategory) {
  const map = { "Casas": "Casa", "Departamentos": "Departamento", "Habitaciones": "Habitacion" };
  return map[appCategory] || appCategory;
}
function mapCategoryFromDb(dbCategory) {
  const map = { "Casa": "Casas", "Departamento": "Departamentos", "Habitacion": "Habitaciones" };
  return map[dbCategory] || dbCategory;
}

// Init application on load
window.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  await initState();
  updatePriceSliderBounds();
  renderCategories();
  initMainMap();
  renderProperties();
  initEventListeners();
  updateAuthUI();
  
  // Create icons first time
  lucide.createIcons();
});

// Theme Management
function initTheme() {
  currentTheme = localStorage.getItem("mialqui_theme") || "light";
  if (currentTheme === "dark") {
    document.body.classList.add("dark-theme");
    updateThemeToggleIcon(true);
  } else {
    document.body.classList.remove("dark-theme");
    updateThemeToggleIcon(false);
  }
}

function toggleTheme() {
  if (document.body.classList.contains("dark-theme")) {
    document.body.classList.remove("dark-theme");
    currentTheme = "light";
  } else {
    document.body.classList.add("dark-theme");
    currentTheme = "dark";
  }
  localStorage.setItem("mialqui_theme", currentTheme);
  updateThemeToggleIcon(currentTheme === "dark");
  
  // Refresh leaflet tile layer style if needed (or just redraw maps)
  if (mainMap) {
    mainMap.invalidateSize();
  }
}

function updateThemeToggleIcon(isDark) {
  const darkIcon = document.querySelector("#btn-theme-toggle .dark-icon");
  const lightIcon = document.querySelector("#btn-theme-toggle .light-icon");
  if (isDark) {
    darkIcon.classList.add("hidden");
    lightIcon.classList.remove("hidden");
  } else {
    darkIcon.classList.remove("hidden");
    lightIcon.classList.add("hidden");
  }
}

// State Persistence & Supabase Integration
async function initState() {
  // Load properties from Supabase
  await loadPropertiesFromSupabase();

  // Load favorites
  const savedFavorites = localStorage.getItem("mialqui_favorites");
  if (savedFavorites) {
    favorites = JSON.parse(savedFavorites);
  } else {
    favorites = [];
  }

  // Load session
  isAdmin = sessionStorage.getItem("mialqui_admin") === "true";
  
  // Set initial price filter bound based on rentals
  maxPrice = 5000000;
}

async function loadPropertiesFromSupabase() {
  if (!supabaseClient) {
    console.warn("Supabase client library not found. Falling back to local storage.");
    const savedProperties = localStorage.getItem("mialqui_properties");
    properties = savedProperties ? JSON.parse(savedProperties) : INITIAL_PROPERTIES;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from('propiedades')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching properties from Supabase:", error);
      const savedProperties = localStorage.getItem("mialqui_properties");
      properties = savedProperties ? JSON.parse(savedProperties) : INITIAL_PROPERTIES;
      return;
    }

    if (data && data.length > 0) {
      properties = data.map(p => ({
        id: p.id,
        title: p.titulo || '',
        category: mapCategoryFromDb(p.categoria || ''),
        type: p.tipo_operacion || 'alquiler',
        price: Number(p.precio) || 0,
        lat: Number(p.latitud) || -25.4450,
        lng: Number(p.longitud) || -56.4440,
        description: p.descripcion || '',
        location: p.direccion || [p.barrio, p.ciudad].filter(Boolean).join(', ') || 'Coronel Oviedo',
        phone: p.whatsapp_contacto || ADMIN_WHATSAPP,
        nombre_contacto: p.nombre_contacto || '',
        ciudad: p.ciudad || 'Coronel Oviedo',
        barrio: p.barrio || '',
        habitaciones: p.habitaciones || null,
        banos: p['baños'] || null,
        cochera: p.cochera || null,
        superficie: p.superficie || null,
        images: Array.isArray(p.imagenes) ? p.imagenes : (p.imagenes ? [p.imagenes] : []),
        amenities: Array.isArray(p.servicios) ? p.servicios : (p.servicios ? p.servicios.split(',').map(s => s.trim()).filter(Boolean) : []),
        rating: 5.0,
        reviewsCount: 0,
        destacada: p.destacada || false,
        disponible: p.disponible || 'disponible'
      }));
} else {
      // Seed database with mockData if empty
      properties = INITIAL_PROPERTIES;
      for (const prop of INITIAL_PROPERTIES) {
        await supabaseClient.from('propiedades').insert([{
          titulo: prop.title,
          descripcion: prop.description,
          tipo_operacion: prop.type || 'alquiler',
          categoria: mapCategoryToDb(prop.category),
          precio: prop.price,
          pais: 'Paraguay',
          departamento: 'Caaguaz\u00fa',
          ciudad: 'Coronel Oviedo',
          barrio: '',
          direccion: prop.location,
          latitud: prop.lat,
          longitud: prop.lng,
          servicios: prop.amenities || [],
          destacada: false,
          disponible: 'disponible',
          whatsapp_contacto: prop.phone || ADMIN_WHATSAPP,
          nombre_contacto: 'Administrador'
        }]);
      }
    }

    localStorage.setItem("mialqui_properties", JSON.stringify(properties));
  } catch (err) {
    console.error("Exception loading properties from Supabase:", err);
    const savedProperties = localStorage.getItem("mialqui_properties");
    properties = savedProperties ? JSON.parse(savedProperties) : INITIAL_PROPERTIES;
  }
}

function savePropertiesState() {
  localStorage.setItem("mialqui_properties", JSON.stringify(properties));
  renderProperties();
  if (isAdmin) {
    renderAdminPropertiesTable();
  }
}

function saveFavoritesState() {
  localStorage.setItem("mialqui_favorites", JSON.stringify(favorites));
}

// Helper to format prices compactly for markers (e.g. 1.8M, 320M, 3.5M, or 500 mil)
function formatPriceAbbr(price) {
  if (price >= 1000000000) {
    return (price / 1000000000).toLocaleString('es-PY', { maximumFractionDigits: 1 }) + " B";
  }
  if (price >= 1000000) {
    return (price / 1000000).toLocaleString('es-PY', { maximumFractionDigits: 1 }) + " M";
  }
  if (price >= 1000) {
    return (price / 1000).toLocaleString('es-PY', { maximumFractionDigits: 0 }) + " mil";
  }
  return price.toString();
}

// Dynamic Price Slider boundaries configuration
function updatePriceSliderBounds() {
  const priceRange = document.getElementById("search-price-range");
  const priceMaxLabel = document.getElementById("price-slider-max");
  const priceCurrentLabel = document.getElementById("price-slider-current");
  const priceFilterLabel = document.getElementById("price-filter-label");

  if (!priceRange) return;

  const maxVal = currentType === "alquiler" ? 5000000 : 2000000000;
  const stepVal = currentType === "alquiler" ? 100000 : 50000000;

  priceRange.min = "0";
  priceRange.max = maxVal.toString();
  priceRange.step = stepVal.toString();
  
  // Bound the current maxPrice to the new maximum
  const maxLimit = currentType === "alquiler" ? 5000000 : 2000000000;
  if (maxPrice > maxLimit || maxPrice === 1000000 || maxPrice === 5000000 || maxPrice === 2000000000) {
    maxPrice = maxLimit;
  }
  priceRange.value = maxPrice.toString();

  priceMaxLabel.textContent = `${maxLimit.toLocaleString('es-PY')} Gs.`;

  if (maxPrice >= maxLimit) {
    priceFilterLabel.textContent = "Cualquiera";
    priceCurrentLabel.textContent = "Cualquiera";
  } else {
    const formatted = `${maxPrice.toLocaleString('es-PY')} Gs.`;
    priceFilterLabel.textContent = `â‰¤ ${formatted}`;
    priceCurrentLabel.textContent = formatted;
  }
}

// Handles switching between Ventas & Alquileres global sections
function changeType(newType) {
  currentType = newType;
  updatePriceSliderBounds();
  updateHeaderAndTitles();
  
  // Re-render categories & properties
  renderProperties();
}

// Dynamic titles & headers updating based on Rental / Sale state
function updateHeaderAndTitles() {
  const pageTitle = document.querySelector("title");
  if (pageTitle) {
    pageTitle.textContent = currentType === "alquiler" 
      ? "MiAlqui | Alquileres en Coronel Oviedo" 
      : "MiAlqui | Ventas en Coronel Oviedo";
  }
  
  // Update form submission button and titles in admin view
  const submitBtn = document.getElementById("btn-submit-property");
  const formTitle = document.getElementById("form-title");
  const isEditing = document.getElementById("form-property-id").value;

  if (submitBtn) {
    submitBtn.textContent = currentType === "alquiler" ? "Guardar Alquiler" : "Guardar Venta";
  }

  if (formTitle && !isEditing) {
    formTitle.textContent = currentType === "alquiler" ? "Crear Nuevo Alquiler" : "Crear Nueva Venta";
  }
  
  const formPriceLabel = document.getElementById("form-price-label");
  if (formPriceLabel) {
    formPriceLabel.textContent = currentType === "alquiler" ? "Precio Mensual (Gs.)" : "Precio de Venta (Gs.)";
  }

  const shortcutBtn = document.getElementById("btn-admin-add-shortcut");
  if (shortcutBtn) {
    shortcutBtn.innerHTML = `<i data-lucide="plus"></i> Crear Nuevo ${currentType === 'alquiler' ? 'Alquiler' : 'Venta'}`;
    lucide.createIcons();
  }
}

// Render Category filter bar
function renderCategories() {
  const container = document.getElementById("categories-container");
  container.innerHTML = "";

  CATEGORIES.forEach(cat => {
    const item = document.createElement("div");
    item.className = `category-item ${cat.id === currentCategory ? "active" : ""}`;
    item.dataset.category = cat.id;

    item.innerHTML = `
      <i data-lucide="${cat.icon}"></i>
      <span>${cat.name}</span>
    `;

    item.addEventListener("click", () => {
      document.querySelectorAll(".category-item").forEach(el => el.classList.remove("active"));
      item.classList.add("active");
      currentCategory = cat.id;
      renderProperties();
    });

    container.appendChild(item);
  });
}

// Initialize Leaflet Main Map
function initMainMap() {
  // Centered in Coronel Oviedo [-25.4450, -56.4440]
  mainMap = L.map("map", {
    zoomControl: false // Custom zoom buttons positioning later
  }).setView([-25.4450, -56.4440], 13.5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(mainMap);

  // Add zoom control at bottom right
  L.control.zoom({
    position: 'bottomright'
  }).addTo(mainMap);

  // Track popups to maintain active state after map redraw
  mainMap.on("popupopen", (e) => {
    const latLng = e.popup.getLatLng();
    if (latLng) {
      const prop = properties.find(p => Math.abs(p.lat - latLng.lat) < 0.0001 && Math.abs(p.lng - latLng.lng) < 0.0001);
      if (prop) {
        openPopupPropertyId = prop.id;
      }
    }
  });

  mainMap.on("popupclose", () => {
    openPopupPropertyId = null;
  });
}

// Refresh Leaflet Map Markers
function updateMapMarkers(filteredProps) {
  if (!mainMap) return;

  // Clear existing markers
  mainMapMarkers.forEach(m => mainMap.removeLayer(m));
  mainMapMarkers = [];

  // Group to fit bounds
  const markerGroup = [];

  filteredProps.forEach(prop => {
    const isFav = favorites.includes(prop.id);
    const formattedPrice = formatPriceAbbr(prop.price);
    
    // Custom label pricing tag - Highlights with heart if favorited
    const priceIcon = L.divIcon({
      className: `custom-price-marker ${isFav ? 'favorite-marker' : ''}`,
      html: `<span>${isFav ? 'â¤ï¸ ' : ''}${formattedPrice} Gs.</span>`,
      iconSize: [isFav ? 90 : 80, 24],
      iconAnchor: [isFav ? 45 : 40, 12]
    });

    const marker = L.marker([prop.lat, prop.lng], { icon: priceIcon }).addTo(mainMap);
    
    // Popup template with custom favorite heart button (inline SVG)
    const heartSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${isFav ? 'var(--accent)' : 'none'}" stroke="${isFav ? 'var(--accent)' : 'currentColor'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
    
    const fallbackImg = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80';
    const popupContent = `
      <div class="map-popup-card" onclick="openPropertyDetail('${prop.id}')">
        <img class="map-popup-img" src="${(prop.images && prop.images[0]) || fallbackImg}" alt="${prop.title}">
        <button class="card-favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${prop.id}')" aria-label="Favorito" style="top: 8px; right: 8px; width: 28px; height: 28px; padding: 0; display: flex; align-items: center; justify-content: center; background-color: rgba(255,255,255,0.9); border-radius: 50%; position: absolute; z-index: 10;">
          ${heartSvg}
        </button>
        <div class="map-popup-info">
          <div class="map-popup-title">${prop.title}</div>
          <div class="map-popup-price"><strong>${prop.price.toLocaleString('es-PY')} Gs.</strong>${prop.type === 'alquiler' ? ' / mes' : ''}</div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 240,
      closeButton: false,
      autoPan: false // Prevent Leaflet autoPan from overriding setView
    });

    // Highlight card list and center map when popup is opened
    marker.on('popupopen', () => {
      mainMap.setView([prop.lat, prop.lng], 15, { animate: true });
      highlightPropertyCard(prop.id);
    });

    mainMapMarkers.push(marker);
    markerGroup.push([prop.lat, prop.lng]);
  });

  // Fit bounds if markers exist and not full explorer list
  if (markerGroup.length > 0 && filteredProps.length < properties.length && currentCategory !== "Favoritos") {
    mainMap.fitBounds(markerGroup, { padding: [50, 50] });
  }

  // Restore active popup if it was open before redraw
  if (openPopupPropertyId) {
    const activeMarker = mainMapMarkers.find(m => {
      const prop = properties.find(p => p.id === openPopupPropertyId);
      if (!prop) return false;
      const latLng = m.getLatLng();
      return Math.abs(latLng.lat - prop.lat) < 0.0001 && Math.abs(latLng.lng - prop.lng) < 0.0001;
    });
    if (activeMarker) {
      setTimeout(() => {
        if (activeMarker) activeMarker.openPopup();
      }, 50);
    }
  }
}

function getFilteredProperties() {
  return properties.filter(prop => {
    // Section type filter
    const matchesType = prop.type === currentType;

    // Category filter
    let matchesCat = false;
    if (currentCategory === "Todos") {
      matchesCat = true;
    } else if (currentCategory === "Favoritos") {
      matchesCat = favorites.includes(prop.id);
    } else {
      matchesCat = prop.category === currentCategory;
    }
    
    // Search query filter
    const matchesSearch = searchQuery === "" || 
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Price filter
    const matchesPrice = prop.price <= maxPrice;

    return matchesType && matchesCat && matchesSearch && matchesPrice;
  });
}

// Render Properties in the Listing Grid
function renderProperties() {
  const grid = document.getElementById("listings-grid");
  const countSpan = document.getElementById("listings-count");
  const activeFiltersContainer = document.getElementById("active-filters-tags");
  grid.innerHTML = "";

  // Apply filters
  let filtered = getFilteredProperties();

  // Update counter
  countSpan.textContent = filtered.length;
  const typeWord = currentType === "alquiler" ? (filtered.length === 1 ? 'alquiler' : 'alquileres') : (filtered.length === 1 ? 'propiedad en venta' : 'propiedades en venta');
  document.getElementById("listings-title").innerHTML = `<span id="listings-count">${filtered.length}</span> ${typeWord} en Coronel Oviedo`;

  // Render filter tags
  renderFilterTags();

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-properties">
        <i data-lucide="info" class="no-prop-icon"></i>
        <h3>No se encontraron propiedades</h3>
        <p>Intenta cambiar los filtros de bÃºsqueda o categorÃ­a.</p>
        <button class="btn-primary margin-top-md" onclick="resetFilters()">Limpiar Filtros</button>
      </div>
    `;
    lucide.createIcons();
    updateMapMarkers([]);
    return;
  }

  // Create Property Cards
  filtered.forEach(prop => {
    const isFav = favorites.includes(prop.id);
    const card = document.createElement("div");
    card.className = "property-card";
    card.id = `property-card-${prop.id}`;
    card.dataset.id = prop.id;

    const cardFallbackImg = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80';
    card.innerHTML = `
      <div class="card-img-wrapper" onclick="openPropertyDetail('${prop.id}')">
        <img class="card-img" src="${(prop.images && prop.images[0]) || cardFallbackImg}" alt="${prop.title}">
        <span class="card-category-badge">${prop.category}</span>
      </div>
      <button class="card-favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${prop.id}')" aria-label="Favorito">
        <i data-lucide="heart"></i>
      </button>
      <div class="card-info" onclick="openPropertyDetail('${prop.id}')">
        <div class="card-title-row">
          <h3 class="card-title">${prop.title}</h3>
        </div>
        <div class="card-location">
          <i data-lucide="map-pin"></i>
          <span>${prop.location}</span>
        </div>
        <div class="card-price-row">
          <span class="card-price"><strong>${prop.price.toLocaleString('es-PY')} Gs.</strong> <span class="card-price-unit">${prop.type === 'alquiler' ? ' / mes' : ''}</span></span>
        </div>
      </div>
    `;

    // Mouse hover events to highlight map markers
    card.addEventListener("mouseenter", () => {
      highlightMapMarker(prop.id, true);
    });

    card.addEventListener("mouseleave", () => {
      highlightMapMarker(prop.id, false);
    });

    grid.appendChild(card);
  });

  // Re-create icons inside cards
  lucide.createIcons();

  // Draw markers on map
  updateMapMarkers(filtered);
}

// Highlight Map Marker when hovering property card
function highlightMapMarker(id, highlight) {
  const index = properties.findIndex(p => p.id === id);
  if (index === -1) return;
  
  // Find marker in mainMapMarkers list that corresponds to coordinates
  const prop = properties[index];
  const marker = mainMapMarkers.find(m => {
    const latLng = m.getLatLng();
    return Math.abs(latLng.lat - prop.lat) < 0.0001 && Math.abs(latLng.lng - prop.lng) < 0.0001;
  });

  if (marker) {
    const el = marker.getElement();
    if (el) {
      if (highlight) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    }
  }
}

// Highlight property card list scroll
function highlightPropertyCard(id) {
  document.querySelectorAll(".property-card").forEach(c => c.style.borderColor = "var(--border-color)");
  const card = document.getElementById(`property-card-${id}`);
  if (card) {
    card.style.borderColor = "var(--primary)";
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// Toggle Favorite State
function toggleFavorite(event, id) {
  event.stopPropagation();
  const isFav = favorites.includes(id);

  if (isFav) {
    favorites = favorites.filter(favId => favId !== id);
  } else {
    favorites.push(id);
  }

  saveFavoritesState();
  
  // Re-render list and map to reflect changes immediately
  renderProperties();
}

// Render active filters labels
function renderFilterTags() {
  const container = document.getElementById("active-filters-tags");
  container.innerHTML = "";

  if (searchQuery) {
    addFilterTag(`BÃºsqueda: "${searchQuery}"`, () => {
      searchQuery = "";
      document.getElementById("search-input-text").value = "";
      renderProperties();
    });
  }

  const maxLimit = currentType === "alquiler" ? 5000000 : 2000000000;
  if (maxPrice < maxLimit) {
    addFilterTag(`Precio mÃ¡x: ${maxPrice.toLocaleString('es-PY')} Gs.`, () => {
      maxPrice = maxLimit;
      updatePriceSliderBounds();
      renderProperties();
    });
  }
}

function addFilterTag(text, onClear) {
  const container = document.getElementById("active-filters-tags");
  const tag = document.createElement("div");
  tag.className = "filter-tag";
  tag.innerHTML = `
    <span>${text}</span>
    <button aria-label="Remover filtro"><i data-lucide="x"></i></button>
  `;
  tag.querySelector("button").addEventListener("click", onClear);
  container.appendChild(tag);
}

function resetFilters() {
  searchQuery = "";
  maxPrice = currentType === "alquiler" ? 5000000 : 2000000000;
  currentCategory = "Todos";
  
  // Reset DOM elements
  document.getElementById("search-input-text").value = "";
  updatePriceSliderBounds();
  
  document.querySelectorAll(".category-item").forEach(el => {
    if (el.dataset.category === "Todos") el.classList.add("active");
    else el.classList.remove("active");
  });

  renderProperties();
}

// Property Details Modal & Slider Logic
function openPropertyDetail(id) {
  const prop = properties.find(p => String(p.id) === String(id));
  if (!prop) return;

  selectedProperty = prop;
  currentSlideIndex = 0;

  // Set modal texts
  document.getElementById("detail-category").textContent = prop.category;
  document.getElementById("detail-title").textContent = prop.title;
  document.getElementById("detail-location-text").textContent = prop.location;
  document.getElementById("detail-description-text").textContent = prop.description;
  
  const bookingPriceSpan = document.querySelector(".booking-price");
  if (bookingPriceSpan) {
    bookingPriceSpan.innerHTML = `<strong id="booking-price-value">${prop.price.toLocaleString('es-PY')} Gs.</strong>${prop.type === 'alquiler' ? ' / mes' : ''}`;
  }

  // Dynamic WhatsApp Link Generation
  const whatsappNumber = prop.phone || ADMIN_WHATSAPP;
  const actionWord = prop.type === "alquiler" ? "alquilar" : "comprar";
  const messageText = `Hola! Estoy interesado/a en ${actionWord} la propiedad "${prop.title}" (${prop.category}) en ${prop.location} publicada en MiAlqui. Â¿EstÃ¡ disponible?`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messageText)}`;
  
  const waButton = document.getElementById("btn-whatsapp-booking");
  waButton.href = whatsappUrl;
  waButton.innerHTML = `<i data-lucide="message-circle"></i> Contactar para ${prop.type === 'alquiler' ? 'Alquilar' : 'Comprar'}`;

  // Amenities dynamic loading
  const amenitiesList = document.getElementById("detail-amenities-list");
  amenitiesList.innerHTML = "";
  (prop.amenities || []).forEach(am => {
    // Pick an icon based on name
    let icon = "check";
    const nameLower = am.toLowerCase();
    if (nameLower.includes("wifi")) icon = "wifi";
    else if (nameLower.includes("aire") || nameLower.includes("climat")) icon = "wind";
    else if (nameLower.includes("piscina")) icon = "waves";
    else if (nameLower.includes("cochera") || nameLower.includes("estacionamiento")) icon = "car";
    else if (nameLower.includes("tv") || nameLower.includes("netflix")) icon = "tv";
    else if (nameLower.includes("cocina")) icon = "utensils";
    else if (nameLower.includes("parrilla") || nameLower.includes("quincho")) icon = "flame";
    else if (nameLower.includes("lavadora")) icon = "shirt";
    else if (nameLower.includes("dormitorios") || nameLower.includes("cama")) icon = "bed";
    else if (nameLower.includes("mascotas") || nameLower.includes("pet")) icon = "heart-handshake";

    const li = document.createElement("li");
    li.className = "detail-amenity-item";
    li.innerHTML = `<i data-lucide="${icon}"></i> <span>${am}</span>`;
    amenitiesList.appendChild(li);
  });

  // Slider image loader
  const wrapper = document.getElementById("detail-slides-wrapper");
  const dotsContainer = document.getElementById("detail-slider-dots");
  wrapper.innerHTML = "";
  dotsContainer.innerHTML = "";

  (prop.images || []).forEach((img, index) => {
    // Image wrapper
    const imgEl = document.createElement("img");
    imgEl.className = "detail-slide-img";
    imgEl.src = img;
    imgEl.alt = `${prop.title} - Foto ${index + 1}`;
    wrapper.appendChild(imgEl);

    // Bullet Dot
    const dot = document.createElement("div");
    dot.className = `slider-dot ${index === 0 ? "active" : ""}`;
    dot.addEventListener("click", () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });

  // Show Modal
  document.getElementById("detail-modal").classList.remove("hidden");
  updateSliderPosition();
  
  // Create icons
  lucide.createIcons();
}

function closePropertyDetail() {
  document.getElementById("detail-modal").classList.add("hidden");
  selectedProperty = null;
}

// Detail Image Slider Navigation
function goToSlide(index) {
  if (!selectedProperty) return;
  const slidesCount = selectedProperty.images.length;
  if (index < 0) {
    currentSlideIndex = slidesCount - 1;
  } else if (index >= slidesCount) {
    currentSlideIndex = 0;
  } else {
    currentSlideIndex = index;
  }
  updateSliderPosition();
}

function updateSliderPosition() {
  const wrapper = document.getElementById("detail-slides-wrapper");
  wrapper.style.transform = `translateX(-${currentSlideIndex * 100}%)`;

  // Update dots
  const dots = document.querySelectorAll(".slider-dot");
  dots.forEach((dot, index) => {
    if (index === currentSlideIndex) {
      dot.classList.add("active");
    } else {
      dot.classList.remove("active");
    }
  });
}

// User Dropdown toggling
function toggleUserDropdown() {
  const dd = document.getElementById("user-dropdown");
  dd.classList.toggle("hidden");
}

// Modal open/close actions
function openLoginModal() {
  document.getElementById("login-modal").classList.remove("hidden");
  document.getElementById("user-dropdown").classList.add("hidden");
  document.getElementById("login-error-msg").classList.add("hidden");
}

function closeLoginModal() {
  document.getElementById("login-modal").classList.add("hidden");
}

function openAboutModal() {
  document.getElementById("about-modal").classList.remove("hidden");
  document.getElementById("user-dropdown").classList.add("hidden");
}

function closeAboutModal() {
  document.getElementById("about-modal").classList.add("hidden");
}

// Admin Authenticate Login
function handleAdminLogin(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-password").value;
  const errorMsg = document.getElementById("login-error-msg");

  if (email === ADMIN_EMAIL && pass === ADMIN_PASSWORD) {
    isAdmin = true;
    sessionStorage.setItem("mialqui_admin", "true");
    closeLoginModal();
    updateAuthUI();
    showAdminDashboard();
  } else {
    errorMsg.classList.remove("hidden");
  }
}

function handleAdminLogout() {
  isAdmin = false;
  sessionStorage.removeItem("mialqui_admin");
  document.getElementById("user-dropdown").classList.add("hidden");
  
  // Clear map picker marker if active
  if (pickerMarker) {
    pickerMarker = null;
  }

  // Restore regular explore view
  document.getElementById("admin-section").classList.add("hidden");
  document.getElementById("listings-section").classList.remove("hidden");
  document.getElementById("map-section").classList.remove("hidden");
  document.getElementById("categories-bar").classList.remove("hidden");
  document.getElementById("btn-floating-toggle").classList.remove("hidden");
  
  // Re-adjust leaflet map size
  setTimeout(() => {
    if (mainMap) mainMap.invalidateSize();
  }, 100);

  updateAuthUI();
}

// Adjust Header & Dropdown menu based on authentication status
function updateAuthUI() {
  const guestGroup = document.getElementById("guest-menu-group");
  const adminGroup = document.getElementById("admin-menu-group");
  const userAvatar = document.querySelector(".user-avatar");

  if (isAdmin) {
    guestGroup.classList.add("hidden");
    adminGroup.classList.remove("hidden");
    userAvatar.style.backgroundColor = "var(--primary)";
  } else {
    guestGroup.classList.remove("hidden");
    adminGroup.classList.add("hidden");
    userAvatar.style.backgroundColor = "var(--text-light)";
  }
}

// Display Admin Section and hide normal explorer
function showAdminDashboard() {
  document.getElementById("listings-section").classList.add("hidden");
  document.getElementById("map-section").classList.add("hidden");
  document.getElementById("categories-bar").classList.add("hidden");
  document.getElementById("admin-section").classList.remove("hidden");
  document.getElementById("user-dropdown").classList.add("hidden");
  document.getElementById("btn-floating-toggle").classList.add("hidden");

  // Show "Mis Publicaciones" view by default
  switchAdminView("list");
  updateHeaderAndTitles();
  renderAdminPropertiesTable();
}

function hideAdminDashboard() {
  document.getElementById("admin-section").classList.add("hidden");
  document.getElementById("listings-section").classList.remove("hidden");
  document.getElementById("map-section").classList.remove("hidden");
  document.getElementById("categories-bar").classList.remove("hidden");
  document.getElementById("btn-floating-toggle").classList.remove("hidden");
  
  // Trigger leaflet redraw
  setTimeout(() => {
    if (mainMap) mainMap.invalidateSize();
  }, 200);
}

function switchAdminView(view) {
  const listView = document.getElementById("admin-view-list");
  const formView = document.getElementById("admin-view-form");
  const btnNavList = document.getElementById("admin-nav-list");
  const btnNavNew = document.getElementById("admin-nav-new");

  if (view === "list") {
    listView.classList.remove("hidden");
    formView.classList.add("hidden");
    btnNavList.classList.add("active");
    btnNavNew.classList.remove("active");
  } else if (view === "form") {
    listView.classList.add("hidden");
    formView.classList.remove("hidden");
    btnNavList.classList.remove("active");
    btnNavNew.classList.add("active");
    
    // Clear and prepare form maps picker
    initPickerMap();
  }
}

// Admin Table CRUD renderer
function renderAdminPropertiesTable() {
  const tbody = document.getElementById("admin-properties-table-body");
  tbody.innerHTML = "";

  properties.forEach(prop => {
    const typeBadgeStyle = prop.type === 'alquiler' 
      ? 'background-color: var(--primary-light); color: var(--primary); padding: 2px 6px; border-radius: 12px; font-weight: 600;' 
      : 'background-color: rgba(244, 63, 94, 0.1); color: var(--accent); padding: 2px 6px; border-radius: 12px; font-weight: 600;';

    const adminFallbackImg = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=200&q=80';
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img class="admin-table-img" src="${(prop.images && prop.images[0]) || adminFallbackImg}" alt="${prop.title}"></td>
      <td>
        <div class="font-semibold">${prop.title}</div>
        <div class="text-muted" style="font-size: 12px;">${prop.location}</div>
      </td>
      <td>
        <div>${prop.category}</div>
        <div style="font-size: 11px; margin-top: 4px;"><span style="${typeBadgeStyle}">${prop.type === 'alquiler' ? 'Alquiler' : 'Venta'}</span></div>
      </td>
      <td>${prop.price.toLocaleString('es-PY')} Gs.${prop.type === 'alquiler' ? ' / mes' : ''}</td>
      <td style="font-size: 12px; color: var(--text-light);">Lat: ${prop.lat.toFixed(4)}<br>Lng: ${prop.lng.toFixed(4)}</td>
      <td>
        <div class="admin-table-actions">
          <button class="btn-action btn-action-edit" onclick="handleEditProperty('${prop.id}')" title="Editar"><i data-lucide="edit-2"></i></button>
          <button class="btn-action btn-action-delete" onclick="handleDeleteProperty('${prop.id}')" title="Eliminar"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  lucide.createIcons();
}

// Admin Map GPS picker integration
function initPickerMap() {
  const mapDivId = "form-map-picker";
  
  // Re-create div to clear map container reference
  const container = document.getElementById(mapDivId);
  const parent = container.parentNode;
  parent.removeChild(container);
  
  const newContainer = document.createElement("div");
  newContainer.id = mapDivId;
  // Insert before lat/lng inputs
  parent.insertBefore(newContainer, parent.querySelector(".form-row-2"));

  // Centered by default on Coronel Oviedo
  let centerLat = -25.4450;
  let centerLng = -56.4440;

  // If we are editing, center on current property coordinates
  const editingId = document.getElementById("form-property-id").value;
  if (editingId) {
    const prop = properties.find(p => String(p.id) === String(editingId));
    if (prop) {
      centerLat = prop.lat;
      centerLng = prop.lng;
    }
  }

  pickerMap = L.map(mapDivId).setView([centerLat, centerLng], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(pickerMap);

  // Initial picker marker if editing
  if (editingId) {
    pickerMarker = L.marker([centerLat, centerLng]).addTo(pickerMap);
  }

  // Handle map click to capture coordinates
  pickerMap.on("click", (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    document.getElementById("form-lat-input").value = lat.toFixed(6);
    document.getElementById("form-lng-input").value = lng.toFixed(6);

    if (pickerMarker) {
      pickerMarker.setLatLng(e.latlng);
    } else {
      pickerMarker = L.marker(e.latlng).addTo(pickerMap);
    }
  });

  // Small delay to let Leaflet render container sizes properly
  setTimeout(() => {
    if (pickerMap) pickerMap.invalidateSize();
  }, 200);
}

// Edit existing property
function handleEditProperty(id) {
  const prop = properties.find(p => String(p.id) === String(id));
  if (!prop) return;

  // Prepare form values
  document.getElementById("form-property-id").value = prop.id;
  document.getElementById("form-title-input").value = prop.title;
  document.getElementById("form-type-input").value = prop.type || "alquiler";
  document.getElementById("form-category-input").value = prop.category;
  document.getElementById("form-price-input").value = prop.price;
  document.getElementById("form-location-input").value = prop.location;
  document.getElementById("form-phone-input").value = prop.phone || ADMIN_WHATSAPP;
  document.getElementById("form-desc-input").value = prop.description;
  document.getElementById("form-lat-input").value = prop.lat;
  document.getElementById("form-lng-input").value = prop.lng;

  // New fields
  document.getElementById("form-contactname-input").value = prop.nombre_contacto || '';
  document.getElementById("form-ciudad-input").value = prop.ciudad || 'Coronel Oviedo';
  document.getElementById("form-barrio-input").value = prop.barrio || '';
  document.getElementById("form-habitaciones-input").value = prop.habitaciones || '';
  document.getElementById("form-banos-input").value = prop.banos || '';
  document.getElementById("form-cochera-input").value = prop.cochera || '';
  document.getElementById("form-superficie-input").value = prop.superficie || '';

  // Form Photos inputs
  const imgInputs = document.querySelectorAll(".form-image-url");
  imgInputs.forEach((input, index) => {
    input.value = (prop.images && prop.images[index]) || "";
  });

  // Services checkboxes
  const checkboxes = document.querySelectorAll("#amenities-checkboxes-container input");
  checkboxes.forEach(cb => {
    cb.checked = (prop.amenities || []).includes(cb.value);
  });

  // Switch header
  document.getElementById("form-title").textContent = prop.type === "alquiler" ? "Editar Alquiler" : "Editar Venta";
  const submitBtn = document.getElementById("btn-submit-property");
  if (submitBtn) {
    submitBtn.textContent = prop.type === "alquiler" ? "Guardar Alquiler" : "Guardar Venta";
  }
  const formPriceLabel = document.getElementById("form-price-label");
  if (formPriceLabel) {
    formPriceLabel.textContent = prop.type === "alquiler" ? "Precio Mensual (Gs.)" : "Precio de Venta (Gs.)";
  }
  switchAdminView("form");
}

// Delete listing property
async function handleDeleteProperty(id) {
  const prop = properties.find(p => String(p.id) === String(id));
  if (!prop) return;

  if (confirm(`¿Estás seguro de que deseas eliminar la propiedad "${prop.title}"?`)) {
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('propiedades')
        .delete()
        .eq('id', String(id));
        
      if (error) {
        console.error("Error deleting property from Supabase:", error);
        alert("Error al eliminar la propiedad en Supabase: " + error.message);
        return;
      }
    }

    properties = properties.filter(p => String(p.id) !== String(id));
    favorites = favorites.filter(favId => String(favId) !== String(id));
    saveFavoritesState();
    savePropertiesState();
  }
}

// Save form handler (Create or Update)
async function handlePropertyFormSubmit(event) {
  event.preventDefault();

  const id = document.getElementById("form-property-id").value;
  const title = document.getElementById("form-title-input").value;
  const type = document.getElementById("form-type-input").value;
  const category = document.getElementById("form-category-input").value;
  const price = parseInt(document.getElementById("form-price-input").value);
  const location = document.getElementById("form-location-input").value;
  const phone = document.getElementById("form-phone-input").value.trim() || ADMIN_WHATSAPP;
  const description = document.getElementById("form-desc-input").value;
  const lat = parseFloat(document.getElementById("form-lat-input").value);
  const lng = parseFloat(document.getElementById("form-lng-input").value);

  // New fields
  const nombre_contacto = document.getElementById("form-contactname-input").value.trim();
  const ciudad = document.getElementById("form-ciudad-input").value.trim() || 'Coronel Oviedo';
  const barrio = document.getElementById("form-barrio-input").value.trim();
  const habitaciones = parseInt(document.getElementById("form-habitaciones-input").value) || null;
  const banos = parseInt(document.getElementById("form-banos-input").value) || null;
  const cochera = parseInt(document.getElementById("form-cochera-input").value) || null;
  const superficie = parseInt(document.getElementById("form-superficie-input").value) || null;

  // Compile image URLs list
  const images = [];
  document.querySelectorAll(".form-image-url").forEach(input => {
    if (input.value.trim() !== "") {
      images.push(input.value.trim());
    }
  });
  if (images.length === 0) {
    images.push("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80");
  }

  // Compile services checklist
  const amenities = [];
  document.querySelectorAll("#amenities-checkboxes-container input:checked").forEach(cb => {
    amenities.push(cb.value);
  });

  // Build Supabase DB payload with correct column names
  const dbPayload = {
    titulo: title,
    descripcion: description,
    tipo_operacion: type,
    categoria: mapCategoryToDb(category),
    precio: price,
    pais: 'Paraguay',
    departamento: 'Caaguaz\u00fa',
    ciudad,
    barrio,
    direccion: location,
    latitud: lat,
    longitud: lng,
    habitaciones,
    cochera,
    superficie,
    servicios: amenities,
    whatsapp_contacto: phone,
    nombre_contacto,
    destacada: false,
    disponible: 'disponible'
  };
  dbPayload['ba\u00f1os'] = banos; // baños with ñ

  try {
    if (id) {
      // UPDATE MODE
      const index = properties.findIndex(p => String(p.id) === String(id));
      if (index !== -1) {
        const updatedProp = {
          ...properties[index],
          title, category, type, price, phone, location, description, lat, lng,
          images, amenities, nombre_contacto, ciudad, barrio, habitaciones, banos, cochera, superficie
        };

        if (supabaseClient) {
          const { error } = await supabaseClient
            .from('propiedades')
            .update(dbPayload)
            .eq('id', String(id));

          if (error) {
            console.error("Error updating property in Supabase:", error);
            alert("Hubo un error al guardar los cambios en Supabase: " + error.message);
            return;
          }
        }

        properties[index] = updatedProp;
        alert(type === "alquiler" ? "Alquiler actualizado con éxito." : "Venta actualizada con éxito.");
      }
    } else {
      // CREATE MODE - let Supabase generate the UUID
      let newId = null;

      if (supabaseClient) {
        const { data: insertedData, error } = await supabaseClient
          .from('propiedades')
          .insert([dbPayload])
          .select('id')
          .single();

        if (error) {
          console.error("Error creating property in Supabase:", error);
          alert("Hubo un error al guardar la propiedad en Supabase: " + error.message);
          return;
        }

        newId = insertedData ? insertedData.id : String(Date.now());
      } else {
        newId = String(Date.now());
      }

      const newProp = {
        id: newId,
        title, category, type, price, phone, location, lat, lng,
        rating: 5.0, reviewsCount: 0, description, images, amenities,
        nombre_contacto, ciudad, barrio, habitaciones, banos, cochera, superficie
      };

      properties.unshift(newProp);
      alert(type === "alquiler" ? "Nuevo alquiler agregado con éxito." : "Nueva venta agregada con éxito.");
    }

    // Reset form
    resetPropertyForm();
    
    // Persist State
    savePropertiesState();

    // Return to table list
    switchAdminView("list");
  } catch (err) {
    console.error("Error saving property:", err);
    alert("Hubo un error al guardar la propiedad: " + err.message);
  }
}

function resetPropertyForm() {
  document.getElementById("property-form").reset();
  document.getElementById("form-property-id").value = "";
  document.getElementById("form-title").textContent = currentType === "alquiler" ? "Crear Nuevo Alquiler" : "Crear Nueva Venta";
  document.getElementById("form-type-input").value = currentType;
  
  const submitBtn = document.getElementById("btn-submit-property");
  if (submitBtn) {
    submitBtn.textContent = currentType === "alquiler" ? "Guardar Alquiler" : "Guardar Venta";
  }
  const formPriceLabel = document.getElementById("form-price-label");
  if (formPriceLabel) {
    formPriceLabel.textContent = currentType === "alquiler" ? "Precio Mensual (Gs.)" : "Precio de Venta (Gs.)";
  }

  if (pickerMarker) {
    pickerMarker = null;
  }
}

// Search Dropdown interactions
function toggleSearchDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById("search-dropdown");
  dropdown.classList.toggle("hidden");
}

function handleSearchApply() {
  const inputText = document.getElementById("search-input-text").value.trim();
  const inputPrice = parseInt(document.getElementById("search-price-range").value);

  searchQuery = inputText;
  maxPrice = inputPrice;

  // Toggle filter descriptions labels
  const priceLabel = document.getElementById("price-filter-label");
  const maxLimit = currentType === "alquiler" ? 5000000 : 2000000000;
  if (maxPrice < maxLimit) {
    priceLabel.textContent = `â‰¤ ${maxPrice.toLocaleString('es-PY')} Gs.`;
  } else {
    priceLabel.textContent = "Cualquiera";
  }

  document.getElementById("search-dropdown").classList.add("hidden");
  renderProperties();
}

function handleSearchClear() {
  document.getElementById("search-input-text").value = "";
  
  searchQuery = "";
  maxPrice = currentType === "alquiler" ? 5000000 : 2000000000;
  updatePriceSliderBounds();
  
  document.getElementById("search-dropdown").classList.add("hidden");
  renderProperties();
}

// Switch mobile view (list or map)
function switchMobileView(view) {
  const mainLayout = document.getElementById("main-layout");
  const toggleBtn = document.getElementById("btn-floating-toggle");
  if (!mainLayout || !toggleBtn) return;
  
  if (view === "list") {
    mainLayout.classList.remove("show-map-view");
    toggleBtn.innerHTML = `<i data-lucide="map"></i><span>Ver Mapa</span>`;
  } else if (view === "map") {
    mainLayout.classList.add("show-map-view");
    toggleBtn.innerHTML = `<i data-lucide="list"></i><span>Ver Lista</span>`;

    // Leaflet tiles break when the container was hidden during init.
    // We must call invalidateSize() so it recalculates, then re-center.
    setTimeout(() => {
      if (!mainMap) return;

      // Step 1: force tile recalculation
      mainMap.invalidateSize({ animate: false });

      // Step 2: re-center on Coronel Oviedo (or fit visible markers)
      const filtered = getFilteredProperties();
      const markerCoords = filtered
        .filter(p => p.lat && p.lng)
        .map(p => [p.lat, p.lng]);

      if (markerCoords.length > 0 && filtered.length < properties.length) {
        // If there's an active filter, fit to those markers
        mainMap.fitBounds(markerCoords, { padding: [40, 40], animate: false });
      } else {
        // Default: center on Coronel Oviedo
        mainMap.setView([-25.4450, -56.4440], 13.5, { animate: false });
      }
    }, 150);
  }
  lucide.createIcons();
}

// Toggle between listings and map view
function toggleMapView() {
  const mainLayout = document.getElementById("main-layout");
  if (!mainLayout) return;
  const isMapActive = mainLayout.classList.contains("show-map-view");
  switchMobileView(isMapActive ? "list" : "map");
}

// Initialize User actions & Modal click listeners
function initEventListeners() {
  // Publication Type Switcher (Alquileres / Ventas)
  const switcher = document.getElementById("header-type-switcher");
  if (switcher) {
    switcher.addEventListener("click", (e) => {
      const btn = e.target.closest(".type-btn");
      if (!btn) return;
      
      const newType = btn.dataset.type;
      if (newType === currentType) return;
      
      switcher.querySelectorAll(".type-btn").forEach(el => el.classList.remove("active"));
      btn.classList.add("active");
      
      changeType(newType);
    });
  }

  // Brand Logo Click resets everything
  document.getElementById("btn-logo").addEventListener("click", () => {
    resetFilters();
    hideAdminDashboard();
    
    // Revert view toggle state
    const mainLayout = document.getElementById("main-layout");
    mainLayout.classList.remove("show-map-view");
    document.getElementById("btn-floating-toggle").innerHTML = `<i data-lucide="map"></i><span>Ver Mapa</span>`;
    lucide.createIcons();
  });

  // User menu click
  document.getElementById("btn-user-menu").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleUserDropdown();
  });

  // User menu click out closer
  document.addEventListener("click", (e) => {
    const dd = document.getElementById("user-dropdown");
    const menuBtn = document.getElementById("btn-user-menu");
    if (!dd.classList.contains("hidden") && !dd.contains(e.target) && !menuBtn.contains(e.target)) {
      dd.classList.add("hidden");
    }

    const searchDd = document.getElementById("search-dropdown");
    const searchTrigger = document.getElementById("search-bar-trigger");
    if (!searchDd.classList.contains("hidden") && !searchDd.contains(e.target) && !searchTrigger.contains(e.target)) {
      searchDd.classList.add("hidden");
    }
  });

  // Theme switcher
  document.getElementById("btn-theme-toggle").addEventListener("click", toggleTheme);

  // Search trigger bar click
  document.getElementById("search-bar-trigger").addEventListener("click", toggleSearchDropdown);
  document.getElementById("search-dropdown").addEventListener("click", (e) => e.stopPropagation());

  // Search actions click
  document.getElementById("btn-apply-search").addEventListener("click", handleSearchApply);
  document.getElementById("btn-clear-search").addEventListener("click", handleSearchClear);

  // Live price range display
  const priceRange = document.getElementById("search-price-range");
  priceRange.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    const maxLimit = currentType === "alquiler" ? 5000000 : 2000000000;
    document.getElementById("price-slider-current").textContent = val >= maxLimit ? "Cualquiera" : `${val.toLocaleString('es-PY')} Gs.`;
  });

  // Detail Modal closer
  document.getElementById("btn-close-detail").addEventListener("click", closePropertyDetail);
  document.getElementById("detail-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("detail-modal")) closePropertyDetail();
  });

  // Image detail slider arrows
  document.getElementById("btn-slide-left").addEventListener("click", () => goToSlide(currentSlideIndex - 1));
  document.getElementById("btn-slide-right").addEventListener("click", () => goToSlide(currentSlideIndex + 1));

  // Admin login actions
  document.getElementById("btn-open-login").addEventListener("click", openLoginModal);
  document.getElementById("btn-close-login").addEventListener("click", closeLoginModal);
  document.getElementById("login-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("login-modal")) closeLoginModal();
  });
  document.getElementById("login-form").addEventListener("submit", handleAdminLogin);

  // About modal actions
  document.getElementById("btn-about").addEventListener("click", openAboutModal);
  document.getElementById("btn-close-about").addEventListener("click", closeAboutModal);
  document.getElementById("btn-close-about-ok").addEventListener("click", closeAboutModal);
  document.getElementById("about-modal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("about-modal")) closeAboutModal();
  });

  // Admin navigation sidebar
  document.getElementById("admin-nav-list").addEventListener("click", () => {
    resetPropertyForm();
    switchAdminView("list");
  });
  document.getElementById("admin-nav-new").addEventListener("click", () => {
    resetPropertyForm();
    switchAdminView("form");
  });

  // Back to explore buttons inside admin menu
  document.getElementById("btn-goto-explore").addEventListener("click", () => {
    hideAdminDashboard();
    switchMobileView("list");
  });
  document.getElementById("btn-goto-admin").addEventListener("click", showAdminDashboard);
  document.getElementById("btn-logout").addEventListener("click", handleAdminLogout);
  
  // Dashboard shortcuts
  document.getElementById("btn-admin-add-shortcut").addEventListener("click", () => {
    resetPropertyForm();
    switchAdminView("form");
  });
  document.getElementById("btn-cancel-form").addEventListener("click", () => switchAdminView("list"));
  document.getElementById("btn-cancel-form-2").addEventListener("click", () => switchAdminView("list"));

  // Property Form Submit
  document.getElementById("property-form").addEventListener("submit", handlePropertyFormSubmit);

  // Floating view toggle action
  document.getElementById("btn-floating-toggle").addEventListener("click", toggleMapView);
}

