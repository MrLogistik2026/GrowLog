/**
 * (v1.5.240) BioBizz Official folgt dem Herstellerschema 2026 — Zelle für Zelle. Gespeicherte Kopien der
 * früheren Fassung rechnen unverändert weiter.
 *
 * Patrick am 16.09.2026, mit dem Blatt von biobizz.com: „Das ist der Plan von der offiziellen Homepage.
 * Danach können wir uns richten." Die Vorlage „BioBizz Official" wich an 52 von 54 Gaben davon ab
 * (UEBERGABE 0n·C): falsche Zahlen, dazu der Wochendosis-Modus, der Konzentrationen je Liter noch einmal
 * durch die Güsse teilte.
 *
 * Projektregel (UEBERGABE 0k): keine Dosis ohne zweite Abschrift. Hier stehen zwei, unabhängig entstanden:
 *   BLATT_2026  — aus der PDF „Biobizz Aktuell", Seite 2 („LIGHT·MIX oder COCO·MIX"). Die Zahlen liegen dort
 *                 als Vektorgrafik; gerendert und in voller Auflösung abgelesen.
 *   SCHEMA_2020 — aus Patricks Bild des Schemas 2020, Spalte Light·Mix, am selben Tag vorher abgeschrieben.
 * Beide stimmen in jeder Zelle überein, bis auf eine belegte Änderung: Root·Juice steht 2026 auch unter
 * „Wachstum" — so auch auf der All·Mix-Seite 2026 und im All·Mix-Blatt 2024.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

// Spalten: Vermehrung, Wachstum, Blühwoche 1–8 (= Plan-Wochen 1–10). „Wasser" und „Ernte" tragen keine Zahl.
const BLATT_2026 = {
  'Root·Juice': [4, 4, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bio·Grow':   [0, 2, 2, 2, 3, 3, 4, 4, 4, 4],
  'Bio·Bloom':  [0, 0, 1, 2, 2, 3, 3, 4, 4, 4],
  'Top·Max':    [0, 0, 1, 1, 1, 1, 1, 4, 4, 4],
  'Bio·Heaven': [2, 2, 2, 2, 3, 4, 4, 5, 5, 5],
  'Acti·Vera':  [2, 2, 2, 2, 3, 4, 4, 5, 5, 5],
};
// Im Blatt 2026, aber bewusst nicht in der Vorlage (Begründung im drainInfo).
const BLATT_2026_NICHT_IM_PLAN = {
  'Fish·Mix':       [0, 2, 2, 2, 3, 3, 4, 4, 4, 4],
  'Microbes (g/L)': [0.4, 0.4, 0.2, 0.2, 0.4, 0.4, 0.4, 0.2, 0.2, 0.2],
};
// Schema 2020, Spalte Light·Mix/Coco·Mix, WK1–WK10 (WK11 „mit Wasser spülen", WK12 „Ernte").
const SCHEMA_2020 = {
  'Root·Juice': [4, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bio·Grow':   [0, 2, 2, 2, 3, 3, 4, 4, 4, 4],
  'Bio·Bloom':  [0, 0, 1, 2, 2, 3, 3, 4, 4, 4],
  'Top·Max':    [0, 0, 1, 1, 1, 1, 1, 4, 4, 4],
  'Bio·Heaven': [2, 2, 2, 2, 3, 4, 4, 5, 5, 5],
  'Acti·Vera':  [2, 2, 2, 2, 3, 4, 4, 5, 5, 5],
};

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

async function load(mitDaten) {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      if (mitDaten) w.localStorage.setItem('growsmart_v4', BACKUP);
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load(false);
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const pre = JSON.parse(E(`JSON.stringify((function(){
    const p = FERT_PRESETS.biobizz_official_2026, alt = FERT_PRESETS.biobizz_official;
    return { p, alt, arc: ARC_RHYTHM, ph: phTargetFor('erde').labelComma };
  })())`));
  const p = pre.p;

  console.log('\nA - Die Vorlage steht Zelle für Zelle wie das Blatt 2026');
  {
    const namen = (p.products || []).map((x) => x.name);
    pruef('Genau die sechs Produkte der Gieß-Tabelle', namen.length === 6
      && Object.keys(BLATT_2026).every((n) => namen.includes(n)), namen.join(', '));
    const abw = [];
    for (let w = 1; w <= 10; w++) {
      const woche = p.schedule[w] || {};
      Object.entries(BLATT_2026).forEach(([prod, reihe]) => {
        const soll = reihe[w - 1], ist = woche[prod] === undefined ? 0 : woche[prod];
        if (soll !== ist) abw.push('Woche ' + w + ' ' + prod + ': Blatt ' + soll + ', Vorlage ' + ist);
      });
      Object.keys(woche).forEach((prod) => { if (!(prod in BLATT_2026)) abw.push('Woche ' + w + ': ' + prod + ' steht nicht im Blatt'); });
    }
    pruef('Alle 60 Zellen der Wochen 1–10 gleich, keine Gabe zu viel', abw.length === 0, abw.slice(0, 4).join(' | '));
    pruef('„Wasser" und „Ernte" (Woche 11 und 12) ohne Dünger',
      Object.keys(p.schedule[11] || {}).length === 0 && Object.keys(p.schedule[12] || {}).length === 0);
    const alleGaben = Object.values(p.schedule).flatMap((w) => Object.keys(w));
    pruef('Kein CalMag, Alg·A·Mic, Fish·Mix oder Microbes im Wochenplan',
      !alleGaben.some((n) => /CalMag|Alg|Fish|Microbes/i.test(n)), alleGaben.filter((n) => /CalMag|Alg|Fish|Microbes/i.test(n)).join(', '));
    pruef('Zwölf Plan-Wochen mit Rückgrat: 2 Anzucht, 8 Blüte, Spülen, IceFlush',
      JSON.stringify(p.weekPhases) === JSON.stringify(['anzucht', 'anzucht', 'bloom', 'bloom', 'bloom', 'bloom', 'bloom', 'bloom', 'bloom', 'bloom', 'flush', 'ice']));
  }

  console.log('\nB - Zweite Abschrift: Schema 2020 gegen Blatt 2026');
  {
    let zellen = 0, gleich = 0, gaben = 0, gabenGleich = 0;
    const unterschiede = [];
    Object.keys(BLATT_2026).forEach((prod) => {
      for (let i = 0; i < 10; i++) {
        const a = SCHEMA_2020[prod][i], b = BLATT_2026[prod][i];
        zellen++;
        if (a === b) gleich++; else unterschiede.push(prod + ' Spalte ' + (i + 1) + ': 2020 ' + a + ', 2026 ' + b);
        if (b > 0) { gaben++; if (a === b) gabenGleich++; }
      }
    });
    console.log('       ' + gleich + ' von ' + zellen + ' Zellen gleich · ' + gabenGleich + ' von ' + gaben + ' Gaben gleich');
    pruef('Genau eine Abweichung zwischen den Abschriften', unterschiede.length === 1, unterschiede.join(' | '));
    pruef('… und zwar die belegte: Root·Juice unter „Wachstum" (2020 nicht, 2026 mit 4)',
      unterschiede[0] === 'Root·Juice Spalte 2: 2020 0, 2026 4', unterschiede[0]);
    pruef('Die Vorlage hat so viele Gaben, wie das Blatt Zellen mit Dosis hat', gaben === 47, 'gaben=' + gaben);
    pruef('Fish·Mix steht im Blatt mit denselben Mengen wie Bio·Grow — als Alternative, nicht zusätzlich',
      JSON.stringify(BLATT_2026_NICHT_IM_PLAN['Fish·Mix']) === JSON.stringify(BLATT_2026['Bio·Grow']));
  }

  console.log('\nC - Je Guss, nie hochgerechnet');
  {
    pruef('Modus „je Guss"', p.doseMode === 'per-watering', p.doseMode);
    pruef('feedDayBasis: die Zahlen sind schon die Gießmengen', p.feedDayBasis === true);
    pruef('Keine erfundene EC-Spitze — das Blatt nennt keine', p.ecPeak === undefined, String(p.ecPeak));
    const rh = p.feedWaterRhythm || {};
    pruef('Jeder Guss in Woche 1–10 düngt, Woche 11 Wasser, Woche 12 kein Guss',
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every((w) => rh[String(w)] === 'F') && rh['11'] === 'W' && rh['12'] === '-', JSON.stringify(rh));
  }

  console.log('\nD - Sichtbar ist nur die korrigierte Vorlage');
  {
    const r = JSON.parse(E(`(function(){
      renderDuenger();
      const html = document.getElementById('scr-duenger').innerHTML;
      const erde = _wizStepFertPlan({ medium: 'erde', growType: 'indoor' });
      const drauss = _wizStepFertPlan({ medium: 'erde', growType: 'outdoor' });
      return JSON.stringify({
        listeNeu: html.includes("loadPreset('biobizz_official_2026')"),
        listeAlt: html.includes("loadPreset('biobizz_official')"),
        wizNeu: erde.includes("'biobizz_official_2026'") && drauss.includes("'biobizz_official_2026'"),
        wizAlt: /'biobizz_official'\\)/.test(erde) || /'biobizz_official'\\)/.test(drauss),
        wizText: /BioBizz-Schema 2026/.test(erde) && !/automatisch verteilt/.test(erde),
      });
    })()`));
    pruef('Die Vorlagen-Liste bietet „BioBizz Official 2026" an', r.listeNeu);
    pruef('… und die abgelöste Fassung nicht mehr', !r.listeAlt);
    pruef('Der Assistent bietet drinnen wie draußen die korrigierte Vorlage an', r.wizNeu);
    pruef('… und die abgelöste nicht', !r.wizAlt);
    pruef('Seine Kurzbeschreibung sagt nicht mehr „automatisch verteilt"', r.wizText);
  }

  console.log('\nE - Am echten Zyklus: jeder Guss bekommt die Zahl aus dem Blatt');
  {
    // Erst eine alte Kopie anlegen, so wie sie Tester gespeichert haben — dann die neue Vorlage laden.
    E(`loadPreset('biobizz_official')`); await warte(40);
    E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(80);
    E(`loadPreset('biobizz_official_2026')`); await warte(40);
    const titel = E(`document.getElementById('modal-title').textContent`);
    E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(80);
    const plaene = JSON.parse(E(`JSON.stringify((S.fertPlans || []).map(x => x.presetKey))`));
    pruef('Mit einer alten Kopie legt „Vorlage laden" die neue an, statt zur alten zu wechseln',
      /BioBizz Official 2026/.test(titel) && !/wechseln/i.test(titel), titel);
    pruef('Danach gibt es beide Pläne', plaene.includes('biobizz_official') && plaene.includes('biobizz_official_2026'), plaene.join(', '));

    const r = JSON.parse(E(`(function(){
      const plan = S.fertPlans.find(x => x.presetKey === 'biobizz_official_2026');
      const namen = {}; (plan.products || []).forEach(x => { namen[x.id] = x.name; });
      const faelle = {};
      const zyklus = (bd, iv, muster) => {
        S.cycles = []; S.entries = {};
        const c = addCyc({ name: 'Schema', seedType: 'auto', medium: 'erde' });
        c.startDate = '2026-03-01'; c.fertPlanId = plan.id; c.anzuchtDays = 21; c.bloomDays = bd;
        c.intAnzucht = 3; c.intBloom = iv;
        if (muster) c.fwPattern = muster;
        S._activePlanId = plan.id; syncActivePlanToGlobals();
        return c;
      };
      [[42, 2], [56, 3], [85, 3], [105, 4]].forEach(([bd, iv]) => {
        [null, 'FFW'].forEach(muster => {
          const c = zyklus(bd, iv, muster);
          const wochen = {}, guesse = {};
          for (let w = 1; w <= 12; w++) {
            const d = getWeekDoses(c.id, w, c) || {};
            const o = {}; Object.entries(d).forEach(([k, v]) => { if (parseFloat(v) > 0) o[namen[k] || k] = parseFloat(v); });
            wochen[w] = o; guesse[w] = weekGussCounts(c, w);
          }
          faelle[bd + '/' + iv + (muster ? '/' + muster : '')] = { wochen, guesse,
            faktor: feedDayCompFactor(c, 5, getPreset('biobizz_official_2026')), modus: _doseModeFor(plan) };
        });
      });
      return JSON.stringify(faelle);
    })()`));
    Object.entries(r).forEach(([fall, f]) => {
      const abw = [];
      for (let w = 1; w <= 10; w++) {
        Object.entries(BLATT_2026).forEach(([prod, reihe]) => {
          const soll = reihe[w - 1], ist = f.wochen[w][prod] || 0;
          if (soll !== ist) abw.push('W' + w + ' ' + prod + ' ' + ist + '≠' + soll);
        });
      }
      const blueteMitGuss = [3, 4, 5, 6, 7, 8, 9, 10].filter((w) => f.guesse[w].total > 0).length;
      pruef('Blütetage/Intervall ' + fall + ': alle Gaben wie im Blatt (' + blueteMitGuss + ' von 8 Blühwochen mit Guss)',
        abw.length === 0 && f.modus === 'per-watering', abw.slice(0, 3).join(' | ') + ' · ' + f.modus);
    });
    const mitWasser = r['85/3/FFW'];
    pruef('Prüflage mit Wasser-Tagen ist echt: Blühwoche 3 hat weniger Düngergüsse als Güsse',
      mitWasser.guesse[5].feed < mitWasser.guesse[5].total, JSON.stringify(mitWasser.guesse[5]));
    pruef('… und der Düngetag bekommt trotzdem nicht mehr als das Blatt (Faktor 1)', mitWasser.faktor === 1, mitWasser.faktor);
  }

  console.log('\nF - Texte: ehrlich, ohne CalMag-Dosis, und die Wochen-Tipps stimmen mit den Zahlen');
  {
    pruef('Untertitel nennt die Quelle 2026, kein „2025", kein „automatisch"',
      /Düngerschema 2026/.test(p.subtitle) && !/2025|automatisch/.test(p.subtitle), p.subtitle);
    pruef('Ablauf-Info nennt die prüfbare Bedingung für Cal/Mag (8 °dH bzw. 0,3 mS/cm)',
      /8 °dH/.test(p.drainInfo) && /0,3 mS\/cm/.test(p.drainInfo));
    pruef('… ohne eine Cal/Mag-Menge — die steht auf der Flasche', !/\d+[.,]?\d*\s*(ml|g)\s*\/\s*L/.test(p.drainInfo) && /steht auf der Flasche/.test(p.drainInfo));
    pruef('Sie erklärt, warum Microbes, Fish·Mix und Alg·A·Mic nicht im Wochenplan stehen',
      /Microbes/.test(p.drainInfo) && /Fish·Mix/.test(p.drainInfo) && /Alg·A·Mic/.test(p.drainInfo));
    // (v1.5.241) Patrick am 16.09.2026: „Ich nutze persönlich kein Fishmix, dies soll man auch nicht zusammen Düngen.
    // Fishmix ist eher für outdoor." Der Hinweis sagt das jetzt, statt die Frage offenzulassen.
    pruef('Fish·Mix: eine Alternative zu Bio·Grow — nie beide zusammen, keine offene Frage mehr',
      /nie beide zusammen/.test(p.drainInfo) && !/ob zusätzlich oder statt/.test(p.drainInfo) && /eher draußen/.test(p.drainInfo));
    pruef('Keine Behauptung mehr, die App verteile eine Wochendosis', !/Wochendosis|verteilt/.test(p.drainInfo + p.mixInfo));
    pruef('Misch-Info nimmt das pH-Ziel aus phTargetFor (' + pre.ph + ')', p.mixInfo.includes('pH auf ' + pre.ph));

    const wf = p.weekFocus || {};
    const phasen = Object.keys(wf).sort((a, b) => a - b).map((k) => wf[k].phase);
    pruef('Zwölf Wochen-Namen wie im Blatt', JSON.stringify(phasen) === JSON.stringify(['Vermehrung', 'Wachstum',
      'Blühwoche 1', 'Blühwoche 2', 'Blühwoche 3', 'Blühwoche 4', 'Blühwoche 5', 'Blühwoche 6', 'Blühwoche 7', 'Blühwoche 8', 'Wasser', 'Ernte']), phasen.join(', '));
    pruef('Jede Blühwoche verweist auf ihre Spalte „WO n" (Plan-Woche minus 2)',
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every((w) => wf[w].tip.includes('„WO ' + (w - 2) + '“')));

    // Was ein Tipp über die Zahlen sagt, wird an den Zahlen geprüft.
    const S_ = (w, prod) => BLATT_2026[prod][w - 1];
    const steigt = (w, prod) => S_(w, prod) > S_(w - 1, prod);
    const max = (prod) => Math.max(...BLATT_2026[prod]);
    pruef('Woche 1 „noch kein Bio·Grow" — stimmt', S_(1, 'Bio·Grow') === 0 && /noch kein Bio·Grow/.test(wf[1].tip));
    pruef('Woche 2 „Bio·Grow kommt dazu" — stimmt', S_(2, 'Bio·Grow') > 0 && /Bio·Grow kommt dazu/.test(wf[2].tip));
    pruef('Woche 3 „Bio·Bloom und Top·Max starten, Root·Juice ist vorbei" — stimmt',
      S_(2, 'Bio·Bloom') === 0 && S_(3, 'Bio·Bloom') > 0 && S_(2, 'Top·Max') === 0 && S_(3, 'Top·Max') > 0 && S_(3, 'Root·Juice') === 0);
    pruef('Woche 4 „Bio·Bloom steigt" — und sonst nichts', steigt(4, 'Bio·Bloom')
      && Object.keys(BLATT_2026).filter((x) => steigt(4, x)).length === 1);
    pruef('Woche 5 „Bio·Grow, Bio·Heaven und Acti·Vera steigen" — genau diese drei',
      JSON.stringify(Object.keys(BLATT_2026).filter((x) => steigt(5, x))) === JSON.stringify(['Bio·Grow', 'Bio·Heaven', 'Acti·Vera']));
    pruef('Woche 6 „Bio·Bloom, Bio·Heaven und Acti·Vera steigen" — genau diese drei',
      JSON.stringify(Object.keys(BLATT_2026).filter((x) => steigt(6, x))) === JSON.stringify(['Bio·Bloom', 'Bio·Heaven', 'Acti·Vera']));
    pruef('Woche 7 „Bio·Grow erreicht seinen Höchstwert" — stimmt', S_(7, 'Bio·Grow') === max('Bio·Grow') && S_(6, 'Bio·Grow') < max('Bio·Grow'));
    pruef('Woche 8 „jedes Mittel auf seinem Höchstwert" — stimmt für alle, die dort gegeben werden',
      Object.keys(BLATT_2026).filter((x) => S_(8, x) > 0).every((x) => S_(8, x) === max(x)));
    pruef('Woche 9 „dieselben Mengen wie Blühwoche 6", Woche 10 ebenso',
      Object.keys(BLATT_2026).every((x) => S_(9, x) === S_(8, x) && S_(10, x) === S_(8, x)));
  }

  console.log('\nG - Die abgelöste Fassung rechnet unverändert — auch mit Patricks Daten');
  {
    const alt = pre.alt;
    pruef('Sie bleibt im Wochendosis-Modus mit ihrer EC-Spitze und ihrem Rhythmus',
      alt.doseMode === 'weekly-split' && alt.ecPeak === 1.6 && JSON.stringify(alt.feedWaterRhythm) === JSON.stringify(pre.arc));
    pruef('Sie ist als abgelöst markiert und nennt die Nachfolgerin',
      alt.abgeloest === 'biobizz_official_2026' && /weicht vom BioBizz-Schema ab/.test(alt.subtitle) && /BioBizz Official 2026/.test(alt.subtitle), alt.subtitle);

    const D = await load(true);
    pruef('Start mit Patricks Daten ohne JS-Fehler', D.errors.length === 0, D.errors[0]);
    D.E(`setDebugDate('2026-08-01')`);
    const r = JSON.parse(D.E(`(function(){
      const c = S.cycles[0], plan = getPlanForCycle(c);
      const namen = {}; (plan.products || []).forEach(x => { namen[x.id] = x.name; });
      const d = getWeekDoses(c.id, 8, c) || {};
      const o = {}; Object.entries(d).forEach(([k, v]) => { o[namen[k] || k] = v; });
      S._activePlanId = plan.id; syncActivePlanToGlobals(); renderDuenger();
      const t = document.getElementById('scr-duenger').textContent;
      return JSON.stringify({ key: plan.presetKey, modus: _doseModeFor(plan), w8: o,
        kopf: /weicht vom BioBizz-Schema ab/.test(t), neuAngeboten: document.getElementById('scr-duenger').innerHTML.includes("loadPreset('biobizz_official_2026')") });
    })()`));
    pruef('Patricks Plan bleibt „biobizz_official" im Wochendosis-Modus', r.key === 'biobizz_official' && r.modus === 'weekly-split', r.key + ' / ' + r.modus);
    // Die Werte sind der Abdruck von vor dem Umbau (scratchpad/sB5/regression.js, vorher.json).
    const SOLL_W8 = { 'CalMag': 0.67, 'Bio·Grow': 1.33, 'Bio·Bloom': 1.33, 'Top·Max': 0.33, 'Acti·Vera': 0.33, 'Alg·A·Mic': 1.33 };
    pruef('Seine Dosen in Plan-Woche 8 sind dieselben wie vor dem Umbau',
      Object.keys(SOLL_W8).length === Object.keys(r.w8).length && Object.entries(SOLL_W8).every(([k, v]) => r.w8[k] === v), JSON.stringify(r.w8));
    pruef('Über seinem Plan sagt der Kopf, dass diese Fassung vom Schema abweicht', r.kopf);
    pruef('Die korrigierte Vorlage wird ihm daneben angeboten', r.neuAngeboten);
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  process.exit(fail ? 1 : 0);
})();
