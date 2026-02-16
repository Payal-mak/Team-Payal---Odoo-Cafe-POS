import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FloorPage from './pages/FloorPage';
import RegisterPage from './pages/RegisterPage';
import KitchenPage from './pages/KitchenPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';

function App() {
    const { user } = useAuth();

    return (
        <Routes>
            {/* Public routes */}
            <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />

            {/* Protected routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/floor"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'cashier']}>
                        <FloorPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'cashier']}>
                        <RegisterPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/kitchen"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'kitchen_staff']}>
                        <KitchenPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/products"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <ProductsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/orders"
                element={
                    <ProtectedRoute>
                        <OrdersPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/customers"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'cashier']}>
                        <CustomersPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/reports"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <ReportsPage />
                    </ProtectedRoute>
                }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
