"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Senha administrativa incorreta.");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link className="auth-brand" href="/">Rifas.TOP</Link>
        <h1>Área administrativa</h1>
        <p>Entre para gerenciar suas rifas.</p>

        <form className="auth-form" onSubmit={submit}>
          <label>
            Senha administrativa
            <input
              required
              autoFocus
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        <Link className="auth-back" href="/">← Voltar para o início</Link>
      </div>
    </main>
  );
}
