// (v1.5.495) Die Tag-1-Karte der Startseite nennt bei mehreren Töpfen die Menge je Topf — wie der Satz direkt darüber.
//
// v1.5.142 hatte den Einsteiger-Satz auf „3 Etappen je ~250 ml je Topf“ umgestellt; die Karte darunter sagte weiter „2100 ml in
// 3 Etappen zu je ~700 ml“ (die Summe für drei Töpfe) — zwei Zahlen für denselben Guss auf einem Bildschirm. Gefunden bei der
// Prüfung des Einsteiger-Eintrags am 30.10.2026.
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

  const tag1 = (pflanzen) => JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.beginnerMode = true; S._seedlingProtocolShown = true;
    const c = addCyc({ name: 'Tag1', seedType: 'auto', medium: 'erde', growType: 'indoor', startMethod: 'saturated' }, { still: true });
    c.potSize = 11; _pflanzenAuffuellen(c, ${pflanzen}); c.startDate = todayISO(); S.cycles = [c]; saveS();
    const iso = todayISO(), p = phase(iso, c), a = getAction(iso, c);
    const karte = getTodayAction(c, p, a, iso) || {};
    renderDash();
    const t = document.getElementById('scr-dash').textContent.replace(/\s+/g, ' ');
    return JSON.stringify({ a, summe: waterSuggestion(c, p), n: getEffectivePlantCount(c, iso), schritte: (karte.steps || []).join(' | ').replace(/<[^>]+>/g, ''), text: t });
  })()`));

  // 1. Drei Töpfe: Karte je Topf, Etappe wie im Satz, Summe genannt
  const r = tag1(3);
  pruefe(r.a === 'saettigung' && r.n === 3, 'Prüflage: Tag 1 Sättigungsguss mit 3 Töpfen (' + r.a + ', ' + r.n + ')');
  const jeTopf = Math.round(r.summe / r.n), etappe = Math.max(50, Math.round(jeTopf / 3 / 50) * 50);
  pruefe(r.schritte.includes(`${jeTopf} ml je Topf in 3 Etappen zu je ~${etappe} ml`), `Karte: „${jeTopf} ml je Topf in 3 Etappen zu je ~${etappe} ml“ — ${r.schritte.split(' | ')[1]}`);
  pruefe(r.schritte.includes(`zusammen ${r.summe} ml für 3 Töpfe`), 'Karte nennt die Summe als „zusammen … für 3 Töpfe“');
  pruefe(!r.schritte.includes(`zu je ~${Math.round(r.summe / 3 / 50) * 50} ml,`) || Math.round(r.summe / 3 / 50) * 50 === etappe, 'Keine Etappe aus der Summe mehr');
  pruefe(r.text.includes(`je ~${etappe} ml je Topf`), 'Satz und Karte nennen dieselbe Etappe (~' + etappe + ' ml je Topf)');
  // 2. Ein Topf: unverändert
  const e = tag1(1);
  const et1 = Math.max(50, Math.round(e.summe / 3 / 50) * 50);
  pruefe(e.schritte.includes(`${e.summe} ml in 3 Etappen zu je ~${et1} ml`) && !/je Topf in 3 Etappen/.test(e.schritte), 'Ein Topf: „' + e.summe + ' ml in 3 Etappen zu je ~' + et1 + ' ml“ wie bisher');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
