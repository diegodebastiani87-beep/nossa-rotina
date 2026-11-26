import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Pessoa } from '../types';

// Preferências deste aparelho (não vão para o Firestore): quem está usando e se os valores ficam ocultos.
// "Quem" vira o dono da conta quando o login Google entrar.
const LS_QUEM = 'lar-em-dia:quem', LS_OCULTO = 'lar-em-dia:ocultar';
const ler = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const gravar = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };

interface Prefs { quem: Pessoa; setQuem: (p: Pessoa) => void; oculto: boolean; alternarOculto: () => void }
const Ctx = createContext<Prefs | null>(null);
export const usePrefs = () => { const c = useContext(Ctx); if (!c) throw new Error('usePrefs fora do provider'); return c; };

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [quem, setQuemS] = useState<Pessoa>(() => (ler(LS_QUEM) === 'Eliane' ? 'Eliane' : 'Diego'));
  const [oculto, setOculto] = useState(() => ler(LS_OCULTO) === '1');
  useEffect(() => { document.documentElement.classList.toggle('oculto', oculto); }, [oculto]);
  const setQuem = (p: Pessoa) => { setQuemS(p); gravar(LS_QUEM, p); };
  const alternarOculto = () => setOculto(o => { gravar(LS_OCULTO, o ? '0' : '1'); return !o; });
  return <Ctx.Provider value={{ quem, setQuem, oculto, alternarOculto }}>{children}</Ctx.Provider>;
}

export function saudacao(d: Date) {
  const h = d.getHours();
  return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}
