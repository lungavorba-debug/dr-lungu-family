import { ApiStatusPanel } from '../components/ApiStatusPanel';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { SyncQueueSection } from '../components/SyncQueueSection';
import { formatDashboardDateTime } from '../lib/format-dashboard-date';
import { useSyncQueue } from '../../sync/context/SyncContext';
import { useConnectionStatus } from '../../../shared/context/ConnectionStatusContext';
import { ConnectionStatusBadge } from '../../../shared/components/ConnectionStatusBadge';
import { useState } from 'react';

export function SyncPage() {
  const { status, label, isOnline } = useConnectionStatus();
  const {
    pendingItems,
    syncedItems,
    failedItems,
    conflictItems,
    lastSuccessfulSyncAt,
    progress,
    isLoading,
    syncNow,
    retryItem,
  } = useSyncQueue();
  const [retryingItemId, setRetryingItemId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncMessageTone, setSyncMessageTone] = useState<'success' | 'error' | 'warning'>('success');

  const handleSyncNow = async () => {
    setSyncMessage(null);
    const result = await syncNow();

    if (result.processed === 0 && result.pending === 0 && result.failed === 0) {
      setSyncMessageTone('success');
      setSyncMessage('Nu există screeninguri de sincronizat.');
      return;
    }

    if (result.failed > 0 || result.conflicts > 0) {
      setSyncMessageTone('error');
      setSyncMessage(
        `Sincronizare finalizată cu probleme: ${result.failed} eșuate, ${result.conflicts} conflicte.`,
      );
      return;
    }

    if (result.pending > 0) {
      setSyncMessageTone('warning');
      setSyncMessage(`${result.pending} screeninguri rămân în așteptare.`);
      return;
    }

    setSyncMessageTone('success');
    setSyncMessage('Toate screeningurile au fost sincronizate cu succes.');
  };

  const handleRetry = async (itemId: string) => {
    setRetryingItemId(itemId);
    setSyncMessage(null);
    try {
      await retryItem(itemId);
      setSyncMessage('Elementul a fost retrimis spre sincronizare.');
    } finally {
      setRetryingItemId(null);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Sincronizare"
        description="Screeningurile salvate local offline sunt trimise automat către server când conexiunea revine."
        actions={
          <button
            type="button"
            onClick={() => void handleSyncNow()}
            disabled={!isOnline || progress.is_syncing || pendingItems.length + failedItems.length === 0}
            className="inline-flex min-h-touch items-center justify-center rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {progress.is_syncing ? 'Se sincronizează...' : 'Sincronizează acum'}
          </button>
        }
      />

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Conexiune</p>
          <div className="mt-2">
            <ConnectionStatusBadge status={status} label={label} />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Ultima sincronizare reușită
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {lastSuccessfulSyncAt ? formatDashboardDateTime(lastSuccessfulSyncAt) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Progres</p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {progress.is_syncing
              ? `${progress.current} / ${progress.total} screeninguri`
              : 'Inactiv'}
          </p>
          {progress.active_screening_id ? (
            <p className="mt-1 font-mono text-xs text-slate-500">{progress.active_screening_id}</p>
          ) : null}
        </div>
      </section>

      {progress.is_syncing ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Se sincronizează screeningurile locale ({progress.current}/{progress.total})...
        </div>
      ) : null}

      {syncMessage ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            syncMessageTone === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : syncMessageTone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-brand-accent/30 bg-brand-accent/10 text-brand-accent'
          }`}
        >
          {syncMessage}
        </div>
      ) : null}

      <ApiStatusPanel />

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Se încarcă coada de sincronizare...
        </div>
      ) : (
        <>
          <SyncQueueSection
            title="În așteptare"
            description="Screeninguri salvate local și neîncărcate pe server."
            items={pendingItems}
            emptyLabel="Nu există screeninguri în așteptare."
          />

          <SyncQueueSection
            title="Eșuate"
            description="Screeninguri care necesită reîncercare manuală."
            items={failedItems}
            emptyLabel="Nu există screeninguri eșuate."
            onRetry={handleRetry}
            retryingItemId={retryingItemId}
          />

          <SyncQueueSection
            title="Conflicte"
            description="Screeninguri respinse de server din cauza unui conflict de date."
            items={conflictItems}
            emptyLabel="Nu există conflicte de sincronizare."
          />

          <SyncQueueSection
            title="Sincronizate"
            description="Screeninguri trimise cu succes către server."
            items={syncedItems}
            emptyLabel="Nu există screeninguri sincronizate local."
          />
        </>
      )}
    </div>
  );
}
