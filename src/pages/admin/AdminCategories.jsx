import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderTree, Search, X, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { addToast } = useToast();

  const initialForm = {
    name: '',
    slug: '',
    description: '',
    image: '',
    order: '1',
    active: true
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(d => {
        if (d.success) setCategories(d.categories || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      ...initialForm,
      order: (categories.length + 1).toString()
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      slug: c.slug || '',
      description: c.description || '',
      image: c.image || '',
      order: c.order ? c.order.toString() : '1',
      active: c.active !== undefined ? !!c.active : true
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (c) => {
    try {
      const res = await fetch(`/api/categories/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !c.active })
      });
      const d = await res.json();
      if (d.success) {
        addToast(`Categoria ${!c.active ? 'ativada' : 'desativada'} com sucesso!`, "success");
        fetchCategories();
      }
    } catch (err) {
      addToast("Erro ao alterar status da categoria.", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta categoria? Os produtos vinculados precisarão ser reatribuídos.")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        addToast("Categoria excluída com sucesso!", "success");
        fetchCategories();
      } else {
        addToast(d.message || "Erro ao excluir categoria.", "error");
      }
    } catch (err) {
      addToast("Erro ao remover categoria.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast("Informe o nome da categoria.", "error");
      return;
    }

    const payload = {
      ...formData,
      slug: formData.slug.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };

    try {
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.success) {
        addToast(d.message, "success");
        setModalOpen(false);
        fetchCategories();
      } else {
        addToast(d.message || "Erro ao salvar categoria.", "error");
      }
    } catch (err) {
      addToast("Erro de comunicação ao salvar categoria.", "error");
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Gestão de Categorias & Linhas</h1>
          <p style={{ color: 'var(--text-muted)' }}>Cadastre, edite e organize as linhas de produtos da Livio's Food (Fine Recipe, PET, Kits, etc).</p>
        </div>
        <button onClick={handleOpenNew} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', gap: '8px' }}>
          <Plus size={18} /> NOVA CATEGORIA
        </button>
      </div>

      {/* Busca */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder="Buscar categoria por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
          />
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Total: <strong>{filtered.length}</strong> categorias
        </div>
      </div>

      {/* Grid de Categorias */}
      {loading ? (
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando categorias...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FolderTree size={40} color="var(--primary-burgundy)" style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Nenhuma categoria encontrada</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Clique no botão acima para cadastrar a primeira categoria!</p>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          {filtered.map(c => (
            <div
              key={c.id}
              className="admin-card"
              style={{
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: c.active !== false ? 1 : 0.6,
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flex: 1 }}>
                <img
                  src={c.image || "/header-bg.jpg"}
                  alt={c.name}
                  style={{ width: '90px', height: '90px', borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '1px solid var(--light-border)' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>{c.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.4' }}>{c.description || 'Sem descrição cadastrada.'}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--primary-burgundy)', fontWeight: 'bold', background: 'rgba(139,0,0,0.08)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                      /{c.slug}
                    </span>

                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`badge ${c.active !== false ? 'badge-in-stock' : 'badge-out-of-stock'}`}
                      style={{ border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: '3px 8px' }}
                    >
                      {c.active !== false ? '● Ativa' : '○ Inativa'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => handleOpenEdit(c)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3B82F6', padding: '6px' }}
                  title="Editar Categoria"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '6px' }}
                  title="Excluir Categoria"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Categoria */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFF', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
            
            <button
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#888' }}
            >
              <X size={22} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
              {editingId ? "Editar Categoria" : "Nova Categoria Livio's Food"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Molhos Fine Recipe"
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      name: val,
                      slug: editingId ? prev.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                    }));
                  }}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontWeight: 'bold' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  Slug de URL
                </label>
                <input
                  type="text"
                  placeholder="molho-fine-recipe"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  URL amigável de acesso na loja: <code>/produtos?categoria={formData.slug || 'sua-categoria'}</code>
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  Descrição
                </label>
                <textarea
                  rows="2"
                  placeholder="Ex: Nossa linha premium em garrafas de vidro gourmet de 250ml."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', resize: 'vertical' }}
                />
              </div>

              {/* Upload de Imagem */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                  Imagem da Categoria
                </label>
                <ImageUploader
                  value={formData.image ? [formData.image] : []}
                  onChange={(imgs) => setFormData({ ...formData, image: imgs[0] || '' })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="activeCat"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="activeCat" style={{ fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>
                  Ativar categoria na loja pública
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
                  {editingId ? "SALVAR ALTERAÇÕES" : "CRIAR CATEGORIA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
