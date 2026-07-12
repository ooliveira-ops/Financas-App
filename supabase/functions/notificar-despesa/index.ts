// supabase/functions/notificar-despesa/index.ts
//
// Essa função roda no Supabase (não no seu computador). Ela é chamada
// automaticamente pelo Database Webhook toda vez que uma linha nova
// entra na tabela "despesas".
//
// O que ela faz, passo a passo:
// 1. Recebe os dados da despesa recém-criada (o Supabase manda isso sozinho)
// 2. Busca o e-mail do usuário dono dessa despesa
// 3. Chama a API da Resend pra mandar o e-mail de notificação

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// E-mail que vai aparecer como remetente. Enquanto você não verificar um
// domínio próprio na Resend, use o domínio de testes deles: onboarding@resend.dev
const EMAIL_REMETENTE = "Finanças <onboarding@resend.dev>";

serve(async (req) => {
  try {
    const payload = await req.json();

    // O Database Webhook do Supabase manda o registro novo dentro de "record"
    const despesa = payload.record;
    if (!despesa) {
      return new Response(JSON.stringify({ erro: "Nenhuma despesa recebida" }), { status: 400 });
    }

    // Usamos a service role key aqui (só existe no servidor, nunca no front-end)
    // pra poder consultar o e-mail do usuário dono da despesa.
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: usuario, error: erroUsuario } = await supabaseAdmin.auth.admin.getUserById(despesa.user_id);

    if (erroUsuario || !usuario?.user?.email) {
      return new Response(JSON.stringify({ erro: "Usuário não encontrado" }), { status: 404 });
    }

    const emailDestino = usuario.user.email;
    const valorFormatado = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      despesa.valor || 0
    );

    const respostaResend = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_REMETENTE,
        to: [emailDestino],
        subject: `💸 Nova despesa: ${despesa.descricao} — ${valorFormatado}`,
        html: `
          <div style="background-color:#060d1a; padding: 32px 16px; font-family: 'Segoe UI', Arial, sans-serif;">
            <div style="max-width: 480px; margin: auto; background-color:#0d1829; border: 1px solid #1e3a5f; border-radius: 20px; overflow: hidden;">

              <!-- Cabeçalho -->
              <div style="padding: 28px 28px 20px 28px; border-bottom: 1px solid #1e3a5f;">
                <p style="margin:0; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#60a5fa;">Finanças Filipe</p>
                <h1 style="margin:6px 0 0 0; font-size:22px; color:#f1f5f9;">Nova despesa registrada</h1>
              </div>

              <!-- Corpo -->
              <div style="padding: 24px 28px;">
                <div style="background-color: rgba(255,255,255,0.03); border: 1px solid #1e3a5f; border-radius: 14px; padding: 20px;">
                  <p style="margin:0 0 14px 0; font-size:15px; color:#e2e8f0;">
                    <span style="color:#94a3b8;">Descrição</span><br/>
                    <strong>${despesa.descricao}</strong>
                  </p>
                  <p style="margin:0 0 14px 0; font-size:22px; color:#60a5fa; font-weight:bold;">
                    ${valorFormatado}
                  </p>
                  <p style="margin:0; font-size:13px; color:#94a3b8;">
                    Vencimento: ${despesa.data_vencimento || despesa.data || "—"}
                  </p>
                </div>
              </div>

              <!-- Rodapé -->
              <div style="padding: 16px 28px 24px 28px;">
                <p style="margin:0; font-size:12px; color:#64748b; line-height:1.5;">
                  Você recebeu esse e-mail porque uma nova despesa foi cadastrada na sua conta do Finanças Filipe.
                  Se não foi você, ignore este e-mail.
                </p>
              </div>

            </div>
          </div>
        `,
      }),
    });

    if (!respostaResend.ok) {
      const erroTexto = await respostaResend.text();
      return new Response(JSON.stringify({ erro: "Falha ao enviar e-mail", detalhes: erroTexto }), { status: 500 });
    }

    return new Response(JSON.stringify({ sucesso: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ erro: e.message }), { status: 500 });
  }
});