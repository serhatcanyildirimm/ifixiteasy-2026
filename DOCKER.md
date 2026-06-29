# Docker setup (PostgreSQL + Mailpit)

## 1) Start containers

```powershell
docker compose up -d
```

Dit start PostgreSQL en **Mailpit** (lokale test-mailserver).

## 2) Check status

```powershell
docker compose ps
```

Wacht tot de database-service `healthy` is.

## 3) Zorg dat je `.env` matcht

Gebruik deze waarde in je `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ifixiteasy
```

## 4) Mail (Mailpit)

SMTP voor de app:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
MAIL_FROM=noreply@ifixiteasy.nl
MAIL_ADMIN=admin@ifixiteasy.nl
```

- **Web UI (inbox):** http://localhost:8025
- **SMTP:** `localhost:1025`

Testmail sturen:

```powershell
npm run mail:test
```

Bij een nieuwe afspraak of statuswijziging verschijnen mails in Mailpit (niet echt verzonden).

## 5) Start de app

```powershell
npm run dev
```

## 6) Stoppen

```powershell
docker compose down
```

## 7) Volledig resetten (alle data weg)

```powershell
docker compose down -v
```
