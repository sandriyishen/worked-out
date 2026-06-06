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

### Node.js 20 LTS

**Version:** 20.x (minimum 18.18; 20 recommended — this is what EAS Build servers run)

Install via the Windows installer from https://nodejs.org, or use a version manager (see Isolation below). npm is bundled with Node — no separate install needed.

Verify:
```
node --version   # should print v20.x.x
npm --version    # should print 10.x.x
```

A `.nvmrc` file at the root of this repo pins the version for tools that respect it.

### Git

Already required to clone the repo. Verify with `git --version`.

---

## Path A — EAS Cloud Build

Expo's build service compiles the APK in a managed Linux container. You only need local tooling to submit the code.

### 1. Install project dependencies
```
npm install
```

### 2. Install EAS CLI globally
```
npm install -g eas-cli
```
Current version in use: **14.x** (check with `eas --version`; any 14.x works).

### 3. Create a free Expo account
Sign up at https://expo.dev. Log in with:
```
eas login
```

### 4. Build
```
eas build --platform android --profile preview   # unsigned APK for sideloading
eas build --platform android --profile production # signed AAB for Play Store
```

EAS downloads the finished APK/AAB URL when done. No Java, no Android SDK, no Gradle needed locally.

---

## Path B — Local Build

Requires the full Android toolchain on your machine.

### 1. Install project dependencies
```
npm install
```

### 2. Java Development Kit 17

**Exact version:** JDK 17 (not 11, not 21 — RN 0.76 requires 17).

Options:
- Microsoft Build of OpenJDK 17: https://www.microsoft.com/openjdk (recommended on Windows)
- Adoptium Temurin 17: https://adoptium.net
- Or via Chocolatey: `choco install temurin17`

Verify: `java -version` → `openjdk 17.x.x`

Set `JAVA_HOME` to the JDK root if the installer doesn't do it automatically.

### 3. Android SDK

**Minimum required components:**

| Component | Version |
|---|---|
| Android SDK Platform | API 34 |
| Android Build Tools | 34.0.0 |
| Android NDK | 26.1.10909125 |
| Android SDK Command-Line Tools | latest |
| Android Emulator | optional (for running in emulator) |

**How to install:**

Option 1 — Android Studio (easiest): Download from https://developer.android.com/studio. The installer handles SDK, Build Tools, and NDK automatically via the SDK Manager.

Option 2 — Command-line tools only (no IDE): Download the SDK Command-Line Tools from the same page, then use `sdkmanager`:
```
sdkmanager "platforms;android-34" "build-tools;34.0.0" "ndk;26.1.10909125"
```

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
[ ] Install Node.js 20 LTS
[ ] Clone repo
[ ] npm install
[ ] npm install -g eas-cli
[ ] eas login
[ ] eas build --platform android --profile preview
```

---

## Isolation options

If you want to avoid polluting your global system with Node, JDK, and Android SDK versions, or you want a reproducible environment anyone can clone and run:

---

### Option 1 — EAS Build (already isolates the Android side)

The cloud build runs on a pinned Ubuntu 22.04 image with JDK 17 and NDK 26.1.10909125 pre-installed. You still install Node locally, but you can pair it with a Node version manager (below) to keep that isolated too.

---

### Option 2 — Node version manager (partial isolation, local Node only)

Manages multiple Node versions side-by-side so this project's Node 20 doesn't affect other projects.

**On Windows:**

- **nvm-windows**: https://github.com/coreybutler/nvm-windows
  ```
  nvm install 20
  nvm use 20
  ```
  The `.nvmrc` file in this repo pins the version — `nvm use` with no argument reads it.

- **Volta**: https://volta.sh — sets per-project Node and npm versions automatically when you `cd` into the directory. No manual `use` command needed.
  ```
  volta install node@20
  ```

---

### Option 3 — Dev Container (full isolation, local or cloud)

A Dev Container runs the entire development environment inside Docker — Node, JDK, Android SDK, and all tools — without installing anything on your host machine except Docker Desktop.

**What you need on the host:**
- Docker Desktop for Windows (https://www.docker.com/products/docker-desktop)
- VS Code with the Dev Containers extension (ms-vscode-remote.remote-containers)

**How to use it:**

Open the repo in VS Code. If a `.devcontainer/` folder is present, VS Code will offer to reopen in the container. Everything inside the container is isolated and disposable — delete the container and nothing is left on your system.

A `.devcontainer/` configuration is not included in this repo yet, but can be added. The recommended base image for React Native Android is `mcr.microsoft.com/devcontainers/android` or a custom image built on `node:20` + `eclipse-temurin:17` + Android Command-Line Tools.

> **Note:** Running an Android emulator inside Docker on Windows requires hardware virtualisation passthrough, which is not well supported. Dev Containers work best for EAS cloud builds (Path A), where the container only needs Node and EAS CLI, not the full Android SDK.

---

### Option 4 — GitHub Codespaces (zero local install)

A Codespace is a Dev Container hosted by GitHub — nothing installed on your machine at all. Open the repo on GitHub, click **Code → Codespaces → New codespace**. Pair with EAS Build (Path A) for a completely cloud-to-cloud workflow.

---

## Summary table

| Tool | Required for | Version | Install |
|---|---|---|---|
| Node.js | Both paths | 20 LTS | nodejs.org or nvm-windows |
| npm | Both paths | bundled with Node | — |
| EAS CLI | Path A | 14.x | `npm i -g eas-cli` |
| Expo account | Path A | — | expo.dev |
| JDK | Path B | 17 | adoptium.net or Android Studio |
| Android SDK Platform | Path B | API 34 | Android Studio / sdkmanager |
| Android Build Tools | Path B | 34.0.0 | Android Studio / sdkmanager |
| Android NDK | Path B | 26.1.10909125 | Android Studio / sdkmanager |
| Android Studio | Path B | optional | developer.android.com/studio |
| Docker Desktop | Option 3 isolation | any | docker.com |
