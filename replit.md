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
- Welcome / onboarding screen with dark Palava Hub branding + new logo image
- Registration with school selection (24 Liberian universities + 52 high schools across all 15 counties — including St. Gregory Catholic, Buduburam Community, New Testament High, Stella Maris Polytechnic)
- Email-only signup/login (phone signup removed; legacy users with `phone` on their profile are still supported)
- Gold Liberia-star verification badge (PalavaStar) — `#D4A12A` / `#F1C232`
- Light/Dark/Auto theme toggle via `ThemeContext` (persists in AsyncStorage); `<ThemedStatusBar />` wrapper keeps the StatusBar text legible across themes
- Push notifications via Expo Push API (`expo-notifications` + `expo-device`) — sender's app sends pushes directly using recipient's `expoPushToken` stored on their Firestore user doc; per-channel opt-ins for messages/likes/follows/comments in Settings; no Cloud Function needed
- Mutual-follow gate on direct messaging — both users must follow each other before a brand-new chat can start; existing threads grandfathered in (UI-only gate; for hard enforcement, the Firestore rules on `conversations/{cid}/messages` create should also check that both `request.auth.uid` and the recipient appear in each other's `followingIds`)
- In-app Settings hub with Privacy Policy, Community Guidelines, Report & Help (writes to `supportRequests` Firestore collection), Logout, Delete Account
- Delete Account permanently removes Auth user + all linked Firestore data (posts, ads, supportRequests, verificationRequests, profile) — Google Play / App Store policy compliant
- Campus Jams section (filtered feed by `category == "campus_jams"` or `#CampusJams` tag); shortcut in home header
- Audio post recording via expo-av (3-min cap) with inline AudioPlayerInline player in PostCard; iOS audio mode is restored after recording
- Free ads ("Free during launch" green banner) — no payment required, posted for admin review
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
- 24 Liberian universities (University of Liberia, Cuttington, United Methodist, AME, Stella Maris Polytechnic, etc.)
- 52 Liberian high schools across all 15 counties (CWA, MCSS, BWI, Ricks Institute, St. Patrick's, St. Gregory Catholic, Buduburam Community, New Testament High, etc.)

#### Firestore Data Model
- `users/{uid}` — user profile (name, username, email, school{id,name,type,location}, bio, avatar, followers, following, posts, optional `phone` for phone-signup users — never embedded in posts)
- `posts/{postId}` — posts (author **without phone**, authorId, content, mediaUri, mediaType ∈ image|video|audio, audioDurationSec?, category ∈ general|campus_jams, likes, likedBy[], comments, shares, isPinned, isFlagged, createdAt, tags)
- `posts/{postId}/comments/{commentId}` — comments subcollection
- `conversations/{convId}/messages/{msgId}` — messages (convId = [userId1, userId2].sort().join("_"))
- `users/{uid}/conversations/{otherUid}` — conversation metadata per user
- `supportRequests/{id}` — Report & Help submissions (userId, userEmail, kind, subject, message, createdAt)
- `verificationRequests/{uid}` — verification applications (status ∈ pending|approved|rejected)
- `ads/{id}` — sponsor ads (free during launch; admin reviews before publishing)
- `reports/{id}` — Apple Guideline 1.2 user-content moderation reports (reporterId, targetType ∈ post|comment|user|message, targetId, targetUserId?, reason ∈ spam|harassment|hate_speech|violence|nudity|self_harm|misinformation|other, details, status ∈ pending|reviewed|resolved, createdAt) — admin-readable only

#### Firestore Security Rules
Rules at `firestore.rules` are the server-side enforcement layer for moderation, blocking, and integrity:
- **Reports**: only signed-in users may write; `reporterId == auth.uid` enforced; self-reporting rejected; reason enum validated server-side; admin-only read/update
- **Blocking**: `users/{uid}.blockedUserIds` writable only by `uid`; messages and conversation summaries to a target user are rejected if the writer is in their `blockedUserIds`
- **Posts**: author-only delete; counter fields (likes/likedBy/comments/shares) updatable by any signed-in user
- **Palava Room (anonymous)**: `palavaroomPosts` deliberately stores no `authorId` to preserve anonymity, so create is open to any signed-in user, update is restricted to reaction fields only (`reactions`/`wahalaBy`/`funnyBy`/`realTalkBy`/`spillBy`), and delete is admin-only
- **Messaging**: only convo participants can read/write; `fromId == auth.uid` enforced; messages immutable except `read` flag; brand-new conversations require mutual follow (`isMutualFollow` helper); existing conversations grandfathered via `hasExistingConversation` helper
- **Default deny**: any collection not explicitly allowed is closed
- **Admin**: gated via custom claim `request.auth.token.admin == true`
- **Test it**: `pnpm --filter @workspace/scripts run test:rules` — runs 33 checks against the Firestore emulator (requires JDK 21, auto-located from `/nix/store`)
- **Deploy**: `firebase deploy --only firestore:rules` (requires `firebase login` and a real project ID in `.firebaserc`)

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

## Admin Dashboard Auth

- **Authentication**: Firebase Auth (email/password) via `signInWithEmailAndPassword`. No more legacy `sc_admin_token`.
- **Authorization**: Firebase custom claim `admin: true` on the user. Both client gate (ProtectedRoute via `useAdminAuth`) and Firestore rules (`request.auth.token.admin == true`) enforce this.
- **Auth state**: Module-level `onAuthStateChanged` in `artifacts/admin/src/lib/auth.ts` with cached state + listener Set; `useAdminAuth()` hook subscribes.
- **Granting admin**: Run `pnpm --filter @workspace/scripts run grant-admin <email-or-uid>` (revoke with `--revoke`). Requires `FIREBASE_SERVICE_ACCOUNT` env var (JSON string of a service-account key from Firebase Console → Project Settings → Service accounts).
- **Reports tab** (`/reports`): Live-streams the Firestore `reports` collection with Pending/Reviewed/Resolved tabs + counts. Inspect expands the reported post inline; "Remove content" deletes the post AND resolves the report atomically via `writeBatch`. Required for App Store Apple Guideline 1.2.

## Recent Mobile Bug Fixes (Apr 2026)

User-reported issues from store-readiness testing:
1. **Media uploads silently failing** — `addPost` (FeedContext) used to swallow Storage errors and post text-only. Now re-throws; `create-post.tsx` shows friendly Alert messages for `storage/unauthorized`, `storage/quota-exceeded`, `storage/unauthenticated`. If `addDoc` fails after a successful upload, the orphaned Storage object is deleted (best-effort).
2. **Slow follow** — `followUser`/`unfollowUser` (AuthContext) parallelize the two Firestore writes via `Promise.all` and use functional `setUser((prev)=>...)` rollback on error.
3. **News feature removed** — deleted `app/news.tsx`, removed Stack.Screen registration in `_layout.tsx`, removed home-screen News button, removed Settings "News Pages" row, removed `routes/news.ts` and its registration in api-server.
4. **Twitter-style retweet** — `Post` type gained `repostedBy: string[]` and `isReposted: boolean`. New `toggleRepost(postId)` in FeedContext uses a Firestore **transaction** (idempotent on rapid double-tap) to update `shares` + `repostedBy` atomically. PostCard's repeat icon turns Twitter-green (#17BF63) when reposted. The "share to other apps" affordance moved into the 3-dot menu so we don't lose external sharing.
5. **Posting felt slow** — three changes:
   - **Image compression**: every image upload now goes through `compressImageForUpload` in `utils/uploadBlob.ts` (resize to 1600px, JPEG q=0.75 via `expo-image-manipulator`). Wired into feed posts, chat images, signup avatars, and edit-profile avatars. A 4MB camera photo becomes ~200–400KB → uploads land 5–10× faster on mobile data.
   - **Optimistic close**: `create-post.tsx` and `create-palava.tsx` now snapshot the form values, immediately `router.back()`, and run the upload + Firestore writes in the background. The new post appears in the feed via `onSnapshot` when the write lands. Errors surface as an `Alert` (which works from any screen).
   - **Parallel writes**: `addPost` runs `addDoc(posts)` and `updateDoc(users)` (post-counter bump) via `Promise.all` instead of sequentially.

## Storage Rules (`storage.rules`)

Locked down with per-folder ownership rules + size/type caps. **Must be published manually in the Firebase Console** (Storage → Rules) — same flow as `firestore.rules`. Path layout (must match upload paths in code):
- `posts/{userId}/{filename}` — public read; owner write; image ≤10MB / video ≤50MB / audio ≤15MB
- `chats/{userId}/{filename}` — signed-in read; owner write; image ≤10MB / audio ≤15MB
- `avatars/{userId}` — public read; owner write; image ≤5MB (file is named after the uid, no sub-folder)
- `pages/{userId}/{filename}` — public read; owner write; image ≤10MB
- Default deny for everything else.

## Mobile App Notes

- Do NOT use `uuid` package — use `Date.now().toString() + Math.random().toString(36).substr(2, 9)` instead
- All schools must be Liberian institutions only
- Firebase Auth uses `inMemoryPersistence` (Firebase v12 — `getReactNativePersistence` removed in v12)
- `expo-file-system@19` legacy API must be imported from `expo-file-system/legacy`
- expo-camera: v17.0.10 is the correct version for Expo SDK 54
- Fonts: Poppins (Google Fonts via @expo-google-fonts/poppins)
- Color palette: Dark Liberian theme (#0D0A08 background, #BF0A30 primary)
- `FirebaseSyncBridge` in `_layout.tsx` syncs `user.id` to FeedContext and MessagingContext `currentUserId`
