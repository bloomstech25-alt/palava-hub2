# Workspace

## Overview

pnpm workspace monorepo using TypeScript. **Palava Hub** — a Liberian student social networking platform. Includes a mobile app (Expo), a Super Admin web dashboard (React + Vite), and a shared API server (Express 5). Auth, feed, and messaging are fully backed by **Firebase** (Auth + Firestore + Storage). Schools are managed in PostgreSQL via Drizzle ORM.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Primary database**: Firebase Firestore (users, posts, messages)
- **Secondary database**: PostgreSQL + Drizzle ORM (schools only)
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage (avatars, media)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo SDK 54 (React Native) with Expo Router
- **Admin web**: React + Vite + Tailwind + shadcn/ui + wouter

## Firebase Configuration

- **Project ID**: `palava-hub`
- **API Key**: `AIzaSyBWD7hvFeO6rp3bTB-pmzJ-ViwvWII6Ds0`
- **Auth Domain**: `palava-hub.firebaseapp.com`
- **Storage Bucket**: `palava-hub.firebasestorage.app`
- **Firestore DB ID**: `default` — ALWAYS use `getFirestore(app, "default")`, NOT `getFirestore(app)` or `"(default)"`
- **Service Account**: `/home/runner/workspace/attached_assets/Pasted--type-service-account-project-id-palava-hub-private-key_1776162803962.txt`
- **Env var**: `GOOGLE_APPLICATION_CREDENTIALS` set to service account file path (development); `FIREBASE_SERVICE_ACCOUNT` JSON string for production deployment

## Artifacts

### Palava Hub Mobile App (`artifacts/mobile`)
- **Type**: Expo mobile app (SDK 54)
- **Preview path**: `/`
- **Framework**: Expo + React Native + Expo Router

#### Features
- Welcome / onboarding screen with dark Palava Hub branding
- Registration with school selection (12 Liberian universities + 15 senior high schools)
- Login / authentication via Firebase Auth
- Global social feed with real-time Firestore posts, likes, follows, reposts
- Image long-press: save to camera roll or share externally
- Share button: Repost within Palava Hub or share to other apps
- Explore screen with trending posts, school browser, people search
- Post detail with real-time Firestore comments (subcollection `posts/{id}/comments`)
- Create post with media (images/video), tag support, Firebase Storage upload
- Direct messaging via Firestore (conversations subcollection per user)
- Notification center with unread badge
- User profiles with followers/following stats
- Go Live camera screen (requires native Expo Go for camera access; web shows "Open in Expo Go" message)
- Create Page / Brand Pages
- Ads system via AdsContext
- **Palava Room** — anonymous 24-hour confessions wall (🔥 tab); posts stored in `palavaroomPosts` Firestore collection; 4 emoji reactions (Wahala/Funny/Real Talk/Spill More); posts auto-expire after 24 hours; only school name shown (100% anonymous)

#### Key Files
- `app/_layout.tsx` — root layout with all providers + FirebaseSyncBridge (syncs userId to FeedContext/MessagingContext)
- `lib/firebase.ts` — Firebase app, auth, db (Firestore), storage exports
- `context/AuthContext.tsx` — Firebase Auth + Firestore user profiles
- `context/FeedContext.tsx` — real-time feed via Firestore onSnapshot, SCHOOLS_LIST
- `context/MessagingContext.tsx` — real-time messaging via Firestore
- `context/AdsContext.tsx` — ads system
- `components/PostCard.tsx` — post card with like/share/repost/long-press image save
- `constants/colors.ts` — design tokens (dark Liberian palette)
- `app/welcome.tsx` — landing/onboarding screen
- `app/login.tsx` / `app/register.tsx` — auth screens
- `app/(tabs)/palava-room.tsx` — Palava Room anonymous feed (real-time, 24h expiry)
- `app/create-palava.tsx` — create anonymous palava post (modal, 300 char limit, prompt suggestions)
- `app.json` — camera + media library permissions declared

#### Schools (Liberian Only)
All schools in `SCHOOLS_LIST` (FeedContext.tsx) are exclusively Liberian institutions:
- 12 Liberian universities (University of Liberia, Cuttington, United Methodist, AME, etc.)
- 15 Liberian senior high schools (CWA, MCSS, BWI, Ricks Institute, St. Patrick's, etc.)

#### Firestore Data Model
- `users/{uid}` — user profile (name, username, email, school{id,name,type,location}, bio, avatar, followers, following, posts)
- `posts/{postId}` — posts (author, authorId, content, mediaUri, mediaType, likes, likedBy[], comments, shares, isPinned, isFlagged, createdAt, tags)
- `posts/{postId}/comments/{commentId}` — comments subcollection
- `conversations/{convId}/messages/{msgId}` — messages (convId = [userId1, userId2].sort().join("_"))
- `users/{uid}/conversations/{otherUid}` — conversation metadata per user

### Palava Hub Admin Dashboard (`artifacts/admin`)
- **Type**: React + Vite web app
- **Preview path**: `/admin/`
- **Framework**: React + Vite + Tailwind + shadcn/ui + wouter
- **Port**: 23744

#### Features
- Secure admin login (username: `admin`, password: `studentconnect2024`)
- Dashboard with live stats from Firestore (users, posts) + PostgreSQL (schools)
- Schools management — list, add, edit, delete Liberian schools (PostgreSQL)
- User management — list, search, filter; ban/unban (Firestore + Firebase Auth)
- Content moderation — list, search posts; flag/pin/delete (Firestore)
- Protected routes (redirects to /login if not authenticated)
- Palava Hub branding with Liberian flag colors

#### Key Files
- `src/App.tsx` — router + auth protection + layout
- `src/pages/login.tsx` — admin login page
- `src/pages/dashboard.tsx` — platform stats overview
- `src/pages/schools.tsx` — school CRUD
- `src/pages/users.tsx` — user management (ban/unban)
- `src/pages/posts.tsx` — content moderation (flag/delete/pin)
- `src/lib/firebase.ts` — Firebase client SDK for admin (same project config)
- `src/lib/auth.ts` — token management (localStorage)

### API Server (`artifacts/api-server`)
- **Type**: Express 5 REST API
- **Port**: 8080
- **Base path**: `/api`

#### Routes
- `GET /api/healthz` — health check
- `POST /api/admin/login` — admin authentication
- `GET /api/admin/stats` — platform statistics (Firestore + PostgreSQL)
- `GET/POST /api/schools` — list and create schools (PostgreSQL)
- `GET/PUT/DELETE /api/schools/:id` — individual school management (PostgreSQL)
- `GET /api/users` — list users from Firestore (filterable)
- `POST /api/users/:id/ban` / `POST /api/users/:id/unban` — Firestore + Firebase Auth disable
- `DELETE /api/users/:id` — delete user from Firestore + Auth
- `GET /api/posts` — list posts from Firestore (filterable)
- `DELETE /api/posts/:id` — delete post from Firestore
- `POST /api/posts/:id/flag` — flag post in Firestore
- `POST /api/posts/:id/pin` — toggle pin in Firestore

#### Key Files
- `src/lib/firebase-admin.ts` — Firebase Admin SDK (reads from FIREBASE_SERVICE_ACCOUNT JSON env or GOOGLE_APPLICATION_CREDENTIALS file path)
- `src/routes/admin.ts` — stats + login (Firestore + PostgreSQL)
- `src/routes/users.ts` — user management via Firestore Admin SDK
- `src/routes/posts.ts` — post management via Firestore Admin SDK
- `src/routes/schools.ts` — schools via PostgreSQL/Drizzle

## Database Schema (PostgreSQL — Schools Only)

Tables:
- `schools` — Liberian institutions (id, name, type, location, county, user_count)

Schema files: `lib/db/src/schema/`

## API Spec

OpenAPI spec: `lib/api-spec/openapi.yaml`
Generated hooks: `lib/api-client-react/src/generated/`
Generated Zod schemas: `lib/api-zod/src/generated/`

To regenerate after spec changes: `pnpm --filter @workspace/api-spec run codegen`

## Mobile App Notes

- Do NOT use `uuid` package — use `Date.now().toString() + Math.random().toString(36).substr(2, 9)` instead
- All schools must be Liberian institutions only
- Firebase Auth uses `inMemoryPersistence` (Firebase v12 — `getReactNativePersistence` removed in v12)
- `expo-file-system@19` legacy API must be imported from `expo-file-system/legacy`
- expo-camera: v17.0.10 is the correct version for Expo SDK 54
- Fonts: Poppins (Google Fonts via @expo-google-fonts/poppins)
- Color palette: Dark Liberian theme (#0D0A08 background, #BF0A30 primary)
- `FirebaseSyncBridge` in `_layout.tsx` syncs `user.id` to FeedContext and MessagingContext `currentUserId`
