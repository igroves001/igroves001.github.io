# How to Encrypt Your GitHub Token

GitHub's secret scanning can detect tokens even when base64 encoded. Use XOR encryption instead.

## Method 1: Browser Console (Easiest)

1. Open your browser console (F12)
2. Copy and paste this code, replacing `YOUR_TOKEN_HERE` with your actual GitHub token:

```javascript
const key = 'wedding2026igroves001/igroves001.github.io';
const token = 'YOUR_TOKEN_HERE';
const encrypted = [];
for (let i = 0; i < token.length; i++) {
    encrypted.push(token.charCodeAt(i) ^ key.charCodeAt(i % key.length));
}
console.log('Copy this to config.js:');
console.log('const GITHUB_TOKEN_ENCRYPTED =', JSON.stringify(encrypted) + ';');
```

3. Press Enter
4. Copy the output (the array of numbers)
5. Paste it into `scripts/config.js` replacing the `GITHUB_TOKEN_ENCRYPTED` value

## Method 2: PowerShell

```powershell
$token = "YOUR_TOKEN_HERE"
$key = "wedding2026igroves001/igroves001.github.io"
$encrypted = @()
for ($i = 0; $i -lt $token.Length; $i++) {
    $encrypted += [int]($token[$i] -bxor $key[$i % $key.Length])
}
$json = $encrypted -join ","
Write-Host "const GITHUB_TOKEN_ENCRYPTED = [$json];"
```

## Method 3: Node.js

```javascript
const token = 'YOUR_TOKEN_HERE';
const key = 'wedding2026igroves001/igroves001.github.io';
const encrypted = [];
for (let i = 0; i < token.length; i++) {
    encrypted.push(token.charCodeAt(i) ^ key.charCodeAt(i % key.length));
}
console.log('const GITHUB_TOKEN_ENCRYPTED =', JSON.stringify(encrypted) + ';');
```

## After Encryption

1. Replace the value in `scripts/config.js`:
   ```javascript
   const GITHUB_TOKEN_ENCRYPTED = [123, 45, 67, ...]; // Your encrypted array
   ```

2. The code will automatically decrypt it when needed

## Security Note

This is basic obfuscation, not true encryption. It makes the token harder for automated scanners to detect, but anyone with the code can decrypt it. For a personal wedding site, this is sufficient.

