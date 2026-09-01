import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart, BellRing, Columns3, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext.jsx';
import { useWishlist } from '../contexts/WishlistContext.jsx';
import { useCompare } from '../contexts/CompareContext.jsx';
import WaitlistModal from './WaitlistModal.jsx';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { toggleCompare, isComparing } = useCompare();

  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const isFavorite = isInWishlist(product.id);
  const comparing = isComparing(product.id);
  const price = product.promotionalPrice || product.price;
  const oldPrice = product.promotionalPrice ? product.price : null;
  const isOutOfStock = product.stock <= 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(139, 0, 0, 0.15)' }}
        transition={{ duration: 0.3 }}
        className="product-card"
      >
        {/* Badges */}
        <div className="product-badges">
          {product.isBestSeller && <span className="badge badge-bestseller">Mais Vendido</span>}
          {product.isOffer && <span className="badge badge-offer">Oferta</span>}
          {product.isNew && <span className="badge badge-new">Novo</span>}
          {isOutOfStock && <span className="badge" style={{ background: '#EF4444', color: '#FFF' }}>Esgotado</span>}
        </div>

        {/* Botão Comparar & Favorito */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px', zIndex: 10 }}>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.preventDefault(); toggleCompare(product); }}
            style={{
              background: comparing ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.9)',
              color: comparing ? '#000' : '#444',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            title={comparing ? "Remover da comparação" : "Adicionar para comparar"}
          >
            {comparing ? <Check size={16} /> : <Columns3 size={15} />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
            className={`product-fav-btn ${isFavorite ? 'active' : ''}`}
            style={{ position: 'static' }}
            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart size={16} fill={isFavorite ? "var(--primary-burgundy)" : "none"} color={isFavorite ? "var(--primary-burgundy)" : "#777"} />
          </motion.button>
        </div>

        {/* Imagem do Produto */}
        <Link to={`/produto/${product.slug}`} className="product-img-wrap">
          <motion.img
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4 }}
            src={product.images && product.images[0] && !product.images[0].includes('header-bg') ? product.images[0] : "https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?auto=format&fit=crop&w=800&q=80"}
            alt={product.name}
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?auto=format&fit=crop&w=800&q=80";
            }}
            loading="lazy"
          />
        </Link>

        {/* Corpo do Card */}
        <div className="product-card-body">
          <div className="product-rating">
            {product.reviewCount > 0 ? (
              <>
                <Star size={14} fill="#F59E0B" />
                <span>{product.rating}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({product.reviewCount})</span>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Sem avaliações ainda</span>
            )}
          </div>

          <Link to={`/produto/${product.slug}`}>
            <h3 className="product-title">{product.name}</h3>
          </Link>

          <p className="product-desc">{product.shortDescription}</p>

          {/* Rodapé com Preço e Botão Adicionar ou Avise-me */}
          <div className="product-card-footer">
            <div className="product-price-wrap">
              {oldPrice && <span className="price-old">R$ {oldPrice.toFixed(2).replace('.', ',')}</span>}
              <span className="price-current">R$ {price.toFixed(2).replace('.', ',')}</span>
            </div>

            {isOutOfStock ? (
              <button
                onClick={() => setWaitlistOpen(true)}
                className="btn btn-gold"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.78rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <BellRing size={14} /> AVISE-ME
              </button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => addToCart(product, 1)}
                className="btn btn-primary"
                style={{ padding: '0.55rem 0.95rem', fontSize: '0.85rem' }}
              >
                <ShoppingBag size={16} /> Adicionar
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modal Lista de Espera */}
      <WaitlistModal product={product} isOpen={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </>
  );
}
