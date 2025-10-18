-- Auto-create users table entries when auth.users are created
-- This ensures chats can reference user_id properly

-- Function to auto-create user in users table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, user_metadata)
  VALUES (
    NEW.id,
    NEW.email,
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function when new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill existing auth users into users table
INSERT INTO public.users (id, email, user_metadata)
SELECT 
  id, 
  email,
  '{}'::jsonb
FROM auth.users
ON CONFLICT (id) DO NOTHING;
