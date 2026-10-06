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

  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  if (fail) process.exit(1);
})().catch((e) => { console.log('FEHLER: ' + (e && e.stack || e)); process.exit(1); });
