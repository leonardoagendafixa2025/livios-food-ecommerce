import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  User, 
  MapPin, 
  MessageCircle, 
  QrCode, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Flame
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function CheckoutPage() {
  const { items, getSubtotal, getDiscountAmount, getShippingFee, getTotal, selectedShipping, clearCart, coupon } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Identificação, 2: Endereço, 3: Entrega, 4: Finalização WhatsApp

  const WHATSAPP_NUMBER = '5531995675327';
  const WHATSAPP_FORMATTED = '(31) 99567-5327';

  // Dados do formulário
  const [customer, setCustomer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cpf: user?.cpf || ''
  });

  const [address, setAddress] = useState({
    recipient: user?.name || '',
    cep: user?.addresses && user.addresses[0] ? user.addresses[0].cep : '',
    street: user?.addresses && user.addresses[0] ? user.addresses[0].street : '',
    number: user?.addresses && user.addresses[0] ? user.addresses[0].number : '',
    complement: user?.addresses && user.addresses[0] ? user.addresses[0].complement : '',
    neighborhood: user?.addresses && user.addresses[0] ? user.addresses[0].neighborhood : '',
    city: user?.addresses && user.addresses[0] ? user.addresses[0].city : 'Belo Horizonte',
    state: user?.addresses && user.addresses[0] ? user.addresses[0].state : 'MG'
  });

  const [paymentPreference, setPaymentPreference] = useState('pix');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center', background: 'var(--light-bg)' }}>
        <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Seu carrinho está vazio</h2>
        <Link to="/produtos" className="btn btn-primary">VER PRODUTOS</Link>
      </div>
    );
  }

  // Máscaras automáticas
  const maskCPF = (val) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const maskPhone = (val) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length <= 10) {
      return clean
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14);
    }
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const maskCEP = (val) => {
    return val
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  // Função para validação do algoritmo oficial de CPF
  const validateCPF = (cpf) => {
    const clean = (cpf || '').replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false;

    let sum = 0, rev = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(clean.charAt(i)) * (10 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(clean.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(clean.charAt(i)) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(clean.charAt(10))) return false;

    return true;
  };

  // Preenchimento automático de endereço via ViaCEP
  const handleCepBlur = async () => {
    const cleanCep = (address.cep || '').replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setAddress(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state
          }));
          addToast("Endereço localizado via CEP!", "success");
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  const handleStep1Next = (e) => {
    e.preventDefault();
    if (!customer.name || !customer.email || !customer.cpf || !customer.phone) {
      addToast("Preencha todos os campos de identificação.", "error");
      return;
    }
    if (!validateCPF(customer.cpf)) {
      addToast("CPF inválido. Por favor, digite um CPF válido com 11 dígitos.", "error");
      return;
    }
    const cleanPhone = customer.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      addToast("Por favor, informe um número de WhatsApp válido com DDD.", "error");
      return;
    }
    setStep(2);
  };

  const handleStep2Next = (e) => {
    e.preventDefault();
    if (!address.cep || !address.street || !address.number || !address.city) {
      addToast("Preencha o endereço completo de entrega.", "error");
      return;
    }
    setStep(3);
  };

  const handleFinishOrder = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        customer,
        items,
        shipping: {
          address,
          option: selectedShipping || { name: 'SEDEX Express', price: getShippingFee() }
        },
        payment: {
          method: paymentPreference,
          installments: 1
        },
        couponCode: coupon?.code || null,
        subtotal: getSubtotal(),
        discount: getDiscountAmount(),
        shippingFee: getShippingFee(),
        total: getTotal(),
        notes: customerNotes
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.order) {
        const order = data.order;
        const trackingUrl = `${window.location.origin}/rastreio/${order.id}`;

        // Monta a mensagem estruturada e elegante para o WhatsApp
        const paymentLabel = 
          paymentPreference === 'pix' ? '⚡ PIX Direto (5% de Desconto)' :
          paymentPreference === 'credit_card' ? '💳 Cartão de Crédito (Link de Pagamento Seguro)' :
          '💵 Transferência / Dinheiro na Entrega';

        const itemsFormatted = items.map((i, idx) => 
          `  ${idx + 1}. *${i.quantity}x ${i.name}* — R$ ${(i.price * i.quantity).toFixed(2).replace('.', ',')}`
        ).join('\n');

        const waMessage = 
`🌶️ *NOVO PEDIDO - LIVIO'S FOOD INNOVATION*
=========================================
📦 *Código do Pedido:* #${order.id}
👤 *Cliente:* ${customer.name}
📱 *WhatsApp:* ${customer.phone}
📧 *E-mail:* ${customer.email}
📄 *CPF:* ${customer.cpf}

📍 *Endereço para Entrega:*
${address.street}, Nº ${address.number} ${address.complement ? `(${address.complement})` : ''}
Bairro: ${address.neighborhood}
Cidade: ${address.city} - ${address.state}
CEP: ${address.cep}

🛒 *Itens Selecionados:*
${itemsFormatted}

-----------------------------------------
📊 *Subtotal:* R$ ${getSubtotal().toFixed(2).replace('.', ',')}
${getDiscountAmount() > 0 ? `🎁 *Desconto (${coupon?.code || 'Cupom'}):* - R$ ${getDiscountAmount().toFixed(2).replace('.', ',')}\n` : ''}🚚 *Frete:* ${getShippingFee() === 0 ? 'GRÁTIS' : `R$ ${getShippingFee().toFixed(2).replace('.', ',')}`}
💰 *TOTAL A PAGAR:* *R$ ${getTotal().toFixed(2).replace('.', ',')}*
💳 *Forma de Pagamento Preferida:* ${paymentLabel}
${customerNotes ? `📝 *Observações:* ${customerNotes}\n` : ''}
=========================================
🔗 *Acompanhamento em Tempo Real:*
${trackingUrl}

Olá, equipe Livio's Food! Acabei de gerar meu pedido pelo site e aguardo a confirmação e dados de pagamento por aqui. Obrigado!`;

        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMessage)}`;

        // Limpa o carrinho
        clearCart();
        addToast("Pedido gerado com sucesso! Abrindo WhatsApp...", "success");

        // Abre WhatsApp em nova aba e redireciona para confirmação
        window.open(waUrl, '_blank');
        navigate(`/pedido-confirmado/${order.id}`);
      } else {
        addToast(data.message || "Erro ao processar pedido.", "error");
      }
    } catch (err) {
      addToast("Erro na conexão com o servidor de pedidos.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '3rem 0', background: 'var(--light-bg)', minHeight: '85vh' }}>
      <div className="container">
        {/* Header Checkout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--light-border)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)', margin: 0 }}>
              Finalização do Pedido
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>
              Atendimento personalizado com envio direto para o WhatsApp oficial
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 'bold', fontSize: '0.9rem', background: '#DCFCE7', padding: '6px 14px', borderRadius: '20px' }}>
            <MessageCircle size={18} /> WhatsApp: {WHATSAPP_FORMATTED}
          </div>
        </div>

        {/* Wizard Steps indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          {[
            { num: 1, label: 'Identificação', icon: User },
            { num: 2, label: 'Endereço', icon: MapPin },
            { num: 3, label: 'Entrega', icon: Truck },
            { num: 4, label: 'WhatsApp & Pagamento', icon: MessageCircle }
          ].map(s => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                onClick={() => isDone && setStep(s.num)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  color: isActive ? 'var(--primary-burgundy)' : isDone ? '#10B981' : '#999',
                  cursor: isDone ? 'pointer' : 'default'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isActive ? 'var(--primary-burgundy)' : isDone ? '#10B981' : '#E0E0E0',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isDone ? <CheckCircle2 size={18} /> : s.num}
                </div>
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="responsive-checkout-layout">
          {/* Conteúdo da Etapa Ativa */}
          <main style={{ background: '#FFF', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', boxShadow: 'var(--shadow-sm)' }}>
            
            {/* ETAPA 1: IDENTIFICAÇÃO */}
            {step === 1 && (
              <form onSubmit={handleStep1Next}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
                  1. Seus Dados de Contato
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                  Informe seu WhatsApp para receber o link de rastreamento e os detalhes do seu pedido.
                </p>

                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="Ex: Rômulo Lívio"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Seu WhatsApp com DDD *</label>
                    <input
                      type="text"
                      required
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: maskPhone(e.target.value) })}
                      placeholder="(31) 99999-9999"
                      maxLength={15}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', borderColor: '#25D366' }}
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>CPF para Emissão da Nota Fiscal *</label>
                    <input
                      type="text"
                      required
                      value={customer.cpf}
                      onChange={(e) => setCustomer({ ...customer, cpf: maskCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>E-mail *</label>
                    <input
                      type="email"
                      required
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      placeholder="seu.email@exemplo.com"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
                  CONTINUAR PARA ENDEREÇO <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* ETAPA 2: ENDEREÇO */}
            {step === 2 && (
              <form onSubmit={handleStep2Next}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
                  2. Endereço de Entrega
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                  Onde você deseja receber seus molhos gourmet?
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>CEP * (Busca automática)</label>
                  <input
                    type="text"
                    required
                    value={address.cep}
                    onChange={(e) => setAddress({ ...address, cep: maskCEP(e.target.value) })}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    maxLength={9}
                    style={{ width: '200px', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>

                <div className="grid-3" style={{ marginBottom: '1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Logradouro / Rua *</label>
                    <input
                      type="text"
                      required
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      placeholder="Ex: Av. Amazonas"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Número *</label>
                    <input
                      type="text"
                      required
                      value={address.number}
                      onChange={(e) => setAddress({ ...address, number: e.target.value })}
                      placeholder="Ex: 1500"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                </div>

                <div className="grid-3" style={{ marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Complemento</label>
                    <input
                      type="text"
                      value={address.complement}
                      onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                      placeholder="Apto, Bloco..."
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Bairro *</label>
                    <input
                      type="text"
                      required
                      value={address.neighborhood}
                      onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                      placeholder="Bairro"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Cidade / UF *</label>
                    <input
                      type="text"
                      required
                      value={`${address.city} / ${address.state}`}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => setStep(1)} className="btn btn-outline">VOLTAR</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>CONTINUAR PARA ENTREGA <ArrowRight size={16} /></button>
                </div>
              </form>
            )}

            {/* ETAPA 3: FRETE E ENTREGA */}
            {step === 3 && (
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
                  3. Opções de Envio
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                  Escolha como prefere receber a sua encomenda.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', border: '2px solid var(--primary-burgundy)', borderRadius: 'var(--radius-md)', background: 'rgba(139,0,0,0.04)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="radio" name="shippingOpt" defaultChecked />
                      <div>
                        <strong style={{ fontSize: '1rem' }}>SEDEX Express Gastronômico</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Prazo estimado: 2 a 3 dias úteis</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: '800', color: 'var(--primary-burgundy)', fontSize: '1.1rem' }}>
                      {getShippingFee() === 0 ? "GRÁTIS" : `R$ ${getShippingFee().toFixed(2).replace('.', ',')}`}
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => setStep(2)} className="btn btn-outline">VOLTAR</button>
                  <button type="button" onClick={() => setStep(4)} className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>CONTINUAR PARA FINALIZAÇÃO <ArrowRight size={16} /></button>
                </div>
              </div>
            )}

            {/* ETAPA 4: FINALIZAÇÃO DIRETA NO WHATSAPP */}
            {step === 4 && (
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
                  4. Finalizar e Enviar para o WhatsApp
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                  Seu pedido será gerado e enviado para atendimento direto da equipe Livio's Food.
                </p>

                {/* Banner de Atendimento WhatsApp */}
                <div style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', color: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <MessageCircle size={32} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Atendimento Humanizado & Confirmação Rápida</h4>
                    <p style={{ fontSize: '0.88rem', opacity: 0.95, lineHeight: '1.4', margin: 0 }}>
                      Ao clicar no botão abaixo, os detalhes do seu pedido serão enviados diretamente para o WhatsApp oficial <strong>{WHATSAPP_FORMATTED}</strong>. Você recebe a chave PIX ou o link de pagamento seguro e acompanha todas as etapas de envio!
                    </p>
                  </div>
                </div>

                {/* Seletor de Preferência de Pagamento */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                    Como você prefere realizar o pagamento?
                  </label>

                  <div className="responsive-cards-3col">
                    <button
                      type="button"
                      onClick={() => setPaymentPreference('pix')}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: paymentPreference === 'pix' ? '2px solid #25D366' : '1px solid var(--light-border)',
                        background: paymentPreference === 'pix' ? '#F0FDF4' : '#FFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      <QrCode size={26} color={paymentPreference === 'pix' ? '#16A34A' : '#666'} />
                      <span style={{ fontSize: '0.85rem' }}>PIX Direto</span>
                      <span style={{ fontSize: '0.72rem', color: '#16A34A', background: '#DCFCE7', padding: '1px 6px', borderRadius: '4px' }}>5% OFF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentPreference('credit_card')}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: paymentPreference === 'credit_card' ? '2px solid var(--primary-burgundy)' : '1px solid var(--light-border)',
                        background: paymentPreference === 'credit_card' ? 'rgba(139, 0, 0, 0.05)' : '#FFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      <CreditCard size={26} color={paymentPreference === 'credit_card' ? 'var(--primary-burgundy)' : '#666'} />
                      <span style={{ fontSize: '0.85rem' }}>Cartão de Crédito</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Link Seguro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentPreference('cash_transfer')}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: paymentPreference === 'cash_transfer' ? '2px solid var(--primary-burgundy)' : '1px solid var(--light-border)',
                        background: paymentPreference === 'cash_transfer' ? 'rgba(139, 0, 0, 0.05)' : '#FFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 'bold',
                        textAlign: 'center'
                      }}
                    >
                      <Banknote size={26} color={paymentPreference === 'cash_transfer' ? 'var(--primary-burgundy)' : '#666'} />
                      <span style={{ fontSize: '0.85rem' }}>Transferência / TED</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ou na entrega</span>
                    </button>
                  </div>
                </div>

                {/* Observações Opcionais */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                    Alguma observação especial para a nossa equipe? (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Ex: Embalar para presente, ponto de referência na entrega, etc."
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setStep(3)} className="btn btn-outline">VOLTAR</button>
                  <button
                    type="button"
                    onClick={handleFinishOrder}
                    disabled={isSubmitting}
                    className="btn"
                    style={{
                      background: '#25D366',
                      color: '#FFF',
                      fontSize: '1.05rem',
                      fontWeight: '800',
                      padding: '1rem 2rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      flexGrow: 1,
                      justifyContent: 'center',
                      boxShadow: '0 4px 15px rgba(37, 211, 102, 0.35)'
                    }}
                  >
                    <MessageCircle size={22} />
                    {isSubmitting ? "PROCESSANDO PEDIDO..." : "FINALIZAR E ENVIAR PARA O WHATSAPP"}
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Resumo Lateral de Valores */}
          <aside style={{ background: '#FFF', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', height: 'fit-content' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '0.5rem' }}>
              Itens no Pedido ({items.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem', maxHeight: '240px', overflowY: 'auto' }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.88rem' }}>
                  <img src={item.image} alt={item.name} style={{ width: '45px', height: '45px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 'bold', lineHeight: '1.2' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{item.quantity}x R$ {item.price.toFixed(2).replace('.', ',')}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--light-border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>R$ {getSubtotal().toFixed(2).replace('.', ',')}</span>
              </div>
              {getDiscountAmount() > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 'bold' }}>
                  <span>Desconto</span>
                  <span>- R$ {getDiscountAmount().toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Frete</span>
                <span>{getShippingFee() === 0 ? "Grátis" : `R$ ${getShippingFee().toFixed(2).replace('.', ',')}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--light-border)', paddingTop: '0.75rem', fontSize: '1.25rem', fontWeight: '800' }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary-burgundy)' }}>R$ {getTotal().toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              🔒 <strong>Seus dados estão protegidos.</strong> Ao finalizar, você fala diretamente com nossa equipe gastronômica no WhatsApp.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
