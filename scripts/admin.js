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
    
    if (!notification || !messageEl) {
        console.warn('Notification elements not found in DOM');
        // Fallback to alert if notification element doesn't exist
        alert(message);
        return;
    }
    
    notification.className = `notification ${type} show`;
    messageEl.textContent = message;
    
    // Ensure notification is visible
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.classList.remove('show');
        // Hide after animation
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 5000);
}

function showLoading(show = true) {
    const loading = document.getElementById('loading-indicator');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// Standardized error logging helper
function logError(context, error, additionalData = {}) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
        timestamp,
        context,
        errorMessage: error?.message || String(error),
        stack: error?.stack,
        ...additionalData
    };
    
    console.error(`[${timestamp}] Error in ${context}:`, errorInfo);
    console.error('Full error object:', error);
    
    if (error?.stack) {
        console.error('Stack trace:', error.stack);
    }
}

// Password check
async function checkPassword() {
    const password = document.getElementById('password-input').value;
    const error = document.getElementById('password-error');
    const passwordInput = document.getElementById('password-input');
    
    if (!password) {
        error.style.display = 'block';
        showNotification('Please enter a password', 'error');
        return;
    }
    
    // Disable input while validating
    passwordInput.disabled = true;
    error.style.display = 'none';
    
    try {
        const requestUrl = `${API_BASE_URL}/api/validate-admin-password`;
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store authentication in localStorage
            localStorage.setItem('admin_authenticated', 'true');
            localStorage.setItem('admin_auth_timestamp', Date.now().toString());
            
            showNotification('Authentication successful', 'success');
            document.getElementById('password-screen').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';
            loadData();
        } else {
            error.style.display = 'block';
            passwordInput.value = '';
            logError('Validating password', new Error(data.error || 'Invalid password'), {
                requestUrl,
                requestMethod: 'POST',
                responseStatus: response.status,
                responseStatusText: response.statusText
            });
            showNotification('Invalid password. Please try again.', 'error');
        }
    } catch (err) {
        const requestUrl = `${API_BASE_URL}/api/validate-admin-password`;
        logError('Validating password', err, {
            requestUrl,
            requestMethod: 'POST'
        });
        error.style.display = 'block';
        passwordInput.value = '';
        showNotification('Error validating password. Please try again.', 'error');
    } finally {
        passwordInput.disabled = false;
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
        // Still need to set up form handlers even if already authenticated
        setupFormHandlers();
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
    setupFormHandlers();
});

// Set up form event listeners (called from DOMContentLoaded)
function setupFormHandlers() {
    console.log('Setting up form handlers...');
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
            
            // Collect attending guests with their dietary requirements
            const attendingGuests = [];
            if (attending.value === 'yes') {
                const checkboxes = document.querySelectorAll('#edit-rsvp-form input[name="edit-attending-guests"]:checked');
                checkboxes.forEach(checkbox => {
                    const guestName = checkbox.value;
                    // Find the dietary input by finding the parent item and then the input within it
                    const item = checkbox.closest('.edit-guest-attendance-item');
                    const dietaryInput = item ? item.querySelector('.edit-guest-dietary-input') : null;
                    const dietaryRequirements = dietaryInput ? dietaryInput.value.trim() : '';
                    
                    attendingGuests.push({
                        name: guestName,
                        dietary_requirements: dietaryRequirements
                    });
                });
            }
            
            // Clean up old format fields
            const updatedRsvp = {
                ...rsvpsData[index],
                attending: attending.value,
                attending_guests: attendingGuests,
                coach_needed: document.querySelector('#edit-rsvp-form input[name="coach"]:checked')?.value || 'no',
                message: document.getElementById('edit-message').value
            };
            
            // Remove old format fields
            delete updatedRsvp.guests_count;
            delete updatedRsvp.dietary_requirements;
            
            rsvpsData[index] = updatedRsvp;
            
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
        console.log('Guest form found, attaching submit handler');
        guestForm.addEventListener('submit', async (e) => {
            console.log('Guest form submitted');
            e.preventDefault();
            const index = document.getElementById('edit-guest-index').value;
            const pin = document.getElementById('guest-pin').value.trim();
            const name = document.getElementById('guest-name').value.trim();
            
            // Get submit button and disable it
            const submitButton = guestForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton ? submitButton.textContent : 'Save';
            
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Saving...';
            }
            
            // Validate PIN format
            if (!/^\d{4}$/.test(pin)) {
                showNotification('PIN must be exactly 4 digits', 'error');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
                return;
            }
            
            // Validate name
            if (!name || name.trim() === '') {
                showNotification('Please enter an invite name', 'error');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
                return;
            }
            
            // Validate guest names
            const nameInputs = document.querySelectorAll('.guest-name-input');
            const guestNames = Array.from(nameInputs)
                .map(input => input.value.trim())
                .filter(name => name !== '');
            
            if (guestNames.length === 0) {
                showNotification('Please add at least one person to this invite', 'error');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
                return;
            }
            
            try {
                console.log('Calling saveGuests...');
                await saveGuests();
                console.log('saveGuests completed successfully');
                // Show success notification and wait a moment before closing
                showNotification(index ? 'Guest updated successfully!' : 'Guest added successfully!', 'success');
                
                // Close modal and reload data after a short delay to show the notification
                setTimeout(async () => {
                    closeModal('guest-modal');
                    await loadData();
                }, 500);
            } catch (error) {
                // Error already shown by saveGuests
                // Reload data to get correct state
                await loadData();
            } finally {
                // Re-enable button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    }
}

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
        logError('Loading all data', error);
        showNotification('Error loading data. Please refresh the page.', 'error');
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
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error || `Failed to load RSVPs: ${response.status}`);
            error.response = { status: response.status, statusText: response.statusText };
            throw error;
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
        const requestUrl = `${API_BASE_URL}/api/get-rsvps`;
        logError('Loading RSVPs', error, {
            requestUrl,
            requestMethod: 'GET',
            responseStatus: error.response?.status,
            responseStatusText: error.response?.statusText
        });
        showNotification('Error loading RSVPs: ' + (error.message || 'Please check your connection.'), 'error');
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
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error || `Failed to load guests: ${response.status}`);
            error.response = { status: response.status, statusText: response.statusText };
            throw error;
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
        const requestUrl = `${API_BASE_URL}/api/get-guests`;
        logError('Loading guests', error, {
            requestUrl,
            requestMethod: 'GET',
            responseStatus: error.response?.status,
            responseStatusText: error.response?.statusText
        });
        showNotification('Error loading guests: ' + (error.message || 'Please check your connection.'), 'error');
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
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error || `Failed to load FAQs: ${response.status}`);
            error.response = { status: response.status, statusText: response.statusText };
            throw error;
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            console.warn('FAQs data is not an array, initializing empty array');
            faqsData = [];
            return;
        }
        
        faqsData = data;
    } catch (error) {
        const requestUrl = `${API_BASE_URL}/api/get-faqs`;
        logError('Loading FAQs', error, {
            requestUrl,
            requestMethod: 'GET',
            responseStatus: error.response?.status,
            responseStatusText: error.response?.statusText
        });
        showNotification('Error loading FAQs: ' + (error.message || 'Please check your connection.'), 'error');
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
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 2rem; color: rgba(250, 248, 245, 0.7);">${message}</td></tr>`;
        return;
    }
    
    filteredRsvps.forEach((rsvp, index) => {
        // Find the guest to get all people on the invite
        const guest = guestsData.find(g => g.pin === rsvp.pin);
        const allGuestNames = guest?.guest_names || [];
        
        // Get attending guests (handle both old and new format)
        let attendingGuests = [];
        if (rsvp.attending === 'yes') {
            if (rsvp.attending_guests && Array.isArray(rsvp.attending_guests) && rsvp.attending_guests.length > 0) {
                attendingGuests = rsvp.attending_guests;
            } else if (rsvp.guests_count) {
                // Old format: create attending guests from count
                const count = parseInt(rsvp.guests_count) || 0;
                for (let i = 0; i < count && i < allGuestNames.length; i++) {
                    attendingGuests.push({
                        name: allGuestNames[i],
                        dietary_requirements: rsvp.dietary_requirements || ''
                    });
                }
            }
        }
        
        // Create main row
        const row = document.createElement('tr');
        const actualIndex = rsvpsData.findIndex(r => r.pin === rsvp.pin && r.submitted_at === rsvp.submitted_at);
        row.innerHTML = `
            <td><strong>${rsvp.name || ''}</strong></td>
            <td>${rsvp.submitted_at ? new Date(rsvp.submitted_at).toLocaleDateString() : '-'}</td>
            <td class="actions">
                <button class="btn" onclick="openEditRsvpModal(${actualIndex})" style="padding: 0.5rem 1rem; font-size: 0.7rem;">Edit</button>
                <button class="btn btn-danger" onclick="deleteRsvp(${index})" style="padding: 0.5rem 1rem; font-size: 0.7rem;">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
        
        // Add sub-rows for each person on the invite
        if (allGuestNames.length > 0) {
            allGuestNames.forEach(guestName => {
                const attendingGuest = attendingGuests.find(g => g.name === guestName);
                const isAttending = rsvp.attending === 'yes' && attendingGuest !== undefined;
                const dietary = attendingGuest?.dietary_requirements || '';
                
                const subRow = document.createElement('tr');
                subRow.className = 'person-sub-row';
                subRow.innerHTML = `
                    <td>
                        <span class="person-name">${guestName}</span>
                        ${isAttending ? '<span class="badge badge-yes" style="margin-left: 0.5rem;">Attending</span>' : '<span class="badge badge-no" style="margin-left: 0.5rem;">Not Attending</span>'}
                        ${dietary ? `<span class="person-dietary" style="display: block; margin-top: 0.25rem;">Dietary: ${dietary}</span>` : ''}
                    </td>
                    <td></td>
                    <td></td>
                `;
                tbody.appendChild(subRow);
            });
        } else {
            // Fallback: show attending guests if we don't have guest data
            if (attendingGuests.length > 0) {
                attendingGuests.forEach(attendingGuest => {
                    const subRow = document.createElement('tr');
                    subRow.className = 'person-sub-row';
                    subRow.innerHTML = `
                        <td>
                            <span class="person-name">${attendingGuest.name}</span>
                            <span class="badge badge-yes" style="margin-left: 0.5rem;">Attending</span>
                            ${attendingGuest.dietary_requirements ? `<span class="person-dietary" style="display: block; margin-top: 0.25rem;">Dietary: ${attendingGuest.dietary_requirements}</span>` : ''}
                        </td>
                        <td></td>
                        <td></td>
                    `;
                    tbody.appendChild(subRow);
                });
            }
        }
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
                <button class="btn btn-audit" onclick="openAuditModal(${index})" title="View login history">Audit (${logonCount})</button>
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
    
    // RSVP count
    const rsvpCount = rsvpsData.length;
    
    // People attending count
    let peopleAttending = 0;
    rsvpsData.forEach(rsvp => {
        if (rsvp.attending === 'yes') {
            if (rsvp.attending_guests && Array.isArray(rsvp.attending_guests)) {
                peopleAttending += rsvp.attending_guests.length;
            } else if (rsvp.guests_count) {
                peopleAttending += parseInt(rsvp.guests_count) || 0;
            }
        }
    });
    
    // People NOT attending count
    let peopleNotAttending = 0;
    rsvpsData.forEach(rsvp => {
        const guest = guestsData.find(g => g.pin === rsvp.pin);
        const allPeopleOnInvite = guest?.guest_names?.length || 0;
        
        if (rsvp.attending === 'no') {
            // All people on invite are not attending
            peopleNotAttending += allPeopleOnInvite;
        } else if (rsvp.attending === 'yes') {
            // Count people on invite who are not in attending_guests
            let attendingCount = 0;
            if (rsvp.attending_guests && Array.isArray(rsvp.attending_guests)) {
                attendingCount = rsvp.attending_guests.length;
            } else if (rsvp.guests_count) {
                attendingCount = parseInt(rsvp.guests_count) || 0;
            }
            peopleNotAttending += Math.max(0, allPeopleOnInvite - attendingCount);
        }
    });
    
    // People on coach count (attending people from RSVPs where coach_needed is 'yes')
    let peopleOnCoach = 0;
    rsvpsData.forEach(rsvp => {
        if (rsvp.coach_needed === 'yes' && rsvp.attending === 'yes') {
            if (rsvp.attending_guests && Array.isArray(rsvp.attending_guests)) {
                peopleOnCoach += rsvp.attending_guests.length;
            } else if (rsvp.guests_count) {
                peopleOnCoach += parseInt(rsvp.guests_count) || 0;
            }
        }
    });
    
    // Count of people (not RSVPs) per role
    const peopleByRole = {
        day_guest_staying: 0,
        day_guest_not_staying: 0,
        evening_guest: 0
    };
    
    guestsData.forEach(guest => {
        const peopleCount = guest.guest_names?.length || 0;
        if (guest.role && peopleByRole.hasOwnProperty(guest.role)) {
            peopleByRole[guest.role] += peopleCount;
        }
    });
    
    stats.innerHTML = `
        <div class="stat-card">
            <h3>${rsvpCount}</h3>
            <p>RSVP Count</p>
        </div>
        <div class="stat-card">
            <h3>${peopleAttending}</h3>
            <p>People Attending</p>
        </div>
        <div class="stat-card">
            <h3>${peopleNotAttending}</h3>
            <p>People NOT Attending</p>
        </div>
        <div class="stat-card">
            <h3>${peopleOnCoach}</h3>
            <p>People on Coach</p>
        </div>
        <div class="stat-card">
            <h3>${peopleByRole.day_guest_staying}</h3>
            <p>Day Guest Staying</p>
        </div>
        <div class="stat-card">
            <h3>${peopleByRole.day_guest_not_staying}</h3>
            <p>Day Guest NOT Staying</p>
        </div>
        <div class="stat-card">
            <h3>${peopleByRole.evening_guest}</h3>
            <p>Evening Guest</p>
        </div>
    `;
}

// Filter RSVPs
function filterRsvps() {
    const searchInput = document.getElementById('rsvp-search');
    if (!searchInput) return;
    
    const search = searchInput.value.toLowerCase();
    filteredRsvps = rsvpsData.filter(rsvp => {
        // Search in name and message
        if ((rsvp.name || '').toLowerCase().includes(search) ||
            (rsvp.message || '').toLowerCase().includes(search)) {
            return true;
        }
        
        // Search in attending guests' names and dietary requirements
        if (rsvp.attending_guests && Array.isArray(rsvp.attending_guests)) {
            for (const guest of rsvp.attending_guests) {
                if ((guest.name || '').toLowerCase().includes(search) ||
                    (guest.dietary_requirements || '').toLowerCase().includes(search)) {
                    return true;
                }
            }
        }
        
        // Search in all guest names from guest data
        const guest = guestsData.find(g => g.pin === rsvp.pin);
        if (guest && guest.guest_names) {
            for (const guestName of guest.guest_names) {
                if ((guestName || '').toLowerCase().includes(search)) {
                    return true;
                }
            }
        }
        
        return false;
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
    document.getElementById('edit-coach-yes').checked = rsvp.coach_needed === 'yes';
    document.getElementById('edit-coach-no').checked = rsvp.coach_needed !== 'yes';
    document.getElementById('edit-message').value = rsvp.message || '';
    
    // Get guest data to find guest names
    const guest = guestsData.find(g => g.pin === rsvp.pin);
    const container = document.getElementById('edit-guest-attendance-container');
    if (container) {
        container.innerHTML = '';
        
        // Get guest names (handle migration)
        let guestNames = guest?.guest_names || [];
        if (guestNames.length === 0 && guest?.max_guests) {
            const maxGuests = parseInt(guest.max_guests) || 1;
            guestNames = [];
            for (let i = 1; i <= maxGuests; i++) {
                guestNames.push(`Guest ${i}`);
            }
        }
        if (guestNames.length === 0) {
            guestNames = ['Guest'];
        }
        
        // Get existing attending guests (handle both old and new format)
        let existingAttendingGuests = [];
        if (rsvp.attending === 'yes') {
            if (rsvp.attending_guests && Array.isArray(rsvp.attending_guests)) {
                existingAttendingGuests = rsvp.attending_guests;
            } else if (rsvp.guests_count) {
                // Old format migration
                const count = parseInt(rsvp.guests_count) || 0;
                for (let i = 0; i < count && i < guestNames.length; i++) {
                    existingAttendingGuests.push({
                        name: guestNames[i],
                        dietary_requirements: rsvp.dietary_requirements || ''
                    });
                }
            }
        }
        
        // Create checkbox for each guest name
        guestNames.forEach((guestName, idx) => {
            const item = document.createElement('div');
            item.className = 'edit-guest-attendance-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `edit-guest-checkbox-${idx}`;
            checkbox.name = 'edit-attending-guests';
            checkbox.value = guestName;
            
            // Check if this guest was previously marked as attending
            const existingGuest = existingAttendingGuests.find(g => g.name === guestName);
            if (existingGuest) {
                checkbox.checked = true;
            }
            
            const label = document.createElement('label');
            label.className = 'edit-guest-name-label';
            label.htmlFor = `edit-guest-checkbox-${idx}`;
            label.textContent = guestName;
            
            const dietaryInput = document.createElement('input');
            dietaryInput.type = 'text';
            dietaryInput.className = 'edit-guest-dietary-input';
            dietaryInput.placeholder = 'Dietary requirements (optional)';
            dietaryInput.name = `edit-dietary-${guestName}`;
            
            // Pre-fill dietary if existing
            if (existingGuest && existingGuest.dietary_requirements) {
                dietaryInput.value = existingGuest.dietary_requirements;
            }
            
            // Show dietary input if checkbox is checked
            if (checkbox.checked) {
                dietaryInput.style.display = 'block';
            }
            
            // Toggle dietary input visibility on checkbox change
            checkbox.addEventListener('change', () => {
                dietaryInput.style.display = checkbox.checked ? 'block' : 'none';
                if (!checkbox.checked) {
                    dietaryInput.value = '';
                }
            });
            
            item.appendChild(checkbox);
            item.appendChild(label);
            item.appendChild(dietaryInput);
            container.appendChild(item);
        });
    }
    
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
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error || 'Failed to delete RSVP');
            error.response = { status: response.status, statusText: response.statusText };
            throw error;
        }
        
        await loadData();
        showNotification('RSVP deleted successfully', 'success');
    } catch (error) {
        const requestUrl = `${API_BASE_URL}/api/delete-rsvp?pin=${encodeURIComponent(rsvp.pin)}&submitted_at=${encodeURIComponent(rsvp.submitted_at || '')}`;
        logError('Deleting RSVP', error, {
            pin: rsvp.pin,
            submittedAt: rsvp.submitted_at,
            requestUrl,
            requestMethod: 'DELETE',
            responseStatus: error.response?.status,
            responseStatusText: error.response?.statusText
        });
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

// Add Guest Name Input
function addGuestNameInput(name = '') {
    const container = document.getElementById('guest-names-container');
    if (!container) return;
    
    const nameIndex = container.children.length;
    const nameDiv = document.createElement('div');
    nameDiv.className = 'guest-name-input-group';
    nameDiv.style.display = 'flex';
    nameDiv.style.gap = '0.5rem';
    nameDiv.style.marginBottom = '0.5rem';
    nameDiv.style.alignItems = 'center';
    nameDiv.innerHTML = `
        <input type="text" class="guest-name-input" value="${name}" placeholder="Enter name" style="flex: 1;">
        <button type="button" class="btn btn-danger" onclick="removeGuestNameInput(this)" style="padding: 0.5rem 1rem; font-size: 0.7rem;">Remove</button>
    `;
    container.appendChild(nameDiv);
}

// Remove Guest Name Input
function removeGuestNameInput(button) {
    const container = document.getElementById('guest-names-container');
    if (!container) return;
    
    const nameDiv = button.parentElement;
    container.removeChild(nameDiv);
    
    // Ensure at least one input remains
    if (container.children.length === 0) {
        addGuestNameInput();
    }
}

// Open Add Guest Modal
function openAddGuestModal() {
    const title = document.getElementById('guest-modal-title');
    const form = document.getElementById('guest-form');
    const indexInput = document.getElementById('edit-guest-index');
    const pinInput = document.getElementById('guest-pin');
    const namesContainer = document.getElementById('guest-names-container');
    const modal = document.getElementById('guest-modal');
    
    if (!title || !form || !indexInput || !pinInput || !namesContainer || !modal) return;
    
    title.textContent = 'Add Guest';
    form.reset();
    indexInput.value = '';
    
    // Auto-generate a unique PIN
    try {
        const uniquePin = generateUniquePin();
        pinInput.value = uniquePin;
    } catch (error) {
        logError('Generating unique PIN', error, {
            maxAttempts: 100
        });
        showNotification('Error generating PIN. Please enter manually.', 'error');
    }
    
    // Clear and add one empty name input
    namesContainer.innerHTML = '';
    addGuestNameInput();
    
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
    const namesContainer = document.getElementById('guest-names-container');
    const modal = document.getElementById('guest-modal');
    
    if (!title || !indexInput || !pinInput || !nameInput || !roleInput || !namesContainer || !modal) return;
    
    title.textContent = 'Edit Guest';
    indexInput.value = actualIndex;
    pinInput.value = guest.pin || '';
    nameInput.value = guest.name || '';
    roleInput.value = guest.role || '';
    
    // Populate guest names
    namesContainer.innerHTML = '';
    const guestNames = guest.guest_names || [];
    
    // Handle migration: if no guest_names but has max_guests, create placeholder names
    if (guestNames.length === 0 && guest.max_guests) {
        const maxGuests = parseInt(guest.max_guests) || 1;
        for (let i = 1; i <= maxGuests; i++) {
            addGuestNameInput(`Guest ${i}`);
        }
    } else if (guestNames.length === 0) {
        addGuestNameInput();
    } else {
        guestNames.forEach(name => {
            addGuestNameInput(name);
        });
    }
    
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
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error || 'Failed to delete guest');
            error.response = { status: response.status, statusText: response.statusText };
            throw error;
        }
        
        await loadData();
        showNotification('Guest deleted successfully', 'success');
    } catch (error) {
        const requestUrl = `${API_BASE_URL}/api/delete-guest?pin=${encodeURIComponent(guest.pin)}`;
        logError('Deleting guest', error, {
            pin: guest.pin,
            name: guest.name,
            requestUrl,
            requestMethod: 'DELETE',
            responseStatus: error.response?.status,
            responseStatusText: error.response?.statusText
        });
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
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error || 'Failed to save RSVP');
            error.response = { status: response.status, statusText: response.statusText };
            throw error;
        }
        
        showNotification('RSVP updated successfully!', 'success');
    } catch (error) {
        const requestUrl = `${API_BASE_URL}/api/save-rsvp`;
        const requestBody = {
            rsvpData: rsvpsData[editIndex]
        };
        logError('Saving RSVP', error, {
            pin: rsvpData.pin,
            requestUrl,
            requestMethod: 'POST',
            requestBody: JSON.stringify(requestBody),
            responseStatus: error.response?.status,
            responseStatusText: error.response?.statusText
        });
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
        
        // Collect guest names from dynamic inputs
        const nameInputs = document.querySelectorAll('.guest-name-input');
        const guestNames = Array.from(nameInputs)
            .map(input => input.value.trim())
            .filter(name => name !== '');
        
        if (!pin || !name || !role) {
            throw new Error('PIN, name, and role are required');
        }
        
        if (guestNames.length === 0) {
            throw new Error('At least one guest name is required');
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
            guest_names: guestNames
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
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error || 'Failed to save guest');
            error.response = { status: response.status, statusText: response.statusText };
            throw error;
        }
        
        const result = await response.json();
        console.log('Guest saved successfully:', result);
        
        // Success notification will be shown by the form submit handler
    } catch (error) {
        const requestUrl = `${API_BASE_URL}/api/save-guest`;
        const requestBody = {
            guestData: guestData,
            isUpdate: index !== ''
        };
        logError('Saving guest', error, {
            pin: guestData.pin,
            name: guestData.name,
            requestUrl,
            requestMethod: 'POST',
            requestBody: JSON.stringify(requestBody),
            responseStatus: error.response?.status,
            responseStatusText: error.response?.statusText
        });
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

// Export to CSV (summary - one row per RSVP)
function exportCSV() {
    const headers = ['Name', 'PIN', 'Attending', 'Guests', 'Coach Needed', 'Message', 'Submitted'];
    const rows = rsvpsData.map(rsvp => {
        // Get guest names (handle both old and new format)
        let guestNamesText = '-';
        if (rsvp.attending === 'yes') {
            if (rsvp.attending_guests && Array.isArray(rsvp.attending_guests) && rsvp.attending_guests.length > 0) {
                guestNamesText = rsvp.attending_guests.map(g => g.name).join(', ');
            } else if (rsvp.guests_count) {
                guestNamesText = `${rsvp.guests_count} guest(s)`;
            }
        }
        
        return [
            rsvp.name || '',
            rsvp.pin || '',
            rsvp.attending || '',
            guestNamesText,
            rsvp.coach_needed || 'no',
            rsvp.message || '',
            rsvp.submitted_at || ''
        ];
    });
    
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    try {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rsvps-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('CSV exported successfully', 'success');
    } catch (error) {
        logError('Exporting CSV', error, {
            rowCount: rows.length
        });
        showNotification('Error exporting CSV. Please try again.', 'error');
    }
}

// Export to CSV Full (one row per attending person)
function exportCSVFull() {
    const headers = ['Invite Name', 'PIN', 'Attending Person Name', 'Dietary Requirements', 'Coach Needed', 'Message', 'Submitted'];
    const rows = [];
    
    rsvpsData.forEach(rsvp => {
        if (rsvp.attending === 'yes') {
            if (rsvp.attending_guests && Array.isArray(rsvp.attending_guests) && rsvp.attending_guests.length > 0) {
                // New format: one row per attending guest
                rsvp.attending_guests.forEach(guest => {
                    rows.push([
                        rsvp.name || '',
                        rsvp.pin || '',
                        guest.name || '',
                        guest.dietary_requirements || '',
                        rsvp.coach_needed || 'no',
                        rsvp.message || '',
                        rsvp.submitted_at || ''
                    ]);
                });
            } else if (rsvp.guests_count) {
                // Old format: create rows from count
                const count = parseInt(rsvp.guests_count) || 0;
                for (let i = 1; i <= count; i++) {
                    rows.push([
                        rsvp.name || '',
                        rsvp.pin || '',
                        `Guest ${i}`,
                        rsvp.dietary_requirements || '',
                        rsvp.coach_needed || 'no',
                        rsvp.message || '',
                        rsvp.submitted_at || ''
                    ]);
                }
            }
        }
    });
    
    if (rows.length === 0) {
        showNotification('No attending guests to export', 'warning');
        return;
    }
    
    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    try {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rsvps-full-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showNotification('CSV exported successfully', 'success');
    } catch (error) {
        logError('Exporting CSV Full', error, {
            rowCount: rows.length
        });
        showNotification('Error exporting CSV. Please try again.', 'error');
    }
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
                <button class="btn" onclick="openEditFaqModal(${index})" style="padding: 0.5rem 1rem; font-size: 0.7rem;">Edit</button>
                <button class="btn btn-danger" onclick="deleteFaq(${index})" style="padding: 0.5rem 1rem; font-size: 0.7rem;">Delete</button>
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
    
    const faq = faqsData[index];
    faqsData.splice(index, 1);
    
    try {
        await saveFaqs();
        await loadData();
        showNotification('FAQ deleted successfully', 'success');
    } catch (error) {
        logError('Deleting FAQ', error, {
            faqId: faq?.id,
            faqIndex: index,
            requestUrl: `${API_BASE_URL}/api/save-faqs`,
            requestMethod: 'POST'
        });
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
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error || 'Failed to save FAQs');
            error.response = { status: response.status, statusText: response.statusText };
            throw error;
        }
        
        showNotification('FAQs saved successfully!', 'success');
    } catch (error) {
        const requestUrl = `${API_BASE_URL}/api/save-faqs`;
        const requestBody = {
            faqsData: faqsData
        };
        logError('Saving FAQs', error, {
            faqCount: faqsData.length,
            requestUrl,
            requestMethod: 'POST',
            requestBody: JSON.stringify(requestBody),
            responseStatus: error.response?.status,
            responseStatusText: error.response?.statusText
        });
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

