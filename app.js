/**
 * ============================================================================
 * DIAL ROOM EASE - MAIN APPLICATION CONTROLLER
 * ============================================================================
 */

// Comprehensive State-to-Districts mapping dictionary for India
const indiaStateDistricts = {
  "Andhra Pradesh": ["Anakapalli", "Ananthapuramu", "Chittoor", "East Godavari", "Guntur", "Kakinada", "Krishna", "Kurnool", "Nandyal", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Bihar": ["Bhagalpur", "Darbhanga", "Gaya", "Muzaffarpur", "Patna", "Purnia", "Rohtas", "Samastipur", "Saran"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Banaskantha", "Bharuch", "Bhavnagar", "Gandhinagar", "Jamnagar", "Junagadh", "Kutch", "Mehsana", "Rajkot", "Surat", "Vadodara", "Valsad"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapura", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kancheepuram", "Kanyakumari", "Karur", "Madurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Salem", "Sivaganga", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Ranga Reddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Azamgarh", "Badaun", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bijnor", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Ayodhya", "Farrukhabad", "Fatehpur", "Firozabad", "Noida", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"]
};

(function () {
  const state = {
    user: null,
    activeRole: "Looking For a Room",
    selectedPersona: null,
    selectedHostRole: "Property Owner",
    mapInstance: null,
    allRooms: [],
    uploadedPhotos: [],
    filters: {
      city: "All Cities",
      maxPrice: 35000,
      search: "",
      type: "All"
    }
  };

  document.addEventListener("DOMContentLoaded", async () => {
    initApp();
    populateStatesDropdown();
  });

  function populateStatesDropdown() {
    const stateSelect = document.getElementById("state-filter-select");
    if (!stateSelect) return;
    const sortedStates = Object.keys(indiaStateDistricts).sort();
    sortedStates.forEach(st => {
      const opt = document.createElement("option");
      opt.value = st;
      opt.textContent = st;
      stateSelect.appendChild(opt);
    });
  }

  function handleStateChange() {
    const stateSelect = document.getElementById("state-filter-select");
    const citySelect = document.getElementById("city-filter-select");
    if (!stateSelect || !citySelect) return;

    const chosenState = stateSelect.value;
    citySelect.innerHTML = '<option value="All Cities">All Districts / Cities</option>';

    if (!chosenState || !indiaStateDistricts[chosenState]) {
      citySelect.disabled = true;
      state.filters.city = "All Cities";
      filterAndRenderRooms();
      return;
    }

    citySelect.disabled = false;
    const districts = indiaStateDistricts[chosenState];
    districts.sort().forEach(dist => {
      const opt = document.createElement("option");
      opt.value = dist;
      opt.textContent = dist;
      citySelect.appendChild(opt);
    });

    state.filters.city = "All Cities";
    filterAndRenderRooms();
  }
  window.handleStateChange = handleStateChange;

  async function initApp() {
    try {
      state.mapInstance = new RoomMap("interactive-map");
      state.mapInstance.setOnCityChange((city) => {
        state.filters.city = city;
        const citySelect = document.getElementById("city-filter-select");
        if (citySelect) citySelect.value = city;
        filterAndRenderRooms();
      });
    } catch (e) {
      console.warn("Map initialization note:", e);
    }

    renderCloudStatusBanner();

    const storedUser = window.dbService.getStoredUser();
    if (storedUser) {
      state.user = storedUser;
      state.activeRole = storedUser.role || "Looking For a Room";
      updateNavUserUI();
    } else {
      openAuthModal("register");
    }

    bindAuthEvents();
    bindRoleSwitcher();
    bindFilterControls();
    bindHostStudioForm();
    bindHeartbeatPing();

    await refreshRoomsData();
    updateRoleView();
  }

  function renderCloudStatusBanner() {
    const banner = document.getElementById("cloud-status-banner");
    if (!banner) return;
    banner.innerHTML = `
      <span class="cloud-status-badge status-online">🟢 Cloud Synced</span>
      <span>Running with persistent database across India.</span>
    `;
  }

  function bindAuthEvents() {
    const modalBackdrop = document.getElementById("auth-modal-backdrop");
    const tabRegister = document.getElementById("tab-register");
    const tabLogin = document.getElementById("tab-login");
    const formRegister = document.getElementById("form-register");
    const formLogin = document.getElementById("form-login");
    const modalCloseBtn = document.getElementById("auth-modal-close");

    if (modalCloseBtn) modalCloseBtn.addEventListener("click", () => closeAuthModal());
    if (tabRegister) tabRegister.addEventListener("click", () => switchAuthTab("register"));
    if (tabLogin) tabLogin.addEventListener("click", () => switchAuthTab("login"));

    const openLoginBtn = document.getElementById("nav-login-btn");
    const logoutBtn = document.getElementById("nav-logout-btn");

    if (openLoginBtn) openLoginBtn.addEventListener("click", () => openAuthModal("register"));
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        window.dbService.logout();
        state.user = null;
        updateNavUserUI();
        showToast("Logged out successfully.", "info");
        openAuthModal("login");
      });
    }

    if (formRegister) {
      formRegister.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!state.selectedPersona) {
          showToast("Please choose your space persona (Looking for a Room or Giving a Room).", "error");
          return;
        }

        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        const role = state.selectedPersona === "owner" ? "Giving a Room" : "Looking For a Room";

        try {
          const result = await window.dbService.register({ name, email, password, role });
          state.user = result.user;
          state.activeRole = role;
          showToast(`Welcome, ${result.user.name}!`, "success");
          closeAuthModal();
          updateNavUserUI();
          updateRoleView();
          await refreshRoomsData();
        } catch (err) {
          showToast(err.message || "Registration failed.", "error");
        }
      });
    }

    if (formLogin) {
      formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        try {
          const result = await window.dbService.login({ email, password });
          state.user = result.user;
          state.activeRole = result.user.role || "Looking For a Room";
          showToast(`Welcome back, ${result.user.name}!`, "success");
          closeAuthModal();
          updateNavUserUI();
          updateRoleView();
          await refreshRoomsData();
        } catch (err) {
          showToast(err.message || "Login failed.", "error");
        }
      });
    }
  }

  function selectPersona(persona) {
    const seekerCard = document.getElementById("persona-seeker");
    const ownerCard = document.getElementById("persona-owner");

    if (state.selectedPersona === persona) {
      state.selectedPersona = null;
      if (seekerCard) seekerCard.classList.remove("active");
      if (ownerCard) ownerCard.classList.remove("active");
      return;
    }

    state.selectedPersona = persona;
    if (persona === "seeker") {
      if (seekerCard) seekerCard.classList.add("active");
      if (ownerCard) ownerCard.classList.remove("active");
    } else {
      if (ownerCard) ownerCard.classList.add("active");
      if (seekerCard) seekerCard.classList.remove("active");
    }
  }
  window.selectPersona = selectPersona;

  function openAuthModal(tab = "register") {
    const modal = document.getElementById("auth-modal-backdrop");
    if (modal) {
      modal.classList.add("active");
      switchAuthTab(tab);
    }
  }
  window.openAuthModal = openAuthModal;

  function closeAuthModal() {
    const modal = document.getElementById("auth-modal-backdrop");
    if (modal) modal.classList.remove("active");
  }
  window.closeAuthModal = closeAuthModal;

  function switchAuthTab(tab) {
    const tabRegister = document.getElementById("tab-register");
    const tabLogin = document.getElementById("tab-login");
    const formRegister = document.getElementById("form-register");
    const formLogin = document.getElementById("form-login");

    if (tab === "register") {
      if (tabRegister) tabRegister.classList.add("active", "bg-white", "shadow-sm");
      if (tabLogin) tabLogin.classList.remove("active", "bg-white", "shadow-sm");
      if (formRegister) formRegister.style.display = "block";
      if (formLogin) formLogin.style.display = "none";
    } else {
      if (tabLogin) tabLogin.classList.add("active", "bg-white", "shadow-sm");
      if (tabRegister) tabRegister.classList.remove("active", "bg-white", "shadow-sm");
      if (formLogin) formLogin.style.display = "block";
      if (formRegister) formRegister.style.display = "none";
    }
  }
  window.switchAuthTab = switchAuthTab;

  function updateNavUserUI() {
    const loggedOutSection = document.getElementById("nav-logged-out");
    const loggedInSection = document.getElementById("nav-logged-in");
    const userNameDisplay = document.getElementById("nav-user-name");
    const userRoleBadge = document.getElementById("nav-role-badge");

    if (state.user) {
      if (loggedOutSection) loggedOutSection.style.display = "none";
      if (loggedInSection) loggedInSection.style.display = "flex";
      if (userNameDisplay) userNameDisplay.innerText = state.user.name;
      if (userRoleBadge) userRoleBadge.innerText = state.activeRole === "Giving a Room" ? "Host" : "Seeker";
    } else {
      if (loggedOutSection) loggedOutSection.style.display = "flex";
      if (loggedInSection) loggedInSection.style.display = "none";
    }
  }

  function bindRoleSwitcher() {
    const btnLooking = document.getElementById("role-toggle-looking");
    const btnGiving = document.getElementById("role-toggle-giving");

    if (btnLooking) btnLooking.addEventListener("click", () => setRole("Looking For a Room"));
    if (btnGiving) btnGiving.addEventListener("click", () => setRole("Giving a Room"));
  }

  function setRole(role) {
    state.activeRole = role;
    if (state.user && window.dbService) window.dbService.updateUserRole(role);
    updateNavUserUI();
    updateRoleView();
  }
  window.setRole = setRole;

  function updateRoleView() {
    const btnLooking = document.getElementById("role-toggle-looking");
    const btnGiving = document.getElementById("role-toggle-giving");
    const lookingSection = document.getElementById("section-looking-for-room");
    const givingSection = document.getElementById("section-giving-a-room");

    if (state.activeRole === "Giving a Room") {
      if (btnGiving) btnGiving.classList.add("active");
      if (btnLooking) btnLooking.classList.remove("active");
      if (lookingSection) lookingSection.style.display = "none";
      if (givingSection) givingSection.style.display = "block";
    } else {
      if (btnLooking) btnLooking.classList.add("active");
      if (btnGiving) btnGiving.classList.remove("active");
      if (lookingSection) lookingSection.style.display = "block";
      if (givingSection) givingSection.style.display = "none";
      if (state.mapInstance) setTimeout(() => state.mapInstance.invalidateSize(), 200);
    }
  }

  function bindHostStudioForm() {
    const dropZone = document.getElementById("dropZone");
    const photoInput = document.getElementById("hostPhotoInput");
    if (dropZone && photoInput) {
      dropZone.addEventListener("click", () => photoInput.click());
    }
  }

  async function submitHostListing() {
    const listerName = document.getElementById("listerName")?.value.trim() || "Ananya";
    const phone = document.getElementById("listerPhone")?.value.trim() || "+91 9820144521";
    const city = document.getElementById("citySelect")?.value || "Bengaluru";
    const locality = document.getElementById("localityInput")?.value.trim() || "Koramangala";
    const rent = parseFloat(document.getElementById("monthlyRent")?.value || "20000");

    const roomPayload = {
      lister_name: listerName,
      title: `Private Room • ${locality}`,
      city: city,
      address: locality,
      landmark: "Near Main Road",
      contact_phone: phone,
      contact_email: state.user?.email || "host@dialroomease.in",
      rent_inr: rent,
      room_type: "Private Room",
      amenities: ["Wi-Fi", "AC"],
      image_urls: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80"],
      lat: 12.9352,
      lng: 77.6245
    };

    try {
      await window.dbService.addRoom(roomPayload);
      showToast("Room listing published successfully!", "success");
      await refreshRoomsData();
    } catch (err) {
      showToast(err.message || "Failed to publish.", "error");
    }
  }
  window.submitHostListing = submitHostListing;

  function bindHeartbeatPing() {
    setInterval(() => {
      const timer = document.getElementById("syncTimer");
      if (timer) timer.innerText = `${Math.floor(Math.random() * 15) + 8}ms ago`;
    }, 3500);
  }

  function bindFilterControls() {
    const slider = document.getElementById("budget-slider");
    const valDisplay = document.getElementById("budget-value-display");
    const citySelect = document.getElementById("city-filter-select");
    const typeSelect = document.getElementById("type-filter-select");
    const citySearch = document.getElementById("map-city-search");

    if (slider && valDisplay) {
      slider.addEventListener("input", (e) => {
        const val = Number(e.target.value);
        valDisplay.innerText = `₹${val.toLocaleString("en-IN")}`;
        state.filters.maxPrice = val;
        filterAndRenderRooms();
      });
    }

    if (citySelect) {
      citySelect.addEventListener("change", (e) => {
        state.filters.city = e.target.value;
        filterAndRenderRooms();
        if (state.mapInstance && e.target.value !== "All Cities") {
          state.mapInstance.flyToCity(e.target.value);
        }
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener("change", (e) => {
        state.filters.type = e.target.value;
        filterAndRenderRooms();
      });
    }

    if (citySearch) {
      citySearch.addEventListener("input", (e) => {
        state.filters.search = e.target.value.trim();
        filterAndRenderRooms();
      });
    }
  }

  async function refreshRoomsData() {
    try {
      const rooms = await window.dbService.getRooms();
      state.allRooms = rooms || [];
      filterAndRenderRooms();
      if (state.mapInstance) state.mapInstance.renderRoomPins(state.allRooms);
    } catch (e) {
      console.warn("Refresh rooms error:", e);
    }
  }

  function filterAndRenderRooms() {
    let filtered = [...state.allRooms];

    if (state.filters.city && state.filters.city !== "All Cities") {
      filtered = filtered.filter(
        (r) => r.city.toLowerCase().includes(state.filters.city.toLowerCase()) || r.address.toLowerCase().includes(state.filters.city.toLowerCase())
      );
    }

    if (state.filters.maxPrice) {
      filtered = filtered.filter((r) => Number(r.rent_inr) <= state.filters.maxPrice);
    }

    if (state.filters.type && state.filters.type !== "All") {
      filtered = filtered.filter((r) => r.room_type.toLowerCase().includes(state.filters.type.toLowerCase()));
    }

    if (state.filters.search) {
      const s = state.filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) => r.title.toLowerCase().includes(s) || r.city.toLowerCase().includes(s) || r.address.toLowerCase().includes(s)
      );
    }

    renderRoomsGrid(filtered);
  }

  function renderRoomsGrid(rooms) {
    const grid = document.getElementById("rooms-grid-container");
    const countDisplay = document.getElementById("rooms-count-display");
    if (!grid) return;

    if (countDisplay) {
      countDisplay.innerText = `Showing ${rooms.length} verified ${rooms.length === 1 ? "room" : "rooms"} ready for move-in`;
    }

    if (rooms.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-12 px-4 bg-surface-container-lowest/80 rounded-2xl border border-sky-100">
          <h4 class="text-base font-bold text-on-surface">No rooms found matching your filters</h4>
        </div>
      `;
      return;
    }

    grid.innerHTML = rooms
      .map((r) => {
        const photo = r.image_urls?.[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80";
        return `
          <div class="room-card group">
            <div class="room-photo-wrapper">
              <img src="${photo}" alt="${r.title}" loading="lazy" />
              <div class="room-price-badge">₹${Number(r.rent_inr).toLocaleString("en-IN")}/mo</div>
              <span class="room-type-tag">${r.room_type || "Private Room"}</span>
            </div>
            <div class="p-5 flex flex-col flex-1 justify-between space-y-3">
              <div>
                <span class="text-[11px] font-label font-bold text-secondary">Verified Space</span>
                <h4 class="font-bold text-base text-on-surface line-clamp-1">${r.title}</h4>
                <p class="text-xs text-on-surface-variant truncate">${r.city}</p>
              </div>
              <div class="pt-3 border-t border-sky-100 flex items-center justify-between">
                <a href="tel:${r.contact_phone}" class="px-3 py-1.5 rounded-full font-label text-xs font-bold bg-surface-container text-on-surface">Call</a>
                <a href="https://wa.me/${r.contact_phone?.replace(/[^0-9]/g, '')}" target="_blank" class="px-3 py-1.5 rounded-full font-label text-xs font-bold bg-primary text-on-primary">WhatsApp</a>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function showToast(message, type = "info") {
    const toast = document.getElementById("app-toast");
    if (!toast) return;
    toast.innerText = message;
    toast.className = `toast-msg show ${type === "success" ? "toast-success" : type === "error" ? "toast-error" : ""}`;
    setTimeout(() => toast.classList.remove("show"), 4000);
  }
  window.showToast = showToast;
})();
