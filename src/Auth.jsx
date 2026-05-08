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
      return mostrarMsg(
        "Token inválido ou já utilizado. Solicite um novo token.",
        "error"
      );
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 p-4">
      <div className="w-full max-w-md bg-slate-700/70 backdrop-blur rounded-2xl shadow-2xl p-8 border border-slate-600">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Sparkles className="w-8 h-8 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">Finanças Filipe</h1>
        </div>

        {modo === "recuperar" && (
          <button
            onClick={() => setModo("login")}
            className="flex items-center gap-1 text-slate-300 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao login
          </button>
        )}

        <h2 className="text-xl font-semibold text-white mb-6">
          {modo === "login" && "Entrar"}
          {modo === "cadastro" && "Criar conta"}
          {modo === "recuperar" && "Recuperar senha"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {modo === "cadastro" && (
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-slate-300" />
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-300" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {modo !== "recuperar" && (
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-300" />
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {modo === "cadastro" && (
            <>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-5 h-5 text-emerald-400" />
                <input
                  type="text"
                  placeholder="Token de acesso (ex: AB12-CD34)"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  maxLength={9}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-emerald-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-wider"
                />
              </div>
              <div className="bg-slate-800/60 border border-slate-600 rounded-lg p-3">
                <p className="text-xs text-slate-200 leading-relaxed">
                  🔑 <span className="text-emerald-400 font-medium">Acesso por token único.</span><br/>
                  Cada token funciona apenas uma vez para criar a conta.
                </p>
              </div>
            </>
          )}

          {mensagem && (
            <div className={`p-3 rounded-lg text-sm ${
              tipoMsg === "error"
                ? "bg-rose-500/20 text-rose-200 border border-rose-500/30"
                : tipoMsg === "success"
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                : "bg-blue-500/20 text-blue-200 border border-blue-500/30"
            }`}>
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
          >
            {carregando && <Loader2 className="w-5 h-5 animate-spin" />}
            {modo === "login" && "Entrar"}
            {modo === "cadastro" && "Criar conta"}
            {modo === "recuperar" && "Enviar link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-300 space-y-2">
          {modo === "login" && (
            <>
              <button onClick={() => { setModo("cadastro"); setMensagem(null); }}
                className="text-emerald-400 hover:text-emerald-300 block w-full">
                Não tem conta? Criar agora
              </button>
              <button onClick={() => { setModo("recuperar"); setMensagem(null); }}
                className="text-slate-400 hover:text-white text-xs">
                Esqueci minha senha
              </button>
            </>
          )}
          {modo === "cadastro" && (
            <button onClick={() => { setModo("login"); setMensagem(null); }}
              className="text-emerald-400 hover:text-emerald-300">
              Já tem conta? Entrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
