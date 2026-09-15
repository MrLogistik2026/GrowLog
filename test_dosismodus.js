/**
 * (v1.5.171) Der Dosis-Modus kommt aus dem Plan des Zyklus — nicht aus dem aufgeschlagenen Plan.
 *
 * Zwei Befunde, beide nachgemessen:
 *  1. getWeekDoses nahm Vorlage und Modus aus `plan.presetKey || S.presetKey`. Ein eigener Plan ohne Vorlage
 *     erbte damit den Modus des Plans, der gerade im Dünger-Bildschirm offen ist: 4 ml/L wurden 1,71 ml/L,
 *     sobald BioBizz Official aufgeschlagen war (v1.5.100 an einer weiteren Stelle).
 *  2. Der Rhythmus-Dialog (maybeSuggestIntervalChange) las nur plan.doseMode. Gespeicherte Plankopien tragen
 *     das Feld nicht; bei Patricks „BioBizz Official" warnte er „pro Guss gedüngt", während die Dosis geteilt wurde.
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

async function load(mitSicherung) {
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
      if (mitSicherung) w.localStorage.setItem('growsmart_v4', BACKUP);
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
const vorlage = async (E, key) => {
  E(`loadPreset('${key}')`); await warte(30);
  E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(60);
  E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(60);
};

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('\nA - Eigener Plan ohne Vorlage, BioBizz Official aufgeschlagen');
  {
    const { E, errors } = await load(false);
    pruef('Start ohne JS-Fehler (leerer Speicher)', errors.length === 0, errors[0]);
    await vorlage(E, 'biobizz_official');
    const r = JSON.parse(E(`(function(){
      const off = S.fertPlans.find(p => p.presetKey === 'biobizz_official');
      S.fertPlans.push({ id: 'fp_eigen', name: 'Eigen', products: [{ id: 'px', name: 'Dünger X', unit: 'ml/L', color: '#fff' }],
        schedule: { w5: { px: 4 } }, mixOrder: [], mixInfo: '', drainInfo: null, presetKey: null, createdAt: 1 });
      S.cycles = []; S.entries = {};
      const c = addCyc({ name: 'Eigen', seedType: 'auto', medium: 'erde' });
      c.startDate = '2026-03-01'; c.fertPlanId = 'fp_eigen'; c.intBloom = 3; c.intAnzucht = 3;
      S._activePlanId = 'fp_eigen'; syncActivePlanToGlobals();
      const eigen = getWeekDoses(c.id, 5, c).px;
      S._activePlanId = off.id; syncActivePlanToGlobals();
      return JSON.stringify({ eigen, offen: getWeekDoses(c.id, 5, c).px, aufgeschlagen: S.presetKey });
    })()`));
    pruef('Prüflage: eigener Plan aufgeschlagen → 4 ml/L', r.eigen === 4, r.eigen);
    pruef(`Official aufgeschlagen (${r.aufgeschlagen}) → weiter 4 ml/L`, r.offen === 4, r.offen);
  }

  console.log('\nB - Patricks gespeicherte Kopie „BioBizz Official"');
  {
    const { E, errors } = await load(true);
    pruef('Start ohne JS-Fehler (Sicherung)', errors.length === 0, errors[0]);
    E(`setDebugDate('2026-06-20')`);
    const dialog = async (setup) => {
      E(`(function(){ ${setup}
        window._dlg = maybeSuggestIntervalChange(S.cycles[0], todayISO(), { dir: 'shorten', fromIv: 3, toIv: 2 }); })()`);
      await warte(150);
      const t = E(`document.body.textContent.replace(/\\s+/g, ' ')`);
      E(`typeof _modalResolve === 'function' && _modalResolve(false)`); await warte(80);
      return (t.match(/Rhythmus verkürzen\?.{0,420}/) || ['(Dialog nicht gefunden)'])[0];
    };
    const r = JSON.parse(E(`(function(){ const p = getPlanForCycle(S.cycles[0]);
      return JSON.stringify({ feld: p.doseMode === undefined ? '(fehlt)' : p.doseMode, modus: getPreset(p.presetKey).doseMode }); })()`));
    console.log(`    Feld doseMode: ${r.feld} · Vorlage: ${r.modus}`);
    const t1 = await dialog('');
    pruef('BioBizz Official (Wochendosis): kein „pro Guss gedüngt"', !/pro Guss gedüngt/.test(t1) && /verkürzen/.test(t1), t1.slice(0, 300));
    await vorlage(E, 'rainbow_auto');
    const t2 = await dialog(`window._altPlan = S.cycles[0].fertPlanId; S.cycles[0].fertPlanId = S.fertPlans.find(p => p.presetKey === 'rainbow_auto').id; delete S.cycles[0]._intSuggestSnooze;`);
    E(`S.cycles[0].fertPlanId = window._altPlan`);
    pruef('Gegenprobe Rainbow (je Guss): der Hinweis „pro Guss gedüngt" steht da', /pro Guss gedüngt/.test(t2), t2.slice(0, 300));
  }

  console.log('\nC - Quelltext');
  {
    const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    const rueckfall = /plan\?\.presetKey \|\| S\.presetKey/.test(src);
    const dialogFeld = /plan\.doseMode !== 'weekly-split'/.test(src);
    pruef('Kein Rückfall auf S.presetKey in getWeekDoses, der Dialog liest _doseModeFor', !rueckfall && !dialogFeld && (src.match(/_doseModeFor\(/g) || []).length >= 3, 'Rückfall=' + rueckfall + ' Dialogfeld=' + dialogFeld);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
