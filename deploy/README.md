# 🌐 deploy/

O app é um site estático (a build do Vite em `dist/`) que conversa direto com o
Supabase. Qualquer host de arquivos estáticos serve, desde que reescreva as rotas
para `index.html` e não deixe o navegador cachear `index.html`, `sw.js` e
`manifest.webmanifest` — senão o PWA continua servindo a build anterior.

| Alvo | Configuração | Quando usar |
|---|---|---|
| **Vercel** | `vercel.json` (raiz) + `api/` + GitHub Actions | Caminho principal. Publica só depois dos testes, e é o único que roda o cron do `api/ping`, que mantém o projeto Supabase acordado |
| **Netlify** | `netlify.toml` (raiz) | Alternativa sem cron. O projeto Supabase gratuito pode pausar por inatividade |
| **Docker** | `deploy/docker/` | Servidor próprio ou VPS. Também sem cron |

`vercel.json` e `netlify.toml` ficam na raiz porque é lá que cada plataforma os
procura. Nesta pasta fica só o que pode morar fora dela.

Nos três casos as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e (opcional)
`VITE_WHATSAPP_NUMERO` são lidas **no build**, não em runtime: mudou o valor, precisa
de build novo.

---

## ▲ Vercel com deploy pelo GitHub Actions

Na Vercel, **só vai ao ar o que passou nos testes**. A integração Git da Vercel fica
**desligada** (`"git": { "deploymentEnabled": false }` no `vercel.json`) e quem publica
é o próprio CI (`.github/workflows/ci.yml`), no último job, depois de build, testes
unitários e e2e passarem:

| Push em | Vai para | Comandos |
|---|---|---|
| `dev` | **Preview** (URL própria) | `vercel pull` → `vercel build` → `vercel deploy --prebuilt` |
| `main` | **Produção** | os mesmos, com `--prod` |
| PR | nada é publicado | só os testes rodam |

O deploy em si fica em `.github/workflows/deploy.yml`, chamado pelo `ci.yml`.

> ⚠️ Com a integração Git desligada, **sem os três secrets abaixo nada é publicado** —
> nem o preview, nem a produção. O CI passa, com o aviso "Deploy pulado". Configure os
> secrets **antes** de mandar algo para a `main`.

### Configurar os secrets (uma vez)

Os três ficam no **GitHub**, nunca no código: repositório → **Settings → Secrets and
variables → Actions → New repository secret**.

| Secret | Onde pegar |
|---|---|
| `VERCEL_TOKEN` | vercel.com → avatar → **Account Settings → Tokens → Create**. Escopo: o time/conta do projeto. Copie na hora: ele não aparece de novo |
| `VERCEL_ORG_ID` | No projeto, rode `npx vercel link` uma vez; o arquivo `.vercel/project.json` (ignorado pelo git) traz o `orgId`. Ou: Vercel → **Team/Account Settings → General → ID** |
| `VERCEL_PROJECT_ID` | O `projectId` do mesmo `.vercel/project.json`. Ou: projeto na Vercel → **Settings → General → Project ID** |

As `VITE_*` continuam nas **Environment Variables** da Vercel, marcadas para
**Production** e **Preview**: o `vercel pull` as traz para o build do Actions.

**Deu certo se:** depois de um push no `dev`, o job **Deploy** do CI fica verde e o
resumo da execução mostra a URL do preview. Para publicar sem commit novo: aba
**Actions → CI → Run workflow**, escolhendo `main` (produção) ou `dev` (preview).

**Opcional, recomendado:** em **Settings → Branches → Add branch ruleset**, alvo `main`,
marque **Require status checks to pass** com `Build`, `Testes unitários` e
`Testes e2e`. Assim nem um merge pelo GitHub passa por cima de teste vermelho.

---

## 🐳 Docker

| Arquivo | O que faz |
|---|---|
| `docker/Dockerfile` | Build em dois estágios: Node gera o `dist/`, nginx serve |
| `docker/nginx.conf` | Fallback das rotas para `index.html` e `no-cache` nos arquivos do PWA |

O contexto do build é a **raiz do repositório**, por isso o `-f`. As `VITE_*` entram
por `--build-arg`: o `.dockerignore` da raiz barra o `.env.local` (e o resto do que é
local ou gerado) para não vazar para dentro da imagem.

```bash
docker build -f deploy/docker/Dockerfile -t financas \
  --build-arg VITE_SUPABASE_URL=https://seu-projeto.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui \
  .
docker run --rm -p 8080:80 financas
```

No Windows PowerShell, troque a `\` do fim de linha por crase (`` ` ``) ou escreva
tudo numa linha só.

**Deu certo se:** http://localhost:8080 abre a tela de login. Se abrir em branco, o
build ficou sem as `VITE_*`.
