
const fetch = require('node-fetch');

async function testLogin() {
    try {
        const res = await fetch('http://localhost:5000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'test' })
        });
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', data);
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

testLogin();
