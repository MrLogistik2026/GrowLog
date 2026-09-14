/**
 * (v1.5.152) Das Trocknungsklima kommt aus einer Quelle, und beim Trocknen gibt es keinen
 * Blatt-VPD-Rat mehr.
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft): Beim richtigen Klima (18,5 °C, 60 %) stand im
 * Eintrag „Etwas niedrig — RLF kann etwas runter oder Temp etwas hoch". vpdZone kannte keine
 * Trocknungsphase und bewertete mit dem Blatt-Modell, das ein lebendes, verdunstendes Blatt
 * voraussetzt (ANBAU.md 2.1). Dazu nannte die App fünf verschiedene Trocknungsklimas: 18–20/55–62
 * (Zielzeile), 18–21/55–65 (Tipps, Startseite, Anleitung), <18/50 (IceFlush-Karte), 15–18/50 als
 * „Sweet Spot" (Lexikon), 18/60 (Notiz). Richtwert nach ANBAU.md 12.1: 18–20 °C, 55–62 %.
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

const ZIEL = '18–20 °C, 55–62 % RLF';
const RAT_FALSCH = /RLF kann etwas runter/;
const TROCKENTAG = '2026-09-13';

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`setDebugDate('${TROCKENTAG}')`);

  console.log('\nA - VPD-Bewertung beim Trocknen');
  {
    const r = JSON.parse(E(`JSON.stringify({ dry: vpdZone(0.60, { ph: 'dry', day: 121 }, 'indoor'), cure: vpdZone(0.60, { ph: 'cure', day: 130 }, 'indoor'),
      anz: vpdZone(0.60, { ph: 'anzucht', day: 20 }, 'indoor'), ziel: getPhaseTargets({ ph: 'dry' }) })`));
    console.log('    Trocknen: „' + r.dry.label + '" · ' + r.dry.hint);
    pruef('Trocknen: kein „RLF kann etwas runter"', !RAT_FALSCH.test(r.dry.hint) && r.dry.label !== 'Etwas niedrig', r.dry.label + ' / ' + r.dry.hint);
    pruef('Trocknen: der Hinweis nennt das Klima aus ANBAU.md 12.1', r.dry.hint.includes(ZIEL), r.dry.hint);
    pruef('Curing: kein „RLF kann etwas runter"', !RAT_FALSCH.test(r.cure.hint), r.cure.hint);
    pruef('Gegenprobe Anzucht: 0,60 bleibt „Etwas niedrig"', r.anz.label === 'Etwas niedrig', r.anz.label);
    pruef('Zielzeile Trocknen 18–20 °C / 55–62 %', r.ziel.tempMin === 18 && r.ziel.tempMax === 20 && r.ziel.rhMin === 55 && r.ziel.rhMax === 62, JSON.stringify(r.ziel));
  }

  console.log('\nB - Texte, die das Klima nennen');
  {
    const r = JSON.parse(E(`(function(){
      const c = S.cycles[0]; const iso = '${TROCKENTAG}'; const p = phase(iso, c);
      const lex = LEXIKON.flatMap(k => k.items || []).find(e => e.t === 'Trocknung') || {};
      const karte = getTodayAction(c, p, 'trocknen', iso) || {};
      return JSON.stringify({ ph: p.ph,
        bald: T.phaseTransition.toDrySoon({ daysUntil: 2 }),
        tipp: (getSmartTip(c, p) || {}).text || '',
        karte: (karte.steps || []).join(' | '),
        lexikon: [lex.brief, lex.mechanism, lex.practice, lex.pitfall].join(' ') });
    })()`));
    console.log('    Phase am ' + TROCKENTAG + ': ' + r.ph);
    pruef('„In 2 Tagen: Trocknung" nennt ' + ZIEL, r.bald.includes(ZIEL), r.bald);
    pruef('Tipp in der Trocknungsphase nennt ' + ZIEL, r.tipp.includes(ZIEL), r.tipp);
    pruef('Startseiten-Karte „Trocknung läuft" nennt ' + ZIEL, r.karte.includes(ZIEL), r.karte);
    pruef('Lexikon „Trocknung": Richtwert ' + ZIEL + ', 50–54 % als bewusster Tausch', r.lexikon.includes(ZIEL) && /bewusster Tausch/.test(r.lexikon) && !/15–18°C/.test(r.lexikon), r.lexikon.slice(0, 120));
  }

  console.log('\nC - Sichtbar im Eintrag vom ' + TROCKENTAG + ' mit 18,5 °C und 60 %');
  {
    const lauf = (einsteiger) => JSON.parse(E(`(function(){
      const iso = '${TROCKENTAG}';
      if (!S.entries[iso]) S.entries[iso] = { temp: '', humidity: '', cycleData: {} };
      S.entries[iso].temp = '18.5'; S.entries[iso].humidity = '60'; S.beginnerMode = ${einsteiger};
      openEntry(iso);
      const pille = document.getElementById('vpd-p');
      return JSON.stringify({ pille: pille ? pille.textContent : null, text: document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ') });
    })()`));
    const profi = lauf(false), einst = lauf(true);
    console.log('    Profi-Pille: „' + profi.pille + '"');
    pruef('Profi: die Pille bewertet nicht mehr mit „Etwas niedrig"', profi.pille && profi.pille !== 'Etwas niedrig', profi.pille);
    pruef('Einsteiger: kein „RLF kann etwas runter", stattdessen ' + ZIEL, !RAT_FALSCH.test(einst.text) && einst.text.includes(ZIEL), (einst.text.match(/💡[^]{0,120}/) || [''])[0]);
  }

  console.log('\nD - Die IceFlush-Karte bereitet dasselbe Trockenzelt vor');
  {
    const r = JSON.parse(E(`(function(){
      for (const iso of ['2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07']) {
        setDebugDate(iso); openEntry(iso);
        const t = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
        const m = t.match(/Trockenzelt vorbereitet:[^]{0,60}/);
        if (m) return JSON.stringify({ iso, zeile: m[0], zeitleiste: (t.match(/Trocknung (<|\\d)[^]{0,60}/) || [''])[0] });
      }
      return JSON.stringify({ fehlt: true });
    })()`));
    pruef('IceFlush-Karte gefunden', !r.fehlt, JSON.stringify(r));
    if (!r.fehlt) {
      console.log('    ' + r.iso + ': „' + r.zeile + '" · „' + r.zeitleiste + '"');
      pruef('Checkliste: Trockenzelt ' + ZIEL, r.zeile.includes(ZIEL) && !/<18/.test(r.zeile), r.zeile);
      pruef('Zeitleiste: Trocknung ' + ZIEL, r.zeitleiste.includes(ZIEL), r.zeitleiste);
    }
  }

  console.log('\nE - Kein abweichendes Trocknungsklima mehr im Quelltext');
  {
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n')
      .map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z));
    ['18-21°C, 55-65%', '18–21°C, 55–65%', '18–21 °C, 55–65%', '<18°C · 50% RLF', '<18°C, 50% RLF', '15–18°C, 50% RLF',
     '15–18°C bei 50% RLF', '18°C, 60% RLF', '50% ist schon zu trocken', '<b>15–18°C</b>', 'Temp 15–18°C', '55–65% Luftfeuchte',
     'Trocknung bei 18-21 °C'].forEach(alt => {
      const treffer = quelle.filter(x => x.z.includes(alt)).map(x => 'Zeile ' + x.nr);
      pruef('Nirgends: „' + alt + '"', treffer.length === 0, treffer.join(', '));
    });
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
