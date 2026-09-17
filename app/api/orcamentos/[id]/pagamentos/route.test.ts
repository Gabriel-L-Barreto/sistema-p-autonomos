import { describe, it, expect, vi, beforeEach } from "vitest";

const { findUniqueMock, createMock, executeRawMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  createMock: vi.fn(),
  executeRawMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        $executeRaw: executeRawMock,
        orcamento: { findUnique: findUniqueMock },
        pagamento: { create: createMock },
      })
    ),
    orcamento: { findUnique: findUniqueMock },
    pagamento: { create: createMock },
  },
}));

import { POST } from "./route";
import { prisma } from "@/lib/prisma";

type FakeReq = { json: () => Promise<unknown> };
const makeReq = (body: unknown): FakeReq => ({ json: async () => body });
const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) });

const orcamentoBase = {
  id: 1,
  status: "ACEITO",
  incluiMaterial: false,
  materiais: [],
  servicos: [{ quantidade: 1, valorMaoObra: 1000 }],
  pagamentos: [{ valorRecebido: 600 }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/orcamentos/[id]/pagamentos", () => {
  it("rejeita recebimento acima do saldo restante (400)", async () => {
    findUniqueMock.mockResolvedValue(orcamentoBase);

    const res = await POST(
      makeReq({ valorRecebido: 500, formaPagamento: "PIX" }) as never,
      makeCtx("1") as never
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/exceder/i);
    expect(prisma.pagamento.create).not.toHaveBeenCalled();
  });

  it("aceita recebimento igual ou abaixo do saldo (201)", async () => {
    findUniqueMock.mockResolvedValue(orcamentoBase);
    createMock.mockResolvedValue({
      id: 10,
      orcamentoId: 1,
      valorRecebido: 400,
      formaPagamento: "PIX",
    });

    const res = await POST(
      makeReq({ valorRecebido: 400, formaPagamento: "PIX" }) as never,
      makeCtx("1") as never
    );

    expect(res.status).toBe(201);
    expect(prisma.pagamento.create).toHaveBeenCalledTimes(1);
  });

  it("rejeita recebimento para orçamento ainda não aceito (400)", async () => {
    findUniqueMock.mockResolvedValue({
      ...orcamentoBase,
      status: "CADASTRADO",
    });

    const res = await POST(
      makeReq({ valorRecebido: 100, formaPagamento: "PIX" }) as never,
      makeCtx("1") as never
    );

    expect(res.status).toBe(400);
    expect(prisma.pagamento.create).not.toHaveBeenCalled();
  });

  it("rejeita valor não positivo (400)", async () => {
    const res = await POST(
      makeReq({ valorRecebido: 0, formaPagamento: "PIX" }) as never,
      makeCtx("1") as never
    );
    expect(res.status).toBe(400);
  });

  it("rejeita forma de pagamento inválida (400)", async () => {
    const res = await POST(
      makeReq({ valorRecebido: 100, formaPagamento: "BOLETO" }) as never,
      makeCtx("1") as never
    );
    expect(res.status).toBe(400);
  });
});
