import React, { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, Calendar } from "lucide-react";
import { supabase } from "./supabase";

/**
 * Aviso flutuante que mostra contas vencidas + vencendo nos próximos dias.
 * Aparece SOMENTE quando o usuário abre o app.
 *
 * USO: <AvisoVencimentos usuario={usuario} diasAntes={7} />
 */
export default function AvisoVencimentos({ usuario, diasAntes = 7 }) {
  const [vencendo, setVencendo] = useState([]);
  const [vencidas, setVencidas] = useState([]);
  const [fechado, setFechado] = useState(false);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const buscar = async () => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const limite = new Date(hoje);
      limite.setDate(limite.getDate() + diasAntes);

      const { data } = await supabase
        .from("despesas")
        .select("*")
        .eq("user_id", usuario.id)
        .eq("status", "pendente")
        .order("data_vencimento", { ascending: true });

      if (!data) {
        setCarregado(true);
        return;
      }

      const vencendoLista = [];
      const vencidasLista = [];

      data.forEach((d) => {
        if (!d.data_vencimento) return;
        const venc = new Date(d.data_vencimento + "T00:00:00");
        if (venc < hoje) vencidasLista.push(d);
        else if (venc <= limite) vencendoLista.push(d);
      });

      setVencidas(vencidasLista);
      setVencendo(vencendoLista);
      setCarregado(true);
    };

    buscar();
  }, [usuario.id, diasAntes]);

  if (!carregado || fechado) return null;
  if (vencidas.length === 0 && vencendo.length === 0) return null;

  const totalVencidas = vencidas.reduce((s, d) => s + Number(d.valor), 0);
  const totalVencendo = vencendo.reduce((s, d) => s + Number(d.valor), 0);

  const formatarData = (data) => {
    const [a, m, d] = data.split("-");
    return `${d}/${m}`;
  };

  return (
    <div className="fixed top-4 right-4 left-4 md:left-auto md:max-w-md z-40">
      <div className="bg-slate-700 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-600 bg-gradient-to-r from-amber-500/10 to-rose-500/10">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h3 className="text-white font-semibold">Você tem contas a pagar</h3>
          </div>
          <button
            onClick={() => setFechado(true)}
            className="text-slate-300 hover:text-white p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {vencidas.length > 0 && (
          <div className="p-4 border-b border-slate-600/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="text-rose-300 text-sm font-semibold">
                {vencidas.length} {vencidas.length === 1 ? "vencida" : "vencidas"}
              </span>
              <span className="ml-auto text-rose-400 font-bold tabular-nums not-italic text-sm">
                {totalVencidas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <ul className="space-y-1 text-xs text-slate-200">
              {vencidas.slice(0, 3).map((d) => (
                <li key={d.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {d.descricao}
                    {d.parcelas_total > 1 && ` (${d.parcela_atual}/${d.parcelas_total})`}
                  </span>
                  <span className="text-rose-300 tabular-nums not-italic shrink-0">
                    {formatarData(d.data_vencimento)}
                  </span>
                </li>
              ))}
              {vencidas.length > 3 && (
                <li className="text-slate-400">
                  +{vencidas.length - 3} {vencidas.length - 3 === 1 ? "outra" : "outras"}
                </li>
              )}
            </ul>
          </div>
        )}

        {vencendo.length > 0 && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-semibold">
                {vencendo.length} vencendo em até {diasAntes} dias
              </span>
              <span className="ml-auto text-amber-400 font-bold tabular-nums not-italic text-sm">
                {totalVencendo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <ul className="space-y-1 text-xs text-slate-200">
              {vencendo.slice(0, 3).map((d) => (
                <li key={d.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {d.descricao}
                    {d.parcelas_total > 1 && ` (${d.parcela_atual}/${d.parcelas_total})`}
                  </span>
                  <span className="text-amber-300 tabular-nums not-italic shrink-0">
                    {formatarData(d.data_vencimento)}
                  </span>
                </li>
              ))}
              {vencendo.length > 3 && (
                <li className="text-slate-400">
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
