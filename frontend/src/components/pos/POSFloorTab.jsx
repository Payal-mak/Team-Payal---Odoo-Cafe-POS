import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Users, Grid3x3 } from 'lucide-react';
import toast from 'react-hot-toast';
import './POSFloorTab.css'; // Define specific styles here or reuse FloorPage.css

const POSFloorTab = ({ onTableSelect }) => {
    const [selectedFloor, setSelectedFloor] = useState(null);

    // Fetch floors
    const { data: floorsData, isLoading: floorsLoading } = useQuery({
        queryKey: ['floors'],
        queryFn: async () => {
            const response = await api.get('/floors');
            const data = response.data.data;
            if (data && data.length > 0 && !selectedFloor) {
                setSelectedFloor(data[0].id);
            }
            return data;
        }
    });

    // Fetch Tables for selected floor
    const { data: tablesData, isLoading: tablesLoading } = useQuery({
        queryKey: ['tables', selectedFloor],
        queryFn: async () => {
            if (!selectedFloor) return [];
            const response = await api.get(`/tables/floor/${selectedFloor}`);
            return response.data.data;
        },
        enabled: !!selectedFloor
    });

    // Fetch Active Orders to check Table Unpaid Occupancy Status
    const { data: activeOrders } = useQuery({
        queryKey: ['activeOrders'],
        queryFn: async () => {
            const response = await api.get('/orders?status=sent_to_kitchen');
            return response.data.data || [];
        }
    });

    const getTableColor = (tableId) => {
        // Find if this table has an active unpaid order (simulating "orange" occupied)
        const hasOrder = activeOrders?.some(o => o.table_id === tableId && o.status !== 'paid' && o.status !== 'completed');
        return hasOrder ? '#F77F00' : '#52B788'; // Orange if occupied with order, Green if available
    };

    const getTableBgColor = (tableId) => {
        const hasOrder = activeOrders?.some(o => o.table_id === tableId && o.status !== 'paid' && o.status !== 'completed');
        return hasOrder ? '#FFF3E0' : '#D8F3DC'; // Light orange if occupied, Light green if available
    };

    const handleTableClick = async (table) => {
        // Set context and switch to register tab
        sessionStorage.setItem('selectedTable', JSON.stringify({
            id: table.id,
            name: table.table_number || table.name,
            seats: table.seats || table.capacity
        }));

        // Notify parent to switch tab
        onTableSelect();
        toast.success(`Selected ${table.table_number || table.name}`);
    };

    if (floorsLoading) {
        return (
            <div className="pos-floor-loading">
                <div className="spinner-large"></div>
                <p>Loading floors...</p>
            </div>
        );
    }

    return (
        <div className="pos-floor-tab">
            {/* Floor Tabs */}
            {floorsData && floorsData.length > 0 ? (
                <>
                    <div className="floor-tabs">
                        {floorsData.map(floor => (
                            <div
                                key={floor.id}
                                className={`floor-tab ${selectedFloor === floor.id ? 'active' : ''}`}
                                onClick={() => setSelectedFloor(floor.id)}
                            >
                                <span>{floor.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Tables Grid */}
                    {tablesLoading ? (
                        <div className="pos-floor-loading">
                            <div className="spinner-large"></div>
                            <p>Loading tables...</p>
                        </div>
                    ) : tablesData && tablesData.length > 0 ? (
                        <div className="tables-section">
                            <div className="tables-header">
                                <h2>Select Table to Order</h2>
                                <div className="status-legend">
                                    <div className="legend-item">
                                        <div className="legend-dot" style={{ background: '#52B788' }}></div>
                                        <span>Available</span>
                                    </div>
                                    <div className="legend-item">
                                        <div className="legend-dot" style={{ background: '#F77F00' }}></div>
                                        <span>Active Order</span>
                                    </div>
                                </div>
                            </div>

                            <div className="tables-grid">
                                {tablesData.map(table => (
                                    <div
                                        key={table.id}
                                        className="table-card"
                                        onClick={() => handleTableClick(table)}
                                        style={{
                                            borderColor: getTableColor(table.id),
                                            borderWidth: '2px',
                                            borderStyle: 'solid',
                                            backgroundColor: getTableBgColor(table.id),
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div className="table-header">
                                            <h3>{table.table_number || table.name}</h3>
                                        </div>
                                        <div className="table-info">
                                            <div className="table-capacity">
                                                <Users size={16} />
                                                <span>{table.seats || table.capacity} seats</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Grid3x3 size={48} />
                            <p>No tables on this floor</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="empty-state">
                    <Grid3x3 size={48} />
                    <p>No floors configured</p>
                </div>
            )}
        </div>
    );
};

export default POSFloorTab;
