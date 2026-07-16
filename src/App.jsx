import React, { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Plus, Trash2, Wallet, X, TrendingUp, Repeat, Home, PieChart as PieIcon,
  Check, GraduationCap, Utensils, User, Car, ShoppingBag, Heart, Plane,
  Coffee, Tag, LogOut, Loader2, Clock, History, CheckCircle2, Bell, Zap,
  FileDown, Shield, BarChart2, RefreshCw, HelpCircle,
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
  { text: "A disciplina é a ponte entre objetivos e conquistas.", author: "Jim Rohn" },
  { text: "Cuide dos centavos, que os reais cuidarão de si mesmos.", author: "Benjamin Franklin" },
  { text: "O futuro pertence àqueles que acreditam na beleza de seus sonhos.", author: "Eleanor Roosevelt" },
  { text: "A jornada de mil milhas começa com um único passo.", author: "Lao-Tsé" },
  { text: "Investir em conhecimento rende sempre os melhores juros.", author: "Benjamin Franklin" },
  { text: "Acredite que você pode, e você já está no meio do caminho.", author: "Theodore Roosevelt" },
];

const ICONS_MAP = { GraduationCap, Utensils, User, Home, Car, ShoppingBag, Heart, Plane, Coffee, Tag };

// Novidades são gerenciadas pelo painel admin — sem editar código!

const CATEGORIAS_PADRAO = [
  { nome: "Faculdade", cor: "#60a5fa", icone: "GraduationCap" },
  { nome: "Comida", cor: "#34d399", icone: "Utensils" },
  { nome: "Gastos pessoais", cor: "#a78bfa", icone: "User" },
  { nome: "Moradia", cor: "#38bdf8", icone: "Home" },
  { nome: "Transporte", cor: "#6ee7b7", icone: "Car" },
];

const CORES_PIZZA = ["#60a5fa", "#34d399", "#a78bfa", "#38bdf8", "#6ee7b7", "#93c5fd", "#4ade80", "#818cf8"];

// Conteúdo do botão "Dúvidas" de cada seção — edite os textos aqui sempre que quiser mudar as explicações
const AJUDA_CONTEUDO = {
  home: {
    titulo: "Como funciona a Home",
    explicacao: "A Home mostra um resumo geral do seu mês: quanto entrou (receitas), quanto já foi pago, quanto ainda falta pagar e o saldo. Também mostra suas próximas assinaturas e permite gerar um relatório em PDF do mês.",
    passos: [
      "Cadastre suas receitas do mês na aba Receitas para o saldo aparecer aqui.",
      "Conforme você marca despesas como pagas, os cards 'Pago' e 'A pagar' vão se atualizando sozinhos.",
      "Clique em 'Gerar Relatório do Mês' quando quiser baixar um PDF com tudo o que aconteceu no mês.",
    ],
  },
  despesas: {
    titulo: "Como funciona Despesas",
    explicacao: "Aqui ficam seus gastos do mês, separados em 'Pendentes' (ainda não pagos) e 'Histórico' (já pagos). Uma despesa também pode ser parcelada direto por aqui.",
    passos: [
      "Clique em 'Nova' e preencha a descrição (ex: Almoço), o valor e a data de vencimento.",
      "Se quiser dividir em várias vezes, mude o campo 'Parcelas' — o valor de cada parcela é calculado automaticamente.",
      "Quando pagar uma despesa, clique no ícone de check (✓) para marcá-la como paga e ela vai para o Histórico.",
    ],
  },
  receitas: {
    titulo: "Como funciona Receitas",
    explicacao: "É onde você registra o dinheiro que entra no mês, como salário, freelas ou qualquer outra fonte de renda. É a partir daqui que o app calcula seu saldo.",
    passos: [
      "Clique em 'Nova' e informe de onde veio o dinheiro (ex: Salário) e o valor.",
      "A receita é sempre associada ao mês atual automaticamente.",
      "Repita sempre que receber um novo valor, mesmo que seja mais de uma vez no mês.",
    ],
  },
  assinaturas: {
    titulo: "Como funcionam as Assinaturas",
    explicacao: "Assinaturas são gastos fixos que se repetem todo mês, como Netflix ou academia. O app gera automaticamente uma despesa desse valor todo mês, no dia de vencimento que você escolher.",
    passos: [
      "Clique em 'Nova' e informe o nome (ex: Netflix), o valor e o dia do mês em que ela vence.",
      "Assim que o mês virar, o app cria sozinho a despesa correspondente na aba Despesas.",
      "Se cancelar o serviço, é só remover a assinatura daqui que ela para de gerar novas despesas.",
    ],
  },
  parcelamentos: {
    titulo: "Como funcionam os Parcelamentos",
    explicacao: "Parcelamentos servem para compras grandes divididas em várias vezes, como um celular em 10x. Diferente da despesa parcelada simples, aqui você acompanha o progresso de pagamento parcela por parcela.",
    passos: [
      "Clique em 'Novo' e informe a descrição (ex: Monitor), o valor total e em quantas parcelas foi dividido.",
      "A barra de progresso mostra quantas parcelas já foram pagas em relação ao total.",
      "Clique em 'Marcar próxima como paga' sempre que uma parcela for quitada.",
    ],
  },
  grafico: {
    titulo: "Como funciona o Gráfico",
    explicacao: "Essa aba mostra a evolução das suas finanças nos últimos 6 meses, comparando receitas, despesas pagas, pendentes e assinaturas mês a mês.",
    passos: [
      "Passe o mouse sobre os gráficos para ver os valores exatos de cada mês.",
      "Use o primeiro gráfico para comparar quanto entrou (receitas) com quanto saiu (pagas).",
      "Use o segundo gráfico para ver o quanto ainda está pendente e o peso das assinaturas fixas.",
    ],
  },
  historico: {
    titulo: "Como funciona o Histórico",
    explicacao: "O Histórico reúne, em ordem, tudo que já aconteceu nas suas finanças: despesas pagas, receitas recebidas e parcelas quitadas — uma espécie de linha do tempo.",
    passos: [
      "Use essa aba quando quiser conferir tudo que já foi movimentado, sem precisar entrar em cada seção separada.",
      "É útil para revisar o mês antes de gerar o relatório em PDF na Home.",
    ],
  },
};

function BotaoAjuda({ topico }) {
  const [aberto, setAberto] = useState(false);
  const conteudo = AJUDA_CONTEUDO[topico];
  if (!conteudo) return null;
  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="Dúvidas"
        className="w-8 h-8 shrink-0 rounded-full bg-white/[0.05] border border-blue-900/30 text-slate-400/70 hover:text-blue-400 hover:border-blue-500/40 transition flex items-center justify-center"
      >
        <HelpCircle size={15} />
      </button>
      {aberto && (
        <ModalBase titulo={conteudo.titulo} onFechar={() => setAberto(false)}>
          <p className="font-body text-sm text-slate-300 leading-relaxed">{conteudo.explicacao}</p>
          <div className="bg-white/[0.03] border border-blue-900/20 rounded-xl p-4 space-y-3">
            <p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Passo a passo</p>
            {conteudo.passos.map((p, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="font-mono-c text-xs text-blue-400 font-bold mt-0.5">{i + 1}</span>
                <p className="font-body text-sm text-slate-300">{p}</p>
              </div>
            ))}
          </div>
        </ModalBase>
      )}
    </>
  );
}

const formatBRL = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const hojeISO = () => new Date().toISOString().split("T")[0];
const mesAtual = () => new Date().toISOString().substring(0, 7);
const nomeMesAbrev = (mesISO) => {
  const [ano, mes] = mesISO.split("-");
  const m = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${m[parseInt(mes)-1]}/${ano.slice(2)}`;
};
const nomeMes = (mesISO) => {
  const [ano, mes] = mesISO.split("-");
  const m = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  return `${m[parseInt(mes)-1]} ${ano}`;
};
const formatarDataBR = (data) => {
  if (!data) return "—";
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
};
const formatarDataHora = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
};

// Mescla a lista mais atual do estado local com o que veio do banco, por id.
// Nunca descarta um item local que ainda não existe em "doBanco" (evita apagar
// algo que acabou de ser criado/alterado localmente enquanto essa busca rodava).
const mesclarPorId = (listaLocal, doBanco) => {
  const mapa = new Map(listaLocal.map(item => [item.id, item]));
  (doBanco || []).forEach(item => mapa.set(item.id, item));
  return Array.from(mapa.values());
};

export default function App() {
  const [session, setSession] = useState(null);
  const [carregandoSession, setCarregandoSession] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setCarregandoSession(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  if (carregandoSession) return <div className="min-h-screen flex items-center justify-center bg-[#060d1a]"><Loader2 className="text-blue-400/60 animate-spin" size={28} /></div>;
  if (!session) return <Auth />;
  return <AppLogado session={session} />;
}

function AppLogado({ session }) {
  const userId = session.user.id;
  const userNome = session.user.user_metadata?.nome || session.user.email.split("@")[0];
  const [aba, setAba] = useState("home");
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
  const carregandoRef = React.useRef(false);
  const assinaturasGeradasMesRef = React.useRef("");
  const [mostrarBanner, setMostrarBanner] = useState(false);
  const [bannerSaindo, setBannerSaindo] = useState(false);
  const [novidades, setNovidades] = useState({ versao: "", itens: [] });

  const gerarDespesasAssinaturas = async (assinaturasData, despesasExistentes) => {
    if (!assinaturasData || assinaturasData.length === 0) return [];
    const mes = mesAtual();
    const [ano, mesNum] = mes.split("-").map(Number);

    // Usa as despesas já carregadas — sem nova query ao banco
    // Filtra só despesas sem parcela (não são parcelamentos)
    const chaves = new Set(
      (despesasExistentes || [])
        .filter(d => d.parcela_atual === null && d.parcelas_total === null)
        .map(d => `${d.descricao}|${d.data_vencimento}`)
    );

    const novas = assinaturasData
      .map(a => {
        const dia = Math.min(parseInt(a.dia_vencimento), new Date(ano, mesNum, 0).getDate());
        const dataVenc = `${mes}-${String(dia).padStart(2, "0")}`;
        return { a, dataVenc };
      })
      .filter(({ a, dataVenc }) => !chaves.has(`${a.nome}|${dataVenc}`))
      .map(({ a, dataVenc }) => ({
        user_id: userId,
        descricao: a.nome,
        valor: a.valor,
        data: dataVenc,
        data_vencimento: dataVenc,
        status: "pendente",
        parcela_atual: null,
        parcelas_total: null,
      }));

    if (novas.length > 0) {
      const { data: inseridas, error } = await supabase.from("despesas").insert(novas).select();
      if (!error && inseridas) return inseridas;
    }
    return [];
  };

  const carregarTudo = async () => {
    // Mutex: impede execução simultânea
    if (carregandoRef.current) return;
    carregandoRef.current = true;

    try {
      const [r, d, a, p, c, prof] = await Promise.all([
        supabase.from("receitas").select("*").eq("user_id", userId),
        supabase.from("despesas").select("*").eq("user_id", userId),
        supabase.from("assinaturas").select("*").eq("user_id", userId),
        supabase.from("parcelamentos").select("*").eq("user_id", userId),
        supabase.from("categorias").select("*").eq("user_id", userId),
        supabase.from("profiles").select("is_admin").eq("id", userId).single(),
      ]);
      setReceitas(r.data || []);
      setAssinaturas(a.data || []);
      setParcelamentos(p.data || []);
      setIsAdmin(prof.data?.is_admin || false);
      await supabase.from("profiles").update({ ultimo_login: new Date().toISOString() }).eq("id", userId);

      // Só gera despesas de assinaturas se ainda não gerou neste mês
      const mes = mesAtual();
      let todasDespesas = d.data || [];
      if (assinaturasGeradasMesRef.current !== mes) {
        const novasGeradas = await gerarDespesasAssinaturas(a.data || [], d.data || []);
        if (novasGeradas.length > 0) {
          todasDespesas = [...todasDespesas, ...novasGeradas];
          assinaturasGeradasMesRef.current = mes; // marca que já gerou este mês
        } else {
          assinaturasGeradasMesRef.current = mes; // já existiam todas
        }
      }
      setDespesas(todasDespesas);

      if (!c.data || c.data.length === 0) {
        const novas = CATEGORIAS_PADRAO.map(cat => ({ ...cat, user_id: userId, padrao: true }));
        const { data: criadas } = await supabase.from("categorias").insert(novas).select();
        setCategorias(criadas || []);
      } else { setCategorias(c.data); }
    } finally {
      carregandoRef.current = false;
    }
  };

  useEffect(() => {
    const carregar = async () => {
      setCarregandoDados(true);
      await carregarTudo();
      setCarregandoDados(false);
      setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    };
    carregar();
  }, [userId]);

  const adicionarReceita = async (n) => {
    const { data, error } = await supabase.from("receitas").insert({ ...n, user_id: userId }).select().single();
    if (!error && data) setReceitas(prev => [...prev, data]);
  };
  const removerReceita = async (id) => {
    const { error } = await supabase.from("receitas").delete().eq("id", id);
    if (!error) setReceitas(prev => prev.filter(r => r.id !== id));
  };

  const adicionarDespesa = async (n) => {
    const { parcelas, dataVencimento, ...resto } = n;
    const lista = [];
    const dataBase = new Date(dataVencimento + "T12:00:00");
    for (let i = 0; i < parcelas; i++) {
      const dt = new Date(dataBase); dt.setMonth(dt.getMonth() + i);
      const dataStr = dt.toISOString().split("T")[0];
      lista.push({ ...resto, user_id: userId, data: dataStr, data_vencimento: dataStr, status: "pendente", parcela_atual: parcelas > 1 ? i + 1 : null, parcelas_total: parcelas > 1 ? parcelas : null });
    }
    const { data, error } = await supabase.from("despesas").insert(lista).select();
    if (!error && data) setDespesas(prev => [...prev, ...data]);
  };
  const removerDespesa = async (id) => {
    const { error } = await supabase.from("despesas").delete().eq("id", id);
    if (!error) setDespesas(prev => prev.filter(d => d.id !== id));
  };
  const marcarComoPaga = async (id) => {
    const { data, error } = await supabase.from("despesas").update({ status: "paga", data_pagamento: hojeISO() }).eq("id", id).select().single();
    if (!error && data) setDespesas(prev => prev.map(d => d.id === id ? data : d));
  };

  const adicionarAssinatura = async (n) => {
    const { data, error } = await supabase.from("assinaturas").insert({ ...n, user_id: userId }).select().single();
    if (!error && data) {
      setAssinaturas(prev => [...prev, data]);
      // Busca só as despesas que essa nova assinatura pode ter gerado e mescla
      // por id na lista atual — nunca sobrescreve a lista inteira, então nada
      // que você tenha marcado como pago nesse meio-tempo se perde.
      setTimeout(async () => {
        const { data: nd } = await supabase.from("despesas").select("*").eq("user_id", userId);
        if (nd) setDespesas(prev => mesclarPorId(prev, nd));
      }, 1000);
    }
  };
  const removerAssinatura = async (id) => {
    const { error } = await supabase.from("assinaturas").delete().eq("id", id);
    if (!error) setAssinaturas(prev => prev.filter(a => a.id !== id));
  };

  const adicionarParcelamento = async (n) => {
    if (!n.descricao || !n.valor_total || !n.parcelas_total) { alert("Preencha todos os campos"); return; }
    const { data, error } = await supabase.from("parcelamentos").insert({ descricao: n.descricao, valor_total: parseFloat(n.valor_total), parcelas_total: parseInt(n.parcelas_total), parcelas_pagas: 0, valor_pago: 0, user_id: userId, proxima_parcela_data: n.dataInicio, categoria_id: null, status: "ativo" }).select().single();
    if (error) { alert("Erro: " + error.message); return; }
    if (data) {
      setParcelamentos(prev => [...prev, data]);
      setTimeout(async () => {
        const { data: nd } = await supabase.from("despesas").select("*").eq("user_id", userId);
        if (nd) setDespesas(prev => mesclarPorId(prev, nd));
      }, 1500);
    }
  };
  const marcarParcelaComoPaga = async (id) => {
    const parc = parcelamentos.find(p => p.id === id);
    if (!parc || parc.parcelas_pagas >= parc.parcelas_total) { alert("Todas as parcelas já foram pagas!"); return; }
    const novasParcelas = parc.parcelas_pagas + 1;
    const novoValorPago = (parc.valor_pago || 0) + (parc.valor_total / parc.parcelas_total);
    const { data, error } = await supabase.from("parcelamentos").update({ parcelas_pagas: novasParcelas, valor_pago: novoValorPago, status: novasParcelas >= parc.parcelas_total ? "finalizado" : "ativo" }).eq("id", id).select().single();
    if (error) { alert("Erro: " + error.message); return; }
    if (data) {
      setParcelamentos(prev => prev.map(p => p.id === id ? data : p));
      setTimeout(async () => {
        const { data: nd } = await supabase.from("despesas").select("*").eq("user_id", userId);
        if (nd) setDespesas(prev => mesclarPorId(prev, nd));
      }, 500);
    }
  };
  const removerParcelamento = async (id) => {
    const { error } = await supabase.from("parcelamentos").delete().eq("id", id);
    if (!error) setParcelamentos(prev => prev.filter(p => p.id !== id));
  };
  const adicionarCategoria = async (n) => {
    const { data, error } = await supabase.from("categorias").insert({ ...n, user_id: userId, padrao: false }).select().single();
    if (!error && data) setCategorias(prev => [...prev, data]);
  };
  const removerCategoria = async (id) => {
    if (despesas.some(d => d.categoria_id === id)) { alert("Não é possível remover: existem despesas nesta categoria."); return; }
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (!error) setCategorias(prev => prev.filter(c => c.id !== id));
  };
  const handleLogout = async () => { await supabase.auth.signOut(); };

  // Busca novidades do Supabase e mostra 1 vez por versão
  useEffect(() => {
    const carregarNovidades = async () => {
      const { data } = await supabase
        .from("novidades")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (!data) return;
      const visto = localStorage.getItem("banner_versao_vista");
      if (visto !== data.versao) {
        const itens = typeof data.itens === "string" ? JSON.parse(data.itens) : data.itens;
        setNovidades({ versao: data.versao, itens });
        setMostrarBanner(true);
      }
    };
    carregarNovidades();
  }, []);

  useEffect(() => {
    if (!mostrarBanner) return;
    localStorage.setItem("banner_versao_vista", novidades.versao);
    const timerSaida = setTimeout(() => setBannerSaindo(true), 7000);
    const timerSome = setTimeout(() => setMostrarBanner(false), 8000);
    return () => { clearTimeout(timerSaida); clearTimeout(timerSome); };
  }, [mostrarBanner]);

  const despesasPendentes = useMemo(() => despesas.filter(d => d.status === "pendente" || !d.status), [despesas]);
  const despesasPagas = useMemo(() => despesas.filter(d => d.status === "paga"), [despesas]);
  const totalReceitasMes = useMemo(() => receitas.filter(r => (r.mes || mesAtual()) === mesAtual()).reduce((s, r) => s + parseFloat(r.valor || 0), 0), [receitas]);
  const totalAssinaturasMes = useMemo(() => assinaturas.reduce((s, a) => s + parseFloat(a.valor || 0), 0), [assinaturas]);
  const despesasPagasMesAtual = useMemo(() => despesasPagas.filter(d => d.data_pagamento && d.data_pagamento.startsWith(mesAtual())), [despesasPagas]);
  const totalDespesasPagasMes = useMemo(() => despesasPagasMesAtual.reduce((s, d) => s + parseFloat(d.valor || 0), 0), [despesasPagasMesAtual]);
  // Assinaturas só entram no "Pago" se houver despesa gerada por elas e marcada como paga no mês
  // O card "Pago" mostra só despesas efetivamente pagas no mês atual
  const totalDespesasMes = totalDespesasPagasMes;
  const temReceitaNoMes = totalReceitasMes > 0;
  const saldo = temReceitaNoMes ? totalReceitasMes - totalDespesasMes : null;
  const despesasPendentesMesAtual = useMemo(() => despesasPendentes.filter(d => { const dr = d.data_vencimento || d.data; return dr && dr.startsWith(mesAtual()); }), [despesasPendentes]);
  const totalPendentesMes = useMemo(() => despesasPendentesMesAtual.reduce((s, d) => s + parseFloat(d.valor || 0), 0), [despesasPendentesMesAtual]);
  const despesasPorCategoria = useMemo(() => { const ag = {}; despesasPagasMesAtual.forEach(d => { ag[d.categoria_id] = (ag[d.categoria_id] || 0) + parseFloat(d.valor || 0); }); return categorias.map((c, i) => ({ id: c.id, nome: c.nome, valor: ag[c.id] || 0, cor: CORES_PIZZA[i % CORES_PIZZA.length] })).filter(c => c.valor > 0.01); }, [despesasPagasMesAtual, categorias]);
  const proximasAssinaturas = useMemo(() => { const hoje = new Date(); const diaH = hoje.getDate(); return [...assinaturas].map(a => { const dia = parseInt(a.dia_vencimento || 5); let dr = dia >= diaH ? dia - diaH : (new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()) - diaH + dia; return { ...a, diasRestantes: dr }; }).sort((a, b) => a.diasRestantes - b.diasRestantes); }, [assinaturas]);
  const avisoDespesas = useMemo(() => { const hoje = new Date(); hoje.setHours(0,0,0,0); const limite = new Date(hoje); limite.setDate(limite.getDate() + 7); const vencidas = []; const vencendo = []; despesasPendentes.forEach(d => { if (!d.data_vencimento) return; const v = new Date(d.data_vencimento + "T00:00:00"); if (v < hoje) vencidas.push(d); else if (v <= limite) vencendo.push(d); }); return { vencidas, vencendo }; }, [despesasPendentes]);

  if (carregandoDados) return <div className="min-h-screen flex items-center justify-center bg-[#060d1a]"><Loader2 className="text-blue-400/60 animate-spin" size={28} /></div>;

  const abas = [
    { id: "home", label: "Início", icon: Home },
    { id: "despesas", label: "Despesas", icon: PieIcon },
    { id: "grafico", label: "Gráfico", icon: BarChart2 },
    { id: "historico", label: "Histórico", icon: History },
    { id: "parcelamentos", label: "Parcelamentos", icon: Zap },
    { id: "receitas", label: "Receitas", icon: Wallet },
    { id: "assinaturas", label: "Assinaturas", icon: Repeat },
    ...(isAdmin ? [{ id: "usuarios", label: "Usuários", icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#060d1a] text-slate-100 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-c { font-family: 'JetBrains Mono', monospace; }
        .font-body { font-family: 'Inter', sans-serif; }
        body { background: #060d1a; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.7s ease-out forwards; opacity: 0; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-20px); } }
        .banner-enter { animation: slideDown 0.5s ease-out forwards; }
        .banner-exit { animation: slideUp 0.5s ease-in forwards; }
        @keyframes progress8s { from { width: 100%; } to { width: 0%; } }
        .delay-1{animation-delay:.1s}.delay-2{animation-delay:.25s}.delay-3{animation-delay:.4s}.delay-4{animation-delay:.55s}.delay-5{animation-delay:.7s}
        .num-tabular { font-variant-numeric: tabular-nums; font-style: normal; }
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0d1829}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px}
      `}</style>
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] pointer-events-none" style={{background:"radial-gradient(circle,rgba(37,99,235,.10),transparent 70%)"}}/>
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] pointer-events-none" style={{background:"radial-gradient(circle,rgba(14,165,233,.07),transparent 70%)"}}/>

      {mostrarBanner && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm ${bannerSaindo ? "banner-exit" : "banner-enter"}`}>
          <div className="bg-[#0d1829] border-2 border-blue-500/50 rounded-2xl w-full max-w-lg mx-4 shadow-2xl shadow-blue-900/40 overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600/20 border-b border-blue-500/30 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"/>
                <span className="font-mono-c text-xs text-blue-300 uppercase tracking-widest">Últimas atualizações</span>
              </div>
              <button onClick={() => { setBannerSaindo(true); setTimeout(() => setMostrarBanner(false), 500); }} className="text-slate-400/60 hover:text-white transition-colors">
                <X size={16}/>
              </button>
            </div>
            {/* Lista de atualizações */}
            <div className="px-6 py-5 space-y-3">
              {novidades.itens.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-blue-900/30">
                  <span className="text-blue-400 mt-0.5 flex-shrink-0">✔︎</span>
                  <span className="font-body text-sm text-slate-200 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
            {/* Footer com barra de progresso */}
            <div className="px-6 pb-5">
              <div className="w-full bg-blue-900/30 rounded-full h-1 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{animation: "progress8s 8s linear forwards"}}/>
              </div>
              <p className="font-body text-[11px] text-slate-400/50 text-center mt-2">Fecha automaticamente em 8s</p>
            </div>
          </div>
        </div>
      )}

      {!avisoFechado && (avisoDespesas.vencidas.length > 0 || avisoDespesas.vencendo.length > 0) && (
        <div className="fixed top-4 right-4 z-30 animate-fadeInUp max-w-sm bg-[#0d1829]/95 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display italic text-slate-100 flex items-center gap-2"><Bell size={16} className="text-blue-400"/>Contas a pagar</h3>
            <button onClick={() => setAvisoFechado(true)} className="text-slate-400/60"><X size={14}/></button>
          </div>
          {avisoDespesas.vencidas.length > 0 && <p className="text-xs text-red-400 mb-1">🔴 {avisoDespesas.vencidas.length} vencida(s)</p>}
          {avisoDespesas.vencendo.length > 0 && <p className="text-xs text-sky-400">🟡 {avisoDespesas.vencendo.length} em até 7 dias</p>}
        </div>
      )}

      <header className="relative z-10 px-6 md:px-12 pt-8 pb-4 flex items-center justify-between border-b border-blue-900/30">
        <div className="animate-fadeInUp">
          <div className="font-mono-c text-[10px] tracking-[0.3em] text-slate-400/60 uppercase">Finanças · {nomeMes(mesAtual())}</div>
          <h1 className="font-display text-2xl md:text-3xl italic text-slate-100 mt-1">
            olá, {userNome}
            {isAdmin && <span className="ml-2 text-xs font-body not-italic bg-blue-600/25 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full align-middle">admin</span>}
          </h1>
        </div>
        <button onClick={handleLogout} className="text-slate-400/60 hover:text-slate-200 transition flex items-center gap-2 font-body text-sm"><LogOut size={16}/>Sair</button>
      </header>

      <nav className="relative z-10 px-6 md:px-12 py-4 flex gap-1 overflow-x-auto border-b border-blue-900/30">
        {abas.map(t => { const Icon = t.icon; const ativo = aba === t.id; return (
          <button key={t.id} onClick={() => setAba(t.id)} className={`px-4 py-2 rounded-full font-body text-sm flex items-center gap-2 transition-all whitespace-nowrap ${ativo ? "bg-blue-600 text-white" : "text-slate-400/70 hover:text-slate-200 hover:bg-white/5"}`}>
            <Icon size={14}/>{t.label}
          </button>
        );})}
      </nav>

      <main className="relative z-10 px-6 md:px-12 py-8 max-w-6xl mx-auto">
        {aba === "home" && <HomeAba quote={quote} saldo={saldo} temReceitaNoMes={temReceitaNoMes} totalReceitasMes={totalReceitasMes} totalDespesasMes={totalDespesasMes} totalPendentesMes={totalPendentesMes} despesasPorCategoria={despesasPorCategoria} proximasAssinaturas={proximasAssinaturas} receitas={receitas} despesas={despesas} assinaturas={assinaturas} parcelamentos={parcelamentos} userNome={userNome}/>}
        {aba === "despesas" && <DespesasAba despesasPendentes={despesasPendentes} despesasPagas={despesasPagas} categorias={categorias} totalDespesasPagasMes={totalDespesasPagasMes} totalPendentesMes={totalPendentesMes} onAdicionar={() => setModalDespesa(true)} onRemover={removerDespesa} onMarcarPaga={marcarComoPaga}/>}
        {aba === "grafico" && <GraficoAba despesas={despesas} receitas={receitas} assinaturas={assinaturas}/>}
        {aba === "historico" && <HistoricoAba despesas={despesas} assinaturas={assinaturas} receitas={receitas} parcelamentos={parcelamentos} userNome={userNome}/>}
        {aba === "parcelamentos" && <ParcelamentosAba parcelamentos={parcelamentos} categorias={categorias} onAdicionar={() => setModalParcelamento(true)} onRemover={removerParcelamento} onMarcarPaga={marcarParcelaComoPaga}/>}
        {aba === "receitas" && <ReceitasAba receitas={receitas} totalReceitasMes={totalReceitasMes} onAdicionar={() => setModalReceita(true)} onRemover={removerReceita}/>}
        {aba === "assinaturas" && <AssinaturasAba assinaturas={proximasAssinaturas} total={totalAssinaturasMes} onAdicionar={() => setModalAssinatura(true)} onRemover={removerAssinatura}/>}
        {aba === "usuarios" && isAdmin && <UsuariosAba/>}
      </main>

      {modalReceita && <ModalReceita onFechar={() => setModalReceita(false)} onSalvar={async r => { await adicionarReceita(r); setModalReceita(false); }}/>}
      {modalDespesa && <ModalDespesa categorias={categorias} onFechar={() => setModalDespesa(false)} onSalvar={async d => { await adicionarDespesa(d); setModalDespesa(false); }}/>}
      {modalAssinatura && <ModalAssinatura onFechar={() => setModalAssinatura(false)} onSalvar={async a => { await adicionarAssinatura(a); setModalAssinatura(false); }}/>}
      {modalParcelamento && <ModalParcelamento categorias={categorias} onFechar={() => setModalParcelamento(false)} onSalvar={async p => { await adicionarParcelamento(p); setModalParcelamento(false); }}/>}
      {modalCategoria && <ModalCategoria onFechar={() => setModalCategoria(false)} onSalvar={async c => { await adicionarCategoria(c); setModalCategoria(false); }}/>}
    </div>
  );
}

// ── GRÁFICO DE ÁREA ──────────────────────────────────────────────────────────────
function GraficoAba({ despesas, receitas, assinaturas }) {
  const dadosPorMes = useMemo(() => {
    const meses = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); meses.push(d.toISOString().substring(0, 7)); }
    return meses.map(m => {
      const pagas = despesas.filter(d => d.status === "paga" && d.data_pagamento?.startsWith(m)).reduce((s, d) => s + parseFloat(d.valor || 0), 0);
      const pendentes = despesas.filter(d => (d.status === "pendente" || !d.status) && (d.data_vencimento || d.data)?.startsWith(m)).reduce((s, d) => s + parseFloat(d.valor || 0), 0);
      const rec = receitas.filter(r => (r.mes || mesAtual()) === m).reduce((s, r) => s + parseFloat(r.valor || 0), 0);
      const assin = m === mesAtual() ? assinaturas.reduce((s, a) => s + parseFloat(a.valor || 0), 0) : 0;
      return { mes: nomeMesAbrev(m), Receitas: +rec.toFixed(2), Pagas: +pagas.toFixed(2), Pendentes: +pendentes.toFixed(2), Assinaturas: +assin.toFixed(2) };
    });
  }, [despesas, receitas, assinaturas]);

  const ttStyle = { contentStyle:{background:"#0d1829",border:"1px solid #1e3a5f",borderRadius:12,fontFamily:"Inter"}, labelStyle:{color:"#94a3b8",fontSize:12}, itemStyle:{color:"#e2e8f0",fontSize:12} };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-center gap-3"><BotaoAjuda topico="grafico"/><div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Visão financeira</p><h2 className="font-display text-3xl italic text-slate-100 mt-1">Gráfico — últimos 6 meses</h2></div></div>

      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-6">
        <h3 className="font-display text-lg italic text-slate-200 mb-6">Receitas vs Despesas Pagas</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dadosPorMes} margin={{top:10,right:10,left:0,bottom:0}}>
            <defs>
              <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
              <linearGradient id="gPag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/><stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f"/>
            <XAxis dataKey="mes" tick={{fill:"#64748b",fontSize:11,fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:"#64748b",fontSize:11,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v}`}/>
            <Tooltip {...ttStyle} formatter={v=>formatBRL(v)}/>
            <Legend wrapperStyle={{fontFamily:"Inter",fontSize:12,color:"#94a3b8",paddingTop:16}}/>
            <Area type="monotone" dataKey="Receitas" stroke="#34d399" strokeWidth={2} fill="url(#gRec)" dot={{fill:"#34d399",strokeWidth:0,r:4}} activeDot={{r:6}}/>
            <Area type="monotone" dataKey="Pagas" stroke="#60a5fa" strokeWidth={2} fill="url(#gPag)" dot={{fill:"#60a5fa",strokeWidth:0,r:4}} activeDot={{r:6}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-6">
        <h3 className="font-display text-lg italic text-slate-200 mb-6">Pendentes vs Assinaturas</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dadosPorMes} margin={{top:10,right:10,left:0,bottom:0}}>
            <defs>
              <linearGradient id="gPend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
              <linearGradient id="gAss" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/><stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f"/>
            <XAxis dataKey="mes" tick={{fill:"#64748b",fontSize:11,fontFamily:"Inter"}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:"#64748b",fontSize:11,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v}`}/>
            <Tooltip {...ttStyle} formatter={v=>formatBRL(v)}/>
            <Legend wrapperStyle={{fontFamily:"Inter",fontSize:12,color:"#94a3b8",paddingTop:16}}/>
            <Area type="monotone" dataKey="Pendentes" stroke="#f87171" strokeWidth={2} fill="url(#gPend)" dot={{fill:"#f87171",strokeWidth:0,r:4}} activeDot={{r:6}}/>
            <Area type="monotone" dataKey="Assinaturas" stroke="#a78bfa" strokeWidth={2} fill="url(#gAss)" dot={{fill:"#a78bfa",strokeWidth:0,r:4}} activeDot={{r:6}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:"Receitas (mês)", valor:dadosPorMes[5]?.Receitas, cor:"text-emerald-400"},
          {label:"Pagas (mês)", valor:dadosPorMes[5]?.Pagas, cor:"text-blue-400"},
          {label:"Pendentes (mês)", valor:dadosPorMes[5]?.Pendentes, cor:"text-red-400"},
          {label:"Assinaturas", valor:dadosPorMes[5]?.Assinaturas, cor:"text-violet-400"},
        ].map(c => (
          <div key={c.label} className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-4">
            <p className="font-mono-c text-[10px] text-slate-400/50 uppercase mb-2">{c.label}</p>
            <p className={`font-mono-c num-tabular text-xl font-bold ${c.cor}`}>{formatBRL(c.valor)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── USUÁRIOS (ADMIN) ─────────────────────────────────────────────────────────────
function UsuariosAba() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [expandido, setExpandido] = useState(null);

  const carregar = async () => {
    setCarregando(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!error) setUsuarios(data || []);
    setCarregando(false);
  };
  useEffect(() => { carregar(); }, []);

  const toggleAdmin = async (id, atual) => {
    const { error } = await supabase.from("profiles").update({ is_admin: !atual }).eq("id", id);
    if (!error) setUsuarios(prev => prev.map(u => u.id === id ? { ...u, is_admin: !atual } : u));
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Painel admin</p><h2 className="font-display text-3xl italic text-slate-100 mt-1">Usuários</h2></div>
        <button onClick={carregar} className="px-4 py-2.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 font-body text-sm flex items-center gap-2 hover:bg-blue-600/30 transition-all"><RefreshCw size={14}/>Atualizar</button>
      </div>

      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {carregando ? <div className="p-12 flex justify-center"><Loader2 className="text-blue-400/60 animate-spin" size={24}/></div>
        : usuarios.length === 0 ? <div className="p-12 text-center"><p className="font-body text-slate-400/40">Nenhum usuário.</p></div>
        : (
          <div className="divide-y divide-blue-900/20">
            {usuarios.map(u => (
              <div key={u.id}>
                <div className="flex items-center gap-4 p-4 hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpandido(expandido === u.id ? null : u.id)}>
                  <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-body text-sm text-blue-300 font-medium">{(u.nome || u.email || "?")[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-slate-200 truncate">{u.nome || "—"}</span>
                      {u.is_admin && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-600/25 text-blue-300 border border-blue-500/30 font-body flex-shrink-0">admin</span>}
                    </div>
                    <div className="font-mono-c text-[10px] text-slate-400/50 truncate">{u.email}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono-c text-[10px] text-slate-400/40 uppercase mb-0.5">Cadastro</div>
                    <div className="font-mono-c text-xs text-slate-400/60">{formatarDataBR(u.created_at?.substring(0,10))}</div>
                  </div>
                </div>
                {expandido === u.id && (
                  <div className="px-6 pb-5 bg-white/[0.01] border-t border-blue-900/20 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div className="bg-[#060d1a] rounded-xl p-4 border border-blue-900/20">
                        <p className="font-mono-c text-[10px] text-slate-400/50 uppercase mb-1">Último login</p>
                        <p className="font-mono-c text-sm text-sky-300">{formatarDataHora(u.ultimo_login)}</p>
                      </div>
                      <div className="bg-[#060d1a] rounded-xl p-4 border border-blue-900/20">
                        <p className="font-mono-c text-[10px] text-slate-400/50 uppercase mb-1">ID</p>
                        <p className="font-mono-c text-[11px] text-slate-400/60 truncate">{u.id}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleAdmin(u.id, u.is_admin)} className={`w-full py-2.5 rounded-xl font-body text-sm flex items-center justify-center gap-2 transition-all border ${u.is_admin ? "bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20" : "bg-blue-600/15 text-blue-300 border-blue-500/25 hover:bg-blue-600/25"}`}>
                      <Shield size={14}/>{u.is_admin ? "Remover admin" : "Tornar admin"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-4">
        <p className="font-body text-xs text-slate-400/70 leading-relaxed">
          💡 <span className="text-blue-400">Dica:</span> Para garantir acesso em caso de perda de conta, marque outra conta como admin aqui ou no Supabase → Table Editor → profiles → <span className="font-mono-c text-blue-300">is_admin = true</span>.
        </p>
      </div>

      <PainelNovidades />
    </div>
  );
}

// ── PAINEL NOVIDADES (ADMIN) ──────────────────────────────────────────────────────
function PainelNovidades() {
  const [novidades, setNovidades] = useState([]);
  const [versao, setVersao] = useState("");
  const [novoItem, setNovoItem] = useState("");
  const [novaVersao, setNovaVersao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  const carregar = async () => {
    const { data } = await supabase.from("novidades").select("*").order("created_at", { ascending: false }).limit(1).single();
    if (data) {
      const itens = typeof data.itens === "string" ? JSON.parse(data.itens) : data.itens;
      setNovidades(itens);
      setVersao(data.versao);
      setNovaVersao(data.versao);
    }
  };

  useEffect(() => { carregar(); }, []);

  const adicionarItem = () => {
    if (!novoItem.trim()) return;
    setNovidades([...novidades, novoItem.trim()]);
    setNovoItem("");
  };

  const removerItem = (i) => setNovidades(novidades.filter((_, idx) => idx !== i));
    setNovidades(prev => [...prev, novoItem.trim()]);
    setNovoItem("");
  };

  const removerItem = (i) => setNovidades(prev => prev.filter((_, idx) => idx !== i));

  const salvar = async () => {
    if (!novaVersao.trim() || novidades.length === 0) return;
    setSalvando(true); setMsg("");
    // Desativa todas as versões anteriores
    await supabase.from("novidades").update({ ativo: false }).neq("versao", novaVersao);
    // Upsert da nova versão
    const { error } = await supabase.from("novidades").upsert({
      versao: novaVersao.trim(),
      itens: JSON.stringify(novidades),
      ativo: true,
    }, { onConflict: "versao" });
    setSalvando(false);
    if (error) setMsg("Erro: " + error.message);
    else { setMsg("✔︎ Salvo! Todos os usuários verão na próxima abertura."); setVersao(novaVersao); }
  };

  return (
    <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl italic text-slate-100">📢 Gerenciar Novidades</h3>
        <span className="font-mono-c text-[10px] text-blue-400/70 border border-blue-500/30 px-2 py-1 rounded-full">versão atual: {versao}</span>
      </div>

      {/* Lista atual */}
      <div className="space-y-2">
        {novidades.map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-blue-900/20 group">
            <span className="text-blue-400 text-xs flex-shrink-0">✔︎</span>
            <span className="font-body text-sm text-slate-200 flex-1">{item}</span>
            <button onClick={() => removerItem(i)} className="opacity-0 group-hover:opacity-100 text-slate-400/40 hover:text-red-400 transition-all"><Trash2 size={13}/></button>
          </div>
        ))}
        {novidades.length === 0 && <p className="font-body text-sm text-slate-400/40 text-center py-4">Nenhum item ainda.</p>}
      </div>

      {/* Adicionar item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={novoItem}
          onChange={e => setNovoItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && adicionarItem()}
          placeholder="Nova novidade... (Enter para adicionar)"
          className="flex-1 bg-white/[0.03] border border-blue-900/40 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-400/40 focus:outline-none focus:border-blue-500/50 text-sm"
        />
        <button onClick={adicionarItem} className="px-4 py-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-xl hover:bg-blue-600/30 transition-all">
          <Plus size={16}/>
        </button>
      </div>

      {/* Versão */}
      <div className="flex gap-2 items-center">
        <span className="font-body text-xs text-slate-400/60 flex-shrink-0">Versão:</span>
        <input
          type="text"
          value={novaVersao}
          onChange={e => setNovaVersao(e.target.value)}
          placeholder="ex: v4"
          className="w-24 bg-white/[0.03] border border-blue-900/40 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-400/40 focus:outline-none focus:border-blue-500/50 text-sm font-mono-c"
        />
        <span className="font-body text-[11px] text-slate-400/40">← mude para forçar exibição para todos</span>
      </div>

      {msg && <p className={`font-body text-xs ${msg.startsWith("✔︎") ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>}

      <button onClick={salvar} disabled={salvando} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-body font-medium transition-all flex items-center justify-center gap-2">
        {salvando ? <><Loader2 size={14} className="animate-spin"/>Salvando...</> : "Publicar novidades"}
      </button>
    </div>
  );
}

// ── HISTÓRICO ────────────────────────────────────────────────────────────────────
function HistoricoAba({ despesas, assinaturas, receitas, parcelamentos, userNome }) {
  const mesesComDespesas = useMemo(() => {
    const s = new Set();
    despesas.forEach(d => { if (d.status === "paga" && d.data_pagamento) s.add(d.data_pagamento.substring(0,7)); if (d.status !== "paga" && d.data_vencimento) s.add(d.data_vencimento.substring(0,7)); });
    return [...s].sort((a,b) => b.localeCompare(a));
  }, [despesas]);
  const [mesSelecionado, setMesSelecionado] = useState(mesesComDespesas[0] || mesAtual());
  const despesasDomes = useMemo(() => despesas.filter(d => { if (d.status === "paga") return d.data_pagamento?.startsWith(mesSelecionado); return (d.data_vencimento || d.data)?.startsWith(mesSelecionado); }).sort((a,b) => (a.data_vencimento||a.data||"").localeCompare(b.data_vencimento||b.data||"")), [despesas, mesSelecionado]);
  const totalPago = useMemo(() => despesasDomes.filter(d => d.status === "paga").reduce((s,d) => s + parseFloat(d.valor||0), 0), [despesasDomes]);
  const totalPendente = useMemo(() => despesasDomes.filter(d => d.status !== "paga").reduce((s,d) => s + parseFloat(d.valor||0), 0), [despesasDomes]);

  const gerarPDFMes = async () => {
    try {
      const { jsPDF } = await import("jspdf"); const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF(); const pw = doc.internal.pageSize.getWidth(); let y = 20;
      doc.setFontSize(22); doc.text(`Relatório — ${nomeMes(mesSelecionado)}`, pw/2, y, {align:"center"}); y+=12;
      doc.setFontSize(9); doc.setTextColor(120,120,140); doc.text(`Usuário: ${userNome}   |   ${new Date().toLocaleDateString("pt-BR")}`, pw/2, y, {align:"center"}); doc.setTextColor(0,0,0); y+=15;
      autoTable(doc, {startY:y, head:[["Item","Valor"]], body:[["Total Pago",formatBRL(totalPago)],["Total Pendente",formatBRL(totalPendente)],["Total Geral",formatBRL(totalPago+totalPendente)]], theme:"grid", headStyles:{fillColor:[30,64,175]}});
      y = doc.lastAutoTable.finalY + 15;
      const pagas = despesasDomes.filter(d => d.status === "paga");
      if (pagas.length > 0) { doc.setFontSize(13); doc.text("Despesas Pagas", 20, y); y+=8; autoTable(doc, {startY:y, head:[["Descrição","Data Pgto","Valor"]], body:pagas.map(d=>[d.descricao,formatarDataBR(d.data_pagamento),formatBRL(d.valor)]), theme:"grid", headStyles:{fillColor:[5,150,105]}}); y = doc.lastAutoTable.finalY+15; }
      const pend = despesasDomes.filter(d => d.status !== "paga");
      if (pend.length > 0) { doc.setFontSize(13); doc.text("Despesas Pendentes", 20, y); y+=8; autoTable(doc, {startY:y, head:[["Descrição","Vencimento","Valor"]], body:pend.map(d=>[d.descricao,formatarDataBR(d.data_vencimento||d.data),formatBRL(d.valor)]), theme:"grid", headStyles:{fillColor:[180,83,9]}}); }
      doc.save(`relatorio-${mesSelecionado}.pdf`);
    } catch (e) { alert("Erro ao gerar PDF: " + e.message); }
  };

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3"><BotaoAjuda topico="historico"/><div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Histórico de Meses</p><h2 className="font-display text-3xl italic text-slate-100 mt-1">{nomeMes(mesSelecionado)}</h2></div></div>
        <button onClick={gerarPDFMes} className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-body text-sm flex items-center gap-2 transition-all"><FileDown size={14}/>Gerar PDF</button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {mesesComDespesas.length === 0 ? <p className="font-body text-slate-400/50 text-sm">Nenhum mês ainda.</p> : mesesComDespesas.map(m => (
          <button key={m} onClick={() => setMesSelecionado(m)} className={`px-4 py-2 rounded-full font-body text-sm transition-all ${mesSelecionado===m?"bg-blue-600 text-white":"bg-white/5 text-slate-300 hover:bg-white/10 border border-blue-900/30"}`}>{nomeMes(m)}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-5"><p className="font-mono-c text-[10px] text-slate-400/60 uppercase mb-2">Pago</p><p className="font-mono-c num-tabular text-2xl font-bold text-emerald-400">{formatBRL(totalPago)}</p></div>
        <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-5"><p className="font-mono-c text-[10px] text-slate-400/60 uppercase mb-2">Pendente</p><p className="font-mono-c num-tabular text-2xl font-bold text-sky-400">{formatBRL(totalPendente)}</p></div>
        <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl p-5"><p className="font-mono-c text-[10px] text-slate-400/60 uppercase mb-2">Total Geral</p><p className="font-mono-c num-tabular text-2xl font-bold text-slate-100">{formatBRL(totalPago+totalPendente)}</p></div>
      </div>
      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {despesasDomes.length === 0 ? <div className="p-12 text-center"><p className="font-body text-slate-400/50">Nenhuma despesa neste mês.</p></div> : (
          <div className="divide-y divide-blue-900/20">
            {despesasDomes.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-4 hover:bg-white/[0.02]">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.status==="paga"?"bg-emerald-400":"bg-sky-400"}`}/>
                <div className="flex-1"><div className="font-body text-slate-200">{d.descricao}</div><div className="font-mono-c text-[10px] text-slate-400/50">{d.status==="paga"?`Pago em ${formatarDataBR(d.data_pagamento)}`:`Vence em ${formatarDataBR(d.data_vencimento||d.data)}`}</div></div>
                <div className={`font-mono-c num-tabular text-sm ${d.status==="paga"?"text-emerald-400":"text-slate-300"}`}>{formatBRL(d.valor)}</div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-body ${d.status==="paga"?"bg-emerald-500/15 text-emerald-400":"bg-sky-500/15 text-sky-400"}`}>{d.status==="paga"?"Pago":"Pendente"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── HOME ─────────────────────────────────────────────────────────────────────────
function HomeAba({ quote, saldo, temReceitaNoMes, totalReceitasMes, totalDespesasMes, totalPendentesMes, despesasPorCategoria, proximasAssinaturas, receitas, despesas, assinaturas, parcelamentos, userNome }) {
  const despesasPagasCount = despesas.filter(d => d.status === "paga").length;
  const parcelamentosAtivos = parcelamentos.filter(p => p.status === "ativo").length;
  const receitasMes = receitas.filter(r => (r.mes || mesAtual()) === mesAtual()).length;

  const gerarRelatorio = async () => {
    try {
      const { jsPDF } = await import("jspdf"); const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF(); const pw = doc.internal.pageSize.getWidth(); let y = 20;
      doc.setFontSize(22); doc.text("Relatório de Despesas", pw/2, y, {align:"center"}); y+=12;
      doc.setFontSize(9); doc.setTextColor(120,120,140); doc.text(`Usuário: ${userNome}   |   Mês: ${nomeMes(mesAtual())}   |   ${new Date().toLocaleDateString("pt-BR")}`, pw/2, y, {align:"center"}); doc.setTextColor(0,0,0); y+=15;
      autoTable(doc, {startY:y, head:[["Item","Valor"]], body:[["Receitas",formatBRL(totalReceitasMes)],["Despesas Pagas",formatBRL(totalDespesasMes)],["A Pagar",formatBRL(totalPendentesMes)],["Saldo",temReceitaNoMes?formatBRL(saldo):"Sem receita cadastrada"]], theme:"grid", headStyles:{fillColor:[30,64,175]}}); y=doc.lastAutoTable.finalY+15;
      const rm = receitas.filter(r=>(r.mes||mesAtual())===mesAtual()); if(rm.length>0){doc.setFontSize(13);doc.text("Receitas",20,y);y+=8;autoTable(doc,{startY:y,head:[["Fonte","Valor"]],body:rm.map(r=>[r.fonte,formatBRL(r.valor)]),theme:"grid",headStyles:{fillColor:[5,150,105]}});y=doc.lastAutoTable.finalY+15;}
      const dp = despesas.filter(d=>d.status==="paga"&&d.data_pagamento?.startsWith(mesAtual())); if(dp.length>0){doc.setFontSize(13);doc.text("Despesas Pagas",20,y);y+=8;autoTable(doc,{startY:y,head:[["Descrição","Data","Valor"]],body:dp.map(d=>[d.descricao,formatarDataBR(d.data_pagamento),formatBRL(d.valor)]),theme:"grid",headStyles:{fillColor:[30,64,175]}});y=doc.lastAutoTable.finalY+15;}
      const dpe = despesas.filter(d=>(d.status==="pendente"||!d.status)&&(d.data_vencimento||d.data)?.startsWith(mesAtual())); if(dpe.length>0){doc.setFontSize(13);doc.text("Despesas Pendentes",20,y);y+=8;autoTable(doc,{startY:y,head:[["Descrição","Vencimento","Valor"]],body:dpe.map(d=>[d.descricao,formatarDataBR(d.data_vencimento||d.data),formatBRL(d.valor)]),theme:"grid",headStyles:{fillColor:[180,83,9]}});}
      doc.save(`relatorio-${mesAtual()}.pdf`);
    } catch(e){alert("Erro: "+e.message);}
  };

  return (
    <div className="space-y-10">
      <section className="animate-fadeInUp delay-1 py-12 text-center relative">
        <div className="absolute top-0 right-0"><BotaoAjuda topico="home"/></div>
        <p className="font-display text-3xl italic leading-tight text-slate-100">"{quote.text}"</p>
        {quote.author && <p className="font-body text-sm text-slate-400/70 mt-3">— {quote.author}</p>}
      </section>
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardResumo label="Receitas" valor={totalReceitasMes} icon={TrendingUp} cor="text-emerald-400" delay={2}/>
        <CardResumo label="Pago" valor={totalDespesasMes} icon={CheckCircle2} cor="text-red-400" delay={3}/>
        <CardResumo label="A pagar" valor={totalPendentesMes} icon={Clock} cor="text-sky-400" delay={3}/>
        <CardSaldo saldo={saldo} temReceita={temReceitaNoMes} delay={4}/>
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-fadeInUp delay-5 bg-[#0d1829] border border-blue-900/30 rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-xl italic text-slate-100">Visão Geral</h3>
          <div className="p-4 bg-white/[0.02] rounded-xl border border-blue-900/20"><div className="font-body text-sm text-slate-400/70 mb-2">💳 Despesas</div><div className="font-mono-c num-tabular text-lg text-red-400">{despesasPagasCount} de {despesas.length} pagas</div><div className="text-xs text-slate-400/50 mt-1">Total: {formatBRL(despesas.reduce((s,d)=>s+parseFloat(d.valor||0),0))}</div></div>
          <div className="p-4 bg-white/[0.02] rounded-xl border border-blue-900/20"><div className="font-body text-sm text-slate-400/70 mb-2">📅 Parcelamentos</div><div className="font-mono-c num-tabular text-lg text-sky-400">{parcelamentosAtivos} ativo{parcelamentosAtivos!==1?"s":""}</div></div>
          <div className="p-4 bg-white/[0.02] rounded-xl border border-blue-900/20"><div className="font-body text-sm text-slate-400/70 mb-2">💰 Receitas</div><div className="font-mono-c num-tabular text-lg text-emerald-400">{receitasMes} este mês</div><div className="text-xs text-slate-400/50 mt-1">Total: {formatBRL(totalReceitasMes)}</div></div>
          {!temReceitaNoMes && <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl"><p className="font-body text-xs text-sky-400">💡 Cadastre suas receitas do mês para ver o saldo.</p></div>}
          <button onClick={gerarRelatorio} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-body font-medium transition-all flex items-center justify-center gap-2"><FileDown size={16}/>Gerar Relatório do Mês</button>
        </div>
        <div className="animate-fadeInUp delay-5 bg-[#0d1829] border border-blue-900/30 rounded-2xl p-6">
          <h3 className="font-display text-xl italic text-slate-100 mb-6">Próximas assinaturas</h3>
          {proximasAssinaturas.length===0?<div className="h-[200px] flex items-center justify-center"><p className="font-body text-slate-400/40">Nenhuma</p></div>:(
            <div className="space-y-2">{proximasAssinaturas.slice(0,6).map(a=>(
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-blue-900/20">
                <div className="font-body text-sm text-slate-200">{a.nome}</div>
                <div className="font-mono-c num-tabular text-sm text-sky-300">{formatBRL(a.valor)}</div>
              </div>
            ))}</div>
          )}
        </div>
      </section>
    </div>
  );
}

function CardResumo({ label, valor, icon: Icon, cor, delay }) {
  return (
    <div className={`animate-fadeInUp delay-${delay} rounded-2xl p-6 border bg-[#0d1829] border-blue-900/30`}>
      <div className="flex items-center justify-between mb-3"><span className="font-mono-c text-[10px] text-slate-400/50 uppercase">{label}</span><Icon size={16} className={cor}/></div>
      <div className={`font-mono-c num-tabular text-2xl font-bold not-italic ${cor}`}>{formatBRL(valor)}</div>
    </div>
  );
}
function CardSaldo({ saldo, temReceita, delay }) {
  return (
    <div className={`animate-fadeInUp delay-${delay} rounded-2xl p-6 border bg-[#0d1829] border-blue-500/30`}>
      <div className="flex items-center justify-between mb-3"><span className="font-mono-c text-[10px] text-slate-400/50 uppercase">Saldo</span><Wallet size={16} className="text-blue-400"/></div>
      {temReceita?<div className={`font-mono-c num-tabular text-2xl font-bold not-italic ${saldo>=0?"text-emerald-400":"text-red-400"}`}>{formatBRL(saldo)}</div>:<div className="font-mono-c text-xl font-bold text-slate-400/40">—</div>}
      {!temReceita&&<p className="font-body text-[10px] text-slate-400/40 mt-1">Cadastre receitas</p>}
    </div>
  );
}

// ── DESPESAS ──────────────────────────────────────────────────────────────────────
function DespesasAba({ despesasPendentes, despesasPagas, categorias, totalDespesasPagasMes, totalPendentesMes, onAdicionar, onRemover, onMarcarPaga }) {
  const [subAba, setSubAba] = useState("pendentes");
  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3"><BotaoAjuda topico="despesas"/><div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">{subAba==="pendentes"?"A pagar":"Pago"}</p><h2 className="font-mono-c num-tabular text-4xl font-bold text-slate-100">{formatBRL(subAba==="pendentes"?totalPendentesMes:totalDespesasPagasMes)}</h2></div></div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-body text-sm flex items-center gap-2 transition-all"><Plus size={14}/>Nova</button>
      </div>
      <div className="flex gap-1 bg-white/[0.03] p-1 rounded-full w-fit border border-blue-900/30">
        <button onClick={()=>setSubAba("pendentes")} className={`px-4 py-1.5 rounded-full font-body text-xs transition-all ${subAba==="pendentes"?"bg-blue-600 text-white":"text-slate-400/70"}`}>Pendentes ({despesasPendentes.length})</button>
        <button onClick={()=>setSubAba("pagas")} className={`px-4 py-1.5 rounded-full font-body text-xs transition-all ${subAba==="pagas"?"bg-blue-600 text-white":"text-slate-400/70"}`}>Histórico ({despesasPagas.length})</button>
      </div>
      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {(subAba==="pendentes"?despesasPendentes:despesasPagas).length===0?<div className="p-12 text-center"><p className="font-body text-slate-400/40">{subAba==="pendentes"?"Sem despesas pendentes ✨":"Sem histórico"}</p></div>:(
          <div className="divide-y divide-blue-900/20">
            {(subAba==="pendentes"?despesasPendentes:despesasPagas).sort((a,b)=>(a.data_vencimento||a.data||"").localeCompare(b.data_vencimento||b.data||"")).map(d=>(
              <div key={d.id} className="flex items-center gap-3 p-4 hover:bg-white/[0.02] group">
                <div className="flex-1"><div className="font-body text-slate-200">{d.descricao}</div><div className="font-mono-c text-[10px] text-slate-400/50">{formatarDataBR(d.data_vencimento||d.data)}</div></div>
                <div className="font-mono-c num-tabular text-slate-300">{formatBRL(d.valor)}</div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {subAba==="pendentes"&&<button onClick={()=>onMarcarPaga(d.id)} className="p-1 text-emerald-400/70 hover:text-emerald-400"><Check size={14}/></button>}
                  <button onClick={()=>onRemover(d.id)} className="p-1 text-slate-400/30 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PARCELAMENTOS ─────────────────────────────────────────────────────────────────
function ParcelamentosAba({ parcelamentos, categorias, onAdicionar, onRemover, onMarcarPaga }) {
  const ativos = parcelamentos.filter(p=>p.status==="ativo");
  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3"><BotaoAjuda topico="parcelamentos"/><div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Parcelamentos ativos</p><h2 className="font-mono-c num-tabular text-4xl font-bold text-slate-100">{ativos.length}</h2></div></div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-body text-sm flex items-center gap-2 transition-all"><Plus size={14}/>Novo</button>
      </div>
      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {parcelamentos.length===0?<div className="p-12 text-center"><p className="font-body text-slate-400/40">Nenhum parcelamento</p></div>:(
          <div className="divide-y divide-blue-900/20">
            {parcelamentos.map(p=>{const pct=(p.parcelas_pagas/p.parcelas_total)*100;const vp=p.valor_total/p.parcelas_total;return(
              <div key={p.id} className="p-6 hover:bg-white/[0.02] transition">
                <div className="flex items-start justify-between mb-4"><div><h3 className="font-body text-lg text-slate-100">{p.descricao}</h3><p className="font-mono-c text-[10px] text-slate-400/50 mt-1">Próx: {formatarDataBR(p.proxima_parcela_data)}</p></div><button onClick={()=>onRemover(p.id)} className="text-slate-400/30 hover:text-red-400"><Trash2 size={14}/></button></div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">VALOR TOTAL</p><p className="font-mono-c num-tabular text-sky-300">{formatBRL(p.valor_total)}</p></div>
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">JÁ PAGO</p><p className="font-mono-c num-tabular text-emerald-400">{formatBRL(p.valor_pago||0)}</p></div>
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">POR PARCELA</p><p className="font-mono-c num-tabular text-slate-300">{formatBRL(vp)}</p></div>
                  <div><p className="font-mono-c text-[10px] text-slate-400/50 mb-1">PROGRESSO</p><p className="font-mono-c num-tabular text-slate-300">{p.parcelas_pagas}/{p.parcelas_total}</p></div>
                </div>
                <div className="w-full bg-blue-900/30 rounded-full h-2 mb-3 overflow-hidden"><div className="bg-blue-500 h-full transition-all" style={{width:`${pct}%`}}/></div>
                {p.parcelas_pagas<p.parcelas_total&&<button onClick={()=>onMarcarPaga(p.id)} className="w-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 py-2 rounded-xl font-body text-sm hover:bg-emerald-500/25 transition flex items-center justify-center gap-2"><Check size={14}/>Marcar próxima como paga</button>}
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RECEITAS ──────────────────────────────────────────────────────────────────────
function ReceitasAba({ receitas, totalReceitasMes, onAdicionar, onRemover }) {
  const recDoMes = receitas.filter(r=>(r.mes||mesAtual())===mesAtual());
  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3"><BotaoAjuda topico="receitas"/><div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Receitas</p><h2 className="font-mono-c num-tabular text-4xl font-bold text-emerald-400">{formatBRL(totalReceitasMes)}</h2></div></div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-body text-sm flex items-center gap-2 transition-all"><Plus size={14}/>Nova</button>
      </div>
      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {recDoMes.length===0?<div className="p-12 text-center"><p className="font-body text-slate-400/40">Nenhuma receita cadastrada</p></div>:(
          <div className="divide-y divide-blue-900/20">{recDoMes.map(r=>(
            <div key={r.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] group">
              <div className="flex-1"><div className="font-body text-slate-200">{r.fonte}</div></div>
              <div className="font-mono-c num-tabular text-emerald-400">{formatBRL(r.valor)}</div>
              <button onClick={()=>onRemover(r.id)} className="opacity-0 group-hover:opacity-100 text-slate-400/30 hover:text-red-400 transition-opacity"><Trash2 size={14}/></button>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

// ── ASSINATURAS ───────────────────────────────────────────────────────────────────
function AssinaturasAba({ assinaturas, total, onAdicionar, onRemover }) {
  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3"><BotaoAjuda topico="assinaturas"/><div><p className="font-mono-c text-[10px] text-slate-400/60 uppercase">Total mensal</p><h2 className="font-mono-c num-tabular text-4xl font-bold text-slate-100">{formatBRL(total)}</h2></div></div>
        <button onClick={onAdicionar} className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-body text-sm flex items-center gap-2 transition-all"><Plus size={14}/>Nova</button>
      </div>
      <div className="bg-[#0d1829] border border-blue-900/30 rounded-2xl">
        {assinaturas.length===0?<div className="p-12 text-center"><p className="font-body text-slate-400/40">Nenhuma assinatura</p></div>:(
          <div className="divide-y divide-blue-900/20">{assinaturas.map(a=>(
            <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] group">
              <div className="flex-1"><div className="font-body text-slate-200">{a.nome}</div></div>
              <div className="font-mono-c num-tabular text-sky-300">{formatBRL(a.valor)}</div>
              <button onClick={()=>onRemover(a.id)} className="opacity-0 group-hover:opacity-100 text-slate-400/30 hover:text-red-400 transition-opacity"><Trash2 size={14}/></button>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

// ── MODALS ────────────────────────────────────────────────────────────────────────
const inputCls = "w-full bg-white/[0.03] border border-blue-900/40 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-400/40 focus:outline-none focus:border-blue-500/50 transition-colors";
const btnPrimary = "w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-body font-medium transition-all";

function ModalBase({ titulo, onFechar, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onFechar}>
      <div className="bg-[#0d1829] border border-blue-900/40 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-blue-900/30 sticky top-0 bg-[#0d1829]"><h3 className="font-display text-2xl italic text-slate-100">{titulo}</h3><button onClick={onFechar}><X size={20} className="text-slate-400/50"/></button></div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function ModalReceita({ onFechar, onSalvar }) {
  const [fonte,setFonte]=useState(""); const [valor,setValor]=useState(""); const [salvando,setSalvando]=useState(false);
  const submit=async()=>{if(!fonte||!valor)return;setSalvando(true);await onSalvar({fonte,valor:parseFloat(valor),mes:mesAtual()});};
  return <ModalBase titulo="Nova receita" onFechar={onFechar}><input type="text" value={fonte} onChange={e=>setFonte(e.target.value)} placeholder="Ex: Salário..." className={inputCls}/><input type="number" step="0.01" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" className={inputCls}/><button onClick={submit} disabled={salvando} className={btnPrimary}>{salvando?"Salvando...":"Salvar"}</button></ModalBase>;
}

function ModalDespesa({ categorias, onFechar, onSalvar }) {
  const [descricao,setDescricao]=useState(""); const [valor,setValor]=useState(""); const [categoriaId,setCategoriaId]=useState(categorias[0]?.id||"");
  const [dataVencimento,setDataVencimento]=useState(hojeISO()); const [parcelas,setParcelas]=useState(1); const [salvando,setSalvando]=useState(false);
  const valorParcela=(parseFloat(valor)||0)/Math.max(1,parcelas);
  const submit=async()=>{if(!descricao||!valor)return;setSalvando(true);await onSalvar({descricao,valor:valorParcela,categoria_id:categoriaId,dataVencimento,parcelas});};
  return <ModalBase titulo="Nova despesa" onFechar={onFechar}><input type="text" value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex: Almoço" className={inputCls}/><div className="grid grid-cols-2 gap-3"><input type="number" step="0.01" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" className={inputCls}/><input type="date" value={dataVencimento} onChange={e=>setDataVencimento(e.target.value)} className={inputCls}/></div><input type="number" min="1" max="60" value={parcelas} onChange={e=>setParcelas(Math.max(1,parseInt(e.target.value)||1))} placeholder="Parcelas" className={inputCls}/>{parcelas>1&&<p className="font-mono-c text-xs text-sky-400">{parcelas}x de {formatBRL(valorParcela)}</p>}<button onClick={submit} disabled={salvando} className={btnPrimary}>{salvando?"Salvando...":"Salvar"}</button></ModalBase>;
}

function ModalAssinatura({ onFechar, onSalvar }) {
  const [nome,setNome]=useState(""); const [valor,setValor]=useState(""); const [diaVencimento,setDiaVencimento]=useState("5"); const [salvando,setSalvando]=useState(false);
  const submit=async()=>{if(!nome||!valor)return;setSalvando(true);await onSalvar({nome,valor:parseFloat(valor),dia_vencimento:parseInt(diaVencimento)});};
  return <ModalBase titulo="Nova assinatura" onFechar={onFechar}><input type="text" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex: Netflix" className={inputCls}/><div className="grid grid-cols-2 gap-3"><input type="number" step="0.01" value={valor} onChange={e=>setValor(e.target.value)} placeholder="0,00" className={inputCls}/><input type="number" min="1" max="31" value={diaVencimento} onChange={e=>setDiaVencimento(e.target.value)} placeholder="Dia venc." className={inputCls}/></div><button onClick={submit} disabled={salvando} className={btnPrimary}>{salvando?"Salvando...":"Salvar"}</button></ModalBase>;
}

function ModalParcelamento({ categorias, onFechar, onSalvar }) {
  const [descricao,setDescricao]=useState(""); const [valorTotal,setValorTotal]=useState(""); const [parcelas,setParcelas]=useState(3); const [dataInicio,setDataInicio]=useState(hojeISO()); const [salvando,setSalvando]=useState(false);
  const submit=async()=>{if(!descricao||!valorTotal)return;setSalvando(true);await onSalvar({descricao,valor_total:parseFloat(valorTotal),parcelas_total:parseInt(parcelas),dataInicio});};
  return <ModalBase titulo="Novo parcelamento" onFechar={onFechar}><input type="text" value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Ex: Monitor" className={inputCls}/><input type="number" step="0.01" value={valorTotal} onChange={e=>setValorTotal(e.target.value)} placeholder="Valor total" className={inputCls}/><input type="number" min="2" value={parcelas} onChange={e=>setParcelas(parseInt(e.target.value)||2)} placeholder="Nº de parcelas" className={inputCls}/><input type="date" value={dataInicio} onChange={e=>setDataInicio(e.target.value)} className={inputCls}/><button onClick={submit} disabled={salvando} className={btnPrimary}>{salvando?"Salvando...":"Salvar"}</button></ModalBase>;
}

function ModalCategoria({ onFechar, onSalvar }) {
  const [nome,setNome]=useState(""); const [salvando,setSalvando]=useState(false);
  const submit=async()=>{if(!nome)return;setSalvando(true);await onSalvar({nome,cor:"#60a5fa",icone:"Tag"});};
  return <ModalBase titulo="Nova categoria" onFechar={onFechar}><input type="text" value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome da categoria" className={inputCls}/><button onClick={submit} disabled={salvando} className={btnPrimary}>{salvando?"Salvando...":"Salvar"}</button></ModalBase>;
}
