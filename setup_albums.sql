-- 1. Create the albums table
CREATE TABLE albums (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price_usd numeric NOT NULL DEFAULT 0,
  cover_image_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Enable Row Level Security (RLS) on albums
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for the albums table
-- Allow anyone to read albums
CREATE POLICY "Albums are viewable by everyone" ON albums
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own albums
CREATE POLICY "Users can insert their own albums" ON albums
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own albums
CREATE POLICY "Users can update their own albums" ON albums
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own albums
CREATE POLICY "Users can delete their own albums" ON albums
  FOR DELETE USING (auth.uid() = user_id);
