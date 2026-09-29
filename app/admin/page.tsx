import Link from "next/link";

export default function AdminPage() {
  return (
    <>
      <header className="site-header"><div className="container site-header-inner">
        <Link className="brand" href="/">Rifas</Link><span className="header-link">Administração</span>
      </div></header>
      <main className="section"><div className="container">
        <h1 className="section-title">Área administrativa</h1>
        <div className="empty-state">
          <h3>Painel inicial</h3>
          <p>Aqui ficará o cadastro e gerenciamento das suas rifas, produtos, fotos, números, participações e pagamentos.</p>
        </div>
      </div></main>
    </>
  );
}