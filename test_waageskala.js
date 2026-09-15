/**
 * (v1.5.204) Eine Waage-Skala: Das zweite Gewicht ist der Gießpunkt.
 *
 * Der Fehler (Befund der Gießmengen-Prüfung, Runde 3): Die Waage-Einrichtung fragt in Schritt 2 nach dem Gewicht „kurz bevor
 * du normalerweise gießen würdest", der Titel sagte „bone-dry". Die Bewertung setzte dieses Gewicht auf 0 % — am normalen
 * Gießtag stand „Wasserstress". Das Mengenmodell setzte dasselbe Gewicht auf 20 %. Bei 12500 g (voll 14000, Schritt 2 11000)
 * zeigte die Bewertung 50 %, das Mengenmodell rechnete mit 60 %. Fehlte eines der beiden Gewichte, schätzte die App es mit
 * einer Faustformel (trocken = 35 % von voll, voll = trocken × 2,85) und bewertete das Ergebnis wie eine Messung.
 *
 * Jetzt: Das zweite Gewicht liegt auf dem Anker des Substrats (Erde „Knapp" 30, Coco „Mittel" 70, giesspunktFor) —
 * Restgewicht = A + (100 − A) · (g − Gießpunkt) / (voll − Gießpunkt), in Bewertung, Mengenmodell und Verlauf gleich. Ohne
 * zweites Gewicht keine Zahl (ANBAU.md 15: Messwerte werden nie geschätzt).
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
  E(`S.beginnerMode = false; S._setUI = S._setUI || {}; S._setUI.entryGiess = false`);

  const d = E(`(function(){ const c = S.cycles[0]; for (let i = 60; i < 100; i++) { const x = isoPlus(c.startDate, i - 1); if (getAction(x, c) === 'giess') return x; } return null; })()`);
  const setze = (medium, sat, dry, g) => E(`(function(){ const c = S.cycles[0]; c.medium = '${medium}'; c.weightMode = 'scale';
    c.saturatedWeight = ${sat}; c.dryWeight = ${dry === null ? 'null' : dry};
    const cd = S.entries['${d}'].cycleData[c.id]; cd.weightG = '${g}'; delete cd.restPct; setDebugDate('${d}'); openEntry('${d}'); })()`);
  const text = () => E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);

  await abschnitt('A - Die Skala', async () => {
    pruef('Prüflage: Blüte-Gießtag gefunden', !!d, d);
    const r = JSON.parse(E(`JSON.stringify([calcRestPct(12500, 14000, 11000, 30), calcRestPct(11000, 14000, 11000, 30), calcRestPct(14000, 14000, 11000, 30),
      calcRestPct(12500, 14000, 12500, 70), calcRestPct(11500, 14000, 12500, 70)])`));
    pruef('Erde (Anker 30): 12500 g → 65 %, 11000 g → 30 %, 14000 g → 100 %', r[0] === 65 && r[1] === 30 && r[2] === 100, JSON.stringify(r));
    pruef('Coco (Anker 70): 12500 g → 70 %, 11500 g → 50 %', r[3] === 70 && r[4] === 50, JSON.stringify(r));
  });

  await abschnitt('B - Eintrag mit Waage', async () => {
    setze('erde', 14000, 11000, 12500);
    await warte(150);
    const a = text();
    pruef('Erde, 12500 g: „65%" und „Noch feucht" (vorher 50 %, „Bald gießen")', /65%/.test(a) && /Noch feucht/.test(a) && !/\b50%/.test(a), (a.match(/Waage.{0,200}/) || [''])[0]);
    setze('erde', 14000, 11000, 11000);
    await warte(150);
    const b = text();
    pruef('Erde, 11000 g (kurz vor dem Gießen): „30%" und „Sweet Spot" statt 0 % und „Wasserstress"', /30%/.test(b) && /Sweet Spot/.test(b) && !/Wasserstress/.test(b), (b.match(/Waage.{0,200}/) || [''])[0]);
    setze('coco', 14000, 12500, 12500);
    await warte(150);
    const c = text();
    pruef('Coco, 12500 g: „70%" und „Jetzt gießen"', /70%/.test(c) && /Jetzt gießen/.test(c), (c.match(/Waage.{0,200}/) || [''])[0]);
    pruef('Beschriftung unter dem Feld: „Gießpunkt … g" und „Voll … g" statt „Dry"/„Sat"', /Gießpunkt 12500 g/.test(c) && /Voll 14000 g/.test(c) && !/Dry 12500g/.test(c), (c.match(/.{0,30}14000.{0,30}/) || [''])[0]);
  });

  await abschnitt('C - Mengenmodell mit derselben Skala', async () => {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0]; c.medium = 'erde'; c.weightMode = 'scale'; c.saturatedWeight = 14000; c.dryWeight = 11000;
      const cd = S.entries['${d}'].cycleData[c.id]; cd.weightG = '12500';
      const p = phase('${d}', c); const ci = _waterConsumptionInfo(c, p, '${d}'); const n = _waterDailyNeedPour(c, p, '${d}');
      return JSON.stringify({ cap: ci.capMl, quelle: ci.capSource, rest: n.restNow, gemessen: n.measured }); })()`));
    pruef('Kapazität aus der Waage: (14000 − 11000) · 80 / 70 = 3429 ml (vorher 3000)', r.cap === 3429 && r.quelle === 'scale', JSON.stringify(r));
    pruef('Restgewicht im Mengenmodell 65 % wie in der Bewertung (vorher 60)', r.rest === 65 && r.gemessen === true, JSON.stringify(r));
  });

  await abschnitt('D - Nur ein Gewicht: keine Schätzung', async () => {
    setze('erde', 14000, null, 12500);
    await warte(150);
    const a = text();
    pruef('Nur das volle Gewicht: „Zweites Gewicht fehlt", kein Schätzmodus, kein Restgewicht', /Zweites Gewicht fehlt/.test(a) && !/Schätzmodus/.test(a) && !/geschätzt/.test(a), (a.match(/Waage.{0,220}/) || [''])[0]);
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0]; const p = phase('${d}', c); const ci = _waterConsumptionInfo(c, p, '${d}'); return JSON.stringify({ quelle: ci.capSource }); })()`));
    pruef('Mengenmodell: ohne zweites Gewicht keine Waage-Kapazität', r.quelle !== 'scale', JSON.stringify(r));
  });

  await abschnitt('E - Einrichtung und Quelltext', async () => {
    const roh = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    const code = roh.split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    pruef('Schritt 2 heißt „Gewicht kurz vor dem Gießen", Einstellungen zeigen den Anker', code.includes('Schritt 2: Gewicht kurz vor dem Gießen') && code.includes('Kurz vor dem Gießen (${giesspunktFor(sel).anker} %)'));
    const alt = ['bone-dry', '* 2.85', '* 0.35)', 'Schätzmodus aktiv', '20 + (cur - c.dryWeight) / span * 80', ', c.dryWeight)', ', cyc.dryWeight)', 'Trocken (0%)'].filter(s => code.includes(s));
    pruef('Keine zweite Skala, keine Faustformel, jede Umrechnung mit Anker', alt.length === 0, alt.join(' | '));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
