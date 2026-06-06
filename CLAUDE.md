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
| Runtime | React Native (Expo SDK 52) |
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
    sessions.ts             # 5 built-in WorkoutSessions; each exercise has
                            #   full library metadata (categories, targetAreas, equipment)
    exerciseLibrary.ts      # Flat list of all exercises + query helpers;
                            #   will power the library browser and quick-session algo

  hooks/
    useWorkoutTimer.ts      # Phase machine: idle → prep → active → done
                            #   Handles bilateral switch cues, pause, reset
    useWorkoutHistory.ts    # Calendar state, completion tracking, day-off logic

  components/
    Header.tsx              # App title + session color accent + Settings button
    SettingsPanel.tsx       # Daily target stepper + day-off toggle
    SessionTabBar.tsx       # Horizontal scrolling session pill tabs
    WorkoutTab.tsx          # Full workout view: prep/active/done cards + exercise list
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
```

`SessionRun[]` already stores every individual completion with a timestamp, so feature #3 (repeat tracking) only needs UI work — the data layer is ready.

The `exerciseLibrary.ts` file exports helper functions (`getExercisesByCategory`, `getExercisesByArea`) that will be the foundation of the quick-session algorithm in feature #5.

---

## Planned Features — Architectural Notes

### Feature 1: Configurable sessions per day / duration
- `AppSettings.dailyTarget` already exists and is persisted
- Add `sessionsPerDay: number` and `sessionDurationMinutes: number` to `AppSettings`
- Session UI would use `sessionDurationMinutes` to filter/truncate the exercise list

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
- Read from `EXERCISE_LIBRARY` in `exerciseLibrary.ts`
- Filter controls: category chips (back pain, neck, carpal tunnel, etc.) + equipment filter
- Each exercise card links to detail view and has "Add to session" action

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
- **The philosophy test.** Before adding any feature, ask: does this make it easier to move for 3 minutes right now?

---

## Running Locally

```bash
npm install
npx expo start --android     # run on Android device/emulator
npx expo start               # open Expo Go QR code
```

## Building an APK

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview   # unsigned APK for testing
eas build --platform android --profile production
```
