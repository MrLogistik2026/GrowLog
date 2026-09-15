/**
 * (v1.5.180) „Gießen überfällig" meint einen verpassten geplanten Gießtag — nicht die Trocknung.
 *
 * Beim Browser-Check von v1.5.177 gesehen: Patricks Startseite zeigte am 15.09.2026 (Tag 123, Trocknung) „Gießen
 * überfällig! Letztes: vor 13d (Intervall: 1d)". getAlerts verglich nur den Abstand zum letzten Guss mit dem
 * Intervall der Phase — nach der Ernte, im Hard-Dryback und am IceFlush wird aber absichtlich nicht gegossen. Die
 * Warnung folgt jetzt isGiessTag, derselben Regel wie Kalender, Gieß-Fahrplan und Startseite.
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('\nA - Trocknung (15.09.2026, Tag 123)');
  {
    const r = JSON.parse(E(`(function(){ setDebugDate('2026-09-15'); const c = S.cycles[0]; c.active = true;
      const a = getAlerts(c).map(x => x.text);
      goTo('dash'); renderDash();
      return JSON.stringify({ phase: phase(todayISO(), c).ph, alerts: a, dash: /Gießen überfällig/.test(document.getElementById('scr-dash').textContent) }); })()`));
    pruef(`Prüflage: Phase ${r.phase}`, r.phase === 'dry', r.phase);
    pruef('Keine Warnung „Gießen überfällig" nach der Ernte', !r.alerts.some(t => /überfällig/.test(t)), r.alerts.join(' | '));
    pruef('Kein Tipp „Gießrhythmus schwankt" nach der Ernte', !r.alerts.some(t => /Gießrhythmus schwankt/.test(t)), r.alerts.join(' | '));
    pruef('Startseite zeigt keine Überfällig-Warnung', !r.dash);
  }

  console.log('\nB - Gegenprobe Blüte: ein geplanter Gießtag ist wirklich verpasst');
  {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0];
      Object.keys(S.entries).filter(k => k >= '2026-07-11' && k <= '2026-07-20').forEach(k => {
        const cd = S.entries[k].cycleData && S.entries[k].cycleData[c.id]; if (cd) delete cd.water; });
      setDebugDate('2026-07-20');
      const geplant = []; for (let d = 11; d <= 18; d++) { const iso = '2026-07-' + String(d).padStart(2, '0'); if (isGiessTag(iso, c)) geplant.push(iso); }
      return JSON.stringify({ phase: phase(todayISO(), c).ph, geplant, alerts: getAlerts(c).map(x => x.text) }); })()`));
    const w = r.alerts.find(t => /überfällig/.test(t)) || '';
    pruef(`Blüte (${r.phase}), geplante Gießtage ${r.geplant.join(', ')} ohne Guss: Warnung nennt den verpassten Tag`,
      r.geplant.length > 0 && /Geplant war der \d\d\.\d\d\./.test(w) && /letzte Guss ist \d+ Tage her/.test(w), w || r.alerts.join(' | '));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
