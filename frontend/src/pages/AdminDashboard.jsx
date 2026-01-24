import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cream-50 via-cream-100 to-coffee-50">
            {/* Header */}
            <header className="bg-white shadow-md border-b border-cream-200">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⚙️</span>
                        <div>
                            <h1 className="text-2xl font-display font-bold text-espresso-900">
                                Admin Dashboard
                            </h1>
                            <p className="text-sm text-espresso-600">System Administration</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-espresso-800">{user?.username}</p>
                            <p className="text-xs text-espresso-600">{user?.role}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn-secondary"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="card max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">👑</div>
                        <h2 className="text-3xl font-display font-bold text-espresso-900 mb-2">
                            Welcome to Admin Dashboard
                        </h2>
                        <p className="text-espresso-600">
                            Hello, <span className="font-semibold">{user?.username}</span>!
                        </p>
                    </div>

                    <div className="bg-cream-100 rounded-lg p-6 mb-6">
                        <h3 className="font-semibold text-espresso-900 mb-3">User Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-espresso-700 font-medium">Username:</span>
                                <span className="ml-2 text-espresso-900">{user?.username}</span>
                            </div>
                            <div>
                                <span className="text-espresso-700 font-medium">Email:</span>
                                <span className="ml-2 text-espresso-900">{user?.email}</span>
                            </div>
                            <div>
                                <span className="text-espresso-700 font-medium">Role:</span>
                                <span className="ml-2 text-coffee-600 font-semibold">{user?.role}</span>
                            </div>
                            <div>
                                <span className="text-espresso-700 font-medium">User ID:</span>
                                <span className="ml-2 text-espresso-900">{user?.id}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div
                            onClick={() => navigate('/admin/categories')}
                            className="bg-white p-6 rounded-lg shadow-md border border-cream-200 cursor-pointer hover:shadow-lg transition-shadow"
                        >
                            <div className="text-4xl mb-3">🏷️</div>
                            <h3 className="text-xl font-bold text-espresso-900 mb-2">Categories</h3>
                            <p className="text-espresso-600">Manage product categories and colors</p>
                        </div>

                        <div
                            onClick={() => navigate('/admin/products')}
                            className="bg-white p-6 rounded-lg shadow-md border border-cream-200 cursor-pointer hover:shadow-lg transition-shadow"
                        >
                            <div className="text-4xl mb-3">☕</div>
                            <h3 className="text-xl font-bold text-espresso-900 mb-2">Products</h3>
                            <p className="text-espresso-600">Manage products, prices, and variants</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-center">
                            <span className="font-semibold">Note:</span> More admin features coming soon.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
