import { describe, it, expect } from "vitest";
import {
  calcularValorTotal,
  calcularTotalPago,
  calcularValorRestante,
  calcularPorcentagemPaga,
  calcularValorParcela,
} from "./orcamento";

describe("calcularValorTotal", () => {
  it("soma materiais e serviços quando incluiMaterial é true", () => {
    const materiais = [
      { quantidade: 2, precoUnitario: 50 }, // 100
      { quantidade: 3, precoUnitario: 10 }, // 30
    ];
    const servicos = [
      { quantidade: 1, valorMaoObra: 200 }, // 200
    ];
    expect(calcularValorTotal(materiais, servicos, true)).toBe(330);
  });

  it("ignora materiais quando incluiMaterial é false", () => {
    const materiais = [{ quantidade: 10, precoUnitario: 99 }];
    const servicos = [{ quantidade: 2, valorMaoObra: 150 }]; // 300
    expect(calcularValorTotal(materiais, servicos, false)).toBe(300);
  });

  it("retorna 0 para listas vazias", () => {
    expect(calcularValorTotal([], [], true)).toBe(0);
  });

  it("arredonda para 2 casas decimais", () => {
    const materiais = [{ quantidade: 3, precoUnitario: 0.1 }]; // 0.30000000000000004
    expect(calcularValorTotal(materiais, [], true)).toBe(0.3);
  });
});

describe("calcularTotalPago", () => {
  it("soma os valores recebidos", () => {
    expect(
      calcularTotalPago([
        { valorRecebido: 100 },
        { valorRecebido: 50.5 },
        { valorRecebido: 0.25 },
      ])
    ).toBe(150.75);
  });

  it("retorna 0 quando não há pagamentos", () => {
    expect(calcularTotalPago([])).toBe(0);
  });
});

describe("calcularValorRestante (saldo)", () => {
  it("retorna a diferença entre total e pago", () => {
    expect(calcularValorRestante(1000, 400)).toBe(600);
  });

  it("nunca retorna valor negativo (não permite saldo abaixo de zero)", () => {
    expect(calcularValorRestante(1000, 1200)).toBe(0);
  });

  it("retorna 0 quando totalmente quitado", () => {
    expect(calcularValorRestante(500, 500)).toBe(0);
  });

  it("arredonda corretamente", () => {
    expect(calcularValorRestante(100.1, 0.1)).toBe(100);
  });
});

describe("calcularPorcentagemPaga", () => {
  it("calcula a porcentagem com uma casa decimal", () => {
    expect(calcularPorcentagemPaga(1000, 250)).toBe(25);
    expect(calcularPorcentagemPaga(3, 1)).toBe(33.3);
  });

  it("limita o máximo a 100", () => {
    expect(calcularPorcentagemPaga(100, 250)).toBe(100);
  });

  it("retorna 0 quando o total é zero ou negativo", () => {
    expect(calcularPorcentagemPaga(0, 100)).toBe(0);
    expect(calcularPorcentagemPaga(-10, 100)).toBe(0);
  });
});

describe("calcularValorParcela", () => {
  it("divide o saldo igualmente pelas parcelas restantes", () => {
    expect(calcularValorParcela(1000, 4)).toBe(250);
  });

  it("arredonda a 2 casas decimais", () => {
    expect(calcularValorParcela(1000, 3)).toBe(333.33);
  });

  it("usa divisor mínimo de 1 (última parcela quita o saldo)", () => {
    expect(calcularValorParcela(500, 1)).toBe(500);
    expect(calcularValorParcela(500, 0)).toBe(500);
    expect(calcularValorParcela(500, -5)).toBe(500);
  });
});
