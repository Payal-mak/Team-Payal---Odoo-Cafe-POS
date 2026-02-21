import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    ChevronDown,
    LogOut,
    User,
    Settings
} from 'lucide-react';
import './Header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeDropdown, setActiveDropdown] = useState(null);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            console.log('Logout clicked - starting logout process...');
            setActiveDropdown(null); // Close dropdown
            await logout();
            console.log('Logout successful - navigating to login...');
            navigate('/login', { replace: true });
            window.location.href = '/login'; // Force full page reload
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout even if there's an error
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
        }
    };

    const toggleDropdown = (menu) => {
        setActiveDropdown(activeDropdown === menu ? null : menu);
    };

    const closeDropdown = () => {
        setActiveDropdown(null);
    };

    // Menu structure as per Problem Statement
    const menuStructure = {
        orders: {
            label: 'Orders',
            items: [
                { label: 'Floor Plan', path: '/floor' },
                { label: 'All Orders', path: '/orders' },
                { label: 'Draft Orders', path: '/orders?status=draft' },
                { label: 'Paid Orders', path: '/orders?status=paid' },
            ]
        },
        products: {
            label: 'Products',
            items: [
                { label: 'All Products', path: '/products' },
                { label: 'Categories', path: '/products' },
            ]
        },
        reporting: {
            label: 'Reporting',
            items: [
                { label: 'Sales Report', path: '/reporting' },
                { label: 'Product Report', path: '/reporting' },
            ]
        }
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left">
                    <Link to="/dashboard" className="logo">
                        <h1>Odoo Cafe POS</h1>
                    </Link>

                    <nav className="main-nav" ref={dropdownRef}>
                        {Object.entries(menuStructure).map(([key, menu]) => (
                            <div key={key} className="nav-item">
                                <button
                                    className={`nav-btn ${activeDropdown === key ? 'active' : ''}`}
                                    onClick={() => toggleDropdown(key)}
                                >
                                    {menu.label}
                                    <ChevronDown size={16} className={`dropdown-icon ${activeDropdown === key ? 'rotated' : ''}`} />
                                </button>

                                {activeDropdown === key && (
                                    <div className="dropdown-menu">
                                        {menu.items.map((item, index) => (
                                            <Link
                                                key={index}
                                                to={item.path}
                                                className="dropdown-item"
                                                onClick={closeDropdown}
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="header-right">
                    <div className="user-menu">
                        <button
                            className={`user-menu-btn ${activeDropdown === 'user' ? 'active' : ''}`}
                            onClick={() => toggleDropdown('user')}
                        >
                            <User size={20} />
                            <ChevronDown size={16} className={`dropdown-icon ${activeDropdown === 'user' ? 'rotated' : ''}`} />
                        </button>

                        {activeDropdown === 'user' && (
                            <div className="dropdown-menu dropdown-menu-right">
                                <Link to="/profile" className="dropdown-item" onClick={closeDropdown}>
                                    <User size={16} />
                                    Profile
                                </Link>
                                <Link to="/settings" className="dropdown-item" onClick={closeDropdown}>
                                    <Settings size={16} />
                                    Settings
                                </Link>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item logout-item" onClick={handleLogout}>
                                    <LogOut size={16} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
