// Formato dos documentos no Firestore — idêntico ao app original (casas/{CASA_ID} e casas/{CASA_ID}/gastos).
// Não renomeie campos: o app antigo e o novo leem os mesmos dados.

export type Pessoa = 'Diego' | 'Eliane';
export const PESSOAS: Pessoa[] = ['Diego', 'Eliane'];

export type FormaPagamento = 'Dinheiro/PIX' | 'Cartão Crédito' | 'Cartão Débito' | 'Vale Alimentação';
export const FORMAS_PAGAMENTO: { valor: FormaPagamento; icone: string; curto: string }[] = [
  { valor: 'Dinheiro/PIX', icone: 'pix', curto: 'PIX' },
  { valor: 'Cartão Crédito', icone: 'cartao', curto: 'Crédito' },
  { valor: 'Cartão Débito', icone: 'banco', curto: 'Débito' },
  { valor: 'Vale Alimentação', icone: 'talher', curto: 'Vale' }
];

export interface Categoria { nome: string; cor: string; subs: string[] }
/** banco: opcional (v2), só para o visual do cartão; o app antigo ignora o campo. */
export interface Cartao { nome: string; fechamento: number; vencimento: number; banco?: string }

export interface Gasto {
  id: string;
  usuario: Pessoa;
  data: string;               // AAAA-MM-DD (data da compra)
  mesFatura: string;          // AAAA-MM (vencimento da fatura; para não-crédito = mês da data)
  descricao: string;          // local / estabelecimento
  categoria: string;
  subcategoria: string;
  observacao: string;         // "Detalhes (o que foi)"
  formaPagamento: FormaPagamento;
  cartao: string | null;
  valor: number;              // valor desta parcela (ou do gasto)
  parcelaAtual: number | null;
  parcelaTotal: number | null;
  valorTotalCompra: number | null;
  grupoId: string | null;
  tipoLancamento: 'gasto' | 'reembolso';
  criadoEm?: unknown;
  atualizadoEm?: unknown;
  ajusteFatura?: { de: string; para: string; motivo: string; quando: string };
  /** v2: parcela trazida para a fatura atual por antecipação (o app antigo ignora o campo). */
  antecipada?: boolean;
}

export type NovoGasto = Omit<Gasto, 'id' | 'criadoEm' | 'atualizadoEm'>;

export const ehReembolso = (g: Pick<Gasto, 'tipoLancamento'>) => g.tipoLancamento === 'reembolso';
export const ehCredito = (g: Pick<Gasto, 'formaPagamento'>) => g.formaPagamento === 'Cartão Crédito';
export const ehParcelado = (g: Pick<Gasto, 'grupoId' | 'parcelaTotal'>) => !!(g.grupoId && g.parcelaTotal && g.parcelaTotal > 1);
