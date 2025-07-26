# Figma Design System - PRD Tool

## 1. Design System Foundation

### 1.1 Color Palette

#### Primary Colors
```css
/* Brand Primary */
--primary-900: #312E81    /* Deep indigo for headers */
--primary-800: #3730A3    /* Indigo for primary buttons */
--primary-700: #4338CA    /* Default primary color */
--primary-600: #4F46E5    /* Hover states */
--primary-500: #6366F1    /* Active states */
--primary-400: #818CF8    /* Light interactions */
--primary-300: #A5B4FC    /* Disabled states */
--primary-200: #C7D2FE    /* Subtle backgrounds */
--primary-100: #E0E7FF    /* Very light backgrounds */
--primary-50:  #EEF2FF    /* Almost white */
```

#### Neutral Colors
```css
/* Grays for text and UI */
--gray-950: #0F172A      /* Darkest text */
--gray-900: #0F172A      /* Primary text */
--gray-800: #1E293B      /* Secondary text */
--gray-700: #334155      /* Tertiary text */
--gray-600: #475569      /* Placeholder text */
--gray-500: #64748B      /* Disabled text */
--gray-400: #94A3B8      /* Borders */
--gray-300: #CBD5E1      /* Light borders */
--gray-200: #E2E8F0      /* Dividers */
--gray-100: #F1F5F9      /* Light backgrounds */
--gray-50:  #F8FAFC      /* Page backgrounds */
```

#### Semantic Colors
```css
/* Success */
--success-700: #15803D   /* Dark success */
--success-600: #16A34A   /* Success */
--success-500: #22C55E   /* Success hover */
--success-100: #DCFCE7   /* Success background */

/* Warning */
--warning-700: #B45309   /* Dark warning */
--warning-600: #D97706   /* Warning */
--warning-500: #F59E0B   /* Warning hover */
--warning-100: #FEF3C7   /* Warning background */

/* Error */
--error-700:   #B91C1C   /* Dark error */
--error-600:   #DC2626   /* Error */
--error-500:   #EF4444   /* Error hover */
--error-100:   #FEE2E2   /* Error background */

/* Info */
--info-700:    #1D4ED8   /* Dark info */
--info-600:    #2563EB   /* Info */
--info-500:    #3B82F6   /* Info hover */
--info-100:    #DBEAFE   /* Info background */
```

#### Collaboration Colors
```css
/* User presence indicators */
--user-1: #8B5CF6       /* Purple */
--user-2: #EC4899       /* Pink */
--user-3: #14B8A6       /* Teal */
--user-4: #F97316       /* Orange */
--user-5: #EF4444       /* Red */
--user-6: #84CC16       /* Lime */
--user-7: #06B6D4       /* Cyan */
--user-8: #8B5CF6       /* Violet */
```

### 1.2 Typography Scale

#### Font Family
```css
/* Primary font stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Monospace for code */
font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace;
```

#### Type Scale
```css
/* Display */
--text-display-2xl: 4.5rem;    /* 72px - Hero headings */
--text-display-xl:  3.75rem;   /* 60px - Large headings */
--text-display-lg:  3rem;      /* 48px - Page titles */
--text-display-md:  2.25rem;   /* 36px - Section titles */
--text-display-sm:  1.875rem;  /* 30px - Subsection titles */

/* Headings */
--text-xl: 1.25rem;     /* 20px - H1 */
--text-lg: 1.125rem;    /* 18px - H2 */
--text-md: 1rem;        /* 16px - H3, Body */
--text-sm: 0.875rem;    /* 14px - Small text */
--text-xs: 0.75rem;     /* 12px - Captions */

/* Line Heights */
--leading-none:    1;
--leading-tight:   1.25;
--leading-snug:    1.375;
--leading-normal:  1.5;
--leading-relaxed: 1.625;
--leading-loose:   2;
```

#### Font Weights
```css
--font-thin:       100;
--font-extralight: 200;
--font-light:      300;
--font-normal:     400;
--font-medium:     500;
--font-semibold:   600;
--font-bold:       700;
--font-extrabold:  800;
--font-black:      900;
```

### 1.3 Spacing System

#### Base Unit: 4px
```css
/* Spacing scale */
--space-0:  0;          /* 0px */
--space-1:  0.25rem;    /* 4px */
--space-2:  0.5rem;     /* 8px */
--space-3:  0.75rem;    /* 12px */
--space-4:  1rem;       /* 16px */
--space-5:  1.25rem;    /* 20px */
--space-6:  1.5rem;     /* 24px */
--space-8:  2rem;       /* 32px */
--space-10: 2.5rem;     /* 40px */
--space-12: 3rem;       /* 48px */
--space-16: 4rem;       /* 64px */
--space-20: 5rem;       /* 80px */
--space-24: 6rem;       /* 96px */
--space-32: 8rem;       /* 128px */
```

### 1.4 Border Radius
```css
--radius-none: 0;
--radius-sm:   0.125rem;  /* 2px */
--radius-md:   0.25rem;   /* 4px */
--radius-lg:   0.5rem;    /* 8px */
--radius-xl:   0.75rem;   /* 12px */
--radius-2xl:  1rem;      /* 16px */
--radius-3xl:  1.5rem;    /* 24px */
--radius-full: 9999px;    /* Full circle */
```

### 1.5 Shadows
```css
/* Elevation shadows */
--shadow-xs:  0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm:  0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Inner shadows */
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);

/* Colored shadows for focus states */
--shadow-primary: 0 0 0 3px rgba(79, 70, 229, 0.2);
--shadow-error:   0 0 0 3px rgba(239, 68, 68, 0.2);
--shadow-success: 0 0 0 3px rgba(34, 197, 94, 0.2);
```

## 2. Component Library

### 2.1 Button Components

#### Primary Button
```css
.btn-primary {
  background: var(--primary-600);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--primary-700);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary:focus {
  outline: none;
  box-shadow: var(--shadow-primary);
}

.btn-primary:disabled {
  background: var(--gray-300);
  cursor: not-allowed;
  transform: none;
}
```

#### Secondary Button
```css
.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
}

.btn-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-400);
}
```

#### Icon Button
```css
.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--gray-500);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}
```

### 2.2 Input Components

#### Text Input
```css
.input-text {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  background: white;
  transition: all 0.2s ease;
}

.input-text:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: var(--shadow-primary);
}

.input-text:disabled {
  background: var(--gray-100);
  color: var(--gray-500);
  cursor: not-allowed;
}

.input-text.error {
  border-color: var(--error-600);
}

.input-text.error:focus {
  box-shadow: var(--shadow-error);
}
```

#### Search Input
```css
.input-search {
  position: relative;
  display: flex;
  align-items: center;
}

.input-search input {
  padding-left: var(--space-10);
  background-image: url('data:image/svg+xml;utf8,<svg>...</svg>');
  background-repeat: no-repeat;
  background-position: var(--space-3) center;
}
```

### 2.3 Card Components

#### Base Card
```css
.card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--gray-200);
  overflow: hidden;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.card-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--gray-200);
}

.card-body {
  padding: var(--space-6);
}

.card-footer {
  padding: var(--space-6);
  border-top: 1px solid var(--gray-200);
  background: var(--gray-50);
}
```

#### PRD Card
```css
.prd-card {
  position: relative;
  padding: var(--space-6);
  cursor: pointer;
}

.prd-card-status {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
}

.prd-card-status.draft {
  background: var(--warning-100);
  color: var(--warning-700);
}

.prd-card-status.review {
  background: var(--info-100);
  color: var(--info-700);
}

.prd-card-status.approved {
  background: var(--success-100);
  color: var(--success-700);
}
```

### 2.4 Avatar Components

#### User Avatar
```css
.avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-200);
  color: var(--gray-600);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
}

.avatar-sm {
  width: 24px;
  height: 24px;
  font-size: var(--text-xs);
}

.avatar-lg {
  width: 48px;
  height: 48px;
  font-size: var(--text-lg);
}

.avatar-xl {
  width: 64px;
  height: 64px;
  font-size: var(--text-xl);
}
```

#### Collaboration Avatar Stack
```css
.avatar-stack {
  display: flex;
  align-items: center;
}

.avatar-stack .avatar {
  margin-left: -8px;
  border: 2px solid white;
  position: relative;
}

.avatar-stack .avatar:first-child {
  margin-left: 0;
}

.avatar-stack .avatar.online::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: var(--success-500);
  border: 2px solid white;
  border-radius: var(--radius-full);
}
```

### 2.5 Navigation Components

#### Header Navigation
```css
.header {
  height: 64px;
  background: white;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
  color: var(--gray-900);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
```

#### Breadcrumb Navigation
```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--gray-500);
}

.breadcrumb-item {
  color: var(--gray-500);
  text-decoration: none;
}

.breadcrumb-item:hover {
  color: var(--gray-700);
}

.breadcrumb-item.active {
  color: var(--gray-900);
  font-weight: var(--font-medium);
}

.breadcrumb-separator {
  color: var(--gray-400);
}
```

### 2.6 Form Components

#### Form Group
```css
.form-group {
  margin-bottom: var(--space-6);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--gray-700);
  margin-bottom: var(--space-2);
}

.form-label.required::after {
  content: '*';
  color: var(--error-600);
  margin-left: var(--space-1);
}

.form-help {
  font-size: var(--text-xs);
  color: var(--gray-500);
  margin-top: var(--space-1);
}

.form-error {
  font-size: var(--text-xs);
  color: var(--error-600);
  margin-top: var(--space-1);
}
```

#### Select Dropdown
```css
.select {
  position: relative;
  display: inline-block;
  width: 100%;
}

.select select {
  width: 100%;
  padding: var(--space-3) var(--space-10) var(--space-3) var(--space-4);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-lg);
  background: white;
  appearance: none;
  cursor: pointer;
}

.select::after {
  content: '';
  position: absolute;
  right: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid var(--gray-500);
  pointer-events: none;
}
```

## 3. Layout System

### 3.1 Grid System
```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid-cols-12 { grid-template-columns: repeat(12, 1fr); }

.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.col-span-4 { grid-column: span 4; }
.col-span-6 { grid-column: span 6; }
.col-span-8 { grid-column: span 8; }
.col-span-12 { grid-column: span 12; }
```

### 3.2 Flexbox Utilities
```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }

.flex-1 { flex: 1; }
.flex-auto { flex: auto; }
.flex-none { flex: none; }
```

## 4. Animation System

### 4.1 Transitions
```css
.transition-all { transition: all 0.2s ease; }
.transition-colors { transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease; }
.transition-opacity { transition: opacity 0.2s ease; }
.transition-transform { transition: transform 0.2s ease; }

.duration-75 { transition-duration: 75ms; }
.duration-100 { transition-duration: 100ms; }
.duration-150 { transition-duration: 150ms; }
.duration-200 { transition-duration: 200ms; }
.duration-300 { transition-duration: 300ms; }
.duration-500 { transition-duration: 500ms; }

.ease-linear { transition-timing-function: linear; }
.ease-in { transition-timing-function: cubic-bezier(0.4, 0, 1, 1); }
.ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
.ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
```

### 4.2 Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-fadeIn { animation: fadeIn 0.2s ease-out; }
.animate-slideDown { animation: slideDown 0.2s ease-out; }
.animate-slideUp { animation: slideUp 0.2s ease-out; }
.animate-pulse { animation: pulse 2s infinite; }
.animate-spin { animation: spin 1s linear infinite; }
```

## 5. Dark Mode Support

### 5.1 Dark Theme Colors
```css
[data-theme="dark"] {
  /* Background colors */
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --bg-tertiary: #334155;
  
  /* Text colors */
  --text-primary: #F1F5F9;
  --text-secondary: #CBD5E1;
  --text-tertiary: #94A3B8;
  
  /* Border colors */
  --border-primary: #334155;
  --border-secondary: #475569;
  
  /* Component backgrounds */
  --card-bg: #1E293B;
  --input-bg: #334155;
  --header-bg: #0F172A;
}
```

### 5.2 Theme Toggle Component
```css
.theme-toggle {
  position: relative;
  width: 48px;
  height: 24px;
  background: var(--gray-300);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.theme-toggle.dark {
  background: var(--primary-600);
}

.theme-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: var(--radius-full);
  transition: transform 0.2s ease;
}

.theme-toggle.dark::after {
  transform: translateX(24px);
}
```