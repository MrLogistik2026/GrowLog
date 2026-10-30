// (v1.5.504) Schriften liegen in der App, und die Startseite erinnert an die Sicherung.
//
// Jeder Start lud ein Stylesheet von fonts.googleapis.com und die Schriftdateien von fonts.gstatic.com, während der Datenschutztext
// „keine Server“ sagt; die Erinnerung an das Backup stand nur in den Einstellungen. Bewertung vom 30.10.2026, Technik-Befund 4 und
// B10 (Hebel 3). Geprüft: kein Google-Verweis außerhalb von Kommentaren, sechs lokale @font-face mit vorhandenen Dateien und
// Lizenztexten, Service Worker hält die Schriften; Erinnerung ab 14 Tagen ohne Sicherung (ab 7 Einträgen), weg nach dem Sichern,
// „Später“ = drei Tage Ruhe, nicht im Demo-Zyklus.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const INDEX = process.env.GS_INDEX || path.join(__dirname, 'index.html');
const HTML = fs.readFileSync(INDEX, 'utf8');
const WURZEL = path.dirname(INDEX);

(async () => {
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };

  // 1. Schriften
  const ohneKommentare = HTML.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  pruefe(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(ohneKommentare), 'Kein Abruf von Google-Schriften mehr');
  const faces = [...ohneKommentare.matchAll(/@font-face \{[^}]*src: url\(\.\/fonts\/([a-z0-9-]+\.woff2)\)/g)].map(m => m[1]);
  pruefe(faces.length === 12, 'Zwölf @font-face-Regeln (DM Sans/Mono, latin und latin-ext): ' + faces.length);
  const dateien = [...new Set(faces)];
  pruefe(dateien.length === 6 && dateien.every(d => fs.existsSync(path.join(WURZEL, 'fonts', d))), 'Sechs Schriftdateien liegen in ./fonts: ' + dateien.join(', '));
  pruefe(['OFL-DM-Sans.txt', 'OFL-DM-Mono.txt'].every(d => fs.existsSync(path.join(WURZEL, 'fonts', d))), 'Lizenztexte (SIL OFL) liegen bei');
  const sw = fs.existsSync(path.join(WURZEL, 'sw.js')) ? fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8') : '';
  pruefe(dateien.every(d => sw.includes('./fonts/' + d)), 'Service Worker hält alle sechs Schriften im Grundbestand');
  pruefe(/Schriften:<\/b> liegen in der App selbst/.test(HTML), 'Datenschutztext nennt die Schriften');

  // 2. Backup-Erinnerung
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { const m = String((e && e.message) || e); if (!/Not implemented/i.test(m)) errors.push(m); });
  const dom = new JSDOM(HTML, { url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => null; w.navigator.vibrate = () => true; w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {}; w.alert = () => {}; w.print = () => {}; w.URL.createObjectURL = () => 'blob:x'; } });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  w.toast = () => {};
  const E = (s) => w.eval(s);
  const karte = () => !!w.document.querySelector('[data-backup-hinweis]');
  E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true; S.beginnerMode = true; S._lastExport = null; S._backupSpaeter = null;
    const c = addCyc({ name: 'B', startDate: isoPlus(todayISO(), -30), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1 }, { still: true });
    S.cycles = [c]; for (let d = 1; d <= 10; d++) { const iso = isoPlus(todayISO(), -d); S.entries[iso] = { cycleData: {} }; S.entries[iso].cycleData[c.id] = { notes: 'x' }; }
    goTo('dash'); renderDash(); })()`);
  pruefe(karte(), 'Noch nie gesichert, 10 Einträge: Erinnerung steht auf der Startseite');
  E(`S._lastExport = isoPlus(todayISO(), -3); renderDash();`);
  pruefe(!karte(), 'Vor 3 Tagen gesichert: keine Erinnerung');
  E(`S._lastExport = isoPlus(todayISO(), -20); renderDash();`);
  pruefe(karte() && /vor 20 Tagen/.test(w.document.querySelector('[data-backup-hinweis]').textContent), 'Vor 20 Tagen gesichert: Erinnerung nennt die Tage');
  E(`exportData(); renderDash();`);
  pruefe(!karte(), 'Nach „Sichern“ ist die Erinnerung weg');
  E(`S._lastExport = null; S._backupSpaeter = isoPlus(todayISO(), 3); renderDash();`);
  pruefe(!karte(), '„Später“: drei Tage Ruhe');
  E(`S._backupSpaeter = null; S.entries = {}; renderDash();`);
  pruefe(!karte(), 'Ohne Einträge (neuer Nutzer): keine Erinnerung');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
