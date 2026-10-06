"use client";

import { useEffect, useState } from "react";

type Props = {
  expiresAt: string;
};

function remaining(expiresAt: string) {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

export default function PaymentCountdown({ expiresAt }: Props) {
  const [ms, setMs] = useState(() => remaining(expiresAt));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMs(remaining(expiresAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [expiresAt]);

  if (ms <= 0) {
    return <span className="payment-countdown expired">Prazo para pagamento encerrado.</span>;
  }

  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <span className="payment-countdown">
      Tempo para pagar: <strong>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</strong>
    </span>
  );
}
