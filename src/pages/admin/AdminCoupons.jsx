import React, { useState } from 'react';
import { Tag, Plus } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([
    { id: 'coup_1', code: 'BEMVINDO10', type: 'percentage', value: 10, minPurchase: 50.00, usageLimit: 500, usedCount: 42, active: true, description: '10% de desconto na primeira compra' },
    { id: 'coup_2', code: 'FRETEGRATIS', type: 'free_shipping', value: 0, minPurchase: 100.00, usageLimit: 200, usedCount: 88, active: true, description: 'Frete grátis em compras acima de R$ 100' },
    { id: 'coup_3', code: 'LIVIOS20', type: 'fixed', value: 20.00, minPurchase: 120.00, usageLimit: 100, usedCount: 15, active: true, description: 'R$ 20 de desconto em pedidos de R$ 120+' }
  ]);

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
