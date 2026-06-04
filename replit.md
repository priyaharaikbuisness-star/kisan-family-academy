# Kisan Family Academy

A Firebase-powered online learning platform for apple farmers in India. Students sign in with Google, get manually approved by admin, and then access the full "Kisan Family Pro" course content with anti-piracy watermarks.

## Run & Operate

- `pnpm --filter @workspace/kisan-academy run dev` — run the frontend (Vite, port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui
- Auth: Firebase Google Sign-In
- Database: Firestore
- Push Notifications: Firebase Cloud Messaging
- PWA: vite-plugin-pwa + Workbox
- Routing: wouter
- Animations: framer-motion

## Where things live

- `artifacts/kisan-academy/` — main React + Vite PWA frontend
- `artifacts/kisan-academy/src/lib/firebase.ts` — Firebase initialization
- `artifacts/kisan-academy/src/contexts/AuthContext.tsx` — auth + Firestore user management
- `artifacts/kisan-academy/src/pages/` — all screens
- `artifacts/kisan-academy/src/pages/admin/` — admin panel screens
- `attached_assets/` — brand logos (Kisan Academy + Priya Haraik)

## Firebase Config (env vars — VITE_ prefix)

All set as shared env vars. See Secrets tab:
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID
- VITE_ADMIN_EMAILS (comma-separated)

## Admin Emails

- haraikpriya@gmail.com
- priyaharaikbuisness@gmail.com
- uditsharmas9736@gmail.com

## Architecture decisions

- Firebase-only backend: no Express server needed for core functionality; Firestore handles all data, Firebase Auth handles identity
- Admin access is determined client-side by checking email against VITE_ADMIN_EMAILS — suitable for low-risk admin operations
- Anti-piracy watermark: floating moving overlay on YouTube embeds showing masked email + timestamp
- YouTube unlisted embeds via youtube-nocookie.com iframe (no tracking)
- PWA with Workbox caching for offline thumbnail/metadata support
- Access flow: Google Sign-In → auto-create Firestore user doc (pending) → manual admin approval → course access

## Product

Kisan Family Pro course with 5+ categories of apple farming videos:
- Basics of Apple Farming
- Disease Management
- Nutrition Management
- Canopy Management
- Natural Farming

Features: video player with watermark, progress tracking, certificate requests, Q&A discussion, admin panel for student/video/notification management.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- FCM push notifications require server-side Firebase Admin SDK for broadcast; client-side can only subscribe to topics
- YouTube embeds require firebase-approved domain in Firebase Auth settings
- vite-plugin-pwa requires icons at public/icons/icon-192.png and icon-512.png
- Firebase VITE_ env vars must be prefixed with VITE_ to be available in the browser bundle
- Always run `pnpm --filter @workspace/kisan-academy add <pkg>` to install new packages (not npm/yarn)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
