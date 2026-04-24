# Testing the Local Dev App on Your iPhone

A quick walkthrough to open your Mac's local dev server on your iPhone —
so you can try the camera capture, test mobile layout, or just see what
the form feels like on a real phone.

---

## The short version

1. Make sure iPhone and Mac are on the **same Wi-Fi**.
2. Find your Mac's LAN IP (example: `10.220.16.170`).
3. Tell the frontend to call the backend at that IP instead of `localhost`.
4. Restart the frontend.
5. On your iPhone, open Safari and go to `http://<your-mac-ip>:3000/hotz/form`.

That's it. The rest of this file is the longer version with screenshots-in-words
and what to do when something breaks.

---

## Why this extra setup?

When your iPhone loads `http://localhost:3000`, "localhost" means **the iPhone
itself**, not your Mac. Same with `localhost:3001` for the API.

So two things need to happen:

- Your phone has to connect to your **Mac's IP address** on the local network.
- The frontend app has to know to call the backend at that **same IP**, not
  `localhost`.

Your Mac is already configured correctly — the dev servers listen on all
network interfaces (not just localhost). You just need to tell the phone
*which* IP to reach, and update the frontend config so its API calls work
from the phone.

---

## Prerequisites

- ✅ iPhone and Mac connected to the same Wi-Fi network
- ✅ Mac's **backend** running on port 3001 (`npm run dev` in `backend/`)
- ✅ Mac's **frontend** running on port 3000 (`npm run dev` in `frontend/`)

If either server isn't running, start them in a terminal.

---

## Step 1 — Find your Mac's LAN IP

Open Terminal on your Mac and run:

```bash
ipconfig getifaddr en0
```

You should see something like `10.220.16.170` or `192.168.1.42`. That's
your Mac's IP on Wi-Fi.

> **If `en0` returns nothing**, try `ipconfig getifaddr en1`. `en0` is
> usually Wi-Fi on newer Macs, but some setups use `en1`.

> **Heads-up:** this IP can change when you reconnect to Wi-Fi or move
> networks. If your iPhone can't reach the app later, re-run this command
> to get the current IP.

Write it down — you'll use it twice.

---

## Step 2 — Point the frontend at your Mac's IP

Edit `frontend/.env.local`:

```bash
# Replace with your IP from Step 1
NEXT_PUBLIC_API_URL=http://10.220.16.170:3001/api
```

Save the file.

> If you don't want to edit files yourself, just ask Claude: *"set the
> frontend API URL to my Mac's LAN IP"* — I'll do it for you.

---

## Step 3 — Restart the frontend

Next.js reads `.env.local` once at startup, so you need to restart it for
the new URL to take effect.

In the terminal where the frontend is running, press `Ctrl+C` to stop it,
then start it again:

```bash
cd frontend
npm run dev
```

The backend does **not** need to be restarted — it doesn't care which URL
the frontend uses to call it.

---

## Step 4 — Allow incoming connections (first time only)

The first time something tries to connect to your Mac over the network,
macOS might show a dialog:

> *"Do you want the application 'node' to accept incoming network
> connections?"*

Click **Allow**. If you clicked Deny by mistake, go to
**System Settings → Network → Firewall → Options** and allow incoming
connections for `node`.

If no dialog appears, your firewall is already off or already allows it —
no action needed.

---

## Step 5 — Open the app on your iPhone

On your iPhone, open **Safari** (not Chrome — stick with Safari for iOS
testing since it's the system default and behaves most like production).

In the address bar, type:

```
http://10.220.16.170:3000/hotz/form
```

(Replace `10.220.16.170` with your actual IP from Step 1.)

If everything's wired up right, you'll see the HOTZ form just like on
your Mac, but rendered on your phone. 🎉

> **Safari will NOT auto-suggest "https://"** when you type a plain IP +
> port, so you're good. If you accidentally end up on `https://...`, the
> page won't load — delete the `s` and try again.

---

## Step 6 — Try the camera capture

1. Fill out the form through to **Step 5 — Final Details**.
2. Scroll down to the **"Dash summary photo (optional)"** section.
3. Tap the big 📷 **Take photo** button.
4. iOS opens the native Camera app with the **back camera** already
   selected (that's the `capture="environment"` hint doing its job).
5. Take a photo → tap "Use Photo".
6. Safari shows a brief "Compressing..." spinner.
7. A preview appears with a **file size label** ("Photo attached · 187 KB")
   and two buttons: **Retake** and **Remove**.
8. Tap **Submit Setup** at the bottom — the photo goes to the backend as
   part of the submission.

### After submitting

On your Mac (or on the iPhone if you prefer), log into the manager
dashboard and open that submission:

- You'll see a new **"Dash Summary"** section at the bottom with the photo.
- Tap/click the photo → it opens full-screen. Tap outside or press ESC
  to close.
- Click **PDF** on the submission → downloaded PDF includes the photo as
  the last section before the footer.

---

## When you're done testing

If you want to switch back to pure Mac development (so you don't have to
remember your IP), edit `frontend/.env.local` back to:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

…and restart the frontend again. Or leave it on the LAN IP — it also works
from your Mac, as long as the IP doesn't change.

---

## Troubleshooting

### "Can't connect to server" / page never loads on iPhone

1. **Same Wi-Fi?** Check Settings → Wi-Fi on your iPhone and compare
   against your Mac's Wi-Fi network (click the Wi-Fi icon in the menu bar).
2. **IP still the same?** Re-run `ipconfig getifaddr en0`. If the IP
   changed, update `.env.local` and restart the frontend.
3. **Firewall blocking?** System Settings → Network → Firewall → either
   turn it off for testing, or make sure `node` is in the allowed list.
4. **Typed `https://` by accident?** Remove the `s`. Local dev is plain
   HTTP.

### Page loads but "Network error" when I submit

This almost always means the **frontend** can load but the **API calls**
are still pointing at `localhost`. Double-check:

```bash
cat frontend/.env.local
```

It should show your Mac's LAN IP in `NEXT_PUBLIC_API_URL`, not `localhost`.
If it's still `localhost`, you forgot to save the file or didn't restart
the frontend. Redo Steps 2 and 3.

### Camera opens but photo never appears / compression hangs

iPhones up to ~iPhone 8 on old iOS versions can be slow to compress a
full-resolution photo in Safari. Wait 5–10 seconds. If it's genuinely
stuck, reload the page and try again. The `browser-image-compression`
library we're using is known to be reliable on iOS 15+ and modern hardware.

### I want to use my iPhone's camera without Wi-Fi

Not really possible with local dev — the iPhone needs to reach your Mac
somehow. If you're traveling and want to demo, the usual options are
(a) tether iPhone to Mac via USB and set up iPhone hotspot so both are on
the same network, or (b) deploy to a preview environment (Netlify Preview
branch) and access over cellular.

---

## Quick reference

| Thing | Value |
|---|---|
| Find Mac IP | `ipconfig getifaddr en0` |
| Frontend URL on iPhone | `http://<mac-ip>:3000/hotz/form` |
| Backend URL (frontend uses) | `http://<mac-ip>:3001/api` |
| File to edit | `frontend/.env.local` |
| Env key | `NEXT_PUBLIC_API_URL` |
| Restart required after edit? | Frontend yes, backend no |
| HTTPS required? | No — `capture="environment"` works over HTTP |
