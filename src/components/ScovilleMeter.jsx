import React from 'react';
import { Flame } from 'lucide-react';

export default function ScovilleMeter({ heatLevel = "Média", compact = false, showLabel = true }) {
  const getHeatData = (level) => {
    const l = (level || '').toLowerCase();
    if (l.includes('suave') || l.includes('baixa') || l.includes('doce')) {
      return {
        score: 1,
        label: 'Suave & Agridoce',
        shu: '~ 800 - 1.500 SHU',
        desc: 'Ardência sutil, ideal para quem aprecia sabor marcante sem queimação.',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)'
      };
    }
    if (l.includes('alta') || l.includes('intensa') || l.includes('picante')) {
      return {
        score: 3,
        label: 'Alta Ardência',
        shu: '~ 30.000 - 50.000 SHU',
        desc: 'Blend picante com Habanero e Malagueta para paladares experientes.',
        color: '#EA580C',
        bg: 'rgba(234, 88, 12, 0.12)'
      };
    }
    if (l.includes('extrema') || l.includes('mega') || l.includes('reaper')) {
      return {
        score: 4,
        label: 'Ardência Extrema',
        shu: '~ 100.000+ SHU (Carolina Reaper)',
        desc: 'Fórmula disruptiva e explosiva com as pimentas mais ardidas do mundo.',
        color: '#DC2626',
        bg: 'rgba(220, 38, 38, 0.15)'
      };
    }
    // Padrão: Média
    return {
      score: 2,
      label: 'Ardência Média Equilibrada',
      shu: '~ 5.000 - 10.000 SHU',
      desc: 'Equilíbrio gastronômico perfeito entre doçura nobre e calor moderado.',
      color: '#D97706',
      bg: 'rgba(217, 119, 6, 0.12)'
    };
  };

  const data = getHeatData(heatLevel);

  if (compact) {
    return (
      <div 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px', 
          background: data.bg, 
          padding: '2px 8px', 
          borderRadius: 'var(--radius-full)', 
          fontSize: '0.75rem', 
          fontWeight: 'bold', 
          color: data.color 
        }}
        title={`Escala Scoville: ${data.shu}`}
      >
        <div style={{ display: 'flex', gap: '1px' }}>
          {[1, 2, 3, 4].map(idx => (
            <Flame 
              key={idx} 
              size={12} 
              fill={idx <= data.score ? data.color : 'none'} 
              color={idx <= data.score ? data.color : '#CBD5E1'} 
            />
          ))}
        </div>
        {showLabel && <span>{heatLevel || 'Média'}</span>}
      </div>
    );
  }

  return (
    <div style={{ background: '#FAF8F4', border: '1px solid var(--light-border)', borderRadius: 'var(--radius-md)', padding: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Flame size={16} color={data.color} /> ESCALA SCOVILLE DE ARDÊNCIA
        </span>
        <span style={{ fontSize: '0.82rem', fontWeight: '800', color: data.color }}>
          {data.shu}
        </span>
      </div>

      {/* Barra de 4 Níveis */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '0.6rem' }}>
        {[1, 2, 3, 4].map(idx => {
          const isActive = idx <= data.score;
          return (
            <div 
              key={idx} 
              style={{ 
                flex: 1, 
                height: '8px', 
                borderRadius: '4px', 
                background: isActive ? data.color : '#E2E8F0',
                transition: 'background 0.3s ease'
              }} 
            />
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.5rem' }}>
        <span>Suave (1)</span>
        <span>Média (2)</span>
        <span>Picante (3)</span>
        <span>Extrema (4)</span>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-dark)', margin: 0, lineHeight: '1.4' }}>
        <strong>{data.label}:</strong> {data.desc}
      </p>
    </div>
  );
}
