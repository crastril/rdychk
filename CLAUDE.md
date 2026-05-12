## Commands

```bash
npm run dev        # Dev server on port 3000
npm run build      # Production build
npx tsc --noEmit   # Type check (run from repo root)
```

## Architecture

Next.js 15 App Router + React 19 + TypeScript + Supabase (project ID: `uxbysuticqecwovyzten`)

```
app/
  group/[slug]/      # Main group page (group-client.tsx is the core component)
  page.tsx           # Home/landing
components/
  tabs/              # HomeTab, LocationTab, DateTab, ReadyTab
  OnboardingModal    # 3-slide carousel, shown once per user (localStorage: rdychk_onboarded)
  auth-button        # isRemote prop switches theme
  ShareMenu          # isRemote prop switches theme
public/onboarding/   # slide-1.jpg, slide-2.jpg, slide-3.jpg
```

## Two-Theme System

Every component accepts `isRemote?: boolean` to switch visual style:
- **Neo-brutalist** (in-person): `border: '2-3px solid #000'`, `boxShadow: 'Npx Npx 0 #000'`, `fontFamily: 'var(--font-barlow-condensed)'`, primary color `var(--v2-primary)` (~red)
- **Cyberpunk** (remote): `border: '1px solid rgba(168,85,247,0.X)'`, monospace font, purple `#a855f7`

Never use shadcn `Button` inside group pages — use raw `<button>` with inline styles to stay on-theme.

## Group Phase Logic

`group.mode: 'planning' | 'day-of'` — stored in DB, toggleable by admin only.

## Environment

Requires `.env.local` with Supabase keys. Vercel auto-deploys from GitHub main branch.
