import Link from "next/link";
import { Documento } from "../documento";

export const metadata = { title: "Termos de Uso · FinView" };

const CONTATO = "otavioscamattig@gmail.com";

export default function TermosPage() {
  return (
    <Documento titulo="Termos de Uso" vigencia="27 de outubro de 2026">
      <p>
        Estes termos regem o uso do FinView, aplicativo de controle de contas pessoais desenvolvido por <strong>Otávio Gasque</strong>.
        Ao criar uma conta ou entrar com o Google, você concorda com eles e com a{" "}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>1. O que é o FinView</h2>
      <p>
        O FinView ajuda você a organizar gastos, contas recorrentes, parcelamentos e impostos, mostrando o que vence e quanto
        falta pagar. Ele <strong>não</strong> é banco, não movimenta dinheiro, não paga contas por você e não acessa suas contas
        bancárias. Os pagamentos continuam sendo feitos por você, no seu banco.
      </p>

      <h2>2. Não é consultoria financeira</h2>
      <p>
        Cálculos e sugestões do app (como comparar cota única com parcelamento ou quanto separar por mês) são estimativas
        informativas, baseadas nos dados que você informa. Eles não substituem a orientação de um profissional nem a conferência
        dos valores nos boletos, carnês e contratos.
      </p>

      <h2>3. Sua conta</h2>
      <ul>
        <li>Você precisa ter 18 anos ou mais.</li>
        <li>A conta é pessoal: mantenha sua senha em segurança e não a compartilhe.</li>
        <li>Você é responsável pela exatidão das informações que cadastra.</li>
        <li>Você pode baixar seus dados ou excluir a conta a qualquer momento, em Minha conta.</li>
      </ul>

      <h2>4. Uso permitido</h2>
      <p>Não é permitido usar o FinView para:</p>
      <ul>
        <li>tentar acessar dados de outras pessoas ou burlar mecanismos de segurança;</li>
        <li>sobrecarregar o serviço, automatizar cadastros ou fazer engenharia reversa com fins maliciosos;</li>
        <li>guardar conteúdo ilegal ou dados de terceiros sem autorização.</li>
      </ul>
      <p>Contas usadas dessa forma podem ser suspensas ou encerradas.</p>

      <h2>5. Disponibilidade</h2>
      <p>
        O FinView é oferecido gratuitamente e pode passar por manutenções, mudanças de funcionalidades ou interrupções. Faremos o
        possível para manter o serviço estável e seus dados seguros, mas não garantimos funcionamento ininterrupto. Lembretes e
        totais do app são um apoio: confira sempre os vencimentos oficiais das suas contas.
      </p>

      <h2>6. Responsabilidade</h2>
      <p>
        Na medida permitida pela legislação, inclusive o Código de Defesa do Consumidor, o FinView não se responsabiliza por
        multas, juros ou prejuízos decorrentes de contas não pagas, de informações cadastradas incorretamente ou de decisões
        tomadas com base nas estimativas do app.
      </p>

      <h2>7. Mudanças nestes termos</h2>
      <p>Se estes termos mudarem de forma relevante, avisaremos no app antes de a mudança valer.</p>

      <h2>8. Lei aplicável e contato</h2>
      <p>
        Estes termos seguem as leis brasileiras. Fica eleito o foro do domicílio do usuário. Dúvidas:{" "}
        <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
      </p>
    </Documento>
  );
}
