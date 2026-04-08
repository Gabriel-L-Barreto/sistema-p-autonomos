# Fundamentação Teórica do Sistema de Orçamentos

## 1. Introdução

Este capítulo apresenta a fundamentação teórica do Sistema de Orçamentos desenvolvido para apoiar processos de cadastro, composição e acompanhamento de orçamentos de serviços e materiais. O objetivo é contextualizar os principais conceitos de sistemas web, arquitetura de software e tecnologias adotadas, justificando tecnicamente as escolhas que sustentam a solução.

## 2. Conceitos Fundamentais

### 2.1 Sistema Web

Um sistema web é uma aplicação acessada por navegador, construída sobre protocolos da internet (especialmente HTTP/HTTPS), na qual as funcionalidades de negócio ficam centralizadas em servidores. Esse modelo reduz dependências de instalação local, facilita atualização contínua e permite acesso remoto controlado.

No contexto deste trabalho, o sistema web oferece:

- interface de uso para cadastro de clientes, materiais, serviços e orçamentos;
- APIs para operações de criação, leitura, atualização e exclusão de dados;
- integração entre camada de apresentação, regra de negócio e persistência.

### 2.2 Arquitetura Cliente-Servidor

A arquitetura cliente-servidor separa responsabilidades entre:

- **cliente (frontend)**: responsável pela interação com o usuário;
- **servidor (backend)**: responsável por validações, regras de negócio e acesso ao banco de dados.

Essa separação favorece manutenção, escalabilidade e evolução incremental do sistema, além de melhorar a organização do código.

### 2.3 APIs Web e Modelo REST

A comunicação entre frontend e backend ocorre por rotas HTTP, organizadas em endpoints com verbos como `GET`, `POST`, `PUT` e `DELETE`. Esse padrão, alinhado a princípios REST, melhora previsibilidade da integração e reduz acoplamento entre interface e persistência.

No sistema, as APIs atendem domínios como clientes, materiais, serviços, orçamentos, pagamentos e geração de documentos PDF.

### 2.4 Persistência Relacional e Integridade de Dados

Bancos relacionais são apropriados quando o domínio contém entidades interdependentes e necessidade de consistência transacional. No sistema desenvolvido, as relações entre orçamento, serviços, materiais e pagamentos exigem integridade referencial, histórico de estados e consultas estruturadas.

### 2.5 Segurança de Entrada e Confiabilidade

Aplicações web orientadas a dados precisam tratar entradas de usuário com validação e sanitização para evitar inconsistências e riscos como injeções de conteúdo malicioso. A validação de tipo, obrigatoriedade e limpeza de campos textuais aumenta robustez funcional e segurança operacional.

## 3. Arquitetura do Sistema Implementado

### 3.1 Visão Geral

O sistema adota arquitetura em camadas, com execução full-stack no ecossistema JavaScript/TypeScript:

- **camada de apresentação**: páginas e componentes React;
- **camada de aplicação**: rotas de API e regras de negócio;
- **camada de dados**: Prisma ORM sobre PostgreSQL.

### 3.2 Padrão de Organização

O projeto utiliza estrutura modular:

- diretório `app/` para páginas e rotas de API;
- diretório `components/` para componentes reutilizáveis;
- diretório `lib/` para utilitários, regras de domínio e integrações;
- diretório `prisma/` para schema e operações de banco.

Essa organização reduz duplicidade, facilita testes e melhora legibilidade para manutenção acadêmica e profissional.

### 3.3 Modelo de Domínio

As entidades principais do sistema são:

- `Cliente`
- `Material`
- `Servico`
- `Orcamento`
- `MaterialOrcamento`
- `ServicoOrcamento`
- `ServicoMaterial`
- `Pagamento`
- `EmpresaConfig`
- `OrcamentoStatusHistorico`

Esse modelo permite representar tanto catálogos base quanto itens personalizados no orçamento, além de controlar evolução de status e recebimentos.

## 4. Tecnologias Utilizadas

### 4.1 Stack Principal

- **Next.js**: framework web para construção da aplicação full-stack, com App Router, renderização otimizada e suporte nativo a rotas de API.
- **React**: biblioteca de interface para construção declarativa de componentes.
- **TypeScript**: tipagem estática para maior segurança no desenvolvimento e menor incidência de erros em tempo de execução.
- **PostgreSQL**: sistema gerenciador de banco relacional utilizado como base de dados principal.
- **Prisma ORM**: camada de acesso a dados com tipagem forte e mapeamento objeto-relacional.

### 4.2 Estilo e Qualidade de Código

- **Tailwind CSS**: framework utilitário para estilização consistente e produtiva.
- **ESLint** e **eslint-config-next**: padronização e inspeção estática de qualidade de código.

### 4.3 Bibliotecas de Regra de Negócio e Documentos

- **pdfkit**: geração programática de documentos PDF (orçamentos e recebimentos).
- **extenso**: conversão de valores numéricos para texto por extenso em português, útil para documentos formais.

## 5. Bibliotecas Relevantes e Impacto Técnico

### 5.1 Next.js

Alto impacto por integrar frontend e backend em uma única base, reduzindo fricção arquitetural, tempo de entrega e custo de manutenção. O suporte a rotas de API no mesmo projeto acelera desenvolvimento de sistemas corporativos de pequeno e médio porte.

### 5.2 Prisma (`@prisma/client` + `prisma`)

Alto impacto por elevar confiabilidade da camada de dados via tipagem e mapeamento explícito do schema. Reduz erros de consulta, melhora rastreabilidade de mudanças no banco e facilita evolução do domínio.

### 5.3 PostgreSQL

Alto impacto por oferecer consistência transacional, maturidade e recursos robustos para dados relacionais. É adequado para domínios com múltiplas relações e necessidade de integridade.

### 5.4 React + TypeScript

Alto impacto na produtividade e qualidade: React favorece reutilização de componentes; TypeScript reduz falhas por incompatibilidade de dados entre camadas.

### 5.5 PDFKit

Alto impacto funcional por viabilizar emissão de documentos oficiais dentro do fluxo da aplicação, eliminando processos manuais e aumentando padronização dos registros.

## 6. Arquitetura Técnica Aplicada no Projeto

O sistema utiliza um modelo monolítico modular full-stack:

- **Frontend**: páginas de navegação e formulários de cadastro/orçamento;
- **Backend**: endpoints responsáveis por validação, processamento e persistência;
- **Dados**: PostgreSQL com schema relacional e histórico de status.

A escolha do monólito modular é adequada ao escopo do TCC porque simplifica implantação e observabilidade sem abrir mão de separação lógica por contexto de domínio.

## 7. Considerações sobre Escalabilidade e Manutenibilidade

As decisões adotadas contribuem para evolução futura do sistema:

- tipagem fim a fim reduz dívida técnica;
- separação por domínio facilita inclusão de novos módulos;
- APIs padronizadas permitem integração com outros sistemas;
- uso de ORM e schema explícito favorece governança de dados.

## 8. Referências Técnicas Sugeridas (Base Conceitual)

- Fielding, R. T. *Architectural Styles and the Design of Network-based Software Architectures* (REST).
- Bass, L.; Clements, P.; Kazman, R. *Software Architecture in Practice*.
- Sommerville, I. *Engenharia de Software*.
- Pressman, R. S.; Maxim, B. R. *Engenharia de Software: Uma Abordagem Profissional*.
- Documentação oficial do Next.js: [https://nextjs.org/docs](https://nextjs.org/docs)
- Documentação oficial do Prisma: [https://www.prisma.io/docs](https://www.prisma.io/docs)
- Documentação oficial do PostgreSQL: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- Documentação do PDFKit: [https://pdfkit.org/](https://pdfkit.org/)

## 9. Quadro-Resumo das Tecnologias do Sistema

| Camada | Tecnologia | Finalidade |
|---|---|---|
| Interface | React + Next.js | Páginas, componentes e navegação |
| API | Next.js Route Handlers | Endpoints HTTP para operações do sistema |
| Regra de negócio | TypeScript (`lib/`) | Cálculos, validações e utilitários |
| Persistência | Prisma ORM | Acesso tipado ao banco |
| Banco de dados | PostgreSQL | Armazenamento relacional |
| Documentos | PDFKit + extenso | Emissão de PDFs e valor por extenso |
| Qualidade | ESLint | Padronização e verificação estática |
| Estilo | Tailwind CSS | Interface visual responsiva e consistente |

