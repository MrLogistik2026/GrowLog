/**
 * (v1.5.159) In der Anzucht sagen Startseite und Sämlings-Pflege dasselbe wie der Plan.
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft, BioBizz Light, Einsteiger): Die Startseite
 * schrieb an Anzucht-Gießtagen „Dünger (½ Dosis): 6 Produkte" — halbiert wurde nichts, Plan und
 * Eintrag nannten die volle Plandosis. Bei Start „Direkt einpflanzen" stand „Dünger (noch keiner
 * nötig): 4 Produkte", während der Eintrag am selben Tag Dosen zeigte. Die Sämlings-Pflege sagte fest
 * „Frühestens Tag 10–14, dann nur 25% Dosis" und an Tag 1 „Vermeiden: Düngen". Nach ANBAU.md 13.2
 * braucht gerade der Sämling eine einzige, eindeutige Aussage. Die Dosen selbst sind unverändert.
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
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

// Zyklus mit BioBizz Light; für jeden Anzucht-Gießtag: Karte, Plandosen, Sämlings-Pflege im Eintrag
const LAUF = (start) => `(function(){
  const plan = S.fertPlans.find(p => p.presetKey === 'biobizz_light');
  S.cycles = []; S.entries = {}; S.beginnerMode = true;
  const c = addCyc({ name: 'Anzucht', seedType: 'auto', medium: 'erde' });
  c.startDate = '2026-06-01'; c.startMethod = '${start}'; c.fertPlanId = plan.id; c.potSize = 11;
  S._activePlanId = plan.id; syncActivePlanToGlobals(); saveS();
  const tage = [];
  for (let d = 1; d <= 21; d++) {
    const iso = isoPlus(c.startDate, d - 1);
    const a = getAction(iso, c);
    if (a !== 'giess_anz') continue;
    const p = phase(iso, c); const wk = fertPlanWeek(c, iso, p);
    const dosen = Object.values(getWeekDoses(c.id, wk, c)).filter(v => v > 0).length;
    const k = getTodayAction(c, p, a, iso) || {};
    setDebugDate(iso); openEntry(iso);
    const eintrag = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
    tage.push({ d, wk, dosen, schritte: (k.steps || []).join(' | '), pflege: (eintrag.match(/Sämlings-Pflege[^]{0,900}/) || [''])[0] });
  }
  return JSON.stringify(tage);
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`loadPreset('biobizz_light')`); await warte(30); E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(60);

  for (const start of ['saturated', 'direct']) {
    console.log('\n' + (start === 'saturated' ? 'A - Start mit Sättigungsguss' : 'B - Start „Direkt einpflanzen"'));
    const tage = JSON.parse(E(LAUF(start)));
    console.log('    Anzucht-Gießtage: ' + tage.map(t => 'Tag ' + t.d + ' (Woche ' + t.wk + ', ' + t.dosen + ' Dosen)').join(', '));
    if (tage[0]) console.log('    Tag ' + tage[0].d + ': ' + tage[0].schritte.split(' | ').pop());
    pruef(start + ': Prüflage — Anzucht-Gießtage mit Plandosen', tage.length >= 2 && tage.some(t => t.dosen > 0), JSON.stringify(tage.map(t => [t.d, t.dosen])));
    pruef(start + ': kein „½ Dosis" und kein „noch keiner nötig" auf der Karte', tage.every(t => !/½ Dosis|noch keiner nötig/.test(t.schritte)), tage.map(t => t.schritte.split(' | ').pop()).slice(0, 2).join(' || '));
    pruef(start + ': die Karte nennt die Zahl der Plan-Produkte dieser Woche', tage.every(t => t.dosen === 0 ? /kein Dünger/.test(t.schritte) : t.schritte.includes(`Dünger laut Plan (Woche ${t.wk}): ${t.dosen} Produkt`)), tage.map(t => t.dosen + ': ' + t.schritte.split(' | ').pop()).slice(0, 2).join(' || '));
    const mitPflege = tage.filter(t => t.pflege);
    pruef(start + ': Sämlings-Pflege nennt keine eigene Dünger-Regel, sondern den Plan', mitPflege.length > 0 && mitPflege.every(t => !/Frühestens Tag 10–14|nur 25% Dosis/.test(t.pflege) && (t.dosen === 0 ? /keinen vor/.test(t.pflege) : t.pflege.includes(`Dein Plan sieht diese Woche ${t.dosen} Produkt`))), mitPflege.map(t => (t.pflege.match(/Dünger:[^•]{0,120}/) || [''])[0]).slice(0, 1).join(''));
  }

  console.log('\nC - Kein Satz mehr, der dem Plan widersprechen kann');
  {
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n')
      .map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z));
    ["'½ Dosis'", 'noch keiner nötig', 'Frühestens Tag 10–14', 'frühestens Tag 10–14', "avoid: 'Düngen"].forEach(alt => {
      const treffer = quelle.filter(x => x.z.includes(alt)).map(x => 'Zeile ' + x.nr);
      pruef('Nirgends: „' + alt + '"', treffer.length === 0, treffer.join(', '));
    });
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
