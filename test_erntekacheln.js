/**
 * (v1.5.280) Kacheln „Ernte in", „Heute" und „Erntedatum" am Plan-Erntetag mit offener Ernte.
 * (v1.5.281) Zeile in der Datumskarte und rechte Seite der Zyklus-Karte am Plan-Erntetag.
 *
 * Der Fehler (Bewertung vom 17.09.2026, Hebel 1 #16): Unter „Trichome noch nicht reif — noch nicht schneiden" standen
 * „Ernte in 0 ±5d", „Heute ✂️" und „Erntedatum 17. Sept." — die Kacheln fragten die Messung nur, wenn _trichVsPlan einen
 * späteren Tag lieferte.
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

// Heute ist der Plan-Erntetag; trich: Messungen { tageZurueck, klar, milchig, bernstein }. Liest Kacheln, Datumskarte, Zyklus-Karte.
const LAGE = (opt) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = ${opt.einsteiger === true};
  const c = addCyc({ name: 'Kacheln', seedType: 'auto', medium: 'erde' });
  c.potSize = 11; c.plantCount = 1; c.targetAmber = 5;
  let gefunden = false;
  for (let d = 80; d <= 160; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    if (getAction(todayISO(), c) === 'ernte') { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: true });
  const heute = todayISO();
  ${JSON.stringify(opt.trich || [])}.forEach(t => {
    const iso = isoPlus(heute, -t.tageZurueck);
    S.entries[iso] = { cycleData: { [c.id]: { trichomes: { clear: t.klar, milky: t.milchig, amber: t.bernstein } } } };
  });
  saveS();
  if (S._setUI) S._setUI.dashMore = true;
  renderDash();
  const box = (lbl) => { const b = [...document.querySelectorAll('#scr-dash .stat-box')].find(x => { const l = x.querySelector('.stat-lbl'); return l && l.textContent.trim().startsWith(lbl); });
    return b ? { val: b.querySelector('.stat-val').textContent.trim(), title: b.getAttribute('title') || '' } : null; };
  const dash = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
  return JSON.stringify({ et: _ernteTermin(c, heute), ernteIn: box('Ernte in'), heuteK: box('Heute'), datum: box('Erntedatum'),
    plan: fmtDE(harvestCountdown(c).harvestISO, { day: '2-digit', month: 'short' }), tipp: _ernteTipp(c, heute), dash });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (opt) => JSON.parse(E(LAGE(opt)));
  const offen = (r, name) => {
    pruef(name + ': _ernteTermin „offen"', r.et && r.et.basis === 'offen', JSON.stringify(r.et && r.et.basis));
    pruef(name + ': Kacheln „offen" · 🔍 · „nach Trichomen"', r.ernteIn && r.ernteIn.val === 'offen' && r.heuteK && r.heuteK.val === '🔍' && r.datum && r.datum.val === 'nach Trichomen',
      JSON.stringify([r.ernteIn, r.heuteK, r.datum].map(x => x && x.val)));
    pruef(name + ': Titel der Kachel ist der Ernte-Tipp', r.ernteIn && r.ernteIn.title === r.tipp, r.ernteIn && r.ernteIn.title);
  };

  console.log('\nA - Plan-Erntetag, heute gemessen: 20 % klar');
  const a = lauf({ trich: [{ tageZurueck: 0, klar: 20, milchig: 74, bernstein: 6 }] });
  pruef('Lage gefunden', !a.fehlt, JSON.stringify(a).slice(0, 80));
  if (!a.fehlt) offen(a, 'A');

  console.log('\nB - Plan-Erntetag ohne Messung');
  const b = lauf({});
  if (!b.fehlt) offen(b, 'B');

  console.log('\nC - Plan-Erntetag, Messung 5 Tage alt');
  const cc = lauf({ trich: [{ tageZurueck: 5, klar: 30, milchig: 68, bernstein: 2 }] });
  if (!cc.fehlt) offen(cc, 'C');

  console.log('\nD - Plan-Erntetag, reif gemessen (gestern 5 % klar, 12 % Bernstein)');
  const d = lauf({ trich: [{ tageZurueck: 1, klar: 5, milchig: 83, bernstein: 12 }] });
  if (!d.fehlt) {
    pruef('D: _ernteTermin „plan"', d.et && d.et.basis === 'plan', JSON.stringify(d.et && d.et.basis));
    pruef('D: Kacheln wie bisher — „0 ±5d", ✂️, Plan-Datum', d.ernteIn && /^0 ±5d$/.test(d.ernteIn.val) && d.heuteK && d.heuteK.val === '✂️' && d.datum && d.datum.val === d.plan,
      JSON.stringify([d.ernteIn, d.heuteK, d.datum].map(x => x && x.val)));
  }

  console.log('\nE - Einsteiger-Modus („Mehr anzeigen" offen), ohne Messung');
  const e = lauf({ einsteiger: true });
  if (!e.fehlt) pruef('E: Heute-Kachel 🔍', e.heuteK && e.heuteK.val === '🔍', JSON.stringify(e.heuteK));

  console.log('\nF - Datumskarte und Zyklus-Karte am Plan-Erntetag (v1.5.281)');
  {
    const f = lauf({ trich: [{ tageZurueck: 0, klar: 20, milchig: 74, bernstein: 6 }] });
    if (!f.fehlt) {
      pruef('F: Datumskarte „🔍 Ernte offen"', /🔍 Ernte offen/.test(f.dash), (f.dash.match(/Kacheln.{0,60}/) || [''])[0]);
      pruef('F: Zyklus-Karte rechts „Ernte offen", kein Aktions-Etikett „✂️ Ernte" (die Phasen-Zeile „✂️ Ernte · Tag N" bleibt)', !/✂️ Ernte(?! · Tag)/.test(f.dash) && (f.dash.match(/Ernte offen/g) || []).length >= 2, (f.dash.match(/.{0,30}(✂️ Ernte|Ernte offen).{0,20}/g) || []).join(' | '));
    }
    const g = lauf({ trich: [{ tageZurueck: 1, klar: 5, milchig: 83, bernstein: 12 }] });
    if (!g.fehlt) pruef('Reif: kein „Ernte offen"', !/Ernte offen/.test(g.dash), (g.dash.match(/.{0,30}Ernte offen.{0,20}/) || [''])[0]);
    const eintragskopf = JSON.parse(E(`(function(){
      const c = S.cycles[0]; openEntry(todayISO());
      const eb = document.getElementById('entry-body'); return JSON.stringify({ kopf: eb ? eb.textContent.replace(/\\s+/g, ' ').slice(0, 400) : '' });
    })()`));
    pruef('Eintragskopf eines Plan-Erntetags bleibt „✂️ Ernte" (nicht über _phasenAnzeige geändert)', /✂️ Ernte/.test(eintragskopf.kopf), eintragskopf.kopf.slice(0, 160));
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
