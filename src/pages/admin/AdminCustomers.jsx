import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, ShoppingBag, Shield } from 'lucide-react';

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Carrega clientes da API
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(() => {
        // Simulando lista de clientes cadastrados
        setUsers([
          { id: 'usr_cust_1', name: 'Ana Beatriz Oliveira', email: 'ana.oliveira@gmail.com', phone: '(11) 98765-4321', cpf: '123.456.789-00', role: 'customer', ordersCount: 3, totalSpent: 268.90, createdAt: '2024-03-15' },
          { id: 'usr_cust_2', name: 'Ricardo S. Alencar', email: 'ricardo.alencar@gmail.com', phone: '(31) 99123-8899', cpf: '987.654.321-11', role: 'customer', ordersCount: 5, totalSpent: 489.50, createdAt: '2024-04-02' }
        ]);
      });
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
