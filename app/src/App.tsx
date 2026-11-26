import { useCallback, useEffect, useState } from 'react';
import { useCasa, type Status } from './data/store';
import { DIAS_SEMANA, idxLongo, MESES_LONGOS } from './lib/datas';
import { Logo } from './ui/base';
import { Inicio } from './telas/Inicio';
import { Lancamentos } from './telas/Lancamentos';
import { Lancar } from './telas/Lancar';
import { Analise } from './telas/Analise';
import { Faturas, type SubFatura } from './telas/Faturas';
import { Ajustes } from './telas/Ajustes';

type Tela = 'inicio' | 'lancamentos' | 'lancar' | 'analise' | 'faturas' | 'ajustes';
const TELAS: Record<Tela, { t: string; ic: string; mes: boolean }> = {
  inicio: { t: 'Início', ic: '🏠', mes: true },
  lancamentos: { t: 'Lançamentos', ic: '🧾', mes: true },
  lancar: { t: 'Novo gasto', ic: '＋', mes: false },
  analise: { t: 'Análise', ic: '📊', mes: true },
  faturas: { t: 'Faturas', ic: '💳', mes: false },
  ajustes: { t: 'Ajustes', ic: '⚙️', mes: false }
};
const lerHash = (): Tela => { const h = location.hash.slice(1); return h in TELAS ? (h as Tela) : 'inicio'; };
const TXT_STATUS: Record<Status, string> = { online: 'ao vivo', conectando: 'conectando', offline: 'sem internet', erro: 'erro' };

function Sync({ longo }: { longo?: boolean }) {
  const { status } = useCasa();
  return (
    <div className="sync" title={status === 'offline' ? 'Sem internet: o que você lançar fica guardado e sincroniza quando a conexão voltar.' : 'Os dois veem os mesmos dados em tempo real'}>
      <span className="av d">D</span><span className="av e">E</span><span className={'pt ' + status} />
      <span className="txt">{longo && status === 'online' ? 'Sincronizado · ao vivo' : TXT_STATUS[status]}</span>
    </div>
  );
}

export function App() {
  const { carregado, status, erro, hoje, faturaAtual } = useCasa();
  const mesHoje = hoje.getFullYear() * 12 + hoje.getMonth();
  const [tela, setTela] = useState<Tela>(lerHash);
  const [mes, setMes] = useState(mesHoje);
  const [subFat, setSubFat] = useState<SubFatura>('faturas');
  const [mesFat, setMesFat] = useState<number | null>(null);
  const [fatAbertas, setFatAbertas] = useState<Set<string>>(new Set());

  useEffect(() => { const f = () => setTela(lerHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  const ir = useCallback((v: string) => {
    if (v === 'parcelas') { setSubFat('parcelas'); v = 'faturas'; } else if (v === 'faturas') setSubFat('faturas');
    if (location.hash !== '#' + v) location.hash = v; else setTela(v as Tela);
    window.scrollTo({ top: 0 });
  }, []);
  const abrirFatura = (cartao: string, m: number) => { setMesFat(m); setFatAbertas(s => new Set([...s, m + '|' + cartao])); setSubFat('faturas'); ir('faturas'); };

  const info = TELAS[tela];
  const eyebrow = tela === 'inicio' ? `${DIAS_SEMANA[hoje.getDay()]}, ${hoje.getDate()} de ${MESES_LONGOS[hoje.getMonth()]}` : 'Lar em Dia';

  return (
    <>
      <aside className="side" aria-label="Menu">
        <div className="brand"><Logo /><div><b>Lar em Dia</b><span>Diego &amp; Eliane</span></div></div>
        <button className="btn novo" onClick={() => ir('lancar')}>＋ Novo gasto</button>
        <nav>{(['inicio', 'lancamentos', 'analise', 'faturas', 'ajustes'] as Tela[]).map(t =>
          <button key={t} className={tela === t ? 'on' : ''} onClick={() => ir(t)}><span className="ic">{TELAS[t].ic}</span>{TELAS[t].t}</button>)}</nav>
        <div className="foot"><Sync longo /></div>
      </aside>

      <header className="topbar">
        <div className="brand"><Logo /><div><b>Lar em Dia</b><span>Diego &amp; Eliane</span></div></div>
        <div className="top-r"><Sync /><button className={'iconbtn' + (tela === 'ajustes' ? ' on' : '')} onClick={() => ir('ajustes')} aria-label="Ajustes">⚙️</button></div>
      </header>

      <div className="shell">
        <div className="pagehead">
          <div><div className="eyebrow">{eyebrow}</div><h1>{info.t}</h1></div>
          {info.mes && <div className="mespill">
            <button onClick={() => setMes(mes - 1)} aria-label="Mês anterior">‹</button>
            <span>{idxLongo(mes)}</span>
            <button onClick={() => setMes(mes + 1)} disabled={mes >= mesHoje} aria-label="Próximo mês">›</button>
          </div>}
        </div>

        {status === 'erro' && <div className="aviso dan" style={{ marginBottom: 14 }}>Não foi possível falar com o banco de dados: {erro}. Confira a internet e recarregue a página.</div>}
        {!carregado ? (
          <div className="carregando"><div className="logo-big"><Logo /></div><div>Carregando os lançamentos…</div></div>
        ) : <>
          {tela === 'inicio' && <Inicio mes={mes} ir={ir} abrirFatura={abrirFatura} />}
          {tela === 'lancamentos' && <Lancamentos mes={mes} />}
          {tela === 'lancar' && <Lancar aoSalvar={() => { /* fica na tela para lançar o próximo, como no app atual */ }} />}
          {tela === 'analise' && <Analise mes={mes} setMes={setMes} />}
          {tela === 'faturas' && <Faturas sub={subFat} setSub={setSubFat} mes={mesFat ?? faturaAtual} setMes={setMesFat} abertas={fatAbertas}
            alternar={k => setFatAbertas(s => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; })} />}
          {tela === 'ajustes' && <Ajustes />}
        </>}
      </div>

      <nav className="bnav" aria-label="Navegação">
        <button className={tela === 'inicio' ? 'on' : ''} onClick={() => ir('inicio')}><span className="ic">🏠</span>Início</button>
        <button className={tela === 'lancamentos' ? 'on' : ''} onClick={() => ir('lancamentos')}><span className="ic">🧾</span>Lançamentos</button>
        <button className={'plus' + (tela === 'lancar' ? ' on' : '')} onClick={() => ir('lancar')} aria-label="Novo gasto"><span className="ic">+</span></button>
        <button className={tela === 'analise' ? 'on' : ''} onClick={() => ir('analise')}><span className="ic">📊</span>Análise</button>
        <button className={tela === 'faturas' ? 'on' : ''} onClick={() => ir('faturas')}><span className="ic">💳</span>Faturas</button>
      </nav>
    </>
  );
}
