/**
 * (v1.5.286) Gieß-Guide im Eintrag: „Heute kein Guss" statt „Anrühren: ~0 ml" und „0–0 ml Drain", wenn der Topf voll oder noch feucht ist.
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
    satz, dash, eintrag, plan, autofill, erl: erl && erl.status, erledigtWasser, aktionDanach, bisTag });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (opt) => { try { return JSON.parse(E(LAUF(opt))); } catch (e) { return { fehlt: 'Ausnahme: ' + e.message }; } };
  const guide = (t) => (t.match(/Gieß-Guide.{0,160}/) || [''])[0];

  for (const [name, rest, wort] of [['„Voll" (100 %)', 100, 'voll'], ['90 %, noch feucht', 90, 'feucht']]) {
    console.log('\nGießtag mit Hebe-Test ' + name);
    for (const profi of [false, true]) {
      const x = lauf({ einsteiger: !profi, heute: { restPct: rest } });
      if (x.fehlt) { pruef('angelegt', false, x.fehlt); continue; }
      const g = guide(x.eintrag);
      const modus = profi ? 'Profi' : 'Einsteiger';
      pruef(modus + ': Gieß-Guide sagt „Heute kein Guss — der Topf ist noch ' + wort + '"', g.includes('Heute kein Guss — der Topf ist noch ' + wort), g);
      pruef(modus + ': keine 0-ml-Zeilen („Anrühren: ~0 ml", „0–0 ml Drain", „~0 ml")', !/Anrühren: ~0 ml|0–0 ml Drain|~0 ml/.test(x.eintrag), (x.eintrag.match(/.{0,30}(Anrühren: ~0 ml|0–0 ml Drain|~0 ml).{0,30}/) || [''])[0]);
    }
  }

  console.log('\nGegenproben');
  const m = lauf({ heute: { restPct: 70 } });
  if (!m.fehlt) pruef('„Mittel": Gieß-Guide mit Menge und Drain wie bisher', /~[1-9]\d* ml(\/Pfl\.)? → \d+–\d+ ml Drain/.test(m.eintrag) && !/Heute kein Guss/.test(m.eintrag), guide(m.eintrag));
  const w = lauf({ heute: { restPct: 100, water: '1200' } });
  if (!w.fehlt) pruef('Voll, aber Guss eingetragen: der Guide zeigt den eingetragenen Guss', /~1200 ml/.test(w.eintrag) && !/Heute kein Guss/.test(w.eintrag), guide(w.eintrag));
  const o = lauf({});
  if (!o.fehlt) pruef('Ohne Hebe-Test: Gieß-Guide mit Menge wie bisher', !/Heute kein Guss/.test(o.eintrag) && /~[1-9]\d* ml/.test(guide(o.eintrag)), guide(o.eintrag));

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
