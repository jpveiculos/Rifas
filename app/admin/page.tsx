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
  const [saved, setSaved] = useState(false);

  function update(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <main className="admin-page">
      <div className="container admin-container">
        <div className="admin-heading">
          <div>
            <a className="back-link" href="/">← Voltar para a página inicial</a>
            <h1>Criar nova rifa</h1>
            <p>Cadastre sua rifa e deixe os dados prontos para publicação.</p>
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
            <p className="form-help">Adicione as fotos do produto. A galeria será exibida na página da rifa.</p>
            <label className="upload-box"><span>Adicionar fotos</span><small>JPG, PNG ou WEBP</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple /></label>
          </section>

          <section className="form-section">
            <h2>Configuração dos números</h2>
            <div className="form-grid">
              <label>Quantidade total de números<input required min="1" type="number" value={form.totalNumbers} onChange={(e) => update("totalNumbers", e.target.value)} /></label>
              <label>Valor por número<input required inputMode="decimal" value={form.pricePerNumber} onChange={(e) => update("pricePerNumber", e.target.value)} placeholder="1,00" /></label>
            </div>
            <div className="number-note"><strong>Distribuição automática</strong><span>O participante escolherá a quantidade. O sistema gerará automaticamente somente números disponíveis.</span></div>
          </section>

          <section className="form-section">
            <h2>Encerramento</h2>
            <label>Data e hora de encerramento<input required type="datetime-local" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} /></label>
          </section>

          <div className="form-actions">
            <a className="secondary-button" href="/">Cancelar</a>
            <button className="primary-button" type="submit">Salvar rifa</button>
          </div>

          {saved && <div className="success-message">Cadastro preenchido. A gravação permanente será ligada ao banco de dados na próxima etapa.</div>}
        </form>
      </div>
    </main>
  );
}