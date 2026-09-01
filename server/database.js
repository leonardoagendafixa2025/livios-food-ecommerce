import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data_store.json');

// Initial seed data with authentic Livio's Food Innovation details, Marketing, Waitlist, CRM & Comparison
const initialData = {
  settings: {
    storeName: "Livio's Food Innovation",
    tagline: "Molhos Especiais & Inovação Gastronômica",
    cnpj: "16.782.941/0001-45",
    phone: "(31) 99567-5327",
    whatsapp: "5531995675327",
    email: "liviomedeiros@hotmail.com",
    address: "Rua Antônio Raposo, 186 - Água Branca - Contagem - MG",
    freeShippingThreshold: 150.00,
    fixedShippingRate: 18.90,
    gateways: {
      pixDiscountPercent: 5,
      mercadoPagoEnabled: true,
      stripeEnabled: true,
      pixEnabled: true,
      creditCardInstallmentsMax: 12,
      creditCardInstallmentsFree: 3
    },
    seo: {
      metaTitle: "Livio's Food Innovation — Loja Oficial de Molhos Especiais",
      metaDescription: "Descubra molhos agridoces, picantes e artesanais produzidos com fórmulas exclusivas inspiradas na gastronomia britânica por Rômulo Lívio Medeiros.",
      keywords: "molho de pimenta, agridoce, livios food, gourmet, pimenta biquinho, chocolate picante, molho churrasco"
    }
  },

  roles: [
    { id: "super_admin", name: "Super Administrador", permissions: ["all"] },
    { id: "admin", name: "Administrador", permissions: ["products", "orders", "customers", "inventory", "coupons", "banners", "content", "marketing", "crm", "waitlist"] },
    { id: "operator", name: "Operador de Estoque e Pedidos", permissions: ["orders", "inventory", "customers_read"] },
    { id: "editor", name: "Editor de Conteúdo", permissions: ["banners", "recipes", "gallery", "content"] }
  ],

  users: [
    {
      id: "usr_admin_1",
      name: "Rômulo Lívio Medeiros",
      email: "liviomedeiros@hotmail.com",
      passwordHash: "admin123",
      role: "super_admin",
      createdAt: "2024-01-10T10:00:00Z",
      marketingConsent: true
    },
    {
      id: "usr_operator_1",
      name: "Carlos Eduardo (Operador)",
      email: "operador@liviosfood.com",
      passwordHash: "operador123",
      role: "operator",
      createdAt: "2024-02-01T14:00:00Z",
      marketingConsent: true
    },
    {
      id: "usr_cust_1",
      name: "Ana Beatriz Oliveira",
      email: "ana.oliveira@gmail.com",
      phone: "(31) 98765-4321",
      cpf: "123.456.789-00",
      passwordHash: "cliente123",
      role: "customer",
      createdAt: "2024-03-15T11:20:00Z",
      marketingConsent: true,
      tags: ["VIP", "Cliente Recorrente", "Prefere Picante"],
      addresses: [
        {
          id: "addr_1",
          name: "Residencial Principal",
          recipient: "Ana Beatriz Oliveira",
          cep: "32370-000",
          street: "Av. João César de Oliveira",
          number: "1200",
          complement: "Apto 502",
          neighborhood: "Eldorado",
          city: "Contagem",
          state: "MG",
          isDefault: true
        }
      ]
    },
    {
      id: "usr_cust_2",
      name: "Ricardo Silva Alencar",
      email: "ricardo.alencar@hotmail.com",
      phone: "(31) 99876-1234",
      cpf: "987.654.321-11",
      passwordHash: "cliente123",
      role: "customer",
      createdAt: "2024-04-02T09:15:00Z",
      marketingConsent: true,
      tags: ["Novo", "Primeira Compra"],
      addresses: [
        {
          id: "addr_2",
          name: "Casa",
          recipient: "Ricardo Silva Alencar",
          cep: "30130-000",
          street: "Rua da Bahia",
          number: "800",
          neighborhood: "Centro",
          city: "Belo Horizonte",
          state: "MG",
          isDefault: true
        }
      ]
    }
  ],

  categories: [
    {
      id: "cat_fine_recipe",
      name: "Molhos Fine Recipe",
      slug: "molho-fine-recipe",
      description: "Nossa linha premium em garrafas de vidro gourmet de 250ml.",
      image: "/header-bg.jpg",
      order: 1,
      active: true
    },
    {
      id: "cat_pet",
      name: "Molhos Linha PET",
      slug: "molho-pet",
      description: "Praticidade e sabor surpreendente em bisnagas de 350g para o dia a dia.",
      image: "https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?auto=format&fit=crop&w=800&q=80",
      order: 2,
      active: true
    },
    {
      id: "cat_kits",
      name: "Kits & Combos",
      slug: "kits-combos",
      description: "Seleções especiais com desconto progressivo e frete grátis.",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
      order: 3,
      active: true
    },
    {
      id: "cat_picantes",
      name: "Linha Extra Picante",
      slug: "linha-extra-picante",
      description: "Para os amantes da verdadeira ardência combinada com notas agridoces.",
      image: "https://images.unsplash.com/photo-1583182332473-b0d5f308a883?auto=format&fit=crop&w=800&q=80",
      order: 4,
      active: true
    }
  ],

  products: [
    {
      id: "prod_1",
      sku: "LIV-FIN-001",
      name: "Molho Agridoce Fine Recipe Original 250ml",
      slug: "molho-agridoce-fine-recipe-original-250ml",
      categoryId: "cat_fine_recipe",
      shortDescription: "A clássica fórmula balanceada de pimentas selecionadas com toque agridoce gourmet.",
      fullDescription: "O Molho Agridoce Fine Recipe Original é a criação insígnia de Rômulo Lívio Medeiros. Desenvolvido após mais de uma década de pesquisas gastronômicas, este molho une o amargor sutil de pimentas nobres, o dulçor das frutas e uma acidez elegante que harmoniza perfeitamente com carnes vermelhas, queijos e petiscos.",
      price: 29.90,
      promotionalPrice: 26.90,
      costPrice: 8.50,
      stock: 140,
      minStock: 20,
      weightKg: 0.45,
      volumeMl: 250,
      heatLevel: "Média", // 'Baixa', 'Média', 'Alta', 'Extrema'
      ingredients: "Pimentas vermelhas selecionadas, açúcar de cana, vinagre de maçã, alho fresco, sal marinho, espessante natural goma xantana e especiarias finas.",
      nutritionInfo: [
        { label: "Valor Energético", value: "32 kcal (por colher de sopa - 15g)" },
        { label: "Carboidratos", value: "7.8g" },
        { label: "Sódio", value: "85mg" }
      ],
      images: ["/header-bg.jpg"],
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      isOffer: true,
      rating: 4.9,
      reviewCount: 38,
      active: true
    },
    {
      id: "prod_2",
      sku: "LIV-FIN-002",
      name: "Molho Agridoce Extra Picante Fine Recipe 250ml",
      slug: "molho-agridoce-extra-picante-fine-recipe-250ml",
      categoryId: "cat_fine_recipe",
      shortDescription: "Intensidade aromática e ardência marcante para paladares arrojados.",
      fullDescription: "Para quem busca uma experiência picante inesquecível. O Extra Picante da Livio's Food traz um blend exclusivo de Habanero e pimenta cumari, equilibrado por uma base agridoce perfumada.",
      price: 32.90,
      promotionalPrice: 28.90,
      costPrice: 9.20,
      stock: 85,
      minStock: 15,
      weightKg: 0.45,
      volumeMl: 250,
      heatLevel: "Alta",
      ingredients: "Pimentas Habanero e Malagueta selecionadas, vinagre de maçã, açúcar, alho, condimentos naturais.",
      nutritionInfo: [
        { label: "Valor Energético", value: "30 kcal (15g)" },
        { label: "Carboidratos", value: "7.2g" }
      ],
      images: ["/header-bg.jpg"],
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      isOffer: true,
      rating: 5.0,
      reviewCount: 45,
      active: true
    },
    {
      id: "prod_3",
      sku: "LIV-FIN-003",
      name: "Molho Agridoce Chocolate Mega Picante 250ml",
      slug: "molho-agridoce-chocolate-mega-picante-250ml",
      categoryId: "cat_fine_recipe",
      shortDescription: "Fórmula disruptiva unindo cacau nobre 70% e pimentas de alta ardência.",
      fullDescription: "Uma revolução gastronômica! Inspirado nas tradicionais receitas de mole mexicano aperfeiçoadas com a técnica britânica, este molho mescla as notas aveludadas do cacau puro com uma intensidade ardente provocante.",
      price: 36.90,
      promotionalPrice: 32.90,
      costPrice: 11.00,
      stock: 0, // Produto esgotado para demonstrar Lista de Espera "Avise-me quando chegar"
      minStock: 10,
      weightKg: 0.45,
      volumeMl: 250,
      heatLevel: "Extrema",
      ingredients: "Cacau em pó 70%, extrato de pimenta Carolina Reaper, vinagre balsâmico, açúcar mascavo, especiarias secretas.",
      nutritionInfo: [
        { label: "Valor Energético", value: "38 kcal (15g)" }
      ],
      images: ["/header-bg.jpg"],
      isFeatured: true,
      isBestSeller: false,
      isNew: true,
      isOffer: true,
      rating: 4.8,
      reviewCount: 22,
      active: true
    }
  ],

  banners: [
    {
      id: "ban_1",
      title: "O SABOR QUE TRANSFORMA SEUS PRATOS",
      subtitle: "Molhos especiais agridoces desenvolvidos por mestres gastronômicos para elevar suas receitas a um patamar gourmet.",
      buttonText: "COMPRAR AGORA",
      buttonLink: "/produtos",
      secondaryButtonText: "CONHEÇA A LINHA FINE RECIPE",
      secondaryButtonLink: "/produtos?categoria=cat_fine_recipe",
      imageDesktop: "/header-bg.jpg",
      imageMobile: "/header-bg.jpg",
      active: true,
      order: 1
    }
  ],

  coupons: [
    {
      id: "coup_1",
      code: "BEMVINDO10",
      type: "percentage",
      value: 10,
      minPurchase: 50.00,
      usageLimit: 500,
      usedCount: 42,
      active: true,
      description: "10% de desconto na sua primeira compra!"
    },
    {
      id: "coup_2",
      code: "LIVIO10",
      type: "percentage",
      value: 10,
      minPurchase: 60.00,
      usageLimit: 1000,
      usedCount: 115,
      active: true,
      description: "10% OFF especial da campanha de Setembro!"
    }
  ],

  recipes: [],
  reviews: [],
  orders: [
    {
      id: "ORD-2024-8841",
      customerId: "usr_cust_1",
      customerName: "Ana Beatriz Oliveira",
      customerEmail: "ana.oliveira@gmail.com",
      customerPhone: "(31) 98765-4321",
      customerCpf: "123.456.789-00",
      shippingAddress: {
        recipient: "Ana Beatriz Oliveira",
        cep: "32370-000",
        street: "Av. João César de Oliveira",
        number: "1200",
        complement: "Apto 502",
        neighborhood: "Eldorado",
        city: "Contagem",
        state: "MG"
      },
      items: [
        {
          productId: "prod_1",
          name: "Molho Agridoce Fine Recipe Original 250ml",
          unitPrice: 26.90,
          quantity: 2,
          totalPrice: 53.80,
          image: "/header-bg.jpg"
        },
        {
          productId: "prod_2",
          name: "Molho Agridoce Extra Picante Fine Recipe 250ml",
          unitPrice: 28.90,
          quantity: 1,
          totalPrice: 28.90,
          image: "/header-bg.jpg"
        }
      ],
      subtotal: 82.70,
      discount: 8.27,
      couponCode: "BEMVINDO10",
      shippingFee: 18.90,
      total: 93.33,
      paymentMethod: "pix",
      paymentStatus: "approved",
      status: "delivered",
      statusHistory: [
        { status: "received", date: "2024-05-10T10:00:00Z", note: "Pedido efetuado" },
        { status: "delivered", date: "2024-05-12T14:30:00Z", note: "Entregue com sucesso" }
      ],
      createdAt: "2024-05-10T10:00:00Z"
    }
  ],

  inventoryMovements: [],
  gallery: [],

  campaigns: [],
  popups: [],
  promotionalBars: [],
  automations: [],
  marketingEvents: [],

  // ==========================================
  // RECURSOS AVANÇADOS (LISTA ESPERA, CRM, TIMELINE)
  // ==========================================

  // 1. LISTA DE ESPERA ("AVISE-ME QUANDO CHEGAR")
  waitlist: [
    {
      id: "wait_1",
      productId: "prod_3",
      productName: "Molho Agridoce Chocolate Mega Picante 250ml",
      productSku: "LIV-FIN-003",
      customerName: "Carlos Henrique Medeiros",
      customerEmail: "carlos.medeiros@gmail.com",
      customerPhone: "(31) 98711-2233",
      channels: ["email", "whatsapp"],
      status: "Aguardando", // 'Aguardando', 'Notificado', 'Comprou', 'Cancelado'
      quantity: 2,
      createdAt: "2024-08-28T14:20:00Z",
      notifiedAt: null
    }
  ],

  // 5. CRM — NOTAS INTERNAS DOS ADMINISTRADORES
  customerNotes: [
    {
      id: "cnote_1",
      customerId: "usr_cust_1",
      note: "Cliente é apreciadora de molhos com ardência média/alta e prefere ser contactada via WhatsApp.",
      author: "Rômulo Lívio Medeiros",
      createdAt: "2024-05-15T11:00:00Z"
    }
  ],

  // 5.7 TIMELINE E HISTÓRICO CRONOLÓGICO DE EVENTOS DO CLIENTE
  customerEvents: [
    {
      id: "cevent_1",
      customerId: "usr_cust_1",
      type: "order_created",
      title: "Realizou o Pedido #ORD-2024-8841",
      description: "Compos 2x Molho Original e 1x Extra Picante no valor total de R$ 93,33.",
      date: "2024-05-10T10:00:00Z"
    },
    {
      id: "cevent_2",
      customerId: "usr_cust_1",
      type: "coupon_used",
      title: "Utilizou o cupom BEMVINDO10",
      description: "Obteve R$ 8,27 de desconto no checkout.",
      date: "2024-05-10T10:01:00Z"
    },
    {
      id: "cevent_3",
      customerId: "usr_cust_1",
      type: "campaign_opened",
      title: "Abriu a campanha Festival do Sabor",
      description: "Visualizou a mensagem via WhatsApp oficial.",
      date: "2024-09-01T09:15:00Z"
    }
  ],

  // 5.4 SEGMENTOS DE CRM CONFIGURADOS
  customerSegments: [
    {
      id: "seg_vip",
      name: "Clientes VIP (Gasto > R$ 200)",
      description: "Clientes com alto valor acumulado em compras no e-commerce.",
      rules: { minSpent: 200, minOrders: 1 },
      memberCount: 127
    },
    {
      id: "seg_recurrent",
      name: "Clientes Recorrentes",
      description: "Clientes que realizaram 2 ou mais compras.",
      rules: { minOrders: 2 },
      memberCount: 84
    },
    {
      id: "seg_inactive_60",
      name: "Clientes Inativos (60+ dias)",
      description: "Clientes sem realizar compras nos últimos 60 dias.",
      rules: { inactiveDays: 60 },
      memberCount: 42
    }
  ]
};

let store = null;

export function getDb() {
  if (!store) {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        store = JSON.parse(raw);
        if (!store.waitlist) store.waitlist = initialData.waitlist;
        if (!store.customerNotes) store.customerNotes = initialData.customerNotes;
        if (!store.customerEvents) store.customerEvents = initialData.customerEvents;
        if (!store.customerSegments) store.customerSegments = initialData.customerSegments;
      } catch (err) {
        console.error("Erro ao carregar data_store.json, recriando...", err);
        store = JSON.parse(JSON.stringify(initialData));
        saveDb();
      }
    } else {
      store = JSON.parse(JSON.stringify(initialData));
      saveDb();
    }
  }
  return store;
}

export function saveDb() {
  if (store) {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  }
}
