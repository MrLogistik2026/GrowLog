# GrowSmart

Single-File-PWA für Cannabis-Anbau. Vanilla JS, kein Build-Tool, soll in zehn Jahren
noch laufen. Sprache im Projekt und im Gespräch: Deutsch, Du-Form, direkt, nüchtern.

Diese Datei bindet die drei Projektdokumente ein, damit sie bei jedem Sitzungsstart
automatisch geladen werden. Wer hier etwas sucht, findet es dort:

@ANWEISUNG.md

@UEBERGABE.md

@START-HIER.md

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

## Am Ende jeder Sitzung

Drei Schritte, immer in dieser Reihenfolge. Sie sind kein Papierkram — ohne sie beginnt
die nächste Sitzung bei null, und genau das ist schon passiert.

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

## Was nie passiert

- `index.html` von Hand bearbeiten
- Mehrere Bugs auf einmal fixen, ohne dass Patrick die Reihenfolge bestimmt hat
- Kosmetik-Refactors in einen Bug-Fix mitschmuggeln
- Tests mit ✅ markieren, die nie gelaufen sind
- `.toISOString().split('T')[0]` — dafür gibt es `_localISO(d)`
