/**
 * (v1.5.145) Zwei Grows, zwei Pläne: Tageseintrag, „Empfehlung übernehmen", Nachholen und
 * Tagebuch-Export nehmen Produkte, Einheiten und Mischliste aus dem Plan DES ZYKLUS.
 *
 * Der Fehler (Prüf-Agenten, Blickwinkel doppelte Regeln, gegengeprüft): Die Dosen kommen seit
 * v1.5.100 über getPlanForCycle(c) — Produkte, Einheiten und Mischreihenfolge lasen neun Stellen
 * aber aus den Spiegeln S.products / S.mixOrder, und die gehören zum Plan, der im
 * Düngeplan-Bildschirm aufgeschlagen ist. Mit Run 02 auf Rainbow neben Run 01 auf BioBizz:
 *   · Nährstofftabelle mit BioBizz-Zeilen ohne Dosis, die Rainbow-Dosen unsichtbar
 *   · „Empfehlung übernehmen" und Nachholen rechneten mit fremden Einheiten (ein Zehntel)
 * Produkt-IDs sind je Plan eindeutig — eine Suche im falschen Plan findet nichts.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const BIO_ID = 'fp_1788458746438';
// Produkte, die nur BioBizz Official kennt — dürfen im Eintrag von Run 02 nie stehen.
const NUR_BIOBIZZ = ['Top·Max', 'Root·Juice', 'Bio·Heaven', 'Acti·Vera'];

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

// Run 01 (Patrick, BioBizz) bleibt im Speicher, wird für den Eintrag aber inaktiv gesetzt, damit
// der Eintrag nur Run 02 zeigt. Run 02 läuft auf Rainbow. Aufgeschlagen ist BioBizz.
async function aufbau() {
  const r = await load();
  const { E } = r;
  E(`setDebugDate('2026-09-13')`);
  E(`loadPreset('rainbow_auto')`); await warte(30); E(`_modalResolve && _modalResolve(true)`); await warte(60);
  r.iso = E(`(function(){
    const rb = S.fertPlans.find(p => p.presetKey === 'rainbow_auto');
    S.cycles[0].fertPlanId = '${BIO_ID}'; S.cycles[0].active = false;
    const c2 = addCyc({ name: 'Run 02', seedType: 'auto', medium: 'erde' });
    c2.id = 'run02'; c2.startDate = '2026-07-10'; c2.fertPlanId = rb.id; c2.potSize = 11;
    S._activePlanId = '${BIO_ID}'; syncActivePlanToGlobals(); saveS();
    for (let i = 0; i < 40; i++) {
      const d = isoPlus('2026-08-05', i); const p = phase(d, c2); const a = getAction(d, c2);
      if ((a === 'giess' || a === 'giess_anz') && getFeedWaterType(c2, p, d) !== 'water'
          && Object.values(getWeekDoses(c2.id, fertPlanWeek(c2, d, p), c2)).some(v => v > 0)) return d;
    }
    return null;
  })()`);
  return r;
}

const EINTRAG = (iso) => `(function(){
  const c2 = S.cycles.find(c => c.id === 'run02'); const rb = getPlanForCycle(c2);
  editISO = '${iso}'; renderEntry('${iso}');
  const body = document.getElementById('entry-body') || document.getElementById('scr-entry');
  const text = body.textContent.replace(/\\s+/g, ' ');
  const zeilen = Array.from(body.querySelectorAll('.nt-calc[data-cycle="run02"]')).map(x => {
    const row = x.closest('.nut-row-tbl');
    return { name: (row && row.querySelector('.nt-name') || {}).textContent, plan: parseFloat(x.getAttribute('data-plan')), unit: x.getAttribute('data-unit') };
  });
  const wk = fertPlanWeek(c2, '${iso}'); const soll = getWeekDoses('run02', wk, c2);
  const sollNamen = Object.keys(soll).filter(k => soll[k] > 0).map(k => rb.products.find(p => p.id === k).name);
  return JSON.stringify({ aufgeschlagen: (getActivePlan() || {}).name, text, zeilen, sollNamen, rbNamen: rb.products.map(p => p.name) });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('\nA - Tageseintrag von Run 02 (Rainbow), aufgeschlagen ist BioBizz');
  {
    const { E, errors, iso } = await aufbau();
    pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
    pruef('Feed-Tag von Run 02 gefunden', !!iso, iso);
    if (iso) {
      const r = JSON.parse(E(EINTRAG(iso)));
      console.log('    ' + iso + ' · aufgeschlagen: ' + r.aufgeschlagen + ' · Plan-Dosen: ' + r.sollNamen.join(', '));
      console.log('    Tabelle: ' + r.zeilen.map(z => z.name + (z.plan > 0 ? ' ' + z.plan : '')).join(' | '));
      pruef('Aufgeschlagen ist wirklich BioBizz', /BioBizz/.test(r.aufgeschlagen || ''), r.aufgeschlagen);
      pruef('Jede Tabellenzeile ist ein Rainbow-Produkt', r.zeilen.length > 0 && r.zeilen.every(z => r.rbNamen.includes(z.name)), r.zeilen.map(z => z.name).join(', '));
      pruef('Alle Plan-Dosen der Woche stehen mit Dosis in der Tabelle',
        r.sollNamen.every(n => r.zeilen.some(z => z.name === n && z.plan > 0)), r.sollNamen.join(', '));
      pruef('Kein BioBizz-Produkt irgendwo im Eintrag (Tabelle, Mischliste)', NUR_BIOBIZZ.every(n => !r.text.includes(n)), NUR_BIOBIZZ.filter(n => r.text.includes(n)).join(', '));

      // „Empfehlung übernehmen"
      E(`applyRecommended('run02', fertPlanWeek(S.cycles.find(c => c.id === 'run02'), '${iso}'))`);
      for (let k = 0; k < 4; k++) { await warte(40); E(`typeof _modalResolve === 'function' && _modalResolve(true)`); }
      await warte(80);
      const u = JSON.parse(E(`(function(){
        const c2 = S.cycles.find(c => c.id === 'run02'); const rb = getPlanForCycle(c2);
        const cd = S.entries['${iso}'].cycleData.run02;
        const wk = fertPlanWeek(c2, '${iso}'); const soll = getWeekDoses('run02', wk, c2);
        const w = parseFloat(cd.water) * ((typeof reserveFactor === 'function') ? reserveFactor(c2) : 1);
        return JSON.stringify(Object.keys(soll).filter(k => soll[k] > 0).map(k => { const pr = rb.products.find(p => p.id === k);
          return { name: pr.name, eingetragen: cd.doses && cd.doses[k], richtig: calcDose(soll[k], w, pr.unit) }; }));
      })()`));
      const falsch = u.filter(x => Math.abs((x.eingetragen || 0) - x.richtig) > 1e-9);
      pruef('„Empfehlung übernehmen": jede Dosis mit der Einheit aus dem Rainbow-Plan', u.length > 0 && falsch.length === 0, JSON.stringify(falsch.slice(0, 3)));
    }
  }

  console.log('\nB - Nachholen für Run 02, aufgeschlagen ist BioBizz');
  {
    const { E, iso } = await aufbau();
    if (iso) {
      E(`(function(){ Object.keys(S.entries).forEach(d => { if (S.entries[d].cycleData) delete S.entries[d].cycleData.run02; }); saveS(); })()`);
      E(`backfillPast('run02')`); await warte(40); E(`_modalResolve && _modalResolve(true)`); await warte(150);
      const u = JSON.parse(E(`(function(){
        const c2 = S.cycles.find(c => c.id === 'run02'); const rb = getPlanForCycle(c2);
        const cd = S.entries['${iso}'] && S.entries['${iso}'].cycleData && S.entries['${iso}'].cycleData.run02;
        if (!cd) return JSON.stringify({ fehlt: true });
        const wk = fertPlanWeek(c2, '${iso}'); const soll = getWeekDoses('run02', wk, c2); const w = parseFloat(cd.water);
        return JSON.stringify(Object.keys(soll).filter(k => soll[k] > 0).map(k => { const pr = rb.products.find(p => p.id === k);
          return { name: pr.name, unit: pr.unit, eingetragen: cd.doses && cd.doses[k], richtig: calcDose(soll[k], w, pr.unit) }; }));
      })()`));
      pruef('Nachgeholter Tag vorhanden', !u.fehlt, JSON.stringify(u).slice(0, 80));
      if (!u.fehlt) {
        const falsch = u.filter(x => Math.abs((x.eingetragen || 0) - x.richtig) > 1e-9);
        pruef('Nachgeholte Dosen mit den Rainbow-Einheiten', u.length > 0 && falsch.length === 0, JSON.stringify(falsch.slice(0, 3)));
      }
    } else pruef('Feed-Tag von Run 02 gefunden (B)', false);
  }

  console.log('\nC - Der eigene Plan aufgeschlagen: unverändert richtig');
  {
    const { E, iso } = await aufbau();
    if (iso) {
      E(`(function(){ S._activePlanId = S.cycles.find(c => c.id === 'run02').fertPlanId; syncActivePlanToGlobals(); })()`);
      const r = JSON.parse(E(EINTRAG(iso)));
      pruef('Rainbow aufgeschlagen: Tabelle aus Rainbow mit allen Plan-Dosen',
        r.zeilen.every(z => r.rbNamen.includes(z.name)) && r.sollNamen.every(n => r.zeilen.some(z => z.name === n && z.plan > 0)), r.zeilen.map(z => z.name).join(', '));
    }
  }

  console.log('\nD - Tagebuch-Export nennt Produkte alter Pläne beim Namen');
  {
    const { E } = await load();
    E(`setDebugDate('2026-09-13')`);
    const r = JSON.parse(E(`(function(){
      let md = '';
      const AltBlob = window.Blob, altUrl = URL.createObjectURL, altClick = HTMLAnchorElement.prototype.click;
      window.Blob = function (teile, opt) { md = teile.join(''); return new AltBlob(teile, opt); };
      URL.createObjectURL = () => 'blob:test'; HTMLAnchorElement.prototype.click = function () {};
      try { exportDiary(); } finally { window.Blob = AltBlob; URL.createObjectURL = altUrl; HTMLAnchorElement.prototype.click = altClick; }
      const zeilen = md.split('\\n').filter(z => /Dünger:/.test(z));
      return JSON.stringify({ zeilen: zeilen.length, mitRohId: zeilen.filter(z => /\\bp\\d{10,}_\\d+\\b/.test(z)).length, beispiel: zeilen.find(z => /\\bp\\d{10,}_\\d+\\b/.test(z)) || zeilen[0] || '' });
    })()`));
    console.log('    ' + r.zeilen + ' Dünger-Zeilen, davon mit roher Produkt-ID: ' + r.mitRohId);
    // Einträge, deren Plan es nicht mehr gibt (Patricks Mai-Einträge), dürfen roh bleiben; Juli-Einträge
    // von V3.4.7 müssen Namen tragen — V3.4.7 ist nicht aufgeschlagen.
    const julizeile = r.beispiel;
    pruef('Export der Juli-Dosen von V3.4.7 nennt POWHUMUS beim Namen', E(`(function(){
      let md = ''; const AltBlob = window.Blob; window.Blob = function (t, o) { md = t.join(''); return new AltBlob(t, o); };
      const u = URL.createObjectURL, k = HTMLAnchorElement.prototype.click; URL.createObjectURL = () => 'x'; HTMLAnchorElement.prototype.click = function () {};
      try { exportDiary(); } finally { window.Blob = AltBlob; URL.createObjectURL = u; HTMLAnchorElement.prototype.click = k; }
      return /POWHUMUS \\d/.test(md);
    })()`) === true, julizeile.slice(0, 140));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
