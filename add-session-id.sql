-- Add missing session_id column to participants table
ALTER TABLE participants ADD COLUMN session_id TEXT NOT NULL DEFAULT 'session1';

-- Create index for better query performance on session_id
CREATE INDEX idx_participants_session_id ON participants(session_id);

-- Update existing records to extract session info from name field if it exists
-- and set appropriate session_id values
UPDATE participants 
SET session_id = 'session1' 
WHERE name LIKE '%(March 11)%';

UPDATE participants 
SET session_id = 'session2' 
WHERE name LIKE '%(March 26)%';

-- Clean up names by removing session info from name field
UPDATE participants 
SET name = REPLACE(name, ' (March 11)', '') 
WHERE name LIKE '%(March 11)%';

UPDATE participants 
SET name = REPLACE(name, ' (March 26)', '') 
WHERE name LIKE '%(March 26)%';

-- Verify the changes
SELECT id, name, session_id, status, timestamp FROM participants ORDER BY timestamp;