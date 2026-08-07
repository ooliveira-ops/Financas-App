import React from "react";
import { X, AlertTriangle } from "lucide-react";

export const inputCls = "w-full bg-white/[0.03] border border-blue-900/40 rounded-xl px-4 py-3 text-slate-100 placeholder:text-slate-400/40 focus:outline-none focus:border-blue-500/50 transition-colors";
export const btnPrimary = "w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-body font-medium transition-all";

export function ModalBase({ titulo, onFechar, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onFechar}>
      <div className="bg-[#0d1829] border border-blue-900/40 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between p-6 border-b border-blue-900/30 sticky top-0 bg-[#0d1829]"><h3 className="font-display text-2xl italic text-slate-100">{titulo}</h3><button onClick={onFechar}><X size={20} className="text-slate-400/50"/></button></div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// Usado em toda ação destrutiva: nenhuma remoção do app tem "desfazer".
export function ModalConfirmar({ mensagem, textoConfirmar = "Apagar", onConfirmar, onCancelar }) {
  return (
    <ModalBase titulo="Confirmar" onFechar={onCancelar}>
      <div className="flex gap-3 items-start">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5"/>
        <p className="font-body text-sm text-slate-300 leading-relaxed">{mensagem}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancelar} className="flex-1 py-3 rounded-xl font-body text-sm bg-white/[0.04] border border-blue-900/40 text-slate-300 hover:bg-white/[0.08] transition-all">Cancelar</button>
        <button onClick={onConfirmar} className="flex-1 py-3 rounded-xl font-body text-sm bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 transition-all">{textoConfirmar}</button>
      </div>
    </ModalBase>
  );
}
