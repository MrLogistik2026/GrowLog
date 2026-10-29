// (v1.5.453) Meilenstein Tag 3: keine „ersten Blättchen“ und kein „ganz wenig gießen“.
//
// Die Karte sagte „Tag 3 — erste Blättchen kommen raus! Jetzt nur ganz wenig gießen.“ — direkt unter „Heute nur sprühen,
// nicht gießen!“, und der Eintrag desselben Tags sagt „zu sehen ist noch nichts, und das ist normal“. Der Keimling kommt aus
// 1 cm Tiefe nach 3,3–3,9 Tagen, die App plant mit Tag 4–7 (ANBAU.md 16). Gefunden bei der Anfänger-Prüfung am 29.10.2026.
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

  const texte = JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true;
    const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -2), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c];
    const tag = phase(todayISO(), c).day;
    return JSON.stringify({ tag, alerts: (getAlerts(c) || []).map(a => a.text || '') }); })()`));
  pruefe(texte.tag === 3, 'Prüflage: Tag 3 (' + texte.tag + ')');
  const d3 = texte.alerts.find((t) => /^Tag 3/.test(t)) || '';
  pruefe(!!d3, 'Meilenstein Tag 3 erscheint');
  pruefe(!/Blättchen kommen raus|ganz wenig gießen/.test(d3), 'Tag 3: kein „erste Blättchen“, kein „ganz wenig gießen“ — ' + d3);
  pruefe(new RegExp('Tag ' + E('KEIMUNG.auflaufenVon') + '–' + E('KEIMUNG.auflaufenBis')).test(d3), 'Tag 3: nennt das Auflaufen aus KEIMUNG');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
