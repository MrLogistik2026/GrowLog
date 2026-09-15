/**
 * (v1.5.196) Der Hard-Dryback endet am Gießpunkt.
 *
 * Der Fehler: Hebe-Test-Bewertung, Banner und IceFlush-Status im Eintrag, Checkliste, Karte vor dem Spülen, Plan-Tipp und
 * Lexikon nannten „~35 %" als Ziel des Hard-Drybacks — nasser als der eigene Gießpunkt (Knopf „Knapp" = 30 %, GIESSPUNKT
 * 25–40 %). Unter 30 % hieß es „Federleicht — bereit für den IceFlush", auch unter 25 %, wo dieselbe Funktion sonst
 * Wasserstress meldet. Der einzige belegte Zweck des Hard-Drybacks ist, dass das Schmelzwasser im Topf bleibt — dafür reicht
 * der Gießpunkt (ANBAU.md 14). Dazu im Lexikon: CalMag 0,2 ml/L im letzten Guss (der letzte Guss ist ein Spülgang),
 * Drain-EC ≤ 0,4 als Ziel, „Kontaktzeit für den Kältereiz", „Trichome 70 %+ milchig".
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`S.beginnerMode = false`);

  // Patricks Endspurt: letzter Spülgang Tag 110, Hard-Dryback Tag 111–113, IceFlush Tag 114 (06.09.).
  const TAGE = JSON.parse(E(`(function(){ const c = S.cycles[0]; const t = {};
    for (let i = 100; i < 120; i++) { const d = isoPlus(c.startDate, i - 1); const cx = contextFor(c, d);
      if (cx && cx.isHardDryback && !t.hd) t.hd = d; if (getAction(d, c) === 'ice' && !t.ice) t.ice = d; }
    return JSON.stringify(t); })()`));

  await abschnitt('A - Hebe-Test-Bewertung im Hard-Dryback', async () => {
    const r = JSON.parse(E(`(function(){ return JSON.stringify([50, 40, 39, 30, 25, 24, 20].map(function (p) {
      const x = classifyRestPct(p, false, false, 'hardDryback'); return [p, x.label, x.text]; })); })()`));
    const label = Object.fromEntries(r.map(([p, l]) => [p, l]));
    pruef('50 % und 40 %: „Noch zu feucht — nicht gießen"', [50, 40].every(p => label[p] === 'Noch zu feucht — nicht gießen'), JSON.stringify([label[50], label[40]]));
    pruef('39, 30 und 25 %: „Gießpunkt erreicht — bereit für den IceFlush"', [39, 30, 25].every(p => label[p] === 'Gießpunkt erreicht — bereit für den IceFlush'),
      JSON.stringify([label[39], label[30], label[25]]));
    pruef('24 % und 20 %: „Trockener als der Gießpunkt — Blätter prüfen" (nicht mehr „federleicht — bereit")',
      [24, 20].every(p => label[p] === 'Trockener als der Gießpunkt — Blätter prüfen'), JSON.stringify([label[24], label[20]]));
    pruef('Keine „35" in Etiketten und Texten', r.every(([, l, t]) => !/35/.test(l) && !/35/.test(t)), JSON.stringify(r.map(([p, l]) => p + ':' + l)));
  });

  await abschnitt('B - Eintrag: Banner im Hard-Dryback, IceFlush-Status und Checkliste', async () => {
    pruef('Prüflage: Hard-Dryback-Tag und IceFlush-Tag gefunden', !!TAGE.hd && !!TAGE.ice, JSON.stringify(TAGE));
    E(`setDebugDate('${TAGE.hd}'); openEntry('${TAGE.hd}')`);
    await warte(200);
    const banner = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
    pruef('Banner: „bis der Topf den Gießpunkt erreicht", ohne ~35 % und ohne „Kältereiz"',
      /bis der Topf den Gießpunkt erreicht/.test(banner) && !/~35%|Kältereiz/.test(banner), (banner.match(/Hard-Dryback-Phase.{0,200}/) || [''])[0]);
    const status = (rest) => {
      E(`(function(){ const c = S.cycles[0]; const d = '${TAGE.ice}'; if (!S.entries[d]) S.entries[d] = { cycleData: {} };
        if (!S.entries[d].cycleData) S.entries[d].cycleData = {}; if (!S.entries[d].cycleData[c.id]) S.entries[d].cycleData[c.id] = { doses: {} };
        S.entries[d].cycleData[c.id].restPct = '${rest}'; setDebugDate(d); openEntry(d); })()`);
      return E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
    };
    // Am IceFlush-Tag zeigt der Eintrag nur die Überschrift der Bewertung (Gieß-Spalte, clf.text wird dort nicht ausgegeben).
    // Geprüft wird deshalb, was sichtbar ist: die Grenze. Vorher galt „bereit" bis einschließlich 40 % (restVal <= 40).
    const feucht = status(45);
    await warte(100);
    const grenze = status(40);
    await warte(100);
    const bereit = status(38);
    pruef('IceFlush-Tag 45 %: „noch zu feucht"', /IceFlush — noch zu feucht/.test(feucht), (feucht.match(/IceFlush —.{0,60}/) || [''])[0]);
    pruef('IceFlush-Tag 40 %: „noch zu feucht" — dieselbe Grenze wie die Bewertung (Gießpunkt unter 40 %)', /IceFlush — noch zu feucht/.test(grenze) && !/IceFlush bereit/.test(grenze),
      (grenze.match(/IceFlush (bereit|—).{0,60}/) || [''])[0]);
    pruef('IceFlush-Tag 38 %: bereit', /IceFlush bereit/.test(bereit), (bereit.match(/IceFlush bereit.{0,80}/) || [''])[0]);
    pruef('Checkliste: „Hard-Dryback: Gießpunkt erreicht (25–40 % Restgewicht"', /Hard-Dryback: Gießpunkt erreicht \(25–40 % Restgewicht/.test(bereit) && !/~35% Restgewicht/.test(bereit));
  });

  await abschnitt('C - Lexikon, Plan-Tipp, Quelltext', async () => {
    const r = JSON.parse(E(`(function(){ const alle = LEXIKON.flatMap(function (c) { return c.items; });
      const g = function (t) { const i = alle.find(function (x) { return x.t === t; }); return i ? [i.brief, i.mechanism, i.practice, i.pitfall].join(' ') : null; };
      return JSON.stringify({ hd: g('Hard Dryback (Ernte-Vorbereitung)'), ice: g('IceFlush'), plan: JSON.stringify(FERT_PRESETS.biobizz_konservativ) }); })()`));
    const altHd = /~35|35%|~50%|70%\+ milchig|CalMag|≤ 0\.4|Kontaktzeit|Kältereiz|triggert leichten Stress|~100 ml/;
    pruef('Lexikon „Hard Dryback": Gießpunkt statt ~35 %, ohne CalMag-Dosis, Drain-EC-Ziel und Kältereiz',
      !!r.hd && !altHd.test(r.hd) && /Gießpunkt/.test(r.hd), (r.hd || '').match(altHd) ? (r.hd || '').match(altHd)[0] : 'Gießpunkt fehlt');
    pruef('Lexikon „IceFlush": Hard-Dryback bis zum Gießpunkt, kein CalMag im letzten Guss', !!r.ice && !/~35% Restgewicht|CalMag \(0\.2 ml\/L\)/.test(r.ice) && /bis der Topf den Gießpunkt erreicht/.test(r.ice));
    pruef('Plan-Tipp BioBizz konservativ Woche 11 ohne ~35 %', !/~35%/.test(r.plan));
    const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    const alt = ['auf etwa <b>35%</b>', 'Auf dem Weg zu ~35%', '~35% trocknen lassen', 'bei ~35% sein', '~35% Restgewicht', 'optimaler Kältereiz', '30–35 % Restgewicht',
      'auf etwa 35% abtrocknen', 'Federleicht — bereit für den IceFlush'].filter(s => code.includes(s));
    pruef('Keine ~35-%-Ziele mehr im Code', alt.length === 0, alt.join(' | '));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
