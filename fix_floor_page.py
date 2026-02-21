import re

# Read the file
with open('frontend/src/pages/FloorPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old function
old_function = """    const handleTableClick = (table) => {
        if (table.status === 'available') {
            // Navigate to POS register with this table
            toast.info('Opening POS for ' + table.name);
            // TODO: Navigate to /register with table ID
        }
    };"""

# Define the new function
new_function = """    const handleTableClick = async (table) => {
        if (table.status === 'available') {
            try {
                await api.put(`/tables/${table.id}`, { status: 'occupied' });
                sessionStorage.setItem('selectedTable', JSON.stringify({ id: table.id, name: table.name, capacity: table.capacity }));
                queryClient.invalidateQueries(['tables']);
                window.location.href = '/register';
                toast.success(`Opening POS for ${table.name}`);
            } catch (error) {
                toast.error('Failed to select table');
            }
        } else {
            toast.info(`${table.name} is currently ${table.status}`);
        }
    };"""

# Replace
content = content.replace(old_function, new_function)

# Write back
with open('frontend/src/pages/FloorPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ FloorPage.jsx updated successfully!")
print("✅ handleTableClick function now:")
print("  - Updates table status to 'occupied'")
print("  - Stores table info in sessionStorage")
print("  - Navigates to /register")
print("  - Shows success/error toasts")
