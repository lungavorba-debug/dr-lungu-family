import type {
  DeliverScreeningResponse,
  DeliveryAvailabilityResponse,
  ScreeningDeliveryListResponse,
} from '@medscreen/types';
import { isValidRomanianPhone, isValidWhatsAppGraphRecipient, toRomanianE164, toWhatsAppGraphRecipient } from '@medscreen/shared';
import { AppError } from '../../lib/app-error';
import type { ClinicSettingsResolver } from '../../infrastructure/clinic-settings/clinic-settings.resolver';
import type { ScreeningDeliveryRepository } from '../../domain/repositories/screening-delivery.repository';
import type { ScreeningRepository } from '../../domain/repositories/screening.repository';
import type { PatientRepository } from '../../domain/repositories/patient.repository';
import type { ScreeningPdfStorageService } from '../../infrastructure/storage/screening-pdf-storage.service';
import type { SmtpEmailDeliveryService } from '../../infrastructure/delivery/smtp-email-delivery.service';
import type { WhatsAppDeliveryService } from '../../infrastructure/delivery/whatsapp-delivery.service';
import { whatsAppService } from '../../services/whatsapp.service';
import {
  formatWhatsAppCloudApiErrorForUser,
  WhatsAppCloudApiError,
} from '../../infrastructure/delivery/whatsapp-graph-errors';
import { buildDeliveryMessage } from './build-delivery-message';
import { buildDeliveryWhatsAppCaption } from './build-delivery-whatsapp-message';

function mapDeliveryEntity(
  entity: {
  id: string;
  screeningId: string;
  channel: string;
  status: string;
  recipient: string;
  providerMessageId: string | null;
  sentAt: Date | null;
},
  extras?: {
    previewUrl?: string | null;
    sender?: string | null;
    subject?: string | null;
  },
): DeliverScreeningResponse {
  return {
    delivery_id: entity.id,
    screening_id: entity.screeningId,
    channel: entity.channel as DeliverScreeningResponse['channel'],
    status: entity.status as DeliverScreeningResponse['status'],
    recipient: entity.recipient,
    provider_message_id: entity.providerMessageId,
    sent_at: entity.sentAt?.toISOString() ?? null,
    preview_url: extras?.previewUrl ?? null,
    sender: extras?.sender ?? null,
    subject: extras?.subject ?? null,
  };
}

async function loadDeliverableScreening(
  screeningRepository: ScreeningRepository,
  patientRepository: PatientRepository,
  screeningId: string,
) {
  const screening = await screeningRepository.findById(screeningId);
  if (!screening || screening.status !== 'completed') {
    throw new AppError(404, 'NOT_FOUND', 'Screeningul finalizat nu a fost găsit.');
  }

  if (!screening.pdfStoragePath || !screening.pdfFilename) {
    throw new AppError(404, 'NOT_FOUND', 'PDF-ul screeningului nu este disponibil pentru livrare.');
  }

  const patient =
    screening.patientId ? await patientRepository.findById(screening.patientId) : null;

  return { screening, patient };
}

export class GetDeliveryAvailabilityUseCase {
  constructor(
    private readonly screeningRepository: ScreeningRepository,
    private readonly clinicSettingsResolver: ClinicSettingsResolver,
  ) {}

  async execute(screeningId: string): Promise<DeliveryAvailabilityResponse> {
    const screening = await this.screeningRepository.findById(screeningId);
    const hasStoredPdf = Boolean(
      screening?.status === 'completed' && screening.pdfStoragePath && screening.pdfFilename,
    );

    const [emailConfigured] = await Promise.all([
      this.clinicSettingsResolver.isEmailConfigured(),
    ]);

    const whatsappSession = whatsAppService.getStatus();

    return {
      screening_id: screeningId,
      channels: {
        email: hasStoredPdf && emailConfigured,
        whatsapp: hasStoredPdf,
      },
      whatsapp_session: whatsappSession,
    };
  }
}

export class ListScreeningDeliveriesUseCase {
  constructor(private readonly deliveryRepository: ScreeningDeliveryRepository) {}

  async execute(screeningId: string): Promise<ScreeningDeliveryListResponse> {
    const deliveries = await this.deliveryRepository.findByScreeningId(screeningId);

    return {
      screening_id: screeningId,
      deliveries: deliveries.map((delivery) => ({
        id: delivery.id,
        screening_id: delivery.screeningId,
        channel: delivery.channel as ScreeningDeliveryListResponse['deliveries'][number]['channel'],
        status: delivery.status as ScreeningDeliveryListResponse['deliveries'][number]['status'],
        recipient: delivery.recipient,
        provider_message_id: delivery.providerMessageId,
        error_message: delivery.errorMessage,
        attempted_at: delivery.attemptedAt.toISOString(),
        sent_at: delivery.sentAt?.toISOString() ?? null,
        operator_id: delivery.operatorId,
      })),
    };
  }
}

export class DeliverScreeningEmailUseCase {
  constructor(
    private readonly screeningRepository: ScreeningRepository,
    private readonly patientRepository: PatientRepository,
    private readonly deliveryRepository: ScreeningDeliveryRepository,
    private readonly pdfStorage: ScreeningPdfStorageService,
    private readonly emailService: SmtpEmailDeliveryService,
    private readonly clinicSettingsResolver: ClinicSettingsResolver,
  ) {}

  async execute(params: { screeningId: string; operatorId: string; email: string }) {
    if (!(await this.emailService.isConfigured())) {
      throw new AppError(
        503,
        'SERVICE_UNAVAILABLE',
        'Livrarea prin email nu este configurată pe server.',
      );
    }

    const { screening, patient } = await loadDeliverableScreening(
      this.screeningRepository,
      this.patientRepository,
      params.screeningId,
    );

    const participantName = patient
      ? `${patient.lastName} ${patient.firstName}`
      : 'Participant';

    const delivery = await this.deliveryRepository.create({
      screeningId: params.screeningId,
      channel: 'email',
      status: 'pending',
      recipient: params.email,
      operatorId: params.operatorId,
    });

    try {
      const pdfBytes = await this.pdfStorage.readPdf(screening.pdfStoragePath!);
      const settings = await this.clinicSettingsResolver.getSettings();
      const message = buildDeliveryMessage(
        screening.participantReport,
        participantName,
        settings,
      );
      const result = await this.emailService.sendReportEmail({
        to: params.email,
        subject: message.subject,
        text: message.text,
        html: message.html,
        pdfFilename: screening.pdfFilename!,
        pdfBytes,
      });

      const updated = await this.deliveryRepository.updateStatus(delivery.id, {
        status: 'sent',
        providerMessageId: result.messageId,
        sentAt: new Date(),
      });

      return mapDeliveryEntity(updated, {
        previewUrl: result.previewUrl,
        sender: result.sender,
        subject: message.subject,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Livrarea prin email a eșuat.';
      await this.deliveryRepository.updateStatus(delivery.id, {
        status: 'failed',
        errorMessage,
      });
      throw new AppError(502, 'DELIVERY_FAILED', errorMessage);
    }
  }
}

export class DeliverScreeningWhatsAppUseCase {
  constructor(
    private readonly screeningRepository: ScreeningRepository,
    private readonly patientRepository: PatientRepository,
    private readonly deliveryRepository: ScreeningDeliveryRepository,
    private readonly pdfStorage: ScreeningPdfStorageService,
    private readonly whatsAppDeliveryService: WhatsAppDeliveryService,
    private readonly clinicSettingsResolver: ClinicSettingsResolver,
  ) {}

  async execute(params: { screeningId: string; operatorId: string; phone: string }) {
    if (!whatsAppService.ready) {
      throw new AppError(
        503,
        'WHATSAPP_DISCONNECTED',
        'Sesiunea WhatsApp nu este conectată. Scanează codul QR din Setări → WhatsApp sau folosește „Trimite manual”.',
      );
    }

    if (!isValidRomanianPhone(params.phone)) {
      throw new AppError(400, 'INVALID_PARAMETER', 'Numărul de telefon este invalid.', [
        { field: 'phone', issue: 'Trebuie să fie un număr mobil românesc valid.' },
      ]);
    }

    if (!isValidWhatsAppGraphRecipient(params.phone)) {
      throw new AppError(400, 'INVALID_PARAMETER', 'Numărul de telefon nu poate fi formatat pentru WhatsApp.', [
        {
          field: 'phone',
          issue: 'Folosește un mobil românesc valid; la trimitere se convertește automat la format 407xxxxxxxx (fără +).',
        },
      ]);
    }

    const { screening, patient } = await loadDeliverableScreening(
      this.screeningRepository,
      this.patientRepository,
      params.screeningId,
    );

    const participantName = patient
      ? `${patient.lastName} ${patient.firstName}`
      : 'Participant';
    const recipient = toRomanianE164(params.phone);
    const graphRecipient = toWhatsAppGraphRecipient(params.phone);

    const delivery = await this.deliveryRepository.create({
      screeningId: params.screeningId,
      channel: 'whatsapp',
      status: 'pending',
      recipient,
      operatorId: params.operatorId,
    });

    try {
      const pdfBytes = await this.pdfStorage.readPdf(screening.pdfStoragePath!);
      const settings = await this.clinicSettingsResolver.getSettings();
      const caption = buildDeliveryWhatsAppCaption(
        screening.participantReport,
        participantName,
        settings,
      );
      const result = await this.whatsAppDeliveryService.sendReportDocument({
        toE164: graphRecipient,
        pdfFilename: screening.pdfFilename!,
        pdfBytes,
        caption,
        participantName,
      });

      console.log(
        `[whatsapp] PDF trimis prin ${result.provider} către ${recipient} (screening ${params.screeningId})`,
      );

      const updated = await this.deliveryRepository.updateStatus(delivery.id, {
        status: 'sent',
        providerMessageId: result.messageId,
        sentAt: new Date(),
      });

      return mapDeliveryEntity(updated);
    } catch (error) {
      const whatsAppError =
        error instanceof WhatsAppCloudApiError
          ? error
          : null;
      const errorMessage = whatsAppError
        ? formatWhatsAppCloudApiErrorForUser(whatsAppError)
        : error instanceof Error
          ? error.message
          : 'Livrarea prin WhatsApp a eșuat.';

      if (whatsAppError) {
        console.error('[whatsapp] Delivery failed', {
          screeningId: params.screeningId,
          recipient,
          errorCode: whatsAppError.errorCode,
          metaErrorCode: whatsAppError.metaErrorCode,
          metaErrorSubcode: whatsAppError.metaErrorSubcode,
          stage: whatsAppError.stage,
          fbtraceId: whatsAppError.fbtraceId,
          hints: whatsAppError.hints,
        });
      }

      await this.deliveryRepository.updateStatus(delivery.id, {
        status: 'failed',
        errorMessage,
      });

      const statusCode =
        whatsAppError?.errorCode === 'WHATSAPP_ACCOUNT_NOT_REGISTERED' ||
        whatsAppError?.errorCode === 'WHATSAPP_ACCESS_TOKEN_INVALID'
          ? 503
          : whatsAppError?.errorCode === 'WHATSAPP_RECIPIENT_NOT_ALLOWED'
            ? 400
            : 502;

      throw new AppError(
        statusCode,
        whatsAppError?.errorCode ?? 'DELIVERY_FAILED',
        errorMessage,
        whatsAppError?.hints.map((hint, index) => ({
          field: `whatsapp_hint_${index + 1}`,
          issue: hint,
        })),
      );
    }
  }
}
