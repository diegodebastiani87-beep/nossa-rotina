import { useMemo, useState } from 'react';
import { useCasa } from '../data/store';
import { brl, diasNoMes, idxCurto, idxLongo, idxYm, MESES, nomeMes } from '../lib/datas';
import { agrupar, aplicarFiltros, itensDoMes, soma, somaDe, type Filtros, type Item, type ModoMes } from '../lib/consultas';
import { FORMAS_PAGAMENTO, type FormaPagamento, type Pessoa } from '../types';
import { Chips, Seg } from '../ui/base';
import { useAcoes } from './Acoes';
import { corDa } from './LancRow';

const CORES_PAG: Record<FormaPagamento, string> = { 'Dinheiro/PIX': 'var(--success)', 'Cartão Crédito': 'var(--primary)', 'Cartão Débito': 'var(--warning)', 'Vale Alimentação': 'var(--eliane)' };
type Periodo = 'anterior' | '3meses' | '6meses' | 'ano';

export function Analise({ mes, setMes }: { mes: number; setMes: (m: number) => void }) {
  const { gastos, categorias, cartoes, hoje } = useCasa();
  const acoes = useAcoes();
  const [sub, setSub] = useState<'resumo' | 'comparar'>('resumo');
  const [modo, setModo] = useState<ModoMes>('compra');
  const [f, setF] = useState<Filtros>({});
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const [periodo, setPeriodo] = useState<Periodo>('anterior');
  const [nivel, setNivel] = useState<'cat' | 'sub'>('cat');
  const [mesmoDia, setMesmoDia] = useState(true);
  const mesHoje = hoje.getFullYear() * 12 + hoje.getMonth();
  const doMes = (m: number, ateDia?: number | null) => aplicarFiltros(itensDoMes(gastos, m, modo, ateDia), f);
  const it = useMemo(() => doMes(mes), [gastos, mes, modo, f]); // eslint-disable-line react-hooks/exhaustive-deps
  const tot = soma(it);

  const exportarCSV = () => {
    const l = [['Data Compra', 'Mês Fatura', 'Tipo', 'Quem', 'Local', 'Categoria', 'Subcategoria', 'Forma de Pagamento', 'Cartão', 'Parcela', 'Detalhes', 'Valor']];
    it.forEach(g => l.push([g.data, g.mesFatura || g.data.slice(0, 7), g.tipoLancamento === 'reembolso' ? 'Reembolso' : 'Gasto', g.usuario, g.descricao, g.categoria, g.subcategoria || '', g.formaPagamento, g.cartao || '',
      g.colapsado ? `${g.numParcelas}x` : g.parcelaTotal ? `${g.parcelaAtual}/${g.parcelaTotal}` : '', g.observacao || '', String(Math.abs(g.v)).replace('.', ',')]));
    const csv = l.map(x => x.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `gastos-${idxYm(mes)}.csv`; a.click();
  };

  return (
    <>
      <Seg valor={sub} onChange={setSub} opcoes={[['resumo', '📊 Resumo'], ['comparar', '📈 Comparar']]} />
      <div className="card">
        <div className="filtros">
          <div><label className="l" htmlFor="fModo">Filtrar mês por</label><select className="inp" id="fModo" value={modo} onChange={e => setModo(e.target.value as ModoMes)}><option value="compra">🛒 Mês da compra</option><option value="fatura">📅 Mês da fatura</option></select></div>
          <div><label className="l" htmlFor="fCat">Categoria</label><select className="inp" id="fCat" value={f.categoria ?? ''} onChange={e => setF({ ...f, categoria: e.target.value })}><option value="">Todas</option>{categorias.map(c => <option key={c.nome}>{c.nome}</option>)}</select></div>
          <div><label className="l" htmlFor="fPes">Pessoa</label><select className="inp" id="fPes" value={f.pessoa ?? ''} onChange={e => setF({ ...f, pessoa: e.target.value as Pessoa | '' })}><option value="">Todos</option><option>Diego</option><option>Eliane</option></select></div>
          <div><label className="l" htmlFor="fPag">Pagamento</label><select className="inp" id="fPag" value={f.pagamento ?? ''} onChange={e => setF({ ...f, pagamento: e.target.value as FormaPagamento | '', cartao: '' })}><option value="">Todos</option>{FORMAS_PAGAMENTO.map(p => <option key={p.valor}>{p.valor}</option>)}</select></div>
          {f.pagamento === 'Cartão Crédito' && <div><label className="l" htmlFor="fCar">Cartão</label><select className="inp" id="fCar" value={f.cartao ?? ''} onChange={e => setF({ ...f, cartao: e.target.value })}><option value="">Todos</option>{cartoes.map(c => <option key={c.nome}>{c.nome}</option>)}</select></div>}
        </div>
        <div className="linkline" style={{ marginTop: 10 }}>
          {(f.categoria || f.pessoa || f.pagamento) && <button className="linkbtn" style={{ padding: 0 }} onClick={() => setF({})}>🧹 Limpar filtros</button>}
          {sub === 'resumo' && <button className="linkbtn" style={{ padding: 0 }} onClick={exportarCSV}>⬇️ Exportar CSV</button>}
        </div>
      </div>

      {sub === 'resumo' ? <>
        <Evolucao meses={Array.from({ length: 6 }, (_, i) => mes - 5 + i)} doMes={doMes} atual={mes} emAndamento={mes === mesHoje} setMes={setMes} />
        <div className="grid2">
          <div className="card"><h2>Resumo</h2><div className="resumo">
            <div><div className="k">👨 Diego</div><div className="v num">{brl(somaDe(it, 'Diego'))}</div></div>
            <div><div className="k">👩 Eliane</div><div className="v num">{brl(somaDe(it, 'Eliane'))}</div></div>
            <div><div className="k">Média diária</div><div className="v num">{brl(tot / (mes === mesHoje ? hoje.getDate() : diasNoMes(mes)))}</div></div>
            <div><div className="k">Lançamentos</div><div className="v num">{it.length}</div></div>
            <div className="tot"><div className="k">Total de {nomeMes(mes)}</div><div className="v num">{brl(tot)}</div></div>
          </div></div>
          <div className="card"><h2>Por forma de pagamento</h2><PorPagamento it={it} tot={tot} /></div>
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <h2>Por categoria <span className="note">toque para ver subcategorias</span></h2>
          {agrupar(it, 'cat').map(o => {
            const aberta = abertas.has(o.chave), cor = corDa(categorias, o.chave);
            const daCat = it.filter(x => (x.categoria || 'Outros') === o.chave);
            return <div key={o.chave} className={'catx' + (aberta ? ' open' : '')}>
              <button onClick={() => { const s = new Set(abertas); if (aberta) s.delete(o.chave); else s.add(o.chave); setAbertas(s); }}>
                <span className="nm"><em>›</em><i className="cat-c" style={{ background: cor }} />{o.chave}</span>
                <span className="vl num">{brl(o.t)}<small>{tot ? Math.round(o.t / tot * 100) : 0}%</small></span>
                <span className="tr"><i className="cat-c" style={{ width: `${tot ? Math.max(0, o.t / tot * 100) : 0}%`, background: cor }} /></span>
              </button>
              {aberta && <div className="subs2">
                {agrupar(daCat, 'sub').map(s => <div key={s.chave}><span>{s.chave.split(' › ')[1]}</span><span className="tr"><i className="cat-c" style={{ width: `${o.t ? Math.max(0, s.t / o.t * 100) : 0}%`, background: cor, opacity: .7 }} /></span><b className="num">{brl(s.t)}</b></div>)}
                <button className="ver" onClick={() => acoes.lista(`${o.chave} · ${nomeMes(mes)}`, [...daCat].sort((a, b) => b.data.localeCompare(a.data)), modo)}>Ver os {daCat.length} lançamentos →</button>
              </div>}
            </div>;
          })}
          {!it.length && <div className="vazio">Sem dados com esses filtros.</div>}
        </div>
      </> : (() => {
        // média por mês (o app antigo somava os meses e comparava com 1 mês só)
        const n = { anterior: 1, '3meses': 3, '6meses': 6, ano: (mes % 12) || 1 }[periodo];
        const podeDia = mes === mesHoje && modo === 'compra';
        const ateDia = podeDia && mesmoDia ? hoje.getDate() : null;
        const ant: Item[] = [];
        for (let i = 1; i <= n; i++) ant.push(...doMes(mes - i, ateDia).map(x => ({ ...x, v: x.v / n })));
        const tA = soma(ant), dif = tot - tA, pct = tA ? dif / tA * 100 : 0;
        const rot = { anterior: idxLongo(mes - 1), '3meses': 'Média de 3 meses', '6meses': 'Média de 6 meses', ano: 'Média do ano' }[periodo];
        const gA = agrupar(it, nivel), gB = agrupar(ant, nivel);
        const ks = [...new Set([...gA, ...gB].map(g => g.chave))];
        const pega = (l: typeof gA, k: string) => l.find(g => g.chave === k) ?? { chave: k, categoria: (gA.find(g => g.chave === k) ?? gB.find(g => g.chave === k))!.categoria, d: 0, e: 0, t: 0 };
        ks.sort((a, b) => (pega(gA, b).t + pega(gB, b).t) - (pega(gA, a).t + pega(gB, a).t));
        const max = Math.max(1, ...ks.map(k => Math.max(pega(gA, k).t, pega(gB, k).t)));
        const barra = (o: { d: number; e: number }, ant2 = false) => <span className={'b' + (ant2 ? ' ant' : '')}><i style={{ width: `${Math.max(0, o.d) / max * 100}%`, background: 'var(--diego)' }} /><i style={{ width: `${Math.max(0, o.e) / max * 100}%`, background: 'var(--eliane)' }} /></span>;
        return <div className="card">
          <h2>Comparativo entre períodos</h2>
          <label className="l">Comparar com</label>
          <Chips valor={periodo} onChange={setPeriodo} opcoes={[['anterior', 'Mês anterior'], ['3meses', 'Média 3 meses'], ['6meses', 'Média 6 meses'], ['ano', 'Média do ano']]} />
          <label className="l" style={{ marginTop: 12 }}>Detalhar por</label>
          <Seg className="minitog" valor={nivel} onChange={setNivel} opcoes={[['cat', '📂 Categoria'], ['sub', '📁 Subcategoria']]} />
          {podeDia && <label className="switch" style={{ marginTop: 14 }}><input type="checkbox" checked={mesmoDia} onChange={e => setMesmoDia(e.target.checked)} /><span className="sw" />Comparar só até o dia {hoje.getDate()} de cada mês (o mês atual ainda não acabou)</label>}
          <div className="cmpbox">
            <div className="cur"><div className="k">{idxLongo(mes)}</div><div className="v num">{brl(tot)}</div><div className="q"><span>👨 {brl(somaDe(it, 'Diego'))}</span><span>👩 {brl(somaDe(it, 'Eliane'))}</span></div></div>
            <div><div className="k">{rot}</div><div className="v num">{brl(tA)}</div><div className="q"><span>👨 {brl(somaDe(ant, 'Diego'))}</span><span>👩 {brl(somaDe(ant, 'Eliane'))}</span></div></div>
            <div className="var"><span className="k">Variação</span><span className={'v num ' + (dif > 0 ? 'up' : 'down')}>{dif > 0 ? '▲ +' : '▼ '}{brl(dif)} <small>({dif > 0 ? '+' : ''}{pct.toFixed(1)}%)</small></span></div>
          </div>
          <div className="legend"><span><i style={{ background: 'var(--diego)' }} />Diego</span><span><i style={{ background: 'var(--eliane)' }} />Eliane</span><span>Barra clara = período comparado</span></div>
          {ks.map(k => { const a = pega(gA, k), b = pega(gB, k), d = a.t - b.t, p = b.t ? d / b.t * 100 : null;
            return <div key={k} className="cmprow"><div className="h"><span><i className="cat-c" style={{ background: corDa(categorias, a.categoria) }} />{k}</span><span className={(d > 0 ? 'up' : 'down') + ' num'}>{p === null ? 'novo' : `${d > 0 ? '▲ +' : '▼ '}${p.toFixed(0)}%`}</span></div>
              <div className="bars"><span>{MESES[mes % 12]}</span>{barra(a)}<b className="num">{brl(a.t)}</b><span>{periodo === 'anterior' ? MESES[(mes - 1) % 12] : 'média'}</span>{barra(b, true)}<span className="num">{brl(b.t)}</span></div></div>; })}
          {!ks.length && <div className="vazio">Sem dados para comparar.</div>}
        </div>;
      })()}
    </>
  );
}

function PorPagamento({ it, tot }: { it: Item[]; tot: number }) {
  const pg = FORMAS_PAGAMENTO.map(p => [p, soma(it.filter(x => x.formaPagamento === p.valor))] as const).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (!pg.length) return <div className="vazio">Sem dados.</div>;
  return <>
    <div className="paybar">{pg.map(([p, v]) => <i key={p.valor} title={p.valor} style={{ width: `${v / tot * 100}%`, background: CORES_PAG[p.valor] }} />)}</div>
    <div className="paylist">{pg.map(([p, v]) => <div key={p.valor}><i style={{ background: CORES_PAG[p.valor] }} /><span>{p.emoji} {p.valor}</span><b className="num">{brl(v)}</b><span className="p num">{Math.round(v / tot * 100)}%</span></div>)}</div>
  </>;
}

function Evolucao({ meses, doMes, atual, emAndamento, setMes }: { meses: number[]; doMes: (m: number) => Item[]; atual: number; emAndamento: boolean; setMes: (m: number) => void }) {
  const vals = meses.map(m => { const xs = doMes(m); return { m, d: somaDe(xs, 'Diego'), e: somaDe(xs, 'Eliane') }; });
  const max = Math.max(1, ...vals.map(v => v.d + v.e));
  const media = vals.slice(0, 5).reduce((s, v) => s + v.d + v.e, 0) / 5;
  const tot = vals[5].d + vals[5].e, vs = media ? (tot - media) / media * 100 : 0;
  return (
    <div className="card">
      <h2>Últimos 6 meses <span className="note">{emAndamento ? 'mês em andamento' : <span className={vs > 0 ? 'up' : 'down'}>{vs > 0 ? '▲ +' : '▼ '}{vs.toFixed(0)}% vs média</span>}</span></h2>
      <div className="evo">
        {vals.map(v => { const t = v.d + v.e, h = Math.max(0, t) / max * 100;
          return <button key={v.m} className={'c' + (v.m === atual ? ' cur' : '')} title={`${idxLongo(v.m)}: ${brl(t)}`} style={{ height: '100%' }} onClick={() => setMes(v.m)}>
            <span className="tv num" style={{ bottom: `calc(${h}% + 4px)` }}>{(t / 1000).toFixed(1).replace('.', ',')} mil</span>
            <i style={{ height: `${Math.max(0, v.e) / max * 100}%`, background: 'var(--eliane)' }} />
            <i style={{ height: `${Math.max(0, v.d) / max * 100}%`, background: 'var(--diego)' }} />
          </button>; })}
        {media > 0 && <div className="avg" style={{ bottom: `${media / max * (100 - 18 / 1.7)}%` }}><span>média {brl(media)}</span></div>}
      </div>
      <div className="evo-x">{vals.map(v => <span key={v.m} className={v.m === atual ? 'cur' : ''}>{idxCurto(v.m)}</span>)}</div>
      <div className="legend"><span><i style={{ background: 'var(--diego)' }} />Diego</span><span><i style={{ background: 'var(--eliane)' }} />Eliane</span><span>- - - média dos 5 meses anteriores</span><span>Toque num mês para abrir</span></div>
    </div>
  );
}
