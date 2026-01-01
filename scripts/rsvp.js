// RSVP PIN Validation and Form Handling

let guestsData = [];
let currentGuest = null;

// Load guests data
async function loadGuests() {
    try {
        const response = await fetch('data/guests.json');
        guestsData = await response.json();
    } catch (error) {
        console.error('Error loading guests:', error);
    }
}

// Check for PIN in URL
function checkUrlPin() {
    const urlParams = new URLSearchParams(window.location.search);
    const pin = urlParams.get('pin');
    if (pin) {
        document.getElementById('pin-input').value = pin;
        validatePin();
    }
}

// Validate PIN
function validatePin() {
    const pin = document.getElementById('pin-input').value.trim();
    const errorMsg = document.getElementById('pin-error');
    
    if (!pin) {
        errorMsg.textContent = 'Please enter your PIN';
        errorMsg.style.display = 'block';
        return;
    }
    
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        errorMsg.textContent = 'PIN must be 4 digits';
        errorMsg.style.display = 'block';
        return;
    }
    
    currentGuest = guestsData.find(g => g.pin === pin);
    
    if (currentGuest) {
        errorMsg.style.display = 'none';
        showRsvpForm();
    } else {
        errorMsg.textContent = 'Invalid PIN. Please check and try again.';
        errorMsg.style.display = 'block';
    }
}

// Show RSVP form
function showRsvpForm() {
    document.getElementById('pin-modal').style.display = 'none';
    document.getElementById('rsvp-form-container').style.display = 'block';
    
    // Pre-fill name
    document.getElementById('guest-name-display').textContent = currentGuest.name;
    
    // Show room allocation message if applicable
    const roomMessage = document.getElementById('room-message');
    if (currentGuest.has_room) {
        roomMessage.style.display = 'block';
        roomMessage.textContent = 'You have been allocated a room at the venue.';
    } else {
        roomMessage.style.display = 'none';
    }
    
    // Scroll to form
    document.getElementById('rsvp').scrollIntoView({ behavior: 'smooth' });
}

// Submit RSVP
async function submitRsvp(event) {
    event.preventDefault();
    
    const formData = {
        pin: currentGuest.pin,
        name: currentGuest.name,
        attending: document.querySelector('input[name="attending"]:checked')?.value || '',
        guests_count: document.getElementById('guests').value || 0,
        dietary_requirements: document.getElementById('dietary').value || '',
        coach_needed: document.querySelector('input[name="coach"]:checked')?.value || 'no',
        message: document.getElementById('message').value || '',
        submitted_at: new Date().toISOString()
    };
    
    // Validate required fields
    if (!formData.attending) {
        alert('Please indicate if you will be attending');
        return;
    }
    
    if (formData.attending === 'yes' && !formData.guests_count) {
        alert('Please select number of guests');
        return;
    }
    
    const submitBtn = document.getElementById('rsvp-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    try {
        // Get authorization header (supports both classic and fine-grained tokens)
        const authType = GITHUB_TOKEN.startsWith('github_pat_') ? 'Bearer' : 'token';
        const authHeader = `${authType} ${GITHUB_TOKEN}`;
        
        // Log partial token for debugging
        const tokenPreview = GITHUB_TOKEN.length > 19 
            ? `${GITHUB_TOKEN.substring(0, 15)}...${GITHUB_TOKEN.substring(GITHUB_TOKEN.length - 4)}`
            : `${GITHUB_TOKEN.substring(0, 10)}...`;
        console.log('RSVP Submission - Using GitHub token:', tokenPreview, `(length: ${GITHUB_TOKEN.length}, type: ${authType})`);
        
        // Get current RSVPs from GitHub
        const fileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/rsvps.json`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        let currentRsvps = [];
        let sha = null;
        
        if (fileResponse.ok) {
            const file = await fileResponse.json();
            currentRsvps = JSON.parse(atob(file.content.replace(/\s/g, '')));
            sha = file.sha;
        }
        
        // Check if RSVP already exists for this PIN
        const existingIndex = currentRsvps.findIndex(r => r.pin === formData.pin);
        if (existingIndex !== -1) {
            // Update existing RSVP
            currentRsvps[existingIndex] = formData;
        } else {
            // Add new RSVP
            currentRsvps.push(formData);
        }
        
        // Write back to GitHub
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
                    message: existingIndex !== -1 ? 'Updated RSVP' : 'New RSVP submission',
                    content: btoa(JSON.stringify(currentRsvps, null, 2)),
                    sha: sha
                })
            }
        );
        
        if (updateResponse.ok) {
            document.getElementById('rsvp-success').style.display = 'block';
            document.getElementById('rsvp-form-container').style.display = 'none';
            document.getElementById('rsvp-form').reset();
        } else {
            const error = await updateResponse.json();
            throw new Error(error.message || 'Failed to submit RSVP');
        }
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        alert('Sorry, there was an error submitting your RSVP. Please try again later.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send RSVP';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadGuests();
    checkUrlPin();
    
    // PIN modal handlers
    document.getElementById('pin-submit-btn').addEventListener('click', validatePin);
    document.getElementById('pin-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validatePin();
        }
        // Only allow numbers
        if (!/[0-9]/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Delete') {
            e.preventDefault();
        }
    });
    // Prevent non-numeric input
    document.getElementById('pin-input').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    
    // RSVP form handler
    document.getElementById('rsvp-form').addEventListener('submit', submitRsvp);
});

