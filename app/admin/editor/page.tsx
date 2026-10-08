"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./editor.css";

type BlockId = "hero" | "intro" | "raffles" | "links";
type Config = {
  order: BlockId[];
  visible: Record<BlockId, boolean>;
  title: string;
  subtitle: string;
};

const initial: Config = {
  order: ["hero", "intro", "raffles", "links"],
  visible: { hero: true, intro: false, raffles: true, links: true },
  title: "Rifas em Paramirim-BA e Região",
  subtitle: "Encontre sua próxima chance de ganhar.",
};
const labels: Record<BlockId, string> = {
  hero: "Banner principal",
  intro: "Texto de apresentação",
  raffles: "Área das rifas",
  links: "Instagram, WhatsApp e links",
};

export default function VisualSiteEditor() {
  const [config, setConfig] = useState<Config>(initial);
  const [dragging, setDragging] = useState<BlockId | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch("/api/site-editor", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setConfig({ ...initial, ...data, visible: { ...initial.visible, ...data.visible } }))
      .catch(() => setMessage("Não foi possível carregar as configurações."));
  }, []);

  function moveBlock(target: BlockId) {
    if (!dragging || dragging === target) return;
    setConfig((current) => {
      const order = current.order.filter((id) => id !== dragging);
      const index = order.indexOf(target);
      order.splice(index, 0, dragging);
      return { ...current, order };
    });
    setDragging(null);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/site-editor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar.");
      setMessage("Alterações salvas e publicadas no site.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="visual-editor">
      <header className="ve-header">
        <div><span className="ve-kicker">RIFA STOP</span><h1>Editor visual do site</h1><p>Arraste os blocos para organizar a página inicial.</p></div>
        <Link href="/admin" className="ve-back">← Voltar ao painel</Link>
      </header>
      <div className="ve-toolbar">
        <button type="button" className={preview ? "ve-secondary active" : "ve-secondary"} onClick={() => setPreview(!preview)}>{preview ? "Editar blocos" : "Pré-visualizar"}</button>
        <button type="button" className="ve-save" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar e publicar"}</button>
      </div>
      {message && <p className="ve-message" role="status">{message}</p>}
      <div className={preview ? "ve-workspace is-preview" : "ve-workspace"}>
        {!preview && <aside className="ve-settings">
          <h2>Textos da página</h2>
          <label>Título de apresentação<input value={config.title} maxLength={100} onChange={(e) => setConfig({ ...config, title: e.target.value })} /></label>
          <label>Texto complementar<textarea value={config.subtitle} maxLength={180} rows={3} onChange={(e) => setConfig({ ...config, subtitle: e.target.value })} /></label>
          <h2>Mostrar ou ocultar</h2>
          {config.order.map((id) => <label className="ve-toggle" key={id}><input type="checkbox" checked={config.visible[id]} onChange={(e) => setConfig({ ...config, visible: { ...config.visible, [id]: e.target.checked } })} />{labels[id]}</label>)}
          <p className="ve-hint">As áreas de pagamento, login e sorteios não são alteradas por este editor.</p>
        </aside>}
        <section className="ve-canvas">
          <div className="ve-canvas-top"><span>PRÉVIA DA PÁGINA INICIAL</span><span>rifastop.com.br</span></div>
          {config.order.map((id) => config.visible[id] && <article key={id} draggable={!preview} onDragStart={() => setDragging(id)} onDragOver={(e) => e.preventDefault()} onDrop={() => moveBlock(id)} onDragEnd={() => setDragging(null)} className={"ve-block " + (dragging === id ? "is-dragging" : "")}>
            {!preview && <div className="ve-block-handle">⠿ <span>Arraste para reorganizar</span></div>}
            {id === "hero" && <div className="ve-hero"><span>RIFA STOP</span><h2>{config.title}</h2><p>Banner principal do site</p></div>}
            {id === "intro" && <div className="ve-intro"><h2>{config.title}</h2><p>{config.subtitle}</p></div>}
            {id === "raffles" && <div className="ve-raffles"><h2>Rifas disponíveis</h2><div className="ve-placeholder-cards"><span>Card de rifa</span><span>Card de rifa</span><span>Card de rifa</span></div><small>As rifas reais continuam sendo carregadas pelo site.</small></div>}
            {id === "links" && <div className="ve-links"><span>Instagram</span><span>WhatsApp</span><span>Termos de Uso</span><span>Baixar Aplicativo</span></div>}
          </article>)}
          {config.order.every((id) => !config.visible[id]) && <p>Ative pelo menos um bloco para visualizar a página.</p>}
        </section>
      </div>
      <p className="ve-footnote">Dica: no iPhone, se arrastar for difícil, use um computador para reorganizar os blocos. Os controles de texto e visibilidade funcionam no celular.</p>
    </main>
  );
}
