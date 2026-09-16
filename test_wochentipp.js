/**
 * (v1.5.136) Der Wochen-Tipp im Tageseintrag kommt aus dem Plan DES ZYKLUS.
 *
 * Der Fehler: `_planStatusLine` und `_planWeekQuestion` lasen `weekFocus` aus
 * `getPreset(S.presetKey)` — also aus dem Plan, der gerade im Düngeplan-Bildschirm
 * aufgeschlagen ist, nicht aus dem, mit dem der Zyklus gedüngt wird. Dieselbe Fehlerklasse wie
 * v1.5.100 („Bei allem, was pro Zyklus verschieden sein kann, gilt getPlanForCycle(c)").
 *
 * Nachgestellt beim Einbau des Rainbow-Plans: Ein Rainbow-Zyklus in Woche 4, im
 * Düngeplan-Bildschirm „BioBizz Official" aufgeschlagen → die Statuszeile verlor
 * „Stretch · Selektion", und die Wochenfrage verlor den ganzen Rainbow-Tipp (erste Pistillen
 * notieren, Selektion, Alfa Boost nach Etikett). Umgekehrt hätte ein Zyklus die Tipps eines
 * fremden Plans bekommen, sobald der aufgeschlagene Plan welche hat.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const BIO_ID = 'fp_1788458746438';

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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  // Rainbow über „Vorlage laden" anlegen, während Patricks Zyklus trocknet (seit v1.5.134
  // bleibt er dabei an BioBizz), dann einen Rainbow-Zyklus dazu, heute an Tag 22 = Woche 4.
  E(`setDebugDate('2026-09-13')`);
  E(`loadPreset('rainbow_auto')`);
  await warte(30);
  E(`_modalResolve && _modalResolve(true)`);
  await warte(60);
  const aufbau = JSON.parse(E(`(function(){
    const rb = S.fertPlans.find(p => p.presetKey === 'rainbow_auto');
    if (!rb) return JSON.stringify({ fehlt: true });
    const c = addCyc({ name: 'Rainbow Run 02', seedType: 'auto', medium: 'erde' });
    c.id = 'run02'; c.fertPlanId = rb.id;
    c.anzuchtDays = 21; c.bloomDays = 70; c.flushDays = 7; c.iceDays = 2; c.harvestDays = 1;
    c.startDate = isoPlus(todayISO(), -21);
    saveS();
    return JSON.stringify({ rb: rb.id, woche: fertPlanWeek(c, todayISO()), patrick: S.cycles[0].fertPlanId });
  })()`));
  pruef('Aufbau: Rainbow-Zyklus steht in Woche 4, Patricks Zyklus an BioBizz',
    !aufbau.fehlt && aufbau.woche === 4 && aufbau.patrick === BIO_ID, JSON.stringify(aufbau));

  const text = (planId, cId) => JSON.parse(E(`(function(){
    S._activePlanId = ${JSON.stringify(planId)}; syncActivePlanToGlobals();
    const c = S.cycles.find(x => x.id === ${JSON.stringify(cId)});
    const t = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();
    return JSON.stringify({ aufgeschlagen: S.presetKey, status: t(_planStatusLine(c, todayISO())), frage: t(_planWeekQuestion(c, todayISO())) });
  })()`));

  console.log('\nA - Rainbow-Zyklus, im Düngeplan-Bildschirm ist BioBizz aufgeschlagen');
  const mitBio = text(BIO_ID, 'run02');
  pruef('Aufgeschlagen ist wirklich BioBizz', mitBio.aufgeschlagen === 'biobizz_official', mitBio.aufgeschlagen);
  pruef('Statuszeile nennt die Rainbow-Woche „Stretch · Selektion"', /Woche 4 .*Stretch · Selektion/.test(mitBio.status), mitBio.status);
  pruef('Wochenfrage bringt den Rainbow-Tipp (erste Pistillen notieren)', /Erste Pistillen pro Topf notieren/.test(mitBio.frage), mitBio.frage.slice(0, 160));
  pruef('… samt Alfa-Boost-Hinweis', /Alfa Boost nach Etikett/.test(mitBio.frage));

  console.log('\nB - Derselbe Zyklus, diesmal ist Rainbow aufgeschlagen');
  const mitRb = text(aufbau.rb, 'run02');
  pruef('Statuszeile gleich — egal, welcher Plan aufgeschlagen ist', mitRb.status === mitBio.status, mitRb.status + ' | ' + mitBio.status);
  pruef('Wochenfrage gleich', mitRb.frage === mitBio.frage);

  console.log('\nC - Patricks BioBizz-Zyklus bekommt keine Rainbow-Tipps, wenn Rainbow aufgeschlagen ist');
  E(`setDebugDate('2026-08-01')`);   // Tag 78, Blüte
  const patrick = JSON.parse(E(`(function(){
    const c = S.cycles[0];
    return JSON.stringify({ phase: phase(todayISO(), c).ph, woche: fertPlanWeek(c, todayISO()), plan: c.fertPlanId });
  })()`));
  pruef('Ausgangslage: Blüte, BioBizz', patrick.phase === 'bloom' && patrick.plan === BIO_ID, JSON.stringify(patrick));
  const pRb = text(aufbau.rb, E('S.cycles[0].id'));
  const pBio = text(BIO_ID, E('S.cycles[0].id'));
  const rainbowEtikett = E(`FERT_PRESETS.rainbow_auto.weekFocus[${patrick.woche}] ? FERT_PRESETS.rainbow_auto.weekFocus[${patrick.woche}].phase : ''`);
  pruef('Statuszeile ohne das Rainbow-Etikett dieser Woche („' + rainbowEtikett + '")',
    !rainbowEtikett || !pRb.status.includes(rainbowEtikett), pRb.status);
  pruef('Statuszeile gleich wie mit BioBizz aufgeschlagen', pRb.status === pBio.status, pRb.status + ' | ' + pBio.status);

  // Derselbe Fehler an drei weiteren Stellen, beim Nachsuchen nach „S.presetKey" gefunden:
  // Zyklus-Zusammenfassung, PDF-Bericht und Tagebuch-Export nannten für jeden Zyklus den
  // aufgeschlagenen Plan.
  console.log('\nD - Zusammenfassung und Tagebuch-Export nennen den Plan des jeweiligen Zyklus');
  E(`setDebugDate('2026-09-13')`);
  const exp = JSON.parse(E(`(function(){
    S._activePlanId = ${JSON.stringify(aufbau.rb)}; syncActivePlanToGlobals();   // Rainbow aufgeschlagen
    const patrick = S.cycles[0], run02 = S.cycles.find(x => x.id === 'run02');
    let md = '';
    const AltBlob = window.Blob, altUrl = URL.createObjectURL, altClick = HTMLAnchorElement.prototype.click;
    window.Blob = function (teile, opt) { md = teile.join(''); return new AltBlob(teile, opt); };
    URL.createObjectURL = () => 'blob:test';
    HTMLAnchorElement.prototype.click = function () {};
    try { exportDiary(); } finally { window.Blob = AltBlob; URL.createObjectURL = altUrl; HTMLAnchorElement.prototype.click = altClick; }
    const teile = md.split('\\n## ');
    const planZeile = (name) => { const t = teile.find(x => x.includes(' ' + name + '\\n')); const m = t && t.match(/Düngeplan:\\*\\* ([^\\n]*)/); return m ? m[1] : null; };
    return JSON.stringify({
      zusammenfassung: summarizeCycle(patrick).presetName, zusammenfassungRun02: summarizeCycle(run02).presetName,
      exportPatrick: planZeile(patrick.name), exportRun02: planZeile(run02.name), mdLaenge: md.length,
      pdfLiestGlobal: exportReportPDF.toString().includes('S.presetKey')
    });
  })()`));
  pruef('Tagebuch-Export wurde erzeugt', exp.mdLaenge > 0, exp.mdLaenge);
  pruef('Zusammenfassung: Patricks Zyklus → BioBizz Official', exp.zusammenfassung === 'BioBizz Official', exp.zusammenfassung);
  pruef('Zusammenfassung: Run 02 → Rainbow', exp.zusammenfassungRun02 === 'Rainbow Düngeplan (v1.0)', exp.zusammenfassungRun02);
  pruef('Tagebuch-Export: Patricks Zyklus mit BioBizz Official', exp.exportPatrick === 'BioBizz Official', exp.exportPatrick);
  pruef('Tagebuch-Export: Run 02 mit Rainbow', exp.exportRun02 === 'Rainbow Düngeplan (v1.0)', exp.exportRun02);
  pruef('PDF-Bericht liest nicht mehr den aufgeschlagenen Plan', exp.pdfLiestGlobal === false);

  // (v1.5.236) Fünf der elf Vorlagen führen kein weekFocus — darunter BioBizz Light, den der Assistent
  // Einsteigern empfiehlt. Der Tipp fiel dort ersatzlos weg. _planWochenFokus leitet ihn aus dem ab, was
  // die App über die Woche ohnehin weiß; ein eigener Tipp des Plans hat Vorrang.
  console.log('\nE - Pläne ohne eigenen Wochen-Tipp bekommen einen abgeleiteten');
  const abg = JSON.parse(E(`(function(){
    const p = FERT_PRESETS.biobizz_light;
    const plan = { presetKey: 'biobizz_light', medium: p.medium, weekPhases: p.weekPhases, schedule: p.schedule, products: p.products };
    return JSON.stringify({
      ohneEigene: Object.keys(p.weekFocus || {}).length,
      w2: _planWochenFokus(plan, 2), w5: _planWochenFokus(plan, 5),
      w11: _planWochenFokus(plan, 11), w12: _planWochenFokus(plan, 12),
      eigen: _planWochenFokus({ presetKey: 'rainbow_auto' }, 4),
      ph: phTargetFor(p.medium || 'erde').labelComma, dmin: DRAIN_ZIEL.min, dmax: DRAIN_ZIEL.max,
      ohneTipp: FERT_PRESETS ? Object.keys(FERT_PRESETS).filter(k => !Object.keys(FERT_PRESETS[k].weekFocus || {}).length) : []
    });
  })()`));
  pruef('BioBizz Light hat wirklich keinen eigenen Wochen-Tipp', abg.ohneEigene === 0, abg.ohneEigene);
  pruef('Betroffen waren fünf Vorlagen, nicht zwei', abg.ohneTipp.length === 5, abg.ohneTipp.join(', '));
  pruef('Woche 2 wird als Anzucht geführt', abg.w2 && abg.w2.phase === 'Anzucht', JSON.stringify(abg.w2));
  pruef('Woche 5 ist Blüte und nennt die Drain-Spanne aus DRAIN_ZIEL',
    !!abg.w5 && abg.w5.phase === 'Blüte' && abg.w5.tip.includes(abg.dmin + '–' + abg.dmax + ' %'), JSON.stringify(abg.w5));
  pruef('Der pH kommt aus phTargetFor, nicht aus einer festen Zahl',
    !!abg.w5 && abg.w5.tip.includes(abg.ph), abg.ph + ' | ' + (abg.w5 && abg.w5.tip));
  pruef('Woche 11 ist Spülen, Woche 12 IceFlush',
    !!abg.w11 && abg.w11.phase === 'Spülen' && !!abg.w12 && abg.w12.phase === 'IceFlush',
    JSON.stringify([abg.w11, abg.w12]));
  pruef('Ein eigener Tipp des Plans hat Vorrang', !!abg.eigen && /Stretch/.test(abg.eigen.phase), JSON.stringify(abg.eigen).slice(0, 120));
  pruef('Abgeleitete Tipps sind als solche gekennzeichnet, eigene nicht',
    !!abg.w5 && abg.w5._abgeleitet === true && !(abg.eigen && abg.eigen._abgeleitet));

  // Beim Einbau war zuerst die FALSCHE der beiden Wochen-Ansichten verdrahtet: `weekPlan` (der alte
  // Akkordeon-Editor) wird seit v1.5.52 gebaut, aber nie ausgegeben — im DOM stehen 0 Elemente mit
  // .wk-accordion. Gerendert wird _planSheet. Beide enthalten dieselbe Zeile, sie unterscheiden sich
  // nur in der Einrückung. Gefunden hat es nur die Sichtprüfung im Browser, während die Tests grün
  // waren — diese zwei Prüfungen halten es fest (v1.5.189: vor einem Fix an einer Anzeige die
  // Aufrufer suchen).
  pruef('Das lebende Plan-Blatt liest den abgeleiteten Tipp',
    E('typeof _planSheet === "function" && _planSheet.toString().includes("_planWochenFokus")') === true);
  pruef('Der tote Akkordeon-Editor wurde nicht verdrahtet',
    E('renderDuenger.toString().includes("_planWochenFokus")') === false);

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
