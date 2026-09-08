import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  QrCode, 
  Copy, 
  Truck, 
  Clock, 
  Package, 
  MapPin, 
  ArrowRight, 
  MessageCircle, 
  ExternalLink,
  ShieldCheck,
  ChefHat
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';
import { createWhatsAppUrl } from '../../utils/whatsapp.js';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const WHATSAPP_NUMBER = '5531995675327';
  const WHATSAPP_FORMATTED = '(31) 99567-5327';

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrder(data.order);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const copyPixCode = () => {
    if (order?.paymentDetails?.pixCopyPaste) {
      navigator.clipboard.writeText(order.paymentDetails.pixCopyPaste);
      addToast("Chave PIX copiada para a área de transferência!", "success");
    }
  };

  if (loading || !order) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0', background: 'var(--light-bg)', minHeight: '80vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--primary-burgundy)', fontWeight: 'bold' }}>Carregando dados do pedido...</div>
      </div>
    );
  }

  const trackingUrl = `${window.location.origin}/rastreio/${order.id}`;

  const waReopenText = `Olá, equipe Livio's Food! Realizei o Pedido #${order.id} no valor de R$ ${order.total.toFixed(2).replace('.', ',')} no site e gostaria de confirmar o envio dos dados de pagamento e acompanhar o preparo!`;
  const waReopenUrl = createWhatsAppUrl(WHATSAPP_NUMBER, waReopenText);

  return (
    <div style={{ padding: '3.5rem 0', background: 'var(--light-bg)', minHeight: '85vh' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        
        {/* Banner de Sucesso */}
        <div style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', padding: '2.5rem', textAlign: 'center', boxShadow: 'var(--shadow-md)', marginBottom: '2rem' }}>
          
          <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle2 size={46} />
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)', marginBottom: '0.5rem' }}>
            Pedido Registrado com Sucesso!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '1.5rem', maxWidth: '620px', margin: '0 auto 1.5rem' }}>
            Obrigado por escolher a <strong>Livio's Food Innovation</strong>. Seu pedido <strong>#{order.id}</strong> foi registrado em nosso sistema e direcionado para atendimento no WhatsApp.
          </p>

          {/* Botão Principal de Ação no WhatsApp */}
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1.75rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <MessageCircle size={22} color="#16A34A" /> Atendimento Direto no WhatsApp
            </div>
            <p style={{ fontSize: '0.9rem', color: '#15803D', marginBottom: '1.25rem' }}>
              Caso a conversa do WhatsApp não tenha aberto automaticamente, clique no botão abaixo para falar com nosso atendente:
            </p>
            <a
              href={waReopenUrl}
              target="_blank"
              rel="noreferrer"
              className="btn"
              style={{
                background: '#25D366',
                color: '#FFF',
                padding: '1rem 2rem',
                fontSize: '1.05rem',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)'
              }}
            >
              <MessageCircle size={22} /> ABRIR CONVERSA NO WHATSAPP ({WHATSAPP_FORMATTED})
            </a>
          </div>

          {/* Se Pagamento for PIX: Mostra QR Code real */}
          {order.paymentMethod === 'pix' && order.paymentDetails && (
            <div style={{ background: '#FAF8F5', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--accent-gold)', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <QrCode size={22} color="var(--primary-burgundy)" /> Pagamento Facilitado via PIX
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Você pode escanear o QR Code ou copiar a chave e enviar o comprovante diretamente no WhatsApp:
              </p>

              {order.paymentDetails.pixQrCodeUrl && (
                <div style={{ background: '#FFF', padding: '1rem', display: 'inline-block', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <img src={order.paymentDetails.pixQrCodeUrl} alt="QR Code PIX" style={{ width: '180px', height: '180px' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={copyPixCode} className="btn btn-gold" style={{ padding: '0.75rem 1.5rem', fontSize: '0.92rem' }}>
                  <Copy size={16} /> COPIAR CHAVE PIX (COPIA E COLA)
                </button>
              </div>
            </div>
          )}

          {/* Guia: Como você vai acompanhar o status pelo Zap */}
          <div style={{ textAlign: 'left', background: '#F8FAFC', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--primary-burgundy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} /> Como acompanhar o andamento do seu pedido pelo WhatsApp:
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ background: '#FFF', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                <strong style={{ display: 'block', color: 'var(--text-dark)', marginBottom: '4px' }}>1. Confirmação & Pagamento</strong>
                <span style={{ color: 'var(--text-muted)' }}>Você envia o comprovante ou solicita o link de cartão no WhatsApp oficial.</span>
              </div>
              <div style={{ background: '#FFF', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                <strong style={{ display: 'block', color: 'var(--text-dark)', marginBottom: '4px' }}>2. Preparação dos Molhos</strong>
                <span style={{ color: 'var(--text-muted)' }}>Seus molhos artesanais são embalados com cuidado e lacre de segurança.</span>
              </div>
              <div style={{ background: '#FFF', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                <strong style={{ display: 'block', color: 'var(--text-dark)', marginBottom: '4px' }}>3. Código de Rastreio</strong>
                <span style={{ color: 'var(--text-muted)' }}>Você recebe o código dos Correios direto no seu Zap para acompanhar cada etapa!</span>
              </div>
            </div>
          </div>

          {/* Botões de Acompanhamento */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to={`/rastreio/${order.id}`} className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} /> ACOMPANHAR STATUS EM TEMPO REAL
            </Link>
            <Link to="/produtos" className="btn btn-outline" style={{ padding: '0.85rem 1.75rem' }}>
              CONTINUAR COMPRANDO
            </Link>
          </div>
        </div>

        {/* Resumo Completo de Itens e Endereço */}
        <div style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>
            Detalhes do Pedido #{order.id}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {(order.items || []).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0ECE4', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src={item.image || '/header-bg.jpg'} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qtd: {item.quantity} x R$ {(item.unitPrice || 0).toFixed(2).replace('.', ',')}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--primary-burgundy)' }}>
                  R$ {((item.totalPrice || (item.unitPrice * item.quantity)) || 0).toFixed(2).replace('.', ',')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--light-border)', paddingTop: '1rem', fontSize: '1.2rem', fontWeight: '800' }}>
            <span>Valor Total:</span>
            <span style={{ color: 'var(--primary-burgundy)' }}>R$ {order.total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
