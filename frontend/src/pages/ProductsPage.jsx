import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Plus, Search, Package, Tag,
    ChevronDown, Loader2, X
} from 'lucide-react';
import './ProductsPage.css';

/* ─────────────────────────────────────
   Category badge
───────────────────────────────────── */
const CategoryBadge = ({ name, color }) => (
    <span
        className="cat-badge"
        style={{
            background: color ? `${color}22` : '#f3f4f6',
            color: color || '#666',
            borderColor: color ? `${color}44` : '#e5e7eb'
        }}
    >
        {name}
    </span>
);

/* ─────────────────────────────────────
   Action dropdown (bulk)
───────────────────────────────────── */
const BulkDropdown = ({ count, onArchive, onDelete, disabled }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    const closeHandler = () => setOpen(false);

    return (
        <div className="bulk-drop" ref={ref}>
            <button
                className="bulk-drop-btn"
                onClick={() => setOpen(v => !v)}
                disabled={disabled}
            >
                Actions <ChevronDown size={13} />
            </button>
            {open && (
                <div className="bulk-drop-menu" onClick={() => setOpen(false)}>
                    <button className="bdm-item" onClick={onArchive}>
                        Archive
                    </button>
                    <button className="bdm-item danger" onClick={onDelete}>
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────
   Products List Page
───────────────────────────────────── */
const ProductsPage = () => {
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('');
    const [selected, setSelected] = useState([]);

    /* ── Fetch ────────────────────────────── */
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products', catFilter],
        queryFn: async () => {
            const url = catFilter
                ? `/products?category_id=${catFilter}`
                : '/products';
            return (await api.get(url)).data.data ?? [];
        }
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await api.get('/categories')).data.data ?? []
    });

    /* Local filter */
    const filtered = products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase())
    );

    /* ── Mutations ────────────────────────── */
    const archiveMut = useMutation({
        mutationFn: ids => Promise.all(
            ids.map(id => api.put(`/products/${id}`, { is_active: false }))
        ),
        onSuccess: () => { toast.success('Archived'); setSelected([]); qc.invalidateQueries(['products']); },
        onError: () => toast.error('Archive failed')
    });

    const deleteMut = useMutation({
        mutationFn: ids => Promise.all(ids.map(id => api.delete(`/products/${id}`))),
        onSuccess: () => { toast.success('Deleted'); setSelected([]); qc.invalidateQueries(['products']); },
        onError: e => toast.error(e.response?.data?.message || 'Delete failed')
    });

    /* ── Selection ────────────────────────── */
    const toggleSelect = id =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const toggleAll = () =>
        setSelected(selected.length === filtered.length ? [] : filtered.map(p => p.id));

    const isBusy = archiveMut.isPending || deleteMut.isPending;

    const handleArchive = () => {
        if (!window.confirm(`Archive ${selected.length} product(s)?`)) return;
        archiveMut.mutate(selected);
    };

    const handleDelete = () => {
        if (!window.confirm(`Permanently delete ${selected.length} product(s)?`)) return;
        deleteMut.mutate(selected);
    };

    return (
        <div className="products-page">

            {/* Header */}
            <div className="pp2-header">
                <div>
                    <h1 className="pp2-title">Products</h1>
                    <p className="pp2-subtitle">Manage your menu — {products.length} item{products.length !== 1 ? 's' : ''}</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/products/new')}>
                    <Plus size={16} /> New Product
                </button>
            </div>

            {/* Toolbar: search + category filters */}
            <div className="pp2-toolbar">
                <div className="pp2-search">
                    <Search size={15} />
                    <input
                        type="text"
                        placeholder="Search products…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="pp2-clear" onClick={() => setSearch('')}>
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="pp2-cats">
                    <button
                        className={`cat-filter ${!catFilter ? 'active' : ''}`}
                        onClick={() => setCatFilter('')}
                    >
                        All
                    </button>
                    {categories.map(c => (
                        <button
                            key={c.id}
                            className={`cat-filter ${catFilter === String(c.id) ? 'active' : ''}`}
                            style={catFilter === String(c.id)
                                ? { background: c.color, color: '#fff', borderColor: c.color }
                                : { borderColor: c.color + '55', color: c.color || '#666' }}
                            onClick={() => setCatFilter(v => v === String(c.id) ? '' : String(c.id))}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>

                {/* Bulk actions */}
                {selected.length > 0 && (
                    <div className="pp2-bulk">
                        <span className="pp2-bulk-count">{selected.length} Selected</span>
                        <BulkDropdown
                            count={selected.length}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                            disabled={isBusy}
                        />
                    </div>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="pp2-loading">
                    <Loader2 className="spin" size={32} />
                    <p>Loading products…</p>
                </div>
            ) : filtered.length > 0 ? (
                <div className="pp2-table-wrap">
                    <table className="pp2-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        className="pp2-cb"
                                        checked={selected.length === filtered.length && filtered.length > 0}
                                        onChange={toggleAll}
                                    />
                                </th>
                                <th>Product</th>
                                <th>Category</th>
                                <th className="num-col">Price</th>
                                <th className="num-col">Tax</th>
                                <th>UOM</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr
                                    key={p.id}
                                    className="pp2-row"
                                    onClick={e => { if (e.target.type !== 'checkbox') navigate(`/products/${p.id}`); }}
                                >
                                    <td onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="pp2-cb"
                                            checked={selected.includes(p.id)}
                                            onChange={() => toggleSelect(p.id)}
                                        />
                                    </td>
                                    <td>
                                        <div className="pp2-prod-cell">
                                            <div className="pp2-img">
                                                {p.image_url
                                                    ? <img src={p.image_url} alt={p.name} />
                                                    : <Package size={20} />}
                                            </div>
                                            <div>
                                                <p className="pp2-name">{p.name}</p>
                                                {p.description && (
                                                    <p className="pp2-desc">{p.description.substring(0, 50)}{p.description.length > 50 ? '…' : ''}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {p.category_name
                                            ? <CategoryBadge name={p.category_name} color={p.category_color} />
                                            : <span className="muted">—</span>}
                                    </td>
                                    <td className="num-col pp2-price">₹{Number(p.price || 0).toFixed(2)}</td>
                                    <td className="num-col">{p.tax_percentage || 0}%</td>
                                    <td><span className="pp2-uom">{p.unit || 'Unit'}</span></td>
                                    <td>
                                        <span className={`pp2-status ${p.is_active ? 'active' : 'inactive'}`}>
                                            {p.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="pp2-empty">
                    <Package size={48} />
                    <p>{search ? `No results for "${search}"` : 'No products yet'}</p>
                    {!search && (
                        <button className="btn-primary" onClick={() => navigate('/products/new')}>
                            <Plus size={16} /> Add First Product
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
