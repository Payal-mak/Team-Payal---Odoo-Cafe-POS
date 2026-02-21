import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    Plus,
    Edit,
    Trash2,
    Users,
    X,
    Grid3x3
} from 'lucide-react';
import './FloorPage.css';

const FloorPage = () => {
    const queryClient = useQueryClient();
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [showFloorModal, setShowFloorModal] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
    const [editingFloor, setEditingFloor] = useState(null);
    const [editingTable, setEditingTable] = useState(null);

    // Fetch floors
    const { data: floorsData, isLoading: floorsLoading } = useQuery({
        queryKey: ['floors'],
        queryFn: async () => {
            const response = await api.get('/floors');
            return response.data.data;
        }
    });

    // Fetch tables for selected floor
    const { data: tablesData, isLoading: tablesLoading } = useQuery({
        queryKey: ['tables', selectedFloor],
        queryFn: async () => {
            if (!selectedFloor) return [];
            const response = await api.get(`/tables/floor/${selectedFloor}`);
            return response.data.data;
        },
        enabled: !!selectedFloor
    });

    // Set initial floor selection
    useState(() => {
        if (floorsData && floorsData.length > 0 && !selectedFloor) {
            setSelectedFloor(floorsData[0].id);
        }
    }, [floorsData]);

    const handleDeleteFloor = async (floorId) => {
        if (!confirm('Are you sure you want to delete this floor?')) return;

        try {
            await api.delete(`/floors/${floorId}`);
            toast.success('Floor deleted successfully');
            queryClient.invalidateQueries(['floors']);
            if (selectedFloor === floorId) {
                setSelectedFloor(floorsData?.[0]?.id || null);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete floor');
        }
    };

    const handleDeleteTable = async (tableId) => {
        if (!confirm('Are you sure you want to delete this table?')) return;

        try {
            await api.delete(`/tables/${tableId}`);
            toast.success('Table deleted successfully');
            queryClient.invalidateQueries(['tables']);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete table');
        }
    };
    const handleTableClick = async (table) => {
        if (table.status === 'available') {
            try {
                // Use PATCH instead of PUT — only sends the field being changed
                await api.patch(`/tables/${table.id}/status`, { status: 'occupied' });
                sessionStorage.setItem('selectedTable', JSON.stringify({
                    id: table.id,
                    name: table.table_number,
                    seats: table.seats
                }));
                queryClient.invalidateQueries(['tables']);
                toast.success(`Opening POS for ${table.table_number}`);
                window.location.href = '/pos'; // use /pos not /register
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to select table');
            }
        } else if (table.status === 'occupied') {
            // Allow reopening an occupied table to continue the order
            sessionStorage.setItem('selectedTable', JSON.stringify({
                id: table.id,
                name: table.table_number,
                seats: table.seats
            }));
            window.location.href = '/pos';
        } else {
            toast.error(`${table.table_number} is currently ${table.status} — cannot open`);
        }
    };

    const cycleStatus = async (tableId, currentStatus, e) => {
        e.stopPropagation();
        const next = {
            available: 'occupied',
            occupied: 'reserved',
            reserved: 'available'
        };
        const newStatus = next[currentStatus];
        try {
            await api.patch(`/tables/${tableId}/status`, { status: newStatus });
            queryClient.invalidateQueries(['tables']);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return '#52B788';  // Light green
            case 'occupied': return '#F77F00';  // Orange
            case 'reserved': return '#1B4332';  // Dark green
            default: return '#999';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'available': return 'Available';
            case 'occupied': return 'Occupied';
            case 'reserved': return 'Reserved';
            default: return status;
        }
    };

    const getStatusBgColor = (status) => {
        switch (status) {
            case 'available': return '#D8F3DC';  // Light green bg
            case 'occupied': return '#FFF3E0';  // Orange bg
            case 'reserved': return '#D8EFE4';  // Dark green bg
            default: return '#f0f0f0';
        }
    };

    return (
        <div className="floor-page">
            <div className="page-header">
                <div>
                    <h1>Floor Plan</h1>
                    <p>Manage your restaurant floors and tables</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setEditingFloor(null);
                            setShowFloorModal(true);
                        }}
                    >
                        <Grid3x3 size={18} />
                        New Floor
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditingTable(null);
                            setShowTableModal(true);
                        }}
                        disabled={!selectedFloor}
                    >
                        <Plus size={18} />
                        New Table
                    </button>
                </div>
            </div>

            {/* Floor Tabs */}
            {floorsLoading ? (
                <div className="loading-container">
                    <div className="spinner-large"></div>
                </div>
            ) : floorsData && floorsData.length > 0 ? (
                <>
                    <div className="floor-tabs">
                        {floorsData.map(floor => (
                            <div
                                key={floor.id}
                                className={`floor-tab ${selectedFloor === floor.id ? 'active' : ''}`}
                                onClick={() => setSelectedFloor(floor.id)}
                            >
                                <span>{floor.name}</span>
                                <div className="floor-tab-actions">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingFloor(floor);
                                            setShowFloorModal(true);
                                        }}
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteFloor(floor.id);
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tables Grid */}
                    {tablesLoading ? (
                        <div className="loading-container">
                            <div className="spinner-large"></div>
                            <p>Loading tables...</p>
                        </div>
                    ) : tablesData && tablesData.length > 0 ? (
                        <div className="tables-section">
                            <div className="tables-header">
                                <h2>Tables</h2>
                                <div className="status-legend">
                                    <div className="legend-item">
                                        <div className="legend-dot" style={{ background: '#52B788' }}></div>
                                        <span>Available</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-dot" style={{ background: '#F77F00' }}></div>
                                        <span>Occupied</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-dot" style={{ background: '#1B4332' }}></div>
                                        <span>Reserved</span>
                                    </div>
                                </div>
                            </div>

                            <div className="tables-grid">
                                {tablesData.map(table => (
                                    <div
                                        key={table.id}
                                        className={`table-card ${table.status}`}
                                        onClick={() => handleTableClick(table)}
                                        style={{
                                            borderColor: getStatusColor(table.status),
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            backgroundColor: getStatusBgColor(table.status),
                                            cursor: table.status === 'reserved' ? 'not-allowed' : 'pointer',
                                            opacity: table.status === 'reserved' ? 0.8 : 1,
                                        }}
                                    >
                                        <div className="table-header">
                                            <h3>{table.table_number || table.name}</h3>
                                            <button
                                                className="table-status-badge"
                                                onClick={(e) => cycleStatus(table.id, table.status, e)}
                                                style={{
                                                    color: getStatusColor(table.status),
                                                    background: getStatusBgColor(table.status),
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {getStatusLabel(table.status)}
                                            </button>
                                        </div>
                                        <div className="table-info">
                                            <div className="table-capacity">
                                                <Users size={16} />
                                                <span>{table.seats || table.capacity} seats</span>
                                            </div>
                                        </div>
                                        <div className="table-actions">
                                            <button
                                                className="action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingTable(table);
                                                    setShowTableModal(true);
                                                }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTable(table.id);
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Users size={48} />
                            <p>No tables on this floor</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setEditingTable(null);
                                    setShowTableModal(true);
                                }}
                            >
                                <Plus size={18} />
                                Add Your First Table
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="empty-state">
                    <Grid3x3 size={48} />
                    <p>No floors configured</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setEditingFloor(null);
                            setShowFloorModal(true);
                        }}
                    >
                        <Plus size={18} />
                        Create Your First Floor
                    </button>
                </div>
            )}

            {/* Floor Modal */}
            {showFloorModal && (
                <FloorModal
                    floor={editingFloor}
                    onClose={() => {
                        setShowFloorModal(false);
                        setEditingFloor(null);
                    }}
                    onSuccess={() => {
                        queryClient.invalidateQueries(['floors']);
                        setShowFloorModal(false);
                        setEditingFloor(null);
                    }}
                />
            )}

            {/* Table Modal */}
            {showTableModal && (
                <TableModal
                    table={editingTable}
                    floorId={selectedFloor}
                    onClose={() => {
                        setShowTableModal(false);
                        setEditingTable(null);
                    }}
                    onSuccess={() => {
                        queryClient.invalidateQueries(['tables']);
                        setShowTableModal(false);
                        setEditingTable(null);
                    }}
                />
            )}
        </div>
    );
};

// Floor Modal Component
const FloorModal = ({ floor, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: floor?.name || ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (floor) {
                await api.put(`/floors/${floor.id}`, formData);
                toast.success('Floor updated successfully');
            } else {
                await api.post('/floors', formData);
                toast.success('Floor created successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save floor');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{floor ? 'Edit Floor' : 'New Floor'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Floor Name *</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Ground Floor, First Floor"
                            required
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {floor ? 'Update Floor' : 'Create Floor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TableModal = ({ table, floorId, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        floor_id: table?.floor_id || floorId,
        table_number: table?.table_number || table?.name || '',
        seats: table?.seats || table?.capacity || 4,
        status: table?.status || 'available'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (table) {
                await api.put(`/tables/${table.id}`, formData);
                toast.success('Table updated successfully');
            } else {
                await api.post('/tables', formData);
                toast.success('Table created successfully');
            }
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save table');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{table ? 'Edit Table' : 'New Table'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label>Table Number *</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.table_number}
                            onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                            placeholder="e.g., Table 1, VIP Table"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Seats *</label>
                        <input
                            type="number"
                            className="form-control"
                            value={formData.seats}
                            onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 4 })}
                            min="1"
                            max="20"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select
                            className="form-control"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                            <option value="reserved">Reserved</option>
                        </select>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {table ? 'Update Table' : 'Create Table'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FloorPage;
