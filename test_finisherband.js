/**
 * (v1.5.195) Der Finisher hat kein eigenes Restgewicht-Band mehr.
 *
 * Der Fehler: classifyRestPct sagte in den letzten zwei Wochen vor der Ernte (Finisher) bei 25–29 % Restgewicht „Noch
 * warten … Warten bis spürbar federleicht" — dieselbe Funktion meldet unter 25 % Wasserstress. Die App schob die Pflanze also
 * in den Stress. Bei 40–50 % hieß es „Noch warten" statt „Bald gießen". Begründet war das Band (30–40 %) mit einem
 * „bewusst trockenen Topf" vor der Ernte; ein Mechanismus dafür ist nicht belegt (ANBAU.md 14, v1.5.144). Jetzt gilt bis zur
 * Ernte derselbe Gießpunkt (GIESSPUNKT.erde, Knopf „Knapp" = 30 %).
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

  const r = JSON.parse(E(`(function(){
    const werte = [20, 24, 25, 27, 29, 30, 39, 40, 45, 55, 60, 89, 90];
    const f = werte.map(function (p) { const x = classifyRestPct(p, true, false, null); return [p, x.status, x.label, x.text]; });
    const n = werte.map(function (p) { const x = classifyRestPct(p, false, false, null); return [p, x.status, x.label]; });
    return JSON.stringify({ f: f, n: n, g: GIESSPUNKT });
  })()`));
  const fin = Object.fromEntries(r.f.map(([p, s, l, t]) => [p, { s, l, t }]));

  console.log('\nA - Finisher mit demselben Band wie sonst');
  pruef('25, 27, 29, 30 und 39 % im Finisher: „Sweet Spot — jetzt gießen"', [25, 27, 29, 30, 39].every(p => fin[p].s === 'sweetSpot'),
    JSON.stringify([25, 27, 29, 30, 39].map(p => [p, fin[p].s, fin[p].l])));
  pruef('Unter 25 % Wasserstress, ab 40 % „Bald gießen"', [20, 24].every(p => fin[p].s === 'stress') && [40, 45, 55].every(p => fin[p].s === 'approaching'),
    JSON.stringify([20, 24, 40, 45, 55].map(p => [p, fin[p].s])));
  pruef('Kein „Noch warten" und kein „federleicht" unter 60 %', [20, 24, 25, 27, 29, 30, 39, 40, 45, 55].every(p => !/Noch warten/.test(fin[p].l) && !/federleicht/.test(fin[p].t || '')),
    JSON.stringify([25, 27, 29, 45].map(p => [p, fin[p].l, (fin[p].t || '').slice(0, 60)])));
  pruef('Finisher und Normal urteilen bei allen 13 Werten gleich', r.f.every(([p, s], i) => r.n[i][1] === s),
    JSON.stringify(r.f.map(([p, s], i) => p + ':' + s + '/' + r.n[i][1])));
  pruef('GIESSPUNKT hat kein eigenes Finisher-Band mehr', r.g && r.g.finisher === undefined && r.g.erde.von === 25 && r.g.erde.bis === 40, JSON.stringify(r.g));

  console.log('\nB - Einstellungen und Quelltext');
  const set = E(`(function(){ goTo('set'); return document.getElementById('scr-set') ? document.getElementById('scr-set').textContent.replace(/\\s+/g, ' ') : ''; })()`);
  pruef('Einstellungen: kein „(Finisher) sind … % gewollt"', !/Finisher\) sind/.test(set), (set.match(/Restgewicht-Modul.{0,200}/) || [''])[0]);
  const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
  const alt = ['finisherWait', 'finisherReady', 'Warten bis spürbar federleicht', 'GIESSPUNKT.finisher', 'Finisher Sweet Spot'].filter(s => code.includes(s));
  pruef('Keine Reste des Finisher-Bands im Code', alt.length === 0, alt.join(' | '));

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
