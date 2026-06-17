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
  _layout.tsx               # Root Stack + WorkoutHistoryProvider (shared state)
  index.tsx                 # Main screen: wires state + renders tabs
  library.tsx               # Exercise library browser (#4): search + type/equipment/category
                            #   filters, expandable cards w/ areas + contraindications
  quick-session.tsx         # Quick session (#5): pick a complaint + time → generate & run
                            #   on the spot (⚡ in Header); records to history via shared context

src/
  types/index.ts            # Single source of truth for all TS types
  theme/index.ts            # Colors, font families as constants
  storage/index.ts          # Thin AsyncStorage wrapper (loadState/saveState/loadPlan/savePlan)
  state/
    WorkoutHistoryContext.tsx # Shares one useWorkoutHistory instance app-wide so the main +
                            #   quick-session screens read/write the same calendar/settings live

  data/
    builtInExercises.ts     # BUILT_IN_EXERCISES: the 30 original curated exercise defs (flat
                            #   library data since #38 Phase A)
    sessionGenerator.ts     # The selection engine (#38 Phase C): generateDayPlan() builds N
                            #   themed sessions from the ranked, equipment-filtered library
                            #   (focus quota + posture staple + budget fill + alternation,
                            #   seeded for shuffle); planSignature(); generateQuickSession() (#5 core)
    ranking.ts              # Pure exercise ranking score (#38 Phase B): efficacy + ease +
                            #   popularity + focus-match, tunable weights; exercisePopularity()
                            #   (from SessionRun.exerciseIds — also serves #27)
    exerciseLibrary.ts      # EXERCISE_LIBRARY = de-duped(BUILT_IN_EXERCISES +
                            #   STANDALONE_EXERCISES) — single source of truth; owns PREP_SECS;
                            #   getExerciseById(); query helpers; CATEGORY_LABELS / CATEGORY_GROUPS
    standaloneExercises.ts  # STANDALONE_EXERCISES: library-grown content (#26), merged into
                            #   EXERCISE_LIBRARY so it's reachable when building sessions (not
                            #   library-only). Authored in #26 Phase 2 behind a human-review gate
    __tests__/              # Jest unit tests for the data/algorithm layer (#29)

  hooks/
    useWorkoutTimer.ts      # Phase machine: idle → prep → active → done
                            #   Handles bilateral switch cues, pause, reset
    useWorkoutHistory.ts    # Calendar state, completion tracking, day-off + weekly skip-day
                            #   logic; settings incl. equipment (#28) + focusAreas (#38)
    useSessionPlan.ts       # Owns the persisted generated plan (#38 Phase C): rehydrate,
                            #   regenerate on profile-signature change, shuffle()

  components/
    Header.tsx              # App title + session color accent + Settings button
    SettingsPanel.tsx       # Sessions/day + duration steppers, skip-day chips, equipment chips
                            #   (#28), grouped focus-area chips (#38 Phase C), day-off toggle
    SessionAccordion.tsx    # Workout tab: collapsible session rows (#25) over the generated
                            #   plan + Shuffle button (#38) + beach rest screen + shared pro tips
    SessionRow.tsx          # One collapsible session row header: name, total time, today's run count (#25)
    SessionRunner.tsx       # Expanded-row run controls: prep/active/done cards + start + exercise list
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
  efficacy?: number;                // editorial 1–5 (ranking signal, #38 Phase B); neutral default if unset
  difficulty?: number;              // editorial 1–5; ease = 6 − difficulty (ranking signal, #38 Phase B)

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
  sessionRuns: SessionRun[];        // each completion (#3); SessionRun carries exerciseIds (#38)
}

interface AppSettings {
  dailyTarget: number;              // sessions per day (1–10); drives the number of generated sessions
  sessionDurationMinutes?: number;  // undefined = Auto (default budget); else a per-session time budget
  skipDays?: number[];              // recurring rest weekdays, 0=Sun … 6=Sat
  skipOverrides?: string[];         // YYYY-MM-DD dates where a recurring skip is cancelled
  availableEquipment?: Equipment[]; // equipment the user has (#28); filters the generator pool + library
  focusAreas?: ExerciseCategory[];  // categories to target (#38 Phase C); feeds the generator
}

// The persisted, generated session plan (#38 Phase C) — stored under its own key.
interface PlannedSession { name: string; emoji: string; focus: string; color: string; exerciseIds: string[]; }
interface SessionPlan { signature: string; seed: number; sessions: PlannedSession[]; }
```

`SessionRun` records each completion with a timestamp **and the `exerciseIds` actually run** (#38), so
popularity (#38) and the per-exercise counter (#27) derive exactly from history.

The session plan is **generated, not curated** (#38 Phase C): `sessionGenerator.generateDayPlan()` selects
from the ranked library and `useSessionPlan` persists the result, regenerating only when the profile
signature changes or the user shuffles. The old hand-authored `SESSIONS` are gone.

---

## Planned Features — Architectural Notes

### Feature 1: Configurable sessions per day / duration — ✅ Implemented
- `AppSettings.dailyTarget` (1–10) drives **how many** sessions the generator produces.
- `AppSettings.sessionDurationMinutes` is a per-session time budget (Auto → a default budget when
  unset); the generator (`sessionGenerator.ts`) sizes each session to it directly (the old
  `fitSessionToBudget` trim/extend pass was superseded in #38 Phase C).
- **Weekly skip days** were added alongside (beyond the original plan): `skipDays` mark recurring
  rest weekdays, `skipOverrides` cancel a skip for one date. Off days (manual or skip) replace the
  workout with a beach rest screen + "Un-skip today" (`unskipToday` in `useWorkoutHistory`).

### Session runner redesign: collapsible accordion (#25) — ✅ Implemented
- The top horizontal session pill bar (`SessionTabBar`) is **gone**. The workout tab is now a
  **vertical accordion** of collapsible session rows (`SessionAccordion` → `SessionRow` +
  `SessionRunner`). One row is open at a time (true accordion); the expanded row is the active,
  timer-bound session.
- Collapsed `SessionRow` shows the session name, **total time** (summed from the plan's
  exercises), and **today's completion count** for that slot (from
  `DayRecord.sessionRuns`). Expanding resets the single `useWorkoutTimer` and binds it to that
  session; collapsing / "Next Session" reset it too, so a half-run session never bleeds across rows.
- `app/index.tsx` tracks `expanded: number | null` (was `activeSession`). The runner body (prep/
  active/done/start + `ExerciseList`) was extracted from the old `WorkoutTab` into `SessionRunner`;
  the beach rest screen + pro tips moved into `SessionAccordion`. `SessionTabBar` and `WorkoutTab`
  were deleted.

### Feature 2: Exercise customization per session
- Add `isCustom?: boolean` and an optional `customExercises?: Exercise[]` to `WorkoutSession`
- Store custom sessions under a new `customSessions` key in `PersistedState`
- The exercise library browser (feature #4) is the pick interface

### Feature 3: Repeat session tracking — ✅ Implemented
- Every completion counts, including repeats of the same session. `markSessionComplete`
  (`useWorkoutHistory`) now sets `DayRecord.sessionsCompleted = sessionRuns.length` and derives the
  day `status` (`partial`/`completed`) from the **run count vs `dailyTarget`** — not from distinct
  `completedSessionIds`. The `completedSessionIds` set is still kept/persisted as "which sessions
  were run at least once," but no longer gates the daily total.
- UI: the day-progress line + done card (`sessionsDone`) read today's `sessionRuns.length`; the
  collapsed `SessionRow` shows the per-session "✓ N× today" badge (added in #25); the calendar
  appends the run count to a day's status glyph on multi-run days (e.g. `✓ 3`).

### Feature 4: Exercise library screen — ✅ Implemented
- `app/library.tsx` — reached from the 📚 button in `Header`; `router.push('/library')`.
- Reads `EXERCISE_LIBRARY` (de-duped `built-in session exercises + STANDALONE_EXERCISES`;
  standalone content lives in `data/standaloneExercises.ts`, authored by #26).
- Filters: free-text search, type (work/stretch), equipment (multi-select, **defaults to the
  #28 saved profile**; no-equipment exercises always show), and category multi-select from
  `CATEGORY_LABELS`. Empty state when nothing matches.
- Expandable cards show type/duration/equipment + category chips; the detail adds target areas
  and the `contraindications` note (#31) when set. (The "appears in N built-in sessions" line was
  removed in #38 Phase C, when the curated sessions went away.)
- **Deferred:** the "Add to session" action waits on #2 (custom sessions) — not built yet.

### Catalogue & safety groundwork — 🚧 In progress (Phase 1: #26 / #31 / #29)
- **#31 (shipped in this branch):** `Exercise.contraindications?: string` — optional
  "stop if it hurts" note; render in the library detail and optionally the runner prep card.
- **#26 (authored content — expert safety review tracked for before app-store listing, #36):**
  `STANDALONE_EXERCISES` (~56 entries) de-dup-merged into `EXERCISE_LIBRARY` (built-ins win
  on id collision). The `ExerciseCategory` union grew to **30 categories** (complaint, strength,
  sculpting/fat-target, wellness) and `BodyArea` gained `arms`/`glutes`/`calves`/`ankles`/`eyes`;
  `CATEGORY_LABELS` covers every key. Coverage: **85 library exercises, every category ≥3**,
  each with a work/stretch mix and a `contraindications` note where a movement could aggravate
  a condition. Category set was **developer-approved** first; content is quasi-medical. An expert
  reviewer isn't available yet, so the review (#36) does **not** block `main` — it's a backlog item
  to clear **before listing the app on an app store**.
- **#29 (shipped in this branch):** Jest (`jest-expo` preset) unit-test harness for the
  pure data/algorithm functions, incl. catalogue coverage + content-conformance tests. See the
  Testing convention below.

### Feature 5: Quick session generator — ✅ Implemented
- **Engine (#38 Phase C):** `sessionGenerator.generateQuickSession(category, durationMin, popularity?,
  equipment?, seed?)` — the daily generator with N=1, returning budget-fit `Exercise[]`.
- **Screen (`app/quick-session.tsx`):** reached via the ⚡ button in `Header`. Pick a complaint
  (grouped single-select chips) + a time (5 / 10 / 15 min presets + a custom stepper); equipment is
  pulled silently from the #28 profile. "Let's do this!" generates and runs it inline via the
  existing `SessionRunner` (in `quick` mode) + `useWorkoutTimer`; "🔀 New picks" reshuffles (new seed).
- **History:** completion calls `markSessionComplete(-1, exerciseIds)` — a sentinel slot id, so it
  lands in `sessionRuns`/calendar and feeds popularity (#3/#38) without matching any plan-row badge.
- **Shared state:** the screen reads/writes the **same** `useWorkoutHistory` via
  `WorkoutHistoryContext`, so a completed quick session shows live on the main screen's calendar.

### Epic #38: Generate daily sessions from the unified library (ranking + coverage)
- **Phase A — invert data ownership (✅ shipped, behavior-preserving):** exercise definitions
  now live in the library, not in sessions. The 30 built-in defs moved to
  `data/builtInExercises.ts`; `EXERCISE_LIBRARY` is `de-duped(BUILT_IN_EXERCISES +
  STANDALONE_EXERCISES)` (no longer derived from `SESSIONS`). Curated sessions are
  `SESSION_PRESETS` — metadata + ordered exercise-id lists — hydrated into `SESSIONS` by
  `getExerciseById` (session `exercises` share library object identity; no duplicated data).
  `PREP_SECS` now lives in `exerciseLibrary.ts` (re-exported from `sessions.ts` for the runner).
  No user-visible change; `tsc` + Jest green.
- **Phase B — ranking (✅ shipped):** `Exercise.efficacy?`/`difficulty?` added (optional; the
  ranker falls back to neutral/by-type defaults — per-exercise seed values + weights remain an
  open decision). Pure `src/data/ranking.ts` exposes `scoreExercise`/`rankExercises` with tunable
  `RANKING_WEIGHTS` (score = efficacy + ease + popularity + focus-match, each normalised 0–1).
  History-derived `exercisePopularity(calData)` lives in `ranking.ts` (pure; reads
  `SessionRun.exerciseIds` — see Phase C — the same derivation #27 needs). Unit-tested.
- **Phase C — generator + coverage (✅ shipped):** the curated `SESSIONS` are **gone**; the day's
  sessions are now **generated and persisted**. `sessionGenerator.generateDayPlan(profile, popularity,
  seed)` builds N themed sessions from the ranked, equipment-filtered library — min-quota per focus
  area (with related-category fallback), a posture/anti-sitting staple, score-fill to the time budget,
  work/stretch alternation, no in-session dup, minimal cross-session overlap; seeded so **Shuffle**
  varies the picks. `AppSettings.focusAreas` (grouped picker in Settings) drives the focus round-robin.
  `useSessionPlan` persists the plan and regenerates **only** when the profile signature (focus /
  equipment / target / duration) changes or the user shuffles — so the routine is stable day to day.
  `SessionRun.exerciseIds` is recorded on completion to make popularity (and #27) exact. One engine
  powers both daily and quick sessions (`generateQuickSession` = N=1). **Open decisions deferred:**
  per-exercise efficacy/difficulty seeds and the scoring weights (neutral defaults for now).

---

## Development Conventions

- **No diagrams.** The SVG stick-figure animations from the original JSX were removed. Text descriptions are the only form factor for exercise instruction.
- **No accounts, no cloud.** All data lives in `AsyncStorage`. Keep it that way unless the user explicitly requests sync.
- **Relative imports only.** No `@/` path aliases — keeps babel config simple.
- **StyleSheet.create** for all styles; no inline objects except for dynamic values (session color, progress width).
- **One hook per concern.** Timer logic in `useWorkoutTimer`, history/persistence in `useWorkoutHistory`, the generated plan in `useSessionPlan`. Keep them separate. `useWorkoutHistory` is shared app-wide through `WorkoutHistoryContext` (provided in `_layout.tsx`) so multiple screens stay in sync — consume it via `useWorkoutHistoryContext()`, don't call the hook twice.
- **Unit tests for pure logic.** Data/algorithm functions (the session generator + `planSignature`, `EXERCISE_LIBRARY` composition, ranking/`exercisePopularity`, catalogue coverage) get Jest tests under `src/**/__tests__/*.test.ts`. Run with `npm test`. `tsc --noEmit` remains the type guardrail; jest globals are enabled via `"types": ["jest"]` in `tsconfig.json`.
- **AI-authored exercise content needs an expert safety review** (movement cues are quasi-medical) — tracked in **#36**. No qualified reviewer is available at present, so this does **not** block `dev → main`; it's a backlog gate that must be cleared **before listing the app on an app store**. New library content still goes in `data/standaloneExercises.ts`.
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
