# Finanças Filipe

App de controle financeiro pessoal com **receitas, despesas parceladas, categorias, assinaturas, gráficos e painel admin**.

![React](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan) ![Supabase](https://img.shields.io/badge/Supabase-green) ![License](https://img.shields.io/badge/uso-pessoal-orange)

---

## ✨ Funcionalidades

- 🔐 **Acesso por tokens** — sistema de convite com tokens únicos, sem cadastro aberto
- 💸 **Despesas** — pendentes vs pagas, com controle de vencimento e categorias
- 📅 **Parcelamento automático** — ex: R$800 em 4x vira 4 despesas mensais separadas
- 🔄 **Assinaturas recorrentes** — despesas geradas automaticamente todo mês
- 💰 **Receitas mensais** — registre suas entradas por mês
- 📊 **Gráfico de área** — receitas, despesas pagas, pendentes e assinaturas dos últimos 6 meses
- 🗂️ **Histórico por mês** — veja despesas de qualquer mês e exporte em PDF
- 📄 **Relatório PDF** — gera relatório completo do mês com um clique
- 🔔 **Avisos de vencimento** — alerta para contas vencidas ou vencendo em 7 dias
- ❓ **Botão de Dúvidas** — cada seção (Despesas, Receitas, Assinaturas, Parcelamentos, Gráfico, Histórico, Home) tem um botão de ajuda explicando como aquela função funciona, com passo a passo
- 🛡️ **Painel Admin** — gerencia usuários, último login, permissões e publica novidades
- 📢 **Sistema de novidades** — admin publica atualizações pelo painel, sem tocar no código
- 💡 **Saldo real** — só exibido quando há receita cadastrada no mês
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
├── App.jsx        # Toda a lógica: abas, modais, cálculos, gráfico, admin, botões de Dúvidas
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

### 3️⃣ Desativar confirmação de email

No Supabase → **Authentication → Providers → Email** → desative **"Confirm email"** → salve.

> Sem isso, o usuário precisa confirmar o email antes de logar, o que pode causar problemas com o fluxo de token.

### 4️⃣ Rodar os SQLs

No Supabase → **SQL Editor** → rode na ordem:

**Tabelas e políticas:**

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
  data_vencimento DATE,
  data_pagamento DATE,
  status TEXT DEFAULT 'pendente',
  parcela_atual INT,
  parcelas_total INT,
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

-- Parcelamentos
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

-- Profiles (admin + último login)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT,
  email TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Novidades (banner de atualizações)
CREATE TABLE public.novidades (
  id SERIAL PRIMARY KEY,
  versao TEXT NOT NULL UNIQUE,
  itens JSONB NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novidades ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "user_own_categorias" ON public.categorias FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_despesas" ON public.despesas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_receitas" ON public.receitas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_assinaturas" ON public.assinaturas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_parcelamentos" ON public.parcelamentos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "perfis_visiveis" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "usuario_atualiza_proprio" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "novidades_leitura" ON public.novidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "novidades_admin" ON public.novidades FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
```

**Trigger de criação de perfil:**

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Funções de token (verificar e consumir separados):**

```sql
-- Verifica se o token está disponível (sem consumir)
CREATE OR REPLACE FUNCTION verificar_codigo_acesso(codigo_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.codigos_acesso
    WHERE codigo = codigo_input
    AND ativo = TRUE
    AND usado_por IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Consome o token após signUp confirmado
CREATE OR REPLACE FUNCTION consumir_codigo_acesso(codigo_input TEXT, email_input TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.codigos_acesso
  SET ativo = FALSE,
      usado_por = email_input,
      usado_em = NOW()
  WHERE codigo = codigo_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Depois:** rode o arquivo `supabase-setup.sql` do repositório para criar os tokens e demais funções auxiliares.

### 5️⃣ Definir o admin

Após criar sua conta, pegue seu UUID em **Authentication → Users** e rode:

```sql
INSERT INTO profiles (id, nome, email, is_admin)
VALUES ('seu-uuid-aqui', 'Seu Nome', 'seu@email.com', TRUE)
ON CONFLICT (id) DO UPDATE SET is_admin = TRUE;
```

### 6️⃣ Ver seus tokens

```sql
SELECT lpad(id::text, 2, '0') AS "#", codigo AS "Token", ativo AS "Disponível"
FROM public.codigos_acesso
ORDER BY id;
```

📝 **Salve os tokens em local seguro.** São usados para dar acesso a outras pessoas.

### 7️⃣ Configurar variáveis de ambiente

Crie `.env.local` na raiz (esse arquivo **não vai pro GitHub** — confira se `.env.local` está no seu `.gitignore`):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
VITE_WHATSAPP_NUMERO=SEU_NUMERO_AQUI
```

- As duas primeiras chaves ficam em: Supabase → **Project Settings → API**
- `VITE_WHATSAPP_NUMERO` é opcional — é o número (com DDI+DDD, ex: `5518999999999`) que aparece no link de contato da tela de login. Se não configurar, o link simplesmente não aparece.

> ⚠️ **Nunca** coloque números de telefone, e-mails pessoais ou qualquer dado real direto no código. Sempre use variáveis de ambiente (`.env.local`), já que esse repositório é público — qualquer coisa escrita direto no código fica visível pra qualquer pessoa, inclusive no histórico de commits.

### 8️⃣ Rodar localmente

```bash
npm run dev
```

Abre em http://localhost:5173

### 9️⃣ Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte o GitHub
2. **Import Project** → selecione o repositório
3. Adicione as **Environment Variables** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_WHATSAPP_NUMERO`, se for usar)
4. **Deploy** — pronto! 🎉

> Branches diferentes da `main` geram Preview Deployments automáticos com URL própria.

---

## 📋 Gerenciar tokens

```sql
-- Ver todos os tokens
SELECT codigo, ativo, usado_por, usado_em FROM public.codigos_acesso ORDER BY id;

-- Ver só disponíveis
SELECT codigo, descricao FROM public.codigos_acesso WHERE ativo = true ORDER BY id;

-- Ver só usados
SELECT codigo, usado_por, usado_em FROM public.codigos_acesso WHERE ativo = false ORDER BY usado_em DESC;

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

## 📢 Gerenciar novidades (banner)

O banner de atualizações é gerenciado pelo **Painel Admin → Usuários → Gerenciar Novidades**, sem tocar no código.

1. Edite os itens da lista
2. Mude a versão (ex: `v3` → `v4`) para forçar exibição para todos
3. Clique **Publicar novidades**

Cada usuário vê o banner **uma vez por versão**.

---

## ❓ Editar os textos do botão de Dúvidas

Cada seção do app (Despesas, Receitas, Assinaturas, Parcelamentos, Gráfico, Histórico, Home) tem um botão de ajuda no cabeçalho. O texto de cada um fica em um único lugar, fácil de editar:

1. Abra `src/App.jsx`
2. Procure por `AJUDA_CONTEUDO`
3. Edite o `explicacao` ou os itens de `passos` da seção que quiser mudar

Pra adicionar ajuda numa seção nova, basta criar uma nova chave nesse objeto e colocar `<BotaoAjuda topico="sua_chave"/>` no cabeçalho da tela.

---

## 🛡️ Segurança e admin

- O painel **Admin** só aparece para usuários com `is_admin = true` no banco
- Para garantir acesso em caso de perda de conta, marque uma segunda conta como admin pelo painel ou direto no Supabase → Table Editor → profiles → `is_admin = true`
- Dados de cada usuário são isolados via **Row Level Security (RLS)**
- O acesso ao app é restrito por tokens distribuídos pelo dono do deploy
- Este repositório é **público** — nunca cole dados pessoais (telefone, e-mail, chaves de API) direto no código. Use sempre variáveis de ambiente (`.env.local`, nunca commitado) ou os "Secrets" do Supabase/Vercel

---

## ⚠️ Importante

- Cada deploy tem **Supabase e tokens próprios e independentes**
- O token é **verificado** antes do cadastro e **consumido** só após a conta ser criada com sucesso
- Sem confirmar email: desative em Authentication → Providers → Email → "Confirm email"

---

## 👤 Autor

**Filipe Oliveira** — [GitHub](https://github.com/ooliveira-ops)

---

Feito com 💙 — sinta-se livre pra clonar e adaptar pra você.
