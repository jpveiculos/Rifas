"use client";

import { useState } from "react";

export default function RaffleParticipant({ raffleId, priceInCents }: { raffleId: string; priceInCents: number }) {
  const [quantity, setQuantity] = useState("1");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);

  async function generateNumbers() {
    setLoading(true);
    setError("");
    setRequiresLogin(false);
    setNumbers([]);

    try {
      const response = await fetch("/api/rifas/" + raffleId + "/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: Number(quantity) })
      });
      const data = await response.json();

      if (!response.ok) {
        setRequiresLogin(response.status === 401);
        setError(data.error ?? "Não foi possível gerar os números.");
        return;
      }

      setNumbers(data.numbers);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  const total = (Number(quantity) * priceInCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  return (
    <div className="participant-box">
      <h2>Escolha quantos números deseja</h2>
      <p>Os números disponíveis serão escolhidos automaticamente para você.</p>

      <label>
        Quantidade
        <select value={quantity} onChange={(event) => setQuantity(event.target.value)}>
          {[1, 2, 3, 5, 10, 20, 50, 100].map((value) => (
            <option key={value} value={value}>{value} {value === 1 ? "número" : "números"}</option>
          ))}
        </select>
      </label>

      <div className="participant-total">
        <span>Total</span>
        <strong>{total}</strong>
      </div>

      <button className="primary-button participant-button" type="button" onClick={generateNumbers} disabled={loading}>
        {loading ? "Gerando..." : "Gerar meus números"}
      </button>

      {numbers.length > 0 && (
        <div className="generated-numbers">
          <h3>Seus números reservados</h3>
          <div className="number-list">
            {numbers.map((number) => <span key={number}>{String(number).padStart(5, "0")}</span>)}
          </div>
          <p>Esses números foram reservados para esta participação. O prazo de pagamento será definido no fluxo de pagamento.</p>
        </div>
      )}

      {error && <div className="error-message">{error}{requiresLogin && <> <a href="/login">Entrar</a> ou <a href="/cadastro">criar uma conta</a>.</>}</div>}
    </div>
  );
}