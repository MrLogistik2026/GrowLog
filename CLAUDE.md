# GrowSmart

Single-File-PWA für Cannabis-Anbau. Vanilla JS, kein Build-Tool, soll in zehn Jahren
noch laufen. Sprache im Projekt und im Gespräch: Deutsch, Du-Form, direkt, nüchtern.

Diese Datei bindet die Projektdokumente ein, damit sie bei jedem Sitzungsstart automatisch
geladen werden. Wer hier etwas sucht, findet es dort:

@ANWEISUNG.md

@ANBAU.md

@UEBERGABE.md

@START-HIER.md

**`ANBAU.md` ist das Fachwissen hinter der App** — Wasserhaushalt, VPD, pH und
Nährstoffverfügbarkeit, EC und osmotischer Druck, Licht, Trichomreife, Trocknung, die
tödlichen Fehler mit ihrem Mechanismus, und ein eigener Abschnitt darüber, was in der
Grower-Praxis verbreitet, aber **nicht belegt** ist.

Der Zweck: **Über Pflanzen wird nicht geschätzt.** Jede Zahl in dieser App — jede Gießmenge,
jeder EC-Zielwert, jede Warnung, jeder erklärende Satz — muss sich auf einen Mechanismus
zurückführen lassen. Wo `ANBAU.md` keine Antwort gibt, wird nachgefragt statt geraten; ein
selbstbewusst vorgetragener falscher Pflanzenrat ist schlimmer als ein Eingeständnis.

Vor jeder neuen Automatik gilt Abschnitt 9 („Was verbreitet, aber nicht belegt ist"): Eine
Funktion, die einen Fehler verhindern soll, den es nicht gibt, ist selbst ein Fehler.

---

## Bauen und Prüfen

`index.html` wird aus drei Teilen zusammengesetzt: `head.html` + `app.js` + `tail.html`.
Geändert wird immer `app.js`, nie `index.html` direkt.

```bash
cat head.html app.js tail.html > index.html
```

Vor jeder Änderung die Byte-Identität prüfen — erst wenn `cmp` schweigt, wird gearbeitet:

```bash
cat head.html app.js tail.html | cmp - index.html && echo "BYTE-IDENTISCH OK"
```

Tests laufen über `harness.js` (jsdom), jeder Lauf in **beiden Zeitzonen**:
`Europe/Berlin` und `Pacific/Kiritimati`. Vor und nach jedem Patch zusätzlich
`node --check app.js`.

**Achtung auf diesem Laptop:** Die aus dem Linux-Container gewohnte Schreibweise
`TZ=Europe/Berlin node test.js` wirkt in Git Bash unter Windows **nicht** — `process.env.TZ`
bleibt leer, und der Test läuft still in der Systemzeitzone. Die Zeitzonen-Läufe gehören
deshalb in PowerShell:

```powershell
$env:TZ='Europe/Berlin';      node test_startup.js
$env:TZ='Pacific/Kiritimati'; node test_startup.js
```

Patricks echte Daten liegen in `growsmart-sicherung-2026-09-04.txt` und gehören unter
den localStorage-Schlüssel `growsmart_v4`. Damit lässt sich die App mit realem Zustand
durchlaufen, statt gegen einen leeren Grow zu testen.

---

## Beim Testen die Vorschau sichtbar halten

Wird die App geprüft, läuft sie **im sichtbaren Browser-Fenster** mit, damit Patrick live
mitverfolgen kann, was passiert (seine Ansage vom 05.09.2026). Das heißt: Bildschirme
wirklich ansteuern und anklicken, nicht nur im Hintergrund Funktionen aufrufen.
Zwischendurch Bildschirmfotos zeigen, wenn sich etwas Sichtbares ändert.

Reine Rechenprüfungen dürfen weiterhin direkt über die Konsole laufen — sie sind genauer
als Klicken und liefern Zahlen statt Eindrücke. Aber was sich anschauen lässt, wird
angeschaut.

Gestartet wird über `.claude/launch.json` (Name `growsmart`, Port 8099); die Datei zeigt
auf ein kleines Server-Skript im Sitzungs-Temp-Ordner und ist deshalb nicht im Repo.

**Nach jedem Neubau den Zwischenspeicher leeren**, sonst prüft man die alte Fassung:
Service Worker abmelden (`navigator.serviceWorker.getRegistrations()` → `unregister()`),
dann `caches.keys()` → `delete`, dann neu laden. Ohne das zeigt die Seite beim ersten Laden
weiter den vorherigen Stand — das hat schon eine Fehlersuche an der falschen Stelle
gekostet.

---

## Versionsnummer

`APP_VERSION` in `app.js` (Zeile ~3188) wird bei **jeder** ausgelieferten Änderung um
eine Stelle hinten angehoben — v1.5.96 → v1.5.97 → v1.5.98. Auch bei einem
Einzeiler-Fix, auch bei reiner Textänderung. Ohne Anhebung lässt sich hinterher nicht
sagen, welche Datei auf dem Handy welchen Stand hat, und der Browser hält womöglich
die alte Fassung im Zwischenspeicher.

Die neue Nummer steht danach an drei Stellen gleich: in `app.js`, im `CHANGELOG.md`
und oben in `UEBERGABE.md`.

---

## Hochladen gehört zum Ausliefern dazu

Jeder Push auf `main` löst über `.github/workflows/static.yml` automatisch eine
Veröffentlichung bei GitHub Pages aus. **Das ist der Weg, auf dem die App aufs Handy
kommt** — ohne Push testet Patrick einen alten Stand. Deshalb wird nach jeder
fertigen Änderung committet **und** hochgeladen, ohne Rückfrage (seine Ansage vom
05.09.2026). Es kostet praktisch nichts.

Hochgeladen wird erst, wenn diese vier Dinge stimmen:

1. `node --check app.js` läuft durch
2. Die betroffenen Tests sind wirklich gelaufen, in beiden Zeitzonen
3. `cat head.html app.js tail.html | cmp - index.html` schweigt
4. `APP_VERSION`, `CHANGELOG.md` und `UEBERGABE.md` nennen dieselbe neue Nummer

Ist etwas davon rot, wird committet, aber **nicht** hochgeladen — und das wird gesagt.
Ein kaputter Stand auf GitHub Pages ist ein kaputter Stand auf Patricks Handy.

**Der Workflow lädt das gesamte Repository hoch** (`path: '.'`). Alles, was je
committet wird, ist danach unter der Pages-Adresse direkt abrufbar. Das ist der
eigentliche Grund für die breite `.gitignore`: Eine versehentlich mitcommittete
Sicherung läge nicht nur sichtbar auf GitHub, sie wäre per Link herunterladbar.
Vor jedem Push gilt deshalb: `git status` ansehen, und wenn etwas Unerwartetes
mitgeht, erst fragen.

---

## Nach jeder ausgelieferten Änderung — nicht erst am Sitzungsende

Drei Schritte, immer in dieser Reihenfolge, und zwar **sofort nachdem eine Änderung
fertig ist**, nicht gesammelt zum Schluss. Grund: Eine Sitzung endet selten geplant —
sie bricht ab, das Fenster wird geschlossen, der Laptop schläft ein. Was dann noch
nicht geschrieben ist, ist weg, und die nächste Sitzung beginnt bei null. Genau das ist
schon passiert. Patrick muss dafür nichts sagen; das läuft von selbst mit.

**1 · `CHANGELOG.md` fortschreiben.** Jede ausgelieferte Änderung bekommt einen Eintrag
mit **Datum**, **was** geändert wurde und **warum**. Das Warum ist der wichtigere Teil:
Es verhindert, dass eine Entscheidung in drei Monaten ohne Begründung dasteht und
versehentlich zurückgebaut wird. Neueste Einträge nach oben.

**2 · `UEBERGABE.md` auf den neuen Stand bringen.** Versionsnummer und Datum oben
anpassen. Der erste Abschnitt bleibt der wichtigste offene Punkt — steht dort noch das
Richtige? Neu aufgetauchte offene Punkte kommen dazu, mit genug Kontext, dass sie ohne
Rückfrage bearbeitbar sind (Dateipfad, Funktionsname, wie reproduzierbar).

**3 · Veraltetes streichen.** Erledigte Punkte werden aus `UEBERGABE.md` **entfernt**,
nicht abgehakt stehengelassen. Dasselbe gilt für Beschreibungen von Verhalten, das es so
nicht mehr gibt. Eine Übergabe, die zur Hälfte nicht mehr stimmt, ist schlimmer als
keine — man weiß dann nicht mehr, welcher Hälfte man trauen kann. Was aus einem Fehler
gelernt wurde, bleibt allerdings stehen, auch wenn der Fehler behoben ist.

---

## Gefundene Fehler werden gleich mitbehoben

Fällt beim Arbeiten ein weiterer Fehler auf, wird er **sofort mitbehoben** — nicht
gemeldet und liegengelassen (Patricks Ansage vom 05.09.2026). Nachfragen kostet einen
Umweg, den er nicht will.

Damit das nicht in ein unprüfbares Sammelpaket kippt, gelten drei Bedingungen:

- Jeder Fehler bekommt einen **eigenen Eintrag** im `CHANGELOG.md`, mit eigener
  Versionsnummer. Stellt sich einer als falsch heraus, ist genau er rücknehmbar.
- Jeder Fehler bekommt seine **eigene Prüfung** — Tests laufen wirklich, in beiden
  Zeitzonen.
- Was mitbehoben wurde, steht **oben in der Antwort**, nicht versteckt am Ende.

Das gilt für Fehler. Es gilt **nicht** für Umbauten, neue Funktionen oder
Aufhübschungen — die bleiben Patricks Entscheidung.

---

## Was nie passiert

- `index.html` von Hand bearbeiten
- Kosmetik-Refactors in einen Bug-Fix mitschmuggeln
- Tests mit ✅ markieren, die nie gelaufen sind
- `.toISOString().split('T')[0]` — dafür gibt es `_localISO(d)`
