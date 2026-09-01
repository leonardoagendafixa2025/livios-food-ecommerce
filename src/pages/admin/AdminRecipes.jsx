import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, BookOpen, Clock, Users, Flame, Utensils } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';

export default function AdminRecipes() {
  const [recipes, setRecipes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { addToast } = useToast();

  const initialForm = {
    title: '',
    subtitle: '',
    prepTime: '30 min',
    difficulty: 'Fácil',
    servings: '4 pessoas',
    image: '',
    usedProductIds: [],
    ingredientsText: '',
    instructionsText: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchData = () => {
    Promise.all([
      fetch('/api/recipes').then(res => res.json()),
      fetch('/api/products?admin=true').then(res => res.json())
    ])
      .then(([dataRecipes, dataProducts]) => {
        if (dataRecipes.success) setRecipes(dataRecipes.recipes || []);
        if (dataProducts.success) setProducts(dataProducts.products || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingId(rec.id);
    setFormData({
      title: rec.title || '',
      subtitle: rec.subtitle || '',
      prepTime: rec.prepTime || '30 min',
      difficulty: rec.difficulty || 'Fácil',
      servings: rec.servings || '4 pessoas',
      image: rec.image || '',
      usedProductIds: rec.usedProductIds || [],
      ingredientsText: rec.ingredients ? rec.ingredients.join('\n') : '',
      instructionsText: rec.instructions ? rec.instructions.join('\n') : ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta receita do site?")) return;
    try {
      const res = await fetch(`/api/admin/recipes/${id}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        addToast("Receita excluída com sucesso!", "success");
        fetchData();
      } else {
        addToast(d.message || "Erro ao excluir receita.", "error");
      }
    } catch (err) {
      addToast("Erro ao remover receita.", "error");
    }
  };

  const handleProductToggle = (productId) => {
    setFormData(prev => {
      const exists = prev.usedProductIds.includes(productId);
      const updated = exists
        ? prev.usedProductIds.filter(id => id !== productId)
        : [...prev.usedProductIds, productId];
      return { ...prev, usedProductIds: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast("Informe o título da receita.", "error");
      return;
    }

    const ingredients = formData.ingredientsText
      .split('\n')
      .map(i => i.trim())
      .filter(Boolean);

    const instructions = formData.instructionsText
      .split('\n')
      .map(i => i.trim())
      .filter(Boolean);

    const payload = {
      title: formData.title,
      subtitle: formData.subtitle,
      prepTime: formData.prepTime,
      difficulty: formData.difficulty,
      servings: formData.servings,
      image: formData.image || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80",
      usedProductIds: formData.usedProductIds,
      ingredients,
      instructions
    };

    try {
      const url = editingId ? `/api/admin/recipes/${editingId}` : '/api/admin/recipes';
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
        fetchData();
      } else {
        addToast(d.message || "Erro ao salvar receita.", "error");
      }
    } catch (err) {
      addToast("Erro de comunicação ao salvar receita.", "error");
    }
  };

  const filtered = recipes.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.subtitle && r.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Gestão de Receitas Gastronômicas</h1>
          <p style={{ color: 'var(--text-muted)' }}>Cadastre receitas exclusivas harmonizadas com molhos Livio's Food para inspirar seus clientes.</p>
        </div>
        <button onClick={handleOpenNew} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', gap: '8px' }}>
          <Plus size={18} /> NOVA RECEITA
        </button>
      </div>

      {/* Busca */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder="Buscar receita por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
          />
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Total: <strong>{filtered.length}</strong> receitas publicadas
        </div>
      </div>

      {/* Grid de Receitas */}
      {loading ? (
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando receitas...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={44} color="var(--primary-burgundy)" style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Nenhuma receita cadastrada</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>Clique no botão acima para publicar sua primeira receita gastronômica!</p>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          {filtered.map(r => (
            <div key={r.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ position: 'relative', height: '180px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1rem' }}>
                  <img src={r.image || "/header-bg.jpg"} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--primary-burgundy)', color: '#FFF', padding: '3px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {r.difficulty || 'Fácil'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-dark)', marginBottom: '4px' }}>{r.title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: '1.4' }}>{r.subtitle}</p>

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--text-dark)', marginBottom: '1rem', fontWeight: '500' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={15} color="var(--primary-burgundy)" /> {r.prepTime}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={15} color="var(--primary-burgundy)" /> {r.servings}</span>
                </div>

                {r.ingredients && r.ingredients.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--light-border)', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                    <strong>Ingredientes:</strong> {r.ingredients.slice(0, 3).join(', ')}{r.ingredients.length > 3 ? '...' : ''}
                  </div>
                )}
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--light-border)', paddingTop: '0.75rem' }}>
                <button
                  onClick={() => handleOpenEdit(r)}
                  className="btn btn-outline"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', gap: '4px' }}
                >
                  <Edit2 size={15} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={15} /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Receita */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFF', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
            
            <button
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', color: '#888' }}
            >
              <X size={22} />
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
              {editingId ? "Editar Receita Gastronômica" : "Nova Receita Livio's Food"}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  Título da Receita *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Costelinha Suína ao Molho Agridoce de Abacaxi"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontWeight: 'bold', fontSize: '1.05rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  Subtítulo Explicativo
                </label>
                <input
                  type="text"
                  placeholder="Ex: A combinação perfeita entre suculência, caramelização e toque tropical picante."
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
              </div>

              <div className="grid-3">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Tempo de Preparo
                  </label>
                  <input
                    type="text"
                    placeholder="50 min"
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Dificuldade
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Avançado">Avançado</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Rendimento
                  </label>
                  <input
                    type="text"
                    placeholder="4 pessoas"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
              </div>

              {/* Upload de Imagem */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                  Imagem Ilustrativa da Receita
                </label>
                <ImageUploader
                  value={formData.image ? [formData.image] : []}
                  onChange={(imgs) => setFormData({ ...formData, image: imgs[0] || '' })}
                />
              </div>

              {/* Seleção de Produtos Vinculados */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                  Produtos Livio's Food Vinculados à Receita
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'var(--light-bg)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)' }}>
                  {products.map(p => {
                    const isSelected = formData.usedProductIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleProductToggle(p.id)}
                        className={`badge ${isSelected ? 'badge-bestseller' : ''}`}
                        style={{
                          background: isSelected ? 'var(--primary-burgundy)' : '#FFF',
                          color: isSelected ? '#FFF' : 'var(--text-dark)',
                          border: isSelected ? 'none' : '1px solid var(--light-border)',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          fontSize: '0.82rem'
                        }}
                      >
                        {isSelected ? '✓ ' : '+ '} {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ingredientes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  Ingredientes (1 item por linha) *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder={"1,2kg de costelinha de porco em ripas\n1 garrafa de Molho Agridoce de Abacaxi Livio's Food\n3 dentes de alho amassados\n1 colher de sopa de sal grosso"}
                  value={formData.ingredientsText}
                  onChange={(e) => setFormData({ ...formData, ingredientsText: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontFamily: 'monospace', fontSize: '0.88rem' }}
                />
              </div>

              {/* Modo de Preparo */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                  Modo de Preparo / Instruções Passo a Passo (1 passo por linha) *
                </label>
                <textarea
                  rows="5"
                  required
                  placeholder={"Tempere as costelinhas com alho e sal grosso.\nEmbrulhe em papel alumínio e leve ao forno por 40 min.\nPincele farta quantidade do Molho Agridoce.\nRetorne ao forno por mais 15 minutos até caramelizar."}
                  value={formData.instructionsText}
                  onChange={(e) => setFormData({ ...formData, instructionsText: e.target.value })}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontFamily: 'monospace', fontSize: '0.88rem' }}
                />
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
                  {editingId ? "SALVAR ALTERAÇÕES" : "PUBLICAR RECEITA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
