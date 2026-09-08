import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, CheckCircle2, Sparkles, Truck, Flame, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext.jsx';

export default function CartDrawer() {
  const { 
    items, 
    isDrawerOpen, 
    setIsDrawerOpen, 
    updateQuantity, 
    removeFromCart, 
    addToCart,
    getSubtotal,
    getRemainingForFreeShipping,
    getFreeShippingPercent
  } = useCart();
  const navigate = useNavigate();
  const [upsellProducts, setUpsellProducts] = useState([]);

  useEffect(() => {
    if (isDrawerOpen) {
      fetch('/api/products')
        .then(res => res.json())
        .then(d => {
          if (d.success && d.products) {
            setUpsellProducts(d.products.filter(p => p.active && p.stock > 0));
          }
        })
        .catch(() => {});
    }
  }, [isDrawerOpen]);

  const remainingFreeShip = getRemainingForFreeShipping ? getRemainingForFreeShipping() : 0;
  const freeShipPercent = getFreeShippingPercent ? getFreeShippingPercent() : 0;

  // Encontra um produto de upsell que ainda não esteja no carrinho
  const bumpOffer = upsellProducts.find(p => !items.some(it => it.id === p.id));

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Overlay Escuro Animado */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsDrawerOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          />

          {/* Painel Lateral com Slide In Smooth */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '440px',
              height: '100%',
              background: '#FFF',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-12px 0 40px rgba(0,0,0,0.3)',
              zIndex: 1001
            }}
          >
            {/* Cabeçalho do Drawer */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--light-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--light-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 'bold', fontSize: '1.15rem', color: 'var(--primary-burgundy)', fontFamily: 'var(--font-serif)' }}>
                <ShoppingBag size={22} /> Meu Carrinho ({items.reduce((acc, i) => acc + i.quantity, 0)})
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Barra Dinâmica de Frete Grátis com Meta Visual */}
            {items.length > 0 && (
              <div style={{ padding: '0.85rem 1.5rem', background: '#FAF8F5', borderBottom: '1px solid var(--light-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  {remainingFreeShip === 0 ? (
                    <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                      <CheckCircle2 size={16} /> 🎉 Parabéns! Você ganhou <strong>FRETE GRÁTIS</strong>!
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Truck size={15} color="var(--primary-burgundy)" />
                      Faltam <strong style={{ color: 'var(--primary-burgundy)' }}>R$ {remainingFreeShip.toFixed(2).replace('.', ',')}</strong> para <strong>Frete Grátis</strong>
                    </span>
                  )}
                  <span style={{ color: freeShipPercent === 100 ? '#16A34A' : '#64748B', fontWeight: 800, fontSize: '0.78rem' }}>{freeShipPercent}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${freeShipPercent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ 
                      height: '100%', 
                      background: freeShipPercent === 100 ? '#16A34A' : 'linear-gradient(90deg, var(--accent-gold) 0%, var(--primary-burgundy) 100%)', 
                      borderRadius: '4px'
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Lista de Itens */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', padding: '2rem 0' }}>
                  <ShoppingBag size={64} color="var(--primary-burgundy)" style={{ marginBottom: '1rem', opacity: 0.6 }} />
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>Seu carrinho está vazio</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Navegue por nossas linhas de molhos especiais e escolha seus sabores favoritos!</p>
                  <button
                    onClick={() => { setIsDrawerOpen(false); navigate('/produtos'); }}
                    className="btn btn-primary"
                  >
                    VER NOSSOS PRODUTOS
                  </button>
                </div>
              ) : (
                <>
                  {items.map(item => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      key={item.id}
                      style={{ display: 'flex', gap: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid #F0ECE4' }}
                    >
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?auto=format&fit=crop&w=400&q=80"}
                        alt={item.name}
                        style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: '#F8F6F0' }}
                      />
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.92rem', marginBottom: '4px', lineHeight: '1.2' }}>{item.name}</div>
                        <div style={{ fontSize: '0.92rem', color: 'var(--primary-burgundy)', fontWeight: '800', marginBottom: '6px' }}>
                          R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--light-border)', borderRadius: 'var(--radius-sm)' }}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              style={{ padding: '3px 7px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            >
                              <Minus size={13} />
                            </button>
                            <span style={{ padding: '0 8px', fontSize: '0.82rem', fontWeight: 'bold' }}>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              style={{ padding: '3px 7px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                            title="Remover produto"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* ONE-CLICK BUMP OFFER / CROSS-SELL NO CARRINHO */}
                  {bumpOffer && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ 
                        background: '#FAF8F4', 
                        border: '1.5px dashed var(--accent-gold)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '0.85rem',
                        marginTop: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-gold-hover)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        <Sparkles size={14} /> Oferta Especial para seu Pedido
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <img 
                          src={bumpOffer.images && bumpOffer.images[0] ? bumpOffer.images[0] : '/header-bg.jpg'} 
                          alt={bumpOffer.name} 
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} 
                        />
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {bumpOffer.name}
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary-burgundy)' }}>
                            R$ {(bumpOffer.promotionalPrice || bumpOffer.price).toFixed(2).replace('.', ',')}
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(bumpOffer, 1)}
                          className="btn btn-gold"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}
                        >
                          <Plus size={13} /> ADICIONAR
                        </button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* Rodapé do Drawer */}
            {items.length > 0 && (
              <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--light-border)', background: 'var(--light-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', fontSize: '1.05rem', fontWeight: 'bold' }}>
                  <span>Subtotal:</span>
                  <span style={{ color: 'var(--primary-burgundy)', fontSize: '1.35rem', fontWeight: '800' }}>
                    R$ {getSubtotal().toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <button
                    onClick={() => { setIsDrawerOpen(false); navigate('/carrinho'); }}
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '0.65rem' }}
                  >
                    VER CARRINHO COMPLETO
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setIsDrawerOpen(false); navigate('/checkout'); }}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem', fontSize: '0.98rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    FINALIZAR COMPRA <ArrowRight size={18} />
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
