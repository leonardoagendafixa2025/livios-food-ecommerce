import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, CreditCard, QrCode, FileText, CheckCircle2, Truck, User, MapPin } from 'lucide-react';
import { useCart } from '../../contexts/CartContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function CheckoutPage() {
  const { items, getSubtotal, getDiscountAmount, getShippingFee, getTotal, selectedShipping, clearCart, coupon } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Identificação, 2: Endereço, 3: Entrega, 4: Pagamento, 5: Revisão

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

  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    installments: '1'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center', background: 'var(--light-bg)' }}>
        <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>Seu carrinho está vazio</h2>
        <Link to="/produtos" className="btn btn-primary">VER PRODUTOS</Link>
      </div>
    );
  }

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
          option: selectedShipping || { name: 'SEDEX Express', price: 18.90 }
        },
        payment: {
          method: paymentMethod,
          installments: parseInt(cardData.installments)
        },
        couponCode: coupon?.code || null,
        subtotal: getSubtotal(),
        discount: getDiscountAmount(),
        shippingFee: getShippingFee(),
        total: getTotal()
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        clearCart();
        addToast("Pedido gerado com sucesso!", "success");
        navigate(`/pedido-confirmado/${data.order.id}`);
      } else {
        addToast(data.message || "Erro ao processar pedido.", "error");
      }
    } catch (err) {
      addToast("Erro na conexão com o gateway de pagamento.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '3rem 0', background: 'var(--light-bg)', minHeight: '85vh' }}>
      <div className="container">
        {/* Header Checkout Seguro */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--light-border)' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)' }}>
            Finalizar Compra Seguro
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 'bold', fontSize: '0.9rem' }}>
            <ShieldCheck size={20} /> Ambiente 100% Criptografado
          </div>
        </div>

        {/* Wizard Steps indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', position: 'relative' }}>
          {[
            { num: 1, label: 'Identificação', icon: User },
            { num: 2, label: 'Endereço', icon: MapPin },
            { num: 3, label: 'Entrega', icon: Truck },
            { num: 4, label: 'Pagamento', icon: CreditCard },
            { num: 5, label: 'Revisão', icon: CheckCircle2 }
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem' }}>
          {/* Conteúdo da Etapa Ativa */}
          <main style={{ background: '#FFF', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', boxShadow: 'var(--shadow-sm)' }}>
            {/* ETAPA 1: IDENTIFICAÇÃO */}
            {step === 1 && (
              <form onSubmit={handleStep1Next}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
                  1. Seus Dados Pessoais
                </h3>
                <div className="grid-2" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      placeholder="Ex: Ana Maria Silva"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>E-mail para Acompanhamento *</label>
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

                <div className="grid-2" style={{ marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>CPF *</label>
                    <input
                      type="text"
                      required
                      value={customer.cpf}
                      onChange={(e) => setCustomer({ ...customer, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Telefone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      placeholder="(31) 99999-9999"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
                  CONTINUAR PARA ENDEREÇO
                </button>
              </form>
            )}

            {/* ETAPA 2: ENDEREÇO */}
            {step === 2 && (
              <form onSubmit={handleStep2Next}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
                  2. Endereço de Entrega
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>CEP *</label>
                  <input
                    type="text"
                    required
                    value={address.cep}
                    onChange={(e) => setAddress({ ...address, cep: e.target.value })}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
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
                      placeholder="Ex: Av. Paulista"
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
                      placeholder="Apto 82"
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
                      placeholder="Bela Vista"
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
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>CONTINUAR PARA ENTREGA</button>
                </div>
              </form>
            )}

            {/* ETAPA 3: FRETE E ENTREGA */}
            {step === 3 && (
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
                  3. Opções de Entrega
                </h3>
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
                  <button type="button" onClick={() => setStep(4)} className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>CONTINUAR PARA PAGAMENTO</button>
                </div>
              </div>
            )}

            {/* ETAPA 4: PAGAMENTO */}
            {step === 4 && (
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
                  4. Forma de Pagamento
                </h3>

                {/* Seletores de Método */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'pix' ? '2px solid var(--primary-burgundy)' : '1px solid var(--light-border)',
                      background: paymentMethod === 'pix' ? 'rgba(139, 0, 0, 0.05)' : '#FFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    <QrCode size={28} color={paymentMethod === 'pix' ? 'var(--primary-burgundy)' : '#555'} />
                    <span>PIX (5% OFF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'credit_card' ? '2px solid var(--primary-burgundy)' : '1px solid var(--light-border)',
                      background: paymentMethod === 'credit_card' ? 'rgba(139, 0, 0, 0.05)' : '#FFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    <CreditCard size={28} color={paymentMethod === 'credit_card' ? 'var(--primary-burgundy)' : '#555'} />
                    <span>Cartão de Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('boleto')}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'boleto' ? '2px solid var(--primary-burgundy)' : '1px solid var(--light-border)',
                      background: paymentMethod === 'boleto' ? 'rgba(139, 0, 0, 0.05)' : '#FFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    <FileText size={28} color={paymentMethod === 'boleto' ? 'var(--primary-burgundy)' : '#555'} />
                    <span>Boleto Bancário</span>
                  </button>
                </div>

                {/* Detalhes do Método Selecionado */}
                {paymentMethod === 'pix' && (
                  <div style={{ background: '#FAF8F5', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)', marginBottom: '2rem', textAlign: 'center' }}>
                    <QrCode size={48} color="var(--primary-burgundy)" style={{ marginBottom: '0.5rem' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Aprovação Instantânea via PIX</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      O QR Code e a chave Copia e Cola serão gerados na próxima etapa. Você recebe <strong>5% de desconto automático</strong>!
                    </p>
                  </div>
                )}

                {paymentMethod === 'credit_card' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Número do Cartão</label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                      />
                    </div>

                    <div className="grid-3">
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nome Impresso no Cartão</label>
                        <input
                          type="text"
                          placeholder="EX: MARIA S SILVA"
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Validade / CVV</label>
                        <input
                          type="text"
                          placeholder="12/28 - 123"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Parcelamento</label>
                      <select
                        value={cardData.installments}
                        onChange={(e) => setCardData({ ...cardData, installments: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                      >
                        <option value="1">1x de R$ {getTotal().toFixed(2).replace('.', ',')} sem juros</option>
                        <option value="2">2x de R$ {(getTotal() / 2).toFixed(2).replace('.', ',')} sem juros</option>
                        <option value="3">3x de R$ {(getTotal() / 3).toFixed(2).replace('.', ',')} sem juros</option>
                        <option value="6">6x de R$ {(getTotal() / 6).toFixed(2).replace('.', ',')} com pequeno acréscimo</option>
                        <option value="12">12x de R$ {(getTotal() / 12).toFixed(2).replace('.', ',')} com pequeno acréscimo</option>
                      </select>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => setStep(3)} className="btn btn-outline">VOLTAR</button>
                  <button type="button" onClick={() => setStep(5)} className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>REVISAR E CONFIRMAR</button>
                </div>
              </div>
            )}

            {/* ETAPA 5: REVISÃO E FINALIZAÇÃO */}
            {step === 5 && (
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>
                  5. Revisão Final do Pedido
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)' }}>
                    <strong>Cliente:</strong> {customer.name} ({customer.email} — {customer.phone})
                  </div>

                  <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)' }}>
                    <strong>Endereço de Entrega:</strong> {address.street}, {address.number} {address.complement} — {address.neighborhood}, {address.city}/{address.state} — CEP: {address.cep}
                  </div>

                  <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)' }}>
                    <strong>Forma de Pagamento Escolhida:</strong> {paymentMethod.toUpperCase()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => setStep(4)} className="btn btn-outline">VOLTAR</button>
                  <button
                    type="button"
                    onClick={handleFinishOrder}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
                  >
                    {isSubmitting ? "PROCESSANDO PEDIDO..." : "FINALIZAR PEDIDO AGORA"}
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
          </aside>
        </div>
      </div>
    </div>
  );
}
