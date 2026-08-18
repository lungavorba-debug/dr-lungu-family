import { useEffect, useState } from 'react';
import type {
  AiSettings,
  ApplicationSettings,
  BrandingSettings,
  ClinicInfoSettings,
  ClinicSettingsSection,
  ContactSettings,
  FooterSettings,
  LogoSettings,
  PdfSettings,
  QrSettings,
  SmtpSettings,
  UpdateClinicSettingsSectionRequest,
  WhatsAppSettings,
} from '@medscreen/types';
import { CLINIC_SETTINGS_SECTIONS } from '@medscreen/types';
import { ApiClientError } from '../../../shared/lib/api-client';
import { useAuth } from '../../auth/context/AuthContext';
import { DashboardPageHeader } from '../../dashboard/components/DashboardPageHeader';
import { Field, SettingsSection, inputClassName, textareaClassName } from '../components/SettingsSection';
import { BrandingAssetField } from '../components/BrandingAssetField';
import { WhatsAppSessionPanel } from '../components/WhatsAppSessionPanel';
import { useAdminClinicSettings, useUpdateClinicSettingsSection } from '../hooks/useClinicSettingsAdmin';

const SECTION_TABS: { id: ClinicSettingsSection; label: string }[] = [
  { id: CLINIC_SETTINGS_SECTIONS.CLINIC, label: 'Informații clinică' },
  { id: CLINIC_SETTINGS_SECTIONS.BRANDING, label: 'Branding' },
  { id: CLINIC_SETTINGS_SECTIONS.CONTACT, label: 'Contact' },
  { id: CLINIC_SETTINGS_SECTIONS.LOGO, label: 'Logo' },
  { id: CLINIC_SETTINGS_SECTIONS.FOOTER, label: 'Footer' },
  { id: CLINIC_SETTINGS_SECTIONS.PDF, label: 'PDF' },
  { id: CLINIC_SETTINGS_SECTIONS.QR, label: 'QR' },
  { id: CLINIC_SETTINGS_SECTIONS.SMTP, label: 'Email (SMTP)' },
  { id: CLINIC_SETTINGS_SECTIONS.WHATSAPP, label: 'WhatsApp' },
  { id: CLINIC_SETTINGS_SECTIONS.AI, label: 'AI' },
  { id: CLINIC_SETTINGS_SECTIONS.APPLICATION, label: 'Sistem' },
];

function resolveError(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Salvarea setărilor a eșuat.';
}

export function SettingsPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useAdminClinicSettings();
  const updateSection = useUpdateClinicSettingsSection();
  const [activeSection, setActiveSection] = useState<ClinicSettingsSection>(CLINIC_SETTINGS_SECTIONS.CLINIC);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [clinic, setClinic] = useState<ClinicInfoSettings | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [contact, setContact] = useState<ContactSettings | null>(null);
  const [logo, setLogo] = useState<LogoSettings | null>(null);
  const [footer, setFooter] = useState<FooterSettings | null>(null);
  const [pdf, setPdf] = useState<PdfSettings | null>(null);
  const [qr, setQr] = useState<QrSettings | null>(null);
  const [smtp, setSmtp] = useState<SmtpSettings | null>(null);
  const [whatsapp, setWhatsapp] = useState<WhatsAppSettings | null>(null);
  const [ai, setAi] = useState<AiSettings | null>(null);
  const [application, setApplication] = useState<ApplicationSettings | null>(null);

  useEffect(() => {
    if (!data) return;
    setClinic(data.clinic);
    setBranding(data.branding);
    setContact(data.contact);
    setLogo(data.logo);
    setFooter(data.footer);
    setPdf(data.pdf);
    setQr(data.qr);
    setSmtp(data.smtp);
    setWhatsapp(data.whatsapp);
    setAi(data.ai);
    setApplication(data.application);
  }, [data]);

  const save = async (section: ClinicSettingsSection, payload: UpdateClinicSettingsSectionRequest['data']) => {
    setSaveMessage(null);
    setSaveError(null);
    try {
      await updateSection.mutateAsync({ section, data: payload } as UpdateClinicSettingsSectionRequest);
      setSaveMessage('Secțiunea a fost salvată.');
    } catch (mutationError) {
      setSaveError(resolveError(mutationError));
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Doar administratorii pot modifica setările clinicii.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Setări clinică"
        description="Configurați informațiile clinicii, brandingul, livrarea și setările aplicației fără modificări de cod."
      />

      {data?.meta ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
          Ultima actualizare: {new Date(data.meta.updated_at).toLocaleString('ro-RO')}
          {data.meta.updated_by_name ? ` · ${data.meta.updated_by_name}` : ''}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveSection(tab.id);
              setSaveMessage(null);
              setSaveError(null);
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              activeSection === tab.id
                ? 'bg-brand-primary text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-sm text-slate-500">Se încarcă setările…</p> : null}
      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Setările nu au putut fi încărcate.'}
          <button type="button" onClick={() => void refetch()} className="ml-3 underline">
            Reîncearcă
          </button>
        </div>
      ) : null}

      {activeSection === CLINIC_SETTINGS_SECTIONS.CLINIC && clinic ? (
        <SettingsSection
          title="Informații clinică"
          description="Datele principale afișate în rapoarte, dashboard și login."
          onSave={() => void save('clinic', clinic)}
          isPending={updateSection.isPending}
          message={saveMessage}
          error={saveError}
        >
          <Field label="Nume clinică">
            <input className={inputClassName} value={clinic.name} onChange={(e) => setClinic({ ...clinic, name: e.target.value })} />
          </Field>
          <Field label="Slogan">
            <input className={inputClassName} value={clinic.slogan} onChange={(e) => setClinic({ ...clinic, slogan: e.target.value })} />
          </Field>
          <Field label="Denumire legală">
            <input className={inputClassName} value={clinic.legal_name ?? ''} onChange={(e) => setClinic({ ...clinic, legal_name: e.target.value || null })} />
          </Field>
          <Field label="Descriere">
            <textarea className={textareaClassName} rows={3} value={clinic.description ?? ''} onChange={(e) => setClinic({ ...clinic, description: e.target.value || null })} />
          </Field>
        </SettingsSection>
      ) : null}

      {activeSection === CLINIC_SETTINGS_SECTIONS.BRANDING && branding ? (
        <SettingsSection title="Branding" description="Identitatea vizuală a aplicației." onSave={() => void save('branding', branding)} isPending={updateSection.isPending} message={saveMessage} error={saveError}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nume aplicație"><input className={inputClassName} value={branding.app_name} onChange={(e) => setBranding({ ...branding, app_name: e.target.value })} /></Field>
            <Field label="Subtitlu"><input className={inputClassName} value={branding.app_subtitle} onChange={(e) => setBranding({ ...branding, app_subtitle: e.target.value })} /></Field>
            <Field label="Culoare primară">
              <div className="flex items-center gap-3">
                <input type="color" value={branding.primary_color} onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })} className="h-11 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
                <input className={inputClassName} value={branding.primary_color} onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })} />
              </div>
            </Field>
            <Field label="Culoare accent">
              <div className="flex items-center gap-3">
                <input type="color" value={branding.accent_color} onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })} className="h-11 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
                <input className={inputClassName} value={branding.accent_color} onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })} />
              </div>
            </Field>
          </div>
          <Field label="Tagline login"><input className={inputClassName} value={branding.login_tagline} onChange={(e) => setBranding({ ...branding, login_tagline: e.target.value })} /></Field>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="mb-3 text-sm font-medium text-slate-700">Previzualizare culori</p>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: branding.primary_color }}>Primară</div>
              <div className="rounded-xl px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: branding.accent_color }}>Accent</div>
            </div>
          </div>
        </SettingsSection>
      ) : null}

      {activeSection === CLINIC_SETTINGS_SECTIONS.CONTACT && contact ? (
        <SettingsSection title="Contact" description="Date de contact folosite în rapoarte și footer." onSave={() => void save('contact', contact)} isPending={updateSection.isPending} message={saveMessage} error={saveError}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefon"><input className={inputClassName} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></Field>
            <Field label="Email"><input className={inputClassName} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></Field>
            <Field label="Website"><input className={inputClassName} value={contact.website} onChange={(e) => setContact({ ...contact, website: e.target.value })} /></Field>
            <Field label="Pagină contact"><input className={inputClassName} value={contact.contact_page_url ?? ''} onChange={(e) => setContact({ ...contact, contact_page_url: e.target.value || null })} /></Field>
          </div>
          <Field label="Adresă"><textarea className={textareaClassName} rows={2} value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} /></Field>
          <Field label="Google Business URL"><input className={inputClassName} value={contact.google_business_url ?? ''} onChange={(e) => setContact({ ...contact, google_business_url: e.target.value || null })} /></Field>
        </SettingsSection>
      ) : null}

      {activeSection === CLINIC_SETTINGS_SECTIONS.LOGO && logo ? (
        <SettingsSection title="Logo" description="Logo, favicon și identificator sidebar." onSave={() => void save('logo', logo)} isPending={updateSection.isPending} message={saveMessage} error={saveError}>
          <BrandingAssetField
            kind="logo"
            label="Logo clinică"
            description="PNG, JPEG, SVG sau WebP. Max 2 MB. Folosit în sidebar și login."
            currentPath={logo.logo_path}
            currentMime={logo.logo_mime}
            cacheKey={data?.meta.updated_at}
            onUploaded={() => void refetch()}
          />
          <BrandingAssetField
            kind="favicon"
            label="Favicon"
            description="PNG, ICO sau SVG. Max 512 KB. Aplicat în tab-ul browserului."
            currentPath={logo.favicon_path}
            currentMime={logo.favicon_mime}
            cacheKey={data?.meta.updated_at}
            onUploaded={() => void refetch()}
          />
          <Field label="Inițiale sidebar (fallback fără logo)">
            <input className={inputClassName} value={logo.sidebar_initials} onChange={(e) => setLogo({ ...logo, sidebar_initials: e.target.value })} />
          </Field>
        </SettingsSection>
      ) : null}

      {activeSection === CLINIC_SETTINGS_SECTIONS.FOOTER && footer ? (
        <SettingsSection title="Footer" description="Disclaimer și text footer rapoarte." onSave={() => void save('footer', footer)} isPending={updateSection.isPending} message={saveMessage} error={saveError}>
          <Field label="Paragrafe disclaimer (câte un rând)">
            <textarea className={textareaClassName} rows={4} value={footer.disclaimer_paragraphs.join('\n')} onChange={(e) => setFooter({ ...footer, disclaimer_paragraphs: e.target.value.split('\n').filter(Boolean) })} />
          </Field>
          <Field label="Text footer suplimentar"><input className={inputClassName} value={footer.footer_text ?? ''} onChange={(e) => setFooter({ ...footer, footer_text: e.target.value || null })} /></Field>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={footer.show_operator_signature} onChange={(e) => setFooter({ ...footer, show_operator_signature: e.target.checked })} />
            Afișează semnătura operatorului în footer
          </label>
        </SettingsSection>
      ) : null}

      {activeSection === CLINIC_SETTINGS_SECTIONS.PDF && pdf ? (
        <SettingsSection title="PDF" description="Branding și conținut rapoarte PDF." onSave={() => void save('pdf', pdf)} isPending={updateSection.isPending} message={saveMessage} error={saveError}>
          <Field label="Titlu raport"><input className={inputClassName} value={pdf.report_title} onChange={(e) => setPdf({ ...pdf, report_title: e.target.value })} /></Field>
          <Field label="Titlu educație TA"><input className={inputClassName} value={pdf.blood_pressure_education_title} onChange={(e) => setPdf({ ...pdf, blood_pressure_education_title: e.target.value })} /></Field>
          <Field label="Sfaturi educație TA (câte un rând)"><textarea className={textareaClassName} rows={4} value={pdf.blood_pressure_education_tips.join('\n')} onChange={(e) => setPdf({ ...pdf, blood_pressure_education_tips: e.target.value.split('\n').filter(Boolean) })} /></Field>
        </SettingsSection>
      ) : null}

      {activeSection === CLINIC_SETTINGS_SECTIONS.QR && qr ? (
        <SettingsSection title="QR" description="Configurare cod QR din rapoarte." onSave={() => void save('qr', qr)} isPending={updateSection.isPending} message={saveMessage} error={saveError}>
          <Field label="Sursă URL preferată">
            <select className={inputClassName} value={qr.preferred_url} onChange={(e) => setQr({ ...qr, preferred_url: e.target.value as QrSettings['preferred_url'] })}>
              <option value="website">Website</option>
              <option value="google_business">Google Business</option>
              <option value="contact_page">Pagină contact</option>
              <option value="custom">URL personalizat</option>
            </select>
          </Field>
          <Field label="URL personalizat"><input className={inputClassName} value={qr.custom_url ?? ''} onChange={(e) => setQr({ ...qr, custom_url: e.target.value || null })} /></Field>
        </SettingsSection>
      ) : null}

      {activeSection === CLINIC_SETTINGS_SECTIONS.SMTP && smtp ? (
        <SettingsSection title="Email (SMTP)" description="Configurare livrare rapoarte prin email." onSave={() => void save('smtp', smtp)} isPending={updateSection.isPending} message={saveMessage} error={saveError}>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={smtp.enabled} onChange={(e) => setSmtp({ ...smtp, enabled: e.target.checked })} />Activează SMTP din setări</label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Host"><input className={inputClassName} value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} /></Field>
            <Field label="Port"><input type="number" className={inputClassName} value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })} /></Field>
            <Field label="Utilizator"><input className={inputClassName} value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} /></Field>
            <Field label="Parolă"><input type="password" className={inputClassName} value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} placeholder="********" /></Field>
            <Field label="From"><input className={inputClassName} value={smtp.from} onChange={(e) => setSmtp({ ...smtp, from: e.target.value })} /></Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={smtp.secure} onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })} />Conexiune securizată (TLS)</label>
        </SettingsSection>
      ) : null}

      {activeSection === CLINIC_SETTINGS_SECTIONS.WHATSAPP && whatsapp ? (
        <>
          <SettingsSection
            title="WhatsApp Web (sesiune clinică)"
            description="Conectați telefonul clinicii prin scanare QR. Sesiunea rulează pe server și este folosită de toți operatorii pentru trimiterea automată a PDF-urilor."
          >
            <WhatsAppSessionPanel />
          </SettingsSection>

          <SettingsSection
            title="WhatsApp Cloud API (opțional)"
            description="Configurare alternativă Meta Business Cloud. Livrarea automată folosește sesiunea WhatsApp Web de mai sus."
            onSave={() => void save('whatsapp', whatsapp)}
            isPending={updateSection.isPending}
            message={saveMessage}
            error={saveError}
          >
            <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={whatsapp.enabled} onChange={(e) => setWhatsapp({ ...whatsapp, enabled: e.target.checked })} />Activează WhatsApp din setări</label>
            <Field label="Phone Number ID"><input className={inputClassName} value={whatsapp.phone_number_id} onChange={(e) => setWhatsapp({ ...whatsapp, phone_number_id: e.target.value })} /></Field>
            <Field label="Business Account ID"><input className={inputClassName} value={whatsapp.business_account_id} onChange={(e) => setWhatsapp({ ...whatsapp, business_account_id: e.target.value })} placeholder="Meta Business Account ID (opțional)" /></Field>
            <Field label="Access Token"><input type="password" className={inputClassName} value={whatsapp.access_token} onChange={(e) => setWhatsapp({ ...whatsapp, access_token: e.target.value })} placeholder="********" /></Field>
            <Field label="API Version"><input className={inputClassName} value={whatsapp.api_version} onChange={(e) => setWhatsapp({ ...whatsapp, api_version: e.target.value })} /></Field>
          </SettingsSection>
        </>
      ) : null}

      {activeSection === CLINIC_SETTINGS_SECTIONS.AI && ai ? (
        <SettingsSection
          title="AI Screening Assistant"
          description="Configurați providerul AI pentru transcriere și extragere structurată în conversația de screening."
          onSave={() => void save('ai', ai)}
          isPending={updateSection.isPending}
          message={saveMessage}
          error={saveError}
        >
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={ai.enabled} onChange={(e) => setAi({ ...ai, enabled: e.target.checked })} />
            Activează asistentul AI
          </label>
          <Field label="Provider">
            <select
              className={inputClassName}
              value={ai.provider}
              onChange={(e) => setAi({ ...ai, provider: e.target.value as AiSettings['provider'] })}
            >
              <option value="none">Dezactivat</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="azure_openai">Azure OpenAI</option>
            </select>
          </Field>
          <Field label="Model extragere">
            <input className={inputClassName} value={ai.model} onChange={(e) => setAi({ ...ai, model: e.target.value })} />
          </Field>
          <Field label="Model transcriere">
            <input
              className={inputClassName}
              value={ai.transcription_model ?? ''}
              onChange={(e) => setAi({ ...ai, transcription_model: e.target.value || null })}
              placeholder="whisper-1 / gemini-1.5-flash"
            />
          </Field>
          <Field label="API Key">
            <input
              type="password"
              className={inputClassName}
              value={ai.api_key}
              onChange={(e) => setAi({ ...ai, api_key: e.target.value })}
              placeholder="********"
            />
          </Field>
          <Field label="API Base URL (Azure / custom)">
            <input
              className={inputClassName}
              value={ai.api_base_url ?? ''}
              onChange={(e) => setAi({ ...ai, api_base_url: e.target.value || null })}
              placeholder="https://your-resource.openai.azure.com"
            />
          </Field>
          <Field label="Deployment name (Azure)">
            <input
              className={inputClassName}
              value={ai.deployment_name ?? ''}
              onChange={(e) => setAi({ ...ai, deployment_name: e.target.value || null })}
            />
          </Field>
        </SettingsSection>
      ) : null}

      {activeSection === CLINIC_SETTINGS_SECTIONS.APPLICATION && application ? (
        <SettingsSection title="Setări sistem" description="Preferințe generale ale aplicației." onSave={() => void save('application', application)} isPending={updateSection.isPending} message={saveMessage} error={saveError}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Locale"><input className={inputClassName} value={application.default_locale} onChange={(e) => setApplication({ ...application, default_locale: e.target.value })} /></Field>
            <Field label="Email suport"><input className={inputClassName} value={application.support_email} onChange={(e) => setApplication({ ...application, support_email: e.target.value })} /></Field>
            <Field label="Timeout sesiune (ore)"><input type="number" className={inputClassName} value={application.session_timeout_hours} onChange={(e) => setApplication({ ...application, session_timeout_hours: Number(e.target.value) })} /></Field>
            <Field label="Semnătură livrare"><input className={inputClassName} value={application.delivery_signature} onChange={(e) => setApplication({ ...application, delivery_signature: e.target.value })} /></Field>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={application.enable_offline_sync} onChange={(e) => setApplication({ ...application, enable_offline_sync: e.target.checked })} />Activează sincronizarea offline</label>
        </SettingsSection>
      ) : null}
    </div>
  );
}
