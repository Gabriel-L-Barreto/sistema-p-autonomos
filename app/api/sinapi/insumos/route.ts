import { NextResponse } from "next/server";
import { carregarInsumosSinapi } from "@/lib/sinapi";

export async function GET() {
  try {
    const insumos = carregarInsumosSinapi();
    return NextResponse.json(insumos);
  } catch (error) {
    console.error("Erro ao carregar insumos SINAPI:", error);
    return NextResponse.json(
      { error: "Erro ao carregar tabela SINAPI de insumos" },
      { status: 500 }
    );
  }
}
