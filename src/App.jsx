import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Plus, Trash2, Wallet, Calendar, X, TrendingUp, TrendingDown, Sparkles,
  Repeat, Home, PieChart as PieIcon, AlertCircle, Check, GraduationCap,
  Utensils, User, Car, ShoppingBag, Heart, Plane, Coffee, Tag, LogOut, Loader2,
  Layers, FastForward, Clock, History, CheckCircle2, Bell,
} from "lucide-react";
import { supabase } from "./supabase";
import Auth from "./Auth";

const QUOTES = [
  { text: "Hoje você está mais perto do que ontem.", author: "" },
  { text: "A persistência realiza o impossível.", author: "Provérbio chinês" },
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "Não espere por uma crise para descobrir o que é importante em sua vida.", author: "Platão" },
  { text: "A disciplina é a ponte entre objetivos e conquistas.", author: "Jim Rohn" },
  { text: "Cuide dos centavos, que os reais cuidarão de si mesmos.", author: "Benjamin Franklin" },
  { text: "Não é sobre ter tempo, é sobre fazer tempo.", author: "" },
  { text: "O futuro pertence àqueles que acreditam na beleza de seus sonhos.", author: "Eleanor Roosevelt" },
  { text: "Você é mais forte do que pensa, mais capaz do que imagina.", author: "" },
  { text: "A jornada de mil milhas começa com um único passo.", author: "Lao-Tsé" },
  { text: "Não conte os dias, faça os dias contarem.", author: "Muhammad Ali" },
  { text: "Investir em conhecimento rende sempre os melhores juros.", author: "Benjamin Franklin" },
  { text: "Pequenos passos todos os dias somam grandes conquistas.", author: "" },
  { text: "A verdadeira riqueza é a saúde, não peças de ouro e prata.", author: "Mahatma Gandhi" },
  { text: "Acredite que você pode, e você já está no meio do caminho.", author: "Theodore Roosevelt" },
];

const ICONS_MAP = {
  GraduationCap, Utensils, User, Home, Car,
  ShoppingBag, Heart, Plane, Coffee, Tag,
};

const CATEGORIAS_PADRAO = [
  { nome: "Faculdade", cor: "#a78bfa", icone: "GraduationCap" },
  { nome: "Comida", cor: "#fb923c", icone: "Utensils" },
  { nome: "Gastos pessoais", cor: "#f472b6", icone: "User" },
  { nome: "Moradia", cor: "#60a5fa", icone: "Home" },
  { nome: "Transporte", cor: "#34d399", icone: "Car" },
];

const CORES_DISPONIVEIS = [
  "#a78bfa", "#fb923c", "#f472b6", "#60a5fa", "#34d399",
  "#fbbf24", "#f87171", "#22d3ee", "#a3e635", "#e879f9",
];

const ICONES_DISPONIVEIS = [
  "Tag", "GraduationCap", "Utensils", "User", "Home",
  "Car", "ShoppingBag", "Heart", "Plane", "Coffee",
];

const formatBRL = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const hojeISO = () => new Date().toISOString().split("T")[0];
const mesAtual = () => new Date().toISOString().substring(0, 7);
const diaAtual = () => new Date().getDate();
const nomeMes = (mesISO) => {
  const [ano, mes] = mesISO.split("-");
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${meses[parseInt(mes) - 1]} ${ano}`;
};
const mesAnterior = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().substring(0, 7);
};
const formatarDataBR = (data) => {
  if (!data) return "—";
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
};

export default function App() {
  const [session, setSession] = useState(null);
  const [carregandoSession, setCarregandoSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCarregandoSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (carregandoSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Loader2 className="text-amber-200/60 animate-spin" size={28} />
      </div>
    );
  }

  if (!session) return <Auth />;
  return <AppLogado session={session} />;
}

function AppLogado({ session }) {
  const userId = session.user.id;
  const userNome = session.user.user_metadata?.nome || session.user.email.split("@")[0];

  const [aba, setAba] = useState("home");
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [receitas, setReceitas] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [assinaturas, setAssinaturas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [quote, setQuote] = useState(QUOTES[0]);
  const [mostrarResumo, setMostrarResumo] = useState(false);
  const [modalReceita, setModalReceita] = useState(false);
  const [modalDespesa, setModalDespesa] = useState(false);
  const [modalAssinatura, setModalAssinatura] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalAdiantar, setModalAdiantar] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [avisoFechado, setAvisoFechado] = useState(false);

  const carregarTudo = async () => {
    const [r, d, a, c] = await Promise.all([
      supabase.from("receitas").select("*").eq("user_id", userId),
      supabase.from("despesas").select("*").eq("user_id", userId),
      supabase.from("assinaturas").select("*").eq("user_id", userId),
      supabase.from("categorias").select("*").eq("user_id", userId),
    ]);
    setReceitas(r.data || []);
    setDespesas(d.data || []);
    setAssinaturas(a.data || []);
    if (!c.data || c.data.length === 0) {
      const novas = CATEGORIAS_PADRAO.map((cat) => ({ ...cat, user_id: userId, padrao: true }));
      const { data: criadas } = await supabase.from("categorias").insert(novas).select();
      setCategorias(criadas || []);
    } else {
      setCategorias(c.data);
    }
  };

  useEffect(() => {
    const carregar = async () => {
      setCarregandoDados(true);
      await carregarTudo();
      setCarregandoDados(false);
      const seed = parseInt(hojeISO().replace(/-/g, ""));
      setQuote(QUOTES[seed % QUOTES.length]);
      const resumoVisualizado = localStorage.getItem(`resumoVisualizado_${userId}`);
      if (diaAtual() >= 5 && resumoVisualizado !== mesAtual()) {
        setTimeout(() => setMostrarResumo(true), 800);
      }
    };
    carregar();
  }, [userId]);

  const adicionarReceita = async (n) => {
    const { data, error } = await supabase.from("receitas").insert({ ...n, user_id: userId }).select().single();
    if (!error && data) setReceitas([...receitas, data]);
  };
  const removerReceita = async (id) => {
    const { error } = await supabase.from("receitas").delete().eq("id", id);
    if (!error) setReceitas(receitas.filter((r) => r.id !== id));
  };

  const adicionarDespesa = async (n) => {
    const { parcelas, dataVencimento, ...resto } = n;
    const grupoId = parcelas > 1 ? crypto.randomUUID() : null;
    const lista = [];
    const dataBase = new Date(dataVencimento + "T12:00:00");

    for (let i = 0; i < parcelas; i++) {
      const dt = new Date(dataBase);
      dt.setMonth(dt.getMonth() + i);
      const dataStr = dt.toISOString().split("T")[0];
      lista.push({
        ...resto,
        user_id: userId,
        data: dataStr,
        data_vencimento: dataStr,
        status: "pendente",
        parcela_atual: parcelas > 1 ? i + 1 : null,
        parcelas_total: parcelas > 1 ? parcelas : null,
        grupo_parcelamento: grupoId,
      });
    }

    const { data, error } = await supabase.from("despesas").insert(lista).select();
    if (!error && data) setDespesas([...despesas, ...data]);
  };

  const removerDespesa = async (id) => {
    const { error } = await supabase.from("despesas").delete().eq("id", id);
    if (!error) setDespesas(despesas.filter((d) => d.id !== id));
  };

  const marcarComoPaga = async (id) => {
    const hoje = hojeISO();
    const { data, error } = await supabase
      .from("despesas")
      .update({ status: "paga", data_pagamento: hoje })
      .eq("id", id)
      .select()
      .single();
    if (!error && data) {
      setDespesas(despesas.map((d) => (d.id === id ? data : d)));
    }
  };

  const marcarMultiplasComoPagas = async (ids) => {
    const hoje = hojeISO();
    const { data, error } = await supabase
      .from("despesas")
      .update({ status: "paga", data_pagamento: hoje })
      .in("id", ids)
      .select();
    if (!error && data) {
      setDespesas(despesas.map((d) => {
        const atualizada = data.find((nd) => nd.id === d.id);
        return atualizada || d;
      }));
      setModalAdiantar(null);
    }
  };

  const adicionarAssinatura = async (n) => {
    const { data, error } = await supabase.from("assinaturas").insert({ ...n, user_id: userId }).select().single();
    if (!error && data) setAssinaturas([...assinaturas, data]);
  };
  const removerAssinatura = async (id) => {
    const { error } = await supabase.from("assinaturas").delete().eq("id", id);
    if (!error) setAssinaturas(assinaturas.filter((a) => a.id !== id));
  };
  const adicionarCategoria = async (n) => {
    const { data, error } = await supabase.from("categorias").insert({ ...n, user_id: userId, padrao: false }).select().single();
    if (!error && data) setCategorias([...categorias, data]);
  };
  const removerCategoria = async (id) => {
    if (despesas.some((d) => d.categoria_id === id)) {
      alert("Não é possível remover: existem despesas nesta categoria.");
      return;
    }
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (!error) setCategorias(categorias.filter((c) => c.id !== id));
  };
  const fecharResumo = () => {
    setMostrarResumo(false);
    localStorage.setItem(`resumoVisualizado_${userId}`, mesAtual());
  };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  const despesasPendentes = useMemo(
    () => despesas.filter((d) => d.status === "pendente" || !d.status),
    [despesas]
  );
  const despesasPagas = useMemo(
    () => despesas.filter((d) => d.status === "paga"),
    [despesas]
  );

  const totalReceitasMes = useMemo(() => receitas.filter((r) => (r.mes || mesAtual()) === mesAtual()).reduce((s, r) => s + parseFloat(r.valor || 0), 0), [receitas]);
  const totalAssinaturasMes = useMemo(() => assinaturas.reduce((s, a) => s + parseFloat(a.valor || 0), 0), [assinaturas]);

  const despesasPagasMesAtual = useMemo(
    () => despesasPagas.filter((d) => d.data_pagamento && d.data_pagamento.startsWith(mesAtual())),
    [despesasPagas]
  );
  const totalDespesasPagasMes = useMemo(
    () => despesasPagasMesAtual.reduce((s, d) => s + parseFloat(d.valor || 0), 0),
    [despesasPagasMesAtual]
  );

  const totalDespesasMes = totalDespesasPagasMes + totalAssinaturasMes;
  const saldo = totalReceitasMes - totalDespesasMes;

  const despesasPendentesMesAtual = useMemo(
    () => despesasPendentes.filter((d) => {
      const dataRef = d.data_vencimento || d.data;
      return dataRef && dataRef.startsWith(mesAtual());
    }),
    [despesasPendentes]
  );
  const totalPendentesMes = useMemo(
    () => despesasPendentesMesAtual.reduce((s, d) => s + parseFloat(d.valor || 0), 0),
    [despesasPendentesMesAtual]
  );

  const despesasPorCategoria = useMemo(() => {
    const agrupado = {};
    despesasPagasMesAtual.forEach((d) => {
      agrupado[d.categoria_id] = (agrupado[d.categoria_id] || 0) + parseFloat(d.valor || 0);
    });
    return categorias.map((c) => ({ nome: c.nome, valor: agrupado[c.id] || 0, cor: c.cor })).filter((c) => c.valor > 0);
  }, [despesasPagasMesAtual, categorias]);

  const resumoMesAnterior = useMemo(() => {
    const ma = mesAnterior();
    const desps = despesasPagas.filter((d) => d.data_pagamento && d.data_pagamento.startsWith(ma));
    const recs = receitas.filter((r) => (r.mes || mesAtual()) === ma);
    const totalD = desps.reduce((s, d) => s + parseFloat(d.valor || 0), 0) + totalAssinaturasMes;
    const totalR = recs.reduce((s, r) => s + parseFloat(r.valor || 0), 0);
    const porCat = {};
    desps.forEach((d) => { porCat[d.categoria_id] = (porCat[d.categoria_id] || 0) + parseFloat(d.valor || 0); });
    let maiorCat = null; let maiorVal = 0;
    Object.entries(porCat).forEach(([id, v]) => { if (v > maiorVal) { maiorVal = v; maiorCat = categorias.find((c) => c.id === id); } });
    return { mes: ma, totalDespesas: totalD, totalReceitas: totalR, saldo: totalR - totalD, maiorCategoria: maiorCat, maiorValor: maiorVal };
  }, [despesasPagas, receitas, categorias, totalAssinaturasMes]);

  const proximasAssinaturas = useMemo(() => {
    const hoje = new Date(); const diaH = hoje.getDate();
    return [...assinaturas].map((a) => {
      const dia = parseInt(a.dia_vencimento);
      let diasRestantes;
      if (dia >= diaH) diasRestantes = dia - diaH;
      else { const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate(); diasRestantes = ultimoDiaMes - diaH + dia; }
      return { ...a, diasRestantes };
    }).sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [assinaturas]);

  const avisoDespesas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 7);

    const vencidas = [];
    const vencendo = [];

    despesasPendentes.forEach((d) => {
      if (!d.data_vencimento) return;
      const venc = new Date(d.data_vencimento + "T00:00:00");
      if (venc < hoje) vencidas.push(d);
      else if (venc <= limite) vencendo.push(d);
    });

    return { vencidas, vencendo };
  }, [despesasPendentes]);

  const parcelasPendentesDoGrupo = (grupoId) => {
    if (!grupoId) return [];
    return despesasPendentes.filter((d) => d.grupo_parcelamento === grupoId);
  };

  if (carregandoDados) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]"><Loader2 className="text-amber-200/60 animate-spin" size={28} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-amber-50 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; font-variation-settings: "SOFT" 50, "WONK" 1; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }
        body { background: #0a0a0f; }
        .grain::before { content: ''; position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E"); opacity: 0.03; pointer-events: none; z-index: 1; }
        .glow-amber { background: radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.15), transparent 70%); }
        .glow-purple { background: radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.12), transparent 70%); }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeInUp { animation: fadeInUp 0.7s ease-out forwards; opacity: 0; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
        .animate-scaleIn { animation: scaleIn 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.1s; } .delay-2 { animation-delay: 0.25s; } .delay-3 { animation-delay: 0.4s; } .delay-4 { animation-delay: 0.55s; } .delay-5 { animation-delay: 0.7s; }
        .scroll-fine::-webkit-scrollbar { width: 6px; }
        .scroll-fine::-webkit-scrollbar-track { background: transparent; }
        .scroll-fine::-webkit-scrollbar-thumb { background: rgba(251, 191, 36, 0.2); border-radius: 3px; }
        .num-tabular { font-variant-numeric: tabular-nums; font-style: normal; }
      `}</style>

      <div className="fixed inset-0 grain pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] glow-amber pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] glow-purple pointer-events-none" />

      {!avisoFechado && (avisoDespesas.vencidas.length > 0 || avisoDespesas.vencendo.length > 0) && (
        <AvisoVencimentos
          vencidas={avisoDespesas.vencidas}
          vencendo={avisoDespesas.vencendo}
          onFechar={() => setAvisoFechado(true)}
        />
      )}

      <header className="relative z-10 px-6 md:px-12 pt-8 pb-4 flex items-center justify-between border-b border-amber-100/5">
        <div className="animate-fadeIn">
          <div className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase">Finanças · {nomeMes(mesAtual())}</div>
          <h1 className="font-display text-2xl md:text-3xl italic text-amber-50 mt-1">olá, {userNome}</h1>
        </div>
        <div className="flex items-center gap-4 animate-fadeIn delay-1">
          <div className="relative">
            <button onClick={() => setMenuAberto(!menuAberto)} className="w-10 h-10 rounded-full bg-amber-200/10 border border-amber-200/30 hover:bg-amber-200/20 flex items-center justify-center text-amber-200 font-display italic transition">
              {userNome[0]?.toUpperCase()}
            </button>
            {menuAberto && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuAberto(false)} />
                <div className="absolute right-0 top-12 z-30 bg-[#15151c] border border-amber-100/15 rounded-xl shadow-xl min-w-[200px] overflow-hidden animate-fadeIn">
                  <div className="p-3 border-b border-amber-100/10">
                    <div className="font-body text-sm text-amber-50">{userNome}</div>
                    <div className="font-mono text-[10px] text-amber-100/40 truncate">{session.user.email}</div>
                  </div>
                  <button onClick={handleLogout} className="w-full px-3 py-3 text-left hover:bg-amber-100/5 transition flex items-center gap-2 text-amber-100/80 font-body text-sm">
                    <LogOut size={14} />Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="relative z-10 px-6 md:px-12 py-4 flex gap-1 overflow-x-auto scroll-fine border-b border-amber-100/5">
        {[
          { id: "home", label: "Início", icon: Home },
          { id: "despesas", label: "Despesas", icon: PieIcon },
          { id: "receitas", label: "Receitas", icon: Wallet },
          { id: "assinaturas", label: "Assinaturas", icon: Repeat },
        ].map((t) => {
          const Icon = t.icon; const ativo = aba === t.id;
          return (
            <button key={t.id} onClick={() => setAba(t.id)} className={`px-4 py-2 rounded-full font-body text-sm flex items-center gap-2 transition-all whitespace-nowrap ${ativo ? "bg-amber-100 text-[#0a0a0f]" : "text-amber-100/50 hover:text-amber-100 hover:bg-amber-100/5"}`}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </nav>

      <main className="relative z-10 px-6 md:px-12 py-8 max-w-6xl mx-auto">
        {aba === "home" && <HomeAba quote={quote} saldo={saldo} totalReceitasMes={totalReceitasMes} totalDespesasMes={totalDespesasMes} totalPendentesMes={totalPendentesMes} despesasPorCategoria={despesasPorCategoria} proximasAssinaturas={proximasAssinaturas} />}
        {aba === "despesas" && <DespesasAba despesasPendentes={despesasPendentes} despesasPagas={despesasPagas} despesasPagasMesAtual={despesasPagasMesAtual} categorias={categorias} totalDespesasPagasMes={totalDespesasPagasMes} totalPendentesMes={totalPendentesMes} despesasPendentesMesAtual={despesasPendentesMesAtual} onAdicionar={() => setModalDespesa(true)} onRemover={removerDespesa} onMarcarPaga={marcarComoPaga} onAdiantar={(g) => setModalAdiantar(g)} parcelasPendentesDoGrupo={parcelasPendentesDoGrupo} onAdicionarCategoria={() => setModalCategoria(true)} onRemoverCategoria={removerCategoria} />}
        {aba === "receitas" && <ReceitasAba receitas={receitas} totalReceitasMes={totalReceitasMes} onAdicionar={() => setModalReceita(true)} onRemover={removerReceita} />}
        {aba === "assinaturas" && <AssinaturasAba assinaturas={proximasAssinaturas} total={totalAssinaturasMes} onAdicionar={() => setModalAssinatura(true)} onRemover={removerAssinatura} />}
      </main>

      <footer className="relative z-10 px-6 md:px-12 py-8 mt-12 border-t border-amber-100/5">
        <div className="flex items-center justify-between text-amber-100/30 text-xs font-mono tracking-widest">
          <span>FINANÇAS PESSOAIS</span><span>·</span><span>v3</span>
        </div>
      </footer>

      {modalReceita && <ModalReceita onFechar={() => setModalReceita(false)} onSalvar={async (r) => { await adicionarReceita(r); setModalReceita(false); }} />}
      {modalDespesa && <ModalDespesa categorias={categorias} onFechar={() => setModalDespesa(false)} onSalvar={async (d) => { await adicionarDespesa(d); setModalDespesa(false); }} />}
      {modalAssinatura && <ModalAssinatura onFechar={() => setModalAssinatura(false)} onSalvar={async (a) => { await adicionarAssinatura(a); setModalAssinatura(false); }} />}
      {modalCategoria && <ModalCategoria onFechar={() => setModalCategoria(false)} onSalvar={async (c) => { await adicionarCategoria(c); setModalCategoria(false); }} />}
      {modalAdiantar && <ModalAdiantarParcelas parcelas={parcelasPendentesDoGrupo(modalAdiantar)} onFechar={() => setModalAdiantar(null)} onConfirmar={marcarMultiplasComoPagas} />}
      {mostrarResumo && <ResumoMensal resumo={resumoMesAnterior} onFechar={fecharResumo} />}
    </div>
  );
}

function AvisoVencimentos({ vencidas, vencendo, onFechar }) {
  const totalVencidas = vencidas.reduce((s, d) => s + Number(d.valor), 0);
  const totalVencendo = vencendo.reduce((s, d) => s + Number(d.valor), 0);
  const formatarCurta = (data) => {
    const [, m, d] = data.split("-");
    return `${d}/${m}`;
  };

  return (
    <div className="fixed top-4 right-4 left-4 md:left-auto md:max-w-sm z-30 animate-fadeInUp">
      <div className="bg-[#15151c]/95 backdrop-blur border border-amber-200/20 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-amber-100/10 bg-gradient-to-r from-rose-500/10 to-amber-500/10">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-amber-300" />
            <h3 className="font-display italic text-amber-50">Você tem contas a pagar</h3>
          </div>
          <button onClick={onFechar} className="text-amber-100/40 hover:text-amber-100 p-1 rounded transition">
            <X size={14} />
          </button>
        </div>

        {vencidas.length > 0 && (
          <div className="p-4 border-b border-amber-100/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={12} className="text-rose-400" />
              <span className="font-mono text-[10px] tracking-widest text-rose-300/80 uppercase font-semibold">
                {vencidas.length} {vencidas.length === 1 ? "vencida" : "vencidas"}
              </span>
              <span className="ml-auto font-mono num-tabular text-rose-300 text-sm">
                {formatBRL(totalVencidas)}
              </span>
            </div>
            <ul className="space-y-1 text-xs text-amber-100/70">
              {vencidas.slice(0, 3).map((d) => (
                <li key={d.id} className="flex justify-between gap-2 font-body">
                  <span className="truncate">
                    {d.descricao}
                    {d.parcelas_total > 1 && ` (${d.parcela_atual}/${d.parcelas_total})`}
                  </span>
                  <span className="font-mono num-tabular text-rose-400/80 shrink-0">
                    {formatarCurta(d.data_vencimento)}
                  </span>
                </li>
              ))}
              {vencidas.length > 3 && (
                <li className="text-amber-100/40 font-mono text-[10px]">
                  +{vencidas.length - 3} {vencidas.length - 3 === 1 ? "outra" : "outras"}
                </li>
              )}
            </ul>
          </div>
        )}

        {vencendo.length > 0 && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={12} className="text-amber-400" />
              <span className="font-mono text-[10px] tracking-widest text-amber-300/80 uppercase font-semibold">
                {vencendo.length} em até 7 dias
              </span>
              <span className="ml-auto font-mono num-tabular text-amber-300 text-sm">
                {formatBRL(totalVencendo)}
              </span>
            </div>
            <ul className="space-y-1 text-xs text-amber-100/70">
              {vencendo.slice(0, 3).map((d) => (
                <li key={d.id} className="flex justify-between gap-2 font-body">
                  <span className="truncate">
                    {d.descricao}
                    {d.parcelas_total > 1 && ` (${d.parcela_atual}/${d.parcelas_total})`}
                  </span>
                  <span className="font-mono num-tabular text-amber-400/80 shrink-0">
                    {formatarCurta(d.data_vencimento)}
                  </span>
                </li>
              ))}
              {vencendo.length > 3 && (
                <li className="text-amber-100/40 font-mono text-[10px]">
                  +{vencendo.length - 3} {vencendo.length - 3 === 1 ? "outra" : "outras"}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeAba({ quote, saldo, totalReceitasMes, totalDespesasMes, totalPendentesMes, despesasPorCategoria, proximasAssinaturas }) {
  return (
    <div className="space-y-10">
      <section className="animate-fadeInUp delay-1 py-12 md:py-20 text-center relative">
        <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 text-amber-300/30" size={20} />
        <p className="font-display text-3xl md:text-5xl italic leading-tight text-amber-50 max-w-3xl mx-auto px-4">"{quote.text}"</p>
        {quote.author && <p className="font-mono text-xs tracking-[0.3em] text-amber-200/40 uppercase mt-6">— {quote.author}</p>}
      </section>
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardResumo label="Receitas do mês" valor={totalReceitasMes} icon={TrendingUp} cor="text-emerald-300" delay={2} />
        <CardResumo label="Pago este mês" valor={totalDespesasMes} icon={CheckCircle2} cor="text-rose-300" delay={3} />
        <CardResumo label="A pagar" valor={totalPendentesMes} icon={Clock} cor="text-amber-300" delay={3} />
        <CardResumo label="Saldo" valor={saldo} icon={Wallet} cor={saldo >= 0 ? "text-amber-300" : "text-rose-400"} destaque delay={4} />
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-fadeInUp delay-5 bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl p-6">
          <h3 className="font-display text-xl italic text-amber-100 mb-1">Gastos por categoria</h3>
          <p className="font-mono text-[10px] tracking-widest text-amber-100/30 uppercase mb-6">Pagos este mês</p>
          {despesasPorCategoria.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center"><p className="font-body text-amber-100/40 text-sm">Nenhum gasto pago neste mês</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={despesasPorCategoria} dataKey="valor" nameKey="nome" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {despesasPorCategoria.map((entry, idx) => (<Cell key={idx} fill={entry.cor} stroke="none" />))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", fontSize: "12px" }} formatter={(value) => formatBRL(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {despesasPorCategoria.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {despesasPorCategoria.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.cor }} />
                  <span className="text-amber-100/70 font-body truncate">{c.nome}</span>
                  <span className="text-amber-100/40 font-mono num-tabular ml-auto">{formatBRL(c.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="animate-fadeInUp delay-5 bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl p-6">
          <h3 className="font-display text-xl italic text-amber-100 mb-1">Próximos vencimentos</h3>
          <p className="font-mono text-[10px] tracking-widest text-amber-100/30 uppercase mb-6">Assinaturas</p>
          {proximasAssinaturas.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center"><p className="font-body text-amber-100/40 text-sm">Nenhuma assinatura cadastrada</p></div>
          ) : (
            <div className="space-y-2">
              {proximasAssinaturas.slice(0, 6).map((a) => {
                const proximo = a.diasRestantes <= 3;
                return (
                  <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg transition ${proximo ? "bg-rose-500/10 border border-rose-400/30" : "bg-amber-100/[0.02] border border-amber-100/5"}`}>
                    <div className="flex items-center gap-3">
                      {proximo && <AlertCircle size={14} className="text-rose-400" />}
                      <div>
                        <div className="font-body text-sm text-amber-50">{a.nome}</div>
                        <div className="font-mono text-[10px] text-amber-100/40">dia {a.dia_vencimento} · {a.diasRestantes === 0 ? "hoje" : a.diasRestantes === 1 ? "amanhã" : `em ${a.diasRestantes} dias`}</div>
                      </div>
                    </div>
                    <div className="font-mono num-tabular text-sm text-amber-200">{formatBRL(a.valor)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CardResumo({ label, valor, icon: Icon, cor, destaque, delay }) {
  return (
    <div className={`animate-fadeInUp delay-${delay} relative rounded-2xl p-6 border ${destaque ? "bg-amber-100/5 border-amber-200/30" : "bg-amber-100/[0.02] border-amber-100/10"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] tracking-widest text-amber-100/40 uppercase">{label}</span>
        <Icon size={16} className={cor} />
      </div>
      <div className={`font-mono num-tabular text-2xl font-bold ${cor}`}>{formatBRL(valor)}</div>
    </div>
  );
}

function DespesasAba({ despesasPendentes, despesasPagas, despesasPagasMesAtual, categorias, totalDespesasPagasMes, totalPendentesMes, despesasPendentesMesAtual, onAdicionar, onRemover, onMarcarPaga, onAdiantar, parcelasPendentesDoGrupo, onAdicionarCategoria, onRemoverCategoria }) {
  const [subAba, setSubAba] = useState("pendentes");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  const filtrarPorCategoria = (lista) =>
    categoriaFiltro === "todas" ? lista : lista.filter((d) => d.categoria_id === categoriaFiltro);

  const pendentesFiltradas = filtrarPorCategoria(despesasPendentes);
  const pagasFiltradas = filtrarPorCategoria(despesasPagasMesAtual);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase">
            {subAba === "pendentes" ? "A pagar" : "Pago este mês"}
          </p>
          <h2 className="font-mono num-tabular text-4xl font-bold text-amber-50 mt-1">
            {formatBRL(subAba === "pendentes" ? totalPendentesMes : totalDespesasPagasMes)}
          </h2>
        </div>
        <div className="flex gap-2">
          <button onClick={onAdicionarCategoria} className="px-4 py-2.5 rounded-full bg-amber-100/5 border border-amber-100/20 text-amber-100/80 hover:bg-amber-100/10 font-body text-sm flex items-center gap-2 transition">
            <Tag size={14} />Nova categoria
          </button>
          <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-amber-200 text-[#0a0a0f] hover:bg-amber-100 font-body text-sm flex items-center gap-2 transition">
            <Plus size={14} />Nova despesa
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-amber-100/[0.03] p-1 rounded-full w-fit border border-amber-100/10">
        <button onClick={() => setSubAba("pendentes")} className={`px-4 py-1.5 rounded-full font-body text-xs flex items-center gap-2 transition ${subAba === "pendentes" ? "bg-amber-200 text-[#0a0a0f]" : "text-amber-100/60 hover:text-amber-100"}`}>
          <Clock size={12} />Pendentes
          <span className="font-mono num-tabular">({despesasPendentes.length})</span>
        </button>
        <button onClick={() => setSubAba("pagas")} className={`px-4 py-1.5 rounded-full font-body text-xs flex items-center gap-2 transition ${subAba === "pagas" ? "bg-amber-200 text-[#0a0a0f]" : "text-amber-100/60 hover:text-amber-100"}`}>
          <History size={12} />Histórico
          <span className="font-mono num-tabular">({despesasPagas.length})</span>
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategoriaFiltro("todas")} className={`px-3 py-1.5 rounded-full font-body text-xs transition ${categoriaFiltro === "todas" ? "bg-amber-100 text-[#0a0a0f]" : "bg-amber-100/5 text-amber-100/60 border border-amber-100/10"}`}>Todas</button>
        {categorias.map((c) => {
          const Icon = ICONS_MAP[c.icone] || Tag; const ativa = categoriaFiltro === c.id;
          return (
            <button key={c.id} onClick={() => setCategoriaFiltro(c.id)} className={`group px-3 py-1.5 rounded-full font-body text-xs flex items-center gap-2 transition ${ativa ? "text-[#0a0a0f]" : "text-amber-100/70"}`} style={{ background: ativa ? c.cor : "rgba(251,191,36,0.05)", border: ativa ? "none" : "1px solid rgba(251,191,36,0.1)" }}>
              <Icon size={12} />{c.nome}
              {!c.padrao && (<span onClick={(e) => { e.stopPropagation(); if (confirm(`Remover categoria "${c.nome}"?`)) onRemoverCategoria(c.id); }} className="opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-pointer"><X size={11} /></span>)}
            </button>
          );
        })}
      </div>

      <div className="bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl overflow-hidden">
        {(subAba === "pendentes" ? pendentesFiltradas : pagasFiltradas).length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-body text-amber-100/40 text-sm">
              {subAba === "pendentes" ? "Nenhuma despesa pendente — você está em dia ✨" : "Nenhuma despesa paga neste filtro"}
            </p>
            <p className="font-mono text-[10px] text-amber-100/30 mt-2 tracking-widest">
              {subAba === "pendentes" ? "OU CRIE UMA NOVA DESPESA" : ""}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-amber-100/5">
            {(subAba === "pendentes" ? pendentesFiltradas : pagasFiltradas)
              .sort((a, b) => {
                const dataA = a.data_vencimento || a.data || "";
                const dataB = b.data_vencimento || b.data || "";
                return subAba === "pendentes" ? dataA.localeCompare(dataB) : dataB.localeCompare(dataA);
              })
              .map((d) => (
                <CardDespesaItem
                  key={d.id}
                  despesa={d}
                  categorias={categorias}
                  ehPendente={subAba === "pendentes"}
                  onMarcarPaga={onMarcarPaga}
                  onRemover={onRemover}
                  onAdiantar={onAdiantar}
                  parcelasPendentesDoGrupo={parcelasPendentesDoGrupo}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CardDespesaItem({ despesa, categorias, ehPendente, onMarcarPaga, onRemover, onAdiantar, parcelasPendentesDoGrupo }) {
  const cat = categorias.find((c) => c.id === despesa.categoria_id);
  const Icon = cat ? ICONS_MAP[cat.icone] || Tag : Tag;
  const ehParcelada = despesa.parcelas_total && despesa.parcelas_total > 1;

  const podeAdiantar = ehParcelada && ehPendente && despesa.grupo_parcelamento &&
    parcelasPendentesDoGrupo(despesa.grupo_parcelamento).length > 1;

  const corData = () => {
    if (!ehPendente || !despesa.data_vencimento) return "text-amber-100/40";
    const venc = new Date(despesa.data_vencimento + "T00:00:00");
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dias = Math.floor((venc - hoje) / 86400000);
    if (dias < 0) return "text-rose-400";
    if (dias <= 3) return "text-amber-400";
    return "text-amber-100/40";
  };

  return (
    <div className="flex items-center gap-3 p-4 hover:bg-amber-100/[0.02] transition group">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: cat ? `${cat.cor}20` : "#94a3b820", color: cat?.cor || "#94a3b8" }}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-body text-amber-50 truncate">{despesa.descricao}</div>
          {ehParcelada && (
            <span className="bg-amber-200/10 text-amber-200/80 text-[10px] px-2 py-0.5 rounded-full border border-amber-200/20 flex items-center gap-1 font-mono num-tabular">
              <Layers size={10} />
              {despesa.parcela_atual}/{despesa.parcelas_total}
            </span>
          )}
        </div>
        <div className={`font-mono text-[10px] mt-0.5 num-tabular ${corData()}`}>
          {cat?.nome} · {ehPendente
            ? (despesa.data_vencimento ? `vence ${formatarDataBR(despesa.data_vencimento)}` : "sem vencimento")
            : (despesa.data_pagamento ? `paga em ${formatarDataBR(despesa.data_pagamento)}` : "")}
        </div>
      </div>
      <div className="font-mono num-tabular text-sm text-amber-200 font-semibold">{formatBRL(despesa.valor)}</div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        {ehPendente && (
          <>
            <button onClick={() => onMarcarPaga(despesa.id)} title="Marcar como paga"
              className="p-1.5 text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition">
              <Check size={14} />
            </button>
            {podeAdiantar && (
              <button onClick={() => onAdiantar(despesa.grupo_parcelamento)} title="Adiantar parcelas"
                className="p-1.5 text-amber-300/70 hover:text-amber-300 hover:bg-amber-500/10 rounded transition">
                <FastForward size={14} />
              </button>
            )}
          </>
        )}
        <button onClick={() => onRemover(despesa.id)} title="Apagar"
          className="p-1.5 text-amber-100/30 hover:text-rose-400 hover:bg-rose-500/10 rounded transition">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function ReceitasAba({ receitas, totalReceitasMes, onAdicionar, onRemover }) {
  const recDoMes = receitas.filter((r) => (r.mes || mesAtual()) === mesAtual());
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase">Receitas deste mês</p>
          <h2 className="font-mono num-tabular text-4xl font-bold text-emerald-200 mt-1">{formatBRL(totalReceitasMes)}</h2>
        </div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-emerald-300 text-[#0a0a0f] hover:bg-emerald-200 font-body text-sm flex items-center gap-2 transition"><Plus size={14} />Nova receita</button>
      </div>
      <div className="bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl overflow-hidden">
        {recDoMes.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet size={28} className="mx-auto text-amber-100/20 mb-3" />
            <p className="font-body text-amber-100/40 text-sm">Nenhuma receita registrada este mês</p>
            <p className="font-mono text-[10px] text-amber-100/30 mt-2 tracking-widest">REGISTRE SEU SALÁRIO, FREELAS, ETC.</p>
          </div>
        ) : (
          <div className="divide-y divide-amber-100/5">
            {recDoMes.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-amber-100/[0.02] transition group">
                <div className="w-10 h-10 rounded-xl bg-emerald-300/10 text-emerald-300 flex items-center justify-center flex-shrink-0"><TrendingUp size={16} /></div>
                <div className="flex-1">
                  <div className="font-body text-amber-50">{r.fonte}</div>
                  <div className="font-mono text-[10px] text-amber-100/40 mt-0.5">{nomeMes(r.mes || mesAtual())}</div>
                </div>
                <div className="font-mono num-tabular text-sm text-emerald-300">{formatBRL(r.valor)}</div>
                <button onClick={() => onRemover(r.id)} className="opacity-0 group-hover:opacity-100 text-amber-100/30 hover:text-rose-400 transition"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssinaturasAba({ assinaturas, total, onAdicionar, onRemover }) {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase">Total mensal em assinaturas</p>
          <h2 className="font-mono num-tabular text-4xl font-bold text-amber-50 mt-1">{formatBRL(total)}</h2>
        </div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-amber-200 text-[#0a0a0f] hover:bg-amber-100 font-body text-sm flex items-center gap-2 transition"><Plus size={14} />Nova assinatura</button>
      </div>
      <div className="bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl overflow-hidden">
        {assinaturas.length === 0 ? (
          <div className="p-12 text-center">
            <Repeat size={28} className="mx-auto text-amber-100/20 mb-3" />
            <p className="font-body text-amber-100/40 text-sm">Nenhuma assinatura cadastrada</p>
            <p className="font-mono text-[10px] text-amber-100/30 mt-2 tracking-widest">NETFLIX, SPOTIFY, ICLOUD, ACADEMIA...</p>
          </div>
        ) : (
          <div className="divide-y divide-amber-100/5">
            {assinaturas.map((a) => {
              const proximo = a.diasRestantes <= 3;
              return (
                <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-amber-100/[0.02] transition group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${proximo ? "bg-rose-400/15 text-rose-400" : "bg-amber-200/10 text-amber-200"}`}><Calendar size={16} /></div>
                  <div className="flex-1">
                    <div className="font-body text-amber-50">{a.nome}</div>
                    <div className="font-mono text-[10px] text-amber-100/40 mt-0.5">vence dia {a.dia_vencimento} · {a.diasRestantes === 0 ? "HOJE" : a.diasRestantes === 1 ? "AMANHÃ" : `em ${a.diasRestantes} dias`}</div>
                  </div>
                  <div className="font-mono num-tabular text-sm text-amber-200">{formatBRL(a.valor)}</div>
                  <button onClick={() => onRemover(a.id)} className="opacity-0 group-hover:opacity-100 text-amber-100/30 hover:text-rose-400 transition"><Trash2 size={14} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ModalBase({ titulo, subtitulo, onFechar, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md animate-scaleIn max-h-[90vh] overflow-y-auto scroll-fine" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10 sticky top-0 bg-[#15151c] z-10">
          <div>
            <h3 className="font-display text-2xl italic text-amber-50">{titulo}</h3>
            {subtitulo && <p className="font-mono text-[10px] tracking-widest text-amber-100/40 uppercase mt-1">{subtitulo}</p>}
          </div>
          <button onClick={onFechar} className="text-amber-100/40 hover:text-amber-100 transition"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const inputStyle = "w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 font-body text-amber-50 placeholder:text-amber-100/30 focus:outline-none focus:border-amber-200/40 transition";
const labelStyle = "block font-mono text-[10px] tracking-[0.2em] text-amber-100/50 uppercase mb-2";
const btnSalvar = "w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium hover:bg-amber-100 transition flex items-center justify-center gap-2 disabled:opacity-50";

function ModalReceita({ onFechar, onSalvar }) {
  const [fonte, setFonte] = useState(""); const [valor, setValor] = useState(""); const [mes, setMes] = useState(mesAtual()); const [salvando, setSalvando] = useState(false);
  const submit = async () => { if (!fonte || !valor) return; setSalvando(true); await onSalvar({ fonte, valor: parseFloat(valor), mes }); };
  return (
    <ModalBase titulo="Nova receita" subtitulo="Salário, freela, outros" onFechar={onFechar}>
      <div className="space-y-4">
        <div><label className={labelStyle}>Fonte</label><input type="text" value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="Ex: Salário, Freela, Mesada" className={inputStyle} /></div>
        <div><label className={labelStyle}>Valor (R$)</label><input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={`${inputStyle} num-tabular font-mono`} /></div>
        <div><label className={labelStyle}>Mês de referência</label><input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={inputStyle} /></div>
        <button onClick={submit} disabled={salvando} className={btnSalvar}>{salvando ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} />Salvar receita</>}</button>
      </div>
    </ModalBase>
  );
}

function ModalDespesa({ categorias, onFechar, onSalvar }) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id || "");
  const [dataVencimento, setDataVencimento] = useState(hojeISO());
  const [parcelas, setParcelas] = useState(1);
  const [salvando, setSalvando] = useState(false);

  const valorNum = parseFloat(valor) || 0;
  const valorParcela = parcelas > 0 ? valorNum / parcelas : 0;

  const submit = async () => {
    if (!descricao || !valor || !categoriaId) return;
    setSalvando(true);
    await onSalvar({
      descricao,
      valor: valorParcela,
      categoria_id: categoriaId,
      dataVencimento,
      parcelas,
    });
  };

  return (
    <ModalBase titulo="Nova despesa" subtitulo="Registre um gasto" onFechar={onFechar}>
      <div className="space-y-4">
        <div>
          <label className={labelStyle}>Descrição</label>
          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Almoço no RU, Monitor 27''..." className={inputStyle} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelStyle}>Valor total (R$)</label>
            <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={`${inputStyle} num-tabular font-mono`} />
          </div>
          <div>
            <label className={labelStyle}>Vencimento{parcelas > 1 ? " (1ª)" : ""}</label>
            <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className={inputStyle} />
          </div>
        </div>
        <div>
          <label className={labelStyle}>Parcelas</label>
          <input type="number" min="1" max="60" value={parcelas} onChange={(e) => setParcelas(parseInt(e.target.value) || 1)} className={`${inputStyle} num-tabular font-mono`} />
          {parcelas > 1 && valorNum > 0 && (
            <p className="font-mono text-[10px] text-amber-300/70 mt-2 num-tabular">
              {parcelas}x de <span className="font-bold">{formatBRL(valorParcela)}</span>
            </p>
          )}
        </div>
        <div>
          <label className={labelStyle}>Categoria</label>
          <div className="grid grid-cols-2 gap-2">
            {categorias.map((c) => {
              const Icon = ICONS_MAP[c.icone] || Tag; const ativa = categoriaId === c.id;
              return (
                <button key={c.id} onClick={() => setCategoriaId(c.id)}
                  className={`p-3 rounded-lg flex items-center gap-2 transition text-sm font-body ${ativa ? "text-[#0a0a0f]" : "text-amber-100/70 bg-amber-100/[0.03] border border-amber-100/10 hover:bg-amber-100/5"}`}
                  style={{ background: ativa ? c.cor : undefined }}>
                  <Icon size={14} />{c.nome}
                </button>
              );
            })}
          </div>
        </div>
        <button onClick={submit} disabled={salvando} className={btnSalvar}>
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} />Salvar despesa</>}
        </button>
      </div>
    </ModalBase>
  );
}

function ModalAssinatura({ onFechar, onSalvar }) {
  const [nome, setNome] = useState(""); const [valor, setValor] = useState(""); const [diaVencimento, setDiaVencimento] = useState("5"); const [salvando, setSalvando] = useState(false);
  const submit = async () => { if (!nome || !valor || !diaVencimento) return; const dia = Math.max(1, Math.min(31, parseInt(diaVencimento))); setSalvando(true); await onSalvar({ nome, valor: parseFloat(valor), dia_vencimento: dia }); };
  return (
    <ModalBase titulo="Nova assinatura" subtitulo="Plano ou app recorrente" onFechar={onFechar}>
      <div className="space-y-4">
        <div><label className={labelStyle}>Nome</label><input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Netflix, Spotify, Academia..." className={inputStyle} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelStyle}>Valor (R$)</label><input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={`${inputStyle} num-tabular font-mono`} /></div>
          <div><label className={labelStyle}>Dia do mês</label><input type="number" min="1" max="31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} className={`${inputStyle} num-tabular font-mono`} /></div>
        </div>
        <button onClick={submit} disabled={salvando} className={btnSalvar}>{salvando ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} />Salvar assinatura</>}</button>
      </div>
    </ModalBase>
  );
}

function ModalCategoria({ onFechar, onSalvar }) {
  const [nome, setNome] = useState(""); const [cor, setCor] = useState(CORES_DISPONIVEIS[0]); const [icone, setIcone] = useState(ICONES_DISPONIVEIS[0]); const [salvando, setSalvando] = useState(false);
  const submit = async () => { if (!nome) return; setSalvando(true); await onSalvar({ nome, cor, icone }); };
  return (
    <ModalBase titulo="Nova categoria" subtitulo="Crie sua própria" onFechar={onFechar}>
      <div className="space-y-4">
        <div><label className={labelStyle}>Nome</label><input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Pets, Viagens, Academia..." className={inputStyle} /></div>
        <div>
          <label className={labelStyle}>Cor</label>
          <div className="flex flex-wrap gap-2">
            {CORES_DISPONIVEIS.map((c) => (<button key={c} onClick={() => setCor(c)} className={`w-9 h-9 rounded-full transition ${cor === c ? "ring-2 ring-offset-2 ring-offset-[#15151c] ring-amber-200" : ""}`} style={{ background: c }} />))}
          </div>
        </div>
        <div>
          <label className={labelStyle}>Ícone</label>
          <div className="grid grid-cols-5 gap-2">
            {ICONES_DISPONIVEIS.map((i) => {
              const Icon = ICONS_MAP[i]; const ativa = icone === i;
              return (<button key={i} onClick={() => setIcone(i)} className={`p-3 rounded-lg flex items-center justify-center transition ${ativa ? "bg-amber-200 text-[#0a0a0f]" : "bg-amber-100/[0.03] border border-amber-100/10 text-amber-100/70 hover:bg-amber-100/5"}`}><Icon size={16} /></button>);
            })}
          </div>
        </div>
        <button onClick={submit} disabled={salvando} className={btnSalvar}>{salvando ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} />Criar categoria</>}</button>
      </div>
    </ModalBase>
  );
}

function ModalAdiantarParcelas({ parcelas, onFechar, onConfirmar }) {
  const [selecionadas, setSelecionadas] = useState(new Set());

  const toggle = (id) => {
    const nova = new Set(selecionadas);
    if (nova.has(id)) nova.delete(id); else nova.add(id);
    setSelecionadas(nova);
  };

  const total = parcelas.filter((p) => selecionadas.has(p.id)).reduce((s, p) => s + Number(p.valor), 0);

  return (
    <ModalBase titulo="Adiantar parcelas" subtitulo="Selecione quais marcar como pagas" onFechar={onFechar}>
      <div className="space-y-4">
        <div className="space-y-2">
          {parcelas.map((p) => {
            const checked = selecionadas.has(p.id);
            return (
              <label key={p.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  checked ? "bg-amber-200/15 border-amber-200/50" : "bg-amber-100/[0.03] border-amber-100/10 hover:bg-amber-100/5"
                }`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(p.id)}
                  className="w-4 h-4 accent-amber-300" />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="font-body text-sm text-amber-50 num-tabular">
                      Parcela {p.parcela_atual}/{p.parcelas_total}
                    </div>
                    <div className="font-mono text-[10px] text-amber-100/40 num-tabular">
                      Vence: {formatarDataBR(p.data_vencimento)}
                    </div>
                  </div>
                  <span className="font-mono num-tabular text-amber-200 font-semibold">
                    {formatBRL(p.valor)}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        {selecionadas.size > 0 && (
          <div className="bg-amber-200/10 border border-amber-200/30 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] tracking-widest text-amber-100/60 uppercase">Total a pagar</span>
              <span className="font-mono num-tabular text-amber-200 font-bold">{formatBRL(total)}</span>
            </div>
          </div>
        )}

        <button onClick={() => onConfirmar(Array.from(selecionadas))} disabled={selecionadas.size === 0} className={btnSalvar}>
          <Check size={16} />Confirmar ({selecionadas.size})
        </button>
      </div>
    </ModalBase>
  );
}

function ResumoMensal({ resumo, onFechar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-br from-[#1a1a24] to-[#0f0f17] border border-amber-200/30 rounded-3xl w-full max-w-lg p-8 animate-scaleIn relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-300/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-mono text-[10px] tracking-[0.3em] text-amber-200/60 uppercase">Fechamento mensal</p>
              <h2 className="font-display text-3xl italic text-amber-50 mt-1">{nomeMes(resumo.mes)}</h2>
            </div>
            <button onClick={onFechar} className="text-amber-100/40 hover:text-amber-100 transition"><X size={20} /></button>
          </div>
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-500/5 border border-emerald-400/20 rounded-xl p-4">
                <p className="font-mono text-[10px] tracking-widest text-emerald-300/60 uppercase">Receitas</p>
                <p className="font-mono num-tabular text-xl font-bold text-emerald-200 mt-1">{formatBRL(resumo.totalReceitas)}</p>
              </div>
              <div className="bg-rose-500/5 border border-rose-400/20 rounded-xl p-4">
                <p className="font-mono text-[10px] tracking-widest text-rose-300/60 uppercase">Despesas</p>
                <p className="font-mono num-tabular text-xl font-bold text-rose-200 mt-1">{formatBRL(resumo.totalDespesas)}</p>
              </div>
            </div>
            <div className={`rounded-xl p-5 border ${resumo.saldo >= 0 ? "bg-amber-200/5 border-amber-200/30" : "bg-rose-500/10 border-rose-400/30"}`}>
              <p className="font-mono text-[10px] tracking-widest text-amber-100/50 uppercase">Saldo final</p>
              <p className={`font-mono num-tabular text-3xl font-bold mt-1 ${resumo.saldo >= 0 ? "text-amber-200" : "text-rose-300"}`}>{formatBRL(resumo.saldo)}</p>
            </div>
            {resumo.maiorCategoria && (
              <div className="bg-amber-100/[0.03] border border-amber-100/10 rounded-xl p-4">
                <p className="font-mono text-[10px] tracking-widest text-amber-100/50 uppercase mb-1">Categoria que mais consumiu</p>
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg italic text-amber-50">{resumo.maiorCategoria.nome}</span>
                  <span className="font-mono num-tabular text-sm" style={{ color: resumo.maiorCategoria.cor }}>{formatBRL(resumo.maiorValor)}</span>
                </div>
              </div>
            )}
          </div>
          <p className="font-display italic text-amber-100/70 text-center mb-6 text-sm">"Cada centavo registrado é um passo a mais em direção ao controle."</p>
          <button onClick={onFechar} className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-xl font-body font-medium hover:bg-amber-100 transition">Continuar</button>
        </div>
      </div>
    </div>
  );
}
