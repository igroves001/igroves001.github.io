// Admin Panel Functionality

let rsvpsData = [];
let guestsData = [];
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
        document.getElementById('password-screen').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        loadData();
    } else {
        error.style.display = 'block';
        document.getElementById('password-input').value = '';
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Test token on load (for debugging - remove in production if desired)
    if (GITHUB_TOKEN && GITHUB_TOKEN !== 'YOUR_GITHUB_TOKEN_HERE') {
        testToken().then(valid => {
            if (!valid) {
                console.warn('GitHub token validation failed. Check token permissions.');
            }
        });
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
    
    const guestForm = document.getElementById('guest-form');
    if (guestForm) {
        guestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const index = document.getElementById('edit-guest-index').value;
            const pin = document.getElementById('guest-pin').value.trim();
            const name = document.getElementById('guest-name').value.trim();
            const hasRoom = document.querySelector('#guest-form input[name="has_room"]:checked').value === 'true';
            
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
            
            // Check for duplicate PIN (unless editing)
            if (index === '' && guestsData.find(g => g.pin === pin)) {
                showNotification('A guest with this PIN already exists', 'error');
                return;
            }
            
            const guestData = {
                pin: pin,
                name: name,
                has_room: hasRoom
            };
            
            if (index === '') {
                guestsData.push(guestData);
            } else {
                guestsData[parseInt(index)] = guestData;
            }
            
            try {
                await saveGuests();
                closeModal('guest-modal');
                await loadData();
            } catch (error) {
                // Error already shown by saveGuests
            }
        });
    }
});

// Load all data
async function loadData() {
    showLoading(true);
    try {
        await Promise.all([loadRsvps(), loadGuests()]);
        displayRsvps();
        displayGuests();
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
        const response = await fetch('data/rsvps.json');
        
        if (!response.ok) {
            if (response.status === 404) {
                // File doesn't exist yet - that's okay, start with empty array
                rsvpsData = [];
                filteredRsvps = [];
                return;
            }
            throw new Error(`Failed to load RSVPs: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        const data = text.trim() === '' ? [] : JSON.parse(text);
        
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
        if (error instanceof SyntaxError) {
            showNotification('Error parsing RSVPs data. File may be corrupted.', 'error');
            console.error('JSON parse error:', error);
        } else {
            showNotification('Error loading RSVPs. Please check your connection.', 'error');
            console.error('Error loading RSVPs:', error);
        }
        rsvpsData = [];
        filteredRsvps = [];
    }
}

// Load Guests
async function loadGuests() {
    try {
        const response = await fetch('data/guests.json');
        
        if (!response.ok) {
            if (response.status === 404) {
                // File doesn't exist yet - that's okay, start with empty array
                guestsData = [];
                filteredGuests = [];
                return;
            }
            throw new Error(`Failed to load guests: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        const data = text.trim() === '' ? [] : JSON.parse(text);
        
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
        if (error instanceof SyntaxError) {
            showNotification('Error parsing guests data. File may be corrupted.', 'error');
            console.error('JSON parse error:', error);
        } else {
            showNotification('Error loading guests. Please check your connection.', 'error');
            console.error('Error loading guests:', error);
        }
        guestsData = [];
        filteredGuests = [];
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
    
    filteredGuests.forEach((guest, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${guest.pin || ''}</td>
            <td>${guest.name || ''}</td>
            <td>${guest.has_room ? 'Yes' : 'No'}</td>
            <td class="actions">
                <button class="btn" onclick="openEditGuestModal(${index})">Edit</button>
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
    document.getElementById(`${tab}-tab`).classList.add('active');
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


// Delete RSVP
async function deleteRsvp(index) {
    if (index < 0 || index >= filteredRsvps.length) {
        showNotification('Invalid RSVP selection', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this RSVP?')) return;
    
    const rsvp = filteredRsvps[index];
    const actualIndex = rsvpsData.findIndex(r => r.pin === rsvp.pin && r.submitted_at === rsvp.submitted_at);
    
    if (actualIndex === -1) {
        showNotification('RSVP not found', 'error');
        return;
    }
    
    rsvpsData.splice(actualIndex, 1);
    
    try {
        await saveRsvps();
        await loadData();
        showNotification('RSVP deleted successfully', 'success');
    } catch (error) {
        // Error already shown by saveRsvps
        // Restore the data since save failed
        rsvpsData.splice(actualIndex, 0, rsvp);
    }
}

// Open Add Guest Modal
function openAddGuestModal() {
    const title = document.getElementById('guest-modal-title');
    const form = document.getElementById('guest-form');
    const indexInput = document.getElementById('edit-guest-index');
    const roomNo = document.getElementById('guest-room-no');
    const modal = document.getElementById('guest-modal');
    
    if (!title || !form || !indexInput || !roomNo || !modal) return;
    
    title.textContent = 'Add Guest';
    form.reset();
    indexInput.value = '';
    roomNo.checked = true;
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
    const roomYes = document.getElementById('guest-room-yes');
    const roomNo = document.getElementById('guest-room-no');
    const modal = document.getElementById('guest-modal');
    
    if (!title || !indexInput || !pinInput || !nameInput || !roomYes || !roomNo || !modal) return;
    
    title.textContent = 'Edit Guest';
    indexInput.value = actualIndex;
    pinInput.value = guest.pin || '';
    nameInput.value = guest.name || '';
    roomYes.checked = guest.has_room;
    roomNo.checked = !guest.has_room;
    
    modal.style.display = 'block';
}


// Delete Guest
async function deleteGuest(index) {
    if (index < 0 || index >= filteredGuests.length) {
        showNotification('Invalid guest selection', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this guest?')) return;
    
    const guest = filteredGuests[index];
    const actualIndex = guestsData.findIndex(g => g.pin === guest.pin);
    
    if (actualIndex === -1) {
        showNotification('Guest not found', 'error');
        return;
    }
    
    guestsData.splice(actualIndex, 1);
    
    try {
        await saveGuests();
        await loadData();
        showNotification('Guest deleted successfully', 'success');
    } catch (error) {
        // Error already shown by saveGuests
        // Restore the data since save failed
        guestsData.splice(actualIndex, 0, guest);
    }
}

// Get authorization header (supports both classic and fine-grained tokens)
function getAuthHeader() {
    if (!GITHUB_TOKEN || GITHUB_TOKEN === 'YOUR_GITHUB_TOKEN_HERE') {
        return null;
    }
    
    // Log partial token for debugging (first 15 chars + last 4 chars)
    const tokenPreview = GITHUB_TOKEN.length > 19 
        ? `${GITHUB_TOKEN.substring(0, 15)}...${GITHUB_TOKEN.substring(GITHUB_TOKEN.length - 4)}`
        : `${GITHUB_TOKEN.substring(0, 10)}...`;
    console.log('Using GitHub token:', tokenPreview, `(length: ${GITHUB_TOKEN.length})`);
    
    // Fine-grained tokens start with github_pat_, use Bearer
    // Classic tokens use token prefix
    const authType = GITHUB_TOKEN.startsWith('github_pat_') ? 'Bearer' : 'token';
    const authHeader = `${authType} ${GITHUB_TOKEN}`;
    console.log('Authorization header format:', authType, `(header preview: ${authType} ${tokenPreview})`);
    
    return authHeader;
}

// Test token permissions (for debugging)
async function testToken() {
    const authHeader = getAuthHeader();
    if (!authHeader) {
        console.error('No token configured');
        return false;
    }
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (response.ok) {
            console.log('Token is valid and has repository access');
            return true;
        } else {
            const error = await response.json();
            console.error('Token test failed:', response.status, error);
            return false;
        }
    } catch (error) {
        console.error('Token test error:', error);
        return false;
    }
}

// Save RSVPs to GitHub
async function saveRsvps() {
    try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
            showNotification('GitHub token not configured. Please set it in scripts/config.js', 'error');
            return;
        }
        
        // Get current file
        const fileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/rsvps.json`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        let sha = null;
        if (fileResponse.ok) {
            const file = await fileResponse.json();
            sha = file.sha;
        } else if (fileResponse.status === 404) {
            // File doesn't exist yet - that's okay, we'll create it
            sha = null;
        } else {
            let errorMessage = `GitHub API error: ${fileResponse.status}`;
            try {
                const error = await fileResponse.json();
                errorMessage = error.message || errorMessage;
                if (fileResponse.status === 401) {
                    errorMessage = 'Unauthorized. Please check: 1) Token is correct, 2) Token has "Contents: Read and Write" permission, 3) Token is scoped to this repository';
                }
            } catch (e) {
                // Couldn't parse error response
            }
            throw new Error(errorMessage);
        }
        
        // Update file
        const updateResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/rsvps.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Updated RSVPs from admin panel',
                    content: btoa(JSON.stringify(rsvpsData, null, 2)),
                    sha: sha
                })
            }
        );
        
        if (!updateResponse.ok) {
            let errorMessage = `Failed to save: ${updateResponse.status}`;
            try {
                const error = await updateResponse.json();
                errorMessage = error.message || errorMessage;
                if (updateResponse.status === 401) {
                    errorMessage = 'Unauthorized. Please check: 1) Token is correct, 2) Token has "Contents: Read and Write" permission, 3) Token is scoped to this repository';
                }
            } catch (e) {
                // Couldn't parse error response
            }
            throw new Error(errorMessage);
        }
        
        showNotification('RSVPs saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving RSVPs:', error);
        showNotification(error.message || 'Error saving RSVPs. Please check your token configuration.', 'error');
        throw error; // Re-throw so caller knows it failed
    }
}

// Save Guests to GitHub
async function saveGuests() {
    try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
            showNotification('GitHub token not configured. Please set it in scripts/config.js', 'error');
            return;
        }
        
        // Get current file
        const fileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/guests.json`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        let sha = null;
        if (fileResponse.ok) {
            const file = await fileResponse.json();
            sha = file.sha;
        } else if (fileResponse.status === 404) {
            // File doesn't exist yet - that's okay, we'll create it
            sha = null;
        } else {
            let errorMessage = `GitHub API error: ${fileResponse.status}`;
            try {
                const error = await fileResponse.json();
                errorMessage = error.message || errorMessage;
                if (fileResponse.status === 401) {
                    errorMessage = 'Unauthorized. Please check: 1) Token is correct, 2) Token has "Contents: Read and Write" permission, 3) Token is scoped to this repository';
                }
            } catch (e) {
                // Couldn't parse error response
            }
            throw new Error(errorMessage);
        }
        
        // Update file
        const updateResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/guests.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Updated guests from admin panel',
                    content: btoa(JSON.stringify(guestsData, null, 2)),
                    sha: sha
                })
            }
        );
        
        if (!updateResponse.ok) {
            let errorMessage = `Failed to save: ${updateResponse.status}`;
            try {
                const error = await updateResponse.json();
                errorMessage = error.message || errorMessage;
                if (updateResponse.status === 401) {
                    errorMessage = 'Unauthorized. Please check: 1) Token is correct, 2) Token has "Contents: Read and Write" permission, 3) Token is scoped to this repository';
                }
            } catch (e) {
                // Couldn't parse error response
            }
            throw new Error(errorMessage);
        }
        
        showNotification('Guests saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving guests:', error);
        showNotification(error.message || 'Error saving guests. Please check your token configuration.', 'error');
        throw error; // Re-throw so caller knows it failed
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

