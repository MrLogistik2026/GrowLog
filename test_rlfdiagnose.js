/**
 * (v1.5.155) Der Diagnose-Kontext kennt „Luftfeuchte hoch" ab derselben Grenze wie der Schimmel-Alarm.
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft): buildDiagnosticContext setzte humidityHigh erst
 * ab 70 % RLF. getCriticalWarning meldet in der Spätblüte schon über 60 % „Schimmelgefahr (Botrytis)",
 * in der mittleren Blüte über 65 % „Schimmelrisiko" (ANBAU.md 13.5). Bei 62–69 % stand im Eintrag rot
 * „Schimmelgefahr", und der Symptom-Checker nannte die Luftfeuchte nicht als Grund.
 *
 * Gegenprobe nach dem Hinweis des Gegenprüfers: Außerhalb der Blüte bleibt 70 % die Grenze — sie trägt
 * dort auch Calcium-Mangel und Mehltau.
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

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const tage = JSON.parse(E(`(function(){
    const c = S.cycles[0]; const t = {};
    for (let i = 20; i < 140; i++) {
      const iso = isoPlus(c.startDate, i); const p = phase(iso, c); if (!p) continue;
      const key = p.ph === 'bloom' ? 'bloom_' + bluetestufe(p) : p.ph;
      if (!t[key]) t[key] = iso;
    }
    return JSON.stringify(t);
  })()`));
  console.log('    Tage: ' + ['anzucht', 'bloom_mittel', 'bloom_spaet', 'flush'].map(k => k + ' ' + tage[k]).join(' · '));
  pruef('Prüflage: Anzucht, mittlere und späte Blüte, Spülen gefunden', ['anzucht', 'bloom_mittel', 'bloom_spaet', 'flush'].every(k => tage[k]), JSON.stringify(tage));

  // Luftfeuchte an genau diesem Tag setzen und den Kontext bauen
  const kontext = (iso, rlf) => JSON.parse(E(`(function(){
    const c = S.cycles[0]; const iso = '${iso}';
    if (!S.entries[iso]) S.entries[iso] = { temp: '', humidity: '', cycleData: {} };
    if (!S.entries[iso].cycleData) S.entries[iso].cycleData = {};
    if (!S.entries[iso].cycleData[c.id]) S.entries[iso].cycleData[c.id] = { doses: {} };
    S.entries[iso].humidity = '${rlf}';
    const ctx = buildDiagnosticContext(c, iso);
    const w = getCriticalWarning('rlf', ${rlf}, phase(iso, c), c);
    return JSON.stringify({ hoch: !!ctx.humidityHigh, warnung: w ? w.level : null });
  })()`));

  console.log('\nA - In der Blüte und beim Spülen: dieselbe Grenze wie der Schimmel-Alarm');
  const faelle = [
    ['Spätblüte', tage.bloom_spaet, 62, true], ['Spätblüte', tage.bloom_spaet, 59, false],
    ['mittlere Blüte', tage.bloom_mittel, 66, true], ['mittlere Blüte', tage.bloom_mittel, 62, false],
    ['Spülen', tage.flush, 62, true],
  ];
  for (const [name, iso, rlf, soll] of faelle) {
    const r = kontext(iso, rlf);
    pruef(`${name}, ${rlf} % → „Luftfeuchte hoch" ${soll ? 'ja' : 'nein'} (Eintrag: ${r.warnung || 'keine Warnung'})`, r.hoch === soll && (!!r.warnung === soll), JSON.stringify(r));
  }

  console.log('\nB - Gegenprobe außerhalb der Blüte: 70 % bleibt die Grenze');
  {
    const r66 = kontext(tage.anzucht, 66), r72 = kontext(tage.anzucht, 72);
    pruef('Anzucht, 66 % → nein', r66.hoch === false, JSON.stringify(r66));
    pruef('Anzucht, 72 % → ja (trägt Calcium-Mangel und Mehltau)', r72.hoch === true, JSON.stringify(r72));
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
