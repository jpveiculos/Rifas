import Link from "next/link";
import SiteHeader from "@/app/SiteHeader";

export const metadata = {
  title: "Termos de Uso | Rifas.TOP",
  description: "Termos de Uso da plataforma Rifas.TOP."
};

export default function TermosDeUsoPage() {
  return (
    <>
      <SiteHeader />
      <main className="terms-page">
      <div className="container terms-container">
        <Link className="back-link" href="/">← Voltar</Link>

        <article className="terms-card">
          <h1>Termos de Uso</h1>
          <p className="terms-updated">Última atualização: 01 de outubro de 2026</p>

          <p>Bem-vindo ao <strong>Rifas.TOP</strong>. Este Termo de Uso estabelece as regras para utilização da plataforma, incluindo cadastro de usuários, participação em rifas, aquisição de números, criação e divulgação de rifas, pagamentos, sorteios, cancelamentos e demais funcionalidades disponibilizadas pelo site.</p>
          <p>Ao criar uma conta, participar de uma rifa ou utilizar qualquer funcionalidade do Rifas.TOP, o usuário declara que leu e concorda com estes Termos de Uso.</p>

          <h2>1. Sobre o Rifas.TOP</h2>
          <p>O Rifas.TOP é uma plataforma tecnológica destinada à disponibilização, divulgação e gerenciamento de rifas e respectivas participações.</p>
          <p>A plataforma permite que usuários consultem rifas disponíveis, escolham números, realizem pagamentos quando aplicável e acompanhem suas participações por meio da área <strong>Minha Conta</strong>.</p>

          <h2>2. Cadastro do usuário</h2>
          <p>Para utilizar determinadas funcionalidades do Rifas.TOP, o usuário deverá realizar cadastro fornecendo informações verdadeiras, completas e atualizadas.</p>
          <p>O usuário é responsável pela veracidade das informações fornecidas e pela segurança de seus dados de acesso.</p>
          <ul><li>Não é permitido criar contas utilizando informações falsas.</li><li>Não é permitido utilizar dados de terceiros sem autorização.</li><li>Não é permitido criar contas com finalidade fraudulenta.</li><li>Não é permitido utilizar a plataforma para tentar obter vantagem indevida.</li></ul>

          <h2>3. Participação em rifas</h2>
          <p>Cada rifa poderá possuir produto ou prêmio anunciado, quantidade determinada de números, valor por número, data e horário previstos para encerramento ou sorteio e regras específicas de participação.</p>
          <p>O usuário deverá consultar as informações da rifa antes de realizar qualquer participação. A aquisição de um número somente será considerada efetivada após a confirmação do pagamento, quando aplicável.</p>

          <h2>4. Números e disponibilidade</h2>
          <p>Os números disponibilizados em cada rifa são limitados à quantidade definida pelo responsável pela respectiva rifa. A disponibilidade apresentada no site poderá ser alterada conforme novas reservas, pagamentos confirmados, cancelamentos ou outras operações relacionadas à rifa.</p>

          <h2>5. Pagamentos</h2>
          <p>Os pagamentos realizados para participação em uma rifa deverão seguir as instruções apresentadas na plataforma. A confirmação da participação dependerá da confirmação do pagamento correspondente.</p>
          <p>Em caso de pagamento realizado e não identificado, o usuário poderá entrar em contato pelos canais disponibilizados pelo Rifas.TOP, apresentando as informações necessárias para localização da transação.</p>

          <h2>6. Cancelamento de rifas</h2>
          <p>Uma rifa poderá ser cancelada, suspensa, pausada ou removida quando necessário, inclusive por decisão do responsável pela rifa, por questões operacionais, técnicas, legais ou de segurança.</p>
          <p>Quando uma rifa for cancelada após a realização de pagamentos, o tratamento dos valores pagos e eventual restituição deverá observar as condições informadas para aquela rifa e a legislação aplicável.</p>

          <h2>7. Sorteios e resultados</h2>
          <p>Os sorteios serão realizados conforme as regras apresentadas na respectiva rifa. Quando houver sorteio previsto, somente participarão dele os números que estiverem aptos conforme as regras da rifa e com o pagamento devidamente confirmado, quando aplicável.</p>
          <p>O resultado será disponibilizado no Rifas.TOP após a realização e publicação do sorteio.</p>

          <h2>8. Entrega do prêmio</h2>
          <p>A entrega do prêmio será realizada conforme as condições estabelecidas na respectiva rifa. O ganhador poderá ser solicitado a fornecer informações necessárias para confirmação de sua identidade e para realização da entrega.</p>

          <h2>9. Responsabilidade de quem cria uma rifa</h2>
          <p>O responsável pela criação de uma rifa declara que possui legitimidade para anunciar o produto ou prêmio informado e assume responsabilidade pelas informações fornecidas.</p>
          <ul><li>Fornecer informações verdadeiras sobre o produto ou prêmio.</li><li>Possuir autorização ou direito para oferecer o produto anunciado.</li><li>Cumprir as obrigações legais aplicáveis à realização da rifa.</li><li>Realizar a entrega do prêmio conforme as condições anunciadas.</li></ul>
          <p>O cadastramento de uma rifa na plataforma não significa, por si só, que o Rifas.TOP tenha validado a propriedade, procedência ou regularidade jurídica do produto anunciado.</p>

          <h2>10. Responsabilidade do Rifas.TOP</h2>
          <p>O Rifas.TOP disponibiliza a infraestrutura tecnológica da plataforma, mas não assume automaticamente a condição de proprietário dos produtos anunciados pelos usuários nem substitui as obrigações do responsável por cada rifa.</p>
          <p>A plataforma poderá suspender temporariamente determinadas funcionalidades quando necessário para manutenção, atualização, segurança ou correção de problemas técnicos.</p>

          <h2>11. Condutas proibidas</h2>
          <p>É proibido utilizar o Rifas.TOP para praticar fraude ou tentativa de fraude, utilizar informações falsas, manipular resultados ou sistemas, explorar falhas técnicas, tentar acessar contas de terceiros, realizar atividades ilícitas, anunciar produtos cuja comercialização ou divulgação seja proibida ou praticar qualquer conduta que viole a legislação brasileira.</p>

          <h2>12. Privacidade e proteção de dados</h2>
          <p>O Rifas.TOP poderá coletar e utilizar dados pessoais necessários para criação e manutenção da conta, autenticação, participação em rifas, processamento de pagamentos, comunicação com o usuário, prevenção de fraudes, segurança da plataforma e cumprimento de obrigações legais.</p>
          <p>O tratamento de dados pessoais deverá observar a <strong>Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)</strong> e demais normas aplicáveis.</p>

          <h2>13. Comunicações</h2>
          <p>O usuário poderá receber comunicações relacionadas à sua conta, às suas participações, aos pagamentos, às rifas das quais participa e a informações importantes sobre o funcionamento da plataforma.</p>

          <h2>14. Propriedade intelectual</h2>
          <p>O conteúdo, identidade visual, marca, logotipo, layout, textos, códigos, elementos gráficos e demais componentes próprios do Rifas.TOP são protegidos pela legislação aplicável. É proibida a reprodução, cópia, modificação, distribuição ou utilização comercial não autorizada desses elementos.</p>

          <h2>15. Disponibilidade da plataforma</h2>
          <p>O Rifas.TOP busca manter a plataforma disponível e funcionando adequadamente, mas não garante funcionamento ininterrupto. Podem ocorrer indisponibilidades decorrentes de manutenção, falhas de servidores, serviços de terceiros, problemas de conexão, ataques cibernéticos ou outros acontecimentos fora do controle razoável da plataforma.</p>

          <h2>16. Alterações destes Termos</h2>
          <p>O Rifas.TOP poderá atualizar estes Termos de Uso sempre que necessário para adequação da plataforma, alterações de funcionalidades ou atendimento à legislação aplicável. A versão atualizada ficará disponível no site.</p>

          <h2>17. Legislação aplicável</h2>
          <p>Este Termo de Uso será interpretado de acordo com as leis da República Federativa do Brasil. As atividades de sorteio, promoção comercial ou outras modalidades reguladas pela legislação brasileira deverão observar as normas e autorizações aplicáveis a cada caso.</p>

          <h2>18. Contato</h2>
          <p>Para dúvidas, solicitações ou informações relacionadas ao uso do Rifas.TOP, o usuário poderá utilizar os canais de contato disponibilizados na plataforma.</p>

          <div className="terms-footer-brand"><strong>Rifas.TOP</strong><span>Plataforma de Rifas</span></div>
        </article>
      </div>
      </main>
    </>
  );
}
