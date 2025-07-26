# Mobile Responsive Design - PRD Tool

## 1. Responsive Breakpoints

### 1.1 Breakpoint System
```css
/* Breakpoint definitions */
--breakpoint-xs: 375px;   /* Mobile portrait */
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet portrait */
--breakpoint-lg: 1024px;  /* Tablet landscape */
--breakpoint-xl: 1280px;  /* Desktop */
--breakpoint-2xl: 1536px; /* Large desktop */

/* Media queries */
@media (max-width: 639px) { /* Mobile */ }
@media (min-width: 640px) and (max-width: 767px) { /* Mobile landscape */ }
@media (min-width: 768px) and (max-width: 1023px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

### 1.2 Layout Adaptation Strategy
```
Desktop (1280px+)     Tablet (768px-1023px)    Mobile (375px-639px)
┌─────────────────┐   ┌─────────────────────┐   ┌─────────────────┐
│ [Sidebar][Main] │   │ [≡][Main Content]   │   │ [≡] PRD Tool    │
│ [      Main]    │   │ [              ]    │   │ ┌─────────────┐ │
│ [    Content]   │   │ [     Tablet    ]   │   │ │   Mobile    │ │
│ [           ]   │   │ [     Layout    ]   │   │ │   Optimized │ │
│ [    Three  ]   │   │ [           ]   │   │   │ │   Interface │ │
│ [    Panel  ]   │   │ [Two Panel] │   │   │   │ │             │ │
│ [   Layout  ]   │   │ [Layout]    │   │   │   │ │   Single    │ │
│ [           ]   │   │ [      ]    │   │   │   │ │   Panel     │ │
│ [   [AI]    ]   │   │ [   [⚡]    ]   │   │   │ │   Layout    │ │
└─────────────────┘   └─────────────────────┘   └─────────────────┘
```

## 2. Mobile Dashboard Design

### 2.1 Mobile Dashboard Layout
```
┌─────────────────────────────────────┐
│ ≡  PRD Tool              [🔔] [👤] │ ← Header (56px)
├─────────────────────────────────────┤
│ 👋 Good morning, John!              │
│ 3 PRDs awaiting review              │
├─────────────────────────────────────┤
│ Quick Stats                    [>]  │
│ ┌─────────┬─────────┬─────────┐    │
│ │ 📄 47   │ ⏰ 3    │ ✅ 12   │    │
│ │ Total   │ Review  │ Done    │    │
│ │ PRDs    │         │         │    │
│ └─────────┴─────────┴─────────┘    │
├─────────────────────────────────────┤
│ Recent PRDs                    [>]  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔐 SSO Integration PRD          │ │
│ │ Auth API • Review • 2h ago      │ │
│ │ [👤3] [💬5] Sarah               │ │
│ │               [Edit] [View]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📱 Push Notifications          │ │
│ │ Mobile • Draft • Yesterday      │ │
│ │ [👤1] [💬2] Mike                │ │
│ │               [Edit] [View]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💳 Payment Gateway              │ │
│ │ E-commerce • Approved • 3d ago  │ │
│ │ [👤4] [💬12] Lisa               │ │
│ │               [View] [Export]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All PRDs]                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ + Create New PRD                │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 2.2 Mobile Navigation Menu
```
┌─────────────────────────────────────┐
│ Navigation Menu                  [×]│
├─────────────────────────────────────┤
│ ┌─────┐ John Doe                    │
│ │ JD  │ Product Owner               │
│ └─────┘ john@company.com            │
├─────────────────────────────────────┤
│ 🏠 Dashboard                        │
│ 📁 Projects                    (12) │
│ 📄 My PRDs                     (23) │
│ ⭐ Starred Items                (7) │
│ 💬 Comments                    (5)  │
│ 🔔 Notifications               (3)  │
├─────────────────────────────────────┤
│ Recent Projects:                    │
│ • 🔐 Authentication API             │
│ • 📱 Mobile App                     │
│ • 💳 E-commerce Platform            │
│                                     │
│ [View All Projects]                 │
├─────────────────────────────────────┤
│ Quick Actions:                      │
│ ┌─────────────────────────────────┐ │
│ │ + New PRD                       │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Search PRDs                  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ⚙️ Settings                         │
│ 🔗 Integrations                     │
│ 📊 Analytics                        │
│ 🚪 Sign Out                         │
└─────────────────────────────────────┘
```

### 2.3 Mobile Project View
```
┌─────────────────────────────────────┐
│ ← Authentication API           [⋮]  │
├─────────────────────────────────────┤
│ 📊 Project Overview                 │
│ 5 PRDs • 3 active • 2 approved     │
│                                     │
│ Team: [👤] [👤] [👤] +2             │
│ Last activity: 2 hours ago          │
├─────────────────────────────────────┤
│ Filter: [All] [Draft] [Review] [✓]  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔐 SSO Integration              │ │
│ │ 🟡 In Review • v1.2.0           │ │
│ │                                 │ │
│ │ Updated 2h ago by Sarah         │ │
│ │ 👥 3 collaborators • 💬 5 comments │ │
│ │                                 │ │
│ │ [✏️ Edit] [👁️ View] [📤 Share]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔑 User Authentication          │ │
│ │ 🟢 Draft • v1.0.0               │ │
│ │                                 │ │
│ │ Updated yesterday by Mike       │ │
│ │ 👥 1 collaborator • 💬 2 comments  │ │
│ │                                 │ │
│ │ [✏️ Edit] [👁️ View] [📤 Share]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Load More PRDs]                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ + Create New PRD                │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 3. Mobile PRD Editor

### 3.1 Mobile Editor Interface
```
┌─────────────────────────────────────┐
│ ← SSO Integration PRD          [⋮]  │
│ v1.2.0 • Draft                      │
├─────────────────────────────────────┤
│ View: [📝 Edit] [👁️ Preview] [🤖 AI] │
├─────────────────────────────────────┤
│ # SSO Integration PRD               │
│                                     │
│ ## Executive Summary                │
│                                     │
│ Enable seamless authentication for  │
│ B2B customers through SSO providers │
│ including Okta and Azure AD.        │
│                                     │
│ ### Key Benefits                    │
│ • Reduced password fatigue          │
│ • Enhanced security                 │
│ • Improved user experience          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 AI suggests:                 │ │
│ │ Add specific metrics for user    │ │
│ │ adoption and security            │ │
│ │ [✅ Accept] [❌ Dismiss]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ## Problem Statement                │
│                                     │
│ Current authentication requires...  │
│                                     │
│ [Scroll for more content...]        │
├─────────────────────────────────────┤
│ 💾 Auto-saved 30s ago    [≡] [🔍]   │
└─────────────────────────────────────┘
```

### 3.2 Mobile Editor Toolbar
```
┌─────────────────────────────────────┐
│ Formatting Toolbar              [×] │
├─────────────────────────────────────┤
│ Text Styles:                        │
│ [H1] [H2] [H3] [Bold] [Italic]      │
│                                     │
│ Lists:                              │
│ [• Bullet] [1. Number] [☑️ Task]    │
│                                     │
│ Insert:                             │
│ [🔗 Link] [📊 Table] [📈 Diagram]   │
│                                     │
│ AI Tools:                           │
│ [🤖 AI Assist] [🎯 User Story]      │
│                                     │
│ Quick Actions:                      │
│ [📷 Image] [📎 File] [@Mention]     │
│                                     │
│ [Apply] [Cancel]                    │
└─────────────────────────────────────┘
```

### 3.3 Mobile Section Navigation
```
┌─────────────────────────────────────┐
│ Document Sections              [×]  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 📝 Executive Summary         ✓  │ │
│ │ 127 words • Complete            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ❓ Problem Statement         ✓  │ │
│ │ 89 words • Complete             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👥 User Stories              ⚠️  │ │ ← Currently editing
│ │ 45 words • Needs acceptance     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔧 Technical Requirements     ⏳ │ │
│ │ Draft • AI suggestions pending  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📊 Success Metrics            ❌ │ │
│ │ Missing • Required section      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Progress: ▓▓▓▓▓▓░░ 75%              │
│                                     │
│ [+ Add Section]                     │
└─────────────────────────────────────┘
```

## 4. Mobile AI Assistant

### 4.1 Mobile AI Chat Interface
```
┌─────────────────────────────────────┐
│ ← AI Assistant                 [⚙️] │
├─────────────────────────────────────┤
│ Quick Commands:                     │
│ [@update] [@diagram] [@metrics]     │
│ [@review] [@suggest] [@improve]     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 💬 You (2 min ago):             │ │
│ │ Add OAuth2 support to tech      │ │
│ │ requirements                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 AI:                          │ │
│ │ I'll add OAuth2 specifications  │ │
│ │ to the technical section:       │ │
│ │                                 │ │
│ │ ### OAuth2 Integration          │ │
│ │ - Authorization code flow       │ │
│ │ - PKCE support for SPAs         │ │
│ │ - Token refresh mechanism       │ │
│ │                                 │ │
│ │ [✅ Accept] [✏️ Edit] [❌ Reject] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎤 Voice input or type...        │ │
│ │                          [Send] │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Suggestions:                        │
│ • Add security requirements         │
│ • Generate success metrics          │
│ • Create user flow diagram          │
└─────────────────────────────────────┘
```

### 4.2 Mobile Voice Input
```
┌─────────────────────────────────────┐
│ Voice Input                    [×]  │
├─────────────────────────────────────┤
│           ┌─────────┐                │
│           │    🎤   │                │
│           │ Listening │              │
│           │ ●●●●●●● │                │
│           └─────────┘                │
│                                     │
│ "Add user story for password reset  │
│ functionality with email            │
│ verification..."                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔄 Processing... 94% confidence  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [✅ Send to AI] [✏️ Edit] [🔄 Retry] │
│                                     │
│ Voice Commands:                     │
│ • "Add section"                     │
│ • "Update requirements"             │
│ • "Generate diagram"                │
│ • "Review document"                 │
└─────────────────────────────────────┘
```

### 4.3 Mobile AI Suggestions Panel
```
┌─────────────────────────────────────┐
│ AI Suggestions                 [×]  │
├─────────────────────────────────────┤
│ Based on your current work:         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎯 High Priority                │ │
│ │ Missing Success Metrics         │ │
│ │ Your PRD needs measurable       │ │
│ │ success criteria                │ │
│ │ [Add Metrics] [Later]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📊 Content Improvement          │ │
│ │ Enhance User Stories            │ │
│ │ Add edge cases and error        │ │
│ │ scenarios                       │ │
│ │ [Enhance] [Examples]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎨 Visual Enhancement           │ │
│ │ Add Architecture Diagram        │ │
│ │ Visualize OAuth2 token flow     │ │
│ │ [Generate] [Templates]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [View All Suggestions] [Dismiss]    │
└─────────────────────────────────────┘
```

## 5. Mobile Collaboration Features

### 5.1 Mobile Active Users
```
┌─────────────────────────────────────┐
│ Who's Here                     [×]  │
├─────────────────────────────────────┤
│ Currently Active (3):               │
│                                     │
│ ┌─────┐ John Doe (You)              │
│ │ 🟢  │ Editing: Technical Specs    │
│ │ JD  │ Last seen: Now              │
│ └─────┘                             │
│                                     │
│ ┌─────┐ Sarah Smith                 │
│ │ 👁️  │ Viewing: User Stories       │
│ │ SS  │ Last seen: 30s ago          │
│ └─────┘                             │
│                                     │
│ ┌─────┐ Mike Johnson                │
│ │ 💬  │ Adding comment              │
│ │ MJ  │ Last seen: 1m ago           │
│ └─────┘                             │
│                                     │
│ Recently Active (1):                │
│ ┌─────┐ Lisa Chen                   │
│ │ 🔸  │ Left 5 minutes ago          │
│ │ LC  │                             │
│ └─────┘                             │
│                                     │
│ [Follow User] [Mention] [Share]     │
└─────────────────────────────────────┘
```

### 5.2 Mobile Comments Interface
```
┌─────────────────────────────────────┐
│ Comments                       [×]  │
├─────────────────────────────────────┤
│ Filter: [All (5)] [Open (3)] [Mine] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🔥 Technical Architecture       │ │
│ │ Mike: Should we use Node.js?    │ │
│ │ 3 replies • 2h ago • Line 45   │ │
│ │ [Reply] [Jump to] [Resolve]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📊 Success Metrics              │ │
│ │ Lisa: What about adoption?      │ │
│ │ 1 reply • 1h ago • Line 78     │ │
│ │ [Reply] [Jump to] [Resolve]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Security Requirements        │ │
│ │ Alex: Need CSRF protection      │ │
│ │ 0 replies • 30m ago • Line 92  │ │
│ │ [Reply] [Jump to] [Resolve]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ + Add Comment                   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 5.3 Mobile Comment Thread
```
┌─────────────────────────────────────┐
│ ← Comment Thread                   │
├─────────────────────────────────────┤
│ Technical Architecture • Line 45    │
│ "Should we use Node.js instead?"    │
├─────────────────────────────────────┤
│ ┌─────┐ Mike Johnson - 2h ago       │
│ │ MJ  │ Should we consider using    │
│ └─────┘ Node.js instead of Java for │
│         better performance?         │
│         [Reply] [👍 2] [❤️ 1]        │
│                                     │
│   ┌─────┐ Sarah Smith - 1h ago      │
│   │ SS  │ Good point! Node.js would │
│   └─────┘ integrate better with our │
│           existing microservices.   │
│           What do you think @john?  │
│           [Reply] [👍 2]             │
│                                     │
│     ┌─────┐ John Doe - 30m ago      │
│     │ JD  │ Agreed! Let me update   │
│     └─────┘ the tech stack section. │
│             I'll also add benchmarks│
│             [Edit] [👍 1]            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💭 Your reply...         [🎤]   │ │
│ │                    [📎] [Send]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [✅ Resolve Thread] [📌 Pin] [🔗 Share] │
└─────────────────────────────────────┘
```

## 6. Mobile Notifications

### 6.1 Mobile Notification Center
```
┌─────────────────────────────────────┐
│ ← Notifications                 [⚙️] │
├─────────────────────────────────────┤
│ 🔴 3 new notifications              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 💬 New mention                  │ │
│ │ Sarah mentioned you in SSO PRD  │ │
│ │ "What do you think @john?"      │ │
│ │ 2 min ago                       │ │
│ │ [Reply] [View] [Dismiss]        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🤖 AI suggestion ready          │ │
│ │ New user stories generated      │ │
│ │ for authentication flow         │ │
│ │ 5 min ago                       │ │
│ │ [Review] [Accept] [Dismiss]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✅ PRD approved                 │ │
│ │ Payment Gateway PRD v2.0        │ │
│ │ ready for development           │ │
│ │ 1h ago                          │ │
│ │ [View] [Export] [Share]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Earlier:                            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📊 Weekly report available      │ │
│ │ Your team's insights are ready  │ │
│ │ 9:00 AM                         │ │
│ │ [View] [Download]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Mark All Read] [Clear All]         │
└─────────────────────────────────────┘
```

### 6.2 Mobile Push Notification
```
┌─────────────────────────────────────┐
│ iPhone Notification Preview         │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ PRD Tool                 2m ago │ │
│ │ 💬 New mention in SSO PRD       │ │
│ │ Sarah: "What do you think about │ │
│ │ this approach @john?"           │ │
│ │                                 │ │
│ │ [Reply] [View] [Dismiss]        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 7. Mobile Gestures and Interactions

### 7.1 Touch Gestures
```
┌─────────────────────────────────────┐
│ Mobile Gesture Guide                │
├─────────────────────────────────────┤
│ Navigation:                         │
│ • Swipe left: Back to previous page │
│ • Swipe right: Forward/Menu         │
│ • Pull down: Refresh content        │
│ • Pull up: Load more content        │
│                                     │
│ Editor Interactions:                │
│ • Double tap: Select word           │
│ • Triple tap: Select paragraph      │
│ • Long press: Context menu          │
│ • Pinch: Zoom in/out (preview)      │
│                                     │
│ Comment Actions:                    │
│ • Swipe left: Reply quickly         │
│ • Swipe right: Resolve comment      │
│ • Long press: Comment options       │
│                                     │
│ AI Assistant:                       │
│ • Voice button: Hold to speak       │
│ • Shake device: Undo AI action      │
│ • Force touch: Preview suggestions  │
└─────────────────────────────────────┘
```

### 7.2 Accessibility Features
```
┌─────────────────────────────────────┐
│ Mobile Accessibility                │
├─────────────────────────────────────┤
│ Voice Control:                      │
│ ✅ Voice navigation support         │
│ ✅ Voice dictation for content      │
│ ✅ Voice commands for AI            │
│                                     │
│ Screen Reader:                      │
│ ✅ VoiceOver/TalkBack optimization  │
│ ✅ Semantic headings and landmarks  │
│ ✅ Alt text for all images          │
│                                     │
│ Motor Accessibility:                │
│ ✅ Large touch targets (44px min)   │
│ ✅ Gesture alternatives             │
│ ✅ One-handed mode support          │
│                                     │
│ Visual Accessibility:               │
│ ✅ High contrast mode               │
│ ✅ Dynamic text sizing              │
│ ✅ Dark mode support                │
│ ✅ Reduced motion respect           │
│                                     │
│ Cognitive Accessibility:            │
│ ✅ Simple navigation patterns       │
│ ✅ Clear error messages             │
│ ✅ Progress indicators              │
│ ✅ Consistent interactions          │
└─────────────────────────────────────┘
```

This comprehensive mobile responsive design ensures that the PRD Tool provides a fully functional and optimized experience across all device sizes, maintaining productivity and collaboration capabilities while adapting to mobile interaction patterns.