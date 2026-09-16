/**
 * (v1.5.140) Das EC-Ziel folgt der Plan-Woche, nicht der Kalenderwoche ab dem Samentag.
 *
 * Der Fehler (gefunden von den Prüf-Agenten am 14.09.2026, gegengeprüft): `getEcTarget`
 * schaltete nur bei Plänen mit festen Tag-Spannen (weekDayBounds) auf die Plan-Woche um. Alle
 * Pläne mit Rückgrat (weekPhases) liefen nach floor(Tag/7)+1, gedeckelt auf Woche 10. Bei
 * Patricks Zyklus (BioBizz Official, 85 Blütetage) stand ab Tag 64 „Spät-Reifung 0,8–1,2",
 * während der Plan in Woche 7 dosierte; seine Ablaufwerte vom 19., 25. und 31.07. galten als zu
 * hoch. Betroffen waren 11 von 12 Vorlagen.
 *
 * Die Regel: EC_TARGETS ist ein Gerüst aus 3 Anzucht- und 7 Blütewochen. Jede Plan-Woche landet
 * an derselben relativen Stelle ihrer Phase — egal wie lang die Blüte ist.
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

// Legt aus einer Vorlage einen Plan (wie „Vorlage laden") und einen Zyklus darauf an.
const ANLEGEN = `
  window.__anlegen = function (key, bluete, ohneRueckgrat) {
    const pr = FERT_PRESETS[key];
    const products = pr.products.map((p, i) => ({ id: key + '_p' + i, ...p }));
    const schedule = {};
    Object.entries(pr.schedule || {}).forEach(([w, d]) => {
      const m = {};
      Object.entries(d || {}).forEach(([n, v]) => { const pp = products.find(x => x.name === n); if (pp) m[pp.id] = v; });
      schedule['w' + w] = m;
    });
    const plan = { id: 'fp_' + key + '_' + bluete + (ohneRueckgrat ? '_alt' : ''), name: pr.name, products, schedule, presetKey: key };
    if (!ohneRueckgrat) {
      plan.weekPhases = pr.weekPhases ? [...pr.weekPhases] : null;
      plan.phaseSkeleton = pr.phaseSkeleton ? { ...pr.phaseSkeleton } : null;
      plan.weekDayBounds = pr.weekDayBounds ? [...pr.weekDayBounds] : null;
      plan.ecTargets = pr.ecTargets ? JSON.parse(JSON.stringify(pr.ecTargets)) : null;
      if (pr.feedWaterRhythm) plan.feedWaterRhythm = { ...pr.feedWaterRhythm };
    }
    S.fertPlans.push(plan);
    const c = addCyc({ name: 'EC ' + key + ' ' + bluete, seedType: 'auto', medium: pr.medium || 'erde' });
    c.id = 'ec_' + key + '_' + bluete + (ohneRueckgrat ? '_alt' : '');
    c.fertPlanId = plan.id; c.startDate = '2026-01-01';
    c.anzuchtDays = 21; c.bloomDays = bluete; c.flushDays = 7; c.iceDays = 2; c.harvestDays = 1;
    return c;
  };
  window.__ecWoche = function (e) {
    if (!e) return null;
    const hit = Object.entries(EC_TARGETS).find(([k, t]) => t.label === e.label && t.def === e.def && t.min === e.min && t.max === e.max);
    return hit ? Number(hit[0]) : null;
  };
`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`setDebugDate('2026-09-14')`);
  E(ANLEGEN);

  console.log('\nA - Jede Vorlage mit Rückgrat: EC-Ziel der Plan-Woche bei 42, 63, 85 und 105 Blütetagen');
  const vorlagen = JSON.parse(E(`JSON.stringify(Object.keys(FERT_PRESETS).filter(k => !FERT_PRESETS[k].ecTargets && Array.isArray(FERT_PRESETS[k].weekPhases)))`));
  // (v1.5.185) Seit v1.5.178 zehn: Die BioBizz-Outdoor-Vorlage ist entfernt. Der Test lief beim Ausliefern von v1.5.178
  // nicht mit und fiel seitdem um; die Zahl ist die einzige Änderung.
  // (v1.5.240) Elf: BioBizz Official 2026 ist dazugekommen — das Schema nennt keine EC-Werte, also führt die
  // Vorlage auch keine. Die abgelöste Fassung bleibt für gespeicherte Kopien und zählt weiter mit.
  pruef('11 Vorlagen ohne eigene EC-Ziele, alle mit Rückgrat', vorlagen.length === 11, vorlagen.join(', '));
  for (const key of vorlagen) {
    const r = JSON.parse(E(`(function(){
      const probleme = [];
      let geprueft = 0;
      [42, 63, 85, 105].forEach(bd => {
        const c = __anlegen(${JSON.stringify(key)}, bd);
        let letzte = 0, erste = null, schluss = null;
        for (let d = 1; d <= 21 + bd; d++) {
          const iso = isoPlus(c.startDate, d - 1);
          const p = phase(iso, c);
          if (!p || (p.ph !== 'anzucht' && p.ph !== 'bloom')) continue;
          const e = getEcTarget(c, p, iso);
          if (e && e.label === 'Wasser-Tag') continue;
          geprueft++;
          const w = fertPlanWeek(c, iso, p);
          const ecW = __ecWoche(e);
          if (!e) { probleme.push(bd + 'd Tag ' + d + ': kein Ziel'); continue; }
          if (e.week !== w) probleme.push(bd + 'd Tag ' + d + ': week ' + e.week + ' statt Plan-Woche ' + w);
          if (p.ph === 'anzucht' && !(ecW >= 1 && ecW <= 3)) probleme.push(bd + 'd Tag ' + d + ' Anzucht → ' + e.label);
          if (p.ph === 'bloom' && !(ecW >= 4 && ecW <= 10)) probleme.push(bd + 'd Tag ' + d + ' Blüte → ' + e.label);
          if (ecW < letzte) probleme.push(bd + 'd Tag ' + d + ': Ziel springt zurück (' + letzte + ' → ' + ecW + ')');
          letzte = Math.max(letzte, ecW || 0);
          if (p.ph === 'bloom' && erste === null) erste = ecW;
          if (p.ph === 'bloom') schluss = ecW;
        }
        if (erste !== 4) probleme.push(bd + 'd: erster Blütetag nicht „Stretch" (' + erste + ')');
        if (schluss !== 10) probleme.push(bd + 'd: letzter Blütetag nicht „Spät-Reifung" (' + schluss + ')');
      });
      return JSON.stringify({ probleme, geprueft });
    })()`));
    pruef(key + ': ' + r.geprueft + ' Tage — Plan-Woche, Phase, Reihenfolge, Anfang und Ende stimmen', r.probleme.length === 0, r.probleme.slice(0, 4).join(' | '));
  }

  console.log('\nB - Patricks Zyklus (BioBizz Official, 85 Blütetage)');
  {
    const r = JSON.parse(E(`(function(){
      const c = S.cycles.find(x => x.active);
      return JSON.stringify(['2026-07-18', '2026-07-19', '2026-07-25', '2026-07-31'].map(iso => {
        const p = phase(iso, c); const e = getEcTarget(c, p, iso);
        const cd = S.entries[iso] && S.entries[iso].cycleData ? S.entries[iso].cycleData[c.id] : null;
        let status = null;
        if (cd && cd.runoffEc) { const ra = analyzeRunoff(cd, c.medium, _ecTargetFor(c, iso), { c, iso }); status = ra && ra.ecStatus; }
        return { iso, tag: p.day, planWoche: fertPlanWeek(c, iso, p), label: e && e.label, min: e && e.min, max: e && e.max, week: e && e.week, status };
      }));
    })()`));
    r.forEach(x => console.log('    ' + x.iso + ' Tag ' + x.tag + ' · Plan-Woche ' + x.planWoche + ' · ' + x.label + ' ' + x.min + '–' + x.max + (x.status ? ' · Ablauf: ' + x.status : '')));
    pruef('Tag 64 bis 77: kein „Spät-Reifung" mehr', r.every(x => x.label !== 'Spät-Reifung'), r.map(x => x.label).join(', '));
    pruef('EC-Ziel nennt dieselbe Woche wie die Dosen', r.every(x => x.week === x.planWoche));
    pruef('Ablauf vom 19., 25. und 31.07.: keine Warnung „zu hoch" mehr', r.filter(x => x.status).every(x => x.status !== 'warning-high'), r.map(x => x.status).join(', '));
  }

  console.log('\nC - Rainbow bleibt bei seinen eigenen Zielen');
  {
    const r = JSON.parse(E(`(function(){
      const c = __anlegen('rainbow_auto', 70);
      const ziel = (d) => { const iso = isoPlus(c.startDate, d - 1); return getEcTarget(c, phase(iso, c), iso); };
      return JSON.stringify({ t22: ziel(22), t91: ziel(91), t92: ziel(92) });
    })()`));
    pruef('Woche 4 aus dem Plan-Blatt (0,9–1,0)', r.t22 && r.t22.min === 0.9 && r.t22.max === 1.0, JSON.stringify(r.t22));
    pruef('Woche 13 (Rampe): weiter kein erfundenes Ziel', r.t91 === null, JSON.stringify(r.t91));
    pruef('Spülen: höchstens 0,5', r.t92 && r.t92.max === 0.5, JSON.stringify(r.t92));
  }

  console.log('\nD - Ein Plan ohne Rückgrat verhält sich wie vorher');
  {
    const r = JSON.parse(E(`(function(){
      const c = __anlegen('biobizz_master', 85, true);
      const iso = isoPlus(c.startDate, 63); const e = getEcTarget(c, phase(iso, c), iso);
      return JSON.stringify({ label: e && e.label, week: e && e.week });
    })()`));
    pruef('Kalenderwoche wie bisher (Tag 64 → Woche 10)', r.week === 10, JSON.stringify(r));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
