"use client";

import { FormEvent, useEffect, useState } from "react";

type Raffle = {
  id: string;
  name: string;
  productName: string;
  description: string;
  totalNumbers: number;
  priceInCents: number;
  endDate: string | null;
  imageUrls: string[];
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED";
};

export default function EditRafflePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [form, setForm] = useState({ raffleName: "", productName: "", description: "", totalNumbers: "", pricePerNumber: "", endDate: "", imageUrls: [""] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ id: raffleId }) => {
      setId(raffleId);
      fetch("/api/rifas", { cache: "no-store" })
        .then((response) => response.json())
        .then((data) => {
          const found = data.raffles?.find((item: Raffle) => item.id === raffleId);
          if (!found) throw new Error("Rifa não encontrada.");
          return fetch("/api/rifas/" + raffleId, { cache: "no-store" }).then(async (response) => {
            if (!response.ok) throw new Error("Não foi possível carregar a rifa.");
            return response.json();
          });
        })
        .then((data) => {
          const item = data.raffle as Raffle;
          setRaffle(item);
          setForm({
            raffleName: item.name,
            productName: item.productName,
            description: item.description,
            totalNumbers: String(item.totalNumbers),
            pricePerNumber: (item.priceInCents / 100).toFixed(2).replace(".", ","),
            endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : "",
            imageUrls: item.imageUrls.length ? item.imageUrls : [""]
          });
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar."))
        .finally(() => setLoading(false));
    });
  }, [params]);

  function update(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  }

  function updateImage(index: number, value: string) {
    setForm((current) => {
      const imageUrls = [...current.imageUrls];
      imageUrls[index] = value;
      return { ...current, imageUrls };
    });
  }

  function addImage() {
    if (form.imageUrls.length < 10) setForm((current) => ({ ...current, imageUrls: [...current.imageUrls, ""] }));
  }

  function removeImage(index: number) {
    setForm((current) => ({ ...current, imageUrls: current.imageUrls.filter((_, itemIndex) => itemIndex !== index) }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/rifas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, edit: true, ...form, imageUrls: form.imageUrls.filter(Boolean) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      setMessage("Rifa atualizada com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="admin-page"><div className="container admin-container"><div className="admin-empty">Carregando rifa...</div></div></main>;
  if (!raffle) return <main className="admin-page"><div className="container admin-container"><div className="error-message">{error || "Rifa não encontrada."}</div></div></main>;

  return (
    <main className="admin-page">
      <div className="container admin-container">
        <a className="back-link" href="/admin">← Voltar para minhas rifas</a>
        <div className="admin-heading"><div><h1>Editar rifa</h1><p>Altere as informações do anúncio e salve. A publicação da rifa continua sendo controlada no painel.</p></div><span className="admin-badge">{raffle.status}</span></div>

        <form className="admin-form" onSubmit={save}>
          <section className="form-section">
            <h2>Informações do anúncio</h2>
            <label>Nome da rifa<input required value={form.raffleName} onChange={(e) => update("raffleName", e.target.value)} /></label>
            <label>Nome do produto<input required value={form.productName} onChange={(e) => update("productName", e.target.value)} /></label>
            <label>Descrição<textarea required rows={8} value={form.description} onChange={(e) => update("description", e.target.value)} /></label>
          </section>

          <section className="form-section">
            <h2>Foto do anúncio</h2>
            <p className="form-help">Você pode cadastrar até 10 fotos usando o endereço público da imagem. O espaço fica preparado para substituirmos por upload direto quando o armazenamento de imagens for conectado.</p>
            <div className="image-admin-list">
              {form.imageUrls.map((url, index) => (
                <div className="image-admin-row" key={index}>
                  <input type="url" placeholder={"URL da foto " + (index + 1)} value={url} onChange={(e) => updateImage(index, e.target.value)} />
                  {form.imageUrls.length > 1 && <button className="secondary-button compact-button" type="button" onClick={() => removeImage(index)}>Remover</button>}
                </div>
              ))}
            </div>
            {form.imageUrls.length < 10 && <button className="secondary-button compact-button" type="button" onClick={addImage}>+ Adicionar outra foto</button>}
          </section>

          <section className="form-section">
            <h2>Números, valor e sorteio</h2>
            <div className="form-grid">
              <label>Quantidade de números<input required min="1" max="1000000" type="number" value={form.totalNumbers} onChange={(e) => update("totalNumbers", e.target.value)} /></label>
              <label>Valor por número<input required inputMode="decimal" value={form.pricePerNumber} onChange={(e) => update("pricePerNumber", e.target.value)} /></label>
            </div>
            <label>Data e hora do sorteio<input type="datetime-local" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></label>
            <p className="form-help">A data continua opcional e pode ser divulgada posteriormente.</p>
          </section>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <a className="secondary-button" href={"/rifa/" + raffle.id}>Visualizar anúncio</a>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
