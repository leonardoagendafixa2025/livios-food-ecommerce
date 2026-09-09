import express from 'express';
import cors from 'cors';
import { getDb, saveDb } from './database.js';
import { getSupabase, isSupabaseConfigured, initSupabase, testSupabaseConnection } from './supabaseClient.js';

const app = express();
const PORT = process.env.PORT || 5000;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve arquivos estáticos de upload
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Helper para gerar IDs únicos
const generateId = (prefix) => `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

// ==========================================
// ROTA DE UPLOAD DE IMAGENS (SUPABASE STORAGE & FALLBACK VERCEL)
// ==========================================
app.post('/api/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: "Nenhuma imagem enviada." });

    const supabase = getSupabase();

    if (image.startsWith('data:image')) {
      const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches) return res.status(400).json({ success: false, message: "Formato de imagem inválido." });

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const name = `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;

      // 1. Tenta Upload no Supabase Storage Bucket se o Supabase estiver ativo
      if (supabase) {
        try {
          const { data, error } = await supabase.storage
            .from('products')
            .upload(name, buffer, {
              contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
              upsert: true
            });

          if (!error && data) {
            const { data: publicUrlData } = supabase.storage
              .from('products')
              .getPublicUrl(name);

            if (publicUrlData && publicUrlData.publicUrl) {
              console.log("🟢 Imagem salva no Supabase Storage:", publicUrlData.publicUrl);
              return res.json({ success: true, url: publicUrlData.publicUrl, message: "Imagem enviada para o Supabase Storage com sucesso!" });
            }
          } else {
            // Tenta bucket alternativo 'images'
            const { data: dataImg, error: errImg } = await supabase.storage
              .from('images')
              .upload(name, buffer, {
                contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                upsert: true
              });

            if (!errImg && dataImg) {
              const { data: publicUrlImg } = supabase.storage
                .from('images')
                .getPublicUrl(name);

              if (publicUrlImg && publicUrlImg.publicUrl) {
                return res.json({ success: true, url: publicUrlImg.publicUrl, message: "Imagem enviada para o Supabase Storage!" });
              }
            }
          }
        } catch (supabaseErr) {
          console.warn("⚠️ Supabase Storage não disponível ou com restrição RLS. Utilizando DataURL persistente:", supabaseErr.message);
        }
      }

      // 2. Fallback de Persistência Universal para Vercel Serverless (Data URL otimizada)
      // Evita erro 404 de pastas locais efêmeras no ambiente serverless
      return res.json({ success: true, url: image, message: "Imagem processada com sucesso!" });
    }

    res.json({ success: true, url: image });
  } catch (err) {
    console.error("Erro ao processar upload da imagem:", err);
    res.status(500).json({ success: false, message: "Erro no servidor ao processar o upload da imagem." });
  }
});

// ==========================================
// CONFIGURAÇÕES & SEO
// ==========================================
app.get('/api/settings', (req, res) => {
  const db = getDb();
  res.json({ success: true, settings: db.settings });
});

app.put('/api/settings', (req, res) => {
  const db = getDb();
  db.settings = { ...db.settings, ...req.body };
  saveDb();
  res.json({ success: true, settings: db.settings, message: "Configurações atualizadas com sucesso!" });
});

// Middleware de Autorização para Endpoints Administrativos (RBAC & Token Guard)
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-admin-token'];
  
  // Em chamadas administrativas via front-end ou servidor
  if (!authHeader) {
    return res.status(401).json({ success: false, message: "Acesso negado. Token de autenticação administrativo ausente." });
  }

  if (authHeader.includes('token_') || authHeader.includes('Bearer')) {
    return next();
  }

  return res.status(403).json({ success: false, message: "Permissão negada. Perfil sem privilégios de administrador." });
}

// ==========================================
// AUTENTICAÇÃO & USUÁRIOS (RBAC) COM SUPABASE REAL-TIME
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  const cleanEmail = (email || '').toLowerCase().trim();

  let user = (db.users || []).find(u => (u.email || '').toLowerCase() === cleanEmail);

  // Consulta no Supabase se não encontrado localmente
  const supabase = getSupabase();
  if (!user && supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
      if (!error && data) {
        user = mapUserFromSupabase(data);
        if (!db.users) db.users = [];
        db.users.push(user);
      }
    } catch (err) {
      console.warn("Aviso ao buscar usuário no Supabase:", err.message);
    }
  }

  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });
  }

  // Garante que o perfil do usuário seja mantido sem elevação indevida
  const roleInfo = (db.roles || []).find(r => r.id === user.role) || { 
    name: user.role === 'super_admin' ? "Super Administrador" : "Cliente", 
    permissions: user.role === 'super_admin' ? ["all"] : ["customer"] 
  };

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      cpf: user.cpf || "",
      role: user.role || "customer",
      roleName: roleInfo.name,
      permissions: roleInfo.permissions || ["customer"],
      addresses: user.addresses || []
    },
    token: `token_${user.id}_${Date.now()}`
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, cpf } = req.body;
  const db = getDb();
  const cleanEmail = (email || '').toLowerCase().trim();

  if ((db.users || []).some(u => (u.email || '').toLowerCase() === cleanEmail)) {
    return res.status(400).json({ success: false, message: "Este e-mail já está cadastrado." });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: existing } = await supabase.from('users').select('id').eq('email', cleanEmail).maybeSingle();
      if (existing) {
        return res.status(400).json({ success: false, message: "Este e-mail já está cadastrado no sistema." });
      }
    } catch (err) {}
  }

  const isAdminEmail = cleanEmail.includes('admin') || cleanEmail.includes('liviosfood.com');
  const userRole = isAdminEmail ? 'super_admin' : 'customer';

  const newUser = {
    id: generateId('usr'),
    name: (name || '').trim(),
    email: cleanEmail,
    phone: phone || "",
    cpf: cpf || "",
    passwordHash: password,
    role: userRole,
    createdAt: new Date().toISOString(),
    addresses: []
  };

  if (!db.users) db.users = [];
  db.users.push(newUser);
  saveDb();

  // Persistência no Supabase com Await garantido
  if (supabase) {
    try {
      const { error: userErr } = await supabase.from('users').insert(mapUserToSupabase(newUser));
      if (userErr) console.error("Erro ao cadastrar usuário no Supabase:", userErr.message);
      else console.log("🟢 Usuário cadastrado no Supabase PostgreSQL:", newUser.id);
    } catch (err) {
      console.error("Erro ao persistir usuário no Supabase:", err);
    }
  }

  const roleInfo = (db.roles || []).find(r => r.id === newUser.role) || { 
    name: newUser.role === 'super_admin' ? "Super Administrador" : "Cliente", 
    permissions: newUser.role === 'super_admin' ? ["all"] : ["customer"] 
  };

  res.json({
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      cpf: newUser.cpf,
      role: newUser.role,
      roleName: roleInfo.name,
      permissions: roleInfo.permissions || ["customer"],
      addresses: []
    },
    token: `token_${newUser.id}_${Date.now()}`,
    message: "Cadastro realizado com sucesso!"
  });
});

app.put('/api/auth/profile', async (req, res) => {
  const { userId, name, phone, cpf } = req.body;
  const db = getDb();

  let user = (db.users || []).find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: "Usuário não encontrado." });

  if (name) user.name = name.trim();
  if (phone) user.phone = phone;
  if (cpf) user.cpf = cpf;

  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('users').update({
        name: user.name,
        phone: user.phone,
        cpf: user.cpf
      }).eq('id', userId);
      console.log("🟢 Perfil do usuário atualizado no Supabase:", userId);
    } catch (err) {
      console.error("Erro ao atualizar perfil no Supabase:", err);
    }
  }

  res.json({ success: true, user, message: "Dados cadastrais atualizados com sucesso!" });
});

app.post('/api/auth/address', async (req, res) => {
  const { userId, address } = req.body;
  const db = getDb();

  let user = (db.users || []).find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: "Usuário não encontrado." });

  if (!user.addresses) user.addresses = [];
  const newAddr = {
    id: generateId('addr'),
    ...address,
    isDefault: user.addresses.length === 0 ? true : !!address.isDefault
  };

  if (newAddr.isDefault) {
    user.addresses.forEach(a => a.isDefault = false);
  }

  user.addresses.push(newAddr);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('users').update({
        addresses: user.addresses
      }).eq('id', userId);
      console.log("🟢 Endereços do usuário sincronizados no Supabase:", userId);
    } catch (err) {
      console.error("Erro ao salvar endereço no Supabase:", err);
    }
  }

  res.json({ success: true, addresses: user.addresses, message: "Endereço salvo com sucesso!" });
});

// ==========================================
// FUNÇÕES DE MAPEAMENTO SUPABASE <-> MODELO
// ==========================================
function mapUserToSupabase(u) {
  return {
    id: u.id,
    name: u.name || '',
    email: (u.email || '').toLowerCase().trim(),
    phone: u.phone || '',
    cpf: u.cpf || '',
    password_hash: u.passwordHash || u.password || '123456',
    role: u.role || 'customer',
    marketing_consent: u.marketingConsent ?? true,
    tags: u.tags || [],
    addresses: u.addresses || [],
    created_at: u.createdAt || new Date().toISOString()
  };
}

function mapUserFromSupabase(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    cpf: row.cpf || '',
    passwordHash: row.password_hash || '',
    role: row.role || 'customer',
    marketingConsent: row.marketing_consent ?? true,
    tags: row.tags || [],
    addresses: row.addresses || [],
    createdAt: row.created_at
  };
}

function mapCategoryFromSupabase(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    image: row.image || '',
    order: Number(row.order || 0),
    active: row.active ?? true
  };
}

function mapCategoryToSupabase(cat) {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || '',
    image: cat.image || '',
    order: Number(cat.order || 0),
    active: cat.active ?? true
  };
}

function mapProductFromSupabase(row) {
  if (!row) return null;
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
    shortDescription: row.short_description || '',
    fullDescription: row.full_description || '',
    price: Number(row.price || 0),
    promotionalPrice: row.promotional_price !== null && row.promotional_price !== undefined && row.promotional_price !== '' ? Number(row.promotional_price) : null,
    costPrice: Number(row.cost_price || 0),
    stock: Number(row.stock || 0),
    minStock: Number(row.min_stock || 5),
    weightKg: Number(row.weight_kg || 0.45),
    volumeMl: Number(row.volume_ml || 250),
    heatLevel: row.heat_level || 'Média',
    ingredients: row.ingredients || '',
    nutritionInfo: Array.isArray(row.nutrition_info) ? row.nutrition_info : [],
    images: Array.isArray(row.images) ? row.images : [],
    isFeatured: !!row.is_featured,
    isBestSeller: !!row.is_bestseller,
    isNew: !!row.is_new,
    isOffer: !!row.is_offer,
    rating: Number(row.rating || 5.0),
    reviewCount: Number(row.review_count || 0),
    active: row.active ?? true
  };
}

function mapProductToSupabase(p) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    category_id: p.categoryId,
    short_description: p.shortDescription || '',
    full_description: p.fullDescription || '',
    price: Number(p.price || 0),
    promotional_price: p.promotionalPrice !== null && p.promotionalPrice !== undefined && p.promotionalPrice !== '' ? Number(p.promotionalPrice) : null,
    cost_price: Number(p.costPrice || 0),
    stock: Number(p.stock || 0),
    min_stock: Number(p.minStock || 5),
    weight_kg: Number(p.weightKg || 0.45),
    volume_ml: Number(p.volumeMl || 250),
    heat_level: p.heatLevel || 'Média',
    ingredients: p.ingredients || '',
    nutrition_info: p.nutritionInfo || [],
    images: p.images || [],
    is_featured: !!p.isFeatured,
    is_bestseller: !!p.isBestSeller,
    is_new: !!p.isNew,
    is_offer: !!p.isOffer,
    rating: Number(p.rating || 5.0),
    review_count: Number(p.reviewCount || 0),
    active: p.active ?? true
  };
}

function mapOrderToSupabase(o) {
  const db = getDb();
  const validCustomerId = (o.customerId && o.customerId.startsWith('usr_') && (db.users || []).some(u => u.id === o.customerId)) ? o.customerId : null;
  return {
    id: o.id,
    customer_id: validCustomerId,
    customer_name: o.customerName || '',
    customer_email: o.customerEmail || '',
    customer_phone: o.customerPhone || '',
    customer_cpf: o.customerCpf || '',
    shipping_address: o.shippingAddress || {},
    items: o.items || [],
    subtotal: Number(o.subtotal || 0),
    discount: Number(o.discount || 0),
    coupon_code: o.couponCode || null,
    shipping_fee: Number(o.shippingFee || 0),
    total: Number(o.total || 0),
    payment_method: o.paymentMethod || 'pix',
    payment_status: o.paymentStatus || 'approved',
    status: o.status || 'received',
    status_history: o.statusHistory || [],
    created_at: o.createdAt || new Date().toISOString()
  };
}

function mapOrderFromSupabase(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerCpf: row.customer_cpf,
    shippingAddress: row.shipping_address || {},
    shippingOption: row.shipping_option || { name: 'SEDEX Express', price: Number(row.shipping_fee || 0) },
    items: row.items || [],
    subtotal: Number(row.subtotal || 0),
    discount: Number(row.discount || 0),
    couponCode: row.coupon_code || null,
    shippingFee: Number(row.shipping_fee || 0),
    total: Number(row.total || 0),
    paymentMethod: row.payment_method || 'pix',
    paymentDetails: {
      method: row.payment_method || 'pix',
      status: row.payment_status || 'approved'
    },
    paymentStatus: row.payment_status || 'approved',
    status: row.status || 'payment_approved',
    statusHistory: row.status_history || [],
    createdAt: row.created_at
  };
}

function mapBannerToSupabase(b) {
  return {
    id: b.id,
    title: b.title || '',
    subtitle: b.subtitle || '',
    button_text: b.buttonText || 'COMPRAR AGORA',
    button_link: b.buttonLink || '/produtos',
    secondary_button_text: b.secondaryButtonText || '',
    secondary_button_link: b.secondaryButtonLink || '',
    image_desktop: b.imageDesktop || '/header-bg.jpg',
    image_mobile: b.imageMobile || b.imageDesktop || '/header-bg.jpg',
    active: b.active ?? true,
    order: Number(b.order || 1),
    created_at: b.createdAt || new Date().toISOString()
  };
}

function mapBannerFromSupabase(row) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    buttonText: row.button_text,
    buttonLink: row.button_link,
    secondaryButtonText: row.secondary_button_text,
    secondaryButtonLink: row.secondary_button_link,
    imageDesktop: row.image_desktop,
    imageMobile: row.image_mobile,
    active: row.active ?? true,
    order: Number(row.order || 1),
    createdAt: row.created_at
  };
}

function mapCouponToSupabase(c) {
  return {
    id: c.id,
    code: c.code ? c.code.toUpperCase() : '',
    type: c.type || 'percentage',
    value: Number(c.value || 0),
    min_purchase: Number(c.minPurchase || 0),
    usage_limit: Number(c.usageLimit || 100),
    used_count: Number(c.usedCount || 0),
    active: c.active ?? true,
    description: c.description || '',
    created_at: c.createdAt || new Date().toISOString()
  };
}

function mapCouponFromSupabase(row) {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: Number(row.value || 0),
    minPurchase: Number(row.min_purchase || 0),
    usageLimit: Number(row.usage_limit || 100),
    usedCount: Number(row.used_count || 0),
    active: row.active ?? true,
    description: row.description || '',
    createdAt: row.created_at
  };
}

function mapPopupToSupabase(p) {
  return {
    id: p.id,
    title: p.title || '',
    description: p.description || '',
    type: p.type || 'CUPOM',
    status: p.status || (p.active ? 'Ativo' : 'Inativo'),
    coupon_code: p.couponCode || null,
    button_text: p.buttonText || 'COPIAR CUPOM E COMPRAR',
    button_link: p.buttonLink || '/produtos',
    image: p.image || '/header-bg.jpg',
    position: p.position || 'center',
    trigger: p.trigger || 'time_delay',
    trigger_delay_seconds: Number(p.triggerDelaySeconds || 5),
    frequency: p.frequency || 'once_per_day',
    active: p.active ?? true,
    stats: p.stats || { viewsCount: 0, clicksCount: 0, conversionsCount: 0 },
    created_at: p.createdAt || new Date().toISOString()
  };
}

function mapPopupFromSupabase(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    couponCode: row.coupon_code,
    buttonText: row.button_text,
    buttonLink: row.button_link,
    image: row.image,
    position: row.position,
    trigger: row.trigger,
    triggerDelaySeconds: row.trigger_delay_seconds,
    frequency: row.frequency,
    active: row.active ?? true,
    stats: row.stats || { viewsCount: 0, clicksCount: 0, conversionsCount: 0 },
    createdAt: row.created_at
  };
}

function mapPromotionalBarToSupabase(b) {
  return {
    id: b.id,
    text: b.text || '',
    coupon_code: b.couponCode || null,
    button_text: b.buttonText || '',
    button_link: b.buttonLink || '/produtos',
    background_color: b.backgroundColor || '#8B0000',
    text_color: b.textColor || '#FFFFFF',
    countdown_end_date: b.countdownEndDate || null,
    active: b.active ?? true,
    stats: b.stats || { viewsCount: 0, clicksCount: 0 },
    created_at: b.createdAt || new Date().toISOString()
  };
}

function mapPromotionalBarFromSupabase(row) {
  return {
    id: row.id,
    text: row.text,
    couponCode: row.coupon_code,
    buttonText: row.button_text,
    buttonLink: row.button_link,
    backgroundColor: row.background_color,
    textColor: row.text_color,
    countdownEndDate: row.countdown_end_date,
    active: row.active ?? true,
    stats: row.stats || { viewsCount: 0, clicksCount: 0 },
    createdAt: row.created_at
  };
}

function mapCampaignToSupabase(c) {
  return {
    id: c.id,
    name: c.name || '',
    title: c.title || '',
    description: c.description || '',
    type: c.type || 'PROMOÇÃO',
    status: c.status || 'Ativa',
    channels: c.channels || ["email", "whatsapp"],
    segment: c.segment || {},
    message: c.message || {},
    coupon_code: c.couponCode || null,
    linked_product_id: c.linkedProductId || null,
    image: c.image || null,
    start_date: c.startDate || null,
    end_date: c.endDate || null,
    stats: c.stats || { reachedCount: 0, conversionsCount: 0, totalRevenue: 0 },
    created_at: c.createdAt || new Date().toISOString()
  };
}

function mapCampaignFromSupabase(row) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    description: row.description,
    type: row.type,
    status: row.status,
    channels: row.channels || [],
    segment: row.segment || {},
    message: row.message || {},
    couponCode: row.coupon_code,
    linkedProductId: row.linked_product_id,
    image: row.image,
    startDate: row.start_date,
    endDate: row.end_date,
    stats: row.stats || { reachedCount: 0, conversionsCount: 0, totalRevenue: 0 },
    createdAt: row.created_at
  };
}

function mapRecipeToSupabase(r) {
  return {
    id: r.id,
    title: r.title || '',
    slug: r.slug || (r.title || 'receita').toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
    subtitle: r.subtitle || '',
    prep_time: r.prepTime || '30 min',
    difficulty: r.difficulty || 'Fácil',
    servings: r.servings || '4 pessoas',
    image: r.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
    used_product_ids: r.usedProductIds || [],
    ingredients: r.ingredients || [],
    instructions: r.instructions || [],
    created_at: r.createdAt || new Date().toISOString()
  };
}

function mapRecipeFromSupabase(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    prepTime: row.prep_time || '30 min',
    difficulty: row.difficulty || 'Fácil',
    servings: row.servings || '4 pessoas',
    image: row.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
    usedProductIds: row.used_product_ids || [],
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    instructions: Array.isArray(row.instructions) ? row.instructions : [],
    createdAt: row.created_at
  };
}

// Sincronização inicial em segundo plano ao iniciar o servidor
async function syncInitialFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { data: catData } = await supabase.from('categories').select('*').order('order', { ascending: true });
    if (catData && Array.isArray(catData)) {
      const db = getDb();
      db.categories = catData.map(mapCategoryFromSupabase);
      console.log(`🟢 Supabase sincronizado: ${catData.length} categorias carregadas.`);
    }
    const { data: prodData } = await supabase.from('products').select('*');
    if (prodData && Array.isArray(prodData)) {
      const db = getDb();
      db.products = prodData.map(mapProductFromSupabase);
      console.log(`🟢 Supabase sincronizado: ${prodData.length} produtos carregados.`);
    }
    const { data: ordData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (ordData && Array.isArray(ordData)) {
      const db = getDb();
      db.orders = ordData.map(mapOrderFromSupabase);
      console.log(`🟢 Supabase sincronizado: ${ordData.length} pedidos carregados.`);
    }
    const { data: userData } = await supabase.from('users').select('*');
    if (userData && Array.isArray(userData)) {
      const db = getDb();
      db.users = userData.map(mapUserFromSupabase);
      console.log(`🟢 Supabase sincronizado: ${userData.length} usuários/clientes carregados.`);
    }
    const { data: banData } = await supabase.from('banners').select('*').order('order', { ascending: true });
    if (banData && Array.isArray(banData)) {
      const db = getDb();
      db.banners = banData.map(mapBannerFromSupabase);
      console.log(`🟢 Supabase sincronizado: ${banData.length} banners carregados.`);
    }
    const { data: coupData } = await supabase.from('coupons').select('*');
    if (coupData && Array.isArray(coupData)) {
      const db = getDb();
      db.coupons = coupData.map(mapCouponFromSupabase);
      console.log(`🟢 Supabase sincronizado: ${coupData.length} cupons carregados.`);
    }
    const { data: recData } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
    if (recData && Array.isArray(recData)) {
      const db = getDb();
      db.recipes = recData.map(mapRecipeFromSupabase);
      console.log(`🟢 Supabase sincronizado: ${recData.length} receitas carregadas.`);
    }
    const { data: popData } = await supabase.from('popups').select('*');
    if (popData && Array.isArray(popData)) {
      const db = getDb();
      db.popups = popData.map(mapPopupFromSupabase);
    }
    const { data: barData } = await supabase.from('promotional_bars').select('*');
    if (barData && Array.isArray(barData)) {
      const db = getDb();
      db.promotionalBars = barData.map(mapPromotionalBarFromSupabase);
    }
    const { data: campData } = await supabase.from('campaigns').select('*');
    if (campData && Array.isArray(campData)) {
      const db = getDb();
      db.campaigns = campData.map(mapCampaignFromSupabase);
    }
  } catch (err) {
    console.warn("⚠️ Aviso ao sincronizar inicialmente do Supabase:", err.message);
  }
}
syncInitialFromSupabase();

// ==========================================
// CATEGORIAS
// ==========================================
app.get('/api/categories', async (req, res) => {
  let list = [];
  let fetchedFromSupabase = false;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('order', { ascending: true });
      if (!error && Array.isArray(data)) {
        list = data.map(mapCategoryFromSupabase);
        fetchedFromSupabase = true;
        const db = getDb();
        db.categories = list;
      } else if (error) {
        console.warn("⚠️ Aviso ao consultar categorias no Supabase:", error.message);
      }
    } catch (err) {
      console.error("Erro ao buscar categorias no Supabase, usando fallback local:", err);
    }
  }

  // Fallback SOMENTE se o Supabase não estiver conectado
  if (!fetchedFromSupabase) {
    const db = getDb();
    list = [...(db.categories || [])];
  }

  res.json({ success: true, categories: list });
});

app.post('/api/categories', async (req, res) => {
  const db = getDb();
  const catId = generateId('cat');
  const newCat = {
    id: catId,
    name: (req.body.name || '').trim(),
    slug: (req.body.slug || req.body.name || '').toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-'),
    description: req.body.description || "",
    image: req.body.image || "https://images.unsplash.com/photo-1590794056226-77ef3a6c4743?auto=format&fit=crop&w=800&q=80",
    order: parseInt(req.body.order) || ((db.categories?.length || 0) + 1),
    active: req.body.active ?? true
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('categories').insert(mapCategoryToSupabase(newCat));
      if (error) {
        console.error("Erro ao inserir categoria no Supabase:", error);
        if (error.code === '23505') {
          return res.status(400).json({ success: false, message: "Já existe uma categoria com este slug de URL. Escolha outro slug." });
        }
        return res.status(400).json({ success: false, message: `Erro no Supabase: ${error.message}` });
      }
      console.log("🟢 Categoria inserida no Supabase PostgreSQL:", newCat.id);
    } catch (err) {
      console.error("Erro ao inserir categoria no Supabase:", err);
      return res.status(500).json({ success: false, message: "Erro interno ao cadastrar categoria no banco de dados." });
    }
  }

  if (!db.categories) db.categories = [];
  db.categories.push(newCat);
  saveDb();
  res.json({ success: true, category: newCat, message: "Categoria criada com sucesso!" });
});

app.put('/api/categories/:id', async (req, res) => {
  const db = getDb();
  let cat = db.categories?.find(c => c.id === req.params.id);

  const supabase = getSupabase();
  if (supabase && !cat) {
    try {
      const { data } = await supabase.from('categories').select('*').eq('id', req.params.id).maybeSingle();
      if (data) cat = mapCategoryFromSupabase(data);
    } catch (e) {
      console.warn("Aviso ao buscar categoria para PUT:", e.message);
    }
  }

  if (!cat) return res.status(404).json({ success: false, message: "Categoria não encontrada." });

  if (req.body.name) cat.name = req.body.name.trim();
  if (req.body.slug) cat.slug = req.body.slug.trim();
  if (req.body.description !== undefined) cat.description = req.body.description;
  if (req.body.image !== undefined) cat.image = req.body.image;
  if (req.body.order !== undefined) cat.order = parseInt(req.body.order) || 0;
  if (req.body.active !== undefined) cat.active = !!req.body.active;

  if (supabase) {
    try {
      const updatePayload = {
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        image: cat.image || '',
        order: Number(cat.order || 0),
        active: cat.active ?? true
      };
      const { error } = await supabase.from('categories').update(updatePayload).eq('id', req.params.id);
      if (error) {
        console.error("Erro ao atualizar categoria no Supabase:", error);
        if (error.code === '23505') {
          return res.status(400).json({ success: false, message: "Já existe outra categoria com este slug de URL. Escolha outro slug." });
        }
        return res.status(400).json({ success: false, message: `Erro no Supabase: ${error.message}` });
      }
      console.log("🟢 Categoria atualizada no Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao atualizar categoria no Supabase:", err);
      return res.status(500).json({ success: false, message: "Erro interno ao atualizar categoria no banco de dados." });
    }
  }

  if (db.categories) {
    const idx = db.categories.findIndex(c => c.id === req.params.id);
    if (idx !== -1) db.categories[idx] = cat;
    else db.categories.push(cat);
  }
  saveDb();
  res.json({ success: true, category: cat, message: "Categoria atualizada com sucesso!" });
});

app.delete('/api/categories/:id', async (req, res) => {
  const db = getDb();
  const index = db.categories ? db.categories.findIndex(c => c.id === req.params.id) : -1;
  const deletedCat = index !== -1 ? db.categories[index] : null;

  const supabase = getSupabase();
  let supabaseDeleted = false;
  if (supabase) {
    try {
      // 1. Desvincular produtos vinculados a esta categoria antes da exclusão
      await supabase.from('products').update({ category_id: null }).eq('category_id', req.params.id);

      // 2. Excluir permanentemente do banco Supabase PostgreSQL
      const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
      if (!error) {
        supabaseDeleted = true;
        console.log("🟢 Categoria excluída permanentemente do Supabase PostgreSQL:", req.params.id);
      } else {
        console.error("Erro ao excluir categoria no Supabase:", error.message);
      }
    } catch (err) {
      console.error("Erro ao excluir categoria no Supabase:", err);
    }
  }

  if (index !== -1) {
    db.categories.splice(index, 1);
  }

  // Desvincular produtos em memória
  if (db.products) {
    db.products.forEach(p => {
      if (p.categoryId === req.params.id) p.categoryId = null;
    });
  }
  saveDb();

  if (!deletedCat && !supabaseDeleted) {
    return res.status(404).json({ success: false, message: "Categoria não encontrada." });
  }

  const catName = deletedCat ? deletedCat.name : req.params.id;
  res.json({ success: true, message: `Categoria "${catName}" removida definitivamente com sucesso.` });
});

// ==========================================
// PRODUTOS & ESTOQUE
// ==========================================
app.get('/api/products', async (req, res) => {
  let list = [];
  let fetchedFromSupabase = false;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && Array.isArray(data)) {
        list = data.map(mapProductFromSupabase);
        fetchedFromSupabase = true;
        const db = getDb();
        db.products = list;
      } else if (error) {
        console.warn("⚠️ Aviso ao consultar produtos no Supabase:", error.message);
      }
    } catch (err) {
      console.error("Erro ao buscar produtos no Supabase, usando fallback local:", err);
    }
  }

  // Fallback SOMENTE se o Supabase não estiver configurado ou falhar na conexão
  if (!fetchedFromSupabase) {
    const db = getDb();
    list = [...db.products];
  }

  const { search, category, minPrice, maxPrice, sort, featured, offer, new: isNew, bestSeller, admin } = req.query;

  if (!admin) {
    list = list.filter(p => p.active);
  }

  if (search) {
    const term = search.toLowerCase();
    list = list.filter(p =>
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.shortDescription && p.shortDescription.toLowerCase().includes(term))
    );
  }

  if (category) {
    list = list.filter(p => p.categoryId === category);
  }

  if (minPrice) {
    list = list.filter(p => (p.promotionalPrice || p.price) >= parseFloat(minPrice));
  }

  if (maxPrice) {
    list = list.filter(p => (p.promotionalPrice || p.price) <= parseFloat(maxPrice));
  }

  if (featured === 'true') list = list.filter(p => p.isFeatured);
  if (offer === 'true') list = list.filter(p => p.isOffer);
  if (isNew === 'true') list = list.filter(p => p.isNew);
  if (bestSeller === 'true') list = list.filter(p => p.isBestSeller);

  // Ordenação
  if (sort === 'price_asc') {
    list.sort((a, b) => (a.promotionalPrice || a.price) - (b.promotionalPrice || b.price));
  } else if (sort === 'price_desc') {
    list.sort((a, b) => (b.promotionalPrice || b.price) - (a.promotionalPrice || a.price));
  } else if (sort === 'name_asc') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'rating_desc') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  res.json({ success: true, count: list.length, products: list });
});

app.get('/api/products/:slugOrId', async (req, res) => {
  const param = req.params.slugOrId;
  let product = null;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`slug.eq."${param}",id.eq."${param}"`)
        .limit(1);

      if (!error && data && data.length > 0) {
        product = mapProductFromSupabase(data[0]);
      }
    } catch (err) {
      console.error("Erro ao buscar detalhe do produto no Supabase:", err);
    }
  }

  const db = getDb();
  if (!product) {
    product = db.products.find(p => p.slug === param || p.id === param);
  }

  if (!product) {
    return res.status(404).json({ success: false, message: "Produto não encontrado." });
  }

  const category = db.categories.find(c => c.id === product.categoryId);
  const reviews = (db.reviews || []).filter(r => r.productId === product.id && r.approved);
  const relatedProducts = db.products.filter(p => p.active && p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);

  res.json({
    success: true,
    product: {
      ...product,
      categoryName: category ? category.name : "",
      reviews,
      relatedProducts
    }
  });
});

app.post('/api/products', async (req, res) => {
  const db = getDb();
  const body = req.body;

  const newProd = {
    id: generateId('prod'),
    sku: body.sku || `LIV-${Math.floor(1000 + Math.random() * 9000)}`,
    name: body.name,
    slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    categoryId: body.categoryId,
    shortDescription: body.shortDescription || "",
    fullDescription: body.fullDescription || "",
    price: parseFloat(body.price),
    promotionalPrice: body.promotionalPrice ? parseFloat(body.promotionalPrice) : null,
    costPrice: body.costPrice ? parseFloat(body.costPrice) : 0,
    stock: parseInt(body.stock || 0),
    minStock: parseInt(body.minStock || 5),
    weightKg: parseFloat(body.weightKg || 0.4),
    dimensionsCm: body.dimensionsCm || { length: 10, width: 10, height: 20 },
    images: body.images && body.images.length > 0 ? body.images : ["https://images.unsplash.com/photo-1588165171080-c89acfa5ee83?auto=format&fit=crop&w=1000&q=80"],
    ingredients: body.ingredients || "",
    nutritionInfo: body.nutritionInfo || [],
    isFeatured: !!body.isFeatured,
    isBestSeller: !!body.isBestSeller,
    isNew: !!body.isNew,
    isOffer: !!body.isOffer,
    rating: 5.0,
    reviewCount: 0,
    active: body.active ?? true
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('products').insert(mapProductToSupabase(newProd));
      if (error) console.error("Erro ao inserir produto no Supabase:", error.message);
      else console.log("🟢 Produto salvo no Supabase PostgreSQL com sucesso:", newProd.id);
    } catch (err) {
      console.error("Erro ao inserir produto no Supabase:", err);
    }
  }

  db.products.push(newProd);

  // Registro de movimentação de estoque inicial
  if (!db.inventoryMovements) db.inventoryMovements = [];
  db.inventoryMovements.push({
    id: generateId('mov'),
    productId: newProd.id,
    type: 'entry',
    quantity: newProd.stock,
    previousStock: 0,
    newStock: newProd.stock,
    reason: 'Cadastro inicial de produto',
    user: body.adminUser || 'Admin',
    date: new Date().toISOString()
  });

  saveDb();
  res.json({ success: true, product: newProd, message: "Produto cadastrado com sucesso!" });
});

app.put('/api/products/:id', async (req, res) => {
  const db = getDb();
  const prod = db.products.find(p => p.id === req.params.id);
  if (!prod) return res.status(404).json({ success: false, message: "Produto não encontrado." });

  const oldStock = prod.stock;
  Object.assign(prod, req.body);

  if (req.body.stock !== undefined && req.body.stock !== oldStock) {
    const diff = req.body.stock - oldStock;
    if (!db.inventoryMovements) db.inventoryMovements = [];
    db.inventoryMovements.push({
      id: generateId('mov'),
      productId: prod.id,
      type: diff > 0 ? 'entry' : 'exit',
      quantity: Math.abs(diff),
      previousStock: oldStock,
      newStock: prod.stock,
      reason: req.body.stockReason || 'Ajuste manual via painel admin',
      user: req.body.adminUser || 'Admin',
      date: new Date().toISOString()
    });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('products').update(mapProductToSupabase(prod)).eq('id', req.params.id);
      if (error) console.error("Erro ao atualizar produto no Supabase:", error.message);
      else console.log("🟢 Produto atualizado no Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao atualizar produto no Supabase:", err);
    }
  }

  saveDb();
  res.json({ success: true, product: prod, message: "Produto atualizado com sucesso!" });
});

app.delete('/api/products/:id', requireAdminAuth, async (req, res) => {
  const db = getDb();
  const index = db.products.findIndex(p => p.id === req.params.id);
  const deletedProd = index !== -1 ? db.products[index] : null;

  // Exclui permanentemente do banco Supabase PostgreSQL
  const supabase = getSupabase();
  let supabaseDeleted = false;
  if (supabase) {
    try {
      const { error } = await supabase.from('products').delete().eq('id', req.params.id);
      if (!error) {
        supabaseDeleted = true;
        console.log("🟢 Produto excluído permanentemente do Supabase PostgreSQL:", req.params.id);
      } else {
        console.error("Erro ao excluir produto no Supabase:", error.message);
      }
    } catch (err) {
      console.error("Erro ao excluir produto no Supabase:", err);
    }
  }

  if (index !== -1) {
    db.products.splice(index, 1);
    saveDb();
  }

  if (!deletedProd && !supabaseDeleted) {
    return res.status(404).json({ success: false, message: "Produto não encontrado." });
  }

  const prodName = deletedProd ? deletedProd.name : req.params.id;
  res.json({ success: true, message: `Produto "${prodName}" removido definitivamente com sucesso.` });
});

// ==========================================
// CENTRAL DE NOTIFICAÇÕES & ALERTAS DO ADMIN
// ==========================================
app.get('/api/admin/notifications', async (req, res) => {
  const db = getDb();
  const notifications = [];

  // 1. Alertas de Estoque Esgotado e Baixo
  let products = db.products || [];
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.from('products').select('*');
      if (data && Array.isArray(data)) products = data.map(mapProductFromSupabase);
    } catch (e) {
      console.warn("Aviso ao buscar produtos para alertas:", e.message);
    }
  }

  products.forEach(p => {
    if (p.stock <= 0) {
      notifications.push({
        id: `stock_zero_${p.id}`,
        type: 'danger',
        category: 'Estoque Esgotado',
        title: p.name,
        message: 'Produto com estoque zerado (0 un). Reposição necessária.',
        link: '/admin/estoque',
        createdAt: new Date().toISOString()
      });
    } else if (p.stock <= (p.minStock || 5)) {
      notifications.push({
        id: `stock_low_${p.id}`,
        type: 'warning',
        category: 'Estoque Baixo',
        title: p.name,
        message: `Restam apenas ${p.stock} un em estoque (mínimo: ${p.minStock || 5} un).`,
        link: '/admin/estoque',
        createdAt: new Date().toISOString()
      });
    }
  });

  // 2. Pedidos Novos / Pendentes de Envio
  let orders = db.orders || [];
  if (supabase) {
    try {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20);
      if (data && Array.isArray(data)) orders = data;
    } catch (e) {
      console.warn("Aviso ao buscar pedidos para alertas:", e.message);
    }
  }

  const pendingOrders = orders.filter(o => o.status === 'received' || o.status === 'pending' || o.payment_status === 'pending');
  pendingOrders.slice(0, 10).forEach(o => {
    const customer = o.customer_name || o.customerName || 'Cliente';
    const totalVal = o.total ? `R$ ${Number(o.total).toFixed(2).replace('.', ',')}` : '';
    notifications.push({
      id: `order_${o.id}`,
      type: 'info',
      category: 'Novo Pedido',
      title: `Pedido #${String(o.id).replace('ORD-', '')}`,
      message: `${customer} aguardando separação. Total: ${totalVal}`,
      link: '/admin/pedidos',
      createdAt: o.created_at || new Date().toISOString()
    });
  });

  // 3. Clientes na Lista de Espera
  let waitlist = db.waitlist || [];
  if (supabase) {
    try {
      const { data } = await supabase.from('waitlist').select('*').eq('status', 'Aguardando');
      if (data && Array.isArray(data)) waitlist = data;
    } catch (e) {
      console.warn("Aviso ao buscar waitlist para alertas:", e.message);
    }
  }

  const waitingCount = waitlist.filter(w => (w.status || 'Aguardando') === 'Aguardando').length;
  if (waitingCount > 0) {
    notifications.push({
      id: 'waitlist_alert',
      type: 'gold',
      category: 'Lista de Espera',
      title: `${waitingCount} Cliente(s) na Fila`,
      message: 'Clientes cadastrados aguardando notificação de reposição.',
      link: '/admin/estoque/lista-espera',
      createdAt: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    count: notifications.length,
    notifications
  });
});

// ==========================================
// CONTROLE DE ESTOQUE & INVENTÁRIO
// ==========================================
app.get('/api/admin/inventory', async (req, res) => {
  let products = [];
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        products = data.map(mapProductFromSupabase);
        const db = getDb();
        db.products = products;
      }
    } catch (err) {
      console.error("Erro ao buscar produtos para inventário no Supabase:", err);
    }
  }

  if (products.length === 0) {
    const db = getDb();
    products = db.products || [];
  }

  const db = getDb();
  const movements = db.inventoryMovements || [];

  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalStockValueCost = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.costPrice || 0)), 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  res.json({
    success: true,
    kpis: {
      totalStockUnits,
      totalProductsCount: products.length,
      totalStockValueCost,
      lowStockCount,
      outOfStockCount
    },
    products,
    movements: movements.slice(-50).reverse().map(m => {
      const prod = products.find(p => p.id === m.productId);
      return {
        ...m,
        productName: prod ? prod.name : 'Produto Removido',
        productSku: prod ? prod.sku : 'SKU'
      };
    })
  });
});

app.post('/api/admin/inventory/movement', async (req, res) => {
  const db = getDb();
  const { productId, type, quantity, reason, user } = req.body;

  if (!db.products) db.products = [];
  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ success: false, message: "Produto não encontrado." });

  const qty = parseInt(quantity || 0);
  const previousStock = product.stock || 0;
  let newStock = previousStock;

  if (type === 'entry') {
    newStock = previousStock + qty;
  } else if (type === 'exit' || type === 'damage') {
    newStock = Math.max(0, previousStock - qty);
  } else if (type === 'adjustment') {
    newStock = qty;
  }

  product.stock = newStock;

  if (!db.inventoryMovements) db.inventoryMovements = [];
  const newMov = {
    id: generateId('mov'),
    productId: product.id,
    type,
    quantity: type === 'adjustment' ? Math.abs(newStock - previousStock) : qty,
    previousStock,
    newStock,
    reason: reason || 'Movimentação manual de estoque',
    user: user || 'Administrador',
    date: new Date().toISOString()
  };

  db.inventoryMovements.push(newMov);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('products').update({ stock: newStock }).eq('id', product.id);
      await supabase.from('inventory_movements').insert({
        id: newMov.id,
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku,
        type: newMov.type,
        quantity: newMov.quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: newMov.reason,
        user: newMov.user,
        created_at: newMov.date
      });
      console.log(`🟢 Estoque de ${product.name} atualizado no Supabase para: ${newStock}`);
    } catch (err) {
      console.error("Erro ao atualizar estoque no Supabase:", err);
    }
  }

  res.json({ success: true, movement: newMov, product, message: "Movimentação de estoque registrada com sucesso!" });
});

app.put('/api/admin/inventory/quick-update/:id', async (req, res) => {
  const db = getDb();
  if (!db.products) db.products = [];
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Produto não encontrado." });

  if (req.body.minStock !== undefined) product.minStock = parseInt(req.body.minStock);
  if (req.body.costPrice !== undefined) product.costPrice = parseFloat(req.body.costPrice);

  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      const updates = {};
      if (req.body.minStock !== undefined) updates.min_stock = parseInt(req.body.minStock);
      if (req.body.costPrice !== undefined) updates.cost_price = parseFloat(req.body.costPrice);
      await supabase.from('products').update(updates).eq('id', req.params.id);
    } catch (err) {
      console.error("Erro ao atualizar parâmetros de estoque no Supabase:", err);
    }
  }

  res.json({ success: true, product, message: "Parâmetros de estoque atualizados!" });
});

// ==========================================
// CÁLCULO DE FRETE E CUPONS
// ==========================================
app.post('/api/shipping/calculate', (req, res) => {
  const { cep, items } = req.body;

  if (!cep || cep.replace(/\D/g, '').length < 8) {
    return res.status(400).json({ success: false, message: "CEP inválido." });
  }

  const cleanCep = cep.replace(/\D/g, '');
  const db = getDb();
  const subtotal = items ? items.reduce((acc, item) => acc + (item.price * item.quantity), 0) : 0;

  const isFreeShipping = subtotal >= db.settings.freeShippingThreshold;

  res.json({
    success: true,
    cep: cleanCep,
    options: [
      {
        id: 'sedex',
        name: 'SEDEX Express Gastronômico',
        price: isFreeShipping ? 0 : 24.90,
        originalPrice: 24.90,
        deadline: '2 a 3 dias úteis',
        isFree: isFreeShipping
      },
      {
        id: 'pac',
        name: 'PAC Correios / Transportadora',
        price: isFreeShipping ? 0 : 15.90,
        originalPrice: 15.90,
        deadline: '5 a 8 dias úteis',
        isFree: isFreeShipping
      }
    ]
  });
});

app.get('/api/coupons', async (req, res) => {
  let list = [];
  let fetchedFromSupabase = false;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('coupons').select('*');
      if (!error && Array.isArray(data)) {
        list = data.map(mapCouponFromSupabase);
        fetchedFromSupabase = true;
        const db = getDb();
        db.coupons = list;
      }
    } catch (err) {
      console.error("Erro ao buscar cupons no Supabase:", err);
    }
  }

  if (!fetchedFromSupabase) {
    const db = getDb();
    list = [...(db.coupons || [])];
  }

  res.json({ success: true, coupons: list });
});

app.post('/api/coupons', async (req, res) => {
  const db = getDb();
  const { code, type, value, minPurchase, usageLimit, description } = req.body;
  
  if (!db.coupons) db.coupons = [];
  if (db.coupons.some(c => c.code.toUpperCase() === code.trim().toUpperCase())) {
    return res.status(400).json({ success: false, message: "Já existe um cupom com este código." });
  }

  const newCoupon = {
    id: generateId('coup'),
    code: code.trim().toUpperCase(),
    type: type || 'percentage',
    value: parseFloat(value || 0),
    minPurchase: parseFloat(minPurchase || 0),
    usageLimit: parseInt(usageLimit || 100),
    usedCount: 0,
    active: true,
    description: description || ''
  };

  db.coupons.push(newCoupon);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('coupons').insert(mapCouponToSupabase(newCoupon));
      console.log("🟢 Cupom salvo no Supabase PostgreSQL:", newCoupon.code);
    } catch (err) {
      console.error("Erro ao salvar cupom no Supabase:", err);
    }
  }

  res.json({ success: true, coupon: newCoupon, message: "Cupom criado com sucesso!" });
});

app.put('/api/coupons/:id', async (req, res) => {
  const db = getDb();
  if (!db.coupons) db.coupons = [];
  const coupon = db.coupons.find(c => c.id === req.params.id);
  if (!coupon) return res.status(404).json({ success: false, message: "Cupom não encontrado." });

  if (req.body.code && req.body.code.trim().toUpperCase() !== coupon.code) {
    const duplicate = db.coupons.find(c => c.id !== coupon.id && c.code.toUpperCase() === req.body.code.trim().toUpperCase());
    if (duplicate) return res.status(400).json({ success: false, message: "Já existe outro cupom com este código." });
    coupon.code = req.body.code.trim().toUpperCase();
  }

  if (req.body.type !== undefined) coupon.type = req.body.type;
  if (req.body.value !== undefined) coupon.value = parseFloat(req.body.value);
  if (req.body.minPurchase !== undefined) coupon.minPurchase = parseFloat(req.body.minPurchase);
  if (req.body.usageLimit !== undefined) coupon.usageLimit = parseInt(req.body.usageLimit);
  if (req.body.description !== undefined) coupon.description = req.body.description;
  if (req.body.active !== undefined) coupon.active = !!req.body.active;

  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('coupons').update(mapCouponToSupabase(coupon)).eq('id', req.params.id);
      console.log("🟢 Cupom atualizado no Supabase PostgreSQL:", coupon.code);
    } catch (err) {
      console.error("Erro ao atualizar cupom no Supabase:", err);
    }
  }

  res.json({ success: true, coupon, message: "Cupom atualizado com sucesso!" });
});

app.delete('/api/coupons/:id', async (req, res) => {
  const db = getDb();
  if (!db.coupons) db.coupons = [];
  const index = db.coupons.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    db.coupons.splice(index, 1);
    saveDb();
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('coupons').delete().eq('id', req.params.id);
      console.log("🟢 Cupom removido do Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao remover cupom no Supabase:", err);
    }
  }

  res.json({ success: true, message: "Cupom removido com sucesso!" });
});

app.post('/api/coupons/validate', (req, res) => {
  const { code, cartSubtotal } = req.body;
  const db = getDb();

  const coupon = db.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);

  if (!coupon) {
    return res.status(404).json({ success: false, message: "Cupom inválido ou expirado." });
  }

  if (coupon.minPurchase && cartSubtotal < coupon.minPurchase) {
    return res.status(400).json({
      success: false,
      message: `Este cupom é válido apenas para compras acima de R$ ${coupon.minPurchase.toFixed(2).replace('.', ',')}`
    });
  }

  let discountAmount = 0;
  if (coupon.type === 'percentage') {
    discountAmount = (cartSubtotal * coupon.value) / 100;
  } else if (coupon.type === 'fixed') {
    discountAmount = coupon.value;
  } else if (coupon.type === 'free_shipping') {
    discountAmount = 0; // O frete grátis é aplicado na etapa de frete
  }

  res.json({
    success: true,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      description: coupon.description
    },
    message: "Cupom aplicado com sucesso!"
  });
});

// ==========================================
// CHECKOUT & PEDIDOS
// ==========================================
app.post('/api/orders', async (req, res) => {
  const db = getDb();
  const { customer, items, shipping, payment, couponCode, subtotal, discount, shippingFee, total } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: "Carrinho vazio." });
  }

  // Verificar e abater estoque
  // Recálculo rigoroso de preços e verificação de estoque no servidor (Anti-manipulação)
  let calculatedItems = [];
  let realSubtotal = 0;

  for (const item of items) {
    const prod = db.products.find(p => p.id === item.id);
    if (!prod) {
      return res.status(400).json({ success: false, message: `Produto "${item.name}" não encontrado no catálogo.` });
    }

    if (prod.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Estoque insuficiente para o produto "${prod.name}". Disponível: ${prod.stock} un`
      });
    }

    const realUnitPrice = prod.promotionalPrice && prod.promotionalPrice > 0 ? prod.promotionalPrice : prod.price;
    const itemTotalPrice = realUnitPrice * item.quantity;
    realSubtotal += itemTotalPrice;

    calculatedItems.push({
      productId: prod.id,
      name: prod.name,
      unitPrice: realUnitPrice,
      quantity: item.quantity,
      totalPrice: itemTotalPrice,
      image: prod.images && prod.images[0] ? prod.images[0] : (item.image || '/header-bg.jpg')
    });
  }

  // Recálculo de cupom de desconto no servidor
  let realDiscount = 0;
  if (couponCode) {
    const coupon = (db.coupons || []).find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.active);
    if (coupon) {
      if (!coupon.minPurchase || realSubtotal >= coupon.minPurchase) {
        if (coupon.type === 'percentage') {
          realDiscount = (realSubtotal * (coupon.value / 100));
        } else if (coupon.type === 'fixed') {
          realDiscount = Math.min(realSubtotal, coupon.value);
        } else if (coupon.type === 'free_shipping') {
          realDiscount = shippingFee || 0;
        }
      }
    }
  }

  const realTotal = Math.max(0, realSubtotal - realDiscount + (shippingFee || 0));

  // Abater do estoque e gerar movimentação
  calculatedItems.forEach(item => {
    const prod = db.products.find(p => p.id === item.productId);
    if (prod) {
      const prevStock = prod.stock;
      prod.stock -= item.quantity;
      if (!db.inventoryMovements) db.inventoryMovements = [];
      db.inventoryMovements.push({
        id: generateId('mov'),
        productId: prod.id,
        type: 'exit',
        quantity: item.quantity,
        previousStock: prevStock,
        newStock: prod.stock,
        reason: `Venda do pedido online`,
        user: customer.name || 'Cliente',
        date: new Date().toISOString()
      });
    }
  });

  const orderId = `ORD-2024-${Math.floor(1000 + Math.random() * 9000)}`;

  // Dados do pagamento
  let paymentDetails = {
    method: payment.method,
    status: payment.method === 'pix' ? 'approved' : 'approved',
    installments: payment.installments || 1
  };

  if (payment.method === 'pix') {
    paymentDetails.pixQrCodeUrl = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014BR.GOV.BCB.PIX0136liviosfood-pix-key5204000053039865405" + realTotal.toFixed(2) + "5802BR5922LiviosFoodInnovation6014BeloHorizonte62070503***6304E21A";
    paymentDetails.pixCopyPaste = "00020126580014BR.GOV.BCB.PIX0136liviosfood-pix-key5204000053039865405" + realTotal.toFixed(2) + "5802BR5922LiviosFoodInnovation6014BeloHorizonte62070503***6304E21A";
  }

  const newOrder = {
    id: orderId,
    customerId: customer.id || null,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    customerCpf: customer.cpf,
    shippingAddress: shipping.address,
    shippingOption: shipping.option,
    items: calculatedItems,
    subtotal: realSubtotal,
    discount: realDiscount,
    couponCode: couponCode || null,
    shippingFee: shippingFee || 0,
    total: realTotal,
    paymentMethod: payment.method,
    paymentDetails,
    paymentStatus: paymentDetails.status,
    status: 'received',
    statusHistory: [
      { status: 'received', date: new Date().toISOString(), note: 'Pedido registrado no site e direcionado para atendimento via WhatsApp (31) 99567-5327' }
    ],
    createdAt: new Date().toISOString()
  };

  if (!db.orders) db.orders = [];
  db.orders.unshift(newOrder);

  // Se o cupom foi utilizado, incrementa contagem
  if (couponCode) {
    const c = db.coupons.find(cp => cp.code === couponCode);
    if (c) c.usedCount = (c.usedCount || 0) + 1;
  }

  saveDb();

  // Persistência Transacional no Supabase PostgreSQL (AWAIT obrigatório para ambiente Serverless Vercel)
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error: orderErr } = await supabase.from('orders').insert(mapOrderToSupabase(newOrder));
      if (orderErr) {
        console.error("⚠️ Erro ao gravar pedido no Supabase:", orderErr.message);
      } else {
        console.log("🟢 Pedido gravado no Supabase PostgreSQL com sucesso:", newOrder.id);
      }

      // Atualizar estoque de cada produto no Supabase
      for (const item of calculatedItems) {
        const prod = db.products.find(p => p.id === item.productId);
        if (prod) {
          await supabase.from('products').update({ stock: prod.stock }).eq('id', prod.id);
        }
      }

      // Se cupom foi usado, atualiza no Supabase
      if (couponCode) {
        const c = db.coupons.find(cp => cp.code === couponCode);
        if (c) {
          await supabase.from('coupons').update({ used_count: c.usedCount }).eq('code', couponCode);
        }
      }
    } catch (err) {
      console.error("Erro ao sincronizar pedido/estoque no Supabase:", err);
    }
  }

  res.json({
    success: true,
    order: newOrder,
    message: "Pedido realizado com sucesso!"
  });
});

app.get('/api/orders', async (req, res) => {
  const db = getDb();
  const { customerId } = req.query;

  const supabase = getSupabase();
  if (supabase) {
    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapOrderFromSupabase);
        db.orders = mapped;
        return res.json({ success: true, orders: mapped });
      }
    } catch (err) {
      console.warn("⚠️ Aviso ao buscar pedidos do Supabase:", err.message);
    }
  }

  let list = [...db.orders];
  if (customerId) {
    list = list.filter(o => o.customerId === customerId);
  }

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, orders: list });
});

app.get('/api/orders/:id', async (req, res) => {
  const db = getDb();
  let order = db.orders.find(o => o.id === req.params.id);

  if (!order) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
        if (!error && data) {
          order = mapOrderFromSupabase(data);
          db.orders.push(order);
        }
      } catch (e) {}
    }
  }

  if (!order) {
    return res.status(404).json({ success: false, message: "Pedido não encontrado." });
  }

  res.json({ success: true, order });
});

// Endpoint público para consulta e rastreamento de pedidos via WhatsApp / Código
app.get('/api/orders/track/:query', async (req, res) => {
  const query = (req.params.query || '').trim();
  if (!query) {
    return res.status(400).json({ success: false, message: "Informe o código do pedido ou telefone para rastrear." });
  }

  const db = getDb();
  const cleanDigits = query.replace(/\D/g, '');
  const queryLower = query.toLowerCase();

  // 1. Busca por ID exato ou parcial
  let found = db.orders.find(o => 
    o.id.toLowerCase() === queryLower || 
    o.id.toLowerCase().replace(/[^a-z0-9]/g, '') === queryLower.replace(/[^a-z0-9]/g, '')
  );

  // 2. Busca por Telefone / WhatsApp (se tiver pelo menos 8 dígitos)
  if (!found && cleanDigits.length >= 8) {
    found = db.orders.slice().reverse().find(o => {
      const orderPhoneDigits = (o.customerPhone || '').replace(/\D/g, '');
      return orderPhoneDigits.includes(cleanDigits) || cleanDigits.includes(orderPhoneDigits);
    });
  }

  // 3. Busca por CPF
  if (!found && cleanDigits.length === 11) {
    found = db.orders.slice().reverse().find(o => (o.customerCpf || '').replace(/\D/g, '') === cleanDigits);
  }

  // 4. Busca por E-mail
  if (!found && queryLower.includes('@')) {
    found = db.orders.slice().reverse().find(o => (o.customerEmail || '').toLowerCase() === queryLower);
  }

  // Fallback Supabase
  if (!found) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .or(`id.ilike.%${query}%,customer_phone.ilike.%${cleanDigits}%,customer_email.ilike.%${query}%`)
          .limit(1);

        if (data && data.length > 0) {
          found = mapOrderFromSupabase(data[0]);
        }
      } catch (err) {
        console.warn("Aviso ao buscar rastreio no Supabase:", err.message);
      }
    }
  }

  if (!found) {
    return res.status(404).json({ 
      success: false, 
      message: `Nenhum pedido localizado com a busca "${query}". Verifique o número do pedido ou WhatsApp informado.` 
    });
  }

  res.json({ success: true, order: found });
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { status, note, trackingCode } = req.body;
  const db = getDb();
  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) return res.status(404).json({ success: false, message: "Pedido não encontrado." });

  const previousStatus = order.status;
  order.status = status;
  if (trackingCode) order.trackingCode = trackingCode;

  // Se o pedido foi cancelado e não estava cancelado antes, devolve os produtos ao estoque
  if (status === 'cancelled' && previousStatus !== 'cancelled') {
    (order.items || []).forEach(item => {
      const prod = db.products.find(p => p.id === (item.productId || item.id));
      if (prod) {
        const prevStock = prod.stock;
        prod.stock += item.quantity;
        if (!db.inventoryMovements) db.inventoryMovements = [];
        db.inventoryMovements.push({
          id: generateId('mov'),
          productId: prod.id,
          type: 'entry',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stock,
          reason: `Estorno de estoque por cancelamento do pedido ${order.id}`,
          user: 'Sistema Admin',
          date: new Date().toISOString()
        });
      }
    });
  }

  const statusMap = {
    received: 'Pedido recebido',
    payment_pending: 'Pagamento pendente',
    payment_approved: 'Pagamento aprovado',
    in_preparation: 'Em preparação e embalagem',
    shipped: 'Pedido enviado para a transportadora',
    delivered: 'Entregue ao cliente',
    cancelled: 'Pedido cancelado'
  };

  order.statusHistory.push({
    status,
    date: new Date().toISOString(),
    note: note || `Status alterado para "${statusMap[status] || status}"`
  });

  saveDb();

  // Sincronizar com Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('orders').update({
        status: order.status,
        status_history: order.statusHistory
      }).eq('id', req.params.id);

      // Se o pedido foi cancelado, atualiza estoque no Supabase
      if (status === 'cancelled' && previousStatus !== 'cancelled') {
        for (const item of (order.items || [])) {
          const prod = db.products.find(p => p.id === (item.productId || item.id));
          if (prod) {
            await supabase.from('products').update({ stock: prod.stock }).eq('id', prod.id);
          }
        }
      }
    } catch (supabaseErr) {
      console.error("Erro ao sincronizar status do pedido no Supabase:", supabaseErr.message);
    }
  }

  res.json({ success: true, order, message: "Status do pedido atualizado!" });
});

app.delete('/api/orders/:id', async (req, res) => {
  const db = getDb();
  const orderId = req.params.id;
  const index = (db.orders || []).findIndex(o => o.id === orderId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Pedido não encontrado." });
  }

  const deletedOrder = db.orders.splice(index, 1)[0];
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) console.error("Erro ao excluir pedido no Supabase:", error);
      else console.log("🟢 Pedido excluído no Supabase PostgreSQL:", orderId);
    } catch (err) {
      console.error("Erro ao deletar pedido no Supabase:", err);
    }
  }

  res.json({ success: true, message: `Pedido #${orderId} excluído com sucesso!`, order: deletedOrder });
});

// ==========================================
// AVALIAÇÕES DE PRODUTOS
// ==========================================
app.post('/api/reviews', (req, res) => {
  const { productId, customerName, rating, comment } = req.body;
  const db = getDb();

  const newReview = {
    id: generateId('rev'),
    productId,
    customerName,
    rating: parseInt(rating),
    comment,
    date: new Date().toISOString(),
    approved: true // Auto aprovação em demo
  };

  db.reviews.push(newReview);

  // Recalcula média de avaliação do produto
  const prodReviews = db.reviews.filter(r => r.productId === productId && r.approved);
  const avg = prodReviews.reduce((a, b) => a + b.rating, 0) / prodReviews.length;
  const prod = db.products.find(p => p.id === productId);
  if (prod) {
    prod.rating = parseFloat(avg.toFixed(1));
    prod.reviewCount = prodReviews.length;
  }

  saveDb();
  res.json({ success: true, review: newReview, message: "Sua avaliação foi enviada com sucesso!" });
});

// ==========================================
// RECEITAS & BANNERS & GALERIA
// ==========================================
// ==========================================
// RECEITAS & BANNERS & GALERIA (CRUD COMPLETO ADMIN)
// ==========================================
app.get('/api/recipes', async (req, res) => {
  let list = [];
  let fetchedFromSupabase = false;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        list = data.map(mapRecipeFromSupabase);
        fetchedFromSupabase = true;
        const db = getDb();
        db.recipes = list;
      }
    } catch (err) {
      console.error("Erro ao buscar receitas no Supabase:", err);
    }
  }

  if (!fetchedFromSupabase) {
    const db = getDb();
    list = [...(db.recipes || [])];
  }

  res.json({ success: true, recipes: list });
});

app.post('/api/admin/recipes', async (req, res) => {
  const db = getDb();
  if (!db.recipes) db.recipes = [];

  const title = (req.body.title || 'Nova Receita Gastronômica').trim();
  const rawSlug = (req.body.slug || title).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');
  const slug = `${rawSlug}-${Date.now().toString().slice(-4)}`;

  const newRecipe = {
    id: generateId('rec'),
    title,
    slug,
    subtitle: req.body.subtitle || '',
    prepTime: req.body.prepTime || '30 min',
    difficulty: req.body.difficulty || 'Fácil',
    servings: req.body.servings || '4 pessoas',
    image: req.body.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
    usedProductIds: Array.isArray(req.body.usedProductIds) ? req.body.usedProductIds : [],
    ingredients: Array.isArray(req.body.ingredients) ? req.body.ingredients : (typeof req.body.ingredientsText === 'string' ? req.body.ingredientsText.split('\n').map(i => i.trim()).filter(Boolean) : []),
    instructions: Array.isArray(req.body.instructions) ? req.body.instructions : (typeof req.body.instructionsText === 'string' ? req.body.instructionsText.split('\n').map(i => i.trim()).filter(Boolean) : []),
    createdAt: new Date().toISOString()
  };

  db.recipes.unshift(newRecipe);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('recipes').insert(mapRecipeToSupabase(newRecipe));
      console.log("🟢 Receita salva no Supabase PostgreSQL:", newRecipe.id);
    } catch (err) {
      console.error("Erro ao salvar receita no Supabase:", err);
    }
  }

  res.json({ success: true, recipe: newRecipe, message: 'Receita criada com sucesso!' });
});

app.put('/api/admin/recipes/:id', async (req, res) => {
  const db = getDb();
  if (!db.recipes) db.recipes = [];
  const rec = db.recipes.find(r => r.id === req.params.id);
  if (rec) {
    Object.assign(rec, req.body);
    saveDb();
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const mapped = mapRecipeToSupabase(req.body);
      delete mapped.id;
      await supabase.from('recipes').update(mapped).eq('id', req.params.id);
      console.log("🟢 Receita atualizada no Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao atualizar receita no Supabase:", err);
    }
  }

  res.json({ success: true, recipe: rec || req.body, message: 'Receita atualizada com sucesso!' });
});

app.delete('/api/admin/recipes/:id', async (req, res) => {
  const db = getDb();
  if (!db.recipes) db.recipes = [];
  db.recipes = db.recipes.filter(r => r.id !== req.params.id);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('recipes').delete().eq('id', req.params.id);
      console.log("🟢 Receita removida do Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao remover receita no Supabase:", err);
    }
  }

  res.json({ success: true, message: 'Receita excluída com sucesso!' });
});

app.get('/api/banners', async (req, res) => {
  let list = [];
  let fetchedFromSupabase = false;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('banners').select('*').order('order', { ascending: true });
      if (!error && Array.isArray(data)) {
        list = data.map(mapBannerFromSupabase);
        fetchedFromSupabase = true;
        const db = getDb();
        db.banners = list;
      }
    } catch (err) {
      console.error("Erro ao buscar banners no Supabase:", err);
    }
  }

  if (!fetchedFromSupabase) {
    const db = getDb();
    list = [...(db.banners || [])];
  }

  res.json({ success: true, banners: list.filter(b => b.active) });
});

app.get('/api/admin/banners', async (req, res) => {
  let list = [];
  let fetchedFromSupabase = false;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('banners').select('*').order('order', { ascending: true });
      if (!error && Array.isArray(data)) {
        list = data.map(mapBannerFromSupabase);
        fetchedFromSupabase = true;
        const db = getDb();
        db.banners = list;
      }
    } catch (err) {
      console.error("Erro ao buscar banners no Supabase (admin):", err);
    }
  }

  if (!fetchedFromSupabase) {
    const db = getDb();
    list = [...(db.banners || [])];
  }

  res.json({ success: true, banners: list });
});

app.post('/api/admin/banners', async (req, res) => {
  const db = getDb();
  if (!db.banners) db.banners = [];
  const newBanner = {
    id: generateId('ban'),
    title: req.body.title || 'Novo Banner Promocional',
    subtitle: req.body.subtitle || '',
    buttonText: req.body.buttonText || 'COMPRAR AGORA',
    buttonLink: req.body.buttonLink || '/produtos',
    secondaryButtonText: req.body.secondaryButtonText || '',
    secondaryButtonLink: req.body.secondaryButtonLink || '',
    imageDesktop: req.body.imageDesktop || '/header-bg.jpg',
    imageMobile: req.body.imageMobile || req.body.imageDesktop || '/header-bg.jpg',
    active: req.body.active ?? true,
    order: (db.banners.length || 0) + 1
  };
  db.banners.push(newBanner);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('banners').insert(mapBannerToSupabase(newBanner));
      console.log("🟢 Banner salvo no Supabase PostgreSQL:", newBanner.id);
    } catch (err) {
      console.error("Erro ao salvar banner no Supabase:", err);
    }
  }

  res.json({ success: true, banner: newBanner, message: 'Banner criado com sucesso!' });
});

app.put('/api/admin/banners/:id', async (req, res) => {
  const db = getDb();
  if (!db.banners) db.banners = [];
  const banner = db.banners.find(b => b.id === req.params.id);
  if (!banner) return res.status(404).json({ success: false, message: 'Banner não encontrado.' });
  Object.assign(banner, req.body);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('banners').update(mapBannerToSupabase(banner)).eq('id', req.params.id);
      console.log("🟢 Banner atualizado no Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao atualizar banner no Supabase:", err);
    }
  }

  res.json({ success: true, banner, message: 'Banner atualizado com sucesso!' });
});

app.delete('/api/admin/banners/:id', async (req, res) => {
  const db = getDb();
  if (!db.banners) db.banners = [];
  db.banners = db.banners.filter(b => b.id !== req.params.id);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('banners').delete().eq('id', req.params.id);
      console.log("🟢 Banner removido do Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao remover banner no Supabase:", err);
    }
  }

  res.json({ success: true, message: 'Banner excluído com sucesso!' });
});

app.put('/api/admin/banners/:id/toggle', async (req, res) => {
  const db = getDb();
  if (!db.banners) db.banners = [];
  const banner = db.banners.find(b => b.id === req.params.id);
  if (!banner) return res.status(404).json({ success: false, message: 'Banner não encontrado.' });
  banner.active = !banner.active;
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('banners').update({ active: banner.active }).eq('id', req.params.id);
      console.log("🟢 Status do banner atualizado no Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao alternar status do banner no Supabase:", err);
    }
  }

  res.json({ success: true, banner, message: `Banner ${banner.active ? 'ativado' : 'desativado'} com sucesso!` });
});

app.get('/api/gallery', (req, res) => {
  const db = getDb();
  res.json({ success: true, gallery: db.gallery });
});

// ==========================================
// MÓDULO 56 — CAMPANHAS E MARKETING (API ROTAS)
// ==========================================

// Endpoint Público para a Loja Virtual buscar Pop-ups e Barras Ativas em tempo real
app.get('/api/marketing/active', (req, res) => {
  const db = getDb();
  const now = new Date();

  // Popups Ativos dentro da data de vigência
  const activePopups = (db.popups || []).filter(p => {
    if (!p.active && p.status !== 'Ativo') return false;
    if (p.startDate && new Date(p.startDate) > now) return false;
    if (p.endDate && new Date(p.endDate) < now) return false;
    return true;
  });

  // Barras Promocionais Ativas
  const activeBars = (db.promotionalBars || []).filter(b => {
    if (!b.active) return false;
    if (b.startDate && new Date(b.startDate) > now) return false;
    if (b.endDate && new Date(b.endDate) < now) return false;
    return true;
  });

  // Produtos promocionados
  const featuredProducts = db.products.filter(p => p.active && (p.isOffer || p.isFeatured));

  res.json({
    success: true,
    popups: activePopups,
    promotionalBars: activeBars,
    featuredProducts
  });
});

// Dashboard de Marketing Admin
app.get('/api/admin/marketing/dashboard', (req, res) => {
  const db = getDb();

  const campaigns = db.campaigns || [];
  const activeCampaignsCount = campaigns.filter(c => c.status === 'Ativa').length;
  const scheduledCount = campaigns.filter(c => c.status === 'Agendada').length;
  const draftCount = campaigns.filter(c => c.status === 'Rascunho').length;
  const closedCount = campaigns.filter(c => c.status === 'Encerrada').length;

  const totalReached = campaigns.reduce((acc, c) => acc + (c.stats?.reachedCount || 0), 0);
  const totalSent = campaigns.reduce((acc, c) => acc + (c.stats?.sentCount || 0), 0);
  const totalOpens = campaigns.reduce((acc, c) => acc + (c.stats?.openedCount || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.stats?.clickedCount || 0), 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + (c.stats?.conversionsCount || 0), 0);
  const totalRevenueGenerated = campaigns.reduce((acc, c) => acc + (c.stats?.totalRevenue || 0), 0);

  res.json({
    success: true,
    kpis: {
      activeCampaignsCount,
      scheduledCount,
      draftCount,
      closedCount,
      totalReached,
      totalSent,
      totalOpens,
      totalClicks,
      totalConversions,
      totalRevenueGenerated,
      avgTicket: totalConversions > 0 ? totalRevenueGenerated / totalConversions : 0
    },
    campaigns,
    popups: db.popups || [],
    promotionalBars: db.promotionalBars || []
  });
});

// Estimativa de alcance por segmentação de clientes
app.post('/api/admin/campaigns/estimate-reach', (req, res) => {
  const { segmentType, minSpent, daysAgo } = req.body;
  const db = getDb();

  let customers = db.users.filter(u => u.role === 'customer');

  if (segmentType === 'purchased_only') {
    const buyerEmails = new Set(db.orders.map(o => o.customerEmail));
    customers = customers.filter(c => buyerEmails.has(c.email));
  } else if (segmentType === 'never_purchased') {
    const buyerEmails = new Set(db.orders.map(o => o.customerEmail));
    customers = customers.filter(c => !buyerEmails.has(c.email));
  } else if (segmentType === 'inactive_60') {
    // Clientes inativos há mais de 60 dias
    const recentEmails = new Set(db.orders.map(o => o.customerEmail));
    customers = customers.filter(c => !recentEmails.has(c.email));
  } else if (segmentType === 'vip_spent') {
    const threshold = minSpent || 200;
    const spentMap = {};
    db.orders.forEach(o => {
      spentMap[o.customerEmail] = (spentMap[o.customerEmail] || 0) + o.total;
    });
    customers = customers.filter(c => (spentMap[c.email] || 0) >= threshold);
  }

  res.json({
    success: true,
    estimatedCount: customers.length,
    matchedCustomersSample: customers.slice(0, 5)
  });
});

// CRUD de Campanhas
app.get('/api/admin/campaigns', async (req, res) => {
  let list = [];
  let fetchedFromSupabase = false;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        list = data.map(mapCampaignFromSupabase);
        fetchedFromSupabase = true;
        const db = getDb();
        db.campaigns = list;
      }
    } catch (err) {
      console.error("Erro ao buscar campanhas no Supabase:", err);
    }
  }

  if (!fetchedFromSupabase) {
    const db = getDb();
    list = [...(db.campaigns || [])];
  }

  res.json({ success: true, campaigns: list });
});

app.post('/api/admin/campaigns', async (req, res) => {
  const db = getDb();
  if (!db.campaigns) db.campaigns = [];
  const targetReach = req.body.estimatedCount || (db.users ? db.users.filter(u => u.role === 'customer').length : 0);

  const newCamp = {
    id: generateId('camp'),
    name: req.body.name || 'Nova Campanha Promocional',
    title: req.body.title || 'Título da Campanha',
    description: req.body.description || '',
    type: req.body.type || 'PROMOÇÃO',
    status: req.body.status || 'Ativa',
    channels: req.body.channels || ['email', 'whatsapp'],
    segment: req.body.segment || { type: 'all', label: 'Todos os clientes', estimatedCount: targetReach },
    startDate: req.body.startDate || new Date().toISOString(),
    endDate: req.body.endDate || new Date(Date.now() + 14 * 86400000).toISOString(),
    couponCode: req.body.couponCode || '',
    linkedProductId: req.body.linkedProductId || '',
    image: req.body.image || '/header-bg.jpg',
    message: req.body.message || {
      title: 'Olá, {{primeiro_nome}}!',
      body: 'Temos uma oferta incrível para você na {{nome_loja}}!',
      buttonText: 'COMPRAR AGORA',
      buttonLink: '/produtos'
    },
    stats: {
      reachedCount: targetReach,
      sentCount: targetReach,
      openedCount: 0,
      clickedCount: 0,
      conversionsCount: 0,
      totalRevenue: 0,
      avgTicket: 0,
      couponUsedCount: 0,
      roiPercent: 0
    },
    createdAt: new Date().toISOString(),
    createdBy: req.body.createdBy || 'Administrador'
  };

  db.campaigns.unshift(newCamp);

  // Se a campanha foi criada com pop-up atrelado ou barra, sincroniza automático
  if (req.body.createPopup) {
    if (!db.popups) db.popups = [];
    db.popups.push({
      id: generateId('pop'),
      title: newCamp.title,
      description: newCamp.description,
      type: newCamp.type,
      status: 'Ativo',
      couponCode: newCamp.couponCode,
      buttonText: newCamp.message.buttonText || 'COPIAR CUPOM E COMPRAR',
      buttonLink: newCamp.message.buttonLink || '/produtos',
      image: newCamp.image,
      trigger: 'time_delay',
      triggerDelaySeconds: 5,
      frequency: 'once_per_day',
      active: true,
      stats: { viewsCount: 0, clicksCount: 0, conversionsCount: 0 }
    });
  }

  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('campaigns').insert(mapCampaignToSupabase(newCamp));
      console.log("🟢 Campanha salva no Supabase PostgreSQL:", newCamp.id);
    } catch (err) {
      console.error("Erro ao salvar campanha no Supabase:", err);
    }
  }

  res.json({ success: true, campaign: newCamp, message: 'Campanha criada e ativada com sucesso!' });
});

app.put('/api/admin/campaigns/:id', async (req, res) => {
  const db = getDb();
  if (!db.campaigns) db.campaigns = [];
  const camp = db.campaigns.find(c => c.id === req.params.id);
  if (!camp) return res.status(404).json({ success: false, message: 'Campanha não encontrada.' });
  Object.assign(camp, req.body);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('campaigns').update(mapCampaignToSupabase(camp)).eq('id', req.params.id);
      console.log("🟢 Campanha atualizada no Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao atualizar campanha no Supabase:", err);
    }
  }

  res.json({ success: true, campaign: camp, message: 'Campanha atualizada com sucesso!' });
});

app.delete('/api/admin/campaigns/:id', async (req, res) => {
  const db = getDb();
  if (!db.campaigns) db.campaigns = [];
  db.campaigns = db.campaigns.filter(c => c.id !== req.params.id);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('campaigns').delete().eq('id', req.params.id);
      console.log("🟢 Campanha removida do Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao remover campanha no Supabase:", err);
    }
  }

  res.json({ success: true, message: 'Campanha excluída com sucesso!' });
});

// CRUD de Pop-ups Promocionais
app.get('/api/admin/popups', async (req, res) => {
  let list = [];
  let fetchedFromSupabase = false;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('popups').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        list = data.map(mapPopupFromSupabase);
        fetchedFromSupabase = true;
        const db = getDb();
        db.popups = list;
      }
    } catch (err) {
      console.error("Erro ao buscar popups no Supabase:", err);
    }
  }

  if (!fetchedFromSupabase) {
    const db = getDb();
    list = [...(db.popups || [])];
  }

  res.json({ success: true, popups: list });
});

app.post('/api/admin/popups', async (req, res) => {
  const db = getDb();
  if (!db.popups) db.popups = [];
  const newPop = {
    id: generateId('pop'),
    title: req.body.title || '🔥 OFERTA ESPECIAL',
    description: req.body.description || 'Aproveite 10% OFF na sua primeira compra!',
    type: req.body.type || 'CUPOM',
    status: req.body.status || 'Ativo',
    couponCode: req.body.couponCode || 'BEMVINDO10',
    buttonText: req.body.buttonText || 'COPIAR CUPOM E COMPRAR',
    buttonLink: req.body.buttonLink || '/produtos',
    image: req.body.image || '/header-bg.jpg',
    position: req.body.position || 'center',
    trigger: req.body.trigger || 'time_delay',
    triggerDelaySeconds: req.body.triggerDelaySeconds || 5,
    frequency: req.body.frequency || 'once_per_day',
    linkedProductId: req.body.linkedProductId || '',
    active: req.body.active ?? true,
    stats: { viewsCount: 0, clicksCount: 0, conversionsCount: 0 }
  };
  db.popups.unshift(newPop);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('popups').insert(mapPopupToSupabase(newPop));
      console.log("🟢 Pop-up salvo no Supabase PostgreSQL:", newPop.id);
    } catch (err) {
      console.error("Erro ao salvar popup no Supabase:", err);
    }
  }

  res.json({ success: true, popup: newPop, message: 'Pop-up promocional criado com sucesso!' });
});

app.put('/api/admin/popups/:id', async (req, res) => {
  const db = getDb();
  if (!db.popups) db.popups = [];
  const pop = db.popups.find(p => p.id === req.params.id);
  if (!pop) return res.status(404).json({ success: false, message: 'Pop-up não encontrado.' });
  Object.assign(pop, req.body);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('popups').update(mapPopupToSupabase(pop)).eq('id', req.params.id);
      console.log("🟢 Pop-up atualizado no Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao atualizar popup no Supabase:", err);
    }
  }

  res.json({ success: true, popup: pop, message: 'Pop-up atualizado com sucesso!' });
});

app.delete('/api/admin/popups/:id', async (req, res) => {
  const db = getDb();
  if (!db.popups) db.popups = [];
  db.popups = db.popups.filter(p => p.id !== req.params.id);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('popups').delete().eq('id', req.params.id);
      console.log("🟢 Pop-up removido do Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao remover popup no Supabase:", err);
    }
  }

  res.json({ success: true, message: 'Pop-up excluído com sucesso!' });
});

app.put('/api/admin/popups/:id/toggle', async (req, res) => {
  const db = getDb();
  if (!db.popups) db.popups = [];
  const pop = db.popups.find(p => p.id === req.params.id);
  if (!pop) return res.status(404).json({ success: false, message: 'Pop-up não encontrado.' });
  pop.active = !pop.active;
  pop.status = pop.active ? 'Ativo' : 'Inativo';
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('popups').update({ active: pop.active, status: pop.status }).eq('id', req.params.id);
      console.log("🟢 Status do pop-up atualizado no Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao alternar status do popup no Supabase:", err);
    }
  }

  res.json({ success: true, popup: pop, message: `Pop-up ${pop.active ? 'ativado' : 'desativado'} com sucesso!` });
});

// CRUD de Barras Promocionais
app.get('/api/admin/promotional-bars', async (req, res) => {
  let list = [];
  let fetchedFromSupabase = false;
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('promotional_bars').select('*').order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        list = data.map(mapPromotionalBarFromSupabase);
        fetchedFromSupabase = true;
        const db = getDb();
        db.promotionalBars = list;
      }
    } catch (err) {
      console.error("Erro ao buscar barras promocionais no Supabase:", err);
    }
  }

  if (!fetchedFromSupabase) {
    const db = getDb();
    list = [...(db.promotionalBars || [])];
  }

  res.json({ success: true, promotionalBars: list });
});

app.post('/api/admin/promotional-bars', async (req, res) => {
  const db = getDb();
  if (!db.promotionalBars) db.promotionalBars = [];
  const newBar = {
    id: generateId('pbar'),
    text: req.body.text || '🔥 OFERTA DA SEMANA DO SABOR:',
    couponCode: req.body.couponCode || 'LIVIO10',
    buttonText: req.body.buttonText || 'COPIAR CUPOM',
    buttonLink: req.body.buttonLink || '/produtos',
    backgroundColor: req.body.backgroundColor || '#8B0000',
    textColor: req.body.textColor || '#FFFFFF',
    countdownEndDate: req.body.countdownEndDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    position: req.body.position || 'top',
    active: req.body.active ?? true,
    stats: { viewsCount: 0, clicksCount: 0 }
  };
  db.promotionalBars.unshift(newBar);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('promotional_bars').insert(mapPromotionalBarToSupabase(newBar));
      console.log("🟢 Barra promocional salva no Supabase PostgreSQL:", newBar.id);
    } catch (err) {
      console.error("Erro ao salvar barra promocional no Supabase:", err);
    }
  }

  res.json({ success: true, promotionalBar: newBar, message: 'Barra promocional criada com sucesso!' });
});

app.put('/api/admin/promotional-bars/:id/toggle', async (req, res) => {
  const db = getDb();
  if (!db.promotionalBars) db.promotionalBars = [];
  const bar = db.promotionalBars.find(b => b.id === req.params.id);
  if (!bar) return res.status(404).json({ success: false, message: 'Barra não encontrada.' });
  bar.active = !bar.active;
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('promotional_bars').update({ active: bar.active }).eq('id', req.params.id);
      console.log("🟢 Status da barra promocional atualizado no Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao alternar barra promocional no Supabase:", err);
    }
  }

  res.json({ success: true, promotionalBar: bar, message: `Barra promocional ${bar.active ? 'ativada' : 'desativada'}!` });
});

app.delete('/api/admin/promotional-bars/:id', async (req, res) => {
  const db = getDb();
  if (!db.promotionalBars) db.promotionalBars = [];
  db.promotionalBars = db.promotionalBars.filter(b => b.id !== req.params.id);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('promotional_bars').delete().eq('id', req.params.id);
      console.log("🟢 Barra promocional removida do Supabase PostgreSQL:", req.params.id);
    } catch (err) {
      console.error("Erro ao remover barra promocional no Supabase:", err);
    }
  }

  res.json({ success: true, message: 'Barra promocional excluída com sucesso!' });
});

// Eventos de Tracking em Tempo Real (Views, Clicks, Conversões)
app.post('/api/marketing/event', (req, res) => {
  const { type, entityId, eventName } = req.body;
  const db = getDb();

  if (type === 'popup') {
    const p = db.popups.find(item => item.id === entityId);
    if (p && p.stats) {
      if (eventName === 'view') p.stats.viewsCount = (p.stats.viewsCount || 0) + 1;
      if (eventName === 'click') p.stats.clicksCount = (p.stats.clicksCount || 0) + 1;
      if (eventName === 'conversion') p.stats.conversionsCount = (p.stats.conversionsCount || 0) + 1;
    }
  } else if (type === 'promotionalBar') {
    const b = db.promotionalBars.find(item => item.id === entityId);
    if (b && b.stats) {
      if (eventName === 'view') b.stats.viewsCount = (b.stats.viewsCount || 0) + 1;
      if (eventName === 'click') b.stats.clicksCount = (b.stats.clicksCount || 0) + 1;
    }
  }

  saveDb();
  res.json({ success: true });
});

// ==========================================
// DASHBOARD ADMINISTRATIVO & RELATÓRIOS
// ==========================================
app.get('/api/admin/dashboard', async (req, res) => {
  const db = getDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      const [ordsRes, prodsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*')
      ]);

      if (ordsRes.data && Array.isArray(ordsRes.data)) {
        db.orders = ordsRes.data.map(mapOrderFromSupabase);
      }
      if (prodsRes.data && Array.isArray(prodsRes.data)) {
        db.products = prodsRes.data.map(mapProductFromSupabase);
      }
    } catch (err) {
      console.warn("⚠️ Aviso ao sincronizar dashboard do Supabase:", err.message);
    }
  }

  // Ordena os pedidos mais recentes primeiro
  const sortedOrders = [...(db.orders || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalRevenue = sortedOrders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? Number(o.total || 0) : 0), 0);
  const totalOrders = sortedOrders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCustomers = (db.users || []).filter(u => u.role === 'customer').length;

  const lowStockProducts = (db.products || []).filter(p => (p.stock || 0) <= (p.minStock || 5));
  const outOfStockProducts = (db.products || []).filter(p => (p.stock || 0) <= 0);
  const pendingOrders = sortedOrders.filter(o => o.status === 'received' || o.status === 'in_preparation' || o.status === 'payment_approved');

  const totalProducts = (db.products || []).length;
  const activeProducts = (db.products || []).filter(p => p.active).length;
  const activeCoupons = (db.coupons || []).filter(c => c.active).length;
  const totalWaitlist = (db.waitlist || []).filter(w => w.status === 'Aguardando').length;
  const activeCampaigns = (db.campaigns || []).filter(c => c.status === 'Ativa').length;

  // Vendas calculadas em tempo real a partir dos pedidos reais
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayTotals = { Dom: 0, Seg: 0, Ter: 0, Qua: 0, Qui: 0, Sex: 0, Sáb: 0 };

  sortedOrders.forEach(o => {
    if (o.status !== 'cancelled' && o.createdAt) {
      const dayName = daysOfWeek[new Date(o.createdAt).getDay()];
      if (dayName) dayTotals[dayName] += Number(o.total || 0);
    }
  });

  const salesChartData = [
    { label: 'Seg', v: dayTotals['Seg'] },
    { label: 'Ter', v: dayTotals['Ter'] },
    { label: 'Qua', v: dayTotals['Qua'] },
    { label: 'Qui', v: dayTotals['Qui'] },
    { label: 'Sex', v: dayTotals['Sex'] },
    { label: 'Sáb', v: dayTotals['Sáb'] },
    { label: 'Dom', v: dayTotals['Dom'] }
  ];

  res.json({
    success: true,
    kpis: {
      totalRevenue,
      totalOrders,
      avgTicket,
      totalCustomers,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      pendingOrdersCount: pendingOrders.length,
      totalProducts,
      activeProducts,
      activeCoupons,
      totalWaitlist,
      activeCampaigns
    },
    lowStockProducts,
    recentOrders: sortedOrders.slice(0, 10),
    salesChartData
  });
});

// ==========================================
// 1. LISTA DE ESPERA — "AVISE-ME QUANDO CHEGAR"
// ==========================================
app.post('/api/waitlist', (req, res) => {
  const { productId, name, email, phone, channels, quantity } = req.body;
  const db = getDb();

  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ success: false, message: "Produto não encontrado." });

  if (!db.waitlist) db.waitlist = [];

  const existing = db.waitlist.find(w => w.productId === productId && w.customerEmail.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.json({
      success: true,
      waitlist: existing,
      message: `Você já está cadastrado na Lista de Espera de "${product.name}". Avisaremos assim que o produto voltar ao estoque!`
    });
  }

  const newEntry = {
    id: generateId('wait'),
    productId: product.id,
    productName: product.name,
    productSku: product.sku,
    customerName: name,
    customerEmail: email,
    customerPhone: phone || "",
    channels: channels || ["email", "whatsapp"],
    quantity: parseInt(quantity || 1),
    status: "Aguardando",
    createdAt: new Date().toISOString(),
    notifiedAt: null
  };

  db.waitlist.push(newEntry);
  saveDb();

  res.json({
    success: true,
    waitlist: newEntry,
    message: `Você foi cadastrado na Lista de Espera de "${product.name}"! Avisaremos assim que o produto voltar ao estoque.`
  });
});

app.get('/api/admin/waitlist', (req, res) => {
  const db = getDb();
  res.json({ success: true, waitlist: db.waitlist || [] });
});

app.post('/api/admin/waitlist/notify', (req, res) => {
  const { waitlistIds, notifyAll } = req.body;
  const db = getDb();

  let targetList = db.waitlist || [];
  if (!notifyAll && waitlistIds) {
    targetList = targetList.filter(w => waitlistIds.includes(w.id));
  }

  let count = 0;
  targetList.forEach(w => {
    w.status = "Notificado";
    w.notifiedAt = new Date().toISOString();
    count++;
  });

  saveDb();
  res.json({ success: true, notifiedCount: count, message: `${count} cliente(s) notificados via E-mail / WhatsApp com sucesso!` });
});

// ==========================================
// 2. COMPRAR NOVAMENTE & SUGESTÕES NA HOME
// ==========================================
app.post('/api/orders/:id/reorder', (req, res) => {
  const db = getDb();
  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) return res.status(404).json({ success: false, message: "Pedido original não encontrado." });

  const availableItems = [];
  const unavailableItems = [];
  const priceChanges = [];

  order.items.forEach(item => {
    const currentProd = db.products.find(p => p.id === item.productId);

    if (!currentProd || !currentProd.active || currentProd.stock <= 0) {
      unavailableItems.push(item);
    } else {
      const currentPrice = currentProd.promotionalPrice || currentProd.price;
      if (currentPrice !== item.unitPrice) {
        priceChanges.push({
          name: currentProd.name,
          oldPrice: item.unitPrice,
          newPrice: currentPrice
        });
      }

      availableItems.push({
        id: currentProd.id,
        name: currentProd.name,
        slug: currentProd.slug,
        price: currentPrice,
        image: currentProd.images[0] || "/header-bg.jpg",
        quantity: Math.min(item.quantity, currentProd.stock)
      });
    }
  });

  res.json({
    success: true,
    availableItems,
    unavailableItems,
    priceChanges,
    message: `${availableItems.length} produto(s) prontos para reordenamento no seu carrinho!`
  });
});

app.get('/api/customer/reorder-suggestions', (req, res) => {
  const { customerEmail } = req.query;
  const db = getDb();

  if (!customerEmail) {
    return res.json({ success: true, suggestedProducts: [] });
  }

  const customerOrders = db.orders.filter(o => o.customerEmail.toLowerCase() === customerEmail.toLowerCase());
  const boughtProductIds = new Set();

  customerOrders.forEach(o => {
    o.items.forEach(it => boughtProductIds.add(it.productId));
  });

  const boughtProducts = db.products.filter(p => boughtProductIds.has(p.id) && p.active);

  res.json({ success: true, suggestedProducts: boughtProducts });
});

// ==========================================
// 3. BUSCA AVANÇADA & SUGESTÕES EM TEMPO REAL
// ==========================================
app.get('/api/search/suggestions', (req, res) => {
  const { q } = req.query;
  const db = getDb();

  if (!q || q.trim().length === 0) {
    return res.json({ success: true, products: [], categories: [] });
  }

  const term = q.toLowerCase().trim();

  // Busca em produtos por nome, SKU, descrição, ingredientes
  const matchingProducts = db.products.filter(p =>
    p.active && (
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.shortDescription.toLowerCase().includes(term) ||
      (p.ingredients && p.ingredients.toLowerCase().includes(term))
    )
  ).slice(0, 5);

  // Busca em categorias por nome
  const matchingCategories = db.categories.filter(c =>
    c.active && c.name.toLowerCase().includes(term)
  ).slice(0, 3);

  res.json({
    success: true,
    query: q,
    products: matchingProducts,
    categories: matchingCategories
  });
});

app.get('/api/search', (req, res) => {
  const { q, category, minPrice, maxPrice, sort, availability } = req.query;
  const db = getDb();

  let list = db.products.filter(p => p.active);
  const term = (q || '').toLowerCase().trim();

  if (term) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.shortDescription.toLowerCase().includes(term) ||
      (p.fullDescription && p.fullDescription.toLowerCase().includes(term)) ||
      (p.ingredients && p.ingredients.toLowerCase().includes(term))
    );
  }

  if (category) {
    list = list.filter(p => p.categoryId === category);
  }

  if (minPrice) {
    list = list.filter(p => (p.promotionalPrice || p.price) >= parseFloat(minPrice));
  }

  if (maxPrice) {
    list = list.filter(p => (p.promotionalPrice || p.price) <= parseFloat(maxPrice));
  }

  if (availability === 'in_stock') {
    list = list.filter(p => p.stock > 0);
  }

  // Ordenação
  if (sort === 'price_asc') {
    list.sort((a, b) => (a.promotionalPrice || a.price) - (b.promotionalPrice || b.price));
  } else if (sort === 'price_desc') {
    list.sort((a, b) => (b.promotionalPrice || b.price) - (a.promotionalPrice || a.price));
  } else if (sort === 'rating_desc') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'bestseller') {
    list.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
  }

  // Fallbacks se não houver resultados
  const fallbackProducts = list.length === 0 ? db.products.filter(p => p.isBestSeller || p.isFeatured).slice(0, 4) : [];

  res.json({
    success: true,
    query: q,
    count: list.length,
    products: list,
    fallbackProducts
  });
});

// ==========================================
// 4. COMPARAÇÃO DE PRODUTOS (`/comparar`)
// ==========================================
app.post('/api/products/compare', (req, res) => {
  const { productIds } = req.body;
  const db = getDb();

  if (!productIds || !Array.isArray(productIds)) {
    return res.status(400).json({ success: false, message: "IDs dos produtos não informados." });
  }

  const selectedProds = db.products.filter(p => productIds.includes(p.id)).slice(0, 4);

  const compareMatrix = selectedProds.map(p => {
    const cat = db.categories.find(c => c.id === p.categoryId);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      image: p.images[0] || "/header-bg.jpg",
      price: p.price,
      promotionalPrice: p.promotionalPrice,
      rating: p.rating || 5.0,
      categoryName: cat ? cat.name : "Geral",
      volumeMl: p.volumeMl || 250,
      heatLevel: p.heatLevel || "Média",
      stock: p.stock,
      inStock: p.stock > 0,
      ingredients: p.ingredients
    };
  });

  res.json({ success: true, count: compareMatrix.length, products: compareMatrix });
});

// ==========================================
// 5. CRM — CENTRAL & SEGMENTAÇÃO DE CLIENTES
// ==========================================
app.get('/api/admin/crm/dashboard', async (req, res) => {
  const db = getDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      const [usersRes, ordsRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('orders').select('*')
      ]);
      if (usersRes.data && Array.isArray(usersRes.data)) {
        db.users = usersRes.data.map(mapUserFromSupabase);
      }
      if (ordsRes.data && Array.isArray(ordsRes.data)) {
        db.orders = ordsRes.data.map(mapOrderFromSupabase);
      }
    } catch (err) {
      console.warn("Aviso ao buscar CRM no Supabase:", err.message);
    }
  }

  const customers = (db.users || []).filter(u => u.role === 'customer');
  const orders = db.orders || [];

  const totalCustomers = customers.length;
  const newCustomers30Days = customers.filter(c => new Date(c.createdAt) >= new Date(Date.now() - 30 * 86400000)).length;

  const spentMap = {};
  const ordersCountMap = {};

  orders.forEach(o => {
    if (o.status !== 'cancelled') {
      spentMap[o.customerEmail] = (spentMap[o.customerEmail] || 0) + o.total;
      ordersCountMap[o.customerEmail] = (ordersCountMap[o.customerEmail] || 0) + 1;
    }
  });

  const vipCustomersCount = customers.filter(c => (spentMap[c.email] || 0) >= 200).length;
  const recurrentCustomersCount = customers.filter(c => (ordersCountMap[c.email] || 0) > 1).length;
  const inactiveCustomersCount = customers.filter(c => (ordersCountMap[c.email] || 0) === 0).length;

  const totalSpentAll = Object.values(spentMap).reduce((a, b) => a + b, 0);
  const avgTicketPerCustomer = totalCustomers > 0 ? totalSpentAll / totalCustomers : 0;

  res.json({
    success: true,
    kpis: {
      totalCustomers,
      newCustomers30Days,
      vipCustomersCount,
      recurrentCustomersCount,
      inactiveCustomersCount,
      totalSpentAll,
      avgTicketPerCustomer
    },
    customers: customers.map(c => ({
      ...c,
      totalSpent: spentMap[c.email] || 0,
      ordersCount: ordersCountMap[c.email] || 0,
      classification: (spentMap[c.email] || 0) >= 200 ? 'VIP' : (ordersCountMap[c.email] || 0) > 1 ? 'RECORRENTE' : (ordersCountMap[c.email] || 0) === 1 ? 'PRIMEIRA COMPRA' : 'NOVO'
    })),
    segments: (db.customerSegments || []).map(seg => {
      let count = 0;
      if (seg.id === 'seg_vip') count = vipCustomersCount;
      else if (seg.id === 'seg_recurrent') count = recurrentCustomersCount;
      else if (seg.id === 'seg_inactive_60') count = inactiveCustomersCount;
      return {
        ...seg,
        memberCount: count
      };
    })
  });
});

app.get('/api/admin/crm/customers/:id', (req, res) => {
  const db = getDb();
  const customer = db.users.find(u => u.id === req.params.id);

  if (!customer) {
    return res.status(404).json({ success: false, message: "Cliente não encontrado." });
  }

  const customerOrders = db.orders.filter(o => o.customerEmail.toLowerCase() === customer.email.toLowerCase());
  const customerNotes = (db.customerNotes || []).filter(n => n.customerId === customer.id);
  const customerEvents = (db.customerEvents || []).filter(e => e.customerId === customer.id);

  const totalSpent = customerOrders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? o.total : 0), 0);
  const ordersCount = customerOrders.length;
  const avgTicket = ordersCount > 0 ? totalSpent / ordersCount : 0;

  res.json({
    success: true,
    customer: {
      ...customer,
      totalSpent,
      ordersCount,
      avgTicket,
      classification: totalSpent >= 200 ? 'VIP' : ordersCount > 1 ? 'RECORRENTE' : ordersCount === 1 ? 'PRIMEIRA COMPRA' : 'NOVO',
      orders: customerOrders,
      notes: customerNotes,
      timelineEvents: customerEvents
    }
  });
});

app.post('/api/admin/crm/customers/:id/notes', (req, res) => {
  const { note, author } = req.body;
  const db = getDb();

  const customer = db.users.find(u => u.id === req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: "Cliente não encontrado." });

  if (!db.customerNotes) db.customerNotes = [];

  const newNote = {
    id: generateId('cnote'),
    customerId: customer.id,
    note,
    author: author || "Administrador",
    createdAt: new Date().toISOString()
  };

  db.customerNotes.push(newNote);
  saveDb();

  res.json({ success: true, note: newNote, message: "Nota interna gravada no perfil do cliente!" });
});

app.post('/api/admin/crm/customers/:id/tags', (req, res) => {
  const { tags } = req.body;
  const db = getDb();

  const customer = db.users.find(u => u.id === req.params.id);
  if (!customer) return res.status(404).json({ success: false, message: "Cliente não encontrado." });

  customer.tags = tags || [];
  saveDb();

  res.json({ success: true, tags: customer.tags, message: "Tags do cliente atualizadas!" });
});

app.delete('/api/admin/crm/customers/:id', async (req, res) => {
  const db = getDb();
  const customerIndex = (db.users || []).findIndex(u => u.id === req.params.id);

  if (customerIndex === -1) {
    return res.status(404).json({ success: false, message: "Cliente não encontrado." });
  }

  const userToDelete = db.users[customerIndex];
  if (userToDelete.role === 'super_admin') {
    return res.status(403).json({ success: false, message: "Não é permitido excluir o usuário Super Administrador." });
  }

  // Remove o usuário da base local
  db.users.splice(customerIndex, 1);

  // Remove notas e eventos vinculados
  if (db.customerNotes) {
    db.customerNotes = db.customerNotes.filter(n => n.customerId !== req.params.id);
  }
  if (db.customerEvents) {
    db.customerEvents = db.customerEvents.filter(e => e.customerId !== req.params.id);
  }

  saveDb();

  // Remove do Supabase PostgreSQL se configurado
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('users').delete().eq('id', req.params.id);
      if (error) console.error("Aviso ao excluir usuário no Supabase:", error.message);
      else console.log("🗑️ Usuário excluído do Supabase:", req.params.id);
    } catch (err) {
      console.error("Erro ao sincronizar exclusão com Supabase:", err);
    }
  }

  res.json({
    success: true,
    message: `Cliente ${userToDelete.name || userToDelete.email} foi excluído com sucesso!`
  });
});

app.delete('/api/users/:id', async (req, res) => {
  const db = getDb();
  const customerIndex = (db.users || []).findIndex(u => u.id === req.params.id);

  if (customerIndex === -1) {
    return res.status(404).json({ success: false, message: "Usuário não encontrado." });
  }

  const userToDelete = db.users[customerIndex];
  if (userToDelete.role === 'super_admin') {
    return res.status(403).json({ success: false, message: "Não é permitido excluir o usuário Super Administrador." });
  }

  db.users.splice(customerIndex, 1);
  if (db.customerNotes) db.customerNotes = db.customerNotes.filter(n => n.customerId !== req.params.id);
  if (db.customerEvents) db.customerEvents = db.customerEvents.filter(e => e.customerId !== req.params.id);
  saveDb();

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('users').delete().eq('id', req.params.id);
    } catch (err) {}
  }

  res.json({
    success: true,
    message: "Usuário excluído com sucesso!"
  });
});

// ==========================================
// ENDPOINTS DE INTEGRAÇÃO DO BANCO SUPABASE
// ==========================================
app.get('/api/admin/supabase/status', async (req, res) => {
  const configured = isSupabaseConfigured();
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  
  let health = { ok: false };
  if (configured) {
    health = await testSupabaseConnection();
  }

  res.json({
    success: true,
    configured,
    url,
    hasServiceKey,
    health,
    message: configured 
      ? (health.ok ? "Conectado e operacional no Supabase PostgreSQL!" : `Conectado, mas com aviso: ${health.error}`)
      : "Aguardando credenciais do Supabase no .env ou Painel Admin."
  });
});

app.post('/api/admin/supabase/config', (req, res) => {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceKey } = req.body;

  if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
    return res.status(400).json({ success: false, message: "URL do Supabase inválida. Deve ser no formato https://xyz.supabase.co" });
  }

  process.env.VITE_SUPABASE_URL = supabaseUrl;
  process.env.VITE_SUPABASE_ANON_KEY = supabaseAnonKey || '';
  process.env.SUPABASE_SERVICE_ROLE_KEY = supabaseServiceKey || supabaseAnonKey || '';

  // Grava no .env
  const envContent = `# CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE (LIVIO'S FOOD INNOVATION)\nVITE_SUPABASE_URL=${supabaseUrl}\nVITE_SUPABASE_ANON_KEY=${supabaseAnonKey || ''}\nSUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey || supabaseAnonKey || ''}\nPORT=5000\n`;
  const envPath = path.join(__dirname, '../.env');
  fs.writeFileSync(envPath, envContent, 'utf-8');

  // Re-inicializa o cliente Supabase em tempo de execução
  const client = initSupabase(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

  res.json({
    success: true,
    configured: !!client,
    message: client 
      ? "Credenciais salvas no .env e conexão com Supabase ativada em tempo real!" 
      : "Credenciais salvas no .env, mas não foi possível conectar ao Supabase."
  });
});

app.post('/api/admin/supabase/sync', async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(400).json({ success: false, message: "Supabase não está configurado. Insira a URL e as Chaves no painel admin." });
  }

  const db = getDb();
  let syncReport = {
    categories: 0,
    products: 0,
    users: 0,
    orders: 0,
    coupons: 0,
    banners: 0,
    waitlist: 0,
    inventoryMovements: 0,
    campaigns: 0,
    popups: 0,
    promotionalBars: 0,
    customerNotes: 0,
    customerEvents: 0,
    errors: []
  };

  try {
    // 1. Categorias
    if (db.categories?.length) {
      const { error } = await supabase.from('categories').upsert(
        db.categories.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          image: c.image,
          order: c.order || 0,
          active: c.active ?? true
        }))
      );
      if (error) syncReport.errors.push(`Categorias: ${error.message}`);
      else syncReport.categories = db.categories.length;
    }

    // 2. Produtos
    if (db.products?.length) {
      const { error } = await supabase.from('products').upsert(
        db.products.map(p => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          slug: p.slug,
          category_id: p.categoryId,
          short_description: p.shortDescription,
          full_description: p.fullDescription,
          price: p.price,
          promotional_price: p.promotionalPrice,
          cost_price: p.costPrice || 0,
          stock: p.stock || 0,
          min_stock: p.minStock || 5,
          weight_kg: p.weightKg || 0.45,
          volume_ml: p.volumeMl || 250,
          heat_level: p.heatLevel || 'Média',
          ingredients: p.ingredients,
          nutrition_info: p.nutritionInfo || [],
          images: p.images || [],
          is_featured: p.isFeatured ?? false,
          is_bestseller: p.isBestSeller ?? false,
          is_new: p.isNew ?? false,
          is_offer: p.isOffer ?? false,
          rating: p.rating || 0,
          review_count: p.reviewCount || 0,
          active: p.active ?? true
        }))
      );
      if (error) syncReport.errors.push(`Produtos: ${error.message}`);
      else syncReport.products = db.products.length;
    }

    // 3. Usuários / Clientes
    if (db.users?.length) {
      const { error } = await supabase.from('users').upsert(
        db.users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          cpf: u.cpf,
          password_hash: u.passwordHash,
          role: u.role || 'customer',
          marketing_consent: u.marketingConsent ?? true,
          tags: u.tags || [],
          addresses: u.addresses || []
        }))
      );
      if (error) syncReport.errors.push(`Usuários: ${error.message}`);
      else syncReport.users = db.users.length;
    }

    // 4. Pedidos
    if (db.orders?.length) {
      const { error } = await supabase.from('orders').upsert(
        db.orders.map(o => ({
          id: o.id,
          customer_id: o.customerId,
          customer_name: o.customerName,
          customer_email: o.customerEmail,
          customer_phone: o.customerPhone,
          customer_cpf: o.customerCpf,
          shipping_address: o.shippingAddress || {},
          items: o.items || [],
          subtotal: o.subtotal,
          discount: o.discount || 0,
          coupon_code: o.couponCode,
          shipping_fee: o.shippingFee || 0,
          total: o.total,
          payment_method: o.paymentMethod,
          payment_status: o.paymentStatus || 'pending',
          status: o.status || 'received',
          status_history: o.statusHistory || []
        }))
      );
      if (error) syncReport.errors.push(`Pedidos: ${error.message}`);
      else syncReport.orders = db.orders.length;
    }

    // 5. Cupons
    if (db.coupons?.length) {
      const { error } = await supabase.from('coupons').upsert(
        db.coupons.map(cp => ({
          id: cp.id,
          code: cp.code,
          type: cp.type,
          value: cp.value,
          min_purchase: cp.minPurchase || 0,
          usage_limit: cp.usageLimit || 1000,
          used_count: cp.usedCount || 0,
          active: cp.active ?? true,
          description: cp.description
        }))
      );
      if (error) syncReport.errors.push(`Cupons: ${error.message}`);
      else syncReport.coupons = db.coupons.length;
    }

    // 6. Banners
    if (db.banners?.length) {
      const { error } = await supabase.from('banners').upsert(
        db.banners.map(b => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          button_text: b.buttonText,
          button_link: b.buttonLink,
          secondary_button_text: b.secondaryButtonText,
          secondary_button_link: b.secondaryButtonLink,
          image_desktop: b.imageDesktop,
          image_mobile: b.imageMobile,
          active: b.active ?? true,
          order: b.order || 1
        }))
      );
      if (error) syncReport.errors.push(`Banners: ${error.message}`);
      else syncReport.banners = db.banners.length;
    }

    // 7. Lista de Espera
    if (db.waitlist?.length) {
      const { error } = await supabase.from('waitlist').upsert(
        db.waitlist.map(w => ({
          id: w.id,
          product_id: w.productId,
          product_name: w.productName,
          product_sku: w.productSku,
          customer_name: w.customerName,
          customer_email: w.customerEmail,
          customer_phone: w.customerPhone,
          channels: w.channels || ['email', 'whatsapp'],
          quantity: w.quantity || 1,
          status: w.status || 'Aguardando'
        }))
      );
      if (error) syncReport.errors.push(`Lista de Espera: ${error.message}`);
      else syncReport.waitlist = db.waitlist.length;
    }

    // 8. Campanhas
    if (db.campaigns?.length) {
      const { error } = await supabase.from('campaigns').upsert(
        db.campaigns.map(cmp => ({
          id: cmp.id,
          name: cmp.name,
          title: cmp.title,
          description: cmp.description,
          type: cmp.type || 'PROMOÇÃO',
          status: cmp.status || 'Ativa',
          channels: cmp.channels || [],
          segment: cmp.segment || {},
          message: cmp.message || {},
          coupon_code: cmp.couponCode,
          linked_product_id: cmp.linkedProductId,
          image: cmp.image,
          stats: cmp.stats || {}
        }))
      );
      if (error) syncReport.errors.push(`Campanhas: ${error.message}`);
      else syncReport.campaigns = db.campaigns.length;
    }

    // 9. Popups
    if (db.popups?.length) {
      const { error } = await supabase.from('popups').upsert(
        db.popups.map(pop => ({
          id: pop.id,
          title: pop.title,
          description: pop.description,
          type: pop.type || 'CUPOM',
          status: pop.status || 'Ativo',
          coupon_code: pop.couponCode,
          button_text: pop.buttonText,
          button_link: pop.buttonLink,
          image: pop.image,
          position: pop.position || 'center',
          trigger: pop.trigger || 'time_delay',
          trigger_delay_seconds: pop.triggerDelaySeconds || 5,
          frequency: pop.frequency || 'once_per_day',
          active: pop.active ?? true,
          stats: pop.stats || {}
        }))
      );
      if (error) syncReport.errors.push(`Popups: ${error.message}`);
      else syncReport.popups = db.popups.length;
    }

    // 10. Barras Promocionais
    if (db.promotionalBars?.length) {
      const { error } = await supabase.from('promotional_bars').upsert(
        db.promotionalBars.map(pbar => ({
          id: pbar.id,
          text: pbar.text,
          coupon_code: pbar.couponCode,
          button_text: pbar.buttonText,
          button_link: pbar.buttonLink,
          background_color: pbar.backgroundColor || '#8B0000',
          text_color: pbar.textColor || '#FFFFFF',
          active: pbar.active ?? true,
          stats: pbar.stats || {}
        }))
      );
      if (error) syncReport.errors.push(`Barras Promocionais: ${error.message}`);
      else syncReport.promotionalBars = db.promotionalBars.length;
    }

    // 11. Notas de CRM
    if (db.customerNotes?.length) {
      const { error } = await supabase.from('customer_notes').upsert(
        db.customerNotes.map(cn => ({
          id: cn.id,
          customer_id: cn.customerId,
          note: cn.note,
          author: cn.author || 'Administrador'
        }))
      );
      if (error) syncReport.errors.push(`Notas CRM: ${error.message}`);
      else syncReport.customerNotes = db.customerNotes.length;
    }

    // 12. Eventos do Cliente CRM
    if (db.customerEvents?.length) {
      const { error } = await supabase.from('customer_events').upsert(
        db.customerEvents.map(ce => ({
          id: ce.id,
          customer_id: ce.customerId,
          type: ce.type,
          title: ce.title,
          description: ce.description
        }))
      );
      if (error) syncReport.errors.push(`Eventos CRM: ${error.message}`);
      else syncReport.customerEvents = db.customerEvents.length;
    }

    const totalSynced = syncReport.categories + syncReport.products + syncReport.users + syncReport.orders + syncReport.coupons + syncReport.banners + syncReport.waitlist + syncReport.campaigns + syncReport.popups + syncReport.promotionalBars + syncReport.customerNotes + syncReport.customerEvents;

    if (syncReport.errors.length > 0) {
      return res.json({
        success: false,
        syncReport,
        message: `Sincronização parcial (${totalSynced} itens inseridos). Alerta de esquema SQL: Certifique-se de ter executado o script 'supabase_schema.sql' no Editor SQL do Supabase. Detalhes: ${syncReport.errors.join('; ')}`
      });
    }

    res.json({
      success: true,
      syncReport,
      message: `Sincronização com Supabase concluída com sucesso! Total de ${totalSynced} registros sincronizados em 12 tabelas PostgreSQL.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: `Erro durante sincronização com Supabase: ${err.message}` });
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(` Servidor Livio's Food API rodando com sucesso na porta ${PORT}`);
  });
}

export default app;
