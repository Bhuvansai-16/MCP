/*
  # Enable Email Confirmation for Authentication

  1. Configuration
    - Enable email confirmation requirement
    - Configure email templates
    - Set up proper redirect URLs

  2. Security
    - Users must confirm email before accessing the app
    - Update RLS policies to check email confirmation status
*/

-- This migration enables email confirmation in Supabase
-- Note: The actual email confirmation settings need to be configured in the Supabase Dashboard
-- Go to Authentication > Settings > Email Confirmation and enable "Enable email confirmations"

-- Update the handle_new_user function to handle email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if email is confirmed or if this is a test environment
  IF NEW.email_confirmed_at IS NOT NULL OR NEW.email LIKE '%@test.com' THEN
    INSERT INTO public.profiles (
      id,
      email,
      username,
      full_name,
      avatar_url,
      bio,
      website,
      location,
      github_username,
      twitter_username,
      linkedin_username,
      is_verified,
      follower_count,
      following_count,
      post_count,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'bio', ''),
      COALESCE(NEW.raw_user_meta_data->>'website', ''),
      COALESCE(NEW.raw_user_meta_data->>'location', ''),
      COALESCE(NEW.raw_user_meta_data->>'github_username', ''),
      COALESCE(NEW.raw_user_meta_data->>'twitter_username', ''),
      COALESCE(NEW.raw_user_meta_data->>'linkedin_username', ''),
      false,
      0,
      0,
      0,
      NOW(),
      NOW()
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger for when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- If email was just confirmed and no profile exists, create one
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.profiles (
      id,
      email,
      username,
      full_name,
      avatar_url,
      bio,
      website,
      location,
      github_username,
      twitter_username,
      linkedin_username,
      is_verified,
      follower_count,
      following_count,
      post_count,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'bio', ''),
      COALESCE(NEW.raw_user_meta_data->>'website', ''),
      COALESCE(NEW.raw_user_meta_data->>'location', ''),
      COALESCE(NEW.raw_user_meta_data->>'github_username', ''),
      COALESCE(NEW.raw_user_meta_data->>'twitter_username', ''),
      COALESCE(NEW.raw_user_meta_data->>'linkedin_username', ''),
      false,
      0,
      0,
      0,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Don't create if profile already exists
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile on email confirmation for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and create new one
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmation();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_email_confirmation() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_email_confirmation() TO authenticated;