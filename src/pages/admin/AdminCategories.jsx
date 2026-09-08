import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, FolderTree, Search, X, CheckCircle2, 
  Image as ImageIcon, Layers, Eye, ExternalLink, ArrowUpRight,
  Sparkles, Check, AlertCircle, RefreshCw, LayoutGrid, List
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [viewMode, setViewMode] = useState('cards'); // cards | table

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();
  const { getAuthHeaders } = useAuth();

  const initialForm = {
    name: '',
    slug: '',
    description: '',
    image: '',
    order: '1',
    active: true
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsRes, prodsRes] = await Promise.all([
        fetch('/api/categories', { headers: getAuthHeaders ? getAuthHeaders() : {} }),
        fetch('/api/products?admin=true', { headers: getAuthHeaders ? getAuthHeaders() : {} })
      ]);

      if (catsRes.ok) {
        const dataCats = await catsRes.json();
        if (dataCats.success) setCategories(dataCats.categories || []);
      }
      if (prodsRes.ok) {
        const dataProds = await prodsRes.json();
        if (dataProds.success) setProducts(dataProds.products || []);
      }
    } catch (err) {
      console.error("Erro ao carregar categorias e produtos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      name: c.name || '',
      slug: c.slug || '',
      description: c.description || '',
      image: c.image || '',
      order: c.order !== undefined ? c.order.toString() : '1',
      active: c.active !== undefined ? !!c.active : true
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (c) => {
    try {
      const nextActive = !c.active;
      // Atualização otimista
      setCategories(prev => prev.map(cat => cat.id === c.id ? { ...cat, active: nextActive } : cat));

      const res = await fetch(`/api/categories/${c.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeaders ? getAuthHeaders() : {})
        },
        body: JSON.stringify({ active: nextActive })
      });
      const d = await res.json();
      if (d.success) {
        addToast(`Categoria "${c.name}" ${nextActive ? 'ativada' : 'desativada'} na loja!`, "success");
      } else {
        addToast(d.message || "Erro ao alterar status.", "error");
        fetchData();
      }
    } catch (err) {
      addToast("Erro de comunicação ao alterar status.", "error");
      fetchData();
    }
  };

  const handleDelete = async (id, name) => {
    const prodsInCat = products.filter(p => p.categoryId === id).length;
    const confirmMsg = prodsInCat > 0
      ? `Atenção: Existem ${prodsInCat} produto(s) vinculados a esta categoria ("${name}"). Ao excluir, eles ficarão sem categoria. Deseja realmente excluir permanentemente?`
      : `Deseja realmente excluir a categoria "${name}" permanentemente do catálogo?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      // Remoção otimista imediata na interface
      setCategories(prev => prev.filter(c => c.id !== id));

      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders ? getAuthHeaders() : {}
      });
      const d = await res.json();
      if (d.success) {
        addToast(`Categoria "${name}" excluída definitivamente!`, "success");
        fetchData();
      } else {
        addToast(d.message || "Erro ao excluir categoria.", "error");
        fetchData();
      }
    } catch (err) {
      addToast("Erro ao remover categoria.", "error");
      fetchData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast("Informe o nome da categoria.", "error");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || formData.name.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-'),
      description: formData.description.trim(),
      image: formData.image.trim(),
      order: parseInt(formData.order) || 1,
      active: !!formData.active
    };

    try {
      setSubmitting(true);
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeaders ? getAuthHeaders() : {})
        },
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (d.success) {
        addToast(d.message || "Categoria salva com sucesso no Supabase!", "success");
        setModalOpen(false);
        fetchData();
      } else {
        addToast(d.message || "Erro ao salvar categoria.", "error");
      }
    } catch (err) {
      addToast("Erro de comunicação ao salvar categoria.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtragem
  const filtered = categories.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.slug?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'active') return matchesSearch && c.active !== false;
    if (statusFilter === 'inactive') return matchesSearch && c.active === false;
    return matchesSearch;
  });

  const totalActive = categories.filter(c => c.active !== false).length;
  const totalInactive = categories.filter(c => c.active === false).length;

  return (
    <div>
      {/* 1. Métricas Executivas de Categorias */}
      <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
        <div className="admin-card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 0, 0, 0.08)', color: 'var(--primary-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FolderTree size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total de Categorias</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: '1.2' }}>{categories.length}</div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Categorias Ativas</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16A34A', lineHeight: '1.2' }}>{totalActive}</div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '1.25rem 1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(212, 175, 55, 0.12)', color: 'var(--accent-gold-hover, #B89628)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Layers size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total de Produtos Vinculados</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: '1.2' }}>{products.length}</div>
          </div>
        </div>
      </div>

      {/* 2. Barra de Busca, Filtros e Ação */}
      <div className="admin-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
            {/* Campo de Busca */}
            <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Buscar por nome, slug ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.4rem', borderRadius: '10px', border: '1px solid var(--light-border)', fontSize: '0.88rem' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filtro por Status */}
            <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: statusFilter === 'all' ? 700 : 500,
                  borderRadius: '8px',
                  border: 'none',
                  background: statusFilter === 'all' ? '#FFF' : 'transparent',
                  color: statusFilter === 'all' ? 'var(--text-dark)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: statusFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Todas ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: statusFilter === 'active' ? 700 : 500,
                  borderRadius: '8px',
                  border: 'none',
                  background: statusFilter === 'active' ? '#FFF' : 'transparent',
                  color: statusFilter === 'active' ? '#16A34A' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: statusFilter === 'active' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Ativas ({totalActive})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: statusFilter === 'inactive' ? 700 : 500,
                  borderRadius: '8px',
                  border: 'none',
                  background: statusFilter === 'inactive' ? '#FFF' : 'transparent',
                  color: statusFilter === 'inactive' ? '#DC2626' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: statusFilter === 'inactive' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                Inativas ({totalInactive})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Alternador de Visualização */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Visualização em Cards"
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'cards' ? '#FFF' : 'transparent',
                  color: viewMode === 'cards' ? 'var(--primary-burgundy)' : '#64748B',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'cards' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Visualização em Tabela"
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: viewMode === 'table' ? '#FFF' : 'transparent',
                  color: viewMode === 'table' ? 'var(--primary-burgundy)' : '#64748B',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'table' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                <List size={16} />
              </button>
            </div>

            {/* Botão Nova Categoria */}
            <button
              type="button"
              onClick={handleOpenNew}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.35rem', gap: '8px', borderRadius: '10px' }}
            >
              <Plus size={18} /> NOVA CATEGORIA
            </button>
          </div>
        </div>
      </div>

      {/* 3. Conteúdo Principal (Cards ou Tabela) */}
      {loading ? (
        <div className="admin-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="spin" style={{ margin: '0 auto 12px auto', color: 'var(--primary-burgundy)' }} />
          <div style={{ fontWeight: 600 }}>Carregando categorias do catálogo...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FolderTree size={48} color="var(--primary-burgundy)" style={{ marginBottom: '1rem', opacity: 0.35 }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            {search ? "Nenhuma categoria corresponde à busca" : "Nenhuma categoria cadastrada"}
          </h3>
          <p style={{ fontSize: '0.88rem', marginTop: '6px', maxWidth: '440px', margin: '6px auto 1.5rem auto' }}>
            {search ? "Tente buscar por outro termo ou limpe os filtros." : "Cadastre sua primeira categoria para organizar os molhos e kits na loja."}
          </p>
          {search ? (
            <button onClick={() => setSearch('')} className="btn btn-outline" style={{ padding: '0.6rem 1.2rem' }}>Limpar Busca</button>
          ) : (
            <button onClick={handleOpenNew} className="btn btn-primary" style={{ padding: '0.65rem 1.4rem' }}>
              <Plus size={18} /> Cadastrar Primeira Categoria
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* VISUALIZAÇÃO EM CARDS */
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          {filtered.map(c => {
            const prodsInCat = products.filter(p => p.categoryId === c.id);
            const fallbackImg = "https://images.unsplash.com/photo-1590794056226-77ef3a6c4743?auto=format&fit=crop&w=800&q=80";
            
            return (
              <div
                key={c.id}
                className="admin-card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'flex-start',
                  position: 'relative',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '16px',
                  marginBottom: 0,
                  opacity: c.active !== false ? 1 : 0.65
                }}
              >
                {/* Imagem da Categoria */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={c.image || fallbackImg}
                    alt={c.name}
                    onClick={() => handleOpenEdit(c)}
                    onError={(e) => { e.target.src = fallbackImg; }}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: '1px solid var(--light-border)',
                      cursor: 'pointer',
                      background: '#F8FAFC'
                    }}
                    title="Clique para editar"
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: '#FFF',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    #{c.order || 1}
                  </span>
                </div>

                {/* Detalhes da Categoria */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <h3
                        onClick={() => handleOpenEdit(c)}
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: 'var(--text-dark)',
                          cursor: 'pointer',
                          lineHeight: '1.3',
                          marginBottom: '3px'
                        }}
                        title="Clique para editar"
                      >
                        {c.name}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <a
                          href={`/produtos?categoria=${c.id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.74rem',
                            color: 'var(--primary-burgundy)',
                            fontWeight: 700,
                            background: 'rgba(139,0,0,0.07)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Ver produtos na loja pública"
                        >
                          /{c.slug} <ArrowUpRight size={12} />
                        </a>

                        <span
                          style={{
                            fontSize: '0.74rem',
                            color: '#64748B',
                            background: '#F1F5F9',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontWeight: 600
                          }}
                        >
                          {prodsInCat.length} {prodsInCat.length === 1 ? 'produto' : 'produtos'}
                        </span>
                      </div>
                    </div>

                    {/* Badge de Status Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`badge ${c.active !== false ? 'badge-in-stock' : 'badge-out-of-stock'}`}
                      style={{ border: 'none', cursor: 'pointer', fontSize: '0.72rem', padding: '3px 9px', flexShrink: 0 }}
                      title="Clique para alternar ativa/inativa"
                    >
                      {c.active !== false ? '● Ativa' : '○ Inativa'}
                    </button>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.description || 'Sem descrição cadastrada.'}
                  </p>

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="btn btn-outline"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', gap: '6px', height: '34px', color: '#2563EB', borderColor: '#BFDBFE' }}
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id, c.name)}
                      className="btn btn-outline"
                      style={{ padding: '0.45rem 0.75rem', height: '34px', color: '#EF4444', borderColor: '#FECACA' }}
                      title="Excluir categoria"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM TABELA EXECUTIVA */
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table-custom">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Imagem</th>
                <th>Nome & Slug</th>
                <th>Descrição</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Ordem</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Produtos</th>
                <th style={{ width: '110px' }}>Status</th>
                <th style={{ textAlign: 'right', width: '130px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const prodsInCat = products.filter(p => p.categoryId === c.id);
                const fallbackImg = "https://images.unsplash.com/photo-1590794056226-77ef3a6c4743?auto=format&fit=crop&w=800&q=80";

                return (
                  <tr key={c.id}>
                    <td>
                      <img
                        src={c.image || fallbackImg}
                        alt={c.name}
                        onClick={() => handleOpenEdit(c)}
                        onError={(e) => { e.target.src = fallbackImg; }}
                        style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--light-border)', cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <div
                        onClick={() => handleOpenEdit(c)}
                        style={{ fontWeight: 700, color: 'var(--text-dark)', cursor: 'pointer', fontSize: '0.92rem' }}
                      >
                        {c.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--primary-burgundy)', fontWeight: 600 }}>
                        /{c.slug}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem', maxWidth: '300px' }}>
                      {c.description || '-'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748B' }}>
                      #{c.order || 1}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                        {prodsInCat.length}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(c)}
                        className={`badge ${c.active !== false ? 'badge-in-stock' : 'badge-out-of-stock'}`}
                        style={{ border: 'none', cursor: 'pointer', fontSize: '0.72rem', padding: '3px 8px' }}
                      >
                        {c.active !== false ? '● Ativa' : '○ Inativa'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
                          title="Editar Categoria"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.name)}
                          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer' }}
                          title="Excluir Categoria"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Modal Criar / Editar Categoria */}
      {modalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
        >
          <div style={{ background: '#FFF', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '20px', padding: '2.25rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', position: 'relative' }}>
            
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 0, 0, 0.08)', color: 'var(--primary-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FolderTree size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--text-dark)', lineHeight: '1.1' }}>
                  {editingId ? "Editar Categoria" : "Nova Categoria"}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {editingId ? "Atualize as informações da linha de produtos no catálogo." : "Cadastre uma nova linha de molhos ou kits no catálogo da loja."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Nome */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>
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
                      slug: editingId ? prev.slug : val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
                    }));
                  }}
                  style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1px solid var(--light-border)', fontWeight: 600, fontSize: '0.92rem' }}
                />
              </div>

              {/* Slug de URL e Ordem */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>
                    Slug de URL
                  </label>
                  <input
                    type="text"
                    placeholder="molho-fine-recipe"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid var(--light-border)', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                    Link na loja: <code>/produtos?categoria={formData.slug || 'slug'}</code>
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>
                    Posição / Ordem
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid var(--light-border)', fontSize: '0.85rem', fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>
                  Descrição Curta
                </label>
                <textarea
                  rows="2"
                  placeholder="Ex: Nossa linha premium em garrafas de vidro gourmet de 250ml."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px', border: '1px solid var(--light-border)', resize: 'vertical', fontSize: '0.85rem' }}
                />
              </div>

              {/* Upload de Imagem */}
              <div>
                <ImageUploader
                  label="Imagem de Capa da Categoria"
                  value={formData.image || ''}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  helpText="Selecione JPG, PNG ou WebP ou insira o link abaixo"
                />
                <div style={{ marginTop: '6px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    Ou insira/edite a URL da foto diretamente:
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image || ''}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--light-border)', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Checkbox Ativa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <input
                  type="checkbox"
                  id="activeCatModal"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="activeCatModal" style={{ fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', color: 'var(--text-dark)' }}>
                  Ativar esta categoria na loja pública
                </label>
              </div>

              {/* Botões do Rodapé */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--light-border)' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1.4rem', borderRadius: '10px' }}
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '0.65rem 1.8rem', borderRadius: '10px' }}
                >
                  {submitting ? "SALVANDO..." : (editingId ? "SALVAR ALTERAÇÕES" : "CRIAR CATEGORIA")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

