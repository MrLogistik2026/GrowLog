// Topping und Gießplan (Prüfung vom 08.10.2026, Nachtprüfung Punkt 5).
//
//   P1 (v1.5.426)  Versprochener erster Guss nach dem Topping = erster Gießtag im Plan (Standard-Start Tag 15–21, auch „direct“).
//   P2 (v1.5.427)  Voller Topf am Topping-Tag: kein „Heute gießen — dann toppen“ / „Erst gießen“ neben „Topf ist voll“.
//   P3 (v1.5.428)  „Jetzt Toppen“ ändert den heutigen Gießtag nicht (Blütetage 28–36, 40).
//   P4 (v1.5.429)  Startseite, Anzucht-Karte: an einem Wasser-Tag laut Plan steht „Wasser-Tag“, nicht „Dünger laut Plan“.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, arcTo: noop, rect: noop, fill: noop, stroke: noop,
    fillRect: noop, clearRect: noop, strokeRect: noop, save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    setTransform: noop, fillText: noop, strokeText: noop, drawImage: noop, clip: noop, setLineDash: noop, quadraticCurveTo: noop,
    bezierCurveTo: noop, measureText: () => ({ width: 0 }), createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}
async function starte() {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
    },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  w.toast = () => {};
  w.eval('S._seedlingProtocolShown = true; customConfirm = async () => true;');
  return { w, errors, E: (s) => w.eval(s) };
}

(async () => {
  const fehler = [];
  let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const a = await starte();
  const neu = (seedType, tag, plan, start) => `(function(){ S.cycles = []; S.entries = {}; const heute = todayISO();
    const c = addCyc({ name: 'Gruppe A', startDate: isoPlus(heute, -(${tag} - 1)), seedType: '${seedType}', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: '${start || 'saturated'}', fertPlanId: _planFuerVorlage('${plan}') }, { still: true });
    S.cycles = [c]; selId = c.id; window.__c = c; return c; })()`;

  // P1 (v1.5.426) · Versprechen = Plan
  {
    const falsch = [];
    for (const start of ['saturated', 'direct']) for (const mitGuss of [true, false]) for (let T = 15; T <= 21; T++) {
      a.E(neu('auto', T, 'rainbow_auto', start));
      a.E(`(function(){ const c = window.__c; const heute = todayISO();
        for (let d = 1; d < ${T}; d++) { const iso = isoPlus(c.startDate, d - 1); const x = getAction(iso, c);
          if (x === 'giess_anz' || x === 'saettigung') S.entries[iso] = { cycleData: { [c.id]: { water: '400' } } }; }
        if (${mitGuss} && getAction(heute, c) === 'giess_anz') S.entries[heute] = { cycleData: { [c.id]: { water: '400' } } }; saveS(); })()`);
      await a.w.eval('doTopping(window.__c.id, todayISO())');
      const erster = a.E(`(function(){ const c = window.__c; for (let d = ${T} + 1; d <= ${T} + 20; d++) if (isGiessTag(isoPlus(c.startDate, d - 1), c)) return d; return null; })()`);
      const pause = a.E('window.__c.toppingPause || 2');
      if (erster !== T + pause + 1) falsch.push(`${start}${mitGuss ? '+Guss' : ''} Tag ${T}: versprochen ${T + pause + 1}, Plan ${erster}`);
    }
    pruefe(falsch.length === 0, `P1 ${falsch.length} von 28 Fällen: versprochener erster Guss ≠ Plan: ` + falsch.slice(0, 4).join(' | '));
  }

  // P2 (v1.5.427) · Voller Topf am Topping-Tag
  {
    let lage = null;
    for (let t = 25; t <= 60 && !lage; t++) {
      a.E(neu('fem', t, 'biobizz_light'));
      if (a.E(`(function(){ window.__c.anzuchtDays = 35; return getAction(todayISO(), window.__c); })()`) === 'giess_anz') lage = t;
    }
    pruefe(!!lage, 'P2-0 Prüflage: kein Anzucht-Gießtag ab Tag 25 gefunden');
    if (lage) {
      a.E(`(function(){ const c = window.__c; c.weightMode = 'lift'; S.beginnerMode = true;
        S.entries[todayISO()] = { cycleData: { [c.id]: { restPct: 100, _restPctUserSet: true } } }; saveS(); })()`);
      await a.w.eval('doTopping(window.__c.id, todayISO())');
      const e = a.E(`(function(){ const heute = todayISO(); editISO = heute; openEntry(heute); return document.getElementById('entry-body').textContent.replace(/\\s+/g, ' '); })()`);
      const voll = /Topf ist voll|heute nicht gießen/i.test(e), giessen = /dann toppen|Erst gießen/.test(e);
      pruefe(voll && !giessen, `P2-1 Topping-Tag Tag ${lage}, Hebe-Test 100 %: „voll“ ${voll}, „dann toppen/Erst gießen“ ${giessen}`);
    }
  }

  // P3 (v1.5.428) · Der Knopf ändert den heutigen Gießtag nicht
  {
    const kippt = [];
    for (const T of [28, 29, 30, 31, 32, 33, 34, 35, 36, 40]) {
      a.E(neu('fem', T, 'biobizz_light'));
      a.E(`(function(){ const c = window.__c; c.anzuchtDays = 28;
        for (let d = 9; d < ${T}; d++) { const iso = isoPlus(c.startDate, d - 1); const x = getAction(iso, c);
          if (x === 'giess_anz' || x === 'giess') S.entries[iso] = { cycleData: { [c.id]: { water: '1500' } } }; } saveS(); })()`);
      const vor = a.E('getAction(todayISO(), window.__c)');
      await a.w.eval('doTopping(window.__c.id, todayISO())');
      const nach = a.E('getAction(todayISO(), window.__c)');
      if (vor !== nach) kippt.push(`Tag ${T}: ${vor || '–'} → ${nach || '–'}`);
    }
    pruefe(kippt.length === 0, `P3 ${kippt.length} von 10 Blütetagen: „Jetzt Toppen“ ändert den heutigen Gießtag: ` + kippt.join(' | '));
  }

  // P4 (v1.5.429) · Anzucht-Karte am Wasser-Tag
  {
    a.E(neu('auto', 15, 'rainbow_auto'));
    a.E(`(function(){ const c = window.__c;
      for (let d = 1; d < 15; d++) { const iso = isoPlus(c.startDate, d - 1); const x = getAction(iso, c);
        if (x === 'giess_anz' || x === 'saettigung') S.entries[iso] = { cycleData: { [c.id]: { water: '400' } } }; } saveS(); })()`);
    await a.w.eval('doTopping(window.__c.id, todayISO())');
    const r = JSON.parse(a.E(`(function(){ const c = window.__c, heute = todayISO(), p = phase(heute, c), x = getAction(heute, c);
      const cd = (S.entries[heute] && S.entries[heute].cycleData || {})[c.id] || null;
      const k = getTodayAction(c, p, x, heute) || {};
      return JSON.stringify({ x, fw: getFeedWaterEffective(c, p, heute, cd), schritte: (k.steps || []).join(' | ').replace(/<[^>]+>/g, '') }); })()`));
    pruefe(r.x === 'giess_anz' && r.fw === 'water', 'P4-0 Prüflage (Topping-Tag ist Gießtag und laut Plan Wasser-Tag): ' + JSON.stringify({ x: r.x, fw: r.fw }));
    pruefe(/Wasser-Tag laut Plan/.test(r.schritte) && !/Dünger laut Plan/.test(r.schritte), 'P4-1 Anzucht-Karte am Wasser-Tag: ' + r.schritte.slice(0, 200));
  }

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_topping: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_topping: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_topping abgebrochen:', (e && e.stack) || e); process.exit(1); });
