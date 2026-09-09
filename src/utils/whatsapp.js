/**
 * Utilitário centralizado para geração de URLs do WhatsApp com compatibilidade total
 * Usa https://wa.me/ para deep linking nativo sem perda de quebras de linha ou caracteres.
 */

export const DEFAULT_WHATSAPP_NUMBER = '5531995675327';
export const FORMATTED_WHATSAPP_NUMBER = '(31) 99567-5327';

export function createWhatsAppUrl(phone = DEFAULT_WHATSAPP_NUMBER, text = '') {
  const cleanPhone = String(phone || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '');
  if (!text || !text.trim()) {
    return `https://wa.me/${cleanPhone}`;
  }
  const encodedText = encodeURIComponent(text.trim());
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Formata a mensagem de novo pedido de forma elegante, legível e 100% compatível
 * com WhatsApp Web, Desktop, Android e iOS.
 */
export function formatNewOrderMessage({
  orderId,
  customer,
  address,
  items = [],
  subtotal = 0,
  discount = 0,
  couponCode = '',
  shippingFee = 0,
  total = 0,
  paymentMethod = '',
  notes = '',
  trackingUrl = ''
}) {
  const formatMoney = (val) => Number(val || 0).toFixed(2).replace('.', ',');

  const itemsList = items.map((item, idx) => {
    const itemTotal = formatMoney(item.price * item.quantity);
    return `${idx + 1}. *${item.quantity}x ${item.name}* (R$ ${itemTotal})`;
  }).join('\n');

  const addressDetails = [
    `${address.street || ''}, Nº ${address.number || 'S/N'}${address.complement ? ` (${address.complement})` : ''}`,
    `Bairro: ${address.neighborhood || ''}`,
    `Cidade: ${address.city || ''} - ${address.state || ''}`,
    `CEP: ${address.cep || ''}`
  ].filter(Boolean).join('\n');

  const lines = [
    `🔥 *NOVO PEDIDO - LIVIO'S FOOD*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Pedido:* #${orderId}`,
    `👤 *Cliente:* ${customer.name || 'Cliente'}`,
    `📱 *WhatsApp:* ${customer.phone || 'Não informado'}`,
    `📧 *E-mail:* ${customer.email || 'Não informado'}`,
    `📄 *CPF:* ${customer.cpf || 'Não informado'}`,
    ``,
    `📍 *Endereço de Entrega:*`,
    addressDetails,
    ``,
    `🛒 *Itens do Pedido:*`,
    itemsList,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📊 *Subtotal:* R$ ${formatMoney(subtotal)}`
  ];

  if (discount > 0) {
    lines.push(`🎁 *Desconto (${couponCode || 'Cupom'}):* -R$ ${formatMoney(discount)}`);
  }

  lines.push(`🛵 *Frete:* ${shippingFee === 0 ? 'GRÁTIS' : `R$ ${formatMoney(shippingFee)}`}`);
  lines.push(`💰 *TOTAL:* *R$ ${formatMoney(total)}*`);
  lines.push(`💳 *Pagamento:* ${paymentMethod}`);

  if (notes && notes.trim()) {
    lines.push(`📝 *Observações:* ${notes.trim()}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (trackingUrl) {
    lines.push(``);
    lines.push(`🔗 *Acompanhe em Tempo Real:*`);
    lines.push(trackingUrl);
  }

  lines.push(``);
  lines.push(`_Olá, equipe Livio's Food! Acabei de realizar meu pedido pelo site e aguardo a confirmação e dados de pagamento por aqui. Obrigado!_`);

  return lines.join('\n');
}
