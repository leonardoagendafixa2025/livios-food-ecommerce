import React, { useState, useEffect } from 'react';
import { Filter, Users, Megaphone, ArrowRight, Check, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminCRMSegments() {
  const [segments, setSegments] = useState([]);
  const [minSpent, setMinSpent] = useState(1000);
  const [minOrders, setMinOrders] = useState(5);
  const [matchingCount, setMatchingCount] = useState(127);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    // Simulação do calculador dinâmico de segmentos
    const base = 127;
    const calc = Math.max(12, Math.round(base * (1000 / (minSpent || 1000))));
    setMatchingCount(calc);
  }, [minSpent, minOrders]);

  const handleCreateCampaignForSegment = (segmentName) => {
    addToast(`Direcionando para o Módulo de Campanhas com o segmento "${segmentName}" selecionado!`, "info");
    navigate('/admin/marketing/campanhas');
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
          Segmentação Avançada de Clientes (5.4)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Crie filtros combinados baseados em histórico de compras, ticket médio, localização e engajamento.
        </p>
      </div>

      {/* 5.5 EXEMPLO DE SEGMENTAÇÃO DE CLIENTES VIP */}
      <div className="admin-card" style={{ background: '#FAF8F4', border: '2px solid var(--accent-gold)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ color: 'var(--accent-gold-hover)', fontWeight: '800', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              SEGMENTO DE ALTO VALOR
            </span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>
              Filtro Personalizado: CLIENTES VIP
            </h3>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Regras ativas: Total gasto &gt; R$ {minSpent} <strong>E</strong> Pedidos &gt; {minOrders}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-burgundy)' }}>
              {matchingCount} clientes encontrados
            </div>
            <button
              onClick={() => handleCreateCampaignForSegment('Clientes VIP')}
              className="btn btn-gold"
              style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Megaphone size={18} /> CRIAR CAMPANHA PARA ESTE SEGMENTO
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Segmentos Pré-Configurados (5.6) */}
      <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', marginBottom: '1.25rem' }}>
        5.6 Segmentos Pré-Configurados
      </h3>

      <div className="grid-3">
        {[
          { name: 'Todos os Clientes', count: 184, rule: 'Base total cadastrada no e-commerce' },
          { name: 'Novos Clientes (30 dias)', count: 42, rule: 'Cadastrados nos últimos 30 dias' },
          { name: 'Primeira Compra', count: 58, rule: 'Realizaram exatamente 1 pedido' },
          { name: 'Clientes Recorrentes', count: 84, rule: 'Realizaram 2 ou mais pedidos' },
          { name: 'Clientes VIP (LTV Alto)', count: 127, rule: 'Gasto acumulado > R$ 1.000' },
          { name: 'Clientes Inativos (60+ dias)', count: 32, rule: 'Sem compras nos últimos 60 dias' },
          { name: 'Clientes com Carrinho Abandonado', count: 15, rule: 'Deixaram produtos no carrinho há 24h' },
          { name: 'Clientes com Maior Frequência', count: 28, rule: 'Mais de 4 pedidos nos últimos 6 meses' },
          { name: 'Clientes da Região Sudeste (MG/SP/RJ)', count: 160, rule: 'Endereço em Minas Gerais ou SP' }
        ].map(s => (
          <div key={s.name} className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-dark)', marginBottom: '4px' }}>
                {s.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {s.rule}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0ECE4', paddingTop: '0.75rem' }}>
              <span style={{ fontWeight: '800', color: 'var(--primary-burgundy)', fontSize: '1rem' }}>
                {s.count} clientes
              </span>
              <button
                onClick={() => handleCreateCampaignForSegment(s.name)}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold-hover)', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Disparar Campanha →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
