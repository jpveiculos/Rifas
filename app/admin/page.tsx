"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

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
  city: string;
  topicId: string | null;
  topicName: string | null;
  productName: string;
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
  topicId: "",
  newTopicName: "",
  city: "",
  productName: "",
  description: "",
  totalNumbers: "10000",
  pricePerNumber: "1,00",
  endDate: ""
};

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
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [editingTopicId, setEditingTopicId] = useState("");
  const [editingTopicName, setEditingTopicName] = useState("");
  const [savingTopic, setSavingTopic] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState("");
  const [topicDeleteTargets, setTopicDeleteTargets] = useState<Record<string, string>>({});
  const [bonusSearch, setBonusSearch] = useState("");
  const [bonusUsers, setBonusUsers] = useState<{ id: string; name: string; username: string; whatsapp: string; city: string }[]>([]);
  const [selectedBonusUser, setSelectedBonusUser] = useState<{ id: string; name: string; username: string; whatsapp: string; city: string } | null>(null);
  const [bonusRaffleId, setBonusRaffleId] = useState("");
  const [bonusQuantity, setBonusQuantity] = useState("1");
  const [savingBonus, setSavingBonus] = useState(false);
  const [contactWhatsapp, setContactWhatsapp] = useState("77998315360");
  const [instagramHandle, setInstagramHandle] = useState("rifastop.com.br");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [savingInstagram, setSavingInstagram] = useState(false);
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
      setTopics(data.topics ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as rifas.");
    } finally {
      setLoadingList(false);
    }
  }

  async function loadSettings() {
    try {
      const response = await fetch("/api/config", { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data.contactWhatsapp) setContactWhatsapp(data.contactWhatsapp);
      if (response.ok && data.instagramHandle) setInstagramHandle(data.instagramHandle || "rifastop.com.br");
    } catch {}
  }

  async function saveWhatsapp() {
    setSavingWhatsapp(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactWhatsapp })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar o WhatsApp.");
        return;
      }
      setContactWhatsapp(data.contactWhatsapp);
      setMessage("WhatsApp de contato atualizado.");
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSavingWhatsapp(false);
    }
  }

  async function searchBonusUsers() {
    const q = bonusSearch.trim();
    setSelectedBonusUser(null);
    if (q.length < 2) {
      setBonusUsers([]);
      return;
    }
    try {
      const response = await fetch("/api/admin/bonificacoes?q=" + encodeURIComponent(q), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Não foi possível pesquisar usuários.");
        return;
      }
      setBonusUsers(data.users ?? []);
    } catch {
      setError("Não foi possível pesquisar usuários.");
    }
  }

  async function saveBonus() {
    if (!selectedBonusUser || !bonusRaffleId) {
      setError("Selecione o usuário e a rifa.");
      return;
    }

    setSavingBonus(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/bonificacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedBonusUser.id,
          raffleId: bonusRaffleId,
          quantity: Number(bonusQuantity)
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Não foi possível creditar os números.");
        return;
      }

      setMessage("Bonificação realizada para " + data.user + ". Números: " + data.numbers.map((n: number) => formatNumber(n)).join(", "));
      setBonusSearch("");
      setBonusUsers([]);
      setSelectedBonusUser(null);
      setBonusQuantity("1");
      await loadRaffles();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSavingBonus(false);
    }
  }

  async function deleteTopic(topicId: string, topicName: string) {
    const targetTopicId = topicDeleteTargets[topicId] ?? "";
    const targetTopic = topics.find((topic) => topic.id === targetTopicId);

    if (!targetTopicId || !targetTopic) {
      setError("Escolha primeiro o tópico que vai receber as rifas deste tópico.");
      return;
    }

    const targetName = targetTopic.name.replace(/^Rifas em\s+/i, "");
    const confirmation = window.confirm(
      `Excluir "Rifas em ${topicName}" e mover todas as rifas dele para "Rifas em ${targetName}"? O tópico antigo será removido do sistema e as rifas continuarão normalmente.`
    );
    if (!confirmation) return;

    setDeletingTopicId(topicId);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/rifas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, targetTopicId })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível excluir o tópico.");
        return;
      }

      setMessage(data.message ?? "Tópico excluído e rifas transferidas.");
      setTopicDeleteTargets((current) => {
        const next = { ...current };
        delete next[topicId];
        return next;
      });
      if (editingTopicId === topicId) {
        setEditingTopicId("");
        setEditingTopicName("");
      }
      await loadRaffles();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setDeletingTopicId("");
    }
  }
  async function saveTopicName() {
    const topicName = editingTopicName.trim();
    if (!editingTopicId || !topicName) {
      setError("Informe o novo nome do tópico.");
      return;
    }

    setSavingTopic(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/rifas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editTopic: true,
          topicId: editingTopicId,
          topicName
        })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível editar o tópico.");
        return;
      }

      setMessage("Nome do tópico atualizado.");
      setEditingTopicId("");
      setEditingTopicName("");
      await loadRaffles();
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSavingTopic(false);
    }
  }

  async function saveInstagram() {
    setSavingInstagram(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instagramHandle })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar o Instagram.");
        return;
      }
      setInstagramHandle(data.instagramHandle);
      setMessage("Instagram atualizado.");
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSavingInstagram(false);
    }
  }

  useEffect(() => {
    loadRaffles();
    loadSettings();
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
        body: JSON.stringify({ ...form, productName: form.productName, endDate: toServerDateTime(form.endDate), imageUrls: images })
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

  async function deleteRaffle(id: string, productName: string) {
    const confirmation = window.confirm(
      `Excluir a rifa "${productName}"? Esta ação é permanente e também removerá os números e participações vinculados a ela.`
    );
    if (!confirmation) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/rifas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível excluir a rifa.");
        return;
      }

      setMessage("Rifa excluída com sucesso.");
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
          <div className="admin-header-actions">
            <button
              className="secondary-button compact-button"
              type="button"
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                window.location.href = "/admin/login";
              }}
            >
              Sair
            </button>
          </div>
          <div>
            <h1>Área administrativa</h1>
            <div className="admin-contact-setting">
              <label>WhatsApp de contato
                <input
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="77998315360"
                />
              </label>
              <button className="primary-button compact-button" type="button" onClick={saveWhatsapp} disabled={savingWhatsapp}>
                {savingWhatsapp ? "Salvando..." : "Salvar WhatsApp"}
              </button>
            </div>
            <div className="admin-contact-setting">
              <label>Instagram
                <input
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value.replace(/^@+/, "").replace(/\s/g, ""))}
                  placeholder="rifastop.com.br"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </label>
              <button className="primary-button compact-button" type="button" onClick={saveInstagram} disabled={savingInstagram}>
                {savingInstagram ? "Salvando..." : "Salvar Instagram"}
              </button>
            </div>
          </div>
        </div>

        <section className="form-section">
          <h2>Criar nova rifa</h2>
          <form className="admin-form" onSubmit={submit}>
            <section className="form-section form-section-nested">
              <label>ID da rifa<input value={form.raffleCode} onChange={(e) => update("raffleCode", e.target.value)} placeholder="Ex.: RIFA-001 ou deixe vazio" /><small>Se deixar vazio, o sistema gera um ID automaticamente.</small></label>
                            <label>Tópico regional da rifa
                <select
                  value={form.topicId}
                  disabled={Boolean(form.newTopicName.trim())}
                  onChange={(e) => {
                    update("topicId", e.target.value);
                    if (e.target.value) update("newTopicName", "");
                  }}
                >
                  <option value="">Selecione um tópico</option>
                  {topics.map((topic) => <option value={topic.id} key={topic.id}>Rifas em {topic.name.replace(/^Rifas em\s+/i, "")}</option>)}
                </select>
                <small>Escolha um tópico existente ou deixe este campo e o próximo em branco para usar um novo tópico.</small>
              </label>
              <label>Novo tópico regional
                <input
                  value={form.newTopicName}
                  disabled={Boolean(form.topicId)}
                  onChange={(e) => {
                    update("newTopicName", e.target.value);
                    if (e.target.value.trim()) update("topicId", "");
                  }}
                  placeholder="Ex.: Paramirim-BA"
                />
                <small>Digite somente o nome do local. Ao preencher, o tópico existente fica desativado. O sistema exibirá como "Rifas em Nome do local".</small>
              </label>

              {topics.length > 0 && (
                <div className="topic-edit-box">
                  <h3>Editar tópicos regionais</h3>
                  <p className="form-help">Corrija o nome de um tópico já salvo sem precisar criar outro. A alteração será aplicada às rifas vinculadas a ele.</p>
                  <div className="topic-edit-list">
                    {topics.map((topic) => {
                      const isEditing = editingTopicId === topic.id;
                      return (
                        <div className="topic-edit-row" key={topic.id}>
                          {isEditing ? (
                            <>
                              <input
                                value={editingTopicName}
                                onChange={(e) => setEditingTopicName(e.target.value)}
                                placeholder="Nome do tópico"
                                autoFocus
                              />
                              <button className="primary-button compact-button" type="button" onClick={saveTopicName} disabled={savingTopic}>
                                {savingTopic ? "Salvando..." : "Salvar"}
                              </button>
                              <button
                                className="secondary-button compact-button"
                                type="button"
                                onClick={() => {
                                  setEditingTopicId("");
                                  setEditingTopicName("");
                                }}
                                disabled={savingTopic}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="topic-edit-name">Rifas em {topic.name.replace(/^Rifas em\s+/i, "")}</span>
                              <button
                                className="secondary-button compact-button"
                                type="button"
                                onClick={() => {
                                  setEditingTopicId(topic.id);
                                  setEditingTopicName(topic.name.replace(/^Rifas em\s+/i, ""));
                                  setMessage("");
                                  setError("");
                                }}
                              >
                                Editar nome
                              </button>
                              {topics.length > 1 && (
                                <div className="topic-delete-action">
                                  <select
                                    className="topic-delete-target"
                                    value={topicDeleteTargets[topic.id] ?? ""}
                                    onChange={(e) =>
                                      setTopicDeleteTargets((current) => ({
                                        ...current,
                                        [topic.id]: e.target.value
                                      }))
                                    }
                                    disabled={deletingTopicId === topic.id}
                                  >
                                    <option value="">Mover rifas para...</option>
                                    {topics
                                      .filter((target) => target.id !== topic.id)
                                      .map((target) => (
                                        <option value={target.id} key={target.id}>
                                          Rifas em {target.name.replace(/^Rifas em\s+/i, "")}
                                        </option>
                                      ))}
                                  </select>
                                  <button
                                    className="danger-button compact-button topic-delete-button danger-topic-button"
                                    type="button"
                                    onClick={() => deleteTopic(topic.id, topic.name.replace(/^Rifas em\s+/i, ""))}
                                    disabled={deletingTopicId === topic.id || !topicDeleteTargets[topic.id]}
                                  >
                                    {deletingTopicId === topic.id ? "Excluindo tópico..." : "🗑️ Excluir e transferir"}
                                  </button>
                                </div>
                              )}
                            </>
                          )}