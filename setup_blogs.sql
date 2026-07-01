-- Supabase SQL to create blogs table for organic creators

CREATE TABLE IF NOT EXISTS public.blogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blogs are viewable by everyone." 
  ON public.blogs FOR SELECT 
  USING ( true );

CREATE POLICY "Users can insert their own blogs." 
  ON public.blogs FOR INSERT 
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own blogs." 
  ON public.blogs FOR UPDATE 
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own blogs." 
  ON public.blogs FOR DELETE 
  USING ( auth.uid() = user_id );
