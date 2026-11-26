import { useMemo, type ReactNode } from 'react';
import { useCasa } from '../data/store';
import { brl, DIAS_SEMANA, diasNoMes, hojeISO, idxCurto, idxLongo, idxYm, isoLocal, mesDe, MESES, nomeMes, ymIdx } from '../lib/datas';
import { comprasParceladas, itensDoMes, soma, somaDe, type Item } from '../lib/consultas';
import { ehCredito, ehReembolso, type Gasto } from '../types';
import { estiloCartao, Icone, IconeCategoria } from '../ui/icones';
import { corDa, LancSwipe } from './LancRow';
import type { PresetLancar } from './Lancar';

const momento = (g: Gasto) => {
  const c = g.criadoEm as { toMillis?: () => number; seconds?: number } | undefined;
  if (c?.toMillis) return c.toMillis();
  if (typeof c?.seconds === 'number') return c.seconds * 1000;
  return new Date(g.data + 'T00:00:00').getTime();
};

function Secao({ titulo, acao, onAcao, children }: { titulo: string; acao?: string; onAcao?: () => void; children: ReactNode }) {
  return (
    <section className="h-sec">
      <div className="h-sec-t"><h2>{titulo}</h2>{acao && <button onClick={onAcao}>{acao}<Icone nome="dir" tam={16} /></button>}</div>
      {children}
    </section>
  );
}

/** Acumulado do mês dia a dia (compras de antes do dia 1 que caíram neste mês entram no dia 1). */
function acumulado(xs: Item[], mes: number, ateDia: number) {
  const porDia = new Array(ateDia + 1).fill(0);
  for (const x of xs) { const d = mesDe(x.data) < mes ? 1 : Math.min(Number(x.data.slice(8, 10)), ateDia); porDia[d] += x.v; }
  let s = 0; return porDia.map(v => (s += v));
}

export function Inicio({ mes, setMes, ir, novo, abrirFatura }: {
  mes: number; setMes: (m: number) => void; ir: (v: string) => void; novo: (p: PresetLancar) => void; abrirFatura: (cartao: string, mes: number) => void;
}) {
  const { gastos, categorias, cartoes, faturaAtual, hoje } = useCasa();
  const mesHoje = hoje.getFullYear() * 12 + hoje.getMonth();
  const corrente = mes === mesHoje;
  const dia = corrente ? hoje.getDate() : null;
  const hojeIso = hojeISO();

  // Regra do app original: o que pesa NESTE mês pelo mês da fatura, só compras feitas até hoje;
  // o mês anterior é cortado no mesmo dia para a comparação ser justa.
  const at = useMemo(() => itensDoMes(gastos, mes, 'fatura').filter(x => x.data <= hojeIso), [gastos, mes, hojeIso]);
  const anTodo = useMemo(() => itensDoMes(gastos, mes - 1, 'fatura'), [gastos, mes]);
  const an = useMemo(() => {
    const limite = `${idxYm(mes - 1)}-${String(Math.min(dia ?? 31, diasNoMes(mes - 1))).padStart(2, '0')}`;
    return anTodo.filter(x => x.data <= limite);
  }, [anTodo, mes, dia]);
  const tot = soma(at), tAn = soma(an), d = somaDe(at, 'Diego'), e = somaDe(at, 'Eliane');
  const pct = tAn ? (tot - tAn) / tAn * 100 : null;

  // gráfico: ritmo das COMPRAS feitas no mês (pela data da compra), acumulado dia a dia × mês anterior.
  // (O valor grande acima inclui a fatura de compras do mês passado, que entraria toda no dia 1 e achataria o gráfico.)
  const compA = useMemo(() => itensDoMes(gastos, mes, 'compra').filter(x => x.data <= hojeIso), [gastos, mes, hojeIso]);
  const compB = useMemo(() => itensDoMes(gastos, mes - 1, 'compra'), [gastos, mes]);
  const nDias = diasNoMes(mes), ate = dia ?? nDias;
  const curA = acumulado(compA, mes, ate), curB = acumulado(compB, mes - 1, diasNoMes(mes - 1));
  const maxY = Math.max(1, curA[ate], curB[curB.length - 1]);
  const W = 300, H = 72;
  const px = (i: number) => ((i - 1) / Math.max(1, nDias - 1)) * W, py = (v: number) => H - (v / maxY) * (H - 6) - 3;
  const linha = (c: number[], ultimo: number) => c.slice(1, ultimo + 1).map((v, i) => `${i ? 'L' : 'M'}${px(i + 1).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
  const pA = linha(curA, ate), pB = linha(curB, Math.min(nDias, curB.length - 1));

  // categorias (rosca)
  const porCat = new Map<string, number>();
  at.forEach(x => porCat.set(x.categoria || 'Outros', (porCat.get(x.categoria || 'Outros') ?? 0) + x.v));
  const ordem = [...porCat.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const top: [string, number][] = ordem.slice(0, 5);
  const resto = ordem.slice(5).reduce((s, [, v]) => s + v, 0);
  if (resto > 0) top.push(['Outras', resto]);
  const totPos = top.reduce((s, [, v]) => s + v, 0) || 1;
  let ang = 0;
  const R = 46, C = 2 * Math.PI * R;
  const arcos = top.map(([c, v]) => { const frac = v / totPos, a = { c, v, ini: ang, frac }; ang += frac; return a; });

  // faturas: próximas 4 com valor, a partir do mês corrente (regra original)
  const fats = new Map<string, { mes: number; cartao: string; total: number; n: number }>();
  for (const g of gastos) {
    if (!ehCredito(g) || !g.mesFatura) continue;
    const m = ymIdx(g.mesFatura); if (m < mesHoje || m > mesHoje + 3) continue;
    const k = m + '|' + (g.cartao || '(sem cartão)');
    const f = fats.get(k) ?? { mes: m, cartao: g.cartao || '(sem cartão)', total: 0, n: 0 };
    f.total += ehReembolso(g) ? -g.valor : g.valor; f.n++; fats.set(k, f);
  }
  const proxFaturas = [...fats.values()].filter(f => f.total > 0).sort((a, b) => a.mes - b.mes || a.cartao.localeCompare(b.cartao)).slice(0, 4);

  // parcelas
  const ativas = comprasParceladas(gastos, faturaAtual).filter(c => c.ativa);
  const naFatura = ativas.reduce((s, c) => s + (c.atual?.valor ?? 0), 0);
  const terminando = [...ativas].sort((a, b) => a.ultimoMes - b.ultimoMes).slice(0, 3);

  // semana (como no app atual: pela data da compra)
  const dias = Array.from({ length: 7 }, (_, i) => { const dt = new Date(hoje); dt.setDate(dt.getDate() - 6 + i); return isoLocal(dt); });
  const porDia = dias.map(iso => soma(itensDoMes(gastos, mesDe(iso), 'compra').filter(x => x.data === iso)));
  const maxDia = Math.max(1, ...porDia);

  // últimos lançamentos
  const deHoje = gastos.filter(g => g.data === hojeIso && !(g.parcelaAtual && g.parcelaAtual > 1));
  const vistos = new Set<string>();
  const recentes = (deHoje.length ? deHoje : [...gastos].sort((a, b) => momento(b) - momento(a)))
    .filter(g => { if (!g.grupoId || !g.parcelaTotal) return true; if (vistos.has(g.grupoId)) return false; vistos.add(g.grupoId); return true; })
    .slice(0, deHoje.length ? 20 : 6)
    .map<Item>(g => ({ ...g, v: g.parcelaTotal ? (g.valorTotalCompra ?? g.valor) : ehReembolso(g) ? -g.valor : g.valor, colapsado: !!g.parcelaTotal }));

  return (
    <div className="home">
      <div className="home-a">
        {/* resumo do mês */}
        <div className="resumo-card">
          <div className="rc-top">
            <div className="rc-mes">
              <button onClick={() => setMes(mes - 1)} aria-label="Mês anterior"><Icone nome="esq" tam={18} /></button>
              <span>{idxLongo(mes)}</span>
              <button onClick={() => setMes(mes + 1)} disabled={corrente} aria-label="Próximo mês"><Icone nome="dir" tam={18} /></button>
            </div>
            <span className="rc-qtd">{at.length} lançamentos</span>
          </div>
          <div className="rc-k">{corrente ? 'Gasto no mês até agora' : `Gasto em ${nomeMes(mes)}`}</div>
          <div className="rc-v num">{brl(tot)}</div>
          {pct !== null
            ? <span className={'rc-cmp ' + (pct > 0 ? 'up' : 'down')}><Icone nome={pct > 0 ? 'sobe' : 'desce'} tam={14} traco={2.4} />{Math.abs(pct).toFixed(0)}% vs {corrente ? `mesmo dia de ${nomeMes(mes - 1)}` : nomeMes(mes - 1)}</span>
            : <span className="rc-cmp">Sem dados do mês anterior</span>}
          <svg className="rc-graf" viewBox={`0 -2 ${W} ${H + 4}`} preserveAspectRatio="none" aria-label={`Acumulado de ${nomeMes(mes)} comparado com ${nomeMes(mes - 1)}`}>
            {pB && <path d={pB} className="l-ant" />}
            {pA && <path d={`${pA} L${px(ate).toFixed(1)},${H} L0,${H} Z`} className="a-atual" />}
            {pA && <path d={pA} className="l-atual" />}
            {pA && <circle cx={px(ate)} cy={py(curA[ate])} r="3.5" className="p-atual" />}
          </svg>
          <div className="rc-leg"><span className="rc-leg-t">Ritmo de compras</span><span><i className="l1" />{nomeMes(mes)} <b className="num">{brl(curA[ate])}</b></span><span><i className="l2" />{nomeMes(mes - 1)} <b className="num">{brl(soma(compB))}</b></span></div>
          <div className="rc-pessoas">
            {([['Diego', d, 'd'], ['Eliane', e, 'e']] as const).map(([p, v, c]) => (
              <div key={p}><span className={'av ' + c}>{p[0]}</span><div><small>{p} · {tot > 0 ? Math.round(Math.max(0, v) / tot * 100) : 0}%</small><b className="num">{brl(v)}</b></div></div>
            ))}
          </div>
        </div>

        {/* atalhos */}
        <div className="atalhos-h">
          <button onClick={() => novo(null)}><span><Icone nome="mais" /></span>Novo gasto</button>
          <button onClick={() => novo('parcelado')}><span><Icone nome="parcelas" /></span>Parcelado</button>
          <button onClick={() => novo('estorno')}><span><Icone nome="estorno" /></span>Estorno</button>
          <button onClick={() => ir('parcelas')}><span><Icone nome="calendario" /></span>Parcelas</button>
        </div>

        <Secao titulo="Faturas" acao="Ver todas" onAcao={() => ir('faturas')}>
          <div className="cards-h">
            {proxFaturas.length ? proxFaturas.map(f => {
              const c = cartoes.find(x => x.nome === f.cartao), s = estiloCartao(f.cartao);
              const aberta = f.mes >= faturaAtual;
              return (
                <button key={f.mes + f.cartao} className="cc" style={{ ['--a' as string]: s.a, ['--b' as string]: s.b }} onClick={() => abrirFatura(f.cartao, f.mes)}>
                  <div className="cc-top"><b>{f.cartao}</b><span className="cc-chip" /></div>
                  <div className="cc-k">Fatura de {MESES[f.mes % 12]}{aberta ? '' : ' · fechada'}</div>
                  <div className="cc-v num">{brl(f.total)}</div>
                  <div className="cc-bot"><span>{c ? `Vence ${String(c.vencimento).padStart(2, '0')}/${String((f.mes % 12) + 1).padStart(2, '0')}` : idxCurto(f.mes)}</span><span>{f.n} itens</span></div>
                </button>
              );
            }) : <div className="vazio-h">Nenhuma fatura futura com valor.</div>}
          </div>
        </Secao>

        <Secao titulo="Últimos lançamentos" acao="Ver todos" onAcao={() => ir('lancamentos')}>
          <div className="lista-card">
            {deHoje.length > 0 && <div className="mini-k">Hoje</div>}
            {recentes.length ? recentes.map(g => <LancSwipe key={g.id} g={g} />) : <div className="vazio">Nenhum lançamento ainda.</div>}
          </div>
        </Secao>
      </div>

      <div className="home-b">
        <Secao titulo="Onde foi o dinheiro" acao="Análise" onAcao={() => ir('analise')}>
          <div className="painel donut-card">
            {top.length ? <>
              <div className="donut">
                <svg viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r={R} className="donut-fundo" />
                  {arcos.map(a => <circle key={a.c} cx="60" cy="60" r={R} className="cat-c" fill="none" stroke={a.c === 'Outras' ? 'var(--text-muted)' : corDa(categorias, a.c)}
                    strokeWidth="14" strokeDasharray={`${Math.max(0, a.frac * C - 2)} ${C}`} strokeDashoffset={-a.ini * C} transform="rotate(-90 60 60)" />)}
                </svg>
                <div className="donut-c"><small>Total</small><b className="num">{brl(tot)}</b></div>
              </div>
              <div className="donut-leg">
                {top.map(([c, v]) => (
                  <div key={c}>
                    {c === 'Outras' ? <span className="cat-ic" style={{ width: 30, height: 30, ['--c' as string]: 'var(--text-muted)' }}><Icone nome="pontos" tam={15} /></span> : <IconeCategoria nome={c} cor={corDa(categorias, c)} tam={30} />}
                    <span className="dl-n">{c}<small className="num">{Math.round(v / totPos * 100)}%</small></span><b className="num">{brl(v)}</b>
                  </div>
                ))}
              </div>
            </> : <div className="vazio">Nenhum gasto neste mês.</div>}
          </div>
        </Secao>

        {ativas.length > 0 && (
          <Secao titulo="Parcelas" acao="Ver todas" onAcao={() => ir('parcelas')}>
            <button className="painel parc-card" onClick={() => ir('parcelas')}>
              <div className="pc-top">
                <span className="pc-ic"><Icone nome="parcelas" /></span>
                <div><small>Na fatura de {idxCurto(faturaAtual)}</small><b className="num">{brl(naFatura)}</b></div>
                <div className="pc-r"><small>Restam</small><b className="num">{brl(ativas.reduce((s, c) => s + c.falta, 0))}</b></div>
              </div>
              {terminando.map(c => { const an = c.atual?.parcelaAtual ?? c.pagas + 1;
                return <div key={c.grupoId} className="pc-row"><div className="pc-n"><span>{c.descricao}</span><em className="num">{an}/{c.n}</em></div>
                  <span className="bar"><i style={{ width: `${an / c.n * 100}%` }} /></span><small>termina {idxCurto(c.ultimoMes)} · {brl(c.valorParcela)}/mês</small></div>; })}
            </button>
          </Secao>
        )}

        <Secao titulo="Últimos 7 dias">
          <div className="painel">
            <div className="semana2">
              {dias.map((iso, i) => (
                <div key={iso} className={'d' + (iso === hojeIso ? ' hoje' : '')} title={`${iso.split('-').reverse().join('/')}: ${brl(porDia[i])}`}>
                  <div className="d-bar"><i style={{ height: `${Math.max(porDia[i] > 0 ? 4 : 0, porDia[i] / maxDia * 100)}%` }} /></div>
                  <span>{iso === hojeIso ? 'hoje' : DIAS_SEMANA[new Date(iso + 'T12:00').getDay()]}</span>
                </div>
              ))}
            </div>
            <div className="sem-tot"><span>Total da semana</span><b className="num">{brl(porDia.reduce((s, v) => s + v, 0))}</b></div>
          </div>
        </Secao>
      </div>
    </div>
  );
}
