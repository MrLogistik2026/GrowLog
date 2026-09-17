# GrowSmart — Übergabe

Stand: **v1.5.283** · index.html 2,42 MB · 692 Funktionen
Zuletzt fortgeschrieben am 15.09.2026 (Gießmenge, Abschnitt 0m.1). Fünf Fehler behoben: Der Widerspruch zwischen
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

## 0o · Bewertung vom 17.09.2026 — Referenz für die nächsten Versionen

Patrick am 17.09.2026: „Ich hätte gerne eine Einschätzung und Bewertung wie die App funktioniert … in einer 1–10 Skala
… Das nehmen wir dann als Referenz um die App noch besser zu gestalten." Bewertet ist **v1.5.263**.

**Ergebnis: 6,4 von 10** — aus Anfänger-Sicht 6,2, aus Profi-Sicht 6,6. Urteil: Der Rechenkern (Gießmenge, Klima,
Drain-Bewertung) ist fachlich stark, aber die Bildschirme davor tragen ihn noch nicht — die Startseite folgt bei Ernte
und vollem Topf dem Kalender statt der eigenen Messung, der Gießtag ist für Anfänger zu dicht, Einstellungen verschieben
die Kette ohne Vorschau, und ein beschädigter Speicher kann still den ganzen Grow löschen.

**Übersichtsseite mit Begründungen, Belegen, Einzelnoten, allen Hebeln und Fehlern:**
https://claude.ai/artifact/ELunakGnB2x3bSxTtdFZ1A (privat; zum Teilen über das Menü der Seite).

**So entstanden die Noten:** Fünf Agenten mit je einer Sicht (Anfänger, Profi, Fachwissen, Technik, Stimmigkeit) haben
unabhängig bewertet, jede Note mit Beleg — Messung in jsdom (mit Patricks Daten oder leerem Speicher), Code-Stelle oder
Abschnitt aus `ANBAU.md`. Ein sechster Agent hat als Skeptiker kalibriert, doppelte Befunde zusammengelegt und die
schweren Fehler am Code nachgeprüft. Bekannte offene Punkte zählen voll; ein Bereich mit offenem Hauptproblem bekommt
keine 8. Gewichtet nach der Mission: H1, H4, F1, F3 dreifach; T3–T7, S1–S3 einfach; der Rest zweifach. Unsicherheit etwa
±0,3 je Kategorie, wo nur eine Sicht gemessen hat eher ±0,5. Rohdaten (vergänglich): `scratchpad/bewertung/` im
Sitzungsordner (`final.json`, je Sicht eine Datei, `auftrag.md` mit Skala und Regeln — für die nächste Runde wiederverwendbar).

**Daraus zu lernen:** Claudes eigene Noten, vorab und ohne Messung geschrieben, lagen fast überall über denen der
messenden Agenten (Intelligenz 8,3 gegen 7,5, Tests 7,8 gegen 6,6, Offline/Handy 7,5 gegen 6,5). Wer die eigene Arbeit
aus dem Gedächtnis bewertet, bewertet die Absicht, nicht den Stand. Für die nächste Bewertung: messen, dann benoten.

| ID | Kategorie | Note | Anfänger | Profi |
|---|---|---|---|---|
| H1 | Handhabung für Anfänger | **6,2** | 6,2 | – |
| H2 | Handhabung für Profis | **6,6** | – | 6,6 |
| H3 | Erstkontakt: Willkommen, Assistent, Demo-Zyklus | **6,5** | 6,5 | – |
| H4 | Tägliche Nutzung am Gießtag | **6,7** | 6,4 | 7,1 |
| H5 | Übersichtlichkeit und Informationsdichte | **6,0** | 5,8 | 6,6 |
| H6 | Einstellungen und ihre Kopplung an Plan und Kalender | **5,0** | 4,7 | 5,4 |
| I1 | Intelligenz der App („Regeln statt Regler") | **7,2** | 7,3 | 7,1 |
| I2 | Gießmenge und Gießzeitpunkt | **7,6** | 7,5 | 7,7 |
| I3 | Düngung und Düngeplan-Vorlagen | **6,4** | 6,5 | 6,3 |
| I4 | Klima und VPD | **8,0** | 8,1 | 7,9 |
| I5 | Ernte, Trichome, Erntefenster | **5,2** | 4,8 | 5,5 |
| I6 | Diagnose und Erste Hilfe | **6,0** | 5,7 | 6,4 |
| F1 | Fachliche Richtigkeit von Zahlen und Texten | **6,5** | 6,3 | 6,8 |
| F2 | Ehrlichkeit: Belegtes von Unbelegtem getrennt | **6,9** | – | – |
| F3 | Schutz vor tödlichen Anfängerfehlern | **6,6** | 6,5 | 6,9 |
| F4 | Lexikon und Lernwert | **6,9** | 6,6 | 7,1 |
| F5 | Verständlichkeit der Sprache | **6,2** | 6,0 | – |
| K1 | Konsistenz: eine Quelle je Zahl | **6,1** | 5,8 | 6,5 |
| T1 | Stabilität und Fehlerfreiheit | **7,5** | – | – |
| T2 | Datensicherheit und Datenschutz | **6,3** | 5,9 | 6,7 |
| T3 | Offline/PWA und Handy-Tauglichkeit | **6,6** | – | – |
| T4 | Geschwindigkeit | **7,3** | – | – |
| T5 | Barrierefreiheit | **3,6** | – | – |
| T6 | Wartbarkeit und Zukunftssicherheit | **5,6** | – | – |
| T7 | Tests und Qualitätssicherung | **6,7** | – | – |
| S1 | Coco und Hydro | **5,5** | 5,1 | 5,7 |
| S2 | Outdoor | **4,3** | 4,2 | 4,4 |
| S3 | Design und Optik | **6,0** | – | – |

**Die zehn größten Hebel** (Nutzen für Anfänger und Profi im Verhältnis zum Aufwand; Rang 11–19 auf der Übersichtsseite):

1. **Fehler — Startseite an die eigene Messung koppeln.** `plainSentence` (app.js ~15348) und die Erntetag-Karte
   (~15605) befehlen am Plan-Erntetag „Schneide die Pflanze ab" ohne Blick auf die Trichom-Messung; bei vollem Topf
   (Hebe-Test „Voll") sagen Satz und Karte „etwa 0 ml … bis unten etwas herausläuft" (~15336, ~15568), der Eintrag
   dagegen „heute nicht gießen" (~26222). Betrifft F3, I5, H4.
2. **Fehler — Nachschlagetexte an `ANBAU.md` angleichen, mit Wächter-Test.** Drain-pH-Soll 6,0–6,5 in Erde und
   Lockout-Spülung (~34065, ~32790, ~34045, Infotext ~5661) gegen 4.1; Mg-Zeile mit CalMag (~34046) gegen 6.2;
   Luftfeuchte 60–65 % bei Spinnmilben und Hitze ohne Blüte-Grenze (~1512, ~5727, ~33725, ~33904) gegen den Deckel;
   Sämlings-EC „SOFORT spülen" (~14369) gegen 13.1; Diagnose ausgebleichte Blütenspitzen → „Lampe näher" (~1446).
3. **Fehler — Speicher-Störfälle abfangen.** `loadS` verschluckt unlesbares JSON (~4185) und versucht die Tageskopie
   nicht; `_autoBackup` (~5240) ersetzt die Kopie danach durch den leeren Stand — gemessen: stiller Totalverlust. Dazu
   `cycles: null` bricht den Start ab, `importData` (~25358) nimmt jede JSON-Datei und fährt keine Migrationen. Tests fehlen.
4. **Umbau — Erntefenster als eine Quelle** nach Prüfplan 0m.2; darin ein Fehler: Ein höheres Bernstein-Ziel ergibt ein
   *früheres* Fenster (Rückfall von `harvestWindow` auf die Samentüte, ~10339).
5. **Umbau — Vorschau vor dem Sichern** (Abschnitt 1, Schritt 1). Darin ein Fehler: Der Block „Damit ergibt sich"
   rechnet beim Tippen nicht nach (`dd`, ~21540).
6. **Umbau — Gießtag-Eintrag im Einsteiger-Modus entschlacken** (Abschnitt 1): Einsteiger spart dort 3 Felder, 0 Knöpfe.
7. **Fehler — Assistent:** kein ⓘ auf neun Bildschirmen, obwohl das Willkommen sie verspricht; „5 einfache Fragen" bei
   acht; „Feminisiert" als photoperiodisch erklärt (~22857). Ob Samentüten-Wochen einen Puffer bekommen, entscheidet Patrick.
8. **Fehler — Düngeplan-Vorlagen fertig prüfen** (0n): Plagron, CANNA, Hesi ohne geklärten Dosis-Modus, Green Sensation,
   Produktnotizen mit Wirkungsversprechen, EC im Wachstum an drei Stellen verschieden.
9. **Umbau — Lesbarkeit auf dem Handy:** Zoom-Sperre (head.html:5), Hinweisfarben 2,2:1 statt 4,5:1, 80 % des Textes
   ≤ 11 px, helles Thema mit harten dunklen Flächen. Hebt die schwächste Note (T5 3,6) am stärksten.
10. **Fehler — Begriffe-Prüfung Schritte 8–24:** „Dryback" 35×, „Grow" 8×, „Runoff" 14× sichtbar, Dezimalpunkt und -komma gemischt.

**Reihenfolge ab jetzt:** Die Fehler aus den Hebeln 1–3 werden als Nächstes behoben, je mit eigener Version und Test —
sie gehen vor die Liste „Als Nächstes" in Abschnitt 0l. Die Umbauten hat Patrick am 17.09.2026 freigegeben: „baue,
programmiere alles nach deinen belieben. Hauptsache wir erreichen die 10/10!"

**Stand Hebel 1:** Der Erntetag folgt der Trichom-Messung (v1.5.264). Eine stehende Pflanze nach dem Plan-Erntetag gilt
nicht mehr als geerntet (v1.5.265, `ernteOffen`), ihr Klima folgt der späten Blüte (v1.5.266). Ein voller Topf heißt auf der
Startseite „heute nicht gießen" (v1.5.267), auch am Spültag (v1.5.272). Die stehende Pflanze heißt „Ernte offen" (v1.5.269). IceFlush und Dunkelphase stehen nicht mehr im Stadium „Trocknung" (v1.5.271). Ein eingetragener Guss zählt als erledigt (v1.5.273). Der Gieß-Fahrplan sagt nach dem Guss und bei vollem Topf nicht mehr „heute" (v1.5.274). Offen, in dieser Reihenfolge: Gießpunkt schlägt Kalender
(Nachholen, überfällig, nächster Guss mit Reserve) · IceFlush als Eistag in der Mitteilung (Hinweis und Tipp: v1.5.276, Gieß-Fahrplan: v1.5.277) · alle
Pflanzen einzeln geerntet · Ernte-Kacheln nennen die Messung.

**Bei der nächsten Bewertung** dieselbe Skala, dieselben Kategorie-IDs und dieselben Regeln aus `auftrag.md` nehmen und
die Noten gegen diese Tabelle stellen.

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

## 0n · Dritte Agenten-Runde (16.09.2026) — die elf Düngeplan-Vorlagen

Patrick am 16.09.2026: „Gerne kannst du die anderen Pläne gleich mit überprüfen oder überprüfen lassen." Drei Prüfer,
je ein Ausschnitt, **kein Code geändert** — nur Befunde mit Zeilennummer. Auflagen: keine Dosis anfassen, keine Zahl
ohne Beleg aus dem Projekt, Hersteller-PDFs sind auf diesem Laptop nicht lesbar und offene Fragen bleiben offen.
**Ergebnis: 70 Befunde, 30 offene Fragen.** Rohdaten: `scratchpad/agenten4/plaene_{unvollstaendig,biobizz,rest}.json`
im Sitzungsordner (vergänglich — das Folgende ist die dauerhafte Fassung).

**Selbst nachgemessen, nicht nur berichtet:**
- **Plagron Green Sensation** steht in `mixOrder` (2503) und `mixInfo` (2504) an **letzter** Stelle, während der
  eigene Lexikon-Eintrag „Silizium (Silica)" (32625) genau dieses Produkt namentlich führt („Plagron Green Sensation
  (enthält Silizium)") und sagt: „**Immer als Erstes ins Wasser**". Nach `ANBAU.md` 10 fällt Silikat mit Calcium und
  Phosphat aus. Die App widerspricht sich hier selbst — eine der beiden Stellen ist falsch.
- **Acti·Vera in `biobizz_official`**: Düngetag **0,43–0,59 ml/L**, Wasser-Tag **1,0** (gemessen bei Intervall 3,
  Wochen 2/5/7/8). Dieselbe Zahl, zwei Bedeutungen — am Wasser-Tag bekommt die Pflanze rund doppelt so viel wie am
  Düngetag. Der Feed-Tag-Ausgleich gleicht das nicht aus.

### A · Ohne Rückfrage behebbar (App widerspricht sich selbst)

> Was davon erledigt ist, steht in der Erledigt-Liste in Abschnitt 0l — abgearbeitet wird von oben nach unten, jeder Punkt mit eigener Version und eigener Prüfung.

| Plan | Zeile | Was |
|---|---|---|
| cup_sieger | 2751 | `mixOrder` führt „Mykorrhiza HomeGrow24" als Mischschritt, Produktnotiz (2815) und `mixInfo` sagen „TROCKEN an die Wurzel, NIE ins Gießwasser". Das Plan-Blatt rendert `mixOrder` als nummerierte Schritte — wer folgt, rührt die Wurzelimpfung ins Wasser. |
| cup_sieger | 2781/2785/2789 | Drei Wochen-Tipps kündigen MKP an, das im `schedule` nicht mehr vorkommt und das `mixInfo` selbst als „gestrichen" führt. Produkt steht ohne Dosis in der Liste (2809), das Lexikon zeigt darauf (32521). |
| cup_sieger | 2745 | Untertitel nennt „12 Produkte" — es sind 11. |
| canna_coco / ghe_flora | 2662 / 2713 | Woche 11 „Coco trocknen lassen" bzw. „Trocknen lassen" — seit v1.5.200 hat Coco einen eigenen Gießpunkt, unter 60 % Restgewicht meldet die App „Zu trocken für Coco". Die Erd-Pläne sind längst umgestellt, die Coco-Pläne hat v1.5.200 nicht mitgenommen. |
| biobizz_konservativ | 2596 | `mixInfo`: „CalMag zuerst (verhindert Phosphat-Ausfällung)" — dreht den Mechanismus um. Nach `ANBAU.md` 10 ist Ca²⁺ + PO₄³⁻ genau die Paarung, die **ausfällt**. Ein Anfänger lernt dort das Gegenteil. |
| biobizz_konservativ | 2595 | Epsom steht an Position 8 **nach** den Basisdüngern; `rainbow_auto` führt es nach `ANBAU.md` 10 direkt hinter CalMag. |
| biobizz_master | 2371, 2380–2384 | Wirkungszusagen: „für dichte, trichomreiche Blüten", „Trichom-Push … steinhart dichte Blüten", „Herbst-Stress einleiten", „Nährstoffe aus den Sonnensegeln leersaugen". Handlung behalten, Zusage streichen (`ANBAU.md` 14) — dieselbe Arbeit wie v1.5.172/192. |
| biobizz_konservativ | 2604, 2610 | „Trichom-Produktion startet", „Top·Max maximal für Dichte"; IceFlush ohne den Ehrlichkeits-Satz aus `ANBAU.md` 14. |
| cup_sieger | 2793 | „24h Pitch-Black Tag 3-4 einbauen!" — Zwischen-Dunkelphase ohne Beleg. |
| ghe_flora | 2722 | „Reifebeschleuniger" als Wirkungszusage ohne Quelle. |
| feste Zahlen statt Quelle | master 2370/2371, light 2467, konservativ 2597, official 2426, canna_coco 2649/2650, ghe_flora 2700/2701/2712, plagron 2504, canna 2530 | pH, Drain-Ziel und Gießpunkt stehen als feste Zahlen neben `phTargetFor`, `DRAIN_ZIEL`, `T.drainRegelKurz()` und `giesspunktFor`. Dieselbe Fehlerklasse wie v1.5.216/221 — `canna_coco` (2650) macht es bei DRAIN_ZIEL bereits richtig vor. |
| biobizz_light | 2452–2493 | Kein `weekFocus` — ausgerechnet der Plan, den der Assistent Einsteigern empfiehlt (22842), führt ohne ein einziges Wochenwort durch den Zyklus, während der Profi-Plan zwölf Tipps hat. |
| Wochenplan-Editor | 19462 | Beschriftet **jede** Tabelle mit „Dosis pro Woche", auch bei den sieben `per-watering`-Plänen. Das ist der Nährboden, auf dem der weekly-split-Befund unbemerkt bleiben konnte. Überschrift aus `_doseModeFor(plan)` ableiten. |
| Lexikon | 32277 | „K-Booster und CalMag immer parallel skalieren" — `ANBAU.md` 6.2 und der eigene Diagnosetext (1242) sagen das Gegenteil: zusätzliches Ca/Mg verschiebt das Verhältnis erneut. |

### B · Braucht Patricks Entscheidung

- **`weekly-split` hielt sein Versprechen nicht — entschieden und behoben (v1.5.237).** Patrick am 16.09.2026:
  „Repariere es erst mal bevor wir etwas abschaffen." Nachgemessen waren es 0–216 % der Wochenmenge, jetzt 100 %;
  Messung und Rechenweg stehen im CHANGELOG. Der folgende Absatz beschreibt den Stand davor.
- *(Stand vor v1.5.237:)* Geteilt wird durch das nominelle 7/Intervall (9846), die Feed-Tage
  werden aber über die **gedehnte** Plan-Woche gezählt und wieder hochskaliert (9207). Gemessen vom Prüfer: Bio·Grow
  liefert 59 % bis 214 % der gespeicherten Wochenmenge, und bei 42 Blütetagen fällt Plan-Woche 7 **ganz** aus (der
  einzige Gießtag dort ist ein Wasser-Tag). *(Diese Spanne habe ich nicht selbst nachgerechnet — der Teiler und der
  Acti·Vera-Fall oben sind gemessen.)* Frage: Modus reparieren (Teiler = tatsächliche Feed-Tage) oder abschaffen?
- **`plagron`, `canna`, `hesi` haben kein `doseMode`** und laufen still auf dem Rückfall `per-watering` (9255).
  Der Bildschirm behauptet dem Nutzer „Volle Dosis jeden Gießtag" (19399). Blütewoche bei Intervall 3: 5,0 ml/L je Guss
  gegen 2,14 im Wochenmodus — Faktor 2,33. Die Entscheidung gehört mit der BioBizz-Frage in einen Zug. *(BioBizz ist seit v1.5.240 entschieden: je Guss,
  wie das Herstellerblatt. Für diese drei steht der Blick in ihr eigenes Herstellerblatt noch aus.)*
- **Kein Ca/Mg in diesen drei Plänen — entschieden und behoben (v1.5.239).** Patrick am 16.09.2026: „Bau es
  bitte nach deinem Vorschlag." Es wurde der Hinweis, nicht das Produkt; die Abwägung steht im CHANGELOG.
  **Offen bleibt der Umbau:** eine generische Regel statt der drei Texte — sie bräuchte die Wasserhärte, die die
  App nicht kennt, und würde als Einzige auch schon gespeicherte Plankopien erreichen. *(Stand davor:)*
- **Kein Ca/Mg in diesen drei Plänen, aber je ein PK-Booster.** Alle acht anderen führen CalMag als Produkt ①.
  `ANBAU.md` 3: bei weichem Wasser ist Cal/Mag Grundversorgung. Produkt aufnehmen (Umbau) oder Hinweis genügt?
- **Rainbow — entschieden und behoben (v1.5.238).** Patrick am 16.09.2026: „anhand deiner Analysen und
  Sichtweisen abwägen was für die User am Sinnvollsten ist." Alle vier Punkte sind umgestellt; Begründung je
  Punkt im CHANGELOG. Offen bleibt allein die Etikett-Dosis von Alfa Boost. *(Stand vor v1.5.238:)*
- **Rainbow (dein Blatt, deshalb deine Entscheidung):** Woche 14 „Ziel Drain-EC höchstens 0,5" (2314, steht seit
  v1.5.211 offen) · Ernte-Trigger „5–8 % Bernstein · unter 5 % klar" (2315) gegen `_targetAmber` und
  `RIPE_CLEAR_DONE` = 10 · Restgewicht-Gates und „Hard Dryback 25–30 %" (2347) gegen `GIESSPUNKT` · Nacht-Klima
  (2306/2310), obwohl die Klima-Tabelle des Blatts bewusst draußen bleiben sollte (0k).
- **Alfa Boost** fehlt weiter die Etikett-Dosis — vier Wochen-Tipps fordern ein Mittel an, das in Wochenblatt und
  Mischliste nicht auftaucht (0k).
- **Coco-pH** 5,8–6,2 (App) gegen 5,5–6,0 (`ANBAU.md` 4): steht seit 0f offen, beide Coco-Pläne schreiben es fest.

### C · BioBizz Official — erledigt mit dem Herstellerschema 2026 (v1.5.240)

Patrick hat nacheinander das Schema **2020** (Bild), das All·Mix-Blatt **2024** (Bild) und zuletzt das aktuelle
Blatt **2026** von biobizz.com geschickt (PDF, auf seinem Desktop „Biobizz Aktuell.pdf"): „Danach können wir uns
richten." Umgesetzt ist dessen Seite „Light·Mix oder Coco·Mix" als neue Vorlage **`biobizz_official_2026`**
(„BioBizz Official 2026"). Begründung und Prüfung im CHANGELOG; hier, was man beim Weiterarbeiten wissen muss.

**Der Befund davor** (bleibt als Lehre): Gegen das Schema 2020 lagen 52 von 54 Gaben unter 90 % — Bio·Heaven
fehlte ganz, Top·Max und Acti·Vera standen pauschal auf 1, CalMag auf 1–2, und `weekly-split` teilte
Konzentrationen je Liter noch einmal durch die Güsse der Woche. Der Untertitel „Offizieller Herstellerplan 2025"
war an 52 von 54 Stellen keiner.

**Die Zahlen 2026** — ml je Liter Gießwasser, bei jedem Guss. Plan-Woche 1 = Vermehrung, 2 = Wachstum,
3–10 = Blühwoche 1–8, 11 = Wasser, 12 = Ernte:

| | Verm. | Wachst. | WO1 | WO2 | WO3 | WO4 | WO5 | WO6 | WO7 | WO8 |
|---|---|---|---|---|---|---|---|---|---|---|
| Root·Juice | 4 | 4 | – | – | – | – | – | – | – | – |
| Bio·Grow | – | 2 | 2 | 2 | 3 | 3 | 4 | 4 | 4 | 4 |
| Bio·Bloom | – | – | 1 | 2 | 2 | 3 | 3 | 4 | 4 | 4 |
| Top·Max | – | – | 1 | 1 | 1 | 1 | 1 | 4 | 4 | 4 |
| Bio·Heaven | 2 | 2 | 2 | 2 | 3 | 4 | 4 | 5 | 5 | 5 |
| Acti·Vera | 2 | 2 | 2 | 2 | 3 | 4 | 4 | 5 | 5 | 5 |
| *Fish·Mix — nicht im Plan* | – | 2 | 2 | 2 | 3 | 3 | 4 | 4 | 4 | 4 |
| *Microbes g/L, 1×/Woche — nicht im Plan* | 0,4 | 0,4 | 0,2 | 0,2 | 0,4 | 0,4 | 0,4 | 0,2 | 0,2 | 0,2 |

**Zweite Abschrift:** das Schema 2020 — 46 von 47 Gaben gleich; die Abweichung (Root·Juice unter „Wachstum") ist
eine echte Änderung und steht so auch auf der All·Mix-Seite 2026 und im All·Mix-Blatt 2024. Beide Abschriften
stehen in `test_biobizzschema.js`. **All·Mix und Light·Mix unterscheiden sich nur bei Bio·Grow** (All·Mix
durchgehend 1) — die Spalten nie tauschen.

**Die alte Fassung bleibt stehen, bewusst.** Gespeicherte Kopien lesen Modus, EC-Spitze und Feed-Tag-Regel live
aus der Vorlage; deshalb steht sie weiter in `FERT_PRESETS` unter `biobizz_official`, markiert mit
`abgeloest: 'biobizz_official_2026'` — nicht wählbar, und der Untertitel sagt über solchen Kopien, dass sie vom
Schema abweicht. **Nicht entfernen**, solange es solche Kopien geben kann; auch Patricks Run 01 hängt daran. Die
Wochendosis-Tests (`test_weeklysplit` u. a.) prüfen den Modus über genau diese Vorlage weiter.

**Offen, zur Entscheidung:**
- **Fish·Mix — entschieden (Patrick, 16.09.2026, v1.5.241):** „Ich nutze persönlich kein Fishmix, dies soll man auch
  nicht zusammen Düngen. Fishmix ist eher für outdoor." Die Vorlage bleibt bei Bio·Grow und sagt jetzt ausdrücklich:
  nie beide zusammen. **Für den geplanten Outdoor-Bereich merken:** Dort kann Fish·Mix die Alternative zu Bio·Grow
  sein — laut Blatt 2026 mit denselben Mengen.
- **Microbes kommt einmal pro Woche.** Eine Gabe mit eigener Häufigkeit kennt die App nicht (0m.4 d) — das wäre
  ein Umbau am Produkt-Modell und beträfe auch Alfa Boost („bei jedem Gießvorgang", siehe unten).
- **Cal/Mag-Menge:** Das Blatt 2026 nennt keine. Das Schema 2020 hatte eine Tabelle (Erde 0,3 / 0,5 / 0,8 ml/L
  über WK 1–6 / 6–8 / 8–10 — die Grenzen überlappen), nur einmal abgeschrieben; nicht übernommen.
- **Blattdüngung** (Alg·A·Mic, Acti·Vera, Fish·Mix bis Blühwoche 2, laut Blatt 1–3× pro Woche) ist nicht
  abgebildet.
- **Gespeicherte Kopien auf die neue Fassung heben** — nur auf Knopfdruck denkbar, nie still: Ein laufender Grow
  bekäme sonst mitten im Zyklus andere Produkte und Mengen.

**Alfa Boost — „n. Label" ist aufgelöst, aber anders als erwartet.** Die Herstellerinformation (27 Seiten, per
zlib aus den PDF-Streams gelesen; `pdftoppm` fehlt auf diesem Laptop) enthält in 214.000 Zeichen **keine einzige
Mengenangabe** — kein ml, kein Mischverhältnis, keine Dosiertabelle. Belegt ist dagegen die *Häufigkeit* und der
Umgang, wörtlich:
- „muss AlfaBoost … sowohl bei organischer, als auch mineralischer Düngung **bei jedem Gießvorgang** ausgebracht
  werden"
- „einmal wöchentliches Besprühen … **bis zur dritten Blütewoche** tropfnass, anschließend nur noch ganz fein"
  (die Begrenzung ist eine Schimmel-Vorsicht des Herstellers, kein Wirkungsargument)
- nach der Ernte, vor dem Aufhängen, fein besprühen → bessere Lagerfähigkeit
- **„Auf den EC-Wert hat Alfa Boost keinen nennenswerten Einfluss"** — es ist ein Zusatz, kein Dünger
- **senkt den pH des Gießwassers** („sehr niedriger pH-Wert")
- ersetzt Mikroorganismen- und Enzympräparate; auf Hydro/Aero keine organischen Flüssigdünger dazu

**Konsequenz für die App:** Eine Dosis kann nicht eingetragen werden, weil der Hersteller keine nennt — das ist
jetzt belegt und keine Lücke mehr. Was die App abbilden kann, ist die Häufigkeit („bei jedem Gießvorgang"), der
pH-Effekt (gehört in die Mischreihenfolge: senkt, also nach ihm den pH einstellen) und die Sprüh-Anwendung. Ob
auf der Flaschenrückseite eine Menge steht, weiß nur Patrick.

### D · Die Ursache hinter der Hälfte der Befunde

**Die Düngeplan-Vorlagen waren in keiner der Text-Prüfungen Prüfgegenstand** — nicht in v1.5.125 (Lexikon), nicht in
v1.5.172 (Bernstein), v1.5.190 (Klima), v1.5.192 (IceFlush/Dunkelphase) und v1.5.210 (Drain-EC). Jede dieser Runden
hat ihre Texte bereinigt und `FERT_PRESETS` ausgelassen. Daher stammen alle Text-Befunde oben.
**Konsequenz:** Der Wächter-Test aus der Begriffe-Prüfung (Schritt 18 dort) muss `FERT_PRESETS` mitdurchsuchen,
sonst wiederholt sich das bei der nächsten Runde.

**Wer Dosen, Produktzahl, Wochenzahl oder Gaben ändert, zieht den Fingerabdruck in `test_duengeplaene.js` mit**
(Zeile 34–39; canna 40, hesi 44, plagron 45) — sonst fällt der Test um.

---

## 0m · Zweite Agenten-Runde (15.09.2026) — vier Designfragen, Antworten offen

Patrick am 14.09.2026: offene Fragen „aus Sicht eines Anfängers und eines Profis" von Agenten prüfen lassen, „immer auf
wissenschaftlicher Basis". Vier Agenten, je Frage einer, mit beiden Sichten und eigener Gegenprüfung. Rohdaten:
`subagents/workflows/wf_312e6495-74a/journal.jsonl` im Sitzungsordner, Messskripte im Scratchpad unter `agenten/`.
**Zwei frühere Läufe mit je zwölf Agenten brachen am Nutzungslimit ab, ohne ein Ergebnis zu liefern** — deshalb
der schlanke Aufbau mit Zwischenständen als Datei. Für die nächste Runde so beibehalten.

**Daraus schon behoben (Fehler, ohne Rückfrage):** Feed-Tag-Ausgleich in Anzucht-Wochen (v1.5.170) · Dosis-Modus
aus dem aufgeschlagenen Plan (v1.5.171) · Bernstein-Texte (v1.5.172) · Erntereif-Zeichen (v1.5.173) ·
Ablaufziel (v1.5.174) und Gießpunkt (v1.5.175) in den Gießanleitungen · Korridor-Untergrenze über der Sämlingsrampe (v1.5.176).

### 0m.1 · Gießmenge — entschieden und umgesetzt (v1.5.200–208)

Patricks Auftrag vom 15.09.2026: mit den Agenten wissenschaftlich beheben, den Drain nie schätzen. Eine Agentin hat den
Vorschlag gebaut, ein zweiter Agent ihn unabhängig gegengeprüft und in acht Punkten korrigiert (Rohdaten:
`subagents/workflows/wf_c7ff1979-af3/journal.jsonl` im Sitzungsordner, Prototyp `scratchpad/agenten3/giessmenge_pruefung/proto12.js`).
Umgesetzt: Coco-Gießpunkt (v1.5.200), Drain-Spanne im Gieß-Guide (201), kein „Tag länger warten" (202), Mischen-Zeile aus dem
Plan (203), eine Waage-Skala (204), Gießmenge aus dem Topf (205), heute gießen bei schnell trocknendem Topf (206), eine Klimafunktion (207), die restlichen Texte und `ANBAU.md` (208). Die Fragen (a)–(e) sind damit beantwortet: fester Gießpunkt
(Erde „Knapp", Coco „Mittel"), eine Startkurve für Nutzer ohne Einträge, eigene Korridore nur bis zum ersten eigenen Guss, der
Drain zählt auch bei übernommener Menge.

**Messaufgabe für Run 02:** einmal die Drain-Menge in einer breiten Wanne auffangen oder den Topf wiegen (voll und kurz vor dem
Gießen) — dann ist S gemessen statt angenommen. Dazu in den Einstellungen die Topfgröße auf das gefüllte Volumen setzen (aufgehäuft 14–16 L statt 11 L).

### 0m.2 · Erntefenster

- **Befund:** Patricks 47 Trichom-Einträge sind auf 0,1 Punkte glatt (01.–10.08. jeden Tag genau −1,1) — mit einer
  Lupe unmöglich; vermutlich über „Heutigen Stand berechnen" oder „Verlauf angleichen" entstanden. Diese Rechenwerte
  werden ohne Kennzeichen gespeichert und als Messung gelesen (Regel 2). Die Kopfzeile rechnete aus 0,2 Punkten
  Bernstein in 8 Tagen „Tag 118–158" und fiel an Tag 114 auf die Samentüte zurück (−13 Tage). Mit echtem Zählrauschen
  (100 Köpfe) springt die heutige Zahl zwischen Tag 99 und 119 — auch vor die Reife.
- **Vorschlag der Agentin:** eine Funktion `erntefenster(c, iso)` für Kopfzeile, Dashboard, Trichom-Karte, Endspurt
  und Ernte-Hinweis. Die Zahl ist der Plan-Erntetag. Eine Hochrechnung schiebt sie nur nach hinten, wenn selbst das
  früheste Reifen danach liegt; nach vorn zieht nur eine Messung (Klar gemessen ≤ 10 % und Bernstein-Ziel gemessen).
  Gewichtete Gerade über 21 Tage, Streuung aus der Zählstatistik 100·√(p(1−p)/N), Rechenwerte gekennzeichnet und
  ausgeschlossen. In vier Messreihen blieb die Zahl ohne Sprung und nie vor der Reife.
- **Fragen an Patrick:** (a) Wie viele Trichom-Köpfe schaust du je Messung an — oder nach Augenmaß? (b) Welche
  deiner 47 Einträge waren echte Lupen-Blicke, welche berechnet oder angeglichen? (c) Ist „Klar ≤ 10 %" für dich der
  Punkt, ab dem Schneiden nicht mehr zu früh ist? (d) Ist dein 5-%-Ziel auch die Grenze, ab der die App zum Vorziehen
  rät — und wenn sich das Ziel nicht vorhersagen lässt: Ernte nach Plan, sobald Klar weg ist? (e) Umbau: vorne der
  Plan-Erntetag mit Freigabe-Wort, die Spanne nur noch in der Trichom-Karte, „min. X d" entfällt — einverstanden?

- **Patricks Antwort auf (d), 16.09.2026 — das Bernstein-Ziel ist Nutzersache.** Wörtlich: „Bitte vergiss beim
  Erntefenster nicht, dass dies Userabhängig ist. Manche möchten lieber einen Couch Lock und ernten zb. bei 15%
  Bernstein." **Die App kann das bereits:** `c.targetAmber` (0–60 %, Schnellwahl 3/5/10/15, Vorgabe
  `TRICH_TARGET_DEFAULT` = 5 %), dazu `_amberEffectHint` mit der Wirkung je Stufe. Für den Umbau heißt das:
  `erntefenster(c, iso)` rechnet gegen **dieses** Ziel, nie gegen feste 5–8 %. Die Freigabe „nicht mehr zu früh"
  bleibt an Klar ≤ 10 % (`RIPE_CLEAR_DONE`) hängen — das ist die Untergrenze, die vor dem teuersten Fehler schützt
  (`ANBAU.md` 11); das Bernstein-Ziel verschiebt nur den Erntetag nach hinten. Schritt 3 des Prüfplans („Editor mit
  5–8 %") darf das vorhandene Feld also **nicht** ersetzen oder verengen.
- **Dabei aufgefallen, zu entscheiden (nicht gebaut, weil Umbau):** Der Ernteziel-Block in den Einstellungen steht
  hinter `!S.beginnerMode` — er ist im Einsteiger-Modus **unsichtbar**. Wer als Anfänger einen Couch Lock will, kann
  das Ziel gar nicht setzen und bekommt still 5 %. Nach `ANWEISUNG.md` („Der Profi verliert nichts", jede
  Vereinfachung braucht den Weg zum vollen Umfang) gehört die Frage auch dort hin — sie ist eine Geschmacksfrage,
  keine Fachfrage, und genau deshalb für den Anfänger relevant.

### 0m.3 · VPD und Luftfeuchte

**Entschieden (Patrick, 15.09.2026): Option B.** Umgesetzt in v1.5.186 (kein Klima im Auto-Fill) und v1.5.187 (eine
Quelle `KLIMA_ZIEL`/`klimaStatus` für Pille, Einsteiger-Satz, Zielzeilen, Live-Anzeige, Luftfeuchte-Warnung,
Tipps-Zone und Lexikon-Hinweis; `ANBAU.md` 2.2 neu) und v1.5.188 (Dunkelphase und Erntetag ohne Band, nur der Deckel) und v1.5.189 (das abgeschaltete VPD-Diagramm je Phase) und v1.5.190 (Klimazahlen in allen Texten).
**Noch offen:** Die Outdoor-VPD-Etiketten rechnen noch mit den alten Bändern — gehört in den
Outdoor-Bereich. Der Klimafaktor der Gießmenge rechnet seit v1.5.207 nach Oren (`_klimaTagFaktor`). Die Befunde unten beschreiben den Stand vor v1.5.187.

- **Befund (86 Einträge):** 44-mal grüne VPD-Pille über oranger VPD-Zielzeile, 13-mal „✓ Luft passt" im
  Einsteiger-Modus über ⚠. Temperatur-, RLF- und VPD-Fenster je Phase sind überbestimmt: In der Spätblüte ergeben
  18–24 °C und 40–50 % RLF mit 2 K Blattabzug 0,79–1,45 kPa, das Band sagt 1,4–1,6 (0–3 % des Fensters liegen
  darin). Das Gießmodell ändert den VPD-Faktor an Stufengrenzen bei gleichem Klima (67 von 69 Blütetagen), das
  Autofill rechnet Luft-VPD ohne Blattabzug.
- **Vorschlag der Agentin:** VPD-Band und Temperaturfenster fest, das RLF-Ziel bei der gemessenen Temperatur
  abgeleitet (Magnus, `_leafOffset`), der Schimmeldeckel (`ANBAU.md` 13.5) hart. Eine Quelle für Pille,
  Einsteiger-Satz, Zielzeilen, Diagramm und Alarm; der Gießfaktor aus dem absoluten VPD-Verhältnis. Prototyp:
  44 Widersprüche → 0.
- **Fragen an Patrick:** (a) Spätblüte, Spülen, IceFlush — Variante A: Band 1,4–1,6 bleibt, Temperatur 24–27 °C
  (RLF dann etwa 35–50 %). Variante B: Band wie mittlere Blüte 1,2–1,5, Schimmelschutz über den RLF-Deckel 60 % und
  die Nass-Stufe, Temperatur 22–26 °C (deine Spätblüte mit 23 °C / 45 % läge im Band; ändert `ANBAU.md` 2.2).
  Empfehlung der Agentin: B. (b) Frühe Blüte: App 1,0–1,3 kPa, `ANBAU.md` 2.2 1,2–1,5 — was gilt?
- **Bewusst nicht angefasst:** die Einsteiger-VPD-Box. Sie an die Zielzeile zu koppeln, würde bis zur Entscheidung
  in der Spätblüte ständig „zu feucht" melden.

### 0m.4 · weekly-split und BioBizz

**Entschieden und umgesetzt (v1.5.240)** mit dem Blatt 2026, das Patrick geschickt hat: (a) jeder Guss mit Dünger —
das Schema kennt keine Wasser-Tage; (b) Outdoor ist seit v1.5.178 entfernt; (c) Bio·Grow mit den Herstellerwerten
bis Blühwoche 8; (d) `weekly-split` bleibt nur für gespeicherte Kopien, eine Häufigkeit am Produkt (Microbes) ist
offen (0n·C); (e) Bio·Heaven ist drin. Der Vorschlag „gespeicherte Kopien mit ihrem Modus stempeln" ist anders
gelöst: Die alte Vorlage bleibt als abgelöst stehen, weil Kopien auch EC-Spitze und Feed-Tag-Regel live lesen.
*(Stand davor:)*

- **Befund:** BioBizz nennt Milliliter je Liter Gießwasser (Schema 2020 wörtlich „ml/L water", dazu „Water 2-3
  times a week"); eine Wochen-Gesamtdosis kommt nicht vor. Die App teilt bei BioBizz Official und Outdoor durch
  7 / Intervall — bei Intervall 3 kommen Bio·Grow 43 % und Bio·Bloom 14 % der Herstellerkonzentration an, CalMag
  286 %; ab Intervall 8 liegt die Mischung über dem Tabellenwert. Die Vorlage „BioBizz Official · 2025 · Light-Mix"
  weicht zudem vom Schema ab (Bio·Bloom trägt die Top·Max-Reihe, Top·Max und Acti·Vera überall 1, Alg·A·Mic
  verschoben, CalMag 1–2 statt 0,3/0,5/0,8, Bio·Grow fehlt in WK7–8, Bio·Heaven fehlt). Eine offizielle
  Outdoor-Tabelle fand die Agentin nicht.
- **Nachgeprüft (16.09.2026, v1.5.240):** Das Blatt 2026 ist gerendert, Zelle für Zelle abgelesen und gegen
  Patricks Bild des Schemas 2020 abgeglichen (0n·C). Weitere Quellen:
  Quellen: https://biobizz.com/wp-content/uploads/2025/05/Nutrient-Schedule-EN-PF-2025.pdf,
  https://www.biobizz.com/wp-content/uploads/2020/03/Nutrient-Schedule-EN-2020.pdf
- **Vorschlag der Agentin:** BioBizz-Pläne auf `per-watering` mit `feedDayBasis`, die Zahlen neu aus dem Schema
  2025 abschreiben, gespeicherte Plankopien vorher mit ihrem bisherigen Modus stempeln (sonst stünde CalMag 2 ml/L
  ungeteilt je Guss da).
- **Fragen an Patrick:** (a) Wasser-Tage bei BioBizz behalten (weniger Fracht, sichere Seite) oder jeder Guss mit
  Dünger? (b) BioBizz Outdoor als App-Anpassung kennzeichnen, nach dem Standardschema neu aufbauen oder entfernen?
  (c) Bio·Grow in WK7–8: Hersteller 4 ml/L, Vorlage 0 — bewusst abweichen (dann nicht „Offiziell") oder
  Herstellerwert? (d) weekly-split als Modus behalten, etwa als Häufigkeit am Produkt (Microbes „once a week")?
  (e) Bio·Heaven aufnehmen? Dazu die Bitte: die Light-Mix-Spalte im Schema 2025 einmal selbst ansehen.

---

## 0l · Prüf-Agenten, erste Runde (14.09.2026) — Befunde und Abarbeitung

Patrick am 13.09.2026: „Lasse die Agenten immer automatisch und eigenständig die App innovativ und
smart perfektionieren." Vier Prüfer (Anfänger, Profi, Dauer-Automatik, doppelte Regeln), je ein
Skeptiker, eine Synthese. **24 Befunde, 22 gegengeprüft bestätigt.** Die Agenten ändern keinen
Code; umgesetzt wird einzeln, mit eigener Version, Test und Vorführung. Rohdaten:
`subagents/workflows/wf_35e0ed6e-4f3/journal.jsonl` im Sitzungsordner.

**Erledigt:** EC-Ziel folgt der Plan-Woche (v1.5.140) · Klimaziel, Schimmel-Alarm, VPD, Kälte-Warnung
und Trichom-Hinweise folgen dem Anteil an der Blüte (v1.5.141, `bluetestufe`). · Einsteiger-Satz nennt die
Menge je Pflanze (v1.5.142). · IceFlush-Tag: Startseite, Tageskarte und Anleitung sagen „Eis
anlegen, kein Wasser dazu" ohne Trichom-Versprechen (v1.5.143). · Finisher-Hinweis ohne
Harz-Zusage (v1.5.144). · Eintrag, Empfehlung, Nachholen und Export lesen Produkte aus dem
Plan des Zyklus (v1.5.145, `_planAnsicht`). · Gedrückthalten der ±-Knöpfe in der Mischliste wiederholt
wieder und stoppt beim Loslassen auch mit dem Finger (v1.5.146). · Ein nicht eingetragener Guss
erzeugt keinen Wasserstress-Alarm mehr, sondern eine Rückfrage mit Knopf zum Nachtragen (v1.5.147,
`_gussLueckeStatus`). · Plan-Blatt markiert die Woche des Zyklus, der den Plan nutzt (v1.5.148,
`_zyklusFuerPlan`). · Schimmel-Alarm ab 60 % RLF auch beim Spülen und am IceFlush (v1.5.149). · Drain-EC ohne Ablaufmenge wird nicht bewertet, das Etikett beschreibt statt zu deuten (v1.5.150). · Ernte-Hinweis ohne „bernsteinfarben = Peak" (v1.5.151). · Trocknungsklima aus einer Quelle, beim Trocknen kein VPD-Rat „RLF runter" mehr (v1.5.152, `TROCKNEN_KLIMA`). · Startseite kennt die Wasser-Tage des Plans, alle Ablaufziele aus `DRAIN_ZIEL` (v1.5.153). · Nachholen und „Erledigt" kennen den Sättigungsguss (v1.5.154). · Diagnose-Kontext „Luftfeuchte hoch" ab derselben Grenze wie der Schimmel-Alarm (v1.5.155). · Sorten-Chip im Assistenten rechnet wie die Wochen-Eingabe (v1.5.156). · pH-Zahlen in Texten und im Diagramm aus `phTargetFor` (v1.5.157). · Vierte Stelle der Drain-Faustregel 1,5 im Lexikon (v1.5.158). · Anzucht-Dünger: Startseite und Sämlings-Pflege nennen, was der Plan sagt (v1.5.159). · pH-Zeile der Sämlings-Pflege aus `phTargetFor` (v1.5.160). · Tag 1: Menge, pH, Mittel und Referenz-Schritt aus dem Zustand (v1.5.161). · Demo-Zyklus: Toast, Spül-Notiz und Ablaufmengen passen zu seinen Tagen (v1.5.162). · Wochendosis-Pläne zählen Plan-Wochen und nehmen das Intervall der Plan-Phase (v1.5.163). · Demo-Zyklus ohne eigene EC-Warnung an Spültagen (v1.5.164). · EC-Spanne im Eintrag aus dem Plan-Ziel statt fest 0,8–2,0 (v1.5.165). · Ablauf-Etikett beim Spülen ohne ⚠ (v1.5.166, Patricks Entscheidung). · Ablauf unter 5 % hebt die Gießmenge, vor Tag 25 zählt er nicht (v1.5.167, Patricks Entscheidung, `_drainMoeglich`). · Tag 1 ist überall der Keimstart (v1.5.168, Patricks Entscheidung, `_keimMethode`). · Sämlings-Start in Assistent, Einstellungen und Hinweis nennt die Tag-1-Menge aus Topf und Substrat (v1.5.169, `_tag1MengeJeTopf`). · Kein Feed-Tag-Ausgleich mehr in Anzucht-Wochen (v1.5.170, `_planWocheIstAnzucht`). · Dosis-Modus aus dem Plan des Zyklus, nicht aus dem aufgeschlagenen (v1.5.171, `_doseModeFor`). · Kein Text knüpft die Ernte an eine feste Bernstein-Menge (v1.5.172, 13 Stellen). · „Erntereif" in der Trichom-Karte nach Klar ≤ 10 % und eigenem Bernstein-Ziel (v1.5.173). · Gießanleitungen nennen das Ablaufziel aus `DRAIN_ZIEL` (v1.5.174). · Gießpunkt in Anleitungen und Bewertung aus `GIESSPUNKT`, ohne „Harz-Trigger" (v1.5.175). · Natürlicher Mengen-Korridor hebt die Sämlingsrampe nicht mehr an (v1.5.176). · Ein eingetragener Drain zählt immer, die App schätzt nie einen (v1.5.177, Patricks Entscheidung). · BioBizz-Outdoor-Vorlage entfernt, benutzte Kopien bleiben (v1.5.178, Patricks Entscheidung). · Wochenfrage nur noch zwischen zwei Blütewochen (v1.5.179). · „Gießen überfällig" nur bei verpasstem geplantem Gießtag, nie nach der Ernte (v1.5.180). · Phasengrenzen ab dem Blütestart zählen Kalendertage, auch über die Zeitumstellung (v1.5.181). · Feld „Blüte-Start" zeigt bei Outdoor-Photos den Tag, mit dem gerechnet wird (v1.5.182). · „Spülung in N Tagen" zählt bis zum ersten Spültag, am Vortag „Spülung morgen" (v1.5.183). · Karte vor dem Phasenwechsel nennt den echten Abstand und die eingestellten Spültage (v1.5.184). · Mit Blütestart-Datum rechnen Endspurt, Erntezähler und Düngeplan-Wochen ab dem echten Blütebeginn (v1.5.185, `anzuchtLenFor`). · „Tag automatisch ausfüllen" trägt kein Klima mehr ein, „Klima-justiert" folgt dem Gießfaktor (v1.5.186). · Klima je Phase aus einer Quelle, VPD Option B (v1.5.187, `KLIMA_ZIEL`, `klimaStatus`). · Dunkelphase und Erntetag ohne VPD-Band, nur der Schimmel-Deckel (v1.5.188, Stufe `dunkel`, `iceDay`). · Das abgeschaltete VPD-Diagramm („Verlauf & Charts") rechnet mit dem Befund aus dem Eintrag, damit es beim Wiedereinschalten nicht widerspricht (v1.5.189). · Klimazahlen in Lexikon, Infotexten, Diagnose und Notiz-Vorschlägen aus `KLIMA_ZIEL` (v1.5.190). · Tag-Nacht-Differenz richtig herum, kühle Nächte ohne unbelegte Vorteile, Kälte-Grenze an der Wurzelzone (v1.5.191). · Keine unbelegten Zusagen mehr um IceFlush, Dunkelphase und Ernte, kein Drain-EC nach dem Schmelzen (v1.5.192). · Diagnose-Kontext „Luftfeuchte hoch" aus dem Befund des Eintrags (v1.5.193). · Beim Trocknen und im Curing keine Pflanzen-Warnungen zur Temperatur mehr (v1.5.194). · Finisher ohne eigenes Restgewicht-Band, derselbe Gießpunkt bis zur Ernte (v1.5.195). · Hard-Dryback endet am Gießpunkt statt bei ~35 % (v1.5.196). · Gießpunkt-Zahlen aus einer Quelle, genannt ab Tag 25 (v1.5.197). · IceFlush-Anleitung, -Status und Hebe-Test-Vorgabe ohne die Reste des alten Hard-Dryback-Ziels (v1.5.198). · Dryback-Vorhersage und Hebe-Test ohne Reste des Finisher-Bands (v1.5.199). · Coco mit eigenem Gießpunkt „Mittel" in Vorgabe, Hard-Dryback, IceFlush und Vorhersage (v1.5.200, `giesspunktFor`). · Drain-Spanne im Gieß-Guide aus `DRAIN_ZIEL` statt 10 % (v1.5.201). · Kein „einen Tag länger warten" mehr; die Diagnose „Überwässerung" nennt die Häufigkeit statt „kleinere Mengen" (v1.5.202). · Mischen-Zeile der Gießanleitung aus dem Plan des Zyklus (v1.5.203). · Eine Waage-Skala: das zweite Gewicht ist der Gießpunkt, keine Faustformel (v1.5.204). · Gießmenge aus dem Topf: Nachfüll-Grenze, Nutzer-Faktor aus den eigenen Güssen, Drain zählt immer, kein Regler (v1.5.205, `gussMengeJePflanze`). · Heute gießen, wenn der Topf bis morgen unter den Gießpunkt fällt; Startseite und Vorhersage sagen dann auch „heute" (v1.5.206, `tagesAbnahme`). · Eine Klimafunktion für die Gießmenge: Klima aus `klimaTranspiration` statt Stufen gegen ein eingefrorenes Band, auf dem alten Weg keiner (v1.5.207, `_klimaTagFaktor`). · Die restlichen Texte der Gießmenge: Startwert im Gieß-Fahrplan, V in Einstellungen und Tipps, Drain in der Wanne auffangen, 25–30 % „viel, noch gültig", Einsteiger-Satz mit Drain-Spanne, „Topf war noch feucht" statt „Zu viel Wasser = Wurzelfäule"; `ANBAU.md` 1.1, 1.2, 2.3, 5.1, 7.4, 7.5, 14, 15 (v1.5.208). · Drain-EC nur als Verhältnis Drain ÷ Gießwasser und nur mit gültiger Messung, Etikett und Status aus einer Rechnung (v1.5.209, `drainEcStufe`). · Alle Drain-EC-Faustregeln in Lexikon, Infotext, Diagnose, Tipps und Vorlagen aus einem Satz (v1.5.210, `T.drainRegel`). · Das Spülende setzt der Plan: keine Drain-EC-Schwelle mehr in IceFlush-Checkliste, Lexikon und CANNA-Coco-Vorlage (v1.5.211). · Die Trichom-Karte urteilt nur über eine Messung von heute, nicht über einen übernommenen Stand oder die Vorgabe 70/25/5 (v1.5.212). · Keimung: eine Zahlenbasis (`KEIMUNG`) für Keimungskarte, Anleitung und Lexikon, Unbelegtes gestrichen (v1.5.213). · „Direkt in Erde" ist die vorgewählte Keimmethode, die Karte sagt „empfohlen", ihre Fußzeile nennt Temperatur und Licht statt „dunkel" (v1.5.214). · Der Sprüh-Auslöser fragt die Erde am Samen, nicht die obersten 1–2 cm — an sechs Stellen (v1.5.215). · Sämlings-Pflege Tag 3–7 beschreibt den echten Tag, Klima und Wassermenge der Grundregeln kommen aus der App statt aus festen Zahlen (v1.5.216). · Der Gieß-Tipp folgt Aktion und Menge statt dem Tag; keine Mengen-Box an Sprüh-Tagen (v1.5.217, `_saemlingGiessTipp`). · Tag 1: EC als Obergrenze statt Ziel, kein EC im Auto-Ausfüllen, Direktsaat erst nach dem letzten Durchgang; am ersten Guss nach der Sprüh-Phase „ohne Keimling heute nicht gießen" (v1.5.218). · Keimphase im Stadium-Anzeiger bis Tag 7 statt 5, Chip „Keimblätter offen" statt „Erste Blätter (Cotyledons)" (v1.5.219). · Sämlings-Haube: kein „hält 80–95 % Luftfeuchte" mehr (das wäre Kondenswasser auf den Keimblättern), ein Zeitplan statt drei — drauf bis der Keimling steht (v1.5.220). · Lexikon „Sämlingsphase": Klima, Feuchte, Licht und Gießmenge aus der App statt eigener Tabelle; Keimblätter nehmen kein Wasser auf; Aloe ohne Wirkungszusage (v1.5.221). · Pythium ohne Stoppuhr („in 24 Stunden tot"), und der Sämling soll warm stehen — gefährlich ist die Nässe (v1.5.222). · Startdatum ist der Keimstart, und „Direkt" gehört der Keimmethode — die Start-Methode heißt „Ohne Vorbefeuchten" (v1.5.223). · Demo-Zyklus: keine Gießmenge an Sprüh-Tagen, Anzucht-Güsse aus der App-Rechnung, Notizen wie der echte Ablauf (v1.5.224). · `ANBAU.md` Abschnitt 16 „Keimung" — die Grundlage, die der ganzen Reihe gefehlt hat (ohne Versionssprung, die App ist unverändert). **Damit ist die Keimungs-Prüfung vollständig abgearbeitet (Schritte 1–17, v1.5.213–224).** · Gruppe A der Plan-Prüfung begonnen: Mykorrhiza-Pulver steht nicht mehr in der Mischanleitung des Cup-Sieger-Plans — in der Vorlage, in der V3.4-Migration und per einmaliger Reparatur auch in schon gespeicherten Plänen (v1.5.225, `_mykoMixFix`). · Der Cup-Sieger-Plan kündigt kein MKP mehr an, das er nicht dosiert; Untertitel auf 11 Produkte, Lexikon ohne die Behauptung „in Woche 7-9" (v1.5.226). · Beide Coco-Pläne nennen in Woche 11 den Coco-Gießpunkt aus `GIESSPUNKT` statt „trocknen lassen" (v1.5.227). · Keine Wirkungszusagen mehr in den Düngeplänen — zwölf Stellen in vier Plänen und im Erklärtext zur Planwahl; Handlung und Dosen bleiben, Belegtes wird benannt (v1.5.228). · Mischreihenfolge konservativ: der Ausfällungs-Grund stand verkehrt herum, Epsom (ein Sulfat) lag hinter den Basisdüngern statt hinter CalMag (v1.5.229). **Offen dazu:** Textänderungen erreichen nur die Vorlagen — gespeicherte Plankopien behalten ihren Schnappschuss (Ausnahme: die Reparatur aus v1.5.225). · **Die Misch-Info wurde seit v1.5.52 überhaupt nicht angezeigt** — zwei Renderer für die Mischreihenfolge, der sichtbare ohne den Text; darunter die Warnung „Silica Force IMMER ZUERST … sonst Ausfällung" (v1.5.230). · pH und Drain in den Plan-Texten aus `phTargetFor` und `DRAIN_ZIEL` statt aus festen Zahlen — zehn Stellen; zwei davon waren falsch (Plagron und CANNA Terra nannten für Erde „pH 5.5–6.5", unter 6,0 bricht die Mikroflora ein) (v1.5.231). · Der CalMag-Eintrag im Lexikon rät bei Kalium-Überschuss nicht mehr zu mehr Calcium, sondern nennt dieselbe Reihenfolge wie die Magnesium-Diagnose: erst den Blüte-Booster aussetzen, dann pH, dann Bittersalz (v1.5.232). · Die Anfänger-Schnellhilfe rät bei Magnesium-Mangel nicht mehr zu CalMag und nennt keine feste Mischreihenfolge mehr — dieselbe Reihenfolge wie die Diagnose, dazu der Ort (unten) als Unterscheidung zu Calcium (v1.5.233). · Die Schnellhilfe-Karte „Calcium-Mangel" nennt den Ort oben statt unten, die Abgrenzung zu Magnesium und die Reihenfolge Umluft → pH → CalMag; keine Karte nennt mehr eine feste Mischreihenfolge (v1.5.234). · Die zweite Magnesium-Karte — es gab zwei, und v1.5.233 hat nur die erste erwischt — nennt dieselbe Reihenfolge und statt „unter 6.0" das pH-Ziel des jeweiligen Substrats (v1.5.235). · Pläne ohne eigene Wochen-Tipps bekommen einen abgeleiteten — Phase aus dem Rückgrat, pH aus `phTargetFor`, Drain aus `DRAIN_ZIEL`; betraf fünf von elf Vorlagen, darunter den Einsteiger-Plan (v1.5.236, `_planWochenFokus`). · **Der Wochendosis-Modus lieferte 0–216 % der Wochenmenge** — der Teiler nahm eine Kalenderwoche, der Ausgleich die gedehnte Plan-Woche; jetzt teilt die App durch die echten Düngergüsse der Plan-Woche, gemessen 100 % (v1.5.237, Patricks Entscheidung). · Der Rainbow-Plan widersprach der App an vier Stellen — Drain-EC-Spülende, fester Ernte-Trigger, Hard Dryback und Restgewicht-Gates, Nacht-Klima; alle vier waren Befunde, die v1.5.172/191/196/211 anderswo längst behoben hatten (v1.5.238). · Plagron, CANNA und Hesi sagen jetzt, dass sie kein Calcium/Magnesium führen, mit prüfbarer Bedingung (unter 8 °dH bzw. 0,3 mS/cm) und ohne Dosis — es sind dieselben drei Vorlagen, denen auch `doseMode`, `weekFocus` und `drainInfo` fehlten (v1.5.239). · **BioBizz Official folgt dem Herstellerschema 2026** — neue Vorlage „BioBizz Official 2026", je Guss wie das Blatt, Bio·Heaven dabei, Wochen-Namen wie im Blatt, gegen das Schema 2020 abgeglichen; die alte Fassung bleibt für gespeicherte Kopien, nicht mehr wählbar (v1.5.240, `abgeloest`). · Fish·Mix im Hinweis der Official-Vorlage: eine Alternative zu Bio·Grow, nie beide zusammen (v1.5.241, Patricks Entscheidung). · Die Anleitung nennt Official nicht mehr als Wochendosis-Plan und keine „2,3 Güsse" (v1.5.242). · „Plan laden" in der Anleitung ohne die Warnung vor Überschreiben, die nicht mehr stimmt (v1.5.243). · Lexikon „Düngepläne": Vorlagen-Liste aus derselben Regel wie der Düngeplan, keine entfernte Outdoor-Vorlage mehr (v1.5.244, `_vorlageWaehlbar`). · Assistent und Lexikon empfehlen Einsteigern dieselbe Vorlage, aus einer Quelle (v1.5.245, `EINSTEIGER_VORLAGE`). · Lexikon-Vergleich: Master ohne „terpenreich", Hesi als niederländische Marke (v1.5.246). · Die zweite „deutsche Marke" (Hesi, Eintrag „Bio vs. Mineralisch"), die v1.5.246 übersehen hatte (v1.5.247). · Herstellermengen: eine Haltung aus `ANBAU.md` 5, 6.3 und 15 statt „Maximalwerte / 50–70 % / halbe Dosis" an neun Stellen (v1.5.248, Patricks Auftrag). · Geschmack und Spülen: keine unbelegten Geschmacksaussagen mehr an 14 Stellen, Spülende am Plan statt am Drain-EC (v1.5.249, `ANBAU.md` 14). · Dosis-Texte nach dem Fach-Gegencheck: braune Spitzen mit Unterscheidungskriterium, Drain-EC mit Bedingung, Steigern mit Obergrenze, zwei übersehene Reste (v1.5.250). · Vorlage „BioBizz konservativ": Wochen-Tipps und Ablauf-Info sagen, was der eigene Wochenplan tut (v1.5.251). · Spül- und Reifetexte nach dem Gegencheck: keine feste 14-Tage-Grenze, keine erfundenen pH-Zahlen, keine Trichom-Zusage für die Dunkelphase (v1.5.252). · Nährstoff-Mobilität an drei Stellen nach `ANBAU.md` 6.1 (Schwefel und Zink teilmobil, Bor und Kupfer unbeweglich), NPK ohne Wirkungszusagen und ohne Stickstoff auf null in der späten Blüte (v1.5.253). · „Bio vs. Mineralisch" ohne erfundene Zeitangaben, ohne Puffer durchs Bodenleben, ohne Ertragsvorsprung für Mineral, ohne „Bio-Wirkung halbiert" und „Boden stirbt" (v1.5.254). · „Sauerstoff-Sog" nach `ANBAU.md` 1 statt mit einem „mikroskopischen Vakuum", ohne „Bio-Produkte funktionieren nur in lebendigem Boden" — auch in „Substrattypen" (v1.5.255). · **Anfänger-Empfehlung „Bio in All-Mix" passte nicht zu den Vorlagen** — sie rechnen mit Light-Mix, für All-Mix sieht BioBizz Bio·Grow 1 statt 2–4 ml/L vor; Empfehlung jetzt Light-Mix mit der Einsteiger-Vorlage, für All-Mix die Obergrenze (v1.5.256). · Outdoor-Gießen: Karbonathärte statt „Bodenleben puffert", Menge bis zum Drain-Ziel statt „20–30 % des Topfvolumens" (v1.5.257). · „Spülung (Final-Flush)" ohne unbelegte Living-Soil-Aussagen, Coco mit weniger statt keinem Puffer, „was du siehst" als Seneszenz ohne Welken und Duft, Hard Dryback bis zum Gießpunkt (v1.5.258). · IceFlush-Infotext, IceFlush-Anleitung und „Wurzelschnitt" ohne Eiswasser, ohne „Kältereiz regt Harz an", ohne ungemessene 8–12 °C und ohne „Stress-Boost … gut dokumentiert" (v1.5.259). · Symptom-Diagnose-Baum ohne erfundene „60–70 %", mit den Bedingungen für den Drain-Wert und der Ursache „zu wenig Verdunstung" (v1.5.260). · IceFlush-Tag: die Eismenge an der Gießmenge folgt der Topfgröße wie Kasten, Anleitung und Einsteiger-Satz (v1.5.261). · **IceFlush-Anleitung nannte „Ernte am Folgetag"** — der Plan erntet so viele Tage nach dem Eis, wie IceFlush-Tage eingestellt sind; jetzt Erntetag des Plans mit Datum, überall „vor dem Lichtangang" (v1.5.262). · Checkliste vor dem IceFlush, Lexikon, Erntetag-Karte und Trichom-Hinweis mit dem eigenen Bernstein-Ziel statt „max. 10 %" und „80–95 % milchig" (v1.5.263). · **Die Startseite befahl am Plan-Erntetag das Schneiden, ohne die Trichome zu lesen** — Satz, Tageskarte, Hinweis und Tipp folgen jetzt `ernteFreigabe` (dieselbe Regel wie die Trichom-Karte); dazu `node testlauf.js` für alle Tests in beiden Zeitzonen (v1.5.264). · **Nach dem Plan-Erntetag ohne Schnitt sagte die App „Trocknung läuft" und „nicht mehr gießen"** — Startseite, Tipp, Gieß-Fahrplan, Eintrag und Hebe-Test-Bewertung folgen jetzt `ernteOffen` (v1.5.265). · **Das Klima bewertete eine stehende Pflanze nach dem Plan-Erntetag gar nicht** — keine Stufe, kein Schimmel-Deckel; jetzt späte Blüte über `p.ernteOffen` (v1.5.266). · **Gießtag mit vollem Topf: Die Startseite sagte „etwa 0 ml … bis unten etwas herausläuft"** — jetzt „heute nicht gießen" wie der Eintrag (v1.5.267, `_topfVollHeute`). · **Die Trichom-Karte urteilte ohne Messung** („noch überwiegend klar" über die Vorgabe 70/25/5), und „zu früh" hing an milchig statt an Klar (v1.5.268). · **Eine stehende Pflanze hieß weiter „Trocknen"** — Startseite, Stadium, Eintragskopf und Tageszähler sagen „Ernte offen" (v1.5.269, `_phasenAnzeige`). · **Jeder neu angelegte Zyklus bekam beim ersten Neustart still drei Tage mehr bis zur Ernte** (Spülen 8 → 11, Umstellung aus v1.5.75) — `addCyc` schreibt Spültage und Dryback fest (v1.5.270). · **Am IceFlush und in der Dunkelphase zeigte die Zyklus-Karte „Trocknung"** — jetzt „Spülphase" bzw. „Ernte" (v1.5.271). · **Voller Topf am Spültag: „ungefähr 0 ml"** — dieselbe Aussage wie am Gießtag, eine Grenze für Menge und Anzeige (v1.5.272, `_altWegVoll`). · **Ein eingetragener Guss zählte auf der Startseite nicht als erledigt** — zwei Mengen in einer Karte, beide zum Gießen; jetzt „Heute erledigt · N ml eingetragen" (v1.5.273, `_gussHeuteErledigt`). · **Der Gieß-Fahrplan sagte „Nächster Guss · heute" nach dem Guss und bei vollem Topf** — jetzt dieselbe Antwort wie die Startseite (v1.5.274). · **Der Eintrag nannte am IceFlush-Tag „Nur eiskaltes Wasser"** unter „kein Wasser dazu" — Bedingung verkehrt herum, jetzt „Kein Guss — Crushed Ice an den Topfrand" (v1.5.275). · **Hinweis vor dem IceFlush und Tipp in der IceFlush-Phase sprachen noch von Eiswasser** — jetzt Crushed Ice an den Topfrand bzw. Dunkelphase mit Deckel 60 % (v1.5.276). · **Der Gieß-Fahrplan zeigte am IceFlush eine Gießmenge** („etwa 700 ml", mit drei Pflanzen 2100 ml) — jetzt Crushed Ice je Topf, „kein Wasser dazu" (v1.5.277). · **Am Plan-Erntetag kündigte die Startseite „Morgen: Trocknung" an, obwohl die Ernte noch offen war** — jetzt nur mit freigegebener Ernte (v1.5.278). · **Die Kachel „Erntedatum" lag draußen drei Tage hinter „Ernte in"** — eigene Summe mit IceFlush-Tagen; jetzt `harvestCountdown` (v1.5.279). · **Die Kacheln sagten am Plan-Erntetag „Ernte in 0 ±5d · Heute ✂️" unter „noch nicht schneiden"** — jetzt „offen", „nach Trichomen", 🔍 (v1.5.280, `_ernteTermin`). · **Datumskarte und Zyklus-Karte zeigten am Plan-Erntetag „✂️ Ernte" unter „noch nicht schneiden"** — jetzt „🔍 Ernte offen" (v1.5.281). · **„Ernte ca." widersprach den Kacheln daneben** — jetzt Plan-Datum aus `_ernteTermin` und, wo gemessen, der Tag fürs eigene Bernstein-Ziel (v1.5.282). · **Die Liste im Gieß-Fahrplan zeigte bei vergangenen Güssen eine nachgerechnete Menge** — jetzt „gegossen N ml" aus dem Eintrag (v1.5.283).

**Daraus zu lernen (v1.5.146):** Wer am document auf das Loslassen wartet, muss wissen, wohin das
Ereignis geht, wenn das Element dazwischen neu gebaut wird. Maus-Ereignisse gehen an das, was jetzt
unter dem Zeiger liegt; ein Fingerdruck bleibt bei dem Element, auf dem er begann — auch wenn es
nicht mehr im Dokument ist, und dann kommt `touchend` am document nie an. Der erste Fix hätte die
Wiederholung repariert und dafür auf dem Handy eine Düngermenge weiterlaufen lassen. Gefunden hat
das erst das Nachmessen im Browser; der jsdom-Test prüft es seitdem mit.

**Vorrang seit 17.09.2026:** die Fehler aus den Hebeln 1–3 der Bewertung (Abschnitt 0o). Danach:

**Als Nächstes, in dieser Reihenfolge** (Patricks Auftrag vom 15.09.2026: selbst entscheiden, wissenschaftlich begründet):
1. **Erntefenster:** drei Messpunkte (Headbud, Mitte, unten), gemittelt; der Erntepunkt folgt dem **eingestellten** Bernstein-Ziel (`c.targetAmber`, Vorgabe 5 %, frei bis 60 % — Patrick am 16.09.2026: „Userabhängig … manche ernten bei 15 % für den Couch Lock"), auch wenn noch klare Köpfe da sind (Befunde und Patricks Antwort in 0m.2). Plan der Prüfung: `scratchpad/agenten2/ergebnis_erntefenster_Vorschlagen.json` unter `umsetzung` (9 Schritte). Schritt 1 ist erledigt (v1.5.212); als Nächstes Schritt 2 — Rechenwerte kennzeichnen (`q`: gezählt, bestätigt, gerechnet) und aus Prognose und Freigabe halten.
2. **Düngepläne:** 70 Befunde aus der dritten Agenten-Runde stehen in **Abschnitt 0n** — zuerst Gruppe A (die App widerspricht sich selbst, ohne Rückfrage behebbar), dann Patricks Entscheidungen aus Gruppe B. BioBizz Official ist seit v1.5.240 auf dem Herstellerschema 2026 (0n·C); Hersteller-PDFs sind auf dem Laptop lesbar (Abschnitt 8).
3. **Begriffe-Prüfung, Schritte 8–24** (`scratchpad/agenten3/begriffe2.json` unter `umsetzung`): Wirkungszusagen und Dosen in Texten, ein Wächter-Test für verbotene Formen, zuletzt die Umbenennungen (Runoff/Ablauf → Drain, Input → Gießwasser).

**Offen** (Umbauten; Patricks Auftrag vom 15.09.2026: selbst entscheiden, wissenschaftlich begründet): Erntefenster und weekly-split — die Befunde stehen in Abschnitt 0m · (älter, dort aufgegangen:) welche Erntezahl vorne steht (Kopfzeile und Startseite rechnen das Erntefenster nur aus dem Bernstein-Tempo: bei Patrick am 03.09. „Ernte Tag 118–158“ aus Bernstein 4,1 → 4,0 %, während die Trichom-Karte „erntereif um Tag 113“ sagt; `harvestWindow` gegen `_ripeWindow` — soll das Reifefenster vorne stehen und ein Bernstein-Fenster über 20 Tage gar nicht als Erntetag erscheinen?) · Pflanzenzahl im Assistenten.

**Verworfen von den Skeptikern:** „Gießmenge folgt dem Intervall nicht" (die angezeigte Größe
gibt es so nicht) und „Plan-Wochen springen bei später Korrektur" (gewollte Dehnung aus v1.5.51;
das Nachziehen der Dauer aus Beobachtung bleibt als Wunsch unter Umbauten).

---

## 0k · Neuer Düngeplan für Run 02: Rainbow (v1.5.133)

Patrick am 13.09.2026: die Sensi-Amnesia-Pläne raus (V6.0 als Vorlage im Code, V3.4.7 als
gespeicherte Kopie in seinen Daten), der Rainbow-Plan für den nächsten Zyklus rein.
Übertragen aus seinem Plan-Blatt `Downloads/rainbow_duengeplan_v1_0.html` in die Vorlage
`rainbow_auto`, jede Dosis 1:1 und gegen eine zweite Abschrift geprüft
(`test_rainbowplan.js`). Die Einzelheiten stehen im `CHANGELOG.md`.

### Offen — braucht Patricks Antwort

- **Pläne, die früher über den Assistenten entstanden sind (v1.5.137).** Sie haben keinen
  Dünger/Wasser-Rhythmus, obwohl ihre Vorlage einen kennt (betrifft 7 Vorlagen, u. a. BioBizz
  Light). Der Assistent legt neue Pläne jetzt richtig an; **bestehende sind bewusst nicht
  nachgezogen**, weil ein laufender Grow sonst mitten im Zyklus Wasser-Tage bekäme. Möglich wäre
  eine Migration nur für Pläne, an denen kein laufender Zyklus hängt — oder ein Hinweis mit
  Knopf „Rhythmus der Vorlage übernehmen". Nicht gebaut; Patricks eigene Daten sind nicht betroffen.
- **V3.4.7 bleibt in seinen Daten (v1.5.135).** Seine Einträge aus dem Juli tragen die
  Produkte dieses Plans; ohne ihn hätten sie keine Namen mehr. Ob die Kopie in der Plan-Liste
  ausgeblendet statt gelöscht werden soll, entscheidet Patrick. **Auf dem Handy nachsehen:**
  Steht „Sensi Amnesia XXL Auto (V3.4.7)" nach dem Update noch unter „Düngepläne"? Hatte er
  v1.5.133/134 schon zweimal geöffnet, ist sie dort weg — dann lässt sie sich aus der Sicherung
  vom 04.09. zurückholen (eine kleine Hilfsseite, die nur diesen Plan einspielt; nicht gebaut,
  auf Zuruf).
- **Alfa Boost, Woche 4–7.** Das Blatt sagt „n. Label". Ohne die Etikett-Dosis steht Alfa
  Boost in keiner Woche, nur als Hinweis am Produkt und im Wochen-Tipp. Sobald die Zahl
  feststeht: `FERT_PRESETS.rainbow_auto.schedule` Woche 4–7 ergänzen **und** den
  Fingerabdruck in `test_duengeplaene.js` sowie `BLATT` in `test_rainbowplan.js` mitziehen.
  Einen schon auf dem Handy angelegten Plan ändert das nicht — dort im Wochenplan eintragen.
- **Rainbow, Woche 14:** „Ziel Drain-EC höchstens 0,5" steht so auf dem Plan-Blatt. Seit v1.5.211 setzt die App kein Spülende über einen Drain-EC-Wert (in Erde steigt er nach dem Spülen wieder, `ANBAU.md` 5.1) — der Satz im Plan widerspricht dem. Stehen lassen oder streichen? Beim Ändern `BLATT` in `test_rainbowplan.js` mitziehen.
- **Bio-Bloom, Woche 10–12** steht auf 1,2, bis sein Ceiling-Test ein Ergebnis hat.

### Bewusst nicht übernommen

Die Klima-Tabelle je Woche (die App hat eigene Phasen-Ziele in `getPhaseTargets` — zwei
Zahlen für dieselbe Frage wären der bekannte Fehler aus Abschnitt 1), die ml/Topf je Woche
und „+200 ml bei Drain unter 15 %" (die Gießmenge kommt seit v1.5.112 aus dem gemessenen
Ablauf), Verbrauchsliste und Aufstellung. Die Trainings-Zeitleiste steckt in den
Wochen-Tipps.

### Der Wochen-Tipp kam aus dem aufgeschlagenen Plan (v1.5.136)

`_planStatusLine` und `_planWeekQuestion` lasen `weekFocus` über `S.presetKey`, also aus
dem Plan, der im Düngeplan-Bildschirm offen ist. Mit Rainbow aufgeschlagen zeigte Patricks
BioBizz-Zyklus „Bulk-Start · Ceiling-Test". Das ist v1.5.100 an einer dritten Stelle — und
beim Nachsuchen kamen drei weitere dazu: `summarizeCycle`, `exportReportPDF` und
`exportDiary` nannten für jeden Zyklus den aufgeschlagenen Plan. Alle behoben.
**Für den nächsten, der sucht:** `grep -n "S.presetKey" app.js` — jede Stelle, die einen
Zyklus kennt und trotzdem `S.presetKey` liest, ist verdächtig. **Meine erste Fassung dieses
Absatzes behauptete, danach blieben nur unbedenkliche Stellen — nachgesehen hatte ich nicht.**
Die Stichprobe fand die drei. Übrig sind jetzt der Düngeplan-Bildschirm und die Kopfkarte
„Dünger & Wochenplan" in den Einstellungen (`renderSet`); beide beschreiben den
aufgeschlagenen Plan. Die Kopfkarte nannte dabei fest „12 Wochen" und für die vorlagenlose
V3.4.7-Kopie den Schlüssel „sensi_amnesia_auto" — behoben in v1.5.138.

### Das Aufräumen war zu grob (v1.5.135)

v1.5.133 entfernte eine Sensi-Kopie, sobald kein Zyklus mehr per `c.fertPlanId` auf sie
zeigt. Gespeicherte Einträge legen Dosen, Dosis-Bezug und Misch-Häkchen aber nach Produkt-ID
ab — und Patricks Zyklus war am 03.09. von V3.4.7 auf „BioBizz Official" umgehängt worden.
Seine Juli-Einträge wären namenlos geworden. Jetzt zählt jeder Verweis. **Regel: Vor dem
Löschen von Nutzerdaten die Sicherung nach den IDs des zu Löschenden durchsuchen** — ein
kurzes Skript über `growsmart-sicherung-2026-09-04.txt` genügt und findet auch die Stellen,
an die man nicht denkt.

### Beim Laden hing der trocknende Zyklus mit um (v1.5.134)

Beim Einbau gefunden: „Vorlage laden" setzte **jeden** aktiven Zyklus auf den neuen Plan
(`_cycleAufPlanZeigen`, v1.5.95). Hätte Patrick den Rainbow-Plan geladen, während Run 01
trocknet, hätten dessen alte Einträge Rainbow-Dosen gezeigt. Jetzt behält ein Zyklus ab dem
Spülen seinen Plan; mitten im Grow und vor dem Start wird weiter umgehängt.
**Für Patrick heißt das:** Er kann den Rainbow-Plan jetzt laden — Run 01 bleibt bei BioBizz.

**Nachtrag v1.5.139:** Die orange Karte „noch nicht zugewiesen" im Düngeplan-Bildschirm bot
Run 01 danach trotzdem per Knopf zur Übernahme an — sie hatte ihre eigene Kopie der Regel.
Beide fragen jetzt `_duengungVorbei(c, iso)`. Gefunden erst beim Durchklicken im Browser.

**Daraus zu lernen:** Eine Vorlage zu entfernen heißt nicht nur, sie aus dem Code zu nehmen.
Es gibt gespeicherte Kopien auf den Geräten, und an denen können Zyklen hängen — ein Plan,
an dem ein Zyklus hängt, darf nie verschwinden.

---

## 0j · Patricks Erntetag, 08.09.2026 (v1.5.130–132)

Vier Meldungen an seinem Erntetag, alle mit seinen Daten reproduziert. Drei davon hatten
**dieselbe Wurzel**, die vierte war ein dritter Speicherort.

### Der vorgezogene IceFlush: Aktion und Phase liefen auseinander

Patrick hatte den IceFlush auf Tag 113 vorgezogen — **bevor** v1.5.110 ausgeliefert war.
Der damalige `moveGussDay` legte einen Vermerk an, der nur die *Aktion* bewegt. v1.5.110 hat
den Weg repariert, die schon entstandenen Daten aber nie aufgeräumt. Ergebnis: Aktion `ice`
an Tag 113, Phase dort noch `flush`. Daraus folgten drei sichtbare Fehler:

| Symptom | Ursache |
|---|---|
| „Aus 1 L Eis werden **11250 ml**" | 11 L × 341 (Spül-Formel) × 3 Pflanzen. Die Karte fragt die Aktion, die Menge fragte die Phase. |
| „Hard-Dryback · IceFlush **in 1 Tag**" direkt über „🧊 **IceFlush!**" | Dryback-Fenster aus der Phase, Eis-Karte aus der Aktion |
| Kalender: 🧊 an Tag 113 **ohne Wort**, „IceFlush" an Tag 114 **ohne Symbol** | Beschriftung markiert den Phasenwechsel, Symbol die Aktion |

**Die gemeinsame Lehre:** Wo Aktion und Phase dasselbe meinen können, muss **eine** von
beiden die Quelle sein. Für alles, was beschreibt *was heute zu tun ist*, ist das die
**Aktion** — sie folgt Verschiebungen, die Phase nicht. „IceFlush" und „Ernte" sind
Ereignisse, keine Zeiträume.

**Bewusst nicht migriert:** Eine nachträgliche Phasenverschiebung hätte seinen Erntetag von
116 auf 115 gezogen — am Erntetag selbst. Die Anzeige folgt jetzt der Aktion; das genügt und
ist ungefährlich.

### „Ich kann kein Gewicht der Ernte eintragen" — ein dritter Speicherort

Die Felder waren da und nahmen Eingaben an. Sie schrieben nach `cd.harvestLog`, und **diesen
Ort liest außer der Karte selbst niemand**: `getTotalHarvest` kennt `plants[].yieldWet/Dry`
und `c.plantHarvest`. Was dort stand, tauchte in keiner Auswertung auf.

**Das ist v1.5.99 zum zweiten Mal.** Damals waren es zwei Speicherorte für den Ertrag, jetzt
kam ein dritter dazu — und niemand hat gemerkt, dass die Eingabemaske in einen davon
schreibt, den die Auswertung nicht kennt. **Regel: Wer ein Eingabefeld baut, muss die
Lesestelle benennen können.** Steht die Zahl danach nirgends, ist das aus Nutzersicht kein
Anzeigefehler, sondern „geht nicht".

Das Log läuft jetzt über `setPlantHarvest` **je Pflanze** — Patricks Wunsch, und zugleich der
richtige Speicherort. Schon geerntete Pflanzen stehen mit Datum dabei (der Vergleich ist der
Zweck), darunter Nass-/Trockensumme und Trocken-Anteil. Erreichbar bis zum Ende des Curings,
weil das Trockengewicht erst nach 7–14 Tagen Trocknung feststeht (`ANBAU.md` 12.1).

### Die Düngeplan-Warnung war zweimal falsch

„Dieser Düngeplan ist für 49 Tage Blüte gemacht, dein Zyklus steht auf 85 … Für die paar
Extra-Tage führt die App die Düngung einfach sinnvoll weiter." — 36 Tage sind keine paar,
und es wird auch nichts angehängt: **Seit v1.5.51 verteilt `planWeekBounds` die Plan-Wochen
über den echten Zyklus** (nachgemessen: 12 Wochen über 113 Tage, eine Plan-Woche rund
9 Tage). Die Karte beschrieb einen Zustand, den es seit v1.5.51 nicht mehr gibt.

**Der Knopf „auf 49 angleichen" war gefährlich:** `bloomDays = 49` verschiebt Patricks Ernte
von Tag 116 auf Tag **80** — 36 Tage in die Vergangenheit, samt Spülgängen und IceFlush.
Angeboten als harmlose Korrektur „nur falls die 85 ein Versehen waren".

**Regel:** Ein Hinweis, der nach einem Umbau stehen bleibt, wird zur Falschaussage — und ein
Knopf daneben macht sie gefährlich. Wer eine Automatik baut (hier: v1.5.51), muss die Texte
suchen, die den alten Zustand erklären.

---

## 0i · Der Kalender (v1.5.127)

Der letzte nie geprüfte Bildschirm. Drei Befunde, zwei davon betreffen genau den Fall, den
Patrick vor dem Release testen will: **zwei Sorten in einem Zelt.**

### Symbol und Tagesnummer gehörten zu verschiedenen Pflanzen

Die Zelle wählt Farbe und Symbol nach dem Zyklus mit der Aufgabe (`actionDay`), die
Tagesnummer nahm sie aber immer vom ersten Zyklus (`phaseDay = dayInfo[0]`). Mit zwei Grows:

| Tag | Grow 1 | Grow 2 | Zelle zeigte |
|---|---|---|---|
| 03.09. | T111, nichts | T52 **Gießtag** | „🌿 **T111**" |
| 06.09. | T114 IceFlush | T55 **Gießtag** | „🧊 T114 IceFlush" — Guss unsichtbar |

Im ersten Fall standen Symbol und Zahl für verschiedene Pflanzen, ohne erkennbaren Hinweis.
Die Nummer folgt jetzt demselben Zyklus wie Farbe und Symbol; ein Punkt in der Zyklusfarbe
zeigt an, dass ein weiterer Grow an diesem Tag etwas zu tun hat.

**Daraus zu lernen:** Wo mehrere Datenquellen in dieselbe kleine Fläche gerendert werden,
muss **eine** von ihnen die Auswahl bestimmen — hier tat es `tagCol` bereits richtig, und
nur die Zahl scherte aus. Bei jeder Zelle, die mehr als eine Sache anzeigen kann, gehört
geprüft, ob alle Teile denselben Gegenstand meinen.

### Das Tagesmenü war am Rechner unerreichbar

`showCtx` hing nur am Touch-Langdruck, `oncontextmenu="return false"` schloss den anderen
Weg. **Zwei Funktionen hängen ausschließlich daran** — „Gieß-Tag überspringen" bei Regen
(`skipDayFromCal`) und „Tag zurückholen" (`restoreDayFromCal`). Am Laptop gab es für sie
keinen Aufrufweg, während der Hinweis unter dem Kalender sie bewarb. Jetzt öffnet der
Rechtsklick das Menü.

**Beinahe-Fehler beim Fix, festgehalten:** Mein erster Entwurf setzte die Klick-Sperre
`lpDone` auch bei der Maus. Eine Maus feuert nach einem Rechtsklick aber keinen Klick — die
Sperre wäre stehengeblieben und hätte den *nächsten* Linksklick geschluckt. Nachgemessen:
Der Tag ließ sich erst beim zweiten Antippen öffnen. **Regel: Ein Riegel, der ein
nachfolgendes Ereignis abfangen soll, braucht die Prüfung, ob dieses Ereignis auf dem
jeweiligen Gerät überhaupt kommt.**

### Geprüft und in Ordnung — nicht erneut aufrollen

- **Datumsraster über sieben Monate**, inklusive beider Zeitumstellungen 2026 (29.03. und
  25.10.), Februar und Jahreswechsel: keine doppelten, fehlenden oder falsch beschrifteten
  Tage.
- **Jeder Aktionstag trägt sein Symbol** (die Symbole sind SVGs, nicht Text — ein erster
  Textvergleich meinerseits meldete 15 Fehlalarme).
- **Die Beschriftung steht nur am ersten Tag einer Phase.** Das ist Absicht; sonst stünde
  siebenmal „Trocknen" untereinander.

---

## 0h · Das Lexikon gegen ANBAU.md (v1.5.125)

139 Einträge, rund 306.000 Zeichen. Nicht flächendeckend gelesen, sondern gezielt dort, wo
das Lexikon etwas **empfiehlt** oder eine Wirkung **zusagt** — dort kostet eine falsche
Aussage Ertrag oder Vertrauen.

### Vier unbelegte Wirkungszusagen

| Eintrag | stand da | `ANBAU.md` 14 |
|---|---|---|
| IceFlush | „Studien zeigen 5–20 % mehr Trichome" | „Kein belegter Trichom- oder Potenzeffekt" |
| UV (2 Stellen) | „5–15 % mehr Cannabinoide", „+5-15% THC" | „gemischt bis negativ … nicht als Qualitätsmaßnahme ausgeben" |
| Dunkelphase | „5–10 % mehr THC" | „Kein belegter THC-Zuwachs" |
| Spülung | „Macht den Unterschied zwischen kratzigem und sauberem Rauch" | „keinen belastbaren Unterschied in Geschmack, Aschequalität oder Analytik" |

Das ist bemerkenswert, weil `ANBAU.md` 14 beim IceFlush ausdrücklich lobt, die App sage das
selbst offen — und das stimmte auch: **auf den Karten im Tageseintrag.** Der Lexikon-Text
sagte das Gegenteil. **Regel: Wo dieselbe Sache an zwei Orten erklärt wird, reicht es nicht,
den einen zu prüfen.**

Nichts wurde verboten, und das Belegte bleibt: die kälteinduzierte Anthocyan-Färbung, der
Terpen-Erhalt als echter Grund für die Dunkelphase, der messbar fallende Drain-EC beim
Spülen — beim UV sämtliche Sicherheitshinweise.

**Die Spülung fand erst der Test.** Mein Suchlauf hatte sie für ehrlich gehalten, weil sie
einen *anderen* Mythos entkräftet („Spülung ist immer nötig" bei Living Soil). **Regel: Ein
Eintrag, der irgendwo das Wort „Mythos" führt, ist damit nicht geprüft — es zählt, ob genau
die eigene Kernaussage belegt ist.**

### Eine Lichtgrenze, mit der die App sich selbst widersprach

„Photosynthese" nannte **700 PPFD** als Decke, „PPFD & DLI" nannte **900** — letzteres
direkt unter der Zeile, die 600–900 als Blüte-**Ziel** ausweist. Nach `ANBAU.md` 8.1 ist
900–1000 der Sättigungswert des **einzelnen Blattes**; der Bestand nutzt mehr Licht weiter.
Die Richtung war die schädliche: zu schwach beleuchten, obwohl Licht in Hobbyanlagen fast
immer der Engpass ist. Beide Stellen nennen jetzt das sichtbare Kriterium für ein echtes
Zuviel — ausgebleichte weiße Blütenspitzen.

### Trichom-Messung ergänzt

Zwei Punkte aus `ANBAU.md` 11 fehlten: die Warnung vor **Foxtails** (junges Gewebe, fast nur
klare Köpfe — wer dort misst, wartet zu lange) und **immer dieselben Stellen**
wiederzuverwenden, worauf die Ernte-Prognose dieser App aufbaut.

### Geprüft und in Ordnung — nicht erneut aufrollen

Curing 58–62 % deckt sich mit `ANBAU.md` 12. **Das Trocknen stimmte nicht** — geprüft hatte der Test nur den Eintrag „VPD"; „Trocknung" nannte 15–18 °C/50 % als Sweet Spot, dazu vier weitere Klimas an anderen Stellen (behoben in v1.5.152). Drain steht
seit v1.5.112 auf 15–20 %; ppm wird nirgends ohne Skalen-Angabe genannt; Entlaubung und die
Griffelbräunung als Nicht-Kriterium waren bereits richtig.

### Nachtrag: Trockenstress abgeschwächt (v1.5.126)

Der offene Punkt — „kontrollierter Trockenstress = mehr Trichome" — ist von Patrick am
07.09.2026 entschieden worden: leicht abschwächen. Es waren am Ende **neun** Stellen, nicht
die zwei aus dem ersten Suchlauf; darunter die **IceFlush-Karte im Tageseintrag** mit
„Studien zeigen 10–20 % mehr Trichomproduktion", die Outdoor-Frostwarnung und die Legende
des VPD-Diagramms.

**Die Empfehlungen selbst sind unverändert** (Spätblüte 40–50 % RLF, VPD 1,4–1,6 kPa) — nur
ihre Begründung. Der belegte Grund ist der **Schimmelschutz** nach `ANBAU.md` 13.5, nicht
das Harz.

**Und eine Korrektur an mir selbst:** Im Abschnitt darüber stand, die App sei beim IceFlush
„auf den Karten im Tageseintrag" ehrlich gewesen. Das stimmte nicht — genau dort stand die
stärkste Zahl. Mein Test hatte sie nicht gefunden, weil er nur `LEXIKON` durchsuchte.
`test_lexikon.js` prüft jetzt den **ganzen ausgelieferten Quelltext**.

**Regel daraus:** Eine Prüfung, die eine Datenstruktur durchsucht, prüft die Datenstruktur —
nicht die App. Wo ein Text auch im Code stehen kann, muss der Quelltext selbst der
Prüfgegenstand sein. Das gilt genauso für die nächste Aussage, die jemand gegen `ANBAU.md`
hält.

---

## 0g · Die Diagnose-Datenbank gegen ANBAU.md (v1.5.124)

Der letzte offene Punkt aus dem Fachwissen-Abgleich: Bisher waren nur die
Nährstoff-Einträge gegen `ANBAU.md` 6.1 gehalten worden.

### Das Eisenbild fiel durch das Raster — und der Vorschlag war der falsche

`ANBAU.md` 4 beschreibt es genau: hellgelbe **junge** Blätter mit grün bleibenden Adern bei
zu hohem pH. Wer im Symptom-Checker „Neue Blätter (oben)" + „Gelb" wählte, bekam:

| Platz | vorher | jetzt (mit „pH zu hoch") |
|---|---|---|
| 1 | `ca_deficiency` 72 % | **`iron_deficiency` 77 %** |
| 2 | `nutrient_burn` 72 % | `ph_lockout` 80 % (mit Drain-Drift) |
| … | `ph_lockout` gar nicht in den Top 5 | |

Der Calcium-Vorschlag lautet „CalMag geben" — nach `ANBAU.md` 6.2 hier die falsche
Richtung: Calcium ist selbst ein Magnesium-Antagonist, und die Ursache liegt fast nie in der
Menge, sondern in der Verfügbarkeit.

**Warum `ph_lockout` unsichtbar war:** Es kannte nur `allLeaves`. Der Kontext-Bonus „pH zu
hoch" greift aber **nur bei Einträgen, die über die Symptome überhaupt hereinkommen** —
`areas === 0` filtert vorher raus. **Regel: Ein Kontext-Signal kann eine Diagnose nicht
retten, deren Symptomprofil sie ausschließt.** Wer eine Kontext-Bedingung ergänzt, muss
prüfen, ob das Profil sie überhaupt erreichbar macht.

Der neue Eintrag hat **bewusst keine Form-Symptome** — Chlorose verformt das Blatt nicht,
sie färbt es. Dadurch wird er über den Kontext sichtbar, und das ist genau richtig: ohne
pH-Auffälligkeit bleibt Calcium der bessere erste Verdacht.

### Ein Eintrag, der überall mitlief

`light_burn` erschien in **66 %** aller möglichen Symptomkombinationen unter den ersten
fünf. Es führte `wilting` (nach `ANBAU.md` 1 das Bild von Wasser/Osmose) und `paleGreen`
(nach `ANBAU.md` 8.2 das Kennzeichen von Photobleaching — genau die Farbe trennt die beiden
Lichtschäden mit ihren **verschiedenen** Gegenmaßnahmen). Beide entfernt.

`allLeaves` bleibt im Profil, obwohl es der Hauptgrund für die hohe Trefferquote ist: Der
ursprüngliche Kommentar begründet es mit „UI-Realismus" — wer nicht zwischen oben und unten
unterscheidet, soll den Lichtbrand trotzdem finden. Das ist ein bewusster Kompromiss und
bleibt Patricks Entscheidung.

### Bei Gleichstand entschied der Zufall

`Math.min(1, score + ctxBoost)` deckelt bei 1: Wer über die Symptome schon bei 100 % liegt,
kann durch den Kontext nicht mehr steigen — der Hinweis „zu warm" verpuffte, und die
Reihenfolge im Quelltext gewann. Die Punktzahlen sind unverändert geblieben; bei Gleichstand
entscheidet jetzt **Kontext-Bonus → Schweregrad → engeres Profil**.

**Der Schweregrad kam erst durch den Test dazu**, und das ist der lehrreiche Teil: Meine
erste Fassung sortierte nur nach „engeres Profil" — und stellte damit „Trauermücken"
(medium) vor „Überwässerung" (high). Der Test hat es gefangen. **Regel: Wo zwei
Erklärungen gleich wahrscheinlich sind, gehört die gefährlichere nach oben** (`ANBAU.md` 15,
„bei Unsicherheit in Richtung Sicherheit runden") — der Nutzer liest von oben, und die
gefährlichere braucht die schnellere Reaktion.

### Geprüft und in Ordnung

Schädlinge und Pilze wurden mitgeprüft und stimmen: Spinnmilben, Wurzelfäule und Bud Rot
treffen ihr Bild mit 100 %, Bud Rot steht bei hoher Luftfeuchte an erster Stelle
(`ANBAU.md` 13.5). Die Datenbank ist außerdem in sich stimmig — keine unbekannten
Symptom-Schlüssel, keine doppelten IDs, jeder Eintrag mit Name, Beschreibung und Handlung.

### Bewusst nicht gemacht — zur Entscheidung

**Der Ort müsste stärker wiegen als Farbe und Form.** `ANBAU.md` 6.1 sagt es deutlich: „Die
diagnostische Erstfrage lautet immer: oben oder unten? Sie halbiert den Suchraum, bevor eine
Farbe interpretiert wird." Die Punktvergabe behandelt aber alle drei Bereiche gleich
(`score = areas / 3`). Sichtbare Folge: Bei „Wurzeln braun" steht der Lichtbrand noch auf
Platz 4 mit 38 % — er teilt nur die Farbe, der Ort passt gar nicht.
Das zu ändern hieße, die Punktvergabe **aller** Diagnosen anzufassen. Vorschlag, falls
gewünscht: Wer einen Ort angibt und der Eintrag hat keinen passenden, bekommt einen Abschlag
statt eines vollen Bereichs-Punkts. Nicht ohne Ansage gebaut.

---

## 0f · Outdoor und Substrat — erstmals durchgespielt (v1.5.123)

Zwei Bereiche, die nie jemand geprüft hatte. Beide zeigten denselben Fehlertyp: **eine
Regel, die zwölfmal von Hand dasteht, und nur fünfmal richtig.**

### Draußen wurde eine Phase mitgezählt, die es draußen nicht gibt

`phase()` und `getAction()` lassen die IceFlush-Phase für `growType === 'outdoor'` seit
jeher weg. Zwölf andere Stellen rechneten dieselbe Gesamtlänge, sieben davon ohne
`growType`-Prüfung. Patricks Zyklus testweise auf Outdoor:

| | sagt |
|---|---|
| `getAction` (die echte Kette) | Ernte **Tag 114**, kein Ice-Tag |
| `endspurtState` (die Endspurt-Karte) | Ernte **Tag 116**, IceFlush Tag 114 |

Betroffen: `endspurtState`, `harvestCountdown`, `daysToHarvest`, `contextFor`
(Finisher-Fenster), `planWeekBounds` (Düngeplan-Wochen), `shiftPlanToDay`, die
Trichom-Prognose, die Zyklus-Diagramme.

**Das Unangenehmste war die Uneinigkeit untereinander:** Erntezähler und Endspurt lagen zu
*spät*, `bloomDaysFromSeedWeeks` (die Umrechnung der Wochenangabe von der Samentüte) zog die
Blütezeit zu kurz und die Ernte damit zu *früh*. Nach `ANBAU.md` 11 ist genau das der
teuerste Fehler im ganzen Zyklus.

Neu: **`iceLenFor(c)` als einzige Quelle**, alle zwölf Stellen rufen sie auf. Für Indoor
identisch zu vorher — das ist der Punkt, an dem der Test ansetzt.

**Daraus zu lernen — es ist zum dritten Mal dieselbe Form:** Nach `goTo` (v1.5.115) und
`isGiessTag` (v1.5.119) jetzt die Phasenlänge. Immer dasselbe Bild: Eine Regel wird an
vielen Stellen von Hand wiederholt, ein Teil der Kopien bekommt eine spätere Verfeinerung
mit, der Rest nicht — und die Kopien widersprechen sich, ohne dass jemand es merkt.
**Wo dieselbe Rechnung ein zweites Mal auftaucht, gehört sie in eine Funktion, bevor die
dritte entsteht.** Bei der Suche hilft ein Grep nach dem Ausdruck, nicht nach dem Symptom.

### Die Migration stempelte Erde-Rhythmen in jedes Substrat

`RI.*` (3/3/4) wurde beim Laden in jeden Zyklus geschrieben, dem die Intervall-Felder
fehlten, ohne aufs Substrat zu sehen — obwohl `mediumIntervals()` für Coco 2/1/1 liefert und
beim Anlegen benutzt wird. Ein Coco-Zyklus bekam so einen 3-Tage-Rhythmus, während
`classifyRestPct` unter 60 % Restgewicht schon „Zu trocken für Coco" meldet. Nach
`ANBAU.md` 7.1 verzeiht Coco Austrocknen schlecht.

**Regel, die schon einmal galt (v1.5.103, `cd.plantCount`):** Ein Feld, das im Hintergrund
gesetzt wird, muss dieselben Eingangsgrößen kennen wie der Weg, der es normalerweise setzt.
Sonst entsteht ein stiller Stempel, den die Oberfläche nie wieder anfasst.

### Geprüft und in Ordnung — nicht erneut aufrollen

- **`classifyRestPct` für Coco** (≥85 frisch · ≥60 gießen · ≥40 zu trocken · darunter
  Stress) ist **richtig**, auch wenn 80 % zunächst früh wirkt: Die Grenzen folgen bewusst
  den drei Hebe-Test-Knöpfen (Voll/Mittel/Leicht), und wer mit der Hand hebt, unterscheidet
  80 % nicht von 65 %. Früher gießen ist in Coco zudem die sichere Richtung (`ANBAU.md` 7.1).
- **`mediumIntervals`** (Erde 3/3/4 · Coco 2/1/1 · Hydro 1/1/1) und **`phTargetFor`** waren
  bereits substratabhängig. Mein erster Messversuch setzte `c.medium` direkt und umging
  `setCycleMedium` — die App war richtig, der Test falsch.
- **Der Outdoor-Tageseintrag** ist kürzer als der Indoor-Eintrag, weil die Phase eine andere
  ist (ohne Ice-Tage ist der Zyklus früher im Trocknen), nicht weil Blöcke fehlen.
- **`endspurtCard` gibt nach der Ernte nichts mehr aus** — richtig, es gibt nichts mehr
  einzustellen. Auch hier hatte zuerst mein Test verglichen, was nicht vergleichbar war.

### Offen: eine Abweichung zwischen App und ANBAU.md

`phTargetFor` führt **Coco mit pH 5,8–6,2**, `ANBAU.md` 4 nennt für „Coco / Hydro"
gemeinsam **5,5–6,0**. Beides ist verbreitet: 5,5–6,0 ist der Wert für reine
Hydrokultur, 5,8–6,2 der in der Coco-Praxis übliche. **Bewusst nicht geändert** — beim
Licht (`ANBAU.md` 8.1) war schon einmal die App richtig und der Dokument-Entwurf falsch.
Zur Entscheidung durch Patrick: entweder die App auf 5,5–6,0 ziehen oder `ANBAU.md` 4 so
präzisieren, dass Coco und Hydro getrennte Zeilen bekommen. Letzteres halte ich für richtig.

**Entschieden und umgesetzt am 16.09.2026** (Patrick: „Trenne das gerne wenn du es für nötig hältst"):
`ANBAU.md` 4 führt **Coco 5,8–6,2** und **Hydro 5,5–6,0** in getrennten Zeilen. Begründung ist die
Austauschkapazität — Coco ist inert, aber nicht bindungsfrei: Es bindet Calcium und Kalium und gibt
Natrium ab (7.1), der etwas höhere pH hält Ca und Mg trotz dieser Konkurrenz verfügbar. **Die App
bleibt unverändert; sie war richtig** (v1.5.238, ohne Versionssprung für das Dokument selbst).

---

## 0e · Der leere Zustand ist der erste Zustand (v1.5.119–122)

Patricks Auftrag: die übrigen leeren Zustände mit durchsehen. Geprüft wurde im Browser mit
**geleertem Speicher** — also genau das, was ein neuer Nutzer sieht. Das hat den schwersten
Befund dieser Sitzung zutage gefördert, und der hat mit „leer" nur indirekt zu tun.

### Der Gieß-Fahrplan sagte einem neuen Zyklus, er solle 23 Tage nicht gießen (v1.5.119)

An **Tag 1** stand auf zwei Bildschirmen nebeneinander:

| Dashboard | Gieß-Fahrplan |
|---|---|
| „💦 Heute: Sättigungsguss (Tag 1) — 700 ml in 3 Etappen" | „Nächster Guss · **in 23 Tagen** · Tag 24" |

Ursache: Die Karte las aus `steps`, und `steps` ist `collectBloomGusse(c)` — eine Liste, die
erst bei `anzuchtDays + 1` beginnt. Der Sättigungsguss an Tag 1 und die fünf Anzucht-Güsse
(Tag 9, 12, 15, 18, 21) kommen darin nicht vor.

**Warum das schwer wiegt:** Der Bildschirm heißt „Gieß-Fahrplan". Wer ihm glaubt, lässt
seinen Sämling drei Wochen ohne Wasser — nach `ANBAU.md` 13.1 der Weg zur toten Pflanze.
Und es ist exakt das Muster aus Abschnitt 1: *zwei Bildschirme, dieselbe Frage, verschiedene
Antworten — beim Überfliegen gewinnt die größere Zahl, nicht die richtigere.* Hier war die
größere Zahl die tödliche.

**Die App kannte die Antwort längst.** `isGiessTag(iso, c)` zählt genau die Aktionen, die
ein Guss sind (`giess`, `giess_anz`, `spuelen`, `ice`, `saettigung`; Sprühen ausdrücklich
nicht, mit Kommentar im Code), `nextGiessTag(c, from)` sucht sie 60 Tage voraus. Die Karte
fragte nur die falsche Quelle. Das ist zum vierten Mal dasselbe Muster in dieser Sitzung
(`_trainingFit`, `_helpCurrentScreen`, `meta.phase`, jetzt `isGiessTag`): **Bevor eine neue
Regel gebaut wird, erst nachsehen, ob die Antwort schon im Datenmodell steht.**

Die Liste darunter bleibt eine Blüte-Liste — sie sagt das jetzt auch, solange der Zyklus in
der Anzucht steht. Sie dort nachzubauen wäre ein Eingriff in den Feed/Wasser-Umschalter,
der am Blüte-Guss-Index hängt.

### Drei Sackgassen im leeren Zustand (v1.5.120–122)

| Bildschirm | war | ist |
|---|---|---|
| **Gieß-Fahrplan** ohne Zyklus | „Kein Zyklus aktiv." auf schwarzer Fläche | erklärt, woraus er rechnet · Zyklus anlegen / Demo laden |
| **Tageseintrag** ohne Zyklus | Banner „…nur dem Wasser-Feld" über **null** Feldern, zwei stumme Speichern-Knöpfe | Banner und Knöpfe entfallen · „Zyklus erstellen" |
| **Kalender** ohne Zyklus | leeres Raster, dazu „lange drücken für Gießtag verschieben" | erklärt, was hier später steht · Knopf zum Zyklus |

Der Tageseintrag hatte dabei den unangenehmsten Nebeneffekt: Das ✕ des Banners setzt
`S._entryHelpSeen` **dauerhaft**. Wer im Kalender einen Tag antippt, bevor er einen Zyklus
hat — der Kalender ist einer von vier Haupt-Tabs —, klickte den Hinweis dort als nutzlos weg
und bekam ihn beim ersten echten Eintrag nie wieder zu sehen. Und beide Speichern-Knöpfe
taten nachgemessen **nichts**: keine Meldung, keine Bewegung, kein Eintrag.

**Als Muster für den Rest der App:** Ein leerer Zustand ist dieselbe Kategorie wie eine
Fehlermeldung — er braucht *was fehlt* und *was tun*. Das Dashboard und `_emptyProds` im
Düngeplan machen es richtig vor und sind die Vorlage.

### Geprüft und in Ordnung — nicht erneut aufrollen

- **Erstlauf:** Haftungsausschluss → Willkommen → Wizard bzw. Demo. Sauber, keine Lücke.
- **Demo-Zyklus:** füllt alle Bildschirme. *Nachtrag v1.5.162:* „korrekt“ stimmte nicht ganz — Toast, Spül-Notiz und Ablaufmengen passten nicht zu den eigenen Tagen; geprüft war nur, dass die Bildschirme gefüllt sind.
- **„Keine Verschiebungen vorhanden"** ist ein *Toast* nach einer Aktion, kein leerer
  Zustand — korrekte Rückmeldung, bleibt.
- **Tipps, Lexikon, Anleitung** sind vom Zyklus unabhängig und auch im leeren Zustand voll.
- **Rundlauf mit Patricks Daten nach allen Änderungen:** unverändert, kein `undefined`,
  kein `NaN`.

---

## 0d · Rundlauf über die nie geprüften Bereiche (v1.5.115–118)

Patricks Auftrag vom 06.09.2026: „überprüfe dann erst noch andere Optionen die in der
Handhabung unsauber oder schlecht laufen könnten." Geprüft wurde im echten Browser über
alle neun Bildschirme. Vier Befunde, alle behoben, alle mit derselben Wurzel oder demselben
Muster.

### Fünf Funktionen bauten `goTo` von Hand nach (v1.5.115)

`openDuenger`, `openLexikon`, `openLexikonEntry`, `openHowto`, `openGallery` schalteten den
Bildschirm selbst um und ließen dabei weg, was `goTo` sonst erledigt:

| Folge | Wirkung |
|---|---|
| Lichtsensor wird nur in `goTo` gestoppt | **lief weiter**, Knopf sagte weiter „⏹ Stoppen" |
| `tab` wurde nicht gesetzt | App hielt sich für „tips", während man im Lexikon stand |
| Renderer fehlten in `goTo` | `goTo('lexikon')` zeigte **einen leeren Bildschirm** |

Der Sensor-Fall ist der greifbarste, weil der Weg dorthin der vorgesehene ist: Lichtmessung
auf dem Tipps-Bildschirm starten, dann auf „📖 Lexikon" tippen, um nachzulesen, was DLI
bedeutet — und der `AmbientLightSensor` läuft mit 2 Hz weiter.

Der dritte Punkt ist **wörtlich die Falle aus v1.5.106**, nur an drei weiteren Bildschirmen.
Behoben wurde deshalb nicht dreimal einzeln, sondern an der Wurzel: Die fünf Öffner rufen
`goTo` auf, `goTo` rendert die drei fehlenden Bildschirme mit. `goTo(t, arg)` reicht ein
Argument durch, damit `openLexikonEntry` **ohne zweiten Render** direkt beim Eintrag landet —
ein Lexikon-Render kostet gemessen ~40 ms auf dem Laptop.

**Daraus zu lernen:** Eine Funktion, die einen Teil einer anderen nachbaut, altert schlecht.
`goTo` hat seit ihrer Entstehung drei Aufgaben dazubekommen (Sensor stoppen, `tab` führen,
Renderer aufrufen) — die fünf Nachbauten haben keine davon mitbekommen. **Wo eine
Aufrufstelle einen fehlenden Schritt von Hand nachholt, ist der Schritt an der falschen
Stelle.** Genau dieser Satz stand schon seit v1.5.106 in dieser Übergabe.

### Der Sprung ins Lexikon landete mitten im Text (v1.5.116)

Ein angesteuerter Eintrag wird aufgeklappt (1000–1600 px) und dann mit `block:'center'`
zentriert — im 445-px-Fenster liegt die Überschrift damit ~500 px über dem Rand. Wer im
Tageseintrag auf „VPD" tippte, landete bei „🌿 Anzucht/Vegi (Tag 11–28)"; bei „IceFlush"
las man oben „Hard Dryback", die Überschrift eines **anderen** Abschnitts. `block:'start'`.

### Der leere Zustand der Galerie war eine Sackgasse (v1.5.117)

Kamerasymbol, „Noch keine Fotos.", Ende. Der Düngeplan macht es mit `_emptyProds` längst
richtig vor: erklären **und** den Weg anbieten. **Als Muster für den Rest der App:** Ein
leerer Zustand ist dieselbe Kategorie wie eine Fehlermeldung — er braucht *was fehlt* und
*was tun*. Ohne Zyklus erscheint der Knopf nicht; ein Weg ins Leere wäre schlimmer als keiner.

### Der Gieß-Fahrplan verstummte vor der Ernte (v1.5.118)

`_naechster = steps.find(s => s.tag >= heuteTag) || null` — ohne geplanten Guss wurde die
oberste Karte zu einem leeren String, und der Bildschirm öffnete mit der Liste der
30 vergangenen Güsse. Bei Patrick: an Tag 114 noch da, **ab Tag 115 weg** — in den letzten
Tagen vor der Ernte, in denen man den Fahrplan am häufigsten aufmacht. Seit v1.5.113 ist
diese Karte die Antwort auf die tägliche Frage.

Das ist die Regel aus v1.5.96 an neuer Stelle: **Fehlt ein Wert, wird dieser Wert als offen
ausgewiesen — nicht die ganze Karte ausgeblendet.** Sie zeigt jetzt drei Zustände (vor der
Ernte mit Erntedatum und Begründung, nach der Ernte „Trocknen"/„Curing", sonst ein
schlichter Satz) und bleibt antippbar.

**Wie er gefunden wurde — das ist der eigentliche Wert dieses Befundes:** durch den
Zeitzonen-Lauf. In `Pacific/Kiritimati` war schon Tag 115, und `test_gussplan.js` fiel um.
Der Zeitzonen-Lauf ist damit nicht nur eine Datumsprüfung, er ist auch ein **Blick einen Tag
in die Zukunft**. Ein umfallender Test in nur einer Zone ist deshalb nie „Testproblem",
bevor nicht nachgesehen wurde, was die App an diesem Tag anzeigt. Abschnitt F von
`test_gussplan.js` setzt das Datum jetzt fest (Tage 114, 115, 116, 125), statt sich auf die
Systemzeit zu verlassen.

### Geprüft und in Ordnung — nicht erneut aufrollen

- **Der Hilfe-Knopf** („Wo du gerade bist") liest den aktiven Bildschirm aus dem DOM
  (`_helpCurrentScreen`), nicht die Variable `tab`. Er zeigte auch mit veraltetem `tab` das
  Richtige. Ich hatte hier zuerst einen Fehler gemeldet — das Anklicken hat ihn widerlegt.
- **`setLexCat`** scrollt nach dem Kategoriewechsel korrekt nach oben; `#lexikon-body` **ist**
  das scrollende Element.
- **Rundlauf über neun Bildschirme:** kein `undefined`, kein `NaN`, kein `[object Object]`,
  keine JS-Fehler, keine wirkungslosen Knöpfe.

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
| Der damalige App-eigene Düngeplan `sensi_amnesia_auto` (17 Wochen; seit v1.5.133 entfernt) | 116 |

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

**Erledigt in v1.5.128 — die übrigen 14 Automatics.** Patrick am 07.09.2026: „Über die
Spannen der einzelnen Pflanzen kann ich nichts sagen. Suche dir immer die realistischen
Zeitspannen raus."

**Die Recherche ergab, dass es nichts zu recherchieren gibt.** Öffentlich verfügbar sind nur
Züchterangaben (systematisch optimistisch), Einzel-Grow-Berichte (n = 1) und Marketing-Seiten,
die die Züchterangabe recyceln — eine als Datenübersicht auftretende Seite war beim Nachlesen
ein Werbetext ohne Stichprobe. 14 handverlesene Zahlen daraus wären v1.5.98 noch einmal
gewesen, nur mit dem Anschein von Recherche.

Stattdessen **eine Regel in `strainDays`**, direkt aus `ANBAU.md` 9 (30–50 % über der
Züchterangabe): unteres Ende ×1,4, oberes ×1,6. An zwei unabhängigen Punkten gegengeprüft —
Patricks Sensi Amnesia (75 → 105–120 = ×1,40–1,60) und ein Northern-Lights-Grow-Bericht mit
101 Tagen (liegt in den hergeleiteten 91–104). Die Automatics planen jetzt mit 11–17 Wochen
statt 8–11.

**Die Herkunft steht dran.** `strainDays().quelle` kennt *gemessen*, *hochgerechnet* und
*zuechter*; der Steckbrief formuliert jeden Fall anders und nennt bei der Herleitung die
Züchterzahl, auf der sie beruht. Der Rat, die Wochen-Angabe von der eigenen Samentüte
einzutragen, bleibt — dieser Weg rechnet weiterhin am genauesten. Sobald jemand eine Sorte
wirklich durchzählt, schlägt seine Spanne die Herleitung.

### Keine große Sorten-Datenbank — entschieden am 07.09.2026

Patricks Frage: „Wollen wir dann ganz viele Sorten hinterlegen, die man mit einer
Suchfunktion wie im Lexikon findet? Bei Zamnesia gibt's ja wirklich unglaublich viele
Sorten." Antwort nach Abwägung: **nein**, und Patrick hat zugestimmt („Wir bleiben bei der
kleinen Variante"). Drei Gründe, damit die Frage nicht in einem halben Jahr neu aufgemacht
wird:

1. **Jeder Eintrag trüge die Züchterzahl** — genau die Daten, die sich gerade als
   systematisch falsch erwiesen haben. Ein Katalog wäre v1.5.98 in tausendfacher Ausführung.
2. **Die Katalogdaten gehören dem Shop.** Ein paar tausend Sortenbeschreibungen zu
   übernehmen ist eine Lizenzfrage — bei einer App, deren Link Patrick weitergibt, keine
   Nebensache.
3. **Der Weg, der nachweislich richtig rechnet, braucht die Datenbank nicht.** Auf jeder
   Samentüte steht eine Wochen-Angabe; sie gehört zu genau diesen Samen und ist damit
   genauer als jeder Katalogmittelwert.

**Stattdessen (v1.5.129):** die 45 vorhandenen Sorten auffindbar gemacht — Hinweis unter dem
Namensfeld, Aufklapper für alle Sorten des jeweiligen Typs, und die Meldung sagt, dass die
eigene Wochen-Angabe den Vorrang behält. Wer eine Sorte wirklich durchzählt, dessen Spanne
wird zur gemessenen. **Nach ein paar Zyklen entsteht so eine Liste aus echten Durchläufen
statt aus Verkaufstexten** — das ist der Weg, der langfristig besser ist als jeder
abgeschriebene Katalog.

### Offen, mit allem Nötigen zum Weiterarbeiten

**Der Einsteiger-Modus wirkt im Tageseintrag kaum.** Die hier zuerst notierten „154
sichtbaren Eingabefelder in beiden Modi" waren **falsch gemessen** — die Zahl enthielt 141
Felder aus einer zugeklappten Liste. Die richtigen Zahlen und die Ursache stehen in
Abschnitt 0c. Was bleibt: Am Gießtag hat der Einsteiger 26 Felder gegen 29 beim Profi und
**genauso viele Knöpfe** (53), an normalen Tagen sogar einen mehr. Der Vorschlag aus
Abschnitt 1 (Aufgabenzeile oben, Rest hinter „Mehr eintragen ▾") steht weiter offen.

**Der Gieß-Fahrplan ist seit v1.5.113 im Einsteiger-Modus entschlackt** — am 17.09.2026 gemessen (jsdom, Tag 104):
Einsteiger 916 Zeichen, 2 Knöpfe, 0 Felder; Profi 2743 Zeichen, 21 Knöpfe, 9 Felder. *(Hier stand bis zur Bewertung
vom 17.09.2026 noch „in beiden Modi zeichengleich (6866 Zeichen …)“ — veraltet seit v1.5.113.)*

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

**Nicht geprüft:** andere Sorten-Kombinationen. **Erledigt:** die Lexikon-Inhalte
(Abschnitt 0h), der Outdoor-Pfad und die Substrate (0f) und der Kalender (0i) — damit ist
jeder Bildschirm der App mindestens einmal systematisch durchgegangen. Alle Messungen stammen aus Patricks Zustand; ein frischer Grow kann
andere Fehler zeigen. **Erledigt:** Der Durchgang durch die leeren Zustände fand am
06.09.2026 statt, siehe Abschnitt 0e — vier Befunde, alle behoben.

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

Der Rest des Tageseintrags (pH-Eingabe, Notiz-Chips, Foto-Anhang) und die Kalender-Ansicht im
Detail. **Erledigt:** Der Outdoor-Pfad (Abschnitt 0f) und die Diagnose-Datenbank samt
Schädlingen und Pilzen (Abschnitt 0g). Der fehlende **Eisenmangel-Eintrag** ist mit v1.5.124
angelegt — und er fehlte nicht nur, er führte zur falschen Empfehlung.

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

115 Testdateien (Gesamtlauf auf v1.5.187 grün, beide Zeitzonen, 180 Läufe; seit v1.5.188 die betroffenen) — neu dazu
`test_tageseintrag` (33), `test_navwege` (28), `test_leerzustand` (27),
`test_outdoor` (29), `test_diagnose` (38), `test_lexikon` (224), `test_kalender` (23), `test_ernte_iceflush` (35), `test_rainbowplan` (61), `test_planumhaengen` (17),
`test_wochentipp` (27), `test_assistentplan` (33), `test_kopfkarte` (12), `test_zuweisungskarte` (10), `test_ecziel` (20), `test_bluetestufen` (14), `test_einsteigersatz` (11), `test_iceflushtexte` (28), `test_zweiplaene` (11), `test_dauerdruecken` (10), `test_giessluecke` (19), `test_planblattwoche` (12), `test_schimmelspuelen` (14), `test_drainohnemenge` (26), `test_trocknungsklima` (29), `test_wassertagstart` (20), `test_saettigungnachholen` (10), `test_rlfdiagnose` (17), `test_sortenchip` (9), `test_phtexte` (22), `test_anzuchtduenger` (15), `test_tag1` (22), `test_demozyklus` (11), `test_weeklysplit` (18) und `test_ecspanne` (12), `test_tag1keimung` (26), `test_tag1mengen` (16), `test_feedtaganzucht` (13), `test_dosismodus` (7), `test_bernsteintexte` (15), `test_erntereif` (9), `test_drainzieltexte` (4), `test_giesspunkttexte` (6), `test_korridorsaemling` (6), `test_drainnieschaetzen` (7), `test_vorlageoutdoor` (9), `test_wochenfrageanzucht` (6), `test_ueberfaellig` (6), `test_zeitumstellung` (13), `test_bluetestartfeld` (10), `test_spuelhinweis` (8), `test_phasenwechsel` (7), `test_bluetestart` (38), `test_klimanieschaetzen` (7), `test_klimaziel` (33), `test_dunkelphase` (36), `test_vpddiagramm` (14), `test_klimatexte` (24), `test_temperaturtexte` (15), `test_iceflushzusagen` (12), `test_trockenwarnungen` (10), `test_finisherband` (9), `test_harddryback` (16), `test_giesspunktzahlen` (14), `test_iceflushreste` (12), `test_finisherreste` (8), `test_cocogiesspunkt` (18), `test_draingieguide` (7), `test_giesstipps` (7), `test_mischzeile` (7), `test_waageskala` (15), `test_giessmenge_topf` (21), `test_reserve` (13), `test_klimafunktion` (6), `test_giesstexte` (16), `test_drainregel` (16), `test_draintexte` (18), `test_spuelende` (10), `test_keimung` (87), `test_duengeplantexte` (103), `test_biobizzschema` (57):

**Alle Tests mit einem Befehl: `node testlauf.js`** (auch `npm test`, seit v1.5.264) — beide Zeitzonen, parallel. Zeitkritische
Tests stehen in `EINZELN` und laufen danach einzeln: `test_dauerdruecken` war unter fünf parallelen Läufen rot, einzeln
grün (17.09.2026). Wer einen Test mit Zeitgrenzen schreibt, trägt ihn dort ein, statt einen roten Lauf als Ausreißer abzutun.

**Tests mit Patricks Grow an einem bestimmten Tag setzen das Datum fest** (`setDebugDate`). Mit
der echten Uhr fielen am 13.09.2026 15 Prüfungen in drei Dateien um — nicht wegen eines Fehlers,
sondern weil sein Grow seit dem 09.09. geerntet ist. Neue Tests gegen seine Daten: Datum immer
festlegen.

**Datumsgrenzen brauchen einen Lauf über die Zeitumstellung** (29.03. und 25.10.2026). Kiritimati hat keine
Umstellung, Berlin schon — weichen die beiden Läufe dort voneinander ab, ist das ein Befund, kein Testproblem.
Patricks Zyklus ist eine Automatic ohne Blütestart-Datum und trifft `_datebasedPhase` nie; der Fehler aus
v1.5.181 war deshalb nur mit eigens angelegten Photo-Zyklen zu sehen (`test_zeitumstellung.js`).

**Wer eine Vorlage entfernt, sucht in den Tests nach Zählungen über `FERT_PRESETS`.** `test_ecziel.js` erwartete
11 Vorlagen ohne eigene EC-Ziele und fiel mit v1.5.178 um, ohne dass es auffiel — der Lauf für v1.5.178 hatte ihn
nicht dabei. Gefunden erst beim breiten Lauf für v1.5.185.

**Vor einem Fix an einer Anzeige die Aufrufer suchen.** v1.5.189 änderte `buildChartsSection`, die nirgends aufgerufen
wird (`renderDash`: `chartsHTML = ''`). Der jsdom-Test war grün, sichtbar war nichts — aufgefallen ist es erst bei der
Suche nach der Stelle für die Browser-Prüfung. `grep -n "funktionsname" app.js` ohne die Definitionszeile genügt.

**Eine Quelltext-Suche findet nur die Schreibweise, nach der sie sucht.** `test_harddryback.js` suchte „~35%" und
„~35% Restgewicht"; „Hard Dryback auf 35%" ohne Tilde stand weiter in der IceFlush-Anleitung (v1.5.198). Gefunden hat es
erst das Durchklicken am IceFlush-Tag. Wer eine Zahl aus der App entfernt, sucht nach der Zahl mit ihrem Umfeld
(`grep -n "35 \?%"`), nicht nach einer Schreibweise — und klickt den Tag an, an dem sie gilt.

**Und eine Suche, die `find` benutzt, prüft die erste Fundstelle — nicht alle.** v1.5.233 berichtigte die
Magnesium-Karte in `SYMPTOMS`; es gab zwei davon, und die zweite fiel erst auf, als die Prüfung für v1.5.234
mit `karten.some(…)` über **alle** Karten lief (v1.5.235). Eine Text-Berichtigung braucht deshalb eine
Prüfung, die zählt statt zu suchen — `!liste.some(schlecht)`, nicht `liste.find(...)`.

**Wer eine Rechenregel ändert, sucht jeden Test, der ihr Ergebnis als Zahl festhält — nicht nur die, die sie
beim Namen nennen.** v1.5.237 änderte den Teiler von `weekly-split`; `test_vorlageoutdoor.js` erwartete weiter
1,71 (= 4 × 3/7), lief beim Ausliefern nicht mit und blieb rot, bis ihn am 16.09.2026 ein breiter Lauf fand.
Bei Änderungen an Dosis-Rechnung oder Vorlagen diesen Lauf nehmen:
`grep -l -E "FERT_PRESETS|loadPreset|biobizz|presetKey|_wizStepFertPlan|renderDuenger|getWeekDoses|fertPlans" test_*.js`
(37 Dateien am 16.09.2026). Gemessen **rund 5½ Minuten** für beide Zeitzonen — 74 Läufe, Zeitstempel der
Task-Ausgabe 13:42:12 bis 13:47:42. *(Hier stand erst „rund 12 Minuten", geschätzt, und danach „rund 130 Minuten",
falsch gemessen: Ich hatte die Erstellzeit der Protokolldatei genommen, und die Datei gab es schon — beim Überschreiben
mit `Set-Content` behält Windows die alte Erstellzeit. Laufzeiten deshalb mit `Get-Date` an Anfang und Ende ins
Protokoll schreiben, nie aus Dateizeiten ablesen.)*

**Neue Texte gegenprüfen lassen, bevor sie rausgehen.** Die Ersatztexte aus v1.5.248/249 klangen richtig und waren an
sieben Stellen überzogen — „braune Spitzen heißen zu viel" ersetzte eine unbelegte Aussage durch eine andere (Regel 3).
Ein Agent, der nur liest und jede neue Aussage einzeln gegen `ANBAU.md` hält, hat das gefunden (v1.5.250–252). Und
**Suchmuster brauchen Schreibvarianten:** „Maximalwerte" fand „Maximal-Werte" nicht.

**Vorher gegenprüfen lassen hat sich bewährt (v1.5.253–263).** Diesmal hat ein Agent die Ersatztexte geprüft, **bevor**
sie in die App kamen: In der ersten Runde brauchten 19 von 30 Neufassungen noch eine Änderung, in der zweiten blieben nur
2 von 12 ohne Nachtrag — meist dieselbe Falle wie in v1.5.250: Eine unbelegte Aussage wurde durch eine andere ersetzt,
oder die Bedingung fehlte („Cal/Mag ist Grundbedarf" gilt nur für ungepuffertes Coco, „höchstens 1 ml/L" nur je Guss).
Eine Nachbesserungs-Version war dafür nicht nötig. Und **jede Prüfrunde findet Nachbarstellen** — die Prüfung zu
„Ernte am Folgetag" fand weitere „beim Lichtangang" in Vorlagen, Notiz-Vorlage und Lexikon. Deshalb die Suche immer über
den ganzen Quelltext, und nach zwei Runden eine Grenze ziehen: Was danach auftaucht, kommt als offener Punkt in
Abschnitt 10 statt in dieselbe Sitzung.

**Textsuchen ohne Groß- und Kleinschreibung, und über den ganzen Quelltext.** v1.5.246 suchte „Deutsche Marke" im
Plan-Vergleich und übersah „deutsche Marke" zwei Einträge weiter (behoben in v1.5.247). `grep -i` bzw. `/…/i`, und der
Wächter-Test prüft den ganzen Quelltext, nicht nur den Eintrag, den man gerade anfasst.

**Wer einen Plan umbaut, sucht auch nach seinem Kurznamen.** v1.5.240 suchte nach „BioBizz Official" und übersah die
Anleitung, die nur „Official" schreibt — dort stand danach weiter „Wochendosis-Modus (Official)" (behoben in
v1.5.242). Suchmuster für Vorlagen: Schlüssel, voller Name **und** das Wort, mit dem Texte ihn kurz nennen.

**Hersteller-PDFs lesen (seit 16.09.2026).** `pdftotext` ist da — es steckt in Git für Windows
(`/mingw64/bin/pdftotext`, mit `-layout` bleiben die Spalten stehen). Liegen die Zahlen als Vektorgrafik vor
(BioBizz 2026: der Text-Layer hat nur die Überschriften), rendert pdf.js sie: eine kleine Seite mit pdf.js von
cdnjs, ein Node-Server, der die PDF ausliefert und gerenderte Ausschnitte als PNG speichert, die PNGs dann mit
Read ansehen. Die Hilfsdateien lagen im Sitzungsordner (`scratchpad/biobizz/pdfserver.js`, `render.html`) und
sind vergänglich; neu geschrieben sind es rund 80 Zeilen. `pdftoppm` und Python gibt es weiterhin nicht.

**`test_leerzustand.js` ist die Ausnahme von der Sicherungs-Regel:** Es lädt Patricks
Sicherung bewusst **nicht**, weil der leere Speicher der Prüfgegenstand ist. Wer den
Erstlauf prüft, darf keine Daten voraussetzen.

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

- Outdoor-Photo: Der automatische Blütestart ist fest der 17. August (Südhalbkugel 17. Februar), frühestens 4 Wochen
  nach dem Start — ohne Breitengrad (`_computeBloomStartDate`). Gehört in den geplanten Outdoor-Bereich; bis dahin
  hat Indoor Vorrang (Patrick, 15.09.2026). Seit v1.5.182 zeigen Einstellungen und Rechnung wenigstens denselben Tag.
- **Feste pH-Ziele an 35 Stellen im Quelltext, und sie widersprechen sich (gezählt am 16.09.2026).**
  Die App führt `phTargetFor`: Erde 6,2–6,4 · Coco 5,8–6,2 · Hydro 5,5–6,0. Daneben steht in Prosa
  unter anderem „Erde 6.2–6.5" (Zeile 1333), „Coco und Hydro 5,5–6,0" (32677 — für Coco falsch),
  „Hydro 5.5–6.5" (32032 — falsch) und mehrfach „pH 6.2–6.4" als allgemeine Regel, obwohl das der
  Erd-Wert ist (1178, 5857, 6007, 32347, 33960, 34000, 35011). Das ist v1.5.157 an den Stellen, die
  damals nicht mitgesucht wurden. Zu trennen ist dabei das **Zulauf**-Ziel vom **Drain**-pH (2347,
  33852) — zwei verschiedene Größen, siehe `ANBAU.md` 4.1. Eine eigene Version wert, keine
  Nebenbei-Änderung: Liste erzeugen mit einem Zähl-Skript über die Muster `6[.,]2–6[.,]4`,
  `5[.,]8–6[.,]2`, `5[.,]5–6[.,]0`, `6[.,]0–6[.,]5`, Zeilen mit `phTargetFor` gelten als erledigt.
- **Vier verschiedene CalMag-Dosen in der App** (beim Bau von v1.5.239 gezählt): „0.3–0.5 ml/L" im
  Infotext, „0.3–0.4 bei jedem Guss" und „typisch 0,2–1" im Lexikon, „CalMag (1–2 ml/L)" in der
  Calcium-Diagnose. Keine ist falsch, aber vier Zahlen für dieselbe Frage sind die bekannte Fehlerklasse.
  Eine Quelle daraus machen — oder jede Zahl mit ihrer Gültigkeitsbedingung versehen (Wasserhärte,
  Substrat), was nach `ANBAU.md` 15 die richtigere Form wäre.
- **Coco und Kalium: `ANBAU.md` 7.1 widerspricht sich** (beim Gegencheck für v1.5.253–263 gefunden): „Es bindet Calcium
  und Kalium bevorzugt und gibt dafür Natrium und Kalium ab." Kalium kann nicht beides sein; Abschnitt 4 übernimmt die
  Bindung von Kalium. Üblich beschrieben wird, dass ungepuffertes Coco Kalium und Natrium abgibt und Calcium und Magnesium
  bindet — das stammt aber nicht aus einer geprüften Quelle, deshalb ist `ANBAU.md` unverändert. Die App-Texte nennen seit
  v1.5.254 nur den belegten Teil (ungepuffertes Coco zieht Calcium aus der Lösung). Mit Quelle klären, dann 4 und 7.1
  angleichen.
- **IceFlush-Tage: Voreinstellung 3, der eigene Hinweis nennt 2 den „Sweet Spot"** (`PHASE_DEFAULTS.iceDays` = 3,
  `_iceDarkHint`: bei 3 Tagen „~48–72 h — eher lang"). Seit v1.5.262 nennt die IceFlush-Anleitung den Erntetag aus dem
  Plan, auf dem Bildschirm widerspricht sich also nichts mehr — aber neue Zyklen starten mit einer Einstellung, die die App
  selbst „eher lang" nennt. Zu entscheiden: Voreinstellung 2 oder Hinweis anpassen. Patricks Zyklen sind nicht betroffen.
- **Spülung, Durchführung Schritt 3 und 4:** „Erste 2–3 Güsse: normale Wassermenge — kein extra Spül-Volumen, das spült nur
  die obere Substrat-Schicht durch" und „etwa 2× Topfvolumen Wasser durchlaufen lassen" stehen nicht in `ANBAU.md`. Nach
  1.1 läuft, was über das Defizit des Topfs hinausgeht, als Drain ab — die Begründung „nur die obere Schicht" passt dazu
  nicht. Quelle suchen, sonst aus 1.1 und 5.1 neu fassen.
- **Duft als Zeichen:** „Pflanze duftet intensiver als je zuvor" im Eintrag „Reife (Seneszenz)" und weitere
  Geruchsaussagen sind nicht belegt; bewusst nicht mitgenommen (keine Dosis- und keine Erntefrage).
- „Erledigt"-Karte erscheint an Tagen ohne Aufgabe (von Patrick zurückgestellt)
- Getrennte Trichom-Verläufe je Pflanze — bewusst nicht gebaut, stattdessen `ripeOffset`
- Ertragserfassung existiert je Pflanze, aber keine Auswertung über Zyklen hinweg
- `stepMixDose` und `_setWaterDayDose` sind seit v1.4.78 ohne Aufrufer (die Mischliste ruft
  `stepMixDoseLive`) — beim nächsten Aufräumen entfernen, nicht in einem Fehlerfix.
- `mixHTML` in `renderDuenger` (der zweite, reichere Renderer der Mischreihenfolge) wird gebaut, aber seit
  v1.5.52 nirgends ausgegeben — seine Misch-Info-Zeile ist mit v1.5.230 in den sichtbaren Block gewandert.
  Beim nächsten Aufräumen entfernen, nicht in einem Fehlerfix.
- `weekPlan` in `renderDuenger` (der alte Wochen-Akkordeon-Editor samt `currentWeek`) wird noch
  zusammengebaut, aber seit dem Plan-Blatt (v1.5.52) nirgends mehr ausgegeben — beim nächsten
  Aufräumen entfernen.

**Am 05.09.2026 abgeschlossen und deshalb hier gestrichen:**

- *„Messungen berichtigen"-Liste schneidet ab* — behoben in v1.5.105.
- *Fünf Pflanzen angelegt, drei stehen* — behoben in v1.5.99, die Zeile nennt jetzt
  „(5, davon 2 schon geschnitten)".
- *Zwei Wiederholungen des Plan-Untertitels im Düngeplan* — **nachgeprüft, kein Fehler.**
  Die zwei Stellen sind die Kopfkarte des aktiven Plans („7 Produkte · …", `heroSub`) und
  die Vorlagen-Liste, die jede Vorlage mit ihrem Untertitel zeigt — darunter zwangsläufig
  auch die gerade aktive. Sie stehen weit auseinander und erfüllen verschiedene Zwecke.
  Nicht anfassen.
