import { useCallback, useMemo, useState } from 'react';
import type { Patient } from '@medscreen/types';
import type { StoredScreeningPdf } from '../../report/lib/pdf-session-storage';
import { getDeliveryProvider, getVisibleDeliveryProviders } from '../providers';
import type {
  DeliveryChannel,
  DeliveryContext,
  DeliveryOptionViewModel,
  DeliveryRecipient,
} from '../types/delivery.types';

interface DeliveryChannelAvailability {
  email: boolean;
  whatsapp: boolean;
}

interface UseReportDeliveryOptions {
  pdf: StoredScreeningPdf | null;
  patient: Patient | null;
  screeningId: string | null;
  campaignName?: string;
  channelAvailability?: DeliveryChannelAvailability;
  onDelivered?: () => void;
}

function resolveChannelImplemented(
  channel: DeliveryChannel,
  providerImplemented: boolean,
  availability?: DeliveryChannelAvailability,
): boolean {
  if (channel === 'email') {
    return availability?.email ?? false;
  }
  if (channel === 'whatsapp') {
    return availability?.whatsapp ?? false;
  }
  return providerImplemented;
}

export function useReportDelivery({
  pdf,
  patient,
  screeningId,
  campaignName,
  channelAvailability,
  onDelivered,
}: UseReportDeliveryOptions) {
  const [activeChannel, setActiveChannel] = useState<DeliveryChannel | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<boolean | null>(null);

  const options: DeliveryOptionViewModel[] = useMemo(
    () =>
      getVisibleDeliveryProviders().map((provider) => ({
        channel: provider.channel,
        label: provider.label,
        emoji: provider.emoji,
        description: provider.description,
        isImplemented: resolveChannelImplemented(
          provider.channel,
          provider.isImplemented,
          channelAvailability,
        ),
      })),
    [channelAvailability],
  );

  const deliver = useCallback(
    async (channel: DeliveryChannel, recipient?: DeliveryRecipient) => {
      if (!pdf || !patient || !screeningId) {
        setLastSuccess(false);
        setLastMessage('Datele screeningului nu sunt disponibile.');
        return;
      }

      const provider = getDeliveryProvider(channel);
      if (!provider) {
        setLastSuccess(false);
        setLastMessage('Canal de livrare necunoscut.');
        return;
      }

      setActiveChannel(channel);
      setLastMessage(null);
      setLastSuccess(null);

      const context: DeliveryContext = {
        pdf,
        patient,
        screeningId,
        campaignName,
      };

      try {
        const result = await provider.deliver(context, recipient);
        setLastSuccess(result.success);
        setLastMessage(result.message);
        if (result.success) {
          onDelivered?.();
        }
      } catch (err) {
        setLastSuccess(false);
        setLastMessage(err instanceof Error ? err.message : 'Livrarea a eșuat.');
      } finally {
        setActiveChannel(null);
      }
    },
    [pdf, patient, screeningId, campaignName, onDelivered],
  );

  return {
    options,
    deliver,
    activeChannel,
    lastMessage,
    lastSuccess,
  };
}
