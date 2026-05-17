# HERM Skincare AI - Frontend

Next.js web application for AI-powered skincare recommendations.

## Tech Stack

- **Framework**: Next.js 15.0.3 (React 18)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS + shadcn/ui
- **Mobile**: Capacitor (iOS/Android)

## Project Structure

```
src/frontend/
├── src/
│   ├── app/                           # Next.js App Router pages
│   │   ├── dashboard/
│   │   │   └── page.tsx               # Main dashboard with AI chat
│   │   ├── login/
│   │   │   └── page.tsx               # User authentication
│   │   ├── history/
│   │   │   └── page.tsx               # Skincare history tracking
│   │   ├── layout.tsx                 # Root layout with providers
│   │   └── globals.css                # Global styles
│   │
│   ├── components/                    # Reusable React components
│   │   ├── ui/                        # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...                    # Other UI primitives
│   │   ├── DashboardContent.tsx       # Main dashboard logic & chat
│   │   ├── ProductCard.tsx            # Single product display card
│   │   ├── ProductList.tsx            # Product grid container
│   │   ├── EnhancedCalendar.tsx       # Calendar with events
│   │   ├── LanguageSwitcher.tsx       # EN/ZH language toggle
│   │   └── WeatherCalendar.tsx        # Weather display widget
│   │
│   ├── contexts/                      # React Context providers
│   │   ├── AuthContext.tsx            # User authentication state
│   │   └── LanguageContext.tsx        # i18n language selection
│   │
│   ├── locales/                       # Internationalization
│   │   └── translations.ts            # EN/ZH translation strings
│   │
│   └── lib/                           # Utility functions
│       └── utils.ts                   # Helper functions (cn, etc.)
│
├── public/                            # Static assets (images, fonts)
├── capacitor.config.ts                # Mobile app configuration
├── tailwind.config.ts                 # Tailwind CSS settings
├── tsconfig.json                      # TypeScript configuration
├── next.config.mjs                    # Next.js configuration
└── package.json                       # Dependencies & scripts
```

### Code Organization by Domain

**Pages (`app/`)**:
- Each route is a folder with `page.tsx`
- Follows Next.js App Router conventions
- `layout.tsx` wraps all pages with Auth/Language providers

**Components (`components/`)**:
- `ui/`: Low-level UI primitives from shadcn/ui (Button, Card, etc.)
- Top-level: Business logic components (Dashboard, Product displays)
- Single Responsibility Principle: Each component has one clear purpose

**State Management (`contexts/`)**:
- `AuthContext`: Google OAuth, user session
- `LanguageContext`: EN/ZH language switching

**Translations (`locales/`)**:
- Centralized translation keys
- Type-safe with TypeScript interfaces

### Code Style Guide

- **Style Guide**: Airbnb JavaScript conventions
- **TypeScript**: Strict mode enabled
- **Naming Conventions**:
  - Components: `PascalCase` (e.g., `DashboardContent.tsx`)
  - Functions/Variables: `camelCase` (e.g., `handleSendMessage`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
  - Interfaces: `PascalCase` with descriptive names (e.g., `ProductCardProps`)

**Component Structure**:
```typescript
// 1. Imports
import { useState } from 'react';

// 2. Interfaces
interface MyComponentProps {
  title: string;
}

// 3. Component
export function MyComponent({ title }: MyComponentProps) {
  // 4. Hooks
  const [state, setState] = useState();

  // 5. Helper functions
  const handleClick = () => { };

  // 6. Render
  return <div>{title}</div>;
}
```

## Setup

**Prerequisites**: Node.js 18+, npm 9+

1. **Install**:
```bash
cd src/frontend
npm install
```

2. **Environment** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Running Locally

```bash
npm run dev  # Dev server at http://localhost:3001
npm run build && npm start  # Production
```

## Mobile

```bash
npm run mobile:add-ios      # Add iOS platform
npm run mobile:add-android  # Add Android
npm run build:mobile        # Build & sync
npm run ios:open            # Open Xcode
npm run android:open        # Open Android Studio
```

## Features

- AI chat assistant with product recommendations
- Skin image analysis
- Weather-based skincare advice
- Bilingual (EN/ZH)
