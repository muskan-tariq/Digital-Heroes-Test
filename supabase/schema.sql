-- Digital Heroes Supabase Schema

-- Custom Types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'past_due', 'canceled');
CREATE TYPE draw_status AS ENUM ('draft', 'published');

-- CHARITIES TABLE
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PROFILES TABLE (Extends Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role DEFAULT 'user',
  sub_status subscription_status DEFAULT 'inactive',
  sub_renewal_date TIMESTAMPTZ,
  charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  charity_percentage DECIMAL DEFAULT 10.0 CHECK (charity_percentage >= 10.0 AND charity_percentage <= 100.0),
  mock_balance DECIMAL DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SCORES TABLE
-- Rules: Max 5 per user (enforced via application layer or triggers)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date) -- One score entry per date allowed
);

-- DRAWS TABLE
CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month VARCHAR(7) NOT NULL UNIQUE, -- e.g. "2026-04"
  status draw_status DEFAULT 'draft',
  winning_numbers INTEGER[] DEFAULT '{}',
  total_pool DECIMAL DEFAULT 0,
  match_5_pool DECIMAL DEFAULT 0,
  match_4_pool DECIMAL DEFAULT 0,
  match_3_pool DECIMAL DEFAULT 0,
  jackpot_rollover DECIMAL DEFAULT 0,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- USER_DRAWS TABLE (Tickets/Entries)
CREATE TABLE user_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_scores INTEGER[] NOT NULL,
  matches INTEGER DEFAULT 0,
  winnings DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- WINNER VERIFICATIONS
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  proof_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, paid
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS)

-- Helper function to check if user is admin (prevents recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access to profiles" ON profiles USING (is_admin());

-- Scores
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own scores" ON scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scores" ON scores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own scores" ON scores FOR UPDATE USING (auth.uid() = user_id);

-- Charities
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read charities" ON charities FOR SELECT USING (true);
CREATE POLICY "Admins can manage charities" ON charities USING (is_admin());

-- Draws
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published draws" ON draws FOR SELECT USING (status = 'published' OR is_admin());

-- User Draws
ALTER TABLE user_draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own entries" ON user_draws FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all entries" ON user_draws FOR SELECT USING (is_admin());

-- Triggers for User Creation (Assuming Supabase Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
