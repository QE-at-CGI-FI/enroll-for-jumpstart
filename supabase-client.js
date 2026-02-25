// Supabase client initialization and database operations
class SupabaseClient {
    constructor() {
        console.log('📊 Initializing SupabaseClient...');
        
        if (!window.SUPABASE_CONFIG || !window.supabase) {
            throw new Error('Supabase configuration or library not loaded');
        }
        
        console.log('📊 Supabase config loaded:', {
            url: window.SUPABASE_CONFIG.url ? 'SET' : 'MISSING',
            key: window.SUPABASE_CONFIG.key ? 'SET' : 'MISSING',
            environment: window.SUPABASE_CONFIG.environment
        });
        
        this.client = window.supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.key
        );
        
        console.log(`📊 Connected to Supabase (${window.SUPABASE_CONFIG.environment} environment)`);
    }

    // Save enrolled participants to database
    async saveEnrolledParticipants(participants) {
        try {
            // Clear existing enrolled participants for this workshop
            await this.client
                .from('participants')
                .delete()
                .eq('workshop_id', 'ai-dev-jumpstart-2026')
                .eq('status', 'enrolled');

            // Convert session-based object to flat array with session info
            const allParticipants = [];
            Object.keys(participants).forEach(sessionId => {
                if (Array.isArray(participants[sessionId])) {
                    participants[sessionId].forEach(p => {
                        allParticipants.push({
                            workshop_id: 'ai-dev-jumpstart-2026',
                            name: p.name,
                            status: 'enrolled',
                            timestamp: p.timestamp,
                            participant_id: p.id,
                            session_id: p.session || sessionId
                        });
                    });
                }
            });

            // Insert new enrolled participants
            if (allParticipants.length > 0) {
                const { data, error } = await this.client
                    .from('participants')
                    .insert(allParticipants);

                if (error) throw error;
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error saving enrolled participants:', error);
            return { success: false, error: error.message };
        }
    }

    // Save queued participants to database
    async saveQueuedParticipants(participants) {
        try {
            // Clear existing queued participants for this workshop
            await this.client
                .from('participants')
                .delete()
                .eq('workshop_id', 'ai-dev-jumpstart-2026')
                .eq('status', 'queued');

            // Convert session-based object to flat array with session info
            const allParticipants = [];
            Object.keys(participants).forEach(sessionId => {
                if (Array.isArray(participants[sessionId])) {
                    participants[sessionId].forEach(p => {
                        allParticipants.push({
                            workshop_id: 'ai-dev-jumpstart-2026',
                            name: p.name,
                            status: 'queued',
                            timestamp: p.timestamp,
                            participant_id: p.id,
                            session_id: p.session || sessionId
                        });
                    });
                }
            });

            // Insert new queued participants
            if (allParticipants.length > 0) {
                const { data, error } = await this.client
                    .from('participants')
                    .insert(allParticipants);

                if (error) throw error;
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error saving queued participants:', error);
            return { success: false, error: error.message };
        }
    }

    // Load all participants from database
    async loadParticipants() {
        try {
            const { data, error } = await this.client
                .from('participants')
                .select('*')
                .eq('workshop_id', 'ai-dev-jumpstart-2026')
                .order('timestamp', { ascending: true });

            if (error) throw error;

            // Group participants by session and status
            const enrolled = { session1: [], session2: [] };
            const queued = { session1: [], session2: [] };

            data.forEach(p => {
                const participant = {
                    name: p.name,
                    timestamp: p.timestamp,
                    id: p.participant_id,
                    session: p.session_id || 'session1' // Default to session1 for legacy data
                };

                const sessionId = p.session_id || 'session1';
                
                if (p.status === 'enrolled') {
                    if (enrolled[sessionId]) {
                        enrolled[sessionId].push(participant);
                    }
                } else if (p.status === 'queued') {
                    if (queued[sessionId]) {
                        queued[sessionId].push(participant);
                    }
                }
            });

            return { enrolled, queued };
        } catch (error) {
            console.error('Error loading participants:', error);
            throw error;
        }
    }

    // Fallback to localStorage if database is unavailable
    loadFromLocalStorage() {
        try {
            const enrolled = JSON.parse(localStorage.getItem('workshop-enrolled') || '[]');
            const queued = JSON.parse(localStorage.getItem('workshop-queued') || '[]');
            return { enrolled, queued };
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return { enrolled: [], queued: [] };
        }
    }

    // Add a single participant (for real-time updates)
    async addParticipant(participant, status) {
        try {
            const { data, error } = await this.client
                .from('participants')
                .insert([{
                    workshop_id: 'ai-dev-jumpstart-2026',
                    name: participant.name,
                    status: status,
                    timestamp: participant.timestamp,
                    participant_id: participant.id,
                    session_id: participant.session || 'session1'
                }]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error adding participant:', error);
            return { success: false, error: error.message };
        }
    }

    // Check if a participant name exists in the database
    async checkParticipantExists(name) {
        try {
            const { data, error } = await this.client
                .from('participants')
                .select('name')
                .eq('workshop_id', 'ai-dev-jumpstart-2026')
                .ilike('name', name.trim())
                .limit(1);

            if (error) throw error;
            return { exists: data && data.length > 0, error: null };
        } catch (error) {
            console.error('Error checking participant existence:', error);
            return { exists: false, error: error.message };
        }
    }

    // Check database connection
    async testConnection() {
        try {
            console.log('🔍 Testing database connection...');
            console.log('🔍 Supabase URL:', window.SUPABASE_CONFIG.url);
            console.log('🔍 API Key (first 20 chars):', window.SUPABASE_CONFIG.key.substring(0, 20) + '...');
            
            // Test basic Supabase connectivity first
            console.log('📊 Testing basic Supabase connectivity...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            try {
                const basicResponse = await fetch(`${window.SUPABASE_CONFIG.url}/rest/v1/`, {
                    method: 'HEAD',
                    headers: {
                        'apikey': window.SUPABASE_CONFIG.key,
                        'Authorization': `Bearer ${window.SUPABASE_CONFIG.key}`
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                console.log('📊 Basic connectivity response status:', basicResponse.status);
                
                if (basicResponse.status === 401) {
                    console.error('❌ Authentication failed: Invalid API key or insufficient permissions');
                    return { connected: false, error: 'Invalid API key: 401' };
                }
                
                if (basicResponse.status === 404) {
                    console.error('❌ Project not found: Invalid Supabase URL');
                    return { connected: false, error: 'Invalid Supabase URL: 404' };
                }
                
                if (!basicResponse.ok && basicResponse.status >= 400) {
                    console.error('❌ Supabase API error:', basicResponse.status, basicResponse.statusText);
                    return { connected: false, error: `API error: ${basicResponse.status} ${basicResponse.statusText}` };
                }
                
                console.log('✅ Basic Supabase API connectivity successful');
            } catch (fetchError) {
                clearTimeout(timeoutId);
                console.error('❌ Network connectivity test failed:', fetchError.message);
                
                if (fetchError.name === 'AbortError') {
                    console.error('❌ Request timed out after 10 seconds');
                    return { connected: false, error: 'Connection timeout - check your network and Supabase URL' };
                }
                
                if (fetchError.message.includes('Failed to fetch') || 
                    fetchError.message.includes('NetworkError') ||
                    fetchError.message.includes('CORS')) {
                    console.error('❌ Network/CORS error - trying direct Supabase client instead');
                    // Fall through to try the Supabase client method
                } else {
                    return { connected: false, error: `Network error: ${fetchError.message}` };
                }
            }
            
            // Now try the participants table query
            const { data, error } = await this.client
                .from('participants')
                .select('*')
                .limit(1);

            if (error) {
                console.warn('⚠️ Database query error details:');
                console.warn('   Code:', error.code);
                console.warn('   Message:', error.message);
                console.warn('   Details:', error.details);
                console.warn('   Hint:', error.hint);
                
                // If participants table doesn't exist or no permissions, that's fine - we're still connected
                if (error.code === 'PGRST116' || 
                    error.message.includes('does not exist') || 
                    error.message.includes('permission denied') ||
                    error.message.includes('relation') ||
                    error.code === '42P01') {
                    console.log('📊 Table may not exist or limited permissions - but connection is OK');
                    return { connected: true, error: null };
                }
                
                // Check for authentication errors
                if (error.message.includes('Invalid API key') || 
                    error.message.includes('JWT') || 
                    error.code === '401' ||
                    error.code === 'PGRST301') {
                    console.error('❌ Authentication failed:', error.message);
                    return { connected: false, error: `Authentication failed: ${error.message}` };
                }
                
                // Check for network/URL errors
                if (error.code === 'PGRST000' || 
                    error.message.includes('Failed to fetch') ||
                    error.message.includes('Network')) {
                    console.error('❌ Network/URL error:', error.message);
                    return { connected: false, error: `Network error: ${error.message}` };
                }
                
                // Log unexpected errors but still try to connect
                console.warn('⚠️ Unexpected error but got response - treating as connected');
                console.warn('Full error object:', error);
                return { connected: true, error: null };
            } else {
                console.log('✅ Full connection test successful');
                console.log('✅ Data received:', data ? `${data.length} records` : 'no data');
                return { connected: true, error: null };
            }
            
        } catch (error) {
            console.error('❌ Connection test exception:', error);
            
            // Check if it's a network error vs authentication error
            if (error.message.includes('Failed to fetch') || 
                error.message.includes('Network') ||
                error.message.includes('ERR_INTERNET_DISCONNECTED')) {
                return { connected: false, error: `Network error: ${error.message}` };
            }
            
            // For other errors, might still be connected but with issues
            return { connected: false, error: error.message };
        }
    }

    // Clear all data (admin function)
    async clearAllData() {
        try {
            const { error } = await this.client
                .from('participants')
                .delete()
                .eq('workshop_id', 'ai-dev-jumpstart-2026');

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error clearing data:', error);
            return { success: false, error: error.message };
        }
    }

    // Export all data (admin function)
    async exportAllData() {
        try {
            const { data, error } = await this.client
                .from('participants')
                .select('*')
                .eq('workshop_id', 'ai-dev-jumpstart-2026')
                .order('timestamp', { ascending: true });

            if (error) throw error;

            return {
                success: true,
                data: {
                    enrolled: data.filter(p => p.status === 'enrolled'),
                    queued: data.filter(p => p.status === 'queued'),
                    exportDate: new Date().toISOString(),
                    environment: window.SUPABASE_CONFIG.environment
                }
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return { success: false, error: error.message };
        }
    }
}

// Make SupabaseClient available globally
window.SupabaseClient = SupabaseClient;