import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Bell, User, Search, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AdminHeader() {
  const { user } = useAuth();
  const location = useLocation();

  // Mapeamento de títulos de páginas do Admin
  const pageTitles = {
    '/admin': { title: 'Dashboard Geral', subtitle: 'Visão executiva de faturamento, vendas e estoque em tempo real.' },
    '/admin/produtos': { title: 'Gestão de Produtos', subtitle: 'Cadastre, edite e organize o catálogo de molhos e kits.' },
    '/admin/estoque': { title: 'Controle de Estoque', subtitle: 'Monitore unidades disponíveis e movimentações de inventário.' },
    '/admin/pedidos': { title: 'Gestão de Pedidos', subtitle: 'Acompanhe o fluxo de aprovação, embalagem e envio.' },
    '/admin/clientes': { title: 'Base de Clientes', subtitle: 'Gerencie clientes cadastrados e histórico de consumo.' },
    '/admin/categorias': { title: 'Linhas & Categorias', subtitle: 'Organize as linhas Fine Recipe, PET e Kits Promocionais.' },
    '/admin/banners': { title: 'Banners da Home', subtitle: 'Edite os banners interativos e frases da página inicial.' },
    '/admin/cupons': { title: 'Cupons Promocionais', subtitle: 'Crie cupons de desconto e regras de frete grátis.' },
    '/admin/configuracoes': { title: 'Configurações da Loja', subtitle: 'Parâmetros institucionais, gateways de pagamento e SEO.' }
  };

  const currentPage = pageTitles[location.pathname] || { title: 'Painel Administrativo', subtitle: 'Gerenciamento do e-commerce Livio\'s Food Innovation.' };

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

        {/* Notificações simuladas */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#FFF', border: '1px solid var(--light-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dark)' }}>
            <Bell size={18} />
          </div>
          <span style={{ position: 'absolute', top: '2px', right: '2px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-burgundy)', border: '2px solid #FFF' }} />
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
