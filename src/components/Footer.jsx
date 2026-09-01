import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, ShieldCheck, CreditCard, Truck } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#0F0F14', color: '#B0B0C0', paddingTop: '4rem', paddingBottom: '2rem', borderTop: '4px solid var(--primary-burgundy)' }}>
      <div className="container">
        <div className="grid-4" style={{ marginBottom: '3rem' }}>
          {/* Coluna 1: Sobre com a Logo Oficial */}
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <img
                src="/logo.png"
                alt="Livio's Food Innovation"
                style={{ height: '70px', width: 'auto', background: '#FFF', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem', color: '#9090A0' }}>
              Atuando no mercado desde 2012 com foco em excelência e inovação alimentícia. Criada pelo mestre gastronômico Rômulo Lívio Medeiros para transformar suas refeições em momentos inesquecíveis.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="https://www.instagram.com/livios_food_innovation/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)' }} title="@livios_food_innovation"><Instagram size={20} /></a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)' }}><Facebook size={20} /></a>
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div>
            <h4 style={{ color: '#FFF', fontSize: '1.1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>Navegação Rápida</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <li><Link to="/" style={{ color: '#C0C0D0' }}>Página Inicial</Link></li>
              <li><Link to="/produtos" style={{ color: '#C0C0D0' }}>Catálogo Completo</Link></li>
              <li><Link to="/produtos?categoria=cat_fine_recipe" style={{ color: '#C0C0D0' }}>Linha Fine Recipe</Link></li>
              <li><Link to="/produtos?categoria=cat_pet" style={{ color: '#C0C0D0' }}>Linha Bisnaga PET</Link></li>
              <li><Link to="/receitas" style={{ color: '#C0C0D0' }}>Receitas Harmonizadas</Link></li>
              <li><Link to="/sobre" style={{ color: '#C0C0D0' }}>Nossa História</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Atendimento e Políticas */}
          <div>
            <h4 style={{ color: '#FFF', fontSize: '1.1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>Atendimento & Políticas</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <li><Link to="/minha-conta" style={{ color: '#C0C0D0' }}>Meus Pedidos</Link></li>
              <li><Link to="/politica-privacidade" style={{ color: '#C0C0D0' }}>Política de Privacidade</Link></li>
              <li><Link to="/termos-uso" style={{ color: '#C0C0D0' }}>Termos de Uso</Link></li>
              <li><Link to="/trocas-devolucoes" style={{ color: '#C0C0D0' }}>Trocas e Devoluções</Link></li>
              <li><Link to="/politica-entrega" style={{ color: '#C0C0D0' }}>Prazos e Entregas</Link></li>
              <li><Link to="/contato" style={{ color: '#C0C0D0' }}>Fale Conosco</Link></li>
            </ul>
          </div>

          {/* Coluna 4: Contato */}
          <div>
            <h4 style={{ color: '#FFF', fontSize: '1.1rem', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>Contato Oficial</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Phone size={16} color="var(--accent-gold)" />
                <span>(31) 99567-5327</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={16} color="var(--accent-gold)" />
                <span>liviomedeiros@hotmail.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <MapPin size={16} color="var(--accent-gold)" style={{ marginTop: '3px' }} />
                <span>Rua Antônio Raposo, 186 - Água Branca - Contagem - MG</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px' }}>
                <ShieldCheck size={18} color="#10B981" /> Compra 100% Segura
              </div>
              <p style={{ fontSize: '0.78rem', color: '#808090' }}>Certificado SSL com criptografia de ponta a ponta.</p>
            </div>
          </div>
        </div>

        {/* Linha inferior de Copyright */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem' }}>
          <div>
            Copyright © 2026 <strong>Livio's Food Innovation — Fine Recipe</strong>. Todos os direitos reservados. CNPJ: 16.782.941/0001-45.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#FFF' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CreditCard size={16} /> Cartões de Crédito (até 12x)</span>
            <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>PIX com 5% de Desconto</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={16} /> Entregamos em todo o Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
