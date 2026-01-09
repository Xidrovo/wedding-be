const fetch = require('node-fetch'); // NOTE: If this fails, user might need to install node-fetch or use native fetch in Node 18+

const BASE_URL = 'http://localhost:3000';

async function testCreate() {
  console.log('--- Testing POST /wedding-guests ---');
  try {
    const response = await fetch(`${BASE_URL}/wedding-guests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Guest ' + Date.now(),
        email: `test${Date.now()}@example.com`,
        plusOne: 'Test Plus One',
        confirmed: true
      })
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Created Guest:', data);
    return data.id;
  } catch (error) {
    console.error('Error creating guest:', error.message);
  }
}

async function testGetAll() {
  console.log('\n--- Testing GET /wedding-guests ---');
  try {
    const response = await fetch(`${BASE_URL}/wedding-guests`);
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Total Guests:', data.length);
    console.log('Guests:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error getting guests:', error.message);
  }
}

(async () => {
    // Check if server is reachable
    try {
        await fetch(BASE_URL);
    } catch (e) {
        console.error("❌ Could not connect to server at " + BASE_URL);
        console.error("👉 Make sure you actally ran 'npm run start:dev' in a separate terminal!");
        return;
    }

  const newId = await testCreate();
  if (newId) {
    await testGetAll();
    console.log('\n✅ Test complete. Check your Firestore Console "wedding_guest_list" collection to see the new document!');
    console.log(`Document ID: ${newId}`);
  }
})();
