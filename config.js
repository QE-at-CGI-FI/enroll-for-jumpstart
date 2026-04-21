// Supabase configuration
const ENVIRONMENT = 'production'; 

const CONFIG = {
    production: {
        supabaseUrl: 'https://owkbknhiucwzyjyqewwb.supabase.co',
        supabaseKey: 'sb_publishable_q5IA1-hcgQK7gda7EGtwDw_ssQ4ky-8'
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