"use client";

import { useState } from "react";

type Props = {
  raffleName: string;
};

export default function ShareRaffle({ raffleName }: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const text = "Confira esta rifa: " + raffleName;

    if (navigator.share) {
      try {
        await navigator.share({
          title: raffleName,
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
      window.prompt("Copie o link da rifa:", url);
    }
  }

  return (
    <div className="share-box">
      <div>
        <strong>Divulgue esta rifa e aumente suas chances de ganhar.</strong>
      </div>
      <div className="share-actions">
        <button type="button" className="share-button share-main" onClick={share}>
          {copied ? "Link copiado!" : "Compartilhar"}
        </button>
      </div>
    </div>
  );
}
