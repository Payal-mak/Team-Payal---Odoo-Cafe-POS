import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Tag, Edit, Trash2, X, Loader2 } from 'lucide-react';
import './CategoriesPage.css';

const CategoriesPage = () => {
    const qc = useQueryClient();
    const [panelOpen, setPanelOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', color: '#B17457' });
    const [saving, setSaving] = useState(false);

    /* Fetch categories */
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const r = await api.get('/categories');
            return r.data.data ?? [];
        }
    });

    const openNew = () => {
        setForm({ name: '', color: '#B17457' });
        setEditingId(null);
        setPanelOpen(true);
    };

    const openEdit = (cat) => {
        setForm({ name: cat.name, color: cat.color || '#B17457' });
        setEditingId(cat.id);
        setPanelOpen(true);
    };

    const closePanel = () => setPanelOpen(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Name is required'); return; }

        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/categories/${editingId}`, form);
                toast.success('Category updated');
            } else {
                await api.post('/categories', form);
                toast.success('Category created');
            }
            qc.invalidateQueries(['categories']);
            closePanel();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name, e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete category "${name}"? This will fail if products are using it.`)) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success('Category deleted');
            qc.invalidateQueries(['categories']);
        } catch (err) {
            const msg = err.response?.data?.message || 'Delete failed';
            toast.error(msg, { duration: 5000 });
        }
    };

    return (
        <div className="cats-page">
            <div className="cats-header">
                <div>
                    <h1 className="cats-title">Categories</h1>
                    <p className="cats-subtitle">Manage product categories and colors</p>
                </div>
                <button className="btn-primary" onClick={openNew}>
                    <Plus size={16} /> New Category
                </button>
            </div>

            {isLoading ? (
                <div className="cats-loading">
                    <Loader2 className="spin" size={32} />
                    <p>Loading categories…</p>
                </div>
            ) : categories.length > 0 ? (
                <div className="cats-grid">
                    {categories.map(c => (
                        <div key={c.id} className="cat-card" onClick={() => openEdit(c)}>
                            <div className="cat-card-color" style={{ background: c.color }} />
                            <div className="cat-card-content">
                                <h3 className="cat-card-name" style={{ color: c.color }}>
                                    <Tag size={16} />
                                    {c.name}
                                </h3>
                                <div className="cat-card-actions">
                                    <button className="cca-btn delete" onClick={(e) => handleDelete(c.id, c.name, e)}>
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="cats-empty">
                    <Tag size={48} />
                    <p>No categories found</p>
                    <button className="btn-primary" onClick={openNew}>
                        <Plus size={16} /> Add First Category
                    </button>
                </div>
            )}

            {/* Slide-in panel */}
            {panelOpen && (
                <div className="cat-panel-overlay" onClick={closePanel}>
                    <aside className="cat-panel" onClick={e => e.stopPropagation()}>
                        <div className="cat-panel-header">
                            <h2 className="cat-panel-title">
                                {editingId ? 'Edit Category' : 'New Category'}
                            </h2>
                            <button className="cat-panel-close" onClick={closePanel}>
                                <X size={18} />
                            </button>
                        </div>

                        <form className="cat-form" onSubmit={handleSubmit}>
                            <div className="cat-form-body">
                                <div className="cat-field">
                                    <label>Category Name <span className="req">*</span></label>
                                    <input
                                        className="cat-input"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g. Hot Drinks"
                                        required
                                    />
                                </div>
                                <div className="cat-field">
                                    <label>Badge Color</label>
                                    <div className="cat-color-wrap">
                                        <input
                                            type="color"
                                            className="cat-color-input"
                                            value={form.color}
                                            onChange={e => setForm({ ...form, color: e.target.value })}
                                        />
                                        <span className="cat-color-hex">{form.color.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="cat-panel-footer">
                                <button type="button" className="btn-ghost" onClick={closePanel}>
                                    Discard
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving
                                        ? <><Loader2 size={14} className="spin" /> Saving…</>
                                        : <><Plus size={14} /> {editingId ? 'Update' : 'Create'}</>}
                                </button>
                            </div>
                        </form>
                    </aside>
                </div>
            )}
        </div>
    );
};

export default CategoriesPage;
