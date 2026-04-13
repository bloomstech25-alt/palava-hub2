# Workspace

## Overview

pnpm workspace monorepo using TypeScript. StudentConnect — a Liberian student social networking platform. Includes a mobile app (Expo), a Super Admin web dashboard (React + Vite), and a shared API server (Express 5 + PostgreSQL).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo (React Native) with Expo Router
- **Admin web**: React + Vite + Tailwind + shadcn/ui + wouter

## Artifacts

### StudentConnect Mobile App (`artifacts/mobile`)
- **Type**: Expo mobile app
- **Preview path**: `/`
- **Framework**: Expo + React Native + Expo Router

#### Features
- Welcome / onboarding screen with blue gradient branding
- Registration with school selection (12 Liberian universities + 15 senior high schools)
- Login / authentication (stored via AsyncStorage)
- Global social feed with posts, likes, follows
- Explore screen with trending posts, school browser, people search
- Post detail with comments
- Create post with tag support
- Notification center with unread badge
- User profiles with followers/following stats

#### Key Files
- `app/_layout.tsx` — root layout with AuthProvider, FeedProvider, QueryClient
- `app/(tabs)/_layout.tsx` — tab bar (Feed, Explore, Activity, Profile)
- `context/AuthContext.tsx` — auth state + AsyncStorage persistence
- `context/FeedContext.tsx` — feed state, posts, notifications, comments, SCHOOLS_LIST
- `constants/colors.ts` — design tokens (deep blue palette)
- `app/welcome.tsx` — landing/onboarding screen
- `app/login.tsx` / `app/register.tsx` — auth screens

#### Schools (Liberian Only)
All schools in `SCHOOLS_LIST` (FeedContext.tsx) are exclusively Liberian institutions:
- 12 Liberian universities (University of Liberia, Cuttington, United Methodist, AME, etc.)
- 15 Liberian senior high schools (CWA, MCSS, BWI, Ricks Institute, St. Patrick's, etc.)

### StudentConnect Admin Dashboard (`artifacts/admin`)
- **Type**: React + Vite web app
- **Preview path**: `/admin/`
- **Framework**: React + Vite + Tailwind + shadcn/ui + wouter
- **Port**: 23744

#### Features
- Secure admin login (username: `admin`, password: `studentconnect2024`)
- Dashboard with platform-wide stats (users, posts, schools, banned, flagged)
- Schools management — list, add, edit, delete Liberian schools
- User management — list, search, filter by status, ban/unban users
- Content moderation — list, search posts, flag for review, delete posts
- Protected routes (redirects to /login if not authenticated)

#### Key Files
- `src/App.tsx` — router + auth protection + layout
- `src/pages/login.tsx` — admin login page
- `src/pages/dashboard.tsx` — platform stats overview
- `src/pages/schools.tsx` — school CRUD
- `src/pages/users.tsx` — user management (ban/unban)
- `src/pages/posts.tsx` — content moderation (flag/delete)
- `src/components/layout.tsx` — sidebar navigation
- `src/lib/auth.ts` — token management (localStorage)
- `src/index.css` — design tokens (deep navy blue + blue primary palette)

### API Server (`artifacts/api-server`)
- **Type**: Express 5 REST API
- **Port**: 8080
- **Base path**: `/api`

#### Routes
- `GET /api/healthz` — health check
- `POST /api/admin/login` — admin authentication
- `GET /api/admin/stats` — platform statistics
- `GET/POST /api/schools` — list and create schools
- `GET/PUT/DELETE /api/schools/:id` — individual school management
- `GET /api/users` — list users (filterable)
- `POST /api/users/:id/ban` / `POST /api/users/:id/unban` — moderation
- `GET /api/posts` — list posts (filterable)
- `DELETE /api/posts/:id` — delete post
- `POST /api/posts/:id/flag` — flag post

## Database Schema (PostgreSQL)

Tables:
- `schools` — Liberian institutions (id, name, type, location, county, user_count)
- `admin_users` — platform users (id, name, username, email, school_name, post_count, follower_count, is_banned)
- `admin_posts` — platform posts (id, content, author_name, author_username, school_name, likes, comments, is_flagged)

Schema files: `lib/db/src/schema/`

## API Spec

OpenAPI spec: `lib/api-spec/openapi.yaml`
Generated hooks: `lib/api-client-react/src/generated/`
Generated Zod schemas: `lib/api-zod/src/generated/`

To regenerate after spec changes: `pnpm --filter @workspace/api-spec run codegen`

## Mobile App Notes

- Do NOT use `uuid` package — use `Date.now().toString() + Math.random().toString(36).substr(2, 9)` instead
- All schools must be Liberian institutions only
- AsyncStorage for persistence (no backend connection from mobile)
- Fonts: Poppins (Google Fonts via @expo-google-fonts/poppins)
- Color palette: Deep blue (#1e3a8a) as primary brand color
