import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    ChevronLeft, Save, Plus, Trash2,
    Loader2, Package, X, Image as ImageIcon
} from 'lucide-react';
import './ProductFormPage.css';

/* ─────────────────────────────────────
   Defaults for new product
───────────────────────────────────── */
const EMPTY = {
    name: '', category_id: '', price: '',
    unit: 'Unit', tax_percentage: '5',
    description: '', image_url: '', is_active: true
};

const UNITS = ['Unit', 'KG', 'Liter'];
const TAX_OPTS = [{ label: '0%', val: 0 }, { label: '5%', val: 5 }, { label: '12%', val: 12 }, { label: '18%', val: 18 }, { label: '28%', val: 28 }];

/* ─────────────────────────────────────
   Category multi-select tag picker
───────────────────────────────────── */
const CategoryPicker = ({ categories, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = e => ref.current && !ref.current.contains(e.target) && setOpen(false);
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const selected = categories?.find(c => String(c.id) === String(value));

    return (
        <div className="cat-picker" ref={ref}>
            <div className="cat-picker-control" onClick={() => setOpen(v => !v)}>
                {selected
                    ? <span className="cat-tag" style={{ background: selected.color + '22', color: selected.color, borderColor: selected.color + '44' }}>
                        {selected.name} <button className="cat-tag-x" onClick={e => { e.stopPropagation(); onChange(''); }}><X size={10} /></button>
                    </span>
                    : <span className="cat-placeholder">Select category…</span>}
                <ChevronLeft size={14} style={{ transform: open ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.15s' }} />
            </div>
            {open && (
                <div className="cat-picker-menu">
                    {categories?.length ? categories.map(c => (
                        <button
                            key={c.id}
                            className={`cpm-item ${String(value) === String(c.id) ? 'active' : ''}`}
                            style={{ '--cat-color': c.color || '#B17457' }}
                            onClick={() => { onChange(c.id); setOpen(false); }}
                        >
                            <span className="cpm-dot" style={{ background: c.color }} />
                            {c.name}
                        </button>
                    )) : <p className="cpm-empty">No categories yet</p>}
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────
   Inline Variant Row
───────────────────────────────────── */
const EMPTY_VARIANT = { _id: null, attribute_name: '', attribute_value: '', extra_price: '' };

const VariantRow = ({ row, productId, onChange, onDelete }) => {
    const [saving, setSaving] = useState(false);

    const handleBlur = async () => {
        if (!row.attribute_name.trim() || !row.attribute_value.trim()) return;
        if (row._id) return; // already saved
        setSaving(true);
        try {
            const r = await api.post(`/products/${productId}/variants`, {
                attribute_name: row.attribute_name,
                attribute_value: row.attribute_value,
                extra_price: Number(row.extra_price) || 0
            });
            onChange({ ...row, _id: r.data.data.id });
            toast.success('Variant saved');
        } catch (e) {
            toast.error('Auto-save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!row._id) { onDelete(); return; }
        if (!window.confirm('Delete this variant?')) return;
        try {
            await api.delete(`/products/${productId}/variants/${row._id}`);
            onDelete();
        } catch (e) { toast.error('Delete failed'); }
    };

    return (
        <tr className="vr-row">
            <td>
                <input
                    className="vr-input"
                    value={row.attribute_name}
                    placeholder="Size, Colour…"
                    onChange={e => onChange({ ...row, attribute_name: e.target.value })}
                    onBlur={handleBlur}
                />
            </td>
            <td>
                <input
                    className="vr-input"
                    value={row.attribute_value}
                    placeholder="Small, Red…"
                    onChange={e => onChange({ ...row, attribute_value: e.target.value })}
                    onBlur={handleBlur}
                />
            </td>
            <td>
                <input
                    className="vr-input num"
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.extra_price}
                    placeholder="0.00"
                    onChange={e => onChange({ ...row, extra_price: e.target.value })}
                    onBlur={handleBlur}
                />
            </td>
            <td>
                {saving
                    ? <Loader2 size={14} className="spin" />
                    : (
                        <button className="vr-del" onClick={handleDelete}>
                            <Trash2 size={14} />
                        </button>
                    )}
            </td>
        </tr>
    );
};

/* ─────────────────────────────────────
   Product Form Page
───────────────────────────────────── */
const ProductFormPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const isEdit = !!productId;

    const [tab, setTab] = useState('general');
    const [form, setForm] = useState(EMPTY);
    const [variants, setVariants] = useState([]);
    const [saving, setSaving] = useState(false);

    /* ── Fetch categories ────────────────── */
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await api.get('/categories')).data.data ?? []
    });

    /* ── Fetch product for edit ──────────── */
    const { isLoading: loadingProduct } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const r = await api.get(`/products/${productId}`);
            return r.data.data;
        },
        enabled: isEdit,
        onSuccess: (data) => {
            setForm({
                name: data.name || '',
                category_id: data.category_id || '',
                price: data.price || '',
                unit: data.unit || 'Unit',
                tax_percentage: data.tax_percentage ?? 5,
                description: data.description || '',
                image_url: data.image_url || '',
                is_active: data.is_active ?? true
            });
            setVariants((data.variants ?? []).map(v => ({ ...v, _id: v.id })));
        }
    });

    const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    /* ── Submit ──────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Product name is required'); return; }
        if (!form.category_id) { toast.error('Please select a category'); return; }
        if (form.price === '') { toast.error('Price is required'); return; }

        setSaving(true);
        const payload = {
            ...form,
            price: Number(form.price),
            tax_percentage: Number(form.tax_percentage)
        };

        try {
            if (isEdit) {
                await api.put(`/products/${productId}`, payload);
                toast.success('Product updated');
            } else {
                await api.post('/products', payload);
                toast.success('Product created');
            }
            qc.invalidateQueries(['products']);
            navigate('/products');
        } catch (e) {
            toast.error(e.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    /* ── Variant helpers ─────────────────── */
    const addVariantRow = () =>
        setVariants(prev => [...prev, { ...EMPTY_VARIANT, _localId: Date.now() }]);

    const updateVariant = (idx, row) =>
        setVariants(prev => prev.map((v, i) => i === idx ? row : v));

    const removeVariant = (idx) =>
        setVariants(prev => prev.filter((_, i) => i !== idx));

    if (isEdit && loadingProduct) {
        return (
            <div className="pfp-loading">
                <Loader2 className="spin" size={36} />
                <p>Loading product…</p>
            </div>
        );
    }

    const selectedCat = categories.find(c => String(c.id) === String(form.category_id));

    return (
        <div className="product-form-page">

            {/* Header */}
            <div className="pfp-header">
                <div className="pfp-header-left">
                    <button className="pfp-back" onClick={() => navigate('/products')}>
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="pfp-title">
                            {isEdit ? (form.name || 'Edit Product') : 'New Product'}
                        </h1>
                        <p className="pfp-subtitle">
                            {isEdit ? 'Edit product details' : 'Fill in the details to create a new product'}
                        </p>
                    </div>
                </div>
                <div className="pfp-header-right">
                    <button type="button" className="btn-ghost" onClick={() => navigate('/products')}>
                        Discard
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving
                            ? <><Loader2 size={14} className="spin" /> Saving…</>
                            : <><Save size={14} /> {isEdit ? 'Update' : 'Create'}</>}
                    </button>
                </div>
            </div>

            {/* Tab bar */}
            <div className="pfp-tabs">
                <button
                    className={`pfp-tab ${tab === 'general' ? 'active' : ''}`}
                    onClick={() => setTab('general')}
                >
                    General Info
                </button>
                {isEdit && (
                    <button
                        className={`pfp-tab ${tab === 'variants' ? 'active' : ''}`}
                        onClick={() => setTab('variants')}
                    >
                        Variants {variants.length > 0 && <span className="pfp-tab-count">{variants.length}</span>}
                    </button>
                )}
            </div>

            {/* ── General tab ─────────────────────── */}
            {tab === 'general' && (
                <form onSubmit={handleSubmit}>
                    <div className="pfp-body">

                        {/* Left column: main details */}
                        <div className="pfp-main-col">

                            <div className="pfp-card">
                                <h3 className="pfp-card-title">Product Details</h3>

                                {/* Name */}
                                <div className="pfp-field">
                                    <label>Product Name <span className="req">*</span></label>
                                    <input
                                        className="pfp-input"
                                        value={form.name}
                                        onChange={e => setField('name', e.target.value)}
                                        placeholder="e.g. Espresso, Masala Chai…"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="pfp-field">
                                    <label>Description</label>
                                    <textarea
                                        className="pfp-input"
                                        rows={3}
                                        value={form.description}
                                        onChange={e => setField('description', e.target.value)}
                                        placeholder="Short product description…"
                                    />
                                </div>

                                {/* Price + Tax */}
                                <div className="pfp-row">
                                    <div className="pfp-field">
                                        <label>Sale Price (₹) <span className="req">*</span></label>
                                        <input
                                            className="pfp-input"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={form.price}
                                            onChange={e => setField('price', e.target.value)}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className="pfp-field">
                                        <label>Tax</label>
                                        <select
                                            className="pfp-input"
                                            value={form.tax_percentage}
                                            onChange={e => setField('tax_percentage', e.target.value)}
                                        >
                                            {TAX_OPTS.map(o => (
                                                <option key={o.val} value={o.val}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="pfp-field">
                                        <label>Unit of Measure</label>
                                        <select
                                            className="pfp-input"
                                            value={form.unit}
                                            onChange={e => setField('unit', e.target.value)}
                                        >
                                            {UNITS.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="pfp-field">
                                    <label>Category <span className="req">*</span></label>
                                    <CategoryPicker
                                        categories={categories}
                                        value={form.category_id}
                                        onChange={v => setField('category_id', v)}
                                    />
                                </div>

                                {/* Active toggle */}
                                <div className="pfp-toggle-row">
                                    <div>
                                        <p className="pfp-toggle-label">Active Product</p>
                                        <p className="pfp-toggle-sub">Inactive products won't appear in the POS</p>
                                    </div>
                                    <label className="pfp-toggle">
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={e => setField('is_active', e.target.checked)}
                                        />
                                        <span className="pfp-toggle-knob" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Right column: image */}
                        <div className="pfp-side-col">
                            <div className="pfp-card">
                                <h3 className="pfp-card-title">Product Image</h3>

                                {/* Image URL input */}
                                <div className="pfp-field">
                                    <label>Image URL</label>
                                    <input
                                        className="pfp-input"
                                        value={form.image_url}
                                        onChange={e => setField('image_url', e.target.value)}
                                        placeholder="https://…"
                                    />
                                </div>

                                {/* Preview */}
                                <div className="pfp-img-preview">
                                    {form.image_url ? (
                                        <img src={form.image_url} alt="preview" onError={e => e.target.style.display = 'none'} />
                                    ) : (
                                        <div className="pfp-img-placeholder">
                                            <Package size={36} />
                                            <p>No image set</p>
                                        </div>
                                    )}
                                </div>

                                {/* Quick-pick default images */}
                                <div className="pfp-field">
                                    <label>Quick pick</label>
                                    <div className="pfp-quick-imgs">
                                        {DEFAULT_IMAGES.map((img, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                className={`pfp-quick-img ${form.image_url === img.url ? 'selected' : ''}`}
                                                onClick={() => setField('image_url', img.url)}
                                                title={img.label}
                                            >
                                                <img src={img.url} alt={img.label} />
                                                {form.image_url === img.url && <span className="pfp-check">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </form>
            )}

            {/* ── Variants tab ─────────────────────── */}
            {tab === 'variants' && isEdit && (
                <div className="pfp-card pfp-variants-card">
                    <div className="pfp-variants-header">
                        <div>
                            <h3 className="pfp-card-title" style={{ marginBottom: '0.15rem' }}>Variants</h3>
                            <p className="pfp-card-sub">Fields auto-save when you tab away</p>
                        </div>
                        <button className="btn-primary btn-sm" type="button" onClick={addVariantRow}>
                            <Plus size={14} /> New Variant
                        </button>
                    </div>

                    <div className="vr-table-wrap">
                        <table className="vr-table">
                            <thead>
                                <tr>
                                    <th>Attribute</th>
                                    <th>Value</th>
                                    <th className="num-col">Extra Price (₹)</th>
                                    <th style={{ width: 44 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {variants.length > 0 ? variants.map((v, i) => (
                                    <VariantRow
                                        key={v._id ?? v._localId ?? i}
                                        row={v}
                                        productId={productId}
                                        onChange={row => updateVariant(i, row)}
                                        onDelete={() => removeVariant(i)}
                                    />
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="vr-empty">
                                            No variants yet — click "New Variant" to add one
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────
   Default product images (Unsplash)
───────────────────────────────────── */
const DEFAULT_IMAGES = [
    { label: 'Espresso', url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=200&q=70' },
    { label: 'Cappuccino', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=200&q=70' },
    { label: 'Latte', url: 'https://images.unsplash.com/photo-1561882468-9110d70d2a78?w=200&q=70' },
    { label: 'Masala Chai', url: 'https://images.unsplash.com/photo-1561336526-2914f13ceb36?w=200&q=70' },
    { label: 'Cold Coffee', url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&q=70' },
    { label: 'Fresh Juice', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=200&q=70' },
    { label: 'Smoothie', url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&q=70' },
    { label: 'Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&q=70' },
    { label: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=70' },
    { label: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=70' },
    { label: 'Pasta', url: 'https://images.unsplash.com/photo-1551183053-bf91798d792e?w=200&q=70' },
    { label: 'French Fries', url: 'https://images.unsplash.com/photo-1630384060421-cb20aad0f717?w=200&q=70' },
    { label: 'Chocolate', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=70' },
    { label: 'Ice Cream', url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200&q=70' },
    { label: 'Salad', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=70' },
    { label: 'Wrap', url: 'https://images.unsplash.com/photo-1567097289939-03fde1ff6f87?w=200&q=70' },
];

export default ProductFormPage;
