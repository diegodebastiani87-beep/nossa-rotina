import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { CasaProvider } from './data/store';
import { ToastProvider } from './ui/base';
import { AcoesProvider } from './telas/Acoes';
import { PrefsProvider } from './data/preferencias';
import { AuthProvider, useAuth } from './data/auth';
import { Entrar } from './telas/Entrar';
import '@fontsource-variable/inter';
import './styles.css';
import './visual.css';

// PWA: guarda o app para abrir sem internet e se atualiza sozinho quando houver versão nova
registerSW({ immediate: true });

/** Só carrega os dados da casa depois do login e da conta estar ligada a Diego ou Eliane. */
function Portao() {
  const { estado } = useAuth();
  if (estado.fase !== 'dentro') return <Entrar />;
  return (
    <CasaProvider>
      <PrefsProvider>
        <AcoesProvider>
          <App />
        </AcoesProvider>
      </PrefsProvider>
    </CasaProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <Portao />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>
);
