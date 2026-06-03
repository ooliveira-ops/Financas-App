# 💰 Finanças Filipe

App de controle financeiro pessoal com **receitas, despesas parceladas, categorias, assinaturas, gráficos e painel admin**.


![React](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan) ![Supabase](https://img.shields.io/badge/Supabase-green) ![License](https://img.shields.io/badge/uso-pessoal-orange)

---

## ✨ Funcionalidades

- 🔐 **Acesso por tokens** — sistema de convite com tokens únicos, sem cadastro aberto
- 💸 **Despesas** — pendentes vs pagas, com controle de vencimento e categorias
- 📅 **Parcelamento automático** — ex: R$800 em 4x vira 4 despesas mensais separadas
- 💰 **Receitas mensais** — registre suas entradas por mês
- 🔄 **Assinaturas recorrentes** — Netflix, Spotify, planos — com dia de vencimento
- 📊 **Gráfico de área** — visualize receitas, despesas pagas, pendentes e assinaturas dos últimos 6 meses
- 🗂️ **Histórico por mês** — veja todas as despesas de qualquer mês e exporte em PDF
- 📄 **Relatório PDF** — gera relatório completo do mês atual com um clique
- 🔔 **Avisos de vencimento** — alerta ao abrir o app para contas vencidas ou vencendo em 7 dias
- 🛡️ **Painel Admin** — visualiza usuários, último login e gerencia permissões de admin
- 💡 **Saldo real** — só exibido quando há receita cadastrada no mês; nunca mostra negativo por falta de lançamento
- 🎨 **Design azul escuro** — tema refinado com Fraunces + JetBrains Mono

---

## 🛠️ Stack

- **React 19** + **Vite**
- **Tailwind CSS** (tema personalizado)
- **Supabase** (PostgreSQL + Auth + RLS)
- **Recharts** (gráficos de área)
- **jsPDF + jspdf-autotable** (exportação PDF)
- **Lucide Icons**
- Deploy na **Vercel**

---

## 🗂️ Estrutura

```
src/
├── App.jsx        # Toda a lógica: abas, modais, cálculos, gráfico, admin
├── Auth.jsx       # Login, cadastro com token e recuperação de senha
├── supabase.js    # Cliente Supabase
└── main.jsx       # Entry point
```

---

## 🚀 Como criar a SUA versão

### 1️⃣ Clonar e instalar

```bash
git clone https://github.com/ooliveira-ops/Financas-Filipe.git
cd Financas-Filipe
npm install
```

### 2️⃣ Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. **New Project** → nome e senha → aguarde ~2 minutos

### 3️⃣ Rodar os SQLs

No Supabase → **SQL Editor** → rode na ordem:

**Tabelas básicas:**

```sql
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  nome TEXT NOT NULL,
  cor TEXT,
  icone TEXT,
  padrao BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  categoria_id UUID REFERENCES public.categorias,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data DATE,
  data_vencimento DATE,
  data_pagamento DATE,
  status TEXT DEFAULT 'pendente',
  parcela_atual INT,
  parcelas_total INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  fonte TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  mes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  dia_vencimento INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.parcelamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  descricao TEXT NOT NULL,
  valor_total NUMERIC NOT NULL,
  parcelas_total INT NOT NULL,
  parcelas_pagas INT DEFAULT 0,
  valor_pago NUMERIC DEFAULT 0,
  proxima_parcela_data DATE,
  categoria_id UUID,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_categorias" ON public.categorias FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_despesas" ON public.despesas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_receitas" ON public.receitas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_assinaturas" ON public.assinaturas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_parcelamentos" ON public.parcelamentos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "perfis_visiveis" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "usuario_atualiza_proprio" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nome, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nome', NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Depois:** rode o arquivo `supabase-setup.sql` do repositório para criar tokens e funções auxiliares.

### 4️⃣ Definir o admin

Após criar sua conta, pegue seu UUID em **Authentication → Users** e rode:

```sql
INSERT INTO profiles (id, nome, email, is_admin)
VALUES ('seu-uuid-aqui', 'Seu Nome', 'seu@email.com', TRUE)
ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;
```

### 5️⃣ Ver seus tokens

```sql
SELECT lpad(id::text, 2, '0') AS "#", codigo AS "Token", ativo AS "Disponível"
FROM public.codigos_acesso
ORDER BY id;
```

📝 **Salve os tokens em local seguro.** São usados para liberar acesso a outras pessoas.

### 6️⃣ Configurar variáveis de ambiente

Crie `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

Chaves em: Supabase → **Project Settings → API**

### 7️⃣ Rodar localmente

```bash
npm run dev
```

Abre em http://localhost:5173

### 8️⃣ Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte o GitHub
2. **Import Project** → selecione o repositório
3. Adicione as **Environment Variables** (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
4. **Deploy** — pronto! 🎉

---

## 📋 Gerenciar tokens

```sql
-- Ver todos os tokens
SELECT codigo, ativo, usado_por, usado_em FROM public.codigos_acesso ORDER BY id;

-- Liberar token de volta
UPDATE public.codigos_acesso
SET ativo = true, usado_por = NULL, usado_em = NULL
WHERE codigo = 'XXXX-XXXX';

-- Gerar token extra
INSERT INTO public.codigos_acesso (codigo, descricao)
VALUES (public.gerar_token_aleatorio(), 'Token extra');

-- Desativar todos (fechar cadastros)
UPDATE public.codigos_acesso SET ativo = false;
```

---

## ⚠️ Importante

- Cada deploy tem **Supabase e tokens próprios e independentes**
- Dados de cada usuário são isolados via **Row Level Security (RLS)**
- O acesso ao app é restrito por tokens distribuídos pelo dono do deploy
- O painel **Admin** só aparece para usuários com `is_admin = true` no banco
- Para não perder acesso admin, marque uma segunda conta como admin pelo painel ou direto no Supabase

---

## 👤 Autor

**Filipe Oliveira** — [GitHub](https://github.com/ooliveira-ops)

---

Feito com 💙 — sinta-se livre pra clonar e adaptar pra você.
