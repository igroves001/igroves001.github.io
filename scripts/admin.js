// Admin Panel Functionality

// Get API base URL (set from config.js)
const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) 
    ? window.API_BASE_URL 
    : (typeof window !== 'undefined' ? window.location.origin : '');

let rsvpsData = [];
let guestsData = [];
let faqsData = [];
let filteredRsvps = [];
let filteredGuests = [];

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notification-message');
    
    if (!notification || !messageEl) return;
    
    notification.className = `notification ${type} show`;
    messageEl.textContent = message;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

function showLoading(show = true) {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// Password check
function checkPassword() {
    const password = document.getElementById('password-input').value;
    const error = document.getElementById('password-error');
    
    if (password === ADMIN_PASSWORD) {
        // Store authentication in localStorage
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_auth_timestamp', Date.now().toString());
        
        document.getElementById('password-screen').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        loadData();
    } else {
        error.style.display = 'block';
        document.getElementById('password-input').value = '';
    }
}

// Check if already authenticated
function checkAuthStatus() {
    const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    const authTimestamp = localStorage.getItem('admin_auth_timestamp');
    
    // Check if authentication is still valid (24 hours)
    if (isAuthenticated && authTimestamp) {
        const hoursSinceAuth = (Date.now() - parseInt(authTimestamp)) / (1000 * 60 * 60);
        if (hoursSinceAuth < 24) {
            // Still authenticated, skip password screen
            document.getElementById('password-screen').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';
            loadData();
            return true;
        } else {
            // Authentication expired, clear it
            localStorage.removeItem('admin_authenticated');
            localStorage.removeItem('admin_auth_timestamp');
        }
    }
    return false;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if already authenticated
    if (checkAuthStatus()) {
        return; // Already authenticated, skip password screen
    }
    
    // Allow Enter key for password
    const passwordInput = document.getElementById('password-input');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkPassword();
            }
        });
    }
    
    // Set up form event listeners
    const editRsvpForm = document.getElementById('edit-rsvp-form');
    if (editRsvpForm) {
        editRsvpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const index = parseInt(document.getElementById('edit-rsvp-index').value);
            
            if (isNaN(index) || index < 0 || index >= rsvpsData.length) {
                showNotification('Invalid RSVP selection', 'error');
                return;
            }
            
            const attending = document.querySelector('#edit-rsvp-form input[name="attending"]:checked');
            if (!attending) {
                showNotification('Please select whether the guest is attending', 'error');
                return;
            }
            
            rsvpsData[index] = {
                ...rsvpsData[index],
                attending: attending.value,
                guests_count: document.getElementById('edit-guests').value,
                dietary_requirements: document.getElementById('edit-dietary').value,
                coach_needed: document.querySelector('#edit-rsvp-form input[name="coach"]:checked')?.value || 'no',
                message: document.getElementById('edit-message').value
            };
            
            try {
                await saveRsvps();
                closeModal('edit-rsvp-modal');
                await loadData();
            } catch (error) {
                // Error already shown by saveRsvps
            }
        });
    }
    
    const faqForm = document.getElementById('faq-form');
    if (faqForm) {
        faqForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await saveFaqs();
                closeModal('faq-modal');
                await loadData();
            } catch (error) {
                // Error already shown by saveFaqs
            }
        });
    }
    
    const guestForm = document.getElementById('guest-form');
    if (guestForm) {
        guestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const index = document.getElementById('edit-guest-index').value;
            const pin = document.getElementById('guest-pin').value.trim();
            const name = document.getElementById('guest-name').value.trim();
            
            // Validate PIN format
            if (!/^\d{4}$/.test(pin)) {
                showNotification('PIN must be exactly 4 digits', 'error');
                return;
            }
            
            // Validate name
            if (!name || name.trim() === '') {
                showNotification('Please enter a guest name', 'error');
                return;
            }
            
            try {
                await saveGuests();
                closeModal('guest-modal');
                await loadData();
            } catch (error) {
                // Error already shown by saveGuests
                // Reload data to get correct state
                await loadData();
            }
        });
    }
});

// Load all data
async function loadData() {
    showLoading(true);
    try {
        await Promise.all([loadRsvps(), loadGuests(), loadFaqs()]);
        displayRsvps();
        displayGuests();
        displayFaqs();
        updateStats();
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showNotification('Error loading data. Please refresh the page.', 'error');
        console.error('Error loading data:', error);
    }
}

// Load RSVPs
async function loadRsvps() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/get-rsvps`);
        
        if (!response.ok) {
            if (response.status === 404) {
                // File doesn't exist yet - that's okay, start with empty array
                rsvpsData = [];
                filteredRsvps = [];
                return;
            }
            const error = await response.json();
            throw new Error(error.error || `Failed to load RSVPs: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure it's an array
        if (!Array.isArray(data)) {
            console.warn('RSVPs data is not an array, initializing empty array');
            rsvpsData = [];
            filteredRsvps = [];
            return;
        }
        
        rsvpsData = data;
        filteredRsvps = [...rsvpsData];
    } catch (error) {
        showNotification('Error loading RSVPs: ' + (error.message || 'Please check your connection.'), 'error');
        console.error('Error loading RSVPs:', error);
        rsvpsData = [];
        filteredRsvps = [];
    }
}

// Load Guests
async function loadGuests() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/get-guests`);
        
        if (!response.ok) {
            if (response.status === 404) {
                // File doesn't exist yet - that's okay, start with empty array
                guestsData = [];
                filteredGuests = [];
                return;
            }
            const error = await response.json();
            throw new Error(error.error || `Failed to load guests: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ensure it's an array
        if (!Array.isArray(data)) {
            console.warn('Guests data is not an array, initializing empty array');
            guestsData = [];
            filteredGuests = [];
            return;
        }
        
        guestsData = data;
        filteredGuests = [...guestsData];
    } catch (error) {
        showNotification('Error loading guests: ' + (error.message || 'Please check your connection.'), 'error');
        console.error('Error loading guests:', error);
        guestsData = [];
        filteredGuests = [];
    }
}

// Load FAQs
async function loadFaqs() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/get-faqs`);
        
        if (!response.ok) {
            if (response.status === 404) {
                faqsData = [];
                return;
            }
            const error = await response.json();
            throw new Error(error.error || `Failed to load FAQs: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            console.warn('FAQs data is not an array, initializing empty array');
            faqsData = [];
            return;
        }
        
        faqsData = data;
    } catch (error) {
        showNotification('Error loading FAQs: ' + (error.message || 'Please check your connection.'), 'error');
        console.error('Error loading FAQs:', error);
        faqsData = [];
    }
}

// Display RSVPs
function displayRsvps() {
    const tbody = document.getElementById('rsvp-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filteredRsvps.length === 0) {
        const message = rsvpsData.length === 0 
            ? 'No RSVPs yet. RSVPs will appear here once guests submit their responses.'
            : 'No RSVPs match your search.';
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: rgba(250, 248, 245, 0.7);">${message}</td></tr>`;
        return;
    }
    
    filteredRsvps.forEach((rsvp, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rsvp.name || ''}</td>
            <td>${rsvp.pin || ''}</td>
            <td><span class="badge ${rsvp.attending === 'yes' ? 'badge-yes' : 'badge-no'}">${rsvp.attending === 'yes' ? 'Yes' : 'No'}</span></td>
            <td>${rsvp.guests_count || 0}</td>
            <td>${rsvp.dietary_requirements || '-'}</td>
            <td>${rsvp.coach_needed === 'yes' ? 'Yes' : 'No'}</td>
            <td>${rsvp.submitted_at ? new Date(rsvp.submitted_at).toLocaleDateString() : '-'}</td>
            <td class="actions">
                <button class="btn" onclick="openEditRsvpModal(${index})">Edit</button>
                <button class="btn btn-danger" onclick="deleteRsvp(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Display Guests
function displayGuests() {
    const tbody = document.getElementById('guest-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filteredGuests.length === 0) {
        const message = guestsData.length === 0 
            ? 'No guests added yet. Click "Add Guest" to create your first guest.'
            : 'No guests match your search.';
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: rgba(250, 248, 245, 0.7);">${message}</td></tr>`;
        return;
    }
    
    // Helper function to format role name for display
    function formatRoleName(role) {
        const roleMap = {
            'day_guest_staying': 'Day guest staying',
            'day_guest_not_staying': 'Day guest NOT staying',
            'evening_guest': 'Evening guest'
        };
        return roleMap[role] || role;
    }
    
    filteredGuests.forEach((guest, index) => {
        const row = document.createElement('tr');
        const logonCount = guest.logon && Array.isArray(guest.logon) ? guest.logon.length : 0;
        row.innerHTML = `
            <td>${guest.pin || ''}</td>
            <td>${guest.name || ''}</td>
            <td>${formatRoleName(guest.role || '')}</td>
            <td class="actions">
                <button class="btn" onclick="openEditGuestModal(${index})">Edit</button>
                <button class="btn" onclick="openAuditModal(${index})" title="View login history">Audit (${logonCount})</button>
                <button class="btn btn-danger" onclick="deleteGuest(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update Stats
function updateStats() {
    const stats = document.getElementById('rsvp-stats');
    if (!stats) return;
    
    const total = rsvpsData.length;
    const attending = rsvpsData.filter(r => r.attending === 'yes').length;
    const notAttending = rsvpsData.filter(r => r.attending === 'no').length;
    const totalGuests = rsvpsData.reduce((sum, r) => {
        const count = parseInt(r.guests_count) || 0;
        return sum + (r.attending === 'yes' ? count : 0);
    }, 0);
    const coachNeeded = rsvpsData.filter(r => r.coach_needed === 'yes').length;
    
    stats.innerHTML = `
        <div class="stat-card">
            <h3>${total}</h3>
            <p>Total RSVPs</p>
        </div>
        <div class="stat-card">
            <h3>${attending}</h3>
            <p>Attending</p>
        </div>
        <div class="stat-card">
            <h3>${notAttending}</h3>
            <p>Not Attending</p>
        </div>
        <div class="stat-card">
            <h3>${totalGuests}</h3>
            <p>Total Guests</p>
        </div>
        <div class="stat-card">
            <h3>${coachNeeded}</h3>
            <p>Coach Needed</p>
        </div>
    `;
}

// Filter RSVPs
function filterRsvps() {
    const searchInput = document.getElementById('rsvp-search');
    if (!searchInput) return;
    
    const search = searchInput.value.toLowerCase();
    filteredRsvps = rsvpsData.filter(rsvp => {
        return (
            (rsvp.name || '').toLowerCase().includes(search) ||
            (rsvp.pin || '').includes(search) ||
            (rsvp.dietary_requirements || '').toLowerCase().includes(search) ||
            (rsvp.message || '').toLowerCase().includes(search)
        );
    });
    displayRsvps();
}

// Filter Guests
function filterGuests() {
    const searchInput = document.getElementById('guest-search');
    if (!searchInput) return;
    
    const search = searchInput.value.toLowerCase();
    filteredGuests = guestsData.filter(guest => {
        return (
            (guest.name || '').toLowerCase().includes(search) ||
            (guest.pin || '').includes(search)
        );
    });
    displayGuests();
}

// Switch Tab
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    // Find and activate the clicked tab
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((t, i) => {
        if (t.textContent.trim().toLowerCase() === tab) {
            t.classList.add('active');
        }
    });
    
    const tabContent = document.getElementById(`${tab}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
    } else {
        console.error(`Tab content element not found: ${tab}-tab`);
    }
}

// Open Edit RSVP Modal
function openEditRsvpModal(index) {
    if (index < 0 || index >= filteredRsvps.length) return;
    
    const rsvp = filteredRsvps[index];
    const actualIndex = rsvpsData.findIndex(r => r.pin === rsvp.pin && r.submitted_at === rsvp.submitted_at);
    
    const indexInput = document.getElementById('edit-rsvp-index');
    if (!indexInput) return;
    
    indexInput.value = actualIndex;
    document.getElementById('edit-attending-yes').checked = rsvp.attending === 'yes';
    document.getElementById('edit-attending-no').checked = rsvp.attending === 'no';
    document.getElementById('edit-guests').value = rsvp.guests_count || '';
    document.getElementById('edit-dietary').value = rsvp.dietary_requirements || '';
    document.getElementById('edit-coach-yes').checked = rsvp.coach_needed === 'yes';
    document.getElementById('edit-coach-no').checked = rsvp.coach_needed !== 'yes';
    document.getElementById('edit-message').value = rsvp.message || '';
    
    document.getElementById('edit-rsvp-modal').style.display = 'block';
}


// Delete RSVP via Vercel API
async function deleteRsvp(index) {
    if (index < 0 || index >= filteredRsvps.length) {
        showNotification('Invalid RSVP selection', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this RSVP?')) return;
    
    const rsvp = filteredRsvps[index];
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/delete-rsvp?pin=${encodeURIComponent(rsvp.pin)}&submitted_at=${encodeURIComponent(rsvp.submitted_at || '')}`,
            {
                method: 'DELETE'
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete RSVP');
        }
        
        await loadData();
        showNotification('RSVP deleted successfully', 'success');
    } catch (error) {
        showNotification(error.message || 'Error deleting RSVP.', 'error');
    }
}

// Generate a random 4-digit PIN
function generateRandomPin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Check if a PIN is already in use
function isPinInUse(pin, excludePin = null) {
    return guestsData.some(guest => {
        // Exclude the current guest's PIN when editing
        if (excludePin && guest.pin === excludePin) {
            return false;
        }
        return guest.pin === pin;
    });
}

// Generate a unique PIN that's not already in use
function generateUniquePin() {
    let pin = generateRandomPin();
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop
    
    while (isPinInUse(pin) && attempts < maxAttempts) {
        pin = generateRandomPin();
        attempts++;
    }
    
    if (attempts >= maxAttempts) {
        // Fallback: try sequential PINs
        for (let i = 1000; i <= 9999; i++) {
            const testPin = i.toString().padStart(4, '0');
            if (!isPinInUse(testPin)) {
                return testPin;
            }
        }
        throw new Error('Unable to generate unique PIN. All PINs are in use.');
    }
    
    return pin;
}

// Open Add Guest Modal
function openAddGuestModal() {
    const title = document.getElementById('guest-modal-title');
    const form = document.getElementById('guest-form');
    const indexInput = document.getElementById('edit-guest-index');
    const pinInput = document.getElementById('guest-pin');
    const maxGuestsInput = document.getElementById('guest-max-guests');
    const modal = document.getElementById('guest-modal');
    
    if (!title || !form || !indexInput || !pinInput || !maxGuestsInput || !modal) return;
    
    title.textContent = 'Add Guest';
    form.reset();
    indexInput.value = '';
    
    // Auto-generate a unique PIN
    try {
        const uniquePin = generateUniquePin();
        pinInput.value = uniquePin;
    } catch (error) {
        console.error('Error generating PIN:', error);
        showNotification('Error generating PIN. Please enter manually.', 'error');
    }
    
    // Set default max guests to 1
    maxGuestsInput.value = '1';
    
    modal.style.display = 'block';
}

// Open Edit Guest Modal
function openEditGuestModal(index) {
    if (index < 0 || index >= filteredGuests.length) return;
    
    const guest = filteredGuests[index];
    const actualIndex = guestsData.findIndex(g => g.pin === guest.pin);
    
    const title = document.getElementById('guest-modal-title');
    const indexInput = document.getElementById('edit-guest-index');
    const pinInput = document.getElementById('guest-pin');
    const nameInput = document.getElementById('guest-name');
    const roleInput = document.getElementById('guest-role');
    const maxGuestsInput = document.getElementById('guest-max-guests');
    const modal = document.getElementById('guest-modal');
    
    if (!title || !indexInput || !pinInput || !nameInput || !roleInput || !maxGuestsInput || !modal) return;
    
    title.textContent = 'Edit Guest';
    indexInput.value = actualIndex;
    pinInput.value = guest.pin || '';
    nameInput.value = guest.name || '';
    roleInput.value = guest.role || '';
    maxGuestsInput.value = guest.max_guests || '1';
    
    modal.style.display = 'block';
}

// Open Audit Modal
function openAuditModal(index) {
    if (index < 0 || index >= filteredGuests.length) return;
    
    const guest = filteredGuests[index];
    const actualIndex = guestsData.findIndex(g => g.pin === guest.pin);
    
    const title = document.getElementById('audit-modal-title');
    const content = document.getElementById('audit-content');
    const modal = document.getElementById('audit-modal');
    
    if (!title || !content || !modal) return;
    
    title.textContent = `Login Audit Trail - ${guest.name || 'Guest'} (PIN: ${guest.pin})`;
    
    const logonHistory = guest.logon && Array.isArray(guest.logon) ? guest.logon : [];
    
    if (logonHistory.length === 0) {
        content.innerHTML = `
            <p style="color: rgba(250, 248, 245, 0.7); text-align: center; padding: 2rem;">
                No login history recorded yet.
            </p>
        `;
    } else {
        // Sort by timestamp (newest first)
        const sortedLogons = [...logonHistory].sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeB - timeA;
        });
        
        let html = `
            <div style="margin-bottom: 1rem;">
                <p style="color: rgba(250, 248, 245, 0.7); margin-bottom: 1rem;">
                    Total logins: <strong style="color: var(--accent);">${logonHistory.length}</strong>
                </p>
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                            <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(250, 248, 245, 0.7);">Date</th>
                            <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(250, 248, 245, 0.7);">Time</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        sortedLogons.forEach((logon, idx) => {
            const date = logon.date || (logon.timestamp ? new Date(logon.timestamp).toLocaleDateString('en-GB') : 'N/A');
            const time = logon.time || (logon.timestamp ? new Date(logon.timestamp).toLocaleTimeString('en-GB') : 'N/A');
            
            html += `
                <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <td style="padding: 0.75rem; color: var(--cream);">${date}</td>
                    <td style="padding: 0.75rem; color: var(--cream);">${time}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        content.innerHTML = html;
    }
    
    modal.style.display = 'block';
}

// Delete Guest via Vercel API
async function deleteGuest(index) {
    if (index < 0 || index >= filteredGuests.length) {
        showNotification('Invalid guest selection', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this guest?')) return;
    
    const guest = filteredGuests[index];
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/delete-guest?pin=${encodeURIComponent(guest.pin)}`,
            {
                method: 'DELETE'
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete guest');
        }
        
        await loadData();
        showNotification('Guest deleted successfully', 'success');
    } catch (error) {
        showNotification(error.message || 'Error deleting guest.', 'error');
    }
}

// Save RSVP via Vercel API (called from edit form)
async function saveRsvps() {
    try {
        // Get the RSVP data from the form
        const editIndex = parseInt(document.getElementById('edit-rsvp-index')?.value || '-1');
        if (editIndex < 0 || editIndex >= rsvpsData.length) {
            throw new Error('Invalid RSVP index');
        }
        
        const rsvpData = rsvpsData[editIndex];
        
        const response = await fetch(`${API_BASE_URL}/api/save-rsvp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rsvpData: rsvpData
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save RSVP');
        }
        
        showNotification('RSVP updated successfully!', 'success');
    } catch (error) {
        console.error('Error saving RSVPs:', error);
        showNotification(error.message || 'Error saving RSVPs.', 'error');
        throw error;
    }
}

// Save Guest via Vercel API (called from guest form)
async function saveGuests() {
    try {
        // Get guest data from form
        const index = document.getElementById('edit-guest-index')?.value || '';
        const pin = document.getElementById('guest-pin')?.value.trim() || '';
        const name = document.getElementById('guest-name')?.value.trim() || '';
        const role = document.getElementById('guest-role')?.value || '';
        const maxGuests = document.getElementById('guest-max-guests')?.value || '';
        
        if (!pin || !name || !role || !maxGuests) {
            throw new Error('PIN, name, role, and number of guests are required');
        }
        
        // Validate PIN format
        if (!/^\d{4}$/.test(pin)) {
            throw new Error('PIN must be exactly 4 digits');
        }
        
        // Check if PIN is already in use (only for new guests, not updates)
        if (!index) {
            if (isPinInUse(pin)) {
                throw new Error('This PIN is already in use. Please choose a different PIN.');
            }
        } else {
            // When updating, check if PIN is in use by another guest
            const currentGuest = guestsData[parseInt(index)];
            if (currentGuest && currentGuest.pin !== pin && isPinInUse(pin, currentGuest.pin)) {
                throw new Error('This PIN is already in use by another guest. Please choose a different PIN.');
            }
        }
        
        // has_room is determined by role: day_guest_staying = true, others = false
        const hasRoom = role === 'day_guest_staying';
        
        const guestData = {
            pin: pin,
            name: name,
            role: role,
            has_room: hasRoom,
            max_guests: parseInt(maxGuests) || 1
        };
        
        const response = await fetch(`${API_BASE_URL}/api/save-guest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guestData: guestData,
                isUpdate: index !== ''
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save guest');
        }
        
        showNotification('Guest saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving guests:', error);
        showNotification(error.message || 'Error saving guests.', 'error');
        throw error;
    }
}

// Close Modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Export to CSV
function exportCSV() {
    const headers = ['Name', 'PIN', 'Attending', 'Guests', 'Dietary Requirements', 'Coach Needed', 'Message', 'Submitted'];
    const rows = rsvpsData.map(rsvp => [
        rsvp.name || '',
        rsvp.pin || '',
        rsvp.attending || '',
        rsvp.guests_count || '0',
        rsvp.dietary_requirements || '',
        rsvp.coach_needed || 'no',
        rsvp.message || '',
        rsvp.submitted_at || ''
    ]);
    
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsvps-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Display FAQs
function displayFaqs() {
    const tbody = document.getElementById('faq-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (faqsData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: rgba(250, 248, 245, 0.7);">No FAQs added yet. Click "Add FAQ" to create your first FAQ.</td></tr>`;
        return;
    }
    
    // Helper function to format roles
    function formatRoles(roles) {
        const roleNames = [];
        if (roles.day_guest_staying) roleNames.push('Day staying');
        if (roles.day_guest_not_staying) roleNames.push('Day not staying');
        if (roles.evening_guest) roleNames.push('Evening');
        return roleNames.join(', ') || 'None';
    }
    
    faqsData.forEach((faq, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${faq.order || 0}</td>
            <td>${faq.question || ''}</td>
            <td>${formatRoles(faq.roles || {})}</td>
            <td class="actions">
                <button class="btn" onclick="openEditFaqModal(${index})">Edit</button>
                <button class="btn btn-danger" onclick="deleteFaq(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Open Add FAQ Modal
function openAddFaqModal() {
    const title = document.getElementById('faq-modal-title');
    const form = document.getElementById('faq-form');
    const indexInput = document.getElementById('edit-faq-index');
    const modal = document.getElementById('faq-modal');
    
    if (!title || !form || !indexInput || !modal) return;
    
    title.textContent = 'Add FAQ';
    form.reset();
    indexInput.value = '';
    document.getElementById('faq-order').value = faqsData.length > 0 ? Math.max(...faqsData.map(f => f.order || 0)) + 1 : 1;
    document.getElementById('faq-buttons-container').innerHTML = '';
    document.getElementById('faq-infoboxes-container').innerHTML = '';
    modal.style.display = 'block';
}

// Add FAQ Button
function addFaqButton(buttonData = null) {
    const container = document.getElementById('faq-buttons-container');
    if (!container) return;
    
    const buttonIndex = container.children.length;
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'form-group';
    buttonDiv.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    buttonDiv.style.padding = '1rem';
    buttonDiv.style.marginBottom = '0.5rem';
    buttonDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="margin: 0;">Button/Link ${buttonIndex + 1}</label>
            <button type="button" class="btn btn-danger" onclick="this.parentElement.parentElement.remove()" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;">Remove</button>
        </div>
        <div class="form-group" style="margin-bottom: 0.5rem;">
            <label>Text *</label>
            <input type="text" class="faq-button-text" value="${buttonData?.text || ''}" required>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
            <label>URL *</label>
            <input type="text" class="faq-button-url" value="${buttonData?.url || ''}" required>
        </div>
    `;
    container.appendChild(buttonDiv);
}

// Add FAQ Info Box
function addFaqInfoBox(infoBoxData = null) {
    const container = document.getElementById('faq-infoboxes-container');
    if (!container) return;
    
    const boxIndex = container.children.length;
    const boxDiv = document.createElement('div');
    boxDiv.className = 'form-group';
    boxDiv.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    boxDiv.style.padding = '1rem';
    boxDiv.style.marginBottom = '0.5rem';
    boxDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label style="margin: 0;">Info Box ${boxIndex + 1}</label>
            <button type="button" class="btn btn-danger" onclick="this.parentElement.parentElement.remove()" style="padding: 0.25rem 0.5rem; font-size: 0.7rem;">Remove</button>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
            <label>Text *</label>
            <textarea class="faq-infobox-text" required>${infoBoxData?.text || ''}</textarea>
        </div>
    `;
    container.appendChild(boxDiv);
}

// Open Edit FAQ Modal
function openEditFaqModal(index) {
    if (index < 0 || index >= faqsData.length) return;
    
    const faq = faqsData[index];
    const title = document.getElementById('faq-modal-title');
    const indexInput = document.getElementById('edit-faq-index');
    const idInput = document.getElementById('faq-id');
    const questionInput = document.getElementById('faq-question');
    const answerInput = document.getElementById('faq-answer');
    const orderInput = document.getElementById('faq-order');
    const roleStaying = document.getElementById('faq-role-staying');
    const roleNotStaying = document.getElementById('faq-role-not-staying');
    const roleEvening = document.getElementById('faq-role-evening');
    const largeMargin = document.getElementById('faq-large-margin');
    const buttonsContainer = document.getElementById('faq-buttons-container');
    const infoboxesContainer = document.getElementById('faq-infoboxes-container');
    const modal = document.getElementById('faq-modal');
    
    if (!title || !indexInput || !idInput || !questionInput || !answerInput || !orderInput || !modal) return;
    
    title.textContent = 'Edit FAQ';
    indexInput.value = index;
    idInput.value = faq.id || '';
    idInput.disabled = true; // Don't allow editing ID
    questionInput.value = faq.question || '';
    answerInput.value = faq.answer || '';
    orderInput.value = faq.order || 1;
    roleStaying.checked = faq.roles?.day_guest_staying || false;
    roleNotStaying.checked = faq.roles?.day_guest_not_staying || false;
    roleEvening.checked = faq.roles?.evening_guest || false;
    largeMargin.checked = faq.largeMargin || false;
    
    // Clear and populate buttons
    buttonsContainer.innerHTML = '';
    if (faq.buttons && faq.buttons.length > 0) {
        faq.buttons.forEach(button => addFaqButton(button));
    }
    
    // Clear and populate info boxes
    infoboxesContainer.innerHTML = '';
    if (faq.infoBoxes && faq.infoBoxes.length > 0) {
        faq.infoBoxes.forEach(box => addFaqInfoBox(box));
    }
    
    modal.style.display = 'block';
}

// Delete FAQ
async function deleteFaq(index) {
    if (index < 0 || index >= faqsData.length) {
        showNotification('Invalid FAQ selection', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    
    faqsData.splice(index, 1);
    
    try {
        await saveFaqs();
        await loadData();
        showNotification('FAQ deleted successfully', 'success');
    } catch (error) {
        showNotification(error.message || 'Error deleting FAQ.', 'error');
    }
}

// Save FAQs
async function saveFaqs() {
    try {
        // Get FAQ data from form if modal is open
        const indexInput = document.getElementById('edit-faq-index');
        const id = document.getElementById('faq-id')?.value.trim();
        const question = document.getElementById('faq-question')?.value.trim();
        
        if (id && question) {
            // We have form data, process it
            const answer = document.getElementById('faq-answer')?.value.trim() || '';
            const order = parseInt(document.getElementById('faq-order')?.value) || 1;
            const roleStaying = document.getElementById('faq-role-staying')?.checked || false;
            const roleNotStaying = document.getElementById('faq-role-not-staying')?.checked || false;
            const roleEvening = document.getElementById('faq-role-evening')?.checked || false;
            const largeMargin = document.getElementById('faq-large-margin')?.checked || false;
            
            // Get buttons
            const buttons = [];
            const buttonContainers = document.querySelectorAll('#faq-buttons-container > div');
            buttonContainers.forEach(container => {
                const text = container.querySelector('.faq-button-text')?.value.trim();
                const url = container.querySelector('.faq-button-url')?.value.trim();
                if (text && url) {
                    buttons.push({ text, url, type: 'link' });
                }
            });
            
            // Get info boxes
            const infoBoxes = [];
            const infoboxContainers = document.querySelectorAll('#faq-infoboxes-container > div');
            infoboxContainers.forEach(container => {
                const text = container.querySelector('.faq-infobox-text')?.value.trim();
                if (text) {
                    infoBoxes.push({ text });
                }
            });
            
            if (!id || !question) {
                throw new Error('ID and question are required');
            }
            
            if (!roleStaying && !roleNotStaying && !roleEvening) {
                throw new Error('At least one role must be selected');
            }
            
            const faqData = {
                id,
                question,
                answer,
                order,
                roles: {
                    day_guest_staying: roleStaying,
                    day_guest_not_staying: roleNotStaying,
                    evening_guest: roleEvening
                },
                buttons,
                infoBoxes
            };
            
            if (largeMargin) {
                faqData.largeMargin = true;
            }
            
            if (indexInput && indexInput.value !== '') {
                // Editing existing FAQ
                const index = parseInt(indexInput.value);
                faqsData[index] = faqData;
            } else {
                // Adding new FAQ - check if ID already exists
                const existingIndex = faqsData.findIndex(f => f.id === id);
                if (existingIndex !== -1) {
                    throw new Error('A FAQ with this ID already exists');
                }
                faqsData.push(faqData);
            }
        }
        
        // Sort by order
        faqsData.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        const response = await fetch(`${API_BASE_URL}/api/save-faqs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                faqsData: faqsData
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save FAQs');
        }
        
        showNotification('FAQs saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving FAQs:', error);
        showNotification(error.message || 'Error saving FAQs.', 'error');
        throw error;
    }
}

// Refresh Data
async function refreshData() {
    showNotification('Refreshing data...', 'warning');
    await loadData();
    showNotification('Data refreshed', 'success');
}

// Close modals when clicking outside
document.addEventListener('DOMContentLoaded', () => {
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});

