import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Flame, Menu, X, ShieldAlert, ChevronRight, Columns3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext.jsx';
import { useWishlist } from '../contexts/WishlistContext.jsx';
import { useCompare } from '../contexts/CompareContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import HeaderSearch from './HeaderSearch.jsx';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { getItemCount, setIsDrawerOpen } = useCart();
  const { wishlist } = useWishlist();
  const { compareList } = useCompare();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produtos?busca=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="container topbar-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
            <Flame size={15} color="#FF9800" />
            <span><strong>Frete Grátis</strong> para todo o Brasil acima de R$ 150!</span>
          </div>
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.82rem' }}>
            <span className="hide-mobile"> Atendimento: (31) 99567-5327</span>
            {isAdmin && (
              <Link to="/admin" style={{ color: '#FFD700', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldAlert size={14} /> Painel Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-inner">
          {/* Logo Oficial Livio's Food */}
          <Link to="/" className="logo-brand" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/logo.png"
              alt="Livio's Food Innovation — Fine Recipe"
              style={{ height: '62px', width: 'auto', objectFit: 'contain' }}
            />
          </Link>

          {/* Navigation Links Desktop */}
          <nav className="nav-menu">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Início</Link>
            <Link to="/produtos" className={`nav-link ${location.pathname === '/produtos' ? 'active' : ''}`}>Produtos</Link>
            <Link to="/produtos?ofertas=true" className={`nav-link ${location.search.includes('ofertas') ? 'active' : ''}`}>Ofertas</Link>
            <Link to="/receitas" className={`nav-link ${location.pathname === '/receitas' ? 'active' : ''}`}>Receitas</Link>
            <Link to="/sobre" className={`nav-link ${location.pathname === '/sobre' ? 'active' : ''}`}>Sobre nós</Link>
            <Link to="/contato" className={`nav-link ${location.pathname === '/contato' ? 'active' : ''}`}>Contato</Link>
          </nav>

          {/* Busca em Tempo Real e Ações */}
          <div className="header-actions" style={{ gap: '1.25rem' }}>
            <div className="hide-mobile" style={{ width: '320px' }}>
              <HeaderSearch />
            </div>

            <Link to="/comparar" className="icon-badge-btn hide-mobile" title="Comparar Produtos">
              <Columns3 size={22} />
              {compareList.length > 0 && <span className="badge-count" style={{ background: 'var(--accent-gold)', color: '#000' }}>{compareList.length}</span>}
            </Link>

            <Link to="/favoritos" className="icon-badge-btn hide-mobile" title="Favoritos">
              <Heart size={22} />
              {wishlist.length > 0 && <span className="badge-count">{wishlist.length}</span>}
            </Link>

            <button
              onClick={() => setIsDrawerOpen(true)}
              className="icon-badge-btn"
              title="Carrinho de Compras"
            >
              <ShoppingBag size={22} />
              {getItemCount() > 0 && <span className="badge-count">{getItemCount()}</span>}
            </button>

            {user ? (
              <Link to="/minha-conta" className="btn btn-outline hide-mobile" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <User size={16} /> Minha Conta
              </Link>
            ) : (
              <Link to="/login" className="btn btn-outline hide-mobile" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <User size={16} /> Entrar
              </Link>
            )}

            <Link to="/produtos" className="btn btn-primary hide-mobile" style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem' }}>
              COMPRAR AGORA
            </Link>

            {/* Hamburguer Toggle no Mobile */}
            <button
              className="icon-badge-btn mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Abrir Menu"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </header>

      {/* Drawer do Menu Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-drawer-overlay"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="mobile-drawer-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header do Drawer Mobile */}
              <div className="mobile-drawer-header">
                <div className="logo-brand">
                  <img src="/logo.png" alt="Livio's Food Logo" style={{ height: '48px', width: 'auto' }} />
                </div>
                <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={24} color="var(--text-dark)" />
                </button>
              </div>

              {/* Busca no Drawer */}
              <div style={{ padding: '1rem 1.5rem' }}>
                <form onSubmit={handleSearchSubmit} className="search-bar-wrap" style={{ width: '100%' }}>
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar molhos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </form>
              </div>

              {/* Links do Menu Mobile */}
              <div className="mobile-drawer-links">
                <Link to="/" className="mobile-link-item">
                  <span>Início</span> <ChevronRight size={18} />
                </Link>
                <Link to="/produtos" className="mobile-link-item">
                  <span>Catálogo de Produtos</span> <ChevronRight size={18} />
                </Link>
                <Link to="/produtos?categoria=cat_fine_recipe" className="mobile-link-item">
                  <span>Linha Fine Recipe (Vidro)</span> <ChevronRight size={18} />
                </Link>
                <Link to="/produtos?categoria=cat_pet" className="mobile-link-item">
                  <span>Linha Bisnaga PET</span> <ChevronRight size={18} />
                </Link>
                <Link to="/produtos?ofertas=true" className="mobile-link-item">
                  <span>Ofertas Especiais</span> <ChevronRight size={18} />
                </Link>
                <Link to="/receitas" className="mobile-link-item">
                  <span>Receitas & Harmonização</span> <ChevronRight size={18} />
                </Link>
                <Link to="/sobre" className="mobile-link-item">
                  <span>Sobre a Empresa</span> <ChevronRight size={18} />
                </Link>
                <Link to="/contato" className="mobile-link-item">
                  <span>Contato & Suporte</span> <ChevronRight size={18} />
                </Link>
              </div>

              {/* Ações da Conta no Rodapé do Drawer */}
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--light-border)', marginTop: 'auto', background: 'var(--light-bg)' }}>
                {user ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Olá, {user.name}</div>
                    <Link to="/minha-conta" className="btn btn-outline" style={{ width: '100%' }}>
                      IR PARA MINHA CONTA
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Link to="/login" className="btn btn-outline" style={{ flexGrow: 1 }}>ENTRAR</Link>
                    <Link to="/login" className="btn btn-primary" style={{ flexGrow: 1 }}>CADASTRAR</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
