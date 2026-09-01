import React, { useState, useEffect } from 'react';
import { Warehouse, ArrowUpRight, ArrowDownRight, RefreshCw, Plus, AlertTriangle, PackageCheck, DollarSign, Filter, Search, Check, X, ShieldAlert, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function AdminInventory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'low', 'out', 'normal'
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { user } = useAuth();
  const { addToast } = useToast();

  const [movementForm, setMovementForm] = useState({
    productId: '',
    type: 'entry', // 'entry', 'exit', 'adjustment', 'damage'
    quantity: '10',
    reason: 'Entrada de lote de produção'
  });

  const fetchInventory = () => {
    fetch('/api/admin/inventory')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenMovement = (prod = null) => {
    if (prod) {
      setSelectedProduct(prod);
      setMovementForm({
        productId: prod.id,
        type: 'entry',
        quantity: '10',
        reason: `Entrada de estoque para ${prod.name}`
      });
    } else {
      setSelectedProduct(null);
      setMovementForm({
        productId: data?.products[0]?.id || '',
        type: 'entry',
        quantity: '10',
        reason: 'Entrada de lote de produção'
      });
    }
    setIsMovementModalOpen(true);
  };

  const handleSaveMovement = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/inventory/movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...movementForm,
          user: user?.name || 'Administrador'
        })
      });

      const d = await res.json();
      if (d.success) {
        addToast(d.message || "Movimentação registrada com sucesso!", "success");
        setIsMovementModalOpen(false);
        fetchInventory();
      } else {
        addToast(d.message || "Erro ao movimentar estoque.", "error");
      }
    } catch (err) {
      addToast("Erro de comunicação ao registrar movimento.", "error");
    }
  };

  const handleQuickUpdateParams = async (prodId, minStock, costPrice) => {
    try {
      const res = await fetch(`/api/admin/inventory/quick-update/${prodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minStock, costPrice })
      });
      const d = await res.json();
      if (d.success) {
        addToast("Parâmetros do produto atualizados!", "success");
        fetchInventory();
      }
    } catch (err) {
      addToast("Erro ao atualizar parâmetros.", "error");
    }
  };

  if (loading || !data) {
    return <div style={{ padding: '3rem', textAlign: 'center', fontWeight: 'bold' }}>Carregando dados de estoque...</div>;
  }

  const { kpis, products, movements } = data;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'low') return p.stock <= p.minStock && p.stock > 0;
    if (statusFilter === 'out') return p.stock <= 0;
    if (statusFilter === 'normal') return p.stock > p.minStock;
    return true;
  });

  return (
    <div>
      {/* Header com Botão de Movimentação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-serif)', color: 'var(--text-dark)' }}>
            Controle de Estoque & Inventário
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Monitore o saldo em almoxarifado, registre entradas, saídas, perdas e histórico de movimentações.
          </p>
        </div>

        <button onClick={() => handleOpenMovement()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> + NOVA MOVIMENTAÇÃO DE ESTOQUE
        </button>
      </div>

      {/* KPI Cards de Estoque */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', background: 'rgba(139,0,0,0.08)', color: 'var(--primary-burgundy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Warehouse size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Unidades em Estoque</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-dark)' }}>{kpis.totalStockUnits} un</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpis.totalProductsCount} SKUs ativos</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Valor a Preço de Custo</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#10B981' }}>
                R$ {kpis.totalStockValueCost.toFixed(2).replace('.', ',')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Investimento armazenado</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Estoque Baixo</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#F59E0B' }}>{kpis.lowStockCount} itens</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saldo &lt;= mínimo de segurança</div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="admin-card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageCheck size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Itens Esgotados</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#EF4444' }}>{kpis.outOfStockCount} itens</div>
              <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 'bold' }}>Requer produção imediata</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabela de Posicionamento de Estoque por Produto */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
              Posição de Saldo por Produto
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gerencie unidades disponíveis e alertas de reposição</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="search-bar-wrap" style={{ width: '220px' }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por SKU ou Nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--light-border)', background: '#FAF8F4', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <option value="all">Todos os Status</option>
              <option value="normal">Estoque Normal</option>
              <option value="low">Estoque Baixo</option>
              <option value="out">Esgotados</option>
            </select>
          </div>
        </div>

        <table className="table-custom">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Produto</th>
              <th>Preço Custo</th>
              <th>Preço Venda</th>
              <th>Estoque Atual</th>
              <th>Mínimo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id}>
                <td><strong style={{ color: 'var(--primary-burgundy)' }}>{p.sku}</strong></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={p.images[0] || '/header-bg.jpg'} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                  </div>
                </td>
                <td>R$ {p.costPrice ? p.costPrice.toFixed(2).replace('.', ',') : '0,00'}</td>
                <td style={{ fontWeight: 'bold' }}>R$ {p.price.toFixed(2).replace('.', ',')}</td>
                <td style={{ fontWeight: '800', fontSize: '1.05rem', color: p.stock <= 0 ? '#EF4444' : p.stock <= p.minStock ? '#F59E0B' : '#10B981' }}>
                  {p.stock} un
                </td>
                <td>
                  <input
                    type="number"
                    defaultValue={p.minStock}
                    onBlur={(e) => handleQuickUpdateParams(p.id, parseInt(e.target.value), p.costPrice)}
                    style={{ width: '60px', padding: '4px 6px', borderRadius: '4px', border: '1px solid var(--light-border)', textIndent: '4px', fontWeight: 'bold' }}
                  /> un
                </td>
                <td>
                  {p.stock <= 0 ? (
                    <span style={{ background: '#EF4444', color: '#FFF', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 'bold' }}>ESGOTADO</span>
                  ) : p.stock <= p.minStock ? (
                    <span style={{ background: '#F59E0B', color: '#FFF', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 'bold' }}>ESTOQUE BAIXO</span>
                  ) : (
                    <span style={{ background: '#10B981', color: '#FFF', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 'bold' }}>NORMAL</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => handleOpenMovement(p)}
                    className="btn btn-outline"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                  >
                    MOVIMENTAR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Histórico Kardex de Movimentações */}
      <div className="admin-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
          <History size={22} color="var(--primary-burgundy)" />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', fontFamily: 'var(--font-serif)' }}>
            Histórico de Movimentações de Estoque (Kardex)
          </h3>
        </div>

        <table className="table-custom">
          <thead>
            <tr>
              <th>Data & Hora</th>
              <th>Produto / SKU</th>
              <th>Tipo de Movimento</th>
              <th>Quantidade</th>
              <th>Saldo (Antes → Depois)</th>
              <th>Motivo / Justificativa</th>
              <th>Responsável</th>
            </tr>
          </thead>
          <tbody>
            {movements.map(m => (
              <tr key={m.id}>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {new Date(m.date).toLocaleString('pt-BR')}
                </td>
                <td>
                  <strong>{m.productSku || 'SKU'}</strong> — {m.productName || 'Produto'}
                </td>
                <td>
                  {m.type === 'entry' && <span style={{ color: '#10B981', fontWeight: 'bold', background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: '4px' }}>ENTRADA (+)</span>}
                  {m.type === 'exit' && <span style={{ color: '#EF4444', fontWeight: 'bold', background: 'rgba(239,68,68,0.12)', padding: '3px 8px', borderRadius: '4px' }}>SAÍDA (-)</span>}
                  {m.type === 'damage' && <span style={{ color: '#EF4444', fontWeight: 'bold', background: 'rgba(239,68,68,0.2)', padding: '3px 8px', borderRadius: '4px' }}>AVARIA / PERDA</span>}
                  {m.type === 'adjustment' && <span style={{ color: '#3B82F6', fontWeight: 'bold', background: 'rgba(59,130,246,0.12)', padding: '3px 8px', borderRadius: '4px' }}>AJUSTE</span>}
                </td>
                <td style={{ fontWeight: 'bold', fontSize: '1rem' }}>{m.quantity} un</td>
                <td>{m.previousStock} un → <strong>{m.newStock} un</strong></td>
                <td style={{ fontSize: '0.85rem' }}>{m.reason}</td>
                <td style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>{m.user}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Nova Movimentação Manual */}
      <AnimatePresence>
        {isMovementModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
            onClick={() => setIsMovementModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: '#FFF', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '580px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--light-border)', paddingBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>
                  Registrar Movimentação de Estoque
                </h3>
                <button onClick={() => setIsMovementModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X size={22} color="var(--text-dark)" />
                </button>
              </div>

              <form onSubmit={handleSaveMovement} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Selecione o Produto *</label>
                  <select
                    value={movementForm.productId}
                    onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.sku} — {p.name} (Atual: {p.stock} un)</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Tipo de Movimentação *</label>
                    <select
                      value={movementForm.type}
                      onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    >
                      <option value="entry">Entrada (Lote de Produção)</option>
                      <option value="exit">Saída (Venda Externa / Manual)</option>
                      <option value="adjustment">Ajuste de Balanço (Novo Saldo)</option>
                      <option value="damage">Perda / Avaria / Validade Vencida</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Quantidade *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={movementForm.quantity}
                      onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Motivo / Justificativa *</label>
                  <input
                    type="text"
                    required
                    value={movementForm.reason}
                    onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                    placeholder="Ex: Fabricação de novo lote de 150 garrafas"
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--light-border)' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--light-border)', paddingTop: '1rem' }}>
                  <button type="button" onClick={() => setIsMovementModalOpen(false)} className="btn btn-outline">
                    CANCELAR
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Check size={18} /> SALVAR MOVIMENTAÇÃO
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
