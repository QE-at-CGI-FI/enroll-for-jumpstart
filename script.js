// Workshop enrollment management with Supabase integration
class WorkshopEnrollment {
    constructor() {
        this.maxParticipants = 8;
        this.enrolledParticipants = {};
        this.queuedParticipants = {};
        this.supabaseClient = null;
        this.isDatabaseConnected = false;
        this.currentSession = 'session1'; // Default session
        
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
            // Initialize Supabase client
            this.supabaseClient = new SupabaseClient();
            
            // Test connection
            const connectionTest = await this.supabaseClient.testConnection();
            this.isDatabaseConnected = connectionTest.connected;
            
            if (this.isDatabaseConnected) {
                console.log('✅ Database connection successful');
                // Load data from Supabase
                await this.loadFromDatabase();
            } else {
                console.warn('⚠️  Database connection failed, using localStorage fallback');
                console.warn('Connection error:', connectionTest.error);
                this.loadFromStorage();
            }
            
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
            this.isDatabaseConnected = false;
            this.loadFromStorage();
        }
        
        this.initializeEventListeners();
        this.updateUI();
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
            } catch (error) {
                console.error('❌ Failed to save to database:', error);
                this.showMessage('Warning: Data saved locally but database sync failed', 'warning');
            }
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
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.enrolledParticipants = { session1: [], session2: [] };
            this.queuedParticipants = { session1: [], session2: [] };
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
- workshopEnrollment.enrolledParticipants - View enrolled participants
- workshopEnrollment.queuedParticipants - View queued participants
`);