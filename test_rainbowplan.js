/**
 * (v1.5.133) Sichert den Rainbow-Plan ab, der die Sensi-Amnesia-Pläne ersetzt.
 *
 * Patrick am 13.09.2026: „meine alten Pläne, den Sensi Amnesia XXL Auto, bitte alle die so
 * heißen, V6.0 und V3.4.7 — füge dafür den neuen Rainbowplan ein."
 *
 * Wichtigster Teil ist A: Jede Dosis wird gegen das Plan-Blatt gehalten. Das Blatt ist hier
 * ein zweites Mal abgetippt, bewusst in anderer Form als im Code — dort je Woche, hier je
 * Produkt. Ein Tippfehler müsste an beiden Stellen gleich passieren, um durchzurutschen.
 * Dosierungen werden nie aus dem Gedächtnis übernommen (siehe Fingerabdruck in
 * test_duengeplaene.js).
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const V347_ID = 'fp_1782241910561';     // „Sensi Amnesia XXL Auto (V3.4.7)" in Patricks Sicherung
const BIO_ID  = 'fp_1788458746438';     // „BioBizz Official", daran hängt sein Zyklus

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

async function load(mut) {
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
      const st = JSON.parse(BACKUP);
      if (mut) mut(st);
      w.localStorage.setItem('growsmart_v4', JSON.stringify(st));
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

// Das Plan-Blatt „Rainbow Düngeplan v1.0", je Produkt über Woche 1 bis 13.
// null = in dieser Woche nicht dabei. Woche 14 (Spülen) und 15 (IceFlush) sind leer.
const BLATT = {
  'Silica Force':   [null, 0.3,  0.4, 0.5,  0.5,  0.5,  0.5,  0.5,  0.5, 0.5, 0.5, 0.5, null],
  'CalMag':         [0.3,  0.4,  0.5, 0.8,  0.8,  0.8,  0.8,  0.8,  0.8, 0.8, 0.8, 0.8, 0.5],
  'Epsom Salz':     [null, 0.15, 0.2, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.2],
  'POWHUMUS':       [2.5,  2.5,  2.5, 2.5,  2.5,  2.5,  2.5,  2.5,  2.5, 2.5, 2.5, 2.5, null],
  'Bio-Grow':       [null, 0.25, 0.6, 1.0,  1.0,  0.75, 0.5,  0.3,  0.3, 0.3, 0.3, 0.3, null],
  // Woche 10–12 steht auf dem Blatt „Ceiling" — 1,2 ist der letzte Wert, den es nennt.
  'Bio-Bloom':      [null, null, null, null, null, 0.75, 0.9, 1.05, 1.2, 1.2, 1.2, 1.2, 0.5],
  'Alg-A-Mic':      [2,    2,    2,   2,    2,    2,    2,    2,    2,   2,   3,   3,   null],
  'Advanced Amino': [null, 0.15, 0.2, 0.2,  0.2,  0.2,  0.2,  null, null, null, null, null, null],
  // „n. Label" — das Blatt nennt keine Zahl, also steht auch keine im Plan.
  'Alfa Boost':     [null, null, null, null, null, null, null, null, null, null, null, null, null],
};

// Plan über den echten Weg anlegen (Düngeplan-Bildschirm → Vorlage laden), dann einen
// Zyklus darauf setzen. Patricks Zyklen werden vorher ausgeblendet, damit loadPreset
// keinen davon umhängt.
const ZYKLUS = (bluete) => `(function(){
  const plan = S.fertPlans.find(p => p.presetKey === 'rainbow_auto');
  if (!plan) return JSON.stringify({ fehlt: true });
  const c = addCyc({ name: 'Rainbow Run 02', seedType: 'auto', strain: 'Rainbow Donut Auto', medium: 'erde' });
  c.fertPlanId = plan.id;
  c.startDate = '2026-10-01';
  c.anzuchtDays = 21; c.bloomDays = ${bluete}; c.flushDays = 7; c.iceDays = 2; c.harvestDays = 1; c.dryDays = 12;
  saveS();
  const namen = {}; plan.products.forEach(p => { namen[p.id] = p.name; });
  const lesbar = (d) => { const l = {}; Object.entries(d || {}).forEach(([pid, v]) => { l[namen[pid] || pid] = v; }); return l; };
  const tag = (d) => isoPlus(c.startDate, d - 1);
  const woche = (d) => fertPlanWeek(c, tag(d));
  const ec = (d) => { const iso = tag(d); return getEcTarget(c, phase(iso, c), iso); };
  return JSON.stringify({ lesbar: null, c: c.id,
    wochen: [1, 7, 8, 21, 22, 28, 29, 21 + ${bluete}, 22 + ${bluete}, 28 + ${bluete}, 29 + ${bluete}].map(d => [d, woche(d)]),
    phasen: { d91: (phase(tag(21 + ${bluete}), c) || {}).ph, d92: (phase(tag(22 + ${bluete}), c) || {}).ph, d99: (phase(tag(29 + ${bluete}), c) || {}).ph },
    dosen: Array.from({ length: 15 }, (_, i) => lesbar(getWeekDoses(c.id, i + 1, c))),
    ec13: ec(21 + ${bluete}), ec14: ec(22 + ${bluete}), ec4: ec(22),
    planFelder: { weekPhases: (plan.weekPhases || []).length, ecTargets: !!plan.ecTargets, rhythmus: !!plan.feedWaterRhythm, skelett: !!plan.phaseSkeleton }
  });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  // ------------------------------------------------------------------------------------
  console.log('\nA - Jede Dosis stimmt mit dem Plan-Blatt überein');
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const pr = JSON.parse(E('JSON.stringify(FERT_PRESETS.rainbow_auto || null)'));
  pruef('Vorlage rainbow_auto existiert', !!pr);
  if (!pr) { console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`); process.exit(1); }

  const abweichungen = [];
  for (const [prod, reihe] of Object.entries(BLATT)) {
    reihe.forEach((soll, i) => {
      const ist = (pr.schedule[i + 1] || {})[prod];
      if (soll === null && ist !== undefined) abweichungen.push(`Wo ${i + 1} ${prod}: Blatt nichts, Plan ${ist}`);
      if (soll !== null && ist !== soll) abweichungen.push(`Wo ${i + 1} ${prod}: Blatt ${soll}, Plan ${ist}`);
    });
  }
  Object.entries(pr.schedule).forEach(([w, d]) => Object.keys(d).forEach((prod) => {
    if (!BLATT[prod]) abweichungen.push(`Wo ${w}: Produkt „${prod}" steht nicht auf dem Blatt`);
  }));
  pruef('Alle 117 Felder (9 Produkte × 13 Wochen) wie auf dem Blatt', abweichungen.length === 0, abweichungen.join(' | '));
  pruef('Woche 14 (Spülen) und 15 (IceFlush) ohne Dünger',
    Object.keys(pr.schedule[14] || {}).length === 0 && Object.keys(pr.schedule[15] || {}).length === 0);
  pruef('Genau 15 Plan-Wochen, passend zum Rückgrat',
    Object.keys(pr.schedule).length === 15 && pr.weekPhases.length === 15,
    Object.keys(pr.schedule).length + ' / ' + pr.weekPhases.length);
  pruef('Rückgrat: 3 Anzucht, 10 Blüte, Spülen, IceFlush',
    pr.weekPhases.filter(x => x === 'anzucht').length === 3 && pr.weekPhases.filter(x => x === 'bloom').length === 10
    && pr.weekPhases[13] === 'flush' && pr.weekPhases[14] === 'ice', pr.weekPhases.join(','));
  pruef('Die 9 Produkte des Blatts, kein MKP', pr.products.length === 9
    && Object.keys(BLATT).every(n => pr.products.some(p => p.name === n)) && !pr.products.some(p => /MKP/.test(p.name)),
    pr.products.map(p => p.name).join(', '));
  pruef('Substrat Erde (Light-Mix)', pr.medium === 'erde');
  pruef('Jeder Guss ist Feed-Dosis — nie hochskaliert', pr.doseMode === 'per-watering' && pr.feedDayBasis === true);
  pruef('Mischreihenfolge: Silica zuerst, dann CalMag, Epsom, POWHUMUS',
    pr.mixOrder.slice(0, 4).join('|') === 'Silica Force|CalMag|Epsom Salz|POWHUMUS', pr.mixOrder.join(' → '));
  pruef('Mischreihenfolge kennt jedes Produkt', pr.products.every(p => pr.mixOrder.includes(p.name)));
  pruef('POWHUMUS-Ansatz wie auf dem Blatt (20 g / 250 ml = 80 mg/ml → 2,5 ml/L = 200 mg/L)',
    /20 g .*250 ml.*80 mg\/ml.*2,5 ml\/L.*200 mg\/L/.test(pr.products.find(p => p.name === 'POWHUMUS').note));

  // EC-Korridore
  const ecSoll = { 1: [0.3, 0.4], 2: [0.4, 0.6], 3: [0.7, 0.9], 4: [0.9, 1.0], 5: [0.85, 1.0], 6: [0.9, 1.05],
    7: [0.9, 1.05], 8: [1.0, 1.15], 9: [1.05, 1.2], 10: [1.05, 1.2], 11: [1.0, 1.15], 12: [0.9, 1.05] };
  const ecAbw = [];
  Object.entries(ecSoll).forEach(([w, [lo, hi]]) => {
    const t = pr.ecTargets[w];
    if (!t || t.min !== lo || t.max !== hi) ecAbw.push(`Wo ${w}: Blatt ${lo}–${hi}, Plan ${t ? t.min + '–' + t.max : 'fehlt'}`);
    else if (!(t.def >= lo && t.def <= hi)) ecAbw.push(`Wo ${w}: Mitte ${t.def} außerhalb`);
  });
  pruef('EC-Korridore Woche 1–12 wie auf dem Blatt', ecAbw.length === 0, ecAbw.join(' | '));
  pruef('Woche 13: das Blatt nennt keinen EC-Korridor, also auch der Plan nicht', !pr.ecTargets[13]);
  pruef('Spülen: Ziel Drain-EC höchstens 0,5', pr.ecTargets[14] && pr.ecTargets[14].max === 0.5);

  // Die drei Stellen ohne feste Zahl sind sichtbar gemacht, nicht erfunden
  const tips = pr.weekFocus;
  pruef('weekFocus für alle 15 Wochen', Object.keys(tips).length === 15);
  pruef('Alfa Boost „nach Etikett" steht in Woche 4–7 im Wochen-Tipp',
    [4, 5, 6, 7].every(w => /Alfa Boost/.test(tips[w].tip)) && ![1, 2, 3, 8].some(w => /Alfa Boost/.test(tips[w].tip)));
  pruef('Alfa Boost: Produkt-Hinweis sagt, warum keine Zahl im Plan steht',
    /Etikett/.test(pr.products.find(p => p.name === 'Alfa Boost').note));
  pruef('Bio-Bloom: Ceiling-Hinweis am Produkt', /Ceiling/.test(pr.products.find(p => p.name === 'Bio-Bloom').note));
  pruef('N-Stopp nur per Trigger (Woche 12)', /70–80 % milchig/.test(tips[12].tip));
  pruef('Ernte-Trigger vom Blatt (90 % milchig · 5–8 % Bernstein)', /90 % milchig · 5–8 % Bernstein/.test(tips[15].tip));
  pruef('Untertitel: „Trigger schlägt Kalender"', /Trigger schlägt Kalender/.test(pr.subtitle));

  // ------------------------------------------------------------------------------------
  console.log('\nB - Die Sensi-Vorlage ist weg, Rainbow steht in der Auswahl');
  pruef('FERT_PRESETS kennt sensi_amnesia_auto nicht mehr', E("typeof FERT_PRESETS.sensi_amnesia_auto") === 'undefined');
  pruef('Keine Vorlage heißt mehr „Sensi Amnesia"', E("Object.values(FERT_PRESETS).filter(p => /Sensi Amnesia/.test(p.name)).length") === 0);
  const bild = JSON.parse(E(`(function(){ renderDuenger(); const t = document.getElementById('scr-duenger').textContent;
    return JSON.stringify({ rainbow: t.includes('Rainbow Düngeplan (v1.0)'), sensiPlan: /Sensi Amnesia XXL Auto \\(V/.test(t) }); })()`));
  pruef('Düngeplan-Bildschirm bietet den Rainbow-Plan an', bild.rainbow);
  pruef('Düngeplan-Bildschirm zeigt keinen Sensi-Plan mehr', !bild.sensiPlan);

  // ------------------------------------------------------------------------------------
  console.log('\nC - Patricks gespeicherte Sensi-Kopie (V3.4.7) wird beim Laden aufgeräumt');
  {
    const r = JSON.parse(E(`JSON.stringify({ ids: S.fertPlans.map(p => p.id), namen: S.fertPlans.map(p => p.name),
      aktiv: S._activePlanId, zyklus: S.cycles.find(c => c.active).fertPlanId, flag: S._sensiPlaeneAbgeloest,
      presetKey: S.presetKey })`));
    pruef('V3.4.7 ist entfernt', !r.ids.includes(V347_ID), r.namen.join(', '));
    pruef('BioBizz Official bleibt', r.ids.includes(BIO_ID));
    pruef('Sein Zyklus hängt weiter an BioBizz', r.zyklus === BIO_ID, r.zyklus);
    pruef('Der aktive Plan bleibt BioBizz', r.aktiv === BIO_ID && r.presetKey === 'biobizz_official', r.aktiv + ' / ' + r.presetKey);
    pruef('Aufräumen ist als erledigt vermerkt', r.flag === true);
    const nachLaden = JSON.parse(E(`(function(){ saveS(); loadS(); return JSON.stringify({ n: S.fertPlans.length, ids: S.fertPlans.map(p => p.id) }); })()`));
    pruef('Nach Speichern und Neuladen unverändert', nachLaden.n === r.ids.length && !nachLaden.ids.includes(V347_ID));
  }
  {
    // Ein Sensi-Plan, an dem noch ein Zyklus hängt, darf nicht verschwinden.
    const { E: E2 } = await load((st) => { st.cycles[0].fertPlanId = V347_ID; });
    pruef('Benutzter Sensi-Plan bleibt stehen', E2(`S.fertPlans.some(p => p.id === '${V347_ID}')`) === true);
    pruef('… und der Zyklus rechnet weiter mit ihm', E2(`(getPlanForCycle(S.cycles[0]) || {}).id`) === V347_ID);
  }
  {
    // Ein archivierter Zyklus zählt genauso.
    const { E: E3 } = await load((st) => {
      const alt = JSON.parse(JSON.stringify(st.cycles[0]));
      alt.id = 'alter_zyklus'; alt.active = false; alt.archived = true; alt.fertPlanId = V347_ID;
      st.cycles.push(alt);
    });
    pruef('Sensi-Plan eines archivierten Zyklus bleibt', E3(`S.fertPlans.some(p => p.id === '${V347_ID}')`) === true);
  }
  {
    // War der Sensi-Plan gerade im Düngeplan-Bildschirm aufgeschlagen, springt die Auswahl auf den Plan des Zyklus.
    const { E: E4, errors: err4 } = await load((st) => { st._activePlanId = V347_ID; st.presetKey = 'sensi_amnesia_auto'; });
    pruef('Start ohne JS-Fehler, obwohl die Sensi-Kopie aufgeschlagen war', err4.length === 0, err4[0]);
    pruef('Aufgeschlagener Sensi-Plan: Auswahl springt auf BioBizz', E4('S._activePlanId') === BIO_ID, E4('S._activePlanId'));
    pruef('… und S.presetKey zeigt nicht mehr auf die gelöschte Vorlage', E4('S.presetKey') === 'biobizz_official', E4('S.presetKey'));
  }
  {
    // Der letzte Plan bleibt immer.
    const { E: E5 } = await load((st) => {
      st.fertPlans = st.fertPlans.filter(p => p.id === V347_ID);
      st.cycles.forEach(c => { c.fertPlanId = null; });
      st._activePlanId = V347_ID;
    });
    pruef('Ist die Sensi-Kopie der einzige Plan, bleibt sie', E5('S.fertPlans.length') >= 1 && E5(`S.fertPlans.some(p => p.id === '${V347_ID}')`) === true);
  }
  {
    // Einmalig: Ein später selbst so benannter Plan wird nicht mehr angefasst.
    const { E: E6 } = await load();
    E6(`(function(){ S.fertPlans.push({ id: 'fp_eigen', name: 'Sensi Amnesia XXL Auto (mein Nachbau)', products: [], schedule: {} }); saveS(); loadS(); })()`);
    pruef('Nach dem ersten Aufräumen bleibt ein neu angelegter Plan mit dem Namen', E6(`S.fertPlans.some(p => p.id === 'fp_eigen')`) === true);
  }

  // ------------------------------------------------------------------------------------
  console.log('\nD - Ein Zyklus auf dem Rainbow-Plan (über „Vorlage laden" angelegt)');
  const zyk = async (bluete) => {
    const { E: Z, errors: err } = await load((st) => { st.cycles = []; st.entries = {}; });
    Z(`loadPreset('rainbow_auto')`);
    await warte(30);
    Z(`_modalResolve && _modalResolve(true)`);
    await warte(60);
    return { r: JSON.parse(Z(ZYKLUS(bluete))), err, Z };
  };
  {
    const { r, err } = await zyk(70);
    pruef('Ohne JS-Fehler', err.length === 0, err[0]);
    pruef('Plan wurde angelegt und der Zyklus hängt daran', !r.fehlt);
    if (!r.fehlt) {
      pruef('Beim Laden kopiert: Rückgrat, Skelett, EC-Ziele, Rhythmus',
        r.planFelder.weekPhases === 15 && r.planFelder.skelett && r.planFelder.ecTargets && r.planFelder.rhythmus, JSON.stringify(r.planFelder));
      const w = Object.fromEntries(r.wochen);
      pruef('Tag 1–7 Woche 1, Tag 8 Woche 2, Tag 21 Woche 3', w[1] === 1 && w[7] === 1 && w[8] === 2 && w[21] === 3, JSON.stringify(r.wochen));
      pruef('Tag 22 (Blütetag 0) beginnt Woche 4 — wie auf dem Blatt', w[22] === 4 && w[28] === 4 && w[29] === 5, JSON.stringify(r.wochen));
      pruef('Tag 91 ist die Rampe (Woche 13), Tag 92 Spülen (Woche 14), Tag 99 IceFlush (Woche 15)',
        w[91] === 13 && w[92] === 14 && w[99] === 15, JSON.stringify(r.wochen));
      pruef('Phasen dazu: Blüte · Spülen · IceFlush', r.phasen.d91 === 'bloom' && r.phasen.d92 === 'flush' && r.phasen.d99 === 'ice', JSON.stringify(r.phasen));
      const dosAbw = [];
      r.dosen.forEach((d, i) => {
        Object.entries(BLATT).forEach(([prod, reihe]) => {
          const soll = i < 13 ? reihe[i] : null;
          const ist = d[prod];
          if (soll === null ? ist !== undefined && ist !== 0 : Math.abs((ist || 0) - soll) > 1e-9) dosAbw.push(`Wo ${i + 1} ${prod}: ${soll} vs ${ist}`);
        });
      });
      pruef('Die Gießdosen im Tageseintrag sind die Blatt-Dosen, Woche für Woche', dosAbw.length === 0, dosAbw.slice(0, 5).join(' | '));
      pruef('EC-Ziel Woche 4 aus dem Plan (0,9–1,0)', r.ec4 && r.ec4.min === 0.9 && r.ec4.max === 1.0, JSON.stringify(r.ec4));
      pruef('EC-Ziel in der Rampe: keins statt eines erfundenen', r.ec13 === null, JSON.stringify(r.ec13));
      pruef('EC-Ziel beim Spülen: höchstens 0,5', r.ec14 && r.ec14.max === 0.5, JSON.stringify(r.ec14));
    }
  }

  // ------------------------------------------------------------------------------------
  console.log('\nE - Längere Blüte: der Plan dehnt sich, statt am Ende festzuhängen');
  {
    const { r } = await zyk(91);
    if (!r.fehlt) {
      const w = Object.fromEntries(r.wochen);
      pruef('91 Blütetage: Woche 4 beginnt weiter an Tag 22', w[22] === 4, JSON.stringify(r.wochen));
      pruef('Letzter Blütetag (112) ist Woche 13, Tag 113 Spülen', w[112] === 13 && w[113] === 14, JSON.stringify(r.wochen));
      pruef('Tag 120 IceFlush-Woche', w[120] === 15, JSON.stringify(r.wochen));
    } else pruef('Zyklus mit 91 Blütetagen angelegt', false);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
