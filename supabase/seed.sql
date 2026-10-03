-- Dados fictícios do Supabase local (supabase start / supabase db reset). Roda depois
-- do supabase-setup.sql e nunca vai para um projeto hospedado. Nada copiado de produção.
--
-- Os testes e2e criam e apagam os próprios usuários e tokens; este token existe só para
-- criar uma conta à mão no ambiente local.
INSERT INTO public.codigos_acesso (codigo, descricao)
VALUES ('LOCA-L234', 'Token fictício para cadastro manual no ambiente local')
ON CONFLICT (codigo) DO NOTHING;
