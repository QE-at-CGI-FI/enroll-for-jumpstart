// Supabase client initialization and database operations
class SupabaseClient {
    constructor() {
        if (!window.SUPABASE_CONFIG || !window.supabase) {
            throw new Error('Supabase configuration or library not loaded');
        }
        
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
                .map(p => ({
                    name: p.name,
                    timestamp: p.timestamp,
                    id: p.participant_id
                }));

            return { enrolled, queued };
        } catch (error) {
            console.error('Error loading participants:', error);
            // Fallback to localStorage if database fails
            return this.loadFromLocalStorage();
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
                    participant_id: participant.id
                }]);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error adding participant:', error);
            return { success: false, error: error.message };
        }
    }

    // Check database connection
    async testConnection() {
        try {
            const { data, error } = await this.client
                .from('participants')
                .select('count')
                .limit(1);

            return { connected: !error, error: error?.message };
        } catch (error) {
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