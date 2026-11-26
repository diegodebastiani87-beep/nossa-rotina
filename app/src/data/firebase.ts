import { initializeApp } from 'firebase/app';
import { collection, doc, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Configuração web do Firebase: é pública por natureza (já está no app atual).
// Quem protege os dados são as regras do Firestore + o login, que entram na próxima etapa.
const firebaseConfig = {
  apiKey: 'AIzaSyA4p_kv3ttG5gEskMkCo7fTazcs6V9TP3g',
  authDomain: 'financas-casa-fd53a.firebaseapp.com',
  projectId: 'financas-casa-fd53a',
  storageBucket: 'financas-casa-fd53a.firebasestorage.app',
  messagingSenderId: '358498398037',
  appId: '1:358498398037:web:c7b4d160aa479fa56489dc'
};

/** Mesma casa do app original — os dois apps leem e gravam os mesmos documentos. */
export const CASA_ID = 'diego-eliane-2025-x7k9';

export const app = initializeApp(firebaseConfig);

// Cache local persistente: o app abre e lança sem internet e sincroniza quando a conexão volta.
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const refCasa = () => doc(db, 'casas', CASA_ID);
export const refGastos = () => collection(db, 'casas', CASA_ID, 'gastos');
