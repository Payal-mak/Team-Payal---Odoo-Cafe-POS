import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ShoppingBag, Coffee } from 'lucide-react';
import './CustomerDisplayPage.css';

const CustomerDisplayPage = () => {
    const { tableId } = useParams();
    const [currentOrder, setCurrentOrder] = useState(null);

    // Fetch current order for table
    const { data: orderData } = useQuery({
        queryKey: ['customer-display', tableId],
        queryFn: async () => {
            if (!tableId) return null;
            const response = await api.get(`/orders/table/${tableId}/current`);
            return response.data.data;
        },
        enabled: !!tableId,
        refetchInterval: 3000, // Refresh every 3 seconds
    });

    useEffect(() => {
        if (orderData) {
            setCurrentOrder(orderData);
        }
    }, [orderData]);

    const subtotal = currentOrder?.items?.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0) || 0;
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    return (
        <div className="customer-display">
            <div className="display-header">
                <div className="brand">
                    <Coffee size={48} />
                    <h1>Odoo Cafe</h1>
                </div>
                {currentOrder && (
                    <div className="order-number">
                        Order #{currentOrder.id}
                    </div>
                )}
            </div>

            <div className="display-content">
                {currentOrder && currentOrder.items && currentOrder.items.length > 0 ? (
                    <>
                        <div className="items-section">
                            <h2>Your Order</h2>
                            <div className="items-list">
                                {currentOrder.items.map((item, index) => (
                                    <div key={index} className="display-item">
                                        {item.image_url && (
                                            <div className="item-image">
                                                <img src={item.image_url} alt={item.product_name} />
                                            </div>
                                        )}
                                        <div className="item-details">
                                            <h3>{item.product_name}</h3>
                                            <p className="item-quantity">Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="item-price">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="totals-section">
                            <div className="total-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Tax (5%)</span>
                                <span>₹{tax.toFixed(2)}</span>
                            </div>
                            <div className="total-row grand-total">
                                <span>Grand Total</span>
                                <span>₹{total.toFixed(2)}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="welcome-section">
                        <ShoppingBag size={120} />
                        <h2>Welcome to Odoo Cafe!</h2>
                        <p>Your order will appear here once the cashier starts adding items.</p>
                        <div className="welcome-message">
                            <p>Enjoy our delicious menu!</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="display-footer">
                <p>Thank you for dining with us!</p>
            </div>
        </div>
    );
};

export default CustomerDisplayPage;
