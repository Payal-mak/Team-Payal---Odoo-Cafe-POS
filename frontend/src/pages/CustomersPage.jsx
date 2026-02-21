import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Plus, Search, Users, X, Phone, Mail,
    MapPin, IndianRupee, Loader2, ChevronRight,
    ShoppingCart, CreditCard, Save, Trash2
} from 'lucide-react';
import './CustomersPage.css';

/* ─────────────────────────────────────
   Country → State data (hardcoded)
───────────────────────────────────── */
const COUNTRY_STATES = {
    India: [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
        'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
    ],
    'United States': [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
        'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
        'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
        'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
        'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
        'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
        'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
        'Wisconsin', 'Wyoming', 'Washington D.C.',
    ],
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    Australia: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'ACT', 'Northern Territory'],
    Canada: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'],
    Germany: ['Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'],
    France: ['Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire', 'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'],
    Other: [],
};

const COUNTRIES = Object.keys(COUNTRY_STATES);

/* ─────────────────────────────────────
   Avatar initials helper
───────────────────────────────────── */
const Avatar = ({ name }) => {
    const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return <span className="cp-avatar">{initials}</span>;
};

/* ─────────────────────────────────────
   Slide-in Customer Form Panel
───────────────────────────────────── */
const EMPTY_FORM = {
    name: '', phone: '', email: '',
    address: '', city: '', state: '', country: '', zip_code: ''
};

const CustomerPanel = ({ customerId, onClose, onSuccess }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const isEdit = !!customerId;

    /* Load customer data for edit */
    const { isLoading: loadingCustomer } = useQuery({
        queryKey: ['customer', customerId],
        queryFn: async () => {
            const r = await api.get(`/customers/${customerId}`);
            return r.data.data;
        },
        enabled: isEdit,
        onSuccess: (data) => {
            setForm({
                name: data.name || '',
                phone: data.phone || '',
                email: data.email || '',
                address: data.address || '',
                city: data.city || '',
                state: data.state || '',
                country: data.country || '',
                zip_code: data.zip_code || '',
            });
        }
    });

    const set = (field, value) => {
        setForm(prev => {
            const next = { ...prev, [field]: value };
            // Reset state when country changes
            if (field === 'country') next.state = '';
            return next;
        });
    };

    const stateOptions = COUNTRY_STATES[form.country] ?? [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Name is required'); return; }
        setSaving(true);
        try {
            if (isEdit) {
                await api.put(`/customers/${customerId}`, form);
                toast.success('Customer updated');
            } else {
                await api.post('/customers', form);
                toast.success('Customer created');
            }
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="cp-panel-overlay" onClick={onClose}>
            <aside className="cp-panel" onClick={e => e.stopPropagation()}>
                {/* Panel header */}
                <div className="cp-panel-header">
                    <h2 className="cp-panel-title">
                        {isEdit ? 'Edit Customer' : 'New Customer'}
                    </h2>
                    <button className="cp-panel-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                {loadingCustomer ? (
                    <div className="cp-panel-loading">
                        <Loader2 className="spin" size={28} />
                    </div>
                ) : (
                    <form className="cp-form" onSubmit={handleSubmit}>
                        <div className="cp-scroll">
                            {/* Name */}
                            <div className="cp-field">
                                <label>Full Name <span className="req">*</span></label>
                                <input
                                    className="cp-input"
                                    value={form.name}
                                    onChange={e => set('name', e.target.value)}
                                    placeholder="Customer name"
                                    required
                                />
                            </div>

                            {/* Phone + Email */}
                            <div className="cp-row">
                                <div className="cp-field">
                                    <label>Phone</label>
                                    <input
                                        className="cp-input"
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => set('phone', e.target.value)}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div className="cp-field">
                                    <label>Email</label>
                                    <input
                                        className="cp-input"
                                        type="email"
                                        value={form.email}
                                        onChange={e => set('email', e.target.value)}
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="cp-divider" />

                            {/* Street 1 */}
                            <div className="cp-field">
                                <label>Street 1</label>
                                <input
                                    className="cp-input"
                                    value={form.address}
                                    onChange={e => set('address', e.target.value)}
                                    placeholder="House / flat, street name"
                                />
                            </div>

                            {/* City + Zip */}
                            <div className="cp-row">
                                <div className="cp-field">
                                    <label>City</label>
                                    <input
                                        className="cp-input"
                                        value={form.city}
                                        onChange={e => set('city', e.target.value)}
                                        placeholder="City"
                                    />
                                </div>
                                <div className="cp-field">
                                    <label>ZIP / PIN Code</label>
                                    <input
                                        className="cp-input"
                                        value={form.zip_code}
                                        onChange={e => set('zip_code', e.target.value)}
                                        placeholder="400001"
                                    />
                                </div>
                            </div>

                            {/* Country */}
                            <div className="cp-field">
                                <label>Country</label>
                                <select
                                    className="cp-input"
                                    value={form.country}
                                    onChange={e => set('country', e.target.value)}
                                >
                                    <option value="">Select country…</option>
                                    {COUNTRIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* State — dropdown or text fallback */}
                            <div className="cp-field">
                                <label>State</label>
                                {stateOptions.length > 0 ? (
                                    <select
                                        className="cp-input"
                                        value={form.state}
                                        onChange={e => set('state', e.target.value)}
                                        disabled={!form.country}
                                    >
                                        <option value="">Select state…</option>
                                        {stateOptions.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        className="cp-input"
                                        value={form.state}
                                        onChange={e => set('state', e.target.value)}
                                        placeholder={form.country ? 'Enter state' : 'Select country first'}
                                        disabled={!form.country}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="cp-panel-footer">
                            <button type="button" className="btn-ghost" onClick={onClose}>
                                Discard
                            </button>
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {saving
                                    ? <><Loader2 size={14} className="spin" /> Saving…</>
                                    : <><Save size={14} /> {isEdit ? 'Update' : 'Create'}</>
                                }
                            </button>
                        </div>
                    </form>
                )}
            </aside>
        </div>
    );
};

/* ─────────────────────────────────────
   Main Customers Page
───────────────────────────────────── */
const CustomersPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const qc = useQueryClient();

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebounced] = useState('');
    const [panelOpen, setPanelOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const debounceRef = useRef(null);

    /* Debounce search 300ms */
    const handleSearch = (val) => {
        setSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebounced(val), 300);
    };

    /* Fetch customers */
    const { data: customers = [], isLoading } = useQuery({
        queryKey: ['customers', debouncedSearch],
        queryFn: async () => {
            const url = debouncedSearch
                ? `/customers?search=${encodeURIComponent(debouncedSearch)}`
                : '/customers';
            const r = await api.get(url);
            return r.data.data ?? [];
        }
    });

    /* Client-side search fallback (in case backend doesn't filter) */
    const filtered = debouncedSearch
        ? customers.filter(c =>
            c.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            c.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            c.phone?.includes(debouncedSearch)
        )
        : customers;

    const openNew = () => { setEditingId(null); setPanelOpen(true); };
    const openEdit = (id) => { setEditingId(id); setPanelOpen(true); };
    const closePanel = () => { setPanelOpen(false); setEditingId(null); };
    const onSuccess = () => { closePanel(); qc.invalidateQueries(['customers']); };

    const deleteCustomer = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await api.delete(`/customers/${id}`);
            toast.success('Customer deleted');
            qc.invalidateQueries(['customers']);
        } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
    };

    return (
        <div className="customers-page">

            {/* Sub-nav */}
            <div className="orders-subnav">
                <Link to="/orders" className={`subnav-tab ${location.pathname === '/orders' ? 'active' : ''}`}>
                    <ShoppingCart size={15} /> Orders
                </Link>
                <Link to="/payments" className={`subnav-tab ${location.pathname === '/payments' ? 'active' : ''}`}>
                    <CreditCard size={15} /> Payment
                </Link>
                <Link to="/customers" className={`subnav-tab ${location.pathname === '/customers' ? 'active' : ''}`}>
                    <Users size={15} /> Customer
                </Link>
            </div>

            {/* Page header */}
            <div className="cp-header">
                <div>
                    <h1 className="cp-title">Customers</h1>
                    <p className="cp-subtitle">Manage your customer database</p>
                </div>
                <button className="btn-primary" onClick={openNew}>
                    <Plus size={16} /> New Customer
                </button>
            </div>

            {/* Search bar */}
            <div className="cp-search">
                <Search size={16} />
                <input
                    type="text"
                    placeholder="Search by name, email, or phone…"
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                />
                {search && (
                    <button className="cp-clear" onClick={() => { setSearch(''); setDebounced(''); }}>
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="cp-loading">
                    <Loader2 className="spin" size={32} />
                    <p>Loading customers…</p>
                </div>
            ) : filtered.length > 0 ? (
                <div className="cp-table-wrap">
                    <table className="cp-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Contact</th>
                                <th>Location</th>
                                <th className="num-col">Total Sales</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => (
                                <tr
                                    key={c.id}
                                    className="cp-row"
                                    onClick={() => openEdit(c.id)}
                                    title="Click to edit"
                                >
                                    <td>
                                        <div className="cp-customer-cell">
                                            <Avatar name={c.name} />
                                            <div>
                                                <p className="cp-name">{c.name}</p>
                                                {c.city && <p className="cp-city">{c.city}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="cp-contact">
                                            {c.phone && (
                                                <span className="cp-contact-item">
                                                    <Phone size={12} /> {c.phone}
                                                </span>
                                            )}
                                            {c.email && (
                                                <span className="cp-contact-item">
                                                    <Mail size={12} /> {c.email}
                                                </span>
                                            )}
                                            {!c.phone && !c.email && <span className="muted">—</span>}
                                        </div>
                                    </td>
                                    <td>
                                        {c.city || c.state || c.country ? (
                                            <div className="cp-location">
                                                <MapPin size={12} />
                                                <span>{[c.city, c.state, c.country].filter(Boolean).join(', ')}</span>
                                            </div>
                                        ) : <span className="muted">—</span>}
                                    </td>
                                    <td className="num-col">
                                        <span className="cp-sales">
                                            <IndianRupee size={12} />
                                            {Number(c.total_sales || 0).toFixed(2)}
                                        </span>
                                    </td>
                                    <td onClick={e => e.stopPropagation()}>
                                        <button
                                            className="cp-delete-btn"
                                            onClick={() => deleteCustomer(c.id, c.name)}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="cp-empty">
                    <Users size={48} />
                    <p>{debouncedSearch ? `No results for "${debouncedSearch}"` : 'No customers yet'}</p>
                    {!debouncedSearch && (
                        <button className="btn-primary" onClick={openNew}>
                            <Plus size={16} /> Add First Customer
                        </button>
                    )}
                </div>
            )}

            {/* Slide-in form panel */}
            {panelOpen && (
                <CustomerPanel
                    customerId={editingId}
                    onClose={closePanel}
                    onSuccess={onSuccess}
                />
            )}
        </div>
    );
};

export default CustomersPage;
