# 🌐 deploy/

O app é um site estático (a build do Vite em `dist/`) que conversa direto com o
Supabase. Qualquer host de arquivos estáticos serve, desde que reescreva as rotas
para `index.html` e não deixe o navegador cachear `index.html`, `sw.js` e
`manifest.webmanifest` — senão o PWA continua servindo a build anterior.

| Alvo | Configuração | Quando usar |
|---|---|---|
| **Vercel** | `vercel.json` (raiz) + `api/` | Caminho principal. Único que roda o cron do `api/ping`, que mantém o projeto Supabase acordado |
| **Netlify** | `netlify.toml` (raiz) | Alternativa sem cron. O projeto Supabase gratuito pode pausar por inatividade |
| **Docker** | `deploy/docker/` | Servidor próprio ou VPS. Também sem cron |

`vercel.json` e `netlify.toml` ficam na raiz porque é lá que cada plataforma os
procura. Nesta pasta fica só o que pode morar fora dela.

Nos três casos as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e (opcional)
`VITE_WHATSAPP_NUMERO` são lidas **no build**, não em runtime: mudou o valor, precisa
de build novo.

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
