/**
 * Utilitário centralizado para geração de URLs do WhatsApp com compatibilidade UTF-8 total
 * Usa diretamente o endpoint https://api.whatsapp.com/send para evitar perda de caracteres/emojis
 * decorrentes do redirecionamento 302 do encurtador wa.me em navegadores móveis/desktop.
 */

export const DEFAULT_WHATSAPP_NUMBER = '5531995675327';
export const FORMATTED_WHATSAPP_NUMBER = '(31) 99567-5327';

export function createWhatsAppUrl(phone = DEFAULT_WHATSAPP_NUMBER, text = '') {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const encodedText = encodeURIComponent(text.trim());
  return `https://api.whatsapp.com/send?phone=${cleanPhone}${encodedText ? `&text=${encodedText}` : ''}`;
}
