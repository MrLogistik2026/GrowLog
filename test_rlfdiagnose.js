/**
 * (v1.5.155) Der Diagnose-Kontext kannte „Luftfeuchte hoch" erst ab 70 %, während der Eintrag schon über 60 % „Schimmelgefahr"
 * meldete — zwei Bildschirme, zwei Antworten.
 *
 * (v1.5.193) Bewusst neu gefasst: Seit v1.5.187 bewertet der Eintrag die Luft je Phase aus KLIMA_ZIEL (klimaStatus). Die
 * Diagnose nahm dagegen weiter fest 70 % in jeder Phase und die Schimmelwarnung dazu. Folge: Der Sämling unter der Haube bei
 * 74 % — im Eintrag „Sämling ✓" — bekam in der Diagnose „Luftfeuchte hoch", die Anzucht bei 66 % und 24 °C — im Eintrag
 * „Zu feucht" — nicht. Jetzt gilt: „Luftfeuchte hoch" genau dann, wenn der Eintrag für dieselben Werte „Zu feucht",
 * „Schimmel…" oder „Nass" zeigt. Zu feucht heißt zu wenig Verdunstung (Calcium, ANBAU.md 1) und mehr Schimmelrisiko (13.5).
 * Die frühere Erwartung „Anzucht 66 % → nein" und „Spätblüte 59 % → nein" galt für die feste 70-%-Grenze.
 * Draußen und in Phasen ohne Klima-Stufe (Trocknen) bleibt die 70.
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`S.leafOffset = 2; S.beginnerMode = false`);

  // Je Klima-Stufe der erste Tag in Patricks Zyklus, dazu ein Trocknungstag.
  const tage = JSON.parse(E(`(function(){
    const c = S.cycles[0]; const t = {};
    for (let i = 0; i < 140; i++) {
      const iso = isoPlus(c.startDate, i); const p = phase(iso, c); if (!p) continue;
      const key = klimaStufe(p) || p.ph;
      if (!t[key]) t[key] = iso;
    }
    return JSON.stringify(t);
  })()`));
  console.log('    Tage: ' + ['saemling', 'anzucht', 'mittel', 'spaet', 'spuelen', 'dry'].map(k => k + ' ' + tage[k]).join(' · '));
  pruef('Prüflage: Sämling, Anzucht, mittlere und späte Blüte, Spülen, Trocknen gefunden',
    ['saemling', 'anzucht', 'mittel', 'spaet', 'spuelen', 'dry'].every(k => tage[k]), JSON.stringify(tage));

  // Temperatur und Luftfeuchte an genau diesem Tag setzen; Kontext der Diagnose und Pille des Eintrags bauen.
  const lage = (iso, temp, rlf) => JSON.parse(E(`(function(){
    const c = S.cycles[0]; const iso = '${iso}';
    if (!S.entries[iso]) S.entries[iso] = { temp: '', humidity: '', cycleData: {} };
    if (!S.entries[iso].cycleData) S.entries[iso].cycleData = {};
    if (!S.entries[iso].cycleData[c.id]) S.entries[iso].cycleData[c.id] = { doses: {} };
    S.entries[iso].temp = '${temp}'; S.entries[iso].humidity = '${rlf}';
    const ctx = buildDiagnosticContext(c, iso);
    const teile = _klimaEntryTeile('${temp}', '${rlf}', [c], iso);
    const m = teile.vpdBox.match(/id="vpd-p"[^>]*>([^<]*)</);
    return JSON.stringify({ hoch: !!ctx.humidityHigh, pille: m ? m[1] : null });
  })()`));
  const FEUCHT = /^(Zu feucht|Schimmelgefahr|Schimmelrisiko|Pilzrisiko|Nass — Schimmelgefahr)$/;

  console.log('\nA - „Luftfeuchte hoch" genau dann, wenn der Eintrag zu feucht, Schimmel oder Nässe zeigt (24 °C)');
  const faelle = [
    ['Sämling unter der Haube', 'saemling', 74, false], ['Sämling', 'saemling', 85, true],
    ['Anzucht', 'anzucht', 55, false], ['Anzucht', 'anzucht', 66, true], ['Anzucht', 'anzucht', 72, true],
    ['mittlere Blüte', 'mittel', 45, false], ['mittlere Blüte', 'mittel', 66, true],
    ['Spätblüte', 'spaet', 45, false], ['Spätblüte', 'spaet', 55, true], ['Spätblüte', 'spaet', 62, true],
    ['Spülen', 'spuelen', 62, true],
  ];
  for (const [name, k, rlf, soll] of faelle) {
    const r = lage(tage[k], 24, rlf);
    pruef(`${name}, 24 °C / ${rlf} % → „Luftfeuchte hoch" ${soll ? 'ja' : 'nein'} (Pille: ${r.pille})`,
      r.hoch === soll && FEUCHT.test(r.pille || '') === soll, JSON.stringify(r));
  }

  console.log('\nB - Ohne Temperatur, und Phasen ohne Klima-Stufe');
  {
    const ohneT62 = lage(tage.spaet, '', 62), ohneT45 = lage(tage.spaet, '', 45);
    pruef('Spätblüte ohne Temperatur, 62 % → ja (über dem Deckel)', ohneT62.hoch === true, JSON.stringify(ohneT62));
    pruef('Spätblüte ohne Temperatur, 45 % → nein (im Fenster bei 24 °C)', ohneT45.hoch === false, JSON.stringify(ohneT45));
    const t75 = lage(tage.dry, 19, 75), t65 = lage(tage.dry, 19, 65);
    pruef('Trocknen: 75 % → ja, 65 % → nein (70 % bleibt die Grenze)', t75.hoch === true && t65.hoch === false, JSON.stringify([t75, t65]));
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
