import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, AlertTriangle, TrendingUp, Clock, CheckCircle2, ArrowUpRight, Plus, Package, Tag, Megaphone, Settings, Eye, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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
      .catch(err => {
        console.error("Erro ao buscar dashboard:", err);
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
    return (
      <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>
        <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--primary-burgundy)' }} />
        Carregando painel executivo em tempo real...
      </div>
    );
  }

  const { kpis, lowStockProducts, recentOrders, salesChartData } = data;
  const maxSales = Math.max(...salesChartData.map(b => b.v), 100);

  return (
    <div>
      {/* Topo Executivo & Atalhos Rápidos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
            Visão Geral do E-commerce
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Acompanhamento integrado de faturamento, vendas, estoque, clientes e campanhas em tempo real.
          </p>
        </div>

        {/* Barra de Ações Rápidas */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/produtos" className="btn btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.6rem 1rem' }}>
            <Plus size={16} /> NOVO PRODUTO
          </Link>
          <Link to="/admin/pedidos" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.6rem 1rem' }}>
            <ShoppingBag size={16} /> PEDIDOS
          </Link>
          <Link to="/admin/marketing/campanhas" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '0.6rem 1rem' }}>
            <Megaphone size={16} /> CAMPANHAS
          </Link>
        </div>
      </div>

      {/* 4 CARDS DE KPIS PRINCIPAIS */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="admin-card"
          style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: 0 }}
        >
          <div style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarSign size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Faturamento Total</div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '2px' }}>
              R$ {kpis.totalRevenue.toFixed(2).replace('.', ',')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 'bold', marginTop: '2px' }}>
              Acumulado em tempo real
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="admin-card"
          style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: 0 }}
        >
          <div style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-md)', background: 'rgba(139, 0, 0, 0.08)', color: 'var(--primary-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShoppingBag size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pedidos de Venda</div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '2px' }}>{kpis.totalOrders}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {kpis.pendingOrdersCount} pedido(s) pendente(s)
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="admin-card"
          style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: 0 }}
        >
          <div style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-md)', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ticket Médio</div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '2px' }}>
              R$ {kpis.avgTicket.toFixed(2).replace('.', ',')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Média por pedido
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="admin-card"
          style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: 0 }}
        >
          <div style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-md)', background: kpis.lowStockCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)', color: kpis.lowStockCount > 0 ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {kpis.lowStockCount > 0 ? <AlertTriangle size={28} /> : <CheckCircle2 size={28} />}
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alerta de Estoque</div>
            <div style={{ fontSize: '1.65rem', fontWeight: '800', color: kpis.lowStockCount > 0 ? '#EF4444' : '#10B981', marginTop: '2px' }}>
              {kpis.lowStockCount} {kpis.lowStockCount === 1 ? 'item' : 'itens'}
            </div>
            <div style={{ fontSize: '0.75rem', color: kpis.lowStockCount > 0 ? '#EF4444' : '#10B981', fontWeight: 'bold', marginTop: '2px' }}>
              {kpis.lowStockCount > 0 ? `${kpis.outOfStockCount} esgotado(s)` : 'Estoque regular'}
            </div>
          </div>
        </motion.div>
      </div>

      {/* BARRA DE MÉTRICAS OPERACIONAIS RÁPIDAS */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div style={{ background: '#FAF8F4', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Catálogo Ativo</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>{kpis.activeProducts || 0} / {kpis.totalProducts || 0} prod.</div>
          </div>
          <Link to="/admin/produtos" style={{ color: 'var(--primary-burgundy)', fontSize: '0.8rem', fontWeight: 'bold' }}>Gerenciar →</Link>
        </div>

        <div style={{ background: '#FAF8F4', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Base de Clientes</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>{kpis.totalCustomers || 0} cadastrados</div>
          </div>
          <Link to="/admin/crm" style={{ color: 'var(--primary-burgundy)', fontSize: '0.8rem', fontWeight: 'bold' }}>CRM →</Link>
        </div>

        <div style={{ background: '#FAF8F4', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Cupons Ativos</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>{kpis.activeCoupons || 0} disponíveis</div>
          </div>
          <Link to="/admin/cupons" style={{ color: 'var(--primary-burgundy)', fontSize: '0.8rem', fontWeight: 'bold' }}>Cupons →</Link>
        </div>

        <div style={{ background: '#FAF8F4', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Lista de Espera</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>{kpis.totalWaitlist || 0} aguardando</div>
          </div>
          <Link to="/admin/waitlist" style={{ color: 'var(--primary-burgundy)', fontSize: '0.8rem', fontWeight: 'bold' }}>Ver Lista →</Link>
        </div>
      </div>

      {/* Gráfico de Faturamento Semanal Dinâmico */}
      <div className="admin-card" style={{ marginBottom: '2rem' }}>
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

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', height: '220px', paddingTop: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--light-border)' }}>
          {salesChartData.map((bar, idx) => {
            const heightPercent = maxSales > 0 ? Math.max((bar.v / maxSales) * 100, 4) : 4;
            return (
              <div key={idx} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', marginBottom: '8px', color: bar.v > 0 ? 'var(--primary-burgundy)' : 'var(--text-muted)' }}>
                  R$ {bar.v.toFixed(0)}
                </div>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.08 }}
                  style={{
                    width: '100%',
                    maxWidth: '52px',
                    background: bar.v > 0 ? 'linear-gradient(to top, var(--primary-burgundy), var(--accent-gold))' : '#E8E4DC',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    boxShadow: bar.v > 0 ? '0 4px 12px rgba(139,0,0,0.2)' : 'none'
                  }}
                />
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginTop: '10px', fontWeight: 'bold' }}>{bar.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pedidos Recentes & Alertas de Estoque */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' }}>
        {/* Tabela de Pedidos Recentes */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
                Últimos Pedidos Recebidos
              </h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Atualização em tempo real</span>
            </div>
            <Link to="/admin/pedidos" style={{ color: 'var(--primary-burgundy)', fontWeight: 'bold', fontSize: '0.85rem' }}>
              Ver Todos ({kpis.totalOrders}) →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <ShoppingBag size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <div style={{ fontWeight: 'bold' }}>Nenhum pedido recebido ainda</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Assim que um cliente concluir uma compra, o pedido aparecerá aqui automaticamente.</div>
            </div>
          ) : (
            <table className="table-custom">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Total</th>
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
                      <span style={{ padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 'bold', background: ord.status === 'shipped' || ord.status === 'delivered' ? '#10B981' : ord.status === 'cancelled' ? '#EF4444' : 'var(--primary-burgundy)', color: '#FFF' }}>
                        {ord.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        style={{ padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontSize: '0.78rem', fontWeight: 'bold', background: '#FAF8F4', cursor: 'pointer' }}
                      >
                        <option value="received">Recebido</option>
                        <option value="payment_approved">Aprovado</option>
                        <option value="in_preparation">Em Preparação</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Alerta Estoque Crítico */}
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: lowStockProducts.length > 0 ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {lowStockProducts.length > 0 ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
              {lowStockProducts.length > 0 ? 'Estoque Crítico' : 'Estoque Regular'}
            </h3>
            <Link to="/admin/estoque" style={{ color: 'var(--primary-burgundy)', fontWeight: 'bold', fontSize: '0.82rem' }}>
              Gestão →
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={40} style={{ margin: '0 auto 0.75rem', color: '#10B981' }} />
              <div style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>Estoque 100% Saudável</div>
              <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Nenhum produto abaixo do limite mínimo configurado.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {lowStockProducts.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0ECE4', paddingBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.92rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: p.stock === 0 ? '#EF4444' : 'var(--accent-gold-hover)', fontWeight: '800', fontSize: '1rem' }}>
                      {p.stock} un
                    </span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mín: {p.minStock}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
