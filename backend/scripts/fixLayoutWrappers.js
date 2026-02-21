const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../../frontend/src/pages');
const pages = [
    'FloorPage.jsx',
    'RegisterPage.jsx',
    'KitchenPage.jsx',
    'ProductsPage.jsx',
    'OrdersPage.jsx',
    'CustomersPage.jsx',
    'ReportsPage.jsx'
];

pages.forEach(page => {
    const filePath = path.join(pagesDir, page);
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove Layout import
    content = content.replace(/import Layout from ['"]\.\.\/components\/layout\/Layout['"];\r?\n/g, '');

    // Remove <Layout> opening tags
    content = content.replace(/\s*<Layout>\r?\n/g, '\n');

    // Remove </Layout> closing tags  
    content = content.replace(/\s*<\/Layout>\r?\n/g, '\n');
    content = content.replace(/\s*<\/Layout\s*>\r?\n/g, '\n');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${page}`);
});

console.log('\n🎉 All pages fixed!');
