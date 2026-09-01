import React, { useState, useEffect } from 'react';
import { Plus, Edit2, FolderTree } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const { addToast } = useToast();

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(d => {
        if (d.success) setCategories(d.categories);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, image })
      });
      const d = await res.json();
      if (d.success) {
        addToast(d.message, "success");
        setModalOpen(false);
        setName('');
        setDescription('');
        setImage('');
        fetchCategories();
      }
    } catch (err) {
      addToast("Erro ao criar categoria.", "error");
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>Gestão de Categorias</h1>
          <p style={{ color: 'var(--text-muted)' }}>Organize as linhas de produtos da Livio's Food (Fine Recipe, PET, Kits, etc).</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> NOVA CATEGORIA
        </button>
      </div>

      <div className="grid-2">
        {categories.map(c => (
          <div key={c.id} className="admin-card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <img src={c.image} alt={c.name} style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{c.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.description}</p>
              <div style={{ fontSize: '0.78rem', color: 'var(--primary-burgundy)', fontWeight: 'bold', marginTop: '4px' }}>Slug: /{c.slug}</div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFF', width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Criar Nova Categoria</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nome *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Descrição</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>URL da Imagem</label>
                <input type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline">CANCELAR</button>
                <button type="submit" className="btn btn-primary">CRIAR CATEGORIA</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
