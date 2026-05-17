export type Language = "zh" | "en" | "es" | "vi";

export interface Translations {
  // Header
  appName: string;
  languageSwitcherTitle: string;
  languageSwitcherLabel: string;
  languageNameZh: string;
  languageNameEn: string;

  // Weather Calendar
  todayweather: string;
  loading: string;
  currentWeather: string;
  currentLocation: string;
  feelsLike: string;
  humidity: string;
  skincareAdvice: string;
  loadingWeather: string;
  skinConditionRecords: string;
  recordSkinConditionPlaceholder: string;
  saveRecord: string;
  recentRecords: string;
  noRecordsYet: string;
  weather: string;
  loadingAdvice: string;

  // Weather Advice
  weatherHotAdvice: string;
  weatherColdAdvice: string;
  weatherDryAdvice: string;
  weatherHumidAdvice: string;
  weatherUVAdvice: string;
  weatherNormalAdvice: string;

  // Calendar
  calendarTitle: string;
  calendarSubtitle: string;
  taptoopen: string;
  eventTypes: string;

  // Main Page - Tabs
  queryTab: string;
  chatTab: string;
  photoTab: string;
  historyTab: string;

  // Chat Section
  chatTitle: string;
  chatPlaceholder: string;
  sendButton: string;
  uploading: string;
  analyzing: string;

  // Photo Analysis Section
  photoTitle: string;
  uploadButton: string;
  analyzeButton: string;
  photoPlaceholder: string;
  descriptionPlaceholder: string;

  // Analysis Results
  analysisResults: string;
  skinType: string;
  skinConcerns: string;
  detailedAnalysis: string;
  recommendations: string;
  noRecommendations: string;

  // Weather Calendar Sidebar
  todayDate: string;
  todayWeather: string;
  temperature: string;
  uvIndex: string;
  skinAdvice: string;
  skinConditionHistory: string;
  noRecords: string;
  addRecord: string;
  recordPlaceholder: string;
  cancelRecord: string;
  locationError: string;
  locationNotSupported: string;
  concerns: string;

  // Weather advice (short)
  weatherHot: string;
  weatherCold: string;
  weatherDry: string;
  weatherHumid: string;
  weatherSunny: string;
  weatherNormal: string;

  // Tags
  photoTag: string;
  aiAnalysisTag: string;

  // Product Card
  viewDetails: string;
  ingredients: string;
  safetyScore: string;

  // Query Section
  queryTitle: string;
  queryDescription: string;
  queryPlaceholder: string;
  queryButton: string;
  querying: string;
  resultsFound: string;
  resultsProducts: string;
  similarity: string;
  noDescription: string;
  buyOnAmazon: string;
  searchAmazon: string;
  ewgRating: string;

  // Chat with Analysis
  chatAnalysisTitle: string;
  chatAnalysisDescription: string;
  chatStartMessage: string;
  chatPlaceholderLong: string;
  uploadPhoto: string;
  analyzeSkin: string;
  sendMessage: string;
  analyzing2: string;
  thinking: string;
  userUploaded: string;
  buyButton: string;

  // Hero / Landing
  heroDescription: string;
  revolutionizeYourSkincare: string;
  heroTitle: string;
  heroSubtitle: string;
  badge1: string;
  badge2: string;
  badge3: string;
  badge4: string;

  // System Info
  systemStatus: string;
  database: string;
  databaseInfo: string;
  embeddingModel: string;
  embeddingInfo: string;
  backendAPI: string;

  // Error Messages
  errorAnalysis: string;
  errorMessage: string;

  // Common
  error: string;
  retry: string;
  close: string;
  back: string;

  // Profile Page
  profileAccountType: string;
  profilePremiumMember: string;
  profileMemberSince: string;
  profileLogout: string;

  // Landing Page
  viewProfile: string;
  logOut: string;
  landingTitle: string;
  landingTagline: string;
  landingSubtitle: string;
  asfeaturedIn: string;
  getStarted: string;
  startNow: string;
  howItWorks: string;
  howItWorksSubtitle: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  coreFeatures: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;
  dataSupport: string;
  productsCount: string;
  linksCount: string;
  aiPowered: string;
  readyToFind: string;
  readyToFindDesc: string;
  footerText: string;
  apiDocs: string;
  createProfile: string;
  memberLogin: string;
  precisionSkincare: string;
  navFeatures: string;
  navHowItWorks: string;
  navScience: string;
  navLogin: string;
  navSignUp: string;
  ctaReadyTitle: string;
  ctaReady: string;
  ctaJoinText: string;
  ctaFreeStart: string;
  footerAllRights: string;
  quickDemo: string;

  // Auth Pages
  loginTitle: string;
  loginSubtitle: string;
  loginEmail: string;
  loginPassword: string;
  loginButton: string;
  loginLoading: string;
  loginError: string;
  loginFailed: string;
  loginNoAccount: string;
  loginSignupLink: string;
  loginOr: string;
  loginBackHome: string;
  signup: string;
  signupTitle: string;
  signupSubtitle: string;
  signupName: string;
  signupEmail: string;
  signupPassword: string;
  signupConfirmPassword: string;
  signupButton: string;
  signupLoading: string;
  signupErrorFields: string;
  signupErrorPassword: string;
  signupErrorPasswordLength: string;
  signupFailed: string;
  signupHaveAccount: string;
  signupLoginLink: string;
  signupOr: string;
  signupBackHome: string;
  signupNamePlaceholder: string;
  signupEmailPlaceholder: string;
  signupPasswordPlaceholder: string;
  signupConfirmPasswordPlaceholder: string;

  // Dashboard
  dashboardTitle: string;
  dashboardWelcome: string;
  dashboardContinue: string;
  dashboardLogout: string;
  dashboardSkinRecords: string;
  dashboardAIAnalysis: string;
  dashboardLastActivity: string;
  dashboardNoActivity: string;
  dashboardHistory: string;
  dashboardNoRecords: string;
  dashboardStartUsing: string;
  dashboardDetails: string;
  dashboardClickToView: string;
  dashboardContent: string;
  dashboardAnalysisResults: string;
  dashboardSkinType: string;
  dashboardConcerns: string;
  dashboardSummary: string;
  dashboardWeatherInfo: string;
  dashboardTemp: string;
  dashboardCondition: string;
  dashboardHumidity: string;
  dashboardUVIndex: string;
  dashboardWelcomeBack: string;
  dashboardJourneySummary: string;
  dashboardAIAssistantTitle: string;
  dashboardAIAssistantSubtitle: string;
  dashboardAIWelcomeMessage: string;
  dashboardRecentActivity: string;
  dashboardActivityRoutine: string;
  dashboardActivityPhoto: string;
  dashboardActivityRecommendation: string;
  dashboardActivityProductSaved: string;
  dashboardActivityTimeToday: string;
  dashboardActivityTimeYesterday: string;
  dashboardChatPlaceholder: string;
  dashboardSavedProducts: string;
  dashboardNoProducts: string;
  dashboardViewProduct: string;

  // App Page - Chat Interface
  appNewChat: string;
  appMenuHistory: string;
  appTitle: string;
  appSubtitle: string;
  appWelcomeMessage: string;
  appAnalyzeSkin: string;
  appRecommendProducts: string;
  appChatPlaceholder: string;
  appUploadImage: string;
  appPreview: string;
  appDisclaimer: string;
  appSunProtection: string;
  appAIAdvisor: string;

  // Sidebar Navigation
  sidebarNewConversation: string;
  sidebarLanguage: string;
  sidebarProfile: string;
  sidebarLogout: string;
  appChatDescription: string;
  appStartMessage: string;
  appUploadPhoto: string;
  appHistoryModalTitle: string;
  appNoHistory: string;
  appClose: string;
  appSkinType: string;
  appConcerns: string;
  appUserUploaded: string;

  // Enhanced Calendar / Google Calendar
  googleCalendarLabel: string;
  googleConnected: string;
  syncing: string;
  connected: string;
  connect: string;
  disconnect: string;
  disconnectSuccess: string;
  disconnectFailed: string;
  signInCancelled: string;
  invalidOrigin: string;
  credentialsNotConfigured: string;
  signInFailedPrefix: string;
  syncSuccessCount: string;
  syncCount: string;
  syncFailed: string;

  actionCreate: string;
  actionUpdate: string;
  actionDelete: string;
  syncActionFailedTemplate: string;

  // Calendar UI labels
  eventTypeLabel: string;
  titleLabel: string;
  eventTitlePlaceholder: string;
  descriptionOptional: string;
  eventDescriptionPlaceholder: string;
  existingEvents: string;
  addNewEvent: string;
  skincareRoutineLabel: string;
  skinConditionLabel: string;
  productDeliveryLabel: string;
  deliveryStatusOrdered: string;
  deliveryStatusShipped: string;
  deliveryStatusDelivered: string;
  deliveryStatusLabel: string;
  cancel: string;
  save: string;
  update: string;
  editEvent: string;
  addEvent: string;
  eventTypesHeading: string;
  weekDaysShort: string[];

  // Chat history page
  chatHistory: string;
  backToChat: string;
  signtoviewhistory: string;
  startChatting: string;
  last24Hours: string;
  last7Days: string;
  last30Days: string;
  last90Days: string;
  loadingChatHistory: string;
  noChatHistory: string;
  noChatHistoryDesc: string;
  you: string;
  skinmeAI: string;
  imageTag: string;
  showingMessages: string;
  messagesFromLast: string;
  days: string;

  // Ingredient Analysis
  ingredientAnalysis: string;

  // Daily Routine
  dailyRoutine: string;
  routineTrends: string;
}

export const translations: Record<Language, Translations> = {
  zh: {
    // Header
    appName: "SkinMe - AI 护肤助手",
    languageSwitcherTitle: "切换语言",
    languageSwitcherLabel: "语言",
    languageNameZh: "中文",
    languageNameEn: "English",

    // Weather Calendar
    todayweather: "今日日期",
    loading: "加载中...",
    currentWeather: "当前天气",
    currentLocation: "当前位置",
    feelsLike: "体感",
    humidity: "湿度",
    skincareAdvice: "护肤建议",
    loadingWeather: "加载天气数据...",
    skinConditionRecords: "皮肤状况记录",
    recordSkinConditionPlaceholder:
      "记录今天的皮肤状况...（例如：今天皮肤有点干燥）",
    saveRecord: "保存记录",
    recentRecords: "最近记录",
    noRecordsYet: "还没有记录",
    weather: "天气",
    loadingAdvice: "加载天气建议...",

    weatherHotAdvice: "☀️ 高温天气，加强保湿和防晒",
    weatherColdAdvice: "❄️ 寒冷天气，增强保湿防护",
    weatherDryAdvice: "💧 低湿度环境，使用保湿精华",
    weatherHumidAdvice: "💦 高湿度环境，使用清爽型产品",
    weatherUVAdvice: "🌞 紫外线较强，务必涂抹防晒霜",
    weatherNormalAdvice: "保持基础护肤 routine",

    // Calendar
    calendarTitle: "✨ 护肤日历",
    calendarSubtitle: "记录您的护肤旅程",
    taptoopen: "点击打开",
    eventTypes: "事件类型",

    // Tabs
    queryTab: "🔍 产品检索",
    chatTab: "💬 AI 对话",
    photoTab: "📷 拍照分析",
    historyTab: "📋 历史记录",

    // Chat Section
    chatTitle: "与 AI 护肤助手对话",
    chatPlaceholder: "描述你的皮肤问题或需求...",
    sendButton: "发送",
    uploading: "上传中...",
    analyzing: "分析中...",

    // Photo Analysis
    photoTitle: "上传皮肤照片进行 AI 分析",
    uploadButton: "选择照片",
    analyzeButton: "开始分析",
    photoPlaceholder: "请先上传一张清晰的皮肤照片",
    descriptionPlaceholder: "可选：描述你的皮肤问题或关注点...",

    // Analysis
    analysisResults: "分析结果",
    skinType: "肤质类型",
    skinConcerns: "皮肤问题",
    detailedAnalysis: "详细分析",
    recommendations: "产品推荐",
    noRecommendations: "暂无推荐产品",

    // Weather sidebar extra fields
    todayDate: "今天",
    todayWeather: "今日天气",
    temperature: "温度",
    uvIndex: "紫外线指数",
    skinAdvice: "护肤建议",
    skinConditionHistory: "皮肤历史记录",
    noRecords: "暂无记录",
    addRecord: "添加记录",
    recordPlaceholder: "记录你的皮肤状态...",
    cancelRecord: "取消",
    locationError: "无法获取位置信息",
    locationNotSupported: "当前环境不支持定位",
    concerns: "关注点",

    // Short weather tags
    weatherHot: "🌡️ 高温，注意防晒补水",
    weatherCold: "❄️ 低温，加强保湿",
    weatherDry: "💧 干燥，增加保湿",
    weatherHumid: "💦 潮湿，选择清爽产品",
    weatherSunny: "☀️ 晴朗，务必防晒",
    weatherNormal: "天气适宜，正常护肤即可",

    // Tags
    photoTag: "📷 照片",
    aiAnalysisTag: "🤖 AI 分析",

    // Product card
    viewDetails: "查看详情",
    ingredients: "成分",
    safetyScore: "安全评分",

    // Query
    queryTitle: "智能产品检索",
    queryDescription: "使用语义搜索找到最相关的护肤品",
    queryPlaceholder: "例如：适合干敏皮的保湿面霜",
    queryButton: "🔍 检索产品",
    querying: "检索中...",
    resultsFound: "找到",
    resultsProducts: "个相关产品",
    similarity: "相似度",
    noDescription: "无描述",
    buyOnAmazon: "🛒 Amazon 直购",
    searchAmazon: "🔍 Amazon 搜索",
    ewgRating: "📊 EWG 评分",

    // Chat + analysis
    chatAnalysisTitle: "AI 护肤顾问 + 皮肤分析",
    chatAnalysisDescription:
      "与 AI 对话获取护肤建议，或上传皮肤照片进行专业分析",
    chatStartMessage:
      "开始对话，询问关于护肤品的问题，或上传皮肤照片进行分析...",
    chatPlaceholderLong:
      "例如：我最近脸很干，有没有适合的保湿面霜？也可以描述你的肤质和日常习惯...",
    uploadPhoto: "📷 上传照片",
    analyzeSkin: "🔍 分析皮肤",
    sendMessage: "💬 发送消息",
    analyzing2: "分析中...",
    thinking: "思考中...",
    userUploaded: "用户上传",
    buyButton: "🛒 购买",

    // Hero / Landing
    heroDescription:
      "基于 EWG 数据库（12,000+ 个产品），结合 RAG 技术，为你推荐安全有效的护肤方案",
    revolutionizeYourSkincare: "革新您的护肤体验",
    heroTitle: ["护肤要适应你的生活，", "而不是让你去适应护肤。"].join("\n"),
    heroSubtitle:
      "SkinMe AI 综合你的肤质偏好、过敏信息、日程安排、产品使用记录、历史聊天内容以及当地天气与过敏原数据，为你制定随生活变化而更新的护肤方案。",
    badge1: "✅ ChromaDB 向量检索",
    badge2: "✅ OpenAI Embeddings",
    badge3: "✅ RAG 问答",
    badge4: "✅ Gemini 皮肤分析",

    // System info
    systemStatus: "系统状态",
    database: "数据库",
    databaseInfo: "ChromaDB（12,000+ 条产品数据）",
    embeddingModel: "Embedding 模型",
    embeddingInfo: "OpenAI text-embedding-3-small（1536 维）",
    backendAPI: "后端 API",

    // Errors
    errorAnalysis: "分析出错",
    errorMessage: "错误",

    // Common
    error: "出错了",
    retry: "重试",
    close: "关闭",
    back: "返回",

    // Profile
    profileAccountType: "账户类型",
    profilePremiumMember: "高级会员",
    profileMemberSince: "加入时间",
    profileLogout: "退出登录",

    // Landing main
    viewProfile: "查看个人资料",
    logOut: "退出登录",
    landingTitle: "SkinMe AI",
    landingTagline: "你的智能护肤助手",
    landingSubtitle:
      "SkinMe 将你的习惯、环境与肤况历史整合为一个动态档案——每一个推荐都基于你真实的生活，而不是抽象的肤质分类。",
    asfeaturedIn: "融合皮肤科学 · 数据智能 · 感性设计",
    getStarted: "🚀 开始使用",
    startNow: "🚀 立即开始",
    howItWorks: "SkinMe AI 是如何工作的",
    howItWorksSubtitle:
      "你的作息就是皮肤的一部分。我们把每个细节——睡眠、运动、旅行、天气——都转化为对皮肤有益的智能判断。",
    step1Title: "先让我们认识你的皮肤",
    step1Desc:
      "填写肤质、关注点和过敏信息，并连接日程，让 SkinMe 了解你的作息、运动和出行节奏。",
    step2Title: "让 AI 看懂你的规律",
    step2Desc:
      "综合作息、产品使用记录、历史聊天和本地天气 / 过敏源数据，找出皮肤变化背后的模式。",
    step3Title: "跟着一起变化的护肤方案",
    step3Desc:
      "生成早晚护肤步骤，并随季节、旅行和生活变化动态调整，你也可以随时回看所有方案、聊天和皮肤记录。",

    coreFeatures: "核心功能",
    feature1Title: "360° 个人肌肤档案",
    feature1Desc:
      "记录肤质、过敏、偏好与护肤目标。连接日程后，SkinMe 能理解睡眠、压力、运动等生活因素对皮肤的长期影响。",
    feature2Title: "实时自适应护肤引擎",
    feature2Desc:
      "结合产品使用记录、历史对话、天气、紫外线和湿度变化，实时调整护肤步骤，提醒何时加减产品与成分。",
    feature3Title: "皮肤分析与长期追踪",
    feature3Desc:
      "上传皮肤照片，追踪细纹、泛红、痘痘等变化。所有护肤调整和结果都被储存，帮助你找到真正有效的方法。",
    feature4Title: "EWG 评分支持",
    feature4Desc: "基于权威 EWG 数据库，产品安全透明可追溯",

    dataSupport: "强大的数据支持",
    productsCount: "护肤产品",
    linksCount: "购买链接",
    aiPowered: "AI 驱动",

    readyToFind: "准备好找到适合你的护肤方案了吗？",
    readyToFindDesc: "立即开始，让 AI 为你推荐更贴合生活的护肤组合。",
    footerText: "© 2025 SkinMe AI. Powered by EWG Database & OpenAI.",
    apiDocs: "API 文档",

    createProfile: "创建你的肌肤档案",
    memberLogin: "会员登录",
    precisionSkincare: "真正为你而生的个性化护肤AI",

    navFeatures: "特色功能",
    navHowItWorks: "工作原理",
    navScience: "技术",
    navLogin: "登录",
    navSignUp: "注册",

    ctaReadyTitle: "返回 SkinMe",
    ctaReady: "准备好让护肤跟上你的生活节奏了吗？",
    ctaJoinText:
      "只需一次建档。之后，SkinMe 会随着你的反馈与习惯持续学习成长。",
    ctaFreeStart: "免费开始智能护肤",
    footerAllRights: "保留所有权利",
    quickDemo: "快速演示",

    // Auth
    loginTitle: "登录 SkinMe AI",
    loginSubtitle: "继续你的智能护肤旅程",
    loginEmail: "邮箱地址",
    loginPassword: "密码",
    loginButton: "登录",
    loginLoading: "登录中...",
    loginError: "请填写邮箱和密码",
    loginFailed: "登录失败，请重试",
    loginNoAccount: "还没有账号？",
    loginSignupLink: "立即注册",
    loginOr: "或者",
    loginBackHome: "← 返回首页",

    signup: "注册",
    signupTitle: "注册 SkinMe AI",
    signupSubtitle: "开启你的智能护肤旅程",
    signupName: "姓名",
    signupEmail: "邮箱地址",
    signupPassword: "密码",
    signupConfirmPassword: "确认密码",
    signupButton: "注册",
    signupLoading: "注册中...",
    signupErrorFields: "请填写所有字段",
    signupErrorPassword: "两次输入的密码不一致",
    signupErrorPasswordLength: "密码至少需要 6 个字符",
    signupFailed: "注册失败，请重试",
    signupHaveAccount: "已有账号？",
    signupLoginLink: "立即登录",
    signupOr: "或者",
    signupBackHome: "← 返回首页",
    signupNamePlaceholder: "你的姓名",
    signupEmailPlaceholder: "你的邮箱地址",
    signupPasswordPlaceholder: "设置一个密码",
    signupConfirmPasswordPlaceholder: "再次输入密码",

    // Dashboard
    dashboardTitle: "我的面板",
    dashboardWelcome: "欢迎回来",
    dashboardContinue: "🔍 继续使用",
    dashboardLogout: "🚪 登出",
    dashboardSkinRecords: "皮肤记录",
    dashboardAIAnalysis: "AI 分析",
    dashboardLastActivity: "最后活动",
    dashboardNoActivity: "暂无记录",
    dashboardHistory: "历史记录",
    dashboardNoRecords: "还没有记录",
    dashboardStartUsing: "开始使用",
    dashboardDetails: "详细信息",
    dashboardClickToView: "点击左侧记录查看详情",
    dashboardContent: "内容",
    dashboardAnalysisResults: "AI 分析结果",
    dashboardSkinType: "肤质：",
    dashboardConcerns: "关注点：",
    dashboardSummary: "摘要：",
    dashboardWeatherInfo: "天气信息",
    dashboardTemp: "温度",
    dashboardCondition: "状况",
    dashboardHumidity: "湿度",
    dashboardUVIndex: "紫外线指数",
    dashboardWelcomeBack: "欢迎回来！",
    dashboardJourneySummary: "这是你护肤旅程的概要。",
    dashboardAIAssistantTitle: "SkinMe AI 助手",
    dashboardAIAssistantSubtitle: "你的个性化肌肤管理顾问",
    dashboardAIWelcomeMessage:
      "你好！我是你的护肤分析助手。可以随时向我提问，或上传照片开始分析。",
    dashboardRecentActivity: "最近活动",
    dashboardActivityRoutine: "记录早间护肤",
    dashboardActivityPhoto: "上传皮肤照片",
    dashboardActivityRecommendation: "新的护肤建议",
    dashboardActivityProductSaved: "保存推荐产品",
    dashboardActivityTimeToday: "今天",
    dashboardActivityTimeYesterday: "昨天",
    dashboardChatPlaceholder: "输入消息...",
    dashboardSavedProducts: "推荐产品",
    dashboardNoProducts: "暂无保存的产品",
    dashboardViewProduct: "查看详情",

    // App chat page
    appNewChat: "+ 新对话",
    appMenuHistory: "查看历史",
    appTitle: "SkinMe AI",
    appSubtitle: "SkinMe AI 护肤助手",
    appWelcomeMessage: "上传皮肤照片或描述你的皮肤问题",
    appAnalyzeSkin: "分析皮肤状况",
    appRecommendProducts: "推荐护肤产品",
    appChatPlaceholder: "有什么皮肤问题想咨询...",
    appUploadImage: "上传图片",
    appPreview: "预览",
    appDisclaimer: "SkinMe AI 可能会出错，请自行核对重要信息。",
    appSunProtection: "☀️ 记得防晒",
    appAIAdvisor: "AI 护肤顾问",
    appChatDescription:
      "与 AI 对话获取护肤建议，或上传皮肤照片进行专业分析",
    appStartMessage:
      "开始对话，询问关于护肤的问题，或上传皮肤照片进行分析...",
    appUploadPhoto: "上传图片",
    appHistoryModalTitle: "📋 历史记录",
    appNoHistory: "还没有历史记录",
    appClose: "关闭",
    appSkinType: "肤质",
    appConcerns: "问题",
    appUserUploaded: "用户上传",

    // Sidebar
    sidebarNewConversation: "新对话",
    sidebarLanguage: "切换语言",
    sidebarProfile: "个人资料",
    sidebarLogout: "退出登录",

    // Google Calendar
    googleCalendarLabel: "Google 日历",
    googleConnected: "✅ 已成功连接到 Google 日历！",
    syncing: "同步中...",
    connected: "已连接",
    connect: "连接",
    disconnect: "断开连接",
    disconnectSuccess: "ℹ️ 已断开与 Google 日历的连接",
    disconnectFailed: "❌ 断开连接失败",
    signInCancelled: "❌ 登录已取消，请重试。",
    invalidOrigin:
      "❌ OAuth 配置错误：请在 Google Cloud Console 中添加 http://localhost:3001 到 “已获授权的 JavaScript 来源”。",
    credentialsNotConfigured:
      "❌ Google Calendar API 未配置，请检查 .env.local 文件。",
    signInFailedPrefix: "❌ 登录失败：",
    syncSuccessCount: "✅ 成功同步 {count} 个事件到 Google 日历！",
    syncCount: "同步 ({count})",
    syncFailed: "❌ 批量同步失败：{error}",

    actionCreate: "创建",
    actionUpdate: "更新",
    actionDelete: "删除",
    syncActionFailedTemplate: "❌ 同步失败：无法 {action} 事件",

    // Calendar UI labels
    eventTypeLabel: "事件类型",
    titleLabel: "标题",
    eventTitlePlaceholder: "例如：早间护肤、新面霜到货",
    descriptionOptional: "说明（可选）",
    eventDescriptionPlaceholder: "添加详细说明...",
    existingEvents: "已有事件：",
    addNewEvent: "添加新事件：",
    skincareRoutineLabel: "💆 护肤例行",
    skinConditionLabel: "🌡️ 皮肤状况",
    productDeliveryLabel: "📦 产品配送",
    deliveryStatusOrdered: "📝 已下单",
    deliveryStatusShipped: "🚚 已发货",
    deliveryStatusDelivered: "✅ 已送达",
    deliveryStatusLabel: "配送状态",
    cancel: "取消",
    save: "保存",
    update: "更新",
    editEvent: "编辑事件",
    addEvent: "添加事件",
    eventTypesHeading: "事件类型：",
    weekDaysShort: ["日", "一", "二", "三", "四", "五", "六"],

    // Chat history page
    chatHistory: "聊天记录",
    backToChat: "返回聊天",
    signtoviewhistory: "登录以查看你的聊天历史记录",
    startChatting: "开始聊天",
    last24Hours: "最近 24 小时",
    last7Days: "最近 7 天",
    last30Days: "最近 30 天",
    last90Days: "最近 90 天",
    loadingChatHistory: "加载聊天记录中...",
    noChatHistory: "暂无聊天记录",
    noChatHistoryDesc: "开始对话后，你的聊天记录会显示在这里。",
    you: "你",
    skinmeAI: "SkinMe AI",
    imageTag: "图片",
    showingMessages: "显示",
    messagesFromLast: "条消息，来自最近",
    days: "天",

    // Ingredient Analysis
    ingredientAnalysis: "成分分析",

    // Daily Routine
    dailyRoutine: "每日护肤",
    routineTrends: "使用趋势",
  },

  en: {
    // Header
    appName: "SkinMe - AI Skincare Assistant",
    languageSwitcherTitle: "Switch Language",
    languageSwitcherLabel: "Language",
    languageNameZh: "中文",
    languageNameEn: "English",

    // Weather Calendar
    todayweather: "Today's Date",
    loading: "Loading...",
    currentWeather: "Current Weather",
    currentLocation: "Current Location",
    feelsLike: "Feels like",
    humidity: "Humidity",
    skincareAdvice: "Skincare Advice",
    loadingWeather: "Loading weather data...",
    skinConditionRecords: "Skin Condition Records",
    recordSkinConditionPlaceholder:
      "Record today's skin condition... (e.g., My skin feels a bit dry today)",
    saveRecord: "Save Record",
    recentRecords: "Recent Records",
    noRecordsYet: "No records yet",
    weather: "Weather",
    loadingAdvice: "Loading weather advice...",

    weatherHotAdvice: "☀️ Hot weather – boost moisturizing and sun protection.",
    weatherColdAdvice: "❄️ Cold weather – reinforce your moisturizing barrier.",
    weatherDryAdvice: "💧 Dry air – add a hydrating serum to your routine.",
    weatherHumidAdvice: "💦 Humid climate – use lightweight, non-greasy products.",
    weatherUVAdvice: "🌞 Strong UV today – don't skip sunscreen.",
    weatherNormalAdvice: "Weather is stable – follow your usual routine.",

    // Calendar
    calendarTitle: "✨ Skin Calendar",
    calendarSubtitle: "Track your skincare journey",
    taptoopen: "Tap to open",
    eventTypes: "Event Types",

    // Tabs
    queryTab: "🔍 Product Search",
    chatTab: "💬 AI Chat",
    photoTab: "📷 Photo Analysis",
    historyTab: "📋 History",

    // Chat Section
    chatTitle: "Chat with AI Skincare Assistant",
    chatPlaceholder: "Describe your skin concerns or needs...",
    sendButton: "Send",
    uploading: "Uploading...",
    analyzing: "Analyzing...",

    // Photo Analysis
    photoTitle: "Upload a skin photo for AI analysis",
    uploadButton: "Choose Photo",
    analyzeButton: "Start Analysis",
    photoPlaceholder: "Please upload a clear photo of your skin first",
    descriptionPlaceholder: "Optional: Describe your skin concerns...",

    // Analysis
    analysisResults: "Analysis Results",
    skinType: "Skin Type",
    skinConcerns: "Skin Concerns",
    detailedAnalysis: "Detailed Analysis",
    recommendations: "Product Recommendations",
    noRecommendations: "No recommendations available",

    // Weather sidebar extras
    todayDate: "Today",
    todayWeather: "Today's Weather",
    temperature: "Temperature",
    uvIndex: "UV Index",
    skinAdvice: "Skincare Tip",
    skinConditionHistory: "Skin Condition History",
    noRecords: "No records yet",
    addRecord: "Add Record",
    recordPlaceholder: "Write down how your skin feels today...",
    cancelRecord: "Cancel",
    locationError: "Unable to fetch location",
    locationNotSupported: "Location is not supported in this environment",
    concerns: "Concerns",

    // Short weather labels
    weatherHot: "🌡️ Hot – hydrate & protect",
    weatherCold: "❄️ Cold – moisturize more",
    weatherDry: "💧 Dry – add hydration",
    weatherHumid: "💦 Humid – go lightweight",
    weatherSunny: "☀️ Sunny – wear SPF",
    weatherNormal: "Balanced – follow normal routine",

    // Tags
    photoTag: "📷 Photo",
    aiAnalysisTag: "🤖 AI Analysis",

    // Product Card
    viewDetails: "View Details",
    ingredients: "Ingredients",
    safetyScore: "Safety Score",

    // Query Section
    queryTitle: "Smart Product Search",
    queryDescription:
      "Use semantic search to find skincare products that truly match your needs.",
    queryPlaceholder: "e.g., best moisturizer for dry sensitive skin",
    queryButton: "🔍 Search Products",
    querying: "Searching...",
    resultsFound: "Found",
    resultsProducts: "relevant products",
    similarity: "Similarity",
    noDescription: "No description",
    buyOnAmazon: "🛒 Buy on Amazon",
    searchAmazon: "🔍 Search on Amazon",
    ewgRating: "📊 EWG Rating",

    // Chat + analysis
    chatAnalysisTitle: "AI Skincare Advisor + Skin Analysis",
    chatAnalysisDescription:
      "Chat with AI for skincare advice, or upload photos for deeper analysis.",
    chatStartMessage:
      "Start by asking a skincare question, or upload a photo of your skin for AI analysis.",
    chatPlaceholderLong:
      "For example: My skin is very dry lately, what kind of moisturizer should I use? You can also describe your routine and allergies.",
    uploadPhoto: "📷 Upload Photo",
    analyzeSkin: "🔍 Analyze Skin",
    sendMessage: "💬 Send Message",
    analyzing2: "Analyzing...",
    thinking: "Thinking...",
    userUploaded: "User uploaded",
    buyButton: "🛒 Buy",

    // Hero / Landing
    heroDescription:
      "Powered by the EWG database (12,000+ products) and RAG search to recommend safe, effective skincare tailored to you.",
    revolutionizeYourSkincare: "Revolutionize Your Skincare",
    heroTitle: ["Skincare that learns your life,", "not just your skin."].join(
      "\n"
    ),
    heroSubtitle:
      "SkinMe AI combines your preferences, allergies, daily schedule, product history, chat memories, and real-time weather and allergy data to design a routine that adapts with you every day.",
    badge1: "✅ ChromaDB Vector Search",
    badge2: "✅ OpenAI Embeddings",
    badge3: "✅ RAG Q&A",
    badge4: "✅ Gemini Skin Analysis",

    // System info
    systemStatus: "System Status",
    database: "Database",
    databaseInfo: "ChromaDB (12,000+ product records)",
    embeddingModel: "Embedding Model",
    embeddingInfo: "OpenAI text-embedding-3-small (1536 dims)",
    backendAPI: "Backend API",

    // Errors
    errorAnalysis: "Analysis error",
    errorMessage: "Error",

    // Common
    error: "An error occurred",
    retry: "Retry",
    close: "Close",
    back: "Back",

    // Profile
    profileAccountType: "Account Type",
    profilePremiumMember: "Premium Member",
    profileMemberSince: "Member Since",
    profileLogout: "Log Out",

    // Landing main
    viewProfile: "View Profile",
    logOut: "Log Out",
    landingTitle: "SkinMe AI",
    landingTagline: "Your intelligent skincare assistant",
    landingSubtitle:
      "SkinMe AI connects your habits, environment, and skin history into one living profile—so every recommendation is grounded in your real life, not in generic skin types.",
    asfeaturedIn: "BUILT WITH DERMATOLOGY, DATA AND DESIGN",
    getStarted: "🚀 Get Started",
    startNow: "🚀 Start Now",

    howItWorks: "How SkinMe AI works",
    howItWorksSubtitle:
      "From your calendar to your climate, every detail becomes care. Here is how we turn your daily life into an adaptive skincare plan.",
    step1Title: "Tell us about your skin",
    step1Desc:
      "Share your skin type, concerns and allergies. Connect your calendar so SkinMe can understand your work, sleep, travel and workouts.",
    step2Title: "Let AI read your patterns",
    step2Desc:
      "We combine your routines, product history, chats and local weather & allergy data to see how your skin reacts over time.",
    step3Title: "Follow an evolving routine",
    step3Desc:
      "Get day and night routines that update with seasons, trips and lifestyle changes. Revisit past plans, chats and skin records anytime.",

    coreFeatures: "Core Features",
    feature1Title: "360° personal skin profile",
    feature1Desc:
      "Tell us your skin type, sensitivities, allergies and goals, then connect your calendar and product history. SkinMe builds a living profile that understands how your lifestyle, stress and sleep affect your skin.",
    feature2Title: "Adaptive routine engine",
    feature2Desc:
      "Our AI analyses your past chats, current routine, local weather, UV, humidity and allergy index to adjust your morning and night routines in real time—when to use what, and when to give your skin a break.",
    feature3Title: "Skin analysis & long-term records",
    feature3Desc:
      "Upload photos to track texture, redness and breakouts over time. SkinMe stores your skin history, routine changes and AI suggestions in one place, so you can see what truly works for you.",
    feature4Title: "EWG Rating support",
    feature4Desc:
      "Product safety and transparency backed by the authoritative EWG database.",

    dataSupport: "Powerful Data Support",
    productsCount: "Skincare Products",
    linksCount: "Purchase Links",
    aiPowered: "AI Powered",

    readyToFind: "Ready to find skincare that really fits you?",
    readyToFindDesc:
      "Start now and let AI recommend products that match your lifestyle, skin and environment.",
    footerText: "© 2025 SkinMe AI. Powered by EWG Database & OpenAI.",
    apiDocs: "API Docs",

    createProfile: "Create your skin profile",
    memberLogin: "Member Login",
    precisionSkincare: "A 360° skincare brain built just for you",

    navFeatures: "Features",
    navHowItWorks: "How It Works",
    navScience: "Science",
    navLogin: "Log In",
    navSignUp: "Sign Up",

    ctaReadyTitle: "Go back to Chat",
    ctaReady: "Ready to let your routine move with your life?",
    ctaJoinText:
      "Create a skin profile once. From there, SkinMe AI keeps learning from your habits, environment and feedback—so every week your routine becomes a little smarter, and a little more you.",
    ctaFreeStart: "Start your adaptive routine",
    footerAllRights: "All rights reserved.",
    quickDemo: "Quick Demo →",

    // Auth
    loginTitle: "Log in to SkinMe AI",
    loginSubtitle: "Continue your intelligent skincare journey",
    loginEmail: "Email Address",
    loginPassword: "Password",
    loginButton: "Log In",
    loginLoading: "Logging in...",
    loginError: "Please fill in email and password.",
    loginFailed: "Login failed, please try again.",
    loginNoAccount: "Don't have an account?",
    loginSignupLink: "Sign up now",
    loginOr: "or",
    loginBackHome: "← Back to Home",

    signup: "Sign Up",
    signupTitle: "Sign up for SkinMe AI",
    signupSubtitle: "Start your intelligent skincare journey",
    signupName: "Name",
    signupEmail: "Email Address",
    signupPassword: "Password",
    signupConfirmPassword: "Confirm Password",
    signupButton: "Sign Up",
    signupLoading: "Signing up...",
    signupErrorFields: "Please fill in all fields.",
    signupErrorPassword: "Passwords do not match.",
    signupErrorPasswordLength: "Password must be at least 6 characters.",
    signupFailed: "Signup failed, please try again.",
    signupHaveAccount: "Already have an account?",
    signupLoginLink: "Log in now",
    signupOr: "or",
    signupBackHome: "← Back to Home",
    signupNamePlaceholder: "Your name",
    signupEmailPlaceholder: "Your email address",
    signupPasswordPlaceholder: "Set a password",
    signupConfirmPasswordPlaceholder: "Confirm password",

    // Dashboard
    dashboardTitle: "My Dashboard",
    dashboardWelcome: "Welcome back",
    dashboardContinue: "🔍 Continue",
    dashboardLogout: "🚪 Log Out",
    dashboardSkinRecords: "Skin Records",
    dashboardAIAnalysis: "AI Analysis",
    dashboardLastActivity: "Last Activity",
    dashboardNoActivity: "No activity yet",
    dashboardHistory: "History",
    dashboardNoRecords: "No records yet",
    dashboardStartUsing: "Start using",
    dashboardDetails: "Details",
    dashboardClickToView: "Click a record on the left to see details",
    dashboardContent: "Content",
    dashboardAnalysisResults: "AI Analysis Results",
    dashboardSkinType: "Skin type:",
    dashboardConcerns: "Concerns:",
    dashboardSummary: "Summary:",
    dashboardWeatherInfo: "Weather Info",
    dashboardTemp: "Temperature",
    dashboardCondition: "Condition",
    dashboardHumidity: "Humidity",
    dashboardUVIndex: "UV Index",
    dashboardWelcomeBack: "Welcome back!",
    dashboardJourneySummary: "Here is a snapshot of your skincare journey.",
    dashboardAIAssistantTitle: "SkinMe AI Assistant",
    dashboardAIAssistantSubtitle: "Your personal guide to better skin",
    dashboardAIWelcomeMessage:
      "Hi! I'm your skincare analysis assistant. Ask me anything or upload a photo to get started.",
    dashboardRecentActivity: "Recent Activity",
    dashboardActivityRoutine: "Logged AM routine",
    dashboardActivityPhoto: "Uploaded skin photo",
    dashboardActivityRecommendation: "New recommendation",
    dashboardActivityProductSaved: "Saved recommended product",
    dashboardActivityTimeToday: "Today",
    dashboardActivityTimeYesterday: "Yesterday",
    dashboardChatPlaceholder: "Type a message...",
    dashboardSavedProducts: "Recommended Products",
    dashboardNoProducts: "No saved products yet",
    dashboardViewProduct: "View product",

    // App chat page
    appNewChat: "+ New Chat",
    appMenuHistory: "View History",
    appTitle: "SkinMe AI",
    appSubtitle: "SkinMe AI Skincare Assistant",
    appWelcomeMessage: "Upload a skin photo or describe your skin concerns.",
    appAnalyzeSkin: "Analyze Skin Condition",
    appRecommendProducts: "Recommend Products",
    appChatPlaceholder: "What skincare concerns do you have...",
    appUploadImage: "Upload Image",
    appPreview: "Preview",
    appDisclaimer:
      "SkinMe AI may make mistakes. Please verify important information.",
    appSunProtection: "☀️ Remember sun protection.",
    appAIAdvisor: "AI Skincare Advisor",
    appChatDescription:
      "Chat with AI for skincare advice, or upload skin photos for professional analysis.",
    appStartMessage:
      "Start chatting, ask skincare questions, or upload a photo for analysis...",
    appUploadPhoto: "Upload Photo",
    appHistoryModalTitle: "📋 History",
    appNoHistory: "No history yet",
    appClose: "Close",
    appSkinType: "Skin Type",
    appConcerns: "Concerns",
    appUserUploaded: "User uploaded",

    // Sidebar
    sidebarNewConversation: "New Conversation",
    sidebarLanguage: "Switch Language",
    sidebarProfile: "Profile",
    sidebarLogout: "Log Out",

    // Google Calendar
    googleCalendarLabel: "Google Calendar",
    googleConnected: "✅ Successfully connected to Google Calendar!",
    syncing: "Syncing...",
    connected: "Connected",
    connect: "Connect",
    disconnect: "Disconnect",
    disconnectSuccess: "ℹ️ Disconnected from Google Calendar",
    disconnectFailed: "❌ Failed to disconnect",
    signInCancelled: "❌ Sign-in cancelled. Please try again.",
    invalidOrigin:
      "❌ OAuth configuration error: please add http://localhost:3001 to “Authorized JavaScript origins” in Google Cloud Console.",
    credentialsNotConfigured:
      "❌ Google Calendar API not configured. Please check your .env.local file.",
    signInFailedPrefix: "❌ Sign-in failed: ",
    syncSuccessCount:
      "✅ Successfully synced {count} events to your Google Calendar!",
    syncCount: "Sync ({count})",
    syncFailed: "❌ Batch sync failed: {error}",

    actionCreate: "create",
    actionUpdate: "update",
    actionDelete: "delete",
    syncActionFailedTemplate: "❌ Sync failed: could not {action} event",

    // Calendar UI labels
    eventTypeLabel: "Event Type",
    titleLabel: "Title",
    eventTitlePlaceholder: "e.g., Morning routine, New moisturizer arrived",
    descriptionOptional: "Description (optional)",
    eventDescriptionPlaceholder: "Add details...",
    existingEvents: "Existing events:",
    addNewEvent: "Add new event:",
    skincareRoutineLabel: "💆 Skincare routine",
    skinConditionLabel: "🌡️ Skin condition",
    productDeliveryLabel: "📦 Product delivery",
    deliveryStatusOrdered: "📝 Ordered",
    deliveryStatusShipped: "🚚 Shipped",
    deliveryStatusDelivered: "✅ Delivered",
    deliveryStatusLabel: "Delivery status",
    cancel: "Cancel",
    save: "Save",
    update: "Update",
    editEvent: "Edit event",
    addEvent: "Add event",
    eventTypesHeading: "Event types:",
    weekDaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],

    // Chat history page
    chatHistory: "Chat History",
    backToChat: "Back to Chat",
    signtoviewhistory:
      "Sign in to view your previous conversations and continue where you left off.",
    startChatting: "Start Chatting",
    last24Hours: "Last 24 hours",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    last90Days: "Last 90 days",
    loadingChatHistory: "Loading chat history...",
    noChatHistory: "No chat history yet",
    noChatHistoryDesc:
      "Start a conversation to see your chat history appear here.",
    you: "You",
    skinmeAI: "SkinMe AI",
    imageTag: "Image",
    showingMessages: "Showing",
    messagesFromLast: "messages from the last",
    days: "days",

    // Ingredient Analysis
    ingredientAnalysis: "Ingredient Analysis",

    // Daily Routine
    dailyRoutine: "Daily Routine",
    routineTrends: "Usage Trends",
  },

  es: {
    // Header
    appName: "SkinMe - Asistente de Cuidado de la Piel con IA",
    languageSwitcherTitle: "Cambiar idioma",
    languageSwitcherLabel: "Idioma",
    languageNameZh: "中文",
    languageNameEn: "English",

    // Weather Calendar
    todayweather: "Fecha de hoy",
    loading: "Cargando...",
    currentWeather: "Clima actual",
    currentLocation: "Ubicación actual",
    feelsLike: "Sensación térmica",
    humidity: "Humedad",
    skincareAdvice: "Consejos de cuidado",
    loadingWeather: "Cargando datos del clima...",
    skinConditionRecords: "Registros del estado de la piel",
    recordSkinConditionPlaceholder:
      "Registra el estado de tu piel hoy... (ej.: hoy mi piel está un poco seca)",
    saveRecord: "Guardar registro",
    recentRecords: "Registros recientes",
    noRecordsYet: "Aún no hay registros",
    weather: "Clima",
    loadingAdvice: "Cargando recomendaciones según el clima...",

    weatherHotAdvice:
      "☀️ Hace calor: refuerza la hidratación y la protección solar.",
    weatherColdAdvice:
      "❄️ Hace frío: usa una crema más nutritiva para proteger la barrera.",
    weatherDryAdvice:
      "💧 El aire está seco: añade un sérum hidratante a tu rutina.",
    weatherHumidAdvice:
      "💦 Ambiente húmedo: prefiere texturas ligeras y no grasosas.",
    weatherUVAdvice:
      "🌞 Radiación UV intensa: no olvides aplicar protector solar.",
    weatherNormalAdvice:
      "El clima está estable: sigue tu rutina habitual de cuidado de la piel.",

    // Calendar
    calendarTitle: "✨ Calendario de la piel",
    calendarSubtitle: "Registra tu recorrido de cuidado de la piel",
    taptoopen: "Toca para abrir",
    eventTypes: "Tipos de eventos",

    // Tabs
    queryTab: "🔍 Búsqueda de productos",
    chatTab: "💬 Chat con IA",
    photoTab: "📷 Análisis de fotos",
    historyTab: "📋 Historial",

    // Chat Section
    chatTitle: "Chatea con el asistente de cuidado de la piel con IA",
    chatPlaceholder: "Describe tus preocupaciones o necesidades de la piel...",
    sendButton: "Enviar",
    uploading: "Subiendo...",
    analyzing: "Analizando...",

    // Photo Analysis
    photoTitle: "Sube una foto de tu piel para análisis con IA",
    uploadButton: "Elegir foto",
    analyzeButton: "Iniciar análisis",
    photoPlaceholder: "Primero sube una foto clara de tu piel",
    descriptionPlaceholder: "Opcional: describe tus preocupaciones de la piel...",

    // Analysis
    analysisResults: "Resultados del análisis",
    skinType: "Tipo de piel",
    skinConcerns: "Problemas de la piel",
    detailedAnalysis: "Análisis detallado",
    recommendations: "Recomendaciones de productos",
    noRecommendations: "No hay recomendaciones disponibles por ahora",

    // Weather sidebar extras
    todayDate: "Hoy",
    todayWeather: "Clima de hoy",
    temperature: "Temperatura",
    uvIndex: "Índice UV",
    skinAdvice: "Consejo de cuidado",
    skinConditionHistory: "Historial de la piel",
    noRecords: "Sin registros",
    addRecord: "Añadir registro",
    recordPlaceholder: "Escribe cómo se siente tu piel hoy...",
    cancelRecord: "Cancelar",
    locationError: "No se pudo obtener la ubicación",
    locationNotSupported:
      "La ubicación no es compatible en este entorno o navegador",
    concerns: "Preocupaciones",

    // Short weather labels
    weatherHot: "🌡️ Calor – hidrata y protege",
    weatherCold: "❄️ Frío – aporta más nutrición",
    weatherDry: "💧 Seco – añade hidratación extra",
    weatherHumid: "💦 Húmedo – usa texturas ligeras",
    weatherSunny: "☀️ Soleado – usa protector solar",
    weatherNormal: "Clima estable – rutina habitual",

    // Tags
    photoTag: "📷 Foto",
    aiAnalysisTag: "🤖 Análisis con IA",

    // Product Card
    viewDetails: "Ver detalles",
    ingredients: "Ingredientes",
    safetyScore: "Puntaje de seguridad",

    // Query Section
    queryTitle: "Búsqueda inteligente de productos",
    queryDescription:
      "Utiliza búsqueda semántica para encontrar productos que realmente se adapten a tu piel.",
    queryPlaceholder:
      "ej.: mejor hidratante para piel seca y sensible",
    queryButton: "🔍 Buscar productos",
    querying: "Buscando...",
    resultsFound: "Se encontraron",
    resultsProducts: "productos relevantes",
    similarity: "Similitud",
    noDescription: "Sin descripción",
    buyOnAmazon: "🛒 Comprar en Amazon",
    searchAmazon: "🔍 Buscar en Amazon",
    ewgRating: "📊 Calificación EWG",

    // Chat + analysis
    chatAnalysisTitle: "Asesor de cuidado + análisis de la piel",
    chatAnalysisDescription:
      "Chatea con la IA para recibir consejos de cuidado o sube fotos para un análisis más profundo.",
    chatStartMessage:
      "Empieza haciendo una pregunta sobre tu rutina o sube una foto de tu piel para que la IA la analice.",
    chatPlaceholderLong:
      "Por ejemplo: Últimamente tengo la piel muy seca, ¿qué hidratante debería usar? También puedes describir tu rutina y alergias.",
    uploadPhoto: "📷 Subir foto",
    analyzeSkin: "🔍 Analizar piel",
    sendMessage: "💬 Enviar mensaje",
    analyzing2: "Analizando...",
    thinking: "Pensando...",
    userUploaded: "Subido por el usuario",
    buyButton: "🛒 Comprar",

    // Hero / Landing
    heroDescription:
      "Impulsado por la base de datos EWG (más de 12,000 productos) y búsqueda RAG para recomendarte cuidado de la piel seguro y eficaz.",
    revolutionizeYourSkincare: "Revoluciona tu cuidado de la piel",
    heroTitle: [
      "Un cuidado de la piel que entiende tu vida,",
      "no solo tu tipo de piel.",
    ].join("\n"),
    heroSubtitle:
      "SkinMe AI combina tus preferencias, alergias, agenda diaria, historial de productos, conversaciones previas y datos en tiempo real de clima y alérgenos para diseñar una rutina que se adapta contigo cada día.",
    badge1: "✅ Búsqueda vectorial con ChromaDB",
    badge2: "✅ Embeddings de OpenAI",
    badge3: "✅ Preguntas y respuestas con RAG",
    badge4: "✅ Análisis de piel con Gemini",

    // System info
    systemStatus: "Estado del sistema",
    database: "Base de datos",
    databaseInfo: "ChromaDB (más de 12,000 registros de productos)",
    embeddingModel: "Modelo de embeddings",
    embeddingInfo: "OpenAI text-embedding-3-small (1536 dims)",
    backendAPI: "API de backend",

    // Errors
    errorAnalysis: "Error en el análisis",
    errorMessage: "Error",

    // Common
    error: "Ha ocurrido un error",
    retry: "Reintentar",
    close: "Cerrar",
    back: "Volver",

    // Profile
    profileAccountType: "Tipo de cuenta",
    profilePremiumMember: "Miembro premium",
    profileMemberSince: "Miembro desde",
    profileLogout: "Cerrar sesión",

    // Landing main
    viewProfile: "Ver perfil",
    logOut: "Cerrar sesión",
    landingTitle: "SkinMe AI",
    landingTagline: "Tu asistente inteligente de cuidado de la piel",
    landingSubtitle:
      "SkinMe AI conecta tus hábitos, entorno e historial de piel en un perfil vivo, para que cada recomendación esté basada en tu vida real y no en categorías genéricas.",
    asfeaturedIn: "CREADO CON DERMATOLOGÍA, DATOS Y DISEÑO",
    getStarted: "🚀 Empezar",
    startNow: "🚀 Comenzar ahora",

    howItWorks: "Cómo funciona SkinMe AI",
    howItWorksSubtitle:
      "Desde tu calendario hasta tu clima local, cada detalle se convierte en cuidado. Así transformamos tu día a día en un plan de cuidado adaptable.",
    step1Title: "Cuéntanos sobre tu piel",
    step1Desc:
      "Comparte tu tipo de piel, preocupaciones y alergias. Conecta tu calendario para que SkinMe entienda tu ritmo de trabajo, sueño, viajes y entrenamientos.",
    step2Title: "Deja que la IA lea tus patrones",
    step2Desc:
      "Combinamos tus rutinas, historial de productos, chats y datos locales de clima y alérgenos para ver cómo reacciona tu piel a lo largo del tiempo.",
    step3Title: "Sigue una rutina que evoluciona contigo",
    step3Desc:
      "Obtén rutinas de día y de noche que se actualizan con las estaciones, los viajes y los cambios de estilo de vida. Consulta planes anteriores, chats y registros de tu piel cuando quieras.",

    coreFeatures: "Funciones principales",
    feature1Title: "Perfil de piel 360°",
    feature1Desc:
      "Indica tu tipo de piel, sensibilidades, alergias y objetivos. Conecta tu calendario e historial de productos para que SkinMe entienda cómo tu estilo de vida, estrés y sueño afectan tu piel.",
    feature2Title: "Motor de rutina adaptable",
    feature2Desc:
      "La IA analiza tus chats anteriores, tu rutina actual, el clima local, el índice UV, la humedad y el índice de alérgenos para ajustar en tiempo real tus rutinas de mañana y noche.",
    feature3Title: "Análisis y registros a largo plazo",
    feature3Desc:
      "Sube fotos para seguir la textura, el enrojecimiento y los brotes a lo largo del tiempo. SkinMe guarda tu historial de piel, cambios de rutina y sugerencias de la IA en un solo lugar.",
    feature4Title: "Soporte de calificación EWG",
    feature4Desc:
      "Seguridad y transparencia de productos respaldadas por la base de datos de EWG.",

    dataSupport: "Soporte de datos potente",
    productsCount: "Productos de cuidado de la piel",
    linksCount: "Enlaces de compra",
    aiPowered: "Impulsado por IA",

    readyToFind: "¿Listo para encontrar el cuidado perfecto para ti?",
    readyToFindDesc:
      "Empieza ahora y deja que la IA te recomiende productos que encajen con tu estilo de vida, tu piel y tu entorno.",
    footerText:
      "© 2025 SkinMe AI. Desarrollado con la base de datos EWG y OpenAI.",
    apiDocs: "Documentación API",

    createProfile: "Crea tu perfil de piel",
    memberLogin: "Acceso de miembros",
    precisionSkincare:
      "Un cerebro de cuidado de la piel 360° diseñado solo para ti",

    navFeatures: "Funciones",
    navHowItWorks: "Cómo funciona",
    navScience: "Tecnología",
    navLogin: "Iniciar sesión",
    navSignUp: "Registrarse",

    ctaReadyTitle: "Volver al chat",
    ctaReady:
      "¿Listo para que tu rutina se adapte a tu vida y no al revés?",
    ctaJoinText:
      "Crea tu perfil de piel una sola vez. A partir de ahí, SkinMe AI aprende de tus hábitos, tu entorno y tu feedback, para que cada semana tu rutina sea un poco más inteligente y más tuya.",
    ctaFreeStart: "Empieza tu rutina adaptable",
    footerAllRights: "Todos los derechos reservados.",
    quickDemo: "Demostración rápida →",

    // Auth
    loginTitle: "Inicia sesión en SkinMe AI",
    loginSubtitle: "Continúa tu viaje de cuidado inteligente",
    loginEmail: "Correo electrónico",
    loginPassword: "Contraseña",
    loginButton: "Iniciar sesión",
    loginLoading: "Iniciando sesión...",
    loginError: "Por favor, completa correo y contraseña.",
    loginFailed: "Error al iniciar sesión, inténtalo de nuevo.",
    loginNoAccount: "¿No tienes una cuenta?",
    loginSignupLink: "Regístrate ahora",
    loginOr: "o",
    loginBackHome: "← Volver al inicio",

    signup: "Registrarse",
    signupTitle: "Regístrate en SkinMe AI",
    signupSubtitle: "Empieza tu viaje de cuidado inteligente",
    signupName: "Nombre",
    signupEmail: "Correo electrónico",
    signupPassword: "Contraseña",
    signupConfirmPassword: "Confirmar contraseña",
    signupButton: "Crear cuenta",
    signupLoading: "Creando cuenta...",
    signupErrorFields: "Por favor, completa todos los campos.",
    signupErrorPassword: "Las contraseñas no coinciden.",
    signupErrorPasswordLength:
      "La contraseña debe tener al menos 6 caracteres.",
    signupFailed: "Error al registrarse, inténtalo de nuevo.",
    signupHaveAccount: "¿Ya tienes una cuenta?",
    signupLoginLink: "Inicia sesión",
    signupOr: "o",
    signupBackHome: "← Volver al inicio",
    signupNamePlaceholder: "Tu nombre",
    signupEmailPlaceholder: "Tu correo electrónico",
    signupPasswordPlaceholder: "Elige una contraseña",
    signupConfirmPasswordPlaceholder: "Repite la contraseña",

    // Dashboard
    dashboardTitle: "Mi panel",
    dashboardWelcome: "Bienvenido de nuevo",
    dashboardContinue: "🔍 Continuar",
    dashboardLogout: "🚪 Cerrar sesión",
    dashboardSkinRecords: "Registros de la piel",
    dashboardAIAnalysis: "Análisis con IA",
    dashboardLastActivity: "Última actividad",
    dashboardNoActivity: "Aún no hay actividad",
    dashboardHistory: "Historial",
    dashboardNoRecords: "Sin registros todavía",
    dashboardStartUsing: "Empezar a utilizar",
    dashboardDetails: "Detalles",
    dashboardClickToView:
      "Haz clic en un registro a la izquierda para ver los detalles",
    dashboardContent: "Contenido",
    dashboardAnalysisResults: "Resultados del análisis con IA",
    dashboardSkinType: "Tipo de piel:",
    dashboardConcerns: "Preocupaciones:",
    dashboardSummary: "Resumen:",
    dashboardWeatherInfo: "Información del clima",
    dashboardTemp: "Temperatura",
    dashboardCondition: "Condición",
    dashboardHumidity: "Humedad",
    dashboardUVIndex: "Índice UV",
    dashboardWelcomeBack: "¡Bienvenido de nuevo!",
    dashboardJourneySummary:
      "Este es un resumen de tu recorrido de cuidado de la piel.",
    dashboardAIAssistantTitle: "Asistente SkinMe AI",
    dashboardAIAssistantSubtitle:
      "Tu guía personal hacia una piel más sana",
    dashboardAIWelcomeMessage:
      "¡Hola! Soy tu asistente de análisis de la piel. Pregúntame lo que quieras o sube una foto para empezar.",
    dashboardRecentActivity: "Actividad reciente",
    dashboardActivityRoutine: "Rutina de la mañana registrada",
    dashboardActivityPhoto: "Foto de la piel subida",
    dashboardActivityRecommendation: "Nueva recomendación",
    dashboardActivityProductSaved: "Producto recomendado guardado",
    dashboardActivityTimeToday: "Hoy",
    dashboardActivityTimeYesterday: "Ayer",
    dashboardChatPlaceholder: "Escribe un mensaje...",
    dashboardSavedProducts: "Productos recomendados",
    dashboardNoProducts: "Aún no has guardado productos",
    dashboardViewProduct: "Ver producto",

    // App chat page
    appNewChat: "+ Nuevo chat",
    appMenuHistory: "Ver historial",
    appTitle: "SkinMe AI",
    appSubtitle: "Asistente de cuidado de la piel con IA",
    appWelcomeMessage:
      "Sube una foto de tu piel o describe tus preocupaciones.",
    appAnalyzeSkin: "Analizar estado de la piel",
    appRecommendProducts: "Recomendar productos",
    appChatPlaceholder: "¿Qué inquietudes de la piel tienes?",
    appUploadImage: "Subir imagen",
    appPreview: "Vista previa",
    appDisclaimer:
      "SkinMe AI puede cometer errores. Verifica la información importante.",
    appSunProtection: "☀️ Recuerda usar protector solar.",
    appAIAdvisor: "Asesor de cuidado con IA",
    appChatDescription:
      "Chatea con la IA para recibir consejos o sube fotos para un análisis profesional.",
    appStartMessage:
      "Empieza conversando, haz una pregunta sobre cuidado de la piel o sube una foto para analizarla...",
    appUploadPhoto: "Subir foto",
    appHistoryModalTitle: "📋 Historial",
    appNoHistory: "Aún no hay historial",
    appClose: "Cerrar",
    appSkinType: "Tipo de piel",
    appConcerns: "Preocupaciones",
    appUserUploaded: "Subido por el usuario",

    // Sidebar
    sidebarNewConversation: "Nueva conversación",
    sidebarLanguage: "Cambiar idioma",
    sidebarProfile: "Perfil",
    sidebarLogout: "Cerrar sesión",

    // Google Calendar
    googleCalendarLabel: "Google Calendar",
    googleConnected: "✅ Conectado correctamente con Google Calendar",
    syncing: "Sincronizando...",
    connected: "Conectado",
    connect: "Conectar",
    disconnect: "Desconectar",
    disconnectSuccess:
      "ℹ️ Se ha desconectado correctamente de Google Calendar",
    disconnectFailed: "❌ Error al desconectar",
    signInCancelled: "❌ Inicio de sesión cancelado. Inténtalo de nuevo.",
    invalidOrigin:
      "❌ Error de configuración OAuth: añade http://localhost:3001 a los “orígenes JavaScript autorizados” en Google Cloud Console.",
    credentialsNotConfigured:
      "❌ API de Google Calendar no configurada. Revisa tu archivo .env.local.",
    signInFailedPrefix: "❌ Error al iniciar sesión: ",
    syncSuccessCount:
      "✅ Se han sincronizado correctamente {count} eventos con tu Google Calendar.",
    syncCount: "Sincronizar ({count})",
    syncFailed: "❌ Error en la sincronización masiva: {error}",

    actionCreate: "crear",
    actionUpdate: "actualizar",
    actionDelete: "eliminar",
    syncActionFailedTemplate:
      "❌ Error de sincronización: no se pudo {action} el evento",

    // Calendar UI labels
    eventTypeLabel: "Tipo de evento",
    titleLabel: "Título",
    eventTitlePlaceholder:
      "ej.: Rutina de mañana, Llegó nueva crema hidratante",
    descriptionOptional: "Descripción (opcional)",
    eventDescriptionPlaceholder: "Añade detalles...",
    existingEvents: "Eventos existentes:",
    addNewEvent: "Añadir nuevo evento:",
    skincareRoutineLabel: "💆 Rutina de cuidado",
    skinConditionLabel: "🌡️ Estado de la piel",
    productDeliveryLabel: "📦 Entrega de productos",
    deliveryStatusOrdered: "📝 Pedido realizado",
    deliveryStatusShipped: "🚚 Enviado",
    deliveryStatusDelivered: "✅ Entregado",
    deliveryStatusLabel: "Estado de la entrega",
    cancel: "Cancelar",
    save: "Guardar",
    update: "Actualizar",
    editEvent: "Editar evento",
    addEvent: "Añadir evento",
    eventTypesHeading: "Tipos de evento:",
    weekDaysShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],

    // Chat history page
    chatHistory: "Historial de chat",
    backToChat: "Volver al chat",
    signtoviewhistory:
      "Inicia sesión para ver tus conversaciones anteriores y seguir donde lo dejaste.",
    startChatting: "Empezar a chatear",
    last24Hours: "Últimas 24 horas",
    last7Days: "Últimos 7 días",
    last30Days: "Últimos 30 días",
    last90Days: "Últimos 90 días",
    loadingChatHistory: "Cargando historial de chat...",
    noChatHistory: "Aún no hay historial de chat",
    noChatHistoryDesc:
      "Cuando empieces a conversar, tu historial aparecerá aquí.",
    you: "Tú",
    skinmeAI: "SkinMe AI",
    imageTag: "Imagen",
    showingMessages: "Mostrando",
    messagesFromLast: "mensajes de los últimos",
    days: "días",

    // Ingredient Analysis
    ingredientAnalysis: "Análisis de ingredientes",

    // Daily Routine
    dailyRoutine: "Rutina Diaria",
    routineTrends: "Tendencias de Uso",
  },

  vi: {
    // Header
    appName: "SkinMe - Trợ lý chăm sóc da bằng AI",
    languageSwitcherTitle: "Đổi ngôn ngữ",
    languageSwitcherLabel: "Ngôn ngữ",
    languageNameZh: "中文",
    languageNameEn: "English",

    // Weather Calendar
    todayweather: "Ngày hôm nay",
    loading: "Đang tải...",
    currentWeather: "Thời tiết hiện tại",
    currentLocation: "Vị trí hiện tại",
    feelsLike: "Cảm giác như",
    humidity: "Độ ẩm",
    skincareAdvice: "Gợi ý chăm sóc da",
    loadingWeather: "Đang tải dữ liệu thời tiết...",
    skinConditionRecords: "Nhật ký tình trạng da",
    recordSkinConditionPlaceholder:
      "Ghi lại tình trạng da hôm nay... (ví dụ: da hơi khô, hơi căng...)",
    saveRecord: "Lưu lại",
    recentRecords: "Nhật ký gần đây",
    noRecordsYet: "Chưa có nhật ký nào",
    weather: "Thời tiết",
    loadingAdvice: "Đang tải gợi ý theo thời tiết...",

    weatherHotAdvice:
      "☀️ Thời tiết nóng – tăng cường dưỡng ẩm và chống nắng.",
    weatherColdAdvice:
      "❄️ Thời tiết lạnh – dùng kem dưỡng dày hơn để bảo vệ hàng rào da.",
    weatherDryAdvice:
      "💧 Không khí khô – thêm serum cấp ẩm vào routine.",
    weatherHumidAdvice:
      "💦 Độ ẩm cao – ưu tiên sản phẩm mỏng nhẹ, không bí da.",
    weatherUVAdvice:
      "🌞 Chỉ số UV cao – không được bỏ qua kem chống nắng.",
    weatherNormalAdvice:
      "Thời tiết ổn định – có thể duy trì routine chăm sóc da bình thường.",

    // Calendar
    calendarTitle: "✨ Lịch chăm sóc da",
    calendarSubtitle: "Theo dõi hành trình chăm sóc da của bạn",
    taptoopen: "Nhấn để mở",
    eventTypes: "Loại sự kiện",

    // Tabs
    queryTab: "🔍 Tìm kiếm sản phẩm",
    chatTab: "💬 Chat với AI",
    photoTab: "📷 Phân tích ảnh",
    historyTab: "📋 Lịch sử",

    // Chat Section
    chatTitle: "Trò chuyện với trợ lý chăm sóc da AI",
    chatPlaceholder: "Hãy mô tả vấn đề hoặc nhu cầu về da của bạn...",
    sendButton: "Gửi",
    uploading: "Đang tải lên...",
    analyzing: "Đang phân tích...",

    // Photo Analysis
    photoTitle: "Tải ảnh da mặt để AI phân tích",
    uploadButton: "Chọn ảnh",
    analyzeButton: "Bắt đầu phân tích",
    photoPlaceholder: "Hãy tải một bức ảnh rõ nét về vùng da cần phân tích",
    descriptionPlaceholder:
      "Không bắt buộc: mô tả thêm về vấn đề da mà bạn quan tâm...",

    // Analysis
    analysisResults: "Kết quả phân tích",
    skinType: "Loại da",
    skinConcerns: "Vấn đề trên da",
    detailedAnalysis: "Phân tích chi tiết",
    recommendations: "Sản phẩm gợi ý",
    noRecommendations: "Chưa có gợi ý sản phẩm phù hợp",

    // Weather sidebar extras
    todayDate: "Hôm nay",
    todayWeather: "Thời tiết hôm nay",
    temperature: "Nhiệt độ",
    uvIndex: "Chỉ số UV",
    skinAdvice: "Gợi ý chăm sóc",
    skinConditionHistory: "Lịch sử tình trạng da",
    noRecords: "Chưa có nhật ký",
    addRecord: "Thêm nhật ký",
    recordPlaceholder: "Ghi nhanh hôm nay da bạn như thế nào...",
    cancelRecord: "Hủy",
    locationError: "Không lấy được thông tin vị trí",
    locationNotSupported:
      "Môi trường hiện tại không hỗ trợ chức năng định vị",
    concerns: "Vấn đề quan tâm",

    // Short weather labels
    weatherHot: "🌡️ Nóng – cấp ẩm & chống nắng",
    weatherCold: "❄️ Lạnh – tăng cường dưỡng ẩm",
    weatherDry: "💧 Khô – thêm sản phẩm cấp nước",
    weatherHumid: "💦 Ẩm – dùng kết cấu mỏng nhẹ",
    weatherSunny: "☀️ Nắng – nhớ dùng kem chống nắng",
    weatherNormal: "Thời tiết ổn – routine bình thường",

    // Tags
    photoTag: "📷 Ảnh",
    aiAnalysisTag: "🤖 Phân tích AI",

    // Product Card
    viewDetails: "Xem chi tiết",
    ingredients: "Thành phần",
    safetyScore: "Điểm an toàn",

    // Query Section
    queryTitle: "Tìm kiếm sản phẩm thông minh",
    queryDescription:
      "Dùng tìm kiếm ngữ nghĩa để tìm các sản phẩm thực sự phù hợp với nhu cầu và làn da của bạn.",
    queryPlaceholder:
      "ví dụ: kem dưỡng ẩm cho da khô nhạy cảm",
    queryButton: "🔍 Tìm sản phẩm",
    querying: "Đang tìm...",
    resultsFound: "Đã tìm thấy",
    resultsProducts: "sản phẩm phù hợp",
    similarity: "Mức độ tương đồng",
    noDescription: "Không có mô tả",
    buyOnAmazon: "🛒 Mua trên Amazon",
    searchAmazon: "🔍 Tìm trên Amazon",
    ewgRating: "📊 Điểm EWG",

    // Chat + analysis
    chatAnalysisTitle: "Tư vấn chăm sóc + phân tích da bằng AI",
    chatAnalysisDescription:
      "Trò chuyện với AI để nhận gợi ý routine, hoặc tải ảnh để phân tích sâu hơn.",
    chatStartMessage:
      "Bạn có thể bắt đầu bằng một câu hỏi về routine, hoặc tải ảnh da để AI phân tích.",
    chatPlaceholderLong:
      "Ví dụ: Dạo này da mình rất khô, mình nên dùng loại kem dưỡng nào? Bạn cũng có thể kể về routine, thói quen ngủ, dị ứng, v.v.",
    uploadPhoto: "📷 Tải ảnh",
    analyzeSkin: "🔍 Phân tích da",
    sendMessage: "💬 Gửi tin nhắn",
    analyzing2: "Đang phân tích...",
    thinking: "Đang suy nghĩ...",
    userUploaded: "Người dùng tải lên",
    buyButton: "🛒 Mua sản phẩm",

    // Hero / Landing
    heroDescription:
      "Dựa trên cơ sở dữ liệu EWG (hơn 12,000 sản phẩm) kết hợp với RAG để gợi ý routine chăm sóc da an toàn và hiệu quả.",
    revolutionizeYourSkincare: "Thay đổi cách bạn chăm sóc da",
    heroTitle: [
      "Một routine chăm sóc da hiểu cuộc sống của bạn,",
      "không chỉ hiểu loại da của bạn.",
    ].join("\n"),
    heroSubtitle:
      "SkinMe AI kết hợp sở thích, dị ứng, lịch sinh hoạt, lịch sử sản phẩm bạn dùng, các cuộc trò chuyện trước đây và dữ liệu thời tiết, phấn hoa theo thời gian thực để xây dựng một routine luôn cập nhật theo nhịp sống của bạn.",
    badge1: "✅ Tìm kiếm vector với ChromaDB",
    badge2: "✅ Embeddings của OpenAI",
    badge3: "✅ Hỏi đáp với RAG",
    badge4: "✅ Phân tích da bằng Gemini",

    // System info
    systemStatus: "Trạng thái hệ thống",
    database: "Cơ sở dữ liệu",
    databaseInfo: "ChromaDB (hơn 12,000 bản ghi sản phẩm)",
    embeddingModel: "Mô hình embedding",
    embeddingInfo: "OpenAI text-embedding-3-small (1536 chiều)",
    backendAPI: "API backend",

    // Errors
    errorAnalysis: "Lỗi khi phân tích",
    errorMessage: "Lỗi",

    // Common
    error: "Đã xảy ra lỗi",
    retry: "Thử lại",
    close: "Đóng",
    back: "Quay lại",

    // Profile
    profileAccountType: "Loại tài khoản",
    profilePremiumMember: "Thành viên Premium",
    profileMemberSince: "Tham gia từ",
    profileLogout: "Đăng xuất",

    // Landing main
    viewProfile: "Xem hồ sơ",
    logOut: "Đăng xuất",
    landingTitle: "SkinMe AI",
    landingTagline: "Trợ lý chăm sóc da thông minh của bạn",
    landingSubtitle:
      "SkinMe AI kết nối thói quen, môi trường sống và lịch sử làn da của bạn thành một hồ sơ “sống” – mọi gợi ý đều dựa trên đời sống thực, không chỉ là phân loại da chung chung.",
    asfeaturedIn: "KẾT HỢP DA LIỄU · DỮ LIỆU · THIẾT KẾ",
    getStarted: "🚀 Bắt đầu",
    startNow: "🚀 Bắt đầu ngay",

    howItWorks: "SkinMe AI hoạt động như thế nào",
    howItWorksSubtitle:
      "Từ lịch làm việc đến thời tiết nơi bạn sống, mọi chi tiết đều trở thành dữ liệu để chăm sóc da. Đây là cách chúng tôi biến cuộc sống hằng ngày của bạn thành một kế hoạch chăm sóc da linh hoạt.",
    step1Title: "Giúp SkinMe hiểu làn da của bạn",
    step1Desc:
      "Khai báo loại da, vấn đề quan tâm và dị ứng. Kết nối lịch để SkinMe hiểu nhịp sinh hoạt, tập luyện và di chuyển của bạn.",
    step2Title: "Để AI đọc được các quy luật trên da",
    step2Desc:
      "Kết hợp thói quen, lịch sử sản phẩm, cuộc trò chuyện trước đây cùng dữ liệu thời tiết, phấn hoa để tìm ra yếu tố nào đang khiến da thay đổi.",
    step3Title: "Routine cùng thay đổi với cuộc sống",
    step3Desc:
      "SkinMe gợi ý routine sáng – tối và liên tục điều chỉnh theo mùa, chuyến đi, kỳ deadline bận rộn... Bạn luôn có thể xem lại các routine cũ, lịch sử chat và nhật ký da.",

    coreFeatures: "Tính năng chính",
    feature1Title: "Hồ sơ da cá nhân 360°",
    feature1Desc:
      "Lưu loại da, dị ứng, sở thích và mục tiêu chăm sóc. Khi kết nối lịch, SkinMe có thể hiểu tác động của giấc ngủ, stress và vận động lên làn da bạn.",
    feature2Title: "Động cơ routine thích ứng theo thời gian",
    feature2Desc:
      "AI phân tích lịch sử chat, routine hiện tại, thời tiết, chỉ số UV, độ ẩm và phấn hoa địa phương để điều chỉnh routine sáng – tối theo thời gian thực.",
    feature3Title: "Phân tích da & theo dõi dài hạn",
    feature3Desc:
      "Tải ảnh da để theo dõi kết cấu, mẩn đỏ, mụn và thay đổi khác theo thời gian. Tất cả gợi ý và thay đổi routine được lưu lại để bạn biết điều gì thực sự hiệu quả.",
    feature4Title: "Hỗ trợ thang điểm EWG",
    feature4Desc:
      "Độ an toàn của sản phẩm được đối chiếu với cơ sở dữ liệu uy tín EWG, giúp lựa chọn minh bạch hơn.",

    dataSupport: "Hệ dữ liệu mạnh mẽ",
    productsCount: "Sản phẩm chăm sóc da",
    linksCount: "Liên kết mua hàng",
    aiPowered: "Vận hành bởi AI",

    readyToFind:
      "Sẵn sàng tìm một routine thật sự phù hợp với bạn chưa?",
    readyToFindDesc:
      "Bắt đầu ngay và để AI gợi ý sản phẩm phù hợp với lối sống, môi trường và làn da của bạn.",
    footerText:
      "© 2025 SkinMe AI. Vận hành bởi cơ sở dữ liệu EWG và OpenAI.",
    apiDocs: "Tài liệu API",

    createProfile: "Tạo hồ sơ làn da",
    memberLogin: "Đăng nhập thành viên",
    precisionSkincare:
      "“Bộ não” chăm sóc da 360° được thiết kế riêng cho bạn",

    navFeatures: "Tính năng",
    navHowItWorks: "Cách hoạt động",
    navScience: "Công nghệ",
    navLogin: "Đăng nhập",
    navSignUp: "Đăng ký",

    ctaReadyTitle: "Quay lại màn hình chat",
    ctaReady:
      "Đã sẵn sàng để routine đi theo nhịp sống của bạn chưa?",
    ctaJoinText:
      "Chỉ cần tạo hồ sơ da một lần. Sau đó SkinMe AI sẽ dần học từ thói quen, môi trường và phản hồi của bạn – mỗi tuần routine sẽ “thông minh hơn” và “giống bạn hơn”.",
    ctaFreeStart: "Bắt đầu routine thích ứng",
    footerAllRights: "Đã đăng ký bản quyền.",
    quickDemo: "Xem demo nhanh →",

    // Auth
    loginTitle: "Đăng nhập SkinMe AI",
    loginSubtitle: "Tiếp tục hành trình chăm da thông minh",
    loginEmail: "Email",
    loginPassword: "Mật khẩu",
    loginButton: "Đăng nhập",
    loginLoading: "Đang đăng nhập...",
    loginError: "Vui lòng nhập email và mật khẩu.",
    loginFailed: "Đăng nhập thất bại, hãy thử lại.",
    loginNoAccount: "Chưa có tài khoản?",
    loginSignupLink: "Đăng ký ngay",
    loginOr: "hoặc",
    loginBackHome: "← Quay lại trang chủ",

    signup: "Đăng ký",
    signupTitle: "Tạo tài khoản SkinMe AI",
    signupSubtitle: "Bắt đầu hành trình chăm da cùng AI",
    signupName: "Họ tên",
    signupEmail: "Email",
    signupPassword: "Mật khẩu",
    signupConfirmPassword: "Xác nhận mật khẩu",
    signupButton: "Tạo tài khoản",
    signupLoading: "Đang tạo tài khoản...",
    signupErrorFields: "Vui lòng điền đầy đủ các trường.",
    signupErrorPassword: "Mật khẩu nhập lại không khớp.",
    signupErrorPasswordLength:
      "Mật khẩu cần ít nhất 6 ký tự.",
    signupFailed: "Đăng ký thất bại, hãy thử lại.",
    signupHaveAccount: "Đã có tài khoản?",
    signupLoginLink: "Đăng nhập",
    signupOr: "hoặc",
    signupBackHome: "← Quay lại trang chủ",
    signupNamePlaceholder: "Tên của bạn",
    signupEmailPlaceholder: "Địa chỉ email",
    signupPasswordPlaceholder: "Tạo mật khẩu",
    signupConfirmPasswordPlaceholder: "Nhập lại mật khẩu",

    // Dashboard
    dashboardTitle: "Bảng điều khiển",
    dashboardWelcome: "Chào mừng trở lại",
    dashboardContinue: "🔍 Tiếp tục",
    dashboardLogout: "🚪 Đăng xuất",
    dashboardSkinRecords: "Nhật ký da",
    dashboardAIAnalysis: "Phân tích bằng AI",
    dashboardLastActivity: "Hoạt động gần nhất",
    dashboardNoActivity: "Chưa có hoạt động nào",
    dashboardHistory: "Lịch sử",
    dashboardNoRecords: "Chưa có nhật ký nào",
    dashboardStartUsing: "Bắt đầu sử dụng",
    dashboardDetails: "Chi tiết",
    dashboardClickToView:
      "Chọn một mục ở bên trái để xem chi tiết",
    dashboardContent: "Nội dung",
    dashboardAnalysisResults: "Kết quả phân tích AI",
    dashboardSkinType: "Loại da:",
    dashboardConcerns: "Vấn đề:",
    dashboardSummary: "Tóm tắt:",
    dashboardWeatherInfo: "Thông tin thời tiết",
    dashboardTemp: "Nhiệt độ",
    dashboardCondition: "Tình trạng",
    dashboardHumidity: "Độ ẩm",
    dashboardUVIndex: "Chỉ số UV",
    dashboardWelcomeBack: "Chào mừng bạn quay lại!",
    dashboardJourneySummary:
      "Đây là bức tranh tổng quan về hành trình chăm sóc da của bạn.",
    dashboardAIAssistantTitle: "Trợ lý SkinMe AI",
    dashboardAIAssistantSubtitle:
      "Người bạn đồng hành cho một làn da khỏe hơn",
    dashboardAIWelcomeMessage:
      "Xin chào! Mình là trợ lý phân tích da của bạn. Hãy gửi câu hỏi hoặc tải ảnh để bắt đầu.",
    dashboardRecentActivity: "Hoạt động gần đây",
    dashboardActivityRoutine: "Đã ghi lại routine buổi sáng",
    dashboardActivityPhoto: "Đã tải ảnh da",
    dashboardActivityRecommendation: "Khuyến nghị mới",
    dashboardActivityProductSaved:
      "Đã lưu sản phẩm được khuyến nghị",
    dashboardActivityTimeToday: "Hôm nay",
    dashboardActivityTimeYesterday: "Hôm qua",
    dashboardChatPlaceholder: "Nhập tin nhắn...",
    dashboardSavedProducts: "Sản phẩm đã lưu",
    dashboardNoProducts: "Chưa có sản phẩm nào được lưu",
    dashboardViewProduct: "Xem sản phẩm",

    // App chat page
    appNewChat: "+ Cuộc trò chuyện mới",
    appMenuHistory: "Xem lịch sử",
    appTitle: "SkinMe AI",
    appSubtitle: "Trợ lý chăm sóc da bằng AI",
    appWelcomeMessage:
      "Hãy tải ảnh da hoặc mô tả vấn đề về da của bạn.",
    appAnalyzeSkin: "Phân tích tình trạng da",
    appRecommendProducts: "Gợi ý sản phẩm",
    appChatPlaceholder: "Bạn đang lo lắng điều gì về làn da...",
    appUploadImage: "Tải ảnh",
    appPreview: "Xem trước",
    appDisclaimer:
      "SkinMe AI có thể mắc lỗi. Hãy luôn kiểm tra lại các thông tin quan trọng.",
    appSunProtection: "☀️ Đừng quên kem chống nắng.",
    appAIAdvisor: "Trợ lý chăm sóc da AI",
    appChatDescription:
      "Trò chuyện để nhận tư vấn chăm sóc da hoặc tải ảnh để được phân tích chuyên sâu.",
    appStartMessage:
      "Bắt đầu bằng một câu hỏi về chăm sóc da, hoặc tải ảnh da để phân tích...",
    appUploadPhoto: "Tải ảnh",
    appHistoryModalTitle: "📋 Lịch sử",
    appNoHistory: "Chưa có lịch sử trò chuyện",
    appClose: "Đóng",
    appSkinType: "Loại da",
    appConcerns: "Vấn đề",
    appUserUploaded: "Người dùng tải lên",

    // Sidebar
    sidebarNewConversation: "Cuộc trò chuyện mới",
    sidebarLanguage: "Đổi ngôn ngữ",
    sidebarProfile: "Hồ sơ",
    sidebarLogout: "Đăng xuất",

    // Google Calendar
    googleCalendarLabel: "Google Calendar",
    googleConnected:
      "✅ Đã kết nối thành công với Google Calendar!",
    syncing: "Đang đồng bộ...",
    connected: "Đã kết nối",
    connect: "Kết nối",
    disconnect: "Ngắt kết nối",
    disconnectSuccess:
      "ℹ️ Đã ngắt kết nối với Google Calendar.",
    disconnectFailed: "❌ Ngắt kết nối thất bại.",
    signInCancelled:
      "❌ Đăng nhập đã bị hủy. Hãy thử lại.",
    invalidOrigin:
      "❌ Lỗi cấu hình OAuth: hãy thêm http://localhost:3001 vào “Authorized JavaScript origins” trong Google Cloud Console.",
    credentialsNotConfigured:
      "❌ API Google Calendar chưa được cấu hình. Hãy kiểm tra file .env.local.",
    signInFailedPrefix: "❌ Đăng nhập thất bại: ",
    syncSuccessCount:
      "✅ Đã đồng bộ thành công {count} sự kiện lên Google Calendar!",
    syncCount: "Đồng bộ ({count})",
    syncFailed: "❌ Đồng bộ hàng loạt thất bại: {error}",

    actionCreate: "tạo",
    actionUpdate: "cập nhật",
    actionDelete: "xóa",
    syncActionFailedTemplate:
      "❌ Đồng bộ thất bại: không thể {action} sự kiện",

    // Calendar UI labels
    eventTypeLabel: "Loại sự kiện",
    titleLabel: "Tiêu đề",
    eventTitlePlaceholder:
      "ví dụ: Routine buổi sáng, Kem mới vừa giao",
    descriptionOptional: "Mô tả (không bắt buộc)",
    eventDescriptionPlaceholder: "Thêm chi tiết...",
    existingEvents: "Sự kiện hiện có:",
    addNewEvent: "Thêm sự kiện mới:",
    skincareRoutineLabel: "💆 Routine chăm sóc da",
    skinConditionLabel: "🌡️ Tình trạng da",
    productDeliveryLabel: "📦 Giao sản phẩm",
    deliveryStatusOrdered: "📝 Đã đặt hàng",
    deliveryStatusShipped: "🚚 Đã gửi",
    deliveryStatusDelivered: "✅ Đã giao",
    deliveryStatusLabel: "Trạng thái giao hàng",
    cancel: "Hủy",
    save: "Lưu",
    update: "Cập nhật",
    editEvent: "Chỉnh sửa sự kiện",
    addEvent: "Thêm sự kiện",
    eventTypesHeading: "Các loại sự kiện:",
    weekDaysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],

    // Chat history page
    chatHistory: "Lịch sử chat",
    backToChat: "Quay lại chat",
    signtoviewhistory:
      "Hãy đăng nhập để xem lại các cuộc trò chuyện trước đó và tiếp tục từ nơi bạn đã dừng.",
    startChatting: "Bắt đầu trò chuyện",
    last24Hours: "24 giờ qua",
    last7Days: "7 ngày qua",
    last30Days: "30 ngày qua",
    last90Days: "90 ngày qua",
    loadingChatHistory: "Đang tải lịch sử chat...",
    noChatHistory: "Chưa có lịch sử chat",
    noChatHistoryDesc:
      "Khi bạn bắt đầu trò chuyện, lịch sử sẽ xuất hiện tại đây.",
    you: "Bạn",
    skinmeAI: "SkinMe AI",
    imageTag: "Hình ảnh",
    showingMessages: "Đang hiển thị",
    messagesFromLast: "tin nhắn trong",
    days: "ngày gần đây",

    // Ingredient Analysis
    ingredientAnalysis: "Phân tích thành phần",

    // Daily Routine
    dailyRoutine: "Thói quen hàng ngày",
    routineTrends: "Xu hướng sử dụng",
  },
};

export const useTranslations = (language: Language): Translations => {
  return translations[language] ?? translations.en;
};
