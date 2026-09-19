/**
 * ============================================================================
 * DIAL ROOM EASE - INTERACTIVE MAP WITH CITY AUTOCOMPLETE (LEAFLET)
 * ============================================================================
 * Features:
 * - Sky-blue styled interactive Leaflet map
 * - Real-time city search bar with instant autocomplete suggestions
 * - Geocoding fallback to search any global / Indian locality
 * - Smooth camera fly-to and zoom-in animation
 * - Liquid glass price bubble markers (in INR ₹)
 * - Interactive popups showing room details & photos
 */

class RoomMap {
  constructor(containerId = "interactive-map") {
    this.containerId = containerId;
    this.map = null;
    this.markersGroup = null;
    this.currentCity = "All Cities";
    this.selectedCoords = null;
    this.onCityChangeCallback = null;

    // Instant local Indian cities autocomplete database with pre-cached coordinates
    this.popularCities = [
      { name: "Bengaluru, Karnataka", city: "Bengaluru", lat: 12.9716, lng: 77.5946 },
      { name: "Mumbai, Maharashtra", city: "Mumbai", lat: 19.0760, lng: 72.8777 },
      { name: "Delhi, NCR", city: "Delhi", lat: 28.6139, lng: 77.2090 },
      { name: "Hyderabad, Telangana", city: "Hyderabad", lat: 17.3850, lng: 78.4867 },
      { name: "Pune, Maharashtra", city: "Pune", lat: 18.5204, lng: 73.8567 },
      { name: "Chennai, Tamil Nadu", city: "Chennai", lat: 13.0827, lng: 80.2707 },
      { name: "Kolkata, West Bengal", city: "Kolkata", lat: 22.5726, lng: 88.3639 },
      { name: "Jaipur, Rajasthan", city: "Jaipur", lat: 26.9124, lng: 75.7873 },
      { name: "Ahmedabad, Gujarat", city: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
      { name: "Chandigarh, Punjab & Haryana", city: "Chandigarh", lat: 30.7333, lng: 76.7794 },
      { name: "Gurugram / Gurgaon, Haryana", city: "Gurugram", lat: 28.4595, lng: 77.0266 },
      { name: "Noida, Uttar Pradesh", city: "Noida", lat: 28.5355, lng: 77.3910 },
      { name: "Kochi, Kerala", city: "Kochi", lat: 9.9312, lng: 76.2673 },
      { name: "Goa (Panaji)", city: "Goa", lat: 15.4909, lng: 73.8278 },
      { name: "Indore, Madhya Pradesh", city: "Indore", lat: 22.7196, lng: 75.8577 },
      { name: "Lucknow, Uttar Pradesh", city: "Lucknow", lat: 26.8467, lng: 80.9462 },
      { name: "Surat, Gujarat", city: "Surat", lat: 21.1702, lng: 72.8311 },
      { name: "Bhopal, Madhya Pradesh", city: "Bhopal", lat: 23.2599, lng: 77.4126 },
      { name: "Coimbatore, Tamil Nadu", city: "Coimbatore", lat: 11.0168, lng: 76.9558 },
      { name: "Visakhapatnam, Andhra Pradesh", city: "Visakhapatnam", lat: 17.6868, lng: 83.2185 }
    ];

    this.init();
  }

  init() {
    const mapElement = document.getElementById(this.containerId);
    if (!mapElement || typeof L === "undefined") {
      console.warn("Leaflet map container or library not ready yet.");
      return;
    }

    // Default center: India overview (zoom 5)
    this.map = L.map(this.containerId, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      scrollWheelZoom: true
    });

    // Custom positioned zoom control on right
    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    // Clean, aesthetic CartoDB Voyager tiles with sky-blue vibe
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
        maxZoom: 19,
        subdomains: "abcd"
      }
    ).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);

    // Setup the search input & suggestions dropdown
    this.setupSearchAutocomplete();
  }

  setupSearchAutocomplete() {
    const searchInput = document.getElementById("map-city-search");
    const suggestionsBox = document.getElementById("search-suggestions");
    if (!searchInput || !suggestionsBox) return;

    let debounceTimer = null;

    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim().toLowerCase();
      clearTimeout(debounceTimer);

      if (query.length === 0) {
        suggestionsBox.innerHTML = "";
        suggestionsBox.style.display = "none";
        return;
      }

      // 1. Instant match against internal popular cities
      const instantMatches = this.popularCities.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.city.toLowerCase().includes(query)
      );

      this.renderSuggestions(instantMatches, query);

      // 2. Also query OpenStreetMap Nominatim for any specific locality or global city
      if (query.length >= 3) {
        debounceTimer = setTimeout(async () => {
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`;
            const resp = await fetch(url, { headers: { "Accept-Language": "en" } });
            const data = await resp.json();

            if (data && data.length > 0) {
              const geocoded = data.map(item => ({
                name: item.display_name,
                city: item.name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
              }));

              // Merge unique suggestions
              const combined = [...instantMatches];
              geocoded.forEach(g => {
                if (!combined.some(c => Math.abs(c.lat - g.lat) < 0.05 && Math.abs(c.lng - g.lng) < 0.05)) {
                  combined.push(g);
                }
              });

              this.renderSuggestions(combined.slice(0, 7), query);
            }
          } catch (err) {
            console.warn("Geocoding lookup failed:", err);
          }
        }, 350);
      }
    });

    // Close suggestions on outside click
    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = "none";
      }
    });

    // Enter key selects first suggestion
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const firstItem = suggestionsBox.querySelector(".suggestion-item");
        if (firstItem) {
          firstItem.click();
        }
      }
    });
  }

  renderSuggestions(list, query) {
    const suggestionsBox = document.getElementById("search-suggestions");
    if (!suggestionsBox) return;

    if (list.length === 0) {
      suggestionsBox.innerHTML = `<div class="no-suggestions">No cities found matching "${query}"</div>`;
      suggestionsBox.style.display = "block";
      return;
    }

    suggestionsBox.innerHTML = list
      .map((item) => {
        // Highlight query match
        const regex = new RegExp(`(${query})`, "gi");
        const highlightedName = item.name.replace(regex, "<strong>$1</strong>");
        return `
          <div class="suggestion-item" data-city="${item.city}" data-lat="${item.lat}" data-lng="${item.lng}">
            <span class="pin-icon">📍</span>
            <span class="city-name">${highlightedName}</span>
          </div>
        `;
      })
      .join("");

    suggestionsBox.style.display = "block";

    // Bind click events on items
    suggestionsBox.querySelectorAll(".suggestion-item").forEach((el) => {
      el.addEventListener("click", () => {
        const city = el.getAttribute("data-city");
        const lat = parseFloat(el.getAttribute("data-lat"));
        const lng = parseFloat(el.getAttribute("data-lng"));

        this.selectCity(city, lat, lng);
        document.getElementById("map-city-search").value = city;
        suggestionsBox.style.display = "none";
      });
    });
  }

  selectCity(cityName, lat, lng) {
    this.currentCity = cityName;
    this.selectedCoords = { lat, lng };

    // Fly to coordinates smoothly with zoom
    if (this.map) {
      this.map.flyTo([lat, lng], 13, {
        animate: true,
        duration: 1.6
      });
    }

    // Trigger sync callback if registered (to filter listings cards)
    if (this.onCityChangeCallback) {
      this.onCityChangeCallback(cityName, { lat, lng });
    }
  }

  setOnCityChange(callback) {
    this.onCityChangeCallback = callback;
  }

  // --------------------------------------------------------------------------
  // ROOM PINS & POPUPS
  // --------------------------------------------------------------------------
  renderRoomMarkers(rooms) {
    if (!this.markersGroup || !this.map) return;

    this.markersGroup.clearLayers();

    rooms.forEach((room) => {
      if (!room.lat || !room.lng) return;

      // Custom Sky-Blue Liquid Glass Price Badge Pin
      const formattedPrice = Number(room.rent_inr).toLocaleString("en-IN");
      const iconHtml = `
        <div class="glass-marker">
          <div class="marker-price">₹${formattedPrice}</div>
          <div class="marker-pin-tip"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: iconHtml,
        iconSize: [84, 38],
        iconAnchor: [42, 38],
        popupAnchor: [0, -38]
      });

      const marker = L.marker([room.lat, room.lng], { icon: customIcon });

      // Interactive Glass Popup
      const photoUrl = (room.image_urls && room.image_urls.length > 0)
        ? room.image_urls[0]
        : "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80";

      const popupContent = `
        <div class="glass-map-popup">
          <div class="popup-image" style="background-image: url('${photoUrl}')">
            <span class="popup-price-tag">₹${formattedPrice}/mo</span>
          </div>
          <div class="popup-body">
            <h4 class="popup-title">${room.title}</h4>
            <p class="popup-loc">📍 ${room.address || room.city}</p>
            ${room.landmark ? `<p class="popup-landmark">🏢 Near ${room.landmark}</p>` : ""}
            <div class="popup-actions">
              <a href="tel:${room.contact_phone}" class="popup-btn popup-btn-call">📞 Call</a>
              <a href="https://wa.me/${room.contact_phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(room.lister_name)},%20I%20am%20interested%20in%20your%20room%20on%20Dial%20Room%20Ease" target="_blank" class="popup-btn popup-btn-wa">💬 WhatsApp</a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: "liquid-glass-leaflet-popup"
      });

      this.markersGroup.addLayer(marker);
    });
  }

  // Geocode an address for a new listing
  async geocodeAddress(city, address) {
    // Check known cities first
    const match = this.popularCities.find(c => c.city.toLowerCase() === city.toLowerCase());
    if (match) {
      // Add slight jitter so multiple pins in same city don't completely overlap
      const jitterLat = (Math.random() - 0.5) * 0.04;
      const jitterLng = (Math.random() - 0.5) * 0.04;
      return { lat: match.lat + jitterLat, lng: match.lng + jitterLng };
    }

    try {
      const q = encodeURIComponent(`${address}, ${city}, India`);
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
      const data = await resp.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.warn("Geocoding failed, using default coords:", e);
    }

    // Default to Bengaluru
    return { lat: 12.9716, lng: 77.5946 };
  }
}

// Global instance
window.RoomMap = RoomMap;

