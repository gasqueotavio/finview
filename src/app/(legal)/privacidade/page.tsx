import Link from "next/link";
import { Documento } from "../documento";

export const metadata = { title: "Política de Privacidade · FinView" };

const CONTATO = "otavioscamattig@gmail.com";

export default function PrivacidadePage() {
  return (
    <Documento titulo="Política de Privacidade" vigencia="27 de outubro de 2026">
      <p>
        Esta política explica quais dados pessoais o FinView trata, para quê, com quem compartilha e como você exerce seus
        direitos. Ela foi elaborada em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais</strong> (LGPD, Lei nº
        13.709/2018), e o FinView trata dados pessoais de acordo com essa lei.
      </p>

      <h2>1. Quem é o responsável pelos seus dados</h2>
      <p>
        O controlador dos dados é <strong>Otávio Gasque</strong>, desenvolvedor do FinView. Para qualquer assunto sobre seus
        dados, inclusive pedidos com base na LGPD, o canal de atendimento ao titular é o e-mail{" "}
        <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
      </p>

      <h2>2. Quais dados tratamos</h2>
      <ul>
        <li>
          <strong>Dados de cadastro:</strong> seu e-mail e sua senha. A senha nunca é guardada em texto: o serviço de
          autenticação armazena apenas um código derivado dela (hash), que não permite recuperá-la.
        </li>
        <li>
          <strong>Login com Google (opcional):</strong> se você escolher essa opção, recebemos do Google seu nome, e-mail, foto de
          perfil e um identificador da conta. Não temos acesso à sua senha do Google.
        </li>
        <li>
          <strong>Dados financeiros que você cadastra:</strong> descrições e observações de gastos e compromissos, nomes de
          categorias, valores, datas de vencimento e de pagamento, número de parcelas e situação de cada conta.
        </li>
        <li>
          <strong>Dados técnicos:</strong> endereço IP, tipo de navegador e horários de acesso, registrados pelos provedores de
          hospedagem e autenticação para segurança e funcionamento do serviço.
        </li>
      </ul>
      <p>
        Não pedimos CPF, dados bancários, senhas de banco ou números de cartão, e você não deve informá-los nos campos de texto.
      </p>

      <h2>3. Para que usamos e com qual base legal</h2>
      <ul>
        <li>
          <strong>Prestar o serviço</strong> (criar sua conta, guardar e mostrar suas contas, calcular totais, gerar parcelas
          recorrentes): execução de contrato com você (art. 7º, V, da LGPD).
        </li>
        <li>
          <strong>Enviar e-mails necessários</strong> (confirmação de cadastro e recuperação de senha): execução de contrato (art.
          7º, V).
        </li>
        <li>
          <strong>Proteger a conta e o serviço</strong> (registros de acesso, prevenção de fraude e abuso): legítimo interesse
          (art. 7º, IX) e segurança do titular.
        </li>
        <li>
          <strong>Cumprir obrigações legais</strong> ou atender autoridades, quando exigido: art. 7º, II.
        </li>
      </ul>
      <p>
        Não usamos seus dados para publicidade, não vendemos nem alugamos dados e não fazemos perfis de consumo ou decisões
        automatizadas sobre você.
      </p>

      <h2>4. Como protegemos seus dados</h2>
      <ul>
        <li>
          <strong>Criptografia dos textos:</strong> descrições, observações e nomes de categorias são cifrados com AES-256-GCM,
          com uma chave própria para cada usuário, antes de chegar ao banco de dados. Quem acessasse o banco veria só texto
          embaralhado.
        </li>
        <li>
          <strong>Valores e datas</strong> ficam sem essa camada extra de cifra, porque são necessários para calcular os totais
          do mês; continuam protegidos pelas demais medidas abaixo.
        </li>
        <li>
          <strong>Isolamento por usuário:</strong> regras de segurança no próprio banco de dados (Row Level Security) impedem que
          uma conta leia ou altere dados de outra.
        </li>
        <li>
          <strong>Conexão segura</strong> (HTTPS) em todo o site, senhas fortes obrigatórias e sessões encerradas nos outros
          aparelhos quando você troca a senha.
        </li>
      </ul>
      <p>
        Se ocorrer um incidente de segurança que possa trazer risco ou dano relevante a você, comunicaremos a Autoridade
        Nacional de Proteção de Dados (ANPD) e os titulares afetados, como determina o art. 48 da LGPD.
      </p>

      <h2>5. Com quem compartilhamos</h2>
      <p>Usamos fornecedores (operadores) que tratam dados apenas para fazer o FinView funcionar:</p>
      <ul>
        <li>
          <strong>Supabase</strong>: banco de dados e autenticação. Os dados ficam em servidores nos Estados Unidos (Oregon).
        </li>
        <li>
          <strong>Vercel</strong>: hospedagem do site, com servidores nos Estados Unidos.
        </li>
        <li>
          <strong>Google</strong>: apenas se você usar o login com Google.
        </li>
        <li>
          <strong>Provedor de envio de e-mails</strong>: para os e-mails de confirmação e recuperação de senha.
        </li>
      </ul>
      <p>
        Como esses servidores ficam fora do Brasil, há transferência internacional de dados, feita com base no art. 33, IX, da
        LGPD, por ser necessária à execução do serviço que você contratou. Também podemos compartilhar dados quando exigido por
        lei ou ordem de autoridade competente.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Usamos apenas cookies essenciais, que mantêm você conectado à sua conta com segurança. Não usamos cookies de publicidade,
        de rastreamento ou de análise de terceiros.
      </p>

      <h2>7. Por quanto tempo guardamos</h2>
      <p>
        Seus dados ficam guardados enquanto sua conta existir. Quando você exclui a conta, seus dados são apagados do banco de
        dados na hora. Registros técnicos mantidos pelos provedores (como logs de acesso) seguem os prazos de cada um e são
        eliminados ao fim deles.
      </p>

      <h2>8. Seus direitos</h2>
      <p>Pelo art. 18 da LGPD, você pode, a qualquer momento:</p>
      <ul>
        <li>confirmar se tratamos seus dados e acessá-los;</li>
        <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
        <li>pedir a anonimização, o bloqueio ou a eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
        <li>receber seus dados em formato de arquivo (portabilidade);</li>
        <li>pedir a eliminação dos seus dados e saber com quem eles são compartilhados;</li>
        <li>revogar consentimentos e se opor a tratamentos feitos sem consentimento, quando cabível.</li>
      </ul>
      <p>
        Boa parte disso você faz sozinho no app: editar qualquer informação, <strong>baixar todos os seus dados</strong> e{" "}
        <strong>excluir sua conta</strong> ficam em <Link href="/conta">Minha conta</Link>. Para os demais pedidos, escreva para{" "}
        <a href={`mailto:${CONTATO}`}>{CONTATO}</a>; respondemos em até 15 dias. Você também pode apresentar reclamação à ANPD
        (gov.br/anpd).
      </p>

      <h2>9. Crianças e adolescentes</h2>
      <p>O FinView é destinado a maiores de 18 anos e não coleta intencionalmente dados de crianças e adolescentes.</p>

      <h2>10. Mudanças nesta política</h2>
      <p>
        Se esta política mudar de forma relevante, avisaremos no próprio app antes de a mudança valer. A data de vigência no topo
        sempre indica a versão atual.
      </p>
    </Documento>
  );
}
