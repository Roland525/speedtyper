# Быстрый запуск

## 1. PostgreSQL

```powershell
cd C:\Users\super\Desktop\speedtyper
docker compose up -d
```

## 2. Backend

Первый раз:

```powershell
cd C:\Users\super\Desktop\speedtyper\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Каждый запуск:

```powershell
cd C:\Users\super\Desktop\speedtyper\backend
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

## 3. Frontend

Первый раз:

```powershell
cd C:\Users\super\Desktop\speedtyper\frontend
npm install
```

Каждый запуск:

```powershell
cd C:\Users\super\Desktop\speedtyper\frontend
npm run dev
```

Если PowerShell ругается на `npm.ps1`, используй:

```powershell
npm.cmd run dev
```

Приложение откроется на:

```text
http://127.0.0.1:5173/
```
