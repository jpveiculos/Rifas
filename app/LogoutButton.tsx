"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } finally {
      window.location.replace("/");
    }
  }

  return (
    <button
      className="header-logout"
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Sair"
    >
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}
