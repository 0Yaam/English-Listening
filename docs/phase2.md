# Phase 2 Overview

## Summary

Phase 2 extends `shadowing-backend` from a single-session Shadowing practice tool into a personal learning platform.

The system now supports:

- user registration and login with JWT authentication
- a protected profile page backed by real database data
- persistent Shadowing session history for each user
- transcript storage per completed learning session
- AI-generated reading comprehension quizzes from saved transcripts
- quiz submission, scoring, and attempt persistence

This phase keeps the original learning flow at `/` intact while adding account-based persistence and AI features around it.

## Short Report Paragraph

Dự án đã được mở rộng từ ứng dụng luyện nghe Shadowing thành nền tảng học tập cá nhân hóa. Hệ thống bổ sung xác thực người dùng, profile cá nhân, lưu lịch sử học tập và transcript theo từng phiên. Từ transcript đã lưu, hệ thống tích hợp AI để sinh câu hỏi đọc hiểu nhằm đánh giá mức độ hiểu nội dung video của người học.

## Architecture

The project still follows a 3-tier architecture:

1. Presentation layer
   - FastAPI route handlers
   - Pydantic request and response schemas
   - static frontend files served by FastAPI
2. Business layer
   - domain models
   - services
   - business rules
   - AI quiz orchestration
3. Data access layer
   - SQLAlchemy database setup
   - ORM models
   - repositories
   - external adapters such as YouTube subtitle access and LLM providers

## Main Phase 2 Features

### 1. Authentication

Users can:

- register with username, email, and password
- log in with email and password
- receive a JWT access token
- access protected APIs with `Authorization: Bearer <token>`

Frontend token storage:

- localStorage key: `shadowing_access_token`

### 2. Personal Profile

The profile page now loads real data from the backend:

- user information
- total sessions
- saved transcripts
- average Shadowing accuracy
- total generated quizzes
- average quiz score
- recent learning sessions

### 3. Session and Transcript Persistence

When a logged-in learner finishes a Shadowing lesson on `/`, the frontend automatically sends a request to save:

- `video_id`
- `video_title`
- `source_url`
- `accuracy_score`
- `raw_text`
- `language`
- `language_code`
- `completed_at`

If the learner is not logged in:

- the lesson still works normally
- the summary still appears
- the app shows a gentle prompt to sign in and save learning history

### 4. AI Quiz Generation

From a saved transcript, the system can generate a reading comprehension quiz.

Flow:

1. verify current user
2. verify session ownership
3. load transcript from database
4. send transcript text to an LLM provider
5. require structured JSON output
6. validate output
7. save quiz and quiz questions
8. return quiz to frontend

### 5. Quiz Submission and Scoring

Learners can submit answers for generated quizzes.

The backend will:

- verify quiz ownership
- grade each submitted answer
- compute score percentage
- save quiz attempt
- save per-question attempt answers
- return detailed corrections and explanations

## How to Run the App

### 1. Create a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install dependencies

```powershell
pip install -e .[dev]
```

### 3. Run the app

```powershell
uvicorn app.main:app --reload
```

### 4. Open the app

- Main Shadowing page: `http://127.0.0.1:8000/`
- Login page: `http://127.0.0.1:8000/login`
- Register page: `http://127.0.0.1:8000/register`
- Profile page: `http://127.0.0.1:8000/profile`
- Swagger docs: `http://127.0.0.1:8000/docs`

## How to Create an Account

### Register from UI

1. Open `/register`
2. Enter:
   - username
   - email
   - password
   - confirm password
3. Submit the form
4. On success, the frontend stores the access token and redirects to `/profile`

### Login from UI

1. Open `/login`
2. Enter:
   - email
   - password
3. Submit the form
4. On success, the frontend stores the access token and redirects to `/profile`

## How Session Saving Works

### Automatic save from the main learning page

After a learner finishes the Shadowing exercise on `/`:

- if the learner is logged in, the frontend automatically calls `POST /api/v1/sessions`
- if the learner is not logged in, the app shows a sign-in suggestion instead of blocking the learning result

### Transcript source

The frontend builds `raw_text` by:

1. taking each exercise item’s `original_text`
2. sorting by `segment_index`
3. joining them into one transcript string

### Accuracy source

The frontend calculates final `accuracy_score` as the average of all per-segment scoring results.

## How Quiz Generation Works

### From UI

1. Open `/profile`
2. Select a session
3. Click `Generate Reading Quiz`
4. The frontend calls `POST /api/v1/sessions/{session_id}/generate-quiz`
5. The backend saves the generated quiz and returns it
6. The frontend renders the quiz inside the same page

## How to Enable Mock AI

Mock AI is the recommended default for local development and test isolation.

Set:

```powershell
$env:LLM_PROVIDER="mock"
```

Behavior:

- no external API call
- deterministic quiz output
- safe for tests and offline demos

## How to Configure OpenAI or Gemini

### OpenAI

```powershell
$env:LLM_PROVIDER="openai"
$env:OPENAI_API_KEY="your-api-key"
$env:OPENAI_MODEL="gpt-4o-mini"
```

### Gemini

```powershell
$env:LLM_PROVIDER="gemini"
$env:GEMINI_API_KEY="your-api-key"
$env:GEMINI_MODEL="gemini-2.0-flash"
```

### AI question count

```powershell
$env:AI_QUIZ_QUESTION_COUNT="5"
```

Notes:

- API keys are read from environment variables
- no provider key is hard-coded in the repository
- if provider configuration is missing, the app falls back to the mock provider

## Main Endpoints

### Existing learning endpoints

- `GET /api/v1/lessons/{video_id}/blank-exercise`
- `POST /api/v1/scores`
- `GET /api/v1/subtitles/{video_id}`

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

### Profile

- `GET /api/v1/profile`

### Sessions

- `POST /api/v1/sessions`
- `GET /api/v1/sessions`
- `GET /api/v1/sessions/{session_id}`
- `GET /api/v1/sessions/{session_id}/transcript`

### Quizzes

- `POST /api/v1/sessions/{session_id}/generate-quiz`
- `GET /api/v1/sessions/{session_id}/quizzes`
- `GET /api/v1/quizzes/{quiz_id}`
- `POST /api/v1/quizzes/{quiz_id}/submit`

## Main Database Tables

- `users`
  - stores account identity and password hash
- `shadowing_sessions`
  - stores each completed Shadowing learning session
- `transcripts`
  - stores raw transcript text for a specific session
- `quizzes`
  - stores generated quiz metadata
- `quiz_questions`
  - stores individual multiple-choice questions
- `quiz_attempts`
  - stores each learner submission for a quiz
- `quiz_attempt_answers`
  - stores answer-level grading per attempt

## Demo Flow for Lecturer

Recommended demonstration sequence:

1. Start the app with `uvicorn app.main:app --reload`
2. Open `/register` and create a new account
3. Log in and confirm redirect to `/profile`
4. Open `/` and create a Shadowing exercise from a YouTube video
5. Complete a few segments and finish the lesson
6. Show that the app automatically saves the session when logged in
7. Open `/profile` and confirm the new session appears in history
8. Open the transcript detail
9. Generate a reading quiz from the saved transcript
10. Submit quiz answers and show score plus explanations
11. Refresh `/profile` and explain that stats now come from the database

## Testing

Run all tests:

```powershell
pytest
```

Important testing guarantees:

- tests use isolated SQLite databases
- quiz generation tests force `LLM_PROVIDER=mock`
- tests do not call OpenAI or Gemini
- tests do not require external network access
