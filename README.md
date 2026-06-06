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

- **5 daily sessions** targeting morning activation, mid-morning burn, lunch reset, afternoon power, and end-of-day release
- **Timed workout runner** with prep countdown, bilateral side-switch cues, pause/resume, and progress bar
- **Calendar view** showing completion history with done / partial / missed / day-off status
- **Daily target** — configurable number of sessions to count a day as complete
- **Day Off** — mark today as a rest day without breaking your streak logic

---

## Planned Features

1. **Configurable sessions** — adjust how many sessions per day and how long each one is
2. **Exercise customization** — swap or modify individual exercises within any session
3. **Repeat tracking** — do the same session twice in a day and have both runs counted in history
4. **Exercise library** — browse the full catalogue of exercises, filtered by complaint (back pain, stiff neck, carpal tunnel relief, etc.) and body area
5. **Quick sessions** — specify a complaint and a time budget; the app generates a targeted stretch or workout session on the spot

---

## Tech Stack

- **React Native** via [Expo](https://expo.dev) SDK 52
- **Expo Router** for file-based navigation
- **AsyncStorage** for local persistence (no account, no cloud, no tracking)
- **TypeScript** throughout

---

## Getting Started

```bash
npm install
npx expo start --android   # development: opens in Expo Go or emulator
```

To build an installable APK:

```powershell
# PowerShell
$env:EXPO_TOKEN = "your-expo-access-token"
npx eas-cli@20 build --platform android --profile preview
```

`preview` produces an unsigned APK you can sideload directly. `production` produces a signed AAB for the Play Store. See [DEPENDENCIES.md](DEPENDENCIES.md) for account setup and full build instructions.

---

## Project Structure

```
app/                    # Expo Router screens
  _layout.tsx           # Root stack layout
  index.tsx             # Main workout screen
src/
  types/index.ts        # All TypeScript interfaces
  theme/index.ts        # Colors and font constants
  storage/index.ts      # AsyncStorage wrapper
  data/
    sessions.ts         # The 5 built-in workout sessions
    exerciseLibrary.ts  # Full exercise catalogue (powers features 4 & 5)
  hooks/
    useWorkoutTimer.ts  # Timer state machine
    useWorkoutHistory.ts # Calendar and completion state
  components/
    Header.tsx
    SettingsPanel.tsx
    SessionTabBar.tsx
    WorkoutTab.tsx
    ExerciseList.tsx
    CalendarTab.tsx
```

---

## Design Principles

Every feature decision should pass this test: **does this make it easier to move for 3 minutes right now?** If it adds friction, complexity, or commitment pressure, it doesn't belong in the app.
