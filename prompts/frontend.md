# Frontend Development Prompt
**Service:** `/frontend`  
**Stack:** React 18 + Vite + Tailwind CSS + Framer Motion + GSAP  
**Language:** JavaScript (no TypeScript)

> Always read `00_MASTER_PROMPT.md` first for full project context.

---

## Your Role

You are a senior UI/UX designer and frontend engineer. You build production-quality React interfaces — minimal, modern, glassmorphic, and purposeful. Every decision serves clarity and usability. You write clean component-driven code with smooth animations. The final result must feel like it was shipped by a funded SaaS company, not a student project.

---

## Folder Structure

```
/frontend
├── public/
├── src/
│   ├── assets/             Static assets, fonts, SVGs
│   ├── components/
│   │   ├── ui/             Pure reusable primitives
│   │   │   ├── Button.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Drawer.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── layout/         Shell components
│   │   │   ├── AppShell.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   └── PageWrapper.jsx
│   │   ├── chat/           Conversation UI
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── ChatBubble.jsx
│   │   │   ├── TypingIndicator.jsx
│   │   │   └── ChatInput.jsx
│   │   ├── leads/
│   │   │   ├── LeadTable.jsx
│   │   │   ├── LeadCard.jsx
│   │   │   ├── ExcelUploader.jsx
│   │   │   └── ColumnMapper.jsx
│   │   ├── campaigns/
│   │   │   ├── CampaignCard.jsx
│   │   │   └── CampaignBuilder.jsx
│   │   ├── analytics/
│   │   │   ├── StatCard.jsx
│   │   │   └── FunnelChart.jsx
│   │   └── content/
│   │       ├── CampaignGenerator.jsx
│   │       └── ContentRepurposer.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Campaigns.jsx
│   │   ├── Leads.jsx
│   │   ├── Conversations.jsx
│   │   ├── ConversationDetail.jsx
│   │   ├── ContentStudio.jsx
│   │   ├── KnowledgeBase.jsx
│   │   ├── BookingAgent.jsx
│   │   ├── Analytics.jsx
│   │   ├── Settings.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Onboarding.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useSSE.js          Real-time SSE connection
│   │   ├── useDarkMode.js
│   │   └── useHotkeys.js
│   ├── stores/
│   │   ├── authStore.js       Zustand
│   │   ├── activityStore.js   Live activity feed
│   │   └── uiStore.js         Sidebar collapsed, theme
│   ├── services/
│   │   ├── api.js             Axios instance with interceptors
│   │   ├── leads.js
│   │   ├── campaigns.js
│   │   ├── conversations.js
│   │   └── kb.js
│   ├── utils/
│   │   ├── formatters.js      Date, number, phone formatting
│   │   ├── validators.js      Phone, email validation
│   │   └── cn.js              clsx + tailwind-merge utility
│   ├── styles/
│   │   ├── globals.css        CSS variables, base styles
│   │   └── animations.css     CSS keyframes (pulse, shimmer)
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Design Language — Glassmorphism + Slate & Iris

### Core Philosophy
- **Glassmorphism** — frosted glass surfaces, backdrop blur, translucent panels
- **Slate & Iris** — cool gray base with iris/indigo accent
- **Minimal yet alive** — whitespace-driven layout with purposeful motion
- **Senior finish** — every pixel intentional, no default browser styles visible

### Color Tokens

```css
/* styles/globals.css */
:root {
  /* Backgrounds */
  --bg-page:         #F0F2F5;
  --bg-glass:        rgba(255, 255, 255, 0.65);
  --bg-glass-strong: rgba(255, 255, 255, 0.85);
  --bg-surface:      rgba(255, 255, 255, 0.5);
  --bg-elevated:     rgba(255, 255, 255, 0.95);

  /* Borders */
  --border-glass:    rgba(255, 255, 255, 0.4);
  --border-subtle:   rgba(226, 228, 233, 0.8);
  --border-strong:   rgba(200, 205, 214, 0.9);

  /* Text */
  --text-primary:    #1F2532;
  --text-secondary:  #6B7280;
  --text-muted:      #9EA3AE;

  /* Accent — Iris */
  --accent:          #5E6AD2;
  --accent-light:    rgba(94, 106, 210, 0.12);
  --accent-hover:    #4F5BBF;
  --accent-text:     #3D47B0;

  /* Semantic */
  --success:         #16A34A;
  --success-bg:      rgba(22, 163, 74, 0.1);
  --warning:         #D97706;
  --warning-bg:      rgba(217, 119, 6, 0.1);
  --danger:          #DC2626;
  --danger-bg:       rgba(220, 38, 38, 0.1);

  /* Glass blur */
  --blur-sm:  blur(8px);
  --blur-md:  blur(16px);
  --blur-lg:  blur(24px);

  /* Shadows */
  --shadow-glass: 0 4px 24px rgba(31, 37, 50, 0.08), 0 1px 2px rgba(31, 37, 50, 0.04);
  --shadow-float: 0 8px 32px rgba(31, 37, 50, 0.12), 0 2px 8px rgba(31, 37, 50, 0.06);
  --shadow-card:  0 2px 12px rgba(31, 37, 50, 0.06), 0 1px 3px rgba(31, 37, 50, 0.04);
}

/* Dark mode */
.dark {
  --bg-page:         #0D1117;
  --bg-glass:        rgba(22, 27, 34, 0.7);
  --bg-glass-strong: rgba(22, 27, 34, 0.9);
  --bg-surface:      rgba(31, 37, 50, 0.5);
  --bg-elevated:     rgba(31, 37, 50, 0.95);

  --border-glass:    rgba(255, 255, 255, 0.06);
  --border-subtle:   rgba(42, 48, 64, 0.8);
  --border-strong:   rgba(58, 65, 85, 0.9);

  --text-primary:    #E8EAF0;
  --text-secondary:  #8B92A5;
  --text-muted:      #555D6E;

  --accent:          #7B86E8;
  --accent-light:    rgba(123, 134, 232, 0.15);
  --accent-hover:    #8F99EE;
  --accent-text:     #A8B0F0;

  --shadow-glass: 0 4px 24px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-float: 0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-card:  0 2px 12px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.15);
}
```

### Page Background
The page background must have a subtle gradient mesh — not flat gray:
```css
body {
  background-color: var(--bg-page);
  background-image:
    radial-gradient(at 20% 20%, rgba(94, 106, 210, 0.08) 0px, transparent 50%),
    radial-gradient(at 80% 80%, rgba(94, 106, 210, 0.05) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(148, 163, 184, 0.04) 0px, transparent 60%);
  min-height: 100vh;
}
```

---

## Typography — Geist + Inter

```html
<!-- index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600&display=swap" rel="stylesheet">
```

```bash
# Also install Geist for headings — from Vercel
npm i geist
```

```css
/* styles/globals.css */
@import 'geist/dist/geist.css';

:root {
  --font-display: 'Geist', 'Inter', sans-serif;  /* headings, stats, logo */
  --font-body:    'Inter', sans-serif;            /* body, labels, tables */
  --font-mono:    'Geist Mono', 'Fira Code', monospace; /* code, IDs, phones */
}

body { font-family: var(--font-body); }
h1, h2, h3, .stat-value, .logo { font-family: var(--font-display); }
```

### Type Scale
```css
.text-xs   { font-size: 11px; line-height: 1.4; }  /* timestamps, meta */
.text-sm   { font-size: 13px; line-height: 1.5; }  /* table content, labels */
.text-base { font-size: 14px; line-height: 1.6; }  /* body */
.text-md   { font-size: 15px; line-height: 1.5; font-weight: 500; } /* card titles */
.text-lg   { font-size: 18px; line-height: 1.4; font-weight: 600; } /* section headings */
.text-xl   { font-size: 22px; line-height: 1.3; font-weight: 600; } /* page titles */
.text-2xl  { font-size: 28px; line-height: 1.2; font-weight: 600; font-family: var(--font-display); }
.text-3xl  { font-size: 36px; line-height: 1.1; font-weight: 600; font-family: var(--font-display); }
```

**Rules:**
- Letter spacing: `-0.02em` on display sizes (2xl, 3xl), `0` on body
- Stat numbers: `font-variant-numeric: tabular-nums`
- Never above `font-weight: 600`

---

## Layout — Floating Glass Shell

### App Shell
```
Page bg (gradient mesh)
  ├── Floating Sidebar (glass, fixed left)
  └── Content Area
        ├── Floating Topbar (glass, sticky top)
        └── Page Content (scrollable)
```

### Floating Sidebar
```css
.sidebar {
  position: fixed;
  left: 12px; top: 12px; bottom: 12px;
  width: 220px;          /* expanded */
  /* collapsed: 56px */

  background: var(--bg-glass-strong);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--border-glass);
  border-radius: 18px;
  box-shadow: var(--shadow-float);

  padding: 16px 10px;
  z-index: 40;
  overflow: hidden;
  transition: width 280ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Floating Topbar
```css
.topbar {
  position: sticky;
  top: 12px;
  margin: 12px 12px 0 244px;  /* 220px sidebar + 12px gap + 12px page margin */

  background: var(--bg-glass);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--border-glass);
  border-radius: 14px;
  box-shadow: var(--shadow-glass);

  padding: 10px 20px;
  z-index: 30;
  display: flex; align-items: center; justify-content: space-between;
}
```

### Glass Cards
```css
.card {
  background: var(--bg-glass);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--border-glass);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  padding: 20px 24px;
  transition: box-shadow 200ms ease, transform 200ms ease, border-color 200ms ease;
}
.card:hover {
  box-shadow: var(--shadow-float);
  transform: translateY(-2px);
  border-color: var(--border-strong);
}
```

---

## Component Specs

### Buttons
```jsx
// Primary
<button className="
  bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium
  hover:bg-accent-hover active:scale-[0.97]
  transition-all duration-150 shadow-sm
">

// Secondary (glass)
<button className="
  bg-[var(--bg-glass)] backdrop-blur-sm
  border border-[var(--border-glass)]
  text-[var(--text-primary)] px-4 py-2 rounded-lg text-sm font-medium
  hover:bg-[var(--bg-glass-strong)] hover:border-[var(--border-subtle)]
  transition-all duration-150
">

// Ghost (icon only)
<button className="
  p-2 rounded-lg text-[var(--text-secondary)]
  hover:bg-[var(--accent-light)] hover:text-accent
  transition-all duration-150
">
```

### Status Badges
```jsx
const variants = {
  qualified: 'bg-accent/10 text-accent-text border border-accent/20',
  nurturing: 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
  hot:       'bg-danger/10 text-danger border border-danger/20',
  converted: 'bg-success/10 text-success border border-success/20',
  cold:      'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]',
}
// Base: text-[11px] font-medium px-2 py-0.5 rounded-md
```

### Glass Input
```css
.input {
  background: var(--bg-surface);
  backdrop-filter: var(--blur-sm);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 150ms, box-shadow 150ms;
  width: 100%;
}
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}
```

### Chat Bubbles (Intercom style)
```css
/* Agent bubble */
.bubble-agent {
  background: var(--bg-glass-strong);
  backdrop-filter: var(--blur-sm);
  border: 1px solid var(--border-glass);
  border-radius: 4px 16px 16px 16px;
  padding: 10px 14px;
  max-width: 75%;
  align-self: flex-start;
  font-size: 13px;
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
}

/* Lead bubble */
.bubble-lead {
  background: var(--accent-light);
  border: 1px solid rgba(94, 106, 210, 0.2);
  border-radius: 16px 4px 16px 16px;
  padding: 10px 14px;
  max-width: 75%;
  align-self: flex-end;
  font-size: 13px;
  color: var(--text-primary);
}

/* Human rep bubble */
.bubble-human {
  background: var(--accent);
  border-radius: 16px 4px 16px 16px;
  padding: 10px 14px;
  max-width: 75%;
  align-self: flex-end;
  font-size: 13px;
  color: #fff;
}
```

---

## Animation Strategy

### Lane Split
```
Framer Motion → mount/unmount, sidebar, modals, drawers, route transitions, gestures
GSAP          → scroll-driven, stagger, count-up, timelines, typing indicator
CSS           → infinite loops (pulse, shimmer), hover transforms
```

### Key Animations

**1. Route transitions (Framer)**
```jsx
// PageWrapper.jsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -6 }}
  transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
/>
```

**2. Staggered card entry (GSAP)**
```js
gsap.fromTo(cardsRef.current,
  { opacity: 0, y: 20 },
  { opacity: 1, y: 0, stagger: 0.08, duration: 0.4,
    ease: 'power2.out', clearProps: 'transform' }
);
```

**3. Count-up stats (GSAP)**
```js
const obj = { val: 0 };
gsap.to(obj, {
  val: targetValue, duration: 1.4, ease: 'power2.out',
  onUpdate: () => { ref.current.textContent = Math.round(obj.val).toLocaleString('en-IN'); }
});
```

**4. Scroll-driven reveals (GSAP ScrollTrigger)**
```js
gsap.registerPlugin(ScrollTrigger);
gsap.fromTo('.reveal-row',
  { opacity: 0, y: 14 },
  { opacity: 1, y: 0, stagger: 0.05, duration: 0.3,
    scrollTrigger: { trigger: '.table-wrapper', start: 'top 85%', once: true } }
);
```

**5. Typing indicator (GSAP)**
```js
const tl = gsap.timeline({ repeat: -1 });
tl.to('.dot-1', { y: -5, duration: 0.25 })
  .to('.dot-1', { y: 0, duration: 0.2 })
  .to('.dot-2', { y: -5, duration: 0.25 }, '-=0.3')
  .to('.dot-2', { y: 0, duration: 0.2 })
  .to('.dot-3', { y: -5, duration: 0.25 }, '-=0.3')
  .to('.dot-3', { y: 0, duration: 0.2 });
```

**6. Sidebar collapse (Framer)**
```jsx
<motion.aside animate={{ width: collapsed ? 56 : 220 }}
  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}>
  <AnimatePresence>{!collapsed && <motion.span
    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
  >{label}</motion.span>}</AnimatePresence>
</motion.aside>
```

**7. Glass card hover (CSS)**
```css
.card { transition: transform 200ms ease, box-shadow 200ms ease; }
.card:hover { transform: translateY(-2px); box-shadow: var(--shadow-float); }
```

**8. Hot lead pulse (CSS)**
```css
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
  70%  { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
  100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
}
.hot-badge { animation: pulse-ring 1.8s ease infinite; }
```

**9. Skeleton shimmer (CSS)**
```css
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}
.skeleton {
  background: linear-gradient(90deg,
    rgba(241,242,244,0.8) 25%,
    rgba(226,228,233,0.9) 50%,
    rgba(241,242,244,0.8) 75%);
  background-size: 1200px 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: 8px;
}
```

**10. Campaign launch timeline (GSAP)**
```js
const tl = gsap.timeline();
tl.to('.launch-btn', { scale: 0.96, duration: 0.1 })
  .to('.launch-btn', { scale: 1, duration: 0.15 })
  .to('.launch-icon', { rotation: 360, duration: 0.4, ease: 'power2.inOut' })
  .fromTo('.launch-success', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25 }, '-=0.1');
```

---

## Excel Upload Flow (Critical Feature)

```jsx
// ExcelUploader.jsx
import * as XLSX from 'xlsx';

const handleFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const wb = XLSX.read(e.target.result, { type: 'binary' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = rows[0];    // first row = column names
    const data = rows.slice(1); // rest = lead rows
    setColumns(headers);
    setPreviewData(data.slice(0, 5)); // show 5 row preview
    setStep('mapping');
  };
  reader.readAsBinaryString(file);
};
```

```jsx
// ColumnMapper.jsx — step 2
// Show each required field (Name, Phone) with a dropdown
// Business selects which Excel column maps to each field
// Show 5-row live preview that updates as mapping changes
// "Custom fields" section — map any extra columns to lead profile

const requiredFields = ['name', 'phone'];
const optionalFields = ['email', 'company', 'city', 'source'];
```

---

## UX Rules

1. **Optimistic updates** — never show spinner for user-triggered state changes
2. **Contextual empty states** — every empty page has illustration + explanation + CTA
3. **Micro-copy** — "Launch Campaign" not "Submit", "Take Over" not "Activate"
4. **Persistent filters** — store filter/sort state in URL params via useSearchParams
5. **Keyboard shortcuts** — Esc closes modals/drawers, N = new campaign, T = take over
6. **Skeleton loading** — never spinners for page/list data loading
7. **Toast notifications** — slide in from top-right, specific messages not generic "Success"
8. **Activity feed** — live SSE feed on dashboard showing what AI is doing right now
9. **Dark mode** — toggle in topbar, persisted to localStorage, respects system preference
10. **Reduced motion** — check `prefers-reduced-motion`, disable GSAP if true

---

## Libraries

```bash
npm i react-router-dom framer-motion gsap
npm i zustand @tanstack/react-query axios
npm i lucide-react recharts
npm i xlsx                          # Excel parsing
npm i react-dropzone                # file drag-and-drop
npm i @radix-ui/react-dialog
npm i @radix-ui/react-tooltip
npm i @radix-ui/react-dropdown-menu
npm i @radix-ui/react-select
npm i clsx tailwind-merge
npm i geist
```

---

## Do NOT Do

- No gradients on buttons
- No box-shadow heavier than `--shadow-float`
- No `border-radius` above `18px`
- No `font-weight` above `600`
- No pure `#000` or pure `#fff` — use token values
- No layout shift during loading — use skeletons
- No horizontal scroll on any page
- No more than 2 accent colors visible simultaneously
- No animation duration above `400ms`
- No `langchain_community` in any Python code