import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit2, Trash2, Users, Send, Check, X, Eye, Monitor, Smartphone, Tablet, Tag, Sparkles, Filter, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('mobile'); // 'mobile', 'desktop'
  const [estimatedReach, setEstimatedReach] = useState(184);

  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    type: 'PROMOÇÃO',
    status: 'Ativa',
    channels: ['email', 'whatsapp'],
    segmentType: 'all',
    segmentLabel: 'Todos os clientes cadastrados',
    startDate: new Date().toISOString().substring(0, 16),
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 16),
    couponCode: 'LIVIO10',
    linkedProductId: '',
    image: '/header-bg.jpg',
    messageTitle: 'Olá, {{primeiro_nome}}! Oferta imperdível para você!',
    messageBody: 'Aproveite 10% OFF em toda a linha de molhos especiais da {{nome_loja}} usando o cupom {{codigo_cupom}}.',
    buttonText: 'APROVEITAR DESCONTO AGORA',
    buttonLink: '/produtos?ofertas=true',
    createPopup: true
  });

  const fetchCampaigns = () => {
    fetch('/api/admin/campaigns')
      .then(res => res.json())
      .then(d => {
        if (d.success) setCampaigns(d.campaigns);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSegmentChange = async (type) => {
    let label = 'Todos os clientes';
    if (type === 'purchased_only') label = 'Clientes que já compraram';
    if (type === 'never_purchased') label = 'Clientes que nunca compraram';
    if (type === 'inactive_60') label = 'Clientes inativos há mais de 60 dias';
    if (type === 'vip_spent') label = 'Clientes VIP (Gasto acumulado > R$ 200)';

    setFormData(prev => ({ ...prev, segmentType: type, segmentLabel: label }));

    try {
      const res = await fetch('/api/admin/campaigns/estimate-reach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentType: type })
      });
      const d = await res.json();
      if (d.success) setEstimatedReach(d.estimatedCount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChannelToggle = (channel) => {
    setFormData(prev => {
      const exists = prev.channels.includes(channel);
      const updated = exists ? prev.channels.filter(c => c !== channel) : [...prev.channels, channel];
      return { ...prev, channels: updated.length > 0 ? updated : ['email'] };
    });
  };

  const insertVariable = (variableStr) => {
    setFormData(prev => ({
      ...prev,
      messageBody: prev.messageBody + ' ' + variableStr
    }));
  };

  const handleOpenModal = (camp = null) => {
    if (camp) {
      setEditingCampaign(camp);
      setFormData({
        name: camp.name || '',
        title: camp.title || '',
        description: camp.description || '',
        type: camp.type || 'PROMOÇÃO',
        status: camp.status || 'Ativa',
        channels: camp.channels || ['email', 'whatsapp'],
        segmentType: camp.segment?.type || 'all',
        segmentLabel: camp.segment?.label || 'Todos os clientes',
        startDate: camp.startDate ? camp.startDate.substring(0, 16) : new Date().toISOString().substring(0, 16),
        endDate: camp.endDate ? camp.endDate.substring(0, 16) : new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 16),
        couponCode: camp.couponCode || '',
        linkedProductId: camp.linkedProductId || '',
        image: camp.image || '/header-bg.jpg',
        messageTitle: camp.message?.title || '',
        messageBody: camp.message?.body || '',
        buttonText: camp.message?.buttonText || 'COMPRAR AGORA',
        buttonLink: camp.message?.buttonLink || '/produtos',
        createPopup: false
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        name: 'Promoção Especial de Setembro',
        title: '🔥 10% OFF em toda a loja Livio\'s Food',
        description: 'Disparo de cupom exclusivo para clientes com pop-up ativado na Home.',
        type: 'PROMOÇÃO',
        status: 'Ativa',
        channels: ['email', 'whatsapp'],
        segmentType: 'all',
        segmentLabel: 'Todos os clientes',
        startDate: new Date().toISOString().substring(0, 16),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().substring(0, 16),
        couponCode: 'LIVIO10',
        linkedProductId: 'prod_1',
        image: '/header-bg.jpg',
        messageTitle: 'Olá, {{primeiro_nome}}! Oferta especial para você!',
        messageBody: 'Aproveite 10% OFF em todos os molhos com o cupom {{codigo_cupom}} exclusivo da {{nome_loja}}.',
        buttonText: 'APROVEITAR 10% OFF AGORA',
        buttonLink: '/produtos?ofertas=true',
        createPopup: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        segment: {
          type: formData.segmentType,
          label: formData.segmentLabel,
          estimatedCount: estimatedReach
        },
        message: {
          title: formData.messageTitle,
          body: formData.messageBody,
          buttonText: formData.buttonText,
          buttonLink: formData.buttonLink
        }
      };

      const url = editingCampaign ? `/api/admin/campaigns/${editingCampaign.id}` : '/api/admin/campaigns';
      const method = editingCampaign ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const d = await res.json();
      if (d.success) {
        addToast(d.message || "Campanha salva e ativada!", "success");
        setIsModalOpen(false);
        fetchCampaigns();
      } else {
        addToast(d.message || "Erro ao salvar campanha.", "error");
      }
    } catch (err) {
      addToast("Erro na comunicação com o servidor.", "error");
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta campanha?")) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        addToast("Campanha excluída com sucesso!", "success");
        fetchCampaigns();
      }
    } catch (err) {
      addToast("Erro ao excluir campanha.", "error");
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (activeTab === 'active') return c.status === 'Ativa';
    if (activeTab === 'scheduled') return c.status === 'Agendada';
    if (activeTab === 'draft') return c.status === 'Rascunho';
    if (activeTab === 'closed') return c.status === 'Encerrada';
    return true;
  });

  return (
    <div>
      {/* Top Bar com Título e Botão de Ação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
            Módulo de Campanhas Promocionais
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Crie, programe, segmenta públicos e acompanhe mensagens, aberturas, cliques e faturamento.
          </p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> + NOVA CAMPANHA
        </button>
      </div>

      {/* Tabs de Filtro de Status */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid var(--light-border)', marginBottom: '1.75rem' }}>
        {[
          { id: 'all', label: 'Todas as Campanhas' },
          { id: 'active', label: 'Ativas' },
          { id: 'scheduled', label: 'Agendadas' },
          { id: 'draft', label: 'Rascunhos' },
          { id: 'closed', label: 'Encerradas' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              background: 'transparent',
              fontWeight: 'bold',
              fontSize: '0.92rem',
              color: activeTab === t.id ? 'var(--primary-burgundy)' : 'var(--text-muted)',
              borderBottom: activeTab === t.id ? '3px solid var(--primary-burgundy)' : 'none',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista de Campanhas */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando módulo de campanhas...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredCampaigns.map(c => (
            <motion.div key={c.id} layout className="admin-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <img src={c.image || '/header-bg.jpg'} alt={c.name} style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold', background: c.status === 'Ativa' ? '#10B981' : 'var(--text-muted)', color: '#FFF' }}>
                        {c.status}
                      </span>
                      <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold-hover)' }}>
                        {c.type}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>{c.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Segmento: <strong>{c.segment?.label}</strong> | Canais: <strong>{c.channels.join(', ')}</strong> | Cupom: <code>{c.couponCode || 'Nenhum'}</code>
                    </div>
                  </div>
                </div>

                {/* Métricas e Ações */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>FATURAMENTO GERADO</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#10B981' }}>
                      R$ {(c.stats?.totalRevenue || 0).toFixed(2).replace('.', ',')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {c.stats?.conversionsCount || 0} conversões ({c.stats?.reachedCount || 0} alcançados)
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenModal(c)} className="btn btn-outline" style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}>
                      <Edit2 size={16} /> EDITAR
                    </button>
                    <button onClick={() => handleDeleteCampaign(c.id)} style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#EF4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Criação & Edição de Campanha */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '980px', maxHeight: '92vh', overflowY: 'auto', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>
                    {editingCampaign ? 'Editar Campanha Promocional' : '+ Nova Campanha Promocional'}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure segmentação, canais, mensagem e cupons vinculados</span>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={24} color="var(--text-dark)" />
                </button>
              </div>

              <form onSubmit={handleSaveCampaign} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                {/* Coluna Esquerda: Formulário de Configuração */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nome Interno da Campanha *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Oferta de Lançamento de Setembro"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>

                  <div className="grid-2">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Tipo de Campanha</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                      >
                        <option value="PROMOÇÃO">PROMOÇÃO</option>
                        <option value="LANÇAMENTO">LANÇAMENTO</option>
                        <option value="CUPOM">CUPOM DE DESCONTO</option>
                        <option value="QUEIMA DE ESTOQUE">QUEIMA DE ESTOQUE</option>
                        <option value="RECUPERAÇÃO">RECUPERAÇÃO DE INATIVOS</option>
                        <option value="CARRINHO ABANDONADO">CARRINHO ABANDONADO</option>
                        <option value="ANIVERSÁRIO">ANIVERSÁRIO</option>
                        <option value="DATA COMEMORATIVA">DATA COMEMORATIVA</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Cupom Vinculado</label>
                      <input
                        type="text"
                        value={formData.couponCode}
                        onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                        placeholder="Ex: LIVIO10"
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                      />
                    </div>
                  </div>

                  {/* 56.3 SEGMENTAÇÃO DE CLIENTES */}
                  <div style={{ background: '#FAF8F4', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--primary-burgundy)' }}>
                      <Filter size={16} /> 56.3 Segmentação de Clientes (Público-Alvo)
                    </label>
                    <select
                      value={formData.segmentType}
                      onChange={(e) => handleSegmentChange(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', marginBottom: '8px' }}
                    >
                      <option value="all">Todos os clientes cadastrados</option>
                      <option value="purchased_only">Clientes que já compraram</option>
                      <option value="never_purchased">Clientes que nunca compraram</option>
                      <option value="inactive_60">Clientes inativos há mais de 60 dias</option>
                      <option value="vip_spent">Clientes VIP (Gasto acumulado &gt; R$ 200)</option>
                    </select>

                    <div style={{ background: '#FFF', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary-burgundy)', border: '1px solid var(--light-border)' }}>
                      🎯 Esta campanha alcançará aproximadamente <strong>{estimatedReach} clientes</strong>.
                    </div>
                  </div>

                  {/* 56.5 CANAIS DE COMUNICAÇÃO */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>
                      56.5 Canais de Envio Selecionados
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {[
                        { id: 'email', label: 'E-mail Marketing' },
                        { id: 'whatsapp', label: 'WhatsApp Oficial' },
                        { id: 'sms', label: 'SMS' },
                        { id: 'site_notification', label: 'Notificação / Pop-up no Site' }
                      ].map(ch => (
                        <label key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.channels.includes(ch.id)}
                            onChange={() => handleChannelToggle(ch.id)}
                            style={{ accentColor: 'var(--primary-burgundy)', width: '16px', height: '16px' }}
                          />
                          {ch.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* UPLOADER DE IMAGEM */}
                  <ImageUploader
                    label="Imagem Ilustrativa da Campanha *"
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                  />

                  {/* 56.6 EDITOR DE MENSAGENS COM VARIÁVEIS DINÂMICAS */}
                  <div style={{ background: '#FAF8F4', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--primary-burgundy)' }}>
                      56.6 Editor da Mensagem com Variáveis Dinâmicas
                    </label>

                    {/* Botões de inserção de tags */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', alignSelf: 'center' }}>Inserir Tag:</span>
                      {['{{primeiro_nome}}', '{{nome_cliente}}', '{{codigo_cupom}}', '{{nome_loja}}'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => insertVariable(tag)}
                          style={{ padding: '3px 8px', background: '#FFF', border: '1px solid var(--light-border)', borderRadius: '4px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      required
                      value={formData.messageTitle}
                      onChange={(e) => setFormData({ ...formData, messageTitle: e.target.value })}
                      placeholder="Título da Mensagem"
                      style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', marginBottom: '8px' }}
                    />

                    <textarea
                      rows="3"
                      required
                      value={formData.messageBody}
                      onChange={(e) => setFormData({ ...formData, messageBody: e.target.value })}
                      placeholder="Texto da mensagem..."
                      style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="createPopupSync"
                      checked={formData.createPopup}
                      onChange={(e) => setFormData({ ...formData, createPopup: e.target.checked })}
                      style={{ accentColor: 'var(--primary-burgundy)', width: '18px', height: '18px' }}
                    />
                    <label htmlFor="createPopupSync" style={{ fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer' }}>
                      ☑ Criar Pop-up na Home automaticamente para esta campanha
                    </label>
                  </div>
                </div>

                {/* Coluna Direita: Preview em Tempo Real da Mensagem */}
                <div style={{ display: 'flex', flexDirection: 'column', background: '#0D0D11', borderRadius: 'var(--radius-md)', padding: '1.5rem', color: '#FFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                      📱 PREVIEW EM TEMPO REAL
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        style={{ padding: '4px 8px', borderRadius: '4px', background: previewDevice === 'mobile' ? 'var(--primary-burgundy)' : 'transparent', color: '#FFF', border: 'none', cursor: 'pointer' }}
                      >
                        <Smartphone size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        style={{ padding: '4px 8px', borderRadius: '4px', background: previewDevice === 'desktop' ? 'var(--primary-burgundy)' : 'transparent', color: '#FFF', border: 'none', cursor: 'pointer' }}
                      >
                        <Monitor size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Simulação da Tela do Smartphone */}
                  <div style={{ background: '#FFF', color: '#000', borderRadius: 'var(--radius-md)', padding: '1.25rem', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', marginTop: 'auto', marginBottom: 'auto' }}>
                    <img src={formData.image || '/header-bg.jpg'} alt="Preview" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.4rem', fontFamily: 'var(--font-serif)' }}>
                      {formData.messageTitle.replace('{{primeiro_nome}}', 'Ana').replace('{{nome_cliente}}', 'Ana Beatriz')}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                      {formData.messageBody
                        .replace('{{primeiro_nome}}', 'Ana')
                        .replace('{{codigo_cupom}}', formData.couponCode || 'LIVIO10')
                        .replace('{{nome_loja}}', "Livio's Food")}
                    </p>

                    <div style={{ background: 'var(--primary-burgundy)', color: '#FFF', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 'bold', fontSize: '0.88rem' }}>
                      {formData.buttonText || 'APROVEITAR DESCONTO AGORA'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ color: '#FFF', borderColor: '#FFF' }}>
                      CANCELAR
                    </button>
                    <button type="submit" className="btn btn-gold">
                      <Check size={18} /> ATIVAR CAMPANHA AGORA
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
