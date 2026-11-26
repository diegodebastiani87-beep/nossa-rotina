import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Pessoa } from '../types';
import { usePessoaLogada } from './auth';

// Preferências deste aparelho (não vão para o Firestore). "quem" é sempre a pessoa da conta Google logada.
const LS_OCULTO = 'lar-em-dia:ocultar';
const ler = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const gravar = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };

interface Prefs { quem: Pessoa; oculto: boolean; alternarOculto: () => void }
const Ctx = createContext<Prefs | null>(null);
export const usePrefs = () => { const c = useContext(Ctx); if (!c) throw new Error('usePrefs fora do provider'); return c; };

export function PrefsProvider({ children }: { children: ReactNode }) {
  const quem = usePessoaLogada() ?? 'Diego';
  const [oculto, setOculto] = useState(() => ler(LS_OCULTO) === '1');
  useEffect(() => { document.documentElement.classList.toggle('oculto', oculto); }, [oculto]);
  const alternarOculto = () => setOculto(o => { gravar(LS_OCULTO, o ? '0' : '1'); return !o; });
  return <Ctx.Provider value={{ quem, oculto, alternarOculto }}>{children}</Ctx.Provider>;
}

export function saudacao(d: Date) {
  const h = d.getHours();
  return h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}
