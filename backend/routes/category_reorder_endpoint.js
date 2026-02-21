// Backend API endpoint for category reordering
// Add this to backend/routes/categories.js

router.put('/reorder', async (req, res) => {
    try {
        const { categories } = req.body;

        // Update display_order for each category
        for (const cat of categories) {
            await pool.query(
                'UPDATE categories SET display_order = ? WHERE id = ?',
                [cat.display_order, cat.id]
            );
        }

        res.json({
            success: true,
            message: 'Category order updated'
        });
    } catch (error) {
        console.error('Error reordering categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reorder categories'
        });
    }
});
