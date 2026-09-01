import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Truck, ShieldCheck, CheckCircle2, Share2, Plus, Minus, Flame, ArrowRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext.jsx';
import { useWishlist } from '../../contexts/WishlistContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import ProductCard from '../../components/ProductCard.jsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [productData, setProductData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);

  // Simulador de Frete
  const [cepInput, setCepInput] = useState('');
  const [shippingOptions, setShippingOptions] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Form de Avaliação
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const { addToCart, setSelectedShipping } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProductData(data.product);
          setSelectedImage(0);
        } else {
          addToast("Produto não encontrado.", "error");
          navigate('/produtos');
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading || !productData) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 0' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--primary-burgundy)', fontWeight: 'bold' }}>Carregando produto Livio's Food...</div>
      </div>
    );
  }

  const isFavorite = isInWishlist(productData.id);
  const price = productData.promotionalPrice || productData.price;
  const oldPrice = productData.promotionalPrice ? productData.price : null;
  const pixPrice = price * 0.95; // 5% de desconto no PIX
  const isOutOfStock = productData.stock <= 0;

  const handleCalculateShipping = async (e) => {
    e.preventDefault();
    if (!cepInput || cepInput.replace(/\D/g, '').length < 8) {
      addToast("Por favor, informe um CEP válido com 8 dígitos.", "error");
      return;
    }
    setCalcLoading(true);
    try {
      const res = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: cepInput, items: [{ price, quantity }] })
      });
      const data = await res.json();
      if (data.success) {
        setShippingOptions(data.options);
      }
    } catch (err) {
      addToast("Erro ao calcular frete.", "error");
    } finally {
      setCalcLoading(false);
    }
  };

  const handleBuyNow = () => {
    addToCart(productData, quantity);
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      addToast("Preencha seu nome e comentário.", "error");
      return;
    }
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productData.id,
          customerName: reviewName,
          rating: reviewRating,
          comment: reviewComment
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, "success");
        setProductData(prev => ({
          ...prev,
          reviews: [data.review, ...(prev.reviews || [])]
        }));
        setReviewName('');
        setReviewComment('');
      }
    } catch (err) {
      addToast("Erro ao enviar avaliação.", "error");
    }
  };

  return (
    <div style={{ padding: '3rem 0', background: 'var(--light-bg)' }}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <Link to="/" style={{ color: 'var(--text-dark)' }}>Início</Link> /{' '}
          <Link to="/produtos" style={{ color: 'var(--text-dark)' }}>Produtos</Link> /{' '}
          <span style={{ color: 'var(--primary-burgundy)', fontWeight: 'bold' }}>{productData.name}</span>
        </div>

        {/* Bloco Principal de Informações */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '3.5rem', background: '#FFF', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', boxShadow: 'var(--shadow-md)', marginBottom: '3rem' }}>
          {/* Galeria de Imagens com Zoom */}
          <div>
            <div style={{ width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#FAF8F5', border: '1px solid var(--light-border)', marginBottom: '1.25rem', position: 'relative' }}>
              <img
                src={productData.images && productData.images[selectedImage] && !productData.images[selectedImage].includes('header-bg') ? productData.images[selectedImage] : "https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?auto=format&fit=crop&w=1000&q=80"}
                alt={productData.name}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?auto=format&fit=crop&w=1000&q=80";
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                onClick={() => toggleWishlist(productData)}
                style={{ position: 'absolute', top: '16px', right: '16px', background: '#FFF', border: 'none', width: '42px', height: '42px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}
              >
                <Heart size={22} fill={isFavorite ? "var(--primary-burgundy)" : "none"} color={isFavorite ? "var(--primary-burgundy)" : "#777"} />
              </button>
            </div>

            {/* Miniaturas */}
            {productData.images && productData.images.length > 1 && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                {productData.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    style={{
                      width: '75px',
                      height: '75px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: selectedImage === idx ? '2px solid var(--primary-burgundy)' : '1px solid var(--light-border)',
                      cursor: 'pointer',
                      opacity: selectedImage === idx ? 1 : 0.7
                    }}
                  >
                    <img src={img} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detalhes do Produto */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <span>SKU: {productData.sku}</span>
              <span>•</span>
              <span style={{ color: 'var(--accent-gold-hover)', fontWeight: 'bold' }}>{productData.categoryName}</span>
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', lineHeight: '1.2', color: 'var(--text-dark)', marginBottom: '0.85rem', fontFamily: 'var(--font-serif)' }}>
              {productData.name}
            </h1>

            {/* Avaliação */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {productData.reviews && productData.reviews.length > 0 ? (
                <>
                  <div style={{ display: 'flex', color: '#F59E0B' }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill={i < Math.round(productData.rating || 5) ? "#F59E0B" : "none"} color="#F59E0B" />
                    ))}
                  </div>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{productData.rating}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>({productData.reviews.length} avaliações)</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Nenhuma avaliação registrada ainda</span>
              )}
            </div>

            {/* Bloco de Preço */}
            <div style={{ background: '#FAF8F5', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)', marginBottom: '1.5rem' }}>
              {oldPrice && (
                <div style={{ fontSize: '0.95rem', color: '#888', textDecoration: 'line-through' }}>
                  De R$ {oldPrice.toFixed(2).replace('.', ',')}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary-burgundy)' }}>
                  R$ {price.toFixed(2).replace('.', ',')}
                </span>
                <span style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  À vista no PIX: R$ {pixPrice.toFixed(2).replace('.', ',')} (5% OFF)
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                ou em até 12x de R$ {(price / 12).toFixed(2).replace('.', ',')} no cartão de crédito
              </div>
            </div>

            {/* Descrição Curta */}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {productData.shortDescription}
            </p>

            {/* Status do Estoque */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.75rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {isOutOfStock ? (
                <span style={{ color: '#EF4444' }}> Produto Esgotado no Momento</span>
              ) : (
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={18} /> Estoque disponível para envio imediato ({productData.stock} unidades)
                </span>
              )}
            </div>

            {/* Quantidade & Botões */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--light-border)', borderRadius: 'var(--radius-md)', background: '#FFF' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '0.75rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ padding: '0 1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ padding: '0.75rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={() => addToCart(productData, quantity)}
                disabled={isOutOfStock}
                className="btn btn-primary"
                style={{ flexGrow: 1, padding: '0.9rem', fontSize: '1rem' }}
              >
                <ShoppingBag size={20} /> ADICIONAR AO CARRINHO
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="btn btn-gold"
                style={{ padding: '0.9rem 1.5rem', fontSize: '1rem' }}
              >
                COMPRAR AGORA
              </button>
            </div>

            {/* Calculadora de Frete por CEP */}
            <div style={{ borderTop: '1px solid var(--light-border)', paddingTop: '1.5rem' }}>
              <form onSubmit={handleCalculateShipping} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
                  <Truck size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                  Calcular Frete e Prazo de Entrega:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Digite seu CEP (ex: 01310-100)"
                    value={cepInput}
                    onChange={(e) => setCepInput(e.target.value)}
                    style={{ flexGrow: 1, padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)', fontSize: '0.9rem' }}
                  />
                  <button type="submit" className="btn btn-outline" style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem' }}>
                    {calcLoading ? "Calculando..." : "Calcular"}
                  </button>
                </div>
              </form>

              {shippingOptions && (
                <div style={{ background: '#F8F6F0', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {shippingOptions.map(opt => (
                    <div key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', alignItems: 'center' }}>
                      <div>
                        <strong>{opt.name}</strong> ({opt.deadline})
                      </div>
                      <div style={{ color: 'var(--primary-burgundy)', fontWeight: 'bold' }}>
                        {opt.isFree ? "FRETE GRÁTIS" : `R$ ${opt.price.toFixed(2).replace('.', ',')}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Abas de Informações Detalhadas */}
        <div style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--light-border)', background: '#FAF8F5' }}>
            <button
              onClick={() => setActiveTab('description')}
              style={{
                padding: '1.25rem 2rem',
                border: 'none',
                background: activeTab === 'description' ? '#FFF' : 'transparent',
                fontWeight: 'bold',
                fontSize: '1rem',
                color: activeTab === 'description' ? 'var(--primary-burgundy)' : 'var(--text-muted)',
                borderBottom: activeTab === 'description' ? '3px solid var(--primary-burgundy)' : 'none',
                cursor: 'pointer'
              }}
            >
              Descrição Completa
            </button>
            <button
              onClick={() => setActiveTab('ingredients')}
              style={{
                padding: '1.25rem 2rem',
                border: 'none',
                background: activeTab === 'ingredients' ? '#FFF' : 'transparent',
                fontWeight: 'bold',
                fontSize: '1rem',
                color: activeTab === 'ingredients' ? 'var(--primary-burgundy)' : 'var(--text-muted)',
                borderBottom: activeTab === 'ingredients' ? '3px solid var(--primary-burgundy)' : 'none',
                cursor: 'pointer'
              }}
            >
              Ingredientes & Nutricional
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              style={{
                padding: '1.25rem 2rem',
                border: 'none',
                background: activeTab === 'reviews' ? '#FFF' : 'transparent',
                fontWeight: 'bold',
                fontSize: '1rem',
                color: activeTab === 'reviews' ? 'var(--primary-burgundy)' : 'var(--text-muted)',
                borderBottom: activeTab === 'reviews' ? '3px solid var(--primary-burgundy)' : 'none',
                cursor: 'pointer'
              }}
            >
              Avaliações dos Clientes ({productData.reviews ? productData.reviews.length : 0})
            </button>
          </div>

          <div style={{ padding: '2.5rem' }}>
            {activeTab === 'description' && (
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>
                  A Experiência Gastronômica Livio's Food
                </h3>
                <p style={{ color: 'var(--text-dark)', lineHeight: '1.8', fontSize: '1rem', marginBottom: '1.5rem' }}>
                  {productData.fullDescription}
                </p>
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Ingredientes Selecionados</h4>
                <p style={{ color: 'var(--text-dark)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                  {productData.ingredients}
                </p>

                <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Tabela Nutricional</h4>
                {productData.nutritionInfo && productData.nutritionInfo.length > 0 ? (
                  <table className="table-custom" style={{ maxWidth: '500px' }}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantidade por Porção</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productData.nutritionInfo.map((nut, idx) => (
                        <tr key={idx}>
                          <td><strong>{nut.label}</strong></td>
                          <td>{nut.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Sem glúten. Não contém conservantes artificiais agressivos.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {/* Lista de Avaliações */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                  {productData.reviews && productData.reviews.length > 0 ? (
                    productData.reviews.map(rev => (
                      <div key={rev.id} style={{ background: '#FAF8F5', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{rev.customerName}</div>
                          <div style={{ display: 'flex', color: '#F59E0B' }}>
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} size={14} fill="#F59E0B" />
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>"{rev.comment}"</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>Seja o primeiro a avaliar este produto!</p>
                  )}
                </div>

                {/* Formulário de Nova Avaliação */}
                <div style={{ background: '#FAF8F5', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Deixe sua Avaliação</h4>
                  <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="grid-2">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Seu Nome</label>
                        <input
                          type="text"
                          required
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          placeholder="Ex: João Silva"
                          style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Nota (Estrelas)</label>
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(parseInt(e.target.value))}
                          style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                        >
                          <option value="5">5 Estrelas (Excelente)</option>
                          <option value="4">4 Estrelas (Muito Bom)</option>
                          <option value="3">3 Estrelas (Bom)</option>
                          <option value="2">2 Estrelas (Regular)</option>
                          <option value="1">1 Estrela (Ruim)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Seu Comentário</label>
                      <textarea
                        rows="3"
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Conte sua experiência com este molho especial..."
                        style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                      ENVIAR AVALIAÇÃO
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Produtos Relacionados */}
        {productData.relatedProducts && productData.relatedProducts.filter(p => p.active !== false).length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-serif)', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>
              VOCÊ TAMBÉM PODE GOSTAR
            </h3>
            <div className="grid-4">
              {productData.relatedProducts.filter(p => p.active !== false).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
