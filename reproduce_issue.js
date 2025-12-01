import { nanoid } from 'nanoid';

const API_URL = 'https://heberge-rapide.vercel.app/api/v1/auth';
const TEST_EMAIL = `test_${nanoid(5)}@example.com`;
const TEST_PASSWORD = 'password123';

async function testAuth() {
    console.log(`Testing with email: ${TEST_EMAIL}`);

    // 1. Register
    console.log('1. Registering...');
    const regRes = await fetch(`${API_URL}?action=register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test User',
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        })
    });

    const regData = await regRes.json();
    console.log('Registration response:', regRes.status, regData);

    if (!regRes.ok) {
        console.error('Registration failed!');
        return;
    }

    // 2. Login
    console.log('2. Logging in...');
    const loginRes = await fetch(`${API_URL}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        })
    });

    const loginData = await loginRes.json();
    console.log('Login response:', loginRes.status, loginData);

    if (loginRes.ok) {
        console.log('SUCCESS: Login worked!');
    } else {
        console.error('FAILURE: Login failed!');
    }
}

testAuth();
