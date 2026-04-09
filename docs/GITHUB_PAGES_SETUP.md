# GitHub Pages — free site for your app (privacy, terms, landing)

This folder contains a **static** mini-site: `index.html`, `privacy.html`, `terms.html`, and `css/site.css`.

**This project is configured for:**

```text
https://anztothemoon.github.io/Facial-Optimisation-self-improvement-app/
https://anztothemoon.github.io/Facial-Optimisation-self-improvement-app/privacy.html
https://anztothemoon.github.io/Facial-Optimisation-self-improvement-app/terms.html
```

---

## Step 1 — Push this repo to GitHub

1. Create a new repository on [GitHub](https://github.com/new) (e.g. `looksmax-pro` or `app-starter`).
2. If the project isn’t a git repo yet, in the project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/anztothemoon/Facial-Optimisation-self-improvement-app.git
git push -u origin main
```

(Use GitHub Desktop or Cursor’s Source Control if you prefer a GUI.)

---

## Step 2 — Turn on GitHub Pages

### Fastest: open Pages settings directly

Use this link (same place as “Build and deployment”; GitHub sometimes hides the wording):

**[→ Pages settings for this repo](https://github.com/anztothemoon/Facial-Optimisation-self-improvement-app/settings/pages)**

1. Sign in if asked.
2. Under **“GitHub Pages”** (top of the page), find the **source** controls:
   - If you see **“GitHub Actions”** selected, switch to **“Deploy from a branch”** (or **“Branch”** only — depends on GitHub’s layout).
   - **Branch**: choose **`main`**, then choose folder **`/docs`** (not `/ root`).
3. Click **Save** (or **Save** next to the branch row).

If you do not see **Pages** in the left sidebar: open **Settings** on the repo (tab next to *Insights*), scroll the **left** menu to **“Code and automation”**, then **Pages**. You must be logged in as someone with **admin** on the repo.

Wait 1–3 minutes. The site will be at:

`https://anztothemoon.github.io/Facial-Optimisation-self-improvement-app/`

If you see a 404, wait and hard-refresh. First deploy can take a few minutes.

### Automate (no clicking) — API script

From the project root in PowerShell, with a [classic token](https://github.com/settings/tokens) that has the **`repo`** scope:

```powershell
$env:GITHUB_TOKEN = "ghp_xxxxxxxx"   # your PAT; do not commit this
.\scripts\enable-github-pages.ps1
```

This calls GitHub’s API to publish from **`main`** + **`/docs`**. Fine-grained tokens work if they include **Administration** on this repository.

---

## Automation for Cursor / assistants

- **This repo** includes `scripts/enable-github-pages.ps1` so you (or an agent) can enable Pages after setting `GITHUB_TOKEN` once in the shell.
- **GitHub CLI** (`gh`): install from [cli.github.com](https://cli.github.com/) — then `gh auth login` and you can script `gh api` similarly.
- **MCP in Cursor**: In Cursor Settings → **MCP**, you can add servers (e.g. community **GitHub MCP**) so tools can call the API with a configured token — useful for “do it for me” workflows. Cursor does not ship GitHub Pages toggles in the core product; a PAT + script or MCP is the usual approach.

---

## Step 3 — Edit the HTML before you rely on it

Open in the repo (or locally):

- `docs/index.html` — landing + contact email
- `docs/privacy.html` — replace `REPLACE_WITH_DATE`, `REPLACE_WITH_COMPANY_NAME`, `support@example.com`
- `docs/terms.html` — same

Then commit and push again; Pages will update automatically.

---

## Step 4 — Point your Expo app at these URLs

In `frontend/.env`:

```env
EXPO_PUBLIC_PRIVACY_URL=https://anztothemoon.github.io/Facial-Optimisation-self-improvement-app/privacy.html
EXPO_PUBLIC_TERMS_URL=https://anztothemoon.github.io/Facial-Optimisation-self-improvement-app/terms.html
EXPO_PUBLIC_COMPANY_NAME=Anz To The Moon
EXPO_PUBLIC_SUPPORT_EMAIL=
```
(Add `EXPO_PUBLIC_SUPPORT_EMAIL` when you have a real inbox.)

Rebuild/restart Expo so env vars load.

---

## Optional: custom domain later

If you buy a domain later, you can add it in **Pages** settings and keep the same HTML files.

---

## Note

The privacy/terms text is **not legal advice**. For App Store review or a sale, get templates reviewed or replaced by a professional for your country.
