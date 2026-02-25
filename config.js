// Supabase configuration
const ENVIRONMENT = 'production'; 

const CONFIG = {
    production: {
        supabaseUrl: 'https://crpkvgdvwhdvtwgirvuu.supabase.co',
        supabaseKey: 'sb_publishable_KcICR7Bn7h76Apb8_XWR-g_m00Wcwur'
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