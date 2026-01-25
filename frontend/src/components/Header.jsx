import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import '../styles/common-header.css';

const Header = ({ 
    title, 
    subtitle, 
    showLogout = false, 
    showBack = false, 
    backTo = '/dashboard',
    backLabel = '← Back to Dashboard',
    children 
}) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleBack = () => {
        navigate(backTo);
    };

    return (
        <header className="common-header">
            <div className="header-left">
                {showBack && (
                    <button onClick={handleBack} className="back-button">
                        {backLabel}
                    </button>
                )}
                <div>
                    <h1>{title}</h1>
                    {subtitle && <p className="header-subtitle">{subtitle}</p>}
                </div>
            </div>
            <div className="header-actions">
                {children}
                <ThemeToggle />
                {showLogout && (
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
