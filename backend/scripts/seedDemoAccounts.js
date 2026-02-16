const bcrypt = require('bcryptjs');
const { promisePool } = require('../config/database');

async function seedDemoAccounts() {
    try {
        console.log('🌱 Seeding demo accounts...\n');

        const demoAccounts = [
            {
                name: 'Admin User',
                email: 'admin@cafe.com',
                password: 'admin123',
                role: 'admin'
            },
            {
                name: 'Cashier User',
                email: 'cashier@cafe.com',
                password: 'cashier123',
                role: 'cashier'
            },
            {
                name: 'Kitchen Staff',
                email: 'kitchen@cafe.com',
                password: 'kitchen123',
                role: 'kitchen_staff'
            }
        ];

        for (const account of demoAccounts) {
            // Check if user already exists
            const [existingUsers] = await promisePool.query(
                'SELECT id FROM users WHERE email = ?',
                [account.email]
            );

            if (existingUsers.length > 0) {
                console.log(`⏭️  ${account.role} account already exists (${account.email})`);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(account.password, 10);

            // Insert user
            await promisePool.query(
                'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
                [account.name, account.email, hashedPassword, account.role]
            );

            console.log(`✅ Created ${account.role} account: ${account.email} / ${account.password}`);
        }

        console.log('\n✨ Demo accounts seeding completed!\n');
        console.log('You can now login with:');
        console.log('  Admin:   admin@cafe.com / admin123');
        console.log('  Cashier: cashier@cafe.com / cashier123');
        console.log('  Kitchen: kitchen@cafe.com / kitchen123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding demo accounts:', error.message);
        console.error(error);
        process.exit(1);
    }
}

seedDemoAccounts();
