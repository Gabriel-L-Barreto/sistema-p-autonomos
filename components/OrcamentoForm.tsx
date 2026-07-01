"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { RichTextEditor } from "./RichTextEditor";
import { AutocompleteCatalogo } from "./AutocompleteCatalogo";
import { AutocompleteCliente } from "./AutocompleteCliente";
import type {
  Cliente,
  Material,
  Servico,
  MaterialOrcamento,
  ServicoOrcamento,
  OrcamentoFull,
} from "@/lib/types";
import { LABELS_STATUS, LABELS_MEDIDA } from "@/lib/types";
import type { TipoMedida } from "@/lib/types";
import { formatarNumero, formatarPreco } from "@/lib/format";
import { calcularValorTotal } from "@/lib/orcamento";

export type { OrcamentoFull };

type Props = {
  initialData: OrcamentoFull | null;
  onSuccess: (id: number, opts?: { abrirPdfRecebimento?: boolean }) => void;
  onCancel: () => void;
};

export function OrcamentoForm({ initialData, onSuccess, onCancel }: Props) {
  const isEdit = !!initialData;
  const formatarDecimalEntrada = (valor: string) => {
    let limpo = valor.replace(/[^0-9,.\s]/g, "").replace(/\s/g, "").replace(/\./g, ",");
    const partes = limpo.split(",");
    if (partes.length > 2) {
      limpo = partes[0] + "," + partes.slice(1).join("");
    }
    return limpo;
  };

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clienteId, setClienteId] = useState<number | "">("");
  const [clienteBusca, setClienteBusca] = useState("");
  const [endereco, setEndereco] = useState("");
  const [complemento, setComplemento] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [tempoEstimado, setTempoEstimado] = useState<number | "">("");
  const [incluiMaterial, setIncluiMaterial] = useState(false);
  const [status, setStatus] = useState<OrcamentoFull["status"]>("CADASTRADO");

  const [materiaisOrcamento, setMateriaisOrcamento] = useState<MaterialOrcamento[]>([]);
  const [novoMaterial, setNovoMaterial] = useState({
    materialId: "" as number | "",
    medidaMaterial: "UNITARIO" as TipoMedida,
    origemMaterial: "",
    quantidade: "",
    precoUnitario: "",
  });

  const [servicosOrcamento, setServicosOrcamento] = useState<ServicoOrcamento[]>([]);
  const [novoServico, setNovoServico] = useState({
    servicoId: "" as number | "",
    quantidade: "",
    valorMaoObra: "",
  });

  const [materialBusca, setMaterialBusca] = useState("");
  const [materialSelecionadoId, setMaterialSelecionadoId] = useState<number | null>(null);
  const [materialAdicionarAoCatalogo, setMaterialAdicionarAoCatalogo] = useState(false);

  const [servicoBusca, setServicoBusca] = useState("");
  const [servicoSelecionadoId, setServicoSelecionadoId] = useState<number | null>(null);
  const [servicoAdicionarAoCatalogo, setServicoAdicionarAoCatalogo] = useState(false);
  const [servicoMedida, setServicoMedida] = useState<TipoMedida>("UNITARIO");

  const [sinapiMateriais, setSinapiMateriais] = useState<Material[]>([]);
  const [sinapiServicos, setSinapiServicos] = useState<Servico[]>([]);
  const [passo, setPasso] = useState(1);
  const [mostrarOpcoesAvancadas, setMostrarOpcoesAvancadas] = useState(false);
  const [mostrarDetalhesMaterial, setMostrarDetalhesMaterial] = useState(false);

  const CHAVE_SINAPI = "sinapi_mg_campos_vertentes_ativo";

  const PASSOS = [
    { id: 1, titulo: "Cliente", subtitulo: "Quem contratou e onde será feito" },
    { id: 2, titulo: "Serviços", subtitulo: "O que será executado" },
    { id: 3, titulo: "Materiais", subtitulo: "Opcional" },
    { id: 4, titulo: "Revisar", subtitulo: "Confira e salve" },
  ] as const;

  useEffect(() => {
    const load = async () => {
      const [cRes, mRes, sRes] = await Promise.all([
        fetch("/api/clientes"),
        fetch("/api/materiais"),
        fetch("/api/servicos"),
      ]);
      if (!cRes.ok || !mRes.ok || !sRes.ok) {
        setError("Falha ao carregar dados");
        return;
      }
      setClientes(await cRes.json());
      const todosMateriais = await mRes.json();
      const todosServicos = await sRes.json();
      setMateriais(todosMateriais.filter((m: { ativo?: boolean }) => m.ativo !== false));
      setServicos(todosServicos.filter((s: { servicoAtivo?: boolean }) => s.servicoAtivo !== false));

      const sinapiAtivo = typeof window !== "undefined" && localStorage.getItem(CHAVE_SINAPI) === "true";
      if (sinapiAtivo) {
        try {
          const [insumosRes, servicosRes] = await Promise.all([
            fetch("/api/sinapi/insumos"),
            fetch("/api/sinapi/servicos"),
          ]);
          if (insumosRes.ok) {
            const insumos = await insumosRes.json();
            setSinapiMateriais(
              insumos.map((i: { id: number; codigo: string; nome_material: string; unidadeMedida: string; precoUnitario: number }) => ({
                id: i.id,
                nome_material: i.nome_material,
                unidadeMedida: i.unidadeMedida as "UNITARIO" | "M2",
                precoUnitario: i.precoUnitario,
                codigoSinapi: i.codigo,
              }))
            );
          }
          if (servicosRes.ok) {
            const servs = await servicosRes.json();
            setSinapiServicos(
              servs.map((s: { id: number; codigo: string; descricao: string; tipo_cobranca: string; precoBase: number }) => ({
                id: s.id,
                descricao: s.descricao,
                tipo_cobranca: s.tipo_cobranca as TipoMedida,
                precoBase: s.precoBase,
                codigoSinapi: s.codigo,
              }))
            );
          }
        } catch {
          // falha silenciosa ao carregar SINAPI
        }
      } else {
        setSinapiMateriais([]);
        setSinapiServicos([]);
      }
      if (initialData) {
        setClienteId(initialData.clienteId);
        setClienteBusca(initialData.cliente?.nome ?? "");
        setEndereco(initialData.endereco);
        setComplemento(initialData.complemento ?? "");
        setData(initialData.data.split("T")[0]);
        setTempoEstimado(initialData.tempoEstimado ?? "");
        setIncluiMaterial(initialData.incluiMaterial);
        setStatus(initialData.status);
        setMateriaisOrcamento(
          initialData.materiais.map((m) => ({
            materialId: m.materialId,
            material: m.material,
            medidaMaterial: m.medidaMaterial,
            origemMaterial: m.origemMaterial,
            quantidade: m.quantidade,
            precoUnitario: m.precoUnitario,
          }))
        );
        setServicosOrcamento(
          initialData.servicos.map((s) => ({
            servicoId: s.servicoId,
            servico: s.servico,
            descricaoLivre: s.descricaoLivre,
            medidaServico: s.medidaServico ?? null,
            quantidade: s.quantidade,
            valorMaoObra: s.valorMaoObra,
          }))
        );
      }
      setLoading(false);
    };
    load();
  }, [initialData]);

  const adicionarMaterial = async () => {
    if (!novoMaterial.quantidade || !novoMaterial.precoUnitario) {
      setError("Quantidade e preço unitário são obrigatórios");
      return;
    }
    if (!materialSelecionadoId && !materialBusca.trim()) {
      setError("Digite ou selecione um material.");
      return;
    }
    const quantidadeNum = parseInt(novoMaterial.quantidade, 10);
    if (Number.isNaN(quantidadeNum) || quantidadeNum <= 0 || !Number.isInteger(quantidadeNum)) {
      setError("Quantidade deve ser um número inteiro positivo");
      return;
    }
    const quantidade = quantidadeNum;
    const precoUnitario = parseFloat(String(novoMaterial.precoUnitario).replace(",", "."));
    if (Number.isNaN(precoUnitario) || precoUnitario < 0) {
      setError("Preço unitário inválido");
      return;
    }
    const medidaMaterial = novoMaterial.medidaMaterial;
    const origemMaterial = novoMaterial.origemMaterial || null;

    if (materialSelecionadoId) {
      const material = materiais.find((m) => m.id === materialSelecionadoId);
      const sinapiMat = sinapiMateriais.find((m) => m.id === materialSelecionadoId);
      if (sinapiMat && materialSelecionadoId < 0) {
        const origem = `SINAPI MG - ${(sinapiMat as { codigoSinapi?: string }).codigoSinapi || ""} - ${sinapiMat.nome_material}`;
        setMateriaisOrcamento([
          ...materiaisOrcamento,
          {
            materialId: null,
            material: null,
            medidaMaterial,
            origemMaterial: origem,
            quantidade,
            precoUnitario,
          },
        ]);
      } else {
        setMateriaisOrcamento([
          ...materiaisOrcamento,
          {
            materialId: materialSelecionadoId,
            material: material || null,
            medidaMaterial,
            origemMaterial,
            quantidade,
            precoUnitario,
          },
        ]);
      }
    } else if (materialAdicionarAoCatalogo && materialBusca.trim()) {
      const valorTotalLinha = quantidade * precoUnitario;
      const precoUnitarioCatalogo = quantidade > 0 ? valorTotalLinha / quantidade : precoUnitario;
      try {
        const resposta = await fetch("/api/materiais", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome_material: materialBusca.trim(),
            unidadeMedida: medidaMaterial,
            precoUnitario: precoUnitarioCatalogo,
          }),
        });
        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          throw new Error(dados.error || "Falha ao cadastrar no catálogo");
        }
        const materialCriado = await resposta.json();
        setMateriais([...materiais, materialCriado]);
        setMateriaisOrcamento([
          ...materiaisOrcamento,
          {
            materialId: materialCriado.id,
            material: materialCriado,
            medidaMaterial,
            origemMaterial,
            quantidade,
            precoUnitario,
          },
        ]);
      } catch (erro) {
        setError(erro instanceof Error ? erro.message : "Erro ao cadastrar material no catálogo");
        return;
      }
    } else {
      setMateriaisOrcamento([
        ...materiaisOrcamento,
        {
          materialId: null,
          material: null,
          medidaMaterial,
          origemMaterial: materialBusca.trim() || origemMaterial,
          quantidade,
          precoUnitario,
        },
      ]);
    }

    setNovoMaterial({
      materialId: "" as number | "",
      medidaMaterial: "UNITARIO",
      origemMaterial: "",
      quantidade: "",
      precoUnitario: "",
    });
    setMaterialBusca("");
    setMaterialSelecionadoId(null);
    setMaterialAdicionarAoCatalogo(false);
    setError(null);
  };

  const removerMaterial = (index: number) =>
    setMateriaisOrcamento((prev) => prev.filter((_, i) => i !== index));

  const servicoCatalogoSelecionado =
    servicoSelecionadoId !== null &&
    (servicos.some((s) => s.id === servicoSelecionadoId) ||
      sinapiServicos.some((s) => s.id === servicoSelecionadoId));

  const medidaServicoFormulario = (): TipoMedida => {
    if (servicoSelecionadoId !== null) {
      const doCatalogo =
        servicos.find((s) => s.id === servicoSelecionadoId) ??
        sinapiServicos.find((s) => s.id === servicoSelecionadoId);
      if (doCatalogo) return doCatalogo.tipo_cobranca;
    }
    return servicoMedida;
  };

  const medidaServicoItem = (serv: ServicoOrcamento): TipoMedida =>
    serv.servico?.tipo_cobranca ?? serv.medidaServico ?? "UNITARIO";

  const adicionarServico = async () => {
    if (!servicoSelecionadoId && !servicoBusca.trim()) {
      setError("Digite ou selecione um serviço. Use a busca para escolher do catálogo ou digite uma descrição para adicionar apenas neste orçamento.");
      return;
    }
    if (!novoServico.quantidade || !novoServico.valorMaoObra) {
      setError("Quantidade e valor da mão de obra são obrigatórios");
      return;
    }
    const quantidadeNum = parseFloat(String(novoServico.quantidade).replace(",", "."));
    if (Number.isNaN(quantidadeNum) || quantidadeNum <= 0) {
      setError("Quantidade deve ser um número positivo");
      return;
    }
    const quantidade = quantidadeNum;
    const valorMaoObra = parseFloat(String(novoServico.valorMaoObra).replace(",", "."));
    if (Number.isNaN(valorMaoObra) || valorMaoObra < 0) {
      setError("Valor da mão de obra inválido");
      return;
    }

    const medidaAtual = medidaServicoFormulario();

    if (servicoBusca.trim() && !servicoSelecionadoId) {
      if (servicoAdicionarAoCatalogo) {
        try {
          const resposta = await fetch("/api/servicos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              descricao: servicoBusca.trim(),
              tipo_cobranca: medidaAtual,
              precoBase: valorMaoObra,
            }),
          });
          if (!resposta.ok) {
            const dados = await resposta.json().catch(() => ({}));
            throw new Error(dados.error || "Falha ao cadastrar no catálogo");
          }
          const servicoCriado = await resposta.json();
          setServicos([...servicos, servicoCriado]);
          setServicosOrcamento([
            ...servicosOrcamento,
            {
              servicoId: servicoCriado.id,
              servico: servicoCriado,
              descricaoLivre: null,
              medidaServico: null,
              quantidade,
              valorMaoObra,
            },
          ]);
        } catch (erro) {
          setError(erro instanceof Error ? erro.message : "Erro ao cadastrar serviço no catálogo");
          return;
        }
      } else {
        setServicosOrcamento([
          ...servicosOrcamento,
          {
            servicoId: null,
            servico: null,
            descricaoLivre: servicoBusca.trim(),
            medidaServico: medidaAtual,
            quantidade,
            valorMaoObra,
          },
        ]);
      }
      setNovoServico({ servicoId: "" as number | "", quantidade: "", valorMaoObra: "" });
      setServicoBusca("");
      setServicoSelecionadoId(null);
      setServicoAdicionarAoCatalogo(false);
      setServicoMedida("UNITARIO");
      setError(null);
      return;
    }

    const servico = servicos.find((s) => s.id === servicoSelecionadoId);
    const sinapiServ = sinapiServicos.find((s) => s.id === servicoSelecionadoId);
    if (sinapiServ && servicoSelecionadoId && servicoSelecionadoId < 0) {
      const descricaoSinapi = `SINAPI MG - ${(sinapiServ as { codigoSinapi?: string }).codigoSinapi || ""} - ${sinapiServ.descricao}`;
      setServicosOrcamento([
        ...servicosOrcamento,
        {
          servicoId: null,
          servico: null,
          descricaoLivre: descricaoSinapi,
          medidaServico: sinapiServ.tipo_cobranca,
          quantidade,
          valorMaoObra,
        },
      ]);
    } else {
      setServicosOrcamento([
        ...servicosOrcamento,
        {
          servicoId: servicoSelecionadoId,
          servico: servico || null,
          descricaoLivre: null,
          medidaServico: null,
          quantidade,
          valorMaoObra,
        },
      ]);
      const materiaisParaAcrescentar: MaterialOrcamento[] = [];
      try {
        const resServ = await fetch(`/api/servicos/${servicoSelecionadoId}`);
        if (resServ.ok) {
          const servComMateriais = await resServ.json();
          const materiaisVinculados = servComMateriais?.servicoMateriais ?? [];
          for (const sm of materiaisVinculados) {
            const mat = sm.material;
            if (!mat) continue;
            const qtdMaterial = sm.quantidade * quantidade;
            materiaisParaAcrescentar.push({
              materialId: mat.id,
              material: mat,
              medidaMaterial: mat.unidadeMedida,
              origemMaterial: `(vinculado: ${servico?.descricao ?? ""})`,
              quantidade: Math.round(qtdMaterial * 1000) / 1000,
              precoUnitario: mat.precoUnitario,
            });
          }
        }
      } catch {
        // falha silenciosa ao carregar materiais vinculados
      }
      if (materiaisParaAcrescentar.length > 0) {
        setMateriaisOrcamento((prev) => {
          const resultado = [...prev];
          for (const mat of materiaisParaAcrescentar) {
            const idx = resultado.findIndex(
              (m) => m.materialId !== null && m.materialId === mat.materialId
            );
            if (idx >= 0) {
              resultado[idx] = {
                ...resultado[idx],
                quantidade: Math.round((resultado[idx].quantidade + mat.quantidade) * 1000) / 1000,
              };
            } else {
              resultado.push(mat);
            }
          }
          return resultado;
        });
      }
    }

    setNovoServico({ servicoId: "" as number | "", quantidade: "", valorMaoObra: "" });
    setServicoBusca("");
    setServicoSelecionadoId(null);
    setServicoAdicionarAoCatalogo(false);
    setServicoMedida("UNITARIO");
    setError(null);
  };

  const removerServico = async (index: number) => {
    const servicoRemovido = servicosOrcamento[index];
    setServicosOrcamento(servicosOrcamento.filter((_, i) => i !== index));
    if (servicoRemovido?.servicoId) {
      try {
        const res = await fetch(`/api/servicos/${servicoRemovido.servicoId}`);
        if (res.ok) {
          const serv = await res.json();
          const materiaisVinculados = serv.servicoMateriais ?? [];
          const qtdServico = servicoRemovido.quantidade;
          setMateriaisOrcamento((prev) => {
            const resultado = prev.map((m) => {
              const sm = materiaisVinculados.find((sm: { materialId: number }) => sm.materialId === m.materialId);
              if (!sm || m.materialId === null) return m;
              const qtdRemover = sm.quantidade * qtdServico;
              const novaQtd = Math.round((m.quantidade - qtdRemover) * 1000) / 1000;
              return { ...m, quantidade: novaQtd };
            });
            return resultado.filter((m) => m.quantidade > 0);
          });
        }
      } catch {
        // falha silenciosa
      }
    }
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!clienteId) {
      setError("Selecione um cliente");
      setPasso(1);
      return;
    }
    if (!endereco.trim()) {
      setError("Endereço é obrigatório");
      setPasso(1);
      return;
    }
    if (servicosOrcamento.length === 0) {
      setError("Adicione pelo menos um serviço ao orçamento");
      setPasso(2);
      return;
    }
    setSaving(true);
    try {
      let orcamentoId: number;

      if (isEdit && initialData) {
        const resposta = await fetch(`/api/orcamentos/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clienteId: Number(clienteId),
            endereco: endereco.trim(),
            data,
            tempoEstimado: tempoEstimado || null,
            incluiMaterial,
            totalParcelas: initialData?.totalParcelas ?? null,
            status,
            complemento: complemento.trim() || null,
          }),
        });
        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          throw new Error(dados.error || "Falha ao atualizar");
        }
        const { id: idOrcamento, materiais: mats, servicos: servs } =
          await resposta.json();
        orcamentoId = idOrcamento;
        for (const mat of mats) {
          await fetch(`/api/orcamentos/${orcamentoId}/materiais/${mat.id}`, {
            method: "DELETE",
          });
        }
        for (const serv of servs) {
          await fetch(`/api/orcamentos/${orcamentoId}/servicos/${serv.id}`, {
            method: "DELETE",
          });
        }
      } else {
        const resposta = await fetch("/api/orcamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clienteId: Number(clienteId),
            endereco: endereco.trim(),
            data,
            tempoEstimado: tempoEstimado || null,
            incluiMaterial,
            totalParcelas: null,
            status,
            complemento: complemento.trim() || null,
          }),
        });
        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          throw new Error(dados.error || "Falha ao criar");
        }
        const orc = await resposta.json();
        orcamentoId = orc.id;
      }

      for (const mat of materiaisOrcamento) {
        const resposta = await fetch(`/api/orcamentos/${orcamentoId}/materiais`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mat),
        });
        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          throw new Error(dados.error || "Falha ao adicionar material no orçamento");
        }
      }
      for (const serv of servicosOrcamento) {
        const resposta = await fetch(`/api/orcamentos/${orcamentoId}/servicos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serv),
        });
        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          throw new Error(dados.error || "Falha ao adicionar serviço no orçamento");
        }
      }

      if (!isEdit) {
        window.open(`/api/orcamentos/${orcamentoId}/pdf`, "_blank", "noopener,noreferrer");
      }
      onSuccess(orcamentoId);
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const totalServicos = servicosOrcamento.reduce((s, srv) => s + srv.quantidade * srv.valorMaoObra, 0);
  const totalMateriaisLista = materiaisOrcamento.reduce((s, m) => s + m.quantidade * m.precoUnitario, 0);
  const valorTotalExibido = calcularValorTotal(
    materiaisOrcamento,
    servicosOrcamento,
    incluiMaterial
  );

  const nomeServicoItem = (serv: ServicoOrcamento) =>
    serv.servico?.descricao ||
    (serv.descricaoLivre
      ? serv.descricaoLivre.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80)
      : "") ||
    "Serviço";

  const nomeMaterialItem = (mat: MaterialOrcamento) =>
    mat.material?.nome_material || mat.origemMaterial || "Material";

  const validarPasso = (p: number): string | null => {
    if (p === 1) {
      if (!clienteId) return "Selecione um cliente na lista.";
      if (!endereco.trim()) return "Informe o endereço onde o serviço será realizado.";
    }
    if (p === 2 && servicosOrcamento.length === 0) {
      return "Adicione pelo menos um serviço antes de continuar.";
    }
    return null;
  };

  const irParaPasso = (destino: number) => {
    if (destino <= passo) {
      setError(null);
      setPasso(destino);
      return;
    }
    for (let p = passo; p < destino; p++) {
      const msg = validarPasso(p);
      if (msg) {
        setError(msg);
        setPasso(p);
        return;
      }
    }
    setError(null);
    setPasso(destino);
  };

  const avancarPasso = () => {
    const msg = validarPasso(passo);
    if (msg) {
      setError(msg);
      return;
    }
    setError(null);
    setPasso((p) => Math.min(4, p + 1));
  };

  const voltarPasso = () => {
    setError(null);
    setPasso((p) => Math.max(1, p - 1));
  };

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Carregando…</p>;
  }

  const inputBase =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]";
  const labelBase = "mb-1.5 block text-sm font-semibold text-[var(--foreground)]";
  const hintBase = "mt-1 text-xs text-[var(--muted)]";
  const requiredMark = <span className="text-[var(--danger)]" aria-hidden> *</span>;
  const cardBase =
    "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6";

  const listaServicosAdicionados = (
    <ul className="space-y-2" aria-label="Serviços adicionados">
      {servicosOrcamento.map((serv, idx) => (
        <li
          key={idx}
          className={`flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
            serv.servicoId
              ? "border-[var(--border)] bg-[var(--surface-elevated)]"
              : "border-[var(--warning)]/40 bg-[var(--warning)]/10"
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[var(--foreground)]">{nomeServicoItem(serv)}</p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              {formatarNumero(serv.quantidade, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}{" "}
              {LABELS_MEDIDA[medidaServicoItem(serv)]} × {formatarPreco(serv.valorMaoObra)} ={" "}
              <span className="font-medium text-[var(--foreground)]">
                {formatarPreco(serv.quantidade * serv.valorMaoObra)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => removerServico(idx)}
            className="shrink-0 rounded-lg border border-[var(--danger)]/30 px-4 py-2 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]"
          >
            Remover
          </button>
        </li>
      ))}
    </ul>
  );

  const listaMateriaisAdicionados = materiaisOrcamento.length > 0 && (
    <ul className="space-y-2" aria-label="Materiais adicionados">
      {materiaisOrcamento.map((mat, idx) => (
        <li
          key={idx}
          className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[var(--foreground)]">{nomeMaterialItem(mat)}</p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">
              {formatarNumero(mat.quantidade, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}{" "}
              {mat.medidaMaterial || "un"} × {formatarPreco(mat.precoUnitario)} ={" "}
              <span className="font-medium text-[var(--foreground)]">
                {formatarPreco(mat.quantidade * mat.precoUnitario)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => removerMaterial(idx)}
            className="shrink-0 rounded-lg border border-[var(--danger)]/30 px-4 py-2 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]"
          >
            Remover
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <form onSubmit={salvar} className="pb-28">
      {/* Indicador de etapas */}
      <nav aria-label="Etapas do orçamento" className="mb-6">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {PASSOS.map((p) => {
            const ativo = passo === p.id;
            const concluido = passo > p.id;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => irParaPasso(p.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                    ativo
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/20"
                      : concluido
                        ? "border-[var(--success)]/40 bg-[var(--success-soft)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)]"
                  }`}
                  aria-current={ativo ? "step" : undefined}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      ativo
                        ? "bg-[var(--accent)] text-[var(--on-accent)]"
                        : concluido
                          ? "bg-[var(--success)] text-white"
                          : "bg-[var(--surface-elevated)] text-[var(--muted)]"
                    }`}
                  >
                    {concluido ? "✓" : p.id}
                  </span>
                  <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{p.titulo}</p>
                  <p className="text-xs text-[var(--muted)]">{p.subtitulo}</p>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-[var(--danger)]/50 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]"
        >
          {error}
        </div>
      )}

      {/* Etapa 1 — Cliente e local */}
      {passo === 1 && (
        <section className={cardBase} aria-labelledby="etapa-cliente">
          <h2 id="etapa-cliente" className="text-xl font-semibold text-[var(--foreground)]">
            Para quem é este orçamento?
          </h2>
          <p className={hintBase}>Comece escolhendo o cliente e o local do serviço.</p>

          <div className="mt-6 space-y-5">
            <div>
              <label className={labelBase} htmlFor="cliente-busca">
                Cliente{requiredMark}
              </label>
              <AutocompleteCliente
                clientes={clientes}
                value={clienteBusca}
                onChange={(v) => {
                  setClienteBusca(v);
                  if (!clientes.some((c) => c.nome === v)) setClienteId("");
                }}
                onSelect={(c) => {
                  setClienteId(c.id);
                  setClienteBusca(c.nome);
                }}
                selectedId={clienteId || ""}
                placeholder="Digite o nome do cliente"
              />
              <p className={hintBase}>Toque na caixa e escolha um nome da lista.</p>
              <Link
                href="/clientes"
                className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Cliente novo? Cadastre aqui
              </Link>
            </div>

            <div>
              <label className={labelBase} htmlFor="endereco">
                Endereço do serviço{requiredMark}
              </label>
              <input
                id="endereco"
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className={inputBase}
                placeholder="Rua, número, bairro, cidade"
                required
              />
            </div>

            <div>
              <label className={labelBase} htmlFor="data-orcamento">
                Data do orçamento
              </label>
              <input
                id="data-orcamento"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={inputBase}
              />
            </div>

            <button
              type="button"
              onClick={() => setMostrarOpcoesAvancadas((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm font-medium text-[var(--foreground)]"
              aria-expanded={mostrarOpcoesAvancadas}
            >
              <span>Mais opções (status, prazo)</span>
              <span className="text-[var(--muted)]">{mostrarOpcoesAvancadas ? "▲" : "▼"}</span>
            </button>

            {mostrarOpcoesAvancadas && (
              <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 sm:grid-cols-2">
                <div>
                  <label className={labelBase} htmlFor="tempo-estimado">
                    Prazo estimado (dias)
                  </label>
                  <input
                    id="tempo-estimado"
                    type="text"
                    inputMode="numeric"
                    value={tempoEstimado}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, "");
                      setTempoEstimado(v ? Number(v) : "");
                    }}
                    className={inputBase}
                    placeholder="Ex.: 15"
                  />
                </div>
                <div>
                  <label className={labelBase} htmlFor="status-orcamento">
                    Situação do orçamento
                  </label>
                  <select
                    id="status-orcamento"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as OrcamentoFull["status"])}
                    className={inputBase}
                  >
                    {(Object.keys(LABELS_STATUS) as OrcamentoFull["status"][]).map((s) => (
                      <option key={s} value={s}>
                        {LABELS_STATUS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Etapa 2 — Serviços */}
      {passo === 2 && (
        <section className={cardBase} aria-labelledby="etapa-servicos">
          <h2 id="etapa-servicos" className="text-xl font-semibold text-[var(--foreground)]">
            Quais serviços entram no orçamento?
          </h2>
          <p className={hintBase}>
            Busque no catálogo ou digite o nome. Depois informe quantidade e valor.
          </p>

          <div className="mt-6 space-y-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-elevated)]/60 p-4">
            <div>
              <label className={labelBase} htmlFor="servico-busca">
                Nome do serviço{requiredMark}
              </label>
              <AutocompleteCatalogo
                tipo="servico"
                busca={servicoBusca}
                onBuscaChange={(v) => {
                  setServicoBusca(v);
                  setServicoSelecionadoId(null);
                  setServicoAdicionarAoCatalogo(false);
                  if (!v.trim()) setServicoMedida("UNITARIO");
                }}
                selecionadoId={servicoSelecionadoId}
                onSelecionarCatalogo={(serv) => {
                  setServicoSelecionadoId(serv.id);
                  setServicoBusca(serv.descricao);
                  setServicoMedida(serv.tipo_cobranca);
                  setNovoServico((prev) => ({
                    ...prev,
                    valorMaoObra: String(serv.precoBase).replace(".", ","),
                  }));
                }}
                itens={[...servicos, ...sinapiServicos]}
                getItemNome={(s) => s.descricao}
                placeholder="Ex.: pintura, alvenaria..."
                id="servico-busca"
                mostrarOpcaoCadastrar={true}
                onSelecionarCadastrarNoCatalogo={(nome) => {
                  setServicoBusca(nome);
                  setServicoSelecionadoId(null);
                  setServicoAdicionarAoCatalogo(true);
                  setServicoMedida("UNITARIO");
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelBase} htmlFor="servico-medida">
                  Unidade de medida{requiredMark}
                </label>
                <select
                  id="servico-medida"
                  value={medidaServicoFormulario()}
                  onChange={(e) => setServicoMedida(e.target.value as TipoMedida)}
                  disabled={servicoCatalogoSelecionado}
                  aria-describedby={servicoCatalogoSelecionado ? "servico-medida-hint" : undefined}
                  className={`${inputBase} disabled:cursor-not-allowed disabled:bg-[var(--surface-elevated)] disabled:text-[var(--muted)]`}
                >
                  <option value="UNITARIO">Unitário</option>
                  <option value="M2">M²</option>
                  <option value="M3">M³</option>
                  <option value="METROS">Metros</option>
                </select>
              </div>
              <div>
                <label className={labelBase} htmlFor="servico-qtd">
                  Quantidade{requiredMark}
                </label>
                <input
                  id="servico-qtd"
                  type="text"
                  inputMode="decimal"
                  value={novoServico.quantidade}
                  onChange={(e) => {
                    let v = formatarDecimalEntrada(e.target.value);
                    const partes = v.split(",");
                    if (partes.length > 2) v = partes[0] + "," + partes.slice(1).join("");
                    setNovoServico({ ...novoServico, quantidade: v });
                  }}
                  className={inputBase}
                  placeholder="1"
                />
              </div>
              <div>
                <label className={labelBase} htmlFor="servico-valor">
                  Valor (mão de obra){requiredMark}
                </label>
                <input
                  id="servico-valor"
                  type="text"
                  inputMode="decimal"
                  value={novoServico.valorMaoObra}
                  onChange={(e) => {
                    const v = formatarDecimalEntrada(e.target.value);
                    setNovoServico({ ...novoServico, valorMaoObra: v });
                  }}
                  className={inputBase}
                  placeholder="0,00"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={adicionarServico}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-3.5 text-base font-semibold text-[var(--on-accent)] hover:opacity-90"
            >
              + Adicionar este serviço
            </button>
          </div>

          {servicosOrcamento.length > 0 ? (
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                Serviços no orçamento ({servicosOrcamento.length})
              </p>
              {listaServicosAdicionados}
              <p className="mt-4 text-right text-sm text-[var(--muted)]">
                Subtotal serviços:{" "}
                <span className="text-lg font-bold text-[var(--foreground)]">
                  {formatarPreco(totalServicos)}
                </span>
              </p>
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)]">
              Nenhum serviço adicionado ainda. Você precisa de pelo menos um para continuar.
            </p>
          )}
        </section>
      )}

      {/* Etapa 3 — Materiais (opcional) */}
      {passo === 3 && (
        <section className={cardBase} aria-labelledby="etapa-materiais">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="etapa-materiais" className="text-xl font-semibold text-[var(--foreground)]">
                Materiais (opcional)
              </h2>
              <p className={hintBase}>
                Só preencha se quiser detalhar materiais no orçamento. Pode pular esta etapa.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setPasso(4);
              }}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
            >
              Pular materiais →
            </button>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
            <input
              type="checkbox"
              checked={incluiMaterial}
              onChange={(e) => setIncluiMaterial(e.target.checked)}
              className="h-5 w-5 rounded border-[var(--border)] text-[var(--accent)]"
            />
            <span className="text-sm">
              <span className="font-semibold text-[var(--foreground)]">Somar materiais no valor total</span>
              <span className="mt-0.5 block text-[var(--muted)]">
                Desmarcado: materiais aparecem só como referência no PDF.
              </span>
            </span>
          </label>

          <div className="mt-5 space-y-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-elevated)]/60 p-4">
            <div>
              <label className={labelBase} htmlFor="material-busca">
                Material
              </label>
              <AutocompleteCatalogo
                tipo="material"
                busca={materialBusca}
                onBuscaChange={(v) => {
                  setMaterialBusca(v);
                  setMaterialSelecionadoId(null);
                  setMaterialAdicionarAoCatalogo(false);
                }}
                selecionadoId={materialSelecionadoId}
                onSelecionarCatalogo={(mat) => {
                  setMaterialSelecionadoId(mat.id);
                  setMaterialBusca(mat.nome_material);
                  setMaterialAdicionarAoCatalogo(false);
                  const isSinapi = mat.id < 0;
                  const codigo = (mat as { codigoSinapi?: string }).codigoSinapi;
                  setNovoMaterial((prev) => ({
                    ...prev,
                    medidaMaterial: (mat.unidadeMedida || "UNITARIO") as TipoMedida,
                    precoUnitario: String(mat.precoUnitario).replace(".", ","),
                    origemMaterial: isSinapi && codigo ? `SINAPI MG - ${codigo}` : prev.origemMaterial,
                  }));
                }}
                onSelecionarCadastrarNoCatalogo={(nome) => {
                  setMaterialBusca(nome);
                  setMaterialAdicionarAoCatalogo(true);
                  setMaterialSelecionadoId(null);
                }}
                itens={[...materiais, ...sinapiMateriais]}
                getItemNome={(m) => m.nome_material}
                placeholder="Buscar material..."
                id="material-busca"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelBase} htmlFor="material-qtd">
                  Quantidade
                </label>
                <input
                  id="material-qtd"
                  type="text"
                  inputMode="numeric"
                  value={novoMaterial.quantidade}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    setNovoMaterial({ ...novoMaterial, quantidade: v });
                  }}
                  className={inputBase}
                  placeholder="1"
                />
              </div>
              <div>
                <label className={labelBase} htmlFor="material-preco">
                  Preço unitário
                </label>
                <input
                  id="material-preco"
                  type="text"
                  inputMode="decimal"
                  value={novoMaterial.precoUnitario}
                  onChange={(e) => {
                    const v = formatarDecimalEntrada(e.target.value);
                    setNovoMaterial({ ...novoMaterial, precoUnitario: v });
                  }}
                  className={inputBase}
                  placeholder="0,00"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMostrarDetalhesMaterial((v) => !v)}
              className="text-sm font-medium text-[var(--accent)] hover:underline"
              aria-expanded={mostrarDetalhesMaterial}
            >
              {mostrarDetalhesMaterial ? "Ocultar detalhes" : "Mostrar medida e origem (opcional)"}
            </button>

            {mostrarDetalhesMaterial && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelBase} htmlFor="material-medida">
                    Unidade de medida
                  </label>
                  <select
                    id="material-medida"
                    value={novoMaterial.medidaMaterial}
                    onChange={(e) =>
                      setNovoMaterial({
                        ...novoMaterial,
                        medidaMaterial: e.target.value as TipoMedida,
                      })
                    }
                    className={inputBase}
                  >
                    {(Object.keys(LABELS_MEDIDA) as TipoMedida[]).map((m) => (
                      <option key={m} value={m}>
                        {LABELS_MEDIDA[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelBase} htmlFor="material-origem">
                    Origem / fornecedor
                  </label>
                  <input
                    id="material-origem"
                    type="text"
                    value={novoMaterial.origemMaterial}
                    onChange={(e) =>
                      setNovoMaterial({ ...novoMaterial, origemMaterial: e.target.value })
                    }
                    className={inputBase}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={adicionarMaterial}
              className="w-full rounded-xl bg-[var(--accent)] px-4 py-3.5 text-base font-semibold text-[var(--on-accent)] hover:opacity-90"
            >
              + Adicionar este material
            </button>
          </div>

          {listaMateriaisAdicionados && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
                Materiais no orçamento ({materiaisOrcamento.length})
              </p>
              {listaMateriaisAdicionados}
            </div>
          )}
        </section>
      )}

      {/* Etapa 4 — Revisar */}
      {passo === 4 && (
        <section className="space-y-4" aria-labelledby="etapa-revisar">
          <div className={cardBase}>
            <h2 id="etapa-revisar" className="text-xl font-semibold text-[var(--foreground)]">
              Revise antes de salvar
            </h2>
            <p className={hintBase}>Confira se está tudo certo. Você pode voltar e corrigir qualquer etapa.</p>

            <dl className="mt-6 divide-y divide-[var(--border)]">
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-sm text-[var(--muted)]">Cliente</dt>
                <dd className="text-right text-sm font-medium text-[var(--foreground)]">{clienteBusca || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-sm text-[var(--muted)]">Endereço</dt>
                <dd className="max-w-[60%] text-right text-sm font-medium text-[var(--foreground)]">
                  {endereco || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-sm text-[var(--muted)]">Data</dt>
                <dd className="text-sm font-medium text-[var(--foreground)]">
                  {new Date(data + "T12:00:00").toLocaleDateString("pt-BR")}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-3">
                <dt className="text-sm text-[var(--muted)]">Situação</dt>
                <dd className="text-sm font-medium text-[var(--foreground)]">{LABELS_STATUS[status]}</dd>
              </div>
            </dl>
          </div>

          <div className={cardBase}>
            <h3 className="font-semibold text-[var(--foreground)]">
              Serviços ({servicosOrcamento.length})
            </h3>
            <div className="mt-3">{listaServicosAdicionados}</div>
          </div>

          {materiaisOrcamento.length > 0 && (
            <div className={cardBase}>
              <h3 className="font-semibold text-[var(--foreground)]">
                Materiais ({materiaisOrcamento.length})
                {!incluiMaterial && (
                  <span className="ml-2 text-xs font-normal text-[var(--muted)]">(não somados no total)</span>
                )}
              </h3>
              <div className="mt-3">{listaMateriaisAdicionados}</div>
            </div>
          )}

          <div className={cardBase}>
            <h3 className="font-semibold text-[var(--foreground)]">Observações para o PDF (opcional)</h3>
            <p className={hintBase}>Condições de pagamento, garantias ou outras informações.</p>
            <div className="mt-3">
              <RichTextEditor value={complemento} onChange={setComplemento} />
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[var(--accent)]/30 bg-[var(--accent-soft)] p-5 text-center">
            <p className="text-sm text-[var(--muted)]">Valor total do orçamento</p>
            <p className="mt-1 text-3xl font-bold text-[var(--accent)]">{formatarPreco(valorTotalExibido)}</p>
            {incluiMaterial && materiaisOrcamento.length > 0 && (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Serviços: {formatarPreco(totalServicos)} + Materiais: {formatarPreco(totalMateriaisLista)}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Barra fixa de navegação */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {passo > 1 ? (
            <button
              type="button"
              onClick={voltarPasso}
              className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
            >
              Voltar
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
            >
              Cancelar
            </button>
          )}

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-xs text-[var(--muted)]">Total parcial</p>
            <p className="text-lg font-bold text-[var(--foreground)]">{formatarPreco(valorTotalExibido)}</p>
          </div>

          {passo < 4 ? (
            <button
              type="button"
              onClick={avancarPasso}
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--on-accent)] hover:opacity-90"
            >
              Continuar
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--on-accent)] hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Salvando…" : isEdit ? "Salvar" : "Criar orçamento"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
