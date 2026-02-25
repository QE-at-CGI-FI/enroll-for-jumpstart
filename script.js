// Workshop enrollment management with Supabase integration
class WorkshopEnrollment {
    constructor() {
        this.maxParticipants = 8;
        this.enrolledParticipants = {};
        this.queuedParticipants = {};
        this.supabaseClient = null;
        this.isDatabaseConnected = false;
        this.currentSession = 'session1'; // Default session
        this.syncRequired = false; // Track if localStorage data needs syncing
        this.retryAttempts = 0;
        this.maxRetryAttempts = 3;
        
        // Session definitions
        this.sessions = {
            session1: {
                id: 'session1',
                date: 'March 11, 2026',
                time: '13:00 - 15:00',
                location: 'Online',
                capacity: 8
            },
            session2: {
                id: 'session2',
                date: 'March 26, 2026',
                time: '13:30 - 15:30',
                location: 'Karvaamokuja',
                capacity: 8
            }
        };
        
        // Initialize participant lists for each session
        this.enrolledParticipants.session1 = [];
        this.enrolledParticipants.session2 = [];
        this.queuedParticipants.session1 = [];
        this.queuedParticipants.session2 = [];
        
        this.initializeSupabase();
    }

    async initializeSupabase() {
        try {
            console.log('🚀 Initializing Supabase connection...');
            
            // Initialize Supabase client
            this.supabaseClient = new SupabaseClient();
            
            // Test connection with detailed logging
            console.log('🔍 Testing database connection...');
            const connectionTest = await this.supabaseClient.testConnection();
            this.isDatabaseConnected = connectionTest.connected;
            
            console.log(`📊 Connection test result: ${this.isDatabaseConnected ? 'SUCCESS' : 'FAILED'}`);
            if (!this.isDatabaseConnected && connectionTest.error) {
                console.error('❌ Connection error details:', connectionTest.error);
            }
            
            if (this.isDatabaseConnected) {
                console.log('✅ Database connection successful');
                // Load data from Supabase
                await this.loadFromDatabase();
                // Check if we need to sync localStorage data to database
                await this.syncLocalStorageToDatabase();
            } else {
                console.warn('⚠️  Database connection failed, using localStorage fallback');
                console.warn('Connection error:', connectionTest.error);
                this.loadFromStorage();
                this.syncRequired = true;
                // Try to reconnect periodically
                this.scheduleReconnectAttempt();
            }
            
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
            console.error('❌ Error stack:', error.stack);
            this.isDatabaseConnected = false;
            this.loadFromStorage();
        }
        
        this.initializeEventListeners();
        this.updateUI();
        this.updateSyncStatus();
    }

    async loadFromDatabase() {
        try {
            const data = await this.supabaseClient.loadParticipants();
            // Handle both old format (single session) and new format (multiple sessions)
            if (Array.isArray(data.enrolled)) {
                // Old format - migrate to session1
                this.enrolledParticipants.session1 = data.enrolled || [];
                this.enrolledParticipants.session2 = [];
                this.queuedParticipants.session1 = data.queued || [];
                this.queuedParticipants.session2 = [];
            } else {
                // New format with sessions
                this.enrolledParticipants = data.enrolled || { session1: [], session2: [] };
                this.queuedParticipants = data.queued || { session1: [], session2: [] };
            }
            const totalEnrolled = (this.enrolledParticipants.session1?.length || 0) + (this.enrolledParticipants.session2?.length || 0);
            const totalQueued = (this.queuedParticipants.session1?.length || 0) + (this.queuedParticipants.session2?.length || 0);
            console.log(`📊 Loaded ${totalEnrolled} enrolled and ${totalQueued} queued participants from database`);
        } catch (error) {
            console.error('Error loading from database:', error);
            this.loadFromStorage();
        }
    }

    initializeEventListeners() {
        const form = document.getElementById('enrollmentForm');
        form.addEventListener('submit', (e) => this.handleEnrollment(e));
        
        // Session selection change handler
        const sessionSelect = document.getElementById('sessionSelect');
        sessionSelect.addEventListener('change', (e) => this.handleSessionChange(e));
        
        // Initialize with default session
        this.updateSessionDetails();
    }

    handleSessionChange(event) {
        this.currentSession = event.target.value;
        this.updateSessionDetails();
        this.updateUI();
    }
    
    updateSessionDetails() {
        const session = this.sessions[this.currentSession];
        document.getElementById('sessionDate').textContent = session.date;
        document.getElementById('sessionTime').textContent = session.time;
        document.getElementById('sessionLocation').textContent = session.location;
    }

    async handleEnrollment(event) {
        event.preventDefault();
        
        const nameInput = document.getElementById('participantName');
        const participantName = nameInput.value.trim();
        
        // Validate input
        if (!this.validateName(participantName)) {
            this.showMessage('Please enter a valid name (at least 2 characters)', 'error');
            return;
        }

        // Check for duplicates in current session
        if (this.isDuplicateName(participantName)) {
            this.showMessage('This name is already registered for this session!', 'error');
            return;
        }

        // Add participant to appropriate list for current session
        const participant = {
            name: participantName,
            timestamp: new Date().toISOString(),
            id: this.generateId(),
            session: this.currentSession
        };

        const currentEnrolled = this.enrolledParticipants[this.currentSession];
        const currentQueued = this.queuedParticipants[this.currentSession];
        const sessionInfo = this.sessions[this.currentSession];

        if (currentEnrolled.length < this.maxParticipants) {
            currentEnrolled.push(participant);
            this.showMessage(`${participantName} has been successfully enrolled for ${sessionInfo.date}!`, 'success');
        } else {
            currentQueued.push(participant);
            const queuePosition = currentQueued.length;
            this.showMessage(`${participantName} has been added to the queue for ${sessionInfo.date} (position #${queuePosition})`, 'warning');
        }

        // Save to database and update UI
        await this.saveToDatabase();
        this.updateUI();
        
        // Clear form
        nameInput.value = '';
        nameInput.focus();
    }

    validateName(name) {
        return name.length >= 2 && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(name);
    }

    isDuplicateName(name) {
        const normalizedName = name.toLowerCase().trim();
        const currentEnrolled = this.enrolledParticipants[this.currentSession] || [];
        const currentQueued = this.queuedParticipants[this.currentSession] || [];
        const allParticipants = [...currentEnrolled, ...currentQueued];
        return allParticipants.some(participant => 
            participant.name.toLowerCase().trim() === normalizedName
        );
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    updateSyncStatus() {
        const syncStatusElement = document.getElementById('syncStatus');
        const syncStatusIcon = document.getElementById('syncStatusIcon');
        const syncStatusText = document.getElementById('syncStatusText');
        
        if (!syncStatusElement) return; // Element not found
        
        // Remove all status classes
        syncStatusElement.classList.remove('connected', 'disconnected', 'syncing');
        
        if (this.isDatabaseConnected) {
            if (this.syncRequired) {
                syncStatusElement.classList.add('syncing');
                syncStatusIcon.textContent = '🔄';
                syncStatusText.textContent = 'Syncing to database...';
            } else {
                syncStatusElement.classList.add('connected');
                syncStatusIcon.textContent = '🟢';
                syncStatusText.textContent = 'Connected to database';
            }
        } else {
            syncStatusElement.classList.add('disconnected');
            if (this.syncRequired) {
                syncStatusIcon.textContent = '📱';
                syncStatusText.textContent = 'Offline - data saved locally';
            } else {
                syncStatusIcon.textContent = '🔴';
                syncStatusText.textContent = 'Database disconnected';
            }
        }
    }

    updateUI() {
        const currentEnrolled = this.enrolledParticipants[this.currentSession] || [];
        const currentQueued = this.queuedParticipants[this.currentSession] || [];
        
        // Update counts
        document.getElementById('enrolledCount').textContent = currentEnrolled.length;
        document.getElementById('queueCount').textContent = currentQueued.length;

        // Update enrolled participants list
        const enrolledList = document.getElementById('enrolledList');
        enrolledList.innerHTML = '';
        currentEnrolled.forEach((participant, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${participant.name}`;
            li.classList.add('new-participant');
            enrolledList.appendChild(li);
        });

        // Update queued participants list
        const queuedList = document.getElementById('queuedList');
        queuedList.innerHTML = '';
        currentQueued.forEach((participant, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${participant.name}`;
            li.classList.add('new-participant');
            queuedList.appendChild(li);
        });

        // Remove animation class after animation completes
        setTimeout(() => {
            document.querySelectorAll('.new-participant').forEach(element => {
                element.classList.remove('new-participant');
            });
        }, 500);
    }

    showMessage(text, type) {
        const messageElement = document.getElementById('enrollmentMessage');
        messageElement.textContent = text;
        messageElement.className = `message ${type}`;
        
        // Clear message after 5 seconds
        setTimeout(() => {
            messageElement.textContent = '';
            messageElement.className = 'message';
        }, 5000);
    }

    async saveToDatabase() {
        // Always save to localStorage as backup
        this.saveToStorage();
        
        // Try to save to Supabase if connected
        if (this.isDatabaseConnected && this.supabaseClient) {
            try {
                await this.supabaseClient.saveEnrolledParticipants(this.enrolledParticipants);
                await this.supabaseClient.saveQueuedParticipants(this.queuedParticipants);
                console.log('💾 Data saved to database successfully');
                this.syncRequired = false;
                this.retryAttempts = 0;
                this.updateSyncStatus();
                return true;
            } catch (error) {
                console.error('❌ Failed to save to database:', error);
                this.syncRequired = true;
                this.isDatabaseConnected = false;
                
                // Try to retry with exponential backoff
                if (this.retryAttempts < this.maxRetryAttempts) {
                    this.retryAttempts++;
                    console.log(`🔄 Retrying database save (attempt ${this.retryAttempts}/${this.maxRetryAttempts})...`);
                    setTimeout(() => this.retryDatabaseSave(), Math.pow(2, this.retryAttempts) * 1000);
                    this.showMessage('Connection issue - retrying database save...', 'warning');
                } else {
                    this.showMessage('❌ Database unavailable - data saved locally only. Will sync when connection restored.', 'error');
                    this.scheduleReconnectAttempt();
                }
                this.updateSyncStatus();
                return false;
            }
        } else {
            this.syncRequired = true;
            this.showMessage('📱 Data saved locally - will sync to database when connected', 'warning');
            this.updateSyncStatus();
            return false;
        }
    }

    async clearAllData() {
        if (confirm('Are you sure you want to clear all enrollment data? This cannot be undone.')) {
            this.enrolledParticipants = { session1: [], session2: [] };
            this.queuedParticipants = { session1: [], session2: [] };
            
            // Clear from database
            if (this.isDatabaseConnected && this.supabaseClient) {
                const result = await this.supabaseClient.clearAllData();
                if (result.success) {
                    console.log('🗑️  Database cleared successfully');
                } else {
                    console.error('❌ Failed to clear database:', result.error);
                }
            }
            
            // Clear from localStorage
            this.saveToStorage();
            this.updateUI();
            this.showMessage('All enrollment data cleared', 'warning');
        }
    }

    exportData() {
        const data = {
            enrolled: this.enrolledParticipants,
            queued: this.queuedParticipants,
            sessions: this.sessions,
            exportDate: new Date().toISOString()
        };
        console.log('Workshop enrollment data:', data);
        return data;
    }

    saveToStorage() {
        localStorage.setItem('workshop-enrolled', JSON.stringify(this.enrolledParticipants));
        localStorage.setItem('workshop-queued', JSON.stringify(this.queuedParticipants));
    }

    loadFromStorage() {
        try {
            const enrolled = JSON.parse(localStorage.getItem('workshop-enrolled') || '{}');
            const queued = JSON.parse(localStorage.getItem('workshop-queued') || '{}');
            
            // Handle migration from old format (array) to new format (object with sessions)
            if (Array.isArray(enrolled)) {
                this.enrolledParticipants = { session1: enrolled, session2: [] };
            } else {
                this.enrolledParticipants = enrolled;
            }
            
            if (Array.isArray(queued)) {
                this.queuedParticipants = { session1: queued, session2: [] };
            } else {
                this.queuedParticipants = queued;
            }
            
            // Ensure all sessions exist
            if (!this.enrolledParticipants.session1) this.enrolledParticipants.session1 = [];
            if (!this.enrolledParticipants.session2) this.enrolledParticipants.session2 = [];
            if (!this.queuedParticipants.session1) this.queuedParticipants.session1 = [];
            if (!this.queuedParticipants.session2) this.queuedParticipants.session2 = [];
            
            // Check if we have local data that might need syncing
            const hasLocalData = Object.values(this.enrolledParticipants).some(arr => arr.length > 0) || 
                               Object.values(this.queuedParticipants).some(arr => arr.length > 0);
            if (hasLocalData && !this.isDatabaseConnected) {
                this.syncRequired = true;
                console.log('📱 Local enrollment data detected - will sync to database when connected');
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.enrolledParticipants = { session1: [], session2: [] };
            this.queuedParticipants = { session1: [], session2: [] };
        }
    }

    async retryDatabaseSave() {
        if (!this.isDatabaseConnected && this.supabaseClient) {
            // Test connection before retry
            const connectionTest = await this.supabaseClient.testConnection();
            this.isDatabaseConnected = connectionTest.connected;
        }
        
        if (this.isDatabaseConnected) {
            console.log('🔄 Connection restored, attempting database save...');
            this.updateSyncStatus();
            await this.saveToDatabase();
        }
    }

    scheduleReconnectAttempt() {
        // Try to reconnect every 30 seconds if we have unsaved data
        if (this.syncRequired) {
            setTimeout(async () => {
                if (this.supabaseClient) {
                    const connectionTest = await this.supabaseClient.testConnection();
                    if (connectionTest.connected && !this.isDatabaseConnected) {
                        this.isDatabaseConnected = true;
                        console.log('🔄 Database connection restored');
                        this.updateSyncStatus();
                        await this.syncLocalStorageToDatabase();
                    } else if (this.syncRequired) {
                        // Keep trying if we still have unsaved data
                        this.scheduleReconnectAttempt();
                    }
                }
            }, 30000); // 30 seconds
        }
    }

    async syncLocalStorageToDatabase() {
        if (!this.isDatabaseConnected || !this.syncRequired) {
            return false;
        }

        console.log('🔄 Syncing localStorage data to database...');
        
        try {
            // Load what's currently in the database
            const dbData = await this.supabaseClient.loadParticipants();
            
            // Compare with localStorage and merge
            let needsSync = false;
            
            // Check each session for differences
            for (const sessionId of ['session1', 'session2']) {
                const localEnrolled = this.enrolledParticipants[sessionId] || [];
                const localQueued = this.queuedParticipants[sessionId] || [];
                const dbEnrolled = dbData.enrolled[sessionId] || [];
                const dbQueued = dbData.queued[sessionId] || [];
                
                // Simple comparison - if counts differ or participants differ, we need to sync
                if (localEnrolled.length !== dbEnrolled.length || 
                    localQueued.length !== dbQueued.length ||
                    !this.arraysEqual(localEnrolled, dbEnrolled) ||
                    !this.arraysEqual(localQueued, dbQueued)) {
                    needsSync = true;
                    break;
                }
            }
            
            if (needsSync) {
                // Merge the data (localStorage takes precedence for newer entries)
                await this.supabaseClient.saveEnrolledParticipants(this.enrolledParticipants);
                await this.supabaseClient.saveQueuedParticipants(this.queuedParticipants);
                console.log('✅ Successfully synced localStorage data to database');
                this.showMessage('📡 Local data synchronized to database successfully', 'success');
                this.syncRequired = false;
                this.updateSyncStatus();
                return true;
            } else {
                console.log('ℹ️ No sync needed - data already matches');
                this.syncRequired = false;
                this.updateSyncStatus();
                return true;
            }
        } catch (error) {
            console.error('❌ Failed to sync localStorage to database:', error);
            this.showMessage('❌ Failed to sync data to database', 'error');
            return false;
        }
    }

    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every(item1 => 
            arr2.some(item2 => 
                item1.name === item2.name && 
                item1.session === item2.session
            )
        );
    }

    // Admin function to force sync localStorage to database
    async forceSyncToDatabase() {
        if (!this.isDatabaseConnected) {
            const connectionTest = await this.supabaseClient.testConnection();
            this.isDatabaseConnected = connectionTest.connected;
        }
        
        if (this.isDatabaseConnected) {
            this.syncRequired = true; // Force sync even if not marked as required
            const result = await this.syncLocalStorageToDatabase();
            if (result) {
                console.log('🔄 Force sync completed successfully');
                return { success: true, message: 'Data synchronized to database' };
            } else {
                console.log('❌ Force sync failed');
                return { success: false, message: 'Sync to database failed' };
            }
        } else {
            console.log('❌ Cannot sync - database not connected');
            return { success: false, message: 'Database not connected' };
        }
    }

    // Enhanced status method for debugging
    getSyncStatus() {
        return {
            isDatabaseConnected: this.isDatabaseConnected,
            syncRequired: this.syncRequired,
            retryAttempts: this.retryAttempts,
            enrolledCount: Object.values(this.enrolledParticipants).reduce((sum, arr) => sum + arr.length, 0),
            queuedCount: Object.values(this.queuedParticipants).reduce((sum, arr) => sum + arr.length, 0)
        };
    }

    // Debug function to manually test database connection
    async debugConnection() {
        console.log('🔍 Starting debug connection test...');
        
        if (!this.supabaseClient) {
            console.error('❌ No Supabase client available');
            return { success: false, error: 'No Supabase client' };
        }
        
        try {
            const result = await this.supabaseClient.testConnection();
            console.log('📊 Debug connection result:', result);
            
            if (result.connected) {
                this.isDatabaseConnected = true;
                this.updateSyncStatus();
                console.log('✅ Connection restored via debug test');
                return { success: true, message: 'Connection successful' };
            } else {
                console.log('❌ Connection still failing:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Debug connection error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const enrollment = new WorkshopEnrollment();
    
    // Make enrollment instance available globally for admin functions
    window.workshopEnrollment = enrollment;
    
    // Add keyboard shortcuts for better UX
    document.addEventListener('keydown', (e) => {
        // Focus on name input when user starts typing (if not already focused)
        if (e.key.match(/[a-zA-Z]/) && document.activeElement.tagName !== 'INPUT') {
            document.getElementById('participantName').focus();
        }
    });
    
    // Auto-focus on the name input
    document.getElementById('participantName').focus();
});

// Console commands for admin/testing (accessible via browser console)
console.log(`
🚀 AI Dev Jumpstart Workshop Enrollment System Ready!

Admin commands available in console:
- workshopEnrollment.clearAllData() - Clear all data
- workshopEnrollment.exportData() - Export current data
- workshopEnrollment.forceSyncToDatabase() - Force sync localStorage to database
- workshopEnrollment.getSyncStatus() - Check sync and connection status
- workshopEnrollment.debugConnection() - Debug database connection issues
- workshopEnrollment.enrolledParticipants - View enrolled participants
- workshopEnrollment.queuedParticipants - View queued participants

Database Status: ${window.workshopEnrollment ? (window.workshopEnrollment.isDatabaseConnected ? '🟢 Connected' : '🔴 Disconnected') : '⏳ Initializing...'}
Sync Required: ${window.workshopEnrollment ? (window.workshopEnrollment.syncRequired ? '🟡 Yes' : '🟢 No') : '⏳ Checking...'}

💡 If showing offline when online, try: workshopEnrollment.debugConnection()
`);