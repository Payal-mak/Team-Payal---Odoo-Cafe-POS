import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Grid3x3,
    ShoppingCart,
    UtensilsCrossed,
    Package,
    Users,
    FileText,
    BarChart3,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'cashier', 'kitchen_staff'] },
        { icon: Grid3x3, label: 'Floor Plan', path: '/floor', roles: ['admin', 'cashier'] },
        { icon: ShoppingCart, label: 'POS Register', path: '/register', roles: ['admin', 'cashier'] },
        { icon: UtensilsCrossed, label: 'Kitchen', path: '/kitchen', roles: ['admin', 'kitchen_staff'] },
        { icon: Package, label: 'Products', path: '/products', roles: ['admin'] },
        { icon: Users, label: 'Customers', path: '/customers', roles: ['admin', 'cashier'] },
        { icon: FileText, label: 'Orders', path: '/orders', roles: ['admin', 'cashier'] },
        { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['admin'] },
    ];

    const filteredMenuItems = menuItems.filter(item =>
        item.roles.includes(user?.role)
    );

    return (
        <>
            <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Odoo Cafe</h2>
                    <p className="user-role">{user?.role}</p>
                </div>

                <nav className="sidebar-nav">
                    {filteredMenuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="nav-item"
                            onClick={() => setIsOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <p className="user-name">{user?.full_name}</p>
                        <p className="user-email">{user?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
        </>
    );
};

export default Sidebar;
