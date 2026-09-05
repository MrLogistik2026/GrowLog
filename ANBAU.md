# Biophysikalische Grundlagen für GrowSmart

Diese Datei ist das Fachwissen hinter der App. Sie wird bei jedem Sitzungsstart geladen.

**Wozu sie da ist:** Jede Zahl in GrowSmart — jede Gießmenge, jeder EC-Zielwert, jede Warnung
— muss sich auf einen Mechanismus zurückführen lassen. Wer hier etwas über Pflanzen entscheidet
oder einen Text schreibt, argumentiert aus diesen Grundlagen heraus, statt eine Zahl zu schätzen
oder aus dem Gedächtnis zu übernehmen.

**Wie sie zu lesen ist:** Zahlen stehen hier mit ihrer Begründung. Wo die Begründung fehlt, fehlt
sie mit Absicht — dann ist der Wert eine Konvention und keine Naturkonstante, und das steht dann
auch da. Abschnitt 14 sammelt, was in der Grower-Praxis verbreitet, aber **nicht belegt** ist.
Diesen Abschnitt zuerst lesen, bevor eine neue Automatik gebaut wird.

**Grenzen:** Das hier ist angewandte Pflanzenphysiologie, keine Publikationsliste. Die
Mechanismen sind gesichert. Die Zahlenkorridore stammen aus Anbaupraxis und Fachliteratur und
variieren mit Genetik, Substrat und Anlage — sie sind Startpunkte, keine Wahrheiten. Wo Patricks
eigene Messung einem Korridor widerspricht, gewinnt seine Messung.

**Drei Regeln für jede Regel in diesem Dokument:**

1. **Jede Schwelle braucht eine Gültigkeitsbedingung.** Eine Zahl ohne Angabe, unter welchen
   Umständen sie gilt, produziert Fehlalarme, sobald die Umstände abweichen. Der häufigste
   Fall: eine Regel für inerte Substrate wird auf organische angewandt.
2. **Jeder Messwert braucht eine Validitätsprüfung.** Bevor ein Wert interpretiert wird, muss
   feststehen, dass er überhaupt misst, was er messen soll. Ein Drain-EC bei 5 % Durchfluss ist
   keine schlechte Messung, sondern gar keine.
3. **Ein Symptom hat selten eine Ursache.** Schlaffe Blätter bedeuten Trockenheit, Überwässerung
   oder osmotischen Entzug. Die App darf nie aus einem Symptom auf eine Ursache schließen, ohne
   die konkurrierenden Erklärungen ausgeschlossen zu haben.

---

## 1 · Wasser: warum die Pflanze überhaupt trinkt

Eine Pflanze verdunstet weit mehr Wasser, als sie chemisch verbraucht. Über 95 % des
aufgenommenen Wassers geht durch die Spaltöffnungen (Stomata) der Blätter wieder in die Luft.
Das ist kein Verlust, sondern der Motor: Der beim Verdunsten entstehende Sog
(Transpirationssog) zieht Wasser mitsamt gelösten Nährsalzen von der Wurzel nach oben. Der
Transport läuft im Xylem, passiv, ohne Energieaufwand der Pflanze.

**Daraus folgt unmittelbar:** Verdunstet die Pflanze nicht, nimmt sie auch keine Nährstoffe auf.
Nährstoffmangel bei voller Düngung ist deshalb oft kein Düngeproblem, sondern ein Klimaproblem.

**Calcium ist der Extremfall** und der wichtigste Einzelbefund dieses Abschnitts. Ca²⁺ wird
ausschließlich im Xylem transportiert, also ausschließlich mit dem Transpirationsstrom, und ist
im Phloem praktisch immobil — die Pflanze kann es nach dem Einbau nicht umverteilen. Zwei
Konsequenzen:

- Ein Ca-Mangel zeigt sich immer zuerst an den **jüngsten** Geweben.
- Organe mit geringer Eigentranspiration — junge Blätter im Bestandsinneren, Blütenknoten —
  bekommen strukturell weniger Calcium, selbst bei perfekter Versorgung im Substrat. Deshalb
  treten Ca-Symptome bevorzugt bei niedrigem VPD und stehender Luft im Canopy auf, nicht bei
  niedriger Ca-Zufuhr.

**Wie viel Wasser die Pflanze bewegt**, hängt an drei Größen: Blattfläche, Sättigungsdefizit der
Luft (VPD, Abschnitt 2) und Wurzelmasse. Alle drei wachsen über den Zyklus — deshalb steigt der
Bedarf, und deshalb ist eine feste Gießmenge über den ganzen Grow falsch.

**Warum Überwässerung tötet:** Nicht das Wasser schadet, sondern die verdrängte Luft. Wurzeln
veratmen Sauerstoff; sie brauchen ihn im Porenraum. Steht das Substrat dauerhaft nass, kippt die
Wurzelzone ins Anaerobe, die Wurzelspitzen sterben ab, und Oomyceten wie *Pythium* finden ideale
Bedingungen. Das Bild an der Pflanze — schlaffe, hängende Blätter — entsteht, weil abgestorbene
Wurzelspitzen kein Wasser mehr aufnehmen. Es sieht dem Wassermangel deshalb nicht zufällig
ähnlich, sondern **ist** funktionell Wassermangel, nur mit umgekehrter Ursache.

**Der Nass-Trocken-Zyklus** ist deshalb kein Kompromiss, sondern erwünscht. Beim Abtrocknen zieht
Luft in den Porenraum nach. Wurzeln wachsen bevorzugt dorthin, wo Wasser war und Sauerstoff ist.
Ein Topf, der zwischen den Güssen nie leichter wird, erzieht ein flaches, schwaches Wurzelsystem
— und begrenzt damit die Endgröße der Pflanze (Abschnitt 7.4).

**Warum der Hebe-Test allen anderen Verfahren überlegen ist:** Er integriert über das gesamte
Topfvolumen. Ein Feuchtigkeitssensor misst einen Punkt, ein Finger die obersten Zentimeter — in
einem Stofftopf mit Randabtrocknung sind beide systematisch falsch. Das Gewicht ist die einzige
Größe, die den tatsächlichen Wasservorrat abbildet.

---

## 2 · VPD: das Sättigungsdefizit, und warum es am Blatt gilt

VPD (Vapour Pressure Deficit) ist die Differenz zwischen dem Wasserdampfdruck, den die Luft bei
Sättigung tragen könnte, und dem, den sie tatsächlich trägt. Es ist das physikalische Maß für
„wie stark zieht die Luft Wasser aus dem Blatt".

**Sättigungsdampfdruck (Magnus-Gleichung), in kPa:**

```
SVP(T) = 0,6108 · e^( 17,27·T / (T + 237,3) )
```

**Blatt-VPD:**

```
VPD_Blatt = SVP(T_Blatt) − [ SVP(T_Luft) · RH/100 ]
```

Der Klammerterm ist der tatsächliche Dampfdruck der Luft (AVP). Er wird aus der **Luft**temperatur
gebildet, der Sättigungsterm aus der **Blatt**temperatur. Diese Asymmetrie ist der ganze Punkt.

**Warum die Blatttemperatur:** Die Verdunstung findet an der Blattoberfläche statt. Das Blatt ist
durch Verdunstungskälte kühler als die umgebende Luft — unter LED typisch 1–3 K, unter
Hochdruckdampflampen wegen der Strahlungswärme weniger oder gar nicht. **Weil das kühlere Blatt
einen niedrigeren Sättigungsdampfdruck hat, ist das reale VPD am Blatt niedriger als das der
Raumluft.** Wer gegen den Luftwert regelt, hält die Pflanze systematisch zu feucht.

Rechenbeispiel, 25 °C Luft, 55 % RH, Blattoffset 2 K:

```
SVP(25 °C) = 3,17 kPa        AVP = 3,17 · 0,55 = 1,74 kPa
VPD_Luft   = 3,17 − 1,74     = 1,43 kPa
SVP(23 °C) = 2,81 kPa
VPD_Blatt  = 2,81 − 1,74     = 1,07 kPa
```

Differenz 0,36 kPa — bei einem Zielkorridor von 0,3 kPa Breite entscheidet der Offset also
darüber, ob man im Ziel liegt oder eine Phase daneben.

In GrowSmart: `_svp`, `calcVPD`, `_leafOffset` (Standard 2 K, einstellbar 0–5).

### 2.1 Der Blattoffset ist keine Konstante

Das ist die wichtigste Einschränkung des Modells und der Grund, warum `_leafOffset` einstellbar
sein muss statt fest verdrahtet.

Der Offset entsteht durch Verdunstungskälte. Er hängt also davon ab, **wie stark die Pflanze
gerade transpiriert**:

| Situation | Blatt gegenüber Luft |
|---|---|
| Kräftige Transpiration, gute Wasserversorgung, Luftbewegung | 2–3 K kühler |
| Geringe Transpiration (Sämling, niedriges VPD) | 0–1 K kühler |
| **Stomata geschlossen** (Trockenstress, osmotischer Entzug, sehr hohes VPD) | **wärmer als die Luft** |
| Direkte Strahlung ohne Luftbewegung | wärmer als die Luft |

**Daraus folgt ein unangenehmer Zirkelschluss:** Genau dann, wenn die Pflanze im Stress ist und
die Stomata schließt, kehrt sich der Offset um. Ein fester 2-K-Abzug rechnet das VPD dann zu
niedrig und die App meldet Entwarnung, während die Photosynthese bereits steht.

**Konsequenz für die App:** Der berechnete Blatt-VPD ist ein Modellwert, kein Messwert. Sobald
Symptome und VPD-Anzeige auseinanderlaufen, gewinnen die Symptome. Wo verfügbar, ist ein
Infrarot-Thermometer am Blatt die bessere Datenquelle als jede Rechnung.

### 2.2 Zielkorridore

Konvention aus der Praxis, keine Naturkonstante.

| Phase | VPD am Blatt | Warum |
|---|---|---|
| Sämling / Steckling | 0,4–0,8 kPa | Kaum Wurzeln, kann Verlust nicht ersetzen |
| Wachstum | 0,8–1,2 kPa | Kräftige Transpiration, schneller Nährstofftransport |
| Frühe/mittlere Blüte | 1,2–1,5 kPa | Hoher Bedarf bei noch weichem Gewebe |
| Späte Blüte | 1,4–1,6 kPa | Trockener gegen Schimmel in dichten Blüten |

**Zu niedriges VPD:** Die Pflanze verdunstet kaum, der Massenstrom stockt, immobile Nährstoffe
(Ca, B) kommen nicht an. Zusätzlich bleibt die Blattoberfläche lange feucht — die
Eintrittsbedingung für Pilze.

**VPD ≤ 0 ist eine eigene Kategorie:** Die Luft ist am kühleren Blatt bereits gesättigt, es
**kondensiert Wasser auf dem Blatt**. In der Blüte bedeutet stehende Nässe auf dichten Blüten
*Botrytis cinerea* innerhalb von Stunden. Das ist kein „etwas zu feucht"; die App behandelt es
seit v1.5.101 als eigene Warnstufe.

**Zu hohes VPD:** Die Pflanze schließt die Stomata, um Wasser zu halten. Damit stoppt auch die
CO₂-Aufnahme — die Photosynthese kommt zum Erliegen. Die Pflanze steht im Licht und wächst
trotzdem nicht. Zusätzlich fällt der Transpirationsstrom weg, was wiederum den Ca-Transport
unterbricht.

### 2.3 Was VPD nicht leistet

VPD beschreibt das Antriebsgefälle, nicht den tatsächlichen Fluss. Der Fluss hängt zusätzlich am
**Grenzschichtwiderstand** — der ruhenden Luftschicht direkt über dem Blatt. Ohne Luftbewegung
sättigt sich diese Schicht auf und die Transpiration bricht ein, obwohl die Raumwerte perfekt
aussehen.

**Praktische Folge:** Perfektes VPD ohne Luftbewegung im Canopy ist wirkungslos. Das ist der
Grund, warum Umluft kein Komfortmerkmal ist, sondern Teil der Klimaregelung. Und es ist der
Grund, warum Kalkulationen für ein Zelt mit sechs dichten Pflanzen anders ausfallen als für
dasselbe Zelt mit vier lockeren.

---

## 3 · Wasserqualität: Härte, Alkalinität und warum der Roh-pH fast nichts sagt

Dieser Abschnitt fehlte in der Vorversion und ist die Ursache der meisten unerklärlichen
pH-Drifts.

**Der pH des Leitungswassers ist nahezu bedeutungslos.** Er sagt, wo das Wasser gerade steht,
nicht, wie stark es sich gegen Veränderung wehrt. Entscheidend ist die **Alkalinität**
(Karbonathärte, KH) — der Gehalt an Hydrogencarbonat und Carbonat. Sie ist die
Säurepufferkapazität.

- **Wasser mit hoher Alkalinität** braucht viel Säure zum Absenken und driftet danach zügig
  wieder nach oben. Der pH im Topf steigt zwischen den Güssen.
- **Wasser mit niedriger Alkalinität** lässt sich mit wenig Säure einstellen und bleibt dort. Es
  hat aber auch kaum Eigenpufferung — Fehler in beide Richtungen schlagen schneller durch.

**Umrechnung:** 1 °dH ≈ 17,8 mg/L CaCO₃ ≈ 0,357 mmol/L. Ein Wasser mit 4,5 °dH entspricht rund
80 mg/L CaCO₃ und liegt damit im weichen bis mittleren Bereich.

**Gesamthärte ≠ Karbonathärte.** Die Gesamthärte zählt Ca²⁺ und Mg²⁺, die Karbonathärte den
zugehörigen Hydrogencarbonat-Anteil. Für die Pufferung zählt die Karbonathärte, für die
Nährstoffversorgung die Gesamthärte. Wasseranalysen nennen oft nur eine der beiden.

**Konsequenzen für weiches Wasser** (Patricks Fall: EC 0,22 mS/cm, 4,5 °dH, pH 8,1):

1. Der hohe Roh-pH ist unkritisch, weil die Pufferkapazität gering ist. Wenige Tropfen Säure
   reichen.
2. Ca und Mg sind knapp. Cal/Mag ist nicht optional, sondern Grundversorgung — unabhängig vom
   Substrat.
3. Der Eigen-EC von 0,22 mS/cm gehört bei jeder Rezeptur abgezogen. Wer eine Ziel-EC von 1,2
   anmischt, gibt real 0,98 mS/cm an Dünger dazu.
4. Weiches Wasser kann den Kalkpuffer eines gekalkten Substrats **nicht** überwinden (Abschnitt
   7.2). Ein hoher Drain-pH ist dann normal und kein Fehler des Growers.

**Regel für die App:** Ohne bekannte Alkalinität darf keine Aussage über pH-Stabilität getroffen
werden. Wo nur der Roh-pH vorliegt, ist die richtige Meldung „Pufferkapazität unbekannt", nicht
eine Empfehlung.

---

## 4 · pH: Verfügbarkeit, nicht Menge

Der pH der Wurzelzone bestimmt, in welcher chemischen Form ein Nährstoff vorliegt — und nur
bestimmte Formen kann die Wurzel aufnehmen. Ein Nährstoff kann reichlich vorhanden und trotzdem
unverfügbar sein („Lockout").

**Zielbereiche am Zulauf:**

| Substrat | pH | Warum |
|---|---|---|
| Erde / Torf, gekalkt | 6,0–6,5 | Beste Gesamtverfügbarkeit; Bodenleben arbeitet hier |
| Coco / Hydro | 5,5–6,0 | Inertes Substrat ohne Puffer, direkte Ionenaufnahme |

**Nie unter 6,0 in organischen Substraten.** Nicht wegen der Nährstoffchemie — dort wäre 5,8 noch
tolerabel — sondern weil Nitrifikanten und die übrige Mikroflora bei niedrigem pH in der
Aktivität einbrechen. In einem organischen System, das auf mikrobielle Mineralisierung
angewiesen ist, schaltet man damit die Nährstofffreisetzung ab.

**Was bei Abweichung passiert:**

- **Zu niedrig (< 5,5 in Erde):** Mangan und Aluminium werden mobil und wirken toxisch; Calcium
  und Magnesium werden schlechter verfügbar; die Mikroflora bricht ein.
- **Zu hoch (> 6,8):** Eisen, Mangan, Zink und Bor gehen in schwerlösliche Formen über.
  Klassisches Bild: Eisenchlorose — hellgelbe **junge** Blätter bei zunächst grün bleibenden
  Blattadern.

### 4.1 Der Drain-pH ist nicht der Zulauf-pH — und muss es auch nicht sein

Dies ist der wichtigste Zusatz gegenüber der Vorversion. Die pauschale Regel „Drain über 6,8 =
Lockout" ist in organischen Substraten falsch und erzeugt systematische Fehlalarme.

**Mechanismus:** Torfsubstrate werden ab Werk mit Dolomitkalk (CaMg(CO₃)₂) auf pH 5,5–6,5
angehoben; Rohtorf liegt bei 3,5–4,5. Dieser Carbonatpuffer reagiert mit der zugeführten Säure
und hebt den Zulauf-pH im Substrat wieder an. Ein Drain-pH von 6,8–7,2 bei einem Zulauf von
6,2–6,4 ist deshalb **das erwartete Gleichgewicht**, nicht eine Störung.

| Substrat | Drain-pH normal | Bewertung |
|---|---|---|
| Gekalkter Torf (Light-Mix u. ä.) | 6,8–7,2 | Kalkpuffer, unauffällig |
| Coco, gepuffert | 5,8–6,3 | Nahe am Zulauf |
| Hydro / inert | ±0,2 zum Zulauf | Abweichung ist ein Signal |

**Wann ein hoher Drain-pH doch ein Befund ist:**

- Er **steigt über Wochen weiter** statt stabil zu bleiben
- Er tritt **zusammen mit Fe/Mn-Chlorose an jungen Blättern** auf
- Er tritt in einem **inerten Substrat** auf, wo es keinen Puffer gibt
- Er geht mit **fehlendem oder minimalem Drain** einher — dann misst man nicht das
  Gleichgewicht der Wurzelzone, sondern eine Randfraktion

**Was man nicht tun soll:** Den Zulauf-pH immer weiter absenken, um den Drain nach unten zu
zwingen. Bei weichem Wasser gelingt das ohnehin nicht, und man beschädigt die Mikroflora. Der
Kalkpuffer ist ein Substratmerkmal, kein Regelfehler.

**Chelatoren entkoppeln das teilweise.** Huminstoffe und synthetische Chelate (EDTA, DTPA,
EDDHA) halten Eisen auch oberhalb von pH 6,8 in Lösung. In einem organischen System mit
Huminstoffgabe ist ein Drain-pH von 6,8 deshalb deutlich weniger kritisch als dieselbe Zahl in
einem ungepufferten Mineralsystem. DTPA trägt bis etwa pH 7,5, EDDHA darüber hinaus, EDTA
verliert bereits ab 6,5 an Wirkung.

---

## 5 · EC: gelöste Salze, osmotischer Druck und die Interpretation des Ablaufs

EC (elektrische Leitfähigkeit) misst die Gesamtkonzentration gelöster Ionen — **nicht**, ob die
richtigen darin sind. Zwei Lösungen mit identischem EC können völlig verschieden zusammengesetzt
sein. EC ist eine Mengen-, keine Qualitätsangabe. Sie erfasst außerdem nur geladene Teilchen:
Harnstoff, Zucker und ungeladene organische Verbindungen sind unsichtbar.

**Einheiten sauber halten.** 1 mS/cm = 1000 µS/cm. Die Umrechnung in ppm ist herstellerabhängig
und eine verbreitete Fehlerquelle:

| Skala | Faktor | 1,0 mS/cm entspricht |
|---|---|---|
| NaCl („500er") | ×500 | 500 ppm |
| 442 | ×640 | 640 ppm |
| KCl („700er") | ×700 | 700 ppm |

**Regel für die App:** Intern ausschließlich mS/cm oder µS/cm führen. ppm nur bei der Ausgabe und
nur mit Skalenangabe. Ein ppm-Wert ohne Skala ist keine Information.

**Temperaturkompensation:** EC steigt um rund 2 % pro Kelvin. Ein Messgerät ohne ATC liefert bei
30 °C etwa 10 % zu hohe Werte gegenüber der 25-°C-Referenz.

**Warum Überdüngung schadet:** Wasser folgt dem osmotischen Gefälle. Ist die Salzkonzentration in
der Wurzelzone höher als im Wurzelgewebe, kehrt sich der Fluss um — die Pflanze **verliert**
Wasser an das Substrat. Das Schadbild ist deshalb identisch mit Trockenheit: verbrannte,
eingerollte Blattspitzen, welke Pflanze im nassen Topf. Der Anfängerreflex „sieht durstig aus,
also mehr gießen" verschlimmert es, wenn mit derselben Lösung nachgegossen wird.

**Typischer Verlauf** (Konvention; Genetik und Substrat verschieben ihn):

| Phase | EC (mS/cm) | Warum |
|---|---|---|
| Sämling | 0,4–0,6 | Kaum Wurzeln, hohe Empfindlichkeit |
| Wachstum | 0,7–1,2 | Stickstoffbetont, Blattmasse aufbauen |
| Stretch / früher Blütenansatz | 1,0–1,4 | Umstellung, hoher Gesamtbedarf |
| Blütenaufbau | 1,4–1,9 | Höchster Bedarf, P/K-betont |
| Späte Reifung | 0,8–1,2 | Bedarf sinkt, Stickstoff bewusst zurück |
| Spülen | 0,2–0,4 | Nur noch Wasser |

**Warum Stickstoff spät zurückgefahren wird:** Reichlich Stickstoff hält die Pflanze im
vegetativen Modus — die Blüten bleiben locker und blattreich, und Reststickstoff im
Pflanzenmaterial verbrennt später scharf. Das ist der Grund für die Absenkung, nicht ein
Ertragstrick. Ein **verfrühter** N-Stop ist der teurere Fehler: Die Pflanze baut bis zuletzt
Blütenmasse auf und braucht dafür Stickstoff.

### 5.1 Drain-EC richtig lesen

Der Drain-EC ist aussagekräftiger als der Zulauf-EC, weil er die Wurzelzone abbildet statt die
Absicht des Growers. Er ist aber nur unter Bedingungen gültig.

**Validitätsprüfung zuerst — vor jeder Interpretation:**

| Durchfluss | Aussagekraft |
|---|---|
| < 10 % | keine. Randfraktion, systematisch überhöht |
| 10–15 % | schwach, tendenziell überhöht |
| 15–25 % | gültig, Standardfenster |
| > 30 % | gültig, aber bereits teilweise auswaschend |

Ein Drain-EC bei 5 % Durchfluss ist kein schlechter Messwert, sondern gar keiner. Die App darf
darauf keine Warnung stützen.

**Verhältnis Drain zu Zulauf:**

| Verhältnis | Bedeutung |
|---|---|
| < 1,0 | Pflanze nimmt Salz schneller auf als Wasser — unterversorgt |
| 1,0–1,3 | Aufnahme und Zufuhr im Gleichgewicht |
| 1,3–1,6 | leichter Überschuss, normal in der Vollversorgung |
| > 1,6 | Anreicherung — Zufuhr senken oder Durchfluss erhöhen |

**Die entscheidende Ausnahme — organische Substrate in der Spätblüte:**

Ein steigender Drain-EC ab etwa der Mitte der Blüte bedeutet in organischen Substraten **nicht
automatisch** Anreicherung durch Überdüngung. Zwei Prozesse laufen gegenläufig zur Interpretation:

1. **Mineralisierung.** Organisch gebundene Nährstoffe werden mikrobiell weiter aufgeschlossen
   und gehen in Lösung. Das Substrat liefert nach, ohne dass der Grower etwas dazugibt.
2. **Sinkende Aufnahme.** In der Seneszenz fährt die Pflanze die Nährstoffaufnahme zurück,
   während die Transpiration noch läuft. Was zugeführt wird, bleibt zunehmend im Substrat.

**Differenzialdiagnose:**

| Befund | Anreicherung | Mineralisierung / Seneszenz |
|---|---|---|
| Durchfluss | oft < 15 % | konstant ≥ 20 % |
| Verlauf | steigt seit Wochen | steigt erst spät im Zyklus |
| Symptome | Spitzenbrand, eingerollte Blätter | keine, außer normaler Vergilbung von unten |
| Vergilbung | fleckig, uneinheitlich | gleichmäßig, von unten nach oben |
| Reaktion auf Spülen | EC fällt und bleibt unten | EC fällt und steigt wieder an |

Ohne diese Unterscheidung meldet die App bei jedem organischen Grow ab Blütewoche 5 einen Fehler,
den es nicht gibt.

---

## 6 · Nährstoffe: Mobilität, Antagonismen, Diagnose

Dieser Abschnitt fehlte in der Vorversion vollständig. Er ist die Grundlage jeder Bilddiagnose.

### 6.1 Mobilität entscheidet, wo das Symptom auftaucht

Ein Nährstoff, den die Pflanze im Phloem verlagern kann, wird bei Mangel aus alten Geweben in
junge umgeleitet. Das Symptom erscheint dann dort, wo der Nährstoff abgezogen wurde — an den
**alten** Blättern. Immobile Nährstoffe können nicht umgeleitet werden; ihr Mangel erscheint an
den **jungen** Blättern.

| Mobilität | Nährstoffe | Symptom zuerst an |
|---|---|---|
| Mobil | N, P, K, Mg, Mo | alten, unteren Blättern |
| Teilmobil | S, Cl, Zn | mittlerer Etage, uneindeutig |
| Immobil | **Ca, B, Fe, Mn, Cu** | jungen, oberen Blättern und Triebspitzen |

**Diagnostische Erstfrage lautet deshalb immer: oben oder unten?** Sie halbiert den Suchraum,
bevor eine Farbe interpretiert wird. Gelbe untere Blätter sind nie ein Ca- oder Fe-Mangel; gelbe
obere Blätter sind nie ein einfacher N-Mangel.

**Wichtige Einschränkung:** In der Seneszenz zieht die Pflanze mobile Nährstoffe planmäßig aus
den unteren Blättern ab. Vergilbung von unten ist in der Spätblüte deshalb der Normalfall, nicht
ein Mangel. Unterscheidung siehe 6.4.

### 6.2 Antagonismen: warum mehr geben das Problem verschlimmert

Kationen konkurrieren an denselben Aufnahmestellen der Wurzel. Ein Überschuss eines Ions
verdrängt andere, ohne dass deren Konzentration im Substrat sinkt. Das erzeugt Mangelbilder bei
rechnerisch ausreichender Versorgung — und verleitet zum Nachdüngen genau des Stoffes, der das
Problem verursacht hat.

| Überschuss | verdrängt | typisches Bild |
|---|---|---|
| **K⁺** | Mg²⁺, Ca²⁺ | Mg-Mangel in der Blüte trotz Mg-Gabe |
| **Ca²⁺** | Mg²⁺, K⁺ | Interveinale Chlorose, sinkende Blütenqualität |
| **Mg²⁺** | Ca²⁺, K⁺ | selten, meist bei Epsom-Überdosis |
| **NH₄⁺** | Ca²⁺, Mg²⁺, K⁺ | Ca-Mangel, Blattverformung, pH-Absenkung |
| **P** (hoch) | Zn, Fe | Zn-Mangel, gestauchte Internodien |
| **Fe** (hoch) | Mn | Mn-Mangel, gescheckte junge Blätter |

**Der praxisrelevanteste Fall ist K/Mg in der Blüte.** Blütedünger sind kaliumbetont. Wer
zusätzlich einen K-Booster wie Monokaliumphosphat fährt, hebt das K/Mg-Verhältnis weiter an und
provoziert Mg-Mangel genau in der Phase, in der die Pflanze am meisten davon braucht.

**Regel:** Ein K-Booster wird nur eingesetzt, wenn die Mg-Versorgung über den gesamten
bisherigen Verlauf stabil war. Bei vorangegangenen Mg-Symptomen bleibt er draußen. Ein
zusätzliches Mg gleichzeitig zu geben ist kein sauberer Ersatz — es verschiebt das Verhältnis
erneut.

**Ammonium versus Nitrat:** NH₄⁺-Aufnahme setzt H⁺ frei und senkt den pH in der Rhizosphäre;
NO₃⁻-Aufnahme wirkt umgekehrt. Ein hoher Ammoniumanteil erklärt pH-Abfall im Topf ohne
Zutun des Growers, und er ist ein eigenständiger Ca-Antagonist. Organische Dünger liefern
Stickstoff überwiegend nach mikrobieller Umsetzung als Nitrat — der Effekt ist dort schwächer als
in Mineralsystemen.

### 6.3 Was EC über all das nicht sagt

Keiner der Antagonismen in 6.2 ist am EC erkennbar. Eine Lösung mit korrektem EC und ruiniertem
K/Mg-Verhältnis misst sich unauffällig. Das ist der Grund, warum EC-Steuerung allein nicht
ausreicht und Symptome am Blatt die höhere Instanz bleiben.

### 6.4 Seneszenz von Mangel unterscheiden

| Merkmal | Seneszenz (normal) | Echter Mangel |
|---|---|---|
| Zeitpunkt | letztes Drittel des Zyklus | jederzeit |
| Verlauf | langsam, gleichmäßig, streng von unten nach oben | schneller, oft fleckig oder etagenweise |
| Blütenentwicklung | läuft weiter, Kelche schwellen | stagniert |
| Drain-EC | fällt allmählich von selbst | uneinheitlich |
| Reaktion auf Nachdüngen | keine | Stillstand oder Besserung |

Seneszenz ist erwünscht: Die Pflanze verlagert Stickstoff aus den Blättern in die Blüten. Wer
dagegen andüngt, verlängert den Zyklus ohne Qualitätsgewinn.

---

## 7 · Substrat: Puffer, Sauerstoff, Volumen

### 7.1 Kationenaustauschkapazität

Erde und Torf haben eine Kationenaustauschkapazität (KAK): Tonminerale und Humus binden Nährionen
elektrostatisch und geben sie nach und nach ab. Das ist ein chemischer Puffer, der Fehler
abfedert. Torf liegt grob bei 100–200 cmol/kg, Coco deutlich darunter.

**Daraus folgt: In Coco wird häufiger, schwächer und mit engerer pH-Kontrolle gedüngt.** Der
Puffer, der einen Fehler abfängt, fehlt dort.

**Coco hat zusätzlich eine eigene Chemie.** Es bindet Calcium und Kalium bevorzugt und gibt dafür
Natrium und Kalium ab. Ungepuffertes Coco entzieht der Lösung deshalb aktiv Calcium — Cal/Mag ist
dort keine Ergänzung, sondern Grundbedarf. Vorgepuffertes Coco ist mit Ca vorbeladen und
verhält sich anfangs neutraler.

### 7.2 Der Kalkpuffer gekalkter Torfsubstrate

Siehe 4.1. Kurzfassung: Der eingemischte Dolomitkalk ist eine Carbonat-Reserve, die auf
Säurezufuhr reagiert und den pH nach oben zieht. Sie ist über einen Grow nicht erschöpfbar und
mit weichem Wasser nicht überwindbar. Ein erhöhter Drain-pH ist in diesen Substraten ein
Substratmerkmal.

### 7.3 Sauerstoff und Wurzelzonentemperatur

Der gelöste Sauerstoff im Porenwasser ist temperaturabhängig: rund 9 mg/L bei 20 °C, rund
7,5 mg/L bei 30 °C. Gleichzeitig steigt die Atmungsrate der Wurzeln und der Mikroben mit der
Temperatur. Warme Wurzelzonen sind deshalb doppelt benachteiligt — weniger Angebot bei höherem
Verbrauch.

| Wurzelzonentemperatur | Wirkung |
|---|---|
| < 16 °C | Phosphor- und Wasseraufnahme brechen ein, Wachstum stockt |
| 18–24 °C | Optimum |
| > 26 °C | O₂-Mangel, *Pythium*-Druck steigt deutlich |

**Gießwassertemperatur ist Teil davon.** Wasser mit 12 °C aus der Leitung kühlt die Wurzelzone
für Stunden unter das Optimum. 20–22 °C ist die richtige Zielgröße, nicht Bequemlichkeit.

**Stofftöpfe** verdunsten über die Mantelfläche und kühlen sich dadurch — im Sommer ein Vorteil,
bei kühler Umgebungsluft ein Nachteil. Sie trocknen zudem von außen nach innen, was den
Hebe-Test aufwertet und punktuelle Feuchtemessung entwertet.

### 7.4 Substratvolumen als Ertragsgrenze

Fehlte in der Vorversion und ist bei Automatics der größte einzelne Hebel.

Das durchwurzelbare Volumen begrenzt drei Dinge gleichzeitig: die erreichbare Wurzelmasse, den
Wasser- und Nährstoffpuffer zwischen zwei Güssen, und damit die Blattfläche, die die Pflanze
versorgen kann. Bei begrenztem Volumen entsteht kein Mangel im klassischen Sinn — die Pflanze
bleibt einfach kleiner.

**Bei photoperiodischen Sorten ist das teilweise kompensierbar:** Man vegetiert länger, gießt
häufiger, gleicht aus. **Bei Automatics nicht.** Die Blüte startet altersabhängig. Was das
Wurzelsystem bis zum Blühbeginn nicht aufgebaut hat, fehlt für den Rest des Zyklus dauerhaft.

**Konsequenzen:**

- Direkt in den Endtopf säen. Jeder Umtopfvorgang kostet Tage in einem Fenster, das nicht
  verlängerbar ist.
- Das Volumen wird durch die **tatsächliche Füllung** bestimmt, nicht durch die Nennliterzahl.
  Ein bis zur Kante gefüllter 11-L-Stofftopf ist ein anderes System als derselbe Topf, aufgehäuft
  auf 14–16 L.
- Ein zu großer Topf beim Sämling ist der entgegengesetzte Fehler: ungenutztes Substrat trocknet
  nie ab und wird zur anaeroben Zone.

**Regel für die App:** Wo Ertragserwartungen ausgegeben werden, ist das Substratvolumen eine
Eingangsgröße. Züchterangaben in g/m² setzen unbegrenzte Wurzelraumverhältnisse voraus.

---

## 8 · Licht: Menge, Sättigung und zwei verschiedene Schadmechanismen

Entscheidend ist die **Tageslichtsumme** (DLI, Daily Light Integral) in mol/m²/Tag — Intensität
mal Zeit. Dieselbe Lichtmenge lässt sich mit wenig Licht über lange Zeit oder viel Licht über
kurze Zeit liefern.

```
DLI = PPFD (µmol/m²/s) × Lichtstunden × 3600 / 1.000.000
```

| Phase | PPFD (µmol/m²/s) | grober DLI bei 18 h |
|---|---|---|
| Sämling | 150–300 | 10–20 |
| Wachstum | 400–600 | 26–39 |
| Blüte | 600–900 | 39–58 |

**PPFD gilt am Canopy, nicht an der Lampe.** Herstellerangaben beziehen sich meist auf einen
Mittelwert in definiertem Abstand. Die Randbereiche eines Zelts liegen typisch 30–50 % darunter.
Wo keine Messung vorliegt, ist jede PPFD-Angabe eine Schätzung und muss so ausgewiesen werden.

**Photonen-Effizienz (µmol/J)** beschreibt, wie viel PAR-Licht pro Watt entsteht. Sie bestimmt
den Stromverbrauch, nicht die Pflanzenreaktion — für die Pflanze zählt allein die ankommende
Photonenmenge.

### 8.1 Wo die Sättigung wirklich liegt

Die Vorversion nannte 900–1000 µmol/m²/s als CO₂-limitierte Obergrenze. Diese Zahl stammt aus der
**Blattebene** und ist dort korrekt: Ein einzelnes Blatt sättigt bei Umgebungs-CO₂ tatsächlich in
diesem Bereich.

**Der Bestand verhält sich anders.** Kontrollierte Versuche an Cannabis (Guelph) fanden über
einen weiten Bereich einen näherungsweise linearen Anstieg des Blütenertrags mit steigender
PPFD, weit über die Sättigungsgrenze des Einzelblatts hinaus — in der Größenordnung bis rund
1800 µmol/m²/s unter Umgebungs-CO₂.

**Mechanismus:** Die oberen Blätter sättigen, aber zusätzliches Licht dringt tiefer in den
Bestand ein und aktiviert vorher unterversorgte Etagen. Der Bestand als Ganzes sättigt deshalb
viel später als das Einzelblatt.

**Praktische Folge:** In typischen Hobbyanlagen ist Licht fast immer der limitierende Faktor, und
die Sättigungsdiskussion ist akademisch. Eine Warnung „zu viel Licht" ab 900 µmol/m²/s wäre
falsch. Relevant wird die Grenze erst mit CO₂-Anreicherung und Anlagen jenseits typischer
Hobbyleistung.

**Cannabinoidgehalt folgt dem Ertrag nicht.** Dieselben Versuche fanden bei steigender PPFD
höhere Erträge, aber weitgehend konstante Cannabinoidkonzentrationen. Mehr Licht bringt mehr
Blüte, nicht potentere Blüte.

### 8.2 Zwei verschiedene Lichtschäden

Die Vorversion fasste beides als Wärmeproblem zusammen. Das ist für HPS richtig und für LED
unvollständig.

| | Thermischer Lichtstress | Photobleaching |
|---|---|---|
| Ursache | Strahlungswärme, VPD-Spitze am Blatt | Photonenüberschuss im Photosystem |
| Typisch bei | HPS, LED zu nah bei schlechter Umluft | sehr hoher PPFD, praktisch ab ~1500 µmol/m²/s |
| Bild | Gelbe bis braune Ränder, Aufwölbung, Taco | **Weiß ausgebleichte** obere Blüten, scharf begrenzt |
| Gradient | Wärmegradient nachweisbar | kein Wärmegradient nötig |
| Maßnahme | Abstand, Abluft, Umluft | Leistung reduzieren oder Abstand vergrößern |

**Diagnostisch trennscharf:** Photobleaching bleicht nach **weiß** aus und betrifft exakt die
lichtnächsten Blütenspitzen. Thermischer Stress vergilbt oder verbrennt und folgt dem
Wärmefeld, nicht der Lichtverteilung. Wer die beiden verwechselt, regelt die falsche Größe.

---

## 9 · Genetik: photoperiodisch versus altersabhängig

**Photoperiodische Sorten** blühen, wenn die Dunkelphase lang genug ist — sie messen die
Nachtlänge, nicht die Taglänge. Deshalb ruiniert schon ein kurzer Lichteinbruch in der Nacht die
Blühinduktion und kann Zwitterbildung auslösen. **Die Dunkelphase muss wirklich dunkel sein.**

**Automatics** tragen ein *Cannabis ruderalis*-Erbe und blühen **altersabhängig**, unabhängig von
der Lichtdauer. Daraus folgt praktisch alles Wichtige:

- Sie brauchen keine Umstellung und vertragen 18–20 Stunden Licht über den ganzen Zyklus.
- **Sie holen verlorene Zeit nicht auf.** Eine photoperiodische Pflanze kann man nach einem
  Rückschlag länger vegetativ stehen lassen; eine Auto blüht trotzdem weiter. Jeder Stress in den
  ersten vier Wochen ist deshalb ein dauerhafter Ertragsverlust, kein vorübergehender.
- Trainingseingriffe müssen früh geschehen und moderat ausfallen. Alles, was die Pflanze mehr als
  wenige Tage kostet, ist bei einem festen Fenster teuer.
- Das Substratvolumen wirkt bei Autos direkter auf die Endgröße als bei Photoperiodischen
  (Abschnitt 7.4).

**Züchterangaben zur Gesamtdauer sind systematisch optimistisch.** Sie gelten für
Idealbedingungen und beschreiben oft den frühesten möglichen Erntezeitpunkt, nicht den
optimalen. Abweichungen von 30–50 % nach oben sind in Hobbyanlagen die Regel, nicht die Ausnahme
— genau das war der Fehler hinter v1.5.98.

**Regel für die App:** Züchterangaben dürfen den Planungsrahmen setzen, aber niemals ein
Enddatum. Jeder Zyklusplan braucht einen ausgewiesenen Puffer nach hinten, und dieser Puffer ist
Teil des Plans, kein Notfall.

---

## 10 · Lösungschemie: Anmischen ohne Ausfällung

Fehlte in der Vorversion. Ausfällungen sind unsichtbar wirksam: Der EC stimmt, die Nährstoffe
sind aber teilweise als Feststoff ausgefallen und für die Pflanze verloren.

**Die Grundregel:** Nie zwei **Konzentrate** direkt zusammengeben. Jede Komponente wird
vollständig im Gesamtvolumen verteilt, bevor die nächste dazukommt. Fällungsreaktionen laufen
lokal an der Eintropfstelle, wo die Konzentration kurzzeitig extrem hoch ist — auch dann, wenn
die Endkonzentration völlig unkritisch wäre.

**Die kritischen Paarungen:**

| Kombination | Produkt | Folge |
|---|---|---|
| Ca²⁺ + SO₄²⁻ | Calciumsulfat (Gips) | schwer löslich, fällt aus |
| Ca²⁺ + PO₄³⁻ | Calciumphosphat | fällt aus, P und Ca verloren |
| Ca²⁺ + Silikat | Calciumsilikat | Flockenbildung, sofort sichtbar |
| Ca²⁺/Mg²⁺ + Carbonat bei hohem pH | Kalk | Trübung, Ablagerung im Gefäß |

**Kaliumsilikat ist der schärfste Fall.** Es ist mit pH 11–12 stark alkalisch. Kommt es in eine
Lösung, die bereits Calcium enthält, fällt sofort Calciumsilikat aus; zusätzlich hebt der lokale
pH-Sprung Carbonate und Phosphate aus der Lösung.

**Korrekte Reihenfolge:**

1. Wasser auf 20–22 °C
2. **Silikat zuerst**, vollständig einrühren, 2–5 Minuten stehen lassen
3. Calcium- und magnesiumhaltige Produkte
4. Sulfate (Bittersalz)
5. Chelate und Huminstoffe
6. Phosphatbetonte Zusätze, vorgelöst in warmem Wasser
7. Basisdünger
8. Biologische und lebende Produkte zuletzt
9. EC messen
10. pH einstellen, 5 Minuten warten, nachmessen

**Warum das Nachmessen dazugehört:** Silikate und Carbonate reagieren träge. Ein direkt nach der
Säurezugabe gemessener pH ist noch nicht der Gleichgewichtswert.

**Nicht auf Vorrat mischen.** Fertige Lösungen mit organischen Bestandteilen sind mikrobiell
instabil; lebende Produkte verlieren binnen Stunden bis maximal einem Tag. Anzeichen für einen
gekippten Ansatz: Trübung, Geruchsänderung, Gasdruck beim Öffnen.

**pH-Verschiebungen durch Einzelkomponenten** sind vorhersagbar und gehören in die
Produktdatenbank: Kaliumsilikat hebt deutlich, Monokaliumphosphat senkt deutlich, Huminstoffe
heben leicht, lebende Produkte mit niedrigem Eigen-pH senken leicht. Wo zwei gegenläufige
Komponenten zusammen eingesetzt werden, sinkt der Säurebedarf entsprechend.

---

## 11 · Reife: was Trichome anzeigen

Die harzbildenden Drüsen (gestielte Trichome, *capitate-stalked*) durchlaufen einen sichtbaren
Verlauf, der mit dem Cannabinoidprofil zusammenhängt.

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

**Wo gemessen wird — präziser als in der Vorversion:**

- Auf den **Kelchen (Calyxen)**, nicht auf den Zuckerblättern. Zuckerblatt-Trichome reifen ein
  bis zwei Wochen früher und täuschen Reife vor.
- **Nicht auf Foxtail-Neuwuchs.** Nachgeschobene Kelchtürme sind jung und tragen fast
  ausschließlich klare Köpfe. Wer dort misst, wartet zu lange.
- **Mehrere Etagen** pro Pflanze: obere Cola, Mitte, unterer Trieb. Die oberen Blüten bekommen
  mehr Licht und sind weiter.
- **Immer dieselben Stellen**, damit eine Kurve entsteht statt einer Folge von
  Momentaufnahmen. Erst die Kurve erlaubt eine Prognose.
- **Pro Pflanze getrennt.** Zwischen Individuen derselben Sorte liegen regelmäßig 10 Tage.

**Was kein Reifekriterium ist:** Griffelbräunung. Griffel reagieren auf Bestäubung, Berührung,
Luftfeuchte und Alter und laufen der Trichomreife häufig voraus.

**Zu früh ernten ist der teuerste Fehler im ganzen Zyklus.** Er kostet Ertrag und Wirkung, und er
ist der einzige, der sich nicht mehr korrigieren lässt. Ein paar Tage zu spät kosten wenig.
Deshalb plant die App konservativ mit dem oberen Ende jeder Spanne.

**Gegenläufig gilt aber:** Ab deutlicher Überreife verliert man Terpene schneller, als man
Potenz gewinnt. Die Empfehlung „lieber später" endet am oberen Rand des Zielfensters, sie ist
nicht unbegrenzt.

In GrowSmart: `_trichVsPlan`.

---

## 12 · Nach dem Schnitt: Trocknen und Fermentieren

Hier wird mehr Qualität vernichtet als in jeder anderen Phase — und der Schaden entsteht
schnell.

### 12.1 Trocknen

**Richtwert: 18–20 °C, 55–62 % RH, 7–14 Tage, dunkel, minimale Luftbewegung.**

Der eigentliche Steuerparameter ist nicht Temperatur oder Feuchte einzeln, sondern die
**Trocknungsrate**. Sie folgt demselben VPD-Prinzip wie am lebenden Blatt: 18 °C bei 60 % RH
ergibt rund 0,83 kPa, 18 °C bei 50 % rund 1,03 kPa. Der zweite Wert trocknet spürbar schneller.

**Zu schnell:** Die Außenseite verhornt, während innen Feuchtigkeit bleibt. Chlorophyll und
Stärke werden nicht abgebaut, das Ergebnis schmeckt scharf und grasig. Terpene mit niedrigem
Siedepunkt gehen zuerst verloren — genau die süßen, fruchtigen und zitrischen Noten.

**Zu langsam bei zu hoher Feuchte:** Schimmel. *Botrytis* wächst bei kühlen Temperaturen gut;
niedrige Temperatur allein ist kein Schutz.

**Dunkelheit:** Terpene sind flüchtig, und Wärme wie Licht treiben sie aus. Der oft genannte
UV-Abbau von THC ist in einem geschlossenen Trockenraum ohne UV-Quelle nicht der wesentliche
Punkt — entscheidend sind Temperatur und Luftbewegung.

**Zur Abweichung nach unten (50–54 % RH):** Ein trockeneres Regime ist vertretbar, wenn die
Luftbewegung minimal bleibt und die Zieldauer trotzdem bei mindestens acht Tagen liegt. Es
verkürzt das Zeitfenster für Schimmel, kostet aber Terpene. Es ist ein bewusster Tausch, keine
bessere Einstellung — und die App soll ihn als solchen darstellen statt einen der beiden Werte
als richtig auszugeben.

**Abbruchkriterium ist der Snap-Test**, nicht der Kalender: Der dünne Stiel bricht mit hörbarem
Knacken statt sich zu biegen.

### 12.2 Fermentieren (Curing)

**Dicht verschlossen, 58–65 % relative Feuchte im Glas.** Physikalisch geht es um die
**Wasseraktivität** (a_w) — den frei verfügbaren Wasseranteil, nicht den Gesamtwassergehalt.
Ziel ist a_w 0,55–0,65:

- **Unter 0,55:** zu trocken, Terpene sind bereits verloren, das Material zerbröselt.
- **Über 0,70:** Schimmel und Bakterien können wachsen.

Im Zielbereich wandert Restfeuchte aus dem Inneren an die Oberfläche und gleicht sich aus,
Chlorophyll baut weiter ab, Reststickstoff wird umgesetzt, und Terpene entwickeln sich. Das
braucht Wochen und lässt sich nicht abkürzen.

**Erste Woche täglich öffnen.** Der Feuchteausgleich aus dem Inneren hebt die Glasfeuchte
wiederholt an; ohne Lüften entsteht genau die Bedingung, die man vermeiden will.

---

## 13 · Die Fehler, die Pflanzen töten — mit Mechanismus

Nach diesen Punkten wird jede neue Warnung, jeder neue Default und jeder Text geprüft.

1. **Überwässerung.** Verdrängte Luft in der Wurzelzone → anaerobe Bedingungen → absterbende
   Wurzelspitzen → funktioneller Wassermangel. Sieht aus wie Trockenheit. Häufigster
   Anfängertod, besonders bei Sämlingen im zu großen Topf: Das ungenutzte Substratvolumen
   trocknet nie ab.
2. **Überdüngung.** Osmotische Umkehr — die Pflanze verliert Wasser an das Substrat. Bei
   Sämlingen besonders schnell tödlich; Light-Mix-Erden sind bereits vorgedüngt und brauchen in
   den ersten zwei bis drei Wochen praktisch nichts.
3. **Falscher pH.** Nährstoffe sind vorhanden, aber chemisch nicht verfügbar. Erzeugt
   Mangelbilder, die zu weiterem Düngen verleiten — was den EC hochtreibt und alles
   verschlimmert. **Vorher prüfen, ob der gemessene pH überhaupt aussagekräftig ist**
   (Abschnitt 4.1).
4. **Antagonismus statt Mangel.** Ein Mangelbild bei ausreichender Versorgung wird mit mehr vom
   falschen Stoff behandelt. K/Mg in der Blüte ist der häufigste Fall (Abschnitt 6.2).
5. **Schimmel in der Blüte.** *Botrytis* bei dichten Blüten ab etwa 60–65 % Raumfeuchte,
   drastisch beschleunigt durch stehende Nässe (VPD ≤ 0) und fehlende Luftbewegung. Das
   Mikroklima im Bud-Inneren liegt deutlich über dem Raumwert. Deshalb prüft man von innen, nicht
   von außen.
6. **Lichtschaden.** Zwei verschiedene Mechanismen mit verschiedenen Gegenmaßnahmen
   (Abschnitt 8.2). Erst unterscheiden, dann regeln.
7. **Zu früh ernten.** Kostet Ertrag und Wirkung, nicht rückholbar (Abschnitt 11).
8. **Lichteinbruch in der Dunkelphase** bei photoperiodischen Sorten: Blühstörung bis
   Zwitterbildung.
9. **Zu kleines oder zu locker gefülltes Substratvolumen bei Autos.** Kein akutes Schadbild,
   sondern eine stille Ertragsgrenze, die erst am Ende sichtbar wird (Abschnitt 7.4).

---

## 14 · Was verbreitet, aber nicht belegt ist

Vor jeder neuen Automatik zuerst hier nachsehen. Eine Funktion, die einen Fehler verhindern soll,
den es nicht gibt, ist selbst ein Fehler — das hat dieses Projekt bereits eine Automatik und vier
Releases gekostet (die „Abtrockenphase vor dem Spülen", v1.5.65–79).

- **IceFlush.** Kein belegter Trichom- oder Potenzeffekt. Die App sagt das selbst offen — dieser
  Ton ist richtig und soll so bleiben. Wer es machen will, soll es machen; die App plant es
  sauber ein, verspricht aber nichts.
- **Spülen vor der Ernte.** Kontrovers. Kontrollierte Vergleiche fanden keinen belastbaren
  Unterschied in Geschmack, Aschequalität oder Analytik zwischen gespülten und ungespülten
  Pflanzen. Der sichtbare „Nährstoffabbau" in den letzten Tagen ist überwiegend natürliche
  Seneszenz. Als Praxis unschädlich und verbreitet — aber kein Qualitätsversprechen.
- **Dunkelphase 24–72 h vor der Ernte.** Kein belegter THC-Zuwachs. Was belegt ist: Terpene sind
  flüchtig und verlieren sich unter Licht und Wärme. Ein kühler, dunkler Schnitt ist deshalb
  sinnvoll — die Begründung liegt in der Ernte, nicht im Stoffwechsel.
- **UV-Ergänzung für mehr Harz.** Die Befundlage ist gemischt bis negativ. Kontrollierte Versuche
  fanden keinen Cannabinoidzuwachs in den Blüten, teils Rückgänge und Wuchsschäden; ein
  berichteter Zuwachs betraf Zuckerblätter, die ohnehin entfernt werden. Nicht als
  Qualitätsmaßnahme ausgeben.
- **Zuckerwasser, Melasse in Mineraldünger, Mondphasen-Kalender.** Ohne Wirknachweis. Melasse hat
  in *lebendem* Boden eine nachvollziehbare Funktion als Mikrobennahrung — in einer sterilen
  Mineralversorgung nicht.
- **„Blätter entfernen bringt mehr Licht an die unteren Blüten."** Teilweise richtig, aber ein
  Blatt ist zuerst ein Photosynthese-Organ und ein Nährstoffspeicher. Übermäßiges Entlauben in
  der Blüte kostet Ertrag. Gezielt und wenig, nicht großflächig.
- **Griffelbräunung als Reifezeichen.** Verbreitet und falsch (Abschnitt 11).
- **Feste ppm-Angaben ohne Skala.** Keine Fehlpraxis im engeren Sinn, aber eine
  Fehlerquelle mit demselben Effekt (Abschnitt 5).

**Der Umgang damit in der App:** Nichts davon wird verboten oder wegdiskutiert — Patrick und
andere Grower nutzen diese Techniken, und sie planbar zu machen ist der Zweck der App. Aber kein
Text darf einen Effekt versprechen, den es nicht gibt. „Beliebte Grower-Technik, ein Trichom-Plus
ist wissenschaftlich allerdings nicht belegt" ist die richtige Formulierung.

---

## 15 · Was das für Entscheidungen in dieser App heißt

- **Bei Unsicherheit in Richtung Sicherheit runden.** Weniger Dünger, kürzere Lichtphase,
  späterer Erntetag, früherer Hinweis. Optimistische Defaults töten Anfängerpflanzen; ein
  konservativer Default kostet ein paar Prozent Ertrag.
- **Konservativ heißt nicht immer „weniger".** Beim Erntezeitpunkt ist *später* die sichere
  Seite, bei der Düngermenge *weniger*, beim Gießen kommt es auf das Substrat an. Immer vom
  Schadensmechanismus her denken, nicht von der Richtung.
- **Jede Schwelle trägt ihre Gültigkeitsbedingung mit.** Eine Regel, die nur für inerte Substrate
  gilt, muss das im Code wissen — nicht nur im Kommentar. Substrattyp ist eine Eingangsgröße,
  keine Anzeigeoption.
- **Vor der Interpretation die Validität.** Drain-EC ohne Durchflussangabe, VPD ohne
  Blattoffset-Annahme, PPFD ohne Messort: In allen drei Fällen ist die richtige Ausgabe eine
  Rückfrage, keine Bewertung.
- **Messung schlägt Kalender.** Trichome schlagen den Plan-Erntetag. Der Hebe-Test schlägt das
  Gießintervall. Drain-EC schlägt den Zulauf-EC. Symptome schlagen den berechneten VPD. Patricks
  Erfahrung schlägt die Sortentabelle.
- **Ein Symptom bekommt nie nur eine Ursache.** Wo mehrere Mechanismen dasselbe Bild erzeugen,
  nennt die App alle und liefert das Unterscheidungskriterium mit. „Schlaffe Blätter" allein ist
  keine Diagnose.
- **Erst prüfen, ob die App die Antwort schon kennt.** Bevor ein Regler entsteht: Lässt sich der
  Wert aus dem Zustand herleiten? Vorbilder sind `_snapFlushToRhythm` und `_trainingFit` —
  Letzteres wertete nur ein Feld aus, das seit jeher im Datenmodell stand.
- **Eine Zahl ohne Einordnung ist keine Information.** „EC 1150" hilft niemandem. „EC 1,15 — im
  Ziel für Blütewoche 5" ist eine Aussage. Bei jedem Wert gehört das Wort davor.
- **Fachbegriffe bekommen ihre Erklärung dort, wo sie stehen** (`INFO_TERMS`,
  `showInfoPopover`). Wer VPD zum ersten Mal liest, muss ohne Bildschirmwechsel weiterkommen.
- **Wo die Datenlage dünn ist, sagt die App das.** Ein ehrliches „nicht belegt" kostet nichts und
  ist der einzige Grund, warum den belegten Aussagen zu trauen ist.
