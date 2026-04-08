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
import { calcularValorTotal } from "@/lib/orcamento";

export type { OrcamentoFull };

type Props = {
  initialData: OrcamentoFull | null;
  onSuccess: (id: number, opts?: { abrirPdfRecebimento?: boolean }) => void;
  onCancel: () => void;
};

export function OrcamentoForm({ initialData, onSuccess, onCancel }: Props) {
  const isEdit = !!initialData;

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

  const [sinapiMateriais, setSinapiMateriais] = useState<Material[]>([]);
  const [sinapiServicos, setSinapiServicos] = useState<Servico[]>([]);

  const CHAVE_SINAPI = "sinapi_mg_campos_vertentes_ativo";

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

    if (servicoBusca.trim() && !servicoSelecionadoId) {
      if (servicoAdicionarAoCatalogo) {
        try {
          const resposta = await fetch("/api/servicos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              descricao: servicoBusca.trim(),
              tipo_cobranca: "UNITARIO",
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
            quantidade,
            valorMaoObra,
          },
        ]);
      }
      setNovoServico({ servicoId: "" as number | "", quantidade: "", valorMaoObra: "" });
      setServicoBusca("");
      setServicoSelecionadoId(null);
      setServicoAdicionarAoCatalogo(false);
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
          quantidade,
          valorMaoObra,
        },
      ]);
      let materiaisParaAcrescentar: MaterialOrcamento[] = [];
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
      return;
    }
    if (!endereco.trim()) {
      setError("Endereço é obrigatório");
      return;
    }
    if (servicosOrcamento.length === 0) {
      setError("Adicione pelo menos um serviço ao orçamento");
      return;
    }
    const pdfWindow = !isEdit ? window.open("about:blank", "_blank") : null;

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
        await fetch(`/api/orcamentos/${orcamentoId}/materiais`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mat),
        });
      }
      for (const serv of servicosOrcamento) {
        await fetch(`/api/orcamentos/${orcamentoId}/servicos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serv),
        });
      }

      if (pdfWindow) pdfWindow.location.href = `/api/orcamentos/${orcamentoId}/pdf`;
      onSuccess(orcamentoId);
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Carregando…</p>;
  }

  const inputBase = "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]";
  const labelBase = "mb-1 block text-sm font-medium text-[var(--muted)]";

  return (
    <form onSubmit={salvar} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-[var(--danger)]/50 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Dados do Orçamento</h2>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelBase}>Cliente *</label>
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
                placeholder="Digite as iniciais ou clique na caixa"
              />
              <Link href="/clientes" className="mt-2 inline-block text-xs text-[var(--accent)] hover:underline">
                Cliente não cadastrado? Clique aqui para cadastrar.
              </Link>
            </div>
            <div>
              <label className={labelBase}>Endereço *</label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className={inputBase}
                placeholder="Endereço completo e/ou cidade e estado"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4 rounded-lg bg-[var(--surface-elevated)] px-4 py-3">
            <div className="min-w-[7rem]">
              <label className={labelBase}>Data</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={inputBase}
              />
            </div>
            <div className="min-w-[5.5rem]">
              <label className={labelBase}>Tempo est. (dias)</label>
              <input
                type="text"
                inputMode="numeric"
                value={tempoEstimado}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  setTempoEstimado(v ? Number(v) : "");
                }}
                className={inputBase}
                placeholder="–"
              />
            </div>
            <div className="min-w-[10rem] flex-1">
              <label className={labelBase}>Status</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as OrcamentoFull["status"])
                }
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
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Materiais</h2>
            <p className="text-sm text-[var(--muted)]">Materiais que compõem os serviços (opcional)</p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2">
            <input
              type="checkbox"
              id="incluiMaterial"
              checked={incluiMaterial}
              onChange={(e) => setIncluiMaterial(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
            />
            <span className="text-sm font-medium">Incluir materiais no valor total</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-12">
          <div className="col-span-2 sm:col-span-2 lg:col-span-3">
            <label className={labelBase}>Material</label>
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
                  precoUnitario: String(mat.precoUnitario),
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
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <label className={labelBase}>Medida</label>
            <select
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
                <option key={m} value={m}>{LABELS_MEDIDA[m]}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <label className={labelBase}>Origem</label>
            <input
              type="text"
              value={novoMaterial.origemMaterial}
              onChange={(e) =>
                setNovoMaterial({ ...novoMaterial, origemMaterial: e.target.value })
              }
              className={inputBase}
              placeholder=" "
            />
          </div>
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <label className={labelBase}>Quantidade *</label>
            <input
              type="text"
              inputMode="numeric"
              value={novoMaterial.quantidade}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, "");
                setNovoMaterial({ ...novoMaterial, quantidade: v });
              }}
              className={inputBase}
              placeholder=" "
            />
          </div>
          <div className="col-span-2 sm:col-span-1 lg:col-span-2">
            <label className={labelBase}>Preço unit. *</label>
            <input
              type="text"
              inputMode="decimal"
              value={novoMaterial.precoUnitario}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9,.]/g, "").replace(",", ".");
                setNovoMaterial({ ...novoMaterial, precoUnitario: v });
              }}
              className={`${inputBase} min-w-[5rem]`}
              placeholder="0,00"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col justify-end">
            <label className={labelBase}>Total</label>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
              R$ {materiaisOrcamento.length > 0 && incluiMaterial
                ? materiaisOrcamento.reduce((s, m) => s + m.quantidade * m.precoUnitario, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "0,00"}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={adicionarMaterial}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90"
          >
            Adicionar Material
          </button>
        </div>
        {materiaisOrcamento.length > 0 && (
          <div className="mt-4 space-y-2">
            {materiaisOrcamento.map((mat, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3"
              >
                <div className="flex-1">
                  <span className="font-medium text-[var(--foreground)]">
                    {mat.material?.nome_material || mat.origemMaterial || "Material personalizado"}
                  </span>
                  <span className="ml-2 text-sm text-[var(--muted)]">
                    {mat.quantidade} {mat.medidaMaterial || "un"} × R${" "}
                    {mat.precoUnitario.toFixed(2)} = R${" "}
                    {(mat.quantidade * mat.precoUnitario).toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removerMaterial(idx)}
                  className="ml-4 text-sm text-[var(--danger)] hover:opacity-80"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Serviços *</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Utilize serviços catalogados ou adicione um escrevendo e preenchendo as informações. Lembre-se de preencher o valor unitário da mão de obra.
        </p>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-12">
          <div className="sm:col-span-6 lg:col-span-5">
            <label className={labelBase}>Serviço</label>
            <AutocompleteCatalogo
              tipo="servico"
              busca={servicoBusca}
              onBuscaChange={(v) => {
                setServicoBusca(v);
                setServicoSelecionadoId(null);
                setServicoAdicionarAoCatalogo(false);
              }}
              selecionadoId={servicoSelecionadoId}
              onSelecionarCatalogo={(serv) => {
                setServicoSelecionadoId(serv.id);
                setServicoBusca(serv.descricao);
                setNovoServico((prev) => ({
                  ...prev,
                  valorMaoObra: String(serv.precoBase),
                }));
              }}
              itens={[...servicos, ...sinapiServicos]}
              getItemNome={(s) => s.descricao}
              placeholder="Buscar serviços..."
              id="servico-busca"
              mostrarOpcaoCadastrar={true}
              onSelecionarCadastrarNoCatalogo={(nome) => {
                setServicoBusca(nome);
                setServicoSelecionadoId(null);
                setServicoAdicionarAoCatalogo(true);
              }}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label className={labelBase}>Quantidade *</label>
            <input
              type="text"
              inputMode="decimal"
              value={novoServico.quantidade}
              onChange={(e) => {
                let v = e.target.value.replace(/[^0-9,.]/g, "").replace(",", ".");
                const partes = v.split(".");
                if (partes.length > 2) v = partes[0] + "." + partes.slice(1).join("");
                setNovoServico({ ...novoServico, quantidade: v });
              }}
              className={inputBase}
              placeholder=" "
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label className={labelBase}>Valor mão de obra *</label>
            <input
              type="text"
              inputMode="decimal"
              value={novoServico.valorMaoObra}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9,.]/g, "").replace(",", ".");
                setNovoServico({ ...novoServico, valorMaoObra: v });
              }}
              className={`${inputBase} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              placeholder="0,00"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1 flex flex-col justify-end">
            <label className={labelBase}>Total serviços</label>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm font-medium text-[var(--foreground)]">
              R$ {servicosOrcamento.length > 0
                ? servicosOrcamento.reduce((s, srv) => s + srv.quantidade * srv.valorMaoObra, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "0,00"}
            </div>
          </div>
        </div>

        <details className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
          <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">Complemento do orçamento (opcional)</summary>
          <p className="mt-2 text-xs text-[var(--muted)]">Use para observações, condições e detalhes adicionais que irão para o PDF.</p>
          <div className="mt-3">
            <RichTextEditor value={complemento} onChange={setComplemento} />
          </div>
        </details>

        <button
          type="button"
          onClick={adicionarServico}
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90"
        >
          Adicionar Serviço
        </button>
        {servicosOrcamento.length > 0 && (
          <div className="mt-4 space-y-2">
            {servicosOrcamento.map((serv, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-3 ${
                  serv.servicoId
                    ? "border-[var(--border)] bg-[var(--surface-elevated)]"
                    : "border-[var(--warning)]/40 bg-[var(--warning)]/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-[var(--foreground)]">
                      {serv.servico?.descricao ||
                        (serv.descricaoLivre
                          ? serv.descricaoLivre
                              .replace(/<[^>]*>/g, " ")
                              .replace(/\s+/g, " ")
                              .trim()
                              .slice(0, 80) || ""
                          : "") || "Serviço"}
                    </div>
                    <div className="mt-1 text-sm text-[var(--muted)]">
                      {serv.quantidade} × R$ {serv.valorMaoObra.toFixed(2)} = R${" "}
                      {(serv.quantidade * serv.valorMaoObra).toFixed(2)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerServico(idx)}
                    className="ml-4 text-sm text-[var(--danger)] hover:opacity-80"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--accent)] px-6 py-2 text-sm font-medium text-[var(--on-accent)] hover:opacity-90 disabled:opacity-50"
        >
          {isEdit
            ? saving ? "Salvando…" : "Atualizar Orçamento"
            : saving ? "Salvando…" : "Criar Orçamento"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--border)] px-6 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
