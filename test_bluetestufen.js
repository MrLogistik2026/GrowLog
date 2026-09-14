/**
 * (v1.5.141) Blütestufen folgen dem Anteil an der Blüte, nicht festen Blütewochen.
 *
 * Der Fehler (Prüf-Agenten, Blickwinkel Dauer-Automatik, gegengeprüft): Klimaziel, Schimmel-
 * Alarm, VPD-Einstufung, Kälte-Warnung, Trichom-Hinweise und Notiz-Vorschläge fragten feste
 * Blütewochen ab (≤ 3 früh, ≤ 6 mittel, ≥ 7 spät). Eine Auto mit 42 Blütetagen erreichte nie die
 * späte Blüte — kein Schimmel-Alarm ab 60 % RLF, kein „Trichome checken". Bei 85 Blütetagen
 * galt ab Blütetag 43 (51 %) schon Spätblüte.
 *
 * Die Regel: bluetestufe(p) teilt nach Anteil an der Blüte, so gewählt, dass 60 Blütetage exakt
 * die bisherigen Tage behalten. Patricks Wunsch: „Das sollte sich automatisch anpassen."
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

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
      w.localStorage.setItem('growsmart_v4', BACKUP);
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

// Einen Zyklus mit 21 Anzucht- und `bd` Blütetagen anlegen; Blütetag t liegt dann an Tag 21 + t.
const HELFER = `
  window.__zyklus = function (bd) {
    const c = addCyc({ name: 'Stufen ' + bd, seedType: 'auto', medium: 'erde' });
    c.id = 'stufen_' + bd; c.startDate = '2026-01-01';
    c.anzuchtDays = 21; c.bloomDays = bd; c.flushDays = 7; c.iceDays = 2; c.harvestDays = 1;
    c.fertPlanId = S.cycles[0].fertPlanId;
    return c;
  };
  window.__bluete = function (c, t) { const iso = isoPlus(c.startDate, 21 + t - 1); return { iso, p: phase(iso, c) }; };
  window.__klima = { 'Frühe Blüte': 'frueh', 'Mittlere Blüte': 'mittel', 'Späte Blüte': 'spaet' };
`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(HELFER);

  console.log('\nA - 60 Blütetage (Standard): jede Stufe am selben Tag wie mit der alten Wochenregel');
  {
    const r = JSON.parse(E(`(function(){
      const c = __zyklus(60); const abw = [];
      for (let t = 1; t <= 60; t++) {
        const { p } = __bluete(c, t);
        const alt = p.week <= 3 ? 'frueh' : (p.week <= 6 ? 'mittel' : 'spaet');
        const klima = __klima[(getPhaseTargets(p) || {}).label];
        const alarm = !!(getCriticalWarning('rlf', 62, p, c) || {}).level && getCriticalWarning('rlf', 62, p, c).level === 'critical';
        if (klima !== alt) abw.push('Tag ' + t + ' Klima ' + klima + ' statt ' + alt);
        if (alarm !== (alt === 'spaet')) abw.push('Tag ' + t + ' Schimmel-Alarm ' + alarm);
      }
      return JSON.stringify(abw);
    })()`));
    pruef('Klimaziel und Schimmel-Alarm unverändert an allen 60 Blütetagen', r.length === 0, r.slice(0, 4).join(' | '));
  }

  console.log('\nB - 42, 85 und 105 Blütetage: dieselben Anteile');
  const grenzen = JSON.parse(E(`(function(){
    const out = {};
    [42, 85, 105].forEach(bd => {
      const c = __zyklus(bd); let alt = null; const wechsel = [];
      for (let t = 1; t <= bd; t++) {
        const { p } = __bluete(c, t);
        const k = __klima[(getPhaseTargets(p) || {}).label];
        if (k !== alt) { wechsel.push([t, k]); alt = k; }
      }
      out[bd] = wechsel;
    });
    return JSON.stringify(out);
  })()`));
  for (const [bd, w] of Object.entries(grenzen)) {
    const n = Number(bd);
    const soll = [[1, 'frueh'], [Math.floor(21 * n / 60) + 1, 'mittel'], [Math.floor(42 * n / 60) + 1, 'spaet']];
    console.log('    ' + bd + ' Blütetage: ' + w.map(([t, k]) => k + ' ab Tag ' + t).join(' · '));
    pruef(bd + ' Blütetage: früh → mittel → spät an den Anteilen 35 % / 70 %', JSON.stringify(w) === JSON.stringify(soll), JSON.stringify(w) + ' statt ' + JSON.stringify(soll));
  }

  console.log('\nC - Die kurze Auto (42 Blütetage) bekommt ihre späte Blüte');
  {
    const r = JSON.parse(E(`(function(){
      const c = __zyklus(42);
      const { iso, p } = __bluete(c, 40);
      const alarm = getCriticalWarning('rlf', 62, p, c);
      const vpd = vpdZone(1.3, p, 'indoor');
      setDebugDate(iso);
      const hinweis = getAlerts(c).some(a => /Trichome checken/.test(a.text || ''));
      return JSON.stringify({ woche: p.week, klima: (getPhaseTargets(p) || {}).label, alarm: alarm && alarm.level, vpd: vpd && vpd.label, hinweis });
    })()`));
    pruef('Blütetag 40 von 42: Klimaziel „Späte Blüte"', r.klima === 'Späte Blüte', JSON.stringify(r));
    pruef('… Schimmel-Alarm bei 62 % RLF', r.alarm === 'critical', r.alarm);
    pruef('… VPD 1,3 gilt als zu niedrig für die Spätblüte', /Spätblüte/.test(r.vpd || ''), r.vpd);
    pruef('… Hinweis „Trichome checken"', r.hinweis === true);
  }

  console.log('\nD - Patricks Länge (85 Blütetage): Tag 43 ist noch mittlere Blüte');
  {
    const r = JSON.parse(E(`(function(){
      const c = __zyklus(85);
      const a = __bluete(c, 43).p, b = __bluete(c, 60).p;
      return JSON.stringify({ t43: (getPhaseTargets(a) || {}).label, alarm43: (getCriticalWarning('rlf', 62, a, c) || {}).level || null,
        t60: (getPhaseTargets(b) || {}).label, alarm60: (getCriticalWarning('rlf', 62, b, c) || {}).level || null });
    })()`));
    pruef('Blütetag 43 (51 %): Mittlere Blüte, kein Spätblüte-Alarm bei 62 %', r.t43 === 'Mittlere Blüte' && r.alarm43 !== 'critical', JSON.stringify(r));
    pruef('Blütetag 60 (71 %): Späte Blüte mit Schimmel-Alarm', r.t60 === 'Späte Blüte' && r.alarm60 === 'critical', JSON.stringify(r));
  }

  console.log('\nE - Eine Quelle, mit Rückfall für alte Phasenobjekte');
  {
    const r = JSON.parse(E(`JSON.stringify({ gibts: typeof bluetestufe === 'function',
      alt7: typeof bluetestufe === 'function' ? bluetestufe({ ph: 'bloom', week: 7 }) : null,
      alt3: typeof bluetestufe === 'function' ? bluetestufe({ ph: 'bloom', week: 3 }) : null,
      spuelen: typeof bluetestufe === 'function' ? bluetestufe({ ph: 'flush' }) : 'x' })`));
    pruef('bluetestufe gibt es', r.gibts);
    pruef('Ohne Blütetag gilt die alte Wochenregel (Woche 7 spät, Woche 3 früh)', r.alt7 === 'spaet' && r.alt3 === 'frueh', JSON.stringify(r));
    pruef('Außerhalb der Blüte keine Stufe', r.spuelen === null, JSON.stringify(r));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
