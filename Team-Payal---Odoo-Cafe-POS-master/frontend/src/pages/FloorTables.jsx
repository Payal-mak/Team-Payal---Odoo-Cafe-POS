import { useState, useEffect } from 'react';
import { floorAPI, tableAPI } from '../services/api';
import Header from '../components/Header';
import '../styles/floor-tables.css';

const FloorTables = () => {
    const [floors, setFloors] = useState([]);
    const [tables, setTables] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [editingFloor, setEditingFloor] = useState(null);
    const [editingTable, setEditingTable] = useState(null);
    const [floorFormData, setFloorFormData] = useState({ name: '' });
    const [tableFormData, setTableFormData] = useState({
        floor_id: '',
        number: '',
        seats: '',
        active: true
    });

    useEffect(() => {
        fetchFloors();
    }, []);

    useEffect(() => {
        if (selectedFloor) {
            fetchTablesByFloor(selectedFloor.id);
        }
    }, [selectedFloor]);

    const fetchFloors = async () => {
        try {
            const response = await floorAPI.getAll();
            const floorsData = response.data.data;
            setFloors(floorsData);
            if (floorsData.length > 0 && !selectedFloor) {
                setSelectedFloor(floorsData[0]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching floors:', error);
            setLoading(false);
        }
    };

    const fetchTablesByFloor = async (floorId) => {
        try {
            const response = await tableAPI.getByFloor(floorId);
            setTables(response.data.data);
        } catch (error) {
            console.error('Error fetching tables:', error);
        }
    };

    const handleFloorSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingFloor) {
                await floorAPI.update(editingFloor.id, floorFormData);
            } else {
                const result = await floorAPI.create(floorFormData);
                const newFloor = result.data.data;
                setSelectedFloor(newFloor);
            }
            fetchFloors();
            closeFloorModal();
        } catch (error) {
            console.error('Error saving floor:', error);
            alert(error.response?.data?.message || 'Failed to save floor');
        }
    };

    const handleTableSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...tableFormData,
                floor_id: selectedFloor?.id || tableFormData.floor_id,
                active: tableFormData.active ? 1 : 0
            };

            if (editingTable) {
                await tableAPI.update(editingTable.id, submitData);
            } else {
                await tableAPI.create(submitData);
            }

            fetchTablesByFloor(selectedFloor.id);
            closeTableModal();
        } catch (error) {
            console.error('Error saving table:', error);
            alert(error.response?.data?.message || 'Failed to save table');
        }
    };

    const handleEditFloor = (floor) => {
        setEditingFloor(floor);
        setFloorFormData({ name: floor.name });
        setIsFloorModalOpen(true);
    };

    const handleDeleteFloor = async (id) => {
        if (window.confirm('Are you sure? This will delete all tables on this floor!')) {
            try {
                await floorAPI.delete(id);
                fetchFloors();
                if (selectedFloor?.id === id) {
                    setSelectedFloor(null);
                    setTables([]);
                }
            } catch (error) {
                console.error('Error deleting floor:', error);
                alert('Failed to delete floor');
            }
        }
    };

    const handleEditTable = (table) => {
        setEditingTable(table);
        setTableFormData({
            floor_id: table.floor_id,
            number: table.number,
            seats: table.seats,
            active: table.active === 1
        });
        setIsTableModalOpen(true);
    };

    const handleDeleteTable = async (id) => {
        if (window.confirm('Are you sure you want to delete this table?')) {
            try {
                await tableAPI.delete(id);
                fetchTablesByFloor(selectedFloor.id);
            } catch (error) {
                console.error('Error deleting table:', error);
                alert('Failed to delete table');
            }
        }
    };

    const closeFloorModal = () => {
        setIsFloorModalOpen(false);
        setEditingFloor(null);
        setFloorFormData({ name: '' });
    };

    const closeTableModal = () => {
        setIsTableModalOpen(false);
        setEditingTable(null);
        setTableFormData({
            floor_id: '',
            number: '',
            seats: '',
            active: true
        });
    };

    if (loading) {
        return <div className="loading">Loading floors and tables...</div>;
    }

    return (
        <div className="floor-tables-container">
            <Header 
                title="🏢 Floor & Table Management"
                showBack={true}
                backTo="/dashboard"
            />

            <div className="floor-tables-layout">
                {/* Left Panel - Floors */}
                <div className="floors-panel">
                    <div className="panel-header">
                        <h2>Floors</h2>
                        <button onClick={() => setIsFloorModalOpen(true)} className="add-btn">
                            + Add Floor
                        </button>
                    </div>
                    <div className="floors-list">
                        {floors.length === 0 ? (
                            <p className="no-data">No floors available. Create one to get started!</p>
                        ) : (
                            floors.map(floor => (
                                <div
                                    key={floor.id}
                                    className={`floor-item ${selectedFloor?.id === floor.id ? 'active' : ''}`}
                                    onClick={() => setSelectedFloor(floor)}
                                >
                                    <div className="floor-info">
                                        <h3>{floor.name}</h3>
                                        <span className="table-count">{floor.table_count} tables</span>
                                    </div>
                                    <div className="floor-actions">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditFloor(floor);
                                            }}
                                            className="icon-btn edit"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFloor(floor.id);
                                            }}
                                            className="icon-btn delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel - Tables */}
                <div className="tables-panel">
                    {selectedFloor ? (
                        <>
                            <div className="panel-header">
                                <h2>{selectedFloor.name} - Tables</h2>
                                <button onClick={() => setIsTableModalOpen(true)} className="add-btn">
                                    + Add Table
                                </button>
                            </div>
                            <div className="tables-grid">
                                {tables.length === 0 ? (
                                    <p className="no-data">No tables on this floor. Add some!</p>
                                ) : (
                                    tables.map(table => (
                                        <div
                                            key={table.id}
                                            className={`table-card ${table.active ? 'active' : 'inactive'}`}
                                        >
                                            <div className="table-number">Table {table.number}</div>
                                            <div className="table-seats">👥 {table.seats} seats</div>
                                            <div className="table-status">
                                                {table.active ? '✓ Active' : '✗ Inactive'}
                                            </div>
                                            <div className="table-card-actions">
                                                <button
                                                    onClick={() => handleEditTable(table)}
                                                    className="edit-btn"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTable(table.id)}
                                                    className="delete-btn"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="no-floor-selected">
                            <p>Select a floor from the left to view and manage tables</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floor Modal */}
            {isFloorModalOpen && (
                <div className="modal-overlay" onClick={closeFloorModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingFloor ? 'Edit Floor' : 'Add New Floor'}</h2>
                        <form onSubmit={handleFloorSubmit}>
                            <div className="form-group">
                                <label>Floor Name *</label>
                                <input
                                    type="text"
                                    value={floorFormData.name}
                                    onChange={(e) => setFloorFormData({ name: e.target.value })}
                                    placeholder="e.g., Ground Floor, First Floor"
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={closeFloorModal} className="cancel-btn">
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    {editingFloor ? 'Update' : 'Create'} Floor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table Modal */}
            {isTableModalOpen && (
                <div className="modal-overlay" onClick={closeTableModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editingTable ? 'Edit Table' : 'Add New Table'}</h2>
                        <form onSubmit={handleTableSubmit}>
                            <div className="form-group">
                                <label>Table Number *</label>
                                <input
                                    type="number"
                                    value={tableFormData.number}
                                    onChange={(e) =>
                                        setTableFormData({ ...tableFormData, number: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Number of Seats *</label>
                                <input
                                    type="number"
                                    value={tableFormData.seats}
                                    onChange={(e) =>
                                        setTableFormData({ ...tableFormData, seats: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={tableFormData.active}
                                        onChange={(e) =>
                                            setTableFormData({ ...tableFormData, active: e.target.checked })
                                        }
                                    />
                                    Active
                                </label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={closeTableModal} className="cancel-btn">
                                    Cancel
                                </button>
                                <button type="submit" className="submit-btn">
                                    {editingTable ? 'Update' : 'Create'} Table
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloorTables;
