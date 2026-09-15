/**
 * (v1.5.191) Temperatur-Mechanik in Texten: Tag-Nacht-Differenz, kühle Nächte, Kälte an der Wurzel.
 *
 * Der Fehler: Das Lexikon „Temperatur" sagte „hohe Differenz = stauchere Pflanze, niedrige Differenz = streckendes
 * Wachstum" — belegt ist das Gegenteil: Mit wachsender Tag-Nacht-Differenz werden die Internodien länger (Carvalho et al.
 * 2002, Ann Bot 90:111). Dazu „ab 30 °C denaturieren Enzyme" (die Photosynthese von Cannabis ist um 30 °C am höchsten,
 * Chandra et al. 2008, ANBAU.md 2.2), „Anthocyane: Temperaturdifferenz ist der Schlüssel" (bei Cannabis färbten
 * gleichmäßig 8–15 °C am stärksten, der Wechsel weniger; Trockengewicht und CBD am höchsten bei 22 °C — Kim et al. 2025),
 * die FAQ „kühle Nächte bringen dichtere Buds und intensiveres Aroma" (nicht belegt) und fünfmal „Phosphor-Lockout unter
 * 18 °C" gegen ANBAU.md 7.3 (Wurzelzone unter 16 °C). Die Phosphor-Diagnose riet zuerst zu mehr Dünger.
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
async function abschnitt(titel, fn) {
  console.log('\n' + titel);
  try { await fn(); } catch (e) { pruef(titel + ' — lief ohne Fehler', false, String(e && e.message || e).slice(0, 160)); }
}
const kurz = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 260);

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const r = JSON.parse(E(`(function(){ const alle = LEXIKON.flatMap(function (c) { return c.items; });
    const g = function (t) { const i = alle.find(function (x) { return x.t === t; }); return i ? [i.brief, i.mechanism, i.practice, i.pitfall].join(' ') : null; };
    const faq = FAQ.find(function (f) { return /kühle Nächte in der Blüte/.test(f.q); });
    const phosphor = PROBLEMS.filter(function (p) { return /Phosphor|unter 18 °C ausgelöst/.test(p.action || ''); }).map(function (p) { return p.action; });
    const c = { id: 'tt', growType: 'indoor', medium: 'erde' }, p = { ph: 'bloom', bloomDay: 30, bloomLen: 60 };
    const w = function (t) { return getEntryWarnings({}, p, { temp: String(t), humidity: '50' }, c, null).map(function (x) { return x.type + ': ' + x.text; }); };
    return JSON.stringify({ temp: g('Temperatur'), antho: g('Anthocyane (Lila-/Rot-Färbung)'), kaelte: g('Kältestress'),
      faqQ: faq ? faq.q : null, faqA: faq ? faq.a : null, phosphor: phosphor, w17: w(17), w14: w(14) }); })()`));

  await abschnitt('A - Lexikon „Temperatur": Tag-Nacht-Differenz richtig herum, 30 °C nach Chandra', async () => {
    pruef('Kein „hohe Differenz = stauchere Pflanze" und kein „Enzyme denaturieren"', !!r.temp && !/hohe Differenz = stauchere Pflanze|Enzyme denaturieren/.test(r.temp), kurz(r.temp));
    pruef('Wärmerer Tag streckt stärker, mit Quelle', /wärmer als die Nacht, strecken sich die Stängel stärker/.test(r.temp || '') && /Carvalho et al\. 2002/.test(r.temp || ''));
    pruef('Photosynthese um 30 °C am höchsten; Wurzelzone unter 16 °C', /um 30 °C am höchsten/.test(r.temp || '') && /unter 16 °C/.test(r.temp || ''));
  });

  await abschnitt('B - Lexikon „Anthocyane"', async () => {
    pruef('Kein „Temperaturdifferenz ist der Schlüssel", kein „Chlorophyll-Produktion gedrosselt"',
      !!r.antho && !/Temperaturdifferenz ist der Schlüssel|Chlorophyll-Produktion gedrosselt/.test(r.antho), kurz(r.antho));
    pruef('8–15 °C färben am stärksten, Ertrag und CBD bei 22 °C am höchsten, mit Quelle',
      /8–15 °C/.test(r.antho || '') && /22 °C am höchsten/.test(r.antho || '') && /Kim et al\. 2025/.test(r.antho || ''));
  });

  await abschnitt('C - FAQ zu kühlen Nächten', async () => {
    pruef('Frage ohne falsche Vorannahme („Warum sind … gut?")', r.faqQ === 'Sind kühle Nächte in der Blüte gut?', r.faqQ);
    pruef('Keine unbelegten Vorteile (dichtere Buds, intensiveres Aroma, „echte Vorteile")',
      !!r.faqA && !/Buds werden dichter|Aroma wird intensiver|echte Vorteile/.test(r.faqA), kurz(r.faqA));
    pruef('Nennt Quelle, Luftfeuchte-Anstieg und Wurzelzone', /Kim et al\. 2025/.test(r.faqA || '') && /rund 64 %/.test(r.faqA || '') && /16 °C/.test(r.faqA || ''));
  });

  await abschnitt('D - Kältestress, Phosphor-Diagnose, Eintrags-Warnungen', async () => {
    pruef('Lexikon „Kältestress": Wurzelzone unter 16 °C statt „Phosphor-Lockout unter 18 °C"',
      !!r.kaelte && !/temperaturbedingter Phosphor-Lockout|Thermometer unter 18 °C|unter 15 °C kritisch/.test(r.kaelte) && /unter 16 °C/i.test(r.kaelte), kurz(r.kaelte));
    pruef('Phosphor-Diagnose: erst Wurzelzone und pH, dann Dünger', r.phosphor.length > 0 && r.phosphor.every(a => !/unter 18 °C ausgelöst|^P-reiche Blüh-Dünger jetzt/.test(a))
      && r.phosphor.some(a => /^Erst Wurzelzone und pH prüfen/.test(a)), JSON.stringify(r.phosphor).slice(0, 300));
    pruef('17 °C: Hinweis auf die Wurzelzone unter 16 °C, kein „Phosphor-Lockout droht"',
      r.w17.some(x => /16 °C/.test(x)) && !r.w17.some(x => /Phosphor-Lockout droht/.test(x)), JSON.stringify(r.w17));
    pruef('14 °C: kein „Wurzelschäden drohen"', r.w14.length > 0 && !r.w14.some(x => /Wurzelschäden drohen/.test(x)), JSON.stringify(r.w14));
  });

  await abschnitt('E - Im Quelltext', async () => {
    const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    const alt = ['stauchere Pflanze', 'Enzyme denaturieren', 'Temperaturdifferenz ist der Schlüssel', 'dichtere Buds', 'Terpen-Erhalt in der Spätblüte',
      'temperaturbedingter Phosphor-Lockout', 'Phosphor-Lockout droht', 'Wurzelschäden drohen', 'unter 18 °C ausgelöst'].filter(s => code.includes(s));
    pruef('Keine der alten Aussagen mehr im Code', alt.length === 0, alt.join(' | '));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
