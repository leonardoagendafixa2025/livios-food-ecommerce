import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Award, RefreshCw, UserCheck, UserX, AlertTriangle, ArrowUpRight, Search, Filter, Megaphone, Tag, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function AdminCRMDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  const fetchCRM = () => {
    fetch('/api/admin/crm/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCRM();
  }, []);

  if (loading || !data) {
    return <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando Central de CRM de Clientes...</div>;
  }

  const { kpis, customers, segments } = data;

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (classFilter !== 'all' && c.classification !== classFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Top Banner de Ação Rápida */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
            Central de CRM & Inteligência de Clientes
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Acompanhe o valor acumulado por cliente, comportamento de compra, hábitos e segmentação estratégica.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/admin/crm/segmentos" className="btn btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} /> SEGMENTAÇÃO DE CLIENTES
          </Link>
        </div>
      </div>

      {/* 5.1 CARDS DE PERFORMANCE E COMPORTAMENTO */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'rgba(139,0,0,0.1)', color: 'var(--primary-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Clientes Cadastrados</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-dark)' }}>{kpis.totalCustomers}</div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 'bold' }}>+{kpis.newCustomers30Days} nos últimos 30 dias</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'rgba(212,175,55,0.15)', color: 'var(--accent-gold-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Clientes VIP</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-gold-hover)' }}>{kpis.vipCustomersCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gasto acumulado &gt; R$ 200</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Clientes Recorrentes</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10B981' }}>{kpis.recurrentCustomersCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 'bold' }}>Múltiplas compras realizadas</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Ticket Médio / Cliente</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#3B82F6' }}>
                R$ {kpis.avgTicketPerCustomer.toFixed(2).replace('.', ',')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LTV Médio da base</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabela Principal da Base de Clientes com Classificação Automática */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
              Base de Clientes & Perfil 360°
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Clique no cliente para abrir a ficha completa, histórico e notas internas</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="search-bar-wrap" style={{ width: '220px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por Nome ou E-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--light-border)', background: '#FAF8F4', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <option value="all">Todas Classificações</option>
              <option value="VIP">Clientes VIP</option>
              <option value="RECORRENTE">Recorrentes</option>
              <option value="PRIMEIRA COMPRA">Primeira Compra</option>
              <option value="NOVO">Novos Cadastros</option>
            </select>
          </div>
        </div>

        <table className="table-custom">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Classificação Automática</th>
              <th>Pedidos Realizados</th>
              <th>Total Gasto acumulado</th>
              <th>Tags do Cliente</th>
              <th>Consentimento LGPD</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 'bold', fontSize: '0.98rem', color: 'var(--text-dark)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.email} | {c.phone || 'Sem celular'}</div>
                </td>
                <td>
                  <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold', background: c.classification === 'VIP' ? 'rgba(212,175,55,0.2)' : c.classification === 'RECORRENTE' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)', color: c.classification === 'VIP' ? 'var(--accent-gold-hover)' : c.classification === 'RECORRENTE' ? '#10B981' : '#3B82F6' }}>
                    {c.classification}
                  </span>
                </td>
                <td style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{c.ordersCount} pedido(s)</td>
                <td style={{ fontWeight: '800', fontSize: '1.05rem', color: '#10B981' }}>
                  R$ {c.totalSpent.toFixed(2).replace('.', ',')}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {(c.tags || []).map(t => (
                      <span key={t} style={{ background: '#FAF8F4', border: '1px solid var(--light-border)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 'bold' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: c.marketingConsent ? '#10B981' : '#EF4444' }}>
                    {c.marketingConsent ? '☑ Aceita Promoções' : '☒ Recusou'}
                  </span>
                </td>
                <td>
                  <Link to={`/admin/crm/cliente/${c.id}`} className="btn btn-outline" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={14} /> VER FICHA 360°
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
