"use client";

import { useEffect, useMemo, useState } from "react";
import "./turbinar.css";

type Raffle = {
  id: string;
  productName: string;
  city: string;
  priceInCents: number;
  status: string;
  imageUrls?: string[];
};

type City = { city: string; distanceKm: number };
type Variant = {
  id: string;
  city: string;
  distanceKm: number;
  creativeType: string;
  caption: string;
  trackingCode: string;
  destinationPath: string;
  sourceImageUrl?: string;
  metrics: {
    spendCents: number;
    impressions: number;
    reach: number;
    engagements: number;
    profileVisits: number;
    linkClicks: number;
    registrations: number;
    participations: number;
    trackedClicks?: number;
  };
};
type Campaign = {
  id: string;
  name: string;
  raffleId: string;
  objective: string;
  budgetCents: number;
  destinationType: string;
  status: string;
  createdAt: string;
  productName: string;
  priceInCents: number;
  variants: Variant[];
};

const CITIES: City[] = [
  { city: "Paramirim", distanceKm: 0 },
  { city: "Érico Cardoso", distanceKm: 18 },
  { city: "Caturama", distanceKm: 35 },
  { city: "Botuporã", distanceKm: 42 },
  { city: "Boquira", distanceKm: 45 },
  { city: "Ibipitanga", distanceKm: 55 },
  { city: "Rio do Pires", distanceKm: 60 },
  { city: "Macaúbas", distanceKm: 65 },
  { city: "Tanque Novo", distanceKm: 75 },
  { city: "Livramento de Nossa Senhora", distanceKm: 76 },
  { city: "Igaporã", distanceKm: 80 },
  { city: "Rio de Contas", distanceKm: 81 },
  { city: "Lagoa Real", distanceKm: 88 },
  { city: "Novo Horizonte", distanceKm: 93 },
  { city: "Caetité", distanceKm: 95 },
  { city: "Dom Basílio", distanceKm: 97 },
  { city: "Abaíra", distanceKm: 66 },
  { city: "Piatã", distanceKm: 68 },
  { city: "Jussiape", distanceKm: 71 },
  { city: "Riacho de Santana", distanceKm: 78 },
  { city: "Ibitiara", distanceKm: 88 },
  { city: "Ibiassucê", distanceKm: 93 },
  { city: "Boninal", distanceKm: 94 }
];

const hooks = [
  "VOCÊ É DE {CITY}? 👀",
  "ALÔ, {CITY}! OLHA ESSA! 🔥",
  "{CITY}, JÁ VIU ESSA NOVIDADE?",
  "EI, {CITY}! ISSO É AÍ PERTINHO DE VOCÊ.",
  "QUEM É DE {CITY} PRECISA VER ISSO."
];

const bodies = [
  "Confira a campanha do RifasTOP e veja todos os detalhes no site.",
  "O prêmio está disponível no RifasTOP. Entre no site e confira as informações.",
  "Uma campanha do RifasTOP para a nossa região. Veja o produto e as condições no site."
];

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildCaption(raffle: Raffle, city: string, variant: number) {
  const hook = hooks[variant % hooks.length].replace("{CITY}", city.toUpperCase());
  const body = bodies[variant % bodies.length];
  return hook + "\n\n" + body + "\n\n🏆 " + raffle.productName +
    "\n💰 " + money(raffle.priceInCents) + " por número\n\n" +
    "👉 Acesse o RifasTOP e confira a campanha.\n📍 " + city + " e região\n\n" +
    "#RifasTOP #" + city.replace(/\\s+/g, "") + " #Bahia";
}

function metricNumber(value: number) {
  return Number(value || 0).toLocaleString("pt-BR");
}

function cost(cents: number, count: number) {
  if (!count) return "—";
  return money(Math.round(cents / count));
}

export default function TurbinarPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [raffleId, setRaffleId] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>(CITIES.map((x) => x.city));
  const [destinationType, setDestinationType] = useState("RAFFLE");
  const [budget, setBudget] = useState("50,00");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const raffle = raffles.find((item) => item.id === raffleId);
  const sourceImageUrl = raffle?.imageUrls?.[0] || "";

  const variantsToCreate = useMemo(() => {
    if (!raffle) return [];
    return selectedCities.map((city, index) => {
      const found = CITIES.find((item) => item.city === city);
      return {
        city,
        distanceKm: found?.distanceKm ?? 0,
        caption: buildCaption(raffle, city, index)
      };
    });
  }, [raffle, selectedCities]);

  async function load() {
    setLoading(true);
    try {
      const [raffleResponse, campaignResponse] = await Promise.all([
        fetch("/api/rifas", { cache: "no-store" }),
        fetch("/api/admin/marketing/campaigns", { cache: "no-store" })
      ]);
      const raffleData = await raffleResponse.json();
      const campaignData = await campaignResponse.json();
      if (!raffleResponse.ok) throw new Error(raffleData.error || "Não foi possível carregar as rifas.");
      if (!campaignResponse.ok) throw new Error(campaignData.error || "Não foi possível carregar as campanhas.");
      setRaffles((raffleData.raffles || []).filter((item: Raffle) => item.status === "ACTIVE"));
      setCampaigns(campaignData.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o motor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggleCity(city: string) {
    setSelectedCities((current) => current.includes(city) ? current.filter((item) => item !== city) : [...current, city]);
  }

  async function copyText(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1400);
  }

  async function createCampaign() {
    if (!raffle || !variantsToCreate.length) {
      setError("Selecione uma rifa e pelo menos uma cidade.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raffleId,
          name: raffle.productName,
          budget,
          objective: "Alcançar pessoas que ainda não seguem o Instagram",
          creativeType: "SITE",
          destinationType,
          cities: variantsToCreate
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível criar a campanha.");
      setMessage(data.publishedToMeta ? "Campanha criada e publicada na Meta. Cada cidade recebeu um anúncio e um link de rastreamento próprio." : "Campanha criada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a campanha.");
    } finally {
      setSaving(false);
    }
  }

  async function saveMetrics(campaignId: string, variant: Variant) {
    setError("");
    try {
      const response = await fetch("/api/admin/marketing/campaigns/" + campaignId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: variant.id,
          spendCents: variant.metrics.spendCents,
          impressions: variant.metrics.impressions,
          reach: variant.metrics.reach,
          engagements: variant.metrics.engagements,
          profileVisits: variant.metrics.profileVisits,
          linkClicks: variant.metrics.linkClicks,
          registrations: variant.metrics.registrations,
          participations: variant.metrics.participations
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível salvar.");
      setMessage("Métricas salvas.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar as métricas.");
    }
  }

  function updateMetric(campaignId: string, variantId: string, field: keyof Variant["metrics"], value: string) {
    const numeric = Math.max(0, Math.floor(Number(value.replace(",", ".")) || 0));
    setCampaigns((current) => current.map((campaign) => campaign.id !== campaignId ? campaign : {
      ...campaign,
      variants: campaign.variants.map((variant) => variant.id !== variantId ? variant : {
        ...variant,
        metrics: { ...variant.metrics, [field]: numeric }
      })
    }));
  }

  const totals = campaigns.reduce((acc, campaign) => {
    campaign.variants.forEach((variant) => {
      acc.spend += variant.metrics.spendCents;
      acc.reach += variant.metrics.reach;
      acc.clicks += Number(variant.metrics.trackedClicks ?? 0);
      acc.registrations += variant.metrics.registrations;
      acc.participations += variant.metrics.participations;
    });
    return acc;
  }, { spend: 0, reach: 0, clicks: 0, registrations: 0, participations: 0 });

  return (
    <main className="boost-page">
      <div className="boost-container">
        <header className="boost-header">
          <div>
            <a href="/admin" className="boost-back">← Voltar para administração</a>
            <span className="boost-kicker">RIFASTOP • MOTOR DE CAMPANHAS</span>
            <h1>🚀 Turbinar no Instagram</h1>
            <p>Prepare campanhas regionais, gere uma variação por cidade e acompanhe o que acontece depois do anúncio.</p>
          </div>
          <div className="boost-badge">TESTE → MEDIR → COMPARAR → ESCALAR</div>
        </header>

        {message && <div className="boost-message success">{message}</div>}
        {error && <div className="boost-message error">{error}</div>}

        <section className="boost-summary">
          <div><strong>{campaigns.length}</strong><span>campanhas salvas</span></div>
          <div><strong>{money(totals.spend)}</strong><span>gasto registrado</span></div>
          <div><strong>{metricNumber(totals.reach)}</strong><span>alcance registrado</span></div>
          <div><strong>{metricNumber(totals.clicks)}</strong><span>cliques rastreados</span></div>
          <div><strong>{metricNumber(totals.registrations)}</strong><span>cadastros</span></div>
          <div><strong>{metricNumber(totals.participations)}</strong><span>participações</span></div>
        </section>

        <section className="boost-card">
          <div className="boost-section-head">
            <div><h2>1. Escolha a rifa</h2><p>O criativo e os links ficarão vinculados à campanha escolhida.</p></div>
          </div>
          {loading ? <p>Carregando rifas...</p> : (
            <select value={raffleId} onChange={(event) => setRaffleId(event.target.value)}>
              <option value="">Selecione uma rifa ativa</option>
              {raffles.map((item) => <option key={item.id} value={item.id}>{item.productName} • {money(item.priceInCents)}</option>)}
            </select>
          )}
          {!loading && !raffles.length && <div className="boost-warning">Nenhuma rifa ativa encontrada.</div>}
        </section>

        <section className="boost-card">
          <h2>2. Objetivo</h2>
          <div className="boost-objective">
            <strong>🎯 Alcançar pessoas que ainda não seguem o Instagram</strong>
            <span>O motor organiza a campanha e mede o resultado. A entrega e a aprovação do anúncio continuam sendo feitas pela Meta.</span>
          </div>
        </section>

        <section className="boost-card">
          <div className="boost-section-head">
            <div><h2>3. Região</h2><p>Uma variação e um link de rastreamento serão criados para cada cidade.</p></div>
            <button className="boost-link" onClick={() => setSelectedCities(selectedCities.length === CITIES.length ? [] : CITIES.map((x) => x.city))}>
              {selectedCities.length === CITIES.length ? "Limpar todas" : "Selecionar todas"}
            </button>
          </div>
          <div className="city-grid">
            {CITIES.map((item) => (
              <label className={"city-chip " + (selectedCities.includes(item.city) ? "selected" : "")} key={item.city}>
                <input type="checkbox" checked={selectedCities.includes(item.city)} onChange={() => toggleCity(item.city)} />
                <span><b>{item.city}</b><small>{item.distanceKm === 0 ? "base" : item.distanceKm + " km"}</small></span>
              </label>
            ))}
          </div>
        </section>

        <section className="boost-card">
          <h2>4. Imagem oficial e destino</h2>
          <div className="boost-grid-2">
            <div className="official-creative-source">
              <strong>🖼️ Imagem oficial da rifa</strong>
              <span>O motor usa automaticamente a primeira imagem oficial cadastrada e publicada na rifa. Você não precisa escolher outro modelo de imagem.</span>
              {sourceImageUrl && (
                <img src={sourceImageUrl} alt={raffle?.productName || "Imagem oficial da rifa"} />
              )}
            </div>
            <label>Destino do anúncio
              <select value={destinationType} onChange={(event) => setDestinationType(event.target.value)}>
                <option value="RAFFLE">Página da rifa</option>
                <option value="HOME">Página principal do RifasTOP</option>
              </select>
            </label>
          </div>

          {!sourceImageUrl && (
            <div className="boost-warning">Esta rifa ainda não possui uma imagem oficial cadastrada. Cadastre a imagem na própria rifa para utilizá-la na divulgação.</div>
          )}
                </section>

        <section className="boost-card">
          <h2>5. Orçamento</h2>
          <div className="boost-grid-2">
            <label>Orçamento diário na Meta
              <input value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="decimal" placeholder="50,00" />
            </label>
            <div>
              <strong>Nome da campanha</strong>
              <div className="boost-objective">
                <strong>{raffle ? raffle.productName : "Selecione uma rifa"}</strong>
                <span>O nome da campanha será automaticamente o nome da rifa escolhida.</span>
              </div>
            </div>
          </div>
          <div className="boost-create-row">
            <span>{variantsToCreate.length} anúncios serão publicados • {selectedCities.length} cidades • orçamento diário: {money(Math.round((Number(budget.replace(",", ".")) || 0) * 100))}</span>
            <button className="boost-primary" disabled={!raffle || !variantsToCreate.length || saving} onClick={createCampaign}>
              {saving ? "Publicando..." : "🚀 Criar e publicar campanha"}
            </button>
          </div>
        </section>

        <section className="boost-card boost-next">
          <h2>🧠 Como o motor vai aprender</h2>
          <div className="boost-roadmap">
            <span>01 • Conteúdo</span><span>02 • Publicação</span><span>03 • Alcance</span><span>04 • Métricas</span><span>05 • Resultado</span>
          </div>
          <p>O motor não tenta burlar a análise da Meta. Ele guarda o padrão de criativo que você usa, separa as regiões e mede os resultados para descobrir onde o investimento está funcionando melhor.</p>
        </section>

        <section className="boost-card">
          <div className="boost-section-head">
            <div><h2>📊 Campanhas e resultados</h2><p>Depois que a campanha rodar, lance aqui os números do Instagram/Meta. Os links por cidade são medidos automaticamente pelo RifasTOP.</p></div>
            <button className="boost-secondary" onClick={load}>↻ Atualizar</button>
          </div>

          {!campaigns.length && <div className="boost-empty">Nenhuma campanha criada ainda. Monte a primeira acima.</div>}

          <div className="campaign-list">
            {campaigns.map((campaign) => (
              <article className="campaign-card" key={campaign.id}>
                <div className="campaign-head">
                  <div>
                    <span className="campaign-status">{campaign.status === "READY" ? "PRONTA" : campaign.status}</span>
                    <h3>{campaign.name}</h3>
                    <p>{campaign.productName} • orçamento {money(campaign.budgetCents)} • {campaign.variants.length} cidades</p>
                  </div>
                  <a href="https://www.facebook.com/business/tools/ads-manager" target="_blank" rel="noreferrer" className="meta-link">Abrir Ads Manager ↗</a>
                </div>

                <div className="campaign-table-wrap">
                  <table className="campaign-table">
                    <thead><tr><th>Cidade</th><th>Gasto</th><th>Alcance</th><th>Cliques rastreados</th><th>Cadastros</th><th>Participações</th><th>Ação</th></tr></thead>
                    <tbody>
                      {campaign.variants.map((variant) => (
                        <tr key={variant.id}>
                          <td><strong>{variant.city}</strong><small>{variant.distanceKm ? variant.distanceKm + " km" : "base"} • {variant.creativeType}</small></td>
                          <td>{money(variant.metrics.spendCents)}</td>
                          <td>{metricNumber(variant.metrics.reach)}</td>
                          <td>{metricNumber(Number(variant.metrics.trackedClicks ?? 0))}</td>
                          <td>{metricNumber(variant.metrics.registrations)}</td>
                          <td>{metricNumber(variant.metrics.participations)}</td>
                          <td><button className="boost-secondary" onClick={() => copyText(window.location.origin + "/go/" + variant.trackingCode, variant.trackingCode)}>{copied === variant.trackingCode ? "✓ Copiado" : "🔗 Link"}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="variant-editor-list">
                  {campaign.variants.map((variant) => (
                    <details key={variant.id}>
                      <summary>Editar métricas — {variant.city}</summary>
                      <div className="metrics-grid">
                        {([
                          ["spendCents", "Gasto (R$)", true],
                          ["impressions", "Impressões", false],
                          ["reach", "Alcance", false],
                          ["engagements", "Engajamentos", false],
                          ["profileVisits", "Visitas ao perfil", false],
                          ["linkClicks", "Cliques no link", false],
                          ["registrations", "Cadastros", false],
                          ["participations", "Participações", false]
                        ] as const).map(([field, label, currency]) => (
                          <label key={field}>{label}
                            <input
                              value={currency ? (variant.metrics.spendCents / 100).toFixed(2).replace(".", ",") : String(variant.metrics[field])}
                              onChange={(event) => updateMetric(campaign.id, variant.id, field, currency ? String(Math.round((Number(event.target.value.replace(",", ".")) || 0) * 100)) : event.target.value)}
                              inputMode="decimal"
                            />
                          </label>
                        ))}
                      </div>
                      <div className="metric-actions">
                        <span>CPC: {cost(variant.metrics.spendCents, variant.metrics.linkClicks)} • Custo/cadastro: {cost(variant.metrics.spendCents, variant.metrics.registrations)} • Custo/participação: {cost(variant.metrics.spendCents, variant.metrics.participations)}</span>
                        <button className="boost-primary" onClick={() => saveMetrics(campaign.id, variant)}>Salvar métricas</button>
                      </div>
                      <div className="tracking-box">
                        <strong>Link rastreável desta cidade</strong>
                        <code>{typeof window !== "undefined" ? window.location.origin : "https://rifastop.com.br"}/go/{variant.trackingCode}</code>
                        <button className="boost-secondary" onClick={() => copyText((typeof window !== "undefined" ? window.location.origin : "https://rifastop.com.br") + "/go/" + variant.trackingCode, variant.trackingCode + "-detail")}>{copied === variant.trackingCode + "-detail" ? "✓ Copiado" : "Copiar link"}</button>
                      </div>
                      <pre className="caption-preview">{variant.caption}</pre>
                    </details>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
