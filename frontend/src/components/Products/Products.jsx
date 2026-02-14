import { useState, useEffect } from 'react';
import Header from '../Header/Header';
import './Products.css';

const COLORS = [
    '#e74c3c', '#e67e22', '#f39c12', '#f1c40f',
    '#2ecc71', '#1abc9c', '#3498db', '#9b59b6',
    '#34495e', '#95a5a6', '#d35400', '#c0392b'
];

const UNITS = ['Unit', 'KG', 'Litre', 'Gram', 'ML'];

const Products = ({ user, onLogout, onNavigate }) => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showProductModal, setShowProductModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [activeTab, setActiveTab] = useState('general'); // general, variants
    const [editingProduct, setEditingProduct] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState(null);

    const [productForm, setProductForm] = useState({
        name: '',
        category_id: '',
        price: '',
        unit: 'Unit',
        tax: '0',
        description: '',
        image: ''
    });

    const [variants, setVariants] = useState([]);

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        color: '#e67e22'
    });

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [searchTerm, selectedCategory]);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/categories', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = 'http://localhost:5000/api/products?';
            if (searchTerm) url += `search=${searchTerm}&`;
            if (selectedCategory) url += `category=${selectedCategory}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            const url = editingProduct
                ? `http://localhost:5000/api/products/${editingProduct.id}`
                : 'http://localhost:5000/api/products';

            const response = await fetch(url, {
                method: editingProduct ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...productForm,
                    variants: variants.filter(v => v.value && v.price)
                })
            });

            const data = await response.json();
            if (data.success) {
                setShowProductModal(false);
                resetProductForm();
                fetchProducts();
                setSuccessMessage(`✓ Product ${editingProduct ? 'updated' : 'created'} successfully!`);
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            setError('Failed to save product');
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            category_id: product.category_id,
            price: product.price,
            unit: product.unit,
            tax: product.tax,
            description: product.description || '',
            image: product.image || ''
        });
        setVariants(product.variants || []);
        setShowProductModal(true);
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Delete this product?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchProducts();
            setSuccessMessage('✓ Product deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5000/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(categoryForm)
            });

            setShowCategoryModal(false);
            setCategoryForm({ name: '', color: '#e67e22' });
            fetchCategories();
            setSuccessMessage('✓ Category created successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error creating category:', error);
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm('Delete this category?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchCategories();
            setSuccessMessage('✓ Category deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting category:', error);
        }
    };

    const addVariant = () => {
        setVariants([...variants, { attribute_name: 'Size', value: '', price: '', unit: 'Unit' }]);
    };

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const resetProductForm = () => {
        setProductForm({
            name: '',
            category_id: '',
            price: '',
            unit: 'Unit',
            tax: '0',
            description: '',
            image: ''
        });
        setVariants([]);
        setEditingProduct(null);
        setActiveTab('general');
    };

    return (
        <div className="products-container">
            <Header user={user} onLogout={onLogout} currentPage="products" onNavigate={onNavigate} />

            <main className="products-main">
                <div className="page-header">
                    <h2 className="page-title">Product Management</h2>
                    <p className="page-subtitle">Manage your menu items and categories</p>
                </div>

                {successMessage && (
                    <div className="success-message">
                        <span>{successMessage}</span>
                    </div>
                )}

                {/* Categories Section */}
                <div className="categories-section">
                    <div className="categories-header">
                        <h3>Categories</h3>
                        <button className="btn btn-outline" onClick={() => setShowCategoryModal(true)}>
                            ➕ New Category
                        </button>
                    </div>
                    <div className="categories-list">
                        {categories.map(category => (
                            <div
                                key={category.id}
                                className="category-chip"
                                style={{ backgroundColor: category.color }}
                            >
                                <span>{category.name}</span>
                                <div className="category-actions">
                                    <button
                                        className="category-action-btn"
                                        onClick={() => handleDeleteCategory(category.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="products-action-bar">
                    <div className="search-filter-group">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="🔍 Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="filter-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="action-buttons">
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                resetProductForm();
                                setShowProductModal(true);
                            }}
                        >
                            ➕ New Product
                        </button>
                    </div>
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner" style={{ width: '48px', height: '48px', border: '4px solid #e0e0e0', borderTopColor: 'var(--accent-orange)' }}></div>
                    </div>
                ) : products.length > 0 ? (
                    <div className="products-grid">
                        {products.map(product => (
                            <div key={product.id} className="product-card">
                                <div className="product-image">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} />
                                    ) : (
                                        '🍽️'
                                    )}
                                </div>
                                <div className="product-info">
                                    <span
                                        className="product-category"
                                        style={{ backgroundColor: product.category_color }}
                                    >
                                        {product.category_name}
                                    </span>
                                    <h3 className="product-name">{product.name}</h3>
                                    <div className="product-price">₹{product.price}</div>
                                    <div className="product-details">
                                        {product.unit} • Tax: {product.tax}%
                                    </div>
                                    {product.variants && product.variants.length > 0 && (
                                        <div className="product-details">
                                            {product.variants.length} variant(s)
                                        </div>
                                    )}
                                    <div className="product-actions">
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => handleEditProduct(product)}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => handleDeleteProduct(product.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-products">
                        <div className="empty-icon">🍽️</div>
                        <h3>No Products Yet</h3>
                        <p>Create your first product to get started</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                resetProductForm();
                                setShowProductModal(true);
                            }}
                        >
                            Create Product
                        </button>
                    </div>
                )}

                {/* Product Modal */}
                {showProductModal && (
                    <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
                        <div className="modal-content product-form-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    {editingProduct ? 'Edit Product' : 'Create New Product'}
                                </h3>
                            </div>

                            <div className="form-tabs">
                                <button
                                    className={`form-tab ${activeTab === 'general' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('general')}
                                >
                                    General Info
                                </button>
                                <button
                                    className={`form-tab ${activeTab === 'variants' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('variants')}
                                >
                                    Variants
                                </button>
                            </div>

                            <form onSubmit={handleCreateProduct}>
                                {activeTab === 'general' && (
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Product Name *</label>
                                            <input
                                                type="text"
                                                value={productForm.name}
                                                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Category *</label>
                                            <select
                                                value={productForm.category_id}
                                                onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Price *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={productForm.price}
                                                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Unit</label>
                                            <select
                                                value={productForm.unit}
                                                onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                                            >
                                                {UNITS.map(unit => (
                                                    <option key={unit} value={unit}>{unit}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Tax (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={productForm.tax}
                                                onChange={(e) => setProductForm({ ...productForm, tax: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Image URL</label>
                                            <input
                                                type="text"
                                                value={productForm.image}
                                                onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="form-group full">
                                            <label>Description</label>
                                            <textarea
                                                value={productForm.description}
                                                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'variants' && (
                                    <div className="variants-section">
                                        <h4>Product Variants</h4>
                                        {variants.map((variant, index) => (
                                            <div key={index} className="variant-item">
                                                <input
                                                    type="text"
                                                    placeholder="Variant name (e.g., Small, Medium)"
                                                    value={variant.value}
                                                    onChange={(e) => updateVariant(index, 'value', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Price"
                                                    value={variant.price}
                                                    onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                                />
                                                <select
                                                    value={variant.unit}
                                                    onChange={(e) => updateVariant(index, 'unit', e.target.value)}
                                                >
                                                    {UNITS.map(unit => (
                                                        <option key={unit} value={unit}>{unit}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="remove-variant-btn"
                                                    onClick={() => removeVariant(index)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            className="btn btn-outline add-variant-btn"
                                            onClick={addVariant}
                                        >
                                            ➕ Add Variant
                                        </button>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowProductModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingProduct ? 'Update Product' : 'Create Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Category Modal */}
                {showCategoryModal && (
                    <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Create New Category</h3>
                            </div>
                            <form onSubmit={handleCreateCategory}>
                                <div className="form-group">
                                    <label>Category Name</label>
                                    <input
                                        type="text"
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Color</label>
                                    <div className="color-picker-grid">
                                        {COLORS.map(color => (
                                            <div
                                                key={color}
                                                className={`color-option ${categoryForm.color === color ? 'selected' : ''}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => setCategoryForm({ ...categoryForm, color })}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowCategoryModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create Category
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Products;
