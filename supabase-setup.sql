-- ============================================
-- BANCO DE DADOS - FINANÇAS FILIPE
-- Cole TUDO isso no SQL Editor do Supabase e clique em RUN
-- ============================================

-- TABELA: categorias
CREATE TABLE categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL,
  icone TEXT NOT NULL,
  padrao BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: receitas
CREATE TABLE receitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fonte TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  mes TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: despesas
CREATE TABLE despesas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  data DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABELA: assinaturas
CREATE TABLE assinaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEGURANÇA: cada usuário só vê os próprios dados
-- ============================================

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

-- Categorias
CREATE POLICY "ver proprias categorias" ON categorias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "criar proprias categorias" ON categorias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "atualizar proprias categorias" ON categorias FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "deletar proprias categorias" ON categorias FOR DELETE USING (auth.uid() = user_id);

-- Receitas
CREATE POLICY "ver proprias receitas" ON receitas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "criar proprias receitas" ON receitas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "atualizar proprias receitas" ON receitas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "deletar proprias receitas" ON receitas FOR DELETE USING (auth.uid() = user_id);

-- Despesas
CREATE POLICY "ver proprias despesas" ON despesas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "criar proprias despesas" ON despesas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "atualizar proprias despesas" ON despesas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "deletar proprias despesas" ON despesas FOR DELETE USING (auth.uid() = user_id);

-- Assinaturas
CREATE POLICY "ver proprias assinaturas" ON assinaturas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "criar proprias assinaturas" ON assinaturas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "atualizar proprias assinaturas" ON assinaturas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "deletar proprias assinaturas" ON assinaturas FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- ÍNDICES (deixa as buscas mais rápidas)
-- ============================================

CREATE INDEX idx_categorias_user ON categorias(user_id);
CREATE INDEX idx_receitas_user ON receitas(user_id);
CREATE INDEX idx_despesas_user ON despesas(user_id);
CREATE INDEX idx_despesas_data ON despesas(data);
CREATE INDEX idx_assinaturas_user ON assinaturas(user_id);
