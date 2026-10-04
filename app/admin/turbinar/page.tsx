"use client";

import { useEffect, useMemo, useState } from "react";
import "./turbinar.css";

type Raffle = { id:string; productName:string; name:string; city:string; priceInCents:number; status:string; imageUrls?:string[] };

const CITIES = [
  ["Érico Cardoso",18],["Caturama",35],["Botuporã",42],["Boquira",45],["Ibipitanga",55],
  ["Rio do Pires",60],["Macaúbas",65],["Tanque Novo",75],["Livramento de Nossa Senhora",76],
  ["Igaporã",80],["Rio de Contas",81],["Lagoa Real",88],["Novo Horizonte",93],["Caetité",95],["Dom Basílio",97]
] as const;

const hooks = ["VOCÊ É DE {CITY}? 👀","ALÔ, {CITY}! OLHA ESSA! 🔥","{CITY}, JÁ VIU ESSA NOVIDADE?","EI, {CITY}! ISSO É AÍ PERTINHO DE VOCÊ.","QUEM É DE {CITY} PRECISA VER ISSO."];
const bodies = ["Tem uma campanha do RifasTOP movimentando a nossa região.","O prêmio já está chamando atenção por aqui — confira a campanha.","Uma oportunidade regional para quem gosta de participar e concorrer a prêmios.","A campanha está disponível no RifasTOP. Veja todos os detalhes no site."];

function money(cents:number){return (cents/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function buildCaption(raffle:Raffle,city:string,variant:number){
  const hook=hooks[variant%hooks.length].replace("{CITY}",city.toUpperCase());
  const body=bodies[variant%bodies.length];
  return hook+"\n\n"+body+"\n\n🏆 "+raffle.productName+"\n💰 "+money(raffle.priceInCents)+" por número\n\n👉 Acesse o RifasTOP e confira a campanha.\n📍 "+city+" e região\n\n#RifasTOP #"+city.replace(/\s+/g,"")+" #Bahia #"+raffle.productName.replace(/[^a-zA-ZÀ-ÿ0-9]/g,"");
}

export default function TurbinarPage(){
 const [raffles,setRaffles]=useState<Raffle[]>([]); const [raffleId,setRaffleId]=useState(""); const [selectedCities,setSelectedCities]=useState<string[]>(CITIES.map(([city])=>city)); const [loading,setLoading]=useState(true); const [copied,setCopied]=useState(""); const objective="Alcançar pessoas que ainda não seguem o Instagram";
 useEffect(()=>{fetch("/api/rifas",{cache:"no-store"}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||"Não foi possível carregar as rifas.");setRaffles((data.raffles||[]).filter((x:Raffle)=>x.status==="ACTIVE"));}).catch(()=>setRaffles([])).finally(()=>setLoading(false));},[]);
 const raffle=raffles.find(x=>x.id===raffleId);
 const variants=useMemo(()=>raffle?selectedCities.map((city,index)=>({city,distance:CITIES.find(([name])=>name===city)?.[1]??0,caption:buildCaption(raffle,city,index)})):[],[raffle,selectedCities]);
 function toggleCity(city:string){setSelectedCities(c=>c.includes(city)?c.filter(x=>x!==city):[...c,city]);}
 async function copy(text:string,key:string){await navigator.clipboard.writeText(text);setCopied(key);setTimeout(()=>setCopied(""),1400);}
 async function copyAll(){await copy(variants.map(v=>"=== "+v.city+" ("+v.distance+" km) ===\n"+v.caption).join("\n\n"),"all");}
 return <main className="boost-page"><div className="boost-container">
  <header className="boost-header"><div><a href="/admin" className="boost-back">← Voltar para administração</a><span className="boost-kicker">RIFASTOP • MOTOR DE DIVULGAÇÃO</span><h1>🚀 Turbinar no Instagram</h1><p>Crie uma campanha regional original, preparada para buscar pessoas que ainda não seguem a página.</p></div><div className="boost-badge">ORGÂNICO • PESSOAS REAIS</div></header>
  <section className="boost-card"><h2>1. Escolha a rifa</h2>{loading?<p>Carregando campanhas...</p>:<select value={raffleId} onChange={e=>setRaffleId(e.target.value)}><option value="">Selecione uma rifa ativa</option>{raffles.map(r=><option key={r.id} value={r.id}>{r.productName} • {money(r.priceInCents)}</option>)}</select>}{!loading&&raffles.length===0&&<div className="boost-warning">Nenhuma rifa ativa encontrada. Publique/ative uma rifa antes de gerar a campanha.</div>}</section>
  <section className="boost-card"><h2>2. Objetivo</h2><div className="boost-objective"><strong>🎯 {objective}</strong><span>O motor não compra seguidores, não cria contas falsas e não gera interações artificiais.</span></div></section>
  <section className="boost-card"><div className="boost-section-head"><div><h2>3. Região de alcance</h2><p>As cidades entram no conteúdo para aumentar a relevância regional.</p></div><button className="boost-link" onClick={()=>setSelectedCities(selectedCities.length===CITIES.length?[]:CITIES.map(([city])=>city))}>{selectedCities.length===CITIES.length?"Limpar todas":"Selecionar todas"}</button></div><div className="city-grid">{CITIES.map(([city,distance])=><label className={"city-chip "+(selectedCities.includes(city)?"selected":"")} key={city}><input type="checkbox" checked={selectedCities.includes(city)} onChange={()=>toggleCity(city)}/><span><b>{city}</b><small>{distance} km</small></span></label>)}</div></section>
  <section className="boost-card"><div className="boost-section-head"><div><h2>4. Campanha gerada</h2><p>{variants.length} variações regionais serão criadas para esta rifa.</p></div><button className="boost-primary" disabled={!raffle||variants.length===0} onClick={copyAll}>{copied==="all"?"✓ Copiado":"📋 Copiar campanha"}</button></div>{!raffle?<div className="boost-empty">Selecione uma rifa para gerar o conteúdo.</div>:<div className="variant-list">{variants.map(v=><article className="variant-card" key={v.city}><div className="variant-top"><div><span className="variant-city">📍 {v.city}</span><small>{v.distance} km • público regional</small></div><button className="boost-secondary" onClick={()=>copy(v.caption,v.city)}>{copied===v.city?"✓ Copiado":"Copiar"}</button></div><pre>{v.caption}</pre><div className="variant-actions"><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Abrir Instagram</a><button onClick={()=>copy(v.caption,v.city)}>Copiar legenda</button></div></article>)}</div>}</section>
  <section className="boost-card boost-next"><h2>🧠 Próxima etapa do motor</h2><div className="boost-roadmap"><span>01 • Conteúdo</span><span>02 • Publicação</span><span>03 • Alcance</span><span>04 • Métricas</span><span>05 • Aprendizado</span></div><p>Esta primeira versão cria a distribuição regional por cidade. A próxima camada pode conectar métricas do Instagram para comparar não seguidores, retenção, compartilhamentos, visitas ao perfil e cliques no site — sempre pelas integrações permitidas pela Meta.</p></section>
 </div></main>;
}
