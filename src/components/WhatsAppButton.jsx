import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const phone = "5531995675327";
  const message = encodeURIComponent("Olá! Vim pelo site da Livio's Food e gostaria de tirar uma dúvida sobre os molhos especiais.");

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noreferrer"
      className="whatsapp-float"
      title="Atendimento via WhatsApp Livio's Food"
    >
      <MessageCircle size={30} />
    </a>
  );
}
