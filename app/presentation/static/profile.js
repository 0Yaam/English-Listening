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
  selectedSessionId: null,
  previewState: "empty",
  previewError: "",
  quizState: "empty",
  quizError: "",
  isSubmittingAttempt: false,
  currentQuizId: null,
  currentQuizQuestions: [],
  selectedAnswersByQuestionId: {},
  sessionDetailsById: new Map(),
  quizzesBySessionId: new Map(),
  attemptResultsByQuizId: new Map(),
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
  state.currentQuizId = null
  state.currentQuizQuestions = []
  state.selectedAnswersByQuestionId = {}
  state.isSubmittingAttempt = false
}

const applyQuizToState = (quiz) => {
  state.currentQuizId = quiz.quizId
  state.currentQuizQuestions = quiz.questions
  state.quizState = quiz.questions.length > 0 ? "generated" : "empty"
  state.quizError = ""
  state.selectedAnswersByQuestionId = {}
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
        <button type="button" class="button-ghost" data-action="generate">Generate Quiz</button>
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
      event.stopPropagation()
      void handleSelectSession(session.sessionId)
    })
    row.querySelector('[data-action="generate"]').addEventListener("click", (event) => {
      event.stopPropagation()
      void handleSelectSession(session.sessionId, { generateAfterSelect: true })
    })

    elements.rows.append(row)
  }
}

const renderPreviewPanel = () => {
  const selectedSession = getSelectedSession()

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
      <div class="state-block">
        <p class="state-copy">Chon mot transcript trong danh sach de xem preview va sinh reading quiz.</p>
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
        <button
          id="generate-reading-quiz-button"
          type="button"
          class="button-primary"
          ${state.quizState === "loading" ? "disabled" : ""}
        >
          ${state.quizState === "loading" ? "Generating..." : "Generate Reading Quiz"}
        </button>
      </div>
    </div>
  `

  const generateButton = document.getElementById("generate-reading-quiz-button")
  if (generateButton) {
    generateButton.addEventListener("click", () => {
      void generateQuizForSelectedSession()
    })
  }
}

const renderQuizPanel = () => {
  const selectedSession = getSelectedSession()

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
      <div class="state-block state-empty">
        <p class="state-copy">Select a transcript to generate quiz.</p>
      </div>
    `
    return
  }

  if (state.quizState === "loading") {
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

  const submittedAttempt = state.currentQuizId
    ? state.attemptResultsByQuizId.get(state.currentQuizId) ?? null
    : null
  const submittedResults = new Map(
    (submittedAttempt?.results ?? []).map((item) => [item.question_id, item]),
  )

  const questionMarkup = state.currentQuizQuestions
    .map((question, index) => {
      const optionMarkup = Object.entries(question.options)
        .map(([label, value]) => {
          const isChecked = state.selectedAnswersByQuestionId[question.id] === label
          return `
            <label class="quiz-option quiz-option-choice ${isChecked ? "is-selected" : ""}">
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
      <p class="question-note">Select your answers and submit to see corrections and explanations.</p>
    `

  elements.quizPanel.innerHTML = `
    <div class="quiz-list">
      ${questionMarkup}
    </div>
    ${scoreSummaryMarkup}
    <div class="quiz-footer-actions">
      <button id="regenerate-quiz-button" type="button" class="button-ghost">Regenerate Quiz</button>
      <button
        id="submit-quiz-button"
        type="button"
        class="button-primary"
        ${state.isSubmittingAttempt ? "disabled" : ""}
      >
        ${state.isSubmittingAttempt ? "Submitting..." : submittedAttempt ? "Submitted" : "Submit Quiz"}
      </button>
    </div>
  `

  for (const input of elements.quizPanel.querySelectorAll('input[type="radio"][data-question-id]')) {
    input.addEventListener("change", (event) => {
      const target = event.currentTarget
      const questionId = Number(target.dataset.questionId)
      state.selectedAnswersByQuestionId = {
        ...state.selectedAnswersByQuestionId,
        [questionId]: target.value,
      }
      renderQuizPanel()
    })
  }

  const regenerateButton = document.getElementById("regenerate-quiz-button")
  if (regenerateButton) {
    regenerateButton.addEventListener("click", () => {
      void generateQuizForSelectedSession()
    })
  }
  const submitButton = document.getElementById("submit-quiz-button")
  if (submitButton && !submittedAttempt) {
    submitButton.addEventListener("click", () => {
      void submitCurrentQuizAttempt()
    })
  }
}

const renderAll = () => {
  renderProfile()
  renderRows()
  renderPreviewPanel()
  renderQuizPanel()
}

const loadProfileData = async () => {
  state.profileLoadState = "loading"
  state.profileError = ""
  renderProfile()

  try {
    const response = await apiFetch("/api/v1/profile")
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }

    state.profile = await response.json()
    state.profileLoadState = "ready"
  } catch (error) {
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
    state.sessions = payload.map(normalizeSessionSummary)
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
    applyQuizToState(state.quizzesBySessionId.get(sessionId))
    return
  }

  const response = await apiFetch(`/api/v1/sessions/${sessionId}/quizzes`)
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response))
  }

  const quizzes = await response.json()
  if (!Array.isArray(quizzes) || quizzes.length === 0) {
    clearCurrentQuizState()
    return
  }

  const latestQuiz = normalizeQuizResponse(quizzes[0])
  state.quizzesBySessionId.set(sessionId, latestQuiz)
  applyQuizToState(latestQuiz)
}

const refreshProfileSummary = async () => {
  await loadProfileData()
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
  state.selectedSessionId = sessionId
  clearCurrentQuizState()
  state.previewState = "loading"
  state.previewError = ""
  renderAll()

  try {
    await loadSessionDetail(sessionId)
    state.previewState = "ready"

    const selectedSession = getSelectedSession()
    if (selectedSession?.quizStatus === "Quiz Generated") {
      try {
        state.quizState = "loading"
        renderQuizPanel()
        await loadExistingQuizForSession(sessionId)
      } catch (error) {
        state.quizState = "error"
        state.quizError =
          error instanceof Error ? error.message : "Could not load the generated quiz."
      }
    } else {
      clearCurrentQuizState()
    }

    if (generateAfterSelect) {
      await generateQuizForSelectedSession()
      return
    }
  } catch (error) {
    state.previewState = "error"
    state.previewError =
      error instanceof Error ? error.message : "Could not load transcript detail."
    clearCurrentQuizState()
  }

  renderAll()
}

const generateQuizForSelectedSession = async () => {
  const selectedSession = getSelectedSession()
  if (!selectedSession || state.quizState === "loading") {
    return
  }

  if (!selectedSession.rawText) {
    await loadSelectedSessionDetail(selectedSession.sessionId)
  }

  state.quizState = "loading"
  state.quizError = ""
  state.currentQuizId = null
  state.currentQuizQuestions = []
  state.selectedAnswersByQuestionId = {}
  renderPreviewPanel()
  renderQuizPanel()

  try {
    const response = await apiFetch(`/api/v1/sessions/${selectedSession.sessionId}/generate-quiz`, {
      method: "POST",
    })
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }

    const quiz = normalizeQuizResponse(await response.json())
    state.quizzesBySessionId.set(selectedSession.sessionId, quiz)
    state.attemptResultsByQuizId.delete(quiz.quizId)
    applyQuizToState(quiz)
    updateSession({
      sessionId: selectedSession.sessionId,
      quizStatus: "Quiz Generated",
    })
    await refreshProfileSummary()
  } catch (error) {
    state.quizState = "error"
    state.quizError =
      error instanceof Error ? error.message : "Could not generate a reading quiz right now."
  }

  renderAll()
}

const submitCurrentQuizAttempt = async () => {
  if (!state.currentQuizId || state.isSubmittingAttempt) {
    return
  }

  state.isSubmittingAttempt = true
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
