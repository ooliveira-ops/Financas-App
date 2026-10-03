# ⚙️ api/

Functions da **Vercel**. Cada arquivo aqui vira um endpoint: `api/ping.js` responde em
`/api/ping`. A pasta precisa ficar na raiz, que é onde a Vercel procura.

| Arquivo | O que faz |
|---|---|
| `ping.js` | Keep-alive do projeto Supabase: chama a função `ping()` do banco |

---

## 🏓 ping

Projetos gratuitos do Supabase são **pausados** depois de alguns dias sem atividade. O
`vercel.json` agenda um **cron** que chama `/api/ping` às 10:00 UTC a cada 3 dias
(`0 10 */3 * *`), e a function faz uma chamada leve ao banco.

Ela usa a RPC `ping()` (criada pelo `supabase/supabase-setup.sql`), que só devolve o
horário do servidor. Assim não depende de leitura anônima em nenhuma tabela de dados.

| Resposta | Quando |
|---|---|
| `200` `{ ok: true, pingedAt }` | O banco respondeu |
| `500` `{ ok: false, error }` | A RPC devolveu erro ou a rede falhou |

**Variáveis de ambiente**, lidas por `process.env` no servidor da Vercel:
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` — as mesmas do app, já cadastradas em
**Environment Variables**.

**Conferir:** abra `https://seu-app.vercel.app/api/ping` no navegador; deve aparecer
`"ok":true`. As execuções do cron ficam em Vercel → projeto → **Settings → Cron Jobs**.

Netlify e Docker não rodam esta function nem o cron (veja [`deploy/`](../deploy/README.md)).

**Testes:** `tests/unit/api/ping.test.js`, com o Supabase mockado.
