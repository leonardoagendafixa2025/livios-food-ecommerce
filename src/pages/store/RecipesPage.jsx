import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Flame, ShoppingBag, ArrowRight } from 'lucide-react';

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recipes')
      .then(res => res.json())
      .then(data => {
        if (data.success) setRecipes(data.recipes);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '3.5rem 0', background: 'var(--light-bg)', minHeight: '80vh' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: 'var(--accent-gold-hover)', fontWeight: '800', letterSpacing: '2px', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            HARMONIZAÇÕES GASTRONÔMICAS
          </span>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)', marginTop: '0.4rem' }}>
            Receitas Exclusivas Livio's Food
          </h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0.5rem auto 0', fontSize: '1.05rem' }}>
            Descubra como transformar pratos simples em refeições memoráveis utilizando nossos molhos especiais agridoces.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {recipes.map(rec => (
            <div key={rec.id} style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '2rem', boxShadow: 'var(--shadow-md)' }}>
              <img src={rec.image} alt={rec.title} style={{ width: '100%', height: '100%', minHeight: '380px', objectFit: 'cover' }} />
              <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 'bold' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={16} /> {rec.prepTime}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={16} /> {rec.servings}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Flame size={16} color="var(--primary-burgundy)" /> {rec.difficulty}</span>
                </div>

                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', marginBottom: '0.75rem', lineHeight: '1.2' }}>
                  {rec.title}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  {rec.subtitle}
                </p>

                <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Ingredientes Principais:</h4>
                <ul style={{ paddingLeft: '1.2rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                  {rec.ingredients.map((ing, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{ing}</li>
                  ))}
                </ul>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Link to="/produtos" className="btn btn-primary" style={{ padding: '0.85rem 1.5rem' }}>
                    <ShoppingBag size={18} /> COMPRAR MOLHOS DA RECEITA
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
