# Live zetten op DirectAdmin (PHP + MySQL)

De backend is herschreven naar **PHP + MySQL** zodat hij op je DirectAdmin-hosting
draait, naast de bestaande statische frontend. De frontend is **niet** gewijzigd:
hij blijft `/api/...` aanroepen, en die verzoeken worden nu door PHP afgehandeld.

## Wat draait waar

| Onderdeel        | Locatie                                  |
|------------------|------------------------------------------|
| Frontend         | statische bestanden in `public_html`     |
| Backend (API)    | `public_html/api/` (PHP)                 |
| Database         | MySQL `ifixit_NEWDB` (via phpMyAdmin)    |
| Uploads          | `public_html/server/uploads/`            |

De Node.js-backend (`server/*.js`, `docker-compose.yml`, `package.json`) is op de
VPS **niet** meer nodig en hoef je daar niet te uploaden.

---

## Stap 1 — Database importeren

1. Open **phpMyAdmin** in DirectAdmin en selecteer de database **`ifixit_NEWDB`**.
2. Tabblad **Importeren** → kies het bestand **`db/mysql_schema.sql`** uit dit project.
3. Klik **Starten**.

Dit maakt alle tabellen aan, vult de reparatietypes, en maakt het standaard
admin-account:

- **E-mail:** `admin@ifixiteasy.nl`
- **Wachtwoord:** `Admin123!`  → **verander dit** na de eerste login.

---

## Stap 2 — Bestanden uploaden naar `public_html`

Upload (via DirectAdmin Bestandsbeheer of FTP) naar de **webroot** (`public_html`):

```
index.html
afspraak.html
assets/          (volledige map)
admin/           (volledige map)
api/             (volledige map  ← de nieuwe PHP-backend)
```

De map `server/uploads/` wordt automatisch aangemaakt zodra je de eerste
afbeelding upload via het admin-panel (zorg dat `public_html` schrijfbaar is).

> De databasegegevens en JWT-secret staan al ingevuld in `api/config.php`.
> Klopt de databasenaam/gebruiker/wachtwoord niet meer? Pas ze daar aan.

---

## Stap 3 — Testen

1. **Database-verbinding:** open in je browser
   `https://ifixiteasy.nl/api/health`
   → je hoort `{"ok":true}` te zien (JSON, niet de homepage).

2. **Afspraakformulier:** maak op de site een testafspraak aan.
   → je krijgt een bevestiging, en de afspraak verschijnt in het admin-panel.

3. **Admin-panel:** ga naar `https://ifixiteasy.nl/admin/`, log in met het
   account hierboven, en controleer dashboard, telefoons en beschikbaarheid.

---

## Mogelijke aandachtspunten

- **`/api/health` toont nog steeds de homepage** → de `.htaccess` in `api/` wordt
  niet uitgevoerd. Controleer of `mod_rewrite` aanstaat (standaard op DirectAdmin)
  en of het bestand `api/.htaccess` echt is geüpload (verborgen bestand!).
- **Admin-login geeft "Niet ingelogd" / 401** → de `Authorization`-header komt niet
  door. De meegeleverde `api/.htaccess` regelt dit; controleer dat hij aanwezig is.
- **PATCH/DELETE werkt niet** → sommige hosts blokkeren deze methodes via
  mod_security. Vraag dan solution24.nl om ze toe te staan.
- **E-mail komt niet aan** → PHP `mail()` is op shared hosting wisselvallig.
  Pas afzender/ontvanger aan in `api/config.php` (`mail`-sectie), of zet
  `'enabled' => false` om mailen uit te schakelen (afspraken blijven werken).

---

## Lokaal blijven ontwikkelen (optioneel)

De oude Node.js-backend blijft in de repo staan en werkt lokaal nog steeds met
Docker (zie `DOCKER.md`). De PHP-backend is puur voor de DirectAdmin-hosting.
