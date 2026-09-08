import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Warehouse, ShoppingCart, Users, 
  FolderTree, Image, Tag, Settings, LogOut, Megaphone, 
  Sparkles, ChevronDown, Shield, BellRing, Layers, BookOpen,
  ArrowUpRight, Flame, Store, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AdminSidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [marketingOpen, setMarketingOpen] = useState(true);
  const [waitlistCount, setWaitlistCount] = useState(0);

  // Buscar contagem de clientes na lista de espera para badge dinâmico
  useEffect(() => {
    fetch('/api/admin/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.notifications)) {
          const wlNotif = data.notifications.find(n => n.id === 'waitlist_alert');
          if (wlNotif) {
            const match = wlNotif.title?.match(/\d+/);
            if (match) setWaitlistCount(parseInt(match[0]));
          }
        }
      })
      .catch(() => {});
  }, []);

  const sections = [
    {
      title: 'VISÃO GERAL',
      items: [
        { path: '/admin', label: 'Dashboard Geral', icon: LayoutDashboard }
      ]
    },
    {
      title: 'CATÁLOGO & ESTOQUE',
      items: [
        { path: '/admin/produtos', label: 'Produtos & Catálogo', icon: Package },
        { path: '/admin/estoque', label: 'Controle de Estoque', icon: Warehouse },
        { 
          path: '/admin/estoque/lista-espera', 
          label: 'Lista de Espera', 
          icon: BellRing, 
          badge: waitlistCount > 0 ? waitlistCount : null,
          badgeColor: 'var(--accent-gold)'
        },
        { path: '/admin/categorias', label: 'Linhas & Categorias', icon: FolderTree }
      ]
    },
    {
      title: 'VENDAS & CLIENTES',
      items: [
        { path: '/admin/pedidos', label: 'Pedidos de Venda', icon: ShoppingCart },
        { path: '/admin/crm', label: 'CRM & Clientes', icon: Users },
        { path: '/admin/crm/segmentos', label: 'Segmentos de Clientes', icon: Layers }
      ]
    }
  ];

  const marketingItems = [
    { path: '/admin/marketing', label: 'Visão Geral Marketing', icon: Sparkles },
    { path: '/admin/marketing/campanhas', label: 'Campanhas & Ofertas', icon: Megaphone },
    { path: '/admin/marketing/popups', label: 'Pop-ups Promocionais', icon: Layers },
    { path: '/admin/marketing/barras', label: 'Barras do Topo', icon: BellRing },
    { path: '/admin/banners', label: 'Banners da Home', icon: Image },
    { path: '/admin/receitas', label: 'Receitas & Dicas', icon: BookOpen },
    { path: '/admin/cupons', label: 'Cupons & Descontos', icon: Tag }
  ];

  const isMarketingActive = marketingItems.some(i => location.pathname === i.path);

  return (
    <aside className="admin-sidebar">
      {/* Brand Header */}
      <div className="admin-sidebar-header">
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-burgundy) 0%, #400000 100%)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-gold)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              flexShrink: 0
            }}
          >
            <Flame size={24} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: '800', fontSize: '1.05rem', fontFamily: 'var(--font-serif)', color: '#FFFFFF', letterSpacing: '-0.3px', lineHeight: '1.1' }}>
              Livio's Food
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
              <span style={{ fontSize: '0.66rem', color: 'var(--accent-gold)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Painel Executivo
              </span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} title="Online" />
            </div>
          </div>
        </Link>
      </div>

      {/* Navegação Estruturada */}
      <nav className="admin-nav">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} className="admin-nav-section">
            <div className="admin-nav-section-title">
              {sec.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {sec.items.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`admin-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} className="nav-icon" />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          background: item.badgeColor || 'var(--primary-burgundy)',
                          color: '#000',
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '2px 7px',
                          borderRadius: '10px',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Módulo de Marketing & Conteúdo (Sanfona) */}
        <div className="admin-nav-section">
          <button
            type="button"
            onClick={() => setMarketingOpen(!marketingOpen)}
            className={`admin-nav-section-button ${isMarketingActive ? 'section-active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={15} color="var(--accent-gold)" />
              <span>MARKETING & CONTEÚDO</span>
            </div>
            <ChevronDown
              size={14}
              style={{
                transform: marketingOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.25s ease'
              }}
            />
          </button>

          {marketingOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px', paddingLeft: '0.4rem', borderLeft: '1px solid rgba(212, 175, 55, 0.2)', marginLeft: '0.75rem' }}>
              {marketingItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`admin-nav-item sub-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={16} className="nav-icon" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Seção Sistema */}
        <div className="admin-nav-section">
          <div className="admin-nav-section-title">
            SISTEMA
          </div>
          <Link
            to="/admin/configuracoes"
            className={`admin-nav-item ${location.pathname === '/admin/configuracoes' ? 'active' : ''}`}
          >
            <Settings size={18} className="nav-icon" />
            <span>Configurações da Loja</span>
          </Link>
        </div>
      </nav>

      {/* Footer da Sidebar com Card de Perfil */}
      <div className="admin-sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary-burgundy) 0%, #5A0000 100%)',
              color: 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.95rem',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              flexShrink: 0
            }}
          >
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: '700', fontSize: '0.86rem', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Administrador'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={11} color="var(--accent-gold)" />
              {user?.roleName || 'Super Admin'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="admin-sidebar-logout-btn"
        >
          <LogOut size={15} /> Encerrar Sessão
        </button>
      </div>
    </aside>
  );
}

