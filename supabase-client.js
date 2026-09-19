/**
 * ============================================================================
 * DIAL ROOM EASE - SUPABASE DATABASE & AUTH SERVICE
 * ============================================================================
 * Connects to Supabase when configured, or provides seamless local persistence.
 */

class DatabaseService {
  constructor() {
    this.client = null;
    this.isSupabaseConnected = false;
    this.currentUser = null;
    this.init();
  }

  init() {
    // Check if configuration has valid URL and key
    const config = window.SUPABASE_CONFIG || {};
    const url = config.SUPABASE_URL ? config.SUPABASE_URL.trim() : "";
    const key = config.SUPABASE_ANON_KEY ? config.SUPABASE_ANON_KEY.trim() : "";

    const isValidUrl = url.startsWith("https://") && url.includes(".supabase.co");

    if (isValidUrl && key.length > 20 && window.supabase) {
      try {
        this.client = window.supabase.createClient(url, key);
        this.isSupabaseConnected = true;
        console.log(" Dial Room Ease: Connected successfully to Supabase cloud database!");
      } catch (err) {
        console.warn(" Failed to initialize Supabase client, falling back to local store:", err);
        this.isSupabaseConnected = false;
      }
    } else {
      this.isSupabaseConnected = false;
      console.log(" Dial Room Ease: Supabase credentials not set yet. Running in Local Preview mode with browser persistence.");
    }

    // Initialize local seed data if needed
    this.initLocalStorageSeed();

    // Check existing stored session
    this.currentUser = this.getStoredUser();
  }

  initLocalStorageSeed() {
    const existingRooms = localStorage.getItem("dial_room_ease_rooms");
    if (!existingRooms) {
      const defaultRooms = [
        {
          id: "room-1",
          lister_name: "Rohan Sharma",
          title: "Luxury 1BHK Studio with Balcony & City View",
          city: "Bengaluru",
          address: "4th Block, 100ft Road, Koramangala",
          landmark: "Near Sony World Signal & Forum Mall",
          contact_phone: "+91 98765 43210",
          contact_email: "rohan.sharma@example.com",
          rent_inr: 16500,
          room_type: "Private Room",
          amenities: ["High-Speed Wi-Fi", "AC", "Fully Furnished", "Power Backup"],
          image_urls: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80"],
          lat: 12.9352,
          lng: 77.6245,
          created_at: new Date().toISOString()
        },
        {
          id: "room-2",
          lister_name: "Priya Mehta",
          title: "Spacious Sunlit Room in Sea-Breeze Apartment",
          city: "Mumbai",
          address: "Carter Road, Bandra West",
          landmark: "Opposite Joggers Park Promenade",
          contact_phone: "+91 98200 11223",
          contact_email: "priya.mehta@example.com",
          rent_inr: 28000,
          room_type: "Private Room",
          amenities: ["AC", "Sea View", "Attached Washroom", "Modular Kitchen"],
          image_urls: ["https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80"],
          lat: 19.0607,
          lng: 72.8258,
          created_at: new Date().toISOString()
        },
        {
          id: "room-3",
          lister_name: "Amit Verma",
          title: "Cozy Peaceful Room near Metro Station",
          city: "Delhi",
          address: "Hauz Khas Enclave, South Delhi",
          landmark: "Walking distance from Hauz Khas Metro Gate 2",
          contact_phone: "+91 98110 55443",
          contact_email: "amit.verma@example.com",
          rent_inr: 14000,
          room_type: "Private Room",
          amenities: ["Wi-Fi", "Furnished", "Attached Balcony", "24x7 Security"],
          image_urls: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80"],
          lat: 28.5494,
          lng: 77.2001,
          created_at: new Date().toISOString()
        },
        {
          id: "room-4",
          lister_name: "Kavita Reddy",
          title: "Modern Techie-Friendly Room in IT Corridor",
          city: "Hyderabad",
          address: "Madhapur, HITEC City",
          landmark: "Near Cyber Towers & Inorbit Mall",
          contact_phone: "+91 97000 88991",
          contact_email: "kavita.reddy@example.com",
          rent_inr: 12500,
          room_type: "Private Room",
          amenities: ["Gigabit Wi-Fi", "AC", "Gym Access", "Power Backup"],
          image_urls: ["https://images.unsplash.com/photo-1540518614846-7ede433c4ef9?auto=format&fit=crop&w=1200&q=80"],
          lat: 17.4483,
          lng: 78.3915,
          created_at: new Date().toISOString()
        },
        {
          id: "room-5",
          lister_name: "Sneha Joshi",
          title: "Bright Garden-Facing Studio with Work Desk",
          city: "Pune",
          address: "Lane 7, Koregaon Park",
          landmark: "Close to German Bakery and Osho Garden",
          contact_phone: "+91 99220 33445",
          contact_email: "sneha.joshi@example.com",
          rent_inr: 11000,
          room_type: "Private Room",
          amenities: ["Furnished", "Wi-Fi", "Garden View", "Quiet Environment"],
          image_urls: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"],
          lat: 18.5362,
          lng: 73.8940,
          created_at: new Date().toISOString()
        },
        {
          id: "room-6",
          lister_name: "Vikram Singhania",
          title: "Heritage Style Room with Modern Amenities",
          city: "Jaipur",
          address: "Civil Lines, Near Metro",
          landmark: "Near Raj Bhavan and Crystal Palm",
          contact_phone: "+91 98290 77665",
          contact_email: "vikram.jaipur@example.com",
          rent_inr: 9500,
          room_type: "Private Room",
          amenities: ["AC", "Car Parking", "Terrace Garden", "Wi-Fi"],
          image_urls: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80"],
          lat: 26.9054,
          lng: 75.7873,
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem("dial_room_ease_rooms", JSON.stringify(defaultRooms));
    }

    if (!localStorage.getItem("dial_room_ease_users")) {
      localStorage.setItem("dial_room_ease_users", JSON.stringify([]));
    }
  }

  // --------------------------------------------------------------------------
  // USER AUTHENTICATION
  // --------------------------------------------------------------------------

  async register({ name, email, password, role }) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // 1. If Supabase is connected, attempt Supabase Auth or Profiles table
    if (this.isSupabaseConnected) {
      try {
        // First try registering in profiles table
        const { data, error } = await this.client
          .from("profiles")
          .insert([
            {
              full_name: cleanName,
              email: cleanEmail,
              password_hash: btoa(password), // simple obfuscation for demo
              role: role,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (error) {
          // If error is unique constraint, user already exists
          if (error.code === "23505" || error.message?.includes("duplicate")) {
            throw new Error("An account with this email already exists. Please log in.");
          }
          if (error.code === "42501" || error.message?.toLowerCase().includes("permission denied")) {
            console.error("Supabase permission denied on 'profiles' table:", error);
            throw new Error("Database Permission Error: Please run the updated SQL in schema.sql in your Supabase SQL Editor to grant permissions to the 'anon' role.");
          }
          console.warn("Supabase profile insert error, checking auth fallback:", error);
          throw new Error(error.message);
        }

        const userObj = {
          id: data.id,
          name: data.full_name,
          email: data.email,
          role: data.role
        };

        this.setStoredUser(userObj);
        return { success: true, user: userObj, mode: "supabase" };
      } catch (err) {
        throw err;
      }
    }

    // 2. Local fallback storage
    const users = JSON.parse(localStorage.getItem("dial_room_ease_users") || "[]");
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error("An account with this email already exists. Please log in.");
    }

    const newUser = {
      id: "usr-" + Date.now(),
      name: cleanName,
      email: cleanEmail,
      password: password,
      role: role,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem("dial_room_ease_users", JSON.stringify(users));

    const userObj = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    this.setStoredUser(userObj);
    return { success: true, user: userObj, mode: "local" };
  }

  async login({ email, password }) {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If Supabase is connected
    if (this.isSupabaseConnected) {
      try {
        const { data, error } = await this.client
          .from("profiles")
          .select("*")
          .eq("email", cleanEmail)
          .single();

        if (error || !data) {
          if (error && (error.code === "42501" || error.message?.toLowerCase().includes("permission denied"))) {
            console.error("Supabase permission denied on 'profiles' table:", error);
            throw new Error("Database Permission Error: Please run the updated SQL in schema.sql in your Supabase SQL Editor to grant permissions to the 'anon' role.");
          }
          throw new Error("Invalid email or password. Please check your credentials.");
        }

        // Check password match
        if (data.password_hash !== btoa(password) && data.password_hash !== password) {
          throw new Error("Invalid email or password. Please check your credentials.");
        }

        const userObj = {
          id: data.id,
          name: data.full_name,
          email: data.email,
          role: data.role
        };

        this.setStoredUser(userObj);
        return { success: true, user: userObj, mode: "supabase" };
      } catch (err) {
        throw err;
      }
    }

    // 2. Local fallback verification
    const users = JSON.parse(localStorage.getItem("dial_room_ease_users") || "[]");
    const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);

    if (!user) {
      throw new Error("Invalid email or password. Please check your credentials.");
    }

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    this.setStoredUser(userObj);
    return { success: true, user: userObj, mode: "local" };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem("dial_room_ease_active_user");
  }

  getStoredUser() {
    try {
      const u = localStorage.getItem("dial_room_ease_active_user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }

  setStoredUser(user) {
    this.currentUser = user;
    localStorage.setItem("dial_room_ease_active_user", JSON.stringify(user));
  }

  // Update user's active role (allows instant role switching without logout)
  async updateUserRole(newRole) {
    if (!this.currentUser) return;
    this.currentUser.role = newRole;
    this.setStoredUser(this.currentUser);

    if (this.isSupabaseConnected) {
      try {
        await this.client
          .from("profiles")
          .update({ role: newRole })
          .eq("email", this.currentUser.email);
      } catch (e) {
        console.warn("Could not sync role update to Supabase:", e);
      }
    }
  }

  // --------------------------------------------------------------------------
  // ROOM LISTINGS
  // --------------------------------------------------------------------------

  async getRooms(filters = {}) {
    const { city, maxPrice, search } = filters;

    if (this.isSupabaseConnected) {
      try {
        let query = this.client
          .from("rooms")
          .select("*")
          .order("created_at", { ascending: false });

        if (city && city !== "All Cities") {
          query = query.ilike("city", `%${city}%`);
        }
        if (maxPrice) {
          query = query.lte("rent_inr", Number(maxPrice));
        }

        const { data, error } = await query;
        if (error) throw error;

        let results = data || [];
        if (search) {
          const s = search.toLowerCase();
          results = results.filter(r =>
            r.title.toLowerCase().includes(s) ||
            r.city.toLowerCase().includes(s) ||
            r.address.toLowerCase().includes(s) ||
            r.landmark.toLowerCase().includes(s)
          );
        }
        return results;
      } catch (err) {
        console.warn("Supabase fetch rooms failed, falling back to local:", err);
      }
    }

    // Local fallback
    let rooms = JSON.parse(localStorage.getItem("dial_room_ease_rooms") || "[]");

    if (city && city !== "All Cities") {
      rooms = rooms.filter(r => r.city.toLowerCase().includes(city.toLowerCase()));
    }
    if (maxPrice) {
      rooms = rooms.filter(r => Number(r.rent_inr) <= Number(maxPrice));
    }
    if (search) {
      const s = search.toLowerCase();
      rooms = rooms.filter(r =>
        r.title.toLowerCase().includes(s) ||
        r.city.toLowerCase().includes(s) ||
        r.address.toLowerCase().includes(s) ||
        (r.landmark && r.landmark.toLowerCase().includes(s))
      );
    }

    return rooms;
  }

  async getMyRooms(userEmail) {
    if (!userEmail) return [];

    if (this.isSupabaseConnected) {
      try {
        const { data, error } = await this.client
          .from("rooms")
          .select("*")
          .eq("contact_email", userEmail)
          .order("created_at", { ascending: false });

        if (!error && data) return data;
      } catch (e) {
        console.warn("Failed to fetch my rooms from Supabase:", e);
      }
    }

    const rooms = JSON.parse(localStorage.getItem("dial_room_ease_rooms") || "[]");
    return rooms.filter(r => r.contact_email?.toLowerCase() === userEmail.toLowerCase());
  }

  async addRoom(roomData) {
    const newRoom = {
      ...roomData,
      id: "room-" + Date.now(),
      created_at: new Date().toISOString()
    };

    if (this.isSupabaseConnected) {
      try {
        const insertPayload = {
          lister_name: roomData.lister_name,
          title: roomData.title,
          city: roomData.city,
          address: roomData.address,
          landmark: roomData.landmark,
          contact_phone: roomData.contact_phone,
          contact_email: roomData.contact_email,
          rent_inr: Number(roomData.rent_inr),
          room_type: roomData.room_type || "Private Room",
          amenities: roomData.amenities || ["Furnished", "Wi-Fi", "Attached Washroom"],
          image_urls: roomData.image_urls || [],
          lat: roomData.lat || 12.9716,
          lng: roomData.lng || 77.5946
        };

        const { data, error } = await this.client
          .from("rooms")
          .insert([insertPayload])
          .select()
          .single();

        if (error) throw error;
        // Also cache locally
        const rooms = JSON.parse(localStorage.getItem("dial_room_ease_rooms") || "[]");
        rooms.unshift(data || newRoom);
        localStorage.setItem("dial_room_ease_rooms", JSON.stringify(rooms));
        return { success: true, room: data || newRoom, mode: "supabase" };
      } catch (err) {
        console.warn("Supabase add room failed, saving locally:", err);
      }
    }

    // Local storage save
    const rooms = JSON.parse(localStorage.getItem("dial_room_ease_rooms") || "[]");
    rooms.unshift(newRoom);
    localStorage.setItem("dial_room_ease_rooms", JSON.stringify(rooms));
    return { success: true, room: newRoom, mode: "local" };
  }
}

// Global singleton instance
window.dbService = new DatabaseService();

