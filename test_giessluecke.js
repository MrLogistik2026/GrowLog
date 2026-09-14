/**
 * (v1.5.147) Ein nicht eingetragener Guss ist keine Messung: Rückfrage statt „Sofort gießen".
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft): Ein Zyklus ohne Einträge meldete an
 * Nicht-Gießtagen rot „⚠ Nur noch 20% Restgewicht — Pflanze hat Wasserstress. Sofort gießen." —
 * nur weil intervalDryDefault nach einem geplanten, aber nicht eingetragenen Guss weiter
 * austrocknen lässt. Wer tatsächlich gegossen und nur nicht eingetragen hat, gießt auf nasse Erde
 * (ANBAU.md 13.1). Ohne Messung gehört dort eine Rückfrage hin (ANBAU.md 15).
 *
 * Gegenproben: Eine echte Messung (getippter Knopf) wird weiter als Wasserstress eingestuft; mit
 * eingetragenen Güssen erscheint keine Rückfrage; am geplanten Gießtag bleibt „Heute gießen".
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

const GUSS = "['giess','giess_anz','spuelen','ice','saettigung']";

// Frischer Zyklus ohne Einträge, heute ein Nicht-Gießtag nach einem übersprungenen geplanten Guss.
const LAGE = (einsteiger) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = ${einsteiger};
  const c = addCyc({ name: 'Lücke', seedType: 'auto', medium: 'erde' });
  c.weightMode = 'lift';
  for (let d = 12; d <= 70; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    const iso = todayISO();
    if (getAction(iso, c)) continue;
    const inter = intervalDryDefault(c, iso);
    if (inter.source !== 'overdue' || inter.pct > 20) continue;
    const ctx = contextFor(c, iso);
    if (ctx && ctx.noWaterPhase) continue;
    let ziel = null;
    for (let f = 1; f <= 30; f++) { const pr = isoPlus(inter.lastWaterIso, f); if (${GUSS}.includes(getAction(pr, c))) { ziel = pr; break; } }
    saveS();
    return JSON.stringify({ tag: d, iso, ziel, zielTag: phase(ziel, c).day, datum: fmtDE(ziel, { day: '2-digit', month: '2-digit' }), pct: inter.pct });
  }
  return JSON.stringify({ fehlt: true });
})()`;

const EINTRAG = (iso) => `(function(){
  openEntry('${iso}');
  return document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
})()`;

const ALARM = /Pflanze hat Wasserstress|Sofort gießen/;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  for (const einsteiger of [true, false]) {
    const modus = einsteiger ? 'Einsteiger' : 'Profi';
    console.log(`\nA - ${modus}: Nicht-Gießtag, der geplante Guss davor ist nicht eingetragen`);
    const r = JSON.parse(E(LAGE(einsteiger)));
    pruef(`${modus}: Prüflage gefunden`, !r.fehlt, JSON.stringify(r));
    if (r.fehlt) continue;
    const text = E(EINTRAG(r.iso));
    const stelle = (text.match(/(Pflanze hat Wasserstress|Nicht gemessen)[^]{0,260}/) || [''])[0];
    console.log(`    Tag ${r.tag}, geschätzt ${r.pct} %, geplanter Guss ${r.datum} (Tag ${r.zielTag})`);
    console.log('    „' + stelle + '"');
    pruef(`${modus}: kein „Wasserstress · Sofort gießen" aus der Schätzung`, !ALARM.test(text), stelle);
    pruef(`${modus}: Rückfrage nennt den geplanten Guss mit Datum und Tag`,
      /Nicht gemessen — ein Guss fehlt im Eintrag/.test(text) && text.includes(`Am ${r.datum} (Tag ${r.zielTag}) war ein Guss geplant`), stelle);
    const knopf = JSON.parse(E(`JSON.stringify(Array.from(document.querySelectorAll('#scr-entry button')).filter(b => (b.getAttribute('onclick') || '').includes("openEntry('${r.ziel}')")).map(b => b.textContent.trim()))`));
    pruef(`${modus}: Knopf „Tag ${r.zielTag} nachtragen" ist da`, knopf.length === 1 && knopf[0] === `Tag ${r.zielTag} nachtragen`, JSON.stringify(knopf));
    if (knopf.length === 1) {
      E(`Array.from(document.querySelectorAll('#scr-entry button')).find(b => (b.getAttribute('onclick') || '').includes("openEntry('${r.ziel}')")).click()`);
      pruef(`${modus}: … und öffnet genau diesen Tag`, E('editISO') === r.ziel, E('editISO'));
    }
    pruef(`${modus}: keine JS-Fehler beim Anzeigen`, errors.length === 0, errors[0]);
  }

  console.log('\nB - Gegenprobe: Der Topf ist wirklich als trocken getippt');
  {
    const r = JSON.parse(E(LAGE(true)));
    E(`(function(){ const c = S.cycles[0]; S.entries['${r.iso}'] = { temp: '', humidity: '', cycleData: { [c.id]: { doses: {}, water: '', ph: '', ec: '', notes: '', photos: [], trichomes: null, restPct: 20, _restPctUserSet: true } } }; saveS(); })()`);
    const text = E(EINTRAG(r.iso));
    pruef('Gemessene 20 % bleiben „Wasserstress · Sofort gießen"', /Pflanze hat Wasserstress/.test(text) && /Sofort gießen/.test(text));
    pruef('… ohne Rückfrage nach dem Guss', !/Nicht gemessen/.test(text));
  }

  console.log('\nC - Gegenprobe: Alle geplanten Güsse sind eingetragen');
  {
    const r = JSON.parse(E(LAGE(true)));
    E(`(function(){ const c = S.cycles[0]; for (let d = 0; d < 200; d++) { const t = isoPlus(c.startDate, d); if (t >= todayISO()) break;
      if (${GUSS}.includes(getAction(t, c))) S.entries[t] = { temp: '', humidity: '', cycleData: { [c.id]: { doses: {}, water: '500', ph: '', ec: '', notes: '', photos: [], trichomes: null } } }; } saveS(); })()`);
    const text = E(EINTRAG(r.iso));
    pruef('Keine Rückfrage, kein Alarm', !/Nicht gemessen/.test(text) && !ALARM.test(text), (text.match(/(Nicht gemessen|Pflanze hat Wasserstress)[^]{0,120}/) || [''])[0]);
  }

  console.log('\nD - Gegenprobe: Geplanter Gießtag nach einem nicht eingetragenen Guss');
  {
    const r = JSON.parse(E(`(function(){
      S.cycles = []; S.entries = {}; S.beginnerMode = true;
      const c = addCyc({ name: 'Gießtag', seedType: 'auto', medium: 'erde' });
      c.weightMode = 'lift';
      for (let d = 12; d <= 70; d++) {
        c.startDate = isoPlus(todayISO(), -(d - 1));
        const iso = todayISO();
        if (!['giess', 'giess_anz'].includes(getAction(iso, c))) continue;
        if (intervalDryDefault(c, iso).source !== 'overdue') continue;
        saveS();
        return JSON.stringify({ tag: d, iso });
      }
      return JSON.stringify({ fehlt: true });
    })()`));
    pruef('Prüflage gefunden', !r.fehlt);
    if (!r.fehlt) {
      const text = E(EINTRAG(r.iso));
      pruef('„Heute gießen — geplanter Gieß-Tag" bleibt', /Heute gießen — geplanter Gieß-Tag/.test(text), (text.match(/(Heute gießen|Nicht gemessen|Wasserstress)[^]{0,80}/) || [''])[0]);
      pruef('… ohne Alarm und ohne Rückfrage', !ALARM.test(text) && !/Nicht gemessen/.test(text));
    }
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
