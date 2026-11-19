# Desktop Build & Packaging Guide

This document describes how to package the **Public Grievance Redressal System** desktop application using Electron and electron-builder.

---

## 1. Prerequisites

- **Node.js 20+** installed.
- Dependencies installed in all directories:
  ```bash
  cd server && npm install
  cd ../client && npm install
  cd ../desktop && npm install
  ```

---

## 2. Development Mode

To run the desktop application in live development mode (connected to the Vite dev server with hot module replacement):

1. **Start the backend server:**
   ```bash
   cd server
   node server.js
   ```

2. **Start the React client dev server:**
   ```bash
   cd client
   npm run dev
   ```

3. **Launch the Electron desktop shell:**
   ```bash
   cd desktop
   npm run dev
   ```

---

## 3. Production Build Flow

The production build compiles the React application into static HTML/CSS/JS with `base: './'` under `HashRouter`, copies the output to `desktop/dist`, and packages native platform installers.

### Step 1: Build the React Client

Ensure `client/.env` (or `client/.env.production`) points to your production or target backend URL:
```bash
# In client/
npm run build
```

### Step 2: Copy Client Output to Desktop

Run the cross-platform copy script:
```bash
# In desktop/
npm run copy-client
```
*(This recursively syncs `client/dist` into `desktop/dist`)*

### Step 3: Package Native Installers

#### On macOS (generates `.dmg`):
```bash
# In desktop/
npm run build:mac
```
The installer will be placed in `desktop/release/`:
- `Grievance Tracker-<version>.dmg`

#### On Windows (generates `.exe` via NSIS):
```bash
# On a Windows host machine:
cd desktop
npm run build:win
```
The installer will be placed in `desktop/release/`:
- `Grievance Tracker Setup <version>.exe`

---

## 4. Unsigned Installer Instructions

The generated installers are built for educational and demonstration purposes and are **not code-signed** with commercial developer certificates. Standard OS warnings will appear upon initial launch:

| Platform | System Warning | Resolution |
| :--- | :--- | :--- |
| **macOS** | Gatekeeper: *"App can't be opened because it is from an unidentified developer"* | **Right-click** (or Control-click) `Grievance Tracker.app` &rarr; click **Open** &rarr; click **Open** in confirmation. |
| **Windows** | SmartScreen: *"Windows protected your PC"* | Click **More info** &rarr; click **Run anyway**. |

---

## 5. Security & Architecture Notes

- **`contextIsolation: true`** is enforced in `desktop/main.js` to ensure the renderer process cannot access Node.js APIs or native OS primitives directly.
- **`sandbox: true`** restricts Chromium renderer execution.
- External URLs (`http:`, `https:`, `mailto:`) are intercepted and delegated to the user's default external web browser (`shell.openExternal`).
- In-app navigation to arbitrary foreign origins is strictly blocked via `will-navigate`.
