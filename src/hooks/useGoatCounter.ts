import { useEffect } from 'react';

/**
 * Loads GoatCounter analytics script in production.
 *
 * GoatCounter is privacy-friendly (no cookies, GDPR-compliant).
 * The script is only injected when VITE_GOATCOUNTER_SITE is set,
 * so dev environments with no env var configured get no tracking.
 */
export function useGoatCounter() {
  const siteCode = import.meta.env.VITE_GOATCOUNTER_SITE as string | undefined;

  useEffect(() => {
    if (!siteCode) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = '//gc.zgo.at/count.js';
    script.dataset.goatcounter = `https://${siteCode}.goatcounter.com/count`;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [siteCode]);
}
