import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    ChevronLeft, Plus, X, Save, Loader2,
    CreditCard, Banknote, Smartphone,
    LayoutGrid, ChevronRight, ChevronDown,
    Trash2, Copy, Table2
} from 'lucide-react';
import './SettingsPage.css';

/* ─────────────────────────────────────────────
   Toggle Switch component
───────────────────────────────────────────── */
const Toggle = ({ checked, onChange, disabled }) => (
    <button
        role="switch"
        aria-checked={checked}
        className={`toggle ${checked ? 'on' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        type="button"
    />
);

/* ─────────────────────────────────────────────
   New Terminal Modal
───────────────────────────────────────────── */
const NewTerminalModal = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const handle = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            await onSave(name.trim());
            onClose();
        } catch { /* toast shown by caller */ }
        finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>New POS Terminal</h3>
                    <button className="modal-close" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body">
                    <label className="field-label">Terminal Name</label>
                    <input
                        className="field-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Main Counter"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && handle()}
                    />
                </div>
                <div className="modal-footer">
                    <button className="btn-ghost" onClick={onClose}>Discard</button>
                    <button className="btn-primary" onClick={handle} disabled={!name.trim() || saving}>
                        {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : <><Save size={14} /> Save</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Inline-editable Table Row
───────────────────────────────────────────── */
const TableRow = ({ table, floorId, onSaved, onDelete }) => {
    const qc = useQueryClient();
    const [tableNum, setTableNum] = useState(String(table.table_number));
    const [seats, setSeats] = useState(String(table.seats));
    const [isNew] = useState(!table.id);

    const save = useCallback(async (field, value) => {
        if (!table.id) return; // will be saved on first blur if new
        try {
            await api.put(`/tables/${table.id}`, { [field]: Number(value) });
            qc.invalidateQueries(['tables', floorId]);
        } catch (e) {
            toast.error(e.response?.data?.message || 'Save failed');
        }
    }, [table.id, floorId, qc]);

    const toggleActive = async () => {
        if (!table.id) return;
        try {
            await api.put(`/tables/${table.id}`, { is_active: !table.is_active });
            qc.invalidateQueries(['tables', floorId]);
        } catch (e) { toast.error('Failed to update table'); }
    };

    const createNew = async () => {
        if (!tableNum.trim()) return;
        try {
            await api.post('/tables', {
                floor_id: floorId,
                table_number: Number(tableNum),
                seats: Number(seats) || 4
            });
            qc.invalidateQueries(['tables', floorId]);
            onSaved();
            toast.success('Table added');
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to add table');
        }
    };

    return (
        <tr className={`tr-row ${table._new ? 'tr-new' : ''}`}>
            <td>
                <input
                    className="cell-input"
                    value={tableNum}
                    onChange={e => setTableNum(e.target.value)}
                    onBlur={() => table._new ? createNew() : save('table_number', tableNum)}
                    placeholder="No."
                    type="number"
                />
            </td>
            <td>
                <input
                    className="cell-input"
                    value={seats}
                    onChange={e => setSeats(e.target.value)}
                    onBlur={() => table._new ? null : save('seats', seats)}
                    placeholder="Seats"
                    type="number"
                />
            </td>
            <td>
                {table.id
                    ? <Toggle checked={!!table.is_active} onChange={toggleActive} />
                    : <span className="muted">—</span>}
            </td>
            <td>
                {table.id && (
                    <button className="icon-btn danger" onClick={() => onDelete(table.id)} title="Delete">
                        <Trash2 size={14} />
                    </button>
                )}
            </td>
        </tr>
    );
};

/* ─────────────────────────────────────────────
   Floor Plan Manager (inline expandable)
───────────────────────────────────────────── */
const FloorPlanManager = ({ configId }) => {
    const qc = useQueryClient();
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [newFloorName, setNewFloorName] = useState('');
    const [addingFloor, setAddingFloor] = useState(false);
    const [newTableRow, setNewTableRow] = useState(false);

    // All floors
    const { data: floors = [] } = useQuery({
        queryKey: ['floors'],
        queryFn: async () => (await api.get('/floors')).data.data ?? []
    });

    useEffect(() => {
        if (floors.length && !selectedFloor) setSelectedFloor(floors[0].id);
    }, [floors, selectedFloor]);

    // Tables for selected floor
    const { data: tables = [] } = useQuery({
        queryKey: ['tables', selectedFloor],
        queryFn: async () =>
            selectedFloor
                ? (await api.get(`/tables/floor/${selectedFloor}`)).data.data ?? []
                : [],
        enabled: !!selectedFloor
    });

    const createFloor = async () => {
        if (!newFloorName.trim()) return;
        try {
            const res = await api.post('/floors', { name: newFloorName.trim() });
            const floorId = res.data.data.id;
            // Create 5 default tables
            await Promise.all([1, 2, 3, 4, 5].map(n =>
                api.post('/tables', { floor_id: floorId, table_number: n, seats: 4 })
            ));
            qc.invalidateQueries(['floors']);
            setSelectedFloor(floorId);
            setNewFloorName('');
            setAddingFloor(false);
            toast.success(`Floor "${newFloorName.trim()}" created with 5 default tables`);
        } catch (e) { toast.error(e.response?.data?.message || 'Failed to create floor'); }
    };

    const deleteTable = async (tableId) => {
        try {
            await api.delete(`/tables/${tableId}`);
            qc.invalidateQueries(['tables', selectedFloor]);
            toast.success('Table deleted');
        } catch (e) { toast.error('Failed to delete table'); }
    };

    return (
        <div className="floor-manager">
            {/* Floor tabs */}
            <div className="floor-tabs">
                {floors.map(f => (
                    <button
                        key={f.id}
                        className={`floor-tab ${selectedFloor === f.id ? 'active' : ''}`}
                        onClick={() => { setSelectedFloor(f.id); setNewTableRow(false); }}
                    >
                        {f.name}
                    </button>
                ))}
                {addingFloor ? (
                    <span className="floor-new-input-wrap">
                        <input
                            className="floor-new-input"
                            value={newFloorName}
                            onChange={e => setNewFloorName(e.target.value)}
                            placeholder="Floor name"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') createFloor(); if (e.key === 'Escape') setAddingFloor(false); }}
                        />
                        <button className="btn-xs-primary" onClick={createFloor}>Add</button>
                        <button className="btn-xs-ghost" onClick={() => setAddingFloor(false)}><X size={12} /></button>
                    </span>
                ) : (
                    <button className="floor-tab add-floor" onClick={() => setAddingFloor(true)}>
                        <Plus size={14} /> New Floor
                    </button>
                )}
            </div>

            {/* Tables for selected floor */}
            {selectedFloor && (
                <div className="tables-section">
                    <div className="tables-toolbar">
                        <span className="tables-count"><Table2 size={14} /> {tables.length} tables</span>
                        <button className="btn-sm-primary" onClick={() => setNewTableRow(true)}>
                            <Plus size={13} /> New Table
                        </button>
                    </div>

                    <div className="tables-scroll">
                        <table className="tables-table">
                            <thead>
                                <tr>
                                    <th>Table #</th>
                                    <th>Seats</th>
                                    <th>Active</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tables.map(t => (
                                    <TableRow
                                        key={t.id}
                                        table={t}
                                        floorId={selectedFloor}
                                        onSaved={() => { }}
                                        onDelete={deleteTable}
                                    />
                                ))}
                                {newTableRow && (
                                    <TableRow
                                        table={{ _new: true, table_number: '', seats: 4, is_active: true }}
                                        floorId={selectedFloor}
                                        onSaved={() => setNewTableRow(false)}
                                        onDelete={() => setNewTableRow(false)}
                                    />
                                )}
                            </tbody>
                        </table>
                        {tables.length === 0 && !newTableRow && (
                            <div className="empty-tables">No tables yet. Click "New Table" to add one.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Main Settings Page
───────────────────────────────────────────── */
const SettingsPage = () => {
    const { configId } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [showNewTerminal, setShowNewTerminal] = useState(false);
    const [floorPlanOpen, setFloorPlanOpen] = useState(false);
    const [upiId, setUpiId] = useState('');
    const upiSaveTimeout = useRef(null);

    /* ── Fetch terminal config ─────────────────── */
    const { data: terminal, isLoading: terminalLoading } = useQuery({
        queryKey: ['terminal', configId],
        queryFn: async () => (await api.get(`/terminals/${configId}`)).data.data,
        enabled: !!configId
    });

    /* ── Fetch payment methods ─────────────────── */
    const { data: paymentMethods = [] } = useQuery({
        queryKey: ['payment-methods'],
        queryFn: async () => (await api.get('/payment-methods/methods/all')).data.data ?? []
    });

    /* ── Fetch all terminals (for New Terminal modal) */
    const { data: allTerminals = [] } = useQuery({
        queryKey: ['terminals'],
        queryFn: async () => (await api.get('/terminals')).data.data ?? []
    });

    // Sync UPI id from fetched payment methods
    useEffect(() => {
        const upiMethod = paymentMethods.find(m => m.type === 'upi');
        if (upiMethod?.upi_id) setUpiId(upiMethod.upi_id);
    }, [paymentMethods]);

    /* ── Mutations ─────────────────────────────── */
    const updateTerminal = useMutation({
        mutationFn: (body) => api.put(`/terminals/${configId}`, body),
        onSuccess: () => qc.invalidateQueries(['terminal', configId]),
        onError: (e) => toast.error(e.response?.data?.message || 'Update failed')
    });

    const updatePaymentMethod = useMutation({
        mutationFn: ({ id, body }) => api.put(`/payment-methods/methods/${id}`, body),
        onSuccess: () => qc.invalidateQueries(['payment-methods']),
        onError: (e) => toast.error(e.response?.data?.message || 'Update failed')
    });

    const createTerminal = useMutation({
        mutationFn: (name) => api.post('/terminals', { name }),
        onSuccess: () => {
            toast.success('Terminal created');
            qc.invalidateQueries(['terminals']);
        },
        onError: (e) => { toast.error(e.response?.data?.message || 'Failed to create terminal'); throw e; }
    });

    /* ── Handlers ──────────────────────────────── */
    const getMethod = (type) => paymentMethods.find(m => m.type === type);

    const togglePayment = (type) => {
        const m = getMethod(type);
        if (!m) return;
        updatePaymentMethod.mutate({ id: m.id, body: { is_enabled: !m.is_enabled } });
    };

    const saveUpiId = (value) => {
        const m = getMethod('upi');
        if (!m) return;
        updatePaymentMethod.mutate({ id: m.id, body: { upi_id: value } });
    };

    const toggleFloorPlan = (val) => {
        updateTerminal.mutate({ floor_plan_enabled: val });
        setFloorPlanOpen(val);
    };

    const cashMethod = getMethod('cash');
    const cardMethod = getMethod('card');
    const upiMethod = getMethod('upi');

    if (terminalLoading) {
        return (
            <div className="sp-loading">
                <Loader2 className="spin" size={36} />
                <p>Loading settings…</p>
            </div>
        );
    }

    return (
        <div className="settings-page">

            {/* ── Page header ──────────────────────── */}
            <div className="sp-header">
                <div className="sp-header-left">
                    <button className="sp-back" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="sp-title">Point of Sale — {terminal?.name ?? '…'}</h1>
                        <p className="sp-subtitle">Configure this POS terminal</p>
                    </div>
                </div>
                <button className="btn-primary" onClick={() => setShowNewTerminal(true)}>
                    <Plus size={16} /> New Terminal
                </button>
            </div>

            {/* ── Payment Methods ───────────────────- */}
            <section className="sp-section">
                <h2 className="sp-section-title"><CreditCard size={16} /> Payment Methods</h2>
                <p className="sp-section-desc">Choose which payment options appear on the payment screen</p>

                <div className="sp-card">
                    {/* Cash */}
                    <div className="pm-row">
                        <div className="pm-info">
                            <Banknote size={20} className="pm-icon cash" />
                            <div>
                                <p className="pm-name">Cash</p>
                                <p className="pm-desc">Accept cash payments at the counter</p>
                            </div>
                        </div>
                        <Toggle
                            checked={!!cashMethod?.is_enabled}
                            onChange={() => togglePayment('cash')}
                        />
                    </div>

                    <div className="pm-divider" />

                    {/* Digital */}
                    <div className="pm-row">
                        <div className="pm-info">
                            <CreditCard size={20} className="pm-icon card" />
                            <div>
                                <p className="pm-name">Digital (Bank &amp; Card)</p>
                                <p className="pm-desc">Credit/debit card and bank transfer</p>
                            </div>
                        </div>
                        <Toggle
                            checked={!!cardMethod?.is_enabled}
                            onChange={() => togglePayment('card')}
                        />
                    </div>

                    <div className="pm-divider" />

                    {/* UPI */}
                    <div className="pm-row pm-row-wrap">
                        <div className="pm-info">
                            <Smartphone size={20} className="pm-icon upi" />
                            <div>
                                <p className="pm-name">UPI</p>
                                <p className="pm-desc">Unified Payments Interface — QR code at checkout</p>
                            </div>
                        </div>
                        <Toggle
                            checked={!!upiMethod?.is_enabled}
                            onChange={() => togglePayment('upi')}
                        />
                    </div>

                    {upiMethod?.is_enabled && (
                        <div className="upi-field">
                            <label className="field-label">UPI ID</label>
                            <div className="upi-input-row">
                                <input
                                    className="field-input"
                                    value={upiId}
                                    onChange={e => setUpiId(e.target.value)}
                                    onBlur={() => saveUpiId(upiId)}
                                    placeholder="yourname@upi"
                                />
                                <button
                                    className="btn-primary btn-sm"
                                    onClick={() => saveUpiId(upiId)}
                                >
                                    <Save size={13} /> Save
                                </button>
                            </div>
                            <p className="upi-hint">This UPI ID is used to generate the QR code on the payment screen</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ── POS Interface / Floor Plan ────────── */}
            <section className="sp-section">
                <h2 className="sp-section-title"><LayoutGrid size={16} /> POS Interface</h2>
                <p className="sp-section-desc">Configure the in-store POS interface</p>

                <div className="sp-card">
                    <div className="pm-row">
                        <div className="pm-info">
                            <LayoutGrid size={20} className="pm-icon floor" />
                            <div>
                                <p className="pm-name">Floor Plan</p>
                                <p className="pm-desc">Enable table management and floor layout in the POS interface</p>
                            </div>
                        </div>
                        <div className="floor-toggle-group">
                            <Toggle
                                checked={!!terminal?.floor_plan_enabled}
                                onChange={toggleFloorPlan}
                            />
                            {terminal?.floor_plan_enabled && (
                                <button
                                    className="plan-link"
                                    onClick={() => setFloorPlanOpen(v => !v)}
                                >
                                    Plan
                                    {floorPlanOpen
                                        ? <ChevronDown size={14} />
                                        : <ChevronRight size={14} />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Inline floor manager */}
                    {terminal?.floor_plan_enabled && floorPlanOpen && (
                        <div className="floor-manager-wrap">
                            <FloorPlanManager configId={configId} />
                        </div>
                    )}
                </div>
            </section>

            {/* ── New Terminal Modal ────────────────── */}
            {showNewTerminal && (
                <NewTerminalModal
                    onClose={() => setShowNewTerminal(false)}
                    onSave={(name) => createTerminal.mutateAsync(name)}
                />
            )}
        </div>
    );
};

export default SettingsPage;
