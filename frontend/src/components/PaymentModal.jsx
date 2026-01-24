import { useState, useEffect } from 'react';

const PaymentModal = ({ isOpen, onClose, totalAmount, onConfirm }) => {
    const [activeTab, setActiveTab] = useState('cash'); // cash, card, upi
    const [cashGiven, setCashGiven] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCashGiven('');
            setProcessing(false);
            setActiveTab('cash');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setProcessing(true);
        // Map 'card' to 'digital' for backend ENUM compatibility
        const method = activeTab === 'card' ? 'digital' : activeTab;
        await onConfirm(method, parseFloat(cashGiven) || totalAmount);
        setProcessing(false);
    };

    const change = (parseFloat(cashGiven) || 0) - totalAmount;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-coffee-600 p-6 text-white text-center">
                    <p className="text-sm opacity-80 uppercase tracking-widest">Total Payable</p>
                    <h2 className="text-4xl font-bold font-display mt-1">${totalAmount.toFixed(2)}</h2>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('cash')}
                        className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide transition-colors ${activeTab === 'cash' ? 'bg-white text-coffee-600 border-b-2 border-coffee-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        💵 Cash
                    </button>
                    <button
                        onClick={() => setActiveTab('card')}
                        className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide transition-colors ${activeTab === 'card' ? 'bg-white text-coffee-600 border-b-2 border-coffee-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        💳 Card
                    </button>
                    <button
                        onClick={() => setActiveTab('upi')}
                        className={`flex-1 py-4 font-bold text-sm uppercase tracking-wide transition-colors ${activeTab === 'upi' ? 'bg-white text-coffee-600 border-b-2 border-coffee-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        📱 UPI
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto">

                    {activeTab === 'cash' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Cash Given</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                    <input
                                        type="number"
                                        value={cashGiven}
                                        onChange={(e) => setCashGiven(e.target.value)}
                                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-2xl font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-coffee-500"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {[10, 20, 50, 100].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setCashGiven(amt.toString())}
                                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition-colors"
                                    >
                                        ${amt}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCashGiven(totalAmount.toString())}
                                    className="flex-1 py-2 bg-coffee-100 hover:bg-coffee-200 text-coffee-700 font-medium rounded transition-colors"
                                >
                                    Exact
                                </button>
                            </div>

                            {change > 0 && (
                                <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex justify-between items-center">
                                    <span className="text-green-700 font-medium">Change to Return</span>
                                    <span className="text-2xl font-bold text-green-700">${change.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'card' && (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl animate-pulse">
                                💳
                            </div>
                            <p className="text-gray-800 font-medium text-lg">Waiting for Card Terminal...</p>
                            <p className="text-gray-500 text-sm mt-2">Please swipe or insert card on the device.</p>
                        </div>
                    )}

                    {activeTab === 'upi' && (
                        <div className="text-center">
                            <div className="bg-white p-2 inline-block border-2 border-dashed border-gray-300 rounded-lg mb-4">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=shop@upi&pn=OdooCafe&am=${totalAmount}&cu=USD`}
                                    alt="UPI QR Code"
                                    className="w-40 h-40"
                                />
                            </div>
                            <p className="text-gray-800 font-bold">Scan to Pay</p>
                            <p className="text-sm text-gray-500">Google Pay, PhonePe, Paytm</p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={processing || (activeTab === 'cash' && change < 0)}
                        className={`flex-1 py-3 font-bold rounded-lg text-white shadow-lg transition-transform active:scale-95 ${processing || (activeTab === 'cash' && change < 0)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {processing ? 'Processing...' : `Confirm ${activeTab === 'upi' ? 'Payment' : 'Payment'}`}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PaymentModal;
