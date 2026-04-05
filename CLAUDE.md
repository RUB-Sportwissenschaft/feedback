# Feedback — CLAUDE.md

## Kontext

RUB Sportwissenschaft — Exkursionsreflexion (Lehrgangskritik) fuer die Schneesport-Exkursion Valmorel.
Betreuer: Kilian. Laeuft auf GitHub Pages. Backend: Supabase.

**Repo:** https://github.com/RUB-Sportwissenschaft/feedback
**Live:** https://rub-sportwissenschaft.github.io/feedback/
**Status:** Fertig — wird jaehrlich zur Exkursion reaktiviert.

## Projektstruktur

```
Feedback/
  index.html       Feedback-Formular (Multi-Step, 8 Sektionen)
  script.js        Logik + Supabase-Client
  style.css        Styling (RUB CD)
  admin.js         Admin-Auswertung
  summary.html     Statische Zusammenfassung (n=85)
  fonts/           RubFlama + RUB Scala MZ
  img/             Logos, Favicon
  supabase/        Migrations + Config
```

**Backend:** Supabase Projekt `yhymncieopgmqsmdybsl`
**Admin:** `?admin=true` — Auswertung mit Charts (Chart.js) + Excel-Export (SheetJS)
**Gruppen/Ausbilder:** `TEAM_MAP` in `script.js` ist Single Source of Truth
