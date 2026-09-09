# Expense Tracker

A minimal, production-ready expense tracking application built with React, Vite, and Tailwind CSS.

## Features

- **Beautiful Dashboard** — See your monthly spending at a glance with animated progress bars
- **Quick Add** — Large, touch-friendly input for fast expense logging
- **Timeframe Filtering** — View expenses by Today, Week, Month, or Year
- **Spending Heatmap** — GitHub-style activity visualization for the last 30 days
- **Category Analytics** — Bar chart showing your top spending categories
- **Budget Warnings** — Visual alerts when you approach your spending limit
- **Smooth Animations** — Framer Motion page transitions and micro-interactions
- **PWA Ready** — Works offline with service worker support
- **Responsive Design** — Optimized for mobile with desktop support

## Tech Stack

- **React 18** — UI library
- **Vite** — Build tool and dev server
- **Tailwind CSS** — Utility-first styling
- **React Router** — Client-side routing
- **Framer Motion** — Animations
- **Recharts** — Data visualization
- **date-fns** — Date manipulation
- **Lucide React** — Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Clone or extract the project
cd expense-tracker

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment

The `dist` folder after `npm run build` is ready for any static hosting:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag `dist` folder to deploy
- **GitHub Pages**: Use `gh-pages` branch with `dist`
- **Firebase Hosting**: `firebase deploy`
- **AWS S3**: Upload `dist` contents
- **Any CDN**: Just upload the `dist` folder

## Project Structure

```
expense-tracker/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── ConfirmModal.jsx
│   │   ├── Dropdown.jsx
│   │   ├── ExpenseList.jsx
│   │   ├── SpendingChart.jsx
│   │   └── SpendingHeatmap.jsx
│   ├── hooks/
│   │   └── useLocalStorage.js
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx          # Main app with routes
│   ├── main.jsx         # Entry point
│   └── index.css        # Tailwind directives
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .eslintrc.cjs
```

## Data Storage

All data is stored in `localStorage`:
- `syncSpend_expenses` — Array of expense objects
- `syncSpend_settings` — Budget and configuration

No backend required. Data persists across sessions.

## License

MIT — feel free to use, modify, and share.
