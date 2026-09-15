/**
 * (v1.5.198) Reste des alten Hard-Dryback-Ziels in IceFlush-Anleitung, IceFlush-Status und Hebe-Test-Vorgabe.
 *
 * Der Fehler: v1.5.196 hat den Hard-Dryback an den Gießpunkt gelegt, aber sechs Stellen übersehen. Die IceFlush-Anleitung
 * im Eintrag sagte „Hard Dryback auf 35% — letzter Guss mit CalMag 0.2 ml/L", „Töpfe auf Drain-Schalen (Schmelzwasser
 * läuft ab)", „Drain EC messen (sollte ≤ 0.4)" und „Topf bleibt knochentrocken bis zur Ernte!". Die Hebe-Test-Vorgabe
 * rechnete am IceFlush-Tag mit 20 % („knochentrocken") und an Spültagen mit 35 %; am IceFlush-Tag stand deshalb ohne
 * eigene Messung „IceFlush bereit — Hard Dryback erreicht · ~20 %" und dazu „perfekt für IceFlush" — unter dem Gießpunkt,
 * wo dieselbe App sonst Wasserstress meldet. Die Bewertung in der IceFlush-Phase sagte „er nimmt das Schmelzwasser langsam
 * auf", der Plan „BioBizz Master" in Woche 12 „Topf nach dem Flush knochentrocken werden lassen".
 *
 * Der Zweck des Hard-Drybacks ist allein, dass das Schmelzwasser im Topf bleibt (ANBAU.md 14) — dann gibt es auch keinen
 * Drain, dessen EC man messen könnte.
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

  // Patricks Endspurt: Spülgänge Tag 107 und 110, IceFlush Tag 114.
  const T = JSON.parse(E(`(function(){ const c = S.cycles[0]; const t = { spuel: [] };
    for (let i = 100; i < 120; i++) { const d = isoPlus(c.startDate, i - 1); const a = getAction(d, c);
      if (a === 'spuelen') t.spuel.push(d); if (a === 'ice' && !t.ice) t.ice = d; }
    return JSON.stringify(t); })()`));

  await abschnitt('A - IceFlush-Anleitung im Eintrag', async () => {
    pruef('Prüflage: IceFlush-Tag und zwei Spültage gefunden', !!T.ice && T.spuel.length >= 2, JSON.stringify(T));
    const html = kurz(E(`_renderIceFlushPanel(S.cycles[0], '${T.ice}')`));
    const alt = /Hard Dryback auf 35|CalMag 0\.2|knochentrocken|Schmelzwasser läuft ab|Drain EC messen/;
    pruef('Kein „Hard Dryback auf 35 %", kein CalMag im letzten Guss, kein „knochentrocken", kein Drain-EC nach dem Schmelzen',
      !alt.test(html), (html.match(new RegExp('.{0,40}(' + alt.source + ').{0,40}')) || [''])[0]);
    pruef('Timeline und Schritte: Hard-Dryback bis zum Gießpunkt, das Schmelzwasser bleibt im Topf',
      /Hard-Dryback: nach dem letzten Spülgang nicht mehr gießen, bis der Topf den Gießpunkt erreicht \(25–40 % Restgewicht\)/.test(html)
      && /Nach dem IceFlush wird bis zur Ernte nicht mehr gegossen — das Schmelzwasser bleibt im Topf/.test(html));
  });

  await abschnitt('B - Hebe-Test-Vorgabe am Spül- und IceFlush-Tag', async () => {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0]; const d = '${T.spuel[1]}';
      const cd = S.entries[d] && S.entries[d].cycleData && S.entries[d].cycleData[c.id];
      const alt = cd ? { water: cd.water, lift: cd.liftAfterPct } : null;
      if (cd) { delete cd.water; delete cd.liftAfterPct; }
      const spuel = intervalDryDefault(c, d);
      if (cd && alt) { if (alt.water !== undefined) cd.water = alt.water; if (alt.lift !== undefined) cd.liftAfterPct = alt.lift; }
      const ice = intervalDryDefault(c, '${T.ice}');
      return JSON.stringify({ spuel: [spuel.pct, spuel.source], ice: [ice.pct, ice.source] }); })()`));
    pruef('Zweiter Spültag ohne Eintrag: Vorgabe 30 % („Knapp") statt 35 %', r.spuel[0] === 30 && r.spuel[1] === 'due', JSON.stringify(r.spuel));
    pruef('IceFlush-Tag: Vorgabe 30 % statt 20 % („knochentrocken")', r.ice[0] === 30 && r.ice[1] === 'due', JSON.stringify(r.ice));
  });

  await abschnitt('C - IceFlush-Status im Eintrag', async () => {
    const zeige = (rest) => {
      E(`(function(){ const c = S.cycles[0]; const d = '${T.ice}'; if (!S.entries[d]) S.entries[d] = { cycleData: {} };
        if (!S.entries[d].cycleData) S.entries[d].cycleData = {}; if (!S.entries[d].cycleData[c.id]) S.entries[d].cycleData[c.id] = { doses: {} };
        const cd = S.entries[d].cycleData[c.id]; if (${rest === null}) { delete cd.restPct; delete cd.weightG; } else cd.restPct = '${rest}';
        setDebugDate(d); openEntry(d); })()`);
      return E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
    };
    const ohne = zeige(null);
    await warte(100);
    pruef('Ohne eigene Messung: „IceFlush bereit — Gießpunkt erreicht" bei ~30 %, nicht „perfekt" bei ~20 %',
      /IceFlush bereit — Gießpunkt erreicht/.test(ohne) && /Topf bei ~30% Restgewicht — trocken genug, dass das Schmelzwasser im Topf bleibt/.test(ohne) && !/perfekt für IceFlush/.test(ohne),
      (ohne.match(/IceFlush (bereit|—).{0,160}/) || [''])[0]);
    const trocken = zeige(20);
    await warte(100);
    pruef('Bei 20 %: „trockener als der Gießpunkt", mit dem Rat bei hängenden Blättern',
      /IceFlush — Topf trockener als der Gießpunkt/.test(trocken) && /unter 25 %\. Hängen die Blätter, ist das Wasserstress/.test(trocken) && !/IceFlush bereit/.test(trocken),
      (trocken.match(/IceFlush (bereit|—).{0,160}/) || [''])[0]);
    const r = JSON.parse(E(`JSON.stringify(classifyRestPct(30, false, false, 'ice'))`));
    pruef('Bewertung in der IceFlush-Phase: „das Schmelzwasser bleibt im Topf" statt „nimmt es langsam auf"',
      /das Schmelzwasser bleibt im Topf/.test(r.text) && !/langsam auf/.test(r.text), r.text);
  });

  await abschnitt('D - Plan-Tipp, Quelltext', async () => {
    const tip = E(`FERT_PRESETS.biobizz_master.weekFocus[12].tip`);
    pruef('„BioBizz Master" Woche 12 ohne „knochentrocken"', !/knochentrocken/.test(tip) && /Gießpunkt/.test(tip), tip);
    const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    const alt = ['Hard Dryback auf 35%', 'CalMag 0.2 ml/L', 'Topf bleibt knochentrocken', 'Schmelzwasser läuft ab', 'Drain EC messen', 'perfekt für IceFlush',
      'nimmt das Schmelzwasser langsam auf', 'Topf nach dem Flush knochentrocken', "targetPct = 35", "targetPct = 20", 'Hard Dryback erreicht'].filter(s => code.includes(s));
    pruef('Keine Reste des alten Hard-Dryback-Ziels im Code', alt.length === 0, alt.join(' | '));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
