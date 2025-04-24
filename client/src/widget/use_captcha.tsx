import { useCallback, useEffect, useRef } from 'react';

export function useCaptcha() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const capInstanceRef = useRef<any>(null); // Store the Cap instance

  useEffect(() => {
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="https://cdn.jsdelivr.net/npm/@cap.js/widget"]`);
        if (existingScript) return resolve(); // Already loaded

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@cap.js/widget';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Cap widget script'));
        document.head.appendChild(script);
      });
    };

    loadScript().then(() => {
      if (window.Cap && widgetRef.current) {
        capInstanceRef.current = new window.Cap(widgetRef.current, {
          apiEndpoint: '/api/captcha/',
        });
      }
    });
  }, []);

  const solve = useCallback(async (): Promise<string | undefined> => {
    if (capInstanceRef.current) {
      const result = await capInstanceRef.current.solve();
      return result.token;
    }
  }, [capInstanceRef.current]);

  return {
    solve,
  };
}
