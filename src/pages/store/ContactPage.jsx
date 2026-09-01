import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Send, Instagram } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const { addToast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    addToast("Sua mensagem foi enviada com sucesso! Responderemos em breve.", "success");
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
  };

  return (
    <div style={{ padding: '4rem 0', background: 'var(--light-bg)', minHeight: '80vh' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary-burgundy)', fontWeight: '800', letterSpacing: '2px', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            FALE CONOSCO
          </span>
          <h1 style={{ fontSize: '2.8rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)', marginTop: '0.4rem' }}>
            Central de Atendimento Livio's Food
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0.5rem auto 0' }}>
            Estamos prontos para atender você, tirar suas dúvidas e atender pedidos no atacado e varejo.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '3rem' }}>
          {/* Informações de Contato Reais */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.12)', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageCircle size={26} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '2px' }}>WhatsApp / Atendimento</h4>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-burgundy)' }}>(31) 99567-5327</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Atendimento rápido via WhatsApp</div>
              </div>
            </div>

            <a href="https://www.instagram.com/livios_food_innovation/" target="_blank" rel="noreferrer" style={{ background: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: 'var(--shadow-sm)', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F56040)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Instagram size={26} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '2px' }}>Instagram Oficial</h4>
                <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--primary-burgundy)' }}>@livios_food_innovation</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Siga-nos para ver fotos e novidades</div>
              </div>
            </a>

            <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(139, 0, 0, 0.08)', color: 'var(--primary-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={26} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '2px' }}>E-mail Oficial</h4>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>liviomedeiros@hotmail.com</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Para pedidos, dúvidas e orçamentos</div>
              </div>
            </div>

            <div style={{ background: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.15)', color: 'var(--accent-gold-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={26} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '2px' }}>Endereço da Empresa</h4>
                <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>Rua Antônio Raposo, 186</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Bairro Água Branca — Contagem / MG</div>
              </div>
            </div>
          </div>

          {/* Formulário de Envio */}
          <div style={{ background: '#FFF', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
              Envie uma Mensagem
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Seu Nome *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
              </div>

              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>E-mail *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(31) 99567-5327"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Mensagem *</label>
                <textarea
                  rows="4"
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva aqui como podemos ajudar você..."
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0.9rem', fontSize: '1rem' }}>
                <Send size={18} /> ENVIAR MENSAGEM
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
