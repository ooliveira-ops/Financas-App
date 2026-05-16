import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
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

const formatBRL = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const hojeISO = () => new Date().toISOString().split("T")[0];
const mesAtual = () => new Date().toISOString().substring(0, 7);
const diaAtual = () => new Date().getDate();
const nomeMes = (mesISO) => {
  const [ano, mes] = mesISO.split("-");
  const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${meses[parseInt(mes) - 1]} ${ano}`;
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
    if (!error && data) {
      setAssinaturas([...assinaturas, data]);
      // O trigger do Supabase cria a despesa automaticamente!
      // Recarregar despesas após 1 segundo
      setTimeout(async () => {
        const { data: novasDespesas } = await supabase.from("despesas").select("*").eq("user_id", userId);
        setDespesas(novasDespesas || []);
      }, 1000);
    }
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

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const despesasPendentes = useMemo(() => despesas.filter((d) => d.status === "pendente" || !d.status), [despesas]);
  const despesasPagas = useMemo(() => despesas.filter((d) => d.status === "paga"), [despesas]);

  const totalReceitasMes = useMemo(() => receitas.filter((r) => (r.mes || mesAtual()) === mesAtual()).reduce((s, r) => s + parseFloat(r.valor || 0), 0), [receitas]);
  const totalAssinaturasMes = useMemo(() => assinaturas.reduce((s, a) => s + parseFloat(a.valor || 0), 0), [assinaturas]);

  const despesasPagasMesAtual = useMemo(() => despesasPagas.filter((d) => d.data_pagamento && d.data_pagamento.startsWith(mesAtual())), [despesasPagas]);
  const totalDespesasPagasMes = useMemo(() => despesasPagasMesAtual.reduce((s, d) => s + parseFloat(d.valor || 0), 0), [despesasPagasMesAtual]);

  const totalDespesasMes = totalDespesasPagasMes + totalAssinaturasMes;
  const saldo = totalReceitasMes - totalDespesasMes;

  const despesasPendentesMesAtual = useMemo(() => despesasPendentes.filter((d) => {
    const dataRef = d.data_vencimento || d.data;
    return dataRef && dataRef.startsWith(mesAtual());
  }), [despesasPendentes]);
  const totalPendentesMes = useMemo(() => despesasPendentesMesAtual.reduce((s, d) => s + parseFloat(d.valor || 0), 0), [despesasPendentesMesAtual]);

  const despesasPorCategoria = useMemo(() => {
    const agrupado = {};
    despesasPagasMesAtual.forEach((d) => {
      agrupado[d.categoria_id] = (agrupado[d.categoria_id] || 0) + parseFloat(d.valor || 0);
    });
    return categorias.map((c) => ({ nome: c.nome, valor: agrupado[c.id] || 0, cor: c.cor })).filter((c) => c.valor > 0);
  }, [despesasPagasMesAtual, categorias]);

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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; font-variation-settings: "SOFT" 50, "WONK" 1; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }
        body { background: #0a0a0f; }
        .grain::before { content: ''; position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E"); opacity: 0.03; pointer-events: none; z-index: 1; }
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
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.12), transparent 70%)' }} />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.10), transparent 70%)' }} />

      {!avisoFechado && (avisoDespesas.vencidas.length > 0 || avisoDespesas.vencendo.length > 0) && (
        <AvisoVencimentos vencidas={avisoDespesas.vencidas} vencendo={avisoDespesas.vencendo} onFechar={() => setAvisoFechado(true)} />
      )}

      <header className="relative z-10 px-6 md:px-12 pt-8 pb-4 flex items-center justify-between border-b border-amber-100/5">
        <div className="animate-fadeIn">
          <div className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase">Finanças · {nomeMes(mesAtual())}</div>
          <h1 className="font-display text-2xl md:text-3xl italic text-amber-50 mt-1">olá, {userNome}</h1>
        </div>
        <button onClick={handleLogout} className="text-amber-100/50 hover:text-amber-100 transition flex items-center gap-2 font-body text-sm">
          <LogOut size={16} />Sair
        </button>
      </header>

      <nav className="relative z-10 px-6 md:px-12 py-4 flex gap-1 overflow-x-auto border-b border-amber-100/5">
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

      {modalReceita && <ModalReceita onFechar={() => setModalReceita(false)} onSalvar={async (r) => { await adicionarReceita(r); setModalReceita(false); }} />}
      {modalDespesa && <ModalDespesa categorias={categorias} onFechar={() => setModalDespesa(false)} onSalvar={async (d) => { await adicionarDespesa(d); setModalDespesa(false); }} />}
      {modalAssinatura && <ModalAssinatura onFechar={() => setModalAssinatura(false)} onSalvar={async (a) => { await adicionarAssinatura(a); setModalAssinatura(false); }} />}
      {modalCategoria && <ModalCategoria onFechar={() => setModalCategoria(false)} onSalvar={async (c) => { await adicionarCategoria(c); setModalCategoria(false); }} />}
      {modalAdiantar && <ModalAdiantarParcelas parcelas={parcelasPendentesDoGrupo(modalAdiantar)} onFechar={() => setModalAdiantar(null)} onConfirmar={marcarMultiplasComoPagas} />}
    </div>
  );
}

function AvisoVencimentos({ vencidas, vencendo, onFechar }) {
  return (
    <div className="fixed top-4 right-4 z-30 animate-fadeInUp max-w-sm">
      <div className="bg-[#15151c]/95 backdrop-blur border border-amber-200/20 rounded-2xl shadow-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display italic text-amber-50 flex items-center gap-2"><Bell size={16} className="text-amber-300" />Você tem contas a pagar</h3>
          <button onClick={onFechar} className="text-amber-100/40 hover:text-amber-100"><X size={14} /></button>
        </div>
        {vencidas.length > 0 && <p className="text-xs text-rose-300 mb-2">🔴 {vencidas.length} vencida(s) - {formatBRL(vencidas.reduce((s,d) => s + Number(d.valor), 0))}</p>}
        {vencendo.length > 0 && <p className="text-xs text-amber-300">🟡 {vencendo.length} em até 7 dias - {formatBRL(vencendo.reduce((s,d) => s + Number(d.valor), 0))}</p>}
      </div>
    </div>
  );
}

function HomeAba({ quote, saldo, totalReceitasMes, totalDespesasMes, totalPendentesMes, despesasPorCategoria, proximasAssinaturas }) {
  return (
    <div className="space-y-10">
      <section className="animate-fadeInUp delay-1 py-12 md:py-20 text-center">
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
          <h3 className="font-display text-xl italic text-amber-100 mb-6">Gastos por categoria</h3>
          {despesasPorCategoria.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center"><p className="font-body text-amber-100/40 text-sm">Nenhum gasto pago</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={despesasPorCategoria} dataKey="valor" nameKey="nome" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {despesasPorCategoria.map((entry, idx) => (<Cell key={idx} fill={entry.cor} stroke="none" />))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="animate-fadeInUp delay-5 bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl p-6">
          <h3 className="font-display text-xl italic text-amber-100 mb-6">Próximos vencimentos</h3>
          {proximasAssinaturas.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center"><p className="font-body text-amber-100/40 text-sm">Nenhuma assinatura</p></div>
          ) : (
            <div className="space-y-2">
              {proximasAssinaturas.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-100/[0.02]">
                  <div><div className="font-body text-sm text-amber-50">{a.nome}</div><div className="font-mono text-[10px] text-amber-100/40">dia {a.dia_vencimento}</div></div>
                  <div className="font-mono num-tabular text-sm text-amber-200">{formatBRL(a.valor)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CardResumo({ label, valor, icon: Icon, cor, destaque, delay }) {
  return (
    <div className={`animate-fadeInUp delay-${delay} rounded-2xl p-6 border ${destaque ? "bg-amber-100/5 border-amber-200/30" : "bg-amber-100/[0.02] border-amber-100/10"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] tracking-widest text-amber-100/40 uppercase">{label}</span>
        <Icon size={16} className={cor} />
      </div>
      <div className={`font-mono num-tabular text-2xl font-bold not-italic ${cor}`}>{formatBRL(valor)}</div>
    </div>
  );
}

function DespesasAba({ despesasPendentes, despesasPagas, despesasPagasMesAtual, categorias, totalDespesasPagasMes, totalPendentesMes, despesasPendentesMesAtual, onAdicionar, onRemover, onMarcarPaga, onAdiantar, parcelasPendentesDoGrupo, onAdicionarCategoria, onRemoverCategoria }) {
  const [subAba, setSubAba] = useState("pendentes");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  const filtrarPorCategoria = (lista) => categoriaFiltro === "todas" ? lista : lista.filter((d) => d.categoria_id === categoriaFiltro);
  const pendentesFiltradas = filtrarPorCategoria(despesasPendentes);
  const pagasFiltradas = filtrarPorCategoria(despesasPagasMesAtual);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase">{subAba === "pendentes" ? "A pagar" : "Pago este mês"}</p>
          <h2 className="font-mono num-tabular text-4xl font-bold text-amber-50 mt-1">{formatBRL(subAba === "pendentes" ? totalPendentesMes : totalDespesasPagasMes)}</h2>
        </div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-amber-200 text-[#0a0a0f] hover:bg-amber-100 font-body text-sm flex items-center gap-2 transition">
          <Plus size={14} />Nova despesa
        </button>
      </div>

      <div className="flex gap-1 bg-amber-100/[0.03] p-1 rounded-full w-fit border border-amber-100/10">
        <button onClick={() => setSubAba("pendentes")} className={`px-4 py-1.5 rounded-full font-body text-xs flex items-center gap-2 transition ${subAba === "pendentes" ? "bg-amber-200 text-[#0a0a0f]" : "text-amber-100/60"}`}>
          <Clock size={12} />Pendentes ({despesasPendentes.length})
        </button>
        <button onClick={() => setSubAba("pagas")} className={`px-4 py-1.5 rounded-full font-body text-xs flex items-center gap-2 transition ${subAba === "pagas" ? "bg-amber-200 text-[#0a0a0f]" : "text-amber-100/60"}`}>
          <History size={12} />Histórico ({despesasPagas.length})
        </button>
      </div>

      <div className="bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl overflow-hidden">
        {(subAba === "pendentes" ? pendentesFiltradas : pagasFiltradas).length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-body text-amber-100/40 text-sm">{subAba === "pendentes" ? "Nenhuma despesa pendente ✨" : "Nenhuma despesa paga"}</p>
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
                <div key={d.id} className="flex items-center gap-3 p-4 hover:bg-amber-100/[0.02] transition group">
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-amber-50">{d.descricao}</div>
                    <div className="font-mono text-[10px] text-amber-100/40 mt-0.5">
                      {subAba === "pendentes" ? `vence ${formatarDataBR(d.data_vencimento)}` : `paga em ${formatarDataBR(d.data_pagamento)}`}
                    </div>
                  </div>
                  <div className="font-mono num-tabular text-sm text-amber-200 font-semibold">{formatBRL(d.valor)}</div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {subAba === "pendentes" && (
                      <button onClick={() => onMarcarPaga(d.id)} className="p-1.5 text-emerald-400/70 hover:text-emerald-400 rounded transition">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={() => onRemover(d.id)} className="p-1.5 text-amber-100/30 hover:text-rose-400 rounded transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
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
          <div className="p-12 text-center"><p className="font-body text-amber-100/40 text-sm">Nenhuma receita este mês</p></div>
        ) : (
          <div className="divide-y divide-amber-100/5">
            {recDoMes.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-amber-100/[0.02] transition group">
                <div className="flex-1"><div className="font-body text-amber-50">{r.fonte}</div></div>
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
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase">Total mensal</p>
          <h2 className="font-mono num-tabular text-4xl font-bold text-amber-50 mt-1">{formatBRL(total)}</h2>
        </div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-amber-200 text-[#0a0a0f] hover:bg-amber-100 font-body text-sm flex items-center gap-2 transition"><Plus size={14} />Nova assinatura</button>
      </div>
      <div className="bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl overflow-hidden">
        {assinaturas.length === 0 ? (
          <div className="p-12 text-center"><p className="font-body text-amber-100/40 text-sm">Nenhuma assinatura</p></div>
        ) : (
          <div className="divide-y divide-amber-100/5">
            {assinaturas.map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-amber-100/[0.02] transition group">
                <div className="flex-1"><div className="font-body text-amber-50">{a.nome}</div><div className="font-mono text-[10px] text-amber-100/40 mt-0.5">dia {a.dia_vencimento}</div></div>
                <div className="font-mono num-tabular text-sm text-amber-200">{formatBRL(a.valor)}</div>
                <button onClick={() => onRemover(a.id)} className="opacity-0 group-hover:opacity-100 text-amber-100/30 hover:text-rose-400 transition"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModalReceita({ onFechar, onSalvar }) {
  const [fonte, setFonte] = useState(""); const [valor, setValor] = useState(""); const [salvando, setSalvando] = useState(false);
  const submit = async () => { if (!fonte || !valor) return; setSalvando(true); await onSalvar({ fonte, valor: parseFloat(valor), mes: mesAtual() }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10">
          <h3 className="font-display text-2xl italic text-amber-50">Nova receita</h3>
          <button onClick={onFechar} className="text-amber-100/40"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="Ex: Salário" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 font-body text-amber-50 placeholder:text-amber-100/30 focus:outline-none" />
          <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 font-body font-mono text-amber-50 num-tabular focus:outline-none" />
          <button onClick={submit} disabled={salvando} className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium hover:bg-amber-100 transition">
            {salvando ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalDespesa({ categorias, onFechar, onSalvar }) {
  const [descricao, setDescricao] = useState(""); const [valor, setValor] = useState(""); const [categoriaId, setCategoriaId] = useState(categorias[0]?.id || ""); const [dataVencimento, setDataVencimento] = useState(hojeISO()); const [parcelas, setParcelas] = useState(1); const [salvando, setSalvando] = useState(false);
  const valorNum = parseFloat(valor) || 0; const valorParcela = parcelas > 0 ? valorNum / parcelas : 0;
  const submit = async () => { if (!descricao || !valor || !categoriaId) return; setSalvando(true); await onSalvar({ descricao, valor: valorParcela, categoria_id: categoriaId, dataVencimento, parcelas }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md animate-scaleIn max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10 sticky top-0 bg-[#15151c]">
          <h3 className="font-display text-2xl italic text-amber-50">Nova despesa</h3>
          <button onClick={onFechar} className="text-amber-100/40"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Almoço" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 font-body text-amber-50 placeholder:text-amber-100/30 focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 font-body font-mono text-amber-50 num-tabular focus:outline-none" />
            <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 font-body text-amber-50 focus:outline-none" />
          </div>
          <input type="number" min="1" max="60" value={parcelas} onChange={(e) => setParcelas(parseInt(e.target.value) || 1)} className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 font-body font-mono text-amber-50 num-tabular focus:outline-none" />
          <div className="grid grid-cols-2 gap-2">
            {categorias.map((c) => (
              <button key={c.id} onClick={() => setCategoriaId(c.id)} className={`p-3 rounded-lg text-sm font-body transition ${categoriaId === c.id ? "text-[#0a0a0f]" : "text-amber-100/70 bg-amber-100/[0.03]"}`} style={{ background: categoriaId === c.id ? c.cor : undefined }}>
                {c.nome}
              </button>
            ))}
          </div>
          <button onClick={submit} disabled={salvando} className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium hover:bg-amber-100 transition">
            {salvando ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalAssinatura({ onFechar, onSalvar }) {
  const [nome, setNome] = useState(""); const [valor, setValor] = useState(""); const [diaVencimento, setDiaVencimento] = useState("5"); const [salvando, setSalvando] = useState(false);
  const submit = async () => { if (!nome || !valor) return; setSalvando(true); await onSalvar({ nome, valor: parseFloat(valor), dia_vencimento: parseInt(diaVencimento) }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10">
          <h3 className="font-display text-2xl italic text-amber-50">Nova assinatura</h3>
          <button onClick={onFechar} className="text-amber-100/40"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Netflix, Spotify..." className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 font-body text-amber-50 placeholder:text-amber-100/30 focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 font-body font-mono text-amber-50 num-tabular focus:outline-none" />
            <input type="number" min="1" max="31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 font-body font-mono text-amber-50 num-tabular focus:outline-none" />
          </div>
          <button onClick={submit} disabled={salvando} className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium hover:bg-amber-100 transition">
            {salvando ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalCategoria({ onFechar, onSalvar }) {
  const [nome, setNome] = useState(""); const [salvando, setSalvando] = useState(false);
  const submit = async () => { if (!nome) return; setSalvando(true); await onSalvar({ nome, cor: "#fbbf24", icone: "Tag" }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10">
          <h3 className="font-display text-2xl italic text-amber-50">Nova categoria</h3>
          <button onClick={onFechar} className="text-amber-100/40"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 font-body text-amber-50 placeholder:text-amber-100/30 focus:outline-none" />
          <button onClick={submit} disabled={salvando} className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium hover:bg-amber-100 transition">
            {salvando ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalAdiantarParcelas({ parcelas, onFechar, onConfirmar }) {
  const [selecionadas, setSelecionadas] = useState(new Set());
  const total = Array.from(selecionadas).reduce((s, id) => s + Number(parcelas.find(p => p.id === id)?.valor), 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md animate-scaleIn max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10 sticky top-0 bg-[#15151c]">
          <h3 className="font-display text-2xl italic text-amber-50">Adiantar parcelas</h3>
          <button onClick={onFechar} className="text-amber-100/40"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {parcelas.map((p) => (
            <label key={p.id} className="flex items-center gap-3 p-3 bg-amber-100/[0.02] border border-amber-100/10 rounded-lg cursor-pointer hover:bg-amber-100/[0.05] transition">
              <input type="checkbox" checked={selecionadas.has(p.id)} onChange={(e) => {
                const novo = new Set(selecionadas);
                if (e.target.checked) novo.add(p.id);
                else novo.delete(p.id);
                setSelecionadas(novo);
              }} className="w-4 h-4 cursor-pointer" />
              <div className="flex-1">
                <div className="font-body text-sm text-amber-50">{p.descricao}</div>
                <div className="font-mono text-[10px] text-amber-100/40">Parcela {p.parcela_atual}/{p.parcelas_total}</div>
              </div>
              <div className="font-mono num-tabular text-amber-300">{formatBRL(p.valor)}</div>
            </label>
          ))}
          <div className="bg-amber-100/[0.03] border border-amber-200/30 p-4 rounded-lg mt-4">
            <div className="font-mono text-[10px] text-amber-100/40 uppercase mb-1">Total</div>
            <div className="font-mono num-tabular text-2xl font-bold text-amber-300">{formatBRL(total)}</div>
          </div>
          <button onClick={() => onConfirmar(Array.from(selecionadas))} disabled={selecionadas.size === 0} className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium hover:bg-amber-100 disabled:opacity-50 transition">
            Confirmar pagamento
          </button>
        </div>
      </div>
    </div>
  );
}
