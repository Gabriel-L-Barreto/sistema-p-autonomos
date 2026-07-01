import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    orcamento: { findUnique: vi.fn(), update: vi.fn() },
    orcamentoStatusHistorico: { create: vi.fn() },
  },
}));

import { PUT } from "./route";
import { prisma } from "@/lib/prisma";

type FakeReq = { json: () => Promise<unknown> };
const makeReq = (body: unknown): FakeReq => ({ json: async () => body });
const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) });

const updateMock = prisma.orcamento.update as ReturnType<typeof vi.fn>;
const findUniqueMock = prisma.orcamento.findUnique as ReturnType<typeof vi.fn>;
const historicoCreateMock = prisma.orcamentoStatusHistorico.create as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  updateMock.mockResolvedValue({ id: 1, status: "ACEITO" });
});

describe("PUT /api/orcamentos/[id] - histórico de status", () => {
  it("registra histórico quando o status muda", async () => {
    findUniqueMock.mockResolvedValue({ status: "CADASTRADO" });

    await PUT(makeReq({ status: "ACEITO" }) as never, makeCtx("1") as never);

    expect(historicoCreateMock).toHaveBeenCalledTimes(1);
    expect(historicoCreateMock).toHaveBeenCalledWith({
      data: { orcamentoId: 1, status: "ACEITO" },
    });
  });

  it("não registra histórico quando o status não muda", async () => {
    findUniqueMock.mockResolvedValue({ status: "ACEITO" });

    await PUT(makeReq({ status: "ACEITO" }) as never, makeCtx("1") as never);

    expect(historicoCreateMock).not.toHaveBeenCalled();
  });

  it("não registra histórico quando o status não é enviado", async () => {
    findUniqueMock.mockResolvedValue({ status: "CADASTRADO" });

    await PUT(makeReq({ tempoEstimado: 5 }) as never, makeCtx("1") as never);

    expect(historicoCreateMock).not.toHaveBeenCalled();
  });

  it("retorna 400 para ID inválido", async () => {
    const res = await PUT(makeReq({ status: "ACEITO" }) as never, makeCtx("abc") as never);
    expect(res.status).toBe(400);
  });
});
