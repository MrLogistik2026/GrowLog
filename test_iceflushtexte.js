/**
 * (v1.5.143) Am IceFlush-Tag sagen Startseite, Tageskarte, Eintrag und Anleitung dasselbe:
 * Crushed Ice an den Topfrand, kein Wasser dazu — und kein Trichom-Versprechen.
 *
 * Der Fehler (beim Abarbeiten der Agenten-Befunde gefunden): Drei Texte widersprachen der
 * Eintragskarte aus v1.5.111 („Wasser gießt du keines dazu"):
 *   · Einsteiger-Satz: „Heute gießt du mit Eiswasser … Langsam, etwa X ml"
 *   · Tageskarte:      „Eiskaltes Wasser (<10°C), ca. X ml" · „Kältestress fördert Trichom-Produktion"
 *                      · „Eiswürfel direkt auf die Erde legen geht auch"
 *   · Anleitung:       „Der Kältestress soll die Trichom-Produktion nochmal pushen"
 * Zusätzliches Wasser am IceFlush macht den Hard-Dryback der Tage davor zunichte; ein
 * Trichom-Effekt ist nach ANBAU.md 14 nicht belegt.
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

// Einsteiger-Zyklus anlegen und auf den ersten IceFlush-Tag stellen.
const EISTAG = (pflanzen) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = true;
  const c = addCyc({ name: 'Eis', seedType: 'auto', medium: 'erde' });
  c.potSize = 11; c.plantCount = ${pflanzen};
  for (let d = 70; d <= 120; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    if (getAction(todayISO(), c) === 'ice') {
      saveS();
      const iso = todayISO();
      const p = phase(iso, c);
      const karte = getTodayAction(c, p, 'ice', iso);
      renderDash();
      const dash = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
      openEntry(iso);
      const eintrag = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
      return JSON.stringify({ tag: d, n: getEffectivePlantCount(c, iso), eis: Math.round(getPotSize(c) / 11 * 1000),
        schmelz: waterSuggestion(c, p, iso), karte: karte ? (karte.steps || []).join(' | ') + ' | ' + (karte.hint || '') : '', dash, eintrag });
    }
  }
  return JSON.stringify({ fehlt: true });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('\nA - Drei Pflanzen am IceFlush-Tag');
  const r = JSON.parse(E(EISTAG(3)));
  pruef('IceFlush-Tag gefunden', !r.fehlt, JSON.stringify(r).slice(0, 100));
  if (!r.fehlt) {
    const satz = (r.dash.match(/Heute (ist IceFlush|gießt du mit Eiswasser)[^]*?(nicht belegt\.|\d+ ml\.)/) || [''])[0];
    console.log('    Satz:  „' + satz + '"');
    console.log('    Karte: „' + r.karte + '"');
    pruef('Einsteiger-Satz: Eis anlegen, nicht Eiswasser gießen', /Crushed Ice/.test(satz) && !/gießt du mit Eiswasser/.test(r.dash), satz);
    pruef('… mit der Eismenge je Topf und der Summe', satz.includes('etwa ' + r.eis + ' ml Crushed Ice') && satz.includes('zusammen ' + (r.eis * 3) + ' ml für 3 Pflanzen'), satz);
    pruef('… und „Wasser gießt du keines dazu"', /Wasser gießt du keines dazu/.test(satz), satz);
    pruef('Tageskarte: Crushed Ice je Topf, kein zusätzliches Wasser', r.karte.includes(r.eis + ' ml Crushed Ice') && /kein zusätzliches Wasser/.test(r.karte), r.karte);
    pruef('Tageskarte: kein Trichom-Versprechen, keine Eiswürfel auf die Erde', !/Kältestress fördert|Eiswürfel direkt/.test(r.karte) && !/Kältestress fördert/.test(r.dash), r.karte);
    pruef('Eintrag sagt weiter „Wasser gießt du keines dazu"', /Wasser gießt du keines dazu/.test(r.eintrag));
  }

  console.log('\nB - Eine Pflanze');
  const e1 = JSON.parse(E(EISTAG(1)));
  if (!e1.fehlt) {
    const satz = (e1.dash.match(/Heute (ist IceFlush|gießt du mit Eiswasser)[^]*?(nicht belegt\.|\d+ ml\.)/) || [''])[0];
    pruef('„Leg etwa X ml Crushed Ice", ohne Summe', satz.includes('Leg etwa ' + e1.eis + ' ml Crushed Ice') && !/zusammen/.test(satz), satz);
  } else pruef('IceFlush-Tag gefunden (1 Pflanze)', false);

  console.log('\nC - Kein Text im Quelltext empfiehlt noch Eiswasser oder verspricht Trichome');
  {
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n')
      .map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z));
    [/Eiskaltes Wasser \(<10°C\)/, /Eiswürfel direkt auf die Erde/, /gießt du mit Eiswasser/, /Kältestress\s+(soll|fördert|pusht)[^\n.]{0,60}Trichom/i].forEach(re => {
      const treffer = quelle.filter(x => re.test(x.z)).map(x => 'Zeile ' + x.nr);
      pruef('Nirgends: ' + re.source, treffer.length === 0, treffer.join(', '));
    });
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
