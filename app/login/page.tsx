"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível entrar.");
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
        <h1>Entrar</h1>
        <p>Entre com seu usuário e senha para participar das rifas.</p>

        <form className="auth-form" onSubmit={submit}>
          <label>Usuário<input required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
          <label>Senha<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        </form>

        {error && <div className="error-message">{error}</div>}

        <div className="auth-footer">
          <span>Ainda não tem cadastro?</span>
          <Link href="/cadastro">Criar conta</Link>
        </div>
        <Link className="auth-back" href="/">← Voltar para o início</Link>
      </div>
    </main>
  );
}
