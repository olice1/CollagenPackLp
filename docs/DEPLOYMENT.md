# AUREVA — Deployment Guide

This guide covers deploying the AUREVA landing page and serverless API to production.

---

## Option A: Vercel (Recommended & Zero Configuration)

Because the project uses standard static files and serverless routes inside `/api`, it is natively supported by Vercel:

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Add the Environment Variables in the Vercel dashboard:
   - `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`
   - `GOOGLE_SHEET_ID`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `TELEGRAM_ALLOWED_USER_IDS`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `META_PIXEL_ID`
   - `META_CONVERSIONS_API_TOKEN`
   - `PUBLIC_SITE_URL` (e.g. `https://aureva.ma`)
5. Click **Deploy**.
6. Set up your custom domain `aureva.ma` in Vercel DNS settings.
7. Set the Telegram webhook pointing to `https://aureva.ma/api/telegram` (see `docs/TELEGRAM_SETUP.md`).

---

## Option B: Node.js VPS / Docker (Ubuntu / Debian + PM2)

If running on a VPS (such as DigitalOcean, Hetzner, or AWS EC2):

1. Install Node.js 20+:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
2. Clone your repository:
   ```bash
   git clone <repo-url> /var/www/aureva
   cd /var/www/aureva
   npm install --production
   ```
3. Create your production `.env` file:
   ```bash
   nano .env
   ```
4. Install PM2 process manager and start the server:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "aureva-store"
   pm2 startup
   pm2 save
   ```
5. Configure Nginx with SSL (Certbot / Let's Encrypt):
   ```nginx
   server {
       server_name aureva.ma www.aureva.ma;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
6. Issue SSL certificate:
   ```bash
   sudo certbot --nginx -d aureva.ma -d www.aureva.ma
   ```
