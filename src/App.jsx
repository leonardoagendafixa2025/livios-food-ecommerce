import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Contexts
import { ToastProvider } from './contexts/ToastContext.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import { WishlistProvider } from './contexts/WishlistContext.jsx';
import { CompareProvider } from './contexts/CompareContext.jsx';

// Componentes da Loja
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import WhatsAppButton from './components/WhatsAppButton.jsx';
import MobileBottomNav from './components/MobileBottomNav.jsx';
import PromotionalBar from './components/PromotionalBar.jsx';
import PromotionalPopup from './components/PromotionalPopup.jsx';
import CompareFloatingBar from './components/CompareFloatingBar.jsx';
import AdminSidebar from './components/AdminSidebar.jsx';
import AdminHeader from './components/AdminHeader.jsx';

// Páginas da Loja
import Home from './pages/store/Home.jsx';
import Catalog from './pages/store/Catalog.jsx';
import ProductDetail from './pages/store/ProductDetail.jsx';
import RecipesPage from './pages/store/RecipesPage.jsx';
import AboutPage from './pages/store/AboutPage.jsx';
import ContactPage from './pages/store/ContactPage.jsx';
import CartPage from './pages/checkout/CartPage.jsx';
import CheckoutPage from './pages/checkout/CheckoutPage.jsx';
import OrderConfirmation from './pages/checkout/OrderConfirmation.jsx';
import CustomerAccount from './pages/customer/CustomerAccount.jsx';
import LoginPage from './pages/customer/LoginPage.jsx';

// Páginas dos Recursos Avançados do Prompt Complementar
import SearchPage from './pages/store/SearchPage.jsx';
import ComparePage from './pages/store/ComparePage.jsx';

// Páginas do Admin
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminInventory from './pages/admin/AdminInventory.jsx';
import AdminWaitlist from './pages/admin/AdminWaitlist.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminCustomers from './pages/admin/AdminCustomers.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminBanners from './pages/admin/AdminBanners.jsx';
import AdminCoupons from './pages/admin/AdminCoupons.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';

// Páginas do CRM & Marketing
import AdminCRMDashboard from './pages/admin/AdminCRMDashboard.jsx';
import AdminCustomerProfile from './pages/admin/AdminCustomerProfile.jsx';
import AdminCRMSegments from './pages/admin/AdminCRMSegments.jsx';
import AdminMarketingDashboard from './pages/admin/AdminMarketingDashboard.jsx';
import AdminCampaigns from './pages/admin/AdminCampaigns.jsx';
import AdminPopups from './pages/admin/AdminPopups.jsx';
import AdminPromotionalBars from './pages/admin/AdminPromotionalBars.jsx';
import AdminAutomations from './pages/admin/AdminAutomations.jsx';

// Guard de Proteção do Admin
function ProtectedAdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Layout Público (Com Header, Footer, Barra Promocional, Pop-ups e Barra de Comparação)
function StoreLayout({ children }) {
  const [marketingData, setMarketingData] = React.useState({ popups: [], promotionalBars: [] });

  React.useEffect(() => {
    fetch('/api/marketing/active')
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setMarketingData({ popups: d.popups || [], promotionalBars: d.promotionalBars || [] });
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '60px' }}>
      {marketingData.promotionalBars.length > 0 && (
        <PromotionalBar activeBar={marketingData.promotionalBars[0]} />
      )}
      <Header />
      <main style={{ flexGrow: 1 }}>
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppButton />
      <MobileBottomNav />
      <CompareFloatingBar />
      <PromotionalPopup activePopups={marketingData.popups} />
    </div>
  );
}

// Layout do Painel Administrativo
function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main-container">
        <AdminHeader />
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
              <BrowserRouter>
                <Routes>
                  {/* Rotas Públicas da Loja */}
                  <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
                  <Route path="/produtos" element={<StoreLayout><Catalog /></StoreLayout>} />
                  <Route path="/produto/:slug" element={<StoreLayout><ProductDetail /></StoreLayout>} />
                  <Route path="/buscar" element={<StoreLayout><SearchPage /></StoreLayout>} />
                  <Route path="/comparar" element={<StoreLayout><ComparePage /></StoreLayout>} />
                  <Route path="/receitas" element={<StoreLayout><RecipesPage /></StoreLayout>} />
                  <Route path="/sobre" element={<StoreLayout><AboutPage /></StoreLayout>} />
                  <Route path="/contato" element={<StoreLayout><ContactPage /></StoreLayout>} />
                  <Route path="/carrinho" element={<StoreLayout><CartPage /></StoreLayout>} />
                  <Route path="/checkout" element={<StoreLayout><CheckoutPage /></StoreLayout>} />
                  <Route path="/pedido-confirmado/:id" element={<StoreLayout><OrderConfirmation /></StoreLayout>} />
                  <Route path="/minha-conta" element={<StoreLayout><CustomerAccount /></StoreLayout>} />
                  <Route path="/favoritos" element={<StoreLayout><CustomerAccount /></StoreLayout>} />
                  <Route path="/login" element={<StoreLayout><LoginPage /></StoreLayout>} />

                  {/* Rotas Privadas do Painel Admin */}
                  <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/produtos" element={<ProtectedAdminRoute><AdminLayout><AdminProducts /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/estoque" element={<ProtectedAdminRoute><AdminLayout><AdminInventory /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/estoque/lista-espera" element={<ProtectedAdminRoute><AdminLayout><AdminWaitlist /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/pedidos" element={<ProtectedAdminRoute><AdminLayout><AdminOrders /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/clientes" element={<ProtectedAdminRoute><AdminLayout><AdminCRMDashboard /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/crm" element={<ProtectedAdminRoute><AdminLayout><AdminCRMDashboard /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/crm/cliente/:id" element={<ProtectedAdminRoute><AdminLayout><AdminCustomerProfile /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/crm/segmentos" element={<ProtectedAdminRoute><AdminLayout><AdminCRMSegments /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/categorias" element={<ProtectedAdminRoute><AdminLayout><AdminCategories /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/banners" element={<ProtectedAdminRoute><AdminLayout><AdminBanners /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/cupons" element={<ProtectedAdminRoute><AdminLayout><AdminCoupons /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/configuracoes" element={<ProtectedAdminRoute><AdminLayout><AdminSettings /></AdminLayout></ProtectedAdminRoute>} />

                  {/* ROTAS DE MARKETING & CAMPANHAS */}
                  <Route path="/admin/marketing" element={<ProtectedAdminRoute><AdminLayout><AdminMarketingDashboard /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/marketing/campanhas" element={<ProtectedAdminRoute><AdminLayout><AdminCampaigns /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/marketing/popups" element={<ProtectedAdminRoute><AdminLayout><AdminPopups /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/marketing/barras" element={<ProtectedAdminRoute><AdminLayout><AdminPromotionalBars /></AdminLayout></ProtectedAdminRoute>} />
                  <Route path="/admin/marketing/automacoes" element={<ProtectedAdminRoute><AdminLayout><AdminAutomations /></AdminLayout></ProtectedAdminRoute>} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
