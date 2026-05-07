# Typing King VPS Deploy

Production setup for Ubuntu 22.04 VPS:

- `caddy` receives HTTP/HTTPS traffic and automatically creates SSL certificates.
- `frontend` serves the React/Vite build through Nginx.
- `backend` runs FastAPI/Uvicorn.
- `db` runs PostgreSQL with a persistent Docker volume.

## Domains

Create DNS records:

- `webproject.id.lv` -> VPS IPv4 address
- `api.webproject.id.lv` -> VPS IPv4 address

Both records should point to the same server.

## Server Setup

```bash
sudo apt update
sudo apt upgrade -y

sudo apt install -y ca-certificates curl git ufw

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## Deploy

Upload or clone the project to the server, then run:

```bash
cd ~/speedtyper
cp .env.production.example .env
nano .env
```

Change passwords and secrets in `.env`, then start:

```bash
sudo docker compose -f docker-compose.prod.yml up -d --build
sudo docker compose -f docker-compose.prod.yml ps
```

Logs:

```bash
sudo docker compose -f docker-compose.prod.yml logs -f
```

Update after code changes:

```bash
git pull
sudo docker compose -f docker-compose.prod.yml up -d --build
```
