import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Odoo Cafe POS</h1>
                <div className="header-actions">
                    <ThemeToggle />
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="welcome-card">
                    <h2>Welcome, {user?.username}! 👋</h2>
                    <p className="user-info">
                        <strong>Email:</strong> {user?.email}
                    </p>
                    <p className="user-info">
                        <strong>Role:</strong> {user?.role}
                    </p>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>📊 Dashboard</h3>
                        <p>Coming soon...</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>🛒 Orders</h3>
                        <p>Coming soon...</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>📦 Products</h3>
                        <p>Coming soon...</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>⚙️ Settings</h3>
                        <p>Coming soon...</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
