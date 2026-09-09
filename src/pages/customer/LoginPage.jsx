import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Flame, Lock, Mail, User, Phone, FileText, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { addToast } = useToast();

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const initialMode = searchParams.get('mode') === 'register';

  const [isRegister, setIsRegister] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Máscaras de formatação
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isRegister) {
      if (!name.trim()) {
        addToast("Por favor, preencha seu nome completo.", "error");
        return;
      }
      if (!validateCPF(cpf)) {
        addToast("CPF inválido. Digite um CPF com 11 dígitos válido.", "error");
        return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        addToast("Informe um número de WhatsApp válido com DDD.", "error");
        return;
      }
      if (password.length < 6) {
        addToast("A senha deve conter no mínimo 6 caracteres.", "error");
        return;
      }
    }

    setLoading(true);

    try {
      if (isRegister) {
        const registeredUser = await register({ name, email, password, phone, cpf });
        if (registeredUser) {
          const destination = redirectParam || (['super_admin', 'admin', 'operator'].includes(registeredUser.role) ? '/admin' : '/minha-conta');
          navigate(destination);
        }
      } else {
        const loggedUser = await login(email, password);
        if (loggedUser) {
          const destination = redirectParam || (['super_admin', 'admin', 'operator'].includes(loggedUser.role) ? '/admin' : '/minha-conta');
          navigate(destination);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '4rem 0', background: 'var(--light-bg)', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '480px' }}>
        <div style={{ background: '#FFF', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', boxShadow: 'var(--shadow-md)' }}>
          
          {/* Alerta de Checkout se houver redirecionamento */}
          {redirectParam && (
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#92400E', fontSize: '0.88rem' }}>
              <ShieldCheck size={18} color="#D97706" />
              <span>Para finalizar seu pedido com segurança, acesse sua conta ou crie um cadastro rápido abaixo.</span>
            </div>
          )}

          {/* Logo e Título */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div className="logo-icon" style={{ margin: '0 auto 1rem', width: '56px', height: '56px' }}>
              <Flame size={32} />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)' }}>
              {isRegister ? "Criar Sua Conta" : "Acessar Sua Conta"}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              {isRegister ? "Preencha seus dados para efetuar pedidos e acompanhar envios." : "Entre com seu e-mail e senha cadastrados."}
            </p>
          </div>

          {/* Abas Alternadoras */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--light-bg)', padding: '4px', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              style={{
                padding: '0.65rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 'bold',
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: !isRegister ? '#FFF' : 'transparent',
                color: !isRegister ? 'var(--primary-burgundy)' : 'var(--text-muted)',
                boxShadow: !isRegister ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Já Tenho Conta
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              style={{
                padding: '0.65rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 'bold',
                fontSize: '0.88rem',
                cursor: 'pointer',
                background: isRegister ? '#FFF' : 'transparent',
                color: isRegister ? 'var(--primary-burgundy)' : 'var(--text-muted)',
                boxShadow: isRegister ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Criar Nova Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nome Completo *</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Leonardo Melo"
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Endereço de E-mail *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Senha *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? "Crie uma senha (mínimo 6 dígitos)" : "Sua senha"}
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

            {isRegister && (
              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>WhatsApp *</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      placeholder="(31) 99999-9999"
                      style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>CPF *</label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      required
                      value={cpf}
                      onChange={(e) => setCpf(maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? "Processando..." : isRegister ? "CRIAR CONTA E CONTINUAR" : "ENTRAR E CONTINUAR"} <ArrowRight size={18} />
            </button>
          </form>

          {/* Rodapé Alternador */}
          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--light-border)', paddingTop: '1.25rem', fontSize: '0.9rem' }}>
            {isRegister ? (
              <span>
                Já possui uma conta?{' '}
                <button onClick={() => setIsRegister(false)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-burgundy)', fontWeight: 'bold', cursor: 'pointer' }}>
                  Entrar aqui
                </button>
              </span>
            ) : (
              <span>
                Ainda não tem conta?{' '}
                <button onClick={() => setIsRegister(true)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-burgundy)', fontWeight: 'bold', cursor: 'pointer' }}>
                  Cadastre-se gratuitamente
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
