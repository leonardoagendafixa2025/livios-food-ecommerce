import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Calendar, Award, ShoppingBag, DollarSign, Clock, ShieldCheck, Tag, Plus, Check, ArrowLeft, Send, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function AdminCustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();
  const { addToast } = useToast();

  const fetchCustomerProfile = () => {
    fetch(`/api/admin/crm/customers/${id}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.customer);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomerProfile();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const res = await fetch(`/api/admin/crm/customers/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote, author: user?.name || 'Administrador' })
      });
      const d = await res.json();
      if (d.success) {
        addToast("Nota interna registrada no perfil!", "success");
        setNewNote('');
        fetchCustomerProfile();
      }
    } catch (err) {
      addToast("Erro ao adicionar nota.", "error");
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;

    const currentTags = data.tags || [];
    if (currentTags.includes(newTagInput.trim())) return;

    const updated = [...currentTags, newTagInput.trim()];

    try {
      const res = await fetch(`/api/admin/crm/customers/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updated })
      });
      const d = await res.json();
      if (d.success) {
        addToast("Tag adicionada ao cliente!", "success");
        setNewTagInput('');
        fetchCustomerProfile();
      }
    } catch (err) {
      addToast("Erro ao salvar tag.", "error");
    }
  };

  const handleDeleteCustomer = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/crm/customers/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        addToast(result.message || "Cliente excluído com sucesso!", "success");
        navigate('/admin/crm');
      } else {
        addToast(result.message || "Erro ao excluir cliente.", "error");
      }
    } catch (err) {
      addToast("Erro na comunicação com o servidor.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !data) {
    return <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando perfil 360° do cliente...</div>;
  }

  return (
    <div>
      {/* Header com Botão Voltar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/crm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary-burgundy)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
          <ArrowLeft size={16} /> Voltar para Central CRM
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
              {data.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 'bold', background: data.classification === 'VIP' ? 'rgba(212,175,55,0.2)' : 'rgba(16,185,129,0.15)', color: data.classification === 'VIP' ? 'var(--accent-gold-hover)' : '#10B981' }}>
                CLASSIFICAÇÃO: {data.classification}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cadastrado em: {new Date(data.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn"
              style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '6px', padding: '0.65rem 1.15rem' }}
            >
              <Trash2 size={16} /> EXCLUIR CLIENTE
            </button>
            <Link to={`/admin/marketing/campanhas`} className="btn btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} /> CRIAR CAMPANHA
            </Link>
          </div>
        </div>
      </div>

      {/* Grid de 3 Colunas: Bio | Métricas Financeiras | LGPD & Tags */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)' }}>
            Informações Pessoais
          </h4>
          <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div><strong>E-mail:</strong> {data.email}</div>
            <div><strong>Telefone / WhatsApp:</strong> {data.phone || 'Não informado'}</div>
            <div><strong>CPF:</strong> {data.cpf || 'Não informado'}</div>
            <div><strong>Endereço Principal:</strong> {data.addresses && data.addresses[0] ? `${data.addresses[0].street}, ${data.addresses[0].number} — ${data.addresses[0].city}/${data.addresses[0].state}` : 'Sem endereço'}</div>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)' }}>
            Histórico Financeiro
          </h4>
          <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div><strong>Total Gasto:</strong> <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10B981' }}>R$ {data.totalSpent.toFixed(2).replace('.', ',')}</span></div>
            <div><strong>Quantidade de Pedidos:</strong> <strong>{data.ordersCount} pedidos</strong></div>
            <div><strong>Ticket Médio:</strong> R$ {data.avgTicket.toFixed(2).replace('.', ',')}</div>
            <div><strong>Primeiro Pedido:</strong> {data.orders && data.orders[0] ? new Date(data.orders[0].createdAt).toLocaleDateString('pt-BR') : 'Nenhum'}</div>
          </div>
        </div>

        <div className="admin-card" style={{ marginBottom: 0 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)' }}>
            Tags & Consentimento LGPD
          </h4>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '4px' }}>CONSENTIMENTO DE MARKETING:</div>
            <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: data.marketingConsent ? '#10B981' : '#EF4444' }}>
              {data.marketingConsent ? '☑ Aceita comunicações promocionais' : '☒ Recusou comunicações'}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '4px' }}>TAGS DO CLIENTE:</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {(data.tags || []).map(t => (
                <span key={t} style={{ background: '#FAF8F4', border: '1px solid var(--light-border)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  #{t}
                </span>
              ))}
            </div>

            <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="+ Nova Tag..."
                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--light-border)', fontSize: '0.8rem', width: '120px' }}
              />
              <button type="submit" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.78rem' }}>Adicionar</button>
            </form>
          </div>
        </div>
      </div>

      {/* Grid Duplo: Linha do Tempo & Notas Internas Privadas */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* TIMELINE CRONOLÓGICA */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', marginBottom: '1.25rem', color: 'var(--text-dark)' }}>
            Timeline Cronológica de Interações
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--light-border)', paddingLeft: '1.25rem' }}>
            {(data.timelineEvents || []).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Nenhum evento registrado ainda.</div>
            ) : (
              (data.timelineEvents || []).map(ev => (
                <div key={ev.id} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-1.65rem', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary-burgundy)' }} />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    {new Date(ev.date).toLocaleString('pt-BR')}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.92rem', color: 'var(--text-dark)' }}>{ev.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ev.description}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* NOTAS INTERNAS DOS ADMINISTRADORES */}
        <div className="admin-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', marginBottom: '1.25rem', color: 'var(--text-dark)' }}>
            Notas Internas Privadas da Equipe
          </h3>

          <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              required
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escreva uma nota interna sobre o cliente..."
              style={{ flexGrow: 1, padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
            />
            <button type="submit" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>SALVAR</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(data.notes || []).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Nenhuma nota interna adicionada.</div>
            ) : (
              (data.notes || []).map(n => (
                <div key={n.id} style={{ background: '#FAF8F4', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-dark)', fontWeight: '500', marginBottom: '4px' }}>
                    "{n.note}"
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Por: <strong>{n.author}</strong> em {new Date(n.createdAt).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', padding: '2rem', maxWidth: '480px', width: '100%', boxShadow: 'var(--shadow-lg)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', color: '#DC2626' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={26} color="#DC2626" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                  Excluir Cliente Permanentemente?
                </h3>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                Tem certeza de que deseja excluir o cliente <strong>{data.name}</strong> ({data.email})? Esta ação removerá a conta e todos os dados associados.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCustomer}
                  disabled={isDeleting}
                  className="btn"
                  style={{ background: '#DC2626', color: '#FFF', padding: '0.65rem 1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={16} /> {isDeleting ? "EXCLUINDO..." : "SIM, EXCLUIR"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
