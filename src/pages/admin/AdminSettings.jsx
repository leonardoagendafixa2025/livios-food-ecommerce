import React, { useState, useEffect } from 'react';
import { Settings, Shield, CreditCard, Truck, Database, Check, RefreshCw, Download, Server } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [supabaseStatus, setSupabaseStatus] = useState({ configured: false, url: '', message: '' });
  const [supabaseForm, setSupabaseForm] = useState({
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceKey: ''
  });
  const [syncing, setSyncing] = useState(false);

  const { addToast } = useToast();

  const [syncResult, setSyncResult] = useState(null);

  const fetchSettingsAndSupabase = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(d => {
        if (d.success) setSettings(d.settings);
      });

    fetch('/api/admin/supabase/status')
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setSupabaseStatus(d);
          if (d.url) setSupabaseForm(prev => ({ ...prev, supabaseUrl: d.url }));
        }
      });
  };

  useEffect(() => {
    fetchSettingsAndSupabase();
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

  const handleSaveSupabaseConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supabaseForm)
      });
      const d = await res.json();
      if (d.success) {
        addToast(d.message, "success");
        fetchSettingsAndSupabase();
      } else {
        addToast(d.message || "Erro ao salvar credenciais do Supabase.", "error");
      }
    } catch (err) {
      addToast("Erro de comunicação ao salvar credenciais.", "error");
    }
  };

  const handleSyncSupabase = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/supabase/sync', { method: 'POST' });
      const d = await res.json();
      setSyncResult(d);
      if (d.success) {
        addToast(d.message, "success");
      } else {
        addToast(d.message || "Erro ao sincronizar dados com Supabase.", "error");
      }
    } catch (err) {
      addToast("Erro ao conectar ao Supabase.", "error");
    } finally {
      setSyncing(false);
    }
  };

  if (!settings) return <div style={{ padding: '2rem', fontWeight: 'bold' }}>Carregando configurações da loja...</div>;

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
          Configurações da Loja & Banco Supabase
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
          Gerencie a conexão com o banco de dados PostgreSQL Supabase, dados institucionais e regras de frete.
        </p>
      </div>

      {/* PAINEL DE CONEXÃO COM O BANCO DE DADOS SUPABASE */}
      <div className="admin-card" style={{ background: '#FAF8F4', border: '2px solid var(--accent-gold)', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Database size={26} color="var(--primary-burgundy)" />
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
              Conexão com Banco de Dados Supabase (PostgreSQL)
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Status da Conexão: <strong style={{ color: supabaseStatus.configured ? '#10B981' : '#EF4444' }}>
                {supabaseStatus.configured 
                  ? (supabaseStatus.health?.ok ? '🟢 CONECTADO E OPERACIONAL (PostgreSQL Supabase)' : '🟡 CONECTADO (Aguardando criação de tabelas SQL)')
                  : '🔴 AGUARDANDO CREDENCIAIS NO .ENV / PAINEL'}
              </strong>
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSupabaseConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
              Project URL do Supabase *
            </label>
            <input
              type="text"
              required
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseForm.supabaseUrl}
              onChange={(e) => setSupabaseForm({ ...supabaseForm, supabaseUrl: e.target.value })}
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', background: '#FFF' }}
            />
          </div>

          <div className="grid-2">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                Chave Pública (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={supabaseForm.supabaseAnonKey}
                onChange={(e) => setSupabaseForm({ ...supabaseForm, supabaseAnonKey: e.target.value })}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', background: '#FFF' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                Chave Privada (SUPABASE_SERVICE_ROLE_KEY)
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={supabaseForm.supabaseServiceKey}
                onChange={(e) => setSupabaseForm({ ...supabaseForm, supabaseServiceKey: e.target.value })}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', background: '#FFF' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', paddingTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
              <Check size={18} /> SALVAR CREDENCIAIS NO .ENV
            </button>

            <button
              type="button"
              onClick={handleSyncSupabase}
              disabled={syncing}
              className="btn btn-gold"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={18} className={syncing ? "spin" : ""} />
              {syncing ? "SINCRONIZANDO..." : "SINCRONIZAR PRODUTOS & DADOS COM SUPABASE"}
            </button>

            <a
              href="/supabase_schema.sql"
              download="supabase_schema.sql"
              className="btn btn-outline"
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
            >
              <Download size={16} /> BAIXAR SCRIPT SQL (TABLES DDL)
            </a>
          </div>
        </form>

        {syncResult && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: syncResult.success ? '#ECFDF5' : '#FEF2F2', borderRadius: '8px', border: syncResult.success ? '1px solid #10B981' : '1px solid #EF4444' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: syncResult.success ? '#065F46' : '#991B1B', marginBottom: '6px' }}>
              {syncResult.success ? "✅ Relatório de Sincronização Supabase:" : "⚠️ Aviso de Sincronização:"}
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '8px' }}>{syncResult.message}</p>
            {syncResult.syncReport && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', fontSize: '0.8rem' }}>
                <span className="badge" style={{ background: '#FFF' }}>Produtos: <strong>{syncResult.syncReport.products}</strong></span>
                <span className="badge" style={{ background: '#FFF' }}>Categorias: <strong>{syncResult.syncReport.categories}</strong></span>
                <span className="badge" style={{ background: '#FFF' }}>Clientes: <strong>{syncResult.syncReport.users}</strong></span>
                <span className="badge" style={{ background: '#FFF' }}>Pedidos: <strong>{syncResult.syncReport.orders}</strong></span>
                <span className="badge" style={{ background: '#FFF' }}>Cupons: <strong>{syncResult.syncReport.coupons}</strong></span>
                <span className="badge" style={{ background: '#FFF' }}>Banners: <strong>{syncResult.syncReport.banners}</strong></span>
                <span className="badge" style={{ background: '#FFF' }}>Lista Espera: <strong>{syncResult.syncReport.waitlist}</strong></span>
                <span className="badge" style={{ background: '#FFF' }}>Campanhas: <strong>{syncResult.syncReport.campaigns}</strong></span>
              </div>
            )}
          </div>
        )}
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
