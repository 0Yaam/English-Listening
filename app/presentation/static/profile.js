import {
  apiFetch,
  clearAccessToken,
  extractErrorMessage,
  getAccessToken,
  redirectToLogin,
} from "./auth.js"

const state = {
  profile: null,
  sessions: [],
  profileLoadState: "loading",
  sessionsLoadState: "loading",
  profileError: "",
  sessionsError: "",
  searchTerm: "",
  filterValue: "All",
  activeDashboardTab: "workspace",
  selectedSessionId: null,
  previewState: "empty",
  previewError: "",
  quizState: "empty",
  quizError: "",
  quizNotice: "",
  quizNoticeTone: "error",
  quizDifficulty: "medium",
  quizQuestionType: "mixed",
  activePreviewTab: "transcript",
  isQuizPracticeActive: false,
  activeHistoryAttemptId: null,
  isSubmittingAttempt: false,
  quizSessionId: null,
  currentQuizId: null,
  currentQuizQuestions: [],
  selectedAnswersByQuestionId: {},
  activeSelectionRequestId: 0,
  generatingSessionIds: new Set(),
  sessionDetailsById: new Map(),
  quizzesBySessionId: new Map(),
  attemptResultsByQuizId: new Map(),
  attemptHistoryBySessionId: new Map(),
  loadingAttemptHistorySessionIds: new Set(),
  attemptHistoryErrorsBySessionId: new Map(),
}

const elements = {
  avatar: document.getElementById("profile-avatar"),
  name: document.getElementById("profile-name"),
  email: document.getElementById("profile-email"),
  joined: document.getElementById("profile-joined"),
  loginLink: document.getElementById("profile-login-link"),
  signOutButton: document.getElementById("sign-out-button"),
  metricTotalSessions: document.getElementById("metric-total-sessions"),
  metricSavedTranscripts: document.getElementById("metric-saved-transcripts"),
  metricAverageAccuracy: document.getElementById("metric-average-accuracy"),
  metricTotalQuizzes: document.getElementById("metric-total-quizzes"),
  metricAverageQuizScore: document.getElementById("metric-average-quiz-score"),
  rows: document.getElementById("transcript-rows"),
  summary: document.getElementById("transcript-summary"),
  searchInput: document.getElementById("transcript-search"),
  filterSelect: document.getElementById("transcript-filter"),
  transcriptLayout: document.getElementById("transcript-layout"),
  analyticsPanel: document.getElementById("learning-analytics-panel"),
  dashboardTabs: document.querySelector(".dashboard-tabs"),
  previewPanel: document.getElementById("preview-panel-content"),
  quizPanel: document.getElementById("quiz-panel-content"),
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

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--"
  }

  return `${Math.round(Number(value) * 10) / 10}%`
}

const escapeHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const formatShortDateLabel = (isoDate) => {
  if (!isoDate) {
    return "--"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${isoDate}T00:00:00`))
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

const normalizeSessionSummary = (payload) => {
  return {
    sessionId: payload.session_id,
    videoId: payload.video_id,
    videoTitle: payload.video_title ?? "Untitled video",
    completedAt: payload.completed_at,
    accuracyScore: payload.accuracy_score,
    wordCount: payload.word_count ?? 0,
    rawText: null,
    quizStatus: payload.quiz_status ?? "Completed",
  }
}

const normalizeSessionDetail = (payload) => {
  return {
    sessionId: payload.session_id,
    videoId: payload.video_id,
    videoTitle: payload.video_title ?? "Untitled video",
    sourceUrl: payload.source_url ?? null,
    completedAt: payload.completed_at,
    accuracyScore: payload.accuracy_score,
    wordCount: payload.transcript?.word_count ?? 0,
    rawText: payload.transcript?.raw_text ?? "",
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
    questions: payload.questions.map((question) => ({
      id: question.id,
      question: question.question,
      options: {
        A: question.options.A,
        B: question.options.B,
        C: question.options.C,
        D: question.options.D,
      },
      correct_answer: question.correct_answer,
      explanation: question.explanation,
    })),
  }
}

const getSelectedSession = () => {
  return state.sessions.find((session) => session.sessionId === state.selectedSessionId) ?? null
}

const updateSession = (nextSession) => {
  const existingIndex = state.sessions.findIndex((item) => item.sessionId === nextSession.sessionId)
  if (existingIndex === -1) {
    state.sessions = [nextSession, ...state.sessions]
    return
  }

  state.sessions[existingIndex] = {
    ...state.sessions[existingIndex],
    ...nextSession,
  }
}

const syncSessionQuizStatus = (sessionId, quizStatus) => {
  updateSession({
    sessionId,
    quizStatus,
  })

  const cachedDetail = state.sessionDetailsById.get(sessionId)
  if (!cachedDetail) {
    return
  }

  state.sessionDetailsById.set(sessionId, {
    ...cachedDetail,
    quizStatus,
  })
}

const getStatusClassName = (quizStatus) => {
  if (quizStatus === "Quiz Ready") {
    return "status-ready"
  }

  if (quizStatus === "Quiz Generated") {
    return "status-generated"
  }

  return ""
}

const getFilteredSessions = () => {
  const query = state.searchTerm.trim().toLowerCase()

  return state.sessions.filter((session) => {
    const matchesFilter = state.filterValue === "All" || session.quizStatus === state.filterValue
    const searchHaystack = `${session.videoTitle} ${session.videoId}`.toLowerCase()
    const matchesSearch = query.length === 0 || searchHaystack.includes(query)
    return matchesFilter && matchesSearch
  })
}

const clearCurrentQuizState = () => {
  state.quizState = "empty"
  state.quizError = ""
  state.quizNotice = ""
  state.quizNoticeTone = "error"
  state.quizSessionId = null
  state.currentQuizId = null
  state.currentQuizQuestions = []
  state.selectedAnswersByQuestionId = {}
  state.isQuizPracticeActive = false
  state.activeHistoryAttemptId = null
  state.isSubmittingAttempt = false
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

const scrollPreviewQuizIntoView = () => {
  window.requestAnimationFrame(() => {
    const quizElement = elements.previewPanel.querySelector(".preview-generated-quiz")
    if (!quizElement) {
      return
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    quizElement.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    })
  })
}

const restoreCachedQuizForSession = (sessionId) => {
  const cachedQuiz = state.quizzesBySessionId.get(sessionId)
  if (!cachedQuiz) {
    return
  }

  const needsRestore =
    state.quizSessionId !== sessionId ||
    state.currentQuizId !== cachedQuiz.quizId ||
    state.currentQuizQuestions.length === 0 ||
    state.quizState !== "generated"

  if (needsRestore) {
    applyQuizToState(cachedQuiz)
  }
}

const isGeneratingQuizForSession = (sessionId) => {
  return state.generatingSessionIds.has(sessionId)
}

const getCurrentSubmittedAttempt = () => {
  return state.currentQuizId ? state.attemptResultsByQuizId.get(state.currentQuizId) ?? null : null
}

const getCurrentAttemptHistory = () => {
  return state.selectedSessionId
    ? state.attemptHistoryBySessionId.get(state.selectedSessionId) ?? []
    : []
}

const isLoadingCurrentAttemptHistory = () => {
  return state.selectedSessionId
    ? state.loadingAttemptHistorySessionIds.has(state.selectedSessionId)
    : false
}

const getCurrentAttemptHistoryError = () => {
  return state.selectedSessionId
    ? state.attemptHistoryErrorsBySessionId.get(state.selectedSessionId) ?? ""
    : ""
}

const getWrongAnswerCount = (attempt) => {
  return Math.max(0, Number(attempt.total_questions ?? 0) - Number(attempt.correct_count ?? 0))
}

const syncActiveHistoryAttempt = (history) => {
  if (history.length === 0) {
    state.activeHistoryAttemptId = null
    return
  }

  if (!history.some((attempt) => attempt.attempt_id === state.activeHistoryAttemptId)) {
    state.activeHistoryAttemptId = history[0].attempt_id
  }
}

const startNewQuizAttempt = () => {
  if (state.currentQuizId) {
    state.attemptResultsByQuizId.delete(state.currentQuizId)
  }
  state.isQuizPracticeActive = true
  state.activePreviewTab = "transcript"
  state.selectedAnswersByQuestionId = {}
  state.quizNotice = ""
  state.quizNoticeTone = "error"
  state.isSubmittingAttempt = false
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

const buildQuizAttemptHistoryMarkup = ({ activeAttemptId: fallbackActiveAttemptId } = {}) => {
  const history = getCurrentAttemptHistory()
  const historyError = getCurrentAttemptHistoryError()

  if (isLoadingCurrentAttemptHistory()) {
    return `
      <section class="quiz-history" aria-label="Quiz attempt history">
        <div class="quiz-history-header">
          <h3>Attempt History</h3>
          <span class="question-note">Loading attempts...</span>
        </div>
      </section>
    `
  }

  if (historyError) {
    return `
      <section class="quiz-history" aria-label="Quiz attempt history">
        <div class="quiz-history-header">
          <h3>Attempt History</h3>
          <span class="question-note quiz-notice">${historyError}</span>
        </div>
      </section>
    `
  }

  if (history.length === 0) {
    return `
      <section class="quiz-history" aria-label="Quiz attempt history">
        <div class="quiz-history-header">
          <h3>Attempt History</h3>
          <span class="question-note">No attempts yet.</span>
        </div>
      </section>
    `
  }

  const resolvedActiveAttemptId = state.activeHistoryAttemptId ?? fallbackActiveAttemptId
  return `
    <section class="quiz-history" aria-label="Quiz attempt history">
      <div class="quiz-history-header">
        <h3>Attempt History</h3>
        <span class="question-note">${history.length} saved attempt${history.length === 1 ? "" : "s"}</span>
      </div>
      <div class="quiz-history-list">
        ${history
          .map((attempt, index) => {
            const wrongCount = getWrongAnswerCount(attempt)
            const isActive = attempt.attempt_id === resolvedActiveAttemptId
            const wrongResults = attempt.results.filter((result) => !result.is_correct)
            return `
              <button
                type="button"
                class="quiz-history-item ${isActive ? "is-active" : ""}"
                data-preview-attempt-id="${attempt.attempt_id}"
              >
                <span class="quiz-history-main">
                  <strong>Attempt ${history.length - index}</strong>
                  <span>${formatDateTime(attempt.submitted_at)}</span>
                </span>
                <span class="quiz-history-score">
                  <span class="score-badge">${formatPercent(attempt.score)}</span>
                  <span>${attempt.correct_count}/${attempt.total_questions} correct</span>
                  <span>${wrongCount} wrong</span>
                </span>
              </button>
              ${
                isActive
                  ? `
                    <div class="quiz-history-review">
                      ${
                        wrongResults.length === 0
                          ? `<p class="question-note quiz-save-note">All answers were correct.</p>`
                          : wrongResults
                              .map((result, resultIndex) => {
                                return `
                                  <article class="quiz-history-review-item">
                                    <span class="quiz-question-index">Review ${resultIndex + 1}</span>
                                    <h4>${result.question}</h4>
                                    <p>
                                      Your answer <strong>${result.selected_answer ?? "--"}</strong>,
                                      correct answer <strong>${result.correct_answer}</strong>.
                                    </p>
                                    <p>${result.explanation}</p>
                                  </article>
                                `
                              })
                              .join("")
                      }
                    </div>
                  `
                  : ""
              }
            `
          })
          .join("")}
      </div>
    </section>
  `
}

const buildAnalyticsBarsMarkup = ({ items, valueKey, labelKey, type, maxValue = 100 }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p class="state-copy">Not enough data yet.</p>`
  }

  const resolvedMaxValue = Math.max(
    maxValue,
    ...items.map((item) => Number(item[valueKey] ?? 0)),
  )
  return `
    <div class="analytics-bars">
      ${items
        .map((item) => {
          const rawValue = Number(item[valueKey] ?? 0)
          const height = Math.max(6, Math.round((rawValue / resolvedMaxValue) * 100))
          const label = labelKey === "week_start"
            ? formatShortDateLabel(item[labelKey])
            : formatShortDateLabel(item[labelKey])
          return `
            <div class="analytics-bar ${type ? `is-${type}` : ""}" title="${escapeHtml(`${label}: ${rawValue}`)}">
              <span class="analytics-bar-fill" style="height: ${height}%"></span>
              <span class="analytics-bar-label">${escapeHtml(label)}</span>
            </div>
          `
        })
        .join("")}
    </div>
  `
}

const buildLearningAnalyticsMarkup = () => {
  if (state.profileLoadState === "loading") {
    return `
      <div class="state-block">
        <p class="state-copy">Loading learning analytics.</p>
      </div>
    `
  }

  if (state.profileLoadState === "error" || !state.profile?.analytics) {
    return `
      <div class="state-block state-error">
        <p class="state-copy">${state.profileError || "Could not load learning analytics."}</p>
      </div>
    `
  }

  const analytics = state.profile.analytics
  const weakestSkill = analytics.weakest_skill ?? {
    label: "Not enough quiz data",
    missed_count: 0,
    summary: "Submit a few quizzes to identify the weakest listening skill.",
  }

  return `
    <div class="panel-heading">
      <div>
        <h2 id="learning-analytics-title">Learning Analytics</h2>
        <p class="panel-subtext">Track accuracy, quiz score, weekly consistency, and the skill that needs more review.</p>
      </div>
    </div>
    <div class="analytics-grid">
      <article class="analytics-card">
        <div class="analytics-card-header">
          <h3>Accuracy by Day</h3>
          <p class="analytics-card-note">Listening sessions</p>
        </div>
        ${buildAnalyticsBarsMarkup({
          items: analytics.accuracy_by_day,
          valueKey: "average_accuracy",
          labelKey: "date",
          type: "accuracy",
          maxValue: 100,
        })}
      </article>
      <article class="analytics-card">
        <div class="analytics-card-header">
          <h3>Quiz Score by Day</h3>
          <p class="analytics-card-note">Saved attempts</p>
        </div>
        ${buildAnalyticsBarsMarkup({
          items: analytics.quiz_score_by_day,
          valueKey: "average_score",
          labelKey: "date",
          type: "quiz",
          maxValue: 100,
        })}
      </article>
      <article class="analytics-card">
        <div class="analytics-card-header">
          <h3>Sessions Each Week</h3>
          <p class="analytics-card-note">Consistency</p>
        </div>
        ${buildAnalyticsBarsMarkup({
          items: analytics.sessions_by_week,
          valueKey: "session_count",
          labelKey: "week_start",
          type: "week",
          maxValue: 1,
        })}
      </article>
      <article class="analytics-card">
        <div class="analytics-card-header">
          <h3>Weakest Skill</h3>
          <p class="analytics-card-note">From wrong quiz answers</p>
        </div>
        <div class="weak-skill-card">
          <div>
            <span class="quiz-empty-kicker">Focus area</span>
            <h3>${escapeHtml(weakestSkill.label)}</h3>
            <p>${escapeHtml(weakestSkill.summary)}</p>
          </div>
          <div class="weak-skill-count" aria-label="${escapeHtml(`${weakestSkill.missed_count} missed answers`)}">
            ${escapeHtml(weakestSkill.missed_count)}
          </div>
        </div>
      </article>
    </div>
  `
}

const renderLearningAnalytics = () => {
  elements.analyticsPanel.innerHTML = buildLearningAnalyticsMarkup()
}

const renderDashboardView = () => {
  const isAnalyticsActive = state.activeDashboardTab === "analytics"
  elements.transcriptLayout.hidden = isAnalyticsActive
  elements.analyticsPanel.hidden = !isAnalyticsActive
  for (const tab of elements.dashboardTabs.querySelectorAll("[data-dashboard-tab]")) {
    const isActive = tab.dataset.dashboardTab === state.activeDashboardTab
    tab.classList.toggle("is-active", isActive)
    tab.setAttribute("aria-selected", String(isActive))
  }
}

const refreshProfileStatsInBackground = async () => {
  try {
    await loadProfileData({ silent: true })
  } catch {
    return
  }
}

const renderProfile = () => {
  if (state.profileLoadState === "loading") {
    elements.name.textContent = "Loading user"
    elements.email.textContent = "Loading email"
    elements.joined.textContent = "Loading join date"
    elements.avatar.textContent = "--"
    return
  }

  if (state.profileLoadState === "error" || !state.profile) {
    elements.name.textContent = "Profile unavailable"
    elements.email.textContent = state.profileError || "Could not load user information."
    elements.joined.textContent = "Sign in again or refresh the page."
    elements.avatar.textContent = "--"
    return
  }

  const { user, stats } = state.profile
  elements.avatar.textContent = buildAvatarInitials(user.username)
  elements.name.textContent = user.username
  elements.email.textContent = user.email
  elements.joined.textContent = `Joined on ${formatDate(user.created_at)}`
  elements.metricTotalSessions.textContent = String(stats.total_sessions)
  elements.metricSavedTranscripts.textContent = String(stats.saved_transcripts)
  elements.metricAverageAccuracy.textContent = formatPercent(stats.average_accuracy)
  elements.metricTotalQuizzes.textContent = String(stats.total_quizzes)
  elements.metricAverageQuizScore.textContent = formatPercent(stats.average_quiz_score)
  renderLearningAnalytics()
}

const renderRows = () => {
  elements.rows.innerHTML = ""

  if (state.sessionsLoadState === "loading") {
    elements.summary.textContent = "Dang tai du lieu transcript history."
    elements.rows.innerHTML = `
      <div class="state-block">
        <p class="state-copy">Loading transcript history from your account.</p>
      </div>
    `
    return
  }

  if (state.sessionsLoadState === "error") {
    elements.summary.textContent = "Khong the tai transcript history."
    elements.rows.innerHTML = `
      <div class="state-block state-error">
        <p class="state-copy">${state.sessionsError}</p>
      </div>
    `
    return
  }

  const sessions = getFilteredSessions()
  if (state.sessions.length === 0) {
    elements.summary.textContent = "Chua co phien hoc nao duoc luu."
    elements.rows.innerHTML = `
      <div class="state-block state-empty">
        <p class="state-copy">You have not saved any completed shadowing session yet.</p>
      </div>
    `
    return
  }

  elements.summary.textContent =
    sessions.length === 0
      ? "Khong co transcript nao khop bo loc hien tai."
      : `${sessions.length} sessions dang duoc hien thi trong transcript history.`

  if (sessions.length === 0) {
    elements.rows.innerHTML = `
      <div class="state-block">
        <p class="state-copy">Khong tim thay transcript phu hop. Thu thay doi search hoac filter.</p>
      </div>
    `
    return
  }

  for (const session of sessions) {
    const row = document.createElement("article")
    const isSelected = session.sessionId === state.selectedSessionId
    const isGenerating = isGeneratingQuizForSession(session.sessionId)
    row.className = "transcript-row"
    row.tabIndex = 0
    row.setAttribute("role", "button")
    row.setAttribute("aria-pressed", String(isSelected))
    row.setAttribute(
      "aria-label",
      `View transcript for ${session.videoTitle}. Status ${session.quizStatus}.`,
    )

    if (isSelected) {
      row.classList.add("is-selected")
    }

    row.innerHTML = `
      <div class="transcript-thumb" aria-hidden="true"></div>
      <div class="transcript-meta">
        <h3 class="transcript-title">${session.videoTitle}</h3>
        <span class="transcript-source">YouTube / ${session.videoId}</span>
      </div>
      <div class="transcript-cell">${formatDate(session.completedAt)}</div>
      <div class="transcript-cell">${session.wordCount}</div>
      <div><span class="score-badge">${formatPercent(session.accuracyScore)}</span></div>
      <div><span class="status-badge ${getStatusClassName(session.quizStatus)}">${session.quizStatus}</span></div>
      <div class="transcript-actions">
        <button type="button" class="button-text" data-action="view">View Transcript</button>
        <button type="button" class="button-ghost" data-action="generate" ${
          isGenerating ? "disabled" : ""
        }>${isGenerating ? "Generating..." : "Generate Quiz"}</button>
      </div>
    `

    row.addEventListener("click", () => {
      void handleSelectSession(session.sessionId)
    })
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        void handleSelectSession(session.sessionId)
      }
    })
    row.querySelector('[data-action="view"]').addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      void handleSelectSession(session.sessionId)
    })
    row.querySelector('[data-action="generate"]').addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (isGeneratingQuizForSession(session.sessionId)) {
        return
      }
      void handleSelectSession(session.sessionId, { generateAfterSelect: true })
    })

    elements.rows.append(row)
  }
}

const renderPreviewPanel = () => {
  const selectedSession = getSelectedSession()
  const isGeneratingSelectedQuiz = selectedSession
    ? isGeneratingQuizForSession(selectedSession.sessionId)
    : false
  const shouldShowPreviewQuiz =
    selectedSession &&
    state.isQuizPracticeActive &&
    state.quizSessionId === selectedSession.sessionId &&
    state.quizState === "generated" &&
    state.currentQuizQuestions.length > 0
  const submittedPreviewAttempt = state.currentQuizId
    ? state.attemptResultsByQuizId.get(state.currentQuizId) ?? null
    : null
  const previewAttemptHistoryMarkup = selectedSession
    ? buildQuizAttemptHistoryMarkup({ activeAttemptId: submittedPreviewAttempt?.attempt_id })
    : ""
  const submittedPreviewResults = new Map(
    (submittedPreviewAttempt?.results ?? []).map((item) => [item.question_id, item]),
  )
  const previewQuizMarkup = shouldShowPreviewQuiz
    ? `
      <div class="preview-generated-quiz">
        <div class="quiz-list">
          ${state.currentQuizQuestions
            .map((question, index) => {
              const optionMarkup = Object.entries(question.options)
                .map(([label, value]) => {
                  const isChecked = state.selectedAnswersByQuestionId[question.id] === label
                  const result = submittedPreviewResults.get(question.id)
                  const resultClass = result
                    ? label === result.correct_answer
                      ? "is-correct-option"
                      : isChecked
                        ? "is-incorrect-option"
                        : ""
                    : ""
                  return `
                    <label class="quiz-option quiz-option-choice ${
                      isChecked ? "is-selected" : ""
                    } ${resultClass}">
                      <input
                        type="radio"
                        name="preview-quiz-question-${question.id}"
                        value="${label}"
                        data-preview-question-id="${question.id}"
                        ${isChecked ? "checked" : ""}
                        ${submittedPreviewAttempt || state.isSubmittingAttempt ? "disabled" : ""}
                      />
                      <span class="option-label">${label}</span>
                      <span class="option-copy">${value}</span>
                    </label>
                  `
                })
                .join("")

              const result = submittedPreviewResults.get(question.id)
              const resultMarkup = result
                ? `
                  <div class="answer-line">
                    <span class="answer-line-header">Your Answer</span>
                    <span class="answer-badge">${result.selected_answer ?? "--"}</span>
                    <span class="answer-line-header">Correct Answer</span>
                    <span class="answer-badge">${result.correct_answer}</span>
                    <span class="result-badge ${result.is_correct ? "is-correct" : "is-incorrect"}">
                      ${result.is_correct ? "Correct" : "Review"}
                    </span>
                  </div>
                  <div class="explanation-line">
                    <strong>Explanation</strong>
                    <p class="explanation-copy">${result.explanation}</p>
                  </div>
                `
                : ""

              return `
                <article class="quiz-question">
                  <span class="quiz-question-index">Question ${index + 1}</span>
                  <h3>${question.question}</h3>
                  <div class="quiz-options">${optionMarkup}</div>
                  ${resultMarkup}
                </article>
              `
            })
            .join("")}
        </div>
        ${
          submittedPreviewAttempt
            ? `
              <div class="quiz-result-summary">
                <span class="score-badge">${formatPercent(submittedPreviewAttempt.score)}</span>
                <p class="question-note">
                  ${submittedPreviewAttempt.correct_count}/${submittedPreviewAttempt.total_questions} answers correct.
                </p>
              </div>
            `
            : `
              <p class="question-note">
                ${getAnsweredQuestionCount()}/${state.currentQuizQuestions.length} answers selected.
              </p>
            `
        }
        ${
          state.quizNotice
            ? `<p class="${getQuizNoticeClassName()}" role="status">${state.quizNotice}</p>`
            : ""
        }
        <div class="quiz-footer-actions">
          <button type="button" class="button-ghost" data-preview-quiz-action="regenerate">
            Regenerate Quiz
          </button>
          ${
            submittedPreviewAttempt
              ? `
                <button type="button" class="button-ghost" data-preview-quiz-action="retake">
                  Retake Quiz
                </button>
              `
              : ""
          }
          <button
            type="button"
            class="button-primary"
            data-preview-quiz-action="submit"
            ${
              state.isSubmittingAttempt || submittedPreviewAttempt || !hasAnsweredEveryQuestion()
                ? "disabled"
                : ""
            }
          >
            ${state.isSubmittingAttempt ? "Submitting..." : submittedPreviewAttempt ? "Submitted" : "Submit Quiz"}
          </button>
        </div>
      </div>
    `
    : ""

  if (state.sessionsLoadState === "loading") {
    elements.previewPanel.innerHTML = `
      <div class="state-block">
        <p class="state-copy">Loading transcript workspace.</p>
      </div>
    `
    return
  }

  if (state.sessions.length === 0) {
    elements.previewPanel.innerHTML = `
      <div class="state-block state-empty">
        <p class="state-copy">Complete a shadowing lesson first to build your transcript history.</p>
      </div>
    `
    return
  }

  if (!selectedSession) {
    elements.previewPanel.innerHTML = `
      <div class="quiz-empty-state">
        <span class="quiz-empty-kicker">Reading workspace</span>
        <h3>Select a transcript</h3>
        <p>Choose a lesson from Transcript History to preview the transcript, generate a focused quiz, and review saved attempts.</p>
        <div class="quiz-empty-steps">
          <span>1. Pick a lesson</span>
          <span>2. Review transcript</span>
          <span>3. Generate or inspect attempts</span>
        </div>
      </div>
    `
    return
  }

  if (state.previewState === "loading") {
    elements.previewPanel.innerHTML = `
      <div class="state-block">
        <p class="state-copy">Loading transcript preview for the selected session.</p>
      </div>
    `
    return
  }

  if (state.previewState === "error") {
    elements.previewPanel.innerHTML = `
      <div class="state-block state-error">
        <p class="state-copy">${state.previewError}</p>
        <div class="state-actions">
          <button id="retry-preview-button" type="button" class="button-ghost">Retry</button>
        </div>
      </div>
    `
    const retryButton = document.getElementById("retry-preview-button")
    if (retryButton) {
      retryButton.addEventListener("click", () => {
        void loadSelectedSessionDetail(selectedSession.sessionId, { force: true })
      })
    }
    return
  }

  elements.previewPanel.innerHTML = `
    <div class="preview-state">
      <div class="preview-tabs" role="tablist" aria-label="Selected lesson panel">
        <button
          type="button"
          class="preview-tab ${state.activePreviewTab === "transcript" ? "is-active" : ""}"
          data-preview-tab="transcript"
          role="tab"
          aria-selected="${state.activePreviewTab === "transcript"}"
        >
          Transcript Preview
        </button>
        <button
          type="button"
          class="preview-tab ${state.activePreviewTab === "history" ? "is-active" : ""}"
          data-preview-tab="history"
          role="tab"
          aria-selected="${state.activePreviewTab === "history"}"
        >
          Attempt History
        </button>
      </div>
      ${
        state.activePreviewTab === "history"
          ? `
            ${state.quizNotice ? `<p class="${getQuizNoticeClassName()}" role="status">${state.quizNotice}</p>` : ""}
            ${previewAttemptHistoryMarkup}
          `
          : `
            <div class="preview-header">
              <div>
                <h3 class="preview-video-title">${selectedSession.videoTitle}</h3>
              </div>
              <span class="score-badge">${formatPercent(selectedSession.accuracyScore)} accuracy</span>
            </div>
            <div class="preview-meta">
              <span>YouTube / ${selectedSession.videoId}</span>
              <span>${formatDate(selectedSession.completedAt)}</span>
              <span>Session ${selectedSession.sessionId}</span>
            </div>
            <div class="preview-transcript">
              <p>${selectedSession.rawText || "Transcript detail is not available yet."}</p>
            </div>
            <div class="preview-actions">
              <div class="quiz-generation-controls" aria-label="Quiz generation settings">
                <label class="quiz-control-field" for="generate-quiz-difficulty">
                  <span>Difficulty</span>
                  <select
                    id="generate-quiz-difficulty"
                    class="control-select"
                    ${isGeneratingSelectedQuiz ? "disabled" : ""}
                  >
                    <option value="easy" ${state.quizDifficulty === "easy" ? "selected" : ""}>Easy</option>
                    <option value="medium" ${state.quizDifficulty === "medium" ? "selected" : ""}>Medium</option>
                    <option value="hard" ${state.quizDifficulty === "hard" ? "selected" : ""}>Hard</option>
                  </select>
                </label>
                <label class="quiz-control-field" for="generate-quiz-question-type">
                  <span>Question Type</span>
                  <select
                    id="generate-quiz-question-type"
                    class="control-select"
                    ${isGeneratingSelectedQuiz ? "disabled" : ""}
                  >
                    <option value="mixed" ${state.quizQuestionType === "mixed" ? "selected" : ""}>Mixed</option>
                    <option value="inference" ${state.quizQuestionType === "inference" ? "selected" : ""}>Inference</option>
                    <option value="vocabulary" ${state.quizQuestionType === "vocabulary" ? "selected" : ""}>Vocabulary</option>
                    <option value="main_idea" ${state.quizQuestionType === "main_idea" ? "selected" : ""}>Main idea</option>
                    <option value="detail" ${state.quizQuestionType === "detail" ? "selected" : ""}>Detail</option>
                  </select>
                </label>
              </div>
              <button
                id="generate-reading-quiz-button"
                type="button"
                class="button-primary"
                ${isGeneratingSelectedQuiz ? "disabled" : ""}
              >
                ${isGeneratingSelectedQuiz ? "Generating..." : "Generate Reading Quiz"}
              </button>
              <a
                class="button-ghost"
                href="/vocabulary?session_id=${selectedSession.sessionId}"
              >
                Open Vocabulary Lab
              </a>
            </div>
          `
      }
      ${previewQuizMarkup}
    </div>
  `

}

const renderQuizPanel = () => {
  const selectedSession = getSelectedSession()
  const isPreviewHostingQuiz =
    selectedSession &&
    state.isQuizPracticeActive &&
    state.quizSessionId === selectedSession.sessionId &&
    state.quizState === "generated" &&
    state.currentQuizQuestions.length > 0

  document.body.classList.toggle("is-preview-quiz-active", Boolean(selectedSession))

  if (selectedSession) {
    elements.quizPanel.innerHTML = ""
    return
  }

  if (state.sessionsLoadState === "loading") {
    elements.quizPanel.innerHTML = `
      <div class="state-block">
        <p class="state-copy">Preparing quiz workspace.</p>
      </div>
    `
    return
  }

  if (!selectedSession) {
    elements.quizPanel.innerHTML = `
      <div class="quiz-empty-state quiz-empty-state-secondary">
        <span class="quiz-empty-kicker">Reading Quiz</span>
        <h3>No lesson selected</h3>
        <p>Select a transcript first. This panel will organize Transcript Preview and Attempt History before you start a new quiz.</p>
        <div class="quiz-empty-steps">
          <span>Preview transcript</span>
          <span>Check attempts</span>
          <span>Generate focused questions</span>
        </div>
      </div>
    `
    return
  }

  if (isGeneratingQuizForSession(selectedSession.sessionId)) {
    elements.quizPanel.innerHTML = `
      <div class="state-block">
        <div class="loading-inline">
          <div class="loading-spinner" aria-hidden="true"></div>
          <p class="state-copy">Generating reading quiz from selected transcript.</p>
        </div>
        <div class="quiz-loading" aria-hidden="true">
          <div class="quiz-skeleton">
            <span class="quiz-skeleton-line is-title"></span>
            <span class="quiz-skeleton-line is-option"></span>
            <span class="quiz-skeleton-line is-option"></span>
            <span class="quiz-skeleton-line is-meta"></span>
          </div>
          <div class="quiz-skeleton">
            <span class="quiz-skeleton-line is-title"></span>
            <span class="quiz-skeleton-line is-option"></span>
            <span class="quiz-skeleton-line is-option"></span>
            <span class="quiz-skeleton-line is-meta"></span>
          </div>
        </div>
      </div>
    `
    return
  }

  restoreCachedQuizForSession(selectedSession.sessionId)
  const isQuizOwnedBySelectedSession = state.quizSessionId === selectedSession.sessionId

  if (!isQuizOwnedBySelectedSession && state.quizState !== "empty") {
    elements.quizPanel.innerHTML = `
      <div class="state-block state-empty">
        <p class="state-copy">Select a transcript to generate quiz.</p>
      </div>
    `
    return
  }

  if (state.quizState === "error") {
    elements.quizPanel.innerHTML = `
      <div class="state-block state-error">
        <p class="state-copy">${state.quizError}</p>
        <div class="state-actions">
          <button id="retry-quiz-button" type="button" class="button-ghost">Retry</button>
        </div>
      </div>
    `
    const retryButton = document.getElementById("retry-quiz-button")
    if (retryButton) {
      retryButton.addEventListener("click", () => {
        void generateQuizForSelectedSession()
      })
    }
    return
  }

  if (state.quizState !== "generated" || state.currentQuizQuestions.length === 0) {
    elements.quizPanel.innerHTML = `
      <div class="state-block state-empty">
        <p class="state-copy">Select a transcript to generate quiz.</p>
      </div>
    `
    return
  }

  const submittedAttempt = getCurrentSubmittedAttempt()
  const submittedResults = new Map(
    (submittedAttempt?.results ?? []).map((item) => [item.question_id, item]),
  )

  const questionMarkup = state.currentQuizQuestions
    .map((question, index) => {
      const optionMarkup = Object.entries(question.options)
        .map(([label, value]) => {
          const isChecked = state.selectedAnswersByQuestionId[question.id] === label
          const result = submittedResults.get(question.id)
          const resultClass = result
            ? label === result.correct_answer
              ? "is-correct-option"
              : isChecked
                ? "is-incorrect-option"
                : ""
            : ""
          return `
            <label class="quiz-option quiz-option-choice ${
              isChecked ? "is-selected" : ""
            } ${resultClass}">
              <input
                type="radio"
                name="quiz-question-${question.id}"
                value="${label}"
                data-question-id="${question.id}"
                ${isChecked ? "checked" : ""}
                ${submittedAttempt || state.isSubmittingAttempt ? "disabled" : ""}
              />
              <span class="option-label">${label}</span>
              <span class="option-copy">${value}</span>
            </label>
          `
        })
        .join("")

      const result = submittedResults.get(question.id)
      const resultMarkup = result
        ? `
          <div class="answer-line">
            <span class="answer-line-header">Your Answer</span>
            <span class="answer-badge">${result.selected_answer ?? "--"}</span>
            <span class="answer-line-header">Correct Answer</span>
            <span class="answer-badge">${result.correct_answer}</span>
            <span class="result-badge ${result.is_correct ? "is-correct" : "is-incorrect"}">
              ${result.is_correct ? "Correct" : "Review"}
            </span>
          </div>
          <div class="explanation-line">
            <strong>Explanation</strong>
            <p class="explanation-copy">${result.explanation}</p>
          </div>
        `
        : ""

      return `
        <article class="quiz-question">
          <span class="quiz-question-index">Question ${index + 1}</span>
          <h3>${question.question}</h3>
          <div class="quiz-options">${optionMarkup}</div>
          ${resultMarkup}
        </article>
      `
    })
    .join("")

  const scoreSummaryMarkup = submittedAttempt
    ? `
      <div class="quiz-result-summary">
        <span class="score-badge">${formatPercent(submittedAttempt.score)}</span>
        <p class="question-note">
          ${submittedAttempt.correct_count}/${submittedAttempt.total_questions} answers correct.
        </p>
      </div>
    `
    : `
      <p class="question-note">
        ${getAnsweredQuestionCount()}/${state.currentQuizQuestions.length} answers selected.
      </p>
    `

  elements.quizPanel.innerHTML = `
    ${buildQuizAttemptHistoryMarkup({ activeAttemptId: submittedAttempt?.attempt_id })}
    <div class="quiz-list">
      ${questionMarkup}
    </div>
    ${scoreSummaryMarkup}
    ${state.quizNotice ? `<p class="${getQuizNoticeClassName()}" role="status">${state.quizNotice}</p>` : ""}
    <div class="quiz-footer-actions">
      <button id="regenerate-quiz-button" type="button" class="button-ghost">Regenerate Quiz</button>
      ${
        submittedAttempt
          ? `<button id="retake-quiz-button" type="button" class="button-ghost">Retake Quiz</button>`
          : ""
      }
      <button
        id="submit-quiz-button"
        type="button"
        class="button-primary"
        ${
          state.isSubmittingAttempt || submittedAttempt || !hasAnsweredEveryQuestion()
            ? "disabled"
            : ""
        }
      >
        ${state.isSubmittingAttempt ? "Submitting..." : submittedAttempt ? "Submitted" : "Submit Quiz"}
      </button>
    </div>
  `

  for (const input of elements.quizPanel.querySelectorAll('input[type="radio"][data-question-id]')) {
    input.addEventListener("change", (event) => {
      const target = event.currentTarget
      const questionId = Number(target.dataset.questionId)
      state.quizNotice = ""
      state.quizNoticeTone = "error"
      state.selectedAnswersByQuestionId = {
        ...state.selectedAnswersByQuestionId,
        [questionId]: target.value,
      }
      renderPreviewPanel()
      renderQuizPanel()
    })
  }

  const regenerateButton = document.getElementById("regenerate-quiz-button")
  if (regenerateButton) {
    regenerateButton.addEventListener("click", (event) => {
      event.preventDefault()
      void generateQuizForSelectedSession()
    })
  }
  const submitButton = document.getElementById("submit-quiz-button")
  if (submitButton && !submittedAttempt) {
    submitButton.addEventListener("click", (event) => {
      event.preventDefault()
      void submitCurrentQuizAttempt()
    })
  }
  const retakeButton = document.getElementById("retake-quiz-button")
  if (retakeButton) {
    retakeButton.addEventListener("click", (event) => {
      event.preventDefault()
      startNewQuizAttempt()
      renderPreviewPanel()
      renderQuizPanel()
    })
  }
  for (const attemptButton of elements.quizPanel.querySelectorAll("[data-preview-attempt-id]")) {
    attemptButton.addEventListener("click", (event) => {
      event.preventDefault()
      const attemptId = Number(event.currentTarget.dataset.previewAttemptId)
      const attempt = getCurrentAttemptHistory().find((item) => item.attempt_id === attemptId)
      if (!attempt) {
        return
      }
      state.activeHistoryAttemptId = attempt.attempt_id
      state.quizNotice = ""
      renderPreviewPanel()
      renderQuizPanel()
    })
  }
}

const renderAll = () => {
  renderProfile()
  renderLearningAnalytics()
  renderDashboardView()
  renderRows()
  renderPreviewPanel()
  renderQuizPanel()
}

const loadProfileData = async ({ silent = false } = {}) => {
  if (!silent) {
    state.profileLoadState = "loading"
    state.profileError = ""
    renderProfile()
  }

  try {
    const response = await apiFetch("/api/v1/profile")
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }

    state.profile = await response.json()
    state.profileLoadState = "ready"
  } catch (error) {
    if (silent) {
      return
    }

    state.profileLoadState = "error"
    state.profileError =
      error instanceof Error ? error.message : "Could not load profile information."
  }

  renderProfile()
}

const loadSessionsData = async () => {
  state.sessionsLoadState = "loading"
  state.sessionsError = ""
  renderRows()

  try {
    const response = await apiFetch("/api/v1/sessions")
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }

    const payload = await response.json()
    state.sessions = payload.map((item) => {
      const summary = normalizeSessionSummary(item)
      const cachedDetail = state.sessionDetailsById.get(summary.sessionId)
      const cachedQuiz = state.quizzesBySessionId.get(summary.sessionId)
      return {
        ...summary,
        ...(cachedDetail ?? {}),
        quizStatus: cachedQuiz ? "Quiz Generated" : summary.quizStatus,
      }
    })
    state.sessionsLoadState = state.sessions.length > 0 ? "ready" : "empty"
  } catch (error) {
    state.sessionsLoadState = "error"
    state.sessionsError =
      error instanceof Error ? error.message : "Could not load transcript history."
  }

  renderAll()
}

const loadSessionDetail = async (sessionId, { force = false } = {}) => {
  if (!force && state.sessionDetailsById.has(sessionId)) {
    return state.sessionDetailsById.get(sessionId)
  }

  const response = await apiFetch(`/api/v1/sessions/${sessionId}`)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response))
  }

  const detail = normalizeSessionDetail(await response.json())
  state.sessionDetailsById.set(sessionId, detail)
  updateSession(detail)
  return detail
}

const loadExistingQuizForSession = async (sessionId, { force = false } = {}) => {
  if (!force && state.quizzesBySessionId.has(sessionId)) {
    if (state.selectedSessionId === sessionId) {
      const cachedQuiz = state.quizzesBySessionId.get(sessionId)
      applyQuizToState(cachedQuiz)
      void loadAttemptHistoryForSession(sessionId)
    }
    return
  }

  const response = await apiFetch(`/api/v1/sessions/${sessionId}/quizzes`)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response))
  }

  const quizzes = await response.json()
  if (state.selectedSessionId !== sessionId) {
    return
  }

  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    if (state.quizSessionId === sessionId) {
      clearCurrentQuizState()
    }
    return
  }

  const latestQuiz = normalizeQuizResponse(quizzes[0])
  state.quizzesBySessionId.set(sessionId, latestQuiz)
  applyQuizToState(latestQuiz)
  await loadAttemptHistoryForSession(sessionId)
}

const loadAttemptHistoryForSession = async (sessionId, { force = false } = {}) => {
  if (!force && state.attemptHistoryBySessionId.has(sessionId)) {
    renderPreviewPanel()
    renderQuizPanel()
    return
  }

  state.loadingAttemptHistorySessionIds.add(sessionId)
  state.attemptHistoryErrorsBySessionId.delete(sessionId)
  renderPreviewPanel()
  renderQuizPanel()

  try {
    const quizzesResponse = await apiFetch(`/api/v1/sessions/${sessionId}/quizzes`)
    if (!quizzesResponse.ok) {
      throw new Error(await extractErrorMessage(quizzesResponse))
    }

    const quizzes = await quizzesResponse.json()
    const quizList = Array.isArray(quizzes) ? quizzes : []
    const historyGroups = await Promise.all(
      quizList.map(async (quiz) => {
        const response = await apiFetch(`/api/v1/quizzes/${quiz.quiz_id}/attempts`)
        if (!response.ok) {
          throw new Error(await extractErrorMessage(response))
        }
        const history = await response.json()
        return Array.isArray(history) ? history : []
      }),
    )
    const history = historyGroups
      .flat()
      .sort((left, right) => {
        return new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime()
      })
    state.attemptHistoryBySessionId.set(sessionId, history)
    syncActiveHistoryAttempt(history)
  } catch (error) {
    state.attemptHistoryErrorsBySessionId.set(
      sessionId,
      error instanceof Error ? error.message : "Could not load quiz attempt history.",
    )
  } finally {
    state.loadingAttemptHistorySessionIds.delete(sessionId)
  }

  renderPreviewPanel()
  renderQuizPanel()
}

const refreshProfileSummary = async () => {
  await loadProfileData({ silent: true })
}

const loadSelectedSessionDetail = async (sessionId, { force = false } = {}) => {
  state.previewState = "loading"
  state.previewError = ""
  renderPreviewPanel()

  try {
    await loadSessionDetail(sessionId, { force })
    state.previewState = "ready"
  } catch (error) {
    state.previewState = "error"
    state.previewError =
      error instanceof Error ? error.message : "Could not load transcript detail."
  }

  renderAll()
}

const handleSelectSession = async (sessionId, { generateAfterSelect = false } = {}) => {
  const selectionRequestId = state.activeSelectionRequestId + 1
  state.activeSelectionRequestId = selectionRequestId
  state.selectedSessionId = sessionId
  state.activePreviewTab = "transcript"
  state.isQuizPracticeActive = false
  state.activeHistoryAttemptId = null
  if (state.quizSessionId !== sessionId) {
    clearCurrentQuizState()
  }
  if (isGeneratingQuizForSession(sessionId)) {
    state.quizSessionId = sessionId
    state.quizState = "loading"
    state.quizError = ""
  }
  state.previewState = "loading"
  state.previewError = ""
  renderAll()

  try {
    await loadSessionDetail(sessionId)
    if (
      selectionRequestId !== state.activeSelectionRequestId ||
      state.selectedSessionId !== sessionId
    ) {
      return
    }

    state.previewState = "ready"

    const selectedSession = getSelectedSession()
    if (isGeneratingQuizForSession(sessionId)) {
      state.quizSessionId = sessionId
      state.quizState = "loading"
    } else if (selectedSession?.quizStatus === "Quiz Generated") {
      try {
        state.quizSessionId = sessionId
        state.quizState = "loading"
        renderQuizPanel()
        await loadExistingQuizForSession(sessionId)
      } catch (error) {
        if (
          selectionRequestId === state.activeSelectionRequestId &&
          state.selectedSessionId === sessionId
        ) {
          state.quizSessionId = sessionId
          state.quizState = "error"
          state.quizError =
            error instanceof Error ? error.message : "Could not load the generated quiz."
        }
      }
    } else if (state.quizSessionId !== sessionId) {
      clearCurrentQuizState()
    }

    if (generateAfterSelect) {
      await generateQuizForSelectedSession()
      return
    }
  } catch (error) {
    if (
      selectionRequestId !== state.activeSelectionRequestId ||
      state.selectedSessionId !== sessionId
    ) {
      return
    }

    state.previewState = "error"
    state.previewError =
      error instanceof Error ? error.message : "Could not load transcript detail."
    if (state.quizSessionId !== sessionId) {
      clearCurrentQuizState()
    }
  }

  if (selectionRequestId === state.activeSelectionRequestId) {
    renderAll()
  }
}

const generateQuizForSelectedSession = async () => {
  const selectedSession = getSelectedSession()
  if (!selectedSession || isGeneratingQuizForSession(selectedSession.sessionId)) {
    return
  }

  const sessionId = selectedSession.sessionId

  state.generatingSessionIds.add(sessionId)
  state.isQuizPracticeActive = true
  state.activePreviewTab = "transcript"
  state.quizState = "loading"
  state.quizError = ""
  state.quizSessionId = sessionId
  state.currentQuizId = null
  state.currentQuizQuestions = []
  state.selectedAnswersByQuestionId = {}
  state.isSubmittingAttempt = false
  renderRows()
  renderPreviewPanel()
  renderQuizPanel()

  try {
    if (!selectedSession.rawText) {
      await loadSelectedSessionDetail(sessionId)
      if (state.selectedSessionId !== sessionId) {
        return
      }
    }

    const response = await apiFetch(`/api/v1/sessions/${sessionId}/generate-quiz`, {
      method: "POST",
      body: JSON.stringify({
        difficulty: state.quizDifficulty,
        question_type: state.quizQuestionType,
      }),
    })
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }

    const quiz = normalizeQuizResponse(await response.json())
    state.quizzesBySessionId.set(sessionId, quiz)
    state.attemptResultsByQuizId.delete(quiz.quizId)
    state.attemptHistoryErrorsBySessionId.delete(sessionId)
    syncSessionQuizStatus(sessionId, "Quiz Generated")
    if (state.selectedSessionId === sessionId) {
      state.generatingSessionIds.delete(sessionId)
      applyQuizToState(quiz)
      renderAll()
      scrollPreviewQuizIntoView()
      void loadAttemptHistoryForSession(sessionId, { force: true })

      void loadExistingQuizForSession(sessionId, { force: true }).catch(() => {
        return
      })
    }
    void refreshProfileStatsInBackground()
  } catch (error) {
    if (state.selectedSessionId === sessionId && !state.quizzesBySessionId.has(sessionId)) {
      state.quizSessionId = sessionId
      state.quizState = "error"
      state.quizError =
        error instanceof Error ? error.message : "Could not generate a reading quiz right now."
    }
  } finally {
    state.generatingSessionIds.delete(sessionId)
  }

  renderAll()
}

const submitCurrentQuizAttempt = async () => {
  if (!state.currentQuizId || state.isSubmittingAttempt) {
    return
  }

  if (!hasAnsweredEveryQuestion()) {
    state.quizNotice = `Choose an answer for all ${state.currentQuizQuestions.length} questions before submitting.`
    state.quizNoticeTone = "error"
    renderPreviewPanel()
    renderQuizPanel()
    return
  }

  state.quizNotice = ""
  state.quizNoticeTone = "error"
  state.isSubmittingAttempt = true
  renderPreviewPanel()
  renderQuizPanel()

  const answers = state.currentQuizQuestions
    .map((question) => {
      const selectedAnswer = state.selectedAnswersByQuestionId[question.id]
      if (!selectedAnswer) {
        return null
      }

      return {
        question_id: question.id,
        selected_answer: selectedAnswer,
      }
    })
    .filter(Boolean)

  try {
    const response = await apiFetch(`/api/v1/quizzes/${state.currentQuizId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    })
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }

    const payload = await response.json()
    state.attemptResultsByQuizId.set(state.currentQuizId, payload)
    if (state.selectedSessionId) {
      await loadAttemptHistoryForSession(state.selectedSessionId, { force: true })
    }
    state.activeHistoryAttemptId = payload.attempt_id
    state.activePreviewTab = "history"
    state.isQuizPracticeActive = false
    state.quizNotice = "Attempt saved to history."
    state.quizNoticeTone = "success"
    await refreshProfileSummary()
  } catch (error) {
    state.quizState = "error"
    state.quizError =
      error instanceof Error ? error.message : "Could not submit your quiz attempt."
  } finally {
    state.isSubmittingAttempt = false
  }

  renderAll()
}

const bindEvents = () => {
  elements.searchInput.form?.addEventListener("submit", (event) => {
    event.preventDefault()
  })

  elements.dashboardTabs.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof Element)) {
      return
    }

    const tab = target.closest("[data-dashboard-tab]")
    if (!tab) {
      return
    }

    event.preventDefault()
    const nextTab = tab.dataset.dashboardTab
    if (nextTab === "workspace" || nextTab === "analytics") {
      state.activeDashboardTab = nextTab
      renderDashboardView()
    }
  })

  elements.previewPanel.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof Element)) {
      return
    }

    const previewTab = target.closest("[data-preview-tab]")
    if (previewTab) {
      event.preventDefault()
      const nextTab = previewTab.dataset.previewTab
      if (nextTab === "transcript" || nextTab === "history") {
        state.activePreviewTab = nextTab
        state.quizNotice = ""
        renderPreviewPanel()
        renderQuizPanel()
      }
      return
    }

    const previewQuizAction = target.closest("[data-preview-quiz-action]")
    if (previewQuizAction) {
      event.preventDefault()
      const action = previewQuizAction.dataset.previewQuizAction
      if (action === "regenerate") {
        void generateQuizForSelectedSession()
      }
      if (action === "retake") {
        startNewQuizAttempt()
        renderPreviewPanel()
        renderQuizPanel()
      }
      if (action === "submit") {
        void submitCurrentQuizAttempt()
      }
      return
    }

    const attemptButton = target.closest("[data-preview-attempt-id]")
    if (attemptButton) {
      event.preventDefault()
      const attemptId = Number(attemptButton.dataset.previewAttemptId)
      const attempt = getCurrentAttemptHistory().find((item) => item.attempt_id === attemptId)
      if (!attempt) {
        return
      }
      state.activeHistoryAttemptId = attempt.attempt_id
      state.quizNotice = ""
      renderPreviewPanel()
      renderQuizPanel()
      return
    }

    const generateButton = target.closest("#generate-reading-quiz-button")
    if (!generateButton) {
      return
    }

    event.preventDefault()
    void generateQuizForSelectedSession()
  })

  elements.previewPanel.addEventListener("change", (event) => {
    const target = event.target
    if (target instanceof HTMLSelectElement && target.id === "generate-quiz-difficulty") {
      state.quizDifficulty = target.value
      return
    }
    if (target instanceof HTMLSelectElement && target.id === "generate-quiz-question-type") {
      state.quizQuestionType = target.value
      return
    }
    if (!(target instanceof HTMLInputElement) || !target.dataset.previewQuestionId) {
      return
    }

    const questionId = Number(target.dataset.previewQuestionId)
    state.quizNotice = ""
    state.quizNoticeTone = "error"
    state.selectedAnswersByQuestionId = {
      ...state.selectedAnswersByQuestionId,
      [questionId]: target.value,
    }
    renderPreviewPanel()
    renderQuizPanel()
  })

  elements.searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value
    renderRows()
  })

  elements.filterSelect.addEventListener("change", (event) => {
    state.filterValue = event.target.value
    renderRows()
  })

  elements.signOutButton.addEventListener("click", () => {
    clearAccessToken()
    redirectToLogin()
  })
}

const init = async () => {
  if (!getAccessToken()) {
    redirectToLogin()
    return
  }

  bindEvents()
  renderAll()

  await Promise.all([loadProfileData(), loadSessionsData()])
  renderAll()
}

void init()
