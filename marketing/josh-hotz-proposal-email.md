**Subject:** Karting Setup Management App — Proposal for Your Team

---

Hi Josh,

It was great meeting you. As promised, here's a quick overview of the Karting Setup Management app I've built and how it can help your team at the track.

### What the app does

The app replaces printed setup sheets with a structured digital workflow:

- **Setup form.** Drivers or mechanics fill in a guided 5-step form (Driver Info → Engine → Tyres → Kart Setup → Final Details) on any phone, tablet, or laptop. The form auto-prefills with the driver's last submission, so repeat entries take seconds. If nothing changed, the driver just confirms and adds lap time and notes.

- **Manager dashboard.** Real-time view of every submission, searchable by driver, track, session, championship, or division. Mark favorites, compare across sessions, and export any entry as a PDF branded with your team's logo, colors, and language.

- **Instant notifications.** Every time a setup is submitted, you and any managers you add receive an email with the full details and a link to the dashboard — no more chasing paperwork between sessions.

- **Per-driver history, forever.** Every submission is stored permanently and tied to the driver's email. When a driver returns to a track months later, you can pull up exactly what they ran last time in seconds.

**Bottom line at the track:** no printed sheets in the paddock, no re-entering the same baseline every session, no lost data when a mechanic changes teams, and no delay between a driver finishing a session and you seeing their setup.

### How your data is stored

All data lives in a managed PostgreSQL database hosted on Supabase, a secure cloud provider trusted by thousands of companies. Each team's data is fully isolated — no other team on the platform can see your information. The database is locked down so I cannot modify or delete data arbitrarily; changes only happen through the app itself, under your control. Automatic backups are included.

### Setup fields available today

The form captures the fields below. Anything here can be hidden, renamed, or replaced to fit how your team works, and we can add new fields specific to your chassis, engine package, or data workflow.

- **Driver & session:** name, email, session type, track, layout, championship, division, class code
- **Engine:** engine number, gear ratio or drive/driven sprocket, carburator number, sparkplug type and gap, session laps
- **Tyres:** model, age, cold pressure
- **Chassis:** chassis model, axle and axle size, rear hubs (material + length), rear track width, front/back height, front hubs (material + length), front bar, spindle, caster, camber, seat position and inclination, front wheel type (Mini/Micro)
- **Final details:** lap time, observations

If there's anything you'd like added, removed, or renamed, that's exactly the kind of customization I'll handle for you.

### Managing your team

In the Settings tab, you can add your own managers directly — enter their name and email, and the app sends a welcome message for them to set a password. Every manager you add automatically receives submission notifications. You stay in control of access at all times.

### Investment

- **Development & customization:** $150 per hour. Covers the initial setup of your branded instance (logo, colors, language, field customization, manager accounts) and any future changes.
- **Database subscription:** $120 per year (billed annually, roughly $10/month). Covers the secure cloud database, backups, and hosting.

No other recurring fees — just the yearly database cost plus any development hours you request.

### A few questions before we start

To tailor the app to your team, I'd like to know:

1. **Championships** — which series does your team compete in regularly?
2. **Divisions** — which classes do your drivers run?
3. **Tracks** — which tracks do you visit most often throughout the season?

I've attached an Excel file (**north-america-options.xlsx**) listing every championship, division, and track currently configured for North America. Please review it and let me know which ones you want to keep, which to remove, and what we should add so your dropdowns match exactly how your team operates.

### Next step

If this sounds like a fit, I'd be happy to jump on a short call to walk through the app live and answer any questions. Let me know what works for your schedule.

Thanks for considering it, Josh.

Best regards,

**Lucas Nogueira**
Overcut Academy
[overcutacademy.com](https://overcutacademy.com)
