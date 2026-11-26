import { useMemo } from 'react';
import { useCasa } from '../data/store';
import { brl, brlCompacto, DIAS_SEMANA, hojeISO, idxCurto, idxYm, isoLocal, mesDe, MESES, nomeMes, ymIdx } from '../lib/datas';
import { comprasParceladas, itensDoMes, soma, somaDe, type Item } from '../lib/consultas';
import { ehCredito, ehReembolso, type Gasto } from '../types';
import { corDa, LancSwipe } from './LancRow';

const momento = (g: Gasto) => {
  const c = g.criadoEm as { toMillis?: () => number; seconds?: number } | undefined;
  if (c?.toMillis) return c.toMillis();
  if (typeof c?.seconds === 'number') return c.seconds * 1000;
  return new Date(g.data + 'T00:00:00').getTime();
};

export function Inicio({ mes, ir, abrirFatura }: { mes: number; ir: (v: string) => void; abrirFatura: (cartao: string, mes: number) => void }) {
  const { gastos, categorias, cartoes, faturaAtual, hoje } = useCasa();
  const mesHoje = hoje.getFullYear() * 12 + hoje.getMonth();
  const dia = mes === mesHoje ? hoje.getDate() : null;
  // Mesma regra do app original: o Início mostra o que pesa NESTE mês, pelo mês da fatura
  // (no crédito conta a parcela do mês; o resto pelo mês da data), só com compras feitas até hoje.
  // O mês anterior é cortado no mesmo dia para a comparação ser justa.
  const hojeIso = hojeISO();
  const at = useMemo(() => itensDoMes(gastos, mes, 'fatura').filter(x => x.data <= hojeIso), [gastos, mes, hojeIso]);
  const an = useMemo(() => {
    const ultimo = new Date(Math.floor((mes - 1) / 12), ((mes - 1) % 12) + 1, 0).getDate();
    const limite = `${idxYm(mes - 1)}-${String(Math.min(dia ?? 31, ultimo)).padStart(2, '0')}`;
    return itensDoMes(gastos, mes - 1, 'fatura').filter(x => x.data <= limite);
  }, [gastos, mes, dia]);
  const tot = soma(at), tAn = soma(an), d = somaDe(at, 'Diego'), e = somaDe(at, 'Eliane');
  const pct = tAn ? (tot - tAn) / tAn * 100 : 0;

  const porCat = new Map<string, number>();
  at.forEach(x => porCat.set(x.categoria || 'Outros', (porCat.get(x.categoria || 'Outros') ?? 0) + x.v));
  const ordem = [...porCat.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const top: [string, number][] = ordem.slice(0, 4);
  const resto = ordem.slice(4).reduce((s, [, v]) => s + v, 0);
  if (resto > 0) top.push(['Outras categorias', resto]);

  // últimos 7 dias (como no app atual)
  const dias = Array.from({ length: 7 }, (_, i) => { const dt = new Date(hoje); dt.setDate(dt.getDate() - 6 + i); return isoLocal(dt); });
  const porDia = dias.map(iso => soma(itensDoMes(gastos, mesDe(iso), 'compra').filter(x => x.data === iso)));
  const maxDia = Math.max(1, ...porDia);

  const ativas = comprasParceladas(gastos, faturaAtual).filter(c => c.ativa);
  const prox = [...ativas].sort((a, b) => a.ultimoMes - b.ultimoMes)[0];
  // faturas: as próximas 4 com valor, a partir do mês corrente (regra do app original)
  const faturas = new Map<string, { mes: number; cartao: string; total: number }>();
  for (const g of gastos) {
    if (!ehCredito(g) || !g.mesFatura) continue;
    const m = ymIdx(g.mesFatura); if (m < mesHoje || m > mesHoje + 3) continue;
    const k = m + '|' + (g.cartao || '(sem cartão)');
    const f = faturas.get(k) ?? { mes: m, cartao: g.cartao || '(sem cartão)', total: 0 };
    f.total += ehReembolso(g) ? -g.valor : g.valor; faturas.set(k, f);
  }
  const proxFaturas = [...faturas.values()].filter(f => f.total > 0).sort((a, b) => a.mes - b.mes || a.cartao.localeCompare(b.cartao)).slice(0, 4);
  const deHoje = gastos.filter(g => g.data === hojeIso && !(g.parcelaAtual && g.parcelaAtual > 1));
  const vistos = new Set<string>();
  const recentes = (deHoje.length ? deHoje : [...gastos].sort((a, b) => momento(b) - momento(a)))
    .filter(g => { if (!g.grupoId || !g.parcelaTotal) return true; if (vistos.has(g.grupoId)) return false; vistos.add(g.grupoId); return true; })
    .slice(0, deHoje.length ? 20 : 5)
    .map<Item>(g => ({ ...g, v: g.parcelaTotal ? (g.valorTotalCompra ?? g.valor) : ehReembolso(g) ? -g.valor : g.valor, colapsado: !!g.parcelaTotal }));

  return (
    <>
      <div className="hero">
        <div className="k">Gasto em {nomeMes(mes)}{dia ? ' até agora' : ''} · {at.length} lançamentos</div>
        <div className="v num">{brl(tot)}</div>
        {tAn > 0 ? <span className="cmp">{pct > 0 ? '▲ +' : '▼ '}{pct.toFixed(0)}% vs {dia ? `mesmo ponto de ${nomeMes(mes - 1)}` : nomeMes(mes - 1)} ({brl(tAn)})</span> : <span className="cmp">Sem dados do mês anterior</span>}
        <div className="split"><i style={{ width: `${tot ? d / tot * 100 : 50}%`, background: 'var(--diego)' }} /><i style={{ width: `${tot ? e / tot * 100 : 50}%`, background: 'var(--eliane)' }} /></div>
        <div className="leg"><span><span className="who d" /> Diego<b className="num">{brl(d)}</b></span><span><span className="who e" /> Eliane<b className="num">{brl(e)}</b></span></div>
      </div>

      <div className="sec-h"><span>💳 Próximas faturas</span><button onClick={() => ir('faturas')}>Ver todas</button></div>
      <div className="fats">
        {proxFaturas.length ? proxFaturas.map(f => { const c = cartoes.find(x => x.nome === f.cartao);
          return <button key={f.mes + f.cartao} className="fatc" onClick={() => abrirFatura(f.cartao, f.mes)}><div className="n">{f.cartao}</div><div className="v num">{brl(f.total)}</div>
            <div className="s">{c ? `vence ${String(c.vencimento).padStart(2, '0')}/${MESES[f.mes % 12]}` : `vence em ${idxCurto(f.mes)}`}</div></button>; })
          : <div className="note">Nenhuma fatura futura com valor.</div>}
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Onde foi o dinheiro <button className="lk" onClick={() => ir('analise')}>Ver análise</button></h2>
          {top.length ? top.map(([c, v]) => { const cor = c === 'Outras categorias' ? '#9aa1b2' : corDa(categorias, c);
            return <div key={c} className="catrow"><span className="nm"><i className="cat-c" style={{ background: cor }} />{c}</span><span className="vl num">{brl(v)}<small>{Math.round(v / tot * 100)}%</small></span>
              <span className="tr"><i className="cat-c" style={{ width: `${Math.max(v / tot * 100, 2)}%`, background: cor }} /></span></div>; })
            : <div className="vazio">Nenhum gasto neste mês.</div>}
        </div>
        <div className="card">
          <h2>📅 Últimos 7 dias <span className="note num">{brl(porDia.reduce((s, v) => s + v, 0))}</span></h2>
          <div className="semana">
            {dias.map((iso, i) => <div key={iso} className={'d' + (iso === hojeIso ? ' hoje' : '')} title={`${iso.split('-').reverse().join('/')}: ${brl(porDia[i])}`}>
              <b className="num">{porDia[i] ? brlCompacto(porDia[i]).replace('R$', '').trim() : ''}</b>
              <i style={{ height: `${porDia[i] / maxDia * 70}%` }} />
              <span>{iso === hojeIso ? 'hoje' : DIAS_SEMANA[new Date(iso + 'T12:00').getDay()]}</span></div>)}
          </div>
          {ativas.length > 0 && <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 12 }}>
            <div className="catrow" style={{ padding: 0 }}><span className="nm">🔁 Parcelas na fatura de {idxCurto(faturaAtual)}</span><span className="vl num">{brl(ativas.reduce((s, c) => s + (c.atual?.valor ?? 0), 0))}<small>{ativas.length} compras</small></span></div>
            {prox && <div className="note" style={{ marginTop: 6 }}>Próxima a terminar: <b>{prox.descricao}</b> em {idxCurto(prox.ultimoMes)}. <button className="linkbtn" style={{ padding: 0 }} onClick={() => ir('parcelas')}>Ver parcelas</button></div>}
          </div>}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h2>{deHoje.length ? '🕐 Hoje' : 'Últimos lançamentos'} <button className="lk" onClick={() => ir('lancamentos')}>Ver todos</button></h2>
        {recentes.length ? recentes.map(g => <LancSwipe key={g.id} g={g} />) : <div className="vazio">Nenhum lançamento ainda.</div>}
      </div>
    </>
  );
}
