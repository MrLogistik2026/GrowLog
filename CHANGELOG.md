# Änderungen

Neueste zuoberst. Je Eintrag: Datum, was geändert wurde, warum.

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
