export const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

// ── DATAS ────────────────────────────────────────────────────────────────────────
// Tudo aqui trabalha na data local, nunca em UTC: `toISOString()` em UTC-3 devolve o
// dia seguinte a partir das 21:00 (e o mês seguinte na virada do mês).
const pad2 = (n) => String(n).padStart(2, "0");

export const dataLocalISO = (d = new Date()) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const hojeISO = () => dataLocalISO();
export const mesAtual = () => dataLocalISO().substring(0, 7);

// Soma meses sem transbordar o fim do mês: 31/01 + 1 mês = 28/02, não 03/03.
export const somarMeses = (dataISO, meses) => {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const alvoAno = ano + Math.floor((mes - 1 + meses) / 12);
  const alvoMes = ((mes - 1 + meses) % 12) + 1;
  const ultimoDia = new Date(alvoAno, alvoMes, 0).getDate();
  return `${alvoAno}-${pad2(alvoMes)}-${pad2(Math.min(dia, ultimoDia))}`;
};

const MESES_ABREV = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export const nomeMesAbrev = (mesISO) => {
  const [ano, mes] = mesISO.split("-");
  return `${MESES_ABREV[parseInt(mes, 10) - 1]}/${ano.slice(2)}`;
};

export const nomeMes = (mesISO) => {
  const [ano, mes] = mesISO.split("-");
  return `${MESES[parseInt(mes, 10) - 1]} ${ano}`;
};

export const formatarDataBR = (data) => {
  if (!data) return "—";
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
};

export const formatarDataHora = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

// Últimos N meses (do mais antigo para o mais recente), em "YYYY-MM" e hora local.
export const ultimosMeses = (quantos) => {
  const hoje = new Date();
  const lista = [];
  for (let i = quantos - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    lista.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
  }
  return lista;
};

// ── DINHEIRO ─────────────────────────────────────────────────────────────────────
// Divide em centavos exatos: as primeiras parcelas arredondam para baixo e a última
// absorve a diferença, então a soma fecha com o total (100 em 3x = 33,33/33,33/33,34).
export const dividirEmParcelas = (total, n) => {
  const centavosTotal = Math.round((parseFloat(total) || 0) * 100);
  const base = Math.floor(centavosTotal / n);
  const parcelas = Array(n).fill(base);
  parcelas[n - 1] = centavosTotal - base * (n - 1);
  return parcelas.map((c) => c / 100);
};

export const mesclarPorId = (listaLocal, doBanco) => {
  const mapa = new Map(listaLocal.map((item) => [item.id, item]));
  (doBanco || []).forEach((item) => mapa.set(item.id, item));
  return Array.from(mapa.values());
};
