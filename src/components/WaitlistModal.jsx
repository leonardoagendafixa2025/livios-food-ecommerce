import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X, Check, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function WaitlistModal({ product, isOpen, onClose }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [channels, setChannels] = useState(['email', 'whatsapp']);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const handleChannelToggle = (ch) => {
    setChannels(prev => {
      const exists = prev.includes(ch);
      const updated = exists ? prev.filter(c => c !== ch) : [...prev, ch];
      return updated.length > 0 ? updated : ['email'];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name,
          email,
          phone,
          channels,
          quantity
        })
      });

      const d = await res.json();
      if (d.success) {
        addToast(d.message, "success");
        onClose();
      } else {
        addToast(d.message || "Erro ao entrar na lista de espera.", "error");
      }
    } catch (err) {
      addToast("Erro na comunicação com o servidor.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1300,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={{
            background: '#FFF',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '520px',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={22} color="var(--text-dark)" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--primary-burgundy)' }}>
            <BellRing size={28} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
              Avise-me quando chegar!
            </h3>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
            O produto <strong>"{product.name}"</strong> está temporariamente esgotado. Preencha seus dados para receber um aviso prioritário no WhatsApp ou E-mail assim que a produção for concluída.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Seu Nome *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
              />
            </div>

            <div className="grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>E-mail *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>WhatsApp / Celular</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(31) 99567-5327"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>Como prefere ser notificado?</label>
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={channels.includes('email')}
                    onChange={() => handleChannelToggle('email')}
                    style={{ accentColor: 'var(--primary-burgundy)', width: '16px', height: '16px' }}
                  />
                  E-mail
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={channels.includes('whatsapp')}
                    onChange={() => handleChannelToggle('whatsapp')}
                    style={{ accentColor: 'var(--primary-burgundy)', width: '16px', height: '16px' }}
                  />
                  WhatsApp
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--light-border)', paddingTop: '1rem' }}>
              <button type="button" onClick={onClose} className="btn btn-outline">
                CANCELAR
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Send size={16} /> ENTAR NA LISTA DE ESPERA
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
