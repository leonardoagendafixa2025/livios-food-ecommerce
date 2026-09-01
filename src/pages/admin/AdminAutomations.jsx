import React, { useState, useEffect } from 'react';
import { Zap, Clock, Send, ShieldCheck, Check, Power, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminAutomations() {
  const [automations, setAutomations] = useState([
    {
      id: 'auto_1',
      name: 'Recuperação de Carrinho Abandonado (1h)',
      trigger: 'abandoned_cart',
      delayHours: 1,
      channel: 'whatsapp',
      status: 'Ativo',
      template: 'Olá {{primeiro_nome}}! Notamos que você deixou molhos especiais no seu carrinho na {{nome_loja}}. Conclua seu pedido com frete grátis usando o cupom {{codigo_cupom}}!',
      couponCode: 'FRETEGRATIS',
      stats: { triggeredCount: 0, recoveredCount: 0, recoveredRevenue: 0 }
    },
    {
      id: 'auto_2',
      name: 'Reativação de Cliente Inativo (60 dias)',
      trigger: 'inactive_60_days',
      delayHours: 1440,
      channel: 'email',
      status: 'Ativo',
      template: 'Sentimos sua falta, {{primeiro_nome}}! Que tal experimentar nosso lançamento Molho Chocolate Mega Picante com 10% OFF?',
      couponCode: 'BEMVINDO10',
      stats: { triggeredCount: 0, recoveredCount: 0, recoveredRevenue: 0 }
    },
    {
      id: 'auto_3',
      name: 'Pós-Compra & Solicitação de Avaliação (7 dias)',
      trigger: 'post_purchase',
      delayHours: 168,
      channel: 'whatsapp',
      status: 'Ativo',
      template: 'Olá {{primeiro_nome}}! Esperamos que esteja amando seus molhos da {{nome_loja}}! Deixe sua avaliação no site e ganhe um presente no próximo pedido.',
      couponCode: 'LIVIO10',
      stats: { triggeredCount: 110, recoveredCount: 38, recoveredRevenue: 2890.00 }
    },
    {
      id: 'auto_4',
      name: 'Aniversário do Cliente (Cupom Especial)',
      trigger: 'birthday',
      delayHours: 0,
      channel: 'email',
      status: 'Ativo',
      template: 'Feliz Aniversário, {{primeiro_nome}}! A {{nome_loja}} preparou um presente exclusivo: 15% OFF no seu próximo pedido com o cupom {{codigo_cupom}}!',
      couponCode: 'ANIV15',
      stats: { triggeredCount: 22, recoveredCount: 9, recoveredRevenue: 810.00 }
    }
  ]);

  const { addToast } = useToast();

  const handleToggle = (id) => {
    setAutomations(prev => prev.map(a => {
      if (a.id === id) {
        const newStatus = a.status === 'Ativo' ? 'Inativo' : 'Ativo';
        addToast(`Automação "${a.name}" alterada para ${newStatus}!`, "success");
        return { ...a, status: newStatus };
      }
      return a;
    }));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
          Campanhas Automáticas & Triggers (56.21)
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Fluxos automatizados acionados por eventos como carrinho abandonado, clientes inativos e pós-compra.
        </p>
      </div>

      {/* Regra de Frequência & Consentimento 56.22 */}
      <div style={{ background: '#FAF8F4', border: '1px solid var(--light-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ShieldCheck size={26} />
        </div>
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
            56.22 Proteção de Frequência & Consentimento LGPD
          </h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            O sistema respeita automaticamente o campo <strong>"marketingConsent"</strong> do cliente e limita disparos para no máximo 1 mensagem automática a cada 48 horas por cliente.
          </p>
        </div>
      </div>

      {/* Lista de Automações */}
      <div className="grid-2">
        {automations.map(a => (
          <motion.div key={a.id} layout className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold', background: a.status === 'Ativo' ? '#10B981' : '#646473', color: '#FFF' }}>
                {a.status}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--primary-burgundy)', fontWeight: 'bold' }}>
                Canal: {a.channel.toUpperCase()}
              </span>
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
              {a.name}
            </h3>

            <div style={{ background: '#FFF', border: '1px solid var(--light-border)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: '#444', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              "{a.template}"
            </div>

            {/* Performance da Automação */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', background: '#FAF8F4', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid var(--light-border)' }}>
              <div>Disparos: <strong>{a.stats.triggeredCount}</strong></div>
              <div>Recuperados: <strong>{a.stats.recoveredCount}</strong></div>
              <div style={{ color: '#10B981', fontWeight: 'bold' }}>R$ {a.stats.recoveredRevenue.toFixed(2).replace('.', ',')}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F0ECE4', paddingTop: '1rem' }}>
              <button
                onClick={() => handleToggle(a.id)}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: a.status === 'Ativo' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: a.status === 'Ativo' ? '#EF4444' : '#10B981',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Power size={16} /> {a.status === 'Ativo' ? 'Pausar Automação' : 'Ativar Automação'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
