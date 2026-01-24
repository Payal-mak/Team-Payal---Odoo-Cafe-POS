import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import KitchenDisplay from './pages/Kitchen/KitchenDisplay';
import AdminUsers from './pages/Admin/AdminUsers';

// Role-based redirect after login
function RoleBasedRedirect() {
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      // Route based on role
      if (user.role === 'kitchen_user') {
        setRedirectPath('/kitchen');
      } else {
        setRedirectPath('/dashboard');
      }
    } else {
      setRedirectPath('/login');
    }
  }, []);

  if (!redirectPath) return null;
  return <Navigate to={redirectPath} replace />;
}

// Protected Route Component with Role Enforcement
function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (!token || !userData) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specified
  if (allowedRoles.length > 0) {
    const user = JSON.parse(userData);
    if (!allowedRoles.includes(user.role)) {
      // Redirect to appropriate page based on role
      if (user.role === 'kitchen_user') {
        return <Navigate to="/kitchen" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RoleBasedRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* POS User & Admin Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['pos_user', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Kitchen User & Admin Routes */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['kitchen_user', 'admin']}>
              <KitchenDisplay />
            </ProtectedRoute>
          }
        />

        {/* Admin Only Routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to role-based home */}
        <Route path="*" element={<RoleBasedRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;
