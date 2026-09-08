import React from 'react';
import { MessageCircle } from 'lucide-react';
import { createWhatsAppUrl } from '../utils/whatsapp.js';

export default function WhatsAppButton() {
  const message = "Olá! Vim pelo site da Livio's Food e gostaria de tirar uma dúvida sobre os molhos especiais.";
  const url = createWhatsAppUrl('5531995675327', message);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="whatsapp-float"
      title="Atendimento via WhatsApp Livio's Food"
    >
      <MessageCircle size={30} />
    </a>
  );
}
