# Kharcha – AI-Powered Personal Finance Manager (MVP)

## Overview
Kharcha is an offline-first personal finance mobile app built with **React Native (Expo)**. All data lives locally in **SQLite** (via `expo-sqlite`). No cloud, no backend calls.

> Note: The original spec requested Flutter. Since this platform only supports Expo/React Native, the equivalent architecture was implemented in RN with the same modular philosophy (Clean Architecture: `core/`, `data/`, `providers/`, `widgets/`, expo-router file-based routes).

## Tech Stack
- **Framework:** Expo SDK 54 + React Native 0.81 (expo-router)
- **Local DB:** expo-sqlite (WAL journal, migrations, seed categories)
- **State:** React Context + hooks (`AppProviders`)
- **Charts:** react-native-gifted-charts (Pie + Bar)
- **Auth:** expo-local-authentication (biometric) + expo-crypto (SHA-256 PIN hash)
- **UI:** Custom Material 3-inspired design system, expo-blur glass bottom tabs, safe-area aware
- **Design tokens:** Industrial Orange brand (#FF5E00), high-contrast light/dark, monospace numerics

## Modules & Routes
```
app/
├── _layout.tsx            # Root: providers, DB init, theme
├── index.tsx              # Splash → route decider
├── onboarding.tsx         # Welcome → Currency → PIN setup
├── lock.tsx               # PIN + Biometric unlock
├── (tabs)/
│   ├── _layout.tsx        # Blurred pill tab bar (Home/Ledger/Insights/Settings)
│   ├── index.tsx          # Dashboard
│   ├── transactions.tsx   # Ledger (search, filter, grouped by day)
│   ├── analytics.tsx      # Insights (Pie, Bar, Top Merchants)
│   └── settings.tsx       # Theme, Currency, App Lock, About, Privacy
├── transaction/add.tsx    # Add / Edit / Delete (id param) – Amount, Category, Merchant, Payment mode, Date, Notes
├── categories.tsx         # Manage expense/income categories + custom
└── reports.tsx            # Day / Month / Year – Summary + By Category + By Merchant

src/
├── core/{theme, currencies, format, pin}.ts
├── data/{db, models, repos}.ts
├── providers/AppProviders.tsx
└── widgets/{ui, PinPad, TransactionRow}.tsx
```

## Data Model (SQLite)
Tables: `settings`, `categories`, `transactions`, `budgets`, `merchants`, `banks`, `accounts`, `analytics_cache`.
Transaction row includes: id, amount, type (debit/credit), category_id, merchant, description, date, payment_mode, bank_name, account_number, upi_id, reference_number, utr, rrn, source, created/updated dates, tags, notes, attachment, status.

Default seed: 12 expense + 6 income categories with Feather icons + brand-aligned colors.

## MVP Features
- ✅ Onboarding: Currency (INR default) + Optional 4-digit PIN
- ✅ App Lock: PIN entry with SHA-256 hash; optional Biometric unlock (Face ID/Fingerprint)
- ✅ Themes: Light / Dark / System (persisted, hot-reactive)
- ✅ Dashboard: Monthly balance hero, today's income/expense, quick actions, recent transactions, FAB
- ✅ Add/Edit/Delete Transaction: full form with type toggle, category chips, payment mode, native date/time picker, notes
- ✅ Ledger: search, expense/income filter, grouped by date with long-press-to-delete
- ✅ Analytics: Week/Month/Year, Income-vs-Expense split, Bar chart of daily expense, Pie chart of category breakdown, Top merchants leaderboard
- ✅ Reports: Day/Month/Year summary with net savings, by category & merchant
- ✅ Categories: Manage; add custom with icon (25+) + color picker; long-press to delete custom
- ✅ Settings: Currency (9 options), Theme, App Lock toggle, Biometric toggle, Clear all data (danger), About/Privacy modals

## Future Extension Points (placeholders documented)
SMS parsing, notification listener, duplicate detection, AI categorization, OCR receipts, cloud sync, AI assistant, investment/loan/subscription trackers, family sharing, REST API, web version.

## Testing
- Web preview: expo-sqlite worker fails to load on web (known Expo web limitation); app boots gracefully with in-memory defaults so the welcome screen renders.
- Full functionality requires Expo Go on Android/iOS device or a native build.
