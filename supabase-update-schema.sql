-- Add updated_at column to the songs table
ALTER TABLE songs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing rows to have updated_at = created_at initially
UPDATE songs 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Create a trigger to automatically update the updated_at column when a row is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_songs_updated_at ON songs;
CREATE TRIGGER update_songs_updated_at
    BEFORE UPDATE ON songs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add an index on updated_at for better query performance
CREATE INDEX IF NOT EXISTS idx_songs_updated_at ON songs(updated_at);

-- Verify the schema (use this query to check the table structure)
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'songs' 
ORDER BY ordinal_position;
