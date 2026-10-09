/**
 * ============================================================================
 * DIAL ROOM EASE - MAIN APPLICATION CONTROLLER
 * ============================================================================
 * Handles:
 * - Liquid Azure Auth Hub (Register & Login)
 * - Strict password validations with live 2x2 security policy checklist
 * - Persona switching ('Looking for a Room' / seeker vs 'Giving a Room' / owner)
 * - Host Management Studio with 4-step listing form & Supabase Realtime pipeline
 * - Map integration & city filter synchronization
 * - Room seeker search & INR budget slider
 */

(function () {
  // Application State
  const state = {
    user: null,
    activeRole: "Looking For a Room", // "Looking For a Room" | "Giving a Room"
    selectedPersona: null, // Replaced default "seeker" with null requiring manual selection
    selectedHostRole: "Property Owner",
    activeCodeTab: "signup",
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

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", async () => {
    initApp();
  });

  async function initApp() {
    // 1. Initialize Map
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

    // 2. Setup Cloud Status Indicator Banner
    renderCloudStatusBanner();

    // 3. Check for existing logged-in session
    const storedUser = window.dbService.getStoredUser();
    if (storedUser) {
      state.user = storedUser;
      state.activeRole = storedUser.role || "Looking For a Room";
      updateNavUserUI();
    } else {
      // Auto open Auth Hub modal on initial visit
      openAuthModal("register");
    }

    // 4. Bind UI Event Handlers
    bindAuthEvents();
    bindPasswordValidation();
    bindRoleSwitcher();
    bindFilterControls();
    bindHostStudioForm();
    bindHeartbeatPing();

    // 5. Load and Render Listings
    await refreshRoomsData();

    // 6. Update view according to active role
    updateRoleView();

    // 7. Initialize Auth Bridge snippet
    updateLiveCodeSnippet();
  }

  // --------------------------------------------------------------------------
  // CLOUD STATUS BANNER
  // --------------------------------------------------------------------------
  function renderCloudStatusBanner() {
    const banner = document.getElementById("cloud-status-banner");
    if (!banner) return;

    if (window.dbService && window.dbService.isSupabaseConnected) {
      banner.innerHTML = `
        <span class="cloud-status-badge status-online">🟢 Supabase Connected</span>
        <span>All user accounts & room listings actively sync with your Supabase cloud database.</span>
      `;
    } else {
      banner.innerHTML = `
        <span class="cloud-status-badge status-local">💾 Local Storage Mode</span>
        <span>Running with persistent browser database. To connect cloud sync, enter credentials in <code>supabase-config.js</code>.</span>
      `;
    }
  }

  // --------------------------------------------------------------------------
  // AUTH HUB CONTROLLER
  // --------------------------------------------------------------------------
  function bindAuthEvents() {
    const modalBackdrop = document.getElementById("auth-modal-backdrop");
    const tabRegister = document.getElementById("tab-register");
    const tabLogin = document.getElementById("tab-login");
    const formRegister = document.getElementById("form-register");
    const formLogin = document.getElementById("form-login");
    const modalCloseBtn = document.getElementById("auth-modal-close");

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", () => closeAuthModal());
    }
    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) closeAuthModal();
      });
    }

    if (tabRegister) tabRegister.addEventListener("click", () => switchAuthTab("register"));
    if (tabLogin) tabLogin.addEventListener("click", () => switchAuthTab("login"));

    const openLoginBtn = document.getElementById("nav-login-btn");
    const logoutBtn = document.getElementById("nav-logout-btn");

    if (openLoginBtn) {
      openLoginBtn.addEventListener("click", () => openAuthModal("register"));
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        window.dbService.logout();
        state.user = null;
        updateNavUserUI();
        showToast("Logged out successfully.", "info");
        openAuthModal("login");
      });
    }

    // Handle Register Form Submission
    if (formRegister) {
      formRegister.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Enforce persona selection check before proceeding
        if (!state.selectedPersona) {
          showToast("Please choose your space persona (Looking for a Room or Giving a Room).", "error");
          return;
        }

        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        const confirmPassword = document.getElementById("reg-confirm-password").value;
        const role = state.selectedPersona === "owner" ? "Giving a Room" : "Looking For a Room";

        // Validate Password rules
        const validation = validatePasswordStrength(password, confirmPassword);
        if (!validation.isValid) {
          showToast(validation.firstError || "Please satisfy all password security requirements.", "error");
          return;
        }

        const submitBtn = document.getElementById("reg-submit-btn");
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">progress_activity</span> Completing Registration...`;

        try {
          const result = await window.dbService.register({ name, email, password, role });
          state.user = result.user;
          state.activeRole = role;

          showToast(`Welcome to Dial Room Ease, ${result.user.name}!`, "success");
          triggerSupabaseToast(`auth.signUp: Created account for ${email} (${role})`);
          closeAuthModal();
          updateNavUserUI();
          updateRoleView();
          await refreshRoomsData();
        } catch (err) {
          showToast(err.message || "Registration failed. Try again.", "error");
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    }

    // Handle Login Form Submission
    if (formLogin) {
      formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        const submitBtn = formLogin.querySelector("button[type='submit']");
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">progress_activity</span> Logging In...`;

        try {
          const result = await window.dbService.login({ email, password });
          state.user = result.user;
          state.activeRole = result.user.role || "Looking For a Room";

          showToast(`Welcome back, ${result.user.name}!`, "success");
          triggerSupabaseToast(`auth.signInWithPassword: User ${email} verified`);
          closeAuthModal();
          updateNavUserUI();
          updateRoleView();
          await refreshRoomsData();
        } catch (err) {
          showToast(err.message || "Login failed. Check credentials.", "error");
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    }
  }

  // Persona Selection in Auth Hub (Looking for a Room vs Giving a Room)
  function selectPersona(persona) {
    state.selectedPersona = persona;

    const seekerCard = document.getElementById("persona-seeker");
    const ownerCard = document.getElementById("persona-owner");

    if (persona === "seeker") {
      seekerCard.classList.add("active");
      ownerCard.classList.remove("active");
    } else {
      ownerCard.classList.add("active");
      seekerCard.classList.remove("active");
    }

    // Update Live User Metadata Payload
    const payloadRole = document.getElementById("live-payload-role");
    const payloadJson = document.getElementById("live-payload-json");
    if (payloadRole) payloadRole.innerText = persona;
    if (payloadJson) {
      payloadJson.innerText = JSON.stringify(
        {
          role: persona,
          verified_kyc: false,
          default_currency: "INR",
          app: "dial_room_ease_v1"
        },
        null,
        2
      );
    }

    updateLiveCodeSnippet();
  }
  window.selectPersona = selectPersona;

  // Code Tab Switching in Supabase Auth Bridge
  function switchCodeTab(tabKey, buttonEl) {
    state.activeCodeTab = tabKey;

    const tabs = document.querySelectorAll("#codeTabsHeader .code-tab");
    tabs.forEach((t) => {
      t.classList.remove("active", "bg-white", "font-bold", "text-primary", "shadow-xs");
      t.classList.add("text-on-surface-variant");
    });

    if (buttonEl) {
      buttonEl.classList.add("active", "bg-white", "font-bold", "text-primary", "shadow-xs");
      buttonEl.classList.remove("text-on-surface-variant");
    }

    updateLiveCodeSnippet();
  }
  window.switchCodeTab = switchCodeTab;

  function updateLiveCodeSnippet() {
    const titleEl = document.getElementById("code-box-title");
    const contentEl = document.getElementById("code-box-content");
    if (!titleEl || !contentEl) return;

    const name = document.getElementById("reg-name")?.value.trim() || "Aditi Roy";
    const email = document.getElementById("reg-email")?.value.trim() || "aditi@example.com";
    const roleTag = state.selectedPersona || "seeker";
    const roleFull = roleTag === "owner" ? "Giving a Room" : "Looking For a Room";

    const config = window.SUPABASE_CONFIG || {};
    const supaUrl = config.SUPABASE_URL || "https://dia-room-ease.supabase.co";
    const supaKey = config.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

    switch (state.activeCodeTab) {
      case "signup":
        titleEl.innerText = "supabase.auth.signUp()";
        contentEl.innerText = `const { data, error } = await\nsupabase.auth.signUp({\n  email: '${email}',\n  password: '••••••••',\n  options: { data: { full_name: '${name}',\n  role: '${roleTag}' } }\n});`;
        break;

      case "insert":
        titleEl.innerText = "supabase.from('profiles').insert()";
        contentEl.innerText = `const { data, error } = await\nsupabase.from('profiles').insert([{\n  full_name: '${name}',\n  email: '${email}',\n  role: '${roleFull}'\n}]).select();`;
        break;

      case "session":
        titleEl.innerText = "supabase.auth.getSession()";
        contentEl.innerText = `const { data: { session }, error } = await\nsupabase.auth.getSession();\nconst currentUser = session?.user;\nconsole.log("Active Auth Session:", currentUser);`;
        break;

      case "env":
        titleEl.innerText = ".env.local / client setup";
        contentEl.innerText = `NEXT_PUBLIC_SUPABASE_URL =\n  "${supaUrl}"\nNEXT_PUBLIC_SUPABASE_ANON_KEY =\n  "${supaKey}"`;
        break;
    }
  }
  window.updateLiveCodeSnippet = updateLiveCodeSnippet;

  function copyCodeSnippet() {
    const contentEl = document.getElementById("code-box-content");
    const copyBtn = document.getElementById("code-copy-btn");
    if (!contentEl) return;

    navigator.clipboard.writeText(contentEl.innerText).then(() => {
      if (copyBtn) {
        copyBtn.innerHTML = `<span class="material-symbols-outlined text-xs text-emerald-400">check</span><span class="text-emerald-400 font-semibold">Copied!</span>`;
        setTimeout(() => {
          copyBtn.innerHTML = `<span class="material-symbols-outlined text-xs">content_copy</span><span>Copy</span>`;
        }, 2000);
      }
    });
  }
  window.copyCodeSnippet = copyCodeSnippet;

  // Toggle Password Visibility
  function togglePasswordVisibility(inputId, buttonEl) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    const icon = buttonEl.querySelector(".material-symbols-outlined");
    if (icon) {
      icon.innerText = isPassword ? "visibility_off" : "visibility";
    }
  }
  window.togglePasswordVisibility = togglePasswordVisibility;

  // Live Password Validation Checklist & Strength Meter
  function bindPasswordValidation() {
    const pwdInput = document.getElementById("reg-password");
    const confirmInput = document.getElementById("reg-confirm-password");
    if (!pwdInput) return;

    function checkRules() {
      const pwd = pwdInput.value;
      const conf = confirmInput ? confirmInput.value : "";

      const hasLength = pwd.length >= 8;
      const hasUpper = /[A-Z]/.test(pwd);
      const hasDigit = /[0-9]/.test(pwd);
      const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

      updateRuleDot("rule-length", hasLength);
      updateRuleDot("rule-upper", hasUpper);
      updateRuleDot("rule-digit", hasDigit);
      updateRuleDot("rule-symbol", hasSymbol);

      // Calculate strength score
      const score = [hasLength, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
      const bar = document.getElementById("pwd-strength-bar");
      const text = document.getElementById("pwd-strength-text");

      if (bar && text) {
        if (score <= 1) {
          bar.className = "h-full w-1/4 bg-error transition-all duration-300";
          text.className = "font-semibold text-error";
          text.innerText = "Weak";
        } else if (score <= 3) {
          bar.className = "h-full w-3/4 bg-amber-500 transition-all duration-300";
          text.className = "font-semibold text-amber-500";
          text.innerText = "Medium";
        } else {
          bar.className = "h-full w-full bg-emerald-500 transition-all duration-300";
          text.className = "font-semibold text-emerald-500";
          text.innerText = "Strong";
        }
      }
    }

    pwdInput.addEventListener("input", checkRules);
    if (confirmInput) confirmInput.addEventListener("input", checkRules);
  }

  function updateRuleDot(id, isValid) {
    const el = document.getElementById(id);
    if (!el) return;
    const dot = el.querySelector(".rule-dot");
    if (isValid) {
      el.classList.add("valid");
      if (dot) {
        dot.innerHTML = `<span class="material-symbols-outlined text-[11px] leading-none">check</span>`;
      }
    } else {
      el.classList.remove("valid");
      if (dot) dot.innerHTML = "&bull;";
    }
  }

  function validatePasswordStrength(password, confirmPassword) {
    if (password.length < 8) {
      return { isValid: false, firstError: "Password must be at least 8 characters long." };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, firstError: "Password must contain at least one uppercase letter (A-Z)." };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, firstError: "Password must contain at least one number (0-9)." };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, firstError: "Password must contain at least one special symbol (!@#$%)." };
    }
    if (password !== confirmPassword) {
      return { isValid: false, firstError: "Both passwords entered do not match." };
    }
    return { isValid: true };
  }

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
      if (userRoleBadge) {
        userRoleBadge.innerText = state.activeRole === "Giving a Room" ? "Host" : "Seeker";
      }
    } else {
      if (loggedOutSection) loggedOutSection.style.display = "flex";
      if (loggedInSection) loggedInSection.style.display = "none";
    }
  }

  // --------------------------------------------------------------------------
  // ROLE SWITCHER & VIEW TOGGLING
  // --------------------------------------------------------------------------
  function bindRoleSwitcher() {
    const btnLooking = document.getElementById("role-toggle-looking");
    const btnGiving = document.getElementById("role-toggle-giving");

    if (btnLooking) {
      btnLooking.addEventListener("click", () => setRole("Looking For a Room"));
    }
    if (btnGiving) {
      btnGiving.addEventListener("click", () => setRole("Giving a Room"));
    }
  }

  function setRole(role) {
    state.activeRole = role;
    if (state.user && window.dbService) {
      window.dbService.updateUserRole(role);
    }
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
      if (state.mapInstance) {
        setTimeout(() => state.mapInstance.invalidateSize(), 200);
      }
    }
  }

  // --------------------------------------------------------------------------
  // HOST MANAGEMENT STUDIO (FORM & PHOTO UPLOADS)
  // --------------------------------------------------------------------------
  function selectRole(buttonEl, roleName) {
    state.selectedHostRole = roleName;
    const pills = document.querySelectorAll("#roleSelector .role-pill");
    pills.forEach((p) => {
      p.classList.remove("active-role", "bg-primary-container", "text-on-primary-container", "border-sky-300/40");
      p.classList.add("bg-surface-container-low", "text-on-surface", "border-sky-100");
    });
    buttonEl.classList.remove("bg-surface-container-low", "text-on-surface", "border-sky-100");
    buttonEl.classList.add("active-role", "bg-primary-container", "text-on-primary-container", "border-sky-300/40");
  }
  window.selectRole = selectRole;

  function toggleAmenity(buttonEl) {
    buttonEl.classList.toggle("active");
  }
  window.toggleAmenity = toggleAmenity;

  function updateLivePreviewCard() {
    const rentVal = document.getElementById("monthlyRent")?.value || "24500";
    const depVal = document.getElementById("securityDeposit")?.value || "40000";
    const typeVal = document.getElementById("roomTypeSelect")?.value || "Private Room";
    const localityVal = document.getElementById("localityInput")?.value || "Koramangala 4th Block";
    const landmarkVal = document.getElementById("prominentLandmark")?.value || "Near Sony World Signal";

    const previewRent = document.getElementById("previewCardRent");
    const previewDep = document.getElementById("previewCardDeposit");
    const previewType = document.getElementById("previewCardType");
    const previewTitle = document.getElementById("previewCardTitle");
    const previewLoc = document.getElementById("previewCardLoc");

    if (previewRent) previewRent.innerText = `₹${Number(rentVal).toLocaleString("en-IN")}`;
    if (previewDep) previewDep.innerText = `Deposit: ₹${Number(depVal).toLocaleString("en-IN")}`;
    if (previewType) previewType.innerText = typeVal.split("(")[0].trim();
    if (previewTitle) previewTitle.innerText = `${typeVal.split("(")[0].trim()} • ${localityVal}`;
    if (previewLoc) {
      previewLoc.innerHTML = `<span class="material-symbols-outlined text-sm text-secondary">location_on</span> ${landmarkVal || localityVal}`;
    }
  }
  window.updateLivePreviewCard = updateLivePreviewCard;

  function bindHostStudioForm() {
    const dropZone = document.getElementById("dropZone");
    const photoInput = document.getElementById("hostPhotoInput");

    if (dropZone && photoInput) {
      dropZone.addEventListener("click", () => photoInput.click());

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("border-primary", "bg-sky-100/50");
      });
      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("border-primary", "bg-sky-100/50");
      });
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("border-primary", "bg-sky-100/50");
        if (e.dataTransfer.files) handleHostFiles(e.dataTransfer.files);
      });

      photoInput.addEventListener("change", (e) => {
        if (e.target.files) handleHostFiles(e.target.files);
      });
    }
  }

  function handleHostFiles(files) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        state.uploadedPhotos.push({
          dataUrl: e.target.result,
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(1) + " MB"
        });
        renderHostPhotoPreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderHostPhotoPreviews() {
    const container = document.getElementById("photoPreviewsContainer");
    const counterText = document.getElementById("photosCountText");
    if (!container) return;

    if (counterText) {
      counterText.innerText = `${state.uploadedPhotos.length} Photos Staged`;
    }

    if (state.uploadedPhotos.length === 0) return;

    container.innerHTML = state.uploadedPhotos
      .map(
        (photo, idx) => `
        <div class="relative group rounded-xl overflow-hidden bg-surface-container shadow-md border border-sky-100">
          <img class="w-full h-28 object-cover" src="${photo.dataUrl}" alt="Photo ${idx + 1}" />
          ${
            idx === 0
              ? `<div class="absolute top-2 left-2 bg-primary text-on-primary font-label text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm font-bold">
                  <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">star</span> Cover
                </div>`
              : ""
          }
          <button class="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error" type="button" onclick="removeHostPhoto(${idx})">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
          <div class="p-2 bg-surface-container-lowest flex items-center justify-between font-label text-[11px]">
            <span class="text-on-surface truncate">${photo.name}</span>
            <span class="text-on-surface-variant">${photo.size}</span>
          </div>
        </div>
      `
      )
      .join("");

    // Update Live Preview thumbnail if photos exist
    if (state.uploadedPhotos.length > 0) {
      const previewImg = document.getElementById("previewCardImg");
      if (previewImg) previewImg.src = state.uploadedPhotos[0].dataUrl;
    }
  }

  function removeHostPhoto(idx) {
    state.uploadedPhotos.splice(idx, 1);
    renderHostPhotoPreviews();
  }
  window.removeHostPhoto = removeHostPhoto;

  async function submitHostListing() {
    const submitBtn = document.getElementById("publishBtn");
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">progress_activity</span> Executing Supabase Insert...`;

    // Collect field values
    const listerName = document.getElementById("listerName")?.value.trim() || "Ananya Deshmukh";
    const phone = document.getElementById("listerPhone")?.value.trim() || "+91 98201 44521";
    const city = document.getElementById("citySelect")?.value || "Bengaluru";
    const locality = document.getElementById("localityInput")?.value.trim() || "Koramangala";
    const landmark = document.getElementById("prominentLandmark")?.value.trim() || "";
    const address = document.getElementById("fullAddress")?.value.trim() || "";
    const rent = parseFloat(document.getElementById("monthlyRent")?.value || "20000");
    const deposit = parseFloat(document.getElementById("securityDeposit")?.value || "40000");
    const roomType = document.getElementById("roomTypeSelect")?.value || "Private Room";

    const amenities = Array.from(document.querySelectorAll("#amenityPills .amenity-chip.active")).map((el) =>
      el.innerText.trim()
    );

    // Photos: collect data URLs or fallback
    const photos =
      state.uploadedPhotos.length > 0
        ? state.uploadedPhotos.map((p) => p.dataUrl)
        : ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80"];

    try {
      // 1. Geocode location
      let coords = { lat: 12.9352, lng: 77.6245 };
      if (state.mapInstance) {
        coords = await state.mapInstance.geocodeAddress(city, address || locality);
      }

      const roomPayload = {
        lister_name: listerName,
        title: `${roomType} • ${locality}`,
        city: city,
        address: address || locality,
        landmark: landmark,
        contact_phone: phone,
        contact_email: state.user?.email || "host@dialroomease.in",
        rent_inr: rent,
        room_type: roomType,
        amenities: amenities.length > 0 ? amenities : ["Furnished", "Wi-Fi", "Attached Washroom"],
        image_urls: photos,
        lat: coords.lat,
        lng: coords.lng
      };

      const result = await window.dbService.addRoom(roomPayload);

      // Trigger realtime Supabase notification toast
      triggerSupabaseToast(`INSERT INTO rooms (₹${Number(rent).toLocaleString("en-IN")}/mo • ${locality})`);

      // Prepend to My Active Listings
      prependNewListingCard({
        title: `${roomType} • ${locality}`,
        rent: Number(rent).toLocaleString("en-IN"),
        locality: locality,
        landmark: landmark || city,
        img: photos[0],
        timestamp: "Just now"
      });

      // Update active counters
      const activeStats = document.getElementById("statsActiveCount");
      const listCount = document.getElementById("listingsCount");
      if (activeStats) activeStats.innerText = "03";
      if (listCount) listCount.innerText = "3";

      showToast("Room listing published live to Supabase!", "success");

      // Reload seeker listings & map markers
      await refreshRoomsData();

      submitBtn.innerHTML = `<span class="material-symbols-outlined text-base">check_circle</span> Published Live!`;
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }, 2000);
    } catch (err) {
      showToast(err.message || "Failed to publish listing.", "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
  window.submitHostListing = submitHostListing;

  function prependNewListingCard(item) {
    const container = document.getElementById("myActiveListingsContainer");
    if (!container) return;

    const card = document.createElement("div");
    card.className =
      "bg-surface-container-lowest/90 backdrop-blur-xl rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,97,148,0.12)] border border-primary/30 flex flex-col sm:flex-row gap-4 items-start listing-card-row animate-fade-in";
    card.setAttribute("data-status", "live");
    card.innerHTML = `
      <div class="w-full sm:w-36 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container relative">
        <img class="w-full h-full object-cover" src="${item.img}" alt="${item.title}" />
        <span class="absolute top-1.5 left-1.5 bg-primary text-on-primary font-label text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</span>
      </div>
      <div class="flex-1 space-y-1.5 w-full">
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1 font-label text-[11px] bg-secondary-container/40 text-on-secondary-container px-2.5 py-0.5 rounded-full font-bold">
            <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> Active & Synced
          </span>
          <span class="text-base font-extrabold text-primary">₹${item.rent}<span class="text-xs text-on-surface-variant font-normal">/mo</span></span>
        </div>
        <h3 class="font-bold text-sm text-on-surface">${item.title}</h3>
        <p class="text-xs text-on-surface-variant truncate">${item.landmark}</p>
        <div class="flex items-center gap-3 pt-1 text-on-surface-variant font-label text-[11px]">
          <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs">visibility</span> 1 View</span>
          <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs">call</span> 0 Dials</span>
          <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs">schedule</span> ${item.timestamp}</span>
        </div>
        <div class="pt-2 flex items-center gap-2">
          <button class="px-3 py-1 rounded-full font-label text-xs bg-surface-container text-on-surface hover:bg-surface-container-high transition-all font-medium" type="button">Edit Details</button>
          <button class="px-3 py-1 rounded-full font-label text-xs bg-surface-container text-on-surface hover:bg-surface-container-high transition-all font-medium" type="button">Pause Listing</button>
          <button class="ml-auto w-7 h-7 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-surface-container transition-all" type="button"><span class="material-symbols-outlined text-xs">share</span></button>
        </div>
      </div>
    `;

    container.insertBefore(card, container.firstChild);
  }

  function filterMyListings(status) {
    const cards = document.querySelectorAll("#myActiveListingsContainer .listing-card-row");
    cards.forEach((card) => {
      const cardStatus = card.getAttribute("data-status");
      if (status === "all" || cardStatus === status) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  }
  window.filterMyListings = filterMyListings;

  function bindHeartbeatPing() {
    setInterval(() => {
      const timer = document.getElementById("syncTimer");
      if (timer) {
        const ms = Math.floor(Math.random() * 15) + 8;
        timer.innerText = `${ms}ms ago`;
      }
    }, 3500);
  }

  // --------------------------------------------------------------------------
  // ROOM SEEKER WORKSPACE & FILTER CONTROLS
  // --------------------------------------------------------------------------
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
      if (state.mapInstance) {
        state.mapInstance.renderRoomPins(state.allRooms);
      }
    } catch (e) {
      console.warn("Refresh rooms error:", e);
    }
  }

  function filterAndRenderRooms() {
    let filtered = [...state.allRooms];

    if (state.filters.city && state.filters.city !== "All Cities") {
      filtered = filtered.filter(
        (r) =>
          r.city.toLowerCase().includes(state.filters.city.toLowerCase()) ||
          r.address.toLowerCase().includes(state.filters.city.toLowerCase())
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
        (r) =>
          r.title.toLowerCase().includes(s) ||
          r.city.toLowerCase().includes(s) ||
          r.address.toLowerCase().includes(s) ||
          (r.landmark && r.landmark.toLowerCase().includes(s))
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
          <span class="material-symbols-outlined text-4xl text-secondary mb-2">hotel_class</span>
          <h4 class="text-base font-bold text-on-surface">No rooms found matching your filters</h4>
          <p class="text-xs text-on-surface-variant mt-1">Try expanding your monthly budget slider or selecting "All Cities".</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = rooms
      .map((r) => {
        const photo =
          r.image_urls && r.image_urls.length > 0
            ? r.image_urls[0]
            : "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80";

        const amenitiesList = (r.amenities || ["Furnished", "Wi-Fi"])
          .slice(0, 3)
          .map((a) => `<span class="bg-surface-container-low px-2 py-0.5 rounded text-[11px] font-medium text-on-surface-variant">${a}</span>`)
          .join("");

        return `
          <div class="room-card group">
            <div class="room-photo-wrapper">
              <img src="${photo}" alt="${r.title}" loading="lazy" />
              <div class="room-price-badge">₹${Number(r.rent_inr).toLocaleString("en-IN")}/mo</div>
              <span class="room-type-tag">${r.room_type || "Private Room"}</span>
            </div>
            <div class="p-5 flex flex-col flex-1 justify-between space-y-3">
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-label font-bold text-secondary flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">verified</span> Verified Space
                  </span>
                  <span class="text-xs font-semibold text-on-surface-variant">${r.city}</span>
                </div>
                <h4 class="font-bold text-base text-on-surface line-clamp-1 group-hover:text-primary transition-colors">${r.title}</h4>
                <p class="text-xs text-on-surface-variant flex items-center gap-1 truncate">
                  <span class="material-symbols-outlined text-sm text-secondary">location_on</span>
                  ${r.landmark || r.address}
                </p>
              </div>

              <div class="flex flex-wrap gap-1.5">
                ${amenitiesList}
              </div>

              <div class="pt-3 border-t border-sky-100 flex items-center justify-between gap-2">
                <div class="flex flex-col">
                  <span class="text-[10px] text-on-surface-variant">Lister</span>
                  <span class="text-xs font-bold text-on-surface">${r.lister_name || "Verified Host"}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <a href="tel:${r.contact_phone}" class="px-3 py-1.5 rounded-full font-label text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-container-high transition-all flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">call</span> Dial
                  </a>
                  <a href="https://wa.me/${(r.contact_phone || '').replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" class="px-3 py-1.5 rounded-full font-label text-xs font-bold bg-primary hover:bg-primary-container text-on-primary transition-all flex items-center gap-1 shadow-sm">
                    <span class="material-symbols-outlined text-xs">chat</span> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  // --------------------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // --------------------------------------------------------------------------
  function showToast(message, type = "info") {
    const toast = document.getElementById("app-toast");
    if (!toast) return;

    toast.innerText = message;
    toast.className = `toast-msg show ${type === "success" ? "toast-success" : type === "error" ? "toast-error" : ""}`;

    setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }
  window.showToast = showToast;

  function triggerSupabaseToast(queryText) {
    const toast = document.getElementById("supabaseToast");
    const queryEl = document.getElementById("toastQueryText");
    const timeEl = document.getElementById("toastTimestamp");
    if (!toast) return;

    if (queryEl) queryEl.innerText = queryText;
    if (timeEl) timeEl.innerText = new Date().toLocaleTimeString();

    toast.classList.remove("-translate-y-40", "opacity-0", "pointer-events-none");
    toast.classList.add("translate-y-0", "opacity-100");

    setTimeout(() => {
      dismissToast();
    }, 5000);
  }
  window.triggerSupabaseToast = triggerSupabaseToast;

  function dismissToast() {
    const toast = document.getElementById("supabaseToast");
    if (toast) {
      toast.classList.add("-translate-y-40", "opacity-0", "pointer-events-none");
      toast.classList.remove("translate-y-0", "opacity-100");
    }
  }
  window.dismissToast = dismissToast;

})();
