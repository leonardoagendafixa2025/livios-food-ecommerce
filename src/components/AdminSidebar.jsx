import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Warehouse, ShoppingCart, Users, FolderTree, Image, Tag, Settings, LogOut, Megaphone, Sparkles, ChevronDown, Shield, BellRing, Layers, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AdminSidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [marketingOpen, setMarketingOpen] = useState(true);

  const mainNav = [
    { path: '/admin', label: 'Dashboard Geral', icon: LayoutDashboard },
    { path: '/admin/produtos', label: 'Produtos', icon: Package },
    { path: '/admin/estoque', label: 'Estoque & Inventário', icon: Warehouse },
    { path: '/admin/estoque/lista-espera', label: 'Lista de Espera', icon: BellRing },
    { path: '/admin/pedidos', label: 'Pedidos de Venda', icon: ShoppingCart },
    { path: '/admin/crm', label: 'CRM & Central Clientes', icon: Users },
    { path: '/admin/categorias', label: 'Categorias & Linhas', icon: FolderTree }
  ];

  const marketingNav = [
    { path: '/admin/marketing', label: 'Visão Geral Marketing', icon: Sparkles },
    { path: '/admin/marketing/campanhas', label: 'Campanhas Promocionais', icon: Megaphone },
    { path: '/admin/marketing/popups', label: 'Pop-ups no Site', icon: Layers },
    { path: '/admin/marketing/barras', label: 'Barras do Topo', icon: BellRing }
  ];

  const secondaryNav = [
    { path: '/admin/banners', label: 'Banners Home', icon: Image },
    { path: '/admin/receitas', label: 'Gestão de Receitas', icon: BookOpen },
    { path: '/admin/cupons', label: 'Cupons & Descontos', icon: Tag },
    { path: '/admin/configuracoes', label: 'Configurações', icon: Settings }
  ];

  return (
    <aside className="admin-sidebar">
      {/* Header com a Logo Oficial */}
      <div className="admin-sidebar-header">
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="Livio's Food Logo" style={{ height: '44px', width: 'auto', background: '#FFF', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }} />
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem', fontFamily: 'var(--font-serif)', color: '#FFF', letterSpacing: '-0.3px' }}>
              PAINEL ADMIN
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Livio's Food
            </div>
          </div>
        </Link>
      </div>

      {/* Links de Navegação Principal */}
      <nav className="admin-nav">
        {mainNav.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`admin-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* 56.23 MÓDULO DE MARKETING & CAMPANHAS */}
        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>
          <button
            onClick={() => setMarketingOpen(!marketingOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 1.1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-gold)',
              fontWeight: '800',
              fontSize: '0.78rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Megaphone size={16} /> MARKETING & CAMPANHAS
            </span>
            <ChevronDown size={14} style={{ transform: marketingOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {marketingOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '0.5rem' }}>
              {marketingNav.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} className={`admin-nav-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.86rem', padding: '0.65rem 1rem' }}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {secondaryNav.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`admin-nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer da Sidebar */}
      <div className="admin-sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#AAA', fontSize: '0.82rem', marginBottom: '0.85rem' }}>
          <Shield size={16} color="var(--accent-gold)" />
          <span>Sessão Segura RBAC</span>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#EF4444',
            padding: '0.65rem',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <LogOut size={16} /> Sair da Conta Admin
        </button>
      </div>
    </aside>
  );
}
