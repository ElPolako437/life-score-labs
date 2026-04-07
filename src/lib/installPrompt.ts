// Captures the browser's native install prompt (Android/Chrome only).
// Must be initialized early (App.tsx) so the event isn't missed.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function clearDeferredPrompt() {
  deferredPrompt = null;
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}
