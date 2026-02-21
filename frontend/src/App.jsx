import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import FloorPage from './pages/FloorPage';
import RegisterPage from './pages/RegisterPage';
import KitchenPage from './pages/KitchenPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import POSPage from './pages/POSPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import CustomerDisplayPage from './pages/CustomerDisplayPage';
import SettingsPage from './pages/SettingsPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import ProductFormPage from './pages/ProductFormPage';
import CategoriesPage from './pages/CategoriesPage';

function App() {
    const { user } = useAuth();

    return (
        <Routes>
            {/* Public routes */}
            <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
                path="/signup"
                element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />}
            />

            {/* Protected routes with Layout */}
            <Route element={<Layout />}>
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
                    path="/pos"
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'cashier']}>
                            <POSPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <SettingsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings/:configId"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <SettingsPage />
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
                    path="/categories"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <CategoriesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/products/new"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <ProductFormPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/products/:productId"
                    element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <ProductFormPage />
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
                    path="/orders/:orderId"
                    element={
                        <ProtectedRoute>
                            <OrderDetailPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/payments"
                    element={
                        <ProtectedRoute>
                            <PaymentsPage />
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
            </Route>

            {/* Public Customer Display - No authentication required */}
            <Route path="/customer-display" element={<CustomerDisplayPage />} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
