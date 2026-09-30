"use client";

import { useState } from "react";

type Props = {
  raffleName: string;
};

export default function ShareRaffle({ raffleName }: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const text = `Confira esta rifa: ${raffleName}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: raffleName, text, url });
        return;
      } catch {
        return;
      }
    }

    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copie o link da rifa:", window.location.href);
    }
  }

  function openSocial(network: "whatsapp" | "facebook" | "x") {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Confira esta rifa: ${raffleName}`);
    const links = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    };

    window.open(links[network], "_blank", "noopener,noreferrer");
  }

  return (
    <div className="share-box">
      <div>
        <strong>Divulgue esta rifa</strong>
        <span>Compartilhe o link para enviar o anúncio para outras pessoas.</span>
      </div>
      <div className="share-actions">
        <button type="button" className="share-button share-main" onClick={share}>Compartilhar</button>
        <button type="button" className="share-button" onClick={() => openSocial("whatsapp")}>WhatsApp</button>
        <button type="button" className="share-button" onClick={() => openSocial("facebook")}>Facebook</button>
        <button type="button" className="share-button" onClick={() => openSocial("x")}>X</button>
        <button type="button" className="share-button" onClick={copyLink}>{copied ? "Link copiado!" : "Copiar link"}</button>
      </div>
    </div>
  );
}
