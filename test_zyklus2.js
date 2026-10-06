/**
 * Ein zweiter Zyklus neben einem abgeschlossenen (Run 02 neben Run 01, 06.10.2026).
 *
 * Beim Durchspielen von Patricks Weg — Run 01 geerntet und im Curing, Run 02 mit sechs Automatics in zwei
 * Gruppen frisch angelegt — fanden die Prüfer mehrere Fehler, die nur mit zwei Zyklen oder direkt nach dem
 * Anlegen auftreten. Jeder Abschnitt gehört zu einer Version; jede Prüfung stellt zuerst die Lage her, in der
 * der Fehler auftrat.
 *
 * Lädt Patricks Sicherung vom 04.09. und stellt den Stand vom 06.10. nach: alle stehenden Pflanzen am 09.09.
 * geerntet, Datum fest auf den 06.10.2026.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, process.env.GS_INDEX || 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const HEUTE = '2026-10-06';

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

/** Run 01 so, wie er am 06.10. auf dem Handy steht: alle noch stehenden Pflanzen am 09.09. geerntet. */
function standOktober(st) {
  const c = st.cycles[0];
  (c.plants || []).forEach(p => { if (!p.harvestedAt) p.harvestedAt = '2026-09-09'; });
  return st;
}

async function load(mut, opts = {}) {
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
      if (opts.roh) { w.localStorage.setItem('growsmart_v4', opts.roh); return; }
      const st = standOktober(JSON.parse(BACKUP));
      if (mut) mut(st);
      w.localStorage.setItem('growsmart_v4', JSON.stringify(st));
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 80));
  const E = (s) => window.eval(s);
  E(`setDebugDate('${opts.datum || HEUTE}')`);
  return { window, errors, E, get: (k) => window.localStorage.getItem(k) };
}

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + JSON.stringify(info) : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  // ===== A: Pflanzenzahl springt nicht mehr auf 1 (v1.5.298) =====
  console.log('\nA - Pflanzenliste eines neuen Zyklus');
  {
    const a = await load();
    pruef('A0 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    a.E("addCyc({ name: 'Sechs', plantCount: 6, startDate: '2026-09-20' })");
    const sechs = "S.cycles.find(c => c.name === 'Sechs')";
    pruef('A1 ein neuer Zyklus mit 6 Pflanzen hat sofort 6 Pflanzen in der Liste',
      a.E(`(${sechs}.plants||[]).length`) === 6 && a.E(`${sechs}.plantCount`) === 6, a.E(`(${sechs}.plants||[]).length`));
    pruef('A2 die App rechnet mit 6', a.E(`getEffectivePlantCount(${sechs}, todayISO())`) === 6);
    a.E("addCyc({ name: 'Eine' })");
    pruef('A3 ohne Angabe: eine Pflanze in der Liste', a.E("S.cycles.find(c => c.name === 'Eine').plants.length") === 1);

    // Der gemessene Fehlerweg: Zahl 6, aber (noch) keine Liste — wie ein Zyklus aus einer älteren Version
    a.E(`(() => { const c = ${sechs}; delete c.plants; c.plantCount = 6; selId = c.id; draft = { ...c }; })()`);
    a.E(`_addPlantFromSettings(${sechs}.id)`);
    pruef('A4 „Pflanze mit Strain-Name hinzufügen" ohne Liste: 6 Pflanzen statt 1',
      a.E(`${sechs}.plants.length`) === 6 && a.E(`${sechs}.plantCount`) === 6, { n: a.E(`${sechs}.plants.length`), pc: a.E(`${sechs}.plantCount`) });
    pruef('A5 der Zähler im Entwurf zieht mit', a.E('draft.plantCount') === 6);

    // Zähler im Entwurf auf 6, noch nicht gesichert, Liste hat 1 Pflanze → der Tipp benennt die 6
    const eine = "S.cycles.find(c => c.name === 'Eine')";
    a.E(`(() => { const c = ${eine}; selId = c.id; draft = { ...c }; draft.plantCount = 6; draftTouched.plantCount = true; S._setUI = {}; })()`);
    a.E(`_addPlantFromSettings(${eine}.id)`);
    pruef('A6 ungesicherter Zähler 6: der Tipp legt die fehlenden an, statt eine siebte',
      a.E(`${eine}.plants.length`) === 6, a.E(`${eine}.plants.length`));
    pruef('A7 und klappt die Liste zum Benennen auf', a.E('S._setUI.plants') === true);
    a.E(`_addPlantFromSettings(${eine}.id)`);
    pruef('A8 ein weiterer Tipp legt wirklich eine weitere an (7)', a.E(`${eine}.plants.length`) === 7);

    // Sichern ohne Liste
    a.E(`(() => { const c = ${sechs}; delete c.plants; c.plantCount = 1; selId = c.id; draft = { ...c }; draft.plantCount = 4; draftTouched.plantCount = true; })()`);
    await a.E('saveDraft()');
    pruef('A9 Sichern mit Zähler 4 und ohne Liste: 4 Pflanzen', a.E(`${sechs}.plants.length`) === 4 && a.E(`${sechs}.plantCount`) === 4,
      { n: a.E(`(${sechs}.plants||[]).length`), pc: a.E(`${sechs}.plantCount`) });

    // Einstellungen zeigen für 6 Pflanzen den Editor, nicht den Hinweis
    a.E("addCyc({ name: 'Editor', plantCount: 6 })");
    a.E("selId = S.cycles.find(c => c.name === 'Editor').id; draft = { ...S.cycles.find(c => c.name === 'Editor') }; S._setUI = { cyc_basics: true, b_plants: true }; renderSet()");
    const set = a.window.document.getElementById('set-body')?.textContent || '';
    if (process.env.DBG) console.log('DBGSET ' + set.replace(/\s+/g, ' '));
    pruef('A10 Einstellungen: „Pflanzen einzeln benennen · 6" statt des Hinweises', /Pflanzen einzeln benennen\s*· 6/.test(set) && !/Pflanze mit Strain-Name hinzufügen/.test(set));
    pruef('A11 Run 01 bleibt unberührt (5 Pflanzen)', a.E('S.cycles[0].plants.length') === 5);
    pruef('A12 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== B: Die Topfgröße gehört dem Zyklus (v1.5.299) =====
  console.log('\nB - Topfgröße eines neuen Zyklus');
  {
    const a = await load();
    const vorgabe = a.E('S.potSize');
    a.E("addCyc({ name: 'Groß', potSize: 15 })");
    const gross = "S.cycles.find(c => c.name === 'Groß')";
    pruef('B1 der Zyklus rechnet mit seinen 15 L', a.E(`getPotSize(${gross})`) === 15);
    pruef('B2 und hat sie selbst gespeichert', a.E(`${gross}.potSize`) === 15);
    pruef('B3 die allgemeine Vorgabe bleibt, wie sie war', a.E('S.potSize') === vorgabe, { vorher: vorgabe, nachher: a.E('S.potSize') });
    a.E("addCyc({ name: 'Klein', potSize: 11 })");
    pruef('B4 ein danach angelegter 11-L-Zyklus ändert die 15 L nicht', a.E(`getPotSize(${gross})`) === 15, a.E(`getPotSize(${gross})`));
    a.E("addCyc({ name: 'Ohne' })");
    pruef('B5 ohne Angabe: die Vorgabe wird am Zyklus festgehalten', a.E("S.cycles.find(c => c.name === 'Ohne').potSize") === vorgabe);
    pruef('B6 Run 01 behält seinen Topf', a.E('getPotSize(S.cycles[0])') === 11);
    pruef('B7 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  if (fail) process.exit(1);
})().catch((e) => { console.log('FEHLER: ' + (e && e.stack || e)); process.exit(1); });
