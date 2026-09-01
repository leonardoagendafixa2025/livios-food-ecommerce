import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, QrCode, Copy, Truck, Clock, Package, MapPin, ArrowRight } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

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
      addToast("Código PIX copiado para a área de transferência!", "success");
    }
  };

  if (loading || !order) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--primary-burgundy)', fontWeight: 'bold' }}>Carregando dados do pedido...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '3.5rem 0', background: 'var(--light-bg)', minHeight: '85vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        {/* Banner de Sucesso */}
        <div style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', padding: '2.5rem', textAlign: 'center', boxShadow: 'var(--shadow-md)', marginBottom: '2rem' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle2 size={42} />
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)', marginBottom: '0.5rem' }}>
            Pedido Realizado com Sucesso!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '1.5rem' }}>
            Obrigado por escolher a <strong>Livio's Food Innovation</strong>. Seu pedido <strong>#{order.id}</strong> foi recebido em nosso sistema.
          </p>

          {/* Se Pagamento for PIX: Mostra QR Code real */}
          {order.paymentMethod === 'pix' && (
            <div style={{ background: '#FAF8F5', padding: '1.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--accent-gold)', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <QrCode size={22} color="var(--primary-burgundy)" /> Pagamento via PIX
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Abra o aplicativo do seu banco e escaneie o código QR abaixo ou utilize o botão copia e cola:
              </p>

              <div style={{ background: '#FFF', padding: '1rem', display: 'inline-block', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <img src={order.paymentDetails.pixQrCodeUrl} alt="QR Code PIX" style={{ width: '200px', height: '200px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button onClick={copyPixCode} className="btn btn-gold" style={{ padding: '0.75rem 1.5rem', fontSize: '0.92rem' }}>
                  <Copy size={16} /> COPIAR CÓDIGO PIX (COPIA E COLA)
                </button>
              </div>
            </div>
          )}

          {/* Timeline Visual de Status do Pedido */}
          <div style={{ marginTop: '2.5rem', textAlign: 'left' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
              Status e Acompanhamento do Pedido
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.statusHistory.map((hist, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-burgundy)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    ✓
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{hist.note}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(hist.date).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumo Completo de Itens e Endereço */}
        <div style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>
            Detalhes do Pedido #{order.id}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0ECE4', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qtd: {item.quantity} x R$ {item.unitPrice.toFixed(2).replace('.', ',')}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--primary-burgundy)' }}>
                  R$ {item.totalPrice.toFixed(2).replace('.', ',')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--light-border)', paddingTop: '1rem', fontSize: '1.2rem', fontWeight: '800' }}>
            <span>Valor Total Pago</span>
            <span style={{ color: 'var(--primary-burgundy)' }}>R$ {order.total.toFixed(2).replace('.', ',')}</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <Link to="/minha-conta" className="btn btn-outline" style={{ flexGrow: 1 }}>
              IR PARA MINHA CONTA
            </Link>
            <Link to="/produtos" className="btn btn-primary" style={{ flexGrow: 1 }}>
              CONTINUAR COMPRANDO <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
