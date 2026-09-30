"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { RAFFLE_CATEGORIES } from "@/lib/raffle-categories";

type Winner = {
  number: number;
  user: {
    id: string;
    name: string;
    username: string;
    whatsapp: string;
    city: string;
  } | null;
};

type DrawResult = {
  number: number;
  eligibleCount: number;
  message: string;
  winner: Winner;
};

type Raffle = {
  id: string;
  raffleCode: string | null;
  name: string;
  productName: string;
  category: string;
  totalNumbers: number;
  priceInCents: number;
  endDate: string | null;
  salesClosedAt: string | null;
  drawEligibleCount: number | null;
  winningNumber: number | null;
  winningNumbers: number[];
  confirmedCount: number;
  resultStatus: "PENDING" | "WINNER";
  resultPublishedAt: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED";
};

const initialForm = {
  raffleCode: "",
  raffleName: "",
  productName: "",
  category: "OUTROS",
  description: "",
  totalNumbers: "10000",
  pricePerNumber: "1,00",
  endDate: ""
};

function formatDateTimeInput(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

const statusLabel: Record<Raffle["status"], string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  ENDED: "Encerrada"
};

function formatNumber(value: number | string) {
  return String(value).padStart(5, "0");
}

export default function AdminPage() {
  const [form, setForm] = useState(initialForm);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [drawResults, setDrawResults] = useState<Record<string, DrawResult>>({});
  const [drawing, setDrawing] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(() => Date.now());

  async function loadRaffles() {
    setLoadingList(true);
    try {
      const response = await fetch("/api/rifas", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar as rifas.");
      setRaffles(data.raffles ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as rifas.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadRaffles();
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function toServerDateTime(value: string) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }

  function update(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  }

  function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Selecione somente arquivos de imagem."));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error("Cada foto pode ter no máximo 8 MB."));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxSize = 1400;
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
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
        image.onerror = () => reject(new Error("Não foi possível ler uma das fotos."));
        image.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error("Não foi possível ler uma das fotos."));
      reader.readAsDataURL(file);
    });
  }

  async function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    if (images.length + files.length > 10) {
      setError("Você pode adicionar no máximo 10 fotos por rifa.");
      return;
    }

    setError("");
    try {
      const converted: string[] = [];
      for (const file of files) converted.push(await compressImage(file));
      setImages((current) => [...current, ...converted]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível adicionar as fotos.");
    }
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/rifas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, endDate: toServerDateTime(form.endDate), imageUrls: images })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar a rifa.");
        return;
      }

      setMessage("Rifa criada como rascunho. Revise e publique quando estiver pronta.");
      setForm(initialForm);
      setImages([]);
      await loadRaffles();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  function editRaffle(id: string) {
    window.location.href = "/admin/rifa/" + id;
  }

  async function changeStatus(id: string, status: "ACTIVE" | "PAUSED") {
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/rifas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível alterar a rifa.");
        return;
      }

      setMessage("Status da rifa atualizado.");
      await loadRaffles();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    }
  }

  async function drawRaffle(id: string) {
    const raffle = raffles.find((item) => item.id === id);
    if (!raffle) return;

    if (raffle.confirmedCount < 1) {
      setError("Não há nenhum número confirmado para realizar o sorteio.");
      return;
    }

    const confirmation = window.confirm(
      `Realizar o sorteio agora? O sistema sorteará somente entre os ${raffle.confirmedCount.toLocaleString("pt-BR")} números confirmados. Depois do sorteio, a rifa será finalizada.`
    );
    if (!confirmation) return;

    setDrawing((current) => ({ ...current, [id]: true }));
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/rifas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, draw: true })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível realizar o sorteio.");
        return;
      }

      const winner = data.winners?.[0] as Winner | undefined;
      if (winner) {
        setDrawResults((current) => ({
          ...current,
          [id]: {
            number: winner.number,
            eligibleCount: data.drawEligibleCount ?? raffle.confirmedCount,
            message: data.message,
            winner
          }
        }));
        const user = winner.user;
        setMessage(
          user
            ? `Sorteio realizado: nº ${formatNumber(winner.number)} — ${user.name} — WhatsApp ${user.whatsapp}.`
            : `Sorteio realizado: nº ${formatNumber(winner.number)}.`
        );
      }

      await loadRaffles();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setDrawing((current) => ({ ...current, [id]: false }));
    }
  }

  return (
    <main className="admin-page">
      <div className="container admin-container">
        <div className="admin-heading">
          <div>
            <a className="back-link" href="/">← Voltar para a página inicial</a>
            <h1>Área administrativa</h1>
            <p>Crie e controle suas rifas e realize o sorteio diretamente pelo servidor.</p>
          </div>
          <span className="admin-badge">ADMINISTRAÇÃO</span>
        </div>

        <section className="admin-overview">
          <div><strong>{raffles.length}</strong><span>rifas cadastradas</span></div>
          <div><strong>{raffles.filter((raffle) => raffle.status === "ACTIVE").length}</strong><span>rifas ativas</span></div>
          <div><strong>{raffles.filter((raffle) => raffle.status === "DRAFT").length}</strong><span>rascunhos</span></div>
        </section>

        <section className="form-section">
          <h2>Criar nova rifa</h2>
          <p className="form-help">Preencha os dados abaixo. A rifa será criada como rascunho para você revisar antes de publicar.</p>

          <form className="admin-form" onSubmit={submit}>
            <section className="form-section form-section-nested">
              <h3>Identificação</h3>
              <label>ID da rifa<input value={form.raffleCode} onChange={(e) => update("raffleCode", e.target.value)} placeholder="Ex.: RIFA-001 ou deixe vazio" /><small>Se deixar vazio, o sistema gera um ID automaticamente.</small></label>
              <label>Nome da rifa<input required value={form.raffleName} onChange={(e) => update("raffleName", e.target.value)} placeholder="Ex.: Rifa Paramirim" /></label>
              <label>Nome do produto<input required value={form.productName} onChange={(e) => update("productName", e.target.value)} placeholder="Ex.: Chevrolet Celta 2012" /></label>
              <label>Categoria da rifa<select required value={form.category} onChange={(e) => update("category", e.target.value)}>{RAFFLE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select><small>Na página inicial, as rifas serão organizadas por categoria.</small></label>
              <label>Descrição<textarea required value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Descreva o produto e as informações importantes." rows={6} /></label>
            </section>

            <section className="form-section form-section-nested">
              <h3>Fotos do produto</h3>
              <p className="form-help">Adicione até 10 fotos. Elas serão comprimidas automaticamente antes de serem salvas.</p>
              <label className="photo-upload-button">
                <span>📷 Adicionar fotos</span>
                <input type="file" accept="image/*" multiple onChange={handleImages} />
              </label>
              {images.length > 0 && (
                <div className="image-admin-list">
                  {images.map((image, index) => (
                    <div className="image-admin-preview" key={image}>
                      <img src={image} alt={`Prévia ${index + 1}`} />
                      <button className="secondary-button compact-button" type="button" onClick={() => removeImage(index)}>Remover</button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="form-section form-section-nested">
              <h3>Números e preço</h3>
              <div className="form-grid">
                <label>Quantidade de números<input required min="1" max="1000000" type="number" value={form.totalNumbers} onChange={(e) => update("totalNumbers", e.target.value)} /></label>
                <label>Valor por número<input required inputMode="decimal" value={form.pricePerNumber} onChange={(e) => update("pricePerNumber", e.target.value)} placeholder="1,00" /></label>
              </div>
              <div className="number-note"><strong>Distribuição automática</strong><span>Os números serão criados automaticamente no banco.</span></div>
            </section>

            <section className="form-section form-section-nested">
              <h3>Data do sorteio</h3>
              <p className="form-help">Opcional. Você pode deixar sem data e divulgá-la depois, quando a meta da rifa for atingida.</p>
              <label>Data e hora do sorteio<input type="datetime-local" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></label>
            </section>

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={loading}>{loading ? "Criando rifa..." : "Criar rifa"}</button>
            </div>
          </form>
        </section>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <section className="form-section">
          <div className="section-heading-row">
            <div>
              <h2>Minhas rifas</h2>
              <p className="form-help">O sorteio usa somente números com pagamento confirmado.</p>
            </div>
            <button className="secondary-button compact-button" type="button" onClick={loadRaffles} disabled={loadingList}>Atualizar</button>
          </div>

          {loadingList ? (
            <div className="admin-empty">Carregando...</div>
          ) : raffles.length === 0 ? (
            <div className="admin-empty"><strong>Nenhuma rifa cadastrada.</strong><span>Quando você criar a primeira, ela aparecerá aqui.</span></div>
          ) : (
            <div className="raffle-admin-list">
              {raffles.map((raffle) => {
                const winningNumbers = raffle.winningNumbers?.length > 0
                  ? raffle.winningNumbers
                  : raffle.winningNumber !== null
                    ? [raffle.winningNumber]
                    : [];

                return (
                  <article className="raffle-admin-card" key={raffle.id}>
                    <div className="raffle-admin-main">
                      <span className={"admin-status status-" + raffle.status.toLowerCase()}>{statusLabel[raffle.status]}</span>
                      <div className="raffle-admin-id">{raffle.raffleCode ? "ID: " + raffle.raffleCode : "ID ainda não definido"}</div>
                      <h3>{raffle.name}</h3>
                      <p>{raffle.productName}</p>
                      <div className="raffle-admin-category">{raffle.category}</div>

                      {raffle.resultStatus === "WINNER" && winningNumbers.length > 0 && (
                        <div className="admin-draw-status admin-draw-winner">
                          <strong>RESULTADO PUBLICADO — ganhador encontrado</strong>
                          <span>Número(s): {winningNumbers.map(formatNumber).join(" · ")}</span>
                        </div>
                      )}

                      <div className="raffle-admin-meta">
                        <span>{raffle.totalNumbers.toLocaleString("pt-BR")} números</span>
                        <span>{(raffle.priceInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} cada</span>
                        <span>{raffle.endDate ? "Sorteio em " + new Date(raffle.endDate).toLocaleString("pt-BR") : "Data do sorteio ainda não definida"}</span>
                        {raffle.status === "ENDED" && <span>{raffle.drawEligibleCount ?? 0} números que concorreram</span>}
                      </div></div>
                    </div>

                    <div className="raffle-admin-actions">
                      <a className="secondary-button compact-button" href={"/rifa/" + raffle.id}>Abrir</a>
                      <button className="secondary-button compact-button" type="button" onClick={() => editRaffle(raffle.id)}>Editar</button>

                      {raffle.status === "DRAFT" && <button className="primary-button compact-button" type="button" onClick={() => changeStatus(raffle.id, "ACTIVE")}>Publicar rifa</button>}
                      {raffle.status === "ACTIVE" && <button className="secondary-button compact-button" type="button" onClick={() => changeStatus(raffle.id, "PAUSED")}>Pausar</button>}
                      {raffle.status === "PAUSED" && <button className="primary-button compact-button" type="button" onClick={() => changeStatus(raffle.id, "ACTIVE")}>Reativar</button>}

                      {raffle.status === "ACTIVE" && (
                        <div className="draw-result-box">
                          <div>
                            <strong>Sorteio aleatório</strong>
                            <span>Somente números com pagamento confirmado participam. Números disponíveis ou apenas reservados ficam fora do sorteio.</span>
                          </div>

                          <div className="draw-count">
                            <b>{raffle.confirmedCount.toLocaleString("pt-BR")}</b>
                            <span>números confirmados concorrendo</span>
                          </div>

                          {(() => {
                            const hasDrawDate = Boolean(raffle.endDate);
                            const drawDateReached = hasDrawDate && new Date(raffle.endDate as string).getTime() <= now;
                            const canDraw = hasDrawDate && drawDateReached && raffle.confirmedCount > 0 && !drawing[raffle.id];

                            return (
                              <>
                                <div className={"draw-date-lock " + (canDraw ? "draw-date-ready" : "")}>
                                  {!hasDrawDate
                                    ? "🔒 Defina a data e o horário do sorteio em “Editar” para liberar o botão."
                                    : !drawDateReached
                                      ? "🔒 Aguardando a data e o horário definidos para o sorteio."
                                      : raffle.confirmedCount === 0
                                        ? "🔒 A data chegou, mas ainda não há números com pagamento confirmado."
                                        : "🟢 Data e horário atingidos. O sorteio está liberado."}
                                </div>
                                <button
                                  className="primary-button compact-button"
                                  type="button"
                                  disabled={!canDraw}
                                  onClick={() => drawRaffle(raffle.id)}
                                >
                                  {drawing[raffle.id]
                                    ? "Sorteando..."
                                    : canDraw
                                      ? "Realizar sorteio"
                                      : "Sorteio bloqueado"}
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {drawResults[raffle.id] && (
                        <div className="draw-preview draw-preview-winner">
                          <strong>🎉 Resultado publicado</strong>
                          <span>Número sorteado: <b>{formatNumber(drawResults[raffle.id].number)}</b></span>
                          {drawResults[raffle.id].winner.user && (
                            <>
                              <span>Ganhador: <b>{drawResults[raffle.id].winner.user?.name}</b></span>
                              <small>WhatsApp: {drawResults[raffle.id].winner.user?.whatsapp}</small>
                            </>
                          )}
                        </div>
                      )}

                      {raffle.status === "ENDED" && winningNumbers.length > 0 && (
                        <div className="raffle-result-admin raffle-result-published">
                          Resultado: <strong>{winningNumbers.map(formatNumber).join(" · ")}</strong>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
