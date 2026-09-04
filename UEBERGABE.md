# GrowSmart — Übergabe

Stand: **v1.5.95** · index.html 2,11 MB · 627 Funktionen
Ausgeliefert am Ende der Sitzung vom 01.09.2026

---

## 1 · Wichtigster offener Punkt

**Die Einstellungen und ihre Verknüpfung mit dem Düngeplan müssen vereinfacht werden.**
Patricks Worte: „Die Einstellungen sind wichtig, aber die automatischen Funktionen sind
nicht auf dem Niveau, wie ich es gerne hätte."

Der Befund ist messbar. Siebzehn Funktionen ändern Zeit oder Dosis, verteilt über sechs
Bildschirme: `holdPlanWeek`, `confirmPlanWeek`, `moveGussDay`, `doShift`, `shiftPlanToDay`,
`setEndspurtGuss`, `setEndspurtErnte`, `setEndspurtDry`, `setEndspurtPhase`,
`setEndspurtSpuelStart`, `setEndspurtIceStart`, `endspurtNormal`, `clearEndspurt`,
`setWaterRange`, `setWaterMl`, `toggleFwDay`, `setGD`, `uDose`. Jede mit eigenem Wort:
verschieben, dranbleiben, nachziehen, abtrocknen lassen, einrasten.

**Die Richtung, die sich in dieser Sitzung als richtig erwiesen hat:** Bevor eine neue
Einstellung gebaut wird, erst prüfen, ob die App die Antwort selbst kennen kann. Beispiel
`_snapFlushToRhythm` (v1.5.80/82) — der Spülstart rastet automatisch auf den Gießrhythmus
ein, statt dass der Nutzer ihn nachzieht. Solche Regeln ersetzen Regler.

**Konkrete Kandidaten für den nächsten Umbau:**

- Der **Tageseintrag** hat im Profi-Modus 29 Knöpfe, 8 Eingabefelder und vierzehn Blöcke.
  An einem normalen Tag sind drei relevant. Vorschlag lag vor: oben eine Aufgabenzeile
  („Heute: Hebe-Test + Trichome"), darunter nur die zugehörigen Blöcke, alles Übrige hinter
  „Mehr eintragen ▾". Patrick hat dazu noch nicht entschieden.
- **Statuszeile statt fünf Infokarten** im Eintrag: „Tag 103 · kein Gießtag · nächster
  morgen · Topf mittel · Trichome vor 2 Tagen", jeder Teil antippbar.
- **Zustand statt Zahl**: EC 1150, VPD 1,2, Restgewicht 75 % brauchen ein Wort davor
  („im Ziel", „etwas hoch"). Teilweise vorhanden, uneinheitlich.
- **Aufräumen nur, wenn es sich lohnt** (Patricks Vorgabe vom 03.09.2026): Keine Regel
  „pro Release so viel entfernen wie hinzukommt". Entfernt wird, was tatsächlich abgelöst
  oder tot ist — etwa `_flushGapCard` nach dem Endspurt oder `showDayPicker` nach der
  Modus-Vereinheitlichung. Dateigröße ist kein Selbstzweck; der Schwerpunkt liegt auf
  Funktion und Fehlerbehebung.

---

## 2 · Patricks laufender Grow

Sensi Amnesia XXL Auto · Erde Light-Mix · 11 L Airpot · Start 16.05.2026
Aktuell etwa **Tag 109** (Anfang September), in der Endphase.

**Vier Pflanzen im Zelt**, eine wurde früher geerntet (Einzelernte, siehe `plants[].harvestedAt`).

Seine Zielkette für die Endphase, mehrfach bestätigt:

| Tag | Was |
|---|---|
| 104 | letzter Düngerguss |
| 107 | erster Spülgang |
| 110 | zweiter Spülgang |
| 114 | IceFlush |
| 116 | Ernte |

Daraus folgen: Blütedauer 85, `flushWetDays` 4, `iceDryDays` 3, `iceDays` 2,
`flushDryDays` 0 (aus), Gießintervall Blüte und Spülen je 3 Tage.

**Achtung:** Er hat an Tag 107 tatsächlich gespült, die App hatte dort einen Düngerguss
protokolliert. Seit v1.5.84 kann der Spülstart rückwirkend gesetzt werden, seit v1.5.85 auch
der letzte Guss („Letzter Guss −", jeweils mit Rückfrage). Ob er das gemacht hat, ist zu
Sitzungsbeginn zu erfragen.

---

## 3 · Was in dieser Sitzung passiert ist (v1.5.44 → v1.5.84)

**Trichome und Prognose** — Tagesberechnung folgt dem gemessenen Tempo statt dem Erntetag
(v1.5.45). Bernstein-Korrekturen führen Klar und Milchig am eigenen Tempo mit (v1.5.47).

**Modi** — Antippen im Kalender öffnet in beiden Modi direkt den Tag; Trichom-Check ab
Blütewoche 7 auch im Einsteiger-Modus (v1.5.46).

**Lexikon** — Tabellen seitlich schiebbar (v1.5.48). „Meine Produkte" kommt aus dem eigenen
Düngeplan statt aus einer festen Liste; neue Kategorie „Düngerarten" mit 14 Klassen
(v1.5.49).

**Preset V6.0** — 17 Wochen, 10 Produkte, eigene EC-Zielbereiche, keine Wasser-Tage
(v1.5.50). Rückgrat: `weekPhases`/`phaseSkeleton`, Phasen und Wochenraster aus einer Quelle
(v1.5.51).

**Düngeplan als Blatt** — Wochen-Tabelle statt 120 Eingabefeldern, Lesen und Bearbeiten
getrennt (v1.5.52). **Gieß-Fahrplan** nach Wichtigkeit sortiert (v1.5.53).

**Pflanzen einzeln führen** — Einzelernte als datiertes Ereignis, Ertrag je Pflanze,
Reife-Vorsprung aus einer Einzelmessung (v1.5.54–56).

**Gießmenge** — Korridor gilt auf allen Rechenwegen, tote Festmengen migriert, Aufschlüsselung
je Pflanze sichtbar (v1.5.57–60).

**Guss verschieben** — als datierter Vermerk mit allen Schutzprüfungen (v1.5.63/64).

**Befehlssuche** — 22 Befehle, wortweise und umlautunabhängig (v1.5.72).

**Endspurt** — die Kette aus letztem Guss, Spülen, Hard-Dryback, IceFlush, Ernte an einer
Stelle; Tage direkt eintippbar; Spülstart rastet auf den Rhythmus ein; rückwirkend setzbar
(v1.5.70–84).

---

## 4 · Fehler dieser Sitzung, aus denen zu lernen ist

Diese vier Punkte haben Patrick am meisten Zeit gekostet. Sie stehen hier, damit sie sich
nicht wiederholen.

**Eine Funktion gebaut, die niemand wollte.** Die „Abtrockenphase vor dem Spülen"
(v1.5.65) riss den Gießrhythmus auseinander, obwohl der erste Spülgang selbst ein großer
Guss ist. Vier Releases lang hat Patrick dagegen angekämpft, bis sie in v1.5.79 wieder
abgeschaltet wurde. **Regel: Bei einer neuen Automatik zuerst fragen, welchen Fehler sie
verhindert — und ob dieser Fehler real ist.**

**Sperren, die den legitimen Fall verhindern.** „Spülstart muss in der Zukunft liegen"
blockierte die Korrektur einer falsch erfassten Vergangenheit. Die Regel „bloomDays nicht
verkürzen" gilt für die **App**, nicht für den Nutzer. Der Grower ist die Quelle der
Wahrheit über seinen eigenen Grow.

**Symptome erklärt statt Ursachen behoben.** Beim Hard-Dryback habe ich zweimal erklärt,
warum nur ein Spülgang übrig bleibt, statt die Ursache zu beheben: „Spülen 4 Tage" hieß
nicht vier Spültage. Erst v1.5.75 hat das getrennt.

**Stiller Rückschreiber.** Der Einstellungs-Entwurf war eine Momentaufnahme des Zyklus vom
Öffnen des Bildschirms. Wer danach woanders etwas änderte — etwa den Spülstart im Endspurt —
und später in den Einstellungen auf „Sichern" tippte, bekam die Änderung stillschweigend
zurückgesetzt. Seit v1.5.86 schreibt der Entwurf nur noch Felder zurück, die dort auch
angefasst wurden (`draftTouched`). **Regel: Ein Formular darf nie mehr speichern, als der
Nutzer darin verändert hat.**

**Ein Überbleibsel schrieb im Hintergrund zurück.** `_syncPlanPause` setzte `bloomDays` bei
jedem `fertPlanWeek`-Aufruf auf `bloomBase + Verschiebungstage` — also bei praktisch jedem
Rendern. Für Pläne MIT Rückgrat war das seit v1.5.51 abgeschaltet, für ältere Plankopien
ohne `weekPhases` lief es weiter. Patricks Plan war so einer: Jede von Hand gesetzte
Blütedauer war innerhalb von Sekunden wieder überschrieben — für ihn sah es aus, als
verstellten sich die Einstellungen über Nacht. Seit v1.5.87 schreibt die Funktion nichts
mehr, und `planPause` wird bei allen Zyklen entfernt. **Regel: Bei „das verstellt sich von
selbst" zuerst suchen, welche Funktion den Wert im Hintergrund zurückschreibt — nicht die
Eingabe prüfen.**

**Wirkung nicht sichtbar gemacht.** Eine Einstellung, deren Effekt im gerade sichtbaren
Kalendermonat nicht vorkommt, wirkt wie kaputt. Seit v1.5.76 steht die Folge live unter dem
Feld, mit Datum.

---

## 5 · Testinfrastruktur

Container ist flüchtig. Aufbau zu Sitzungsbeginn:

```bash
cd /home/claude && rm -rf work && mkdir work && cd work
SRC=/mnt/user-data/outputs/index.html
SS=$(grep -n "<script>" "$SRC" | head -1 | cut -d: -f1)
SE=$(grep -n "</script>" "$SRC" | head -1 | cut -d: -f1)
sed -n "1,${SS}p" "$SRC" > head.html
sed -n "$((SS+1)),$((SE-1))p" "$SRC" > app.js
sed -n "${SE},\$p" "$SRC" > tail.html
printf '#!/bin/bash\ncat head.html app.js tail.html > index.html\n' > build.sh
chmod +x build.sh && ./build.sh && cmp index.html "$SRC" && echo "BYTE-IDENTISCH OK"
cp app.js /tmp/base.js && npm install jsdom --silent
```

**Byte-Identität mit `cmp` ist Pflicht, bevor irgendetwas geändert wird.**

Aktuell vorhandene Testdateien (gehen bei Container-Reset verloren, müssen mit ausgeliefert
oder neu geschrieben werden):

`test_startup` · `test_planzuordnung` · `test_planladen` · `test_planrueckgrat` · `test_gussmenge` · `test_trichedit` · `test_trichchart` · `test_trichphasen` · `test_navscroll` · `test_planpause` · `test_entwurf` · `test_endspurt` ·
`test_befehle` · `test_gussmove` · `test_gussmove_kombi` · `test_wochenfolgen` ·
`test_audit_screens`

Ältere Tests aus früheren Sitzungen sind bei einem Container-Reset verlorengegangen:
`test_amber`, `test_fillday`, `test_modi`, `test_lextable`, `test_lexduenger`,
`test_planblatt`, `test_gussblatt`, `test_rueckgrat`, `test_presetv6`, `test_wochen`,
`test_holdback`, `test_planmigration`, `test_plantsheet`, `test_einzelernte`,
`test_korridor`, `test_festmenge`, `test_flushgap` und weitere. Bei Bedarf neu schreiben.

Jeder Lauf in **beiden Zeitzonen**: `TZ=Europe/Berlin` und `TZ=Pacific/Kiritimati`.

---

## 6 · Schlüsselkonzepte im Code

- `contextFor(c, iso)` für Phasen-/Seedtype-Entscheidungen
- `fertPlanWeek(c, iso)` für die Düngeplan-Woche · `phase().week` taugt nicht als Referenz
- `planWeekBounds(c)` — Wochenraster aus dem Rückgrat, nicht aus festen Tageszahlen
- `endspurtState(c, iso)` — die ganze Endphase als ein Objekt
- `_snapFlushToRhythm(c)` — Spülstart rastet auf den Gießrhythmus ein
- `flushWetDays` (Spültage) und `iceDryDays` (Hard-Dryback) ergeben zusammen `flushDays`
- `flushDryDays` = 0 heißt aus; die Abtrockenphase vor dem Spülen ist Standard-aus
- `getEffectivePlantCount(c, iso)` wertet je Tag aus und berücksichtigt Einzelernten
- `COMMANDS` + `runCommand(i)` — Befehlssuche über den „?"-Knopf
- `_localISO(d)`, `iso12`/`isoPlus`/`isoDiff` — nie `.toISOString().split('T')[0]`
- Diagnose-Datenbank heißt **PROBLEMS** (22 Einträge), nicht SYMPTOMS

---

## 7 · Kleinere offene Punkte

- „Erledigt"-Karte erscheint an Tagen ohne Aufgabe (von Patrick zurückgestellt)
- „Messungen berichtigen"-Liste schneidet am angezeigten Tag ab
- Zwei verbliebene Wiederholungen des Plan-Untertitels im Düngeplan-Bildschirm
- Getrennte Trichom-Verläufe je Pflanze — bewusst nicht gebaut, stattdessen `ripeOffset`
- Ertragserfassung existiert je Pflanze, aber keine Auswertung über Zyklen hinweg
