# Email Production Setup — Gmail SMTP

This guide configures MedScreen to send real screening report emails from the clinic Gmail account.

## Prerequisites

- Gmail account: `drlungufamily@gmail.com`
- Gmail App Password (see [GMAIL_APP_PASSWORD_SETUP.md](./GMAIL_APP_PASSWORD_SETUP.md))
- API server with access to `apps/api/.env`

## Environment variables

Add these to `apps/api/.env` (or your production secret store):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=drlungufamily@gmail.com
SMTP_PASS=<your-16-character-app-password>

SMTP_FROM_NAME=Dr. Lungu Family
SMTP_FROM_EMAIL=drlungufamily@gmail.com
```

Optional:

```env
# Override delivery test recipient (defaults to SMTP_FROM_EMAIL)
E2E_TEST_EMAIL_TO=your-test-inbox@example.com
```

## Behavior

| Condition | Email transport |
|-----------|-----------------|
| `SMTP_HOST` is set | Gmail (or configured SMTP) |
| `SMTP_HOST` is missing | Ethereal (development only, via E2E scripts) |

The sender address is always built from `SMTP_FROM_NAME` + `SMTP_FROM_EMAIL` (or legacy `SMTP_FROM`). Nothing is hardcoded in application code.

## Clinic settings vs environment

Environment variables take effect when clinic SMTP is not fully configured in the admin UI. If clinic settings already define `host` and `from`, those are used first; missing `from` falls back to env.

For production, prefer env-based configuration so credentials are not stored in the database.

## Logging

Every send attempt is logged as structured JSON:

```json
{
  "event": "email_delivery",
  "recipient": "participant@example.com",
  "subject": "Raport screening — Dr. Lungu Family",
  "sender": "\"Dr. Lungu Family\" <drlungufamily@gmail.com>",
  "smtpHost": "smtp.gmail.com",
  "success": true,
  "smtpResponse": "250 2.0.0 OK ...",
  "error": null,
  "timestamp": "2026-07-31T12:00:00.000Z"
}
```

Check API server stdout/stderr for `[email]` lines.

## Frontend success message

After a successful send, the operator sees:

```
✅ Email trimis cu succes

Destinatar:
participant@example.com

Expeditor:
Dr. Lungu Family <drlungufamily@gmail.com>

Ora:
31 iul. 2026, 15:30
```

If SMTP fails, the actual error message is shown — no fake success.

## Verification

1. **Connection and auth**

   ```bash
   node scripts/verify-gmail-smtp.mjs
   ```

2. **Full workflow (with API + web running)**

   ```bash
   node scripts/verify-full-workflow-e2e.mjs
   ```

   When `SMTP_HOST` is set in `apps/api/.env`, the E2E script uses Gmail instead of Ethereal.

3. **Unit tests**

   ```bash
   tsx apps/api/src/application/delivery/test-build-delivery-message.ts
   npm run build:packages
   ```

## Production checklist

- [ ] App Password created and stored securely
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` set in production env
- [ ] `SMTP_FROM_NAME` and `SMTP_FROM_EMAIL` set
- [ ] `WEB_APP_URL` set to public clinic URL (for report links in email)
- [ ] `verify-gmail-smtp.mjs` passes
- [ ] Test email received with PDF attachment, HTML body, logo, and Romanian characters
- [ ] API logs show `success: true` with Gmail SMTP response

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `Invalid login` | Wrong App Password or 2FA not enabled |
| `Connection timeout` | Firewall blocking port 587 |
| `Sender not configured` | Missing `SMTP_FROM_NAME` / `SMTP_FROM_EMAIL` |
| Email not received | Check spam; verify recipient |
| `Livrarea prin email nu este configurată` | Restart API after env change; confirm `SMTP_HOST` is set |

See [GMAIL_APP_PASSWORD_SETUP.md](./GMAIL_APP_PASSWORD_SETUP.md) for App Password creation steps.
