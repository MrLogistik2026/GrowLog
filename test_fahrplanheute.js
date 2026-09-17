/**
 * (v1.5.274) Gieß-Fahrplan, Karte „Nächster Guss": nach dem Guss und bei vollem Topf nicht „heute".
 *
 * Der Fehler (Bewertung vom 17.09.2026, Hebel 1 #9): Die Karte fragte nur isGiessTag — „heute · etwa 2100 ml" nach einem
 * eingetragenen Guss, „heute" bei vollem Topf, während Startseite und Eintrag „heute nicht gießen" sagten.
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

// Zyklus so datieren, dass heute die gesuchte Aktion ansteht; liest die Karte „Nächster Guss" im Gieß-Fahrplan.
const LAGE = (opt) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = false;
  const c = addCyc({ name: 'Fahrplan', seedType: 'auto', medium: '${opt.medium || 'erde'}' });
  c.potSize = 11; c.plantCount = 1; c.weightMode = 'lift';
  let gefunden = false;
  for (let d = 1; d <= 95; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    const p0 = phase(todayISO(), c);
    if (p0 && ${opt.bedingung || "p0.ph === 'bloom' && getAction(todayISO(), c) === 'giess'"}) { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: true });
  const heute = todayISO();
  const cd = Object.assign({}, ${JSON.stringify(opt.heute || {})});
  if (${!!opt.haken}) cd._doneTodo = Date.now();
  S.entries[heute] = { cycleData: { [c.id]: cd } };
  saveS();
  goTo('gussplan');
  const t = document.getElementById('scr-gussplan').textContent.replace(/\\s+/g, ' ');
  const nx = nextGiessTag(c, heute);
  const m = t.match(/Nächster Guss · (heute|morgen|in \\d+ Tagen) Tag (\\d+)/);
  return JSON.stringify({ a: getAction(heute, c), heuteTag: phase(heute, c).day, erl: _gussHeuteErledigt(c, heute),
    wann: m ? m[1] : null, zielTag: m ? Number(m[2]) : null, naechsterTag: nx ? isoDiff(nx.iso || isoPlus(heute, nx.days), c.startDate) + 1 : null,
    ws: waterSuggestion(c, phase(heute, c), heute), karte: (t.match(/(✓ Heute erledigt.{0,40})?Nächster Guss.{0,220}/) || [''])[0] });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (opt) => JSON.parse(E(LAGE(opt)));

  console.log('\nA - Gießtag, Hebe-Test „Voll"');
  const a = lauf({ heute: { restPct: 100 } });
  pruef('Gießtag gefunden', !a.fehlt, JSON.stringify(a).slice(0, 80));
  if (!a.fehlt) {
    pruef('Karte: „sobald der Hebe-Test „Knapp" zeigt" und „Heute nicht gießen"', /Nächster Guss · sobald der Hebe-Test „Knapp" zeigt/.test(a.karte) && /Heute nicht gießen — der Topf ist noch voll/.test(a.karte), a.karte);
    pruef('Kein „heute Tag"', a.wann !== 'heute', a.karte);
  }

  console.log('\nB - Coco, Hebe-Test „Voll"');
  const b = lauf({ medium: 'coco', heute: { restPct: 100 } });
  if (!b.fehlt) pruef('Coco nennt „Mittel"', /sobald der Hebe-Test „Mittel" zeigt/.test(b.karte), b.karte);

  console.log('\nC - Spültag, Hebe-Test „Voll"');
  const cc = lauf({ bedingung: "getAction(todayISO(), c) === 'spuelen'", heute: { restPct: 100 } });
  if (!cc.fehlt) pruef('Spültag voll: Voll-Karte, kein „heute"', /Heute nicht gießen — der Topf ist noch voll/.test(cc.karte) && cc.wann !== 'heute', cc.karte);

  console.log('\nD - Voll mit Haken');
  const d = lauf({ heute: { restPct: 100, water: '0' }, haken: true });
  if (!d.fehlt) pruef('Voll und Haken: weiter die Voll-Karte', /Heute nicht gießen — der Topf ist noch voll/.test(d.karte), d.karte);

  console.log('\nE - 1500 ml eingetragen');
  const e = lauf({ heute: { water: '1500' } });
  if (!e.fehlt) {
    pruef('„✓ Heute erledigt · 1500 ml eingetragen"', /✓ Heute erledigt · 1500 ml eingetragen/.test(e.karte), e.karte);
    pruef('Nächster Guss ist der nächste Gießtag, nicht heute', e.wann !== 'heute' && e.zielTag === e.naechsterTag, e.karte + ' / nextGiessTag Tag ' + e.naechsterTag);
  }

  console.log('\nF - IceFlush-Tag mit Eintrag');
  const f = lauf({ bedingung: "getAction(todayISO(), c) === 'ice'", heute: { water: '700' } });
  if (!f.fehlt) pruef('Kein „heute"', f.wann !== 'heute' && /✓ Heute erledigt · 700 ml eingetragen/.test(f.karte), f.karte);

  console.log('\nG - Gegenprobe: Hebe-Test „Knapp"');
  const g = lauf({ heute: { restPct: 30 } });
  if (!g.fehlt) {
    const ml = parseInt((g.karte.match(/etwa (\d+) ml/) || [])[1], 10);
    pruef('„heute" mit der Menge aus waterSuggestion', g.wann === 'heute' && g.zielTag === g.heuteTag && ml === g.ws, g.karte + ' / ' + g.ws);
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
