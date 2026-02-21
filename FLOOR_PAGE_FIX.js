// MANUAL FIX FOR FloorPage.jsx
// Replace the handleTableClick function (lines 77-83) with this code:

const handleTableClick = async (table) => {
    if (table.status === 'available') {
        try {
            // Update table status to occupied
            await api.put(`/tables/${table.id}`, { status: 'occupied' });

            // Store table info in sessionStorage for RegisterPage
            sessionStorage.setItem('selectedTable', JSON.stringify({
                id: table.id,
                name: table.name,
                capacity: table.capacity
            }));

            // Invalidate tables query to refresh UI
            queryClient.invalidateQueries(['tables']);

            // Navigate to POS register
            window.location.href = '/register';

            toast.success(`Opening POS for ${table.name}`);
        } catch (error) {
            toast.error('Failed to select table');
        }
    } else {
        toast.info(`${table.name} is currently ${table.status}`);
    }
};
