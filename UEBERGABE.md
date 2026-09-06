# GrowSmart — Übergabe

Stand: **v1.5.114** · index.html 2,11 MB · 629 Funktionen
Zuletzt fortgeschrieben am 05.09.2026. Fünf Fehler behoben: Der Widerspruch zwischen
Plan-Erntetag und Trichom-Messung wird ausgesprochen (v1.5.97), die Sortenliste plant nicht
mehr mit Züchter-Bestwerten (v1.5.98), erfasste Ernteerträge sind nicht mehr unsichtbar und
die Ernte-Kacheln widersprechen der Erntekarte nicht mehr (v1.5.99), und **die Düngermengen
kamen aus dem falschen Plan, sobald es mehr als einen gab** (v1.5.100 — der schwerste der
fünf, siehe Abschnitt 3). Dazu warnt die App vor Kondensation auf dem Blatt, statt sie wie
leichte Feuchte zu behandeln (v1.5.101), Trainings werden nur noch passend zur
Wachstumsphase angeboten (v1.5.102), und eine gespeicherte Pflanzenzahl kann nicht mehr
größer sein als die Zahl der Pflanzen (v1.5.103). Mit v1.5.104 wird die Ablaufmessung erst
auf ihre Gültigkeit geprüft, bevor sie bewertet wird — die erste Änderung, die direkt aus
`ANBAU.md` folgt. Zuletzt zwei Punkte aus der Restliste: Die Berichtigen-Liste der
Trichom-Messungen zeigt wieder die ganze Reihe (v1.5.105), und der Düngeplan ist nach der
Zurück-Taste aus dem Gieß-Fahrplan nicht mehr leer (v1.5.106). Mit v1.5.107 trennt die
Diagnose Magnesium und Calcium, statt beide in einem Eintrag am falschen Blattort zu
führen — der zweite Befund direkt aus `ANBAU.md` (6.1 und 6.2), siehe Abschnitt 3.
Mit v1.5.108 steht die Begründung der Diagnose in Klartext statt in internen Schlüsseln,
und mit v1.5.109 nehmen die Dünge-Regeln pH-Ziel und Mischreihenfolge aus dem eigenen
Zustand statt aus festen Zahlen.

Grundlage waren drei Durchläufe im echten Browser mit Patricks Daten: erst über alle
Bildschirme (Abschnitt 2), dann gezielt über die Rechenwege — VPD, Düngedosis, Trichome,
EC, Hebe-Test, Gießmenge (Abschnitt 3).

**Fachwissen:** Seit dem 05.09.2026 bindet `CLAUDE.md` zusätzlich `ANBAU.md` ein — die
biophysikalischen Grundlagen, gegen die jede Zahl und jeder Text in dieser App geprüft
werden. Wer hier etwas über Pflanzen entscheidet, liest dort nach, statt zu schätzen.

---

## 0 · Am 06.09.2026 behoben — Meldungen von Patrick

### Die Gießmenge stellt niemand mehr von Hand ein (v1.5.112)

Patricks Einwand: „Ich bin kein Fan davon, wenn ich selbst meine Wassermengen der Phasen
einstellen muss … Wie will das ein User schaffen, der wenig oder noch keine Erfahrung hat?"

Nachgemessen an seinen 35 selbst eingetragenen Güssen: Die Empfehlung lag im Mittel **23 %
daneben**, fast immer nach unten. Ursache war eine Falle — weil die Vorschläge nicht passten,
hatte er eigene Phasen-Korridore gesetzt, und genau das schaltete die Selbstkorrektur ab
(„Ein SELBST gesetzter Korridor bleibt unangetastet"). Der Kreislauf: zu wenig vorgeschlagen
→ Korridor gesetzt → Lernen aus → weiter danebengelegen → weiter von Hand korrigiert.

`drainAdjust(c, iso)` leitet die Menge jetzt aus dem gemessenen Ablauf her — Mengenbilanz
statt Faustregel: `Faktor = (1 − ist) / (1 − ziel)`, Ziel 17,5 %. Mit Patricks Zahlen an
Tag 104 (9000 ml gegossen): 5 % Ablauf → 10350 ml, 10 % → 9800, **15–20 % → 9000**,
30 % → 7650, 40 % → 6750. Im Zielfenster bestätigt die App also seine eigene Menge.

**Zwei Stolpersteine, beide erst beim Durchspielen der ganzen Kurve sichtbar:**
1. Der eigene Korridor sperrte die Messung aus. Jetzt gilt: Ein *Verhaltensmuster* ist etwas
   anderes als ein *physikalischer Befund über diesen Topf* — eine Ablaufmessung darf weiten.
2. Die Rampe (max. 12 % Änderung je Guss) hing am alten Median und hielt exakt dagegen: Bei
   30 % Ablauf wollte die Bilanz −15 %, die Rampe ließ 12 % zu und klemmte zurück. Ergebnis
   war Guss für Guss dieselbe Zahl trotz eindeutiger Messung. Sie hängt jetzt am korrigierten
   Ziel.

**Daraus zu lernen:** Eine einzelne Stichprobe hätte beide nicht gezeigt — der Fehler war erst
in der *Reihe* zu sehen (bei 25 % kam mehr heraus als bei 17,8 %). Bei Regelkreisen die ganze
Kennlinie durchspielen und auf Monotonie prüfen, nicht einen Punkt.

**Drain-Ziel 5–10 % → 15–20 %** an elf Stellen, nach `ANBAU.md` 5.1. Das gehörte in dieselbe
Änderung: ein höheres Drain-Ziel ohne größere Gießmenge wäre ein Widerspruch in sich.

### Der Gieß-Fahrplan ist nach Häufigkeit geordnet (v1.5.113)

Patrick: „Der sieht mir zu unübersichtlich und unhandlich aus. Damit kann niemand so richtig
arbeiten, der nicht viel rumversuchen will."

Der Bildschirm beantwortete vier Fragen gleichzeitig und in der falschen Reihenfolge: oben die
Endspurt-Kette mit acht ±-Knöpfen — eine Terminfrage, die man zweimal im Zyklus stellt —,
darunter erst „was gieße ich als Nächstes", die tägliche Frage. Beide Modi waren zeichengleich
(4472 Zeichen, 21 Knöpfe, 9 Felder).

Neue Reihenfolge in beiden Modi: **nächster Guss mit Menge → Liste → Termine → Einstellungen.**
Im Einsteiger-Modus liegt die Kette hinter dem Aufklapper „Termine bis zur Ernte", der
Listentext ist auf einen Satz gekürzt, und die Mengen-Regler entfallen dort ganz — sie würden
seit v1.5.112 nur die Selbstkorrektur abschalten. Ergebnis: **3166 Zeichen, 10 Knöpfe,
0 Eingabefelder.** Der Profi behält alles (4472 / 21 / 9), nur anders sortiert.

**Daraus zu lernen:** Nicht die *Menge* der Elemente machte den Bildschirm unhandlich, sondern
ihre *Reihenfolge*. Was täglich gebraucht wird, gehört nach oben; was zweimal im Zyklus
gebraucht wird, hinter einen Aufklapper. Am Tageseintrag hat sich derselbe Gedanke am
06.09.2026 bestätigt (v1.5.114, Abschnitt 0c).

---

## 0c · Der Tageseintrag: eine falsche Zahl, ein echter Fehler (v1.5.114)

### Zuerst die Korrektur einer eigenen Messung

**Die früher hier notierten „154 sichtbaren Eingabefelder" waren falsch.** Gemessen wurde
mit `offsetParent !== null` — und das schließt Inhalte in **zugeklappten `<details>` nicht
aus**. Richtig ist an Tag 113:

| | |
|---|---|
| Felder im ganzen Bildschirm | 162 |
| davon in der zugeklappten Liste „🔬 Messungen berichtigen (47)" | **141** |
| **wirklich sichtbar** | **21** |

Die Aufklapp-Liste hatte ich in v1.5.105 selbst von 32 auf alle 47 Messungen erweitert. Sie
war also die Ursache der Schreckenszahl, und sie ist zugeklappt völlig unauffällig.
**Regel: Wer Sichtbarkeit misst, muss zugeklappte Behälter mitprüfen — `offsetParent` tut
das nicht.**

### Was wirklich gemessen wurde (06.09.2026, Browser, Patricks Daten)

| Tag | | Einsteiger (Felder/Knöpfe) | Profi |
|---|---|---|---|
| 30, 60 | kein Guss | 10 / 29 | 10 / 28 |
| 90 | kein Guss | 13 / 32 | 13 / 30 |
| **104** | **Gießtag** | **26 / 53** | **29 / 53** |
| 110 | Spülen | 21 / 40 | 24 / 40 |
| 114 | IceFlush | 21 / 46 | 24 / 46 |

An normalen Tagen ist der Eintrag harmlos. **Am Gießtag ist er 3486 px hoch bei 691 px
Fensterhöhe — fünf Bildschirmlängen.** Und die Felder liegen weit unten: Wassermenge bei
y = 1144, pH/EC bei 1368/1377, Temperatur und Luftfeuchte erst bei **2014**, Notiz bei 2751.
Über den ersten 1144 px steht ausschließlich Lesestoff.

Ganz oben stand dabei die ganze Zeit die Zeile „3/6 eingetragen · ✓💧 Wasser · 🧪 pH ·
✓🌡 Temp · 💨 RLF". **Die App wusste also präzise, was heute noch fehlt, und legte die
zugehörigen Felder 1144 bzw. 2014 px darunter, ohne einen Weg dorthin.**

### Die Zeile ist jetzt der Weg, nicht das Schild

`jumpToEntryField(cId, was)` — jeder der sechs Chips ist ein Knopf, der zum Feld scrollt, es
kurz gelb umrandet und den Cursor hineinsetzt. Kein neuer Regler, keine neue Einstellung:
dieselbe Zeile, dieselben sechs Zustände, nur benutzbar. Drei Feinheiten, alle im Browser
durchgeklickt:

- Liegt das Ziel in einem zugeklappten Bereich, wird der vorher geöffnet — sonst springt es
  ins Nichts.
- Am Foto-Knopf wird der Fokus **weggenommen** statt gesetzt. Bliebe der Cursor im vorherigen
  Feld, stünde auf dem Handy die Tastatur offen, genau über dem Ziel des Sprungs.
- Gibt es das Feld an diesem Tag nicht (kein Gießtag → kein Wasser-Feld), sagt die App das,
  statt stumm zu bleiben.

**Die Zeile erscheint jetzt auch am leeren Tag.** Früher blieb sie bei 0/6 weg („sonst zu
verwirrend"). Seit sie zum Feld springt, ist der leere Tag genau der Moment, in dem man sie
braucht: Sie ist dann die Aufgabenliste für heute, nicht bloß eine Erfolgsmeldung.

### Der echte Fehler daneben: Notizfelder für geerntete Pflanzen

An Tag 104 standen **fünf** Pflanzen-Notizfelder, obwohl Pflanze 5 seit Tag 93 geerntet ist
und `getEffectivePlantCount` am selben Tag bereits mit **3** rechnete. Ursache: ein
ungefiltertes `c.plants.map(...)`. Jetzt zählt der Schnitt-Tag noch dazu (an ihm will man
etwas notieren), der Tag danach nicht mehr — und wer für eine geerntete Pflanze schon etwas
geschrieben hat, sieht es weiter: **eine vorhandene Notiz darf nicht unsichtbar werden.**
Ergebnis: Tag 50 → 5 Felder, Tag 93 → 5, Tag 94 → 4, Tag 104 → 4, Tag 113 → 3.

**Dazu:** Die Verschiebungs-Historie („5 Verschiebungen · ✕ = einzeln zurücknehmen") lag an
**jedem** Tag aufgeschlagen zwischen Sorten-Karte und Gießkarte — fünf Rücknahme-Knöpfe im
Weg zu den Feldern, die man täglich braucht. Sie ist zugeklappt; die Kopfzeile bleibt.
Der Gießtag schrumpft damit von 3486 auf 3282 px.

Abgesichert durch `test_tageseintrag.js` (33 Prüfungen, beide Zeitzonen).

**Noch offen am Tageseintrag:** Die 53 Knöpfe des Gießtags sind unangetastet, und der
Einsteiger-Modus wirkt dort weiterhin kaum (26 gegen 29 Felder, Knöpfe gleichauf). Erst
sehen, ob die Sprungmarken im Alltag reichen, bevor Blöcke verschoben werden.

---

## 0b · Zwei weitere Meldungen vom 06.09.2026

**Der vorgezogene IceFlush verschwand spurlos (v1.5.110).** `moveGussDay` verschiebt nur die
Aktion, nicht die Phase. Am Zieltag griff dann `_dryLeadIn` mit dem Grund `'ice'` — die
Regel, die einen normalen Guss aus dem Hard-Dryback heraushält — und blockte den
vorgezogenen IceFlush selbst. Danach war er nirgends mehr, während das Wort „IceFlush" am
alten Tag klebte und der Eintrag dort die Spülmenge zeigte.
`moveGussDay` ruft für `'ice'` jetzt `_moveIceFlushTo` und verschiebt die **Phase**.

**Daraus zu lernen:** Ein Phasen-Ereignis lässt sich nicht mit dem Werkzeug für einen
Gießtag verschieben. Wo eine Schutzregel eine Aufgabe blockiert, muss geprüft werden, ob die
Aufgabe genau die ist, vor der die Regel schützen soll — hier war es umgekehrt.

**Am IceFlush-Tag stand eine Gießmenge (v1.5.111).** Die Zahl war richtig (Schmelzwasser aus
1 L Crushed Ice), die Frage falsch: Dort wird Eis gelegt und **nichts** gegossen. Die Karte
zeigt jetzt die Eismenge mit dem Satz „Wasser gießt du keines dazu".

**Offen geblieben, bewusst:** Am IceFlush-Tag stehen nun zwei Karten mit derselben
Information — die ältere „CRUSHED ICE HEUTE" und die umgewidmete Mengenkarte. Beide sind in
sich richtig und widersprechen sich nicht. Sie zusammenzulegen wäre ein Umbau des
Eintrag-Aufbaus und gehört zum großen Thema „Tageseintrag entschlacken", nicht in einen
Fehlerfix.

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

**Dieselbe Tatsache hat zwei Zahlen** — erledigt. Seit v1.5.97 erklärt die App die
Differenz zwischen Plan-Erntetag und Trichom-Fenster (`_trichVsPlan`), seit v1.5.99 zeigen
auch die Dashboard-Kacheln den gemessenen Tag („min. 5 d", „ab 10. Sept.") statt weiter den
Plan-Tag. **Als Muster bleibt der Punkt aber gültig:** Wo zwei Bildschirme dieselbe Frage
verschieden beantworten, gewinnt beim Überfliegen immer die größere Zahl — nicht die
richtigere. Bei neuen Anzeigen mitprüfen.

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

- Der **Tageseintrag am Gießtag**: 29 sichtbare Felder und **53 Knöpfe** im Profi-Modus,
  26 / 53 im Einsteiger-Modus (06.09.2026 nachgemessen, siehe Abschnitt 0c — die früher hier
  notierten „154 Felder" waren eine Fehlmessung und sind dort korrigiert). An normalen Tagen
  sind es 10 Felder. Mit v1.5.114 sind die sechs Tagesfelder von oben aus antippbar; die Zahl
  der Blöcke ist unverändert. Vorschlag liegt weiter vor: oben eine Aufgabenzeile („Heute:
  Hebe-Test + Trichome"), darunter nur die zugehörigen Blöcke, alles Übrige hinter „Mehr
  eintragen ▾". Patrick hat dazu noch nicht entschieden — erst sehen, ob die Sprungmarken
  reichen.
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

## 2 · Browser-Durchlauf vom 05.09.2026 — neun Befunde, vier behoben

Erstmals wurde die App nicht nur in jsdom, sondern **im echten Browser** mit Patricks
Sicherung durchlaufen (lokaler Server auf Port 8099, Handy-Format 375×812, beide Modi,
alle neun Bildschirme plus Tageseintrag an 13 Tagen). Keine Abstürze, kein `NaN`, kein
`undefined`. Die Fehler lagen nicht in der Mechanik, sondern im Inhalt.

**Achtung beim Testen im Browser:** Der Service Worker liefert nach `stale-while-revalidate`
zuerst aus dem Cache. Nach einem Neubau zeigt die Seite **beim ersten Laden noch die alte
Fassung** — erst der zweite Start hat die neue. Beim Prüfen also entweder zweimal laden oder
den Worker abmelden (`navigator.serviceWorker.getRegistrations()` → `unregister()`, dann
`caches.keys()` → `delete`). Das kostete in dieser Sitzung eine Fehlersuche an der falschen
Stelle.

**Behoben (v1.5.97):** Erntekarte gegen Trichom-Messung, siehe `CHANGELOG.md`.

**Behoben (v1.5.99):** Erfasste Ernteerträge waren unsichtbar. Der Ertrag lag an zwei
Stellen — `plants[].yieldWet/yieldDry` (Einzelernte seit v1.5.54) und
`c.plantHarvest[id].wetG/dryG` (älteres Formular) —, gelesen wurde nur der ältere Ort.
Patricks 37 g trocken meldeten die Einstellungen als „noch nichts erfasst", und
`cycleStats().harvestWeight` war null, die Zyklus-Bilanz zeigte also gar kein Erntegewicht.
Beide Funktionen lesen jetzt aus beiden Quellen ohne Doppelzählung; `setPlantHarvest`
schreibt an die Pflanze. **Daraus zu lernen:** Der Anzeigefehler war das Kleinere. Der
gefährliche Teil war, dass eine Eingabe im Formular eine zweite Zahl für dieselbe Pflanze
angelegt hätte. Wo zwei Eingabewege dieselbe Größe erfassen, muss vorher geklärt sein,
welcher Speicherort gilt.

**Behoben (v1.5.98):** Sortenliste — Spanne statt Züchter-Bestwert, siehe unten.

### Die Sortenliste (v1.5.98 — teilweise erledigt)

**Alle 15 Automatic-Sorten in `STRAINS` tragen Züchter-Bestwerte** (56–75 Tage). Der
Kommentar über der Liste sagt korrekt, dass die Zahl bei Autos der Gesamt-Zyklus ab Samen
ist — nur stimmt sie nicht. Nachgerechnet in der laufenden App:

| Weg | geplanter Erntetag |
|---|---|
| Chip „Sensi Amnesia XXL · 75d" antippen | **76** |
| „Samen bis Ernte 16–17 Wochen" eintippen | 119 |
| Patricks laufender Grow | 116 |
| Der App-eigene Düngeplan `sensi_amnesia_auto` (17 Wochen, `bloomDaysHint: 77`) | 116 |

`_wizFinish` rechnet dabei richtig (`75 − 21 − 8 − 3 = 43` Blütetage); falsch ist die
Eingangszahl. Die Photoperioden-Sorten sind nicht betroffen, dort ist `flowering` die reine
Blütezeit und plausibel.

Patrick hat am 05.09.2026 entschieden: **Spanne statt Einzelzahl**, geplant wird mit dem
oberen Ende — dieselbe Regel wie bei der Wochen-Eingabe („zu spät spülen kostet nichts, zu
früh spülen kostet die Ernte").

**Erledigt in v1.5.98:** `floweringLo`/`floweringHi` als Spanne, `strainDays(s)` als einzige
Stelle, die sie auslegt. Sensi Amnesia XXL trägt 105–120 Tage (Erntetag jetzt 121 statt 76).
Die drei falschen Beschriftungen sind behoben — Chip, Suchliste, Steckbrief und Wizard holen
ihren Text aus `strainDays()`.

**Noch offen: die übrigen 14 Automatics.** Sie tragen weiterhin Züchter-Bestwerte
(Northern Lights 65, White Widow 70, Gorilla Cookies 70, AK-47 65, Blueberry 70, Zkittlez 75,
Critical 65, Royal Gorilla 70, Quick One 56, Girl Scout Cookies 70, Sour Diesel 75,
Think Different 70, Jack Herer 75, OG Kush 70). Bewusst nicht geändert: Für sie liegt kein
Beleg im Projekt vor, und geschätzte Zahlen als Messwerte auszugeben wäre derselbe Fehler
noch einmal. In der App sind sie als „Züchter-Angabe, nicht nachgemessen" gekennzeichnet,
mit dem Rat, die Wochen-Angabe von der eigenen Samentüte einzutragen — dieser Weg rechnet
nachweislich richtig. Sobald Patrick belastbare Spannen freigibt, werden sie in derselben
Form nachgetragen; die Struktur steht bereits.

### Offen, mit allem Nötigen zum Weiterarbeiten

**Der Einsteiger-Modus wirkt im Tageseintrag kaum.** Die hier zuerst notierten „154
sichtbaren Eingabefelder in beiden Modi" waren **falsch gemessen** — die Zahl enthielt 141
Felder aus einer zugeklappten Liste. Die richtigen Zahlen und die Ursache stehen in
Abschnitt 0c. Was bleibt: Am Gießtag hat der Einsteiger 26 Felder gegen 29 beim Profi und
**genauso viele Knöpfe** (53), an normalen Tagen sogar einen mehr. Der Vorschlag aus
Abschnitt 1 (Aufgabenzeile oben, Rest hinter „Mehr eintragen ▾") steht weiter offen.

**Der Gieß-Fahrplan bleibt in beiden Modi zeichengleich** (6866 Zeichen, 21 Knöpfe,
9 Felder). Unverändert gegenüber der letzten Messung.

**Der Düngeplan hat im Einsteiger-Modus einen Knopf mehr** als im Profi-Modus. Der Grund
ist jetzt bekannt: Es ist „Alle 12 Wochen zeigen" — im Einsteiger-Modus wird die
Wochentabelle gekürzt und braucht einen Aufklapp-Knopf, den der Profi nicht braucht.
Harmlos in der Sache, verkehrt in der Wirkung.

**Behoben (v1.5.106): Nach der Zurück-Taste aus dem Gieß-Fahrplan war der Düngeplan leer.**
`goTo(t)` rendert `dash`, `cal`, `tips`, `set` und `gussplan` — `duenger` fehlte als einziger
Bildschirm mit eigenem Inhalt. Der Zurück-Handler schickt aus dem Gieß-Fahrplan dorthin;
sichtbar geschaltet, nie gefüllt.

**Daraus zu lernen:** Aufgefallen ist es nie, weil die Befehlssuche hinter `goTo` zusätzlich
`renderDuenger()` aufruft und den Fehler auf ihrem Weg kaschierte. Auf dem Handy ist die
Zurück-Taste aber der übliche Weg. **Wo eine Aufrufstelle einen fehlenden Schritt von Hand
nachholt, ist der Schritt an der falschen Stelle** — behoben wurde deshalb in `goTo` selbst,
nicht am Aufruf.

**Nicht geprüft:** Lexikon-Inhalte (302.000 Zeichen), Kalender im Detail, Foto-Galerie,
der Outdoor-Pfad und andere Substrat-/Sorten-Kombinationen. Alle Messungen stammen aus
Patricks Zustand; ein frischer Grow kann andere Fehler zeigen.

---

## 3 · Rechenwege im Browser geprüft (05.09.2026)

Zweiter Durchlauf, diesmal gezielt auf die Zahlen statt auf die Bildschirme: VPD-Formel
gegen die Magnus-Gleichung nachgerechnet, Düngedosen über beide `doseMode`-Wege verfolgt,
Trichom-Prognose zerlegt.

### Behoben: die Düngermengen kamen aus dem falschen Plan (v1.5.100)

Der schwerste bisher gefundene Fehler, weil an seinem Ende eine Milliliterzahl steht, die
jemand in eine Gießkanne füllt.

`getWeekDoses` las die Dosen aus dem globalen `S.weekSchedule` und den `doseMode` aus
`getActivePlan()` — beides aus dem **global aktiven** Plan, obwohl der Zyklus als Parameter
übergeben wird und über `c.fertPlanId` seinen eigenen Plan kennt. `switchFertPlan()` setzt
den aktiven Plan aber schon um, wenn man im Dünger-Bildschirm einen anderen Plan nur
**ansieht**. Ein Blick genügte also, um im Tageseintrag fremde Produkte und Mengen zu
bekommen — mit Patricks Daten: statt sechs BioBizz-Produkten neun Sensi-Produkte, darunter
POWHUMUS 10 ml/L, das in seinem Plan gar nicht vorkommt. Bei unterschiedlichem `doseMode`
kam zusätzlich der Faktor 7/Gießintervall daneben.

**Daraus zu lernen:** Eine Funktion, die den Zyklus als Parameter bekommt, ihn dann aber
nicht für die Datenquelle benutzt, ist ein Warnzeichen. Bei allem, was pro Zyklus
verschieden sein kann, gilt `getPlanForCycle(c)` — nie `getActivePlan()`.

### Geprüft und in Ordnung

- **VPD-Formel.** `_svp` ist die Magnus-Gleichung, `calcVPD` das Blatt-VPD daraus. Zwölf
  Wertepaare gegen eine unabhängig gerechnete Referenz geprüft, darunter 0 °C, −5 °C, 40 °C,
  0 % und 100 % Luftfeuchte — **alle exakt deckungsgleich**. Auch die Beispielwerte im
  Codekommentar (1,07 kPa Blatt gegen 1,43 kPa Luft bei 25 °C/55 %) stimmen.
- **weekly-split-Teiler.** Wochendosis ÷ (7/Gießintervall), danach die
  Feed-Tag-Kompensation. Rechnerisch korrekt.

### Behoben: die VPD-Bewertung unterschied nicht zwischen feucht und nass (v1.5.101)

`vpdZone` vergab für **−0,5 · −0,36 · −0,01 · 0 · 0,05** dasselbe Etikett: „Zu feucht ·
Lüfter an!". Physikalisch ist das ein Unterschied ums Ganze: Ein Blatt-VPD von 0 oder
darunter heißt, dass Wasser auf dem Blatt **kondensiert** — stehende Nässe auf den Blüten,
in der Blüte der direkte Weg zu Botrytis. Es gibt jetzt eine eigene rote Stufe „Nass —
Schimmelgefahr" mit Handlung statt Etikett, phasen- und Indoor/Outdoor-abhängig.
Dazu der Marker-Fix: `Math.max(0, Math.min(95, z.pct))` an beiden Stellen — vorher rutschte
er bei negativem VPD aus der Skala und war ausgerechnet in der gefährlichsten Lage
unsichtbar.

**Daraus zu lernen:** Eine Skala, die nach unten offen ist, braucht am unteren Ende eine
eigene Aussage. „Zu wenig von etwas Gutem" und „das Gegenteil tritt ein" sind nicht
dieselbe Kategorie — hier war es der Unterschied zwischen trägem Wachstum und Schimmel.

### Behoben: Trainings wurden ohne jeden Phasenbezug angeboten (v1.5.102)

`openTrainingPicker` zeigte alle acht Methoden ungefiltert, `pickTrainingType` speicherte
kommentarlos. An Tag 113 — Spülphase, IceFlush am Folgetag — standen dort Sämlings-Haube,
FIM, Mainlining und SCROG zur Auswahl. Jede Methode trug in `T.training` längst ein
`phase`-Feld; es wurde nur nirgends ausgewertet. `_trainingFit(c, iso, type)` hält es jetzt
gegen die aktuelle Phase, der Picker sortiert nach „Was jetzt sinnvoll ist" / „Heute nicht
dran", und eine unpassende Wahl bekommt vor dem Eintrag eine Rückfrage mit Grund.

**Daraus zu lernen:** Bevor eine neue Regel gebaut wird, erst nachsehen, ob die Antwort
schon im Datenmodell steht. Hier lag sie seit jeher da und wurde nur nicht gelesen.

**Und für Tests:** Die Gegenprobe „Patricks sieben echte Trainings müssen alle erlaubt
bleiben" ist wertvoller als jede erfundene Testlage. Eine Regel, die die reale Praxis
blockiert, wäre schlimmer als keine Regel.

### Geprüft und in Ordnung — nicht erneut aufrollen

Am 05.09.2026 im Browser mit echten Daten durchgerechnet. Alles unauffällig:

- **Trichom-Eingabe (`uTrich`).** Acht Fälle: Die Summe der drei Werte bleibt ausnahmslos
  100, negative Eingaben werden 0, Werte über 100 gekappt, Buchstaben zu 0. Bei Klar 80 +
  Bernstein 40 wird Klar sauber auf 60 zurückgenommen. Milchig ist rechnerisch der Rest —
  deshalb kann die Summe gar nicht auseinanderlaufen.
- **EC-Ziele über den Zyklus.** Sämling 0,4–0,6 → Vegi 0,7–1,0 → Stretch 1,0–1,4 → Bud-Set
  1,5–1,9 (Höhepunkt) → Reifung 1,3–1,7 → Spät-Reifung 0,8–1,2 → Spülen 0,2–0,4 → IceFlush
  nur Wasser. Anstieg, bewusste Absenkung, Spülung: fachlich richtig. Warnschwelle 2,5.
- **Klima-Ziele je Phase.** Anzucht 22–28 °C / 55–70 %, mittlere Blüte 22–26 °C / 45–55 %,
  Spätblüte 18–24 °C / 40–50 % (niedrige Feuchte gegen Schimmel), Spülen 20–24 °C / 40–50 %.
- **Hebe-Test (`classifyRestPct`).** Erde: Sweet Spot 25–35 %, darunter Wasserstress. Coco:
  Sweet Spot 60–75 %, ab 50 % zu trocken — Coco wird richtigerweise viel früher gegossen.
  Finisher: Sweet Spot 30–40 % als bewusster Trockenstress. Ungültige Eingaben ergeben null.
- **Gießmenge über den Zyklus.** Rampe 100 → 150 → 250 → 350 → 450 → 550 → 700 ml je
  Pflanze, danach Korridor-begrenzt; Spülen deutlich mehr, IceFlush wenig, ab Ernte 0.
  Plausibel für 11 L.

### Behoben: eine Pflanzenzahl größer als die Zahl der Pflanzen (v1.5.103)

Im Eintrag vom 03.06.2026 (Tag 19) stand `plantCount: 7` und daraus abgeleitet
`plantsAtWatering: 7`, obwohl nie mehr als fünf Pflanzen angelegt waren. **Patrick hat am
05.09.2026 bestätigt: „Ich hatte nie 7 Pflanzen."** Erst hatte ich das für einen legitimen
historischen Stempel gehalten und eine Deckelung ausdrücklich als falsch bezeichnet — die
Rückfrage hat das widerlegt.

Die Ursache liegt in `getEffectivePlantCount`: Es liest den eintragsspezifischen
Übersteuerungswert `cd.plantCount`, **ein Feld, das im heutigen Code keine Stelle mehr
schreibt.** Es stammt aus einer früheren Version, in der die Pflanzenzahl im Tageseintrag
stand. Der alte Wert überstimmte trotzdem alles andere und ließ sich nicht korrigieren, weil
es das Eingabefeld nicht mehr gibt. Zwei Folgen: Gießmenge dieses Tages 40 % zu hoch (3150
statt 2250 ml), und über den Stempel eine verzerrte Menge je Pflanze (3500 ÷ 7 = 500 statt
÷ 5 = 700 ml), die über `_recentPourPerPlant` in künftige Empfehlungen einfließt.

`_plantsCap(c)` deckelt beides jetzt an allen drei Lesestellen — **nur beim Lesen, die Daten
bleiben unverändert.** Ein Override kleiner als die Pflanzenzahl bleibt gültig.

**Daraus zu lernen, zweifach:**
1. Ein Feld, das gelesen aber nicht mehr geschrieben wird, ist eine Falle: Alte Werte wirken
   unsichtbar weiter, und die Oberfläche bietet keinen Weg, sie zu korrigieren. Beim
   Entfernen eines Eingabefelds gehört die Leseregel mit auf den Prüfstand.
2. **Ich hätte diesen Fehler beinahe wegerklärt.** Die Begründung „der Stempel ist Absicht"
   war für sich richtig und trotzdem die falsche Schlussfolgerung. Patricks Rückfrage-Antwort
   hat ihn aufgedeckt. Bei einer Auffälligkeit in den Daten also fragen, statt sie plausibel
   zu erklären — er weiß, was in seinem Zelt stand.

Sein Hinweis dazu, noch unbestätigt: Er erinnert sich an ein früheres Problem, dass „die
Wassermengen hochskaliert wurden, sobald ich eine Pflanze geerntet habe". Der Schreibweg für
`cd.plantCount` existiert heute nicht mehr, die Ursache lässt sich also nicht mehr
nachstellen. Die Deckelung fängt die Folgen ab; falls das Verhalten je wieder auftritt,
ist hier der Anfang der Spur.

### Beim Prüfen selbst aufgepasst

Drei Funktionen wurden beim Prüfen zunächst mit falscher Signatur aufgerufen und lieferten
dadurch beinahe Fehlalarme — am deutlichsten `classifyRestPct(restPct, isFinisher, isCoco,
noWaterPhase)`: Mit Zyklus und Datum als zweitem und drittem Argument gilt `isCoco` als wahr,
und für einen Erde-Grow erscheinen Coco-Texte und Coco-Schwellen. Das sah nach einem schweren
Fehler aus und war keiner. **Regel: Vor jedem Prüfaufruf die Signatur nachlesen.** Ein
gemeldeter Fehler, den es nicht gibt, kostet mehr Vertrauen als ein übersehener.

### Die App gegen ANBAU.md geprüft (05.09.2026)

Nach Patricks Überarbeitung der Fachgrundlage wurden die dort neu formulierten Regeln gegen
den Code gehalten. Das Ergebnis spricht für die App:

| Regel in `ANBAU.md` | Stand |
|---|---|
| 4.1 Drain-pH über 6,8 ist in gekalktem Torf normal | war bereits richtig — substratabhängig, Kalkpuffer wird erklärt |
| 8.1 Sättigung bei 900–1000 gilt fürs Einzelblatt, nicht den Bestand | war bereits richtig — Bleaching-Warnung erst ab ~1200 PPFD |
| 8.2 Thermischer Stress und Photobleaching sind zwei Mechanismen | war bereits getrennt geführt |
| 11 Griffelbräunung ist kein Reifekriterium | stand bereits wörtlich so drin |
| 5 ppm nur mit Skalenangabe | war bereits richtig — intern mS/cm, Skala 500/700 wählbar |
| **5.1 Drain-EC braucht eine Validitätsprüfung** | **fehlte — behoben in v1.5.104** |

**Bemerkenswert:** Bei der Lichtsättigung war meine erste Fassung von `ANBAU.md` falsch und
die App richtig. Patricks Überarbeitung hat das korrigiert. Die Fachgrundlage ist also
keine Einbahnstraße — sie wird auch am Code geprüft, nicht nur der Code an ihr.

### Behoben: Ablaufmessung ohne Gültigkeitsprüfung (v1.5.104)

Die App bewertete jeden eingetragenen Drain-Wert gleich, egal aus wie viel Durchfluss er
stammte — und konnte es auch nicht anders, weil die Ablaufmenge nirgends erfasst wurde. Neu
sind das Feld „Ablauf (ml)", `drainFlow(cd)` mit den vier Stufen aus 5.1, und die
Zurückhaltung beider Bewertungen (EC **und** pH), solange die Messung nichts aussagt.
Dazu die Differenzialdiagnose für organische Spätblüte: zwei mögliche Ursachen mit
Unterscheidungskriterium statt einer Diagnose.

**Daraus zu lernen:** Der Anzeigefehler, dass die Durchfluss-Zeile beim Tippen nicht mitzog,
fiel **nur beim sichtbaren Durchklicken** auf. Im Konsolentest waren alle Werte korrekt.
Patricks Vorgabe, die Vorschau beim Prüfen mitlaufen zu lassen, hat sich damit sofort
bezahlt gemacht.

### Behoben: Magnesium und Calcium lagen in einem Eintrag, am falschen Blattort (v1.5.107)

Die Diagnose-Datenbank `PROBLEMS` führte beide Nährstoffe als `calmag_deficiency` zusammen
und verortete sie an den **neuen** Blättern. Nach `ANBAU.md` 6.1 verhalten sie sich aber
gegenläufig: Magnesium ist im Blatt beweglich, die Pflanze zieht es bei Mangel aus den alten
Blättern ab — das Symptom steht **unten**. Calcium kann sie nach dem Einbau nicht mehr
umlagern, sein Mangel steht **oben**. Der Eintragstext beschrieb dabei das Magnesium-Bild.

Gemessen mit `diagnoseProblems`: Bei „untere Blätter · gelb · gefleckt" in der Blüte stand
Stickstoff-Mangel vorn, der richtige Eintrag auf Platz 3; bei „unten · gelb" fiel er auf
Platz 5 hinter Phosphor. Die Handlung lautete pauschal „CalMag 1–2 ml/L" — nach `ANBAU.md`
6.2 in der Blüte oft die falsche Richtung, weil dort meist Kalium das Magnesium verdrängt
und zusätzliches Calcium denselben Effekt hat.

Jetzt zwei Einträge mit je eigenem Ort, eigenem Bild und dem Unterscheidungskriterium im
Text. Die Magnesium-Handlung nennt die Reihenfolge: erst Blüte-Booster aussetzen, dann pH,
erst dann Bittersalz. Die Calcium-Handlung zeigt zuerst auf Umluft und Luftfeuchte, weil
Calcium nur mit dem Verdunstungsstrom ins Blatt kommt (`ANBAU.md` 1).

**Daraus zu lernen:** Wo zwei Stoffe im Namen eines Eintrags zusammengefasst sind, lohnt der
Blick, ob sie sich physiologisch gleich verhalten. Hier war die Zusammenfassung „CalMag" aus
der Produktwelt übernommen — es gibt ein Mittel, das beides enthält —, und die Datenbank hat
die Produktlogik statt der Pflanzenlogik geerbt.

### Behoben: Die Diagnose begründete sich mit Programmier-Vokabeln (v1.5.108)

Unter „Warum diese Hypothese" stand „• Symptome: oldLeaves; yellow · Kontext: passt zu Phase
(flush)". `diagnoseProblems` baute die Begründung aus den internen Schlüsseln, obwohl die
deutschen Beschriftungen zwei Bildschirme weiter oben auf den Auswahl-Knöpfen stehen —
`DIAG_LABELS` für die Symptome, `PN` für die Phasen. Zwei Übersetzer (`_diagWort`,
`_phasenWort`) setzen sie jetzt ein, mit Rückfall auf den Schlüssel.

**Daraus zu lernen, zweifach:** Erstens dasselbe Muster wie bei `_trainingFit` — die Antwort
lag längst im Datenmodell und wurde nur nicht gelesen. Zweitens: Aufgefallen ist es **nur
beim sichtbaren Durchklicken**. Der Wert war im Konsolentest korrekt; er war bloß für
niemanden lesbar. Das ist nach v1.5.104 der zweite Fehler, den die mitlaufende Vorschau
gefunden hat und ein Zahlentest nicht finden konnte.

### Behoben: Die Dünge-Regeln kannten weder Substrat noch Plan (v1.5.109)

Drei der fünf Zeilen in der Tipps-Karte „Dünge-Regeln" waren feste Zahlen: pH „immer auf
6.4" (der Erde-Wert, für Coco 0,4 und für Hydro 0,9 Einheiten zu hoch), „Erst CalMag" (falsch
bei jedem Plan mit Silikat — es fällt mit Calcium aus, `ANBAU.md` 10) und ein namentlich
genanntes BioBizz-Produkt als allgemeine Regel. Alle drei kommen jetzt aus dem Zustand:
`phTargetFor(c.medium)` fürs pH-Ziel, `S.mixOrder` für den ersten Mischschritt.

**Daraus zu lernen:** Der Widerspruch stand innerhalb derselben App an zwei Stellen — der
cup_sieger-Plan sagt selbst „Silica Force IMMER zuerst, sonst Calcium-Ausfällung", die
Tipps-Karte sagte „Erst CalMag". Wo eine allgemeine Karte dasselbe Thema behandelt wie eine
plan-spezifische Angabe, muss die Karte aus dem Plan lesen — sonst widersprechen sie sich,
sobald jemand den Plan wechselt.

### Zur Entscheidung: 5–10 % oder 15–25 % Ablauf?

Beim Prüfen aufgefallen, **bewusst nicht geändert**, weil es ein Umbau über acht Stellen wäre.
Die App empfiehlt durchgängig „5–10 % Drain bei jedem Guss" (Tipps-Karte, Gieß-Leitfaden,
Tageseintrag, die `drainInfo` mehrerer Pläne, Lexikon, Anfänger-Fragen). Seit v1.5.104 stuft
`drainFlow` aber nach `ANBAU.md` 5.1 ein: unter 10 % Durchfluss ist eine Ablaufmessung
**gar keine**, aussagekräftig wird sie erst ab 15 %.

Beides kann richtig sein, weil es zwei verschiedene Dinge sind: 5–10 % ist eine sinnvolle
**Gieß**praxis für Erde (spült Salze, ohne den Topf dauernass zu halten), 15–25 % ist die
**Mess**bedingung für einen belastbaren Drain-EC. Nur steht das nirgends, und in der Wirkung
heißt es: Wer nach den Gieß-Regeln der App gießt, bekommt von der App bei jeder Messung „zu
wenig Ablauf".

Vorschlag zur Entscheidung: Die Gießempfehlung bleibt bei 5–10 %, aber überall dort, wo eine
Ablaufmessung eingetragen wird, steht dazu „zum Messen brauchst du diesmal mehr — etwa ein
Fünftel der Gießmenge". Das ist ein Satz an zwei, drei Stellen statt einer neuen Zahl an acht.

### Noch nicht geprüft

Der Rest des Tageseintrags (pH-Eingabe, Notiz-Chips, Foto-Anhang), der Outdoor-Pfad und die
Kalender-Ansicht im Detail. Aus der Diagnose-Datenbank `PROBLEMS` sind die Nährstoff-Einträge
jetzt gegen die Mobilität aus `ANBAU.md` 6.1 gehalten; die Schädlings- und Pilz-Einträge noch
nicht. Offen bleibt außerdem, ob ein eigener Eintrag für **Eisenmangel** fehlt — das Bild
(gelbe junge Blätter mit grün bleibenden Adern bei zu hohem pH, `ANBAU.md` 4) läuft derzeit
über `ph_lockout` mit und hat keine eigene Zeile.

Die Mischreihenfolge aus `ANBAU.md` 10 wurde am 05.09.2026 geprüft und ist **in Ordnung**:
Alle Presets führen Silikat zuerst, dann Calcium/Magnesium, Sulfate, Huminstoffe, Phosphate,
Basisdünger und biologische Mittel zuletzt — genau die Reihenfolge aus dem Dokument. Nicht
erneut aufrollen. Ungeprüft bleibt dort nur der Fall **eigener Pläne**: Sie übernehmen die
Reihenfolge, in der der Nutzer seine Produkte angelegt hat, ohne dass die App prüft, ob ein
Silikat weiter hinten steht. Das wäre eine neue Automatik und damit Patricks Entscheidung.

---

## 4 · Am 05.09.2026 behoben (v1.5.96)

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

## 5 · Patricks laufender Grow

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

## 6 · Was in dieser Sitzung passiert ist (v1.5.44 → v1.5.84)

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

## 7 · Fehler dieser Sitzung, aus denen zu lernen ist

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

## 8 · Testinfrastruktur

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

35 Testdateien, alle grün in beiden Zeitzonen (Stand v1.5.113):

`test_audit_screens` · `test_befehle` · `test_dialog_und_namen` · `test_dosisquelle` · `test_drain` · `test_drainregelkreis` · `test_duengeregeln` · `test_duengeplaene` ·
`test_endspurt` · `test_entwurf` · `test_ernteabgleich` · `test_ertrag` ·
`test_fixes_0905` ·
`test_gussmenge` · `test_iceflush` · `test_gussmove` · `test_gussplan` ·
`test_gussmove_kombi` · `test_naehrstoffort` · `test_navrender` · `test_navscroll` · `test_planladen` · `test_planpause` ·
`test_planrueckgrat` · `test_pflanzenzahl` · `test_planzuordnung` · `test_saemling_tage` · `test_sortendauer` · `test_startup` ·
`test_training` · `test_trichchart` · `test_trichedit` · `test_trichphasen` · `test_vpd` · `test_wochenfolgen`

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

## 9 · Schlüsselkonzepte im Code

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

## 10 · Kleinere offene Punkte

- „Erledigt"-Karte erscheint an Tagen ohne Aufgabe (von Patrick zurückgestellt)
- Getrennte Trichom-Verläufe je Pflanze — bewusst nicht gebaut, stattdessen `ripeOffset`
- Ertragserfassung existiert je Pflanze, aber keine Auswertung über Zyklen hinweg

**Am 05.09.2026 abgeschlossen und deshalb hier gestrichen:**

- *„Messungen berichtigen"-Liste schneidet ab* — behoben in v1.5.105.
- *Fünf Pflanzen angelegt, drei stehen* — behoben in v1.5.99, die Zeile nennt jetzt
  „(5, davon 2 schon geschnitten)".
- *Zwei Wiederholungen des Plan-Untertitels im Düngeplan* — **nachgeprüft, kein Fehler.**
  Die zwei Stellen sind die Kopfkarte des aktiven Plans („7 Produkte · …", `heroSub`) und
  die Vorlagen-Liste, die jede Vorlage mit ihrem Untertitel zeigt — darunter zwangsläufig
  auch die gerade aktive. Sie stehen weit auseinander und erfüllen verschiedene Zwecke.
  Nicht anfassen.
