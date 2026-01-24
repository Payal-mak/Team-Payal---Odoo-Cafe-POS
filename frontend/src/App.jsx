import { useState, useEffect } from 'react';
import Auth from './components/Auth/Auth';
import Dashboard from './components/Dashboard/Dashboard';
import Orders from './components/Orders/Orders';
import Payments from './components/Orders/Payments';
import Customers from './components/Orders/Customers';
import POSSettings from './components/POSSettings/POSSettings';
import Products from './components/Products/Products';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedTerminalId, setSelectedTerminalId] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('dashboard');
    setSelectedTerminalId(null);
  };

  const handleNavigate = (page, terminalId = null) => {
    setCurrentPage(page);
    if (terminalId) {
      setSelectedTerminalId(terminalId);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--light-cream)'
      }}>
        <div className="loading-spinner" style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e0e0e0',
          borderTopColor: 'var(--accent-orange)',
          borderRadius: '50%'
        }}></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // Render different pages based on currentPage
  switch (currentPage) {
    case 'orders':
      return <Orders user={user} onLogout={handleLogout} currentPage={currentPage} onNavigate={handleNavigate} />;
    case 'payments':
      return <Payments user={user} onLogout={handleLogout} currentPage={currentPage} onNavigate={handleNavigate} />;
    case 'customers':
      return <Customers user={user} onLogout={handleLogout} currentPage={currentPage} onNavigate={handleNavigate} />;
    case 'settings':
      return <POSSettings user={user} onLogout={handleLogout} onNavigate={handleNavigate} terminalId={selectedTerminalId} />;
    case 'products':
      return <Products user={user} onLogout={handleLogout} onNavigate={handleNavigate} />;
    case 'dashboard':
    default:
      return <Dashboard user={user} onLogout={handleLogout} onNavigate={handleNavigate} />;
  }
}

export default App;
