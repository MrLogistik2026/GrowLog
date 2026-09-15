/**
 * (v1.5.209) Drain-EC: eine Regel — das Verhältnis Drain ÷ Gießwasser (ANBAU.md 5.1).
 *
 * Der Befund (Begriffe-Prüfung, Schritt 4 und 6): analyzeRunoff rechnete den Status mit „Differenz > 0,5 und Drain über dem
 * Zielbereich × 1,15", das Etikett mit dem Verhältnis 1,6. Gießwasser 1,8 / Drain 2,35 (1,31×, nach ANBAU.md normal) ergab eine
 * orange Warnung „im Substrat sammeln sich Salze", 0,5 / 1,0 (2,0×, Anreicherung) nur ein ⚠ im Etikett und keinen Hinweis.
 * Dazu bildete die App das Verhältnis auch aus einem nur vorgeschlagenen Gießwasser-EC (Regel 2).
 *
 * Jetzt: bis 1,3× Gleichgewicht, bis 1,6× normal bei voller Düngung, darüber Anreicherung, darunter „nimmt mehr auf" — nur bei
 * gültigem Drain und gemessenem Gießwasser-EC, beim Spülen gar nicht.
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  // Frischer Erde-Zyklus, 85 Blütetage: ein Tag in der ersten Blütehälfte, einer in der zweiten, ein Spültag.
  const T = JSON.parse(E(`(function(){ setDebugDate('2026-01-01'); S.cycles = []; S.entries = {};
    const c = addCyc({ name: 'D', seedType: 'auto', medium: 'erde', bloomDays: 85 });
    c.startDate = '2026-01-01'; c.anzuchtDays = 21; c.bloomDays = 85; c.plants = [{ id: 'p0', name: 'P1' }]; c.plantCount = 1; saveS();
    const t = { frueh: null, spaet: null, spuel: null };
    for (let d = 1; d <= 150; d++) { const iso = isoPlus(c.startDate, d - 1); const p = phase(iso, c); if (!p) continue;
      if (!t.frueh && p.ph === 'bloom' && p.bloomDay > 5 && p.bloomDay * 2 < p.bloomLen) t.frueh = iso;
      if (!t.spaet && p.ph === 'bloom' && p.bloomDay * 2 > p.bloomLen + 10) t.spaet = iso;
      if (!t.spuel && p.ph === 'flush') t.spuel = iso; }
    return JSON.stringify(t); })()`));
  pruef('Prüflage: Tage in beiden Blütehälften und ein Spültag', !!(T.frueh && T.spaet && T.spuel), JSON.stringify(T));

  const alle = [];
  const fall = (iso, ec, drain, extra) => {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0]; S.entries['${iso}'] = { cycleData: {} };
      const cd = Object.assign({ water: '3000', drainMl: '600', ec: '${ec === null ? '' : ec}', runoffEc: '${drain}' }, ${JSON.stringify(extra || {})});
      S.entries['${iso}'].cycleData[c.id] = cd;
      const ra = analyzeRunoff(cd, c.medium, _ecTargetFor(c, '${iso}'), { c, iso: '${iso}' });
      return JSON.stringify({ status: ra.ecStatus, label: ra.ecLabel, warn: ra.warnings, box: ra.boxSeverity, sev: ra.ecSeverity, gueltig: ra.ecGueltig }); })()`));
    alle.push(r);
    return r;
  };
  const text = (r) => r.label + ' | ' + r.status + ' | ' + r.box + ' | ' + (r.warn[0] || '').replace(/<[^>]+>/g, '').slice(0, 90);

  console.log('\nA - Die vier gemessenen Fälle der Prüfung (erste Blütehälfte, 20 % Drain)');
  const a1 = fall(T.frueh, '1.8', '2.35');
  pruef('1,8 → 2,35 (1,31×): „normal bei voller Düngung", keine orange Box', a1.status === 'rising-ok' && a1.label === 'Drain 1,31× Gießwasser · normal bei voller Düngung' && a1.box !== 'warning', text(a1));
  const a2 = fall(T.frueh, '0.5', '1.0');
  pruef('0,5 → 1,0 (2,0×): Anreicherung mit Hinweis und oranger Box', a2.status === 'warning-high' && a2.label === '⚠ Drain 2,00× Gießwasser · Anreicherung' && a2.warn.some(w => /mehr als das 1,6-Fache/.test(w)) && a2.box === 'warning', text(a2));
  const a3 = fall(T.frueh, '1.0', '1.8');
  pruef('1,0 → 1,8 (1,8×): Anreicherung', a3.status === 'warning-high', text(a3));
  const a4 = fall(T.frueh, '1.4', '1.95');
  pruef('1,4 → 1,95 (1,39×): normal, keine orange Box', a4.status === 'rising-ok' && a4.box !== 'warning', text(a4));
  const a5 = fall(T.frueh, '1.2', '1.3');
  pruef('1,2 → 1,3 (1,08×): Gleichgewicht, ohne Hinweis', a5.status === 'ok' && a5.label === '✓ Drain 1,08× Gießwasser · Gleichgewicht' && a5.warn.length === 0, text(a5));

  console.log('\nB - Drain unter dem Gießwasser');
  const b1 = fall(T.frueh, '1.5', '1.2');
  pruef('Erste Blütehälfte, 0,8×: Hinweis „nimmt mehr Salz auf", kein Alarm', b1.status === 'warning-low' && b1.sev === 'info' && b1.box !== 'warning' && b1.warn.some(w => /mehr Salz auf, als du zuführst/.test(w) && /Dosis leicht anheben/.test(w)), text(b1));
  const b2 = fall(T.spaet, '1.5', '1.2');
  pruef('Zweite Blütehälfte, 0,8×: normal, „Nicht nachdüngen", kein „nachdüngen?"', b2.warn.some(w => /Nicht nachdüngen/.test(w)) && !b2.warn.some(w => /anheben/.test(w)) && /zehrt vom Vorrat im Topf/.test(b2.label) && !/nachdüngen\?/.test(b2.label), text(b2));

  console.log('\nC - Ohne gültige Messung keine Bewertung');
  const c1 = fall(T.frueh, '0.5', '1.0', { _suggested: { ec: true } });
  pruef('Gießwasser-EC nur vorgeschlagen: nicht bewertet, Rückfrage, keine Warnung', c1.status === null && c1.gueltig === false && c1.label === 'Gießwasser-EC nicht gemessen · nicht bewertet' && c1.warn.some(w => /nur der Vorschlag der App/.test(w)) && c1.box !== 'warning', text(c1));
  const c2 = fall(T.frueh, null, '1.0');
  pruef('Ohne Gießwasser-EC: „Gießwasser-EC fehlt"', c2.status === null && c2.label === 'Gießwasser-EC fehlt · nicht bewertet' && c2.warn.some(w => /fehlt/.test(w)), text(c2));
  const c3 = fall(T.frueh, '0.5', '1.0', { drainMl: '150' });
  pruef('5 % Drain: nicht bewertet, keine orange Box', c3.status === null && c3.gueltig === false && c3.box !== 'warning', text(c3));

  console.log('\nD - Spülen');
  const d1 = fall(T.spuel, '0.3', '0.9');
  pruef('Spültag, 3× Gießwasser: „beim Spülen normal", kein Alarm', d1.status === 'spuelen' && /beim Spülen normal/.test(d1.label) && !/⚠/.test(d1.label) && d1.box !== 'warning', text(d1));

  console.log('\nE - Etikett und Status aus derselben Rechnung');
  const falsch = alle.filter(r => /⚠/.test(r.label) !== (r.status === 'warning-high'));
  pruef('⚠ im Etikett genau dann, wenn der Status „Anreicherung" sagt', falsch.length === 0, falsch.map(text).join(' || '));
  const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  const koerper = code.slice(code.indexOf('function analyzeRunoff('), code.indexOf('\n}\n', code.indexOf('function analyzeRunoff(')));
  pruef('Quelltext: keine feste Differenz und kein Zielbereich mehr in analyzeRunoff', !/ecDelta > 0\.5|_overTarget|_ecMax/.test(koerper) && /DRAIN_EC_VERHAELTNIS\s*=\s*\{\s*gleich:\s*1\.3,\s*voll:\s*1\.6\s*\}/.test(code));

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
