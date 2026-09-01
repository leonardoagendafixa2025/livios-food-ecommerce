import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Flame } from 'lucide-react';
import CountdownTimer from './CountdownTimer.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

export default function PromotionalBar({ activeBar }) {
  const [closed, setClosed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  if (!activeBar || closed || !activeBar.active) return null;

  const handleCopyCoupon = () => {
    if (activeBar.couponCode) {
      navigator.clipboard.writeText(activeBar.couponCode);
      setCopied(true);
      addToast(`Cupom ${activeBar.couponCode} copiado com sucesso!`, "success");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div
      style={{
        background: activeBar.backgroundColor || 'var(--primary-burgundy)',
        color: activeBar.textColor || '#FFFFFF',
        padding: '0.5rem 1rem',
        fontSize: '0.85rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        position: 'relative',
        zIndex: 105,
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Flame size={16} color="#FF9800" />
        <span>{activeBar.text}</span>
      </div>

      {activeBar.couponCode && (
        <button
          onClick={handleCopyCoupon}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px dashed #FFF',
            color: '#FFF',
            padding: '3px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{activeBar.couponCode}</span>
        </button>
      )}

      {activeBar.countdownEndDate && (
        <CountdownTimer targetDate={activeBar.countdownEndDate} />
      )}

      <button
        onClick={() => setClosed(true)}
        style={{
          position: 'absolute',
          right: '12px',
          background: 'transparent',
          border: 'none',
          color: '#FFF',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center'
        }}
        title="Fechar anúncio"
      >
        <X size={16} />
      </button>
    </div>
  );
}
