import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Check, X, Flame, Clock, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext.jsx';
import CountdownTimer from '../../components/CountdownTimer.jsx';

export default function AdminPromotionalBars() {
  const [bars, setBars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    text: '🔥 FESTIVAL DO SABOR LIVIO\'S FOOD — 10% OFF COM O CUPOM:',
    couponCode: 'LIVIO10',
    buttonText: 'COPIAR CUPOM',
    buttonLink: '/produtos',
    backgroundColor: '#8B0000',
    textColor: '#FFFFFF',
    countdownEndDate: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 16),
    active: true
  });

  const fetchBars = () => {
    fetch('/api/admin/promotional-bars')
      .then(res => res.json())
      .then(d => {
        if (d.success) setBars(d.promotionalBars);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBars();
  }, []);

  const handleSaveBar = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/promotional-bars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const d = await res.json();
      if (d.success) {
        addToast("Barra promocional criada e ativada com sucesso!", "success");
        setIsModalOpen(false);
        fetchBars();
      }
    } catch (err) {
      addToast("Erro ao criar barra promocional.", "error");
    }
  };

  const handleToggleBar = async (id) => {
    try {
      const res = await fetch(`/api/admin/promotional-bars/${id}/toggle`, { method: 'PUT' });
      const d = await res.json();
      if (d.success) {
        addToast(d.message, "success");
        fetchBars();
      }
    } catch (err) {
      addToast("Erro ao alternar status da barra.", "error");
    }
  };

  const handleDeleteBar = async (id) => {
    if (!window.confirm("Excluir esta barra promocional?")) return;
    try {
      const res = await fetch(`/api/admin/promotional-bars/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        addToast("Barra excluída com sucesso!", "success");
        fetchBars();
      }
    } catch (err) {
      addToast("Erro ao excluir barra.", "error");
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
            Gestão de Barras Promocionais do Topo (56.17)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Configure a barra fixa superior com avisos de frete grátis, cupons e contadores regressivos em tempo real.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> + NOVA BARRA PROMOCIONAL
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando barras...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {bars.map(b => (
            <motion.div key={b.id} layout className="admin-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold', background: b.active ? '#10B981' : '#646473', color: '#FFF' }}>
                  {b.active ? 'EXIBIDA NO TOPO DO SITE' : 'INATIVA'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {b.stats?.viewsCount || 0} exibições
                </span>
              </div>

              {/* Preview da Barra Promocional */}
              <div
                style={{
                  background: b.backgroundColor || '#8B0000',
                  color: b.textColor || '#FFF',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1.25rem',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <Flame size={18} color="#FF9800" />
                  <span>{b.text}</span>
                </div>

                {b.couponCode && (
                  <span style={{ border: '1px dashed #FFF', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.82rem' }}>
                    {b.couponCode}
                  </span>
                )}

                {b.countdownEndDate && (
                  <CountdownTimer targetDate={b.countdownEndDate} />
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid #F0ECE4', paddingTop: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => handleToggleBar(b.id)} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', background: b.active ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: b.active ? '#EF4444' : '#10B981', fontWeight: 'bold', cursor: 'pointer' }}>
                  <Power size={16} /> {b.active ? 'Desativar Barra' : 'Ativar Barra'}
                </button>

                <button onClick={() => handleDeleteBar(b.id)} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#EF4444', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Criar Barra Promocional */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '640px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Criar Nova Barra Promocional</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={22} color="var(--text-dark)" />
                </button>
              </div>

              <form onSubmit={handleSaveBar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Texto da Barra *</label>
                  <input
                    type="text"
                    required
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>

                <div className="grid-2">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Código do Cupom</label>
                    <input
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Cor de Fundo</label>
                    <input
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      style={{ width: '100%', height: '44px', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Término do Contador Regressivo (56.18)</label>
                  <input
                    type="datetime-local"
                    value={formData.countdownEndDate}
                    onChange={(e) => setFormData({ ...formData, countdownEndDate: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--light-border)', paddingTop: '1rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                    CANCELAR
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Check size={18} /> ATIVAR BARRA PROMOCIONAL
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
