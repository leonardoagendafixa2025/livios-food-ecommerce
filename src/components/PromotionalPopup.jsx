import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, ShoppingBag, Send, Gift, Sparkles } from 'lucide-react';
import { useCart } from '../contexts/CartContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function PromotionalPopup({ activePopups }) {
  const [popup, setPopup] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const { addToCart } = useCart();
  const { addToast } = useToast();

  useEffect(() => {
    if (!activePopups || activePopups.length === 0) return;

    const targetPopup = activePopups[0];
    if (!targetPopup || !targetPopup.active) return;

    // Regra de Frequência (uma vez por dia no localStorage)
    const storageKey = `popup_seen_${targetPopup.id}`;
    const lastSeen = localStorage.getItem(storageKey);

    if (targetPopup.frequency === 'once_per_day' && lastSeen) {
      const oneDay = 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(lastSeen) < oneDay) {
        return;
      }
    }

    // Gatilho por tempo ou intenção de saída
    const delayMs = (targetPopup.triggerDelaySeconds || 3) * 1000;
    const timer = setTimeout(() => {
      setPopup(targetPopup);
      setIsOpen(true);
      localStorage.setItem(storageKey, Date.now().toString());

      // Notifica evento ao backend
      fetch('/api/marketing/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'popup', entityId: targetPopup.id, eventName: 'view' })
      });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [activePopups]);

  if (!popup || !isOpen) return null;

  const handleCopyCoupon = () => {
    if (popup.couponCode) {
      navigator.clipboard.writeText(popup.couponCode);
      setCopied(true);
      addToast(`Cupom ${popup.couponCode} copiado!`, "success");

      fetch('/api/marketing/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'popup', entityId: popup.id, eventName: 'click' })
      });

      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleLeadSubmit = (e) => {
    e.preventDefault();
    setLeadSubmitted(true);
    addToast("Cupom exclusivo enviado para o seu e-mail!", "success");

    fetch('/api/marketing/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'popup', entityId: popup.id, eventName: 'conversion' })
    });
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
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem'
        }}
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botão Fechar */}
          <button
            onClick={() => setIsOpen(false)}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              zIndex: 10,
              background: 'rgba(0,0,0,0.5)',
              color: '#FFF',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>

          {/* Imagem de Destaque */}
          {popup.image && (
            <div style={{ width: '100%', height: '200px', overflow: 'hidden', position: 'relative' }}>
              <img src={popup.image} alt={popup.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
              <div style={{ position: 'absolute', bottom: '15px', left: '20px', color: 'var(--accent-gold)', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> OFERTA EXCLUSIVA LIVIO'S FOOD
              </div>
            </div>
          )}

          {/* Conteúdo do Pop-up */}
          <div style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)', marginBottom: '0.5rem', lineHeight: '1.2' }}>
              {popup.title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {popup.description}
            </p>

            {/* Caso de Pop-up de Captura de Lead */}
            {popup.type === 'CAPTURA' || popup.type === 'LEAD' ? (
              leadSubmitted ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', color: '#10B981', padding: '1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 'bold' }}>
                  🎉 Parabéns! Seu cupom <strong>{popup.couponCode || 'LIVIO10'}</strong> foi gerado e enviado para seu e-mail!
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <input
                    type="text"
                    required
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Seu nome completo"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)' }}
                  />
                  <input
                    type="email"
                    required
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="Seu melhor e-mail"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem', fontSize: '1rem' }}>
                    <Send size={18} /> RECEBER MEU CUPOM DE 10% OFF
                  </button>
                </form>
              )
            ) : (
              /* Caso de Pop-up com Cupom e Botão de Ação */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {popup.couponCode && (
                  <div style={{ background: '#FAF8F4', border: '2px dashed var(--primary-burgundy)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>CÓDIGO DO CUPOM:</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-burgundy)', letterSpacing: '1px' }}>
                        {popup.couponCode}
                      </div>
                    </div>

                    <button
                      onClick={handleCopyCoupon}
                      className="btn btn-gold"
                      style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      {copied ? 'COPIADO!' : 'COPIAR CUPOM'}
                    </button>
                  </div>
                )}

                <a
                  href={popup.buttonLink || '/produtos'}
                  onClick={() => setIsOpen(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', textAlign: 'center' }}
                >
                  <ShoppingBag size={18} /> {popup.buttonText || 'APROVEITAR OFERTA AGORA'}
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
