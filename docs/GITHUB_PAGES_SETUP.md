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

1. On GitHub, open your repo → **Settings**.
2. Left sidebar → **Pages** (under “Code and automation”).
3. **Build and deployment** → **Source**: choose **Deploy from a branch**.
4. **Branch**: `main`, folder **`/docs`** → **Save**.

Wait 1–3 minutes. The site will be at:

`https://anztothemoon.github.io/Facial-Optimisation-self-improvement-app/`

If you see a 404, wait a bit and hard-refresh. First deploy can take a few minutes.

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
