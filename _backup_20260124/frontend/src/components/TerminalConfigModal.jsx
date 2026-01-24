import { useState, useEffect } from 'react';

export default function TerminalConfigModal({ isOpen, onClose, terminal, onUpdate }) {
    const [config, setConfig] = useState({
        cash_enabled: true,
        digital_enabled: true,
        upi_enabled: true,
        upi_id: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (terminal) {
            setConfig({
                cash_enabled: terminal.cash_enabled !== 0,
                digital_enabled: terminal.digital_enabled !== 0,
                upi_enabled: terminal.upi_enabled !== 0,
                upi_id: terminal.upi_id || '',
            });
        }
    }, [terminal]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onUpdate(terminal.id, config);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update configuration');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !terminal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="card max-w-md w-full mx-4 animate-slide-up">
                <h2 className="text-2xl font-bold text-cafe-brown mb-6">
                    Configure {terminal.name}
                </h2>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-700 border-b pb-2">Payment Methods</h3>

                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="flex items-center space-x-3">
                                <span className="bg-green-100 p-2 rounded-lg text-green-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </span>
                                <span className="font-medium text-gray-700">Cash Payment</span>
                            </span>
                            <input
                                type="checkbox"
                                name="cash_enabled"
                                checked={config.cash_enabled}
                                onChange={handleChange}
                                className="w-5 h-5 text-cafe-brown rounded focus:ring-cafe-brown"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="flex items-center space-x-3">
                                <span className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </span>
                                <span className="font-medium text-gray-700">Digital / Card</span>
                            </span>
                            <input
                                type="checkbox"
                                name="digital_enabled"
                                checked={config.digital_enabled}
                                onChange={handleChange}
                                className="w-5 h-5 text-cafe-brown rounded focus:ring-cafe-brown"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <span className="flex items-center space-x-3">
                                <span className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </span>
                                <span className="font-medium text-gray-700">UPI Payment</span>
                            </span>
                            <input
                                type="checkbox"
                                name="upi_enabled"
                                checked={config.upi_enabled}
                                onChange={handleChange}
                                className="w-5 h-5 text-cafe-brown rounded focus:ring-cafe-brown"
                            />
                        </label>

                        {config.upi_enabled && (
                            <div className="pl-3 animate-fade-in">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    UPI ID (VPA)
                                </label>
                                <input
                                    type="text"
                                    name="upi_id"
                                    value={config.upi_id}
                                    onChange={handleChange}
                                    placeholder="e.g. cafe@bank"
                                    className="input-field"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="btn-secondary flex-1 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
