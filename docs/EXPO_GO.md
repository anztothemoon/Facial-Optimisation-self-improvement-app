# Expo Go: QR code & connection

## “No usable data found” when scanning

The **system Camera** app (iOS/Android) often **cannot** open `exp://…` links from a QR code. That message is normal if you scan with the wrong app.

**Do this instead:**

1. Install **Expo Go** from the App Store / Play Store.
2. Open **Expo Go** (not the phone camera).
3. On the **Home** tab, tap **Scan QR code** (or **Enter URL**).
4. Scan the QR shown in the terminal or browser Dev Tools.

If you use the camera app, it may not recognize the Expo QR as actionable.

## Still failing? Use tunnel mode

From `frontend/`:

```bash
npm run start:tunnel
```

Tunnel uses Expo’s relay so your phone does not need to reach your PC’s LAN IP. First run may ask you to log in (`npx expo login`). Use this on strict Wi‑Fi, VPNs, or when a firewall blocks port 8081.

## Same Wi‑Fi + API URL

The app must reach your backend. In `frontend/.env`, set:

`EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:3001`

Use your PC’s IPv4 (e.g. `192.168.1.10`), not `localhost`, when testing on a **physical phone**.

## Windows firewall

The first time Node listens on 8081, Windows may ask to allow **private networks** — allow it, or Expo Go cannot load the bundle.

## Start everything from repo root

From `app-starter/`:

```bash
npm install
npm run dev
```

This runs the backend (`node --watch`) and Expo together. Stop with Ctrl+C once (both stop).

## “Opening…” for a long time

The **first** open after `expo start` can take **1–3+ minutes** while Metro builds and sends the JavaScript bundle (especially on Wi‑Fi). That can look stuck — often it is still working.

**Speed it up / fix hangs:**

1. **Update Expo Go** on the phone to the latest version (must match SDK 54).
2. **Same Wi‑Fi** as the PC — not guest network, not mobile data hotspot unless you know port forwarding.
3. **Windows:** allow **Node.js** through the firewall for **Private** networks; temporarily disable VPN on PC and phone.
4. Clear cache and restart: `cd frontend && npm run start:clear` (or `npx expo start --clear`).
5. If LAN is flaky, try **tunnel**: `npm run start:tunnel` (first time may ask for `npx expo login`).
6. **Android + USB:** `adb reverse tcp:8081 tcp:8081` then in Expo Go use `exp://127.0.0.1:8081` (USB debugging on).
7. Leave it on the “Opening…” screen **at least 3–5 minutes** once before assuming failure; watch the PC terminal for `Bundling` / `Building` lines.

If the terminal shows errors while bundling, fix those first — the phone will wait forever until Metro succeeds.
