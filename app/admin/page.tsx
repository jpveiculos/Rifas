"use client";

import { FormEvent, useState } from "react";

const initialForm = {
  raffleName: "",
  productName: "",
  description: "",
  totalNumbers: "10000",
  pricePerNumber: "1,00",
  endDate: ""
};

export default function AdminPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
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
        body: JSON.stringify(form)
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar a rifa.");
        return;
      }

      setMessage("Rifa criada com sucesso. ID: " + data.id);
      setForm(initialForm);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <div className="container admin-container">
        <div className="admin-heading">
          <div>
            <a className="back-link" href="/">← Voltar para a página inicial</a>
            <h1>Criar nova rifa</h1>
            <p>Cadastre sua rifa e prepare os números automaticamente.</p>
          </div>
          <span className="admin-badge">ADMINISTRAÇÃO</span>
        </div>

        <form className="admin-form" onSubmit={submit}>


          <section className="form-section">
            <h2>Identificação da rifa</h2>
            <p className="form-help">O nome da rifa é independente do nome do produto.</p>
            <label>Nome da rifa<input required value={form.raffleName} onChange={(e) => update("raffleName", e.target.value)} placeholder="Ex.: Rifa Paramirim" /></label>
            <label>Nome do produto<input required value={form.productName} onChange={(e) => update("productName", e.target.value)} placeholder="Ex.: Chevrolet Celta 2012" /></label>
            <label>Descrição do produto<textarea required value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Descreva o produto, estado, características e informações importantes." rows={6} /></label>
          </section>

          <section className="form-section">
            <h2>Fotos</h2>
            <p className="form-help">A galeria de fotos será conectada ao armazenamento na próxima etapa.</p>
            <label className="upload-box"><span>Adicionar fotos</span><small>JPG, PNG ou WEBP</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
          </section>

          <section className="form-section">
            <h2>Configuração dos números</h2>
            <div className="form-grid">
              <label>Quantidade total de números<input required min="1" type="number" value={form.totalNumbers} onChange={(e) => update("totalNumbers", e.target.value)} /></label>
              <label>Valor por número<input required inputMode="decimal" value={form.pricePerNumber} onChange={(e) => update("pricePerNumber", e.target.value)} placeholder="1,00" /></label>
            </div>
            <div className="number-note"><strong>Distribuição automática</strong><span>Os números são criados no banco e poderão ser reservados automaticamente sem exibir uma lista gigante ao participante.</span></div>
          </section>

          <section className="form-section">
            <h2>Encerramento</h2>
            <label>Data e hora de encerramento<input required type="datetime-local" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></label>
          </section>

          <div className="form-actions">
            <a className="secondary-button" href="/">Cancelar</a>
            <button className="primary-button" type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar rifa"}</button>
          </div>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </main>
  );
}