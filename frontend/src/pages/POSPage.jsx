import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Menu, LogOut, RefreshCw, LayoutDashboard } from 'lucide-react';
import './POSPage.css';

// Subcomponents
import POSFloorTab from '../components/pos/POSFloorTab';
import POSRegisterTab from '../components/pos/POSRegisterTab';
import POSOrdersTab from '../components/pos/POSOrdersTab';

const POSPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('table');
    const [showMenu, setShowMenu] = useState(false);

    // Check for active session
    const { data: activeSession, isLoading: sessionLoading } = useQuery({
        queryKey: ['activeSession'],
        queryFn: async () => {
            const response = await api.get('/sessions/active');
            return response.data.data[0]; // Assuming it returns an array of active sessions
        }
    });

    useEffect(() => {
        if (!sessionLoading && !activeSession) {
            toast.error('No active session found. Please open a session first.');
            navigate('/dashboard');
        }
    }, [activeSession, sessionLoading, navigate]);

    const handleReloadData = async () => {
        try {
            await Promise.all([
                queryClient.invalidateQueries(['products']),
                queryClient.invalidateQueries(['categories']),
                queryClient.invalidateQueries(['tables']),
                queryClient.invalidateQueries(['orders'])
            ]);
            toast.success('Data reloaded successfully');
            setShowMenu(false);
        } catch (error) {
            toast.error('Failed to reload data');
        }
    };

    const handleBackend = () => {
        navigate('/dashboard');
    };

    const handleCloseRegister = async () => {
        if (!activeSession) return;

        // This is a simplified close - in a real app you might want a modal to enter actual cash
        try {
            await api.put(`/sessions/${activeSession.id}/close`, {
                closing_balance: 0 // Replace with actual calculated/entered amount if needed
            });
            toast.success('Register closed successfully');
            navigate('/dashboard');
        } catch (error) {
            toast.error('Failed to close register');
        }
    };

    if (sessionLoading) {
        return (
            <div className="pos-loading">
                <div className="spinner-large"></div>
                <p>Loading POS Session...</p>
            </div>
        );
    }

    if (!activeSession) return null;

    return (
        <div className="pos-layout">
            {/* Top Navigation Bar */}
            <div className="pos-topbar">
                <div className="pos-tabs">
                    <button
                        className={`pos-tab ${activeTab === 'table' ? 'active' : ''}`}
                        onClick={() => setActiveTab('table')}
                    >
                        Table
                    </button>
                    <button
                        className={`pos-tab ${activeTab === 'register' ? 'active' : ''}`}
                        onClick={() => setActiveTab('register')}
                    >
                        Register
                    </button>
                    <button
                        className={`pos-tab ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        Orders
                    </button>
                </div>

                <div className="pos-actions">
                    <div className="pos-menu-container">
                        <button
                            className="pos-menu-btn"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <Menu size={24} />
                        </button>

                        {showMenu && (
                            <div className="pos-dropdown">
                                <button onClick={handleReloadData}>
                                    <RefreshCw size={16} /> Reload Data
                                </button>
                                <button onClick={handleBackend}>
                                    <LayoutDashboard size={16} /> Go to Back-end
                                </button>
                                <button onClick={handleCloseRegister} className="danger">
                                    <LogOut size={16} /> Close Register
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="pos-content">
                {activeTab === 'table' && <POSFloorTab onTableSelect={() => setActiveTab('register')} />}
                {activeTab === 'register' && <POSRegisterTab sessionId={activeSession.id} />}
                {activeTab === 'orders' && <POSOrdersTab sessionId={activeSession.id} />}
            </div>
        </div>
    );
};

export default POSPage;
