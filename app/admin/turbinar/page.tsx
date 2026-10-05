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

const FORMATS = [
  {
    id: "feed",
    name: "Feed / Tráfego pago",
    description: "Instagram e Facebook Feed",
    ratio: "4:5",
    width: 1440,
    height: 1800,
    note: "1440 × 1800 px"
  },
  {
    id: "post",
    name: "Publicação Instagram",
    description: "Post vertical + grade do perfil",
    ratio: "3:4",
    width: 1080,
    height: 1440,
    note: "1080 × 1440 px"
  },
  {
    id: "stories",
    name: "Stories / Reels",
    description: "Tela cheia vertical",
    ratio: "9:16",
    width: 1440,
    height: 2560,
    note: "1440 × 2560 px"
  },
  {
    id: "square",
    name: "Quadrado / Carrossel",
    description: "Formato 1:1",
    ratio: "1:1",
    width: 1440,
    height: 1440,
    note: "1440 × 1440 px"
  }
] as const;

const LAYOUTS = [
  { id: 0, name: "Impacto", description: "Imagem preservada + chamada forte" },
  { id: 1, name: "Dividida", description: "Imagem preservada + informação em blocos" },
  { id: 2, name: "Pôster", description: "Composição editorial" }
];

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

async function createCreativeBlob(
  raffleId: string,
  productName: string,
  city: string,
  priceInCents: number,
  formatId: typeof FORMATS[number]["id"],
  layoutIndex: number
) {
  const format = FORMATS.find((item) => item.id === formatId) || FORMATS[0];
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = "/api/admin/marketing/creative-image?raffleId=" + encodeURIComponent(raffleId) + "&v=" + Date.now();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Não foi possível carregar a imagem oficial da rifa."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu preparar a arte.");

  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const BLACK = "#080808";
  const W = format.width;
  const H = format.height;

  function contained(x: number, y: number, w: number, h: number, pad = 0) {
    const boxW = Math.max(1, w - pad * 2);
    const boxH = Math.max(1, h - pad * 2);
    const scale = Math.min(boxW / image.naturalWidth, boxH / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx!.drawImage(image, x + (w - width) / 2, y + (h - height) / 2, width, height);
  }

  function roundedRect(x: number, y: number, w: number, h: number, radius: number) {
    ctx!.beginPath();
    ctx!.roundRect(x, y, w, h, radius);
    ctx!.fill();
  }

  function fitText(text: string, max: number) {
    return text.length > max ? text.slice(0, max - 1) + "…" : text;
  }

  function drawBrand(y: number, dark = false) {
    ctx.fillStyle = dark ? BLACK : WHITE;
    ctx.font = "900 " + Math.max(28, Math.round(W * 0.025)) + "px Arial";
    ctx.fillText("RifasTOP", W * 0.055, y);
  }

  function drawInfo(y: number, scale = 1) {
    const cityName = city.toUpperCase();
    const product = fitText(productName, formatId === "stories" ? 34 : 42);
    ctx.fillStyle = GOLD;
    ctx.font = "900 " + Math.round(60 * scale) + "px Arial";
    ctx.fillText(cityName, W * 0.055, y);
    ctx.fillStyle = WHITE;
    ctx.font = "700 " + Math.round(28 * scale) + "px Arial";
    ctx.fillText(product, W * 0.055, y + Math.round(48 * scale));
    ctx.font = "900 " + Math.round(27 * scale) + "px Arial";
    ctx.fillText(money(priceInCents) + " por número", W * 0.055, y + Math.round(91 * scale));
  }

  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, H);

  if (formatId === "stories") {
    const topSafe = H * 0.14;
    const bottomSafe = H * 0.30;
    const imageAreaH = H * 0.43;
    const textY = H - bottomSafe + 55;

    ctx.fillStyle = "#111111";
    ctx.fillRect(W * 0.04, topSafe, W * 0.92, imageAreaH);
    contained(W * 0.04, topSafe, W * 0.92, imageAreaH, 22);

    ctx.fillStyle = GOLD;
    roundedRect(W * 0.055, topSafe + imageAreaH + 38, W * 0.38, 68, 28);
    ctx.fillStyle = BLACK;
    ctx.font = "900 28px Arial";
    ctx.fillText("RIFASTOP", W * 0.082, topSafe + imageAreaH + 82);

    drawInfo(textY, 1.15);
    ctx.fillStyle = WHITE;
    ctx.font = "700 28px Arial";
    ctx.fillText("ACESSE O RIFASTOP", W * 0.055, H - bottomSafe + 190);

    if (layoutIndex === 1) {
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 6;
      ctx.strokeRect(W * 0.04, topSafe, W * 0.92, imageAreaH);
    }

    if (layoutIndex === 2) {
      ctx.fillStyle = "rgba(212,175,55,0.16)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = BLACK;
      ctx.fillRect(W * 0.05, H * 0.76, W * 0.90, H * 0.16);
      drawInfo(H * 0.84, 1.0);
    }
  } else {
    const imageAreaH = formatId === "feed" ? H * 0.55 : formatId === "post" ? H * 0.56 : H * 0.58;
    const imageY = formatId === "square" ? H * 0.04 : H * 0.055;

    ctx.fillStyle = "#111111";
    roundedRect(W * 0.035, imageY, W * 0.93, imageAreaH, 24);
    contained(W * 0.035, imageY, W * 0.93, imageAreaH, 20);

    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 5;
    ctx.strokeRect(W * 0.035, imageY, W * 0.93, imageAreaH);

    if (layoutIndex === 1) {
      ctx.fillStyle = GOLD;
      ctx.fillRect(W * 0.035, imageY + imageAreaH - 18, W * 0.93, 18);
      drawBrand(imageY + 48);
    } else {
      drawBrand(imageY + 48);
    }

    if (layoutIndex === 2) {
      ctx.fillStyle = GOLD;
      ctx.font = "900 " + Math.round(W * 0.048) + "px Arial";
      ctx.fillText("DIVULGAÇÃO", W * 0.055, imageY + imageAreaH + 82);
    }

    drawInfo(imageY + imageAreaH + (layoutIndex === 2 ? 160 : 115), formatId === "post" ? 1.0 : 0.95);

    ctx.fillStyle = GOLD;
    roundedRect(W * 0.055, H - 105, W * 0.42, 55, 24);
    ctx.fillStyle = BLACK;
    ctx.font = "900 " + Math.max(22, Math.round(W * 0.018)) + "px Arial";
    ctx.fillText("CONFIRA NO RIFASTOP", W * 0.075, H - 70);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Não foi possível gerar a arte.")),
      "image/png"
    );
  });
}

async function downloadCreative(
  raffleId: string,
  productName: string,
  city: string,
  priceInCents: number,
  formatId: typeof FORMATS[number]["id"],
  layoutIndex: number
) {
  const blob = await createCreativeBlob(raffleId, productName, city, priceInCents, formatId, layoutIndex);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    "RifasTOP-" + slug(city) + "-" + slug(FORMATS.find((item) => item.id === formatId)?.name || formatId) +
    "-" + slug(LAYOUTS[layoutIndex].name) + ".png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function TurbinarPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [raffleId, setRaffleId] = useState("");
  const [requestedRaffleId, setRequestedRaffleId] = useState("");
  const [fromCreate, setFromCreate] = useState(false);
  const [formatId, setFormatId] = useState<typeof FORMATS[number]["id"]>("feed");
  const [selectedCities, setSelectedCities] = useState<string[]>(CITIES.map((item) => item.city));
  const [selectedLayout, setSelectedLayout] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const raffle = raffles.find((item) => item.id === raffleId);
  const sourceImageUrl = raffle?.imageUrls?.[0] || "";
  const format = FORMATS.find((item) => item.id === formatId) || FORMATS[0];

  const totalArts = useMemo(() => selectedCities.length, [selectedCities.length]);

  async function loadRaffles() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/rifas", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar as rifas.");

      const allRaffles = (data.raffles || []) as Raffle[];
      // Normalmente o gerador mostra somente rifas ativas. Quando a criação acabou
      // de acontecer, porém, a rifa ainda está em RASCUNHO e precisa aparecer aqui
      // para que a arte seja preparada antes da publicação.
      const visibleRaffles = allRaffles.filter(
        (item) => item.status === "ACTIVE" || item.id === requestedRaffleId
      );
      setRaffles(visibleRaffles);

      if (requestedRaffleId && visibleRaffles.some((item) => item.id === requestedRaffleId)) {
        setRaffleId(requestedRaffleId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as rifas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("raffleId") || "";
    const created = params.get("fromCreate") === "1";
    setRequestedRaffleId(requested);
    setFromCreate(created);
  }, []);

  useEffect(() => {
    loadRaffles();
  }, [requestedRaffleId]);

  function toggleCity(city: string) {
    setSelectedCities((current) =>
      current.includes(city) ? current.filter((item) => item !== city) : [...current, city]
    );
  }

  async function downloadOne(city: string, layoutId: number) {
    if (!raffle) return;
    const key = city + "-" + formatId + "-" + layoutId;
    setDownloadingKey(key);
    setError("");
    try {
      await downloadCreative(raffle.id, raffle.productName, city, raffle.priceInCents, formatId, layoutId);
      setMessage(format.name + " • " + city + " • " + LAYOUTS[layoutId].name + " baixada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar a arte.");
    } finally {
      setDownloadingKey("");
    }
  }

  async function downloadAll() {
    if (!raffle || !selectedCities.length) return;

    setGenerating(true);
    setError("");
    setMessage("");

    try {
      let count = 0;
      for (const city of selectedCities) {
        await downloadCreative(raffle.id, raffle.productName, city, raffle.priceInCents, formatId, selectedLayout);
        count += 1;
        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }
      setMessage(count + " artes " + format.name + " foram baixadas. Nenhuma arte foi cortada para caber em outro formato.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar todas as artes.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="boost-page">
      <div className="boost-container">
        <header className="boost-header">
          <div>
            <a href="/admin" className="boost-back">← Voltar para administração</a>
            <span className="boost-kicker">RIFASTOP • GERADOR DE ARTES</span>
            <h1>🎨 Artes nos tamanhos reais da Meta</h1>
            <p>
              Agora cada arquivo é criado para o posicionamento correto. O sistema não pega uma arte
              1200 × 800 e força o mesmo arquivo em todos os lugares.
            </p>
          </div>
          <div className="boost-badge">META • FORMATOS NATIVOS</div>
        </header>

        {fromCreate && raffle && (
          <div className="boost-message success">
            Rifa criada. A imagem, o produto e o preço já estão carregados abaixo. As artes serão montadas nos formatos corretos para cada destino.
          </div>
        )}
        {message && <div className="boost-message success">{message}</div>}
        {error && <div className="boost-message error">{error}</div>}

        <section className="boost-card">
          <h2>1. Escolha a rifa</h2>
          <p>A imagem oficial é preservada dentro da composição. Ela não é esticada nem cortada para preencher outro formato.</p>

          {loading ? (
            <p>Carregando rifas...</p>
          ) : (
            <select value={raffleId} onChange={(event) => setRaffleId(event.target.value)}>
              <option value="">Selecione uma rifa ativa</option>
              {raffles.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.productName} • {money(item.priceInCents)}
                </option>
              ))}
            </select>
          )}

          {!loading && !raffles.length && (
            <div className="boost-warning">Nenhuma rifa ativa encontrada.</div>
          )}

          {sourceImageUrl && (
            <div className="official-creative-source">
              <strong>Imagem oficial da rifa</strong>
              <span>Fonte original — usada sem corte no novo gerador.</span>
              <img src={sourceImageUrl} alt={raffle?.productName || "Imagem oficial"} />
            </div>
          )}
        </section>

        <section className="boost-card">
          <h2>2. Escolha o destino da arte</h2>
          <p>Você não escolhe mais um tamanho inventado pelo sistema. Escolha exatamente onde a arte será usada.</p>

          <div className="format-grid">
            {FORMATS.map((item) => (
              <button
                type="button"
                className={"format-card " + (formatId === item.id ? "selected" : "")}
                key={item.id}
                onClick={() => setFormatId(item.id)}
              >
                <span className="format-ratio">{item.ratio}</span>
                <strong>{item.name}</strong>
                <small>{item.description}</small>
                <b>{item.note}</b>
              </button>
            ))}
          </div>

          <div className="format-active">
            <strong>Formato selecionado: {format.name}</strong>
            <span>{format.width} × {format.height} px • proporção {format.ratio}</span>
          </div>
        </section>

        <section className="boost-card">
          <h2>3. Escolha as cidades</h2>
          <p>{selectedCities.length} cidades selecionadas • 1 arte por cidade no formato escolhido.</p>

          <div className="city-grid">
            {CITIES.map((item) => (
              <label
                className={"city-chip " + (selectedCities.includes(item.city) ? "selected" : "")}
                key={item.city}
              >
                <input
                  type="checkbox"
                  checked={selectedCities.includes(item.city)}
                  onChange={() => toggleCity(item.city)}
                />
                <span>
                  <b>{item.city}</b>
                  <small>{item.distanceKm === 0 ? "base" : item.distanceKm + " km"}</small>
                </span>
              </label>
            ))}
          </div>

          <div className="boost-create-row">
            <span>{totalArts} arquivos • {format.note}</span>
            <button
              className="boost-primary"
              disabled={!raffle || !selectedCities.length || generating}
              onClick={downloadAll}
            >
              {generating ? "Gerando e baixando..." : "⬇️ Gerar e baixar todas"}
            </button>
          </div>
        </section>

        <section className="boost-card">
          <div className="boost-section-head">
            <div>
              <h2>4. Modelo visual</h2>
              <p>O tamanho é definido pelo destino. O modelo visual pode ser escolhido separadamente.</p>
            </div>
          </div>

          <div className="creative-grid">
            {LAYOUTS.map((layout) => (
              <button
                type="button"
                className={"creative-preview-card format-preview-card " + (selectedLayout === layout.id ? "selected" : "")}
                key={layout.id}
                onClick={() => setSelectedLayout(layout.id)}
              >
                <div className={"creative-preview creative-layout-" + layout.id} style={{ aspectRatio: format.width + " / " + format.height }}>
                  {sourceImageUrl && <img src={sourceImageUrl} alt={layout.name} />}
                  <div className="creative-overlay">
                    <b>{layout.name}</b>
                    <span>{format.ratio} • {format.width} × {format.height}</span>
                  </div>
                </div>
                <strong>{layout.name}</strong>
                <small>{layout.description}</small>
              </button>
            ))}
          </div>
        </section>

        {raffle && selectedCities.length > 0 && (
          <section className="boost-card">
            <h2>5. Baixar individualmente</h2>
            <p>Escolha uma cidade e, se quiser, um dos três modelos visuais.</p>

            <div className="campaign-list">
              {selectedCities.map((city) => (
                <article className="campaign-card" key={city}>
                  <div className="campaign-head">
                    <div>
                      <span className="campaign-status">{format.ratio} • {format.width} × {format.height}</span>
                      <h3>{city}</h3>
                      <p>{raffle.productName}</p>
                    </div>
                  </div>

                  <div className="creative-grid">
                    {LAYOUTS.map((layout) => {
                      const key = city + "-" + formatId + "-" + layout.id;
                      return (
                        <div className="creative-preview-card" key={key}>
                          <div className={"creative-preview creative-layout-" + layout.id} style={{ aspectRatio: format.width + " / " + format.height }}>
                            {sourceImageUrl && <img src={sourceImageUrl} alt={city + " - " + layout.name} />}
                            <div className="creative-overlay">
                              <b>{layout.name}</b>
                              <span>{city.toUpperCase()}</span>
                              <small>{format.note}</small>
                            </div>
                          </div>
                          <strong>{layout.name}</strong>
                          <small>{format.name} • PNG</small>
                          <button
                            className="boost-secondary"
                            disabled={downloadingKey === key}
                            onClick={() => downloadOne(city, layout.id)}
                          >
                            {downloadingKey === key ? "Gerando..." : "⬇️ Baixar arte"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="boost-card boost-next">
          <h2>Regra nova do gerador</h2>
          <div className="boost-roadmap">
            <span>3:4 • publicação</span>
            <span>4:5 • Feed / anúncio</span>
            <span>9:16 • Stories / Reels</span>
            <span>1:1 • quadrado / carrossel</span>
          </div>
          <p>
            O RifasTOP continua apenas gerando arquivos. Você baixa a arte e publica manualmente.
            O sistema não escolhe público, cidade, orçamento ou campanha na Meta.
          </p>
        </section>
      </div>
    </main>
  );
}
