# Pairlog Claude Handoff 2026-03-30

## Purpose

This handoff exists to reduce context-loss during long Pairlog sessions.
Use it as the current source of truth before continuing UI stabilization or pre-build QA.

## Current workflow rule

- Codex: implementation, tests, docs, local verification
- Claude: QA first, then stop
- `eas build` / `eas submit` must not run unless the user explicitly says to spend a build

## What is already implemented

### Start / onboarding / auth

- Anonymous start via `アドレスなしで始める`
- `あとで設定する` no longer traps the user
- Forgot-password screen route is wired
- Forgot-password resend has a 30 second cooldown
- Auth / onboarding top spacing was moved closer to safe-area based layout
- A lightweight splash-like screen was added at launch

### Unpaired mode

- Unpaired users can open Home / Promises / Calendar / Settings in normal UI
- Large explanation cards were removed
- Small connection notice bar is used instead
- Local-mode rule create / edit / delete / record is enabled for unpaired use

### Rule / reward values

- Rule points are 10pt increments
- Reward points are 10pt increments
- API-side point validation was aligned to 10pt increments

### API / safety fixes already landed

- Password reset codes are no longer logged
- Deletion flow was wrapped in a transaction
- `assignee = both` now awards both users
- Event-to-edit navigation preserves assignee / recorder fields

## Verified locally

- `pnpm --filter @fny/api exec tsc --noEmit`
- `pnpm --filter @fny/api test`
- `pnpm --filter mobile exec tsc --noEmit`
- `pnpm --filter mobile exec vitest run`

These were passing at the time of handoff.

## Still open / not yet fully fixed

### 1. Promise creation / edit screen is still too heavy and glitchy

User-reported issues:

- The form starts in an awkward place
- `いつから始めるか` should be removed
- Default should effectively be "today"
- `何時ごろの約束か` should be removed
- Reminder switch spills visually and does not sit cleanly inside the card
- The pink selection highlight in the wheel picker hides the time
- `やさしく思い出せるように...` copy is not needed
- Helper text under `誰が記録する？` visually collides with the border
- Schedule selection should be easier to see near the top of the form

Files to inspect first:

- `/Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/mobile/app/create-rule.tsx`
- `/Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/mobile/app/edit-rule.tsx`
- `/Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/mobile/components/TimeWheelPicker.tsx`

Suggested direction:

- Move the schedule block higher
- Remove start-date UI entirely
- Remove extra helper copy where possible
- Keep the form row-based and compact
- Make the wheel picker overlay much lighter / transparent

### 2. Promise tab still feels visually off

User-reported issue:

- Promise tab content starts awkwardly from the middle
- The top of the list should feel tighter and begin naturally

File:

- `/Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/mobile/app/(home)/promises.tsx`

Suggested direction:

- Remove unnecessary first section heading when only one section exists
- Reduce top padding
- Remove excess spacer at the bottom

### 3. Calendar still needs layout and data polish

User-reported issues:

- Sunday label was reported as disappearing in QA
- Too much whitespace under the month grid
- Dots do not always show as expected
- Tapping dates sometimes shows nothing

File:

- `/Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/apps/mobile/app/(home)/calendar.tsx`

Suggested direction:

- Reduce calendar grid cell height / bottom whitespace
- Remove excess scroll spacer
- Re-check weekday header rendering
- Re-check detail panel visibility rules for days with events

## High-value QA focus for the next session

Do not run full QA first.
Use this scoped checklist first:

1. Anonymous start works
2. Unpaired Home / Promises / Calendar / Settings open in normal UI
3. Promise create screen layout is compact and readable
4. Reminder wheel picker shows time correctly
5. Promise tab no longer starts awkwardly in the middle
6. Calendar shows weekday labels correctly
7. Calendar dots appear on recorded days
8. Date tap shows details for the selected day
9. Forgot-password screen opens and send/resend work

## Claude prompt starter

Use this as the default prompt starter for Claude:

> Read `/Users/yamadarintaro/Desktop/Claude Projects/CouplePoint/pairlog/docs/claude-handoff-20260330-ui-stabilization.md` first.
> Continue from that handoff only.
> Do scoped QA or scoped fixes first.
> Do not run `eas build` or `eas submit` unless the user explicitly approves spending a build.

## Why this file exists

Long sessions keep getting compressed.
Instead of relying on chat history, keep the latest state here and update it whenever a meaningful chunk of work completes.
