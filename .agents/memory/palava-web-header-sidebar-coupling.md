---
name: Palava Hub Web header height coupling
description: TopNav header height in artifacts/web is hardcoded into LeftSidebar/RightSidebar sticky offsets — must be updated together.
---

In `artifacts/web`, `LeftSidebar` and `RightSidebar` use `sticky top-<n>` and `max-h-[calc(100vh-<n>)]` with a value hardcoded to match `TopNav`'s header height (not derived from a shared constant/CSS variable).

**Why:** Both sidebars are only ever visible at `lg`/`xl`+ breakpoints, where `TopNav`'s header height is a single fixed value (no smaller-breakpoint variants apply at that width), so one hardcoded offset per sidebar is sufficient — but it silently desyncs if the header height changes without updating the sidebars.

**How to apply:** Any change to `TopNav`'s header height (e.g. logo size increases, responsive height classes) must be mirrored into both sidebar files' `top-*` and `max-h-[calc(100vh-*)]` values for the breakpoint at which they become visible. Consider extracting a shared CSS variable for the header height if this needs to change again.
