# Finanças · Controle Pessoal

App de controle financeiro pessoal com receitas, despesas parceladas, categorias, assinaturas, gráficos e painel admin.

![React](https://img.shields.io/badge/React-18-blue) ![Vite](https://img.shields.io/badge/Vite-5-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan) ![Supabase](https://img.shields.io/badge/Supabase-green) ![License](https://img.shields.io/badge/uso-pessoal-orange)

---

## Funcionalidades

- **Acesso por tokens** — convite com tokens únicos, sem cadastro aberto
- **Despesas** — pendentes vs pagas, com vencimento, categorias e seletor de mês. Por padrão a lista mostra todos os meses, para que uma conta atrasada não desapareça na virada, agrupada por período e com o subtotal de cada mês
- **Parcelamento de despesa** — informe o valor total e o número de vezes; o app cria uma despesa por mês e divide em centavos exatos, com a última parcela absorvendo o arredondamento
- **Parcelamentos** — compras grandes divididas em várias vezes: o app cria uma despesa por parcela e a aba mostra o progresso de pagamento com barra e próxima data. Quitar uma parcela em qualquer uma das duas telas atualiza a outra, porque o progresso é recalculado a partir das despesas em vez de contado à parte. Depois de quitado, o parcelamento pode ser marcado como **concluído** e sai da lista para uma seção recolhida, de onde dá para reabrir
- **Assinaturas recorrentes** — a despesa do mês é gerada automaticamente no dia de vencimento escolhido
- **Receitas mensais** — registre as entradas de cada mês
- **Saldo acumulado** — soma as receitas de todo o histórico e desconta as despesas pagas. O que sobra de um mês transita sozinho para o mês seguinte, sem lançamento manual
- **Gráfico de área** — receitas, despesas pagas, pendentes e assinaturas dos últimos 6 meses
- **Histórico por mês** — despesas de qualquer mês, com exportação em PDF
- **Relatório PDF** — resumo do mês em um clique, com o período indicado em cada linha
- **Avisos de vencimento** — alerta para contas vencidas ou vencendo em até 7 dias
- **Botão de Dúvidas** — cada seção tem um botão de ajuda com explicação e passo a passo
- **Painel Admin** — usuários, último acesso, permissões e publicação de novidades
- **Sistema de novidades** — o admin publica atualizações pelo painel, sem tocar no código
- **PWA** — sem loja de aplicativos: abre o site e usa "Adicionar à tela inicial" no celular ou "Instalar" no navegador do PC
- **Design azul escuro** — Fraunces + JetBrains Mono + Inter

---

## Stack

- **React 18** + **Vite 5**
- **Tailwind CSS 3** (tema personalizado)
- **Supabase** (PostgreSQL + Auth + RLS)
- **Recharts** (gráficos de área)
- **jsPDF + jspdf-autotable** (exportação PDF)
- **Lucide Icons**
- **vite-plugin-pwa** (service worker e manifest)
- Deploy na **Vercel**

---

## Estrutura

```
src/
├── App.jsx         # Estado global, abas, modais, painel admin, relatório PDF
├── calculos.js     # Contas do app (saldos, totais, faturas, parcelas) como funções puras
├── dados.js        # Leitura paginada das tabelas (buscarTodos)
├── Auth.jsx        # Login, cadastro com token e recuperação de senha
├── GraficoAba.jsx  # Aba Gráfico — carregada sob demanda, mantém o Recharts fora do bundle inicial
├── Ajuda.jsx       # Textos do botão "Dúvidas" (AJUDA_CONTEUDO)
├── ModalBase.jsx   # Modal genérico e confirmação de exclusão
├── utils.js        # Helpers de data e dinheiro
├── supabase.js     # Cliente Supabase
└── main.jsx        # Entry point

api/ping.js                   # Keep-alive do projeto Supabase, chamado pelo cron da Vercel
supabase/supabase-setup.sql   # Schema completo: tabelas, índices, RLS e funções
supabase/config.toml          # Supabase local (CLI + Docker), usado pelos testes e2e
deploy/docker/                # Dockerfile e nginx.conf, alternativa à Vercel
tests/                        # Testes unitários (Vitest) e e2e (Playwright)
playwright.config.js          # Configuração dos testes e2e
```

- [`api/`](api/README.md) — a function `ping` e o cron que a chama
- [`supabase/`](supabase/README.md) — schema, Supabase local, tokens de convite, admin e novidades
- [`deploy/`](deploy/README.md) — Vercel, Netlify ou Docker
- [`tests/`](tests/README.md) — como rodar e escrever testes

Toda a lógica de negócio roda no cliente; o Supabase é chamado direto do browser e o isolamento entre usuários é feito por Row Level Security.

> As datas são calculadas em **hora local**, não em UTC. O app é pensado para UTC-3: se for usá-lo em outro fuso, revise os helpers de `src/utils.js`.

---

## 🚀 Como criar a SUA versão

São 11 passos, uns 20 minutos no total. Você precisa de: **Node 18+**, uma conta no
**Supabase** (grátis) e — só para publicar na internet — uma conta na **Vercel** (grátis).

| Etapa | Passos | O que você faz |
|---|---|---|
| Preparar | 1 | Baixa o projeto na sua máquina |
| Banco de dados | 2 – 4 | Cria o projeto no Supabase e monta as tabelas |
| Acesso | 5 – 7 | Gera os tokens de convite e vira admin |
| Rodar | 8 – 9 | Configura as chaves e abre o app localmente |
| Publicar | 10 | Sobe na Vercel com URL própria |
| Instalar | 11 | Coloca o app na tela inicial do celular ou do PC |

---

### 💻 Etapa 1 — Preparar

#### 1️⃣ Clonar e instalar

```bash
git clone https://github.com/ooliveira-ops/Financas-App.git
cd Financas-App
npm install
```

**Deu certo se:** a pasta `node_modules` apareceu e o comando terminou sem erro.

---

### 🗄️ Etapa 2 — Banco de dados

#### 2️⃣ Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project** → escolha um nome e uma senha → aguarde ~2 minutos

O projeto demora um pouco para ficar pronto. Espere o painel carregar antes de seguir.

#### 3️⃣ Desativar a confirmação de email

No Supabase → **Authentication → Providers → Email** → desative **"Confirm email"** → **Save**.

> ⚠️ Sem isso, a pessoa precisa confirmar o email antes de logar, o que atrapalha o fluxo de token.

#### 4️⃣ Criar as tabelas

No Supabase → **SQL Editor** → **New query** → cole todo o conteúdo de
**`supabase/supabase-setup.sql`** → **Run**.

Esse arquivo é a única definição do schema. Ele cria:

- **as tabelas** — `categorias`, `receitas`, `despesas`, `assinaturas`, `parcelamentos`, `profiles`, `novidades`, `codigos_acesso`
- **as políticas de RLS** e os índices
- **o trigger** que cria o perfil no cadastro
- **as funções** `verificar_codigo_acesso`, `consumir_codigo_acesso`, `toggle_user_admin`, `gerar_token_aleatorio` e `ping`
- **as migrações** que alinham um banco criado por uma versão anterior — `CREATE TABLE IF NOT EXISTS` vira no-op numa tabela que já existe, então coluna nova entra por `ALTER TABLE`

**Deu certo se:** apareceu *Success. No rows returned* e as tabelas estão em **Table Editor**.

O script é idempotente (`IF NOT EXISTS` / `OR REPLACE`), então roda direto num projeto novo.
**Num projeto que já está em produção, compare antes com o schema existente** — em especial
as policies, que podem ter sido ajustadas pelo painel.

> 📌 Sempre que mudar algo no banco pelo painel do Supabase, reflita a mudança nesse arquivo.
> Ele é a única versão recuperável do schema.

---

### 🎟️ Etapa 3 — Acesso

#### 5️⃣ Gerar os tokens de convite

O cadastro é fechado: cada pessoa precisa de um token para criar a conta.
No **SQL Editor**, rode para criar os 10 primeiros:

```sql
INSERT INTO public.codigos_acesso (codigo, descricao)
SELECT public.gerar_token_aleatorio(), 'Lote inicial'
FROM generate_series(1, 10);
```

#### 6️⃣ Ver seus tokens

```sql
SELECT lpad(id::text, 2, '0') AS "#", codigo AS "Token", ativo AS "Disponível"
FROM public.codigos_acesso
ORDER BY id;
```

🔑 **Salve os tokens em local seguro.** São eles que dão acesso ao app.

#### 7️⃣ Virar admin

Crie sua conta pelo app usando um dos tokens acima. O perfil é criado automaticamente
pelo trigger, então basta promover:

```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'coloque-seu-email-aqui';
```

**Deu certo se:** a aba **Usuários** passou a aparecer no app. Dali em diante, novas
promoções podem ser feitas pelo próprio painel.

---

### ⚙️ Etapa 4 — Rodar

#### 8️⃣ Configurar as variáveis de ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
VITE_WHATSAPP_NUMERO=SEU_NUMERO_AQUI
```

- As duas primeiras ficam em: Supabase → **Project Settings → API**
- `VITE_WHATSAPP_NUMERO` é **opcional** — é o número (com DDI+DDD, ex: `5518999999999`) do link de contato na tela de login. Se não configurar, o link simplesmente não aparece.
- Esse arquivo **não vai pro GitHub** — confira se `.env.local` está no seu `.gitignore`.

> 🚨 **Nunca** coloque telefone, e-mail pessoal ou qualquer dado real direto no código.
> Sempre use variáveis de ambiente, já que esse repositório é público — o que for escrito
> no código fica visível para qualquer pessoa, inclusive no histórico de commits.

#### 9️⃣ Rodar localmente

```bash
npm run dev
```

🖥️ Abre em http://localhost:5173 — faça login com a conta criada no passo 7.

Para abrir no celular durante o desenvolvimento, use:

```bash
npm run dev:host
```

O terminal passa a mostrar também uma linha `Network:` com o endereço da sua máquina na
rede — é ele que você abre no telefone, com o aparelho no mesmo Wi-Fi. Existe como script
separado porque, no PowerShell, o `--` de `npm run dev -- --host` é consumido pelo próprio
shell e a flag nunca chega ao Vite.

Para rodar os testes unitários, que não precisam do `.env.local` nem do banco:

```bash
npm test
```

Os testes e2e (`npm run test:e2e`) usam um Supabase local em **Docker**; o passo a passo
está em [`tests/`](tests/README.md#-testes-e2e).

---

### 🌐 Etapa 5 — Publicar

#### 🔟 Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte o GitHub
2. **Import Project** → selecione o repositório
3. Adicione as **Environment Variables** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_WHATSAPP_NUMERO`, se for usar)
4. **Deploy**

> Branches diferentes da `main` geram Preview Deployments automáticos com URL própria.
> Por padrão a Vercel protege esses previews: abri-los exige estar logado na conta, ou
> gerar um link de compartilhamento pelo botão **Share** do deployment. As variáveis de
> ambiente também precisam estar marcadas para o ambiente **Preview** — marcadas só em
> Production, o preview sobe sem as chaves e abre em tela branca.

O `vercel.json` também configura um **cron** que chama `/api/ping` a cada 3 dias, para o
projeto Supabase não ser pausado por inatividade. Esse endpoint usa a função `ping()` do
banco, então não depende de leitura anônima em nenhuma tabela de dados.

Prefere Netlify ou um servidor próprio com Docker? Veja [`deploy/`](deploy/README.md).

---

### 📱 Etapa 6 — Instalar como aplicativo

Não existe app na Play Store nem na App Store: o projeto é um **PWA**. Você abre a URL
que a Vercel te deu e instala direto do navegador — o ícone vai pra tela inicial e o app
abre em tela cheia, sem barra de endereço.

#### 1️⃣1️⃣ Instalar no celular

**Android (Chrome)**

1. Abra o seu site no Chrome
2. Toque no menu **⋮** (canto superior direito)
3. Toque em **Adicionar à tela inicial** → **Instalar**

**iPhone / iPad (Safari)**

1. Abra o seu site no **Safari** — no iOS só funciona pelo Safari
2. Toque no botão de compartilhar **⬆️** (barra de baixo)
3. Role e toque em **Adicionar à Tela de Início** → **Adicionar**

**Deu certo se:** o ícone apareceu na tela inicial e, ao abrir, o app ocupa a tela toda.

#### 💻 No computador

No Chrome ou no Edge, abra o site e clique no ícone de **instalar** (⊕ ou o monitor com
seta, do lado direito da barra de endereço) — ou **menu ⋮ → Instalar**. O app ganha
janela e atalho próprios, como um programa qualquer.

Se preferir, não instale nada: usar pelo navegador mesmo funciona igual, é o mesmo app.

---

### 🆘 Se algo der errado

| Sintoma | Provável causa |
|---|---|
| Tela branca ao abrir | `.env.local` ausente ou com chave errada — confira e reinicie o `npm run dev` |
| "Token inválido" no cadastro | O passo 5 não rodou, ou o token já foi usado |
| Login não entra | "Confirm email" ainda ativo no Supabase (passo 3) |
| Aba **Usuários** não aparece | `is_admin` não foi marcado (passo 7) — saia e entre de novo na conta |
| Erro de permissão ao salvar | O `supabase/supabase-setup.sql` não rodou por completo — rode de novo, ele é idempotente |

---

## Gerenciar tokens e novidades

As consultas para listar, liberar, gerar e desativar tokens, e o passo a passo para
publicar o banner de novidades, estão em [`supabase/README.md`](supabase/README.md).

---

## Editar os textos do botão de Dúvidas

Cada seção do app (Despesas, Receitas, Assinaturas, Parcelamentos, Gráfico, Histórico, Home) tem um botão de ajuda no cabeçalho. Os textos ficam todos num único lugar:

1. Abra `src/Ajuda.jsx`
2. Localize o objeto `AJUDA_CONTEUDO`
3. Edite a `explicacao` ou os itens de `passos` da seção que quiser mudar

Para adicionar ajuda numa seção nova, crie uma chave nesse objeto e coloque `<BotaoAjuda topico="sua_chave"/>` no cabeçalho da tela.

---

## Como os totais são calculados

Os valores da Home não têm todos o mesmo período, e cada card indica o seu escopo:

| Card | Escopo |
|---|---|
| Receitas | mês atual |
| Pago | despesas pagas no mês atual |
| A pagar | **todas** as pendentes, de qualquer mês |
| Saldo acumulado | receitas − despesas pagas, de todo o histórico |

Por isso `Receitas − Pago` não é igual ao Saldo: os dois primeiros são do mês, o saldo é acumulado. É esse acúmulo que faz o dinheiro que sobrou de um mês continuar disponível no mês seguinte.

Parcelamentos entram nessa conta pelas despesas — uma por parcela, criadas junto com o parcelamento — e não pelo campo "já pago" da aba Parcelamentos, que serve apenas para mostrar progresso. Somar os dois contaria o mesmo dinheiro duas vezes.

Cada despesa de parcela guarda a referência ao parcelamento que a originou, e é dessa ligação que sai o progresso: parcelas pagas e valor já pago são recalculados a partir das despesas a cada mudança, nunca incrementados por conta própria. Apagar o parcelamento não apaga as despesas — o gasto continua no saldo, apenas sem o acompanhamento.

O relatório PDF segue a mesma lógica e traz o período em cada linha do resumo.

---

## Segurança e admin

- Dados de cada usuário são isolados via **Row Level Security (RLS)**
- O painel **Admin** só aparece para usuários com `is_admin = true`
- Para garantir acesso em caso de perda de conta, marque uma segunda conta como admin pelo painel ou no Supabase → Table Editor → profiles → `is_admin = true`
- O acesso ao app é restrito por tokens distribuídos pelo dono do deploy
- Promover ou rebaixar admin passa pela função `toggle_user_admin` (`SECURITY DEFINER`), que valida a permissão no servidor — esconder o botão na interface não é controle de acesso
- **RLS não avisa quando bloqueia**: um `UPDATE` ou `DELETE` barrado por política retorna sucesso com 0 linhas afetadas. Ao escrever código novo, confirme a mudança pelo retorno do banco em vez de assumir que deu certo
- Este repositório é **público** — nunca cole dados pessoais (telefone, e-mail, chaves de API) direto no código. Use variáveis de ambiente (`.env.local`, nunca commitado) ou os Secrets do Supabase/Vercel

---

## ⚠️ Importante

- Cada deploy tem **Supabase e tokens próprios e independentes**
- O token é **verificado** antes do cadastro e **consumido** só depois de a conta ser criada com sucesso
- Sem confirmar email: desative em Authentication → Providers → Email → "Confirm email"
- Testes unitários com `npm test` e e2e com `npm run test:e2e` (detalhes em [`tests/`](tests/README.md)). Os unitários cobrem as contas, o login e os fluxos do app com o banco simulado; os e2e rodam os fluxos principais no navegador contra um Supabase local, incluindo RLS e permissões de admin. Mudança de cálculo ainda deve ser conferida na interface

---

## Autor

**Filipe Oliveira** — [GitHub](https://github.com/ooliveira-ops)

---

Feito com 💙 — sinta-se livre pra clonar e adaptar pra você.
