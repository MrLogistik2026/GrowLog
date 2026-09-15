/**
 * (v1.5.210) Drain-EC-Texte an die Regel (Begriffe-Prüfung, Schritt 5).
 *
 * Seit v1.5.209 bewertet der Eintrag den Drain-EC nur noch als Verhältnis zum Gießwasser (ANBAU.md 5.1). Daneben standen
 * sechs andere Faustregeln mit festen Zahlen — Infotext „+0,5 → spülen", Lexikon „±0,2 gesund, 0,5+ höher Dosis reduzieren",
 * Diagnose „über 2,5 versalzt", Tipps „über 2,5 Zwischenguss", CANNA-Coco „1,0–1,8 mS/cm" und „ähnlich Input-EC", Cup-Plan
 * „> 2,3 in Stretch II". Wer einer davon folgte, bekam im Eintrag eine andere Antwort.
 *
 * Jetzt: ein Satz, T.drainRegel() und T.drainRegelKurz(), aus DRAIN_EC_VERHAELTNIS und DRAIN_ZIEL.
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
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('\nA - Die alten Faustregeln stehen nirgends mehr (Quelltext ohne Kommentare)');
  const zeilen = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n')
    .map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z));
  [
    [/ähnlich Input-EC/, '„sollte ähnlich Input-EC sein"'],
    [/nahe Input-EC/, '„bis Drain-EC nahe Input-EC"'],
    [/Inflow-EC ±0\.2|0\.5\+ höher|0\.3\+ niedriger/, '„±0,2 gesund, 0,5+ höher, 0,3+ niedriger"'],
    [/0\.3-0\.5 höher als Inflow/, '„bei Coco 0,3–0,5 höher normal"'],
    [/Drain-EC sollte 1\.0-1\.8/, '„Drain-EC sollte 1,0–1,8 mS/cm sein"'],
    [/mehr als <b>0\.5<\/b> über dem Gießwasser/, '„mehr als 0,5 über dem Gießwasser → spülen"'],
    [/>2\.3 in Stretch II/, '„Warnschwelle > 2,3 in Stretch II"'],
    [/Drain-EC nicht > 2\.5|über 2\.5 = versalzt|Steigt er über 2\.5/, '„über 2,5 versalzt"'],
    // Beim Durchklicken gefunden: die Mechanik im selben Lexikon-Eintrag und drei weitere Lexikon-Stellen
    [/HÖHER als Inflow|NIEDRIGER als Inflow|Runoff = Inflow|höher als Inflow = Salze/, '„Runoff höher als Inflow → Salze sammeln sich"'],
    [/Differenz zeigt was im Substrat|Runoff-EC >> Inflow/, '„Differenz zeigt, was im Substrat passiert", „Runoff-EC >> Inflow"'],
  ].forEach(([re, name]) => {
    const treffer = zeilen.filter(x => re.test(x.z)).map(x => 'Zeile ' + x.nr);
    pruef('Nirgends: ' + name, treffer.length === 0, treffer.join(', '));
  });

  console.log('\nB - Der eine Satz');
  let r = null;
  try {
    r = JSON.parse(E(`(function(){ const regel = T.drainRegel(), kurz = T.drainRegelKurz();
      const zaehl = (o, t) => JSON.stringify(o).split(t).length - 1;
      goTo('tips'); renderTips();
      return JSON.stringify({ regel, kurz, info: zaehl(INFO_TERMS, regel), lexikon: zaehl(LEXIKON, regel), vorlagenKurz: zaehl(FERT_PRESETS, kurz),
        symptome: zaehl(SYMPTOMS, '1,6-Fachen'), tipps: document.getElementById('scr-tips').textContent.includes(kurz) }); })()`));
  } catch (e) { pruef('T.drainRegel und T.drainRegelKurz gibt es', false, String(e && e.message || e).slice(0, 120)); }
  if (r) {
    pruef('T.drainRegel(): Verhältnis, 1,3 und 1,6, mindestens 15 % Drain', /Drain-EC ÷ Gießwasser-EC/.test(r.regel) && /1,3-Fachen/.test(r.regel) && /1,6-Fachen/.test(r.regel) && /mindestens 15 % Drain/.test(r.regel), r.regel);
    pruef('Infotext „Runoff" nennt die Regel', r.info >= 1, 'n=' + r.info);
    pruef('Lexikon nennt die Regel', r.lexikon >= 1, 'n=' + r.lexikon);
    pruef('Vorlagen (CANNA Coco, Cup) nennen die Kurzform', r.vorlagenKurz >= 3, 'n=' + r.vorlagenKurz);
    pruef('Symptom-Texte nennen das 1,6-Fache statt 2,5', r.symptome >= 2, 'n=' + r.symptome);
    pruef('Tipps-Leitfaden nennt die Kurzform', r.tipps === true);
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
