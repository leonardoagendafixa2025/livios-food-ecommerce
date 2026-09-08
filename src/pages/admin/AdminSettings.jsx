import React, { useState, useEffect } from 'react';
import { Settings, Shield, CreditCard, Truck, Check } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const { addToast } = useToast();

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(d => {
        if (d.success) setSettings(d.settings);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmitSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const d = await res.json();
      if (d.success) {
        addToast("Configurações da loja atualizadas!", "success");
      }
    } catch (err) {
      addToast("Erro ao salvar configurações.", "error");
    }
  };

  if (!settings) return <div style={{ padding: '2rem', fontWeight: 'bold' }}>Carregando configurações da loja...</div>;

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
          Configurações da Loja
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Gerencie dados institucionais, regras de frete e gateways de pagamento da loja.
        </p>
      </div>

      <form onSubmit={handleSubmitSettings} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Dados Institucionais */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>
            Dados Institucionais da Empresa
          </h3>

          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nome da Loja</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>CNPJ</label>
              <input
                type="text"
                value={settings.cnpj}
                onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
              />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>WhatsApp Atendimento</label>
              <input
                type="text"
                value={settings.whatsapp}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>E-mail de Contato</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
              />
            </div>
          </div>
        </div>

        {/* Gateways de Pagamento */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>
            Configuração dos Gateways de Pagamento
          </h3>

          <div className="grid-2" style={{ marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Desconto PIX (%)</label>
              <input
                type="number"
                value={settings.gateways.pixDiscountPercent}
                onChange={(e) => setSettings({ ...settings, gateways: { ...settings.gateways, pixDiscountPercent: parseFloat(e.target.value) } })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Máximo de Parcelas no Cartão</label>
              <input
                type="number"
                value={settings.gateways.creditCardInstallmentsMax}
                onChange={(e) => setSettings({ ...settings, gateways: { ...settings.gateways, creditCardInstallmentsMax: parseInt(e.target.value) } })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ padding: '0.9rem 2rem', alignSelf: 'flex-start' }}>
          SALVAR CONFIGURAÇÕES DA LOJA
        </button>
      </form>
    </div>
  );
}
