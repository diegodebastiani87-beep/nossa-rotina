import { useMemo, useState } from 'react';
import { useCasa } from '../data/store';
import { brl, DIAS_SEMANA, MESES, nomeMes } from '../lib/datas';
import { aplicarFiltros, itensDoMes, soma, somaDe, type Item, type ModoMes } from '../lib/consultas';
import { FORMAS_PAGAMENTO, type FormaPagamento, type Pessoa } from '../types';
import { Chips, Seg } from '../ui/base';
import { LancSwipe } from './LancRow';

export function Lancamentos({ mes }: { mes: number }) {
  const { gastos, cartoes } = useCasa();
  const [pessoa, setPessoa] = useState<Pessoa | ''>('');
  const [modo, setModo] = useState<ModoMes>('compra');
  const [pag, setPag] = useState<FormaPagamento | ''>('');
  const [cartao, setCartao] = useState('');
  const it = useMemo(() => aplicarFiltros(itensDoMes(gastos, mes, modo), { pessoa, pagamento: pag, cartao: pag === 'Cartão Crédito' ? cartao : '' }), [gastos, mes, modo, pessoa, pag, cartao]);
  const porDia = new Map<string, Item[]>();
  [...it].sort((a, b) => b.data.localeCompare(a.data)).forEach(x => porDia.set(x.data, [...(porDia.get(x.data) ?? []), x]));

  return (
    <>
      <div className="card">
        <div className="totbar">
          <div><div className="note">Total de {nomeMes(mes)}{pessoa || pag ? ' (filtrado)' : ''}</div><div className="big num">{brl(soma(it))}</div></div>
          <div className="p"><span className="who d" />Diego<b className="num">{brl(somaDe(it, 'Diego'))}</b></div>
          <div className="p"><span className="who e" />Eliane<b className="num">{brl(somaDe(it, 'Eliane'))}</b></div>
        </div>
      </div>
      <div className="filtrobar">
        <Chips valor={pessoa} onChange={setPessoa} opcoes={[['', '👥 Todos'], ['Diego', '👨 Diego'], ['Eliane', '👩 Eliane']]} />
        <Seg className="minitog" valor={modo} onChange={setModo} opcoes={[['compra', '🛒 Mês da compra'], ['fatura', '📅 Mês da fatura']]} />
      </div>
      <div className="filtros" style={{ marginBottom: 12 }}>
        <div><label className="l" htmlFor="lcPag">Pagamento</label><select className="inp" id="lcPag" value={pag} onChange={e => setPag(e.target.value as FormaPagamento | '')}><option value="">Todos</option>{FORMAS_PAGAMENTO.map(f => <option key={f.valor} value={f.valor}>{f.emoji} {f.valor}</option>)}</select></div>
        {pag === 'Cartão Crédito' && <div><label className="l" htmlFor="lcCar">Cartão</label><select className="inp" id="lcCar" value={cartao} onChange={e => setCartao(e.target.value)}><option value="">Todos</option>{cartoes.map(c => <option key={c.nome}>{c.nome}</option>)}</select></div>}
      </div>
      <div className="card">
        {porDia.size ? <>
          {[...porDia.entries()].map(([d, xs]) => { const dt = new Date(d + 'T12:00');
            return <div key={d}><div className="dia"><span>{DIAS_SEMANA[dt.getDay()]}, {dt.getDate()} {MESES[dt.getMonth()]}</span><span className="num">{brl(soma(xs))}</span></div>
              {xs.map(x => <LancSwipe key={x.id} g={x} modo={modo} />)}</div>; })}
          <div className="dica-sw">Deslize → para excluir, ← para editar. Ou toque/clique para ver as opções.</div>
        </> : <div className="vazio">Nenhum lançamento neste mês.</div>}
      </div>
    </>
  );
}
