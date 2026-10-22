/**
 * Key Places (Lugares Claves) Module for Mi Alqui
 * Simplified schema: id, name, latitude, longitude, created_at.
 * Markers render as pills/badges identical to rental price markers.
 * Layer is toggleable via a floating switch without affecting rental properties.
 */

window.KeyPlacesModule = (function () {
  // Initial seed data with iconic locations in Coronel Oviedo
  const INITIAL_KEY_PLACES = [
    { id: "kp-1", name: "UNCA", latitude: -25.4328, longitude: -56.4312 },
    { id: "kp-2", name: "UNVES", latitude: -25.4610, longitude: -56.4270 },
    { id: "kp-3", name: "Plaza San Pedro", latitude: -25.4455, longitude: -56.4408 },
    { id: "kp-4", name: "Superseis", latitude: -25.4442, longitude: -56.4425 },
    { id: "kp-5", name: "Supermercado Stock", latitude: -25.4498, longitude: -56.4485 },
    { id: "kp-6", name: "Hospital Regional", latitude: -25.4480, longitude: -56.4365 },
    { id: "kp-7", name: "Terminal de Ómnibus", latitude: -25.4535, longitude: -56.4490 },
    { id: "kp-8", name: "Rotonda Cruce", latitude: -25.4540, longitude: -56.4510 }
  ];

  // State
  let keyPlaces = [];
  let keyPlacesVisible = true;
  let mapInstance = null;
  let keyPlacesLayer = null;
  let placePickerMap = null;
  let placePickerMarker = null;

  function getSupabase() {
    return window.supabaseClient || (window.supabase ? window.supabase : null);
  }

  // 1. Load Data (Parallel compatible with properties)
  async function loadKeyPlaces() {
    const savedVisibility = localStorage.getItem("mialqui_places_visible");
    if (savedVisibility !== null) {
      keyPlacesVisible = savedVisibility === "true";
    }

    const sb = getSupabase();
    if (!sb || typeof sb.from !== "function") {
      // Sin Supabase: usar localStorage como fallback
      console.warn("[KeyPlaces] Supabase no disponible. Usando localStorage.");
      const savedLocal = localStorage.getItem("mialqui_key_places");
      keyPlaces = savedLocal ? JSON.parse(savedLocal) : INITIAL_KEY_PLACES;
      return keyPlaces;
    }

    try {
      const { data, error } = await sb
        .from("key_places")
        .select("id, name, latitude, longitude, created_at")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[KeyPlaces] Error cargando desde Supabase:", error.message);
        // Fallback a localStorage solo si Supabase devuelve error
        const savedLocal = localStorage.getItem("mialqui_key_places");
        keyPlaces = savedLocal ? JSON.parse(savedLocal) : INITIAL_KEY_PLACES;
      } else {
        // Supabase OK - usar datos de la BD (puede estar vacía)
        keyPlaces = (data || []).map(d => ({
          id: d.id,
          name: d.name,
          latitude: Number(d.latitude),
          longitude: Number(d.longitude),
          created_at: d.created_at
        }));
        // Sincronizar localStorage con los datos reales de la BD
        saveLocal();
        console.log(`[KeyPlaces] ${keyPlaces.length} lugar(es) cargado(s) desde Supabase.`);
      }
    } catch (err) {
      console.error("[KeyPlaces] Excepción al cargar desde Supabase:", err);
      const savedLocal = localStorage.getItem("mialqui_key_places");
      keyPlaces = savedLocal ? JSON.parse(savedLocal) : INITIAL_KEY_PLACES;
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

    if (!keyPlacesLayer) {
      keyPlacesLayer = L.layerGroup();
    }
    keyPlacesLayer.addTo(mapInstance);

    setupFloatingToggle();
    renderMarkers();
  }

  // 3. Floating Map Switch (Show / Hide Lugares Claves)
  function setupFloatingToggle() {
    const mapSection = document.getElementById("map-section");
    if (!mapSection) return;

    let toggleBar = document.getElementById("key-places-toggle-bar");
    if (!toggleBar) {
      toggleBar = document.createElement("div");
      toggleBar.id = "key-places-toggle-bar";
      toggleBar.className = "key-places-toggle-bar";
      mapSection.appendChild(toggleBar);
    }

    toggleBar.innerHTML = `
      <span class="kp-toggle-label">Lugares Claves</span>
      <label class="kp-toggle-switch" title="Mostrar u ocultar lugares claves en el mapa">
        <input type="checkbox" id="kp-toggle-checkbox" ${keyPlacesVisible ? "checked" : ""}>
        <span class="kp-slider"></span>
      </label>
    `;

    const checkbox = document.getElementById("kp-toggle-checkbox");
    if (checkbox) {
      checkbox.addEventListener("change", (e) => {
        toggleVisibility(e.target.checked);
      });
    }
  }

  // 4. Render Markers (Badge/Pill identical to rental price tags, showing simple string name)
  function renderMarkers() {
    if (!keyPlacesLayer) return;

    keyPlacesLayer.clearLayers();

    if (!keyPlacesVisible) return;

    keyPlaces.forEach(place => {
      // Same pill/badge style as .custom-price-marker, displaying the name directly
      const placeIcon = L.divIcon({
        className: "custom-place-marker",
        html: `<span>${place.name}</span>`,
        iconSize: null,
        iconAnchor: null
      });

      const marker = L.marker([place.latitude, place.longitude], {
        icon: placeIcon,
        riseOnHover: true
      });

      const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
      const popupHtml = `
        <div class="kp-simple-popup">
          <div class="kp-simple-popup-title">${place.name}</div>
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="kp-simple-popup-link">
            Abrir en Google Maps ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 220,
        className: "kp-leaflet-popup"
      });

      keyPlacesLayer.addLayer(marker);
    });
  }

  // 5. Toggle Layer Visibility
  function toggleVisibility(visible) {
    keyPlacesVisible = visible;
    localStorage.setItem("mialqui_places_visible", String(visible));

    const checkbox = document.getElementById("kp-toggle-checkbox");
    if (checkbox) {
      checkbox.checked = visible;
    }

    renderMarkers();
  }

  // 6. Admin CRUD: Render Table
  function renderAdminTable() {
    const tbody = document.getElementById("admin-places-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (keyPlaces.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center" style="padding: 24px; color: var(--text-muted);">
            No hay lugares clave registrados. Haz clic en "Nuevo Lugar Clave" para agregar uno.
          </td>
        </tr>
      `;
      return;
    }

    keyPlaces.forEach(place => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div class="font-semibold" style="font-size: 14px;">${place.name}</div>
        </td>
        <td>
          <div style="font-family: monospace; font-size: 12px; color: var(--text-secondary);">
            ${Number(place.latitude).toFixed(6)}
          </div>
        </td>
        <td>
          <div style="font-family: monospace; font-size: 12px; color: var(--text-secondary);">
            ${Number(place.longitude).toFixed(6)}
          </div>
        </td>
        <td>
          <div class="admin-table-actions">
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

  // 7. Admin CRUD: Map Picker for Location Coordinates
  function initPlacePickerMap(initialLat, initialLng) {
    const pickerDiv = document.getElementById("form-place-map-picker");
    if (!pickerDiv) return;

    const latVal = initialLat || -25.4450;
    const lngVal = initialLng || -56.4440;

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
      className: "custom-place-marker",
      html: `<span>📍 Ubicación seleccionada</span>`,
      iconSize: null,
      iconAnchor: null
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

  // 8. Admin CRUD: Open Form (Create)
  function openCreateForm() {
    const titleEl = document.getElementById("place-form-title");
    if (titleEl) titleEl.textContent = "Crear Nuevo Lugar Clave";

    document.getElementById("form-place-id").value = "";
    document.getElementById("form-place-name").value = "";

    if (typeof window.switchAdminView === "function") {
      window.switchAdminView("place-form");
    }
  }

  // 9. Admin CRUD: Delete Place
  async function deletePlace(id) {
    if (!confirm("¿Deseas eliminar este lugar clave?")) return;

    const sb = getSupabase();
    if (sb && typeof sb.from === "function") {
      try {
        const { error } = await sb.from("key_places").delete().eq("id", id);
        if (error) {
          console.error("[KeyPlaces] Error eliminando de Supabase:", error.message);
          alert(`Error al eliminar de la base de datos: ${error.message}`);
          return;
        }
        // Recargar desde Supabase para sincronizar
        await loadKeyPlaces();
      } catch (e) {
        console.error("[KeyPlaces] Excepción al eliminar:", e);
        alert(`Error inesperado al eliminar: ${e.message}`);
        return;
      }
    } else {
      // Sin Supabase: eliminar solo localmente
      keyPlaces = keyPlaces.filter(p => String(p.id) !== String(id));
      saveLocal();
    }

    renderAdminTable();
    renderMarkers();
  }

  // 10. Admin CRUD: Save Form (Create)
  async function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById("form-place-name").value.trim();
    const latitude = parseFloat(document.getElementById("form-place-lat").value);
    const longitude = parseFloat(document.getElementById("form-place-lng").value);

    if (!name || isNaN(latitude) || isNaN(longitude)) {
      alert("Por favor ingresa el nombre del lugar y marca su ubicación en el mapa.");
      return;
    }

    const payload = { name, latitude, longitude };

    const sb = getSupabase();
    const supabaseAvailable = sb && typeof sb.from === "function";

    if (supabaseAvailable) {
      // Guardar en Supabase (fuente de verdad)
      try {
        const { data, error } = await sb.from("key_places").insert([payload]).select();
        if (error) {
          console.error("[KeyPlaces] Error guardando en Supabase:", error.message);
          alert(`Error al guardar en la base de datos: ${error.message}\n\nVerifica que la tabla 'key_places' exista en Supabase y que tengas permisos de escritura.`);
          return; // No continuar si falla Supabase
        }
        if (data && data[0]) {
          // Recargar desde Supabase para tener IDs reales
          await loadKeyPlaces();
        }
      } catch (err) {
        console.error("[KeyPlaces] Excepción al guardar:", err);
        alert(`Error inesperado al guardar: ${err.message}`);
        return;
      }
    } else {
      // Sin Supabase: guardar solo en localStorage
      console.warn("[KeyPlaces] Guardando solo en localStorage (sin Supabase).");
      keyPlaces.push({ id: "kp-" + Date.now(), ...payload });
      saveLocal();
    }

    renderAdminTable();
    renderMarkers();

    if (typeof window.switchAdminView === "function") {
      window.switchAdminView("places");
    }
  }

  // 11. Bind Admin Events
  function initAdminEvents() {
    const btnAdd = document.getElementById("btn-admin-add-place");
    if (btnAdd) {
      btnAdd.addEventListener("click", openCreateForm);
    }

    const btnCancel = document.getElementById("btn-cancel-place-form");
    if (btnCancel) {
      btnCancel.addEventListener("click", () => {
        if (typeof window.switchAdminView === "function") {
          window.switchAdminView("places");
        }
      });
    }

    const btnCancel2 = document.getElementById("btn-cancel-place-form-2");
    if (btnCancel2) {
      btnCancel2.addEventListener("click", () => {
        if (typeof window.switchAdminView === "function") {
          window.switchAdminView("places");
        }
      });
    }

    const tbody = document.getElementById("admin-places-table-body");
    if (tbody) {
      tbody.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest("[data-delete-place]");
        if (deleteBtn) {
          deletePlace(deleteBtn.dataset.deletePlace);
        }
      });
    }

    const placeForm = document.getElementById("place-form");
    if (placeForm) {
      placeForm.addEventListener("submit", handleFormSubmit);
    }

    const navPlaces = document.getElementById("admin-nav-places");
    if (navPlaces) {
      navPlaces.addEventListener("click", () => {
        if (typeof window.switchAdminView === "function") {
          window.switchAdminView("places");
        }
      });
    }
  }

  return {
    loadKeyPlaces,
    initMapLayer,
    renderMarkers,
    toggleVisibility,
    renderAdminTable,
    initPlacePickerMap,
    initAdminEvents,
    openCreateForm,
    deletePlace,
    getKeyPlaces: () => keyPlaces
  };
})();
