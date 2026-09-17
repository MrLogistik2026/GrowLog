/**
 * (v1.5.273) Ein eingetragener Guss zählt auf der Startseite als erledigt.
 *
 * Der Fehler (Bewertung vom 17.09.2026, Hebel 1 #8): „Erledigt" galt nur mit Haken. Mit eingetragener Menge stand weiter die
 * volle Gießtag-Karte da — „Ca. 1500 ml" aus dem Eintrag und darüber „Gib … etwa 3500 ml" neu gerechnet.
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

// Zyklus so datieren, dass heute die gesuchte Aktion ansteht; heute: Felder des Tageseintrags.
const LAGE = (opt) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = ${opt.einsteiger !== false};
  const c = addCyc({ name: 'Erledigt', seedType: 'auto', medium: 'erde' });
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
  renderDash();
  const dash = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
  return JSON.stringify({ a: getAction(heute, c), tag: phase(heute, c).day, erl: _gussHeuteErledigt(c, heute), dash });
})()`;

async function ladeMitSicherung() {
  const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
  const vc = new VirtualConsole();
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
      w.localStorage.setItem('growsmart_v4', BACKUP);
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 80));
  return (s) => window.eval(s);
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (opt) => JSON.parse(E(LAGE(opt)));
  const gibSatz = /Gib (deiner|jeder) Pflanze/;

  console.log('\nA - Gießtag, 1500 ml eingetragen, kein Haken');
  const a = lauf({ heute: { water: '1500' } });
  pruef('Gießtag gefunden', !a.fehlt, JSON.stringify(a).slice(0, 80));
  if (!a.fehlt) {
    pruef('Helfer: gegossen, 1500 ml', a.erl && a.erl.status === 'gegossen' && a.erl.ml === 1500, JSON.stringify(a.erl));
    pruef('Startseite: „Heute erledigt · 1500 ml eingetragen"', /Heute erledigt · 1500 ml eingetragen/.test(a.dash), (a.dash.match(/.{0,40}erledigt.{0,40}/) || [''])[0]);
    pruef('Kein Satz „Gib … etwa" und keine zweite Menge', !gibSatz.test(a.dash) && !/Ca\. 1500 ml/.test(a.dash));
    pruef('Kein „Rückgängig" ohne Haken', !/Rückgängig/.test(a.dash));
  }

  console.log('\nB - Gießtag mit Haken');
  const b = lauf({ heute: { water: '1500' }, haken: true });
  if (!b.fehlt) pruef('Mit Haken wie bisher: Uhrzeit ✎ und „Rückgängig"', /Heute erledigt · \d{2}:\d{2} ✎/.test(b.dash) && /Rückgängig/.test(b.dash), (b.dash.match(/.{0,40}erledigt.{0,40}/) || [''])[0]);

  console.log('\nC - Spültag, Anzucht und Sättigungsguss mit eingetragener Menge');
  const c1 = lauf({ bedingung: "getAction(todayISO(), c) === 'spuelen'", heute: { water: '3000' } });
  if (!c1.fehlt) pruef('Spültag 3000 ml: kompakt', /Heute erledigt · 3000 ml eingetragen/.test(c1.dash) && !/Ca\. \d+ ml reines Wasser/.test(c1.dash), c1.a);
  const c2 = lauf({ bedingung: "getAction(todayISO(), c) === 'giess_anz'", heute: { water: '300' } });
  if (!c2.fehlt) pruef('Anzucht 300 ml: kompakt', /Heute erledigt · 300 ml eingetragen/.test(c2.dash), c2.a + ' Tag ' + c2.tag);
  const c3 = lauf({ bedingung: "getAction(todayISO(), c) === 'saettigung'", heute: { water: '700' } });
  if (!c3.fehlt) pruef('Sättigungsguss 700 ml: kompakt', /Heute erledigt · 700 ml eingetragen/.test(c3.dash), c3.a);

  console.log('\nD - Wasser „0" von Hand, kein Haken');
  const d = lauf({ heute: { water: '0' } });
  if (!d.fehlt) pruef('Volle Karte bleibt', d.erl === null && /Heute: Gießtag/.test(d.dash) && !/Heute erledigt/.test(d.dash), JSON.stringify(d.erl));

  console.log('\nE - Voller Topf');
  const e1 = lauf({ heute: { restPct: 100 } });
  if (!e1.fehlt) pruef('Voll ohne Haken: Helfer „voll", Karte „der Topf ist noch voll"', e1.erl && e1.erl.status === 'voll' && /der Topf ist noch voll/.test(e1.dash), JSON.stringify(e1.erl));
  const e2 = lauf({ heute: { restPct: 100, water: '0' }, haken: true });
  if (!e2.fehlt) pruef('Voll mit Haken: kein „gegossen", Kompaktkarte mit Uhrzeit', e2.erl && e2.erl.status === 'voll' && /Heute erledigt · \d{2}:\d{2}/.test(e2.dash), JSON.stringify(e2.erl));

  console.log('\nF - Ohne Eintrag');
  const f = lauf({});
  if (!f.fehlt) pruef('Offen: volle Karte, Satz und Karte nennen dieselbe Menge', f.erl === null && /Heute: Gießtag/.test(f.dash)
    && (f.dash.match(/etwa <?b?>?(\d+) ml/) || [])[1] === (f.dash.match(/Ca\. (\d+) ml/) || [])[1], (f.dash.match(/etwa.{0,20}ml/) || [''])[0] + ' / ' + (f.dash.match(/Ca\. \d+ ml/) || [''])[0]);

  console.log('\nG - Patricks Sicherung: Gießtage mit Menge, ohne Haken');
  {
    const P = await ladeMitSicherung();
    const r = JSON.parse(P(`(function(){
      const c = S.cycles.find(x => x.active);
      const tage = Object.keys(S.entries).sort().filter(k => {
        const cd = S.entries[k].cycleData && S.entries[k].cycleData[c.id];
        return cd && parseFloat(cd.water) > 0 && !cd._doneTodo && isGiessTag(k, c);
      });
      const falsch = [];
      tage.forEach(k => {
        setDebugDate(k); renderDash();
        const t = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
        if (!/Heute erledigt · \\d+ ml eingetragen/.test(t) || /Gib (deiner|jeder) Pflanze/.test(t)) falsch.push(k);
      });
      return JSON.stringify({ n: tage.length, falsch: falsch.length });
    })()`));
    pruef('Gießtage mit Menge ohne Haken gefunden', r.n > 0, r.n);
    pruef('An allen: kompakt, kein zweiter Gieß-Satz', r.falsch === 0, r.falsch + ' von ' + r.n);
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
