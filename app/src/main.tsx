import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { CasaProvider } from './data/store';
import { ToastProvider } from './ui/base';
import { AcoesProvider } from './telas/Acoes';
import { PrefsProvider } from './data/preferencias';
import '@fontsource-variable/inter';
import './styles.css';
import './visual.css';

// PWA: guarda o app para abrir sem internet e se atualiza sozinho quando houver versão nova
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <CasaProvider>
        <PrefsProvider>
          <AcoesProvider>
            <App />
          </AcoesProvider>
        </PrefsProvider>
      </CasaProvider>
    </ToastProvider>
  </StrictMode>
);
