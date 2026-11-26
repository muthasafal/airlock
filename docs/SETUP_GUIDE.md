# Airlock: setup and launch, step by step

Allow about 45 minutes, plus however long the video takes. Work through the steps in order. Every step happens in your browser, in Chrome on your laptop, or in a terminal opened in the `airlock` folder.

Project: **airlock-app**. Console: https://console.firebase.google.com/project/airlock-app

---

## Step 1. Register a Web app (5 min)

1. Open https://console.firebase.google.com/project/airlock-app/overview
2. Under the project name it says "Get started by adding Firebase to your app". Click the **`</>`** (Web) icon. If you don't see it, click the gear icon next to "Project Overview", then **Project settings**, scroll to **Your apps**, and click **`</>`**.
3. App nickname: `Airlock Web`. Tick **"Also set up Firebase Hosting for this app"**. Click **Register app**.
4. The next screen shows a code block with `const firebaseConfig = { apiKey: "...", authDomain: "...", ... }`. Keep this tab open, because you need these values in Step 6. Click **Next** through the remaining screens; you don't need to run the commands it shows.

## Step 2. Turn on Firebase AI Logic (3 min)

1. Open https://console.firebase.google.com/project/airlock-app/ailogic
   (or, in the left menu, open **AI** (or **Build**), then **AI Logic**).
2. Click **Get started**.
3. It asks you to choose a "Gemini API provider" and shows two cards. Choose **Gemini Developer API** (the one that says no billing needed), not "Vertex AI Gemini API".
4. Click **Enable API** (or **Continue**), and wait until it says it's set up. Firebase creates and manages the API key itself; you don't copy any key.

If the page shows no choice at all, AI Logic may already be enabled. Look for "Gemini Developer API: Enabled" on the AI Logic page. If it's there, you're done with this step.

## Step 3. Get a reCAPTCHA v3 key, for App Check (5 min)

1. Open https://www.google.com/recaptcha/admin/create
2. Label: `airlock`. Type: **Score based (v3)**.
3. Add these three domains, one at a time:
   - `localhost`
   - `airlock-app.web.app`
   - `airlock-app.firebaseapp.com`
4. Click **Submit**. You get two keys:
   - **Site key**: goes into `.env.local` in Step 6.
   - **Secret key**: goes into the Firebase console in the next step.

## Step 4. Turn on App Check (5 min)

1. Open https://console.firebase.google.com/project/airlock-app/appcheck
2. Click **Get started** if you see it. On the **Apps** tab, click **Airlock Web**, choose **reCAPTCHA**, paste the **secret key** from Step 3, and click **Save**.
3. **Don't click Enforce yet.** You enforce it in Step 8, after the debug token works.

## Step 5. Turn on Google sign-in and Firestore (for org mode, 4 min)

1. Open https://console.firebase.google.com/project/airlock-app/authentication
   - Click **Get started**, then **Sign-in method**, then **Google**. Turn on **Enable**, choose your email as the support email, and click **Save**.
2. Open https://console.firebase.google.com/project/airlock-app/firestore
   - Click **Create database**. For location, choose **asia-south1 (Mumbai)**. Choose **Start in production mode**, then click **Create**. Our own rules replace the defaults when you deploy in Step 11.

## Step 6. Create `apps/web/.env.local` (3 min)

In the `airlock` folder, create the file `apps/web/.env.local` (inside `apps/web`, not at the root). Fill it with the values from Step 1 and Step 3:

```
VITE_FIREBASE_API_KEY=<apiKey from Step 1>
VITE_FIREBASE_AUTH_DOMAIN=airlock-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=airlock-app
VITE_FIREBASE_STORAGE_BUCKET=<storageBucket from Step 1>
VITE_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId from Step 1>
VITE_FIREBASE_APP_ID=<appId from Step 1>
VITE_RECAPTCHA_SITE_KEY=<site key from Step 3>
```

This file is in `.gitignore`, so it never gets committed. The web config is public by design; App Check is what protects it.

## Step 7. Check Gemini Nano in Chrome (3 min)

1. In Chrome, open `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`, set it to **Enabled**, and click **Relaunch**.
2. Check the Chrome version at `chrome://settings/help`. It must be 139 or later (yours is 158).

## Step 8. Run it and register the App Check debug token (5 min)

1. In a terminal in the `airlock` folder, run `npm run dev`.
2. Open http://localhost:5173/chat in Chrome.
3. Press **F12**, then open the **Console** tab. Find the line that says:
   `App Check debug token: xxxxxxxx-xxxx-.... You will need to add it to your app's App Check settings`
   Copy that token.
4. Open https://console.firebase.google.com/project/airlock-app/appcheck. On the **Apps** tab, click the **three dots** next to Airlock Web, then **Manage debug tokens**, then **Add debug token**. Paste the token, name it `laptop`, and click **Save**.
5. Now enforce it. Open the **APIs** tab, find **Firebase AI Logic**, click **Enforce**, and confirm.
6. Reload the chat page. The status should now say **"On-device protection is ready"**.
   - If it says "ready to download", click **Enable on-device protection** and wait for 100%.

## Step 9. Check the full flow (5 min)

Use fictional data only. In `/chat`:

1. **Cloud flow.** Paste:
   `Hi Priya Shah at Acme Corp, please tell her the salary review moved to Friday and email priya.shah@acme.com.`
   Send it, and set **Answer on** to **Let Airlock decide**. Check:
   - you see the chamber animation;
   - the "What was sent" view shows stand-in names;
   - the answer comes back with Priya restored;
   - the restored names are highlighted.
2. **Local flow.** Send: `Rewrite this more politely: tell Rohan the report is late.`
   It should say **"Stayed on your device"**.
3. **Receipt.** Open `/receipts`. Each entry should show `detection: ON_DEVICE`, plus `answer: IN_CLOUD` (step 1) or `answer: ON_DEVICE` (step 2).

If anything shows an error, copy the red text from the F12 Console and send it to Claude.

## Step 10. Run the benchmark with Nano (3 min)

1. Open http://localhost:5173/bench and click **Run benchmark**. The Rules + Nano column now has numbers.
2. Click **Download results as JSON** and send the file (or a screenshot) to Claude, who will update the README table.

## Step 11. Deploy (5 min)

In the terminal, stop the dev server with **Ctrl+C**, then run:

```
npm run build
firebase deploy --only hosting,firestore:rules --project airlock-app
```

When it finishes, it prints **Hosting URL: https://airlock-app.web.app**. Open that URL in Chrome and repeat a quick check from Step 9.

- On the live site, App Check uses reCAPTCHA instead of the debug token, which is why you added `airlock-app.web.app` in Step 3.
- If Google sign-in fails on the live site, open **Authentication**, then **Settings**, then **Authorized domains**, and check that `airlock-app.web.app` is listed.

## Step 12. Tag the submission (1 min)

```
git tag firebase-submission
git push origin firebase-submission
```

Also open https://github.com/muthasafal/airlock, click the gear next to **About**, and add the website `https://airlock-app.web.app`. GitHub already shows the Apache-2.0 license there.

## Step 13. Record the video (3 minutes or less)

**Tool:** OBS Studio (installed) or the Windows Snipping Tool's record mode. Record your Chrome window and talk over it.

**Script (BRIEF §13), all with fictional data:**

| Time | Show |
|---|---|
| 0:00 to 0:15 | Say: "Every day people paste secrets into AI. Companies either ban it, or send your secrets to yet another cloud to check them." |
| 0:15 to 1:20 | Paste a fictional HR email into /chat. Show the chamber, the stand-ins flipping, and the answer streaming back with real names. Open the receipt: "What left your device". |
| 1:20 to 1:45 | Turn Wi-Fi off. Send a short rewrite: it's answered on the device, and the outer door never opens. |
| 1:45 to 2:10 | /clipboard: clean and copy, paste into another AI tool (blur its logo), paste the answer back, Restore. |
| 2:10 to 2:35 | /org: add "Project Falcon" as a protected term, show it being caught, then show the counts-only stats. |
| 2:35 to 3:00 | /bench table, the README architecture diagram, "Built with Kiro and Firebase AI Logic". |

Upload it to YouTube as **Public** or **Unlisted** (English, under 3:00) and copy the link.

## Step 14. Submit on Devpost (before Dec 1, 3:30 AM IST)

You need:
- the repo URL;
- the hosted URL;
- the YouTube link;
- the platform: **Web**;
- the description, built from the README sections "Why", "Features" and "How Firebase AI Logic is used".

Ask Claude to draft the description text if you want it.
