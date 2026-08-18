import type { Patient } from '@medscreen/types';
import type { StoredScreeningPdf } from '../../report/lib/pdf-session-storage';

export type DeliveryChannel = 'whatsapp' | 'email' | 'print' | 'download';

export interface DeliveryContext {
  pdf: StoredScreeningPdf;
  patient: Patient;
  screeningId: string;
  campaignName?: string;
}

export interface DeliveryResult {
  success: boolean;
  message: string;
}

export interface DeliveryRecipient {
  email?: string;
  phone?: string;
}

export interface DeliveryProvider {
  channel: DeliveryChannel;
  label: string;
  emoji: string;
  description: string;
  isImplemented: boolean;
  deliver: (context: DeliveryContext, recipient?: DeliveryRecipient) => Promise<DeliveryResult>;
}

export interface DeliveryOptionViewModel {
  channel: DeliveryChannel;
  label: string;
  emoji: string;
  description: string;
  isImplemented: boolean;
}
