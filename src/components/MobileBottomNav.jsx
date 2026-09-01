import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingBag, Heart, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext.jsx';
import { useWishlist } from '../contexts/WishlistContext.jsx';

export default function MobileBottomNav() {
  const location = useLocation();
  const { getItemCount, setIsDrawerOpen } = useCart();
  const { wishlist } = useWishlist();

  const cartCount = getItemCount();

  return (
    <div className="mobile-bottom-nav">
      <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <Home size={20} />
        <span>Início</span>
      </Link>

      <Link to="/produtos" className={`mobile-nav-item ${location.pathname === '/produtos' ? 'active' : ''}`}>
        <Grid size={20} />
        <span>Catálogo</span>
      </Link>

      <button onClick={() => setIsDrawerOpen(true)} className="mobile-nav-item mobile-cart-btn">
        <div style={{ position: 'relative' }}>
          <ShoppingBag size={22} />
          {cartCount > 0 && <span className="mobile-badge">{cartCount}</span>}
        </div>
        <span>Carrinho</span>
      </button>

      <Link to="/favoritos" className={`mobile-nav-item ${location.pathname === '/favoritos' ? 'active' : ''}`}>
        <div style={{ position: 'relative' }}>
          <Heart size={20} />
          {wishlist.length > 0 && <span className="mobile-badge">{wishlist.length}</span>}
        </div>
        <span>Favoritos</span>
      </Link>

      <Link to="/minha-conta" className={`mobile-nav-item ${location.pathname === '/minha-conta' ? 'active' : ''}`}>
        <User size={20} />
        <span>Conta</span>
      </Link>
    </div>
  );
}
