import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns3, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCompare } from '../contexts/CompareContext.jsx';

export default function CompareFloatingBar() {
  const { compareList, toggleCompare, clearCompare } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        style={{
          position: 'fixed',
          bottom: '70px', // Acima da nav mobile
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#0E0E14',
          color: '#FFF',
          padding: '0.85rem 1.5rem',
          borderRadius: 'var(--radius-full)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          maxWidth: '90vw'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.88rem' }}>
          <Columns3 size={20} color="var(--accent-gold)" />
          <span>COMPARANDO ({compareList.length}/4)</span>
        </div>

        {/* Miniview dos produtos */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {compareList.map(p => (
            <div key={p.id} style={{ position: 'relative' }}>
              <img src={p.images[0] || '/header-bg.jpg'} alt={p.name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--accent-gold)' }} />
              <button
                onClick={() => toggleCompare(p)}
                style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#EF4444', color: '#FFF', border: 'none', width: '16px', height: '16px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={clearCompare} style={{ background: 'transparent', border: 'none', color: '#AAA', fontSize: '0.78rem', cursor: 'pointer' }}>
            Limpar
          </button>

          <Link to="/comparar" className="btn btn-gold" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            COMPARAR AGORA <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
