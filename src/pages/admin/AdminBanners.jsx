import React, { useState, useEffect } from 'react';
import { Image, Plus, Edit2, Trash2, Power, Eye, Check, X, Link as LinkIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: 'COMPRAR AGORA',
    buttonLink: '/produtos',
    secondaryButtonText: 'CONHEÇA A LINHA FINE RECIPE',
    secondaryButtonLink: '/produtos?categoria=cat_fine_recipe',
    imageDesktop: '/header-bg.jpg',
    imageMobile: '/header-bg.jpg',
    active: true
  });

  const fetchBanners = () => {
    fetch('/api/admin/banners')
      .then(res => res.json())
      .then(d => {
        if (d.success) setBanners(d.banners);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        buttonText: banner.buttonText || 'COMPRAR AGORA',
        buttonLink: banner.buttonLink || '/produtos',
        secondaryButtonText: banner.secondaryButtonText || '',
        secondaryButtonLink: banner.secondaryButtonLink || '',
        imageDesktop: banner.imageDesktop || '/header-bg.jpg',
        imageMobile: banner.imageMobile || '/header-bg.jpg',
        active: banner.active ?? true
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: 'NOVA EXPERIÊNCIA GASTRONÔMICA',
        subtitle: 'Descubra a intensidade dos nossos molhos artesanais especiais.',
        buttonText: 'COMPRAR AGORA',
        buttonLink: '/produtos',
        secondaryButtonText: 'VER CATÁLOGO',
        secondaryButtonLink: '/produtos',
        imageDesktop: '/header-bg.jpg',
        imageMobile: '/header-bg.jpg',
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      const url = editingBanner ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners';
      const method = editingBanner ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const d = await res.json();
      if (d.success) {
        addToast(d.message || "Banner salvo com sucesso!", "success");
        setIsModalOpen(false);
        fetchBanners();
      } else {
        addToast(d.message || "Erro ao salvar banner.", "error");
      }
    } catch (err) {
      addToast("Erro na comunicação com o servidor.", "error");
    }
  };

  const handleToggleActive = async (bannerId) => {
    try {
      const res = await fetch(`/api/admin/banners/${bannerId}/toggle`, { method: 'PUT' });
      const d = await res.json();
      if (d.success) {
        addToast(d.message, "success");
        fetchBanners();
      }
    } catch (err) {
      addToast("Erro ao alternar status do banner.", "error");
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm("Tem certeza que deseja excluir este banner?")) return;
    try {
      const res = await fetch(`/api/admin/banners/${bannerId}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        addToast("Banner excluído com sucesso!", "success");
        fetchBanners();
      }
    } catch (err) {
      addToast("Erro ao excluir banner.", "error");
    }
  };

  return (
    <div>
      {/* Top Header da Seção */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
            Gestão de Banners da Home
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Faça UPLOAD de novas imagens do seu computador, edite frases e links de ação (CTAs).
          </p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> CRIAR NOVO BANNER
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando banners...</div>
      ) : (
        <div className="grid-2">
          {banners.map((b) => (
            <motion.div key={b.id} layout className="admin-card" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Badge Status */}
              <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, display: 'flex', gap: '8px' }}>
                <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 'bold', background: b.active ? '#10B981' : '#646473', color: '#FFF' }}>
                  {b.active ? 'ATIVO NA HOME' : 'INATIVO'}
                </span>
              </div>

              {/* Preview da Imagem */}
              <div style={{ width: '100%', height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative', marginBottom: '1.25rem', background: '#0D0D11' }}>
                <img src={b.imageDesktop || '/header-bg.jpg'} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: b.active ? 1 : 0.4 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', alignItems: 'flex-end', padding: '1rem' }}>
                  <span style={{ color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Ordem #{b.order || 1}
                  </span>
                </div>
              </div>

              {/* Informações do Banner */}
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', fontFamily: 'var(--font-serif)', marginBottom: '0.4rem', color: 'var(--text-dark)' }}>
                {b.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                {b.subtitle}
              </p>

              {/* Detalhes dos Botões CTA */}
              <div style={{ background: '#FAF8F4', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', marginBottom: '1.5rem', border: '1px solid var(--light-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: 'var(--primary-burgundy)' }}>
                  <LinkIcon size={14} /> Botão Principal: "{b.buttonText}" → {b.buttonLink}
                </div>
                {b.secondaryButtonText && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                    <LinkIcon size={14} /> Botão Secundário: "{b.secondaryButtonText}" → {b.secondaryButtonLink}
                  </div>
                )}
              </div>

              {/* Ações de Edição */}
              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid #F0ECE4', paddingTop: '1rem' }}>
                <button onClick={() => handleOpenModal(b)} className="btn btn-outline" style={{ flexGrow: 1, padding: '0.55rem', fontSize: '0.85rem' }}>
                  <Edit2 size={16} /> EDITAR BANNER
                </button>

                <button onClick={() => handleToggleActive(b.id)} style={{ padding: '0.55rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)', background: b.active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: b.active ? '#EF4444' : '#10B981', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Power size={16} /> {b.active ? 'Desativar' : 'Ativar'}
                </button>

                <button onClick={() => handleDeleteBanner(b.id)} style={{ padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', cursor: 'pointer' }} title="Excluir Banner">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Banner com UPLOAD DE ARQUIVOS */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>
                  {editingBanner ? 'Editar Banner com Upload' : 'Criar Banner com Upload'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={22} color="var(--text-dark)" />
                </button>
              </div>

              <form onSubmit={handleSaveBanner} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* UPLOADER DE ARQUIVO DA IMAGEM DESKTOP */}
                <ImageUploader
                  label="Upload da Imagem Principal (Desktop) *"
                  value={formData.imageDesktop}
                  onChange={(url) => setFormData({ ...formData, imageDesktop: url, imageMobile: formData.imageMobile || url })}
                  helpText="Selecione um arquivo de foto do seu computador"
                />

                {/* UPLOADER DE ARQUIVO DA IMAGEM MOBILE (OPCIONAL) */}
                <ImageUploader
                  label="Upload da Imagem Responsiva (Mobile - Opcional)"
                  value={formData.imageMobile}
                  onChange={(url) => setFormData({ ...formData, imageMobile: url })}
                  helpText="Se desconsiderado, a imagem principal será usada no celular"
                />

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Título Principal do Banner *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: O SABOR QUE TRANSFORMA SEUS PRATOS"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Subtítulo / Frase Promocional *
                  </label>
                  <textarea
                    rows="2"
                    required
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Ex: Molhos especiais agridoces desenvolvidos para criar experiências gastronômicas inesquecíveis."
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>

                <div className="grid-2">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                      Texto Botão Principal (CTA)
                    </label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                      placeholder="COMPRAR AGORA"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                      Link Botão Principal
                    </label>
                    <input
                      type="text"
                      value={formData.buttonLink}
                      onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                      placeholder="/produtos"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                      Texto Botão Secundário
                    </label>
                    <input
                      type="text"
                      value={formData.secondaryButtonText}
                      onChange={(e) => setFormData({ ...formData, secondaryButtonText: e.target.value })}
                      placeholder="CONHEÇA A LINHA FINE RECIPE"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                      Link Botão Secundário
                    </label>
                    <input
                      type="text"
                      value={formData.secondaryButtonLink}
                      onChange={(e) => setFormData({ ...formData, secondaryButtonLink: e.target.value })}
                      placeholder="/produtos?categoria=cat_fine_recipe"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="bannerActive"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-burgundy)' }}
                  />
                  <label htmlFor="bannerActive" style={{ fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>
                    Banner Ativo na Página Inicial da Loja
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--light-border)', paddingTop: '1rem' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                    CANCELAR
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Check size={18} /> SALVAR BANNER
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
