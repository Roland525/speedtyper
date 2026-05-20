# Typing King

Typing King - учебное веб-приложение для тренировки скорости печати.

Пользователь выбирает режим на 15, 30, 60 или 120 секунд и язык текста: EN, RU или LV. Во время игры приложение считает скорость печати, точность и количество ошибок. Если пользователь вошел в аккаунт, результат сохраняется в базе данных и попадает в таблицу лидеров.

## Возможности

- тренировка печати на трех языках;
- режимы игры на 15, 30, 60 и 120 секунд;
- расчет WPM, accuracy, ошибок и введенных символов;
- регистрация и авторизация пользователя;
- автоматическое сохранение результата после игры;
- таблица лидеров с фильтрами по режиму и языку.

## Технологии

- Frontend: React, Vite, JavaScript, CSS;
- Backend: Python, FastAPI, SQLAlchemy, Pydantic, JWT;
- Database: PostgreSQL через Docker Compose.

## Структура проекта

```text
speedtyper/
  backend/          FastAPI backend
  frontend/         React/Vite frontend
  docker-compose.yml локальная PostgreSQL база
  howtostart.md     короткая инструкция запуска
  AIZSTAVESANAS_TEMAS.md темы для защиты
```

## Подготовка к защите

Файл `AIZSTAVESANAS_TEMAS.md` содержит основные теоретические темы и объясняет, как они связаны с проектом. Там отдельно отмечено, что реально используется в коде, что используется частично, а что можно объяснить только теоретически.

## Первый запуск

Нужны Docker Desktop, Node.js и Python 3.

Установить зависимости backend:

```powershell
cd C:\Users\super\Desktop\speedtyper\backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Установить зависимости frontend:

```powershell
cd C:\Users\super\Desktop\speedtyper\frontend
npm install
```

Если PowerShell блокирует `npm`, используй `npm.cmd install`.

## Запуск для демонстрации

Терминал 1, база данных:

```powershell
cd C:\Users\super\Desktop\speedtyper
docker compose up -d
```

Терминал 2, backend:

```powershell
cd C:\Users\super\Desktop\speedtyper\backend
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Терминал 3, frontend:

```powershell
cd C:\Users\super\Desktop\speedtyper\frontend
npm run dev
```

Если PowerShell блокирует `npm`, запускай так:

```powershell
npm.cmd run dev
```

Открыть приложение:

```text
http://127.0.0.1:5173/
```

Проверка backend:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/docs
```

## Остановка базы

```powershell
cd C:\Users\super\Desktop\speedtyper
docker compose down
```
