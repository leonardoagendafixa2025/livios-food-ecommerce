import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, Frown, Sparkles } from 'lucide-react';
import ProductCard from '../../components/ProductCard.jsx';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [fallbackProducts, setFallbackProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState('relevance');
  const [availability, setAvailability] = useState('all');

  const fetchSearchResults = () => {
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}&sort=${sort}&availability=${availability}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setProducts(d.products);
          setFallbackProducts(d.fallbackProducts || []);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSearchResults();
  }, [query, sort, availability]);

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      {/* Top Title Bar */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
          Resultados para: <span style={{ color: 'var(--primary-burgundy)' }}>"{query}"</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {loading ? 'Buscando produtos...' : `Encontramos ${products.length} produto(s) correspondentes.`}
        </p>
      </div>

      {/* Bar de Controles & Ordenação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', background: '#FAF8F4', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={16} /> Disponibilidade:
          </label>
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--light-border)', background: '#FFF', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            <option value="all">Todos os Produtos</option>
            <option value="in_stock">Apenas em Estoque</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={16} /> Ordenar por:
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{ padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--light-border)', background: '#FFF', fontWeight: 'bold', fontSize: '0.85rem' }}
          >
            <option value="relevance">Relevância</option>
            <option value="bestseller">Mais Vendidos</option>
            <option value="price_asc">Menor Preço</option>
            <option value="price_desc">Maior Preço</option>
            <option value="rating_desc">Melhor Avaliados</option>
          </select>
        </div>
      </div>

      {/* Lista de Resultados ou Fallback Sem Resultados */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando resultados da busca...</div>
      ) : products.length > 0 ? (
        <div className="grid-4">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        /* 3.3 BUSCA SEM RESULTADOS — FALLBACK COM SUGESTÕES */
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#FFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--light-border)' }}>
          <Frown size={56} color="var(--primary-burgundy)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
            Não encontramos exatamente o que você procura por "{query}".
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '560px', margin: '0 auto 2rem auto' }}>
            Verifique a ortografia do termo de busca ou confira nossas sugestões dos molhos mais vendidos e apreciados abaixo:
          </p>

          {fallbackProducts.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', color: 'var(--accent-gold-hover)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Sparkles size={20} /> PRODUTOS MAIS POPULARES QUE VOCÊ PODE GOSTAR:
              </h3>
              <div className="grid-4">
                {fallbackProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
