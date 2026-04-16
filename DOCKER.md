# Docker setup (PostgreSQL)

## 1) Start PostgreSQL container

```powershell
docker compose up -d
```

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

## 4) Start de app

```powershell
npm run dev
```

## 5) Stoppen

```powershell
docker compose down
```

## 6) Volledig resetten (alle data weg)

```powershell
docker compose down -v
```
