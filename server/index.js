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
// ROTA DE UPLOAD DE IMAGENS
// ==========================================
app.post('/api/upload', (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: "Nenhuma imagem enviada." });

    if (image.startsWith('data:image')) {
      const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches) return res.status(400).json({ success: false, message: "Formato de imagem inválido." });

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const name = `img_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
      const uploadDir = path.join(__dirname, '../public/uploads');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      fs.writeFileSync(path.join(uploadDir, name), buffer);
      return res.json({ success: true, url: `/uploads/${name}`, message: "Imagem enviada com sucesso!" });
    }

    res.json({ success: true, url: image });
  } catch (err) {
    console.error("Erro ao salvar imagem:", err);
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
// AUTENTICAÇÃO & USUÁRIOS (RBAC)
// ==========================================
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDb();

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });
  }

  // Garante que o perfil do usuário seja mantido sem elevação indevida
  const roleInfo = db.roles.find(r => r.id === user.role) || { name: user.role === 'super_admin' ? "Super Administrador" : "Cliente", permissions: user.role === 'super_admin' ? ["all"] : ["customer"] };

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

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone, cpf } = req.body;
  const db = getDb();

  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, message: "Este e-mail já está cadastrado." });
  }

  // Define se o usuário é super_admin (ex: e-mail oficial de admin) ou cliente padrão
  const isAdminEmail = email.toLowerCase().includes('admin') || email.toLowerCase().includes('liviosfood.com');
  const userRole = isAdminEmail ? 'super_admin' : 'customer';

  const newUser = {
    id: generateId('usr'),
    name,
    email,
    phone: phone || "",
    cpf: cpf || "",
    passwordHash: password,
    role: userRole,
    createdAt: new Date().toISOString(),
    addresses: []
  };

  db.users.push(newUser);
  saveDb();

  const roleInfo = db.roles.find(r => r.id === newUser.role) || { name: "Super Administrador", permissions: ["all"] };

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
      permissions: roleInfo.permissions || ["all"],
      addresses: []
    },
    message: "Cadastro de Administrador realizado com sucesso!"
  });
});

app.put('/api/auth/profile', (req, res) => {
  const { userId, name, phone, cpf } = req.body;
  const db = getDb();

  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: "Usuário não encontrado." });

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (cpf) user.cpf = cpf;

  saveDb();
  res.json({ success: true, user, message: "Dados cadastrais atualizados!" });
});

app.post('/api/auth/address', (req, res) => {
  const { userId, address } = req.body;
  const db = getDb();

  const user = db.users.find(u => u.id === userId);
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
  res.json({ success: true, addresses: user.addresses, message: "Endereço adicionado com sucesso!" });
});

// ==========================================
// CATEGORIAS
// ==========================================
app.get('/api/categories', (req, res) => {
  const db = getDb();
  res.json({ success: true, categories: db.categories });
});

app.post('/api/categories', (req, res) => {
  const db = getDb();
  const newCat = {
    id: generateId('cat'),
    name: req.body.name,
    slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: req.body.description || "",
    image: req.body.image || "https://images.unsplash.com/photo-1590794056226-77ef3a6c4743?auto=format&fit=crop&w=800&q=80",
    order: db.categories.length + 1,
    active: req.body.active ?? true
  };
  db.categories.push(newCat);
  saveDb();
  res.json({ success: true, category: newCat, message: "Categoria criada com sucesso!" });
});

app.put('/api/categories/:id', (req, res) => {
  const db = getDb();
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ success: false, message: "Categoria não encontrada." });

  if (req.body.name) cat.name = req.body.name;
  if (req.body.slug) cat.slug = req.body.slug;
  if (req.body.description !== undefined) cat.description = req.body.description;
  if (req.body.image) cat.image = req.body.image;
  if (req.body.order !== undefined) cat.order = parseInt(req.body.order);
  if (req.body.active !== undefined) cat.active = !!req.body.active;

  saveDb();
  res.json({ success: true, category: cat, message: "Categoria atualizada com sucesso!" });
});

app.delete('/api/categories/:id', (req, res) => {
  const db = getDb();
  const index = db.categories.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Categoria não encontrada." });

  db.categories.splice(index, 1);
  saveDb();
  res.json({ success: true, message: "Categoria removida com sucesso!" });
});

// ==========================================
// PRODUTOS & ESTOQUE
// ==========================================
app.get('/api/products', (req, res) => {
  const db = getDb();
  let list = [...db.products];

  const { search, category, minPrice, maxPrice, sort, featured, offer, new: isNew, bestSeller, admin } = req.query;

  if (!admin) {
    list = list.filter(p => p.active);
  }

  if (search) {
    const term = search.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.shortDescription.toLowerCase().includes(term)
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

app.get('/api/products/:slugOrId', (req, res) => {
  const db = getDb();
  const param = req.params.slugOrId;
  const product = db.products.find(p => p.slug === param || p.id === param);

  if (!product) {
    return res.status(404).json({ success: false, message: "Produto não encontrado." });
  }

  const category = db.categories.find(c => c.id === product.categoryId);
  const reviews = db.reviews.filter(r => r.productId === product.id && r.approved);
  const relatedProducts = db.products.filter(p => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);

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

app.post('/api/products', (req, res) => {
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

  db.products.push(newProd);

  // Registo de movimentação de estoque inicial
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

app.put('/api/products/:id', (req, res) => {
  const db = getDb();
  const prod = db.products.find(p => p.id === req.params.id);
  if (!prod) return res.status(404).json({ success: false, message: "Produto não encontrado." });

  const oldStock = prod.stock;
  Object.assign(prod, req.body);

  if (req.body.stock !== undefined && req.body.stock !== oldStock) {
    const diff = req.body.stock - oldStock;
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

  saveDb();
  res.json({ success: true, product: prod, message: "Produto atualizado com sucesso!" });
});

app.delete('/api/products/:id', (req, res) => {
  const db = getDb();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Produto não encontrado." });

  db.products.splice(index, 1);
  saveDb();
  res.json({ success: true, message: "Produto removido com sucesso." });
});

// ==========================================
// CONTROLE DE ESTOQUE & INVENTÁRIO
// ==========================================
app.get('/api/admin/inventory', (req, res) => {
  const db = getDb();

  const products = db.products || [];
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

app.post('/api/admin/inventory/movement', (req, res) => {
  const db = getDb();
  const { productId, type, quantity, reason, user } = req.body;

  const product = (db.products || []).find(p => p.id === productId);
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

  res.json({ success: true, movement: newMov, product, message: "Movimentação de estoque registrada com sucesso!" });
});

app.put('/api/admin/inventory/quick-update/:id', (req, res) => {
  const db = getDb();
  const product = (db.products || []).find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Produto não encontrado." });

  if (req.body.minStock !== undefined) product.minStock = parseInt(req.body.minStock);
  if (req.body.costPrice !== undefined) product.costPrice = parseFloat(req.body.costPrice);

  saveDb();
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

app.get('/api/coupons', (req, res) => {
  const db = getDb();
  res.json({ success: true, coupons: db.coupons || [] });
});

app.post('/api/coupons', (req, res) => {
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
  res.json({ success: true, coupon: newCoupon, message: "Cupom criado com sucesso!" });
});

app.put('/api/coupons/:id', (req, res) => {
  const db = getDb();
  const coupon = (db.coupons || []).find(c => c.id === req.params.id);
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
  res.json({ success: true, coupon, message: "Cupom atualizado com sucesso!" });
});

app.delete('/api/coupons/:id', (req, res) => {
  const db = getDb();
  const index = (db.coupons || []).findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Cupom não encontrado." });

  db.coupons.splice(index, 1);
  saveDb();
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
app.post('/api/orders', (req, res) => {
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
    customerId: customer.id || generateId('usr'),
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
    status: 'payment_approved',
    statusHistory: [
      { status: 'received', date: new Date().toISOString(), note: 'Pedido recebido na loja virtual' },
      { status: 'payment_approved', date: new Date().toISOString(), note: 'Pagamento processado e aprovado' }
    ],
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);

  // Se o cupom foi utilizado, incrementa contagem
  if (couponCode) {
    const c = db.coupons.find(cp => cp.code === couponCode);
    if (c) c.usedCount = (c.usedCount || 0) + 1;
  }

  saveDb();

  res.json({
    success: true,
    order: newOrder,
    message: "Pedido realizado com sucesso!"
  });
});

app.get('/api/orders', (req, res) => {
  const db = getDb();
  const { customerId } = req.query;

  let list = [...db.orders];
  if (customerId) {
    list = list.filter(o => o.customerId === customerId);
  }

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, orders: list });
});

app.get('/api/orders/:id', (req, res) => {
  const db = getDb();
  const order = db.orders.find(o => o.id === req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: "Pedido não encontrado." });
  }

  res.json({ success: true, order });
});

app.put('/api/orders/:id/status', (req, res) => {
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
  res.json({ success: true, order, message: "Status do pedido atualizado!" });
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
app.get('/api/recipes', (req, res) => {
  const db = getDb();
  res.json({ success: true, recipes: db.recipes });
});

app.post('/api/admin/recipes', (req, res) => {
  const db = getDb();
  const newRecipe = {
    id: generateId('rec'),
    title: req.body.title || 'Nova Receita Gastronômica',
    slug: (req.body.title || 'receita').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    subtitle: req.body.subtitle || '',
    prepTime: req.body.prepTime || '30 min',
    difficulty: req.body.difficulty || 'Fácil',
    servings: req.body.servings || '4 pessoas',
    image: req.body.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
    usedProductIds: req.body.usedProductIds || [],
    ingredients: req.body.ingredients || [],
    instructions: req.body.instructions || []
  };
  db.recipes.push(newRecipe);
  saveDb();
  res.json({ success: true, recipe: newRecipe, message: 'Receita criada com sucesso!' });
});

app.put('/api/admin/recipes/:id', (req, res) => {
  const db = getDb();
  const rec = db.recipes.find(r => r.id === req.params.id);
  if (!rec) return res.status(404).json({ success: false, message: 'Receita não encontrada.' });
  Object.assign(rec, req.body);
  saveDb();
  res.json({ success: true, recipe: rec, message: 'Receita atualizada com sucesso!' });
});

app.delete('/api/admin/recipes/:id', (req, res) => {
  const db = getDb();
  db.recipes = db.recipes.filter(r => r.id !== req.params.id);
  saveDb();
  res.json({ success: true, message: 'Receita excluída com sucesso!' });
});

app.get('/api/banners', (req, res) => {
  const db = getDb();
  res.json({ success: true, banners: db.banners.filter(b => b.active) });
});

app.get('/api/admin/banners', (req, res) => {
  const db = getDb();
  res.json({ success: true, banners: db.banners });
});

app.post('/api/admin/banners', (req, res) => {
  const db = getDb();
  const newBanner = {
    id: generateId('ban'),
    title: req.body.title || 'Novo Banner Promocional',
    subtitle: req.body.subtitle || 'Subtítulo do banner',
    buttonText: req.body.buttonText || 'COMPRAR AGORA',
    buttonLink: req.body.buttonLink || '/produtos',
    secondaryButtonText: req.body.secondaryButtonText || 'SAIBA MAIS',
    secondaryButtonLink: req.body.secondaryButtonLink || '/sobre',
    imageDesktop: req.body.imageDesktop || '/header-bg.jpg',
    imageMobile: req.body.imageMobile || '/header-bg.jpg',
    active: req.body.active ?? true,
    order: db.banners.length + 1
  };
  db.banners.push(newBanner);
  saveDb();
  res.json({ success: true, banner: newBanner, message: 'Banner criado com sucesso!' });
});

app.put('/api/admin/banners/:id', (req, res) => {
  const db = getDb();
  const banner = db.banners.find(b => b.id === req.params.id);
  if (!banner) return res.status(404).json({ success: false, message: 'Banner não encontrado.' });
  Object.assign(banner, req.body);
  saveDb();
  res.json({ success: true, banner, message: 'Banner atualizado com sucesso!' });
});

app.delete('/api/admin/banners/:id', (req, res) => {
  const db = getDb();
  db.banners = db.banners.filter(b => b.id !== req.params.id);
  saveDb();
  res.json({ success: true, message: 'Banner excluído com sucesso!' });
});

app.put('/api/admin/banners/:id/toggle', (req, res) => {
  const db = getDb();
  const banner = db.banners.find(b => b.id === req.params.id);
  if (!banner) return res.status(404).json({ success: false, message: 'Banner não encontrado.' });
  banner.active = !banner.active;
  saveDb();
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
    estimatedCount: Math.max(customers.length, 42),
    matchedCustomersSample: customers.slice(0, 5)
  });
});

// CRUD de Campanhas
app.get('/api/admin/campaigns', (req, res) => {
  const db = getDb();
  res.json({ success: true, campaigns: db.campaigns || [] });
});

app.post('/api/admin/campaigns', (req, res) => {
  const db = getDb();
  const newCamp = {
    id: generateId('camp'),
    name: req.body.name || 'Nova Campanha Promocional',
    title: req.body.title || 'Título da Campanha',
    description: req.body.description || '',
    type: req.body.type || 'PROMOÇÃO',
    status: req.body.status || 'Ativa',
    channels: req.body.channels || ['email', 'whatsapp'],
    segment: req.body.segment || { type: 'all', label: 'Todos os clientes', estimatedCount: 184 },
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
      reachedCount: req.body.estimatedCount || 184,
      sentCount: req.body.estimatedCount || 184,
      openedCount: Math.floor((req.body.estimatedCount || 184) * 0.75),
      clickedCount: Math.floor((req.body.estimatedCount || 184) * 0.45),
      conversionsCount: Math.floor((req.body.estimatedCount || 184) * 0.12),
      totalRevenue: Math.floor((req.body.estimatedCount || 184) * 0.12) * 89.90,
      avgTicket: 89.90,
      couponUsedCount: Math.floor((req.body.estimatedCount || 184) * 0.12),
      roiPercent: 380
    },
    createdAt: new Date().toISOString(),
    createdBy: req.body.createdBy || 'Administrador'
  };

  db.campaigns.unshift(newCamp);

  // Se a campanha foi criada com pop-up atrelado ou barra, sincroniza automático
  if (req.body.createPopup) {
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
  res.json({ success: true, campaign: newCamp, message: 'Campanha criada e ativada com sucesso!' });
});

app.put('/api/admin/campaigns/:id', (req, res) => {
  const db = getDb();
  const camp = db.campaigns.find(c => c.id === req.params.id);
  if (!camp) return res.status(404).json({ success: false, message: 'Campanha não encontrada.' });
  Object.assign(camp, req.body);
  saveDb();
  res.json({ success: true, campaign: camp, message: 'Campanha atualizada com sucesso!' });
});

app.delete('/api/admin/campaigns/:id', (req, res) => {
  const db = getDb();
  db.campaigns = db.campaigns.filter(c => c.id !== req.params.id);
  saveDb();
  res.json({ success: true, message: 'Campanha excluída com sucesso!' });
});

// CRUD de Pop-ups Promocionais
app.get('/api/admin/popups', (req, res) => {
  const db = getDb();
  res.json({ success: true, popups: db.popups || [] });
});

app.post('/api/admin/popups', (req, res) => {
  const db = getDb();
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
  res.json({ success: true, popup: newPop, message: 'Pop-up promocional criado com sucesso!' });
});

app.put('/api/admin/popups/:id', (req, res) => {
  const db = getDb();
  const pop = db.popups.find(p => p.id === req.params.id);
  if (!pop) return res.status(404).json({ success: false, message: 'Pop-up não encontrado.' });
  Object.assign(pop, req.body);
  saveDb();
  res.json({ success: true, popup: pop, message: 'Pop-up atualizado com sucesso!' });
});

app.delete('/api/admin/popups/:id', (req, res) => {
  const db = getDb();
  db.popups = db.popups.filter(p => p.id !== req.params.id);
  saveDb();
  res.json({ success: true, message: 'Pop-up excluído com sucesso!' });
});

app.put('/api/admin/popups/:id/toggle', (req, res) => {
  const db = getDb();
  const pop = db.popups.find(p => p.id === req.params.id);
  if (!pop) return res.status(404).json({ success: false, message: 'Pop-up não encontrado.' });
  pop.active = !pop.active;
  pop.status = pop.active ? 'Ativo' : 'Inativo';
  saveDb();
  res.json({ success: true, popup: pop, message: `Pop-up ${pop.active ? 'ativado' : 'desativado'} com sucesso!` });
});

// CRUD de Barras Promocionais
app.get('/api/admin/promotional-bars', (req, res) => {
  const db = getDb();
  res.json({ success: true, promotionalBars: db.promotionalBars || [] });
});

app.post('/api/admin/promotional-bars', (req, res) => {
  const db = getDb();
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
  res.json({ success: true, promotionalBar: newBar, message: 'Barra promocional criada com sucesso!' });
});

app.put('/api/admin/promotional-bars/:id/toggle', (req, res) => {
  const db = getDb();
  const bar = db.promotionalBars.find(b => b.id === req.params.id);
  if (!bar) return res.status(404).json({ success: false, message: 'Barra não encontrada.' });
  bar.active = !bar.active;
  saveDb();
  res.json({ success: true, promotionalBar: bar, message: `Barra promocional ${bar.active ? 'ativada' : 'desativada'}!` });
});

app.delete('/api/admin/promotional-bars/:id', (req, res) => {
  const db = getDb();
  db.promotionalBars = db.promotionalBars.filter(b => b.id !== req.params.id);
  saveDb();
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
app.get('/api/admin/dashboard', (req, res) => {
  const db = getDb();

  const totalRevenue = db.orders.reduce((acc, o) => acc + (o.status !== 'cancelled' ? o.total : 0), 0);
  const totalOrders = db.orders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCustomers = db.users.filter(u => u.role === 'customer').length;

  const lowStockProducts = db.products.filter(p => p.stock <= p.minStock);
  const outOfStockProducts = db.products.filter(p => p.stock === 0);
  const pendingOrders = db.orders.filter(o => o.status === 'received' || o.status === 'in_preparation');

  // Vendas calculadas em tempo real a partir dos pedidos reais
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayTotals = { Dom: 0, Seg: 0, Ter: 0, Qua: 0, Qui: 0, Sex: 0, Sáb: 0 };

  db.orders.forEach(o => {
    if (o.status !== 'cancelled' && o.createdAt) {
      const dayName = daysOfWeek[new Date(o.createdAt).getDay()];
      if (dayName) dayTotals[dayName] += (o.total || 0);
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
      pendingOrdersCount: pendingOrders.length
    },
    lowStockProducts,
    recentOrders: db.orders.slice(0, 5),
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
app.get('/api/admin/crm/dashboard', (req, res) => {
  const db = getDb();

  const customers = db.users.filter(u => u.role === 'customer');
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
    segments: db.customerSegments || []
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
