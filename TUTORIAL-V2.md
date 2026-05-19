# 🚀 ATUALIZAÇÃO V2 — Login + Sincronização entre dispositivos

Esta é a versão 2 do app, agora com:
- ✅ Sistema de login/cadastro
- ✅ Recuperação de senha por email
- ✅ Dados sincronizados entre celular, PC, tablet
- ✅ Cada pessoa vê apenas seus próprios dados
- ✅ Cabeçalho mostra "Olá, [seu nome]"

---

## 📋 ÍNDICE

1. [Criar conta no Supabase](#1-criar-conta-no-supabase)
2. [Configurar o banco de dados](#2-configurar-o-banco-de-dados)
3. [Pegar as duas chaves](#3-pegar-as-duas-chaves)
4. [Atualizar o código no GitHub](#4-atualizar-o-código-no-github)
5. [Configurar variáveis no Vercel](#5-configurar-variáveis-no-vercel)
6. [Testar tudo](#6-testar-tudo)

---

## 1. Criar conta no Supabase

1. Vá em **https://supabase.com**
2. Clique em **"Start your project"** (canto superior direito)
3. Faça login com **GitHub** (mais fácil) ou email
4. Após logar, clique em **"New Project"**
5. Preencha:
   - **Organization:** sua conta pessoal (já vem selecionada)
   - **Name:** `financas-filipe`
   - **Database Password:** crie uma senha forte e **SALVE EM ALGUM LUGAR SEGURO** ⚠️
   - **Region:** escolha **"South America (São Paulo)"** — mais rápido pra você
   - **Pricing Plan:** **Free** ✅
6. Clique em **"Create new project"**
7. ⏳ Aguarde uns **2 minutos** enquanto ele prepara tudo

---

## 2. Configurar o banco de dados

Depois que o projeto estiver pronto:

1. No menu lateral esquerdo, clique no ícone **"SQL Editor"** (parece um terminal `</>`)
2. Clique em **"+ New query"**
3. Abra o arquivo **`supabase-setup.sql`** que veio no projeto
4. **Copie TODO o conteúdo** desse arquivo
5. **Cole no editor SQL do Supabase**
6. Clique no botão **"Run"** (canto inferior direito) ou aperte **Ctrl+Enter**
7. Vai aparecer **"Success. No rows returned"** ✅

Pronto! Você criou:
- 4 tabelas (categorias, receitas, despesas, assinaturas)
- Sistema de segurança (cada usuário só vê os próprios dados)
- Índices pra deixar tudo rápido

---

## 3. Pegar as duas chaves

Você precisa de duas informações pra conectar o app no Supabase:

1. No menu lateral, clique em **"Project Settings"** (ícone de engrenagem ⚙️ no canto inferior)
2. Clique em **"API"**
3. Você verá duas informações importantes:

### **Chave 1: Project URL**
Algo tipo: `https://abcdefghijklmnop.supabase.co`

### **Chave 2: anon public key**
Uma chave longa começando com `eyJhbGc...` (bem grande)

⚠️ **IMPORTANTE:** Use a chave `anon public`, **NÃO** a `service_role`!

**Copie as duas e guarde** num bloco de notas — você vai usar daqui a pouco.

---

## 4. Atualizar o código no GitHub

Agora você vai substituir os arquivos antigos pelos novos no seu repositório.

### **Opção A: Pelo site do GitHub (mais fácil)**

1. Entre no seu repositório `financas-filipe` no GitHub
2. **Delete os arquivos antigos** que vão ser substituídos:
   - `src/App.jsx`
   - `package.json`
3. Clique em **"Add file" → "Upload files"**
4. **Arraste todos os arquivos novos** dessa pasta v2:
   - `src/App.jsx` (novo)
   - `src/Auth.jsx` (NOVO)
   - `src/supabase.js` (NOVO)
   - `package.json` (atualizado)
   - `.env.example` (NOVO — opcional, mas recomendo subir)
   - `.gitignore` (atualizado)
   - `supabase-setup.sql` (NOVO)
5. Em "Commit changes", escreva: `v2: adiciona login e sincronização`
6. Clique em **"Commit changes"**

### **Opção B: Pelo terminal**

```powershell
# Na pasta do projeto, copie os arquivos novos por cima dos antigos
# Depois:
git add .
git commit -m "v2: adiciona login e sincronização"
git push
```

---

## 5. Configurar variáveis no Vercel ⚠️ MUITO IMPORTANTE

Sem isso o app **NÃO VAI FUNCIONAR**.

1. Acesse https://vercel.com → entre no seu projeto **financas-filipe**
2. Clique em **"Settings"** (no menu superior)
3. No menu lateral, clique em **"Environment Variables"**
4. Adicione **DUAS variáveis**:

   **Primeira:**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** cole a Project URL que você pegou no Supabase
   - **Environment:** marque **Production**, **Preview** e **Development**
   - Clique em **Save**

   **Segunda:**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** cole a anon public key
   - **Environment:** marque os 3 ambientes
   - Clique em **Save**

5. Agora vá em **"Deployments"** (menu superior)
6. No último deploy, clique nos **3 pontinhos** → **"Redeploy"**
7. Confirme **"Redeploy"**
8. Aguarde 1-2 minutos

---

## 6. Configurar email no Supabase (importante!)

Por padrão o Supabase pede confirmação de email pra criar conta. Vamos configurar isso:

1. No Supabase, vá em **Authentication → URL Configuration** (menu lateral)
2. Em **"Site URL"**, coloque o link do seu Vercel: `https://financas-filipe.vercel.app` (ou o link que você tem)
3. Em **"Redirect URLs"**, adicione o mesmo link
4. Clique em **Save**

### Pra testar mais rápido (opcional)

Se quiser **desativar** a confirmação por email enquanto testa:

1. Vá em **Authentication → Providers → Email**
2. Desmarque **"Confirm email"**
3. Salve

⚠️ Lembre de reativar depois se quiser segurança maior!

---

## 7. Testar tudo!

1. Abra o link do seu app (vercel.app)
2. Você deve ver a **tela de login** com fundo escuro elegante
3. Clique em **"Criar conta"**
4. Preencha nome, email e senha
5. Se a confirmação de email estiver ativa, **cheque sua caixa de entrada** (e o spam)
6. Clique no link do email pra confirmar
7. Volte ao app e faça **login**
8. ✨ Você verá **"Olá, [seu nome]"** no cabeçalho

### Teste a sincronização:
1. Adicione algumas despesas no PC
2. Abra o app no celular
3. Faça login com a mesma conta
4. ✅ Os dados devem aparecer iguais!

---

## 🆘 Problemas comuns

### "Faltando variáveis de ambiente"
Você esqueceu de configurar as variáveis no Vercel ou esqueceu de fazer **Redeploy** depois.

### Email não chega
- Cheque a pasta de **spam**
- O Supabase free tem limite de 3 emails/hora — espere ou desabilite a confirmação

### "Email not confirmed"
Você precisa clicar no link que chegou no email antes de fazer login.

### Erros no console (F12)
Geralmente é variável de ambiente errada. Confira no Vercel se as duas variáveis estão exatas.

---

## 💡 Limites do plano grátis Supabase

Pra você ter referência (seu uso será MUITO menor):
- 500 MB de banco de dados
- 50.000 logins por mês
- 2 GB de banda
- Backup automático diário

Pra 15 pessoas, você usa cerca de **0,5%** disso. Tranquilíssimo. 😄

---

Created by **Filipe Oliveira** 💛
