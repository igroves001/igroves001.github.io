// Utility script to encrypt a GitHub token
// Run this in browser console or Node.js

function encryptToken(token, key) {
    const encrypted = [];
    for (let i = 0; i < token.length; i++) {
        encrypted.push(token.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return encrypted;
}

// Usage - paste this in browser console:
// const key = 'wedding2026igroves001/igroves001.github.io';
// const token = 'YOUR_GITHUB_TOKEN_HERE';
// const encrypted = encryptToken(token, key);
// console.log('Copy this to config.js:');
// console.log('const GITHUB_TOKEN_ENCRYPTED =', JSON.stringify(encrypted) + ';');

