import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, AlertTriangle, TrendingUp, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchDashboard = () => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const d = await res.json();
      if (d.success) {
        addToast("Status do pedido atualizado com sucesso!", "success");
        fetchDashboard();
      }
    } catch (err) {
      addToast("Erro ao atualizar status.", "error");
    }
  };

  if (loading || !data) {
    return <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando dados do painel executivo...</div>;
  }

  const { kpis, lowStockProducts, recentOrders, salesChartData } = data;

  return (
    <div>
      {/* Cards de KPIs Principais */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="admin-card"
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: 0 }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={30} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Faturamento Total</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '2px' }}>
              R$ {kpis.totalRevenue.toFixed(2).replace('.', ',')}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Faturamento acumulado em tempo real
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="admin-card"
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: 0 }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 0, 0, 0.08)', color: 'var(--primary-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={30} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pedidos de Venda</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '2px' }}>{kpis.totalOrders}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {kpis.pendingOrdersCount} pedidos pendentes
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="admin-card"
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: 0 }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={30} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ticket Médio</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '2px' }}>
              R$ {kpis.avgTicket.toFixed(2).replace('.', ',')}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 'bold', marginTop: '4px' }}>
              Excelente conversão
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="admin-card"
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: 0 }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={30} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alerta de Estoque</div>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#EF4444', marginTop: '2px' }}>{kpis.lowStockCount} itens</div>
            <div style={{ fontSize: '0.78rem', color: '#EF4444', fontWeight: 'bold', marginTop: '4px' }}>
              Requer atenção
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gráfico de Faturamento por Dia */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
              Faturamento Semanal (R$)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Desempenho diário dos pedidos confirmados na plataforma.</p>
          </div>
          <span style={{ background: '#FAF8F4', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--primary-burgundy)', border: '1px solid var(--light-border)' }}>
            Últimos 7 dias
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2.5rem', height: '220px', paddingTop: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--light-border)' }}>
          {salesChartData.map((bar, idx) => {
            const heightPercent = (bar.v / 6000) * 100;
            return (
              <div key={idx} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', marginBottom: '8px', color: 'var(--primary-burgundy)' }}>
                  R$ {bar.v.toFixed(0)}
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.08 }}
                  style={{ width: '100%', maxWidth: '52px', background: 'linear-gradient(to top, var(--primary-burgundy), var(--accent-gold))', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', boxShadow: '0 4px 12px rgba(139,0,0,0.2)' }}
                />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginTop: '10px', fontWeight: 'bold' }}>{bar.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pedidos Recentes & Alertas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' }}>
        {/* Tabela de Pedidos Recentes */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
              Últimos Pedidos Recebidos
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Atualização automática</span>
          </div>

          <table className="table-custom">
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Cliente</th>
                <th>Valor Total</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(ord => (
                <tr key={ord.id}>
                  <td><strong style={{ color: 'var(--primary-burgundy)' }}>#{ord.id}</strong></td>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{ord.customerName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ord.customerEmail}</div>
                  </td>
                  <td style={{ fontWeight: '800', color: 'var(--primary-burgundy)' }}>R$ {ord.total.toFixed(2).replace('.', ',')}</td>
                  <td>
                    <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold', background: ord.status === 'shipped' ? '#10B981' : 'var(--primary-burgundy)', color: '#FFF' }}>
                      {ord.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <select
                      value={ord.status}
                      onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                      style={{ padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontSize: '0.82rem', fontWeight: 'bold', background: '#FAF8F4', cursor: 'pointer' }}
                    >
                      <option value="received">Recebido</option>
                      <option value="in_preparation">Em Preparação</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregue</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerta Estoque Crítico */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={22} /> Estoque Crítico
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {lowStockProducts.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0ECE4', paddingBottom: '0.85rem' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.92rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#EF4444', fontWeight: 'bold', fontSize: '1rem' }}>{p.stock} un</span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mínimo: {p.minStock}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
