import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      const ok = await register({ name, email, password, phone, cpf });
      if (ok) navigate('/admin');
    } else {
      const loggedUser = await login(email, password);
      if (loggedUser) {
        navigate('/admin');
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '4rem 0', background: 'var(--light-bg)', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '460px' }}>
        <div style={{ background: '#FFF', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', boxShadow: 'var(--shadow-md)' }}>
          {/* Logo e Titulo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="logo-icon" style={{ margin: '0 auto 1rem', width: '56px', height: '56px' }}>
              <Flame size={32} />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--primary-burgundy)' }}>
              {isRegister ? "Criar Sua Conta" : "Acessar Sua Conta"}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              {isRegister ? "Preencha seus dados para efetuar compras rápidas." : "Entre com seu e-mail e senha cadastrados."}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ana Maria Silva"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Endereço de E-mail</label>
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
              />
            </div>

            {isRegister && (
              <div className="grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(31) 99999-9999"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>CPF</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}>
              {loading ? "Aguarde..." : isRegister ? "CONCLUIR CADASTRO" : "ENTRAR NA CONTA"} <ArrowRight size={18} />
            </button>
          </form>



          {/* Toggle entre Login e Cadastro */}
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
