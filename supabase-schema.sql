-- Create songs table
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    status TEXT CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing' NOT NULL,
    parameters JSONB
);

-- Enable RLS on songs table
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own songs
CREATE POLICY "Users can view own songs" ON public.songs
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy: Users can insert their own songs
CREATE POLICY "Users can insert own songs" ON public.songs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own songs
CREATE POLICY "Users can update own songs" ON public.songs
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy: Users can delete their own songs
CREATE POLICY "Users can delete own songs" ON public.songs
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance on user_id queries
CREATE INDEX IF NOT EXISTS songs_user_id_idx ON public.songs(user_id);

-- Create index for better performance on created_at queries
CREATE INDEX IF NOT EXISTS songs_created_at_idx ON public.songs(created_at);
