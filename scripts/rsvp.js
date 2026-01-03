// RSVP PIN Validation and Form Handling

// Get API base URL (set from config.js)
const API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) 
    ? window.API_BASE_URL 
    : (typeof window !== 'undefined' ? window.location.origin : '');

let guestsData = [];
let currentGuest = null;
let roleConfig = null;
let faqsData = [];
let rsvpsData = [];
let existingRsvp = null;

// Load guests data
async function loadGuests() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/get-guests`);
        if (response.ok) {
            guestsData = await response.json();
        } else {
            console.error('Error loading guests:', response.status);
            guestsData = [];
        }
    } catch (error) {
        console.error('Error loading guests:', error);
        guestsData = [];
    }
}

// Load RSVPs
async function loadRsvps() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/get-rsvps`);
        if (response.ok) {
            rsvpsData = await response.json();
        } else {
            console.error('Error loading RSVPs:', response.status);
            rsvpsData = [];
        }
    } catch (error) {
        console.error('Error loading RSVPs:', error);
        rsvpsData = [];
    }
}

// Load FAQs
async function loadFaqs() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/get-faqs`);
        if (response.ok) {
            faqsData = await response.json();
            // Sort by order
            faqsData.sort((a, b) => (a.order || 0) - (b.order || 0));
            renderFaqs();
        } else {
            console.error('Error loading FAQs:', response.status);
            faqsData = [];
        }
    } catch (error) {
        console.error('Error loading FAQs:', error);
        faqsData = [];
    }
}

// Render FAQs dynamically
function renderFaqs() {
    const container = document.getElementById('faq-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!faqsData || faqsData.length === 0) {
        return;
    }
    
    faqsData.forEach(faq => {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.setAttribute('data-faq', faq.id);
        
        const questionButton = document.createElement('button');
        questionButton.className = 'faq-question';
        questionButton.setAttribute('aria-expanded', 'false');
        questionButton.innerHTML = `
            <span>${faq.question || ''}</span>
            <span class="faq-icon">+</span>
        `;
        
        const answerDiv = document.createElement('div');
        answerDiv.className = 'faq-answer';
        
        // Add answer text if present
        if (faq.answer) {
            const answerP = document.createElement('p');
            if (faq.buttons && faq.buttons.length > 0) {
                answerP.style.marginBottom = '1.5rem';
            }
            answerP.textContent = faq.answer;
            answerDiv.appendChild(answerP);
        }
        
        // Add buttons/links if present
        if (faq.buttons && faq.buttons.length > 0) {
            const linksContainer = document.createElement('div');
            linksContainer.className = 'faq-links-container';
            if (faq.largeMargin) {
                linksContainer.classList.add('large-margin');
            }
            
            faq.buttons.forEach(button => {
                if (button.type === 'link' && button.url && button.text) {
                    const link = document.createElement('a');
                    link.href = button.url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.className = 'map-link faq-link';
                    link.textContent = button.text;
                    linksContainer.appendChild(link);
                }
            });
            
            answerDiv.appendChild(linksContainer);
        }
        
        // Add info boxes if present
        if (faq.infoBoxes && faq.infoBoxes.length > 0) {
            const linksContainer = document.createElement('div');
            linksContainer.className = 'faq-links-container';
            
            faq.infoBoxes.forEach(box => {
                const infoBox = document.createElement('div');
                infoBox.className = 'info-box';
                infoBox.innerHTML = box.text;
                linksContainer.appendChild(infoBox);
            });
            
            answerDiv.appendChild(linksContainer);
        }
        
        faqItem.appendChild(questionButton);
        faqItem.appendChild(answerDiv);
        container.appendChild(faqItem);
    });
    
    // Re-attach FAQ click handlers
    attachFaqHandlers();
}

// Attach FAQ click handlers
function attachFaqHandlers() {
    document.querySelectorAll('.faq-question').forEach(button => {
        // Remove existing listeners by cloning
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', () => {
            const faqItem = newButton.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all other FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });
            
            // Toggle current item
            if (!isActive) {
                faqItem.classList.add('active');
                newButton.setAttribute('aria-expanded', 'true');
            }
        });
    });
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
                    carriages: { day_guest_staying: false, day_guest_not_staying: true, evening_guest: true },
                    taxi: { day_guest_staying: false, day_guest_not_staying: true, evening_guest: true },
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

    // Apply FAQ question visibility based on FAQs data
    const faqItems = document.querySelectorAll('[data-faq]');
    faqItems.forEach(faqItem => {
        const faqId = faqItem.getAttribute('data-faq');
        const faq = faqsData.find(f => f.id === faqId);
        
        if (faq && faq.roles && faq.roles[role] === false) {
            faqItem.style.display = 'none';
        } else {
            faqItem.style.display = '';
        }
    });

    // Update navigation visibility
    updateNavigationVisibility(role);

    // Hide coach option for day_guest_staying (they're staying, so no need for coach)
    const coachFormGroup = document.getElementById('coach-form-group');
    if (coachFormGroup) {
        if (role === 'day_guest_staying') {
            coachFormGroup.style.display = 'none';
        } else {
            coachFormGroup.style.display = '';
        }
    }
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
        
        // Log the guest login to audit trail
        try {
            await fetch(`${API_BASE_URL}/api/log-guest-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pin: pin })
            });
            // Don't wait for response or show errors - just log silently
        } catch (error) {
            // Silently fail - don't interrupt the login process
            console.error('Error logging guest login:', error);
        }
        
        // Ensure role config is loaded before applying visibility
        if (!roleConfig) {
            await loadRoleConfig();
        }
        
        // Check for existing RSVP
        existingRsvp = rsvpsData.find(r => r.pin === pin);
        
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
    
    // Show existing RSVP message if applicable
    const existingRsvpMessage = document.getElementById('existing-rsvp-message');
    if (existingRsvp && existingRsvp.submitted_at) {
        const submittedDate = new Date(existingRsvp.submitted_at);
        const dateStr = submittedDate.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        const timeStr = submittedDate.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        existingRsvpMessage.style.display = 'block';
        existingRsvpMessage.innerHTML = `You have already submitted your RSVP on <strong>${dateStr} at ${timeStr}</strong>. Your previous responses are shown below. You can update them if needed.`;
    } else {
        existingRsvpMessage.style.display = 'none';
    }
    
    // Show room allocation message if applicable
    const roomMessage = document.getElementById('room-message');
    if (currentGuest.has_room) {
        roomMessage.style.display = 'block';
        roomMessage.textContent = 'You have been allocated a room at the venue.';
    } else {
        roomMessage.style.display = 'none';
    }
    
    // Generate guest attendance checkboxes
    const container = document.getElementById('guest-attendance-container');
    if (container) {
        container.innerHTML = '';
        
        // Get guest names (handle migration from max_guests)
        let guestNames = currentGuest.guest_names || [];
        if (guestNames.length === 0 && currentGuest.max_guests) {
            // Migration: create placeholder names
            const maxGuests = parseInt(currentGuest.max_guests) || 1;
            guestNames = [];
            for (let i = 1; i <= maxGuests; i++) {
                guestNames.push(`Guest ${i}`);
            }
        }
        
        if (guestNames.length === 0) {
            guestNames = ['Guest'];
        }
        
        // Get existing RSVP attending guests (handle both old and new format)
        let existingAttendingGuests = [];
        if (existingRsvp) {
            if (existingRsvp.attending_guests && Array.isArray(existingRsvp.attending_guests)) {
                // New format
                existingAttendingGuests = existingRsvp.attending_guests;
            } else if (existingRsvp.guests_count && existingRsvp.attending === 'yes') {
                // Old format migration: create attending guests from count
                const count = parseInt(existingRsvp.guests_count) || 0;
                for (let i = 0; i < count && i < guestNames.length; i++) {
                    existingAttendingGuests.push({
                        name: guestNames[i],
                        dietary_requirements: existingRsvp.dietary_requirements || ''
                    });
                }
            }
        }
        
        // Create checkbox for each guest name
        guestNames.forEach((guestName, index) => {
            const item = document.createElement('div');
            item.className = 'guest-attendance-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `guest-checkbox-${index}`;
            checkbox.name = 'attending-guests';
            checkbox.value = guestName;
            
            // Check if this guest was previously marked as attending
            const existingGuest = existingAttendingGuests.find(g => g.name === guestName);
            if (existingGuest) {
                checkbox.checked = true;
            }
            
            const label = document.createElement('label');
            label.className = 'guest-name-label';
            label.htmlFor = `guest-checkbox-${index}`;
            label.textContent = guestName;
            
            const dietaryInput = document.createElement('input');
            dietaryInput.type = 'text';
            dietaryInput.className = 'guest-dietary-input';
            dietaryInput.placeholder = 'Dietary requirements (optional)';
            dietaryInput.name = `dietary-${guestName}`;
            
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
    
    // Pre-fill form with existing RSVP data if available
    if (existingRsvp) {
        // Pre-fill attending
        if (existingRsvp.attending === 'yes') {
            document.getElementById('attending-yes').checked = true;
        } else if (existingRsvp.attending === 'no') {
            document.getElementById('attending-no').checked = true;
        }
        
        // Pre-fill coach
        if (existingRsvp.coach_needed === 'yes') {
            document.getElementById('coach-yes').checked = true;
        } else if (existingRsvp.coach_needed === 'no') {
            document.getElementById('coach-no').checked = true;
        }
        
        // Pre-fill message
        if (existingRsvp.message) {
            document.getElementById('message').value = existingRsvp.message;
        }
        
        // Update submit button text
        const submitBtn = document.getElementById('rsvp-submit-btn');
        if (submitBtn) {
            submitBtn.textContent = 'Update RSVP';
        }
    } else {
        // Update submit button text for new RSVP
        const submitBtn = document.getElementById('rsvp-submit-btn');
        if (submitBtn) {
            submitBtn.textContent = 'Send RSVP';
        }
    }
}

// Submit RSVP
async function submitRsvp(event) {
    event.preventDefault();
    
    const attending = document.querySelector('input[name="attending"]:checked')?.value || '';
    
    // Validate required fields
    if (!attending) {
        alert('Please indicate if you will be attending');
        return;
    }
    
    // Collect attending guests with their dietary requirements
    const attendingGuests = [];
    if (attending === 'yes') {
        const checkboxes = document.querySelectorAll('input[name="attending-guests"]:checked');
        if (checkboxes.length === 0) {
            alert('Please select at least one person who will be attending');
            return;
        }
        
        checkboxes.forEach(checkbox => {
            const guestName = checkbox.value;
            // Find the dietary input by finding the parent item and then the input within it
            const item = checkbox.closest('.guest-attendance-item');
            const dietaryInput = item ? item.querySelector('.guest-dietary-input') : null;
            const dietaryRequirements = dietaryInput ? dietaryInput.value.trim() : '';
            
            attendingGuests.push({
                name: guestName,
                dietary_requirements: dietaryRequirements
            });
        });
    }
    
    const formData = {
        pin: currentGuest.pin,
        name: currentGuest.name,
        attending: attending,
        attending_guests: attendingGuests,
        coach_needed: document.querySelector('input[name="coach"]:checked')?.value || 'no',
        message: document.getElementById('message').value || '',
        submitted_at: new Date().toISOString()
    };
    
    const submitBtn = document.getElementById('rsvp-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = existingRsvp ? 'Updating...' : 'Submitting...';
    
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
        
        // Reload RSVPs to get updated data
        await loadRsvps();
        
        // Update existingRsvp reference after successful submission
        existingRsvp = rsvpsData.find(r => r.pin === currentGuest.pin);
        
        document.getElementById('rsvp-success').style.display = 'block';
        document.getElementById('rsvp-form-container').style.display = 'none';
        document.getElementById('rsvp-form').reset();
        // Clear dynamically generated guest attendance container
        const container = document.getElementById('guest-attendance-container');
        if (container) {
            container.innerHTML = '';
        }
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        alert('Sorry, there was an error submitting your RSVP. Please try again later.');
    } finally {
        submitBtn.disabled = false;
        // Update existingRsvp reference after submission attempt
        existingRsvp = rsvpsData.find(r => r.pin === currentGuest.pin);
        submitBtn.textContent = existingRsvp ? 'Update RSVP' : 'Send RSVP';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadGuests();
    await loadRoleConfig();
    await loadFaqs();
    await loadRsvps();
    checkUrlPin();
    
    // PIN modal handlers
    const pinInput = document.getElementById('pin-input');
    if (pinInput) {
        // Auto-submit when 4 digits are entered
        pinInput.addEventListener('input', async (e) => {
            const value = e.target.value.trim();
            // Only allow numbers
            if (!/^\d*$/.test(value)) {
                e.target.value = value.replace(/\D/g, '');
                return;
            }
            // Auto-submit when 4 digits are entered
            if (value.length === 4) {
                await validatePin();
            }
        });
        
        pinInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await validatePin();
            }
            // Only allow numbers
            if (!/[0-9]/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
            }
        });
    }
    // Prevent non-numeric input
    document.getElementById('pin-input').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
    
    // RSVP form handler
    document.getElementById('rsvp-form').addEventListener('submit', submitRsvp);
});

