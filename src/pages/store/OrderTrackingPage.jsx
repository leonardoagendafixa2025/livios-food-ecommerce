import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  MapPin, 
  ShieldCheck, 
  ExternalLink,
  ChefHat,
  CreditCard,
  ArrowRight,
  Copy,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState(id || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const WHATSAPP_NUMBER = '5531995675327';
  const WHATSAPP_FORMATTED = '(31) 99567-5327';

  const fetchOrder = async (query) => {
    if (!query || !query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setOrder(null);
        addToast(data.message || "Pedido não localizado. Verifique os dados digitados.", "error");
      }
    } catch (err) {
      setOrder(null);
      addToast("Erro ao buscar dados do pedido. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setSearchQuery(id);
      fetchOrder(id);
    }
  }, [id]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/rastreio/${encodeURIComponent(searchQuery.trim())}`);
      fetchOrder(searchQuery.trim());
    }
  };

  const getStatusStepIndex = (status) => {
    switch (status) {
      case 'received':
        return 1;
      case 'payment_approved':
        return 2;
      case 'in_preparation':
        return 3;
      case 'shipped':
        return 4;
      case 'delivered':
        return 5;
      case 'cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = order ? getStatusStepIndex(order.status) : 1;

  const stepsConfig = [
    { num: 1, label: 'Pedido Recebido no WhatsApp', desc: 'Dados e itens registrados no sistema', icon: MessageCircle },
    { num: 2, label: 'Pagamento Confirmado', desc: 'PIX ou Cartão validado pela equipe', icon: CreditCard },
    { num: 3, label: 'Preparo Artesanal', desc: 'Separação e controle de qualidade', icon: ChefHat },
    { num: 4, label: 'Embalado & Despachado', desc: 'Em trânsito para seu endereço', icon: Truck },
    { num: 5, label: 'Entregue', desc: 'Molhos entregues com sucesso!', icon: CheckCircle2 }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'received':
        return { label: 'Aguardando Confirmação no WhatsApp', bg: '#FEF3C7', color: '#B45309' };
      case 'payment_approved':
        return { label: 'Pagamento Confirmado', bg: '#D1FAE5', color: '#065F46' };
      case 'in_preparation':
        return { label: 'Em Preparação Gourmet', bg: '#DBEAFE', color: '#1E40AF' };
      case 'shipped':
        return { label: 'Enviado / Em Trânsito', bg: '#E0E7FF', color: '#3730A3' };
      case 'delivered':
        return { label: 'Pedido Entregue', bg: '#D1FAE5', color: '#047857' };
      case 'cancelled':
        return { label: 'Pedido Cancelado', bg: '#FEE2E2', color: '#B91C1C' };
      default:
        return { label: 'Processando', bg: '#F3F4F6', color: '#374151' };
    }
  };

  const copyTrackingCode = (code) => {
    navigator.clipboard.writeText(code);
    addToast("Código de rastreio copiado!", "success");
  };

  return (
    <div style={{ background: 'var(--light-bg)', minHeight: '85vh', padding: '3.5rem 0' }}>
      <div className="container" style={{ maxWidth: '850px' }}>
        
        {/* Cabeçalho da Página */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(139,0,0,0.08)', color: 'var(--primary-burgundy)', padding: '6px 16px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <Truck size={16} /> RASTREIO DIRETO & ATENDIMENTO VIP
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)', marginBottom: '0.75rem' }}>
            Rastreie seu Pedido
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Acompanhe em tempo real a preparação e envio dos seus molhos artesanais ou consulte nossa equipe diretamente no WhatsApp oficial.
          </p>
        </div>

        {/* Barra de Busca de Rastreamento */}
        <div style={{ background: '#FFF', padding: '1.75rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--light-border)', marginBottom: '2.5rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flexGrow: 1, position: 'relative', minWidth: '260px' }}>
              <Search size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite o Nº do Pedido (Ex: ORD-2024-...) ou seu WhatsApp"
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem 0.9rem 2.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid var(--light-border)',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-burgundy)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--light-border)'}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '0.9rem 2rem', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {loading ? "BUSCANDO..." : "RASTREAR PEDIDO"}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>💡 Dica: Você pode pesquisar pelo número do pedido ou pelo número do seu WhatsApp cadastrado.</span>
          </div>
        </div>

        {/* Resultado do Pedido Encontrado */}
        {order ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Card Principal do Pedido */}
            <div style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--light-border)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Código do Pedido
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)', margin: '2px 0 6px' }}>
                    #{order.id}
                  </h2>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Realizado em {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '30px',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      background: getStatusBadge(order.status).bg,
                      color: getStatusBadge(order.status).color
                    }}
                  >
                    {getStatusBadge(order.status).label}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary-burgundy)', marginTop: '6px' }}>
                    Total: R$ {order.total.toFixed(2).replace('.', ',')}
                  </div>
                </div>
              </div>

              {/* Informação sobre Código de Rastreamento dos Correios se enviado */}
              {order.trackingCode && (
                <div style={{ marginTop: '1.5rem', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Truck size={24} color="#16A34A" />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>Código de Envio / Rastreio Correios:</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '1px', color: '#14532D' }}>{order.trackingCode}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => copyTrackingCode(order.trackingCode)}
                      className="btn btn-outline"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', borderColor: '#16A34A', color: '#166534' }}
                    >
                      <Copy size={14} /> Copiar Código
                    </button>
                    <a
                      href={`https://rastreamento.correios.com.br/app/index.php?codigo=${order.trackingCode}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', background: '#16A34A', color: '#FFF', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      Rastrear nos Correios <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              )}

              {/* Timeline Visual de Etapas */}
              {order.status !== 'cancelled' ? (
                <div style={{ marginTop: '2.5rem', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', marginBottom: '1.75rem' }}>
                    Progresso da Entrega
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {stepsConfig.map((s) => {
                      const Icon = s.icon;
                      const isCompleted = currentStep >= s.num;
                      const isCurrent = currentStep === s.num;

                      return (
                        <div
                          key={s.num}
                          style={{
                            display: 'flex',
                            gap: '1.25rem',
                            alignItems: 'flex-start',
                            position: 'relative'
                          }}
                        >
                          {/* Ícone Redondo */}
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              background: isCompleted ? 'var(--primary-burgundy)' : '#E5E7EB',
                              color: isCompleted ? '#FFF' : '#9CA3AF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isCurrent ? '0 0 0 4px rgba(139,0,0,0.2)' : 'none',
                              flexShrink: 0,
                              zIndex: 2,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <Icon size={20} />
                          </div>

                          {/* Conteúdo da Etapa */}
                          <div style={{ flexGrow: 1, paddingTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '1rem', color: isCompleted ? 'var(--text-dark)' : '#9CA3AF' }}>
                                {s.label}
                              </strong>
                              {isCurrent && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: 'var(--primary-burgundy)', color: '#FFF', padding: '2px 8px', borderRadius: '10px' }}>
                                  Etapa Atual
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {s.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1.5rem', background: '#FEE2E2', color: '#991B1B', borderRadius: 'var(--radius-md)', margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertCircle size={24} />
                  <div>
                    <strong>Este pedido foi cancelado.</strong>
                    <div style={{ fontSize: '0.85rem' }}>Entre em contato via WhatsApp para mais informações ou para reativar seu pedido.</div>
                  </div>
                </div>
              )}

              {/* Histórico Detalhado */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div style={{ borderTop: '1px solid var(--light-border)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
                    Histórico de Atualizações:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                    {order.statusHistory.map((hist, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>• {hist.note}</span>
                        <span style={{ fontSize: '0.8rem' }}>{new Date(hist.date).toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Acompanhamento Direto pelo WhatsApp (Banner de Contato) */}
            <div
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: '#FFF',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem'
              }}
            >
              <div style={{ maxWidth: '480px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                  Dúvidas sobre o envio? Fale com a Livio's no WhatsApp!
                </h3>
                <p style={{ fontSize: '0.92rem', opacity: 0.95, lineHeight: '1.4' }}>
                  Nossa equipe de atendimento gastronômico está pronta para informar o status, fotos do preparo e previsão de entrega direto no seu celular.
                </p>
              </div>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `Olá, equipe Livio's Food! Gostaria de uma atualização sobre o meu Pedido #${order.id} (Cliente: ${order.customerName}).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn"
                style={{
                  background: '#FFF',
                  color: '#128C7E',
                  fontWeight: '800',
                  padding: '1rem 1.75rem',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <MessageCircle size={20} color="#128C7E" />
                CONSULTAR STATUS NO WHATSAPP
              </a>
            </div>

            {/* Resumo de Itens e Endereço */}
            <div style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)', marginBottom: '1.25rem' }}>
                Resumo dos Produtos e Entrega
              </h3>

              {/* Lista de Itens */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '1.25rem' }}>
                {(order.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <img src={item.image || '/header-bg.jpg'} alt={item.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.quantity} un x R$ {(item.unitPrice || 0).toFixed(2).replace('.', ',')}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary-burgundy)' }}>
                      R$ {((item.totalPrice || (item.unitPrice * item.quantity)) || 0).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dados do Cliente e Endereço */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--primary-burgundy)' }}>Cliente:</div>
                  <div>{order.customerName}</div>
                  <div>WhatsApp: {order.customerPhone}</div>
                  <div>E-mail: {order.customerEmail}</div>
                </div>

                <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--primary-burgundy)' }}>Endereço de Entrega:</div>
                  {order.shippingAddress ? (
                    <>
                      <div>{order.shippingAddress.street}, {order.shippingAddress.number} {order.shippingAddress.complement}</div>
                      <div>{order.shippingAddress.neighborhood} — {order.shippingAddress.city}/{order.shippingAddress.state}</div>
                      <div>CEP: {order.shippingAddress.cep}</div>
                    </>
                  ) : (
                    <div>Endereço padrão cadastrado</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/produtos" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                  ← CONTINUAR COMPRANDO
                </Link>
                <button onClick={() => window.print()} className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
                  IMPRIMIR COMPROVANTE
                </button>
              </div>
            </div>
          </div>
        ) : hasSearched && !loading ? (
          <div style={{ background: '#FFF', padding: '3.5rem 2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid var(--light-border)' }}>
            <Package size={54} color="#9CA3AF" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Nenhum pedido encontrado</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
              Não localizamos nenhum pedido com o código ou WhatsApp informado. Verifique se digitou corretamente ou chame nosso suporte.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá, Livio's Food! Gostaria de ajuda para localizar o status do meu pedido.")}`}
              target="_blank"
              rel="noreferrer"
              className="btn"
              style={{ background: '#25D366', color: '#FFF', fontWeight: 'bold', padding: '0.85rem 1.75rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <MessageCircle size={18} /> PEDIR AJUDA NO WHATSAPP
            </a>
          </div>
        ) : null}

      </div>
    </div>
  );
}
