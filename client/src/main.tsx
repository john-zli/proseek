import App from '@client/App.tsx';
import { SessionProvider } from '@client/contexts/session_context_provider.tsx';
import '@client/index.less';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <App />
    </SessionProvider>
  </StrictMode>
);
