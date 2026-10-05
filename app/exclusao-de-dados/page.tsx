import Link from "next/link";

export default function DataDeletionPage() {
  const whatsapp = "5577998315360";
  return (
    <main style={{minHeight:"100vh",padding:"40px 18px",background:"#071b3d",color:"#fff",fontFamily:"Arial, Helvetica, sans-serif"}}>
      <div style={{maxWidth:760,margin:"0 auto",background:"#fff",color:"#111",borderRadius:18,padding:28}}>
        <h1>Exclusão de dados — RifasTOP</h1>
        <p>Você pode solicitar a exclusão do seu cadastro e dos dados pessoais associados à sua conta.</p>
        <h2>Como solicitar</h2>
        <ol>
          <li>Entre em contato com o RifasTOP pelo WhatsApp de atendimento.</li>
          <li>Informe seu nome, usuário cadastrado e o WhatsApp usado na conta.</li>
          <li>Após confirmar a titularidade, faremos a exclusão dos dados que puderem ser removidos.</li>
        </ol>
        <p><strong>Importante:</strong> dados que precisem ser mantidos para comprovar pagamentos, participações, sorteios ou cumprir obrigações legais poderão ser preservados pelo período necessário, conforme a legislação aplicável.</p>
        <a href={"https://wa.me/"+whatsapp+"?text="+encodeURIComponent("Olá, quero solicitar a exclusão dos meus dados do RifasTOP.")} target="_blank" rel="noreferrer" style={{display:"inline-block",padding:"12px 18px",background:"#159447",color:"#fff",borderRadius:10,textDecoration:"none"}}>Solicitar pelo WhatsApp</a>
        <p style={{marginTop:24}}><Link href="/">Voltar ao RifasTOP</Link></p>
      </div>
    </main>
  );
}
