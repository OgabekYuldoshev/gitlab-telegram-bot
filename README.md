# GitLab–Telegram Bot

Receives GitLab webhooks and forwards events to Telegram (issues, merge requests, pipelines, deployments, releases).

**Stack:** Bun + Hono + TypeScript. Clean Architecture (ports & adapters).

## Requirements

- [Bun](https://bun.sh/) (runtime)

## Setup

1. Clone and install:

   ```sh
   bun install
   ```

2. Copy env template and set values:

   ```sh
   cp .env.example .env
   ```

   Required:

   - `TELEGRAM_TOKEN` – from [@BotFather](https://t.me/BotFather)
   - `GITLAB_SECRET_TOKEN` – same secret you set in GitLab Webhook
   - `GITLAB_TELEGRAM_CHAT_MAPPING` – JSON object: GitLab project ID → Telegram chat ID (e.g. `{"42":"@mygroup"}` or `{"42":-1001234567890}`)

3. Run:

   ```sh
   bun run dev    # dev with hot reload
   bun run start  # production
   ```

   Default port: `3013`. Override with `PORT`.

## Docker (self‑hosted)

1. Copy env and set values:

   ```sh
   cp .env.example .env
   # Edit .env: TELEGRAM_TOKEN, GITLAB_SECRET_TOKEN, GITLAB_TELEGRAM_CHAT_MAPPING, etc.
   ```

2. Build and run:

   ```sh
   docker compose up -d --build
   ```

   The app listens on port `3013`. Override the host port:

   ```sh
   PORT=3014 docker compose up -d --build
   ```

   Logs: `docker compose logs -f gitlab-telegram-bot`

## Jenkins (CI/CD) — same server as Docker

Pipeline: **Checkout → Test** (Bun) **→ Build Docker** (`docker:24` container + socket) **→ Deploy** (optional). Build va Deploy **Docker Pipeline** plugin orqali `docker:24` image ichida ishlaydi, shuning uchun Jenkins containerida `docker` o‘rnatilishi shart emas.

**Talablar:**

- **Docker Pipeline** plugin o‘rnatilgan bo‘lsin (Manage Jenkins → Plugins).
- Jenkins **Docker socket** bilan ishlashi kerak: `-v /var/run/docker.sock:/var/run/docker.sock`.
- **`DEPLOY_PATH`** (masalan `/opt/gitlab-telegram-bot`) Jenkins containeriga mount qilingan bo‘lsin: `-v /opt/gitlab-telegram-bot:/opt/gitlab-telegram-bot`.

**Deploy:** Image build qilinadi, `docker-compose.yml` `DEPLOY_PATH` ga nusxalanadi, shu yerda `docker compose up -d --force-recreate` ishlatiladi. **`DEPLOY_PATH` da `.env` bo‘lishi shart.**

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| `SKIP_DEPLOY` | `true` bo‘lsa faqat build & test (default: `false`) |
| `DEPLOY_PATH` | Deploy papkasi (default: `/opt/gitlab-telegram-bot`) |

**Sozlash (Jenkins Docker da):**

1. Deploy path va `.env`:
   ```sh
   sudo mkdir -p /opt/gitlab-telegram-bot
   sudo cp .env.example /opt/gitlab-telegram-bot/.env
   # .env ni tahrirlang: TELEGRAM_TOKEN, GITLAB_SECRET_TOKEN, GITLAB_TELEGRAM_CHAT_MAPPING
   ```
2. Jenkins containerini socket va `DEPLOY_PATH` bilan ishga tushiring:
   ```sh
   docker run -d --name jenkins \
     -v /var/jenkins_home:/var/jenkins_home \
     -v /var/run/docker.sock:/var/run/docker.sock \
     -v /opt/gitlab-telegram-bot:/opt/gitlab-telegram-bot \
     -p 8080:8080 jenkins/jenkins:lts
   ```
3. Jenkins’da **Docker Pipeline** plugin o‘rnating.
4. Pipeline job → “Pipeline script from SCM” → bu repo. **Build now** yoki **Build with Parameters**.

## GitLab Webhook

1. In your GitLab project: **Settings → Webhooks**.
2. **URL:** `https://your-bot-domain.com/gitlab` (must end with `/gitlab`).
3. **Secret token:** set the same value as `GITLAB_SECRET_TOKEN` in `.env`.
4. Enable triggers:
   - Issues events  
   - Merge requests events  
   - Pipeline events  
   - Deployment events  
   - Releases events  
   (Push events can be disabled if you don’t need them.)

## Endpoints

| Method | Path    | Description                    |
|--------|---------|--------------------------------|
| GET    | `/`     | Welcome message                |
| GET    | `/health` | Health check (200 OK / 500 if send errors) |
| POST   | `/gitlab` | GitLab webhook (X-Gitlab-Token required)   |

## Environment

| Variable                     | Required | Description                                      |
|-----------------------------|----------|--------------------------------------------------|
| `TELEGRAM_TOKEN`            | Yes*     | Telegram Bot API token                           |
| `GITLAB_SECRET_TOKEN`       | Yes      | Must match GitLab webhook secret                 |
| `GITLAB_TELEGRAM_CHAT_MAPPING` | Yes   | JSON: project ID → chat ID                       |
| `URL`                       | No       | Bot base URL (default: localhost)               |
| `PORT`                      | No       | Server port (default: 3013)                      |
| `LOG_LEVEL`                 | No       | debug \| info \| warn \| error (default: info)   |
| `TELEGRAM_ENABLED`          | No       | Set to `false` to use fake client (no real sends) |
| `GITLAB_PIPELINE_BRANCH_NAME` | No     | Only report pipelines for this branch            |
| `GITLAB_PIPELINE_SHOW_SUCCESS` | No    | Set to `true` to also report successful pipelines |

\* Not required when `TELEGRAM_ENABLED=false`.

## Events forwarded

- **Issues:** open, reopen, close  
- **Merge requests:** open, reopen, merge, close  
- **Pipelines:** failed (always); success only if `GITLAB_PIPELINE_SHOW_SUCCESS=true`; optional branch filter via `GITLAB_PIPELINE_BRANCH_NAME`  
- **Deployments:** success only  
- **Releases:** create only  

## Troubleshooting

- **Config error on start:** ensure `GITLAB_SECRET_TOKEN` and `GITLAB_TELEGRAM_CHAT_MAPPING` are set; if `TELEGRAM_ENABLED` is not `false`, set `TELEGRAM_TOKEN`.
- **No messages in Telegram:** check project ID is in `GITLAB_TELEGRAM_CHAT_MAPPING`; check `/health` (500 = send errors); ensure webhook URL is `https://.../gitlab` and secret matches.
- **Local testing without Telegram:** set `TELEGRAM_ENABLED=false`; the bot will log “Fake Telegram send” instead of calling the API.
