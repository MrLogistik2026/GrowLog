/**
 * (v1.5.146) Gedrückthalten der ±-Knöpfe in der Mischliste wiederholt den Schritt.
 *
 * Der Fehler (beim Abarbeiten der Agenten-Befunde gefunden, im Browser nachgestellt): Der
 * Wiederholungs-Mechanismus erkannte die Mischlisten-Knöpfe an 'stepMixDose(' im onclick. Seit
 * v1.4.78 rufen sie stepMixDoseLive(this) auf — 1,5 Sekunden Halten auf „+" bei 8,6 ml ergaben
 * 8,6 ml. Zweiter Teil: Jeder Schritt baut den Eintrag neu auf; ein bloß wieder erkannter Knopf
 * wäre danach nicht mehr im Dokument, und stepMixDoseLive hätte von 0 aus gerechnet.
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

// Liest den angezeigten ml-Wert eines Produkts in der Mischliste.
const WERT = (prod) => `(function(){
  const b = document.querySelector('.mix-step-btn[data-prod="${prod}"]');
  const f = b && b.closest('.mix-step') && b.closest('.mix-step').querySelector('.mix-calc');
  return f ? parseFloat(String(f.value || f.placeholder).replace(',', '.')) : null;
})()`;

async function halten(E, richtung, ms) {
  const info = JSON.parse(E(`(function(){
    const c = S.cycles.find(x => x.active);
    const knopf = Array.from(document.querySelectorAll('.mix-step-btn')).find(b => b.dataset.cycle === c.id && Math.sign(parseFloat(b.dataset.step)) === ${richtung});
    window.__knopf = knopf;
    return JSON.stringify({ prod: knopf && knopf.dataset.prod, schritt: knopf && parseFloat(knopf.dataset.step) });
  })()`));
  const vorher = E(WERT(info.prod));
  E(`window.__knopf.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))`);
  const verlauf = [];
  const schritte = Math.ceil(ms / 200);
  for (let i = 0; i < schritte; i++) { await warte(200); verlauf.push(E(WERT(info.prod))); }
  E(`document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))`);
  await warte(150);
  const nachher = E(WERT(info.prod));
  await warte(300);
  const spaeter = E(WERT(info.prod));
  const dosis = E(`(function(){ const c = S.cycles.find(x => x.active); const cd = S.entries['2026-07-07'].cycleData[c.id]; return cd.doses ? cd.doses['${info.prod}'] : null; })()`);
  return { ...info, vorher, verlauf, nachher, spaeter, dosis };
}

async function fingerHalten(E, ms) {
  const prod = E(`(function(){
    const c = S.cycles.find(x => x.active);
    window.__finger = Array.from(document.querySelectorAll('.mix-step-btn')).find(b => b.dataset.cycle === c.id && parseFloat(b.dataset.step) > 0);
    return window.__finger.dataset.prod;
  })()`);
  const beruehren = (typ) => E(`(function(){
    const T = window.TouchEvent || window.Event;
    const k = window.__finger, da = document.body.contains(k);
    k.dispatchEvent(new T('${typ}', { bubbles: true, cancelable: true }));
    return da;
  })()`);
  const vorher = E(WERT(prod));
  beruehren('touchstart');
  await warte(ms);
  const mitte = E(WERT(prod));
  const ursprungDa = beruehren('touchend');
  await warte(150);
  const direkt = E(WERT(prod));
  await warte(600);
  const spaeter = E(WERT(prod));
  E(`document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))`);   // falls es weiterläuft
  return { prod, vorher, mitte, ursprungDa, direkt, spaeter };
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`setDebugDate('2026-09-13')`);
  E(`openEntry('2026-07-07')`);
  await warte(300);
  pruef('Mischliste mit ±-Knöpfen da', E(`document.querySelectorAll('.mix-step-btn').length`) > 0);

  console.log('\nA - „+" gedrückt halten');
  const plus = await halten(E, 1, 1600);
  console.log('    ' + plus.vorher + ' → ' + plus.verlauf.join(' → ') + ' · losgelassen ' + plus.nachher + ' · 300 ms später ' + plus.spaeter);
  pruef('Der Wert steigt beim Halten um mehrere Schritte', plus.nachher >= plus.vorher + 5 * Math.abs(plus.schritt) - 1e-9, plus.vorher + ' → ' + plus.nachher);
  pruef('… stetig, ohne Rücksprung auf 0', plus.verlauf.every((v, i) => v >= (i ? plus.verlauf[i - 1] : plus.vorher) - 1e-9), plus.verlauf.join(', '));
  pruef('… und hört beim Loslassen auf', Math.abs(plus.spaeter - plus.nachher) < 1e-9, plus.nachher + ' / ' + plus.spaeter);
  pruef('Der gespeicherte Tageswert ist der angezeigte', Math.abs((plus.dosis || 0) - plus.nachher) < 0.011, plus.dosis + ' / ' + plus.nachher);

  console.log('\nB - „−" gedrückt halten');
  const minus = await halten(E, -1, 1200);
  console.log('    ' + minus.vorher + ' → ' + minus.verlauf.join(' → ') + ' · losgelassen ' + minus.nachher);
  pruef('Der Wert sinkt beim Halten um mehrere Schritte, nie unter 0', minus.nachher <= minus.vorher - 3 * Math.abs(minus.schritt) + 1e-9 && minus.nachher >= 0, minus.vorher + ' → ' + minus.nachher);

  // Ein Fingerdruck bleibt beim Element, auf dem er begann. Nach dem ersten Schritt ist dieser
  // Knopf neu gebaut; touchend geht an den alten und erreicht das document nicht mehr.
  console.log('\nC - Finger: Loslassen am inzwischen neu gebauten Knopf');
  const finger = await fingerHalten(E, 1200);
  console.log('    ' + finger.vorher + ' → ' + finger.mitte + ' · losgelassen ' + finger.direkt + ' · 600 ms später ' + finger.spaeter);
  pruef('Halten mit dem Finger zählt hoch', finger.mitte > finger.vorher + 1, finger.vorher + ' → ' + finger.mitte);
  pruef('Prüflage stimmt: der berührte Knopf ist beim Loslassen nicht mehr im Dokument', finger.ursprungDa === false);
  pruef('Loslassen stoppt die Wiederholung trotzdem', Math.abs(finger.spaeter - finger.direkt) < 1e-9, finger.direkt + ' → ' + finger.spaeter);

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
