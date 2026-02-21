import re

# Read the file
with open('frontend/src/pages/RegisterPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add selectedTable state after notes state
old_state = "    const [notes, setNotes] = useState('');"
new_state = """    const [notes, setNotes] = useState('');
    const [selectedTable, setSelectedTable] = useState(null);

    // Load selected table from sessionStorage
    useEffect(() => {
        const tableData = sessionStorage.getItem('selectedTable');
        if (tableData) {
            setSelectedTable(JSON.parse(tableData));
        }
    }, []);"""

content = content.replace(old_state, new_state)

# Update cart header to show table info
old_header = """                    <div className="cart-header">
                        <h3>Current Order</h3>
                        <ShoppingCart size={20} />
                    </div>"""

new_header = """                    <div className="cart-header">
                        {selectedTable && (
                            <div className="table-badge">
                                <strong>{selectedTable.name}</strong>
                                <span>{selectedTable.capacity} seats</span>
                            </div>
                        )}
                        <h3>Current Order</h3>
                        <ShoppingCart size={20} />
                    </div>"""

content = content.replace(old_header, new_header)

# Write back
with open('frontend/src/pages/RegisterPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("RegisterPage.jsx updated successfully!")
print("- Added selectedTable state")
print("- Added useEffect to load table from sessionStorage")
print("- Added table display in cart header")
