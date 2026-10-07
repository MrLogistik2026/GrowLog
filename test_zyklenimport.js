/**
 * Zyklus-Datei: Import fügt Zyklen hinzu, statt den Stand zu ersetzen (v1.5.337, 07.10.2026).
 *
 * Prüft mit Patricks Sicherung als bestehendem Stand: was dazukommt, was unverändert bleibt, dass nichts doppelt
 * entsteht, dass jeder ungültige Wert die ganze Datei ablehnt, dass bei gesperrtem oder scheiterndem Speichern nichts
 * nur im Arbeitsspeicher landet, und dass ↩ den ganzen Import in einem Schritt zurücknimmt.
 * Bewusst neutrale Pflanzennamen — echte Bezeichnungen gehören nie in einen Test.
 * Läuft über GS_INDEX auch gegen einen älteren Build und fällt dort um.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, process.env.GS_INDEX || 'index.html'), 'utf8');
const SICHERUNG = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const SK = 'growsmart_v4';
const HEUTE = '2026-10-07';

function fakeCtx() {
  const noop = () => {};
  return new Proxy({}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 0 }) : (k === 'createLinearGradient' || k === 'createRadialGradient') ? () => ({ addColorStop: noop }) : (k === 'getImageData' ? () => ({ data: [] }) : noop)) });
}

async function load(opts = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { const m = String((e && e.message) || e); if (!/Not implemented/i.test(m)) errors.push(m); });
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.localStorage.setItem(SK, SICHERUNG);
      w.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      const orig = w.Storage.prototype.setItem;
      w.Storage.prototype.setItem = function (k, v) { if (k === SK && w.__kaputt) { const e = new Error('kaputt'); throw e; } return orig.call(this, k, v); };
    },
  });
  const w = dom.window;
  await new Promise((r) => setTimeout(r, 1200));
  const E = (s) => w.eval(s);
  E(`setDebugDate('${HEUTE}')`);
  const dialoge = [], toasts = [];
  w.customConfirm = (t, m) => { dialoge.push(String(t) + '\n' + String(m)); return Promise.resolve(opts.antwort !== false); };
  w.toast = (t) => toasts.push(String(t));
  // Wie Patrick: Run 01 abschließen, bevor Run 02 kommt
  E("(() => { const c = S.cycles[0]; c.archived = true; c.active = false; c.endDate = '2026-09-06'; saveS._lastUndo = 0; saveS(); })()");
  return { w, E, errors, dialoge, toasts, laden: (p) => (w.eval("typeof _zyklenPaketLaden === 'function'") ? w.eval('_zyklenPaketLaden')(JSON.parse(JSON.stringify(p))) : Promise.resolve('fehlt')) };
}

const zyklus = (name, start, n, notizen) => ({
  name, startDate: start, seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 15, anzuchtDays: 26, bloomDays: 70,
  startMethod: 'direct', germMethod: 'water', lightVeg: '20/4', lightBloom: '20/4', fertPreset: 'rainbow_auto', strain: 'Sorte X',
  pflanzen: Array.from({ length: n }, (_, i) => ({ label: `${name} Pflanze ${i + 1}`, strain: 'Sorte X' })), notizen: notizen || {},
});
const PAKET = { _type: 'growsmart_zyklen', version: 1, paketId: 'test-paket', zyklen: [
  zyklus('Gruppe A', '2026-09-20', 4, { '2026-09-21': 'Gesät.', '2026-09-25': 'Durchgebrochen.' }),
  zyklus('Gruppe B', '2026-09-26', 2, { '2026-10-01': 'Durchgebrochen.' }),
] };

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + JSON.stringify(info).slice(0, 300) : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('\nZ - Hinzufügen');
  {
    const a = await load();
    const vorher = JSON.parse(a.E('JSON.stringify({ z: S.cycles.length, e: Object.keys(S.entries).length, run01: S.cycles[0], plaene: S.fertPlans.length })'));
    const r = await a.laden(PAKET);
    const s = JSON.parse(a.E('JSON.stringify(S)'));
    const A = s.cycles.find(c => c.name === 'Gruppe A'), B = s.cycles.find(c => c.name === 'Gruppe B');
    pruef('Z1 zwei Zyklen dazu, Run 01 unverändert', r === true && s.cycles.length === vorher.z + 2 && JSON.stringify(s.cycles[0]) === JSON.stringify(vorher.run01));
    pruef('Z2 der Dialog sagt „kommen dazu", nicht „ersetzt"', a.dialoge.some(d => /Zyklen hinzufügen/.test(d) && /kommen dazu/.test(d) && !/ersetzt/.test(d)), a.dialoge);
    pruef('Z3 Einstellungen wie in der Datei', A && A.startDate === '2026-09-20' && A.anzuchtDays === 26 && A.bloomDays === 70 && A.potSize === 15 && A.medium === 'erde'
      && A.germMethod === 'water' && A.startMethod === 'direct' && A.lightVeg === '20/4' && A.plantCount === 4 && A.plants.length === 4 && B.plants.length === 2);
    pruef('Z4 Pflanzennamen und Sorten übernommen', A.plants.every((p, i) => p.label === `Gruppe A Pflanze ${i + 1}` && p.strain === 'Sorte X'));
    const plan = s.fertPlans.find(p => p.presetKey === 'rainbow_auto');
    pruef('Z5 beide am Rainbow-Plan, angelegt aus der Vorlage mit Rückgrat', plan && A.fertPlanId === plan.id && B.fertPlanId === plan.id && Array.isArray(plan.weekPhases), plan && Object.keys(plan));
    pruef('Z6 Notizen im Tagebuch, keine Messwerte', s.entries['2026-09-21'].cycleData[A.id].notes === 'Gesät.' && s.entries['2026-10-01'].cycleData[B.id].notes === 'Durchgebrochen.'
      && !Object.values(s.entries).some(e => e.cycleData && [A.id, B.id].some(id => e.cycleData[id] && (e.cycleData[id].water !== undefined || e.cycleData[id].ph !== undefined))));
    pruef('Z7 im Speicher angekommen', JSON.parse(a.w.localStorage.getItem(SK)).cycles.length === vorher.z + 2);
    pruef('Z8 Kennungen eindeutig, Herkunft vermerkt', new Set(s.cycles.map(c => c.id)).size === s.cycles.length && A.paketId === 'test-paket');
    a.toasts.length = 0;
    const r2 = await a.laden(PAKET);
    pruef('Z9 noch einmal laden: nichts doppelt, mit Hinweis', r2 === false && a.E('S.cycles.length') === vorher.z + 2 && a.toasts.some(t => /schon angelegt/.test(t)), a.toasts);
    const r3 = await a.laden({ _type: 'growsmart_zyklen', paketId: 'zweites', zyklen: [zyklus('Gruppe C', '2026-10-01', 1)] });
    pruef('Z10 ein zweites Paket nimmt den vorhandenen Rainbow-Plan, statt einen zweiten anzulegen', r3 === true && a.E("S.fertPlans.filter(p => p.presetKey === 'rainbow_auto').length") === 1);
    a.E('doUndo()');
    pruef('Z11 ↩ nimmt einen Import in einem Schritt zurück', !a.E("S.cycles.some(c => c.name === 'Gruppe C')") && a.E("S.cycles.some(c => c.name === 'Gruppe A')"));
    pruef('Z12 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  console.log('\nU - Ungültige Dateien ändern nichts');
  {
    const a = await load();
    const vorher = a.E('JSON.stringify(S)');
    const kaputt = [
      ['Startdatum ungültig', (p) => { p.zyklen[0].startDate = '2026-02-30'; }],
      ['Substrat unbekannt', (p) => { p.zyklen[0].medium = 'sand'; }],
      ['Notiz in der Zukunft', (p) => { p.zyklen[0].notizen['2026-12-24'] = 'x'; }],
      ['Notiz vor dem Start', (p) => { p.zyklen[0].notizen['2026-09-01'] = 'x'; }],
      ['keine Pflanzen', (p) => { p.zyklen[0].pflanzen = []; }],
      ['zwei gleiche Namen', (p) => { p.zyklen[1].name = 'Gruppe A'; }],
      ['Vorlage unbekannt', (p) => { p.zyklen[0].fertPreset = 'gibtsnicht'; }],
      ['abgelöste Vorlage', (p) => { p.zyklen[0].fertPreset = 'biobizz_official'; }],
      ['Anzucht unsinnig', (p) => { p.zyklen[0].anzuchtDays = 2; }],
      ['Licht unbekannt', (p) => { p.zyklen[0].lightVeg = '25/0'; }],
      ['keine Zyklen', (p) => { p.zyklen = []; }],
    ];
    for (const [name, mach] of kaputt) {
      const p = JSON.parse(JSON.stringify(PAKET)); mach(p);
      a.toasts.length = 0;
      const r = await a.laden(p);
      pruef(`U ${name}: abgelehnt mit Grund, Stand unverändert`, r === false && a.E('JSON.stringify(S)') === vorher && a.toasts.some(t => /lässt sich nicht laden \(/.test(t) && /unverändert/.test(t)), a.toasts);
    }
  }

  console.log('\nS - Kein Hinzufügen nur im Arbeitsspeicher');
  {
    const a = await load();
    const z = a.E('S.cycles.length');
    a.E('_fremdGeschrieben = true');
    const r = await a.laden(PAKET);
    pruef('S1 kann gerade nicht gespeichert werden: nichts kommt dazu, mit Hinweis', r === false && a.E('S.cycles.length') === z && a.toasts.some(t => /kann GrowSmart nicht speichern/.test(t)), a.toasts);
    const b = await load();
    const zb = b.E('S.cycles.length');
    b.w.__kaputt = true;
    const rb = await b.laden(PAKET);
    pruef('S2 Speichern scheitert: zurückgenommen, nichts nur im Arbeitsspeicher', rb === false && b.E('S.cycles.length') === zb && !b.E("S.cycles.some(c => c.name === 'Gruppe A')"));
    b.w.__kaputt = false;
    const c = await load({ antwort: false });
    const zc = c.E('S.cycles.length');
    const rc = await c.laden(PAKET);
    pruef('S3 „Abbrechen": nichts kommt dazu', rc === false && c.E('S.cycles.length') === zc);
  }

  console.log('\nI - Der Knopf „Import" erkennt die Zyklus-Datei');
  {
    const a = await load();
    const z = a.E('S.cycles.length');
    let inp = null;
    const ce = a.w.document.createElement.bind(a.w.document);
    a.w.document.createElement = (t) => { const el = ce(t); if (t === 'input') { inp = el; el.click = () => {}; } return el; };
    a.E('importData()');
    const datei = new a.w.File([JSON.stringify(PAKET)], 'zyklen.json', { type: 'application/json' });
    await inp.onchange({ target: { files: [datei] } });
    await new Promise((r) => setTimeout(r, 300));
    pruef('I1 Import mit einer Zyklus-Datei fügt hinzu, ersetzt nicht', a.E('S.cycles.length') === z + 2 && !a.E('_neuladenAnsteht'), [a.E('S.cycles.length'), z]);
    pruef('I2 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  if (fail) process.exit(1);
  process.exit(0);
})().catch((e) => { console.log('FEHLER: ' + (e && e.stack || e)); process.exit(1); });
