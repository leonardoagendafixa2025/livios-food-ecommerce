import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, ShoppingBag, Shield } from 'lucide-react';

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Carrega clientes da API real
    fetch('/api/admin/crm/dashboard')
      .then(res => res.json())
      .then(d => {
        if (d.success) setUsers(d.customers || []);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Gestão de Clientes</h1>
        <p style={{ color: 'var(--text-muted)' }}>Visualize os clientes cadastrados, histórico de compras e contatos.</p>
      </div>

      <div className="admin-card">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>CPF</th>
              <th>Pedidos Realizados</th>
              <th>Total Gasto</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>{u.cpf}</td>
                <td style={{ fontWeight: 'bold' }}>{u.ordersCount} pedidos</td>
                <td style={{ fontWeight: '800', color: 'var(--primary-burgundy)' }}>
                  R$ {u.totalSpent.toFixed(2).replace('.', ',')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
