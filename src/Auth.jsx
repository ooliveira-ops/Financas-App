import React, { useState } from "react";
import { Wallet, Mail, Lock, User, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { supabase } from "./supabase";

export default function Auth() {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [token, setToken] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [tipoMsg, setTipoMsg] = useState("info");

  const mostrarMsg = (texto, tipo = "info") => { setMensagem(texto); setTipoMsg(tipo); };

  const traduzErro = (msg) => {
    if (!msg) return "Erro desconhecido";
    if (msg.includes("Invalid login credentials")) return "Email ou senha incorretos";
    if (msg.includes("Email not confirmed")) return "Confirme seu email antes de logar";
    if (msg.includes("User already registered")) return "Este email já está cadastrado";
    if (msg.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres";
    return msg;
  };

  const handleLogin = async () => {
    if (!email || !senha) return mostrarMsg("Preencha email e senha", "error");
    setCarregando(true); setMensagem(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) mostrarMsg(traduzErro(error.message), "error");
  };

  const handleCadastro = async () => {
    if (!email || !senha || !nome || !token)
      return mostrarMsg("Preencha todos os campos, incluindo o token", "error");
    if (senha.length < 6)
      return mostrarMsg("A senha precisa ter pelo menos 6 caracteres", "error");
    setCarregando(true); setMensagem(null);

    const { data: tokenValido, error: errToken } = await supabase.rpc(
      "validar_codigo_acesso",
      { codigo_input: token.trim().toUpperCase(), email_input: email }
    );
    if (errToken) { setCarregando(false); return mostrarMsg("Erro ao validar token. Tente novamente.", "error"); }
    if (!tokenValido) { setCarregando(false); return mostrarMsg("Token inválido ou já utilizado. Solicite um novo token.", "error"); }

    const { error } = await supabase.auth.signUp({
      email, password: senha, options: { data: { nome } },
    });
    setCarregando(false);
    if (error) mostrarMsg(traduzErro(error.message), "error");
    else { mostrarMsg("Conta criada! Verifique seu email e depois faça login.", "success"); setModo("login"); setToken(""); }
  };

  const handleRecuperar = async () => {
    if (!email) return mostrarMsg("Digite seu email", "error");
    setCarregando(true); setMensagem(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setCarregando(false);
    if (error) mostrarMsg(traduzErro(error.message), "error");
    else mostrarMsg("Link de recuperação enviado para seu email.", "success");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modo === "login") handleLogin();
    else if (modo === "cadastro") handleCadastro();
    else handleRecuperar();
  };

  const inputCls = "w-full bg-white/[0.04] border border-blue-900/50 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-400/40 focus:outline-none focus:border-blue-500/60 transition-colors text-sm font-body";

  return (
    <div className="min-h-screen bg-[#060d1a] flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400;1,9..144,500&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-c { font-family: 'JetBrains Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }
        body { background: #060d1a; }
      `}</style>

      {/* Glow de fundo */}
      <div className="fixed top-0 left-1/3 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12), transparent 70%)' }} />
      <div className="fixed bottom-0 right-1/3 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08), transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/25 mb-5">
            <Wallet size={24} className="text-blue-400" />
          </div>
          <h1 className="font-display text-3xl italic text-slate-100">Finanças Filipe</h1>
          <p className="font-body text-sm text-slate-400/60 mt-1">Controle financeiro pessoal</p>
        </div>

        {/* Card */}
        <div className="bg-[#0d1829] border border-blue-900/40 rounded-2xl p-8">

          {modo === "recuperar" && (
            <button onClick={() => { setModo("login"); setMensagem(null); }}
              className="flex items-center gap-1 text-slate-400/60 hover:text-slate-200 text-sm mb-5 font-body transition-colors">
              <ArrowLeft size={14} /> Voltar ao login
            </button>
          )}

          {/* Tabs login/cadastro */}
          {modo !== "recuperar" && (
            <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl mb-7 border border-blue-900/30">
              <button onClick={() => { setModo("login"); setMensagem(null); }}
                className={`flex-1 py-2 rounded-lg font-body text-sm transition-all flex items-center justify-center gap-2 ${modo === "login" ? "bg-blue-600 text-white" : "text-slate-400/70 hover:text-slate-200"}`}>
                <Mail size={13} />Entrar
              </button>
              <button onClick={() => { setModo("cadastro"); setMensagem(null); }}
                className={`flex-1 py-2 rounded-lg font-body text-sm transition-all flex items-center justify-center gap-2 ${modo === "cadastro" ? "bg-blue-600 text-white" : "text-slate-400/70 hover:text-slate-200"}`}>
                <User size={13} />Cadastrar
              </button>
            </div>
          )}

          <h2 className="font-display text-xl italic text-slate-100 mb-5">
            {modo === "login" && "Entrar"}
            {modo === "cadastro" && "Criar conta"}
            {modo === "recuperar" && "Recuperar senha"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === "cadastro" && (
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400/40" />
                <input type="text" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)}
                  className={`${inputCls} pl-10`} />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400/40" />
              <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
                className={`${inputCls} pl-10`} />
            </div>

            {modo !== "recuperar" && (
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400/40" />
                <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)}
                  className={`${inputCls} pl-10`} />
              </div>
            )}

            {modo === "cadastro" && (
              <>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-blue-400/70" />
                  <input type="text" placeholder="Token (ex: AB12-CD34)" value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())} maxLength={9}
                    className={`${inputCls} pl-10 font-mono-c tracking-widest border-blue-500/30 focus:border-blue-400/60`} />
                </div>
                <div className="bg-blue-500/[0.07] border border-blue-500/20 rounded-xl p-3">
                  <p className="text-xs text-slate-400/80 font-body leading-relaxed">
                    🔑 <span className="text-blue-400 font-medium">Acesso restrito por token.</span><br />
                    Como esse site é visível a todos, algumas permissões são restritas. Entre em contato com o Filipe sobre dúvidas e o seu TOKEN.
                  </p>
                </div>
              </>
            )}

            {mensagem && (
              <div className={`p-3 rounded-xl text-sm font-body ${
                tipoMsg === "error" ? "bg-red-500/10 text-red-300 border border-red-500/25"
                : tipoMsg === "success" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                : "bg-blue-500/10 text-blue-300 border border-blue-500/25"
              }`}>
                {mensagem}
              </div>
            )}

            <button type="submit" disabled={carregando}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-body font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-1">
              {carregando && <Loader2 size={15} className="animate-spin" />}
              {modo === "login" && "Entrar"}
              {modo === "cadastro" && "Criar conta"}
              {modo === "recuperar" && "Enviar link"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2 font-body">
            {modo === "login" && (
              <button onClick={() => { setModo("recuperar"); setMensagem(null); }}
                className="text-slate-400/40 hover:text-slate-400 text-xs transition-colors">
                Esqueci minha senha
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 text-center space-y-2">
          <p className="font-body text-[11px] text-slate-400/25">created by Filipe Oliveira</p>
          <p className="font-body text-xs text-slate-400/50">
            Dúvida?{" "}
            <a
              href="https://wa.me/SEU_NUMERO_AQUI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
            >
              Entre em contato com o Filipe!
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
