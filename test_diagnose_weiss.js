// (v1.5.441) Weiß ausgebleichte Spitzen haben einen eigenen Knopf, und die Diagnose nennt zuerst das Foto-Bleaching. (v1.5.451) Kein „eingraben“.
//
// ANBAU.md 8.2: Photobleaching bleicht nach WEISS aus und trifft die lichtnächsten Spitzen — Maßnahme Leistung runter oder
// Abstand größer. Thermischer Stress vergilbt oder verbrennt. Die Oberfläche kannte nur „Hellgrün“; wer weiße Spitzen sah,
// wählte das und bekam „Lichtmangel / Etiolierung“ gleichauf mit dem Foto-Bleaching, mit „Lampe ein Stück näher“ als
// erstem Handgriff — die falsche Richtung (Diagnose-Prüfung vom 08.10.2026, Befund B07).
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

  // 1. Der Knopf
  const weiss = JSON.parse(E('JSON.stringify((DIAG_LABELS.color || {}).white || null)'));
  pruefe(weiss && /wei/i.test(weiss.label), 'Farbknopf „Weiß / ausgebleicht“ fehlt in DIAG_LABELS.color');
  pruefe(E('!!(DIAG_LABELS.color || {}).paleGreen'), 'Farbknopf „Hellgrün“ ist weg — er bleibt, blass ist ein anderes Bild');

  // 2. Weiß an den lichtnächsten Stellen: Foto-Bleaching vorn, auch mit „zu warm“
  const d = (sym, ctx) => JSON.parse(E(`JSON.stringify(diagnoseProblems(${JSON.stringify(sym)}, ${JSON.stringify(ctx)}).map(x => x.problem.id))`));
  for (const ort of ['newLeaves', 'buds', 'allLeaves']) {
    for (const [name, ctx] of [['Blüte', { phase: 'bloom' }], ['Blüte + zu warm', { phase: 'bloom', tempHot: true, tempWarm: true }]]) {
      const r = d({ location: [ort], colors: ['white'], shapes: [] }, ctx);
      pruefe(r[0] === 'photo_bleaching', `${ort} weiß, ${name}: Foto-Bleaching auf Platz 1 — ${r.join(' | ')}`);
    }
  }
  // 3. Blass-hellgrün bleibt, was es war: Lichtmangel steht weiter zur Wahl
  const blass = d({ location: ['allLeaves'], colors: ['paleGreen'], shapes: [] }, { phase: 'bloom' });
  pruefe(blass.includes('light_deficiency'), `Hellgrün: Lichtmangel steht weiter in der Liste — ${blass.join(' | ')}`);

  // 4. Der Lichtmangel-Text unterscheidet zuerst: weiß = zu viel Licht, vor „Lampe näher“
  const lm = E("(PROBLEMS.find(p => p.id === 'light_deficiency') || {}).action || ''");
  const iWeiss = lm.search(/wei(ß|ss)/i), iNaeher = lm.indexOf('näher');
  pruefe(iWeiss >= 0 && iNaeher > iWeiss, 'Lichtmangel: die Unterscheidung „weiß = zu viel Licht“ steht vor „näher“');
  pruefe(/Erst unterscheiden/.test(lm.slice(0, 40)), 'Lichtmangel: der Text beginnt mit der Unterscheidung');

  // (v1.5.451) Kein „Pflanze tiefer eingraben“ bei gestreckten Pflanzen — umsetzen kostet Tage, die eine Automatic nicht aufholt
  // (ANBAU.md 7.4, 9); stattdessen eine Stütze.
  const lichtTexte = JSON.parse(E(`JSON.stringify([].concat(PROBLEMS.map(p => (p.action || '') + ' ' + (p.description || '')), SYMPTOMS.flatMap(s => (s.causes || []).map(c => c.text || ''))))`));
  pruefe(!lichtTexte.some(t => /eingraben/i.test(t)), 'Kein „tiefer eingraben“ in Diagnose und Schnellhilfe');
  pruefe(/stütze/i.test(lm), 'Lichtmangel: Stütze statt Eingraben');
  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
