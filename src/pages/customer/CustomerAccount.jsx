import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Heart, Shield, LogOut, Clock, CheckCircle2, Truck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useWishlist } from '../../contexts/WishlistContext.jsx';
import { useCart } from '../../contexts/CartContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import ProductCard from '../../components/ProductCard.jsx';
import { RefreshCw } from 'lucide-react';

export default function CustomerAccount() {
  const { user, logout, updateUserProfile } = useAuth();
  const { wishlist } = useWishlist();
  const { addToCart, setIsDrawerOpen } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders'); // orders, profile, addresses, wishlist, security
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const handleReorder = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/reorder`, { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        let addedCount = 0;
        d.availableItems.forEach(it => {
          addToCart(it, it.quantity);
          addedCount += it.quantity;
        });

        if (addedCount > 0) {
          addToast(`${addedCount} produto(s) adicionados ao carrinho!`, "success");
        }

        if (d.unavailableItems && d.unavailableItems.length > 0) {
          addToast(`${d.unavailableItems.length} produto(s) do pedido estão indisponíveis no momento.`, "warning");
        }

        setIsDrawerOpen(true);
        navigate('/carrinho');
      }
    } catch (err) {
      addToast("Erro ao processar a recompra.", "error");
    }
  };

  // Form perfil
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    cpf: user?.cpf || ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetch(`/api/orders?customerId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setMyOrders(data.orders);
      })
      .finally(() => setLoadingOrders(false));
  }, [user]);

  if (!user) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    await updateUserProfile(profileForm);
  };

  return (
    <div style={{ padding: '3rem 0', background: 'var(--light-bg)', minHeight: '85vh' }}>
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)' }}>
            Minha Conta
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Bem-vindo(a), <strong>{user.name}</strong>! Gerencie seus pedidos, dados e preferências.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem' }}>
          {/* Menu Lateral da Conta */}
          <aside style={{ background: '#FFF', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', height: 'fit-content' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => setActiveTab('orders')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: activeTab === 'orders' ? 'var(--primary-burgundy)' : 'transparent',
                  color: activeTab === 'orders' ? '#FFF' : 'var(--text-dark)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.92rem'
                }}
              >
                <Package size={18} /> Meus Pedidos ({myOrders.length})
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: activeTab === 'profile' ? 'var(--primary-burgundy)' : 'transparent',
                  color: activeTab === 'profile' ? '#FFF' : 'var(--text-dark)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.92rem'
                }}
              >
                <User size={18} /> Meus Dados Cadastrais
              </button>

              <button
                onClick={() => setActiveTab('wishlist')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: activeTab === 'wishlist' ? 'var(--primary-burgundy)' : 'transparent',
                  color: activeTab === 'wishlist' ? '#FFF' : 'var(--text-dark)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.92rem'
                }}
              >
                <Heart size={18} /> Favoritos ({wishlist.length})
              </button>

              <button
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'transparent',
                  color: '#EF4444',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                  marginTop: '1rem'
                }}
              >
                <LogOut size={18} /> Sair da Conta
              </button>
            </div>
          </aside>

          {/* Conteúdo Principal */}
          <main style={{ background: '#FFF', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', boxShadow: 'var(--shadow-sm)' }}>
            {/* MEUS PEDIDOS */}
            {activeTab === 'orders' && (
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
                  Histórico de Pedidos
                </h3>

                {loadingOrders ? (
                  <div>Carregando seus pedidos...</div>
                ) : myOrders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                    <Package size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Você ainda não realizou nenhum pedido em nossa loja.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {myOrders.map(ord => (
                      <div key={ord.id} style={{ border: '1px solid var(--light-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', background: '#FAF8F5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '0.75rem' }}>
                          <div>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--primary-burgundy)' }}>Pedido #{ord.id}</strong>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                              Realizado em {new Date(ord.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          <span style={{ background: 'var(--primary-burgundy)', color: '#FFF', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: 'bold', fontSize: '0.82rem' }}>
                            {ord.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Itens */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                          {ord.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                              <span>{item.quantity}x {item.name}</span>
                              <span style={{ fontWeight: 'bold' }}>R$ {item.totalPrice.toFixed(2).replace('.', ',')}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--light-border)', paddingTop: '0.75rem', fontWeight: 'bold' }}>
                          <div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total: </span>
                            <span style={{ color: 'var(--primary-burgundy)', fontSize: '1.2rem' }}>R$ {ord.total.toFixed(2).replace('.', ',')}</span>
                          </div>

                          <button
                            onClick={() => handleReorder(ord.id)}
                            className="btn btn-gold"
                            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <RefreshCw size={16} /> COMPRAR NOVAMENTE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* DADOS CADASTRAIS */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} style={{ maxWidth: '500px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
                  Meus Dados Cadastrais
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nome Completo</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>E-mail (Login)</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', background: '#F0ECE4' }}
                  />
                </div>

                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Telefone</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>CPF</label>
                    <input
                      type="text"
                      value={profileForm.cpf}
                      onChange={(e) => setProfileForm({ ...profileForm, cpf: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  SALVAR ALTERAÇÕES
                </button>
              </form>
            )}

            {/* FAVORITOS */}
            {activeTab === 'wishlist' && (
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
                  Meus Produtos Favoritos
                </h3>
                {wishlist.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>Você ainda não marcou nenhum produto como favorito.</p>
                ) : (
                  <div className="grid-3">
                    {wishlist.map(p => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
