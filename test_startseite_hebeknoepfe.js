// (v1.5.473) Die Gießkarte der Startseite fragt den Topf: fünf Hebe-Knöpfe, danach rechnet die Karte mit der Messung.
//
// Vorher stand vorn die Kalendermenge, und „✓ Erledigt“ buchte sie blind; die Messung, die sie ändern würde (Voll → heute nicht
// gießen, Knapp → mehr), steckte im Eintrag. Gießtag-Prüfung am 29.10.2026, Punkt 1; ANBAU.md 1, 15 (Messung schlägt Kalender).
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
  const dash = () => ((w.document.getElementById('scr-dash') || w.document.body).textContent || '').replace(/\s+/g, ' ');

  // Zyklus so anlegen, dass heute ein Gießtag ist (ab Tag 25 bzw. davor), Einsteiger-Modus, Hebe-Test-Modus
  const lage = (minTag, maxTag) => E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true; S.beginnerMode = true;
    for (let t = ${minTag}; t <= ${maxTag}; t++) {
      S.cycles = []; const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -(t - 1)), seedType: 'auto', growType: 'indoor', medium: 'erde',
        potSize: 11, plantCount: 1, startMethod: 'saturated' }, { still: true }); c.weightMode = 'lift'; S.cycles = [c];
      if (getAction(todayISO(), c) === 'giess' || getAction(todayISO(), c) === 'giess_anz') { renderDash(); return c.id; }
    }
    return null; })()`);

  // 1. Gießtag ab Tag 25: fünf Knöpfe
  const id = lage(30, 45);
  pruefe(!!id, 'Prüflage: Gießtag zwischen Tag 30 und 45 gefunden');
  pruefe(/Erst anheben — wie schwer ist der Topf/.test(dash()), 'Gießkarte fragt „Erst anheben — wie schwer ist der Topf?“');
  const knoepfe = E(`[...document.querySelectorAll('button')].filter(b => /dashHebeTest\\(/.test(b.getAttribute('onclick') || '')).length`);
  pruefe(knoepfe === 5, 'Fünf Hebe-Knöpfe (' + knoepfe + ')');
  // 2. „Voll“: eingetragen, Karte sagt nicht gießen
  E(`dashHebeTest(${JSON.stringify(id)}, 'full')`);
  pruefe(E(`S.entries[todayISO()].cycleData[${JSON.stringify(id)}].restPct`) === E('LIFT_FEEL_VALUES.full'), 'Voll als Hebe-Test von heute eingetragen');
  pruefe(/Hebe-Test heute: .*Voll/.test(dash()), 'Karte nennt „Hebe-Test heute: Voll“');
  pruefe(/nicht gießen/.test(dash()), 'Karte sagt bei vollem Topf „nicht gießen“');
  pruefe(!/Erst anheben/.test(dash()), 'Nach der Messung keine Knöpfe mehr');
  // 3. „Knapp“ auf frischer Lage: eingetragen, Karte nennt eine Menge
  const id2 = lage(30, 45);
  E(`dashHebeTest(${JSON.stringify(id2)}, 'low')`);
  pruefe(/Hebe-Test heute: .*Knapp/.test(dash()) && /\d+ ml/.test(dash()), 'Knapp: eingetragen, Karte nennt eine Menge');
  // 4. Vor Tag 25: keine Knöpfe
  const id3 = lage(9, 20);
  pruefe(!!id3 && !/Erst anheben/.test(dash()), 'Vor Tag 25: keine Hebe-Knöpfe');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
