-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Airports Table
CREATE TABLE public.airports (
  icao TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  elevation INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  runways JSONB DEFAULT '[]'::jsonb,
  frequencies JSONB DEFAULT '[]'::jsonb,
  procedures JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "airports_public_read" ON public.airports FOR SELECT USING (true);

-- 3. PIREPs Table
CREATE TABLE public.pireps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  icao_code TEXT,
  aircraft_type TEXT,
  flight_level TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  weather_conditions TEXT,
  turbulence TEXT,
  icing TEXT,
  remarks TEXT,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pireps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pireps_read_policy" ON public.pireps FOR SELECT USING (true);
CREATE POLICY "pireps_insert_policy" ON public.pireps FOR INSERT TO authenticated WITH CHECK (auth.uid() = submitted_by);

-- 4. Flight Plans Table
CREATE TABLE public.flight_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  departure_icao TEXT,
  destination_icao TEXT,
  aircraft_type TEXT,
  planned_departure TIMESTAMP WITH TIME ZONE,
  flight_rules TEXT DEFAULT 'VFR',
  route JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.flight_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flight_plans_select_policy" ON public.flight_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "flight_plans_insert_policy" ON public.flight_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "flight_plans_delete_policy" ON public.flight_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Trigger for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, split_part(new.email, '@', 1));
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();