import React, { useState, useEffect } from 'react';
import { Tag, Plus } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    fetch('/api/coupons')
      .then(res => res.json())
      .then(d => {
        if (d.success) setCoupons(d.coupons || []);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Gestão de Cupons de Desconto</h1>
        <p style={{ color: 'var(--text-muted)' }}>Crie e acompanhe cupons promocionais em percentual, valor fixo ou frete grátis.</p>
      </div>

      <div className="admin-card">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Código</th>
              <th>Tipo</th>
              <th>Valor / Desconto</th>
              <th>Compra Mínima</th>
              <th>Usos / Limite</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id}>
                <td><strong style={{ color: 'var(--primary-burgundy)', fontSize: '1.05rem' }}>{c.code}</strong></td>
                <td style={{ textTransform: 'capitalize' }}>{c.type === 'percentage' ? 'Percentual' : c.type === 'fixed' ? 'Valor Fixo' : 'Frete Grátis'}</td>
                <td style={{ fontWeight: 'bold' }}>
                  {c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? `R$ ${c.value.toFixed(2).replace('.', ',')}` : 'Frete Grátis'}
                </td>
                <td>R$ {c.minPurchase ? c.minPurchase.toFixed(2).replace('.', ',') : '0,00'}</td>
                <td>{c.usedCount} / {c.usageLimit}</td>
                <td>
                  <span style={{ background: '#10B981', color: '#FFF', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold' }}>ATIVO</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
