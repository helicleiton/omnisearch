# OmniSearch

App mobile de verificação de exposição de dados (vazamentos, dados cadastrais públicos e ocorrências públicas).
O usuário digita um **e-mail, CPF, CNPJ, telefone ou nome completo**. O backend valida e detecta o tipo, consulta os provedores (simulados por padrão) e devolve um resultado consolidado e **mascarado**.

**Versão web (gratuita, sem servidor):** https://helicleiton.github.io/omnisearch/

## Dois modos de funcionamento

| Modo | Quando | De onde vêm os dados | Custo |
|---|---|---|---|
| **Fontes abertas** (padrão) | `EXPO_PUBLIC_API_URL` vazio no app | O próprio app consulta APIs públicas e gratuitas: XposedOrNot (vazamentos de e-mail), DNS do Google (MX), BrasilAPI (CNPJ e DDD), plano de numeração da Anatel e cálculo do dígito do CPF | Zero (é assim que roda no GitHub Pages) |
| **Com backend** | `EXPO_PUBLIC_API_URL` apontando para o servidor | O backend Node, com rate limit, chaves pagas opcionais (HIBP, NumVerify, Escavador) e busca por nome | Hospedagem do servidor |

No modo fontes abertas, a busca por **nome** fica desativada (não há fonte gratuita confiável), e o CPF mostra só validação e região fiscal. Os dados cadastrais de CPF exigem um serviço pago e base legal na LGPD.

A lógica de domínio (validação, detecção, máscaras e clientes das fontes abertas) fica em `backend/src/core/`, sem dependências de Node, e é **compartilhada** pelo backend e pelo app (ver `mobile/metro.config.js`).

| Camada  | Stack |
|---------|-------|
| Mobile  | Expo SDK 58 · React Native 0.88 · TypeScript · React Native Paper (MD3) |
| Backend | Node 20+ · Express 5 · TypeScript · Zod · helmet · express-rate-limit |

## Estrutura

```
OMNISEARCH/
├── backend/
│   ├── .env.example                 # todas as variáveis, incluindo as chaves dos provedores
│   └── src/
│       ├── server.ts                # bootstrap (listen)
│       ├── app.ts                   # helmet, CORS, JSON 10kb, rate limit global, rotas
│       ├── config/env.ts            # leitura e validação do .env com Zod (falha rápido se inválido)
│       ├── routes/search.routes.ts  # POST /api/v1/search
│       ├── controllers/searchController.ts
│       ├── middlewares/
│       │   ├── validateSearch.ts    # schema Zod + detecção automática + normalização
│       │   ├── rateLimiter.ts       # limite global e limite específico da busca
│       │   ├── apiKey.ts            # header x-api-key opcional
│       │   └── errorHandler.ts      # formato padronizado { success:false, error:{code,message} }
│       ├── services/                # regras de negócio por tipo (mock ou provedor real)
│       │   ├── searchService.ts     # orquestrador: escolhe o serviço, calcula o status, mascara
│       │   ├── emailService.ts  documentService.ts  phoneService.ts  nameService.ts
│       ├── providers/               # clientes HTTP das APIs externas
│       │   ├── hibp.provider.ts  numverify.provider.ts  escavador.provider.ts  (pagos, opcionais)
│       ├── core/                    # lógica pura compartilhada com o app: validação, mocks e fontes abertas
│       ├── utils/                   # detectType, documents (DV de CPF/CNPJ), phone (DDD→UF), mask, score, http
│       └── types/search.types.ts    # contratos de Request/Response
└── mobile/
    ├── App.tsx                      # providers (SafeArea, Paper, ícones)
    ├── .env.example                 # EXPO_PUBLIC_API_URL
    └── src/
        ├── screens/HomeScreen.tsx   # formulário + resultado
        ├── components/ResultCard.tsx  SearchTypeSelector.tsx
        ├── hooks/useSearch.ts       # estado idle/loading/success/error + cancelamento
        ├── services/api.ts          # fetch com timeout e erros tipados (ApiError)
        ├── types/api.ts             # cópia dos contratos do backend
        ├── utils/searchTypes.ts     # opções do seletor + palpite de tipo enquanto digita
        ├── config/env.ts  theme/theme.ts
```

## Como rodar

**Backend**

```bash
cd backend && npm install && npm run dev
```

O `.env` já foi criado a partir do `.env.example` com `USE_MOCKS=true`. API em `http://localhost:3333/api/v1`.

**Mobile**

```bash
cd mobile && npx expo start
```

Por padrão o app roda no modo fontes abertas e não precisa do backend. Para usar o backend, preencha `EXPO_PUBLIC_API_URL` em `mobile/.env`: `http://10.0.2.2:3333` no emulador Android, ou `http://<IP-da-máquina>:3333` num celular físico (na mesma rede Wi-Fi).

**Publicação web:** cada push na branch `main` dispara `.github/workflows/deploy-pages.yml`, que exporta a versão web e publica no GitHub Pages.

## API

`POST /api/v1/search`

```json
{ "query": "529.982.247-25", "type": "auto" }
```

`type`: `auto` (padrão) · `email` · `cpf` · `cnpj` · `phone` · `name`

Sucesso (200):

```json
{
  "success": true,
  "data": {
    "requestId": "9c57b614-…",
    "type": "cpf",
    "autoDetected": true,
    "maskedQuery": "***.982.247-**",
    "found": true,
    "status": "alert",
    "exposureScore": 70,
    "summary": "CPF com situação \"SUSPENSA\" na Receita Federal…",
    "sections": [{ "title": "Dados cadastrais", "items": [{ "label": "Região fiscal de emissão", "value": "ES, RJ" }] }],
    "details": { "kind": "cpf", "validChecksum": true, "fiscalRegion": "ES, RJ", "holderName": "Maria F******* A****", "registrationStatus": "SUSPENSA" },
    "sources": ["Simulação (mock)"],
    "isMock": true,
    "searchedAt": "2026-10-17T15:00:48.847Z",
    "disclaimer": "…LGPD…"
  }
}
```

Erro: `{ "success": false, "error": { "code": "INVALID_INPUT", "message": "…", "fields": { "query": ["…"] } } }`.
Códigos possíveis: `INVALID_INPUT` (422/400) · `NOT_FOUND` (404) · `RATE_LIMITED` (429) · `UNAUTHORIZED` (401) · `UPSTREAM_ERROR` (502/503) · `INTERNAL_ERROR` (500).

- `sections` vem pronto para exibição: o app renderiza qualquer tipo sem lógica específica.
- `details` é uma união discriminada por `kind`, para quem precisar dos campos tipados.
- Status pelo score: 0–29 `safe` · 30–64 `attention` · 65–100 `alert`.

### Detecção automática

| Entrada | Tipo |
|---|---|
| contém `@` | e-mail |
| `000.000.000-00` ou 11 dígitos com dígito verificador válido | CPF |
| `00.000.000/0000-00` ou 14 dígitos válidos | CNPJ |
| `(11) 9…`, `+55…`, ou 10/11 dígitos com DDD válido | telefone |
| 2+ palavras só com letras | nome |

11 dígitos sem formatação podem ser CPF ou celular: o dígito verificador do CPF decide. Para forçar um tipo, escolha-o no seletor.

## Conectando APIs reais

1. Em `backend/.env`, defina `USE_MOCKS=false`.
2. Preencha a chave de cada provedor. **Um provedor sem chave continua no mock**, então dá para ativar um de cada vez.

| Tipo | Provedor | Variável | Arquivo |
|---|---|---|---|
| E-mail | [XposedOrNot](https://xposedornot.com/api_doc) (grátis, padrão) | nenhuma | `core/open/xposedornot.ts` |
| E-mail | [Have I Been Pwned](https://haveibeenpwned.com/API/v3) (pago, substitui o XposedOrNot) | `HIBP_API_KEY` | `providers/hibp.provider.ts` |
| CNPJ | [BrasilAPI](https://brasilapi.com.br/docs#tag/CNPJ) (grátis, sem chave) · ReceitaWS | `CNPJ_PROVIDER_URL` | `core/open/brasilapi.ts` |
| Telefone | BrasilAPI DDD (grátis) + [NumVerify](https://numverify.com/documentation) para operadora (pago) | `NUMVERIFY_API_KEY` | `core/open/brasilapi.ts`, `providers/numverify.provider.ts` |
| Nome | [Escavador](https://api.escavador.com/v2/docs) (pago, por crédito) | `ESCAVADOR_API_TOKEN` | `providers/escavador.provider.ts` |
| CPF | Serpro Consulta CPF (contrato) | adicionar em `config/env.ts` | ver comentário em `services/documentService.ts` |

Para adicionar um provedor: crie o cliente em `providers/` usando `fetchJson` (que já cuida de timeout, User-Agent e erros), declare a variável no schema de `config/env.ts` e chame o cliente no serviço correspondente.

## Segurança e privacidade

- As chaves ficam só no backend (`.env` está no `.gitignore`). Variáveis `EXPO_PUBLIC_*` são embutidas no app, então nunca devem conter segredos.
- O valor pesquisado **nunca é devolvido em claro** (`maskedQuery`), e os logs registram só a versão mascarada. O body da requisição nunca é logado.
- Rate limit: um limite global e outro mais restrito para `/search` (`RATE_LIMIT_MAX` por `RATE_LIMIT_WINDOW_MS`).
- helmet, body limitado a 10kb, schema `strict` (rejeita campos extras) e CORS com allowlist.
- **LGPD:** CPF, telefone e nome são dados pessoais. Antes de ligar provedores reais para esses tipos, defina a base legal (art. 7º), exija login e registre quem consultou o quê. O `x-api-key` opcional não substitui autenticação de usuário.
