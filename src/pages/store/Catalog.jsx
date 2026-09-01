import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, RotateCcw } from 'lucide-react';
import ProductCard from '../../components/ProductCard.jsx';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedCategory = searchParams.get('categoria') || '';
  const searchQuery = searchParams.get('busca') || '';
  const isOffer = searchParams.get('ofertas') === 'true';
  const sort = searchParams.get('sort') || '';
  const [maxPrice, setMaxPrice] = useState('150');

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.categories);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = '/api/products?';
    if (selectedCategory) url += `category=${selectedCategory}&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;
    if (isOffer) url += `offer=true&`;
    if (sort) url += `sort=${sort}&`;
    if (maxPrice) url += `maxPrice=${maxPrice}&`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) setProducts(data.products);
      })
      .finally(() => setLoading(false));
  }, [searchParams, maxPrice]);

  const handleCategoryChange = (catId) => {
    const newParams = new URLSearchParams(searchParams);
    if (catId) {
      newParams.set('categoria', catId);
    } else {
      newParams.delete('categoria');
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (sortValue) => {
    const newParams = new URLSearchParams(searchParams);
    if (sortValue) {
      newParams.set('sort', sortValue);
    } else {
      newParams.delete('sort');
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setMaxPrice('150');
  };

  return (
    <div style={{ padding: '3rem 0', background: 'var(--light-bg)', minHeight: '80vh' }}>
      <div className="container">
        {/* Cabeçalho do Catálogo */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)' }}>
            Catálogo de Molhos & Produtos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Explore nossa linha completa de molhos agridoces, picantes e kits degustação artesanais.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem' }}>
          {/* Sidebar de Filtros */}
          <aside style={{ background: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--light-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem' }}>
                <Filter size={18} color="var(--primary-burgundy)" /> Filtros
              </div>
              <button
                onClick={clearFilters}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCcw size={13} /> Limpar
              </button>
            </div>

            {/* Filtro por Categorias */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 'bold', marginBottom: '0.85rem', color: 'var(--text-dark)' }}>Categorias</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => handleCategoryChange('')}
                  style={{
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: selectedCategory === '' ? 'var(--primary-burgundy)' : 'transparent',
                    color: selectedCategory === '' ? '#FFF' : 'var(--text-dark)',
                    fontWeight: selectedCategory === '' ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '0.88rem'
                  }}
                >
                  Todas as Categorias
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    style={{
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: selectedCategory === cat.id ? 'var(--primary-burgundy)' : 'transparent',
                      color: selectedCategory === cat.id ? '#FFF' : 'var(--text-dark)',
                      fontWeight: selectedCategory === cat.id ? 'bold' : 'normal',
                      cursor: 'pointer',
                      fontSize: '0.88rem'
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por Faixa de Preço */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 'bold', marginBottom: '0.85rem' }}>Preço Máximo: R$ {maxPrice},00</h4>
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--primary-burgundy)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>R$ 20</span>
                <span>R$ 150</span>
              </div>
            </div>
          </aside>

          {/* Área Principal dos Produtos */}
          <main>
            {/* Barra de Ordenação e Resumo */}
            <div style={{ background: '#FFF', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Exibindo <strong>{products.length}</strong> produtos encontrados
                {searchQuery && <span> para "<strong>{searchQuery}</strong>"</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Ordenar por:</span>
                <select
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', background: '#FAF8F5', fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  <option value="">Mais Relevantes</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                  <option value="name_asc">Nome (A - Z)</option>
                  <option value="rating_desc">Melhor Avaliados</option>
                </select>
              </div>
            </div>

            {/* Grid de Produtos */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                <div style={{ fontSize: '1.1rem', color: 'var(--primary-burgundy)', fontWeight: 'bold' }}>Carregando catálogo Livio's Food...</div>
              </div>
            ) : products.length === 0 ? (
              <div style={{ background: '#FFF', padding: '3rem 2rem', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--light-border)' }}>
                <Search size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Nenhum produto encontrado</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Tente ajustar seus termos de busca ou filtros de categoria.
                </p>
                <button onClick={clearFilters} className="btn btn-primary">
                  VER TODOS OS PRODUTOS
                </button>
              </div>
            ) : (
              <div className="grid-3">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
