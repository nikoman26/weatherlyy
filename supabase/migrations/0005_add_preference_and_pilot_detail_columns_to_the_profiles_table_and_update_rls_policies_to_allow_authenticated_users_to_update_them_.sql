ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS pilot_certification TEXT,
ADD COLUMN IF NOT EXISTS temperature_unit TEXT DEFAULT 'celsius',
ADD COLUMN IF NOT EXISTS wind_unit TEXT DEFAULT 'kts',
ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_alerts BOOLEAN DEFAULT FALSE;

-- Update the existing profiles_update_policy to ensure it covers the new columns
DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles 
FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);