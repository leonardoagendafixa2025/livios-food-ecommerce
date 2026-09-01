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
      costPrice: 0.00,
      stock: 0,
      minStock: 10,
      weightKg: 0.45,
      volumeMl: 250,
      heatLevel: "Média",
      ingredients: "Pimentas vermelhas selecionadas, açúcar de cana, vinagre de maçã, alho fresco, sal marinho, espessante natural goma xantana e especiarias finas.",
      nutritionInfo: [
        { label: "Valor Energético", value: "32 kcal (por colher de sopa - 15g)" },
        { label: "Carboidratos", value: "7.8g" },
        { label: "Sódio", value: "85mg" }
      ],
      images: ["/header-bg.jpg"],
      isFeatured: true,
      isBestSeller: false,
      isNew: false,
      isOffer: true,
      rating: 0,
      reviewCount: 0,
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
      costPrice: 0.00,
      stock: 0,
      minStock: 10,
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
      isBestSeller: false,
      isNew: false,
      isOffer: true,
      rating: 0,
      reviewCount: 0,
      active: false
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
      costPrice: 0.00,
      stock: 0,
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
      rating: 0,
      reviewCount: 0,
      active: false
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
      usedCount: 0,
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
      usedCount: 0,
      active: true,
      description: "10% OFF especial da campanha de Setembro!"
    }
  ],

  recipes: [],
  reviews: [],
  orders: [],

  inventoryMovements: [],
  gallery: [],

  campaigns: [],
  popups: [],
  promotionalBars: [],
  automations: [],
  marketingEvents: [],

  // RECURSOS (LISTA ESPERA, CRM, TIMELINE)
  waitlist: [],
  customerNotes: [],
  customerEvents: [],

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
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
    } catch (err) {
      console.warn("⚠️ Aviso: Sistema de arquivos em somente-leitura (Vercel Serverless). Para salvamento definitivo em produção, ative o Supabase.", err.message);
    }
  }
}
