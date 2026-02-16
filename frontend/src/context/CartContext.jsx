import { createContext, useState, useContext } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState(null);

    const addItem = (item) => {
        const existingItemIndex = cart.findIndex(
            cartItem => cartItem.product_id === item.product_id
        );

        if (existingItemIndex > -1) {
            const newCart = [...cart];
            newCart[existingItemIndex].quantity += item.quantity;
            setCart(newCart);
        } else {
            setCart([...cart, item]);
        }
    };

    const removeItem = (index) => {
        setCart(cart.filter((_, i) => i !== index));
    };

    const updateQuantity = (index, quantity) => {
        if (quantity <= 0) {
            removeItem(index);
            return;
        }
        const newCart = [...cart];
        newCart[index].quantity = quantity;
        setCart(newCart);
    };

    const clearCart = () => {
        setCart([]);
        setCustomer(null);
    };

    const subtotal = cart.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0);

    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + tax;

    const value = {
        cart,
        customer,
        setCustomer,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        tax,
        total,
        itemCount: cart.length
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};
