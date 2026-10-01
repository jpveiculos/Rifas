"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Raffle = {
  id: string;
  raffleCode: string | null;
  name: string;
  city: string;
  topicId: string | null;
  topicName: string | null;
  productName: string;
  description: string;
  totalNumbers: number;
  priceInCents: number;
  endDate: string | null;
  imageUrls: string[];
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED";
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Selecione apenas arquivos de imagem."));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error("A foto deve ter no máximo 8 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a foto."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Não foi possível processar a foto."));
      image.onload = () => {
        const maxSide = 1400;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Não foi possível preparar a foto."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function EditRafflePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ raffleCode: "", raffleName: "", topicId: "", newTopicName: "", productName: "", description: "", totalNumbers: "", pricePerNumber: "", endDate: "", imageUrls: [""] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
          setTopics(data.topics ?? []);
          return fetch("/api/rifas/" + raffleId, { cache: "no-store" }).then(async (response) => {
            if (!response.ok) throw new Error("Não foi possível carregar a rifa.");
            return response.json();
          });
        })
        .then((data) => {
          const item = data.raffle as Raffle;
          setRaffle(item);
          setForm({
            raffleCode: item.raffleCode ?? "",
            raffleName: item.name,
            topicId: item.topicId ?? "",
            newTopicName: "",
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

  async function addUploadedImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    if (form.imageUrls.filter(Boolean).length + files.length > 10) {
      setError("Você pode adicionar no máximo 10 fotos.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const images: string[] = [];
      for (const file of files) images.push(await compressImage(file));

      setForm((current) => ({
        ...current,
        imageUrls: [...current.imageUrls.filter(Boolean), ...images]
      }));
      setMessage(files.length === 1 ? "Foto adicionada. Salve as alterações para publicar." : "Fotos adicionadas. Salve as alterações para publicar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível adicionar a foto.");
    } finally {
      setUploading(false);
    }
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
        body: JSON.stringify({
          id,
          edit: true,
          ...form,
          city: "",
          endDate: form.endDate ? new Date(form.endDate).toISOString() : "",
          imageUrls: form.imageUrls.filter(Boolean)
        })
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

  const hasImages = form.imageUrls.some(Boolean);

  return (
    <main className="admin-page">
      <div className="container admin-container">
        <a className="back-link" href="/admin">← Voltar para minhas rifas</a>
        <div className="admin-heading"><div><h1>Editar rifa</h1><p>Altere as informações do anúncio e salve. A publicação da rifa continua sendo controlada no painel.</p></div><span className="admin-badge">{raffle.status}</span></div>

        <form className="admin-form" onSubmit={save}>
          <section className="form-section">
            <h2>Informações do anúncio</h2>
            <label>ID da rifa<input value={form.raffleCode} onChange={(e) => update("raffleCode", e.target.value)} placeholder="Ex.: RIFA-001" /><small>Você pode alterar o ID ou deixar vazio para manter o atual.</small></label>
            <label>Nome da rifa<input required value={form.raffleName} onChange={(e) => update("raffleName", e.target.value)} /></label>
            <label>Tópico regional da rifa
              <select value={form.topicId} onChange={(e) => {
                update("topicId", e.target.value);
                if (e.target.value) update("newTopicName", "");
              }}>
                <option value="">Selecione um tópico</option>
                {topics.map((topic) => <option value={topic.id} key={topic.id}>{topic.name}</option>)}
              </select>
              <small>As rifas do mesmo tópico aparecem juntas na página principal.</small>
            </label>
            <label>Novo tópico regional
              <input value={form.newTopicName} onChange={(e) => {
                update("newTopicName", e.target.value);
                if (e.target.value.trim()) update("topicId", "");
              }} placeholder="Ex.: Paramirim-BA" />
              <small>Use somente se quiser criar um novo tópico para esta rifa.</small>
            </label>
            <label>Nome do produto<input required value={form.productName} onChange={(e) => update("productName", e.target.value)} /></label>
            <label>Descrição<textarea required rows={8} value={form.description} onChange={(e) => update("description", e.target.value)} /></label>
          </section>

          <section className="form-section">
            <h2>Fotos do anúncio</h2>
            <p className="form-help">Escolha as fotos diretamente do celular ou computador. Você pode adicionar até 10 fotos. Elas são reduzidas automaticamente antes de serem salvas.</p>

            <label className="photo-upload-button">
              <input type="file" accept="image/*" multiple onChange={addUploadedImages} disabled={uploading || form.imageUrls.filter(Boolean).length >= 10} />
              {uploading ? "Preparando fotos..." : "📷 Escolher fotos"}
            </label>

            {hasImages && (
              <div className="image-admin-list">
                {form.imageUrls.map((url, index) => url ? (
                  <div className="image-admin-preview" key={index}>
                    <img src={url} alt={"Foto " + (index + 1)} />
                    <button className="secondary-button compact-button" type="button" onClick={() => removeImage(index)}>Remover</button>
                  </div>
                ) : null)}
              </div>
            )}

            {form.imageUrls.filter(Boolean).length < 10 && <button className="secondary-button compact-button" type="button" onClick={addImage}>+ Adicionar endereço de imagem</button>}
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
            <button className="primary-button" type="submit" disabled={saving || uploading}>{saving ? "Salvando..." : "Salvar alterações"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
