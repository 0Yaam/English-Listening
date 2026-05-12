# English Listening Shadowing

Web application for English listening and shadowing practice with YouTube transcripts, AI-generated reading quizzes, attempt history, vocabulary review, and learning progress tracking.

## Stack

- FastAPI
- SQLAlchemy
- SQLite
- Vanilla JavaScript
- Pytest
- Docker

## Local Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .[dev]
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Default local URL:

```text
http://127.0.0.1:8000
```

## Configuration

Set environment variables in `.env`.

Important values:

```text
DATABASE_URL=sqlite:///./shadowing_app.db
SECRET_KEY=change-this-in-production
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

## Tests

```powershell
pytest
```

## Docker

Build and run locally:

```powershell
docker compose -f docker-compose.prod.yml up -d --build
```

Default exposed port:

```text
18081
```

Override it with:

```text
APP_PORT=18082
```

## VPS Deployment

Full step-by-step deployment guide:

```text
DEPLOYMENT.md
```

GitHub Actions workflow:

```text
.github/workflows/deploy-vps.yml
```

Required GitHub repository secrets:

```text
VPS_HOST
VPS_USER
VPS_SSH_KEY
SECRET_KEY
OPENROUTER_API_KEY
```

Optional secrets:

```text
VPS_SSH_PORT
VPS_DEPLOY_PATH
DEPLOY_REPO_URL
APP_PORT
LLM_PROVIDER
OPENROUTER_MODEL
OPENROUTER_SITE_URL
YOUTUBE_PROXY_URL
YOUTUBE_HTTP_PROXY_URL
YOUTUBE_HTTPS_PROXY_URL
```

The deployment uses Docker Compose and stores SQLite data in the `shadowing-data` Docker volume.
