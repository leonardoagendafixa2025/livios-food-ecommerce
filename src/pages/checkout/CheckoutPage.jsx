import React, { useState, useEffect } from 'react';
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
  Flame,
  Lock,
  Mail,
  Phone,
  FileText,
  Eye,
  EyeOff,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { createWhatsAppUrl, formatNewOrderMessage } from '../../utils/whatsapp.js';

export default function CheckoutPage() {
  const { items, getSubtotal, getDiscountAmount, getShippingFee, getTotal, selectedShipping, clearCart, coupon } = useCart();
  const { user, login, register, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Conta/Identificação, 2: Endereço, 3: Entrega, 4: Finalização WhatsApp

  const WHATSAPP_NUMBER = '5531995675327';
  const WHATSAPP_FORMATTED = '(31) 99567-5327';

  // Estados de autenticação na Etapa 1
  const [authMode, setAuthMode] = useState('register'); // 'register' ou 'login'
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  // Dados do cliente
  const [customer, setCustomer] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cpf: user?.cpf || ''
  });

  // Dados de endereço
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

  // Sincroniza dados quando o usuário se loga
  useEffect(() => {
    if (user) {
      setCustomer(prev => ({
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        cpf: user.cpf || prev.cpf
      }));

      if (user.addresses && user.addresses.length > 0) {
        const primaryAddr = user.addresses[0];
        setAddress(prev => ({
          ...prev,
          recipient: user.name || prev.recipient,
          cep: primaryAddr.cep || prev.cep,
          street: primaryAddr.street || prev.street,
          number: primaryAddr.number || prev.number,
          complement: primaryAddr.complement || prev.complement,
          neighborhood: primaryAddr.neighborhood || prev.neighborhood,
          city: primaryAddr.city || prev.city,
          state: primaryAddr.state || prev.state
        }));
      }
    }
  }, [user]);

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

  // Validação real de CPF
  const validateCPF = (cpfStr) => {
    const clean = (cpfStr || '').replace(/\D/g, '');
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

  // Submissão da Etapa 1: Login ou Criação de Conta
  const handleStep1AuthSubmit = async (e) => {
    e.preventDefault();

    if (user) {
      // Usuário já está logado, avança para o endereço
      if (!customer.name || !customer.phone || !customer.cpf) {
        addToast("Por favor, preencha todos os campos do seu perfil.", "error");
        return;
      }
      if (!validateCPF(customer.cpf)) {
        addToast("CPF inválido. Por favor, digite um CPF válido com 11 dígitos.", "error");
        return;
      }
      setStep(2);
      return;
    }

    // Validações antes de autenticar / cadastrar
    if (authMode === 'register') {
      if (!customer.name.trim()) {
        addToast("Por favor, digite seu nome completo.", "error");
        return;
      }
      if (!customer.email.trim()) {
        addToast("Por favor, digite seu e-mail.", "error");
        return;
      }
      if (!validateCPF(customer.cpf)) {
        addToast("CPF inválido. Por favor, informe um CPF válido com 11 dígitos.", "error");
        return;
      }
      const cleanPhone = customer.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        addToast("Por favor, informe seu WhatsApp com DDD.", "error");
        return;
      }
      if (password.length < 6) {
        addToast("A senha deve conter no mínimo 6 caracteres.", "error");
        return;
      }

      setAuthLoading(true);
      try {
        const newUser = await register({
          name: customer.name,
          email: customer.email,
          password: password,
          phone: customer.phone,
          cpf: customer.cpf
        });
        if (newUser) {
          addToast("Conta criada com sucesso! Prosseguindo com o endereço...", "success");
          setStep(2);
        }
      } finally {
        setAuthLoading(false);
      }
    } else {
      // Modo Login
      if (!customer.email.trim() || !password) {
        addToast("Informe seu e-mail e senha cadastrados.", "error");
        return;
      }
      setAuthLoading(true);
      try {
        const logged = await login(customer.email, password);
        if (logged) {
          setStep(2);
        }
      } finally {
        setAuthLoading(false);
      }
    }
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
        customer: {
          ...customer,
          id: user?.id || null
        },
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

        const paymentLabel = 
          paymentPreference === 'pix' ? 'PIX Direto (5% de Desconto)' :
          paymentPreference === 'credit_card' ? 'Cartão de Crédito (Link Seguro)' :
          'Transferência / Na Entrega';

        const waMessage = formatNewOrderMessage({
          orderId: order.id,
          customer,
          address,
          items,
          subtotal: getSubtotal(),
          discount: getDiscountAmount(),
          couponCode: coupon?.code || '',
          shippingFee: getShippingFee(),
          total: getTotal(),
          paymentMethod: paymentLabel,
          notes: customerNotes,
          trackingUrl
        });

        const waUrl = createWhatsAppUrl(WHATSAPP_NUMBER, waMessage);

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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
              Finalize seus molhos artesanais com atendimento exclusivo e personalizado.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#DCFCE7', color: '#16A34A', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', fontWeight: 'bold' }}>
            <ShieldCheck size={18} /> Compra 100% Segura & Direta
          </div>
        </div>

        {/* Stepper de Progresso */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          {[
            { num: 1, label: user ? 'Identificação (Conectado)' : 'Conta & Cadastro', icon: User },
            { num: 2, label: 'Endereço de Entrega', icon: MapPin },
            { num: 3, label: 'Frete e Envio', icon: Truck },
            { num: 4, label: 'WhatsApp & Pagamento', icon: MessageCircle }
          ].map(s => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                onClick={() => (isDone || (user && s.num < step)) && setStep(s.num)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  color: isActive ? 'var(--primary-burgundy)' : isDone ? '#10B981' : '#999',
                  cursor: (isDone || (user && s.num < step)) ? 'pointer' : 'default'
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
                  justifyContent: 'center',
                  fontWeight: '800'
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
            
            {/* ETAPA 1: CADASTRO / LOGIN OBRIGATÓRIO */}
            {step === 1 && (
              <div>
                {!user ? (
                  <div>
                    {/* Alerta explicativo */}
                    <div style={{ background: '#FAF8F4', border: '1.5px solid #FDE68A', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: 'var(--accent-gold)', color: '#FFF', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Lock size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', color: 'var(--primary-burgundy)', fontSize: '0.95rem' }}>
                          Crie sua conta para finalizar a compra
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Cadastre-se com login e senha para acompanhar seu pedido no WhatsApp e ter acesso ao histórico na Área do Cliente.
                        </div>
                      </div>
                    </div>

                    {/* Abas Alternadoras: Criar Conta vs Já Tenho Conta */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--light-bg)', padding: '5px', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem' }}>
                      <button
                        type="button"
                        onClick={() => setAuthMode('register')}
                        style={{
                          padding: '0.75rem',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: '800',
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          background: authMode === 'register' ? '#FFF' : 'transparent',
                          color: authMode === 'register' ? 'var(--primary-burgundy)' : 'var(--text-muted)',
                          boxShadow: authMode === 'register' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Sparkles size={16} color="var(--accent-gold)" /> Criar Nova Conta
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        style={{
                          padding: '0.75rem',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: '800',
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          background: authMode === 'login' ? '#FFF' : 'transparent',
                          color: authMode === 'login' ? 'var(--primary-burgundy)' : 'var(--text-muted)',
                          boxShadow: authMode === 'login' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <User size={16} /> Já Tenho Conta
                      </button>
                    </div>

                    <form onSubmit={handleStep1AuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      {authMode === 'register' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nome Completo *</label>
                          <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                              type="text"
                              required
                              value={customer.name}
                              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                              placeholder="Ex: Leonardo Melo"
                              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                            />
                          </div>
                        </div>
                      )}

                      <div className={authMode === 'register' ? "grid-2" : ""}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>E-mail *</label>
                          <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                              type="email"
                              required
                              value={customer.email}
                              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                              placeholder="seu.email@exemplo.com"
                              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                            />
                          </div>
                        </div>

                        {authMode === 'register' && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>WhatsApp com DDD *</label>
                            <div style={{ position: 'relative' }}>
                              <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#16A34A' }} />
                              <input
                                type="text"
                                required
                                value={customer.phone}
                                onChange={(e) => setCustomer({ ...customer, phone: maskPhone(e.target.value) })}
                                placeholder="(31) 99999-9999"
                                maxLength={15}
                                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', borderColor: '#22C55E' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {authMode === 'register' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>CPF para Emissão da Nota Fiscal *</label>
                          <div style={{ position: 'relative' }}>
                            <FileText size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                              type="text"
                              required
                              value={customer.cpf}
                              onChange={(e) => setCustomer({ ...customer, cpf: maskCPF(e.target.value) })}
                              placeholder="000.000.000-00"
                              maxLength={14}
                              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>
                          {authMode === 'register' ? 'Crie uma Senha para sua Conta *' : 'Sua Senha *'}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={authMode === 'register' ? "Mínimo 6 dígitos" : "••••••••"}
                            style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="btn btn-primary"
                        style={{ padding: '0.95rem 2rem', fontSize: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        {authLoading ? "Processando..." : authMode === 'register' ? "CRIAR CONTA E AVANÇAR PARA ENTREGA" : "ENTRAR E AVANÇAR PARA ENTREGA"} <ArrowRight size={18} />
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Usuário já conectado */
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
                      1. Identificação da Conta
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                      Seu pedido será vinculado diretamente à sua conta Livio's Food.
                    </p>

                    <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 size={28} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#166534' }}>
                            Conectado como {user.name}
                          </div>
                          <div style={{ color: '#15803D', fontSize: '0.88rem' }}>
                            {user.email} {user.phone ? `• WhatsApp: ${user.phone}` : ''} {user.cpf ? `• CPF: ${user.cpf}` : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={logout}
                        className="btn btn-outline"
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', borderColor: '#BBF7D0', color: '#166534' }}
                      >
                        <LogOut size={14} /> Trocar Conta
                      </button>
                    </div>

                    <form onSubmit={handleStep1AuthSubmit}>
                      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>WhatsApp para Contato & Rastreio *</label>
                          <input
                            type="text"
                            required
                            value={customer.phone}
                            onChange={(e) => setCustomer({ ...customer, phone: maskPhone(e.target.value) })}
                            placeholder="(31) 99999-9999"
                            maxLength={15}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', borderColor: '#22C55E' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>CPF para Nota Fiscal *</label>
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
                      </div>

                      <button type="submit" className="btn btn-primary" style={{ padding: '0.95rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        CONTINUAR PARA ENDEREÇO DE ENTREGA <ArrowRight size={18} />
                      </button>
                    </form>
                  </div>
                )}
              </div>
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
                      placeholder="Ex: Rua Fernando Cândido de Souza"
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
                      placeholder="Ex: 153"
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
                      placeholder="Ex: Casa, Apto 202..."
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
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>CONTINUAR PARA ENVIO <ArrowRight size={16} /></button>
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
                  <span>Desconto ({coupon?.code || 'Cupom'})</span>
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
