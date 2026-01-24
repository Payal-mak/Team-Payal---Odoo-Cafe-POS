import { useState } from 'react';

export default function CreateTerminalModal({ isOpen, onClose, onSuccess }) {
    const [terminalName, setTerminalName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!terminalName.trim()) {
            setError('Terminal name is required');
            return;
        }

        setLoading(true);
        try {
            await onSuccess(terminalName.trim());
            setTerminalName('');
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create terminal');
        } finally {
            setLoading(false);
        }
    };

    const handleDiscard = () => {
        setTerminalName('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="card max-w-md w-full mx-4 animate-slide-up">
                <h2 className="text-2xl font-bold text-cafe-brown mb-6">
                    Create New POS Terminal
                </h2>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg">
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="terminalName" className="block text-sm font-semibold text-gray-700 mb-2">
                            Terminal Name
                        </label>
                        <input
                            type="text"
                            id="terminalName"
                            value={terminalName}
                            onChange={(e) => setTerminalName(e.target.value)}
                            className="input-field"
                            placeholder="e.g., Main Counter, Drive-Thru"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleDiscard}
                            disabled={loading}
                            className="btn-secondary flex-1 disabled:opacity-50"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating...
                                </span>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
