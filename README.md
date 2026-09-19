# Dial Room Ease 🛏️

A modern, immersive web platform for short-term and long-term room rentals featuring a **3D sky-blue bedroom background**, **liquid glass UI**, **scroll-based parallax**, an **interactive Leaflet map with city autocomplete**, and **Supabase authentication & database integration**.

---

## 🚀 Quick Start (Running the Website)

You can run this website right away in any of the following ways:

### Method 1: Double Click
Simply open `index.html` directly in your favorite modern browser (Chrome, Edge, Firefox, Brave, Safari).

### Method 2: Local HTTP Server (Recommended)
Using Node.js:
```bash
npx serve .
```
Then open the local URL shown in your terminal (e.g. `http://localhost:3000`).

---

## 🔑 How to Connect Your Supabase Database

We've made integrating Supabase straightforward!

### Step 1: Get your Supabase credentials
1. Go to [https://supabase.com](https://supabase.com) and open your project dashboard.
2. Click on the **Project Settings** (gear icon) in the left sidebar, then click on **API**.
3. Under **Project URL**, copy your URL.
4. Under **Project API Keys**, copy the **`anon` `public`** key.

### Step 2: Paste credentials into `supabase-config.js`
Open the file [`supabase-config.js`](file:///d:/DRE/supabase-config.js) in your editor and insert your URL and key:

```javascript
const SUPABASE_CONFIG = {
  // Replace with your project URL:
  SUPABASE_URL: "https://your-project-id.supabase.co",

  // Replace with your anon public key:
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};
```

### Step 3: Run the Database Schema in Supabase
1. In your Supabase Dashboard, go to **SQL Editor** (left menu).
2. Click **New Query**.
3. Open the provided [`schema.sql`](file:///d:/DRE/schema.sql) file, copy its entire content, paste it into the Supabase SQL editor, and click **Run**.
4. That's it! Your `profiles` and `rooms` tables, security policies, table permissions (`GRANT`), and sample data will be created automatically.

> [!IMPORTANT]
> **Got "permission denied for table profiles"?**
> If you previously created the tables without granting permissions to the Supabase `anon` role, simply run this quick SQL in your **Supabase SQL Editor**:
> ```sql
> GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
> GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
> GRANT ALL ON TABLE public.rooms TO anon, authenticated, service_role;
> GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
> ```

> [!TIP]
> **Built-in Offline / Local Preview Mode**:
> If you test the website before entering your Supabase credentials, Dial Room Ease will automatically run in local preview mode using browser storage (`localStorage`), so every feature works immediately without errors!

---

## 🌟 Key Features Implemented

### 1. Authentication & Security
- **Strict Password Validation**:
  - Minimum 8 characters
  - At least 1 uppercase letter (`A-Z`)
  - At least 1 number (`0-9`)
  - At least 1 special character (`!@#$%^&*...`)
  - Re-enter password verification box with live match checking
- **Intent Selection**:
  - **Looking For a Room** (Room Seeker)
  - **Giving a Room** (Room Lister)
- **Session Persistence**: Saved user profile and posted listings automatically load whenever the user logs back in.

### 2. 3D Sky-Blue Bedroom Experience (Three.js)
- **Sky-blue aesthetic room** with soft ambient daylight entering through scenic window.
- **Detailed Bed**: Modern bed with sky-blue headboard, cushions, realistic duvet, and throw blanket.
- **Beautiful Chandelier**: Concentric gold tiers with hanging multifaceted crystal pendants and glowing warm lights with gentle swaying motion.
- **Bookshelf**: Multi-tier shelf filled with colorful 3D books, leaning books, potted plants, and ceramic vases.
- **Scroll-Linked 3D Camera**: As you scroll through the website, the camera glides smoothly through the bedroom space.

### 3. Liquid Glass UI
- Glassmorphism design with backdrop blur, glowing borders, and fluid hover effects.
- Clean typography and sky-blue color scheme.
- Responsive across desktop, tablets, and smartphones.

### 4. Interactive Map & City Autocomplete (Leaflet)
- Interactive map centered on India with smooth zoom.
- **Search Bar with Live Autocomplete**: Suggestions appear as you type Indian and global cities.
- Selecting any city flies the camera and zooms in smoothly.
- Map markers show rent in **INR (₹)** with custom liquid glass price bubbles. Clicking a pin opens a popup with photos and contact buttons.

### 5. Role-Specific Experiences
- **"Looking For a Room"**:
  - Monthly budget slider in INR (₹5,000 to ₹60,000+).
  - City and category filters.
  - Listings grid with photos, amenities, landmarks, and direct "Call" and "WhatsApp" contact links.
- **"Giving a Room"**:
  - Glass card form: Lister Name, City, Full Address, Landmark, Contact Info (Phone & Email), Monthly Rent in INR.
  - **Device Photo Upload**: Select photos from phone or computer with real-time thumbnail previews and deletion.
  - "Add Listing" button saves the room directly to Supabase and instantly updates the map pin and listings feed.
  - "My Posted Listings" panel to manage your offerings.

