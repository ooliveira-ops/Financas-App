import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Plus, Trash2, Wallet, Calendar, X, TrendingUp, TrendingDown, Sparkles,
  Repeat, Home, PieChart as PieIcon, AlertCircle, Check, GraduationCap,
  Utensils, User, Car, ShoppingBag, Heart, Plane, Coffee, Tag, LogOut, Loader2,
  Layers, FastForward, Clock, History, CheckCircle2, Bell, Zap, FileDown,
} from "lucide-react";
import { supabase } from "./supabase";
import Auth from "./Auth";

const QUOTES = [
  { text: "Tudo posso naquele que me fortalece.", author: "Filipenses 4:13" },
  { text: "O Senhor é o meu pastor e nada me faltará.", author: "Salmos 23:1" },
  { text: "Porque sou eu que conheço os planos que tenho para vocês.", author: "Jeremias 29:11" },
  { text: "Confie no Senhor de todo o seu coração.", author: "Provérbios 3:5" },
  { text: "Honre o Senhor com a sua riqueza e com as primícias.", author: "Provérbios 3:9" },
  { text: "Não acumulem para si tesouros na terra.", author: "Mateus 6:19" },
  { text: "O amor ao dinheiro é a raiz de todos os males.", author: "1 Timóteo 6:10" },
  { text: "Quem dá ao pobre empresta ao Senhor.", author: "Provérbios 19:17" },
  { text: "Sede diligentes nos negócios, ferventes no espírito.", author: "Romanos 12:11" },
  { text: "O trabalho de mãos diligentes traz riqueza.", author: "Provérbios 10:4" },
  { text: "Busquem primeiro o reino de Deus e a sua justiça.", author: "Mateus 6:33" },
  { text: "Dê, e lhe será dado; uma boa medida.", author: "Lucas 6:38" },
  { text: "Os planos do diligente levam à abundância.", author: "Provérbios 21:5" },
  { text: "Bem-aventurado o homem que teme ao Senhor e se deleita nos seus mandamentos.", author: "Salmos 112:1" },
  { text: "Não vos preocupeis com o dia de amanhã.", author: "Mateus 6:34" },
  { text: "Hoje você está mais perto do que ontem.", author: "" },
  { text: "A persistência realiza o impossível.", author: "Provérbio chinês" },
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "Não espere por uma crise para descobrir o que é importante em sua vida.", author: "Platão" },
  { text: "A disciplina é a ponte entre objetivos e conquistas.", author: "Jim Rohn" },
  { text: "Cuide dos centavos, que os reais cuidarão de si mesmos.", author: "Benjamin Franklin" },
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

const CORES_PIZZA = ["#a78bfa", "#fb923c", "#f472b6", "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#22d3ee"];

const formatBRL = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const hojeISO = () => new Date().toISOString().split("T")[0];
const mesAtual = () => new Date().toISOString().substring(0, 7);
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

  if (carregandoSession) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]"><Loader2 className="text-amber-200/60 animate-spin" size={28} /></div>;
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
  const [parcelamentos, setParcelamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [quote, setQuote] = useState(QUOTES[0]);
  const [modalReceita, setModalReceita] = useState(false);
  const [modalDespesa, setModalDespesa] = useState(false);
  const [modalAssinatura, setModalAssinatura] = useState(false);
  const [modalParcelamento, setModalParcelamento] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);
  const [avisoFechado, setAvisoFechado] = useState(false);

  const carregarTudo = async () => {
    const [r, d, a, p, c] = await Promise.all([
      supabase.from("receitas").select("*").eq("user_id", userId),
      supabase.from("despesas").select("*").eq("user_id", userId),
      supabase.from("assinaturas").select("*").eq("user_id", userId),
      supabase.from("parcelamentos").select("*").eq("user_id", userId),
      supabase.from("categorias").select("*").eq("user_id", userId),
    ]);
    setReceitas(r.data || []);
    setDespesas(d.data || []);
    setAssinaturas(a.data || []);
    setParcelamentos(p.data || []);
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
      
      // 🎲 QUOTE ALEATÓRIA TODA VEZ QUE ABRE O APP
      const indiceAleatorio = Math.floor(Math.random() * QUOTES.length);
      setQuote(QUOTES[indiceAleatorio]);
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
    if (!error && data) setDespesas(despesas.map((d) => (d.id === id ? data : d)));
  };

  const adicionarAssinatura = async (n) => {
    const { data, error } = await supabase.from("assinaturas").insert({ ...n, user_id: userId }).select().single();
    if (!error && data) {
      setAssinaturas([...assinaturas, data]);
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

  const adicionarParcelamento = async (n) => {
    if (!n.descricao || !n.valor_total || !n.parcelas_total) {
      alert("Preencha todos os campos");
      return;
    }

    const { data, error } = await supabase.from("parcelamentos").insert({
      descricao: n.descricao,
      valor_total: parseFloat(n.valor_total),
      parcelas_total: parseInt(n.parcelas_total),
      parcelas_pagas: 0,
      valor_pago: 0,
      user_id: userId,
      proxima_parcela_data: n.dataInicio,
      categoria_id: null,
      status: 'ativo',
    }).select().single();

    if (error) {
      console.error("Erro ao criar parcelamento:", error.message);
      alert("Erro ao criar parcelamento: " + error.message);
      return;
    }

    if (data) {
      setParcelamentos([...parcelamentos, data]);
      setTimeout(async () => {
        const { data: novasDespesas } = await supabase
          .from("despesas")
          .select("*")
          .eq("user_id", userId);
        setDespesas(novasDespesas || []);
      }, 1500);
    }
  };

  const marcarParcelaComoPaga = async (id) => {
    const parc = parcelamentos.find(p => p.id === id);
    if (!parc) {
      alert("Parcelamento não encontrado");
      return;
    }

    if (parc.parcelas_pagas >= parc.parcelas_total) {
      alert("Todas as parcelas já foram pagas!");
      return;
    }

    const novasParcelas = parc.parcelas_pagas + 1;
    const novoValorPago = (parc.valor_pago || 0) + (parc.valor_total / parc.parcelas_total);

    const { data, error } = await supabase
      .from("parcelamentos")
      .update({
        parcelas_pagas: novasParcelas,
        valor_pago: novoValorPago,
        status: novasParcelas >= parc.parcelas_total ? 'finalizado' : 'ativo'
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao marcar parcela como paga:", error.message);
      alert("Erro: " + error.message);
      return;
    }

    if (data) {
      setParcelamentos(parcelamentos.map((p) => (p.id === id ? data : p)));
      setTimeout(async () => {
        const { data: novasDespesas } = await supabase
          .from("despesas")
          .select("*")
          .eq("user_id", userId);
        setDespesas(novasDespesas || []);
      }, 500);
    }
  };

  const removerParcelamento = async (id) => {
    const { error } = await supabase.from("parcelamentos").delete().eq("id", id);
    if (!error) setParcelamentos(parcelamentos.filter((p) => p.id !== id));
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
    return categorias
      .map((c, idx) => ({
        id: c.id,
        nome: c.nome,
        valor: agrupado[c.id] || 0,
        cor: CORES_PIZZA[idx % CORES_PIZZA.length] || "#a78bfa",
      }))
      .filter((c) => c.valor > 0.01);
  }, [despesasPagasMesAtual, categorias]);

  const proximasAssinaturas = useMemo(() => {
    const hoje = new Date();
    const diaH = hoje.getDate();
    return [...assinaturas]
      .map((a) => {
        const dia = parseInt(a.dia_vencimento || 5);
        let diasRestantes = dia >= diaH ? dia - diaH : (new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()) - diaH + dia;
        return { ...a, diasRestantes };
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
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

  if (carregandoDados) {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]"><Loader2 className="text-amber-200/60 animate-spin" size={28} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-amber-50 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }
        body { background: #0a0a0f; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.7s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.1s; } .delay-2 { animation-delay: 0.25s; } .delay-3 { animation-delay: 0.4s; } .delay-4 { animation-delay: 0.55s; } .delay-5 { animation-delay: 0.7s; }
        .num-tabular { font-variant-numeric: tabular-nums; font-style: normal; }
      `}</style>

      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.12), transparent 70%)' }} />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.10), transparent 70%)' }} />

      {!avisoFechado && (avisoDespesas.vencidas.length > 0 || avisoDespesas.vencendo.length > 0) && (
        <div className="fixed top-4 right-4 z-30 animate-fadeInUp max-w-sm bg-[#15151c]/95 border border-amber-200/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display italic text-amber-50 flex items-center gap-2"><Bell size={16} className="text-amber-300" />Contas a pagar</h3>
            <button onClick={() => setAvisoFechado(true)} className="text-amber-100/40"><X size={14} /></button>
          </div>
          {avisoDespesas.vencidas.length > 0 && <p className="text-xs text-rose-300 mb-1">🔴 {avisoDespesas.vencidas.length} vencida(s)</p>}
          {avisoDespesas.vencendo.length > 0 && <p className="text-xs text-amber-300">🟡 {avisoDespesas.vencendo.length} em até 7 dias</p>}
        </div>
      )}

      <header className="relative z-10 px-6 md:px-12 pt-8 pb-4 flex items-center justify-between border-b border-amber-100/5">
        <div className="animate-fadeInUp">
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
          { id: "parcelamentos", label: "Parcelamentos", icon: Zap },
          { id: "receitas", label: "Receitas", icon: Wallet },
          { id: "assinaturas", label: "Assinaturas", icon: Repeat },
        ].map((t) => {
          const Icon = t.icon; const ativo = aba === t.id;
          return (
            <button key={t.id} onClick={() => setAba(t.id)} className={`px-4 py-2 rounded-full font-body text-sm flex items-center gap-2 transition-all whitespace-nowrap ${ativo ? "bg-amber-100 text-[#0a0a0f]" : "text-amber-100/50 hover:text-amber-100"}`}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </nav>

      <main className="relative z-10 px-6 md:px-12 py-8 max-w-6xl mx-auto">
        {aba === "home" && <HomeAba quote={quote} saldo={saldo} totalReceitasMes={totalReceitasMes} totalDespesasMes={totalDespesasMes} totalPendentesMes={totalPendentesMes} despesasPorCategoria={despesasPorCategoria} proximasAssinaturas={proximasAssinaturas} receitas={receitas} despesas={despesas} assinaturas={assinaturas} parcelamentos={parcelamentos} userNome={userNome} />}
        {aba === "despesas" && <DespesasAba despesasPendentes={despesasPendentes} despesasPagas={despesasPagas} categorias={categorias} totalDespesasPagasMes={totalDespesasPagasMes} totalPendentesMes={totalPendentesMes} despesasPorCategoria={despesasPorCategoria} onAdicionar={() => setModalDespesa(true)} onRemover={removerDespesa} onMarcarPaga={marcarComoPaga} />}
        {aba === "parcelamentos" && <ParcelamentosAba parcelamentos={parcelamentos} categorias={categorias} onAdicionar={() => setModalParcelamento(true)} onRemover={removerParcelamento} onMarcarPaga={marcarParcelaComoPaga} />}
        {aba === "receitas" && <ReceitasAba receitas={receitas} totalReceitasMes={totalReceitasMes} onAdicionar={() => setModalReceita(true)} onRemover={removerReceita} />}
        {aba === "assinaturas" && <AssinaturasAba assinaturas={proximasAssinaturas} total={totalAssinaturasMes} onAdicionar={() => setModalAssinatura(true)} onRemover={removerAssinatura} />}
      </main>

      {modalReceita && <ModalReceita onFechar={() => setModalReceita(false)} onSalvar={async (r) => { await adicionarReceita(r); setModalReceita(false); }} />}
      {modalDespesa && <ModalDespesa categorias={categorias} onFechar={() => setModalDespesa(false)} onSalvar={async (d) => { await adicionarDespesa(d); setModalDespesa(false); }} />}
      {modalAssinatura && <ModalAssinatura onFechar={() => setModalAssinatura(false)} onSalvar={async (a) => { await adicionarAssinatura(a); setModalAssinatura(false); }} />}
      {modalParcelamento && <ModalParcelamento categorias={categorias} onFechar={() => setModalParcelamento(false)} onSalvar={async (p) => { await adicionarParcelamento(p); setModalParcelamento(false); }} />}
      {modalCategoria && <ModalCategoria onFechar={() => setModalCategoria(false)} onSalvar={async (c) => { await adicionarCategoria(c); setModalCategoria(false); }} />}
    </div>
  );
}

function HomeAba({ quote, saldo, totalReceitasMes, totalDespesasMes, totalPendentesMes, despesasPorCategoria, proximasAssinaturas, receitas, despesas, assinaturas, parcelamentos, userNome }) {
  
  const totalDespesas = despesas.length;
  const despesasPagasCount = despesas.filter(d => d.status === 'paga').length;
  
  const totalParcelamentos = parcelamentos.length;
  const parcelamentosAtivos = parcelamentos.filter(p => p.status === 'ativo').length;
  
  const totalReceitas = receitas.length;
  const receitasMes = receitas.filter(r => (r.mes || mesAtual()) === mesAtual()).length;
 
  const gerarRelatorio = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
 
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;
 
      doc.setFontSize(24);
      doc.text('Relatório de Despesas', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setFontSize(10);
      doc.text(`Usuário: ${userNome}`, 20, yPos);
      yPos += 7;
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPos);
      yPos += 7;
      doc.text(`Mês: ${nomeMes(mesAtual())}`, 20, yPos);
      yPos += 15;
 
      doc.setFontSize(14);
      doc.text('📊 Resumo Financeiro', 20, yPos);
      yPos += 10;
 
      const resumoData = [
        ['Receitas', formatBRL(totalReceitasMes)],
        ['Despesas Pagas', formatBRL(totalDespesasMes)],
        ['A Pagar', formatBRL(totalPendentesMes)],
        ['Saldo', formatBRL(saldo)],
      ];
 
      doc.autoTable({
        startY: yPos,
        head: [['Item', 'Valor']],
        body: resumoData,
        theme: 'grid',
        didDrawPage: function(data) {
          yPos = data.lastAutoTable.finalY + 10;
        },
      });
 
      yPos = doc.lastAutoTable.finalY + 15;
 
      if (receitasMes > 0) {
        doc.setFontSize(14);
        doc.text('💰 Receitas', 20, yPos);
        yPos += 10;
 
        const receitasData = receitas
          .filter(r => (r.mes || mesAtual()) === mesAtual())
          .map(r => [r.fonte, formatBRL(r.valor)]);
 
        doc.autoTable({
          startY: yPos,
          head: [['Fonte', 'Valor']],
          body: receitasData,
          theme: 'grid',
          didDrawPage: function(data) {
            yPos = data.lastAutoTable.finalY + 10;
          },
        });
 
        yPos = doc.lastAutoTable.finalY + 15;
      }
 
      if (despesasPagasCount > 0) {
        doc.setFontSize(14);
        doc.text('✅ Despesas Pagas', 20, yPos);
        yPos += 10;
 
        const despesasPagasData = despesas
          .filter(d => d.status === 'paga' && d.data_pagamento && d.data_pagamento.startsWith(mesAtual()))
          .map(d => [d.descricao, formatarDataBR(d.data_pagamento), formatBRL(d.valor)]);
 
        doc.autoTable({
          startY: yPos,
          head: [['Descrição', 'Data', 'Valor']],
          body: despesasPagasData,
          theme: 'grid',
          didDrawPage: function(data) {
            yPos = data.lastAutoTable.finalY + 10;
          },
        });
 
        yPos = doc.lastAutoTable.finalY + 15;
      }
 
      const despesasPendentes = despesas.filter(d => d.status === 'pendente' || !d.status);
      if (despesasPendentes.length > 0) {
        doc.setFontSize(14);
        doc.text('⏳ Despesas Pendentes', 20, yPos);
        yPos += 10;
 
        const despesasPendentesData = despesasPendentes
          .filter(d => {
            const dataRef = d.data_vencimento || d.data;
            return dataRef && dataRef.startsWith(mesAtual());
          })
          .map(d => [d.descricao, formatarDataBR(d.data_vencimento || d.data), formatBRL(d.valor)]);
 
        doc.autoTable({
          startY: yPos,
          head: [['Descrição', 'Vencimento', 'Valor']],
          body: despesasPendentesData,
          theme: 'grid',
          didDrawPage: function(data) {
            yPos = data.lastAutoTable.finalY + 10;
          },
        });
 
        yPos = doc.lastAutoTable.finalY + 15;
      }
 
      if (assinaturas.length > 0) {
        doc.setFontSize(14);
        doc.text('🔄 Assinaturas Mensais', 20, yPos);
        yPos += 10;
 
        const assinaturasData = assinaturas.map(a => [a.nome, formatBRL(a.valor)]);
 
        doc.autoTable({
          startY: yPos,
          head: [['Nome', 'Valor']],
          body: assinaturasData,
          theme: 'grid',
          didDrawPage: function(data) {
            yPos = data.lastAutoTable.finalY + 10;
          },
        });
 
        yPos = doc.lastAutoTable.finalY + 15;
      }
 
      if (parcelamentos.length > 0) {
        doc.setFontSize(14);
        doc.text('📅 Parcelamentos', 20, yPos);
        yPos += 10;
 
        const parcelamentosData = parcelamentos.map(p => [
          p.descricao,
          `${p.parcelas_pagas}/${p.parcelas_total}`,
          formatBRL(p.valor_total),
          p.status === 'ativo' ? 'Ativo' : 'Finalizado'
        ]);
 
        doc.autoTable({
          startY: yPos,
          head: [['Descrição', 'Progresso', 'Valor Total', 'Status']],
          body: parcelamentosData,
          theme: 'grid',
          didDrawPage: function(data) {
            yPos = data.lastAutoTable.finalY + 10;
          },
        });
      }
 
      doc.save(`relatorio-despesas-${mesAtual()}.pdf`);
      alert('✅ Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('❌ Erro ao gerar relatório: ' + error.message);
    }
  };
 
  return (
    <div className="space-y-10">
      <section className="animate-fadeInUp delay-1 py-12 text-center">
        <p className="font-display text-3xl italic leading-tight text-amber-50">"{quote.text}"</p>
        {quote.author && <p className="font-body text-sm text-amber-100/60 mt-3">— {quote.author}</p>}
      </section>
 
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardResumo label="Receitas" valor={totalReceitasMes} icon={TrendingUp} cor="text-emerald-300" delay={2} />
        <CardResumo label="Pago" valor={totalDespesasMes} icon={CheckCircle2} cor="text-rose-300" delay={3} />
        <CardResumo label="A pagar" valor={totalPendentesMes} icon={Clock} cor="text-amber-300" delay={3} />
        <CardResumo label="Saldo" valor={saldo} icon={Wallet} cor={saldo >= 0 ? "text-amber-300" : "text-rose-400"} destaque delay={4} />
      </section>
 
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-fadeInUp delay-5 bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-xl italic text-amber-100">Visão Geral</h3>
 
          <div className="p-4 bg-amber-100/[0.03] rounded-lg border border-amber-100/5">
            <div className="font-body text-sm text-amber-100/70 mb-2">💳 Despesas</div>
            <div className="font-mono num-tabular text-lg text-rose-300">{despesasPagasCount} de {totalDespesas} pagas</div>
            <div className="text-xs text-amber-100/50 mt-1">Total: {formatBRL(despesas.reduce((s, d) => s + parseFloat(d.valor || 0), 0))}</div>
          </div>
 
          <div className="p-4 bg-amber-100/[0.03] rounded-lg border border-amber-100/5">
            <div className="font-body text-sm text-amber-100/70 mb-2">📅 Parcelamentos</div>
            <div className="font-mono num-tabular text-lg text-amber-300">{parcelamentosAtivos} ativo{parcelamentosAtivos !== 1 ? 's' : ''}</div>
            <div className="text-xs text-amber-100/50 mt-1">Total: {totalParcelamentos}</div>
          </div>
 
          <div className="p-4 bg-amber-100/[0.03] rounded-lg border border-amber-100/5">
            <div className="font-body text-sm text-amber-100/70 mb-2">💰 Receitas</div>
            <div className="font-mono num-tabular text-lg text-emerald-300">{receitasMes} este mês</div>
            <div className="text-xs text-amber-100/50 mt-1">Total: {formatBRL(totalReceitasMes)}</div>
          </div>
 
          <button 
            onClick={gerarRelatorio}
            className="w-full mt-4 bg-gradient-to-r from-amber-400 to-amber-300 text-[#0a0a0f] py-3 rounded-lg font-body font-semibold hover:from-amber-300 hover:to-amber-200 transition-all flex items-center justify-center gap-2"
          >
            <FileDown size={16} />
            Gerar Relatório de Despesas
          </button>
        </div>
 
        <div className="animate-fadeInUp delay-5 bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl p-6">
          <h3 className="font-display text-xl italic text-amber-100 mb-6">Próximas assinaturas</h3>
          {proximasAssinaturas.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center"><p className="font-body text-amber-100/40">Nenhuma</p></div>
          ) : (
            <div className="space-y-2">
              {proximasAssinaturas.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-100/[0.02]">
                  <div><div className="font-body text-sm text-amber-50">{a.nome}</div></div>
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
        <span className="font-mono text-[10px] text-amber-100/40 uppercase">{label}</span>
        <Icon size={16} className={cor} />
      </div>
      <div className={`font-mono num-tabular text-2xl font-bold not-italic ${cor}`}>{formatBRL(valor)}</div>
    </div>
  );
}

function DespesasAba({ despesasPendentes, despesasPagas, categorias, totalDespesasPagasMes, totalPendentesMes, despesasPorCategoria, onAdicionar, onRemover, onMarcarPaga }) {
  const [subAba, setSubAba] = useState("pendentes");

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] text-amber-100/40 uppercase">{subAba === "pendentes" ? "A pagar" : "Pago"}</p>
          <h2 className="font-mono num-tabular text-4xl font-bold text-amber-50">{formatBRL(subAba === "pendentes" ? totalPendentesMes : totalDespesasPagasMes)}</h2>
        </div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-amber-200 text-[#0a0a0f] font-body text-sm flex items-center gap-2">
          <Plus size={14} />Nova
        </button>
      </div>

      <div className="flex gap-1 bg-amber-100/[0.03] p-1 rounded-full w-fit border border-amber-100/10">
        <button onClick={() => setSubAba("pendentes")} className={`px-4 py-1.5 rounded-full font-body text-xs ${subAba === "pendentes" ? "bg-amber-200 text-[#0a0a0f]" : "text-amber-100/60"}`}>
          Pendentes ({despesasPendentes.length})
        </button>
        <button onClick={() => setSubAba("pagas")} className={`px-4 py-1.5 rounded-full font-body text-xs ${subAba === "pagas" ? "bg-amber-200 text-[#0a0a0f]" : "text-amber-100/60"}`}>
          Histórico ({despesasPagas.length})
        </button>
      </div>

      <div className="bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl">
        {(subAba === "pendentes" ? despesasPendentes : despesasPagas).length === 0 ? (
          <div className="p-12 text-center"><p className="font-body text-amber-100/40">{subAba === "pendentes" ? "Sem despesas pendentes ✨" : "Sem histórico"}</p></div>
        ) : (
          <div className="divide-y divide-amber-100/5">
            {(subAba === "pendentes" ? despesasPendentes : despesasPagas)
              .sort((a, b) => (a.data_vencimento || a.data || "").localeCompare(b.data_vencimento || b.data || ""))
              .map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-4 hover:bg-amber-100/[0.02] group">
                  <div className="flex-1">
                    <div className="font-body text-amber-50">{d.descricao}</div>
                    <div className="font-mono text-[10px] text-amber-100/40">{formatarDataBR(d.data_vencimento || d.data)}</div>
                  </div>
                  <div className="font-mono num-tabular text-amber-200">{formatBRL(d.valor)}</div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    {subAba === "pendentes" && <button onClick={() => onMarcarPaga(d.id)} className="p-1 text-emerald-400/70 hover:text-emerald-400"><Check size={14} /></button>}
                    <button onClick={() => onRemover(d.id)} className="p-1 text-amber-100/30 hover:text-rose-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ParcelamentosAba({ parcelamentos, categorias, onAdicionar, onRemover, onMarcarPaga }) {
  const parcelamentosAtivos = parcelamentos.filter((p) => p.status === "ativo");

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] text-amber-100/40 uppercase">Parcelamentos ativos</p>
          <h2 className="font-mono num-tabular text-4xl font-bold text-amber-50">{parcelamentosAtivos.length}</h2>
        </div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-amber-200 text-[#0a0a0f] font-body text-sm flex items-center gap-2">
          <Plus size={14} />Novo
        </button>
      </div>

      <div className="bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl">
        {parcelamentos.length === 0 ? (
          <div className="p-12 text-center"><p className="font-body text-amber-100/40">Nenhum parcelamento</p></div>
        ) : (
          <div className="divide-y divide-amber-100/5">
            {parcelamentos.map((p) => {
              const percentual = (p.parcelas_pagas / p.parcelas_total) * 100;
              const valorParcela = p.valor_total / p.parcelas_total;
              return (
                <div key={p.id} className="p-6 hover:bg-amber-100/[0.02] transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-body text-lg text-amber-50">{p.descricao}</h3>
                      <p className="font-mono text-[10px] text-amber-100/40 mt-1">Próx: {formatarDataBR(p.proxima_parcela_data)}</p>
                    </div>
                    <button onClick={() => onRemover(p.id)} className="text-amber-100/30 hover:text-rose-400"><Trash2 size={14} /></button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="font-mono text-[10px] text-amber-100/40 mb-1">VALOR TOTAL</p>
                      <p className="font-mono num-tabular text-amber-200">{formatBRL(p.valor_total)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-amber-100/40 mb-1">JÁ PAGO</p>
                      <p className="font-mono num-tabular text-emerald-300">{formatBRL(p.valor_pago || 0)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-amber-100/40 mb-1">POR PARCELA</p>
                      <p className="font-mono num-tabular text-amber-300">{formatBRL(valorParcela)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[10px] text-amber-100/40 mb-1">PROGRESSO</p>
                      <p className="font-mono num-tabular text-amber-300">{p.parcelas_pagas}/{p.parcelas_total}</p>
                    </div>
                  </div>

                  <div className="w-full bg-amber-100/10 rounded-full h-2 mb-3 overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all" style={{ width: `${percentual}%` }} />
                  </div>

                  {p.parcelas_pagas < p.parcelas_total && (
                    <button onClick={() => onMarcarPaga(p.id)} className="w-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 py-2 rounded-lg font-body text-sm hover:bg-emerald-400/30 transition flex items-center justify-center gap-2">
                      <Check size={14} />Marcar próxima como paga
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ReceitasAba({ receitas, totalReceitasMes, onAdicionar, onRemover }) {
  const recDoMes = receitas.filter((r) => (r.mes || mesAtual()) === mesAtual());
  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] text-amber-100/40 uppercase">Receitas</p>
          <h2 className="font-mono num-tabular text-4xl font-bold text-emerald-200">{formatBRL(totalReceitasMes)}</h2>
        </div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-emerald-300 text-[#0a0a0f] font-body text-sm flex items-center gap-2">
          <Plus size={14} />Nova
        </button>
      </div>
      <div className="bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl">
        {recDoMes.length === 0 ? (
          <div className="p-12 text-center"><p className="font-body text-amber-100/40">Nenhuma receita</p></div>
        ) : (
          <div className="divide-y divide-amber-100/5">
            {recDoMes.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-amber-100/[0.02] group">
                <div className="flex-1"><div className="font-body text-amber-50">{r.fonte}</div></div>
                <div className="font-mono num-tabular text-emerald-300">{formatBRL(r.valor)}</div>
                <button onClick={() => onRemover(r.id)} className="opacity-0 group-hover:opacity-100 text-amber-100/30 hover:text-rose-400"><Trash2 size={14} /></button>
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
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] text-amber-100/40 uppercase">Total mensal</p>
          <h2 className="font-mono num-tabular text-4xl font-bold text-amber-50">{formatBRL(total)}</h2>
        </div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-amber-200 text-[#0a0a0f] font-body text-sm flex items-center gap-2">
          <Plus size={14} />Nova
        </button>
      </div>
      <div className="bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl">
        {assinaturas.length === 0 ? (
          <div className="p-12 text-center"><p className="font-body text-amber-100/40">Nenhuma</p></div>
        ) : (
          <div className="divide-y divide-amber-100/5">
            {assinaturas.map((a) => (
              <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-amber-100/[0.02] group">
                <div className="flex-1"><div className="font-body text-amber-50">{a.nome}</div></div>
                <div className="font-mono num-tabular text-amber-200">{formatBRL(a.valor)}</div>
                <button onClick={() => onRemover(a.id)} className="opacity-0 group-hover:opacity-100 text-amber-100/30 hover:text-rose-400"><Trash2 size={14} /></button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10">
          <h3 className="font-display text-2xl italic text-amber-50">Nova receita</h3>
          <button onClick={onFechar}><X size={20} className="text-amber-100/40" /></button>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="Salário..." className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 placeholder:text-amber-100/30 focus:outline-none" />
          <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 font-mono num-tabular focus:outline-none" />
          <button onClick={submit} disabled={salvando} className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium hover:bg-amber-100">{salvando ? "..." : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

function ModalDespesa({ categorias, onFechar, onSalvar }) {
  const [descricao, setDescricao] = useState(""); const [valor, setValor] = useState(""); const [categoriaId, setCategoriaId] = useState(categorias[0]?.id || ""); const [dataVencimento, setDataVencimento] = useState(hojeISO()); const [parcelas, setParcelas] = useState(1); const [salvando, setSalvando] = useState(false);
  const valorParcela = (parseFloat(valor) || 0) / Math.max(1, parcelas);
  const submit = async () => { if (!descricao || !valor) return; setSalvando(true); await onSalvar({ descricao, valor: valorParcela, categoria_id: categoriaId, dataVencimento, parcelas }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10 sticky top-0 bg-[#15151c]">
          <h3 className="font-display text-2xl italic text-amber-50">Nova despesa</h3>
          <button onClick={onFechar}><X size={20} className="text-amber-100/40" /></button>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Almoço" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 font-mono num-tabular focus:outline-none" />
            <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 focus:outline-none" />
          </div>
          <input type="number" min="1" max="60" value={parcelas} onChange={(e) => setParcelas(Math.max(1, parseInt(e.target.value) || 1))} className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 font-mono num-tabular focus:outline-none" />
          <button onClick={submit} disabled={salvando} className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium hover:bg-amber-100">{salvando ? "..." : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

function ModalAssinatura({ onFechar, onSalvar }) {
  const [nome, setNome] = useState(""); const [valor, setValor] = useState(""); const [diaVencimento, setDiaVencimento] = useState("5"); const [salvando, setSalvando] = useState(false);
  const submit = async () => { if (!nome || !valor) return; setSalvando(true); await onSalvar({ nome, valor: parseFloat(valor), dia_vencimento: parseInt(diaVencimento) }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10">
          <h3 className="font-display text-2xl italic text-amber-50">Nova assinatura</h3>
          <button onClick={onFechar}><X size={20} className="text-amber-100/40" /></button>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Netflix..." className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 font-mono focus:outline-none" />
            <input type="number" min="1" max="31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 font-mono focus:outline-none" />
          </div>
          <button onClick={submit} disabled={salvando} className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium">{salvando ? "..." : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

function ModalParcelamento({ categorias, onFechar, onSalvar }) {
  const [descricao, setDescricao] = useState(""); const [valorTotal, setValorTotal] = useState(""); const [parcelas, setParcelas] = useState(3); const [dataInicio, setDataInicio] = useState(hojeISO()); const [salvando, setSalvando] = useState(false);
  const submit = async () => { if (!descricao || !valorTotal) return; setSalvando(true); await onSalvar({ descricao, valor_total: parseFloat(valorTotal), parcelas_total: parseInt(parcelas), dataInicio }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10">
          <h3 className="font-display text-2xl italic text-amber-50">Novo parcelamento</h3>
          <button onClick={onFechar}><X size={20} className="text-amber-100/40" /></button>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Monitor" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 focus:outline-none" />
          <input type="number" step="0.01" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} placeholder="0,00" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 font-mono focus:outline-none" />
          <input type="number" min="2" value={parcelas} onChange={(e) => setParcelas(parseInt(e.target.value) || 2)} className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 font-mono focus:outline-none" />
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 focus:outline-none" />
          <button onClick={submit} disabled={salvando} className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium">{salvando ? "..." : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

function ModalCategoria({ onFechar, onSalvar }) {
  const [nome, setNome] = useState(""); const [salvando, setSalvando] = useState(false);
  const submit = async () => { if (!nome) return; setSalvando(true); await onSalvar({ nome, cor: "#fbbf24", icone: "Tag" }); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10">
          <h3 className="font-display text-2xl italic text-amber-50">Nova categoria</h3>
          <button onClick={onFechar}><X size={20} className="text-amber-100/40" /></button>
        </div>
        <div className="p-6 space-y-4">
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome" className="w-full bg-amber-100/[0.03] border border-amber-100/15 rounded-lg px-4 py-3 text-amber-50 focus:outline-none" />
          <button onClick={submit} disabled={salvando} className="w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium">{salvando ? "..." : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}