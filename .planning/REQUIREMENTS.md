# Requirements: Feedbackbogen Valmorel

**Defined:** 2026-03-24
**Core Value:** Studierende k&#x00f6;nnen schnell und unkompliziert auf dem Handy ein vollst&#x00e4;ndiges Feedback zur Ausfahrt abgeben

## v1 Requirements

### Formular-Basis

- [x] **FORM-01**: User muss Gruppe ausw&#x00e4;hlen (Gruppe 1&#x2013;8, Snowboard 1&#x2013;2)
- [x] **FORM-02**: User kann optional Namen eingeben
- [x] **FORM-03**: Fortschrittsanzeige zeigt aktuelle Sektion und Gesamtfortschritt
- [x] **FORM-04**: Mobile-optimiertes Layout (min 375px, Touch-Targets 44px)

### Bewertung

- [x] **RATE-01**: Skala 1&#x2013;5 als Radio-Buttons (1=negativ, 5=positiv), nur Endpunkte gelabelt, individuelle Labels pro Frage
- [x] **RATE-02**: Freitextfeld pro Sektion erscheint automatisch wenn mindestens eine Frage mit 1 oder 2 bewertet wurde (Ausf&#x00fc;llen optional)
- [x] **RATE-03**: Sonderfall S4-02: Freitext bei beiden Extremen (1+2 und 4+5), nur 3 triggert nicht
- [x] **RATE-04**: Allgemeines Freitextfeld am Ende des Bogens
- [x] **RATE-05**: Freitext-Prompt: &#x201e;Wenn du etwas in dieser Sektion negativ bewertet hast, sage uns kurz warum&#x201c;

### S1 &#x2014; Rahmenbedingungen

- [x] **S1-01**: Ausbildungsort bewerten *(Unterkunft, Skigebiet, Lage)* &#x2014; schlecht&#x2192;sehr gut
- [x] **S1-02**: Kosten/Preis-Leistung bewerten &#x2014; zu teuer&#x2192;angemessen
- [x] **S1-03**: Reiseleitung/SkiBo Tours bewerten *(Reiseabwicklung, Kundenservice, Vor-Ort-Betreuung)* &#x2014; schlecht&#x2192;sehr gut

### S3 &#x2014; Organisation

- [x] **S3-01**: Organisation des Lehrgangs bewerten *(Ablauf, Kommunikation, Zeitplanung)* &#x2014; schlecht&#x2192;sehr gut
- [x] **S3-02**: Zeitliche Belastung bewerten &#x2014; zu hoch&#x2192;angemessen

### S2 &#x2014; Ausbildung

- [x] **S2-01**: Situatives und demonstratives K&#x00f6;nnen bewerten &#x2014; schlecht&#x2192;sehr gut
- [x] **S2-02**: Eigene Lehrkompetenz / Lehr&#x00fc;bungen bewerten &#x2014; schlecht&#x2192;sehr gut
- [x] **S2-03**: Modellunterricht durch Ausbilder bewerten &#x2014; schlecht&#x2192;sehr gut
- [x] **S2-04**: Einsteigermethodik bewerten &#x2014; schlecht&#x2192;sehr gut
- [x] **S2-05**: Videoanalysen bewerten &#x2014; schlecht&#x2192;sehr gut
- [x] **S2-06**: Schnee-Event bewerten &#x2014; schlecht&#x2192;sehr gut
- [x] **S2-07**: Versch&#x00fc;ttetensuche/Risikomanagement bewerten &#x2014; schlecht&#x2192;sehr gut

### S4 &#x2014; Pr&#x00fc;fung

- [x] **S4-01**: Pr&#x00fc;fung Organisation bewerten &#x2014; schlecht&#x2192;sehr gut
- [x] **S4-02**: Pr&#x00fc;fungsanforderungen bewerten &#x2014; zu leicht&#x2192;zu schwierig (Mitte 3=genau richtig)
- [x] **S4-03**: Klarheit der Pr&#x00fc;fungsanforderungen bewerten &#x2014; unklar&#x2192;sehr klar

### S5 &#x2014; Soziales und Rahmenprogramm

- [x] **S5-01**: H&#x00fc;ttenabend bewerten &#x2014; schlecht&#x2192;sehr gut
- [x] **S5-02**: Apr&#x00e8;s-Ski bewerten &#x2014; schlecht&#x2192;sehr gut
- [x] **S5-03**: Soziales Miteinander bewerten &#x2014; schlecht&#x2192;sehr gut

### S6 &#x2014; Ausbilder

- [x] **S6-01**: App zeigt automatisch die 2 Ausbilder passend zur gew&#x00e4;hlten Gruppe
- [x] **S6-02**: Jeder Ausbilder wird per Pflicht-Freitext bewertet (keine Skala)

### Backend und Submission

- [x] **BACK-01**: Daten werden in JSONBin v3 gespeichert (UUID-keyed, kein Array)
- [x] **BACK-02**: Submit-Button mit Loading-State und Fehlerhandling/Retry
- [x] **BACK-03**: Best&#x00e4;tigungsseite nach erfolgreicher Abgabe

### Admin

- [x] **ADM-01**: Admin-View via ?admin=true mit Inline-Dashboard
- [x] **ADM-02**: Teilnehmeranzahl gesamt und pro Gruppe
- [x] **ADM-03**: Durchschnittswerte pro Frage (alle 14 bewerteten Items)
- [x] **ADM-04**: Durchschnittswerte pro Gruppe (Gruppenvergleich)
- [x] **ADM-05**: Freitextantworten gesammelt pro Sektion einsehbar
- [ ] **ADM-06**: Excel-Export (.xlsx) mit Einzelantworten und Zusammenfassung

### Design

- [x] **DES-01**: Design konsistent mit Pr&#x00fc;fungs-App (RubFlama-Fonts, Farbschema, Card-Layout)
- [x] **DES-02**: Single-File-Architektur (HTML mit externen Fonts)

## Formular-Reihenfolge

S1 (Rahmenbedingungen) &#x2192; S3 (Organisation) &#x2192; S2 (Ausbildung) &#x2192; S4 (Pr&#x00fc;fung) &#x2192; S5 (Soziales) &#x2192; S6 (Ausbilder) &#x2192; Allgemeines Freitext &#x2192; Submit

## Skalen-Referenz

| Item | 1 (negativ) | 5 (positiv) | Sonder |
|------|-------------|-------------|--------|
| S1-01 Ausbildungsort | schlecht | sehr gut | |
| S1-02 Kosten | zu teuer | angemessen | |
| S1-03 SkiBo Tours | schlecht | sehr gut | |
| S3-01 Organisation | schlecht | sehr gut | |
| S3-02 Zeitl. Belastung | zu hoch | angemessen | |
| S2-01 bis S2-07 | schlecht | sehr gut | |
| S4-01 Pr&#x00fc;fung Orga | schlecht | sehr gut | |
| S4-02 Anforderungen | zu leicht | zu schwierig | 3=genau richtig |
| S4-03 Klarheit | unklar | sehr klar | |
| S5-01 bis S5-03 | schlecht | sehr gut | |

## Erkl&#x00e4;rende Unterzeilen

| Item | Unterzeile |
|------|-----------|
| S1-01 Ausbildungsort | Unterkunft, Skigebiet, Lage |
| S1-03 SkiBo Tours | Reiseabwicklung, Kundenservice, Vor-Ort-Betreuung |
| S3-01 Organisation | Ablauf, Kommunikation, Zeitplanung |

## v2 Requirements

### Erweiterungen

- **EXT-01**: Echtzeit-Dashboard mit Live-Ergebnissen
- **EXT-02**: Mehrfach-Abgabe-Schutz

## Out of Scope

| Feature | Reason |
|---------|--------|
| Login/Authentifizierung | Anonymer Zugang bevorzugt |
| Mehrfach-Abgabe-Schutz | Vertrauen reicht, ~80 Studierende |
| Multi-Language | Nur Deutsch n&#x00f6;tig |
| Echtzeit-Dashboard | Admin-Export reicht |
| Theorie/Moodle als Kategorie | Nicht mehr relevant |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORM-01 | Phase 1 | Done (01-01) |
| FORM-02 | Phase 1 | Done (01-01) |
| FORM-03 | Phase 1 | Done (01-01) |
| FORM-04 | Phase 1 | Done (01-01) |
| S1-01 | Phase 1 | Complete |
| S1-02 | Phase 1 | Complete |
| S1-03 | Phase 1 | Complete |
| S2-01 | Phase 1 | Complete |
| S2-02 | Phase 1 | Complete |
| S2-03 | Phase 1 | Complete |
| S2-04 | Phase 1 | Complete |
| S2-05 | Phase 1 | Complete |
| S2-06 | Phase 1 | Complete |
| S2-07 | Phase 1 | Complete |
| S3-01 | Phase 1 | Complete |
| S3-02 | Phase 1 | Complete |
| S4-01 | Phase 1 | Complete |
| S4-02 | Phase 1 | Complete |
| S4-03 | Phase 1 | Complete |
| S5-01 | Phase 1 | Complete |
| S5-02 | Phase 1 | Complete |
| S5-03 | Phase 1 | Complete |
| DES-01 | Phase 1 | Done (01-01) |
| DES-02 | Phase 1 | Done (01-01) |
| RATE-01 | Phase 2 | Complete |
| RATE-02 | Phase 2 | Complete |
| RATE-03 | Phase 2 | Complete |
| RATE-04 | Phase 2 | Complete |
| RATE-05 | Phase 2 | Complete |
| S6-01 | Phase 2 | Complete |
| S6-02 | Phase 2 | Complete |
| BACK-01 | Phase 3 | Complete |
| BACK-02 | Phase 3 | Complete |
| BACK-03 | Phase 3 | Complete |
| ADM-01 | Phase 4 | Complete |
| ADM-02 | Phase 4 | Complete |
| ADM-03 | Phase 4 | Complete |
| ADM-04 | Phase 4 | Complete |
| ADM-05 | Phase 4 | Complete |
| ADM-06 | Phase 4 | Pending |

**Coverage:** 40/40 v1 requirements mapped (FORM 4 + RATE 5 + S1 3 + S3 2 + S2 7 + S4 3 + S5 3 + S6 2 + BACK 3 + ADM 6 + DES 2)

- Mapped to phases: 40
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 — DES-01, DES-02, FORM-01, FORM-02, FORM-03, FORM-04 completed by 01-01*
