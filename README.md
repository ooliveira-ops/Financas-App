# 💰 Finanças Filipe

App de controle financeiro pessoal com **receitas, despesas parceladas, categorias, assinaturas** e **acesso por tokens**.

🌐 **Versão online (do autor):** **[🔐]** 

![Stack](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan) ![Supabase](https://img.shields.io/badge/Supabase-green) ![License](https://img.shields.io/badge/uso-pessoal-orange)

---

## ✨ Funcionalidades

- 🔐 **Acesso por tokens** — sistema de convite com 15 tokens únicos
- 💸 **Despesas pendentes vs pagas** — só desconta do saldo quando marca como paga
- 📅 **Parcelamento automático** — ex: R$800 em 4x vira 4 despesas mensais
- ⚡ **Adiantar parcelas** — selecione quais parcelas pagar antecipadamente
- 🗑️ **Lixeira individual** — apague parcelas específicas
- 🏷️ **Categorias** personalizáveis com cores e ícones
- 💰 **Receitas** mensais e assinaturas recorrentes
- 🔔 **Avisos** de contas vencendo ao abrir o app
- 📊 **Resumo mensal** automático

---

## 🛠️ Stack

- **React 19** + **Vite**
- **Tailwind CSS** (estilo personalizado com Fraunces + JetBrains Mono)
- **Supabase** (PostgreSQL + Auth + RLS)
- **Recharts** (gráficos)
- **Lucide Icons**
- Deploy na **Vercel**

---

## 🚀 Como criar a SUA versão

Quer ter o seu próprio app de finanças baseado neste projeto? Segue o passo a passo:

### 1️⃣ Clonar o repositório

```bash
git clone https://github.com/ooliveira-ops/[nome-deste-repo].git
cd [nome-deste-repo]
npm install
```

### 2️⃣ Criar um Supabase próprio (grátis)

1. Acesse https://supabase.com e crie uma conta
2. Clique em **New Project**
3. Escolha um nome (ex: `meu-financas`) e uma senha forte
4. Aguarde ~2 minutos pra o projeto ficar pronto

### 3️⃣ Configurar as tabelas do banco

No Supabase, vá em **SQL Editor** → **New query** e rode estes SQLs **na ordem**:

**Primeiro:** crie as tabelas básicas:

```sql
-- Categorias
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT,
  icone TEXT,
  padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Despesas
CREATE TABLE public.despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  categoria_id UUID REFERENCES public.categorias,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Receitas
CREATE TABLE public.receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  fonte TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  mes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Assinaturas
CREATE TABLE public.assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  dia_vencimento INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (importante!)
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuário só vê seus próprios dados
CREATE POLICY "user_own_categorias" ON public.categorias FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_despesas" ON public.despesas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_receitas" ON public.receitas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_assinaturas" ON public.assinaturas FOR ALL USING (auth.uid() = user_id);
```

**Depois:** rode o script de tokens e colunas extras:

Use o arquivo `01-supabase-setup-FINAL.sql` deste repositório (cola o conteúdo todo no SQL Editor e roda).

### 4️⃣ ⭐ Ver seus 15 tokens gerados

Depois que rodar o SQL principal, aparecerá uma tabela com os tokens. Você também pode rodar a qualquer momento:

```sql
SELECT
  lpad(id::text, 2, '0') AS "#",
  codigo AS "Token",
  ativo AS "Disponível"
FROM public.codigos_acesso
ORDER BY id;
```

📝 **Salve esses 15 tokens em local seguro** (Bitwarden, Notas privadas, etc.). Você usa pra dar acesso pra outras pessoas.

⚠️ **NUNCA** comite esses tokens no GitHub!

### 5️⃣ Conectar o app ao seu Supabase

No Supabase, copie suas chaves:
1. **Project Settings** → **API**
2. Copie:
   - **Project URL** (ex: `https://abcde.supabase.co`)
   - **anon public key**

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 6️⃣ Testar localmente

```bash
npm run dev
```

Abre http://localhost:5173. Tente criar uma conta com um dos seus tokens.

### 7️⃣ Deploy na Vercel (grátis)

1. Acesse https://vercel.com e conecte sua conta GitHub
2. **Import Project** → selecione seu repositório
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` = seu URL
   - `VITE_SUPABASE_ANON_KEY` = sua chave
4. Clique **Deploy**

Pronto! Seu app está no ar. 🎉

---

## 📋 Como gerenciar tokens

### Ver todos os tokens (e quem usou)

```sql
SELECT codigo, ativo, usado_por, usado_em
FROM public.codigos_acesso
ORDER BY id;
```

### Liberar um token de novo (pessoa parou de usar)

```sql
UPDATE public.codigos_acesso
SET ativo = true, usado_por = NULL, usado_em = NULL
WHERE codigo = 'XXXX-XXXX';
```

E delete a conta da pessoa em: **Authentication → Users → ⋯ → Delete user**

### Gerar tokens extras (além dos 15 iniciais)

```sql
INSERT INTO public.codigos_acesso (codigo, descricao)
VALUES (public.gerar_token_aleatorio(), 'Token extra');
```

### Desativar todos (parar cadastros)

```sql
UPDATE public.codigos_acesso SET ativo = false;
```

---

## 📁 Estrutura

```
src/
├── App.jsx        # Componente principal (todas as abas e modais)
├── Auth.jsx       # Tela de login/cadastro com token
├── supabase.js    # Cliente Supabase
└── main.jsx       # Entry point
```

---

## ⚠️ Importante

- Cada deploy tem **seu próprio Supabase e tokens independentes**
- Os dados de cada usuário são isolados via Row Level Security (RLS)
- O acesso ao app é restrito por tokens distribuídos pelo dono do deploy

---

## 👤 Autor

**Filipe Oliveira** — [GitHub](https://github.com/ooliveira-ops)

---

Feito com 💚 — sinta-se livre pra clonar e adaptar pra você.
