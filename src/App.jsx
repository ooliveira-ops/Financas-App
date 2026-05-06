import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Plus,
  Trash2,
  Wallet,
  Calendar,
  X,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Repeat,
  Home,
  PieChart as PieIcon,
  AlertCircle,
  Check,
  GraduationCap,
  Utensils,
  User,
  Car,
  ShoppingBag,
  Heart,
  Plane,
  Coffee,
  Tag,
} from "lucide-react";

// ---------- DADOS ESTÁTICOS ----------
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
  { id: "faculdade", nome: "Faculdade", cor: "#a78bfa", icone: "GraduationCap" },
  { id: "comida", nome: "Comida", cor: "#fb923c", icone: "Utensils" },
  { id: "pessoal", nome: "Gastos pessoais", cor: "#f472b6", icone: "User" },
  { id: "moradia", nome: "Moradia", cor: "#60a5fa", icone: "Home" },
  { id: "transporte", nome: "Transporte", cor: "#34d399", icone: "Car" },
];

const CORES_DISPONIVEIS = [
  "#a78bfa", "#fb923c", "#f472b6", "#60a5fa", "#34d399",
  "#fbbf24", "#f87171", "#22d3ee", "#a3e635", "#e879f9",
];

const ICONES_DISPONIVEIS = [
  "Tag", "GraduationCap", "Utensils", "User", "Home",
  "Car", "ShoppingBag", "Heart", "Plane", "Coffee",
];

// ---------- HELPERS ----------
const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v || 0);

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

// localStorage helpers
const lsGet = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const lsSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Erro ao salvar:", e);
  }
};

// ---------- APP ----------
export default function App() {
  const [aba, setAba] = useState("home");

  const [receitas, setReceitas] = useState(() => lsGet("receitas", []));
  const [despesas, setDespesas] = useState(() => lsGet("despesas", []));
  const [assinaturas, setAssinaturas] = useState(() => lsGet("assinaturas", []));
  const [categorias, setCategorias] = useState(() => lsGet("categorias", CATEGORIAS_PADRAO));

  const [quote, setQuote] = useState(QUOTES[0]);
  const [mostrarResumo, setMostrarResumo] = useState(false);

  const [modalReceita, setModalReceita] = useState(false);
  const [modalDespesa, setModalDespesa] = useState(false);
  const [modalAssinatura, setModalAssinatura] = useState(false);
  const [modalCategoria, setModalCategoria] = useState(false);

  // Frase do dia + resumo dia 5+
  useEffect(() => {
    const seed = parseInt(hojeISO().replace(/-/g, ""));
    setQuote(QUOTES[seed % QUOTES.length]);

    const resumoVisualizado = lsGet("resumoVisualizado", null);
    if (diaAtual() >= 5 && resumoVisualizado !== mesAtual()) {
      setTimeout(() => setMostrarResumo(true), 800);
    }
  }, []);

  // Persistência
  useEffect(() => lsSet("receitas", receitas), [receitas]);
  useEffect(() => lsSet("despesas", despesas), [despesas]);
  useEffect(() => lsSet("assinaturas", assinaturas), [assinaturas]);
  useEffect(() => lsSet("categorias", categorias), [categorias]);

  // Ações
  const adicionarReceita = (n) => setReceitas([...receitas, { ...n, id: Date.now() }]);
  const removerReceita = (id) => setReceitas(receitas.filter((r) => r.id !== id));
  const adicionarDespesa = (n) => setDespesas([...despesas, { ...n, id: Date.now() }]);
  const removerDespesa = (id) => setDespesas(despesas.filter((d) => d.id !== id));
  const adicionarAssinatura = (n) => setAssinaturas([...assinaturas, { ...n, id: Date.now() }]);
  const removerAssinatura = (id) => setAssinaturas(assinaturas.filter((a) => a.id !== id));
  const adicionarCategoria = (n) => {
    const id = n.nome.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    setCategorias([...categorias, { ...n, id }]);
  };
  const removerCategoria = (id) => {
    if (despesas.some((d) => d.categoriaId === id)) {
      alert("Não é possível remover: existem despesas nesta categoria.");
      return;
    }
    setCategorias(categorias.filter((c) => c.id !== id));
  };

  const fecharResumo = () => {
    setMostrarResumo(false);
    lsSet("resumoVisualizado", mesAtual());
  };

  // Cálculos
  const totalReceitasMes = useMemo(
    () => receitas.filter((r) => (r.mes || mesAtual()) === mesAtual()).reduce((s, r) => s + parseFloat(r.valor || 0), 0),
    [receitas]
  );

  const totalAssinaturasMes = useMemo(
    () => assinaturas.reduce((s, a) => s + parseFloat(a.valor || 0), 0),
    [assinaturas]
  );

  const despesasMesAtual = useMemo(
    () => despesas.filter((d) => d.data && d.data.startsWith(mesAtual())),
    [despesas]
  );

  const totalDespesasMes = useMemo(
    () => despesasMesAtual.reduce((s, d) => s + parseFloat(d.valor || 0), 0) + totalAssinaturasMes,
    [despesasMesAtual, totalAssinaturasMes]
  );

  const saldo = totalReceitasMes - totalDespesasMes;

  const despesasPorCategoria = useMemo(() => {
    const agrupado = {};
    despesasMesAtual.forEach((d) => {
      agrupado[d.categoriaId] = (agrupado[d.categoriaId] || 0) + parseFloat(d.valor || 0);
    });
    return categorias
      .map((c) => ({ nome: c.nome, valor: agrupado[c.id] || 0, cor: c.cor }))
      .filter((c) => c.valor > 0);
  }, [despesasMesAtual, categorias]);

  const resumoMesAnterior = useMemo(() => {
    const ma = mesAnterior();
    const desps = despesas.filter((d) => d.data && d.data.startsWith(ma));
    const recs = receitas.filter((r) => (r.mes || mesAtual()) === ma);
    const totalD = desps.reduce((s, d) => s + parseFloat(d.valor || 0), 0) + totalAssinaturasMes;
    const totalR = recs.reduce((s, r) => s + parseFloat(r.valor || 0), 0);

    const porCat = {};
    desps.forEach((d) => {
      porCat[d.categoriaId] = (porCat[d.categoriaId] || 0) + parseFloat(d.valor || 0);
    });
    let maiorCat = null;
    let maiorVal = 0;
    Object.entries(porCat).forEach(([id, v]) => {
      if (v > maiorVal) {
        maiorVal = v;
        maiorCat = categorias.find((c) => c.id === id);
      }
    });

    return {
      mes: ma,
      totalDespesas: totalD,
      totalReceitas: totalR,
      saldo: totalR - totalD,
      maiorCategoria: maiorCat,
      maiorValor: maiorVal,
    };
  }, [despesas, receitas, categorias, totalAssinaturasMes]);

  const proximasAssinaturas = useMemo(() => {
    const hoje = new Date();
    const diaH = hoje.getDate();
    return [...assinaturas]
      .map((a) => {
        const dia = parseInt(a.diaVencimento);
        let diasRestantes;
        if (dia >= diaH) {
          diasRestantes = dia - diaH;
        } else {
          const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
          diasRestantes = ultimoDiaMes - diaH + dia;
        }
        return { ...a, diasRestantes };
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [assinaturas]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-amber-50 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,400&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; font-variation-settings: "SOFT" 50, "WONK" 1; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }
        body { background: #0a0a0f; }
        .grain::before {
          content: ''; position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
          opacity: 0.03; pointer-events: none; z-index: 1;
        }
        .glow-amber { background: radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.15), transparent 70%); }
        .glow-purple { background: radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.12), transparent 70%); }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeInUp { animation: fadeInUp 0.7s ease-out forwards; opacity: 0; }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
        .animate-scaleIn { animation: scaleIn 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.25s; }
        .delay-3 { animation-delay: 0.4s; }
        .delay-4 { animation-delay: 0.55s; }
        .delay-5 { animation-delay: 0.7s; }
        .scroll-fine::-webkit-scrollbar { width: 6px; }
        .scroll-fine::-webkit-scrollbar-track { background: transparent; }
        .scroll-fine::-webkit-scrollbar-thumb { background: rgba(251, 191, 36, 0.2); border-radius: 3px; }
      `}</style>

      <div className="fixed inset-0 grain pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] glow-amber pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] glow-purple pointer-events-none" />

      <header className="relative z-10 px-6 md:px-12 pt-8 pb-4 flex items-center justify-between border-b border-amber-100/5">
        <div className="animate-fadeIn">
          <div className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase">
            Finanças · {nomeMes(mesAtual())}
          </div>
          <h1 className="font-display text-2xl md:text-3xl italic text-amber-50 mt-1">olá, Filipe</h1>
        </div>
        <div className="text-right animate-fadeIn delay-1">
          <div className="font-mono text-[10px] tracking-[0.25em] text-amber-100/30 uppercase">created by</div>
          <div className="font-display text-sm italic text-amber-200/80 mt-0.5">Filipe Oliveira</div>
        </div>
      </header>

      <nav className="relative z-10 px-6 md:px-12 py-4 flex gap-1 overflow-x-auto scroll-fine border-b border-amber-100/5">
        {[
          { id: "home", label: "Início", icon: Home },
          { id: "despesas", label: "Despesas", icon: PieIcon },
          { id: "receitas", label: "Receitas", icon: Wallet },
          { id: "assinaturas", label: "Assinaturas", icon: Repeat },
        ].map((t) => {
          const Icon = t.icon;
          const ativo = aba === t.id;
          return (
            <button key={t.id} onClick={() => setAba(t.id)}
              className={`px-4 py-2 rounded-full font-body text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
                ativo ? "bg-amber-100 text-[#0a0a0f]" : "text-amber-100/50 hover:text-amber-100 hover:bg-amber-100/5"
              }`}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </nav>

      <main className="relative z-10 px-6 md:px-12 py-8 max-w-6xl mx-auto">
        {aba === "home" && (
          <HomeAba quote={quote} saldo={saldo} totalReceitasMes={totalReceitasMes}
            totalDespesasMes={totalDespesasMes} despesasPorCategoria={despesasPorCategoria}
            proximasAssinaturas={proximasAssinaturas} />
        )}
        {aba === "despesas" && (
          <DespesasAba despesas={despesas} categorias={categorias} despesasMesAtual={despesasMesAtual}
            despesasPorCategoria={despesasPorCategoria} totalDespesasMes={totalDespesasMes - totalAssinaturasMes}
            onAdicionar={() => setModalDespesa(true)} onRemover={removerDespesa}
            onAdicionarCategoria={() => setModalCategoria(true)} onRemoverCategoria={removerCategoria} />
        )}
        {aba === "receitas" && (
          <ReceitasAba receitas={receitas} totalReceitasMes={totalReceitasMes}
            onAdicionar={() => setModalReceita(true)} onRemover={removerReceita} />
        )}
        {aba === "assinaturas" && (
          <AssinaturasAba assinaturas={proximasAssinaturas} total={totalAssinaturasMes}
            onAdicionar={() => setModalAssinatura(true)} onRemover={removerAssinatura} />
        )}
      </main>

      <footer className="relative z-10 px-6 md:px-12 py-8 mt-12 border-t border-amber-100/5">
        <div className="flex items-center justify-between text-amber-100/30 text-xs font-mono tracking-widest">
          <span>FINANÇAS PESSOAIS</span><span>·</span><span>FILIPE OLIVEIRA</span>
        </div>
      </footer>

      {modalReceita && <ModalReceita onFechar={() => setModalReceita(false)} onSalvar={(r) => { adicionarReceita(r); setModalReceita(false); }} />}
      {modalDespesa && <ModalDespesa categorias={categorias} onFechar={() => setModalDespesa(false)} onSalvar={(d) => { adicionarDespesa(d); setModalDespesa(false); }} />}
      {modalAssinatura && <ModalAssinatura onFechar={() => setModalAssinatura(false)} onSalvar={(a) => { adicionarAssinatura(a); setModalAssinatura(false); }} />}
      {modalCategoria && <ModalCategoria onFechar={() => setModalCategoria(false)} onSalvar={(c) => { adicionarCategoria(c); setModalCategoria(false); }} />}
      {mostrarResumo && <ResumoMensal resumo={resumoMesAnterior} onFechar={fecharResumo} />}
    </div>
  );
}

// ---------- HOME ----------
function HomeAba({ quote, saldo, totalReceitasMes, totalDespesasMes, despesasPorCategoria, proximasAssinaturas }) {
  return (
    <div className="space-y-10">
      <section className="animate-fadeInUp delay-1 py-12 md:py-20 text-center relative">
        <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 text-amber-300/30" size={20} />
        <p className="font-display text-3xl md:text-5xl italic leading-tight text-amber-50 max-w-3xl mx-auto px-4">"{quote.text}"</p>
        {quote.author && <p className="font-mono text-xs tracking-[0.3em] text-amber-200/40 uppercase mt-6">— {quote.author}</p>}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardResumo label="Receitas do mês" valor={totalReceitasMes} icon={TrendingUp} cor="text-emerald-300" delay={2} />
        <CardResumo label="Despesas do mês" valor={totalDespesasMes} icon={TrendingDown} cor="text-rose-300" delay={3} />
        <CardResumo label="Saldo" valor={saldo} icon={Wallet} cor={saldo >= 0 ? "text-amber-300" : "text-rose-400"} destaque delay={4} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-fadeInUp delay-5 bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl p-6">
          <h3 className="font-display text-xl italic text-amber-100 mb-1">Gastos por categoria</h3>
          <p className="font-mono text-[10px] tracking-widest text-amber-100/30 uppercase mb-6">Este mês</p>
          {despesasPorCategoria.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center">
              <p className="font-body text-amber-100/40 text-sm">Sem despesas registradas ainda</p>
            </div>
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
                  <span className="text-amber-100/40 font-mono ml-auto">{formatBRL(c.valor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="animate-fadeInUp delay-5 bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl p-6">
          <h3 className="font-display text-xl italic text-amber-100 mb-1">Próximos vencimentos</h3>
          <p className="font-mono text-[10px] tracking-widest text-amber-100/30 uppercase mb-6">Assinaturas</p>
          {proximasAssinaturas.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              <p className="font-body text-amber-100/40 text-sm">Nenhuma assinatura cadastrada</p>
            </div>
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
                        <div className="font-mono text-[10px] text-amber-100/40">
                          dia {a.diaVencimento} · {a.diasRestantes === 0 ? "hoje" : a.diasRestantes === 1 ? "amanhã" : `em ${a.diasRestantes} dias`}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-sm text-amber-200">{formatBRL(a.valor)}</div>
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
      <div className={`font-display text-3xl italic ${cor}`}>{formatBRL(valor)}</div>
    </div>
  );
}

// ---------- DESPESAS ----------
function DespesasAba({ despesas, categorias, despesasMesAtual, totalDespesasMes, onAdicionar, onRemover, onAdicionarCategoria, onRemoverCategoria }) {
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const despesasFiltradas = categoriaFiltro === "todas" ? despesasMesAtual : despesasMesAtual.filter((d) => d.categoriaId === categoriaFiltro);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase">Total deste mês</p>
          <h2 className="font-display text-5xl italic text-amber-50 mt-1">{formatBRL(totalDespesasMes)}</h2>
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

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategoriaFiltro("todas")} className={`px-3 py-1.5 rounded-full font-body text-xs transition ${categoriaFiltro === "todas" ? "bg-amber-100 text-[#0a0a0f]" : "bg-amber-100/5 text-amber-100/60 border border-amber-100/10"}`}>Todas</button>
        {categorias.map((c) => {
          const Icon = ICONS_MAP[c.icone] || Tag;
          const ativa = categoriaFiltro === c.id;
          return (
            <button key={c.id} onClick={() => setCategoriaFiltro(c.id)}
              className={`group px-3 py-1.5 rounded-full font-body text-xs flex items-center gap-2 transition ${ativa ? "text-[#0a0a0f]" : "text-amber-100/70"}`}
              style={{ background: ativa ? c.cor : "rgba(251,191,36,0.05)", border: ativa ? "none" : "1px solid rgba(251,191,36,0.1)" }}>
              <Icon size={12} />{c.nome}
              {!CATEGORIAS_PADRAO.find((cp) => cp.id === c.id) && (
                <span onClick={(e) => { e.stopPropagation(); if (confirm(`Remover categoria "${c.nome}"?`)) onRemoverCategoria(c.id); }}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-pointer"><X size={11} /></span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-amber-100/[0.02] border border-amber-100/10 rounded-2xl overflow-hidden">
        {despesasFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-body text-amber-100/40 text-sm">Nenhuma despesa neste filtro</p>
            <p className="font-mono text-[10px] text-amber-100/30 mt-2 tracking-widest">CLIQUE EM "NOVA DESPESA" PARA COMEÇAR</p>
          </div>
        ) : (
          <div className="divide-y divide-amber-100/5">
            {despesasFiltradas.sort((a, b) => b.data.localeCompare(a.data)).map((d) => {
              const cat = categorias.find((c) => c.id === d.categoriaId);
              const Icon = cat ? ICONS_MAP[cat.icone] || Tag : Tag;
              return (
                <div key={d.id} className="flex items-center gap-4 p-4 hover:bg-amber-100/[0.02] transition group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cat ? `${cat.cor}20` : "#94a3b820", color: cat?.cor || "#94a3b8" }}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-amber-50 truncate">{d.descricao}</div>
                    <div className="font-mono text-[10px] text-amber-100/40 mt-0.5">{cat?.nome} · {new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR")}</div>
                  </div>
                  <div className="font-mono text-sm text-amber-200">{formatBRL(d.valor)}</div>
                  <button onClick={() => onRemover(d.id)} className="opacity-0 group-hover:opacity-100 text-amber-100/30 hover:text-rose-400 transition"><Trash2 size={14} /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- RECEITAS ----------
function ReceitasAba({ receitas, totalReceitasMes, onAdicionar, onRemover }) {
  const recDoMes = receitas.filter((r) => (r.mes || mesAtual()) === mesAtual());
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase">Receitas deste mês</p>
          <h2 className="font-display text-5xl italic text-emerald-200 mt-1">{formatBRL(totalReceitasMes)}</h2>
        </div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-emerald-300 text-[#0a0a0f] hover:bg-emerald-200 font-body text-sm flex items-center gap-2 transition">
          <Plus size={14} />Nova receita
        </button>
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
                <div className="font-mono text-sm text-emerald-300">{formatBRL(r.valor)}</div>
                <button onClick={() => onRemover(r.id)} className="opacity-0 group-hover:opacity-100 text-amber-100/30 hover:text-rose-400 transition"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- ASSINATURAS ----------
function AssinaturasAba({ assinaturas, total, onAdicionar, onRemover }) {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.3em] text-amber-100/40 uppercase">Total mensal em assinaturas</p>
          <h2 className="font-display text-5xl italic text-amber-50 mt-1">{formatBRL(total)}</h2>
        </div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-amber-200 text-[#0a0a0f] hover:bg-amber-100 font-body text-sm flex items-center gap-2 transition">
          <Plus size={14} />Nova assinatura
        </button>
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
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${proximo ? "bg-rose-400/15 text-rose-400" : "bg-amber-200/10 text-amber-200"}`}>
                    <Calendar size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="font-body text-amber-50">{a.nome}</div>
                    <div className="font-mono text-[10px] text-amber-100/40 mt-0.5">
                      vence dia {a.diaVencimento} · {a.diasRestantes === 0 ? "HOJE" : a.diasRestantes === 1 ? "AMANHÃ" : `em ${a.diasRestantes} dias`}
                    </div>
                  </div>
                  <div className="font-mono text-sm text-amber-200">{formatBRL(a.valor)}</div>
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

// ---------- MODAIS ----------
function ModalBase({ titulo, subtitulo, onFechar, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onFechar}>
      <div className="bg-[#15151c] border border-amber-100/15 rounded-2xl w-full max-w-md animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-amber-100/10">
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
const btnSalvar = "w-full bg-amber-200 text-[#0a0a0f] py-3 rounded-lg font-body font-medium hover:bg-amber-100 transition flex items-center justify-center gap-2";

function ModalReceita({ onFechar, onSalvar }) {
  const [fonte, setFonte] = useState("");
  const [valor, setValor] = useState("");
  const [mes, setMes] = useState(mesAtual());
  const submit = () => { if (!fonte || !valor) return; onSalvar({ fonte, valor: parseFloat(valor), mes }); };
  return (
    <ModalBase titulo="Nova receita" subtitulo="Salário, freela, outros" onFechar={onFechar}>
      <div className="space-y-4">
        <div><label className={labelStyle}>Fonte</label><input type="text" value={fonte} onChange={(e) => setFonte(e.target.value)} placeholder="Ex: Salário, Freela, Mesada" className={inputStyle} /></div>
        <div><label className={labelStyle}>Valor (R$)</label><input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={inputStyle} /></div>
        <div><label className={labelStyle}>Mês de referência</label><input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className={inputStyle} /></div>
        <button onClick={submit} className={btnSalvar}><Check size={16} />Salvar receita</button>
      </div>
    </ModalBase>
  );
}

function ModalDespesa({ categorias, onFechar, onSalvar }) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id || "");
  const [data, setData] = useState(hojeISO());
  const submit = () => { if (!descricao || !valor || !categoriaId) return; onSalvar({ descricao, valor: parseFloat(valor), categoriaId, data }); };
  return (
    <ModalBase titulo="Nova despesa" subtitulo="Registre um gasto" onFechar={onFechar}>
      <div className="space-y-4">
        <div><label className={labelStyle}>Descrição</label><input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Almoço no RU, Livro do curso..." className={inputStyle} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelStyle}>Valor (R$)</label><input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={inputStyle} /></div>
          <div><label className={labelStyle}>Data</label><input type="date" value={data} onChange={(e) => setData(e.target.value)} className={inputStyle} /></div>
        </div>
        <div>
          <label className={labelStyle}>Categoria</label>
          <div className="grid grid-cols-2 gap-2">
            {categorias.map((c) => {
              const Icon = ICONS_MAP[c.icone] || Tag;
              const ativa = categoriaId === c.id;
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
        <button onClick={submit} className={btnSalvar}><Check size={16} />Salvar despesa</button>
      </div>
    </ModalBase>
  );
}

function ModalAssinatura({ onFechar, onSalvar }) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("5");
  const submit = () => {
    if (!nome || !valor || !diaVencimento) return;
    const dia = Math.max(1, Math.min(31, parseInt(diaVencimento)));
    onSalvar({ nome, valor: parseFloat(valor), diaVencimento: dia });
  };
  return (
    <ModalBase titulo="Nova assinatura" subtitulo="Plano ou app recorrente" onFechar={onFechar}>
      <div className="space-y-4">
        <div><label className={labelStyle}>Nome</label><input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Netflix, Spotify, Academia..." className={inputStyle} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelStyle}>Valor (R$)</label><input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={inputStyle} /></div>
          <div><label className={labelStyle}>Dia do mês</label><input type="number" min="1" max="31" value={diaVencimento} onChange={(e) => setDiaVencimento(e.target.value)} className={inputStyle} /></div>
        </div>
        <button onClick={submit} className={btnSalvar}><Check size={16} />Salvar assinatura</button>
      </div>
    </ModalBase>
  );
}

function ModalCategoria({ onFechar, onSalvar }) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES_DISPONIVEIS[0]);
  const [icone, setIcone] = useState(ICONES_DISPONIVEIS[0]);
  const submit = () => { if (!nome) return; onSalvar({ nome, cor, icone }); };
  return (
    <ModalBase titulo="Nova categoria" subtitulo="Crie sua própria" onFechar={onFechar}>
      <div className="space-y-4">
        <div><label className={labelStyle}>Nome</label><input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Pets, Viagens, Academia..." className={inputStyle} /></div>
        <div>
          <label className={labelStyle}>Cor</label>
          <div className="flex flex-wrap gap-2">
            {CORES_DISPONIVEIS.map((c) => (
              <button key={c} onClick={() => setCor(c)}
                className={`w-9 h-9 rounded-full transition ${cor === c ? "ring-2 ring-offset-2 ring-offset-[#15151c] ring-amber-200" : ""}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>
        <div>
          <label className={labelStyle}>Ícone</label>
          <div className="grid grid-cols-5 gap-2">
            {ICONES_DISPONIVEIS.map((i) => {
              const Icon = ICONS_MAP[i];
              const ativa = icone === i;
              return (
                <button key={i} onClick={() => setIcone(i)}
                  className={`p-3 rounded-lg flex items-center justify-center transition ${ativa ? "bg-amber-200 text-[#0a0a0f]" : "bg-amber-100/[0.03] border border-amber-100/10 text-amber-100/70 hover:bg-amber-100/5"}`}>
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>
        <button onClick={submit} className={btnSalvar}><Check size={16} />Criar categoria</button>
      </div>
    </ModalBase>
  );
}

// ---------- RESUMO MENSAL ----------
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
                <p className="font-display text-xl italic text-emerald-200 mt-1">{formatBRL(resumo.totalReceitas)}</p>
              </div>
              <div className="bg-rose-500/5 border border-rose-400/20 rounded-xl p-4">
                <p className="font-mono text-[10px] tracking-widest text-rose-300/60 uppercase">Despesas</p>
                <p className="font-display text-xl italic text-rose-200 mt-1">{formatBRL(resumo.totalDespesas)}</p>
              </div>
            </div>
            <div className={`rounded-xl p-5 border ${resumo.saldo >= 0 ? "bg-amber-200/5 border-amber-200/30" : "bg-rose-500/10 border-rose-400/30"}`}>
              <p className="font-mono text-[10px] tracking-widest text-amber-100/50 uppercase">Saldo final</p>
              <p className={`font-display text-3xl italic mt-1 ${resumo.saldo >= 0 ? "text-amber-200" : "text-rose-300"}`}>{formatBRL(resumo.saldo)}</p>
            </div>
            {resumo.maiorCategoria && (
              <div className="bg-amber-100/[0.03] border border-amber-100/10 rounded-xl p-4">
                <p className="font-mono text-[10px] tracking-widest text-amber-100/50 uppercase mb-1">Categoria que mais consumiu</p>
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg italic text-amber-50">{resumo.maiorCategoria.nome}</span>
                  <span className="font-mono text-sm" style={{ color: resumo.maiorCategoria.cor }}>{formatBRL(resumo.maiorValor)}</span>
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
