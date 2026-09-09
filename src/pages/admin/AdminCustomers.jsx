import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, ShoppingBag, Shield, Trash2, Eye, Search, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  const fetchUsers = () => {
    fetch('/api/admin/crm/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.success) setUsers(d.customers || []);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/crm/customers/${customerToDelete.id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        addToast(result.message || "Cliente excluído com sucesso!", "success");
        setCustomerToDelete(null);
        fetchUsers();
      } else {
        addToast(result.message || "Erro ao excluir cliente.", "error");
      }
    } catch (err) {
      addToast("Erro na comunicação com o servidor.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.cpf || '').includes(search) ||
    (u.phone || '').includes(search)
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Gestão de Clientes</h1>
          <p style={{ color: 'var(--text-muted)' }}>Visualize os clientes cadastrados, histórico de compras, contatos e gerencie exclusões.</p>
        </div>

        <div className="search-bar-wrap" style={{ width: '260px' }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por Nome, E-mail, CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div className="admin-card">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone / WhatsApp</th>
              <th>CPF</th>
              <th>Pedidos Realizados</th>
              <th>Total Gasto</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhum cliente cadastrado ou localizado na busca.
                </td>
              </tr>
            ) : (
              filtered.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone || 'Não informado'}</td>
                  <td>{u.cpf || 'Não informado'}</td>
                  <td style={{ fontWeight: 'bold' }}>{u.ordersCount || 0} pedidos</td>
                  <td style={{ fontWeight: '800', color: 'var(--primary-burgundy)' }}>
                    R$ {(u.totalSpent || 0).toFixed(2).replace('.', ',')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link to={`/admin/crm/cliente/${u.id}`} className="btn btn-outline" style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={14} /> Ficha 360°
                      </Link>
                      <button
                        onClick={() => setCustomerToDelete(u)}
                        className="btn"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: 'var(--radius-sm)' }}
                        title="Excluir cliente"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {customerToDelete && (
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
                Tem certeza de que deseja excluir o cliente <strong>{customerToDelete.name}</strong> ({customerToDelete.email})? Esta ação removerá a conta do cliente e dados vinculados.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
                  disabled={isDeleting}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  CANCELAR
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
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
