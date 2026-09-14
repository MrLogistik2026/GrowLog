/**
 * (v1.5.149) Schimmel-Alarm auch beim Spülen und am IceFlush.
 *
 * Der Fehler (Befund der Prüf-Agenten, vom Gegenprüfer verschärft): getCriticalWarning meldete
 * „Schimmelgefahr (Botrytis)" ab 60 % RLF nur in der Spätblüte. Spülen und IceFlush sind eigene
 * Phasen — dort kam zwischen 60 und 80 % RLF gar nichts, obwohl getPhaseTargets für beide
 * 40–50 % nennt und die Blüten in diesen letzten Tagen am dichtesten sind (ANBAU.md 13.5).
 *
 * Gegenproben: Spätblüte, mittlere Blüte, Anzucht und Trocknen verhalten sich wie vorher.
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

  // Je ein Tag aus Patricks Run 01 für jede Lage
  const tage = JSON.parse(E(`(function(){
    const c = S.cycles[0]; const t = {};
    for (let i = 0; i < 140; i++) {
      const iso = isoPlus(c.startDate, i); const p = phase(iso, c); if (!p) continue;
      const key = p.ph === 'bloom' ? 'bloom_' + bluetestufe(p) : p.ph;
      if (!t[key]) t[key] = iso;
    }
    return JSON.stringify(t);
  })()`));
  console.log('    Tage: ' + Object.entries(tage).map(([k, v]) => k + ' ' + v).join(' · '));
  pruef('Prüflage: Spülen, IceFlush, Spät- und mittlere Blüte, Anzucht und Trocknen gefunden',
    ['flush', 'ice', 'bloom_spaet', 'bloom_mittel', 'anzucht', 'dry'].every(k => tage[k]), JSON.stringify(tage));

  const stufe = (iso, rlf) => JSON.parse(E(`(function(){
    const c = S.cycles[0]; const w = getCriticalWarning('rlf', ${rlf}, phase('${iso}', c), c);
    return JSON.stringify(w ? { level: w.level, title: w.title, action: w.action } : null);
  })()`));

  console.log('\nA - Spülen und IceFlush');
  for (const [name, iso] of [['Spülen', tage.flush], ['IceFlush', tage.ice]]) {
    const w62 = stufe(iso, 62), w70 = stufe(iso, 70), w79 = stufe(iso, 79), w59 = stufe(iso, 59);
    pruef(`${name}: 62 %, 70 % und 79 % RLF → „Schimmelgefahr (Botrytis)"`,
      [w62, w70, w79].every(w => w && w.level === 'critical' && /Schimmelgefahr \(Botrytis\)/.test(w.title)), JSON.stringify([w62, w70, w79].map(w => w && w.level)));
    pruef(`${name}: der Rat passt zu den Tagen vor der Ernte (keine Entlaubung)`, w62 && /Vor der Ernte/.test(w62.action) && !/Defoliation/.test(w62.action), w62 && w62.action);
    pruef(`${name}: 59 % bleibt ohne Alarm`, !w59 || w59.level !== 'critical', JSON.stringify(w59));
  }

  console.log('\nB - Gegenproben: die übrigen Phasen wie vorher');
  {
    const spaet = stufe(tage.bloom_spaet, 62), mittel62 = stufe(tage.bloom_mittel, 62), mittel66 = stufe(tage.bloom_mittel, 66);
    const anz = stufe(tage.anzucht, 62), dry70 = stufe(tage.dry, 70), dry85 = stufe(tage.dry, 85);
    pruef('Spätblüte 62 %: kritisch, mit dem bisherigen Spätblüte-Rat', spaet && spaet.level === 'critical' && /In Spätblüte/.test(spaet.action), JSON.stringify(spaet));
    pruef('Mittlere Blüte: 62 % ohne Alarm, 66 % „Schimmelrisiko"', !mittel62 && mittel66 && mittel66.level === 'high', JSON.stringify([mittel62, mittel66 && mittel66.level]));
    pruef('Anzucht 62 %: kein Schimmel-Alarm', !anz, JSON.stringify(anz));
    pruef('Trocknen: 70 % ohne Alarm, 85 % „hohes Pilzrisiko"', !dry70 && dry85 && dry85.level === 'high', JSON.stringify([dry70, dry85 && dry85.level]));
  }

  console.log('\nC - Sichtbar im Tageseintrag: Spültag mit 66 % RLF');
  {
    const text = E(`(function(){
      const iso = '${tage.flush}';
      setDebugDate(iso);
      if (!S.entries[iso]) S.entries[iso] = { temp: '', humidity: '', cycleData: {} };
      S.entries[iso].temp = '22'; S.entries[iso].humidity = '66'; saveS();
      openEntry(iso);
      return document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
    })()`);
    const stelle = (text.match(/RLF 66%[^]{0,160}/) || [''])[0];
    console.log('    „' + stelle + '"');
    pruef('Der Eintrag zeigt „RLF 66% — Schimmelgefahr (Botrytis)"', /RLF 66% — Schimmelgefahr \(Botrytis\)/.test(text), stelle || '(keine RLF-Warnung)');
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
