# GrowSmart

Cannabis-Anbau-App mit Biophysik-Empfehlungen. Anfänger-tauglich, Profi-präzise.
Läuft komplett lokal im Browser — alle Daten bleiben auf deinem Gerät.

## Deploy auf GitHub Pages

### Schritt 1: Repository erstellen

1. Auf [github.com](https://github.com) einloggen
2. Oben rechts auf **+** → **New repository**
3. Name: `GrowSmart` (groß geschrieben, passt zur App)
4. **Public** (Pages funktioniert auch mit Private bei Pro-Account)
5. **Create repository**

### Schritt 2: Dateien hochladen

Im neuen Repo: **"uploading an existing file"** klicken, dann diese Dateien reinziehen:

- `index.html`
- `sw.js`
- `manifest.json`
- `icon-192.png`
- `icon-512.png`
- `favicon-32.png`

Unten: **"Commit changes"** klicken.

### Schritt 3: GitHub Pages aktivieren

1. Im Repo: **Settings** (oben)
2. Links im Menü: **Pages**
3. **Source: "Deploy from a branch"** auswählen
4. **Branch: `main`**, **Folder: `/ (root)`**
5. **Save** — nach 1-2 Minuten ist die App live unter:

   ```
   https://DEIN-USERNAME.github.io/GrowSmart/
   ```

### Schritt 4: Auf dem Handy installieren

1. URL im **Chrome auf dem Handy** öffnen
2. Browser-Menü → **Zum Startbildschirm hinzufügen**
3. Die App erscheint wie eine normale App auf dem Homescreen
4. Beim Öffnen läuft sie im Vollbild ohne Browser-Leiste

## Updates ausrollen

Wenn du eine neue Version der `index.html` hochlädst:

1. Im Repo: Auf `index.html` klicken → ✏️ Edit → alte Datei ersetzen → Commit
2. **Wichtig**: Auch `sw.js` ersetzen wenn sich `CACHE_NAME` geändert hat
   (steht oben in `sw.js`, sieht aus wie `'growsmart-v1.1'`)
3. Nach 1-2 Minuten ist's live. Beim nächsten App-Öffnen auf dem Handy
   lädt der Service-Worker den neuen Code automatisch nach.

## Daten

Alle Grow-Daten landen lokal im Browser-Storage (IndexedDB / localStorage).
Nichts geht in die Cloud. Backup über die App: **Einstellungen → Daten →
Export als JSON**.
