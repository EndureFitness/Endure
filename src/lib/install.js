import { useEffect, useState } from 'react';

/**
 * Returns the state needed to render an "Install app" button.
 *
 * - On Chrome/Edge/Android: `canInstall` becomes true after the browser fires
 *   `beforeinstallprompt`. Calling `install()` shows the native prompt.
 * - On iOS Safari: there is no install API. We detect the platform so the UI
 *   can render instructions instead ("Tap Share → Add to Home Screen").
 * - When the app is already installed and launched from the home screen,
 *   `isStandalone` is true and the install affordance should hide entirely.
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !/MSStream/.test(ua));

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari uses a non-standard property
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    const onPrompt = (e) => {
      // Stop the auto prompt; we'll trigger it ourselves from the UI.
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return null;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome; // 'accepted' | 'dismissed'
  };

  return { canInstall: !!deferredPrompt, isStandalone, isIOS, install };
}
