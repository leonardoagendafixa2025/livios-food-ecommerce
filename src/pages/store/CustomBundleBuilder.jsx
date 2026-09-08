import React, { useState, useEffect } from 'react';
import { ShoppingBag, Check, Plus, Trash2, Sparkles, Flame, Gift, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import ScovilleMeter from '../../components/ScovilleMeter.jsx';

export default function CustomBundleBuilder() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [boxSize, setBoxSize] = useState(3); // 3 ou 4 molhos
  const [selectedItems, setSelectedItems] = useState([]);

  const { addToCart, setIsDrawerOpen } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.products) {
          setProducts(d.products.filter(p => p.active));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectBoxSize = (size) => {
    setBoxSize(size);
    if (selectedItems.length > size) {
      setSelectedItems(prev => prev.slice(0, size));
    }
  };

  const handleAddProductToBox = (product) => {
    if (selectedItems.length >= boxSize) {
      addToast(`Sua caixa de ${boxSize} molhos já está cheia! Remova um item para trocar.`, 'warning');
      return;
    }
    setSelectedItems(prev => [...prev, product]);
    addToast(`"${product.name}" adicionado à sua caixa!`, 'success');
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const rawTotal = selectedItems.reduce((acc, p) => acc + (p.promotionalPrice || p.price), 0);
  const discountPercent = boxSize === 3 ? 10 : 15;
  const discountAmount = rawTotal * (discountPercent / 100);
  const finalPrice = rawTotal - discountAmount;
  const isComplete = selectedItems.length === boxSize;

  const handleAddBundleToCart = () => {
    if (!isComplete) {
      addToast(`Por favor, complete a seleção de ${boxSize} molhos antes de adicionar ao carrinho.`, 'warning');
      return;
    }

    const bundleItem = {
      id: `bundle_${Date.now()}`,
      name: `🎁 Kit Degustação Personalizado (${boxSize} Molhos)`,
      price: finalPrice,
      promotionalPrice: finalPrice,
      images: [selectedItems[0]?.images?.[0] || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'],
      stock: 99,
      shortDescription: `Sabores selecionados: ${selectedItems.map(i => i.name).join(' + ')}`
    };

    addToCart(bundleItem, 1);
    addToast(`Kit Degustação Personalizado adicionado ao carrinho com ${discountPercent}% de desconto!`, 'success');
    setIsDrawerOpen(true);
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando sabores disponíveis...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span style={{ color: 'var(--accent-gold-hover)', fontWeight: '800', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} /> EXPERIÊNCIA GOURMET EXCLUSIVA
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)', marginTop: '6px' }}>
          Monte seu Kit Degustação Personalizado
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '680px', margin: '0.5rem auto 0' }}>
          Escolha os molhos artesanais de sua preferência para compor sua caixa de degustação com desconto progressivo especial e embalagem premium.
        </p>
      </div>

      {/* Escolha do Tamanho da Caixa */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleSelectBoxSize(3)}
          style={{
            padding: '1rem 2rem',
            borderRadius: 'var(--radius-lg)',
            border: boxSize === 3 ? '2px solid var(--primary-burgundy)' : '1px solid var(--light-border)',
            background: boxSize === 3 ? 'rgba(139, 0, 0, 0.04)' : '#FFF',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: boxSize === 3 ? 'var(--shadow-md)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-dark)' }}>Caixa Trio (3 Molhos)</div>
              <div style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 'bold' }}>10% de Desconto Imediato</div>
            </div>
            {boxSize === 3 && <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-burgundy)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} /></div>}
          </div>
        </button>

        <button
          onClick={() => handleSelectBoxSize(4)}
          style={{
            padding: '1rem 2rem',
            borderRadius: 'var(--radius-lg)',
            border: boxSize === 4 ? '2px solid var(--accent-gold)' : '1px solid var(--light-border)',
            background: boxSize === 4 ? 'rgba(212, 175, 55, 0.08)' : '#FFF',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: boxSize === 4 ? 'var(--shadow-md)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-dark)' }}>Caixa Quarteto (4 Molhos)</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-gold-hover)', fontWeight: 'bold' }}>15% OFF + Frete Grátis 🎉</div>
            </div>
            {boxSize === 4 && <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={14} /></div>}
          </div>
        </button>
      </div>

      {/* Caixa Visual Interativa (Slots) */}
      <div style={{ background: '#FAF8F4', border: '2px solid var(--accent-gold)', borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '3rem', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--accent-gold-hover)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              SUA CAIXA PERSONALIZADA ({selectedItems.length}/{boxSize})
            </span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-serif)', marginTop: '2px' }}>
              {isComplete ? '🎉 Caixa Completa! Pronta para o carrinho' : `Selecione mais ${boxSize - selectedItems.length} molho(s) abaixo`}
            </h3>
          </div>

          <div style={{ textAlign: 'right' }}>
            {rawTotal > 0 && (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                De R$ {rawTotal.toFixed(2).replace('.', ',')}
              </div>
            )}
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-burgundy)' }}>
              R$ {finalPrice.toFixed(2).replace('.', ',')}
            </div>
          </div>
        </div>

        {/* Grid de Slots da Caixa */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${boxSize}, 1fr)`, gap: '1.5rem', marginBottom: '1.75rem' }}>
          {[...Array(boxSize)].map((_, idx) => {
            const item = selectedItems[idx];
            return (
              <div
                key={idx}
                style={{
                  minHeight: '220px',
                  borderRadius: 'var(--radius-md)',
                  border: item ? '1.5px solid var(--accent-gold)' : '2px dashed #CBD5E1',
                  background: item ? '#FFF' : 'rgba(255,255,255,0.6)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  textAlign: 'center',
                  boxShadow: item ? '0 8px 20px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                {item ? (
                  <>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Remover do kit"
                    >
                      <Trash2 size={13} />
                    </button>
                    <img
                      src={item.images?.[0] || '/header-bg.jpg'}
                      alt={item.name}
                      style={{ width: '80px', height: '90px', objectFit: 'contain', marginBottom: '0.75rem' }}
                    />
                    <div style={{ fontWeight: 'bold', fontSize: '0.88rem', color: 'var(--text-dark)', lineHeight: '1.2', marginBottom: '4px' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary-burgundy)', fontWeight: '800' }}>
                      R$ {(item.promotionalPrice || item.price).toFixed(2).replace('.', ',')}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#94A3B8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <Plus size={32} style={{ opacity: 0.5 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Espaço #{idx + 1} Vazio</span>
                    <span style={{ fontSize: '0.75rem' }}>Escolha um sabor abaixo</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botão de Finalização do Kit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAddBundleToCart}
            disabled={!isComplete}
            className="btn btn-primary"
            style={{
              padding: '0.95rem 2rem',
              fontSize: '1rem',
              opacity: isComplete ? 1 : 0.6,
              cursor: isComplete ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShoppingBag size={18} /> ADICIONAR KIT AO CARRINHO ({discountPercent}% OFF)
          </motion.button>
        </div>
      </div>

      {/* Catálogo de Sabores para Seleção */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
          Escolha os Sabores para sua Caixa
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Clique em "+ Adicionar ao Kit" para preencher os espaços disponíveis.
        </p>
      </div>

      <div className="grid-3">
        {products.map(product => {
          const isSelected = selectedItems.some(i => i.id === product.id);
          const countInBox = selectedItems.filter(i => i.id === product.id).length;

          return (
            <div key={product.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0 }}>
              <div>
                <img
                  src={product.images?.[0] || '/header-bg.jpg'}
                  alt={product.name}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{product.volumeMl || 250}ml</span>
                  <ScovilleMeter heatLevel={product.heatLevel} compact={true} showLabel={true} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-dark)', marginBottom: '6px', lineHeight: '1.3' }}>
                  {product.name}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '1rem' }}>
                  {product.shortDescription}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0ECE4', paddingTop: '0.85rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary-burgundy)' }}>
                  R$ {(product.promotionalPrice || product.price).toFixed(2).replace('.', ',')}
                </span>

                <button
                  onClick={() => handleAddProductToBox(product)}
                  className="btn btn-gold"
                  style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={15} /> Adicionar ao Kit {countInBox > 0 && `(${countInBox})`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
