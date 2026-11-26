import { useMemo } from 'react';
import { useCasa } from '../data/store';
import { brl, fmtDiaMes, idxLongo, ymIdx } from '../lib/datas';
import { comprasParceladas } from '../lib/consultas';
import { ehCredito, ehReembolso, type Gasto } from '../types';
import { Seg } from '../ui/base';
import { useAcoes } from './Acoes';
import { Parcelas } from './Parcelas';

export type SubFatura = 'faturas' | 'parcelas';

export function Faturas({ sub, setSub, mes, setMes, abertas, alternar }: {
  sub: SubFatura; setSub: (s: SubFatura) => void; mes: number; setMes: (m: number) => void; abertas: Set<string>; alternar: (k: string) => void;
}) {
  const { gastos, cartoes, faturaAtual } = useCasa();
  const acoes = useAcoes();
  const nParc = useMemo(() => comprasParceladas(gastos, faturaAtual).filter(c => c.ativa).length, [gastos, faturaAtual]);
  const doMes = useMemo(() => gastos.filter(g => ehCredito(g) && ymIdx(g.mesFatura || g.data.slice(0, 7)) === mes), [gastos, mes]);
  const vl = (g: Gasto) => ehReembolso(g) ? -g.valor : g.valor;
  // cartões cadastrados + algum nome antigo que ainda tenha lançamento neste mês
  const nomes = [...new Set([...cartoes.map(c => c.nome), ...doMes.map(g => g.cartao || '(sem cartão)')])];

  return (
    <>
      <Seg valor={sub} onChange={setSub} opcoes={[['faturas', '💳 Faturas'], ['parcelas', <span key="p">🔁 Parcelas <span className="cnt">{nParc}</span></span>]]} />
      {sub === 'parcelas' ? <Parcelas /> : (
        <>
          <div className="card fat-mes">
            <div><div className="note">Mês de vencimento</div><b style={{ fontSize: '1.1em', textTransform: 'capitalize' }}>{idxLongo(mes)}</b></div>
            <div className="mespill" style={{ boxShadow: 'none', background: 'var(--surface-2)' }}>
              <button onClick={() => setMes(mes - 1)} aria-label="Mês anterior">‹</button>
              <button onClick={() => setMes(faturaAtual)} style={{ width: 'auto', padding: '0 12px', borderRadius: 99, fontSize: '.8em' }}>Hoje</button>
              <button onClick={() => setMes(mes + 1)} aria-label="Próximo mês">›</button>
            </div>
          </div>
          {nomes.map(nome => {
            const c = cartoes.find(x => x.nome === nome);
            const ls = doMes.filter(g => (g.cartao || '(sem cartão)') === nome).sort((a, b) => b.data.localeCompare(a.data));
            if (!c && !ls.length) return null;
            const k = mes + '|' + nome, ab = abertas.has(k);
            const tot = ls.reduce((s, g) => s + vl(g), 0), re = ls.filter(ehReembolso).reduce((s, g) => s + g.valor, 0);
            const st = mes < faturaAtual ? 'Paga' : mes === faturaAtual ? 'Aberta' : 'Futura';
            return (
              <div key={nome} className={'fcard' + (ab ? ' open' : '')}>
                <button className="fcard-h" aria-expanded={ab} onClick={() => ls.length && alternar(k)}>
                  <div className="top"><div><div className="nm">💳 {nome}</div><div className="dt">{c ? `Fecha dia ${c.fechamento} · vence dia ${c.vencimento}` : 'Cartão não cadastrado'}</div></div><span className="st">{st}</span></div>
                  <div className="k">Total da fatura</div><div className="v num">{brl(tot)}</div>
                  {re > 0 && <div className="rb">↩️ Estornos −{brl(re)}</div>}
                  <div className="tg"><i>▶</i>{ls.length ? (ab ? 'Toque para fechar' : `Toque para ver os ${ls.length} lançamentos`) : 'Sem lançamentos'}</div>
                </button>
                {ab && ls.length > 0 && (
                  <div className="fcard-b">
                    <div className="fsub">
                      <span>👨 Diego<b className="num">{brl(ls.filter(g => g.usuario === 'Diego').reduce((s, g) => s + vl(g), 0))}</b></span>
                      <span>👩 Eliane<b className="num">{brl(ls.filter(g => g.usuario === 'Eliane').reduce((s, g) => s + vl(g), 0))}</b></span>
                      <span>📄 {ls.length} lançamentos</span>
                    </div>
                    {ls.map(g => (
                      <button key={g.id} className="fl" onClick={() => acoes.detalhe(g.id)}>
                        <span className="d">{fmtDiaMes(g.data)}</span>
                        <span style={{ minWidth: 0 }}>{ehReembolso(g) ? '↩️ ' : ''}{g.descricao} {g.parcelaTotal ? <span className={'pp' + (g.antecipada ? ' ant' : '')}>{g.parcelaAtual}/{g.parcelaTotal}{g.antecipada ? ' antecipada' : ''}</span> : null}
                          <span className="s"><span className={'who ' + (g.usuario === 'Diego' ? 'd' : 'e')} /> {g.usuario}{g.observacao ? ` · ${g.observacao}` : ''}{g.ajusteFatura ? ' · fatura ajustada' : ''}</span></span>
                        <b className="num" style={ehReembolso(g) ? { color: 'var(--success)' } : undefined}>{ehReembolso(g) ? '−' : ''}{brl(g.valor)}</b>
                      </button>
                    ))}
                    <div className="ffoot"><span>Total</span><span className="num">{brl(tot)}</span></div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
