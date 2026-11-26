import { useMemo, useState } from 'react';
import { useCasa } from '../data/store';
import { brl, idxCurto, MESES } from '../lib/datas';
import { comprasParceladas, parcelasPorMes } from '../lib/consultas';
import { Chips } from '../ui/base';
import { useAcoes } from './Acoes';

/** Barras das parcelas nos próximos 12 meses; "extra" = parcelas da compra que está sendo lançada. */
export function GraficoParcelas({ inicio, extra, altura = 120 }: { inicio: number; extra?: Map<number, number>; altura?: number }) {
  const { gastos } = useCasa();
  const m = useMemo(() => parcelasPorMes(gastos), [gastos]);
  const meses = Array.from({ length: 12 }, (_, i) => inicio + i);
  const max = Math.max(1, ...meses.map(i => (m.get(i) ?? 0) + (extra?.get(i) ?? 0)));
  return (
    <>
      <div className="chart" style={{ height: altura }}>
        {meses.map(i => { const a = m.get(i) ?? 0, b = extra?.get(i) ?? 0;
          return <div key={i} className={'col' + (i === inicio ? ' cur' : '')} title={`${idxCurto(i)}: ${brl(a + b)}`}>
            {b > 0 && <div className="seg-new" style={{ height: `${b / max * 100}%` }} />}
            {a > 0 && <div className="seg-old" style={{ height: `${a / max * 100}%` }} />}
          </div>; })}
      </div>
      <div className="chart-x">{meses.map(i => <span key={i}>{MESES[i % 12]}</span>)}</div>
      <div className="legend">{extra ? <><span><i style={{ background: 'var(--bar-old)' }} />Já parcelado</span><span><i style={{ background: 'var(--bar-new)' }} />Esta compra</span></>
        : <><span><i style={{ background: 'var(--primary)' }} />Fatura atual</span><span><i style={{ background: 'var(--bar-old)' }} />Meses seguintes</span></>}</div>
    </>
  );
}

export function Parcelas() {
  const { gastos, cartoes, faturaAtual } = useCasa();
  const acoes = useAcoes();
  const [filtro, setFiltro] = useState('todos');
  const ativas = useMemo(() => comprasParceladas(gastos, faturaAtual).filter(c => c.ativa), [gastos, faturaAtual]);
  const porMes = useMemo(() => parcelasPorMes(gastos), [gastos]);
  const noMes = ativas.reduce((s, c) => s + (c.atual?.valor ?? 0), 0);
  const acabam = ativas.filter(c => c.ultimoMes === faturaAtual);
  const lista = ativas.filter(c => filtro === 'todos' || c.usuario === filtro || c.cartao === filtro).sort((a, b) => a.ultimoMes - b.ultimoMes);
  return (
    <>
      <div className="hero">
        <div className="k">Parcelas na fatura de {idxCurto(faturaAtual)}</div>
        <div className="v num">{brl(noMes)}</div>
        <div className="grid">
          <div><div className="k">Ainda falta pagar</div><div className="v num">{brl(ativas.reduce((s, c) => s + c.falta, 0))}</div></div>
          <div><div className="k">Compras em andamento</div><div className="v num">{ativas.length}</div></div>
        </div>
        <div className="drop">{acabam.length
          ? <>🎉 {acabam.length > 2 ? `${acabam.length} compras terminam` : `${acabam.map(c => c.descricao).join(' e ')} termina${acabam.length > 1 ? 'm' : ''}`} nesta fatura. Em {idxCurto(faturaAtual + 1)} as parcelas caem para <b>{brl(porMes.get(faturaAtual + 1) ?? 0)}</b>.</>
          : <>Em {idxCurto(faturaAtual + 1)}: {brl(porMes.get(faturaAtual + 1) ?? 0)} em parcelas.</>}</div>
      </div>
      <div className="card"><h2>Parcelas nos próximos 12 meses</h2><GraficoParcelas inicio={faturaAtual} /></div>
      <div className="card">
        <h2>Compras parceladas</h2>
        <div style={{ marginBottom: 8 }}><Chips valor={filtro} onChange={setFiltro} opcoes={[['todos', 'Todas'], ['Diego', '👨 Diego'], ['Eliane', '👩 Eliane'], ...cartoes.map(c => [c.nome, c.nome] as [string, string])]} /></div>
        {lista.length ? lista.map(c => { const an = c.atual?.parcelaAtual ?? c.pagas + 1;
          return <button key={c.grupoId} className="compra" onClick={() => acoes.compra(c.grupoId)}>
            <span className={'dot ' + (c.usuario === 'Diego' ? 'd' : 'e')}>{c.usuario[0]}</span>
            <span style={{ minWidth: 0 }}><span className="nm">{c.descricao} {c.ultimoMes === faturaAtual && <span className="tag ok">última parcela</span>}</span>
              <span className="mt">{[c.categoria, c.cartao].filter(Boolean).join(' · ')} · parcela {an} de {c.n} · termina {idxCurto(c.ultimoMes)}</span>
              <span className="bar"><i style={{ width: `${an / c.n * 100}%` }} /></span></span>
            <span className="r"><b className="num">{brl(c.valorParcela)}</b><span className="num">faltam {brl(c.falta)}</span></span>
          </button>; }) : <div className="vazio">Nenhuma compra parcelada em andamento.</div>}
      </div>
    </>
  );
}
