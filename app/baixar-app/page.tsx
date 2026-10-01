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
          <p>Quando o APK estiver disponível, você poderá baixá-lo aqui e instalar o aplicativo no seu aparelho.</p>
          <a className="download-button download-button-disabled" href="#" aria-disabled="true" onClick={(event) => event.preventDefault()}>
            APK em breve
          </a>
          <small>O arquivo do aplicativo será disponibilizado nesta página após a compilação.</small>
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

        <section className="download-card">
          <h2>Aplicativo em breve</h2>
          <p>Estamos preparando a versão do aplicativo do Rifas.TOP. Assim que o APK estiver compilado, o botão de download desta página será atualizado.</p>
        </section>
      </div>
    </main>
  );
}
