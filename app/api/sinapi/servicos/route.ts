import { NextResponse } from "next/server";
import { carregarServicosSinapi } from "@/lib/sinapi";

export async function GET() {
  try {
    const servicos = carregarServicosSinapi();
    return NextResponse.json(servicos);
  } catch (error) {
    console.error("Erro ao carregar serviços SINAPI:", error);
    return NextResponse.json(
      { error: "Erro ao carregar tabela SINAPI de serviços" },
      { status: 500 }
    );
  }
}
