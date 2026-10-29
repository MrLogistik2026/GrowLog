// (v1.5.444) Schnellhilfe „Pflanze hängt“: Die Karte „Erde trocken, Pflanze welk“ beginnt mit der Gegenprobe am Topf.
//
// Vorher: „Selten, aber möglich bei heißen Tagen … Nach 1-2 Stunden sollte die Pflanze sichtbar aufrichten.“ Beides steht nicht
// in ANBAU.md; „selten“ lässt Anfänger die Ursache übergehen, die eine Automatic jeden Stresstag dauerhaft kostet (ANBAU.md 9, 14).
// Gegossen wird, was dem Topf fehlt (1.1). Diagnose-Prüfung vom 08.10.2026, Befund B10; Text am 29.10.2026 gegengeprüft.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => null; w.navigator.vibrate = () => true; w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {}; w.alert = () => {}; w.print = () => {}; },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  w.toast = () => {};
  const E = (s) => w.eval(s);
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };

  const karte = JSON.parse(E(`JSON.stringify(SYMPTOMS.flatMap(s => s.causes || []).find(u => u.heading === 'Erde trocken, Pflanze welk') || null)`));
  pruefe(!!karte, 'Karte „Erde trocken, Pflanze welk“ gefunden');
  const t = (karte && karte.text) || '';
  pruefe(/^Nur wenn der Topf beim Anheben leicht ist/.test(t), `beginnt mit der Gegenprobe — „${t.slice(0, 50)}“`);
  pruefe(!/Selten/i.test(t), 'kein „selten“');
  pruefe(!/1-2 Stunden|1–2 Stunden/.test(t), 'kein „nach 1–2 Stunden aufrichten“');
  pruefe(/schwer, ist es eine der anderen Ursachen/.test(t), 'schwerer Topf → andere Ursache');
  pruefe(t.includes('Tag ' + E('DRAIN_AB_TAG')), 'nennt, ab welchem Tag der Gießpunkt gilt');
  pruefe(/Nicht abwarten/.test(t), 'nicht abwarten (ANBAU.md 14)');
  pruefe(karte && /Wassermangel/.test(karte.verdict || ''), 'Urteil heißt „Wassermangel“ wie in der Diagnose');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
