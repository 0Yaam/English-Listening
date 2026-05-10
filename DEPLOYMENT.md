# Deploy English Listening len VPS

Huong dan nay dung cho Ubuntu VPS, chay app bang Docker Compose va tu dong deploy bang GitHub Actions khi push len branch `main`.

## 1. Chuan bi VPS

Dang nhap VPS:

```bash
ssh root@IP_CUA_VPS
```

Cap nhat may va cai goi can thiet:

```bash
apt update && apt upgrade -y
apt install -y git curl ca-certificates ufw
```

Cai Docker:

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

Tao user deploy rieng:

```bash
adduser deploy
usermod -aG docker deploy
mkdir -p /opt/english-listening
chown -R deploy:deploy /opt/english-listening
```

Mo firewall cho SSH va cong app mac dinh:

```bash
ufw allow OpenSSH
ufw allow 18081/tcp
ufw enable
```

Sau buoc nay app se chay bang IP:

```text
http://IP_CUA_VPS:18081
```

## 2. Tao SSH key cho GitHub Actions

Tren may local hoac tren VPS, tao key rieng cho deploy:

```bash
ssh-keygen -t ed25519 -C "github-actions-english-listening" -f github-actions-english-listening
```

Copy public key vao VPS:

```bash
ssh-copy-id -i github-actions-english-listening.pub deploy@IP_CUA_VPS
```

Kiem tra:

```bash
ssh -i github-actions-english-listening deploy@IP_CUA_VPS
```

Private key trong file `github-actions-english-listening` se duoc dua vao GitHub Secret `VPS_SSH_KEY`.

## 3. Cau hinh GitHub repository secrets

Vao GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret.

Bat buoc:

```text
VPS_HOST=IP_CUA_VPS
VPS_USER=deploy
VPS_SSH_KEY=toan_bo_noi_dung_private_key
SECRET_KEY=chuoi_bi_mat_dai_ngau_nhien
OPENROUTER_API_KEY=api_key_openrouter
```

Nen them:

```text
VPS_SSH_PORT=22
VPS_DEPLOY_PATH=/opt/english-listening
APP_PORT=18081
LLM_PROVIDER=openrouter
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_SITE_URL=http://IP_CUA_VPS:18081
SEED_DEMO_DATA=true
ENABLE_DEMO_TRANSCRIPT_FALLBACK=true
```

Neu repo private, them secret nay bang HTTPS URL co token hoac dung deploy key rieng cho GitHub:

```text
DEPLOY_REPO_URL=https://github.com/USER/REPO.git
```

Tao `SECRET_KEY` nhanh:

```bash
openssl rand -hex 32
```

## 4. Chay deploy tu dong

Workflow nam tai:

```text
.github/workflows/deploy-vps.yml
```

Moi lan push len branch `main`, GitHub Actions se:

1. Checkout source.
2. Cai Python 3.11.
3. Cai dependencies dev.
4. Chay `pytest`.
5. Build Docker image de bat loi build som.
6. SSH vao VPS.
7. Clone hoac pull repo tai `/opt/english-listening`.
8. Ghi file `.env` production tu GitHub Secrets.
9. Chay `docker compose -f docker-compose.prod.yml up -d --build`.
10. Kiem tra trang chu tren VPS.

Ban cung co the vao tab Actions tren GitHub va bam `Run workflow` de deploy thu cong.

## 5. Dua du lieu demo len server

Cach nen dung khi demo cho co: bat GitHub Secret nay:

```text
SEED_DEMO_DATA=true
```

Sau deploy, workflow se tao lai tai khoan demo va du lieu mau trong database tren VPS.

Thong tin dang nhap demo:

```text
Password chung: Demo12345

demo@shadowingstudio.app
teacher.demo@shadowingstudio.app
student.demo@shadowingstudio.app
```

Neu muon chay seed bang tay tren VPS:

```bash
cd /opt/english-listening
docker compose -f docker-compose.prod.yml exec -T english-listening python scripts/seed_demo_data.py
```

Neu muon dua nguyen file SQLite local len server, khong commit file `.db` vao GitHub. Upload bang `scp` tu may local:

```bash
scp shadowing_app.db deploy@IP_CUA_VPS:/tmp/shadowing_app.db
```

Sau do tren VPS:

```bash
cd /opt/english-listening
docker compose -f docker-compose.prod.yml stop english-listening
docker cp /tmp/shadowing_app.db english-listening:/data/shadowing_app.db
docker compose -f docker-compose.prod.yml up -d
```

Luu y: cach copy nguyen SQLite se ghi de database tren server. Chi nen dung khi server chua co du lieu that.

## 6. Xu ly loi YouTube chan transcript tren VPS

App dung `yt-dlp` de lay subtitle/transcript tu YouTube. Cach nay thuong ben hon tren VPS, nhung YouTube van co the chan request tu IP datacenter/VPS. Khi do app co the bao:

```text
YouTube is temporarily blocking transcript requests.
```

Cach dung cho demo nhanh: them GitHub Secret nay va deploy lai:

```text
ENABLE_DEMO_TRANSCRIPT_FALLBACK=true
```

Khi YouTube chan VPS, app se dung transcript mau tieng Anh de man hinh luyen nghe van chay duoc. Luu y: transcript fallback nay chi de demo luong tinh nang, khong dam bao khop noi dung video YouTube bat ky.

Cach dung dung cho production: cau hinh proxy/residential proxy cho `yt-dlp`, vi transcript can duoc lay tu IP khong bi YouTube chan.

```text
YOUTUBE_PROXY_URL=http://username:password@proxy-host:proxy-port
```

Neu proxy tach rieng HTTP/HTTPS:

```text
YOUTUBE_HTTP_PROXY_URL=http://username:password@proxy-host:proxy-port
YOUTUBE_HTTPS_PROXY_URL=http://username:password@proxy-host:proxy-port
```

## 7. Lenh kiem tra tren VPS

Xem container:

```bash
docker ps
docker compose -f /opt/english-listening/docker-compose.prod.yml --project-directory /opt/english-listening ps
```

Xem log:

```bash
cd /opt/english-listening
docker compose -f docker-compose.prod.yml logs -f --tail=200
```

Restart app:

```bash
cd /opt/english-listening
docker compose -f docker-compose.prod.yml restart
```

Database SQLite duoc luu trong Docker volume `shadowing-data`, khong nam truc tiep trong source code.

## 8. Neu co domain

Tro A record cua domain ve IP VPS:

```text
@      A      IP_CUA_VPS
www    A      IP_CUA_VPS
```

Cai Nginx va Certbot:

```bash
apt install -y nginx certbot python3-certbot-nginx
ufw allow "Nginx Full"
```

Tao file Nginx:

```bash
nano /etc/nginx/sites-available/english-listening
```

Noi dung:

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://127.0.0.1:18081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Bat site:

```bash
ln -s /etc/nginx/sites-available/english-listening /etc/nginx/sites-enabled/english-listening
nginx -t
systemctl reload nginx
```

Cap HTTPS:

```bash
certbot --nginx -d example.com -d www.example.com
```

Sau khi co domain, sua GitHub Secret:

```text
OPENROUTER_SITE_URL=https://example.com
```

Neu chi dung domain, co the dong cong public `18081` va chi cho Nginx truy cap noi bo:

```bash
ufw delete allow 18081/tcp
```

## 9. Cap nhat thu cong khi can

Neu muon deploy bang tay tren VPS:

```bash
cd /opt/english-listening
git fetch origin main
git reset --hard origin/main
docker compose -f docker-compose.prod.yml up -d --build
```
