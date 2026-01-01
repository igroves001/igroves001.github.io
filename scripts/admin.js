// Admin Panel Functionality

let rsvpsData = [];
let guestsData = [];
let filteredRsvps = [];
let filteredGuests = [];

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

// Allow Enter key for password
document.getElementById('password-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkPassword();
    }
});

// Load all data
async function loadData() {
    await Promise.all([loadRsvps(), loadGuests()]);
    displayRsvps();
    displayGuests();
    updateStats();
}

// Load RSVPs
async function loadRsvps() {
    try {
        const response = await fetch('data/rsvps.json');
        rsvpsData = await response.json();
        filteredRsvps = [...rsvpsData];
    } catch (error) {
        console.error('Error loading RSVPs:', error);
        rsvpsData = [];
        filteredRsvps = [];
    }
}

// Load Guests
async function loadGuests() {
    try {
        const response = await fetch('data/guests.json');
        guestsData = await response.json();
        filteredGuests = [...guestsData];
    } catch (error) {
        console.error('Error loading guests:', error);
        guestsData = [];
        filteredGuests = [];
    }
}

// Display RSVPs
function displayRsvps() {
    const tbody = document.getElementById('rsvp-tbody');
    tbody.innerHTML = '';
    
    if (filteredRsvps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No RSVPs found</td></tr>';
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
    tbody.innerHTML = '';
    
    if (filteredGuests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">No guests found</td></tr>';
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
    const search = document.getElementById('rsvp-search').value.toLowerCase();
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
    const search = document.getElementById('guest-search').value.toLowerCase();
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
    const rsvp = filteredRsvps[index];
    const actualIndex = rsvpsData.findIndex(r => r.pin === rsvp.pin && r.submitted_at === rsvp.submitted_at);
    
    document.getElementById('edit-rsvp-index').value = actualIndex;
    document.getElementById('edit-attending-yes').checked = rsvp.attending === 'yes';
    document.getElementById('edit-attending-no').checked = rsvp.attending === 'no';
    document.getElementById('edit-guests').value = rsvp.guests_count || '';
    document.getElementById('edit-dietary').value = rsvp.dietary_requirements || '';
    document.getElementById('edit-coach-yes').checked = rsvp.coach_needed === 'yes';
    document.getElementById('edit-coach-no').checked = rsvp.coach_needed !== 'yes';
    document.getElementById('edit-message').value = rsvp.message || '';
    
    document.getElementById('edit-rsvp-modal').style.display = 'block';
}

// Save RSVP Edit
document.getElementById('edit-rsvp-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const index = parseInt(document.getElementById('edit-rsvp-index').value);
    
    rsvpsData[index] = {
        ...rsvpsData[index],
        attending: document.querySelector('#edit-rsvp-form input[name="attending"]:checked').value,
        guests_count: document.getElementById('edit-guests').value,
        dietary_requirements: document.getElementById('edit-dietary').value,
        coach_needed: document.querySelector('#edit-rsvp-form input[name="coach"]:checked')?.value || 'no',
        message: document.getElementById('edit-message').value
    };
    
    await saveRsvps();
    closeModal('edit-rsvp-modal');
    loadData();
});

// Delete RSVP
async function deleteRsvp(index) {
    if (!confirm('Are you sure you want to delete this RSVP?')) return;
    
    const rsvp = filteredRsvps[index];
    const actualIndex = rsvpsData.findIndex(r => r.pin === rsvp.pin && r.submitted_at === rsvp.submitted_at);
    rsvpsData.splice(actualIndex, 1);
    
    await saveRsvps();
    loadData();
}

// Open Add Guest Modal
function openAddGuestModal() {
    document.getElementById('guest-modal-title').textContent = 'Add Guest';
    document.getElementById('guest-form').reset();
    document.getElementById('edit-guest-index').value = '';
    document.getElementById('guest-room-no').checked = true;
    document.getElementById('guest-modal').style.display = 'block';
}

// Open Edit Guest Modal
function openEditGuestModal(index) {
    const guest = filteredGuests[index];
    const actualIndex = guestsData.findIndex(g => g.pin === guest.pin);
    
    document.getElementById('guest-modal-title').textContent = 'Edit Guest';
    document.getElementById('edit-guest-index').value = actualIndex;
    document.getElementById('guest-pin').value = guest.pin;
    document.getElementById('guest-name').value = guest.name;
    document.getElementById('guest-room-yes').checked = guest.has_room;
    document.getElementById('guest-room-no').checked = !guest.has_room;
    
    document.getElementById('guest-modal').style.display = 'block';
}

// Save Guest
document.getElementById('guest-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const index = document.getElementById('edit-guest-index').value;
    const pin = document.getElementById('guest-pin').value.trim();
    const name = document.getElementById('guest-name').value.trim();
    const hasRoom = document.querySelector('#guest-form input[name="has_room"]:checked').value === 'true';
    
    // Check for duplicate PIN (unless editing)
    if (index === '' && guestsData.find(g => g.pin === pin)) {
        alert('A guest with this PIN already exists');
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
    
    await saveGuests();
    closeModal('guest-modal');
    loadData();
});

// Delete Guest
async function deleteGuest(index) {
    if (!confirm('Are you sure you want to delete this guest?')) return;
    
    const guest = filteredGuests[index];
    const actualIndex = guestsData.findIndex(g => g.pin === guest.pin);
    guestsData.splice(actualIndex, 1);
    
    await saveGuests();
    loadData();
}

// Save RSVPs to GitHub
async function saveRsvps() {
    try {
        // Get current file
        const fileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/rsvps.json`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        let sha = null;
        if (fileResponse.ok) {
            const file = await fileResponse.json();
            sha = file.sha;
        }
        
        // Update file
        await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/rsvps.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
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
    } catch (error) {
        console.error('Error saving RSVPs:', error);
        alert('Error saving RSVPs. Please try again.');
    }
}

// Save Guests to GitHub
async function saveGuests() {
    try {
        // Get current file
        const fileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/guests.json`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        let sha = null;
        if (fileResponse.ok) {
            const file = await fileResponse.json();
            sha = file.sha;
        }
        
        // Update file
        await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/guests.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
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
    } catch (error) {
        console.error('Error saving guests:', error);
        alert('Error saving guests. Please try again.');
    }
}

// Close Modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
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
function refreshData() {
    loadData();
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

