/**
 * ============================================================================
 * DIAL ROOM EASE - INTERACTIVE MAP WITH DISTRICT AUTOCOMPLETE
 * ============================================================================
 */

class RoomMap {
  constructor(containerId = "interactive-map") {
    this.containerId = containerId;
    this.map = null;
    this.markersGroup = null;
    this.currentCity = "All Cities";
    this.onCityChangeCallback = null;

    this.allIndiaHubs = [
      { name: "Bengaluru Urban, Karnataka", city: "Bengaluru", lat: 12.9716, lng: 77.5946 },
      { name: "Mumbai City, Maharashtra", city: "Mumbai", lat: 18.9220, lng: 72.8347 },
      { name: "Pune, Maharashtra", city: "Pune", lat: 18.5204, lng: 73.8567 },
      { name: "Delhi, NCR", city: "Delhi", lat: 28.6139, lng: 77.2090 },
      { name: "Hyderabad, Telangana", city: "Hyderabad", lat: 17.3850, lng: 78.4867 },
      { name: "Chennai, Tamil Nadu", city: "Chennai", lat: 13.0827, lng: 80.2707 },
      { name: "Kolkata, West Bengal", city: "Kolkata", lat: 22.5726, lng: 88.3639 },
      { name: "Ahmedabad, Gujarat", city: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
      { name: "Jaipur, Rajasthan", city: "Jaipur", lat: 26.9124, lng: 75.7873 },
      { name: "Ernakulam (Kochi), Kerala", city: "Kochi", lat: 9.9816, lng: 76.2999 },
      { name: "Thane, Maharashtra", city: "Thane", lat: 19.2183, lng: 72.9781 }
    ];

    this.init();
  }

  init() {
    const mapElement = document.getElementById(this.containerId);
    if (!mapElement || typeof L === "undefined") return;

    this.map = L.map(this.containerId, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: false,
      scrollWheelZoom: true
    });

    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);
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

      const localMatches = this.allIndiaHubs.filter(item => item.name.toLowerCase().includes(query));
      this.renderSuggestions(localMatches, query);

      if (query.length >= 2) {
        debounceTimer = setTimeout(async () => {
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6`;
            const resp = await fetch(url, { headers: { "Accept-Language": "en" } });
            const data = await resp.json();

            if (data && data.length > 0) {
              const apiMatches = data.map(item => ({
                name: item.display_name,
                city: item.name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
              }));

              const combined = [...localMatches];
              apiMatches.forEach(am => {
                if (!combined.some(c => Math.abs(c.lat - am.lat) < 0.05)) combined.push(am);
              });

              this.renderSuggestions(combined.slice(0, 8), query);
            }
          } catch (err) {
            console.warn("Geocoding lookup failed:", err);
          }
        }, 300);
      }
    });

    document.addEventListener("click", (e) => {
      if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = "none";
      }
    });
  }

  renderSuggestions(list, query) {
    const suggestionsBox = document.getElementById("search-suggestions");
    if (!suggestionsBox) return;

    if (list.length === 0) {
      suggestionsBox.innerHTML = `<div class="suggestion-item">No districts or cities found matching "${query}"</div>`;
      suggestionsBox.style.display = "block";
      return;
    }

    suggestionsBox.innerHTML = list.map(item => `
      <div class="suggestion-item" data-city="${item.city}" data-lat="${item.lat}" data-lng="${item.lng}">
        📍 ${item.name}
      </div>
    `).join("");

    suggestionsBox.style.display = "block";

    suggestionsBox.querySelectorAll(".suggestion-item").forEach(el => {
      el.addEventListener("click", () => {
        const city = el.dataset.city;
        const lat = parseFloat(el.dataset.lat);
        const lng = parseFloat(el.dataset.lng);

        this.selectCity(city, lat, lng);
        document.getElementById("map-city-search").value = city;
        suggestionsBox.style.display = "none";
      });
    });
  }

  selectCity(cityName, lat, lng) {
    this.currentCity = cityName;
    if (this.map) {
      this.map.flyTo([lat, lng], 12, { animate: true, duration: 1.6 });
    }
    if (this.onCityChangeCallback) {
      this.onCityChangeCallback(cityName, { lat, lng });
    }
  }

  setOnCityChange(callback) {
    this.onCityChangeCallback = callback;
  }

  renderRoomPins(rooms) {
    if (!this.markersGroup || !this.map) return;
    this.markersGroup.clearLayers();

    rooms.forEach((room) => {
      if (!room.lat || !room.lng) return;
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
      marker.bindPopup(`<div class="p-2"><b>${room.title}</b><br>₹${formattedPrice}/mo</div>`);
      this.markersGroup.addLayer(marker);
    });
  }

  async geocodeAddress(city, address) {
    const match = this.allIndiaHubs.find(c => c.city.toLowerCase() === city.toLowerCase());
    if (match) {
      return { lat: match.lat + (Math.random() - 0.5) * 0.02, lng: match.lng + (Math.random() - 0.5) * 0.02 };
    }
    return { lat: 12.9716, lng: 77.5946 };
  }
}

window.RoomMap = RoomMap;
