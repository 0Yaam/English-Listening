const AppState = Object.freeze({
  IDLE: "IDLE",
  PLAYING: "PLAYING",
  WAITING_FOR_INPUT: "WAITING_FOR_INPUT",
  FINISHED: "FINISHED",
})

class YouTubePlayerController {
  static apiReadyPromise = null

  constructor(containerId) {
    this.containerId = containerId
    this.player = null
    this.initializationPromise = null
  }

  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = (async () => {
      await YouTubePlayerController.ensureApiReady()

      await new Promise((resolve, reject) => {
        this.player = new window.YT.Player(this.containerId, {
          playerVars: {
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onReady: () => resolve(),
            onError: () => reject(new Error("Không thể khởi tạo YouTube player.")),
          },
        })
      })
    })()

    return this.initializationPromise
  }

  static ensureApiReady() {
    if (window.YT && typeof window.YT.Player === "function") {
      return Promise.resolve()
    }

    if (!YouTubePlayerController.apiReadyPromise) {
      YouTubePlayerController.apiReadyPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]',
        )
        const previousHandler = window.onYouTubeIframeAPIReady

        window.onYouTubeIframeAPIReady = () => {
          if (typeof previousHandler === "function") {
            previousHandler()
          }
          resolve()
        }

        if (!existingScript) {
          const script = document.createElement("script")
          script.src = "https://www.youtube.com/iframe_api"
          script.async = true
          script.onerror = () => reject(new Error("Không tải được YouTube IFrame API."))
          document.head.append(script)
        }
      })
    }

    return YouTubePlayerController.apiReadyPromise
  }

  async loadVideo(videoId, startSeconds = 0, autoplay = false) {
    await this.initialize()

    if (autoplay) {
      this.player.loadVideoById({
        videoId,
        startSeconds,
      })
      return
    }

    this.player.cueVideoById({
      videoId,
      startSeconds,
    })
  }

  play() {
    if (this.player) {
      this.player.playVideo()
    }
  }

  pause() {
    if (this.player) {
      this.player.pauseVideo()
    }
  }

  seekTo(seconds) {
    if (this.player) {
      this.player.seekTo(Math.max(seconds, 0), true)
    }
  }

  getCurrentTime() {
    if (!this.player) {
      return 0
    }

    return this.player.getCurrentTime()
  }
}

class AppController {
  constructor({ playerController, elements, apiBaseUrl = "/api/v1" }) {
    this.playerController = playerController
    this.elements = elements
    this.apiBaseUrl = apiBaseUrl
    this.state = AppState.IDLE
    this.session = null
    this.frameRequestId = null
    this.pendingAdvanceId = null
  }

  async initialize() {
    this.bindEvents()
    await this.playerController.initialize()
    this.setState(AppState.IDLE)
    this.renderStatus("Ứng dụng đã sẵn sàng.")
  }

  bindEvents() {
    this.elements.lessonForm.addEventListener("submit", (event) => {
      this.handleLessonSubmit(event)
    })

    this.elements.startSessionButton.addEventListener("click", () => {
      this.startSession()
    })

    this.elements.replaySegmentButton.addEventListener("click", () => {
      this.replayCurrentSegment()
    })

    this.elements.answerForm.addEventListener("submit", (event) => {
      this.handleAnswerSubmit(event)
    })
  }

  async handleLessonSubmit(event) {
    event.preventDefault()

    this.resetPlayback()
    this.hideFeedback()
    this.hideResults()

    const videoUrl = this.elements.videoUrlInput.value.trim()
    const difficulty = Number(this.elements.difficultySelect.value)
    const videoId = this.extractYouTubeVideoId(videoUrl)

    if (!videoId) {
      this.renderStatus("URL YouTube không hợp lệ. Hãy kiểm tra lại.")
      return
    }

    this.renderStatus("Đang tạo bài tập từ phụ đề...")
    this.setState(AppState.IDLE)
    this.toggleSessionButtons(false)

    try {
      const exercise = await this.fetchBlankExercise(videoId, difficulty)
      if (exercise.items.length === 0) {
        throw new Error("Không có subtitle phù hợp để tạo bài tập.")
      }

      this.session = {
        exercise,
        currentIndex: 0,
        results: [],
      }

      await this.playerController.loadVideo(videoId, exercise.items[0].start, false)

      this.renderExerciseLoaded()
      this.renderCurrentPrompt()
      this.toggleSessionButtons(true)
      this.renderStatus(
        `Đã tạo ${exercise.items.length} câu hỏi. Nhấn "Bắt đầu luyện tập" để bắt đầu.`,
      )
    } catch (error) {
      this.renderStatus(error.message)
      this.session = null
      this.renderEmptyState()
    }
  }

  async handleAnswerSubmit(event) {
    event.preventDefault()

    if (this.state !== AppState.WAITING_FOR_INPUT) {
      return
    }

    const currentItem = this.getCurrentItem()
    if (!currentItem) {
      return
    }

    const userInput = this.elements.answerInput.value.trim()
    if (!userInput) {
      this.renderStatus("Hãy nhập câu trả lời trước khi gửi.")
      return
    }

    this.elements.submitAnswerButton.disabled = true
    this.renderStatus("Đang chấm điểm...")

    try {
      const scorePayload = await this.scoreAnswer({
        originalText: currentItem.original_text,
        userInput,
      })
      const isCorrect = scorePayload.accuracy === 100

      this.session.results.push({
        prompt: currentItem.blanked_text,
        originalText: currentItem.original_text,
        userInput,
        accuracy: scorePayload.accuracy,
        isCorrect,
      })

      this.renderFeedback({
        item: currentItem,
        scorePayload,
        isCorrect,
      })
      this.elements.submitAnswerButton.disabled = false
      this.advanceToNextStep()
    } catch (error) {
      this.elements.submitAnswerButton.disabled = false
      this.renderStatus(error.message)
    }
  }

  async fetchBlankExercise(videoId, difficulty) {
    const response = await fetch(
      `${this.apiBaseUrl}/lessons/${encodeURIComponent(videoId)}/blank-exercise?difficulty=${encodeURIComponent(difficulty)}`,
    )
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.message || "Không thể tạo bài tập.")
    }

    return payload
  }

  async scoreAnswer({ originalText, userInput }) {
    let response

    try {
      response = await fetch(`${this.apiBaseUrl}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original_text: originalText,
          user_input: userInput,
        }),
      })
    } catch (error) {
      return this.buildFallbackScore({
        originalText,
        userInput,
      })
    }

    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.message || "Không thể chấm điểm.")
    }

    return payload
  }

  startSession() {
    if (!this.session) {
      this.renderStatus("Chưa có bài tập để bắt đầu.")
      return
    }

    if (this.state === AppState.PLAYING) {
      return
    }

    if (this.state === AppState.WAITING_FOR_INPUT) {
      this.renderStatus("Hãy hoàn thành câu hiện tại trước khi tiếp tục.")
      return
    }

    if (this.state === AppState.FINISHED) {
      this.session.currentIndex = 0
      this.session.results = []
      this.hideResults()
    }

    this.hideFeedback()
    this.playCurrentSegment()
  }

  replayCurrentSegment() {
    const currentItem = this.getCurrentItem()
    if (!currentItem) {
      return
    }

    window.clearTimeout(this.pendingAdvanceId)
    this.pendingAdvanceId = null
    this.hideFeedback()
    this.elements.answerForm.hidden = true
    this.elements.answerInput.value = ""

    this.playerController.seekTo(currentItem.start)
    this.playerController.play()
    this.setState(AppState.PLAYING)
    this.renderStatus("Đang phát lại đoạn hiện tại.")
    this.startFrameLoop()
  }

  playCurrentSegment() {
    const currentItem = this.getCurrentItem()
    if (!currentItem) {
      this.finishSession()
      return
    }

    window.clearTimeout(this.pendingAdvanceId)
    this.pendingAdvanceId = null
    this.elements.answerForm.hidden = true
    this.elements.answerInput.value = ""
    this.elements.submitAnswerButton.disabled = false

    this.renderCurrentPrompt()
    this.playerController.seekTo(currentItem.start)
    this.playerController.play()
    this.setState(AppState.PLAYING)
    this.renderStatus(
      `Đang phát đoạn ${this.session.currentIndex + 1}/${this.session.exercise.items.length}.`,
    )
    this.startFrameLoop()
  }

  pauseForInput() {
    this.stopFrameLoop()
    this.playerController.pause()
    this.setState(AppState.WAITING_FOR_INPUT)
    this.elements.answerForm.hidden = false
    this.elements.answerInput.focus()
    this.renderStatus("Video đã dừng. Hãy nhập câu bạn vừa nghe được.")
  }

  advanceToNextStep() {
    const isLastItem = this.session.currentIndex >= this.session.exercise.items.length - 1

    if (isLastItem) {
      this.finishSession()
      return
    }

    this.renderStatus("Chuẩn bị chuyển sang đoạn tiếp theo...")
    this.pendingAdvanceId = window.setTimeout(() => {
      this.session.currentIndex += 1
      this.playCurrentSegment()
    }, 1200)
  }

  finishSession() {
    this.resetPlayback()
    this.setState(AppState.FINISHED)
    this.elements.answerForm.hidden = true
    this.renderSummary()
    this.renderStatus("Hoàn thành buổi luyện tập.")
  }

  startFrameLoop() {
    this.stopFrameLoop()

    const step = () => {
      if (this.state !== AppState.PLAYING) {
        return
      }

      const currentItem = this.getCurrentItem()
      if (!currentItem) {
        this.finishSession()
        return
      }

      const currentTime = this.playerController.getCurrentTime()
      const endTime = currentItem.start + currentItem.duration

      if (currentTime >= endTime - 0.05) {
        this.pauseForInput()
        return
      }

      this.frameRequestId = window.requestAnimationFrame(step)
    }

    this.frameRequestId = window.requestAnimationFrame(step)
  }

  stopFrameLoop() {
    if (this.frameRequestId !== null) {
      window.cancelAnimationFrame(this.frameRequestId)
      this.frameRequestId = null
    }
  }

  resetPlayback() {
    this.stopFrameLoop()
    window.clearTimeout(this.pendingAdvanceId)
    this.pendingAdvanceId = null
    this.playerController.pause()
  }

  getCurrentItem() {
    if (!this.session) {
      return null
    }

    return this.session.exercise.items[this.session.currentIndex] ?? null
  }

  renderExerciseLoaded() {
    this.elements.emptyState.hidden = true
    this.elements.exerciseWorkspace.hidden = false
    this.elements.answerForm.hidden = true
    this.elements.replaySegmentButton.disabled = false
  }

  renderCurrentPrompt() {
    const currentItem = this.getCurrentItem()
    if (!currentItem || !this.session) {
      return
    }

    this.elements.progressText.textContent =
      `Đoạn ${this.session.currentIndex + 1} / ${this.session.exercise.items.length}`
    this.elements.promptText.textContent = currentItem.blanked_text
  }

  renderFeedback({ item, scorePayload, isCorrect }) {
    this.elements.feedbackPanel.hidden = false
    this.elements.feedbackPanel.dataset.variant = isCorrect ? "success" : "warning"
    this.elements.feedbackLabel.textContent = isCorrect ? "Đúng" : "Chưa đúng"
    this.elements.feedbackScore.textContent = `Độ chính xác: ${scorePayload.accuracy}%`
    this.elements.feedbackAnswer.textContent = `Câu gốc: ${item.original_text}`
  }

  hideFeedback() {
    this.elements.feedbackPanel.hidden = true
    this.elements.feedbackPanel.dataset.variant = ""
    this.elements.feedbackLabel.textContent = ""
    this.elements.feedbackScore.textContent = ""
    this.elements.feedbackAnswer.textContent = ""
  }

  renderSummary() {
    if (!this.session) {
      return
    }

    const { results } = this.session
    const total = results.reduce((sum, result) => sum + result.accuracy, 0)
    const average = results.length > 0 ? (total / results.length).toFixed(2) : "0.00"

    this.elements.resultsPanel.hidden = false
    this.elements.averageScore.textContent = `Điểm trung bình: ${average}%`
    this.elements.resultsList.innerHTML = ""

    for (const [index, result] of results.entries()) {
      const item = document.createElement("article")
      item.className = "result-item"

      const title = document.createElement("strong")
      title.textContent = `Đoạn ${index + 1} - ${result.isCorrect ? "Đúng" : "Chưa đúng"}`

      const score = document.createElement("p")
      score.textContent = `Độ chính xác: ${result.accuracy}%`

      const answer = document.createElement("p")
      answer.textContent = `Câu gốc: ${result.originalText}`

      item.append(title, score, answer)
      this.elements.resultsList.append(item)
    }
  }

  hideResults() {
    this.elements.resultsPanel.hidden = true
    this.elements.resultsList.innerHTML = ""
    this.elements.averageScore.textContent = ""
  }

  renderEmptyState() {
    this.elements.emptyState.hidden = false
    this.elements.exerciseWorkspace.hidden = true
    this.elements.answerForm.hidden = true
    this.elements.replaySegmentButton.disabled = true
    this.toggleSessionButtons(false)
  }

  toggleSessionButtons(enabled) {
    this.elements.startSessionButton.disabled = !enabled
    this.elements.replaySegmentButton.disabled = !enabled
  }

  renderStatus(message) {
    this.elements.statusMessage.textContent = message
  }

  setState(nextState) {
    this.state = nextState
    this.elements.stateBadge.textContent = nextState

    if (nextState === AppState.FINISHED) {
      this.elements.startSessionButton.textContent = "Luyện lại từ đầu"
      return
    }

    this.elements.startSessionButton.textContent = "Bắt đầu luyện tập"
  }

  extractYouTubeVideoId(url) {
    try {
      const parsedUrl = new URL(url)

      if (parsedUrl.hostname.includes("youtu.be")) {
        return parsedUrl.pathname.replace("/", "").trim() || null
      }

      if (parsedUrl.hostname.includes("youtube.com")) {
        return parsedUrl.searchParams.get("v")
      }
    } catch (error) {
      return null
    }

    return null
  }

  buildFallbackScore({ originalText, userInput }) {
    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .join(" ")
    }

    const normalizedOriginalText = normalizeText(originalText)
    const normalizedUserInput = normalizeText(userInput)
    const originalTokens = normalizedOriginalText.split(" ").filter(Boolean)
    const userTokens = normalizedUserInput.split(" ").filter(Boolean)
    const totalTokens = Math.max(originalTokens.length, userTokens.length)

    if (totalTokens === 0) {
      return {
        accuracy: 100,
        normalized_original_text: normalizedOriginalText,
        normalized_user_input: normalizedUserInput,
        is_exact_match: true,
      }
    }

    const matchedTokens = originalTokens.reduce((count, token, index) => {
      return count + Number(token === userTokens[index])
    }, 0)
    const accuracy = Number(((matchedTokens / totalTokens) * 100).toFixed(2))

    return {
      accuracy,
      normalized_original_text: normalizedOriginalText,
      normalized_user_input: normalizedUserInput,
      is_exact_match: accuracy === 100,
    }
  }
}

const elements = {
  lessonForm: document.getElementById("lesson-form"),
  videoUrlInput: document.getElementById("video-url"),
  difficultySelect: document.getElementById("difficulty"),
  startSessionButton: document.getElementById("start-session-button"),
  replaySegmentButton: document.getElementById("replay-segment-button"),
  answerForm: document.getElementById("answer-form"),
  answerInput: document.getElementById("answer-input"),
  submitAnswerButton: document.getElementById("submit-answer-button"),
  promptText: document.getElementById("prompt-text"),
  progressText: document.getElementById("progress-text"),
  statusMessage: document.getElementById("status-message"),
  stateBadge: document.getElementById("state-badge"),
  emptyState: document.getElementById("empty-state"),
  exerciseWorkspace: document.getElementById("exercise-workspace"),
  feedbackPanel: document.getElementById("feedback-panel"),
  feedbackLabel: document.getElementById("feedback-label"),
  feedbackScore: document.getElementById("feedback-score"),
  feedbackAnswer: document.getElementById("feedback-answer"),
  resultsPanel: document.getElementById("results-panel"),
  averageScore: document.getElementById("average-score"),
  resultsList: document.getElementById("results-list"),
}

const playerController = new YouTubePlayerController("video-player")
const appController = new AppController({
  playerController,
  elements,
})

appController.initialize().catch((error) => {
  elements.statusMessage.textContent = error.message
})
