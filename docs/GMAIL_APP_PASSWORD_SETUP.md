# Gmail App Password Setup

MedScreen sends email through Gmail SMTP using an **App Password**, not your regular Gmail password.

## Requirements

- Google account: `drlungufamily@gmail.com`
- **2-Step Verification** enabled on the account

## Steps

### 1. Enable 2-Step Verification

1. Open [Google Account Security](https://myaccount.google.com/security)
2. Under **How you sign in to Google**, select **2-Step Verification**
3. Follow the prompts to enable it (phone or authenticator app)

### 2. Create an App Password

1. Go to [App passwords](https://myaccount.google.com/apppasswords)
   - If the link is unavailable, search "App passwords" from the Security page (only visible when 2-Step Verification is on)
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → enter `MedScreen Production`
4. Click **Generate**
5. Copy the **16-character password** (spaces are ignored when pasted into `.env`)

### 3. Configure MedScreen

In `apps/api/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=drlungufamily@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx

SMTP_FROM_NAME=Dr. Lungu Family
SMTP_FROM_EMAIL=drlungufamily@gmail.com
```

Replace `xxxx xxxx xxxx xxxx` with your App Password (with or without spaces).

### 4. Verify

Restart the API server, then run:

```bash
node scripts/verify-gmail-smtp.mjs
```

Expected: `"status": "passed"` with `connection_and_auth` and `send_email` both passing.

## Security notes

- Never commit `SMTP_PASS` to git — keep it only in `.env` or your secret manager
- Revoke unused App Passwords from the same Google Security page
- Use a dedicated App Password per environment (staging vs production)
- If the password is exposed, revoke it immediately and generate a new one

## Common errors

| Error | Fix |
|-------|-----|
| `App passwords` menu missing | Enable 2-Step Verification first |
| `Username and Password not accepted` | Regenerate App Password; confirm `SMTP_USER` matches the Gmail address |
| `Less secure app access` | Not used — App Passwords replace this deprecated flow |

For full production deployment, see [EMAIL_PRODUCTION_SETUP.md](./EMAIL_PRODUCTION_SETUP.md).
