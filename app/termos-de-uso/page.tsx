import Link from "next/link";
import SiteHeader from "@/app/SiteHeader";

export const metadata = {
  title: "Termos de Uso | RifasTOP",
  description: "Termos de Uso da plataforma RifasTOP."
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
          <p className="terms-updated">Última atualização: 08 de outubro de 2026</p>

          <p>Bem-vindo ao <strong>RifasTOP</strong>. Este Termo de Uso estabelece as regras para utilização da plataforma, incluindo cadastro de usuários, participação em rifas, aquisição de números, criação e divulgação de rifas, pagamentos, sorteios, cancelamentos e demais funcionalidades disponibilizadas pelo site.</p>
          <p>Ao criar uma conta, participar de uma rifa ou utilizar qualquer funcionalidade do RifasTOP, o usuário declara que leu e concorda com estes Termos de Uso.</p>

          <h2>1. Sobre o RifasTOP</h2>
          <p>O RifasTOP é uma plataforma tecnológica destinada à disponibilização, divulgação e gerenciamento de rifas e respectivas participações.</p>
          <p>A plataforma permite que usuários consultem rifas disponíveis, escolham números, realizem pagamentos quando aplicável e acompanhem suas participações por meio da área <strong>Minha Conta</strong>.</p>

          <h2>2. Cadastro do usuário</h2>
          <p>Para utilizar determinadas funcionalidades do RifasTOP, o usuário deverá realizar cadastro fornecendo informações verdadeiras, completas e atualizadas.</p>
          <p>O usuário é responsável pela veracidade das informações fornecidas e pela segurança de seus dados de acesso.</p>
          <ul><li>Não é permitido criar contas utilizando informações falsas.</li><li>Não é permitido utilizar dados de terceiros sem autorização.</li><li>Não é permitido criar contas com finalidade fraudulenta.</li><li>Não é permitido utilizar a plataforma para tentar obter vantagem indevida.</li></ul>

          <h2>3. Participação em rifas</h2>
          <p>Cada rifa poderá possuir produto ou prêmio anunciado, quantidade determinada de números, valor por número, data e horário previstos para encerramento ou sorteio e regras específicas de participação.</p>
          <p>O usuário deverá consultar as informações da rifa antes de realizar qualquer participação. A aquisição de um número somente será considerada efetivada após a confirmação do pagamento, quando aplicável.</p>

          <h2>4. Números e disponibilidade</h2>
          <p>Os números disponibilizados em cada rifa são limitados à quantidade definida pelo responsável pela respectiva rifa. A disponibilidade apresentada no site poderá ser alterada conforme novas reservas, pagamentos confirmados, cancelamentos ou outras operações relacionadas à rifa.</p>

          <h2>5. Pagamentos</h2>
          <p>Os pagamentos realizados para participação em uma rifa deverão seguir as instruções apresentadas na plataforma. A confirmação da participação dependerá da confirmação do pagamento correspondente.</p>
          <p>Em caso de pagamento realizado e não identificado, o usuário poderá entrar em contato pelos canais disponibilizados pelo RifasTOP, apresentando as informações necessárias para localização da transação.</p>

          <h2>6. Prorrogação, cancelamento e reembolso</h2>
          <p>Cada rifa possui prazo, quantidade de números e condições específicas informadas em sua respectiva página. Caso, ao final do prazo inicialmente previsto, a quantidade de números vendidos não seja suficiente para a realização da rifa conforme as condições divulgadas, o prazo poderá ser prorrogado pelo período necessário para buscar a conclusão da venda dos números disponíveis, sempre respeitando a legislação e as condições aplicáveis à respectiva rifa.</p>
          <p>Durante eventual período de prorrogação, a rifa permanecerá disponível para participação e os números ainda disponíveis poderão continuar sendo adquiridos. A existência de uma prorrogação não altera os números já confirmados nem prejudica os direitos dos participantes.</p>
          <p>Se, após as prorrogações permitidas e dentro do período máximo definido para a respectiva rifa, a quantidade necessária de números não for alcançada, a rifa poderá ser cancelada.</p>
          <p>Em caso de cancelamento da rifa após a realização de pagamentos, os valores efetivamente pagos pelos participantes afetados serão <strong>integralmente reembolsados</strong>, observadas as condições da respectiva rifa e a legislação aplicável. Sempre que tecnicamente possível, o reembolso será realizado pelo mesmo meio de pagamento utilizado na participação ou por outro meio seguro indicado para a restituição.</p>
          <p>O reembolso será referente aos valores efetivamente pagos e identificados como participação na rifa cancelada. Reservas não pagas ou pagamentos que não tenham sido efetivamente identificados não geram, por si só, direito a reembolso.</p>
          <p>Após o cancelamento e o respectivo reembolso, os números vinculados à participação cancelada deixarão de produzir qualquer efeito para fins de apuração de ganhador.</p>
          <p>Os prazos de prorrogação, eventual limite máximo para continuidade da rifa e demais condições específicas poderão ser informados na própria página da rifa e deverão ser observados pelos participantes.</p>

                    <h2>7. Sorteio pela Loteria Federal e apuração do ganhador</h2>
          <p>Quando a respectiva rifa utilizar a Loteria Federal como referência para o sorteio, a apuração será realizada com base no resultado oficial do concurso, observando obrigatoriamente a seguinte ordem de prioridade: <strong>1º prêmio → 2º prêmio → 3º prêmio → 4º prêmio → 5º prêmio</strong>.</p>
          <p>Para cada um dos cinco prêmios principais, serão considerados os <strong>quatro últimos algarismos</strong> do número sorteado, formando o número correspondente da rifa.</p>
          <p>A apuração começará sempre pelo <strong>1º prêmio</strong>. Caso o número correspondente esteja vendido e válido, esse participante será declarado ganhador e a apuração será <strong>encerrada imediatamente</strong>. Os prêmios seguintes não serão considerados para definir outro ganhador.</p>
          <p>Se o número correspondente ao 1º prêmio não estiver vendido e válido, a apuração passará ao <strong>2º prêmio</strong> e, se necessário, sucessivamente ao 3º, 4º e 5º prêmio, sempre respeitando essa ordem de prioridade.</p>
          <p><strong>Exemplo:</strong> se o 1º prêmio resultar em 5827 e esse número não estiver vendido, a apuração seguirá para o 2º prêmio. Se o 2º também não estiver vendido e o 3º resultar em 7654, sendo 7654 um número vendido e válido, o participante desse número será o único ganhador e a apuração será encerrada nesse momento.</p>
          <p>Caso dois ou mais prêmios resultem no mesmo número de quatro algarismos, prevalecerá o prêmio que estiver <strong>mais acima na ordem de prioridade</strong>. Assim, se o 3º e o 4º prêmio resultarem no número 1234, prevalecerá o 3º prêmio.</p>
          <p>Caso nenhum dos cinco prêmios principais resulte em um número vendido e válido, <strong>não haverá ganhador naquele concurso</strong>. O prêmio permanecerá em aberto e a apuração passará automaticamente para o <strong>próximo concurso da Loteria Federal</strong>, aplicando-se novamente a mesma ordem de prioridade, sucessivamente, até que seja identificado um número vendido e válido.</p>
          <p>Enquanto não houver ganhador e a rifa permanecer aberta, <strong>a rifa continuará disponível para venda dos números ainda disponíveis</strong>. A existência de um concurso sem ganhador não encerra nem cancela automaticamente a rifa.</p>
          <p>Uma vez identificado o primeiro número vendido e válido na ordem de apuração, haverá <strong>um único ganhador</strong> e a apuração será encerrada.</p>

          <h2>8. Prêmio: escolha entre o bem anunciado ou valor correspondente via Pix</h2>
          <p>Após a apuração e confirmação do ganhador, o ganhador poderá escolher entre <strong>receber o prêmio anunciado na respectiva rifa</strong> ou, quando essa opção estiver prevista para aquela rifa, <strong>receber via Pix o valor em dinheiro correspondente ao prêmio</strong>.</p>
          <p>O valor da opção em dinheiro será <strong>exatamente o valor do prêmio divulgado para a respectiva rifa</strong>, conforme informado na página, na divulgação ou nas condições oficiais daquela rifa. O valor não será calculado com base no preço de mercado no momento da entrega, mas sim de acordo com o valor do prêmio expressamente divulgado para aquela rifa.</p>
          <p>A escolha entre o prêmio e o valor correspondente em Pix deverá ser manifestada pelo ganhador após a confirmação do resultado. Uma vez escolhida uma das opções e iniciados os procedimentos para sua entrega ou pagamento, a alteração da opção poderá depender da concordância do responsável pela rifa e das condições aplicáveis.</p>
          <p>O pagamento via Pix será realizado para conta de titularidade do próprio ganhador, após a confirmação de sua identidade e dos dados necessários para a transferência. O ganhador será responsável por fornecer corretamente os dados bancários ou de Pix solicitados.</p>
          <p><strong>Exemplo:</strong> se a rifa anunciar um prêmio no valor de R$ 20.000,00, o ganhador poderá, conforme as condições da respectiva rifa, optar pelo prêmio anunciado ou pelo recebimento de <strong>R$ 20.000,00 via Pix</strong>.</p>
          <p>Essa regra deverá ser observada em conjunto com as condições específicas divulgadas para cada rifa e com a legislação e eventuais autorizações aplicáveis à promoção.</p>

          <h2>9. Entrega do prêmio</h2>
          <p>A entrega do prêmio ou, quando prevista para a respectiva rifa, o pagamento do valor correspondente via Pix, será realizada conforme as condições estabelecidas na respectiva rifa. O ganhador poderá ser solicitado a fornecer informações necessárias para confirmação de sua identidade e para realização da entrega ou do pagamento.</p>

          <h2>10. Responsabilidade de quem cria uma rifa</h2>
          <p>O responsável pela criação de uma rifa declara que possui legitimidade para anunciar o produto ou prêmio informado e assume responsabilidade pelas informações fornecidas.</p>
          <ul><li>Fornecer informações verdadeiras sobre o produto ou prêmio.</li><li>Possuir autorização ou direito para oferecer o produto anunciado.</li><li>Cumprir as obrigações legais aplicáveis à realização da rifa.</li><li>Realizar a entrega do prêmio conforme as condições anunciadas.</li></ul>
          <p>O cadastramento de uma rifa na plataforma não significa, por si só, que o RifasTOP tenha validado a propriedade, procedência ou regularidade jurídica do produto anunciado.</p>

          <h2>11. Responsabilidade do RifasTOP</h2>
          <p>O RifasTOP disponibiliza a infraestrutura tecnológica da plataforma, mas não assume automaticamente a condição de proprietário dos produtos anunciados pelos usuários nem substitui as obrigações do responsável por cada rifa.</p>
          <p>A plataforma poderá suspender temporariamente determinadas funcionalidades quando necessário para manutenção, atualização, segurança ou correção de problemas técnicos.</p>

          <h2>12. Condutas proibidas</h2>
          <p>É proibido utilizar o RifasTOP para praticar fraude ou tentativa de fraude, utilizar informações falsas, manipular resultados ou sistemas, explorar falhas técnicas, tentar acessar contas de terceiros, realizar atividades ilícitas, anunciar produtos cuja comercialização ou divulgação seja proibida ou praticar qualquer conduta que viole a legislação brasileira.</p>

          <h2>13. Privacidade e proteção de dados</h2>
          <p>O RifasTOP poderá coletar e utilizar dados pessoais necessários para criação e manutenção da conta, autenticação, participação em rifas, processamento de pagamentos, comunicação com o usuário, prevenção de fraudes, segurança da plataforma e cumprimento de obrigações legais.</p>
          <p>O tratamento de dados pessoais deverá observar a <strong>Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)</strong> e demais normas aplicáveis.</p>

          <h2>14. Comunicações</h2>
          <p>O usuário poderá receber comunicações relacionadas à sua conta, às suas participações, aos pagamentos, às rifas das quais participa e a informações importantes sobre o funcionamento da plataforma.</p>

          <h2>15. Propriedade intelectual</h2>
          <p>O conteúdo, identidade visual, marca, logotipo, layout, textos, códigos, elementos gráficos e demais componentes próprios do RifasTOP são protegidos pela legislação aplicável. É proibida a reprodução, cópia, modificação, distribuição ou utilização comercial não autorizada desses elementos.</p>

          <h2>16. Disponibilidade da plataforma</h2>
          <p>O RifasTOP busca manter a plataforma disponível e funcionando adequadamente, mas não garante funcionamento ininterrupto. Podem ocorrer indisponibilidades decorrentes de manutenção, falhas de servidores, serviços de terceiros, problemas de conexão, ataques cibernéticos ou outros acontecimentos fora do controle razoável da plataforma.</p>

          <h2>17. Alterações destes Termos</h2>
          <p>O RifasTOP poderá atualizar estes Termos de Uso sempre que necessário para adequação da plataforma, alterações de funcionalidades ou atendimento à legislação aplicável. A versão atualizada ficará disponível no site.</p>

          <h2>18. Legislação aplicável</h2>
          <p>Este Termo de Uso será interpretado de acordo com as leis da República Federativa do Brasil. As atividades de sorteio, promoção comercial ou outras modalidades reguladas pela legislação brasileira deverão observar as normas e autorizações aplicáveis a cada caso.</p>

          <h2>19. Contato</h2>
          <p>Para dúvidas, solicitações ou informações relacionadas ao uso do RifasTOP, o usuário poderá utilizar os canais de contato disponibilizados na plataforma.</p>

          <div className="terms-footer-brand"><strong>RifasTOP</strong><span>Plataforma de Rifas</span></div>
        </article>
      </div>
      </main>
    </>
  );
}
