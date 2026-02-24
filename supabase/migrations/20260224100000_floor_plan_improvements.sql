-- Floor plan improvements: Realtime + zones
-- Enable Realtime for floor_tables so multiple devices see changes instantly
ALTER PUBLICATION supabase_realtime ADD TABLE floor_tables;

-- Add zone column for grouping tables into sections (VIP, terrace, main hall, etc.)
ALTER TABLE floor_tables ADD COLUMN IF NOT EXISTS zone TEXT DEFAULT NULL;
