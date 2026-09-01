import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext.jsx';

export default function ImageUploader({ value, onChange, label = "Selecione ou Arraste uma Imagem", helpText }) {
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(event.target.result);
      };
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast("Por favor selecione um arquivo de imagem válido (PNG, JPG, WEBP).", "error");
      return;
    }

    setUploading(true);

    try {
      const compressedBase64 = await compressImage(file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedBase64 })
      });
      const d = await res.json();
      if (d.success && d.url) {
        onChange(d.url);
        addToast(d.message || "Upload da imagem concluído com sucesso!", "success");
      } else {
        addToast(d.message || "Falha ao fazer upload da imagem.", "error");
      }
    } catch (err) {
      console.error("Erro no upload da imagem:", err);
      addToast("Erro na comunicação durante o upload da imagem.", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--text-dark)' }}>
          {label}
        </label>
      )}

      {value ? (
        <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--primary-burgundy)', background: '#0D0D11' }}>
          <img src={value} alt="Preview do Upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
            <span style={{ background: '#10B981', color: '#FFF', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} /> Imagem Carregada
            </span>
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ background: 'rgba(239, 68, 68, 0.9)', color: '#FFF', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Remover Imagem"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1.5rem',
            border: '2px dashed var(--light-border)',
            borderRadius: 'var(--radius-md)',
            background: '#FAF8F4',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'center'
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--primary-burgundy)' }}>
              <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Enviando imagem para a nuvem...</span>
            </div>
          ) : (
            <>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(139, 0, 0, 0.08)', color: 'var(--primary-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <UploadCloud size={26} />
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-dark)', marginBottom: '2px' }}>
                CLIQUE AQUI PARA FAZER UPLOAD DA IMAGEM
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {helpText || "Selecione PNG, JPG, WEBP do seu computador (máx. 10MB)"}
              </div>
            </>
          )}
        </label>
      )}
    </div>
  );
}
