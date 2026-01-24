import { useState, useEffect, useRef } from 'react';
import { configAPI } from '../services/api';

const FloorPlan = () => {
    const [floors, setFloors] = useState([]);
    const [activeFloorId, setActiveFloorId] = useState(null);
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);

    // Dragging State
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef(null);

    // Modal State
    const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
    const [floorName, setFloorName] = useState('');

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
            if (floorList.length > 0 && !activeFloorId) {
                setActiveFloorId(floorList[0].id);
            }
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch floors', err);
            setLoading(false);
        }
    };

    const fetchTables = async (floorId) => {
        setTableLoading(true);
        try {
            const response = await configAPI.getTablesByFloor(floorId);
            setTables(response.data.data.tables);
        } catch (err) {
            console.error('Failed to fetch tables', err);
        } finally {
            setTableLoading(false);
        }
    };

    // --- Floor Management ---
    const handleCreateFloor = async (e) => {
        e.preventDefault();
        try {
            await configAPI.createFloor({ name: floorName });
            setFloorName('');
            setIsFloorModalOpen(false);
            fetchFloors();
        } catch (err) {
            alert('Failed to create floor');
        }
    };

    const handleDeleteFloor = async (id) => {
        if (window.confirm('Delete this floor and all its tables?')) {
            try {
                await configAPI.deleteFloor(id);
                if (activeFloorId === id) setActiveFloorId(null);
                fetchFloors();
            } catch (err) {
                alert('Failed to delete floor');
            }
        }
    };

    // --- Table Management ---
    const handleAddTable = async () => {
        if (!activeFloorId) return;
        try {
            // Find next number
            const maxNum = tables.reduce((max, t) => Math.max(max, t.number), 0);

            const newTable = {
                floor_id: activeFloorId,
                number: maxNum + 1,
                seats: 4,
                position_x: 50,
                position_y: 50,
                width: 100,
                height: 100,
                shape: 'square',
                color: '#8b6940'
            };

            await configAPI.createTable(newTable);
            fetchTables(activeFloorId);
        } catch (err) {
            alert('Failed to add table');
        }
    };

    const handleUpdateTable = async (id, updates) => {
        try {
            // Optimistic update
            setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

            await configAPI.updateTable(id, updates);
        } catch (err) {
            console.error('Failed to update table', err);
            fetchTables(activeFloorId); // Revert on error
        }
    };

    const handleDeleteTable = async (id) => {
        if (window.confirm('Delete this table?')) {
            try {
                await configAPI.deleteTable(id);
                setTables(prev => prev.filter(t => t.id !== id));
                setSelectedTable(null);
            } catch (err) {
                alert('Failed to delete table');
            }
        }
    };

    // --- Drag Logic ---
    const handleMouseDown = (e, table) => {
        e.stopPropagation();
        setSelectedTable(table);
        setIsDragging(true);

        // Calculate offset from top-left of table
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !selectedTable || !canvasRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();

        // Calculate new position relative to canvas
        let newX = e.clientX - canvasRect.left - dragOffset.x;
        let newY = e.clientY - canvasRect.top - dragOffset.y;

        // Snap to grid (10px)
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;

        // Boundaries
        const maxX = canvasRect.width - selectedTable.width;
        const maxY = canvasRect.height - selectedTable.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        // Update local state immediately for smoothness
        setTables(prev => prev.map(t =>
            t.id === selectedTable.id ? { ...t, position_x: newX, position_y: newY } : t
        ));
    };

    const handleMouseUp = async () => {
        if (isDragging && selectedTable) {
            setIsDragging(false);
            // Find current position from state to save
            const current = tables.find(t => t.id === selectedTable.id);
            if (current) {
                await handleUpdateTable(current.id, {
                    position_x: current.position_x,
                    position_y: current.position_y
                });
            }
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]" onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
            {/* Top Bar */}
            <div className="bg-white border-b border-cream-200 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-4 overflow-x-auto">
                    <h1 className="text-xl font-display font-bold text-espresso-900 mr-4">
                        Floor Plan
                    </h1>

                    {floors.map(floor => (
                        <button
                            key={floor.id}
                            onClick={() => setActiveFloorId(floor.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFloorId === floor.id
                                    ? 'bg-coffee-600 text-white shadow-md'
                                    : 'bg-cream-100 text-espresso-700 hover:bg-cream-200'
                                }`}
                        >
                            {floor.name}
                        </button>
                    ))}

                    <button
                        onClick={() => setIsFloorModalOpen(true)}
                        className="px-3 py-1 rounded-full border border-dashed border-coffee-400 text-coffee-600 hover:bg-coffee-50 text-sm"
                    >
                        + New Floor
                    </button>
                </div>

                {activeFloorId && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleDeleteFloor(activeFloorId)}
                            className="text-red-500 hover:text-red-700 text-sm px-3"
                        >
                            Delete Floor
                        </button>
                        <button onClick={handleAddTable} className="btn-primary flex items-center gap-2">
                            <span>+</span> Add Table
                        </button>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden bg-cream-50 relative">
                {loading ? (
                    <div className="m-auto">Loading...</div>
                ) : !activeFloorId ? (
                    <div className="m-auto text-espresso-500">Create a floor to get started</div>
                ) : (
                    <>
                        {/* Canvas */}
                        <div
                            ref={canvasRef}
                            className="flex-1 overflow-hidden relative m-4 bg-white shadow-inner rounded-lg border border-cream-200 bg-opacity-70"
                            style={{
                                backgroundImage: 'radial-gradient(#d1a786 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}
                        >
                            {tables.map(table => (
                                <div
                                    key={table.id}
                                    onMouseDown={(e) => handleMouseDown(e, table)}
                                    onClick={(e) => { e.stopPropagation(); setSelectedTable(table); }}
                                    className={`absolute flex items-center justify-center cursor-move transition-shadow select-none group ${selectedTable?.id === table.id ? 'ring-2 ring-coffee-500 shadow-xl z-10' : 'shadow-md hover:shadow-lg'
                                        }`}
                                    style={{
                                        left: `${table.position_x}px`,
                                        top: `${table.position_y}px`,
                                        width: `${table.width}px`,
                                        height: `${table.height}px`,
                                        backgroundColor: table.color,
                                        borderRadius: table.shape === 'round' ? '50%' : '8px',
                                        color: '#fff', // White text for contrast
                                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    <div className="text-center pointer-events-none">
                                        <div className="font-bold text-lg">{table.number}</div>
                                        <div className="text-xs opacity-90">{table.seats} seats</div>
                                    </div>

                                    {/* Active Indicator */}
                                    {!table.active && (
                                        <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center rounded-[inherit]">
                                            <span className="text-xs font-bold uppercase tracking-wider">Closed</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Properties Sidebar */}
                        {selectedTable && (
                            <div className="w-80 bg-white border-l border-cream-200 p-6 flex flex-col shadow-lg z-20">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-lg font-bold text-espresso-900">Table Properties</h2>
                                    <button
                                        onClick={() => setSelectedTable(null)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-4 flex-1 overflow-y-auto">
                                    <div>
                                        <label className="block text-sm font-medium text-espresso-800 mb-1">
                                            Table Number
                                        </label>
                                        <input
                                            type="number"
                                            value={selectedTable.number}
                                            onChange={(e) => handleUpdateTable(selectedTable.id, { number: parseInt(e.target.value) })}
                                            className="input-field"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-espresso-800 mb-1">
                                            Seats
                                        </label>
                                        <input
                                            type="number"
                                            value={selectedTable.seats}
                                            onChange={(e) => handleUpdateTable(selectedTable.id, { seats: parseInt(e.target.value) })}
                                            className="input-field"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-espresso-800 mb-1">
                                            Shape
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUpdateTable(selectedTable.id, { shape: 'square' })}
                                                className={`flex-1 py-2 px-3 rounded border text-sm ${selectedTable.shape === 'square'
                                                        ? 'bg-coffee-100 border-coffee-500 text-coffee-800 font-medium'
                                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                Square/Rect
                                            </button>
                                            <button
                                                onClick={() => handleUpdateTable(selectedTable.id, { shape: 'round' })}
                                                className={`flex-1 py-2 px-3 rounded border text-sm ${selectedTable.shape === 'round'
                                                        ? 'bg-coffee-100 border-coffee-500 text-coffee-800 font-medium'
                                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                Round
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-espresso-800 mb-1">
                                                Width (px)
                                            </label>
                                            <input
                                                type="number"
                                                step="10"
                                                value={selectedTable.width}
                                                onChange={(e) => handleUpdateTable(selectedTable.id, { width: parseInt(e.target.value) })}
                                                className="input-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-espresso-800 mb-1">
                                                Height (px)
                                            </label>
                                            <input
                                                type="number"
                                                step="10"
                                                value={selectedTable.height}
                                                onChange={(e) => handleUpdateTable(selectedTable.id, { height: parseInt(e.target.value) })}
                                                className="input-field"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-espresso-800 mb-1">
                                            Color
                                        </label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={selectedTable.color || '#8b6940'}
                                                onChange={(e) => handleUpdateTable(selectedTable.id, { color: e.target.value })}
                                                className="h-8 w-16 p-0 border border-gray-300 rounded overflow-hidden"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedTable.active}
                                                onChange={(e) => handleUpdateTable(selectedTable.id, { active: e.target.checked })}
                                                className="h-4 w-4 text-coffee-600 focus:ring-coffee-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-espresso-800">Available for seating</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-cream-200 pt-4">
                                    <button
                                        onClick={() => handleDeleteTable(selectedTable.id)}
                                        className="w-full btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    >
                                        Delete Table
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* New Floor Modal */}
            {isFloorModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h2 className="text-xl font-bold mb-4">Add New Floor</h2>
                        <form onSubmit={handleCreateFloor}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-espresso-800 mb-1">
                                    Floor Name
                                </label>
                                <input
                                    type="text"
                                    value={floorName}
                                    onChange={(e) => setFloorName(e.target.value)}
                                    placeholder="e.g. Patio"
                                    className="input-field"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFloorModalOpen(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Create Floor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloorPlan;
