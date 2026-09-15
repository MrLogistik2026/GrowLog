/**
 * (v1.5.206) Reserve als Zeitpunkt: heute gießen, wenn der Topf bis morgen unter den Gießpunkt fällt.
 *
 * Der Befund (Gießmengen-Prüfung, Runde 3, Schritt 9): Der Gießpunkt ist fest, der Rhythmus auch. Trocknet ein Topf schneller,
 * als der Rhythmus erlaubt (kleiner Topf, große Pflanze, trockene Luft), fällt er zwischen zwei Gießtagen unter die Stressgrenze —
 * im Topfmodell mit 220 ml/L 13 Stress-Tage in einem Zyklus. Bei Automatics ist jeder davon ein dauerhafter Verlust (ANBAU.md 9).
 *
 * Jetzt: Aus dem letzten vollständigen Zyklus (vorletzter Guss = voll, vor dem letzten Guss gemessen) folgt die Tagesabnahme.
 * Zeigt die heutige Messung an einem Tag ohne Guss, dass der Topf morgen unter der Gießpunkt-Untergrenze läge, sagt die
 * Statusbox „Heute gießen". Ohne Messung vor dem letzten Guss keine Aussage — geschätzt wird nicht.
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
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
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
async function abschnitt(titel, fn) {
  console.log('\n' + titel);
  try { await fn(); } catch (e) { pruef(titel + ' — lief ohne Fehler', false, String(e && e.message || e).slice(0, 200)); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  E(`setDebugDate('2026-01-01')`);
  // Frischer Erde-Zyklus, 11 L, Hebe-Test. Guss an Tag 60 und 62 (vor dem zweiten gemessen), Tag 63 ohne Guss.
  const T = JSON.parse(E(`(function(){ S.cycles = []; S.entries = {};
    const c = addCyc({ name: 'R', seedType: 'auto', medium: 'erde', bloomDays: 85 });
    c.startDate = '2026-01-01'; c.potSize = 11; c.anzuchtDays = 21; c.bloomDays = 85; c.weightMode = 'lift';
    c.plants = [{ id: 'p0', name: 'P1' }]; c.plantCount = 1; saveS();
    const t = function (d) { return isoPlus(c.startDate, d - 1); };
    return JSON.stringify({ P: t(60), L: t(62), D: t(63) }); })()`));
  const lage = (feld, wertL, wertD) => E(`(function(){ const c = S.cycles[0]; S.entries = {};
    S.entries['${T.P}'] = { cycleData: {} }; S.entries['${T.P}'].cycleData[c.id] = { water: '3000' };
    S.entries['${T.L}'] = { cycleData: {} }; S.entries['${T.L}'].cycleData[c.id] = { water: '3000' };
    ${wertL === null ? '' : `S.entries['${T.L}'].cycleData[c.id].${feld} = '${wertL}';`}
    S.entries['${T.D}'] = { cycleData: {} }; S.entries['${T.D}'].cycleData[c.id] = {};
    ${wertD === null ? '' : `S.entries['${T.D}'].cycleData[c.id].${feld} = '${wertD}'; S.entries['${T.D}'].cycleData[c.id]._restPctUserSet = true;`}
    saveS(); setDebugDate('${T.D}'); openEntry('${T.D}');
    return document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' '); })()`);
  const status = (t) => (t.match(/(Heute gießen — der Topf trocknet schnell|Topf trocknet — bald gießen|Topf wäre bereit|Noch feucht|Bald gießen)[^▸]{0,110}/) || ['(kein Status)'])[0];

  await abschnitt('A - Tagesabnahme aus dem letzten Zyklus', async () => {
    lage('restPct', 30, null);
    const r = JSON.parse(E(`JSON.stringify({ ab: tagesAbnahme(S.cycles[0], '${T.D}'), giesstag: isGiessTag('${T.D}', S.cycles[0]) })`));
    pruef('Prüflage: Tag 63 ist kein Gießtag', r.giesstag === false, JSON.stringify(r));
    pruef('Guss Tag 60 voll, vor dem Guss an Tag 62 „Knapp" (30 %): 35 Punkte am Tag', !!r.ab && r.ab.proTag === 35 && r.ab.tage === 2, JSON.stringify(r.ab));
  });

  await abschnitt('B - Hebe-Test an einem Tag ohne Guss', async () => {
    const a = lage('restPct', 30, 50);
    pruef('Heute 50 %, morgen ~15 %: „Heute gießen — der Topf trocknet schnell"', /Heute gießen — der Topf trocknet schnell/.test(a) && /morgen läge er bei ~15 %/.test(a), status(a));
    const b = lage('restPct', 30, 65);
    pruef('Heute 65 %, morgen ~30 %: kein Reserve-Hinweis', !/trocknet schnell/.test(b), status(b));
    const c = lage('restPct', null, 50);
    pruef('Ohne Messung vor dem letzten Guss: kein Reserve-Hinweis (geschätzt wird nicht)', !/trocknet schnell/.test(c), status(c));
    const d = lage('restPct', 30, 35);
    pruef('Heute schon am Gießpunkt (35 %): die normale Bewertung, kein zweiter Hinweis', !/trocknet schnell/.test(d), status(d));
  });

  await abschnitt('C - Waage', async () => {
    E(`(function(){ const c = S.cycles[0]; c.weightMode = 'scale'; c.saturatedWeight = 14000; c.dryWeight = 11000; saveS(); })()`);
    const a = lage('weightG', 11000, 12000);
    pruef('Gießpunkt-Gewicht vor dem letzten Guss, heute 12000 g (53 %): „Heute gießen"', /Heute gießen — der Topf trocknet schnell/.test(a), status(a));
    const b = lage('weightG', 11000, 13000);
    pruef('Heute 13000 g (77 %): kein Reserve-Hinweis', !/trocknet schnell/.test(b), status(b));
    E(`(function(){ const c = S.cycles[0]; c.weightMode = 'lift'; saveS(); })()`);
  });

  // Beim Durchklicken gefunden: Unter „Heute gießen" stand „Nach deinem Trocknungs-Tempo eher morgen", die Startseite sagte
  // „~morgen". Greift die Reserve, sagt auch die Vorhersage „heute".
  await abschnitt('D - Eine Antwort auf „wann": Vorhersage, Startseite und Eintrag', async () => {
    lage('restPct', 30, 50);
    // Gelernte Rate festhalten, damit die Vorhersage ohne Reserve „morgen" sagen würde (50 % → 30 % bei 15 Punkten am Tag).
    const a = JSON.parse(E(`(function(){ const c = S.cycles[0], d = '${T.D}', alt = _waterConsumptionInfo;
      _waterConsumptionInfo = function () { return { ratePctPerDay: 15, rateSamples: 3 }; };
      try {
        const f = drybackForecast(c, phase(d, c), d);
        goTo('dash'); renderDash();
        const dash = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
        openEntry(d);
        const entry = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
        return JSON.stringify({ f, dashHeute: /💧 ~heute/.test(dash), dash: (dash.match(/💧 ~.{0,10}|in \\d+d/) || ['(nichts)'])[0],
          box: /Heute gießen — der Topf trocknet schnell/.test(entry), tempo: (entry.match(/Trocknungs-Tempo eher .{0,10}/) || [''])[0] });
      } finally { _waterConsumptionInfo = alt; } })()`));
    pruef('Vorhersage: „heute", als Reserve gekennzeichnet', !!a.f && a.f.days === 0 && a.f.reserve === true, JSON.stringify(a.f));
    pruef('Startseite: „💧 ~heute" statt „~morgen"', a.dashHeute, a.dash);
    pruef('Eintrag: „Heute gießen" ohne zweite Zeile „eher morgen"', a.box && a.tempo === '', a.tempo);
    lage('restPct', 30, 65);
    const b = JSON.parse(E(`JSON.stringify(drybackForecast(S.cycles[0], phase('${T.D}', S.cycles[0]), '${T.D}'))`));
    pruef('Heute 65 %: keine Reserve in der Vorhersage', !b || !b.reserve, JSON.stringify(b));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
