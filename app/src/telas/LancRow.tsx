import { useCasa } from '../data/store';
import { brl } from '../lib/datas';
import type { Item } from '../lib/consultas';
import { ehCredito, ehReembolso } from '../types';
import { SwipeItem } from '../ui/base';
import { useAcoes } from './Acoes';

export const corDa = (cats: { nome: string; cor: string }[], nome: string) => cats.find(c => c.nome === nome)?.cor ?? '#6b7280';

/** Linha de lançamento. modo "fatura" mostra a parcela (3/17); "compra" mostra a compra inteira (17x). */
export function LancRow({ g, modo = 'compra' }: { g: Item; modo?: 'compra' | 'fatura' }) {
  const { categorias } = useCasa();
  const reemb = ehReembolso(g);
  const inteiro = g.colapsado;
  const valor = Math.abs(g.v);
  const sub = [g.subcategoria || g.categoria, ehCredito(g) ? g.cartao : g.formaPagamento].filter(Boolean).join(' · ');
  return (
    <div className="lanc">
      <span className="ico cat-c" style={{ background: corDa(categorias, g.categoria) }}>{(g.categoria || '?')[0]}</span>
      <span style={{ minWidth: 0 }}>
        <span className="t">
          {g.descricao}
          {g.parcelaTotal ? <span className="pp">{inteiro || modo === 'compra' ? `${g.parcelaTotal}x` : `${g.parcelaAtual}/${g.parcelaTotal}`}</span> : null}
          {reemb && <span className="tag ok">estorno</span>}
        </span>
        <span className="s"><span className={'who ' + (g.usuario === 'Diego' ? 'd' : 'e')} /> {sub}{g.observacao ? ` · ${g.observacao}` : ''}</span>
      </span>
      <span className="v num" style={reemb ? { color: 'var(--success)' } : undefined}>
        {reemb ? '−' : ''}{brl(valor)}
        {inteiro && g.parcelaTotal ? <small style={{ color: 'var(--text-3)' }}>{g.parcelaTotal}x {brl(g.valor)}</small> : null}
      </span>
    </div>
  );
}

export function LancSwipe({ g, modo }: { g: Item; modo?: 'compra' | 'fatura' }) {
  const a = useAcoes();
  return (
    <SwipeItem onAbrir={() => a.detalhe(g.id)} onEditar={() => a.editar(g.id)} onExcluir={() => a.excluir(g.id)}>
      <LancRow g={g} modo={modo} />
    </SwipeItem>
  );
}
