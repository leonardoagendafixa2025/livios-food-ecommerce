import React, { useState, useEffect } from 'react';
import { Megaphone, Users, Send, ShoppingBag, DollarSign, TrendingUp, Sparkles, ArrowUpRight, Play, Eye, MousePointer } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function AdminMarketingDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/marketing/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando dados de marketing...</div>;
  }

  const { kpis, campaigns, popups, promotionalBars } = data;

  return (
    <div>
      {/* Top Banner de Ação Rápida */}
      <div style={{ background: 'linear-gradient(135deg, #0E0E14, var(--primary-burgundy))', borderRadius: 'var(--radius-lg)', padding: '2rem', color: '#FFF', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div>
          <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} /> CENTRAL DE MARKETING E CAMPANHAS
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-serif)', marginTop: '4px' }}>
            Aumente suas vendas com campanhas segmentadas e ofertas exclusivas
          </h2>
          <p style={{ color: '#D0D0E0', fontSize: '0.92rem', maxWidth: '640px', marginTop: '4px' }}>
            Crie disparos via WhatsApp e E-mail, ative pop-ups promocionais na Home e configure barras com contagem regressiva em tempo real.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/admin/marketing/campanhas" className="btn btn-gold" style={{ padding: '0.85rem 1.5rem', fontSize: '0.95rem' }}>
            <Megaphone size={18} /> + NOVA CAMPANHA
          </Link>
        </div>
      </div>

      {/* 56.1 CARDS DE DESEMPENHO GLOBAL */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'rgba(139,0,0,0.1)', color: 'var(--primary-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Megaphone size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Campanhas Ativas</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-dark)' }}>{kpis.activeCampaignsCount}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpis.scheduledCount} agendadas</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'rgba(212,175,55,0.15)', color: 'var(--accent-gold-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Clientes Alcançados</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-dark)' }}>{kpis.totalReached}</div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 'bold' }}>98% taxa de entrega</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'rgba(59,130,246,0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Mensagens Enviadas</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-dark)' }}>{kpis.totalSent}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpis.totalOpens} aberturas ({Math.round((kpis.totalOpens/kpis.totalSent)*100)}%)</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Faturamento Gerado</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10B981' }}>
                R$ {kpis.totalRevenueGenerated.toFixed(2).replace('.', ',')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 'bold' }}>
                {kpis.totalConversions} vendas convertidas
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lista de Campanhas e Pop-ups Ativos */}
      <div className="grid-2">
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>Campanhas em Execução</h3>
            <Link to="/admin/marketing/campanhas" style={{ color: 'var(--primary-burgundy)', fontWeight: 'bold', fontSize: '0.85rem' }}>Ver todas →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {campaigns.map(c => (
              <div key={c.id} style={{ border: '1px solid var(--light-border)', borderRadius: 'var(--radius-md)', padding: '1rem', background: '#FAF8F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.98rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Segmento: <strong>{c.segment?.label || 'Todos'}</strong> | Canais: {c.channels.join(', ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 'bold', background: c.status === 'Ativa' ? '#10B981' : 'var(--text-muted)', color: '#FFF' }}>
                    {c.status}
                  </span>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary-burgundy)', marginTop: '4px' }}>
                    R$ {(c.stats?.totalRevenue || 0).toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>Pop-ups e Barras da Loja</h3>
            <Link to="/admin/marketing/popups" style={{ color: 'var(--primary-burgundy)', fontWeight: 'bold', fontSize: '0.85rem' }}>Gerenciar →</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {popups.map(p => (
              <div key={p.id} style={{ border: '1px solid var(--light-border)', borderRadius: 'var(--radius-md)', padding: '1rem', background: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{p.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Tipo: <strong>{p.type}</strong> | Cupom: <code>{p.couponCode}</code>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 'bold', background: p.active ? '#10B981' : '#646473', color: '#FFF' }}>
                    {p.active ? 'ATIVO NO SITE' : 'INATIVO'}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {p.stats?.viewsCount || 0} visualizações
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
