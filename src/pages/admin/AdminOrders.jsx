import React, { useState, useEffect } from 'react';
import { ShoppingBag, Eye, Printer, CheckCircle2, Clock, Truck, Search } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');

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

  const filtered = orders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.customerEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Gestão de Pedidos</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gerencie o fluxo de aprovação, embalagem e envio das compras efetuadas.</p>
      </div>

      <div className="admin-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder="Buscar por código, cliente..."
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
              <th>Cliente</th>
              <th>Forma Pagamento</th>
              <th>Total</th>
              <th>Status Atual</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td><strong>#{o.id}</strong></td>
                <td>{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                <td>
                  <div><strong>{o.customerName}</strong></div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.customerEmail}</div>
                </td>
                <td style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{o.paymentMethod}</td>
                <td style={{ fontWeight: '800', color: 'var(--primary-burgundy)' }}>
                  R$ {o.total.toFixed(2).replace('.', ',')}
                </td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                    style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontSize: '0.82rem', fontWeight: 'bold' }}
                  >
                    <option value="received">Pedido Recebido</option>
                    <option value="payment_approved">Pagamento Aprovado</option>
                    <option value="in_preparation">Em Preparação</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => setSelectedOrder(o)} className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                    <Eye size={14} /> Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Detalhes do Pedido */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFF', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
                Pedido #{selectedOrder.id}
              </h3>
              <button onClick={() => window.print()} className="btn btn-outline" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>
                <Printer size={16} /> Imprimir Recibo
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Dados do Cliente:</strong>
                <div>{selectedOrder.customerName}</div>
                <div>CPF: {selectedOrder.customerCpf}</div>
                <div>Tel: {selectedOrder.customerPhone}</div>
                <div>Email: {selectedOrder.customerEmail}</div>
              </div>

              <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Endereço de Entrega:</strong>
                <div>{selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.number} {selectedOrder.shippingAddress.complement}</div>
                <div>{selectedOrder.shippingAddress.neighborhood} — {selectedOrder.shippingAddress.city}/{selectedOrder.shippingAddress.state}</div>
                <div>CEP: {selectedOrder.shippingAddress.cep}</div>
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Itens Comprados:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #F0ECE4', fontSize: '0.9rem' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <strong style={{ color: 'var(--primary-burgundy)' }}>R$ {item.totalPrice.toFixed(2).replace('.', ',')}</strong>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid var(--light-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem' }}>
              <span>Total Pago:</span>
              <span style={{ color: 'var(--primary-burgundy)' }}>R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</span>
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
