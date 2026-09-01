import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Edit2, Trash2, Power, Check, X, Eye, Zap, ShieldAlert, MousePointer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';

export default function AdminPopups() {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: '🔥 GANHE 10% OFF NA PRIMEIRA COMPRA',
    description: 'Cadastre seu e-mail e ganhe um cupom de 10% OFF imediato para experimentar nossos molhos gourmet!',
    type: 'CUPOM',
    status: 'Ativo',
    couponCode: 'BEMVINDO10',
    buttonText: 'COPIAR CUPOM E COMPRAR',
    buttonLink: '/produtos',
    image: '/header-bg.jpg',
    position: 'center',
    trigger: 'time_delay',
    triggerDelaySeconds: 5,
    frequency: 'once_per_day',
    active: true
  });

  const fetchPopups = () => {
    fetch('/api/admin/popups')
      .then(res => res.json())
      .then(d => {
        if (d.success) setPopups(d.popups);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  const handleOpenModal = (pop = null) => {
    if (pop) {
      setEditingPopup(pop);
      setFormData({
        title: pop.title || '',
        description: pop.description || '',
        type: pop.type || 'CUPOM',
        status: pop.status || 'Ativo',
        couponCode: pop.couponCode || 'BEMVINDO10',
        buttonText: pop.buttonText || 'COPIAR CUPOM E COMPRAR',
        buttonLink: pop.buttonLink || '/produtos',
        image: pop.image || '/header-bg.jpg',
        position: pop.position || 'center',
        trigger: pop.trigger || 'time_delay',
        triggerDelaySeconds: pop.triggerDelaySeconds || 5,
        frequency: pop.frequency || 'once_per_day',
        active: pop.active ?? true
      });
    } else {
      setEditingPopup(null);
      setFormData({
        title: '🔥 OFERTA DA SEMANA DO SABOR',
        description: 'Ganhe 10% de desconto em todo o site Livio\'s Food!',
        type: 'CUPOM',
        status: 'Ativo',
        couponCode: 'LIVIO10',
        buttonText: 'COPIAR CUPOM E COMPRAR',
        buttonLink: '/produtos?ofertas=true',
        image: '/header-bg.jpg',
        position: 'center',
        trigger: 'time_delay',
        triggerDelaySeconds: 5,
        frequency: 'once_per_day',
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSavePopup = async (e) => {
    e.preventDefault();
    try {
      const url = editingPopup ? `/api/admin/popups/${editingPopup.id}` : '/api/admin/popups';
      const method = editingPopup ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const d = await res.json();
      if (d.success) {
        addToast(d.message || "Pop-up salvo com sucesso!", "success");
        setIsModalOpen(false);
        fetchPopups();
      }
    } catch (err) {
      addToast("Erro ao salvar pop-up.", "error");
    }
  };

  const handleTogglePopup = async (id) => {
    try {
      const res = await fetch(`/api/admin/popups/${id}/toggle`, { method: 'PUT' });
      const d = await res.json();
      if (d.success) {
        addToast(d.message, "success");
        fetchPopups();
      }
    } catch (err) {
      addToast("Erro ao alternar status do pop-up.", "error");
    }
  };

  const handleDeletePopup = async (id) => {
    if (!window.confirm("Deseja realmente excluir este pop-up?")) return;
    try {
      const res = await fetch(`/api/admin/popups/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        addToast("Pop-up excluído com sucesso!", "success");
        fetchPopups();
      }
    } catch (err) {
      addToast("Erro ao excluir pop-up.", "error");
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
            Gestão de Pop-ups Promocionais (56.10)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Configure pop-ups de cupom, ofertas de produtos, gatilhos de tempo/scroll e controle de frequência.
          </p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> + NOVO POP-UP
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando pop-ups...</div>
      ) : (
        <div className="grid-2">
          {popups.map(p => (
            <motion.div key={p.id} layout className="admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold-hover)' }}>
                  {p.type}
                </span>

                <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold', background: p.active ? '#10B981' : '#646473', color: '#FFF' }}>
                  {p.active ? 'ATIVO NO SITE' : 'INATIVO'}
                </span>
              </div>

              <div style={{ width: '100%', height: '160px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '1rem', background: '#0D0D11' }}>
                <img src={p.image || '/header-bg.jpg'} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-serif)', marginBottom: '0.4rem' }}>{p.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{p.description}</p>

              <div style={{ background: '#FAF8F4', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: '1.25rem', border: '1px solid var(--light-border)' }}>
                <div>Gatilho: <strong>{p.trigger === 'time_delay' ? `Tempo (${p.triggerDelaySeconds || 5} seg)` : p.trigger}</strong></div>
                <div>Frequência: <strong>{p.frequency === 'once_per_day' ? '1x por dia' : 'Sempre'}</strong></div>
                <div>Cupom: <code>{p.couponCode || 'Nenhum'}</code></div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #F0ECE4', paddingTop: '1rem' }}>
                <button onClick={() => handleOpenModal(p)} className="btn btn-outline" style={{ flexGrow: 1, padding: '0.5rem', fontSize: '0.82rem' }}>
                  <Edit2 size={16} /> EDITAR
                </button>
                <button onClick={() => handleTogglePopup(p.id)} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', background: p.active ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: p.active ? '#EF4444' : '#10B981', fontWeight: 'bold', cursor: 'pointer' }}>
                  <Power size={16} />
                </button>
                <button onClick={() => handleDeletePopup(p.id)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#EF4444', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Editor de Pop-up */}
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
              style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>
                  {editingPopup ? 'Editar Pop-up Promocional' : 'Criar Novo Pop-up'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={22} color="var(--text-dark)" />
                </button>
              </div>

              <form onSubmit={handleSavePopup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <ImageUploader
                  label="Upload da Imagem do Pop-up *"
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                />

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Título do Pop-up *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Descrição *</label>
                  <textarea
                    rows="2"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>

                <div className="grid-2">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Tipo de Pop-up</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    >
                      <option value="CUPOM">Pop-up de Cupom</option>
                      <option value="PROMOÇÃO">Pop-up de Promoção</option>
                      <option value="LANÇAMENTO">Pop-up de Lançamento</option>
                      <option value="CAPTURA">Pop-up de Captura de Lead</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Código do Cupom</label>
                    <input
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                      placeholder="LIVIO10"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Gatilho de Exibição (56.14)</label>
                    <select
                      value={formData.trigger}
                      onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    >
                      <option value="time_delay">Ao entrar na página (após X segundos)</option>
                      <option value="scroll">Após rolar 50% da página</option>
                      <option value="exit_intent">Intenção de Saída (Exit Intent)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Segundos de Atraso</label>
                    <input
                      type="number"
                      value={formData.triggerDelaySeconds}
                      onChange={(e) => setFormData({ ...formData, triggerDelaySeconds: parseInt(e.target.value) })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Regra de Frequência (56.13)</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  >
                    <option value="once_per_day">Exibir no máximo 1 vez por dia (Recomendado)</option>
                    <option value="once_per_session">Exibir 1 vez por sessão de navegação</option>
                    <option value="always">Exibir sempre</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--light-border)', paddingTop: '1rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                    CANCELAR
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Check size={18} /> SALVAR POP-UP
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
