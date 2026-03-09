# Tabelas SINAPI

Coloque os arquivos CSV da SINAPI nesta pasta com os nomes exatos:

- **insumos-isd.csv** — Copie "SINAPI - Insumos - ISD.csv" (na raiz do projeto) e renomeie
- **servicos-csd.csv** — Copie "SINAPI - Serviços - CSD.csv" (na raiz do projeto) e renomeie

**Importante:** não altere o conteúdo dos CSVs (descrições, códigos, preços ou unidades). O sistema faz apenas o mapeamento de unidades para UNITÁRIO/M².

Formato esperado:
- **Insumos:** Classificação, Código, Descrição, Unidade, Origem de Preço, Preço (MG). Só MATERIAL e ESPECIAIS.
- **Serviços:** Grupo, Código, Descrição, Unidade, Custo (R$). Linhas com custo "-" são ignoradas.
