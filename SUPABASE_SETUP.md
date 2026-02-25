# Supabase Setup Guide

This guide will help you set up Supabase databases for both test and production environments for the AI Dev Jumpstart Workshop enrollment application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Basic understanding of SQL databases

## Step 1: Create Supabase Projects

### Test Environment Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Set project name: `jumpstart-workshop-test`
5. Set a strong database password
6. Choose a region close to your users
7. Click "Create new project"

### Production Environment Project

1. Repeat the above steps
2. Set project name: `jumpstart-workshop-prod`
3. Use a different, strong database password
4. Click "Create new project"

## Step 2: Database Schema Setup

For both test and production projects, run the following SQL in the Supabase SQL Editor:

```sql
-- Create the participants table
CREATE TABLE participants (
    id BIGSERIAL PRIMARY KEY,
    workshop_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('enrolled', 'queued')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    participant_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX idx_participants_workshop_status ON participants(workshop_id, status);
CREATE INDEX idx_participants_timestamp ON participants(timestamp);

-- Create RLS (Row Level Security) policies
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Allow read access for all users (for viewing enrollment lists)
CREATE POLICY "Allow public read access" ON participants
    FOR SELECT USING (true);

-- Allow insert access for all users (for new enrollments)
CREATE POLICY "Allow public insert access" ON participants
    FOR INSERT WITH CHECK (true);

-- Allow update access for all users (for status changes)
CREATE POLICY "Allow public update access" ON participants
    FOR UPDATE USING (true);

-- Allow delete access for all users (for admin functions)
CREATE POLICY "Allow public delete access" ON participants
    FOR DELETE USING (true);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Step 3: Configure API Keys

### For Test Environment:

1. Go to your test project dashboard
2. Navigate to Settings → API
3. Copy the project URL and anon/public key
4. Note these down as `TEST_SUPABASE_URL` and `TEST_SUPABASE_ANON_KEY`

### For Production Environment:

1. Go to your production project dashboard
2. Navigate to Settings → API
3. Copy the project URL and anon/public key
4. Note these down as `PROD_SUPABASE_URL` and `PROD_SUPABASE_ANON_KEY`

## Step 4: Update Configuration

Open `config.js` and replace the placeholder values:

```javascript
const CONFIG = {
  test: {
    supabaseUrl: "YOUR_TEST_SUPABASE_URL", // Replace with test project URL
    supabaseKey: "YOUR_TEST_SUPABASE_ANON_KEY", // Replace with test anon key
  },
  production: {
    supabaseUrl: "YOUR_PRODUCTION_SUPABASE_URL", // Replace with prod project URL
    supabaseKey: "YOUR_PRODUCTION_SUPABASE_ANON_KEY", // Replace with prod anon key
  },
};
```

## Step 5: Environment Switching

To switch between test and production environments, change the `ENVIRONMENT` variable in `config.js`:

```javascript
// For testing
const ENVIRONMENT = "test";

// For production
const ENVIRONMENT = "production";
```

## Step 6: Testing the Connection

1. Open your application in a web browser
2. Open browser console (F12)
3. You should see a message: "📊 Connected to Supabase (test/production environment)"
4. Try enrolling a test participant
5. Check your Supabase dashboard → Table Editor → participants to verify data is being saved

## Security Considerations

### For Production:

1. **Enable RLS**: Row Level Security is already enabled in the schema above
2. **API Key Security**: The anon key is safe to use in frontend applications
3. **Domain Restrictions**: In Supabase dashboard, go to Authentication → Settings → Site URL and add your domain
4. **Rate Limiting**: Consider implementing rate limiting in Supabase Edge Functions if needed

### Database Access:

- The current setup allows public read/write access suitable for a simple enrollment form
- For more sensitive data, implement proper authentication and authorization
- Consider using Supabase Auth if you need user authentication

## Monitoring and Maintenance

### Supabase Dashboard Features:

- **Database**: View and edit data directly
- **API**: Monitor API usage and performance
- **Logs**: Debug issues with real-time logs
- **Settings**: Manage project settings and billing

### Backup Strategy:

- Supabase provides automatic backups for paid plans
- For critical data, consider setting up additional backup procedures
- Export functionality is available through the application's admin commands

## Troubleshooting

### Common Issues:

1. **Connection Errors**:
   - Verify URL and API key in config.js
   - Check browser console for detailed error messages

2. **Permission Denied**:
   - Ensure RLS policies are correctly set up
   - Verify the SQL schema was executed successfully

3. **Data Not Appearing**:
   - Check Supabase logs in the dashboard
   - Verify the workshop_id matches ('ai-dev-jumpstart-2026')

### Support Resources:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- Browser console logs for debugging

## Migration from localStorage

When you first deploy with Supabase, existing localStorage data will still be available as a fallback. The application automatically attempts to use Supabase first, and falls back to localStorage if the database is unavailable.

To migrate existing localStorage data to Supabase:

1. Export current data using `workshopEnrollment.exportData()` in console
2. Clear localStorage: `localStorage.clear()`
3. Manually re-enter test data or import via Supabase dashboard

Ready to go! Your enrollment application now uses Supabase for persistent, scalable data storage.
