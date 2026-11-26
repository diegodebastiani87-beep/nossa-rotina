import { useMemo } from 'react';
import { useCasa } from '../data/store';
import { brl, fmtDiaMes, idxLongo, ymIdx } from '../lib/datas';
import { comprasParceladas } from '../lib/consultas';
import { ehCredito, ehReembolso, type Gasto } from '../types';
import { Seg } from '../ui/base';
import { varsCartao, Icone, PessoaRot, Rot } from '../ui/icones';
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
      <Seg valor={sub} onChange={setSub} opcoes={[['faturas', <Rot key="f" ic="cartao">Faturas</Rot>], ['parcelas', <Rot key="p" ic="parcelas">Parcelas <span className="cnt">{nParc}</span></Rot>]]} />
      {sub === 'parcelas' ? <Parcelas /> : (
        <>
          <div className="card fat-mes">
            <div><div className="note">Mês de vencimento</div><b style={{ fontSize: '1.1em', textTransform: 'capitalize' }}>{idxLongo(mes)}</b></div>
            <div className="mespill" style={{ boxShadow: 'none', background: 'var(--surface-2)' }}>
              <button onClick={() => setMes(mes - 1)} aria-label="Mês anterior"><Icone nome="esq" tam={18} /></button>
              <button onClick={() => setMes(faturaAtual)} style={{ width: 'auto', padding: '0 12px', borderRadius: 99, fontSize: '.8em' }}>Hoje</button>
              <button onClick={() => setMes(mes + 1)} aria-label="Próximo mês"><Icone nome="dir" tam={18} /></button>
            </div>
          </div>
          {nomes.map(nome => {
            const c = cartoes.find(x => x.nome === nome);
            const ls = doMes.filter(g => (g.cartao || '(sem cartão)') === nome).sort((a, b) => b.data.localeCompare(a.data));
            if (!c && !ls.length) return null;
            const k = mes + '|' + nome, ab = abertas.has(k);
            const tot = ls.reduce((s, g) => s + vl(g), 0), re = ls.filter(ehReembolso).reduce((s, g) => s + g.valor, 0);
            const st = mes < faturaAtual ? 'Paga' : mes === faturaAtual ? 'Aberta' : 'Futura';
            const cor = varsCartao(nome, c?.banco);
            const venc = c ? `${String(c.vencimento).padStart(2, '0')}/${String((mes % 12) + 1).padStart(2, '0')}` : '';
            return (
              <div key={nome} className={'fcard' + (ab ? ' open' : '')}>
                {/* mesmo padrão de cartão de banco da tela inicial */}
                <button className="fcard-h cc-big" style={cor} aria-expanded={ab} onClick={() => ls.length && alternar(k)}>
                  <div className="cc-top"><b>{nome}</b><span className="cc-st">{st}</span></div>
                  <span className="cc-chip" />
                  <div className="cc-k">Total da fatura</div>
                  <div className="cc-v num">{brl(tot)}</div>
                  {re > 0 && <div className="cc-re"><Icone nome="estorno" tam={13} traco={2.2} /> Estornos −{brl(re)}</div>}
                  <div className="cc-bot">
                    <span>{c ? `Fecha dia ${c.fechamento} · vence ${venc}` : 'Cartão não cadastrado'}</span>
                    <span className="cc-tg">{ls.length ? <>{ls.length} itens <Icone nome="dir" tam={15} traco={2.2} /></> : 'Sem lançamentos'}</span>
                  </div>
                </button>
                {ab && ls.length > 0 && (
                  <div className="fcard-b">
                    <div className="fsub">
                      <span><PessoaRot p="Diego" tam={18} /><b className="num">{brl(ls.filter(g => g.usuario === 'Diego').reduce((s, g) => s + vl(g), 0))}</b></span>
                      <span><PessoaRot p="Eliane" tam={18} /><b className="num">{brl(ls.filter(g => g.usuario === 'Eliane').reduce((s, g) => s + vl(g), 0))}</b></span>
                      <span><Rot ic="documento" tam={15}>{ls.length} lançamentos</Rot></span>
                    </div>
                    {ls.map(g => (
                      <button key={g.id} className="fl" onClick={() => acoes.detalhe(g.id)}>
                        <span className="d">{fmtDiaMes(g.data)}</span>
                        <span style={{ minWidth: 0 }}>{ehReembolso(g) && <span className="ic-in ok"><Icone nome="estorno" tam={14} /></span>}{g.descricao} {g.parcelaTotal ? <span className={'pp' + (g.antecipada ? ' ant' : '')}>{g.parcelaAtual}/{g.parcelaTotal}{g.antecipada ? ' antecipada' : ''}</span> : null}
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
