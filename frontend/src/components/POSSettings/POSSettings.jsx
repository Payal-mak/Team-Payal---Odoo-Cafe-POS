import { useState, useEffect } from 'react';
import Header from '../Header/Header';
import './POSSettings.css';

const POSSettings = ({ user, onLogout, onNavigate, terminalId }) => {
    const [terminal, setTerminal] = useState(null);
    const [activeTab, setActiveTab] = useState('payment'); // payment, floors
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState(null);

    // Payment config state
    const [paymentConfig, setPaymentConfig] = useState({
        cash_enabled: true,
        digital_enabled: true,
        upi_enabled: false,
        upi_id: ''
    });

    // Floors and tables state
    const [floors, setFloors] = useState([]);
    const [showFloorModal, setShowFloorModal] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
    const [newFloorName, setNewFloorName] = useState('');
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [selectedTables, setSelectedTables] = useState([]);
    const [tableForm, setTableForm] = useState({
        number: '',
        seats: 4,
        active: true,
        appointment_resource: ''
    });

    useEffect(() => {
        if (terminalId) {
            fetchTerminalConfig();
            fetchFloors();
        }
    }, [terminalId]);

    const fetchTerminalConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/dashboard/terminal/${terminalId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setTerminal(data.data);
                setPaymentConfig({
                    cash_enabled: Boolean(data.data.cash_enabled),
                    digital_enabled: Boolean(data.data.digital_enabled),
                    upi_enabled: Boolean(data.data.upi_enabled),
                    upi_id: data.data.upi_id || ''
                });
            }
        } catch (error) {
            console.error('Error fetching config:', error);
            setError('Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    const fetchFloors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/floors/${terminalId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setFloors(data.data);
            }
        } catch (error) {
            console.error('Error fetching floors:', error);
        }
    };

    const handlePaymentToggle = (field) => {
        setPaymentConfig(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
        setSuccessMessage('');
    };

    const handleUpiIdChange = (e) => {
        setPaymentConfig(prev => ({
            ...prev,
            upi_id: e.target.value
        }));
        setSuccessMessage('');
    };

    const handleSavePayment = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/dashboard/terminal/${terminalId}/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paymentConfig)
            });

            const data = await response.json();

            if (data.success) {
                setSuccessMessage('✓ Payment configuration saved successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error saving config:', error);
            setError('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateFloor = async (e) => {
        e.preventDefault();

        if (!newFloorName.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/floors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    pos_config_id: terminalId,
                    name: newFloorName
                })
            });

            const data = await response.json();

            if (data.success) {
                setShowFloorModal(false);
                setNewFloorName('');
                fetchFloors();
                setSuccessMessage('✓ Floor created successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error creating floor:', error);
            setError('Failed to create floor');
        }
    };

    const handleDeleteFloor = async (floorId) => {
        if (!confirm('Delete this floor and all its tables?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/floors/${floorId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            fetchFloors();
            setSuccessMessage('✓ Floor deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting floor:', error);
            setError('Failed to delete floor');
        }
    };

    const handleCreateTable = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/floors/tables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    floor_id: selectedFloor,
                    ...tableForm
                })
            });

            const data = await response.json();

            if (data.success) {
                setShowTableModal(false);
                setTableForm({ number: '', seats: 4, active: true, appointment_resource: '' });
                fetchFloors();
                setSuccessMessage('✓ Table created successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error creating table:', error);
            setError('Failed to create table');
        }
    };

    const handleDeleteTables = async () => {
        if (selectedTables.length === 0) return;
        if (!confirm(`Delete ${selectedTables.length} table(s)?`)) return;

        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5000/api/floors/tables', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ids: selectedTables })
            });

            setSelectedTables([]);
            fetchFloors();
            setSuccessMessage('✓ Tables deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting tables:', error);
            setError('Failed to delete tables');
        }
    };

    const handleDuplicateTable = async (tableId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5000/api/floors/tables/${tableId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            fetchFloors();
            setSuccessMessage('✓ Table duplicated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error duplicating table:', error);
            setError('Failed to duplicate table');
        }
    };

    const handleSelectTable = (tableId) => {
        if (selectedTables.includes(tableId)) {
            setSelectedTables(selectedTables.filter(id => id !== tableId));
        } else {
            setSelectedTables([...selectedTables, tableId]);
        }
    };

    if (loading) {
        return (
            <div className="pos-settings-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="loading-spinner" style={{ width: '48px', height: '48px', border: '4px solid #e0e0e0', borderTopColor: 'var(--accent-orange)' }}></div>
            </div>
        );
    }

    if (!terminal) {
        return (
            <div className="pos-settings-container">
                <Header user={user} onLogout={onLogout} currentPage="settings" onNavigate={onNavigate} />
                <main className="pos-settings-main">
                    <div className="empty-state">
                        <div className="empty-icon">⚙️</div>
                        <h4 className="empty-title">Terminal Not Found</h4>
                        <p className="empty-description">Unable to load terminal configuration</p>
                        <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
                            Go to Dashboard
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="pos-settings-container">
            <Header user={user} onLogout={onLogout} currentPage="settings" onNavigate={onNavigate} />

            <main className="pos-settings-main">
                <div className="page-header">
                    <h2 className="page-title">POS Settings - {terminal.name}</h2>
                    <p className="page-subtitle">Configure terminal settings and preferences</p>
                </div>

                {successMessage && (
                    <div className="success-message">
                        <span>{successMessage}</span>
                    </div>
                )}

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                        <span>⚠</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Settings Tabs */}
                <div className="settings-tabs">
                    <button
                        className={`settings-tab ${activeTab === 'payment' ? 'active' : ''}`}
                        onClick={() => setActiveTab('payment')}
                    >
                        💳 Payment Methods
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'floors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('floors')}
                    >
                        🏢 Floors & Tables
                    </button>
                </div>

                {/* Payment Methods Tab */}
                {activeTab === 'payment' && (
                    <div className="settings-card">
                        <div className="settings-card-header">
                            <h3 className="settings-card-title">Payment Methods</h3>
                            <p className="settings-card-description">Enable or disable payment options for this terminal</p>
                        </div>
                        <div className="settings-card-body">
                            <div className="payment-methods">
                                {/* Cash Payment */}
                                <div className="payment-method-item">
                                    <div className="payment-method-info">
                                        <div className="payment-icon">💵</div>
                                        <div className="payment-details">
                                            <h4>Cash Payment</h4>
                                            <p>Accept cash payments at the counter</p>
                                        </div>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={paymentConfig.cash_enabled}
                                            onChange={() => handlePaymentToggle('cash_enabled')}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                {/* Digital Payment */}
                                <div className="payment-method-item">
                                    <div className="payment-method-info">
                                        <div className="payment-icon">💳</div>
                                        <div className="payment-details">
                                            <h4>Digital Payment</h4>
                                            <p>Accept card and digital wallet payments</p>
                                        </div>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={paymentConfig.digital_enabled}
                                            onChange={() => handlePaymentToggle('digital_enabled')}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                {/* UPI Payment */}
                                <div className="payment-method-item">
                                    <div className="payment-method-info">
                                        <div className="payment-icon">📱</div>
                                        <div className="payment-details">
                                            <h4>UPI Payment</h4>
                                            <p>Accept UPI payments with QR code</p>
                                        </div>
                                    </div>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={paymentConfig.upi_enabled}
                                            onChange={() => handlePaymentToggle('upi_enabled')}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>

                                {/* UPI Configuration */}
                                {paymentConfig.upi_enabled && (
                                    <div className="upi-config">
                                        <label className="upi-config-label">UPI ID Configuration</label>
                                        <div className="upi-input-group">
                                            <input
                                                type="text"
                                                value={paymentConfig.upi_id}
                                                onChange={handleUpiIdChange}
                                                placeholder="yourname@upi"
                                            />
                                        </div>
                                        <p className="upi-help-text">
                                            Enter your UPI ID to generate QR codes for payments
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="settings-actions">
                                <button
                                    className="btn btn-outline"
                                    onClick={() => onNavigate('dashboard')}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSavePayment}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></span>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>Save Changes</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Floors & Tables Tab */}
                {activeTab === 'floors' && (
                    <div className="floors-section">
                        <div className="section-header">
                            <h3 className="section-title">Floor Plans</h3>
                            <button className="btn btn-primary" onClick={() => setShowFloorModal(true)}>
                                ➕ New Floor
                            </button>
                        </div>

                        {floors.length > 0 ? (
                            floors.map(floor => (
                                <div key={floor.id} className="floor-card">
                                    <div className="floor-header">
                                        <h4>{floor.name}</h4>
                                        <div className="floor-actions">
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => {
                                                    setSelectedFloor(floor.id);
                                                    setShowTableModal(true);
                                                }}
                                            >
                                                ➕ Add Table
                                            </button>
                                            <button
                                                className="btn btn-outline btn-sm"
                                                onClick={() => handleDeleteFloor(floor.id)}
                                            >
                                                🗑️ Delete Floor
                                            </button>
                                        </div>
                                    </div>

                                    {floor.tables && floor.tables.length > 0 ? (
                                        <>
                                            {selectedTables.length > 0 && (
                                                <div className="bulk-actions">
                                                    <span>{selectedTables.length} selected</span>
                                                    <button className="btn btn-outline btn-sm" onClick={handleDeleteTables}>
                                                        🗑️ Delete Selected
                                                    </button>
                                                </div>
                                            )}

                                            <div className="tables-grid">
                                                {floor.tables.map(table => (
                                                    <div key={table.id} className={`table-card ${selectedTables.includes(table.id) ? 'selected' : ''}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTables.includes(table.id)}
                                                            onChange={() => handleSelectTable(table.id)}
                                                            className="table-checkbox"
                                                        />
                                                        <div className="table-info">
                                                            <h5>Table {table.number}</h5>
                                                            <p>👥 {table.seats} seats</p>
                                                            <span className={`table-status ${table.active ? 'active' : 'inactive'}`}>
                                                                {table.active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => handleDuplicateTable(table.id)}
                                                        >
                                                            📋 Duplicate
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="empty-tables">
                                            <p>No tables yet. Click "Add Table" to create one.</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">🏢</div>
                                <h4 className="empty-title">No Floors Yet</h4>
                                <p className="empty-description">Create a floor plan to start adding tables</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Floor Modal */}
                {showFloorModal && (
                    <div className="modal-overlay" onClick={() => setShowFloorModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Create New Floor</h3>
                                <p className="modal-description">Enter a name for the floor plan</p>
                            </div>
                            <form onSubmit={handleCreateFloor}>
                                <div className="input-group">
                                    <label htmlFor="floorName">Floor Name</label>
                                    <input
                                        type="text"
                                        id="floorName"
                                        value={newFloorName}
                                        onChange={(e) => setNewFloorName(e.target.value)}
                                        placeholder="e.g., Ground Floor, First Floor"
                                        autoFocus
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowFloorModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create Floor
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Create Table Modal */}
                {showTableModal && (
                    <div className="modal-overlay" onClick={() => setShowTableModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">Add New Table</h3>
                                <p className="modal-description">Configure table details</p>
                            </div>
                            <form onSubmit={handleCreateTable}>
                                <div className="input-group">
                                    <label htmlFor="tableNumber">Table Number</label>
                                    <input
                                        type="number"
                                        id="tableNumber"
                                        value={tableForm.number}
                                        onChange={(e) => setTableForm({ ...tableForm, number: e.target.value })}
                                        placeholder="1"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="tableSeats">Number of Seats</label>
                                    <input
                                        type="number"
                                        id="tableSeats"
                                        value={tableForm.seats}
                                        onChange={(e) => setTableForm({ ...tableForm, seats: e.target.value })}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={tableForm.active}
                                            onChange={(e) => setTableForm({ ...tableForm, active: e.target.checked })}
                                        />
                                        {' '}Active
                                    </label>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowTableModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Add Table
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

export default POSSettings;
