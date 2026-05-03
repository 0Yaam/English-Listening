# Shadowing Backend

`shadowing-backend` is a FastAPI + Vanilla JavaScript learning platform for English Shadowing practice with YouTube transcripts.

The project uses a 3-tier architecture:

- Presentation
  - FastAPI routes
  - Pydantic schemas
  - static frontend files
- Business
  - services
  - domain models
  - business rules
- Data Access
  - SQLAlchemy persistence
  - repositories
  - external adapters such as YouTube subtitle access and LLM providers

## Current Scope

Phase 1:

- fetch YouTube transcript data
- generate blank listening exercises
- score learner answers

Phase 2:

- JWT authentication
- user profile
- session and transcript persistence
- AI quiz generation from saved transcripts
- quiz submission and attempt storage
- profile frontend powered by real APIs

Detailed Phase 2 documentation:

- [docs/phase2.md](docs/phase2.md)

## Run Locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .[dev]
uvicorn app.main:app --reload
```

Optional local config:

```powershell
Copy-Item .env.example .env
# Edit .env and add your provider API key, for example OPENROUTER_API_KEY.
```

Open:

- `/`
- `/login`
- `/register`
- `/profile`
- `/docs`

## Run Tests

```powershell
pytest
```
