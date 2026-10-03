# 🗄️ supabase/

Tudo o que o banco precisa para existir: o **schema** do app e as consultas de
manutenção usadas pelo dono do deploy.

| Arquivo | O que é |
|---|---|
| `supabase-setup.sql` | Schema completo: tabelas, índices, RLS, trigger de perfil e funções RPC |
| `seed.sql` | Dados **fictícios** do Supabase local: um token de convite para testes à mão |
| `config.toml` | Configuração do Supabase **local** (Supabase CLI): portas, seed, limites do auth |
| `.temp/`, `.branches/` | Gerados pelo Supabase CLI. Locais, ficam fora do git |

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

## 💻 Rodar um Supabase local (CLI + Docker)

Para os testes e2e, ou para mexer no schema sem arriscar o projeto da nuvem. Precisa do
**Docker** rodando; o CLI já vem nas dependências do projeto.

```bash
npx supabase start      # sobe banco, auth e API em http://127.0.0.1:54321
npx supabase status     # mostra URL e chaves locais
npx supabase db reset   # recria o banco do zero: schema + seed
npx supabase stop
```

O `config.toml` aplica o **`supabase-setup.sql` como seed** (`[db.seed] sql_paths`),
seguido do `seed.sql`. Assim o schema continua num arquivo único — o mesmo que se cola
no SQL Editor — e o `db reset` prova que ele reconstrói, sozinho, tudo o que o app usa.

- **Studio** local (o painel do Supabase): http://127.0.0.1:54323
- **E-mails** enviados pelo auth local (recuperação de senha): http://127.0.0.1:54324
- Realtime, storage, edge functions e analytics ficam desligados: o app não os usa.
- O limite de cadastro/login por IP é alto (`sign_in_sign_ups`) porque os e2e fazem
  dezenas de logins seguidos. Vale só para o local.

> ⚠️ Os comandos acima são do banco **local**. Nunca use `--linked`, `db push` nem
> `link` apontando para o projeto de produção a partir daqui: o `seed.sql` e o `db
> reset` não foram feitos para ele.

---

## 🔄 Atualizar um projeto que já existe

Coluna nova usada pelo app precisa existir no banco **antes** de o código novo ir ao
ar — senão a ação que a usa falha com `Could not find the '...' column`. As migrações
ficam na seção **MIGRAÇÕES** do `supabase-setup.sql` e podem ser rodadas sozinhas no
SQL Editor:

| Para usar | Rode |
|---|---|
| "Marcar como concluído" em Parcelamentos | `ALTER TABLE parcelamentos ADD COLUMN IF NOT EXISTS concluido BOOLEAN NOT NULL DEFAULT FALSE;` |

Depois de qualquer migração, rode também:

```sql
NOTIFY pgrst, 'reload schema';
```

A API do Supabase guarda o schema em cache; sem recarregá-lo, a coluna já criada ainda
responde `Could not find the '...' column ... in the schema cache` por um tempo.

**Deu certo se:** em **Table Editor → parcelamentos** aparece a coluna `concluido` e o
botão do app funciona depois de recarregar a página.

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
