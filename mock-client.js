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
            // Session 1 – March 11 – fully enrolled + 2 queued
            make('Test User One',    'enrolled', 'session1', 25, 8),
            make('Test User Two',    'enrolled', 'session1', 24, 7),
            make('Test User Three',  'enrolled', 'session1', 23, 6),
            make('Test User Four',   'enrolled', 'session1', 22, 5),
            make('Test User Five',   'enrolled', 'session1', 21, 4),
            make('Test User Six',    'enrolled', 'session1', 20, 3),
            make('Test User Seven',  'enrolled', 'session1', 19, 2),
            make('Test User Eight',  'enrolled', 'session1', 18, 1),
            make('Test User Nine',   'queued',   'session1', 17, 0),
            make('Test User Ten',    'queued',   'session1', 16, 0),

            // Session 2 – March 26 – partially enrolled
            make('Test User Eleven',   'enrolled', 'session2', 15, 6),
            make('Test User Twelve',   'enrolled', 'session2', 14, 5),
            make('Test User Thirteen', 'enrolled', 'session2', 13, 4),
            make('Test User Fourteen', 'enrolled', 'session2', 12, 3),
            make('Test User Fifteen',  'enrolled', 'session2', 11, 2),
            make('Test User Sixteen',  'enrolled', 'session2', 10, 1),

            // Session 3 – March 20 – fully enrolled
            make('Test User Seventeen', 'enrolled', 'session3', 20, 8),
            make('Test User Eighteen',  'enrolled', 'session3', 19, 7),
            make('Test User Nineteen',  'enrolled', 'session3', 18, 6),
            make('Test User Twenty',    'enrolled', 'session3', 17, 5),
            make('Test User TwentyOne', 'enrolled', 'session3', 16, 4),
            make('Test User TwentyTwo', 'enrolled', 'session3', 15, 3),
            make('Test User TwentyThree', 'enrolled', 'session3', 14, 2),
            make('Test User TwentyFour',  'enrolled', 'session3', 13, 1),

            // Session 4 – March 30 – partially enrolled
            make('Test User TwentyFive', 'enrolled', 'session4', 5, 4),
            make('Test User TwentySix',  'enrolled', 'session4', 4, 3),
            make('Test User TwentySeven','enrolled', 'session4', 3, 2),
            make('Test User TwentyEight','enrolled', 'session4', 2, 1),

            // Session 5 – March 31 (today) – just started
            make('Test User TwentyNine', 'enrolled', 'session5', 0, 3),
            make('Test User Thirty',     'enrolled', 'session5', 0, 2),
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
