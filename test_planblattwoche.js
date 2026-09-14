/**
 * (v1.5.148) Das Plan-Blatt markiert die Woche des Zyklus, der den aufgeschlagenen Plan nutzt.
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft): renderDuenger nahm fc = active()[0] — den
 * ersten aktiven Zyklus, egal auf welchem Plan. Mit Rainbow aufgeschlagen markierte das Blatt die
 * Woche von Run 01 (BioBizz), im Einsteiger-Modus waren nur diese und die nächste Zeile zu sehen,
 * und der Wochen-Tipp stammte aus derselben fremden Woche. Für Patricks Run 02 (Start 15.09.)
 * zeigte das Blatt über die ganze Anzucht „Wo 12 ● Taper".
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '',
    textBaseline: '', globalAlpha: 1, lineCap: '', lineJoin: '', shadowBlur: 0, shadowColor: '',
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, arcTo: noop,
    rect: noop, fill: noop, stroke: noop, fillRect: noop, clearRect: noop, strokeRect: noop,
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop, setTransform: noop,
    fillText: noop, strokeText: noop, drawImage: noop, clip: noop, setLineDash: noop,
    quadraticCurveTo: noop, bezierCurveTo: noop, measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}

async function load() {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true;
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
      w.localStorage.setItem('growsmart_v4', BACKUP);
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 80));
  return { window, errors, E: (s) => window.eval(s) };
}
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

// Liest das Plan-Blatt: sichtbare Zeilen, markierte Woche, Wochen-Tipp.
const BLATT = `(function(){
  goTo('duenger');
  const t = Array.from(document.querySelectorAll('table')).find(x => { const th = x.querySelector('thead th'); return th && th.textContent.trim() === 'Woche'; });
  const zeilen = t ? Array.from(t.querySelectorAll('tbody tr')).map(tr => tr.querySelector('td div').textContent.trim()) : [];
  const karte = t ? t.closest('div[style*="border-radius:14px"]') : null;
  const txt = karte ? karte.textContent.replace(/\\s+/g, ' ') : '';
  const tipp = (txt.match(/Woche (\\d+):/) || [])[1];
  const c1 = S.cycles[0], c2 = S.cycles.find(c => c.id === 'run02');
  const plan = getActivePlan();
  return JSON.stringify({ plan: plan && plan.name, zeilen, markiert: zeilen.filter(z => z.endsWith('●')),
    tipp: tipp ? +tipp : null, alleKnopf: /Alle \\d+ Wochen zeigen/.test(txt),
    wocheRun01: fertPlanWeek(c1, todayISO()), wocheRun02: c2 ? fertPlanWeek(c2, todayISO()) : null,
    wochen: plan.weekPhases && plan.weekPhases.length ? plan.weekPhases.length : Math.max(12, Object.keys(plan.schedule || {}).length),
    run01Vorbei: _duengungVorbei(c1, todayISO()), ersterAktiver: (active()[0] || {}).id === c1.id });
})()`;

const AUFSCHLAGEN = (welcher) => `(function(){
  const id = '${welcher}' === 'rainbow' ? S.fertPlans.find(p => p.presetKey === 'rainbow_auto').id : window.__bio;
  S._activePlanId = id; syncActivePlanToGlobals(); S._planAlleWochen = false; S._planEdit = false; saveS();
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  E(`setDebugDate('2026-08-20')`);
  E(`window.__bio = S.cycles[0].fertPlanId`);
  E(`loadPreset('rainbow_auto')`); await warte(30); E(`_modalResolve && _modalResolve(true)`); await warte(60);
  E(`(function(){
    S.cycles[0].fertPlanId = window.__bio;
    const rb = S.fertPlans.find(p => p.presetKey === 'rainbow_auto');
    const c2 = addCyc({ name: 'Run 02', seedType: 'auto', medium: 'erde' });
    c2.id = 'run02'; c2.startDate = '2026-08-01'; c2.fertPlanId = rb.id; c2.potSize = 11;
    S.beginnerMode = true; saveS();
  })()`);

  console.log('\nA - 20.08.: Run 01 (BioBizz, Blüte) ist der erste aktive Zyklus, Rainbow aufgeschlagen');
  E(AUFSCHLAGEN('rainbow'));
  {
    const r = JSON.parse(E(BLATT));
    console.log(`    ${r.plan} · Run 01 in Woche ${r.wocheRun01}, Run 02 in Woche ${r.wocheRun02} · Blatt: ${r.zeilen.join(' | ')} · Tipp: Woche ${r.tipp}`);
    pruef('Prüflage: Run 01 steht vorn, beide Zyklen in verschiedenen Wochen', r.ersterAktiver && /Rainbow/.test(r.plan) && r.wocheRun01 !== r.wocheRun02, JSON.stringify(r).slice(0, 160));
    pruef('Markiert ist die Woche von Run 02', r.markiert.length === 1 && r.markiert[0] === `Wo ${r.wocheRun02} ●`, r.markiert.join(', '));
    pruef('Einsteiger sieht genau diese und die nächste Woche', r.zeilen.join('|') === `Wo ${r.wocheRun02} ●|Wo ${r.wocheRun02 + 1}`, r.zeilen.join(' | '));
    pruef('Der Wochen-Tipp gehört zu derselben Woche', r.tipp === r.wocheRun02, r.tipp);
  }

  console.log('\nB - Profi-Modus, derselbe Tag');
  E(`S.beginnerMode = false`);
  {
    const r = JSON.parse(E(BLATT));
    pruef('Alle Wochen, markiert ist Run 02', r.zeilen.length === r.wochen && r.markiert.join() === `Wo ${r.wocheRun02} ●`, r.markiert.join(', ') + ' / ' + r.zeilen.length);
  }
  E(`S.beginnerMode = true`);

  console.log('\nC - Gegenprobe: BioBizz aufgeschlagen');
  E(AUFSCHLAGEN('bio'));
  {
    const r = JSON.parse(E(BLATT));
    console.log(`    ${r.plan} · Blatt: ${r.zeilen.join(' | ')}`);
    pruef('Markiert ist die Woche von Run 01', r.markiert.length === 1 && r.markiert[0] === `Wo ${r.wocheRun01} ●`, r.markiert.join(', '));
  }

  console.log('\nD - Patricks nächste Lage: 18.09., Run 01 im Curing, Run 02 seit 15.09. auf Rainbow');
  E(`setDebugDate('2026-09-18')`);
  E(`S.cycles.find(c => c.id === 'run02').startDate = '2026-09-15'; saveS()`);
  E(AUFSCHLAGEN('rainbow'));
  {
    const r = JSON.parse(E(BLATT));
    console.log(`    ${r.plan} · Run 01 Woche ${r.wocheRun01} (Düngung vorbei: ${r.run01Vorbei}), Run 02 Woche ${r.wocheRun02} · Blatt: ${r.zeilen.join(' | ')}`);
    pruef('Rainbow: markiert ist Woche 1 von Run 02', r.markiert.join() === `Wo ${r.wocheRun02} ●` && r.wocheRun02 === 1, r.markiert.join(', '));
    pruef('… und zu sehen sind Woche 1 und 2', r.zeilen.join('|') === 'Wo 1 ●|Wo 2', r.zeilen.join(' | '));
  }
  E(AUFSCHLAGEN('bio'));
  {
    const r = JSON.parse(E(BLATT));
    console.log(`    ${r.plan} · Blatt: ${r.zeilen.length} Zeilen, markiert: ${r.markiert.join(', ') || '—'}`);
    pruef('Prüflage: Run 01 wird nicht mehr gedüngt', r.run01Vorbei === true);
    pruef('BioBizz ohne laufenden Zyklus: keine Woche markiert, alle Wochen zu sehen', r.markiert.length === 0 && r.zeilen.length === r.wochen && !r.alleKnopf, r.markiert.join(', ') + ' / ' + r.zeilen.length + ' von ' + r.wochen);
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
