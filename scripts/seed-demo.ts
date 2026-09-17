import { PrismaClient, TipoMedida, TipoPagamento, Status } from "@prisma/client";

/**
 * Limpa e popula a demo com dados fictícios em todas as etapas,
 * para quem visitar entender o fluxo (catálogo → orçamento → controle → recebimentos).
 */
const prisma = new PrismaClient();

const OWNER = 1;

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function dateOnly(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

async function clearBusinessData() {
  await prisma.controleGastoDia.deleteMany();
  await prisma.pagamento.deleteMany();
  await prisma.materialOrcamento.deleteMany();
  await prisma.servicoOrcamento.deleteMany();
  await prisma.orcamentoStatusHistorico.deleteMany();
  await prisma.orcamento.deleteMany();
  await prisma.servicoMaterial.deleteMany();
  await prisma.servico.deleteMany();
  await prisma.material.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.empresaConfig.deleteMany();
}

async function main() {
  await clearBusinessData();

  await prisma.autonomo.upsert({
    where: { id: OWNER },
    update: { nome: "Demo" },
    create: { id: OWNER, nome: "Demo" },
  });

  await prisma.empresaConfig.create({
    data: {
      cabecalho: "Sistema de Orçamentos (demo)\nContatos: (11) 90000-0000 / demo@exemplo.com\nRua Exemplo, 100 — Cidade Demo",
      cabecalhoCor: "#5b42f3",
      cabecalhoLocal: "meio",
      rodape: "Ambiente de demonstração do portfólio — dados fictícios.",
      rodapeLocal: "meio",
      nomeAssinatura: "Demo",
      cidadeEmissao: "Cidade Demo",
      logoUrl: null,
      timbradoUrl: null,
      timbradoRecebimentoUrl: null,
      pixQrCodeUrl: null,
    },
  });

  const materiais = await Promise.all(
    [
      { nome_material: "Cimento CP-II 50kg", unidadeMedida: TipoMedida.UNITARIO, precoUnitario: 38.9 },
      { nome_material: "Areia média", unidadeMedida: TipoMedida.M3, precoUnitario: 180 },
      { nome_material: "Brita 1", unidadeMedida: TipoMedida.M3, precoUnitario: 210 },
      { nome_material: "Tijolo cerâmico 9x19x19", unidadeMedida: TipoMedida.UNITARIO, precoUnitario: 1.35 },
      { nome_material: "Argamassa AC-II 20kg", unidadeMedida: TipoMedida.UNITARIO, precoUnitario: 28.5 },
      { nome_material: "Tinta acrílica branca 18L", unidadeMedida: TipoMedida.UNITARIO, precoUnitario: 289 },
      { nome_material: "Rejunte flexível 1kg", unidadeMedida: TipoMedida.UNITARIO, precoUnitario: 22 },
      { nome_material: "Tubo PVC esgoto 40mm", unidadeMedida: TipoMedida.METROS, precoUnitario: 12.5 },
      { nome_material: "Cabo flexível 2,5mm", unidadeMedida: TipoMedida.METROS, precoUnitario: 4.8 },
      { nome_material: "Placa drywall ST 12,5mm", unidadeMedida: TipoMedida.M2, precoUnitario: 42 },
      { nome_material: "Porcelanato 60x60", unidadeMedida: TipoMedida.M2, precoUnitario: 69 },
      { nome_material: "Massa corrida PVA 25kg", unidadeMedida: TipoMedida.UNITARIO, precoUnitario: 55 },
    ].map((m) =>
      prisma.material.create({
        data: { ...m, ativo: true, ownerAutonomoId: OWNER },
      })
    )
  );

  const byName = Object.fromEntries(materiais.map((m) => [m.nome_material, m]));

  const servicosDefs = [
    {
      descricao: "Alvenaria de vedação",
      tipo_cobranca: TipoMedida.M2,
      precoBase: 85,
      mats: [
        { nome: "Tijolo cerâmico 9x19x19", qtd: 25 },
        { nome: "Cimento CP-II 50kg", qtd: 0.4 },
        { nome: "Areia média", qtd: 0.05 },
      ],
    },
    {
      descricao: "Contrapiso",
      tipo_cobranca: TipoMedida.M2,
      precoBase: 45,
      mats: [
        { nome: "Cimento CP-II 50kg", qtd: 0.25 },
        { nome: "Areia média", qtd: 0.04 },
        { nome: "Brita 1", qtd: 0.03 },
      ],
    },
    {
      descricao: "Reboco interno",
      tipo_cobranca: TipoMedida.M2,
      precoBase: 38,
      mats: [
        { nome: "Cimento CP-II 50kg", qtd: 0.15 },
        { nome: "Areia média", qtd: 0.03 },
      ],
    },
    {
      descricao: "Pintura interna (duas demãos)",
      tipo_cobranca: TipoMedida.M2,
      precoBase: 28,
      mats: [
        { nome: "Tinta acrílica branca 18L", qtd: 0.04 },
        { nome: "Massa corrida PVA 25kg", qtd: 0.08 },
      ],
    },
    {
      descricao: "Assentamento de piso",
      tipo_cobranca: TipoMedida.M2,
      precoBase: 55,
      mats: [
        { nome: "Porcelanato 60x60", qtd: 1.05 },
        { nome: "Argamassa AC-II 20kg", qtd: 0.35 },
        { nome: "Rejunte flexível 1kg", qtd: 0.12 },
      ],
    },
    {
      descricao: "Instalação hidráulica (tubulação)",
      tipo_cobranca: TipoMedida.METROS,
      precoBase: 42,
      mats: [{ nome: "Tubo PVC esgoto 40mm", qtd: 1.1 }],
    },
    {
      descricao: "Instalação elétrica (pontos)",
      tipo_cobranca: TipoMedida.UNITARIO,
      precoBase: 95,
      mats: [{ nome: "Cabo flexível 2,5mm", qtd: 8 }],
    },
    {
      descricao: "Forro em drywall",
      tipo_cobranca: TipoMedida.M2,
      precoBase: 75,
      mats: [{ nome: "Placa drywall ST 12,5mm", qtd: 1.1 }],
    },
  ] as const;

  const servicos = [];
  for (const s of servicosDefs) {
    const created = await prisma.servico.create({
      data: {
        descricao: s.descricao,
        tipo_cobranca: s.tipo_cobranca,
        precoBase: s.precoBase,
        servicoAtivo: true,
        ownerAutonomoId: OWNER,
        servicoMateriais: {
          create: s.mats.map((m) => ({
            quantidade: m.qtd,
            materialId: byName[m.nome].id,
          })),
        },
      },
    });
    servicos.push(created);
  }

  const svc = Object.fromEntries(servicos.map((s) => [s.descricao, s]));

  const clientes = await Promise.all(
    [
      { nome: "Ana Souza", afiliacao: "Residencial", telefone: "(11) 98888-1001" },
      { nome: "Bruno Costa", afiliacao: "Comercial", telefone: "(11) 97777-2002" },
      { nome: "Carla Mendes", afiliacao: "Residencial", telefone: "(11) 96666-3003" },
      { nome: "Diego Ferreira", afiliacao: "Residencial", telefone: "(11) 95555-4004" },
    ].map((c) =>
      prisma.cliente.create({
        data: { ...c, ownerAutonomoId: OWNER },
      })
    )
  );

  const [ana, bruno, carla, diego] = clientes;

  type LinhaServico = {
    servico: (typeof servicos)[number];
    quantidade: number;
    descricaoLivre?: string;
  };
  type LinhaMaterial = {
    material: (typeof materiais)[number];
    quantidade: number;
  };

  async function criarOrcamento(opts: {
    cliente: (typeof clientes)[number];
    endereco: string;
    data: Date;
    status: Status;
    tempoEstimado?: number;
    incluiMaterial: boolean;
    totalParcelas?: number;
    formaPagamentoPadrao?: TipoPagamento;
    complemento?: string;
    servicos: LinhaServico[];
    materiais?: LinhaMaterial[];
    historico: Array<{ status: Status; data: Date }>;
    pagamentos?: Array<{ valorRecebido: number; formaPagamento: TipoPagamento; data: Date }>;
    controle?: {
      dataInicio: Date;
      dataFim?: Date;
      gastos: Array<{ data: Date; valorPessoal: number; valorMateriais: number; observacao?: string }>;
    };
  }) {
    const orc = await prisma.orcamento.create({
      data: {
        endereco: opts.endereco,
        data: opts.data,
        tempoEstimado: opts.tempoEstimado ?? null,
        incluiMaterial: opts.incluiMaterial,
        totalParcelas: opts.totalParcelas ?? null,
        formaPagamentoPadrao: opts.formaPagamentoPadrao ?? null,
        status: opts.status,
        complemento: opts.complemento ?? null,
        clienteNome: opts.cliente.nome,
        clienteTelefone: opts.cliente.telefone,
        clienteAfiliacao: opts.cliente.afiliacao,
        ownerAutonomoId: OWNER,
        clienteId: opts.cliente.id,
        dataInicioControle: opts.controle ? dateOnly(opts.controle.dataInicio) : null,
        dataFimControle: opts.controle?.dataFim ? dateOnly(opts.controle.dataFim) : null,
        servicos: {
          create: opts.servicos.map((s) => ({
            servicoId: s.servico.id,
            servicoDescricao: s.servico.descricao,
            descricaoLivre: s.descricaoLivre ?? null,
            medidaServico: s.servico.tipo_cobranca,
            quantidade: s.quantidade,
            valorMaoObra: s.servico.precoBase,
          })),
        },
        materiais: opts.materiais
          ? {
              create: opts.materiais.map((m) => ({
                materialId: m.material.id,
                materialNome: m.material.nome_material,
                medidaMaterial: m.material.unidadeMedida,
                origemMaterial: "catalogo",
                quantidade: m.quantidade,
                precoUnitario: m.material.precoUnitario,
              })),
            }
          : undefined,
        historicoStatus: {
          create: opts.historico.map((h) => ({ status: h.status, data: h.data })),
        },
        pagamentos: opts.pagamentos
          ? {
              create: opts.pagamentos.map((p) => ({
                valorRecebido: p.valorRecebido,
                formaPagamento: p.formaPagamento,
                data: p.data,
              })),
            }
          : undefined,
        gastosControle: opts.controle
          ? {
              create: opts.controle.gastos.map((g) => ({
                data: dateOnly(g.data),
                valorPessoal: g.valorPessoal,
                valorMateriais: g.valorMateriais,
                semGastos: false,
                observacao: g.observacao ?? null,
              })),
            }
          : undefined,
      },
    });
    return orc;
  }

  // 1) Cadastrado — proposta nova, ainda sem resposta do cliente
  await criarOrcamento({
    cliente: ana,
    endereco: "Rua das Flores, 120 — Jardim Centro",
    data: daysAgo(2),
    status: Status.CADASTRADO,
    tempoEstimado: 12,
    incluiMaterial: true,
    complemento: "Reforma completa do banheiro social.",
    servicos: [
      { servico: svc["Assentamento de piso"], quantidade: 6 },
      { servico: svc["Pintura interna (duas demãos)"], quantidade: 18 },
      { servico: svc["Instalação hidráulica (tubulação)"], quantidade: 8 },
    ],
    materiais: [
      { material: byName["Porcelanato 60x60"], quantidade: 7 },
      { material: byName["Argamassa AC-II 20kg"], quantidade: 3 },
      { material: byName["Tinta acrílica branca 18L"], quantidade: 1 },
    ],
    historico: [{ status: Status.CADASTRADO, data: daysAgo(2) }],
  });

  // 2) Não aceito — proposta recusada
  await criarOrcamento({
    cliente: bruno,
    endereco: "Av. Comercial, 450 — Sala 3",
    data: daysAgo(20),
    status: Status.NAO_ACEITO,
    tempoEstimado: 8,
    incluiMaterial: false,
    complemento: "Cliente optou por outra proposta.",
    servicos: [
      { servico: svc["Pintura interna (duas demãos)"], quantidade: 80 },
      { servico: svc["Forro em drywall"], quantidade: 35 },
    ],
    historico: [
      { status: Status.CADASTRADO, data: daysAgo(20) },
      { status: Status.NAO_ACEITO, data: daysAgo(15) },
    ],
  });

  // 3) Aceito há mais de 5 dias — alerta de aguardando início
  await criarOrcamento({
    cliente: carla,
    endereco: "Rua Horizonte, 88 — Vila Nova",
    data: daysAgo(18),
    status: Status.ACEITO,
    tempoEstimado: 20,
    incluiMaterial: true,
    totalParcelas: 3,
    formaPagamentoPadrao: TipoPagamento.PIX,
    complemento: "Ampliação da cozinha — aguardando liberação do material.",
    servicos: [
      { servico: svc["Alvenaria de vedação"], quantidade: 22 },
      { servico: svc["Reboco interno"], quantidade: 40 },
      { servico: svc["Contrapiso"], quantidade: 15 },
    ],
    materiais: [
      { material: byName["Tijolo cerâmico 9x19x19"], quantidade: 550 },
      { material: byName["Cimento CP-II 50kg"], quantidade: 18 },
      { material: byName["Areia média"], quantidade: 2 },
    ],
    historico: [
      { status: Status.CADASTRADO, data: daysAgo(18) },
      { status: Status.ACEITO, data: daysAgo(12) },
    ],
  });

  // 4) Inicializado com recebimento — obra em andamento + controle de gastos
  await criarOrcamento({
    cliente: ana,
    endereco: "Rua das Flores, 120 — área de serviço",
    data: daysAgo(35),
    status: Status.INICIALIZADO,
    tempoEstimado: 15,
    incluiMaterial: true,
    totalParcelas: 4,
    formaPagamentoPadrao: TipoPagamento.PIX,
    complemento: "Obra em andamento com registro diário no controle.",
    servicos: [
      { servico: svc["Contrapiso"], quantidade: 20 },
      { servico: svc["Assentamento de piso"], quantidade: 20 },
      { servico: svc["Instalação elétrica (pontos)"], quantidade: 6 },
    ],
    materiais: [
      { material: byName["Porcelanato 60x60"], quantidade: 22 },
      { material: byName["Argamassa AC-II 20kg"], quantidade: 8 },
      { material: byName["Cabo flexível 2,5mm"], quantidade: 50 },
    ],
    historico: [
      { status: Status.CADASTRADO, data: daysAgo(35) },
      { status: Status.ACEITO, data: daysAgo(30) },
      { status: Status.INICIALIZADO, data: daysAgo(22) },
    ],
    pagamentos: [
      { valorRecebido: 1500, formaPagamento: TipoPagamento.PIX, data: daysAgo(21) },
      { valorRecebido: 1200, formaPagamento: TipoPagamento.DINHEIRO, data: daysAgo(8) },
    ],
    controle: {
      dataInicio: daysAgo(22),
      gastos: [
        { data: daysAgo(22), valorPessoal: 280, valorMateriais: 420, observacao: "Abertura e compra inicial" },
        { data: daysAgo(20), valorPessoal: 280, valorMateriais: 0 },
        { data: daysAgo(18), valorPessoal: 300, valorMateriais: 190, observacao: "Argamassa e rejunte" },
        { data: daysAgo(15), valorPessoal: 280, valorMateriais: 0 },
        { data: daysAgo(10), valorPessoal: 320, valorMateriais: 150 },
      ],
    },
  });

  // 5) Inicializado sem recebimento recente — alerta 15 dias
  await criarOrcamento({
    cliente: diego,
    endereco: "Travessa do Sol, 15 — Casa 2",
    data: daysAgo(40),
    status: Status.INICIALIZADO,
    tempoEstimado: 25,
    incluiMaterial: true,
    totalParcelas: 5,
    formaPagamentoPadrao: TipoPagamento.CARTAO,
    complemento: "Em andamento, sem novo recebimento há mais de 15 dias.",
    servicos: [
      { servico: svc["Alvenaria de vedação"], quantidade: 35 },
      { servico: svc["Reboco interno"], quantidade: 60 },
      { servico: svc["Pintura interna (duas demãos)"], quantidade: 60 },
    ],
    materiais: [
      { material: byName["Tijolo cerâmico 9x19x19"], quantidade: 900 },
      { material: byName["Cimento CP-II 50kg"], quantidade: 25 },
      { material: byName["Tinta acrílica branca 18L"], quantidade: 3 },
    ],
    historico: [
      { status: Status.CADASTRADO, data: daysAgo(40) },
      { status: Status.ACEITO, data: daysAgo(36) },
      { status: Status.INICIALIZADO, data: daysAgo(28) },
    ],
    pagamentos: [
      { valorRecebido: 800, formaPagamento: TipoPagamento.PIX, data: daysAgo(27) },
    ],
    controle: {
      dataInicio: daysAgo(28),
      gastos: [
        { data: daysAgo(28), valorPessoal: 250, valorMateriais: 600 },
        { data: daysAgo(25), valorPessoal: 250, valorMateriais: 0 },
        { data: daysAgo(20), valorPessoal: 250, valorMateriais: 180 },
      ],
    },
  });

  // 6) Finalizado e quitado — ciclo completo
  await criarOrcamento({
    cliente: bruno,
    endereco: "Av. Comercial, 450 — fachada",
    data: daysAgo(90),
    status: Status.FINALIZADO,
    tempoEstimado: 10,
    incluiMaterial: true,
    totalParcelas: 2,
    formaPagamentoPadrao: TipoPagamento.PIX,
    complemento: "Obra concluída e quitada — exemplo de ciclo completo.",
    servicos: [
      { servico: svc["Pintura interna (duas demãos)"], quantidade: 45 },
      { servico: svc["Forro em drywall"], quantidade: 20 },
    ],
    materiais: [
      { material: byName["Tinta acrílica branca 18L"], quantidade: 2 },
      { material: byName["Placa drywall ST 12,5mm"], quantidade: 22 },
    ],
    historico: [
      { status: Status.CADASTRADO, data: daysAgo(90) },
      { status: Status.ACEITO, data: daysAgo(85) },
      { status: Status.INICIALIZADO, data: daysAgo(80) },
      { status: Status.FINALIZADO, data: daysAgo(55) },
    ],
    pagamentos: [
      { valorRecebido: 2500, formaPagamento: TipoPagamento.PIX, data: daysAgo(79) },
      { valorRecebido: 1762, formaPagamento: TipoPagamento.PIX, data: daysAgo(54) },
    ],
    controle: {
      dataInicio: daysAgo(80),
      dataFim: daysAgo(55),
      gastos: [
        { data: daysAgo(80), valorPessoal: 300, valorMateriais: 500 },
        { data: daysAgo(75), valorPessoal: 300, valorMateriais: 200 },
        { data: daysAgo(70), valorPessoal: 300, valorMateriais: 0 },
        { data: daysAgo(60), valorPessoal: 280, valorMateriais: 120 },
      ],
    },
  });

  // 7) Finalizado sem quitar — alerta de pendência
  await criarOrcamento({
    cliente: carla,
    endereco: "Rua Horizonte, 88 — lavanderia",
    data: daysAgo(60),
    status: Status.FINALIZADO,
    tempoEstimado: 7,
    incluiMaterial: true,
    totalParcelas: 3,
    formaPagamentoPadrao: TipoPagamento.DINHEIRO,
    complemento: "Finalizado, ainda com valor em aberto.",
    servicos: [
      { servico: svc["Assentamento de piso"], quantidade: 10 },
      { servico: svc["Instalação hidráulica (tubulação)"], quantidade: 12 },
    ],
    materiais: [
      { material: byName["Porcelanato 60x60"], quantidade: 11 },
      { material: byName["Tubo PVC esgoto 40mm"], quantidade: 14 },
    ],
    historico: [
      { status: Status.CADASTRADO, data: daysAgo(60) },
      { status: Status.ACEITO, data: daysAgo(55) },
      { status: Status.INICIALIZADO, data: daysAgo(50) },
      { status: Status.FINALIZADO, data: daysAgo(25) },
    ],
    pagamentos: [
      { valorRecebido: 700, formaPagamento: TipoPagamento.DINHEIRO, data: daysAgo(49) },
    ],
    controle: {
      dataInicio: daysAgo(50),
      dataFim: daysAgo(25),
      gastos: [
        { data: daysAgo(50), valorPessoal: 220, valorMateriais: 350 },
        { data: daysAgo(45), valorPessoal: 220, valorMateriais: 0 },
        { data: daysAgo(30), valorPessoal: 220, valorMateriais: 90 },
      ],
    },
  });

  const counts = {
    clientes: await prisma.cliente.count(),
    materiais: await prisma.material.count(),
    servicos: await prisma.servico.count(),
    orcamentos: await prisma.orcamento.count(),
    pagamentos: await prisma.pagamento.count(),
    gastosControle: await prisma.controleGastoDia.count(),
  };

  console.log(JSON.stringify({ ok: true, seeded: true, ...counts }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
