import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ShieldCheck, Truck, Award, ArrowRight, Star, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../../components/ProductCard.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [reorderProducts, setReorderProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const [resBanners, resCats, resProds, resRecipes] = await Promise.all([
          fetch('/api/banners'),
          fetch('/api/categories'),
          fetch('/api/products?featured=true'),
          fetch('/api/recipes')
        ]);

        const dataBanners = await resBanners.json();
        const dataCats = await resCats.json();
        const dataProds = await resProds.json();
        const dataRecipes = await resRecipes.json();

        let featuredList = dataProds.success ? dataProds.products : [];

        // Se não houver produtos marcados como destaque, carrega todos os produtos ativos do catálogo
        if (featuredList.length === 0) {
          const resAll = await fetch('/api/products');
          const dataAll = await resAll.json();
          if (dataAll.success) featuredList = dataAll.products;
        }

        if (dataBanners.success) setBanners(dataBanners.banners || []);
        if (dataCats.success) setCategories(dataCats.categories || []);
        setFeaturedProducts(featuredList || []);
        if (dataRecipes.success) setRecipes(dataRecipes.recipes || []);

        if (user && user.email) {
          const resReorder = await fetch(`/api/customer/reorder-suggestions?customerEmail=${encodeURIComponent(user.email)}`);
          const dataReorder = await resReorder.json();
          if (dataReorder.success) setReorderProducts(dataReorder.suggestedProducts);
        }
      } catch (err) {
        console.error("Erro ao carregar dados da Home:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const banner = banners[0] || {
    title: "O SABOR QUE TRANSFORMA SEUS PRATOS",
    subtitle: "Molhos especiais agridoces desenvolvidos para criar experiências gastronômicas inesquecíveis.",
    imageDesktop: "/header-bg.jpg"
  };

  return (
    <div>
      {/* Hero Banner Principal com a Linha de Produtos Oficial Livio's Food */}
      <section className="hero-slider">
        <div className="hero-bg-wrapper">
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 1 }}
            src={banner.imageDesktop || "/header-bg.jpg"}
            alt={banner.title}
            className="hero-bg-img"
          />
          <div className="hero-bg-overlay" />
        </div>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-content"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="hero-tag"
            >
              <Flame size={16} /> Livio's Food Innovation
            </motion.div>

            <h1 className="hero-title">
              O SABOR QUE <span>TRANSFORMA</span> SEUS PRATOS
            </h1>

            <p className="hero-subtitle">
              {banner.subtitle}
            </p>

            <div className="hero-actions">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/produtos" className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}>
                  COMPRAR AGORA <ArrowRight size={20} />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/produtos" className="btn btn-gold" style={{ padding: '0.9rem 1.8rem', fontSize: '1.05rem' }}>
                  CONHEÇA NOSSOS PRODUTOS
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Destaques e Diferenciais da Marca */}
      <section style={{ background: '#FFF', padding: '2.5rem 0', borderBottom: '1px solid var(--light-border)' }}>
        <div className="container">
          <div className="grid-4" style={{ gap: '2rem' }}>
            {[
              { icon: Award, color: 'var(--primary-burgundy)', bg: 'rgba(139, 0, 0, 0.08)', title: 'Fórmula Exclusiva', sub: 'Desenvolvida pelo mestre Rômulo Lívio' },
              { icon: Truck, color: 'var(--accent-gold-hover)', bg: 'rgba(212, 175, 55, 0.12)', title: 'Envio Seguro', sub: 'Frete grátis acima de R$ 150' },
              { icon: Flame, color: 'var(--primary-burgundy)', bg: 'rgba(139, 0, 0, 0.08)', title: 'Agridoce Perfeito', sub: 'Pimentas nobres e polpas naturais' },
              { icon: ShieldCheck, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', title: '100% Satisfação', sub: 'Garantia de sabor e embalagens protegidas' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                    <Icon size={26} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '2px' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.sub}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Seção Categorias: ENCONTRE SEU SABOR */}
      <section style={{ padding: '4.5rem 0', background: 'var(--light-bg)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <span style={{ color: 'var(--accent-gold-hover)', fontWeight: '800', letterSpacing: '2px', fontSize: '0.85rem', textTransform: 'uppercase' }}>
              EXPLORE NOSSO CATÁLOGO
            </span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-dark)', marginTop: '0.4rem' }}>
              ENCONTRE SEU SABOR
            </h2>
            <div style={{ width: '60px', height: '3px', background: 'var(--primary-burgundy)', margin: '1rem auto 0' }} />
          </motion.div>

          <div className="grid-4">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <Link to={`/produtos?categoria=${cat.id}`} className="category-card">
                  <img src={cat.image} alt={cat.name} />
                  <div className="category-card-overlay">
                    <h3 className="category-card-title">{cat.name}</h3>
                    <span className="category-card-count">{cat.description}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. BOTÃO NA HOME DO CLIENTE: COMPRE NOVAMENTE */}
      {user && reorderProducts.length > 0 && (
        <section style={{ padding: '3.5rem 0', background: 'linear-gradient(135deg, #FAF8F4, #FFF)', borderBottom: '1px solid var(--light-border)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <span className="section-subtitle" style={{ color: 'var(--accent-gold-hover)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={16} /> BEM-VINDO DE VOLTA, {user.name.split(' ')[0].toUpperCase()}!
                </span>
                <h2 style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
                  COMPRE NOVAMENTE SEUS FAVORITOS
                </h2>
              </div>

              <Link to="/minha-conta" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                VER MEUS PEDIDOS ANTERIORES →
              </Link>
            </div>

            <div className="grid-4">
              {reorderProducts.slice(0, 4).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Seção Produtos em Destaque: MAIS VENDIDOS */}
      <section style={{ padding: '4.5rem 0', background: '#FFF', borderTop: '1px solid var(--light-border)', borderBottom: '1px solid var(--light-border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
            <div>
              <span style={{ color: 'var(--primary-burgundy)', fontWeight: '800', letterSpacing: '2px', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                SELEÇÃO DA CASA
              </span>
              <h2 style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                PRODUTOS MAIS VENDIDOS
              </h2>
            </div>
            <Link to="/produtos" className="btn btn-outline" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
              VER CATALOGO COMPLETO <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 320px))', gap: '2rem', justifyContent: 'center' }}>
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Banner Promocional Kit Degustação */}
      <section style={{ background: 'linear-gradient(135deg, #121217 0%, #2A080C 100%)', color: '#FFF', padding: '4.5rem 0', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="badge badge-bestseller" style={{ fontSize: '0.85rem', padding: '6px 14px', marginBottom: '1.25rem', display: 'inline-block' }}>
                OFERTA ESPECIAL DE LANÇAMENTO
              </span>
              <h2 style={{ fontSize: '2.8rem', fontWeight: '800', lineHeight: '1.15', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>
                Kit Degustação Gourmet Fine Recipe (4 Molhos)
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#D0D0E0', marginBottom: '1.75rem', lineHeight: '1.6' }}>
                Uma viagem pelos melhores sabores da Livio's Food: Original, Extra Picante, Chocolate Mega Picante e Abacaxi. Acompanha caixa colecionável e livro de receitas.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', color: '#AAA', textDecoration: 'line-through', display: 'block' }}>De R$ 125,00</span>
                  <span style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--accent-gold)' }}>Por R$ 99,90</span>
                </div>
                <span style={{ background: 'var(--primary-burgundy)', color: '#FFF', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  20% OFF
                </span>
              </div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/produto/kit-degustacao-gourmet-fine-recipe-4-molhos" className="btn btn-gold" style={{ padding: '1rem 2.2rem', fontSize: '1.1rem' }}>
                  COMPRAR KIT COM DESCONTO <ArrowRight size={20} />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{ textAlign: 'center' }}
            >
              <img
                src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80"
                alt="Kit Degustação Livio's Food"
                style={{ width: '100%', maxWidth: '480px', borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', border: '2px solid rgba(212,175,55,0.3)' }}
              />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
