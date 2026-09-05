/**
 * (v1.5.97) Sichert den Abgleich zwischen Plan-Erntetag und Trichom-Messung ab.
 *
 * Der Fehler: Das Dashboard forderte mit "In 3 Tagen: Erntetag" zum Schneiden auf, waehrend
 * dieselbe App in den Einstellungen ein Erntefenster nannte, das ERST DANACH beginnt
 * (Tag 118-158 gegen Plan-Tag 116). Beide Zahlen standen ohne Bezug nebeneinander.
 *
 * Alle Pruefungen arbeiten mit einem FESTEN Datum statt mit todayISO(). Sonst waere der Test
 * ab dem naechsten Tag wertlos: harvestWindow nimmt die Trichom-Basis nur, solange die
 * Messung hoechstens 3 Tage zurueckliegt.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

const HEUTE = '2026-09-05';    // Tag 113 in Patricks Zyklus, Messung vom 02.09. ist 3 Tage alt
const SPAETER = '2026-09-10';  // Messung dann 8 Tage alt -> Trichom-Basis faellt weg

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

async function load(mut) {
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
      const st = JSON.parse(BACKUP);
      if (mut) mut(st);
      w.localStorage.setItem('growsmart_v4', JSON.stringify(st));
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
  else { fail++; console.log('  FEHL ' + name + (info ? '  -> ' + info : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  // ---- A: Die Ausgangslage, unter der der Fehler auftrat ----
  console.log('');
  console.log('A - Ausgangslage: Messung nennt einen spaeteren Tag als der Plan');
  {
    const { E, errors } = await load();
    pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

    const hw = JSON.parse(E(`JSON.stringify(harvestWindow(S.cycles.find(c=>c.active), "${HEUTE}"))`));
    pruef('Erntefenster stammt aus den Trichomen', hw.basis === 'trichome', 'basis=' + hw.basis);
    pruef('Fenster beginnt an Tag 118', hw.lo === 118, 'lo=' + hw.lo);
    pruef('Plan rechnet mit Tag 116', hw.planTag === 116, 'planTag=' + hw.planTag);
    pruef('Die Messung liegt tatsaechlich spaeter', hw.lo > hw.planTag);
  }

  // ---- B: _trichVsPlan meldet die Differenz ----
  console.log('');
  console.log('B - Der Abgleich meldet die Differenz');
  {
    const { E } = await load();
    const v = JSON.parse(E(`JSON.stringify(_trichVsPlan(S.cycles.find(c=>c.active), "${HEUTE}"))`));
    pruef('Es kommt ueberhaupt ein Ergebnis', v !== null);
    pruef('Plan-Tag 116 wird mitgeliefert', v && v.planTag === 116);
    pruef('Frueheste Reife Tag 118', v && v.fruehestens === 118);
    pruef('Differenz betraegt 2 Tage', v && v.tageSpaeter === 2, v && ('tageSpaeter=' + v.tageSpaeter));
    pruef('Breites Fenster wird als unsicher gekennzeichnet', v && v.unsicher === true,
      v && ('lo=' + v.fruehestens + ' hi=' + v.spaetestens));
    pruef('Nachlassendes Tempo wird erkannt', v && v.verlangsamt === true);
    pruef('Letzte Messung wird mitgegeben (4 % Bernstein)', v && v.letzte && v.letzte.amber === 4);
    pruef('Ziel wird mitgegeben (5 %)', v && v.ziel === 5);
  }

  // ---- C: Der Text sagt es dem Nutzer ----
  console.log('');
  console.log('C - Der Erntetext widerspricht dem Plan, statt zum Schneiden aufzufordern');
  {
    const { E } = await load();
    const txt = E(`T.phaseTransition.toHarvestSoon({ daysUntil: 3, vsPlan: _trichVsPlan(S.cycles.find(c=>c.active), "${HEUTE}") })`);
    pruef('Text sagt deutlich "noch nicht"', /noch nicht/.test(txt));
    pruef('Text nennt den fruehesten Tag 118', /Tag 118/.test(txt));
    pruef('Text nennt den gemessenen Stand 4 %', /4 % bernsteinfarben/.test(txt));
    pruef('Text nennt das Ziel 5 %', /5 %/.test(txt));
    pruef('Text weist die Messung als massgeblich aus', /richte dich nach der Messung/.test(txt));
    pruef('Text warnt vor dem Schaden zu frueher Ernte', /Zu früh geerntet/.test(txt));
    pruef('Text nennt die Unsicherheit bis Tag 158', /bis Tag 158/.test(txt));
    pruef('Text nennt das nachlassende Tempo', /nachgelassen/.test(txt));

    // Ohne Konflikt bleibt der alte, kurze Text erhalten
    const ohne = E('T.phaseTransition.toHarvestSoon({ daysUntil: 3, vsPlan: null })');
    pruef('Ohne Konflikt: alter Text mit Lupen-Hinweis', /Lupe/.test(ohne) && !/noch nicht/.test(ohne));
    pruef('Ohne Konflikt: Text bleibt kurz', ohne.length < 250, 'Laenge=' + ohne.length);
  }

  // ---- D: Gegenproben — kein Fehlalarm ----
  console.log('');
  console.log('D - Gegenproben: kein Fehlalarm, wenn kein Widerspruch besteht');
  {
    const { E } = await load();
    // Messung zu alt -> Fenster stammt nicht mehr aus Trichomen
    const spaet = E(`JSON.stringify(_trichVsPlan(S.cycles.find(c=>c.active), "${SPAETER}"))`);
    const hwSpaet = JSON.parse(E(`JSON.stringify(harvestWindow(S.cycles.find(c=>c.active), "${SPAETER}"))`));
    pruef('Veraltete Messung: Basis ist nicht mehr "trichome"', hwSpaet.basis !== 'trichome', 'basis=' + hwSpaet.basis);
    pruef('Veraltete Messung: kein Hinweis', spaet === 'null' || spaet === undefined, 'ergab ' + spaet);
  }
  {
    // Plan-Tag hinter die Messung schieben -> Messung liegt dann FRUEHER, kein Widerspruch
    const { E } = await load((st) => {
      const c = st.cycles.find((x) => x.active);
      c.bloomDays = (c.bloomDays || 85) + 20;
    });
    const hw = JSON.parse(E(`JSON.stringify(harvestWindow(S.cycles.find(c=>c.active), "${HEUTE}"))`));
    const v = E(`JSON.stringify(_trichVsPlan(S.cycles.find(c=>c.active), "${HEUTE}"))`);
    pruef('Plan liegt jetzt hinter der Messung', hw.planTag > hw.lo, 'planTag=' + hw.planTag + ' lo=' + hw.lo);
    pruef('Messung frueher als Plan: kein Hinweis', v === 'null' || v === undefined, 'ergab ' + v);
  }

  // ---- E: Die Einstellungs-Zeile nennt beide Zahlen ----
  console.log('');
  console.log('E - Einstellungen erklaeren die zweite Zahl');
  {
    const { E, errors } = await load();
    E('S.beginnerMode = false');
    E('renderSet()');
    const txt = E('document.getElementById("scr-set").textContent.replace(/\\s+/g," ")');
    pruef('Einstellungen rendern ohne Fehler', errors.length === 0, errors[0]);
    pruef('Erntefenster wird genannt', /Erntefenster: Tag 118–158/.test(txt));
    pruef('Plan-Tag 116 wird daneben erklaert', /Plan rechnet mit Tag 116/.test(txt));
    pruef('Es wird gesagt, welche Zahl gilt', /die Messung gilt/.test(txt));
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
