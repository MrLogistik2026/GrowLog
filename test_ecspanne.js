/**
 * (v1.5.165) Die EC-Spanne im Tageseintrag kommt aus dem Ziel der Plan-Woche.
 *
 * Der Fehler (bei der Browser-Prüfung von v1.5.163 aufgefallen): Die Zielzeile unter der Nährstoff-
 * Tabelle sagte immer „🎯 pH: 6.4 · EC: 800–2000 µS/cm · Drain: 15–20%" — in der Anzucht (Plan-Woche 3)
 * direkt neben dem EC-Feld mit „Ziel 700–1000". Und wo der Plan für eine Woche kein EC-Ziel führt
 * (Rainbow Woche 13, bewusst seit v1.5.140), erschien stattdessen die erfundene Spanne 0,8–2,0. Nach
 * ANBAU.md 5 ist der EC-Verlauf phasengebunden; eine feste Spanne über alle Phasen ist keine Aussage.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

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

// Zyklus anlegen, einen Gießtag nach Bedingung suchen, Eintrag im Profi-Modus lesen
const LAUF = (key, bloom, bedingung) => `(function(){
  const plan = S.fertPlans.find(p => p.presetKey === '${key}');
  S.cycles = []; S.entries = {}; S.beginnerMode = false; S.ecUnit = 'mS';
  const c = addCyc({ name: '${key}', seedType: 'auto', medium: 'erde' });
  c.startDate = '2026-03-01'; c.fertPlanId = plan.id; c.bloomDays = ${bloom}; c.potSize = 11;
  S._activePlanId = plan.id; syncActivePlanToGlobals(); saveS();
  for (let d = 9; d <= 130; d++) {
    const iso = isoPlus(c.startDate, d - 1); const p = phase(iso, c); if (!p) continue;
    const a = getAction(iso, c); if (a !== 'giess' && a !== 'giess_anz') continue;
    const wk = fertPlanWeek(c, iso, p); const ec = getEcTarget(c, p, iso);
    if (!(${bedingung})) continue;
    setDebugDate(iso); openEntry(iso);
    const t = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
    return JSON.stringify({ tag: d, wk, ph: p.ph, ec: ec ? { min: ecFmt(ec.min), max: ecFmt(ec.max), waterOnly: !!ec.waterOnly } : null,
      ziel: (t.match(/🎯 pH:[^]{0,80}?%/) || [''])[0], rechts: (t.match(/Ziel: pH [^]{0,60}?Drain entsorgen/) || [''])[0], fest: /0\\.8–2\\.0/.test(t) });
  }
  return JSON.stringify({ fehlt: true });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  for (const key of ['biobizz_official', 'rainbow_auto']) {
    E(`loadPreset('${key}')`); await warte(30); E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(60);
  }

  console.log('\nA - BioBizz Official, Plan-Woche 3, Feed-Tag');
  {
    const r = JSON.parse(E(LAUF('biobizz_official', 85, "wk === 3 && ec && !ec.waterOnly && getFeedWaterEffective(c, p, iso, null) !== 'water'")));
    pruef('Prüflage gefunden', !r.fehlt, JSON.stringify(r));
    if (!r.fehlt) {
      console.log(`    Tag ${r.tag} (${r.ph}, Woche ${r.wk}) · Ziel des Plans ${r.ec.min}–${r.ec.max} · „${r.ziel}" · „${r.rechts}"`);
      pruef('Zielzeile unter den Nährstoffen nennt das Plan-Ziel', r.ziel.includes(`EC: ${r.ec.min}–${r.ec.max}`), r.ziel);
      pruef('… und das Ablaufziel 15–20 %', r.ziel.includes('Drain: 15–20 %'), r.ziel);
      pruef('Keine feste Spanne 0.8–2.0 im Eintrag', r.fest === false);
    }
  }

  console.log('\nB - Rainbow, Plan-Woche ohne EC-Ziel');
  {
    const r = JSON.parse(E(LAUF('rainbow_auto', 70, '!ec')));
    pruef('Prüflage: ein Gießtag ohne EC-Ziel', !r.fehlt, JSON.stringify(r));
    if (!r.fehlt) {
      console.log(`    Tag ${r.tag} (${r.ph}, Woche ${r.wk}) · „${r.ziel}" · „${r.rechts}"`);
      pruef('Keine erfundene Spanne 0.8–2.0', r.fest === false, r.rechts + ' / ' + r.ziel);
      pruef('Die rechte Zielzeile nennt kein EC', r.rechts === '' || !/EC/.test(r.rechts), r.rechts);
    }
  }

  console.log('\nC - Die feste Spanne steht nirgends mehr im Eintrag');
  {
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n')
      .map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z));
    ['`${ecFmt(0.8)}–${ecFmt(2.0)}`', 'EC: ${ecFmt(0.8)}–${ecFmt(2.0)}', 'Drain: 15–20%</div>'].forEach(alt => {
      const treffer = quelle.filter(x => x.z.includes(alt)).map(x => 'Zeile ' + x.nr);
      pruef('Nirgends: „' + alt + '"', treffer.length === 0, treffer.join(', '));
    });
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
