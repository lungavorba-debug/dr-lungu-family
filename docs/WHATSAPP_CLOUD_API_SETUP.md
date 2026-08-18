# WhatsApp Cloud API — Configurare și verificare OTP

Ghid pentru trimiterea rapoartelor MedScreen prin **Meta WhatsApp Business Cloud API**.

Documentație complementară: [GMAIL setup](./GMAIL_APP_PASSWORD_SETUP.md) pentru email.

## Variabile de mediu

Adaugă în `apps/api/.env`:

```env
WHATSAPP_PHONE_NUMBER_ID=          # Phone number ID (NU WABA ID)
WHATSAPP_ACCESS_TOKEN=             # Token permanent recomandat în producție
WHATSAPP_BUSINESS_ACCOUNT_ID=      # Opțional
WHATSAPP_API_VERSION=v21.0
WHATSAPP_VERIFY_TOKEN=             # Generat automat la primul start API dacă lipsește
```

## Finalizarea verificării OTP/SMS în Meta Dashboard

Urmează pașii de mai jos până când `code_verification_status` devine **VERIFIED** și statusul numărului este **CONNECTED**.

### 1. Accesează panoul Meta

1. Deschide [Meta for Developers](https://developers.facebook.com/apps/)
2. Selectează aplicația MedScreen
3. Meniul stânga: **WhatsApp** → **API Setup**

### 2. Adaugă / verifică numărul business (expeditor)

1. În secțiunea **Phone numbers**, confirmă că numărul clinicii apare (ex: +40 755 …)
2. Dacă lipsește: **Add phone number** → introdu numărul → continuă wizard-ul
3. Meta trimite **OTP prin SMS sau apel vocal** — introdu codul în dashboard
4. Dacă numărul are verificare în doi pași (2FA), notează **PIN-ul** — poate fi necesar la înregistrarea Cloud API
5. Așteaptă status **CONNECTED** pentru număr

### 3. Copiază credentialele în `.env`

Din **API Setup**:

| Câmp dashboard        | Variabilă `.env`              |
|-----------------------|-------------------------------|
| Phone number ID       | `WHATSAPP_PHONE_NUMBER_ID`    |
| Temporary access token| `WHATSAPP_ACCESS_TOKEN` (temp)|
| WhatsApp Business Account ID | `WHATSAPP_BUSINESS_ACCOUNT_ID` (opțional) |

**Important:** `WHATSAPP_PHONE_NUMBER_ID` este ID-ul de ~15 cifre de lângă număr, **nu** ID-ul contului WABA.

### 4. Token permanent (producție)

1. [Meta Business Settings](https://business.facebook.com/settings) → **Users** → **System users**
2. Creează / selectează system user → **Generate token**
3. Alege aplicația → permisiuni `whatsapp_business_messaging`, `whatsapp_business_management`
4. Copiază token-ul în `WHATSAPP_ACCESS_TOKEN`

### 5. Numere de test (mod Development)

Cât timp aplicația este în **Development**, mesajele se trimit **doar** către numere adăugate explicit:

1. **WhatsApp** → **API Setup**
2. Secțiunea **Send messages to** / **To** (test phone numbers)
3. **Add phone number** → introdu numărul destinatar cu prefix internațional: `+407xxxxxxxx`
4. Destinatarul primește cod pe WhatsApp — confirmă în dashboard

### 6. Verificare locală

```bash
# Verifică credentiale + status înregistrare (Graph API)
npm run verify:whatsapp

# Verifică endpoint health (API trebuie pornit)
npm run verify:whatsapp:health
```

Endpoint HTTP:

```
GET http://localhost:3001/api/webhooks/meta/whatsapp/health
```

Răspuns așteptat când totul e OK:

```json
{
  "status": "ok",
  "provider": "WhatsApp Cloud API",
  "registrationStatus": "CONNECTED",
  "graphReachable": true,
  "issues": [],
  "warnings": []
}
```

## Eroarea (#133010) Account not registered

Această eroare apare când:

- Numărul **expeditor** nu are verificarea OTP/SMS finalizată (`code_verification_status: NOT_VERIFIED`), sau
- Numărul **destinatar** nu este în lista de test (mod Development), sau
- `WHATSAPP_PHONE_NUMBER_ID` / token-ul sunt incorecte

MedScreen returnează un mesaj clar în UI și loghează detalii în consola API (`[whatsapp:cloud]`).

## Format număr destinatar (Graph API)

Payload-ul JSON către Meta folosește câmpul `to` **fără** caracterul `+` și **fără** spații:

| Introducere UI   | Trimis la Graph API |
|------------------|---------------------|
| `0755 754 545`   | `40755754545`       |
| `+40755123456`   | `40755123456`       |

Conversia este automată în cod (`toWhatsAppGraphRecipient`).

## Alternative: WhatsApp Web (dev)

Pentru teste locale fără Cloud API:

1. Pornește API-ul
2. Deschide `http://localhost:3001/qr`
3. Scanează QR cu WhatsApp de pe telefon

Dacă sesiunea Web este activă, MedScreen o folosește în locul Cloud API.

## Webhook (opțional)

```
GET/POST /api/webhooks/meta/whatsapp
Verify token: WHATSAPP_VERIFY_TOKEN din apps/api/.env
```

Callback URL afișat la pornirea API-ului în logurile `[whatsapp]`.
