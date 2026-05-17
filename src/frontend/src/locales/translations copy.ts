export type Language = 'zh' | 'en';

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

  // Weather advice
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

  // Hero Section
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
  syncSuccessCount: string; // use {count}
  syncCount: string; // label for sync button, use {count}
  syncFailed: string; // use {error}

  actionCreate: string;
  actionUpdate: string;
  actionDelete: string;
  syncActionFailedTemplate: string; // use {action}

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
  // Weekdays short names
  weekDaysShort: string[];

  //chat history
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
}

export const translations: Record<Language, Partial<Translations>> = {
  zh: {
    // Header
    appName: 'SkinMe - AI 护肤助手',
    languageSwitcherTitle: '切换语言',
    languageSwitcherLabel: '语言',
    languageNameZh: '中文',
    languageNameEn: 'English',

    // Weather Calendar
    todayweather: '今日日期',
    loading: '加载中...',
    currentWeather: '当前天气',
    currentLocation: '当前位置',
    feelsLike: '体感',
    humidity: '湿度',
    skincareAdvice: '护肤建议',
    loadingWeather: '加载天气数据...',
    skinConditionRecords: '皮肤状况记录',
    recordSkinConditionPlaceholder: '记录今天的皮肤状况... (例如：今天皮肤有点干燥)',
    saveRecord: '保存记录',
    recentRecords: '最近记录',
    noRecordsYet: '还没有记录',
    weather: '天气',

    // Main Page - Tabs
    queryTab: '🔍 产品检索',
    chatTab: '💬 AI对话',
    photoTab: '📷 拍照分析',
    historyTab: '📋 历史记录',

    // Chat Section
    chatTitle: '与 AI 护肤助手对话',
    chatPlaceholder: '描述你的皮肤问题或需求...',
    sendButton: '发送',
    uploading: '上传中...',
    analyzing: '分析中...',

    // Photo Analysis Section
    photoTitle: '上传皮肤照片进行 AI 分析',
    uploadButton: '选择照片',
    analyzeButton: '开始分析',
    photoPlaceholder: '请先上传一张清晰的皮肤照片',
    descriptionPlaceholder: '可选：描述你的皮肤问题或关注点...',

    // Analysis Results
    analysisResults: '分析结果',
    skinType: '肤质类型',
    skinConcerns: '皮肤问题',
    detailedAnalysis: '详细分析',
    recommendations: '产品推荐',
    noRecommendations: '暂无推荐产品',

    // Weather advice
    loadingAdvice: '加载天气建议...',
    weatherHot: '🌡️ 高温天气，注意防晒和补水',
    weatherCold: '❄️ 气温较低，加强保湿防护',
    weatherDry: '💧 空气干燥，使用保湿精华',
    weatherHumid: '💦 湿度较高，使用清爽型产品',
    weatherSunny: '☀️ 晴朗天气，务必涂抹防晒',
    weatherNormal: '天气适宜，正常护肤即可',
    weatherHotAdvice: '☀️ 高温天气，加强保湿和防晒',
    weatherColdAdvice: '❄️ 寒冷天气，增强保湿防护',
    weatherDryAdvice: '💧 低湿度环境，使用保湿精华',
    weatherHumidAdvice: '💦 高湿度环境，使用清爽型产品',
    weatherUVAdvice: '🌞 紫外线较强，务必涂抹防晒霜',
    weatherNormalAdvice: '保持基础护肤routine',

    // Calendar
    calendarTitle: '✨ 护肤日历',
    calendarSubtitle: '记录您的护肤旅程',

    // Tags
    photoTag: '📷 照片',
    aiAnalysisTag: '🤖 AI分析',

    // Product Card
    viewDetails: '查看详情',
    ingredients: '成分',
    safetyScore: '安全评分',

    // Query Section
    queryTitle: '智能产品检索',
    queryDescription: '使用语义搜索找到最相关的护肤品',
    queryPlaceholder: '例如: best moisturizer for dry sensitive skin',
    queryButton: '🔍 检索产品',
    querying: '检索中...',
    resultsFound: '找到',
    resultsProducts: '个相关产品',
    similarity: '相似度',
    noDescription: '无描述',
    buyOnAmazon: '🛒 Amazon直购',
    searchAmazon: '🔍 Amazon搜索',
    ewgRating: '📊 EWG评分',

    // Chat with Analysis
    chatAnalysisTitle: 'AI护肤顾问 + 皮肤分析',
    chatAnalysisDescription: '与AI对话获取护肤建议，或上传皮肤照片进行专业分析',
    chatStartMessage: '开始对话，询问关于护肤品的问题，或上传皮肤照片进行分析...',
    chatPlaceholderLong: '例如: 我的皮肤很干燥，有什么好的保湿产品推荐？或描述您的皮肤状况...',
    uploadPhoto: '📷 上传照片',
    analyzeSkin: '🔍 分析皮肤',
    sendMessage: '💬 发送消息',
    analyzing2: '分析中...',
    thinking: '思考中...',
    userUploaded: '用户上传',
    buyButton: '🛒 购买',

    // Hero Section
    heroDescription: '基于EWG数据库 (12,000+个产品)，使用RAG技术为您推荐安全有效的护肤品',
    revolutionizeYourSkincare: '革新您的护肤',
    badge1: '✅ ChromaDB向量检索',
    badge2: '✅ OpenAI Embeddings',
    badge3: '✅ RAG问答',
    badge4: '✅ Gemini皮肤分析',
    heroTitle: '护肤适应你的生活，而不是你去适应护肤。',
    heroSubtitle: 'SkinMe AI 综合你的肤质偏好、过敏信息、日程安排、产品使用记录、历史聊天内容以及当地天气与过敏原数据，为你制定随生活变化而更新的护肤方案。',

    // System Info
    systemStatus: '系统状态',
    database: '数据库',
    databaseInfo: 'ChromaDB (12,000+条产品数据)',
    embeddingModel: 'Embedding模型',
    embeddingInfo: 'OpenAI text-embedding-3-small (1536维)',
    backendAPI: '后端API',

    // Error Messages
    errorAnalysis: '分析错误',
    errorMessage: '错误',

    // Common
    error: '出错了',
    retry: '重试',
    close: '关闭',
    back: '返回',

    // Profile Page
    profileAccountType: '账户类型',
    profilePremiumMember: '高级会员',
    profileMemberSince: '加入时间',
    profileLogout: '退出登录',

    // Landing Page
    viewProfile: '查看个人资料',
    logOut: '退出登录',
    landingTitle: 'SkinMe AI',
    landingTagline: '您的智能护肤助手',
    landingSubtitle: 'SkinMe 将你的习惯、环境与肤况历史整合为一个动态档案 —— 每一个推荐都基于你真实的生活，而不是抽象的肤质分类。',
    asfeaturedIn: '融合皮肤科学 · 数据智能 · 感性设计',
    getStarted: '🚀 开始使用',
    startNow: '🚀 立即开始',
    howItWorks: '如何使用',
    howItWorksSubtitle: '你的作息就是皮肤的一部分。我们把每个细节 —— 睡眠、运动、旅行、天气 —— 都转化为对皮肤有益的智能判断。',
    step1Title: '描述皮肤 · 连接生活',
    step1Desc: '上传肤况和偏好，连接日程与日常记录，让 SkinMe 理解你的生活节奏。',
    step2Title: 'AI 读取你的皮肤规律',
    step2Desc: '分析习惯、环境与皮肤表现之间的关系，理解哪些因素会引发变化。',
    step3Title: '持续进化的护肤方案',
    step3Desc: '根据天气、活动甚至压力变化实时调整护肤建议，并支持完整历史回溯。',
    coreFeatures: '核心功能',
    feature1Title: '360° 个人肌肤档案',
    feature1Desc: '记录肤质、过敏、偏好与护肤目标，连接日程后，SkinMe 可理解睡眠、压力、运动等生活因素对皮肤的长期影响。',
    feature2Title: '实时自适应护肤引擎',
    feature2Desc: '结合产品使用记录、历史对话洞察、天气、紫外线和湿度变化，实时调节护肤步骤，提醒何时加减产品与成分。',
    feature3Title: '皮肤分析与长期追踪',
    feature3Desc: '上传皮肤照片，追踪细纹、泛红、痘痘等变化。所有护肤调整和结果都被储存，帮助你找到真正有效的方法。',
    feature4Title: 'EWG 评分',
    feature4Desc: '基于权威 EWG 数据库，产品安全透明',
    dataSupport: '强大的数据支持',
    productsCount: '护肤产品',
    linksCount: '购买链接',
    aiPowered: '智能驱动',
    readyToFind: '准备好找到适合您的护肤品了吗？',
    readyToFindDesc: '立即开始，让 AI 为您推荐最适合的产品',
    footerText: '© 2025 SkinMe AI. Powered by EWG Database & OpenAI.',
    apiDocs: 'API 文档',
    createProfile: '创建您的档案',
    memberLogin: '会员登录',
    precisionSkincare: '精准护肤，为您量身定制！',
    navFeatures: '特色功能',
    navHowItWorks: '工作原理',
    navScience: '技术',
    navLogin: '登录',
    navSignUp: '注册',
    ctaReady: '准备好开始了吗？',
    ctaReadyTitle: '返回SkinMe',
    ctaJoinText: '只需一次建档。之后，SkinMe 会随着你的反馈与习惯持续学习成长。',
    ctaFreeStart: '免费开始',
    footerAllRights: '保留所有权利',

    // Auth Pages
    loginTitle: '登录 SkinMe AI',
    loginSubtitle: '继续您的智能护肤之旅',
    loginEmail: '邮箱地址',
    loginPassword: '密码',
    loginButton: '登录',
    loginLoading: '登录中...',
    loginError: '请填写邮箱和密码',
    loginFailed: '登录失败，请重试',
    loginNoAccount: '还没有账号？',
    loginSignupLink: '立即注册',
    loginOr: '或者',
    loginBackHome: '← 返回首页',
    signup: '注册',
    signupTitle: '注册 SkinMe AI',
    signupSubtitle: '开始您的智能护肤之旅',
    signupName: '姓名',
    signupEmail: '邮箱地址',
    signupPassword: '密码',
    signupConfirmPassword: '确认密码',
    signupButton: '注册',
    signupLoading: '注册中...',
    signupErrorFields: '请填写所有字段',
    signupErrorPassword: '两次输入的密码不一致',
    signupErrorPasswordLength: '密码至少需要 6 个字符',
    signupFailed: '注册失败，请重试',
    signupHaveAccount: '已有账号？',
    signupLoginLink: '立即登录',
    signupOr: '或者',
    signupBackHome: '← 返回首页',
    signupNamePlaceholder: '您的姓名',
    signupEmailPlaceholder: '您的邮箱地址',
    signupPasswordPlaceholder: '设置一个密码',
    signupConfirmPasswordPlaceholder: '再次输入密码',

    // Dashboard
    dashboardTitle: '我的 Dashboard',
    dashboardWelcome: '欢迎回来',
    dashboardContinue: '🔍 继续使用',
    dashboardLogout: '🚪 登出',
    dashboardSkinRecords: '皮肤记录',
    dashboardAIAnalysis: 'AI 分析',
    dashboardLastActivity: '最后活动',
    dashboardNoActivity: '暂无记录',
    dashboardHistory: '历史记录',
    dashboardNoRecords: '还没有记录',
    dashboardStartUsing: '开始使用',
    dashboardDetails: '详细信息',
    dashboardClickToView: '点击左侧记录查看详情',
    dashboardContent: '内容',
    dashboardAnalysisResults: 'AI 分析结果',
    dashboardSkinType: '肤质：',
    dashboardConcerns: '关注点：',
    dashboardSummary: '摘要：',
    dashboardWeatherInfo: '天气信息',
    dashboardTemp: '温度',
    dashboardCondition: '状况',
    dashboardHumidity: '湿度',
    dashboardUVIndex: '紫外线指数',
    dashboardWelcomeBack: '欢迎回来！',
    dashboardJourneySummary: '这是您护肤旅程的概要。',
    dashboardAIAssistantTitle: 'SkinMe AI 助手',
    dashboardAIAssistantSubtitle: '您的个性化肌肤管理顾问',
    dashboardAIWelcomeMessage: '您好！我是您的护肤分析助手。随时向我提问或上传照片开始分析。',
    dashboardRecentActivity: '最近活动',
    dashboardActivityRoutine: '记录早间护肤',
    dashboardActivityPhoto: '上传皮肤照片',
    dashboardActivityRecommendation: '新推荐',
    dashboardActivityProductSaved: '保存推荐产品',
    dashboardActivityTimeToday: '今天',
    dashboardActivityTimeYesterday: '昨天',
    dashboardChatPlaceholder: '输入消息',
    dashboardSavedProducts: '推荐产品',
    dashboardNoProducts: '暂无保存的产品',
    dashboardViewProduct: '查看详情',
    quickDemo: '快速演示',

    // App Page - Chat Interface
    appNewChat: '+ 新对话',
    appMenuHistory: '查看历史记录',
    appTitle: 'SkinMe AI',
    appSubtitle: 'SkinMe AI 护肤助手',
    appWelcomeMessage: '上传皮肤照片或描述您的皮肤问题',
    appAnalyzeSkin: '分析皮肤状况',
    appRecommendProducts: '推荐护肤产品',
    appChatPlaceholder: '有什么皮肤问题想咨询...',
    appUploadImage: '上传图片',
    appPreview: '预览',
    appDisclaimer: 'SkinMe AI 可能会出错。请检查重要信息。',
    appSunProtection: '☀️ 注意防晒',
    appAIAdvisor: 'AI 护肤顾问',
    appChatDescription: '与 AI 对话获取护肤建议，或上传皮肤照片进行专业分析',
    appStartMessage: '开始对话，询问关于护肤的问题，或上传皮肤照片进行分析...',
    appUploadPhoto: '上传图片',
    appHistoryModalTitle: '📋 历史记录',
    appNoHistory: '还没有历史记录',
    appClose: '关闭',
    appSkinType: '肤质',
    appConcerns: '问题',
    appUserUploaded: '用户上传',

    // Sidebar Navigation
    sidebarNewConversation: '新对话',
    sidebarLanguage: '语言',
    sidebarProfile: '个人资料',
    sidebarLogout: '退出登录',
    // Enhanced Calendar / Google Calendar
    googleCalendarLabel: 'Google Calendar',
    googleConnected: '✅ 成功连接到 Google Calendar！',
    syncing: '同步中...',
    connected: '已连接',
    connect: '连接',
    disconnect: '断开',
    disconnectSuccess: 'ℹ️ 已断开与 Google Calendar 的连接',
    disconnectFailed: '❌ 断开连接失败',
    signInCancelled: '❌ 登录已取消，请重试',
    invalidOrigin: '❌ OAuth 配置错误：请在 Google Cloud Console 中添加 http://localhost:3001 到 "已获授权的 JavaScript 来源"',
    credentialsNotConfigured: '❌ Google Calendar API 未配置，请检查 .env.local 文件',
    signInFailedPrefix: '❌ 登录失败：',
    syncSuccessCount: '✅ 成功同步 {count} 个事件到 Google Calendar！',
    syncCount: '同步 ({count})',
    syncFailed: '❌ 批量同步失败：{error}',

    actionCreate: '创建',
    actionUpdate: '更新',
    actionDelete: '删除',
    syncActionFailedTemplate: '❌ 同步失败：无法{action}事件',

    // Calendar UI labels
    eventTypeLabel: '事件类型',
    titleLabel: '标题',
    eventTitlePlaceholder: '例如：早间护肤、新面霜到货',
    descriptionOptional: '说明（可选）',
    eventDescriptionPlaceholder: '添加详细信息...',
    existingEvents: '已有事件：',
    addNewEvent: '添加新事件：',
    skincareRoutineLabel: '💆 护肤例行',
    skinConditionLabel: '🌡️ 皮肤状况',
    productDeliveryLabel: '📦 产品配送',
    deliveryStatusOrdered: '📝 已下单',
    deliveryStatusShipped: '🚚 已发货',
    deliveryStatusDelivered: '✅ 已送达',
    deliveryStatusLabel: '配送状态',
    cancel: '取消',
    save: '保存',
    update: '更新',
    editEvent: '编辑事件',
    addEvent: '添加事件',
    eventTypesHeading: '事件类型：',
    weekDaysShort: ['日', '一', '二', '三', '四', '五', '六'],

    //chat history
    chatHistory: '聊天记录',
    backToChat: '返回聊天',
    signtoviewhistory: '登录以查看您的聊天历史记录',
    startChatting: '开始聊天',
    last24Hours: '最近 24 小时',
    last7Days: '最近 7 天',
    last30Days: '最近 30 天',
    last90Days: '最近 90 天',
    loadingChatHistory: '加载聊天记录中...',
    noChatHistory: '暂无聊天记录',
    noChatHistoryDesc: '开始对话以查看您的聊天历史记录',
    you: '你',
    skinmeAI: 'SkinMe AI',
    imageTag: '图片',
    showingMessages: '显示',
    messagesFromLast: '条消息，来自最近',
    days: '天',
  },

  en: {
    // Header
    appName: 'SkinMe - AI Skincare Assistant',
    languageSwitcherTitle: 'Switch Language',
    languageSwitcherLabel: 'Language',
    languageNameZh: '中文',
    languageNameEn: 'English',

    // Weather Calendar
    todayweather: 'Today\'s Date',
    currentWeather: 'Current Weather',
    currentLocation: 'Current Location',
    feelsLike: 'Feels like',
    humidity: 'Humidity',
    skincareAdvice: 'Skincare Advice',
    loadingWeather: 'Loading weather data...',
    skinConditionRecords: 'Skin Condition Records',
    recordSkinConditionPlaceholder: 'Record today\'s skin condition... (e.g., My skin is a bit dry today)',
    saveRecord: 'Save Record',
    recentRecords: 'Recent Records',
    noRecordsYet: 'No records yet',
    weather: 'Weather',

    // Main Page - Tabs
    queryTab: '🔍 Product Search',
    chatTab: '💬 AI Chat',
    photoTab: '📷 Photo Analysis',
    historyTab: '📋 History',

    // Chat Section
    chatTitle: 'Chat with AI Skincare Assistant',
    chatPlaceholder: 'Describe your skin concerns or needs...',
    sendButton: 'Send',
    uploading: 'Uploading...',
    analyzing: 'Analyzing...',

    // Photo Analysis Section
    photoTitle: 'Upload Skin Photo for AI Analysis',
    uploadButton: 'Choose Photo',
    analyzeButton: 'Start Analysis',
    photoPlaceholder: 'Please upload a clear photo of your skin first',
    descriptionPlaceholder: 'Optional: Describe your skin concerns...',

    // Analysis Results
    analysisResults: 'Analysis Results',
    skinType: 'Skin Type',
    skinConcerns: 'Skin Concerns',
    detailedAnalysis: 'Detailed Analysis',
    recommendations: 'Product Recommendations',
    noRecommendations: 'No recommendations available',

    // Weather Calendar Sidebar (merged into main Weather Calendar keys)

    // Weather advice
    loadingAdvice: 'Loading weather advice...',
    weatherHot: '🌡️ Hot weather, remember sunscreen and hydration',
    weatherCold: '❄️ Cold weather, boost moisturizing protection',
    weatherDry: '💧 Dry air, use moisturizing serum',
    weatherHumid: '💦 High humidity, use lightweight products',
    weatherSunny: '☀️ Sunny weather, apply sunscreen',
    weatherNormal: 'Weather is suitable, normal skincare routine',
    weatherHotAdvice: '☀️ Hot weather, boost moisturizing and sun protection',
    weatherColdAdvice: '❄️ Cold weather, enhance moisturizing protection',
    weatherDryAdvice: '💧 Low humidity, use hydrating serum',
    weatherHumidAdvice: '💦 High humidity, use lightweight products',
    weatherUVAdvice: '🌞 Strong UV, apply sunscreen',
    weatherNormalAdvice: 'Maintain your basic skincare routine',

    // Calendar
    calendarTitle: '✨ Skin Calendar',
    calendarSubtitle: 'Track your beauty journey',

    // Tags
    photoTag: '📷 Photo',
    aiAnalysisTag: '🤖 AI Analysis',

    // Product Card
    viewDetails: 'View Details',
    ingredients: 'Ingredients',
    safetyScore: 'Safety Score',

    // Query Section
    queryTitle: 'Smart Product Search',
    queryDescription: 'Use semantic search to find the most relevant skincare products',
    queryPlaceholder: 'e.g., best moisturizer for dry sensitive skin',
    queryButton: '🔍 Search Products',
    querying: 'Searching...',
    resultsFound: 'Found',
    resultsProducts: 'relevant products',
    similarity: 'Similarity',
    noDescription: 'No description',
    buyOnAmazon: '🛒 Buy on Amazon',
    searchAmazon: '🔍 Search Amazon',
    ewgRating: '📊 EWG Rating',

    // Chat with Analysis
    chatAnalysisTitle: 'AI Skincare Advisor + Skin Analysis',
    chatAnalysisDescription: 'Chat with AI for skincare advice, or upload skin photos for professional analysis',
    chatStartMessage: 'Start chatting, ask about skincare products, or upload a skin photo for analysis...',
    chatPlaceholderLong: 'e.g., My skin is very dry, what moisturizer do you recommend? Or describe your skin condition...',
    uploadPhoto: '📷 Upload Photo',
    analyzeSkin: '🔍 Analyze Skin',
    sendMessage: '💬 Send Message',
    analyzing2: 'Analyzing...',
    thinking: 'Thinking...',
    userUploaded: 'User uploaded',
    buyButton: '🛒 Buy',

    // Hero Section
    heroDescription: 'Based on EWG database (12,000+ products), using RAG technology to recommend safe and effective skincare products',
    revolutionizeYourSkincare: 'Revolutionize Your Skincare',
    badge1: '✅ ChromaDB Vector Search',
    badge2: '✅ OpenAI Embeddings',
    badge3: '✅ RAG Q&A',
    badge4: '✅ Gemini Skin Analysis',
    heroTitle: 'Skincare that learns your life, not just your skin.',
    heroSubtitle: 'SkinMe AI combines your preferences, allergies, daily schedule, product history, chat memories, and real-time weather and allergy data to design a routine that adapts with you, every day.',

    // System Info
    systemStatus: 'System Status',
    database: 'Database',
    databaseInfo: 'ChromaDB (12,000+ product records)',
    embeddingModel: 'Embedding Model',
    embeddingInfo: 'OpenAI text-embedding-3-small (1536 dims)',
    backendAPI: 'Backend API',

    // Error Messages
    errorAnalysis: 'Analysis error',
    errorMessage: 'Error',

    // Common
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    close: 'Close',
    back: 'Back',

    // Profile Page
    profileAccountType: 'Account Type',
    profilePremiumMember: 'Premium Member',
    profileMemberSince: 'Member Since',
    profileLogout: 'Logout',

    // Landing Page
    asfeaturedIn: 'BUILT WITH DERMATOLOGY, DATA AND DESIGN',
    viewProfile: 'View Profile',
    logOut: 'Log Out',
    landingTitle: 'SkinMe AI',
    landingTagline: 'Your Intelligent Skincare Assistant',
    landingSubtitle: 'SkinMe AI connects your habits, environment, and skin history into one living profile—so every recommendation is grounded in your real life, not in generic skin types.',
    getStarted: '🚀 Get Started',
    startNow: '🚀 Start Now',
    howItWorks: 'How SkinMe AI works',
    howItWorksSubtitle: 'From your calendar to your climate, every detail becomes care. Here is how we turn your daily life into an adaptive skincare plan.s',
    step1Title: 'Describe your skin and connect your world',
    step1Desc: 'Share your skin concerns, allergies and product preferences. Connect your calendar and let SkinMe read your daily rhythm—workouts, travel, late nights—and add a quick skin photo to create your baseline.',
    step2Title: 'AI analyses patterns in your life and skin',
    step2Desc:
      'Our engine cross-reads your routines, past conversations, product purchases, and local weather and allergy data. It learns how your skin reacts to seasons, stress and different ingredients.',
    step3Title: 'Get a live routine that evolves with you',
    step3Desc:
      'Receive a tailored day and night routine, ingredient-safe product suggestions and gentle alerts when conditions change. Chat with SkinMe anytime and revisit your full history of plans, chats and skin records.',
    coreFeatures: 'Core Features',
    feature1Title: '360° personal skin profile',
    feature1Desc: 'Tell us your skin type, sensitivities, allergies and goals, then connect your calendar and product history. SkinMe builds a living profile that understands how your lifestyle, stress and sleep affect your skin.',
    feature2Title: 'Adaptive routine engine',
    feature2Desc: 'Our AI analyses your past chats, current routine, local weather, UV, humidity and allergy index to adjust your morning and night routines in real time—when to use what, and when to give your skin a break.',
    feature3Title: 'Skin analysis & long-term records',
    feature3Desc: 'Upload photos to track texture, redness and breakouts over time. SkinMe stores your skin history, routine changes and AI suggestions in one place, so you can see what truly works for you.',
    feature4Title: 'EWG Rating',
    feature4Desc: 'Based on authoritative EWG database for product safety transparency',
    dataSupport: 'Powerful Data Support',
    productsCount: 'Skincare Products',
    linksCount: 'Purchase Links',
    aiPowered: 'AI Powered',
    readyToFind: 'Ready to find the right skincare for you?',
    readyToFindDesc: 'Start now and let AI recommend the best products for you',
    footerText: '© 2025 SkinMe AI. Powered by EWG Database & OpenAI.',
    apiDocs: 'API Docs',
    precisionSkincare: 'A 360° skincare brain built just for you',
    navFeatures: 'Features',
    navHowItWorks: 'How It Works',
    navScience: 'Science',
    navLogin: 'Login',
    navSignUp: 'Sign Up',
    ctaReady: 'Ready to let your routine move with your life?',
    ctaReadyTitle: 'Go back to Chat',
    ctaJoinText: 'Create a skin profile once. From there, SkinMe AI keeps learning from your habits, environment and feedback—so every week your routine becomes a little smarter, and a little more you.',
    ctaFreeStart: 'Start your adaptive routine',
    footerAllRights: 'All rights reserved',
    quickDemo: 'Quick Demo →',
    createProfile: 'Create Your Profile',
    memberLogin: 'Member Login',

    // Auth Pages
    loginTitle: 'Login to SkinMe AI',
    loginSubtitle: 'Continue your intelligent skincare journey',
    loginEmail: 'Email Address',
    loginPassword: 'Password',
    loginButton: 'Login',
    loginLoading: 'Logging in...',
    loginError: 'Please fill in email and password',
    loginFailed: 'Login failed, please try again',
    loginNoAccount: "Don't have an account?",
    loginSignupLink: 'Sign up now',
    loginOr: 'or',
    loginBackHome: '← Back to Home',
    signup: 'Sign Up',
    signupTitle: 'Sign Up for SkinMe AI',
    signupSubtitle: 'Start your intelligent skincare journey',
    signupName: 'Name',
    signupEmail: 'Email Address',
    signupPassword: 'Password',
    signupConfirmPassword: 'Confirm Password',
    signupButton: 'Sign Up',
    signupLoading: 'Signing up...',
    signupErrorFields: 'Please fill in all fields',
    signupErrorPassword: 'Passwords do not match',
    signupErrorPasswordLength: 'Password must be at least 6 characters',
    signupFailed: 'Signup failed, please try again',
    signupHaveAccount: 'Already have an account?',
    signupLoginLink: 'Login now',
    signupOr: 'or',
    signupBackHome: '← Back to Home',
    signupNamePlaceholder: 'Your Name',
    signupEmailPlaceholder: 'Your Email Address',
    signupPasswordPlaceholder: 'Set a Password',
    signupConfirmPasswordPlaceholder: 'Confirm Password',

    // Dashboard
    dashboardTitle: 'My Dashboard',
    dashboardWelcome: 'Welcome back',
    dashboardContinue: '🔍 Continue Using',
    dashboardLogout: '🚪 Logout',
    dashboardSkinRecords: 'Skin Records',
    dashboardAIAnalysis: 'AI Analysis',
    dashboardLastActivity: 'Last Activity',
    dashboardNoActivity: 'No records yet',
    dashboardHistory: 'History',
    dashboardNoRecords: 'No records yet',
    dashboardStartUsing: 'Start Using',
    dashboardDetails: 'Details',
    dashboardClickToView: 'Click a record on the left to view details',
    dashboardContent: 'Content',
    dashboardAnalysisResults: 'AI Analysis Results',
    dashboardSkinType: 'Skin Type:',
    dashboardConcerns: 'Concerns:',
    dashboardSummary: 'Summary:',
    dashboardWeatherInfo: 'Weather Information',
    dashboardTemp: 'Temperature',
    dashboardCondition: 'Condition',
    dashboardHumidity: 'Humidity',
    dashboardUVIndex: 'UV Index',
    dashboardWelcomeBack: 'Welcome back!',
    dashboardJourneySummary: 'Here is a summary of your skincare journey.',
    dashboardAIAssistantTitle: 'SkinMe AI Assistant',
    dashboardAIAssistantSubtitle: 'Your personal guide to better skin',
    dashboardAIWelcomeMessage: "Hello! I'm here to help you with your skincare analysis. Feel free to ask me anything or upload a photo to get started.",
    dashboardRecentActivity: 'Recent Activity',
    dashboardActivityRoutine: 'Logged AM Routine',
    dashboardActivityPhoto: 'Uploaded Skin Photo',
    dashboardActivityRecommendation: 'New Recommendation',
    dashboardActivityProductSaved: 'Saved Recommended Product',
    dashboardActivityTimeToday: 'Today',
    dashboardActivityTimeYesterday: 'Yesterday',
    dashboardChatPlaceholder: 'Type a message',
    dashboardSavedProducts: 'Recommended Products',
    dashboardNoProducts: 'No saved products yet',
    dashboardViewProduct: 'View Details',

    // App Page - Chat Interface
    appNewChat: '+ New Chat',
    appMenuHistory: 'View History',
    appTitle: 'SkinMe AI',
    appSubtitle: 'SkinMe AI Skincare Assistant',
    appWelcomeMessage: 'Upload skin photo or describe your skin concerns',
    appAnalyzeSkin: 'Analyze Skin Condition',
    appRecommendProducts: 'Recommend Products',
    appChatPlaceholder: 'What skincare concerns do you have...',
    appUploadImage: 'Upload Image',
    appPreview: 'Preview',
    appDisclaimer: 'SkinMe AI may make mistakes. Please verify important information.',
    appSunProtection: '☀️ Remember sunscreen',
    appAIAdvisor: 'AI Skincare Advisor',
    appChatDescription: 'Chat with AI for skincare advice, or upload skin photos for professional analysis',
    appStartMessage: 'Start chatting, ask about skincare questions, or upload a skin photo for analysis...',
    appUploadPhoto: 'Upload Photo',
    appHistoryModalTitle: '📋 History',
    appNoHistory: 'No history yet',
    appClose: 'Close',
    appSkinType: 'Skin Type',
    appConcerns: 'Concerns',
    appUserUploaded: 'User uploaded',

    // Sidebar Navigation
    sidebarNewConversation: 'New Chat',
    sidebarLanguage: 'Language',
    sidebarProfile: 'Profile',
    sidebarLogout: 'Logout',

    // Enhanced Calendar / Google Calendar
    googleCalendarLabel: 'Google Calendar',
    googleConnected: '✅ Successfully connected to Google Calendar!',
    syncing: 'Syncing...',
    connected: 'Connected',
    connect: 'Connect',
    disconnect: 'Disconnect',
    disconnectSuccess: 'ℹ️ Disconnected from Google Calendar',
    disconnectFailed: '❌ Failed to sign out',
    signInCancelled: '❌ Sign-in cancelled. Please try again.',
    invalidOrigin: '❌ OAuth configuration error: Please add http://localhost:3001 to "Authorized JavaScript origins" in Google Cloud Console',
    credentialsNotConfigured: '❌ Google Calendar API not configured. Please check your .env.local file.',
    signInFailedPrefix: '❌ Sign-in failed: ',
    syncSuccessCount: '✅ Successfully synced {count} events to Google Calendar!',
    syncCount: 'Sync ({count})',
    syncFailed: '❌ Batch sync failed: {error}',

    actionCreate: 'create',
    actionUpdate: 'update',
    actionDelete: 'delete',
    syncActionFailedTemplate: '❌ Sync failed: Could not {action} event',

    // Calendar UI labels
    eventTypeLabel: 'Event Type',
    titleLabel: 'Title',
    eventTitlePlaceholder: 'e.g., Morning routine, New moisturizer arrived',
    descriptionOptional: 'Description (Optional)',
    eventDescriptionPlaceholder: 'Add details...',
    existingEvents: 'Existing Events:',
    addNewEvent: 'Add New Event:',
    skincareRoutineLabel: '💆 Skincare Routine',
    skinConditionLabel: '🌡️ Skin Condition',
    productDeliveryLabel: '📦 Product Delivery',
    deliveryStatusOrdered: '📝 Ordered',
    deliveryStatusShipped: '🚚 Shipped',
    deliveryStatusDelivered: '✅ Delivered',
    deliveryStatusLabel: 'Delivery Status',
    cancel: 'Cancel',
    save: 'Save',
    update: 'Update',
    editEvent: 'Edit Event',
    addEvent: 'Add Event',
    eventTypesHeading: 'Event Types:',
    weekDaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

    //chat history
    chatHistory: 'Chat History',
    backToChat: 'Back to Chat',
    signtoviewhistory: 'Sign in to view your previous conversations and continue where you left off.',
    startChatting: 'Start Chatting',
    last24Hours: 'Last 24 hours',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    last90Days: 'Last 90 days',
    loadingChatHistory: 'Loading chat history...',
    noChatHistory: 'No chat history yet',
    noChatHistoryDesc: 'Start a conversation to see your chat history here.',
    you: 'You',
    skinmeAI: 'SkinMe AI',
    imageTag: 'Image',
    showingMessages: 'Showing',
    messagesFromLast: 'messages from the last',
    days: 'days',
  }
};

// Hook to use translations
export const useTranslations = (language: Language): Translations => {
  return (translations[language] || translations.en) as Translations;
};
