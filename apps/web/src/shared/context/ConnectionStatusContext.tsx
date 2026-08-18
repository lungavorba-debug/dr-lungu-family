import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

export type ConnectionStatus = 'online' | 'offline' | 'checking';

interface ConnectionStatusContextValue {
  status: ConnectionStatus;
  label: string;
  isOnline: boolean;
  recheck: () => void;
}

const ConnectionStatusContext = createContext<ConnectionStatusContextValue | undefined>(
  undefined,
);

export function getConnectionStatusLabel(status: ConnectionStatus): string {
  switch (status) {
    case 'online':
      return 'Conectat';
    case 'offline':
      return 'Deconectat';
    case 'checking':
      return 'Verificare...';
  }
}

export function ConnectionStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    typeof navigator !== 'undefined' && navigator.onLine ? 'checking' : 'offline',
  );
  const [recheckToken, setRecheckToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function checkConnection() {
      if (!navigator.onLine) {
        setStatus('offline');
        return;
      }

      setStatus('checking');

      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          cache: 'no-store',
        });
        if (!cancelled) {
          setStatus(response.ok ? 'online' : 'offline');
        }
      } catch {
        if (!cancelled) {
          setStatus('offline');
        }
      }
    }

    void checkConnection();

    const onOnline = () => {
      void checkConnection();
    };
    const onOffline = () => setStatus('offline');

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const intervalId = window.setInterval(() => {
      void checkConnection();
    }, 30000);

    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.clearInterval(intervalId);
    };
  }, [recheckToken]);

  const value = useMemo<ConnectionStatusContextValue>(
    () => ({
      status,
      label: getConnectionStatusLabel(status),
      isOnline: status === 'online',
      recheck: () => setRecheckToken((token) => token + 1),
    }),
    [status],
  );

  return (
    <ConnectionStatusContext.Provider value={value}>{children}</ConnectionStatusContext.Provider>
  );
}

export function useConnectionStatus(): ConnectionStatusContextValue {
  const context = useContext(ConnectionStatusContext);
  if (!context) {
    throw new Error('useConnectionStatus must be used within ConnectionStatusProvider');
  }
  return context;
}
