import App from '@client/App.tsx';
import { ModalManager } from '@client/components/modal_manager.tsx';
import { SessionProvider } from '@client/contexts/session_context_provider.tsx';
import '@client/index.less';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <ModalManager>
        <App />
      </ModalManager>
    </SessionProvider>
  </StrictMode>
);
