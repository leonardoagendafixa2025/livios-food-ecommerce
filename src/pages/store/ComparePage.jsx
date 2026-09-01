import React, { useState, useEffect } from 'react';
import { Columns3, ShoppingBag, X, Star, Check, Flame } from 'lucide-react';
import { useCompare } from '../../contexts/CompareContext.jsx';
import { useCart } from '../../contexts/CartContext.jsx';
import { Link } from 'react-router-dom';

export default function ComparePage() {
  const { compareList, toggleCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  if (compareList.length === 0) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <Columns3 size={64} color="var(--primary-burgundy)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
        <h2 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
          Nenhum produto selecionado para comparação
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Navegue pelo nosso catálogo de molhos nobres e clique em "+ COMPARAR" nos cards de produtos.
        </p>
        <Link to="/produtos" className="btn btn-primary">
          EXPLORAR CATÁLOGO DE MOLHOS
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
            Comparativo de Molhos Especiais
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Compare preços, volumes, ardência e características técnicas lado a lado.
          </p>
        </div>

        <button onClick={clearCompare} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
          LIMPAR TUDO
        </button>
      </div>

      {/* Tabela de Comparação Responsiva (Com Rolagem Horizontal no Mobile) */}
      <div style={{ overflowX: 'auto', background: '#FFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--light-border)' }}>
        <table className="table-custom" style={{ minWidth: '720px' }}>
          <thead>
            <tr>
              <th style={{ width: '200px', background: '#FAF8F4' }}>Característica</th>
              {compareList.map(p => (
                <th key={p.id} style={{ textAlign: 'center', minWidth: '220px', position: 'relative' }}>
                  <button
                    onClick={() => toggleCompare(p)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: 'none', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Remover da comparação"
                  >
                    <X size={14} />
                  </button>

                  <img src={p.images[0] || '/header-bg.jpg'} alt={p.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)', margin: '0 auto 10px auto' }} />
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-dark)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>SKU: {p.sku}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 'bold', background: '#FAF8F4' }}>Preço Venda</td>
              {compareList.map(p => (
                <td key={p.id} style={{ textAlign: 'center', fontWeight: '800', fontSize: '1.2rem', color: 'var(--primary-burgundy)' }}>
                  R$ {(p.promotionalPrice || p.price).toFixed(2).replace('.', ',')}
                  {p.promotionalPrice && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      R$ {p.price.toFixed(2).replace('.', ',')}
                    </div>
                  )}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 'bold', background: '#FAF8F4' }}>Volume / Peso</td>
              {compareList.map(p => (
                <td key={p.id} style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  {p.volumeMl ? `${p.volumeMl}ml` : '250ml'}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 'bold', background: '#FAF8F4' }}>Nível de Picância</td>
              {compareList.map(p => (
                <td key={p.id} style={{ textAlign: 'center' }}>
                  <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 'bold', background: 'rgba(139,0,0,0.1)', color: 'var(--primary-burgundy)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Flame size={14} color="#FF9800" /> {p.heatLevel || 'Média'}
                  </span>
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 'bold', background: '#FAF8F4' }}>Avaliação dos Clientes</td>
              {compareList.map(p => (
                <td key={p.id} style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-gold)' }}>
                    <Star size={16} fill="var(--accent-gold)" /> {p.rating || 5.0} / 5.0
                  </div>
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 'bold', background: '#FAF8F4' }}>Disponibilidade</td>
              {compareList.map(p => (
                <td key={p.id} style={{ textAlign: 'center' }}>
                  {p.stock > 0 ? (
                    <span style={{ color: '#10B981', fontWeight: 'bold', fontSize: '0.85rem' }}>em Estoque ({p.stock} un)</span>
                  ) : (
                    <span style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '0.85rem' }}>Esgotado</span>
                  )}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ fontWeight: 'bold', background: '#FAF8F4' }}>Ingredientes Principais</td>
              {compareList.map(p => (
                <td key={p.id} style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {p.ingredients || 'Pimentas selecionadas, vinagre de maçã, açúcar de cana e especiarias.'}
                </td>
              ))}
            </tr>

            <tr>
              <td style={{ background: '#FAF8F4' }}></td>
              {compareList.map(p => (
                <td key={p.id} style={{ textAlign: 'center' }}>
                  {p.stock > 0 ? (
                    <button onClick={() => addToCart(p, 1)} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}>
                      <ShoppingBag size={16} /> ADICIONAR
                    </button>
                  ) : (
                    <div style={{ background: '#FAF8F4', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                      Indisponível
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
