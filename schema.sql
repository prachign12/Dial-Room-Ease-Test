-- ============================================================================
-- DIAL ROOM EASE - SUPABASE DATABASE SCHEMA & PERMISSIONS
-- ============================================================================
-- Copy and run this entire script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES table
-- Stores user accounts, preferences, and primary role
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    password_hash TEXT, -- Stored for custom auth or managed via Supabase Auth
    role TEXT NOT NULL CHECK (role IN ('Looking For a Room', 'Giving a Room')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create ROOMS table
-- Stores all posted room listings with owner contact, price in INR, location, and photos
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lister_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    lister_name TEXT NOT NULL,
    title TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    landmark TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    rent_inr NUMERIC NOT NULL,
    room_type TEXT DEFAULT 'Private Room',
    amenities TEXT[] DEFAULT ARRAY['Furnished', 'Wi-Fi', 'Attached Washroom'],
    image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_rooms_city ON public.rooms(city);
CREATE INDEX IF NOT EXISTS idx_rooms_rent ON public.rooms(rent_inr);
CREATE INDEX IF NOT EXISTS idx_rooms_lister_id ON public.rooms(lister_id);

-- 5. Grant Schema and Table Privileges (Required by PostgreSQL / Supabase)
-- In Supabase, the public API connects using 'anon' and 'authenticated' database roles.
-- PostgreSQL requires explicit table GRANTs in addition to Row Level Security policies.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.rooms TO anon, authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- 7. Setup RLS Policies (Idempotent cleanup & policy definitions)
DROP POLICY IF EXISTS "Allow public read access for rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow insert access for rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow update access for rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow delete access for rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow all access for rooms" ON public.rooms;

CREATE POLICY "Allow all access for rooms"
    ON public.rooms FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow delete access for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all access for profiles" ON public.profiles;

CREATE POLICY "Allow all access for profiles"
    ON public.profiles FOR ALL
    USING (true)
    WITH CHECK (true);

-- 8. Seed initial sample room listings across major Indian cities
INSERT INTO public.rooms (lister_name, title, city, address, landmark, contact_phone, contact_email, rent_inr, room_type, amenities, image_urls, lat, lng)
VALUES
(
    'Rohan Sharma',
    'Luxury 1BHK Studio with Balcony & City View',
    'Bengaluru',
    '4th Block, 100ft Road, Koramangala',
    'Near Sony World Signal & Forum Mall',
    '+91 98765 43210',
    'rohan.sharma@example.com',
    16500,
    'Private Room',
    ARRAY['High-Speed Wi-Fi', 'AC', 'Fully Furnished', 'Power Backup'],
    ARRAY['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80'],
    12.9352,
    77.6245
),
(
    'Priya Mehta',
    'Spacious Sunlit Room in Sea-Breeze Apartment',
    'Mumbai',
    'Carter Road, Bandra West',
    'Opposite Joggers Park Promenade',
    '+91 98200 11223',
    'priya.mehta@example.com',
    28000,
    'Private Room',
    ARRAY['AC', 'Sea View', 'Attached Washroom', 'Modular Kitchen'],
    ARRAY['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80'],
    19.0607,
    72.8258
),
(
    'Amit Verma',
    'Cozy Peaceful Room near Metro Station',
    'Delhi',
    'Hauz Khas Enclave, South Delhi',
    'Walking distance from Hauz Khas Metro Gate 2',
    '+91 98110 55443',
    'amit.verma@example.com',
    14000,
    'Private Room',
    ARRAY['Wi-Fi', 'Furnished', 'Attached Balcony', '24x7 Security'],
    ARRAY['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80'],
    28.5494,
    77.2001
),
(
    'Kavita Reddy',
    'Modern Techie-Friendly Room in IT Corridor',
    'Hyderabad',
    'Madhapur, HITEC City',
    'Near Cyber Towers & Inorbit Mall',
    '+91 97000 88991',
    'kavita.reddy@example.com',
    12500,
    'Private Room',
    ARRAY['Gigabit Wi-Fi', 'AC', 'Gym Access', 'Power Backup'],
    ARRAY['https://images.unsplash.com/photo-1540518614846-7ede433c4ef9?auto=format&fit=crop&w=1200&q=80'],
    17.4483,
    78.3915
),
(
    'Sneha Joshi',
    'Bright Garden-Facing Studio with Work Desk',
    'Pune',
    'Lane 7, Koregaon Park',
    'Close to German Bakery and Osho Garden',
    '+91 99220 33445',
    'sneha.joshi@example.com',
    11000,
    'Private Room',
    ARRAY['Furnished', 'Wi-Fi', 'Garden View', 'Quiet Environment'],
    ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'],
    18.5362,
    73.8940
)
ON CONFLICT DO NOTHING;
