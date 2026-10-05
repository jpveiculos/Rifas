"use client";

import { useEffect, useState } from "react";

type User = {
  id: string; name: string; city: string; username: string; whatsapp: string;
  createdAt: string; _count: { participations: number; numbers: number };
};

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [form, setForm] = useState({ name:"", city:"", username:"", whatsapp:"", password:"" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/usuarios?q=" + encodeURIComponent(q), { cache:"no-store" });
    const data = await r.json();
    if (!r.ok) { setError(data.error || "Não foi possível carregar os participantes."); return; }
    setUsers(data.users || []);
  }

  useEffect(() => { load(); }, []);

  function selectUser(user: User) {
    setSelected(user);
    setForm({ name:user.name, city:user.city, username:user.username, whatsapp:user.whatsapp, password:"" });
    setMessage(""); setError("");
  }

  async function save() {
    if (!selected) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const r = await fetch("/api/admin/usuarios", {
        method:"PATCH", headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ id:selected.id, ...form })
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Não foi possível salvar."); return; }
      setMessage("Dados do participante atualizados.");
      await load();
      const updated = { ...selected, ...data.user, _count:selected._count };
      setSelected(updated);
      setForm(v => ({ ...v, password:"" }));
    } catch { setError("Não foi possível conectar ao servidor."); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!selected) return;
    if (!window.confirm("Excluir definitivamente o cadastro deste participante?")) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const r = await fetch("/api/admin/usuarios", {
        method:"DELETE", headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ id:selected.id })
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Não foi possível excluir."); return; }
      setMessage("Cadastro excluído.");
      setSelected(null);
      await load();
    } catch { setError("Não foi possível conectar ao servidor."); }
    finally { setSaving(false); }
  }

  return (
    <main style={{minHeight:"100vh",padding:"32px 16px",background:"#f5f5f5",fontFamily:"Arial, Helvetica, sans-serif"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <div>
            <a href="/admin">← Voltar para administração</a>
            <h1 style={{margin:"10px 0 4px"}}>Gerenciar participantes</h1>
            <p>Editar dados, trocar senha e excluir cadastros sem histórico.</p>
          </div>
          <button onClick={load} style={{padding:"10px 16px"}}>Atualizar</button>
        </div>

        <div style={{display:"flex",gap:8,margin:"20px 0"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")load();}} placeholder="Nome, usuário ou WhatsApp" style={{flex:1,padding:12}} />
          <button onClick={load} style={{padding:"10px 18px"}}>Buscar</button>
        </div>

        {message && <div style={{padding:12,background:"#e7f7e7",marginBottom:12}}>{message}</div>}
        {error && <div style={{padding:12,background:"#fde8e8",marginBottom:12}}>{error}</div>}

        <div style={{display:"grid",gridTemplateColumns:"minmax(280px,1fr) minmax(320px,1.2fr)",gap:18}}>
          <section style={{background:"#fff",padding:16,borderRadius:12}}>
            <h2>Participantes</h2>
            {users.map(user=>(
              <button key={user.id} onClick={()=>selectUser(user)} style={{display:"block",width:"100%",textAlign:"left",padding:12,marginBottom:8,border:"1px solid #ddd",background:selected?.id===user.id?"#eef5ff":"#fff",borderRadius:8}}>
                <strong>{user.name}</strong><br />
                <span>@{user.username} · {user.whatsapp}</span><br />
                <small>{user.city} · {user._count.participations} participação(ões)</small>
              </button>
            ))}
            {users.length===0 && <p>Nenhum participante encontrado.</p>}
          </section>

          <section style={{background:"#fff",padding:16,borderRadius:12}}>
            <h2>Dados do participante</h2>
            {!selected ? <p>Selecione um participante para editar.</p> : <>
              {(["name","city","username","whatsapp"] as const).map(field=>(
                <label key={field} style={{display:"block",marginBottom:12}}>
                  {field==="name"?"Nome completo":field==="city"?"Cidade":field==="username"?"Usuário":"WhatsApp"}
                  <input value={form[field]} onChange={e=>setForm(v=>({...v,[field]:e.target.value}))} style={{display:"block",width:"100%",padding:10,marginTop:4}} />
                </label>
              ))}
              <label style={{display:"block",marginBottom:12}}>
                Nova senha (deixe em branco para manter)
                <input type="password" value={form.password} onChange={e=>setForm(v=>({...v,password:e.target.value}))} style={{display:"block",width:"100%",padding:10,marginTop:4}} />
              </label>
              <p><strong>Histórico:</strong> {selected._count.participations} participação(ões) · {selected._count.numbers} número(s) vinculado(s).</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={save} disabled={saving} style={{padding:"11px 18px"}}>{saving?"Salvando...":"Salvar alterações"}</button>
                <button onClick={remove} disabled={saving || selected._count.participations>0 || selected._count.numbers>0} style={{padding:"11px 18px",background:"#b00020",color:"#fff"}}>Excluir cadastro</button>
              </div>
            </>}
          </section>
        </div>
      </div>
    </main>
  );
}
