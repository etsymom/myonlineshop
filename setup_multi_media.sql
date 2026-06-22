-- setup_multi_media.sql

-- 1. Create album_media table
CREATE TABLE IF NOT EXISTS album_media (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id uuid REFERENCES albums(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL, -- 'image' or 'video'
  is_free_preview boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Migrate existing single-media albums to the new table
INSERT INTO album_media (album_id, media_url, media_type, is_free_preview)
SELECT id, media_url, COALESCE(media_type, 'image'), true
FROM albums
WHERE media_url IS NOT NULL;

-- 2.5 Add count columns to albums
ALTER TABLE albums ADD COLUMN IF NOT EXISTS total_images INT DEFAULT 0;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS total_videos INT DEFAULT 0;

-- 3. Enable RLS
ALTER TABLE album_media ENABLE ROW LEVEL SECURITY;

-- 4. Policies for album_media
DROP POLICY IF EXISTS "Public can view free media" ON album_media;
CREATE POLICY "Public can view free media" ON album_media 
FOR SELECT USING (is_free_preview = true);

DROP POLICY IF EXISTS "Purchasers can view all media" ON album_media;
CREATE POLICY "Purchasers can view all media" ON album_media 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM purchases 
    WHERE purchases.product_key = album_media.album_id::text 
    AND purchases.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Creators can view their own media" ON album_media;
CREATE POLICY "Creators can view their own media" ON album_media 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM albums 
    WHERE albums.id = album_media.album_id 
    AND albums.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Creators can insert media" ON album_media;
CREATE POLICY "Creators can insert media" ON album_media 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM albums 
    WHERE albums.id = album_media.album_id 
    AND albums.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Creators can delete their media" ON album_media;
CREATE POLICY "Creators can delete their media" ON album_media 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM albums 
    WHERE albums.id = album_media.album_id 
    AND albums.user_id = auth.uid()
  )
);

-- 5. Fix purchases RLS so purchasers can securely prove they bought an album
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
CREATE POLICY "Users can view their own purchases" ON purchases 
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert purchases" ON purchases;
CREATE POLICY "Users can insert purchases" ON purchases 
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Optional: Allow creators to see who purchased their albums
DROP POLICY IF EXISTS "Creators can view purchases of their albums" ON purchases;
CREATE POLICY "Creators can view purchases of their albums" ON purchases 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM albums 
    WHERE albums.id::text = purchases.product_key
    AND albums.user_id = auth.uid()
  )
);
