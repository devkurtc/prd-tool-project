# UI/UX Design Mockups - PRD Tool

## 1. Design System

### 1.1 Color Palette
```css
/* Primary Colors */
--primary-600: #4F46E5;    /* Indigo - Primary actions */
--primary-500: #6366F1;    /* Hover states */
--primary-100: #E0E7FF;    /* Backgrounds */

/* Neutral Colors */
--gray-900: #111827;       /* Text primary */
--gray-700: #374151;       /* Text secondary */
--gray-500: #6B7280;       /* Text muted */
--gray-200: #E5E7EB;       /* Borders */
--gray-100: #F3F4F6;       /* Backgrounds */

/* Semantic Colors */
--green-500: #10B981;      /* Success */
--yellow-500: #F59E0B;     /* Warning */
--red-500: #EF4444;        /* Error */
--blue-500: #3B82F6;       /* Info */

/* Collaboration Colors */
--user-1: #8B5CF6;         /* Purple */
--user-2: #EC4899;         /* Pink */
--user-3: #14B8A6;         /* Teal */
--user-4: #F97316;         /* Orange */
```

### 1.2 Typography
```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Type Scale */
--text-xs: 0.75rem;        /* 12px */
--text-sm: 0.875rem;       /* 14px */
--text-base: 1rem;         /* 16px */
--text-lg: 1.125rem;       /* 18px */
--text-xl: 1.25rem;        /* 20px */
--text-2xl: 1.5rem;        /* 24px */
--text-3xl: 1.875rem;      /* 30px */
```

## 2. Main Application Layout

### 2.1 Dashboard View
```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 🏠 Platform / Projects                     [Search] [+ New PRD]  │ │
│ │ John Doe ▼                                          🔔 ⚙️ 👤     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌───────────────┬───────────────────────────────────────────────┐ │
│ │ Projects      │ Recent PRDs                                    │ │
│ │               │ ┌─────────────────────────────────────────────┐ │
│ │ 📁 Auth API   │ │ 📄 SSO Integration PRD                     │ │
│ │   └ 5 PRDs    │ │ Updated 2 hours ago by Sarah              │ │
│ │               │ │ Status: In Review • v1.2.0                │ │
│ │ 📁 Mobile App │ │ [👤 3] [💬 5] [✏️ Edit] [👁️ View]        │ │
│ │   └ 12 PRDs   │ └─────────────────────────────────────────────┘ │
│ │               │                                                 │ │
│ │ 📁 Analytics  │ ┌─────────────────────────────────────────────┐ │
│ │   └ 8 PRDs    │ │ 📄 Push Notifications PRD                  │ │
│ │               │ │ Updated yesterday by Mike                 │ │
│ │ [+ Project]   │ │ Status: Draft • v1.0.0                    │ │
│ │               │ │ [👤 1] [💬 2] [✏️ Edit] [👁️ View]        │ │
│ └───────────────┴───────────────────────────────────────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 📊 Activity Feed                                               │ │
│ │ • Sarah is editing "SSO Integration PRD"                      │ │
│ │ • AI generated user stories for "Push Notifications"          │ │
│ │ • Mike approved "Payment Gateway PRD" v2.1.0                  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 PRD Editor View
```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ← Back  SSO Integration PRD                                      │ │
│ │ v1.2.0 [Draft ▼] [🟢 John] [👁️ Sarah] [👁️ Mike] [Share] [⋮]    │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌────────────────┬──────────────────────────────────┬────────────┐ │
│ │ Outline        │ Document                         │ AI Assistant│ │
│ │                │                                  │             │ │
│ │ ▼ Summary      │ # SSO Integration PRD            │ 💬 John:    │ │
│ │ ▼ Problem      │                                  │ "Add OAuth2"│ │
│ │ ▼ User Stories │ ## Executive Summary             │             │ │
│ │   • Story 1    │ Enable seamless authentication   │ 🤖 AI:      │ │
│ │   • Story 2    │ for B2B customers through SSO    │ Generating..│ │
│ │ ▶ Technical    │ providers including Okta and     │ ▓▓▓░░ 60%   │ │
│ │ ▶ Metrics      │ Azure AD...                      │             │ │
│ │                │                                  │ 💬 Sarah:   │ │
│ │ [+ Section]    │ ## Problem Statement             │ "@diagram"  │ │
│ │                │ Current authentication requires  │             │ │
│ │                │ separate credentials for each    │ [Type here] │ │
│ │                │ customer, causing friction...    │             │ │
│ │                │                                  │             │ │
│ │                │ ```mermaid                       │ History:    │ │
│ │                │ sequenceDiagram                  │ • Added     │ │
│ │                │   User->>App: Login             │   security  │ │
│ │                │   App->>SSO: SAML Request       │ • Updated   │ │
│ │                │   SSO->>User: Auth              │   metrics   │ │
│ │                │ ```                              │             │ │
│ └────────────────┴──────────────────────────────────┴────────────┘ │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ 💾 Auto-saved 30s ago  |  📝 2 unsaved changes  |  ⏱️ 2:30 left │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Component Designs

### 3.1 AI Assistant Panel
```
┌─────────────────────────┐
│ AI Assistant        ⚙️ X │
├─────────────────────────┤
│ Commands:               │
│ @update - Modify section│
│ @diagram - Create chart │
│ @metrics - Add KPIs     │
│ @review - Check quality │
├─────────────────────────┤
│ Current Context:        │
│ Section: User Stories   │
│ PRD: SSO Integration    │
├─────────────────────────┤
│ 💬 John (2 min ago):    │
│ "Add support for OAuth2 │
│ authorization flow"      │
│                         │
│ 🤖 AI Response:         │
│ I'll add OAuth2 support │
│ to the technical specs: │
│                         │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░ 70%    │
│                         │
│ ### OAuth2 Flow         │
│ - Authorization code    │
│ - PKCE support for SPA  │
│ - Token refresh...      │
├─────────────────────────┤
│ 💬 Type your prompt...  │
│                    Send │
└─────────────────────────┘
```

### 3.2 Version History Panel
```
┌──────────────────────────────┐
│ Version History          < > │
├──────────────────────────────┤
│ 📝 Current (unsaved)         │
│ 3 changes by John, Sarah     │
│ [Save as v1.3.0]             │
├──────────────────────────────┤
│ ✅ v1.2.0 - 2 hours ago      │
│ Added OAuth2 and SCIM        │
│ by John • AI assisted        │
│ [View] [Compare] [Restore]   │
├──────────────────────────────┤
│ 📄 v1.1.0 - Yesterday        │
│ Initial SSO requirements     │
│ by Sarah                     │
│ [View] [Compare] [Restore]   │
├──────────────────────────────┤
│ 📄 v1.0.0 - 3 days ago       │
│ First draft                  │
│ by Mike                      │
│ [View] [Compare]             │
└──────────────────────────────┘
```

### 3.3 Real-time Collaboration Indicators
```
┌─────────────────────────────────────┐
│ Active Collaborators                │
├─────────────────────────────────────┤
│ 🟢 John (editing)                   │
│   └ Working on: Technical Specs     │
│                                     │
│ 👁️ Sarah (viewing)                  │
│   └ Reading: User Stories           │
│                                     │
│ 👁️ Mike (viewing)                   │
│   └ Reviewing: Metrics              │
│                                     │
│ 🤖 Lisa (AI prompting)              │
│   └ Generating: Diagrams            │
└─────────────────────────────────────┘
```

## 4. Mobile Responsive Design

### 4.1 Mobile Editor View
```
┌─────────────────┐
│ ≡  SSO PRD   ⋮ │
├─────────────────┤
│ [Editor] [AI] ▼ │
├─────────────────┤
│ # SSO Integration│
│                 │
│ ## Summary      │
│ Enable seamless │
│ authentication..│
│                 │
│ ## Problem      │
│ Current login   │
│ requires...     │
│                 │
├─────────────────┤
│ 👥 3 active     │
├─────────────────┤
│ 💬 Ask AI...    │
└─────────────────┘
```

### 4.2 Mobile AI Panel
```
┌─────────────────┐
│ < AI Assistant  │
├─────────────────┤
│ Recent:         │
│                 │
│ "Add OAuth2"    │
│ ✓ Completed     │
│                 │
│ "Create diagram"│
│ ⏳ In progress  │
├─────────────────┤
│ 💬 Type here... │
│           Send  │
└─────────────────┘
```

## 5. Interactive States

### 5.1 Loading States
```
Document Loading:
┌─────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░  │
│ ░░░░░░░░░░░░░░░░       │
│ ░░░░░░░░░░░░░░░░░░░    │
│ ░░░░░░░░░░░             │
└─────────────────────────┘

AI Generating:
┌─────────────────────────┐
│ 🤖 AI is thinking...    │
│ ▓▓▓▓▓░░░░░ 50%         │
└─────────────────────────┘
```

### 5.2 Error States
```
┌─────────────────────────┐
│ ⚠️ Connection Lost      │
│ Attempting to reconnect │
│ Your changes are saved  │
│ locally.               │
│ [Retry] [Work Offline] │
└─────────────────────────┘
```

### 5.3 Success States
```
┌─────────────────────────┐
│ ✅ PRD Saved           │
│ Version 1.3.0 created  │
│ [View Changes] [Share] │
└─────────────────────────┘
```

## 6. Accessibility Features

### 6.1 Keyboard Navigation
- `Tab` - Navigate between sections
- `Ctrl/Cmd + S` - Save document
- `Ctrl/Cmd + /` - Open AI assistant
- `Ctrl/Cmd + K` - Command palette
- `Esc` - Close panels/modals

### 6.2 Screen Reader Support
```html
<!-- Semantic HTML structure -->
<main role="main" aria-label="PRD Editor">
  <nav role="navigation" aria-label="Document outline">
  <section role="region" aria-label="Document content">
  <aside role="complementary" aria-label="AI Assistant">
</main>

<!-- Live regions for updates -->
<div aria-live="polite" aria-label="Save status">
  Auto-saved 30 seconds ago
</div>

<div aria-live="assertive" aria-label="Collaboration updates">
  Sarah started editing Technical Specs
</div>
```

### 6.3 Focus Indicators
```css
/* Clear focus states */
:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Skip to content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--primary-600);
  color: white;
  padding: 8px;
  text-decoration: none;
}

.skip-link:focus {
  top: 0;
}
```

## 7. Animation and Transitions

### 7.1 Micro-interactions
```css
/* Smooth transitions */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Hover effects */
.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Loading animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 2s infinite;
}
```

### 7.2 Page Transitions
```javascript
// Framer Motion transitions
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
}

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
}
```

## 8. Dark Mode Support

### 8.1 Color Scheme
```css
[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --text-primary: #F1F5F9;
  --text-secondary: #CBD5E1;
  --border: #334155;
}
```

### 8.2 Dark Mode Toggle
```
┌──────────────┐
│ ☀️ Light     │
│ 🌙 Dark      │
│ 💻 System    │
└──────────────┘
```