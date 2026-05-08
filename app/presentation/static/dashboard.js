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

const MAX_AVATAR_FILE_SIZE_BYTES = 5 * 1024 * 1024

const QUESTION_TYPES = [
  ["mixed", "questionType.mixed"],
  ["inference", "questionType.inference"],
  ["vocabulary", "questionType.vocabulary"],
  ["main_idea", "questionType.mainIdea"],
  ["detail", "questionType.detail"],
]

const I18N = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.sessions": "Sessions",
    "nav.quizHistory": "Quiz History",
    "nav.vocabulary": "Vocabulary",
    "nav.settings": "Settings",
    "view.dashboard.title": "Dashboard",
    "view.dashboard.context": "Learning overview",
    "view.sessions.title": "Sessions",
    "view.sessions.context": "Transcript, reading quiz, and attempts",
    "view.quiz-history.title": "Quiz History",
    "view.quiz-history.context": "Saved quiz review",
    "view.vocabulary.title": "Vocabulary",
    "view.vocabulary.context": "Transcript vocabulary and mini quiz",
    "view.settings.title": "Settings",
    "view.settings.context": "Account and quiz defaults",
    "shell.loadingLearner": "Loading learner",
    "shell.language": "Language",
    "shell.newPractice": "New Practice",
    "shell.signOut": "Sign out",
    "shell.vocabulary": "Vocabulary",
    "shell.studySession": "Study Session",
    "metric.totalSessions": "Total Sessions",
    "metric.savedTranscripts": "Saved Transcripts",
    "metric.averageAccuracy": "Average Accuracy",
    "metric.totalQuizzes": "Total Quizzes",
    "metric.averageQuizScore": "Average Quiz Score",
    "settings.eyebrow": "Account Center",
    "settings.title": "Settings",
    "settings.copy": "Manage your learner profile, password, language, and study defaults.",
    "settings.reset": "Reset Local Settings",
    "settings.accountEyebrow": "Account",
    "settings.accountTitle": "Profile and Avatar",
    "settings.avatarHint": "PNG, JPG, or SVG up to 5 MB works best.",
    "settings.chooseAvatar": "Choose image",
    "settings.removeAvatar": "Remove",
    "settings.username": "Display name",
    "settings.email": "Email",
    "settings.emailHelp": "Email is used for login and is not editable here.",
    "settings.preferredLanguage": "Interface language",
    "settings.saveProfile": "Save Profile",
    "settings.signedIn": "Signed in",
    "settings.sessionTitle": "Session",
    "settings.sessionCopy": "Sign out from this browser and return to the login page.",
    "settings.passwordEyebrow": "Security",
    "settings.passwordTitle": "Change Password",
    "settings.currentPassword": "Current password",
    "settings.newPassword": "New password",
    "settings.confirmPassword": "Confirm new password",
    "settings.updatePassword": "Update Password",
    "settings.quizEyebrow": "Quiz",
    "settings.quizTitle": "Question Defaults",
    "settings.vocabEyebrow": "Vocabulary",
    "settings.vocabTitle": "Practice Behavior",
    "settings.autoMaskLabel": "Hide word bank during Vocabulary Check",
    "settings.autoMaskDescription": "Automatically blur the vocabulary bank when a mini quiz starts.",
    "settings.collapseSourceLabel": "Open Vocabulary with source collapsed",
    "settings.collapseSourceDescription": "Give Vocabulary Bank more room by default.",
    "settings.interfaceEyebrow": "Interface",
    "settings.interfaceTitle": "Comfort",
    "settings.reduceMotionLabel": "Reduce motion",
    "settings.reduceMotionDescription": "Shorten animation and transition effects across the dashboard.",
    "settings.localNote": "Settings are stored locally in this browser.",
    "settings.profileSaved": "Profile updated.",
    "settings.passwordSaved": "Password updated.",
    "settings.passwordMismatch": "New password confirmation does not match.",
    "settings.avatarTooLarge": "Please choose an image up to 5 MB.",
    "settings.avatarInvalid": "Please choose a valid image file.",
    "control.difficulty": "Difficulty",
    "control.questionType": "Question Type",
    "difficulty.easy": "Easy",
    "difficulty.medium": "Medium",
    "difficulty.hard": "Hard",
    "questionType.mixed": "Mixed",
    "questionType.inference": "Inference",
    "questionType.vocabulary": "Vocabulary",
    "questionType.mainIdea": "Main idea",
    "questionType.detail": "Detail",
    "status.all": "All",
    "status.completed": "Completed",
    "status.quizReady": "Quiz Ready",
    "status.quizGenerated": "Quiz Generated",
    "common.search": "Search",
    "common.status": "Status",
    "common.date": "Date",
    "common.titleOrVideo": "Title or video ID",
    "common.study": "Study",
    "common.words": "Words",
    "common.transcriptSource": "Transcript Source",
    "common.loadingTranscripts": "Loading transcripts.",
    "common.loadingTranscriptList": "Loading transcript list.",
    "common.couldNotLoadSessions": "Could not load sessions.",
    "common.noSessionsMatch": "No sessions match the current filters.",
    "dashboard.loading": "Loading dashboard.",
    "dashboard.error": "Could not load dashboard.",
    "dashboard.accuracyTrend": "Accuracy Trend",
    "dashboard.accuracyCopy": "Daily listening accuracy from saved sessions.",
    "dashboard.focusArea": "Focus Area",
    "dashboard.focusCopy": "Based on wrong quiz answers.",
    "dashboard.weakestSkill": "Weakest Skill",
    "dashboard.quizScore": "Quiz Score",
    "dashboard.quizScoreCopy": "Daily average from saved attempts.",
    "dashboard.continueLearning": "Continue Learning",
    "dashboard.continueCopy": "Open one flow, then move between transcript, quiz, attempts, and vocabulary.",
    "dashboard.noSessionsYet": "No sessions yet.",
    "dashboard.notEnoughQuiz": "Not enough quiz data",
    "dashboard.focusSummary": "Submit quizzes to identify your focus area.",
    "dashboard.misses": "misses",
    "dashboard.consistency": "Study Consistency",
    "dashboard.consistencyCopy": "Weekly session rhythm. Goal: at least 3 focused sessions.",
    "dashboard.latest": "Latest",
    "dashboard.average": "Average",
    "dashboard.change": "Change",
    "dashboard.target": "Target",
    "dashboard.dataPoints": "Data",
    "dashboard.onTrack": "On track",
    "dashboard.needsWork": "Needs work",
    "dashboard.improving": "Improving",
    "dashboard.declining": "Dropping",
    "dashboard.stable": "Stable",
    "dashboard.noAnalyticsData": "No trend data yet. Complete sessions or submit quizzes to unlock this chart.",
    "sessions.workspace": "Study Workspace",
    "sessions.emptyCopy": "Select a session to review transcript, generate a quiz, and inspect saved attempts.",
    "sessions.selected": "Selected Session",
    "sessions.readingQuiz": "Reading Quiz",
    "sessions.attempts": "Attempts",
    "sessions.loadingSelected": "Loading selected transcript.",
    "sessions.workspaceAria": "Session workspace",
    "sessions.summary": "sessions in this workspace.",
    "learningPath.title": "Learning Path",
    "learningPath.copy": "Follow this session from transcript to review.",
    "learningPath.progress": "steps complete",
    "learningPath.done": "Done",
    "learningPath.ready": "Ready",
    "learningPath.next": "Next",
    "learningPath.locked": "Locked",
    "learningPath.open": "Open",
    "learningPath.start": "Start",
    "learningPath.review": "Review",
    "learningPath.generate": "Generate",
    "learningPath.track": "Track",
    "learningPath.transcriptTitle": "Study transcript",
    "learningPath.transcriptCopy": "Read the source text and notice key ideas.",
    "learningPath.shadowingTitle": "Listening and shadowing",
    "learningPath.shadowingCopy": "Complete listening practice and capture accuracy.",
    "learningPath.quizTitle": "Generate reading quiz",
    "learningPath.quizCopy": "Create focused questions from the transcript.",
    "learningPath.answerTitle": "Answer quiz",
    "learningPath.answerCopy": "Choose answers and submit the attempt.",
    "learningPath.reviewTitle": "Review mistakes",
    "learningPath.reviewCopy": "Check wrong answers and explanations.",
    "learningPath.vocabTitle": "Save vocabulary",
    "learningPath.vocabCopy": "Extract useful words and star the ones to keep.",
    "learningPath.vocabQuizTitle": "Review vocabulary",
    "learningPath.vocabQuizCopy": "Use mini quiz to recall saved words.",
    "learningPath.progressTitle": "Track progress",
    "learningPath.progressCopy": "Return to dashboard to read your learning trend.",
    "learningPath.transcriptPreview": "Transcript Preview",
    "quizHistory.loadingSessions": "Loading sessions first.",
    "quizHistory.loading": "Loading quiz history.",
    "quizHistory.error": "Could not load quiz history.",
    "quizHistory.openToLoad": "Open this view to load saved quiz attempts.",
    "quizHistory.load": "Load History",
    "quizHistory.noAttempts": "No submitted quiz attempts yet.",
    "vocab.source": "Vocabulary Source",
    "vocab.sourceCopy": "Pick the transcript that owns the word bank.",
    "vocab.loading": "Loading transcripts.",
    "vocab.empty": "No transcripts yet. Complete a session before building vocabulary.",
  },
  vi: {
    "nav.dashboard": "Tổng quan",
    "nav.sessions": "Buổi học",
    "nav.quizHistory": "Lịch sử quiz",
    "nav.vocabulary": "Từ vựng",
    "nav.settings": "Cài đặt",
    "view.dashboard.title": "Tổng quan",
    "view.dashboard.context": "Theo dõi tiến độ học tập",
    "view.sessions.title": "Buổi học",
    "view.sessions.context": "Transcript, quiz đọc hiểu và lịch sử làm bài",
    "view.quiz-history.title": "Lịch sử quiz",
    "view.quiz-history.context": "Xem lại các lần làm quiz đã lưu",
    "view.vocabulary.title": "Từ vựng",
    "view.vocabulary.context": "Từ vựng từ transcript và mini quiz",
    "view.settings.title": "Cài đặt",
    "view.settings.context": "Tài khoản và mặc định học tập",
    "shell.loadingLearner": "Đang tải người học",
    "shell.language": "Ngôn ngữ",
    "shell.newPractice": "Luyện bài mới",
    "shell.signOut": "Đăng xuất",
    "shell.vocabulary": "Từ vựng",
    "shell.studySession": "Buổi học",
    "metric.totalSessions": "Tổng buổi học",
    "metric.savedTranscripts": "Transcript đã lưu",
    "metric.averageAccuracy": "Độ chính xác TB",
    "metric.totalQuizzes": "Tổng quiz",
    "metric.averageQuizScore": "Điểm quiz TB",
    "settings.eyebrow": "Trung tâm tài khoản",
    "settings.title": "Cài đặt",
    "settings.copy": "Quản lý hồ sơ, mật khẩu, ngôn ngữ và mặc định học tập.",
    "settings.reset": "Đặt lại cài đặt máy này",
    "settings.accountEyebrow": "Tài khoản",
    "settings.accountTitle": "Hồ sơ và ảnh đại diện",
    "settings.avatarHint": "Nên dùng PNG, JPG hoặc SVG tối đa 5 MB.",
    "settings.chooseAvatar": "Chọn ảnh",
    "settings.removeAvatar": "Xóa ảnh",
    "settings.username": "Tên hiển thị",
    "settings.email": "Email",
    "settings.emailHelp": "Email dùng để đăng nhập nên chưa chỉnh ở đây.",
    "settings.preferredLanguage": "Ngôn ngữ giao diện",
    "settings.saveProfile": "Lưu hồ sơ",
    "settings.signedIn": "Đã đăng nhập",
    "settings.sessionTitle": "Phiên đăng nhập",
    "settings.sessionCopy": "Đăng xuất khỏi trình duyệt này và quay lại trang đăng nhập.",
    "settings.passwordEyebrow": "Bảo mật",
    "settings.passwordTitle": "Đổi mật khẩu",
    "settings.currentPassword": "Mật khẩu hiện tại",
    "settings.newPassword": "Mật khẩu mới",
    "settings.confirmPassword": "Nhập lại mật khẩu mới",
    "settings.updatePassword": "Cập nhật mật khẩu",
    "settings.quizEyebrow": "Quiz",
    "settings.quizTitle": "Mặc định câu hỏi",
    "settings.vocabEyebrow": "Từ vựng",
    "settings.vocabTitle": "Hành vi luyện tập",
    "settings.autoMaskLabel": "Ẩn word bank khi làm Vocabulary Check",
    "settings.autoMaskDescription": "Tự làm mờ Vocabulary Bank khi bắt đầu mini quiz.",
    "settings.collapseSourceLabel": "Mở Vocabulary với nguồn transcript đã thu gọn",
    "settings.collapseSourceDescription": "Cho Vocabulary Bank thêm không gian hiển thị.",
    "settings.interfaceEyebrow": "Giao diện",
    "settings.interfaceTitle": "Độ thoải mái",
    "settings.reduceMotionLabel": "Giảm chuyển động",
    "settings.reduceMotionDescription": "Rút ngắn hiệu ứng chuyển động trong dashboard.",
    "settings.localNote": "Một số cài đặt được lưu trên trình duyệt này.",
    "settings.profileSaved": "Đã cập nhật hồ sơ.",
    "settings.passwordSaved": "Đã cập nhật mật khẩu.",
    "settings.passwordMismatch": "Mật khẩu mới nhập lại chưa khớp.",
    "settings.avatarTooLarge": "Vui lòng chọn ảnh tối đa 5 MB.",
    "settings.avatarInvalid": "Vui lòng chọn đúng file ảnh.",
    "control.difficulty": "Độ khó",
    "control.questionType": "Dạng câu hỏi",
    "difficulty.easy": "Dễ",
    "difficulty.medium": "Trung bình",
    "difficulty.hard": "Khó",
    "questionType.mixed": "Kết hợp",
    "questionType.inference": "Suy luận",
    "questionType.vocabulary": "Từ vựng",
    "questionType.mainIdea": "Ý chính",
    "questionType.detail": "Chi tiết",
    "status.all": "Tất cả",
    "status.completed": "Hoàn thành",
    "status.quizReady": "Sẵn sàng tạo quiz",
    "status.quizGenerated": "Đã tạo quiz",
    "common.search": "Tìm kiếm",
    "common.status": "Trạng thái",
    "common.date": "Ngày",
    "common.titleOrVideo": "Tiêu đề hoặc video ID",
    "common.study": "Học",
    "common.words": "Từ vựng",
    "common.transcriptSource": "Nguồn transcript",
    "common.loadingTranscripts": "Đang tải transcript.",
    "common.loadingTranscriptList": "Đang tải danh sách transcript.",
    "common.couldNotLoadSessions": "Không tải được buổi học.",
    "common.noSessionsMatch": "Không có buổi học phù hợp bộ lọc.",
    "dashboard.loading": "Đang tải tổng quan.",
    "dashboard.error": "Không tải được tổng quan.",
    "dashboard.accuracyTrend": "Xu hướng độ chính xác",
    "dashboard.accuracyCopy": "Độ chính xác nghe mỗi ngày từ các buổi đã lưu.",
    "dashboard.focusArea": "Điểm cần tập trung",
    "dashboard.focusCopy": "Dựa trên các câu quiz làm sai.",
    "dashboard.weakestSkill": "Kỹ năng yếu nhất",
    "dashboard.quizScore": "Điểm quiz",
    "dashboard.quizScoreCopy": "Điểm trung bình mỗi ngày từ các lần làm đã lưu.",
    "dashboard.continueLearning": "Tiếp tục học",
    "dashboard.continueCopy": "Mở một luồng học rồi chuyển giữa transcript, quiz, attempts và từ vựng.",
    "dashboard.noSessionsYet": "Chưa có buổi học nào.",
    "dashboard.notEnoughQuiz": "Chưa đủ dữ liệu quiz",
    "dashboard.focusSummary": "Làm thêm vài quiz để xác định phần cần tập trung.",
    "dashboard.misses": "lần sai",
    "dashboard.consistency": "Nhịp học theo tuần",
    "dashboard.consistencyCopy": "Số buổi học mỗi tuần. Mục tiêu: ít nhất 3 buổi tập trung.",
    "dashboard.latest": "Mới nhất",
    "dashboard.average": "Trung bình",
    "dashboard.change": "Thay đổi",
    "dashboard.target": "Mục tiêu",
    "dashboard.dataPoints": "Dữ liệu",
    "dashboard.onTrack": "Đạt nhịp",
    "dashboard.needsWork": "Cần cải thiện",
    "dashboard.improving": "Đang tăng",
    "dashboard.declining": "Đang giảm",
    "dashboard.stable": "Ổn định",
    "dashboard.noAnalyticsData": "Chưa có dữ liệu xu hướng. Hoàn thành buổi học hoặc nộp quiz để mở biểu đồ này.",
    "sessions.workspace": "Không gian học",
    "sessions.emptyCopy": "Chọn một buổi học để xem transcript, tạo quiz và xem lại các lần làm.",
    "sessions.selected": "Buổi học đã chọn",
    "sessions.readingQuiz": "Quiz đọc hiểu",
    "sessions.attempts": "Lần làm",
    "sessions.loadingSelected": "Đang tải transcript đã chọn.",
    "sessions.workspaceAria": "Không gian buổi học",
    "sessions.summary": "buổi học trong không gian này.",
    "learningPath.title": "Lộ trình học",
    "learningPath.copy": "Đi theo từng bước của buổi học này.",
    "learningPath.progress": "bước hoàn thành",
    "learningPath.done": "Xong",
    "learningPath.ready": "Sẵn sàng",
    "learningPath.next": "Bước tiếp",
    "learningPath.locked": "Chưa mở",
    "learningPath.open": "Mở",
    "learningPath.start": "Bắt đầu",
    "learningPath.review": "Xem lại",
    "learningPath.generate": "Tạo quiz",
    "learningPath.track": "Theo dõi",
    "learningPath.transcriptTitle": "Học transcript",
    "learningPath.transcriptCopy": "Đọc nội dung gốc và nắm ý chính.",
    "learningPath.shadowingTitle": "Listening và shadowing",
    "learningPath.shadowingCopy": "Hoàn thành bài nghe và ghi nhận accuracy.",
    "learningPath.quizTitle": "Sinh quiz đọc hiểu",
    "learningPath.quizCopy": "Tạo câu hỏi tập trung từ transcript.",
    "learningPath.answerTitle": "Làm quiz",
    "learningPath.answerCopy": "Chọn đáp án và nộp lần làm.",
    "learningPath.reviewTitle": "Xem lỗi sai",
    "learningPath.reviewCopy": "Xem đáp án sai và explanation.",
    "learningPath.vocabTitle": "Lưu từ vựng",
    "learningPath.vocabCopy": "Trích từ khó và đánh dấu từ cần giữ.",
    "learningPath.vocabQuizTitle": "Ôn từ vựng",
    "learningPath.vocabQuizCopy": "Làm mini quiz để nhớ từ đã học.",
    "learningPath.progressTitle": "Theo dõi tiến độ",
    "learningPath.progressCopy": "Quay lại dashboard để xem xu hướng học.",
    "learningPath.transcriptPreview": "Xem transcript",
    "quizHistory.loadingSessions": "Đang tải buổi học trước.",
    "quizHistory.loading": "Đang tải lịch sử quiz.",
    "quizHistory.error": "Không tải được lịch sử quiz.",
    "quizHistory.openToLoad": "Mở màn này để tải các lần làm quiz đã lưu.",
    "quizHistory.load": "Tải lịch sử",
    "quizHistory.noAttempts": "Chưa có lần làm quiz nào.",
    "vocab.source": "Nguồn từ vựng",
    "vocab.sourceCopy": "Chọn transcript sở hữu bộ từ vựng.",
    "vocab.loading": "Đang tải transcript.",
    "vocab.empty": "Chưa có transcript. Hãy hoàn thành một buổi học trước khi tạo từ vựng.",
  },
}

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
  activeStudyTab: "path",
  activeSelectionRequestId: 0,
  loadingSessionIds: new Set(),
  sessionDetailErrorsById: new Map(),
  sessionDetailsById: new Map(),
  expandedTranscriptSessionIds: new Set(),
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
  reviewedAttemptSessionIds: new Set(),
  reflectedSessionIds: new Set(),
  quizHistoryState: "empty",
  quizHistoryError: "",
  quizAttempts: [],
  activeGlobalAttemptId: null,
  vocabularyState: "empty",
  vocabularyError: "",
  vocabularySourceMode: "session",
  savedVocabularyState: "idle",
  savedVocabularyError: "",
  vocabularyBySessionId: new Map(),
  maskedVocabularySessionIds: new Set(),
  isVocabularySourceCollapsed:
    window.localStorage.getItem("dashboard_collapse_vocabulary_source") === "true",
  wordSearchTerm: "",
  difficultyFilter: "all",
  savedOnly: false,
  vocabQuizState: "empty",
  vocabQuizError: "",
  vocabQuizBySessionId: new Map(),
  vocabQuizAnswersBySessionId: new Map(),
  settings: {
    language: window.localStorage.getItem("dashboard_language") ?? "en",
    defaultDifficulty: window.localStorage.getItem("dashboard_default_difficulty") ?? "medium",
    defaultQuestionType: window.localStorage.getItem("dashboard_default_question_type") ?? "mixed",
    autoMaskVocabulary:
      window.localStorage.getItem("dashboard_auto_mask_vocabulary") !== "false",
    collapseVocabularySource:
      window.localStorage.getItem("dashboard_collapse_vocabulary_source") === "true",
    reduceMotion: window.localStorage.getItem("dashboard_reduce_motion") === "true",
  },
  accountNotice: "",
  accountNoticeTone: "success",
  passwordNotice: "",
  passwordNoticeTone: "success",
}

const elements = {
  avatar: document.getElementById("dashboard-avatar"),
  userline: document.getElementById("dashboard-userline"),
  newPracticeButton: document.getElementById("dashboard-new-practice"),
  signOutButton: document.getElementById("dashboard-sign-out"),
  topbarVocabularyButton: document.getElementById("topbar-vocabulary-button"),
  topbarStudyButton: document.getElementById("topbar-study-button"),
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

const SCROLL_SNAPSHOT_SELECTORS = [
  ".session-list",
  ".study-content",
  ".attempt-list",
  ".attempt-review-panel",
  ".word-list",
  ".mini-quiz-body",
]

const escapeHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

const normalizeLanguage = (language) => {
  return language === "vi" ? "vi" : "en"
}

const t = (key) => {
  const language = normalizeLanguage(state.settings.language)
  return I18N[language]?.[key] ?? I18N.en[key] ?? key
}

const localize = (english, vietnamese) => {
  return normalizeLanguage(state.settings.language) === "vi" ? vietnamese : english
}

const applyLanguage = () => {
  const language = normalizeLanguage(state.settings.language)
  document.documentElement.lang = language === "vi" ? "vi" : "en"
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

const formatWordCount = (count) => {
  return state.settings.language === "vi" ? `${count} từ` : `${count} words`
}

const getQuizStatusLabel = (status) => {
  if (status === "Completed") {
    return t("status.completed")
  }
  if (status === "Quiz Ready") {
    return t("status.quizReady")
  }
  if (status === "Quiz Generated") {
    return t("status.quizGenerated")
  }
  return status
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

const buildAvatarContent = (user) => {
  if (user?.avatar_url) {
    return `<img src="${escapeHtml(user.avatar_url)}" alt="" />`
  }

  return `<span>${escapeHtml(buildAvatarInitials(user?.username))}</span>`
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

const getSavedVocabularyItems = () => {
  return state.sessions.flatMap((session) => {
    const items = state.vocabularyBySessionId.get(session.sessionId) ?? []
    return items
      .filter((item) => item.isSaved)
      .map((item) => ({
        ...item,
        sourceSessionId: session.sessionId,
        sourceTitle: session.videoTitle,
        sourceDate: session.completedAt,
      }))
  })
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
  elements.viewTitle.textContent = t(`view.${view}.title`)
  elements.contextSummary.textContent = t(`view.${view}.context`)
  elements.main.classList.toggle(
    "is-compact-workspace",
    view === "sessions" || view === "vocabulary" || view === "settings",
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
  if (view === "vocabulary" && state.vocabularySourceMode === "saved") {
    void loadAllVocabulary()
  } else if (view === "vocabulary" && state.selectedSessionId) {
    void loadVocabulary(state.selectedSessionId)
  }

  renderActiveView()
}

const renderShell = () => {
  const user = state.profile?.user
  elements.avatar.innerHTML = buildAvatarContent(user)
  elements.userline.textContent = user ? `${user.username} / ${user.email}` : t("shell.loadingLearner")
  elements.newPracticeButton.textContent = t("shell.newPractice")
  elements.signOutButton.textContent = t("shell.signOut")
  elements.topbarVocabularyButton.textContent = t("shell.vocabulary")
  elements.topbarStudyButton.textContent = t("shell.studySession")
  for (const [view, labelKey] of [
    ["dashboard", "nav.dashboard"],
    ["sessions", "nav.sessions"],
    ["quiz-history", "nav.quizHistory"],
    ["vocabulary", "nav.vocabulary"],
    ["settings", "nav.settings"],
  ]) {
    const item = elements.nav.querySelector(`[data-view="${view}"]`)
    if (item) {
      item.textContent = t(labelKey)
    }
  }
}

const buildStateMarkup = (message, { error = false } = {}) => {
  return `
    <div class="state-block ${error ? "state-error" : ""}">
      <p class="state-copy">${escapeHtml(message)}</p>
    </div>
  `
}

const captureScrollSnapshot = (root) => {
  if (!root) {
    return []
  }

  return SCROLL_SNAPSHOT_SELECTORS.flatMap((selector) => {
    return [...root.querySelectorAll(selector)].map((element, index) => ({
      selector,
      index,
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
    }))
  })
}

const restoreScrollSnapshot = (root, snapshot) => {
  if (!root || snapshot.length === 0) {
    return
  }

  window.requestAnimationFrame(() => {
    for (const item of snapshot) {
      const target = root.querySelectorAll(item.selector)[item.index]
      if (!target) {
        continue
      }
      target.scrollLeft = item.scrollLeft
      target.scrollTop = item.scrollTop
    }
  })
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
    [t("metric.totalSessions"), stats.total_sessions ?? "--"],
    [t("metric.savedTranscripts"), stats.saved_transcripts ?? "--"],
    [t("metric.averageAccuracy"), formatPercent(stats.average_accuracy)],
    [t("metric.totalQuizzes"), stats.total_quizzes ?? "--"],
    [t("metric.averageQuizScore"), formatPercent(stats.average_quiz_score)],
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

const roundMetric = (value) => {
  return Math.round(Number(value) * 10) / 10
}

const formatChartValue = (value, unit = "%") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--"
  }

  const roundedValue = roundMetric(value)
  return unit === "%" ? `${roundedValue}%` : String(roundedValue)
}

const formatSignedChartValue = (value, unit = "%") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--"
  }

  const roundedValue = roundMetric(value)
  const sign = roundedValue > 0 ? "+" : ""
  return `${sign}${formatChartValue(roundedValue, unit)}`
}

const getTrendTone = (delta) => {
  if (delta > 1) {
    return "improving"
  }
  if (delta < -1) {
    return "declining"
  }
  return "stable"
}

const formatChartCount = (count, type) => {
  const normalizedCount = Number(count ?? 0)
  if (type === "quiz") {
    return localize(
      `${normalizedCount} attempt${normalizedCount === 1 ? "" : "s"}`,
      `${normalizedCount} lần làm`,
    )
  }
  if (type === "week") {
    return localize(
      `${normalizedCount} session${normalizedCount === 1 ? "" : "s"}`,
      `${normalizedCount} buổi`,
    )
  }
  return localize(
    `${normalizedCount} session${normalizedCount === 1 ? "" : "s"}`,
    `${normalizedCount} buổi`,
  )
}

const buildChartInsight = ({ latest, previous, average, goal, unit, type }) => {
  const delta = previous === null ? null : latest - previous
  const trendTone = delta === null ? "stable" : getTrendTone(delta)
  const isOnTrack = latest >= goal
  const metricName =
    type === "quiz"
      ? localize("quiz score", "điểm quiz")
      : type === "week"
        ? localize("weekly practice rhythm", "nhịp học theo tuần")
        : localize("listening accuracy", "độ chính xác nghe")
  const trendCopy =
    delta === null
      ? localize("Need one more data point to compare trend.", "Cần thêm một mốc dữ liệu để so sánh xu hướng.")
      : localize(
          `${t(`dashboard.${trendTone}`)} by ${formatSignedChartValue(delta, unit)} from the previous point.`,
          `${t(`dashboard.${trendTone}`)} ${formatSignedChartValue(delta, unit)} so với mốc trước.`,
        )

  return `
    <div class="analytics-insight ${isOnTrack ? "is-good" : "is-warning"}">
      <strong>${escapeHtml(isOnTrack ? t("dashboard.onTrack") : t("dashboard.needsWork"))}</strong>
      <span>${escapeHtml(
        localize(
          `Latest ${metricName} is ${formatChartValue(latest, unit)}; average is ${formatChartValue(average, unit)}; target is ${formatChartValue(goal, unit)}. ${trendCopy}`,
          `${metricName} mới nhất là ${formatChartValue(latest, unit)}; trung bình ${formatChartValue(average, unit)}; mục tiêu ${formatChartValue(goal, unit)}. ${trendCopy}`,
        ),
      )}</span>
    </div>
  `
}

const buildLearningChart = ({
  items,
  valueKey,
  labelKey,
  countKey,
  type = "accuracy",
  goal = 85,
  unit = "%",
  maxValue = 100,
}) => {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p class="state-copy">${escapeHtml(t("dashboard.noAnalyticsData"))}</p>`
  }

  const values = items.map((item) => Number(item[valueKey] ?? 0)).filter((value) => Number.isFinite(value))
  if (values.length === 0) {
    return `<p class="state-copy">${escapeHtml(t("dashboard.noAnalyticsData"))}</p>`
  }

  const latest = values[values.length - 1]
  const previous = values.length > 1 ? values[values.length - 2] : null
  const average = values.reduce((total, value) => total + value, 0) / values.length
  const delta = previous === null ? null : latest - previous
  const resolvedMax = unit === "%" ? 100 : Math.max(maxValue, goal, ...values, 1)
  const goalPosition = Math.min(100, Math.max(0, (goal / resolvedMax) * 100))
  const axisValues =
    unit === "%"
      ? [resolvedMax, resolvedMax * 0.75, resolvedMax * 0.5, resolvedMax * 0.25, 0]
      : [...new Set([resolvedMax, Math.ceil(resolvedMax * 0.67), Math.ceil(resolvedMax * 0.34), 0])]
  const totalCount = countKey
    ? items.reduce((total, item) => total + Number(item[countKey] ?? 0), 0)
    : values.length
  const trendTone = delta === null ? "stable" : getTrendTone(delta)

  return `
    <div class="analytics-kpi-row">
      <div class="analytics-kpi">
        <span>${escapeHtml(t("dashboard.latest"))}</span>
        <strong>${escapeHtml(formatChartValue(latest, unit))}</strong>
      </div>
      <div class="analytics-kpi">
        <span>${escapeHtml(t("dashboard.average"))}</span>
        <strong>${escapeHtml(formatChartValue(average, unit))}</strong>
      </div>
      <div class="analytics-kpi">
        <span>${escapeHtml(t("dashboard.change"))}</span>
        <strong class="is-${trendTone}">${escapeHtml(delta === null ? "--" : formatSignedChartValue(delta, unit))}</strong>
      </div>
      <div class="analytics-kpi">
        <span>${escapeHtml(t("dashboard.dataPoints"))}</span>
        <strong>${escapeHtml(formatChartCount(totalCount, type))}</strong>
      </div>
    </div>
    <div class="analytics-chart">
      <div class="analytics-y-axis" aria-hidden="true">
        ${axisValues.map((value) => `<span>${escapeHtml(formatChartValue(value, unit))}</span>`).join("")}
      </div>
      <div class="analytics-plot">
        <span class="analytics-goal-line" style="bottom: ${goalPosition}%">
          <em>${escapeHtml(`${t("dashboard.target")} ${formatChartValue(goal, unit)}`)}</em>
        </span>
        <div class="analytics-bars">
          ${items
            .map((item) => {
              const value = Number(item[valueKey] ?? 0)
              const height = Math.max(4, Math.round((value / resolvedMax) * 100))
              const label = formatShortDate(item[labelKey])
              const count = countKey ? Number(item[countKey] ?? 0) : 1
              const countLabel = formatChartCount(count, type)
              return `
                <div class="analytics-bar is-${type}" title="${escapeHtml(`${label}: ${formatChartValue(value, unit)} / ${countLabel}`)}">
                  <span class="analytics-bar-value">${escapeHtml(formatChartValue(value, unit))}</span>
                  <span class="analytics-bar-track">
                    <span class="analytics-bar-fill" style="height: ${height}%"></span>
                  </span>
                  <span class="analytics-bar-label">${escapeHtml(label)}</span>
                  <span class="analytics-bar-count">${escapeHtml(countLabel)}</span>
                </div>
              `
            })
            .join("")}
        </div>
      </div>
    </div>
    ${buildChartInsight({ latest, previous, average, goal, unit, type })}
  `
}

const buildBars = ({ items, valueKey, labelKey, type = "accuracy", maxValue = 100 }) => {
  const countKey = type === "quiz" ? "attempt_count" : type === "week" ? "session_count" : "session_count"
  const goal = type === "quiz" ? 80 : type === "week" ? 3 : 85
  const unit = type === "week" ? "" : "%"
  return buildLearningChart({
    items,
    valueKey,
    labelKey,
    countKey,
    type,
    goal,
    unit,
    maxValue,
  })
}

const buildSessionRail = ({
  title = t("common.transcriptSource"),
  summary = "",
  collapsible = false,
  collapsed = false,
  includeSavedVocabulary = false,
} = {}) => {
  if (state.sessionsState === "loading") {
    return `
      <aside class="session-rail ${collapsed ? "is-collapsed" : ""}">
        <div class="card-header">
          <div>
            <h3 class="card-title">${escapeHtml(title)}</h3>
            <p class="panel-subtext">${escapeHtml(t("common.loadingTranscriptList"))}</p>
          </div>
        </div>
        ${buildLoadingMarkup(t("common.loadingTranscripts"))}
      </aside>
    `
  }

  if (state.sessionsState === "error") {
    return `
      <aside class="session-rail ${collapsed ? "is-collapsed" : ""}">
        <div class="card-header">
          <div>
            <h3 class="card-title">${escapeHtml(title)}</h3>
            <p class="panel-subtext">${escapeHtml(t("common.couldNotLoadSessions"))}</p>
          </div>
        </div>
        ${buildStateMarkup(state.sessionsError || t("common.couldNotLoadSessions"), { error: true })}
      </aside>
    `
  }

  const sessions = getFilteredSessions()
  const savedVocabularyCount = getSavedVocabularyItems().length
  return `
    <aside class="session-rail ${collapsed ? "is-collapsed" : ""}">
      <div class="card-header">
        <div class="session-rail-heading">
          <h3 class="card-title">${escapeHtml(title)}</h3>
          <p class="panel-subtext">${escapeHtml(summary || `${sessions.length} ${t("sessions.summary")}`)}</p>
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
      <div class="session-list" aria-live="polite" aria-hidden="${collapsed}">
        ${
          includeSavedVocabulary
            ? `
              <button
                type="button"
                class="session-button saved-source-button ${state.vocabularySourceMode === "saved" ? "is-selected" : ""}"
                data-select-saved-vocabulary
                aria-pressed="${state.vocabularySourceMode === "saved"}"
              >
                <h4 class="session-title">Saved Vocabulary</h4>
                <div class="item-meta">
                  <span>All transcript sources</span>
                  <span class="badge is-green">${savedVocabularyCount} saved</span>
                </div>
              </button>
            `
            : ""
        }
        ${
          sessions.length === 0
            ? buildStateMarkup(t("common.noSessionsMatch"))
            : sessions
                .map((session) => {
                  const isSelected =
                    (!includeSavedVocabulary || state.vocabularySourceMode !== "saved") &&
                    session.sessionId === state.selectedSessionId
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
    panel.innerHTML = buildLoadingMarkup(t("dashboard.loading"))
    return
  }
  if (state.profileState === "error" || !state.profile) {
    panel.innerHTML = buildStateMarkup(state.profileError || t("dashboard.error"), {
      error: true,
    })
    return
  }

  const analytics = state.profile.analytics ?? {}
  const weakestSkill = analytics.weakest_skill ?? {
    label: t("dashboard.notEnoughQuiz"),
    missed_count: 0,
    summary: t("dashboard.focusSummary"),
  }
  const recentSessions = state.sessions.slice(0, 4)

  panel.innerHTML = `
    ${buildMetricGrid()}
    <div class="dashboard-grid">
      <article class="content-card analytics-card">
        <div>
          <h3 class="card-title">${escapeHtml(t("dashboard.accuracyTrend"))}</h3>
          <p class="panel-subtext">${escapeHtml(t("dashboard.accuracyCopy"))}</p>
        </div>
        ${buildBars({
          items: analytics.accuracy_by_day ?? [],
          valueKey: "average_accuracy",
          labelKey: "date",
          type: "accuracy",
          maxValue: 100,
        })}
      </article>
      <article class="content-card insight-card">
        <div>
          <h3 class="card-title">${escapeHtml(t("dashboard.focusArea"))}</h3>
          <p class="panel-subtext">${escapeHtml(t("dashboard.focusCopy"))}</p>
        </div>
        <div class="timeline-card">
          <span class="section-label">${escapeHtml(t("dashboard.weakestSkill"))}</span>
          <h3 class="card-title">${escapeHtml(weakestSkill.label)}</h3>
          <p class="state-copy">${escapeHtml(weakestSkill.summary)}</p>
          <span class="badge is-orange">${escapeHtml(weakestSkill.missed_count)} ${escapeHtml(t("dashboard.misses"))}</span>
        </div>
      </article>
      <article class="content-card analytics-card">
        <div>
          <h3 class="card-title">${escapeHtml(t("dashboard.quizScore"))}</h3>
          <p class="panel-subtext">${escapeHtml(t("dashboard.quizScoreCopy"))}</p>
        </div>
        ${buildBars({
          items: analytics.quiz_score_by_day ?? [],
          valueKey: "average_score",
          labelKey: "date",
          type: "quiz",
          maxValue: 100,
        })}
      </article>
      <article class="content-card analytics-card">
        <div>
          <h3 class="card-title">${escapeHtml(t("dashboard.consistency"))}</h3>
          <p class="panel-subtext">${escapeHtml(t("dashboard.consistencyCopy"))}</p>
        </div>
        ${buildBars({
          items: analytics.sessions_by_week ?? [],
          valueKey: "session_count",
          labelKey: "week_start",
          type: "week",
          maxValue: 3,
        })}
      </article>
      <article class="content-card">
        <div>
          <h3 class="card-title">${escapeHtml(t("dashboard.continueLearning"))}</h3>
          <p class="panel-subtext">${escapeHtml(t("dashboard.continueCopy"))}</p>
        </div>
        <div class="list-grid">
          ${
            recentSessions.length === 0
              ? `<p class="state-copy">${escapeHtml(t("dashboard.noSessionsYet"))}</p>`
              : recentSessions
                  .map((session) => {
                    return `
                      <div class="list-item">
                        <div>
                          <h4 class="item-title">${escapeHtml(session.videoTitle)}</h4>
                          <div class="item-meta">
                            <span>${escapeHtml(formatDate(session.completedAt))}</span>
                            <span>${escapeHtml(formatPercent(session.accuracyScore))}</span>
                            <span>${escapeHtml(getQuizStatusLabel(session.quizStatus))}</span>
                          </div>
                        </div>
                        <div class="row-actions">
                          <button class="button-ghost" type="button" data-open-session="${session.sessionId}">${escapeHtml(t("common.study"))}</button>
                          <button class="button-ghost" type="button" data-open-vocabulary="${session.sessionId}">${escapeHtml(t("common.words"))}</button>
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

const buildLegacyLearningPathMarkup = (session, detail = null) => {
  const sessionId = session.sessionId
  const transcriptText = detail?.rawText ?? session.rawText ?? ""
  const hasTranscript = Boolean(transcriptText || session.wordCount > 0)
  const hasShadowing = session.accuracyScore !== null && session.accuracyScore !== undefined
  const accuracyScore = Number(session.accuracyScore ?? 0)
  const hasQuiz =
    session.quizStatus === "Quiz Generated" ||
    state.quizzesBySessionId.has(sessionId) ||
    (state.quizSessionId === sessionId && state.currentQuizQuestions.length > 0)
  const attempts = state.attemptHistoryBySessionId.get(sessionId) ?? []
  const submittedAttempt =
    state.currentQuizId && state.quizSessionId === sessionId
      ? state.submittedAttemptByQuizId.get(state.currentQuizId)
      : null
  const hasAttempt = attempts.length > 0 || Boolean(submittedAttempt)
  const latestAttempt = attempts[0] ?? submittedAttempt ?? null
  const latestQuiz = state.quizzesBySessionId.get(sessionId)
  const quizQuestionCount =
    state.quizSessionId === sessionId && state.currentQuizQuestions.length > 0
      ? state.currentQuizQuestions.length
      : latestQuiz?.questions?.length ?? 0
  const latestScore = latestAttempt?.score ?? null
  const wrongCount =
    latestAttempt === null
      ? null
      : Math.max(0, Number(latestAttempt.total_questions ?? 0) - Number(latestAttempt.correct_count ?? 0))
  const hasReviewedMistakes =
    latestAttempt !== null && (wrongCount === 0 || state.reviewedAttemptSessionIds.has(sessionId))
  const vocabularyItems = state.vocabularyBySessionId.get(sessionId) ?? []
  const savedVocabularyCount = vocabularyItems.filter((item) => item.isSaved).length
  const hasVocabularyLoaded = state.vocabularyBySessionId.has(sessionId)
  const vocabQuizQuestions = state.vocabQuizBySessionId.get(sessionId) ?? []
  const vocabQuizAnswers = state.vocabQuizAnswersBySessionId.get(sessionId) ?? {}
  const answeredVocabQuizCount = Object.keys(vocabQuizAnswers).length
  const hasCompletedVocabQuiz =
    vocabQuizQuestions.length > 0 && answeredVocabQuizCount >= vocabQuizQuestions.length
  const savedVocabularyTarget = 3
  const isReflected = state.reflectedSessionIds.has(sessionId)
  const clampScore = (score, weight) => Math.min(weight, Math.max(0, score))
  const buildCriteria = (items) => {
    return `
      <ul class="learning-criteria">
        ${items
          .map((item) => {
            return `
              <li class="${item.done ? "is-done" : ""}">
                <span aria-hidden="true">${item.done ? "✓" : "·"}</span>
                ${escapeHtml(item.label)}
              </li>
            `
          })
          .join("")}
      </ul>
    `
  }

  const phases = [
    {
      phase: localize("Input", "Tiếp nhận"),
      title: localize("Transcript and focused listening", "Transcript và nghe tập trung"),
      method: localize(
        "Build comprehension first, then verify what was actually heard.",
        "Hiểu nội dung trước, sau đó kiểm chứng phần nghe thật sự.",
      ),
      evidence: localize(
        `${formatWordCount(session.wordCount)} / ${formatPercent(session.accuracyScore)} accuracy`,
        `${formatWordCount(session.wordCount)} / accuracy ${formatPercent(session.accuracyScore)}`,
      ),
      target: localize("Transcript loaded and listening accuracy at least 85%.", "Có transcript và accuracy nghe từ 85% trở lên."),
      criteria: [
        { label: localize("Transcript available", "Có transcript"), done: hasTranscript },
        { label: localize("Listening accuracy recorded", "Đã ghi nhận accuracy"), done: hasShadowing },
        { label: localize("Accuracy target 85%+", "Accuracy đạt 85%+"), done: hasShadowing && accuracyScore >= 85 },
      ],
      score: clampScore((hasTranscript ? 10 : 0) + (hasShadowing ? 10 : 0) + (accuracyScore >= 85 ? 5 : 0), 25),
      weight: 25,
      locked: !hasTranscript,
      action: hasTranscript ? "transcript" : null,
      actionLabel: t("learningPath.review"),
    },
    {
      phase: localize("Active recall", "Gợi nhớ chủ động"),
      title: localize("Reading quiz attempt", "Làm quiz đọc hiểu"),
      method: localize(
        "Use retrieval practice: answer before seeing explanations.",
        "Dùng gợi nhớ chủ động: trả lời trước khi xem explanation.",
      ),
      evidence: localize(
        `${quizQuestionCount || 0} questions / latest score ${formatPercent(latestScore)}`,
        `${quizQuestionCount || 0} câu / điểm mới nhất ${formatPercent(latestScore)}`,
      ),
      target: localize("Generate quiz, submit one attempt, and reach 80%+.", "Tạo quiz, nộp một lần làm và đạt từ 80% trở lên."),
      criteria: [
        { label: localize("Quiz generated", "Đã sinh quiz"), done: hasQuiz },
        { label: localize("Attempt submitted", "Đã nộp bài"), done: hasAttempt },
        { label: localize("Score target 80%+", "Điểm đạt 80%+"), done: Number(latestScore ?? 0) >= 80 },
      ],
      score: clampScore((hasQuiz ? 8 : 0) + (hasAttempt ? 10 : 0) + (Number(latestScore ?? 0) >= 80 ? 7 : 0), 25),
      weight: 25,
      locked: !hasTranscript,
      action: hasQuiz ? "quiz" : "generate-quiz",
      actionLabel: hasQuiz ? t("learningPath.open") : t("learningPath.generate"),
    },
    {
      phase: localize("Feedback", "Sửa lỗi"),
      title: localize("Mistake review", "Xem và sửa lỗi sai"),
      method: localize(
        "Turn wrong answers into corrected rules, not just a score.",
        "Biến đáp án sai thành quy tắc đã sửa, không chỉ nhìn điểm.",
      ),
      evidence:
        wrongCount === null
          ? localize("No submitted attempt yet", "Chưa có lần làm đã nộp")
          : localize(`${wrongCount} wrong answers to review`, `${wrongCount} câu sai cần xem lại`),
      target: localize("Review every wrong answer and explanation.", "Xem lại từng câu sai và explanation."),
      criteria: [
        { label: localize("Attempt history exists", "Có lịch sử làm bài"), done: hasAttempt },
        { label: localize("Wrong answers reviewed", "Đã xem lỗi sai"), done: hasReviewedMistakes },
      ],
      score: clampScore((hasAttempt ? 8 : 0) + (hasReviewedMistakes ? 12 : 0), 20),
      weight: 20,
      locked: !hasAttempt,
      action: hasAttempt ? "attempts" : null,
      actionLabel: t("learningPath.review"),
    },
    {
      phase: localize("Consolidation", "Củng cố"),
      title: localize("Vocabulary bank and mini quiz", "Từ vựng và mini quiz"),
      method: localize(
        "Save difficult words, then recall them without looking at the bank.",
        "Lưu từ khó, sau đó tự nhớ lại mà không nhìn word bank.",
      ),
      evidence: localize(
        `${vocabularyItems.length} extracted / ${savedVocabularyCount} saved / ${answeredVocabQuizCount}/${vocabQuizQuestions.length} quiz answers`,
        `${vocabularyItems.length} từ trích ra / ${savedVocabularyCount} đã lưu / ${answeredVocabQuizCount}/${vocabQuizQuestions.length} câu ôn từ`,
      ),
      target: localize("Save at least 3 useful words and finish vocabulary check.", "Lưu ít nhất 3 từ hữu ích và hoàn thành vocabulary check."),
      criteria: [
        { label: localize("Vocabulary extracted", "Đã trích từ vựng"), done: hasVocabularyLoaded },
        {
          label: localize(`Save ${savedVocabularyTarget}+ words`, `Lưu ${savedVocabularyTarget}+ từ`),
          done: savedVocabularyCount >= savedVocabularyTarget,
        },
        { label: localize("Mini quiz completed", "Hoàn thành mini quiz"), done: hasCompletedVocabQuiz },
      ],
      score: clampScore(
        (hasVocabularyLoaded ? 5 : 0) +
          Math.min(savedVocabularyCount, savedVocabularyTarget) * (10 / savedVocabularyTarget) +
          (hasCompletedVocabQuiz ? 5 : 0),
        20,
      ),
      weight: 20,
      locked: !hasTranscript,
      action: savedVocabularyCount > 0 || vocabularyItems.length > 0 ? "vocab-quiz" : "vocabulary",
      actionLabel: savedVocabularyCount > 0 ? t("learningPath.start") : t("learningPath.open"),
    },
    {
      phase: localize("Reflection", "Phản tư"),
      title: localize("Progress decision", "Quyết định bước tiếp theo"),
      method: localize(
        "Use trend data to decide whether to repeat, retake, or move on.",
        "Dựa vào xu hướng để quyết định luyện lại, làm lại quiz hay học bài mới.",
      ),
      evidence: localize(
        hasAttempt ? "Attempt saved into analytics" : "No attempt in analytics yet",
        hasAttempt ? "Lần làm đã được lưu vào analytics" : "Chưa có lần làm trong analytics",
      ),
      target: localize("Check dashboard after the feedback loop.", "Xem dashboard sau vòng sửa lỗi."),
      criteria: [
        { label: localize("Attempt contributes to analytics", "Lần làm đóng góp vào analytics"), done: hasAttempt },
        { label: localize("Dashboard checked", "Đã xem dashboard"), done: isReflected },
      ],
      score: clampScore((hasAttempt ? 4 : 0) + (isReflected ? 6 : 0), 10),
      weight: 10,
      locked: !hasAttempt,
      action: "dashboard",
      actionLabel: t("learningPath.track"),
    },
  ]

  const totalWeight = phases.reduce((total, phase) => total + phase.weight, 0)
  const earnedWeight = phases.reduce((total, phase) => total + Math.min(phase.score, phase.weight), 0)
  const progressPercent = Math.round((earnedWeight / totalWeight) * 100)
  const nextPhaseIndex = phases.findIndex((phase) => !phase.locked && phase.score < phase.weight)
  const recommendedPhase = phases[nextPhaseIndex === -1 ? phases.length - 1 : nextPhaseIndex]
  const isTranscriptExpanded = state.expandedTranscriptSessionIds.has(sessionId)
  const getStatusLabel = (status) => {
    if (status === "done") {
      return t("learningPath.done")
    }
    if (status === "next") {
      return t("learningPath.next")
    }
    if (status === "locked") {
      return t("learningPath.locked")
    }
    return t("learningPath.ready")
  }

  return `
    <section class="learning-path learning-cycle" aria-label="${escapeHtml(t("learningPath.title"))}">
      <div class="learning-path-header">
        <div>
          <span class="eyebrow">${escapeHtml(t("learningPath.title"))}</span>
          <h3>${escapeHtml(recommendedPhase.title)}</h3>
          <p class="panel-subtext">${escapeHtml(localize(
            "Scientific loop: input, active recall, feedback, consolidation, then reflection.",
            "Vòng học chuẩn: tiếp nhận, gợi nhớ chủ động, sửa lỗi, củng cố rồi phản tư.",
          ))}</p>
        </div>
        <div class="learning-path-progress" aria-label="${progressPercent}% ${escapeHtml(t("learningPath.progress"))}">
          <span>${escapeHtml(localize("Cycle mastery", "Mức hoàn thiện"))}</span>
          <strong>${progressPercent}%</strong>
          <div class="learning-path-meter" aria-hidden="true">
            <span style="width: ${progressPercent}%"></span>
          </div>
        </div>
      </div>
      <div class="learning-next-callout">
        <strong>${escapeHtml(localize("Recommended next step", "Bước nên làm tiếp"))}</strong>
        <span>${escapeHtml(`${recommendedPhase.phase}: ${recommendedPhase.target}`)}</span>
      </div>
      <div class="learning-cycle-list">
        ${phases
          .map((phase, index) => {
            const status =
              phase.locked
                ? "locked"
                : phase.score >= phase.weight
                  ? "done"
                  : index === nextPhaseIndex
                    ? "next"
                    : "ready"
            const canClick = Boolean(phase.action) && status !== "locked"
            const phasePercent = Math.round((Math.min(phase.score, phase.weight) / phase.weight) * 100)
            return `
              <article class="learning-phase is-${status}">
                <div class="learning-phase-top">
                  <span class="learning-step-index">${index + 1}</span>
                  <div>
                    <span class="learning-phase-label">${escapeHtml(phase.phase)}</span>
                    <h4>${escapeHtml(phase.title)}</h4>
                  </div>
                  <span class="badge">${escapeHtml(getStatusLabel(status))}</span>
                </div>
                <p class="learning-method">${escapeHtml(phase.method)}</p>
                <div class="learning-phase-meter" aria-hidden="true">
                  <span style="width: ${phasePercent}%"></span>
                </div>
                <div class="learning-evidence-grid">
                  <div>
                    <span>${escapeHtml(localize("Evidence", "Bằng chứng"))}</span>
                    <strong>${escapeHtml(phase.evidence)}</strong>
                  </div>
                  <div>
                    <span>${escapeHtml(localize("Target", "Tiêu chí"))}</span>
                    <strong>${escapeHtml(phase.target)}</strong>
                  </div>
                </div>
                ${buildCriteria(phase.criteria)}
                ${
                  canClick
                    ? `
                      <button
                        type="button"
                        class="button-text learning-step-action"
                        data-learning-action="${phase.action}"
                        data-learning-session="${sessionId}"
                      >
                        ${escapeHtml(phase.actionLabel)}
                      </button>
                    `
                    : ""
                }
              </article>
            `
          })
          .join("")}
      </div>
      ${
        isTranscriptExpanded && transcriptText
          ? `
            <div class="learning-transcript-preview">
              <span class="question-index">${escapeHtml(t("learningPath.transcriptPreview"))}</span>
              <p>${escapeHtml(transcriptText)}</p>
            </div>
          `
          : ""
      }
    </section>
  `
}

const buildLearningPathMarkup = (session, detail = null) => {
  const sessionId = session.sessionId
  const transcriptText = detail?.rawText ?? session.rawText ?? ""
  const transcriptWordCount = Number(session.wordCount ?? 0)
  const hasTranscript = Boolean(transcriptText || transcriptWordCount > 0)
  const toMetricNumber = (value) => {
    if (value === null || value === undefined || value === "") {
      return null
    }
    const number = Number(value)
    return Number.isFinite(number) ? number : null
  }
  const accuracyScore = toMetricNumber(session.accuracyScore)
  const hasShadowing = accuracyScore !== null
  const attempts = state.attemptHistoryBySessionId.get(sessionId) ?? []
  const submittedAttempt =
    state.currentQuizId && state.quizSessionId === sessionId
      ? state.submittedAttemptByQuizId.get(state.currentQuizId)
      : null
  const latestAttempt = submittedAttempt ?? attempts[0] ?? null
  const submittedAttemptAlreadyInHistory =
    submittedAttempt && attempts.some((attempt) => attempt.attempt_id === submittedAttempt.attempt_id)
  const attemptCount = attempts.length + (submittedAttempt && !submittedAttemptAlreadyInHistory ? 1 : 0)
  const hasAttempt = Boolean(latestAttempt)
  const latestQuiz = state.quizzesBySessionId.get(sessionId)
  const quizQuestionCount =
    state.quizSessionId === sessionId && state.currentQuizQuestions.length > 0
      ? state.currentQuizQuestions.length
      : latestQuiz?.questions?.length ?? 0
  const hasQuiz =
    quizQuestionCount > 0 ||
    session.quizStatus === "Quiz Generated" ||
    state.quizzesBySessionId.has(sessionId)
  const latestScore = toMetricNumber(latestAttempt?.score)
  const latestTotalQuestions = Number(latestAttempt?.total_questions ?? quizQuestionCount ?? 0)
  const latestCorrectCount = Number(latestAttempt?.correct_count ?? 0)
  const wrongCount =
    latestAttempt === null
      ? null
      : Math.max(0, latestTotalQuestions - latestCorrectCount)
  const attemptResults = Array.isArray(latestAttempt?.results) ? latestAttempt.results : []
  const wrongResultCount =
    attemptResults.length > 0
      ? attemptResults.filter((result) => !result.is_correct).length
      : wrongCount
  const explanationCount = attemptResults.filter((result) => Boolean(result.explanation)).length
  const hasExplanationFeedback = latestAttempt !== null && (wrongCount === 0 || explanationCount > 0)
  const hasReviewedMistakes =
    latestAttempt !== null && (wrongCount === 0 || state.reviewedAttemptSessionIds.has(sessionId))
  const vocabularyItems = state.vocabularyBySessionId.get(sessionId) ?? []
  const savedVocabularyCount = vocabularyItems.filter((item) => item.isSaved).length
  const hasVocabularyLoaded = state.vocabularyBySessionId.has(sessionId)
  const vocabQuizQuestions = state.vocabQuizBySessionId.get(sessionId) ?? []
  const vocabQuizAnswers = state.vocabQuizAnswersBySessionId.get(sessionId) ?? {}
  const answeredVocabQuizCount = Object.keys(vocabQuizAnswers).length
  const hasCompletedVocabQuiz =
    vocabQuizQuestions.length > 0 && answeredVocabQuizCount >= vocabQuizQuestions.length
  const savedVocabularyTarget = 3
  const isReflected = state.reflectedSessionIds.has(sessionId)
  const accuracyReady = hasShadowing && accuracyScore >= 85
  const quizScoreReady = latestScore !== null && latestScore >= 80
  const evidenceSignals = [
    hasTranscript,
    hasShadowing,
    hasQuiz,
    hasAttempt,
    hasVocabularyLoaded,
  ]
  const evidenceCount = evidenceSignals.filter(Boolean).length
  const confidencePercent = Math.round((evidenceCount / evidenceSignals.length) * 100)
  const confidenceLabel =
    confidencePercent >= 80
      ? localize("High", "Cao")
      : confidencePercent >= 50
        ? localize("Medium", "Trung bình")
        : localize("Low", "Thấp")
  const clampScore = (score, weight) => Math.min(weight, Math.max(0, score))
  const dataStateLabel = (stateName) => {
    if (stateName === "measured") {
      return localize("Measured", "Đã đo")
    }
    if (stateName === "partial") {
      return localize("Partial", "Thiếu một phần")
    }
    return localize("Missing data", "Thiếu dữ liệu")
  }
  const buildCriteria = (items) => {
    return `
      <ul class="learning-criteria">
        ${items
          .map((item) => {
            return `
              <li class="${item.done ? "is-done" : ""}">
                <span aria-hidden="true">${item.done ? "&#10003;" : "&middot;"}</span>
                ${escapeHtml(item.label)}
              </li>
            `
          })
          .join("")}
      </ul>
    `
  }
  const buildDataList = (items) => {
    return `
      <dl class="learning-data-list">
        ${items
          .map((item) => {
            return `
              <div>
                <dt>${escapeHtml(item.label)}</dt>
                <dd>${escapeHtml(item.value)}</dd>
              </div>
            `
          })
          .join("")}
      </dl>
    `
  }
  const buildDecision = () => {
    if (!hasTranscript) {
      return {
        phaseKey: "input",
        title: localize("Create transcript evidence first", "Cần có transcript trước"),
        reason: localize(
          "The loop cannot start until the session has a transcript or word count.",
          "Lộ trình chưa thể bắt đầu khi buổi học chưa có transcript hoặc số từ.",
        ),
        action: null,
        actionLabel: "",
        tone: "missing",
      }
    }
    if (!hasShadowing) {
      return {
        phaseKey: "input",
        title: localize("Measure focused listening", "Đo phần nghe tập trung"),
        reason: localize(
          "Read the transcript, listen again, then record accuracy before moving to recall.",
          "Đọc transcript, nghe lại, rồi ghi nhận accuracy trước khi chuyển sang gợi nhớ.",
        ),
        action: "transcript",
        actionLabel: t("learningPath.review"),
        tone: "next",
      }
    }
    if (accuracyScore < 85) {
      return {
        phaseKey: "input",
        title: localize("Repeat input before testing", "Luyện lại input trước khi kiểm tra"),
        reason: localize(
          `Listening accuracy is ${formatPercent(accuracyScore)}, below the 85% readiness target.`,
          `Accuracy nghe là ${formatPercent(accuracyScore)}, chưa đạt mốc sẵn sàng 85%.`,
        ),
        action: "transcript",
        actionLabel: t("learningPath.review"),
        tone: "warning",
      }
    }
    if (!hasQuiz) {
      return {
        phaseKey: "recall",
        title: localize("Generate active recall questions", "Tạo câu hỏi gợi nhớ chủ động"),
        reason: localize(
          "Input is stable enough. Now test comprehension before showing explanations.",
          "Phần input đã đủ ổn. Bây giờ nên kiểm tra hiểu bài trước khi xem explanation.",
        ),
        action: "generate-quiz",
        actionLabel: t("learningPath.generate"),
        tone: "next",
      }
    }
    if (!hasAttempt) {
      return {
        phaseKey: "recall",
        title: localize("Submit one quiz attempt", "Nộp một lần làm quiz"),
        reason: localize(
          "The generated quiz becomes learning evidence only after the learner answers it.",
          "Quiz chỉ trở thành dữ liệu học tập sau khi người học trả lời và nộp bài.",
        ),
        action: "quiz",
        actionLabel: t("learningPath.open"),
        tone: "next",
      }
    }
    if (wrongCount > 0 && !hasReviewedMistakes) {
      return {
        phaseKey: "feedback",
        title: localize("Review wrong answers before retake", "Xem lỗi sai trước khi làm lại"),
        reason: localize(
          `${wrongResultCount} wrong answer(s) still need explanation-based correction.`,
          `Còn ${wrongResultCount} câu sai cần sửa bằng explanation.`,
        ),
        action: "attempts",
        actionLabel: t("learningPath.review"),
        tone: "warning",
      }
    }
    if (!quizScoreReady) {
      return {
        phaseKey: "recall",
        title: localize("Retake after feedback", "Làm lại sau khi sửa lỗi"),
        reason: localize(
          `Latest quiz score is ${formatPercent(latestScore)}; target is 80%+ for this loop.`,
          `Điểm quiz mới nhất là ${formatPercent(latestScore)}; mục tiêu của vòng này là từ 80%.`,
        ),
        action: "quiz",
        actionLabel: localize("Retake", "Làm lại"),
        tone: "warning",
      }
    }
    if (!hasVocabularyLoaded) {
      return {
        phaseKey: "consolidation",
        title: localize("Extract vocabulary from this transcript", "Trích từ vựng từ transcript này"),
        reason: localize(
          "Comprehension is acceptable; now consolidate useful words from the same context.",
          "Mức hiểu bài đã ổn; tiếp theo nên củng cố từ hữu ích trong đúng ngữ cảnh này.",
        ),
        action: "vocabulary",
        actionLabel: t("learningPath.open"),
        tone: "next",
      }
    }
    if (savedVocabularyCount < savedVocabularyTarget) {
      return {
        phaseKey: "consolidation",
        title: localize("Save the words worth reviewing", "Lưu các từ đáng ôn lại"),
        reason: localize(
          `${savedVocabularyCount}/${savedVocabularyTarget} target words saved. Save only words that block meaning or recur.`,
          `Đã lưu ${savedVocabularyCount}/${savedVocabularyTarget} từ mục tiêu. Chỉ lưu từ cản hiểu hoặc hay lặp lại.`,
        ),
        action: "vocabulary",
        actionLabel: t("learningPath.open"),
        tone: "next",
      }
    }
    if (!hasCompletedVocabQuiz) {
      return {
        phaseKey: "consolidation",
        title: localize("Recall saved vocabulary without looking", "Tự nhớ từ đã lưu khi không nhìn đáp án"),
        reason: localize(
          `Vocabulary check progress is ${answeredVocabQuizCount}/${vocabQuizQuestions.length || savedVocabularyCount}.`,
          `Tiến độ vocabulary check là ${answeredVocabQuizCount}/${vocabQuizQuestions.length || savedVocabularyCount}.`,
        ),
        action: "vocab-quiz",
        actionLabel: t("learningPath.start"),
        tone: "next",
      }
    }
    if (!isReflected) {
      return {
        phaseKey: "reflection",
        title: localize("Read the trend before moving on", "Xem xu hướng trước khi sang bài mới"),
        reason: localize(
          "The loop is complete. Use the dashboard to decide whether this skill is improving.",
          "Vòng học đã đủ. Dùng dashboard để biết kỹ năng này có đang tiến bộ không.",
        ),
        action: "dashboard",
        actionLabel: t("learningPath.track"),
        tone: "next",
      }
    }
    return {
      phaseKey: "reflection",
      title: localize("Ready for the next focused session", "Sẵn sàng sang buổi học tiếp theo"),
      reason: localize(
        "Input, recall, feedback, consolidation, and reflection all have supporting evidence.",
        "Input, gợi nhớ, sửa lỗi, củng cố và phản tư đều đã có dữ liệu hỗ trợ.",
      ),
      action: "dashboard",
      actionLabel: t("learningPath.track"),
      tone: "done",
    }
  }

  const phases = [
    {
      key: "input",
      phase: localize("Input", "Tiếp nhận"),
      title: localize("Transcript and focused listening", "Transcript và nghe tập trung"),
      principle: localize("Comprehensible input", "Input hiểu được"),
      method: localize(
        "Build a clear mental model from the transcript, then verify what was actually heard.",
        "Tạo mô hình nghĩa rõ từ transcript, rồi kiểm chứng phần thật sự nghe được.",
      ),
      dataState: hasTranscript && hasShadowing ? "measured" : hasTranscript ? "partial" : "missing",
      evidenceRows: [
        { label: localize("Transcript", "Transcript"), value: hasTranscript ? localize("Available", "Đã có") : localize("Missing", "Chưa có") },
        { label: localize("Length", "Độ dài"), value: formatWordCount(transcriptWordCount) },
        { label: localize("Listening accuracy", "Accuracy nghe"), value: formatPercent(accuracyScore) },
      ],
      target: localize("Transcript loaded and listening accuracy at least 85%.", "Có transcript và accuracy nghe từ 85% trở lên."),
      criteria: [
        { label: localize("Transcript available", "Có transcript"), done: hasTranscript },
        { label: localize("Listening accuracy recorded", "Đã ghi nhận accuracy"), done: hasShadowing },
        { label: localize("Accuracy target 85%+", "Accuracy đạt 85%+"), done: accuracyReady },
      ],
      score: clampScore((hasTranscript ? 10 : 0) + (hasShadowing ? 8 : 0) + (accuracyReady ? 7 : 0), 25),
      weight: 25,
      locked: !hasTranscript,
      action: hasTranscript ? "transcript" : null,
      actionLabel: t("learningPath.review"),
    },
    {
      key: "recall",
      phase: localize("Active recall", "Gợi nhớ chủ động"),
      title: localize("Reading quiz attempt", "Làm quiz đọc hiểu"),
      principle: localize("Retrieval practice", "Gợi nhớ chủ động"),
      method: localize(
        "Use retrieval practice: answer before seeing explanations.",
        "Dùng gợi nhớ chủ động: trả lời trước khi xem explanation.",
      ),
      dataState: hasQuiz && hasAttempt ? "measured" : hasQuiz ? "partial" : "missing",
      evidenceRows: [
        { label: localize("Questions", "Số câu"), value: String(quizQuestionCount || 0) },
        { label: localize("Attempts", "Lần làm"), value: String(attemptCount) },
        { label: localize("Latest score", "Điểm mới nhất"), value: formatPercent(latestScore) },
      ],
      target: localize("Generate quiz, submit one attempt, and reach 80%+.", "Tạo quiz, nộp một lần làm và đạt từ 80% trở lên."),
      criteria: [
        { label: localize("Quiz generated", "Đã sinh quiz"), done: hasQuiz },
        { label: localize("Attempt submitted", "Đã nộp bài"), done: hasAttempt },
        { label: localize("Score target 80%+", "Điểm đạt 80%+"), done: quizScoreReady },
      ],
      score: clampScore((hasQuiz ? 8 : 0) + (hasAttempt ? 10 : 0) + (quizScoreReady ? 7 : 0), 25),
      weight: 25,
      locked: !hasTranscript,
      action: hasQuiz ? "quiz" : "generate-quiz",
      actionLabel: hasQuiz ? t("learningPath.open") : t("learningPath.generate"),
    },
    {
      key: "feedback",
      phase: localize("Feedback", "Sửa lỗi"),
      title: localize("Mistake review", "Xem và sửa lỗi sai"),
      principle: localize("Corrective feedback", "Phản hồi sửa lỗi"),
      method: localize(
        "Turn wrong answers into corrected rules, with explanations as the evidence.",
        "Biến đáp án sai thành quy tắc đã sửa, dùng explanation làm bằng chứng.",
      ),
      dataState: hasAttempt && hasExplanationFeedback ? "measured" : hasAttempt ? "partial" : "missing",
      evidenceRows: [
        {
          label: localize("Wrong answers", "Câu sai"),
          value: wrongCount === null ? "--" : String(wrongResultCount),
        },
        {
          label: localize("Explanations", "Explanation"),
          value: hasAttempt ? String(explanationCount) : "--",
        },
        {
          label: localize("Review status", "Trạng thái sửa lỗi"),
          value: hasReviewedMistakes ? localize("Reviewed", "Đã xem") : localize("Pending", "Chưa xong"),
        },
      ],
      target: localize("Review every wrong answer and explanation.", "Xem lại từng câu sai và explanation."),
      criteria: [
        { label: localize("Attempt history exists", "Có lịch sử làm bài"), done: hasAttempt },
        { label: localize("Explanations available", "Có explanation để sửa lỗi"), done: hasExplanationFeedback },
        { label: localize("Wrong answers reviewed", "Đã xem lỗi sai"), done: hasReviewedMistakes },
      ],
      score: clampScore((hasAttempt ? 7 : 0) + (hasExplanationFeedback ? 5 : 0) + (hasReviewedMistakes ? 8 : 0), 20),
      weight: 20,
      locked: !hasAttempt,
      action: hasAttempt ? "attempts" : null,
      actionLabel: t("learningPath.review"),
    },
    {
      key: "consolidation",
      phase: localize("Consolidation", "Củng cố"),
      title: localize("Vocabulary bank and mini quiz", "Từ vựng và mini quiz"),
      principle: localize("Elaboration and spaced recall", "Đào sâu nghĩa và ôn cách quãng"),
      method: localize(
        "Save difficult words, then recall them without looking at the bank.",
        "Lưu từ khó, sau đó tự nhớ lại mà không nhìn word bank.",
      ),
      dataState: hasVocabularyLoaded && savedVocabularyCount >= savedVocabularyTarget && hasCompletedVocabQuiz
        ? "measured"
        : hasVocabularyLoaded
          ? "partial"
          : "missing",
      evidenceRows: [
        { label: localize("Extracted", "Đã trích"), value: String(vocabularyItems.length) },
        { label: localize("Saved", "Đã lưu"), value: `${savedVocabularyCount}/${savedVocabularyTarget}` },
        {
          label: localize("Mini quiz", "Mini quiz"),
          value: `${answeredVocabQuizCount}/${vocabQuizQuestions.length || savedVocabularyCount || 0}`,
        },
      ],
      target: localize("Save at least 3 useful words and finish vocabulary check.", "Lưu ít nhất 3 từ hữu ích và hoàn thành vocabulary check."),
      criteria: [
        { label: localize("Vocabulary extracted", "Đã trích từ vựng"), done: hasVocabularyLoaded },
        {
          label: localize(`Save ${savedVocabularyTarget}+ words`, `Lưu ${savedVocabularyTarget}+ từ`),
          done: savedVocabularyCount >= savedVocabularyTarget,
        },
        { label: localize("Mini quiz completed", "Hoàn thành mini quiz"), done: hasCompletedVocabQuiz },
      ],
      score: clampScore(
        (hasVocabularyLoaded ? 5 : 0) +
          Math.min(savedVocabularyCount, savedVocabularyTarget) * (10 / savedVocabularyTarget) +
          (hasCompletedVocabQuiz ? 5 : 0),
        20,
      ),
      weight: 20,
      locked: !hasTranscript,
      action: savedVocabularyCount > 0 || vocabularyItems.length > 0 ? "vocab-quiz" : "vocabulary",
      actionLabel: savedVocabularyCount > 0 ? t("learningPath.start") : t("learningPath.open"),
    },
    {
      key: "reflection",
      phase: localize("Reflection", "Phản tư"),
      title: localize("Progress decision", "Quyết định bước tiếp theo"),
      principle: localize("Metacognition", "Tự đánh giá"),
      method: localize(
        "Use trend data to decide whether to repeat, retake, or move on.",
        "Dựa vào xu hướng để quyết định luyện lại, làm lại quiz hay học bài mới.",
      ),
      dataState: isReflected ? "measured" : hasAttempt ? "partial" : "missing",
      evidenceRows: [
        {
          label: localize("Analytics", "Analytics"),
          value: hasAttempt ? localize("Attempt saved", "Đã lưu lần làm") : localize("No attempt", "Chưa có lần làm"),
        },
        { label: localize("Evidence confidence", "Độ tin cậy dữ liệu"), value: `${confidenceLabel} (${confidencePercent}%)` },
        { label: localize("Dashboard", "Dashboard"), value: isReflected ? localize("Checked", "Đã xem") : localize("Pending", "Chưa xem") },
      ],
      target: localize("Check dashboard after the feedback loop.", "Xem dashboard sau vòng sửa lỗi."),
      criteria: [
        { label: localize("Attempt contributes to analytics", "Lần làm đóng góp vào analytics"), done: hasAttempt },
        { label: localize("Enough evidence for a decision", "Đủ dữ liệu để ra quyết định"), done: confidencePercent >= 60 },
        { label: localize("Dashboard checked", "Đã xem dashboard"), done: isReflected },
      ],
      score: clampScore((hasAttempt ? 3 : 0) + (confidencePercent >= 60 ? 3 : 0) + (isReflected ? 4 : 0), 10),
      weight: 10,
      locked: !hasAttempt,
      action: "dashboard",
      actionLabel: t("learningPath.track"),
    },
  ]

  const decision = buildDecision()
  const totalWeight = phases.reduce((total, phase) => total + phase.weight, 0)
  const earnedWeight = phases.reduce((total, phase) => total + Math.min(phase.score, phase.weight), 0)
  const progressPercent = Math.round((earnedWeight / totalWeight) * 100)
  const nextPhaseIndex = phases.findIndex((phase) => !phase.locked && phase.score < phase.weight)
  const recommendedPhase =
    phases.find((phase) => phase.key === decision.phaseKey) ??
    phases[nextPhaseIndex === -1 ? phases.length - 1 : nextPhaseIndex]
  const isTranscriptExpanded = state.expandedTranscriptSessionIds.has(sessionId)
  const getStatusLabel = (status) => {
    if (status === "done") {
      return t("learningPath.done")
    }
    if (status === "next") {
      return t("learningPath.next")
    }
    if (status === "locked") {
      return t("learningPath.locked")
    }
    return t("learningPath.ready")
  }

  return `
    <section class="learning-path learning-cycle" aria-label="${escapeHtml(t("learningPath.title"))}">
      <div class="learning-path-header">
        <div>
          <span class="eyebrow">${escapeHtml(t("learningPath.title"))}</span>
          <h3>${escapeHtml(decision.title)}</h3>
          <p class="panel-subtext">${escapeHtml(localize(
            "Scientific loop: input, active recall, feedback, consolidation, then reflection.",
            "Vòng học chuẩn: input, gợi nhớ chủ động, phản hồi sửa lỗi, củng cố rồi phản tư.",
          ))}</p>
        </div>
        <div class="learning-path-progress" aria-label="${progressPercent}% ${escapeHtml(t("learningPath.progress"))}">
          <span>${escapeHtml(localize("Evidence mastery", "Mức chứng cứ"))}</span>
          <strong>${progressPercent}%</strong>
          <div class="learning-path-meter" aria-hidden="true">
            <span style="width: ${progressPercent}%"></span>
          </div>
        </div>
      </div>
      <div class="learning-decision-panel is-${decision.tone}">
        <div class="learning-decision-main">
          <span>${escapeHtml(localize("Recommended next action", "Hành động nên làm tiếp"))}</span>
          <strong>${escapeHtml(`${recommendedPhase.phase}: ${decision.title}`)}</strong>
          <p>${escapeHtml(decision.reason)}</p>
        </div>
        <div class="learning-decision-kpis">
          <div>
            <span>${escapeHtml(localize("Data confidence", "Độ tin cậy"))}</span>
            <strong>${escapeHtml(`${confidenceLabel} ${confidencePercent}%`)}</strong>
          </div>
          <div>
            <span>${escapeHtml(localize("Listening", "Nghe"))}</span>
            <strong>${escapeHtml(formatPercent(accuracyScore))}</strong>
          </div>
          <div>
            <span>${escapeHtml(localize("Quiz", "Quiz"))}</span>
            <strong>${escapeHtml(formatPercent(latestScore))}</strong>
          </div>
        </div>
        ${
          decision.action
            ? `
              <button
                type="button"
                class="button-primary learning-decision-action"
                data-learning-action="${decision.action}"
                data-learning-session="${sessionId}"
              >
                ${escapeHtml(decision.actionLabel)}
              </button>
            `
            : ""
        }
      </div>
      <div class="learning-cycle-list">
        ${phases
          .map((phase, index) => {
            const status =
              phase.locked
                ? "locked"
                : phase.score >= phase.weight
                  ? "done"
                  : phase.key === recommendedPhase.key || index === nextPhaseIndex
                    ? "next"
                    : "ready"
            const canClick = Boolean(phase.action) && status !== "locked"
            const phasePercent = Math.round((Math.min(phase.score, phase.weight) / phase.weight) * 100)
            return `
              <article class="learning-phase is-${status}" data-phase="${phase.key}">
                <div class="learning-phase-top">
                  <span class="learning-step-index">${index + 1}</span>
                  <div>
                    <span class="learning-phase-label">${escapeHtml(phase.phase)}</span>
                    <h4>${escapeHtml(phase.title)}</h4>
                  </div>
                  <span class="badge">${escapeHtml(getStatusLabel(status))}</span>
                </div>
                <div class="learning-principle-row">
                  <span>${escapeHtml(localize("Learning principle", "Nguyên tắc học"))}</span>
                  <strong>${escapeHtml(phase.principle)}</strong>
                  <em class="learning-data-state is-${phase.dataState}">${escapeHtml(dataStateLabel(phase.dataState))}</em>
                </div>
                <p class="learning-method">${escapeHtml(phase.method)}</p>
                <div class="learning-phase-meter" aria-hidden="true">
                  <span style="width: ${phasePercent}%"></span>
                </div>
                ${buildDataList(phase.evidenceRows)}
                <p class="learning-target"><span>${escapeHtml(localize("Target", "Tiêu chí"))}</span>${escapeHtml(phase.target)}</p>
                ${buildCriteria(phase.criteria)}
                ${
                  canClick
                    ? `
                      <button
                        type="button"
                        class="button-text learning-step-action"
                        data-learning-action="${phase.action}"
                        data-learning-session="${sessionId}"
                      >
                        ${escapeHtml(phase.actionLabel)}
                      </button>
                    `
                    : ""
                }
              </article>
            `
          })
          .join("")}
      </div>
      ${
        isTranscriptExpanded && transcriptText
          ? `
            <div class="learning-transcript-preview">
              <span class="question-index">${escapeHtml(t("learningPath.transcriptPreview"))}</span>
              <p>${escapeHtml(transcriptText)}</p>
            </div>
          `
          : ""
      }
    </section>
  `
}

const buildStudyBoard = () => {
  const selectedSession = getSelectedSession()
  if (!selectedSession) {
    return `
      <section class="study-board">
        <div class="study-content">
          <div class="empty-state">
            <span class="eyebrow">${escapeHtml(t("sessions.workspace"))}</span>
            <p class="state-copy">${escapeHtml(t("sessions.emptyCopy"))}</p>
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
            <span class="eyebrow">${escapeHtml(t("sessions.selected"))}</span>
            <h3 class="study-title">${escapeHtml(selectedSession.videoTitle)}</h3>
            <div class="item-meta">
              <span>YouTube / ${escapeHtml(selectedSession.videoId)}</span>
              <span>${escapeHtml(formatDate(selectedSession.completedAt))}</span>
              <span>${escapeHtml(formatWordCount(selectedSession.wordCount))}</span>
              <span class="badge is-blue">${escapeHtml(formatPercent(selectedSession.accuracyScore))}</span>
              <span class="badge ${selectedSession.quizStatus === "Quiz Generated" ? "is-green" : ""}">${escapeHtml(getQuizStatusLabel(selectedSession.quizStatus))}</span>
            </div>
          </div>
        </div>
        <div class="study-tabs" role="tablist" aria-label="${escapeHtml(t("sessions.workspaceAria"))}">
          ${[
            ["path", t("learningPath.title")],
            ["quiz", t("sessions.readingQuiz")],
            ["attempts", t("sessions.attempts")],
          ]
            .map(([tab, label]) => {
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
            ? buildLoadingMarkup(t("sessions.loadingSelected"))
            : detailError
              ? buildStateMarkup(detailError, { error: true })
              : state.activeStudyTab === "path"
                ? buildLearningPathMarkup(selectedSession, detail)
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
      <span class="control-label">${escapeHtml(t("control.difficulty"))}</span>
      <select id="${id}" class="control-select" data-setting-select="defaultDifficulty">
        <option value="easy" ${state.settings.defaultDifficulty === "easy" ? "selected" : ""}>${escapeHtml(t("difficulty.easy"))}</option>
        <option value="medium" ${state.settings.defaultDifficulty === "medium" ? "selected" : ""}>${escapeHtml(t("difficulty.medium"))}</option>
        <option value="hard" ${state.settings.defaultDifficulty === "hard" ? "selected" : ""}>${escapeHtml(t("difficulty.hard"))}</option>
      </select>
    </label>
  `
}

const buildQuestionTypeSelect = (id) => {
  return `
    <label class="control-field" for="${id}">
      <span class="control-label">${escapeHtml(t("control.questionType"))}</span>
      <select id="${id}" class="control-select" data-setting-select="defaultQuestionType">
        ${QUESTION_TYPES
          .map(([value, labelKey]) => {
            return `<option value="${value}" ${state.settings.defaultQuestionType === value ? "selected" : ""}>${escapeHtml(t(labelKey))}</option>`
          })
          .join("")}
      </select>
    </label>
  `
}

const buildToggleSetting = ({ id, label, description, checked }) => {
  return `
    <label class="settings-toggle" for="${id}">
      <span>
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(description)}</span>
      </span>
      <input id="${id}" type="checkbox" data-setting-toggle="${id}" ${checked ? "checked" : ""} />
    </label>
  `
}

const buildNoticeMarkup = (message, tone = "success") => {
  if (!message) {
    return ""
  }

  return `<p class="settings-feedback ${tone === "error" ? "is-error" : "is-success"}">${escapeHtml(message)}</p>`
}

const buildLanguageOptions = (selectedLanguage) => {
  const language = normalizeLanguage(selectedLanguage)
  return `
    <option value="en" ${language === "en" ? "selected" : ""}>English</option>
    <option value="vi" ${language === "vi" ? "selected" : ""}>Tiếng Việt</option>
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

const buildAttemptReviewCards = (results) => {
  if (!Array.isArray(results) || results.length === 0) {
    return `<div class="attempt-review-card"><p class="quiz-save-note">No question details were saved for this attempt.</p></div>`
  }

  return results
    .map((result, index) => {
      const selectedLabel = result.selected_answer ?? null
      const correctLabel = result.correct_answer
      const selectedCopy = selectedLabel ? result.options?.[selectedLabel] ?? "" : ""
      const correctCopy = result.options?.[correctLabel] ?? ""
      const optionMarkup = Object.entries(result.options ?? {})
        .map(([label, value]) => {
          const isSelected = label === selectedLabel
          const isCorrect = label === correctLabel
          const rowClass = isCorrect
            ? "is-correct"
            : isSelected
              ? "is-incorrect"
              : ""
          const tagMarkup = [
            isSelected ? "Your choice" : "",
            isCorrect ? "Correct answer" : "",
          ]
            .filter(Boolean)
            .map((tag) => `<span class="attempt-option-tag">${escapeHtml(tag)}</span>`)
            .join("")

          return `
            <div class="attempt-option-row ${rowClass}">
              <span class="option-label">${escapeHtml(label)}</span>
              <span class="option-copy">${escapeHtml(value)}</span>
              <span class="attempt-option-tags">${tagMarkup}</span>
            </div>
          `
        })
        .join("")

      return `
        <article class="attempt-review-card ${result.is_correct ? "is-correct" : "is-incorrect"}">
          <div class="attempt-review-heading">
            <span class="question-index">Question ${index + 1}</span>
            <span class="result-badge ${result.is_correct ? "is-correct" : "is-incorrect"}">
              ${result.is_correct ? "Correct" : "Review"}
            </span>
          </div>
          <h4>${escapeHtml(result.question)}</h4>
          <div class="attempt-option-list">${optionMarkup}</div>
          <div class="answer-line">
            <strong>Your answer</strong>
            <span class="answer-badge">${escapeHtml(selectedLabel ? `${selectedLabel}. ${selectedCopy}` : "--")}</span>
            <strong>Correct answer</strong>
            <span class="answer-badge">${escapeHtml(`${correctLabel}. ${correctCopy}`)}</span>
          </div>
          <div class="explanation-line">
            <strong>Explanation</strong>
            <p class="explanation-copy">${escapeHtml(result.explanation)}</p>
          </div>
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
        ${buildAttemptReviewCards(activeAttempt.results)}
      </div>
    </div>
  `
}

const renderSessionsView = () => {
  const panel = elements.panels.sessions
  const scrollSnapshot = captureScrollSnapshot(panel)
  panel.innerHTML = `
    <div class="toolbar">
      <label class="control-field">
        <span class="control-label">${escapeHtml(t("common.search"))}</span>
        <input id="dashboard-session-search" class="control-input" type="search" value="${escapeHtml(state.sessionSearch)}" placeholder="${escapeHtml(t("common.titleOrVideo"))}" />
      </label>
      <label class="control-field">
        <span class="control-label">${escapeHtml(t("common.status"))}</span>
        <select id="dashboard-session-filter" class="control-select">
          <option value="all" ${state.sessionStatusFilter === "all" ? "selected" : ""}>${escapeHtml(t("status.all"))}</option>
          <option value="Completed" ${state.sessionStatusFilter === "Completed" ? "selected" : ""}>${escapeHtml(t("status.completed"))}</option>
          <option value="Quiz Ready" ${state.sessionStatusFilter === "Quiz Ready" ? "selected" : ""}>${escapeHtml(t("status.quizReady"))}</option>
          <option value="Quiz Generated" ${state.sessionStatusFilter === "Quiz Generated" ? "selected" : ""}>${escapeHtml(t("status.quizGenerated"))}</option>
        </select>
      </label>
      <label class="control-field">
        <span class="control-label">${escapeHtml(t("common.date"))}</span>
        <input id="dashboard-session-date" class="control-input" type="date" value="${escapeHtml(state.sessionDateFilter)}" />
      </label>
    </div>
    <div class="study-layout">
      ${buildSessionRail({ summary: `${getFilteredSessions().length} ${t("sessions.summary")}` })}
      ${buildStudyBoard()}
    </div>
  `
  restoreScrollSnapshot(panel, scrollSnapshot)
}

const renderQuizHistoryView = () => {
  const panel = elements.panels["quiz-history"]
  const scrollSnapshot = captureScrollSnapshot(panel)
  if (state.sessionsState === "loading") {
    panel.innerHTML = buildLoadingMarkup(t("quizHistory.loadingSessions"))
    restoreScrollSnapshot(panel, scrollSnapshot)
    return
  }
  if (state.quizHistoryState === "loading") {
    panel.innerHTML = buildLoadingMarkup(t("quizHistory.loading"))
    restoreScrollSnapshot(panel, scrollSnapshot)
    return
  }
  if (state.quizHistoryState === "error") {
    panel.innerHTML = buildStateMarkup(state.quizHistoryError || t("quizHistory.error"), {
      error: true,
    })
    restoreScrollSnapshot(panel, scrollSnapshot)
    return
  }
  if (state.quizHistoryState === "empty") {
    panel.innerHTML = `
      <div class="state-block">
        <p class="state-copy">${escapeHtml(t("quizHistory.openToLoad"))}</p>
        <button class="button-primary" type="button" data-load-quiz-history>${escapeHtml(t("quizHistory.load"))}</button>
      </div>
    `
    restoreScrollSnapshot(panel, scrollSnapshot)
    return
  }

  if (state.quizAttempts.length === 0) {
    panel.innerHTML = buildStateMarkup(t("quizHistory.noAttempts"))
    restoreScrollSnapshot(panel, scrollSnapshot)
    return
  }

  const activeAttempt =
    state.quizAttempts.find((attempt) => attempt.attempt_id === state.activeGlobalAttemptId) ??
    state.quizAttempts[0]

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
        ${buildAttemptReviewCards(activeAttempt.results)}
      </div>
    </div>
  `
  restoreScrollSnapshot(panel, scrollSnapshot)
}

const getVocabularyForSelectedSession = () => {
  return state.selectedSessionId
    ? state.vocabularyBySessionId.get(state.selectedSessionId) ?? []
    : []
}

const getVocabularySourceItems = () => {
  return state.vocabularySourceMode === "saved"
    ? getSavedVocabularyItems()
    : getVocabularyForSelectedSession()
}

const getFilteredVocabulary = () => {
  const query = state.wordSearchTerm.trim().toLowerCase()
  return getVocabularySourceItems().filter((item) => {
    const matchesQuery =
      !query ||
      `${item.term} ${item.definition} ${item.contextSentence} ${item.sourceTitle ?? ""}`
        .toLowerCase()
        .includes(query)
    const matchesDifficulty =
      state.difficultyFilter === "all" || item.difficulty === state.difficultyFilter
    const matchesSaved = !state.savedOnly || item.isSaved
    return matchesQuery && matchesDifficulty && matchesSaved
  })
}

const buildWordPanel = () => {
  const selectedSession = getSelectedSession()
  const isSavedSource = state.vocabularySourceMode === "saved"
  if (!selectedSession && !isSavedSource) {
    return `
      <section class="word-panel content-card">
        ${buildStateMarkup("Select a transcript to extract vocabulary.")}
      </section>
    `
  }

  const allItems = getVocabularySourceItems()
  const filteredItems = getFilteredVocabulary()
  const isMasked = selectedSession
    ? state.maskedVocabularySessionIds.has(selectedSession.sessionId)
    : false
  const content =
    isSavedSource && state.savedVocabularyState === "loading"
      ? buildLoadingMarkup("Loading saved vocabulary from every transcript.")
      : isSavedSource && state.savedVocabularyState === "error"
        ? buildStateMarkup(state.savedVocabularyError || "Could not load saved vocabulary.", { error: true })
        : state.vocabularyState === "loading" && !isSavedSource
          ? buildLoadingMarkup("Extracting vocabulary from transcript context.")
          : state.vocabularyState === "error" && !isSavedSource
            ? buildStateMarkup(state.vocabularyError || "Could not load vocabulary.", { error: true })
            : allItems.length === 0
              ? buildStateMarkup(
                  isSavedSource
                    ? "No saved vocabulary yet. Save words from transcript sources first."
                    : "No vocabulary candidates were found for this transcript.",
                )
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
                                data-save-session="${item.sourceSessionId ?? selectedSession?.sessionId ?? ""}"
                                aria-label="${item.isSaved ? `Unsave ${escapeHtml(item.term)}` : `Save ${escapeHtml(item.term)}`}"
                                aria-pressed="${item.isSaved}"
                                title="${item.isSaved ? "Unsave" : "Save"}"
                              >
                                ${buildStarIcon(item.isSaved)}
                              </button>
                            </div>
                            <p class="word-definition">${escapeHtml(item.definition)}</p>
                            <p class="word-context">${escapeHtml(item.contextSentence)}</p>
                            ${
                              isSavedSource
                                ? `<p class="word-source-line">${escapeHtml(item.sourceTitle ?? "Unknown source")}</p>`
                                : ""
                            }
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
          <h3 class="card-title">${escapeHtml(isSavedSource ? "Saved Vocabulary" : selectedSession.videoTitle)}</h3>
          <p class="panel-subtext">${escapeHtml(
            isSavedSource
              ? `${allItems.length} saved words across transcript sources.`
              : `${allItems.length} extracted words.`,
          )}</p>
        </div>
        <div class="inline-actions">
          ${
            isSavedSource
              ? ""
              : `
                <button
                  type="button"
                  class="icon-button ${isMasked ? "is-active" : ""}"
                  data-toggle-vocab-mask
                  aria-label="${isMasked ? "Show vocabulary bank" : "Hide vocabulary bank"}"
                  title="${isMasked ? "Show vocabulary bank" : "Hide vocabulary bank"}"
                >
                  ${buildEyeIcon(isMasked)}
                </button>
              `
          }
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
  if (state.vocabularySourceMode === "saved") {
    return `
      <aside class="mini-quiz-panel">
        ${buildStateMarkup("Pick a transcript source to start a vocabulary mini quiz. Saved Vocabulary is a review bank.")}
      </aside>
    `
  }
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
  const scrollSnapshot = captureScrollSnapshot(panel)
  if (state.sessionsState === "loading") {
    panel.innerHTML = buildLoadingMarkup(t("vocab.loading"))
    restoreScrollSnapshot(panel, scrollSnapshot)
    return
  }
  if (state.sessions.length === 0) {
    panel.innerHTML = buildStateMarkup(t("vocab.empty"))
    restoreScrollSnapshot(panel, scrollSnapshot)
    return
  }

  panel.innerHTML = `
    <div class="vocab-workspace ${state.isVocabularySourceCollapsed ? "is-source-collapsed" : ""}">
      ${buildSessionRail({
        title: t("vocab.source"),
        summary: t("vocab.sourceCopy"),
        collapsible: true,
        collapsed: state.isVocabularySourceCollapsed,
        includeSavedVocabulary: true,
      })}
      ${buildWordPanel()}
      ${buildMiniQuizPanel()}
    </div>
  `
  restoreScrollSnapshot(panel, scrollSnapshot)
}

const renderSettingsView = () => {
  const user = state.profile?.user
  const selectedLanguage = normalizeLanguage(user?.preferred_language ?? state.settings.language)
  elements.panels.settings.innerHTML = `
    <div class="settings-page">
      <section class="settings-hero">
        <div>
          <span class="eyebrow">${escapeHtml(t("settings.eyebrow"))}</span>
          <h3>${escapeHtml(t("settings.title"))}</h3>
          <p>${escapeHtml(t("settings.copy"))}</p>
        </div>
        <button type="button" class="button-ghost" data-reset-local-settings>${escapeHtml(t("settings.reset"))}</button>
      </section>

      <div class="settings-grid">
        <section class="settings-card settings-account-card">
          <div class="settings-card-header">
            <span class="eyebrow">${escapeHtml(t("settings.accountEyebrow"))}</span>
            <h3 class="card-title">${escapeHtml(t("settings.accountTitle"))}</h3>
          </div>
          <form class="settings-form" data-account-settings-form>
            <div class="settings-avatar-row">
              <div id="settings-avatar-preview" class="settings-avatar-preview" aria-hidden="true">
                ${buildAvatarContent(user)}
              </div>
              <div>
                <input id="settings-avatar-url" name="avatar_url" type="hidden" value="${escapeHtml(user?.avatar_url ?? "")}" />
                <input id="settings-avatar-file" class="sr-only" type="file" accept="image/*" />
                <div class="button-row">
                  <label class="button-ghost" for="settings-avatar-file">${escapeHtml(t("settings.chooseAvatar"))}</label>
                  <button type="button" class="button-text" data-remove-avatar>${escapeHtml(t("settings.removeAvatar"))}</button>
                </div>
                <p class="panel-subtext">${escapeHtml(t("settings.avatarHint"))}</p>
              </div>
            </div>

            <div class="settings-form-grid">
              <label class="control-field" for="settings-username">
                <span class="control-label">${escapeHtml(t("settings.username"))}</span>
                <input id="settings-username" name="username" class="control-input" type="text" value="${escapeHtml(user?.username ?? "")}" maxlength="100" required />
              </label>
              <label class="control-field" for="settings-email">
                <span class="control-label">${escapeHtml(t("settings.email"))}</span>
                <input id="settings-email" class="control-input" type="email" value="${escapeHtml(user?.email ?? "")}" disabled />
              </label>
              <label class="control-field" for="settings-language">
                <span class="control-label">${escapeHtml(t("settings.preferredLanguage"))}</span>
                <select id="settings-language" name="preferred_language" class="control-select">
                  ${buildLanguageOptions(selectedLanguage)}
                </select>
              </label>
              <div class="settings-inline-note">
                <span class="badge is-blue">${escapeHtml(t("settings.signedIn"))}</span>
                <p class="panel-subtext">${escapeHtml(t("settings.emailHelp"))}</p>
              </div>
            </div>
            ${buildNoticeMarkup(state.accountNotice, state.accountNoticeTone)}
            <div class="settings-actions">
              <button type="submit" class="button-primary">${escapeHtml(t("settings.saveProfile"))}</button>
            </div>
          </form>
          <div class="settings-row">
            <div>
              <strong>${escapeHtml(t("settings.sessionTitle"))}</strong>
              <p class="panel-subtext">${escapeHtml(t("settings.sessionCopy"))}</p>
            </div>
            <button type="button" class="button-ghost" data-settings-sign-out>${escapeHtml(t("shell.signOut"))}</button>
          </div>
        </section>

        <section class="settings-card">
          <div class="settings-card-header">
            <span class="eyebrow">${escapeHtml(t("settings.passwordEyebrow"))}</span>
            <h3 class="card-title">${escapeHtml(t("settings.passwordTitle"))}</h3>
          </div>
          <form class="settings-form" data-password-settings-form>
            <div class="settings-list">
              <label class="control-field" for="settings-current-password">
                <span class="control-label">${escapeHtml(t("settings.currentPassword"))}</span>
                <input id="settings-current-password" name="current_password" class="control-input" type="password" autocomplete="current-password" required />
              </label>
              <label class="control-field" for="settings-new-password">
                <span class="control-label">${escapeHtml(t("settings.newPassword"))}</span>
                <input id="settings-new-password" name="new_password" class="control-input" type="password" autocomplete="new-password" minlength="8" required />
              </label>
              <label class="control-field" for="settings-confirm-password">
                <span class="control-label">${escapeHtml(t("settings.confirmPassword"))}</span>
                <input id="settings-confirm-password" name="confirm_password" class="control-input" type="password" autocomplete="new-password" minlength="8" required />
              </label>
            </div>
            ${buildNoticeMarkup(state.passwordNotice, state.passwordNoticeTone)}
            <div class="settings-actions">
              <button type="submit" class="button-primary">${escapeHtml(t("settings.updatePassword"))}</button>
            </div>
          </form>
        </section>

        <section class="settings-card">
          <div class="settings-card-header">
            <span class="eyebrow">${escapeHtml(t("settings.quizEyebrow"))}</span>
            <h3 class="card-title">${escapeHtml(t("settings.quizTitle"))}</h3>
          </div>
          <div class="settings-form-grid">
            ${buildDifficultySelect("settings-difficulty")}
            ${buildQuestionTypeSelect("settings-question-type")}
          </div>
        </section>

        <section class="settings-card">
          <div class="settings-card-header">
            <span class="eyebrow">${escapeHtml(t("settings.vocabEyebrow"))}</span>
            <h3 class="card-title">${escapeHtml(t("settings.vocabTitle"))}</h3>
          </div>
          <div class="settings-list">
            ${buildToggleSetting({
              id: "autoMaskVocabulary",
              label: t("settings.autoMaskLabel"),
              description: t("settings.autoMaskDescription"),
              checked: state.settings.autoMaskVocabulary,
            })}
            ${buildToggleSetting({
              id: "collapseVocabularySource",
              label: t("settings.collapseSourceLabel"),
              description: t("settings.collapseSourceDescription"),
              checked: state.settings.collapseVocabularySource,
            })}
          </div>
        </section>

        <section class="settings-card">
          <div class="settings-card-header">
            <span class="eyebrow">${escapeHtml(t("settings.interfaceEyebrow"))}</span>
            <h3 class="card-title">${escapeHtml(t("settings.interfaceTitle"))}</h3>
          </div>
          <div class="settings-list">
            ${buildToggleSetting({
              id: "reduceMotion",
              label: t("settings.reduceMotionLabel"),
              description: t("settings.reduceMotionDescription"),
              checked: state.settings.reduceMotion,
            })}
            <div>
              <p class="settings-note">${escapeHtml(t("settings.localNote"))}</p>
            </div>
          </div>
        </section>
      </div>
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
  elements.viewTitle.textContent = t(`view.${state.activeView}.title`)
  elements.contextSummary.textContent = t(`view.${state.activeView}.context`)
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
    state.settings.language = normalizeLanguage(
      window.localStorage.getItem("dashboard_language") ??
        state.profile.user?.preferred_language ??
        state.settings.language,
    )
    window.localStorage.setItem("dashboard_language", state.settings.language)
    applyLanguage()
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
  state.vocabularySourceMode = "session"
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
    loadVocabulary(sessionId),
  ])
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

const loadAllVocabulary = async ({ force = false } = {}) => {
  if (state.sessions.length === 0) {
    return
  }

  const sessionIds = state.sessions.map((session) => session.sessionId)
  const missingSessionIds = force
    ? sessionIds
    : sessionIds.filter((sessionId) => !state.vocabularyBySessionId.has(sessionId))
  if (missingSessionIds.length === 0) {
    state.savedVocabularyState = "ready"
    renderVocabularyView()
    return
  }

  state.savedVocabularyState = "loading"
  state.savedVocabularyError = ""
  renderVocabularyView()
  try {
    await Promise.all(
      missingSessionIds.map(async (sessionId) => {
        const response = await apiFetch(`/api/v1/sessions/${sessionId}/vocabulary`)
        if (!response.ok) {
          throw new Error(await extractErrorMessage(response))
        }
        const payload = await response.json()
        const items = Array.isArray(payload.items)
          ? payload.items.map(normalizeVocabularyItem)
          : []
        state.vocabularyBySessionId.set(sessionId, items)
      }),
    )
    state.savedVocabularyState = "ready"
  } catch (error) {
    state.savedVocabularyState = "error"
    state.savedVocabularyError =
      error instanceof Error ? error.message : "Could not load saved vocabulary."
  }
  renderVocabularyView()
}

const saveVocabularyItem = async (term, sessionIdOverride = null) => {
  const sessionId = sessionIdOverride ?? state.selectedSessionId
  if (!sessionId) {
    return
  }

  const items = state.vocabularyBySessionId.get(sessionId) ?? []
  const item = items.find((candidate) => candidate.term === term)
  if (!item) {
    return
  }

  try {
    const response = item.isSaved
      ? await apiFetch(
          `/api/v1/sessions/${sessionId}/vocabulary/${encodeURIComponent(item.term)}`,
          { method: "DELETE" },
        )
      : await apiFetch(`/api/v1/sessions/${sessionId}/vocabulary`, {
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
    const updatedItem = normalizeVocabularyItem(await response.json())
    state.vocabularyBySessionId.set(
      sessionId,
      items.map((candidate) => (candidate.term === term ? updatedItem : candidate)),
    )
  } catch (error) {
    state.vocabularyState = "error"
    state.vocabularyError =
      error instanceof Error ? error.message : "Could not update this word."
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

const applyInterfaceSettings = () => {
  document.documentElement.classList.toggle("is-reduced-motion", state.settings.reduceMotion)
}

const persistToggleSetting = (setting, checked) => {
  if (setting === "autoMaskVocabulary") {
    state.settings.autoMaskVocabulary = checked
    window.localStorage.setItem("dashboard_auto_mask_vocabulary", String(checked))
  }
  if (setting === "collapseVocabularySource") {
    state.settings.collapseVocabularySource = checked
    state.isVocabularySourceCollapsed = checked
    window.localStorage.setItem("dashboard_collapse_vocabulary_source", String(checked))
  }
  if (setting === "reduceMotion") {
    state.settings.reduceMotion = checked
    window.localStorage.setItem("dashboard_reduce_motion", String(checked))
    applyInterfaceSettings()
  }
}

const persistLanguage = (language) => {
  state.settings.language = normalizeLanguage(language)
  window.localStorage.setItem("dashboard_language", state.settings.language)
  applyLanguage()
}

const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")))
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Could not read file.")))
    reader.readAsDataURL(file)
  })
}

const handleAvatarFileInput = async (input) => {
  const file = input.files?.[0]
  if (!file) {
    return
  }
  if (!file.type.startsWith("image/")) {
    state.accountNotice = t("settings.avatarInvalid")
    state.accountNoticeTone = "error"
    renderSettingsView()
    return
  }
  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    state.accountNotice = t("settings.avatarTooLarge")
    state.accountNoticeTone = "error"
    renderSettingsView()
    return
  }

  try {
    const dataUrl = await readFileAsDataUrl(file)
    const avatarInput = document.getElementById("settings-avatar-url")
    const preview = document.getElementById("settings-avatar-preview")
    if (avatarInput instanceof HTMLInputElement) {
      avatarInput.value = dataUrl
    }
    if (preview) {
      preview.innerHTML = `<img src="${escapeHtml(dataUrl)}" alt="" />`
    }
    state.accountNotice = ""
  } catch (error) {
    state.accountNotice = error instanceof Error ? error.message : t("settings.avatarInvalid")
    state.accountNoticeTone = "error"
    renderSettingsView()
  }
}

const saveAccountSettings = async (form) => {
  const formData = new FormData(form)
  const username = String(formData.get("username") ?? "").trim()
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim()
  const preferredLanguage = normalizeLanguage(String(formData.get("preferred_language") ?? state.settings.language))

  state.accountNotice = ""
  try {
    const response = await apiFetch("/api/v1/profile/account", {
      method: "PATCH",
      body: JSON.stringify({
        username,
        avatar_url: avatarUrl || null,
        preferred_language: preferredLanguage,
      }),
    })
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    state.profile.user = await response.json()
    persistLanguage(state.profile.user.preferred_language)
    state.accountNotice = t("settings.profileSaved")
    state.accountNoticeTone = "success"
  } catch (error) {
    state.accountNotice = error instanceof Error ? error.message : "Could not update profile."
    state.accountNoticeTone = "error"
  }

  renderAll()
}

const changeAccountPassword = async (form) => {
  const formData = new FormData(form)
  const currentPassword = String(formData.get("current_password") ?? "")
  const newPassword = String(formData.get("new_password") ?? "")
  const confirmPassword = String(formData.get("confirm_password") ?? "")

  state.passwordNotice = ""
  if (newPassword !== confirmPassword) {
    state.passwordNotice = t("settings.passwordMismatch")
    state.passwordNoticeTone = "error"
    renderSettingsView()
    return
  }

  try {
    const response = await apiFetch("/api/v1/profile/password", {
      method: "PATCH",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    })
    if (!response.ok) {
      throw new Error(await extractErrorMessage(response))
    }
    form.reset()
    state.passwordNotice = t("settings.passwordSaved")
    state.passwordNoticeTone = "success"
  } catch (error) {
    state.passwordNotice = error instanceof Error ? error.message : "Could not update password."
    state.passwordNoticeTone = "error"
  }

  renderSettingsView()
}

const resetLocalSettings = () => {
  state.settings.defaultDifficulty = "medium"
  state.settings.defaultQuestionType = "mixed"
  state.settings.autoMaskVocabulary = true
  state.settings.collapseVocabularySource = false
  state.settings.reduceMotion = false
  state.settings.language = normalizeLanguage(state.profile?.user?.preferred_language ?? "en")
  state.isVocabularySourceCollapsed = false
  for (const key of [
    "dashboard_default_difficulty",
    "dashboard_default_question_type",
    "dashboard_auto_mask_vocabulary",
    "dashboard_collapse_vocabulary_source",
    "dashboard_reduce_motion",
    "dashboard_language",
  ]) {
    window.localStorage.removeItem(key)
  }
  applyLanguage()
  applyInterfaceSettings()
  applyLanguage()
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
    panel.addEventListener("submit", (event) => {
      const target = event.target
      if (!(target instanceof HTMLFormElement)) {
        return
      }

      if (target.matches("[data-account-settings-form]")) {
        event.preventDefault()
        void saveAccountSettings(target)
        return
      }

      if (target.matches("[data-password-settings-form]")) {
        event.preventDefault()
        void changeAccountPassword(target)
      }
    })

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
      if (target instanceof HTMLInputElement && target.id === "settings-avatar-file") {
        void handleAvatarFileInput(target)
        return
      }
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
      if (target instanceof HTMLInputElement && target.dataset.settingToggle) {
        persistToggleSetting(target.dataset.settingToggle, target.checked)
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
        const questionCard = target.closest(".question-card")
        if (questionCard) {
          for (const row of questionCard.querySelectorAll(".option-row")) {
            row.classList.toggle("is-selected", row.contains(target))
          }
        }
        const submitButton = panel.querySelector("[data-submit-quiz]")
        if (submitButton instanceof HTMLButtonElement) {
          submitButton.disabled = !hasAnsweredEveryQuestion()
        }
        panel.querySelector("[role='status']")?.remove()
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

      const savedVocabularyButton = target.closest("[data-select-saved-vocabulary]")
      if (savedVocabularyButton) {
        event.preventDefault()
        state.vocabularySourceMode = "saved"
        state.wordSearchTerm = ""
        state.difficultyFilter = "all"
        state.savedOnly = false
        renderVocabularyView()
        void loadAllVocabulary()
        return
      }

      const sessionButton = target.closest("[data-select-session]")
      if (sessionButton) {
        event.preventDefault()
        state.vocabularySourceMode = "session"
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
          state.reviewedAttemptSessionIds.add(state.selectedSessionId)
          void loadAttemptHistoryForSession(state.selectedSessionId)
        }
        renderSessionsView()
        return
      }

      const learningActionButton = target.closest("[data-learning-action]")
      if (learningActionButton) {
        event.preventDefault()
        const action = learningActionButton.dataset.learningAction
        const sessionId = Number(learningActionButton.dataset.learningSession)

        if (action === "transcript") {
          if (state.expandedTranscriptSessionIds.has(sessionId)) {
            state.expandedTranscriptSessionIds.delete(sessionId)
          } else {
            state.expandedTranscriptSessionIds.add(sessionId)
          }
          renderSessionsView()
          return
        }

        if (action === "generate-quiz") {
          void generateQuizForSelectedSession()
          return
        }

        if (action === "quiz") {
          state.activeStudyTab = "quiz"
          renderSessionsView()
          return
        }

        if (action === "attempts") {
          state.activeStudyTab = "attempts"
          if (state.selectedSessionId) {
            state.reviewedAttemptSessionIds.add(state.selectedSessionId)
            void loadAttemptHistoryForSession(state.selectedSessionId)
          }
          renderSessionsView()
          return
        }

        if (action === "vocabulary" || action === "vocab-quiz") {
          void (async () => {
            setActiveView("vocabulary")
            await selectSession(sessionId, { replaceHistory: true })
            if (action === "vocab-quiz") {
              if (state.settings.autoMaskVocabulary) {
                state.maskedVocabularySessionIds.add(sessionId)
              }
              await loadVocabQuiz(sessionId)
            }
          })()
          return
        }

        if (action === "dashboard") {
          if (sessionId) {
            state.reflectedSessionIds.add(sessionId)
          }
          setActiveView("dashboard")
          return
        }
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
      if (refreshVocabularyButton) {
        event.preventDefault()
        if (state.vocabularySourceMode === "saved") {
          void loadAllVocabulary({ force: true })
        } else if (state.selectedSessionId) {
          void loadVocabulary(state.selectedSessionId, { force: true })
        }
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
        const sessionId = Number(saveButton.dataset.saveSession)
        void saveVocabularyItem(
          decodeURIComponent(saveButton.dataset.saveTerm ?? ""),
          Number.isFinite(sessionId) && sessionId > 0 ? sessionId : null,
        )
        return
      }

      const startVocabQuizButton = target.closest("[data-start-vocab-quiz]")
      if (startVocabQuizButton && state.selectedSessionId) {
        event.preventDefault()
        if (state.settings.autoMaskVocabulary) {
          state.maskedVocabularySessionIds.add(state.selectedSessionId)
        }
        void loadVocabQuiz(state.selectedSessionId)
        return
      }

      if (target.closest("[data-settings-sign-out]")) {
        event.preventDefault()
        clearAccessToken()
        redirectToLogin()
        return
      }

      if (target.closest("[data-reset-local-settings]")) {
        event.preventDefault()
        resetLocalSettings()
        renderAll()
        return
      }

      if (target.closest("[data-remove-avatar]")) {
        event.preventDefault()
        const avatarInput = document.getElementById("settings-avatar-url")
        const preview = document.getElementById("settings-avatar-preview")
        if (avatarInput instanceof HTMLInputElement) {
          avatarInput.value = ""
        }
        if (preview) {
          preview.innerHTML = buildAvatarContent({
            username: state.profile?.user?.username ?? "",
            avatar_url: null,
          })
        }
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

  applyInterfaceSettings()
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
