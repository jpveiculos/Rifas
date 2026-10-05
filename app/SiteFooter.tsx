export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-copy">
          © {new Date().getFullYear()} RifasTOP. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
