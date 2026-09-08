import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Globe, Bell, User, Search, ShieldAlert, ArrowUpRight, 
  AlertTriangle, PackageX, ShoppingBag, Clock, Check, 
  RefreshCw, ExternalLink 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AdminHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Estado das notificações reais
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('livios_read_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);

  // Mapeamento de títulos de páginas do Admin
  const pageTitles = {
    '/admin': { title: 'Dashboard Geral', subtitle: 'Visão executiva de faturamento, vendas e estoque em tempo real.' },
    '/admin/produtos': { title: 'Gestão de Produtos', subtitle: 'Cadastre, edite e organize o catálogo de molhos e kits.' },
    '/admin/estoque': { title: 'Controle de Estoque', subtitle: 'Monitore unidades disponíveis e movimentações de inventário.' },
    '/admin/estoque/lista-espera': { title: 'Lista de Espera', subtitle: 'Clientes cadastrados aguardando aviso de reposição de itens.' },
    '/admin/pedidos': { title: 'Gestão de Pedidos', subtitle: 'Acompanhe o fluxo de aprovação, separação e envio de encomendas.' },
    '/admin/crm': { title: 'CRM & Central de Clientes', subtitle: 'Histórico de consumo, engajamento e métricas de compradores.' },
    '/admin/crm/segmentos': { title: 'Segmentação de Clientes', subtitle: 'Agrupamentos estratégicos de compradores (VIP, Recorrentes, Inativos).' },
    '/admin/categorias': { title: 'Linhas & Categorias', subtitle: 'Organize as linhas Fine Recipe, PET e Kits Promocionais.' },
    '/admin/marketing': { title: 'Central de Marketing', subtitle: 'Controle de tráfego, campanhas, pop-ups e barras promocionais.' },
    '/admin/marketing/campanhas': { title: 'Campanhas & Ofertas', subtitle: 'Crie promoções sazonais, combos e descontos relâmpago.' },
    '/admin/marketing/popups': { title: 'Pop-ups Promocionais', subtitle: 'Gerencie modais interativos e banners de captura de clientes.' },
    '/admin/marketing/barras': { title: 'Barras do Topo', subtitle: 'Alertas no topo do site para avisos de frete grátis e promoções.' },
    '/admin/banners': { title: 'Banners da Home', subtitle: 'Edite os banners interativos e frases da página inicial.' },
    '/admin/receitas': { title: 'Receitas & Harmonizações', subtitle: 'Publique dicas culinárias e harmonizações com molhos Livio\'s Food.' },
    '/admin/cupons': { title: 'Cupons de Desconto', subtitle: 'Crie cupons promocionais e regras de frete grátis.' },
    '/admin/configuracoes': { title: 'Configurações da Loja', subtitle: 'Parâmetros institucionais, gateways de pagamento, taxas e SEO.' }
  };

  const currentPage = pageTitles[location.pathname] || { title: 'Painel Administrativo', subtitle: 'Gerenciamento do e-commerce Livio\'s Food Innovation.' };

  // Buscar notificações reais da API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          
          // Calcular não lidas com base no localStorage
          const unread = data.notifications.filter(n => !readIds.includes(n.id)).length;
          setUnreadCount(unread);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar notificações do admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Polling a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [readIds]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    setUnreadCount(0);
    try {
      localStorage.setItem('livios_read_notifications', JSON.stringify(allIds));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = (notif) => {
    // Marcar esta como lida
    if (!readIds.includes(notif.id)) {
      const updated = [...readIds, notif.id];
      setReadIds(updated);
      setUnreadCount(Math.max(0, unreadCount - 1));
      try {
        localStorage.setItem('livios_read_notifications', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'danger':
        return <PackageX size={18} color="#E53E3E" />;
      case 'warning':
        return <AlertTriangle size={18} color="#D69E2E" />;
      case 'info':
        return <ShoppingBag size={18} color="#3182CE" />;
      case 'gold':
        return <Clock size={18} color="var(--accent-gold, #D4AF37)" />;
      default:
        return <Bell size={18} color="var(--primary-burgundy)" />;
    }
  };

  return (
    <header className="admin-header-bar">
      <div>
        <h1 className="admin-header-title">{currentPage.title}</h1>
        <p className="admin-header-subtitle">{currentPage.subtitle}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Ver Loja Pública */}
        <Link to="/" target="_blank" className="btn btn-outline" style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem', height: '40px' }}>
          <Globe size={16} /> Loja Pública <ArrowUpRight size={14} />
        </Link>

        {/* Notificações Reais com Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            title="Notificações e Alertas"
            aria-label="Notificações"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isOpen ? 'var(--primary-burgundy)' : '#FFF',
              border: `1px solid ${isOpen ? 'var(--primary-burgundy)' : 'var(--light-border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isOpen ? '#FFF' : 'var(--text-dark)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: isOpen ? '0 4px 12px rgba(139, 0, 0, 0.25)' : 'none'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '9px',
                  background: 'var(--primary-burgundy, #8B0000)',
                  border: '2px solid #FFF',
                  color: '#FFF',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Painel Dropdown de Alertas */}
          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: '-10px',
                width: '360px',
                maxWidth: '90vw',
                background: '#FFFFFF',
                borderRadius: '16px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'fadeInDown 0.2s ease-out'
              }}
            >
              {/* Header do Dropdown */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  background: 'linear-gradient(135deg, #2D0505 0%, var(--primary-burgundy) 100%)',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Central de Alertas</span>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          background: 'rgba(255, 255, 255, 0.2)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 600
                        }}
                      >
                        {unreadCount} novos
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                    Estoque, pedidos e avisos em tempo real
                  </div>
                </div>

                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  title="Atualizar alertas"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    color: '#FFF',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <RefreshCw size={14} className={loading ? 'spin' : ''} />
                </button>
              </div>

              {/* Lista de Notificações */}
              <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#F0FFF4',
                        color: '#38A169',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px auto'
                      }}
                    >
                      <Check size={24} />
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-dark)', fontSize: '0.9rem' }}>
                      Tudo em ordem!
                    </div>
                    <p style={{ fontSize: '0.8rem', marginTop: '4px', margin: 0 }}>
                      Nenhum alerta crítico de estoque ou pedidos pendentes no momento.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isRead = readIds.includes(n.id);
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '0.9rem 1.15rem',
                          borderBottom: '1px solid #F0F0F0',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '12px',
                          background: isRead ? '#FFFFFF' : '#FFF9F5',
                          transition: 'background 0.15s ease',
                          alignItems: 'flex-start'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F7FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = isRead ? '#FFFFFF' : '#FFF9F5')}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: '#F7FAFC',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {getNotificationIcon(n.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontWeight: isRead ? 600 : 700, fontSize: '0.84rem', color: 'var(--text-dark)' }}>
                              {n.title}
                            </span>
                            {!isRead && (
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: 'var(--primary-burgundy)',
                                  flexShrink: 0
                                }}
                              />
                            )}
                          </div>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>
                            {n.message}
                          </p>
                          <div style={{ marginTop: '6px', fontSize: '0.7rem', color: 'var(--primary-burgundy)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Ver detalhes <ExternalLink size={11} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer do Dropdown */}
              {notifications.length > 0 && (
                <div
                  style={{
                    padding: '0.75rem 1.15rem',
                    background: '#F8F9FA',
                    borderTop: '1px solid #E9ECEF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem'
                  }}
                >
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: unreadCount > 0 ? 'var(--primary-burgundy)' : 'var(--text-muted)',
                      fontWeight: 600,
                      cursor: unreadCount > 0 ? 'pointer' : 'default',
                      padding: 0
                    }}
                  >
                    Marcar todas como lidas
                  </button>
                  <Link
                    to="/admin/estoque"
                    onClick={() => setIsOpen(false)}
                    style={{
                      color: 'var(--text-dark)',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    Ir para Estoque →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Perfil Admin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--light-border)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-burgundy), #5A0000)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
          <div className="hide-mobile">
            <div style={{ fontWeight: 'bold', fontSize: '0.88rem', color: 'var(--text-dark)', lineHeight: '1.2' }}>
              {user?.name || 'Administrador'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {user?.roleName || 'Super Admin'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

