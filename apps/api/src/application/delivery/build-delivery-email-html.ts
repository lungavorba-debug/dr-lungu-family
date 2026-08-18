import { EMAIL_LOGO_CID } from './delivery-email-assets.ts';
import { DELIVERY_EMAIL_LINKS, resolveBookingUrl } from './delivery-email-links.ts';

export const EMAIL_AUTO_FOOTER =
  'Acest email a fost generat automat de Clinica Dr. Lungu Family.\nDo not reply to this email.';

export const EMAIL_MEDICAL_DISCLAIMER =
  'Acest raport nu înlocuiește un consult medical de specialitate. Dacă raportul evidențiază valori modificate, vă recomandăm programarea unui consult.';

/** Official clinic green from brand assets. */
const BRAND_GREEN = '#38A645';
const BRAND_NAVY = '#003D5B';

export interface DeliveryEmailTemplateInput {
  greetingName: string;
  reportUrl: string | null;
  onlineReportEnabled: boolean;
  clinicHeading: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicWebsite: string | null;
  availableSpecialties: readonly string[];
  comingSoonSpecialties: readonly string[];
  consultationRecommendation: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderListItems(items: readonly string[]): string {
  return items
    .map(
      (item) =>
        `<li style="margin:0 0 8px 0;color:#334155;font-size:15px;line-height:1.5;">${escapeHtml(item)}</li>`,
    )
    .join('');
}

function renderPrimaryButton(label: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
    <tr>
      <td align="center" bgcolor="${BRAND_GREEN}" style="border-radius:999px;">
        <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function renderSecondaryButton(label: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
    <tr>
      <td align="center" style="border:2px solid ${BRAND_NAVY};border-radius:999px;">
        <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 30px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:${BRAND_NAVY};text-decoration:none;border-radius:999px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function renderSocialLinks(): string {
  const links = [
    { label: 'Facebook', href: DELIVERY_EMAIL_LINKS.facebook },
    { label: 'Instagram', href: DELIVERY_EMAIL_LINKS.instagram },
    { label: 'TikTok', href: DELIVERY_EMAIL_LINKS.tiktok },
  ];

  const items = links
    .map(
      (link, index) =>
        `${index > 0 ? '<span style="color:#cbd5e1;padding:0 10px;">•</span>' : ''}<a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer" style="color:${BRAND_NAVY};text-decoration:none;font-size:14px;font-weight:600;">${escapeHtml(link.label)}</a>`,
    )
    .join('');

  return `<p style="margin:0;font-size:14px;line-height:1.8;text-align:center;">${items}</p>`;
}

export function buildDeliveryEmailHtml(input: DeliveryEmailTemplateInput): string {
  const greetingName = escapeHtml(input.greetingName);
  const clinicHeading = escapeHtml(input.clinicHeading);
  const clinicAddress = escapeHtml(input.clinicAddress);
  const clinicPhone = escapeHtml(input.clinicPhone);
  const clinicWebsite = input.clinicWebsite
    ? escapeHtml(input.clinicWebsite.startsWith('http') ? input.clinicWebsite : `https://${input.clinicWebsite}`)
    : escapeHtml(DELIVERY_EMAIL_LINKS.website);
  const consultation = escapeHtml(input.consultationRecommendation);
  const reportUrl = input.onlineReportEnabled && input.reportUrl ? escapeHtml(input.reportUrl) : null;
  const bookingUrl = escapeHtml(resolveBookingUrl());

  const onlineIntro = reportUrl
    ? `<p style="margin:0;font-size:15px;line-height:1.7;color:#334155;text-align:center;">
                Raportul dumneavoastră este disponibil online:
              </p>`
    : '';

  const actionButtons = reportUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0 0 0;">
        <tr>
          <td align="center" style="padding-bottom:14px;">
            ${renderPrimaryButton('Vezi raportul online', reportUrl)}
          </td>
        </tr>
        <tr>
          <td align="center">
            ${renderSecondaryButton('Programează-te', bookingUrl)}
          </td>
        </tr>
      </table>`
    : input.onlineReportEnabled
      ? `<p style="margin:28px 0 0 0;color:#64748b;font-size:15px;line-height:1.6;text-align:center;">Raportul online nu este disponibil momentan.</p>
       <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0 0 0;">
         <tr><td align="center">${renderSecondaryButton('Programează-te', bookingUrl)}</td></tr>
       </table>`
      : `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0 0 0;">
         <tr><td align="center">${renderSecondaryButton('Programează-te', bookingUrl)}</td></tr>
       </table>`;

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Raport medical – Screening Cardiovascular</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f5f9;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background-color:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 8px 24px rgba(15,23,42,0.06);">
          <tr>
            <td align="center" style="padding:40px 32px 20px 32px;background-color:#ffffff;">
              <img src="cid:${EMAIL_LOGO_CID}" alt="Dr. Lungu Family" width="220" style="display:block;width:220px;max-width:78%;height:auto;border:0;margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:4px 36px 0 36px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
              <p style="margin:0 0 16px 0;font-size:18px;line-height:1.5;font-weight:700;">Bună ziua, ${greetingName}!</p>
              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
                Vă mulțumim pentru participarea la Campania de Screening Cardiovascular.
              </p>
              ${onlineIntro}
              ${actionButtons}
              <p style="margin:28px 0 0 0;font-size:15px;line-height:1.7;color:#334155;">
                Raportul PDF este atașat acestui mesaj.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 36px 8px 36px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 12px 0;font-size:17px;line-height:1.4;font-weight:700;color:${BRAND_NAVY};">${clinicHeading}</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr><td style="padding:4px 0;color:#334155;font-size:15px;line-height:1.5;">📍 ${clinicAddress}</td></tr>
                      <tr><td style="padding:4px 0;color:#334155;font-size:15px;line-height:1.5;">📞 ${clinicPhone}</td></tr>
                      <tr><td style="padding:4px 0;color:#334155;font-size:15px;line-height:1.5;">🌐 <a href="${clinicWebsite}" target="_blank" rel="noopener noreferrer" style="color:${BRAND_NAVY};text-decoration:none;">${clinicWebsite.replace(/^https?:\/\//, '')}</a></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 36px 0 36px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 12px 0;font-size:16px;line-height:1.4;font-weight:700;color:${BRAND_NAVY};">Specialități disponibile</p>
              <ul style="margin:0;padding:0 0 0 20px;">${renderListItems(input.availableSpecialties)}</ul>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 36px 0 36px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 12px 0;font-size:16px;line-height:1.4;font-weight:700;color:${BRAND_NAVY};">În curând:</p>
              <ul style="margin:0;padding:0 0 0 20px;">${renderListItems(input.comingSoonSpecialties)}</ul>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 36px 0 36px;font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fffbeb;border-radius:12px;border:1px solid #fde68a;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#78350f;">${consultation}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 36px 8px 36px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 8px 0;font-size:15px;line-height:1.7;color:#334155;font-weight:600;">Vă mulțumim pentru încrederea acordată!</p>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#334155;">Echipa Dr. Lungu Family</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 36px 12px 36px;font-family:Arial,Helvetica,sans-serif;border-top:1px solid #e2e8f0;">
              ${renderSocialLinks()}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 36px 32px 36px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 8px 0;font-size:12px;line-height:1.6;color:#64748b;text-align:center;">
                Acest email a fost generat automat de Clinica Dr. Lungu Family.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;text-align:center;font-style:italic;">
                Do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
