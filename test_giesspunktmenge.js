/**
 * (v1.5.285) Am feuchten Gießtag nennt auch der Eintrag keine Menge: gussMengeJePflanze liefert Quelle „feucht" und 0.
 *
 * Der Fehler (beim Prüfen von v1.5.284 im Browser): Status „noch feucht: heute nicht gießen", darunter Lern-Status „~500 ml aus
 * deinem heutigen Hebe-Test" und Gieß-Guide „Anrühren: ~550 ml".
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

// Ein Zyklus, an dem heute ein Gießtag in der Blüte ist. vorher: { Tage zurück: Eintrag }; guss (Vorgabe) = ein Guss vor genau
// einem Gießabstand (dann bleibt heute über den Anker Gießtag). Liefert Karte, Satz, Startseite, Eintrag, Gieß-Fahrplan und Helfer.
const LAUF = (opt) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = ${opt.einsteiger !== false};
  const c = addCyc({ name: 'Punkt', seedType: 'auto', medium: '${opt.medium || 'erde'}', growType: '${opt.growType || 'indoor'}' });
  c.potSize = 11; c.plantCount = 1; c.weightMode = '${opt.waage ? 'scale' : 'lift'}';
  ${opt.waage ? 'c.saturatedWeight = 10000; c.dryWeight = 7000;' : ''}
  const heute = todayISO();
  let gefunden = false;
  for (let d = ${opt.tagVon || 40}; d <= ${opt.tagBis || 95}; d++) {
    c.startDate = isoPlus(heute, -(d - 1));
    if (${!!opt.topping}) c.toppingDate = heute;
    const p0 = phase(heute, c);
    if (p0 && (p0.ph === 'bloom' || ${!!opt.aktion}) && getAction(heute, c) === '${opt.aktion || 'giess'}') { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: 'kein Gießtag' });
  const h = _gussIv(c, heute, 'bloom');
  const vorher = ${JSON.stringify(opt.vorher || {})};
  if (${opt.guss !== false}) vorher[h] = Object.assign({ water: '2000' }, vorher[h] || {});
  Object.keys(vorher).forEach(k => { S.entries[isoPlus(heute, -Number(k))] = { cycleData: { [c.id]: Object.assign({}, vorher[k]) } }; });
  if (${!!opt.heute}) S.entries[heute] = { cycleData: { [c.id]: Object.assign({}, ${JSON.stringify(opt.heute || {})}) } };
  saveS();
  const p = phase(heute, c), a = getAction(heute, c);
  if (a !== '${opt.aktion || 'giess'}') return JSON.stringify({ fehlt: 'Aktion nach dem Eintragen: ' + a });
  const gm = giessenLautMessung(c, heute);
  const karte = getTodayAction(c, p, a, heute) || {};
  const satz = plainSentence(a, c, p, waterSuggestion(c, p, heute)) || '';
  const autofill = (getAutoFillTemplate(c, p, a, heute) || {}).water;
  const ws = waterSuggestion(c, p, heute);
  const gq = (gussMengeJePflanze(c, p, heute) || {}).quelle || null;
  renderDash();
  const dash = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
  openEntry(heute);
  const eb = document.getElementById('entry-body');
  const eintrag = eb ? eb.textContent.replace(/\\s+/g, ' ') : '';
  goTo('gussplan');
  const plan = document.getElementById('scr-gussplan').textContent.replace(/\\s+/g, ' ');
  const erl = _gussHeuteErledigt(c, heute);
  let erledigtWasser = null, aktionDanach = null;
  if (${!!opt.erledigt}) {
    markTodayDone(c.id, heute);
    erledigtWasser = S.entries[heute].cycleData[c.id].water;
    aktionDanach = [1, 2, 3, 4].map(i => getAction(isoPlus(heute, i), c)).join(',');
  }
  const bisTag = fmtDE(isoPlus(heute, h), { weekday: 'long', day: '2-digit', month: '2-digit' });
  return JSON.stringify({ tag: p.day, h, gm, titel: karte.title || '', schritte: (karte.steps || []).join(' | '), hinweis: karte.hint || '',
    satz, dash, eintrag, plan, autofill, ws, gq, erl: erl && erl.status, erledigtWasser, aktionDanach, bisTag });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (opt) => { try { return JSON.parse(E(LAUF(opt))); } catch (e) { return { fehlt: 'Ausnahme: ' + e.message }; } };

  console.log('\nA - Hebe-Test 90 % am Gießtag („noch feucht"): keine Menge, auch nicht im Eintrag');
  const a = lauf({ heute: { restPct: 90 } });
  pruef('Gießtag angelegt', !a.fehlt, a.fehlt);
  if (!a.fehlt) {
    pruef('Gießmenge 0, Quelle „feucht"', a.ws === 0 && a.gq === 'feucht', a.ws + ' / ' + a.gq);
    pruef('Lern-Status: „Der Topf ist noch feucht — heute nicht gießen."', /Der Topf ist noch feucht — heute nicht gießen\./.test(a.eintrag), (a.eintrag.match(/Lern-Status.{0,120}/) || [''])[0]);
    pruef('Kein „~N ml aus deinem heutigen Hebe-Test" mehr', !/~\d+ ml aus deinem heutigen Hebe-Test/.test(a.eintrag), (a.eintrag.match(/.{0,20}aus deinem heutigen Hebe-Test.{0,40}/) || [''])[0]);
    pruef('Gieß-Guide ohne „Anrühren: ~N ml"', !/Anrühren: ~[1-9]\d* ml/.test(a.eintrag), (a.eintrag.match(/Anrühren.{0,40}/) || [''])[0]);
    pruef('Karte weiter „der Topf ist noch feucht"', a.titel === '💧 Gießtag — der Topf ist noch feucht', a.titel);
    pruef('Satz weiter „Heute nicht gießen" ohne Menge', /Heute nicht gießen\./.test(a.satz) && !/\d+ ml/.test(a.satz), a.satz);
  }

  console.log('\nB - Gegenproben');
  const b = lauf({ heute: { restPct: 70 } });
  if (!b.fehlt) {
    pruef('„Mittel": Menge aus dem Hebe-Test wie bisher', b.ws > 0 && b.gq === 'hebetest' && /~\d+ ml aus deinem heutigen Hebe-Test/.test(b.eintrag), b.ws + ' / ' + b.gq);
    pruef('„Mittel": Gieß-Guide mit Menge', /Anrühren: ~[1-9]\d* ml/.test(b.eintrag), (b.eintrag.match(/Anrühren.{0,40}/) || [''])[0]);
  } else pruef('Lage B angelegt', false, b.fehlt);
  const c = lauf({ heute: { restPct: 100 } });
  if (!c.fehlt) pruef('„Voll": wie bisher Quelle „voll", Lern-Status „noch voll"', c.ws === 0 && c.gq === 'voll' && /Der Topf ist noch voll — heute nicht gießen\./.test(c.eintrag), c.ws + ' / ' + c.gq);
  const d = lauf({ heute: { restPct: 90, water: '1500' } });
  if (!d.fehlt) pruef('Heute schon gegossen: Menge wie bisher, nicht „feucht"', d.gq !== 'feucht' && d.ws > 0, d.ws + ' / ' + d.gq);
  const e = lauf({ guss: false, vorher: { 6: { water: '2000' } }, heute: { restPct: 90 } });
  if (!e.fehlt) pruef('Einmal ausgelassen: wieder Menge', e.gq !== 'feucht' && e.ws > 0, e.ws + ' / ' + e.gq);

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
