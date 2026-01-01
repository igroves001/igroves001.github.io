// GitHub API Configuration
// Token is encrypted using XOR cipher - decrypt it before use
const GITHUB_TOKEN_ENCRYPTED = [16,12,16,12,28,12,56,66,81,70,105,88,86,51,43,66,51,41,6,113,1,96,48,84,25,53,15,13,31,3,126,9,94,56,38,50,32,62,39,109,5,23,56,81,50,21,0,27,1,124,104,5,122,42,87,4,4,48,48,63,124,101,126,120,38,6,28,3,68,49,37,117,104,107,73,48,0,61,46,36,81,118,90,33,51,34,12,55,10,22,36,69,72];
const GITHUB_REPO = 'igroves001/igroves001.github.io';
const GITHUB_OWNER = 'igroves001';

// Simple XOR decryption function
function decryptToken(encrypted, key) {
    return encrypted.map((byte, i) => String.fromCharCode(byte ^ key.charCodeAt(i % key.length))).join('');
}

// Decrypt the token (using a simple key)
const ENCRYPTION_KEY = 'wedding2026' + GITHUB_REPO; // Key based on wedding date + repo
const GITHUB_TOKEN = decryptToken(GITHUB_TOKEN_ENCRYPTED, ENCRYPTION_KEY);

// Admin password (simple client-side check)
const ADMIN_PASSWORD = 'wedding2026';

