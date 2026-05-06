import React, { useState } from "react";
import { Sparkles, Mail, Lock, User, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "./supabase";

export default function Auth() {
  const [modo, setModo] = useState("login"); // login | cadastro | recuperar
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [tipoMsg, setTipoMsg] = useState("info"); // info | error | success

  const mostrarMsg = (texto, tipo = "info") => {
    setMensagem(texto);
    setTipoMsg(tipo);
  };

  const handleLogin = async () => {
    if (!email || !senha) {
      mostrarMsg("Preencha email e senha", "error");
      return;
    }
    setCarregando(true);
    setMensagem(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setCarregando(false);
    if (error) {
      mostrarMsg(traduzErro(error.message), "error");
    }
  };

  const handleCadastro = async () => {
    if (!email || !senha || !nome) {
      mostrarMsg("Preencha todos os campos", "error");
      return;
    }
    if (senha.length < 6) {
      mostrarMsg("A senha precisa ter pelo menos 6 caracteres", "error");
      return;
    }
    setCarregando(true);
    setMensagem(null);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
      },
    });
    setCarregando(false);
    if (error) {
      mostrarMsg(traduzErro(error.message), "error");
    } else {
      mostrarMsg(
        "Conta criada! Verifique seu email para confirmar e depois faça login.",
        "success"
      );
      setModo("login");
    }
  };

  const handleRecuperar = async () => {
    if (!email) {
      mostrarMsg("Digite seu email", "error");
      return;
    }
    setCarregando(true);
    setMensagem(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setCarregando(false);
    if (error) {
      mostrarMsg(traduzErro(error.message), "error");
    } else {
      mostrarMsg(
        "Enviamos um link de recuperação para seu email. Confira sua caixa de entrada.",
        "success"
      );
    }
  };

  const handleSubmit = () => {
    if (modo === "login") handleLogin();
    else if (modo === "cadastro") handleCadastro();
    else handleRecuperar();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-amber-50 relative overflow-hidden flex items-center justify-center p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; font-variation-settings: "SOFT" 50, "WONK" 1; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }
        .grain::before {
          content: ''; position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
          opacity: 0.03; pointer-events: none; z-index: 1;
        }
        .glow-amber { background: radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.18), transparent 70%); }
        .glow-purple { background: radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.15), transparent 70%); }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeInUp { animation: fadeInUp 0.7s ease-out forwards; opacity: 0; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.25s; }
        .delay-3 { animation-delay: 0.4s; }
      `}</style>

      <div className="fixed inset-0 grain pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] glow-amber pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] glow-purple pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10 animate-fadeInUp">
          <Sparkles className="mx-auto text-amber-300/60 mb-4" size={28} />
          <h1 className="font-display text-4xl md:text-5xl italic text-amber-50 leading-tight">
            Finanças
          </h1>
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase mt-3">
            Organize · Acompanhe · Conquiste
          </p>
        </div>

        {/* Card */}
        <div className="animate-fadeInUp delay-1 bg-amber-100/[0.03] border border-amber-100/15 rounded-2xl p-7 backdrop-blur-sm">
          {/* Voltar (no modo recuperar) */}
          {modo === "recuperar" && (
            <button
              onClick={() => {
                setModo("login");
                setMensagem(null);
              }}
              className="text-amber-100/40 hover:text-amber-100 text-xs font-mono tracking-widest uppercase mb-4 flex items-center gap-1 transition"
            >
              <ArrowLeft size={12} /> voltar
            </button>
          )}

          <h2 className="font-display text-2xl italic text-amber-50 mb-1">
            {modo === "login"
              ? "bem-vindo de volta"
              : modo === "cadastro"
              ? "criar conta"
              : "recuperar senha"}
          </h2>
          <p className="font-mono text-[10px] tracking-widest text-amber-100/40 uppercase mb-6">
            {modo === "login"
              ? "entre com suas credenciais"
              : modo === "cadastro"
              ? "comece sua jornada"
              : "te enviaremos um link"}
          </p>

          <div className="space-y-4">
            {modo === "cadastro" && (
              <Campo
                icon={User}
                placeholder="Seu nome"
                value={nome}
                onChange={setNome}
              />
            )}

            <Campo
              icon={Mail}
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={setEmail}
            />

            {modo !== "recuperar" && (
              <Campo
                icon={Lock}
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={setSenha}
                onEnter={handleSubmit}
              />
            )}

            {mensagem && (
              <div
                className={`text-sm font-body p-3 rounded-lg border ${
                  tipoMsg === "error"
                    ? "bg-rose-500/10 border-rose-400/30 text-rose-200"
                    : tipoMsg === "success"
                    ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-200"
                    : "bg-amber-200/10 border-amber-200/30 text-amber-100"
                }`}
              >
                {mensagem}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={carregando}
              className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium hover:bg-amber-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {carregando ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {modo === "login"
                    ? "Entrar"
                    : modo === "cadastro"
                    ? "Criar conta"
                    : "Enviar link"}
                </>
              )}
            </button>

            {modo === "login" && (
              <div className="flex items-center justify-between text-xs font-body pt-2">
                <button
                  onClick={() => {
                    setModo("cadastro");
                    setMensagem(null);
                  }}
                  className="text-amber-100/60 hover:text-amber-100 transition"
                >
                  Criar conta
                </button>
                <button
                  onClick={() => {
                    setModo("recuperar");
                    setMensagem(null);
                  }}
                  className="text-amber-100/60 hover:text-amber-100 transition"
                >
                  Esqueci a senha
                </button>
              </div>
            )}

            {modo === "cadastro" && (
              <div className="text-center text-xs font-body pt-2">
                <span className="text-amber-100/40">Já tem conta? </span>
                <button
                  onClick={() => {
                    setModo("login");
                    setMensagem(null);
                  }}
                  className="text-amber-200 hover:text-amber-100 transition"
                >
                  Entrar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 animate-fadeInUp delay-3">
          <p className="font-mono text-[10px] tracking-[0.25em] text-amber-100/30 uppercase">
            created by
          </p>
          <p className="font-display text-sm italic text-amber-200/60 mt-1">
            Filipe Oliveira
          </p>
        </div>
      </div>
    </div>
  );
}

function Campo({ icon: Icon, type = "text", placeholder, value, onChange, onEnter }) {
  return (
    <div className="relative">
      <Icon
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-100/30"
      />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) onEnter();
        }}
        placeholder={placeholder}
        className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg pl-11 pr-4 py-3 font-body text-amber-50 placeholder:text-amber-100/30 focus:outline-none focus:border-amber-200/40 transition"
      />
    </div>
  );
}

function traduzErro(msg) {
  const traducoes = {
    "Invalid login credentials": "Email ou senha incorretos",
    "User already registered": "Este email já está cadastrado",
    "Email not confirmed": "Confirme seu email antes de entrar (cheque sua caixa de entrada)",
    "Password should be at least 6 characters":
      "A senha precisa ter pelo menos 6 caracteres",
    "Unable to validate email address: invalid format": "Email inválido",
  };
  return traducoes[msg] || msg;
}
