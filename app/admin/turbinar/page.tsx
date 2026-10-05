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

const LAYOUTS = [
  { id: 0, name: "Impacto", description: "Foto grande + chamada forte" },
  { id: 1, name: "Dividida", description: "Foto + informação em blocos" },
  { id: 2, name: "Pôster", description: "Composição editorial" }
];

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function slug(value: string) {
  return value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

async function createCreativeBlob(
  raffleId: string,
  productName: string,
  city: string,
  priceInCents: number,
  layoutIndex: number
) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = "/api/admin/marketing/creative-image?raffleId=" + encodeURIComponent(raffleId) + "&v=" + Date.now();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Não foi possível carregar a imagem oficial da rifa."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu preparar a arte.");

  const GOLD = "#D4AF37";
  const WHITE = "#FFFFFF";
  const BLACK = "#080808";

  function cover(x: number, y: number, w: number, h: number) {
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx!.drawImage(image, x + (w - width) / 2, y + (h - height) / 2, width, height);
  }

  function roundedRect(x: number, y: number, w: number, h: number, radius: number) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  }

  function fitText(text: string, max: number) {
    return text.length > max ? text.slice(0, max - 1) + "…" : text;
  }

  const cityName = city.toUpperCase();
  const product = fitText(productName, 38);
  const price = money(priceInCents);

  if (layoutIndex === 0) {
    // 1 — IMPACTO
    cover(0, 0, 1200, 800);

    const gradient = ctx.createLinearGradient(0, 270, 0, 800);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.45, "rgba(0,0,0,0.45)");
    gradient.addColorStop(1, "rgba(0,0,0,0.96)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);

    ctx.fillStyle = GOLD;
    roundedRect(55, 48, 330, 58, 29);
    ctx.fillStyle = BLACK;
    ctx.font = "900 25px Arial";
    ctx.fillText("RIFASTOP • " + cityName, 78, 85);

    ctx.fillStyle = WHITE;
    ctx.font = "900 66px Arial";
    ctx.fillText("VOCÊ É DE", 55, 590);

    ctx.fillStyle = GOLD;
    ctx.fillText(cityName, 55, 660);

    ctx.fillStyle = WHITE;
    ctx.font = "700 30px Arial";
    ctx.fillText(product, 58, 714);

    ctx.font = "900 29px Arial";
    ctx.fillText(price + " por número", 58, 758);

    ctx.textAlign = "right";
    ctx.font = "900 25px Arial";
    ctx.fillText("RifasTOP", 1140, 65);
    ctx.textAlign = "left";
  } else if (layoutIndex === 1) {
    // 2 — DIVIDIDA
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, 1200, 800);
    cover(0, 0, 700, 800);

    ctx.fillStyle = GOLD;
    ctx.fillRect(700, 0, 10, 800);

    ctx.fillStyle = WHITE;
    ctx.font = "900 28px Arial";
    ctx.fillText("RIFASTOP", 755, 82);

    ctx.fillStyle = GOLD;
    ctx.font = "900 67px Arial";
    const lines = cityName.length > 11
      ? [cityName.slice(0, Math.ceil(cityName.length / 2)), cityName.slice(Math.ceil(cityName.length / 2))]
      : [cityName];
    lines.forEach((line, index) => ctx.fillText(line, 755, 190 + index * 76));

    const offset = lines.length * 76;

    ctx.fillStyle = WHITE;
    ctx.font = "700 31px Arial";
    ctx.fillText("CONFIRA ESSA", 755, 245 + offset);

    ctx.font = "900 30px Arial";
    const productLines = product.length > 22 ? [product.slice(0, 22), product.slice(22)] : [product];
    productLines.forEach((line, index) => ctx.fillText(line, 755, 292 + offset + index * 38));

    ctx.fillStyle = GOLD;
    roundedRect(755, 590, 365, 76, 18);
    ctx.fillStyle = BLACK;
    ctx.font = "900 28px Arial";
    ctx.fillText(price + " por número", 785, 637);

    ctx.fillStyle = WHITE;
    ctx.font = "700 22px Arial";
    ctx.fillText("Acesse o RifasTOP", 755, 710);
    ctx.font = "500 19px Arial";
    ctx.fillText("e confira os detalhes", 755, 742);
  } else {
    // 3 — PÔSTER
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, 1200, 800);

    ctx.fillStyle = WHITE;
    ctx.font = "900 29px Arial";
    ctx.fillText("RIFASTOP", 58, 43);

    ctx.textAlign = "right";
    ctx.fillStyle = GOLD;
    ctx.font = "900 25px Arial";
    ctx.fillText("DIVULGAÇÃO • " + cityName, 1142, 43);
    ctx.textAlign = "left";

    cover(50, 70, 1100, 470);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 5;
    ctx.strokeRect(50, 70, 1100, 470);

    ctx.fillStyle = GOLD;
    ctx.font = "900 58px Arial";
    ctx.fillText(cityName, 55, 625);

    ctx.fillStyle = WHITE;
    ctx.font = "700 28px Arial";
    ctx.fillText(product, 58, 674);

    ctx.font = "900 27px Arial";
    ctx.fillText(price + " por número", 58, 725);

    ctx.fillStyle = GOLD;
    ctx.font = "900 23px Arial";
    ctx.fillText("CONFIRA NO RIFASTOP", 58, 765);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Não foi possível gerar a arte.")),
      "image/png",
      0.95
    );
  });
}

async function downloadCreative(
  raffleId: string,
  productName: string,
  city: string,
  priceInCents: number,
  layoutIndex: number
) {
  const blob = await createCreativeBlob(raffleId, productName, city, priceInCents, layoutIndex);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "RifasTOP-" + slug(city) + "-" + slug(LAYOUTS[layoutIndex].name) + ".png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function TurbinarPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [raffleId, setRaffleId] = useState("");
  const [selectedCities, setSelectedCities] = useState<string[]>(CITIES.map((item) => item.city));
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const raffle = raffles.find((item) => item.id === raffleId);
  const sourceImageUrl = raffle?.imageUrls?.[0] || "";

  const totalArts = useMemo(() => selectedCities.length * LAYOUTS.length, [selectedCities.length]);

  async function loadRaffles() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/rifas", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar as rifas.");
      setRaffles((data.raffles || []).filter((item: Raffle) => item.status === "ACTIVE"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar as rifas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRaffles();
  }, []);

  function toggleCity(city: string) {
    setSelectedCities((current) =>
      current.includes(city) ? current.filter((item) => item !== city) : [...current, city]
    );
  }

  async function downloadOne(city: string, layoutId: number) {
    if (!raffle) return;
    const key = city + "-" + layoutId;
    setDownloadingKey(key);
    setError("");
    try {
      await downloadCreative(raffle.id, raffle.productName, city, raffle.priceInCents, layoutId);
      setMessage("Arte " + LAYOUTS[layoutId].name + " de " + city + " baixada.");
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
        for (const layout of LAYOUTS) {
          await downloadCreative(raffle.id, raffle.productName, city, raffle.priceInCents, layout.id);
          count += 1;
          await new Promise((resolve) => window.setTimeout(resolve, 350));
        }
      }
      setMessage(count + " artes prontas foram baixadas: 3 modelos diferentes para cada cidade selecionada.");
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
            <h1>🎨 Gerar artes para divulgação</h1>
            <p>
              Aqui o sistema só cria e baixa as imagens. Não existe publicação automática,
              conexão com a Meta, segmentação de público ou orçamento.
            </p>
          </div>
          <div className="boost-badge">CRIAR → BAIXAR → META</div>
        </header>

        {message && <div className="boost-message success">{message}</div>}
        {error && <div className="boost-message error">{error}</div>}

        <section className="boost-card">
          <h2>1. Escolha a rifa</h2>
          <p>A imagem oficial da rifa é usada como matéria-prima. As três artes finais têm composições diferentes.</p>

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
              <span>Esta imagem é a fonte. Ela não é simplesmente republicada com uma faixa de texto.</span>
              <img src={sourceImageUrl} alt={raffle?.productName || "Imagem oficial"} />
            </div>
          )}
        </section>

        <section className="boost-card">
          <div className="boost-section-head">
            <div>
              <h2>2. Escolha as cidades</h2>
              <p>{selectedCities.length} cidades selecionadas • {totalArts} artes serão geradas</p>
            </div>
            <button
              className="boost-link"
              onClick={() => setSelectedCities(
                selectedCities.length === CITIES.length ? [] : CITIES.map((item) => item.city)
              )}
            >
              {selectedCities.length === CITIES.length ? "Limpar todas" : "Selecionar todas"}
            </button>
          </div>

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
            <span>{totalArts} arquivos PNG em 1200 × 800 px.</span>
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
          <h2>3. Três modelos para cada cidade</h2>
          <p>
            O mesmo produto ganha três composições visuais diferentes. Assim você pode testar
            criativos diferentes na Meta sem precisar editar cada imagem manualmente.
          </p>

          <div className="creative-lab">
            <div className="creative-lab-head">
              <div>
                <strong>Modelos automáticos</strong>
                <span>Todos em 1200 × 800 • somente arquivos de imagem</span>
              </div>
            </div>

            <div className="creative-grid">
              {LAYOUTS.map((layout) => (
                <div className="creative-preview-card" key={layout.id}>
                  <div className={"creative-preview creative-layout-" + layout.id} style={{ aspectRatio: "3 / 2" }}>
                    {sourceImageUrl && <img src={sourceImageUrl} alt={layout.name} />}
                    <div className="creative-overlay">
                      <b>{layout.name}</b>
                      <span>{layout.description}</span>
                    </div>
                  </div>
                  <strong>{layout.name}</strong>
                  <small>{layout.description}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        {raffle && selectedCities.length > 0 && (
          <section className="boost-card">
            <h2>4. Baixar individualmente</h2>
            <p>Se quiser escolher exatamente quais peças baixar, use os botões abaixo.</p>

            <div className="campaign-list">
              {selectedCities.map((city) => (
                <article className="campaign-card" key={city}>
                  <div className="campaign-head">
                    <div>
                      <span className="campaign-status">CIDADE</span>
                      <h3>{city}</h3>
                      <p>{raffle.productName} • 3 artes</p>
                    </div>
                  </div>

                  <div className="creative-grid">
                    {LAYOUTS.map((layout) => {
                      const key = city + "-" + layout.id;
                      return (
                        <div className="creative-preview-card" key={key}>
                          <div className={"creative-preview creative-layout-" + layout.id} style={{ aspectRatio: "3 / 2" }}>
                            {sourceImageUrl && <img src={sourceImageUrl} alt={city + " - " + layout.name} />}
                            <div className="creative-overlay">
                              <b>{layout.name}</b>
                              <span>{city.toUpperCase()}</span>
                              <small>{raffle.productName}</small>
                            </div>
                          </div>
                          <strong>{layout.name}</strong>
                          <small>1200 × 800 • PNG</small>
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
          <h2>Como fica o fluxo</h2>
          <div className="boost-roadmap">
            <span>01 • Escolher a rifa</span>
            <span>02 • Escolher cidades</span>
            <span>03 • Gerar artes</span>
            <span>04 • Baixar PNG</span>
            <span>05 • Publicar manualmente na Meta</span>
          </div>
          <p>
            O RifasTOP não envia nada para a Meta. Você continua escolhendo manualmente
            a cidade, público, posicionamento, orçamento e campanha dentro da plataforma de anúncios.
          </p>
        </section>
      </div>
    </main>
  );
}
