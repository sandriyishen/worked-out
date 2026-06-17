# CLAUDE.md — Worked Out

## The North Star

This app exists because most people who want to be healthier don't have an hour to spare — they have four minutes between meetings. Worked Out is built around that reality.

**The central philosophy: movement that fits your life, not a plan you have to fit your life around.**

Every product decision should orbit this idea. If a feature makes the app feel like a commitment, a schedule, or a chore, it pulls against the philosophy. If it lowers the bar for "doing something," it belongs.

---

## Architecture Overview

### Tech Stack

| Layer | Choice |
|---|---|
| Runtime | React Native 0.85 (Expo SDK 56) |
| Navigation | Expo Router (file-based) |
| Persistence | AsyncStorage (local-only, no account) |
| Language | TypeScript (strict) |
| Build | EAS Build |

### File Structure

```
app/                        # Expo Router — each file is a screen
  _layout.tsx               # Root Stack with StatusBar
  index.tsx                 # Main screen: wires state + renders tabs

src/
  types/index.ts            # Single source of truth for all TS types
  theme/index.ts            # Colors, font families as constants
  storage/index.ts          # Thin AsyncStorage wrapper (loadState/saveState)

  data/
    sessions.ts             # 5 built-in WorkoutSessions (full library metadata each) +
                            #   buildDaySessions(n): generic Session 1…N by cycling built-ins
    exerciseLibrary.ts      # EXERCISE_LIBRARY = de-duped(built-in session exercises +
                            #   STANDALONE_EXERCISES); query helpers;
                            #   fitSessionToBudget() trims/extends a session to a time budget
    standaloneExercises.ts  # STANDALONE_EXERCISES: library-grown content (#26), merged into
                            #   EXERCISE_LIBRARY so it's reachable when building sessions (not
                            #   library-only). Authored in #26 Phase 2 behind a human-review gate
    __tests__/              # Jest unit tests for the data/algorithm layer (#29)

  hooks/
    useWorkoutTimer.ts      # Phase machine: idle → prep → active → done
                            #   Handles bilateral switch cues, pause, reset
    useWorkoutHistory.ts    # Calendar state, completion tracking, day-off + weekly
                            #   skip-day logic (skipDays/skipOverrides, unskipToday)

  components/
    Header.tsx              # App title + session color accent + Settings button
    SettingsPanel.tsx       # Sessions/day + duration steppers, skip-day chips, day-off toggle
    SessionTabBar.tsx       # Horizontal scrolling session pill tabs (generic Session 1…N)
    WorkoutTab.tsx          # Workout view: prep/active/done cards, exercise list, beach rest screen
    ExerciseList.tsx        # Expandable exercise cards (no diagrams)
    CalendarTab.tsx         # Monthly calendar grid + stats
```

---

## Data Model

The data model is intentionally forward-facing. All current exercises carry metadata that will power future features:

```typescript
interface Exercise {
  id: string;
  name: string;
  duration: number;         // seconds
  type: 'work' | 'stretch';
  desc: string;
  bilateral?: boolean;
  switchAt?: number;
  reps?: string;
  contraindications?: string;       // optional "stop if it hurts" safety note (#31)

  // Library metadata (powers features #4 and #5)
  categories: ExerciseCategory[];   // e.g. ['back_pain', 'carpal_tunnel']
  targetAreas: BodyArea[];          // e.g. ['neck', 'wrists']
  equipment: Equipment;             // 'none' | 'chair' | 'desk' | 'wall' | 'doorframe'
}

interface DayRecord {
  date: string;
  sessionsCompleted: number;
  status: 'completed' | 'partial' | 'dayoff' | 'missed';
  completedSessionIds: number[];
  sessionRuns: SessionRun[];        // tracks repeat completions (feature #3)
}

interface AppSettings {
  dailyTarget: number;              // sessions per day (1–10); drives the Session 1…N count
  sessionDurationMinutes?: number;  // undefined = Auto (full session); else a time budget
  skipDays?: number[];              // recurring rest weekdays, 0=Sun … 6=Sat
  skipOverrides?: string[];         // YYYY-MM-DD dates where a recurring skip is cancelled
}
```

`SessionRun[]` already stores every individual completion with a timestamp, so feature #3 (repeat tracking) only needs UI work — the data layer is ready.

The `exerciseLibrary.ts` file exports helper functions (`getExercisesByCategory`, `getExercisesByArea`) that will be the foundation of the quick-session algorithm in feature #5.

---

## Planned Features — Architectural Notes

### Feature 1: Configurable sessions per day / duration — ✅ Implemented
- `AppSettings.dailyTarget` (1–10) now drives **how many** sessions a day has. `buildDaySessions(n)`
  in `sessions.ts` cycles the built-in sessions into a generic `Session 1…N` list.
- `AppSettings.sessionDurationMinutes` is a per-session time budget (Auto when unset).
  `fitSessionToBudget()` in `exerciseLibrary.ts` trims the exercise list to fit, or extends it
  with category-matched exercises from the library when the budget exceeds the session.
- **Weekly skip days** were added alongside (beyond the original plan): `skipDays` mark recurring
  rest weekdays, `skipOverrides` cancel a skip for one date. Off days (manual or skip) replace the
  workout with a beach rest screen + "Un-skip today" (`unskipToday` in `useWorkoutHistory`).

### Feature 2: Exercise customization per session
- Add `isCustom?: boolean` and an optional `customExercises?: Exercise[]` to `WorkoutSession`
- Store custom sessions under a new `customSessions` key in `PersistedState`
- The exercise library browser (feature #4) is the pick interface

### Feature 3: Repeat session tracking
- Already supported at the data layer — `DayRecord.sessionRuns` records each completion
- UI change: don't mark a session pill as "done" after first completion; instead show a count badge
- Calendar stats would sum `sessionRuns.length` per day, not `completedSessionIds.size`

### Feature 4: Exercise library screen
- New Expo Router screen: `app/library.tsx`
- Read from `EXERCISE_LIBRARY` in `exerciseLibrary.ts` (now de-duped `built-in
  session exercises + STANDALONE_EXERCISES`; standalone content lives in
  `data/standaloneExercises.ts` and is authored by #26).
- Filter controls: category chips (back pain, neck, carpal tunnel, etc.) + equipment filter
- Each exercise card links to detail view and has "Add to session" action
- Show `contraindications` (when set) in the card detail.

### Catalogue & safety groundwork — 🚧 In progress (Phase 1: #26 / #31 / #29)
- **#31 (shipped in this branch):** `Exercise.contraindications?: string` — optional
  "stop if it hurts" note; render in the library detail and optionally the runner prep card.
- **#26 plumbing (shipped in this branch):** `STANDALONE_EXERCISES` + de-dup merge into
  `EXERCISE_LIBRARY` (built-ins win on id collision). Content authoring is #26 *Phase 2*
  and is **developer-gated** (category approval first) + **human safety review before
  merge to `main`** — movement instructions are quasi-medical.
- **#29 (shipped in this branch):** Jest (`jest-expo` preset) unit-test harness for the
  pure data/algorithm functions. See the Testing convention below.

### Feature 5: Quick session generator
- New screen: `app/quick-session.tsx`
- Input: complaint (ExerciseCategory) + duration in minutes
- Algorithm in `exerciseLibrary.ts → generateQuickSession(complaint, durationMin)`
- Algorithm selects exercises from the library matching the category, fitting within time budget
- Run the generated session using the existing `useWorkoutTimer` hook — no new timer logic needed

---

## Development Conventions

- **No diagrams.** The SVG stick-figure animations from the original JSX were removed. Text descriptions are the only form factor for exercise instruction.
- **No accounts, no cloud.** All data lives in `AsyncStorage`. Keep it that way unless the user explicitly requests sync.
- **Relative imports only.** No `@/` path aliases — keeps babel config simple.
- **StyleSheet.create** for all styles; no inline objects except for dynamic values (session color, progress width).
- **One hook per concern.** Timer logic in `useWorkoutTimer`, history/persistence in `useWorkoutHistory`. Keep them separate.
- **Unit tests for pure logic.** Data/algorithm functions (`fitSessionToBudget`, `EXERCISE_LIBRARY` composition, `generateQuickSession`, repeat/status semantics) get Jest tests under `src/**/__tests__/*.test.ts`. Run with `npm test`. `tsc --noEmit` remains the type guardrail; jest globals are enabled via `"types": ["jest"]` in `tsconfig.json`.
- **AI-authored exercise content needs a human safety review** before merging to `main` (movement cues are quasi-medical). New library content goes in `data/standaloneExercises.ts`.
- **Keep root docs current.** Any change that alters user-facing behavior, the data model, file structure, build steps, or dependencies must update the affected root Markdown in the *same* change — never as a follow-up. `README.md` (features + project structure), `CLAUDE.md` (architecture, data model, conventions, planned-feature status), and `DEPENDENCIES.md` (build/toolchain versions). When a planned feature ships, move it out of "Planned" in both `README.md` and `CLAUDE.md`.
- **The philosophy test.** Before adding any feature, ask: does this make it easier to move for 3 minutes right now?

---

## Issue Labeling

When creating GitHub issues, always apply these labels:

- **`planned`** — any issue surfaced or requested by the project owner. If the user raised it, it gets `planned`.
- **`feature`** — any issue that pertains to expanding app functionality (new screens, new capabilities, new user-facing behavior).

These are not mutually exclusive: an owner-requested feature gets both `planned` and `feature`. Issues you surface yourself (e.g. tech-debt or follow-ups) take neither by default — label those by severity instead.

---

## Branching & Pull Requests

- **All pull requests target the `dev` branch, not `main`.** `dev` is the integration
  branch where features are merged and tested together; `main` is promoted from `dev`
  in separate release merges.
- Open feature/fix branches off `dev` and open the PR with `--base dev`.
- Never open a PR directly against `main` unless it is an explicit release promotion.
- **When opening a `dev → main` promotion PR, close the issues it ships.** Issue-closing
  keywords only fire on the default branch, so PRs merged into `dev` leave their issues open
  (they create a cross-reference, not a closing link). In the promotion PR: review the PRs
  merged into `dev` since the last promotion, collect every issue they addressed, and add a
  `Closes #N` line per issue to the promotion PR body — this links each issue to the PR and
  auto-closes it when the promotion merges. If an issue must be closed before the merge, close
  it right after opening the PR and reference the PR number in the close comment.

## Project Tracking

Planned work is tracked on the **"Worked Out — Roadmap"** GitHub Project (Projects v2, user-scoped:
`https://github.com/users/sandriyishen/projects/2`). Every `planned`/`feature` issue (and tracked
tech-debt) is an item with three custom fields:

- **Order** (number) — global execution sequence; **work issues in ascending Order.** This matches
  the "step N" in each issue's pinned execution-order comment.
- **Feature** (single-select) — the feature epic that houses the issue: `Exercise Library`,
  `Session Runner Redesign`, `Quick Sessions`, `Custom Sessions`, `Onboarding & Personalization`,
  `Testing Infrastructure`.
- **Status** — `Todo` → `In Progress` → `Done`.

**Status rules:**
- **Starting an issue → set Status to `In Progress`** (no GitHub trigger exists for "work started", so
  do it manually). Look up the item id and edit, e.g.:
  ```bash
  ITEM=$(gh project item-list 2 --owner @me --format json | jq -r '.items[]|select(.content.number==25).id')
  FID=$(gh project field-list 2 --owner @me --format json | jq -r '.fields[]|select(.name=="Status").id')
  OPT=$(gh project field-list 2 --owner @me --format json | jq -r '.fields[]|select(.name=="Status").options[]|select(.name=="In Progress").id')
  gh project item-edit --project-id PVT_kwHOAYLoKs4Ba4LH --id "$ITEM" --field-id "$FID" --single-select-option-id "$OPT"
  ```
- **Closing an issue → `Done` is automatic.** The project's built-in "Item closed → Done" workflow
  handles it, so closing via a `dev → main` promotion PR (`Closes #N`) or `gh issue close` moves the
  item to Done with no manual step. (If it ever doesn't, enable that workflow under the project's
  **Workflows** settings, or set Status to Done manually.)
- **New tracked issue → add it to the project** and set its `Order` + `Feature` (new items default to
  `Todo` via the built-in "Item added → Todo" workflow).

## Running Locally

```bash
npm install
npx expo start --android     # run on Android device/emulator
npx expo start               # open Expo Go QR code
npm test                     # run the Jest unit-test suite
```

## Building an APK

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview   # unsigned APK for testing
eas build --platform android --profile production
```
