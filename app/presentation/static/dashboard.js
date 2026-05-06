import {
  apiFetch,
  clearAccessToken,
  extractErrorMessage,
  getAccessToken,
  redirectToLogin,
} from "./auth.js"

const VIEW_TITLES = {
  dashboard: "Dashboard",
  sessions: "Sessions",
  "quiz-history": "Quiz History",
  vocabulary: "Vocabulary",
  settings: "Settings",
}

const VIEW_CONTEXT = {
  dashboard: "Learning overview",
  sessions: "Transcript, reading quiz, and attempts",
  "quiz-history": "Saved quiz review",
  vocabulary: "Transcript vocabulary and mini quiz",
  settings: "Account and quiz defaults",
}

const QUESTION_TYPES = [
  ["mixed", "Mixed"],
  ["inference", "Inference"],
  ["vocabulary", "Vocabulary"],
  ["main_idea", "Main idea"],
  ["detail", "Detail"],
]

const state = {
  activeView: "dashboard",
  profile: null,
  sessions: [],
  profileState: "loading",
  sessionsState: "loading",
  profileError: "",
  sessionsError: "",
  sessionSearch: "",
  sessionStatusFilter: "all",
  sessionDateFilter: "",
  selectedSessionId: null,
  activeStudyTab: "quiz",
  activeSelectionRequestId: 0,
  loadingSessionIds: new Set(),
  sessionDetailErrorsById: new Map(),
  sessionDetailsById: new Map(),
  generatingSessionIds: new Set(),
  quizSessionId: null,
  quizState: "empty",
  quizError: "",
  quizNotice: "",
  quizNoticeTone: "error",
  currentQuizId: null,
  currentQuizQuestions: [],
  selectedAnswersByQuestionId: {},
  quizzesBySessionId: new Map(),
  submittedAttemptByQuizId: new Map(),
  attemptHistoryBySessionId: new Map(),
  loadingAttemptHistorySessionIds: new Set(),
  attemptHistoryErrorsBySessionId: new Map(),
  activeAttemptIdBySessionId: new Map(),
  quizHistoryState: "empty",
  quizHistoryError: "",
  quizAttempts: [],
  activeGlobalAttemptId: null,
  vocabularyState: "empty",
  vocabularyError: "",
  vocabularyBySessionId: new Map(),
  maskedVocabularySessionIds: new Set(),
  isVocabularySourceCollapsed: false,
  wordSearchTerm: "",
  difficultyFilter: "all",
  savedOnly: false,
  vocabQuizState: "empty",
  vocabQuizError: "",
  vocabQuizBySessionId: new Map(),
  vocabQuizAnswersBySessionId: new Map(),
  settings: {
    defaultDifficulty: window.localStorage.getItem("dashboard_default_difficulty") ?? "medium",
    defaultQuestionType: window.localStorage.getItem("dashboard_default_question_type") ?? "mixed",
  },
}

const elements = {
  avatar: document.getElementById("dashboard-avatar"),
  userline: document.getElementById("dashboard-userline"),
  signOutButton: document.getElementById("dashboard-sign-out"),
  viewTitle: document.getElementById("view-title"),
  contextSummary: document.getElementById("context-summary"),
  nav: document.querySelector(".sidebar-nav"),
  main: document.querySelector(".dashboard-main"),
  panels: {
    dashboard: document.getElementById("dashboard-view"),
    sessions: document.getElementById("sessions-view"),
    "quiz-history": document.getElementById("quiz-history-view"),
    vocabulary: document.getElementById("vocabulary-view"),
    settings: document.getElementById("settings-view"),
  },
}

const escapeHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const formatDate = (isoDate) => {
  if (!isoDate) {
    return "--"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate))
}

const formatDateTime = (isoDate) => {
  if (!isoDate) {
    return "--"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate))
}

const formatShortDate = (isoDate) => {
  if (!isoDate) {
    return "--"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${isoDate}T00:00:00`))
}

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--"
  }

  return `${Math.round(Number(value) * 10) / 10}%`
}

const buildAvatarInitials = (username) => {
  const parts = String(username ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) {
    return "--"
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

const normalizeSession = (payload) => {
  return {
    sessionId: payload.session_id,
    videoId: payload.video_id,
    videoTitle: payload.video_title ?? "Untitled video",
    sourceUrl: payload.source_url ?? null,
    accuracyScore: payload.accuracy_score,
    completedAt: payload.completed_at,
    wordCount: payload.word_count ?? payload.transcript?.word_count ?? 0,
    rawText: payload.transcript?.raw_text ?? payload.raw_text ?? null,
    transcriptLanguage: payload.transcript?.language ?? null,
    transcriptLanguageCode: payload.transcript?.language_code ?? null,
    quizStatus: payload.quiz_status ?? "Completed",
  }
}

const normalizeQuizResponse = (payload) => {
  return {
    quizId: payload.quiz_id,
    sessionId: payload.session_id,
    videoId: payload.video_id,
    videoTitle: payload.video_title ?? "Untitled video",
    title: payload.title ?? null,
    status: payload.status ?? "generated",
    questions: Array.isArray(payload.questions)
      ? payload.questions.map((question) => ({
          id: question.id,
          question: question.question,
          options: {
            A: question.options.A,
            B: question.options.B,
            C: question.options.C,
            D: question.options.D,
          },
          correctAnswer: question.correct_answer,
          explanation: question.explanation,
        }))
      : [],
  }
}

const normalizeVocabularyItem = (payload) => {
  return {
    id: payload.id ?? null,
    term: payload.term,
    contextSentence: payload.context_sentence,
    definition: payload.definition,
    difficulty: payload.difficulty,
    isSaved: Boolean(payload.is_saved),
  }
}

const normalizeVocabQuizQuestion = (payload) => {
  return {
    prompt: payload.prompt,
    options: Array.isArray(payload.options) ? payload.options : [],
    correctAnswer: payload.correct_answer,
    contextSentence: payload.context_sentence,
  }
}

const getSelectedSession = () => {
  return state.sessions.find((session) => session.sessionId === state.selectedSessionId) ?? null
}

const getSelectedSessionDetail = () => {
  if (!state.selectedSessionId) {
    return null
  }
  return state.sessionDetailsById.get(state.selectedSessionId) ?? getSelectedSession()
}

const getFilteredSessions = () => {
  const query = state.sessionSearch.trim().toLowerCase()
  return state.sessions.filter((session) => {
    const matchesQuery =
      !query || `${session.videoTitle} ${session.videoId}`.toLowerCase().includes(query)
    const matchesStatus =
      state.sessionStatusFilter === "all" || session.quizStatus === state.sessionStatusFilter
    const matchesDate =
      !state.sessionDateFilter || String(session.completedAt ?? "").startsWith(state.sessionDateFilter)
    return matchesQuery && matchesStatus && matchesDate
  })
}

const getDifficultyBadgeClass = (difficulty) => {
  if (difficulty === "hard") {
    return "is-orange"
  }
  if (difficulty === "easy") {
    return "is-green"
  }
  return "is-blue"
}

const buildEyeIcon = (isMasked) => {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
      ${isMasked ? `<path class="icon-slash" d="M4 4l16 16"></path>` : ""}
    </svg>
  `
}

const buildStarIcon = (isSaved) => {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="${isSaved ? "is-filled" : ""}">
      <path d="m12 3.8 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6L7.1 19l.9-5.5-4-3.9 5.5-.8L12 3.8Z"></path>
    </svg>
  `
}

const updateUrl = ({ replaceHistory = false } = {}) => {
  const nextUrl = new URL(window.location.href)
  nextUrl.searchParams.set("view", state.activeView)
  if ((state.activeView === "sessions" || state.activeView === "vocabulary") && state.selectedSessionId) {
    nextUrl.searchParams.set("session_id", String(state.selectedSessionId))
  }
  const method = replaceHistory ? "replaceState" : "pushState"
  window.history[method]({}, "", nextUrl)
}

const setActiveView = (view, { replaceHistory = false } = {}) => {
  if (!VIEW_TITLES[view]) {
    return
  }

  state.activeView = view
  elements.viewTitle.textContent = VIEW_TITLES[view]
  elements.contextSummary.textContent = VIEW_CONTEXT[view]
  elements.main.classList.toggle(
    "is-compact-workspace",
    view === "sessions" || view === "vocabulary",
  )

  for (const navItem of elements.nav.querySelectorAll("[data-view]")) {
    navItem.classList.toggle("is-active", navItem.dataset.view === view)
  }

  for (const [panelView, panel] of Object.entries(elements.panels)) {
    panel.hidden = panelView !== view
    panel.classList.toggle("is-active", panelView === view)
  }

  updateUrl({ replaceHistory })

  if ((view === "sessions" || view === "vocabulary") && state.sessions.length > 0 && !state.selectedSessionId) {
    void selectSession(state.sessions[0].sessionId, { replaceHistory: true })
  }
  if (view === "quiz-history" && state.sessionsState === "ready" && state.quizHistoryState === "empty") {
    void loadQuizHistory()
  }
  if (view === "vocabulary" && state.selectedSessionId) {
    void loadVocabulary(state.selectedSessionId)
  }

  renderActiveView()
}

const renderShell = () => {
  const user = state.profile?.user
  elements.avatar.textContent = user ? buildAvatarInitials(user.username) : "--"
  elements.userline.textContent = user ? `${user.username} / ${user.email}` : "Loading learner"
}

const buildStateMarkup = (message, { error = false } = {}) => {
  return `
    <div class="state-block ${error ? "state-error" : ""}">
      <p class="state-copy">${escapeHtml(message)}</p>
    </div>
  `
}

const buildLoadingMarkup = (message) => {
  return `
    <div class="state-block">
      <div class="loading-inline">
        <div class="loading-spinner" aria-hidden="true"></div>
        <p class="state-copy">${escapeHtml(message)}</p>
      </div>
    </div>
  `
}

const buildSkeletonMarkup = () => {
  return `
    <div class="state-block">
      <div class="skeleton-stack" aria-hidden="true">
        <span class="skeleton-line is-title"></span>
        <span class="skeleton-line"></span>
        <span class="skeleton-line"></span>
        <span class="skeleton-line is-short"></span>
      </div>
    </div>
  `
}

const buildMetricGrid = () => {
  const stats = state.profile?.stats ?? {}
  const metrics = [
    ["Total Sessions", stats.total_sessions ?? "--"],
    ["Saved Transcripts", stats.saved_transcripts ?? "--"],
    ["Average Accuracy", formatPercent(stats.average_accuracy)],
    ["Total Quizzes", stats.total_quizzes ?? "--"],
    ["Average Quiz Score", formatPercent(stats.average_quiz_score)],
  ]

  return `
    <div class="metric-grid">
      ${metrics
        .map(([label, value]) => {
          return `
            <article class="metric-card">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </article>
          `
        })
        .join("")}
    </div>
  `
}

const buildBars = ({ items, valueKey, labelKey, type = "", maxValue = 100 }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p class="state-copy">Not enough data yet.</p>`
  }

  const resolvedMax = Math.max(maxValue, ...items.map((item) => Number(item[valueKey] ?? 0)))
  return `
    <div class="analytics-bars">
      ${items
        .map((item) => {
          const value = Number(item[valueKey] ?? 0)
          const height = Math.max(6, Math.round((value / resolvedMax) * 100))
          const label = formatShortDate(item[labelKey])
          return `
            <div class="analytics-bar ${type ? `is-${type}` : ""}" title="${escapeHtml(`${label}: ${value}`)}">
              <span class="analytics-bar-fill" style="height: ${height}%"></span>
              <span class="analytics-bar-label">${escapeHtml(label)}</span>
            </div>
          `
        })
        .join("")}
    </div>
  `
}

const buildSessionRail = ({
  title = "Transcript Source",
  summary = "",
  collapsible = false,
  collapsed = false,
} = {}) => {
  if (state.sessionsState === "loading") {
    return `
      <aside class="session-rail ${collapsed ? "is-collapsed" : ""}">
        <div class="card-header">
          <div>
            <h3 class="card-title">${escapeHtml(title)}</h3>
            <p class="panel-subtext">Loading transcript list.</p>
          </div>
        </div>
        ${buildLoadingMarkup("Loading transcripts.")}
      </aside>
    `
  }

  if (state.sessionsState === "error") {
    return `
      <aside class="session-rail ${collapsed ? "is-collapsed" : ""}">
        <div class="card-header">
          <div>
            <h3 class="card-title">${escapeHtml(title)}</h3>
            <p class="panel-subtext">Could not load sessions.</p>
          </div>
        </div>
        ${buildStateMarkup(state.sessionsError || "Could not load sessions.", { error: true })}
      </aside>
    `
  }

  const sessions = getFilteredSessions()
  return `
    <aside class="session-rail ${collapsed ? "is-collapsed" : ""}">
      <div class="card-header">
        <div class="session-rail-heading">
          <h3 class="card-title">${escapeHtml(title)}</h3>
          <p class="panel-subtext">${escapeHtml(summary || `${sessions.length} sessions available.`)}</p>
        </div>
        ${
          collapsible
            ? `
              <button
                type="button"
                class="rail-toggle-button"
                data-toggle-vocab-source
                aria-label="${collapsed ? "Expand vocabulary source" : "Collapse vocabulary source"}"
                title="${collapsed ? "Expand" : "Collapse"}"
              >
                ${collapsed ? ">>" : "<<"}
              </button>
            `
            : ""
        }
      </div>
      <div class="session-list" aria-live="polite" ${collapsed ? "hidden" : ""}>
        ${
          sessions.length === 0
            ? buildStateMarkup("No sessions match the current filters.")
            : sessions
                .map((session) => {
                  const isSelected = session.sessionId === state.selectedSessionId
                  return `
                    <button
                      type="button"
                      class="session-button ${isSelected ? "is-selected" : ""}"
                      data-select-session="${session.sessionId}"
                      aria-pressed="${isSelected}"
                    >
                      <h4 class="session-title">${escapeHtml(session.videoTitle)}</h4>
                      <div class="item-meta">
                        <span>YouTube / ${escapeHtml(session.videoId)}</span>
                        <span>${escapeHtml(formatDate(session.completedAt))}</span>
                        <span class="badge is-blue">${escapeHtml(formatPercent(session.accuracyScore))}</span>
                      </div>
                    </button>
                  `
                })
                .join("")
        }
      </div>
    </aside>
  `
}

const renderDashboardView = () => {
  const panel = elements.panels.dashboard
  if (state.profileState === "loading") {
    panel.innerHTML = buildLoadingMarkup("Loading dashboard.")
    return
  }
  if (state.profileState === "error" || !state.profile) {
    panel.innerHTML = buildStateMarkup(state.profileError || "Could not load dashboard.", {
      error: true,
    })
    return
  }

  const analytics = state.profile.analytics ?? {}
  const weakestSkill = analytics.weakest_skill ?? {
    label: "Not enough quiz data",
    missed_count: 0,
    summary: "Submit quizzes to identify your focus area.",
  }
  const recentSessions = state.sessions.slice(0, 4)

  panel.innerHTML = `
    ${buildMetricGrid()}
    <div class="dashboard-grid">
      <article class="content-card">
        <div>
          <h3 class="card-title">Accuracy Trend</h3>
          <p class="panel-subtext">Daily listening accuracy from saved sessions.</p>
        </div>
        ${buildBars({
          items: analytics.accuracy_by_day ?? [],
          valueKey: "average_accuracy",
          labelKey: "date",
          maxValue: 100,
        })}
      </article>
      <article class="content-card">
        <div>
          <h3 class="card-title">Focus Area</h3>
          <p class="panel-subtext">Based on wrong quiz answers.</p>
        </div>
        <div class="timeline-card">
          <span class="section-label">Weakest Skill</span>
          <h3 class="card-title">${escapeHtml(weakestSkill.label)}</h3>
          <p class="state-copy">${escapeHtml(weakestSkill.summary)}</p>
          <span class="badge is-orange">${escapeHtml(weakestSkill.missed_count)} misses</span>
        </div>
      </article>
      <article class="content-card">
        <div>
          <h3 class="card-title">Quiz Score</h3>
          <p class="panel-subtext">Daily average from saved attempts.</p>
        </div>
        ${buildBars({
          items: analytics.quiz_score_by_day ?? [],
          valueKey: "average_score",
          labelKey: "date",
          type: "quiz",
          maxValue: 100,
        })}
      </article>
      <article class="content-card">
        <div>
          <h3 class="card-title">Continue Learning</h3>
          <p class="panel-subtext">Open one flow, then move between transcript, quiz, attempts, and vocabulary.</p>
        </div>
        <div class="list-grid">
          ${
            recentSessions.length === 0
              ? `<p class="state-copy">No sessions yet.</p>`
              : recentSessions
                  .map((session) => {
                    return `
                      <div class="list-item">
                        <div>
                          <h4 class="item-title">${escapeHtml(session.videoTitle)}</h4>
                          <div class="item-meta">
                            <span>${escapeHtml(formatDate(session.completedAt))}</span>
                            <span>${escapeHtml(formatPercent(session.accuracyScore))}</span>
                            <span>${escapeHtml(session.quizStatus)}</span>
                          </div>
                        </div>
                        <div class="row-actions">
                          <button class="button-ghost" type="button" data-open-session="${session.sessionId}">Study</button>
                          <button class="button-ghost" type="button" data-open-vocabulary="${session.sessionId}">Words</button>
                        </div>
                      </div>
                    `
                  })
                  .join("")
          }
        </div>
      </article>
    </div>
  `
}

const buildStudyBoard = () => {
  const selectedSession = getSelectedSession()
  if (!selectedSession) {
    return `
      <section class="study-board">
        <div class="study-content">
          <div class="empty-state">
            <span class="eyebrow">Study Workspace</span>
            <p class="state-copy">Select a session to review transcript, generate a quiz, and inspect saved attempts.</p>
          </div>
        </div>
      </section>
    `
  }

  const detail = getSelectedSessionDetail()
  const isLoadingDetail = state.loadingSessionIds.has(selectedSession.sessionId)
  const detailError = state.sessionDetailErrorsById.get(selectedSession.sessionId)

  return `
    <section class="study-board">
      <div class="study-header">
        <div class="study-header-main">
          <div>
            <span class="eyebrow">Selected Session</span>
            <h3 class="study-title">${escapeHtml(selectedSession.videoTitle)}</h3>
            <div class="item-meta">
              <span>YouTube / ${escapeHtml(selectedSession.videoId)}</span>
              <span>${escapeHtml(formatDate(selectedSession.completedAt))}</span>
              <span>${escapeHtml(String(selectedSession.wordCount))} words</span>
              <span class="badge is-blue">${escapeHtml(formatPercent(selectedSession.accuracyScore))}</span>
              <span class="badge ${selectedSession.quizStatus === "Quiz Generated" ? "is-green" : ""}">${escapeHtml(selectedSession.quizStatus)}</span>
            </div>
          </div>
        </div>
        <div class="study-tabs" role="tablist" aria-label="Session workspace">
          ${["quiz", "attempts"]
            .map((tab) => {
              const label = tab === "quiz" ? "Reading Quiz" : "Attempts"
              return `
                <button
                  type="button"
                  class="study-tab ${state.activeStudyTab === tab ? "is-active" : ""}"
                  data-study-tab="${tab}"
                  role="tab"
                  aria-selected="${state.activeStudyTab === tab}"
                >
                  ${label}
                </button>
              `
            })
            .join("")}
        </div>
      </div>
      <div class="study-content">
        ${
          isLoadingDetail
            ? buildLoadingMarkup("Loading selected transcript.")
            : detailError
              ? buildStateMarkup(detailError, { error: true })
              : state.activeStudyTab === "quiz"
                ? buildReadingQuizMarkup()
                : buildAttemptHistoryMarkup(selectedSession.sessionId)
        }
      </div>
    </section>
  `
}

const buildDifficultySelect = (id) => {
  return `
    <label class="control-field" for="${id}">
      <span class="control-label">Difficulty</span>
      <select id="${id}" class="control-select" data-setting-select="defaultDifficulty">
        <option value="easy" ${state.settings.defaultDifficulty === "easy" ? "selected" : ""}>Easy</option>
        <option value="medium" ${state.settings.defaultDifficulty === "medium" ? "selected" : ""}>Medium</option>
        <option value="hard" ${state.settings.defaultDifficulty === "hard" ? "selected" : ""}>Hard</option>
      </select>
    </label>
  `
}

const buildQuestionTypeSelect = (id) => {
  return `
    <label class="control-field" for="${id}">
      <span class="control-label">Question Type</span>
      <select id="${id}" class="control-select" data-setting-select="defaultQuestionType">
        ${QUESTION_TYPES
          .map(([value, label]) => {
            return `<option value="${value}" ${state.settings.defaultQuestionType === value ? "selected" : ""}>${label}</option>`
          })
          .join("")}
      </select>
    </label>
  `
}

const getSubmittedAttempt = () => {
  return state.currentQuizId ? state.submittedAttemptByQuizId.get(state.currentQuizId) ?? null : null
}

const getAnsweredQuestionCount = () => {
  return state.currentQuizQuestions.filter((question) => {
    return Boolean(state.selectedAnswersByQuestionId[question.id])
  }).length
}

const hasAnsweredEveryQuestion = () => {
  return state.currentQuizQuestions.length > 0 && getAnsweredQuestionCount() === state.currentQuizQuestions.length
}

const getQuizNoticeClassName = () => {
  return state.quizNoticeTone === "success"
    ? "question-note quiz-save-note"
    : "question-note quiz-notice"
}

const buildReadingQuizMarkup = () => {
  const selectedSession = getSelectedSession()
  if (!selectedSession) {
    return buildStateMarkup("Select a session first.")
  }

  const isGenerating = state.generatingSessionIds.has(selectedSession.sessionId)
  const isQuizForSelected = state.quizSessionId === selectedSession.sessionId
  const submittedAttempt = isQuizForSelected ? getSubmittedAttempt() : null

  if (isGenerating || (isQuizForSelected && state.quizState === "loading")) {
    return `
      <div class="quiz-builder">
        <div>
          <h3 class="card-title">Reading Quiz</h3>
          <p class="panel-subtext">Generating focused questions from the selected transcript.</p>
        </div>
        ${buildDifficultySelect("quiz-loading-difficulty")}
        ${buildQuestionTypeSelect("quiz-loading-question-type")}
        <button type="button" class="button-primary" disabled>Generating...</button>
      </div>
      ${buildSkeletonMarkup()}
    `
  }

  if (isQuizForSelected && state.quizState === "error") {
    return `
      ${buildStateMarkup(state.quizError || "Could not load quiz.", { error: true })}
      <div class="button-row">
        <button type="button" class="button-primary" data-generate-selected-quiz>Retry</button>
      </div>
    `
  }

  const hasQuiz = isQuizForSelected && state.quizState === "generated" && state.currentQuizQuestions.length > 0
  const questionMarkup = hasQuiz ? buildReadingQuestionCards(submittedAttempt) : ""
  const scoreSummary = submittedAttempt
    ? `
      <div class="quiz-result-summary">
        <span class="badge ${submittedAttempt.score >= 80 ? "is-green" : "is-orange"}">${formatPercent(submittedAttempt.score)}</span>
        <p class="question-note">${submittedAttempt.correct_count}/${submittedAttempt.total_questions} answers correct.</p>
      </div>
    `
    : hasQuiz
      ? `<p class="question-note">${getAnsweredQuestionCount()}/${state.currentQuizQuestions.length} answers selected.</p>`
      : ""

  return `
    <div class="quiz-builder ${hasQuiz ? "is-compact" : ""}">
      ${
        hasQuiz
          ? ""
          : `
            <div>
              <h3 class="card-title">Create a reading quiz</h3>
              <p class="panel-subtext">Choose difficulty and question focus, then generate questions for the selected session.</p>
            </div>
          `
      }
      ${buildDifficultySelect("quiz-difficulty")}
      ${buildQuestionTypeSelect("quiz-question-type")}
      <button type="button" class="button-primary" data-generate-selected-quiz>
        ${hasQuiz ? "Regenerate" : "Generate Quiz"}
      </button>
    </div>
    ${
      hasQuiz
        ? `
          <div class="question-list">${questionMarkup}</div>
          ${scoreSummary}
          ${state.quizNotice ? `<p class="${getQuizNoticeClassName()}" role="status">${state.quizNotice}</p>` : ""}
          <div class="quiz-footer-actions">
            <button type="button" class="button-ghost" data-generate-selected-quiz>Regenerate Quiz</button>
            ${submittedAttempt ? `<button type="button" class="button-ghost" data-retake-quiz>Retake Quiz</button>` : ""}
            <button
              type="button"
              class="button-primary"
              data-submit-quiz
              ${submittedAttempt || !hasAnsweredEveryQuestion() ? "disabled" : ""}
            >
              ${submittedAttempt ? "Submitted" : "Submit Quiz"}
            </button>
          </div>
        `
        : buildStateMarkup("No quiz loaded for this session yet. Generate one from the transcript.")
    }
  `
}

const buildReadingQuestionCards = (submittedAttempt) => {
  const submittedResults = new Map(
    (submittedAttempt?.results ?? []).map((item) => [item.question_id, item]),
  )

  return state.currentQuizQuestions
    .map((question, index) => {
      const optionMarkup = Object.entries(question.options)
        .map(([label, value]) => {
          const isChecked = state.selectedAnswersByQuestionId[question.id] === label
          const result = submittedResults.get(question.id)
          const resultClass = result
            ? label === result.correct_answer
              ? "is-correct"
              : isChecked
                ? "is-incorrect"
                : ""
            : ""
          return `
            <label class="option-row ${isChecked ? "is-selected" : ""} ${resultClass}">
              <input
                type="radio"
                name="quiz-question-${question.id}"
                value="${label}"
                data-question-id="${question.id}"
                ${isChecked ? "checked" : ""}
                ${submittedAttempt ? "disabled" : ""}
              />
              <span class="option-label">${label}</span>
              <span class="option-copy">${escapeHtml(value)}</span>
            </label>
          `
        })
        .join("")

      const result = submittedResults.get(question.id)
      const resultMarkup = result
        ? `
          <div class="answer-line">
            <strong>Your Answer</strong>
            <span class="answer-badge">${escapeHtml(result.selected_answer ?? "--")}</span>
            <strong>Correct Answer</strong>
            <span class="answer-badge">${escapeHtml(result.correct_answer)}</span>
            <span class="result-badge ${result.is_correct ? "is-correct" : "is-incorrect"}">
              ${result.is_correct ? "Correct" : "Review"}
            </span>
          </div>
          <div class="explanation-line">
            <strong>Explanation</strong>
            <p class="explanation-copy">${escapeHtml(result.explanation)}</p>
          </div>
        `
        : ""

      return `
        <article class="question-card">
          <span class="question-index">Question ${index + 1}</span>
          <h3>${escapeHtml(question.question)}</h3>
          <div class="option-list">${optionMarkup}</div>
          ${resultMarkup}
        </article>
      `
    })
    .join("")
}

const buildAttemptHistoryMarkup = (sessionId) => {
  const isLoading = state.loadingAttemptHistorySessionIds.has(sessionId)
  const error = state.attemptHistoryErrorsBySessionId.get(sessionId)
  const history = state.attemptHistoryBySessionId.get(sessionId) ?? []

  if (isLoading) {
    return buildLoadingMarkup("Loading attempt history.")
  }
  if (error) {
    return buildStateMarkup(error, { error: true })
  }
  if (history.length === 0) {
    return buildStateMarkup("No attempts yet. Submit a reading quiz to start the review loop.")
  }

  const activeAttemptId = state.activeAttemptIdBySessionId.get(sessionId) ?? history[0].attempt_id
  const activeAttempt = history.find((attempt) => attempt.attempt_id === activeAttemptId) ?? history[0]
  const wrongResults = activeAttempt.results.filter((result) => !result.is_correct)

  return `
    <div class="attempt-layout">
      <div class="attempt-list">
        ${history
          .map((attempt, index) => {
            const wrongCount = Math.max(0, attempt.total_questions - attempt.correct_count)
            const isActive = attempt.attempt_id === activeAttempt.attempt_id
            return `
              <button
                type="button"
                class="attempt-card ${isActive ? "is-active" : ""}"
                data-attempt-id="${attempt.attempt_id}"
              >
                <div class="inline-actions">
                  <strong>Attempt ${history.length - index}</strong>
                  <span class="badge ${attempt.score >= 80 ? "is-green" : "is-orange"}">${escapeHtml(formatPercent(attempt.score))}</span>
                </div>
                <div class="item-meta">
                  <span>${escapeHtml(formatDateTime(attempt.submitted_at))}</span>
                  <span>${attempt.correct_count}/${attempt.total_questions} correct</span>
                  <span>${wrongCount} wrong</span>
                </div>
              </button>
            `
          })
          .join("")}
      </div>
      <div class="attempt-review-panel">
        <div class="content-card">
          <span class="eyebrow">Review Detail</span>
          <h3 class="card-title">${escapeHtml(formatPercent(activeAttempt.score))} score</h3>
          <p class="state-copy">${activeAttempt.correct_count}/${activeAttempt.total_questions} answers correct.</p>
        </div>
        ${
          wrongResults.length === 0
            ? `<div class="attempt-review-card"><p class="quiz-save-note">All answers were correct.</p></div>`
            : wrongResults
                .map((result, index) => {
                  return `
                    <article class="attempt-review-card">
                      <span class="question-index">Review ${index + 1}</span>
                      <h4>${escapeHtml(result.question)}</h4>
                      <p>Your answer <strong>${escapeHtml(result.selected_answer ?? "--")}</strong>, correct answer <strong>${escapeHtml(result.correct_answer)}</strong>.</p>
                      <p>${escapeHtml(result.explanation)}</p>
                    </article>
                  `
                })
                .join("")
        }
      </div>
    </div>
  `
}

const renderSessionsView = () => {
  const panel = elements.panels.sessions
  panel.innerHTML = `
    <div class="toolbar">
      <label class="control-field">
        <span class="control-label">Search</span>
        <input id="dashboard-session-search" class="control-input" type="search" value="${escapeHtml(state.sessionSearch)}" placeholder="Title or video ID" />
      </label>
      <label class="control-field">
        <span class="control-label">Status</span>
        <select id="dashboard-session-filter" class="control-select">
          <option value="all" ${state.sessionStatusFilter === "all" ? "selected" : ""}>All</option>
          <option value="Completed" ${state.sessionStatusFilter === "Completed" ? "selected" : ""}>Completed</option>
          <option value="Quiz Ready" ${state.sessionStatusFilter === "Quiz Ready" ? "selected" : ""}>Quiz Ready</option>
          <option value="Quiz Generated" ${state.sessionStatusFilter === "Quiz Generated" ? "selected" : ""}>Quiz Generated</option>
        </select>
      </label>
      <label class="control-field">
        <span class="control-label">Date</span>
        <input id="dashboard-session-date" class="control-input" type="date" value="${escapeHtml(state.sessionDateFilter)}" />
      </label>
    </div>
    <div class="study-layout">
      ${buildSessionRail({ summary: `${getFilteredSessions().length} sessions in this workspace.` })}
      ${buildStudyBoard()}
    </div>
  `
}

const renderQuizHistoryView = () => {
  const panel = elements.panels["quiz-history"]
  if (state.sessionsState === "loading") {
    panel.innerHTML = buildLoadingMarkup("Loading sessions first.")
    return
  }
  if (state.quizHistoryState === "loading") {
    panel.innerHTML = buildLoadingMarkup("Loading quiz history.")
    return
  }
  if (state.quizHistoryState === "error") {
    panel.innerHTML = buildStateMarkup(state.quizHistoryError || "Could not load quiz history.", {
      error: true,
    })
    return
  }
  if (state.quizHistoryState === "empty") {
    panel.innerHTML = `
      <div class="state-block">
        <p class="state-copy">Open this view to load saved quiz attempts.</p>
        <button class="button-primary" type="button" data-load-quiz-history>Load History</button>
      </div>
    `
    return
  }

  if (state.quizAttempts.length === 0) {
    panel.innerHTML = buildStateMarkup("No submitted quiz attempts yet.")
    return
  }

  const activeAttempt =
    state.quizAttempts.find((attempt) => attempt.attempt_id === state.activeGlobalAttemptId) ??
    state.quizAttempts[0]
  const wrongResults = activeAttempt.results.filter((result) => !result.is_correct)

  panel.innerHTML = `
    <div class="attempt-layout">
      <div class="attempt-list">
        ${state.quizAttempts
          .map((attempt) => {
            const isActive = attempt.attempt_id === activeAttempt.attempt_id
            return `
              <button type="button" class="attempt-card ${isActive ? "is-active" : ""}" data-global-attempt-id="${attempt.attempt_id}">
                <strong>${escapeHtml(attempt.sessionTitle)}</strong>
                <div class="item-meta">
                  <span>${escapeHtml(formatDateTime(attempt.submitted_at))}</span>
                  <span class="badge ${attempt.score >= 80 ? "is-green" : "is-orange"}">${escapeHtml(formatPercent(attempt.score))}</span>
                  <span>${attempt.correct_count}/${attempt.total_questions} correct</span>
                </div>
              </button>
            `
          })
          .join("")}
      </div>
      <div class="attempt-review-panel">
        <div class="content-card">
          <span class="eyebrow">Selected Attempt</span>
          <h3 class="card-title">${escapeHtml(activeAttempt.sessionTitle)}</h3>
          <p class="state-copy">${escapeHtml(formatPercent(activeAttempt.score))} / ${activeAttempt.correct_count}/${activeAttempt.total_questions} correct.</p>
          <div class="button-row">
            <button type="button" class="button-ghost" data-open-session="${activeAttempt.sessionId}">Open Session</button>
          </div>
        </div>
        ${
          wrongResults.length === 0
            ? `<div class="attempt-review-card"><p class="quiz-save-note">All answers were correct.</p></div>`
            : wrongResults
                .map((result, index) => {
                  return `
                    <article class="attempt-review-card">
                      <span class="question-index">Review ${index + 1}</span>
                      <h4>${escapeHtml(result.question)}</h4>
                      <p>Your answer <strong>${escapeHtml(result.selected_answer ?? "--")}</strong>, correct answer <strong>${escapeHtml(result.correct_answer)}</strong>.</p>
                      <p>${escapeHtml(result.explanation)}</p>
                    </article>
                  `
                })
                .join("")
        }
      </div>
    </div>
  `
}

const getVocabularyForSelectedSession = () => {
  return state.selectedSessionId
    ? state.vocabularyBySessionId.get(state.selectedSessionId) ?? []
    : []
}

const getFilteredVocabulary = () => {
  const query = state.wordSearchTerm.trim().toLowerCase()
  return getVocabularyForSelectedSession().filter((item) => {
    const matchesQuery =
      !query || `${item.term} ${item.definition} ${item.contextSentence}`.toLowerCase().includes(query)
    const matchesDifficulty =
      state.difficultyFilter === "all" || item.difficulty === state.difficultyFilter
    const matchesSaved = !state.savedOnly || item.isSaved
    return matchesQuery && matchesDifficulty && matchesSaved
  })
}

const buildWordPanel = () => {
  const selectedSession = getSelectedSession()
  if (!selectedSession) {
    return `
      <section class="word-panel content-card">
        ${buildStateMarkup("Select a transcript to extract vocabulary.")}
      </section>
    `
  }

  const allItems = getVocabularyForSelectedSession()
  const filteredItems = getFilteredVocabulary()
  const isMasked = state.maskedVocabularySessionIds.has(selectedSession.sessionId)
  const content =
    state.vocabularyState === "loading"
      ? buildLoadingMarkup("Extracting vocabulary from transcript context.")
      : state.vocabularyState === "error"
        ? buildStateMarkup(state.vocabularyError || "Could not load vocabulary.", { error: true })
        : allItems.length === 0
          ? buildStateMarkup("No vocabulary candidates were found for this transcript.")
        : filteredItems.length === 0
            ? buildStateMarkup("No words match the current filters.")
            : `
              <div class="word-grid">
                ${filteredItems
                  .map((item) => {
                    return `
                      <article class="word-card">
                        <div class="word-card-header">
                          <div>
                            <h3 class="word-term">${escapeHtml(item.term)}</h3>
                            <div class="word-meta">
                              <span class="badge ${getDifficultyBadgeClass(item.difficulty)}">${escapeHtml(item.difficulty)}</span>
                              ${item.isSaved ? `<span class="badge is-green">Saved</span>` : ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            class="icon-button ${item.isSaved ? "is-active" : ""}"
                            data-save-term="${encodeURIComponent(item.term)}"
                            aria-label="${item.isSaved ? "Saved word" : `Save ${escapeHtml(item.term)}`}"
                            title="${item.isSaved ? "Saved" : "Save"}"
                            ${item.isSaved ? "disabled" : ""}
                          >
                            ${buildStarIcon(item.isSaved)}
                          </button>
                        </div>
                        <p class="word-definition">${escapeHtml(item.definition)}</p>
                        <p class="word-context">${escapeHtml(item.contextSentence)}</p>
                      </article>
                    `
                  })
                  .join("")}
              </div>
            `

  return `
    <section class="word-panel content-card">
      <div class="card-header">
        <div>
          <span class="eyebrow">Vocabulary Bank</span>
          <h3 class="card-title">${escapeHtml(selectedSession.videoTitle)}</h3>
          <p class="panel-subtext">${escapeHtml(String(allItems.length))} extracted words.</p>
        </div>
        <div class="inline-actions">
          <button
            type="button"
            class="icon-button ${isMasked ? "is-active" : ""}"
            data-toggle-vocab-mask
            aria-label="${isMasked ? "Show vocabulary bank" : "Hide vocabulary bank"}"
            title="${isMasked ? "Show vocabulary bank" : "Hide vocabulary bank"}"
          >
            ${buildEyeIcon(isMasked)}
          </button>
          <button type="button" class="button-ghost" data-refresh-vocabulary>Refresh</button>
        </div>
      </div>
      <div class="word-toolbar">
        <label class="control-field">
          <span class="control-label">Search word</span>
          <input id="vocab-word-search" class="control-input" type="search" value="${escapeHtml(state.wordSearchTerm)}" placeholder="Search word" />
        </label>
        <label class="control-field">
          <span class="control-label">Difficulty</span>
          <select id="vocab-difficulty-filter" class="control-select">
            <option value="all" ${state.difficultyFilter === "all" ? "selected" : ""}>All</option>
            <option value="easy" ${state.difficultyFilter === "easy" ? "selected" : ""}>Easy</option>
            <option value="medium" ${state.difficultyFilter === "medium" ? "selected" : ""}>Medium</option>
            <option value="hard" ${state.difficultyFilter === "hard" ? "selected" : ""}>Hard</option>
          </select>
        </label>
        <label class="toggle-field">
          <input id="vocab-saved-only" type="checkbox" ${state.savedOnly ? "checked" : ""} />
          <span>Saved only</span>
        </label>
      </div>
      <div class="word-list ${isMasked ? "is-masked" : ""}" aria-live="polite">${content}</div>
    </section>
  `
}

const buildMiniQuizPanel = () => {
  const selectedSession = getSelectedSession()
  if (!selectedSession) {
    return `
      <aside class="mini-quiz-panel">
        ${buildStateMarkup("Select a transcript to start a mini quiz.")}
      </aside>
    `
  }

  const questions = state.vocabQuizBySessionId.get(selectedSession.sessionId) ?? []
  const answers = state.vocabQuizAnswersBySessionId.get(selectedSession.sessionId) ?? {}
  const answeredCount = Object.keys(answers).length

  const body =
    state.vocabQuizState === "loading"
      ? buildLoadingMarkup("Building vocabulary mini quiz.")
      : state.vocabQuizState === "error"
        ? buildStateMarkup(state.vocabQuizError || "Could not build mini quiz.", { error: true })
        : questions.length === 0
          ? buildStateMarkup("Start a cloze quiz from the extracted words.")
          : questions
              .map((question, index) => {
                const selectedAnswer = answers[index] ?? ""
                const options = question.options
                  .map((option) => {
                    const isSelected = selectedAnswer === option
                    const isAnswered = Boolean(selectedAnswer)
                    const resultClass = isAnswered
                      ? option === question.correctAnswer
                        ? "is-correct"
                        : isSelected
                          ? "is-incorrect"
                          : ""
                      : ""
                    return `
                      <label class="option-row ${isSelected ? "is-selected" : ""} ${resultClass}">
                        <input
                          type="radio"
                          name="vocab-question-${index}"
                          value="${escapeHtml(option)}"
                          data-vocab-question-index="${index}"
                          ${isSelected ? "checked" : ""}
                        />
                        <span class="option-label">${index + 1}</span>
                        <span class="option-copy">${escapeHtml(option)}</span>
                      </label>
                    `
                  })
                  .join("")
                const resultMarkup = selectedAnswer
                  ? `
                    <p class="question-note">
                      Answer: <strong>${escapeHtml(question.correctAnswer)}</strong>
                    </p>
                    <p class="word-context">${escapeHtml(question.contextSentence)}</p>
                  `
                  : ""
                return `
                  <article class="mini-question">
                    <span class="question-index">Question ${index + 1}</span>
                    <h3 class="card-title">${escapeHtml(question.prompt)}</h3>
                    <div class="option-list">${options}</div>
                    ${resultMarkup}
                  </article>
                `
              })
              .join("")

  return `
    <aside class="mini-quiz-panel">
      <div class="card-header">
        <div>
          <span class="eyebrow">Mini Quiz</span>
          <h3 class="card-title">Vocabulary Check</h3>
          <p class="panel-subtext">${questions.length > 0 ? `${answeredCount}/${questions.length} answered.` : "Ready for this transcript."}</p>
        </div>
        <button type="button" class="button-primary" data-start-vocab-quiz>Start</button>
      </div>
      <div class="mini-quiz-body" aria-live="polite">${body}</div>
    </aside>
  `
}

const renderVocabularyView = () => {
  const panel = elements.panels.vocabulary
  if (state.sessionsState === "loading") {
    panel.innerHTML = buildLoadingMarkup("Loading transcripts.")
    return
  }
  if (state.sessions.length === 0) {
    panel.innerHTML = buildStateMarkup("No transcripts yet. Complete a session before building vocabulary.")
    return
  }

  panel.innerHTML = `
    <div class="vocab-workspace ${state.isVocabularySourceCollapsed ? "is-source-collapsed" : ""}">
      ${buildSessionRail({
        title: "Vocabulary Source",
        summary: "Pick the transcript that owns the word bank.",
        collapsible: true,
        collapsed: state.isVocabularySourceCollapsed,
      })}
      ${buildWordPanel()}
      ${buildMiniQuizPanel()}
    </div>
  `
}

const renderSettingsView = () => {
  const user = state.profile?.user
  elements.panels.settings.innerHTML = `
    <div class="settings-grid">
      <section class="content-card">
        <h3 class="card-title">Account</h3>
        <div class="settings-list">
          <div class="settings-row">
            <div>
              <strong>${escapeHtml(user?.username ?? "Learner")}</strong>
              <p class="panel-subtext">${escapeHtml(user?.email ?? "No email loaded")}</p>
            </div>
            <span class="badge is-blue">Signed in</span>
          </div>
          <div class="settings-row">
            <div>
              <strong>Main workspace</strong>
              <p class="panel-subtext">Use Sessions for transcript preview, reading quiz, attempts, and vocabulary entry points.</p>
            </div>
            <button type="button" class="button-ghost" data-view-link="sessions">Open</button>
          </div>
        </div>
      </section>
      <section class="content-card">
        <h3 class="card-title">Quiz Defaults</h3>
        <div class="settings-list">
          ${buildDifficultySelect("settings-difficulty")}
          ${buildQuestionTypeSelect("settings-question-type")}
        </div>
      </section>
    </div>
  `
}

const renderActiveView = () => {
  renderShell()
  if (state.activeView === "dashboard") {
    renderDashboardView()
  }
  if (state.activeView === "sessions") {
    renderSessionsView()
  }
  if (state.activeView === "quiz-history") {
    renderQuizHistoryView()
  }
  if (state.activeView === "vocabulary") {
    renderVocabularyView()
  }
  if (state.activeView === "settings") {
    renderSettingsView()
  }
}

const renderAll = () => {
  renderShell()
  renderDashboardView()
  renderSessionsView()
  renderQuizHistoryView()
  renderVocabularyView()
  renderSettingsView()
}

const updateSession = (nextSession) => {
  const index = state.sessions.findIndex((session) => session.sessionId === nextSession.sessionId)
  if (index === -1) {
    state.sessions = [nextSession, ...state.sessions]
    return
  }
  state.sessions[index] = {
    ...state.sessions[index],
    ...nextSession,
  }
}

const applyQuizToState = (quiz) => {
  state.quizSessionId = quiz.sessionId
  state.currentQuizId = quiz.quizId
  state.currentQuizQuestions = quiz.questions
  state.quizState = quiz.questions.length > 0 ? "generated" : "empty"
  state.quizError = ""
  state.quizNotice = ""
  state.quizNoticeTone = "error"
  state.selectedAnswersByQuestionId = {}
}

const clearCurrentQuizState = () => {
  state.quizSessionId = null
  state.quizState = "empty"
  state.quizError = ""
  state.quizNotice = ""
  state.quizNoticeTone = "error"
  state.currentQuizId = null
  state.currentQuizQuestions = []
  state.selectedAnswersByQuestionId = {}
}

const loadProfile = async () => {
  state.profileState = "loading"
  renderActiveView()
  try {
    const response = await apiFetch("/api/v1/profile")
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    state.profile = await response.json()
    state.profileState = "ready"
  } catch (error) {
    state.profileState = "error"
    state.profileError = error instanceof Error ? error.message : "Could not load profile."
  }
  renderAll()
}

const loadSessions = async () => {
  state.sessionsState = "loading"
  renderActiveView()
  try {
    const response = await apiFetch("/api/v1/sessions?limit=100")
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    const payload = await response.json()
    state.sessions = Array.isArray(payload) ? payload.map(normalizeSession) : []
    state.sessionsState = "ready"
  } catch (error) {
    state.sessionsState = "error"
    state.sessionsError = error instanceof Error ? error.message : "Could not load sessions."
  }

  const requestedSessionId = Number(new URLSearchParams(window.location.search).get("session_id"))
  const requestedSession = state.sessions.find((session) => session.sessionId === requestedSessionId)
  if (requestedSession) {
    await selectSession(requestedSession.sessionId, { replaceHistory: true, renderAfter: false })
  } else if ((state.activeView === "sessions" || state.activeView === "vocabulary") && state.sessions.length > 0) {
    await selectSession(state.sessions[0].sessionId, { replaceHistory: true, renderAfter: false })
  }

  if (state.activeView === "quiz-history") {
    await loadQuizHistory()
  }
  renderAll()
}

const loadSessionDetail = async (sessionId, { force = false } = {}) => {
  if (!force && state.sessionDetailsById.has(sessionId)) {
    return state.sessionDetailsById.get(sessionId)
  }

  state.loadingSessionIds.add(sessionId)
  state.sessionDetailErrorsById.delete(sessionId)
  renderActiveView()
  try {
    const response = await apiFetch(`/api/v1/sessions/${sessionId}`)
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    const detail = normalizeSession(await response.json())
    state.sessionDetailsById.set(sessionId, detail)
    updateSession(detail)
    return detail
  } catch (error) {
    state.sessionDetailErrorsById.set(
      sessionId,
      error instanceof Error ? error.message : "Could not load transcript detail.",
    )
    return null
  } finally {
    state.loadingSessionIds.delete(sessionId)
    renderActiveView()
  }
}

const loadExistingQuizForSession = async (sessionId, { force = false } = {}) => {
  if (!force && state.quizzesBySessionId.has(sessionId)) {
    if (state.selectedSessionId === sessionId) {
      applyQuizToState(state.quizzesBySessionId.get(sessionId))
    }
    return
  }

  if (state.selectedSessionId === sessionId) {
    state.quizSessionId = sessionId
    state.quizState = "loading"
    renderActiveView()
  }

  try {
    const response = await apiFetch(`/api/v1/sessions/${sessionId}/quizzes`)
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    const quizzes = await response.json()
    if (!Array.isArray(quizzes) || quizzes.length === 0) {
      if (state.selectedSessionId === sessionId && state.quizSessionId === sessionId) {
        clearCurrentQuizState()
      }
      return
    }

    const latestQuiz = normalizeQuizResponse(quizzes[0])
    state.quizzesBySessionId.set(sessionId, latestQuiz)
    updateSession({ sessionId, quizStatus: "Quiz Generated" })
    if (state.selectedSessionId === sessionId) {
      applyQuizToState(latestQuiz)
    }
  } catch (error) {
    if (state.selectedSessionId === sessionId) {
      state.quizSessionId = sessionId
      state.quizState = "error"
      state.quizError = error instanceof Error ? error.message : "Could not load the generated quiz."
    }
  } finally {
    renderActiveView()
  }
}

const loadAttemptHistoryForSession = async (sessionId, { force = false } = {}) => {
  if (!force && state.attemptHistoryBySessionId.has(sessionId)) {
    return
  }

  state.loadingAttemptHistorySessionIds.add(sessionId)
  state.attemptHistoryErrorsBySessionId.delete(sessionId)
  renderActiveView()

  try {
    const quizzesResponse = await apiFetch(`/api/v1/sessions/${sessionId}/quizzes`)
    if (!quizzesResponse.ok) {
      throw new Error(await extractErrorMessage(quizzesResponse))
    }
    const quizzes = await quizzesResponse.json()
    const quizList = Array.isArray(quizzes) ? quizzes : []
    const groups = await Promise.all(
      quizList.map(async (quiz) => {
        const response = await apiFetch(`/api/v1/quizzes/${quiz.quiz_id}/attempts`)
        if (!response.ok) {
          throw new Error(await extractErrorMessage(response))
        }
        const attempts = await response.json()
        return Array.isArray(attempts) ? attempts : []
      }),
    )
    const history = groups
      .flat()
      .sort((left, right) => new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime())
    state.attemptHistoryBySessionId.set(sessionId, history)
    if (history.length > 0 && !state.activeAttemptIdBySessionId.has(sessionId)) {
      state.activeAttemptIdBySessionId.set(sessionId, history[0].attempt_id)
    }
  } catch (error) {
    state.attemptHistoryErrorsBySessionId.set(
      sessionId,
      error instanceof Error ? error.message : "Could not load attempt history.",
    )
  } finally {
    state.loadingAttemptHistorySessionIds.delete(sessionId)
    renderActiveView()
  }
}

const selectSession = async (sessionId, { tab = null, replaceHistory = false, renderAfter = true } = {}) => {
  const requestId = state.activeSelectionRequestId + 1
  state.activeSelectionRequestId = requestId
  state.selectedSessionId = sessionId
  if (tab) {
    state.activeStudyTab = tab
  }
  if (state.quizSessionId !== sessionId) {
    clearCurrentQuizState()
  }
  state.wordSearchTerm = ""
  state.difficultyFilter = "all"
  state.savedOnly = false
  state.vocabQuizState = state.vocabQuizBySessionId.has(sessionId) ? "ready" : "empty"
  updateUrl({ replaceHistory })
  renderActiveView()

  await loadSessionDetail(sessionId)
  if (requestId !== state.activeSelectionRequestId || state.selectedSessionId !== sessionId) {
    return
  }
  await Promise.allSettled([
    loadExistingQuizForSession(sessionId),
    loadAttemptHistoryForSession(sessionId),
  ])
  if (state.activeView === "vocabulary") {
    await loadVocabulary(sessionId)
  }
  if (renderAfter) {
    renderAll()
  }
}

const generateQuizForSelectedSession = async () => {
  const selectedSession = getSelectedSession()
  if (!selectedSession || state.generatingSessionIds.has(selectedSession.sessionId)) {
    return
  }

  const sessionId = selectedSession.sessionId
  state.generatingSessionIds.add(sessionId)
  state.activeStudyTab = "quiz"
  state.quizSessionId = sessionId
  state.quizState = "loading"
  state.quizError = ""
  state.quizNotice = ""
  state.currentQuizId = null
  state.currentQuizQuestions = []
  state.selectedAnswersByQuestionId = {}
  renderActiveView()

  try {
    if (!state.sessionDetailsById.has(sessionId)) {
      await loadSessionDetail(sessionId)
    }
    const response = await apiFetch(`/api/v1/sessions/${sessionId}/generate-quiz`, {
      method: "POST",
      body: JSON.stringify({
        difficulty: state.settings.defaultDifficulty,
        question_type: state.settings.defaultQuestionType,
      }),
    })
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    const quiz = normalizeQuizResponse(await response.json())
    state.quizzesBySessionId.set(sessionId, quiz)
    state.submittedAttemptByQuizId.delete(quiz.quizId)
    updateSession({ sessionId, quizStatus: "Quiz Generated" })
    applyQuizToState(quiz)
    await loadAttemptHistoryForSession(sessionId, { force: true })
    void loadProfile()
  } catch (error) {
    state.quizSessionId = sessionId
    state.quizState = "error"
    state.quizError = error instanceof Error ? error.message : "Could not generate a reading quiz right now."
  } finally {
    state.generatingSessionIds.delete(sessionId)
    renderAll()
  }
}

const submitCurrentQuizAttempt = async () => {
  if (!state.currentQuizId) {
    return
  }

  if (!hasAnsweredEveryQuestion()) {
    state.quizNotice = `Choose an answer for all ${state.currentQuizQuestions.length} questions before submitting.`
    state.quizNoticeTone = "error"
    renderActiveView()
    return
  }

  state.quizNotice = ""
  state.quizNoticeTone = "error"
  renderActiveView()

  const answers = state.currentQuizQuestions.map((question) => ({
    question_id: question.id,
    selected_answer: state.selectedAnswersByQuestionId[question.id],
  }))

  try {
    const response = await apiFetch(`/api/v1/quizzes/${state.currentQuizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    })
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    const payload = await response.json()
    state.submittedAttemptByQuizId.set(state.currentQuizId, payload)
    if (state.selectedSessionId) {
      await loadAttemptHistoryForSession(state.selectedSessionId, { force: true })
      state.activeAttemptIdBySessionId.set(state.selectedSessionId, payload.attempt_id)
    }
    state.quizNotice = "Attempt saved to history."
    state.quizNoticeTone = "success"
    void loadProfile()
  } catch (error) {
    state.quizState = "error"
    state.quizError = error instanceof Error ? error.message : "Could not submit your quiz attempt."
  }
  renderAll()
}

const loadQuizHistory = async () => {
  if (state.sessionsState !== "ready") {
    return
  }

  state.quizHistoryState = "loading"
  state.quizHistoryError = ""
  renderQuizHistoryView()

  try {
    const attempts = []
    for (const session of state.sessions) {
      const quizzesResponse = await apiFetch(`/api/v1/sessions/${session.sessionId}/quizzes`)
      if (!quizzesResponse.ok) {
        throw new Error(await extractErrorMessage(quizzesResponse))
      }
      const quizzes = await quizzesResponse.json()
      for (const quiz of Array.isArray(quizzes) ? quizzes : []) {
        const attemptsResponse = await apiFetch(`/api/v1/quizzes/${quiz.quiz_id}/attempts`)
        if (!attemptsResponse.ok) {
          throw new Error(await extractErrorMessage(attemptsResponse))
        }
        const quizAttempts = await attemptsResponse.json()
        for (const attempt of Array.isArray(quizAttempts) ? quizAttempts : []) {
          attempts.push({
            ...attempt,
            sessionId: session.sessionId,
            sessionTitle: session.videoTitle,
          })
        }
      }
    }
    state.quizAttempts = attempts.sort((left, right) => {
      return new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime()
    })
    state.activeGlobalAttemptId = state.quizAttempts[0]?.attempt_id ?? null
    state.quizHistoryState = "ready"
  } catch (error) {
    state.quizHistoryState = "error"
    state.quizHistoryError = error instanceof Error ? error.message : "Could not load quiz history."
  }

  renderQuizHistoryView()
}

const loadVocabulary = async (sessionId, { force = false } = {}) => {
  if (!force && state.vocabularyBySessionId.has(sessionId)) {
    state.vocabularyState = "ready"
    renderVocabularyView()
    return
  }

  state.vocabularyState = "loading"
  state.vocabularyError = ""
  renderVocabularyView()
  try {
    const response = await apiFetch(`/api/v1/sessions/${sessionId}/vocabulary`)
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    const payload = await response.json()
    const items = Array.isArray(payload.items)
      ? payload.items.map(normalizeVocabularyItem)
      : []
    state.vocabularyBySessionId.set(sessionId, items)
    state.vocabularyState = "ready"
  } catch (error) {
    state.vocabularyState = "error"
    state.vocabularyError = error instanceof Error ? error.message : "Could not load vocabulary."
  }
  renderVocabularyView()
}

const saveVocabularyItem = async (term) => {
  const sessionId = state.selectedSessionId
  if (!sessionId) {
    return
  }

  const items = state.vocabularyBySessionId.get(sessionId) ?? []
  const item = items.find((candidate) => candidate.term === term)
  if (!item || item.isSaved) {
    return
  }

  try {
    const response = await apiFetch(`/api/v1/sessions/${sessionId}/vocabulary`, {
      method: "POST",
      body: JSON.stringify({
        term: item.term,
        context_sentence: item.contextSentence,
        definition: item.definition,
        difficulty: item.difficulty,
      }),
    })
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    const savedItem = normalizeVocabularyItem(await response.json())
    state.vocabularyBySessionId.set(
      sessionId,
      items.map((candidate) => (candidate.term === term ? savedItem : candidate)),
    )
  } catch (error) {
    state.vocabularyState = "error"
    state.vocabularyError = error instanceof Error ? error.message : "Could not save this word."
  }

  renderVocabularyView()
}

const loadVocabQuiz = async (sessionId) => {
  state.vocabQuizState = "loading"
  state.vocabQuizError = ""
  state.vocabQuizAnswersBySessionId.set(sessionId, {})
  state.vocabQuizBySessionId.delete(sessionId)
  renderVocabularyView()

  try {
    const response = await apiFetch(`/api/v1/sessions/${sessionId}/vocabulary/quiz`)
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    const payload = await response.json()
    const questions = Array.isArray(payload.questions)
      ? payload.questions.map(normalizeVocabQuizQuestion)
      : []
    state.vocabQuizBySessionId.set(sessionId, questions)
    state.vocabQuizState = "ready"
  } catch (error) {
    state.vocabQuizState = "error"
    state.vocabQuizError = error instanceof Error ? error.message : "Could not build mini quiz."
  }

  renderVocabularyView()
}

const persistSetting = (setting, value) => {
  if (setting === "defaultDifficulty") {
    state.settings.defaultDifficulty = value
    window.localStorage.setItem("dashboard_default_difficulty", value)
  }
  if (setting === "defaultQuestionType") {
    state.settings.defaultQuestionType = value
    window.localStorage.setItem("dashboard_default_question_type", value)
  }
}

const bindEvents = () => {
  elements.signOutButton.addEventListener("click", () => {
    clearAccessToken()
    redirectToLogin()
  })

  elements.nav.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof Element)) {
      return
    }
    const item = target.closest("[data-view]")
    if (!item) {
      return
    }
    setActiveView(item.dataset.view)
  })

  elements.main.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof Element)) {
      return
    }

    const viewLink = target.closest("[data-view-link]")
    if (viewLink) {
      event.preventDefault()
      setActiveView(viewLink.dataset.viewLink)
      return
    }

    const openSession = target.closest("[data-open-session]")
    if (openSession) {
      event.preventDefault()
      setActiveView("sessions")
      void selectSession(Number(openSession.dataset.openSession), {
        tab: "quiz",
        replaceHistory: true,
      })
      return
    }

    const openVocabulary = target.closest("[data-open-vocabulary]")
    if (openVocabulary) {
      event.preventDefault()
      setActiveView("vocabulary")
      void selectSession(Number(openVocabulary.dataset.openVocabulary), {
        replaceHistory: true,
      })
      return
    }
  })

  for (const panel of Object.values(elements.panels)) {
    panel.addEventListener("input", (event) => {
      const target = event.target
      if (target instanceof HTMLInputElement && target.id === "dashboard-session-search") {
        state.sessionSearch = target.value
        renderActiveView()
      }
      if (target instanceof HTMLInputElement && target.id === "dashboard-session-date") {
        state.sessionDateFilter = target.value
        renderActiveView()
      }
      if (target instanceof HTMLInputElement && target.id === "vocab-word-search") {
        state.wordSearchTerm = target.value
        renderVocabularyView()
      }
    })

    panel.addEventListener("change", (event) => {
      const target = event.target
      if (target instanceof HTMLSelectElement && target.id === "dashboard-session-filter") {
        state.sessionStatusFilter = target.value
        renderActiveView()
        return
      }
      if (target instanceof HTMLSelectElement && target.dataset.settingSelect) {
        persistSetting(target.dataset.settingSelect, target.value)
        renderActiveView()
        return
      }
      if (target instanceof HTMLSelectElement && target.id === "vocab-difficulty-filter") {
        state.difficultyFilter = target.value
        renderVocabularyView()
        return
      }
      if (target instanceof HTMLInputElement && target.id === "vocab-saved-only") {
        state.savedOnly = target.checked
        renderVocabularyView()
        return
      }
      if (target instanceof HTMLInputElement && target.dataset.questionId) {
        state.quizNotice = ""
        state.quizNoticeTone = "error"
        state.selectedAnswersByQuestionId = {
          ...state.selectedAnswersByQuestionId,
          [Number(target.dataset.questionId)]: target.value,
        }
        renderSessionsView()
        return
      }
      if (target instanceof HTMLInputElement && target.dataset.vocabQuestionIndex) {
        if (!state.selectedSessionId) {
          return
        }
        const answers = state.vocabQuizAnswersBySessionId.get(state.selectedSessionId) ?? {}
        state.vocabQuizAnswersBySessionId.set(state.selectedSessionId, {
          ...answers,
          [Number(target.dataset.vocabQuestionIndex)]: target.value,
        })
        renderVocabularyView()
      }
    })

    panel.addEventListener("click", (event) => {
      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const sessionButton = target.closest("[data-select-session]")
      if (sessionButton) {
        event.preventDefault()
        void selectSession(Number(sessionButton.dataset.selectSession), {
          replaceHistory: true,
        })
        return
      }

      const studyTab = target.closest("[data-study-tab]")
      if (studyTab) {
        event.preventDefault()
        state.activeStudyTab = studyTab.dataset.studyTab
        if (state.activeStudyTab === "attempts" && state.selectedSessionId) {
          void loadAttemptHistoryForSession(state.selectedSessionId)
        }
        renderSessionsView()
        return
      }

      if (target.closest("[data-generate-selected-quiz]")) {
        event.preventDefault()
        void generateQuizForSelectedSession()
        return
      }

      if (target.closest("[data-submit-quiz]")) {
        event.preventDefault()
        void submitCurrentQuizAttempt()
        return
      }

      if (target.closest("[data-retake-quiz]")) {
        event.preventDefault()
        if (state.currentQuizId) {
          state.submittedAttemptByQuizId.delete(state.currentQuizId)
        }
        state.selectedAnswersByQuestionId = {}
        state.quizNotice = ""
        renderSessionsView()
        return
      }

      const attemptButton = target.closest("[data-attempt-id]")
      if (attemptButton && state.selectedSessionId) {
        event.preventDefault()
        state.activeAttemptIdBySessionId.set(
          state.selectedSessionId,
          Number(attemptButton.dataset.attemptId),
        )
        renderSessionsView()
        return
      }

      const loadHistoryButton = target.closest("[data-load-quiz-history]")
      if (loadHistoryButton) {
        event.preventDefault()
        void loadQuizHistory()
        return
      }

      const globalAttemptButton = target.closest("[data-global-attempt-id]")
      if (globalAttemptButton) {
        event.preventDefault()
        state.activeGlobalAttemptId = Number(globalAttemptButton.dataset.globalAttemptId)
        renderQuizHistoryView()
        return
      }

      const refreshVocabularyButton = target.closest("[data-refresh-vocabulary]")
      if (refreshVocabularyButton && state.selectedSessionId) {
        event.preventDefault()
        void loadVocabulary(state.selectedSessionId, { force: true })
        return
      }

      if (target.closest("[data-toggle-vocab-source]")) {
        event.preventDefault()
        state.isVocabularySourceCollapsed = !state.isVocabularySourceCollapsed
        renderVocabularyView()
        return
      }

      if (target.closest("[data-toggle-vocab-mask]") && state.selectedSessionId) {
        event.preventDefault()
        if (state.maskedVocabularySessionIds.has(state.selectedSessionId)) {
          state.maskedVocabularySessionIds.delete(state.selectedSessionId)
        } else {
          state.maskedVocabularySessionIds.add(state.selectedSessionId)
        }
        renderVocabularyView()
        return
      }

      const saveButton = target.closest("[data-save-term]")
      if (saveButton) {
        event.preventDefault()
        void saveVocabularyItem(decodeURIComponent(saveButton.dataset.saveTerm ?? ""))
        return
      }

      const startVocabQuizButton = target.closest("[data-start-vocab-quiz]")
      if (startVocabQuizButton && state.selectedSessionId) {
        event.preventDefault()
        state.maskedVocabularySessionIds.add(state.selectedSessionId)
        void loadVocabQuiz(state.selectedSessionId)
      }
    })

    panel.addEventListener(
      "scroll",
      (event) => {
        const target = event.target
        if (!(target instanceof Element) || !target.classList.contains("study-content")) {
          return
        }

        const board = target.closest(".study-board")
        if (!board) {
          return
        }
        board.classList.toggle("is-scrolled", target.scrollTop > 12)
      },
      true,
    )
  }
}

const init = async () => {
  if (!getAccessToken()) {
    redirectToLogin()
    return
  }

  const params = new URLSearchParams(window.location.search)
  const requestedView = params.get("view")
  state.activeView = VIEW_TITLES[requestedView] ? requestedView : "dashboard"
  const requestedSessionId = Number(params.get("session_id"))
  if (!Number.isNaN(requestedSessionId) && requestedSessionId > 0) {
    state.selectedSessionId = requestedSessionId
  }

  bindEvents()
  setActiveView(state.activeView, { replaceHistory: true })
  await Promise.all([loadProfile(), loadSessions()])

  if (state.activeView === "vocabulary" && state.selectedSessionId) {
    await loadVocabulary(state.selectedSessionId)
  }
  if (state.activeView === "quiz-history") {
    await loadQuizHistory()
  }
  renderAll()
}

void init()
