import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { configAPI } from '../services/api';

const POSFloorView = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [floors, setFloors] = useState([]);
    const [activeFloorId, setActiveFloorId] = useState(null);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFloors();
    }, []);

    useEffect(() => {
        if (activeFloorId) {
            fetchTables(activeFloorId);
        }
    }, [activeFloorId]);

    const fetchFloors = async () => {
        try {
            const response = await configAPI.getFloors();
            const floorList = response.data.data.floors;
            setFloors(floorList);
            if (floorList.length > 0) {
                setActiveFloorId(floorList[0].id);
            }
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch floors');
            setLoading(false);
        }
    };

    const fetchTables = async (floorId) => {
        try {
            const response = await configAPI.getTablesByFloor(floorId);
            setTables(response.data.data.tables);
        } catch (err) {
            console.error('Failed to fetch tables');
        }
    };

    const handleTableClick = (tableId) => {
        navigate(`/pos/order/${tableId}`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className="p-8 text-center">Loading POS...</div>;

    return (
        <div className="flex flex-col h-screen bg-cream-50">
            {/* Top Bar */}
            <div className="bg-white border-b border-cream-200 px-4 py-3 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4 overflow-x-auto">
                    <div className="font-display font-bold text-coffee-700 text-lg mr-2">
                        Tables
                    </div>

                    {floors.map(floor => (
                        <button
                            key={floor.id}
                            onClick={() => setActiveFloorId(floor.id)}
                            className={`px-6 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeFloorId === floor.id
                                ? 'bg-coffee-600 text-white shadow-md transform scale-105'
                                : 'bg-white border border-cream-200 text-espresso-700 hover:bg-cream-100'
                                }`}
                        >
                            {floor.name}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-espresso-800">
                        Session Active
                    </span>
                    <button
                        onClick={handleLogout}
                        className="bg-cream-200 text-espresso-800 px-4 py-2 rounded hover:bg-cream-300 text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Floor Area */}
            <div className="flex-1 overflow-auto relative p-8">
                <div className="max-w-6xl mx-auto h-full relative">
                    {tables.length === 0 ? (
                        <div className="text-center mt-20 text-gray-400">
                            No tables on this floor. Configure them in "Admin &gt; Floor Plan".
                        </div>
                    ) : (
                        <div className="relative h-full w-full">
                            {tables.map(table => (
                                <div
                                    key={table.id}
                                    onClick={() => handleTableClick(table.id)}
                                    className={`absolute flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-md hover:shadow-xl border-2 ${table.active ? 'border-white' : 'border-gray-300 opacity-50 grayscale'
                                        }`}
                                    style={{
                                        left: `${table.position_x}px`,
                                        top: `${table.position_y}px`,
                                        width: `${table.width}px`,
                                        height: `${table.height}px`,
                                        backgroundColor: table.active ? (table.color || '#8b6940') : '#e5e7eb',
                                        borderRadius: table.shape === 'round' ? '50%' : '12px',
                                        color: '#fff',
                                    }}
                                >
                                    <span className="text-2xl font-bold drop-shadow-md">
                                        {table.number}
                                    </span>
                                    <span className="text-xs opacity-90 mt-1 drop-shadow-sm">
                                        {table.seats} Seats
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default POSFloorView;
