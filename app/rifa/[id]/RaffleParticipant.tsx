"use client";

import { useEffect, useState } from "react";

type Payment = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  amountInCents: number;
  orderId: string | null;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
  orderStatus: string | null;
  orderStatusDetail: string | null;
};

export default function RaffleParticipant({ raffleId, priceInCents }: { raffleId: string; priceInCents: number }) {
  const QUICK_QUANTITIES = [5, 10, 20, 30, 50, 100];
  const [quantity, setQuantity] = useState("5");
  const [showCustomQuantity, setShowCustomQuantity] = useState(false);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [reservationId, setReservationId] = useState("");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);

  async function generateNumbers() {
    const requestedQuantity = Number(quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 5) {
      setError("Escolha pelo menos 5 números.");
      return;
    }

    setLoading(true);
    setError("");
    setRequiresLogin(false);
    setNumbers([]);
    setReservationId("");
    setPayment(null);

    try {
      const response = await fetch("/api/rifas/" + raffleId + "/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: requestedQuantity })
      });
      const data = await response.json();

      if (!response.ok) {
        setRequiresLogin(response.status === 401);
        setError(data.error ?? "Não foi possível gerar os números.");
        return;
      }

      setNumbers(data.numbers);
      setReservationId(data.reservationId);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function createPayment() {
    if (!reservationId) return;

    setPaymentLoading(true);
    setError("");

    try {
      const response = await fetch("/api/rifas/" + raffleId + "/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Não foi possível iniciar o pagamento.");
        return;
      }

      setPayment(data.payment);
    } catch {
      setError("Não foi possível conectar ao Mercado Pago.");
    } finally {
      setPaymentLoading(false);
    }
  }

  async function refreshPayment() {
    if (!payment?.id || payment.status !== "PENDING") return;

    try {
      const response = await fetch(
        "/api/rifas/" + raffleId + "/payment/" + payment.id,
        { cache: "no-store" }
      );
      const data = await response.json();

      if (response.ok && data.payment) {
        setPayment(data.payment);
      }
    } catch {
      // O webhook continua sendo a confirmação principal; a consulta é apenas um fallback visual.
    }
  }

  useEffect(() => {
    if (!payment?.id || payment.status !== "PENDING") return;

    const timer = window.setInterval(refreshPayment, 5000);
    return () => window.clearInterval(timer);
  }, [payment?.id, payment?.status]);

  async function copyPixCode() {
    if (!payment?.qrCode) return;

    try {
      await navigator.clipboard.writeText(payment.qrCode);
      setError("");
      window.alert("Pix Copia e Cola copiado.");
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o código Pix para copiar.");
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

      {!payment && (
        <>
          <div className="quantity-selector" aria-label="Escolha a quantidade de números">
            {QUICK_QUANTITIES.map((value) => (
              <button
                key={value}
                type="button"
                className={"quantity-option" + (quantity === String(value) ? " selected" : "")}
                onClick={() => {
                  setQuantity(String(value));
                  setShowCustomQuantity(false);
                  setError("");
                }}
                disabled={numbers.length > 0}
              >
                <strong>{value}</strong>
                <span>{value === 1 ? "número" : "números"}</span>
              </button>
            ))}

            <button
              type="button"
              className={"quantity-option quantity-custom-option" + (showCustomQuantity ? " selected" : "")}
              onClick={() => {
                setShowCustomQuantity(true);
                setError("");
              }}
              disabled={numbers.length > 0}
            >
              <strong>＋</strong>
              <span>Adicionar mais</span>
            </button>
          </div>

          {showCustomQuantity && numbers.length === 0 && (
            <label className="custom-quantity-field">
              Quantos números você deseja?
              <input
                type="number"
                min="5"
                step="1"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Ex.: 150"
              />
            </label>
          )}

          <div className="participant-total">
            <span>Total</span>
            <strong>{total}</strong>
          </div>

          {numbers.length === 0 && (
            <button className="primary-button participant-button" type="button" onClick={generateNumbers} disabled={loading}>
              {loading ? "Gerando..." : "Gerar meus números"}
            </button>
          )}
        </>
      )}

      {numbers.length > 0 && (
        <div className="generated-numbers">
          <h3>Seus números reservados</h3>
          <div className="number-list">
            {numbers.map((number) => <span key={number}>{String(number).padStart(5, "0")}</span>)}
          </div>

          {!payment && (
            <>
              <p>Os números estão reservados para você. Agora faça o pagamento para confirmar sua participação.</p>
              <button className="primary-button participant-button" type="button" onClick={createPayment} disabled={paymentLoading}>
                {paymentLoading ? "Gerando Pix..." : "Pagar com Pix"}
              </button>
            </>
          )}
        </div>
      )}

      {payment && (
        <div className="payment-box">
          {payment.status === "APPROVED" ? (
            <>
              <h3>Pagamento aprovado!</h3>
              <p>Seus números foram confirmados com sucesso.</p>
              <a className="primary-button participant-button payment-link" href="/minha-conta">
                Ver meus números
              </a>
            </>
          ) : payment.status === "REJECTED" ? (
            <>
              <h3>Pagamento não concluído</h3>
              <p>Essa cobrança não foi aprovada. Gere uma nova reserva para tentar novamente.</p>
            </>
          ) : (
            <>
              <h3>Pagamento via Pix</h3>
              <p>
                Pague <strong>{(payment.amountInCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong> para confirmar seus números.
              </p>

              {payment.qrCodeBase64 && (
                <img
                  className="payment-qr"
                  src={"data:image/png;base64," + payment.qrCodeBase64}
                  alt="QR Code para pagamento Pix"
                />
              )}

              {payment.qrCode && (
                <>
                  <label className="payment-code-label">
                    Pix Copia e Cola
                    <textarea className="payment-code" value={payment.qrCode} readOnly rows={4} />
                  </label>
                  <button className="secondary-button participant-button" type="button" onClick={copyPixCode}>
                    Copiar código Pix
                  </button>
                </>
              )}

              {payment.ticketUrl && (
                <a className="secondary-button participant-button payment-link" href={payment.ticketUrl} target="_blank" rel="noreferrer">
                  Abrir pagamento do Mercado Pago
                </a>
              )}

              <p className="payment-waiting">Aguardando confirmação do pagamento...</p>
            </>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}{requiresLogin && <> <a href="/login">Entrar</a> ou <a href="/cadastro">criar uma conta</a>.</>}</div>}
    </div>
  );
}
