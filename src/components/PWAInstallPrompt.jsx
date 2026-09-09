import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, X, Sparkles, Zap, ShieldCheck, Share, PlusSquare, ArrowUpRight } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // 1. Verificar se já está rodando como App instalado (Standalone)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      return; // Já está no PWA instalado, não precisa mostrar
    }

    // 2. Verificar se é iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Verificar histórico do usuário no LocalStorage
    const isDismissed = localStorage.getItem('livios_pwa_dismissed');
    const isInstalled = localStorage.getItem('livios_pwa_installed');

    // 4. Capturar evento de instalação padrão do navegador (Chrome / Android / Edge / Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Se for a primeira visita ou nunca dispensou nos últimos 7 dias, abre o modal
      if (!isDismissed && !isInstalled) {
        setTimeout(() => {
          setIsOpen(true);
        }, 1500); // 1.5s após entrar
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Se for iOS ou navegador sem beforeinstallprompt direto mas nunca dispensou
    if (!isDismissed && !isInstalled && !checkStandalone()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Expor função global para permitir que botões no Footer ou Header abram o instalador
    window.openPWAInstallPrompt = () => {
      setIsOpen(true);
    };

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      delete window.openPWAInstallPrompt;
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('livios_pwa_installed', 'true');
        setInstallSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // No iOS, orienta o usuário visualmente no modal
      // Manter o modal aberto para ele ver as instruções
    } else {
      // Fallback genérico para navegadores desktop ou outros
      localStorage.setItem('livios_pwa_dismissed', Date.now().toString());
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('livios_pwa_dismissed', Date.now().toString());
    setIsOpen(false);
  };

  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="pwa-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 6, 10, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#12131a',
              border: '1px solid rgba(255, 85, 0, 0.25)',
              borderRadius: '24px',
              padding: '28px 24px',
              color: '#ffffff',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 85, 0, 0.15)',
              overflow: 'hidden'
            }}
          >
            {/* Efeito luminoso de fundo */}
            <div style={{
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(255,85,0,0.2) 0%, rgba(255,85,0,0) 70%)',
              pointerEvents: 'none'
            }} />

            {/* Botão de Fechar */}
            <button
              onClick={handleDismiss}
              aria-label="Fechar"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#aaa',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'; }}
            >
              <X size={18} />
            </button>

            {/* Header com Logo Oficial */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                position: 'relative',
                width: '68px',
                height: '68px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #1f1410 0%, #0d0e15 100%)',
                border: '2px solid rgba(255, 85, 0, 0.4)',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(255, 85, 0, 0.25)',
                flexShrink: 0
              }}>
                <img
                  src="/logo.png"
                  alt="Livio's Food Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  backgroundColor: '#ff5500',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={11} color="#fff" />
                </span>
              </div>

              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(255, 85, 0, 0.15)',
                  color: '#ff7722',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '4px'
                }}>
                  App Oficial
                </div>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  color: '#ffffff',
                  lineHeight: '1.2'
                }}>
                  Instale o App Livio's
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>
                  Fine Recipe & Gastronomia Gourmet
                </p>
              </div>
            </div>

            {/* Benefícios */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '14px',
              marginBottom: '22px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 85, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff6600',
                  flexShrink: 0
                }}>
                  <Zap size={16} />
                </div>
                <span style={{ fontSize: '0.85rem', color: '#e5e7eb', fontWeight: '500' }}>
                  Acesso ultra-rápido direto na tela inicial sem digitar link
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 85, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff6600',
                  flexShrink: 0
                }}>
                  <Sparkles size={16} />
                </div>
                <span style={{ fontSize: '0.85rem', color: '#e5e7eb', fontWeight: '500' }}>
                  Notificações de novos lotes de molhos e cupons exclusivos
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 85, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ff6600',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={16} />
                </div>
                <span style={{ fontSize: '0.85rem', color: '#e5e7eb', fontWeight: '500' }}>
                  Leve, seguro e não consome espaço da memória do celular
                </span>
              </div>
            </div>

            {/* Instruções específicas para iOS caso esteja no iPhone/iPad */}
            {isIOS && !deferredPrompt ? (
              <div style={{
                backgroundColor: 'rgba(255, 85, 0, 0.08)',
                border: '1px dashed rgba(255, 85, 0, 0.35)',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '18px',
                fontSize: '0.83rem',
                color: '#ffd0b0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontWeight: '700', color: '#ff7722', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={16} /> No iPhone ou iPad:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>1. Toque no botão de <strong>Compartilhar</strong></span>
                  <Share size={15} color="#ff7722" />
                  <span>no Safari</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong></span>
                  <PlusSquare size={15} color="#ff7722" />
                </div>
              </div>
            ) : null}

            {/* Estado de Sucesso */}
            {installSuccess ? (
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid #22c55e',
                borderRadius: '12px',
                color: '#4ade80',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                🎉 Aplicativo instalado com sucesso!
              </div>
            ) : (
              /* Ações */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleInstallClick}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ff5500 0%, #e03e00 100%)',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '0.98rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 20px rgba(255, 85, 0, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 25px rgba(255, 85, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 85, 0, 0.35)';
                  }}
                >
                  <Download size={18} />
                  {isIOS ? 'Entendi, como adicionar' : 'Instalar Aplicativo Grátis'}
                </button>

                <button
                  onClick={handleDismiss}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#8b949e',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#d1d5db'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#8b949e'; }}
                >
                  Continuar pelo navegador
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
