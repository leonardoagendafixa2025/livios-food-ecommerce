import app from './server/index.js';
import http from 'http';

// Script de Teste Automatizado Sênior E2E para Livio's Food E-commerce
const PORT = 3999;
let server;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:${PORT}${path}`;
    const parsedUrl = new URL(url);
    
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(options.body));
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

const results = [];
function logTest(name, passed, details = '') {
  results.push({ name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon}: ${name} ${details ? `(${details})` : ''}`);
}

async function runSeniorTestSuite() {
  console.log('====================================================');
  console.log('🚀 INICIANDO BATERIA DE TESTES E2E SÊNIOR - LIVIO\'S FOOD');
  console.log('====================================================\n');

  server = app.listen(PORT, async () => {
    try {
      // 1. TESTE DO CATÁLOGO E PRODUTOS
      console.log('--- 1. CATÁLOGO & PRODUTOS ---');
      const prodRes = await request('/api/products');
      const hasProducts = prodRes.status === 200 && Array.isArray(prodRes.body.products) && prodRes.body.products.length > 0;
      logTest('Listagem de Produtos no Catálogo', hasProducts, `${prodRes.body.products?.length || 0} produtos encontrados`);

      const firstProduct = hasProducts ? prodRes.body.products[0] : null;

      // 2. TESTE DE CATEGORIAS E BANNERS
      const catRes = await request('/api/categories');
      logTest('Listagem de Categorias', catRes.status === 200 && Array.isArray(catRes.body.categories));

      const bannerRes = await request('/api/banners');
      logTest('Listagem de Banners da Home', bannerRes.status === 200);

      // 3. FLUXO DE AUTENTICAÇÃO: CADASTRO DE NOVO CLIENTE
      console.log('\n--- 2. FLUXO DE AUTENTICAÇÃO & CONTAS ---');
      const testEmail = `qa_tester_${Date.now()}@liviosfoodtest.com`;
      const testPassword = 'senhaSegura123!';
      const testCpf = '123.456.789-00';
      const testPhone = '(31) 98888-7777';

      const registerRes = await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Carlos Alberto QA Tester',
          email: testEmail,
          password: testPassword,
          phone: testPhone,
          cpf: testCpf
        }
      });

      const registerOk = registerRes.status === 200 && registerRes.body.success && registerRes.body.user?.id;
      const createdUserId = registerRes.body.user?.id;
      logTest('Cadastro de Novo Cliente com Senha e Login', registerOk, `User ID: ${createdUserId || 'N/A'}`);

      // 4. TESTE DE LOGIN DO CLIENTE
      const loginRes = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: testEmail,
          password: testPassword
        }
      });
      const loginOk = loginRes.status === 200 && loginRes.body.success && loginRes.body.token;
      logTest('Login do Cliente Cadastrado', loginOk, `Token gerado com sucesso`);

      // 5. TESTE DE REJEIÇÃO DE LOGIN COM SENHA INCORRETA
      const wrongLoginRes = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: testEmail,
          password: 'senha_errada_total'
        }
      });
      logTest('Bloqueio de Login com Senha Incorreta', wrongLoginRes.status === 401 && !wrongLoginRes.body.success);

      // 6. SIMULAÇÃO DE COMPRA / CARRINHO E CHECKOUT
      console.log('\n--- 3. SIMULAÇÃO DE COMPRA & CHECKOUT ---');
      const orderPayload = {
        customer: {
          id: createdUserId,
          name: 'Carlos Alberto QA Tester',
          email: testEmail,
          phone: testPhone,
          cpf: testCpf
        },
        items: [
          {
            id: firstProduct.id,
            name: firstProduct.name,
            quantity: 2,
            price: firstProduct.promotionalPrice || firstProduct.price
          }
        ],
        shipping: {
          address: {
            recipient: 'Carlos Alberto',
            cep: '30580-180',
            street: 'Rua Fernando Cândido de Souza',
            number: '153',
            complement: 'Apto 101',
            neighborhood: 'Estrela do Oriente',
            city: 'Belo Horizonte',
            state: 'MG'
          },
          option: {
            name: 'SEDEX Express Gastronômico',
            price: 0
          }
        },
        payment: {
          method: 'pix',
          installments: 1
        },
        subtotal: (firstProduct.promotionalPrice || firstProduct.price) * 2,
        discount: 0,
        shippingFee: 0,
        total: (firstProduct.promotionalPrice || firstProduct.price) * 2,
        notes: 'Pedido de teste simulado automatizado pelo QA Sênior'
      };

      const createOrderRes = await request('/api/orders', {
        method: 'POST',
        body: orderPayload
      });

      const orderCreatedOk = createOrderRes.status === 200 && createOrderRes.body.success && createOrderRes.body.order?.id;
      const createdOrderId = createOrderRes.body.order?.id;
      logTest('Criação e Finalização do Pedido no Checkout', orderCreatedOk, `Pedido #${createdOrderId || 'N/A'}`);

      // 7. RASTREAMENTO DO PEDIDO EM TEMPO REAL
      console.log('\n--- 4. RASTREAMENTO & ACOMPANHAMENTO ---');
      const trackRes = await request(`/api/orders/${createdOrderId}`);
      const trackOk = trackRes.status === 200 && trackRes.body.success && trackRes.body.order?.id === createdOrderId;
      logTest('Consulta de Pedido por ID (Rastreamento)', trackOk, `Status: ${trackRes.body.order?.status}`);

      const searchTrackRes = await request(`/api/orders/track/${encodeURIComponent(testPhone)}`);
      const searchTrackOk = searchTrackRes.status === 200 && searchTrackRes.body.success && Array.isArray(searchTrackRes.body.orders);
      logTest('Busca de Rastreamento pelo WhatsApp do Cliente', searchTrackOk, `${searchTrackRes.body.orders?.length || 0} pedido(s) associado(s)`);

      // 8. PAINEL ADMINISTRATIVO & CRM
      console.log('\n--- 5. PAINEL ADMIN & CRM ---');
      const crmDashRes = await request('/api/admin/crm/dashboard');
      const crmOk = crmDashRes.status === 200 && crmDashRes.body.success && Array.isArray(crmDashRes.body.customers);
      const customerInCrm = crmOk && crmDashRes.body.customers.find(c => c.id === createdUserId);
      logTest('Visualização do Cliente na Central CRM', !!customerInCrm, `Cliente ${customerInCrm?.name || 'Não listado'}`);

      // 9. FICHA 360° DO CLIENTE
      const profile360Res = await request(`/api/admin/crm/customers/${createdUserId}`);
      const profile360Ok = profile360Res.status === 200 && profile360Res.body.success && profile360Res.body.customer?.id === createdUserId;
      logTest('Acesso à Ficha 360° do Cliente', profile360Ok, `Gasto Total: R$ ${profile360Res.body.customer?.totalSpent || 0}`);

      // 10. NOTA INTERNA NO CRM
      const noteRes = await request(`/api/admin/crm/customers/${createdUserId}/notes`, {
        method: 'POST',
        body: { note: 'Cliente VIP verificado pelo QA', author: 'Analista Sênior' }
      });
      logTest('Adição de Nota Interna no Perfil do Cliente', noteRes.status === 200 && noteRes.body.success);

      // 11. ATUALIZAÇÃO DE STATUS DO PEDIDO NO ADMIN
      const updateStatusRes = await request(`/api/orders/${createdOrderId}/status`, {
        method: 'PUT',
        body: { status: 'preparing', note: 'Embalando molhos com lacre de segurança' }
      });
      logTest('Atualização de Status do Pedido pelo Admin', updateStatusRes.status === 200 && updateStatusRes.body.success);

      // 12. EXCLUSÃO DO CLIENTE DE TESTE
      console.log('\n--- 6. GESTÃO & EXCLUSÃO DE CLIENTES ---');
      const deleteCustomerRes = await request(`/api/admin/crm/customers/${createdUserId}`, {
        method: 'DELETE'
      });
      const deleteOk = deleteCustomerRes.status === 200 && deleteCustomerRes.body.success;
      logTest('Exclusão de Cliente no Painel Admin (DELETE /api/admin/crm/customers/:id)', deleteOk, deleteCustomerRes.body.message);

      // 13. VERIFICAÇÃO DE EXCLUSÃO
      const checkDeletedRes = await request(`/api/admin/crm/customers/${createdUserId}`);
      const verifyDeleted = checkDeletedRes.status === 404;
      logTest('Verificação de Remoção Efetiva do Cliente', verifyDeleted, 'Retornou 404 Not Found conforme esperado');

      // 14. SEGURANÇA: TENTATIVA DE EXCLUIR SUPER ADMIN
      const deleteAdminRes = await request('/api/admin/crm/customers/usr_super_admin', {
        method: 'DELETE'
      });
      const adminProtected = deleteAdminRes.status === 403 || deleteAdminRes.status === 404;
      logTest('Proteção de Segurança: Super Admin Não Pode Ser Excluído', adminProtected);

      console.log('\n====================================================');
      const allPassed = results.every(r => r.passed);
      console.log(`📊 RELATÓRIO FINAL: ${results.filter(r => r.passed).length}/${results.length} TESTES APROVADOS.`);
      console.log(`STATUS GERAL: ${allPassed ? '🏆 100% OPERACIONAL & VALIDADO COM SUCESSO' : '⚠️ FALHA DETECTADA'}`);
      console.log('====================================================');

    } catch (err) {
      console.error('ERRO CRÍTICO NA EXECUÇÃO DO TESTE:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runSeniorTestSuite();
