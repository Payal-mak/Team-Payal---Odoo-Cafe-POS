import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../services/api';
import '../styles/close-register-modal.css';

const CloseRegisterModal = ({ isOpen, onClose, session, onSessionClosed }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState('confirm'); // 'confirm', 'summary'
    const [closingBalance, setClosingBalance] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionSummary, setSessionSummary] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep('confirm');
            setClosingBalance('');
            setSessionSummary(null);
            setError('');
        }
    }, [isOpen]);

    const handleCloseSession = async () => {
        if (!session) return;
        
        setLoading(true);
        setError('');
        
        try {
            const response = await sessionAPI.close(session.id, {
                closing_balance: parseFloat(closingBalance) || 0
            });
            
            if (response.data.success) {
                setSessionSummary(response.data.session_summary);
                setStep('summary');
                if (onSessionClosed) {
                    onSessionClosed();
                }
            }
        } catch (err) {
            console.error('Error closing session:', err);
            setError(err.response?.data?.message || 'Failed to close session');
        } finally {
            setLoading(false);
        }
    };

    const handleDone = () => {
        onClose();
        navigate('/dashboard');
    };

    const formatCurrency = (amount) => {
        return `$${(parseFloat(amount) || 0).toFixed(2)}`;
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (!isOpen) return null;

    return (
        <div className="close-register-overlay" onClick={onClose}>
            <div className="close-register-modal" onClick={(e) => e.stopPropagation()}>
                {step === 'confirm' && (
                    <>
                        <div className="modal-header danger">
                            <span className="modal-icon">🔴</span>
                            <h2>Close Register</h2>
                        </div>
                        
                        <div className="modal-body">
                            <div className="session-info-card">
                                <div className="info-row">
                                    <span className="label">Terminal:</span>
                                    <span className="value">{session?.pos_name}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Session Started:</span>
                                    <span className="value">{formatDateTime(session?.open_date)}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Current Sales:</span>
                                    <span className="value highlight">{formatCurrency(session?.total_sales || 0)}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Orders Completed:</span>
                                    <span className="value">{session?.order_count || 0}</span>
                                </div>
                            </div>

                            <div className="closing-balance-section">
                                <label htmlFor="closingBalance">
                                    <span className="label-icon">💵</span>
                                    Closing Cash Balance
                                </label>
                                <input
                                    id="closingBalance"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={closingBalance}
                                    onChange={(e) => setClosingBalance(e.target.value)}
                                    placeholder="Enter closing balance..."
                                />
                                <p className="help-text">Count and enter the total cash in the register</p>
                            </div>

                            {error && (
                                <div className="error-message">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}

                            <div className="warning-box">
                                <span className="warning-icon">⚠️</span>
                                <p>Closing the register will end your current session. You won't be able to take new orders until you open a new session.</p>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="btn-cancel" 
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-close-session" 
                                onClick={handleCloseSession}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Closing...
                                    </>
                                ) : (
                                    <>
                                        <span className="btn-icon">🔐</span>
                                        Close Register
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {step === 'summary' && sessionSummary && (
                    <>
                        <div className="modal-header success">
                            <span className="modal-icon">✅</span>
                            <h2>Session Closed</h2>
                        </div>

                        <div className="modal-body">
                            <div className="receipt-container">
                                <div className="receipt-header">
                                    <h3>📋 Session Summary</h3>
                                    <p className="receipt-date">{formatDateTime(sessionSummary.close_date)}</p>
                                </div>

                                <div className="receipt-section">
                                    <div className="receipt-row">
                                        <span>Terminal:</span>
                                        <span>{sessionSummary.pos_terminal}</span>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Cashier:</span>
                                        <span>{sessionSummary.responsible_user}</span>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Session Duration:</span>
                                        <span>{formatDateTime(sessionSummary.open_date)} - {formatDateTime(sessionSummary.close_date)}</span>
                                    </div>
                                </div>

                                <div className="receipt-divider"></div>

                                <div className="receipt-section sales-breakdown">
                                    <h4>💰 Sales by Payment Method</h4>
                                    
                                    <div className="payment-breakdown-item">
                                        <div className="payment-type">
                                            <span className="payment-icon cash">💵</span>
                                            <span>Cash</span>
                                        </div>
                                        <div className="payment-details">
                                            <span className="orders-count">{sessionSummary.sales_by_payment_method.cash_orders} orders</span>
                                            <span className="amount">{formatCurrency(sessionSummary.sales_by_payment_method.total_cash_sales)}</span>
                                        </div>
                                    </div>

                                    <div className="payment-breakdown-item">
                                        <div className="payment-type">
                                            <span className="payment-icon digital">💳</span>
                                            <span>Digital/Card</span>
                                        </div>
                                        <div className="payment-details">
                                            <span className="orders-count">{sessionSummary.sales_by_payment_method.digital_orders} orders</span>
                                            <span className="amount">{formatCurrency(sessionSummary.sales_by_payment_method.total_digital_sales)}</span>
                                        </div>
                                    </div>

                                    <div className="payment-breakdown-item">
                                        <div className="payment-type">
                                            <span className="payment-icon upi">📱</span>
                                            <span>UPI</span>
                                        </div>
                                        <div className="payment-details">
                                            <span className="orders-count">{sessionSummary.sales_by_payment_method.upi_orders} orders</span>
                                            <span className="amount">{formatCurrency(sessionSummary.sales_by_payment_method.total_upi_sales)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="receipt-divider"></div>

                                <div className="receipt-section totals">
                                    <div className="receipt-row summary-row">
                                        <span>Total Orders:</span>
                                        <span className="total-value">{sessionSummary.total_orders}</span>
                                    </div>
                                    <div className="receipt-row grand-total">
                                        <span>Total Sales:</span>
                                        <span className="total-value">{formatCurrency(sessionSummary.total_sales)}</span>
                                    </div>
                                    <div className="receipt-row">
                                        <span>Closing Balance:</span>
                                        <span>{formatCurrency(sessionSummary.closing_balance)}</span>
                                    </div>
                                </div>

                                <div className="receipt-footer">
                                    <p>✨ Great work today! ✨</p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions single">
                            <button className="btn-done" onClick={handleDone}>
                                <span className="btn-icon">🏠</span>
                                Return to Dashboard
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CloseRegisterModal;
