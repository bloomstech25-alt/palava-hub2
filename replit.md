# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Includes a student social networking mobile app (Expo) and a shared API server.

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

## Artifacts

### StudentConnect Mobile App (`artifacts/mobile`)
- **Type**: Expo mobile app
- **Preview path**: `/`
- **Framework**: Expo + React Native + Expo Router

#### Features
- Welcome / onboarding screen with blue gradient branding
- Registration with school selection (25+ universities and high schools)
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
- `context/FeedContext.tsx` — feed state, posts, notifications, comments
- `constants/colors.ts` — design tokens (deep blue palette)
- `app/welcome.tsx` — landing/onboarding screen
- `app/login.tsx` / `app/register.tsx` — auth screens
- `app/(tabs)/index.tsx` — global feed
- `app/(tabs)/explore.tsx` — search + trending + schools + people
- `app/(tabs)/notifications.tsx` — notification center
- `app/(tabs)/profile.tsx` — user profile
- `app/create-post.tsx` — post creation modal
- `app/post/[id].tsx` — post detail + comments

### API Server (`artifacts/api-server`)
- Express 5 + TypeScript
- PostgreSQL via Drizzle ORM
- Path: `/api`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/mobile run dev` — run Expo dev server

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
