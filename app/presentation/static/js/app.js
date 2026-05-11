const AppState = Object.freeze({
  IDLE: "IDLE",
  READY: "READY",
  PLAYING: "PLAYING",
  WAITING_FOR_INPUT: "WAITING_FOR_INPUT",
  CHECKING: "CHECKING",
  FINISHED: "FINISHED",
})

const ACCESS_TOKEN_STORAGE_KEY = "shadowing_access_token"
const LANGUAGE_STORAGE_KEY = "dashboard_language"

const TEXT = {
  en: {
    "topbar.session": "Practice session",
    "topbar.dashboard": "Dashboard",
    "topbar.dashboardAria": "Open dashboard",
    "entry.title": "Start practice",
    "entry.copy": "Paste a YouTube link to start a focused shadowing session.",
    "entry.videoLabel": "Paste a YouTube link",
    "entry.start": "Start practice",
    "entry.ready": "Ready when you are.",
    "entry.helper": "Press Enter to start. Shortcuts appear after the workspace loads.",
    "workspace.title": "Shadowing practice workspace",
    "workspace.source": "Listening Source",
    "workspace.ready": "Ready",
    "workspace.loadingVideo": "Loading video...",
    "workspace.exercise": "Fill exercise",
    "workspace.empty": "No exercise loaded yet. Paste a YouTube link and start a session to begin.",
    "workspace.prompt": "Current sentence",
    "workspace.shortcut": "Ctrl starts or replays the current segment. Enter checks your answer.",
    "action.checkAnswer": "Check answer",
    "action.nextSegment": "Next segment",
    "action.practiceAnother": "Practice another video",
    "results.summary": "Summary",
    "results.title": "Session Review",
    "results.totalSegments": "Total segments",
    "results.averageAccuracy": "Average accuracy",
    "results.correct": "Correct",
    "results.needsReview": "Needs review",
    "status.pasteLink": "Paste a YouTube link to begin.",
    "status.invalidUrl": "Please enter a valid YouTube URL.",
    "status.starting": "Starting...",
    "status.loadingTranscript": "Loading transcript and building the exercise...",
    "status.loadingTranscriptMode": "Loading transcript",
    "status.loadingVideoMode": "Loading video",
    "status.loadingPlayer": "Loading the video player for this practice session...",
    "status.exerciseReady": "Exercise ready. {count} segments loaded. Press \"Start practice\" to begin.",
    "status.createError": "Could not create the exercise.",
    "status.fillBlank": "Fill every blank before checking this sentence.",
    "status.scoring": "Scoring your answer...",
    "status.correctNext": "Correct. Press Ctrl for the next segment.",
    "status.review": "Needs review. Green blanks are correct, red blanks need fixing. Press Ctrl to replay.",
    "status.playing": "Playing segment {current}/{total}.",
    "status.paused": "The video is paused. Fill the missing words and submit the sentence.",
    "status.preparing": "Preparing the next segment...",
    "status.createFirst": "Create an exercise first.",
    "status.finishCurrent": "Finish the current sentence before continuing.",
    "status.replaying": "Replaying the current segment.",
    "status.completed": "Practice session completed. Review your results or start another video.",
    "button.practiceAgain": "Practice again",
    "button.listening": "Listening...",
    "button.waiting": "Waiting for input",
    "button.checking": "Checking...",
    "button.checkAgain": "Check again",
    "mode.waiting": "Waiting",
    "mode.ready": "Ready",
    "mode.listening": "Listening",
    "mode.input": "Type the missing words",
    "mode.checking": "Checking",
    "mode.finished": "Finished",
    "mode.correct": "Correct",
    "mode.review": "Needs review",
    "progress.segment": "Segment {current} / {total}",
    "prompt.current": "Current sentence",
    "blank.label": "Blank {index}",
    "blank.answer": "Answer input",
    "blank.placeholder": "Type what you heard",
    "assist.title": "Context Assist",
    "assist.meaning": "Meaning",
    "assist.pronunciation": "Pronunciation",
    "assist.partOfSpeech": "Type",
    "assist.chunks": "Chunks",
    "assist.example": "Example sentence",
    "assist.save": "Save",
    "assist.saved": "Saved",
    "assist.queued": "Queued",
    "assist.listen": "Listen",
    "assist.signIn": "Sign in to save vocabulary.",
    "assist.savedAfterSession": "Will save after this session is saved.",
    "assist.savedNow": "Saved to Vocabulary.",
    "assist.saveFailed": "Could not save this word.",
    "assist.phraseType": "chunk / phrase",
    "assist.close": "Close context assist",
    "assist.loading": "Preparing a contextual explanation...",
    "assist.aiSource": "Context from OpenRouter",
    "assist.offlineSource": "Local guide",
    "assist.listenUnavailable": "Browser speech is not available.",
    "assist.secondaryMeaning": "Vietnamese",
  },
  vi: {
    "topbar.session": "Buổi luyện tập",
    "topbar.dashboard": "Dashboard",
    "topbar.dashboardAria": "Mở dashboard",
    "entry.title": "Bắt đầu luyện tập",
    "entry.copy": "Dán link YouTube để bắt đầu một buổi shadowing tập trung.",
    "entry.videoLabel": "Dán link YouTube",
    "entry.start": "Bắt đầu",
    "entry.ready": "Sẵn sàng khi bạn sẵn sàng.",
    "entry.helper": "Nhấn Enter để bắt đầu. Phím tắt sẽ xuất hiện sau khi workspace tải xong.",
    "workspace.title": "Không gian luyện shadowing",
    "workspace.source": "Nguồn nghe",
    "workspace.ready": "Sẵn sàng",
    "workspace.loadingVideo": "Đang tải video...",
    "workspace.exercise": "Bài điền từ",
    "workspace.empty": "Chưa có bài tập. Dán link YouTube rồi bắt đầu một buổi học.",
    "workspace.prompt": "Câu hiện tại",
    "workspace.shortcut": "Ctrl bắt đầu hoặc phát lại đoạn hiện tại. Enter kiểm tra câu trả lời.",
    "action.checkAnswer": "Kiểm tra",
    "action.nextSegment": "Câu tiếp theo",
    "action.practiceAnother": "Luyện video khác",
    "results.summary": "Tổng kết",
    "results.title": "Xem lại buổi học",
    "results.totalSegments": "Tổng đoạn",
    "results.averageAccuracy": "Độ chính xác TB",
    "results.correct": "Đúng",
    "results.needsReview": "Cần xem lại",
    "status.pasteLink": "Dán link YouTube để bắt đầu.",
    "status.invalidUrl": "Vui lòng nhập đúng URL YouTube.",
    "status.starting": "Đang bắt đầu...",
    "status.loadingTranscript": "Đang tải transcript và tạo bài tập...",
    "status.loadingTranscriptMode": "Đang tải transcript",
    "status.loadingVideoMode": "Đang tải video",
    "status.loadingPlayer": "Đang tải trình phát video cho buổi luyện tập này...",
    "status.exerciseReady": "Bài tập đã sẵn sàng. Đã tải {count} đoạn. Nhấn \"Bắt đầu\" để học.",
    "status.createError": "Không tạo được bài tập.",
    "status.fillBlank": "Hãy điền hết các ô trống trước khi kiểm tra câu này.",
    "status.scoring": "Đang chấm câu trả lời...",
    "status.correctNext": "Đúng rồi. Nhấn Ctrl để sang câu tiếp theo.",
    "status.review": "Cần xem lại. Ô xanh là đúng, ô đỏ cần sửa. Nhấn Ctrl để nghe lại.",
    "status.playing": "Đang phát đoạn {current}/{total}.",
    "status.paused": "Video đã tạm dừng. Điền các từ bị thiếu rồi nộp câu trả lời.",
    "status.preparing": "Đang chuẩn bị đoạn tiếp theo...",
    "status.createFirst": "Hãy tạo bài tập trước.",
    "status.finishCurrent": "Hoàn thành câu hiện tại trước khi tiếp tục.",
    "status.replaying": "Đang phát lại đoạn hiện tại.",
    "status.completed": "Buổi luyện tập đã hoàn thành. Xem kết quả hoặc bắt đầu video khác.",
    "button.practiceAgain": "Luyện lại",
    "button.listening": "Đang nghe...",
    "button.waiting": "Đang chờ nhập",
    "button.checking": "Đang kiểm tra...",
    "button.checkAgain": "Kiểm tra lại",
    "mode.waiting": "Đang chờ",
    "mode.ready": "Sẵn sàng",
    "mode.listening": "Đang nghe",
    "mode.input": "Nhập các từ bị thiếu",
    "mode.checking": "Đang kiểm tra",
    "mode.finished": "Hoàn thành",
    "mode.correct": "Đúng",
    "mode.review": "Cần xem lại",
    "progress.segment": "Đoạn {current} / {total}",
    "prompt.current": "Câu hiện tại",
    "blank.label": "Ô trống {index}",
    "blank.answer": "Ô nhập câu trả lời",
    "blank.placeholder": "Nhập phần bạn nghe được",
    "assist.title": "Trợ lý ngữ cảnh",
    "assist.meaning": "Nghĩa",
    "assist.pronunciation": "Phát âm",
    "assist.partOfSpeech": "Loại",
    "assist.chunks": "Cụm đi kèm",
    "assist.example": "Câu ví dụ",
    "assist.save": "Lưu",
    "assist.saved": "Đã lưu",
    "assist.queued": "Chờ lưu",
    "assist.listen": "Nghe",
    "assist.signIn": "Đăng nhập để lưu từ vựng.",
    "assist.savedAfterSession": "Sẽ lưu sau khi buổi học được lưu.",
    "assist.savedNow": "Đã lưu vào Vocabulary.",
    "assist.saveFailed": "Chưa lưu được từ này.",
    "assist.phraseType": "chunk / cụm từ",
    "assist.close": "Đóng trợ lý ngữ cảnh",
    "assist.loading": "Đang chuẩn bị nghĩa theo ngữ cảnh...",
    "assist.aiSource": "Nghĩa từ OpenRouter",
    "assist.offlineSource": "Gợi ý tạm thời",
    "assist.listenUnavailable": "Trình duyệt chưa hỗ trợ phát âm.",
    "assist.secondaryMeaning": "Tiếng Anh",
  },
}

const WORD_ASSIST_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "blank",
  "but",
  "for",
  "from",
  "has",
  "have",
  "her",
  "his",
  "into",
  "its",
  "not",
  "our",
  "out",
  "she",
  "the",
  "their",
  "them",
  "they",
  "this",
  "that",
  "was",
  "were",
  "when",
  "with",
  "you",
  "your",
])

const WORD_ASSIST_LEXICON = {
  accuracy: {
    ipa: "/ˈækjərəsi/",
    partOfSpeech: "noun",
    meaning: "how correct or exact something is",
    viMeaning: "độ chính xác; mức đúng của câu trả lời hoặc kỹ năng nghe",
    chunks: ["listening accuracy", "accuracy score", "improve accuracy"],
  },
  attention: {
    ipa: "/əˈtenʃən/",
    partOfSpeech: "noun",
    meaning: "careful focus on one thing",
    viMeaning: "sự chú ý, khả năng tập trung vào một điểm cụ thể",
    chunks: ["pay attention to", "focused attention", "improve attention"],
  },
  beneficial: {
    ipa: "/ˌbenəˈfɪʃəl/",
    partOfSpeech: "adjective",
    meaning: "helpful or good for learning",
    viMeaning: "có lợi, hữu ích cho việc học",
    chunks: ["beneficial for learning", "be beneficial to"],
  },
  compare: {
    ipa: "/kəmˈper/",
    partOfSpeech: "verb",
    meaning: "look at two things to notice similarities or differences",
    viMeaning: "so sánh hai thứ để thấy điểm giống hoặc khác",
    chunks: ["compare with", "compare what you heard", "compare answers"],
  },
  comprehension: {
    ipa: "/ˌkɑːmprɪˈhenʃən/",
    partOfSpeech: "noun",
    meaning: "the ability to understand spoken or written language",
    viMeaning: "khả năng hiểu nội dung nghe hoặc đọc",
    chunks: ["listening comprehension", "improve comprehension"],
  },
  confidence: {
    ipa: "/ˈkɑːnfɪdəns/",
    partOfSpeech: "noun",
    meaning: "the feeling that you can do something successfully",
    viMeaning: "sự tự tin khi làm điều gì đó",
    chunks: ["build confidence", "gain confidence", "confidence in speaking"],
  },
  consistent: {
    ipa: "/kənˈsɪstənt/",
    partOfSpeech: "adjective",
    meaning: "happening regularly and reliably",
    viMeaning: "đều đặn, ổn định, không thất thường",
    chunks: ["consistent practice", "stay consistent"],
  },
  context: {
    ipa: "/ˈkɑːntekst/",
    partOfSpeech: "noun",
    meaning: "the surrounding words or situation that explain meaning",
    viMeaning: "ngữ cảnh giúp hiểu đúng nghĩa của từ/câu",
    chunks: ["in context", "sentence context", "context clues"],
  },
  effective: {
    ipa: "/ɪˈfektɪv/",
    partOfSpeech: "adjective",
    meaning: "successful in producing the intended result",
    viMeaning: "hiệu quả, tạo ra kết quả mong muốn",
    chunks: ["effective study", "effective practice", "effective method"],
  },
  focus: {
    ipa: "/ˈfoʊkəs/",
    partOfSpeech: "verb / noun",
    meaning: "give attention to one thing",
    viMeaning: "tập trung vào một điều cụ thể",
    chunks: ["focus on", "focused practice", "focus attention"],
  },
  habit: {
    ipa: "/ˈhæbɪt/",
    partOfSpeech: "noun",
    meaning: "something you do regularly",
    viMeaning: "thói quen được lặp lại thường xuyên",
    chunks: ["build a habit", "listening habit", "daily habit"],
  },
  identify: {
    ipa: "/aɪˈdentɪfaɪ/",
    partOfSpeech: "verb",
    meaning: "recognize or find something clearly",
    viMeaning: "nhận ra, xác định rõ điều gì",
    chunks: ["identify mistakes", "identify key words"],
  },
  immediately: {
    ipa: "/ɪˈmiːdiətli/",
    partOfSpeech: "adverb",
    meaning: "right away, without delay",
    viMeaning: "ngay lập tức, không trì hoãn",
    chunks: ["immediately after", "respond immediately"],
  },
  recognition: {
    ipa: "/ˌrekəɡˈnɪʃən/",
    partOfSpeech: "noun",
    meaning: "the ability to identify something seen or heard before",
    viMeaning: "khả năng nhận ra từ/âm đã gặp trước đó",
    chunks: ["word recognition", "speech recognition"],
  },
  repeat: {
    ipa: "/rɪˈpiːt/",
    partOfSpeech: "verb",
    meaning: "say or do something again",
    viMeaning: "lặp lại, nói hoặc làm lại",
    chunks: ["repeat after", "repeat short segments"],
  },
  resistance: {
    ipa: "/rɪˈzɪstəns/",
    partOfSpeech: "noun",
    meaning: "a feeling that makes you avoid or delay doing something",
    viMeaning: "sự kháng cự, cảm giác ngại bắt đầu hoặc trì hoãn",
    chunks: ["reduce resistance", "mental resistance"],
  },
  rhythm: {
    ipa: "/ˈrɪðəm/",
    partOfSpeech: "noun",
    meaning: "a regular pattern of sound or movement",
    viMeaning: "nhịp điệu, tiết tấu của âm thanh hoặc lời nói",
    chunks: ["speech rhythm", "natural rhythm"],
  },
  segment: {
    ipa: "/ˈseɡmənt/",
    partOfSpeech: "noun",
    meaning: "one part of a larger audio, text, or video",
    viMeaning: "một đoạn nhỏ của audio, văn bản hoặc video",
    chunks: ["audio segment", "short segment", "clear segment"],
  },
  shadowing: {
    ipa: "/ˈʃædoʊɪŋ/",
    partOfSpeech: "noun",
    meaning: "a listening method where you repeat speech soon after hearing it",
    viMeaning: "phương pháp nghe và lặp lại gần như ngay sau người nói",
    chunks: ["shadowing session", "shadowing practice"],
  },
  transcript: {
    ipa: "/ˈtrænskrɪpt/",
    partOfSpeech: "noun",
    meaning: "written text of spoken audio",
    viMeaning: "bản chữ viết lại từ nội dung âm thanh",
    chunks: ["read the transcript", "transcript context"],
  },
  list: {
    ipa: "/lɪst/",
    partOfSpeech: "noun / verb · danh từ / động từ",
    meaning: "a set of items written, spoken, or arranged together",
    viMeaning: "danh sách; một nhóm mục được viết, nói hoặc sắp xếp cùng nhau",
    chunks: ["a list of", "make a list", "on the list", "list items"],
    example: "Make a list of words you often miss.",
  },
  "there's": {
    ipa: "/ðerz/",
    partOfSpeech: "contraction / dạng rút gọn",
    meaning: "short form of 'there is' or 'there has', depending on context",
    viMeaning: "dạng rút gọn của 'there is' hoặc 'there has', tùy ngữ cảnh",
    chunks: ["there's a", "there's no", "there's still"],
    example: "There's a better way to practice this sound.",
  },
  welcome: {
    ipa: "/ˈwelkəm/",
    partOfSpeech: "verb / interjection · động từ / lời chào",
    meaning: "to greet someone or show that they are accepted",
    viMeaning: "chào đón hoặc thể hiện rằng ai đó được chấp nhận",
    chunks: ["welcome back", "welcome to", "warm welcome", "welcome home"],
    example: "Welcome back to today's listening practice.",
  },
  vocabulary: {
    ipa: "/voʊˈkæbjəleri/",
    partOfSpeech: "noun",
    meaning: "words that someone knows or is learning",
    viMeaning: "vốn từ vựng mà người học biết hoặc đang học",
    chunks: ["vocabulary bank", "review vocabulary"],
  },
}

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
    this.language = this.normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY))
    this.wordAssistCloseTimer = null
    this.currentAssistInfo = null
  }

  async initialize() {
    this.applyLanguage()
    this.bindEvents()
    await this.playerController.initialize()
    this.setState(AppState.IDLE)
    this.renderStatus(this.t("entry.ready"))
    this.renderDifficulty()
    this.renderWorkspaceMode()
    this.renderAccuracy()
  }

  normalizeLanguage(language) {
    return language === "vi" ? "vi" : "en"
  }

  t(key, replacements = {}) {
    const template = TEXT[this.language]?.[key] ?? TEXT.en[key] ?? key
    return Object.entries(replacements).reduce((value, [name, replacement]) => {
      return value.replaceAll(`{${name}}`, String(replacement))
    }, template)
  }

  setLanguage(language) {
    this.language = this.normalizeLanguage(language)
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, this.language)
    this.applyLanguage()
    this.renderWorkspaceMode()
    this.renderDifficulty()
    this.setState(this.state)
    this.refreshCurrentAssistInfo()
    if (!this.session) {
      this.renderStatus(this.t("entry.ready"))
    }
  }

  applyLanguage() {
    document.documentElement.lang = this.language === "vi" ? "vi" : "en"
    const switchElement = this.elements.languageSwitch
    if (switchElement) {
      switchElement.dataset.language = this.language
    }
    for (const button of this.elements.languageButtons) {
      const isActive = button.dataset.languageChoice === this.language
      button.classList.toggle("is-active", isActive)
      button.setAttribute("aria-pressed", String(isActive))
    }

    this.elements.topbarSessionLabel.textContent = this.t("topbar.session")
    this.elements.profileButton.textContent = this.t("topbar.dashboard")
    this.elements.profileButton.setAttribute("aria-label", this.t("topbar.dashboardAria"))
    this.elements.profileButton.title = this.t("topbar.dashboard")
    this.elements.entryTitle.textContent = this.t("entry.title")
    this.elements.entryCopy.textContent = this.t("entry.copy")
    this.elements.videoUrlLabel.textContent = this.t("entry.videoLabel")
    this.elements.videoUrlInput.setAttribute("aria-label", this.t("entry.videoLabel"))
    this.elements.generateLessonButton.textContent = this.t("entry.start")
    this.elements.entryHelper.textContent = this.t("entry.helper")
    this.elements.workspaceTitle.textContent = this.t("workspace.title")
    this.elements.videoTitle.textContent = this.t("workspace.source")
    this.elements.videoLoadingIndicator.textContent = this.t("workspace.loadingVideo")
    this.elements.exerciseTitle.textContent = this.t("workspace.exercise")
    this.elements.emptyState.textContent = this.t("workspace.empty")
    this.elements.promptLabel.textContent = this.t("workspace.prompt")
    this.elements.practiceShortcutNote.textContent = this.t("workspace.shortcut")
    this.elements.submitAnswerButton.textContent = this.t("action.checkAnswer")
    this.elements.nextSegmentButton.textContent = this.t("action.nextSegment")
    this.elements.resultsSummaryLabel.textContent = this.t("results.summary")
    this.elements.resultsTitle.textContent = this.t("results.title")
    this.elements.totalSegmentsLabel.textContent = this.t("results.totalSegments")
    this.elements.averageAccuracyLabel.textContent = this.t("results.averageAccuracy")
    this.elements.correctCountLabel.textContent = this.t("results.correct")
    this.elements.reviewCountLabel.textContent = this.t("results.needsReview")
    this.elements.practiceAnotherButton.textContent = this.t("action.practiceAnother")
  }

  bindEvents() {
    this.elements.lessonForm.addEventListener("submit", (event) => {
      void this.handleLessonSubmit(event)
    })

    this.elements.startSessionButton.addEventListener("click", () => {
      this.startSession()
    })

    this.elements.answerForm.addEventListener("submit", (event) => {
      void this.handleAnswerSubmit(event)
    })

    this.elements.promptText.addEventListener("pointerover", (event) => {
      this.handleWordAssistPointerOver(event)
    })

    this.elements.promptText.addEventListener("pointerout", (event) => {
      this.handleWordAssistPointerOut(event)
    })

    this.elements.promptText.addEventListener("click", (event) => {
      this.handleWordAssistClick(event)
    })

    this.elements.promptText.addEventListener("mouseup", () => {
      this.handlePromptTextSelection()
    })

    this.elements.wordAssistPopover.addEventListener("pointerenter", () => {
      this.clearWordAssistCloseTimer()
    })

    this.elements.wordAssistPopover.addEventListener("pointerleave", () => {
      this.scheduleWordAssistClose()
    })

    this.elements.wordAssistPopover.addEventListener("click", (event) => {
      void this.handleWordAssistPopoverClick(event)
    })

    this.elements.nextSegmentButton.addEventListener("click", () => {
      this.advanceToNextStep()
    })

    this.elements.practiceAnotherButton.addEventListener("click", () => {
      this.resetToIdle()
    })

    for (const button of this.elements.languageButtons) {
      button.addEventListener("click", () => {
        this.setLanguage(button.dataset.languageChoice)
      })
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.hideWordAssist()
      }
      this.handleGlobalKeydown(event)
    })
  }

  async handleLessonSubmit(event) {
    event.preventDefault()

    this.resetPlayback()
    this.hideWordAssist()
    this.hideFeedback()
    this.hideResults()
    this.hideSessionSaveStatus()

    const videoUrl = this.elements.videoUrlInput.value.trim()
    const difficulty = Number(this.elements.difficultySelect.value)
    this.elements.videoUrlInput.removeAttribute("aria-invalid")

    if (!videoUrl) {
      this.elements.videoUrlInput.setAttribute("aria-invalid", "true")
      this.renderStatus(this.t("status.pasteLink"), "error")
      return
    }

    const videoId = this.extractYouTubeVideoId(videoUrl)

    if (!videoId) {
      this.elements.videoUrlInput.setAttribute("aria-invalid", "true")
      this.renderStatus(this.t("status.invalidUrl"), "error")
      return
    }

    this.elements.generateLessonButton.disabled = true
    this.elements.generateLessonButton.textContent = this.t("status.starting")
    this.setState(AppState.IDLE)
    this.setModeOverride(this.t("status.loadingTranscriptMode"))
    this.renderStatus(this.t("status.loadingTranscript"))
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
        queuedVocabularyItems: new Map(),
        savedVocabularyTerms: new Set(),
        assistItemsByKey: new Map(),
        assistRequestedSegments: new Set(),
        assistPendingSegments: new Set(),
        assistPendingTerms: new Set(),
      }

      this.showWorkspace()
      this.showVideoLoading(this.t("workspace.loadingVideo"))
      this.setModeOverride(this.t("status.loadingVideoMode"))
      this.renderStatus(this.t("status.loadingPlayer"))
      await this.playerController.loadVideo(videoId, exercise.items[0].start, false)
      this.hideVideoLoading()

      this.renderExerciseLoaded()
      this.renderCurrentPrompt()
      this.toggleSessionButtons(true)
      this.setState(AppState.READY)
      this.renderStatus(
        this.t("status.exerciseReady", { count: exercise.items.length }),
        "success",
      )
      this.startContextAssistPrefetch()
    } catch (error) {
      this.hideVideoLoading()
      this.renderStatus(
        error instanceof Error ? error.message : this.t("status.createError"),
        "error",
      )
      this.session = null
      this.renderEmptyState()
    } finally {
      this.elements.generateLessonButton.disabled = false
      this.elements.generateLessonButton.textContent = this.t("entry.start")
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
      this.renderStatus(this.t("status.fillBlank"), "warning")
      this.focusBlankByIndex(firstEmptyBlankIndex, "end")
      return
    }

    const userInput = this.buildUserSentenceFromInlineInputs()
    this.setState(AppState.CHECKING)
    this.disableInlineInputs(true)
    this.elements.submitAnswerButton.disabled = true
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true
    this.renderStatus(this.t("status.scoring"))

    try {
      const scorePayload = await this.scoreAnswer({
        originalText: currentItem.original_text,
        userInput,
      })
      const isCorrect = scorePayload.accuracy === 100

      this.clearPendingAdvance()
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

      if (isCorrect) {
        this.setState(AppState.WAITING_FOR_INPUT)
        this.setModeOverride(this.t("mode.correct"))
        this.disableInlineInputs(true)
        this.elements.submitAnswerButton.disabled = true
        this.elements.submitAnswerButton.textContent = this.t("mode.correct")
        this.elements.nextSegmentButton.hidden = false
        this.elements.nextSegmentButton.disabled = false
        this.renderStatus(this.t("status.correctNext"), "success")
      } else {
        this.setState(AppState.WAITING_FOR_INPUT)
        this.setModeOverride(this.t("mode.review"))
        this.disableInlineInputs(false)
        this.elements.submitAnswerButton.disabled = false
        this.elements.submitAnswerButton.textContent = this.t("button.checkAgain")
        this.renderStatus(this.t("status.review"), "warning")
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
      this.renderStatus(this.t("status.createFirst"))
      return
    }

    if (this.state === AppState.PLAYING) {
      return
    }

    if (this.state === AppState.WAITING_FOR_INPUT) {
      this.renderStatus(this.t("status.finishCurrent"))
      return
    }

    if (this.state === AppState.FINISHED) {
      this.session.currentIndex = 0
      this.session.results = []
      this.session.saveState = "idle"
      this.session.saveMessage = ""
      this.session.saveErrorDetail = ""
      this.session.savedSessionId = null
      this.session.queuedVocabularyItems = new Map()
      this.session.savedVocabularyTerms = new Set()
      this.session.assistItemsByKey = new Map()
      this.session.assistRequestedSegments = new Set()
      this.session.assistPendingSegments = new Set()
      this.session.assistPendingTerms = new Set()
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

    this.clearPendingAdvance()
    this.hideWordAssist()
    this.hideFeedback()
    this.resetInlineInputs()
    this.clearBlankResults()
    this.disableInlineInputs(true)
    this.elements.submitAnswerButton.disabled = true
    this.elements.submitAnswerButton.textContent = this.t("action.checkAnswer")
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true

    this.playerController.seekTo(currentItem.start)
    this.playerController.play()
    this.setState(AppState.PLAYING)
    this.renderStatus(this.t("status.replaying"))
    this.startFrameLoop()
  }

  playCurrentSegment() {
    const currentItem = this.getCurrentItem()
    if (!currentItem) {
      this.finishSession()
      return
    }

    this.clearPendingAdvance()
    this.hideFeedback()
    this.renderCurrentPrompt()
    this.resetInlineInputs()
    this.clearBlankResults()
    this.disableInlineInputs(true)
    this.elements.submitAnswerButton.disabled = true
    this.elements.submitAnswerButton.textContent = this.t("action.checkAnswer")
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true

    this.playerController.seekTo(currentItem.start)
    this.playerController.play()
    this.setState(AppState.PLAYING)
    this.renderStatus(
      this.t("status.playing", {
        current: this.session.currentIndex + 1,
        total: this.session.exercise.items.length,
      }),
    )
    this.startFrameLoop()
  }

  pauseForInput() {
    this.stopFrameLoop()
    this.playerController.pause()
    this.setState(AppState.WAITING_FOR_INPUT)
    this.disableInlineInputs(false)
    this.elements.submitAnswerButton.disabled = false
    this.elements.submitAnswerButton.textContent = this.t("action.checkAnswer")
    this.focusFirstInlineInput()
    this.renderStatus(this.t("status.paused"))
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

    this.renderStatus(this.t("status.preparing"))
    this.session.currentIndex += 1
    this.playCurrentSegment()
  }

  finishSession() {
    this.resetPlayback()
    this.setState(AppState.FINISHED)
    this.disableInlineInputs(true)
    this.elements.submitAnswerButton.disabled = true
    this.elements.submitAnswerButton.textContent = this.t("action.checkAnswer")
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true
    this.renderSummary()
    this.renderStatus(
      this.t("status.completed"),
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
    this.clearPendingAdvance()
    this.playerController.pause()
  }

  clearPendingAdvance() {
    if (this.pendingAdvanceId !== null) {
      window.clearTimeout(this.pendingAdvanceId)
      this.pendingAdvanceId = null
    }
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
    this.elements.submitAnswerButton.textContent = this.t("action.checkAnswer")
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true
    this.renderWorkspaceMode()
  }

  renderCurrentPrompt() {
    const currentItem = this.getCurrentItem()
    if (!currentItem || !this.session) {
      return
    }

    const progressLabel = this.t("progress.segment", {
      current: this.session.currentIndex + 1,
      total: this.session.exercise.items.length,
    })
    this.elements.progressText.textContent = progressLabel
    this.elements.railProgressText.textContent = progressLabel
    this.elements.promptLabel.textContent = `${this.t("prompt.current")} | ${progressLabel}`

    this.currentBlankInputs = []
    this.elements.promptText.innerHTML = ""
    this.hideWordAssist()

    const placeholderPattern = /_{4,}/g
    let lastIndex = 0
    let answerIndex = 0
    let match

    while ((match = placeholderPattern.exec(currentItem.blanked_text)) !== null) {
      const leadingText = currentItem.blanked_text.slice(lastIndex, match.index)
      if (leadingText) {
        this.appendAssistText(this.elements.promptText, leadingText, currentItem)
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
      input.setAttribute("aria-label", this.t("blank.label", { index: answerIndex + 1 }))
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
      this.appendAssistText(this.elements.promptText, trailingText, currentItem)
    }

    if (this.currentBlankInputs.length === 0) {
      const fallbackInput = document.createElement("input")
      fallbackInput.type = "text"
      fallbackInput.className = "inline-blank-input"
      fallbackInput.placeholder = this.t("blank.placeholder")
      fallbackInput.size = 24
      fallbackInput.dataset.baseLength = "12"
      fallbackInput.disabled = this.state !== AppState.WAITING_FOR_INPUT
      fallbackInput.setAttribute("aria-label", this.t("blank.answer"))
      this.attachBlankInputHandlers(fallbackInput, 0)
      this.resizeBlankInput(fallbackInput)
      this.currentBlankInputs.push(fallbackInput)
      this.elements.promptText.append(document.createTextNode(" "))
      this.elements.promptText.append(fallbackInput)
    }

    this.prefetchContextAssistAround(this.session.currentIndex)
  }

  appendAssistText(container, text, item) {
    const wordPattern = /[A-Za-z][A-Za-z'-]*/g
    let lastIndex = 0
    let match

    while ((match = wordPattern.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index)
      if (before) {
        container.append(document.createTextNode(before))
      }

      const word = match[0]
      if (this.isAssistCandidate(word)) {
        const token = document.createElement("span")
        token.className = "word-assist-token"
        token.textContent = word
        token.dataset.assistTerm = word
        token.title = this.t("assist.title")
        container.append(token)
      } else {
        container.append(document.createTextNode(word))
      }

      lastIndex = wordPattern.lastIndex
    }

    const after = text.slice(lastIndex)
    if (after) {
      container.append(document.createTextNode(after))
    }
  }

  isAssistCandidate(word) {
    const normalized = this.normalizeAssistTerm(word)
    if (normalized.length < 3) {
      return false
    }
    return !WORD_ASSIST_STOPWORDS.has(normalized)
  }

  normalizeAssistTerm(term) {
    return String(term ?? "")
      .replaceAll("’", "'")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^[^a-z]+|[^a-z]+$/g, "")
  }

  baseAssistTerm(term) {
    const normalized = this.normalizeAssistTerm(term)
    if (WORD_ASSIST_LEXICON[normalized]) {
      return normalized
    }
    for (const suffix of ["ing", "ed", "es", "s"]) {
      if (normalized.length > suffix.length + 3 && normalized.endsWith(suffix)) {
        const candidate = normalized.slice(0, -suffix.length)
        if (WORD_ASSIST_LEXICON[candidate]) {
          return candidate
        }
      }
    }
    return normalized
  }

  localizeAssist(english, vietnamese) {
    return this.localizeAssistFor(english, vietnamese, this.language)
  }

  localizeAssistFor(english, vietnamese, language = this.language) {
    return language === "vi" ? vietnamese : english
  }

  inferPartOfSpeech(term, isPhrase = false) {
    if (isPhrase) {
      return this.t("assist.phraseType")
    }

    const base = this.baseAssistTerm(term)
    const entry = WORD_ASSIST_LEXICON[base]
    if (entry?.partOfSpeech) {
      return entry.partOfSpeech
    }

    if (base.endsWith("tion") || base.endsWith("sion") || base.endsWith("ment") || base.endsWith("ness")) {
      return "noun"
    }
    if (base.endsWith("ive") || base.endsWith("ous") || base.endsWith("able") || base.endsWith("ible")) {
      return "adjective"
    }
    if (base.endsWith("ly")) {
      return "adverb"
    }
    if (base.endsWith("ize") || base.endsWith("ise") || base.endsWith("fy")) {
      return "verb"
    }
    if (base.includes("'")) {
      return this.localizeAssist("contraction", "dạng rút gọn")
    }
    return this.localizeAssist("content word", "từ mang nghĩa chính")
  }

  buildAssistMeaning(term, isPhrase = false, language = this.language) {
    if (isPhrase) {
      return this.localizeAssistFor(
        "A phrase from this sentence. Learn it as one meaning unit, then compare it with the surrounding idea.",
        "Một cụm trong câu đang luyện. Nên học cả cụm như một đơn vị nghĩa, rồi đối chiếu với ý xung quanh.",
        language,
      )
    }

    const base = this.baseAssistTerm(term)
    const entry = WORD_ASSIST_LEXICON[base]
    if (entry) {
      return language === "vi" ? entry.viMeaning : entry.meaning
    }

    if (base.includes("'")) {
      return this.localizeAssistFor(
        "A shortened spoken form. Read the sentence to decide the full form and meaning.",
        "Một dạng rút gọn trong lời nói. Hãy nhìn cả câu để xác định dạng đầy đủ và nghĩa chính xác.",
        language,
      )
    }
    if (base.endsWith("tion") || base.endsWith("sion")) {
      return this.localizeAssistFor(
        "Usually a noun that names a process, result, or idea.",
        "Thường là danh từ chỉ một quá trình, kết quả hoặc ý tưởng.",
        language,
      )
    }
    if (base.endsWith("ment")) {
      return this.localizeAssistFor(
        "Usually a noun for an action, result, or condition.",
        "Thường là danh từ chỉ hành động, kết quả hoặc trạng thái.",
        language,
      )
    }
    if (base.endsWith("ive") || base.endsWith("ous")) {
      return this.localizeAssistFor(
        "Usually an adjective that describes a quality.",
        "Thường là tính từ dùng để mô tả đặc điểm.",
        language,
      )
    }
    if (base.endsWith("ly")) {
      return this.localizeAssistFor(
        "Usually an adverb that explains how something happens.",
        "Thường là trạng từ giải thích cách một việc diễn ra.",
        language,
      )
    }

    return this.localizeAssistFor(
      "Meaning depends on this sentence. Use the surrounding words to choose the right sense.",
      "Nghĩa của từ này phụ thuộc vào câu đang luyện. Hãy dựa vào các từ xung quanh để chọn đúng sắc thái nghĩa.",
      language,
    )
  }

  buildAssistPronunciation(term, isPhrase = false) {
    if (isPhrase) {
      return this.localizeAssist(
        "Listen for connected speech and stress across the whole phrase.",
        "Hãy nghe nối âm và trọng âm của cả cụm, không chỉ từng từ riêng lẻ.",
      )
    }

    const entry = WORD_ASSIST_LEXICON[this.baseAssistTerm(term)]
    return entry?.ipa ?? this.localizeAssist(
      "Tap Listen to hear browser pronunciation; IPA is not available offline.",
      "Bấm Nghe để nghe phát âm bằng trình duyệt. Bản offline chưa có IPA.",
    )
  }

  buildAssistChunks(term, context, isPhrase = false) {
    const normalized = this.normalizeAssistTerm(term)
    const entry = WORD_ASSIST_LEXICON[this.baseAssistTerm(term)]
    const chunks = new Set(entry?.chunks ?? [])

    if (isPhrase) {
      chunks.add(term.trim())
    }

    const words = String(context ?? "")
      .replace(/\[blank\]/gi, " ")
      .match(/[A-Za-z][A-Za-z'-]*/g)
      ?.map((word) => word.trim())
      ?? []
    const lowerWords = words.map((word) => this.normalizeAssistTerm(word))
    for (const [index, word] of lowerWords.entries()) {
      if (word !== normalized) {
        continue
      }
      const left = words[Math.max(0, index - 1)]
      const right = words[Math.min(words.length - 1, index + 1)]
      const rightTwo = words[Math.min(words.length - 1, index + 2)]
      if (left && this.normalizeAssistTerm(left) !== normalized) {
        chunks.add(`${left} ${words[index]}`)
      }
      if (right && this.normalizeAssistTerm(right) !== normalized) {
        chunks.add(`${words[index]} ${right}`)
      }
      if (right && rightTwo && right !== rightTwo) {
        chunks.add(`${words[index]} ${right} ${rightTwo}`)
      }
    }

    return this.sanitizeAssistChunks([...chunks])
  }

  buildAssistExample(term, isPhrase = false) {
    const cleanTerm = String(term ?? "").replace(/\s+/g, " ").trim()
    const entry = WORD_ASSIST_LEXICON[this.baseAssistTerm(cleanTerm)]
    if (entry?.example) {
      return entry.example
    }
    if (isPhrase) {
      return `Try using "${cleanTerm}" as one natural phrase.`
    }
    return `Try using "${cleanTerm}" in a clear sentence.`
  }

  sanitizeAssistChunks(chunks) {
    const cleaned = []
    const seen = new Set()
    for (const chunk of chunks) {
      const text = String(chunk ?? "").replace(/\s+/g, " ").trim()
      const normalized = text.toLowerCase()
      if (!text || normalized.includes("[blank]") || normalized.split(/\s+/).includes("blank")) {
        continue
      }
      if (seen.has(normalized)) {
        continue
      }
      seen.add(normalized)
      cleaned.push(text)
      if (cleaned.length >= 4) {
        break
      }
    }
    return cleaned
  }

  buildAssistDifficulty(term, isPhrase = false) {
    if (isPhrase) {
      return "medium"
    }
    const base = this.baseAssistTerm(term)
    if (base.length >= 10 || base.endsWith("tion") || base.endsWith("sion")) {
      return "hard"
    }
    if (base.length >= 7) {
      return "medium"
    }
    return "easy"
  }

  maskAssistContext(context) {
    return String(context ?? "")
      .replace(/_{4,}/g, "[blank]")
      .replace(/\s+/g, " ")
      .trim()
  }

  assistCacheKey(segmentIndex, term) {
    return `${segmentIndex}:${this.normalizeAssistTerm(term)}`
  }

  getCachedAssistItem(segmentIndex, term) {
    if (!this.session || segmentIndex === undefined || segmentIndex === null) {
      return null
    }
    return this.session.assistItemsByKey.get(this.assistCacheKey(segmentIndex, term)) ?? null
  }

  remoteAssistToInfo(remoteItem, fallbackContext, fallbackIsPhrase = false) {
    const meaningEn = remoteItem.meaning_en || remoteItem.meaning_vi || ""
    const meaningVi = remoteItem.meaning_vi || remoteItem.meaning_en || ""
    const context = this.maskAssistContext(remoteItem.context_sentence || fallbackContext)
    const rawExample = String(remoteItem.example ?? "").trim()
    const example = rawExample && !rawExample.includes("[blank]")
      ? rawExample
      : this.buildAssistExample(remoteItem.term, fallbackIsPhrase)
    return {
      term: remoteItem.term,
      segmentIndex: remoteItem.segment_index,
      isPhrase: Boolean(remoteItem.is_phrase || fallbackIsPhrase),
      context,
      example,
      partOfSpeech: remoteItem.part_of_speech || this.inferPartOfSpeech(remoteItem.term, fallbackIsPhrase),
      meaning: this.language === "vi" ? meaningVi : meaningEn,
      meaningEn,
      meaningVi,
      meaningTranslation: this.language === "vi" ? meaningEn : meaningVi,
      pronunciation: remoteItem.pronunciation || this.buildAssistPronunciation(remoteItem.term, fallbackIsPhrase),
      chunks: this.sanitizeAssistChunks(remoteItem.chunks ?? []),
      difficulty: remoteItem.difficulty || this.buildAssistDifficulty(remoteItem.term, fallbackIsPhrase),
      source: remoteItem.source || "openrouter",
      isLoading: false,
    }
  }

  isAssistPending(segmentIndex, term = null) {
    if (!this.session || segmentIndex === undefined || segmentIndex === null) {
      return false
    }
    if (term) {
      return this.session.assistPendingTerms.has(this.assistCacheKey(segmentIndex, term))
    }
    return this.session.assistPendingSegments.has(segmentIndex)
  }

  buildAssistInfo(term, item, { isPhrase = false } = {}) {
    const cleanTerm = String(term ?? "").replace(/\s+/g, " ").trim()
    const context = this.maskAssistContext(item?.blanked_text ?? item?.original_text ?? cleanTerm)
    const cachedItem = this.getCachedAssistItem(item?.segment_index, cleanTerm)
    if (cachedItem) {
      return this.remoteAssistToInfo(cachedItem, context, isPhrase)
    }
    const meaningEn = this.buildAssistMeaning(cleanTerm, isPhrase, "en")
    const meaningVi = this.buildAssistMeaning(cleanTerm, isPhrase, "vi")

    return {
      term: cleanTerm,
      segmentIndex: item?.segment_index ?? null,
      isPhrase,
      context,
      example: this.buildAssistExample(cleanTerm, isPhrase),
      partOfSpeech: this.inferPartOfSpeech(cleanTerm, isPhrase),
      meaning: this.language === "vi" ? meaningVi : meaningEn,
      meaningEn,
      meaningVi,
      meaningTranslation: this.language === "vi" ? meaningEn : meaningVi,
      pronunciation: this.buildAssistPronunciation(cleanTerm, isPhrase),
      chunks: this.buildAssistChunks(cleanTerm, context, isPhrase),
      difficulty: this.buildAssistDifficulty(cleanTerm, isPhrase),
      source: "offline",
      isLoading: this.isAssistPending(item?.segment_index, cleanTerm)
        || this.isAssistPending(item?.segment_index),
    }
  }

  startContextAssistPrefetch() {
    if (!this.session) {
      return
    }
    this.prefetchContextAssistAround(this.session.currentIndex)
  }

  prefetchContextAssistAround(currentIndex) {
    if (!this.session) {
      return
    }
    const windowStart = Math.max(0, currentIndex)
    void this.prefetchContextAssistSegments(windowStart, 3)
  }

  async prefetchContextAssistSegments(startIndex, count) {
    if (!this.session || count <= 0) {
      return
    }

    const selectedItems = []
    const endIndex = Math.min(this.session.exercise.items.length, startIndex + count)
    for (let index = startIndex; index < endIndex; index += 1) {
      const item = this.session.exercise.items[index]
      if (!item) {
        continue
      }
      const segmentIndex = item.segment_index
      if (
        this.session.assistRequestedSegments.has(segmentIndex)
        || this.session.assistPendingSegments.has(segmentIndex)
      ) {
        continue
      }
      this.session.assistPendingSegments.add(segmentIndex)
      selectedItems.push(item)
    }

    if (selectedItems.length === 0) {
      return
    }

    try {
      const didCacheItems = await this.fetchContextAssist(selectedItems)
      if (didCacheItems) {
        selectedItems.forEach((item) => {
          this.session.assistRequestedSegments.add(item.segment_index)
        })
      }
      this.refreshCurrentAssistInfo()
    } finally {
      selectedItems.forEach((item) => {
        this.session.assistPendingSegments.delete(item.segment_index)
      })
    }
  }

  async requestContextAssistForTerm(term, item, { isPhrase = false } = {}) {
    if (!this.session || !item) {
      return
    }
    if (this.getCachedAssistItem(item.segment_index, term)) {
      return
    }

    const key = this.assistCacheKey(item.segment_index, term)
    if (this.session.assistPendingTerms.has(key)) {
      return
    }

    this.session.assistPendingTerms.add(key)
    try {
      await this.fetchContextAssist([item], {
        termsBySegment: new Map([[item.segment_index, [term]]]),
        maxTermsPerSegment: isPhrase ? 1 : 4,
      })
      this.refreshCurrentAssistInfo()
    } finally {
      this.session.assistPendingTerms.delete(key)
    }
  }

  async fetchContextAssist(items, { termsBySegment = null, maxTermsPerSegment = 6 } = {}) {
    if (!this.session || items.length === 0) {
      return false
    }

    let response
    try {
      response = await fetch(
        `${this.apiBaseUrl}/lessons/${encodeURIComponent(this.session.exercise.video_id)}/context-assist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            max_terms_per_segment: maxTermsPerSegment,
            items: items.map((item) => ({
              segment_index: item.segment_index,
              text: item.blanked_text,
              terms: termsBySegment?.get(item.segment_index) ?? [],
            })),
          }),
        },
      )
    } catch (error) {
      return false
    }

    if (!response.ok) {
      return false
    }

    try {
      const payload = await response.json()
      this.cacheContextAssistItems(payload.items ?? [])
      return true
    } catch (error) {
      return false
    }
  }

  cacheContextAssistItems(items) {
    if (!this.session) {
      return
    }

    for (const item of items) {
      if (!item || typeof item.term !== "string" || item.segment_index === undefined) {
        continue
      }
      this.session.assistItemsByKey.set(
        this.assistCacheKey(item.segment_index, item.term),
        item,
      )
    }
  }

  refreshCurrentAssistInfo() {
    if (!this.currentAssistInfo || !this.session || this.elements.wordAssistPopover.hidden) {
      return
    }

    const item = this.session.exercise.items.find((candidate) => {
      return candidate.segment_index === this.currentAssistInfo.segmentIndex
    }) ?? this.getCurrentItem()
    if (!item) {
      return
    }

    const anchorRect = this.elements.wordAssistPopover.getBoundingClientRect()
    const refreshedInfo = this.buildAssistInfo(
      this.currentAssistInfo.term,
      item,
      { isPhrase: this.currentAssistInfo.isPhrase },
    )
    this.showWordAssist(refreshedInfo, anchorRect)
  }

  handleWordAssistPointerOver(event) {
    const token = event.target.closest?.(".word-assist-token")
    if (!token) {
      return
    }
    this.clearWordAssistCloseTimer()
    this.openWordAssistFromToken(token)
  }

  handleWordAssistPointerOut(event) {
    const token = event.target.closest?.(".word-assist-token")
    if (!token) {
      return
    }
    if (event.relatedTarget && this.elements.wordAssistPopover.contains(event.relatedTarget)) {
      return
    }
    this.scheduleWordAssistClose()
  }

  handleWordAssistClick(event) {
    const token = event.target.closest?.(".word-assist-token")
    if (!token) {
      return
    }
    event.preventDefault()
    this.openWordAssistFromToken(token)
  }

  handlePromptTextSelection() {
    window.setTimeout(() => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().replace(/\s+/g, " ").trim() ?? ""
      if (!selection || selection.isCollapsed || selectedText.split(/\s+/).length < 2) {
        return
      }
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null
      if (!range || !this.elements.promptText.contains(range.commonAncestorContainer)) {
        return
      }
      const rect = range.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) {
        return
      }
      const currentItem = this.getCurrentItem()
      void this.requestContextAssistForTerm(selectedText, currentItem, { isPhrase: true })
      const info = this.buildAssistInfo(selectedText, currentItem, { isPhrase: true })
      this.showWordAssist(info, rect)
    }, 0)
  }

  openWordAssistFromToken(token) {
    const currentItem = this.getCurrentItem()
    const term = token.dataset.assistTerm ?? token.textContent
    void this.requestContextAssistForTerm(term, currentItem)
    const info = this.buildAssistInfo(term, currentItem)
    this.showWordAssist(info, token.getBoundingClientRect())
  }

  showWordAssist(info, anchorRect) {
    this.currentAssistInfo = info
    const isSaved = this.session?.savedVocabularyTerms?.has(this.normalizeAssistTerm(info.term))
    const isQueued = this.session?.queuedVocabularyItems?.has(this.normalizeAssistTerm(info.term))
    const isStored = isSaved || isQueued
    const saveLabel = isSaved ? this.t("assist.saved") : isQueued ? this.t("assist.queued") : this.t("assist.save")
    const sourceLabel = info.source === "openrouter" ? this.t("assist.aiSource") : this.t("assist.offlineSource")
    const translationMarkup = info.meaningTranslation && info.meaningTranslation !== info.meaning
      ? `<p class="word-assist-meaning-secondary"><span>${this.escapeHtml(this.t("assist.secondaryMeaning"))}</span>${this.escapeHtml(info.meaningTranslation)}</p>`
      : ""
    const chunksMarkup =
      info.chunks.length > 0
        ? `<div class="word-assist-chips">${info.chunks.map((chunk) => `<span>${this.escapeHtml(chunk)}</span>`).join("")}</div>`
        : `<p>${this.escapeHtml(this.localizeAssist("Use this word with the sentence around it.", "Hãy học từ này cùng các từ xung quanh trong câu."))}</p>`
    const loadingMarkup = info.isLoading
      ? `<p class="word-assist-loading">${this.escapeHtml(this.t("assist.loading"))}</p>`
      : ""

    this.elements.wordAssistPopover.innerHTML = `
      <div class="word-assist-header">
        <div>
          <span>${this.escapeHtml(this.t("assist.title"))}</span>
          <strong>${this.escapeHtml(info.term)}</strong>
        </div>
        <div class="word-assist-badges">
          <span class="word-assist-source" data-source="${this.escapeHtml(info.source)}">${this.escapeHtml(sourceLabel)}</span>
          <span class="word-assist-level">${this.escapeHtml(info.difficulty)}</span>
        </div>
        <button type="button" class="word-assist-close" data-assist-close aria-label="${this.escapeHtml(this.t("assist.close"))}">×</button>
      </div>
      ${loadingMarkup}
      <div class="word-assist-grid">
        <section>
          <span>${this.escapeHtml(this.t("assist.meaning"))}</span>
          <p class="word-assist-meaning-primary">${this.escapeHtml(info.meaning)}</p>
          ${translationMarkup}
        </section>
        <section>
          <span>${this.escapeHtml(this.t("assist.partOfSpeech"))}</span>
          <p>${this.escapeHtml(info.partOfSpeech)}</p>
        </section>
        <section>
          <span>${this.escapeHtml(this.t("assist.pronunciation"))}</span>
          <p>${this.escapeHtml(info.pronunciation)}</p>
        </section>
      </div>
      <section class="word-assist-section">
        <span>${this.escapeHtml(this.t("assist.chunks"))}</span>
        ${chunksMarkup}
      </section>
      <section class="word-assist-section">
        <span>${this.escapeHtml(this.t("assist.example"))}</span>
        <p>${this.escapeHtml(info.example)}</p>
      </section>
      <p class="word-assist-status" data-assist-status></p>
      <div class="word-assist-actions">
        <button type="button" class="button-ghost" data-assist-speak>${this.escapeHtml(this.t("assist.listen"))}</button>
        <button type="button" class="button-primary" data-assist-save ${isStored ? "disabled" : ""}>${this.escapeHtml(saveLabel)}</button>
      </div>
    `

    this.elements.wordAssistPopover.hidden = false
    this.positionWordAssist(anchorRect)
  }

  positionWordAssist(anchorRect) {
    window.requestAnimationFrame(() => {
      const popover = this.elements.wordAssistPopover
      const rect = popover.getBoundingClientRect()
      const margin = 12
      const preferredLeft = anchorRect.left + anchorRect.width / 2 - rect.width / 2
      const left = Math.min(window.innerWidth - rect.width - margin, Math.max(margin, preferredLeft))
      const topAbove = anchorRect.top - rect.height - 10
      const top = topAbove > margin ? topAbove : Math.min(window.innerHeight - rect.height - margin, anchorRect.bottom + 10)
      popover.style.left = `${Math.max(margin, left)}px`
      popover.style.top = `${Math.max(margin, top)}px`
    })
  }

  clearWordAssistCloseTimer() {
    if (this.wordAssistCloseTimer) {
      window.clearTimeout(this.wordAssistCloseTimer)
      this.wordAssistCloseTimer = null
    }
  }

  scheduleWordAssistClose() {
    this.clearWordAssistCloseTimer()
    this.wordAssistCloseTimer = window.setTimeout(() => {
      this.hideWordAssist()
    }, 180)
  }

  hideWordAssist() {
    this.clearWordAssistCloseTimer()
    this.currentAssistInfo = null
    if (this.elements.wordAssistPopover) {
      this.elements.wordAssistPopover.hidden = true
      this.elements.wordAssistPopover.innerHTML = ""
    }
  }

  async handleWordAssistPopoverClick(event) {
    const target = event.target
    if (!(target instanceof Element) || !this.currentAssistInfo) {
      return
    }

    if (target.closest("[data-assist-close]")) {
      this.hideWordAssist()
      return
    }

    if (target.closest("[data-assist-speak]")) {
      this.speakAssistTerm(this.currentAssistInfo.term)
      return
    }

    if (target.closest("[data-assist-save]")) {
      await this.saveAssistVocabulary(this.currentAssistInfo)
    }
  }

  speakAssistTerm(term) {
    if (!("speechSynthesis" in window)) {
      this.setAssistStatus(this.t("assist.listenUnavailable"), "warning")
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(term)
    utterance.lang = "en-US"
    utterance.rate = 0.88
    window.speechSynthesis.speak(utterance)
  }

  setAssistStatus(message, tone = "default") {
    const status = this.elements.wordAssistPopover.querySelector("[data-assist-status]")
    if (!status) {
      return
    }
    status.textContent = message
    status.dataset.tone = tone
  }

  async saveAssistVocabulary(info) {
    if (!this.session) {
      return
    }
    const token = this.getAuthToken()
    if (!token) {
      this.setAssistStatus(this.t("assist.signIn"), "warning")
      return
    }

    const key = this.normalizeAssistTerm(info.term)

    if (!this.session.savedSessionId) {
      this.session.queuedVocabularyItems.set(key, info)
      this.showWordAssist(info, this.elements.wordAssistPopover.getBoundingClientRect())
      this.setAssistStatus(this.t("assist.savedAfterSession"), "success")
      return
    }

    const saved = await this.persistAssistVocabularyItem({
      info,
      sessionId: this.session.savedSessionId,
      token,
    })
    if (saved) {
      this.session.queuedVocabularyItems.delete(key)
      this.session.savedVocabularyTerms.add(key)
      this.showWordAssist(info, this.elements.wordAssistPopover.getBoundingClientRect())
      this.setAssistStatus(this.t("assist.savedNow"), "success")
    } else {
      this.setAssistStatus(this.t("assist.saveFailed"), "warning")
    }
  }

  async persistAssistVocabularyItem({ info, sessionId, token }) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/sessions/${sessionId}/vocabulary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          term: info.term.slice(0, 120),
          context_sentence: info.context,
          definition: info.meaningVi || info.meaning,
          difficulty: info.difficulty,
        }),
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  async flushQueuedVocabularySaves() {
    if (!this.session?.savedSessionId || this.session.queuedVocabularyItems.size === 0) {
      return
    }
    const token = this.getAuthToken()
    if (!token) {
      return
    }

    for (const [key, info] of [...this.session.queuedVocabularyItems.entries()]) {
      const saved = await this.persistAssistVocabularyItem({
        info,
        sessionId: this.session.savedSessionId,
        token,
      })
      if (saved) {
        this.session.queuedVocabularyItems.delete(key)
        this.session.savedVocabularyTerms.add(key)
      }
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
      title.textContent = `${this.t("progress.segment", {
        current: index + 1,
        total: totalSegments,
      })} - ${result.isCorrect ? this.t("mode.correct") : this.t("mode.review")}`

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
    this.hideWordAssist()
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
    this.renderStatus(this.t("entry.ready"))
    this.renderAccuracy()
    this.elements.videoUrlInput.focus()
  }

  renderEmptyState() {
    this.elements.emptyState.hidden = false
    this.elements.exerciseWorkspace.hidden = true
    this.elements.answerForm.hidden = true
    this.elements.nextSegmentButton.hidden = true
    this.elements.nextSegmentButton.disabled = true
    this.elements.workspaceStage.hidden = true
    this.elements.entryStage.hidden = false
    this.elements.topbarSessionLabel.hidden = true
    this.toggleSessionButtons(false)
  }

  toggleSessionButtons(enabled) {
    this.elements.startSessionButton.disabled = !enabled
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

  showVideoLoading(message = this.t("workspace.loadingVideo")) {
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
      [AppState.IDLE]: this.t("mode.waiting"),
      [AppState.READY]: this.t("mode.ready"),
      [AppState.PLAYING]: this.t("mode.listening"),
      [AppState.WAITING_FOR_INPUT]: this.t("mode.input"),
      [AppState.CHECKING]: this.t("mode.checking"),
      [AppState.FINISHED]: this.t("mode.finished"),
    }
    const modeLabel = this.modeLabelOverride ?? labelMap[this.state] ?? this.state
    this.elements.workspaceMode.textContent = modeLabel
    this.elements.railWorkspaceMode.textContent = modeLabel
    this.elements.workspaceStateBadge.textContent = modeLabel

    let badgeVariant = "idle"
    if (modeLabel === this.t("mode.correct")) {
      badgeVariant = "success"
    } else if (modeLabel === this.t("mode.review")) {
      badgeVariant = "review"
    } else if (
      modeLabel === this.t("status.loadingTranscriptMode") ||
      modeLabel === this.t("status.loadingVideoMode") ||
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
      this.elements.startSessionButton.textContent = this.t("button.practiceAgain")
      this.elements.startSessionButton.disabled = false
      return
    }

    if (nextState === AppState.READY) {
      this.elements.startSessionButton.textContent = this.t("entry.start")
      this.elements.startSessionButton.disabled = false
      return
    }

    if (nextState === AppState.PLAYING) {
      this.elements.startSessionButton.textContent = this.t("button.listening")
      this.elements.startSessionButton.disabled = true
      return
    }

    if (nextState === AppState.WAITING_FOR_INPUT) {
      this.elements.startSessionButton.textContent = this.t("button.waiting")
      this.elements.startSessionButton.disabled = true
      return
    }

    if (nextState === AppState.CHECKING) {
      this.elements.startSessionButton.textContent = this.t("button.checking")
      this.elements.startSessionButton.disabled = true
      return
    }

    this.elements.startSessionButton.textContent = this.t("entry.start")
    this.elements.startSessionButton.disabled = !this.session
  }

  handleGlobalKeydown(event) {
    if (event.key === "Control" && !event.repeat && !event.metaKey && !event.altKey) {
      if (this.session && this.state === AppState.WAITING_FOR_INPUT) {
        event.preventDefault()
        if (this.modeLabelOverride === this.t("mode.correct")) {
          this.advanceToNextStep()
          return
        }
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

      if (event.key === "Tab") {
        event.preventDefault()
        const direction = event.shiftKey ? -1 : 1
        const nextIndex = (blankIndex + direction + this.currentBlankInputs.length) % this.currentBlankInputs.length
        this.focusBlankByIndex(nextIndex, event.shiftKey ? "end" : "start")
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
    return String(value ?? "")
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
    await this.flushQueuedVocabularySaves()
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
  languageSwitch: document.querySelector(".language-switch"),
  languageButtons: document.querySelectorAll("[data-language-choice]"),
  profileButton: document.getElementById("profile-button"),
  topbarSessionLabel: document.getElementById("topbar-session-label"),
  entryTitle: document.getElementById("entry-title"),
  entryCopy: document.querySelector(".entry-copy"),
  entryHelper: document.querySelector(".entry-helper"),
  videoUrlLabel: document.querySelector('label[for="video-url"]'),
  workspaceTitle: document.getElementById("workspace-title"),
  videoTitle: document.getElementById("video-title"),
  exerciseTitle: document.getElementById("exercise-title"),
  practiceShortcutNote: document.querySelector(".practice-shortcut-note"),
  resultsSummaryLabel: document.querySelector(".results-panel .panel-label"),
  resultsTitle: document.getElementById("results-title"),
  totalSegmentsLabel: document.querySelector(".summary-metric:nth-child(1) .summary-metric-label"),
  averageAccuracyLabel: document.querySelector(".summary-metric:nth-child(2) .summary-metric-label"),
  correctCountLabel: document.querySelector(".summary-metric:nth-child(3) .summary-metric-label"),
  reviewCountLabel: document.querySelector(".summary-metric:nth-child(4) .summary-metric-label"),
  entryStage: document.getElementById("entry-stage"),
  workspaceStage: document.getElementById("workspace-stage"),
  lessonForm: document.getElementById("lesson-form"),
  generateLessonButton: document.getElementById("generate-lesson-button"),
  videoUrlInput: document.getElementById("video-url"),
  difficultySelect: document.getElementById("difficulty"),
  startSessionButton: document.getElementById("start-session-button"),
  workspaceStateBadge: document.getElementById("workspace-state-badge"),
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
  wordAssistPopover: document.getElementById("word-assist-popover"),
}

const playerController = new YouTubePlayerController("video-player")
const appController = new AppController({
  playerController,
  elements,
})

appController.initialize().catch((error) => {
  elements.statusMessage.textContent = error instanceof Error ? error.message : "Unexpected error."
})
