/**
 * (v1.5.197) Gießpunkt-Zahlen aus einer Quelle, gültig ab Tag 25.
 *
 * Der Fehler: Die Frage „wann gießen?" hatte in der App bis zu sieben Zahlen — Infotext „Restgewicht": „auf etwa 40 %";
 * Lexikon „Restgewicht": eine Phasentabelle 50–60 / 40–50 / 35–45 / 25–35 %; Lexikon „Sämlingsphase": „50–55 % (sanft,
 * nicht 40 %)"; „35–40 %" im Infotext „Trauermücken", zweimal im Lexikon „Trauermücken" und in „Wurzelfäule"; Diagnose:
 * „unter 45 %" und „unter 40 %"; Sämlings-Hinweis nach dem Anlegen: „Tag 9+: ~40 % … ab Tag 15 ~30–40 %";
 * Restgewicht-Diagramm: fest 30–50 %. Bewertet wird aber mit GIESSPUNKT (25–40 %, Hebe-Test „Knapp" = 30). Dazu im
 * Lexikon „der Stress des Antrocknens triggert die massenhafte Ausschüttung von Wuchshormonen" — belegt ist, dass Wurzeln
 * dorthin wachsen, wo Wasser war und jetzt Sauerstoff ist (ANBAU.md 1).
 *
 * Gültigkeit (ANBAU.md 1, 7.4, 13.1): Solange ein Guss den ganzen Topf nicht durchzieht, wiegt der Topf vor allem Substrat
 * ohne Wurzeln. Die Texte nennen den Gießpunkt deshalb erst ab DRAIN_AB_TAG.
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
const kurz = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 240);
const zaehle = (s, teil) => String(s || '').split(teil).length - 1;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const r = JSON.parse(E(`(function(){ const alle = LEXIKON.flatMap(function (c) { return c.items; });
    const g = function (t) { const i = alle.find(function (x) { return x.t === t; }); return i ? [i.brief, i.mechanism, i.practice, i.pitfall].join(' ') : null; };
    const aktion = function (id) { const p = PROBLEMS.find(function (x) { return x.id === id; }); return p ? p.action : null; };
    return JSON.stringify({ infoDry: INFO_TERMS.dryback.text, infoGnat: INFO_TERMS.trauermuecken.tip, rest: g('Restgewicht (Dryback · Trocken-Nass-Zyklus)'),
      gnat: g('Trauermücken (Sciaridae)'), pythium: g('Wurzelfäule (Pythium)'), saemling: g('Sämlingsphase'),
      nass: aktion('overwatering'), muecken: aktion('fungus_gnats'), alle: PROBLEMS.map(function (p) { return p.action || ''; }),
      ab: DRAIN_AB_TAG, g: GIESSPUNKT }); })()`));
  const band = `${r.g.erde.von}–${r.g.erde.bis} %`;
  const abTag = 'ab Tag ' + r.ab;

  console.log('\nA - Infotexte');
  pruef(`„Restgewicht": Gießpunkt ${band} statt „etwa 40 %", genannt ${abTag}`,
    r.infoDry.includes(band) && !/40 % seiner Nass-Last/.test(r.infoDry) && r.infoDry.includes(abTag), kurz(r.infoDry));
  pruef(`„Trauermücken": ${band} statt 35–40 %`, r.infoGnat.includes(band) && !/35–40/.test(r.infoGnat), kurz(r.infoGnat));

  console.log('\nB - Lexikon');
  pruef('„Restgewicht": keine Phasentabelle 50–60 / 40–50 / 35–45 / 25–35 mehr, Gießpunkt aus GIESSPUNKT',
    !!r.rest && !/50-60 %|40-50 %|35-45 %|25-35 %/.test(r.rest) && r.rest.includes(band), kurz(r.rest));
  pruef(`„Restgewicht": Gießpunkt ${abTag}; keine „Ausschüttung von Wuchshormonen"`, !!r.rest && r.rest.includes(abTag) && !/Wuchshormonen/.test(r.rest), kurz(r.rest));
  pruef(`„Trauermücken": zweimal ${band} statt 35–40 %`, !!r.gnat && !/35–40/.test(r.gnat) && zaehle(r.gnat, band) >= 2, kurz(r.gnat));
  pruef(`„Wurzelfäule (Pythium)": ${band} statt 35–40 %`, !!r.pythium && !/35–40/.test(r.pythium) && r.pythium.includes(band), kurz(r.pythium));
  pruef(`„Sämlingsphase": keine Restgewicht-Zahl vor Tag ${r.ab}`, !!r.saemling && !/50–55%|Dryback-Ziel|Übergang zum Dryback-System/.test(r.saemling)
    && /Noch kein Gießpunkt/.test(r.saemling) && r.saemling.includes(abTag), kurz((r.saemling || '').match(/Tag 7–14.{0,900}/) || ''));

  console.log('\nC - Diagnose, Sämlings-Hinweis, Diagramm, Quelltext');
  pruef('Diagnose „Überwässerung": bis zum Gießpunkt statt „unter 45 %"', !!r.nass && /den Gießpunkt erreicht/.test(r.nass) && r.nass.includes(`unter ${r.g.erde.bis} %`)
    && !r.alle.some(a => /unter 45 %/.test(a)), r.nass);
  pruef('Diagnose „Trauermücken": bis zum Gießpunkt', !!r.muecken && /Erde bis zum Gießpunkt abtrocknen lassen/.test(r.muecken), r.muecken);
  const roh = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  pruef('Sämlings-Hinweis (beide Startarten): Gießpunkt erst ab DRAIN_AB_TAG, aus GIESSPUNKT, Coco mit „Mittel"',
    zaehle(roh, 'Ab Tag ${DRAIN_AB_TAG}: gießen, wenn der Topf den Gießpunkt erreicht (${_gp})') === 2
    && zaehle(roh, 'Tag 9–${DRAIN_AB_TAG - 1}: an den Gießtagen der App gießen') === 2
    && roh.includes("const _gp = c.medium === 'coco' ? 'Hebe-Test „Mittel“"));
  const html = E(`buildChartsSection(S.cycles[0].id)`);
  pruef('Restgewicht-Diagramm (abgeschaltet): Legende aus GIESSPUNKT, falls es Daten gibt',
    !/Sweet-Spot 30–50%/.test(html) && (!/Restgewicht-Verlauf/.test(html) || html.includes(`Gießpunkt ${band}`)), (html.match(/Restgewicht-Verlauf.{0,160}/) || ['(keine Restgewicht-Daten)'])[0]);
  const code = roh.split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
  const alt = ['40 % seiner Nass-Last', 'auf 35–40 % abtrocknen', '35–40% austrocknen', '35–40% Restgewicht', '• Anzucht: 50-60 %', '50–55% Restgewicht',
    'Restgewicht unter 45 %', 'Topf-Restgewicht ~40%', 'Restgewicht ~30–40%', 'Sweet-Spot 30–50%', 'from: 30, to: 50', 'Ausschüttung von Wuchshormonen',
    'Dryback-Ziel</td>', 'Übergang zum Dryback-System'].filter(s => code.includes(s));
  pruef('Keine der alten Gießpunkt-Zahlen mehr im Code', alt.length === 0, alt.join(' | '));

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
