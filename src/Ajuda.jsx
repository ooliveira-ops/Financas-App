import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { ModalBase } from "./ModalBase";

// Conteúdo do botão "Dúvidas" de cada seção — edite os textos aqui sempre que quiser mudar as explicações
export const AJUDA_CONTEUDO = {
  home: {
    titulo: "Como funciona a Home",
    explicacao: "A Home mostra o mês em sequência: com quanto ele começou (saldo inicial), quanto entrou (receitas), quanto já foi pago e com quanto você está agora (saldo atual). Ao lado, quanto ainda falta pagar somando todos os meses. Também mostra suas próximas assinaturas e permite gerar um relatório em PDF.",
    passos: [
      "Cadastre suas receitas do mês na aba Receitas para o saldo aparecer aqui.",
      "O 'Saldo inicial' é o que sobrou do mês anterior — ou o que faltou, em vermelho. Todo mês começa com ele. Toque no card para ver de onde vem o valor.",
      "Se o saldo não bater com o banco, toque no card 'Saldo inicial' e use 'Registrar saldo atual': informe quanto você tem hoje no banco e o app guarda a diferença como uma 'correção do saldo' de antes deste mês — suas receitas e o pago do mês não mudam. Se você sabe quanto tinha no dia 1º, use 'Saldo do início do mês'. O saldo do início não é receita: é o que já estava na conta quando o mês começou. A lixeira ao lado de cada correção a desfaz.",
      "Conforme você marca despesas como pagas, os cards 'Pago' e 'A pagar' vão se atualizando sozinhos.",
      "O 'Saldo atual' é o saldo inicial mais as receitas do mês, menos o que você pagou no mês.",
      "Se o saldo inicial veio negativo, confira na aba Histórico o mês anterior: alguma receita pode não ter sido cadastrada.",
      "Clique em 'Gerar Relatório do Mês' quando quiser baixar um PDF com tudo o que aconteceu no mês.",
    ],
  },
  despesas: {
    titulo: "Como funciona Despesas",
    explicacao: "Aqui ficam todos os seus gastos, separados em 'Pendentes' (ainda não pagos) e 'Histórico' (já pagos), do mais recente para o mais antigo. As parcelas de um parcelamento aparecem nesta mesma lista. A aba abre sempre no mês atual; se houver pendências de meses anteriores, um aviso amarelo mostra quantas são. Ao lado do total fica o seu saldo atual, o mesmo da Início, que diminui na hora em que você marca uma despesa como paga.",
    passos: [
      "Clique em 'Nova' e preencha a descrição (ex: Almoço), o valor, a data de vencimento, a categoria e a forma de pagamento (Pix, cartão ou dinheiro).",
      "Crie suas próprias categorias em '+ Categoria' (ex: Faculdade) e escolha uma cor; clique numa categoria para ver só os gastos dela.",
      "Se quiser dividir em várias vezes, mude o campo 'Parcelas' — informe o valor TOTAL e o app divide sozinho. Para acompanhar o progresso parcela a parcela, use 'Parcelado'.",
      "Errou algo? Toque no nome da despesa (ou no lápis, no computador) para editar descrição, valor, data, categoria, forma de pagamento ou parcelas. Numa compra parcelada a edição vale para todas as parcelas; se alguma já foi paga, valor, data e parcelas ficam travados.",
      "Quando pagar uma despesa, clique no ícone de check (✓) para marcá-la como paga e ela vai para o Histórico. Um aviso verde confirma o pagamento — não precisa clicar de novo.",
      "Compras no cartão entram na fatura do mês da data de vencimento. Em 'Pendentes', cada fatura mostra o total e o botão 'Pagar fatura', que paga todas as compras dela de uma vez. Também dá para pagar uma por uma pelo ✓.",
      "Use os botões de mês para ver só um período; 'Todos os meses' mostra tudo. 'Só cartão' mostra apenas as compras no cartão.",
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
    explicacao: "Assinaturas são gastos fixos que se repetem todo mês, como streaming ou academia. O app gera automaticamente uma despesa desse valor todo mês, no dia de vencimento que você escolher.",
    passos: [
      "Clique em 'Nova' e informe o nome, o valor e o dia do mês em que ela vence.",
      "A despesa do mês corrente é criada na hora; nos meses seguintes ela aparece sozinha ao abrir o app.",
      "Se cancelar o serviço, é só remover a assinatura daqui que ela para de gerar novas despesas.",
    ],
  },
  parcelamentos: {
    titulo: "Como funcionam os Parcelamentos",
    explicacao: "Parcelamentos servem para compras grandes divididas em várias vezes, como um celular em 10x. Diferente da despesa parcelada simples, aqui você acompanha o progresso de pagamento parcela por parcela.",
    passos: [
      "Clique em 'Novo' e informe a descrição (ex: Monitor), o valor total e em quantas parcelas foi dividido.",
      "Ao salvar, o app já cria uma despesa para cada parcela, com o vencimento de cada mês.",
      "Cada parcela paga sai do saldo uma vez só, seja marcada aqui ou na aba Despesas.",
      "Use 'Marcar próxima como paga' para quitar a próxima parcela. Um aviso confirma qual parcela foi paga; cada clique paga mais uma.",
      "Com todas as parcelas pagas, aparece 'Marcar como concluído': o parcelamento sai da lista e fica guardado em 'Concluídos', no fim da tela. De lá dá para reabrir ou apagar. As despesas das parcelas não mudam.",
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
    explicacao: "O Histórico reúne, mês a mês, as despesas pagas e as pendentes — uma espécie de linha do tempo. Ele abre sempre no mês atual; use as setas para navegar.",
    passos: [
      "Use essa aba quando quiser conferir tudo que já foi movimentado, sem precisar entrar em cada seção separada.",
      "É útil para revisar o mês antes de gerar o relatório em PDF na Home.",
    ],
  },
};

export function BotaoAjuda({ topico }) {
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
        <ModalBase titulo={conteudo.titulo} subtitulo="Dúvidas" icone={HelpCircle} onFechar={() => setAberto(false)}>
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
