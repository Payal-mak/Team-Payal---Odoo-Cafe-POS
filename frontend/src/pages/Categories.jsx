import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#8b6940',
        sequence: 0
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await inventoryAPI.getCategories();
            setCategories(response.data.data.categories);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch categories');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await inventoryAPI.updateCategory(editingCategory.id, formData);
            } else {
                await inventoryAPI.createCategory(formData);
            }
            setIsModalOpen(false);
            fetchCategories();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await inventoryAPI.deleteCategory(id);
                fetchCategories();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete category');
            }
        }
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            color: category.color,
            sequence: category.sequence
        });
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingCategory(null);
        resetForm();
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            color: '#8b6940',
            sequence: 0
        });
        setError(null);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-display font-bold text-espresso-900">
                    Category Management
                </h1>
                <button onClick={openAddModal} className="btn-primary">
                    + Add Category
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-cream-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-espresso-700 uppercase tracking-wider">
                                    Sequence
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-espresso-700 uppercase tracking-wider">
                                    Color
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-espresso-700 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-espresso-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-200">
                            {categories.map((category) => (
                                <tr key={category.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-espresso-800">
                                        {category.sequence}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div
                                            className="w-6 h-6 rounded border border-gray-200"
                                            style={{ backgroundColor: category.color }}
                                        ></div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-espresso-900">
                                        {category.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openEditModal(category)}
                                            className="text-coffee-600 hover:text-coffee-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">
                            {editingCategory ? 'Edit Category' : 'Add Category'}
                        </h2>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-espresso-800 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-espresso-800 mb-1">
                                    Color
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="h-10 w-20 p-1 border border-cream-300 rounded"
                                    />
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="input-field flex-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-espresso-800 mb-1">
                                    Sequence
                                </label>
                                <input
                                    type="number"
                                    value={formData.sequence}
                                    onChange={(e) => setFormData({ ...formData, sequence: parseInt(e.target.value) })}
                                    className="input-field"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
