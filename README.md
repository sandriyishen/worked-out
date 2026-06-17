# Worked Out

**Movement that fits your life — not a plan you have to fit your life around.**

---

## Philosophy

Most fitness apps assume you have blocks of free time, a gym membership, and the willpower to commit to a regimented schedule. Worked Out assumes none of those things.

The premise is simple: **you can move anywhere, anytime, with nothing but the body you already have** — and those 4 minutes between back-to-back calls count just as much as a 45-minute gym session, because they add up and they actually happen.

The enemy of fitness isn't laziness. It's the all-or-nothing thinking that says if you can't do a full workout you shouldn't bother doing anything. Worked Out removes that friction entirely:

- **No gym.** Every movement uses a desk, a wall, a chair, or nothing at all.
- **No schedule.** Sessions are suggestions, not obligations.
- **No minimum.** One exercise is infinitely better than zero.
- **No guilt.** Missed a day? That's what Day Off is for.

The goal is to make movement the path of least resistance — something you do in the margins of your workday, repeatedly, without ceremony.

---

## Current Features

- **Quick session** — "my neck hurts, I've got 5 minutes": pick a complaint and a time (5/10/15 min or custom) and get a ready-to-run session generated on the spot
- **Personalized session plan** — your day's sessions are generated from the exercise library around your focus areas, equipment, count, and time budget, then kept the same each day so a routine sticks
- **Shuffle** — bored of the current set? One tap regenerates fresh sessions from your profile
- **Focus areas** — pick what to target (grouped: complaints, strength, sculpting, wellness) and sessions are built to cover them
- **Configurable daily sessions** — choose how many sessions per day (1–10) and a per-session time budget (or Auto)
- **Collapsible session list** — each day's sessions stack as expandable rows showing total time and how many times you've run each one today; tap one to expand its runner
- **Repeat tracking** — run the same session as many times as you like; every run counts toward your daily total and shows in history (the calendar marks multi-run days)
- **Timed workout runner** with prep countdown, bilateral side-switch cues, pause/resume, and progress bar
- **Calendar view** showing completion history with done / partial / missed / day-off status
- **Big one-handed actions** — Quick Session and Skip Today sit as large side-by-side buttons at the top of the workout tab, easy to reach
- **Weekly skip days & Day Off** — pick recurring rest weekdays (in Settings) or tap Skip Today; rest days show a beach screen with one-tap un-skip
- **Organized Settings** — exercise setup is grouped into collapsible sections (sessions/day, duration, skip days, equipment, issues/focus), with a button into the exercise library
- **Equipment profile** — tell the app what you have (chair, desk, wall, doorframe) to tailor the exercise library and quick sessions
- **Exercise library** — opened from Settings; browse the full catalogue, filter by complaint/goal (groups that expand to reveal categories), equipment, or type, search by name, and see each exercise's target areas and safety notes

---

## Planned Features

1. **Exercise customization** — swap or modify individual exercises within any session

---

## Tech Stack

- **React Native** 0.85 via [Expo](https://expo.dev) SDK 56
- **Expo Router** for file-based navigation
- **AsyncStorage** for local persistence (no account, no cloud, no tracking)
- **TypeScript** throughout

---

## Getting Started

```bash
npm install
npx expo start --android   # development: opens in Expo Go or emulator
npm test                   # run the unit-test suite
```

To build an installable APK:

```powershell
# PowerShell
$env:EXPO_TOKEN = "your-expo-access-token"
npx eas-cli@latest build --platform android --profile preview
```

`preview` produces an unsigned APK you can sideload directly. `production` produces a signed AAB for the Play Store. See [DEPENDENCIES.md](DEPENDENCIES.md) for account setup and full build instructions.

---

## Project Structure

```
app/                    # Expo Router screens
  _layout.tsx           # Root stack layout
  index.tsx             # Main workout screen
  library.tsx           # Exercise library browser (filters + search + detail)
  quick-session.tsx     # Quick session: pick a complaint + time, generate & run on the spot
src/
  types/index.ts        # All TypeScript interfaces
  theme/index.ts        # Colors and font constants
  storage/index.ts      # AsyncStorage wrapper
  state/                # WorkoutHistoryContext — shared history/settings across screens
  data/
    builtInExercises.ts # Original curated exercise definitions (flat library data)
    exerciseLibrary.ts  # Exercise catalogue (single source of truth) + query helpers
    ranking.ts          # Pure exercise ranking score + popularity (efficacy/ease/popularity/focus)
    sessionGenerator.ts # Generates the day's themed sessions from the ranked library (+ quick sessions)
    standaloneExercises.ts # Library-grown exercises, merged into the catalogue
    __tests__/          # Jest unit tests for the data/algorithm layer
  hooks/
    useWorkoutTimer.ts  # Timer state machine
    useWorkoutHistory.ts # Calendar, completion, and settings state
    useSessionPlan.ts   # Persisted generated session plan + shuffle
  components/
    Header.tsx           # App title + Settings (⚙) button
    Collapsible.tsx      # Reusable collapsible section (header + summary + body)
    CategoryGroupPicker.tsx # Issues/goals selector: groups that expand to reveal categories
    SettingsPanel.tsx    # Collapsible exercise-setup sections + Library button + General placeholder
    SessionAccordion.tsx # Quick Session / Skip Today buttons + collapsible session rows (workout
                         #   tab) + Shuffle + beach rest screen
    SessionRow.tsx       # One collapsible session row header (name, total time, runs today)
    SessionRunner.tsx    # Expanded-row run controls (prep/active/done + exercise list)
    ExerciseList.tsx
    CalendarTab.tsx
```

---

## Design Principles

Every feature decision should pass this test: **does this make it easier to move for 3 minutes right now?** If it adds friction, complexity, or commitment pressure, it doesn't belong in the app.
