# Docker setup (MySQL)

## 1) Start MySQL container

```powershell
docker compose up -d
```

## 2) Check status

```powershell
docker compose ps
```

Wacht tot de `mysql` service `healthy` is.

## 3) Zorg dat je `.env` matcht

Gebruik deze waarden in je `.env`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root123
DB_NAME=ifixiteasy
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
