import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package, Star } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { addToast } = useToast();
  const { getAuthHeaders } = useAuth();

  const initialForm = {
    name: '',
    sku: '',
    categoryId: '',
    shortDescription: '',
    fullDescription: '',
    price: '',
    promotionalPrice: '',
    costPrice: '',
    stock: '',
    minStock: '10',
    weightKg: '0.45',
    images: '',
    ingredients: '',
    isFeatured: false,
    isBestSeller: false,
    isNew: false,
    isOffer: false
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchProducts = () => {
    fetch('/api/products?admin=true', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(d => {
        if (d.success) setProducts(d.products);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    fetch('/api/categories')
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setCategories(d.categories);
          if (d.categories.length > 0) {
            setFormData(prev => ({ ...prev, categoryId: d.categories[0].id }));
          }
        }
      });
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData(initialForm);
    if (categories.length > 0) setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      sku: p.sku,
      categoryId: p.categoryId,
      shortDescription: p.shortDescription || '',
      fullDescription: p.fullDescription || '',
      price: p.price.toString(),
      promotionalPrice: p.promotionalPrice ? p.promotionalPrice.toString() : '',
      costPrice: p.costPrice ? p.costPrice.toString() : '',
      stock: p.stock.toString(),
      minStock: p.minStock.toString(),
      weightKg: p.weightKg ? p.weightKg.toString() : '0.45',
      images: p.images ? p.images.join(', ') : '',
      ingredients: p.ingredients || '',
      isFeatured: !!p.isFeatured,
      isBestSeller: !!p.isBestSeller,
      isNew: !!p.isNew,
      isOffer: !!p.isOffer
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente remover este produto?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const d = await res.json();
      if (d.success) {
        addToast(d.message || "Produto removido com sucesso!", "success");
        setProducts(prev => prev.filter(p => p.id !== id));
        fetchProducts();
      } else {
        addToast(d.message || "Erro ao remover produto.", "error");
      }
    } catch (err) {
      addToast("Erro ao remover produto.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      images: formData.images ? formData.images.split(',').map(i => i.trim()).filter(Boolean) : []
    };

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.success) {
        addToast(d.message, "success");
        setModalOpen(false);
        fetchProducts();
      } else {
        addToast(d.message || "Erro ao salvar produto.", "error");
      }
    } catch (err) {
      addToast("Erro ao salvar produto.", "error");
    }
  };

  const handleToggleActive = async (product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active })
      });
      const d = await res.json();
      if (d.success) {
        addToast(`Produto ${!product.active ? 'ativado' : 'desativado na loja'}!`, "success");
        fetchProducts();
      }
    } catch (err) {
      addToast("Erro ao alterar status do produto.", "error");
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Gestão de Produtos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Cadastre, edite e gerencie o estoque e fotos do catálogo.</p>
        </div>
        <button onClick={handleOpenNew} className="btn btn-primary">
          <Plus size={18} /> NOVO PRODUTO
        </button>
      </div>

      {/* Busca */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder="Buscar por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
          />
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Total: <strong>{filtered.length}</strong> produtos
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="admin-card">
        <table className="table-custom">
          <thead>
            <tr>
              <th>Imagem</th>
              <th>Nome / SKU</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status na Loja</th>
              <th>Selos</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} style={{ opacity: p.active ? 1 : 0.6 }}>
                <td>
                  <img src={p.images && p.images[0] ? p.images[0] : ''} alt={p.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                </td>
                <td>
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                </td>
                <td>{categories.find(c => c.id === p.categoryId)?.name || p.categoryId}</td>
                <td>
                  <strong style={{ color: 'var(--primary-burgundy)' }}>
                    R$ {(p.promotionalPrice || p.price).toFixed(2).replace('.', ',')}
                  </strong>
                  {p.promotionalPrice && (
                    <div style={{ fontSize: '0.75rem', color: '#999', textDecoration: 'line-through' }}>
                      R$ {p.price.toFixed(2).replace('.', ',')}
                    </div>
                  )}
                </td>
                <td>
                  <span style={{ fontWeight: 'bold', color: p.stock <= p.minStock ? '#EF4444' : '#10B981' }}>
                    {p.stock} un
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`badge ${p.active ? 'badge-in-stock' : 'badge-out-of-stock'}`}
                    style={{ border: 'none', cursor: 'pointer', fontSize: '0.78rem', padding: '4px 10px' }}
                  >
                    {p.active ? '● Ativo na Loja' : '○ Inativo'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {p.isFeatured && <span className="badge badge-bestseller" style={{ fontSize: '0.65rem' }}>Destaque</span>}
                    {p.isBestSeller && <span className="badge badge-bestseller" style={{ fontSize: '0.65rem' }}>Mais Vendido</span>}
                    {p.isOffer && <span className="badge badge-offer" style={{ fontSize: '0.65rem' }}>Oferta</span>}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleOpenEdit(p)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3B82F6' }} title="Editar">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }} title="Remover">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Formulário de Produto */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFF', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
              {editingId ? "Editar Produto" : "Novo Produto Livio's Food"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="LIV-FIN-009"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Categoria *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Preço De Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
              </div>

              <div className="grid-3">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Preço Promocional (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.promotionalPrice}
                    onChange={(e) => setFormData({ ...formData, promotionalPrice: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Estoque Inicial *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Estoque Mínimo *</label>
                  <input
                    type="number"
                    required
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
              </div>

              <ImageUploader
                label="Upload da Imagem Principal do Produto *"
                value={formData.images ? formData.images.split(',')[0].trim() : ''}
                onChange={(url) => setFormData({ ...formData, images: url })}
                helpText="Selecione um arquivo de foto do produto no seu computador"
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Descrição Curta</label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Ingredientes</label>
                <textarea
                  rows="2"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
              </div>

              {/* Destaques */}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} />
                  Destaque na Home
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isBestSeller} onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })} />
                  Mais Vendido
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isOffer} onChange={(e) => setFormData({ ...formData, isOffer: e.target.checked })} />
                  Selo de Oferta
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">CANCELAR</button>
                <button type="submit" className="btn btn-primary">SALVAR PRODUTO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
