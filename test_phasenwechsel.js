/**
 * (v1.5.184) Die Karte vor einem Phasenwechsel nennt den echten Abstand.
 *
 * Beim Browser-Check von v1.5.183 auf Patricks Startseite gesehen: Am 29.08.2026 (Tag 106, Spülen ab Tag 107) stand
 * „In 3 Tagen: Spülphase beginnt … pH-Wasser für ~2 Wochen" direkt unter „Spülung morgen". getAlerts sah nur auf den
 * Tag in drei Tagen und schrieb an allen drei Tagen davor „In 3 Tagen"; die „~2 Wochen" standen fest da, auch bei
 * vier Spültagen. Liegen zwei Wechsel in drei Tagen (IceFlush, Ernte, Trocknen), übersprang die Karte den näheren.
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

const WORT = { bloom: /Blüte/, flush: /Spülphase/, ice: /IceFlush/, harvest: /Erntetag/, dry: /Trocknung/ };

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler (leerer Speicher)', errors.length === 0, errors[0]);

  console.log('\nAutomatic: Anzucht 21, Blüte 70, 4 Spültage + 3 Tage Hard-Dryback, IceFlush 3, Ernte 1');
  const r = JSON.parse(E(`(function(){
    const start = '2026-03-01';
    const c = { id: 'pw1', name: 'Auto', active: true, startDate: start, seedType: 'auto', growType: 'indoor', medium: 'erde',
      anzuchtDays: 21, bloomDays: 70, flushDays: 7, flushWetDays: 4, iceDryDays: 3, iceDays: 3, harvestDays: 1, dryDays: 7, cureDays: 21,
      intAnzucht: 3, intBloom: 3, intFlush: 3, intIce: 2, intErnte: 1, intDry: 1, offsetHistory: [], skippedDays: [], plants: [], plantCount: 1 };
    S.cycles = [c]; S.entries = {};
    const iso = (t) => isoPlus(start, t - 1);
    const zeilen = [];
    for (let t = 16; t <= 106; t++) {
      const heute = phase(iso(t), c);
      let soll = null;
      for (let d = 1; d <= 3; d++) { const pd = phase(iso(t + d), c); if (pd && heute && pd.ph !== heute.ph) { soll = { d, ph: pd.ph }; break; } }
      // (v1.5.278) Am Plan-Erntetag ohne Trichom-Freigabe ist die Ernte offen (ernteOffen) — dann keine Trocknungs-Karte.
      if (soll && soll.ph === 'dry' && heute && heute.ph === 'harvest' && ernteOffen(c, iso(t), heute)) soll = null;
      setDebugDate(iso(t));
      const karten = getAlerts(c).filter(a => a.type === 'milestone' && /^(Morgen|In \\d+ Tagen)/.test(a.text)).map(a => a.text.replace(/<[^>]+>/g, ''));
      zeilen.push({ t, ph: heute && heute.ph, soll, karten });
    }
    setDebugDate(null);
    return JSON.stringify(zeilen);
  })()`));

  const falsch = [];
  let karten = 0;
  for (const z of r) {
    if (!z.soll) { if (z.karten.length) falsch.push(`Tag ${z.t}: Karte ohne Wechsel „${z.karten[0].slice(0, 50)}"`); continue; }
    const k = z.karten[0];
    if (!k) { falsch.push(`Tag ${z.t}: keine Karte, Wechsel zu ${z.soll.ph} in ${z.soll.d} Tagen`); continue; }
    karten++;
    const wann = z.soll.d === 1 ? /^Morgen/ : new RegExp('^In ' + z.soll.d + ' Tagen');
    if (!wann.test(k) || !WORT[z.soll.ph].test(k)) falsch.push(`Tag ${z.t} (Wechsel zu ${z.soll.ph} in ${z.soll.d}): „${k.slice(0, 60)}"`);
  }
  pruef(`Jede Karte nennt den nächsten Wechsel mit seinem echten Abstand (${karten} Karten)`, falsch.length === 0 && karten > 0, falsch.slice(0, 4).join(' | '));

  const spuel = r.filter(z => z.karten.some(k => /Spülphase/.test(k)));
  pruef('Spülphasen-Karte an den Tagen 89, 90, 91', JSON.stringify(spuel.map(z => z.t)) === JSON.stringify([89, 90, 91]), spuel.map(z => z.t).join(', '));
  const t91 = (r.find(z => z.t === 91) || { karten: [] }).karten.find(k => /Spülphase/.test(k)) || '';
  pruef('Am Tag vor dem Spülen: „Morgen: Spülphase beginnt" mit den 4 Spültagen', /^Morgen: Spülphase beginnt/.test(t91) && /für die 4 Spültage/.test(t91), t91);
  pruef('Keine feste Angabe „~2 Wochen" mehr', !r.some(z => z.karten.some(k => /2 Wochen/.test(k))));
  const t101 = (r.find(z => z.t === 101) || { karten: [] }).karten[0] || '';
  pruef('IceFlush-Tag vor der Ernte: „Morgen: Erntetag", nicht schon die Trocknung', /^Morgen: Erntetag/.test(t101), t101);

  // (v1.5.278) Am Plan-Erntetag mit offener Ernte keine Trocknungs-Karte — mit reifer Messung von gestern schon.
  {
    const lage = (mitMessung) => JSON.parse(E(`(function(){
      const start = '2026-03-01';
      const c = { id: 'pw2', name: 'Auto', active: true, startDate: start, seedType: 'auto', growType: 'indoor', medium: 'erde',
        anzuchtDays: 21, bloomDays: 70, flushDays: 7, flushWetDays: 4, iceDryDays: 3, iceDays: 3, harvestDays: 1, dryDays: 7, cureDays: 21,
        intAnzucht: 3, intBloom: 3, intFlush: 3, intIce: 2, intErnte: 1, intDry: 1, offsetHistory: [], skippedDays: [], plants: [], plantCount: 1 };
      S.cycles = [c]; S.entries = {};
      const iso = (t) => isoPlus(start, t - 1);
      if (${mitMessung}) S.entries[iso(101)] = { cycleData: { pw2: { trichomes: { clear: 5, milky: 83, amber: 12 } } } };
      setDebugDate(iso(102));
      const karten = getAlerts(c).filter(a => a.type === 'milestone' && /^(Morgen|In \\d+ Tagen)/.test(a.text)).map(a => a.text.replace(/<[^>]+>/g, ''));
      const out = { ph: phase(iso(102), c).ph, offen: ernteOffen(c, iso(102)), karten };
      setDebugDate(null);
      return JSON.stringify(out);
    })()`));
    const ohne = lage(false);
    pruef('Plan-Erntetag ohne Messung: Ernte offen, keine „Morgen: Trocknung"', ohne.ph === 'harvest' && ohne.offen === true && !ohne.karten.some(k => /Trocknung/.test(k)), JSON.stringify(ohne));
    const reif = lage(true);
    pruef('Plan-Erntetag mit reifer Messung von gestern: „Morgen: Trocknung" wie bisher', reif.offen === false && reif.karten.some(k => /^Morgen: Trocknung/.test(k)), JSON.stringify(reif));
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
