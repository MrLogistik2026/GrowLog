/**
 * (v1.5.267) Gießtag mit vollem Topf — Satz und Karte der Startseite.
 *
 * Der Fehler (Bewertung vom 17.09.2026, Hebel 1): Zeigte der Hebe-Test am Gießtag „Voll", sagte die Startseite „Gib deiner
 * Pflanze heute etwa 0 ml … bis unten etwas herausläuft" und „Ca. 0 ml Wasser", der Eintrag darunter „Topf ist voll — heute
 * nicht gießen". Jetzt sagen beide dasselbe; die Grenze ist die der Gießmenge (gussMengeJePflanze, Quelle 'voll').
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

// Zyklus so datieren, dass heute ein Gießtag in der Blüte ist; heute: Hebe-Test und ggf. eingetragener Guss.
const GIESSTAG = (opt) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = ${opt.einsteiger !== false};
  const c = addCyc({ name: 'Voll', seedType: 'auto', medium: '${opt.medium || 'erde'}', growType: '${opt.growType || 'indoor'}' });
  c.potSize = 11; c.plantCount = 1; c.weightMode = 'lift';
  let gefunden = false;
  for (let d = 35; d <= 90; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    const p0 = phase(todayISO(), c);
    if (p0 && p0.ph === 'bloom' && getAction(todayISO(), c) === 'giess') { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: true });
  const heute = todayISO();
  S.entries[heute] = { cycleData: { [c.id]: Object.assign({}, ${JSON.stringify(opt.heute || {})}) } };
  saveS();
  const p = phase(heute, c), a = getAction(heute, c);
  const karte = getTodayAction(c, p, a, heute) || {};
  const satz = plainSentence(a, c, p, waterSuggestion(c, p, heute)) || '';
  renderDash();
  const dash = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
  openEntry(heute);
  const eb = document.getElementById('entry-body');
  const eintrag = eb ? eb.textContent.replace(/\\s+/g, ' ') : '';
  return JSON.stringify({ tag: p.day, titel: karte.title || '', schritte: (karte.steps || []).join(' | '), satz, dash, eintrag,
    voll: _topfVollHeute(c, p, heute) });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (opt) => JSON.parse(E(GIESSTAG(opt)));
  const nullMl = /(^|[^\d.,])0 ml/;

  console.log('\nA - Gießtag, Hebe-Test heute „Voll" (100 %)');
  const a = lauf({ heute: { restPct: 100 } });
  pruef('Gießtag in der Blüte gefunden', !a.fehlt, JSON.stringify(a).slice(0, 80));
  if (!a.fehlt) {
    pruef('Topf gilt als voll', a.voll === true);
    pruef('Satz: „Heute nicht gießen", kein „0 ml"', /<b>Heute nicht gießen\.<\/b>/.test(a.satz) && !nullMl.test(a.satz), a.satz);
    pruef('Satz nennt den Gießpunkt der Erde („Knapp")', /sobald er „Knapp" zeigt/.test(a.satz), a.satz);
    pruef('Karte: „Gießtag — der Topf ist noch voll"', a.titel === '💧 Gießtag — der Topf ist noch voll' && /heute nicht gießen/.test(a.schritte), a.titel + ' · ' + a.schritte);
    pruef('Startseite ohne „0 ml"', !nullMl.test(a.dash), (a.dash.match(/.{0,50}(^|[^\d.,])0 ml.{0,30}/) || [''])[0]);
    pruef('Eintrag sagt dasselbe: Topf ist voll', /Topf ist voll/.test(a.eintrag), (a.eintrag.match(/.{0,60}voll.{0,60}/) || [''])[0]);
  }

  console.log('\nB - Gießtag, Hebe-Test heute „Knapp" (30 %)');
  const b = lauf({ heute: { restPct: 30 } });
  if (!b.fehlt) {
    const ml = parseInt((b.satz.match(/etwa <b>(\d+) ml/) || [])[1], 10);
    pruef('Normaler Gießtag mit Menge', b.voll === false && b.titel === '💧 Heute: Gießtag' && ml > 0, b.titel + ' · ' + ml);
  }

  console.log('\nC - Voll, aber heute schon selbst gegossen und eingetragen');
  const cc = lauf({ heute: { restPct: 100, water: '1200' } });
  if (!cc.fehlt) pruef('Der eingetragene Guss bleibt auf der Karte', cc.titel === '💧 Heute: Gießtag' && /1200 ml/.test(cc.schritte), cc.titel + ' · ' + cc.schritte);

  console.log('\nD - Coco, Hebe-Test „Voll"');
  const d = lauf({ medium: 'coco', heute: { restPct: 100 } });
  if (!d.fehlt) pruef('Coco nennt seinen Gießpunkt („Mittel")', /sobald er „Mittel" zeigt/.test(d.satz) && /„Mittel" zeigt/.test(d.schritte), d.satz);

  console.log('\nE - Ohne Hebe-Test heute');
  const e = lauf({});
  if (!e.fehlt) pruef('Kein Hebe-Test: normaler Gießtag, nicht „voll"', e.voll === false && e.titel === '💧 Heute: Gießtag', e.titel);

  console.log('\nF - Profi-Modus, Hebe-Test „Voll"');
  const f = lauf({ einsteiger: false, heute: { restPct: 100 } });
  if (!f.fehlt) pruef('Profi-Startseite: Karte „noch voll", kein „0 ml"', /der Topf ist noch voll/.test(f.dash) && !nullMl.test(f.dash), (f.dash.match(/.{0,50}(^|[^\d.,])0 ml.{0,30}/) || [''])[0]);

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
