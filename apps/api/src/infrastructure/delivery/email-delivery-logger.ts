export interface EmailDeliveryLogEvent {
  recipient: string;
  subject: string;
  sender: string;
  smtpHost: string;
  success: boolean;
  smtpResponse?: string | null;
  error?: string | null;
}

export function logEmailDelivery(event: EmailDeliveryLogEvent): void {
  const payload = {
    event: 'email_delivery',
    recipient: event.recipient,
    subject: event.subject,
    sender: event.sender,
    smtpHost: event.smtpHost,
    success: event.success,
    smtpResponse: event.smtpResponse ?? null,
    error: event.error ?? null,
    timestamp: new Date().toISOString(),
  };

  const line = `[email] ${JSON.stringify(payload)}`;
  if (event.success) {
    console.info(line);
  } else {
    console.error(line);
  }
}
