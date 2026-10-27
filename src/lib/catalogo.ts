// Catálogo do que o brasileiro costuma pagar todo mês (ou todo ano).
// Serve de checklist para a pessoa não esquecer nenhuma conta e pré-preenche o
// cadastro de compromissos. Não fica no banco: é só ponto de partida, o usuário edita tudo.

export type TipoCompromisso =
  | "financiamento"
  | "emprestimo"
  | "parcelamento"
  | "consorcio"
  | "assinatura"
  | "fixo"
  | "anual";

export type Frequencia = "mensal" | "bimestral" | "trimestral" | "semestral" | "anual";

export const TIPOS_COMPROMISSO: Record<TipoCompromisso, { nome: string; temPrazo: boolean }> = {
  fixo: { nome: "Conta fixa", temPrazo: false },
  assinatura: { nome: "Assinatura", temPrazo: false },
  financiamento: { nome: "Financiamento", temPrazo: true },
  emprestimo: { nome: "Empréstimo", temPrazo: true },
  parcelamento: { nome: "Parcelamento", temPrazo: true },
  consorcio: { nome: "Consórcio", temPrazo: true },
  anual: { nome: "Conta anual (cota única ou parcelada)", temPrazo: false },
};

export const FREQUENCIAS: Record<Frequencia, string> = {
  mensal: "Mensal",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

export type ChaveCategoria = (typeof CATEGORIAS_PADRAO)[number]["chave"];

export const CATEGORIAS_PADRAO = [
  { chave: "moradia", nome: "Moradia", cor: "#0ea5e9" },
  { chave: "contas_consumo", nome: "Contas de consumo", cor: "#f59e0b" },
  { chave: "saude", nome: "Saúde", cor: "#ef4444" },
  { chave: "seguros", nome: "Seguros e proteção", cor: "#6366f1" },
  { chave: "transporte", nome: "Transporte", cor: "#14b8a6" },
  { chave: "educacao", nome: "Educação", cor: "#8b5cf6" },
  { chave: "assinaturas", nome: "Assinaturas e streaming", cor: "#ec4899" },
  { chave: "financeiro", nome: "Cartões, bancos e dívidas", cor: "#64748b" },
  { chave: "impostos", nome: "Impostos e taxas", cor: "#b45309" },
  { chave: "familia", nome: "Família e casa", cor: "#22c55e" },
  { chave: "pets", nome: "Pets", cor: "#a16207" },
  { chave: "cuidados", nome: "Cuidados pessoais", cor: "#d946ef" },
  { chave: "alimentacao", nome: "Alimentação", cor: "#84cc16" },
  { chave: "investimentos", nome: "Previdência e investimentos", cor: "#0f766e" },
  { chave: "contribuicoes", nome: "Doações e contribuições", cor: "#78716c" },
  { chave: "outros", nome: "Outros", cor: "#94a3b8" },
] as const;

export type ModeloGasto = {
  chave: string;
  nome: string;
  categoria: ChaveCategoria;
  tipo: TipoCompromisso;
  frequencia: Frequencia;
  /** Valor muda a cada mês (conta de consumo, fatura...): o lançamento nasce como estimativa. */
  variavel?: boolean;
  exemplos?: string;
  dica?: string;
};

export const CATALOGO: ModeloGasto[] = [
  // Moradia
  { chave: "aluguel", nome: "Aluguel", categoria: "moradia", tipo: "fixo", frequencia: "mensal", dica: "Reajusta uma vez por ano, geralmente pelo IGP-M ou IPCA. Confira o mês no contrato." },
  { chave: "condominio", nome: "Condomínio", categoria: "moradia", tipo: "fixo", frequencia: "mensal", variavel: true, dica: "Pode ter taxa extra ou chamada de capital em alguns meses." },
  { chave: "financiamento_imobiliario", nome: "Financiamento imobiliário", categoria: "moradia", tipo: "financiamento", frequencia: "mensal", variavel: true, exemplos: "Caixa, SFH, Minha Casa Minha Vida", dica: "Na tabela SAC a parcela cai a cada mês; com TR/IPCA ela pode subir." },
  { chave: "diarista", nome: "Diarista / faxina", categoria: "moradia", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "manutencao_casa", nome: "Manutenção da casa", categoria: "moradia", tipo: "fixo", frequencia: "mensal", variavel: true, exemplos: "Jardinagem, piscina, dedetização" },

  // Contas de consumo
  { chave: "energia", nome: "Energia elétrica", categoria: "contas_consumo", tipo: "fixo", frequencia: "mensal", variavel: true, dica: "A bandeira tarifária (verde, amarela, vermelha) muda o valor de um mês para outro." },
  { chave: "agua", nome: "Água e esgoto", categoria: "contas_consumo", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "gas", nome: "Gás", categoria: "contas_consumo", tipo: "fixo", frequencia: "mensal", variavel: true, exemplos: "Gás encanado ou botijão" },
  { chave: "internet", nome: "Internet", categoria: "contas_consumo", tipo: "fixo", frequencia: "mensal", dica: "Promoções de entrada costumam acabar depois de 12 meses." },
  { chave: "celular", nome: "Celular", categoria: "contas_consumo", tipo: "fixo", frequencia: "mensal", exemplos: "Plano pós-pago, controle ou recarga" },
  { chave: "telefone_fixo", nome: "Telefone fixo", categoria: "contas_consumo", tipo: "fixo", frequencia: "mensal" },
  { chave: "tv_assinatura", nome: "TV por assinatura", categoria: "contas_consumo", tipo: "fixo", frequencia: "mensal", exemplos: "Sky, Claro TV" },

  // Saúde
  { chave: "plano_saude", nome: "Plano de saúde", categoria: "saude", tipo: "fixo", frequencia: "mensal", dica: "Reajusta todo ano no aniversário do contrato e também quando você muda de faixa etária." },
  { chave: "plano_odontologico", nome: "Plano odontológico", categoria: "saude", tipo: "fixo", frequencia: "mensal" },
  { chave: "medicamentos", nome: "Medicamentos de uso contínuo", categoria: "saude", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "terapia", nome: "Terapia / psicólogo", categoria: "saude", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "tratamento", nome: "Tratamento contínuo", categoria: "saude", tipo: "fixo", frequencia: "mensal", exemplos: "Fisioterapia, nutricionista, ortodontia" },

  // Seguros e proteção
  { chave: "seguro_auto", nome: "Seguro do carro / moto", categoria: "seguros", tipo: "fixo", frequencia: "mensal", dica: "Renova todo ano. Faça cotação antes da renovação; o bônus vai junto se não houver sinistro." },
  { chave: "seguro_anual", nome: "Seguro com renovação anual", categoria: "seguros", tipo: "anual", frequencia: "anual", exemplos: "Seguro auto ou residencial pago à vista ou em parcelas", dica: "Renova todo ano: faça cotação antes do vencimento." },
  { chave: "seguro_residencial", nome: "Seguro residencial", categoria: "seguros", tipo: "fixo", frequencia: "mensal" },
  { chave: "seguro_vida", nome: "Seguro de vida", categoria: "seguros", tipo: "fixo", frequencia: "mensal" },
  { chave: "seguro_celular", nome: "Seguro do celular", categoria: "seguros", tipo: "fixo", frequencia: "mensal" },
  { chave: "seguro_fianca", nome: "Seguro fiança / título de capitalização do aluguel", categoria: "seguros", tipo: "fixo", frequencia: "mensal" },
  { chave: "plano_funerario", nome: "Plano funerário / assistência familiar", categoria: "seguros", tipo: "fixo", frequencia: "mensal" },
  { chave: "protecao_cartao", nome: "Seguro do cartão / proteção de perda e roubo", categoria: "seguros", tipo: "fixo", frequencia: "mensal", dica: "Muitas vezes vem embutido na fatura sem você perceber. Vale revisar." },

  // Transporte
  { chave: "financiamento_veiculo", nome: "Financiamento do veículo", categoria: "transporte", tipo: "financiamento", frequencia: "mensal" },
  { chave: "combustivel", nome: "Combustível", categoria: "transporte", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "estacionamento", nome: "Estacionamento mensal", categoria: "transporte", tipo: "fixo", frequencia: "mensal" },
  { chave: "tag_pedagio", nome: "Tag de pedágio", categoria: "transporte", tipo: "fixo", frequencia: "mensal", variavel: true, exemplos: "Sem Parar, ConectCar, Veloe" },
  { chave: "transporte_publico", nome: "Transporte público", categoria: "transporte", tipo: "fixo", frequencia: "mensal", variavel: true, exemplos: "Bilhete Único, metrô, ônibus" },
  { chave: "aplicativos_transporte", nome: "Apps de transporte", categoria: "transporte", tipo: "fixo", frequencia: "mensal", variavel: true, exemplos: "Uber, 99" },
  { chave: "manutencao_veiculo", nome: "Revisão e manutenção do veículo", categoria: "transporte", tipo: "fixo", frequencia: "semestral", variavel: true },
  { chave: "aluguel_veiculo", nome: "Carro por assinatura / aluguel", categoria: "transporte", tipo: "fixo", frequencia: "mensal" },

  // Educação
  { chave: "mensalidade_escolar", nome: "Mensalidade escolar", categoria: "educacao", tipo: "fixo", frequencia: "mensal", dica: "Reajusta todo início de ano letivo." },
  { chave: "material_escolar", nome: "Matrícula e material escolar", categoria: "educacao", tipo: "anual", frequencia: "anual", variavel: true, dica: "Costuma vencer entre dezembro e fevereiro. Vale se programar." },
  { chave: "transporte_escolar", nome: "Transporte escolar (van)", categoria: "educacao", tipo: "fixo", frequencia: "mensal" },
  { chave: "faculdade", nome: "Faculdade / pós-graduação", categoria: "educacao", tipo: "fixo", frequencia: "mensal" },
  { chave: "fies", nome: "FIES / crédito estudantil", categoria: "educacao", tipo: "financiamento", frequencia: "mensal" },
  { chave: "curso_idiomas", nome: "Curso de idiomas", categoria: "educacao", tipo: "fixo", frequencia: "mensal" },
  { chave: "cursos_online", nome: "Cursos e plataformas de estudo", categoria: "educacao", tipo: "assinatura", frequencia: "mensal", exemplos: "Alura, Udemy, Coursera" },

  // Assinaturas e streaming
  { chave: "streaming_video", nome: "Streaming de vídeo", categoria: "assinaturas", tipo: "assinatura", frequencia: "mensal", exemplos: "Netflix, Prime Video, Disney+, Max, Globoplay" },
  { chave: "streaming_musica", nome: "Streaming de música", categoria: "assinaturas", tipo: "assinatura", frequencia: "mensal", exemplos: "Spotify, Deezer, YouTube Music" },
  { chave: "nuvem", nome: "Armazenamento em nuvem", categoria: "assinaturas", tipo: "assinatura", frequencia: "mensal", exemplos: "iCloud, Google One, OneDrive" },
  { chave: "software", nome: "Softwares e apps", categoria: "assinaturas", tipo: "assinatura", frequencia: "mensal", exemplos: "Microsoft 365, ChatGPT, Canva" },
  { chave: "games", nome: "Games", categoria: "assinaturas", tipo: "assinatura", frequencia: "mensal", exemplos: "Game Pass, PlayStation Plus" },
  { chave: "clube_assinatura", nome: "Clubes de assinatura", categoria: "assinaturas", tipo: "assinatura", frequencia: "mensal", exemplos: "Vinho, livros, café, delivery (iFood Clube)" },
  { chave: "noticias", nome: "Jornais e revistas", categoria: "assinaturas", tipo: "assinatura", frequencia: "mensal" },

  // Cartões, bancos e dívidas
  { chave: "fatura_cartao", nome: "Fatura do cartão de crédito", categoria: "financeiro", tipo: "fixo", frequencia: "mensal", variavel: true, dica: "Pague sempre o total. O rotativo do cartão tem os juros mais altos do mercado." },
  { chave: "anuidade_cartao", nome: "Anuidade do cartão", categoria: "financeiro", tipo: "fixo", frequencia: "mensal", dica: "Dá para negociar isenção ou trocar por um cartão sem anuidade." },
  { chave: "tarifa_bancaria", nome: "Tarifa bancária / cesta de serviços", categoria: "financeiro", tipo: "fixo", frequencia: "mensal", dica: "Por lei todo banco oferece pacote de serviços essenciais gratuito." },
  { chave: "emprestimo_pessoal", nome: "Empréstimo pessoal", categoria: "financeiro", tipo: "emprestimo", frequencia: "mensal" },
  { chave: "consignado", nome: "Empréstimo consignado", categoria: "financeiro", tipo: "emprestimo", frequencia: "mensal", dica: "Descontado direto da folha ou do benefício do INSS." },
  { chave: "consorcio", nome: "Consórcio", categoria: "financeiro", tipo: "consorcio", frequencia: "mensal", variavel: true, dica: "A parcela é reajustada pelo valor do bem (INCC, tabela FIPE...)." },
  { chave: "acordo_divida", nome: "Acordo / renegociação de dívida", categoria: "financeiro", tipo: "parcelamento", frequencia: "mensal", exemplos: "Serasa Limpa Nome, Desenrola" },
  { chave: "parcelamento_cartao", nome: "Compra parcelada", categoria: "financeiro", tipo: "parcelamento", frequencia: "mensal", exemplos: "Eletrodoméstico, celular, viagem" },

  // Impostos e taxas
  { chave: "iptu", nome: "IPTU", categoria: "impostos", tipo: "anual", frequencia: "anual", dica: "O carnê chega no começo do ano: cota única com desconto ou até ~10 parcelas. Se você aluga, confira o contrato: se o IPTU vem embutido no aluguel, não cadastre separado." },
  { chave: "ipva", nome: "IPVA", categoria: "impostos", tipo: "anual", frequencia: "anual", dica: "Vence entre janeiro e março conforme o final da placa: cota única com desconto ou parcelado sem juros. Sem IPVA pago o licenciamento não sai." },
  { chave: "licenciamento", nome: "Licenciamento do veículo", categoria: "impostos", tipo: "anual", frequencia: "anual", dica: "Taxa anual do CRLV-e, cobrada à parte do IPVA." },
  { chave: "irpf", nome: "Imposto de Renda a pagar", categoria: "impostos", tipo: "parcelamento", frequencia: "mensal", dica: "Pode ser parcelado em até 8 quotas, com correção pela Selic a partir da segunda." },
  // A chave continua "das_mei" para quem já cadastrou seguir aparecendo como "Cadastrado" no catálogo.
  { chave: "das_mei", nome: "Impostos da empresa (CNPJ)", categoria: "impostos", tipo: "fixo", frequencia: "mensal", exemplos: "DAS do MEI, DAS do Simples Nacional, DARF", dica: "MEI e Simples Nacional pagam pela guia DAS, todo dia 20: no MEI o valor é fixo; no Simples ele muda com o faturamento, então ligue “O valor muda todo mês”. Lucro Presumido ou Real pagam por DARF (IRPJ, CSLL, PIS e Cofins) e guias de ISS ou ICMS; cadastre cada guia separada ou o total que o contador passar." },
  { chave: "inss_autonomo", nome: "INSS como autônomo (GPS)", categoria: "impostos", tipo: "fixo", frequencia: "mensal", dica: "Vence todo dia 15. É o que garante sua aposentadoria e seus auxílios." },
  { chave: "carne_leao", nome: "Carnê-Leão", categoria: "impostos", tipo: "fixo", frequencia: "mensal", variavel: true, dica: "Para quem recebe de pessoa física ou do exterior. Vence no último dia útil do mês seguinte." },
  { chave: "taxa_lixo", nome: "Taxa de lixo / bombeiros", categoria: "impostos", tipo: "anual", frequencia: "anual", dica: "Algumas cidades e estados cobram fora do IPTU." },

  // Família e casa
  { chave: "empregada_domestica", nome: "Empregada doméstica (salário)", categoria: "familia", tipo: "fixo", frequencia: "mensal" },
  { chave: "esocial_domestico", nome: "DAE do eSocial doméstico", categoria: "familia", tipo: "fixo", frequencia: "mensal", variavel: true, dica: "INSS, FGTS e seguro de acidente da doméstica. Vence todo dia 7." },
  { chave: "baba", nome: "Babá / cuidador(a)", categoria: "familia", tipo: "fixo", frequencia: "mensal" },
  { chave: "creche", nome: "Creche / berçário", categoria: "familia", tipo: "fixo", frequencia: "mensal" },
  { chave: "pensao_alimenticia", nome: "Pensão alimentícia", categoria: "familia", tipo: "fixo", frequencia: "mensal" },
  { chave: "mesada", nome: "Mesada", categoria: "familia", tipo: "fixo", frequencia: "mensal" },
  { chave: "ajuda_familia", nome: "Ajuda a familiares", categoria: "familia", tipo: "fixo", frequencia: "mensal" },

  // Pets
  { chave: "racao", nome: "Ração e areia", categoria: "pets", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "plano_pet", nome: "Plano de saúde pet", categoria: "pets", tipo: "fixo", frequencia: "mensal" },
  { chave: "banho_tosa", nome: "Banho e tosa", categoria: "pets", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "vacina_pet", nome: "Vacinas e vermífugo", categoria: "pets", tipo: "anual", frequencia: "anual", variavel: true },

  // Cuidados pessoais
  { chave: "academia", nome: "Academia", categoria: "cuidados", tipo: "assinatura", frequencia: "mensal", exemplos: "Smart Fit, Gympass/Wellhub, crossfit" },
  { chave: "salao_barbearia", nome: "Salão / barbearia", categoria: "cuidados", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "esporte", nome: "Esporte e atividades", categoria: "cuidados", tipo: "fixo", frequencia: "mensal", exemplos: "Natação, dança, luta, beach tennis" },
  { chave: "clube", nome: "Clube recreativo", categoria: "cuidados", tipo: "fixo", frequencia: "mensal" },

  // Alimentação
  { chave: "mercado", nome: "Supermercado", categoria: "alimentacao", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "feira", nome: "Feira, padaria e açougue", categoria: "alimentacao", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "delivery", nome: "Delivery e restaurantes", categoria: "alimentacao", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "marmita", nome: "Marmita / alimentação no trabalho", categoria: "alimentacao", tipo: "fixo", frequencia: "mensal", variavel: true },

  // Previdência e investimentos
  { chave: "previdencia_privada", nome: "Previdência privada", categoria: "investimentos", tipo: "fixo", frequencia: "mensal", exemplos: "PGBL, VGBL", dica: "O PGBL pode ser deduzido em até 12% da renda tributável no IR completo." },
  { chave: "aporte_investimento", nome: "Aporte em investimentos", categoria: "investimentos", tipo: "fixo", frequencia: "mensal", dica: "Trate como conta a pagar: pague-se primeiro." },
  { chave: "reserva_emergencia", nome: "Reserva de emergência", categoria: "investimentos", tipo: "fixo", frequencia: "mensal" },

  // Doações e contribuições
  { chave: "dizimo", nome: "Dízimo / oferta", categoria: "contribuicoes", tipo: "fixo", frequencia: "mensal", variavel: true },
  { chave: "doacao", nome: "Doação recorrente", categoria: "contribuicoes", tipo: "fixo", frequencia: "mensal", exemplos: "ONGs, projetos, financiamento coletivo" },
  { chave: "sindicato", nome: "Sindicato / associação", categoria: "contribuicoes", tipo: "fixo", frequencia: "mensal" },
  { chave: "conselho_classe", nome: "Anuidade do conselho de classe", categoria: "contribuicoes", tipo: "anual", frequencia: "anual", exemplos: "OAB, CRM, CREA, CRC, COREN", dica: "Costuma ter desconto à vista até janeiro ou fevereiro." },
];

export function buscarModelo(chave: string | undefined): ModeloGasto | undefined {
  return chave ? CATALOGO.find((m) => m.chave === chave) : undefined;
}
