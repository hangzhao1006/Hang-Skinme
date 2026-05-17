/**
 * Chat Interface Theme Configuration
 * 聊天界面主题配置
 *
 * 在这里修改聊天界面的所有颜色、边框、阴影等样式
 * Modify all chat interface colors, borders, shadows, etc. here
 */

export const chatTheme = {
  // ============================================
  // 背景色 Background Colors
  // ============================================
  background: {
    // 整体页面背景
    page: 'bg-white',

    // 欢迎页面背景（未开始聊天时）
    welcomeScreen: 'bg-white',

    // 聊天激活时的背景（聊天进行中）
    chatActive: 'bg-white',
  },

  // ============================================
  // 消息气泡 Message Bubbles
  // ============================================
  messages: {
    // 用户消息（右侧）- 硬编码在 DashboardContent.tsx 中
    // 样式：rounded-2xl bg-gray-500 text-white border border-gray-600 px-4 py-3
    user: {
      // 不再使用，已在组件中硬编码
    },

    // AI助手消息（左侧）
    assistant: {
      background: 'bg-white/95',
      textColor: 'text-slate-900',
      shadow: 'shadow-[0_14px_30px_rgba(109,124,96,0.12)]',
      borderRadius: 'rounded-2xl',
      padding: 'px-4 py-3',
    },
  },

  // ============================================
  // 输入框 Input Box
  // ============================================
  input: {
    // 输入框容器
    container: {
      background: 'bg-white/92 backdrop-blur-sm',
      border: 'border border-[#dfe6d2]',
      shadow: 'shadow-[0_10px_24px_rgba(109,124,96,0.08)]',
      borderRadius: 'rounded-2xl',
      padding: 'px-5 py-4', // 欢迎页面
      paddingChat: 'px-5 py-3', // 聊天页面
    },

    // 输入框文本
    text: {
      textColor: 'text-foreground',
      placeholderColor: 'placeholder-slate-400',
    },

    // 发送按钮
    sendButton: {
      background: 'bg-gradient-to-r from-[#cde4b0] via-[#a7c089] to-[#7f8f70]',
      hoverBackground: 'hover:from-[#bed0a3] hover:via-[#97a47d] hover:to-[#6d7c60]',
      textColor: 'text-[#1c2617]',
      borderRadius: 'rounded-full',
      padding: 'px-6',
      height: 'h-10',
    },

    // 附件按钮（图片、文件）
    attachmentButton: {
      textColor: 'text-slate-500',
      hoverTextColor: 'hover:text-slate-800',
      hoverBackground: 'hover:bg-slate-100',
      borderRadius: 'rounded-xl',
      size: 'h-10 w-10',
    },
  },

  // ============================================
  // 快捷操作按钮 Quick Action Buttons
  // ============================================
  quickActions: {
    background: 'bg-white/92 backdrop-blur-sm',
    border: 'border border-[#dfe6d2]',
    hoverBackground: 'hover:bg-[#f3f7ed]',
    borderRadius: 'rounded-xl',
    padding: 'p-4',

    // 按钮标题
    title: {
      textColor: 'text-slate-800',
      fontSize: 'text-sm',
      fontWeight: 'font-medium',
    },

    // 按钮副标题
    subtitle: {
      textColor: 'text-slate-500',
      fontSize: 'text-xs',
    },

    // emoji 大小
    emojiSize: 'text-2xl',
  },

  // ============================================
  // 日历组件 Calendar Widget
  // ============================================
  calendar: {
    // 容器
    container: {
      background: 'bg-gradient-to-br from-[#d9f3d0] via-[#f6e6f5] to-[#fbe4d5]',
      borderRadius: 'rounded-2xl',
      shadow: 'shadow-sm',
      padding: 'p-5',
      minHeight: 'min-h-[280px]', // 欢迎页面
      minHeightChat: 'min-h-[320px]', // 聊天页面
    },

    // 标题文字
    header: {
      textColor: 'text-slate-700',
      fontSize: 'text-sm',
      fontWeight: 'font-medium',
    },

    // 星期标题
    dayHeaders: {
      textColor: 'text-slate-500',
      fontSize: 'text-xs',
      fontWeight: 'font-medium',
    },

    // 日期按钮
    dateButton: {
      textColor: 'text-slate-700',
      fontSize: 'text-xs',
      borderRadius: 'rounded-lg',
      hoverBackground: 'hover:bg-white/40',
    },

    // 选中的日期
    selectedDate: {
      background: 'bg-gradient-to-br from-[#5f6ee2] to-[#7cb7ff]',
      textColor: 'text-white',
      shadow: 'shadow-md',
      scale: 'scale-105',
    },

    // 导航按钮
    navButton: {
      hoverBackground: 'hover:bg-white/30',
      borderRadius: 'rounded-lg',
    },
  },

  // ============================================
  // 天气组件 Weather Widget
  // ============================================
  weather: {
    // 容器
    container: {
      background: 'bg-gradient-to-br from-[#e6f3ff] via-[#cfe6ff] to-[#a8d4ff]',
      borderRadius: 'rounded-2xl',
      shadow: 'shadow-sm',
      padding: 'p-5',
      minHeight: 'min-h-[280px]', // 欢迎页面
      minHeightChat: 'min-h-[320px]', // 聊天页面
    },

    // 位置文字
    location: {
      textColor: 'text-blue-900/70',
      fontSize: 'text-sm',
    },

    // 温度数字
    temperature: {
      textColor: 'text-blue-900',
      fontSize: 'text-5xl',
      fontWeight: 'font-extralight',
    },

    // 天气描述
    description: {
      textColor: 'text-blue-900/70',
      fontSize: 'text-sm',
    },

    // 详细信息（湿度、UV等）
    details: {
      textColor: 'text-blue-900',
      iconColorHumidity: 'text-blue-700',
      iconColorUV: 'text-amber-500',
      fontSize: 'text-sm',
    },
  },

  // ============================================
  // 产品卡片 Product Cards
  // ============================================
  productCard: {
    container: {
      background: 'bg-white',
      border: 'border border-slate-200',
      borderRadius: 'rounded-xl',
      shadow: 'shadow-sm',
      hoverShadow: 'hover:shadow-lg',
      padding: 'p-4',
    },

    // 产品标题
    title: {
      textColor: 'text-gray-900',
      fontSize: 'text-sm',
      fontWeight: 'font-medium',
    },

    // 品牌名称
    brand: {
      textColor: 'text-gray-600',
      fontSize: 'text-xs',
    },

    // 分类标签
    category: {
      background: 'bg-slate-100',
      textColor: 'text-slate-700',
      fontSize: 'text-xs',
      borderRadius: 'rounded-full',
      padding: 'px-2 py-1',
    },

    // 成分预览
    ingredients: {
      textColor: 'text-gray-500',
      fontSize: 'text-xs',
    },

    // 购买按钮
    buyButton: {
      background: 'bg-gradient-to-r from-[#eef4e6] via-[#dfead0] to-[#c4d3ae]',
      hoverBackground: 'hover:from-[#e3eddc] hover:via-[#d4e1c6] hover:to-[#b7c999]',
      textColor: 'text-[#2d3527]',
      border: 'border border-[#dfe6d2]',
      shadow: 'shadow-[0_12px_26px_rgba(109,124,96,0.14)]',
      borderRadius: 'rounded-full',
      padding: 'px-3 py-1',
      fontSize: 'text-xs',
    },
  },

  // ============================================
  // 加载状态 Loading State
  // ============================================
  loading: {
    // 加载点
    dots: {
      background: 'bg-slate-500',
      size: 'w-2 h-2',
      borderRadius: 'rounded-full',
    },

    // 加载容器
    container: {
      background: 'bg-card',
      border: 'border border-border',
      borderRadius: 'rounded-2xl',
      padding: 'px-4 py-3',
      shadow: 'shadow-card',
    },
  },

  // ============================================
  // 图片预览 Image Preview
  // ============================================
  imagePreview: {
    // 预览图片
    image: {
      borderRadius: 'rounded-xl',
      heightWelcome: 'h-32', // 欢迎页面
      heightChat: 'h-20', // 聊天页面
    },

    // 关闭按钮
    closeButton: {
      background: 'bg-slate-800',
      textColor: 'text-white',
      size: 'w-7 h-7', // 欢迎页面
      sizeChat: 'w-6 h-6', // 聊天页面
      borderRadius: 'rounded-full',
      hoverBackground: 'hover:bg-slate-700',
    },
  },

  // ============================================
  // 布局 Layout
  // ============================================
  layout: {
    // 聊天列最大宽度
    chatMaxWidth: 'max-w-7xl',

    // 欢迎页面最大宽度
    welcomeMaxWidth: 'max-w-3xl',

    // 输入框最大宽度
    inputMaxWidth: 'max-w-3xl',

    // 快捷按钮最大宽度
    quickActionsMaxWidth: 'max-w-4xl',

    // 右侧边栏宽度（日历+天气）
    sidebarWidth: 'w-80',

    // 间距
    gap: 'gap-6',
    gapSmall: 'gap-4',
    gapTiny: 'gap-3',
  },

  // ============================================
  // 欢迎标题 Welcome Title
  // ============================================
  welcomeTitle: {
    main: {
      textColor: 'text-slate-800',
      fontSize: 'text-4xl',
      fontWeight: 'font-medium',
    },
    subtitle: {
      textColor: 'text-slate-500',
      fontSize: 'text-lg',
    },
  },

  // ============================================
  // 登录/注册页面 Login/Signup Pages
  // ============================================
  auth: {
    // 页面背景
    background: 'bg-background',
    backgroundGradient: 'bg-gradient-to-br from-slate-50 via-cyan-50 to-rose-50',

    // Logo 容器
    logo: {
      background: 'bg-gradient-to-br from-slate-600 to-slate-700',
      size: 'w-16 h-16',
      borderRadius: 'rounded-xl',
      shadow: 'shadow-button',
      textColor: 'text-white',
      fontSize: 'text-3xl',
    },

    // 卡片容器
    card: {
      maxWidth: 'max-w-md',
      padding: 'p-10',
      shadow: 'shadow-card',
      border: 'border-none',
      background: 'bg-card',
      backgroundBlur: 'bg-card/95 backdrop-blur-sm', // 用于注册页面
    },

    // 标题
    title: {
      textColor: 'text-foreground',
      fontSize: 'text-3xl',
      fontWeight: 'font-medium',
    },

    // 副标题
    subtitle: {
      textColor: 'text-muted-foreground',
      fontSize: 'text-base',
      fontWeight: 'font-normal',
    },

    // 输入框
    input: {
      height: 'h-12',
      border: 'border border-input',
      focusBorder: 'focus:border-primary',
      focusRing: 'focus:ring-2 focus:ring-primary/20',
      borderRadius: 'rounded-lg',
      background: 'bg-background',
    },

    // 标签
    label: {
      textColor: 'text-foreground',
      fontSize: 'text-sm',
      fontWeight: 'font-medium',
    },

    // 主按钮（登录/注册）
    primaryButton: {
      height: 'h-12',
      background: 'bg-gradient-to-r from-slate-600 to-slate-700',
      hoverBackground: 'hover:from-slate-700 hover:to-slate-800',
      textColor: 'text-black',
      fontWeight: 'font-medium',
      borderRadius: 'rounded-full',
      shadow: 'shadow-lg',
      hoverShadow: 'hover:shadow-xl',
    },

    // 次要按钮（快速登录）
    secondaryButton: {
      height: 'h-12',
      border: 'border-2 border-slate-300',
      textColor: 'text-slate-700',
      hoverBackground: 'hover:bg-slate-50',
      fontWeight: 'font-medium',
      borderRadius: 'rounded-full',
    },

    // 错误提示
    error: {
      background: 'bg-destructive/10',
      border: 'border border-destructive/20',
      borderRadius: 'rounded-lg',
      padding: 'p-4',
      textColor: 'text-destructive',
      fontSize: 'text-sm',
      fontWeight: 'font-normal',
    },

    // 链接
    link: {
      textColor: 'text-slate-700',
      hoverTextColor: 'hover:text-slate-900',
      fontWeight: 'font-medium',
    },

    // 返回首页链接
    backLink: {
      textColor: 'text-muted-foreground',
      hoverTextColor: 'hover:text-foreground',
      fontSize: 'text-sm',
      fontWeight: 'font-normal',
    },
  },

  // ============================================
  // 个人资料页面 Profile Page
  // ============================================
  profile: {
    // 页面背景
    background: 'bg-background',

    // 页面标题
    pageTitle: {
      textColor: 'text-foreground',
      fontSize: 'text-3xl',
      fontWeight: 'font-medium',
    },

    // 卡片容器
    card: {
      background: 'bg-card',
      borderRadius: 'rounded-card',
      padding: 'p-8',
      shadow: 'shadow-card',
      border: 'border-none',
    },

    // 头像容器
    avatar: {
      size: 'w-20 h-20',
      borderRadius: 'rounded-xl',
      background: 'bg-gradient-to-br from-slate-100 to-slate-200',
      emoji: '👤',
      emojiSize: 'text-4xl',
      emojiColor: 'text-slate-600',
    },

    // 用户名
    userName: {
      textColor: 'text-foreground',
      fontSize: 'text-2xl',
      fontWeight: 'font-medium',
    },

    // 用户邮箱
    userEmail: {
      textColor: 'text-muted-foreground',
      fontSize: 'text-base',
      fontWeight: 'font-normal',
    },

    // 信息卡片
    infoCard: {
      background: 'bg-background',
      borderRadius: 'rounded-lg',
      padding: 'p-4',
      border: 'border border-border',
    },

    // 信息标签
    infoLabel: {
      textColor: 'text-muted-foreground',
      fontSize: 'text-sm',
      fontWeight: 'font-normal',
    },

    // 信息值
    infoValue: {
      textColor: 'text-foreground',
      fontSize: 'text-base',
      fontWeight: 'font-medium',
    },

    // 登出按钮
    logoutButton: {
      background: 'bg-destructive',
      hoverBackground: 'hover:bg-destructive/90',
      textColor: 'text-destructive-foreground',
      borderRadius: 'rounded-full',
      padding: 'px-8',
      height: 'h-11',
      fontWeight: 'font-medium',
      shadow: 'shadow-button',
      hoverShadow: 'hover:shadow-button-hover',
    },
  },

  // ============================================
  // 历史页面 History Page
  // ============================================
  history: {
    // 页面背景
    background: 'bg-gradient-to-br from-slate-50 via-cyan-50 to-rose-50',

    // 头部导航
    header: {
      background: 'bg-white/80 backdrop-blur-sm',
      border: 'border-b border-gray-200',
      padding: 'py-4',
    },

    // 页面标题
    pageTitle: {
      textColor: 'text-gray-900',
      fontSize: 'text-2xl',
      fontWeight: 'font-medium',
    },

    // 卡片容器
    card: {
      background: 'bg-white/95 backdrop-blur-sm',
      padding: 'p-6',
      shadow: 'shadow-card',
      border: 'border-0',
    },

    // 日历月份标题
    monthTitle: {
      textColor: 'text-gray-900',
      fontSize: 'text-2xl',
      fontWeight: 'font-medium',
    },

    // 星期标题
    weekDayHeader: {
      textColor: 'text-gray-600',
      fontSize: 'text-sm',
      fontWeight: 'font-semibold',
    },

    // 日期按钮 - 当前月份
    dateButton: {
      textColor: 'text-gray-900',
      fontSize: 'text-sm',
      borderRadius: 'rounded-lg',
      hoverBackground: 'hover:bg-gray-100',
      padding: 'p-2',
    },

    // 日期按钮 - 其他月份
    dateButtonOther: {
      textColor: 'text-gray-400',
    },

    // 今天的日期
    dateToday: {
      background: 'bg-gradient-to-br from-slate-100 to-slate-200',
      fontWeight: 'font-medium',
    },

    // 选中的日期
    dateSelected: {
      ring: 'ring-2 ring-slate-500',
      background: 'bg-gradient-to-br from-slate-100 to-slate-200',
    },

    // 有记录的日期
    dateWithRecords: {
      fontWeight: 'font-semibold',
    },

    // 记录指示点 - AI分析
    indicatorAI: {
      background: 'bg-slate-600',
      size: 'w-1.5 h-1.5',
      borderRadius: 'rounded-full',
    },

    // 记录指示点 - 手动记录
    indicatorManual: {
      background: 'bg-rose-400',
      size: 'w-1.5 h-1.5',
      borderRadius: 'rounded-full',
    },

    // 记录卡片
    recordCard: {
      padding: 'p-4',
      borderRadius: 'rounded-lg',
      border: 'border-2',
      borderColor: 'border-gray-200',
      borderColorHover: 'hover:border-slate-300',
      hoverBackground: 'hover:bg-slate-50',
    },

    // 选中的记录卡片
    recordCardSelected: {
      borderColor: 'border-slate-400',
      background: 'bg-gradient-to-br from-slate-50 to-slate-100',
    },

    // Badge - AI分析
    badgeAI: {
      background: 'bg-slate-600',
      textColor: 'text-white',
    },

    // Badge - 手动记录
    badgeManual: {
      background: 'bg-rose-300',
      textColor: 'text-rose-900',
    },

    // 记录标题
    recordTitle: {
      textColor: 'text-gray-900',
      fontWeight: 'font-medium',
    },

    // 记录时间
    recordTime: {
      textColor: 'text-gray-500',
      fontSize: 'text-xs',
    },

    // 详情标题
    detailsTitle: {
      textColor: 'text-gray-700',
      fontWeight: 'font-medium',
    },

    // 内容卡片
    contentCard: {
      background: 'bg-gray-50',
      padding: 'p-3',
      borderRadius: 'rounded-lg',
      textColor: 'text-gray-800',
      fontSize: 'text-sm',
    },

    // AI分析卡片
    analysisCard: {
      background: 'bg-gradient-to-br from-slate-50 to-slate-100',
      padding: 'p-3',
      borderRadius: 'rounded-lg',
      border: 'border border-slate-200',
    },

    // 天气卡片
    weatherCard: {
      background: 'bg-cyan-50',
      padding: 'p-3',
      borderRadius: 'rounded-lg',
      textColor: 'text-gray-700',
      fontSize: 'text-sm',
    },
  },
};

export default chatTheme;
