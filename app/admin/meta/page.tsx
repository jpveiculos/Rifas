"use client";

import { useEffect, useState } from "react";
import "./meta.css";

type Integration = {
  metaUserId?: string;
  metaUserName?: string;
  adAccountId?: string;
  adAccountName?: string;
  facebookPageId?: string;
  facebookPageName?: string;
  instagramAccountId?: string;
  instagramUsername?: string;
  connectedAt?: string;
  tokenExpiresAt?: string;
};

export default function MetaIntegrationPage() {
  const [connected, setConnected] = useState(false);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/meta", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar a integração.");
      setConnected(Boolean(data.connected));
      setIntegration(data.integration || null);
      if (data.integration?.error) setError(data.integration.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Desconectar a Meta do RifasTOP?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/meta", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível desconectar.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível desconectar.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="meta-page">
      <div className="meta-container">
        <a className="meta-back" href="/admin">← Voltar para administração</a>
        <div className="meta-header">
          <div>
            <span>RIFASTOP • INTEGRAÇÃO</span>
            <h1>Meta / Instagram / Facebook</h1>
            <p>Conecte a conta uma vez. Depois o motor poderá usar a conexão para publicar e acompanhar campanhas sem copiar conteúdo manualmente.</p>
          </div>
          <div className={connected ? "meta-status connected" : "meta-status"}>
            {connected ? "● CONECTADA" : "○ NÃO CONECTADA"}
          </div>
        </div>

        {error && <div className="meta-alert">{error}</div>}

        <section className="meta-card">
          {loading ? <p>Verificando conexão...</p> : connected ? (
            <>
              <h2>Conexão ativa</h2>
              <p>Conta Meta autorizada: <strong>{integration?.metaUserName || integration?.metaUserId}</strong></p>
              <div className="meta-grid">
                <div><small>Conta de anúncios</small><strong>{integration?.adAccountName || "Ainda não selecionada"}</strong></div>
                <div><small>Facebook</small><strong>{integration?.facebookPageName || "Ainda não selecionado"}</strong></div>
                <div><small>Instagram</small><strong>{integration?.instagramUsername ? "@" + integration.instagramUsername : "Ainda não selecionado"}</strong></div>
              </div>
              <button className="meta-danger" disabled={busy} onClick={disconnect}>Desconectar Meta</button>
            </>
          ) : (
            <>
              <h2>1. Conectar sua conta Meta</h2>
              <p>Você será enviado para a tela oficial da Meta para autorizar o RifasTOP. O token fica armazenado de forma criptografada no servidor.</p>
              <a className="meta-primary" href="/api/admin/meta/oauth">Conectar com Meta</a>
              <div className="meta-note">
                <strong>Depois da conexão:</strong> vamos selecionar a conta de anúncios, a página do Facebook e o Instagram que serão usados pelo motor.
              </div>
            </>
          )}
        </section>

        <section className="meta-card">
          <h2>O que esta integração vai permitir</h2>
          <div className="meta-roadmap">
            <span>✓ Conexão persistente</span>
            <span>✓ Instagram + Facebook</span>
            <span>✓ Conta de anúncios</span>
            <span>→ Publicação automática</span>
            <span>→ Métricas automáticas</span>
          </div>
          <p className="meta-footnote">A publicação automática depende da aprovação/permissões da aplicação Meta e das políticas de anúncios. O RifasTOP não tenta contornar análise ou bloqueios da Meta.</p>
        </section>
      </div>
    </main>
  );
}
