// Mock database client - replaces Supabase with in-memory storage and test data
class SupabaseClient {
    constructor() {
        console.log('🧪 Initializing MockClient (in-memory database)...');

        // Shared in-memory store (persists across instances within the same page session)
        if (!window._mockDb) {
            window._mockDb = this._seedTestData();
        }
        this.db = window._mockDb;

        console.log('🧪 MockClient ready with', this.db.length, 'test records');
    }

    _makeId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    _ts(daysAgo, hoursOffset = 0) {
        const d = new Date('2026-03-31T10:00:00Z');
        d.setDate(d.getDate() - daysAgo);
        d.setHours(d.getHours() - hoursOffset);
        return d.toISOString();
    }

    _seedTestData() {
        const W = 'ai-dev-jumpstart-2026';
        const make = (name, status, sessionId, daysAgo, hoursOffset = 0) => ({
            workshop_id: W,
            name,
            status,
            timestamp: this._ts(daysAgo, hoursOffset),
            participant_id: this._makeId(),
            session_id: sessionId
        });

        return [
            // Session 1 – May 6 – partially enrolled
            make('Test User One',    'enrolled', 'session1', 5, 4),
            make('Test User Two',    'enrolled', 'session1', 4, 3),
            make('Test User Three',  'enrolled', 'session1', 3, 2),
            make('Test User Four',   'enrolled', 'session1', 2, 1),
        ];
    }

    // Load all participants grouped by session and status
    async loadParticipants() {
        const enrolled = { session1: [], session2: [], session3: [], session4: [], session5: [] };
        const queued   = { session1: [], session2: [], session3: [], session4: [], session5: [] };

        const sorted = [...this.db].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        sorted.forEach(p => {
            const participant = { name: p.name, timestamp: p.timestamp, id: p.participant_id, session: p.session_id };
            const sid = p.session_id || 'session1';
            if (p.status === 'enrolled') {
                if (!enrolled[sid]) enrolled[sid] = [];
                enrolled[sid].push(participant);
            } else if (p.status === 'queued') {
                if (!queued[sid]) queued[sid] = [];
                queued[sid].push(participant);
            }
        });

        return { enrolled, queued };
    }

    // Replace all enrolled participants for this workshop
    async saveEnrolledParticipants(participants) {
        try {
            // Remove existing enrolled records
            this.db = this.db.filter(p => p.status !== 'enrolled');

            Object.keys(participants).forEach(sessionId => {
                if (Array.isArray(participants[sessionId])) {
                    participants[sessionId].forEach(p => {
                        this.db.push({
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
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Replace all queued participants for this workshop
    async saveQueuedParticipants(participants) {
        try {
            // Remove existing queued records
            this.db = this.db.filter(p => p.status !== 'queued');

            Object.keys(participants).forEach(sessionId => {
                if (Array.isArray(participants[sessionId])) {
                    participants[sessionId].forEach(p => {
                        this.db.push({
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
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Add a single participant
    async addParticipant(participant, status) {
        try {
            this.db.push({
                workshop_id: 'ai-dev-jumpstart-2026',
                name: participant.name,
                status: status,
                timestamp: participant.timestamp,
                participant_id: participant.id,
                session_id: participant.session || 'session1'
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Check if a participant name already exists (case-insensitive)
    async checkParticipantExists(name) {
        const found = this.db.some(p => p.name.toLowerCase() === name.trim().toLowerCase());
        return { exists: found, error: null };
    }

    // Always reports connected
    async testConnection() {
        console.log('🧪 MockClient connection test: OK');
        return { connected: true, error: null };
    }

    // Clear all data
    async clearAllData() {
        this.db.length = 0;
        return { success: true };
    }

    // Export all data
    async exportAllData() {
        return {
            success: true,
            data: {
                enrolled: this.db.filter(p => p.status === 'enrolled'),
                queued:   this.db.filter(p => p.status === 'queued'),
                exportDate: new Date().toISOString(),
                environment: 'mock'
            }
        };
    }

    // Fallback to localStorage (kept for interface compatibility)
    loadFromLocalStorage() {
        try {
            const enrolled = JSON.parse(localStorage.getItem('workshop-enrolled') || '[]');
            const queued   = JSON.parse(localStorage.getItem('workshop-queued')   || '[]');
            return { enrolled, queued };
        } catch (error) {
            return { enrolled: [], queued: [] };
        }
    }
}

window.SupabaseClient = SupabaseClient;
