;(() => {
  const mockSessions = [
    {
      sessionId: "session_108",
      videoId: "dQw4w9WgXcQ",
      videoTitle: "TED Talk - Small habits for consistent English practice",
      completedAt: "2026-04-29T19:15:00Z",
      accuracyScore: 93,
      wordCount: 31,
      rawText:
        "Consistent progress in language learning often comes from very small habits. Even ten focused minutes each day can build confidence, improve listening accuracy, and make spoken English feel much more natural over time.",
      quizStatus: "Quiz Generated",
      shouldGenerateError: false,
      quizQuestions: [
        {
          question: "What is the central idea of the transcript?",
          options: {
            A: "Short, regular practice creates steady language progress.",
            B: "Long grammar sessions are the fastest learning method.",
            C: "Listening only works with advanced learners.",
            D: "Speaking accuracy matters more than consistency.",
          },
          correctAnswer: "A",
          explanation:
            "The transcript emphasizes that small daily habits improve confidence and listening accuracy over time.",
        },
        {
          question: "Why does the speaker mention ten focused minutes each day?",
          options: {
            A: "To suggest a full study plan for exams.",
            B: "To show that even a small daily routine can be effective.",
            C: "To compare listening with reading practice.",
            D: "To explain why vocabulary study is unnecessary.",
          },
          correctAnswer: "B",
          explanation:
            "That detail supports the idea that small but consistent effort can still lead to meaningful improvement.",
        },
      ],
    },
    {
      sessionId: "session_107",
      videoId: "Fk8N9a2mLpQ",
      videoTitle: "Interview clip - Answering with calm and clarity",
      completedAt: "2026-04-26T12:05:00Z",
      accuracyScore: 88,
      wordCount: 29,
      rawText:
        "When people answer clearly, they usually pause long enough to organize the main idea first. That short moment of structure gives the listener a better chance to follow the message without confusion.",
      quizStatus: "Quiz Ready",
      shouldGenerateError: false,
      quizQuestions: [],
    },
    {
      sessionId: "session_106",
      videoId: "Hm2Qa7tVxY1",
      videoTitle: "Travel vlog - Airport announcements and directions",
      completedAt: "2026-04-22T07:40:00Z",
      accuracyScore: 91,
      wordCount: 27,
      rawText:
        "Airport announcements sound fast because they remove unnecessary pauses. If you learn to catch the key nouns, numbers, and gate changes first, the full message becomes easier to understand.",
      quizStatus: "Completed",
      shouldGenerateError: false,
      quizQuestions: [],
    },
    {
      sessionId: "session_105",
      videoId: "Pz7Rk1uLmN4",
      videoTitle: "Movie dialogue - Soft pronunciation in natural speech",
      completedAt: "2026-04-18T20:00:00Z",
      accuracyScore: 85,
      wordCount: 28,
      rawText:
        "Natural conversation does not always pronounce every sound strongly. Speakers link words together, reduce vowels, and depend on rhythm, which is why shadowing helps learners notice real spoken patterns.",
      quizStatus: "Completed",
      shouldGenerateError: true,
      quizQuestions: [],
    },
  ]

  const state = {
    searchTerm: "",
    filterValue: "All",
    selectedSessionId: null,
    quizState: "empty",
    quizError: "",
  }

  const elements = {
    rows: document.getElementById("transcript-rows"),
    summary: document.getElementById("transcript-summary"),
    searchInput: document.getElementById("transcript-search"),
    filterSelect: document.getElementById("transcript-filter"),
    previewPanel: document.getElementById("preview-panel-content"),
    quizPanel: document.getElementById("quiz-panel-content"),
  }

  const formatDate = (isoDate) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(isoDate))
  }

  const getSelectedSession = () => {
    return mockSessions.find((session) => session.sessionId === state.selectedSessionId) ?? null
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

    return mockSessions.filter((session) => {
      const matchesFilter = state.filterValue === "All" || session.quizStatus === state.filterValue
      const searchHaystack = `${session.videoTitle} ${session.videoId}`.toLowerCase()
      const matchesSearch = query.length === 0 || searchHaystack.includes(query)

      return matchesFilter && matchesSearch
    })
  }

  const buildMockQuizQuestions = (session) => {
    return [
      {
        question: `What is the main takeaway from "${session.videoTitle}"?`,
        options: {
          A: "The transcript focuses on a practical listening strategy.",
          B: "The transcript is mainly about grammar correction.",
          C: "The speaker is comparing multiple learning apps.",
          D: "The passage only describes visual details from the video.",
        },
        correctAnswer: "A",
        explanation:
          "The passage centers on one useful listening or speaking insight rather than a broad platform comparison.",
      },
      {
        question: "Which detail best supports the main idea?",
        options: {
          A: "A specific habit, signal, or speech pattern is emphasized.",
          B: "The transcript avoids all practical examples.",
          C: "The speaker only talks about test scores.",
          D: "The passage argues against repetition in learning.",
        },
        correctAnswer: "A",
        explanation:
          "The transcript includes a concrete detail that reinforces the broader learning point presented in the passage.",
      },
    ]
  }

  const renderRows = () => {
    const sessions = getFilteredSessions()

    elements.summary.textContent =
      sessions.length === 0
        ? "Khong co transcript nao khop bo loc hien tai."
        : `${sessions.length} sessions dang duoc hien thi trong transcript history.`

    elements.rows.innerHTML = ""

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
        `View transcript for ${session.videoTitle}. Status ${session.quizStatus}. Accuracy ${session.accuracyScore} percent.`,
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
        <div><span class="score-badge">${session.accuracyScore}%</span></div>
        <div><span class="status-badge ${getStatusClassName(session.quizStatus)}">${session.quizStatus}</span></div>
        <div class="transcript-actions">
          <button type="button" class="button-text" data-action="view">View Transcript</button>
          <button type="button" class="button-ghost" data-action="generate">Generate Quiz</button>
        </div>
      `

      row.addEventListener("click", () => {
        selectSession(session.sessionId)
      })

      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          selectSession(session.sessionId)
        }
      })

      row.querySelector('[data-action="view"]').addEventListener("click", (event) => {
        event.stopPropagation()
        selectSession(session.sessionId)
      })

      row.querySelector('[data-action="generate"]').addEventListener("click", (event) => {
        event.stopPropagation()
        selectSession(session.sessionId)
        startQuizGeneration()
      })

      elements.rows.append(row)
    }
  }

  const renderPreviewPanel = () => {
    const selectedSession = getSelectedSession()

    if (!selectedSession) {
      elements.previewPanel.innerHTML = `
        <div class="state-block">
          <p class="state-copy">Chon mot transcript trong danh sach de xem preview va sinh reading quiz.</p>
        </div>
      `
      return
    }

    elements.previewPanel.innerHTML = `
      <div class="preview-state">
        <div class="preview-header">
          <div>
            <h3 class="preview-video-title">${selectedSession.videoTitle}</h3>
          </div>
          <span class="score-badge">${selectedSession.accuracyScore}% accuracy</span>
        </div>
        <div class="preview-meta">
          <span>YouTube / ${selectedSession.videoId}</span>
          <span>${formatDate(selectedSession.completedAt)}</span>
          <span>${selectedSession.sessionId}</span>
        </div>
        <div class="preview-transcript">
          <p>${selectedSession.rawText}</p>
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
        startQuizGeneration()
      })
    }
  }

  const renderQuizPanel = () => {
    const selectedSession = getSelectedSession()

    if (!selectedSession) {
      elements.quizPanel.innerHTML = `
        <div class="state-block">
          <p class="state-copy">Chua co transcript nao duoc chon. Quiz se hien thi tai day sau khi ban chon transcript.</p>
        </div>
      `
      return
    }

    if (state.quizState === "loading") {
      elements.quizPanel.innerHTML = `
        <div class="state-block">
          <div class="loading-inline">
            <div class="loading-spinner" aria-hidden="true"></div>
            <p class="state-copy">Dang sinh cau hoi doc hieu tu transcript da chon.</p>
          </div>
        </div>
      `
      return
    }

    if (state.quizState === "error") {
      elements.quizPanel.innerHTML = `
        <div class="state-block state-error">
          <p class="state-copy">${state.quizError}</p>
        </div>
      `
      return
    }

    if (state.quizState === "generated" && selectedSession.quizQuestions.length > 0) {
      const questionMarkup = selectedSession.quizQuestions
        .map((question, index) => {
          const optionMarkup = Object.entries(question.options)
            .map(([label, value]) => {
              return `
                <li class="quiz-option">
                  <span class="option-label">${label}</span>
                  <span class="option-copy">${value}</span>
                </li>
              `
            })
            .join("")

          return `
            <article class="quiz-question">
              <h3>${index + 1}. ${question.question}</h3>
              <ul class="quiz-options">${optionMarkup}</ul>
              <div class="answer-line">
                <strong>Correct Answer</strong>
                <p class="answer-copy">${question.correctAnswer}</p>
              </div>
              <div class="explanation-line">
                <strong>Explanation</strong>
                <p class="explanation-copy">${question.explanation}</p>
              </div>
            </article>
          `
        })
        .join("")

      elements.quizPanel.innerHTML = `
        <div class="quiz-list">
          ${questionMarkup}
        </div>
        <p class="question-note">
          Quiz mock da duoc render tu transcript hien tai, chua can goi API that.
        </p>
      `
      return
    }

    elements.quizPanel.innerHTML = `
      <div class="state-block">
        <p class="state-copy">Transcript da duoc chon. Bam "Generate Reading Quiz" de xem mock quiz.</p>
      </div>
    `
  }

  const renderAll = () => {
    renderRows()
    renderPreviewPanel()
    renderQuizPanel()
  }

  const selectSession = (sessionId) => {
    state.selectedSessionId = sessionId

    const selectedSession = getSelectedSession()
    if (!selectedSession) {
      state.quizState = "empty"
      state.quizError = ""
    } else if (
      selectedSession.quizStatus === "Quiz Generated" &&
      selectedSession.quizQuestions.length > 0
    ) {
      state.quizState = "generated"
      state.quizError = ""
    } else {
      state.quizState = "empty"
      state.quizError = ""
    }

    renderAll()
  }

  const startQuizGeneration = () => {
    const selectedSession = getSelectedSession()
    if (!selectedSession || state.quizState === "loading") {
      return
    }

    state.quizState = "loading"
    state.quizError = ""
    renderPreviewPanel()
    renderQuizPanel()

    window.setTimeout(() => {
      if (selectedSession.shouldGenerateError) {
        state.quizState = "error"
        state.quizError =
          "Khong the sinh quiz cho transcript nay trong mock state. Hay thu transcript khac."
        renderPreviewPanel()
        renderQuizPanel()
        return
      }

      selectedSession.quizQuestions = buildMockQuizQuestions(selectedSession)
      selectedSession.quizStatus = "Quiz Generated"
      state.quizState = "generated"
      state.quizError = ""
      renderAll()
    }, 1100)
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
  }

  bindEvents()
  renderAll()
})()
