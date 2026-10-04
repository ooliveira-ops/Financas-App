# 🧩 src/

O código do app. É uma **SPA em React** que roda inteira no navegador e conversa direto
com o Supabase: não há servidor próprio. O isolamento entre usuários é feito pelo banco,
com **Row Level Security** (veja [`supabase/`](../supabase/README.md)).

| Camada | Tecnologia |
|---|---|
| Interface | **React 18** + **Vite 5** + **Tailwind CSS 3** (tema próprio, azul escuro, fontes Fraunces, JetBrains Mono e Inter) |
| Banco e login | **Supabase** (PostgreSQL + Auth + RLS) |
| Gráficos | **Recharts** (carregado só ao abrir a aba Gráfico) |
| PDF | **jsPDF** + **jspdf-autotable** |
| Ícones | **Lucide** |
| App instalável | **vite-plugin-pwa** (service worker e manifest) |

---

## 📄 Arquivos

| Arquivo | O que faz |
|---|---|
| `main.jsx` | Ponto de entrada: monta o `App` na página |
| `App.jsx` | Estado do app, abas, modais, chamadas ao Supabase, painel admin, banner de novidades e relatório PDF |
| `calculos.js` | **Todas as contas** como funções puras: saldos, totais, faturas do cartão, filtros, grupos por mês, progresso de parcelamento, parcelas, despesas de assinatura |
| `dados.js` | `buscarTodos()`: lê uma tabela inteira, paginando |
| `utils.js` | Helpers de **data** e **dinheiro** |
| `Auth.jsx` | Login, cadastro com token de convite e recuperação de senha |
| `Ajuda.jsx` | Textos do botão **Dúvidas** de cada aba (`AJUDA_CONTEUDO`) |
| `ModalBase.jsx` | Modal genérico (abre no `<body>`), campos de formulário e confirmação de exclusão |
| `GraficoAba.jsx` | Aba Gráfico, carregada sob demanda para o Recharts ficar fora do carregamento inicial |
| `supabase.js` | Cliente Supabase, criado a partir de `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` |

---

## 📐 Regras que valem para todo o código

**Datas** — sempre pelos helpers de `utils.js` (`hojeISO`, `mesAtual`, `somarMeses`,
`somarDias`…), que trabalham em **hora local**. `toISOString()` converte para UTC e, em
UTC-3, devolve o **dia seguinte a partir das 21:00** e o **mês seguinte** na virada. Para
somar meses, `somarMeses()`: 31/01 + 1 mês = 28/02, não 03/03.

> O app é pensado para UTC-3. Para usar em outro fuso, revise os helpers de `utils.js`.

**Dinheiro** — `formatBRL()` para exibir e `dividirEmParcelas()` para dividir. Nunca
`valor / parcelas` direto: as primeiras parcelas arredondam para baixo e a última absorve
a diferença, então a soma sempre fecha (100 em 3x = 33,33 + 33,33 + 33,34).

**Contas** — conta nova (saldo, total, filtro, progresso) vai para `calculos.js` como
função pura, recebendo listas e datas por parâmetro, e ganha teste em
`tests/unit/calculos.test.js`. O componente só a chama dentro de `useMemo`.

**Banco** — leitura de lista passa por `buscarTodos()` (o Supabase corta a resposta em
1000 linhas sem avisar). Gravação confere o retorno, não só a ausência de erro: um
`UPDATE` barrado pelo RLS responde sucesso com 0 linhas. Linha que pode não existir usa
`.maybeSingle()`.

---

## 🧮 Como os totais são calculados

Os cards da Início não têm todos o mesmo período, e cada um indica o seu escopo:

| Card | Escopo |
|---|---|
| **Saldo inicial** | o que sobrou (ou faltou) até o fim do mês anterior |
| **Receitas** | mês atual |
| **Pago** | despesas pagas no mês atual |
| **Saldo atual** | receitas − despesas pagas, de **todo o histórico** (o mesmo valor aparece no topo da aba Despesas) |
| **A pagar** | **todas** as pendentes, de qualquer mês |

Por isso `Receitas − Pago` não é igual ao Saldo atual: os dois primeiros são do mês, o
saldo é acumulado. É esse acúmulo que leva o que sobrou de um mês para o seguinte, sem
lançamento manual.

**Parcelamentos** entram no saldo pelas **despesas** — uma por parcela, criadas junto com
o parcelamento —, nunca pelo campo "já pago" da aba Parcelamentos, que serve só para
mostrar progresso. Somar os dois contaria o mesmo dinheiro duas vezes. Cada despesa de
parcela guarda a referência ao parcelamento (`parcelamento_id`), e o progresso (parcelas
pagas, valor já pago) é **recalculado** a partir delas a cada mudança, nunca incrementado.
Apagar o parcelamento não apaga as despesas: o gasto continua no saldo. Marcar como
**concluído** só tira o parcelamento quitado da lista.

**Acertar o saldo com o banco** — quando o saldo não bate (receita antiga não lançada,
conta paga e não marcada), o card **Saldo inicial** mostra a composição e oferece:

- **Registrar saldo atual** — informa quanto se tem hoje no banco;
- **Saldo do início do mês** — informa quanto se tinha no dia 1º (o que já estava na
  conta, não uma receita do mês).

Os dois gravam a diferença como uma **correção do saldo** de antes do mês: por dentro,
uma receita com fonte `"Ajuste de saldo"` lançada no **mês anterior**. Assim as receitas e
o pago do mês continuam mostrando só o que aconteceu nele, e apagar a correção a desfaz.

O **relatório PDF** segue a mesma lógica e traz o período em cada linha do resumo.

---

## ❓ Editar os textos do botão Dúvidas

Cada aba (Início, Despesas, Receitas, Assinaturas, Parcelamentos, Gráfico, Histórico) tem
um botão **?** no cabeçalho. Os textos ficam todos em `Ajuda.jsx`:

1. Abra `Ajuda.jsx` e localize o objeto `AJUDA_CONTEUDO`.
2. Edite a `explicacao` ou os itens de `passos` da aba.

Para uma aba nova, crie uma chave nesse objeto e coloque
`<BotaoAjuda topico="sua_chave"/>` no cabeçalho da tela. Os testes conferem que todo
tópico tem título, explicação e ao menos um passo.

---

## 🧪 Testes

Cada arquivo daqui tem o seu teste em `tests/unit/` — como rodar e onde escrever teste
novo está em [`tests/`](../tests/README.md).
