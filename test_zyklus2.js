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
  {
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

  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  if (fail) process.exit(1);
})().catch((e) => { console.log('FEHLER: ' + (e && e.stack || e)); process.exit(1); });
