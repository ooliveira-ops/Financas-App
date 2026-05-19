import React, { useState } from "react";
import { Sparkles, Mail, Lock, User, Loader2, ArrowLeft, KeyRound } from "lucide-react";
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

  const mostrarMsg = (texto, tipo = "info") => {
    setMensagem(texto);
    setTipoMsg(tipo);
  };

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
    setCarregando(true);
    setMensagem(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) mostrarMsg(traduzErro(error.message), "error");
  };

  const handleCadastro = async () => {
    if (!email || !senha || !nome || !token)
      return mostrarMsg("Preencha todos os campos, incluindo o token", "error");
    if (senha.length < 6)
      return mostrarMsg("A senha precisa ter pelo menos 6 caracteres", "error");

    setCarregando(true);
    setMensagem(null);

    const { data: tokenValido, error: errToken } = await supabase.rpc(
      "validar_codigo_acesso",
      { codigo_input: token.trim().toUpperCase(), email_input: email }
    );

    if (errToken) {
      setCarregando(false);
      return mostrarMsg("Erro ao validar token. Tente novamente.", "error");
    }
    if (!tokenValido) {
      setCarregando(false);
      return mostrarMsg("Token inválido ou já utilizado. Solicite um novo token.", "error");
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });
    setCarregando(false);

    if (error) mostrarMsg(traduzErro(error.message), "error");
    else {
      mostrarMsg("Conta criada! Verifique seu email e depois faça login.", "success");
      setModo("login");
      setToken("");
    }
  };

  const handleRecuperar = async () => {
    if (!email) return mostrarMsg("Digite seu email", "error");
    setCarregando(true);
    setMensagem(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-amber-50 p-4 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; font-variation-settings: "SOFT" 50, "WONK" 1; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }
        body { background: #0a0a0f; }
      `}</style>

      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.12), transparent 70%)' }} />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.10), transparent 70%)' }} />

      <div className="w-full max-w-md bg-[#15151c] border border-amber-100/15 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-7 h-7 text-amber-300" />
          <h1 className="font-display text-2xl italic text-amber-50">Finanças Filipe</h1>
        </div>

        {modo === "recuperar" && (
          <button onClick={() => setModo("login")}
            className="flex items-center gap-1 text-amber-100/60 hover:text-amber-100 text-sm mb-4 font-body">
            <ArrowLeft className="w-4 h-4" /> Voltar ao login
          </button>
        )}

        <h2 className="font-display text-xl italic text-amber-50 mb-6">
          {modo === "login" && "Entrar"}
          {modo === "cadastro" && "Criar conta"}
          {modo === "recuperar" && "Recuperar senha"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {modo === "cadastro" && (
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-amber-100/40" />
              <input type="text" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-amber-100/[0.03] border border-amber-100/15 rounded-lg text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-200/40 transition font-body" />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-amber-100/40" />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-amber-100/[0.03] border border-amber-100/15 rounded-lg text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-200/40 transition font-body" />
          </div>

          {modo !== "recuperar" && (
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-amber-100/40" />
              <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-amber-100/[0.03] border border-amber-100/15 rounded-lg text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-200/40 transition font-body" />
            </div>
          )}

          {modo === "cadastro" && (
            <>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-5 h-5 text-amber-300" />
                <input type="text" placeholder="Token (ex: AB12-CD34)" value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())} maxLength={9}
                  className="w-full pl-10 pr-3 py-2.5 bg-amber-100/[0.03] border border-amber-300/30 rounded-lg text-amber-50 placeholder-amber-100/30 focus:outline-none focus:border-amber-300/60 transition font-mono tracking-wider" />
              </div>
              <div className="bg-amber-100/[0.03] border border-amber-100/10 rounded-lg p-3">
                <p className="text-xs text-amber-100/70 font-body leading-relaxed">
                  🔑 <span className="text-amber-300 font-medium">Acesso restrito por token.</span><br/>
                  Como esse site é visível a todos, algumas permissões são restritas. Entre em contato com o Filipe sobre dúvidas e o seu TOKEN.
                </p>
              </div>
            </>
          )}

          {mensagem && (
            <div className={`p-3 rounded-lg text-sm font-body ${
              tipoMsg === "error"
                ? "bg-rose-500/10 text-rose-200 border border-rose-500/30"
                : tipoMsg === "success"
                ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30"
                : "bg-amber-500/10 text-amber-200 border border-amber-500/30"
            }`}>
              {mensagem}
            </div>
          )}

          <button type="submit" disabled={carregando}
            className="w-full bg-amber-200 hover:bg-amber-100 disabled:opacity-50 text-[#0a0a0f] font-body font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
            {carregando && <Loader2 className="w-5 h-5 animate-spin" />}
            {modo === "login" && "Entrar"}
            {modo === "cadastro" && "Criar conta"}
            {modo === "recuperar" && "Enviar link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm space-y-2 font-body">
          {modo === "login" && (
            <>
              <button onClick={() => { setModo("cadastro"); setMensagem(null); }}
                className="text-amber-300 hover:text-amber-200 block w-full">
                Não tem conta? Criar agora
              </button>
              <button onClick={() => { setModo("recuperar"); setMensagem(null); }}
                className="text-amber-100/40 hover:text-amber-100 text-xs">
                Esqueci minha senha
              </button>
            </>
          )}
          {modo === "cadastro" && (
            <button onClick={() => { setModo("login"); setMensagem(null); }}
              className="text-amber-300 hover:text-amber-200">
              Já tem conta? Entrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
