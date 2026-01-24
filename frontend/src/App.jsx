import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import POSDashboard from './pages/POSDashboard';
import KitchenDisplay from './pages/KitchenDisplay';
import AdminDashboard from './pages/AdminDashboard';
import Categories from './pages/Categories';
import Products from './pages/Products';
import './index.css';

// Home redirect component
const HomeRedirect = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coffee-600 mx-auto"></div>
                    <p className="mt-4 text-espresso-700">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect based on role
    if (user.role === 'pos_user') {
        return <Navigate to="/pos" replace />;
    } else if (user.role === 'kitchen_user') {
        return <Navigate to="/kitchen" replace />;
    } else if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/login" replace />;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    {/* Protected Routes */}
                    <Route
                        path="/pos"
                        element={
                            <ProtectedRoute allowedRoles={['pos_user', 'admin']}>
                                <POSDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/kitchen"
                        element={
                            <ProtectedRoute allowedRoles={['kitchen_user', 'admin']}>
                                <KitchenDisplay />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/categories"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <Categories />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/products"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <Products />
                            </ProtectedRoute>
                        }
                    />

                    {/* Home Route - Redirect based on auth status and role */}
                    <Route path="/" element={<HomeRedirect />} />

                    {/* 404 - Redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
