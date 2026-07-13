# AgriOS India — Architecture

**Phase 1:** complete UI/UX foundation (design system, screens, navigation, i18n).
**Phase 3A:** AI Engine — multi-agent framework, AI router, prompt/memory/context
engines, tool calling, streaming chat, voice + image pipelines, plus one serverless
gateway (`api/ai/chat.js`) that holds the Anthropic API key. See **AI Engine** below.
**Phase 2** (real backend: DB, auth, sync) is still pending — AI memory is
local-first and swaps to the backend later without changing callers.

Stack: **React 18 + Vite**, plain JS + JSX, `lucide-react` icons. No CSS framework —
a token-driven design system using CSS custom properties (full light/dark support).

## Folder structure

```
src/
├── main.jsx                # entry
├── App.jsx                 # composition root (providers → router)
├── theme/                  # design system
│   ├── tokens.js           # palette (light/dark), radius, spacing, type, motion
│   └── ThemeProvider.jsx   # injects CSS vars, dark mode, global styles + keyframes
├── store/
│   └── AppStore.jsx        # app state: language, auth flow, navigation, toasts
├── navigation/
│   ├── ScreenRouter.jsx    # renders the current stage / tab / pushed screen
│   └── BottomNav.jsx       # 5-tab bottom navigation
├── hooks/
│   └── index.js            # useApp, useTheme, useToast, useNav, useI18n
├── components/             # reusable UI library
│   ├── Icon.jsx            # curated icon registry (bundle-friendly)
│   ├── primitives.jsx      # Button (ripple), Card, Chip, IconTile, SectionHeader
│   ├── inputs.jsx          # Input, SearchBar, Dropdown, OtpInput
│   ├── feedback.jsx        # Skeleton, EmptyState, ErrorState, Spinner, ToastHost
│   ├── overlays.jsx        # BottomSheet, Dialog
│   ├── layout.jsx          # AppBar, Screen
│   └── index.js            # barrel export
├── pages/                  # screens
│   ├── Splash · LanguageSelect · Onboarding · AuthFlow (Login + OtpVerify)
│   ├── Home · AIHub · Market · Services · Profile · Settings
│   └── FeatureDetail       # generic premium "coming soon" detail screen
├── constants/
│   ├── content.js          # all mock content (schemes, prices, tools, services…)
│   └── languages.js        # 8 languages + locales
├── i18n/
│   └── strings.js          # shell dictionaries (en / hi / bn), English fallback
└── utils/
    ├── storage.js          # namespaced localStorage wrapper (prefs only)
    └── format.js           # ₹ formatting, dates, greetings
```

## Design system

- **Tokens → CSS variables.** `ThemeProvider` renders `--ag-*` variables for the
  active theme onto `:root[data-theme]`. Components read them via the `T` helper
  (`T.primary`, `T.surface`, …), so **dark mode is instant and global** with zero
  per-component logic. Theme = light / dark / system (follows OS).
- **Motion.** All animations are pure CSS keyframes (fade, rise, pop, sheet,
  push-in, ripple, shimmer, toast) — no animation library, and they respect
  `prefers-reduced-motion`.
- **Accessibility.** Focus-visible rings, `aria-label`s, `role="dialog"`/
  `alertdialog`, large tap targets, high-contrast dark theme, screen-reader text.
- **Bundle.** Icons are a curated registry (only used icons imported) so the
  gzipped bundle stays ~72 KB — deliberate, for users on slow rural networks.

## State & navigation

`AppStore` is a single, well-scoped context holding: `language`, `user` (UI-only
auth), the flow `stage` (splash → language → onboarding → auth → app), the active
`tab`, a `stack` of pushed detail screens, and the `toast` queue. `ScreenRouter`
maps that state to screens with page transitions. Feature cards push a
`FeatureDetail` screen (the "designed but not yet built" placeholder).

## What's intentionally NOT here (future phases)

Weather feed, AI inference, market/price APIs, real OTP/auth, payments, database.
Every screen is shaped to drop these in without structural change.

## AI Engine (Phase 3A)

```
src/ai/
├── index.js               # public surface: useAI() hook + engine exports (UI imports ONLY this)
├── config.js              # models (opus-4-8 answers, haiku-4-5 routing), limits, dev-key fallback
├── gateway/aiGateway.js   # the pipeline: validate → rate-limit → route → context → prompt
│                          #   → streaming LLM call → tool loop → persist → analytics
├── router/intentRouter.js # tier-1 keyword scoring → tier-2 LLM classification; sticky per convo
├── agents/                # baseAgent contract + registry + 12 isolated definitions
│   └── definitions/       # each: persona, tools whitelist, triggers, suggested questions
├── prompts/               # versioned library, safety preamble, dynamic system-prompt builder
├── memory/                # conversationStore (CRUD/search/pin/export, pruned), profileMemory,
│                          #   memoryEngine (history window sent to the model)
├── context/contextEngine.js  # date, kharif/rabi/zaid season, farm profile, prior-advice summary
├── tools/                 # toolRegistry + executor; calculator live; weather/market/schemes/pdf
│                          #   registered but honestly report "not connected yet" (no fake data)
├── services/              # llmClient (provider abstraction: /api proxy or dev direct), streamParser
├── voice/speech.js        # Web Speech STT/TTS, 11 Indian locales, graceful fallback
├── vision/imagePipeline.js # pick/capture → canvas compression → Anthropic image block
├── middleware/validation.js # input caps, Aadhaar/OTP detection, client rate limit
└── analytics/aiAnalytics.js # local turn metrics (agent, latency, tokens) — never content

api/ai/chat.js             # Vercel serverless: holds ANTHROPIC_API_KEY, validates, rate-limits,
                           # streams Anthropic SSE through. Set the env var in Vercel settings.
```

Dev without Vercel: `localStorage.setItem("agrios:devApiKey", JSON.stringify("sk-ant-…"))`
makes the client call Anthropic directly (dev builds only). Remove it to test the proxy path
via `vercel dev`.

UI entry points: AI tab (agent grid → chat), Home quick actions and the disease
banner → `push({ kind: "chat", props: { agentId } })`. `AIChat.jsx` renders
streaming bubbles, markdown, history sheet (pin/export/delete), voice input,
photo attach, and the safety disclaimer.
