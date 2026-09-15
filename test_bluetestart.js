/**
 * (v1.5.185) Mit Blütestart-Datum rechnen alle Termine ab dem echten Blütebeginn.
 *
 * Befund der zweiten Prüfrunde (Plan-Modell), gemessen und hier nachgestellt: phase() und getAction() zählen ab dem
 * Blütestart-Datum (Photo nach dem Umschalten auf 12/12, Outdoor-Photo), rund zwanzig andere Stellen weiter mit
 * anzuchtDays = 21 — Endspurt, Erntezähler, Finisher, Hard-Dryback, Spül-Hinweis, Gieß-Fahrplan und Plan-Wochen.
 * Beim Umschalten an Tag 36 lag die Ernte laut Endspurt 14 Tage vor der echten, und der Plan stand am echten
 * Spülstart schon in der IceFlush-Woche.
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

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

const FAELLE = [
  { name: 'Photo, Umschalten an Tag 15', veg: 14 },
  { name: 'Gegenprobe Photo, Umschalten an Tag 22 (= Anzucht 21)', veg: 21 },
  { name: 'Photo, Umschalten an Tag 29', veg: 28 },
  { name: 'Photo, Umschalten an Tag 36', veg: 35 },
  { name: 'Gegenprobe Automatic ohne Blütestart-Datum', veg: null },
];

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler (leerer Speicher)', errors.length === 0, errors[0]);

  for (const f of FAELLE) {
    console.log('\n' + f.name + ', Blüte 70');
    const r = JSON.parse(E(`(function(){
      const pr = FERT_PRESETS.biobizz_master;
      const products = pr.products.map((p, i) => ({ id: 'q' + i, ...p }));
      const schedule = {};
      Object.entries(pr.schedule).forEach(([w, d]) => { const m = {}; Object.entries(d).forEach(([n, v]) => { const pp = products.find(x => x.name === n); if (pp) m[pp.id] = v; }); schedule['w' + w] = m; });
      const plan = { id: 'fp_m', name: pr.name, products, schedule, mixOrder: pr.mixOrder, presetKey: 'biobizz_master', createdAt: 1 };
      _planRueckgratAuffrischen(plan, pr); plan.feedWaterRhythm = { ...pr.feedWaterRhythm };
      S.fertPlans = [plan]; S.entries = {}; S._activePlanId = 'x';
      const start = '2026-01-05';
      const c = { id: 'bs${f.veg}', name: 'Zyklus', active: true, startDate: start, seedType: ${f.veg === null ? "'auto'" : "'fem'"}, growType: 'indoor', medium: 'erde',
        anzuchtDays: 21, bloomDays: 70, flushDays: 8, iceDays: 3, harvestDays: 1, dryDays: 7, cureDays: 21,
        intAnzucht: 3, intBloom: 3, intFlush: 4, intIce: 2, intErnte: 1, intDry: 1, offsetHistory: [], skippedDays: [], plants: [], plantCount: 1,
        fertPlanId: plan.id, startMethod: 'saturated', weightMode: 'lift' };
      ${f.veg === null ? '' : `c.bloomStartDate = isoPlus(start, ${f.veg});`}
      S.cycles = [c];
      const iso = (t) => isoPlus(start, t - 1);
      const first = {};
      for (let t = 1; t < 200; t++) { const p = phase(iso(t), c); if (!p) break; if (!first[p.ph]) first[p.ph] = t; }
      const B = first.bloom, F = first.flush, I = first.ice, H = first.harvest;
      const heute = B + 30;
      setDebugDate(iso(heute));
      const st = endspurtState(c, iso(heute));
      const hc = harvestCountdown(c, iso(heute));
      const dth = daysToHarvest(c);
      const fin = [], hd = [];
      for (let t = 1; t < H + 3; t++) { const cx = contextFor(c, iso(t)); if (!cx) continue; if (cx.isFinisher) fin.push(t); if (cx.isHardDryback) hd.push(t); }
      const hinweise = [];
      for (let t = B; t <= F; t++) { setDebugDate(iso(t)); getAlerts(c).filter(a => /Spülung/.test(a.text)).forEach(a => hinweise.push([t, a.text])); }
      setDebugDate(iso(heute));
      const g = collectBloomGusse(c);
      const wp = (t) => { const w = fertPlanWeek(c, iso(t), phase(iso(t), c)); return w + ' ' + plan.weekPhases[w - 1]; };
      const out = { B, F, I, H, heute, dth,
        st: st ? { spuelStart: st.spuelStart, iceStart: st.iceStart, ernteTag: st.ernteTag, gaenge: st.spuelGaenge } : null,
        hcTag: hc && hc.harvestISO ? isoDiff(hc.harvestISO, start) + 1 : null,
        fin: fin.length ? [fin[0], fin[fin.length - 1]] : null, hd, hinweise,
        g: g.length ? { erster: g[0].tag, letzter: g[g.length - 1].tag } : null,
        wVor: wp(B - 1), wAm: wp(B), wSpuel: wp(F) };
      setDebugDate(null);
      return JSON.stringify(out);
    })()`));
    pruef(`Endspurt: Spülen Tag ${r.F}, IceFlush Tag ${r.I}, Ernte Tag ${r.H}`,
      r.st && r.st.spuelStart === r.F && r.st.iceStart === r.I && r.st.ernteTag === r.H,
      r.st && `Spülen ${r.st.spuelStart}, IceFlush ${r.st.iceStart}, Ernte ${r.st.ernteTag}`);
    pruef('Spülgänge liegen in der Spülphase', r.st && r.st.gaenge.length > 0 && r.st.gaenge.every(t => t >= r.F && t < r.I),
      r.st && JSON.stringify(r.st.gaenge));
    pruef(`Erntezähler: Ernte Tag ${r.H}, an Tag ${r.heute} noch ${r.H - r.heute} Tage`, r.hcTag === r.H && r.dth === r.H - r.heute,
      `harvestCountdown Tag ${r.hcTag}, daysToHarvest ${r.dth}`);
    pruef('Finisher endet am Erntetag, Hard-Dryback an den 3 Tagen vor dem IceFlush',
      r.fin && r.fin[1] === r.H && JSON.stringify(r.hd) === JSON.stringify([r.I - 3, r.I - 2, r.I - 1]),
      `Finisher ${r.fin && r.fin.join('–')}, Hard-Dryback ${JSON.stringify(r.hd)}`);
    const tage = r.hinweise.map(h => h[0]);
    const falsch = r.hinweise.filter(([t, txt]) => {
      const m = txt.match(/Spülung in (\d+) Tagen/);
      return m ? t + Number(m[1]) !== r.F : !(/Spülung morgen/.test(txt) && t + 1 === r.F);
    });
    pruef('„Spülung in N Tagen" an den 7 Tagen vor dem echten Spülstart', tage.length === 7 && tage[0] === r.F - 7 && falsch.length === 0,
      r.hinweise.map(([t, txt]) => `Tag ${t}: ${txt}`).join(' | ') || 'kein Hinweis');
    pruef('Gieß-Fahrplan beginnt mit der Blüte und reicht bis in die Spülphase',
      r.g && r.g.erster >= r.B && r.g.erster <= r.B + 3 && r.g.letzter >= r.F && r.g.letzter <= r.H - 1,
      r.g && `erster Guss Tag ${r.g.erster}, letzter Tag ${r.g.letzter} (Blüte ab ${r.B}, Spülen ab ${r.F})`);
    pruef('Plan-Woche: Anzucht bis zum Umschalten, Blüte ab dem Blütebeginn, Spülwoche ab dem Spülstart',
      /anzucht$/.test(r.wVor) && /bloom$/.test(r.wAm) && /flush$/.test(r.wSpuel),
      `Tag ${r.B - 1}: ${r.wVor} · Tag ${r.B}: ${r.wAm} · Tag ${r.F}: ${r.wSpuel}`);
  }

  console.log('\nOutdoor-Photo ohne Blütestart-Datum (die App leitet den 17.08. ab)');
  {
    const r = JSON.parse(E(`(function(){
      S.fertPlans = []; S.entries = {};
      const start = '2026-04-01';
      const c = { id: 'bso', name: 'Draußen', active: true, startDate: start, seedType: 'fem', growType: 'outdoor', medium: 'erde',
        anzuchtDays: 21, bloomDays: 60, flushDays: 8, iceDays: 3, harvestDays: 1, dryDays: 7, cureDays: 21,
        intAnzucht: 3, intBloom: 3, intFlush: 4, intIce: 2, intErnte: 1, intDry: 1, offsetHistory: [], skippedDays: [], plants: [], plantCount: 1 };
      S.cycles = [c];
      const iso = (t) => isoPlus(start, t - 1);
      let H = null; for (let t = 1; t < 300; t++) { const p = phase(iso(t), c); if (p && p.ph === 'harvest') { H = t; break; } }
      setDebugDate(iso(150));
      const hc = harvestCountdown(c, iso(150));
      const dth = daysToHarvest(c);
      setDebugDate(null);
      return JSON.stringify({ H, hcTag: hc && hc.harvestISO ? isoDiff(hc.harvestISO, start) + 1 : null, dth });
    })()`));
    pruef(`Erntezähler: Ernte Tag ${r.H}`, r.hcTag === r.H && r.dth === r.H - 150, `harvestCountdown Tag ${r.hcTag}, daysToHarvest ${r.dth}`);
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
