"use client";

import { useState } from "react";

type Props = {
};

export default function ShareRaffle() {
  const [copied, setCopied] = useState(false);

  async function share() {
    // O compartilhamento da plataforma deve sempre levar para a página inicial.
    const url = window.location.origin + "/";
    const text = "Confira as rifas disponíveis no RifasTOP.";

    if (navigator.share) {
      try {
        await navigator.share({
          title: "RifasTOP",
          text,
          url
        });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copie o link do RifasTOP:", url);
    }
  }

  return (
    <div className="share-box">
      <div>
        <strong>Compartilhe e aumente sua chance de ganhar.</strong>
      </div>
      <div className="share-actions">
        <button type="button" className="share-button share-main" onClick={share}>
          {copied ? "Link copiado!" : "Compartilhar"}
        </button>
      </div>
    </div>
  );
}
