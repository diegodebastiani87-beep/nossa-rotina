import { useState } from 'react';
import { useAuth } from '../data/auth';
import type { Pessoa } from '../types';
import { Logo } from '../ui/base';
import { Icone } from '../ui/icones';

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Telas antes do app: entrar com Google, dizer quem é (primeiro acesso) ou conta não autorizada. */
export function Entrar() {
  const { estado, entrar, sair, sou, erro } = useAuth();
  const [ocupado, setOcupado] = useState(false);
  const fazer = async (f: () => Promise<void>) => { setOcupado(true); try { await f(); } finally { setOcupado(false); } };

  return (
    <div className="entrar">
      <div className="entrar-box">
        <div className="entrar-logo"><Logo /></div>
        <h1>Lar em Dia</h1>
        <p className="entrar-sub">Finanças da casa de Diego &amp; Eliane</p>

        {estado.fase === 'carregando' && <p className="note">Carregando…</p>}

        {estado.fase === 'fora' && <>
          <button className="btn-google" disabled={ocupado} onClick={() => fazer(entrar)}><GoogleG /> Entrar com Google</button>
          <p className="note">Use a sua conta Google. Só as contas de vocês dois têm acesso.</p>
        </>}

        {estado.fase === 'escolher' && <>
          <p className="entrar-msg">Primeiro acesso com <b>{estado.user.email}</b>. Quem é você?</p>
          <div className="entrar-quem">
            {(['Diego', 'Eliane'] as Pessoa[]).map(p => (
              <button key={p} disabled={ocupado || !estado.livres.includes(p)} onClick={() => fazer(() => sou(p))}>
                <span className={'av-g ' + (p === 'Diego' ? 'd' : 'e')}>{p[0]}</span>{p}
                {!estado.livres.includes(p) && <small>já tem conta</small>}
              </button>
            ))}
          </div>
          <p className="note">Isso liga esta conta Google à pessoa escolhida. Os lançamentos que você fizer vêm marcados com o seu nome.</p>
          <button className="linkbtn" onClick={() => fazer(sair)}>Usar outra conta</button>
        </>}

        {estado.fase === 'negado' && <>
          <div className="aviso warn"><Icone nome="alerta" tam={18} /> A conta <b>{estado.user.email}</b> não tem acesso a esta casa.</div>
          <button className="btn sec2" onClick={() => fazer(sair)}>Entrar com outra conta</button>
        </>}

        {erro && <div className="aviso dan" style={{ marginTop: 12 }}>{erro}</div>}
      </div>
    </div>
  );
}
