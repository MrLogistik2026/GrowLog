# Einrichtung — Schritt für Schritt

Alles, was einmalig zu tun ist. Danach läuft es von allein.
Die grau hinterlegten Blöcke kopierst du in deine Claude-Code-Session.

---

## 1 · Modell auf Opus stellen

In der Session tippen:

```
/model
```

Aus der Liste **Opus** wählen. Das gilt ab sofort für dieses Projekt.

Warum: Opus ist das stärkste Modell für Code. Bei GrowSmart geht es um
Datumsrechnerei, Phasenlogik und Dosierungen — dort zahlt sich das aus.

---

## 2 · GitHub-Konto anlegen

Nur wenn du noch keines hast: **github.com** öffnen → *Sign up* →
E-Mail, Passwort, Benutzername. Kostenlos, dauert zwei Minuten.

**Benutzername merken** — er steckt später in deiner App-Adresse.

---

## 3 · Projekt zu GitHub bringen

In die Session kopieren:

```
Richte Git in diesem Ordner ein, falls noch nicht geschehen, und lege ein
Repository auf GitHub an (Name: growsmart, privat). Lade den aktuellen Stand
hoch. Führe mich durch die Anmeldung, ich bin nicht technisch.
```

Es wird einmal nach deinen GitHub-Zugangsdaten gefragt. Danach nie wieder.

---

## 4 · GitHub Pages aktivieren

```
Aktiviere GitHub Pages für dieses Repository, sodass die index.html unter einer
festen Adresse erreichbar ist. Sag mir danach die Adresse.
```

Wichtig: Für Pages muss das Repository **öffentlich** sein, oder du brauchst ein
bezahltes Konto. Frag im Zweifel dort nach — der Code enthält keine persönlichen
Daten, deine Grow-Daten liegen ausschließlich auf deinem Telefon.

Die Adresse sieht so aus:
`https://DEIN-NAME.github.io/growsmart/`

---

## 5 · App aufs Handy holen

1. Adresse in **Chrome** auf dem Handy öffnen
2. Menü (drei Punkte) → **Zum Startbildschirm hinzufügen**
3. Es entsteht ein Symbol wie bei einer echten App

Ab jetzt: **kein Download, kein Antippen einer Datei, keine Vorschau.**
Nach einem Release einmal nach unten ziehen zum Aktualisieren.

---

## 6 · Deine Daten einmalig einspielen

Chrome hat einen eigenen Speicher — beim ersten Öffnen ist der Grow leer.
Das ist normal und **deine Daten in der Vorschau bleiben unangetastet.**

1. `wiederherstellung.html` in Chrome öffnen
2. Inhalt von `growsmart-sicherung-2026-09-04.txt` einfügen
3. *Prüfen* → es muss **1 Zyklus und 111 Tageseinträge** melden
4. *Jetzt einspielen*
5. App-Adresse öffnen — dein Grow ist da

Erst wenn du das geprüft hast, ist die Vorschau überflüssig.

---

## 7 · Sicherungen nach Google Drive

```
Baue in die App eine automatische Sicherung ein: bei jedem Start eine Kopie
anlegen, im Dashboard anzeigen wann die letzte war, und mich erinnern wenn die
letzte älter als 7 Tage ist. Danach ein Release nach der Checkliste.
```

Die Sicherungsdateien legst du dann von Hand in deinen Drive-Ordner — sie ändern
sich nur einmal am Tag und sind winzig.

**Nicht** den Projektordner in Drive legen: Git und Drive geraten sich in die
Quere und beschädigen den Verlauf.

---

## 8 · Fernzugriff vom Handy

Claude Code lässt sich über die Claude-App auf dem Handy erreichen; der Laptop
muss dafür an sein. Frag in der Session:

```
Wie erreiche ich diese Session vom Handy aus? Erklär es mir Schritt für Schritt.
```

So bekommst du die Anleitung, die zu deiner Version passt.

---

## Der Ablauf danach

Du beschreibst, was nicht stimmt oder was du willst — Screenshot dazu.
Claude ändert `app.js`, baut `index.html`, lässt die Tests in beiden Zeitzonen
laufen, macht einen Commit und lädt hoch.
Du ziehst auf dem Handy die Seite nach unten. Fertig.

Geht etwas schief:

```
Mach die letzte Änderung rückgängig.
```

Das ist der eigentliche Gewinn: Ein Fehlgriff ist ein Satz, kein Rückbau von Hand.

---

## Was gleich bleibt

Die Regeln aus `ANWEISUNG.md`: eine zusammenhängende Änderung pro Auslieferung,
Tests laufen wirklich und in beiden Zeitzonen, Begründung vor dem Code, keine
ungefragten Umbauten.

Und der wichtigste offene Punkt steht weiter oben in `UEBERGABE.md`: die
Einstellungen und ihre Verknüpfung mit dem Düngeplan vereinfachen.
