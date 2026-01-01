// RSVP PIN Validation and Form Handling

// Get API base URL (set from config.js)
const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) 
    ? window.API_BASE_URL 
    : (typeof window !== 'undefined' ? window.location.origin : '');

let guestsData = [];
let currentGuest = null;
let roleConfig = null;

// Load guests data
async function loadGuests() {
    try {
        const response = await fetch('data/guests.json');
        guestsData = await response.json();
    } catch (error) {
        console.error('Error loading guests:', error);
    }
}

// Load role configuration
async function loadRoleConfig() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/get-role-config`);
        if (response.ok) {
            roleConfig = await response.json();
        } else {
            console.error('Error loading role config:', response.status);
            // Use default config if API fails
            roleConfig = {
                sections: {
                    intro: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    venue: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    dresscode: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    schedule: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    faq: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    rsvp: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true }
                },
                faqQuestions: {
                    parking: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: false },
                    accommodation: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: false },
                    carriages: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    taxi: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    gifts: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    children: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true }
                }
            };
        }
    } catch (error) {
        console.error('Error loading role config:', error);
        // Use default config on error
        roleConfig = {
            sections: {
                intro: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                venue: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                dresscode: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                schedule: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                faq: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                rsvp: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true }
            },
            faqQuestions: {
                parking: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: false },
                accommodation: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: false },
                carriages: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                taxi: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                gifts: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                children: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true }
            }
        };
    }
}

// Apply role-based visibility rules
function applyRoleVisibility() {
    if (!currentGuest || !currentGuest.role || !roleConfig) {
        return;
    }

    const role = currentGuest.role;

    // Apply section visibility
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(section => {
        const sectionId = section.getAttribute('data-section');
        const sectionConfig = roleConfig.sections[sectionId];
        
        if (sectionConfig && sectionConfig[role] === false) {
            section.style.display = 'none';
        } else {
            section.style.display = '';
        }
    });

    // Apply FAQ question visibility
    const faqItems = document.querySelectorAll('[data-faq]');
    faqItems.forEach(faqItem => {
        const faqId = faqItem.getAttribute('data-faq');
        const faqConfig = roleConfig.faqQuestions[faqId];
        
        if (faqConfig && faqConfig[role] === false) {
            faqItem.style.display = 'none';
        } else {
            faqItem.style.display = '';
        }
    });

    // Update navigation visibility
    updateNavigationVisibility(role);
}

// Update navigation links based on role
function updateNavigationVisibility(role) {
    const navLinks = document.querySelectorAll('nav a[data-nav]');
    navLinks.forEach(link => {
        const sectionId = link.getAttribute('data-nav');
        const sectionConfig = roleConfig.sections[sectionId];
        const separator = link.nextElementSibling;
        
        if (sectionConfig && sectionConfig[role] === false) {
            link.style.display = 'none';
            // Hide separator if it exists
            if (separator && separator.classList.contains('separator')) {
                separator.style.display = 'none';
            }
        } else {
            link.style.display = '';
            // Show separator if it exists
            if (separator && separator.classList.contains('separator')) {
                separator.style.display = '';
            }
        }
    });
}

// Check for PIN in URL
async function checkUrlPin() {
    const urlParams = new URLSearchParams(window.location.search);
    const pin = urlParams.get('pin');
    if (pin) {
        document.getElementById('pin-input').value = pin;
        await validatePin();
    }
}

// Validate PIN
async function validatePin() {
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
        // Ensure role config is loaded before applying visibility
        if (!roleConfig) {
            await loadRoleConfig();
        }
        applyRoleVisibility();
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
        // Call Vercel API to save RSVP
        const response = await fetch(`${API_BASE_URL}/api/save-rsvp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rsvpData: formData
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit RSVP');
        }
        
        const result = await response.json();
        document.getElementById('rsvp-success').style.display = 'block';
        document.getElementById('rsvp-form-container').style.display = 'none';
        document.getElementById('rsvp-form').reset();
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
    await loadRoleConfig();
    checkUrlPin();
    
    // PIN modal handlers
    document.getElementById('pin-submit-btn').addEventListener('click', async () => {
        await validatePin();
    });
    document.getElementById('pin-input').addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            await validatePin();
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

