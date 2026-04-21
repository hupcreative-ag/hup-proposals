# HUP Proposals — Guia para o Claude

Este arquivo descreve tudo que o Claude precisa saber para trabalhar neste projeto de forma autônoma: criar novas propostas, ajustar conteúdo, fazer deploy e criar novos tipos de página.

---

## Visão geral do projeto

Sistema de propostas comerciais da HUP Creative. Cada cliente recebe uma URL única com token para acessar a proposta.

- **URL de produção:** `https://proposta.hup.com.br/:slug?token=<token>`
- **Deploy:** EasyPanel via webhook (`cat .deploy-webhook`) — sempre requer `git push` antes
- **Stack:** Node.js + Express + EJS
- **WhatsApp do Jose:** +5571993386304

---

## Estrutura de arquivos

```
proposals/          → um .json por cliente (dados da proposta)
views/
  proposal.ejs          → template: Gestão de Redes Sociais
  proposal-branding.ejs → template: Branding e Criação
assets/             → imagens do portfólio (sincronizadas separadamente via deploy-assets.sh)
server.js           → rotas; seleciona a view baseado em proposal.type
CLAUDE.md           → este arquivo
hup-base.md         → identidade e conteúdo base da HUP
```

---

## Como criar uma nova proposta

### 1. Criar o arquivo JSON em `proposals/<slug>.json`

O `slug` vira a URL: `/neurobiota` → `proposals/neurobiota.json`

**Escolha o tipo:**

| `type`      | View usada              | Quando usar                          |
|-------------|-------------------------|--------------------------------------|
| `branding`  | `proposal-branding.ejs` | Identidade visual, criação de marca  |
| *(ausente)* | `proposal.ejs`          | Gestão de redes sociais, pacotes mensais |

---

### Esquema JSON — tipo `branding`

```json
{
  "slug": "nome-cliente",
  "token": "token-unico-aqui",
  "type": "branding",
  "serviceType": "Branding e Criação",
  "client": {
    "contacts": ["Nome1", "Nome2"],
    "company": "Nome da Empresa"
  },
  "expiresAt": "AAAA-MM-DD",
  "proposalTitle": "Branding NomeEmpresa",
  "proposalIntro": "Texto introdutório da proposta...",
  "items": [
    {
      "id": "01",
      "name": "Nome do Entregável",
      "subtitle": "Descrição curta · contexto",
      "price": "R$ X.XXX",
      "gift": false,
      "note": "Inclui: ...",
      "obs": "Não inclui...",
      "deliverables": [
        "Item 1",
        "Item 2"
      ]
    }
  ],
  "investment": {
    "total": "R$ XX.XXX",
    "cashDiscount": "R$ XX.XXX",
    "installments": {
      "count": 6,
      "value": "R$ X.XXX",
      "method": "Pix ou boleto"
    }
  },
  "cta": {
    "meetingLink": "https://wa.me/5571993386304",
    "whatsapp": "71 9 9338-6304",
    "email": "jose@hup.com.br"
  }
}
```

**Campos opcionais nos items:**
- `"gift": true` → preço aparece riscado + badge "BRINDE" piscando
- `"note"` → texto em cyan itálico abaixo dos entregáveis (`*`)
- `"obs"` → texto em cinza itálico abaixo do note (`*`)

---

### Esquema JSON — tipo gestão de redes (sem `type`)

```json
{
  "slug": "nome-cliente",
  "token": "token-unico-aqui",
  "serviceType": "Gestão de Redes Sociais",
  "client": {
    "contact": "Nome do Contato",
    "company": "Nome da Empresa"
  },
  "expiresAt": "AAAA-MM-DD",
  "packages": [
    {
      "id": "A",
      "name": "Pacote A",
      "price": "R$ X.XXX/mês",
      "minMonths": 3,
      "recommended": false,
      "groups": [
        {
          "title": "Publicações mensais",
          "items": ["4 vídeos roteirizados + legendas", "8 publicações estáticas + legendas"]
        }
      ]
    }
  ],
  "cta": {
    "meetingLink": "https://wa.me/5571993386304",
    "whatsapp": "71 9 9338-6304",
    "email": "jose@hup.com.br"
  }
}
```

---

### 2. Gerar token

Use qualquer string única. Sugestão de padrão: `<slug>-<ano>` ou UUID curto.
Exemplo: `"nb-brand-2026"`, `"tratdent-2026"`, `"abc123-xyz"`

---

### 3. Fazer deploy

**Sempre nesta ordem:**

```bash
# 1. Commit os arquivos novos/alterados
git add proposals/<slug>.json views/<arquivo-se-alterado>.ejs server.js
git commit -m "feat: proposta <NomeCliente>"

# 2. Push para o repositório (EasyPanel faz pull do git)
git push

# 3. Disparar o rebuild via webhook
curl -s -X POST "$(cat .deploy-webhook)"
```

> ⚠️ O deploy SEM git push não tem efeito — o Docker rebuilda a partir do repositório git, não dos arquivos locais.

**Aguardar ~60s** para o build terminar antes de testar a URL.

---

### 4. Entregar o link ao cliente

```
https://proposta.hup.com.br/<slug>?token=<token>
```

---

## Como criar um novo tipo de proposta

1. Criar `views/proposal-<tipo>.ejs` baseado em `proposal-branding.ejs` ou `proposal.ejs`
2. Adicionar `"type": "<tipo>"` no JSON do cliente
3. Adicionar a lógica no `server.js`:

```js
const VIEWS = {
  branding: 'proposal-branding',
  // novo tipo aqui:
  ecommerce: 'proposal-ecommerce',
};
const view = VIEWS[proposal.type] || 'proposal';
res.render(view, { proposal, assets });
```

---

## Sincronizar assets (imagens do portfólio)

As imagens ficam num volume persistente no VPS — **não são** rebuiltadas no deploy.
Para atualizar fotos novas:

```bash
./deploy-assets.sh
```

---

## Propostas existentes

| Slug         | Tipo       | Cliente          | Token              |
|--------------|------------|------------------|--------------------|
| `tratdent`   | redes      | Equipe Tratdent  | `d12da616-41c6-...` |
| `neurobiota` | branding   | Natalia, Aiêsca, Rodrigo | `nb-brand-2026` |

---

## Padrões visuais (não alterar sem necessidade)

- **Cores:** `--blue: #1400FF` · `--cyan: #00CFFF` · `--bg: #0a0a0a`
- **Fontes:** Space Grotesk (corpo) + Poppins (títulos hero)
- **Seções numeradas:** 01 Hero · 02 Quem somos · 03 Serviços · 04 Portfólio · 05 Clientes · 06 Proposta · 07 CTA
- **Animações:** `.reveal` para entrada por scroll · `.hero-item` para entrada do hero · `.branding-card` para cards com stagger

---

## Contexto da agência (para textos e copy)

Ver `hup-base.md` para textos institucionais, lista de clientes, descrição dos serviços e pacotes de referência.
