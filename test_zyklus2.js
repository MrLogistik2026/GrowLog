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

  // ===== C: „Vom Plan übernehmen" hält Endspurt und Kalender einig (v1.5.300) =====
  console.log('\nC - Phasendauern vom Rainbow-Plan übernehmen');
  {
    const a = await load();
    a.window.customConfirm = () => Promise.resolve(true);
    await a.E("loadPreset('rainbow_auto')");
    const planId = a.E("(S.fertPlans.find(p => p.presetKey === 'rainbow_auto') || {}).id");
    a.E(`addCyc({ name: 'R', startDate: '2026-09-20', potSize: 15, plantCount: 4, fertPlanId: '${planId}' })`);
    const r = "S.cycles.find(c => c.name === 'R')";
    a.E(`${r}.bloomDays = 70; ${r}.anzuchtDays = 21`);
    const vorher = a.E(`JSON.stringify(planSkeletonDiff(${r}))`);
    pruef('C1 der Vergleich nennt die echte Spüldauer (5 Spültage + 3 Hard-Dryback = 8)', JSON.parse(vorher).ist.flushDays === 8, vorher);
    await a.E(`applyPlanSkeleton(${r}.id)`);
    const kalErnte = a.E(`(() => { const c = ${r}; for (let d = 0; d < 200; d++) { const iso = isoPlus(c.startDate, d); const p = phase(iso, c); if (p && p.ph === 'harvest') return d + 1; } return null; })()`);
    const esErnte = a.E(`endspurtState(${r}, todayISO()).ernteTag`);
    pruef('C2 nach dem Übernehmen: Endspurt und Kalender nennen denselben Erntetag', kalErnte === esErnte && esErnte > 0, { kalErnte, esErnte });
    pruef('C3 die Plan-Dauer 7 liegt auf den Spültagen (4 + 3 Hard-Dryback)', a.E(`flushWetDays(${r})`) === 4 && a.E(`iceDryDays(${r})`) === 3 && a.E(`${r}.flushDays`) === 7,
      { nass: a.E(`flushWetDays(${r})`), dry: a.E(`iceDryDays(${r})`), fd: a.E(`${r}.flushDays`) });
    a.E(`_syncFlushPhase(${r})`);
    pruef('C4 ein späterer Abgleich stellt nichts still zurück', a.E(`${r}.flushDays`) === 7 && a.E(`endspurtState(${r}, todayISO()).ernteTag`) === esErnte);
    pruef('C5 danach meldet der Vergleich keine Spül-Abweichung mehr', !a.E(`planSkeletonDiff(${r}).felder.includes('flushDays')`));
    pruef('C6 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== D: Der Vorlauf bis zum Keimling gehört vor Plan-Woche 1 (v1.5.301) =====
  console.log('\nD - Plan-Wochen der Anzucht mit Vorlauf bis zum Sprout');
  {
    const a = await load();
    a.window.customConfirm = () => Promise.resolve(true);
    await a.E("loadPreset('rainbow_auto')");
    const planId = a.E("(S.fertPlans.find(p => p.presetKey === 'rainbow_auto') || {}).id");
    // Anesia-Gruppe: eingeweicht 20.09., Keimling 25.09. → 5 Tage Vorlauf, Anzucht 21 + 5 = 26 (Rainbow-Blatt)
    a.E(`addCyc({ name: 'Anesia', startDate: '2026-09-20', potSize: 15, plantCount: 4, fertPlanId: '${planId}' })`);
    a.E(`addCyc({ name: 'Mimosa', startDate: '2026-09-26', potSize: 15, plantCount: 2, fertPlanId: '${planId}' })`);
    const an = "S.cycles.find(c => c.name === 'Anesia')", mi = "S.cycles.find(c => c.name === 'Mimosa')";
    a.E(`[${an}, ${mi}].forEach(c => { c.anzuchtDays = 26; c.bloomDays = 70; })`);
    const b = a.E(`JSON.stringify(planWeekBounds(${an}).slice(0, 3))`);
    pruef('D1 Anzucht 26: Woche 1 trägt die 5 Tage bis zum Keimling (Grenzen 12 · 19 · 26)', b === '[12,19,26]', b);
    const w = (z, iso) => a.E(`fertPlanWeek(${z}, '${iso}')`);
    pruef('D2 Anesia: Woche 2 ab 02.10., Woche 3 ab 09.10., Woche 4 ab 16.10. — wie die Stammdaten',
      w(an, '2026-10-01') === 1 && w(an, '2026-10-02') === 2 && w(an, '2026-10-08') === 2 && w(an, '2026-10-09') === 3 && w(an, '2026-10-16') === 4,
      ['10-01', '10-02', '10-08', '10-09', '10-16'].map(d => w(an, '2026-' + d)));
    pruef('D3 Mimosa: Woche 2 ab 08.10., Woche 3 ab 15.10., Woche 4 ab 22.10.',
      w(mi, '2026-10-07') === 1 && w(mi, '2026-10-08') === 2 && w(mi, '2026-10-15') === 3 && w(mi, '2026-10-22') === 4,
      ['10-07', '10-08', '10-15', '10-22'].map(d => w(mi, '2026-' + d)));
    const df = JSON.parse(a.E(`JSON.stringify(planSkeletonDiff(${an}))`));
    pruef('D4 der Vergleich nennt die 26 nicht als Abweichung, sondern als 5 Tage Vorlauf', !df.felder.includes('anzuchtDays') && df.vorlauf === 5, df);
    a.E(`${an}.anzuchtDays = 21`);
    pruef('D5 Anzucht wie der Plan (21): gleichmäßig wie bisher (7 · 14 · 21)', a.E(`JSON.stringify(planWeekBounds(${an}).slice(0, 3))`) === '[7,14,21]');
    a.E(`${an}.anzuchtDays = 35`);
    const df35 = JSON.parse(a.E(`JSON.stringify(planSkeletonDiff(${an}))`));
    pruef('D6 14 Tage mehr sind kein Vorlauf mehr: gleichmäßig verteilt und als Abweichung genannt',
      a.E(`JSON.stringify(planWeekBounds(${an}).slice(0, 3))`) === '[12,23,35]' && df35.felder.includes('anzuchtDays'), df35);
    a.E(`${an}.anzuchtDays = 18`);
    pruef('D7 weniger Anzucht als der Plan bleibt eine Abweichung', a.E(`planSkeletonDiff(${an}).felder.includes('anzuchtDays')`));
    pruef('D8 Run 01 (Plan ohne Gerüst) bleibt unverändert', a.E('_keimVorlauf(S.cycles[0], getPlanForCycle(S.cycles[0]))') === 0);
    pruef('D9 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== E: Rainbow-Vorlage auf Blatt v2.1, unveränderte Kopien mitgehoben (v1.5.302) =====
  console.log('\nE - Rainbow-Vorlage und gespeicherte Kopien');
    // Eine Kopie, wie v1.5.297 sie beim Laden der Vorlage anlegte (Wochenplan v1.0, mit Alfa Boost)
    const V10 = {
      1:  {'CalMag':0.3,'POWHUMUS':2.5,'Alg-A-Mic':2.0},
      2:  {'Silica Force':0.3,'CalMag':0.4,'Epsom Salz':0.15,'POWHUMUS':2.5,'Bio-Grow':0.25,'Advanced Amino':0.15,'Alg-A-Mic':2.0},
      3:  {'Silica Force':0.4,'CalMag':0.5,'Epsom Salz':0.2,'POWHUMUS':2.5,'Bio-Grow':0.6,'Advanced Amino':0.2,'Alg-A-Mic':2.0},
      4:  {'Silica Force':0.5,'CalMag':0.8,'Epsom Salz':0.25,'POWHUMUS':2.5,'Bio-Grow':1.0,'Advanced Amino':0.2,'Alg-A-Mic':2.0},
      5:  {'Silica Force':0.5,'CalMag':0.8,'Epsom Salz':0.25,'POWHUMUS':2.5,'Bio-Grow':1.0,'Advanced Amino':0.2,'Alg-A-Mic':2.0},
      6:  {'Silica Force':0.5,'CalMag':0.8,'Epsom Salz':0.25,'POWHUMUS':2.5,'Bio-Grow':0.75,'Bio-Bloom':0.75,'Advanced Amino':0.2,'Alg-A-Mic':2.0},
      7:  {'Silica Force':0.5,'CalMag':0.8,'Epsom Salz':0.25,'POWHUMUS':2.5,'Bio-Grow':0.5,'Bio-Bloom':0.9,'Advanced Amino':0.2,'Alg-A-Mic':2.0},
      8:  {'Silica Force':0.5,'CalMag':0.8,'Epsom Salz':0.25,'POWHUMUS':2.5,'Bio-Grow':0.3,'Bio-Bloom':1.05,'Alg-A-Mic':2.0},
      9:  {'Silica Force':0.5,'CalMag':0.8,'Epsom Salz':0.25,'POWHUMUS':2.5,'Bio-Grow':0.3,'Bio-Bloom':1.2,'Alg-A-Mic':2.0},
      10: {'Silica Force':0.5,'CalMag':0.8,'Epsom Salz':0.25,'POWHUMUS':2.5,'Bio-Grow':0.3,'Bio-Bloom':1.2,'Alg-A-Mic':2.0},
      11: {'Silica Force':0.5,'CalMag':0.8,'Epsom Salz':0.25,'POWHUMUS':2.5,'Bio-Grow':0.3,'Bio-Bloom':1.2,'Alg-A-Mic':3.0},
      12: {'Silica Force':0.5,'CalMag':0.8,'Epsom Salz':0.25,'POWHUMUS':2.5,'Bio-Grow':0.3,'Bio-Bloom':1.2,'Alg-A-Mic':3.0},
      13: {'CalMag':0.5,'Epsom Salz':0.2,'Bio-Bloom':0.5}, 14: {}, 15: {},
    };
    const NAMEN = ['Silica Force','CalMag','Epsom Salz','POWHUMUS','Bio-Grow','Bio-Bloom','Alg-A-Mic','Alfa Boost','Advanced Amino'];
    const kopie = (anpassen) => (st) => {
      const products = NAMEN.map((n, i) => ({ id: 'rb' + i, name: n, unit: n === 'Epsom Salz' ? 'g/L' : 'ml/L', color: '#888', note: 'alt' }));
      const id = {}; products.forEach(p => { id[p.name] = p.id; });
      const schedule = {};
      Object.entries(V10).forEach(([w, d]) => { const m = {}; Object.entries(d).forEach(([n, v]) => { m[id[n]] = v; }); schedule['w' + w] = m; });
      st.fertPlans.push({ id: 'fp_rb', name: 'Rainbow Düngeplan (v1.0)', presetKey: 'rainbow_auto', products, schedule,
        mixOrder: NAMEN.slice(), mixInfo: 'alt', drainInfo: 'alt' });
      delete st._rainbowV21;
      if (anpassen) anpassen(st, id);
    };
    const lies = (a) => JSON.parse(a.E(`(() => { const p = S.fertPlans.find(x => x.id === 'fp_rb'); const n = {}; p.products.forEach(x => { n[x.id] = x.name; });
      const w = {}; Object.entries(p.schedule).forEach(([k, d]) => { const o = {}; Object.entries(d).forEach(([i, v]) => { o[n[i]] = v; }); w[k.slice(1)] = o; });
      return JSON.stringify({ name: p.name, produkte: p.products.map(x => x.name), w, gehoben: p._gehobenAuf || null, mix: p.mixOrder }); })()`));
    const vorlage = (a) => JSON.parse(a.E('JSON.stringify(FERT_PRESETS.rainbow_auto.schedule)'));
    const gleich = (x, y) => JSON.stringify(Object.keys(x).sort().map(k => [k, x[k]])) === JSON.stringify(Object.keys(y).sort().map(k => [k, y[k]]));
  {

    const a = await load(kopie());
    pruef('E0 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    const v = vorlage(a), r = lies(a);
    const alleWochen = Object.keys(v).every(w => gleich(r.w[w] || {}, v[w]));
    pruef('E1 eine unverändert übernommene v1.0-Kopie trägt danach die Dosen von Blatt v2.1', alleWochen, r.w);
    pruef('E2 CalMag Woche 4 jetzt 0,3, Epsom 0,15, Bio-Grow Woche 8 0,75, Alg-A-Mic Woche 11 2',
      r.w[4]['CalMag'] === 0.3 && r.w[4]['Epsom Salz'] === 0.15 && r.w[8]['Bio-Grow'] === 0.75 && r.w[11]['Alg-A-Mic'] === 2);
    pruef('E3 Alfa Boost ist weg (kein Eintrag zeigte darauf)', !r.produkte.includes('Alfa Boost') && !r.mix.includes('Alfa Boost'), r.produkte);
    pruef('E4 Name und Hinweis: „Rainbow Düngeplan (v2.1)", gehoben am 06.10.', r.name === 'Rainbow Düngeplan (v2.1)' && r.gehoben && r.gehoben.blatt === 'v2.1', r);
    a.E("switchFertPlan && switchFertPlan('fp_rb')");
    a.E("renderDuenger()");
    const scr = a.window.document.getElementById('scr-duenger')?.textContent || '';
    pruef('E5 der Düngeplan sagt es: „auf dein Plan-Blatt v2.1 gebracht"', /auf dein Plan-Blatt v2\.1 gebracht/.test(scr));
    pruef('E6 die Vorlage selbst: 8 Produkte, kein Alfa Boost, EC Woche 4 0,65–0,8',
      a.E("FERT_PRESETS.rainbow_auto.products.length") === 8 && a.E("FERT_PRESETS.rainbow_auto.ecTargets[4].min") === 0.65 && a.E("FERT_PRESETS.rainbow_auto.ecTargets[4].max") === 0.8);
    // Nochmal starten: nichts ändert sich
    const roh = a.get('growsmart_v4');
    const b = await load(null, { roh });
    pruef('E7 beim nächsten Start bleibt alles, wie es ist', JSON.stringify(lies(b)) === JSON.stringify(r));

    // Selbst geänderte Dose: Kopie bleibt seine
    const c = await load(kopie((st, id) => { st.fertPlans.find(p => p.id === 'fp_rb').schedule.w9[id['Bio-Bloom']] = 1.35; }));
    const rc = lies(c);
    pruef('E8 eine Kopie mit eigener Dosis (Ceiling 1,35) wird nicht angefasst', rc.name === 'Rainbow Düngeplan (v1.0)' && rc.w[9]['Bio-Bloom'] === 1.35 && rc.w[4]['CalMag'] === 0.8 && !rc.gehoben, rc.name);

    // Alfa Boost mit Misch-Häkchen in einem Eintrag: Dosen gehoben, Produkt bleibt
    const d = await load(kopie((st, id) => {
      const iso = '2026-10-01'; st.entries[iso] = st.entries[iso] || {}; st.entries[iso].cycleData = st.entries[iso].cycleData || {};
      st.entries[iso].cycleData[st.cycles[0].id] = { mixChecks: { [id['Alfa Boost']]: true } };
    }));
    const rd = lies(d);
    pruef('E9 zeigt ein Eintrag auf Alfa Boost, bleibt das Produkt — die Dosen kommen trotzdem vom Blatt', rd.produkte.includes('Alfa Boost') && rd.w[4]['CalMag'] === 0.3, rd.produkte);
    pruef('E10 keine JS-Fehler', a.errors.length + b.errors.length + c.errors.length + d.errors.length === 0, [a.errors[0], b.errors[0], c.errors[0], d.errors[0]]);
  }

  // ===== F: Das Klima richtet sich nach dem Zyklus, dessen Pflanzen noch stehen (v1.5.303) =====
  console.log('\nF - Klima-Bewertung mit einem Zyklus im Curing davor');
  {
    const a = await load();
    // Run 02 in der Blüte (Start 20.07., Anzucht 26 → am 06.10. Blütetag 53), Run 01 im Curing davor in der Liste
    a.E("addCyc({ name: 'Blüte', startDate: '2026-07-20', potSize: 15, plantCount: 4 }); (() => { const c = S.cycles.find(x => x.name === 'Blüte'); c.anzuchtDays = 26; c.bloomDays = 70; })()");
    pruef('F0 Lage: Run 01 steht vorn und ist im Curing, der neue Zyklus in der Blüte',
      a.E("active()[0].id === S.cycles[0].id && phase(todayISO(), S.cycles[0]).ph") === 'cure' && a.E("phase(todayISO(), S.cycles.find(x => x.name === 'Blüte')).ph") === 'bloom');
    const k = a.E("JSON.stringify(_klimaEntryTeile('22', '75', active(), todayISO()))");
    pruef('F1 bei 22 °C / 75 % warnt der Eintrag vor Schimmel (Deckel der Blüte)', /Schimmel/i.test(k), k.slice(0, 300));
    pruef('F2 die Bewertung läuft nach dem Zyklus in der Blüte', a.E("_fuehrenderZyklus(active(), todayISO()).name") === 'Blüte');
    pruef('F3 bei nur einem wachsenden Zyklus kein Zusatzsatz „Bewertet nach …"', !/Bewertet nach/.test(k));
    // Ein zweiter wachsender Zyklus (Anzucht) dazu: Bewertet wird nach dem weiter entwickelten, und es steht dabei
    a.E("addCyc({ name: 'Keimling', startDate: '2026-09-26', potSize: 15, plantCount: 2 })");
    const k2 = a.E("JSON.stringify(_klimaEntryTeile('22', '75', active(), todayISO()))");
    pruef('F4 mit Keimling und Blüte im Zelt: nach der Blüte bewertet, und der Satz sagt es', /Schimmel/i.test(k2) && /Bewertet nach „Blüte“/.test(k2), k2.slice(0, 300));
    // Nach dem Curing (07.10.) gibt es für Run 01 keine Phase mehr — die Bewertung bleibt
    a.E("setDebugDate('2026-10-20')");
    const k3 = a.E("JSON.stringify(_klimaEntryTeile('22', '75', active(), todayISO()))");
    pruef('F5 auch nach dem Ende des Curings von Run 01 wird bewertet', /Schimmel/i.test(k3), k3.slice(0, 200));
    // Nur ein Zyklus im Trocknen: wie bisher dessen Klima (kein Zwang zu einer wachsenden Pflanze)
    const b = await load(null, { datum: '2026-09-12' });
    pruef('F6 nur Run 01 im Trocknen: es bleibt bei Run 01', b.E("_fuehrenderZyklus(active(), todayISO()).id === S.cycles[0].id"));
    a.E("renderTips()");
    pruef('F7 keine JS-Fehler (Eintrag und Tipps)', a.errors.length + b.errors.length === 0, a.errors[0] || b.errors[0]);
  }

  // ===== G: Die Zeile „N/6 eingetragen" zählt die Zyklen mit stehenden Pflanzen (v1.5.304) =====
  console.log('\nG - Statuszeile im Eintrag mit Run 01 im Curing davor');
  {
    const TAG = '2026-10-08';
    const a = await load(null, { datum: TAG });
    a.E("addCyc({ name: 'Anesia', startDate: '2026-09-20', potSize: 15, plantCount: 4, startMethod: 'direct' }); S.cycles.find(x => x.name === 'Anesia').anzuchtDays = 26");
    const an = a.E("S.cycles.find(x => x.name === 'Anesia').id");
    pruef('G0 Lage: am 08.10. ist für die Anesia-Gruppe Gießtag', a.E(`gussFaellig(S.cycles.find(x => x.id === '${an}'), '${TAG}')`) === true);
    const zeile = () => {
      a.E(`editISO = '${TAG}'; renderEntry('${TAG}')`);
      const body = a.window.document.getElementById('entry-body');
      const txt = (body?.textContent || '').replace(/\s+/g, ' ');
      const m = txt.match(/(\d)\/6 eingetragen/);
      const knopf = Array.from(body?.querySelectorAll('button') || []).find(b => /jumpToEntryField\('[^']+','water'\)/.test(b.getAttribute('onclick') || ''));
      return { n: m ? +m[1] : null, wasserZiel: knopf ? (knopf.getAttribute('onclick').match(/jumpToEntryField\('([^']+)'/) || [])[1] : null };
    };
    a.E(`(() => { editISO = '${TAG}'; ensE('${an}'); S.entries['${TAG}'].cycleData['${an}'].water = 2100; saveS(); })()`);
    const z1 = zeile();
    pruef('G1 nach dem Guss für Run 02: „1/6 eingetragen" statt „0/6"', z1.n === 1, z1);
    a.E("addCyc({ name: 'Mimosa', startDate: '2026-09-26', potSize: 15, plantCount: 2, startMethod: 'direct' }); S.cycles.find(x => x.name === 'Mimosa').anzuchtDays = 26");
    const mi = a.E("S.cycles.find(x => x.name === 'Mimosa').id");
    const due = a.E(`gussFaellig(S.cycles.find(x => x.id === '${mi}'), '${TAG}')`);
    const z2 = zeile();
    pruef('G2 zweite Gruppe mit Guss heute, noch ohne Wasser: Wasser offen, der Sprung führt zu ihr',
      due ? (z2.n === 0 && z2.wasserZiel === mi) : true, { due, z2, mi });
    a.E(`(() => { editISO = '${TAG}'; ensE('${mi}'); S.entries['${TAG}'].cycleData['${mi}'].water = 700; saveS(); })()`);
    const z3 = zeile();
    pruef('G3 beide Gruppen gegossen: Wasser erledigt', z3.n === 1, z3);
    pruef('G4 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== H: Der Gieß-Fahrplan zeigt den Zyklus mit stehenden Pflanzen und nennt ihn (v1.5.305) =====
  console.log('\nH - Gieß-Fahrplan nach dem App-Start');
  {
    const neu = (st) => {
      const vorlage = JSON.parse(JSON.stringify(st.cycles[0]));
      const z = (name, start, n) => Object.assign({}, vorlage, { id: 'z_' + name, name, startDate: start, anzuchtDays: 26, bloomDays: 70,
        plants: Array.from({ length: n }, (_, i) => ({ id: 'p_' + name + i, label: 'Pflanze ' + (i + 1), strain: '', color: '', addedAt: start, notes: '' })),
        plantCount: n, potSize: 15, offsetHistory: [], skippedDays: [], toppingDate: null, trainings: [] });
      st.cycles.push(z('Anesia', '2026-09-20', 4), z('Mimosa', '2026-09-26', 2));
    };
    const a = await load(neu);
    const text = () => { a.E("goTo('gussplan')"); return (a.window.document.getElementById('gussplan-body')?.textContent || '').replace(/\s+/g, ' '); };
    pruef('H0 Lage: nach dem Start ist in den Einstellungen Run 01 gewählt', a.E('selId === null || selId === S.cycles[0].id'));
    const t1 = text();
    pruef('H1 der Fahrplan zeigt die Anesia-Gruppe, nicht Run 01 im Curing', a.E('gussplanActiveCycle().name') === 'Anesia' && !/Curing läuft/.test(t1), t1.slice(0, 160));
    pruef('H2 und nennt die Zyklen zum Wechseln', /Anesia/.test(t1) && /Mimosa/.test(t1) && /Sensi Amnesia/.test(t1));
    a.E("_gussplanZyklusId = 'z_Mimosa'");
    pruef('H3 ein Tipp auf „Mimosa" wechselt', a.E('gussplanActiveCycle().name') === 'Mimosa' && /Mimosa/.test(text()));
    a.E("_gussplanZyklusId = null; selId = 'z_Mimosa'");
    pruef('H4 in den Einstellungen gewählt und noch wachsend: der gilt', a.E('gussplanActiveCycle().name') === 'Mimosa');
    a.E("_gussplanZyklusId = null; selId = S.cycles[0].id; S.cycles[0].archived = true; S.cycles[0].active = false");
    pruef('H5 Run 01 archiviert und noch in den Einstellungen gewählt: trotzdem Anesia', a.E('gussplanActiveCycle().name') === 'Anesia');
    const b = await load();
    const tb = (() => { b.E("goTo('gussplan')"); return (b.window.document.getElementById('gussplan-body')?.textContent || ''); })();
    pruef('H6 mit nur einem Zyklus keine Wahl-Leiste', !/aria-label="Zyklus wählen"/.test(b.window.document.getElementById('gussplan-body')?.innerHTML || '') && tb.length > 0);
    // Startseite, Einsteiger, ruhiger Tag: der nächste Gießtag kommt von den wachsenden Zyklen
    a.E("S.cycles[0].archived = false; S.cycles[0].active = true; S.beginnerMode = true; renderDash()");
    const dash = (a.window.document.getElementById('dash-body')?.textContent || '').replace(/\s+/g, ' ');
    pruef('H7 Startseite (Einsteiger, ruhiger Tag): „Nächster Gießtag: in 2 Tagen" statt „Beobachten"',
      /Nächster Gießtag: in 2 Tagen/.test(dash) && !/Beobachten, ggf\. Foto machen/.test(dash), dash.slice(0, 240));
    pruef('H8 keine JS-Fehler', a.errors.length + b.errors.length === 0, a.errors[0] || b.errors[0]);
  }

  // ===== I: Nachgetragene Plan-Dosen sind als Vorschlag gekennzeichnet (v1.5.306) =====
  console.log('\nI - Nachtragen: Dünger-Dosen als Vorschlag');
  {
    const a = await load();
    a.window.customConfirm = () => Promise.resolve(true);
    await a.E("loadPreset('rainbow_auto')");
    const planId = a.E("(S.fertPlans.find(p => p.presetKey === 'rainbow_auto') || {}).id");
    a.E(`addCyc({ name: 'N', startDate: '2026-09-20', potSize: 15, plantCount: 4, startMethod: 'direct', fertPlanId: '${planId}' }); S.cycles.find(x => x.name === 'N').anzuchtDays = 26`);
    const cid = a.E("S.cycles.find(x => x.name === 'N').id");
    a.E(`openCatchupWizard('${cid}')`);
    const iso = a.E("_catchupState && _catchupState.candidates[0] && _catchupState.candidates[0].iso");
    a.E("catchupApply('was-so')");
    const cd = JSON.parse(a.E(`JSON.stringify((S.entries['${iso}'] || {}).cycleData['${cid}'] || {})`));
    const mitDosis = Object.keys(cd.doses || {}).filter(k => parseFloat(cd.doses[k]) > 0);
    pruef('I1 „War ungefähr so": jede übernommene Plan-Dosis ist als Vorschlag gekennzeichnet',
      mitDosis.length > 0 && mitDosis.every(k => cd._suggestedDoses && cd._suggestedDoses[k]), { iso, mitDosis, sd: cd._suggestedDoses });
    const bil = JSON.parse(a.E(`JSON.stringify(calcCycleConsumption(S.cycles.find(x => x.id === '${cid}')))`));
    pruef('I2 die Dünger-Bilanz führt sie als vorgeschlagen, nicht als gegeben', bil.every(p => !p.totalMeasured) && bil.some(p => p.totalSuggested > 0),
      bil.map(p => [p.name, p.totalMeasured, p.totalSuggested]));
    await a.E(`backfillPast('${cid}')`);
    const alle = JSON.parse(a.E(`JSON.stringify(Object.entries(S.entries).filter(([d, e]) => e.cycleData && e.cycleData['${cid}']).map(([d, e]) => e.cycleData['${cid}']))`));
    const ohneFlag = alle.filter(x => Object.keys(x.doses || {}).some(k => parseFloat(x.doses[k]) > 0 && !(x._suggestedDoses || {})[k]));
    pruef('I3 „Auto-eintragen": auch dort jede Plan-Dosis gekennzeichnet', alle.length > 1 && ohneFlag.length === 0, { tage: alle.length, ohne: ohneFlag.length });
    pruef('I4 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== J: Nachtragen schreibt keine geschätzten Messwerte (v1.5.307) =====
  console.log('\nJ - Nachtragen ohne pH und EC');
  {
    const a = await load();
    const dialoge = [];
    a.window.customConfirm = (titel, text) => { dialoge.push(titel + ' ' + text); return Promise.resolve(true); };
    await a.E("loadPreset('rainbow_auto')");
    const planId = a.E("(S.fertPlans.find(p => p.presetKey === 'rainbow_auto') || {}).id");
    a.E(`addCyc({ name: 'N', startDate: '2026-09-20', potSize: 15, plantCount: 4, startMethod: 'direct', fertPlanId: '${planId}' }); S.cycles.find(x => x.name === 'N').anzuchtDays = 26`);
    const cid = a.E("S.cycles.find(x => x.name === 'N').id");
    a.E(`openCatchupWizard('${cid}')`);
    const modal = (a.window.document.body.textContent || '').replace(/\s+/g, ' ');
    pruef('J1 der Knopf „War ungefähr so" verspricht keinen pH-Wert mehr', /pH und EC nur eintragen, wenn gemessen/.test(modal) && !/Empfohlene Werte übernehmen \(\d+ ?ml, pH/.test(modal));
    const iso = a.E("_catchupState.candidates[0].iso");
    a.E("catchupApply('was-so')");
    const cd = JSON.parse(a.E(`JSON.stringify(S.entries['${iso}'].cycleData['${cid}'])`));
    pruef('J2 „War ungefähr so": Gießmenge ja, pH und EC leer', parseFloat(cd.water) > 0 && !cd.ph && !cd.ec, { w: cd.water, ph: cd.ph, ec: cd.ec });
    await a.E(`backfillPast('${cid}')`);
    const d = dialoge.find(x => /auto-eintragen/i.test(x)) || '';
    pruef('J3 der Auto-eintragen-Dialog sagt, dass pH, EC und Klima leer bleiben', /pH, EC und Klima bleiben leer/.test(d) && !/pH \(6\.2-6\.5\)/.test(d), d.slice(0, 200));
    const alle = JSON.parse(a.E(`JSON.stringify(Object.values(S.entries).map(e => e.cycleData && e.cycleData['${cid}']).filter(Boolean))`));
    pruef('J4 kein nachgetragener Tag trägt einen pH- oder EC-Wert', alle.length > 1 && alle.every(x => !x.ph && !x.ec), alle.map(x => [x.ph, x.ec]));
    pruef('J5 die Gießmengen sind als Vorschlag gekennzeichnet', alle.filter(x => parseFloat(x.water) > 0).every(x => x._suggested && x._suggested.water));
    pruef('J6 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== K: Zyklus abschließen mit Datum (v1.5.308) =====
  console.log('\nK - Run 01 abschließen');
  {
    const a = await load();
    const run01 = a.E('S.cycles[0].id');
    a.E("renderDash()");
    const dash = (a.window.document.getElementById('dash-body')?.textContent || '').replace(/\s+/g, ' ');
    pruef('K1 im Curing bietet die Startseite das Abschließen an', /Im Curing — schon fertig\?/.test(dash), dash.slice(0, 200));
    a.E("setDebugDate('2026-10-07'); renderDash()");
    const dash2 = (a.window.document.getElementById('dash-body')?.textContent || '').replace(/\s+/g, ' ');
    pruef('K2 nach dem Curing: „✓ Fertig — alle Phasen vorbei" statt „Tag –", mit Knopf zum Abschließen',
      /✓ Fertig — alle Phasen vorbei/.test(dash2) && /Zyklus abschließen/.test(dash2) && !/· Tag –/.test(dash2), dash2.slice(0, 220));
    a.E("setDebugDate('2026-10-06')");
    // Abschließen: Vorschlag ist der letzte Eintrag, Patrick wählt den 13.09.
    let gefragt = null;
    a.window.customPrompt = (o) => { gefragt = o; return Promise.resolve('2026-09-13'); };
    await a.E(`archiveCycle('${run01}')`);
    const letzter = a.E(`Object.keys(S.entries).filter(d => d <= '2026-10-06' && S.entries[d].cycleData && S.entries[d].cycleData['${run01}']).sort().pop()`);
    pruef('K3 gefragt wird nach dem Datum, vorgeschlagen ist der letzte Eintrag', gefragt && gefragt.type === 'date' && gefragt.initial === letzter, gefragt && gefragt.initial);
    pruef('K4 abgeschlossen am 13.09.: archiviert, nicht mehr aktiv', a.E(`S.cycles[0].endDate`) === '2026-09-13' && a.E('S.cycles[0].archived') === true && a.E('S.cycles[0].active') === false);
    pruef('K5 ab dem 14.09. hat Run 01 keine Phase mehr, am 13.09. noch', a.E(`phase('2026-09-14', S.cycles[0])`) === null && !!a.E(`phase('2026-09-13', S.cycles[0])`));
    a.E("calDate = new Date(2026, 8, 15); renderCal()");
    const zellen = Array.from(a.window.document.querySelectorAll('#cal-grid > div, .cal-grid > div, #scr-cal [onclick^="openEntry"]')).map(z => (z.textContent || '').replace(/\s+/g, ' '));
    const kal = (a.window.document.getElementById('scr-cal')?.textContent || '').replace(/\s+/g, ' ');
    pruef('K6 im Kalender September: T121 (13.09.) steht noch, T122 (14.09.) und später nicht', /T121/.test(kal) && !/T122/.test(kal) && !/T138/.test(kal), kal.slice(0, 300));
    pruef('K7 Ertrag und Einträge bleiben', a.E(`Object.values(S.entries).filter(e => e.cycleData && e.cycleData['${run01}']).length`) > 100);
    a.window.customPrompt = () => Promise.resolve('2027-01-01');
    a.E(`S.cycles[0].archived = false; S.cycles[0].active = true; delete S.cycles[0].endDate`);
    await a.E(`archiveCycle('${run01}')`);
    pruef('K8 ein Datum nach heute wird nicht angenommen', !a.E('S.cycles[0].endDate') && a.E('S.cycles[0].archived') === false);
    a.window.customPrompt = () => Promise.resolve(null);
    await a.E(`archiveCycle('${run01}')`);
    pruef('K9 Abbrechen ändert nichts', !a.E('S.cycles[0].archived'));
    a.window.customPrompt = () => Promise.resolve('2026-09-13');
    await a.E(`archiveCycle('${run01}')`);
    await a.E(`unarchiveCycle('${run01}')`);
    pruef('K10 „Abschluss aufheben" nimmt auch das Datum zurück', a.E('S.cycles[0].active') === true && !a.E('S.cycles[0].endDate'));
    pruef('K11 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== L: Neuer Zyklus von der Startseite (v1.5.309) =====
  console.log('\nL - Startseite: Knopf für einen neuen Zyklus');
  {
    for (const anfaenger of [true, false]) {
      const a = await load();
      a.E(`S.beginnerMode = ${anfaenger}; renderDash()`);
      const knopf = Array.from(a.window.document.querySelectorAll('#dash-body button')).find(b => /Neuen Zyklus anlegen/.test(b.textContent));
      pruef(`L1 ${anfaenger ? 'Einsteiger' : 'Profi'}: unter „Meine Zyklen" steht „＋ Neuen Zyklus anlegen"`, !!knopf);
      if (knopf) knopf.click();
      pruef(`L2 ${anfaenger ? 'Einsteiger' : 'Profi'}: der Knopf öffnet den Assistenten`, a.window.document.getElementById('scr-wizard')?.classList.contains('active') === true);
      pruef(`L3 ${anfaenger ? 'Einsteiger' : 'Profi'}: keine JS-Fehler`, a.errors.length === 0, a.errors[0]);
    }
  }

  // ===== M: Assistent fragt die Pflanzenzahl, nennt Tag 1 richtig, bietet Rainbow an (v1.5.310) =====
  console.log('\nM - Assistent für Run 02');
  {
    const a = await load();
    a.E("openCycleWizard('dash'); Object.assign(_wizAnswers, { growType: 'indoor', medium: 'erde', seedType: 'auto', potSize: 15, startMethod: 'direct' })");
    let rainbowGesehen = false, letzter = 0;
    for (let s = 1; s <= 12; s++) {
      a.E(`_wizStep = ${s}; _renderWiz()`);
      const txt = a.window.document.getElementById('scr-wizard')?.textContent || '';
      if (/Rainbow Düngeplan \(v2\.1\)/.test(txt)) rainbowGesehen = true;
      if (/Zyklus erstellen/.test(txt)) { letzter = s; break; }
    }
    pruef('M1 der Rainbow-Plan steht unter den fertigen Plänen (Erde, drinnen)', rainbowGesehen);
    const txt = (a.window.document.getElementById('scr-wizard')?.textContent || '').replace(/\s+/g, ' ');
    pruef('M2 das Datum heißt „Keimstart (Tag 1)" und sagt, was gemeint ist', /Keimstart \(Tag 1\)/.test(txt) && /nicht der Tag, an dem der Keimling durchkommt/.test(txt) && !/Tag an dem der Samen keimt/.test(txt));
    const plus = Array.from(a.window.document.querySelectorAll('#scr-wizard button')).find(b => b.getAttribute('aria-label') === 'Eine Pflanze mehr');
    pruef('M3 die letzte Seite fragt nach der Pflanzenzahl', !!plus && letzter > 0);
    for (let i = 0; i < 3 && plus; i++) Array.from(a.window.document.querySelectorAll('#scr-wizard button')).find(b => b.getAttribute('aria-label') === 'Eine Pflanze mehr').click();
    pruef('M4 „+" zählt hoch (4)', a.E('_wizAnswers.plantCount') === 4 && /🌿 Pflanzen: − 4 \+/.test((a.window.document.getElementById('scr-wizard')?.textContent || '').replace(/\s+/g, ' ')));
    a.E("_wizAnswers.customStartDate = '2026-09-20'; _wizAnswers.name = 'Run 02 · Anesia'");
    const vorher = a.E('S.cycles.length');
    a.E('_wizFinish()');
    const c = JSON.parse(a.E("JSON.stringify(S.cycles[S.cycles.length - 1])"));
    pruef('M5 der neue Zyklus: 4 Pflanzen in der Liste, Start 20.09., Topf 15 L', a.E('S.cycles.length') === vorher + 1 && c.plantCount === 4 && (c.plants || []).length === 4 && c.startDate === '2026-09-20' && c.potSize === 15,
      { pc: c.plantCount, n: (c.plants || []).length, s: c.startDate, t: c.potSize });
    pruef('M6 Run 01 unberührt', a.E('S.cycles[0].plants.length') === 5 && a.E('getPotSize(S.cycles[0])') === 11);
    pruef('M7 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== N: Nachbesserungen aus der Prüfung (v1.5.311) =====
  console.log('\nN - Rainbow: Tipps, Hinweis, eigene Notizen, geänderte Kopien');
  {
    const a = await load(kopie((st, id) => {
      st.fertPlans.find(p => p.id === 'fp_rb').products.find(p => p.name === 'CalMag').note = 'MEINE NOTIZ';
      st.fertPlans.find(p => p.id === 'fp_rb').products.find(p => p.name === 'POWHUMUS').note = '④ alte Vorlagen-Notiz';
      const iso = '2026-10-01'; st.entries[iso] = st.entries[iso] || {}; st.entries[iso].cycleData = st.entries[iso].cycleData || {};
      st.entries[iso].cycleData[st.cycles[0].id] = { mixChecks: { [id['Alfa Boost']]: true } };
    }));
    const pr = JSON.parse(a.E('JSON.stringify(FERT_PRESETS.rainbow_auto)'));
    pruef('N1 Tipp 8: Spitzenbrand zählt nur bei nicht trockenem Topf und nicht nur an den lichtnächsten Spitzen, dazu das Phosphor-Bild',
      /nicht nur die lichtnächsten Spitzen/.test(pr.weekFocus[8].tip) && /Phosphor verdrängt Zink und Eisen/.test(pr.weekFocus[8].tip) && !/Erste Gelbfärbung/.test(pr.weekFocus[8].tip));
    pruef('N2 Tipp 6 nennt den Rückweg für Bio-Grow (1,0 bzw. 0,75), Ablauf-Info verweist darauf',
      /Rückweg für Bio-Grow/.test(pr.weekFocus[6].tip) && /auf 1,0, ab Woche 11 auf 0,75/.test(pr.weekFocus[6].tip) && /Rückweg für Bio-Grow/.test(pr.drainInfo));
    pruef('N3 Tipp 11: Drain-EC mit Unterscheidung statt „ist Mineralisierung"', /spricht das für Nachlieferung/.test(pr.weekFocus[11].tip) && !/ist Mineralisierung, keine Überdüngung/.test(pr.weekFocus[11].tip));
    const pl = JSON.parse(a.E("JSON.stringify(S.fertPlans.find(p => p.id === 'fp_rb'))"));
    pruef('N4 eigene Produktnotiz bleibt, Vorlagen-Notiz wird ersetzt',
      pl.products.find(p => p.name === 'CalMag').note === 'MEINE NOTIZ' && /^④ Konzentrat/.test(pl.products.find(p => p.name === 'POWHUMUS').note));
    a.E("switchFertPlan('fp_rb'); renderDuenger()");
    let scr = (a.window.document.getElementById('scr-duenger')?.textContent || '').replace(/\s+/g, ' ');
    pruef('N5 Alfa Boost blieb (Eintrag zeigt darauf) — der Hinweis sagt das, statt „entfernt"', /Alfa Boost bleibt in der Liste/.test(scr) && !/Alfa Boost entfernt/.test(scr), scr.slice(0, 300));
    a.E("rainbowHinweisZu('fp_rb')");
    scr = (a.window.document.getElementById('scr-duenger')?.textContent || '').replace(/\s+/g, ' ');
    pruef('N6 der Hinweis lässt sich wegtippen', !/auf dein Plan-Blatt v2\.1 gebracht/.test(scr));
    // Eine selbst geänderte v1.0-Kopie: Hinweis und Knopf
    const b = await load(kopie((st, id) => { st.fertPlans.find(p => p.id === 'fp_rb').schedule.w9[id['Bio-Bloom']] = 1.35; }));
    b.window.customConfirm = () => Promise.resolve(true);
    b.E("switchFertPlan('fp_rb'); renderDuenger()");
    const sb = (b.window.document.getElementById('scr-duenger')?.textContent || '').replace(/\s+/g, ' ');
    pruef('N7 eine selbst geänderte v1.0-Kopie sagt, dass sie abweicht, und bietet das Heben an', /weicht von deinem Plan-Blatt v2\.1 ab/.test(sb) && /Auf Blatt v2\.1 bringen/.test(sb));
    await b.E("rainbowKopieAufBlatt('fp_rb')");
    const rb = lies(b);
    pruef('N8 nach dem Knopf: Dosen vom Blatt (CalMag Woche 4 0,3, Bio-Bloom Woche 9 1,2), Name v2.1', rb.w[4]['CalMag'] === 0.3 && rb.w[9]['Bio-Bloom'] === 1.2 && rb.name === 'Rainbow Düngeplan (v2.1)', rb.name);
    // Eine v2.1-Kopie mit eingetragenem Ceiling bekommt keinen Dauerhinweis
    const c = await load();
    c.window.customConfirm = () => Promise.resolve(true);
    await c.E("loadPreset('rainbow_auto')");
    c.E("(() => { const p = S.fertPlans.find(x => x.presetKey === 'rainbow_auto'); const bb = p.products.find(x => x.name === 'Bio-Bloom').id; p.schedule.w10[bb] = 1.35; switchFertPlan(p.id); renderDuenger(); })()");
    const sc = (c.window.document.getElementById('scr-duenger')?.textContent || '').replace(/\s+/g, ' ');
    pruef('N9 eine v2.1-Kopie mit eingetragenem Ceiling: kein Hinweis „weicht ab"', !/weicht von deinem Plan-Blatt/.test(sc));
    pruef('N10 keine JS-Fehler', a.errors.length + b.errors.length + c.errors.length === 0, a.errors[0] || b.errors[0] || c.errors[0]);
  }

  // ===== O: Der Assistent verspricht so viele Fragen, wie er stellt (v1.5.312) =====
  console.log('\nO - Zahl der Fragen im Assistenten');
  {
    const a = await load();
    const zaehle = (antworten) => a.E(`(() => { openCycleWizard('dash'); Object.assign(_wizAnswers, ${JSON.stringify(antworten)}); let n = 0;
      for (let s = 1; s < 20; s++) { _wizStep = s; _renderWiz(); n++; if (/Zyklus erstellen/.test(document.getElementById('scr-wizard').textContent)) break; } return n; })()`);
    const drinnen = zaehle({ growType: 'indoor', medium: 'erde' }), draussen = zaehle({ growType: 'outdoor', medium: 'erde' });
    a.E("openCycleWizard('dash'); _wizStep = 0; _renderWiz()");
    const willkommen = (a.window.document.getElementById('scr-wizard')?.textContent || '').replace(/\s+/g, ' ');
    pruef('O1 gezählt: drinnen 8, draußen 7 Fragen-Seiten', drinnen === 8 && draussen === 7, { drinnen, draussen });
    pruef('O2 das Willkommen sagt „sieben bis acht kurze Fragen", nicht „5 einfache Sachen"', /sieben bis acht kurze Fragen/.test(willkommen) && !/5 einfache/.test(willkommen));
    pruef('O3 nirgends mehr „5 einfache" im Quelltext', !/5 einfache/.test(a.window.document.documentElement.outerHTML));
    pruef('O4 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== P: Ein abgeschlossener Zyklus verschwindet aus dem Gieß-Fahrplan (v1.5.313) =====
  console.log('\nP - Gieß-Fahrplan nach dem Abschließen');
  {
    const a = await load(null, { datum: '2026-10-08' });
    a.E("addCyc({ name: 'Anesia', startDate: '2026-09-20', potSize: 15, plantCount: 4 }); addCyc({ name: 'Mimosa', startDate: '2026-09-26', potSize: 15, plantCount: 2 })");
    const mi = a.E("S.cycles.find(x => x.name === 'Mimosa').id");
    a.E(`_gussplanZyklusId = '${mi}'`);
    pruef('P0 Lage: im Fahrplan ist Mimosa angetippt', a.E('gussplanActiveCycle().name') === 'Mimosa');
    a.window.customPrompt = () => Promise.resolve('2026-10-07');
    await a.E(`archiveCycle('${mi}')`);
    pruef('P1 nach dem Abschließen zeigt der Fahrplan Mimosa nicht mehr', a.E('gussplanActiveCycle().name') !== 'Mimosa' && a.E('_gussplanZyklusId') === null, a.E('gussplanActiveCycle().name'));
    a.E(`selId = '${mi}'`);
    pruef('P2 auch nicht, wenn Mimosa in den Einstellungen gewählt ist', a.E('gussplanActiveCycle().name') !== 'Mimosa');
    a.E("S.cycles.forEach(c => { c.archived = true; c.active = false; }); goTo('gussplan')");
    const t = (a.window.document.getElementById('gussplan-body')?.textContent || '').replace(/\s+/g, ' ');
    pruef('P3 sind alle abgeschlossen: „Kein laufender Zyklus" statt eines geplanten Gusses', a.E('gussplanActiveCycle()') === null && /Kein laufender Zyklus/.test(t) && !/Nächster Guss/.test(t), t.slice(0, 160));
    pruef('P4 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== Q: Ein Zyklus im Freien führt nicht das Zeltklima (v1.5.314) =====
  console.log('\nQ - Zeltklima neben einem Outdoor-Zyklus');
  {
    const a = await load();
    a.E("S.cycles[0].archived = true; S.cycles[0].active = false; S.cycles[0].endDate = '2026-09-13'");
    a.E("addCyc({ name: 'Zelt', startDate: '2026-09-20', potSize: 15, plantCount: 4 }); S.cycles.find(x => x.name === 'Zelt').anzuchtDays = 26");
    a.E("addCyc({ name: 'Garten', startDate: '2026-05-10', growType: 'outdoor', seedType: 'photo', potSize: 50, plantCount: 1 })");
    pruef('Q0 Lage: der Garten-Zyklus hat die höhere Tageszahl', a.E("phase(todayISO(), S.cycles.find(x => x.name === 'Garten')).day") > a.E("phase(todayISO(), S.cycles.find(x => x.name === 'Zelt')).day"));
    pruef('Q1 das Zeltklima richtet sich nach dem Zyklus im Zelt', a.E('_fuehrenderZyklus(active(), todayISO()).name') === 'Zelt', a.E('_fuehrenderZyklus(active(), todayISO()).name'));
    const k = a.E("JSON.stringify(_klimaEntryTeile('24', '85', active(), todayISO()))");
    pruef('Q2 bei 24 °C / 85 % kommt die Warnung für die Sämlinge, kein „Indoor-Idealwert" der Blüte', !/Indoor-Idealwert/.test(k) && /Anzucht|Sämling/.test(k) && !/Bewertet nach/.test(k), k.slice(0, 300));
    const b = await load();
    b.E("S.cycles[0].archived = true; S.cycles[0].active = false; addCyc({ name: 'Nur Garten', startDate: '2026-05-10', growType: 'outdoor', seedType: 'photo', potSize: 50, plantCount: 1 })");
    pruef('Q3 nur draußen: dann führt der Garten-Zyklus', b.E('_fuehrenderZyklus(active(), todayISO()).name') === 'Nur Garten');
    pruef('Q4 keine JS-Fehler', a.errors.length + b.errors.length === 0, a.errors[0] || b.errors[0]);
  }

  // ===== R: Die Startseite übernimmt ernste Befunde des Eintrags (v1.5.315) =====
  console.log('\nR - Startseite nach einem Eintrag mit ernstem Befund');
  {
    const TAG = '2026-10-08';
    const a = await load(null, { datum: TAG });
    a.E("S.cycles[0].archived = true; S.cycles[0].active = false; S.cycles[0].endDate = '2026-09-13'");
    a.E("addCyc({ name: 'Mimosa', startDate: '2026-09-26', potSize: 15, plantCount: 2, startMethod: 'direct' }); S.cycles.find(x => x.name === 'Mimosa').anzuchtDays = 26");
    const mi = a.E("S.cycles.find(x => x.name === 'Mimosa').id");
    const setze = (w, ph, ec) => a.E(`(() => { editISO = '${TAG}'; ensE('${mi}'); const cd = S.entries['${TAG}'].cycleData['${mi}']; cd.water = '${w}'; cd.ph = '${ph}'; cd.ec = '${ec}'; S.entries['${TAG}'].temp = '24'; S.entries['${TAG}'].humidity = '60'; saveS(); renderDash(); })()`);
    setze(9000, 8.0, 1.9);
    let d = (a.window.document.getElementById('dash-body')?.textContent || '').replace(/\s+/g, ' ');
    pruef('R1 Sämling mit 9000 ml und EC 1,9: kein grünes „Heute erledigt", sondern „Eingetragen — aber …"', /Eingetragen — aber/.test(d) && !/Heute erledigt/.test(d), d.slice(0, 260));
    pruef('R2 der wichtigste Befund steht auf der Startseite', /EC|Wasser|pH/.test(d.split('Eingetragen — aber')[1] || ''));
    setze(500, 6.3, 0.35);
    d = (a.window.document.getElementById('dash-body')?.textContent || '').replace(/\s+/g, ' ');
    pruef('R3 ein unauffälliger Eintrag bleibt „Heute erledigt"', /Heute erledigt/.test(d) && !/Eingetragen — aber/.test(d), d.slice(0, 200));
    pruef('R4 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== S: Keine unbelegten Wirkungszusagen in Hinweisen, Diagnose und Plan-Tipps (v1.5.316) =====
  console.log('\nS - Wirkungszusagen');
  {
    const a = await load();
    const quelle = a.window.document.documentElement.outerHTML;
    const verboten = [/verdoppelt deinen Ertrag/, /Cannabinoid-Produktion (bricht ein|fällt zusammen)/, /senkt das Schimmelrisiko spürbar/, /Wichtig für dichte Buds/, /Reinigung\. Nur noch Wasser/];
    const rest = verboten.filter(re => re.test(quelle)).map(re => re.source);
    pruef('S1 keine der fünf Zusagen steht noch im Quelltext', rest.length === 0, rest);
    a.E("S.cycles[0].archived = true; S.cycles[0].active = false; addCyc({ name: 'Auto', startDate: '2026-09-20', seedType: 'auto', potSize: 15, plantCount: 2 }); S.beginnerMode = true");
    const auto = JSON.parse(a.E("JSON.stringify(getAlerts(S.cycles.find(x => x.name === 'Auto')).filter(x => /opp/.test(x.text)).map(x => x.text))"));
    pruef('S2 Toppen-Hinweis für Automatics: nur früh, LST schonender, Ertragsplus nicht belegt, mit Zyklusname',
      auto.length === 1 && /bei Automatics nur jetzt/.test(auto[0]) && /nicht belegt/.test(auto[0]) && /^Auto:/.test(auto[0]), auto);
    a.E("S.beginnerMode = false");
    const profi = JSON.parse(a.E("JSON.stringify(getAlerts(S.cycles.find(x => x.name === 'Auto')).filter(x => /opp/.test(x.text)).map(x => x.text))"));
    pruef('S3 Profi-Hinweis für Automatics nennt die Grenze', profi.length === 1 && /später nicht mehr/.test(profi[0]), profi);
    pruef('S4 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== T: Notfall-Texte kennen das Substrat (v1.5.317) =====
  console.log('\nT - pH-Notfall und Kalium-Schnellhilfe');
  {
    const a = await load();
    const warn = (medium, ph) => JSON.parse(a.E(`JSON.stringify(getCriticalWarning('ph', ${ph}, { ph: 'bloom', week: 4 }, { medium: '${medium}', id: 'x' }))`));
    const cocoLo = warn('coco', 4.2), hydroHi = warn('hydro', 8.5), erdeLo = warn('erde', 4.2);
    pruef('T1 Coco, pH 4,2: Ziel 5,8–6,2 statt „6.4", keine „2× Topfvolumen"', /5,8–6,2/.test(cocoLo.action) && !/6\.4/.test(cocoLo.action) && !/Topfvolumen/.test(cocoLo.action), cocoLo.action);
    pruef('T2 Hydro, pH 8,5: Ziel 5,5–6,0', /5,5–6,0/.test(hydroHi.action) && !/6\.4/.test(hydroHi.action), hydroHi.action);
    pruef('T3 Erde, pH 4,2: Ziel der Erde, zuerst das Messgerät prüfen', /6,2–6,4/.test(erdeLo.action) && /Messgerät prüfen/.test(erdeLo.action), erdeLo.action);
    const q = a.window.document.documentElement.outerHTML;
    pruef('T4 Schnellhilfe „Ränder braun": erst unterscheiden (Drain-EC), Kalium nur bei stabilem Magnesium, kein festes „6.2-6.4"',
      /Ränder braun\/trocken/.test(q) && /Erst unterscheiden:<\/b> Drain-EC/.test(q) && !/pH prüfen \(6\.2-6\.4\) damit die Aufnahme klappt/.test(q));
    pruef('T5 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== U: Gieß-Ratschläge folgen dem Gießpunkt, nicht einer Frist (v1.5.318) =====
  console.log('\nU - Gieß-Ratschläge');
  {
    const a = await load(null, { datum: '2026-08-10' });
    const q = a.window.document.documentElement.outerHTML;
    pruef('U1 keine feste Gießpause mehr („Eine Woche NICHT gießen", „5-7 Tage NICHT gießen")', !/Eine Woche NICHT gießen|5-7 Tage NICHT gießen/.test(q));
    pruef('U2 „Erde nass, Pflanze welk" unterscheidet Überwässerung und Überdüngung über den Drain-EC', /Dasselbe Bild macht zu viel Dünger/.test(q) && /keine feste Frist/.test(q));
    pruef('U3 kein „Zu viel Wasser = Wurzelfäule" mehr', !/Zu viel Wasser = Wurzelfäule/.test(q));
    // Patricks Run 01 hatte schwankende Abstände — der Tipp „Gleichmäßiger = besser" kommt nicht mehr
    const alerts = JSON.parse(a.E('JSON.stringify(getAlerts(S.cycles[0]).map(x => x.text))'));
    pruef('U4 kein Hinweis „Gießrhythmus schwankt … Gleichmäßiger = besser!"', !alerts.some(x => /Gießrhythmus schwankt/.test(x)) && !/Gleichmäßiger = besser/.test(q), alerts);
    pruef('U5 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== V: Drei kleine Anzeigefehler (v1.5.319) =====
  console.log('\nV - Rainbow im Assistenten, Curing auf der Startseite, pH im Zyklus-Vergleich');
  {
    const a = await load();
    a.E("openCycleWizard('dash'); Object.assign(_wizAnswers, { growType: 'indoor', medium: 'erde', seedType: 'auto' })");
    let gesehen = '';
    for (let s = 1; s <= 8; s++) { a.E(`_wizStep = ${s}; _renderWiz()`); const t = a.window.document.getElementById('scr-wizard')?.textContent || ''; if (/Rainbow Düngeplan \(v2\.1\)/.test(t)) { gesehen = t.replace(/\s+/g, ' '); break; } }
    pruef('V1 Rainbow im Assistenten mit Beschreibung', /Rainbow Düngeplan \(v2\.1\) Plan-Blatt v2\.1 · Automatics in Light-Mix/.test(gesehen), gesehen.slice(0, 120));
    a.E("goTo('dash'); renderDash()");
    const d = (a.window.document.getElementById('dash-body')?.textContent || '').replace(/\s+/g, ' ');
    pruef('V2 Run 01 im Curing: Karte sagt „Curing", nicht „Trocknung"', /Curing · Tag 21\/21 Curing/.test(d) && !/Trocknung · Tag 21\/21/.test(d), d.slice(0, 400));
    pruef('V3 Kachel „Ernte in": geerntet statt „— ±5d"', /Ernte ins*✓ geerntet/.test(d) && !/Ernte ins*— ±5d/.test(d), d.slice(0, 300));
    const cmp = JSON.parse(a.E("JSON.stringify(compareCycles({ medium: 'coco', totalDays: 1, photos: { total: 0 }, ph: { avg: 6.0, honestyPct: null }, ec: {}, weight: {}, runoff: {}, training: { total: 0 }, water: {}, consumption: [] }, { medium: 'coco', totalDays: 1, photos: { total: 0 }, ph: { avg: 6.3, honestyPct: null }, ec: {}, weight: {}, runoff: {}, training: { total: 0 }, water: {}, consumption: [] }))"));
    pruef('V4 Zyklus-Vergleich in Coco: pH 6,0 liegt näher am Ziel als 6,3', cmp && cmp.deltas && cmp.deltas.phAvg && cmp.deltas.phAvg.winner === 'a', cmp && cmp.deltas && cmp.deltas.phAvg);
    pruef('V5 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== W: Die Kalender-Kopfzeile sagt nicht „abgeschlossen", solange der Zyklus nicht abgeschlossen ist (v1.5.323) =====
  console.log('\nW - Kalender-Kopfzeile nach dem Curing');
  {
    const a = await load(null, { datum: '2026-10-20' });
    const c0 = a.E('S.cycles[0].id');
    a.E("goTo('cal'); renderCal()");
    const kal = () => (a.window.document.getElementById('scr-cal')?.textContent || '').replace(/\s+/g, ' ');
    const k = kal();
    pruef('W1 alle Phasen vorbei: kein „abgeschlossen" und kein „Curing" mehr in der Kopfzeile', !/abgeschlossen Anz/.test(k) && !/Curing abgeschlossen/.test(k) && /✓ fertig/.test(k), k.slice(0, 200));
    pruef('W2 die Kopfzeile bietet „🏁 Zyklus abschließen" an', /🏁 Zyklus abschließen — danach steht er nicht mehr im Kalender/.test(k));
    // Mitten im Zyklus kein Knopf
    a.E("setDebugDate('2026-08-10'); renderCal()");
    pruef('W3 mitten im Zyklus: kein Abschließen-Knopf im Kalender', !/🏁 Zyklus abschließen — danach/.test(kal()));
    // Abschließen über den Kalender-Knopf
    a.E("setDebugDate('2026-10-20'); renderCal()");
    a.window.customPrompt = () => Promise.resolve('2026-09-20');
    const knopf = Array.from(a.window.document.querySelectorAll('#scr-cal button')).find(b => /🏁 Zyklus abschließen/.test(b.textContent));
    if (knopf) knopf.click();
    await new Promise((r) => setTimeout(r, 200));
    const z = JSON.parse(a.E(`JSON.stringify(S.cycles.find(x => x.id === '${c0}'))`));
    pruef('W4 der Knopf schließt ab, mit Datum', !!knopf && z.archived === true && z.endDate === '2026-09-20', { archived: z.archived, endDate: z.endDate });
    pruef('W5 danach steht der Zyklus nicht mehr im Kalender', !/Sensi Amnesia/.test(kal()), kal().slice(0, 150));
    pruef('W6 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== X: Nach der Ernte keine Düngeplan-Zeile mehr im Eintrag (v1.5.324) =====
  console.log('\nX - Düngeplan-Zeile im Trocknen und Curing');
  {
    const a = await load(null, { datum: '2026-09-12' });
    const eintrag = (iso) => { a.E(`openEntry('${iso}')`); return (a.window.document.getElementById('scr-entry')?.textContent || '').replace(/\s+/g, ' '); };
    const ph = (iso) => a.E(`(phase('${iso}', S.cycles[0]) || {}).ph`);
    pruef('X0 Lage: 12.09. ist Trocknen, 20.09. Curing, 10.08. Blüte', ph('2026-09-12') === 'dry' && ph('2026-09-20') === 'cure' && ph('2026-08-10') === 'bloom', [ph('2026-09-12'), ph('2026-09-20'), ph('2026-08-10')]);
    const heute = eintrag('2026-09-12');
    pruef('X1 Trocknungstag heute: keine „Düngeplan: Woche"-Zeile', !/Düngeplan: Woche/.test(heute));
    pruef('X2 … und kein ＋3 „Ernte 3 Tage später"', !a.window.document.querySelector('#scr-entry button[title^="Ernte 3 Tage später"]'));
    pruef('X3 Curing-Tag: keine Düngeplan-Zeile', !/Düngeplan: Woche/.test(eintrag('2026-09-20')));
    pruef('X4 Blütetag: die Zeile bleibt', /Düngeplan: Woche/.test(eintrag('2026-08-10')));
    pruef('X5 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== Y: Zwei Zyklen in derselben Millisekunde bekommen verschiedene Kennungen (v1.5.336) =====
  console.log('\nY - Eindeutige Zyklus-Kennung');
  {
    const a = await load();
    const ids = JSON.parse(a.E("(() => { const _dn = Date.now; Date.now = () => 1791000000000; try { addCyc({ name: 'Y1' }); addCyc({ name: 'Y2' }); } finally { Date.now = _dn; } return JSON.stringify(S.cycles.filter(c => /^Y[12]$/.test(c.name)).map(c => c.id)); })()"));
    pruef('Y1 zwei Zyklen in derselben Millisekunde: zwei Kennungen', ids.length === 2 && ids[0] !== ids[1], ids);
    pruef('Y2 alle Kennungen im Stand sind verschieden', a.E('new Set(S.cycles.map(c => c.id)).size === S.cycles.length'));
    pruef('Y3 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  // ===== Z: „Blüte Wo." nur in der Blüte (v1.5.338) =====
  console.log('\nZ - Blütewoche nur in der Blüte');
  {
    const a = await load(null, { datum: '2026-10-07' });
    a.E("S.beginnerMode = false; S.cycles[0].archived = true; S.cycles[0].active = false; addCyc({ name: 'Zelt', startDate: '2026-09-20', potSize: 15, plantCount: 4 }); (() => { const c = S.cycles.find(x => x.name === 'Zelt'); c.anzuchtDays = 26; c.bloomDays = 70; })()");
    const kopf = (iso) => { a.E(`setDebugDate('${iso}'); openEntry('${iso}')`); return (a.window.document.getElementById('scr-entry')?.textContent || '').replace(/\s+/g, ' '); };
    pruef('Z0 Lage: 07.10. Anzucht Tag 18, 20.10. Blüte', a.E("phase('2026-10-07', S.cycles.find(x => x.name === 'Zelt')).ph") === 'anzucht' && a.E("phase('2026-10-20', S.cycles.find(x => x.name === 'Zelt')).ph") === 'bloom');
    pruef('Z1 Anzucht-Tag 18: kein „Blüte Wo." im Eintrag', !/Blüte Wo\./.test(kopf('2026-10-07')));
    pruef('Z2 Blüte: „Blüte Wo.1" steht weiter da', /Blüte Wo\.1/.test(kopf('2026-10-20')));
    a.E("setDebugDate('2026-10-07')");
    const d = a.E("lexCycleNote('Vegetationsphase')").replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    pruef('Z3 Lexikon „Dein Zyklus · Tag 18 …" in der Anzucht ohne „(Blüte Wo.)"', /Dein Zyklus · Tag 18/.test(d) && !/Blüte Wo\./.test(d), d.slice(0, 200));
    pruef('Z4 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  if (fail) process.exit(1);
})().catch((e) => { console.log('FEHLER: ' + (e && e.stack || e)); process.exit(1); });
