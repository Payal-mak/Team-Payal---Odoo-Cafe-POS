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
    const headerRef = useRef(null); // covers the ENTIRE header, not just the nav

    // Close any open dropdown when clicking outside the header
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (headerRef.current && !headerRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setActiveDropdown(null);
        try {
            await logout(); // clears state + storage synchronously, then hits API
        } catch {
            // logout() already cleared storage — safe to navigate regardless
        }
        // replace: true — back button won't return to /dashboard
        navigate('/login', { replace: true });
    };

    const toggleDropdown = (menu) => {
        setActiveDropdown(activeDropdown === menu ? null : menu);
    };

    const closeDropdown = () => {
        setActiveDropdown(null);
    };

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
            {/* Single ref covers everything so outside-click works for all dropdowns */}
            <div className="header-container" ref={headerRef}>
                <div className="header-left">
                    <Link to="/dashboard" className="logo">
                        <h1>Odoo Cafe POS</h1>
                    </Link>

                    <nav className="main-nav">
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
                            {user?.name && (
                                <span className="user-name">{user.name.split(' ')[0]}</span>
                            )}
                            <ChevronDown size={16} className={`dropdown-icon ${activeDropdown === 'user' ? 'rotated' : ''}`} />
                        </button>

                        {activeDropdown === 'user' && (
                            <div className="dropdown-menu dropdown-menu-right">
                                {user?.name && (
                                    <div className="dropdown-user-info">
                                        <span className="dropdown-user-name">{user.name}</span>
                                        <span className="dropdown-user-role">{user.role}</span>
                                    </div>
                                )}
                                <div className="dropdown-divider" />
                                <Link to="/profile" className="dropdown-item" onClick={closeDropdown}>
                                    <User size={16} />
                                    Profile
                                </Link>
                                <Link to="/settings" className="dropdown-item" onClick={closeDropdown}>
                                    <Settings size={16} />
                                    Settings
                                </Link>
                                <div className="dropdown-divider" />
                                <button
                                    className="dropdown-item logout-item"
                                    onClick={handleLogout}
                                >
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

