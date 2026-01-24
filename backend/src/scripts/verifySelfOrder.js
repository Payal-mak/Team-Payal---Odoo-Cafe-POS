import axios from 'axios';

const verifySelfOrder = async () => {
    try {
        console.log('1. Logging in as Admin...');
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@cafe.com',
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        console.log('Admin logged in.');

        console.log('2. Generating Token for Table 1...');
        const genRes = await axios.post('http://localhost:3000/api/tables/1/token', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const selfOrderToken = genRes.data.data.token;
        console.log('Token Generated:', selfOrderToken);

        console.log('3. Verifying Public Access (No Auth)...');
        const publicRes = await axios.get(`http://localhost:3000/api/tables/public/by-token/${selfOrderToken}`);

        console.log('Public Access Verification Sucessful!');
        console.log('Table Info:', publicRes.data.data.table);

        console.log('\n--- SUCCESS ---');
        console.log(`Visit: http://localhost:5173/menu/${selfOrderToken}`);

    } catch (error) {
        console.error('Verification Failed:', error.response ? error.response.data : error.message);
    }
};

verifySelfOrder();
