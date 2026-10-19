import { useEffect, useState } from 'react';

// The Meet extension injects voik-bridge.js on this site. Asking the bridge for its
// stored config is a cheap ping: any response means the extension is installed.
// Returns 'checking' | 'installed' | 'missing'.
export function useExtensionStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let done = false;

    const onMessage = (event) => {
      if (event.source !== window) return;
      const type = event.data?.type;
      if (type === 'VOIK_FIREBASE_CONFIG_RESPONSE' || type === 'VOIK_BRIDGE_READY' || type === 'VOIK_FIREBASE_CONFIG_SAVED') {
        done = true;
        setStatus('installed');
      }
    };

    window.addEventListener('message', onMessage);
    window.postMessage({ type: 'VOIK_GET_FIREBASE_CONFIG' }, '*');
    const timeout = setTimeout(() => {
      if (!done) setStatus('missing');
    }, 1500);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timeout);
    };
  }, []);

  return status;
}

// The extension only runs in desktop Chrome (and Chromium browsers like Edge and Brave)
export function canInstallExtension() {
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const chromium = /Chrome\//.test(ua) && !/Firefox\//.test(ua);
  return chromium && !mobile;
}
