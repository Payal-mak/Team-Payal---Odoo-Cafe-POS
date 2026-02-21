import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Package,
    X,
    Upload,
    Tag,
    GripVertical
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './ProductsPage.css';

const ProductsPage = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showProductModal, setShowProductModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // general or variants

    // Fetch products
    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['products', selectedCategory],
        queryFn: async () => {
            const url = selectedCategory
                ? `/products?category_id=${selectedCategory}`
                : '/products';
            const response = await api.get(url);
            return response.data.data;
        }
    });

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data.data;
        }
    });

    // Filter products by search
    const filteredProducts = productsData?.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setShowProductModal(true);
    };

    const handleDeleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await api.delete(`/products/${productId}`);
            toast.success('Product deleted successfully');
            queryClient.invalidateQueries(['products']);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete product');
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setShowCategoryModal(true);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await api.delete(`/categories/${categoryId}`);
            toast.success('Category deleted successfully');
            queryClient.invalidateQueries(['categories']);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    };

    return (
        <div className="products-page">
            <div className="page-header">
                <div>
                    <h1>Product Management</h1>
                    <p>Manage your menu items and categories</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setEditingCategory(null);
                            setShowCategoryModal(true);
                        }}
                    >
                        <Tag size={18} />
                        Manage Categories
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditingProduct(null);
                            setActiveTab('general');
                            setShowProductModal(true);
                        }}
                    >
                        <Plus size={18} />
                        New Product
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="search-box">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="category-filters">
                    <button
                        className={`filter-btn ${!selectedCategory ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('')}
                    >
                        All
                    </button>
                    {categoriesData?.map(category => (
                        <button
                            key={category.id}
                            className={`filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category.id)}
                            style={{
                                borderColor: selectedCategory === category.id ? category.color : 'transparent',
                                color: selectedCategory === category.id ? category.color : 'inherit'
                            }}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
                <div className="loading-container">
                    <div className="spinner-large"></div>
                    <p>Loading products...</p>
                </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="product-card">
                            <div className="product-image">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} />
                                ) : (
                                    <div className="no-image">
                                        <Package size={32} />
                                    </div>
                                )}
                                {!product.is_active && (
                                    <div className="inactive-badge">Inactive</div>
                                )}
                            </div>
                            <div className="product-info">
                                <h3>{product.name}</h3>
                                <p className="product-category">{product.category_name}</p>
                                <p className="product-price">₹{Number(product.price || 0).toFixed(2)}</p>
                                {product.description && (
                                    <p className="product-description">{product.description}</p>
                                )}
                            </div>
                            <div className="product-actions">
                                <button
                                    className="action-btn edit"
                                    onClick={() => handleEditProduct(product)}
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    className="action-btn delete"
                                    onClick={() => handleDeleteProduct(product.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <Package size={48} />
                    <p>No products found</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditingProduct(null);
                            setShowProductModal(true);
                        }}
                    >
                        <Plus size={18} />
                        Add Your First Product
                    </button>
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <ProductModal
                    product={editingProduct}
                    categories={categoriesData}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onClose={() => {
                        setShowProductModal(false);
                        setEditingProduct(null);
                    }}
                    onSuccess={() => {
                        queryClient.invalidateQueries(['products']);
                        setShowProductModal(false);
                        setEditingProduct(null);
                    }}
                />
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <CategoryModal
                    categories={categoriesData}
                    onClose={() => {
                        setShowCategoryModal(false);
                        setEditingCategory(null);
                    }}
                    onSuccess={() => {
                        queryClient.invalidateQueries(['categories']);
                    }}
                />
            )}
        </div>
    );
};

// Product Modal Component
const ProductModal = ({ product, categories, activeTab, setActiveTab, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        category_id: product?.category_id || '',
        price: product?.price || '',
        unit: product?.unit || 'piece',
        tax_percentage: product?.tax_percentage || 0,
        description: product?.description || '',
        is_active: product?.is_active ?? true
    });
    const [variants, setVariants] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(product?.image_url || null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (product) {
                await api.put(`/products/${product.id}`, formData);
                toast.success('Product updated successfully');
            } else {
                await api.post('/products', formData);
                toast.success('Product created successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save product');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{product ? 'Edit Product' : 'New Product'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General Info
                    </button>
                    {product && (
                        <button
                            className={`tab-btn ${activeTab === 'variants' ? 'active' : ''}`}
                            onClick={() => setActiveTab('variants')}
                        >
                            Variants
                        </button>
                    )}
                </div>

                {activeTab === 'general' ? (
                    <form onSubmit={handleSubmit} className="modal-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Product Name *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category *</label>
                                <select
                                    className="form-control"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories?.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Price *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Unit</label>
                                <select
                                    className="form-control"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                >
                                    <option value="piece">Piece</option>
                                    <option value="kg">Kilogram</option>
                                    <option value="liter">Liter</option>
                                    <option value="plate">Plate</option>
                                    <option value="cup">Cup</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tax %</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    value={formData.tax_percentage}
                                    onChange={(e) => setFormData({ ...formData, tax_percentage: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Product Image</label>
                            <div className="image-upload">
                                {imagePreview && (
                                    <div className="image-preview">
                                        <img src={imagePreview} alt="Preview" />
                                    </div>
                                )}
                                <label className="upload-btn">
                                    <Upload size={18} />
                                    Choose Image
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                Active
                            </label>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {product ? 'Update Product' : 'Create Product'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="modal-body">
                        <p className="text-secondary">Variant management coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Category Modal Component
const CategoryModal = ({ categories, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        color: '#2D5F5D'
    });
    const [editingId, setEditingId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                await api.put(`/categories/${editingId}`, formData);
                toast.success('Category updated');
            } else {
                await api.post('/categories', formData);
                toast.success('Category created');
            }
            setFormData({ name: '', color: '#2D5F5D' });
            setEditingId(null);
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save category');
        }
    };

    const handleEdit = (category) => {
        setFormData({ name: category.name, color: category.color });
        setEditingId(category.id);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this category?')) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success('Category deleted');
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Manage Categories</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label>Category Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Color</label>
                            <input
                                type="color"
                                className="form-control color-picker"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block">
                        {editingId ? 'Update' : 'Add'} Category
                    </button>
                </form>

                <div className="categories-list">
                    {categories?.map(category => (
                        <div key={category.id} className="category-item">
                            <div className="category-info">
                                <div
                                    className="color-dot"
                                    style={{ background: category.color }}
                                />
                                <span>{category.name}</span>
                            </div>
                            <div className="category-actions">
                                <button onClick={() => handleEdit(category)}>
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(category.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;
