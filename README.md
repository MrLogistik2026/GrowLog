# GrowSmart PWA – GitHub Setup

## Schritt 1: GitHub Account erstellen
1. Gehe auf https://github.com
2. Klicke "Sign up" – kostenlos registrieren

## Schritt 2: Neues Repository erstellen
1. Nach dem Login: Klicke oben rechts auf "+" → "New repository"
2. Name: `growsmart`
3. Auf "Public" lassen
4. Klicke "Create repository"

## Schritt 3: Dateien hochladen
1. Im neuen Repository: Klicke "uploading an existing file"
2. Ziehe ALLE Dateien aus diesem ZIP-Ordner hinein:
   - index.html
   - manifest.json
   - Den Ordner `.github` (mit workflows/deploy.yml)
3. Klicke "Commit changes"

## Schritt 4: GitHub Pages aktivieren
1. Im Repository: Klicke "Settings" (oben)
2. Links im Menü: "Pages"
3. Source: "GitHub Actions" auswählen
4. Fertig – nach 1-2 Minuten ist die App live!

## Schritt 5: App-URL aufrufen
Deine App-URL ist:
```
https://DEIN-USERNAME.github.io/growsmart/
```

## Auf dem Handy installieren (wie eine App)
1. Öffne die URL in Chrome auf deinem Samsung Galaxy S25 Ultra
2. Tippe auf die drei Punkte oben rechts
3. "Zum Startbildschirm hinzufügen"
4. Die App erscheint wie eine normale App auf dem Homescreen!

## KI-Coach aktivieren
1. Gehe auf https://console.anthropic.com
2. Erstelle einen kostenlosen Account
3. Generiere einen API-Key
4. Öffne `index.html`
5. Suche nach `claude-sonnet-4-20250514` – direkt darüber den API-Key eintragen

## Daten
Alle deine Grow-Daten werden lokal in deinem Browser gespeichert.
Nichts geht in die Cloud – deine Privatsphäre ist geschützt.
