/**
 * (v1.5.175) Die Gießanleitungen nennen den Gießpunkt, nach dem die Hebe-Test-Bewertung urteilt.
 *
 * classifyRestPct bewertet Erde: ab 40 % „Bald gießen", 25–40 % „Sweet Spot — jetzt gießen", darunter
 * Wasserstress; im Finisher 30–40 %. Patricks Gießpunkt ist 30 % (Hebe-Test „Knapp"). Drei Anleitungen sagten
 * „Sweet Spot ~40 % Restgewicht" — genau der Wert, bei dem die Bewertung daneben „Bald gießen" meldet. Der
 * Gieß-Leitfaden in den Tipps sagte dazu „Erst gießen wenn der Topf extrem leicht ist" (unter 25 % ist
 * Wasserstress) und „alle 3–4 Tage", zwei Absätze nach „Vergiss starre Zeitpläne". Die Einstellungen
 * begründeten 25–30 % in der Endphase mit „Harz-Trigger" — nicht belegt (ANBAU.md 14), und die Finisher-Bewertung
 * nennt 30–40 %. Befund der Prüf-Agentin zur Gießmenge (15.09.2026).
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

  console.log('\nA - Quelltext');
  const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  {
    const zeilen = src.split(/\r?\n/).map((z, i) => ({ nr: i + 1, z }))
      .filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z) && /(~40\s?% Restgewicht|Harz-Trigger|extrem leicht)/.test(x.z));
    pruef('Kein „~40 % Restgewicht", „Harz-Trigger" oder „extrem leicht" mehr', zeilen.length === 0, zeilen.map(x => 'Zeile ' + x.nr + ': ' + x.z.trim().slice(0, 70)).join(' | '));
    // (v1.5.195) Bewusst angepasst: kein eigenes Finisher-Band mehr — der Einstellungstext nennt nur noch den Gießpunkt.
    pruef('Einstellungen: Sweet Spot aus GIESSPUNKT, kein eigenes Finisher-Band', /Sweet Spot bei <b>\$\{GIESSPUNKT\.erde\.von\}/.test(src) && !/GIESSPUNKT\.finisher/.test(src));
  }

  console.log('\nB - Eine Quelle für Bewertung und Text');
  {
    const r = JSON.parse(E(`(function(){ try {
      const g = GIESSPUNKT, s = (p, f) => classifyRestPct(p, f, false).status;
      return JSON.stringify({ ok: s(g.erde.von) === 'sweetSpot' && s(g.erde.bis - 0.1) === 'sweetSpot' && s(g.erde.bis) === 'approaching'
        && s(g.erde.von - 0.1) === 'stress' && s(g.erde.von, true) === 'sweetSpot' && s(g.erde.bis - 0.1, true) === 'sweetSpot' && s(g.erde.bis, true) === 'approaching', g });
    } catch (e) { return JSON.stringify({ ok: false, fehler: String(e) }); } })()`));
    pruef('classifyRestPct urteilt genau an den Grenzen aus GIESSPUNKT', r.ok, JSON.stringify(r));
  }

  console.log('\nC - Gerendert');
  {
    const tipps = E(`(function(){ S._tipsOpen = Object.assign(S._tipsOpen || {}, { guss: true }); goTo('tips'); renderTips();
      return document.getElementById('scr-tips').textContent.replace(/\\s+/g, ' '); })()`);
    const t = (tipps.match(/③ [^②①]{0,190}/) || ['(Leitfaden nicht gefunden)'])[0];
    pruef('Tipps, Gieß-Leitfaden: „Sweet Spot 25–40 % Restgewicht", „Knapp", kein fester Kalender', /Sweet Spot 25–40 % Restgewicht/.test(t) && /Knapp/.test(t) && !/alle 3–4 Tage/.test(t), t);

    E(`setDebugDate('2026-08-27'); S.beginnerMode = false; openEntry('2026-08-27')`);
    await warte(200);
    const eintrag = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
    const g = (eintrag.match(/③ Sweetspot:.{0,110}/) || ['(Gießanleitung nicht gefunden)'])[0];
    pruef('Eintrag, Gießanleitung (Erde): „Sweet Spot bei 25–40 % Restgewicht"', /Sweet Spot bei 25–40 % Restgewicht/.test(g), g);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
