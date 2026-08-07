-- ============================================
-- BANCO DE DADOS — APP DE FINANÇAS
-- Cole TUDO isso no SQL Editor do Supabase e clique em RUN.
-- ============================================
--
-- Este arquivo é a definição completa do schema: tabelas, índices, RLS e funções RPC.
-- Escrito de forma idempotente (IF NOT EXISTS / OR REPLACE), então roda do zero num
-- projeto novo. Num projeto que já está em produção, compare antes com o schema real —
-- em especial as POLICIES, que podem ter sido ajustadas direto pelo painel.
--
-- Contém APENAS estrutura. Nunca adicione dados reais aqui.
-- ============================================

-- ============================================
-- TABELAS
-- ============================================

CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL,
  icone TEXT NOT NULL,
  padrao BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fonte TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  mes TEXT NOT NULL,                        -- "YYYY-MM"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS despesas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  data DATE NOT NULL,
  data_vencimento DATE,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga')),
  parcela_atual INTEGER,                    -- NULL quando não é parcelada
  parcelas_total INTEGER,                   -- NULL quando não é parcelada
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parcelamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor_total NUMERIC(12, 2) NOT NULL,
  parcelas_total INTEGER NOT NULL CHECK (parcelas_total >= 1),
  parcelas_pagas INTEGER NOT NULL DEFAULT 0,
  valor_pago NUMERIC(12, 2) NOT NULL DEFAULT 0,
  proxima_parcela_data DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'finalizado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Espelho de auth.users com os dados que o painel admin precisa ler.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banner de novidades publicado pelo painel admin.
CREATE TABLE IF NOT EXISTS novidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  versao TEXT NOT NULL UNIQUE,              -- o upsert do painel usa onConflict: "versao"
  itens JSONB NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convites: o cadastro é fechado, só entra quem tem token válido.
-- `ativo` marca o token como disponível; ele é consumido virando FALSE.
CREATE TABLE IF NOT EXISTS codigos_acesso (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,              -- sempre em MAIÚSCULAS (ex: AB12-CD34)
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  usado_por TEXT,
  usado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categorias_user ON categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_receitas_user ON receitas(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_user ON despesas(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_vencimento ON despesas(user_id, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_despesas_pagamento ON despesas(user_id, data_pagamento);
CREATE INDEX IF NOT EXISTS idx_assinaturas_user ON assinaturas(user_id);
CREATE INDEX IF NOT EXISTS idx_parcelamentos_user ON parcelamentos(user_id);


-- ============================================
-- HELPER: is_admin()
-- SECURITY DEFINER para poder ler profiles sem cair na própria policy (recursão).
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()), FALSE);
$$;

-- ============================================
-- SEGURANÇA: cada usuário só vê os próprios dados
-- ============================================

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE novidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE codigos_acesso ENABLE ROW LEVEL SECURITY;

-- Policies de versões anteriores do schema. Precisam sair pelo nome exato: policies
-- da mesma tabela são somadas por OR, então uma policy permissiva esquecida aqui
-- continua liberando leitura mesmo depois de as novas serem criadas.
DROP POLICY IF EXISTS "user_own_categorias" ON categorias;
DROP POLICY IF EXISTS "user_own_receitas" ON receitas;
DROP POLICY IF EXISTS "user_own_despesas" ON despesas;
DROP POLICY IF EXISTS "user_own_assinaturas" ON assinaturas;
DROP POLICY IF EXISTS "user_own_parcelamentos" ON parcelamentos;
DROP POLICY IF EXISTS "perfis_visiveis" ON profiles;
DROP POLICY IF EXISTS "usuario_atualiza_proprio" ON profiles;
DROP POLICY IF EXISTS "novidades_leitura" ON novidades;
DROP POLICY IF EXISTS "novidades_admin" ON novidades;

-- Categorias
DROP POLICY IF EXISTS "ver proprias categorias" ON categorias;
CREATE POLICY "ver proprias categorias" ON categorias FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "criar proprias categorias" ON categorias;
CREATE POLICY "criar proprias categorias" ON categorias FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "atualizar proprias categorias" ON categorias;
CREATE POLICY "atualizar proprias categorias" ON categorias FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "deletar proprias categorias" ON categorias;
CREATE POLICY "deletar proprias categorias" ON categorias FOR DELETE USING (auth.uid() = user_id);

-- Receitas
DROP POLICY IF EXISTS "ver proprias receitas" ON receitas;
CREATE POLICY "ver proprias receitas" ON receitas FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "criar proprias receitas" ON receitas;
CREATE POLICY "criar proprias receitas" ON receitas FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "atualizar proprias receitas" ON receitas;
CREATE POLICY "atualizar proprias receitas" ON receitas FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "deletar proprias receitas" ON receitas;
CREATE POLICY "deletar proprias receitas" ON receitas FOR DELETE USING (auth.uid() = user_id);

-- Despesas
DROP POLICY IF EXISTS "ver proprias despesas" ON despesas;
CREATE POLICY "ver proprias despesas" ON despesas FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "criar proprias despesas" ON despesas;
CREATE POLICY "criar proprias despesas" ON despesas FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "atualizar proprias despesas" ON despesas;
CREATE POLICY "atualizar proprias despesas" ON despesas FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "deletar proprias despesas" ON despesas;
CREATE POLICY "deletar proprias despesas" ON despesas FOR DELETE USING (auth.uid() = user_id);

-- Assinaturas
DROP POLICY IF EXISTS "ver proprias assinaturas" ON assinaturas;
CREATE POLICY "ver proprias assinaturas" ON assinaturas FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "criar proprias assinaturas" ON assinaturas;
CREATE POLICY "criar proprias assinaturas" ON assinaturas FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "atualizar proprias assinaturas" ON assinaturas;
CREATE POLICY "atualizar proprias assinaturas" ON assinaturas FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "deletar proprias assinaturas" ON assinaturas;
CREATE POLICY "deletar proprias assinaturas" ON assinaturas FOR DELETE USING (auth.uid() = user_id);

-- Parcelamentos
DROP POLICY IF EXISTS "ver proprios parcelamentos" ON parcelamentos;
CREATE POLICY "ver proprios parcelamentos" ON parcelamentos FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "criar proprios parcelamentos" ON parcelamentos;
CREATE POLICY "criar proprios parcelamentos" ON parcelamentos FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "atualizar proprios parcelamentos" ON parcelamentos;
CREATE POLICY "atualizar proprios parcelamentos" ON parcelamentos FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "deletar proprios parcelamentos" ON parcelamentos;
CREATE POLICY "deletar proprios parcelamentos" ON parcelamentos FOR DELETE USING (auth.uid() = user_id);

-- Profiles: cada um vê o seu; admin vê todos (o painel admin faz select *).
-- Sem a restrição de admin, qualquer usuário autenticado listaria os dados de todos.
DROP POLICY IF EXISTS "ver profiles" ON profiles;
CREATE POLICY "ver profiles" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
-- Atualizar apenas o próprio profile. is_admin NÃO pode ser mudado por aqui:
-- promoção/rebaixamento passa obrigatoriamente pelo RPC toggle_user_admin.
DROP POLICY IF EXISTS "atualizar proprio profile" ON profiles;
CREATE POLICY "atualizar proprio profile" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = (SELECT p.is_admin FROM profiles p WHERE p.id = auth.uid()));

-- Novidades: todo mundo autenticado LÊ, só admin ESCREVE.
-- Sem isso, qualquer usuário publicaria banner para todos os outros.
DROP POLICY IF EXISTS "ler novidades" ON novidades;
CREATE POLICY "ler novidades" ON novidades FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "admin cria novidades" ON novidades;
CREATE POLICY "admin cria novidades" ON novidades FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "admin atualiza novidades" ON novidades;
CREATE POLICY "admin atualiza novidades" ON novidades FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "admin deleta novidades" ON novidades;
CREATE POLICY "admin deleta novidades" ON novidades FOR DELETE USING (is_admin());

-- Códigos de acesso: NENHUMA policy de leitura para o cliente. A validação do token
-- acontece só dentro dos RPCs (SECURITY DEFINER), para a lista de códigos válidos
-- nunca poder ser lida de fora.
DROP POLICY IF EXISTS "admin gerencia codigos" ON codigos_acesso;
CREATE POLICY "admin gerencia codigos" ON codigos_acesso FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================
-- FUNÇÕES RPC USADAS PELO APP
-- ============================================

-- CREATE OR REPLACE FUNCTION não consegue alterar o tipo de retorno de uma função
-- que já existe: aborta com "cannot change return type of existing function" e
-- interrompe o restante do script. Estas assinaturas são removidas antes de serem
-- recriadas para o arquivo poder rodar sobre qualquer versão anterior do schema.
DROP FUNCTION IF EXISTS gerar_token_aleatorio();
DROP FUNCTION IF EXISTS verificar_codigo_acesso(TEXT);
DROP FUNCTION IF EXISTS consumir_codigo_acesso(TEXT, TEXT);
DROP FUNCTION IF EXISTS toggle_user_admin(UUID, BOOLEAN);

-- Cria o profile automaticamente quando alguém se cadastra.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Gera um token no formato AB12-CD34.
CREATE OR REPLACE FUNCTION gerar_token_aleatorio()
RETURNS TEXT
LANGUAGE SQL
VOLATILE
AS $$
  SELECT string_agg(
           substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
                  floor(random() * 32 + 1)::int, 1), ''
         ) || '-' ||
         string_agg(
           substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
                  floor(random() * 32 + 1)::int, 1), ''
         )
    FROM generate_series(1, 4);
$$;

-- Só VERIFICA se o token existe e está livre (não consome).
CREATE OR REPLACE FUNCTION verificar_codigo_acesso(codigo_input TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM codigos_acesso
    WHERE codigo = UPPER(TRIM(codigo_input))
      AND ativo = TRUE
      AND usado_por IS NULL
  );
$$;

-- Consome o token DEPOIS de o cadastro dar certo.
CREATE OR REPLACE FUNCTION consumir_codigo_acesso(codigo_input TEXT, email_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  afetadas INTEGER;
BEGIN
  UPDATE codigos_acesso
     SET ativo = FALSE, usado_por = email_input, usado_em = NOW()
   WHERE codigo = UPPER(TRIM(codigo_input)) AND ativo = TRUE;
  GET DIAGNOSTICS afetadas = ROW_COUNT;
  RETURN afetadas > 0;
END;
$$;

-- Promove/rebaixa admin. Fica num RPC para a checagem de permissão rodar no servidor.
--
-- SECURITY DEFINER é essencial: sem ele o UPDATE cai na policy de profiles (que só
-- permite mexer no próprio registro), não afeta nenhuma linha e não devolve erro —
-- um UPDATE barrado por RLS é um sucesso com 0 linhas. Daí também o RETURNS BOOLEAN
-- e o RAISE quando nada é alterado: o cliente precisa poder distinguir os dois casos.
CREATE OR REPLACE FUNCTION toggle_user_admin(target_id UUID, novo_valor BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  afetadas INTEGER;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar permissões';
  END IF;
  -- Impede o último admin de se rebaixar e deixar o app sem ninguém no controle.
  IF novo_valor = FALSE AND (SELECT COUNT(*) FROM profiles WHERE is_admin) <= 1 THEN
    RAISE EXCEPTION 'É necessário manter ao menos um administrador';
  END IF;
  UPDATE profiles SET is_admin = novo_valor WHERE id = target_id;
  GET DIAGNOSTICS afetadas = ROW_COUNT;
  IF afetadas = 0 THEN
    RAISE EXCEPTION 'Nenhum usuário alterado — id % não existe em profiles', target_id;
  END IF;
  RETURN novo_valor;
END;
$$;

-- A despesa de cada parcela é criada pelo app, que divide em centavos exatos, preenche
-- `parcela_atual`/`parcelas_total` e distribui os vencimentos. Gerar a primeira parcela
-- no banco criava uma despesa concorrente, com a parcela escrita na descrição e sem
-- essas colunas, e as parcelas seguintes ficavam sem despesa nenhuma — fora do saldo.
DROP TRIGGER IF EXISTS trigger_gerar_despesa_ao_salvar ON parcelamentos;
DROP FUNCTION IF EXISTS trigger_gerar_primeira_parcela();

-- Mantém `updated_at` e garante o status final mesmo que a atualização venha de fora do app.
CREATE OR REPLACE FUNCTION trigger_atualizar_parcela()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.parcelas_pagas >= NEW.parcelas_total THEN
    NEW.status := 'finalizado';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_atualizar_parcela ON parcelamentos;
CREATE TRIGGER trigger_atualizar_parcela
  BEFORE UPDATE ON parcelamentos
  FOR EACH ROW EXECUTE FUNCTION trigger_atualizar_parcela();

-- Keep-alive chamado pelo cron da Vercel (api/ping.js). Não toca em dados de usuário,
-- então não depende de RLS permissiva em nenhuma tabela.
CREATE OR REPLACE FUNCTION ping()
RETURNS TIMESTAMPTZ
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOW();
$$;

GRANT EXECUTE ON FUNCTION ping() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verificar_codigo_acesso(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION consumir_codigo_acesso(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_user_admin(UUID, BOOLEAN) TO authenticated;

-- ============================================
-- PRIMEIRO ADMIN
-- Depois de criar sua conta, rode UMA vez, trocando pelo seu email:
--   UPDATE profiles SET is_admin = TRUE WHERE email = 'coloque-seu-email-aqui';
-- Não comite este arquivo com um email real preenchido.
-- ============================================
