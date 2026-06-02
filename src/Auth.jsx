import React, { useState } from "react";
import { supabase } from "./supabase";
import { Loader2, LogIn, UserPlus, Wallet } from "lucide-react";

export default function Auth() {
  const [modo, setModo] = useState("login"); // "login" | "cadastro"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(""); setSucesso("");
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) setErro("Email ou senha incorretos.");
    setCarregando(false);
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro(""); setSucesso("");
    if (!nome.trim()) { setErro("Informe seu nome."); return; }
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } },
    });
    if (error) setErro(error.message);
    else setSucesso("Conta criada! Verifique seu e-mail para confirmar.");
    setCarregando(false);
  };

  const inputCls =
    "w-full bg-white/[0.04] border border-blue-900/50 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-400/40 focus:outline-none focus:border-blue-500/60 transition-colors text-sm";

  return (
    <div className="min-h-screen bg-[#060d1a] flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        body { background: #060d1a; }
      `}</style>

      {/* Glow de fundo */}
      <div className="fixed top-0 left-1/3 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12), transparent 70%)' }} />
      <div className="fixed bottom-0 right-1/3 w-[500px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08), transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo / Título */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/25 mb-5">
            <Wallet size={24} className="text-blue-400" />
          </div>
          <h1 className="font-display text-3xl italic text-slate-100">Finanças</h1>
          <p className="font-body text-sm text-slate-400/60 mt-1">Controle financeiro pessoal</p>
        </div>

        {/* Card */}
        <div className="bg-[#0d1829] border border-blue-900/40 rounded-2xl p-8">
          {/* Tabs */}
          <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl mb-8 border border-blue-900/30">
            <button
              onClick={() => { setModo("login"); setErro(""); setSucesso(""); }}
              className={`flex-1 py-2 rounded-lg font-body text-sm transition-all flex items-center justify-center gap-2 ${modo === "login" ? "bg-blue-600 text-white" : "text-slate-400/70 hover:text-slate-200"}`}
            >
              <LogIn size={14} />Entrar
            </button>
            <button
              onClick={() => { setModo("cadastro"); setErro(""); setSucesso(""); }}
              className={`flex-1 py-2 rounded-lg font-body text-sm transition-all flex items-center justify-center gap-2 ${modo === "cadastro" ? "bg-blue-600 text-white" : "text-slate-400/70 hover:text-slate-200"}`}
            >
              <UserPlus size={14} />Cadastrar
            </button>
          </div>

          <form onSubmit={modo === "login" ? handleLogin : handleCadastro} className="space-y-4">
            {modo === "cadastro" && (
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className={inputCls}
                required
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={inputCls}
              required
            />
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              className={inputCls}
              required
            />

            {erro && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
                <p className="font-body text-xs text-red-400">{erro}</p>
              </div>
            )}
            {sucesso && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3">
                <p className="font-body text-xs text-emerald-400">{sucesso}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-body font-medium transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
            >
              {carregando ? (
                <><Loader2 size={16} className="animate-spin" />Aguarde...</>
              ) : modo === "login" ? (
                <><LogIn size={16} />Entrar</>
              ) : (
                <><UserPlus size={16} />Criar conta</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center font-body text-[11px] text-slate-400/30 mt-8">
          created by Filipe Oliveira
        </p>
      </div>
    </div>
  );
}
