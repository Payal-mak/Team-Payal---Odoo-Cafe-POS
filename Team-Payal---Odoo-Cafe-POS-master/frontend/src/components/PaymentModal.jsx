import { useState, useEffect } from 'react';
import axios from 'axios';
import QRCode from 'react-qr-code';
import '../styles/payment-modal.css';

const PaymentModal = ({ order, isOpen, onClose, onPaymentSuccess, session }) => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [showUpiQr, setShowUpiQr] = useState(false);
    const [upiPaymentString, setUpiPaymentString] = useState('');

    // Fetch payment methods when modal opens
    useEffect(() => {
        if (isOpen && session?.pos_config_id) {
            fetchPaymentMethods();
            setSelectedMethod(null);
            setError(null);
            setSuccess(false);
        }
    }, [isOpen, session?.pos_config_id]);

    const fetchPaymentMethods = async () => {
        if (!session?.pos_config_id) {
            setError('Session configuration not found');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/payment-methods/${session.pos_config_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPaymentMethods(response.data.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching payment methods:', err);
            setError('Failed to load payment methods');
            setLoading(false);
        }
    };

    const handlePaymentMethodSelect = (method) => {
        setSelectedMethod(method);
        setError(null);
    };

    const processPaymentDirect = async () => {
        setProcessing(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:5000/api/orders/${order.id}/pay`,
                { payment_method: selectedMethod.type },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess(true);
            setProcessing(false);

            // Wait a moment to show success message, then close and callback
            setTimeout(() => {
                onPaymentSuccess(response.data.data);
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Error processing payment:', err);
            setError(err.response?.data?.message || 'Failed to process payment');
            setProcessing(false);
        }
    };

    const handleValidatePayment = async () => {
        if (!selectedMethod) {
            setError('Please select a payment method');
            return;
        }

        // UPI-specific flow - show QR code
        if (selectedMethod.type === 'upi') {
            const upiString = `upi://pay?pa=${selectedMethod.upi_id}&am=${order.total_amount}&tn=Order${order.order_number}`;
            setUpiPaymentString(upiString);
            setShowUpiQr(true);
            return;
        }

        // For Cash/Digital - process immediately
        await processPaymentDirect();
    };

    const handleUpiConfirmed = async () => {
        setShowUpiQr(false);
        await processPaymentDirect();
    };

    const handleUpiCancel = () => {
        setShowUpiQr(false);
        setUpiPaymentString('');
    };

    const formatCurrency = (amount) => {
        return `$${(parseFloat(amount) || 0).toFixed(2)}`;
    };

    if (!isOpen) return null;

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="payment-modal-header">
                    <h2>💳 Complete Payment</h2>
                </div>

                <div className="payment-modal-body">
                    {/* Order Information */}
                    <div className="payment-order-info">
                        <div className="payment-order-number">
                            Order: {order.order_number}
                        </div>
                        <div className="payment-order-table">
                            🪑 Table {order.table_number} 
                            {order.floor_name && ` • ${order.floor_name}`}
                        </div>
                        <div className="payment-total-label">Total Amount</div>
                        <div className="payment-total">
                            {formatCurrency(order.total_amount)}
                        </div>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="payment-success-message">
                            ✅ Payment processed successfully!
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="payment-error-message">
                            ❌ {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="payment-loading">Loading payment methods...</div>
                    ) : showUpiQr ? (
                        /* UPI QR Code Screen */
                        <div className="upi-qr-screen">
                            <div className="upi-qr-header">
                                <h3>📱 UPI QR Payment</h3>
                            </div>
                            
                            <div className="upi-qr-container">
                                <QRCode value={upiPaymentString} size={256} />
                            </div>

                            <div className="upi-amount-display">
                                <div className="upi-amount-label">Amount to Pay</div>
                                <div className="upi-amount-value">
                                    {formatCurrency(order.total_amount)}
                                </div>
                            </div>

                            <div className="upi-instructions">
                                <p>Scan this QR code with any UPI app</p>
                                <p className="upi-apps-hint">
                                    (Google Pay, PhonePe, Paytm, etc.)
                                </p>
                            </div>

                            <div className="upi-qr-actions">
                                <button
                                    className="payment-btn payment-btn-secondary"
                                    onClick={handleUpiCancel}
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="payment-btn payment-btn-primary"
                                    onClick={handleUpiConfirmed}
                                    disabled={processing}
                                >
                                    {processing ? 'Processing...' : '✓ Confirmed'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Payment Methods */}
                            <div className="payment-methods-section">
                                <h3>Select Payment Method</h3>
                                <div className="payment-methods-grid">
                                    {paymentMethods.map((method) => (
                                        <div
                                            key={method.id}
                                            className={`payment-method-card ${
                                                selectedMethod?.id === method.id ? 'selected' : ''
                                            }`}
                                            onClick={() => handlePaymentMethodSelect(method)}
                                        >
                                            <div className="payment-method-icon">
                                                {method.icon}
                                            </div>
                                            <div className="payment-method-name">
                                                {method.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="payment-modal-actions">
                                <button
                                    className="payment-btn payment-btn-secondary"
                                    onClick={onClose}
                                    disabled={processing}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="payment-btn payment-btn-primary"
                                    onClick={handleValidatePayment}
                                    disabled={!selectedMethod || processing || success}
                                >
                                    {processing ? 'Processing...' : 'Validate Payment'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
