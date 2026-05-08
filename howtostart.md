Local database:

```powershell
docker compose up -d
```

Local backend:

```powershell
cd C:\Users\super\Desktop\speedtyper\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

Local frontend:

```powershell
cd C:\Users\super\Desktop\speedtyper\frontend
npm install
npm run dev
```

VPS production:

```bash
git pull
sudo docker compose -f docker-compose.prod.yml up -d --build
```



