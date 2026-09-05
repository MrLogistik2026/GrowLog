# GrowSmart — Übergabe

Stand: **v1.5.96** · index.html 2,11 MB · 627 Funktionen
Ausgeliefert am Ende der Sitzung vom 01.09.2026
Zuletzt fortgeschrieben am 05.09.2026 — v1.5.96, drei Fehler behoben;
Abschnitt 1 um den gemessenen Befund zur Bedienung erweitert

---

## 1 · Wichtigster offener Punkt

**Die Einstellungen und ihre Verknüpfung mit dem Düngeplan müssen vereinfacht werden.**
Patricks Worte vom 05.09.2026: „Ich finde die ganze Handhabung kompliziert, aber trotzdem
sehr smart und auch teilweise nötig. Diese Einstellung macht es uns sehr flexibel alles
einzustellen. Ich bin nur mit der Handhabung unzufrieden bzw. mache mir Sorgen, dass die
User nicht damit zurechtkommen."

Das ist die Aufgabe: **nicht Funktionen wegnehmen, sondern die Kopplung beherrschbar
machen.** Die Flexibilität ist gewollt und teilweise nötig.

### Was am 05.09.2026 gemessen wurde

Die App wurde mit Patricks echter Sicherung in jsdom durchlaufen — Einstellungen,
Düngeplan, Wochenplan und Gieß-Fahrplan, je einmal als Einsteiger und als Profi. Vier
Befunde, alle nachgemessen:

**Der Einsteiger-Modus wirkt dort nicht, wo es am dichtesten ist.**

| Bildschirm | Profi (Klick / Feld) | Einsteiger |
|---|---|---|
| Einstellungen | 65 / 38 | 56 / 26 |
| Dünger & Wochenplan | 33 / 0 | 34 / 0 |
| Gieß-Fahrplan | 51 / 9 | **51 / 9** |
| Wochenplan bearbeiten | 55 / 84 | 55 / 84 |

Der Gieß-Fahrplan ist in beiden Modi **zeichengenau identisch** (4465 Zeichen). Der
Düngeplan hat im Einsteiger-Modus einen Klick mehr als im Profi-Modus. Nur die
Einstellungen schrumpfen überhaupt.

**Ursache und Wirkung stehen nie auf demselben Bildschirm.** Eine Zahl in den
Einstellungen ändern und zählen, was sich wo mitverändert:

| Änderung | Einstellungen | Gieß-Fahrplan | Dashboard | Folge |
|---|---|---|---|---|
| Gießintervall Blüte 3 → 4 | 891 Wörter | 729 Wörter | 30 Wörter | Endspurt-Anker weg (war Fehler B) |
| Blütedauer 85 → 80 | 1778 Wörter | 1107 Wörter | 202 Wörter | Kette rückt zurück, Fehlalarm „1 Aktion verpasst" |
| Topfgröße 11 → 15 L | 891 Wörter | 1494 Wörter | — | alle Mengen neu |

Bei „Blütedauer 85 → 80" wandert die ganze Kette in die Vergangenheit (Spülen 107/110 →
102/105, Ernte 116 → 111) und das Dashboard meldet daraufhin verpasste Gießtage. **Ein
Eingabefeld erzeugt einen Fehlalarm über die Vergangenheit.**

**Dieselbe Tatsache hat zwei Zahlen, ohne dass es jemand erklärt.** Auf dem
Einstellungs-Bildschirm steht gleichzeitig „Erntefenster: Tag 118–158" (aus den Trichomen)
und „Ernte Tag 116" (aus der Kette). `harvestWindow()` gibt den Plan-Tag bereits als
`planTag` mit zurück — die Differenz wird nur nirgends ausgesprochen. Noch offen.

**Beide zentralen Bildschirme liegen hinter der Einstellungs-Tür.** `duenger` und
`gussplan` sind aus der Navigation nicht direkt erreichbar, nur über zwei Zeilen oben in
`scr-set` (dazu über die Befehlssuche und einen Kontext-Link im Eintrag). Was täglich
gebraucht wird — „was gieße ich morgen, in welcher Menge" — liegt damit hinter dem
Bildschirm, den man aufsucht, wenn etwas nicht stimmt.

### Vorgeschlagene Richtung (Stand 05.09.2026, von Patrick noch nicht entschieden)

Die Zahl der Regler ist nicht das Problem. Es fehlt die Antwort auf **„was passiert, wenn
ich das anfasse?"** Daraus folgen vier Schritte, in dieser Reihenfolge:

**1 · Eine Vorschau statt siebzehn Warnungen.** `endspurtState(c, iso)` ist ein reines,
aus dem Zustand berechnetes Objekt. Damit lässt sich jede Änderung generisch abfangen:
Schnappschuss nehmen, Wert setzen, zweiten Schnappschuss nehmen, vergleichen, dem Nutzer
den Unterschied zeigen, erst dann sichern. *Ein* Mechanismus für alle siebzehn Funktionen
statt siebzehn handgeschriebener Sonderwarnungen. Bei „Intervall 3 → 4" stünde da:
„Letzter Guss: Tag 104 → fällt weg." Mit „Trotzdem" und „Abbrechen". Jede künftige
Einstellung wird damit automatisch selbsterklärend, ohne dass je wieder ein Warntext von
Hand geschrieben wird.

**2 · Die Kette als Bedienelement, nicht als Ergebnis.** Die Endspurt-Karte ist inhaltlich
schon fast richtig, aber eine Liste aus ±-Knöpfen am falschen Ort. Sie sollte eine
waagerechte Zeitleiste sein — `Guss 104 → Spülen 107 · 110 → Dryback → Ice 114 → Ernte 116
→ trocken bis 123` — auf der ein Knoten angefasst wird und alles dahinter sichtbar
mitwandert. So denkt ein Grower über seinen Grow, und so rechnet die App ohnehin schon.

**3 · Trennung nach Frage, nicht nach Thema.** In die Einstellungen gehört, *was für ein
Grow das ist* (Sorte, Topf, Substrat, Plan). Alles, was *wann etwas passiert* beantwortet,
gehört auf die Zeitleiste. Heute liegen `bloomDays` und `intBloom` in den Einstellungen,
ihre Wirkung im Gieß-Fahrplan — genau diese Trennung stört.

**4 · Den Einsteiger-Modus am Gieß-Fahrplan wirksam machen.** Dort gehören für ihn die
Zeitleiste und „nächster Guss" hin; ml-Korridore, Muster-Baukasten und das 84-Felder-Raster
bleiben Profi.

**Das Prinzip dahinter ist das bewährte:** Bevor eine neue Einstellung gebaut wird, erst
prüfen, ob die App die Antwort selbst kennen kann. Vorbild `_snapFlushToRhythm`
(v1.5.80/82) — der Spülstart rastet automatisch auf den Gießrhythmus ein, statt dass der
Nutzer ihn nachzieht. Regeln ersetzen Regler. Die Vorschau ist derselbe Gedanke eine Ebene
höher.

### Die siebzehn koppelnden Funktionen

`holdPlanWeek`, `confirmPlanWeek`, `moveGussDay`, `doShift`, `shiftPlanToDay`,
`setEndspurtGuss`, `setEndspurtErnte`, `setEndspurtDry`, `setEndspurtPhase`,
`setEndspurtSpuelStart`, `setEndspurtIceStart`, `endspurtNormal`, `clearEndspurt`,
`setWaterRange`, `setWaterMl`, `toggleFwDay`, `setGD`, `uDose` — verteilt über sechs
Bildschirme, jede mit eigenem Wort: verschieben, dranbleiben, nachziehen, abtrocknen
lassen, einrasten.

### Weitere Kandidaten, unverändert offen

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

## 2 · Am 05.09.2026 behoben (v1.5.96)

Die drei Fehler aus diesem Abschnitt sind erledigt und abgesichert durch
`test_fixes_0905.js` (38 Prüfungen, beide Zeitzonen). Die Einzelheiten stehen im
`CHANGELOG.md`. Was hier bleibt, ist das, woraus zu lernen ist:

**Ein Regler, der still Daten löscht, ist schlimmer als ein fehlender Regler.** Der
Pflanzen-Zähler kürzte das `plants`-Array von hinten und traf damit ausgerechnet die
zuerst geernteten Pflanzen — mit Schnitt-Datum und Ertrag. Niemand hätte es bemerkt, denn
`getEffectivePlantCount` zählt die Geernteten ohnehin nicht mit: Auf dem Gieß-Fahrplan
änderte sich kein einziger Wert. **Regel: Wo eine Zahl ein Array kürzt, gehört vorher die
Frage, was in den weggeschnittenen Einträgen steckt.**

**Eine Karte, die bei fehlenden Daten verschwindet, nimmt dem Nutzer die Bedienung weg.**
`endspurtCard()` stieg bei fehlendem `letzterGuss` mit leerem String aus — und damit war
die einzige Stelle weg, an der Spülen, Hard-Dryback, IceFlush und Ernte einzustellen sind.
**Regel: Fehlt ein einzelner Wert, wird dieser Wert als offen ausgewiesen — nicht der ganze
Bildschirm ausgeblendet.**

**Der Rhythmus-Motor ist empfindlicher, als er aussieht.** Ursache war ein Gießintervall,
das nicht zu den eingetragenen Güssen passt: `getAction` verankert die Blüte am letzten
Wassereintrag (ANKER 2), und liegt der immer 3 Tage zurück, geht ein Intervall von 4 nie
auf — kein Blütetag ist dann noch Gießtag. Behoben wurde am Rand (Rückfall auf den echten
Eintrag), **nicht** im Motor. Wer dort etwas ändert, ändert jeden Gießtag jedes Zyklus.

---

## 3 · Patricks laufender Grow

Sensi Amnesia XXL Auto · Erde Light-Mix · 11 L Airpot · Start 16.05.2026
Am 05.09.2026 **Tag 113**, in der Endphase. Bei jedem Sitzungsbeginn neu ausrechnen —
`endspurtState(c, todayISO()).heuteTag` sagt es direkt.

**Fünf Pflanzen angelegt, drei stehen noch.** Zwei Einzelernten sind erfasst: Pflanze 5 am
16.08. mit 37 g trocken, Pflanze 4 am 27.08. `getEffectivePlantCount` rechnet deshalb mit
3 — der Gieß-Fahrplan zeigt „× 3 Pflanzen", die Erntegewicht-Zeile in den Einstellungen
nennt dagegen die angelegten 5. Kein Fehler, aber eine bekannte Ungenauigkeit im Text.

Seine Zielkette für die Endphase:

| Tag | Was |
|---|---|
| 104 | letzter Düngerguss |
| 107 | erster Spülgang |
| 110 | zweiter Spülgang |
| 114 | IceFlush |
| 116 | Ernte |

Daraus folgen: Blütedauer 85, `flushWetDays` 4, `iceDryDays` 3, `iceDays` 2,
`flushDryDays` 0 (aus), Gießintervall Blüte und Spülen je 3 Tage.

**Erledigt:** Die offene Frage aus der letzten Übergabe — ob er den rückwirkend gesetzten
Spülstart tatsächlich eingetragen hat — ist beantwortet. Am 05.09.2026 nachgesehen:
`endspurtState` liefert `letzterGuss` 104, `spuelGaenge` [107, 110], `iceStart` 114,
`ernteTag` 116. Das deckt sich genau mit seiner Zielkette. Nicht erneut nachfragen.

---

## 4 · Was in dieser Sitzung passiert ist (v1.5.44 → v1.5.84)

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

## 5 · Fehler dieser Sitzung, aus denen zu lernen ist

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

## 6 · Testinfrastruktur

Seit 04.09.2026 liegt alles dauerhaft auf dem Laptop unter
`C:\Users\laura\Desktop\Claude Growsmart\projekt` und im Repo
`MrLogistik2026/GrowLog`. Der frühere Aufbau im flüchtigen Container entfällt —
`head.html`, `app.js`, `tail.html`, `harness.js` und alle Testdateien sind da,
`node_modules` mit jsdom ebenfalls.

Vor jeder Änderung:

```bash
cat head.html app.js tail.html | cmp - index.html && echo "BYTE-IDENTISCH OK"
```

**Byte-Identität mit `cmp` ist Pflicht, bevor irgendetwas geändert wird.** Danach wird
`app.js` geändert, mit `build.sh` neu gebaut und erneut verglichen.

21 Testdateien, alle grün in beiden Zeitzonen (Stand v1.5.96):

`test_audit_screens` · `test_befehle` · `test_dialog_und_namen` · `test_duengeplaene` ·
`test_endspurt` · `test_entwurf` · `test_fixes_0905` · `test_gussmenge` · `test_gussmove` ·
`test_gussmove_kombi` · `test_navscroll` · `test_planladen` · `test_planpause` ·
`test_planrueckgrat` · `test_planzuordnung` · `test_saemling_tage` · `test_startup` ·
`test_trichchart` · `test_trichedit` · `test_trichphasen` · `test_wochenfolgen`

**Zeitzonen unter Windows:** `TZ=Europe/Berlin node test.js` wirkt in Git Bash **nicht** —
`process.env.TZ` bleibt leer und der Test läuft still in der Systemzeitzone. Die
Zeitzonen-Läufe gehören in PowerShell:

```powershell
$env:TZ='Europe/Berlin';      node test_startup.js
$env:TZ='Pacific/Kiritimati'; node test_startup.js
```

Tests, die mit Patricks echten Daten arbeiten, lesen
`growsmart-sicherung-2026-09-04.txt` und legen den Inhalt vor dem Laden unter den
localStorage-Schlüssel `growsmart_v4` — siehe `test_fixes_0905.js` als Vorlage. Das ist
aussagekräftiger als ein leerer Grow: Beide am 05.09. gefundenen Anzeigefehler waren nur
mit echtem Zustand sichtbar.

---

## 7 · Schlüsselkonzepte im Code

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

## 8 · Kleinere offene Punkte

- „Erledigt"-Karte erscheint an Tagen ohne Aufgabe (von Patrick zurückgestellt)
- „Messungen berichtigen"-Liste schneidet am angezeigten Tag ab
- Zwei verbliebene Wiederholungen des Plan-Untertitels im Düngeplan-Bildschirm
- Getrennte Trichom-Verläufe je Pflanze — bewusst nicht gebaut, stattdessen `ripeOffset`
- Ertragserfassung existiert je Pflanze, aber keine Auswertung über Zyklen hinweg
