/**
 * (v1.5.200) Coco nach dem Coco-Gießpunkt.
 *
 * Der Fehler: Die Hebe-Test-Vorgabe setzte am fälligen Gießtag für jedes Substrat 30 % („Knapp") — in Coco meldete die
 * Bewertung damit an jedem Gießtag „Wasserstress" (Befund der Gießmengen-Prüfung, Runde 3). Im Hard-Dryback, am
 * IceFlush-Tag, in Banner, Checkliste und Timeline galten für Coco die Erde-Grenzen: „Noch zu feucht — nicht gießen" bis
 * unter 40 %, wo die Coco-Bewertung sonst „Wasserstress" sagt. Die Dryback-Vorhersage zielte in Coco auf 60 %, der Knopf
 * „Mittel" steht für 70. Texte nannten „~60–70 %", die Bewertung sagt „Jetzt gießen" von 60 bis 85 %.
 *
 * Coco hat kaum Austauschkapazität und verzeiht Austrocknen schlecht (ANBAU.md 7.1); der Gießpunkt liegt beim Knopf
 * „Mittel". Das reicht auch für den Zweck des Hard-Drybacks, Platz für das Schmelzwasser im Topf (ANBAU.md 14).
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

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
async function abschnitt(titel, fn) {
  console.log('\n' + titel);
  try { await fn(); } catch (e) { pruef(titel + ' — lief ohne Fehler', false, String(e && e.message || e).slice(0, 160)); }
}
const kurz = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`S.beginnerMode = false; S._setUI = S._setUI || {}; S._setUI.entryGiess = false`);

  // Patricks Zyklus, als Coco-Grow gelesen: zwei aufeinanderfolgende Blüte-Gießtage mit Wasser, Hard-Dryback-Tag, IceFlush-Tag.
  const T = JSON.parse(E(`(function(){ const c = S.cycles[0]; const t = {};
    const hatWasser = function (d) { const cd = S.entries[d] && S.entries[d].cycleData && S.entries[d].cycleData[c.id]; return !!(cd && parseFloat(cd.water) > 0); };
    for (let i = 50; i < 120; i++) { const d = isoPlus(c.startDate, i - 1); const a = getAction(d, c); const cx = contextFor(c, d);
      if (!t.giess && a === 'giess' && !cx.isFinisher && hatWasser(d) && getAction(isoPlus(d, -3), c) === 'giess' && hatWasser(isoPlus(d, -3))) t.giess = d;
      if (cx && cx.isHardDryback && !t.hd) t.hd = d; if (a === 'ice' && !t.ice) t.ice = d; }
    return JSON.stringify(t); })()`));

  await abschnitt('A - Konstante und Vorgabe am Gießtag', async () => {
    pruef('Prüflage: Gießtag, Hard-Dryback-Tag und IceFlush-Tag gefunden', !!T.giess && !!T.hd && !!T.ice, JSON.stringify(T));
    const g = JSON.parse(E(`JSON.stringify(typeof GIESSPUNKT !== 'undefined' ? GIESSPUNKT.coco || null : null)`));
    pruef('GIESSPUNKT.coco: 60–85 %, Anker 70, Knopf „Mittel"', !!g && g.von === 60 && g.bis === 85 && g.anker === 70 && g.knopf === 'Mittel', JSON.stringify(g));
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0]; const d = '${T.giess}'; const cd = S.entries[d].cycleData[c.id];
      const w = cd.water, l = cd.liftAfterPct; delete cd.water; delete cd.liftAfterPct;
      const coco = Object.assign({}, c, { medium: 'coco' }), erde = Object.assign({}, c, { medium: 'erde' });
      const vc = intervalDryDefault(coco, d), ve = intervalDryDefault(erde, d);
      const kc = contextFor(coco, d), ke = contextFor(erde, d);
      const lc = classifyRestPct(vc.pct, kc.isFinisher, kc.isCoco, kc.noWaterPhase), le = classifyRestPct(ve.pct, ke.isFinisher, ke.isCoco, ke.noWaterPhase);
      cd.water = w; if (l !== undefined) cd.liftAfterPct = l;
      return JSON.stringify({ coco: [vc.pct, vc.source, lc && lc.label], erde: [ve.pct, ve.source, le && le.label] }); })()`));
    pruef('Coco am fälligen Gießtag: Vorgabe 70 („Mittel"), „Jetzt gießen" statt 30 und „Wasserstress"',
      r.coco[0] === 70 && r.coco[1] === 'due' && r.coco[2] === 'Jetzt gießen', JSON.stringify(r.coco));
    pruef('Erde am fälligen Gießtag unverändert: 30, „Sweet Spot — jetzt gießen"', r.erde[0] === 30 && r.erde[1] === 'due' && /Sweet Spot/.test(r.erde[2] || ''), JSON.stringify(r.erde));
    const b = JSON.parse(E(`JSON.stringify([84, 85, 60, 59].map(function (p) { return classifyRestPct(p, false, true).label; }))`));
    pruef('Coco-Bewertung an den Grenzen unverändert: 84 „Jetzt gießen", 85 „Frisch gegossen", 60 „Jetzt gießen", 59 „Zu trocken für Coco"',
      b[0] === 'Jetzt gießen' && b[1] === 'Frisch gegossen' && b[2] === 'Jetzt gießen' && b[3] === 'Zu trocken für Coco', JSON.stringify(b));
  });

  await abschnitt('B - Hard-Dryback und IceFlush in Coco', async () => {
    const r = JSON.parse(E(`JSON.stringify({ coco: [90, 70, 50].map(function (p) { const x = classifyRestPct(p, false, true, 'hardDryback'); return [x.label, x.text]; }),
      erde: [45, 30, 20].map(function (p) { return classifyRestPct(p, false, false, 'hardDryback').label; }) })`));
    pruef('Coco 90 / 70 / 50 %: „Noch zu feucht" / „Gießpunkt erreicht" / „Trockener als der Gießpunkt"',
      r.coco[0][0] === 'Noch zu feucht — nicht gießen' && r.coco[1][0] === 'Gießpunkt erreicht — bereit für den IceFlush' && r.coco[2][0] === 'Trockener als der Gießpunkt — Blätter prüfen',
      JSON.stringify(r.coco.map(x => x[0])));
    pruef('Coco 90 %: Text nennt den Coco-Gießpunkt (60–85 %, Hebe-Test „Mittel")', /60–85 %, Hebe-Test „Mittel"/.test(r.coco[0][1]), r.coco[0][1]);
    pruef('Erde unverändert: 45 „Noch zu feucht", 30 „Gießpunkt erreicht", 20 „Trockener als der Gießpunkt"',
      r.erde[0] === 'Noch zu feucht — nicht gießen' && r.erde[1] === 'Gießpunkt erreicht — bereit für den IceFlush' && r.erde[2] === 'Trockener als der Gießpunkt — Blätter prüfen', JSON.stringify(r.erde));
    E(`S.cycles[0].medium = 'coco'`);
    E(`setDebugDate('${T.hd}'); openEntry('${T.hd}')`);
    await warte(150);
    const hd = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
    pruef('Coco, Hard-Dryback-Tag: Banner nennt 60–85 % und „Mittel"', /bis der Topf den Gießpunkt erreicht \(60–85 % Restgewicht, Hebe-Test „Mittel"\)/.test(hd),
      (hd.match(/Hard-Dryback-Phase.{0,220}/) || [''])[0]);
    E(`(function(){ const c = S.cycles[0]; const d = '${T.ice}'; if (!S.entries[d]) S.entries[d] = { cycleData: {} };
      if (!S.entries[d].cycleData) S.entries[d].cycleData = {}; if (!S.entries[d].cycleData[c.id]) S.entries[d].cycleData[c.id] = { doses: {} };
      S.entries[d].cycleData[c.id].restPct = '70'; setDebugDate(d); openEntry(d); })()`);
    await warte(150);
    const ice = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
    pruef('Coco, IceFlush-Tag bei 70 %: „IceFlush bereit — Gießpunkt erreicht" statt „noch zu feucht"', /IceFlush bereit — Gießpunkt erreicht/.test(ice) && !/IceFlush — noch zu feucht/.test(ice),
      (ice.match(/IceFlush (bereit|—) [^▸▾]{0,80}/) || [''])[0]);
    pruef('Coco, IceFlush-Anleitung: Checkliste und Timeline mit 60–85 %',
      /Hard-Dryback: Gießpunkt erreicht \(60–85 % Restgewicht/.test(ice) && /bis der Topf den Gießpunkt erreicht \(60–85 % Restgewicht\)/.test(ice));
  });

  await abschnitt('C - Vorhersage, Gießanleitung, Lexikon, Quelltext', async () => {
    const f = JSON.parse(E(`(function(){ _waterConsumptionInfo = function () { return { ratePctPerDay: 10, rateSamples: 3 }; };
      _vpdFactorForDay = function () { return 1; };
      const c = S.cycles[0]; const d = '${T.giess}'; const cd = S.entries[d].cycleData[c.id]; delete cd.liftAfterPct; cd.restPct = '95';
      return JSON.stringify(drybackForecast(c, phase(d, c), d)); })()`));
    pruef('Coco: Dryback-Vorhersage zielt auf 70 („Mittel") statt 60', !!f && f.targetPct === 70, JSON.stringify(f));
    E(`(function(){ const d = '${T.giess}'; setDebugDate(d); openEntry(d); })()`);
    await warte(150);
    const g = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
    pruef('Coco, Gießanleitung: Gießpunkt „Hebe-Test „Mittel“, 60–85 % Restgewicht" statt „~60–70 %"', /Hebe-Test „Mittel“, 60–85 % Restgewicht/.test(g) && !/60–70/.test(g),
      (g.match(/③ Gießpunkt:.{0,120}/) || ['(Gießanleitung fehlt)'])[0]);
    E(`S.cycles[0].medium = 'erde'`);
    const lex = JSON.parse(E(`(function(){ const alle = LEXIKON.flatMap(function (c) { return c.items; });
      const g = function (t) { const i = alle.find(function (x) { return x.t === t; }); return i ? [i.brief, i.mechanism, i.practice, i.pitfall].join(' ') : ''; };
      return JSON.stringify({ hd: g('Hard Dryback (Ernte-Vorbereitung)'), rest: g('Restgewicht (Dryback · Trocken-Nass-Zyklus)') }); })()`));
    pruef('Lexikon „Hard Dryback": nennt den Coco-Gießpunkt', /in Coco beim Hebe-Test „Mittel“ \(60–85 %\)/.test(lex.hd), kurz(lex.hd).slice(0, 300));
    pruef('Lexikon „Restgewicht": Coco „Mittel“ (60–85 %)', /beim Hebe-Test „Mittel“ \(60–85 %\)/.test(lex.rest) && !/60–70/.test(lex.rest));
    const roh = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    const code = roh.split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    const alt = ['etwa 60–70 %', '~60–70%', 'isCoco ? 60'].filter(s => code.includes(s));
    pruef('Sämlings-Hinweis aus giesspunktFor, keine festen Coco-Zahlen mehr', roh.includes('const _gpc = giesspunktFor(c)') && alt.length === 0, alt.join(' | '));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
