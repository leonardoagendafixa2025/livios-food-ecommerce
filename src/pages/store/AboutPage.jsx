import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Flame, Globe, ShieldCheck, Heart, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--light-bg)', padding: '4rem 0' }}>
      <div className="container">
        {/* Banner Institucional */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 4rem' }}>
          <span style={{ color: 'var(--accent-gold-hover)', fontWeight: '800', letterSpacing: '2px', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            NOSSA HISTÓRIA & VALORES
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
            Sobre a Livio's Food Innovation
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
            Atuando no mercado desde 2012, a LIVIO’S FOOD INNOVATION é uma empresa com foco no ramo alimentício, produzindo molhos especiais que agregam valor aos mais diversos pratos e receitas.
          </p>
        </div>

        {/* Biografia do Fundador */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', alignItems: 'center', background: '#FFF', padding: '3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', boxShadow: 'var(--shadow-md)', marginBottom: '4rem' }}>
          <div>
            <span style={{ color: 'var(--primary-burgundy)', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' }}>FOOD DEVELOPER</span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', marginTop: '0.4rem', marginBottom: '1.25rem' }}>
              Rômulo Lívio Medeiros
            </h2>
            <p style={{ color: 'var(--text-dark)', lineHeight: '1.8', fontSize: '1rem', marginBottom: '1.25rem' }}>
              Criada por Rômulo Lívio Medeiros (food developer), que após doze anos de intenso trabalho e estudos na área gastronômica britânica, desenvolve produtos de alta qualidade para os paladares mais exigentes no Brasil.
            </p>
            <p style={{ color: 'var(--text-dark)', lineHeight: '1.8', fontSize: '1rem', marginBottom: '2rem' }}>
              A Livio’s Food Innovation chega no mercado com foco permanente em qualidade e atendimento. Sempre em busca do que há de mais moderno e saboroso que agregue qualidade e valor à nossa alimentação.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/produtos" className="btn btn-primary">
                CONHECER NOSSOS PRODUTOS <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div>
            <img
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1000&q=80"
              alt="Mestre Gastronômico Rômulo Lívio Medeiros"
              style={{ width: '100%', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}
            />
          </div>
        </div>

        {/* Atuação e Alcance */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Onde Estamos Presentes</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0.5rem auto 0' }}>
            Atendemos supermercados, empórios, bares, restaurantes, hotéis, distribuidores, entre outros, nas regiões de Minas Gerais, São Paulo, Rio de Janeiro e Bahia.
          </p>
        </div>
      </div>
    </div>
  );
}
