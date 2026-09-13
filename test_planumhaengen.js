/**
 * (v1.5.134) Eine Vorlage zu laden hängt keinen Zyklus mehr um, dessen Düngung vorbei ist.
 *
 * Der Fehler: `_cycleAufPlanZeigen` (v1.5.95) setzte beim Laden einer Vorlage JEDEN aktiven
 * Zyklus auf den neuen Plan. Mit Patricks Daten am 13.09.2026: Sein Sensi-Zyklus trocknet
 * (Tag 121, gedüngt mit „BioBizz Official"). Er lädt den Rainbow-Plan für den nächsten Grow —
 * und die zurückliegende Woche 6 seines Grows zeigt danach Silica Force, POWHUMUS und
 * Advanced Amino statt CalMag, Bio·Grow und Top·Max. Nachgestellt, bevor behoben.
 *
 * Was bleiben muss: Mitten im Grow hängt „Vorlage laden" den Zyklus weiter um — das war der
 * Sinn von v1.5.95. Und ein angelegter, aber noch nicht gestarteter Zyklus ist genau der, für
 * den man den neuen Plan lädt.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const BIO_ID = 'fp_1788458746438';

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
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

// Rainbow über den echten Weg laden: Düngeplan-Bildschirm → Vorlage → „Plan anlegen".
async function rainbowLaden(E) {
  E(`loadPreset('rainbow_auto')`);
  await warte(30);
  E(`_modalResolve && _modalResolve(true)`);
  await warte(60);
}

const ZUSTAND = (id) => `(function(){
  const c = S.cycles.find(x => x.id === ${JSON.stringify(id)});
  const plan = getPlanForCycle(c);
  const p = phase(todayISO(), c);
  const namen = Object.keys(getWeekDoses(c.id, 6, c)).map(pid => ((plan.products || []).find(x => x.id === pid) || {}).name);
  return JSON.stringify({ phase: p ? p.ph : null, tag: p ? p.day : null, planId: c.fertPlanId, plan: plan && plan.name,
    woche6: namen, bearbeitet: (getActivePlan() || {}).name });
})()`;

async function fall(datum, mut, zyklusId) {
  const { E, errors } = await load(mut);
  E(`setDebugDate('${datum}')`);
  const id = zyklusId || E('S.cycles.find(c => c.active).id');
  const vorher = JSON.parse(E(ZUSTAND(id)));
  await rainbowLaden(E);
  const nachher = JSON.parse(E(ZUSTAND(id)));
  return { E, errors, vorher, nachher };
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('\nA - Patricks trocknender Zyklus behält seinen Plan (13.09.2026, Tag 121)');
  {
    const { E, errors, vorher, nachher } = await fall('2026-09-13');
    pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
    pruef('Ausgangslage: Trocknen, BioBizz Official', vorher.phase === 'dry' && vorher.planId === BIO_ID, JSON.stringify(vorher));
    pruef('Nach „Rainbow laden" hängt er weiter an BioBizz', nachher.planId === BIO_ID, nachher.plan);
    pruef('Seine Woche 6 zeigt weiter BioBizz-Produkte (Top·Max)', nachher.woche6.includes('Top·Max'), nachher.woche6.join(', '));
    pruef('… und keine Rainbow-Produkte (POWHUMUS)', !nachher.woche6.includes('POWHUMUS'), nachher.woche6.join(', '));
    pruef('Der Düngeplan-Bildschirm zeigt trotzdem den neuen Plan zum Bearbeiten', nachher.bearbeitet === 'Rainbow Düngeplan (v1.0)', nachher.bearbeitet);
    E('saveS(); loadS();');
    pruef('Nach dem Neuladen unverändert', E(`S.cycles.find(c => c.active).fertPlanId`) === BIO_ID);
  }

  console.log('\nB - Beim Spülen ebenso (02.09.2026, Tag 110)');
  {
    const { vorher, nachher } = await fall('2026-09-02');
    pruef('Ausgangslage: Spülen', vorher.phase === 'flush', JSON.stringify(vorher));
    pruef('Bleibt an BioBizz', nachher.planId === BIO_ID, nachher.plan);
  }

  console.log('\nC - Mitten in der Blüte wird weiter umgehängt (v1.5.95 bleibt)');
  {
    const { vorher, nachher } = await fall('2026-08-01');
    pruef('Ausgangslage: Blüte', vorher.phase === 'bloom', JSON.stringify(vorher));
    pruef('Hängt jetzt am Rainbow-Plan', nachher.plan === 'Rainbow Düngeplan (v1.0)', nachher.plan);
    pruef('Tageseintrag und Düngeplan-Bildschirm zeigen denselben Plan', nachher.plan === nachher.bearbeitet);
  }

  console.log('\nD - Der nächste, noch nicht gestartete Zyklus bekommt den neuen Plan');
  {
    const mut = (st) => {
      const neu = JSON.parse(JSON.stringify(st.cycles[0]));
      neu.id = 'run02'; neu.name = 'Rainbow Run 02'; neu.startDate = '2026-10-01'; neu.active = true;
      neu.plants = []; neu.fertPlanId = BIO_ID;
      st.cycles.push(neu);
    };
    const { E, vorher, nachher } = await fall('2026-09-13', mut, 'run02');
    pruef('Ausgangslage: noch nicht gestartet', vorher.phase === null && vorher.planId === BIO_ID, JSON.stringify(vorher));
    pruef('Run 02 hängt jetzt am Rainbow-Plan', nachher.plan === 'Rainbow Düngeplan (v1.0)', nachher.plan);
    const alt = JSON.parse(E(ZUSTAND(E('S.cycles[0].id'))));
    pruef('Der trocknende Zyklus daneben bleibt an BioBizz', alt.planId === BIO_ID, alt.plan);
  }

  console.log('\nE - Ein Zyklus nach dem Curing wird nicht mehr angefasst');
  {
    const { vorher, nachher } = await fall('2027-03-01');
    pruef('Ausgangslage: Zyklus vorbei (keine Phase mehr)', vorher.phase === null, JSON.stringify(vorher));
    pruef('Bleibt an BioBizz', nachher.planId === BIO_ID, nachher.plan);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
