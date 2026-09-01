import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('livios_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const { addToast } = useToast();

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('livios_user', JSON.stringify(data.user));
        localStorage.setItem('livios_token', data.token);
        addToast(`Bem-vindo(a) de volta, ${data.user.name.split(' ')[0]}!`, 'success');
        return data.user;
      } else {
        addToast(data.message || 'Erro ao efetuar login', 'error');
        return false;
      }
    } catch (err) {
      addToast('Erro na conexão com o servidor', 'error');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('livios_user', JSON.stringify(data.user));
        addToast(data.message, 'success');
        return true;
      } else {
        addToast(data.message, 'error');
        return false;
      }
    } catch (err) {
      addToast('Erro ao realizar cadastro', 'error');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('livios_user');
    localStorage.removeItem('livios_token');
    addToast('Sua sessão foi encerrada com sucesso.', 'info');
  };

  const updateUserProfile = async (profileData) => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...profileData })
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...user, ...data.user };
        setUser(updated);
        localStorage.setItem('livios_user', JSON.stringify(updated));
        addToast(data.message, 'success');
        return true;
      }
    } catch (err) {
      addToast('Erro ao atualizar perfil', 'error');
    }
    return false;
  };

  const hasPermission = (perm) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.permissions && user.permissions.includes(perm);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUserProfile, hasPermission, isAdmin: user && ['super_admin', 'admin', 'operator', 'editor'].includes(user.role) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
