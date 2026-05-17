/**
 * SkinMe AI - Tailwind Configuration
 * Medical-Grade Minimalist Design System
 * Updated: 2025-12-07
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
    darkMode: ['class'],
    content: [
        './src/app/**/*.{js,jsx,ts,tsx}',
        './src/components/**/*.{js,jsx,ts,tsx}',
        './src/contexts/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            /* ========================================
               Container Sizes (from Figma)
               ======================================== */
            container: {
                center: true,
                padding: '1rem',
                screens: {
                    sm: '24rem',    // 384px - var(--container-sm)
                    '2xl': '42rem', // 672px - var(--container-2xl)
                    '4xl': '56rem', // 896px - var(--container-4xl)
                    '6xl': '72rem', // 1152px - var(--container-6xl)
                    '7xl': '80rem', // 1280px - var(--container-7xl)
                },
            },

            /* ========================================
               Border Radius System - Pill Shape & Cards
               ======================================== */
            borderRadius: {
                xs: 'var(--radius-xs)',      // 0.25rem (4px)
                sm: 'var(--radius-sm)',      // 0.5rem (8px)
                md: 'var(--radius-md)',      // 0.75rem (12px)
                lg: 'var(--radius-lg)',      // 1rem (16px)
                xl: 'var(--radius-xl)',      // 1.25rem (20px)
                '2xl': 'var(--radius-2xl)',  // 1.5rem (24px)
                '3xl': 'var(--radius-3xl)',  // 2rem (32px)
                card: 'var(--radius-card)',  // 1rem (16px) - 专用于卡片
                full: '9999px',              // Full rounded / Pill shape
            },

            /* ========================================
               Medical-Grade Color System
               支持透明度修饰符 (e.g., bg-primary/10)
               ======================================== */
            colors: {
                // Base colors - Clinical White & Deep Charcoal
                background: 'hsl(var(--background) / <alpha-value>)',
                foreground: 'hsl(var(--foreground) / <alpha-value>)',

                // Card system - Pure White elevated surfaces
                card: {
                    DEFAULT: 'hsl(var(--card) / <alpha-value>)',
                    foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
                },

                // Popover system
                popover: {
                    DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
                    foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
                },

                // Primary - Elegant Slate (Clinical neutral)
                primary: {
                    DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
                    foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
                    hover: 'hsl(var(--primary-hover) / <alpha-value>)',
                },

                // Secondary - Deep Teal (minimal usage)
                secondary: {
                    DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
                    foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
                },

                // Muted - Medium Gray for secondary text
                muted: {
                    DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
                    foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
                },

                // Accent - Neutral Warm Gray
                accent: {
                    DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
                    foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
                },

                // Destructive - Error states
                destructive: {
                    DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
                    foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
                },

                // Input & Borders - Minimal borders
                border: 'hsl(var(--border) / <alpha-value>)',
                input: 'hsl(var(--input) / <alpha-value>)',
                ring: 'hsl(var(--ring) / <alpha-value>)',

                // Sidebar - Clinical Navigation
                sidebar: {
                    DEFAULT: 'hsl(var(--sidebar) / <alpha-value>)',
                    foreground: 'hsl(var(--sidebar-foreground) / <alpha-value>)',
                    primary: 'hsl(var(--sidebar-primary) / <alpha-value>)',
                    'primary-foreground': 'hsl(var(--sidebar-primary-foreground) / <alpha-value>)',
                    accent: 'hsl(var(--sidebar-accent) / <alpha-value>)',
                    'accent-foreground': 'hsl(var(--sidebar-accent-foreground) / <alpha-value>)',
                    border: 'hsl(var(--sidebar-border) / <alpha-value>)',
                    ring: 'hsl(var(--sidebar-ring) / <alpha-value>)',
                },

                // Chart colors - Scientific data visualization
                chart: {
                    1: 'hsl(var(--chart-1) / <alpha-value>)',
                    2: 'hsl(var(--chart-2) / <alpha-value>)',
                    3: 'hsl(var(--chart-3) / <alpha-value>)',
                    4: 'hsl(var(--chart-4) / <alpha-value>)',
                    5: 'hsl(var(--chart-5) / <alpha-value>)',
                },
            },
            /* ========================================
               Typography System (from Figma)
               ======================================== */
            fontSize: {
                xs: ['var(--text-xs)', { lineHeight: 'var(--text-xs--line-height)' }],
                sm: ['var(--text-sm)', { lineHeight: 'var(--text-sm--line-height)' }],
                base: ['var(--text-base)', { lineHeight: 'var(--text-base--line-height)' }],
                lg: ['var(--text-lg)', { lineHeight: 'var(--text-lg--line-height)' }],
                xl: ['var(--text-xl)', { lineHeight: 'var(--text-xl--line-height)' }],
                '2xl': ['var(--text-2xl)', { lineHeight: 'var(--text-2xl--line-height)' }],
                '3xl': ['var(--text-3xl)', { lineHeight: 'var(--text-3xl--line-height)' }],
                '4xl': ['var(--text-4xl)', { lineHeight: 'var(--text-4xl--line-height)' }],
                '5xl': ['var(--text-5xl)', { lineHeight: 'var(--text-5xl--line-height)' }],
                '6xl': ['var(--text-6xl)', { lineHeight: 'var(--text-6xl--line-height)' }],
            },

            fontWeight: {
                extralight: 'var(--font-weight-extralight)',
                light: 'var(--font-weight-light)',
                normal: 'var(--font-weight-normal)',
                medium: 'var(--font-weight-medium)',
                semibold: 'var(--font-weight-semibold)',
                bold: 'var(--font-weight-bold)',
            },

            letterSpacing: {
                tight: 'var(--tracking-tight)',
                wide: 'var(--tracking-wide)',
            },

            lineHeight: {
                tight: 'var(--leading-tight)',
                relaxed: 'var(--leading-relaxed)',
            },

            /* ========================================
               Spacing System (from Figma)
               ======================================== */
            spacing: {
                'base': 'var(--spacing)', // 0.25rem (4px)
            },

            /* ========================================
               Effects & Filters (from Figma)
               ======================================== */
            blur: {
                sm: 'var(--blur-sm)',     // 8px
                md: 'var(--blur-md)',     // 12px
                '2xl': 'var(--blur-2xl)', // 40px
                '3xl': 'var(--blur-3xl)', // 64px
            },

            /* ========================================
               Animation & Transitions (from Figma)
               ======================================== */
            transitionTimingFunction: {
                'in-out': 'var(--ease-in-out)',
            },

            transitionDuration: {
                DEFAULT: 'var(--default-transition-duration)',
            },

            boxShadow: {
                'card': '0 2px 12px rgba(0,0,0,0.04)', // 极淡投影 - 用于卡片悬浮感
                'button': '0 2px 8px rgba(51, 65, 85, 0.18)', // 石板灰投影 - 用于主按钮
                'button-hover': '0 4px 14px rgba(51, 65, 85, 0.24)', // 悬停时增强投影
            },

            keyframes: {
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'pulse-slow': { // 为“极慢的蓝色呼吸灯”效果定义的关键帧
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.7' }, // 调整不透明度以实现微妙的“呼吸”效果
                },
            },
            animation: {
                // 仅保留微交互：fade-up (内容上浮淡入) 和 pulse-slow (极慢的蓝色呼吸灯)
                'fade-up': 'fade-up 0.3s ease-out',
                'pulse-slow': 'pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                // 移除所有复杂动画：禁止使用 blob, float, shimmer 等装饰性动画
            },

            /* ========================================
               Font Family (from Figma)
               ======================================== */
            fontFamily: {
                sans: 'var(--font-sans)',
                mono: 'var(--font-mono)',
            },
        },
    },
    plugins: [
        require("tailwindcss-animate")
    ],
}
