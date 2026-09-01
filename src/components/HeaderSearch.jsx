import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight, Tag, ArrowRight, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeaderSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions({ products: [], categories: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(d => {
          if (d.success) {
            setSuggestions(d);
            setIsOpen(true);
          }
        })
        .catch(err => console.error(err));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={searchRef} style={{ position: 'relative', flexGrow: 1, maxWidth: '460px' }}>
      <form onSubmit={handleSearchSubmit} className="search-bar-wrap">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Busque por molhos, ingredientes, pimentas ou SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); }}
            style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={16} color="var(--text-muted)" />
          </button>
        )}
      </form>

      {/* Dropdown de Sugestões em Tempo Real */}
      {isOpen && (suggestions.products.length > 0 || suggestions.categories.length > 0) && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 1100,
            background: '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--light-border)',
            overflow: 'hidden'
          }}
        >
          {/* Categorias Sugeridas */}
          {suggestions.categories.length > 0 && (
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #F0ECE4', background: '#FAF8F4' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                CATEGORIAS
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {suggestions.categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(`/produtos?categoria=${c.id}`);
                    }}
                    style={{ background: '#FFF', border: '1px solid var(--light-border)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', color: 'var(--primary-burgundy)' }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Produtos Sugeridos */}
          {suggestions.products.length > 0 && (
            <div style={{ padding: '0.5rem 0' }}>
              <div style={{ padding: '0.4rem 1rem', fontSize: '0.72rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                PRODUTOS ENCONTRADOS
              </div>
              {suggestions.products.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/produto/${p.slug}`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.65rem 1rem',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    borderBottom: '1px solid #F5F5F5'
                  }}
                  className="search-item-hover"
                >
                  <img src={p.images[0] || '/header-bg.jpg'} alt={p.name} style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.88rem', color: 'var(--text-dark)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                  </div>
                  <div style={{ fontWeight: '800', color: 'var(--primary-burgundy)', fontSize: '0.9rem' }}>
                    R$ {(p.promotionalPrice || p.price).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ver todos os resultados */}
          <button
            onClick={handleSearchSubmit}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'var(--primary-burgundy)',
              color: '#FFF',
              border: 'none',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            Ver todos os resultados para "{query}" <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
