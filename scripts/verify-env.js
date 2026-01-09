require('dotenv').config();

const privateKey = process.env.FIREBASE_PRIVATE_KEY;

console.log('--- Environment Verification ---');

if (!privateKey) {
  console.error('❌ FIREBASE_PRIVATE_KEY is missing/undefined in process.env');
  process.exit(1);
}

console.log(`Key length: ${privateKey.length}`);
console.log(`First 10 chars: "${privateKey.substring(0, 10)}..."`);
console.log(`Last 10 chars: "...${privateKey.slice(-10)}"`);

if (privateKey.includes('\\n')) {
  console.log('⚠️  Key contains literal "\\n" characters. NestJS config handles this, but verify they are ensuring line breaks.');
} else if (privateKey.includes('\n')) {
     console.log('✅  Key contains actual newline characters.');
} else {
    console.log('❌  Key has NO newlines (literal or actual). It must be multiline.');
}

const formattedKey = privateKey.replace(/\\n/g, '\n');

if (!formattedKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error('❌  Key DOES NOT start with "-----BEGIN PRIVATE KEY-----"');
}

if (!formattedKey.endsWith('-----END PRIVATE KEY-----') && !formattedKey.trim().endsWith('-----END PRIVATE KEY-----')) {
     console.error('❌  Key DOES NOT end with "-----END PRIVATE KEY-----"');
}

try {
    const admin = require('firebase-admin');
    console.log('Attempting to create credential object...');
    admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'test',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'test@test.com',
        privateKey: formattedKey
    });
    console.log('✅ Credential object created successfully!');
} catch (e) {
    console.error('❌  Failed to create credential:', e.message);
}
