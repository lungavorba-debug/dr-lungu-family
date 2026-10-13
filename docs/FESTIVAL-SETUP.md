# MedScreen Festival — ghid de teren (conectare LAN / hotspot)

Acest ghid este pentru laptopul care rulează serverul local la festival, când folosești **hotspot de pe telefon** (posibil alternând între mai multe telefoane).

---

## Înainte de primul festival (o singură dată)

### 1. Configurează firewall-ul Windows (Administrator)

Deschide **PowerShell ca Administrator** în folderul proiectului și rulează:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/ensure-dev-firewall.ps1
```

Ce face scriptul:
- creează reguli permanente pentru porturile **3001** (API) și **5173** (web), valabile pe **toate** profilurile de rețea (Public + Private);
- setează rețelele Wi-Fi active de tip **Public** → **Private** (Windows blochează implicit conexiunile primite pe rețele Public).

> La fiecare `npm run dev`, scriptul este invocat automat (`predev`). Dacă nu rulezi ca Admin, vei vedea un avertisment — rulează manual comanda de mai sus **înainte de festival**.

### 2. Verifică instalarea

```bash
npm run festival:check
```

Trebuie să treacă toate testele LAN (health, CORS, login).

---

## La fiecare pornire la festival

### Pas 1 — Pornește hotspot-ul pe telefon

- Notează numele rețelei Wi-Fi și parola.
- Ține telefonul conectat la rețea mobilă (4G/5G) dacă ai nevoie de internet pentru email/WhatsApp.

### Pas 2 — Conectează laptopul la hotspot

- Conectează laptopul la **același** Wi-Fi/hotspot pe care îl vor folosi tabletele/telefoanele voluntarilor.
- Dacă Windows întreabă tipul rețelei, alege **Private** (Rețea privată).

### Pas 3 — Pornește serverul

```bash
npm run dev
```

Așteaptă mesajul **„MedScreen Festival — conectare telefon / tabletă”** în terminal.

Notează:
- **Mobile login:** `http://192.168.x.x:5173/login`
- **Connect page (laptop):** `http://localhost:5173/connect`

În terminal apare și un **cod QR ASCII**; fișierul `.dev/festival-connect-qr.png` este salvat automat.

### Pas 4 — Afișează codul QR voluntarilor

**Varianta recomandată:** pe laptop deschide în browser:

```
http://localhost:5173/connect
```

Pagina arată un **cod QR mare**. Voluntarii scanează cu camera telefonului → deschid pagina de login MedScreen.

**Nu** e nevoie să tasteze IP-ul manual.

### Pas 5 — Conectează fiecare telefon/tabletă

1. Telefonul trebuie pe **același Wi-Fi** ca laptopul.
2. Scanează QR de pe `/connect` (sau din terminal).
3. Autentifică-te cu contul de operator.

---

## Dacă schimbi hotspot-ul (alt telefon)

1. Oprește serverul (`Ctrl+C`).
2. Conectează laptopul la noul hotspot.
3. Repornește: `npm run dev`.
4. IP-ul se schimbă — **codul QR se regenerează automat**.
5. Reîmprospătează pagina `/connect` pe laptop (buton sau F5).

---

## Checklist rapid — voluntarul nu se poate conecta

| Verificare | Ce faci |
|------------|---------|
| **Același Wi-Fi?** | Telefonul și laptopul trebuie pe același hotspot. Nu folosi date mobile pe telefon dacă laptopul e pe Wi-Fi. |
| **Server pornit?** | În terminal trebuie să vezi „MedScreen Festival — conectare telefon / tabletă”. |
| **IP corect?** | Deschide `/connect` pe laptop — folosește QR-ul afișat acolo, nu un IP vechi. |
| **Firewall?** | Rulează `npm run festival:firewall` ca Administrator sau refă pasul „Înainte de primul festival”. |
| **Rețea Public?** | Setări Windows → Wi-Fi → Proprietăți → **Private**. |
| **Port blocat?** | `npm run verify:dev` — toate cele 3 probe trebuie ✓. |
| **Test complet** | `npm run festival:check` pe laptop. |
| **Baza de date / login eșuează** | Verifică `MEDSCREEN_DB_MODE=local` în `.env` la festival (fără internet). Repornește `npm run dev`. |

---

## Bază de date: local vs Supabase (festival)

MedScreen poate folosi **două baze separate**:

| Bază | Unde | Ce conține |
|------|------|------------|
| **Local** (Docker, port 5433) | Laptopul de la festival | Screening-urile din sesiunea curentă |
| **Cloud** (Supabase) | Internet | Rapoarte vechi (ex. 21–23.08.2026) |

**La festival fără internet**, Supabase nu este accesibil (`ENOTFOUND`). Setează în `.env`:

```env
MEDSCREEN_DB_MODE=local
```

**Acasă / cu internet stabil**, pentru rapoarte vechi:

```env
MEDSCREEN_DB_MODE=cloud
```

sau `auto` (încearcă cloud, apoi local dacă e indisponibil).

> **Important:** Local și cloud sunt baze **distincte**. Nu se văd simultan rapoartele vechi și cele noi de la festival fără o sincronizare explicită (export din cloud → import în local, **fără** `db:reset` / `db:push` pe producție).

---

## Comenzi utile

| Comandă | Scop |
|---------|------|
| `npm run dev` | Pornește API + web, afișează QR și adresa LAN |
| `npm run verify:dev` | Verifică health API, web, proxy |
| `npm run festival:check` | Firewall + test LAN complet (inclusiv login) |
| `npm run festival:firewall` | Re-aplică reguli firewall (Admin) |

---

## De ce nu mergea uneori (explicație scurtă)

1. **Windows Firewall + rețea Public** — hotspot-urile noi sunt adesea „Public”; conexiunile primite pe porturile 3001/5173 sunt blocate chiar dacă IP-ul e corect.
2. **IP greșit afișat** — adaptoare virtuale (Hyper-V, WSL, VMware) pot apărea ca adrese LAN; acum sunt filtrate, se preferă `192.168.x.x` de la Wi-Fi real.
3. **IP vechi după schimbare hotspot** — normal; repornește `npm run dev` și folosește QR nou de pe `/connect`.

---

## Contact tehnic

Dacă `npm run festival:check` eșuează după pașii de mai sus, notează mesajul din terminal și adresa afișată pe `/connect` înainte de a continua screening-ul.
