/**
 * (v1.5.150) Ein Drain-EC ohne Ablaufmenge wird nicht bewertet — und das Etikett deutet nicht.
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft): analyzeRunoff hielt eine Messung ohne
 * Ablaufmenge für gültig (`flow && !flow.gueltig` ist bei flow = null falsch). Alle 24
 * Ablaufmessungen in Patricks Daten haben keine Menge und wurden trotzdem bewertet — im selben
 * Block wie der Satz „Ohne Ablaufmenge lässt sich nicht sagen, ob die Messung etwas taugt".
 * Dazu nannte das Etikett mit „Salz-Akkumulation" eine einzige Ursache (ANBAU.md 5.1, Regel 3),
 * und der Diagramm-Untertitel riet ab Faktor 1,5 pauschal zum Spülen; ANBAU.md 5.1 nennt 1,3–1,6
 * „normal in der Vollversorgung".
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
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

const BEWERTUNG = /Zielbereich|zehrt gerade|Salz|Kalk-Puffer|driftet|frisst die Nährstoffe/;
const TAG = '2026-07-19';

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`setDebugDate('2026-09-13')`);

  console.log('\nA - Patricks Ablaufmessungen, alle ohne Menge');
  {
    const r = JSON.parse(E(`(function(){
      const c = S.cycles[0]; const aus = [];
      Object.keys(S.entries).sort().forEach(iso => {
        const cd = S.entries[iso].cycleData && S.entries[iso].cycleData[c.id];
        if (!cd || !(cd.runoffEc || cd.runoffPh)) return;
        const ra = analyzeRunoff(cd, c.medium, _ecTargetFor(c, iso), { c, iso });
        aus.push({ iso, menge: cd.drainMl || null, ecGueltig: ra.ecGueltig, label: ra.ecLabel, warnungen: ra.warnings, box: ra.boxSeverity });
      });
      return JSON.stringify(aus);
    })()`));
    const bewertet = r.filter(x => x.ecGueltig !== false || x.warnungen.some(w => BEWERTUNG.test(w)));
    const salz = r.filter(x => /Salz-Akkumulation/.test(x.label || ''));
    console.log(`    ${r.length} Messungen · mit Menge: ${r.filter(x => x.menge).length} · bewertet: ${bewertet.length} · „Salz-Akkumulation": ${salz.length}`);
    pruef('Prüflage: über 20 Ablaufmessungen, keine mit Menge', r.length >= 20 && r.every(x => !x.menge), r.length);
    pruef('Keine davon wird bewertet', bewertet.length === 0, bewertet.slice(0, 3).map(x => x.iso + ' ' + (x.warnungen[0] || '').slice(0, 50)).join(' | '));
    pruef('Kein Etikett nennt „Salz-Akkumulation"', salz.length === 0, salz.map(x => x.iso + ' ' + x.label).slice(0, 3).join(' | '));
    pruef('Jedes Etikett mit EC-Differenz sagt „nicht bewertet"', r.filter(x => /EC/.test(x.label) && !/unbekannt/.test(x.label)).every(x => /nicht bewertet/.test(x.label)), r.map(x => x.label).slice(0, 4).join(' | '));
    pruef('Keine Box steht auf Warnung', r.every(x => x.box !== 'warning'), r.filter(x => x.box === 'warning').map(x => x.iso).join(', '));
  }

  console.log(`\nB - ${TAG} mit deutlich zu hohem Drain-EC: erst ohne, dann mit Ablaufmenge`);
  {
    const lauf = (menge) => JSON.parse(E(`(function(){
      const c = S.cycles[0]; const cd = S.entries['${TAG}'].cycleData[c.id];
      cd.ec = '1.2'; cd.runoffEc = '3.0'; cd.drainMl = ${menge === null ? 'undefined' : `String(Math.round(parseFloat(cd.water) * ${menge}))`};
      const ra = analyzeRunoff(cd, c.medium, _ecTargetFor(c, '${TAG}'), { c, iso: '${TAG}' });
      const ctx = buildDiagnosticContext(c, '${TAG}');
      return JSON.stringify({ ecGueltig: ra.ecGueltig, status: ra.ecStatus, label: ra.ecLabel, warnungen: ra.warnings, box: ra.boxSeverity, ecDeltaPos: !!ctx.ecDeltaPos });
    })()`));
    const ohne = lauf(null), mit = lauf(0.2);
    console.log('    ohne Menge: ' + ohne.label + ' · Box ' + ohne.box + ' · Diagnose-Kontext ecDeltaPos ' + ohne.ecDeltaPos);
    console.log('    mit 20 %:   ' + mit.label + ' · Box ' + mit.box + ' · Diagnose-Kontext ecDeltaPos ' + mit.ecDeltaPos);
    pruef('Prüflage: der Wert selbst ist „zu hoch"', ohne.status === 'warning-high' && mit.status === 'warning-high', ohne.status + ' / ' + mit.status);
    pruef('Ohne Menge: nicht bewertet, keine Warnung, keine orange Box', ohne.ecGueltig === false && !ohne.warnungen.some(w => BEWERTUNG.test(w)) && ohne.box !== 'warning', JSON.stringify(ohne).slice(0, 160));
    pruef('Ohne Menge: auch der Diagnose-Kontext wertet ihn nicht', ohne.ecDeltaPos === false);
    pruef('Mit 20 % Ablauf: die Bewertung kommt zurück, Box orange', mit.ecGueltig === true && mit.warnungen.some(w => /Zielbereich/.test(w)) && mit.box === 'warning', JSON.stringify(mit).slice(0, 160));
    pruef('Mit 20 % Ablauf: Diagnose-Kontext kennt den Befund', mit.ecDeltaPos === true);
    pruef('Mit 20 % Ablauf: Etikett nennt das Verhältnis mit ⚠, ohne eine Ursache zu behaupten', /^⚠ EC \+1\.8 \(Drain 2,50× Zulauf\)$/.test(mit.label), mit.label);
  }

  console.log('\nC - Das Etikett folgt der Tabelle aus ANBAU.md 5.1');
  {
    const l = (d, v, g) => E(`T.runoff.ecLabel({ delta: ${d}, verhaeltnis: ${v}, gueltig: ${g} })`);
    const normal = l(0.5, 1.45, true), anreich = l(0.8, 1.7, true), leicht = l(0.3, 1.25, true), ungueltig = l(0.6, 1.5, false);
    console.log(`    1,45: „${normal}" · 1,70: „${anreich}" · 1,25: „${leicht}" · ungültig: „${ungueltig}"`);
    pruef('1,45× Zulauf: beschrieben, ohne ⚠', normal === 'EC +0.5 (Drain 1,45× Zulauf)', normal);
    pruef('1,70× Zulauf: mit ⚠', /^⚠ /.test(anreich), anreich);
    pruef('1,25× Zulauf: ohne ⚠', !/⚠/.test(leicht), leicht);
    pruef('Nicht beurteilbar: „EC +0.6 · nicht bewertet"', ungueltig === 'EC +0.6 · nicht bewertet', ungueltig);
  }

  console.log(`\nD - Sichtbar im Eintrag vom ${TAG} (Profi, Originaldaten ohne Menge)`);
  {
    const { E: E2 } = await load();
    E2(`setDebugDate('2026-09-13'); S.beginnerMode = false; openEntry('${TAG}')`);
    await warte(200);
    const r = JSON.parse(E2(`(function(){
      const id = S.cycles[0].id; refreshRunoffAnalysis(id);
      const t = (x) => (document.getElementById(x + id) || { textContent: '' }).textContent.replace(/\\s+/g, ' ').trim();
      return JSON.stringify({ status: t('runoff-status-'), warnung: t('runoff-warn-'), fluss: t('runoff-flow-') });
    })()`));
    console.log('    Status: „' + r.status + '" · Durchfluss: „' + r.fluss.slice(0, 70) + '"');
    pruef('Statuszeile: „nicht bewertet", keine „Salz-Akkumulation"', /nicht bewertet/.test(r.status) && !/Salz/.test(r.status), r.status);
    pruef('Keine Bewertung unter den Feldern', !BEWERTUNG.test(r.warnung), r.warnung.slice(0, 100));
    pruef('Die Rückfrage nach der Menge steht da', /Ohne Ablaufmenge/.test(r.fluss), r.fluss);
  }

  console.log('\nE - Die Faustregel „× 1,5 = Spülung nötig" steht nirgends mehr');
  {
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n')
      .map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z));
    [/Input × 1\.5/, /Salz-Akkumulation, Spülung nötig/, /— Salz-Akkumulation/, /max 1\.5× höher/].forEach(re => {
      const treffer = quelle.filter(x => re.test(x.z)).map(x => 'Zeile ' + x.nr);
      pruef('Nirgends: ' + re.source, treffer.length === 0, treffer.join(', '));
    });
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
