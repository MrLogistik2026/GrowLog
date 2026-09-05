# Änderungen

Neueste zuoberst. Je Eintrag: Datum, was geändert wurde, warum.

## 2026-09-05 — v1.5.109

- **Die Karte „Dünge-Regeln" unter Tipps gab feste Zahlen aus, die dem eigenen Zustand
  widersprachen.** Drei der fünf Zeilen waren fest verdrahtet und wussten nichts vom
  Substrat und nichts vom aktiven Düngeplan:
  „🎯 pH-Wert: Fertige Mischung **immer auf 6.4**" ist der Erde-Wert. Für Coco gehört der pH
  auf 5,8–6,2, für Hydro auf 5,5–6,0 — 0,4 bis 0,9 Einheiten tiefer. Wer einen der
  mitgelieferten Coco-Pläne fährt und dieser Zeile folgt, landet nach `ANBAU.md` 4 im
  Bereich, in dem Eisen und Mangan schwerlöslich werden. Dabei gibt es `phTargetFor(medium)`
  im Code ausdrücklich als „die EINE Quelle für alle dynamischen pH-Anzeigen" — die Karte
  hat sie nur nicht benutzt.
  „⚗️ Reihenfolge: **Erst CalMag** → umrühren → dann Rest" ist falsch, sobald ein Silikat im
  Plan steht. Kaliumsilikat ist mit pH 11–12 stark alkalisch; trifft es auf eine Lösung, die
  schon Calcium enthält, fällt sofort Calciumsilikat aus (`ANBAU.md` 10) — sichtbar als weiße
  Flocken, und Silizium wie Calcium sind für die Pflanze verloren. Der App-eigene
  cup_sieger-Plan sagt an seiner eigenen Stelle völlig richtig „Silica Force IMMER zuerst,
  dann 2–5 Min warten — sonst Calcium-Ausfällung". Die Tipps-Karte sagte das Gegenteil.
  „📉 Überdüngung: **Bio·Bloom** um 20% reduzieren" nannte ein Produkt aus einem bestimmten
  BioBizz-Plan als allgemeine Regel — auch für alle, die diesen Plan nicht fahren.
  Jetzt kommen alle drei aus dem Zustand: das pH-Ziel aus `phTargetFor(c.medium)` samt
  Nennung des Substrats („das Ziel für Erde"), die Reihenfolge aus `S.mixOrder` des aktiven
  Plans — mit dem Grund dahinter, wenn der erste Schritt ein Silikat ist —, und die
  Überdüngungs-Zeile spricht vom „Blütedünger deines Plans" statt von einem fremden Produkt.
  Läuft kein Plan, steht dort die allgemeine Regel aus `ANBAU.md` 10 statt einer Lücke.
  Abgesichert durch `test_duengeregeln.js` (13 Prüfungen, beide Zeitzonen) über vier Fälle:
  Erde, Coco, Hydro und ein Plan mit Silikat an erster Stelle.

## 2026-09-05 — v1.5.108

- **Die Diagnose begründete ihren Vorschlag mit internen Programmier-Schlüsseln.** Unter
  „Warum diese Hypothese" stand wörtlich „• Symptome: oldLeaves; yellow" und „• Kontext:
  passt zu Phase (flush)". Das sind die englischen Feldnamen aus dem Code — genau an der
  Stelle, an der ein Anfänger nachliest, warum die App gerade diese Ursache vorschlägt.
  `diagnoseProblems` legte die Begründung aus den Roh-Schlüsseln an (`matchedLoc.join`), statt
  aus den deutschen Beschriftungen, die auf den Auswahl-Knöpfen direkt darüber stehen.
  Beide Namenslisten lagen längst im Code: `DIAG_LABELS` für die Symptome — dieselbe Quelle,
  aus der die Knöpfe im Assistenten beschriftet werden — und `PN` für die Phasen, dieselbe,
  die auch der Kalender benutzt. Zwei kleine Übersetzer (`_diagWort`, `_phasenWort`) setzen
  sie jetzt ein, mit Rückfall auf den Schlüssel, falls je eine Beschriftung fehlt.
  Aus „• Symptome: oldLeaves; yellow · Kontext: passt zu Phase (flush)" wird damit
  „• Symptome: Alte Blätter (unten); Gelb · Kontext: passt zur Phase Spülen".
  Gefunden beim sichtbaren Durchklicken der Diagnose im Browser — im Konsolentest war der
  Wert korrekt, er las sich nur für niemanden.
  Abgesichert in `test_naehrstoffort.js` (jetzt 20 Prüfungen, beide Zeitzonen), das auf keinen
  der internen Schlüssel mehr trifft und den Rückfall bei unbekanntem Schlüssel mitprüft.

## 2026-09-05 — v1.5.107

- **Die Diagnose führte Magnesium und Calcium in einem Eintrag — und verortete beide oben.**
  Nach `ANBAU.md` 6.1 verhalten sich die zwei gegenläufig: Magnesium kann die Pflanze im
  Blatt umlagern und holt es bei Mangel aus den **alten** Blättern, das Symptom steht deshalb
  **unten** und wandert nach oben. Calcium kann sie nach dem Einbau nicht mehr umlagern, sein
  Mangel steht immer **oben**. Der bisherige Eintrag `calmag_deficiency` beschrieb das
  Magnesium-Bild (gelb zwischen den Blattadern), trug aber `location: newLeaves` — also den
  Ort des Calcium-Mangels.
  Die Folge war messbar: Bei der Eingabe „untere Blätter · gelb · gefleckt" in der Blüte —
  dem Lehrbuchbild für Magnesium — stand Stickstoff-Mangel an erster Stelle und der richtige
  Eintrag auf Platz 3. Bei der häufigeren Anfängereingabe „unten · gelb" fiel er auf Platz 5
  hinter Phosphor zurück. Wer der Liste folgt, düngt Stickstoff nach, und genau das hält die
  Pflanze in der Blüte vegetativ.
  Zweiter, schwererer Teil: Die Handlung lautete pauschal „CalMag-Additiv 1–2 ml/L". Nach
  `ANBAU.md` 6.2 ist der praxisrelevanteste Fall in der Blüte aber gar kein
  Magnesium-Defizit im Substrat, sondern Verdrängung durch kaliumbetonte Blütedünger und
  PK-Booster — und Calcium verdrängt Magnesium zusätzlich. Die App empfahl also ein Mittel,
  das den häufigsten Fall verschärfen kann.
  Jetzt zwei Einträge: **Magnesium-Mangel** (unten, gelb zwischen grün bleibenden Adern) mit
  der Handlung in Reihenfolge — erst Blüte-Booster aussetzen, dann pH prüfen, erst dann
  gezielt Bittersalz statt pauschal CalMag — und **Calcium-Mangel** (oben, braune Flecken,
  verdrehte Triebspitzen), der zuerst auf Umluft und Luftfeuchte zeigt, weil Calcium nur mit
  dem Verdunstungsstrom ins Blatt kommt (`ANBAU.md` 1). Beide tragen ihr
  Unterscheidungskriterium im Text, nach Regel 3: Ein Symptom bekommt nie nur eine Ursache.
  Abgesichert durch `test_naehrstoffort.js` (13 Prüfungen, beide Zeitzonen), das auch die
  Gegenprobe fährt — Calcium darf bei einem Bild von unten nicht vorn stehen.

## 2026-09-05 — v1.5.106

- **Nach der Zurück-Taste aus dem Gieß-Fahrplan war der Düngeplan leer.** `goTo(t)` rendert
  `dash`, `cal`, `tips`, `set` und `gussplan` — `duenger` fehlte als einziger Bildschirm mit
  eigenem Inhalt. Der Zurück-Handler schickt aus dem Gieß-Fahrplan auf den Düngeplan; der
  wurde damit sichtbar geschaltet, aber nie gefüllt und stand leer bis auf die Kopfzeile.
  Dass es nie auffiel, liegt an der Befehlssuche: Sie ruft hinter `goTo` zusätzlich
  `renderDuenger()` auf und kaschierte den Fehler auf ihrem Weg. Über die Zurück-Taste — auf
  dem Handy der übliche Weg — gab es diesen Zusatz nicht.
  Behoben in `goTo` selbst statt an der Aufrufstelle, damit jeder künftige Weg dorthin
  gedeckt ist. Der Test prüft deshalb alle sechs Hauptbildschirme, nicht nur diesen einen.

## 2026-09-05 — v1.5.105

- **Die Berichtigen-Liste der Trichom-Messungen schnitt am angezeigten Tag ab.**
  `_trichHistoryEditor` holte die Reihe mit `_trichHistory(c.id, c, iso)` — also nur bis zum
  geöffneten Tag. Das Diagramm direkt darüber zeigt seit v1.5.27 aber bewusst den **ganzen**
  Verlauf, auch später eingetragene Messungen. An Tag 95 fehlten dadurch 15 der 47 Messungen:
  Wer im Diagramm einen Ausreißer entdeckte, der später lag, konnte ihn in der Liste darunter
  nicht berichtigen und musste erst zu dessen Tag navigieren.
  Der Zweck der Liste ist das Berichtigen einer Messreihe, nicht die Ansicht eines Tages —
  sie zeigt jetzt immer alle Messungen. Damit man sich in bis zu 47 Zeilen zurechtfindet,
  ist der gerade geöffnete Tag grün hervorgehoben.
  Beides zusammen abgesichert durch `test_navrender.js` (16 Prüfungen, beide Zeitzonen).

## 2026-09-05 — v1.5.104

- **Die Ablaufmessung wird nicht mehr bewertet, bevor feststeht, dass sie etwas misst.**
  Grundlage ist `ANBAU.md` 5.1: Ein Drain-EC bei 5 % Durchfluss ist keine schlechte Messung,
  sondern gar keine. Bei so kleinem Durchfluss läuft das Wasser überwiegend am Topfrand
  entlang, statt den Wurzelballen zu durchqueren; was unten ankommt, ist die konzentrierte
  Restlösung des vorigen Gusses und misst sich systematisch zu hoch. Die App bewertete bisher
  jeden eingetragenen Wert gleich — und konnte es auch nicht anders, weil die Ablaufmenge
  nirgends erfasst wurde.
  Neu ist das Feld **„Ablauf (ml)"** neben Drain-pH und Drain-EC, mit einem Vorschlagswert von
  einem Fünftel der Gießmenge, sowie `drainFlow(cd)` als Einstufung: unter 10 % keine Aussage,
  10–15 % schwach, 15–30 % gültig, darüber gültig aber bereits auswaschend. Unter der
  Eingabezeile steht das Ergebnis dauerhaft („Durchfluss 20 % · aussagekräftig"), nicht in
  einer wegklickbaren Warnung.
  Ist die Messung ungültig, unterbleiben **beide** Bewertungen — auch die des Drain-pH, den
  `ANBAU.md` 4.1 aus demselben Grund nennt. Stattdessen steht dort, wie viel Ablauf beim
  nächsten Mal nötig wäre, in Millilitern ausgerechnet. Die Box bleibt dabei blau statt
  orange: Eine unbekannte Lage ist kein Alarm.

- **Ein hoher Drain-EC in organischer Spätblüte bekommt keine Diagnose mehr, sondern zwei
  Erklärungen.** Dort laufen zwei Prozesse gegenläufig zur naheliegenden Deutung
  (`ANBAU.md` 5.1): Organisch gebundene Nährstoffe werden bis zuletzt mineralisiert, und die
  Pflanze fährt in der Seneszenz die Aufnahme zurück. Beides hebt den Ablaufwert, ohne dass
  überdüngt wurde. Am Messwert sind die Fälle nicht zu unterscheiden — an der Pflanze schon.
  Die App nennt jetzt beide Ursachen und liefert das Kriterium mit: gleichmäßige Vergilbung
  von unten ohne verbrannte Spitzen spricht für Seneszenz (nicht spülen, das nähme ihr die
  Reserve), fleckige Blätter oder Spitzenbrand für echte Anreicherung. In Coco und Hydro
  bleibt die klare Ansage, weil es dort keinen Mineralisierungsanteil gibt.
  Warum das nötig war: Ohne diese Unterscheidung meldet die App bei jedem organischen Grow ab
  Blütewoche 5 einen Fehler, den es nicht gibt.

- **Beim sichtbaren Durchklicken gefunden und mitbehoben:** Die Durchfluss-Zeile stand nur im
  Render-Zweig. Beim Tippen in das neue Feld aktualisierte sich zwar die Auswertung darunter,
  die Zeile darüber behielt aber ihren alten Text („Ohne Ablaufmenge lässt sich nicht
  sagen…"). Sie ist jetzt eine eigene Funktion `_runoffFlowLine`, die beide Wege benutzen.
  In einem reinen Konsolentest wäre das nicht aufgefallen.

  Abgesichert durch `test_drain.js` (45 Prüfungen, beide Zeitzonen): die sieben Stufen der
  Durchfluss-Einteilung, das Ausbleiben und Wiederkommen der Bewertung, die
  Differenzialdiagnose samt Gegenprobe in Coco und in früher Blüte, Randfälle (0 ml, negativ,
  Buchstaben, mehr Ablauf als gegossen, fehlende Gießmenge) und das Mitziehen der Anzeigezeile.

## 2026-09-05 — v1.5.103

- **Eine gespeicherte Pflanzenzahl konnte größer sein als die Zahl der Pflanzen.**
  `getEffectivePlantCount` liest einen eintragsspezifischen Übersteuerungswert
  `cd.plantCount` — ein Feld, das im heutigen Code **keine Stelle mehr schreibt**. Es stammt
  aus einer früheren Version, in der die Pflanzenzahl im Tageseintrag stand, und überstimmte
  trotzdem alles andere. Ein alter, falscher Wert wirkte dadurch dauerhaft weiter, ohne dass
  er sich in der Oberfläche korrigieren ließe: Das zugehörige Eingabefeld gibt es nicht mehr.
  In Patricks Sicherung steht im Eintrag vom 03.06.2026 eine 7, obwohl nie mehr als fünf
  Pflanzen angelegt waren — von ihm am 05.09.2026 ausdrücklich bestätigt. Zwei Folgen: Die
  Gießmenge dieses Tages fiel **40 % zu hoch** aus (3150 statt 2250 ml), und über den
  historischen Stempel `plantsAtWatering` verzerrte die Zahl zusätzlich die gemessene Menge
  je Pflanze (3500 ÷ 7 = 500 statt ÷ 5 = 700 ml) — ein Wert, der über
  `_recentPourPerPlant` in künftige Empfehlungen einfließt und sie nach unten zieht.
  Neu ist `_plantsCap(c)` als Obergrenze aus Pflanzenliste und Zähler; sie deckelt sowohl den
  Eintrags-Override als auch den Gieß-Stempel an allen drei Lesestellen.
  **Gedeckelt statt gelöscht, und nur beim Lesen:** Ein Override kleiner als die Pflanzenzahl
  bleibt gültig („heute nur drei gegossen"), die gespeicherten Daten werden nicht angefasst.
  So wirkt die Korrektur sofort, ohne dass eine Migration Nutzerdaten verändert — und falls
  sich die Annahme je als falsch erweist, ist nichts verloren.
  Abgesichert durch `test_pflanzenzahl.js` (19 Prüfungen, beide Zeitzonen), darunter die
  Gegenproben, dass ein legitimer kleinerer Override durchkommt und dass geerntete Pflanzen
  weiter korrekt herunterzählen — ohne je wieder anzusteigen.

## 2026-09-05 — v1.5.102

- **Die App bot am Tag vor dem IceFlush an, eine Sämlings-Haube aufzusetzen.**
  `openTrainingPicker` zeigte alle acht Methoden ungefiltert, und `pickTrainingType`
  speicherte die Wahl kommentarlos ab („✂️ FIM dokumentiert"). An Tag 113 — Spülphase,
  IceFlush am nächsten Tag, Ernte in wenigen Tagen — standen dort unverändert Sämlings-Haube,
  FIM, Mainlining und SCROG. Ein Schnitt in der Spülphase kostet die Ernte: Die Wunde heilt
  so kurz vor Schluss nicht mehr und ist eine Eintrittsstelle für Schimmel. Ein Anfänger
  konnte das der App nicht ansehen — Topping hatte als einzige Methode einen eigenen Weg mit
  Warnung, die übrigen sieben nicht.
  Das Bemerkenswerte: Jede Methode trägt in `T.training` längst ein `phase`-Feld
  (`haube: 'anzucht'`, `fim: 'vegi'`, `lollipopping: 'bloom'`). Es wurde nur nirgends
  ausgewertet. Neu ist `_trainingFit(c, iso, type)`, das genau dieses Feld gegen die aktuelle
  Phase hält — kein neuer Regler, keine handgeschriebene Warnung je Methode.
  Der Picker sortiert jetzt: „Was jetzt sinnvoll ist" oben, darunter eine Trennlinie „Heute
  nicht dran" mit den übrigen, ausgegraut, mit Marke („zu spät", „spät", „zu früh") und
  Begründung. Wer eine unpassende Methode wählt, bekommt vor dem Eintrag eine Rückfrage mit
  Grund und Rat — aber die Wahl bleibt seine. Weggenommen wird nichts.
  Bei Automatics kommt der Zusatz dazu, dass sie verlorene Tage nicht aufholen.
  Abgesichert durch `test_training.js` (29 Prüfungen, beide Zeitzonen). Wichtigste
  Gegenprobe: **Patricks sieben echte Trainings aus der Sicherung müssen alle weiter als
  passend gelten** — Haube an Tag 4, FIM an Tag 21, viermal LST, Lollipopping an Tag 42. Eine
  Regel, die die reale Praxis blockiert, wäre schlimmer als keine Regel.

- **Ein eigener Test war zeitzonenabhängig und lief nur zufällig durch.** Abschnitt E in
  `test_ernteabgleich.js` rief `renderSet()` auf, das intern `todayISO()` fragt. In
  `Pacific/Kiritimati` (UTC+14) ist je nach Uhrzeit schon der nächste Kalendertag; damit war
  die Trichom-Messung vom 02.09. älter als drei Tage, `harvestWindow` fiel aus der
  Trichom-Basis, und drei Prüfungen schlugen fehl. Kein App-Fehler, ein Testfehler: Die
  übrigen Abschnitte nagelten das Datum bereits fest, dieser eine nicht. `todayISO` wird dort
  jetzt ebenfalls auf den festen Prüftag gesetzt.

## 2026-09-05 — v1.5.101

- **Kondensation auf dem Blatt heißt nicht mehr nur „zu feucht".** `vpdZone` vergab für
  −0,5 · −0,36 · −0,01 · 0 und 0,05 dasselbe Etikett: „Zu feucht · Lüfter an!". Ein
  Blatt-VPD von 0 oder darunter bedeutet aber, dass die Luft am kühleren Blatt gesättigt ist
  und sich **Wasser niederschlägt** — stehende Nässe auf den Blüten, in der Blüte der
  direkte Weg zu Botrytis. Neu ist dafür eine eigene, rote Stufe „Nass — Schimmelgefahr" mit
  Handlungsanweisung statt Etikett: entfeuchten, Luft bewegen, Temperatur um 2–3 °C anheben.
  In der Blüte kommt der Zusatz dazu, jetzt täglich die dichten Blüten auf graue, matschige
  Stellen zu prüfen, weil Schimmel dort binnen Stunden entsteht. Outdoor rät der Text nicht
  zu Geräten, die es dort nicht gibt, sondern zum Abschütteln nach Regen und Nebel.
  Ab 0,05 bleibt alles wie bisher — die neue Stufe ist eine Ergänzung, keine Verschiebung.

- **Der VPD-Marker verschwand ausgerechnet bei Gefahr aus der Skala.** Er wurde mit
  `Math.min(95, z.pct)` positioniert; bei negativem VPD ist `pct` negativ, der Marker
  rutschte also nach links aus dem Balken. Jetzt `Math.max(0, Math.min(95, z.pct))`, an
  beiden Stellen (Klima-Block und Live-Aktualisierung).

- **Die VPD-Formel selbst ist nachgerechnet und unverändert.** `_svp` ist die
  Magnus-Gleichung, `calcVPD` das Blatt-VPD daraus. 14 Wertepaare gegen eine unabhängig
  ausgeschriebene Referenz geprüft, darunter 0 °C, −5 °C, 40 °C, 0 % und 100 % Luftfeuchte —
  alle deckungsgleich, ebenso die Beispielwerte im Codekommentar. Das steht jetzt als Test
  fest, weil an dieser Formel Gießmenge, Klimabewertung und Trocknungsprognose hängen.
  `test_vpd.js`, 24 Prüfungen, beide Zeitzonen.

## 2026-09-05 — v1.5.100

- **Die Düngermengen kamen aus dem falschen Plan, sobald es mehr als einen gab.**
  `getWeekDoses` las die Dosen aus dem globalen `S.weekSchedule` und den `doseMode` aus
  `getActivePlan()` — beides also aus dem **global aktiven** Plan, obwohl der Zyklus als
  Parameter übergeben wird und über `c.fertPlanId` seinen eigenen Plan kennt.
  `switchFertPlan()` setzt den aktiven Plan aber schon dann um, wenn man im
  Dünger-Bildschirm einen anderen Plan nur **ansieht**; `c.fertPlanId` bleibt unberührt.
  Damit reichte ein Blick auf den zweiten Plan, um im Tageseintrag die Produkte und Mengen
  eines fremden Plans zu bekommen. Mit Patricks Daten nachgestellt: Statt der sechs
  BioBizz-Produkte (Bio·Grow 1,29 · CalMag 0,86 · Top·Max 0,43 …) erschienen die neun
  Sensi-Produkte, darunter POWHUMUS mit 10 ml/L — ein Mittel, das in seinem laufenden Plan
  überhaupt nicht vorkommt. Unterscheiden sich die Pläne zusätzlich im `doseMode`, kam der
  Faktor 7/Gießintervall danebenzuliegen: bei Intervall 3 also grob das Zweieinhalbfache
  oder zwei Fünftel der richtigen Menge.
  Gelesen wird jetzt aus dem Plan des Zyklus. Ausnahme mit Absicht: Ist dieser Plan zugleich
  der global aktive, gelten weiter die Globals — dort stehen die noch nicht
  zurückgeschriebenen Bearbeitungen aus dem Dünger-Bildschirm. Für den bisherigen Normalfall
  (ein Zyklus, ein Plan) ändert sich dadurch nichts, was die 25 bestehenden Testdateien
  bestätigen.
  Warum das schwer wog: Es ist der Rechenweg, an dessen Ende eine Milliliterzahl steht, die
  jemand in eine Gießkanne füllt. Ein Anzeigefehler wäre ärgerlich — dieser hier führt zu
  einer real falschen Düngung.
  Abgesichert durch `test_dosisquelle.js` (16 Prüfungen, beide Zeitzonen): Ein zweiter
  Zyklus mit dem jeweils anderen Plan muss unabhängig vom global aktiven Plan dieselben
  Dosen liefern, der echte Zyklus darf kein Fremdprodukt bekommen, der weekly-split-Teiler
  muss weiter greifen, und ein Zyklus ohne `fertPlanId` darf nicht abstürzen.

## 2026-09-05 — v1.5.99

- **Erfasste Ernteerträge waren an zwei Stellen gespeichert und wurden nur an einer
  gelesen.** Die Einzelernte in der Pflanzenliste schreibt seit v1.5.54
  `plants[].yieldWet/yieldDry`, das ältere Formular in den Einstellungen dagegen
  `c.plantHarvest[id].wetG/dryG`. `getPlantHarvest` und `getTotalHarvest` kannten nur den
  älteren Ort. Folge bei Patricks echtem Stand: 37 g trocken und 195 g nass aus Pflanze 5
  waren erfasst, die Einstellungen meldeten „noch nichts erfasst", und die Zyklus-Bilanz
  wies überhaupt kein Erntegewicht aus — `cycleStats().harvestWeight` war null, `g/Pflanze`
  fehlte ganz. Beide Funktionen lesen jetzt aus beiden Quellen; steht dieselbe Pflanze in
  beiden, gewinnt der Wert an der Pflanze und wird nicht doppelt gezählt.
  Der gefährlichere Teil war das Schreiben: Eine Eingabe im Einstellungs-Formular hätte
  eine **zweite** Zahl für dieselbe Pflanze angelegt, ohne dass jemand sagen könnte, welche
  gilt. `setPlantHarvest` schreibt Gewichte deshalb jetzt an die Pflanze — dorthin, wo auch
  der andere Eingabeweg schreibt — und räumt einen etwaigen Altwert derselben Pflanze ab.
  Warum `plants` gewinnt: Es ist bereits die Quelle der Wahrheit für die Pflanzenzahl
  (`c.plantCount = c.plants.length`); zwei Wahrheiten für dieselbe Sache waren genau das
  Problem. Zyklen ohne `plants`-Array und das ganz alte `c.harvestWeight` funktionieren
  unverändert weiter.
  Abgesichert durch `test_ertrag.js` (30 Prüfungen, beide Zeitzonen), darunter die
  Gegenproben gegen Doppelzählung, gegen Datenverlust bei verwaisten Alt-Einträgen und für
  beide Rückfall-Ebenen.

- **Die Ernte-Kacheln auf dem Dashboard widersprachen der Erntekarte darüber nicht mehr.**
  Die Karte sagt seit v1.5.97 „richte dich nach der Messung", zwei Zentimeter darunter stand
  aber weiter „Ernte in 3 ±5d" und „Erntedatum 08. Sept." aus dem Plan. Beim Überfliegen
  gewinnt die große Zahl. Nennt die eigene Trichom-Messung einen späteren Tag, zeigen die
  Kacheln jetzt ihn: „min. 5 d" und „ab 10. Sept.", mit dem ganzen Abgleich als Tooltip.
  Der Vergleich läuft in `renderDash` und bewusst **nicht** in `harvestCountdown` — denn
  `harvestWindow` ruft `harvestCountdown` auf, ein Abgleich dort wäre eine Endlosschleife.

- **„Erntegewicht pro Pflanze (5)" erklärt sich jetzt selbst.** Die Zahl warf die Frage auf,
  warum der Gieß-Fahrplan mit 3 Pflanzen rechnet. Beide Zahlen stimmen, sie beantworten nur
  verschiedene Fragen — erfasst wird für alle angelegten Pflanzen, gegossen nur für die noch
  stehenden. Die Überschrift sagt das jetzt: „(5, davon 2 schon geschnitten)".

## 2026-09-05 — v1.5.98

- **Die Sortenliste plant keine Ernte mehr 40 Tage zu früh.** In `STRAINS` standen bei den
  Automatics Züchter-Bestwerte. Bei Sensi Amnesia XXL waren es 75 Tage; Patricks Pflanze
  brauchte 116, und der App-eigene Düngeplan `sensi_amnesia_auto` rechnet für dieselbe Sorte
  mit 17 Wochen und `bloomDaysHint: 77`. Wer den Chip „Sensi Amnesia XXL · 75d" antippte,
  bekam über `_pickStrain` → `_wizFinish` (`75 − 21 − 8 − 3 = 43` Blütetage) eine Ernte an
  Tag 76 geplant — vierzig Tage zu früh. Die Rechnung war richtig, die Eingangszahl nicht.
  Neu ist die Spanne `floweringLo`/`floweringHi` samt `strainDays(s)` als einziger Stelle,
  die sie auslegt. Sensi Amnesia XXL trägt jetzt 105–120 Tage; geplant wird mit dem oberen
  Ende, wodurch der Erntetag bei 121 statt 76 landet. Warum das obere Ende: dieselbe Regel
  wie bei der Wochen-Angabe von der Samentüte — zu spät ernten kostet nichts, zu früh kostet
  die Ernte, und zu früh geschnitten lässt sich nicht nachholen.
  Die übrigen 14 Automatics wurden **bewusst nicht** geändert: Für sie liegt kein Beleg im
  Projekt vor, und geschätzte Zahlen als Messwerte auszugeben wäre derselbe Fehler noch
  einmal. Sie tragen weiter den Züchter-Wert, werden im Steckbrief aber ausdrücklich als
  „Züchter-Angabe, nicht nachgemessen" gekennzeichnet, mit dem Rat, die Wochen-Angabe von
  der eigenen Samentüte einzutragen. Patrick liegt eine Tabelle zum Gegenlesen vor.
  Die Photoperioden-Sorten sind unangetastet — dort ist `flowering` die reine Blütezeit und
  plausibel.

- **Drei Stellen beschrifteten dieselbe Zahl falsch.** Bei Automatics zählt sie ab Keimung,
  die Sortensuche nannte sie aber „⚡ Auto · Blüte 75d" und der Steckbrief „Blüte-Dauer 75
  Tage"; der Chip nannte gar keine Einheit („· 75d" — 75 Tage wovon?). Nur `_strainInfoHTML`
  sagte es richtig. Alle vier Stellen holen den Text jetzt aus `strainDays()`, das neben den
  Zahlen auch mitliefert, worauf sie sich beziehen. Warum als eigener Helfer statt vier
  Korrekturen: Vier Stellen, die dieselbe Zahl selbst auslegen, laufen wieder auseinander —
  eine Stelle kann das nicht.

  Abgesichert durch `test_sortendauer.js` (27 Prüfungen, beide Zeitzonen), darunter die
  Gegenprobe, dass keine Photoperiode eine Auto-Spanne bekommen hat und dass der Erntetag
  nicht ins andere Extrem gekippt ist.

## 2026-09-05 — v1.5.97

- **Die App fordert nicht mehr zum Ernten auf, wenn die eigene Messung dagegen spricht.**
  Auf dem Dashboard stand „In 3 Tagen: Erntetag. Ab jetzt täglich Trichome prüfen" (Plan-Tag
  116), während die Einstellungen aus denselben Daten „Erntefenster: Tag 118–158 — inzwischen
  aus deinen Trichomen" meldeten. Zwei Zahlen zur selben Frage, keine erklärte die andere.
  Wer der Dashboard-Karte folgt, schneidet zwei Tage vor dem frühesten gemessenen Reifepunkt.
  Neu ist `_trichVsPlan(c, iso)`: Es vergleicht den Plan-Tag aus `harvestWindow` mit dem
  unteren Ende des Trichom-Fensters und liefert null, solange beide zusammenpassen oder die
  Messung früher liegt — früher ist kein Widerspruch, sondern ein bereits offenes Fenster.
  Liegt die Messung später, nennt die Erntekarte jetzt den gemessenen Stand (4 % Bernstein
  gegen ein Ziel von 5 %), den frühesten Reifetag, die Differenz in Tagen und den Satz, dass
  die Messung gilt und nicht der Kalender. Die Einstellungs-Zeile erklärt die zweite Zahl
  ebenfalls, statt sie unkommentiert danebenzustellen.
  Warum in dieser Form: Der Plan-Tag stammt aus einer Wochenangabe von der Samentüte, das
  Fenster aus einer Messung an der Pflanze. Zu früh geerntet kostet Wirkung und Gewicht und
  lässt sich nicht nachholen — deshalb gewinnt die Messung, und deshalb steht der Hinweis
  dort, wo zum Schneiden aufgefordert wird, nicht auf einem Bildschirm daneben.
  Ohne Widerspruch bleibt der alte, kurze Text unverändert; keine neue Dauerwarnung.
  Abgesichert durch `test_ernteabgleich.js` (31 Prüfungen, beide Zeitzonen), darunter zwei
  Gegenproben gegen Fehlalarm: veraltete Messung und Plan-Tag hinter der Messung.

- **Breite Prognosefenster werden als unsicher ausgewiesen.** Reicht die Schätzung über mehr
  als 20 Tage, sagt der Text das ausdrücklich und nennt den Grund, wenn er bekannt ist
  („dein Reifetempo hat zuletzt nachgelassen"). Warum: Bei Patricks Stand spannen Nahtempo
  (0,025 %/Tag) und Gesamttempo (0,1 %/Tag) das Fenster Tag 118–158 auf — vierzig Tage. Als
  blanke Zahl gelesen wirkt das wie eine Messung, ist aber eine offene Frage. `harvestWindow`
  und `_trichForecast` wurden dafür nicht angefasst; die Rechnung ist richtig, nur ihre
  Darstellung war es nicht.

## 2026-09-05 — v1.5.96

- **Arbeitsregeln geschärft (kein App-Code, deshalb keine neue Version).** Vier
  Festlegungen von Patrick: `APP_VERSION` wird bei jeder ausgelieferten Änderung um eine
  Stelle angehoben; gefundene Fehler werden sofort mitbehoben statt gemeldet, aber je
  Fehler mit eigenem Changelog-Eintrag, eigener Version und eigener Prüfung; Changelog und
  Übergabe werden nach jeder Änderung fortgeschrieben statt am Sitzungsende; und bei allem
  Gebauten gilt der Doppelblick Anfänger/Profi mit fünf konkreten Prüfpunkten
  (`ANWEISUNG.md`, Abschnitt „Beide Sichten, jedes Mal"). Die alte Gegenregel „Bug nur
  nennen, nicht mitfixen" wurde ersetzt, nicht ergänzt. Warum: Zwei widersprüchliche Regeln
  in derselben Datei sind schlimmer als keine — es wäre nicht mehr erkennbar, welche gilt.
  Das Vorziehen des Fortschreibens hat einen belegten Grund: Eine Sitzung endet selten
  geplant, und was beim Abbruch ungeschrieben ist, ist verloren.

- **Hochladen ist jetzt Teil des Ausliefern-Ablaufs.** Bisher endete der Ablauf beim
  Commit. Da `.github/workflows/static.yml` bei jedem Push auf `main` automatisch bei
  GitHub Pages veröffentlicht, ist der Push aber genau der Schritt, über den die App auf
  Patricks Handy kommt — ohne ihn testet er einen alten Stand. Gebunden an vier
  Bedingungen: `node --check` grün, Tests in beiden Zeitzonen gelaufen, `cmp` schweigt,
  Versionsnummer an allen drei Stellen gleich. Ist etwas rot, wird committet, aber nicht
  hochgeladen, und das wird gesagt. Warum die Bindung: Der Workflow lädt das gesamte
  Repository hoch (`path: '.'`) — ein kaputter Stand ist sofort der Stand auf dem Handy.

- **Ablauf-Schritt 7 zeigte auf einen Ordner, den es nicht gibt.** `ANWEISUNG.md` verlangte,
  die fertige `index.html` nach `/mnt/user-data/outputs/` zu legen und per `present_files`
  bereitzustellen — beides stammt aus der Container-Umgebung vor dem Umzug auf den Laptop
  am 04.09.2026. Der Schritt beschreibt jetzt den echten Weg: Version anheben, mit
  `build.sh` bauen, Changelog und Übergabe schreiben.

- **Ausschlussliste gegen versehentlich veröffentlichte Grow-Daten verbreitert.** Die
  `.gitignore` erfasste nur `growsmart-sicherung-*.txt`. Jetzt fallen auch beliebig
  benannte Sicherungen, Backups, `.bak`- und Export-Dateien darunter. Warum: Das
  Repository ist öffentlich, und der Link wird zum Testen weitergegeben — eine Sicherung
  mit abweichendem Namen wäre mitgegangen. Geprüft: keine bisher getrackte Datei wird von
  den neuen Regeln erfasst, und in der gesamten Repo-Historie war nie eine Sicherungsdatei
  enthalten.

- **Übergabe fortgeschrieben.** Abschnitt 1 enthält jetzt den am 05.09.2026 gemessenen
  Befund zur Bedienung (Modus-Vergleich, Kopplungs-Messung, doppelte Erntetage, beide
  Bildschirme hinter der Einstellungs-Tür) und die vorgeschlagene Richtung in vier
  Schritten. Abschnitt 3 auf Tag 113 aktualisiert; die offene Frage nach dem rückwirkend
  gesetzten Spülstart ist beantwortet und gestrichen. Warum: Ohne das müsste die Analyse
  nach einem Neustart von vorn gemacht werden.

- **Pflanzen-Zähler löscht keine erfasste Ernte mehr stumm.** Beim Verkleinern von
  `plantCount` kürzte `saveDraft()` das `plants`-Array wortlos von hinten — samt
  Schnitt-Datum und Ertrag ausgerechnet der Pflanzen, die zuerst geschnitten wurden.
  Jetzt wird geprüft, ob eine wegfallende Pflanze `harvestedAt`, `yieldDry` oder
  `yieldWet` trägt; wenn ja, kommt eine Rückfrage, die die betroffenen Pflanzen mit Datum
  und Ertrag benennt und auf den ✕-Weg in der Pflanzenliste hinweist. Bei Ablehnung geht
  die Anzahl auf den echten Stand zurück, alles Übrige wird trotzdem gespeichert.
  Warum: Es war der einzige Weg in der App, auf dem erfasste Ernten ohne ein Wort
  verschwanden — und weil `getEffectivePlantCount` die geernteten ohnehin nicht mitzählt,
  änderte sich auf dem Gieß-Fahrplan kein einziger Wert. Der Verlust war unsichtbar.

- **Endspurt-Karte verschwindet nicht mehr.** `endspurtCard()` stieg bei fehlendem
  `letzterGuss` mit leerem String aus und nahm damit die einzige Bedienstelle für letzten
  Guss, Spülen, Hard-Dryback, IceFlush und Ernte vom Bildschirm. Zwei Änderungen:
  `endspurtState()` fällt auf den letzten echten Wassereintrag zurück, wenn das Raster
  keinen Gießtag findet; und die Karte rendert auch ohne ableitbaren Anker — die Zeile
  sagt dann „noch offen" und nennt die beiden Tage, auf die − und + setzen würden.
  Warum: Ursache ist ein Gießintervall, das nicht zu den eingetragenen Güssen passt.
  `getAction` verankert die Blüte am letzten Wassereintrag; liegt der immer 3 Tage zurück,
  geht ein Intervall von 4 nie auf, und kein einziger Blütetag ist mehr Gießtag. Der
  Rhythmus-Motor selbst wurde bewusst nicht angefasst — das wäre ein Umbau, kein Fehlerfix.

- **Kein „undefined" mehr in den Einstellungen.** `planHasSkeleton()` prüft `weekPhases`,
  der Text darunter las aber `phaseSkeleton` — bei BioBizz Official stand deshalb
  „Anzucht undefined · Spülen undefined · IceFlush undefined · Ernte undefined Tage".
  Die Zeile entfällt jetzt, wenn der Plan kein Phasen-Gerüst mitbringt; Plan, Sorte und
  Erntefenster stehen ohnehin darüber. `planHasSkeleton()` selbst blieb unverändert, weil
  sie die Rückgrat-Logik in `fertPlanWeek` steuert — dort wäre eine Änderung riskant.

- Neu: `test_fixes_0905.js` — 38 Prüfungen, die jeden der drei Fälle erst herstellen und
  dann belegen. Alle 21 Testdateien laufen grün in `Europe/Berlin` und
  `Pacific/Kiritimati`.

## 2026-09-05

- **Drei bestätigte Fehler in UEBERGABE.md aufgenommen** (neuer Abschnitt 2, bisherige
  Abschnitte 2–7 auf 3–8 hochgezählt). Pflanzen-Zähler löscht Erntedaten ohne Rückfrage,
  Endspurt-Karte verschwindet bei geändertem Gießintervall, vier „undefined" in den
  Einstellungen. Grund: Am 05.09.2026 an der laufenden App reproduziert und zurückgestellt —
  im Gedächtnis allein wären sie beim nächsten Rechner oder Startordner verloren.

- **CLAUDE.md und CHANGELOG.md angelegt.** Bindet `ANWEISUNG.md`, `UEBERGABE.md` und
  `START-HIER.md` per @-Import ein, damit die Projektregeln bei jedem Sitzungsstart
  automatisch geladen werden, und legt fest, was am Ende jeder Sitzung festgehalten
  wird. Grund: Sitzungskontext ging bisher zwischen zwei Sitzungen verloren.
