/** Removes stale service workers left from earlier dev sessions with PWA enabled. */
export function unregisterDevServiceWorkers(): void {
  if (!import.meta.env.DEV || !('serviceWorker' in navigator)) {
    return;
  }

  void navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      void registration.unregister();
    }
  });

  if ('caches' in window) {
    void caches.keys().then((keys) => {
      for (const key of keys) {
        if (key.includes('workbox') || key.includes('precache')) {
          void caches.delete(key);
        }
      }
    });
  }
}
