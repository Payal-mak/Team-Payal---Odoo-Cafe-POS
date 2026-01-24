import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/payment-modal.css';

const PaymentModal = ({ order, isOpen, onClose, onPaymentSuccess, posConfigId = 1 }) => {
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Fetch payment methods when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchPaymentMethods();
            setSelectedMethod(null);
            setError(null);
            setSuccess(false);
        }
    }, [isOpen, posConfigId]);

    const fetchPaymentMethods = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:5000/api/payment-methods/${posConfigId}`,
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

    const handleValidatePayment = async () => {
        if (!selectedMethod) {
            setError('Please select a payment method');
            return;
        }

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
