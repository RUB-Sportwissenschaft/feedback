# Feedback App — Balancierte Struktur (7 Sektionen)

Diese Liste ist nun in 7 balancierte Sektionen unterteilt (ca. 3-4 Fragen pro Sektion). Alle Subtitles sind als eindeutige Fragen formuliert, ohne "und"-Verknüpfungen.

---

## S1: Vorbereitung & Rahmen (Vorbereitung)

| Label | Untertitel (Frage) | Endpunkt (ID) | Skala (1 bis 5) |
| :--- | :--- | :--- | :--- |
| **Reiseveranstalter** | Wie bewertest du den Service von SkiBo Tours? | `rating_skibo_service` | schlecht — sehr gut |
| **Vorab-Informationen** | Waren die Vorab-Informationen der Universität hilfreich? | `rating_prep_info` | schlecht — sehr gut |
| **Kosten / Preis-Leistung** | Wie bewertest du das Preis-Leistungs-Verhältnis? | `rating_costs` | zu teuer (1) — sehr günstig (5) <br> *(3 = angemessen)* |
| **Ausbildungsort** | Wie bewertest du den Ort (Unterkunft, Skigebiet)? | `rating_location` | schlecht — sehr gut |

---

## S2: Kern-Ausbildung (Praxis)

| Label | Untertitel (Frage) | Endpunkt (ID) | Skala (1 bis 5) |
| :--- | :--- | :--- | :--- |
| **Fahrerisches Können** | Wie bewertest du deine fahrerische Entwicklung? | `rating_driving_skills` | kaum — sehr viel |
| **Lehrkompetenz** | Wie bewertest du die Entwicklung deiner Lehrfähigkeit? | `rating_teaching_skills` | kaum — sehr viel |
| **Einsteigermethodik** | Wie bewertest du die Vermittlung dieser Methodik? | `rating_methodology` | schlecht — sehr gut |
| **Videoanalysen** | Waren die Videoanalysen für dich hilfreich? | `rating_video_analysis` | schlecht — sehr gut |

---

## S3: Spezialthemen & Sicherheit (Themen)

| Label | Untertitel (Frage) | Endpunkt (ID) | Skala (1 bis 5) |
| :--- | :--- | :--- | :--- |
| **Verschüttetensuche** | Wie bewertest du die LVS-Übung? | `rating_lvs_training` | schlecht — sehr gut |
| **Theorie-Inhalte** | Wie bewertest du die Qualität der Theorie-Vorträge? | `rating_theory` | schlecht — sehr gut |
| **Schnee-Event** | Wie bewertest du das Schnee-Event (Rallye)? | `rating_snow_event` | schlecht — sehr gut |

---

## S4: Organisation vor Ort (Ablauf)

| Label | Untertitel (Frage) | Endpunkt (ID) | Skala (1 bis 5) |
| :--- | :--- | :--- | :--- |
| **Lehrgangs-Organisation** | Wie bewertest du den organisatorischen Ablauf? | `rating_organisation` | schlecht — sehr gut |
| **Zeitliche Belastung** | War der zeitliche Umfang des Programms angemessen? | `rating_workload` | zu hoch (1) — zu gering (5) <br> *(3 = angemessen)* |
| **Gruppeneinteilung** | Waren die Kriterien der Gruppenbildung nachvollziehbar? | `rating_group_split` | unklar — sehr klar |

---

## S5: Prüfung (Prüfung)

| Label | Untertitel (Frage) | Endpunkt (ID) | Skala (1 bis 5) |
| :--- | :--- | :--- | :--- |
| **Prüfungs-Organisation** | Wie bewertest du den Ablauf der Prüfung? | `rating_exam_org` | schlecht — sehr gut |
| **Prüfungsanforderungen** | Wie bewertest du das Niveau der Anforderungen? | `rating_exam_difficulty` | zu leicht (1) — zu schwierig (5) <br> *(3 = genau richtig)* |
| **Klarheit der Kriterien** | Wurden die Anforderungen verständlich kommuniziert? | `rating_exam_clarity` | unklar — sehr klar |

---

## S6: Soziales & Miteinander (Soziales)

| Label | Untertitel (Frage) | Endpunkt (ID) | Skala (1 bis 5) |
| :--- | :--- | :--- | :--- |
| **Hüttenabend** | Wie bewertest du den Hüttenabend? | `rating_hut_evening` | schlecht — sehr gut |
| **Après-Ski** | Wie bewertest du das Après-Ski-Angebot? | `rating_apres_ski` | schlecht — sehr gut |
| **Soziales Miteinander** | Wie bewertest du die Atmosphäre unter den Studierenden? | `rating_social_atmosphere` | schlecht — sehr gut |

---

## S7: Ausbilder & Abschluss (Abschluss)

| Label | Untertitel (Frage) | Endpunkt (ID) | Typ |
| :--- | :--- | :--- | :--- |
| **Ausbilder-Feedback** | Wie bewertest du die fachliche Betreuung? | `feedback_instructor` | Textfeld (Pflicht) |
| **Weitere Rückmeldungen** | Hast du sonst noch etwas auf dem Herzen? | `feedback_general` | Textfeld (Optional) |

---

## Zusammenfassung für Claude Code
- **Struktur:** 7 Sektionen statt bisher 6.
- **Prinzip:** 1 = negativ/zuviel, 5 = positiv/zuwenig.
- **Bipolar:** 3 = Idealwert bei Kosten, Belastung und Prüfungsschwierigkeit.
- **Gleichverteilung:** Die Fragen sind nun mit 3-4 pro Sektion balanciert.
