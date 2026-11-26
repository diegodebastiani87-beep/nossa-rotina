import { useCallback, useEffect, useState } from 'react';
import { useCasa, type Status } from './data/store';
import { saudacao, usePrefs } from './data/preferencias';
import { DIAS_SEMANA, idxLongo, MESES_LONGOS } from './lib/datas';
import { Logo } from './ui/base';
import { Icone } from './ui/icones';
import { Inicio } from './telas/Inicio';
import { Lancamentos } from './telas/Lancamentos';
import { Lancar, type PresetLancar } from './telas/Lancar';
import { Analise } from './telas/Analise';
import { Faturas, type SubFatura } from './telas/Faturas';
import { Ajustes } from './telas/Ajustes';

type Tela = 'inicio' | 'lancamentos' | 'lancar' | 'analise' | 'faturas' | 'ajustes';
const TELAS: Record<Tela, { t: string; ic: string; mes: boolean }> = {
  inicio: { t: 'Início', ic: 'inicio', mes: false },
  lancamentos: { t: 'Lançamentos', ic: 'lista', mes: true },
  lancar: { t: 'Novo gasto', ic: 'mais', mes: false },
  analise: { t: 'Análise', ic: 'grafico', mes: true },
  faturas: { t: 'Faturas', ic: 'cartao', mes: false },
  ajustes: { t: 'Ajustes', ic: 'ajustes', mes: false }
};
const lerHash = (): Tela => { const h = location.hash.slice(1); return h in TELAS ? (h as Tela) : 'inicio'; };
const TXT_STATUS: Record<Status, string> = { online: 'Sincronizado', conectando: 'Conectando…', offline: 'Sem internet', erro: 'Erro de conexão' };

function StatusDot() {
  const { status } = useCasa();
  return (
    <span className={'status-dot ' + status} title={status === 'offline' ? 'Sem internet: o que você lançar fica guardado e sincroniza quando a conexão voltar.' : TXT_STATUS[status]}>
      {status === 'offline' ? <Icone nome="semNet" tam={18} /> : <i />}
    </span>
  );
}

/** Avatar de quem está usando; toque troca entre Diego e Eliane (vira a conta Google quando o login entrar). */
function Perfil({ compacto }: { compacto?: boolean }) {
  const { quem, setQuem } = usePrefs();
  const { hoje } = useCasa();
  return (
    <button className="perfil" onClick={() => setQuem(quem === 'Diego' ? 'Eliane' : 'Diego')} title="Trocar quem está usando">
      <span className={'av-g ' + (quem === 'Diego' ? 'd' : 'e')}>{quem[0]}</span>
      {!compacto && <span className="pf-t"><small>{saudacao(hoje)},</small><b>{quem}</b></span>}
    </button>
  );
}

export function App() {
  const { carregado, status, erro, hoje, faturaAtual } = useCasa();
  const { oculto, alternarOculto, quem } = usePrefs();
  const mesHoje = hoje.getFullYear() * 12 + hoje.getMonth();
  const [tela, setTela] = useState<Tela>(lerHash);
  const [mes, setMes] = useState(mesHoje);
  const [subFat, setSubFat] = useState<SubFatura>('faturas');
  const [mesFat, setMesFat] = useState<number | null>(null);
  const [fatAbertas, setFatAbertas] = useState<Set<string>>(new Set());
  const [preset, setPreset] = useState<{ p: PresetLancar; k: number }>({ p: null, k: 0 });

  useEffect(() => { const f = () => setTela(lerHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  const ir = useCallback((v: string) => {
    if (v === 'parcelas') { setSubFat('parcelas'); v = 'faturas'; } else if (v === 'faturas') setSubFat('faturas');
    if (v === 'lancar') setPreset(p => ({ p: null, k: p.k + 1 }));
    if (location.hash !== '#' + v) location.hash = v; else setTela(v as Tela);
    window.scrollTo({ top: 0 });
  }, []);
  const novo = (p: PresetLancar) => { setPreset(x => ({ p, k: x.k + 1 })); if (location.hash !== '#lancar') location.hash = 'lancar'; window.scrollTo({ top: 0 }); };
  const abrirFatura = (cartao: string, m: number) => { setMesFat(m); setFatAbertas(s => new Set([...s, m + '|' + cartao])); setSubFat('faturas'); ir('faturas'); };

  const info = TELAS[tela];
  const dataHoje = `${DIAS_SEMANA[hoje.getDay()]}, ${hoje.getDate()} de ${MESES_LONGOS[hoje.getMonth()]}`;
  const olho = <button className="iconbtn" onClick={alternarOculto} aria-label={oculto ? 'Mostrar valores' : 'Ocultar valores'} title={oculto ? 'Mostrar valores' : 'Ocultar valores'}><Icone nome={oculto ? 'olhoFechado' : 'olho'} tam={20} /></button>;

  return (
    <>
      <aside className="side" aria-label="Menu">
        <div className="brand"><Logo /><div><b>Lar em Dia</b><span>Diego &amp; Eliane</span></div></div>
        <button className="btn novo" onClick={() => novo(null)}><Icone nome="mais" tam={18} traco={2.4} /> Novo gasto</button>
        <nav>{(['inicio', 'lancamentos', 'analise', 'faturas', 'ajustes'] as Tela[]).map(t =>
          <button key={t} className={tela === t ? 'on' : ''} onClick={() => ir(t)}><Icone nome={TELAS[t].ic} tam={20} />{TELAS[t].t}</button>)}</nav>
        <div className="foot"><Perfil /><span className="side-st"><StatusDot />{TXT_STATUS[status]}</span></div>
      </aside>

      <header className="topbar">
<Perfil />
        <div className="top-r">
          {olho}
          <StatusDot />
          <button className={'iconbtn' + (tela === 'ajustes' ? ' on' : '')} onClick={() => ir('ajustes')} aria-label="Ajustes"><Icone nome="ajustes" tam={20} /></button>
        </div>
      </header>

      <div className="shell">
        <div className={'pagehead' + (tela === 'inicio' ? ' ph-inicio' : '')}>
          <div>
            <div className="eyebrow">{tela === 'inicio' ? dataHoje : 'Lar em Dia'}</div>
            <h1>{tela === 'inicio' ? `${saudacao(hoje)}, ${quem}` : info.t}</h1>
          </div>
          <div className="ph-r">
            <span className="ph-olho">{olho}</span>
            {info.mes && <div className="mespill">
              <button onClick={() => setMes(mes - 1)} aria-label="Mês anterior"><Icone nome="esq" tam={18} /></button>
              <span>{idxLongo(mes)}</span>
              <button onClick={() => setMes(mes + 1)} disabled={mes >= mesHoje} aria-label="Próximo mês"><Icone nome="dir" tam={18} /></button>
            </div>}
          </div>
        </div>

        {status === 'erro' && <div className="aviso dan" style={{ marginBottom: 14 }}>Não foi possível falar com o banco de dados: {erro}. Confira a internet e recarregue a página.</div>}
        {!carregado ? (
          <div className="carregando"><div className="logo-big"><Logo /></div><div>Carregando os lançamentos…</div></div>
        ) : <>
          {tela === 'inicio' && <Inicio mes={mes} setMes={setMes} ir={ir} novo={novo} abrirFatura={abrirFatura} />}
          {tela === 'lancamentos' && <Lancamentos mes={mes} />}
          {tela === 'lancar' && <Lancar key={preset.k} preset={preset.p} aoSalvar={() => { /* fica na tela para lançar o próximo */ }} />}
          {tela === 'analise' && <Analise mes={mes} setMes={setMes} />}
          {tela === 'faturas' && <Faturas sub={subFat} setSub={setSubFat} mes={mesFat ?? faturaAtual} setMes={setMesFat} abertas={fatAbertas}
            alternar={k => setFatAbertas(s => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; })} />}
          {tela === 'ajustes' && <Ajustes />}
        </>}
      </div>

      <nav className="bnav" aria-label="Navegação">
        {(['inicio', 'lancamentos'] as Tela[]).map(t => <button key={t} className={tela === t ? 'on' : ''} onClick={() => ir(t)}><span className="ic"><Icone nome={TELAS[t].ic} /></span>{TELAS[t].t}</button>)}
        <button className={'plus' + (tela === 'lancar' ? ' on' : '')} onClick={() => novo(null)} aria-label="Novo gasto"><span className="ic"><Icone nome="mais" tam={26} traco={2.4} /></span></button>
        {(['analise', 'faturas'] as Tela[]).map(t => <button key={t} className={tela === t ? 'on' : ''} onClick={() => ir(t)}><span className="ic"><Icone nome={TELAS[t].ic} /></span>{TELAS[t].t}</button>)}
      </nav>
    </>
  );
}
