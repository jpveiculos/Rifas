import Link from "next/link";

export const metadata = {
  title: "Baixar App | Rifas.TOP",
  description: "Baixe o aplicativo do Rifas.TOP e veja como adicionar o site à tela inicial do iPhone."
};

export default function BaixarAppPage() {
  return (
    <main className="download-page">
      <div className="container download-container">
        <Link className="back-link" href="/">← Voltar</Link>

        <section className="download-hero">
          <div className="download-icon">📱</div>
          <h1>Baixe o App Rifas.TOP</h1>
          <p>Tenha acesso rápido ao Rifas.TOP pelo celular.</p>
        </section>

        <section className="download-card">
          <h2>Android</h2>
          <p>Baixe o aplicativo Rifas.TOP para Android diretamente por aqui.</p>
          <a className="download-button" href="/app/RifasTOP.apk" download>Baixar APK</a>
          <small>Após o download, abra o arquivo no Android para iniciar a instalação.</small>
        </section>

        <section className="download-card">
          <h2>iPhone (iOS)</h2>
          <p>No iPhone, você pode instalar o Rifas.TOP diretamente pela página do site, adicionando-o à Tela de Início.</p>

          <ol className="download-steps">
            <li><strong>Abra o Rifas.TOP no Safari.</strong></li>
            <li>Toque no botão <strong>Compartilhar</strong> do Safari.</li>
            <li>Role o menu e toque em <strong>Adicionar à Tela de Início</strong>.</li>
            <li>Confirme tocando em <strong>Adicionar</strong>.</li>
            <li>O ícone do Rifas.TOP aparecerá na tela inicial do seu iPhone.</li>
          </ol>

          <div className="download-tip">
            <strong>Importante:</strong>
            <span>Para a opção “Adicionar à Tela de Início” aparecer corretamente, abra o site pelo navegador Safari.</span>
          </div>
        </section>

              </div>
    </main>
  );
}
