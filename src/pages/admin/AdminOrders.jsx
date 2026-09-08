import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Eye, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Search, 
  Trash2, 
  MessageCircle, 
  ExternalLink,
  Send,
  Copy
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';
import { createWhatsAppUrl } from '../../utils/whatsapp.js';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [modalTrackingCode, setModalTrackingCode] = useState('');

  const { addToast } = useToast();

  const fetchOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(d => {
        if (d.success) setOrders(d.orders);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id, status, trackingCode = '') => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, trackingCode })
      });
      const d = await res.json();
      if (d.success) {
        addToast("Status do pedido atualizado!", "success");
        fetchOrders();
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(d.order);
        }
      }
    } catch (err) {
      addToast("Erro ao atualizar status.", "error");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o pedido #${orderId}?\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
      const d = await res.json();
      if (d.success) {
        addToast(`Pedido #${orderId} excluído com sucesso!`, "success");
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
      } else {
        addToast(d.message || "Erro ao excluir pedido.", "error");
      }
    } catch (err) {
      addToast("Erro de conexão ao excluir o pedido.", "error");
    }
  };

  // Helper para abrir WhatsApp direto com o cliente
  const openCustomerWhatsApp = (order) => {
    const rawPhone = (order.customerPhone || '').replace(/\D/g, '');
    if (!rawPhone) {
      addToast("Telefone do cliente não informado.", "error");
      return;
    }

    const phoneFormatted = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    const statusMap = {
      received: 'Recebido e em Análise',
      payment_approved: 'Pagamento Aprovado',
      in_preparation: 'Em Preparação Artesanal',
      shipped: 'Enviado / Em Trânsito',
      delivered: 'Entregue com Sucesso',
      cancelled: 'Cancelado'
    };

    const statusText = statusMap[order.status] || order.status;
    const trackingUrl = `${window.location.origin}/rastreio/${order.id}`;

    const text = 
`Olá, *${order.customerName}*! Tudo bem? 🔥
Aqui é da equipe *Livio's Food Innovation*.

Atualização sobre o seu *Pedido #${order.id}*:
📊 *Status Atual:* ${statusText}
${order.trackingCode ? `📦 *Código de Rastreamento (Correios/Transportadora):* ${order.trackingCode}\n` : ''}
🔗 *Você pode acompanhar cada detalhe em tempo real pelo link:*
${trackingUrl}

Qualquer dúvida ou se precisar de algo adicional, estamos à sua disposição por aqui! Obrigado pela confiança.`;

    window.open(createWhatsAppUrl(phoneFormatted, text), '_blank');
  };

  const filtered = orders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.customerEmail || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.customerPhone || '').includes(search)
  );

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Gestão de Pedidos</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gerencie os pedidos recebidos via WhatsApp, atualize status e envie notificações com 1 clique.</p>
      </div>

      <div className="admin-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '360px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder="Buscar por código, cliente, WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
          />
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Total de Pedidos: <strong>{filtered.length}</strong>
        </div>
      </div>

      <div className="admin-card">
        <table className="table-custom">
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Data</th>
              <th>Cliente & WhatsApp</th>
              <th>Pagamento</th>
              <th>Total</th>
              <th>Status Atual</th>
              <th>Ações & WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              filtered.map(o => (
                <tr key={o.id}>
                  <td>
                    <strong>#{o.id}</strong>
                    {o.trackingCode && (
                      <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 'bold' }}>
                        🚚 {o.trackingCode}
                      </div>
                    )}
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <div><strong>{o.customerName}</strong></div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.customerPhone || o.customerEmail}</div>
                  </td>
                  <td style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.8rem' }}>{o.paymentMethod}</td>
                  <td style={{ fontWeight: '800', color: 'var(--primary-burgundy)' }}>
                    R$ {(o.total || 0).toFixed(2).replace('.', ',')}
                  </td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => handleUpdateStatus(o.id, e.target.value, o.trackingCode || '')}
                      style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontSize: '0.82rem', fontWeight: 'bold' }}
                    >
                      <option value="received">Pedido Recebido (Zap)</option>
                      <option value="payment_approved">Pagamento Aprovado</option>
                      <option value="in_preparation">Em Preparação</option>
                      <option value="shipped">Enviado</option>
                      <option value="delivered">Entregue</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {/* Botão Notificar Cliente no Zap */}
                      <button
                        onClick={() => openCustomerWhatsApp(o)}
                        className="btn"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', background: '#25D366', color: '#FFF', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Enviar atualização de status para o WhatsApp do cliente"
                      >
                        <MessageCircle size={14} /> Zap
                      </button>

                      <button 
                        onClick={() => {
                          setSelectedOrder(o);
                          setModalTrackingCode(o.trackingCode || '');
                        }} 
                        className="btn btn-outline" 
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }} 
                        title="Ver detalhes do pedido"
                      >
                        <Eye size={14} />
                      </button>

                      <button 
                        onClick={() => handleDeleteOrder(o.id)} 
                        className="btn btn-outline" 
                        style={{ padding: '0.35rem 0.55rem', fontSize: '0.8rem', color: '#EF4444', borderColor: '#FCA5A5' }}
                        title="Excluir pedido permanentemente"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detalhes do Pedido */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFF', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', margin: 0 }}>
                  Pedido #{selectedOrder.id}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a
                  href={`/rastreio/${selectedOrder.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={14} /> Ver Rastreio Público
                </a>
                <button onClick={() => window.print()} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}>
                  <Printer size={14} /> Recibo
                </button>
                <button 
                  onClick={() => handleDeleteOrder(selectedOrder.id)} 
                  className="btn btn-outline" 
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem', color: '#EF4444', borderColor: '#FCA5A5' }}
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>

            {/* Painel de Ação Rápida WhatsApp */}
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#166534', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageCircle size={18} color="#16A34A" /> WhatsApp do Cliente: {selectedOrder.customerPhone || 'Não informado'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#15803D' }}>
                  Clique para enviar mensagem automática com o status e link de rastreamento.
                </div>
              </div>
              <button
                onClick={() => openCustomerWhatsApp(selectedOrder)}
                className="btn"
                style={{ background: '#25D366', color: '#FFF', fontWeight: 'bold', padding: '0.6rem 1.2rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Send size={15} /> Notificar Cliente no Zap
              </button>
            </div>

            {/* Gerenciamento de Código de Rastreamento */}
            <div style={{ background: '#FAF8F5', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                Código de Rastreamento (Correios / Transportadora):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Ex: BR123456789BR"
                  value={modalTrackingCode}
                  onChange={(e) => setModalTrackingCode(e.target.value)}
                  style={{ flexGrow: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', textTransform: 'uppercase' }}
                />
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status, modalTrackingCode)}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Salvar Rastreio
                </button>
              </div>
            </div>

            {/* Dados do Cliente e Endereço */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Dados do Cliente:</strong>
                <div>{selectedOrder.customerName}</div>
                <div>CPF: {selectedOrder.customerCpf || 'Não informado'}</div>
                <div>Tel / Zap: {selectedOrder.customerPhone || 'Não informado'}</div>
                <div>Email: {selectedOrder.customerEmail}</div>
              </div>

              <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Endereço de Entrega:</strong>
                {selectedOrder.shippingAddress ? (
                  <>
                    <div>{selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.number} {selectedOrder.shippingAddress.complement}</div>
                    <div>{selectedOrder.shippingAddress.neighborhood} — {selectedOrder.shippingAddress.city}/{selectedOrder.shippingAddress.state}</div>
                    <div>CEP: {selectedOrder.shippingAddress.cep}</div>
                  </>
                ) : (
                  <div>Endereço não disponível</div>
                )}
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Itens Comprados:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {(selectedOrder.items || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #F0ECE4', fontSize: '0.9rem' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <strong style={{ color: 'var(--primary-burgundy)' }}>R$ {(item.totalPrice || item.unitPrice * item.quantity || 0).toFixed(2).replace('.', ',')}</strong>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid var(--light-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>
              <span>Total do Pedido:</span>
              <span style={{ color: 'var(--primary-burgundy)' }}>R$ {(selectedOrder.total || 0).toFixed(2).replace('.', ',')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-primary">
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
