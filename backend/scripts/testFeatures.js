const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';

// Test authentication
const testAuth = async () => {
    console.log('\n🔐 Testing Authentication...');
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@odoo.com',
            password: 'password123'
        });
        authToken = response.data.token;
        console.log('✅ Login successful');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
};

// Test floor creation
const testFloorCreation = async () => {
    console.log('\n🏢 Testing Floor Creation...');
    try {
        const response = await axios.post(
            `${API_URL}/floors`,
            { name: 'Test Floor' },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('✅ Floor created successfully:', response.data.data);
        return response.data.data.id;
    } catch (error) {
        console.error('❌ Floor creation failed:', error.response?.data || error.message);
        return null;
    }
};

// Test table creation
const testTableCreation = async (floorId) => {
    console.log('\n🪑 Testing Table Creation...');
    try {
        const response = await axios.post(
            `${API_URL}/tables`,
            {
                floor_id: floorId,
                table_number: 99,
                seats: 4,
                status: 'available'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('✅ Table created successfully:', response.data.data);
        return response.data.data.id;
    } catch (error) {
        console.error('❌ Table creation failed:', error.response?.data || error.message);
        return null;
    }
};

// Test product creation
const testProductCreation = async () => {
    console.log('\n🍕 Testing Product Creation...');
    try {
        const response = await axios.post(
            `${API_URL}/products`,
            {
                name: 'Test Product',
                category_id: 1,
                price: 99.99,
                unit: 'Unit',
                tax_percentage: 5.00,
                description: 'Test product description'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('✅ Product created successfully:', response.data.data);
        return response.data.data.id;
    } catch (error) {
        console.error('❌ Product creation failed:', error.response?.data || error.message);
        return null;
    }
};

// Test customer creation
const testCustomerCreation = async () => {
    console.log('\n👤 Testing Customer Creation...');
    try {
        const response = await axios.post(
            `${API_URL}/customers`,
            {
                name: 'Test Customer',
                phone: '1234567890',
                email: 'test@example.com'
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        console.log('✅ Customer created successfully:', response.data.data);
        return response.data.data.id;
    } catch (error) {
        console.error('❌ Customer creation failed:', error.response?.data || error.message);
        return null;
    }
};

// Test fetching data
const testDataFetching = async () => {
    console.log('\n📊 Testing Data Fetching...');

    const endpoints = [
        { name: 'Products', url: '/products' },
        { name: 'Categories', url: '/categories' },
        { name: 'Floors', url: '/floors' },
        { name: 'Tables', url: '/tables' },
        { name: 'Customers', url: '/customers' },
        { name: 'Terminals', url: '/terminals' }
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${API_URL}${endpoint.url}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log(`✅ ${endpoint.name}: ${response.data.count || response.data.data?.length || 0} items`);
        } catch (error) {
            console.error(`❌ ${endpoint.name} fetch failed:`, error.response?.data || error.message);
        }
    }
};

// Run all tests
const runTests = async () => {
    console.log('🚀 Starting API Feature Tests...\n');
    console.log('Make sure the backend server is running on http://localhost:5000\n');

    const authSuccess = await testAuth();
    if (!authSuccess) {
        console.log('\n❌ Authentication failed. Cannot proceed with other tests.');
        return;
    }

    await testDataFetching();

    const floorId = await testFloorCreation();
    if (floorId) {
        await testTableCreation(floorId);
    }

    await testProductCreation();
    await testCustomerCreation();

    console.log('\n✅ All tests completed!\n');
};

runTests().catch(console.error);
