# AI Project Context: English Listening / Shadowing Platform

## 1. What This Project Is

This repository is an English listening practice web application centered on the **Shadowing** learning method using **YouTube videos**.

At a high level:

- The user provides a YouTube video.
- The system fetches transcript/subtitle data on the backend.
- The backend transforms subtitle text into listening exercises.
- The frontend provides an interactive learning experience.
- The product is evolving from a simple transcript/exercise tool into a more complete **EdTech learning platform** with:
  - user identity,
  - learning history,
  - transcript storage,
  - AI-generated reading comprehension quizzes.

This repo name still reflects its original backend focus: `shadowing-backend`.

The project is currently in a **transition phase**:

- The backend already supports subtitle fetching and scoring flows.
- The frontend now has:
  - the original learning workspace at `/`
  - a newer **User Profile + Transcript History + Reading Quiz mock UI** at `/profile`
- The profile/quiz experience is **frontend-first and mock-data-driven** right now.
- Real auth, persistence, and AI quiz generation are **planned**, not fully implemented yet.

---

## 2. Product Goal

The long-term goal is to become a serious learning platform for English listening and shadowing, not a decorative marketing site.

The intended user value is:

- practice English listening from real YouTube content
- shadow sentence-by-sentence
- receive scoring on transcription accuracy
- retain study history
- revisit previous transcript sessions
- generate reading comprehension quizzes from previously studied transcript text

The product direction is explicitly:

- practical
- study-focused
- minimal
- serious
- professional

It should **not** feel like:

- a startup landing page
- a generic AI SaaS template
- a toy demo
- an over-animated dashboard

---

## 3. Current Technical Stack

### Backend

- Python `3.11+`
- FastAPI
- Uvicorn
- `youtube-transcript-api`

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- no React
- no Vue
- no Tailwind
- no Bootstrap
- no external UI framework

### Testing

- Pytest

### Packaging

- setuptools-based Python project

---

## 4. Current Repo Purpose by Layer

The codebase is structured around a **3-tier architecture**:

- **Presentation**
  - FastAPI routes
  - request/response schemas
  - static frontend files
- **Business**
  - domain models
  - services
  - rules and transformations
- **Data Access**
  - adapters for external data providers
  - repository placeholders / persistence layer structure

This means any future work should try to preserve the separation between:

- web/API interface
- business logic
- external systems / persistence

---

## 5. Directory Map

### Important top-level files

- `README.md`
  - very short current project readme
- `required.md`
  - original product/context brief from the user
- `pyproject.toml`
  - dependencies and pytest config
- `AI_PROJECT_CONTEXT.md`
  - this file

### Main application package

- `app/main.py`
  - creates FastAPI app
  - mounts static files
  - registers API routers
  - includes web routes

### Configuration

- `app/config/settings.py`
  - settings and app metadata

### Presentation layer

- `app/presentation/web/routes.py`
  - `/`
  - `/profile`
- `app/presentation/api/routes/subtitles.py`
  - subtitle-related API endpoints
- `app/presentation/api/routes/lessons.py`
  - blank exercise generation endpoint
- `app/presentation/api/routes/scores.py`
  - answer scoring endpoint
- `app/presentation/schemas/*.py`
  - Pydantic request/response schemas
- `app/presentation/static/`
  - frontend assets

### Business layer

- `app/business/models/`
  - core domain models
- `app/business/services/subtitle_service.py`
  - subtitle fetching/processing logic
- `app/business/services/lesson_service.py`
  - exercise creation logic
- `app/business/services/scoring_service.py`
  - normalization and accuracy scoring logic

### Data access layer

- `app/data_access/adapters/youtube_subtitle_adapter.py`
  - external subtitle fetch adapter
- `app/data_access/repositories/`
  - placeholder structure for persistence direction

### Tests

- `tests/business/*`
- `tests/presentation/test_api_routes.py`

---

## 6. How the App Runs

### Local run

```bash
uvicorn app.main:app --reload
```

### URLs

- `http://127.0.0.1:8000/`
  - original shadowing lesson page
- `http://127.0.0.1:8000/profile`
  - profile + transcript history + quiz workspace
- `http://127.0.0.1:8000/static/profile.html`
  - direct static file path for profile page
- `http://127.0.0.1:8000/docs`
  - FastAPI Swagger docs

### Important behavior

The route `/profile` currently **redirects** to `/static/profile.html`.

This was done intentionally so the profile page:

- works properly under FastAPI static serving
- uses relative file references cleanly
- can also be opened directly as a local HTML file

---

## 7. Current FastAPI Wiring

From `app/main.py`:

- static files are mounted at `/static`
- the app includes:
  - web router
  - subtitle router
  - lesson router
  - score router

This is the current boot flow:

1. create FastAPI app
2. register exception handlers
3. mount static assets
4. include presentation/API routers

The static directory is:

- `app/presentation/static`

---

## 8. Current Web Routes

### `/`

Serves the original learning interface.

This page currently supports:

- entering a YouTube URL
- choosing difficulty
- generating a blank exercise
- starting a shadowing session
- pausing for answer input
- scoring each answer
- showing final summary

The files for this page include:

- `app/presentation/static/index.html`
- `app/presentation/static/css/styles.css`
- `app/presentation/static/js/app.js`

### `/profile`

Redirects to `/static/profile.html`

This page currently supports:

- user profile summary
- transcript history list
- search/filter on mock transcript history
- transcript preview panel
- mock reading quiz generation flow

The files for this page are:

- `app/presentation/static/profile.html`
- `app/presentation/static/profile.css`
- `app/presentation/static/profile.js`

---

## 9. Current Implemented Backend APIs

### 9.1 Blank Exercise Endpoint

File:

- `app/presentation/api/routes/lessons.py`

Endpoint:

- `GET /api/v1/lessons/{video_id}/blank-exercise?difficulty={1..5}`

Purpose:

- generate a listening blank exercise from subtitle data

Output model:

- `BlankExerciseResponse`

Important response fields:

- `source`
- `video_id`
- `language`
- `language_code`
- `difficulty`
- `items`

Each exercise item contains:

- `segment_index`
- `start`
- `duration`
- `blanked_text`
- `original_text`
- `answers`

This API powers the original learning page at `/`.

### 9.2 Score Endpoint

File:

- `app/presentation/api/routes/scores.py`

Endpoint:

- `POST /api/v1/scores`

Request shape:

- `original_text`
- `user_input`

Response shape:

- `accuracy`
- `normalized_user_input`
- `normalized_original_text`
- `is_exact_match`

Purpose:

- score the learner’s transcription against the original subtitle sentence

### 9.3 Subtitles Endpoint

There is also subtitle-related routing in:

- `app/presentation/api/routes/subtitles.py`

It is part of the current architecture, but the most visible current frontend flow is exercise generation plus scoring.

---

## 10. Current Frontend Pages

## 10.1 Original Learning Page (`/`)

This is the existing functional page for the first product phase.

Main responsibilities:

- input YouTube URL
- choose difficulty
- request blank exercise from backend
- embed YouTube player
- control playback
- pause at sentence boundaries
- collect user transcription input
- request backend scoring
- show summary results

Important implementation detail:

- it uses the YouTube IFrame API
- it uses `requestAnimationFrame` to monitor current time
- it manages playback state on the client

Important file:

- `app/presentation/static/js/app.js`

### App states in original page

The page tracks:

- `IDLE`
- `PLAYING`
- `WAITING_FOR_INPUT`
- `FINISHED`

This is important because any future changes to the learning workflow should preserve the stateful interaction model rather than replacing it with a generic static layout.

---

## 10.2 Profile / Transcript / Quiz Page (`/profile`)

This page is currently a **frontend-first mock implementation** for the future Phase 2 platform experience.

It is not yet backed by a real user account, database, or AI service.

Its job right now is to prove and refine:

- layout
- visual language
- user flow
- data shape
- interaction model

### High-level purpose

This page represents the **logged-in learning history workspace**.

It allows a user to:

1. see profile summary
2. inspect transcript history rows
3. search/filter sessions
4. view transcript preview
5. generate a mock reading quiz from a selected transcript

### Important constraint

The design direction is deliberately **not** flashy.

It should feel like:

- an editorial productivity tool
- a serious study workspace
- a product UI that people use regularly

It should not feel like:

- a template marketplace dashboard
- a landing page
- an AI-generated decorative SaaS UI

---

## 11. Current Profile Page Design Direction

The current profile page follows these visual principles:

- flat sections
- minimal border radius
- almost no decorative visual effects
- thin borders as the main separation tool
- strong typography hierarchy
- restrained use of accent color
- list/table rhythm for transcript history
- side-panel reading flow for transcript + quiz

### Visual style summary

- background:
  - very soft mesh gradient
  - subtle grain/noise layer
- content:
  - product-surface look
  - one main composed container
  - line-based separation

### Things intentionally avoided

- oversized rounded cards
- generic shadows
- loud gradients in content areas
- marketing-style illustrations
- ornamental icons
- unnecessary charts

---

## 12. Current Profile Page File Responsibilities

### `profile.html`

Contains:

- semantic structure only
- profile shell
- sidebar
- transcript history section
- preview panel
- quiz panel
- references to:
  - `./profile.css`
  - `./profile.js`

The HTML is intentionally static and lightweight.

### `profile.css`

Contains:

- all design tokens in `:root`
- layout
- typography
- spacing
- states
- responsive behavior
- hover/focus rules
- badge/button styles
- quiz-specific UI styles

### `profile.js`

Contains:

- mock transcript/session data
- local page state
- search/filter logic
- row rendering
- transcript preview rendering
- quiz panel rendering
- mock loading/error/generated quiz behavior

No real API is called by this page yet.

---

## 13. Current Profile Page Layout

### Desktop

- left sidebar
- right main workspace

Sidebar width is approximately:

- `304px`

Main content contains:

- top header with search/filter
- transcript history on the left side of the workspace
- transcript preview + reading quiz on the right side

### Tablet

- still tries to preserve two-column layout if space allows
- spacing reduces

### Mobile

- collapses into one column
- sidebar moves above main content
- transcript history table can scroll horizontally

---

## 14. Current Profile Page Data Model

The profile page uses mock session objects in `profile.js`.

Each session currently includes:

- `sessionId`
- `videoId`
- `videoTitle`
- `completedAt`
- `accuracyScore`
- `wordCount`
- `rawText`
- `quizStatus`
- `shouldGenerateError`
- `quizQuestions`

### `quizStatus` currently used values

- `Completed`
- `Quiz Ready`
- `Quiz Generated`

### Why this matters

This mock shape is effectively the **frontend contract draft** for the future real API or database-backed session objects.

Any future backend implementation for transcript history should either:

- match this shape closely
- or transform backend responses into this shape cleanly before rendering

---

## 15. Current Reading Quiz Mock Data Shape

Each quiz question currently follows a structure close to the intended AI output:

- `question`
- `options`
  - object with keys `A`, `B`, `C`, `D`
- `correct_answer`
- `explanation`

This is important because it matches the planned AI-generation direction described in `required.md`.

That means future real AI responses should ideally be validated into a structure equivalent to:

```json
{
  "question": "string",
  "options": {
    "A": "string",
    "B": "string",
    "C": "string",
    "D": "string"
  },
  "correct_answer": "A",
  "explanation": "string"
}
```

This is the shape the current UI is designed to render.

---

## 16. Current Transcript History UX

Transcript history is designed as a **table/list hybrid**, not a card stack.

Each row currently shows:

- small thumbnail placeholder
- video title
- `YouTube / {videoId}`
- completed date
- word count
- accuracy score badge
- status badge
- actions
  - `View Transcript`
  - `Generate Quiz`

### Search behavior

Search currently filters by:

- `videoTitle`
- `videoId`

### Filter behavior

Filter currently supports:

- `All`
- `Completed`
- `Quiz Ready`
- `Quiz Generated`

---

## 17. Current Transcript Preview UX

When a transcript row is selected:

- the preview panel updates
- it shows:
  - video title
  - video ID
  - completed date
  - session ID
  - accuracy badge
  - full transcript preview text
- it also shows a `Generate Reading Quiz` button

If no transcript is selected:

- the preview panel shows an empty state

---

## 18. Current Reading Quiz UX

The quiz panel lives on the same page.

It does **not** navigate away.

It does **not** use a modal.

It is intentionally rendered as part of the study workspace.

### Current quiz states

- `empty`
  - nothing selected or no quiz generated yet
- `loading`
  - mock generation in progress
- `error`
  - generation failed for one mocked session
- `generated`
  - render full quiz list

### Current generated quiz layout

Each question renders:

1. question index
2. question text
3. options A/B/C/D
4. correct answer badge
5. explanation section

### Current footer actions in generated state

- `Regenerate Quiz`
- `Save Quiz`

These are intentionally secondary/ghost-style actions.

---

## 19. Current Accessibility / Responsive Considerations

The profile page already includes a number of accessibility and responsiveness improvements:

### Accessibility

- labels for search and filter controls
- keyboard-selectable transcript rows
- `role="button"` and `aria-pressed` on clickable rows
- `aria-live="polite"` on dynamic preview/quiz content
- clear disabled button states
- visible `focus-visible` styling

### Responsive behavior

- desktop two-column composition
- mobile one-column stacking
- transcript list allows horizontal scroll instead of collapsing into broken layout
- long titles and source text use truncation/ellipsis where appropriate
- preview title uses safe wrapping

---

## 20. What Is Real vs What Is Mock

This distinction is important for any AI agent working on the repo.

### Already real

- FastAPI app boot
- static file serving
- root page routing
- `/profile` routing
- lesson blank exercise endpoint
- scoring endpoint
- tests for current API routes
- original shadowing practice UI

### Currently mock / frontend-only

- user account data on profile page
- transcript history persistence
- transcript history API
- quiz generation API
- quiz save API
- database-backed session storage
- real auth / JWT / user identity

Any AI making future changes should be careful not to accidentally describe mock features as already implemented backend features.

---

## 21. Current Product Roadmap Implied by the Code

The code and briefs imply the following likely next stages:

### Stage 1: existing backend-first listening flow

- subtitle fetch
- blank exercise generation
- scoring

### Stage 2: platform expansion

- user profile
- transcript/session history
- saved learning data

### Stage 3: AI-powered post-learning assessment

- use stored `raw_text`
- generate reading comprehension quiz
- validate structured quiz JSON
- render inside the same workspace

### Stage 4: full SaaS platform features

- authentication
- storage
- persistence
- session logs
- saved quizzes

---

## 22. Important Design Constraints

Anyone working on the frontend should follow these constraints.

### General UI direction

- premium but restrained
- minimal, not empty
- serious learning product
- should feel useful over long usage

### Avoid

- overusing cards
- heavy shadows
- giant border radii
- decorative gradients inside panels
- onboarding/landing-page style visuals
- extra navigation menus that do not belong
- random dashboard widgets
- charts with no learning value

### Prefer

- line-based separation
- clean typography hierarchy
- narrow controlled accent usage
- list/table rhythms
- stable product-like layouts

---

## 23. Important Engineering Constraints

### Frontend constraints

- no framework
- no inline styles
- no external UI library
- avoid unnecessary globals
- keep files simple and static-compatible

### Profile page constraint

The page should continue to work when:

- opened directly as `profile.html`
- served from FastAPI via `/static/profile.html`
- reached from `/profile`

That is why assets are linked using relative paths:

- `./profile.css`
- `./profile.js`

### Backend constraints

- preserve FastAPI routing style
- preserve 3-tier architecture
- keep business logic out of raw route handlers when possible

---

## 24. Testing Status

At the time this file is written, the test suite is green.

Key test coverage includes:

- blank exercise route
- score route
- validation error handling
- root page serving
- profile page serving

Important file:

- `tests/presentation/test_api_routes.py`

The profile page route test ensures `/profile` is reachable.

---

## 25. Suggested Mental Model for Future AI Agents

If you are another AI reading this file, the safest mental model is:

1. This is a **real FastAPI backend project** with a functioning learning page.
2. The profile/transcript/quiz workspace is a **serious UI prototype built directly into the static frontend**, not yet backed by a real database/API.
3. The user cares a lot about **product quality and visual maturity**.
4. The user does **not** want generic AI dashboard aesthetics.
5. The reading quiz flow should eventually be driven by real AI-generated structured JSON.
6. The current mock frontend is meant to establish the correct product behavior before full backend integration.

---

## 26. If You Need To Extend This Project

### If you are working on backend

Likely future tasks:

- add user model and auth
- add session persistence
- add transcript persistence
- add API for transcript history
- add API for quiz generation
- add API for saving generated quizzes

### If you are working on frontend

Likely future tasks:

- replace mock session data with real fetched data
- keep current data shape where possible
- connect `Generate Quiz` to real API call
- preserve same workspace interaction model

### If you are working on AI generation

Your output should probably match:

- `question`
- `options`
- `correct_answer`
- `explanation`

And should be validated before being rendered.

---

## 27. Known Non-Goals Right Now

These are things that should **not** be added casually unless explicitly requested:

- marketing hero redesigns
- analytics charts for visual filler
- heavy animation systems
- icon-heavy UI kits
- third-party frontend frameworks
- speculative navigation architecture
- extra dashboard modules unrelated to transcript history and quiz flow

---

## 28. Recommended Next Integration Path

If turning the current mock page into a real feature, the cleanest path would be:

1. add backend endpoint to return transcript/session history for current user
2. keep frontend row rendering mostly unchanged
3. add backend endpoint to generate quiz from `raw_text`
4. validate AI output into the quiz structure
5. replace mock generation delay with real fetch
6. optionally add save-quiz endpoint

This minimizes UI churn and preserves the current product decisions.

---

## 29. Summary in One Paragraph

This project is a FastAPI + Vanilla JS English listening/shadowing learning platform that already supports YouTube transcript-based blank exercises and scoring, and is currently being expanded into a richer EdTech product with user profile, transcript history, and AI-generated reading quiz capabilities. The `/profile` page is a frontend-first, mock-data-based product workspace designed with a restrained editorial/productivity UI style, intended to become the real user learning history surface later. The most important thing to preserve is the product direction: serious, minimal, useful, and implementation-ready, not decorative or template-like.

