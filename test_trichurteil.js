/**
 * (v1.5.268) Trichom-Karte: kein Urteil ohne Messung, „zu früh" an derselben Grenze wie die Ernte-Freigabe.
 *
 * Der Fehler: Unter der Plan-Zeile stand „Die Trichome sind noch überwiegend klar. Zu früh geerntet kostet Wirkung" auch ohne
 * jede Messung — geurteilt über die Vorgabe 70/25/5 im Eingabefeld. Und „zu früh" hing an milchig < 50 %, nicht an Klar.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

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

// Zyklus so datieren, dass heute 3 Tage vor dem Plan-Erntetag ist; trich: { tageZurueck, clear, milky, amber }.
const KARTE = (opt) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = ${opt.einsteiger !== false};
  const c = addCyc({ name: 'Urteil', seedType: 'auto', medium: 'erde' });
  c.potSize = 11; c.plantCount = 1; c.targetAmber = 5;
  let gefunden = false;
  for (let d = 80; d <= 160; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    if (getAction(todayISO(), c) === 'ernte') { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: true });
  c.startDate = isoPlus(c.startDate, 3);
  const heute = todayISO();
  ${JSON.stringify(opt.trich || [])}.forEach(t => {
    const iso = isoPlus(heute, -t.tageZurueck);
    S.entries[iso] = { cycleData: { [c.id]: { trichomes: { clear: t.clear, milky: t.milky, amber: t.amber } } } };
  });
  saveS();
  openEntry(heute);
  const el = document.getElementById('trich-' + c.id);
  return JSON.stringify({ ph: phase(heute, c).ph, karte: el ? el.textContent.replace(/\\s+/g, ' ') : '' });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (opt) => JSON.parse(E(KARTE(opt)));
  const zuFrueh = /Zu früh geerntet kostet Wirkung/;

  console.log('\nA - Drei Tage vor dem Plan-Erntetag, keine Messung');
  const a = lauf({});
  pruef('Trichom-Karte sichtbar', !a.fehlt && a.karte.length > 0, JSON.stringify(a).slice(0, 80));
  if (!a.fehlt) {
    pruef('Plan-Zeile bleibt', /📅 Plan: .*Ernte Tag \d+ \(in 3 T\.\)/.test(a.karte), (a.karte.match(/📅 Plan:.{0,60}/) || [''])[0]);
    pruef('Kein Urteil über die Vorgabe 70/25/5', !zuFrueh.test(a.karte) && !/überwiegend klar/.test(a.karte), (a.karte.match(/.{0,80}Zu früh.{0,40}/) || [''])[0]);
  }

  console.log('\nB - Heute gemessen: 30 % klar');
  const b = lauf({ trich: [{ tageZurueck: 0, clear: 30, milky: 68, amber: 2 }] });
  if (!b.fehlt) pruef('Urteil nennt die gemessenen 30 % klar', /Noch 30 % der Köpfe sind klar\. Zu früh geerntet kostet Wirkung/.test(b.karte), (b.karte.match(/.{0,40}Zu früh.{0,40}/) || [''])[0]);

  console.log('\nC - Heute gemessen: 5 % klar, 45 % milchig, 50 % Bernstein');
  const cc = lauf({ trich: [{ tageZurueck: 0, clear: 5, milky: 45, amber: 50 }] });
  if (!cc.fehlt) pruef('Kaum noch klar: kein „zu früh"', !zuFrueh.test(cc.karte) && !/überwiegend klar/.test(cc.karte), (cc.karte.match(/.{0,60}Zu früh.{0,40}/) || [''])[0]);

  console.log('\nD - Übernommene Messung von vor 5 Tagen: 40 % klar');
  const d = lauf({ trich: [{ tageZurueck: 5, clear: 40, milky: 58, amber: 2 }] });
  if (!d.fehlt) pruef('Urteil über die übernommene Messung, mit ihrem Alter', /Noch 40 % der Köpfe sind klar/.test(d.karte) && /dieser Stand ist 5 Tage alt/.test(d.karte), (d.karte.match(/.{0,40}Zu früh.{0,120}/) || [''])[0]);

  console.log('\nE - Quelltext');
  {
    const q = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    pruef('Kein „Die Trichome sind noch überwiegend klar" mehr', !/Die Trichome sind noch überwiegend klar/.test(q));
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
