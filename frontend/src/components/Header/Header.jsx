import { useState, useEffect, useRef } from 'react';
import './Header.css';

const Header = ({ user, onLogout, currentPage, onNavigate }) => {
    const [ordersDropdownOpen, setOrdersDropdownOpen] = useState(false);
    const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
    const [reportingDropdownOpen, setReportingDropdownOpen] = useState(false);
    const ordersDropdownRef = useRef(null);
    const productsDropdownRef = useRef(null);
    const reportingDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ordersDropdownRef.current && !ordersDropdownRef.current.contains(event.target)) {
                setOrdersDropdownOpen(false);
            }
            if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target)) {
                setProductsDropdownOpen(false);
            }
            if (reportingDropdownRef.current && !reportingDropdownRef.current.contains(event.target)) {
                setReportingDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigation = (page) => {
        setOrdersDropdownOpen(false);
        setProductsDropdownOpen(false);
        setReportingDropdownOpen(false);
        onNavigate(page);
    };

    const isOrdersPage = ['orders', 'payments', 'customers'].includes(currentPage);
    const isProductsPage = ['products', 'categories'].includes(currentPage);
    const isReportingPage = ['reporting', 'dashboard'].includes(currentPage);

    return (
        <header className="dashboard-header">
            <div className="dashboard-header-content">
                <div className="dashboard-logo-section" onClick={() => onNavigate('dashboard')}>
                    <img src="/logo.png" alt="Odoo Cafe" className="dashboard-logo" />
                    <div className="dashboard-brand">
                        <h1>Odoo Cafe POS</h1>
                        <p>Point of Sale System</p>
                    </div>
                </div>

                <nav className="dashboard-nav">
                    {/* Orders Dropdown */}
                    <div
                        className={`nav-dropdown ${ordersDropdownOpen ? 'open' : ''}`}
                        ref={ordersDropdownRef}
                    >
                        <button
                            className={`nav-dropdown-toggle ${isOrdersPage ? 'active' : ''}`}
                            onClick={() => setOrdersDropdownOpen(!ordersDropdownOpen)}
                        >
                            📋 Orders
                            <span className="dropdown-arrow">▼</span>
                        </button>
                        <div className="dropdown-menu">
                            <button
                                className={`dropdown-item ${currentPage === 'orders' ? 'active' : ''}`}
                                onClick={() => handleNavigation('orders')}
                            >
                                Orders
                            </button>
                            <button
                                className={`dropdown-item ${currentPage === 'payments' ? 'active' : ''}`}
                                onClick={() => handleNavigation('payments')}
                            >
                                Payment
                            </button>
                            <button
                                className={`dropdown-item ${currentPage === 'customers' ? 'active' : ''}`}
                                onClick={() => handleNavigation('customers')}
                            >
                                Customer
                            </button>
                        </div>
                    </div>

                    {/* Products Dropdown */}
                    <div
                        className={`nav-dropdown ${productsDropdownOpen ? 'open' : ''}`}
                        ref={productsDropdownRef}
                    >
                        <button
                            className={`nav-dropdown-toggle ${isProductsPage ? 'active' : ''}`}
                            onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
                        >
                            🍕 Products
                            <span className="dropdown-arrow">▼</span>
                        </button>
                        <div className="dropdown-menu">
                            <button
                                className={`dropdown-item ${currentPage === 'products' ? 'active' : ''}`}
                                onClick={() => handleNavigation('products')}
                            >
                                Products
                            </button>
                            <button
                                className={`dropdown-item ${currentPage === 'categories' ? 'active' : ''}`}
                                onClick={() => handleNavigation('categories')}
                            >
                                Category
                            </button>
                        </div>
                    </div>

                    {/* Reporting Dropdown */}
                    <div
                        className={`nav-dropdown ${reportingDropdownOpen ? 'open' : ''}`}
                        ref={reportingDropdownRef}
                    >
                        <button
                            className={`nav-dropdown-toggle ${isReportingPage ? 'active' : ''}`}
                            onClick={() => setReportingDropdownOpen(!reportingDropdownOpen)}
                        >
                            📊 Reporting
                            <span className="dropdown-arrow">▼</span>
                        </button>
                        <div className="dropdown-menu">
                            <button
                                className={`dropdown-item ${currentPage === 'dashboard' ? 'active' : ''}`}
                                onClick={() => handleNavigation('dashboard')}
                            >
                                Dashboard
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="dashboard-user">
                    <div className="user-info">
                        <span className="user-name">{user?.username || 'User'}</span>
                        <span className="user-role">{user?.role || 'POS User'}</span>
                    </div>
                    <div className="user-avatar">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <button className="btn btn-outline logout-btn" onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
