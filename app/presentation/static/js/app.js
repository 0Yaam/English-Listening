const AppState = Object.freeze({
  IDLE: "IDLE",
  READY: "READY",
  PLAYING: "PLAYING",
  WAITING_FOR_INPUT: "WAITING_FOR_INPUT",
  CHECKING: "CHECKING",
  FINISHED: "FINISHED",
})

const ACCESS_TOKEN_STORAGE_KEY = "shadowing_access_token"

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
            onError: () => reject(new Error("Could not initialize the YouTube player.")),
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
          script.onerror = () => reject(new Error("Could not load the YouTube IFrame API."))
          document.head.append(script)
        }
      })
    }

    return YouTubePlayerController.apiReadyPromise
  }

  async loadVideo(videoId, startSeconds = 0, autoplay = false) {
    await this.initialize()

    if (autoplay) {
      this.player.loadVideoById({ videoId, startSeconds })
      return
    }

    this.player.cueVideoById({ videoId, startSeconds })
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
    this.currentBlankInputs = []
    this.modeLabelOverride = null
  }

  async initialize() {
    this.bindEvents()
    await this.playerController.initialize()
    this.setState(AppState.IDLE)
    this.renderStatus("Ready when you are.")
    this.renderDifficulty()
    this.renderWorkspaceMode()
    this.renderAccuracy()
  }

  bindEvents() {
    this.elements.lessonForm.addEventListener("submit", (event) => {
      void this.handleLessonSubmit(event)
    })

    this.elements.startSessionButton.addEventListener("click", () => {
      this.startSession()
    })

    this.elements.replaySegmentButton.addEventListener("click", () => {
      this.replayCurrentSegment()
    })

    this.elements.answerForm.addEventListener("submit", (event) => {
      void this.handleAnswerSubmit(event)
    })

    this.elements.nextSegmentButton.addEventListener("click", () => {
      this.advanceToNextStep()
    })

    this.elements.practiceAnotherButton.addEventListener("click", () => {
      this.resetToIdle()
    })

    document.addEventListener("keydown", (event) => {
      this.handleGlobalKeydown(event)
    })
  }

  async handleLessonSubmit(event) {
    event.preventDefault()

    this.resetPlayback()
    this.hideFeedback()
    this.hideResults()
    this.hideSessionSaveStatus()

    const videoUrl = this.elements.videoUrlInput.value.trim()
    const difficulty = Number(this.elements.difficultySelect.value)
    this.elements.videoUrlInput.removeAttribute("aria-invalid")

    if (!videoUrl) {
      this.elements.videoUrlInput.setAttribute("aria-invalid", "true")
      this.renderStatus("Paste a YouTube link to begin.", "error")
      return
    }

    const videoId = this.extractYouTubeVideoId(videoUrl)

    if (!videoId) {
      this.elements.videoUrlInput.setAttribute("aria-invalid", "true")
      this.renderStatus("Please enter a valid YouTube URL.", "error")
      return
    }

    this.elements.generateLessonButton.disabled = true
    this.elements.generateLessonButton.textContent = "Starting..."
    this.setState(AppState.IDLE)
    this.setModeOverride("Loading transcript")
    this.renderStatus("Loading transcript and building the exercise...")
    this.toggleSessionButtons(false)

    try {
      const exercise = await this.fetchBlankExercise(videoId, difficulty)
      if (exercise.items.length === 0) {
        throw new Error("No subtitle segments were available for this exercise.")
      }

      this.session = {
        exercise,
        currentIndex: 0,
        results: [],
        sourceUrl: videoUrl,
        saveState: "idle",
        saveMessage: "",
        saveErrorDetail: "",
        savedSessionId: null,
      }

      this.showWorkspace()
      this.showVideoLoading("Loading video...")
      this.setModeOverride("Loading video")
      this.renderStatus("Loading the video player for this practice session...")
      await this.playerController.loadVideo(videoId, exercise.items[0].start, false)
      this.hideVideoLoading()

      this.renderExerciseLoaded()
      this.renderCurrentPrompt()
      this.toggleSessionButtons(true)
      this.setState(AppState.READY)
      this.renderStatus(
        `Exercise ready. ${exercise.items.length} segments loaded. Press "Start practice" to begin.`,
        "success",
      )
    } catch (error) {
      this.hideVideoLoading()
      this.renderStatus(
        error instanceof Error ? error.message : "Could not create the exercise.",
        "error",
      )
      this.session = null
      this.renderEmptyState()
    } finally {
      this.elements.generateLessonButton.disabled = false
      this.elements.generateLessonButton.textContent = "Start practice"
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

    const firstEmptyBlankIndex = this.getFirstEmptyBlankIndex()
    if (firstEmptyBlankIndex !== null) {
      this.renderStatus("Fill every blank before checking this sentence.", "warning")
      this.focusBlankByIndex(firstEmptyBlankIndex, "end")
      return
    }

    const userInput = this.buildUserSentenceFromInlineInputs()
    this.setState(AppState.CHECKING)
    this.disableInlineInputs(true)
    this.elements.submitAnswerButton.disabled = true
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true
    this.renderStatus("Scoring your answer...")

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

      this.renderAccuracy()
      this.renderFeedback({
        item: currentItem,
        scorePayload,
        isCorrect,
      })
      this.elements.nextSegmentButton.hidden = false
      this.elements.nextSegmentButton.disabled = false

      if (isCorrect) {
        this.setState(AppState.WAITING_FOR_INPUT)
        this.setModeOverride("Correct")
        this.disableInlineInputs(true)
        this.elements.submitAnswerButton.disabled = true
        this.elements.submitAnswerButton.textContent = "Correct"
        this.renderStatus("Correct. Move to the next segment when you are ready.", "success")
      } else {
        this.setState(AppState.WAITING_FOR_INPUT)
        this.setModeOverride("Needs review")
        this.disableInlineInputs(false)
        this.elements.submitAnswerButton.disabled = false
        this.elements.submitAnswerButton.textContent = "Check again"
        this.renderStatus(
          "Needs review. Edit the highlighted blanks or move to the next segment.",
          "warning",
        )
        this.focusFirstIncorrectBlank()
      }
    } catch (error) {
      this.setState(AppState.WAITING_FOR_INPUT)
      this.disableInlineInputs(false)
      this.elements.submitAnswerButton.disabled = false
      this.renderStatus(error instanceof Error ? error.message : "Could not score this answer.")
    }
  }

  async fetchBlankExercise(videoId, difficulty) {
    const response = await fetch(
      `${this.apiBaseUrl}/lessons/${encodeURIComponent(videoId)}/blank-exercise?difficulty=${encodeURIComponent(difficulty)}`,
    )
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.message || "Could not create a blank exercise.")
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
      return this.buildFallbackScore({ originalText, userInput })
    }

    const payload = await response.json()
    if (!response.ok) {
      throw new Error(payload.message || "Could not score this answer.")
    }

    return payload
  }

  startSession() {
    if (!this.session) {
      this.renderStatus("Create an exercise first.")
      return
    }

    if (this.state === AppState.PLAYING) {
      return
    }

    if (this.state === AppState.WAITING_FOR_INPUT) {
      this.renderStatus("Finish the current sentence before continuing.")
      return
    }

    if (this.state === AppState.FINISHED) {
      this.session.currentIndex = 0
      this.session.results = []
      this.session.saveState = "idle"
      this.session.saveMessage = ""
      this.session.saveErrorDetail = ""
      this.session.savedSessionId = null
      this.hideResults()
      this.hideSessionSaveStatus()
      this.renderAccuracy()
    }

    this.hideFeedback()
    this.playCurrentSegment()
  }

  replayCurrentSegment() {
    const currentItem = this.getCurrentItem()
    if (!currentItem || !this.session) {
      return
    }

    window.clearTimeout(this.pendingAdvanceId)
    this.pendingAdvanceId = null
    this.hideFeedback()
    this.resetInlineInputs()
    this.clearBlankResults()
    this.disableInlineInputs(true)
    this.elements.submitAnswerButton.disabled = true
    this.elements.submitAnswerButton.textContent = "Check answer"
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true

    this.playerController.seekTo(currentItem.start)
    this.playerController.play()
    this.setState(AppState.PLAYING)
    this.renderStatus("Replaying the current segment.")
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
    this.hideFeedback()
    this.renderCurrentPrompt()
    this.resetInlineInputs()
    this.clearBlankResults()
    this.disableInlineInputs(true)
    this.elements.submitAnswerButton.disabled = true
    this.elements.submitAnswerButton.textContent = "Check answer"
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true

    this.playerController.seekTo(currentItem.start)
    this.playerController.play()
    this.setState(AppState.PLAYING)
    this.renderStatus(
      `Playing segment ${this.session.currentIndex + 1}/${this.session.exercise.items.length}.`,
    )
    this.startFrameLoop()
  }

  pauseForInput() {
    this.stopFrameLoop()
    this.playerController.pause()
    this.setState(AppState.WAITING_FOR_INPUT)
    this.disableInlineInputs(false)
    this.elements.submitAnswerButton.disabled = false
    this.elements.submitAnswerButton.textContent = "Check answer"
    this.focusFirstInlineInput()
    this.renderStatus("The video is paused. Fill the missing words and submit the sentence.")
  }

  advanceToNextStep() {
    if (!this.session) {
      return
    }

    const isLastItem = this.session.currentIndex >= this.session.exercise.items.length - 1
    if (isLastItem) {
      this.finishSession()
      return
    }

    this.renderStatus("Preparing the next segment...")
    this.session.currentIndex += 1
    this.playCurrentSegment()
  }

  finishSession() {
    this.resetPlayback()
    this.setState(AppState.FINISHED)
    this.disableInlineInputs(true)
    this.elements.submitAnswerButton.disabled = true
    this.elements.submitAnswerButton.textContent = "Check answer"
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true
    this.renderSummary()
    this.renderStatus(
      "Practice session completed. Review your results or start another video.",
      "success",
    )
    void this.handleCompletedSessionPersistence()
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

  showWorkspace() {
    this.elements.entryStage.hidden = true
    this.elements.workspaceStage.hidden = false
    this.elements.topbarSessionLabel.hidden = false
  }

  renderExerciseLoaded() {
    this.elements.emptyState.hidden = true
    this.elements.exerciseWorkspace.hidden = false
    this.elements.answerForm.hidden = false
    this.elements.replaySegmentButton.disabled = false
    this.elements.submitAnswerButton.textContent = "Check answer"
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true
    this.renderWorkspaceMode()
  }

  renderCurrentPrompt() {
    const currentItem = this.getCurrentItem()
    if (!currentItem || !this.session) {
      return
    }

    const progressLabel = `Segment ${this.session.currentIndex + 1} / ${this.session.exercise.items.length}`
    this.elements.progressText.textContent = progressLabel
    this.elements.railProgressText.textContent = progressLabel
    this.elements.promptLabel.textContent = `Current sentence | ${progressLabel}`

    this.currentBlankInputs = []
    this.elements.promptText.innerHTML = ""

    const placeholderPattern = /_{4,}/g
    let lastIndex = 0
    let answerIndex = 0
    let match

    while ((match = placeholderPattern.exec(currentItem.blanked_text)) !== null) {
      const leadingText = currentItem.blanked_text.slice(lastIndex, match.index)
      if (leadingText) {
        this.elements.promptText.append(document.createTextNode(leadingText))
      }

      const blankWrapper = document.createElement("span")
      blankWrapper.className = "inline-blank"

      const input = document.createElement("input")
      input.type = "text"
      input.className = "inline-blank-input"
      input.autocomplete = "off"
      input.spellcheck = false
      input.dataset.answerIndex = String(answerIndex)

      const answerLength = currentItem.answers?.[answerIndex]?.length ?? match[0].length
      input.size = Math.max(4, Math.min(answerLength + 1, 14))
      input.dataset.baseLength = String(Math.max(6, Math.min(answerLength + 1, 14)))
      input.placeholder = "..."
      input.disabled = this.state !== AppState.WAITING_FOR_INPUT
      input.setAttribute("aria-label", `Blank ${answerIndex + 1}`)
      this.attachBlankInputHandlers(input, answerIndex)
      this.resizeBlankInput(input)

      blankWrapper.append(input)
      this.elements.promptText.append(blankWrapper)
      this.currentBlankInputs.push(input)

      answerIndex += 1
      lastIndex = placeholderPattern.lastIndex
    }

    const trailingText = currentItem.blanked_text.slice(lastIndex)
    if (trailingText) {
      this.elements.promptText.append(document.createTextNode(trailingText))
    }

    if (this.currentBlankInputs.length === 0) {
      const fallbackInput = document.createElement("input")
      fallbackInput.type = "text"
      fallbackInput.className = "inline-blank-input"
      fallbackInput.placeholder = "Type what you heard"
      fallbackInput.size = 24
      fallbackInput.dataset.baseLength = "12"
      fallbackInput.disabled = this.state !== AppState.WAITING_FOR_INPUT
      fallbackInput.setAttribute("aria-label", "Answer input")
      this.attachBlankInputHandlers(fallbackInput, 0)
      this.resizeBlankInput(fallbackInput)
      this.currentBlankInputs.push(fallbackInput)
      this.elements.promptText.append(document.createTextNode(" "))
      this.elements.promptText.append(fallbackInput)
    }
  }

  renderFeedback({ item }) {
    const blankResults = this.evaluateBlankInputs(item)
    this.applyBlankResults(blankResults)
    this.elements.feedbackPanel.hidden = true
    this.elements.feedbackPanel.dataset.variant = ""
    this.elements.feedbackLabel.textContent = ""
    this.elements.feedbackScore.textContent = ""
    this.elements.feedbackAnswer.textContent = ""
  }

  hideFeedback() {
    this.elements.feedbackPanel.hidden = true
    this.elements.feedbackPanel.dataset.variant = ""
    this.elements.feedbackLabel.textContent = ""
    this.elements.feedbackScore.textContent = ""
    this.elements.feedbackAnswer.textContent = ""
    this.elements.feedbackPanel.querySelector(".feedback-correction-list")?.remove()
  }

  renderSummary() {
    if (!this.session) {
      return
    }

    const average = this.computeAverageAccuracy()
    const totalSegments = this.session.exercise.items.length
    const correctCount = this.session.results.filter((result) => result.isCorrect).length
    const reviewCount = Math.max(totalSegments - correctCount, 0)
    this.elements.resultsPanel.hidden = false
    this.elements.totalSegmentsStat.textContent = String(totalSegments)
    this.elements.averageScore.textContent = average === null ? "--" : `${average}%`
    this.elements.correctCountStat.textContent = String(correctCount)
    this.elements.reviewCountStat.textContent = String(reviewCount)
    this.elements.resultsList.innerHTML = ""
    this.renderSessionSaveStatus()

    for (const [index, result] of this.session.results.entries()) {
      const item = document.createElement("article")
      item.className = "result-item"

      const title = document.createElement("strong")
      title.textContent = `Segment ${index + 1} - ${result.isCorrect ? "Correct" : "Needs review"}`

      const score = document.createElement("p")
      score.className = "result-copy"
      score.textContent = `Accuracy: ${result.accuracy}%`

      const answer = document.createElement("p")
      answer.className = "result-copy"
      answer.textContent = `Original sentence: ${result.originalText}`

      item.append(title, score, answer)
      this.elements.resultsList.append(item)
    }
  }

  hideResults() {
    this.elements.resultsPanel.hidden = true
    this.elements.totalSegmentsStat.textContent = "0"
    this.elements.averageScore.textContent = "--"
    this.elements.correctCountStat.textContent = "0"
    this.elements.reviewCountStat.textContent = "0"
    this.elements.resultsList.innerHTML = ""
    this.hideSessionSaveStatus()
  }

  resetToIdle() {
    this.resetPlayback()
    this.hideFeedback()
    this.hideResults()
    this.hideSessionSaveStatus()
    this.hideVideoLoading()
    this.currentBlankInputs = []
    this.session = null
    this.renderEmptyState()
    this.elements.videoUrlInput.value = ""
    this.elements.videoUrlInput.removeAttribute("aria-invalid")
    this.setState(AppState.IDLE)
    this.renderStatus("Ready when you are.")
    this.renderAccuracy()
    this.elements.videoUrlInput.focus()
  }

  renderEmptyState() {
    this.elements.emptyState.hidden = false
    this.elements.exerciseWorkspace.hidden = true
    this.elements.answerForm.hidden = true
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true
    this.elements.replaySegmentButton.disabled = true
    this.elements.workspaceStage.hidden = true
    this.elements.entryStage.hidden = false
    this.elements.topbarSessionLabel.hidden = true
    this.toggleSessionButtons(false)
  }

  toggleSessionButtons(enabled) {
    this.elements.startSessionButton.disabled = !enabled
    this.elements.replaySegmentButton.disabled = !enabled
  }

  renderStatus(message, variant = "default") {
    this.elements.statusMessage.textContent = message
    this.elements.workspaceStatusMessage.textContent = message

    if (variant === "default") {
      this.elements.statusMessage.removeAttribute("data-variant")
      this.elements.workspaceStatusMessage.removeAttribute("data-variant")
      return
    }

    this.elements.statusMessage.setAttribute("data-variant", variant)
    this.elements.workspaceStatusMessage.setAttribute("data-variant", variant)
  }

  showVideoLoading(message = "Loading video...") {
    this.elements.videoLoadingIndicator.hidden = false
    this.elements.videoLoadingIndicator.textContent = message
  }

  hideVideoLoading() {
    this.elements.videoLoadingIndicator.hidden = true
  }

  setModeOverride(label) {
    this.modeLabelOverride = label
    this.renderWorkspaceMode()
  }

  renderAccuracy() {
    const latestResult = this.session?.results.at(-1) ?? null
    const currentScore = latestResult ? `${latestResult.accuracy}%` : "--"
    this.elements.workspaceAccuracy.textContent = currentScore
    this.elements.railWorkspaceAccuracy.textContent = currentScore
  }

  renderDifficulty() {
    const selectedOption = this.elements.difficultySelect.selectedOptions[0]
    const label = selectedOption?.textContent?.replace(/^\d+\s*-\s*/, "").trim() || "Standard"
    this.elements.workspaceDifficulty.textContent = label
  }

  renderWorkspaceMode() {
    const labelMap = {
      [AppState.IDLE]: "Waiting",
      [AppState.READY]: "Ready",
      [AppState.PLAYING]: "Listening",
      [AppState.WAITING_FOR_INPUT]: "Type the missing words",
      [AppState.CHECKING]: "Checking",
      [AppState.FINISHED]: "Finished",
    }
    const modeLabel = this.modeLabelOverride ?? labelMap[this.state] ?? this.state
    this.elements.workspaceMode.textContent = modeLabel
    this.elements.railWorkspaceMode.textContent = modeLabel
    this.elements.workspaceStateBadge.textContent = modeLabel

    let badgeVariant = "idle"
    if (modeLabel === "Correct") {
      badgeVariant = "success"
    } else if (modeLabel === "Needs review") {
      badgeVariant = "review"
    } else if (
      modeLabel === "Loading transcript" ||
      modeLabel === "Loading video" ||
      this.state === AppState.CHECKING
    ) {
      badgeVariant = "loading"
    } else if (this.state === AppState.PLAYING) {
      badgeVariant = "listening"
    } else if (this.state === AppState.WAITING_FOR_INPUT) {
      badgeVariant = "input"
    } else if (this.state === AppState.FINISHED) {
      badgeVariant = "success"
    } else if (this.state === AppState.READY) {
      badgeVariant = "ready"
    }

    this.elements.workspaceStateBadge.dataset.variant = badgeVariant
  }

  setState(nextState) {
    this.state = nextState
    this.modeLabelOverride = null
    this.elements.stateBadge.textContent = nextState
    this.renderWorkspaceMode()

    if (nextState === AppState.FINISHED) {
      this.elements.startSessionButton.textContent = "Practice again"
      this.elements.startSessionButton.disabled = false
      return
    }

    if (nextState === AppState.READY) {
      this.elements.startSessionButton.textContent = "Start practice"
      this.elements.startSessionButton.disabled = false
      return
    }

    if (nextState === AppState.PLAYING) {
      this.elements.startSessionButton.textContent = "Listening..."
      this.elements.startSessionButton.disabled = true
      return
    }

    if (nextState === AppState.WAITING_FOR_INPUT) {
      this.elements.startSessionButton.textContent = "Waiting for input"
      this.elements.startSessionButton.disabled = true
      return
    }

    if (nextState === AppState.CHECKING) {
      this.elements.startSessionButton.textContent = "Checking..."
      this.elements.startSessionButton.disabled = true
      return
    }

    this.elements.startSessionButton.textContent = "Start practice"
    this.elements.startSessionButton.disabled = !this.session
  }

  handleGlobalKeydown(event) {
    const isTypingInBlank = this.currentBlankInputs.includes(document.activeElement)

    if (event.key.toLowerCase() === "r" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (this.session && this.state !== AppState.IDLE) {
        event.preventDefault()
        this.replayCurrentSegment()
      }
      return
    }

    if (event.code === "Space" && !isTypingInBlank) {
      if (this.session && this.state === AppState.WAITING_FOR_INPUT) {
        event.preventDefault()
        this.replayCurrentSegment()
        return
      }

      if (this.session && (this.state === AppState.READY || this.state === AppState.FINISHED)) {
        event.preventDefault()
        this.startSession()
      }
    }
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

  buildUserSentenceFromInlineInputs() {
    const currentItem = this.getCurrentItem()
    if (!currentItem) {
      return ""
    }

    const placeholderPattern = /_{4,}/g
    let lastIndex = 0
    let answerIndex = 0
    let builtSentence = ""
    let match

    while ((match = placeholderPattern.exec(currentItem.blanked_text)) !== null) {
      builtSentence += currentItem.blanked_text.slice(lastIndex, match.index)
      builtSentence += this.currentBlankInputs[answerIndex]?.value?.trim() ?? ""
      answerIndex += 1
      lastIndex = placeholderPattern.lastIndex
    }

    builtSentence += currentItem.blanked_text.slice(lastIndex)
    return builtSentence.replace(/\s+/g, " ").trim()
  }

  resetInlineInputs() {
    for (const input of this.currentBlankInputs) {
      input.value = ""
      this.resizeBlankInput(input)
    }
  }

  disableInlineInputs(disabled) {
    for (const input of this.currentBlankInputs) {
      input.disabled = disabled
    }
  }

  focusFirstInlineInput() {
    const firstInput = this.currentBlankInputs[0]
    if (firstInput) {
      firstInput.focus()
    }
  }

  focusFirstIncorrectBlank() {
    const firstIncorrectInput = this.currentBlankInputs.find(
      (input) => input.dataset.result === "incorrect",
    )
    if (firstIncorrectInput) {
      firstIncorrectInput.focus()
      return
    }

    this.focusFirstInlineInput()
  }

  getFirstEmptyBlankIndex() {
    const index = this.currentBlankInputs.findIndex((input) => input.value.trim().length === 0)
    return index === -1 ? null : index
  }

  attachBlankInputHandlers(input, blankIndex) {
    input.addEventListener("input", () => {
      this.resizeBlankInput(input)
      input.dataset.result = ""
      input.removeAttribute("aria-invalid")
    })

    input.addEventListener("keydown", (event) => {
      const selectionStart = input.selectionStart ?? 0
      const selectionEnd = input.selectionEnd ?? 0
      const isCollapsed = selectionStart === selectionEnd
      const valueLength = input.value.length

      if (event.key === "Enter") {
        event.preventDefault()
        if (!this.elements.submitAnswerButton.disabled) {
          this.elements.answerForm.requestSubmit()
        }
        return
      }

      if (event.key === " ") {
        event.preventDefault()
        this.replayCurrentSegment()
        return
      }

      if (event.key === "ArrowRight" && isCollapsed && selectionStart === valueLength) {
        if (this.focusBlankByIndex(blankIndex + 1, "start")) {
          event.preventDefault()
        }
        return
      }

      if (event.key === "ArrowLeft" && isCollapsed && selectionStart === 0) {
        if (this.focusBlankByIndex(blankIndex - 1, "end")) {
          event.preventDefault()
        }
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        input.blur()
      }
    })
  }

  focusBlankByIndex(index, caretPosition = "start") {
    const target = this.currentBlankInputs[index]
    if (!target) {
      return false
    }

    target.focus()
    const caretIndex = caretPosition === "end" ? target.value.length : 0
    window.requestAnimationFrame(() => {
      try {
        target.setSelectionRange(caretIndex, caretIndex)
      } catch (error) {
        return
      }
    })
    return true
  }

  resizeBlankInput(input) {
    const baseLength = Number(input.dataset.baseLength || input.size || 8)
    const contentLength = Math.max(input.value.trim().length, baseLength, 6)
    input.style.width = `${Math.min(contentLength + 1, 18)}ch`
  }

  normalizeBlankValue(value) {
    return value.toLowerCase().trim().replace(/[^\p{L}\p{N}'-]+/gu, " ")
  }

  evaluateBlankInputs(item) {
    const answers = item.answers ?? []
    return this.currentBlankInputs.map((input, index) => {
      const expected = answers[index] ?? ""
      const actual = input.value.trim()
      return {
        expected,
        actual,
        isCorrect:
          expected.length === 0
            ? null
            : this.normalizeBlankValue(actual) === this.normalizeBlankValue(expected),
      }
    })
  }

  applyBlankResults(blankResults) {
    blankResults.forEach((result, index) => {
      const input = this.currentBlankInputs[index]
      if (!input) {
        return
      }

      if (result.isCorrect === null) {
        input.dataset.result = ""
        input.removeAttribute("aria-invalid")
        return
      }

      input.dataset.result = result.isCorrect ? "correct" : "incorrect"
      input.setAttribute("aria-invalid", String(!result.isCorrect))
    })
  }

  clearBlankResults() {
    this.currentBlankInputs.forEach((input) => {
      input.dataset.result = ""
      input.removeAttribute("aria-invalid")
    })
  }

  escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;")
  }

  getAuthToken() {
    try {
      return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
    } catch (error) {
      return null
    }
  }

  clearAuthToken() {
    try {
      window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    } catch (error) {
      return
    }
  }

  async handleCompletedSessionPersistence() {
    if (!this.session || this.state !== AppState.FINISHED) {
      return
    }

    const authToken = this.getAuthToken()
    if (!authToken) {
      this.session.saveState = "signed-out"
      this.session.saveMessage = "Sign in to save your history."
      this.renderSessionSaveStatus()
      return
    }

    await this.saveCompletedSession({ authToken })
  }

  async saveCompletedSession({ authToken, force = false } = {}) {
    if (!this.session || this.state !== AppState.FINISHED) {
      return
    }

    if (!force && (this.session.saveState === "saving" || this.session.saveState === "saved")) {
      return
    }

    const token = authToken || this.getAuthToken()
    if (!token) {
      this.session.saveState = "signed-out"
      this.session.saveMessage = "Sign in to save your history."
      this.renderSessionSaveStatus()
      return
    }

    this.session.saveState = "saving"
    this.session.saveMessage = "Saving this session to your profile..."
    this.session.saveErrorDetail = ""
    this.renderSessionSaveStatus()

    let response
    try {
      response = await fetch(`${this.apiBaseUrl}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(this.buildCompletedSessionPayload()),
      })
    } catch (error) {
      this.session.saveState = "error"
      this.session.saveMessage = "Could not save this session right now."
      this.session.saveErrorDetail = error instanceof Error ? error.message : ""
      this.renderSessionSaveStatus()
      return
    }

    let payload = null
    try {
      payload = await response.json()
    } catch (error) {
      payload = null
    }

    if (response.status === 401) {
      this.clearAuthToken()
      this.session.saveState = "signed-out"
      this.session.saveMessage = "Your session has expired. Sign in to save your history."
      this.renderSessionSaveStatus()
      return
    }

    if (!response.ok) {
      this.session.saveState = "error"
      this.session.saveMessage = "Could not save this session right now."
      this.session.saveErrorDetail = this.extractApiErrorMessage(payload)
      this.renderSessionSaveStatus()
      return
    }

    this.session.saveState = "saved"
    this.session.saveMessage = "Saved to profile."
    this.session.savedSessionId = payload?.session_id ?? null
    this.renderSessionSaveStatus()
  }

  buildCompletedSessionPayload() {
    const exercise = this.session.exercise

    return {
      video_id: exercise.video_id,
      video_title: exercise.video_title ?? null,
      source_url: this.session.sourceUrl ?? null,
      accuracy_score: this.computeAverageAccuracy(),
      completed_at: new Date().toISOString(),
      transcript: {
        raw_text: this.buildRawTranscript(),
        language: exercise.language ?? null,
        language_code: exercise.language_code ?? null,
      },
    }
  }

  buildRawTranscript() {
    if (!this.session?.exercise?.items) {
      return ""
    }

    return [...this.session.exercise.items]
      .sort((left, right) => left.segment_index - right.segment_index)
      .map((item) => item.original_text?.trim() ?? "")
      .filter(Boolean)
      .join(" ")
  }

  computeAverageAccuracy() {
    const results = this.session?.results ?? []
    if (results.length === 0) {
      return null
    }

    const total = results.reduce((sum, result) => sum + Number(result.accuracy || 0), 0)
    return Number((total / results.length).toFixed(2))
  }

  extractApiErrorMessage(payload) {
    if (payload && typeof payload.message === "string" && payload.message.trim()) {
      return payload.message.trim()
    }
    if (payload && typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail.trim()
    }
    return "Unknown error."
  }

  renderSessionSaveStatus() {
    if (!this.session || this.state !== AppState.FINISHED) {
      this.hideSessionSaveStatus()
      return
    }

    const status = this.session.saveState
    if (!status || status === "idle") {
      this.hideSessionSaveStatus()
      return
    }

    const container = this.elements.sessionSaveStatus
    container.hidden = false
    container.dataset.variant =
      status === "saved" ? "success" : status === "error" ? "error" : "warning"

    if (status === "saved" || status === "saving") {
      container.innerHTML = `<p>${this.session.saveMessage}</p>`
      return
    }

    if (status === "signed-out") {
      container.innerHTML = `
        <p>${this.session.saveMessage}</p>
        <div class="session-save-actions">
          <a class="inline-link" href="/login">Sign in</a>
          <a class="inline-link" href="/register">Create an account</a>
        </div>
      `
      return
    }

    container.innerHTML = `
      <p>${this.session.saveMessage}</p>
      <div class="session-save-actions">
        <button id="retry-save-session-button" type="button" class="button-ghost">
          Retry save
        </button>
        ${
          this.session.saveErrorDetail
            ? `<span class="status-message">${this.session.saveErrorDetail}</span>`
            : ""
        }
      </div>
    `

    const retryButton = document.getElementById("retry-save-session-button")
    if (retryButton) {
      retryButton.addEventListener("click", () => {
        void this.saveCompletedSession({ force: true })
      })
    }
  }

  hideSessionSaveStatus() {
    this.elements.sessionSaveStatus.hidden = true
    this.elements.sessionSaveStatus.dataset.variant = ""
    this.elements.sessionSaveStatus.innerHTML = ""
  }
}

const elements = {
  topbarSessionLabel: document.getElementById("topbar-session-label"),
  entryStage: document.getElementById("entry-stage"),
  workspaceStage: document.getElementById("workspace-stage"),
  lessonForm: document.getElementById("lesson-form"),
  generateLessonButton: document.getElementById("generate-lesson-button"),
  videoUrlInput: document.getElementById("video-url"),
  difficultySelect: document.getElementById("difficulty"),
  startSessionButton: document.getElementById("start-session-button"),
  workspaceStateBadge: document.getElementById("workspace-state-badge"),
  replaySegmentButton: document.getElementById("replay-segment-button"),
  answerForm: document.getElementById("answer-form"),
  submitAnswerButton: document.getElementById("submit-answer-button"),
  nextSegmentButton: document.getElementById("next-segment-button"),
  promptLabel: document.getElementById("prompt-label"),
  promptText: document.getElementById("prompt-text"),
  progressText: document.getElementById("progress-text"),
  railProgressText: document.getElementById("rail-progress-text"),
  statusMessage: document.getElementById("status-message"),
  workspaceStatusMessage: document.getElementById("workspace-status-message"),
  stateBadge: document.getElementById("state-badge"),
  workspaceAccuracy: document.getElementById("workspace-accuracy"),
  railWorkspaceAccuracy: document.getElementById("rail-workspace-accuracy"),
  workspaceMode: document.getElementById("workspace-mode"),
  railWorkspaceMode: document.getElementById("rail-workspace-mode"),
  workspaceDifficulty: document.getElementById("workspace-difficulty"),
  videoLoadingIndicator: document.getElementById("video-loading-indicator"),
  emptyState: document.getElementById("empty-state"),
  exerciseWorkspace: document.getElementById("exercise-workspace"),
  feedbackPanel: document.getElementById("feedback-panel"),
  feedbackLabel: document.getElementById("feedback-label"),
  feedbackScore: document.getElementById("feedback-score"),
  feedbackAnswer: document.getElementById("feedback-answer"),
  resultsPanel: document.getElementById("results-panel"),
  totalSegmentsStat: document.getElementById("total-segments-stat"),
  averageScore: document.getElementById("average-score"),
  correctCountStat: document.getElementById("correct-count-stat"),
  reviewCountStat: document.getElementById("review-count-stat"),
  resultsList: document.getElementById("results-list"),
  practiceAnotherButton: document.getElementById("practice-another-button"),
  sessionSaveStatus: document.getElementById("session-save-status"),
}

const playerController = new YouTubePlayerController("video-player")
const appController = new AppController({
  playerController,
  elements,
})

appController.initialize().catch((error) => {
  elements.statusMessage.textContent = error instanceof Error ? error.message : "Unexpected error."
})
