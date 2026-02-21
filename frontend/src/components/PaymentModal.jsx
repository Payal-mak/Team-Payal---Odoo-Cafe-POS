import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    X,
    Banknote,
    CreditCard,
    Smartphone,
    Check,
    Mail
} from 'lucide-react';
import QRCode from 'qrcode.react';
import './PaymentModal.css';

const PaymentModal = ({ total, cart, customer, notes, onClose, onSuccess, sessionId, tableId }) => {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [cashReceived, setCashReceived] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [upiQRData, setUpiQRData] = useState(null);
    const [sendEmail, setSendEmail] = useState(false);

    // Create order and payment mutation
    const paymentMutation = useMutation({
        mutationFn: async (paymentData) => {
            // First create the order
            const orderPayload = {
                session_id: sessionId,
                table_id: tableId || null,
                customer_id: customer?.id || null,
                order_type: tableId ? 'dine_in' : 'takeaway',
                notes: notes,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    product_name: item.product_name || item.name || 'Unknown',
                    quantity: parseInt(item.quantity) || 1,
                    unit_price: parseFloat(item.unit_price || item.price) || 0,
                    discount: parseFloat(item.discount) || 0,
                    notes: item.notes || ''
                }))
            };

            // Validate before sending
            for (const item of orderPayload.items) {
                if (!item.product_name) {
                    throw new Error(`Missing product name for item ${item.product_id}`);
                }
                if (isNaN(item.unit_price) || isNaN(item.quantity)) {
                    throw new Error(`Invalid price or quantity for ${item.product_name}`);
                }
            }

            // First create the order
            const orderResponse = await api.post('/orders', orderPayload);

            const orderId = orderResponse.data.data.id;

            // Then process payment
            const paymentResponse = await api.post('/payments', {
                order_id: orderId,
                payment_method_id: paymentData.payment_method_id,
                amount: total,
                payment_type: paymentData.payment_type
            });

            return {
                order: orderResponse.data.data,
                payment: paymentResponse.data.data
            };
        },
        onSuccess: (data) => {
            setOrderData(data);
            setShowReceipt(true);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Payment failed');
        }
    });

    // Generate UPI QR Code
    const generateUPIQR = async () => {
        try {
            const response = await api.post('/payments/upi-qr', {
                amount: total,
                order_id: `ORDER_${Date.now()}`
            });
            setUpiQRData(response.data.data);
        } catch (error) {
            toast.error('Failed to generate UPI QR code');
        }
    };

    const handlePayment = async () => {
        let paymentMethodId = 1; // Default cash
        let paymentType = 'cash';

        if (paymentMethod === 'cash') {
            if (!cashReceived || parseFloat(cashReceived) < total) {
                toast.error('Insufficient cash amount');
                return;
            }
            paymentMethodId = 1;
            paymentType = 'cash';
        } else if (paymentMethod === 'digital') {
            paymentMethodId = 2;
            paymentType = 'card';
        } else if (paymentMethod === 'upi') {
            paymentMethodId = 3;
            paymentType = 'upi';
        }

        paymentMutation.mutate({ payment_method_id: paymentMethodId, payment_type: paymentType });
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleEmailReceipt = async () => {
        if (!customer?.email) {
            toast.error('Customer email not available');
            return;
        }

        toast.success('Receipt sent to ' + customer.email);
        // TODO: Implement email sending
    };

    const change = cashReceived ? (parseFloat(cashReceived) - total).toFixed(2) : '0.00';

    if (showReceipt && orderData) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content receipt-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Payment Successful!</h2>
                        <button className="close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>

                    <div className="modal-body">
                        <div className="success-icon">
                            <Check size={64} />
                        </div>

                        <div className="receipt-details">
                            <h3>Order #{orderData.order.id}</h3>
                            <p className="receipt-date">
                                {new Date(orderData.order.created_at).toLocaleString()}
                            </p>

                            <div className="receipt-items">
                                {cart.map((item, index) => (
                                    <div key={index} className="receipt-item">
                                        <span>{item.name} x{item.quantity}</span>
                                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="receipt-totals">
                                <div className="receipt-row">
                                    <span>Subtotal</span>
                                    <span>₹{(total / 1.05).toFixed(2)}</span>
                                </div>
                                <div className="receipt-row">
                                    <span>Tax</span>
                                    <span>₹{(total - total / 1.05).toFixed(2)}</span>
                                </div>
                                <div className="receipt-row total">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                                {paymentMethod === 'cash' && (
                                    <>
                                        <div className="receipt-row">
                                            <span>Cash Received</span>
                                            <span>₹{parseFloat(cashReceived).toFixed(2)}</span>
                                        </div>
                                        <div className="receipt-row">
                                            <span>Change</span>
                                            <span>₹{change}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {customer?.email && (
                            <div className="email-option">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={sendEmail}
                                        onChange={(e) => setSendEmail(e.target.checked)}
                                    />
                                    Send receipt to {customer.email}
                                </label>
                            </div>
                        )}

                        <div className="receipt-actions">
                            <button className="btn btn-secondary" onClick={handlePrintReceipt}>
                                Print Receipt
                            </button>
                            {sendEmail && customer?.email && (
                                <button className="btn btn-secondary" onClick={handleEmailReceipt}>
                                    <Mail size={18} />
                                    Email Receipt
                                </button>
                            )}
                            <button className="btn btn-primary" onClick={() => {
                                onSuccess();
                                onClose();
                            }}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Payment</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="payment-amount">
                        <span>Total Amount</span>
                        <h2>₹{total.toFixed(2)}</h2>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="payment-methods">
                        <button
                            className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('cash')}
                        >
                            <Banknote size={32} />
                            <span>Cash</span>
                        </button>
                        <button
                            className={`payment-method-btn ${paymentMethod === 'digital' ? 'active' : ''}`}
                            onClick={() => setPaymentMethod('digital')}
                        >
                            <CreditCard size={32} />
                            <span>Digital</span>
                        </button>
                        <button
                            className={`payment-method-btn ${paymentMethod === 'upi' ? 'active' : ''}`}
                            onClick={() => {
                                setPaymentMethod('upi');
                                if (!upiQRData) generateUPIQR();
                            }}
                        >
                            <Smartphone size={32} />
                            <span>UPI QR</span>
                        </button>
                    </div>

                    {/* Cash Payment */}
                    {paymentMethod === 'cash' && (
                        <div className="cash-payment">
                            <div className="form-group">
                                <label>Cash Received</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    placeholder="Enter amount"
                                    autoFocus
                                />
                            </div>
                            {cashReceived && parseFloat(cashReceived) >= total && (
                                <div className="change-display">
                                    <span>Change to Return</span>
                                    <h3>₹{change}</h3>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Digital Payment */}
                    {paymentMethod === 'digital' && (
                        <div className="digital-payment">
                            <p className="payment-instruction">
                                Process card/bank payment and click confirm below
                            </p>
                        </div>
                    )}

                    {/* UPI QR Payment */}
                    {paymentMethod === 'upi' && (
                        <div className="upi-payment">
                            {upiQRData ? (
                                <>
                                    <div className="qr-code-container">
                                        <QRCode value={upiQRData.qr_string} size={200} />
                                    </div>
                                    <p className="payment-instruction">
                                        Scan QR code with any UPI app to pay ₹{total.toFixed(2)}
                                    </p>
                                    <p className="upi-id">UPI ID: {upiQRData.upi_id}</p>
                                </>
                            ) : (
                                <div className="loading-container">
                                    <div className="spinner-large"></div>
                                    <p>Generating QR code...</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handlePayment}
                            disabled={paymentMutation.isPending || (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total))}
                        >
                            {paymentMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
