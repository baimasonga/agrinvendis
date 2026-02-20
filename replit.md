# AgroFlow - Agricultural Inventory & Distribution System

## Overview
AgroFlow is a React-based agricultural inventory and distribution management system. It provides a comprehensive dashboard for managing inventory, distributions, beneficiaries, field officers, fleet, routes, warehouses, and proof-of-delivery records.

## Project Architecture
- **Frontend**: React (single-page application) built with Vite
- **Styling**: Inline styles using shared style constants (`src/styles.js`) - no CSS framework
- **Entry Point**: `src/main.jsx` renders the main `App` component from `src/App.jsx`
- **Build Tool**: Vite with `@vitejs/plugin-react`
- **Port**: Dev server runs on `0.0.0.0:5000`

### Directory Structure
```
src/
  App.jsx           — Main app component (layout, sidebar, topbar, routing, modals, panels)
  main.jsx          — Entry point
  styles.js         — Shared inline style constants (S object) and style helpers
  data/
    seed.js         — Seed data, constants (CATEGORIES, STATUSES, USER_ROLES, etc.)
  utils/
    helpers.js      — Utility functions (fmtDate, catColor, healthClr, hosColor, etc.)
  hooks/
    useSyncDB.js    — Supabase sync + IndexedDB persistence hook
  components/
    ui/index.jsx    — Reusable UI components (StatusPill, Avatar, PageHead, Overlay, etc.)
  pages/
    Dashboard.jsx, OrdersPage.jsx, DispatchBoard.jsx, InventoryPage.jsx,
    FleetPage.jsx, OfficersPage.jsx, BeneficiariesPage.jsx, RoutesPage.jsx,
    WarehousesPage.jsx, PODPage.jsx, ReportsPage.jsx, ScannerPage.jsx,
    SettingsPage.jsx
```

### Key Design Decisions
- All styling uses inline styles via the shared `S` object (matching original monolithic design)
- Navigation uses Lucide React icons in sidebar, emojis in page content
- Supabase sync is optional - works offline with IndexedDB
- HMR disabled in Vite config to avoid WebSocket reconnection loops in Replit proxy
- Pages receive state/actions as props from App.jsx context object

## Running the App
```bash
npm run dev
```

## Deployment
- Static deployment using `npm run build` → outputs to `dist/`

## User Preferences
- Visual design must match the original Claude-built monolithic component exactly
- Inline styles preferred over CSS frameworks (Tailwind v4 had compatibility issues)
- Modular file structure with separation of concerns

## Recent Changes
- 2026-02-20: Complete style conversion — all components/pages now use original inline styles (S object), removed all Tailwind CSS class usage
- 2026-02-20: Modularized architecture — split 2,338-line monolithic file into 20+ modular files
- 2026-02-19: Initial Replit setup — configured Vite + React, created entry point, configured workflow and deployment
