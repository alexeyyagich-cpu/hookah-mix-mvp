-- Add selling_price to sessions for hookah revenue tracking
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS selling_price DECIMAL DEFAULT NULL;
