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
  selectedSessionId: null,
  sessionsLoadState: "loading",
  vocabularyLoadState: "empty",
  vocabularyError: "",
  quizLoadState: "empty",
  quizError: "",
  sessionSearchTerm: "",
  wordSearchTerm: "",
  difficultyFilter: "all",
  savedOnly: false,
  vocabularyBySessionId: new Map(),
  quizBySessionId: new Map(),
  quizAnswersBySessionId: new Map(),
}

const elements = {
  avatar: document.getElementById("vocab-avatar"),
  userline: document.getElementById("vocab-userline"),
  signOutButton: document.getElementById("vocab-sign-out-button"),
  sessionSearch: document.getElementById("vocab-session-search"),
  sessionSummary: document.getElementById("vocab-session-summary"),
  sessionList: document.getElementById("vocab-session-list"),
  wordTitle: document.getElementById("vocab-word-title"),
  wordSubtitle: document.getElementById("vocab-word-subtitle"),
  refreshButton: document.getElementById("vocab-refresh-button"),
  wordSearch: document.getElementById("vocab-word-search"),
  difficultyFilter: document.getElementById("vocab-difficulty-filter"),
  savedOnly: document.getElementById("vocab-saved-only"),
  wordContent: document.getElementById("vocab-word-content"),
  startQuizButton: document.getElementById("vocab-start-quiz-button"),
  quizSummary: document.getElementById("vocab-quiz-summary"),
  quizContent: document.getElementById("vocab-quiz-content"),
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
    completedAt: payload.completed_at,
    accuracyScore: payload.accuracy_score,
    wordCount: payload.word_count ?? 0,
    quizStatus: payload.quiz_status ?? "Completed",
  }
}

const normalizeVocabularyItem = (item) => {
  return {
    id: item.id ?? null,
    term: item.term,
    contextSentence: item.context_sentence,
    definition: item.definition,
    difficulty: item.difficulty,
    isSaved: Boolean(item.is_saved),
  }
}

const normalizeQuizQuestion = (item) => {
  return {
    prompt: item.prompt,
    options: Array.isArray(item.options) ? item.options : [],
    correctAnswer: item.correct_answer,
    contextSentence: item.context_sentence,
  }
}

const getSelectedSession = () => {
  return state.sessions.find((session) => session.sessionId === state.selectedSessionId) ?? null
}

const getVocabularyForSelectedSession = () => {
  return state.selectedSessionId
    ? state.vocabularyBySessionId.get(state.selectedSessionId) ?? []
    : []
}

const getQuizForSelectedSession = () => {
  return state.selectedSessionId ? state.quizBySessionId.get(state.selectedSessionId) ?? [] : []
}

const getQuizAnswersForSelectedSession = () => {
  return state.selectedSessionId
    ? state.quizAnswersBySessionId.get(state.selectedSessionId) ?? {}
    : {}
}

const getFilteredSessions = () => {
  const query = state.sessionSearchTerm.trim().toLowerCase()
  if (!query) {
    return state.sessions
  }

  return state.sessions.filter((session) => {
    return `${session.videoTitle} ${session.videoId}`.toLowerCase().includes(query)
  })
}

const getFilteredVocabulary = () => {
  const query = state.wordSearchTerm.trim().toLowerCase()
  return getVocabularyForSelectedSession().filter((item) => {
    const matchesQuery =
      !query ||
      `${item.term} ${item.definition} ${item.contextSentence}`.toLowerCase().includes(query)
    const matchesDifficulty =
      state.difficultyFilter === "all" || item.difficulty === state.difficultyFilter
    const matchesSaved = !state.savedOnly || item.isSaved
    return matchesQuery && matchesDifficulty && matchesSaved
  })
}

const renderProfile = () => {
  const user = state.profile?.user
  if (!user) {
    elements.avatar.textContent = "--"
    elements.userline.textContent = "Loading learner"
    return
  }

  elements.avatar.textContent = buildAvatarInitials(user.username)
  elements.userline.textContent = `${user.username} / ${user.email}`
}

const renderSessions = () => {
  elements.sessionList.innerHTML = ""

  if (state.sessionsLoadState === "loading") {
    elements.sessionSummary.textContent = "Loading transcript list."
    elements.sessionList.innerHTML = `
      <div class="state-block">
        <div class="loading-inline">
          <div class="loading-spinner" aria-hidden="true"></div>
          <p class="state-copy">Loading transcripts.</p>
        </div>
      </div>
    `
    return
  }

  if (state.sessionsLoadState === "error") {
    elements.sessionSummary.textContent = "Could not load transcript list."
    elements.sessionList.innerHTML = `
      <div class="state-block state-error">
        <p class="state-copy">Could not load your transcripts.</p>
      </div>
    `
    return
  }

  const sessions = getFilteredSessions()
  elements.sessionSummary.textContent =
    sessions.length === 0
      ? "No transcripts match the current search."
      : `${sessions.length} transcript${sessions.length === 1 ? "" : "s"} available.`

  if (sessions.length === 0) {
    elements.sessionList.innerHTML = `
      <div class="empty-state">
        <p class="state-copy">No transcript found.</p>
      </div>
    `
    return
  }

  elements.sessionList.innerHTML = sessions
    .map((session) => {
      const isSelected = session.sessionId === state.selectedSessionId
      return `
        <button
          type="button"
          class="vocab-session-item ${isSelected ? "is-selected" : ""}"
          data-session-id="${session.sessionId}"
          aria-pressed="${isSelected}"
        >
          <h3 class="session-title">${escapeHtml(session.videoTitle)}</h3>
          <span class="session-source">YouTube / ${escapeHtml(session.videoId)}</span>
          <span class="session-meta">
            <span>${escapeHtml(formatDate(session.completedAt))}</span>
            <span>${escapeHtml(String(session.wordCount))} words</span>
            <span class="stat-badge">${escapeHtml(formatPercent(session.accuracyScore))}</span>
          </span>
        </button>
      `
    })
    .join("")
}

const buildSummaryMarkup = (items) => {
  const savedCount = items.filter((item) => item.isSaved).length
  const hardCount = items.filter((item) => item.difficulty === "hard").length
  const mediumCount = items.filter((item) => item.difficulty === "medium").length
  return `
    <div class="vocab-summary-grid">
      <div class="summary-tile">
        <span>Total</span>
        <strong>${items.length}</strong>
      </div>
      <div class="summary-tile">
        <span>Saved</span>
        <strong>${savedCount}</strong>
      </div>
      <div class="summary-tile">
        <span>Hard</span>
        <strong>${hardCount}</strong>
      </div>
      <div class="summary-tile">
        <span>Medium</span>
        <strong>${mediumCount}</strong>
      </div>
    </div>
  `
}

const renderWords = () => {
  const selectedSession = getSelectedSession()
  elements.refreshButton.disabled = !selectedSession || state.vocabularyLoadState === "loading"
  elements.startQuizButton.disabled = !selectedSession || state.vocabularyLoadState === "loading"

  if (!selectedSession) {
    elements.wordTitle.textContent = "Choose a transcript"
    elements.wordSubtitle.textContent = "Vocabulary will be extracted from the transcript context."
    elements.wordContent.innerHTML = `
      <div class="empty-state">
        <span class="section-label">Vocabulary Lab</span>
        <p class="state-copy">Select a transcript from the left panel.</p>
      </div>
    `
    return
  }

  elements.wordTitle.textContent = selectedSession.videoTitle
  elements.wordSubtitle.textContent = `${selectedSession.wordCount} words / ${formatDate(selectedSession.completedAt)}`

  if (state.vocabularyLoadState === "loading") {
    elements.wordContent.innerHTML = `
      <div class="state-block">
        <div class="loading-inline">
          <div class="loading-spinner" aria-hidden="true"></div>
          <p class="state-copy">Extracting vocabulary from transcript context.</p>
        </div>
      </div>
    `
    return
  }

  if (state.vocabularyLoadState === "error") {
    elements.wordContent.innerHTML = `
      <div class="state-block state-error">
        <p class="state-copy">${escapeHtml(state.vocabularyError || "Could not load vocabulary.")}</p>
        <button type="button" class="button-ghost" data-action="reload-vocabulary">Retry</button>
      </div>
    `
    return
  }

  const allItems = getVocabularyForSelectedSession()
  const filteredItems = getFilteredVocabulary()
  if (allItems.length === 0) {
    elements.wordContent.innerHTML = `
      <div class="empty-state">
        <span class="section-label">No words yet</span>
        <p class="state-copy">This transcript does not have enough vocabulary candidates.</p>
      </div>
    `
    return
  }

  if (filteredItems.length === 0) {
    elements.wordContent.innerHTML = `
      ${buildSummaryMarkup(allItems)}
      <div class="empty-state">
        <p class="state-copy">No words match the current filters.</p>
      </div>
    `
    return
  }

  elements.wordContent.innerHTML = `
    ${buildSummaryMarkup(allItems)}
    <div class="word-grid">
      ${filteredItems
        .map((item) => {
          return `
            <article class="word-card">
              <div class="word-card-header">
                <div>
                  <h3 class="word-term">${escapeHtml(item.term)}</h3>
                  <div class="word-meta">
                    <span class="difficulty-badge is-${escapeHtml(item.difficulty)}">${escapeHtml(item.difficulty)}</span>
                    ${item.isSaved ? `<span class="stat-badge">Saved</span>` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  class="${item.isSaved ? "button-text" : "button-ghost"}"
                  data-save-term="${encodeURIComponent(item.term)}"
                  ${item.isSaved ? "disabled" : ""}
                >
                  ${item.isSaved ? "Saved" : "Save"}
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
}

const renderQuiz = () => {
  const selectedSession = getSelectedSession()
  if (!selectedSession) {
    elements.quizSummary.textContent = "No transcript selected."
    elements.quizContent.innerHTML = `
      <div class="empty-state">
        <p class="state-copy">Mini quiz will appear after selecting a transcript.</p>
      </div>
    `
    return
  }

  const questions = getQuizForSelectedSession()
  const answers = getQuizAnswersForSelectedSession()
  const answeredCount = Object.keys(answers).length
  elements.quizSummary.textContent =
    questions.length > 0
      ? `${answeredCount}/${questions.length} answered.`
      : "Ready for this transcript."

  if (state.quizLoadState === "loading") {
    elements.quizContent.innerHTML = `
      <div class="state-block">
        <div class="loading-inline">
          <div class="loading-spinner" aria-hidden="true"></div>
          <p class="state-copy">Building vocabulary mini quiz.</p>
        </div>
      </div>
    `
    return
  }

  if (state.quizLoadState === "error") {
    elements.quizContent.innerHTML = `
      <div class="state-block state-error">
        <p class="state-copy">${escapeHtml(state.quizError || "Could not build mini quiz.")}</p>
      </div>
    `
    return
  }

  if (questions.length === 0) {
    elements.quizContent.innerHTML = `
      <div class="empty-state">
        <span class="section-label">Mini Quiz</span>
        <p class="state-copy">Start a cloze quiz from the extracted words.</p>
      </div>
    `
    return
  }

  elements.quizContent.innerHTML = `
    <div class="quiz-list">
      ${questions
        .map((question, index) => {
          const selectedAnswer = answers[index] ?? ""
          const optionMarkup = question.options
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
                <label class="quiz-option ${isSelected ? "is-selected" : ""} ${resultClass}">
                  <input
                    type="radio"
                    name="vocab-question-${index}"
                    value="${escapeHtml(option)}"
                    data-question-index="${index}"
                    ${isSelected ? "checked" : ""}
                  />
                  <span>${escapeHtml(option)}</span>
                </label>
              `
            })
            .join("")
          const resultMarkup = selectedAnswer
            ? `
              <p class="quiz-result">
                <span class="${selectedAnswer === question.correctAnswer ? "stat-badge" : "difficulty-badge is-hard"}">
                  ${selectedAnswer === question.correctAnswer ? "Correct" : "Review"}
                </span>
                <span>Answer: ${escapeHtml(question.correctAnswer)}</span>
              </p>
              <p class="quiz-context">${escapeHtml(question.contextSentence)}</p>
            `
            : ""
          return `
            <article class="quiz-question">
              <span class="section-label">Question ${index + 1}</span>
              <h3>${escapeHtml(question.prompt)}</h3>
              <div class="quiz-options">${optionMarkup}</div>
              ${resultMarkup}
            </article>
          `
        })
        .join("")}
    </div>
  `
}

const renderAll = () => {
  renderProfile()
  renderSessions()
  renderWords()
  renderQuiz()
}

const loadProfile = async () => {
  try {
    const response = await apiFetch("/api/v1/profile")
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    state.profile = await response.json()
  } catch {
    state.profile = null
  }
  renderProfile()
}

const loadSessions = async () => {
  state.sessionsLoadState = "loading"
  renderSessions()

  try {
    const response = await apiFetch("/api/v1/sessions?limit=100")
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    const payload = await response.json()
    state.sessions = Array.isArray(payload) ? payload.map(normalizeSession) : []
    state.sessionsLoadState = "ready"

    const requestedSessionId = Number(new URLSearchParams(window.location.search).get("session_id"))
    const requestedSession = state.sessions.find((session) => session.sessionId === requestedSessionId)
    if (requestedSession) {
      await selectSession(requestedSession.sessionId, { replaceHistory: true })
    } else if (state.sessions.length > 0) {
      await selectSession(state.sessions[0].sessionId, { replaceHistory: true })
    } else {
      state.selectedSessionId = null
    }
  } catch {
    state.sessionsLoadState = "error"
  }

  renderAll()
}

const loadVocabulary = async (sessionId, { force = false } = {}) => {
  if (!force && state.vocabularyBySessionId.has(sessionId)) {
    state.vocabularyLoadState = "ready"
    renderAll()
    return
  }

  state.vocabularyLoadState = "loading"
  state.vocabularyError = ""
  renderAll()

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
    state.vocabularyLoadState = "ready"
  } catch (error) {
    state.vocabularyLoadState = "error"
    state.vocabularyError = error instanceof Error ? error.message : "Could not load vocabulary."
  }

  renderAll()
}

const loadQuiz = async (sessionId) => {
  state.quizLoadState = "loading"
  state.quizError = ""
  state.quizBySessionId.delete(sessionId)
  state.quizAnswersBySessionId.set(sessionId, {})
  renderQuiz()

  try {
    const response = await apiFetch(`/api/v1/sessions/${sessionId}/vocabulary/quiz`)
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    const payload = await response.json()
    const questions = Array.isArray(payload.questions)
      ? payload.questions.map(normalizeQuizQuestion)
      : []
    state.quizBySessionId.set(sessionId, questions)
    state.quizLoadState = "ready"
  } catch (error) {
    state.quizLoadState = "error"
    state.quizError = error instanceof Error ? error.message : "Could not build mini quiz."
  }

  renderQuiz()
}

const selectSession = async (sessionId, { replaceHistory = false } = {}) => {
  if (state.selectedSessionId === sessionId && state.vocabularyLoadState !== "empty") {
    return
  }

  state.selectedSessionId = sessionId
  state.wordSearchTerm = ""
  state.difficultyFilter = "all"
  state.savedOnly = false
  state.quizLoadState = state.quizBySessionId.has(sessionId) ? "ready" : "empty"
  elements.wordSearch.value = ""
  elements.difficultyFilter.value = "all"
  elements.savedOnly.checked = false

  const nextUrl = new URL(window.location.href)
  nextUrl.searchParams.set("session_id", String(sessionId))
  if (replaceHistory) {
    window.history.replaceState({}, "", nextUrl)
  } else {
    window.history.pushState({}, "", nextUrl)
  }

  renderAll()
  await loadVocabulary(sessionId)
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
    state.quizBySessionId.delete(sessionId)
    state.quizAnswersBySessionId.set(sessionId, {})
    state.quizLoadState = "empty"
  } catch (error) {
    state.vocabularyLoadState = "error"
    state.vocabularyError = error instanceof Error ? error.message : "Could not save this word."
  }

  renderAll()
}

const bindEvents = () => {
  elements.signOutButton.addEventListener("click", () => {
    clearAccessToken()
    redirectToLogin()
  })

  elements.sessionSearch.addEventListener("input", (event) => {
    state.sessionSearchTerm = event.target.value
    renderSessions()
  })

  elements.sessionList.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof Element)) {
      return
    }
    const sessionButton = target.closest("[data-session-id]")
    if (!sessionButton) {
      return
    }
    void selectSession(Number(sessionButton.dataset.sessionId))
  })

  elements.refreshButton.addEventListener("click", () => {
    if (state.selectedSessionId) {
      void loadVocabulary(state.selectedSessionId, { force: true })
    }
  })

  elements.wordSearch.addEventListener("input", (event) => {
    state.wordSearchTerm = event.target.value
    renderWords()
  })

  elements.difficultyFilter.addEventListener("change", (event) => {
    state.difficultyFilter = event.target.value
    renderWords()
  })

  elements.savedOnly.addEventListener("change", (event) => {
    state.savedOnly = event.target.checked
    renderWords()
  })

  elements.wordContent.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof Element)) {
      return
    }
    const reloadButton = target.closest('[data-action="reload-vocabulary"]')
    if (reloadButton && state.selectedSessionId) {
      void loadVocabulary(state.selectedSessionId, { force: true })
      return
    }
    const saveButton = target.closest("[data-save-term]")
    if (!saveButton) {
      return
    }
    const term = decodeURIComponent(saveButton.dataset.saveTerm ?? "")
    void saveVocabularyItem(term)
  })

  elements.startQuizButton.addEventListener("click", () => {
    if (state.selectedSessionId) {
      void loadQuiz(state.selectedSessionId)
    }
  })

  elements.quizContent.addEventListener("change", (event) => {
    const target = event.target
    if (!(target instanceof HTMLInputElement) || !target.dataset.questionIndex) {
      return
    }
    if (!state.selectedSessionId) {
      return
    }
    const questionIndex = Number(target.dataset.questionIndex)
    const answers = state.quizAnswersBySessionId.get(state.selectedSessionId) ?? {}
    state.quizAnswersBySessionId.set(state.selectedSessionId, {
      ...answers,
      [questionIndex]: target.value,
    })
    renderQuiz()
  })
}

const init = async () => {
  if (!getAccessToken()) {
    redirectToLogin()
    return
  }

  bindEvents()
  renderAll()
  await Promise.all([loadProfile(), loadSessions()])
  renderAll()
}

void init()
