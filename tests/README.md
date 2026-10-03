# 🧪 tests/

Testes automáticos do app. Rodam **sem** projeto Supabase e **sem** segredo: nada aqui
lê o `.env.local` nem fala com o banco de verdade.

| Pasta | O que tem | Ferramenta |
|---|---|---|
| `unit/` | Lógica pura (`src/utils.js`, `src/calculos.js`) e a function `api/ping.js`, com o Supabase mockado | **Vitest** |

---

## ⚡ Comandos

| Comando | Para que serve |
|---|---|
| `npm test` | Roda todos os testes unitários uma vez |
| `npm run test:watch` | Roda de novo a cada arquivo salvo, enquanto você programa |
| `npm run test:coverage` | Roda com relatório de cobertura em `coverage/` (abra `coverage/index.html`) |

A configuração fica na chave `test` do `vite.config.js`, não em arquivo próprio.

---

## 🔒 Isolamento do banco de produção

O Vite carrega o `.env.local` em todo modo, inclusive no Vitest, e ele aponta para o
banco real. Por isso o `vite.config.js` usa `envDir: 'tests'` quando o modo é `test`:
os testes só enxergam variáveis de um `.env` que esteja **dentro desta pasta** — e
nenhum é necessário hoje.

O `unit/ambiente.test.js` falha se as `VITE_*` do Supabase vazarem para os testes.
Não apague esse teste.

---

## ✍️ Escrever um teste novo

- **Onde:** `tests/unit/`, espelhando o caminho do arquivo testado:
  `src/utils.js` → `tests/unit/utils.test.js`; `api/ping.js` → `tests/unit/api/ping.test.js`.
- **Conta nova** (saldo, total, filtro, progresso) vai para `src/calculos.js` como função
  pura, recebendo listas e datas por parâmetro, e ganha teste em `unit/calculos.test.js`.
  O componente só a chama dentro de `useMemo`.
- **Nome:** `<arquivo>.test.js` (ou `.test.jsx` para componente). Só esses são executados.
- **Títulos** em português, descrevendo o comportamento: `'100 em 3x = 33,33 / 33,33 / 33,34'`.
- **Toda alteração vem com teste**, e todo bug corrigido ganha um teste de regressão que
  falharia sem a correção.
- **Dados fictícios** sempre: `teste@example.com`, valores redondos, URLs como
  `http://supabase.teste.local`. Nada copiado de produção.

### Datas e fuso

Os testes rodam com `TZ=America/Sao_Paulo` (fixado no `vite.config.js`). Teste de data
deve cobrir também **UTC**, que é o fuso do runner de CI — veja o `describe.each` de
`unit/utils.test.js`, que troca o `process.env.TZ` e usa relógio falso:

```js
vi.useFakeTimers({ toFake: ['Date'] })
vi.setSystemTime(new Date('2026-01-31T21:30:00-03:00'))
```

### Mock do Supabase

Mocke `@supabase/supabase-js` com `vi.mock` e confira que a chamada foi feita de fato
(`toHaveBeenCalledWith`). Recrie o `vi.fn` a cada teste (`beforeEach`) em vez de
limpá-lo com `mockClear`/`mockReset`: depois de limpo, uma promise rejeitada devolvida
por ele é reportada como erro do teste mesmo quando o código a trata. O padrão está em
`unit/api/ping.test.js`.
