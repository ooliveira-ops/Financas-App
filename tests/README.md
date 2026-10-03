# 🧪 tests/

Testes automáticos do app. Rodam **sem** projeto Supabase e **sem** segredo: nada aqui
lê o `.env.local` nem fala com o banco de verdade.

| Pasta | O que tem | Ferramenta |
|---|---|---|
| `unit/` | Lógica pura (`src/utils.js`, `src/calculos.js`, `src/dados.js`), componentes e o `App` inteiro (`*.test.jsx`), e a function `api/ping.js` — sempre com o Supabase mockado | **Vitest** + **Testing Library** |
| `fixtures/` | `supabaseFalso.js`: cliente Supabase de mentira usado pelos testes | — |

---

## ⚡ Comandos

| Comando | Para que serve |
|---|---|
| `npm test` | Roda todos os testes unitários uma vez |
| `npm run test:watch` | Roda de novo a cada arquivo salvo, enquanto você programa |
| `npm run test:coverage` | Roda com relatório de cobertura em `coverage/` (abra `coverage/index.html`) |

A configuração fica na chave `test` do `vite.config.js`, não em arquivo próprio.

O `test:coverage` falha se a cobertura cair abaixo do piso definido em
`coverage.thresholds`: um piso global e um de 95% para `src/utils.js` e
`src/calculos.js`. O piso global só sobe — teste novo que aumente a cobertura é a
deixa para subi-lo.

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

### Componentes

O ambiente padrão é `node`, sem DOM. Teste de componente começa com o comentário abaixo
na **primeira linha**, que liga o `jsdom` só para aquele arquivo:

```jsx
// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
```

Asserções por **texto e papel** (`getByRole('dialog', { name: '...' })`,
`getByText`), nunca snapshot do HTML inteiro. Chame `cleanup` no `afterEach`. O
padrão está em `unit/ModalBase.test.jsx`.

### Datas e fuso

Os testes rodam com `TZ=America/Sao_Paulo` (fixado no `vite.config.js`). Teste de data
deve cobrir também **UTC**, que é o fuso do runner de CI — veja o `describe.each` de
`unit/utils.test.js`, que troca o `process.env.TZ` e usa relógio falso:

```js
vi.useFakeTimers({ toFake: ['Date'] })
vi.setSystemTime(new Date('2026-01-31T21:30:00-03:00'))
```

### Mock do Supabase

Todo teste que importa um arquivo de `src/` que usa o banco (`App.jsx`, `Auth.jsx`)
**precisa** mockar `src/supabase.js` — sem isso o `createClient` estoura por falta de
URL, e é essa falha que garante que nenhum teste chega a falar com um banco real.

Use o `fixtures/supabaseFalso.js`, que imita o builder do supabase-js: cada chamada é
registrada com a tabela (ou RPC), os métodos encadeados e os argumentos, e só conta como
enviada quando é consumida (`await`/`.then`), como no cliente real. Um cliente novo por
teste, trocado por um getter:

```jsx
const estado = vi.hoisted(() => ({ cliente: null }))
vi.mock('../../src/supabase.js', () => ({ get supabase() { return estado.cliente } }))

estado.cliente = criarSupabaseFalso({
  sessao: sessaoDeTeste(),
  responder: (c) => c.tabela === 'despesas' && c.tem('update') ? { data: [], error: null } : undefined,
})
// depois: estado.cliente.na('despesas', 'update')[0].args('in')
//         estado.cliente.naoConsumidas()  → deve ser []
```

`responder` imita o PostgREST: leitura com `maybeSingle` devolve objeto ou `null`,
nunca lista. O padrão de integração do app inteiro está em `unit/App.test.jsx`.

Para mockar uma biblioteca direto (como `@supabase/supabase-js` no `api/ping.js`),
recrie o `vi.fn` a cada teste (`beforeEach`) em vez de limpá-lo com
`mockClear`/`mockReset`: depois de limpo, uma promise rejeitada devolvida por ele é
reportada como erro do teste mesmo quando o código a trata. O padrão está em
`unit/api/ping.test.js`.
