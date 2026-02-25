// Workshop enrollment management
class WorkshopEnrollment {
    constructor() {
        this.maxParticipants = 8;
        this.enrolledParticipants = this.loadFromStorage('enrolled') || [];
        this.queuedParticipants = this.loadFromStorage('queued') || [];
        
        this.initializeEventListeners();
        this.updateUI();
    }

    initializeEventListeners() {
        const form = document.getElementById('enrollmentForm');
        form.addEventListener('submit', (e) => this.handleEnrollment(e));
    }

    handleEnrollment(event) {
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

        // Save to storage and update UI
        this.saveToStorage();
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

    saveToStorage() {
        localStorage.setItem('workshop-enrolled', JSON.stringify(this.enrolledParticipants));
        localStorage.setItem('workshop-queued', JSON.stringify(this.queuedParticipants));
    }

    loadFromStorage(type) {
        try {
            const key = type === 'enrolled' ? 'workshop-enrolled' : 'workshop-queued';
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading data from storage:', error);
            return [];
        }
    }

    // Admin functions for testing/management
    clearAllData() {
        if (confirm('Are you sure you want to clear all enrollment data? This cannot be undone.')) {
            this.enrolledParticipants = [];
            this.queuedParticipants = [];
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