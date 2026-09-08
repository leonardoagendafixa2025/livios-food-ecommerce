import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Truck, RefreshCw, FileText, Lock, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import { createWhatsAppUrl } from '../../utils/whatsapp.js';

export default function InstitutionalPages() {
  const location = useLocation();
  const path = location.pathname;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  const getContent = () => {
    switch (path) {
      case '/politica-privacidade':
        return {
          badge: 'SEGURANÇA & PRIVACIDADE',
          title: 'Política de Privacidade e Proteção de Dados (LGPD)',
          icon: Lock,
          content: (
            <>
              <p>
                A <strong>Livio's Food Innovation</strong> (CNPJ: 16.782.941/0001-45), com sede em Contagem - MG, valoriza a privacidade e a segurança dos dados pessoais de todos os nossos clientes e visitantes. Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), esta Política descreve como coletamos, armazenamos, tratamos e protegemos suas informações.
              </p>

              <h3>1. Coleta de Informações</h3>
              <p>
                Coletamos apenas as informações estritamente necessárias para o processamento de pedidos, entrega de mercadorias, emissão fiscal e comunicação pós-venda, tais como: nome completo, CPF, e-mail, telefone/WhatsApp e endereço completo de entrega.
              </p>

              <h3>2. Segurança e Criptografia</h3>
              <p>
                Todas as transações financeiras realizadas em nosso e-commerce são criptografadas com protocolo SSL (Secure Socket Layer) de 256 bits. Seus dados de cartão de crédito são processados diretamente em ambiente seguro homologado pelos gateways de pagamento (Mercado Pago e Stripe) e <strong>nunca</strong> ficam armazenados em nossos servidores.
              </p>

              <h3>3. Não Compartilhamento com Terceiros</h3>
              <p>
                A Livio's Food não comercializa, aluga ou cede dados cadastrais de clientes a terceiros. As informações só são compartilhadas com parceiros logísticos estritamente para a finalidade de transporte e entrega dos produtos adquiridos.
              </p>

              <h3>4. Seus Direitos como Titular</h3>
              <p>
                A qualquer momento, você pode solicitar a confirmação da existência de tratamento, a alteração de dados incompletos ou a exclusão dos seus dados através do nosso canal de atendimento oficial: <strong>liviomedeiros@hotmail.com</strong> ou WhatsApp <strong>(31) 99567-5327</strong>.
              </p>
            </>
          )
        };

      case '/termos-uso':
        return {
          badge: 'TERMOS LEGAIS',
          title: 'Termos e Condições de Uso do E-commerce',
          icon: FileText,
          content: (
            <>
              <p>
                Ao acessar e realizar compras no site oficial da <strong>Livio's Food Innovation</strong>, você concorda expressamente com os presentes Termos e Condições de Uso.
              </p>

              <h3>1. Propriedade Intelectual e Fórmulas</h3>
              <p>
                Todas as marcas, nomes de produtos (Linha Fine Recipe, Linha PET), receitas, logotipos, imagens, textos descritivos e fórmulas de molhos agridoces e picantes desenvolvidas por <strong>Rômulo Lívio Medeiros</strong> são de propriedade exclusiva da Livio's Food Innovation, sendo proibida qualquer reprodução não autorizada.
              </p>

              <h3>2. Informações e Disponibilidade de Produtos</h3>
              <p>
                Nos esforçamos para apresentar descrições detalhadas, listas completas de ingredientes, tabelas nutricionais e níveis de picância reais de cada produto. As ofertas e preços promocionais são válidos enquanto durarem os estoques e podem sofrer alterações sem aviso prévio.
              </p>

              <h3>3. Formas de Pagamento</h3>
              <p>
                Aceitamos pagamentos via PIX (com 5% de desconto automático calculado no checkout), Boleto Bancário e Cartões de Crédito em até 12x. Os pedidos só entram em separação e despacho após a confirmação bancária da liquidação do valor.
              </p>
            </>
          )
        };

      case '/trocas-devolucoes':
        return {
          badge: 'GARANTIA & SATISFAÇÃO',
          title: 'Política de Trocas, Devoluções e Reembolso',
          icon: RefreshCw,
          content: (
            <>
              <p>
                Nosso compromisso é com a sua total satisfação gastronômica. Caso ocorra qualquer eventualidade com seu pedido, seguimos rigorosamente o Código de Defesa do Consumidor (CDC).
              </p>

              <h3>1. Direito de Arrependimento (7 Dias)</h3>
              <p>
                Conforme o Art. 49 do CDC, nas compras realizadas pela internet, você pode desistir da compra em até 7 (sete) dias corridos após o recebimento do pedido. Os produtos devem estar com lacre de segurança intacto, sem indícios de consumo ou violação da embalagem original de vidro/PET.
              </p>

              <h3>2. Avarias no Transporte ou Produto Incorreto</h3>
              <p>
                Caso sua encomenda chegue com a caixa violada, garrafa quebrada ou item diferente do adquirido, entre em contato imediatamente com nossa equipe via WhatsApp <strong>(31) 99567-5327</strong> enviando foto da avaria. Realizaremos o reenvio imediato do produto sem qualquer custo adicional ou o reembolso integral.
              </p>

              <h3>3. Como Solicitar</h3>
              <p>
                Envie o número do pedido e relato para <strong>liviomedeiros@hotmail.com</strong> ou WhatsApp. Nossa equipe responderá em até 24 horas úteis com as instruções de logística reversa.
              </p>
            </>
          )
        };

      case '/politica-entrega':
      default:
        return {
          badge: 'LOGÍSTICA & PRAZOS',
          title: 'Política de Prazos, Frete e Entregas',
          icon: Truck,
          content: (
            <>
              <p>
                A Livio's Food realiza entregas em todo o território nacional através dos Correios (SEDEX / PAC) e transportadoras parceiras homologadas com seguro de carga.
              </p>

              <h3>1. Regra de Frete Grátis</h3>
              <p>
                Oferecemos <strong>Frete Grátis</strong> para todas as compras a partir de <strong>R$ 150,00</strong> para as regiões atendidas. O benefício é aplicado automaticamente no carrinho de compras e no checkout.
              </p>

              <h3>2. Prazo de Separação e Postagem</h3>
              <p>
                Após a confirmação do pagamento, seu pedido é cuidadosamente embalado em caixas reforçadas com proteção contra impacto para garrafas de vidro e despachado em até <strong>1 a 2 dias úteis</strong>.
              </p>

              <h3>3. Rastreamento em Tempo Real</h3>
              <p>
                Assim que a encomenda for despachada, você receberá o código de rastreamento por e-mail e WhatsApp para acompanhar cada etapa da entrega até a sua residência.
              </p>
            </>
          )
        };
    }
  };

  const page = getContent();
  const Icon = page.icon;

  return (
    <div style={{ padding: '4rem 0', background: 'var(--light-bg)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>Início</Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--primary-burgundy)', fontWeight: 'bold' }}>{page.badge}</span>
        </div>

        {/* Card Principal */}
        <div style={{ background: '#FFF', padding: '3rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--light-border)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(139, 0, 0, 0.08)', color: 'var(--primary-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={28} />
            </div>
            <div>
              <span style={{ color: 'var(--accent-gold-hover)', fontWeight: '800', letterSpacing: '1.5px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                {page.badge}
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)', marginTop: '2px', lineHeight: '1.2' }}>
                {page.title}
              </h1>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--light-border)', paddingTop: '2rem', color: '#4A4A5A', lineHeight: '1.8', fontSize: '0.98rem' }}>
            {page.content}
          </div>

          {/* Dúvidas / Suporte */}
          <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--light-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--light-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>Ainda tem alguma dúvida?</h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Fale diretamente com nossa equipe oficial de atendimento.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <a href={createWhatsAppUrl('5531995675327')} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', gap: '6px' }}>
                <Phone size={16} /> (31) 99567-5327
              </a>
              <Link to="/contato" className="btn btn-outline" style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}>
                Fale Conosco
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
