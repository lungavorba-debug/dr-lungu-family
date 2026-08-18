export type DeliveryChannel = 'email' | 'whatsapp';
export type DeliveryStatus = 'pending' | 'sent' | 'failed';

export interface ScreeningDeliveryRecord {
  id: string;
  screening_id: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  recipient: string;
  provider_message_id: string | null;
  error_message: string | null;
  attempted_at: string;
  sent_at: string | null;
  operator_id: string;
}

export interface DeliverScreeningResponse {
  delivery_id: string;
  screening_id: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  recipient: string;
  provider_message_id: string | null;
  sent_at: string | null;
  preview_url?: string | null;
  sender?: string | null;
  subject?: string | null;
}

export interface ScreeningDeliveryListResponse {
  screening_id: string;
  deliveries: ScreeningDeliveryRecord[];
}

export interface DeliveryChannelAvailability {
  email: boolean;
  whatsapp: boolean;
}

export interface WhatsAppSessionStatus {
  connected: boolean;
  initializing: boolean;
  qr_available: boolean;
}

export interface WhatsAppSessionResponse extends WhatsAppSessionStatus {
  qr_data_url: string | null;
}

export interface DeliveryAvailabilityResponse {
  screening_id: string;
  channels: DeliveryChannelAvailability;
  whatsapp_session: WhatsAppSessionStatus;
}
