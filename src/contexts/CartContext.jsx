import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext.jsx';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('livios_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [coupon, setCoupon] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    localStorage.setItem('livios_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      const price = product.promotionalPrice || product.price;
      const image = product.images && product.images[0] ? product.images[0] : '';
      
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        price,
        image,
        quantity
      }];
    });

    addToast(`"${product.name}" adicionado ao carrinho!`, 'success');
    setIsDrawerOpen(true);
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const removeFromCart = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
    addToast('Item removido do carrinho.', 'info');
  };

  const clearCart = () => {
    setItems([]);
    setCoupon(null);
    setSelectedShipping(null);
  };

  const applyCoupon = async (code) => {
    const subtotal = getSubtotal();
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartSubtotal: subtotal })
      });
      const data = await res.json();
      if (data.success) {
        setCoupon(data.coupon);
        addToast(data.message, 'success');
        return true;
      } else {
        addToast(data.message, 'error');
        return false;
      }
    } catch (err) {
      addToast('Erro ao validar cupom.', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    addToast('Cupom removido.', 'info');
  };

  const getSubtotal = () => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  };

  const getDiscountAmount = () => {
    if (!coupon) return 0;
    return coupon.discountAmount || 0;
  };

  const getShippingFee = () => {
    if (!selectedShipping) return 0;
    return selectedShipping.isFree ? 0 : selectedShipping.price;
  };

  const getTotal = () => {
    const sub = getSubtotal();
    const disc = getDiscountAmount();
    const ship = getShippingFee();
    return Math.max(0, sub - disc + ship);
  };

  const getItemCount = () => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      coupon,
      applyCoupon,
      removeCoupon,
      selectedShipping,
      setSelectedShipping,
      getSubtotal,
      getDiscountAmount,
      getShippingFee,
      getTotal,
      getItemCount,
      isDrawerOpen,
      setIsDrawerOpen
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
