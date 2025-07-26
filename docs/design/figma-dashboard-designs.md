# Dashboard Interface Designs - PRD Tool

## 1. Main Dashboard Layout

### 1.1 Dashboard Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header (64px height)                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────────┬─────────────────────────────────────────────────────┐   │
│ │ Sidebar         │ Main Content Area                                   │   │
│ │ (280px width)   │                                                     │   │
│ │                 │ ┌─────────────────────────────────────────────────┐ │   │
│ │ • Projects      │ │ Welcome Section                                 │ │   │
│ │ • Recent PRDs   │ │                                                 │ │   │
│ │ • Starred       │ └─────────────────────────────────────────────────┘ │   │
│ │ • Templates     │                                                     │   │
│ │                 │ ┌─────────────────────────────────────────────────┐ │   │
│ │ Quick Actions:  │ │ Quick Stats Grid                                │ │   │
│ │ [+ New PRD]     │ │                                                 │ │   │
│ │ [+ Project]     │ └─────────────────────────────────────────────────┘ │   │
│ │                 │                                                     │   │
│ │ Recent Activity │ ┌─────────────────────────────────────────────────┐ │   │
│ │ • John edited   │ │ Recent PRDs Table                               │ │   │
│ │ • Sarah created │ │                                                 │ │   │
│ │ • AI generated  │ └─────────────────────────────────────────────────┘ │   │
│ └─────────────────┴─────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Header Component Design

### 2.1 Header Layout Specifications
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────┬─────────────────────────┬─────────────────────────────┐ │
│ │ Left Section    │ Center Section          │ Right Section               │ │
│ │                 │                         │                             │ │
│ │ ┌─────┐ Breadcrumb Navigation           │ ┌─────┬─────┬─────┬─────────┐│ │
│ │ │Logo │ Home > Projects > Mobile App    │ │🔍  │ 🔔  │ ⚙️  │ Profile ││ │
│ │ └─────┘                                 │ │     │     │     │ Avatar  ││ │
│ │                                         │ └─────┴─────┴─────┴─────────┘│ │
│ └─────────────────┴─────────────────────────┴─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Header Component Details

#### Logo Section
- **Logo**: 32x32px company logo
- **Product Name**: "PRD Tool" in medium weight, 18px
- **Color**: Primary gray-900 for text

#### Breadcrumb Navigation
- **Style**: Home > Projects > Current Project
- **Typography**: 14px, medium weight for current page
- **Color**: Gray-500 for links, Gray-900 for current
- **Interactive**: Clickable breadcrumb items

#### Search Bar (Global)
- **Width**: 320px expandable to 480px on focus
- **Placeholder**: "Search PRDs, projects, or people..."
- **Features**: 
  - Autocomplete dropdown
  - Recent searches
  - Keyboard shortcuts (Cmd+K)

#### Right Actions
```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────────────────────────────────┐ │
│ │ 🔍  │ │ 🔔  │ │ ⚙️  │ │ ┌─────┐ John Doe        ▼   │ │
│ │     │ │ •3  │ │     │ │ │ JD  │ Product Owner       │ │
│ │     │ │     │ │     │ │ └─────┘ john@company.com    │ │
│ └─────┘ └─────┘ └─────┘ └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 3. Sidebar Design

### 3.1 Sidebar Layout
```
┌─────────────────────────────────────┐
│ Navigation Menu                     │
├─────────────────────────────────────┤
│ 🏠 Dashboard                        │
│ 📁 Projects                    >    │
│ 📄 Recent PRDs                      │
│ ⭐ Starred Items                     │
│ 📋 Templates                        │
├─────────────────────────────────────┤
│ Quick Actions                       │
│ ┌─────────────────────────────────┐ │
│ │ + New PRD                       │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ + New Project                   │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Recent Activity                     │
│                                     │
│ ┌─────┐ John updated               │
│ │ JD  │ "Auth PRD"                 │
│ └─────┘ 2 min ago                  │
│                                     │
│ ┌─────┐ AI generated               │
│ │ 🤖  │ user stories               │
│ └─────┘ 5 min ago                  │
│                                     │
│ ┌─────┐ Sarah approved             │
│ │ SS  │ "Payment PRD"              │
│ └─────┘ 10 min ago                 │
│                                     │
│ [View All Activity]                 │
├─────────────────────────────────────┤
│ Team & Integrations                 │
│ 👥 Team Members (12)                │
│ 🔗 Jira Integration ✓               │
│ 💬 Slack Connected ✓                │
│ 📊 Craft.io Linked ✓               │
└─────────────────────────────────────┘
```

### 3.2 Projects Expandable Section
```
📁 Projects                    ▼
├── 🔐 Authentication API (5 PRDs)
│   ├── User Login PRD
│   ├── OAuth Integration PRD
│   └── Password Reset PRD
├── 📱 Mobile App (12 PRDs)
│   ├── Onboarding Flow PRD
│   ├── Push Notifications PRD
│   └── Offline Mode PRD
└── 📊 Analytics Platform (8 PRDs)
    ├── Dashboard PRD
    ├── Reports PRD
    └── Data Export PRD
```

## 4. Main Content Area

### 4.1 Welcome Section
```
┌───────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Good morning, John! 👋                                                  │ │
│ │                                                                         │ │
│ │ You have 3 PRDs awaiting your review and 2 new AI suggestions.         │ │
│ │                                                                         │ │
│ │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐│ │
│ │ │[Review PRDs]    │ │[View Suggestions]│ │[Create New PRD]            ││ │
│ │ └─────────────────┘ └─────────────────┘ └─────────────────────────────┘│ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Quick Stats Grid
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Quick Stats                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │
│ │ 📄 Total    │ │ ⏰ In       │ │ ✅ Approved │ │ 🤖 AI Generations   │ │
│ │    PRDs     │ │    Review   │ │    PRDs     │ │    This Month       │ │
│ │             │ │             │ │             │ │                     │ │
│ │    47       │ │     3       │ │     12      │ │        156          │ │
│ │ +5 this week│ │ +1 today    │ │ +2 today    │ │     +23 this week   │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Recent PRDs Table
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Recent PRDs                                                    [View All] │
├─────────────────────────────────────────────────────────────────────────────┤
│ Title                    │ Project      │ Status   │ Updated    │ Actions   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🔐 SSO Integration PRD   │ Auth API     │ 🟡 Review│ 2h ago     │ [Edit]    │
│    v1.2.0               │              │          │ by Sarah   │ [View]    │
│    [👤3] [💬5]          │              │          │            │           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📱 Push Notifications   │ Mobile App   │ 🟢 Draft │ Yesterday  │ [Edit]    │
│    v1.0.0               │              │          │ by Mike    │ [View]    │
│    [👤1] [💬2]          │              │          │            │           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 💳 Payment Gateway      │ E-commerce   │ ✅ Approved│ 3d ago   │ [View]    │
│    v2.1.0               │              │          │ by Lisa    │ [Export]  │
│    [👤4] [💬12]         │              │          │            │           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📊 Analytics Dashboard  │ Analytics    │ 🟡 Review│ 1w ago     │ [Edit]    │
│    v1.5.0               │              │          │ by John    │ [View]    │
│    [👤2] [💬8]          │              │          │            │           │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5. Interactive Elements

### 5.1 Status Indicators
```css
/* Status badges with specific colors */
.status-draft {
  background: #FEF3C7;    /* Warning background */
  color: #92400E;         /* Warning text */
  border: 1px solid #F9A8D4;
}

.status-review {
  background: #DBEAFE;    /* Info background */
  color: #1E40AF;         /* Info text */
  border: 1px solid #93C5FD;
}

.status-approved {
  background: #D1FAE5;    /* Success background */
  color: #065F46;         /* Success text */
  border: 1px solid #A7F3D0;
}
```

### 5.2 Collaboration Indicators
```
┌─────────────────────────────────────────────────────────────┐
│ Collaboration Metrics                                       │
├─────────────────────────────────────────────────────────────┤
│ [👤3] - 3 active collaborators                             │
│ ┌───┐ ┌───┐ ┌───┐                                          │
│ │JD │ │SS │ │MJ │                                          │
│ └───┘ └───┘ └───┘                                          │
│                                                             │
│ [💬5] - 5 unread comments                                  │
│ [✏️] - Currently being edited                              │
│ [👁️] - View-only mode                                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Action Buttons
```
┌─────────────────────────────────────────────────────────────┐
│ PRD Actions                                                 │
├─────────────────────────────────────────────────────────────┤
│ Primary Actions:                                            │
│ ┌─────────┐ ┌─────────┐ ┌─────────────────────────────────┐│
│ │  Edit   │ │  View   │ │             Share               ││
│ └─────────┘ └─────────┘ └─────────────────────────────────┘│
│                                                             │
│ Secondary Actions (Dropdown):                               │
│ • Duplicate PRD                                             │
│ • Export to PDF                                             │
│ • Sync with Jira                                            │
│ • Archive PRD                                               │
│ • Delete PRD                                                │
└─────────────────────────────────────────────────────────────┘
```

## 6. Responsive Behavior

### 6.1 Desktop (1280px+)
- Sidebar: 280px fixed width
- Main content: Flexible width
- 3-column layout for stats grid
- Full table with all columns

### 6.2 Tablet (768px - 1280px)
- Sidebar: Collapsible overlay
- Main content: Full width
- 2-column layout for stats grid
- Condensed table view

### 6.3 Mobile (< 768px)
- Sidebar: Hidden, hamburger menu
- Main content: Full width
- 1-column layout for stats grid
- Card-based PRD list instead of table

## 7. Loading States

### 7.1 Dashboard Loading
```
┌─────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ░░░░░░░░░░░░░░░░░░░░░░                                     │
│                                                             │
│ ░░░░░░░░░░░░  ░░░░░░░░░░░░  ░░░░░░░░░░░░  ░░░░░░░░░░░░     │
│ ░░░░░░░░░    ░░░░░░░░░░    ░░░░░░░░░░    ░░░░░░░░░░       │
│ ░░░░░░░░     ░░░░░░░░      ░░░░░░░░      ░░░░░░░░         │
│                                                             │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Empty States
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    📄                                       │
│                                                             │
│               No PRDs yet                                   │
│                                                             │
│        Get started by creating your first                  │
│        Product Requirements Document                        │
│                                                             │
│         ┌─────────────────────────────────┐                │
│         │        Create Your First PRD    │                │
│         └─────────────────────────────────┘                │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 8. Search and Filters

### 8.1 Advanced Search Modal
```
┌─────────────────────────────────────────────────────────────┐
│ Advanced Search                                        ✕    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Search PRDs, projects, people...                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Filters:                                                    │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│ │Project: All ▼│ │Status: All ▼│ │Date Range: All Time    ▼││
│ └─────────────┘ └─────────────┘ └─────────────────────────┘│
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│ │Author: All  ▼│ │Type: All   ▼│ │Has Comments: All       ▼││
│ └─────────────┘ └─────────────┘ └─────────────────────────┘│
│                                                             │
│ Recent Searches:                                            │
│ • "authentication requirements"                             │
│ • "mobile app user stories"                                 │
│ • "payment gateway specifications"                          │
│                                                             │
│         ┌─────────┐        ┌─────────────────────┐         │
│         │ Cancel  │        │      Search         │         │
│         └─────────┘        └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Search Results View
```
┌─────────────────────────────────────────────────────────────┐
│ Search Results for "authentication"                   [✕]   │
├─────────────────────────────────────────────────────────────┤
│ Found 12 results in 0.23 seconds                           │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔐 SSO Integration PRD                              95% │ │
│ │ Authentication API Project • Updated 2h ago             │ │
│ │ ...OAuth2 authentication with SSO providers including │ │ │
│ │ Okta and Azure AD for seamless user authentication... │ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔑 User Authentication PRD                          87% │ │
│ │ Mobile App Project • Updated yesterday                  │ │
│ │ ...multi-factor authentication support for mobile     │ │ │
│ │ applications with biometric authentication options... │ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Load More Results]                                         │
└─────────────────────────────────────────────────────────────┘
```

This comprehensive dashboard design provides a clean, modern interface that prioritizes user productivity while maintaining visual hierarchy and accessibility standards. The design system ensures consistency across all components while providing flexibility for future enhancements.