# Finanças · Controle Pessoal

App de **controle financeiro pessoal** — receitas, despesas, parcelamentos, assinaturas, gráficos e painel admin — que você publica na **sua** conta, com o **seu** banco.

[![CI](https://github.com/ooliveira-ops/Financas-App/actions/workflows/ci.yml/badge.svg)](https://github.com/ooliveira-ops/Financas-App/actions/workflows/ci.yml) ![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan) ![Supabase](https://img.shields.io/badge/Supabase-green) ![Testes](https://img.shields.io/badge/testes-Vitest%20%2B%20Playwright-brightgreen) ![License](https://img.shields.io/badge/uso-pessoal-orange)

---

## 📑 Sumário

- [📚 Funcionalidades](#-funcionalidades)
- [📋 Pré-requisitos](#-pré-requisitos)
- [🚀 Instalação](#-instalação)
- [⚡ Comandos](#-comandos)
- [🗂️ Estrutura](#️-estrutura)
- [🆘 Problemas comuns](#-problemas-comuns)
- [🔐 Segurança](#-segurança)
- [⚠️ Importante](#️-importante)

---

## 📚 Funcionalidades

- **Acesso por convite** — cadastro só com token, sem cadastro aberto
- **Despesas** — pendentes e pagas, com vencimento, categoria, forma de pagamento, filtro por mês e saldo atual no topo
- **Fatura do cartão** — compras no cartão agrupadas por mês, pagas de uma vez
- **Despesa parcelada** — informe o total e o número de vezes; as parcelas fecham o valor em centavos exatos
- **Parcelamentos** — progresso parcela a parcela, igual nas duas abas; quitado, pode ser marcado como **concluído**
- **Assinaturas** — a despesa do mês é gerada sozinha no dia escolhido
- **Receitas** e **saldo acumulado** — o que sobra de um mês passa sozinho para o seguinte
- **Acerto com o banco** — registre o saldo real e o app corrige a diferença sem mexer no mês
- **Histórico por mês**, **gráfico** dos últimos 6 meses e **relatório em PDF**
- **Avisos de vencimento** — contas vencidas ou vencendo em até 7 dias
- **Botão Dúvidas** em cada aba, com explicação e passo a passo
- **Painel admin** — usuários, último acesso, permissões e **novidades** publicadas sem tocar no código
- **PWA** — instala no celular ou no PC direto do navegador, sem loja de aplicativos

---

## 📋 Pré-requisitos

| Precisa de | Para quê |
|---|---|
| **Node 20+** e **Git** | rodar e publicar o app |
| Conta no **[Supabase](https://supabase.com)** (grátis) | banco de dados e login |
| Conta no **[GitHub](https://github.com)** | seu fork do projeto e o CI |
| Conta na **[Vercel](https://vercel.com)** (grátis) — *opcional* | publicar na internet ([outras opções](deploy/README.md)) |
| **Docker** — *opcional* | só para rodar os testes e2e |

---

## 🚀 Instalação

Uns 20 minutos, do zero ao app no celular.

**1. Faça um fork e clone o seu**

No GitHub, clique em **Fork** neste repositório. Depois:

```bash
git clone https://github.com/SEU-USUARIO/Financas-App.git
cd Financas-App
npm install
```

**Deu certo se:** o `npm install` terminou sem erro.

**2. Crie o projeto no Supabase**

[supabase.com](https://supabase.com) → **New Project** → nome e senha → aguarde uns 2 minutos.

**Deu certo se:** o painel do projeto abriu.

**3. Desligue a confirmação de email**

Supabase → **Authentication → Providers → Email** → desative **Confirm email** → **Save**.

**Deu certo se:** a opção ficou desligada. Sem isso, quem se cadastra fica preso esperando um email.

**4. Crie as tabelas**

Supabase → **SQL Editor → New query** → cole **todo** o conteúdo de [`supabase/supabase-setup.sql`](supabase/supabase-setup.sql) → **Run**.

**Deu certo se:** apareceu *Success. No rows returned* e as tabelas estão em **Table Editor**. O que o schema cria está em [`supabase/`](supabase/README.md#-o-que-o-schema-cria).

**5. Gere os tokens de convite**

No **SQL Editor**:

```sql
INSERT INTO public.codigos_acesso (codigo, descricao)
SELECT public.gerar_token_aleatorio(), 'Lote inicial'
FROM generate_series(1, 10);
```

**Deu certo se:** a tabela `codigos_acesso` tem 10 linhas. Para listar, liberar ou desativar tokens: [`supabase/`](supabase/README.md#️-gerenciar-tokens-de-convite).

**6. Configure as chaves**

Copie o `.env.example` para `.env.local` e preencha com os valores de Supabase → **Project Settings → API**:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
VITE_WHATSAPP_NUMERO=
```

`VITE_WHATSAPP_NUMERO` é **opcional** (DDI + DDD + número, ex.: `5500000000000`): vazio, o link de contato da tela de login não aparece. O `.env.local` **nunca** vai para o GitHub.

**Deu certo se:** o arquivo `.env.local` existe na raiz com as duas chaves preenchidas.

**7. Rode o app**

```bash
npm run dev
```

**Deu certo se:** http://localhost:5173 abre a tela de login.

**8. Crie sua conta e vire admin**

No app, **Cadastrar** com um dos tokens do passo 5. Depois, no **SQL Editor**:

```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'coloque-seu-email-aqui';
```

**Deu certo se:** depois de sair e entrar de novo, a aba **Usuários** aparece.

**9. Publique na Vercel**

1. [vercel.com](https://vercel.com) → **Add New → Project** → importe o seu fork
2. **Environment Variables**: as mesmas do passo 6, marcadas para **Production** e **Preview**
3. No GitHub, cadastre os secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` — [onde pegar cada um](deploy/README.md#configurar-os-secrets-uma-vez)
4. GitHub → **Actions → CI → Run workflow** no branch `main`

**Deu certo se:** o job **Deploy** ficou verde e mostra a URL publicada.

> Quem publica é o **GitHub Actions**, e só depois de build e testes passarem: `dev` vira preview, `main` vira produção. Prefere Netlify ou Docker? Veja [`deploy/`](deploy/README.md).

**10. Instale como aplicativo**

| Aparelho | Como |
|---|---|
| **Android** (Chrome) | menu **⋮** → **Adicionar à tela inicial** → **Instalar** |
| **iPhone / iPad** (só pelo Safari) | **compartilhar ⬆️** → **Adicionar à Tela de Início** |
| **PC** (Chrome ou Edge) | ícone de **instalar** na barra de endereço, ou menu **⋮ → Instalar** |

**Deu certo se:** o ícone apareceu e o app abre em tela cheia, sem barra de endereço. Instalar é opcional: pelo navegador é o mesmo app.

---

## ⚡ Comandos

| Comando | Para que serve |
|---|---|
| `npm run dev` | App em http://localhost:5173 |
| `npm run dev:host` | O mesmo, aberto na rede local: use o endereço `Network` no celular (mesmo Wi-Fi) |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve o `dist/` para conferir a build |
| `npm test` | Testes unitários (não usam o `.env.local` nem o banco) |
| `npm run test:watch` | Testes unitários a cada arquivo salvo |
| `npm run test:coverage` | Testes unitários com relatório de cobertura |
| `npm run test:e2e` | Testes no navegador contra um Supabase local (precisa do Docker) |
| `npm run test:e2e:ui` | Os mesmos, no modo visual do Playwright |

> O `npm run dev` usa o banco do `.env.local` — se for o de produção, o que você criar testando é dado real.
> No PowerShell, `npm run dev -- --host` não funciona (o `--` some no caminho): por isso existe o `dev:host`.

---

## 🗂️ Estrutura

```
src/                  código do app (React)
api/                  function da Vercel que mantém o Supabase acordado
supabase/             schema do banco e Supabase local
deploy/               Docker e opções de deploy
tests/                testes unitários (Vitest) e e2e (Playwright)
.github/workflows/    CI e deploy no GitHub Actions
```

| Pasta | O que tem no README dela |
|---|---|
| [`src/`](src/README.md) | Papel de cada arquivo, regras de data e dinheiro, **como os totais são calculados**, como editar os textos de Dúvidas |
| [`supabase/`](supabase/README.md) | Schema, Supabase local, **tokens de convite**, admin, novidades, migrações |
| [`deploy/`](deploy/README.md) | Vercel com GitHub Actions (**secrets**), Netlify e Docker |
| [`tests/`](tests/README.md) | Como rodar e escrever testes, CI |
| [`api/`](api/README.md) | A function `ping` e o cron que a chama |

---

## 🆘 Problemas comuns

| Sintoma | Provável causa |
|---|---|
| Tela branca ao abrir | `.env.local` ausente ou com chave errada — confira e reinicie o `npm run dev` |
| Tela branca no **preview** da Vercel | `VITE_*` marcadas só em Production — marque também **Preview** |
| "Token inválido" no cadastro | O passo 5 não rodou, ou o token já foi usado |
| Login não entra | **Confirm email** ainda ligado no Supabase (passo 3) |
| Aba **Usuários** não aparece | `is_admin` não foi marcado (passo 8) — saia e entre de novo |
| Erro de permissão ao salvar | O `supabase-setup.sql` não rodou inteiro — rode de novo, ele é idempotente |
| `Could not find the '...' column` | Coluna nova sem migração no banco — veja [`supabase/`](supabase/README.md#-atualizar-um-projeto-que-já-existe) |
| CI verde, mas com "Deploy pulado" | Faltam os secrets da Vercel no GitHub (passo 9) |
| Deploy com `Project not found` ou `Could not retrieve Project Settings` | `VERCEL_ORG_ID` errado ou token sem escopo do time — veja [`deploy/`](deploy/README.md#configurar-os-secrets-uma-vez) |

---

## 🔐 Segurança

- Os dados de cada usuário são isolados por **Row Level Security** no Supabase
- O cadastro é fechado por **tokens de convite**; o token só é **consumido** depois de a conta ser criada
- O painel admin só aparece para `is_admin = true`, e a permissão é conferida **no banco**, não na tela
- Repositório **público**: telefone, email e chaves ficam no `.env.local` e nas variáveis da Vercel, **nunca** no código

---

## ⚠️ Importante

- Cada instalação tem o **seu** Supabase, os **seus** tokens e os **seus** usuários
- Mudou algo no banco pelo painel do Supabase? Reflita no [`supabase/supabase-setup.sql`](supabase/README.md) — é a única cópia recuperável do schema
- Os testes rodam sozinhos no **GitHub Actions** a cada push; mudança de cálculo ainda deve ser conferida na tela

---

## Autor

**Filipe Oliveira** — [GitHub](https://github.com/ooliveira-ops)

Feito com 💙 — sinta-se livre pra clonar e adaptar pra você.
