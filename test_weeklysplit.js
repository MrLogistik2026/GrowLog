/**
 * (v1.5.163) Wochendosis-Pläne (weekly-split) rechnen mit der Plan-Woche, nicht mit der Kalenderwoche.
 *
 * Zwei Befunde der Prüf-Agenten, gegengeprüft:
 *  1. weekGussCounts zählte die Tage (w−1)·7 … w·7, feedDayCompFactor bekam aber die gedehnte
 *     Plan-Woche. BioBizz Official, 105 Blütetage, Woche 3: Faktor 1,00 statt 1,33 — Kalenderwoche 3
 *     war noch Anzucht, Plan-Woche 3 schon Blüte. Bis 38 % daneben, in beide Richtungen.
 *  2. getWeekDoses wählte das Intervall mit `w <= 2 ? Anzucht : Blüte`. BioBizz Outdoor führt drei
 *     Anzucht-Wochen; Woche 3 wurde durch das Blüte-Intervall geteilt (bei 2/3 Tagen +50 % je Guss).
 *
 * Bewusst NICHT geändert: dass die Konzentration je Guss grundsätzlich vom Gießintervall abhängt — das
 * ist die Bauart von weekly-split und steht als Entscheidung in der Übergabe.
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

const ZYKLUS = (key, bloom, intA, intB) => `(function(){
  const plan = S.fertPlans.find(p => p.presetKey === '${key}');
  S.cycles = []; S.entries = {};
  const c = addCyc({ name: '${key}', seedType: 'auto', medium: 'erde' });
  c.startDate = '2026-03-01'; c.fertPlanId = plan.id; c.bloomDays = ${bloom}; c.anzuchtDays = 21;
  c.intAnzucht = ${intA}; c.intBloom = ${intB};
  S._activePlanId = plan.id; syncActivePlanToGlobals(); saveS();
  return c;
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  for (const key of ['biobizz_official']) {
    E(`loadPreset('${key}')`); await warte(30); E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(60);
  }

  console.log('\nA - BioBizz Official: die Gusszählung gehört zur Plan-Woche');
  for (const bloom of [42, 85, 105]) {
    const r = JSON.parse(E(`(function(){
      const c = ${ZYKLUS('biobizz_official', bloom, 3, 3)};
      const abw = [];
      for (let w = 1; w <= 9; w++) {
        let soll = 0;
        for (let d = 0; d < 200; d++) {
          const iso = isoPlus(c.startDate, d); const p = phase(iso, c); if (!p) continue;
          if (fertPlanWeek(c, iso, p) !== w) continue;
          const a = getAction(iso, c); if (a === 'giess' || a === 'giess_anz') soll++;
        }
        const ist = weekGussCounts(c, w).total;
        if (ist !== soll) abw.push('W' + w + ': ' + ist + ' statt ' + soll);
      }
      return JSON.stringify(abw);
    })()`));
    pruef(`${bloom} Blütetage: Güsse je Plan-Woche 1–9 stimmen`, r.length === 0, r.join(' · '));
  }

  // (v1.5.178) Bis hier prüfte B die BioBizz-Outdoor-Vorlage (drei Anzucht-Wochen). Sie ist entfernt; derselbe
  // Mechanismus — der Teiler folgt dem Rückgrat des Plans — wird an einer Official-Kopie mit drei Anzucht-Wochen geprüft.
  console.log('\nB - Plan mit drei Anzucht-Wochen: Woche 3 wird durch das Anzucht-Intervall geteilt');
  {
    const r = JSON.parse(E(`(function(){
      const plan = S.fertPlans.find(p => p.presetKey === 'biobizz_official');
      plan.weekPhases = plan.weekPhases.slice(); plan.weekPhases[2] = 'anzucht';
      const dosis = (intB, w) => { const c = ${ZYKLUS('biobizz_official', 63, 2, '__B__')}; return getWeekDoses(c.id, w, c); };
      const s3 = plan.schedule.w3 || {};
      const fish = plan.products.find(p => (s3[p.id] || 0) > 0) || plan.products[0];
      const bloomWoche = plan.weekPhases.findIndex(ph => ph === 'bloom') + 2;
      const sb = plan.schedule['w' + bloomWoche] || {};
      const pidB = Object.keys(sb).find(k => sb[k] > 0);
      return JSON.stringify({ phase3: plan.weekPhases[2], name: fish.name, roh3: (plan.schedule.w3 || {})[fish.id],
        w3_b3: dosis(3, 3)[fish.id], w3_b5: dosis(5, 3)[fish.id], bw: bloomWoche, wb_b3: dosis(3, bloomWoche)[pidB], wb_b5: dosis(5, bloomWoche)[pidB] });
    })()`.replace(/__B__/g, 'intB')));
    console.log(`    ${r.name}: Woche 3 (${r.phase3}) roh ${r.roh3} → bei Blüte-Intervall 3: ${r.w3_b3}, bei 5: ${r.w3_b5} · Woche ${r.bw} (Blüte): ${r.wb_b3} / ${r.wb_b5}`);
    pruef('Prüflage: Woche 3 ist laut Plan Anzucht', r.phase3 === 'anzucht', r.phase3);
    pruef('Woche 3 hängt nicht am Blüte-Intervall', r.w3_b3 === r.w3_b5 && r.w3_b3 > 0, r.w3_b3 + ' / ' + r.w3_b5);
    // (v1.5.237) Bis hierher erwartete diese Prüfung `roh / (7/2)` — also die Teilung durch eine
    // KALENDERwoche. Genau die war der Fehler: Plan-Wochen sind gemessen 5 bis 14 Tage lang, und
    // geliefert wurden dadurch 0 bis 216 % der Wochenmenge. Geteilt wird jetzt durch die echten
    // Güsse der Plan-Woche — hier durch `total`, weil Woche 3 in dieser Prüflage Anzucht ist und
    // der Wasser-Tag-Ausgleich dort bewusst ausbleibt (v1.5.170).
    const cnt3 = JSON.parse(E(`(function(){ const c = ${ZYKLUS('biobizz_official', 63, 2, 3)}; return JSON.stringify(weekGussCounts(c, 3)); })()`));
    const sollW3 = Math.round(r.roh3 / cnt3.total * 100) / 100;
    pruef(`… und ist durch die echten Güsse der Plan-Woche geteilt (${cnt3.feed}/${cnt3.total} → ${sollW3})`,
      Math.abs(r.w3_b3 - sollW3) < 0.011, r.w3_b3 + ' statt ' + sollW3);
    pruef('Gegenprobe: eine Blüte-Woche hängt am Blüte-Intervall', r.wb_b3 !== r.wb_b5, r.wb_b3 + ' / ' + r.wb_b5);
  }

  // (v1.5.237) DIE WOCHENMENGE MUSS ANKOMMEN — das ist das ganze Versprechen dieses Modus.
  //
  // Vorher wurde durch `7 / Intervall` geteilt (Kalenderwoche) und danach mit `total / feed`
  // multipliziert, das über die gedehnte Plan-Woche zählt. Gemessen kamen 0 % bis 216 % der
  // gespeicherten Wochenmenge an. Geprüft wird hier nicht die Formel, sondern das Ergebnis:
  // Dosis je Düngerguss × Zahl der Düngergüsse muss die Wochenmenge ergeben.
  console.log('\nC - Die gespeicherte Wochenmenge kommt an');
  {
    const r = JSON.parse(E(`(function(){
      const plan = S.fertPlans.find(p => p.presetKey === 'biobizz_official');
      const preset = FERT_PRESETS.biobizz_official;
      const cap = EC_FEED_CEILING / parseFloat(preset.ecPeak);
      const raus = [];
      [42, 85, 105].forEach(bloom => {
        S.cycles = []; S.entries = {};
        const c = addCyc({ name: 'W', seedType: 'auto', medium: 'erde' });
        c.startDate = '2026-03-01'; c.fertPlanId = plan.id; c.bloomDays = bloom;
        c.anzuchtDays = 21; c.intAnzucht = 3; c.intBloom = 3;
        S._activePlanId = plan.id; syncActivePlanToGlobals(); saveS();
        for (let wk = 1; wk <= 9; wk++) {
          const roh = plan.schedule['w' + wk] || {};
          Object.keys(roh).forEach(pid => {
            const rw = parseFloat(roh[pid]);
            if (!(rw > 0)) return;
            const dos = getWeekDoses(c.id, wk, c)[pid] || 0;
            const cnt = weekGussCounts(c, wk);
            const gedeckelt = cnt.feed > 0 && (cnt.total / cnt.feed) > cap + 0.0001;
            raus.push({ bloom, wk, rw, dos, feed: cnt.feed, total: cnt.total, gedeckelt,
              geliefert: Math.round(dos * cnt.feed * 1000) / 1000,
              erwartetGedeckelt: Math.round(rw / Math.max(cnt.total, 1) * cap * 100) / 100 });
          });
        }
      });
      return JSON.stringify({ cap: Math.round(cap * 1000) / 1000, raus });
    })()`));

    // Drei Lagen sind zu unterscheiden, und die erste Fassung dieses Abschnitts tat es nicht:
    //  · total = 0 — die Güsse dieser Plan-Woche sind gar nicht bekannt. Dann wird bewusst NICHT
    //    geteilt, sondern die Plan-Menge unverändert gezeigt, statt eine Zahl zu erfinden.
    //  · feed = 0 bei total > 0 — die Woche besteht nur aus Wasser-Tagen: Dosis 0.
    //  · sonst: die Wochenmenge muss ankommen.
    const ohneRaster = r.raus.filter(x => x.total <= 0);
    const ohneFeed = r.raus.filter(x => x.feed === 0 && x.total > 0);
    const gedeckelt = r.raus.filter(x => x.gedeckelt && x.feed > 0);
    const normal = r.raus.filter(x => !x.gedeckelt && x.feed > 0);
    console.log(`    ${r.raus.length} Fälle: ${normal.length} normal · ${gedeckelt.length} durch die EC-Decke begrenzt (${r.cap}) · ${ohneFeed.length} nur Wasser-Tage · ${ohneRaster.length} ohne bekanntes Raster`);
    pruef('Ohne bekanntes Wochen-Raster bleibt die Plan-Menge unverändert stehen',
      ohneRaster.every(x => Math.abs(x.dos - x.rw) < 0.0001),
      ohneRaster.slice(0, 2).map(x => `${x.bloom}d W${x.wk}: ${x.dos} statt ${x.rw}`).join(' · '));

    const daneben = normal.filter(x => Math.abs(x.geliefert - x.rw) > 0.005 * x.feed + 0.0011);
    pruef(`Die Wochenmenge kommt in allen ${normal.length} ungedeckelten Fällen an`,
      daneben.length === 0,
      daneben.slice(0, 3).map(x => `${x.bloom}d W${x.wk}: ${x.geliefert} statt ${x.rw} (${x.feed}/${x.total})`).join(' · '));

    const schlimmster = normal.reduce((a, x) => {
      const p = x.rw > 0 ? Math.abs(x.geliefert / x.rw - 1) : 0;
      return p > a.p ? { p, x } : a;
    }, { p: 0, x: null });
    pruef('Die größte Abweichung liegt unter 2 % (Rundung auf zwei Nachkommastellen)',
      schlimmster.p < 0.02, schlimmster.x ? `${Math.round(schlimmster.p * 1000) / 10} % bei ${schlimmster.x.bloom}d W${schlimmster.x.wk}` : '–');

    pruef('Eine Plan-Woche ohne Düngerguss ergibt Dosis 0, nicht unendlich',
      ohneFeed.every(x => x.dos === 0 && isFinite(x.dos)),
      ohneFeed.slice(0, 2).map(x => `${x.bloom}d W${x.wk}: ${x.dos}`).join(' · '));

    pruef('Wo die EC-Decke greift, ist die Dosis genau der gedeckelte Wert (kein stiller Rest)',
      gedeckelt.every(x => Math.abs(x.dos - x.erwartetGedeckelt) < 0.011),
      gedeckelt.slice(0, 3).map(x => `${x.bloom}d W${x.wk}: ${x.dos} statt ${x.erwartetGedeckelt}`).join(' · '));

    pruef('Und dann kommt weniger an als die Wochenmenge — bewusst, nie mehr',
      gedeckelt.every(x => x.geliefert <= x.rw + 0.0011),
      gedeckelt.slice(0, 2).map(x => `${x.bloom}d W${x.wk}: ${x.geliefert} > ${x.rw}`).join(' · '));

    pruef('Kein einziger Fall liefert mehr als die Wochenmenge',
      r.raus.every(x => x.geliefert <= x.rw + 0.005 * Math.max(x.feed, 1) + 0.0011),
      r.raus.filter(x => x.geliefert > x.rw + 0.005 * Math.max(x.feed, 1) + 0.0011).slice(0, 3)
        .map(x => `${x.bloom}d W${x.wk}: ${x.geliefert} statt ${x.rw}`).join(' · '));
  }

  console.log('\nD - Per-Gieß-Pläne bleiben unberührt');
  {
    // `loadPreset` ist asynchron und kann zurückfragen (Substrat-Wechsel, „Plan existiert bereits").
    // Ohne `await` und ohne Stub stand der Plan noch nicht, wenn die Prüfung lief — dieselbe Falle
    // wie in test_duengeplantexte.js Abschnitt F.
    await E(`(async () => {
      window.customConfirm = () => Promise.resolve(true);
      window.toast = () => {}; window.vibrate = () => {};
      await loadPreset('plagron');
    })()`);
    await warte(150);
    E(`typeof _modalResolve === 'function' && _modalResolve(true)`);
    await warte(80);
    const r = JSON.parse(E(`(function(){
      const plan = S.fertPlans.find(p => p.presetKey === 'plagron');
      if (!plan) return JSON.stringify({ fehlt: true });
      S.cycles = []; S.entries = {};
      const c = addCyc({ name: 'P', seedType: 'auto', medium: 'erde' });
      c.startDate = '2026-03-01'; c.fertPlanId = plan.id; c.bloomDays = 63;
      c.anzuchtDays = 21; c.intAnzucht = 3; c.intBloom = 3;
      S._activePlanId = plan.id; syncActivePlanToGlobals(); saveS();
      const roh = plan.schedule.w5 || {};
      const pid = Object.keys(roh).find(k => parseFloat(roh[k]) > 0);
      return JSON.stringify({ modus: _doseModeFor(plan), roh: parseFloat(roh[pid]), dos: getWeekDoses(c.id, 5, c)[pid] });
    })()`));
    pruef('Plagron läuft als Per-Gieß-Plan', !r.fehlt && r.modus !== 'weekly-split', r.modus);
    pruef('Seine Dosis ist unverändert die Plan-Dosis, nicht geteilt', r.dos === r.roh, r.dos + ' statt ' + r.roh);
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
