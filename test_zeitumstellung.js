/**
 * (v1.5.181) Phasengrenzen ab dem Blütestart zählen Kalendertage — auch über die Zeitumstellung.
 *
 * Befund der zweiten Prüfrunde (planmodell), in beiden Zeitzonen gemessen: _datebasedPhase legte die Grenzen mit
 * getTime() + n · 86 400 000 ms auf das 12-Uhr-Datum. Liegt die Frühjahrsumstellung dazwischen, landet die Grenze um
 * 13 Uhr Sommerzeit — und der Tag zählt noch zur alten Phase. In Berlin begann das Spülen dadurch einen Tag zu spät,
 * in Kiritimati (keine Zeitumstellung) richtig. Betroffen sind Zyklen mit Blütestart-Datum (Photo-Sorten nach dem
 * Umschalten auf 12/12).
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

const FAELLE = [
  { name: 'Umschalten 26.01., Blüte 70 — Spülen nach der Umstellung', start: '2026-01-05', veg: 21, bloom: 70 },
  { name: 'Umschalten 19.01., Blüte 70 — Spülen am Tag nach der Umstellung', start: '2026-01-05', veg: 14, bloom: 70 },
  { name: 'Umschalten 13.03., Blüte 70 — Umstellung mitten in der Blüte', start: '2026-02-01', veg: 40, bloom: 70 },
  { name: 'Gegenprobe ohne Umstellung: Umschalten 25.05., Blüte 70', start: '2026-04-20', veg: 35, bloom: 70 },
  { name: 'Gegenprobe Herbst: Umschalten 10.10., Blüte 30', start: '2026-08-01', veg: 70, bloom: 30 },
];

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler (leerer Speicher)', errors.length === 0, errors[0]);

  for (const f of FAELLE) {
    console.log('\n' + f.name);
    const r = JSON.parse(E(`(function(){
      S.cycles = []; S.entries = {};
      const c = { id: 'zu1', active: true, name: 'Photo', startDate: '${f.start}', seedType: 'fem', growType: 'indoor', medium: 'erde',
        anzuchtDays: 21, bloomDays: ${f.bloom}, flushDays: 8, iceDays: 3, harvestDays: 1, dryDays: 7, cureDays: 21,
        offsetHistory: [], skippedDays: [], plants: [], bloomStartDate: isoPlus('${f.start}', ${f.veg}) };
      const bloom = c.bloomStartDate;
      const flush = isoPlus(bloom, c.bloomDays), ice = isoPlus(flush, c.flushDays), harvest = isoPlus(ice, iceLenFor(c));
      const dry = isoPlus(harvest, c.harvestDays), cure = isoPlus(dry, c.dryDays);
      const soll = { bloom, flush, ice, harvest, dry, cure };
      const ist = {};
      for (let d = 0; d < 400; d++) { const iso = isoPlus(c.startDate, d); const p = phase(iso, c); if (p && !ist[p.ph]) ist[p.ph] = iso; }
      const letzter = phase(isoPlus(flush, -1), c);
      const erster = phase(bloom, c);
      return JSON.stringify({ soll, ist, letzterBd: letzter && letzter.bloomDay, ersterBd: erster && erster.bloomDay });
    })()`));
    const falsch = Object.keys(r.soll).filter(k => r.soll[k] !== r.ist[k]).map(k => `${k} soll ${r.soll[k]}, ist ${r.ist[k]}`);
    pruef(`Blüte ${r.soll.bloom} · Spülen ${r.soll.flush} · IceFlush ${r.soll.ice} · Ernte ${r.soll.harvest} · Trocknen ${r.soll.dry} · Curing ${r.soll.cure}`,
      falsch.length === 0, falsch.join(' | '));
    pruef(`Blütetag 1 am Umschalttag, Blütetag ${f.bloom} am Tag vor dem Spülen`, r.ersterBd === 1 && r.letzterBd === f.bloom,
      `erster ${r.ersterBd}, letzter ${r.letzterBd}`);
  }

  console.log('\nOutdoor mit Raus-Datum: Abhärten und Wochen draußen');
  {
    const r = JSON.parse(E(`(function(){
      S.cycles = []; S.entries = {};
      const basis = { active: true, name: 'Outdoor', seedType: 'fem', growType: 'outdoor', medium: 'erde', anzuchtDays: 21, bloomDays: 60,
        flushDays: 8, iceDays: 3, harvestDays: 1, dryDays: 7, cureDays: 21, offsetHistory: [], skippedDays: [], plants: [] };
      const fruehling = Object.assign({ id: 'zu2', startDate: '2026-03-01', transplantDate: '2026-03-25' }, basis);
      const herbst = Object.assign({ id: 'zu3', startDate: '2026-09-01', transplantDate: '2026-10-28' }, basis);
      const ph = (iso, c) => { const p = phase(iso, c); return p ? p.ph + (p.ph === 'vegi_out' ? ' W' + p.week + ' T' + p.vegDay : '') : null; };
      return JSON.stringify({ f7: ph('2026-03-31', fruehling), f8: ph('2026-04-01', fruehling),
        hVor: ph('2026-10-20', herbst), hAb: ph('2026-10-21', herbst), hRaus: ph('2026-10-28', herbst) });
    })()`));
    pruef('Frühjahr (Umstellung 29.03.): 7. Tag draußen noch Woche 1, 8. Tag Woche 2', r.f7 === 'vegi_out W1 T7' && r.f8 === 'vegi_out W2 T8', `${r.f7} / ${r.f8}`);
    pruef('Herbst (Umstellung 25.10.): Abhärten beginnt genau 7 Tage vor dem Raus-Datum', r.hVor === 'vorzucht' && r.hAb === 'abhärten' && r.hRaus === 'vegi_out W1 T1',
      `${r.hVor} / ${r.hAb} / ${r.hRaus}`);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
