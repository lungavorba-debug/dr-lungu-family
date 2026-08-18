import { useEffect, useState } from 'react';

import { formatPhoneInput, isValidRomanianPhone } from '@medscreen/shared';

import { useWhatsAppSession } from '../../../settings/hooks/useWhatsAppSession';
import { useClinicSettingsSnapshot } from '../../../settings/context/ClinicSettingsContext';
import { WhatsAppPhoneDialog } from '../../report/components/WhatsAppPhoneDialog';
import { buildWhatsAppShareUrl } from '../../report/lib/whatsapp-share';
import { buildManualWhatsAppDeliveryMessageFromSettings } from '../lib/build-manual-whatsapp-message';
import type { DeliveryChannel, DeliveryOptionViewModel, DeliveryRecipient } from '../types/delivery.types';

interface DeliveryOptionsPanelProps {
  options: DeliveryOptionViewModel[];
  activeChannel: DeliveryChannel | null;
  lastMessage: string | null;
  lastSuccess: boolean | null;
  emailAvailabilityLoading?: boolean;
  whatsappAvailabilityLoading?: boolean;
  defaultPhone?: string;
  participantDisplayName?: string;
  campaignName?: string;
  onDeliver: (channel: DeliveryChannel, recipient?: DeliveryRecipient) => void;
}

function resolveParticipantLabel(participantDisplayName?: string): string {
  return participantDisplayName?.trim() || 'Participant';
}

function resolveEventLabel(campaignName?: string): string {
  return campaignName?.trim() || 'Screening Cardiovascular';
}

export function DeliveryOptionsPanel({
  options,
  activeChannel,
  lastMessage,
  lastSuccess,
  emailAvailabilityLoading = false,
  whatsappAvailabilityLoading = false,
  defaultPhone = '',
  participantDisplayName,
  campaignName,
  onDeliver,
}: DeliveryOptionsPanelProps) {
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const clinicSettings = useClinicSettingsSnapshot();
  const { data: whatsappSession, isLoading: whatsappSessionLoading } = useWhatsAppSession();

  useEffect(() => {
    if (defaultPhone && !phoneNumber) {
      setPhoneNumber(defaultPhone);
    }
  }, [defaultPhone, phoneNumber]);

  const emailOption = options.find((option) => option.channel === 'email');
  const whatsappOption = options.find((option) => option.channel === 'whatsapp');
  const localOptions = options.filter((option) => option.channel === 'print' || option.channel === 'download');

  const whatsappConfigured = Boolean(whatsappOption?.isImplemented);
  const whatsappConnected = whatsappSession?.connected ?? false;

  const isEmailBusy = activeChannel === 'email';
  const isWhatsAppBusy = activeChannel === 'whatsapp';
  const emailMissing = !emailAddress.trim();
  const phoneMissing = !phoneNumber.trim();
  const phoneInvalid = !phoneMissing && !isValidRomanianPhone(phoneNumber);

  const emailDisabled =
    isEmailBusy ||
    activeChannel !== null ||
    emailMissing ||
    emailAvailabilityLoading ||
    !emailOption?.isImplemented;

  const whatsappSendDisabled =
    !whatsappConfigured ||
    !whatsappConnected ||
    isWhatsAppBusy ||
    activeChannel !== null ||
    phoneMissing ||
    phoneInvalid ||
    whatsappAvailabilityLoading ||
    whatsappSessionLoading;

  const manualWhatsAppDisabled =
    !whatsappConfigured ||
    whatsappConnected ||
    phoneMissing ||
    phoneInvalid ||
    whatsappAvailabilityLoading;

  function handleWhatsAppSend(phone: string) {
    setShowPhoneDialog(false);
    setPhoneNumber(phone);
    onDeliver('whatsapp', { phone: phone.trim() });
  }

  function handleWhatsAppClick() {
    if (!whatsappConfigured) {
      return;
    }

    if (phoneMissing) {
      setShowPhoneDialog(true);
      return;
    }

    if (!isValidRomanianPhone(phoneNumber)) {
      return;
    }

    onDeliver('whatsapp', { phone: phoneNumber.trim() });
  }

  function handleManualWhatsAppClick() {
    if (!isValidRomanianPhone(phoneNumber) || !clinicSettings) {
      return;
    }

    const message = buildManualWhatsAppDeliveryMessageFromSettings(
      resolveParticipantLabel(participantDisplayName),
      resolveEventLabel(campaignName),
      clinicSettings,
    );
    const url = buildWhatsAppShareUrl(phoneNumber, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="space-y-4" aria-label="Opțiuni de livrare">
      <h2 className="text-lg font-semibold text-slate-900">Livrare raport</h2>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Livrarea folosește raportul și PDF-ul salvate pe server după finalizarea screeningului.
      </div>

      {emailOption ? (
        <div className="space-y-3 rounded-2xl border border-brand-primary/15 bg-white p-5">
          <div className="space-y-2">
            <label htmlFor="delivery-email" className="text-sm font-medium text-slate-700">
              Email participant
            </label>
            <input
              id="delivery-email"
              type="email"
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              placeholder="participant@example.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>

          <button
            type="button"
            disabled={emailDisabled}
            onClick={() => onDeliver('email', { email: emailAddress.trim() })}
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary text-base font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span aria-hidden="true">📧</span>
            {isEmailBusy
              ? 'Se trimite emailul...'
              : emailAvailabilityLoading
                ? 'Se verifică emailul...'
                : 'Trimite pe email'}
          </button>

          {!emailOption.isImplemented && !emailAvailabilityLoading ? (
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Email indisponibil pe server
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3 rounded-2xl border border-emerald-200/60 bg-white p-5">
        {whatsappConfigured ? (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              whatsappConnected
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-rose-50 text-rose-800'
            }`}
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true">{whatsappConnected ? '🟢' : '🔴'}</span>
            <span>
              WhatsApp: {whatsappConnected ? 'Conectat' : 'Deconectat'}
              {whatsappSession?.initializing && !whatsappConnected ? ' (așteaptă scanare QR)' : ''}
            </span>
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="delivery-phone" className="text-sm font-medium text-slate-700">
            Telefon participant (WhatsApp)
          </label>
          <input
            id="delivery-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phoneNumber}
            disabled={!whatsappConfigured || whatsappAvailabilityLoading}
            onChange={(event) => setPhoneNumber(formatPhoneInput(event.target.value))}
            placeholder="07xx xxx xxx"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          />
          {phoneInvalid && whatsappConfigured ? (
            <p className="text-xs text-amber-700">Introduceți un număr mobil românesc valid.</p>
          ) : null}
        </div>

        <button
          type="button"
          disabled={whatsappSendDisabled}
          onClick={handleWhatsAppClick}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden="true">{whatsappConnected ? '🟢' : '🔴'}</span>
          {isWhatsAppBusy
            ? 'Se trimite pe WhatsApp...'
            : whatsappAvailabilityLoading || whatsappSessionLoading
              ? 'Se verifică WhatsApp...'
              : 'Trimite pe WhatsApp'}
        </button>

        {!whatsappConnected && whatsappConfigured && !whatsappSessionLoading ? (
          <>
            <p className="text-sm text-slate-500">
              Sesiunea WhatsApp de pe server nu este conectată. Administratorul poate scana codul QR
              din Setări → WhatsApp.
            </p>
            <button
              type="button"
              disabled={manualWhatsAppDisabled}
              onClick={handleManualWhatsAppClick}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-white text-base font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Trimite manual
            </button>
            <p className="text-xs text-slate-500">
              Deschide WhatsApp pe telefonul operatorului cu mesajul precompletat. Atașați manual
              PDF-ul raportului din aplicație.
            </p>
          </>
        ) : null}

        {!whatsappConfigured && !whatsappAvailabilityLoading ? (
          <p className="text-sm text-slate-500">
            Raportul nu este încă disponibil pe server pentru livrare WhatsApp.
          </p>
        ) : null}
      </div>

      {localOptions.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {localOptions.map((option) => {
            const isBusy = activeChannel === option.channel;

            return (
              <button
                key={option.channel}
                type="button"
                disabled={isBusy || activeChannel !== null || !option.isImplemented}
                onClick={() => onDeliver(option.channel)}
                className={`flex min-h-[72px] flex-col items-start justify-center rounded-2xl border px-5 py-4 text-left transition ${
                  option.isImplemented
                    ? 'border-brand-primary/25 bg-white hover:border-brand-primary hover:bg-brand-primary/5'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                } disabled:opacity-60`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {option.emoji}
                </span>
                <span className="mt-1 text-base font-semibold text-slate-900">{option.label}</span>
                <span className="mt-0.5 text-xs text-slate-500">{option.description}</span>
                {isBusy ? (
                  <span className="mt-2 text-xs font-medium text-brand-primary">Se procesează...</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {lastMessage ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl px-4 py-3 text-sm whitespace-pre-line shadow-sm ${
            lastSuccess
              ? 'border border-emerald-300 bg-emerald-50 font-medium text-emerald-800'
              : 'border border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {lastMessage}
        </div>
      ) : null}

      {showPhoneDialog ? (
        <WhatsAppPhoneDialog
          onConfirm={handleWhatsAppSend}
          onCancel={() => setShowPhoneDialog(false)}
        />
      ) : null}
    </section>
  );
}
