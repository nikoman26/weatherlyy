-- WEATHERLY Database Schema
-- Create all necessary tables for the aviation weather application

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    favorite_airports TEXT[] DEFAULT '{}',
    license_number VARCHAR(100),
    total_flight_hours INTEGER DEFAULT 0,
    pilot_certification VARCHAR(255),
    preferences JSONB DEFAULT '{"temperatureUnit": "celsius", "windUnit": "kts", "darkMode": true, "emailAlerts": true, "smsAlerts": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Airports table
CREATE TABLE IF NOT EXISTS public.airports (
    id SERIAL PRIMARY KEY,
    icao VARCHAR(4) UNIQUE NOT NULL,
    iata VARCHAR(3),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    country VARCHAR(255),
    elevation INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Runways table
CREATE TABLE IF NOT EXISTS public.runways (
    id SERIAL PRIMARY KEY,
    airport_id INTEGER REFERENCES public.airports(id) ON DELETE CASCADE,
    ident VARCHAR(7) NOT NULL,
    length_ft INTEGER,
    width_ft INTEGER,
    surface VARCHAR(100),
    lighting VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weather data cache table (for performance)
CREATE TABLE IF NOT EXISTS public.weather_cache (
    id SERIAL PRIMARY KEY,
    icao VARCHAR(4) NOT NULL,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('metar', 'taf', 'notam')),
    raw_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_weather_cache_icao_type ON weather_cache(icao, data_type);
CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON weather_cache(expires_at);

-- PIREPs table
CREATE TABLE IF NOT EXISTS public.pireps (
    id SERIAL PRIMARY KEY,
    icao_code VARCHAR(4) NOT NULL,
    aircraft_type VARCHAR(20),
    flight_level VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    weather_conditions TEXT,
    turbulence VARCHAR(100),
    icing VARCHAR(100),
    remarks TEXT,
    submitted_by UUID REFERENCES public.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flight plans table
CREATE TABLE IF NOT EXISTS flight_plans (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    departure_icao VARCHAR(4) NOT NULL,
    destination_icao VARCHAR(4) NOT NULL,
    aircraft_type VARCHAR(20),
    planned_departure TIMESTAMP WITH TIME ZONE,
    flight_rules VARCHAR(10) DEFAULT 'VFR',
    route TEXT,
    aircraft_identification VARCHAR(10),
    departure_airport_data JSONB,
    destination_airport_data JSONB,
    weather_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys management (admin only)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) UNIQUE NOT NULL,
    encrypted_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pireps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own profile and admins can read all
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Weather cache is readable by all authenticated users
CREATE POLICY "Authenticated users can view weather cache" ON public.weather_cache
    FOR SELECT TO authenticated USING (true);

-- PIREPs policies
CREATE POLICY "Users can view all PIREPs" ON public.pireps
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own PIREPs" ON public.pireps
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);

-- Flight plans policies
CREATE POLICY "Users can view own flight plans" ON public.flight_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flight plans" ON public.flight_plans
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flight plans" ON public.flight_plans
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin only policies
CREATE POLICY "Only admins can manage API keys" ON public.api_keys
    FOR ALL TO authenticated USING (EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Users can insert system logs" ON public.system_logs
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flight_plans_updated_at BEFORE UPDATE ON public.flight_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.email,
        CASE 
            WHEN NEW.email LIKE '%admin%' THEN 'admin'
            ELSE 'user'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample airports
INSERT INTO public.airports (icao, iata, name, city, country, elevation, latitude, longitude, timezone) VALUES
('KJFK', 'JFK', 'John F. Kennedy International Airport', 'New York', 'United States', 13, 40.6413, -73.7781, 'America/New_York'),
('EGLL', 'LHR', 'Heathrow Airport', 'London', 'United Kingdom', 83, 51.4700, -0.4543, 'Europe/London'),
('KSFO', 'SFO', 'San Francisco International Airport', 'San Francisco', 'United States', 13, 37.6188, -122.3754, 'America/Los_Angeles'),
('KLAX', 'LAX', 'Los Angeles International Airport', 'Los Angeles', 'United States', 125, 33.9425, -118.4081, 'America/Los_Angeles'),
('KORD', 'ORD', 'Chicago O''Hare International Airport', 'Chicago', 'United States', 672, 41.9742, -87.9073, 'America/Chicago')
ON CONFLICT (icao) DO NOTHING;

-- Insert sample runway data
INSERT INTO public.runways (airport_id, ident, length_ft, width_ft, surface, lighting) VALUES
((SELECT id FROM airports WHERE icao = 'KJFK'), '04L/22R', 12079, 200, 'Asphalt/Concrete', 'High Intensity'),
((SELECT id FROM airports WHERE icao = 'KJFK'), '04R/22L', 8400, 200, 'Asphalt', 'High Intensity'),
((SELECT id FROM airports WHERE icao = 'EGLL'), '09L/27R', 12799, 164, 'Asphalt', 'High Intensity'),
((SELECT id FROM airports WHERE icao = 'EGLL'), '09R/27L', 12008, 164, 'Asphalt', 'High Intensity'),
((SELECT id FROM airports WHERE icao = 'KSFO'), '10L/28R', 11870, 200, 'Asphalt', 'High Intensity'),
((SELECT id FROM airports WHERE icao = 'KSFO'), '10R/28L', 11381, 200, 'Asphalt', 'High Intensity')
ON CONFLICT DO NOTHING;
