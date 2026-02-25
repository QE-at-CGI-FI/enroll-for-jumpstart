-- Database setup for AI Dev Jumpstart Workshop Enrollment

-- Create the participants table
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    workshop_id TEXT NOT NULL DEFAULT 'ai-dev-jumpstart-2026',
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('enrolled', 'queued')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    participant_id TEXT NOT NULL UNIQUE,
    session_id TEXT NOT NULL DEFAULT 'session1'
);

-- Create indexes for better query performance
CREATE INDEX idx_participants_workshop_id ON participants(workshop_id);
CREATE INDEX idx_participants_status ON participants(status);
CREATE INDEX idx_participants_session_id ON participants(session_id);
CREATE INDEX idx_participants_timestamp ON participants(timestamp);

-- Set up Row Level Security (optional but recommended)
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access (since this is a public enrollment form)
CREATE POLICY "Public can view all participants" ON participants
    FOR SELECT USING (true);

-- Create a policy to allow public insert (for new enrollments)
CREATE POLICY "Public can insert new participants" ON participants
    FOR INSERT WITH CHECK (true);

-- Create a policy to allow public updates (for status changes)
CREATE POLICY "Public can update participants" ON participants
    FOR UPDATE USING (true);

-- Create a policy to allow public delete (for admin functions)
CREATE POLICY "Public can delete participants" ON participants
    FOR DELETE USING (true);

-- Insert sample data (optional - remove if not needed)
-- INSERT INTO participants (name, status, timestamp, participant_id, session_id) VALUES
-- ('Test User', 'enrolled', NOW(), 'test123', 'session1');

-- Show table structure
\d participants;