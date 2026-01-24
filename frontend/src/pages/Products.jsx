import { useState, useEffect } from 'react';
import { inventoryAPI } from '../services/api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        price: '',
        unit: 'unit',
        tax_rate: 0, // Default 0% tax
        description: '',
        is_kitchen_sent: true,
        variants: []
    });

    // Variant Input State
    const [variantInput, setVariantInput] = useState({
        attribute_name: '',
        value: '',
        extra_price: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                inventoryAPI.getProducts(),
                inventoryAPI.getCategories()
            ]);
            setProducts(prodRes.data.data.products);
            setCategories(catRes.data.data.categories);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch data');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addVariant = () => {
        if (variantInput.attribute_name && variantInput.value) {
            setFormData(prev => ({
                ...prev,
                variants: [...prev.variants, { ...variantInput }]
            }));
            setVariantInput({
                attribute_name: '',
                value: '',
                extra_price: 0
            });
        }
    };

    const removeVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                tax_rate: parseFloat(formData.tax_rate),
                category_id: formData.category_id || null
            };

            if (editingProduct) {
                await inventoryAPI.updateProduct(editingProduct.id, payload);
            } else {
                await inventoryAPI.createProduct(payload);
            }
            setIsModalOpen(false);
            fetchData();
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await inventoryAPI.deleteProduct(id);
                fetchData();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete product');
            }
        }
    };

    const openEditModal = async (product) => {
        try {
            // Fetch full details including variants
            const response = await inventoryAPI.getProduct(product.id);
            const fullProduct = response.data.data.product;

            setEditingProduct(fullProduct);
            setFormData({
                name: fullProduct.name,
                category_id: fullProduct.category_id || '',
                price: fullProduct.price,
                unit: fullProduct.unit,
                tax_rate: fullProduct.tax_rate,
                description: fullProduct.description || '',
                is_kitchen_sent: fullProduct.is_kitchen_sent === 1,
                variants: fullProduct.variants || []
            });
            setIsModalOpen(true);
        } catch (err) {
            alert('Failed to fetch product details');
        }
    };

    const openAddModal = () => {
        setEditingProduct(null);
        resetForm();
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category_id: '',
            price: '',
            unit: 'unit',
            tax_rate: 0,
            description: '',
            is_kitchen_sent: true,
            variants: []
        });
        setVariantInput({
            attribute_name: '',
            value: '',
            extra_price: 0
        });
        setError(null);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-display font-bold text-espresso-900">
                    Product Management
                </h1>
                <button onClick={openAddModal} className="btn-primary">
                    + Add Product
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-cream-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-espresso-700 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-espresso-700 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-espresso-700 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-espresso-700 uppercase tracking-wider">Unit</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-espresso-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-200">
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-espresso-900">{product.name}</div>
                                        {product.description && (
                                            <div className="text-xs text-espresso-500">{product.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {product.category_name ? (
                                            <span
                                                className="px-2 py-1 text-xs rounded-full text-white"
                                                style={{ backgroundColor: product.category_color || '#8b6940' }}
                                            >
                                                {product.category_name}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-espresso-800">
                                        ${parseFloat(product.price).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-espresso-800">
                                        {product.unit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="text-coffee-600 hover:text-coffee-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingProduct ? 'Edit Product' : 'Add Product'}
                        </h2>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-espresso-800 mb-1">Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-espresso-800 mb-1">Category</label>
                                    <select
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleInputChange}
                                        className="input-field"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-espresso-800 mb-1">Price</label>
                                    <input
                                        type="number"
                                        name="price"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-espresso-800 mb-1">Unit</label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        className="input-field"
                                    >
                                        <option value="unit">Unit (Default)</option>
                                        <option value="kg">Kg</option>
                                        <option value="litre">Litre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-espresso-800 mb-1">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        name="tax_rate"
                                        step="0.1"
                                        value={formData.tax_rate}
                                        onChange={handleInputChange}
                                        className="input-field"
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <input
                                        type="checkbox"
                                        name="is_kitchen_sent"
                                        checked={formData.is_kitchen_sent}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-coffee-600 focus:ring-coffee-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-espresso-900">
                                        Send to Kitchen
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-espresso-800 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="2"
                                    className="input-field"
                                />
                            </div>

                            {/* Variants Section */}
                            <div className="border-t border-cream-200 pt-4">
                                <h3 className="text-lg font-semibold text-espresso-900 mb-3">Variants</h3>

                                {/* Variant List */}
                                <div className="bg-cream-50 rounded p-3 mb-3 space-y-2">
                                    {formData.variants.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No variants added yet.</p>
                                    ) : (
                                        formData.variants.map((variant, index) => (
                                            <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-cream-200 shadow-sm">
                                                <div className="text-sm">
                                                    <span className="font-medium">{variant.attribute_name}:</span> {variant.value}
                                                    {parseFloat(variant.extra_price) > 0 && (
                                                        <span className="text-green-600 ml-2">(+${variant.extra_price})</span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariant(index)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Add Variant Form */}
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Attribute (e.g. Size)"
                                        value={variantInput.attribute_name}
                                        onChange={(e) => setVariantInput({ ...variantInput, attribute_name: e.target.value })}
                                        className="input-field text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Value (e.g. Large)"
                                        value={variantInput.value}
                                        onChange={(e) => setVariantInput({ ...variantInput, value: e.target.value })}
                                        className="input-field text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Extra Price"
                                            step="0.01"
                                            value={variantInput.extra_price}
                                            onChange={(e) => setVariantInput({ ...variantInput, extra_price: parseFloat(e.target.value) || 0 })}
                                            className="input-field text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={addVariant}
                                            className="btn-secondary px-3 py-1 text-sm whitespace-nowrap"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
