# 🧪 tests/

Testes automáticos do app. Rodam **sem** projeto Supabase e **sem** segredo: nada aqui
lê o `.env.local` nem fala com o banco de verdade.

| Pasta | O que tem | Ferramenta |
|---|---|---|
| `unit/` | Lógica pura (`src/utils.js`, `src/calculos.js`, `src/dados.js`), componentes e o `App` inteiro (`*.test.jsx`), e a function `api/ping.js` — sempre com o Supabase mockado | **Vitest** + **Testing Library** |
| `fixtures/` | `supabaseFalso.js`: cliente Supabase de mentira usado pelos testes | — |
| `e2e/` | Fluxos completos no navegador (cadastro, dinheiro, parcelamento, RLS, admin, PDF, banner de novidades) contra um **Supabase local** em Docker | **Playwright** |

---

## ⚡ Comandos

| Comando | Para que serve |
|---|---|
| `npm test` | Roda todos os testes unitários uma vez |
| `npm run test:watch` | Roda de novo a cada arquivo salvo, enquanto você programa |
| `npm run test:coverage` | Roda com relatório de cobertura em `coverage/` (abra `coverage/index.html`) |
| `npm run test:e2e` | Roda os e2e no Chromium, como desktop e como celular (precisa do Supabase local) |
| `npm run test:e2e:ui` | Abre o modo visual do Playwright, para ver e depurar cada passo |

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

## 🌐 Testes e2e

Rodam o app de verdade no navegador contra um **Supabase local** criado a partir do
próprio `supabase/supabase-setup.sql` — sem projeto na nuvem, sem segredo, sem tocar no
banco de produção.

**Pré-requisito:** **Docker** rodando (no Windows, o Docker Desktop aberto).

```bash
npx playwright install chromium   # uma vez só: baixa o navegador dos testes
npx supabase start                # sobe o banco local (a 1ª vez baixa as imagens)
npm run test:e2e
npx supabase stop                 # quando terminar
```

**Deu certo se:** o terminal termina com `N passed`. Se falhar, o relatório fica em
`playwright-report/` (`npx playwright show-report`), com print e trace de cada falha.

Como funciona:

- O `playwright.config.js` (raiz) lê URL e chaves do `npx supabase status` — ou das
  variáveis de `.env.test.example`, se definidas — e **recusa** qualquer URL que não
  seja `127.0.0.1`/`localhost`.
- Antes de rodar, ele faz um build próprio (`npm run e2e:servidor` → `dist-e2e/`) com as
  chaves do Supabase local e o serve na porta **4174**. O `.env.local` nunca é lido
  (`envDir` do modo `e2e` no `vite.config.js`), e um servidor já aberto nunca é
  reaproveitado.
- O service worker do PWA fica bloqueado (`serviceWorkers: 'block'`), senão o cache
  serviria uma build anterior.
- O relógio do navegador fica parado em **15/03/2026 12:00** e o fuso em
  `America/Sao_Paulo`, para meses e vencimentos não dependerem do dia em que se roda.
- `preparar.js` espera o Supabase local responder antes do primeiro teste; `limpar.js`
  apaga, no fim, qualquer usuário de teste que tenha escapado.

### Escrever um teste e2e

Importe de `e2e/apoio.js`, não de `@playwright/test`:

```js
import { aviso, card, entrar, expect, irPara, test } from './apoio.js'

test('o que o usuário consegue fazer', async ({ page, dados }) => {
  const usuario = await dados.usuario()                  // conta nova, só deste teste
  await dados.inserir('receitas', [{ user_id: usuario.id, fonte: 'Salário', valor: 1000, mes: '2026-03' }])
  await entrar(page, usuario)
  await irPara(page, 'Início')
  await expect(card(page, 'Saldo atual')).toContainText('R$ 1.000,00')
})
```

- **Cada teste cria os próprios dados** pelo fixture `dados` (usuário, token, linhas) e
  eles são apagados no fim, passe ou falhe. Nada de depender de outro teste ou da ordem.
- Conferência no banco pela chave de serviço: `dados.linhas('despesas', usuario.id)`.
  Acesso como o usuário (para testar RLS): `clienteDe(usuario)`.
- Tela de celular conta: o mesmo teste roda no projeto `celular` (Pixel 7). Busque por
  papel e nome (`getByRole`), que valem nos dois layouts. Para layout, prefira
  `toBeInViewport()` a `toBeVisible()`: elemento cortado fora da tela ainda é "visível".
- **Tabela compartilhada entre usuários** (`novidades`) não se grava no teste: o que um
  teste puser ali aparece para os outros que rodam em paralelo. Simule só na página do
  teste com `page.route('**/rest/v1/novidades*', ...)` — o padrão está em
  `e2e/novidades.spec.js`.

---

## 🤖 CI (GitHub Actions)

O `.github/workflows/ci.yml` roda tudo isso sozinho em todo **pull request** e em todo
**push** para `dev` e `main` — e só nesses branches.

| Job | O que faz | Depende de |
|---|---|---|
| `build` | `npm ci` + `npm run build` | — |
| `unit` | `npm run test:coverage` (falha se a cobertura cair abaixo do piso); a cobertura fica como artefato | `build` |
| `e2e` | Sobe o Supabase local em Docker a partir do schema e roda `npm run test:e2e`; se falhar, o relatório e os traces ficam como artefato | `unit` |
| `deploy` | Só em push (ou execução manual) de `dev`/`main`: publica na Vercel — preview ou produção. Detalhes em [`deploy/`](../deploy/README.md#-vercel-com-deploy-pelo-github-actions) | `e2e` |

- **Os testes não usam segredo**: o e2e roda contra o banco local do próprio runner. PR
  vindo de fork, que não recebe secrets, roda igual. Só o job `deploy` usa os secrets da
  Vercel — e, sem eles, é pulado com aviso.
- Node **24** (LTS), runner `ubuntu-24.04` fixo, e cache do npm e dos navegadores do
  Playwright.
- Push novo no mesmo branch cancela a execução anterior — menos na `main`, para não
  interromper um deploy de produção.
- O runner roda em **UTC**; os testes de data já cobrem esse fuso.

**Onde ver:** aba **Actions** do repositório. Execução que falhou → job vermelho →
**Artifacts** no fim da página: `playwright-relatorio` (abra o `index.html` de
`playwright-report/`, ou `npx playwright show-trace` no `.zip` de `test-results/`).

Para conferir o arquivo do workflow antes de enviar, use o
[actionlint](https://github.com/rhysd/actionlint): `actionlint .github/workflows/ci.yml`.

---

## ✍️ Escrever um teste novo

- **Unitário ou e2e?** Conta, regra e componente → `unit/`. Fluxo que só faz sentido
  com banco de verdade (RLS, trigger, RPC, cadastro, várias abas) → `e2e/`, em
  `<fluxo>.spec.js`.
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
