"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function CadastroPage() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [username, setUsername] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, username, whatsapp, password })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível criar a conta.");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="auth-brand" href="/">Rifas</Link>
        <h1>Criar conta</h1>
        <p>Preencha seus dados para criar sua conta.</p>

        <form className="auth-form" onSubmit={submit} noValidate={false}>
          <label className="auth-field"><span>Nome completo</span><input required minLength={3} maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" /></label>
          <label className="auth-field"><span>Nome da cidade</span><input required minLength={2} maxLength={80} autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Sua cidade" /></label>
          <label className="auth-field"><span>Contato</span><input required inputMode="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp ou telefone" /></label>
          <label className="auth-field"><span>Nome de usuário</span><input required minLength={3} maxLength={30} autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex.: joao123" /></label>
          <label className="auth-field"><span>Senha</span><input required minLength={4} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crie sua senha" /></label>
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "Criando..." : "Criar minha conta"}</button>
        </form>

        {error && <div className="error-message">{error}</div>}

        <div className="auth-footer">
          <span>Já tem uma conta?</span>
          <Link href="/login">Entrar</Link>
        </div>
        <Link className="auth-back" href="/">← Voltar para o início</Link>
      </div>
    </main>
  );
}
