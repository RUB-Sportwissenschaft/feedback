# Feedbackbogen Valmorel

## What This Is

Digitaler Feedbackbogen f&#x00fc;r die Schneesport-Exkursion Valmorel der RUB Sportwissenschaft. Ersetzt den bisherigen Papierbogen (Lehrgangskritik) durch eine mobile-optimierte Web-App. Studierende bewerten alle Aspekte der Ausfahrt auf einer Skala von 1&#x2013;8 mit optionalem Freitext. Design und Layout orientieren sich an der bestehenden Pr&#x00fc;fungs-App (`pruefung/index.html`).

## Core Value

Studierende k&#x00f6;nnen schnell und unkompliziert auf dem Handy ein vollst&#x00e4;ndiges Feedback zur Ausfahrt abgeben &#x2014; strukturiert genug f&#x00fc;r Auswertung, offen genug f&#x00fc;r echte R&#x00fc;ckmeldungen.

## Requirements

### Validated

(None yet &#x2014; ship to validate)

### Active

- [ ] Feedbackbogen mit allen Kategorien der alten Lehrgangskritik
- [ ] Bewertungsskala 1&#x2013;8 (1=sehr gut, 8=sehr schlecht), nur Endpunkte gelabelt
- [ ] Optionale Freitextfelder (pro Kategorie/Frage, individuell festgelegt)
- [ ] Gruppenauswahl Pflicht (Gruppe 1&#x2013;8, Snowboard 1&#x2013;2)
- [ ] Optionale Namenseingabe
- [ ] Ausbilder-Bewertung: 2 Ausbilder pro Team, automatisch anhand Gruppenwahl
- [ ] Mobile-optimiertes Layout (Touch-freundlich, schnelles Ausf&#x00fc;llen)
- [ ] Admin-Export als Excel (.xlsx)
- [ ] JSONBin v3 als Backend
- [ ] Design konsistent mit Pr&#x00fc;fungs-App (RUB-Fonts, Farbschema)

### Out of Scope

- Echtzeit-Dashboard &#x2014; Admin-Export reicht
- Login/Authentifizierung &#x2014; anonymer Zugang
- Mehrfach-Abgabe-Schutz &#x2014; Vertrauen reicht, kein Tracking
- Multi-Language &#x2014; nur Deutsch

## Context

**Vorlage:** `Lehrgangskritik Valmorel.doc` (Papierbogen seit 2002/03, reiner Freitext)

**Kategorien aus der Vorlage:**
1. Ausbildungsort
2. Kosten / Preis-Leistung
3. Kursinhalte (situatives/demonstratives K&#x00f6;nnen, Videoanalysen, Modellunterricht, Einsteigermethodik, Lehrkompetenz)
4. Organisation des Lehrgangs (Ausbilderwechsel/Teams, Informationen)
5. Zeitliche Belastung
6. Theorie (Pr&#x00e4;senzveranstaltungen + Moodle)
7. Pr&#x00fc;fung (Inhalte, Organisation, Testate, Lehr&#x00fc;bungen)
8. Einf&#x00fc;hrung Ski
9. Verschüttetensuche / Risikomanagement
10. Demonstratives K&#x00f6;nnen
11. Rahmenprogramm (H&#x00fc;ttenabend, Apr&#x00e8;s-Ski)
12. Reiseleitung / SkiBo Tours & Sports
13. Soziales Miteinander
14. Ausbilder (einzeln bewerten)

**Alle Inhalte bleiben erhalten**, werden aber logisch in Kategorien gruppiert und f&#x00fc;r Mobile reduziert.

**Gruppen:** Gruppe 1&#x2013;8 (Ski), Snowboard 1&#x2013;2

**Ausbilder-Teams (je 2 Gruppen):**
| Team | Gruppen | Ausbilder |
|------|---------|-----------|
| 1 | 1 + 2 | Kilian, Claudia |
| 2 | 3 + 4 | Michael, Annika |
| 3 | 5 + 6 | Arno, Batti |
| 4 | 7 + 8 | Tanne, Pablo |
| 5 | SB 1 + 2 | Adam, Kami |

**Ausbilder-Logik:** Studierende w&#x00e4;hlen ihre Gruppe &#x2192; App zeigt automatisch die 2 zugeh&#x00f6;rigen Ausbilder zur Einzelbewertung.

**Design-Referenz:** `pruefung/index.html` &#x2014; RUB-Fonts (RubFlama), Farbschema, Card-Layout, Single-File-Architektur.

## Constraints

- **Tech Stack**: Single-File HTML (wie Pr&#x00fc;fungs-App) &#x2014; GitHub Pages Hosting
- **Backend**: JSONBin v3 (neuer Bin f&#x00fc;r Feedback)
- **Fonts**: RubFlama als externe Dateien (wie pruefung/)
- **Mobile First**: Prim&#x00e4;r f&#x00fc;r Smartphone-Nutzung optimiert
- **Konventionen**: Emojis als HTML-Entities, Umlaute direkt UTF-8, kein Python

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Skala 1&#x2013;8 statt 1&#x2013;5 | Feinere Abstufung gew&#x00fc;nscht, konsistent mit Uni-Bewertungen | &#x2014; Pending |
| Nur Endpunkte labeln | Weniger visueller Clutter auf Mobile | &#x2014; Pending |
| Gruppe Pflicht, Name optional | Auswertung pro Gruppe m&#x00f6;glich, aber anonym | &#x2014; Pending |
| Ausbilder automatisch nach Gruppe | Verhindert Zuordnungsfehler, weniger Klicks | &#x2014; Pending |
| Design von Pr&#x00fc;fungs-App &#x00fc;bernehmen | Konsistentes Erscheinungsbild, bew&#x00e4;hrtes Layout | &#x2014; Pending |

---
*Last updated: 2026-03-24 after initialization*
