import React, { useState, useEffect } from 'react';
import { Filter, Users, Megaphone, ArrowRight, Check, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminCRMSegments() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minSpent, setMinSpent] = useState(200);
  const [minOrders, setMinOrders] = useState(1);
  const [matchingCount, setMatchingCount] = useState(0);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    fetch('/api/admin/crm/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.success && d.customers) {
          setCustomers(d.customers);
        }
      })
      .catch(err => console.error("Erro ao carregar clientes do CRM:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Cálculo 100% dinâmico baseado na lista real de clientes do banco
    if (!customers || customers.length === 0) {
      setMatchingCount(0);
      return;
    }
    const filtered = customers.filter(c => 
      (c.totalSpent || 0) >= (Number(minSpent) || 0) &&
      (c.ordersCount || 0) >= (Number(minOrders) || 0)
    );
    setMatchingCount(filtered.length);
  }, [minSpent, minOrders, customers]);

  const handleCreateCampaignForSegment = (segmentName) => {
    addToast(`Direcionando para o Módulo de Campanhas com o segmento "${segmentName}" selecionado!`, "info");
    navigate('/admin/marketing/campanhas');
  };

  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 86400000);

  const realSegments = [
    { 
      name: 'Todos os Clientes', 
      count: customers.length, 
      rule: 'Base total cadastrada no e-commerce' 
    },
    { 
      name: 'Novos Clientes (30 dias)', 
      count: customers.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length, 
      rule: 'Cadastrados nos últimos 30 dias' 
    },
    { 
      name: 'Primeira Compra', 
      count: customers.filter(c => (c.ordersCount || 0) === 1).length, 
      rule: 'Realizaram exatamente 1 pedido' 
    },
    { 
      name: 'Clientes Recorrentes', 
      count: customers.filter(c => (c.ordersCount || 0) >= 2).length, 
      rule: 'Realizaram 2 ou mais pedidos' 
    },
    { 
      name: 'Clientes VIP (LTV Alto)', 
      count: customers.filter(c => (c.totalSpent || 0) >= 200).length, 
      rule: 'Gasto acumulado > R$ 200' 
    },
    { 
      name: 'Clientes Inativos (Sem compras)', 
      count: customers.filter(c => (c.ordersCount || 0) === 0).length, 
      rule: 'Sem histórico de pedidos registrados' 
    },
    { 
      name: 'Clientes com Frequência Alta', 
      count: customers.filter(c => (c.ordersCount || 0) >= 4).length, 
      rule: 'Mais de 4 pedidos registrados' 
    },
    { 
      name: 'Clientes com Aceite de Marketing', 
      count: customers.filter(c => c.marketingConsent === true).length, 
      rule: 'Consentiram com comunicações promocionais' 
    }
  ];

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

      {/* 5.5 FILTRO DINÂMICO DE CLIENTES VIP / PERSONALIZADO */}
      <div className="admin-card" style={{ background: '#FAF8F4', border: '2px solid var(--accent-gold)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ color: 'var(--accent-gold-hover)', fontWeight: '800', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              SEGMENTO PERSONALIZADO
            </span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>
              Filtro por Comportamento de Compra
            </h3>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.88rem', color: 'var(--text-dark)', fontWeight: '600' }}>
                Total Gasto Mínimo (R$):
                <input 
                  type="number" 
                  value={minSpent} 
                  onChange={e => setMinSpent(Number(e.target.value))}
                  style={{ marginLeft: '8px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '90px' }}
                />
              </label>
              <label style={{ fontSize: '0.88rem', color: 'var(--text-dark)', fontWeight: '600' }}>
                Mínimo de Pedidos:
                <input 
                  type="number" 
                  value={minOrders} 
                  onChange={e => setMinOrders(Number(e.target.value))}
                  style={{ marginLeft: '8px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', width: '70px' }}
                />
              </label>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary-burgundy)' }}>
              {matchingCount} cliente(s) encontrado(s)
            </div>
            <button
              onClick={() => handleCreateCampaignForSegment('Clientes Filtrados')}
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
        {realSegments.map(s => (
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
                {s.count} cliente(s)
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
