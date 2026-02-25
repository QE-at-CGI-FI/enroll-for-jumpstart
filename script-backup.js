// Workshop enrollment management with Supabase integration
class WorkshopEnrollment {
    constructor() {
        this.maxParticipants = 8;
        this.enrolledParticipants = [];
        this.queuedParticipants = [];
        this.supabaseClient = null;
        this.isDatabaseConnected = false;
        
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
            this.enrolledParticipants = data.enrolled || [];
            this.queuedParticipants = data.queued || [];
            console.log(`📊 Loaded ${this.enrolledParticipants.length} enrolled and ${this.queuedParticipants.length} queued participants from database`);
        } catch (error) {
            console.error('Error loading from database:', error);
            this.loadFromStorage();
        }
    }

    initializeEventListeners() {
        const form = document.getElementById('enrollmentForm');
        form.addEventListener('submit', (e) => this.handleEnrollment(e));
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

        // Check for duplicates
        if (this.isDuplicateName(participantName)) {
            this.showMessage('This name is already registered!', 'error');
            return;
        }

        // Add participant to appropriate list
        const participant = {
            name: participantName,
            timestamp: new Date().toISOString(),
            id: this.generateId()
        };

        if (this.enrolledParticipants.length < this.maxParticipants) {
            this.enrolledParticipants.push(participant);
            this.showMessage(`${participantName} has been successfully enrolled!`, 'success');
        } else {
            this.queuedParticipants.push(participant);
            const queuePosition = this.queuedParticipants.length;
            this.showMessage(`${participantName} has been added to the queue (position #${queuePosition})`, 'warning');
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
        const allParticipants = [...this.enrolledParticipants, ...this.queuedParticipants];
        return allParticipants.some(participant => 
            participant.name.toLowerCase().trim() === normalizedName
        );
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    updateUI() {
        // Update counts
        document.getElementById('enrolledCount').textContent = this.enrolledParticipants.length;
        document.getElementById('queueCount').textContent = this.queuedParticipants.length;

        // Update enrolled participants list
        const enrolledList = document.getElementById('enrolledList');
        enrolledList.innerHTML = '';
        this.enrolledParticipants.forEach((participant, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${participant.name}`;
            li.classList.add('new-participant');
            enrolledList.appendChild(li);
        });

        // Update queued participants list
        const queuedList = document.getElementById('queuedList');
        queuedList.innerHTML = '';
        this.queuedParticipants.forEach((participant, index) => {
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
            this.enrolledParticipants = [];
            this.queuedParticipants = [];
            
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
            this.enrolledParticipants = JSON.parse(localStorage.getItem('workshop-enrolled') || '[]');
            this.queuedParticipants = JSON.parse(localStorage.getItem('workshop-queued') || '[]');
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.enrolledParticipants = [];
            this.queuedParticipants = [];
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