# 🗄️ supabase/

Tudo o que o banco precisa para existir: o **schema** do app e as consultas de
manutenção usadas pelo dono do deploy.

| Arquivo | O que é |
|---|---|
| `supabase-setup.sql` | Schema completo: tabelas, índices, RLS, trigger de perfil e funções RPC |
| `.temp/` | Gerada pelo Supabase CLI ao vincular um projeto. Local, fica fora do git |

> 📌 `supabase-setup.sql` é a **única** definição do schema e a única versão
> recuperável dele. Mudou algo pelo painel do Supabase (coluna, policy, função,
> trigger)? Reflita aqui na mesma alteração. **Estrutura sim, dados nunca.**

---

## 📦 O que o schema cria

- **Tabelas** — `categorias`, `receitas`, `despesas`, `assinaturas`, `parcelamentos`,
  `profiles`, `novidades`, `codigos_acesso`
- **RLS** em todas, com políticas `auth.uid() = user_id`; `profiles` e `novidades`
  liberam leitura extra para admin; `codigos_acesso` não tem leitura pelo cliente
- **Trigger** `on_auth_user_created`, que cria o perfil no cadastro
- **Funções** `is_admin`, `verificar_codigo_acesso`, `consumir_codigo_acesso`,
  `toggle_user_admin`, `gerar_token_aleatorio` e `ping`
- **Migrações** que alinham um banco criado por versão anterior. `CREATE TABLE IF NOT
  EXISTS` vira no-op em tabela que já existe, então coluna nova entra por `ALTER TABLE`

---

## 🚀 Aplicar num projeto novo

1. Supabase → **SQL Editor** → **New query**
2. Cole **todo** o conteúdo de `supabase-setup.sql` → **Run**

**Deu certo se:** apareceu *Success. No rows returned* e as tabelas estão em
**Table Editor**.

O script é **idempotente** (`IF NOT EXISTS` / `OR REPLACE` / `DROP ... IF EXISTS`):
roda de novo sem estragar nada. Num projeto que **já está em produção**, compare antes
com o schema real, em especial as **policies**, que podem ter sido ajustadas pelo
painel.

---

## 🎟️ Gerenciar tokens de convite

O cadastro é fechado: cada conta nova consome um token da tabela `codigos_acesso`.
Rode no **SQL Editor**:

```sql
-- Gerar um lote de 10
INSERT INTO public.codigos_acesso (codigo, descricao)
SELECT public.gerar_token_aleatorio(), 'Lote inicial'
FROM generate_series(1, 10);

-- Ver todos
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

O token é **verificado** antes do cadastro e **consumido** só depois de a conta ser
criada com sucesso. Os tokens dão acesso ao app: guarde-os fora do repositório.

---

## 👑 Admin

O primeiro admin é promovido à mão, depois de criar a conta pelo app:

```sql
UPDATE profiles SET is_admin = TRUE WHERE email = 'coloque-seu-email-aqui';
```

Dali em diante, promover e rebaixar passa pelo painel do app, que chama a função
`toggle_user_admin` (`SECURITY DEFINER`, com a checagem de permissão dentro dela). Ela
impede o último admin de se rebaixar.

---

## 📣 Novidades (banner)

O banner é publicado pelo **Painel Admin → Usuários → Gerenciar Novidades**, sem
tocar no código:

1. Edite os itens da lista
2. Mude a versão (ex.: `v3` → `v4`)
3. Clique **Publicar novidades**

O app mostra a linha **ativa** mais recente da tabela `novidades`, **uma vez por
versão** em cada navegador. Para consultar ou tirar o banner do ar pelo SQL Editor:

```sql
-- Versões publicadas
SELECT versao, ativo, itens, created_at FROM public.novidades ORDER BY created_at DESC;

-- Tirar o banner do ar
UPDATE public.novidades SET ativo = false;
```
