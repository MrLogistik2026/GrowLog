/**
 * (v1.5.124) Die Diagnose-Datenbank gegen ANBAU.md.
 *
 * Drei Befunde vom 07.09.2026, alle im Browser mit echten Symptom-Eingaben reproduziert.
 *
 * BEFUND 1 - Das klassische Eisenbild fiel durch das Raster.
 * ANBAU.md 4: "Zu hoch (> 6,8): Eisen, Mangan, Zink und Bor gehen in schwerloesliche
 * Formen ueber. Klassisches Bild: Eisenchlorose - hellgelbe JUNGE Blaetter mit zunaechst
 * gruen bleibenden Blattadern." ANBAU.md 6.1: Eisen ist immobil -> Symptom oben.
 * `ph_lockout` kannte aber nur `allLeaves`. Wer "neue Blaetter oben, gelb" waehlte, bekam:
 *     ca_deficiency 72% | nutrient_burn 72% | light_burn 72% | photo_bleaching 72%
 * Also den Calcium-Mangel zuoberst, dessen Handlung "CalMag geben" nach ANBAU.md 6.2 hier
 * die falsche Richtung ist - Calcium ist selbst ein Mg-Antagonist, und die Ursache liegt
 * fast nie in der Menge, sondern in der Verfuegbarkeit.
 *
 * BEFUND 2 - `light_burn` lief in zwei von drei Diagnosen mit.
 * Gemessen ueber alle 225 moeglichen Ein-Symptom-Kombinationen: light_burn erschien in
 * 66 % davon unter den ersten fuenf. Es fuehrte `wilting` (nach ANBAU.md 1 das Bild von
 * Wassermangel/Ueberwaesserung/osmotischem Entzug) und `paleGreen` (nach ANBAU.md 8.2 das
 * Kennzeichen von Photobleaching, das nach WEISS ausbleicht - thermischer Stress vergilbt).
 *
 * BEFUND 3 - Bei Punktgleichstand entschied die Reihenfolge im Quelltext.
 * `score = Math.min(1, score + ctxBoost)` deckelt bei 1. Wer ueber die Symptome schon bei
 * 100 % liegt, kann durch den Kontext nicht mehr steigen - der Hinweis "zu warm" verpuffte.
 * Ergebnis: "verbrannte Spitzen + ZU WARM" nannte die Ueberduengung vor dem Lichtbrand.
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
  else { fail++; console.log('  FEHL ' + name + (info ? '  -> ' + info : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  // Kurzform: liefert die IDs der Treffer in ihrer Reihenfolge.
  const d = (sym, ctx) => JSON.parse(E(
    `JSON.stringify((diagnoseProblems(${JSON.stringify(sym)}, ${JSON.stringify(ctx || {})}) || [])
      .map(function(x){ return x.problem.id; }))`));

  console.log('');
  console.log('A - Eisen hat einen eigenen Eintrag, nach ANBAU.md 4 und 6.1');
  {
    const e = JSON.parse(E(`(function(){
      var p = PROBLEMS.find(function(x){ return x.id === 'iron_deficiency'; });
      if (!p) return JSON.stringify({ fehlt: true });
      return JSON.stringify({
        ort: p.symptoms.location, farbe: p.symptoms.color, form: p.symptoms.shape || null,
        ctx: p.context, text: (p.description || '') + ' ' + (p.action || '')
      });
    })()`));
    pruef('Der Eintrag existiert', !e.fehlt, JSON.stringify(e));
    pruef('Er steht an den JUNGEN Blaettern (Fe ist immobil)',
      JSON.stringify(e.ort) === '["newLeaves"]', JSON.stringify(e.ort));
    pruef('Er hat keine Form-Symptome (Chlorose verformt nicht)', !e.form, JSON.stringify(e.form));
    pruef('Sein Kontext ist "pH zu hoch"', e.ctx && e.ctx.phHigh === true, JSON.stringify(e.ctx));
    pruef('Er nennt das Unterscheidungsmerkmal zum Magnesium-Mangel',
      /Magnesium/.test(e.text) && /unten/.test(e.text), e.text.slice(0, 120));
    pruef('Er raet ZUERST zum pH, nicht zu mehr Eisen',
      /[Zz]uerst den pH/.test(e.text), e.text.slice(0, 160));
    pruef('Er warnt ausdruecklich vor CalMag als Gegenmittel',
      /[Nn]icht mit CalMag/.test(e.text), e.text.slice(-200));
    pruef('Er nennt den Kalkpuffer als Gegenprobe fuer Erde',
      /Dolomitkalk|Kalkpuffer/.test(e.text), e.text.slice(0, 200));
  }

  console.log('');
  console.log('B - Das Eisenbild landet jetzt oben, aber nur mit dem passenden Kontext');
  {
    const mitPh = d({ location: ['newLeaves'], colors: ['yellow'] }, { phHigh: true, phase: 'bloom' });
    pruef('Mit "pH zu hoch" steht Eisen an erster Stelle',
      mitPh[0] === 'iron_deficiency', JSON.stringify(mitPh.slice(0, 3)));

    const mitDrift = d({ location: ['newLeaves'], colors: ['yellow'] },
      { phHigh: true, runoffDriftHigh: true, phase: 'bloom' });
    pruef('Mit driftendem Drain-pH stehen Eisen und pH-Lockout vorn',
      mitDrift[0] === 'iron_deficiency' && mitDrift.indexOf('ph_lockout') <= 2,
      JSON.stringify(mitDrift.slice(0, 3)));

    pruef('ph_lockout ist ueberhaupt sichtbar geworden',
      mitDrift.includes('ph_lockout'), JSON.stringify(mitDrift));
  }

  console.log('');
  console.log('C - Die Gegenprobe: Magnesium bleibt unten, wo es hingehoert');
  {
    const mg = d({ location: ['oldLeaves'], colors: ['yellow'], shapes: ['spotted'] }, { phase: 'bloom' });
    pruef('Alte Blaetter gelb-gefleckt -> Magnesium zuerst', mg[0] === 'mg_deficiency', JSON.stringify(mg.slice(0, 3)));
    pruef('Eisen taucht dort NICHT auf (es ist immobil)',
      !mg.includes('iron_deficiency'), JSON.stringify(mg));
  }

  console.log('');
  console.log('D - light_burn ist auf sein Krankheitsbild zurechtgestutzt (ANBAU.md 8.2)');
  {
    const lb = JSON.parse(E(`(function(){
      var p = PROBLEMS.find(function(x){ return x.id === 'light_burn'; });
      return JSON.stringify({ ort: p.symptoms.location, farbe: p.symptoms.color, form: p.symptoms.shape });
    })()`));
    pruef('Kein "haengend" mehr — das ist Wasser, nicht Licht',
      !lb.form.includes('wilting'), JSON.stringify(lb.form));
    pruef('Kein "hellgruen" mehr — das trennt Photobleaching ab',
      !lb.farbe.includes('paleGreen'), JSON.stringify(lb.farbe));
    pruef('Das echte Bild bleibt: verbrannte Spitzen, Taco, knisternd',
      ['burnTips', 'curlUp', 'crispy'].every(s => lb.form.includes(s)), JSON.stringify(lb.form));

    // Worauf es wirklich ankommt: light_burn darf nicht mehr dort auftauchen, wo es
    // nichts zu suchen hat. Die reine Haeufigkeit ist nur ein Hilfsmass - sie haengt
    // stark davon ab, welches Raster man durchprobiert, und `allLeaves` im Profil laesst
    // sie zwangslaeufig hoch bleiben (bewusst so: wer nicht zwischen oben und unten
    // unterscheidet, soll den Lichtbrand trotzdem finden).
    [['haengend + Erde nass', { location: ['allLeaves'], shapes: ['wilting'] }, { restHigh: true, phase: 'bloom' }],
     ['Spinnweben', { location: ['allLeaves'], shapes: ['webs'] }, { phase: 'bloom' }],
     ['alte Blaetter gelb', { location: ['oldLeaves'], colors: ['yellow'] }, { phase: 'bloom' }],
    ].forEach(([name, sym, ctx]) => {
      const r = d(sym, ctx);
      pruef(`Kein Lichtbrand bei "${name}"`, !r.includes('light_burn'), JSON.stringify(r));
    });

    // Bei "Wurzeln braun" teilt light_burn nur die FARBE - der Ort passt nicht. Es bleibt
    // deshalb in der Liste, aber weit hinten und mit sichtbar niedriger Uebereinstimmung.
    // Ganz verschwinden wuerde es erst, wenn der Ort staerker gewichtet wuerde als Farbe
    // und Form; das waere ein Eingriff in die Punktvergabe aller Diagnosen und steht
    // bewusst aus (siehe UEBERGABE, Abschnitt 0g).
    const wurzel = JSON.parse(E(`(function(){
      var r = diagnoseProblems({ location:['roots'], colors:['brown'] }, { phase:'bloom' }) || [];
      return JSON.stringify(r.map(function(x){ return { id: x.problem.id, s: Math.round(x.score*100) }; }));
    })()`));
    const lbPos = wurzel.findIndex(x => x.id === 'light_burn');
    pruef('Bei "Wurzeln braun" fuehrt die Wurzelfaeule', wurzel[0].id === 'root_rot', JSON.stringify(wurzel));
    pruef('Lichtbrand steht dort weit hinten und schwach',
      lbPos < 0 || (lbPos >= 3 && wurzel[lbPos].s <= 45), JSON.stringify(wurzel));

    // Haeufigkeit ueber ALLE moeglichen Ein-Symptom-Kombinationen - als grobe Bremse
    // gegen einen kuenftigen Ruecksturz, nicht als scharfe Grenze.
    const h = JSON.parse(E(`(function(){
      var orte = Object.keys(DIAG_LABELS.location);
      var farben = Object.keys(DIAG_LABELS.color);
      var formen = Object.keys(DIAG_LABELS.shape);
      var z = {}, n = 0;
      orte.forEach(function(o){ farben.forEach(function(f){
        [null].concat(formen).forEach(function(s){
          n++;
          (diagnoseProblems({ location:[o], colors:[f], shapes: s ? [s] : [] }, { phase:'bloom' }) || [])
            .forEach(function(x){ z[x.problem.id] = (z[x.problem.id] || 0) + 1; });
        });
      });});
      var top = Object.keys(z).sort(function(a,b){ return z[b]-z[a]; })[0];
      return JSON.stringify({ laeufe: n, lichtbrand: z['light_burn'] || 0, haeufigster: top,
                              anteilLichtbrand: Math.round((z['light_burn']||0)/n*100) });
    })()`));
    pruef('light_burn bleibt unter 60 % der Kombinationen (Bremse gegen Ruecksturz)',
      h.anteilLichtbrand < 60, JSON.stringify(h));
  }

  console.log('');
  console.log('E - Bei Gleichstand entscheidet der Kontext, nicht die Reihenfolge im Quelltext');
  {
    const a = d({ location: ['newLeaves'], colors: ['brown'], shapes: ['burnTips'] },
      { tempHot: true, phase: 'bloom' });
    pruef('Verbrannte Spitzen + ZU WARM -> Lichtbrand zuerst',
      a[0] === 'light_burn', JSON.stringify(a.slice(0, 3)));

    const b = d({ location: ['newLeaves'], colors: ['brown'], shapes: ['curlUp'] },
      { tempHot: true, phase: 'bloom' });
    pruef('Taco oben + ZU WARM -> Lichtbrand zuerst', b[0] === 'light_burn', JSON.stringify(b.slice(0, 3)));

    const c = d({ location: ['allLeaves'], colors: ['brown'], shapes: ['burnTips'] },
      { ecDeltaPos: true, phase: 'bloom' });
    pruef('Dieselben Spitzen, aber EC steigend -> Ueberduengung zuerst',
      c[0] === 'nutrient_burn', JSON.stringify(c.slice(0, 3)));

    // Die Punktzahlen selbst duerfen sich NICHT veraendert haben.
    const s = JSON.parse(E(`(function(){
      var r = diagnoseProblems({ location:['oldLeaves'], colors:['yellow'], shapes:['spotted'] }, { phase:'bloom' });
      return JSON.stringify(r.map(function(x){ return Math.round(x.score*100); }));
    })()`));
    pruef('Ein voller Treffer ergibt weiterhin 100 %', s[0] === 100, JSON.stringify(s));
  }

  console.log('');
  console.log('F - Keine Regression bei den Bildern, die vorher schon stimmten');
  {
    const faelle = [
      ['Spinnweben + Flecken -> Spinnmilben', { location: ['allLeaves'], colors: ['spots'], shapes: ['webs'] }, {}, 'spider_mites'],
      ['Wurzeln braun + haengend -> Wurzelfaeule', { location: ['roots'], colors: ['brown'], shapes: ['wilting'] }, { restHigh: true }, 'root_rot'],
      ['Blueten braun/Flecken + feucht -> Bud Rot', { location: ['buds'], colors: ['brown', 'spots'] }, { humidityHigh: true, phase: 'bloom' }, 'bud_rot'],
      ['Alle Blaetter haengend + Erde trocken -> Trockenheit', { location: ['allLeaves'], shapes: ['wilting'] }, { restLow: true, phase: 'bloom' }, 'underwatering'],
    ];
    faelle.forEach(([name, sym, ctx, erwartet]) => {
      const r = d(sym, ctx);
      pruef(name, r[0] === erwartet, JSON.stringify(r.slice(0, 3)));
    });

    // Haengend + Erde dauernass: Ueberwaesserung und Wurzelfaeule sind DIESELBE Geschichte
    // (ANBAU.md 1 - die Naesse verdraengt den Sauerstoff, die Wurzelspitzen sterben ab,
    // Pythium findet ideale Bedingungen), und beide fuehren zur selben Handlung. Welche
    // von beiden vorn steht, ist deshalb kein Qualitaetsmerkmal - dass BEIDE oben stehen
    // und nichts Harmloses dazwischenkommt, schon. Vor v1.5.124 stand hier "Trauermuecken".
    const nass = d({ location: ['allLeaves'], shapes: ['wilting'] }, { restHigh: true, phase: 'bloom' });
    pruef('Haengend + nass: Ueberwaesserung und Wurzelfaeule stehen auf den ersten zwei Plaetzen',
      nass.slice(0, 2).includes('overwatering') && nass.slice(0, 2).includes('root_rot'),
      JSON.stringify(nass.slice(0, 3)));
    pruef('Und nichts Harmloses draengt sich davor',
      nass[0] !== 'fungus_gnats', JSON.stringify(nass.slice(0, 3)));

    // Botrytis ist ein Pflanzentod binnen Tagen (ANBAU.md 13.5) - es darf nie hinter
    // etwas Harmlosem stehen, wenn die Luftfeuchte passt.
    const bot = d({ location: ['buds'], colors: ['brown', 'spots'] },
      { humidityHigh: true, phase: 'bloom', daysToHarvestLow: true });
    pruef('Bud Rot steht bei hoher Luftfeuchte an erster Stelle',
      bot[0] === 'bud_rot', JSON.stringify(bot.slice(0, 3)));
  }

  console.log('');
  console.log('G - Die Datenbank bleibt in sich stimmig');
  {
    const chk = JSON.parse(E(`(function(){
      var orte = Object.keys(DIAG_LABELS.location);
      var farben = Object.keys(DIAG_LABELS.color);
      var formen = Object.keys(DIAG_LABELS.shape);
      var fehler = [], ohneAktion = [], doppelt = {}, ids = [];
      PROBLEMS.forEach(function(p){
        ids.push(p.id);
        doppelt[p.id] = (doppelt[p.id] || 0) + 1;
        (p.symptoms.location || []).forEach(function(k){ if (orte.indexOf(k) < 0) fehler.push(p.id + '.location=' + k); });
        (p.symptoms.color || []).forEach(function(k){ if (farben.indexOf(k) < 0) fehler.push(p.id + '.color=' + k); });
        (p.symptoms.shape || []).forEach(function(k){ if (formen.indexOf(k) < 0) fehler.push(p.id + '.shape=' + k); });
        if (!p.action || !p.action.trim()) ohneAktion.push(p.id);
        if (!p.name || !p.description) ohneAktion.push(p.id + ' (Text)');
      });
      var mehrfach = Object.keys(doppelt).filter(function(k){ return doppelt[k] > 1; });
      return JSON.stringify({ anzahl: PROBLEMS.length, unbekannteSchluessel: fehler,
                              ohneAktion: ohneAktion, doppelteIds: mehrfach });
    })()`));
    pruef('Kein Eintrag benutzt einen unbekannten Symptom-Schluessel',
      chk.unbekannteSchluessel.length === 0, JSON.stringify(chk.unbekannteSchluessel));
    pruef('Jeder Eintrag hat Name, Beschreibung und Handlung',
      chk.ohneAktion.length === 0, JSON.stringify(chk.ohneAktion));
    pruef('Keine doppelten IDs', chk.doppelteIds.length === 0, JSON.stringify(chk.doppelteIds));
    pruef('Die Datenbank ist um den Eisen-Eintrag gewachsen', chk.anzahl >= 23, 'anzahl=' + chk.anzahl);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
