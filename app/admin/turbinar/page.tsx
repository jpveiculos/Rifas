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
    "#RifasTOP #" + city.replace(/\s+/g, "") + " #Bahia";
}

function metricNumber(value: number) {
  return Number(value || 0).toLocaleString("pt-BR");
}

function cost(cents: number, count: number) {
  if (!count) return "—";
  return money(Math.round(cents / count));
}

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

async function createCreativeBlob(raffleId: string, productName: string, city: string) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  const source = "/api/admin/marketing/creative-image?raffleId=" + encodeURIComponent(raffleId);
  image.src = source + "&v=" + Date.now();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Não foi possível carregar a imagem oficial da rifa."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu preparar a arte.");

  const scale = Math.max(1200 / image.naturalWidth, 800 / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  ctx.drawImage(image, (1200 - width) / 2, (800 - height) / 2, width, height);

  const gradient = ctx.createLinearGradient(0, 380, 0, 800);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.55, "rgba(0,0,0,0.68)");
  gradient.addColorStop(1, "rgba(0,0,0,0.92)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 800);

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "top";
  ctx.font = "900 58px Arial";
  ctx.fillText("VOCÊ É DE " + city.toUpperCase() + "?", 55, 555);

  ctx.font = "700 31px Arial";
  const product = productName.length > 42 ? productName.slice(0, 42) + "…" : productName;
  ctx.fillText(product, 58, 630);

  ctx.font = "700 25px Arial";
  ctx.fillText("Confira no RifasTOP", 58, 686);

  ctx.font = "900 25px Arial";
  ctx.fillText("RifasTOP", 1010, 735);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Não foi possível gerar a arte.")), "image/png", 0.95);
  });
}

async function downloadCreative(raffleId: string, productName: string, city: string) {
  const blob = await createCreativeBlob(raffleId, productName, city);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "RifasTOP-" + slug(city) + ".png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function TurbinarPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [raffleId, setRaffleId] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>(CITIES.map((x) => x.city));
  const [destinationType, setDestinationType] = useState("RAFFLE");
  const [budget, setBudget] = useState("11,00");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState("");
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
          budget,
          objective: "Preparar materiais regionais para divulgação manual na Meta",
          creativeType: "SITE",
          destinationType,
          cities: variantsToCreate
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível preparar os materiais.");
      setMessage(data.citiesCount + " artes regionais foram preparadas. Agora você pode baixar cada peça e publicar manualmente na Meta, escolhendo a cidade e o orçamento.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível preparar os materiais.");
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

  async function downloadAll(campaign: Campaign) {
    setDownloading(campaign.id);
    setError("");
    try {
      for (const variant of campaign.variants) {
        await downloadCreative(campaign.raffleId, campaign.productName, variant.city);
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
      setMessage("As " + campaign.variants.length + " artes foram enviadas para os downloads do navegador.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar todas as artes.");
    } finally {
      setDownloading("");
    }
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
            <span className="boost-kicker">RIFASTOP • MOTOR DE MATERIAIS REGIONAIS</span>
            <h1>🚀 Turbinar no Instagram</h1>
            <p>O motor prepara uma arte e uma chamada para cada cidade. A publicação, a localização e o orçamento ficam sob seu controle na Central de Anúncios da Meta.</p>
          </div>
          <div className="boost-badge">CRIAR → BAIXAR → PUBLICAR</div>
        </header>

        {message && <div className="boost-message success">{message}</div>}
        {error && <div className="boost-message error">{error}</div>}

        <section className="boost-summary">
          <div><strong>{campaigns.length}</strong><span>campanhas preparadas</span></div>
          <div><strong>{money(totals.spend)}</strong><span>gasto registrado</span></div>
          <div><strong>{metricNumber(totals.reach)}</strong><span>alcance registrado</span></div>
          <div><strong>{metricNumber(totals.clicks)}</strong><span>cliques rastreados</span></div>
          <div><strong>{metricNumber(totals.registrations)}</strong><span>cadastros</span></div>
          <div><strong>{metricNumber(totals.participations)}</strong><span>participações</span></div>
        </section>

        <section className="boost-card">
          <h2>1. Escolha a rifa</h2>
          <p>O motor usa automaticamente a primeira imagem oficial cadastrada na rifa.</p>
          {loading ? <p>Carregando rifas...</p> : (
            <select value={raffleId} onChange={(event) => setRaffleId(event.target.value)}>
              <option value="">Selecione uma rifa ativa</option>
              {raffles.map((item) => <option key={item.id} value={item.id}>{item.productName} • {money(item.priceInCents)}</option>)}
            </select>
          )}
          {!loading && !raffles.length && <div className="boost-warning">Nenhuma rifa ativa encontrada.</div>}
          {sourceImageUrl && (
            <div className="official-creative-source">
              <strong>🖼️ Imagem oficial</strong>
              <span>Essa é a fonte usada para gerar as artes de cada cidade.</span>
              <img src={sourceImageUrl} alt={raffle?.productName || "Imagem oficial"} />
            </div>
          )}
        </section>

        <section className="boost-card">
          <h2>2. Cidades</h2>
          <p>O motor cria uma variação independente para cada cidade selecionada. Não publica nada na Meta.</p>
          <div className="boost-section-head">
            <strong>{selectedCities.length} de {CITIES.length} cidades selecionadas</strong>
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
          <h2>3. Destino e orçamento de referência</h2>
          <div className="boost-grid-2">
            <label>Destino que será colocado no texto/link
              <select value={destinationType} onChange={(event) => setDestinationType(event.target.value)}>
                <option value="RAFFLE">Página da rifa</option>
                <option value="HOME">Página principal do RifasTOP</option>
              </select>
            </label>
            <label>Orçamento diário de referência
              <input value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="decimal" placeholder="11,00" />
              <small className="field-note">Informativo. Este valor não é enviado à Meta; você define o orçamento na publicação manual.</small>
            </label>
          </div>
          <div className="boost-create-row">
            <span>{variantsToCreate.length} artes e {variantsToCreate.length} chamadas regionais serão preparadas.</span>
            <button className="boost-primary" disabled={!raffle || !variantsToCreate.length || saving} onClick={createCampaign}>
              {saving ? "Preparando..." : "🚀 Preparar materiais"}
            </button>
          </div>
        </section>

        <section className="boost-card boost-next">
          <h2>🧭 Depois que o motor preparar</h2>
          <div className="boost-roadmap">
            <span>01 • Baixar a arte</span><span>02 • Criar anúncio na Meta</span><span>03 • Selecionar somente a cidade</span><span>04 • Definir orçamento</span><span>05 • Publicar</span>
          </div>
          <p>Você continua controlando a segmentação geográfica e o orçamento diretamente na Central de Anúncios. O RifasTOP não mantém conexão nem envia campanhas automaticamente para a Meta.</p>
        </section>

        <section className="boost-card">
          <div className="boost-section-head">
            <div><h2>🎨 Materiais preparados</h2><p>Cada cidade tem sua própria chamada e sua própria arte. As imagens são geradas em 1200 × 800 px a partir da imagem oficial da rifa.</p></div>
          </div>
          {!campaigns.length && <div className="boost-empty">Nenhum material preparado ainda.</div>}
          <div className="campaign-list">
            {campaigns.map((campaign) => (
              <article className="campaign-card" key={campaign.id}>
                <div className="campaign-head">
                  <div>
                    <span className="campaign-status">MATERIAIS PRONTOS</span>
                    <h3>{campaign.name}</h3>
                    <p>{campaign.productName} • {campaign.variants.length} cidades</p>
                  </div>
                  <button className="boost-primary" disabled={downloading === campaign.id} onClick={() => downloadAll(campaign)}>
                    {downloading === campaign.id ? "Gerando..." : "⬇️ Baixar todas as artes"}
                  </button>
                </div>

                <div className="creative-grid">
                  {campaign.variants.map((variant) => (
                    <div className="creative-preview-card" key={variant.id}>
                      <div className="creative-preview" style={{ aspectRatio: "3 / 2" }}>
                        {variant.sourceImageUrl ? <img src={variant.sourceImageUrl} alt={variant.city} /> : null}
                        <div className="creative-overlay">
                          <b>VOCÊ É DE {variant.city.toUpperCase()}?</b>
                          <span>{campaign.productName}</span>
                        </div>
                      </div>
                      <strong>{variant.city}</strong>
                      <small>Arte 1200 × 800 • público separado na Meta</small>
                      <button
                        className="boost-secondary"
                        disabled={downloading === variant.id}
                        onClick={async () => {
                          setDownloading(variant.id);
                          try {
                            await downloadCreative(campaign.raffleId, campaign.productName, variant.city);
                            setMessage("Arte de " + variant.city + " baixada.");
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Não foi possível baixar a arte.");
                          } finally {
                            setDownloading("");
                          }
                        }}
                      >
                        {downloading === variant.id ? "Gerando..." : "⬇️ Baixar arte"}
                      </button>
                      <button className="boost-secondary" onClick={() => copyText(variant.caption, variant.id)}>
                        {copied === variant.id ? "✓ Texto copiado" : "📋 Copiar texto"}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="campaign-table-wrap">
                  <table className="campaign-table">
                    <thead><tr><th>Cidade</th><th>Gasto</th><th>Alcance</th><th>Cliques rastreados</th><th>Cadastros</th><th>Participações</th><th>Ação</th></tr></thead>
                    <tbody>
                      {campaign.variants.map((variant) => (
                        <tr key={variant.id}>
                          <td><strong>{variant.city}</strong><small>{variant.distanceKm ? variant.distanceKm + " km" : "base"}</small></td>
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
