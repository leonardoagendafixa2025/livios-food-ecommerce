import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, Tag, Truck, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    coupon,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscountAmount,
    getShippingFee,
    getTotal,
    selectedShipping,
    setSelectedShipping
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [cepInput, setCepInput] = useState('');
  const [shippingOptions, setShippingOptions] = useState(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      await applyCoupon(couponInput.trim());
    }
  };

  const handleCalcShipping = async (e) => {
    e.preventDefault();
    if (!cepInput || cepInput.replace(/\D/g, '').length < 8) {
      addToast("Informe um CEP válido.", "error");
      return;
    }
    const sub = getSubtotal();
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: cepInput, items })
      });
      const data = await res.json();
      if (data.success) {
        setShippingOptions(data.options);
        setSelectedShipping(data.options[0]);
      }
    } catch (err) {
      addToast("Erro ao calcular frete.", "error");
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ padding: '6rem 0', background: 'var(--light-bg)', minHeight: '70vh', textAlign: 'center' }}>
        <div className="container">
          <ShoppingBag size={80} color="var(--primary-burgundy)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', marginBottom: '0.75rem' }}>
            Seu carrinho está vazio
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2rem' }}>
            Aproveite para rechear seu carrinho com nossos deliciosos molhos especiais agridoces!
          </p>
          <Link to="/produtos" className="btn btn-primary" style={{ padding: '0.9rem 2rem' }}>
            IR PARA O CATÁLOGO DE PRODUTOS
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 0', background: 'var(--light-bg)', minHeight: '80vh' }}>
      <div className="container">
        <h1 style={{ fontSize: '2.4rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)', marginBottom: '2rem' }}>
          Carrinho de Compras
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem' }}>
          {/* Tabela de Itens */}
          <div>
            <div style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Preço Unitário</th>
                    <th>Quantidade</th>
                    <th>Subtotal</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img
                            src={item.image || "https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?auto=format&fit=crop&w=400&q=80"}
                            alt={item.name}
                            style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: '#F8F6F0' }}
                          />
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-dark)' }}>{item.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SKU: {item.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>R$ {item.price.toFixed(2).replace('.', ',')}</td>
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--light-border)', borderRadius: 'var(--radius-sm)' }}>
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Minus size={14} />
                          </button>
                          <span style={{ padding: '0 10px', fontWeight: 'bold' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                      <td style={{ fontWeight: '800', color: 'var(--primary-burgundy)', fontSize: '1rem' }}>
                        R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </td>
                      <td>
                        <button onClick={() => removeFromCart(item.id)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ padding: '1.25rem 1.5rem', background: '#FAF8F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--light-border)' }}>
                <button onClick={clearCart} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Esvaziar Carrinho
                </button>
                <Link to="/produtos" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  CONTINUAR COMPRANDO
                </Link>
              </div>
            </div>
          </div>

          {/* Resumo da Compra */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Cupom de Desconto */}
            <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={18} color="var(--primary-burgundy)" /> Cupom de Desconto
              </h4>
              {coupon ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: '#059669', fontSize: '0.95rem' }}>{coupon.code}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#047857' }}>{coupon.description}</div>
                  </div>
                  <button onClick={removeCoupon} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 'bold' }}>
                    Remover
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Digite o cupom (ex: BEMVINDO10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    style={{ flexGrow: 1, padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', textTransform: 'uppercase' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                    Aplicar
                  </button>
                </form>
              )}
            </div>

            {/* Cálculo de Frete */}
            <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={18} color="var(--primary-burgundy)" /> Simular Frete
              </h4>
              <form onSubmit={handleCalcShipping} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Seu CEP (ex: 01310-100)"
                  value={cepInput}
                  onChange={(e) => setCepInput(e.target.value)}
                  style={{ flexGrow: 1, padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
                <button type="submit" className="btn btn-outline" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                  OK
                </button>
              </form>

              {shippingOptions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {shippingOptions.map(opt => (
                    <label key={opt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', border: '1px solid var(--light-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: selectedShipping?.id === opt.id ? 'rgba(139, 0, 0, 0.05)' : 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedShipping?.id === opt.id}
                          onChange={() => setSelectedShipping(opt)}
                        />
                        <span>{opt.name} ({opt.deadline})</span>
                      </div>
                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--primary-burgundy)' }}>
                        {opt.isFree ? "Grátis" : `R$ ${opt.price.toFixed(2).replace('.', ',')}`}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Totais do Pedido */}
            <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)', borderBottom: '1px solid var(--light-border)', paddingBottom: '0.75rem' }}>
                Resumo do Pedido
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>R$ {getSubtotal().toFixed(2).replace('.', ',')}</span>
                </div>

                {getDiscountAmount() > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 'bold' }}>
                    <span>Desconto ({coupon?.code})</span>
                    <span>- R$ {getDiscountAmount().toFixed(2).replace('.', ',')}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Frete</span>
                  <span>{getShippingFee() === 0 ? <strong style={{ color: '#059669' }}>Grátis</strong> : `R$ ${getShippingFee().toFixed(2).replace('.', ',')}`}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--light-border)', paddingTop: '0.85rem', fontSize: '1.3rem', fontWeight: '800' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary-burgundy)' }}>
                    R$ {getTotal().toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
              >
                FINALIZAR COMPRA <ArrowRight size={20} />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
