// Supabase configuration
const ENVIRONMENT = 'production'; 

const CONFIG = {
    production: {
        supabaseUrl: 'https://crpkvgdvwhdvtwgirvuu.supabase.co',
        supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycGt2Z2R2d2hkdnR3Z2lydnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzY4OTEsImV4cCI6MjA4NzYxMjg5MX0.Jrx-XRAsrr5srpRH8cVAKuUi0LOETbEBUYZl5aahob4'
    }
};

// Get current environment configuration
const currentConfig = CONFIG[ENVIRONMENT];

if (!currentConfig.supabaseUrl || currentConfig.supabaseUrl === 'YOUR_TEST_SUPABASE_URL' || 
    currentConfig.supabaseUrl === 'YOUR_PRODUCTION_SUPABASE_URL') {
    console.warn(`⚠️  Supabase configuration not set for ${ENVIRONMENT} environment. Please update config.js`);
}

// Export configuration
window.SUPABASE_CONFIG = {
    url: currentConfig.supabaseUrl,
    key: currentConfig.supabaseKey,
    environment: ENVIRONMENT
};