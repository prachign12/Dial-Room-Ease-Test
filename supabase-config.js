/**
 * ============================================================================
 * DIAL ROOM EASE - SUPABASE CONFIGURATION
 * ============================================================================
 * 
 * Instructions to connect your Supabase database:
 * 
 * 1. Go to https://supabase.com and open your project dashboard.
 * 2. Click on "Project Settings" (gear icon) -> "API".
 * 3. Copy your "Project URL" and paste it below into SUPABASE_URL.
 * 4. Copy your "anon public" API Key and paste it below into SUPABASE_ANON_KEY.
 * 5. Run the provided 'schema.sql' in your Supabase SQL Editor to create the tables.
 * 
 * NOTE: If these values are left empty or as default placeholders,
 * the website will automatically run in "Demo / Local Storage" mode
 * so you can test all features (register, login, add listings, map search)
 * immediately right out of the box!
 */

const SUPABASE_CONFIG = {
  // Paste your Supabase Project URL here, e.g.: "https://your-project-id.supabase.co"
  SUPABASE_URL: "https://fteqkyrppraaozvcwtcj.supabase.co",

  // Paste your Supabase anon public key here, e.g.: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  SUPABASE_ANON_KEY: "sb_publishable_YRWB7xUsAnqAl-QKboi5Fg_GYcMSZAM"
};

// Export configuration for browser usage
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

