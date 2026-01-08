-- Update the handle_new_user function to automatically make the admin email an admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    new.id, 
    split_part(new.email, '@', 1),
    CASE 
      WHEN new.email = 'admin@weatherly.co.ke' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN new;
END;
$$;