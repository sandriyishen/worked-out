# Build Dependencies

Everything required to go from a fresh clone of this repo to a runnable `.apk`.

---

## Two build paths

There are two ways to produce an APK. They share the same Node/npm prerequisites but differ in what you need installed locally for the Android compilation step.

| | Path A — EAS Cloud Build | Path B — Local Build |
|---|---|---|
| Android SDK needed locally | No | Yes |
| Android Studio needed | No | Optional (SDK only is enough) |
| Build runs on | Expo's servers (Linux/Docker) | Your machine |
| Requires Expo account | Yes (free) | No |
| Offline capable | No | Yes |
| Recommended for | Most cases | CI/CD or offline work |

---

## Prerequisites — both paths

### Node.js 22 LTS

**Version:** 22.x recommended (this is what EAS Build servers run for SDK 56). React Native 0.85 requires one of `20.19.4+`, `22.13.0+`, or `24.3.0+`, so Node 20 LTS still works if it's a recent patch.

Install via the Windows installer from https://nodejs.org, or use a version manager (see Isolation below). npm is bundled with Node — no separate install needed.

Verify:
```
node --version   # should print v22.x.x (or v20.19.4+ / v24.3.0+)
npm --version    # should print 10.x.x or newer
```

A `.nvmrc` file at the root of this repo pins the version for tools that respect it.

### Git

Already required to clone the repo. Verify with `git --version`.

---

## Path A — EAS Cloud Build

Expo's build service compiles the APK in a managed Linux container. You only need local tooling to submit the code.

The project is already linked to an EAS project (`extra.eas.projectId` in `app.json`). You do not need to run `eas init` or create a new project — just an Expo account and a token.

### 1. Install project dependencies
```
npm install
```

### 2. Create a free Expo account and get an access token

Sign up or log in at https://expo.dev, then:

1. Click your avatar (top-right) → **Account Settings**
2. Click **Access Tokens** in the left sidebar
3. Click **Create Token**, give it a name (e.g. `worked-out-build`), copy the value

The token looks like `expo_xxxxxxxxxxxxxxxxxxxxxx`. Expo only shows it once — save it somewhere safe.

**Why a token instead of `eas login`?**
`eas login` opens an interactive browser flow that breaks in many Windows terminals (Git Bash, some PowerShell configurations). The environment variable approach works everywhere and is CI-friendly.

### 3. Set the token and build

**PowerShell:**
```powershell
$env:EXPO_TOKEN = "paste-your-token-here"
npx eas-cli@latest build --platform android --profile preview
```

**Git Bash / WSL:**
```bash
export EXPO_TOKEN="paste-your-token-here"
npx eas-cli@latest build --platform android --profile preview
```

`npx eas-cli@latest` downloads EAS CLI on demand — no global install needed. When the build finishes the terminal prints a download URL for the `.apk`.

**Profiles:**
```
--profile preview     → unsigned APK  (sideload to device, no Play Store)
--profile production  → signed AAB    (Play Store submission)
```

No Java, no Android SDK, no Gradle needed locally.

---

## Path B — Local Build

Requires the full Android toolchain on your machine.

### 1. Install project dependencies
```
npm install
```

### 2. Java Development Kit 17

**Exact version:** JDK 17 (React Native 0.85 builds on JDK 17).

Options:
- Microsoft Build of OpenJDK 17: https://www.microsoft.com/openjdk (recommended on Windows)
- Adoptium Temurin 17: https://adoptium.net
- Or via Chocolatey: `choco install temurin17`

Verify: `java -version` → `openjdk 17.x.x`

Set `JAVA_HOME` to the JDK root if the installer doesn't do it automatically.

### 3. Android SDK

The exact compile/target API level, Build Tools, and NDK are pinned by the Expo SDK 56 prebuild template, not chosen by hand. Run `npx expo prebuild --platform android` once and read the generated `android/build.gradle` (the `compileSdkVersion`, `buildToolsVersion`, `targetSdkVersion`, and `ndkVersion` values at the top) — those are the versions to install. `npx expo-doctor` will also flag anything missing.

**How to install:**

Option 1 — Android Studio (easiest): Download from https://developer.android.com/studio. The installer handles the SDK Platform, Build Tools, and NDK automatically via the SDK Manager — point it at the versions from `android/build.gradle`.

Option 2 — Command-line tools only (no IDE): Download the SDK Command-Line Tools from the same page, then feed the versions from `android/build.gradle` to `sdkmanager`, e.g.:
```
sdkmanager "platforms;android-<compileSdk>" "build-tools;<buildToolsVersion>" "ndk;<ndkVersion>"
```

> Path A (EAS Cloud Build) sidesteps all of this — the build image already has the correct SDK, Build Tools, and NDK for SDK 56 preinstalled.

### 4. Environment variables

Set these in Windows system environment variables (or in your shell profile):

```
ANDROID_HOME = C:\Users\<you>\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT = C:\Users\<you>\AppData\Local\Android\Sdk   (alias, both required)
```

Add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
```

### 5. Build
```
npx expo run:android           # debug build, runs on connected device or emulator
npx expo run:android --variant release  # release build
```

Or eject to a bare Gradle project and build with Android Studio directly:
```
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

Output APK path: `android/app/build/outputs/apk/release/app-release.apk`

---

## Quick-start checklist (Path A — recommended)

```
[ ] Install Node.js LTS  →  winget install OpenJS.NodeJS.LTS
[ ] Clone repo and run:  npm install
[ ] Create a free account at expo.dev
[ ] expo.dev → Account Settings → Access Tokens → Create Token → copy it
[ ] Set token in your shell:
      PowerShell:  $env:EXPO_TOKEN = "your-token"
      bash/zsh:    export EXPO_TOKEN="your-token"
[ ] npx eas-cli@latest build --platform android --profile preview
[ ] Download the APK from the URL printed when the build finishes
```

> The EAS project ID is already committed in `app.json` — no `eas init` or project creation step required.

---

## Adding native dependencies during development

Always use `npx expo install <package>` — **not** `npm install` — when adding any native module (one that has an `android/` or `ios/` folder in its package). Expo's install command selects the version that is verified compatible with the current SDK, and automatically adds the package as a config plugin in `app.json` if needed.

```bash
# correct
npx expo install expo-camera

# wrong — may install an incompatible version that breaks the Gradle build
npm install expo-camera
```

`npm install` remains the right tool for pure JS packages and dev tools (TypeScript, Babel, etc.).

---

## Isolation options

If you want to avoid polluting your global system with Node, JDK, and Android SDK versions, or you want a reproducible environment anyone can clone and run:

---

### Option 1 — EAS Build (already isolates the Android side)

The cloud build runs on a pinned Linux image with the JDK and NDK that SDK 56 expects pre-installed. You still install Node locally, but you can pair it with a Node version manager (below) to keep that isolated too.

---

### Option 2 — Node version manager (partial isolation, local Node only)

Manages multiple Node versions side-by-side so this project's Node 22 doesn't affect other projects.

**On Windows:**

- **nvm-windows**: https://github.com/coreybutler/nvm-windows
  ```
  nvm install 22
  nvm use 22
  ```
  The `.nvmrc` file in this repo pins the version — `nvm use` with no argument reads it.

- **Volta**: https://volta.sh — sets per-project Node and npm versions automatically when you `cd` into the directory. No manual `use` command needed.
  ```
  volta install node@22
  ```

---

### Option 3 — Dev Container (full isolation, local or cloud)

A Dev Container runs the entire development environment inside Docker — Node, JDK, Android SDK, and all tools — without installing anything on your host machine except Docker Desktop.

**What you need on the host:**
- Docker Desktop for Windows (https://www.docker.com/products/docker-desktop)
- VS Code with the Dev Containers extension (ms-vscode-remote.remote-containers)

**How to use it:**

Open the repo in VS Code. If a `.devcontainer/` folder is present, VS Code will offer to reopen in the container. Everything inside the container is isolated and disposable — delete the container and nothing is left on your system.

A `.devcontainer/` configuration is not included in this repo yet, but can be added. The recommended base image for React Native Android is `mcr.microsoft.com/devcontainers/android` or a custom image built on `node:22` + `eclipse-temurin:17` + Android Command-Line Tools.

> **Note:** Running an Android emulator inside Docker on Windows requires hardware virtualisation passthrough, which is not well supported. Dev Containers work best for EAS cloud builds (Path A), where the container only needs Node and EAS CLI, not the full Android SDK.

---

### Option 4 — GitHub Codespaces (zero local install)

A Codespace is a Dev Container hosted by GitHub — nothing installed on your machine at all. Open the repo on GitHub, click **Code → Codespaces → New codespace**. Pair with EAS Build (Path A) for a completely cloud-to-cloud workflow.

---

## Summary table

| Tool | Required for | Version | Install |
|---|---|---|---|
| Node.js | Both paths | 22 LTS (20.19.4+ / 24.3.0+ also OK) | nodejs.org or nvm-windows |
| npm | Both paths | bundled with Node | — |
| EAS CLI | Path A | latest | `npx eas-cli@latest` (no install needed) |
| Expo account + token | Path A | — | expo.dev → Account Settings → Access Tokens |
| JDK | Path B | 17 | adoptium.net or Android Studio |
| Android SDK / Build Tools / NDK | Path B | per `android/build.gradle` (set by SDK 56 prebuild) | Android Studio / sdkmanager |
| Android Studio | Path B | optional | developer.android.com/studio |
| Docker Desktop | Option 3 isolation | any | docker.com |
