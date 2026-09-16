# Änderungen

Neueste zuoberst. Je Eintrag: Datum, was geändert wurde, warum.

## 2026-09-16 — v1.5.227

- **Beide Coco-Pläne schickten in Woche 11 ins Trockenlaufen — vor genau dem warnt die App bei Coco.** Dritter
  Befund der Gruppe A (UEBERGABE 0n). `canna_coco` sagte „Coco trocknen lassen — geht schneller als Erde,
  Vorsicht", `ghe_flora` „Trocknen lassen, Ernte vorbereiten". Seit v1.5.200 hat Coco aber einen **eigenen
  Gießpunkt** (`GIESSPUNKT.coco`, Hebe-Test „Mittel", Anker 70 %): Unter 60 % Restgewicht meldet
  `classifyRestPct` „Zu trocken für Coco", unter 40 % Wasserstress. Coco verzeiht Austrocknen schlecht
  (`ANBAU.md` 7.1) — und „Vorsicht" ist keine Grenze, an der man etwas ablesen kann.
- **Die Erd-Pläne wurden bei v1.5.200 umgestellt, die Coco-Pläne nicht.** Sie sagen seither „Nicht mehr gießen,
  bis der Topf den Gießpunkt erreicht (Hebe-Test „Knapp")". Genau diesen Satz bekommen die beiden Coco-Pläne
  jetzt auch — mit ihrem eigenen Knopf, **interpoliert aus `GIESSPUNKT.coco.knopf`** statt geschrieben, damit er
  der Quelle folgt. Dazu der Grund, den die App ohnehin kennt: darunter meldet sie „Zu trocken für Coco".
- `test_duengeplantexte.js` um Abschnitt C erweitert (21 Prüfungen, beide Zeitzonen). Er prüft auch, dass der
  Erd-Plan weiter „Knapp" sagt — die Quelle unterscheidet die beiden Substrate, nicht ein abgeschriebener Text.

## 2026-09-16 — v1.5.226

- **Der Cup-Sieger-Plan kündigte ein Mittel an, das er gar nicht dosiert.** Zweiter Befund der Gruppe A (UEBERGABE 0n).
  MKP wurde mit dem V3.4-Stand bewusst aus dem Plan genommen — die Misch-Info sagt es selbst („MKP ist gestrichen"),
  und in keiner der zwölf Wochen steht eine MKP-Dosis. Drei Wochen-Tipps kündigten es trotzdem weiter an:
  „MKP startet für Bud-Härtung" (Wo 7), „MKP auf Peak" (Wo 8), „Letztes MKP + Silica" (Wo 9). Wer dem folgt, sucht in
  der Mischliste ein Produkt, das dort nie auftaucht.
- **Jetzt** beschreiben die drei Tipps, was der Plan in diesen Wochen wirklich fährt (Bio·Bloom trägt, die kleine
  Stickstoff-Restgabe, die letzte Silica-Gabe) — ohne neue Wirkungszusagen (`ANBAU.md` 14).
- **Das Produkt bleibt im Plan.** In einer gespeicherten Plankopie kann eine selbst eingetragene MKP-Dosis stehen;
  sie zu entfernen wäre Datenverlust (die Lehre aus v1.5.135). Damit bleiben Produktzahl, Gaben und Summe gleich —
  der Fingerabdruck in `test_duengeplaene.js` ist unberührt.
- **Zwei Untertitel zählten falsch:** „12 Wochen · **12 Produkte**" in der Vorlage und im Assistenten — es sind 11.
- **Das Lexikon zeigte auf eine Dosis, die es nicht gibt:** „In deinem Plan ist das die GiDeli MKP in Woche 7-9."
  Jetzt steht dort, dass das Produkt angelegt ist, aber seit V3.4 in keiner Woche eine Dosis trägt — wer es fahren
  will, trägt sie selbst ein. Der generische Beispiel-Satz im Eintrag „PK-Booster" nennt GiDeli MKP weiter neben
  anderen Herstellern; das ist eine Produktnennung, keine Aussage über den Plan, und bleibt.
- `test_duengeplantexte.js` um Abschnitt B erweitert (17 Prüfungen, beide Zeitzonen).

## 2026-09-16 — v1.5.225

- **Der Cup-Sieger-Plan führte Mykorrhiza-Pulver als Schritt 10 seiner Mischanleitung.** Erster Befund der Gruppe A
  aus der Plan-Prüfung (UEBERGABE 0n). Der Düngeplan-Bildschirm rendert `mixOrder` als **nummerierte
  Mischreihenfolge** — während die Produktnotiz daneben sagt: „TROCKEN an die Wurzel, NIE ins Gießwasser!" und die
  Misch-Info es ebenfalls richtig erklärt. Wer der Liste folgt, rührt die Wurzelimpfung ins Gießwasser; dort
  erreichen die Sporen die Wurzelzone nicht, und die Impfung ist wirkungslos.
- **Der Fix musste an drei Stellen greifen, nicht an einer:**
  1. die Vorlage `FERT_PRESETS.cup_sieger.mixOrder`,
  2. `V34_MIXORDER` — die V3.4-Migration schreibt dieselbe Liste in **jeden gespeicherten** Cup-Sieger-Plan,
  3. eine eigene einmalige Reparatur (`_mykoMixFix`) für Pläne, die diese Migration schon hinter sich haben:
     `_v34SchedMigrated` ist dort längst `true` und lässt sie nie wieder laufen. Genau diese Falle steht als
     Lehre aus v1.1.30/31 im Code daneben. Die Reparatur entfernt **nur** diesen einen Eintrag aus `mixOrder`;
     Produkte, Dosen und alles Übrige bleiben unberührt.
- **Das Produkt bleibt im Plan**, mit seiner Anwendung — es verschwindet nur aus der Mischliste. Dosen, Produktzahl
  und Gaben ändern sich nicht, der Fingerabdruck in `test_duengeplaene.js` bleibt damit gültig.
- **Aus dem eigenen Abbruch gelernt:** Meine erste Wache verlangte, der Produktname dürfe nur noch **einmal** im
  Code stehen — und brach ab. Richtig sind **zwei** Vorkommen, beide als Produkt: in der Vorlage und in der
  Migration v1.1.18, die das Produkt von „HomeGrow24 Granulat" umbenannt hat, weil es damals fälschlich als
  Gießwasser-Dünger in Woche 4 stand. Die Wache war falsch, nicht der Code; sie prüft jetzt das Richtige —
  dass der Name **nirgends in einer Mischliste** steht.
- `test_duengeplantexte.js` neu (11 Prüfungen, beide Zeitzonen). Diese Datei füllt eine Lücke: Die
  Düngeplan-Vorlagen waren in **keiner** der Text-Prüfungen v1.5.125, .172, .190, .192 und .210 Prüfgegenstand —
  daher stammt die Hälfte der 70 Befunde aus 0n. Sie wächst mit jedem abgearbeiteten Befund der Gruppe A.

## 2026-09-16 — ANBAU.md 16 (ohne Versionssprung)

- **`ANBAU.md` bekommt Abschnitt 16 „Keimung: vom Samen zum Keimling".** Letzter Punkt der Keimungs-Prüfung
  (Schritt 17) — und der eigentliche Grund für die ganze Reihe v1.5.213–224: Zur Keimung sagte das Fachdokument
  **nichts**, während die App an sieben Stellen Zahlen dazu nannte. Genau so entstehen widersprüchliche Angaben, weil
  jede Stelle ihre eigene Quelle erfindet.
- **Im Abschnitt steht, was belegt ist und was Konvention:** Keimwurzel bei 22–26 °C im Median nach 23–37 h (Geneve et
  al. 2022), Auflaufen aus 1 cm nach 3,3–3,9 Tagen (Lisson et al. 2000), nach dem Durchbruch nicht mehr
  austrocknungsfest (Pereira et al. 2018) — und als ausgewiesene **Konvention** die Planungswerte Tag 4–7, „nach 7 Tagen
  ohne Wurzel wird es nichts mehr" und „ab Tag 10 nachsehen". Dazu der Sauerstoff als eigentliche Begrenzung, die
  Saattiefe, warum direkt in den Endtopf gesät wird, das Sämlingsklima samt Haube und das Licht.
- **Nummern 1–15 sind unverändert** — der Code zitiert 1.1, 1.2, 2.2, 5.1, 7.3, 7.4, 13.1, 13.2, 13.5, 14 und 15.
  `CLAUDE.md` nennt jetzt 16 statt 15 Abschnitte.
- **Kein Versionssprung:** `app.js` ist unverändert, auf dem Handy ändert sich dadurch nichts. Die App bleibt bei
  v1.5.224.

## 2026-09-16 — v1.5.224

- **Der Demo-Zyklus führte einen anderen Grow vor, als die App beschreibt.** Befund der Keimungs-Prüfung (Schritt 16) —
  und er wiegt schwerer als er aussieht: Der Demo ist für viele der **erste** Eindruck davon, wie ein Zyklus aussieht.
  - **An Sprüh-Tagen standen 30–100 ml als Gießmenge** im Eintrag, während die App an genau diesen Tagen seit v1.5.217
    bewusst **keine** Menge zeigt. Jetzt 0 — kein Guss.
  - **Die Anzucht-Güsse kamen aus einer eigenen Treppe** (250/400/700/1000/1200 ml). Sie standen neben dem Vorschlag,
    den die App aus Topf, Substrat und Phase rechnet, und widersprachen ihm. Jetzt dieselbe Rechnung (`waterSuggestion`).
  - **Die Notizen erzählten einen anderen Verlauf:** „Ab jetzt 7 Tage nur Sprühflasche" (es sind Tag 2–8), eine
    Sprühgabe in Millilitern, und an Tag 7 „Erstes Blattpaar komplett ausgebildet" — der Keimling bricht an Tag 4–7
    gerade erst durch (`KEIMUNG`). Die Notizen an Tag 1, 4, 7 und 9 folgen jetzt demselben Ablauf wie die Karten.
- **Zwei Folgefehler, die erst der neue Test gefunden hat:**
  - **Richtigstellung zu v1.5.214:** Dort steht, der Demo-Zyklus keime „ebenfalls direkt in der Erde". Das stimmte
    nicht — `addCyc` baut sein Objekt aus einer festen Feldliste und kennt `germMethod` gar nicht, die Zeile im
    Aufruf war wirkungslos. Der Demo setzt das Feld jetzt dort, wo er auch seine anderen Sonderwerte setzt.
  - **Der Demo schrieb Drain-pH und -EC auch an Tagen ohne Guss.** Solange daneben eine erfundene Gießmenge stand,
    fiel es nicht auf. Ohne sie wäre daraus genau die Messung geworden, die die App seit v1.5.150 als „nicht
    bewertet" zurückweist — und die ein Neuling als allererste Ablaufmessung zu sehen bekäme. Jetzt gibt es Ablauf
    nur dort, wo gegossen wurde; aus einem Topf, auf den man sprüht, läuft nichts heraus.
- `test_keimung.js` um Abschnitt N erweitert (87 Prüfungen, beide Zeitzonen) — er legt den Demo-Zyklus an und
  vergleicht seine Einträge mit dem, was die App für denselben Tag vorschlägt. `test_demozyklus.js` bleibt
  unverändert und war es, der den zweiten Fehler gemeldet hat.

## 2026-09-16 — v1.5.223

- **Der Hilfe-Text ließ offen, was Tag 1 ist.** Befund der Keimungs-Prüfung (Schritt 14): „Startdatum: der Tag an dem du
  gekeimt **oder** den Samen eingepflanzt hast." Das sind bei der Papiertuch-Methode bis zu sieben Tage Unterschied — und
  seit v1.5.168 ist Tag 1 überall der **Keimstart**. Wer hier das Einpflanzdatum einträgt, verschiebt den ganzen Zyklus.
  Jetzt: „dein Keimstart — der Tag, an dem der Samen ins Wasserglas, ins feuchte Tuch oder in die Erde kommt."
- **„Direkt" hieß zweierlei** (Schritt 15): Seit v1.5.214 ist „Direkt in Erde" die empfohlene **Keimmethode**. Derselbe
  Knopfname stand im Assistenten und in den Einstellungen für die **Start-Methode** — ob die Erde vorher angefeuchtet
  wurde. Zwei verschiedene Fragen, ein Wort, direkt nebeneinander im selben Zyklus. Die Start-Methode heißt jetzt
  „Ohne Vorbefeuchten".
- **Dazu im Assistenten:** die Reihenfolge bei Direktsaat (Samen erst nach dem letzten Durchgang legen, wie seit v1.5.218
  auf der Startseite) und der Grund für die Sprüh-Phase statt „Tag 2–8: NUR sprühen".
- `test_keimung.js` um Abschnitt M erweitert (80 Prüfungen). **Test bewusst nachgezogen:** `test_tag1keimung.js`
  prüfte auf „Direkt, ohne Vorbefeuchten" und liest jetzt „Ohne Vorbefeuchten" (26). Beide Zeitzonen.

## 2026-09-16 — v1.5.222

- **„Pythium etabliert sich in 24 Stunden — dann ist der Sämling tot."** Befund der Keimungs-Prüfung (Schritt 13): Diese
  Stoppuhr-Aussage stand an drei Stellen (Lexikon „Wurzelfäule (Pythium)", Sämlings-Protokoll im Assistenten, Lexikon
  „Sämlingsphase"). Belegt ist der **Mechanismus**, nicht die Frist: Nasse Erde verdrängt die Luft im Porenraum, die
  Wurzelspitzen sterben ab, und Oomyceten wie *Pythium* finden ideale Bedingungen (`ANBAU.md` 1). Jetzt sagen alle drei
  dasselbe — dass nasse Erde ohne aufnehmende Wurzel die Bedingung ist und die Umfallkrankheit dann kaum aufzuhalten,
  ohne eine Zahl zu erfinden.
- **Ein Rat, der dem eigenen Klimaziel widersprach:** Die Diagnose „Sämling kippt um" empfahl „nicht zu warm-feucht
  halten", der Lexikon-Eintrag nannte „zu nass + **zu warm**" als Ursache — während `KLIMA_ZIEL.saemling` für genau
  diese Pflanze 22–26 °C vorgibt. Ein Anfänger, der dem folgt, stellt seinen Sämling kalt. Gefährlich ist die **Nässe**;
  über 26 °C in der Wurzelzone sinkt zusätzlich der gelöste Sauerstoff und der Druck steigt (`ANBAU.md` 7.3). Genau das
  steht jetzt da.
- **„Tag 1–7 darf nicht gegossen werden"** → nach dem Start-Guss bis Tag 9. An Tag 1 wird sehr wohl gegossen, das ist
  der Sättigungsguss; die Sprüh-Phase liegt auf Tag 2–8.
- `test_keimung.js` um Abschnitt L erweitert (75 Prüfungen, beide Zeitzonen).

## 2026-09-16 — v1.5.221

- **Der Lexikon-Eintrag „Sämlingsphase" führte eine eigene Zahlentabelle** — genau der Fehler aus Abschnitt 1 der
  Übergabe, nur innerhalb eines Eintrags. Behoben (Keimungs-Prüfung, Rest von Schritt 12):
  - **Temperatur 24–26 °C** an zwei Stellen → aus `KLIMA_ZIEL.saemling` (22–26 °C), dieselbe Quelle wie Klima-Pille,
    Zielzeile und Sämlings-Pflege seit v1.5.187.
  - **„RLF 70 %"** und **„von 70 % auf ~65 %"** → das Feuchte-Fenster wird gerechnet (`klimaRlfFenster`), wie überall
    sonst in der App. Drei Zahlen für dieselbe Frage waren es vorher.
  - **„200–400 PPFD am Sämling"** → 150–300 µmol/m²/s nach `ANBAU.md` 8; 200–400 ist der Anzucht-Wert. Dieselbe
    Korrektur in der Lichtbrand-Handlung („Sämling 200 PPFD").
  - **„Tag 1–7: Nur Besprühen"** → Tag 2–8. Tag 1 ist der Sättigungsguss, an dem sehr wohl gegossen wird.
  - **„Erster richtiger Guss: 200–300 ml pro Topf"** → die Menge kommt seit v1.5.205 aus Topf und Substrat und steht
    im Tageseintrag. **„Haube ab Tag 10 weg"** → wie seit v1.5.220: spätestens mit dem ersten gezackten Blattpaar.
- **Zwei fachliche Fehler im selben Eintrag:**
  - „Die Pflanze lebt von den Reserven im Samen + **minimaler Aufnahme über die Keimblätter**" — Keimblätter nehmen
    kein Wasser auf, sie betreiben Photosynthese. Wasser kommt über die Wurzel (`ANBAU.md` 1).
  - „**Nach 3–5 Tagen** erste echte Blattspitze sichtbar" — nach dem Durchbruch (Tag 4–7) öffnen sich zuerst die
    Keimblätter; das erste gezackte Blattpaar kommt danach.
- **Eine unbelegte Wirkungszusage gestrichen** (`ANBAU.md` 14): „Salicylsäure und Polysaccharide unterstützen
  Wurzelbildung" beim Aloe-Sprühwasser. Die Zugabe bleibt beschrieben, jetzt mit „nicht belegt" — wie beim IceFlush.
  Der Produktname „Aloe Vera-Konzentrat" in der Düngerliste ist davon nicht betroffen.
- `test_keimung.js` um Abschnitt K erweitert (69 Prüfungen, beide Zeitzonen).

## 2026-09-16 — v1.5.220

- **Die Sämlings-Haube versprach genau den Zustand, vor dem sie an anderer Stelle warnt.** Befund der Keimungs-Prüfung
  (Schritt 12): An fünf Stellen stand „hält 80–95 % Luftfeuchte" — als Zweck der Haube. Bei 24 °C und 2 K Blattabzug
  liegt das Blatt-VPD ab etwa 89 % RLF bei null: Dann **kondensiert Wasser auf den Keimblättern** (`ANBAU.md` 2.2,
  in der App seit v1.5.101 eine eigene rote Warnstufe). Der Eintrag selbst nannte „Tropfen auf Keimblättern" zwei
  Absätze weiter als Anfängerfehler. Jetzt beschreibt der Text, was die Haube wirklich tut — sie hebt die Feuchte —,
  und sagt dazu, dass die Lüftungsschlitze offen bleiben, damit sie nicht über 90 % steigt.
- **Drei verschiedene Zeitpläne für dieselbe Haube:** „die ersten 7–10 Tage" (Trainings-Kurztext), „ab etwa Tag 10–14"
  (`_trainingFit`) und „Tag 1–7 / Tag 8–10 / Tag 11–14" (Lexikon). Maßgeblich ist nicht der Kalender, sondern die
  Pflanze: Solange der Keimling nicht steht, kann er nicht transpirieren; sobald er steht, braucht er die Übung.
  Alle Stellen sagen das jetzt gleich — drauf bis zum Durchbruch, danach lüften und über zwei bis drei Tage abnehmen,
  spätestens mit dem ersten gezackten Blattpaar weg.
- `test_keimung.js` um Abschnitt J erweitert (59 Prüfungen, beide Zeitzonen). `test_training.js` bleibt unverändert
  grün — die Begründung „zu lange darunter … anfällig für Schimmel" steht weiter dort.

## 2026-09-16 — v1.5.219

- **Die Keimphase endete im Stadium-Anzeiger an Tag 5, der Keimling kommt aber erst an Tag 4–7.** Befund der
  Keimungs-Prüfung (Schritt 9): `stageForCycle` stufte ab Tag 6 auf „Sämling" hoch — bei einem Samen, der noch in der
  Erde liegt. Das Stadium steuert Symbol und Beschriftung auf der Startseite; ein Anfänger liest dort „Sämling", während
  oben steht „noch nichts zu sehen ist normal bis Tag 7". Die Grenze kommt jetzt aus `KEIMUNG.auflaufenBis` — dieselbe
  Zahl, die Keimungskarte, Sämlings-Pflege und Lexikon nennen (keine zweite Zahl für dieselbe Sache).
- **Der Meilenstein-Chip hieß „Erste Blätter (Cotyledons)".** „Cotyledons" ist der Fachbegriff, den ein Anfänger im
  Notizfeld nicht schreibt — und die Keimblätter sind keine „ersten Blätter", das erste gezackte Blattpaar kommt danach.
  Jetzt „Keimblätter offen". Damit alte Notizen weiter zählen, sucht die Prüfung auf beide Schreibweisen.
- `test_keimung.js` um Abschnitt I erweitert (52 Prüfungen, beide Zeitzonen).

## 2026-09-16 — v1.5.218

- **Tag 1 nannte einen EC-Zielwert und trug ihn als Messung ein.** Befund der Keimungs-Prüfung (Schritt 7): Startseite und
  Tageskarte sagten „EC ~0.6", und „Tag automatisch ausfüllen" schrieb `0.6` ins EC-Feld. Beides ist falsch herum: 0,6 ist
  die **Obergrenze** des Sämlings-Bereichs (`ANBAU.md` 5), keine anzustrebende Zahl — und ohne Dünger misst man an Tag 1
  nur das Leitungswasser (bei Patrick 0,22 mS/cm). Ein eingetragener Wert, den niemand gemessen hat, fließt danach als
  Messung in Verlauf und Diagramm (`ANBAU.md` 15: „Messwerte werden nie geschätzt und eingetragen").
- **Jetzt:** „EC höchstens 0,6 — ohne Dünger misst du dabei nur dein Leitungswasser." Das Ausfüllen lässt das EC-Feld leer.
- **Die Reihenfolge bei Direktsaat fehlte.** Der Sättigungsguss läuft in drei Durchgängen; wer den Samen vorher legt,
  schwemmt ihn frei oder tiefer. Neuer Schritt: „Säst du direkt in die Erde: den Samen erst nach dem letzten Durchgang legen."
- **„Ring um den Sämling" gibt es vor dem Durchbruch nicht.** Bis Tag 7 (`KEIMUNG.auflaufenBis`) steht dort nur Erde;
  die Anleitung nennt jetzt „die Stelle, an der der Samen liegt", danach den Keimling, später den größeren Radius.
- **Am ersten Guss nach der Sprüh-Phase fehlte die wichtigste Bedingung** (Schritt 8): Ist an Tag 9 noch kein Keimling da,
  ist Gießen der gefährlichste Schritt — nasse Erde ohne aufnehmende Wurzel ist die Pythium-Bedingung (`ANBAU.md` 13.1).
  Der Hinweis erscheint genau an diesem einen Tag, erkannt daran, dass gestern noch gesprüht wurde — nicht an einer festen
  Tagesnummer, damit er auch nach einer Verschiebung am richtigen Tag steht.
- `test_keimung.js` um Abschnitt H erweitert (48 Prüfungen, beide Zeitzonen).

## 2026-09-16 — v1.5.217

- **Der Gieß-Tipp im Eintrag folgt der Aktion und der Menge, nicht dem Tag.** Befund der Keimungs-Prüfung (Schritt 5),
  nachgemessen über Tag 1–12 in beiden Start-Wegen. Drei Fehler in einer Zeile:
  - **Tag 1** zeigte „~700 ml/Pflanze" und darunter „Keimphase: Sprühflasche oder ganz feiner Strahl" — während die
    Sättigungsguss-Anleitung daneben „3 Etappen je ~250 ml mit 15 Minuten Pause" sagt. 700 ml passen in keine Sprühflasche.
  - **An den Sprüh-Tagen 6–8** stand eine Box „Empfohlene Gießmenge (falls heute) ~0 ml/Pflanze", an Tag 7 und 8 mit dem
    Zusatz „für diese Menge keine Sprühflasche" — eine Empfehlung über null Milliliter.
  - **Dieselbe Menge bekam verschiedene Tipps:** 35 ml hießen an Tag 4 „Sprühflasche", an Tag 8 „Gießkanne".
- **Jetzt** entscheidet `_saemlingGiessTipp(aktion, mlJePflanze)` an beiden Stellen: Sättigungsguss → drei Durchgänge mit
  der Brause; Sprüh-Tag → 3–5 Sprühstöße an der Erde am Samen (wie seit v1.5.215) und **keine** Mengen-Box; sonst
  entscheidet die Menge — bis 50 ml Messbecher oder ganz feiner Strahl, darüber die feine Gießkanne im Ring.
  Die Sprühflasche gehört damit nur noch auf Sprüh-Tage: Für 35 ml wären es rund 35 Stöße.
- `test_keimung.js` um Abschnitt G erweitert (42 Prüfungen, beide Zeitzonen) — er prüft auch, dass dieselbe Menge an
  jedem Tag denselben Tipp bekommt.

## 2026-09-16 — v1.5.216

- **Die Sämlings-Pflege beschreibt, was an diesem Tag wirklich passiert.** Befund der Keimungs-Prüfung (Schritt 4): Die Box
  im Tageseintrag sagte an **Tag 3** „Beobachten ob Keimblätter durchbrechen" — nach `KEIMUNG` kommt der Keimling erst an
  Tag 4–7, an Tag 3 ist nichts zu sehen. Genau das ist der Tag, an dem Anfänger nachgraben. An **Tag 5** stand „Erste echte
  Blätter zeigen sich bald", an **Tag 7** „Erste richtige Blätter da!" — als Tatsache, während der Keimling an Tag 7 gerade
  erst durchbricht. Wer der Box glaubt und nichts sieht, hält seinen Grow für gescheitert.
- **Jetzt:** Tag 3 unterscheidet Papiertuch (Keimwurzel 2–5 mm → heute einsetzen) vom Samen in der Erde („zu sehen ist noch
  nichts, und das ist normal"). Tag 4 sagt, dass bis Tag 7 nichts zu sehen normal ist. Tag 5 folgt dem Start-Weg: vorbefeuchtet wird bis Tag 9
  gesprüht, ohne Vorbefeuchten steht die Menge oben im Eintrag. Tag 7 sagt „ab Tag 10 vorsichtig nachsehen" statt Blätter zu
  versprechen. Alle Zahlen aus `KEIMUNG`.
- **Zwei feste Zahlen in den Grundregeln derselben Box mitbehoben:** „65–75 % RLF" stand neben einer App, die das
  Feuchte-Fenster seit v1.5.187 aus Temperatur und VPD rechnet (`KLIMA_ZIEL.saemling`, `klimaRlfFenster`) — eine vierte
  Zahl für dieselbe Frage. Und „~50–150 ml, steigt mit jedem Guss" stand als Faustzahl neben der Menge, die die App seit
  v1.5.205 aus Topf und Substrat rechnet und im selben Eintrag darüber anzeigt.
- `test_keimung.js` um Abschnitt F erweitert (37 Prüfungen, beide Zeitzonen).

## 2026-09-16 — v1.5.215

- **Der Sprüh-Auslöser fragt die Erde am Samen, nicht die obersten 1–2 cm.** Beim Nachsehen der Keimungskarte im Browser
  (v1.5.214) standen zwei Auslöser für dieselbe Handlung direkt untereinander: Die Keimungskarte sagt seit v1.5.213 „Die Erde
  direkt am Samen feucht, nicht nass: Wird sie dort oben hell, 3–5 Sprühstöße", die Karte darunter „3–5 Sprühstöße auf die
  Oberfläche, sobald obere 1–2 cm trocken wirken". Auch Startseite, Tageskarte, Ausfüllen-Vorschlag und das Lexikon nannten
  die Tiefe.
- **Warum die Tiefe die falsche Frage ist:** Der Samen liegt 0,5–1 cm tief (`KEIMUNG`). Sind die obersten 1–2 cm trocken,
  liegt der Samen selbst schon trocken — und die Keimwurzel ist nach dem Durchbruch nicht mehr austrocknungsfest (Pereira et
  al. 2018). Gefragt ist die Stelle, an der der Samen liegt, nicht eine Tiefe. Zu sehen ist sie: trockene Erde wird hell.
- **Sechs Stellen** sagen jetzt dasselbe (`plainSentence`, `getTodayAction`, Tageseintrag, `getAutoFillTemplate`, Lexikon
  „Sämlingsphase"). Dazu der Hinweis am Anzucht-Gießtag: Solange der Sämling steht (Tag 1–10, dieselbe Grenze wie
  `isSeedling` im Tageseintrag), heißt er „Erde am Keimling feucht, nicht nass — der Rest des Topfs darf oben antrocknen";
  danach wieder der Topf-Hinweis.
- `test_keimung.js` um Abschnitt E erweitert (29 Prüfungen, beide Zeitzonen) — er prüft die vier Funktionen und sucht die
  alte Schwelle in jeder Schreibweise im Umfeld eines Sprüh-Textes.

## 2026-09-16 — v1.5.214

- **„Direkt in Erde" ist die vorgewählte Keimmethode.** Befund der Keimungs-Prüfung (Schritt 3): Wer nichts auswählte, bekam
  in der Keimungskarte und in der Sämlings-Pflege das **Papiertuch** vorgeschlagen — den Weg mit den meisten Handgriffen und
  dem einzigen Schritt, an dem ein Anfänger die Keimwurzel zerstören kann. Nach `ANBAU.md` 7.4 gehört der Samen direkt in den
  Endtopf: Jeder Umsetzvorgang kostet Tage, und bei Automatics ist ein verlorener Tag dauerhaft verloren. Die Keimwurzel ist
  nach dem Durchbruch nicht mehr austrocknungsfest (Pereira et al. 2018) — sie anzufassen ist der teuerste Handgriff der
  ersten Woche. `ANWEISUNG.md`: Vorgaben sind konservativ-sicher.
- **Jetzt:** `_keimMethode` gibt ohne eigene Wahl `'direct'` zurück; die Karte beschriftet diesen Knopf mit „empfohlen".
  Die anderen beiden Wege bleiben eine Berührung weit entfernt und ändern nichts an ihren Schritten.
- **Die Fußzeile der Karte stimmte nicht mehr.** Sie sagte „Bis der Keimling da ist — warm, feucht, dunkel". „Dunkel" gilt für
  Glas und Tuch, nicht für einen Samen in der Erde, der unter der Lampe steht; und der Keimling braucht Licht ab dem Moment,
  in dem er durchbricht (`ANBAU.md` 8). Jetzt: Temperatur aus `KLIMA_ZIEL.saemling`, „feucht, nicht nass", und der Satz zum
  Licht. Der Demo-Zyklus keimt ebenfalls direkt in der Erde — seine Notiz an Tag 1 sprach ohnehin vom Samen in der Erde.
- **Tests bewusst nachgezogen:** `test_tag1keimung.js` prüfte „keine Wahl" gegen die Papiertuch-Schritte. Der Abschnitt läuft
  jetzt gegen „Direkt in Erde", und eine neue Prüfung hält die Vorgabe samt Beschriftung fest (26 Prüfungen, beide Zeitzonen).

## 2026-09-15 — v1.5.213

- **Keimung: eine Zahlenbasis statt widersprüchlicher Angaben.** Befund der Keimungs-Prüfung (Schritte 1, 2, 10, 11), offen seit
  v1.5.168: Keimungskarte, Anleitung und Lexikon nannten verschiedene Zahlen für dieselbe Sache — Keimwurzel beim Einsetzen
  2–3 mm, 2–5 mm oder „~0,5–1 cm", Wasserglas höchstens 32 oder 48 Stunden, der Keimling nach 3–7 Tagen, 5–10 Tagen oder
  „Tag 3–5", Saattiefe 5 mm oder 1 cm, Temperatur 22–25 oder 24–26 °C.
- **Mechanismus und Belege** (am Abstract geprüft): Hanf keimt bei 19–30 °C gut; bei 22–26 °C zeigt sich die Keimwurzel im
  Median nach 23–37 Stunden (Geneve et al. 2022), aus 1 cm Tiefe durchbricht der Keimling die Erde nach 3,3–3,9 Tagen (Lisson et
  al. 2000). Unter Wasser fehlt der Keimwurzel Sauerstoff, und nach dem Durchbruch ist sie nicht mehr austrocknungsfest (Pereira
  et al. 2018). Deshalb: im Wasserglas 12–24 Stunden, nie länger; einsetzen bei 2–5 mm Keimwurzel; 0,5–1 cm tief, nie tiefer als
  2 cm; der Keimling kommt meist an Tag 4–7, nachsehen erst ab Tag 10 (Konvention). Die Temperatur kommt aus
  `KLIMA_ZIEL.saemling` (22–26 °C).
- **Jetzt:** `KEIMUNG` ist die einzige Quelle für Keimungskarte (`GERM_GUIDES`), Anleitung für den ersten Grow und Lexikon
  „Keimung". Gestrichen, weil nicht belegt (`ANBAU.md` 14): Keimraten je Methode, „Temperaturschock senkt die Keimrate
  drastisch", pH 6,8–7,0 als ideal, Aloe als Keim-Booster, „Osmose", „Haube Pflicht für 70–80 %".
- `test_keimung.js` (22 Prüfungen, beide Zeitzonen).

## 2026-09-15 — v1.5.212

- **Die Trichom-Karte urteilt nur über eine Messung von heute.** Befund der Erntefenster-Prüfung (Schritt 1): Die Zeile
  „Erntereif", „Milchig-dominant", „Fast bereit" oder „Noch zu viel klar" stand auch an Tagen, an denen niemand geschaut hatte —
  aus dem übernommenen Stand eines früheren Tages (an Patricks Tag 111 „Fast bereit" aus den Werten von Tag 110) oder, ohne
  jede Messung, aus der Vorgabe 70/25/5 („Noch zu viel klar — Geduld!"). Ein Urteil über eine Messung, die es nicht gibt,
  verstößt gegen Regel 2; bei der Ernte ist zu früh der teuerste Fehler (`ANBAU.md` 11).
- **Jetzt:** Das Urteil erscheint erst mit einer Messung von heute oder nach „Heute geschaut — sieht noch genauso aus". Der
  übernommene Stand bleibt sichtbar, mit dem Hinweis, von welchem Tag er stammt.
- `test_erntereif.js` um drei Prüfungen erweitert (9, beide Zeitzonen).

## 2026-09-15 — v1.5.211

- **Das Spülende setzt der Plan, kein Drain-EC-Wert.** Befund der Begriffe-Prüfung (Schritt 7): Die IceFlush-Checkliste
  verlangte „Drain EC nach letztem Spülen ≤ 0.4 mS/cm", das Lexikon führte eine Stufentabelle bis „EC ≤ 0.4: sauber, Spülung
  abgeschlossen", die CANNA-Coco-Vorlage „Drain-EC ≤0.4 anstreben". Unter den EC des Wassers, mit dem gespült wird, kann der
  Drain nicht fallen, und in Erde steigt er nach dem Spülen wieder, weil die Erde Nährstoffe nachliefert (`ANBAU.md` 5.1: „EC
  fällt und steigt wieder an"). Die Schwelle war dort unerreichbar und trieb zu zusätzlichen Güssen vor dem Hard-Dryback —
  verdrängte Luft in der Wurzelzone (`ANBAU.md` 1, 13.1).
- **Jetzt:** Die Checkliste hat sieben Punkte; ein schon gesetztes Häkchen bleibt gespeichert, zählt aber nicht, und „Tag
  ausfüllen" am IceFlush fragt es nicht mehr ab. Lexikon und Vorlage sagen: Der Drain-EC fällt beim Spülen, das Ende setzt der
  Plan.
- **Bewusst nicht geändert:** Patricks Rainbow-Plan nennt in Woche 14 „Ziel Drain-EC höchstens 0,5" — so steht es auf seinem
  Plan-Blatt, und die Vorlage ist 1:1 davon übertragen. Ob der Satz bleibt, entscheidet er.
- `test_spuelende.js` (10 Prüfungen, beide Zeitzonen).

## 2026-09-15 — v1.5.210

- **Drain-EC-Texte folgen der Regel.** Seit v1.5.209 bewertet der Eintrag den Drain-EC nur als Verhältnis zum Gießwasser.
  Daneben standen sechs andere Faustregeln mit festen Zahlen, und wer einer davon folgte, bekam im Eintrag eine andere Antwort:
  Infotext „mehr als 0,5 über dem Gießwasser → spülen", Lexikon „±0,2 gesund · 0,5+ höher Dosis reduzieren · 0,3+ niedriger
  Dosis erhöhen" und „bei Coco 0,3–0,5 höher normal", Diagnose und Tipps „über 2,5 versalzt", CANNA-Coco-Vorlage „1,0–1,8 mS/cm"
  und „ähnlich Input-EC", Cup-Plan „Warnschwelle > 2,3 in Stretch II", Salz-Hilfe „spülen bis Drain-EC nahe Input-EC". Beim
  Durchklicken kamen vier Lexikon-Stellen dazu, die kein Suchlauf gefunden hatte: die Mechanik im Eintrag „Runoff-EC" („Runoff
  höher als Inflow → Salze sammeln sich"), „EC-Wert" („höher als Inflow = Salze → Flushen"), „Zwischenspülung" („Runoff-EC >>
  Inflow") und „Messgeräte" („Differenz zeigt, was im Substrat passiert"). Ein Drain
  von 2,4 bei Gießwasser 1,6 (das 1,5-Fache, normal bei voller Düngung) stand nach der Diagnose kurz vor „versalzt", einer von
  1,0 bei Gießwasser 0,5 (das Doppelte, Anreicherung) weit darunter.
- **Jetzt:** ein Satz, `T.drainRegel()` und `T.drainRegelKurz()`, aus `DRAIN_EC_VERHAELTNIS` und `DRAIN_ZIEL` (`ANBAU.md` 5.1).
  Die Salz-Hilfe rät wie der Eintrag zuerst zu mehr Volumen mit der normalen Nährlösung, zu einer Zwischenspülung erst bei
  anhaltend hohem Wert mit Symptomen. Texte in schon gespeicherten Plan-Kopien ändern sich nicht; Dosen sind unberührt.
- `test_draintexte.js` (18 Prüfungen, beide Zeitzonen).

## 2026-09-15 — v1.5.209

- **Drain-EC: eine Regel — das Verhältnis Drain ÷ Gießwasser.** Befund der Begriffe-Prüfung (Schritt 4 und 6), im Code
  bestätigt: `analyzeRunoff` rechnete den Status mit „Differenz > 0,5 und Drain über dem Zielbereich × 1,15", das Etikett mit
  dem Verhältnis 1,6. Gießwasser 1,8 / Drain 2,35 — das 1,31-Fache, nach `ANBAU.md` 5.1 normal bei voller Düngung — ergab eine
  orange Warnung „im Substrat sammeln sich Salze"; 0,5 / 1,0, das Doppelte und damit Anreicherung, nur ein ⚠ im Etikett und
  keinen Hinweis. Der Zielbereich gilt fürs Gießwasser, nicht für den Drain.
- **Mechanismus:** Wasser verdunstet, Salz wird nur zum Teil aufgenommen — der Drain ist deshalb konzentrierter als das
  Gießwasser. Neu `DRAIN_EC_VERHAELTNIS` (1,3 / 1,6) und `drainEcStufe` für Status und Etikett: bis zum 1,3-Fachen
  Gleichgewicht, bis zum 1,6-Fachen normal bei voller Düngung, darüber Anreicherung (orange; in organischer Spätblüte weiter mit
  zwei möglichen Ursachen), unter dem Gießwasser „nimmt mehr auf als zugeführt" als ruhiger Hinweis. In der zweiten Blütehälfte
  ist das normal, dort steht „Nicht nachdüngen" statt „nachdüngen?" (`ANBAU.md` 6.4). Beim Spülen gilt die Tabelle nicht
  (v1.5.166).
- **Nur mit gültiger Messung:** Bewertet wird bei mindestens 15 % Drain und einem gemessenen Gießwasser-EC. Stand dort nur der
  Vorschlag der App, rechnete sie das Verhältnis trotzdem (Regel 2); jetzt heißt es „Gießwasser-EC nicht gemessen · nicht
  bewertet" mit der Bitte, das Gießwasser zu messen. Ohne gültige Messung bleibt auch der Status leer.
- **Patricks 24 Drain-Messungen** liegen beim 1,28- bis 1,63-Fachen seines Gießwassers: 20 normal bei voller Düngung, eine im
  Gleichgewicht, drei knapp über dem 1,6-Fachen (1,61–1,63). Bewertet werden sie weiterhin nicht, weil die Drain-Menge fehlt
  (v1.5.150).
- **Tests bewusst nachgezogen:** `test_drainohnemenge` hielt die alten Etiketten („EC +0.5 (Drain 1,45× Zulauf)") und den
  Status einer ungültigen Messung fest. Neu `test_drainregel.js` (16 Prüfungen, beide Zeitzonen).

## 2026-09-15 — v1.5.208

- **Die restlichen Texte der Gießmenge.** Seit v1.5.205 kommt die Menge aus dem Topf: Höchstens V passt hinein, der Rest wird
  Drain. Sieben Stellen sprachen noch die alte Sprache (Gießmengen-Prüfung, Runde 3, Schritt 11):
  - **Gieß-Fahrplan (Profi):** „Startwert ~X ml" aus der Startkurve in der Mitte jeder Blüte-Stufe, beim Spülen „Spülmenge",
    statt „Ideal ~min–max" aus einem Band um die alte Faustregel. Ein eigener Korridor gilt seit v1.5.205 nur bis zum ersten
    eigenen Guss.
  - **Einstellungen, Topfgröße:** „Zähl, was wirklich im Topf ist: Aufgehäuft hält ein 11-L-Stofftopf 14–16 L Substrat"
    (`ANBAU.md` 7.4), darunter „In diesen Topf passen ab dem Gießpunkt höchstens ~V ml je Guss" mit der Quelle (Waage,
    Drain-Messungen oder die Annahme 300 ml je Liter). Patricks Rainbow-Plan nennt „11L Stofftopf (aufgemoundet 14–16L)"; mit
    11 statt 15 L wäre V für Run 02 um gut ein Viertel zu klein.
  - **Tipps-Leitfaden:** Topf und Menge aus dem laufenden Zyklus statt „11L Stofftöpfe … ca. 3,0–3,5 Liter" für jeden Topf,
    bei Coco mit eigenem Satz.
  - **Durchfluss 25–30 %:** „viel, noch gültig" statt „aussagekräftig" — `ANBAU.md` 5.1 nennt 15–25 % das Standardfenster.
  - **Drain auffangen:** „Stofftopf oder Air-Pot: in einer breiten Wanne auffangen". Dort läuft der Drain auch seitlich heraus;
    eine Messung aus dem Untersetzer wäre zu klein und würde die nächste Menge anheben (Regel 2).
  - **Einsteiger-Satz:** eine Menge je Pflanze und dazu die Drain-Spanne („15–20 % der Menge als Drain sind richtig so") statt
    „bis unten ein bisschen Wasser rausläuft".
  - **Warnung zur Wassermenge ab Tag 25 und in der Blüte:** Statt „Sehr viel Wasser … Zu viel Wasser = Wurzelfäule" ab dem
    2,5-Fachen der Empfehlung zwei Hinweise nach dem Mechanismus: „Mehr, als in den Topf passt" über V (der Rest wird Drain,
    das schadet nicht) und „Topf war noch feucht", wenn der Hebe-Test vor dem Guss bei Erde 70 % oder mehr zeigt. Staunässe
    kommt vom zu häufigen Gießen, nicht von einer vollen Menge (`ANBAU.md` 1.1, 13.1). Beim Sämling bleibt die bisherige
    Warnung: Dort hält ein großer Guss den ganzen Topf lange nass.
- **`ANBAU.md`, Grundlagen der Gießmenge** (Text der Prüfung; die Quellen hat sie geöffnet oder, wo vermerkt, am Abstract
  geprüft): 1.1 „Wann und wie viel" (Mengenbilanz, Container-Kapazität), 1.2 „Der Gießpunkt" (Hebe-Skala mit Anker, Frontiers
  in Plant Science 2026, Sadras & Milroy 1996, FAO-56 als Analogie), 2.3 Klima nur als Verhältnis (Oren et al. 1999), 5.1
  Drain-Ziel 15–20 % mit Belegen und die Wanne, 7.4 Poorter et al. 2012 und das gefüllte Volumen, 7.5 neu
  „Wasserhaltekapazität im Topf" (300 ml je Liter als Kalibrierung, Fields et al. 2014), dazu drei Punkte in 14 und die
  Rangfolge der Gießmenge in 15. Den Beleg für „Trockenstress für mehr Harz" (Caplan et al. 2019) konnte die Prüfung nicht
  öffnen; er steht deshalb nicht drin.
- `test_giesstexte.js` (16 Prüfungen, beide Zeitzonen).

## 2026-09-15 — v1.5.207

- **Eine Klimafunktion für die Gießmenge.** Befund der Gießmengen-Prüfung (Runde 3, Schritt 10): Neben `klimaTranspiration`
  (Oren et al. 1999, seit v1.5.205 in der Gießmenge aus dem Topf) rechnete `_vpdFactorForDay` weiter in Stufen 0,85 / 0,95 /
  1,0 / 1,15 / 1,25 gegen das seit v1.5.187 eingefrorene alte VPD-Band — im Anker-Weg, im Verbrauchsmodell, in der
  Dryback-Vorhersage, auf dem alten Weg (Sämling, Spülen, Outdoor, Hydro) und für „Klima-justiert". Gleiches Klima ergab je
  nach Phase einen anderen Faktor, und das alte Band gibt es seit Option B nicht mehr. Gemessen an Patricks erstem Spülgang
  (Tag 107): 11250 ml ohne Klima, 12000 ml bei 30 °C / 30 %, 9550 ml bei 20 °C / 80 % — je nach Klima dieses einen Tages.
- **Jetzt:** `_klimaTagFaktor` rechnet die Transpiration eines Tages aus dem Blatt-VPD der Messung, 1,0 ohne Messung oder bei
  einem Wertepaar der alten Autofill-Tabelle. Verbrauchsmodell und Vorhersage benutzen denselben Maßstab, der Anker-Weg das
  Verhältnis nur gemessener Tage (`klimaMittelGemessen`), wie die Gießmenge aus dem Topf. Auf dem alten Weg gibt es keinen
  Tages-Klimafaktor mehr: Ohne eigenen Guss als Bezug fehlt das Verhältnis, und die Spülmenge folgt dem Topf, nicht dem Klima
  eines Tages. „Klima-justiert" steht genau dann, wenn das Klima-Verhältnis der Gießmenge mindestens 2 % ausmacht.
- **Tests bewusst nachgezogen:** `test_klimaziel` (J) prüfte den Faktor „wie vor dem Umbau", `test_klimanieschaetzen` (C)
  verglich „Klima-justiert" mit dem alten Faktor, `test_cocogiesspunkt` und `test_finisherreste` hielten ihn per Stub fest.
  Neu: `test_klimafunktion.js` (6 Prüfungen, beide Zeitzonen).

## 2026-09-15 — v1.5.206

- **Heute gießen, wenn der Topf bis morgen unter den Gießpunkt fällt.** Befund der Gießmengen-Prüfung (Runde 3, Schritt 9):
  Gießpunkt und Rhythmus sind fest. Trocknet ein Topf schneller, als der Rhythmus erlaubt — kleiner Topf, große Pflanze,
  trockene Luft —, fällt er zwischen zwei Gießtagen unter die Stressgrenze. Im Topfmodell der Prüfung mit 220 ml je Liter
  waren das 13 Stress-Tage in einem Zyklus; bei Automatics ist jeder davon ein dauerhafter Verlust (`ANBAU.md` 9).
- **Mechanismus:** Der vorletzte Guss füllt den Topf, am letzten Gusstag wird vor dem Gießen gemessen (Hebe-Test oder Waage).
  Daraus folgt, wie viele Punkte Restgewicht der Topf am Tag verliert (`tagesAbnahme`). Zeigt die heutige Messung an einem
  Tag ohne geplanten Guss, dass er morgen unter der Untergrenze des Gießpunkts läge (Erde 25 %, Coco 60 %), sagt die
  Statusbox im Eintrag „Heute gießen — der Topf trocknet schnell", mit beiden Zahlen. Ohne Messung vor dem letzten Guss keine
  Aussage — geschätzt wird nicht (`ANBAU.md` 15). Der Gießpunkt selbst gleitet nicht. Gilt in der Blüte und ab Tag 25 der
  Anzucht. In der Prüfung: 0–1 statt 13 Stress-Tage, im normalen Topf kein zusätzlicher Guss.
- **Eine Antwort auf „wann":** Beim Durchklicken mit Patricks Daten stand unter der neuen Box „Nach deinem Trocknungs-Tempo
  eher morgen". Die Vorhersage (`drybackForecast`) rechnet mit der gelernten Rate über viele Messungen und zielt auf 30 %, die
  Reserve fragt, ob der Topf morgen schon unter 25 % liegt. Greift die Reserve, sagt jetzt auch die Vorhersage „heute": auf
  der Startseite „💧 ~heute" statt „~morgen", im Eintrag entfällt die zweite Zeile.
- `test_reserve.js` (13 Prüfungen, beide Zeitzonen).

## 2026-09-15 — v1.5.205

- **Die Gießmenge kommt aus dem Topf.** Befund der Gießmengen-Prüfung (Runde 3, von einem zweiten Agenten gegengeprüft), mit
  v1.5.204 nachgemessen: Ein frischer 11-L-Topf bekam ab Blütetag 15 flach 1500 ml, egal ob die Blüte 42 oder 105 Tage dauert;
  von Tag 22 auf 23 sprang die Menge um 38 %, im 20-L-Topf um 77 %. Der Deckel `_waterCapPerPot` las den Gießpunkt-Anteil
  (40/35/30 %) als Verbrauch je Guss. Ein eingetragener Drain änderte die Menge nur nach einer getippten Gießmenge, der
  Hebe-Test gar nicht (1800 ml bei jedem Knopf), ein eigener Korridor sperrte die Messung aus. Patricks Vorschlag am Morgen
  lag über 25 echte Blüte-Güsse im Mittel 12,9 % unter seinem Guss (Betrag 15,6 %).
- **Mechanismus** (`ANBAU.md` 1, 5.1, 7.4): Wann gegossen wird, sagt das Restgewicht; wie viel, sagt das Defizit seit dem
  letzten Auffüllen plus Drain — aufgenommen = gegossen · (1 − Drain). In den Topf passt höchstens V = S · (100 − Gießpunkt) /
  80 / (1 − Drain-Ziel); was darüber geht, läuft als Drain ab. Nach dem Abtropfen hält ein Topf dieselbe Wassermenge, egal wie
  viel gegossen wurde. Staunässe kommt vom zu häufigen Gießen, nicht von einer vollen Menge.
- **Jetzt, von Tag 22 bis zum Blüteende (auch in der Photo-Vegi):** Messung heute (Waage vor Hebe-Test). Sonst der
  Nutzer-Faktor aus den letzten bis zu drei belastbaren Güssen, Gewichte 3:2:1. Ein Guss mit Drain-Menge zählt mit seiner
  Mengenbilanz, im Zielfenster als bestätigt; eine übernommene Menge mit Drain-EC bestätigt nur „es kam Drain". Sonst die
  Startkurve: vom Ende der Sämlingsrampe glatt bis 825 ml/Tag × √(Topf/11), erreicht bei Anzucht + 60 % der Blüte.
  Höchstens −25 % / +30 % gegenüber dem jüngsten Guss, nie über V. Ein eigener Korridor gilt nur bis zum ersten eigenen
  Guss. Klima nur als Verhältnis seit dem Guss (Oren et al. 1999), ohne die Wertepaare der alten Autofill-Tabelle. S = 300 ml
  je Liter ist eine Konvention, bis Waage oder Drain sie messen (Fields et al. 2014: 215–425 ml/L).
- **Gemessen:** Elf frische Zyklen ohne fallenden Tag, größter Sprung 12,4 %. Plateau 11 L 3000 ml, 7 L 2350, 20 L 4050,
  Coco 1000, Gießabstand 4 → 3750 (= V). Patricks Güsse: Vorschlag im Mittel +1,9 %, Betrag 7,6 % (vorher −12,9 / 15,6 %).
  „Erledigt" mit 0 % Drain → nächster Guss +21 %, mit 40 % → −25 %. Hebe-Test 70/50/30/20 → 1500/2500/3500/4000 ml im
  11-L-Topf.
- **Anzeigen:** Gießtag-Karte, Guss-Dialog und Lern-Status nennen dieselbe Quelle („aus deinem Guss vom 06.08.", „aus
  deinem heutigen Hebe-Test") und „höchstens ~V ml — mehr passt nicht in den Topf". Am Gusstag steht, was der eingetragene
  Drain für den nächsten Guss bedeutet. Der Gieß-Guide zeigt V statt des alten Deckels. Der Regler „Verlauf: Sanft · Auto ·
  Steil" entfällt, die Rampe ist fest; Tipps und Hilfe sagen es so.
- **Unverändert:** Sämlingsrampe bis Tag 21, Spülen, IceFlush, Outdoor, Hydro, Anzucht-Festmenge.
- **Bewusst angepasst:** `test_drainregelkreis.js` — der Drain wirkt auf den nächsten Guss: gemessen am vorletzten
  Blüte-Guss, Vorschlag am Morgen danach; eine Messung hebt um mindestens 5 %, weil sie mit 3 von 6 zählt.
  `test_gussmenge.js` Fall 4 — ein eigener Korridor zieht die Menge nicht mehr von den gemessenen Güssen weg.
  `test_klimaziel.js` — die neun festgehaltenen Gießvorschläge. `test_korridorsaemling.js` — Tag 22 schließt an die
  Rampe an, oben begrenzt V statt des natürlichen Korridors.
- `test_giessmenge_topf.js` (21 Prüfungen, beide Zeitzonen): Bausteine, elf frische Zyklen, Patricks Güsse, Drain nach
  „Erledigt", Messung heute, Anzeigen, Sämlingsrampe. Gegen den alten Stand: 10 Fehler; zwei Abschnitte liefen dort gar
  nicht, weil es die Funktionen noch nicht gab. Zwei eigene Prüffehler vor dem Commit korrigiert: Sprünge werden an der
  ungerundeten Kurve gemessen (gerundet auf 50 ml wirkt 650 → 750 ml wie 15,4 %), und das Coco-Beispiel gießt täglich, damit
  der Knopf unter der Nachfüll-Grenze wirken kann.

## 2026-09-15 — v1.5.204

- **Die Waage rechnete mit zwei Skalen.** Schritt 2 der Waage-Einrichtung fragt nach dem Gewicht „kurz bevor du
  normalerweise gießen würdest", der Titel sagte „bone-dry". Die Bewertung setzte dieses Gewicht auf 0 %, am normalen
  Gießtag stand „Wasserstress". Das Mengenmodell setzte dasselbe Gewicht auf 20 %. Bei 12500 g (voll 14000, Schritt 2
  11000) zeigte der Eintrag 50 %, das Mengenmodell rechnete mit 60 %. Fehlte eines der beiden Gewichte, schätzte die App es
  mit einer Faustformel (trocken = 35 % von voll, voll = trocken × 2,85), zeigte „~84 %" und bewertete das wie eine Messung
  (Befund der Gießmengen-Prüfung).
- **Warum das zählt:** Wer die Waage nutzt, misst am genauesten und bekam an jedem normalen Gießtag „Wasserstress"
  gemeldet. Ein geschätztes Gewicht, das wie eine Messung bewertet wird, verstößt gegen `ANBAU.md` 15: Messwerte werden
  nie geschätzt.
- **Jetzt:** Eine Skala für Bewertung, Mengenmodell und Verlauf. Das zweite Gewicht ist der Gießpunkt und liegt auf dem
  Anker des Substrats (Erde „Knapp" 30 %, Coco „Mittel" 70 %): Restgewicht = Anker + (100 − Anker) · (Gewicht −
  Gießpunkt-Gewicht) / (voll − Gießpunkt-Gewicht). 12500 g → 65 %, 11000 g → 30 % „Sweet Spot". Die Kapazität des
  Mengenmodells ist (voll − Gießpunkt) · 80 / (100 − Anker). Mit nur einem Gewicht steht „Zweites Gewicht fehlt", ohne Zahl.
  Einrichtung, Einstellungen und Beschriftung sagen „voll" und „kurz vor dem Gießen" statt „Saturated", „Dry" und
  „bone-dry".
- **Für bestehende Waage-Nutzer:** Dieselben Gewichte zeigen jetzt ein höheres Restgewicht (am Gießpunkt 30 statt 0 %).
  Patricks Daten sind nicht betroffen, er nutzt den Hebe-Test.
- `test_waageskala.js` (15 Prüfungen, beide Zeitzonen): Skala für Erde und Coco, Eintrag bei 12500 g und 11000 g, Coco,
  Beschriftung, Kapazität und Restgewicht im Mengenmodell, nur ein Gewicht, Einrichtung, Quelltext. Gegen den alten Stand:
  12 Fehler.

## 2026-09-15 — v1.5.203

- **Die Gießanleitung sagte fest „CalMag zuerst".** Im Eintrag stand „🧪 Mischen: CalMag zuerst → umrühren → Basisdünger →
  Additive", der Coco-Hinweis „CalMag zuerst einrühren", die Vorlage für eigene Pläne „CalMag zuerst". Seit v1.5.109 kommt
  die Reihenfolge in der Tipps-Karte aus dem Plan, hier nicht (Befund der Gießmengen-Prüfung).
- **Warum das zählt:** Für jeden Plan mit Silikat ist das die falsche Reihenfolge. Silikat ist stark alkalisch und fällt mit
  Calcium sofort als Calciumsilikat aus; beides ist dann für die Pflanze verloren (`ANBAU.md` 10). Patricks Rainbow-Plan
  für Run 02 führt Silica Force zuerst.
- **Jetzt:** Die Mischen-Zeile nennt das erste Produkt aus der Mischreihenfolge des Plans, der am Zyklus hängt
  (`_planAnsicht`), dann „der Rest in der Reihenfolge deines Plans". Ohne Reihenfolge: ein Silikat zuerst, falls vorhanden,
  dann CalMag. Der Coco-Hinweis sagt „CalMag gehört in jede Mischung", ohne Rangfolge.
- `test_mischzeile.js` (7 Prüfungen, beide Zeitzonen): Patricks Plan, ein Plan mit Silikat an erster Stelle,
  Coco-Hinweis, Quelltext. Gegen den alten Stand: 4 Fehler.

## 2026-09-15 — v1.5.202

- **„Lieber einen Tag länger warten" schickte die Pflanze in den Wasserstress.** Der Master-Tipp in den Tipps sagte
  „Unsicher ob trocken genug? Warte einen Tag länger! Von leicht hängenden Blättern erholt sich die Pflanze in 2h", die
  Gießanleitung für Erde „Lieber 1 Tag länger warten. Hängende Blätter = 2h Erholung". Die Diagnose „Überwässerung" riet
  „Mehrere Tage pausieren, dann kleinere Mengen" (Befund der Gießmengen-Prüfung; in der Übergabe seit v1.5.197 notiert).
- **Warum das zählt:** Hängen die Blätter, sind die Spaltöffnungen längst zu, und die Photosynthese steht (`ANBAU.md`
  2.2). Bei Automatics ist jeder solche Tag ein dauerhafter Ertragsverlust (9). Staunässe entsteht durch verdrängte Luft,
  also durch zu häufiges Gießen oder Wasser im Untersetzer (1, 13.1). In einem Topf mit Abfluss läuft, was nicht mehr
  hineinpasst, als Drain ab. Eine kleinere Menge macht den Topf nicht luftiger, sie lässt nur den Drain weg, der die Salze
  ausspült (5.1).
- **Jetzt:** „Unsicher? Morgen wieder anheben — nicht warten, bis die Blätter hängen. Nass macht zu häufiges Gießen oder
  Wasser im Untersetzer, nicht eine volle Menge mit Drain." Die Diagnose sagt: Untersetzer leeren, danach nicht öfter
  gießen, als der Hebe-Test sagt. Die Coco-Anleitung bleibt.
- `test_giesstipps.js` (7 Prüfungen, beide Zeitzonen): Master-Tipp, Gießanleitung Erde und Coco, Diagnose, Quelltext.
  Gegen den alten Stand: 4 Fehler.

## 2026-09-15 — v1.5.201

- **Der Gieß-Guide rechnete die Drain-Menge mit 10 %.** Beim Öffnen und live beim Tippen stand bei Patrick „1300 ml →
  130 ml Drain", zwei Zeilen tiefer in derselben Gießanleitung „15–20% Drain bei jedem Guss" (Befund der
  Gießmengen-Prüfung).
- **Warum das zählt:** Wer der Zahl folgte, hörte bei der Hälfte des Ziels auf. Unter 10 % Durchfluss misst ein Drain
  nicht die Wurzelzone, sondern eine Randfraktion (`ANBAU.md` 5.1), und die Salze, die der Drain ausspülen soll, bleiben im
  Topf.
- **Jetzt:** Die Drain-Zeile nennt die Spanne aus `DRAIN_ZIEL` („1300 ml → 195–260 ml Drain"), beim Öffnen und beim Tippen
  gleich. Die Gießanleitung liest dieselbe Konstante.
- Bewusst angepasst: `test_drainzieltexte.js` erwartete in der Gießanleitung die feste Schreibweise „15–20% Drain"; die
  Zeile kommt jetzt aus `DRAIN_ZIEL` („15–20 % Drain").
- `test_draingieguide.js` (7 Prüfungen, beide Zeitzonen): Spanne beim Öffnen, Gießanleitung, live bei 3000 ml
  (450–600 ml), Quelltext. Gegen den alten Stand: 4 Fehler.

## 2026-09-15 — v1.5.200

- **Coco bekam die Gießpunkt-Zahlen von Erde.** Die Hebe-Test-Vorgabe sprang am fälligen Gießtag für jedes Substrat auf
  30 % („Knapp"). Die Coco-Bewertung meldete damit an jedem Gießtag „Wasserstress" (Befund der Gießmengen-Prüfung). Im
  Hard-Dryback und am IceFlush-Tag hieß es in Coco „noch zu feucht" bis unter 40 %. Banner, Checkliste, Timeline und die
  Karte vor dem Spülen nannten 25–40 %. Die Dryback-Vorhersage zielte auf 60 %, der Knopf „Mittel" steht für 70.
  Gießanleitung und Sämlings-Hinweis nannten „~60–70 %", die Bewertung sagt „Jetzt gießen" von 60 bis 85 %.
- **Warum das zählt:** Coco hat kaum Austauschkapazität und verzeiht Austrocknen schlecht (`ANBAU.md` 7.1). Wer im
  Hard-Dryback der App folgte, ließ einen Coco-Topf bis in den Bereich trocknen, den dieselbe App sonst „Wasserstress"
  nennt — in den letzten Tagen vor der Ernte. Für den Zweck des Hard-Drybacks, Platz für das Schmelzwasser im Topf, reicht
  der Coco-Gießpunkt.
- **Jetzt:** `GIESSPUNKT.coco` (60–85 %, Knopf „Mittel", Anker 70) steht neben `GIESSPUNKT.erde` (25–40 %, „Knapp",
  30), dazu `giesspunktFor(c)`. Bewertung, Vorgabe, Vorhersage, Hard-Dryback, IceFlush-Tag, Banner, Checkliste, Timeline,
  Karte vor dem Spülen, Gießanleitung und Sämlings-Hinweis lesen daraus. Das Lexikon „Hard Dryback" nennt beide Substrate.
  Erde bleibt unverändert.
- Bewusst angepasst: `test_giesspunktzahlen.js` prüfte den Sämlings-Hinweis am alten Ausdruck
  (`c.medium === 'coco' ? …`); er prüft jetzt `giesspunktFor(c)`.
- `test_cocogiesspunkt.js` (18 Prüfungen, beide Zeitzonen): Konstante, Vorgabe am fälligen Gießtag für Coco und Erde,
  Coco-Grenzen, Hard-Dryback-Bewertung für Coco und Erde, Banner, IceFlush-Status, Checkliste und Timeline in Coco,
  Vorhersage, Gießanleitung, Lexikon, Quelltext. Gegen den alten Stand: 12 Fehler.

## 2026-09-15 — v1.5.199

- **Zwei Stellen rechneten nach v1.5.195 weiter mit einem eigenen Finisher-Band.** Die Dryback-Vorhersage
  (`drybackForecast`) zielte in den letzten 14 Tagen vor der Ernte auf 35 % statt auf den Gießpunkt (im Code: „bewusster
  Stress-Korridor"). Der Hebe-Test trug im Eintrag ein rotes Schild „FINISHER", auch am IceFlush-Tag, als gälten dort
  andere Grenzen.
- **Warum das zählt:** Seit v1.5.195 gilt derselbe Gießpunkt bis zur Ernte. Einen trockeneren Topf in den letzten zwei
  Wochen stützt kein belegter Mechanismus (`ANBAU.md` 14). Die Vorhersage „gießen voraussichtlich …" lag dadurch zu früh,
  und das Schild kündigte eine Regel an, die es nicht mehr gibt.
- **Jetzt:** Das Ziel der Vorhersage ist in jeder Blütewoche der Gießpunkt, das Schild entfällt. `contextFor` kennt das
  Finisher-Fenster weiter, andere Stellen nutzen es.
- `test_finisherreste.js` (8 Prüfungen, beide Zeitzonen): Vorhersage an einem Finisher-Blütetag (Ziel 30 %, bei 55 %
  und 10 Punkten je Tag in 3 statt 2 Tagen) und an einem normalen Blütetag, Hebe-Test am IceFlush-Tag ohne Schild,
  Quelltext. Gegen den alten Stand: 4 Fehler.

## 2026-09-15 — v1.5.198

- **Die IceFlush-Anleitung sagte noch „Hard Dryback auf 35 %" — v1.5.196 hatte sieben Stellen übersehen.** Am IceFlush-Tag
  stand in „Schritt für Schritt" und in der Timeline: „Hard Dryback auf 35% — letzter Guss mit CalMag 0.2 ml/L", „Töpfe
  auf Drain-Schalen kontrollieren (Schmelzwasser läuft ab)", „Drain EC messen (sollte ≤ 0.4 mS/cm)" und „Topf bleibt
  knochentrocken bis zur Ernte!". Die Hebe-Test-Vorgabe rechnete am IceFlush-Tag mit 20 % („knochentrocken") und an
  Spültagen mit 35 %. Bei Patrick stand am IceFlush-Tag ohne eigene Messung deshalb „IceFlush bereit — Hard Dryback
  erreicht" und „~20 % Restgewicht — perfekt für IceFlush". Dazu die Bewertung in der IceFlush-Phase („er nimmt das
  Schmelzwasser langsam auf"), der Plan „BioBizz Master" in Woche 12 („Topf nach dem Flush knochentrocken werden lassen")
  und der Notiz-Vorschlag am IceFlush-Tag („dann Drain EC messen (≤0.4 erwartet)").
- **Warum das zählt:** 20 % liegt unter dem Gießpunkt. Dort meldet dieselbe App sonst Wasserstress, und hier stand
  „perfekt", einen Tag vor der Ernte. Der einzige belegte Zweck des Hard-Drybacks ist, dass das Schmelzwasser im Topf
  bleibt (`ANBAU.md` 14). Dann läuft kein Drain, dessen EC man messen könnte, und der Topf ist nach dem Eis nicht
  knochentrocken.
- **Jetzt:** Die Vorgabe ist in jeder Phase der Knopf „Knapp" (30 %). Am IceFlush-Tag heißt es „IceFlush bereit —
  Gießpunkt erreicht", unter 25 % „Topf trockener als der Gießpunkt" mit dem Rat, bei hängenden Blättern erst einen kleinen
  Guss klares Wasser zu geben. Anleitung und Timeline: Untersetzer unter die Töpfe, Hard-Dryback bis zum Gießpunkt, nach
  dem IceFlush bis zur Ernte nicht mehr gießen, außer die Blätter hängen. „Drain EC messen" entfällt in der Anleitung, in
  der Timeline und im Notiz-Vorschlag. Den Punkt „Drain EC nach letztem Spülen ≤ 0.4" in der Checkliste prüft ein eigener
  Schritt (Spülende ohne feste Drain-EC).
- **Daraus zu lernen:** Die Quelltext-Suche in `test_harddryback.js` suchte „~35%"; „Hard Dryback auf 35%" ohne Tilde
  fiel durch. Gefunden hat es erst das Durchklicken am IceFlush-Tag in der Vorschau.
- `test_iceflushreste.js` (12 Prüfungen, beide Zeitzonen): IceFlush-Anleitung, Hebe-Test-Vorgabe am Spül- und
  IceFlush-Tag, IceFlush-Status ohne Messung und bei 20 %, Bewertung in der IceFlush-Phase, Plan-Tipp, Quelltext
  (auch der Notiz-Vorschlag). Gegen den alten Stand: 9 Fehler.

## 2026-09-15 — v1.5.197

- **Die Frage „wann gießen?" hatte bis zu sieben Zahlen.** Infotext „Restgewicht": „auf etwa 40 %"; Lexikon
  „Restgewicht": eine Tabelle je Phase mit 50–60 / 40–50 / 35–45 / 25–35 %; Lexikon „Sämlingsphase": „50–55 % (sanft,
  nicht 40 %)"; „35–40 %" im Infotext „Trauermücken", zweimal im Lexikon „Trauermücken" und in „Wurzelfäule"; Diagnose
  „Überwässerung": „unter 45 %"; der Sämlings-Hinweis nach dem Anlegen eines Zyklus: „Tag 9+: ~40 %, ab Tag 15
  ~30–40 %"; das abgeschaltete Restgewicht-Diagramm: fest 30–50 %. Bewertet wird aber mit einem Gießpunkt: 25–40 %,
  Hebe-Test „Knapp".
- **Warum das zählt:** Wer der Tabelle folgte, goss in der Anzucht bei 50–60 %, wo die Bewertung der App noch „Bald
  gießen" sagt. Zu häufiges Gießen verdrängt die Luft aus dem Topf (`ANBAU.md` 1, 13.1). Und die Zahl stand ohne
  Gültigkeitsbedingung da: Beim Sämling im großen Topf wiegt vor allem Substrat ohne Wurzeln, der Hebe-Test zeigt dann nur,
  ob der Topf noch nass ist (`ANBAU.md` 1, 7.4).
- **Jetzt:** Alle Stellen nennen den Gießpunkt aus `GIESSPUNKT` — in Erde „Knapp", 25–40 %, in jeder Phase bis zur Ernte;
  Coco „Mittel". Die Zahl gilt ab Tag 25 (`DRAIN_AB_TAG`: ab dann zieht ein Guss den ganzen Topf durch), davor wird an den
  Gießtagen der App gegossen. Der Sämlings-Hinweis nennt den Gießpunkt je Substrat. Mit gestrichen, weil ohne Beleg: „der
  Stress des Antrocknens triggert die massenhafte Ausschüttung von Wuchshormonen". Belegt ist, dass Wurzeln dorthin
  wachsen, wo Wasser war und jetzt Sauerstoff ist (`ANBAU.md` 1).
- **Bewusst nicht angefasst:** die Gates im Rainbow-Plan (40 / 35 / 30 %, Flush-Gate 32–35 %, Hard Dryback 25–30 %). Sie
  stammen 1:1 aus Patricks Plan-Blatt und liegen im Gießpunkt-Band. Die Diagnose „Überwässerung" rät weiter „dann kleinere
  Mengen" — das gehört zum Umbau der Gießmenge (Übergabe 0m.1).
- `test_giesspunktzahlen.js` (14 Prüfungen, beide Zeitzonen): Infotexte „Restgewicht" und „Trauermücken", Lexikon
  „Restgewicht", „Trauermücken", „Wurzelfäule" und „Sämlingsphase", Diagnose „Überwässerung" und „Trauermücken",
  Sämlings-Hinweis, Diagramm-Legende, Quelltext. Gegen den alten Stand: 12 Fehler.

## 2026-09-15 — v1.5.196

- **Der Hard-Dryback zielte auf ~35 % — nasser als der eigene Gießpunkt.** Hebe-Test-Bewertung, Banner und IceFlush-Status
  im Eintrag, IceFlush-Checkliste, die Karte vor dem Spülen, der Wochen-Tipp in „BioBizz konservativ" und das Lexikon
  nannten „auf etwa 35 % abtrocknen". Der Gießpunkt der App liegt bei 25–40 % (Knopf „Knapp" = 30 %). Gemessen: Bei 30 %
  stand „Auf dem Weg zu ~35 % — nicht gießen", unter 30 % „Federleicht — bereit für den IceFlush", auch bei 20 %, wo
  dieselbe Funktion sonst Wasserstress meldet. Das Lexikon setzte hinzu: „35 % ist Ziel, 30 % ist Untergrenze" und „unter
  30 % können Wurzeln absterben" — genau Patricks Gießpunkt.
- **Warum das zählt:** Der einzige belegte Zweck des Hard-Drybacks ist, dass das Schmelzwasser im Topf bleibt, statt als
  Drain durchzulaufen; dafür reicht der Gießpunkt (`ANBAU.md` 14). Ein Ziel über dem Gießpunkt ist kein Dryback, und
  „federleicht" unter 25 % ist Wasserstress (13.1) — in den Tagen vor der Ernte.
- **Jetzt:** Eine Regel an allen Stellen, aus `GIESSPUNKT`: nicht gießen, bis der Topf den Gießpunkt erreicht; dann
  „Gießpunkt erreicht — bereit für den IceFlush"; unter 25 % „Trockener als der Gießpunkt — Blätter prüfen", und hängen
  sie, ein kleiner Guss. Der IceFlush-Status nennt „bereit" unter 40 % — dieselbe Grenze wie die Bewertung. Mit gestrichen,
  weil ohne Beleg: CalMag 0,2 ml/L im letzten Guss (der letzte Guss ist ein Spülgang), Drain-EC ≤ 0,4 als Ziel im Lexikon
  „Hard Dryback", die „Kontaktzeit für den Kältereiz", „Trichome 70 %+ milchig" und der 100-ml-Mini-Guss. Die Endspurt-Tage
  bleiben unverändert.
- **Was Patrick im nächsten Endspurt sieht:** Bei seinen 30 % steht „Gießpunkt erreicht — bereit für den IceFlush" statt
  „Auf dem Weg zu ~35 %".
- `test_harddryback.js` (16 Prüfungen, beide Zeitzonen): Bewertung bei 50, 40, 39, 30, 25, 24 und 20 %, Banner am
  Hard-Dryback-Tag, IceFlush-Status bei 45, 40 und 38 % (bei 40 % hieß es vorher „bereit"), Checkliste, Lexikon „Hard
  Dryback" und „IceFlush", Plan-Tipp, Quelltext. Gegen den alten Stand: 11 Fehler.

## 2026-09-15 — v1.5.195

- **Kurz vor der Ernte schob die Hebe-Test-Bewertung die Pflanze in den Wasserstress.** In den letzten zwei Wochen
  (Finisher) sagte `classifyRestPct` bei 25–29 % Restgewicht „Noch warten — Warten bis spürbar federleicht", während
  dieselbe Funktion unter 25 % „Wasserstress" meldet. Bei 40–50 % hieß es „Noch warten" statt „Bald gießen". Begründet war
  das eigene Band (30–40 %) mit einem bewusst trockenen Topf vor der Ernte; einen Mechanismus dafür gibt es nicht, ein
  Harz-Plus durch Trockenstress ist nicht belegt (`ANBAU.md` 14, v1.5.144). Befund der Begriffe-Prüfung, gemessen.
- **Warum das zählt:** Wer bei 27 % auf „federleicht" wartet, gießt erst im Stress — nach `ANBAU.md` 13.1 ist das kein
  Trick, sondern Schaden an den Wurzeln, in der Phase, in der die Blüten am meisten Wasser bewegen.
- **Jetzt:** Der Finisher hat kein eigenes Band mehr. Bis zur Ernte gilt derselbe Gießpunkt: 25–40 % „Sweet Spot — jetzt
  gießen" (Knopf „Knapp" = 30 %), darüber „Bald gießen" bzw. „Noch feucht", unter 25 % Wasserstress. `GIESSPUNKT.finisher`,
  `T.water.finisherReady` und `finisherWait` entfallen; der Einstellungstext sagt, dass das bis zur Ernte gilt. Die
  Gießmenge ist davon nicht berührt — sie folgt weiter ihrem eigenen Modell bis zum Gießmengen-Umbau.
- `test_finisherband.js` (9 Prüfungen, beide Zeitzonen): 13 Restgewicht-Werte im Finisher gegen den Normal-Modus,
  `GIESSPUNKT`, Einstellungen, Quelltext. Gegen den alten Stand: 7 Fehler. Bewusst angepasst: `test_giesspunkttexte.js`
  (erwartete den eigenen Finisher-Status und den Einstellungstext mit `GIESSPUNKT.finisher`).

## 2026-09-15 — v1.5.194

- **Beim Trocknen und im Curing warnte der Eintrag vor Pflanzenschäden an einer geschnittenen Pflanze.**
  `getEntryWarnings` kannte dafür keine Phase: Im Trockenraum stand bei 17 °C „Fällt die Wurzelzone unter 16 °C, brechen
  Phosphor- und Wasseraufnahme ein", bei 14 °C „das Wachstum stockt", bei 30 °C „Stoffwechsel bremst. Ziel: 22–28 °C bei
  Licht an" — direkt neben der Zielzeile „Trocknen: 18–20 °C" — und bei 33 °C „Hitzestress (Taco-Blätter)". In der
  Dunkelphase und am Erntetag kam über 32 °C ebenfalls „Taco-Blätter", obwohl dieselben Tage ab 29 °C den Terpen-Hinweis
  zeigen.
- **Warum das zählt:** „Ziel 22–28 °C" beim Trocknen widerspricht der Zielzeile daneben — und trocknet nach `ANBAU.md`
  12.1 zu schnell: Die Außenseite verhornt, die leichten Terpene gehen zuerst.
- **Jetzt:** Beim Trocknen und im Curing gibt es keine Pflanzen-Warnung zur Temperatur; die Zielzeile im Umgebungsblock
  bewertet sie gegen `TROCKNEN_KLIMA` und zeigt 17 °C weiter mit ⚠. In Dunkelphase und am Erntetag gilt über 32 °C der
  Terpen-Hinweis, als Fehler-Stufe.
- `test_trockenwarnungen.js` (10 Prüfungen, beide Zeitzonen): Trocknen und Curing bei 14, 17, 30 und 33 °C, die
  Zielzeile beim Trocknen, Dunkelphase und Erntetag bei 33 °C, Gegenprobe späte Blüte. Gegen den alten Stand: 4 Fehler.

## 2026-09-15 — v1.5.193

- **Die Diagnose nannte die Luftfeuchte „hoch", wo der Eintrag „im Ziel" sagte — und umgekehrt.** `buildDiagnosticContext`
  setzte „Luftfeuchte hoch" in jeder Phase fest ab 70 % oder bei einer Schimmelwarnung. Seit v1.5.187 bewertet der Eintrag
  die Luft je Phase aus `KLIMA_ZIEL`. Folge: Der Sämling unter der Haube bei 24 °C / 74 % — im Eintrag „Sämling ✓", Ziel
  62–75 % — bekam im Symptom-Checker „Luftfeuchte hoch" als Grund; die Anzucht bei 24 °C / 66 % und die späte Blüte bei
  24 °C / 55 % — im Eintrag „Zu feucht" — nicht.
- **Warum das zählt:** Die Luftfeuchte ist im Symptom-Checker ein Grund für Calcium-Mangel (zu wenig Verdunstung,
  `ANBAU.md` 1) und für Schimmel (13.5). Beim Sämling schob sie Diagnosen nach vorn, die dort nicht passen; bei zu feuchter
  Luft in Anzucht und Blüte fehlte sie.
- **Jetzt:** „Luftfeuchte hoch" genau dann, wenn der Eintrag für dieselben Werte „Zu feucht", „Schimmel…" oder „Nass" zeigt
  (`klimaStatus`). Ohne Temperatur zählt das Fenster bei der mittleren Temperatur der Phase, wie die Luftfeuchte-Zeile im
  Eintrag. Draußen und beim Trocknen bleibt die 70-%-Grenze.
- `test_rlfdiagnose.js` bewusst neu gefasst (17 Prüfungen, beide Zeitzonen): elf Lagen vom Sämling bis zum Spülen bei 24 °C,
  jede gegen die Pille des Eintrags; ohne Temperatur; Trocknen. Gegen den alten Stand: 3 Fehler — genau die drei
  Widersprüche. Die früheren Erwartungen „Anzucht 66 % → nein" und „Spätblüte 59 % → nein" galten für die feste
  70-%-Grenze.

## 2026-09-15 — v1.5.192

- **Um IceFlush, Dunkelphase und Ernte standen Zusagen, die `ANBAU.md` 14 als unbelegt führt.** Lexikon „Dunkelphase vor
  der Ernte" und „Erntetag — Schnitttechnik": „Cannabinoide und Terpene sind nachts maximal in den Buds konzentriert
  (Pflanze hat hochgepumpt)", „jede Stunde Verzögerung kostet messbar Aroma", „kurze Lichtimpulse können den Effekt
  zunichte machen", der Effekt sei „in Studien teilweise widersprüchlich nachgewiesen". Lexikon „IceFlush": Die Pflanze
  „interpretiert den Temperatursturz als nahenden Winter", IceFlush und Dunkelheit „ergeben einen Synergie-Effekt — alle
  Reserven gehen in die Blüten", bei grünen Genetiken „funktioniert der Trichom-Effekt trotzdem". Das Banner in der
  Dunkelphase: „Pflanze produziert auf Hochtouren Trichome. Geduld!"
- **Dazu Physik, die nicht aufging:** „Salze werden ausgespült, da das Schmelzwasser durch das Substrat zieht" und „nach
  dem Schmelzen Drain-EC messen — sollte < 0,4 sein" — beim IceFlush in den abgetrockneten Topf läuft gerade kein Drain,
  dafür ist der Hard-Dryback da. „Grünes Licht wird von der Pflanze nicht photosynthetisch verarbeitet" — es treibt die
  Photosynthese und dringt tiefer ins Blatt als rotes (Terashima et al. 2009, Plant Cell Physiol 50:684). Zahlen ohne
  Messung: die Wurzelzone bleibe bei 1 L Eis „sicher im 8–12-°C-Bereich", Botrytis „tötet Buds in 24 h".
- **Warum das zählt:** Die App plant IceFlush und Dunkelphase sauber ein, weil Grower sie machen wollen — eine Wirkung
  versprechen darf sie dafür nicht (`ANBAU.md` 14). Und wer nach dem IceFlush den Drain-EC messen will, wartet auf
  Wasser, das nicht kommt.
- **Jetzt:** Die Texte sagen, was belegt ist: Terpene verdunsten bei Wärme und Licht schneller, deshalb kühl und früh
  schneiden; ein Wirkstoff- oder Trichom-Effekt ist nicht belegt; das Schmelzwasser bleibt im Topf. In der Dunkelphase
  darf man zum Nachsehen kurz Licht machen — wichtiger ist die Luftfeuchte, das Banner nennt den Deckel von 60 %.
- `test_iceflushzusagen.js` (12 Prüfungen, beide Zeitzonen): Lexikon „Dunkelphase vor der Ernte", „IceFlush",
  „Erntetag — Schnitttechnik" und „Schimmel (Botrytis)", das Banner am mittleren und am letzten Dunkeltag, Quelltext.
  Gegen den alten Stand: 9 Fehler.

## 2026-09-15 — v1.5.191

- **Das Lexikon erklärte die Tag-Nacht-Differenz verkehrt herum.** „Temperatur": „hohe Differenz = stauchere Pflanze,
  niedrige Differenz = streckendes Wachstum". Belegt ist das Gegenteil: Je wärmer der Tag gegenüber der Nacht, desto
  länger die Internodien; Tag- und Nachttemperatur wirken dabei jede für sich (Carvalho et al. 2002, Ann Bot 90:111). Wer
  mit großem Unterschied kompakt halten wollte, bekam mehr Stretch. Im selben Eintrag: „ab 30 °C kippt der Effekt —
  Enzyme denaturieren" — die Photosynthese von Cannabis ist um 30 °C am höchsten (Chandra et al. 2008, `ANBAU.md` 2.2).
- **Kühle Nächte versprachen mehr, als belegt ist.** Die FAQ „Warum sind kühle Nächte in der Blüte gut?" nannte bei
  10–15 °C dichtere Buds, intensiveres Aroma und etwas mehr Harz; der Eintrag „Anthocyane" sagte „Temperaturdifferenz ist
  der Schlüssel", der Outdoor-Wetterhinweis „dichtere Buds" und „Terpen-Erhalt". In einem Versuch mit Cannabis färbten
  gleichmäßig 8–15 °C am stärksten, ein Wechsel aus warmem Tag und kalter Nacht weniger — und Trockengewicht und CBD
  waren bei 22 °C am höchsten (Kim et al. 2025, J Cannabis Res). Farbe kostet Ertrag; die übrigen Vorteile sind nicht
  belegt. Die Frage heißt jetzt „Sind kühle Nächte in der Blüte gut?".
- **„Phosphor-Lockout unter 18 °C" an fünf Stellen** — Lexikon „Temperatur" und „Kältestress", die Eintrags-Warnung ab
  17 °C, die Phosphor-Diagnose, dazu „Wurzelschäden drohen" unter 15 °C. `ANBAU.md` 7.3 setzt die Grenze an die
  Wurzelzone: Unter 16 °C brechen Phosphor- und Wasseraufnahme ein. Die Phosphor-Diagnose begann mit „P-reiche
  Blüh-Dünger jetzt" — bei kalter Wurzelzone oder falschem pH hilft mehr Dünger nicht (`ANBAU.md` 13.3). Sie nennt jetzt
  zuerst diese beiden Prüfungen.
- **Warum das zählt:** Ein verdrehter Mechanismus führt zur falschen Handlung — hier zu mehr Stretch, zu kühlen Nächten
  mit steigender Luftfeuchte in der Spätblüte und zu Dünger gegen ein Temperaturproblem.
- `test_temperaturtexte.js` (15 Prüfungen, beide Zeitzonen): Lexikon „Temperatur", „Anthocyane" und „Kältestress", FAQ,
  Phosphor-Diagnose, Eintrags-Warnungen bei 17 und 14 °C, Quelltext. Gegen den alten Stand: 13 Fehler. Bewusst angepasst:
  `test_dunkelphase.js` — seine Gegenprobe suchte den alten Wortlaut „unter 18"; sie prüft jetzt, dass die Warnung bei
  17 °C in der späten Blüte weiter erscheint.

## 2026-09-15 — v1.5.190

- **Lexikon, Infotexte und Diagnose nannten noch die Klimazahlen von vor Option B.** Seit v1.5.187 rechnet der
  Tageseintrag mit `KLIMA_ZIEL`; die Texte blieben stehen und widersprachen ihm. Lexikon „VPD": Spätblüte 1,4–1,6 kPa bei
  18–24 °C und 40–50 %, dazu „gezielt auf 1.4–1.6 kPa fahren". „Luftfeuchtigkeit": mittlere Blüte 45–55 %, frühe Blüte
  50–60 %, Anzucht 55–70 %. „Temperatur": späte Blüte 18–24 °C, „gezielt absenken für Farben". „Vegetationsphase"
  22–26 °C und 50–70 %, „Blüte-Phasen" 20–24 °C und VPD 1,2–1,6, „Dunkelphase" 16–19 °C und 40–50 %, „Spülung" 20–24 °C
  und 40–50 %. Der VPD-Infotext: „Richtwert in der Blüte: 0.8–1.2 kPa". Die Diagnose: „über 1.5 kPa = trocken-Stress",
  bei Knospenfäule „Luftfeuchte unter 50 % senken", typisch „ab RLF über 55 %". Drei Notiz-Vorschläge. Die
  Outdoor-VPD-Hinweise „In der Spätblüte sind 1.4–1.6 kPa ideal" und „RLF rauf auf 65–75 %". Die Warnung über 80 % RLF
  sagte „(außer in Trocknung)" — drinnen erschien sie nur noch beim Trocknen und im Curing.
- **Warum das zählt:** Wer im Lexikon nachliest, warum der Eintrag „zu feucht" meldet, fand dort für die mittlere Blüte
  45–55 % als Ziel — Werte, die der Eintrag bei 24 °C zum Teil „zu feucht" nennt. Zwei Antworten auf dieselbe Frage.
- **Jetzt:** Alle diese Texte kommen aus `KLIMA_ZIEL` und `klimaRlfFenster` (`_klimaLexTemperatur`, `_klimaLexRlf`,
  `_klimaLexVpd`, `_klimaLexZeile`, `_klimaLexListe`, `_vpdBandKurz`). Das Lexikon wird beim Laden gebaut und rechnet
  deshalb mit 2 K Blattabzug — das steht dabei; der Eintrag rechnet mit der Einstellung. Für die Nacht nennt es keine
  erfundene Zielzahl, sondern die zwei belegten Grenzen: Wurzelzone nicht unter 16 °C (`ANBAU.md` 7.3) und den
  Schimmel-Deckel, der auch nachts gilt (13.5). Die Warnung über 80 % nennt beim Trocknen das Trockenklima und im
  Curing die Feuchte im Glas. Beim Umschreiben mit gestrichen, weil ohne Beleg: „riskiert Zwitter" im VPD-Infotext und
  „die Pflanze ist gestresster und reagiert empfindlicher" beim Spülen.
- **`ANBAU.md` 2.2:** Vier Luftfeuchte-Spannen der Tabelle wichen um 1 % von der Anzeige ab (Rundung: Anzucht bei
  28 °C, frühe Blüte bei 23 und 27 °C, mittlere Blüte bei 24 °C). Sie stammen jetzt aus derselben Funktion.
- `test_klimatexte.js` (24 Prüfungen, beide Zeitzonen): acht Lexikon-Einträge, VPD-Infotext, Hitzestress-Diagnose,
  Knospenfäule, Outdoor-Hinweise und die Warnung beim Trocknen — geprüft gegen dieselben Funktionen, mit denen der
  Eintrag rechnet; dazu der Quelltext. Gegen den alten Stand: 21 Fehler. Bewusst angepasst: `test_lexikon.js` — die zwei
  Prüfungen „Spätblüte weiterhin 1,4–1,6 kPa / 40–50 %" prüfen jetzt 1,2–1,5 kPa und den Deckel 60 % (Patricks
  Entscheidung vom 15.09.2026).

## 2026-09-15 — v1.5.189

- **Das abgeschaltete VPD-Diagramm rechnete noch mit fest 0,8–1,2 kPa.** Beim Abgleich der Klimazahlen gefunden: Der
  Bereich „Verlauf & Charts" (`buildChartsSection`) färbte jeden VPD-Punkt gegen 0,8–1,2 kPa und schrieb dazu „Grüner
  Bereich: 0.8–1.2 kPa (Blüte optimal) · Spätblüte: gezielt 1.4–1.6". Gegen die Bewertung im Eintrag gerechnet
  widersprach die Farbe an Patricks 86 Klimatagen 50-mal — jeder Sämlingstag wäre orange gewesen.
- **Sichtbar ist davon nichts.** Der Bereich ist abgeschaltet (`renderDash`: `chartsHTML = ''`), weil er in der
  App-Vorschau nie zuverlässig dargestellt wurde; die Startseite zeigt nur die Mini-Verläufe für Wasser, pH und EC.
  Laut Kommentar bleibt er im Code, um ihn mit einer Zeile wieder einzuschalten — und hätte dann den Zielen
  widersprochen, mit denen die App seit v1.5.187 rechnet.
- **Jetzt:** Jeder Punkt trägt den Befund aus `klimaStatus` — dieselbe Quelle wie die Pille im Eintrag. Grün = im Ziel
  der Phase, orange = daneben oder Schimmelgefahr, türkis = ohne VPD-Ziel (Dunkelphase, Erntetag, Trocknen, draußen).
  Die Legende kommt aus `KLIMA_ZIEL` (`_vpdDiagrammLegende`), der Tipp auf einen Punkt zeigt Stufe, Befund und Ziel.
- **Daraus zu lernen:** Erst die Aufrufer suchen, dann ändern. Ich hatte das Diagramm für sichtbar gehalten; erst die
  Suche nach der Stelle für die Browser-Prüfung zeigte, dass `buildChartsSection` nirgends aufgerufen wird. Ein grüner
  jsdom-Test sagt darüber nichts.
- `test_vpddiagramm.js` (14 Prüfungen, beide Zeitzonen): Balkenfarbe gegen die Pille des Eintrags an allen 86
  Klimatagen, Legende, Tooltip, Dunkeltag mit und ohne Schimmelgefahr, draußen, Quelltext. Gegen den alten Stand:
  10 Fehler.

## 2026-09-15 — v1.5.188

- **In der Dunkelphase und am Erntetag riet die App zum Heizen.** Beim Durcharbeiten der Klimatexte gefunden:
  `KLIMA_ZIEL` (v1.5.187) gab dem IceFlush und dem Erntetag das Band der späten Blüte, und `klimaStufe` unterschied den
  IceFlush-Tag nicht von den Dunkeltagen danach. Im dunklen Zelt bei 18 °C / 55 % stand „Luft zu feucht am IceFlush:
  Temperatur auf 22–26 °C anheben, dann Luftfeuchte auf 32–43 % bei 22 °C senken" — am Erntetag dasselbe, dazu bei 17 °C
  „Phosphor-Lockout droht" und bei 14 °C „Heizen!". Das Lexikon rät für dieselben Tage zu einem kühlen Zelt.
- **Warum das falsch ist:** Das VPD-Band beschreibt den Antrieb der Transpiration bei Licht. Nachts verdunstet eine Pflanze
  typisch nur 5–15 % der Tagesmenge (Caird, Richards & Donovan 2007, Plant Physiol 143:4), und ohne Verdunstung entfällt
  der Blattabzug (`ANBAU.md` 2.1). Heizen hätte nur die Terpene schneller verdunsten lassen (`ANBAU.md` 14). Am Erntetag
  wird vor dem Lichtangang geschnitten, danach gilt das Trockenklima.
- **Jetzt:** `phase()` zählt die Ice-Tage (`iceDay`, in beiden Phasen-Pfaden), `klimaStufe` liefert ab dem zweiten
  Ice-Tag die neue Stufe `dunkel`. Dunkelphase und Erntetag haben kein VPD-Band und kein Temperaturziel, nur den
  Schimmel-Deckel 60 % (kritisch). Der Satz lautet „✓ Luftfeuchte passt in der Dunkelphase (höchstens 60 %). Kühler schont
  die Terpene — aber nur, solange die Luftfeuchte dabei nicht über 60 % steigt.", am Erntetag mit dem Trockenklima für
  nach dem Schnitt. Zielzeilen, Pille, Luftfeuchte-Warnung, Tipps-Zone und Lexikon-Hinweis folgen derselben Stufe. Die
  Warnungen „Wachstum stoppt" und „Phosphor-Lockout" entfallen an diesen Tagen; über 29 °C heißt es „Terpene sind
  flüchtig: kühler halten". Die Nass-Stufe rechnet dort nicht mehr mit dem Blattabzug — über 60 % greift der Deckel. Der
  IceFlush-Tag selbst (Licht an) rechnet wie vorher.
- `test_dunkelphase.js` (36 Prüfungen, beide Zeitzonen): Ice-Tage in beiden Phasen-Pfaden, Tabelle, Befunde in der
  Dunkelphase und am Erntetag, Zielwerte und Warnung, Temperatur-Warnungen, Tageseintrag im Profi- und Einsteiger-Modus
  samt Tippen, Tipps-Zone, Lexikon-Hinweis, Quelltext. Gegen den alten Stand: 22 Fehler. Bewusst angepasst:
  `test_klimaziel.js` (Tabelle und Zielwerte des Erntetags).

## 2026-09-15 — v1.5.187

- **Temperatur, Luftfeuchte und VPD bewerteten dieselbe Luft mit drei Fenstern, die sich widersprachen.** Befund der
  zweiten Prüfrunde (VPD), an Patricks 86 Einträgen gemessen; Patricks Entscheidung vom 15.09.2026: Option B. Die
  Spätblüte verlangte 1,4–1,6 kPa bei 18–24 °C und 40–50 % RLF — bei 18 °C geht das nur mit 11–20 % RLF. Im Eintrag
  stand 44-mal eine grüne VPD-Pille über oranger Zielzeile, 13-mal „✓ Luft passt" über ⚠ (der Einsteiger-Kasten verglich
  Etiketten, die `vpdZone` nie ausgab), 40-mal Temperatur ✓ und Luftfeuchte ✓ bei VPD ⚠. Beim Tippen zog nur die
  Profi-Pille mit. Die Luftfeuchte-Warnung riet „SOFORT RLF unter 50% senken" und „Mittlere Blüte braucht RLF unter
  55%", die frühe Blüte blieb bis 80 % still, und der Sämling unter der Haube bekam bei 74 % eine Warnung neben
  „Sämling ✓".
- **Warum das zählt:** Drei Antworten auf dieselbe Frage — man folgt der, die gerade passt, oder keiner. Bei dichten
  Blüten kostet das die Ernte (`ANBAU.md` 13.5).
- **Jetzt:** Eine Tabelle `KLIMA_ZIEL`. VPD-Band und Temperatur sind fest, die Luftfeuchte wird bei der gemessenen
  Temperatur gerechnet (`klimaRlfFenster`), der Schimmel-Deckel ist hart. Späte Blüte, Spülen, IceFlush und Erntetag
  haben das Band der mittleren Blüte (1,2–1,5 kPa, 22–26 °C); Schutz kommt über den Deckel von 60 % und die Nass-Stufe.
  Frühe Blüte 1,0–1,3 kPa mit neuem Deckel 65 %. Ein Befund `klimaStatus` speist Pille, Einsteiger-Satz („Luft zu
  feucht in der späten Blüte: Luftfeuchte auf 39–48 % bei 24 °C senken."), Zielzeilen, die Live-Anzeige beim Tippen,
  die Luftfeuchte-Warnung (jetzt in voller Breite) und den Lexikon-Hinweis; `vpdZone` und `getPhaseTargets` lesen
  dieselbe Tabelle. Die sanften Phasen-Hinweise in `getEntryWarnings` entfallen — sie doppelten die Zielzeilen mit
  eigenen Toleranzen —, der Aktivkohlefilter-Hinweis ist eine Info und fehlt beim Sämling. Die Plus-Taste zählt bei
  leerem Feld vom Platzhalter statt von fest 60 %. `ANBAU.md` 2.1, 2.2, 13.5 und 15 nachgezogen.
- **Was Patrick an seinen Einträgen sieht:** frühe Blüte 16 im Ziel, 7 knapp, 4 zu feucht, einmal über dem neuen Deckel
  (22.06., 28,6 °C / 68 %); mittlere Blüte 5 im Ziel, 5 knapp, 13 zu feucht (7 davon die Vorlagenwerte 24/55); späte
  Blüte 13 im Ziel, 3 knapp, 1 zu feucht, dazu fünfmal „zu kühl" (die Vorlagenwerte 21/40). Mehr Meldungen als vorher
  — gewollt, denn vorher stand dort eine grüne Pille.
- **Bewusst noch nicht geändert:** der Klimafaktor der Gießmenge. `_vpdFaktorBand` hält die bisherigen Bänder, sonst
  wäre die Gießmenge in der Spätblüte nebenbei um bis zu 12 % gesprungen; er wird mit dem Gießmengen-Umbau ersetzt
  (Transpirationskurve nach Oren et al. 1999). Ebenfalls offen: VPD-Diagramm, feste Klimazahlen in Lexikon, Tipps und
  Diagnose-Texten, der Diagnose-Kontext „Luftfeuchte hoch" — die nächsten Versionen.
- `test_klimaziel.js` (32 Prüfungen, beide Zeitzonen): Tabelle; Fenster gegen eine unabhängige Magnus-Rechnung; ein
  Raster aus 180 225 Punkten ohne Widerspruch zwischen Fenster und Befund; zwölf Befunde; fünf Sätze; Zielwerte;
  Warnung; Eintrag mit Patricks Werten samt Live-Tippen; alle 86 Klimatage; unveränderte Gießmenge; Eintrags-Warnungen;
  Quelltext. Gegen den alten Stand: 14 Fehler. Bewusst angepasst: `test_bluetestufen.js` (VPD 1,3 liegt jetzt im Band
  der späten Blüte) und `test_trocknungsklima.js` (Anzucht-Gegenprobe: 0,60 heißt „Zu feucht").

## 2026-09-15 — v1.5.186

- **„Tag automatisch ausfüllen" trug Temperatur und Luftfeuchte ein, die niemand gemessen hat.** Befund der zweiten
  Prüfrunde (VPD), mit Patricks Sicherung nachgezählt. `getAutoFillTemplate` rechnete aus der Phasen-Tabelle ein
  Klima — mit Luft-VPD statt Blatt-VPD, auf das RLF-Fenster geklemmt —, und `applyRecommended` speicherte es ohne
  Kennzeichen. Danach zählte es als Messung: im Klimafaktor der Gießmenge, im VPD-Diagramm, in Diagnose und
  Schimmel-Alarm. In Patricks Sicherung sind 22 von 86 Klimawerten genau solche Vorlagenpaare (21/40 achtmal, 24/55
  siebenmal, 25/60 sechsmal, 22/43 einmal), 21/40 auch in der mittleren Blüte. Am 27.08. schrieb das Auto-Fill
  21,0 °C und 40 %, während der Platzhalter im selben Feld 45 % nannte.
- **Warum das zählt:** Ein geschätztes Klima ist keine Messung (`ANBAU.md`, Regel 2) — dieselbe Regel wie beim Drain,
  den die App seit v1.5.177 nie schätzt. Eine Gießmenge oder Warnung auf erfundenen Werten ist schlimmer als keine.
- **Jetzt:** Das Auto-Fill lässt Temperatur und Luftfeuchte leer; die Zielwerte stehen weiter als grauer Platzhalter.
  „Klima-justiert" in der Meldung erscheint genau dann, wenn der Klimafaktor der Gießmenge wirkt
  (`_vpdFactorForDay`). Vorher war es eine eigene Rechnung mit Luft-VPD, an 71 von Patricks 86 Klimatagen anders als
  der Faktor. Patricks gespeicherte Werte bleiben unangetastet: Die Vorlagenpaare lassen sich nicht sicher von echten
  Messungen trennen (24/55 kann gemessen sein). `ANBAU.md` 15 nennt die Regel.
- `test_klimanieschaetzen.js` (7 Prüfungen, beide Zeitzonen): Vorlage an sechs Tagen (Sättigung, Sprühen, Gießtage,
  Spülen, Tag ohne Guss), „Empfehlung übernehmen" am 27.08., Hinweis gegen Faktor bei vier Klimawerten. Gegen den
  alten Stand: 3 Fehler.

## 2026-09-15 — v1.5.185

- **Mit Blütestart-Datum lagen Endspurt, Erntezähler und Düngeplan-Wochen bis zu 14 Tage neben der echten Blüte.**
  Befund der zweiten Prüfrunde (Plan-Modell), gemessen und hier nachgestellt. Betroffen sind Photo-Sorten nach dem
  Umschalten auf 12/12 und Outdoor-Photos. `phase()` und `getAction()` zählten ab dem Blütestart-Datum, rund
  zwanzig andere Stellen weiter mit `anzuchtDays` = 21: `endspurtState`, `harvestCountdown`, `daysToHarvest`,
  `contextFor` (Finisher, Hard-Dryback), der Spül-Hinweis, `collectBloomGusse` (Gieß-Fahrplan),
  `planWeekBounds` (Düngeplan-Wochen), `holdPlanWeek`, `shiftPlanToDay`, die Trichom-Prognose, das
  Phasen-Band, die Diagramme, der Export.
- **Gemessen, Umschalten an Tag 36 und 70 Blütetage:** Laut Phase Spülen ab Tag 106, Ernte Tag 117. Endspurt und
  Erntezähler sagten Tag 92 und Tag 103, die Liste der Spülgänge war leer, Hard-Dryback gab es nie, „Spülung in 7
  Tagen" kam an Tag 85. Der Gieß-Fahrplan endete an Tag 100, und am echten Spülstart stand der Düngeplan schon in der
  IceFlush-Woche. Beim Umschalten an Tag 15 stand der Plan an den ersten Blütetagen noch in der Anzucht-Woche, und
  Endspurt wie Ernte lagen 7 Tage zu spät. Beim Outdoor-Photo mit abgeleitetem Blütestart (17.08.) meldete der
  Erntezähler Tag 90 statt Tag 207.
- **Warum das zählt:** Eine zu früh angezeigte Ernte ist nach `ANBAU.md` 11 der teuerste Fehler im Zyklus. Dazu
  bekam die Pflanze bis zu 14 Tage Blütedünger unter 18/6 und danach bis zu 14 Blütetage ohne Dünger.
- **Jetzt:** `anzuchtLenFor(c)` ist die einzige Quelle der Anzucht-Länge — die Tage bis zum Blütestart-Datum, sonst
  `anzuchtDays`. 28 Stellen fragen sie. Ohne Blütestart-Datum rechnet alles wie vorher; die Gegenproben
  (Photo mit Umschalten an Tag 22, Automatic) sind unverändert, Patricks Zyklus ebenso.
- `test_bluetestart.js` (38 Prüfungen, beide Zeitzonen): Umschalten an Tag 15/22/29/36, Automatic, Outdoor-Photo.
  Gegen den alten Stand: 21 Fehler.
- **Nebenbei: `test_ecziel.js` fiel seit v1.5.178 um.** Er zählte 11 Vorlagen ohne eigene EC-Ziele; seit die
  BioBizz-Outdoor-Vorlage entfernt ist, sind es 10. Beim Ausliefern von v1.5.178 lief der Test nicht mit. Gefunden
  beim breiten Lauf für diese Version und gegen die Stände v1.5.177 (grün) und v1.5.178 (1 Fehler) nachgeprüft.
  Angepasst ist nur die erwartete Zahl.

## 2026-09-15 — v1.5.184

- **Die Karte vor einem Phasenwechsel sagte an allen drei Tagen davor „In 3 Tagen".** Beim Browser-Check von
  v1.5.183 auf Patricks Startseite gesehen: Am 29.08.2026 (Tag 106, Spülen ab Tag 107) stand „In 3 Tagen:
  Spülphase beginnt … Vorbereiten: pH-Wasser für ~2 Wochen bereitstellen." direkt unter „Spülung morgen".
  `getAlerts` sah nur auf den Tag in drei Tagen und übergab den Texten fest `daysUntil: 3`; die „~2 Wochen"
  standen fest da, obwohl vier Spültage eingestellt sind. Dieselbe Rechnung galt für Blüte-Start, IceFlush, Erntetag
  und Trocknung. Lagen zwei Wechsel in drei Tagen, übersprang die Karte den näheren: Am IceFlush-Tag vor der Ernte
  kündigte sie „In 3 Tagen: Trocknung" an statt „Morgen: Erntetag".
- **Warum das zählt:** Zwei Karten mit verschiedenen Zahlen für denselben Termin — beim Überfliegen gewinnt die
  größere, nicht die richtigere. Wer „in 3 Tagen" liest, stellt das Spülwasser nicht heute bereit.
- **Jetzt:** Die Karte sucht den nächsten Wechsel innerhalb von drei Tagen und nennt seinen Abstand („In 2 Tagen",
  „Morgen"). Die Spülphasen-Karte nennt die eingestellten Spültage (`flushWetDays`). Neu dafür: `_inNTagen(n)`.
- `test_phasenwechsel.js` (7 Prüfungen, beide Zeitzonen): alle Karten von Tag 16 bis 106 eines Automatic-Zyklus
  gegen den echten Abstand zum nächsten Wechsel. Gegen den alten Stand: 4 Fehler.

## 2026-09-15 — v1.5.183

- **„Spülung in N Tagen" zählte einen Tag zu wenig.** Beim Durchsehen der Stellen gesehen, die mit der
  Anzucht-Länge rechnen. `getAlerts` rechnete Blütetage minus Blütetag. Gespült wird aber erst am Tag danach: Bei
  70 Blütetagen beginnt das Spülen an Blütetag 71, und an Blütetag 63 stand „Spülung in 7 Tagen" — es waren 8. Am
  vorletzten Blütetag stand „Spülung in 1 Tagen", am letzten, wenn am nächsten Morgen gespült wird, gar nichts.
  Mit Patricks Daten (Spülen ab Tag 107): Der Hinweis lief vom 22.08. bis 28.08. und fehlte am 29.08.
- **Warum das zählt:** Ein Countdown, der am letzten Tag verschwindet, fällt genau an dem Tag aus, an dem der
  Wechsel ansteht — dem Tag, an dem man das pH-Wasser für den ersten Spülgang vorbereitet.
- **Jetzt:** Die Zahl zählt bis zum ersten Spültag, sieben Tage lang; am letzten Blütetag steht „Spülung morgen".
- `test_spuelhinweis.js` (8 Prüfungen, beide Zeitzonen): 70 und 49 Blütetage. Gegen den alten Stand: 6 Fehler. Im
  Browser mit Patricks Daten: 22.08. kein Hinweis, 23.08. „in 7 Tagen", 29.08. „morgen", 30.08. (Spülen) keiner.

## 2026-09-15 — v1.5.182

- **Das Feld „Blüte-Start" zeigte bei Outdoor-Photos einen anderen Tag, als die App rechnet.** Beim Beheben von
  v1.5.181 gesehen. Die Phasen kommen aus `_computeBloomStartDate`: 17. August (Südhalbkugel 17. Februar),
  frühestens 4 Wochen nach dem Start. Die Einstellungen hatten eine eigene Kopie der Regel mit der
  Sommersonnenwende (21.06.) und 6 Wochen Mindest-Vegi. Bei Start am 01.04. zeigte das Feld den 21.06., gerechnet
  wurde mit dem 17.08.; bei Start am 01.08. stand dort der 21.06.2027 — ein knappes Jahr neben dem 29.08.2026, mit
  dem die App plant. Der Hinweis darunter nannte die Sonnenwenden-Regel, obwohl das Lexikon selbst erklärt, dass
  die Sonnenwende die Blüte nicht auslöst.
- **Warum das zählt:** Wer das Feld liest, plant Training, Dünger und Ernte nach einem Datum, das nirgends gilt,
  und sieht im Kalender einen anderen Blütebeginn als in den Einstellungen.
- **Jetzt:** Das Feld fragt `_computeBloomStartDate`, der Hinweis nennt dieselbe Regel. Ob der 17. August für
  jeden Breitengrad passt, gehört zum späteren Outdoor-Bereich (Patrick am 15.09.2026: erst Indoor). Hier ging es
  nur darum, dass Anzeige und Rechnung übereinstimmen.
- `test_bluetestartfeld.js` (10 Prüfungen, beide Zeitzonen): Nord- und Südhalbkugel, dazu die 4 Wochen
  Mindest-Vegi. Gegen den alten Stand: 6 Fehler.

## 2026-09-15 — v1.5.181

- **Nach der Zeitumstellung im Frühjahr begannen Spülen, IceFlush und Ernte einen Tag zu spät.** Befund der zweiten
  Prüfrunde (Plan-Modell), in beiden Zeitzonen gemessen und hier nachgestellt. Betroffen sind Zyklen mit
  Blütestart-Datum: Photo-Sorten nach dem Umschalten auf 12/12 und Outdoor-Photos. `_datebasedPhase` legte die
  Phasengrenzen mit `getTime() + n · 86 400 000 ms` auf das 12-Uhr-Datum. Lag die Umstellung am 29.03. dazwischen,
  stand die Grenze auf 13 Uhr Sommerzeit, und der Tag zählte noch zur alten Phase. Beispiel: Umschalten am 26.01.,
  70 Blütetage — Spülen soll am 06.04. beginnen, die App sagte 07.04., IceFlush, Ernte, Trocknen und Curing ebenso
  einen Tag später. In Kiritimati (keine Zeitumstellung) stimmte alles: Dieselben Eingaben ergaben je nach Zeitzone
  einen anderen Erntetag.
- **Draußen dieselbe Rechnung:** Das Abhärten (7 Tage vor dem Raus-Datum) begann nach der Herbstumstellung einen Tag
  zu spät, und nach der Frühjahrsumstellung zählte der 8. Tag draußen noch als Woche 1.
- **Jetzt:** Alle Grenzen in Kalendertagen über `isoPlus`/`isoDiff`, wie überall sonst in der App. Die
  Tageszählungen innerhalb der Phasen runden und waren schon richtig.
- `test_zeitumstellung.js` (13 Prüfungen, beide Zeitzonen): drei Photo-Zyklen über die Frühjahrsumstellung, zwei
  Gegenproben (ohne Umstellung, Herbst), Abhärten und Wochenzählung draußen. Gegen den alten Stand: 5 Fehler in
  Berlin, keiner in Kiritimati.

## 2026-09-15 — v1.5.180

- **Die Startseite meldete mitten in der Trocknung „Gießen überfällig!".** Beim Browser-Check von v1.5.177 auf
  Patricks Startseite gesehen: am 15.09.2026, Tag 123, Phase Trocknen, stand „⚠️ Gießen überfällig! Letztes: vor 13d
  (Intervall: 1d)". `getAlerts` verglich nur den Abstand zum letzten Guss mit dem Gießintervall der Phase. Nach der
  Ernte, im Hard-Dryback und an den IceFlush-Tagen wird aber absichtlich nicht gegossen — und in der Trocknung
  lieferte `getInt` sogar ein Intervall von einem Tag. Dazu erschien nach der Ernte weiter der Tipp „Gießrhythmus
  schwankt".
- **Warum das zählt:** Eine Warnung, die zur falschen Zeit kommt, lehrt, Warnungen zu übergehen. Wer ihr in der
  Trocknung folgt, fragt sich, ob er die geerntete Pflanze gießen soll.
- **Jetzt:** Überfällig ist ein geplanter Gießtag, der verstrichen ist — nach `isGiessTag`, derselben Regel, nach
  der Kalender, Gieß-Fahrplan und Startseite die Gießtage zeigen, mit einem Tag Spielraum wie bisher. Die Warnung
  nennt den verpassten Tag („Geplant war der 13.07. (vor 7 Tagen), der letzte Guss ist 10 Tage her."). Nach der
  Ernte gibt es weder die Warnung noch den Rhythmus-Tipp.
- `test_ueberfaellig.js` (6 Prüfungen, beide Zeitzonen): Trocknung mit Warnungen und gerenderter Startseite, dazu
  eine Blüte-Lage mit wirklich verpasstem Gießtag als Gegenprobe. Gegen den alten Stand: 3 Fehler.

## 2026-09-15 — v1.5.179

- **Die Wochenfrage fragte nach dicker werdenden Blüten, bevor es Blüten gibt.** Befund der ersten Prüfrunde (E7),
  gegengeprüft; in der zweiten Runde unter „braucht Patrick" geführt, seit dem 15.09.2026 zur eigenen Entscheidung
  freigegeben. `_planWeekQuestion` meldete bei jedem Plan-Wochenwechsel „Woche N ist durch. Weiter zu Woche N+1? …
  Werden die Blüten noch sichtbar dicker und sind die Blätter noch satt grün" und bot an, Plan und Ernte zu
  verschieben. Nachgestellt mit BioBizz Light, Automatic, 63 Blütetage: Die Frage kam an Tag 8 und 15 (Anzucht),
  an Tag 22 (Übergang in die Blüte) und an Tag 85 (Beginn des Spülens) — jedes Mal mit einem Kriterium, das an der
  Pflanze nicht zu beurteilen ist.
- **Warum das zählt:** Ein Anfänger soll ein Merkmal prüfen, das es noch nicht gibt, und darf dabei die Ernte
  verschieben. Beim Spülen setzt die Endspurt-Kette den Termin; eine zweite Stelle, die ihn verschiebt, wäre ein
  Widerspruch.
- **Jetzt:** Gefragt wird nur, wenn die alte und die neue Plan-Woche laut Rückgrat Blüte sind. Bei den übrigen
  Wechseln (Anzucht, Übergang in die Blüte, Beginn des Spülens) steht eine Hinweis-Karte „Plan-Woche N beginnt" mit
  dem Wochen-Tipp des Plans und den geänderten Mengen — ohne Frage und ohne Verschieben.
- **Beinahe-Fehler beim Fix, festgehalten:** Die erste Fassung ließ die Karte außerhalb der Blüte ganz weg. Damit
  verschwand auch der Wochen-Tipp, denn die Statuszeile zeigt nur den kurzen Wochennamen — beim Rainbow-Plan in
  Woche 4 „Erste Pistillen pro Topf notieren" und der Alfa-Boost-Hinweis. `test_wochentipp.js` hat es gefangen.
  Die Mengen-Änderung wird jetzt an zwei Stellen gebraucht und steht deshalb in `_planWochenDiff` /
  `_planWochenDiffText`.
- `test_wochenfrageanzucht.js` (6 Prüfungen, beide Zeitzonen): Wochen 2, 3, 4, 5 (Gegenprobe) und 11. Gegen den
  alten Stand: 4 Fehler.

## 2026-09-15 — v1.5.178

- **Die BioBizz-Outdoor-Vorlage ist entfernt.** Patricks Entscheidung vom 15.09.2026: „Den Outdoorplan würde ich erst
  mal rausnehmen, bis wir einen richtigen Outdoorbereich in der App einbauen. Bis dahin konzentrieren wir uns auf
  Indoor." Die Agentin der zweiten Runde hatte keine offizielle Outdoor-Tabelle von BioBizz gefunden; die Vorlage
  beschrieb sich selbst als „Schedule 2025 + Community-Outdoor-Praxis".
- **Weg:** aus `FERT_PRESETS`, aus der Planwahl im Assistenten (draußen wird jetzt wie drinnen BioBizz Light
  empfohlen) und aus dem Dünger-Bildschirm.
- **Gespeicherte Kopien:** Eine Kopie, an der ein Zyklus oder ein Eintrag hängt, bleibt stehen — sonst zeigten
  alte Einträge Produkte ohne Namen (Lehre aus v1.5.135). Sie bekommt den Dosis-Modus „Wochendosis" eingestempelt,
  der bisher aus der Vorlage kam: Ohne Vorlage hätte `_doseModeFor` „je Guss" gemeldet, und die Wochendosis stünde
  ungeteilt im Guss — bei Intervall 3 die 2,3-fache Konzentration. Unbenutzte Kopien gehen.
- **Aufgeräumt nach der Regel „die zweite Kopie wird eine Funktion":** Das Löschen abgelöster Vorlagen-Kopien stand
  seit v1.5.133 für die Sensi-Pläne von Hand da und wäre hier ein zweites Mal entstanden. Jetzt
  `_vorlagenKopienAufraeumen(istKopie)`; das Sensi-Aufräumen läuft darüber und verhält sich wie vorher (geprüft:
  unbenutzte Sensi-Kopie weg, Patricks V3.4.7 bleibt).
- `test_vorlageoutdoor.js` (9 Prüfungen, beide Zeitzonen). Gegen den alten Stand: 3 Fehler. Umgestellt:
  `test_duengeplaene` (Fingerabdruck), `test_feedtaganzucht` (Master statt Outdoor, die Wochendosis prüft Official),
  `test_weeklysplit` (Teiler nach Rückgrat an einer Official-Kopie mit drei Anzucht-Wochen).

## 2026-09-15 — v1.5.177

- **Ein eingetragener Drain zählte nicht, wenn die Gießmenge per „Erledigt" oder Autofill übernommen war.**
  Patricks Entscheidung vom 15.09.2026: „Wenn ich den Drain nicht eingegeben habe, können wir diesen nicht
  automatisch ausfüllen lassen. Die Werte sind zu wichtig, um diese zu schätzen. Am Drain sieht man sofort, ob die
  Salzkonzentration erhöht ist." `drainAdjust` übersprang jeden Eintrag mit `_suggested.water` — gedacht als
  Schutz gegen das Lernen aus eigenen Vorschlägen. Die Drain-Menge trägt aber nur ein Mensch ein; sie ist ein Befund
  über den Topf. Folge bisher: Wer der App folgt und „Erledigt" tippt, bekam den Regelkreis aus v1.5.112 nie —
  450 ml Drain auf 9000 ml (5 %) änderten nichts. Jetzt: Faktor 1,15, die Menge geht hoch.
- **Geprüft und abgesichert, dass die App nie einen Drain schätzt:** Weder „Tag automatisch ausfüllen" noch
  „Erledigt" noch „Empfehlung übernehmen" schreiben Drain-Menge, Drain-pH oder Drain-EC. Einzige Ausnahme bleibt
  der Demo-Zyklus mit seinen erfundenen Beispieldaten.
- **Dazu:** Das Drain-Feld zeigte als grauen Platzhalter „1800" (20 % der Gießmenge) — für einen Anfänger leicht
  als eingetragener Wert zu lesen. Der Hinweis darunter sagte „Erst ab etwa einem Fünftel Ablauf sagen pH und EC
  etwas", obwohl ein Drain nach `ANBAU.md` 5.1 ab 15 % aussagekräftig ist. Jetzt: Platzhalter „ml", und der
  Hinweis nennt das Ziel aus `DRAIN_ZIEL` mit der Menge für den heutigen Guss („Ziel 15–20 % — bei 9000 ml also
  1350–1800 ml"). Ein erster Versuch mit dem Ziel als Platzhalter wurde im 58 Pixel schmalen Feld zu „1350–1"
  abgeschnitten — gesehen erst im Browser.
- `test_drainnieschaetzen.js` (7 Prüfungen, beide Zeitzonen): Autofill-Vorlage an Guss- und Spültag, „Erledigt",
  „Empfehlung übernehmen", Drain bei übernommener Gießmenge, Platzhalter und Hinweis. Gegen den alten Stand: 3 Fehler.
  `test_drainregelkreis.js` prüfte bisher das Gegenteil („Ein von der App gefuellter Guss zaehlt nicht als
  Messung") und ist umgestellt.

## 2026-09-15 — v1.5.176

- **Der Mengen-Korridor hob die Sämlingsrampe an Blütetag 1 auf das Zweieinhalbfache.** Befund der Prüf-Agentin
  zur Gießmenge, nachgemessen. Ein frischer Zyklus (11 L Erde, Automatic, keine Einträge) bekam an Tag 21 550 ml
  und an Tag 22 1450 ml je Pflanze — die eigene Rampe der App sagt 650, 900, 1100, 1350 ml. Ursache:
  `_naturalPhaseRange` rechnet den Stretch-Korridor aus einem repräsentativen Tag 31 (1450–2150 ml), und `_klemm`
  in `waterSuggestion` hob damit schon Blütetag 1 auf die Untergrenze; bis Tag 25 blieb die Menge dort
  festgeklemmt. Ohne seine eigenen Korridore hätte die App Patrick an Tag 22 7250 ml für fünf Pflanzen
  vorgeschlagen; gegossen hat er 3500 ml. Sein eigener Korridor (Stretch ab 600 ml) hatte ihn davor geschützt —
  ein Einsteiger hat keinen.
- **Warum das zählt:** Nach `ANBAU.md` 1 und 13.1 ist ein Topf, der mit kleinem Wurzelballen dauernass bleibt,
  der häufigste Weg zur toten Pflanze. Die Rampe war eigens als „sanfte Rampe statt Klippe" gebaut; der Korridor
  hob sie wieder auf.
- **Jetzt:** Nach unten hebt nur noch ein selbst gesetzter Korridor an. Der natürliche Korridor begrenzt weiter
  nach oben. Tag 22 bekommt 650 ml, die Menge steigt der Rampe entlang und nie ab.
- **Unverändert, mit Absicht:** der Deckel und die Frage nach der Nachfüll-Grenze V (Übergabe 0m.1).
- `test_korridorsaemling.js` (6 Prüfungen, beide Zeitzonen): Kennlinie Tag 15–40 eines frischen Zyklus, die
  Obergrenze, ein eigener Korridor als Gegenprobe. Gegen den alten Stand: 2 Fehler.

## 2026-09-15 — v1.5.175

- **Drei Gießanleitungen nannten „Sweet Spot ~40 % Restgewicht" — genau den Wert, bei dem die Bewertung daneben
  „Bald gießen" meldet.** Befund der Prüf-Agentin zur Gießmenge. `classifyRestPct` bewertet Erde ab 40 % mit
  „Bald gießen", 25–40 % mit „Sweet Spot — jetzt gießen", darunter Wasserstress; im Finisher 30–40 %. Patricks
  Gießpunkt ist 30 %, der Hebe-Test-Knopf „Knapp". Die Texte sagten:
  - Tipps, Gieß-Leitfaden: „③ Sweetspot (~40% Restgewicht) — Erst gießen wenn der Topf **extrem leicht** ist … alle
    3–4 Tage". „Extrem leicht" liegt unter 25 % und damit im Wasserstress, und „alle 3–4 Tage" steht zwei Absätze
    nach „Vergiss starre Zeitpläne — gegossen wird nach Topfgewicht".
  - Gießanleitung im Eintrag: „Erst gießen bei ~40% Restgewicht".
  - Einstellungen, Restgewicht-Modul: „Sweet Spot bei ~40% Restgewicht … In der finalen Blüte bewusst 25–30% für
    Harz-Trigger". Die Finisher-Bewertung nennt 30–40 %, und ein Harz-Plus durch Trockenstress ist nicht belegt
    (`ANBAU.md` 14; derselbe Satz war in v1.5.144 am Finisher-Hinweis schon korrigiert).
- **Jetzt:** `GIESSPUNKT` hält die Grenzen an einer Stelle (Erde 25–40, Finisher 30–40). `classifyRestPct` urteilt
  danach, und alle drei Texte nennen sie — mit dem Knopf „Knapp" als Anker und ohne festen Kalender. Die
  Bewertung selbst ändert sich nicht: dieselben Zahlen, nur aus einer Quelle. `ANBAU.md` nennt keinen Gießpunkt;
  es bleibt eine Konvention über den Nass-Trocken-Zyklus (Abschnitt 1). Ob er je Phase verschieden sein soll, fragt
  Übergabe-Abschnitt 0m.1.
- `test_giesspunkttexte.js` (6 Prüfungen, beide Zeitzonen): Quelltext, die Bewertung an den Grenzen, Tipps und
  Eintrag gerendert. Gegen den alten Stand: 5 Fehler.

## 2026-09-15 — v1.5.174

- **Zwei Gießanleitungen nannten noch „bis 10–15 % Drain".** Befund der Prüf-Agentin zur Gießmenge. Seit
  v1.5.112 ist das Ablaufziel 15–20 % (`ANBAU.md` 5.1: erst ab 15 % ist eine Ablaufmessung aussagekräftig),
  seit v1.5.153 steht es an einer Stelle (`DRAIN_ZIEL`). Der Gieß-Leitfaden in den Tipps und die aufklappbare
  Gießanleitung im Eintrag sagten weiter „Langsam gießen bis 10–15% Drain unten austritt" — die im Eintrag zwei
  Zeilen über ihrer eigenen Zeile „15–20% Drain bei jedem Guss".
- **Warum das zählt:** Wer nach der Anleitung bei 10 % aufhört, liefert dem Regelkreis aus v1.5.112 eine Messung
  unter dem Ziel — die App erhöht daraufhin die Menge, während die Anleitung weiter „genug" sagt.
- **Jetzt:** Beide Stellen nennen `DRAIN_ZIEL` („bis 15–20 % unten ablaufen"), dazu der Kommentar der
  Mengen-Leiter.
- `test_drainzieltexte.js` (4 Prüfungen, beide Zeitzonen): Quelltext, Tipps und Eintrag gerendert. Gegen den
  alten Stand: 3 Fehler.

## 2026-09-15 — v1.5.173

- **Die Trichom-Karte zeigte „✅ Erntereif!" nach einer festen Zahl, die weder zur eigenen Reife-Regel noch zum
  Bernstein-Ziel passte.** Beim Abarbeiten von v1.5.172 gesehen. Die Bedingung war „milchig ≥ 60 % und
  Bernstein ≥ 10 %". Dieselbe Karte rechnet seit v1.5.40 mit „milchig-dominant = Klar ≤ 10 %"
  (`RIPE_CLEAR_DONE`) und mit dem Bernstein-Ziel aus den Einstellungen (`_targetAmber`, Patrick 5 %).
  Nachgestellt an Tag 104:
  - 25 % klar, 62 % milchig, 13 % Bernstein → „✅ Erntereif!". Ein Viertel der Trichome unfertig — nach
    `ANBAU.md` 11 der teuerste Fehler, weil er sich nicht mehr korrigieren lässt.
  - 8 % klar, 6 % Bernstein bei Ziel 5 % → nur „⏳ Fast bereit".
  - Ziel 15 %, 5 % klar, 10 % Bernstein → „✅ Erntereif!", obwohl das eigene Ziel nicht erreicht war.
- **Jetzt:** „✅ Erntereif — kaum noch klare Trichome, dein Bernstein-Ziel (X %) ist erreicht", wenn Klar ≤ 10 %
  und das eigene Ziel erreicht ist. „✅ Milchig-dominant — reif · Bernstein X % von deinem Ziel Y %", wenn Klar
  ≤ 10 % ist, das Ziel aber noch nicht. „Fast bereit" und „Noch zu viel klar" bleiben wie bisher.
- **Nicht angefasst:** Welche Erntezahl vorne steht (Kopfzeile, Startseite, Endspurt) — das ist der Umbau aus der
  Agenten-Runde zum Erntefenster und Patricks Entscheidung.
- `test_erntereif.js` (6 Prüfungen, beide Zeitzonen): vier Wertelagen in der gerenderten Karte an Tag 104,
  dazu der Quelltext. Gegen den alten Stand: 5 Fehler.

## 2026-09-15 — v1.5.172

- **Dreizehn Stellen knüpften die Ernte an eine feste Bernstein-Menge oder erklärten Bernstein zum Optimum.**
  Befund der Prüf-Agentin zum Erntefenster (zwei Stellen), danach den ganzen Quelltext durchsucht. `ANBAU.md` 11
  sagt: Klar ist zu früh, milchig ist der höchste THCA-Gehalt, Bernstein ist Abbau (THCA → CBNA) — die Wirkung
  wird ruhiger, die Potenz sinkt, und wie viel davon, ist eine Zielentscheidung des Growers. Die App sagte:
  - Erntezähler: „erste bernsteinfarbene = jetzt oder in 2–3 T. ernten", nach dem Plan-Erntetag „Trichome
    jetzt bernsteinfarben? Zeit zum Schneiden" — obwohl Patrick sein Ziel auf 5 % gestellt hat.
  - Lexikon: „THC-Maximum bei milchigen Trichomen + ~10 % Amber" (das Maximum ist milchig, Bernstein ist schon
    Abbau), „Eine kleine Bernstein-Quote (5–20 %) ist erwünscht", „ab erstem Bernstein 2–7 Tage bis zur Ernte",
    „Sativa-dominante Sorten … eher früher ernten" — beides ohne Beleg.
  - Anleitung: „Ideal zur Ernte: 90 % milchig + max 10 % bernstein", draußen als „Typisches Ziel" sogar
    „70 % milchig, 30 % klar" — ein Schnitt mit einem Drittel unfertiger Trichome, nach `ANBAU.md` 11 der
    teuerste Fehler im Zyklus.
  - Diagnose Lichtstress: „Ernten wenn ~50 % milchig".
  - Tipp „milchig=perfekt, bernstein=couchlock", Info-Karte „meist der beste Schnittzeitpunkt", Demo-Notiz
    „bei ~10–15 % Bernstein ernten", und in der Trichom-Karte des Einsteiger-Modus „Milchig (perfekt)" und
    „Bernstein (spät)" (jetzt „höchster Wirkstoff" und „beginnender Abbau").
- **Jetzt:** Überall dieselbe Aussage — milchig = höchster Wirkstoffgehalt, bernsteinfarben = beginnender Abbau,
  wie viel Bernstein, entscheidest du. Wo die App etwas rät, ist es „kaum noch klare Trichome und dein
  Bernstein-Ziel erreicht" (das Ziel aus den Einstellungen). Die Beschreibung der Wirkung bleibt: mehr Bernstein
  macht sie ruhiger und senkt die Potenz. Unverändert bleibt der Herbst-Hinweis draußen (lieber etwas früher
  bei Schimmelgefahr, `ANBAU.md` 13.5).
- `test_bernsteintexte.js` (15 Prüfungen, beide Zeitzonen): zwölf Muster im Quelltext, dazu beide Hinweise des
  Erntezählers mit Patricks Zyklus. Gegen den alten Stand: 13 Fehler.

## 2026-09-15 — v1.5.171

- **Ein eigener Plan bekam den Dosis-Modus des gerade aufgeschlagenen Plans.** Beim Nachprüfen des
  weekly-split-Befunds gefunden. `getWeekDoses` las Vorlage und Modus aus `plan.presetKey || S.presetKey`.
  Ein selbst angelegter Plan hat keinen `presetKey` — also galt der Plan, der im Dünger-Bildschirm offen ist.
  Nachgemessen: Ein eigener Plan mit 4 ml/L in Woche 5 lieferte 4 ml/L, solange er selbst aufgeschlagen war,
  und 1,71 ml/L, sobald BioBizz Official aufgeschlagen war (geteilt durch 7/3 Güsse). Ein Blick in einen
  anderen Plan änderte also die Menge in der Gießkanne — das Muster aus v1.5.100 an einer weiteren Stelle.
- **Dazu der Rhythmus-Dialog:** `maybeSuggestIntervalChange` las nur `plan.doseMode`. Dieses Feld trägt keine
  gespeicherte Plankopie. Bei Patricks „BioBizz Official" warnte der Dialog deshalb „Bei deinem Plan wird pro
  Guss gedüngt", während die Dosis durch die Güsse der Woche geteilt wurde.
- **Jetzt:** `_planVorlage(plan)` (nur über den eigenen `presetKey`; ohne Plan wie bisher der aufgeschlagene) und
  `_doseModeFor(plan)` (eigenes Feld vor der Vorlage, sonst „je Guss"). `getWeekDoses` und der Dialog lesen
  dort. Für Pläne aus einer Vorlage ändert sich nichts.
- `test_dosismodus.js` (7 Prüfungen, beide Zeitzonen): eigener Plan mit aufgeschlagenem BioBizz Official,
  Patricks Kopie im Rhythmus-Dialog, Rainbow als Gegenprobe, Quelltext. Gegen den alten Stand: 2 Fehler
  in der Sache, 1 im Quelltext.

## 2026-09-15 — v1.5.170

- **In der Anzucht bekam jeder Düngerguss mehr als die Plandosis, sobald es Wasser-Tage gab.** Befund der
  Prüf-Agentin zu weekly-split (15.09.2026), selbst nachgemessen. `feedDayCompFactor` hebt an Düngergüssen die
  Dosis an, damit die Wochenmenge trotz Wasser-Tagen gleich bleibt. Sein Kommentar schließt die Anzucht seit
  v1.1.90 ausdrücklich aus („Anzucht … keine Verstärkung"), geprüft wurde aber nur die Wochennummer 1–9.
  Mit einer Kopie von Patricks Zyklus (Wasser-Tage aus seinen Einträgen): BioBizz Official Woche 2 ×1,333,
  BioBizz Outdoor Woche 3 ×1,467, BioBizz Light Woche 3 ×1,5 — alle drei laut Plan-Rückgrat Anzucht.
  Ein frischer Zyklus zeigt es nicht, weil dort in der Anzucht keine Wasser-Tage liegen; das ist der Grund,
  warum es bisher niemand gesehen hat.
- **Warum das zählt:** Ein Sämling reagiert auf Konzentration am empfindlichsten (`ANBAU.md` 13.2), und bei
  der Düngermenge ist weniger die sichere Seite (15). Die Verstärkung hob genau die Konzentration über den
  Planwert.
- **Jetzt:** `_planWocheIstAnzucht(plan, w)` liest die Phase aus dem Rückgrat des Plans (ohne Rückgrat wie
  bisher Woche 1–2). `feedDayCompFactor` gibt dort 1 zurück, und der Teiler in `getWeekDoses` (v1.5.163)
  fragt dieselbe Funktion statt einer eigenen Kopie. Blüte-Wochen mit Wasser-Tagen behalten ihren Ausgleich.
- **Unverändert, mit Absicht:** Ob weekly-split überhaupt der Herstellerangabe folgt, wie die Wochenzahlen
  der BioBizz-Vorlagen zum Schema passen und ob der Ausgleich in der Blüte bleiben soll — das sind Fragen an
  Patrick (Übergabe, Abschnitt 0l). Keine Dosis wurde geändert.
- `test_feedtaganzucht.js` (13 Prüfungen, beide Zeitzonen): drei Vorlagen mit Patricks Zyklus, je Anzucht-Woche
  mit Wasser-Tag und Blüte-Woche als Gegenprobe, die Dosis in der Mischliste, eine Quelle im Quelltext.

## 2026-09-15 — v1.5.169

- **Der Sämlings-Start nannte feste Mengen, die an Tag 1 nicht stimmen.** Beim Abarbeiten von v1.5.168
  gesehen. Seit v1.5.161 rechnet die App die Tag-1-Menge aus Topf und Substrat (`waterSuggestion`). Drei
  Stellen nannten aber weiter feste Zahlen:
  - der Assistent: „~700 ml" Sättigungsguss und „~150 ml" Erstguss,
  - der Umschalter „Sämlings-Start" in den Einstellungen: „700ml" und „150ml",
  - der Sämlings-Hinweis nach dem Anlegen: dieselben Zahlen, dazu „48h vor Tag 1" (alle anderen Stellen
    sagen 24 h), „~400ml" zum Vorbefeuchten, pH 6.2–6.5 auch bei Coco und „Samen in trockene Erde".

  Nachgemessen: 7 L Erde bekommt an Tag 1 450 ml, 7 L Coco 200 ml, 11 L Coco 350 ml. Der Assistent sagte
  jedes Mal „~700 ml".
- **Jetzt:** `_tag1MengeJeTopf(vorlage, startMethod)` rechnet über `waterSuggestion` mit einem Probe-Zyklus
  ohne Einträge. In 20 Kombinationen (5 bis 25 L, Erde und Coco, beide Methoden) ist das genau die Zahl, die
  ein echter Zyklus an Tag 1 nennt. Assistent, Einstellungen und Hinweis zeigen sie „je Topf", der Hinweis
  dazu den pH aus `phTargetFor`.
- **Vorbefeuchten ohne Zahl:** Für die ~400 ml gibt es in der App keine Rechnung. Statt einer hochgerechneten
  Menge steht dort jetzt das Kriterium aus dem Lexikon: anfeuchten, „bis sie sich wie ein ausgewrungener
  Schwamm anfühlt — nicht tropfend". Das Lexikon behält sein Beispiel „~400 ml (11L-Topf)".
- `test_tag1mengen.js` (16 Prüfungen, beide Zeitzonen): Assistent für 7 L Erde, 11 L Coco und 11 L Erde gegen
  einen echten Zyklus, der Umschalter in den Einstellungen, der Hinweis für beide Methoden, der Quelltext.
  Gegen den alten Stand: 12 Fehler.

## 2026-09-15 — v1.5.168

- **Was „Tag 1" ist, stand an jeder Stelle anders.** Offene Entscheidung aus der ersten Prüfrunde, von Patrick
  am 14.09.2026 beantwortet: „Tag 1 ist im Normalfall immer die Keimung." Die App sagte bis hierher an
  verschiedenen Stellen Verschiedenes:
  - Die Anleitung „Dein erster Grow" ließ erst 2–5 Tage keimen und dann „Schritt 3 — Einpflanzen · Tag 1"
    den Zyklus anlegen. Die Sortendauer „Samen bis Ernte" zählt aber ab Keimung.
  - Im Eintrag an Tag 1 stand „✅ Heute: Samen einpflanzen", daneben die Keimungskarte mit vorgewähltem
    Papiertuch: „Nach 2–5 Tagen zeigt sich die weiße Pfahlwurzel … dann in Erde setzen". Unter „Vermeiden"
    stand „Kontrolliertes Gießen, jede Stunde nachsehen" — das ist kein Fehler, den man vermeiden sollte.
  - Der Assistent sagte „Wähle den Zeitpunkt, an dem deine Pflanze ‚Tag 1' hat", ohne zu sagen, was das ist.
  - Der Notiz-Chip „Keimling sichtbar" wurde nur bis Tag 3 angeboten — bevor ein Keimling meist da ist.
  - Lexikon „Sättigungsguss" und „Vorbefeuchtet" sowie fünf Code-Kommentare nannten Tag 1 den Einpflanztag.
- **Jetzt:** Tag 1 ist überall der Keimstart — der Tag, an dem der Samen ins Wasserglas, ins feuchte Tuch
  oder direkt in die Erde kommt. Assistent (drinnen und draußen), Einstellungen („Startdatum (Tag 1 =
  Keimstart)"), Anleitung (Zyklus wird in Schritt 2 angelegt), Lexikon und Kommentare sagen dasselbe.
  Die Sämlings-Pflege nimmt an Tag 1 und 2 die Schritte der gewählten Keimmethode wörtlich aus der
  Keimungskarte; beide lesen die Methode über `_keimMethode(c)`. Der Chip „Keimling sichtbar" steht bis Tag 10.
- **Unverändert, mit Absicht:** das Protokoll selbst — Tag 1 Sättigungsguss, Tag 2–8 sprühen, erster Guss
  Tag 9. Es passt zum Keimstart: Keimt der Samen im Glas oder Tuch, kommt er in den folgenden Tagen in die
  schon feuchte Erde und wird nur besprüht.
- `test_tag1keimung.js` (25 Prüfungen, beide Zeitzonen): Assistent, Anleitung, Eintrag an Tag 1 und 2 für
  alle drei Keimmethoden und ohne Wahl, Notiz-Chip, Lexikon, Quelltext. Gegen den alten Stand: 22 Fehler.

## 2026-09-14 — v1.5.167

- **Kam unter 5 % Ablauf unten an, blieb die Gießmenge stehen.** `drainAdjust` warf jede Messung unter 5 %
  weg („keine Messung, sondern ein Tropfen"). Für den Drain-EC stimmt das (`ANBAU.md` 5.1, geprüft in
  `analyzeRunoff`), für die Menge nicht: „unten kam fast nichts an" ist genau der Befund, dass der Guss den
  Wurzelballen nicht durchzogen hat. Nachgemessen an Patricks Tag 104 (9000 ml gegossen): 0 %, 1 %, 2,2 % und
  4,9 % Ablauf ließen den Vorschlag bei 7900 ml, 5 % hob ihn auf 10350 ml — ein Bruch in der Kennlinie, bei
  weniger Ablauf kam weniger Wasser heraus. Patrick am 14.09.2026: „Wenn der Drain zu gering ist, dann sollte
  die Gießmenge erhöht werden. Aber beachte die ersten Wochen. Dort kann man keinen Drain erzeugen."
- **Jetzt:** Jede Ablaufmenge ab 0 ml zählt, mit derselben Mengenbilanz wie bisher (0 % → Faktor 1,21). Bei
  0 % ist die Bilanz eine Untergrenze; die nächste Messung zieht weiter nach, bis unten etwas ankommt. Der
  Lern-Hinweis sagt dann „kam unten nichts an" statt „kamen nur 0 % unten an".
- **Die ersten Wochen:** Vor Tag 25 zählt ein fehlender Ablauf nicht. Bis dahin bekommt der Sämling Wasser im
  Ring um den Stamm und danach den ganzen Topf ohne Ablauf — der Topf ist noch nicht vollgesättigt. Diese
  Grenze stand dreimal von Hand im Code (Ablauf-Feld im Eintrag, Gießtag-Karte zweimal); die Nachführung wäre
  die vierte Kopie gewesen. Jetzt gibt es `DRAIN_AB_TAG` und `_drainMoeglich(p)`, alle vier fragen dort.
- `test_drainregelkreis.js` (35 Prüfungen, beide Zeitzonen): die ganze Kennlinie von 0 bis 40 % auf Monotonie,
  Tag 24 gegen Tag 27, das Ablauf-Feld an denselben Tagen, der Lern-Hinweis, keine Kopie der Grenze im Quelltext.
  Gegen den alten Stand: 9 Fehler.

## 2026-09-14 — v1.5.166

- **Beim Spülen stand am Ablauf-Etikett ein ⚠.** Offene Frage aus v1.5.165, von Patrick am 14.09.2026
  entschieden: „Ja, beim Flush kann das weg." Das Etikett ordnet seit v1.5.150 nach dem Verhältnis Ablauf
  ÷ Zulauf (`ANBAU.md` 5.1, ⚠ über 1,6). Diese Tabelle beschreibt die Düngung. Beim Spülen kommt klares
  Wasser in den Topf und Salze kommen mit dem Ablauf heraus — der Ablauf liegt dann fast zwangsläufig über
  dem Zulauf. Nachgestellt an Patricks Spültag 30.08. mit gültigem Ablauf: „⚠ EC +0.3 (Drain 2,00× Zulauf)".
- **Jetzt:** In Spülen und IceFlush steht „EC +0.3 (Drain 2,00× Zulauf) · beim Spülen normal", ohne ⚠.
  Die übrige Bewertung (Durchfluss-Prüfung, EC-Warnung am Zulauf) bleibt unverändert.
- `test_drainohnemenge.js` (26 Prüfungen, beide Zeitzonen) prüft das Etikett beim Spülen. Gegen den alten
  Stand: 2 Fehler.

## 2026-09-14 — v1.5.165

- **Die Zielzeile im Eintrag nannte immer EC 0,8–2,0.** Bei der Browser-Prüfung von v1.5.163 aufgefallen:
  Unter der Nährstoff-Tabelle stand an jedem Feed-Tag „🎯 pH: 6.4 · EC: 0.8–2.0 · Drain: 15–20%" — mit
  BioBizz Official in Plan-Woche 3 zwei Zeilen unter dem EC-Feld, das „Ziel 1.0–1.4" sagt. Und wo ein Plan
  für eine Woche bewusst kein EC-Ziel führt (Rainbow Woche 13, seit v1.5.140), stand auch in der rechten
  Zielzeile die erfundene Spanne 0,8–2,0.
- **Warum das zählt:** Nach `ANBAU.md` 5 ist der EC-Verlauf phasengebunden, von 0,4 im Sämling bis 1,9 im
  Blütenaufbau. Eine feste Spanne über alle Phasen ist keine Aussage — und neben dem richtigen Ziel eine
  zweite Zahl für dieselbe Frage (Übergabe, Abschnitt 1).
- **Jetzt:** Beide Zeilen nennen die Spanne aus `getEcTarget`; ohne Ziel steht keine. Das Ablaufziel kommt
  aus `DRAIN_ZIEL`.
- `test_ecspanne.js` (12 Prüfungen, beide Zeitzonen): BioBizz Official Plan-Woche 3, Rainbow Woche 13 ohne
  Ziel, die feste Spanne im Quelltext. Gegen den alten Stand: 8 Fehler.

## 2026-09-14 — v1.5.164

- **Der Demo-Zyklus löste an seinem ersten Spültag die eigene Warnung aus.** Bei der Browser-Prüfung von
  v1.5.162 aufgefallen: Am Tag 57 der Demo (erster Spülgang) stand im Eintrag orange „EC 1000 µS/cm ist
  zu hoch für Spülung". Die Demo-EC-Kurve lief nach festen Tagen „Flush: 2.0→0.8" von Tag 53 bis 58 — die
  Spülphase der Demo beginnt aber erst an Tag 57, und dort stand noch EC 1,0.
- **Warum das zählt:** Die Demo ist zum Lernen da. Ein Neuling, der sie öffnet, sieht an genau dem Tag,
  an dem die App „nur noch Wasser" erklärt, eine Warnung über die Werte, die die App selbst eingetragen hat.
- **Jetzt:** An Tagen, an denen `getAction` „spuelen" oder „ice" sagt, trägt die Demo EC 0,3 ein
  (klares Wasser, `ANBAU.md` 5: Spülen 0,2–0,4).
- `test_demozyklus.js` (11 Prüfungen, beide Zeitzonen) prüft alle Spül- und IceFlush-Tage der Demo gegen
  `getCriticalWarning`. Gegen den alten Stand: 1 Fehler.

## 2026-09-14 — v1.5.163

- **Wochendosis-Pläne rechneten mit der Kalenderwoche statt mit der Plan-Woche.** Zwei Befunde der
  Prüf-Agenten, gegengeprüft:
  - `weekGussCounts` zählte die Tage (w−1)·7 bis w·7, `feedDayCompFactor` bekam aber die gedehnte
    Plan-Woche. Nachgemessen mit BioBizz Official: Bei 105 Blütetagen zählte Woche 5 zwei Güsse statt
    fünf, Woche 7 zwei statt fünf; bei 42 Blütetagen Woche 3 drei statt einem. Der Ausgleich für
    Wasser-Tage kam damit aus den Güssen einer anderen Woche — der Gegenprüfer maß bis 38 % daneben, in
    beide Richtungen.
  - `getWeekDoses` wählte das Gießintervall mit „Woche 1–2 Anzucht, danach Blüte". BioBizz Outdoor führt
    drei Anzucht-Wochen; seine Woche 3 wurde durch das Blüte-Intervall geteilt. Bei Anzucht 2 / Blüte 3
    Tagen: Fish·Mix 1,71 statt 1,14 ml/L je Guss, und die Dosis änderte sich, wenn man das
    Blüte-Intervall verstellte.
- **Warum das zählt:** Der Plan kennt die Phase jeder Woche (`weekPhases`) und ihre Tage
  (`planWeekBounds`); zwei Stellen hatten eigene, feste Grenzen. Das Muster aus v1.5.123 — eine Regel,
  die an einer Stelle nachgezogen wird und an einer anderen nicht.
- **Jetzt:** `weekGussCounts` zählt die Tage der Plan-Woche aus `planWeekBounds`, `getWeekDoses` nimmt das
  Intervall der Phase aus `plan.weekPhases`.
- **Bewusst nicht geändert:** dass die Konzentration je Guss grundsätzlich vom Gießintervall abhängt. Das
  ist die Bauart von weekly-split („Wochen-Gesamtdosis"), und die Übergabe führt sie als Entscheidung.
- `test_weeklysplit.js` (9 Prüfungen, beide Zeitzonen): Güsse je Plan-Woche bei 42/85/105 Blütetagen,
  BioBizz Outdoor Woche 3 gegen beide Intervalle, Gegenprobe Blüte-Woche. Gegen den alten Stand: 6 Fehler.

## 2026-09-14 — v1.5.162

- **Der Demo-Zyklus widersprach seinen eigenen Tagen.** Befund der Prüf-Agenten, gegengeprüft: Der
  Toast sagte „Demo-Zyklus angelegt — Tag 60 von 68". Laut `endspurtState` steht die Demo heute auf
  Tag 61, erntet an Tag 64 und trocknet bis Tag 71 — eine 68 gab es in ihr nicht. Die Notiz „Flush-Woche
  gestartet. Nur noch Wasser." stand fest an Tag 55; dort ist laut `getAction` noch ein Blüte-Guss, der
  erste Spülgang kommt an Tag 57.
- **Und die erste Messung taugte nichts:** Die Demo schrieb Ablauf-pH und -EC ohne Ablaufmenge. Seit
  v1.5.150 zeigt die App dazu „nicht bewertet" und „Ohne Ablaufmenge lässt sich nicht sagen, ob die
  Messung etwas taugt" — genau das sah ein Neuling, der die Demo zum Lernen öffnet (`ANBAU.md` 5.1,
  Regel 2).
- **Jetzt:** Der Toast nennt Tag und Erntetag aus `endspurtState`, die Spül-Notiz steht am ersten Tag,
  an dem `getAction` „spuelen" sagt, und jede Demo-Ablaufmessung hat eine Ablaufmenge von 18 % der
  Gießmenge — im gültigen Fenster, sodass die Demo die Durchfluss-Prüfung vorführt statt sie auszulösen.
- `test_demozyklus.js` (9 Prüfungen, beide Zeitzonen): Toast, Spül-Notiz gegen `getAction`, alle
  Ablaufmessungen mit Menge und gültigem Durchfluss, kein Hinweis „Ohne Ablaufmenge" im Eintrag. Gegen
  den alten Stand: 5 Fehler.

## 2026-09-14 — v1.5.161

- **Tag 1 war fest verdrahtet: Menge, pH, Produkte und das Wiegen.** Befund der Prüf-Agenten,
  gegengeprüft und nachgestellt: Startseite und „Automatisch ausfüllen" setzten für den Sättigungsguss
  fest 700 ml je Topf. `waterSuggestion` und der Gieß-Fahrplan rechnen die Menge aus Topf und Substrat —
  7 L Erde 450 ml, 11 L Coco 350 ml. Der Einsteiger-Satz nannte „pH 6.3–6.5 … trockenen Torf" auch für
  Coco (Ziel dort 5,8–6,2), alle Tag-1-Texte „CalMag + leichte Bio-Heaven, kein Bio-Grow" auch mit
  CANNA oder ohne Plan, und „Nach 1–2 h den Topf wiegen" auch ohne Waage und ohne Hebe-Test.
- **Warum das zählt:** Am ersten Tag stehen damit zwei Mengen, zwei pH-Werte und fremde Produktnamen
  nebeneinander. 700 ml in einen 7-L-Topf ist beim Sättigungsguss nicht tödlich (der Überschuss läuft
  ab), aber es ist nicht die Zahl, die dieselbe App eine Karte weiter nennt (`ANBAU.md` 7.4: das
  Volumen ist eine Eingangsgröße).
- **Jetzt:** Die Menge kommt überall aus `waterSuggestion`, der pH aus `phTargetFor`, die Mittel aus den
  Plandosen des Tages (`_tag1MittelText`), der Referenz-Schritt aus der Gewichts-Methode des Zyklus
  (`_tag1Referenz`: Waage wiegen, Hebe-Test anheben, Fingertest fühlen, sonst kein Schritt). Die Kopfzeile
  im Eintrag rechnet die Etappe aus der Menge statt fest „je ~250 ml".
- **Unverändert, mit Absicht:** Was „Tag 1" bedeutet (Keimung oder Einpflanzen) und die Keimungskarte —
  das steht als Entscheidung in der Übergabe.
- `test_tag1.js` (22 Prüfungen, beide Zeitzonen): Erde 11 L mit Hebe-Test, Erde 7 L mit Waage, Coco
  mit CANNA ohne Gewichts-Methode, dazu die festen Angaben im Quelltext. Gegen den alten Stand: 17 Fehler.

## 2026-09-14 — v1.5.160

- **Die Sämlings-Pflege nannte noch einen festen pH für Coco.** Beim Umbau der Dünger-Zeile für v1.5.159
  mitgefunden, direkt darunter im selben Kasten: „pH: 6.0–6.5 (Erde) / 5.5–6.0 (Coco/Hydro)". `phTargetFor`
  führt Coco mit 5,8–6,2 und Erde mit 6,2–6,4; v1.5.157 hatte die pH-Zahlen in Texten vereinheitlicht
  und diese Zeile nicht erfasst, weil der Suchlauf nach den Spannen aus dem Befund suchte.
- **Jetzt:** Die Zeile nennt das Ziel des Substrats dieses Zyklus aus `phTargetFor` („pH: 5.8–6.2 — das
  Ziel für Coco").
- `test_phtexte.js` (22 Prüfungen, beide Zeitzonen) sucht die alte Zeile im Quelltext. Gegen den alten
  Stand: 1 Fehler.

## 2026-09-14 — v1.5.159

- **In der Anzucht sagten Startseite, Sämlings-Pflege und Plan drei verschiedene Dinge über Dünger.**
  Befund der Prüf-Agenten, gegengeprüft, nachgestellt mit BioBizz Light: An den Anzucht-Gießtagen stand
  auf der Startseite „Dünger (½ Dosis): 6 Produkte" — halbiert wurde nichts, Plan, Mischliste und Eintrag
  nannten die volle Plandosis; das Etikett war reiner Text. Bei Start „Direkt einpflanzen" stand an
  Tag 1, 4 und 7 „Dünger (noch keiner nötig): 4 Produkte", während der Eintrag am selben Tag Dosen zeigte.
  Die Sämlings-Pflege im Eintrag sagte fest „Frühestens Tag 10–14, dann nur 25% Dosis" und an Tag 1
  „Vermeiden: Düngen" — auch an Tagen, an denen der Plan Dosen vorsah.
- **Warum das zählt:** Nach `ANBAU.md` 13.2 ist Überdüngung bei Sämlingen besonders schnell tödlich, und
  gerade hier braucht ein Anfänger eine einzige Zahl statt drei Aussagen. „½ Dosis" klingt nach einer
  zusätzlichen Halbierung, die nicht stattfindet.
- **Jetzt:** Die Startseite schreibt „Dünger laut Plan (Woche 2): 6 Produkte — Mengen im Eintrag" bzw.
  „Laut Plan diese Woche kein Dünger". Die Sämlings-Pflege nennt die Zahl der Plan-Produkte dieser Woche
  und dazu, dass Light-Mix-Erde vorgedüngt ist und ein Sämling nicht mehr braucht, als der Plan vorsieht.
  Die „Vermeiden"-Sätze warnen vor mehr Dünger als geplant statt vor Dünger überhaupt.
- **Unverändert, mit Absicht:** die Dosen selbst (Patricks Entscheidung) und die Wochenfrage in der
  Anzucht, die in der Übergabe als Entscheidung geführt ist.
- `test_anzuchtduenger.js` (15 Prüfungen, beide Zeitzonen): beide Startarten über alle Anzucht-Gießtage,
  Karte und Sämlings-Pflege gegen die Plandosen, die alten Sätze im Quelltext. Gegen den alten Stand:
  11 Fehler.

## 2026-09-14 — v1.5.158

- **Eine vierte Stelle mit der Faustregel „Drain-EC höchstens 1,5× Zulauf".** Beim Nachsuchen für
  v1.5.157 gefunden: Der Diagnose-Ablauf im Lexikon (Schritt 2) sagte „Drain-EC messen — sollte ähnlich
  Input-EC sein, max 1.5× höher". v1.5.150 hatte dieselbe Regel an drei Stellen korrigiert und diese
  übersehen, weil sie anders formuliert war („1.5× höher" statt „× 1.5").
- **Warum das zählt:** Nach `ANBAU.md` 5.1 ist ein Verhältnis von 1,3–1,6 in der Vollversorgung normal,
  erst darüber Anreicherung — und die Messung sagt nur bei mindestens 15 % Ablauf etwas. Die alte Zahl
  hätte normale Werte als Überschuss eingeordnet.
- **Jetzt:** „bis etwa 1,3× Zulauf ist Gleichgewicht, bis 1,6× in der Vollversorgung normal, darüber
  Anreicherung; aussagekräftig erst ab etwa 15 % Ablauf".
- `test_drainohnemenge.js` (24 Prüfungen, beide Zeitzonen) sucht die Faustregel jetzt auch in dieser
  Schreibweise. Gegen den alten Stand: 1 Fehler.
- **Daraus zu lernen:** Ein Grep nach dem Ausdruck findet nur die Schreibweise, nach der man sucht. Wer
  eine Zahl an mehreren Stellen korrigiert, sucht nach der Zahl selbst (`1.5×`, `× 1.5`, `1,5-fach`).

## 2026-09-14 — v1.5.157

- **pH-Zahlen in Texten widersprachen dem Ziel des pH-Feldes.** Befund der Prüf-Agenten, gegengeprüft:
  Freitexte trugen eigene, ältere Spannen. Ablauf-Auswertung in Erde „Weiter bei pH 6.2–6.8 gießen"
  (bei 17 von Patricks 24 Ablaufmessungen), während das Feld selbst ab 6,5 warnt; bei zu niedrigem
  Ablauf „Input-pH leicht anheben (6.5–6.8)", in Coco „6.0–6.3", in Hydro „5.8–6.2" — `phTargetFor` sagt
  6.2–6.4 / 5.8–6.2 / 5.5–6.0. Der Tipp beim Spülen nannte fest „pH 6.4" auch für Coco, das pH-Diagramm
  zeigte für jedes Substrat 6,2–6,4 als grünen Bereich, und die Spül-Anleitung im Lexikon 5,5–6,5 für Hydro.
- **Beim Nachsuchen dazu:** Der Diagnose-Ablauf im Lexikon nannte als normalen Drain-pH in Erde 6,0–6,5.
  Nach `ANBAU.md` 4.1 sind 6,8–7,2 in gekalkter Erde das erwartete Gleichgewicht (Kalkpuffer) — wer der
  alten Zahl folgt, senkt den Zulauf gegen den Puffer. Und zwei Texte sagten bei pH knapp über dem Ziel
  „Eisen/Mangan/Phosphor werden blockiert"; nach `ANBAU.md` 4 wird die Verfügbarkeit mit steigendem pH
  schlechter, deutlich ab etwa 6,8 — die Warnung bleibt, die Aussage ist jetzt der Mechanismus.
- **Warum das zählt:** Zwei Zahlen für dieselbe Frage im selben Eintrag — beim Überfliegen gewinnt die
  breitere. Im Coco schlägt ein Spül-pH von 6,4 ohne Puffer direkt in die Verfügbarkeit durch
  (`ANBAU.md` 7.1).
- **Jetzt:** Ablauf-Texte, Spül-Tipp, Tipp-Liste, Lexikon-Anleitung und pH-Diagramm lesen `phTargetFor`
  des Substrats (wie seit v1.5.109 die Dünge-Regeln). Die Frage Coco 5,8–6,2 gegen `ANBAU.md` 5,5–6,0
  (Übergabe 0f) bleibt offen und unberührt.
- `test_phtexte.js` (21 Prüfungen, beide Zeitzonen): Ablauf-Auswertung je Substrat in beide Richtungen,
  Spül-Tipp für Erde und Coco, keine der alten Spannen im Quelltext. Gegen den alten Stand: 17 Fehler.

## 2026-09-14 — v1.5.156

- **Sorten-Chip und Wochen-Eingabe legten verschiedene Erntetage an.** Befund der Prüf-Agenten,
  gegengeprüft und nachgestellt mit Sensi Amnesia XXL Auto (geplant 120 Tage): Über den Chip im
  Assistenten entstand drinnen Ernte Tag 121, draußen Tag 118; über „Samen bis Ernte" mit derselben
  Dauer beide Male Tag 120. `_wizFinish` zog beim Chip eine eigene Summe ab — ohne den Tag 1 und ohne
  `iceLenFor`, das draußen seit v1.5.123 keine IceFlush-Tage kennt. Die dreizehnte Kopie der Regel,
  die v1.5.123 an zwölf Stellen vereinheitlicht hatte.
- **Warum das zählt:** Draußen lag die Ernte vor der Planzahl der Sorte. Nach `ANBAU.md` 11 ist zu
  frühes Ernten der teuerste Fehler, deshalb plant die App mit dem oberen Ende; nach `ANBAU.md` 9 gehört
  der Puffer nach hinten zum Plan. Zwei Tage sind wenig — dass dieselbe Zahl je nach Eingabeweg einen
  anderen Kalender ergibt, ist aber nicht nachvollziehbar.
- **Jetzt:** Der Chip ruft `bloomDaysFromSeedWeeks` auf wie die Wochen-Eingabe. Für 120 Tage: drinnen
  und draußen Ernte Tag 120, auf beiden Wegen. Der veraltete Rechenkommentar („75 − 21 − 8 − 3 = 43")
  ist ersetzt.
- `test_sortenchip.js` (9 Prüfungen, beide Zeitzonen): drinnen und draußen, Chip gegen Wochen-Eingabe,
  Erntetag gegen Planzahl, Endspurt gegen Kalender. Gegen den alten Stand: 4 Fehler.

## 2026-09-14 — v1.5.155

- **Der Symptom-Checker kannte „Luftfeuchte hoch" erst ab 70 %.** Befund der Prüf-Agenten,
  gegengeprüft und mit Patricks Run 01 nachgestellt: `buildDiagnosticContext` setzte `humidityHigh` ab
  70 % RLF, `getCriticalWarning` meldet in der Spätblüte, beim Spülen und am IceFlush schon über 60 %
  „Schimmelgefahr (Botrytis)" und in der mittleren Blüte über 65 % „Schimmelrisiko". Bei 62–69 % stand
  im Eintrag rot „Schimmelgefahr", und die Diagnose nannte die Luftfeuchte nicht als Grund.
- **Warum das zählt:** Nach `ANBAU.md` 13.5 beginnt Botrytis in dichten Blüten bei etwa 60–65 %. Zwei
  Bildschirme, die dieselbe Frage verschieden beantworten, schwächen ausgerechnet die Begründung, auf
  die es beim Schimmel ankommt; bei Gleichstand entscheidet seit v1.5.124 zuerst der Kontext.
- **Jetzt:** Der Diagnose-Kontext fragt `getCriticalWarning` — eine Grenze, eine Quelle. Die 70 % bleiben
  als allgemeine Grenze außerhalb der Blüte stehen: Sie trägt dort auch Calcium-Mangel und Mehltau
  (`ANBAU.md` 1). Der Gegenprüfer hatte vor dem ursprünglichen Vorschlag gewarnt, außerhalb der Blüte
  gar keine Grenze mehr zu führen.
- `test_rlfdiagnose.js` (10 Prüfungen, beide Zeitzonen): Spätblüte 59/62 %, mittlere Blüte 62/66 %,
  Spülen 62 %, Gegenprobe Anzucht 66/72 %. Gegen den alten Stand: 3 Fehler.

## 2026-09-14 — v1.5.154

- **Der Sättigungsguss an Tag 1 fehlte beim Nachholen und bei „Erledigt".** Befund der Prüf-Agenten,
  gegengeprüft und nachgestellt (Start 01.06., Stand 20.06.): `countMissingPastWateringDays`,
  `backfillPast` und `markTodayDone` führten eine eigene Gießtag-Liste ohne `'saettigung'`. Der Zähler
  meldete 4 fehlende Güsse statt 5, der Nachhol-Assistent ließ Tag 1 leer und bot ihn danach nie wieder
  an, und „Erledigt" an Tag 1 setzte nur den Haken, obwohl die App dort 700 ml aufgetragen hatte.
- **Warum das zählt:** Es fehlte ausgerechnet der größte Wassereintrag in den Sämlingstopf —
  Gesamtwasser und Mengen-Verlauf des Zyklus begannen einen Guss zu spät. Das ist das Muster aus
  v1.5.119: dieselbe Gießtag-Regel an vier Stellen von Hand, und nur eine kannte den Sättigungsguss.
- **Jetzt:** Alle drei fragen `isGiessTag`. Der Dünger bleibt beim Nachholen weiter auf die normalen
  Gießtage beschränkt; Tag 1 bekommt die Wassermenge als Vorschlag gekennzeichnet, ohne Dosen.
- `test_saettigungnachholen.js` (10 Prüfungen, beide Zeitzonen): Zähler, Nachhol-Assistent,
  „Erledigt" am Sättigungstag, Gegenprobe an einem Sprüh-Tag. Gegen den alten Stand: 5 Fehler.

## 2026-09-14 — v1.5.153

- **Die Startseite nannte an Wasser-Tagen Dünger.** Befund der Prüf-Agenten, gegengeprüft und
  nachgestellt mit BioBizz Official und BioBizz Light: An den Wasser-Tagen des Plan-Rhythmus (Official
  Tag 30, 39, 45, 54, 63; Light Tag 30, 45, 54, 63) stand auf der Startseite „Nährstoffe Wo. 4:
  6 Produkte (siehe Eintrag)", während Gieß-Fahrplan und Eintrag „nur Wasser" sagten.
  `getTodayAction` las die Dosen der Woche, ohne `getFeedWaterEffective` zu fragen. Die Wasser-Tage im
  Herstellerrhythmus sind der Puffer gegen Überdüngung (`ANBAU.md` 13.2) — und die Startseite ist die
  erste Seite, die ein Anfänger sieht.
- **Auf derselben Karte zwei Ablaufziele:** Der Schritt sagte „Ca. 1800 ml Wasser bis ~10% Drain",
  der Hinweis darunter „15–20% Drain erzeugen". Seit v1.5.112 gilt 15–20 % (`ANBAU.md` 5.1: unter 10 %
  ist eine Ablaufmessung keine), und genau darauf regelt `drainAdjust`. Zwei weitere Stellen nannten
  noch ~10 %: das Symptom „Erde trocken, Pflanze welk" und die Waagen-Einrichtung.
- **Jetzt:** An Wasser-Tagen steht „Wasser-Tag laut Plan: kein Dünger, nur 2 Erhaltungs-Produkte
  (siehe Eintrag)" bzw. „nur Wasser, kein Dünger", ohne EC-Ziel. An Feed-Tagen kommt das EC-Ziel aus
  dem Plan (`_ecTargetFor`) statt fest 0,8–2,0. Alle Ablaufziele lesen `DRAIN_ZIEL`; die Konstante steht
  jetzt oben bei `TROCKNEN_KLIMA`, weil die Symptom-Liste schon beim Laden gebaut wird.
- `test_wassertagstart.js` (20 Prüfungen, beide Zeitzonen): beide Pläne über alle Gießtage von Tag 22
  bis 70, Feed-Tage als Gegenprobe, sichtbar auf der Startseite, die übrigen 10-%-Stellen im Quelltext.
  Gegen den alten Stand: 13 Fehler.

## 2026-09-14 — v1.5.152

- **Beim Trocknen riet die App zum schnelleren Trocknen.** Befund der Prüf-Agenten, gegengeprüft und
  nachgestellt am 13.09. (Patricks Run 01, Tag 121, Trocknen): Bei 18,5 °C und 60 % — mitten im
  eigenen Ziel — stand unter dem VPD-Wert „Etwas niedrig", im Einsteiger-Modus „Für Vegi/Blüte etwas
  zu niedrig — RLF kann etwas runter oder Temp etwas hoch". `vpdZone` kannte keine Trocknungsphase und
  bewertete mit dem Blatt-Modell, dessen Abzug für die Blatttemperatur ein lebendes, verdunstendes
  Blatt voraussetzt (`ANBAU.md` 2.1).
- **Fünf Trocknungsklimas in einer App:** Zielzeile 18–20 °C/55–62 %; Tipps, Startseiten-Karte,
  Anleitung und Anfänger-Fragen 18–21 °C/55–65 % („50 % ist schon zu trocken"); IceFlush-Checkliste,
  Zeitleiste und Ernte-Notiz unter 18 °C/50 %; Lexikon „Trocknung" 15–18 °C/50 % als „Sweet Spot";
  Trocken-Notiz 18 °C/60 %. Wer das Zelt nach der IceFlush-Karte vorbereitete, stand am nächsten Tag
  unter einer Zielzeile, die etwas anderes verlangte.
- **Warum das zählt:** Nach `ANBAU.md` 12.1 kostet zu schnelles Trocknen Terpene und lässt Chlorophyll
  zurück. 50–54 % sind dort ein bewusster Tausch — kürzeres Zeitfenster für Schimmel gegen mehr
  Terpenverlust, nur mit minimaler Luftbewegung und mindestens 8 Tagen —, kein besserer Wert.
- **Jetzt:** `TROCKNEN_KLIMA` und `TROCKNEN_TEXT` sind die eine Quelle; Zielzeile, Tipps, Karten,
  Notizen, IceFlush-Karte, Lexikon, Anleitung und Fragen lesen daraus (18–20 °C, 55–62 % RLF). Beim
  Trocknen und im Curing zeigt die VPD-Pille „Trocknen" bzw. „Curing" mit dem Hinweis, dass Temperatur
  und Luftfeuchte zählen. Das Lexikon nennt 50–54 % ausdrücklich als Tausch.
- **Korrektur an der Übergabe:** Abschnitt 0h führte das Trocknen als „geprüft und in Ordnung".
  `test_lexikon.js` hatte aber nur den Eintrag „VPD" durchsucht, nicht „Trocknung".
- `test_trocknungsklima.js` (29 Prüfungen, beide Zeitzonen): VPD-Pille in Trocknen und Curing mit
  Gegenprobe Anzucht, die Texte, der Eintrag vom 13.09. in beiden Modi, die IceFlush-Karte vom 06.09.
  und keine der alten Klima-Angaben im Quelltext. Gegen den alten Stand: 24 Fehler.

## 2026-09-14 — v1.5.151

- **Der Ernte-Hinweis nannte Bernstein den Höhepunkt.** Befund der Prüf-Agenten, gegengeprüft: Drei
  Tage vor dem Plan-Erntetag stand auf der Startseite „Ab jetzt täglich Trichome mit Lupe prüfen —
  milchig = bereit, bernsteinfarben = Peak" (`T.phaseTransition.toHarvestSoon`). Die Kachel darunter
  sagte zugleich „milchig bedeutet Peak".
- **Warum das zählt:** Nach `ANBAU.md` 11 ist milchig der höchste THCA-Gehalt; bernsteinfarben heißt,
  dass THCA zu CBNA oxidiert — „weiter im Abbau", nicht reifer im Sinne von besser. Wer auf den „Peak"
  wartet, schneidet nach dem oberen Rand seines Zielfensters und verliert Terpene schneller, als er
  Wirkung gewinnt. Wie viel Bernstein, ist die Zielentscheidung des Growers.
- **Jetzt:** „milchig = höchster Wirkstoffgehalt, bernsteinfarben = beginnender Abbau. Wie viel
  Bernstein, entscheidest du." Die erste Fassung war länger; `test_ernteabgleich.js` hält den
  Hinweis ohne Mess-Widerspruch unter 250 Zeichen, damit er kurz bleibt — gekürzt statt die Grenze
  aufzuweichen.
- `test_lexikon.js` (52 Prüfungen, beide Zeitzonen) führt „bernsteinfarben = Peak" in der Liste der
  Aussagen, die im ganzen Quelltext nicht als Tatsache stehen dürfen. Gegen den alten Stand: 1 Fehler.

## 2026-09-14 — v1.5.150

- **Ein Drain-EC ohne Ablaufmenge wurde bewertet.** Befund der Prüf-Agenten, gegengeprüft und mit
  Patricks Daten nachgestellt: `analyzeRunoff` hielt eine Messung ohne Ablaufmenge für gültig — die
  Prüfung `flow && !flow.gueltig` ist bei fehlender Menge (`flow = null`) nie wahr. Alle 24
  Ablaufmessungen in Patricks Daten haben keine Menge (das Feld gibt es erst seit v1.5.104), und alle
  24 wurden bewertet. Im Eintrag vom 19.07. stand im selben Block „Ohne Ablaufmenge lässt sich nicht
  sagen, ob die Messung etwas taugt", darüber „⚠ EC steigt um +0.6 — Salz-Akkumulation" und darunter
  eine ausführliche Bewertung.
- **Warum das zählt:** Nach `ANBAU.md` 15 ist ein Drain-EC ohne Durchflussangabe ein Anlass für eine
  Rückfrage, nicht für eine Bewertung. Wer „Salz-Akkumulation" liest, spült — und in der Blüte kostet
  ein Flush Ertrag (v1.5.09).
- **Jetzt:** Fehlt die Menge, gilt die Ablaufmessung wie bei zu wenig Durchfluss als nicht
  beurteilbar: keine Bewertung, keine orange Box, das Etikett sagt „EC +0.6 · nicht bewertet", und die
  vorhandene Zeile fragt nach der Menge. Das gilt auch für den Drain-pH (`ANBAU.md` 4.1 nennt
  fehlenden Drain ausdrücklich) und für den Diagnose-Kontext, der solche Messungen bisher als Befund
  mitzählte — auch bei zu wenig Durchfluss.
- **Das Etikett beschreibt statt zu deuten.** „Salz-Akkumulation" nannte eine Ursache für ein Bild mit
  zweien (`ANBAU.md` 5.1, Regel 3), und das ⚠ stand auch dort, wo die Bewertung darunter „kein
  Handlungsbedarf" sagte. Jetzt steht das Verhältnis da, nach dem `ANBAU.md` 5.1 einordnet —
  „EC +0.5 (Drain 1,45× Zulauf)" —, mit ⚠ erst über 1,6.
- **Dieselbe Faustregel an drei Stellen:** Der Diagramm-Untertitel „Drain-EC > Input × 1.5 =
  Salz-Akkumulation, Spülung nötig", der Rat bei hohem EC und die Lexikon-Tabelle zum Stickstoff
  nannten 1,5. Nach `ANBAU.md` 5.1 ist 1,3–1,6 in der Vollversorgung normal, erst darüber
  Anreicherung. Der Untertitel nennt jetzt die Tabelle, die Ausnahme für Erde ab der Blütemitte und
  die 15-%-Bedingung.
- `test_drainohnemenge.js` (23 Prüfungen, beide Zeitzonen): alle 24 Messungen Patricks ohne
  Bewertung; ein zu hoher Wert erst ohne, dann mit 20 % Ablauf (Bewertung und Diagnose-Kontext kommen
  zurück); das Etikett gegen die Tabelle; sichtbar im Eintrag; die Faustregel im Quelltext. Gegen den
  alten Build: 13 Fehler.

## 2026-09-14 — v1.5.149

- **Beim Spülen und am IceFlush gab es keinen Schimmel-Alarm.** Befund der Prüf-Agenten, vom
  Gegenprüfer verschärft und mit Patricks Run 01 nachgestellt: `getCriticalWarning` meldete
  „Schimmelgefahr (Botrytis)" ab 60 % RLF nur in der Spätblüte. Spülen und IceFlush sind eigene
  Phasen — am 30.08. (erster Spültag) und am 06.09. (IceFlush) kam bei 62, 70 und 79 % RLF gar
  nichts, erst über 80 % die allgemeine Pilz-Warnung. Dabei nennt `getPhaseTargets` für beide
  Phasen 40–50 %, und es sind die letzten Tage vor der Ernte mit den dichtesten Blüten.
- **Warum das zählt:** Nach `ANBAU.md` 13.5 beginnt Botrytis in dichten Blüten bei etwa 60–65 %
  Raumfeuchte und vernichtet in dieser Lage die Ernte binnen Tagen. Die App schwieg genau dort, wo
  der Schaden am größten und nicht mehr aufzuholen ist.
- **Jetzt:** Spülen und IceFlush lösen denselben kritischen Alarm aus wie die Spätblüte, mit einem
  Rat für die Tage vor der Ernte (ohne „ggf. Defoliation"). Spätblüte, mittlere Blüte, Anzucht und
  Trocknen sind unverändert.
- **Offen bleibt** der Diagnose-Kontext, der „Luftfeuchte hoch" erst ab 70 % kennt
  (`buildDiagnosticContext`) — ein eigener Befund; der Gegenprüfer hat dort vor einer pauschalen
  Absenkung gewarnt, weil dieselbe Grenze auch Calcium und Mehltau trägt.
- `test_schimmelspuelen.js` (14 Prüfungen, beide Zeitzonen): Spülen und IceFlush bei 59/62/70/79 %,
  Gegenproben in den übrigen Phasen, und sichtbar im Tageseintrag „RLF 66% — Schimmelgefahr
  (Botrytis)" am Spültag. Gegen den alten Build: 5 Fehler.

## 2026-09-14 — v1.5.148

- **Das Plan-Blatt markierte die Woche eines fremden Zyklus.** Befund der Prüf-Agenten,
  gegengeprüft und mit Patricks Daten nachgestellt. `renderDuenger` nahm für die „laufende Woche"
  den ersten aktiven Zyklus (`active()[0]`), egal auf welchem Plan er läuft. Mit Rainbow
  aufgeschlagen am 20.08.: Run 01 (BioBizz, Woche 10) steht vorn, Run 02 (Rainbow, Woche 3)
  dahinter — das Blatt zeigte „Wo 10 ●" und „Wo 11", im Einsteiger-Modus nur diese beiden Zeilen,
  und der Wochen-Tipp kam aus Woche 10.
- **Patricks nächster Grow war genau betroffen:** Am 18.09. (Run 01 im Curing, Run 02 seit 15.09.
  auf Rainbow) stand „Wo 12 ●" — über die ganze Anzucht hätte das Blatt Wochen vom Ende des Plans
  gezeigt statt Woche 1 und 2. Der Tageseintrag rechnete die Mengen dabei richtig
  (`getWeekDoses`); falsch war die Nachschlage-Ansicht, nach der man mischt.
- **Jetzt:** `_zyklusFuerPlan(planId, iso)` — der erste aktive Zyklus, der diesen Plan nutzt und noch
  gedüngt wird. Das ist dieselbe Frage, die die Zuweisungskarte seit v1.5.139 stellt, mit denselben
  Bausteinen (`c.fertPlanId`, `_duengungVorbei`). Nutzt kein laufender Zyklus den Plan, gibt es keine
  laufende Woche: keine Markierung, alle Wochen sichtbar.
- `test_planblattwoche.js` (12 Prüfungen, beide Zeitzonen): 20.08. mit Rainbow und mit BioBizz
  aufgeschlagen, Einsteiger und Profi; 18.09. Patricks Lage mit Run 02 in Woche 1 und BioBizz ohne
  laufenden Zyklus. Gegen den alten Build: 7 Fehler.

## 2026-09-14 — v1.5.147

- **Ein nicht eingetragener Guss erzeugte „Wasserstress. Sofort gießen."** Befund der Prüf-Agenten
  (Anfänger-Blick), gegengeprüft und nachgestellt: Ein frischer Zyklus ohne Einträge meldete an
  Tag 13 — ein Sämling, kein Gießtag — rot „⚠ Nur noch 20% Restgewicht — Pflanze hat Wasserstress.
  Sofort gießen." Gemessen hatte niemand. `intervalDryDefault` lässt den Topf nach einem geplanten,
  aber nicht eingetragenen Guss rechnerisch weiter austrocknen (seit v1.1.14 bewusst, für den
  vorgewählten Knopf die sichere Seite), und `classifyRestPct` stufte diese Rechnung ein wie eine
  Messung.
- **Warum das gefährlich ist:** Wer gegossen und nur nicht eingetragen hat, gießt nach dieser
  Meldung auf nasse Erde. Das nimmt den Wurzeln die Luft — nach `ANBAU.md` 13.1 der häufigste
  Anfängertod, bei Sämlingen besonders. Nach `ANBAU.md` 15 kommt vor der Bewertung die Gültigkeit;
  ohne Messung ist die richtige Ausgabe eine Rückfrage.
- **Jetzt:** `_gussLueckeStatus(c, inter)` ersetzt an beiden Hebe-Test-Stellen des Eintrags die
  Einstufung, solange nichts gemessen ist und die Trockenheit nur aus dem fehlenden Eintrag kommt:
  „Nicht gemessen — ein Guss fehlt im Eintrag. Am 10.09. (Tag 9) war ein Guss geplant, eingetragen
  ist seitdem keiner …", mit einem Knopf „Tag 9 nachtragen", der genau diesen Tag öffnet. Wer nicht
  gegossen hat, prüft den Topf und entscheidet danach. `intervalDryDefault` nennt dafür den
  übersprungenen Tag mit (`targetGussIso`).
- **Unverändert, mit Absicht:** Ein getippter Knopf, die Waage und ein Trend aus Messpunkten werden
  weiter normal eingestuft — gemessene 20 % bleiben Wasserstress. Am geplanten Gießtag bleibt
  „Heute gießen". Der vorgewählte Knopf bleibt auf dem gerechneten Wert (v1.1.14), und die Tage
  ohne Guss vor dem IceFlush behalten ihre eigenen Texte.
- `test_giessluecke.js` (19 Prüfungen, beide Zeitzonen): Rückfrage mit Datum, Tag und Knopf in
  beiden Modi, der Knopf öffnet den Tag; Gegenproben „gemessen", „alle Güsse eingetragen" und
  „geplanter Gießtag". Gegen den alten Build: 6 Fehler.

## 2026-09-14 — v1.5.146

- **Gedrückthalten der ±-Knöpfe in der Mischliste tat nichts.** Befund aus der Agenten-Runde
  (Übergabe 0l), im Browser nachgestellt: 1,5 Sekunden auf „+" bei 8,6 ml ergaben 8,6 ml. Der
  Wiederholungs-Mechanismus (`isStepperBtn`) erkannte die Knöpfe an `'stepMixDose('` im
  onclick; seit v1.4.78 rufen sie `stepMixDoseLive(this)` auf. Jetzt zählt die Klasse
  `mix-step-btn`.
- **Nur wiedererkennen hätte falsch gerechnet.** Jeder Schritt baut den Tageseintrag neu auf, der
  gehaltene Knopf ist danach nicht mehr im Dokument. `stepMixDoseLive` fände an ihm keine Zeile
  und rechnete von 0 aus. `_aktuellerKnopf` holt vor jedem Schritt den neuen Knopf mit demselben
  Zyklus, demselben Produkt und derselben Richtung — die Schrittweite wächst mit der Menge und
  taugt nicht als Merkmal.
- **Mit dem Finger lief es nach dem Loslassen weiter.** Erst beim Nachmessen im Browser gefunden:
  Ein Fingerdruck bleibt bei dem Element, auf dem er begann. Ist das neu gebaut, geht `touchend`
  nur an den alten Knopf und erreicht das document nie — nachgemessen stieg die Menge nach dem
  Loslassen in 0,8 s von 17,5 auf 26 ml. `_loslassenAm(el)` hört direkt am berührten Knopf,
  `pointerup` am document ist der zweite Weg. Die Maus war nicht betroffen, `mouseup` geht an
  den Knopf unter dem Zeiger.
- **Warum das zählt:** Die Zahl landet als Tageswert im Eintrag, und nach ihr wird gemischt. Eine
  Düngermenge, die nach dem Loslassen weiterläuft, ist eine Überdosis, die niemand eingegeben hat.
- `test_dauerdruecken.js` (10 Prüfungen, beide Zeitzonen): Halten auf „+" und „−" mit stetigem
  Verlauf ohne Rücksprung auf 0, gespeicherter gleich angezeigter Wert, Loslassen mit dem Finger
  am neu gebauten Knopf. Gegen den alten Build: 3 Fehler (Halten wirkungslos), gegen den ersten
  Fix ohne Finger-Teil: 1 Fehler (läuft weiter).
- **Nicht angefasst:** `stepMixDose` und `_setWaterDayDose` haben seit v1.4.78 keinen Aufrufer.
  Aufräumen gehört nicht in einen Fehlerfix.

## 2026-09-14 — v1.5.145

- **Zwei Grows, zwei Pläne: Der Eintrag zeigte die Produkte des aufgeschlagenen Plans.** Befund
  der Prüf-Agenten (Blickwinkel doppelte Regeln), gegengeprüft — und genau die Lage von Run 02
  neben Run 01. Die Dosen kommen seit v1.5.100 aus dem Plan des Zyklus; Produkte, Einheiten und
  Mischreihenfolge lasen acht Stellen aber aus `S.products` / `S.mixOrder`, den Spiegeln des
  Plans, der im Düngeplan-Bildschirm aufgeschlagen ist. Nachgestellt mit Run 02 auf Rainbow,
  BioBizz aufgeschlagen:

  | Stelle | vorher |
  |---|---|
  | Nährstofftabelle im Eintrag | 7 BioBizz-Zeilen (Root·Juice, Top·Max, Acti·Vera …) ohne Dosis — die 7 Rainbow-Dosen unsichtbar |
  | „Empfehlung übernehmen" | Silica Force 0,5 statt 1,0 ml, CalMag 0,8 statt 1,6 ml — Einheit im falschen Plan gesucht |
  | Nachholen vergangener Tage | Silica Force 0,5 statt 0,9 ml, Epsom 0,3 statt 0,5 g |
  | Tagebuch-Export | Juli-Dosen von V3.4.7 nur als interne Produkt-Nummer |

  Produkt-IDs sind je Plan eindeutig; wer im falschen Plan sucht, findet nichts — und rechnet dann
  mit einer Festmenge statt ml/L.
- **Eine Quelle:** `_planAnsicht(c)` liefert Produkte und Mischreihenfolge des Plans dieses
  Zyklus, mit derselben Ausnahme wie `getWeekDoses` (ist der Plan zugleich aufgeschlagen, gelten
  die Spiegel mit den ungesicherten Bearbeitungen). `orderedProductsFor(c)` ordnet danach,
  `_produktFuer(c, id)` sucht erst im Plan des Zyklus, dann in allen Plänen — alte Einträge tragen
  IDs früherer Pläne. Umgestellt: Nährstofftabelle, Mischliste, Zusatzzeilen, Wasser-Tag-Dosen,
  Vorlagen-Ausfüller, „Empfehlung übernehmen", Nachholen, Export.
- Test: `test_zweiplaene.js` (11 Prüfungen). Vor der Korrektur gegen v1.5.144: 6 Fehlschläge.

## 2026-09-14 — v1.5.144

- **Eine Trockenstress-Zusage hatte v1.5.126 übersehen.** Beim Abarbeiten der IceFlush-Texte
  (v1.5.143) gefunden. Der Hebe-Test zeigt im Finisher-Modus bei 30–40 % Restgewicht:
  „Finisher-Modus: 30–35% Restgewicht ideal — **bewusster Stress für Harzproduktion**." Patrick
  hatte am 07.09. entschieden, genau diese Aussage abzuschwächen; v1.5.126 hat sie an neun Stellen
  geändert, diese stand in den Texten `T.water` und fiel dem Suchlauf nicht auf.
- Jetzt: „30–35 % Restgewicht sind vor der Ernte gewollt (Hard Dryback). Ein Harz-Plus durch den
  Trockenstress ist oft berichtet, aber nicht belastbar belegt." Die Empfehlung selbst bleibt
  unverändert, nur ihre Begründung — wie in v1.5.126. Zwei Code-Kommentare mit derselben
  Behauptung sind mitkorrigiert.
- Test: Die Verbotsliste in `test_lexikon.js` kennt jetzt „Stress für / triggert
  Harzproduktion" (51 Prüfungen). Vor der Korrektur gegen den alten Quelltext: 1 Fehlschlag,
  genau diese Zeile.

## 2026-09-14 — v1.5.143

- **Am IceFlush-Tag widersprachen drei Texte der Eintragskarte — und zwei versprachen einen
  Trichom-Effekt.** Beim Umbau des Einsteiger-Satzes (v1.5.142) gefunden. Seit v1.5.111 sagt die
  Karte im Tageseintrag: 1 L Crushed Ice je 11-L-Topf an den Rand, „Wasser gießt du keines dazu".
  Dagegen standen:

  | Stelle | Text vorher |
  |---|---|
  | Einsteiger-Satz (Startseite) | „Heute gießt du mit Eiswasser … Langsam, etwa 700 ml." |
  | Tageskarte (Startseite, beide Modi) | „Eiskaltes Wasser (<10°C), ca. 2100 ml" · „Kältestress fördert Trichom-Produktion" · „Eiswürfel direkt auf die Erde legen geht auch" |
  | Anleitung | „Der Kältestress soll die Trichom-Produktion nochmal pushen … Eiswürfel direkt auf die Erde legen." |

  Wer an diesem Tag zusätzlich gießt, macht den Hard-Dryback der Tage davor zunichte (Begründung
  aus v1.5.111). Und nach `ANBAU.md` 14 hat IceFlush keinen belegten Trichom- oder Potenzeffekt —
  in v1.5.125/126 an elf Stellen korrigiert, diese drei waren durchgerutscht, weil die Verbotsliste
  in `test_lexikon.js` die Formulierung „Kältestress fördert" nicht kannte.
- Jetzt sagen Startseite, Tageskarte und Anleitung dasselbe wie die Eintragskarte: Eismenge je
  Topf an den Rand, daraus werden rund X ml Schmelzwasser, kein zusätzliches Wasser; eine
  beliebte Technik, ein Trichom-Plus ist nicht belegt. Die Verbotsliste kennt die Formulierung
  jetzt. Der Lexikon-Eintrag IceFlush war bereits ehrlich und bleibt.
- Test: `test_iceflushtexte.js` (13 Prüfungen). Vor der Korrektur gegen v1.5.142: 6 Fehlschläge in
  den Anzeigen (die Quelltext-Prüfung liest `app.js` und war deshalb schon grün).

## 2026-09-14 — v1.5.142

- **Der Einsteiger-Satz auf der Startseite nannte die Summe aller Töpfe als Menge „für deine
  Pflanze".** Gefunden von den Prüf-Agenten (Blickwinkel Anfänger), gegengeprüft. `renderDash`
  übergibt `waterSuggestion(c, p)` — die Menge für alle Pflanzen zusammen — an `plainSentence`,
  und der Satz lautete „Gib deiner Pflanze heute … etwa X ml". Nachgestellt mit 3 Pflanzen, 11 L:

  | Tag | Satz vorher | gemeint |
  |---|---|---|
  | 9 (Anzucht) | „Gib deiner Pflanze heute ganz vorsichtig etwa **450 ml**" | 150 ml je Sämling |
  | 24 (Blüte) | „Gib deiner Pflanze heute etwa **4350 ml**" | 1450 ml je Topf |
  | 1 (Sättigung) | „3 Etappen je ~250 ml" fest | aus der Menge je Topf |

  Wer dem Wortlaut folgt, gießt jeden Sämling mit der dreifachen Anzuchtmenge — nach `ANBAU.md`
  13.1 der häufigste Anfängertod. Bei Patricks 6 Töpfen in Run 02 wäre es das Sechsfache.
- Jetzt heißt es bei mehreren Pflanzen „Gib jeder Pflanze heute etwa 150 ml … (zusammen 450 ml
  für 3 Pflanzen)", dieselbe Aufteilung wie `_mlFor` im Gieß-Fahrplan. Die Etappen am Tag 1
  kommen aus der Menge je Topf. Mit einer Pflanze bleibt der Satz wie vorher.
- Test: `test_einsteigersatz.js` (11 Prüfungen). Vor der Korrektur gegen v1.5.141: 6 Fehlschläge.

## 2026-09-14 — v1.5.141

- **Die Blütestufen hingen an festen Blütewochen statt an der Blütedauer.** Gefunden von den
  Prüf-Agenten (Dauer-Automatik), gegengeprüft; Patricks Wunsch vom 13.09.: „Das sollte sich
  irgendwie automatisch anpassen." Klimaziel, Schimmel-Alarm, VPD-Einstufung, Kälte-Warnung,
  „Trichome checken", die Trichom-Karte im Eintrag, Notiz-Vorschläge und drei Outdoor-Hinweise
  fragten ab: Blütewoche ≤ 3 früh, ≤ 6 mittel, ≥ 7 spät.

  | Blütedauer | späte Blüte begann | Folge |
  |---|---|---|
  | 42 Tage (kurze Auto) | nie (höchstens Woche 6) | kein Schimmel-Alarm ab 60 % RLF, kein „Trichome checken" |
  | 60 Tage (Standard) | Blütetag 43 (72 %) | richtig |
  | 85 Tage (Patrick) | Blütetag 43 (51 %) | Spätblüte-Klima mitten im Blütenaufbau |
  | 105 Tage (Sativa) | Blütetag 43 (41 %) | neun Wochen Spätblüte-VPD auf weichem Gewebe |

  Nach `ANBAU.md` 13.5 beginnt die Botrytis-Gefahr in **dichten** Blüten — die hat eine kurze
  Auto nach 4–6 Wochen, eine Sativa viel später. Nach 2.2 schadet zu hohes VPD auf noch weichem
  Gewebe (Stomata zu, Ca-Transport bricht ab).
- **Die Regel:** `bluetestufe(p)` teilt nach Anteil an der Blüte (35 % / 70 %), so gesetzt,
  dass 60 Blütetage exakt dieselben Tage behalten wie vorher. `phase()` und die datumsbasierte
  Phase führen dafür Blütetag und Blütedauer mit. **Die Topping-Fenster bleiben absolut** — sie
  hängen am Alter der Pflanze, nicht an der Länge der Blüte. **Die Gießphase bleibt vorerst bei
  festen Wochen**: An ihr hängen Mengenkurve, Obergrenzen und der Regelkreis aus v1.5.112; sie
  folgt in einer eigenen Version mit eigener Messreihe.
- Test: `test_bluetestufen.js` (14 Prüfungen: 60 Tage Tag für Tag unverändert, 42/85/105 an den
  Anteilen, kurze Auto mit Alarm und Trichom-Hinweis, Rückfall für alte Phasenobjekte). Vor der
  Korrektur gegen v1.5.140: 11 Fehlschläge.

## 2026-09-14 — v1.5.140

- **Das EC-Ziel lief nach Kalenderwochen, die Dosen nach Plan-Wochen.** Gefunden von den
  Prüf-Agenten (Blickwinkel Profi und Dauer-Automatik, beide unabhängig), gegengeprüft.
  `getEcTarget` schaltete nur bei Plänen mit festen Tag-Spannen (`weekDayBounds`) auf die
  Plan-Woche um. Alle Pläne mit Rückgrat (`weekPhases`, seit v1.5.51) rechneten
  `floor(Tag/7)+1`, gedeckelt auf Woche 10 — bei 11 von 12 Vorlagen. Mit Patricks Zyklus
  (BioBizz Official, 85 Blütetage) nachgestellt:

  | Tag | Plan-Woche der Dosen | EC-Ziel vorher | Ablauf-Bewertung vorher |
  |---|---|---|---|
  | 65 (19.07.) | 7 | Spät-Reifung 0,8–1,2 | zu hoch |
  | 71 (25.07.) | 7 | Spät-Reifung 0,8–1,2 | zu hoch |
  | 77 (31.07.) | 8 | Spät-Reifung 0,8–1,2 | zu hoch |

  Mitten im Blütenaufbau (`ANBAU.md` 5: 1,4–1,9) nannte die App die Werte der späten Reifung —
  und wer ihr folgt, fährt den Dünger zu früh herunter, nach `ANBAU.md` 5 der teurere Fehler.
- **Die Regel:** `EC_TARGETS` ist selbst ein Gerüst aus 3 Anzucht- und 7 Blütewochen. Jede
  Plan-Woche wird über ihre Phase und ihre Stelle innerhalb dieser Phase darauf abgebildet. Die
  erste Blütewoche ist immer „Stretch", die letzte immer „Spät-Reifung" — egal ob die Blüte 42
  oder 105 Tage dauert. Das ist Patricks Frage „das sollte sich automatisch anpassen" für das
  EC-Ziel. Pläne mit eigenen Zielen (Rainbow) bleiben unberührt; nennt ein solcher Plan für eine
  Woche keinen Korridor, fällt die App bewusst nicht auf die allgemeine Tabelle zurück.
  Pläne ohne Rückgrat verhalten sich wie vorher.
- Test: `test_ecziel.js` (20 Prüfungen: alle 11 Vorlagen × 42/63/85/105 Blütetage Tag für Tag,
  Patricks drei Ablaufwerte, Rainbow, Plan ohne Rückgrat). Vor der Korrektur gegen v1.5.139:
  14 Fehlschläge.

## 2026-09-13 — v1.5.139

- **Die Karte „Dieser Plan ist deinem Grow noch nicht zugewiesen" bot einen trocknenden Zyklus
  zur Übernahme an.** Gefunden bei der Vorführung im Browser: Patrick lädt den Rainbow-Plan,
  während Run 01 trocknet. v1.5.134 lässt Run 01 dabei richtig an „BioBizz Official" — aber der
  Düngeplan-Bildschirm zeigte sofort ganz oben eine orange Karte mit großem grünem Knopf
  „‚Rainbow Düngeplan (v1.0)' für ‚Sensi Amnesia XXL Auto' übernehmen". Ein Tipp darauf hätte
  genau das getan, was v1.5.134 verhindert: die alten Tage von Run 01 mit Rainbow-Dosen gezeigt.
  Die Karte zählte jeden aktiven Zyklus als „laufend" — mit ihrer eigenen Kopie der Regel.
- **Jetzt eine Regel an einer Stelle:** `_duengungVorbei(c, iso)` (ab dem Spülen, und nach dem
  Curing). „Vorlage laden" und die Karte fragen beide sie. Mitten im Grow warnt die Karte weiter;
  neben einem trocknenden Run 01 bietet sie nur noch den neuen, nicht gestarteten Run 02 an.
  Wer einen fertigen Zyklus bewusst umstellen will, tut das weiter in dessen Einstellungen.
- Test: `test_zuweisungskarte.js` (10 Prüfungen). Vor der Korrektur gegen v1.5.138: 3 Fehlschläge.
- **Daraus zu lernen:** v1.5.134 hatte die Regel an der Stelle eingebaut, an der ich den Fehler
  gefunden hatte — nicht an der, wo dieselbe Frage („läuft dieser Zyklus noch?") ein zweites Mal
  gestellt wird. Gefunden hat es erst das Durchklicken, nicht der Test: Er prüfte, was „Vorlage
  laden" tut, nicht, was der Bildschirm danach anbietet.

## 2026-09-13 — v1.5.138

- **Die Kopfkarte „Dünger & Wochenplan" in den Einstellungen nannte fest „12 Wochen" — und
  notfalls einen internen Schlüssel.** Gefunden beim Nachsuchen nach `S.presetKey` (v1.5.136).
  Mit dem Rainbow-Plan stand dort „9 Produkte · 12 Wochen", der Plan hat 15. Und für Patricks
  behaltene Kopie V3.4.7, deren Vorlage seit v1.5.133 fehlt, stand wörtlich
  „**sensi_amnesia_auto** aktiv". Beides nachgestellt, bevor behoben.
- Name und Wochenzahl kommen jetzt aus dem aufgeschlagenen Plan selbst. Die Karte beschreibt
  weiterhin den aufgeschlagenen Plan — sie ist die Tür zum Düngeplan-Bildschirm, das ist dort
  richtig.
- Test: `test_kopfkarte.js` (12 Prüfungen). Vor der Korrektur gegen v1.5.137: 4 Fehlschläge.

## 2026-09-13 — v1.5.137

- **Ein Plan aus dem Einrichtungs-Assistenten bekam sein Gerüst nicht mit.** Beim Einbau des
  Rainbow-Plans gefunden. `_wizFinish` hatte eine eigene, ältere Kopie des Anlege-Codes und
  kopierte aus der Vorlage nur Produkte, Dosen und Mischreihenfolge. `loadPreset` übernimmt seit
  v1.5.50/51/94 zusätzlich Rückgrat (`weekPhases`), Skelett, Tagesgrenzen, EC-Ziele und den
  Dünger/Wasser-Rhythmus — der Assistent bekam keine dieser Verbesserungen mit.
- **Was das hieß:** Direkt nach dem Assistenten fehlte bei allen 12 Vorlagen das Rückgrat; die
  Plan-Wochen liefen dann starr nach Kalendertagen, bis beim nächsten App-Start die Migration
  aus v1.5.94 es nachtrug. Der **Dünger/Wasser-Rhythmus kam nie nach** — bei 7 Vorlagen, darunter
  „BioBizz Light" (die Empfehlung des Assistenten für Einsteiger) und „BioBizz Official". Wer so
  angefangen hat, bekam an jedem Guss Dünger, auch an den Tagen, die der Hersteller als reine
  Wasser-Tage vorsieht. Nach `ANBAU.md` 13.2 ist das die Richtung, die Pflanzen schadet.
- Jetzt ruft der Assistent dieselbe Hilfe wie „Vorlage laden" (`_planRueckgratAuffrischen`) und
  kopiert den Rhythmus mit. **Bestehende Pläne werden bewusst nicht nachgezogen:** Ein laufender
  Grow bekäme sonst mitten im Zyklus plötzlich Wasser-Tage, die es vorher nicht gab. Das zu
  entscheiden ist Patricks Sache (siehe `UEBERGABE.md`). Patricks eigener „BioBizz Official"-Plan
  ist nicht betroffen — er trägt den Rhythmus, weil er über den Düngeplan-Bildschirm entstand.
- Test: `test_assistentplan.js` (33 Prüfungen: jede Vorlage einmal durch den Assistenten, dann
  Neustart). Vor der Korrektur gegen v1.5.136: 19 Fehlschläge.

## 2026-09-13 — v1.5.136

- **Der Wochen-Tipp im Tageseintrag kam aus dem aufgeschlagenen Plan statt aus dem des
  Zyklus.** Beim Einbau des Rainbow-Plans gefunden. `_planStatusLine` und
  `_planWeekQuestion` lasen `weekFocus` aus `getPreset(S.presetKey)` — und `S.presetKey`
  ist der Plan, der im Düngeplan-Bildschirm gerade offen ist. Dieselbe Fehlerklasse wie
  v1.5.100, dort bei den Dosen. Nachgestellt mit Patricks Daten und einem Rainbow-Zyklus, in
  beide Richtungen:

  | aufgeschlagen | Zyklus | Statuszeile zeigte |
  |---|---|---|
  | BioBizz | Rainbow, Woche 4 | kein Etikett, und die Wochenfrage ohne den Tipp „Erste Pistillen notieren · Selektion · Alfa Boost nach Etikett" |
  | Rainbow | Patricks BioBizz-Zyklus, Woche 8 | „Bulk-Start · Ceiling-Test" — aus einem Plan, mit dem er nie gedüngt hat |

  Mit zwei Grows im Zelt — genau das, was Run 02 wird — hätte ein Blick in den Düngeplan
  gereicht, um im Eintrag des anderen Grows den falschen Rat zu bekommen. Beide Stellen lesen
  jetzt `getPlanForCycle(c).presetKey`. Der Düngeplan-Bildschirm selbst zeigt weiter den
  aufgeschlagenen Plan; dort ist das richtig.
- **Dieselbe Verwechslung an drei weiteren Stellen,** gefunden beim Nachsuchen nach
  `S.presetKey`: Die Zyklus-Zusammenfassung (`summarizeCycle`), der PDF-Bericht eines Zyklus
  (`exportReportPDF`) und der Tagebuch-Export (`exportDiary`) nannten für **jeden** Zyklus den
  gerade aufgeschlagenen Plan. Im Tagebuch stand damit bei Run 01 „Rainbow", sobald Rainbow
  offen war. Alle drei lesen jetzt den Plan des jeweiligen Zyklus; der Export nennt dessen
  gespeicherten Namen.
- Test: `test_wochentipp.js` (17 Prüfungen). Vor der Korrektur gegen v1.5.135: 10 Fehlschläge —
  7 in Statuszeile und Wochenfrage, 3 in Abschnitt D (Patricks Zyklus hieß in Zusammenfassung und
  Tagebuch „Rainbow Düngeplan", der PDF-Bericht las den aufgeschlagenen Plan).

## 2026-09-13 — v1.5.135

- **Mein Aufräumen aus v1.5.133 hätte Patricks Dünge-Verlauf aus dem Juli namenlos gemacht.**
  Beim Weiterprüfen gefunden — v1.5.133 und v1.5.134 waren da schon hochgeladen. Das Aufräumen
  entfernte eine Sensi-Kopie, sobald kein Zyklus mehr per `c.fertPlanId` auf sie zeigt.
  Patricks Zyklus hängt aber erst seit dem 03.09. an „BioBizz Official"; gedüngt hat er vorher
  mit V3.4.7, und genau dessen Produkt-IDs stehen in seinen Einträgen — in der Sicherung vom
  04.09. als Dosen, Dosis-Bezüge und 149 Misch-Häkchen, etwa am 28.07. und 31.07. (POWHUMUS,
  Bio-Bloom). Ohne den Plan lassen sich diese Zahlen keinem Produkt mehr zuordnen: Sie blieben
  im Speicher, aber ohne Namen.
- **Jetzt bleibt ein Plan auch dann, wenn ein gespeicherter Eintrag eines seiner Produkte
  trägt.** Bei Patrick heißt das: V3.4.7 bleibt in seiner Plan-Liste — gegen seinen Wunsch, aber
  sein Verlauf ist mehr wert als eine aufgeräumte Liste. Die Vorlage V6.0 bleibt entfernt, und
  in der Vorlagen-Auswahl steht kein Sensi-Plan mehr.
- **Wer v1.5.133 oder v1.5.134 schon geöffnet hat,** bei dem ist eine unbenutzt geglaubte Kopie
  bereits gelöscht und das Aufräumen als erledigt vermerkt. Zurück kommt sie nur aus einer
  Sicherung.
- Test: `test_rainbowplan.js` Abschnitt C neu gefasst (61 Prüfungen). Gegen den hochgeladenen
  Stand v1.5.134 gelaufen: 4 Fehlschläge, danach grün. „Wirklich unbenutzt" wird dort mit einer
  Sicherung ohne diese Verweise nachgestellt; dazu die Probe, dass eine behaltene, gerade
  aufgeschlagene Kopie ohne ihre Vorlage keinen Fehler und kein „undefined" erzeugt.
- **Daraus zu lernen:** „Wird dieser Plan noch gebraucht?" hat mehr als eine Antwortstelle. Ich
  habe die eine geprüft, die mir einfiel, statt im Zustand nachzusehen, wo die Produkt-IDs
  überall liegen. Ein Durchlauf über die Sicherung nach genau diesen IDs hat die anderen Stellen
  in Sekunden gefunden. **Vor jedem Löschen von Nutzerdaten: die Sicherung nach Verweisen auf
  das zu Löschende durchsuchen — nicht nach den Verweisen, an die man denkt.**

## 2026-09-13 — v1.5.134

- **„Vorlage laden" schrieb die Vergangenheit eines trocknenden Zyklus um.** Beim Einbau des
  Rainbow-Plans gefunden und mit Patricks Daten nachgestellt: `_cycleAufPlanZeigen` (v1.5.95)
  setzte beim Laden einer Vorlage **jeden** aktiven Zyklus auf den neuen Plan. Sein
  Sensi-Zyklus trocknet (Tag 121, gedüngt mit „BioBizz Official"). Nach „Rainbow laden" zeigte
  die zurückliegende Woche 6 seines Grows Silica Force, POWHUMUS und Advanced Amino statt
  CalMag, Bio·Grow und Top·Max. Das wäre genau in dem Moment passiert, in dem er den Plan für
  Run 02 anlegt — und niemand hätte es bemerkt, bis er einen alten Eintrag aufschlägt.
- **Jetzt behält ein Zyklus ab dem Spülen seinen Plan.** Danach hat der Plan ihm nichts mehr
  zu sagen; umhängen würde nur Vergangenes umschreiben, und beim Spülen stünde zusätzlich das
  Drain-Ziel des fremden Plans da. Unverändert bleibt, was v1.5.95 wollte: Mitten im Grow hängt
  „Vorlage laden" den Zyklus weiter um, und ein angelegter, noch nicht gestarteter Zyklus
  bekommt den neuen Plan — für ihn lädt man ihn ja. Wer einen fertigen Zyklus bewusst
  umstellen will, tut das in dessen Einstellungen.
- Test: `test_planumhaengen.js` (17 Prüfungen). Vor der Korrektur gegen v1.5.133 gelaufen:
  7 Fehlschläge (Trocknen, Spülen, nach dem Curing, und der trocknende Zyklus neben einem
  neuen); Blüte und noch nicht gestarteter Zyklus waren schon richtig.
  `test_planzuordnung.js` (v1.5.95) spielte an Tag 110 — mitten im Spülen, also genau im Fall,
  der jetzt bewusst nicht mehr umhängt. Er prüft jetzt Tag 61 in der Blüte, wofür er gedacht war.

## 2026-09-13 — v1.5.133

- **Der Rainbow-Plan ersetzt die Sensi-Amnesia-Pläne.** Patrick: „Das ist unser neuer
  Düngeplan für unseren nächsten Zyklus. Kannst du bitte meine alten Pläne, den Sensi Amnesia
  XXL Auto bitte alle die so heißen, V6.0 und V3.4.7 — füge dafür den neuen Rainbowplan ein."
  Die Vorlage `sensi_amnesia_auto` (V6.0) ist aus `FERT_PRESETS` entfernt, neu ist
  `rainbow_auto` — übertragen aus seinem Plan-Blatt „Rainbow Düngeplan v1.0" (Rainbow Donut
  Auto × Wham Boom Auto, Run 02), jede Dosis 1:1. V3.4.7 gab es nie als Vorlage im Code, nur
  als gespeicherte Kopie in seinen Daten; sie wird beim Laden einmalig entfernt
  (`S._sensiPlaeneAbgeloest`).
- **Warum beim Aufräumen etwas stehen bleiben darf:** Hängt noch ein Zyklus an einem
  Sensi-Plan — auch ein archivierter —, bleibt der Plan. Ohne ihn zeigte dieser Zyklus
  rückwirkend die Dosen eines fremden Plans, genau das Muster aus v1.5.100. Der letzte
  verbliebene Plan bleibt ebenfalls. Patricks laufender Zyklus rechnet mit „BioBizz Official"
  und ist nicht betroffen.
- **Drei Stellen nennt das Blatt ohne Zahl — die App erfindet keine:**

  | Blatt | im Plan | Grund |
  |---|---|---|
  | Alfa Boost, Wo 4–7: „n. Label" | in keiner Woche; Hinweis am Produkt und im Wochen-Tipp | eine ausgedachte Menge ist schlimmer als eine fehlende |
  | Bio-Bloom, Wo 10–12: „Ceiling" | 1,2 | der letzte Wert, den das Blatt selbst nennt („1,2 oder Ceiling" in Wo 9) — und niedriger als die weiteren Teststufen 1,35 / 1,5 (`ANBAU.md` 15) |
  | Bio-Grow, Wo 12: „0,3 → 0 nur bei Trigger, pro Pflanze" | 0,3 | den Stopp lösen die Trichome aus; ein verfrühter N-Stopp ist der teurere Fehler (`ANBAU.md` 5) |

  Für Woche 13 nennt das Blatt keinen EC-Korridor — dort steht deshalb auch keiner.
- **Aus „Woche 13 · Finish" werden drei Plan-Wochen:** 13 = Rampe (Bio-Bloom 0,5 · CalMag 0,5 ·
  Epsom 0,2), 14 = Spülen, 15 = IceFlush + Ernte. Das Blatt fasst das in einer Woche zusammen
  und nennt „Puffer bis Wo 15"; die App braucht eigene Wochen, um am Spültag „nur Wasser" sagen
  zu können. Die zehn Blüte-Wochen dehnen sich mit der echten Blütedauer (`planWeekBounds`):
  Bei 91 statt 70 Blütetagen dauert eine Plan-Woche gut 9 Tage, Woche 4 beginnt trotzdem an
  Tag 22.
- Tests: neu `test_rainbowplan.js` (54 Prüfungen) hält jede Dosis gegen eine zweite, je
  Produkt abgetippte Fassung des Blatts. Umgestellt auf Rainbow: Fingerabdruck in
  `test_duengeplaene.js`, `test_dosisquelle.js`, `test_wochenfolgen.js`,
  `test_planpause.js`, `test_startup.js` und `audit_lib.js`.
- **Nebenbei, keine App-Änderung: drei Tests alterten mit der Uhr.** `test_ernte_iceflush.js`,
  `test_fixes_0905.js` und `test_gussplan.js` prüfen Patricks Grow an einem bestimmten Tag, lasen aber
  die echte Uhr. Seit dem 09.09. — nach seiner Ernte — gibt es keinen Erntetag und keine
  Endspurt-Karte mehr, und 15 Prüfungen fielen um. Gegengeprüft am unveränderten Stand v1.5.132:
  dort dieselben 15 Fehlschläge, also nicht durch den Rainbow-Plan verursacht. Die Tests setzen
  das Datum jetzt fest (08.09., 05.09., 06.09.). Dabei auch den eigenen Rechenfehler gefangen:
  Der Fingerabdruck hatte 88 Gaben, richtig sind 85.

## 2026-09-08 — v1.5.132

- **Eine Warnung, die zweimal falsch war — und ein Knopf, der die Ernte 36 Tage zurückwarf.**
  Patrick: „Die Info verwirrt selbst mich, obwohl ich die App mit baue. Eigentlich muss sich
  der Düngeplan automatisch nach der Blütedauer richten, damit man überhaupt nichts mehr
  umstellen muss."
  Die Karte sagte: „Dieser Düngeplan ist für **49 Tage Blüte** gemacht, dein Zyklus steht auf
  **85** … Für die paar Extra-Tage führt die App die Düngung einfach sinnvoll weiter."

  | Behauptung | Wirklichkeit |
  |---|---|
  | „paar Extra-Tage" | 36 Tage — nicht paar |
  | „führt die Düngung weiter" | Seit v1.5.51 verteilt `planWeekBounds` die Plan-Wochen über den **echten** Zyklus. Nachgemessen: 12 Plan-Wochen über 113 Tage, eine Plan-Woche dauert rund 9 Tage. |

  Die Karte beschrieb also einen Zustand, den es seit v1.5.51 nicht mehr gibt — der Plan
  richtet sich längst automatisch. **Und der Knopf „auf 49 angleichen" war gefährlich:**
  Nachgerechnet an Patricks Zyklus verschiebt `bloomDays = 49` die Ernte von Tag 116 auf
  Tag **80**, samt Spülgängen und IceFlush — 36 Tage in die Vergangenheit. Angeboten als
  harmlose Korrektur „nur falls die 85 ein Versehen waren". Die Blütedauer kommt aus Sorte
  und Samentüte; sie ist kein Versehen, und der Plan-Hinweis ist kein Ziel.
  Stattdessen steht dort jetzt, was tatsächlich passiert — gerechnet aus `planWeekBounds`,
  also aus genau der Zuordnung, nach der die Dosen ausgegeben werden. Passen Plan und Zyklus
  ohnehin zusammen, bleibt die Karte still.

## 2026-09-08 — v1.5.131

- **Das Ernte-Log schrieb ins Leere.** Patrick am Erntetag: „Ich kann an dem heutigen Tag
  kein Gewicht der Ernte eintragen." Die Felder waren da und nahmen Eingaben an — sie
  schrieben nach `cd.harvestLog`, und **diesen Ort liest außer der Karte selbst niemand.**
  `getTotalHarvest` kennt `plants[].yieldWet/yieldDry` und `c.plantHarvest`, nicht aber
  `harvestLog`. Was dort eingetragen wurde, tauchte in der Zyklus-Bilanz, in den
  Einstellungen und in jeder Auswertung nie auf. Das ist v1.5.99 noch einmal, mit einem
  **dritten** Speicherort — und aus Nutzersicht heißt „steht nirgends" eben „geht nicht".
- **Jetzt je Pflanze**, wie Patrick es wollte: „Eigentlich müsste ich auch jede Pflanze
  einzeln eingeben bei der Ernte. So kann man besser vergleichen." Die Karte schreibt über
  `setPlantHarvest` an die Pflanze — also dorthin, wo gezählt wird. Schon früher geerntete
  Pflanzen stehen mit ihrem Schnitt-Datum dabei; der Vergleich über die Pflanzen hinweg ist
  ja der Zweck. Darunter Nass- und Trockensumme plus Trocken-Anteil, und die Summenzeile
  zieht beim Tippen sofort mit (`_ernteSummeAktualisieren` — ein voller Neuaufbau würde den
  Fokus aus dem Feld reißen).
- **Ein früher eingetragener Wert verschwindet nicht stillschweigend.** Steht noch etwas im
  alten `harvestLog`, wird es angezeigt, mit dem Hinweis, dass es nie mitgezählt wurde und
  wohin es gehört.
- **Die Karte bleibt bis zum Ende des Curings erreichbar.** Vorher verschwand sie mit dem
  Ende der Trocknung — also genau dann, wenn das Trockengewicht endlich feststeht
  (`ANBAU.md` 12.1: 7–14 Tage Trocknung).

## 2026-09-08 — v1.5.130

- **„Hier wird aus 1 L Eis, 11250 ml Wasser."** Exakt nachgerechnet: 11 L Topf × 341 =
  3750 ml — das ist die **Spül**-Formel — × 3 Pflanzen = 11250. Die Zahl stand auf der
  IceFlush-Karte, weil zwei Stellen verschiedene Quellen befragen: Die Karte prüft
  `getAction(iso) === 'ice'`, die Menge ging über `p.ph`. Solange beides zusammenfällt,
  merkt das niemand — bei einem **vorgezogenen** IceFlush fällt es auseinander: Aktion
  `ice` an Tag 113, Phase dort noch `flush`. Die Menge folgt jetzt der Aktion; sie
  beschreibt, was an diesem Tag getan wird. Ergebnis: 2100 ml statt 11250 (700 ml je Topf
  × 3). Der Kartentext nennt außerdem die Menge **je Topf** und die Summe getrennt — vorher
  las sich „~1 L Crushed Ice pro Topf … schmilzt zu ~11250 ml", als würde ein Liter Eis zum
  Elffachen schmelzen.
- **Zwei widersprechende Karten am selben Tag.** Tag 113 zeigte „Hard-Dryback-Phase ·
  IceFlush in 1 Tag" und direkt darunter „🧊 IceFlush!" — also „ab jetzt nicht mehr gießen,
  Eis kommt morgen" neben „leg jetzt Eis". Ist heute der Eistag, hat der Dryback-Hinweis
  nichts mehr zu sagen.
- **Symbol und Beschriftung standen auf verschiedenen Tagen.** Im Kalender trug Tag 113 das
  Symbol 🧊 ohne Wort, Tag 114 das Wort „IceFlush" ohne Symbol. Ursache: Die Beschriftung
  markiert den Phasenwechsel, das Symbol die Aktion. **„IceFlush" und „Ernte" sind aber
  Ereignisse, keine Zeiträume** — ihre Beschriftung gehört auf den Tag, an dem sie
  stattfinden. Für Zeitraum-Phasen (Blüte, Spülen, Trocknen, Curing) bleibt alles wie bisher.
- **Woher der Bruch kam:** Patrick hat den IceFlush vorgezogen, bevor v1.5.110 ausgeliefert
  war. Der damalige `moveGussDay` legte einen Vermerk an, der nur die **Aktion** verschiebt;
  v1.5.110 hat den Weg repariert, die bereits entstandenen Daten aber nie aufgeräumt.
  **Bewusst nicht nachträglich migriert:** Eine Phasenverschiebung würde heute seinen
  Erntetag von 116 auf 115 ziehen — mitten in der Ernte. Die Anzeige folgt jetzt der Aktion,
  das genügt und ist ungefährlich.
- Abgesichert durch `test_ernte_iceflush.js` (35 Prüfungen, beide Zeitzonen).

## 2026-09-08 — v1.5.129

Patricks Entscheidung: „Wir bleiben bei der kleinen Variante" — also keine tausend
Katalog-Einträge, sondern die 45 vorhandenen Sorten auffindbar machen und den Weg
offenhalten, der nachweislich am genauesten rechnet: die Wochen-Angabe von der eigenen
Samentüte.

- **Die Sortensuche war unsichtbar.** Sie hing seit jeher am Feld **„Name des Zyklus"**
  (Platzhalter „z.B. Zyklus 2"). Nichts sagte, dass man dort Sorten findet — wer seinem
  Zelt einen Namen gab oder den Vorschlag stehen ließ, erfuhr nie, dass 45 Sorten
  hinterlegt sind. Unter dem Feld steht jetzt: „Tippst du hier einen **Sortennamen**,
  durchsucht die App alle 45 hinterlegten Sorten und übernimmt Reifezeit und Steckbrief.
  Du kannst aber genauso gut deinem Zelt einen eigenen Namen geben — die Sorte ist
  optional." Beides bleibt möglich, und beides steht jetzt dran.
- **Nur sechs Sorten waren erreichbar.** „Beliebte Sorten" zeigte sechs Chips; die übrigen
  39 gab es nur, wenn man den Namen erriet. Ein Aufklapper „▾ Alle 15 Automatics anzeigen"
  bringt den Rest. Die Zahl nennt bewusst die **gefilterte** Menge und wonach gefiltert
  wurde — sonst stünde darüber „45 Sorten" und darunter „Alle 15", ohne erkennbaren Grund.
  Aufgeklappt wird per DOM statt über `_renderWiz()`: Ein Neuaufbau würde den Eingabefokus
  im Namensfeld verlieren.
- **Die eigene Wochen-Angabe sagt jetzt, dass sie gewinnt.** `_wizFinish` rechnet seit
  v1.5.34 richtig — selbst eingetragene Wochen von der Tüte schlagen die Sorten-Vorlage,
  weil sie zu genau diesen Samen gehören. Nur sagte es niemand: Wer erst 16–17 Wochen
  eintrug und danach eine Sorte wählte, sah „91–104 d" aufblitzen und hielt das für seinen
  Plan. Die Meldung lautet jetzt „✓ Northern Lights übernommen — geplant wird weiter mit
  deiner Wochen-Angabe von der Tüte."
- `test_sortendauer.js` um 17 Prüfungen erweitert (jetzt 62), beide Zeitzonen.

## 2026-09-07 — v1.5.128

- **Die 14 Automatics planen nicht mehr mit der Züchterzahl.** Patricks Auftrag: „Über die
  Spannen der einzelnen Pflanzen kann ich nichts sagen. Suche dir immer die realistischen
  Zeitspannen raus." Recherchiert wurde — und das Ergebnis war unbrauchbar: **Es gibt keine
  belastbare öffentliche Datenbasis für echte Sorten-Laufzeiten.** Was existiert, ist die
  Züchterangabe (systematisch optimistisch), Einzel-Grow-Berichte (n = 1, stark streuend)
  und Marketing-Seiten, die die Züchterangabe recyceln. Eine Seite, die wie aggregierte
  Daten aussah, entpuppte sich beim Nachlesen als Werbetext ohne jede Stichprobe.
  14 handverlesene Zahlen daraus wären derselbe Fehler wie v1.5.98 gewesen — nur mit dem
  Anschein von Recherche.
  **Stattdessen eine Regel an einer Stelle**, direkt aus `ANBAU.md` 9: „Abweichungen von
  30–50 % nach oben sind in Hobbyanlagen die Regel." `strainDays` leitet für Automatics
  ohne eigene Messung jetzt eine Spanne her — unteres Ende **×1,4**, oberes **×1,6** (der
  Planungswert). Der Faktor ist an zwei unabhängigen Punkten geprüft:

  | | Züchter | real | Faktor |
  |---|---|---|---|
  | Sensi Amnesia XXL (Patricks Grow) | 75 d | 105–120 d | ×1,40–1,60 |
  | Northern Lights Auto (Grow-Bericht) | 65 d | 101 d | liegt in 91–104 |

  Ergebnis: Die Automatics planen jetzt mit **11–17 Wochen statt 8–11**. Quick One 78–90
  Tage, Jack Herer und Sour Diesel 105–120.
- **Eine Herleitung gibt sich nicht als Messung aus.** `strainDays` liefert neu ein Feld
  `quelle` mit drei Zuständen, und der Steckbrief sagt jeden davon anders: *gemessen*
  („Aus einem echten Grow"), *hochgerechnet* („Hochgerechnet aus der Züchter-Angabe
  (65 Tage), **nicht nachgemessen** … Steht auf deiner Samentüte eine Wochen-Angabe, trag
  lieber die ein — die rechnet genauer") und *zuechter* für Photoperiodische.
  **Photoperiodische bleiben unverändert** — dort ist die Angabe die reine Blütezeit, die
  Vegi-Länge bestimmt der Grower selbst, und die Züchterangabe ist deshalb belastbar.
  Eine echte Spanne am Strain schlägt die Herleitung immer.
- `test_sortendauer.js` um 21 Prüfungen erweitert (jetzt 45). Zwei alte Regeln prüfen jetzt
  das Gegenteil von vorher — mit Begründung im Test, warum das Absicht ist.

## 2026-09-07 — v1.5.127

- **Bei zwei gleichzeitigen Grows gehörten Symbol und Tagesnummer zu verschiedenen
  Pflanzen.** Die Kalenderzelle wählt Farbe und Symbol nach dem Zyklus, der an diesem Tag
  eine Aufgabe hat (`actionDay`) — die Tagesnummer nahm sie aber immer vom ersten Zyklus in
  der Liste (`phaseDay = dayInfo[0]`). Nachgemessen mit zwei Grows: Am 03.09. zeigte die
  Zelle **„🌿 T111"** — das Gieß-Symbol gehörte zum 52 Tage alten zweiten Grow, die Nummer
  T111 zum ersten, der längst in der Trocknung war. Zwei Angaben nebeneinander, die
  verschiedene Pflanzen beschrieben, ohne dass man es sehen konnte. Die Nummer folgt jetzt
  demselben Zyklus wie Farbe und Symbol.
  **Warum das jetzt zählt:** Patrick will vor dem Release zwei Sorten in einem Zelt testen —
  genau dieser Fall.
- **Hatte ein zweiter Zyklus am selben Tag etwas zu tun, war davon nichts zu sehen.** Am
  06.09. stand „🧊 IceFlush" (Zyklus 1), während Zyklus 2 einen **Gießtag** hatte — die
  Zelle zeigt nur ein Symbol. Jetzt markiert ein kleiner Punkt in der Farbe des jeweiligen
  Zyklus, dass dort noch etwas ist; der Tooltip nennt Grow und Aufgabe, das Antippen öffnet
  ohnehin den Tag mit allen Zyklen.
- **Das Tagesmenü war am Rechner überhaupt nicht erreichbar.** `showCtx` hing ausschließlich
  am Touch-Langdruck (`ontouchstart` → `lpS`), und `oncontextmenu="return false"` schaltete
  den einzigen anderen Weg ausdrücklich ab. Zwei Funktionen hängen sogar **nur** daran:
  „Gieß-Tag überspringen" bei Regen (`skipDayFromCal`) und „Tag zurückholen"
  (`restoreDayFromCal`) — am Laptop gab es für sie keinen einzigen Aufrufweg, während der
  Hinweis unter dem Kalender sie auf jedem Gerät bewarb. Der Rechtsklick öffnet das Menü
  jetzt; der Hinweis nennt ihn.
  **Der heikle Teil war die Doppelauslösung:** Android feuert beim langen Drücken zusätzlich
  `contextmenu`, und die Reihenfolge zum 450-ms-Timer ist nicht garantiert. Beide Fälle
  werden abgefangen. **Und ein Fehler, den ich mir dabei fast eingebaut hätte:** Der erste
  Entwurf setzte die Klick-Sperre `lpDone` auch beim Mausklick — eine Maus feuert nach einem
  Rechtsklick aber gar keinen Klick, die Sperre wäre stehengeblieben und hätte den *nächsten*
  Linksklick geschluckt. Nachgemessen: Der Tag ließ sich danach erst beim zweiten Antippen
  öffnen. Die Sperre wird jetzt nur noch gesetzt, wenn ein Langdruck-Timer lief — also bei
  Berührung.
- Abgesichert durch `test_kalender.js` (23 Prüfungen, beide Zeitzonen).
- **Geprüft und in Ordnung:** Das Datumsraster stimmt über sieben Monate hinweg, inklusive
  beider Zeitumstellungen 2026 (29.03. und 25.10.), Februar und Jahreswechsel — keine
  doppelten, fehlenden oder falsch beschrifteten Tage. Jeder Aktionstag trägt sein Symbol.
  Dass die Beschriftung nur am **ersten** Tag einer Phase steht, ist Absicht: sonst stünde
  siebenmal „Trocknen" untereinander.

## 2026-09-07 — v1.5.126

- **„Kontrollierter Trockenstress = mehr Trichome" abgeschwächt — auf Patricks Entscheidung
  hin.** Der Punkt stand seit v1.5.125 als offene Frage in der Übergabe: `ANBAU.md` sagt
  dazu nichts, und wo das Dokument keine Antwort gibt, wird nach seiner eigenen Regel
  nachgefragt statt geraten. Es waren am Ende **neun** Stellen, nicht die zwei aus dem
  ersten Suchlauf:

  | Ort | stand da |
  |---|---|
  | Lexikon „Luftfeuchtigkeit" | „40–50% RLF (kontrollierter Trockenstress = mehr Trichome)" |
  | Lexikon „VPD", zweimal | „Kontrollierter Trockenstress → massive Trichom-Überproduktion" |
  | Lexikon „Hard Dryback" | „reagiert mit erhöhter Trichom-Produktion … Der Effekt ist messbar" |
  | VPD-Ampel im Eintrag, zweimal | „der milde Trockenstress fördert die Harzbildung", „Premium: Trichom-Boost" |
  | **IceFlush-Karte im Eintrag** | **„Studien zeigen 10–20% mehr Trichomproduktion"** |
  | Outdoor-Frostwarnung | „bei Spätblüte ist's ein Trichom-Booster" |
  | VPD-Diagramm-Legende | „gezielt 1.4–1.6 für Trichom-Boost" |

  **Die Empfehlungen selbst sind unverändert geblieben** — Spätblüte weiterhin 40–50 % RLF
  und VPD 1,4–1,6 kPa. Geändert hat sich nur ihre *Begründung*: Der belegte Grund für
  trockene Luft in der Spätblüte ist der **Schimmelschutz** (`ANBAU.md` 13.5 — Botrytis ab
  60–65 % RLF, und im dichten Bud liegt das Mikroklima über dem Raumwert). Das Trichom-Plus
  wird jetzt als „oft berichtet, nicht belastbar belegt" geführt, statt als Tatsache.
- **Eine Korrektur an meiner eigenen Aussage von gestern.** In der Übergabe zu v1.5.125
  stand, `ANBAU.md` 14 lobe zu Recht, dass die App beim IceFlush offen sei — „auf den Karten
  im Tageseintrag". Das war zu großzügig: Genau dort stand „Studien zeigen 10–20 % mehr
  Trichomproduktion". Mein Lexikon-Test hatte es nicht gefunden, weil er nur `LEXIKON`
  durchsuchte.
  `test_lexikon.js` prüft deshalb jetzt den **gesamten ausgelieferten Quelltext** auf die
  vier Muster („Studien zeigen <Zahl>", „Trichom-Boost", „= mehr Trichome", „<Zahl> % mehr
  THC") — und unterscheidet dabei die Zahl als **Behauptung** von derselben Zahl als
  **zitierter und entkräfteter** Zahl. Diese Unterscheidung hat mir der Test inzwischen
  dreimal beigebracht.
- Nebenbei entfernt: „VPD ist der Hebel für **30 %+ mehr Ertrag**" — auch eine Zahl ohne
  Beleg. Die Begründung steht jetzt auf dem, was `ANBAU.md` 1 und 2 tatsächlich hergeben:
  Ohne Transpiration kommen die unbeweglichen Nährstoffe, allen voran Calcium, nicht oben an.
- `test_lexikon.js` jetzt 49 Prüfungen, beide Zeitzonen. Alle 41 Testdateien grün.

## 2026-09-07 — v1.5.125

- **Vier Wirkungszusagen im Lexikon, die `ANBAU.md` 14 ausdrücklich als unbelegt führt.**
  Geprüft wurden die 139 Einträge gezielt dort, wo sie etwas *empfehlen* oder eine Wirkung
  *zusagen*. Gefunden:

  | Eintrag | stand da | `ANBAU.md` 14 |
  |---|---|---|
  | IceFlush | „Studien zeigen 5–20 % mehr Trichome" | „Kein belegter Trichom- oder Potenzeffekt" |
  | UV-Bestrahlung (2 Stellen) | „Studien zeigen 5–15 % mehr Cannabinoide", „→ +5-15% THC" | „Befundlage gemischt bis negativ … nicht als Qualitätsmaßnahme ausgeben" |
  | Dunkelphase | „manche Studien deuten auf 5–10 % mehr THC hin" | „Kein belegter THC-Zuwachs" |
  | Spülung | „Macht den Unterschied zwischen kratzigem und sauberem Rauch" | „Keinen belastbaren Unterschied in Geschmack, Aschequalität oder Analytik" |

  **Nichts davon ist verboten worden** — `ANBAU.md` 14 sagt selbst, wie es stattdessen
  dastehen soll: „Beliebte Grower-Technik, ein Trichom-Plus ist wissenschaftlich allerdings
  nicht belegt." Die Techniken bleiben vollständig beschrieben und die App plant sie weiter
  ein. Was bleibt, ist auch das **Belegte**: die kälteinduzierte Anthocyan-Färbung beim
  IceFlush, der Terpen-Erhalt als echter Grund für die Dunkelphase, der messbar fallende
  Drain-EC beim Spülen — und beim UV sämtliche Sicherheitshinweise, denn Netzhautschäden
  sind irreversibel.
  **Die Spülung fand erst der Test.** Mein erster Suchlauf hatte sie für ehrlich gehalten,
  weil sie einen *anderen* Mythos entkräftet („Spülung ist immer nötig" bei Living Soil) —
  der eigentliche Punkt stand unentkräftet im Kurztext.
- **Eine Lichtgrenze, mit der die App sich selbst widersprach — an zwei Stellen.**
  „Photosynthese" sagte: „wenn CO₂ bei Raum-Standard 400 ppm bleibt, bringt mehr Licht über
  **700 PPFD** kaum mehr Wachstum." „PPFD & DLI" sagte: „Über **900 PPFD** ohne
  CO₂-Anreicherung ist verschenkte Energie." Nach `ANBAU.md` 8.1 gilt die Sättigung bei
  900–1000 für das **einzelne Blatt**; der Bestand nutzt mehr Licht weiter, weil es tiefer
  eindringt und die unteren Etagen mitversorgt — gemessen bis in die Größenordnung 1800.
  Die zweite Stelle stand dabei direkt unter der Zeile, die 600–900 als Blüte-**Ziel**
  nennt: 900 wäre danach gleichzeitig Ziel und Verschwendung.
  **Die Richtung war die schädliche:** Wer den Satz glaubt, beleuchtet zu schwach — und
  Licht ist in Hobbyanlagen fast immer der Engpass. Beide Stellen nennen jetzt das
  sichtbare Kriterium für ein echtes Zuviel: ausgebleichte, weiße Blütenspitzen.
- **Trichom-Messung um zwei Punkte aus `ANBAU.md` 11 ergänzt.** Erstens die Warnung vor
  **Foxtails**: Die nachgeschobenen Kelchtürme sind junges Gewebe und fast nur klar — wer
  dort misst, hält die Pflanze für unreif und wartet zu lange. Zweitens **immer dieselben
  Stellen** wiederverwenden, damit eine Kurve entsteht statt einer Reihe von
  Momentaufnahmen; genau darauf baut die Ernte-Prognose dieser App auf. Was schon
  richtig dastand und bleibt: Messung am Calyx statt an Sugar-Leaves, mehrere Stellen und
  Pflanzen, Bernstein als Oxidation zu CBN, und Pistillen ausdrücklich **kein** Kriterium.
- Abgesichert durch `test_lexikon.js` (42 Prüfungen, beide Zeitzonen). Der Test
  unterscheidet zwischen einer Zahl als **Behauptung** und derselben Zahl als **zitierter
  und entkräfteter** Zahl — beim ersten Lauf hatte er mir zweimal die eigene
  Richtigstellung als Fehler gemeldet.
- **Geprüft und in Ordnung:** Trocknen 18–20 °C / 55–62 % RLF und Curing 58–62 % im Glas
  decken sich mit `ANBAU.md` 12; die Drain-Angabe steht seit v1.5.112 korrekt auf 15–20 %;
  ppm wird nirgends ohne Skalen-Angabe genannt (`ANBAU.md` 5); Entlaubung und die
  Griffelbräunung als Nicht-Kriterium waren bereits richtig.

## 2026-09-07 — v1.5.124

- **Das klassische Eisenbild fiel durch das Raster — und der Vorschlag war der falsche.**
  `ANBAU.md` 4 beschreibt es genau: „Zu hoch (> 6,8): Eisen, Mangan, Zink und Bor gehen in
  schwerlösliche Formen über. Klassisches Bild: Eisenchlorose — hellgelbe **junge** Blätter
  mit zunächst grün bleibenden Blattadern." `ph_lockout` kannte aber nur `allLeaves`. Wer im
  Symptom-Checker „Neue Blätter (oben)" und „Gelb" wählte, bekam:
  `ca_deficiency 72% · nutrient_burn 72% · light_burn 72% · photo_bleaching 72%` — also den
  **Calcium-Mangel zuoberst**, dessen Handlung „CalMag geben" nach `ANBAU.md` 6.2 hier die
  falsche Richtung ist: Calcium ist selbst ein Magnesium-Antagonist, und die Ursache liegt
  fast nie in der Menge, sondern in der Verfügbarkeit. `ph_lockout` selbst stand nicht
  einmal unter den ersten fünf — der Kontext-Bonus „pH zu hoch" greift nur bei Einträgen,
  die über die Symptome überhaupt hereinkommen.
  Neu: ein eigener Eintrag **`iron_deficiency`** („Eisen-Mangel (Fe) — meist eine pH-Frage")
  mit dem Unterscheidungsmerkmal zum Magnesium-Mangel im Text (Fe oben, Mg unten,
  `ANBAU.md` 6.1), dem Kalkpuffer-Vorbehalt für Erde (`ANBAU.md` 4.1) und der ausdrücklichen
  Warnung, nicht mit CalMag gegenzusteuern. **Er hat bewusst keine Form-Symptome** —
  Chlorose verformt das Blatt nicht, sie färbt es. Dadurch wird er über den *Kontext*
  sichtbar, und genau das ist richtig: ohne pH-Auffälligkeit bleibt Calcium der bessere
  erste Verdacht, mit hohem pH führt das Eisen. `ph_lockout` bekommt zusätzlich `newLeaves`.
- **`light_burn` lief in zwei von drei Diagnosen mit.** Gemessen über alle möglichen
  Ein-Symptom-Kombinationen erschien es in **66 %** davon unter den ersten fünf — mit
  Abstand der häufigste Eintrag, und mit zehn gelisteten Symptomen das breiteste Profil
  (nächstes: sieben). Zwei davon widersprechen `ANBAU.md` 8.2: `wilting` (hängende Blätter
  sind nach `ANBAU.md` 1 das Bild von Wassermangel, Überwässerung oder osmotischem Entzug)
  und `paleGreen` (Photobleaching bleicht nach **weiß** aus, thermischer Stress vergilbt —
  genau die Farbe trennt die beiden Mechanismen mit ihren verschiedenen Gegenmaßnahmen).
  Beide entfernt; das echte Bild (verbrannte Spitzen, Taco, knisternd, gelb/braun) bleibt.
- **Bei Punktgleichstand entschied die Reihenfolge im Quelltext.** `Math.min(1, score +
  ctxBoost)` deckelt bei 1 — wer über die Symptome schon bei 100 % liegt, kann durch den
  Kontext nicht mehr steigen, der Hinweis „zu warm" verpuffte. Folge: „verbrannte Spitzen
  **+ zu warm**" nannte die Überdüngung vor dem Lichtbrand, „Taco oben **+ zu warm**" den
  Calcium-Mangel. **Die Punktzahlen bleiben unverändert** — nur die Reihenfolge
  gleichwertiger Treffer entscheidet sich jetzt der Reihe nach nach: Kontext-Bonus
  (Messwerte schlagen Zufall), **Schweregrad** (nach `ANBAU.md` 15 wird bei Unsicherheit in
  Richtung Sicherheit gerundet — die gefährlichere Erklärung braucht die schnellere
  Reaktion), dann engeres Profil.
  **Der Schweregrad kam erst durch den Test dazu:** Ohne ihn stand „Trauermücken" (medium)
  vor „Überwässerung" (high) bei „alle Blätter hängend, Erde dauernass" — und Überwässerung
  ist nach `ANBAU.md` 13.1 der häufigste Anfängertod.
- Abgesichert durch `test_diagnose.js` (38 Prüfungen, beide Zeitzonen), darunter eine
  Stimmigkeitsprüfung der ganzen Datenbank: keine unbekannten Symptom-Schlüssel, keine
  doppelten IDs, jeder Eintrag mit Name, Beschreibung und Handlung.

## 2026-09-07 — v1.5.123

- **Draußen wurde die IceFlush-Phase mitgezählt, die es draußen nicht gibt.** Das
  Phasenmodell (`phase`, `getAction`) lässt sie für `growType === 'outdoor'` seit jeher
  weg — der IceFlush ist ein Indoor-Ablauf (Crushed Ice am Topfrand, danach 24–36 h
  Pitch-Black). Dieselbe Rechnung stand aber **zwölfmal von Hand** im Code, und nur fünf
  davon prüften den `growType`. Patricks Zyklus testweise auf Outdoor gestellt:

  | | sagt |
  |---|---|
  | `getAction` (die echte Kette) | Ernte an Tag **114**, kein einziger Ice-Tag |
  | `endspurtState` (die Endspurt-Karte) | Ernte Tag **116**, IceFlush an Tag 114 |

  Betroffen waren `endspurtState`, `harvestCountdown`, `daysToHarvest`, `contextFor`
  (Finisher-Fenster), `planWeekBounds` (Düngeplan-Wochenraster), `shiftPlanToDay`, die
  Trichom-Prognose und die Zyklus-Diagramme. **Die Richtungen widersprachen sich sogar
  untereinander:** Erntezähler und Endspurt lagen zu *spät*, die Umrechnung der
  Samentüten-Wochen (`bloomDaysFromSeedWeeks`) zog die Blütezeit dagegen zu kurz und damit
  die Ernte zu *früh* — nach `ANBAU.md` 11 der teuerste Fehler im ganzen Zyklus, weil er
  sich nicht mehr korrigieren lässt.
  Neu ist `iceLenFor(c)` als **einzige Quelle**; alle zwölf Handkopien rufen sie jetzt auf.
  Für Indoor liefert sie exakt denselben Wert wie zuvor — Patricks Kette steht unverändert
  auf Guss 104 · Spülen 107/110 · Ice 114 · Ernte 116.
- **Die Endspurt-Karte bot draußen einen IceFlush an, den es nicht gibt.** Die Zeilen
  „🧊 IceFlush ändern" und „🌵 Hard-Dryback vor dem Ice" ließen einen Tag einstellen, der
  nie eintrat. Die Einstellungen blenden `iceDays` für Outdoor längst aus (`durListAll`) —
  die Endspurt-Karte zog nicht mit. Beide Zeilen entfallen dort jetzt; Spülen und Ernte
  bleiben einstellbar.
- **Die Migration stempelte Erde-Rhythmen in jeden Zyklus.** `RI.*` (Anzucht 3 · Blüte 3 ·
  Spülen 4) wurde beim Laden in jeden Zyklus geschrieben, dem die Intervall-Felder fehlten
  — **ohne aufs Substrat zu sehen**, obwohl `mediumIntervals()` seit Langem für Coco 2/1/1
  und für Hydro 1/1/1 liefert und beim Anlegen auch benutzt wird. Ein Coco-Zyklus aus einer
  älteren Fassung bekam damit still einen 3-Tage-Rhythmus, während `classifyRestPct` für
  dasselbe Substrat unter 60 % Restgewicht bereits „Zu trocken für Coco" meldet. Nach
  `ANBAU.md` 7.1 hat Coco kaum Pufferkapazität und verzeiht Austrocknen schlecht — der
  Stempel war also nicht nur widersprüchlich, er führte zu Trockenstress. Und er war
  dauerhaft: Wer das Substrat-Feld nie wieder anfasst, löst `setCycleMedium` nie aus.
  Bereits gesetzte Werte bleiben unangetastet.
- Abgesichert durch `test_outdoor.js` (29 Prüfungen, beide Zeitzonen). Der Test prüft vor
  allem, dass **Indoor sich nicht verändert hat** — im Phasenmotor hängt jeder Gießtag
  jedes Zyklus.

## 2026-09-06 — v1.5.122

- **Der Kalender ohne Zyklus erklärte sich nicht und versprach etwas Falsches.** Er zeigte
  ein leeres Monatsraster ohne ein Wort dazu, warum nichts drinsteht — darunter aber
  „lange drücken für Gießtag verschieben & mehr", eine Funktion, die ohne Zyklus nichts tun
  kann. Der Kalender ist einer von vier Haupt-Tabs und damit für viele der zweite
  Bildschirm überhaupt. Jetzt steht dort, was hier später zu sehen sein wird, mit Knopf zum
  Zyklus; der Verschieben-Hinweis erscheint erst, wenn er stimmt. Das Monatsraster bleibt —
  einen Tag antippen und eine Notiz hinterlegen geht auch ohne Zyklus.

## 2026-09-06 — v1.5.121

- **Der Tageseintrag ohne Zyklus versprach Felder, die es nicht gab, und hatte zwei stumme
  Speichern-Knöpfe.** Wer im Kalender einen Tag antippt, bevor er einen Zyklus angelegt hat,
  bekam den Einsteiger-Banner „Die App funktioniert auch mit **nur dem Wasser-Feld**. pH,
  EC, Temp & Co. sind hilfreich, aber nicht Pflicht" — über einem Bildschirm mit **null**
  Eingabefeldern. Dazu ein großes „💾 Speichern" unten und eine Speichern-Pille oben;
  nachgemessen: ein Druck darauf tat **nichts** — keine Meldung, keine Bewegung, kein
  Eintrag. Ein Knopf, der schweigend nichts tut, ist schlimmer als kein Knopf.
  **Der eigentliche Schaden lag aber im Banner:** Sein ✕ setzt `S._entryHelpSeen`
  **dauerhaft**. Wer den Hinweis dort als nutzlos wegklickt, bekommt ihn beim ersten echten
  Eintrag — für den er gedacht ist — nie wieder zu sehen. Beides erscheint jetzt nur noch,
  wenn es einen Zyklus gibt; stehen bleibt „Keine aktiven Zyklen" mit „Zyklus erstellen".

## 2026-09-06 — v1.5.120

- **Der Gieß-Fahrplan ohne Zyklus war eine Sackgasse.** „Kein Zyklus aktiv." auf schwarzer
  Fläche, ein Zurück-Pfeil, sonst nichts. Erreichbar ohne Umweg: Die Einstellungen laden mit
  der Zeile „💧 Gieß-Fahrplan · Wann düngen, wann nur wässern · Menge pro Guss · einzelne
  Tage tippbar" ausdrücklich zum Antippen ein, auch bevor ein Zyklus besteht. Jetzt erklärt
  der Bildschirm, woraus er rechnet, und bietet dieselben zwei Wege wie das leere Dashboard
  (Zyklus anlegen · Demo laden). Der zweite Leer-Zustand („keine Blüte-Güsse berechenbar",
  ein Sicherheitsnetz, das normalerweise nicht eintritt — selbst an Tag 1 sind es 13 Güsse)
  nennt jetzt die zwei möglichen Ursachen, statt eine zu behaupten.
  **Vorbild ist `_emptyProds` im Düngeplan**, der es längst richtig macht. Als Muster: Ein
  leerer Zustand ist dieselbe Kategorie wie eine Fehlermeldung — er braucht *was fehlt* und
  *was tun*.

## 2026-09-06 — v1.5.119

- **Der Gieß-Fahrplan sagte einem frisch angelegten Zyklus, er solle 23 Tage nicht gießen.**
  Der schwerste Befund dieser Sitzung. Die Karte „Nächster Guss" las aus `steps`, und
  `steps` ist `collectBloomGusse(c)` — eine Liste, die erst bei `anzuchtDays + 1` beginnt.
  Die fünf Anzucht-Güsse (Tag 9, 12, 15, 18, 21) und der Sättigungsguss an Tag 1 kommen
  darin schlicht nicht vor. Ergebnis an **Tag 1**, beides gleichzeitig auf dem Bildschirm
  nebenan:

  | Dashboard | Gieß-Fahrplan |
  |---|---|
  | „💦 Heute: Sättigungsguss (Tag 1) — 700 ml in 3 Etappen" | „Nächster Guss · **in 23 Tagen** · Tag 24" |

  Wer dem Bildschirm glaubt, der „Gieß-Fahrplan" heißt, lässt seinen Sämling drei Wochen
  ohne Wasser. Das ist genau das Muster aus Abschnitt 1 der Übergabe — zwei Bildschirme,
  dieselbe Frage, verschiedene Antworten —, hier mit einer toten Pflanze am Ende.
  **Die App kannte die richtige Antwort längst:** `isGiessTag(iso, c)` zählt genau die
  Aktionen, die ein Guss sind (`giess`, `giess_anz`, `spuelen`, `ice`, `saettigung` —
  Sprühen ausdrücklich nicht, mit Kommentar im Code), und `nextGiessTag(c, from)` sucht sie
  60 Tage voraus. Die Karte fragte nur die falsche Quelle. Sie benutzt jetzt beide, fällt
  bei fehlendem Ergebnis auf das bisherige Verhalten zurück, und benutzt weiterhin den
  Listeneintrag, wenn der nächste Guss in der Blüte-Liste steht — damit Feed/Wasser, Sperren
  und Guss-Index unverändert gelten.
- **Die Liste sagt jetzt, dass sie eine Blüte-Liste ist.** Solange der Zyklus in der Anzucht
  steht, fehlt darin genau das, wonach man sucht. Sie hier nachzubauen wäre ein Eingriff in
  den Feed/Wasser-Umschalter (der am Blüte-Guss-Index hängt); stattdessen steht ein Hinweis
  darüber, der ab dem ersten Blüte-Guss wieder verschwindet.
- Abgesichert durch `test_gussplan.js` Abschnitt G (12 Tage gegen `isGiessTag` gegengeprüft)
  und `test_leerzustand.js` (27 Prüfungen, läuft bewusst **ohne** Patricks Sicherung — der
  leere Speicher ist der Prüfgegenstand).

## 2026-09-06 — v1.5.118

- **Der Gieß-Fahrplan sagt auch dann etwas, wenn kein Guss mehr ansteht.** `_naechster` ist
  `steps.find(s => s.tag >= heuteTag) || null` — liegt kein geplanter Guss mehr in der
  Zukunft, wurde die Karte zu einem leeren String. Der Bildschirm öffnete dann direkt mit
  der Liste der 30 vergangenen Güsse, ohne ein Wort dazu, was jetzt gilt. Bei Patricks
  Zyklus heißt das: an Tag 114 (IceFlush) stand die Karte noch da, ab **Tag 115 nicht mehr**
  — also ausgerechnet in den letzten Tagen vor der Ernte, in denen man den Bildschirm am
  häufigsten aufmacht, und seit v1.5.113 ist sie dort die oberste Karte und damit die
  Antwort auf die tägliche Frage. **Warum so:** Das ist die Regel aus v1.5.96 an einer
  anderen Stelle — fehlt ein Wert, wird *dieser Wert* als offen ausgewiesen, nicht die
  ganze Karte ausgeblendet. Sie zeigt jetzt drei Zustände: vor der Ernte „Kein Guss mehr —
  Ernte an Tag 116 · Dienstag, 08.09. (morgen). Bis dahin wird nicht mehr gegossen — der
  Topf trocknet ab, und das gehört so", nach der Ernte „Trocknen läuft" bzw. „Curing läuft",
  und ohne bekannten Erntetag den schlichten Satz, dass kein Guss mehr im Fahrplan steht.
  Antippen öffnet weiterhin einen Eintrag, damit die Karte kein toter Text ist.
  **Gefunden wurde er durch den Zeitzonen-Lauf:** In `Pacific/Kiritimati` war schon Tag 115,
  und `test_gussplan.js` fiel um. Der neue Abschnitt F prüft die Tage 114, 115, 116 und 125
  jetzt mit **festgesetztem Datum**, statt sich auf die Systemzeit zu verlassen.

## 2026-09-06 — v1.5.117

- **Der leere Zustand der Foto-Galerie war eine Sackgasse.** Ein Kamerasymbol und der Satz
  „Noch keine Fotos." — kein Wort dazu, wo Fotos herkommen. Wer die Galerie zum ersten Mal
  öffnet, steht vor einer schwarzen Fläche und weiß nicht, was er tun soll. Vorbild ist der
  Düngeplan (`_emptyProds`), der es längst richtig macht: erklären, was fehlt, **und** den
  Weg dorthin anbieten. Jetzt steht dort, dass Fotos im Tageseintrag angehängt werden, und
  ein Knopf öffnet den heutigen Eintrag. Ohne angelegten Zyklus erscheint der Knopf nicht —
  ein Weg, der ins Leere führt, wäre schlimmer als keiner.

## 2026-09-06 — v1.5.116

- **Der Sprung ins Lexikon landete mitten im Text.** Ein angesteuerter Eintrag wird
  aufgeklappt und ist dann 1000–1600 px hoch; `scrollIntoView({block:'center'})` zentriert
  ihn in einem 445-px-Fenster und schiebt damit seine Überschrift rund 500 px über den
  Bildrand. Gemessen: Wer im Tageseintrag auf „VPD" tippte, landete bei „🌿 Anzucht/Vegi
  (Tag 11–28)"; wer „IceFlush" ansteuerte, las oben „Hard Dryback" — die Überschrift eines
  **anderen** Abschnitts. Ein Anfänger kann so nicht erkennen, ob er im richtigen Eintrag
  ist. Mit `block:'start'` beginnt man dort, wo der Eintrag beginnt — Titel, dann der
  persönliche Bezug („Dein Zyklus · Tag 114 · Richtwert jetzt 1.4–1.6 kPa").

## 2026-09-06 — v1.5.115

- **Fünf Funktionen bauten `goTo` von Hand nach — mit fehlenden Schritten.**
  `openDuenger`, `openLexikon`, `openLexikonEntry`, `openHowto` und `openGallery` schalteten
  den Bildschirm selbst um (`querySelectorAll('.screen')` … `classList.add('active')`) und
  ließen dabei alles weg, was `goTo` sonst erledigt. Drei messbare Folgen:
  **(1) Der Lichtsensor lief weiter.** `AmbientLightSensor` (2 Hz) wird ausschließlich in
  `goTo` gestoppt. Wer auf dem Tipps-Bildschirm eine Lichtmessung startet und dann auf
  „📖 Lexikon" tippt — um nachzulesen, was DLI heißt, also genau der vorgesehene Weg —,
  ließ den Sensor an. Auf dem Handy heißt das Akku und ein aktiver Sensor, den man für aus
  hält; der Knopf sagte weiterhin „⏹ Stoppen" auf einem verlassenen Bildschirm.
  **(2) Die Variable `tab` blieb stehen.** Die App hielt sich für „tips", während der Nutzer
  im Lexikon stand. Daran hängen mehrere Auffrisch-Weichen (`if (tab === 'cal') renderCal()`).
  **(3) `goTo('lexikon'/'howto'/'gallery')` zeigte einen leeren Bildschirm** — genau die
  Falle, die vor v1.5.106 schon einmal bei `duenger` zugeschnappt ist.
  **Warum so und nicht dreimal geflickt:** Das ist die Lehre aus v1.5.106 wörtlich — „wo eine
  Aufrufstelle einen fehlenden Schritt von Hand nachholt, ist der Schritt an der falschen
  Stelle". Die fünf Öffner rufen jetzt `goTo` auf, und `goTo` rendert die drei fehlenden
  Bildschirme mit. `goTo(t, arg)` reicht ein Argument an den Renderer durch, damit
  `openLexikonEntry` weiterhin direkt beim Eintrag landet — **ohne zweiten Render**: ein
  Lexikon-Render kostet gemessen ~40 ms auf dem Laptop, auf dem Handy eher das Dreifache.
  Aus demselben Grund scrollt `goTo` nur dann nach oben, wenn kein Argument kam — sonst
  machte es den Sprung zum Eintrag wieder zunichte.
- Abgesichert durch `test_navwege.js` (28 Prüfungen, beide Zeitzonen).

## 2026-09-06 — v1.5.114

- **Die Fortschrittszeile im Tageseintrag springt jetzt zum Feld.** Gemessen an Patricks
  Tag 104 (Gießtag): Der Eintrag ist 3486 px hoch bei 691 px Fensterhöhe — fünf
  Bildschirmlängen. Das erste Eingabefeld (Wassermenge) liegt bei y = 1144, pH und EC bei
  1368/1377, Temperatur und Luftfeuchte erst bei 2014, die Notiz bei 2751. Über den ersten
  1144 px steht ausschließlich Lesestoff.
  Ganz oben stand dabei die ganze Zeit „3/6 eingetragen · ✓💧 Wasser · 🧪 pH · ✓🌡 Temp ·
  💨 RLF" — die App wusste also präzise, was heute fehlt, und bot keinen Weg dorthin.
  Neu `jumpToEntryField(cId, was)`: Jeder der sechs Chips ist ein Knopf, der zum Feld
  scrollt, es kurz gelb umrandet und den Cursor hineinsetzt. **Warum so und nicht durch
  Wegnehmen:** Derselbe Befund wie beim Gieß-Fahrplan (v1.5.113) — nicht die Menge der
  Elemente macht den Bildschirm unhandlich, sondern die Erreichbarkeit dessen, was täglich
  gebraucht wird. Kein neuer Regler, keine neue Einstellung; dieselbe Zeile, nur benutzbar.
  Drei Feinheiten: zugeklappte Bereiche über dem Ziel werden vorher geöffnet (sonst springt
  es ins Nichts); am Foto-Knopf wird der Fokus weggenommen statt gesetzt (sonst bliebe auf
  dem Handy die Tastatur offen, genau über dem Ziel); und gibt es das Feld an diesem Tag
  nicht — kein Gießtag, kein Wasser-Feld —, sagt die App das, statt stumm zu bleiben.
- **Die Zeile erscheint jetzt auch am leeren Tag.** Sie blieb bisher bei 0/6 weg („sonst zu
  verwirrend bei leerem Tag"). Diese Entscheidung galt für ein Schild; als Wegweiser ist der
  leere Tag genau der Moment, in dem man sie braucht — sie ist dann die Aufgabenliste für
  heute statt einer Erfolgsmeldung. Der Hinweis „Antippen springt zum passenden Feld" steht
  nur im Einsteiger-Modus.
- **Fehler: Notizfelder für längst geerntete Pflanzen.** An Tag 104 standen fünf
  Pflanzen-Notizfelder, obwohl Pflanze 5 seit Tag 93 geerntet ist und
  `getEffectivePlantCount` am selben Tag bereits mit 3 rechnete. Ursache war ein
  ungefiltertes `c.plants.map(...)`. Der Schnitt-Tag selbst zählt weiter mit — an ihm will
  man etwas notieren —, der Tag danach nicht mehr. Wer für eine geerntete Pflanze schon
  etwas geschrieben hat, sieht es weiter: eine vorhandene Notiz darf nicht unsichtbar
  werden. Ergebnis: Tag 50 → 5 Felder, 93 → 5, 94 → 4, 104 → 4, 113 → 3.
- **Die Verschiebungs-Historie liegt zugeklappt statt offen.** Sie stand an *jedem* Tag
  aufgeschlagen zwischen Sorten-Karte und Gießkarte — bei Patrick fünf Einträge mit fünf
  ✕-Knöpfen zum Zurücknehmen, direkt im Weg zu den täglich gebrauchten Feldern. Die
  Kopfzeile („5 Verschiebungen · antippen zum Anzeigen") bleibt sichtbar. Der Gießtag
  schrumpft dadurch von 3486 auf 3282 px.
- Abgesichert durch `test_tageseintrag.js` (33 Prüfungen, beide Zeitzonen); alle 36
  Testdateien laufen grün.
- **Korrektur einer eigenen Fehlmessung:** Die in der Übergabe notierten „154 sichtbaren
  Eingabefelder" waren falsch. Gemessen wurde mit `offsetParent !== null`, das Inhalte in
  zugeklappten `<details>` **nicht** ausschließt. Richtig: 162 Felder gesamt, davon 141 in
  der zugeklappten Liste „Messungen berichtigen", also 21 wirklich sichtbar. Die Zahl ist an
  allen drei Fundstellen in `UEBERGABE.md` berichtigt.

## 2026-09-06 — v1.5.113

- **Der Gieß-Fahrplan ist nach Häufigkeit geordnet statt nach Themen.** Patrick: „Der sieht
  mir zu unübersichtlich und unhandlich aus. Damit kann niemand so richtig arbeiten, der
  nicht viel rumversuchen will."
  Der Bildschirm beantwortete vier Fragen gleichzeitig und in der falschen Reihenfolge: ganz
  oben die Endspurt-Kette mit acht ±-Knöpfen — eine Terminfrage, die man ein- oder zweimal im
  Zyklus stellt —, darunter erst „was gieße ich als Nächstes", die Frage, für die man diesen
  Bildschirm täglich öffnet. Gemessen war er in beiden Modi zeichengleich: 4472 Zeichen,
  21 Knöpfe, 9 Eingabefelder. Der Einsteiger-Modus wirkte dort überhaupt nicht.
  Neue Reihenfolge für beide Modi: nächster Guss (mit Menge), dann die Liste, dann die
  Termine, ganz unten die Einstellungen. Im **Einsteiger-Modus** liegt die Endspurt-Kette
  zusätzlich hinter dem Aufklapper „Termine bis zur Ernte — nur anfassen, wenn sich etwas
  verschiebt", der Listen-Erklärtext ist auf einen Satz gekürzt, und die Rhythmus- und
  Mengen-Einstellungen entfallen dort ganz. Ergebnis: **3166 statt 4472 Zeichen, 10 statt 21
  Knöpfe, 0 statt 9 Eingabefelder.**
  Warum die Mengen-Regler beim Einsteiger verschwinden: Seit v1.5.112 führt die App die Menge
  am gemessenen Ablauf selbst nach. Wer sie von Hand einstellt, schaltet genau diese
  Selbstkorrektur ab — das war die Falle, in die Patrick gelaufen war. Das ist Profi-Werkzeug,
  keine Grundeinstellung.
  Im **Profi-Modus** ändert sich nur die Reihenfolge: 4472 Zeichen, 21 Knöpfe, 9 Felder
  unverändert. Weggenommen wird nichts.
  Abgesichert durch `test_gussplan.js` (24 Prüfungen, beide Zeitzonen), darunter die
  Gegenprobe, dass der Profi-Modus vollständig bleibt und die Gussliste in beiden Modi steht.

## 2026-09-06 — v1.5.112

- **Die Gießmenge stellt niemand mehr von Hand ein — sie führt sich am gemessenen Ablauf
  nach.** Patricks Einwand: „Ich bin kein Fan davon, wenn ich selbst meine Wassermengen der
  Phasen einstellen muss. Ich weiß dies zb. nur aus Erfahrungswerten. Wie will das ein User
  schaffen, der wenig oder noch keine Erfahrung hat?"
  Nachgemessen an seinen eigenen Daten: Über 35 selbst eingetragene Güsse lag die Empfehlung
  im Mittel **23 % daneben**, fast immer nach unten. Die Ursache war eine Falle. Weil die
  Vorschläge nicht passten, hatte er eigene Phasen-Korridore gesetzt — und genau das schaltete
  die Selbstkorrektur ab. Im Code stand: „Ein SELBST gesetzter Korridor bleibt unangetastet …
  Aufgeweitet wird nur der Standard-Korridor der App." Gut gemeint, aber die Folge war ein
  Kreislauf: zu wenig vorgeschlagen → Korridor gesetzt → Lernen aus → weiter danebengelegen →
  weiter von Hand korrigiert.
  Die Frage „wie viele ml?" kann niemand beantworten. Die Frage „läuft genug unten raus?"
  kann jeder beantworten, vom ersten Tag an — und seit v1.5.104 hat die App das Feld dafür.
  Neu ist `drainAdjust(c, iso)`: Es liest die letzten bis zu drei eigenen Güsse mit
  eingetragener Ablaufmenge (Median, damit ein Ausreißer die Menge nicht verreißt) und leitet
  daraus einen Faktor ab. Keine Faustregel, sondern eine Mengenbilanz — was nicht abläuft, hat
  das Substrat aufgenommen: `Faktor = (1 − ist) / (1 − ziel)`. Bei 10 % gemessenem Ablauf sind
  das +9 %, bei 30 % −15 %.
  Zwei Anpassungen waren nötig, damit das überhaupt durchschlägt, beide beim Durchspielen der
  Kurve gefunden: Der eigene Korridor sperrt eine **Messung** nicht mehr aus (ein
  Verhaltensmuster ist etwas anderes als ein physikalischer Befund über diesen Topf), und die
  Rampe — höchstens 12 % Änderung je Guss — hängt jetzt am korrigierten Ziel statt am alten
  Median. Vorher hielt sie exakt dagegen: Bei 30 % Ablauf wollte die Bilanz 15 % weniger, die
  Rampe ließ 12 % zu und klemmte auf den alten Wert zurück — Guss für Guss dasselbe Ergebnis
  trotz eindeutiger Messung.
  Das Ergebnis mit Patricks Zahlen (Tag 104, 9000 ml gegossen): 5 % Ablauf → 10350 ml
  vorgeschlagen, 10 % → 9800, **15–20 % → 9000 ml**, 25 % → 8200, 30 % → 7650, 40 % → 6750.
  Im Zielfenster bestätigt die App also genau die Menge, die er tatsächlich gegeben hat.
  Spülen und IceFlush bleiben unberührt — dort ist der Durchfluss absichtlich ein anderer.
  Der Lern-Status sagt jedes Mal, was gerade passiert und warum.

- **Der Drain-Zielwert steigt von 5–10 % auf 15–20 %**, an allen elf Textstellen. Grund steht
  in `ANBAU.md` 5.1: Unter 15 % Durchfluss läuft das Wasser überwiegend am Topfrand entlang,
  statt den Wurzelballen zu durchqueren. Mit 5–10 % war weder das Auswaschen von Salzen
  zuverlässig noch die Messung gültig. Über 25 % wäscht man aus und verliert Nährstoffe.
  Beides gehörte in **eine** Änderung: Ein höheres Drain-Ziel ohne größere Gießmenge wäre ein
  Widerspruch in sich.
  Abgesichert durch `test_drainregelkreis.js` (24 Prüfungen, beide Zeitzonen), darunter die
  Monotonie über acht Ablaufwerte, die Gegenproben für Spülen und IceFlush, und dass ein von
  der App selbst gefüllter Guss nicht als Messung zählt.

## 2026-09-06 — v1.5.111

- **Am IceFlush-Tag stand eine Gießmenge, obwohl dort nichts gegossen wird.** Die grüne Karte
  nannte „Berechnet für 3 Pflanzen · 3750 ml/Pflanze · 11250 ml gesamt". Die Zahl selbst ist
  richtig — `_waterSuggestionRaw` liefert für die Ice-Phase das Schmelzwasser aus 1 L Crushed
  Ice, rund 700 ml je 11-L-Topf —, aber sie beantwortet die falsche Frage. Beim IceFlush legt
  man Eis an den Topfrand und gießt **nichts** dazu. Wer der Zahl folgt, macht den
  Hard-Dryback zunichte, auf den die drei Tage davor hingearbeitet haben.
  Die Karte zeigt am Ice-Tag jetzt die **Eismenge** (1000 ml je Topf, skaliert mit der
  Topfgröße), die Gesamtmenge, den Hinweis zum Topfrand und den Satz „Wasser gießt du keines
  dazu". Das Schmelzwasser steht als Folge daneben, nicht als Anweisung. An allen anderen
  Tagen bleibt die Karte unverändert.
  Patricks Worte dazu: „Ebenso gieße ich hier kein Wasser sondern lege nur 1kg Eis
  ringförmig in den Topf."

## 2026-09-06 — v1.5.110

- **Ein vorgezogener IceFlush verschwand spurlos.** `moveGussDay` legt einen datierten
  Vermerk an, der die **Aktion** verschiebt; die Phase rechnet weiter aus `flushWetDays` und
  `iceDryDays`. Beim IceFlush lief das doppelt schief.
  Erstens griff am Zieltag `_dryLeadIn` mit dem Grund `'ice'` — die Regel, die einen normalen
  Guss aus dem Hard-Dryback heraushält — und lieferte `null`. Sie blockte damit **den
  vorgezogenen IceFlush selbst**, obwohl der den Dryback ja gerade beendet. Die Aufgabe war
  danach nirgends mehr: kein Symbol am neuen Tag, keines am alten.
  Zweitens blieb die Phase stehen. Im Kalender klebte das Wort „IceFlush" weiter am
  ursprünglichen Tag, und der Tageseintrag zeigte dort die Spülmenge (3750 ml je Pflanze)
  statt der Eismenge — genau der Widerspruch, den Patrick fotografiert hat.
  Der IceFlush ist kein Guss, sondern ein **Phasen-Ereignis**. `moveGussDay` legt dafür jetzt
  keinen Vermerk mehr an, sondern ruft `_moveIceFlushTo` — dieselbe Rechnung wie
  `setEndspurtIceStart`, nur ohne Dialog: Der Abstand zum Spülstart wird neu auf Spültage und
  Hard-Dryback aufgeteilt. Damit wandern Symbol, Beschriftung, Gießmenge, Düngeplan und
  Erntetag gemeinsam.
  Für bereits angelegte Vermerke greift zusätzlich eine Ausnahme in `getAction`: Ein
  verschobener `'ice'` scheitert nicht mehr an seinem eigenen Vorlauf. Ohne sie bliebe der
  IceFlush in Patricks laufendem Grow unsichtbar.
  Abgesichert durch `test_iceflush.js` (26 Prüfungen, beide Zeitzonen), darunter der
  Altbestands-Fall und die Gegenprobe, dass ein normaler Guss-Tag unverändert bleibt.

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
