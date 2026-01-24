import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { floorAPI, tableAPI, sessionAPI } from '../services/api';
import '../styles/pos-terminal.css';

const POSTerminal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [floors, setFloors] = useState([]);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [tables, setTables] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSessionAndLoadData();
    }, []);

    const checkSessionAndLoadData = async () => {
        try {
            // Check for active session
            const sessionRes = await sessionAPI.getCurrent(user?.id);
            if (!sessionRes.data.data) {
                // No active session, redirect to dashboard
                navigate('/dashboard');
                return;
            }
            setCurrentSession(sessionRes.data.data);

            // Load floors
            const floorsRes = await floorAPI.getAll();
            setFloors(floorsRes.data.data);

            if (floorsRes.data.data.length > 0) {
                setSelectedFloor(floorsRes.data.data[0]);
                await loadTablesForFloor(floorsRes.data.data[0].id);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading POS data:', error);
            setLoading(false);
        }
    };

    const loadTablesForFloor = async (floorId) => {
        try {
            const tablesRes = await tableAPI.getByFloor(floorId);
            setTables(tablesRes.data.data);
        } catch (error) {
            console.error('Error loading tables:', error);
        }
    };

    const handleFloorChange = async (floor) => {
        setSelectedFloor(floor);
        await loadTablesForFloor(floor.id);
    };

    const handleTableClick = (table) => {
        if (!table.active) return;
        // Navigate to order view for this table
        navigate(`/pos/order/${table.id}`, {
            state: {
                table,
                floor: selectedFloor,
                session: currentSession
            }
        });
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="pos-container">
                <div className="loading-state">Loading POS Terminal...</div>
            </div>
        );
    }

    return (
        <div className="pos-container">
            {/* POS Header */}
            <header className="pos-header">
                <div className="pos-header-left">
                    <button className="back-btn" onClick={handleBackToDashboard}>
                        ← Back
                    </button>
                    <h1>🍽️ POS Terminal</h1>
                </div>
                <div className="pos-header-center">
                    <span className="session-badge">
                        🟢 {currentSession?.pos_name} | Started: {formatTime(currentSession?.open_date)}
                    </span>
                </div>
                <div className="pos-header-right">
                    <span className="user-badge">👤 {user?.username}</span>
                </div>
            </header>

            <div className="pos-main">
                {/* Floor Tabs */}
                <div className="floor-tabs">
                    {floors.map(floor => (
                        <button
                            key={floor.id}
                            className={`floor-tab ${selectedFloor?.id === floor.id ? 'active' : ''}`}
                            onClick={() => handleFloorChange(floor)}
                        >
                            {floor.name}
                            <span className="table-count">{floor.table_count || 0} tables</span>
                        </button>
                    ))}
                </div>

                {/* Tables Grid */}
                <div className="tables-section">
                    <h2 className="section-title">
                        {selectedFloor?.name || 'Select a Floor'}
                    </h2>

                    {tables.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">🪑</span>
                            <p>No tables configured for this floor</p>
                            <button
                                className="btn-secondary"
                                onClick={() => navigate('/floors-tables')}
                            >
                                Configure Tables
                            </button>
                        </div>
                    ) : (
                        <div className="tables-grid">
                            {tables.map(table => (
                                <div
                                    key={table.id}
                                    className={`table-card ${table.active ? 'available' : 'inactive'}`}
                                    onClick={() => handleTableClick(table)}
                                >
                                    <div className="table-icon">🍽️</div>
                                    <div className="table-number">Table {table.number}</div>
                                    <div className="table-seats">
                                        <span className="seat-icon">🪑</span> {table.seats} seats
                                    </div>
                                    <div className={`table-status ${table.active ? 'available' : 'inactive'}`}>
                                        {table.active ? 'Available' : 'Inactive'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Info Bar */}
            <footer className="pos-footer">
                <div className="footer-info">
                    <span>📊 Session Sales: ${(currentSession?.total_sales || 0).toFixed(2)}</span>
                    <span>🛒 Orders: {currentSession?.order_count || 0}</span>
                </div>
                <div className="footer-actions">
                    <button className="btn-outline" onClick={() => navigate('/floors-tables')}>
                        ⚙️ Manage Tables
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default POSTerminal;
