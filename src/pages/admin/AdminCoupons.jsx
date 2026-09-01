import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Search, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { addToast } = useToast();

  const initialForm = {
    code: '',
    type: 'percentage',
    value: '10',
    minPurchase: '50.00',
    usageLimit: '100',
    description: '',
    active: true
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchCoupons = () => {
    fetch('/api/coupons')
      .then(res => res.json())
      .then(d => {
        if (d.success) setCoupons(d.coupons || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      code: c.code,
      type: c.type || 'percentage',
      value: c.value !== undefined ? c.value.toString() : '10',
      minPurchase: c.minPurchase !== undefined ? c.minPurchase.toString() : '0.00',
      usageLimit: c.usageLimit !== undefined ? c.usageLimit.toString() : '100',
      description: c.description || '',
      active: !!c.active
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (c) => {
    try {
      const res = await fetch(`/api/coupons/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !c.active })
      });
      const d = await res.json();
      if (d.success) {
        addToast(`Cupom ${!c.active ? 'ativado' : 'desativado'} com sucesso!`, "success");
        fetchCoupons();
      }
    } catch (err) {
      addToast("Erro ao alterar status do cupom.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir este cupom de desconto?")) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        addToast("Cupom excluído!", "success");
        fetchCoupons();
      }
    } catch (err) {
      addToast("Erro ao remover cupom.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      addToast("Informe o código do cupom.", "error");
      return;
    }

    try {
      const url = editingId ? `/api/coupons/${editingId}` : '/api/coupons';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const d = await res.json();
      if (d.success) {
        addToast(d.message, "success");
        setModalOpen(false);
        fetchCoupons();
      } else {
        addToast(d.message || "Erro ao salvar cupom.", "error");
      }
    } catch (err) {
      addToast("Erro de comunicação ao salvar cupom.", "error");
    }
  };

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Gestão de Cupons de Desconto</h1>
          <p style={{ color: 'var(--text-muted)' }}>Crie, edite e remova cupons promocionais em percentual, valor fixo R$ ou frete grátis.</p>
        </div>
        <button onClick={handleOpenNew} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', gap: '8px' }}>
          <Plus size={18} /> CRIAR NOVO CUPOM
        </button>
      </div>

      {/* Busca e Resumo */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder="Buscar por código ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
          />
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Total: <strong>{filtered.length}</strong> cupons cadastrados
        </div>
      </div>

      {/* Tabela de Cupons */}
      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando cupons...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Tag size={40} color="var(--primary-burgundy)" style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Nenhum cupom encontrado</h3>
            <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Clique no botão acima para cadastrar seu primeiro cupom de desconto!</p>
          </div>
        ) : (
          <table className="table-custom">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Desconto</th>
                <th>Compra Mínima</th>
                <th>Usos / Limite</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ opacity: c.active ? 1 : 0.6 }}>
                  <td>
                    <strong style={{ color: 'var(--primary-burgundy)', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                      {c.code}
                    </strong>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                      {c.type === 'percentage' ? 'Percentual (%)' : c.type === 'fixed' ? 'Valor Fixo (R$)' : 'Frete Grátis'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-dark)' }}>
                      {c.type === 'percentage'
                        ? `${c.value}% OFF`
                        : c.type === 'fixed'
                        ? `R$ ${c.value.toFixed(2).replace('.', ',')} OFF`
                        : 'FRETE GRÁTIS'}
                    </strong>
                  </td>
                  <td>R$ {c.minPurchase ? c.minPurchase.toFixed(2).replace('.', ',') : '0,00'}</td>
                  <td>
                    <span style={{ fontWeight: 'bold' }}>{c.usedCount || 0}</span> / {c.usageLimit || '∞'}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.description || '—'}</td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`badge ${c.active ? 'badge-in-stock' : 'badge-out-of-stock'}`}
                      style={{ border: 'none', cursor: 'pointer', fontSize: '0.78rem', padding: '4px 10px' }}
                    >
                      {c.active ? '● Ativo' : '○ Inativo'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3B82F6' }}
                        title="Editar Cupom"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                        title="Excluir Cupom"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Criar / Editar Cupom */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFF', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
            
            <button
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#888' }}
            >
              <X size={22} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
              {editingId ? "Editar Cupom de Desconto" : "Novo Cupom de Desconto"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: LIVIO10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '1.05rem', letterSpacing: '1px' }}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Tipo de Desconto *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  >
                    <option value="percentage">Percentual (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                    <option value="free_shipping">Frete Grátis</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    {formData.type === 'percentage' ? 'Percentual (%) *' : formData.type === 'fixed' ? 'Valor do Desconto (R$) *' : 'Desconto no Frete'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required={formData.type !== 'free_shipping'}
                    disabled={formData.type === 'free_shipping'}
                    value={formData.type === 'free_shipping' ? '0' : formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Valor Mínimo da Compra (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Limite Máximo de Usos
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  Descrição / Regulamento
                </label>
                <input
                  type="text"
                  placeholder="Ex: 10% de desconto na primeira compra de produtos Livio's Food"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="activeCoupon"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="activeCoupon" style={{ fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  Ativar cupom imediatamente para uso na loja
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.7rem 1.5rem' }}
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.7rem 1.8rem' }}
                >
                  {editingId ? "SALVAR ALTERAÇÕES" : "CRIAR CUPOM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
