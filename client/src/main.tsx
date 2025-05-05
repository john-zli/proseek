import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { ModalManager } from './components/modal_manager.tsx';
import { SessionProvider } from './contexts/session_context_provider.tsx';
import './index.less';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <ModalManager>
        <App />
      </ModalManager>
    </SessionProvider>
  </StrictMode>
);
