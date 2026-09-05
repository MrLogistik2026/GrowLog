# Biophysikalische Grundlagen für GrowSmart

Diese Datei ist das Fachwissen hinter der App. Sie wird bei jedem Sitzungsstart geladen.

**Wozu sie da ist:** Jede Zahl in GrowSmart — jede Gießmenge, jeder EC-Zielwert, jede
Warnung — muss sich auf einen Mechanismus zurückführen lassen. Wer hier etwas über Pflanzen
entscheidet oder einen Text schreibt, argumentiert aus diesen Grundlagen heraus, statt eine
Zahl zu schätzen oder aus dem Gedächtnis zu übernehmen.

**Wie sie zu lesen ist:** Zahlen stehen hier mit ihrer Begründung. Wo die Begründung fehlt,
fehlt sie mit Absicht — dann ist der Wert eine Konvention und keine Naturkonstante, und das
steht dann auch da. Abschnitt 9 sammelt, was in der Grower-Praxis verbreitet, aber **nicht
belegt** ist. Diesen Abschnitt zuerst lesen, bevor eine neue Automatik gebaut wird.

**Grenzen:** Das hier ist angewandte Pflanzenphysiologie, keine Publikationsliste. Die
Mechanismen sind gesichert. Die genauen Zahlenkorridore stammen aus der Anbaupraxis und
variieren mit Genetik, Substrat und Anlage — sie sind Startpunkte, keine Wahrheiten. Wo
Patricks eigene Messung einem Korridor widerspricht, gewinnt seine Messung.

---

## 1 · Wasser: warum die Pflanze überhaupt trinkt

Eine Pflanze verdunstet weit mehr Wasser, als sie chemisch verbraucht. Über 95 % des
aufgenommenen Wassers geht durch die Spaltöffnungen (Stomata) der Blätter wieder in die Luft.
Das ist kein Verlust, sondern der Motor: Der Sog, der beim Verdunsten entsteht
(Transpirationssog), zieht Wasser mitsamt gelösten Nährsalzen von der Wurzel nach oben.

**Daraus folgt unmittelbar:** Verdunstet die Pflanze nicht, nimmt sie auch keine Nährstoffe
auf. Nährstoffmangel bei voller Düngung ist deshalb oft kein Düngeproblem, sondern ein
Klimaproblem. Calcium ist der klarste Fall — es wird fast ausschließlich mit dem
Transpirationsstrom transportiert und kann in der Pflanze nicht umverteilt werden. Ein
Calciummangel zeigt sich deshalb immer zuerst an den *jüngsten* Blättern.

**Wie viel Wasser die Pflanze bewegt**, hängt an drei Größen: der Blattfläche, dem
Sättigungsdefizit der Luft (VPD, Abschnitt 2) und der Wurzelmasse. Alle drei wachsen über den
Zyklus — deshalb steigt der Bedarf, und deshalb ist eine feste Gießmenge über den ganzen Grow
falsch.

**Warum Überwässerung tötet:** Nicht das Wasser schadet, sondern die verdrängte Luft. Wurzeln
atmen; sie brauchen Sauerstoff im Porenraum. Steht das Substrat dauerhaft nass, kippt die
Wurzelzone ins Anaerobe, die Wurzelspitzen sterben ab, und opportunistische Erreger wie
*Pythium* finden ideale Bedingungen. Das Bild an der Pflanze — schlaffe, hängende Blätter —
sieht dem Wassermangel zum Verwechseln ähnlich. **Deshalb ist der Hebe-Test wichtiger als
jeder Kalender:** Er misst, was tatsächlich im Topf ist.

**Der Nass-Trocken-Zyklus** ist deshalb kein Kompromiss, sondern erwünscht. Beim Abtrocknen
zieht Luft in den Porenraum nach. Wurzeln wachsen dorthin, wo Wasser *war*. Ein Topf, der
zwischen den Güssen nie leichter wird, erzieht ein flaches, schwaches Wurzelsystem.

---

## 2 · VPD: das Sättigungsdefizit, und warum es am Blatt gemessen wird

VPD (Vapour Pressure Deficit) ist die Differenz zwischen dem Wasserdampfdruck, den die Luft
bei Sättigung tragen könnte, und dem, den sie tatsächlich trägt. Es ist das physikalische Maß
für „wie stark zieht die Luft Wasser aus dem Blatt".

**Sättigungsdampfdruck (Magnus-Gleichung), in kPa:**

```
SVP(T) = 0,6108 · e^( 17,27·T / (T + 237,3) )
```

**Blatt-VPD:**

```
VPD = SVP(T_Blatt) − SVP(T_Luft) · RH/100
```

**Warum die Blatttemperatur und nicht die Lufttemperatur:** Die Verdunstung findet an der
Blattoberfläche statt, und Blätter sind durch Verdunstungskälte kühler als die Umgebungsluft
— unter LED typisch 2 °C, unter Hochdruckdampflampen wegen der Strahlungswärme weniger.
Kühlere Luft trägt weniger Wasser, also ist das echte VPD am Blatt **niedriger** als das der
Raumluft. Bei 25 °C und 55 % RH: 1,43 kPa in der Luft, aber nur 1,07 kPa am Blatt. Wer gegen
den Luftwert regelt, hält die Pflanze zu feucht.

In GrowSmart: `_svp`, `calcVPD`, `_leafOffset` (Standard 2 K, einstellbar 0–5).

**Zielkorridore** (Konvention aus der Praxis, keine Naturkonstante):

| Phase | VPD am Blatt | Warum |
|---|---|---|
| Sämling / Steckling | 0,4–0,8 kPa | Kaum Wurzeln, kann Verlust nicht ersetzen |
| Wachstum | 0,8–1,2 kPa | Kräftige Transpiration, schneller Nährstofftransport |
| Frühe/mittlere Blüte | 1,2–1,5 kPa | Hoher Bedarf bei noch weichem Gewebe |
| Späte Blüte | 1,4–1,6 kPa | Trockener gegen Schimmel in dichten Blüten |

**Zu niedriges VPD:** Die Pflanze verdunstet kaum, der Nährstofftransport stockt, und die
Blattoberfläche bleibt lange feucht — die Eintrittsbedingung für Pilze.

**VPD ≤ 0 ist eine eigene Kategorie:** Die Luft ist am kühleren Blatt bereits gesättigt, es
**kondensiert Wasser auf dem Blatt**. In der Blüte bedeutet stehende Nässe auf dichten Blüten
*Botrytis cinerea* innerhalb von Stunden. Das ist kein „etwas zu feucht", und die App
behandelt es seit v1.5.101 als eigene Warnstufe.

**Zu hohes VPD:** Die Pflanze schließt die Stomata, um Wasser zu halten. Damit stoppt auch die
CO₂-Aufnahme — die Photosynthese kommt zum Erliegen. Die Pflanze steht dann im Licht und
wächst trotzdem nicht.

---

## 3 · pH: warum er über Verfügbarkeit entscheidet, nicht über Menge

Der pH-Wert der Wurzelzone bestimmt, in welcher chemischen Form ein Nährstoff vorliegt — und
nur bestimmte Formen kann die Wurzel aufnehmen. Ein Nährstoff kann reichlich vorhanden und
trotzdem unverfügbar sein („Lockout").

**Zielbereiche:**

| Substrat | pH | Warum |
|---|---|---|
| Erde | 6,0–6,5 | Beste Gesamtverfügbarkeit; Bodenleben arbeitet hier |
| Coco / Hydro | 5,5–6,0 | Inertes Substrat ohne Puffer, direkte Ionenaufnahme |

**Was bei Abweichung passiert:**
- **Zu niedrig (< 5,5 in Erde):** Mangan und Aluminium werden mobil und wirken toxisch;
  Calcium und Magnesium werden schlechter verfügbar.
- **Zu hoch (> 6,8):** Eisen, Mangan, Zink und Bor fallen aus. Klassisches Bild: Eisenmangel
  — hellgelbe junge Blätter bei grün bleibenden Blattadern.

**Warum Erde träger ist als Coco:** Erde hat eine Kationenaustauschkapazität (KAK). Tonminerale
und Humus binden Nährionen und geben sie nach und nach ab — ein chemischer Puffer, der
Fehler abfedert. Coco hat kaum Puffer, dafür schnellere Reaktion. **Daraus folgt: In Coco wird
häufiger, schwächer und mit engerer pH-Kontrolle gedüngt.** Coco bindet außerdem selbst
Calcium und Kalium und gibt dafür Natrium ab — deshalb ist Cal/Mag in Coco praktisch immer
nötig, in Erde oft nicht.

---

## 4 · EC: gelöste Salze und osmotischer Druck

EC (elektrische Leitfähigkeit) misst die Gesamtkonzentration gelöster Salze — **nicht**, ob
die richtigen darin sind. Zwei Lösungen mit identischem EC können völlig verschieden
zusammengesetzt sein. EC ist eine Mengen-, keine Qualitätsangabe.

**Warum Überdüngung schadet:** Wasser folgt dem osmotischen Gefälle. Ist die Salzkonzentration
in der Wurzelzone höher als im Wurzelgewebe, kehrt sich der Fluss um — die Pflanze **verliert**
Wasser an das Substrat. Das Schadbild ist deshalb identisch mit Trockenheit: verbrannte,
eingerollte Blattspitzen, welke Pflanze im nassen Topf. Der Anfängerreflex „sieht durstig aus,
also mehr gießen" verschlimmert es, wenn mit derselben Lösung nachgegossen wird.

**Typischer Verlauf** (Konvention; Genetik und Substrat verschieben ihn):

| Phase | EC (mS/cm) | Warum |
|---|---|---|
| Sämling | 0,4–0,6 | Kaum Wurzeln, hohe Empfindlichkeit |
| Wachstum | 0,7–1,2 | Stickstoffbetont, Blattmasse aufbauen |
| Stretch / früher Blütenansatz | 1,0–1,4 | Umstellung, hoher Gesamtbedarf |
| Blütenaufbau | 1,4–1,9 | Höchster Bedarf, Phosphor/Kalium-betont |
| Späte Reifung | 0,8–1,2 | Bedarf sinkt, Stickstoff bewusst zurück |
| Spülen | 0,2–0,4 | Nur noch Wasser |

**Warum Stickstoff spät zurückgefahren wird:** Reichlich Stickstoff hält die Pflanze im
vegetativen Modus — die Blüten bleiben locker und blattreich, und der Reststickstoff im
Pflanzenmaterial verbrennt später scharf. Das ist der Grund für die Absenkung, nicht ein
Ertragstrick.

**Drain-EC ist aussagekräftiger als Zulauf-EC.** Liegt der Ablauf deutlich über dem Zulauf,
reichert sich Salz im Substrat an: Die Pflanze nimmt Wasser schneller auf als Salz. Dann
weniger düngen oder mit klarem Wasser durchspülen — nicht mehr düngen.

---

## 5 · Licht: Menge, nicht Intensität

Entscheidend ist die **Tageslichtsumme** (DLI, Daily Light Integral) in mol/m²/Tag — also
Intensität × Stunden. Dieselbe Lichtmenge lässt sich mit wenig Licht über lange Zeit oder viel
Licht über kurze Zeit liefern.

```
DLI = PPFD (µmol/m²/s) × Lichtstunden × 3600 / 1.000.000
```

| Phase | PPFD (µmol/m²/s) | grober DLI |
|---|---|---|
| Sämling | 150–300 | 10–20 |
| Wachstum | 400–600 | 25–40 |
| Blüte | 600–900 | 35–50 |

**Warum mehr Licht irgendwann nichts mehr bringt:** Ohne CO₂-Anreicherung ist die
Photosynthese ab etwa 900–1000 µmol/m²/s CO₂-limitiert, nicht lichtlimitiert. Zusätzliches
Licht wird dann zu Wärme und Stress. Lichtbrand entsteht meist nicht durch Photonen, sondern
durch Strahlungswärme und das dadurch getriebene VPD — die Blätter direkt unter der Lampe
bleichen aus, während der Rest gesund aussieht.

**Photoperiodische Sorten** blühen, wenn die Dunkelphase lang genug ist — sie messen die
Nachtlänge, nicht die Taglänge. Deshalb ruiniert schon ein kurzer Lichteinbruch in der Nacht
die Blühinduktion und kann Zwitterbildung auslösen. **Die Dunkelphase muss wirklich dunkel
sein.**

**Automatics** tragen ein *Cannabis ruderalis*-Erbe und blühen **altersabhängig**, unabhängig
von der Lichtdauer. Daraus folgt praktisch alles Wichtige:
- Sie brauchen keine Umstellung und vertragen 18–20 Stunden Licht über den ganzen Zyklus.
- **Sie holen verlorene Zeit nicht auf.** Eine photoperiodische Pflanze kann man nach einem
  Rückschlag länger vegetativ stehen lassen; eine Auto blüht trotzdem weiter. Deshalb sind
  Trainingseingriffe bei Autos riskanter und müssen früh geschehen.
- Züchterangaben zur Gesamtdauer sind systematisch optimistisch — sie gelten für
  Idealbedingungen. Die Praxis liegt regelmäßig deutlich darüber; genau das war der Fehler
  hinter v1.5.98.

---

## 6 · Reife: was Trichome anzeigen

Die harzbildenden Drüsen (gestielte Trichome) durchlaufen einen sichtbaren Verlauf, der mit
dem Cannabinoidprofil zusammenhängt.

| Zustand | Bedeutung |
|---|---|
| **Klar/glasig** | THCA-Bildung läuft noch, Ertrag und Wirkung unfertig — zu früh |
| **Milchig/trüb** | Höchster THCA-Gehalt; die Trübung entsteht durch dichte Cannabinoidkristalle |
| **Bernsteinfarben** | THCA oxidiert zu CBNA; sedierendere Wirkung, sinkende Potenz |

**Der Mechanismus hinter Bernstein:** Es ist ein Abbauprozess — Oxidation, beschleunigt durch
UV-Licht, Wärme und Zeit. Mehr Bernstein heißt nicht „reifer im Sinne von besser", sondern
„weiter im Abbau". Wer maximale Potenz will, erntet überwiegend milchig; wer eine ruhigere
Wirkung will, lässt mehr Bernstein zu. Das ist eine **Zielentscheidung des Growers**, keine
Optimierungsaufgabe der App.

**Warum Trichome den Kalender schlagen:** Der Plan-Erntetag stammt aus einer Wochenangabe der
Samentüte — einer Sortenkonvention. Die Trichome sind eine Messung an *dieser* Pflanze unter
*diesen* Bedingungen. Bei Widerspruch gewinnt die Messung. Genau deshalb existiert
`_trichVsPlan`.

**Wo zu messen ist:** An den Blüten, nicht an den Zuckerblättern — dort reifen Trichome
schneller und täuschen Reife vor. Und nicht nur an der Spitzenblüte: Die oberen Blüten bekommen
mehr Licht und sind weiter als die unteren.

**Zu früh ernten ist der teuerste Fehler im ganzen Zyklus.** Er kostet Ertrag *und* Wirkung,
und er ist der einzige, der sich nicht mehr korrigieren lässt. Ein paar Tage zu spät kosten
fast nichts. Deshalb plant die App konservativ mit dem oberen Ende jeder Spanne.

---

## 7 · Nach dem Schnitt: Trocknen und Fermentieren

Hier wird mehr Qualität vernichtet als in jeder anderen Phase — und der Schaden entsteht
schnell.

**Trocknen: 18–21 °C, 55–65 % RH, 7–14 Tage, dunkel.** Zu schnelles Trocknen schließt die
Außenseite ab, während innen Feuchtigkeit bleibt; Chlorophyll und Stärke werden nicht abgebaut,
das Ergebnis schmeckt scharf und „grün". Zu langsames Trocknen bei zu hoher Feuchte führt zu
Schimmel. Dunkelheit ist nicht Mystik: **UV-Licht baut THC ab**, und Terpene sind flüchtig —
jedes Grad Wärme mehr treibt sie aus.

**Fermentieren (Curing): dicht verschlossen, 60–65 % relative Feuchte im Glas.** Physikalisch
geht es um die **Wasseraktivität** (a_w) — den frei verfügbaren Wasseranteil, nicht den
Gesamtwassergehalt. Ziel ist a_w 0,55–0,65:
- **Unter 0,55:** zu trocken, Terpene sind bereits verloren, das Material zerbröselt.
- **Über 0,70:** Schimmel und Bakterien können wachsen.

Im Zielbereich wandert Restfeuchte aus dem Inneren an die Oberfläche und gleicht sich aus,
Chlorophyll baut weiter ab, und Terpene entwickeln sich. Das braucht Wochen und lässt sich
nicht abkürzen.

---

## 8 · Die Fehler, die Pflanzen töten — mit Mechanismus

Nach diesen Punkten wird jede neue Warnung, jeder neue Default und jeder Text geprüft.

1. **Überwässerung.** Verdrängte Luft in der Wurzelzone → anaerobe Bedingungen → Wurzelfäule.
   Sieht aus wie Trockenheit. Häufigster Anfängertod, besonders bei Sämlingen im zu großen
   Topf: Das ungenutzte Substratvolumen trocknet nie ab.
2. **Überdüngung.** Osmotische Umkehr — die Pflanze verliert Wasser an das Substrat. Bei
   Sämlingen besonders schnell tödlich; Light-Mix-Erden sind bereits vorgedüngt und brauchen
   in den ersten zwei bis drei Wochen gar nichts.
3. **Falscher pH.** Nährstoffe sind vorhanden, aber chemisch nicht verfügbar. Erzeugt
   Mangelbilder, die zu weiterem Düngen verleiten — was den EC hochtreibt und alles
   verschlimmert.
4. **Schimmel in der Blüte.** *Botrytis* ab etwa 60–65 % RH bei dichten Blüten, drastisch
   beschleunigt durch stehende Nässe (VPD ≤ 0) und fehlende Luftbewegung. Wird oft erst
   bemerkt, wenn die Blüte innen schon grau ist — deshalb prüft man von innen, nicht von außen.
5. **Lichtbrand.** Meist Wärme- und VPD-Problem, nicht Photonenüberschuss. Abstand und
   Abluft prüfen, bevor die Leistung reduziert wird.
6. **Zu früh ernten.** Kostet Ertrag und Wirkung, nicht rückholbar (Abschnitt 6).
7. **Lichteinbruch in der Dunkelphase** bei photoperiodischen Sorten: Blühstörung bis
   Zwitterbildung.

---

## 9 · Was verbreitet, aber nicht belegt ist

Vor jeder neuen Automatik zuerst hier nachsehen. Eine Funktion, die einen Fehler verhindern
soll, den es nicht gibt, ist selbst ein Fehler — das hat dieses Projekt bereits eine
Automatik und vier Releases gekostet (die „Abtrockenphase vor dem Spülen", v1.5.65–79).

- **IceFlush.** Kein belegter Trichom- oder Potenzeffekt. Die App sagt das selbst offen —
  dieser Ton ist richtig und soll so bleiben. Wer es machen will, soll es machen; die App
  plant es sauber ein, verspricht aber nichts.
- **Spülen vor der Ernte.** Kontrovers. Kontrollierte Vergleiche fanden keinen belastbaren
  Unterschied in Geschmack oder Aschequalität zwischen gespülten und ungespülten Pflanzen.
  Der sichtbare „Nährstoffabbau" in den letzten Tagen ist überwiegend natürliche Seneszenz.
  Als Praxis unschädlich und verbreitet — aber kein Qualitätsversprechen.
- **Dunkelphase 24–72 h vor der Ernte.** Kein belegter THC-Zuwachs.
- **Zuckerwasser, Melasse in Mineraldünger, Mondphasen-Kalender.** Ohne Wirknachweis.
  Melasse hat in *lebendem* Boden eine nachvollziehbare Funktion als Nahrung für
  Mikroorganismen — in einer sterilen Mineralversorgung nicht.
- **„Blätter entfernen bringt mehr Licht an die unteren Blüten."** Teilweise richtig, aber
  ein Blatt ist zuerst ein Photosynthese-Organ und ein Nährstoffspeicher. Übermäßiges
  Entlauben in der Blüte kostet Ertrag. Gezielt und wenig, nicht großflächig.

**Der Umgang damit in der App:** Nichts davon wird verboten oder wegdiskutiert — Patrick und
andere Grower nutzen diese Techniken, und sie planbar zu machen ist der Zweck der App. Aber
kein Text darf einen Effekt versprechen, den es nicht gibt. „Beliebte Grower-Technik, ein
Trichom-Plus ist wissenschaftlich allerdings nicht belegt" ist die richtige Formulierung.

---

## 10 · Was das für Entscheidungen in dieser App heißt

- **Bei Unsicherheit in Richtung Sicherheit runden.** Weniger Dünger, kürzere Lichtphase,
  späterer Erntetag, früherer Hinweis. Optimistische Defaults töten Anfängerpflanzen; ein
  konservativer Default kostet ein paar Prozent Ertrag.
- **Konservativ heißt nicht immer „weniger".** Beim Erntezeitpunkt ist *später* die sichere
  Seite, bei der Düngermenge *weniger*, beim Gießen kommt es auf das Substrat an. Immer vom
  Schadensmechanismus her denken, nicht von der Richtung.
- **Messung schlägt Kalender.** Trichome schlagen den Plan-Erntetag. Der Hebe-Test schlägt
  das Gießintervall. Drain-EC schlägt den Zulauf-EC. Patricks Erfahrung schlägt die
  Sortentabelle.
- **Erst prüfen, ob die App die Antwort schon kennt.** Bevor ein Regler entsteht: Lässt sich
  der Wert aus dem Zustand herleiten? Vorbilder sind `_snapFlushToRhythm` und `_trainingFit` —
  Letzteres wertete nur ein Feld aus, das seit jeher im Datenmodell stand.
- **Eine Zahl ohne Einordnung ist keine Information.** „EC 1150" hilft niemandem. „EC 1,15 —
  im Ziel für Blütewoche 5" ist eine Aussage. Bei jedem Wert gehört das Wort davor.
- **Fachbegriffe bekommen ihre Erklärung dort, wo sie stehen** (`INFO_TERMS`,
  `showInfoPopover`). Wer VPD zum ersten Mal liest, muss ohne Bildschirmwechsel weiterkommen.
