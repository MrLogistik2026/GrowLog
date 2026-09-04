# GrowSmart auf dem Laptop einrichten

Diese Anleitung setzt nur voraus, dass **Claude for Windows** installiert ist.
Kein Terminal nötig — die Code-Ansicht der App übernimmt das.

---

## 1 · Ordner anlegen

Leg unter `Dokumente` einen Ordner **GrowSmart** an und entpacke dieses Paket
hinein. Danach liegen dort:

| Datei | wofür |
|---|---|
| `index.html` | die App selbst (aktuell v1.5.95) |
| `UEBERGABE.md` | Stand, offene Punkte, Regeln — Claude liest das zuerst |
| `START-HIER.md` | diese Anleitung |
| `growsmart-sicherung-2026-09-04.txt` | Patricks Grow-Daten, 111 Tageseinträge |
| `audit_lib.js` | Testgerüst (jsdom) |
| `test_*.js` | 16 Testdateien |
| `build.sh` | baut `index.html` aus den Teilen zusammen |
| `rettung.html` | liest Daten aus dem Browserspeicher |
| `wiederherstellung.html` | spielt eine Sicherung zurück |

---

## 2 · Node.js installieren

Die Tests brauchen Node.js 18 oder neuer. Einmalig von **nodejs.org** die
LTS-Version laden und installieren, alle Vorgaben übernehmen.

---

## 3 · Ordner in Claude öffnen

Claude for Windows starten → **Code** → Ordner auswählen → `Dokumente\GrowSmart`.

---

## 4 · Erste Nachricht an Claude

> Lies UEBERGABE.md und START-HIER.md. Richte die Testumgebung ein: index.html in
> head.html + app.js + tail.html zerlegen, mit build.sh wieder zusammenbauen und
> per cmp auf Byte-Identität prüfen. Danach `npm install jsdom` und alle Tests in
> beiden Zeitzonen laufen lassen.

Läuft alles grün, ist die Umgebung fertig.

---

## 5 · Arbeitsweise danach

Claude ändert `app.js`, baut `index.html` neu und lässt die Tests laufen. Du
öffnest die Datei zum Prüfen — auf dem Laptop im Browser, für den echten Test
weiter auf dem Handy.

**Wichtig zu wissen:** Der Browser auf dem Laptop und die Vorschau auf dem Handy
haben **getrennte Datenspeicher**. Auf dem Laptop siehst du zunächst einen leeren
Grow. Mit `wiederherstellung.html` und der beiliegenden Sicherung bekommst du
Patricks echten Stand auch dort hinein — gut zum Testen, ohne den Grow auf dem
Handy anzufassen.

---

## 6 · Git — später, nicht jetzt

Sobald der Rest läuft, lohnt sich Git: Jede Auslieferung wird ein Commit, und
eine Fehlentscheidung ist ein Befehl weit weg statt ein Rückbau von Hand. Die
Abtrockenphase, die über vier Releases wieder ausgebaut werden musste, wäre damit
ein `git revert` gewesen. Claude richtet das auf Zuruf ein.

---

## 7 · Was sich nicht ändert

Die Regeln aus `UEBERGABE.md` gelten weiter: eine zusammenhängende Änderung pro
Auslieferung, Tests laufen wirklich und in beiden Zeitzonen, Begründung vor dem
Code, keine ungefragten Umbauten.

Und der wichtigste offene Punkt bleibt der erste Abschnitt der Übergabe: die
Einstellungen und ihre Verknüpfung mit dem Düngeplan vereinfachen.
