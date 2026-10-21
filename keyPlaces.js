/**
 * Key Places (Lugares Clave) Module for Mi Alqui
 * Independent map layer, state management, and Admin CRUD.
 * Does NOT alter or interfere with properties (alquileres) layer.
 */

window.KeyPlacesModule = (function () {
  // Category configurations with distinct theme colors and icons
  const CATEGORY_CONFIG = {
    "Universidad": { icon: "🎓", label: "Universidades", color: "#6366f1", bg: "#eef2ff" },
    "Plaza": { icon: "🌳", label: "Plazas y Parques", color: "#10b981", bg: "#ecfdf5" },
    "Supermercado": { icon: "🛒", label: "Supermercados", color: "#f59e0b", bg: "#fffbeb" },
    "Salud": { icon: "🏥", label: "Hospitales y Salud", color: "#ef4444", bg: "#fef2f2" },
    "Transporte": { icon: "🚌", label: "Terminal y Transporte", color: "#0ea5e9", bg: "#f0f9ff" },
    "Colegio": { icon: "📚", label: "Colegios y Escuelas", color: "#8b5cf6", bg: "#f5f3ff" },
    "Comercio": { icon: "🏪", label: "Comercios y Shopping", color: "#ec4899", bg: "#fdf2f8" },
    "Otro": { icon: "📍", label: "Otros Puntos de Interés", color: "#64748b", bg: "#f8fafc" }
  };

  // Seed Data: Iconic key locations in Coronel Oviedo, Paraguay
  const INITIAL_KEY_PLACES = [
    {
      id: "place-1",
      nombre: "UNCA - Campus Universitario",
      categoria: "Universidad",
      direccion: "Campus Universitario, Barrio Santa María",
      descripcion: "Sede central de la Universidad Nacional de Caaguazú con diversas facultades.",
      latitud: -25.4328,
      longitud: -56.4312
    },
    {
      id: "place-2",
      nombre: "UNVES - Sede Coronel Oviedo",
      categoria: "Universidad",
      direccion: "Zona UNVES, Acceso Ruta PY02",
      descripcion: "Sede universitaria pública con carreras agrarias, de salud y empresariales.",
      latitud: -25.4610,
      longitud: -56.4270
    },
    {
      id: "place-3",
      nombre: "Plaza José Segundo Decoud",
      categoria: "Plaza",
      direccion: "Centro Histórico (frente a la Catedral)",
      descripcion: "Plaza principal en el corazón de la ciudad, pulmón verde y punto de encuentro cívico.",
      latitud: -25.4455,
      longitud: -56.4408
    },
    {
      id: "place-4",
      nombre: "Supermercado Herrero (Casa Central)",
      categoria: "Supermercado",
      direccion: "Mariscal Estigarribia c/ Tuyutí",
      descripcion: "Supermercado tradicional con amplio surtido de alimentos, bazar y rotisería.",
      latitud: -25.4442,
      longitud: -56.4425
    },
    {
      id: "place-5",
      nombre: "Supermercado Stock Coronel Oviedo",
      categoria: "Supermercado",
      direccion: "Avda. Dr. Juan Manuel Frutos c/ Ruta PY02",
      descripcion: "Cadena de supermercados 24hs con patio de comidas, farmacia y cajeros automáticos.",
      latitud: -25.4498,
      longitud: -56.4485
    },
    {
      id: "place-6",
      nombre: "Hospital Regional de Coronel Oviedo",
      categoria: "Salud",
      direccion: "Barrio Azucena",
      descripcion: "Centro hospitalario de referencia departamental con guardias de urgencias 24/7.",
      latitud: -25.4480,
      longitud: -56.4365
    },
    {
      id: "place-7",
      nombre: "Terminal de Ómnibus de Coronel Oviedo",
      categoria: "Transporte",
      direccion: "Avda. Principal cerca del Cruce Internacional",
      descripcion: "Terminal de transporte con buses de corta, media y larga distancia nacional e internacional.",
      latitud: -25.4535,
      longitud: -56.4490
    },
    {
      id: "place-8",
      nombre: "Rotonda Cruce Internacional (PY02 / PY08)",
      categoria: "Transporte",
      direccion: "Intersección Ruta PY02 y PY08",
      descripcion: "Eje neurálgico del país que conecta Asunción, Ciudad del Este y el norte chaqueño.",
      latitud: -25.4540,
      longitud: -56.4510
    }
  ];

  // State
  let keyPlaces = [];
  let keyPlacesVisible = true;
  let selectedCategory = "Todos";
  let mapInstance = null;
  let keyPlacesLayer = null;
  let placePickerMap = null;
  let placePickerMarker = null;

  // Supabase reference helper (uses window.supabaseClient if initialized in app.js)
  function getSupabase() {
    return window.supabaseClient || (window.supabase ? window.supabase : null);
  }

  // 1. Load Data (Parallel compatible)
  async function loadKeyPlaces() {
    // Restore user toggle preference
    const savedVisibility = localStorage.getItem("mialqui_places_visible");
    if (savedVisibility !== null) {
      keyPlacesVisible = savedVisibility === "true";
    }

    const sb = getSupabase();
    if (!sb || typeof sb.from !== "function") {
      const savedLocal = localStorage.getItem("mialqui_key_places");
      keyPlaces = savedLocal ? JSON.parse(savedLocal) : INITIAL_KEY_PLACES;
      saveLocal();
      return keyPlaces;
    }

    try {
      const { data, error } = await sb
        .from("lugares_clave")
        .select("*")
        .order("created_at", { ascending: true });

      if (error || !data || data.length === 0) {
        // Fallback to local storage or initial seeds
        const savedLocal = localStorage.getItem("mialqui_key_places");
        keyPlaces = savedLocal ? JSON.parse(savedLocal) : INITIAL_KEY_PLACES;
        saveLocal();

        // Seed Supabase if empty table exists
        if (!error && (!data || data.length === 0)) {
          for (const item of INITIAL_KEY_PLACES) {
            await sb.from("lugares_clave").insert([{
              nombre: item.nombre,
              categoria: item.categoria,
              direccion: item.direccion,
              descripcion: item.descripcion,
              latitud: item.latitud,
              longitud: item.longitud,
              color: CATEGORY_CONFIG[item.categoria]?.color || "#6366f1"
            }]);
          }
        }
      } else {
        keyPlaces = data.map(d => ({
          id: d.id,
          nombre: d.nombre,
          categoria: d.categoria,
          direccion: d.direccion || "",
          descripcion: d.descripcion || "",
          latitud: Number(d.latitud),
          longitud: Number(d.longitud)
        }));
        saveLocal();
      }
    } catch (err) {
      console.warn("Exception fetching lugares_clave from Supabase:", err);
      const savedLocal = localStorage.getItem("mialqui_key_places");
      keyPlaces = savedLocal ? JSON.parse(savedLocal) : INITIAL_KEY_PLACES;
      saveLocal();
    }

    return keyPlaces;
  }

  function saveLocal() {
    localStorage.setItem("mialqui_key_places", JSON.stringify(keyPlaces));
  }

  // 2. Initialize Layer on the Interactive Map
  function initMapLayer(map) {
    if (!map) return;
    mapInstance = map;

    // Create independent Leaflet Layer Group for key places
    if (!keyPlacesLayer) {
      keyPlacesLayer = L.layerGroup();
    }
    keyPlacesLayer.addTo(mapInstance);

    // Mount or ensure the floating widget exists
    setupFloatingWidget();

    // Render markers on the layer
    renderMarkers();
  }

  // 3. Render Floating Map Controls
  function setupFloatingWidget() {
    const mapSection = document.getElementById("map-section");
    if (!mapSection) return;

    // Remove existing if already present
    let widget = document.getElementById("key-places-floating-widget");
    if (!widget) {
      widget = document.createElement("div");
      widget.id = "key-places-floating-widget";
      widget.className = "key-places-floating-widget";
      mapSection.appendChild(widget);
    }

    const categoriesList = ["Todos", ...Object.keys(CATEGORY_CONFIG)];

    widget.innerHTML = `
      <div class="kp-widget-header">
        <div class="kp-widget-title-area">
          <div class="kp-icon-badge">
            <i data-lucide="map-pin"></i>
          </div>
          <div>
            <div class="kp-widget-title">Lugares Clave</div>
          </div>
          <span class="kp-count-badge" id="kp-active-count">${keyPlaces.length}</span>
        </div>
        <label class="kp-toggle-switch" title="Mostrar u ocultar lugares clave">
          <input type="checkbox" id="kp-toggle-checkbox" ${keyPlacesVisible ? "checked" : ""}>
          <span class="kp-slider"></span>
        </label>
      </div>

      <div class="kp-categories-container ${!keyPlacesVisible ? "collapsed" : ""}" id="kp-categories-chips">
        ${categoriesList.map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          const dotHtml = cfg ? `<span class="kp-chip-dot" style="background-color: ${cfg.color}"></span>` : "";
          const icon = cfg ? cfg.icon + " " : "";
          return `
            <button type="button" class="kp-chip ${cat === selectedCategory ? "active" : ""}" data-category="${cat}">
              ${dotHtml} ${icon}${cat === "Todos" ? "Todos" : cat}
            </button>
          `;
        }).join("")}
      </div>
    `;

    // Initialize Lucide icons inside widget
    if (window.lucide) {
      window.lucide.createIcons({
        root: widget
      });
    }

    // Bind Toggle Switch Event
    const toggleCheckbox = document.getElementById("kp-toggle-checkbox");
    if (toggleCheckbox) {
      toggleCheckbox.addEventListener("change", (e) => {
        toggleVisibility(e.target.checked);
      });
    }

    // Bind Category Chips Events
    const chipsContainer = document.getElementById("kp-categories-chips");
    if (chipsContainer) {
      chipsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".kp-chip");
        if (!btn) return;
        const cat = btn.dataset.category;
        setCategoryFilter(cat);
      });
    }
  }

  // 4. Render Markers on the Map Layer
  function renderMarkers() {
    if (!keyPlacesLayer) return;

    // Clear current places layer
    keyPlacesLayer.clearLayers();

    // Update counter in widget
    const countBadge = document.getElementById("kp-active-count");

    // If turned off, exit early (markers are completely hidden)
    if (!keyPlacesVisible) {
      if (countBadge) countBadge.textContent = "0";
      return;
    }

    // Filter by selected category
    const filteredPlaces = keyPlaces.filter(place => {
      if (selectedCategory === "Todos") return true;
      return place.categoria === selectedCategory;
    });

    if (countBadge) {
      countBadge.textContent = filteredPlaces.length;
    }

    // Add pins to keyPlacesLayer
    filteredPlaces.forEach(place => {
      const cfg = CATEGORY_CONFIG[place.categoria] || CATEGORY_CONFIG["Otro"];
      const iconEmoji = cfg.icon;
      const themeColor = cfg.color;

      // Custom Leaflet DivIcon with pin style and category color
      const customPinIcon = L.divIcon({
        className: "kp-custom-pin-wrapper",
        html: `
          <div class="kp-marker-pin" style="background: ${themeColor};">
            <div class="kp-marker-content">${iconEmoji}</div>
            <div class="kp-marker-pulse" style="border: 2px solid ${themeColor};"></div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38]
      });

      const marker = L.marker([place.latitud, place.longitud], {
        icon: customPinIcon,
        riseOnHover: true
      });

      // Rich Popup
      const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitud},${place.longitud}`;
      const popupHtml = `
        <div class="kp-popup-card">
          <span class="kp-popup-category-badge" style="background-color: ${themeColor};">
            ${iconEmoji} ${place.categoria}
          </span>
          <div class="kp-popup-title">${place.nombre}</div>
          ${place.descripcion ? `<div class="kp-popup-desc">${place.descripcion}</div>` : ""}
          <div class="kp-popup-address">
            📍 <span>${place.direccion || "Coronel Oviedo"}</span>
          </div>
          <div class="kp-popup-actions">
            <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="kp-popup-btn">
              🗺️ Ver en Google Maps
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 260,
        className: "kp-leaflet-popup"
      });

      keyPlacesLayer.addLayer(marker);
    });
  }

  // 5. Toggle Layer Visibility
  function toggleVisibility(visible) {
    keyPlacesVisible = visible;
    localStorage.setItem("mialqui_places_visible", String(visible));

    // Collapse/expand category container
    const chipsContainer = document.getElementById("kp-categories-chips");
    if (chipsContainer) {
      if (visible) {
        chipsContainer.classList.remove("collapsed");
      } else {
        chipsContainer.classList.add("collapsed");
      }
    }

    const toggleCheckbox = document.getElementById("kp-toggle-checkbox");
    if (toggleCheckbox) {
      toggleCheckbox.checked = visible;
    }

    renderMarkers();
  }

  // 6. Set Category Filter
  function setCategoryFilter(category) {
    selectedCategory = category;

    // Update active class on chips
    const chips = document.querySelectorAll("#kp-categories-chips .kp-chip");
    chips.forEach(chip => {
      if (chip.dataset.category === category) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });

    renderMarkers();
  }

  // 7. Admin CRUD: Render Table
  function renderAdminTable() {
    const tbody = document.getElementById("admin-places-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (keyPlaces.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center" style="padding: 24px; color: var(--text-muted);">
            No hay lugares clave registrados. Haz clic en "Nuevo Lugar Clave" para agregar uno.
          </td>
        </tr>
      `;
      return;
    }

    keyPlaces.forEach(place => {
      const cfg = CATEGORY_CONFIG[place.categoria] || CATEGORY_CONFIG["Otro"];
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <span class="kp-category-pill" style="background-color: ${cfg.bg}; color: ${cfg.color}; border-color: ${cfg.color}33;">
            ${cfg.icon} ${place.categoria}
          </span>
        </td>
        <td>
          <div class="font-semibold">${place.nombre}</div>
          <div class="text-muted" style="font-size: 12px;">${place.descripcion || "Sin descripción"}</div>
        </td>
        <td>
          <div style="font-size: 13px;">${place.direccion || "Coronel Oviedo"}</div>
        </td>
        <td>
          <div style="font-family: monospace; font-size: 11px; color: var(--text-light);">
            ${Number(place.latitud).toFixed(4)}, ${Number(place.longitud).toFixed(4)}
          </div>
        </td>
        <td>
          <div class="admin-table-actions">
            <button type="button" class="btn-action btn-action-edit" data-edit-place="${place.id}" title="Editar">
              <i data-lucide="edit-2"></i>
            </button>
            <button type="button" class="btn-action btn-action-delete" data-delete-place="${place.id}" title="Eliminar">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    if (window.lucide) {
      window.lucide.createIcons({ root: tbody });
    }
  }

  // 8. Admin CRUD: Initialize Map Picker for Place Location
  function initPlacePickerMap(initialLat, initialLng) {
    const pickerDiv = document.getElementById("form-place-map-picker");
    if (!pickerDiv) return;

    const latVal = initialLat || -25.4450;
    const lngVal = initialLng || -56.4440;

    // Reset div to remove existing Leaflet instance if any
    const parent = pickerDiv.parentNode;
    const newDiv = document.createElement("div");
    newDiv.id = "form-place-map-picker";
    parent.replaceChild(newDiv, pickerDiv);

    placePickerMap = L.map("form-place-map-picker").setView([latVal, lngVal], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(placePickerMap);

    const pinIcon = L.divIcon({
      className: "kp-picker-pin",
      html: `<div style="background:#ef4444; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:14px;">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    placePickerMarker = L.marker([latVal, lngVal], {
      draggable: true,
      icon: pinIcon
    }).addTo(placePickerMap);

    function updateInputs(lat, lng) {
      const latInp = document.getElementById("form-place-lat");
      const lngInp = document.getElementById("form-place-lng");
      if (latInp) latInp.value = Number(lat).toFixed(6);
      if (lngInp) lngInp.value = Number(lng).toFixed(6);
    }

    updateInputs(latVal, lngVal);

    placePickerMarker.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      updateInputs(pos.lat, pos.lng);
    });

    placePickerMap.on("click", (e) => {
      placePickerMarker.setLatLng(e.latlng);
      updateInputs(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => {
      placePickerMap.invalidateSize();
    }, 200);
  }

  // 9. Admin CRUD: Open Form (Create / Edit)
  function openCreateForm() {
    const titleEl = document.getElementById("place-form-title");
    if (titleEl) titleEl.textContent = "Crear Nuevo Lugar Clave";

    document.getElementById("form-place-id").value = "";
    document.getElementById("form-place-name").value = "";
    document.getElementById("form-place-category").value = "Universidad";
    document.getElementById("form-place-address").value = "";
    document.getElementById("form-place-desc").value = "";

    if (typeof window.switchAdminView === "function") {
      window.switchAdminView("place-form");
    }
  }

  function openEditForm(id) {
    const place = keyPlaces.find(p => String(p.id) === String(id));
    if (!place) return;

    const titleEl = document.getElementById("place-form-title");
    if (titleEl) titleEl.textContent = `Editar: ${place.nombre}`;

    document.getElementById("form-place-id").value = place.id;
    document.getElementById("form-place-name").value = place.nombre;
    document.getElementById("form-place-category").value = place.categoria;
    document.getElementById("form-place-address").value = place.direccion || "";
    document.getElementById("form-place-desc").value = place.descripcion || "";

    if (typeof window.switchAdminView === "function") {
      window.switchAdminView("place-form");
    }

    setTimeout(() => {
      initPlacePickerMap(place.latitud, place.longitud);
    }, 100);
  }

  // 10. Admin CRUD: Delete Place
  async function deletePlace(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este lugar clave?")) return;

    const sb = getSupabase();
    if (sb && typeof sb.from === "function") {
      try {
        await sb.from("lugares_clave").delete().eq("id", id);
      } catch (e) {
        console.warn("Could not delete from Supabase:", e);
      }
    }

    keyPlaces = keyPlaces.filter(p => String(p.id) !== String(id));
    saveLocal();

    // Re-render admin table and map layer in real-time
    renderAdminTable();
    renderMarkers();
  }

  // 11. Admin CRUD: Save Form (Create / Update)
  async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById("form-place-id").value;
    const nombre = document.getElementById("form-place-name").value.trim();
    const categoria = document.getElementById("form-place-category").value;
    const direccion = document.getElementById("form-place-address").value.trim();
    const descripcion = document.getElementById("form-place-desc").value.trim();
    const latitud = parseFloat(document.getElementById("form-place-lat").value);
    const longitud = parseFloat(document.getElementById("form-place-lng").value);

    if (!nombre || isNaN(latitud) || isNaN(longitud)) {
      alert("Por favor completa el nombre y las coordenadas válidas en el mapa.");
      return;
    }

    const payload = {
      nombre,
      categoria,
      direccion,
      descripcion,
      latitud,
      longitud,
      color: CATEGORY_CONFIG[categoria]?.color || "#6366f1"
    };

    const sb = getSupabase();
    if (id) {
      // Update existing
      if (sb && typeof sb.from === "function") {
        try {
          await sb.from("lugares_clave").update(payload).eq("id", id);
        } catch (err) {
          console.warn("Error updating place in Supabase:", err);
        }
      }

      const index = keyPlaces.findIndex(p => String(p.id) === String(id));
      if (index !== -1) {
        keyPlaces[index] = { ...keyPlaces[index], ...payload };
      }
    } else {
      // Create new
      let newId = "place-" + Date.now();
      if (sb && typeof sb.from === "function") {
        try {
          const { data, error } = await sb.from("lugares_clave").insert([payload]).select();
          if (!error && data && data[0]) {
            newId = data[0].id;
          }
        } catch (err) {
          console.warn("Error inserting place in Supabase:", err);
        }
      }

      keyPlaces.unshift({
        id: newId,
        ...payload
      });
    }

    saveLocal();

    // Re-render in real-time
    renderAdminTable();
    renderMarkers();

    // Return to places table view
    if (typeof window.switchAdminView === "function") {
      window.switchAdminView("places");
    }
  }

  // 12. Bind Admin Panel Events
  function initAdminEvents() {
    // Add new place button
    const btnAdd = document.getElementById("btn-admin-add-place");
    if (btnAdd) {
      btnAdd.addEventListener("click", openCreateForm);
    }

    // Cancel buttons
    const btnCancel = document.getElementById("btn-cancel-place-form");
    if (btnCancel) {
      btnCancel.addEventListener("click", () => {
        if (typeof window.switchAdminView === "function") {
          window.switchAdminView("places");
        }
      });
    }

    // Table actions delegation (Edit / Delete)
    const tbody = document.getElementById("admin-places-table-body");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const editBtn = e.target.closest("[data-edit-place]");
        if (editBtn) {
          openEditForm(editBtn.dataset.editPlace);
          return;
        }

        const deleteBtn = e.target.closest("[data-delete-place]");
        if (deleteBtn) {
          deletePlace(deleteBtn.dataset.deletePlace);
        }
      });
    }

    // Place Form Submit
    const placeForm = document.getElementById("place-form");
    if (placeForm) {
      placeForm.addEventListener("submit", handleFormSubmit);
    }

    // Nav Item Click: Lugares Clave
    const navPlaces = document.getElementById("admin-nav-places");
    if (navPlaces) {
      navPlaces.addEventListener("click", () => {
        if (typeof window.switchAdminView === "function") {
          window.switchAdminView("places");
        }
      });
    }
  }

  // Public Module API
  return {
    loadKeyPlaces,
    initMapLayer,
    renderMarkers,
    toggleVisibility,
    setCategoryFilter,
    renderAdminTable,
    initPlacePickerMap,
    initAdminEvents,
    openCreateForm,
    openEditForm,
    deletePlace,
    getKeyPlaces: () => keyPlaces
  };
})();
