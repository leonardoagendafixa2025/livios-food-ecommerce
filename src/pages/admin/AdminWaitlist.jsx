import React, { useState, useEffect } from 'react';
import { BellRing, Send, Check, RefreshCw, Mail, MessageCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminWaitlist() {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchWaitlist = () => {
    fetch('/api/admin/waitlist')
      .then(res => res.json())
      .then(d => {
        if (d.success) setWaitlist(d.waitlist);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const handleNotify = async (ids = null, notifyAll = false) => {
    try {
      const res = await fetch('/api/admin/waitlist/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waitlistIds: ids, notifyAll })
      });
      const d = await res.json();
      if (d.success) {
        addToast(d.message, "success");
        fetchWaitlist();
      }
    } catch (err) {
      addToast("Erro ao enviar notificações.", "error");
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
            Lista de Espera — "Avise-me quando chegar" (1.1)
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Acompanhe clientes aguardando reposição de estoque e envie notificações automáticas via E-mail e WhatsApp.
          </p>
        </div>

        <button
          onClick={() => handleNotify(null, true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Send size={18} /> NOTIFICAR TODOS OS CLIENTES
        </button>
      </div>

      {/* Tabela de Solicitantes */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando solicitações de lista de espera...</div>
        ) : (
          <table className="table-custom">
            <thead>
              <tr>
                <th>Data da Solicitacao</th>
                <th>Produto Solicitado</th>
                <th>Cliente</th>
                <th>Canais de Notificação</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {waitlist.map(w => (
                <tr key={w.id}>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {new Date(w.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td>
                    <strong style={{ color: 'var(--primary-burgundy)' }}>{w.productSku}</strong>
                    <div style={{ fontWeight: 'bold' }}>{w.productName}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{w.customerName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{w.customerEmail} | {w.customerPhone}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {w.channels.includes('email') && <span style={{ background: '#FAF8F4', border: '1px solid var(--light-border)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>E-mail</span>}
                      {w.channels.includes('whatsapp') && <span style={{ background: 'rgba(37, 211, 102, 0.15)', color: '#25D366', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>WhatsApp</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold', background: w.status === 'Notificado' ? '#10B981' : w.status === 'Comprou' ? '#3B82F6' : 'var(--primary-burgundy)', color: '#FFF' }}>
                      {w.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleNotify([w.id], false)}
                      className="btn btn-outline"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                    >
                      NOTIFICAR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
