/**
 * (v1.5.225 ff.) Die Texte der Düngeplan-Vorlagen gegen das, was die App selbst sagt und rechnet.
 *
 * Warum es diese Datei gibt: Die Vorlagen in `FERT_PRESETS` waren in KEINER der Text-Prüfungen
 * Prüfgegenstand — nicht in v1.5.125 (Lexikon), v1.5.172 (Bernstein), v1.5.190 (Klima), v1.5.192
 * (IceFlush) und v1.5.210 (Drain-EC). Jede Runde hat ihre Texte bereinigt und diesen Block ausgelassen.
 * Daher stammt die Hälfte der 70 Befunde aus der Plan-Prüfung vom 16.09.2026 (UEBERGABE 0n).
 *
 * Diese Datei wächst mit jedem abgearbeiteten Befund der Gruppe A.
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
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  const code = quelle.split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');

  // (v1.5.225) Der Düngeplan-Bildschirm rendert `mixOrder` als nummerierte Mischanleitung. Mykorrhiza-Pulver
  // stand dort als Schritt 10, während die Produktnotiz daneben „TROCKEN an die Wurzel, NIE ins Gießwasser"
  // sagt. Im Wasser gelöst erreichen die Sporen die Wurzelzone nicht.
  console.log('\nA - Mykorrhiza gehört nicht in die Mischanleitung');
  {
    const r = JSON.parse(E(`(function(){
      const p = FERT_PRESETS.cup_sieger;
      const myko = (p.products || []).find(x => /Mykorrhiza/.test(x.name)) || null;
      return JSON.stringify({
        mixOrder: p.mixOrder || [],
        inMixOrder: (p.mixOrder || []).some(n => /Mykorrhiza/.test(n)),
        produktDa: !!myko,
        notiz: myko ? myko.note : '',
        mixInfo: p.mixInfo || '',
        produkte: (p.products || []).length,
      });
    })()`));
    pruef('cup_sieger: Mykorrhiza steht nicht mehr in der Mischreihenfolge', r.inMixOrder === false, r.mixOrder.join(' · '));
    pruef('Das Produkt bleibt erhalten, mit seiner Anwendung', r.produktDa && /NIE ins Gießwasser/.test(r.notiz), r.notiz.slice(0, 120));
    pruef('Die Mischanleitung erklärt weiter, wohin es stattdessen gehört', /gehört NICHT in die Mischung/.test(r.mixInfo));
    pruef('Produktzahl unverändert (Fingerabdruck bleibt gültig)', r.produkte === 11, 'produkte=' + r.produkte);
    // Zweimal ist richtig, und beide Male als PRODUKT: einmal in der Vorlage, einmal in der Migration v1.1.18,
    // die das Produkt von „HomeGrow24 Granulat" umbenannt hat — sie hat damals genau diesen Fehler behoben
    // (es stand als Gießwasser-Dünger in Woche 4). Was nirgends stehen darf, ist ein Mischschritt.
    pruef('Im Quelltext steht der Name nur als Produkt, nie in einer Mischliste',
      (code.match(/'Mykorrhiza HomeGrow24'/g) || []).length === 2
      && !/mixOrder: \[[^\]]*Mykorrhiza/.test(code) && !/V34_MIXORDER = \[[^\]]*Mykorrhiza/.test(code),
      'Treffer=' + (code.match(/'Mykorrhiza HomeGrow24'/g) || []).length);

    // Die V3.4-Migration schreibt mixOrder in JEDEN gespeicherten cup_sieger-Plan. Ohne sie wäre der Fix
    // halb: Die Vorlage wäre sauber, jedes Gerät, das die App schon einmal geöffnet hat, behielte die alte Liste.
    pruef('Die V3.4-Migration schreibt die Liste ebenfalls ohne Mykorrhiza',
      /const V34_MIXORDER = \[[^\]]*\];/.test(code) && !/const V34_MIXORDER = \[[^\]]*Mykorrhiza/.test(code),
      (code.match(/const V34_MIXORDER = \[[^\]]*\]/) || [''])[0].slice(0, 140));

    // Und für Pläne, die die Migration schon hinter sich haben (_v34SchedMigrated ist dort true),
    // braucht es eine eigene einmalige Reparatur — die Falle aus v1.1.30/31.
    const rep = JSON.parse(E(`(function(){
      try {
        const st = { cycles: [], entries: {}, fertPlans: [{ id: 'fp_x', presetKey: 'cup_sieger', name: 'X',
          products: [{ id: 'p1', name: 'Mykorrhiza HomeGrow24', unit: 'g' }, { id: 'p2', name: 'CalMag', unit: 'ml/L' }],
          schedule: { w1: { p2: 0.3 } }, mixOrder: ['CalMag', 'Mykorrhiza HomeGrow24'] }],
          _v32SchedMigrated2: true, _v33ActiVera: true, _v34SchedMigrated: true, _epsomUnitFix: true };
        localStorage.setItem('growsmart_v4', JSON.stringify(st));
        loadS();
        const p = (S.fertPlans || []).find(x => x.presetKey === 'cup_sieger') || {};
        return JSON.stringify({ ok: true, mixOrder: p.mixOrder || [], flag: !!S._mykoMixFix,
          produkte: (p.products || []).length, dosen: JSON.stringify(p.schedule || {}) });
      } catch (e) { return JSON.stringify({ ok: false, fehler: String(e && e.message || e) }); }
    })()`));
    pruef('Ein schon migrierter Plan lässt sich laden', rep.ok === true, rep.fehler);
    if (rep.ok) {
      pruef('Gespeicherter Plan: Mykorrhiza wird aus der Mischanleitung entfernt',
        !rep.mixOrder.some(n => /Mykorrhiza/i.test(n)) && rep.flag === true, rep.mixOrder.join(' · ') + ' · flag=' + rep.flag);
      pruef('Dabei bleiben Produkte und Dosen unangetastet',
        rep.produkte === 2 && /"p2":0.3/.test(rep.dosen.replace(/\s/g, '')), rep.produkte + ' Produkte · ' + rep.dosen);
    }
  }

  // (v1.5.226) MKP wurde mit V3.4 aus dem Plan genommen (mixInfo: „MKP ist gestrichen"). Drei Wochen-Tipps
  // kündigten es trotzdem weiter an, zwei Untertitel zählten ein Produkt zu viel, und das Lexikon behauptete,
  // es laufe „in Woche 7-9". Das Produkt selbst bleibt — in einer gespeicherten Plankopie kann eine eigene
  // Dosis stehen, und die zu entfernen wäre Datenverlust (v1.5.135).
  console.log('\nB - Der Plan kündigt nichts an, was er nicht dosiert');
  {
    const r = JSON.parse(E(`(function(){
      const p = FERT_PRESETS.cup_sieger;
      const tipps = Object.values(p.weekFocus || {}).map(w => String((w && w.tip) || '')).join(' | ');
      const mkpDosen = Object.values(p.schedule || {}).filter(w => Object.keys(w || {}).some(k => /MKP/i.test(k))).length;
      const lex = JSON.stringify((LEXIKON.flatMap(k => k.items || []).find(i => /^MKP/.test(i.t))) || {});
      return JSON.stringify({ subtitle: p.subtitle || '', tipps, mkpDosen, lex,
        produkte: (p.products || []).length,
        mkpProdukt: (p.products || []).some(x => /MKP/i.test(x.name)) });
    })()`));
    pruef('Kein Wochen-Tipp kündigt MKP an', !/MKP/.test(r.tipps), (r.tipps.match(/[^|]*MKP[^|]*/) || [''])[0]);
    pruef('Der Plan dosiert MKP auch wirklich nirgends', r.mkpDosen === 0, 'Wochen mit MKP-Dosis: ' + r.mkpDosen);
    pruef('Das Produkt bleibt erhalten (eine eigene Dosis darf man eintragen)', r.mkpProdukt === true);
    pruef('Untertitel nennt 11 Produkte — so viele sind es', /11 Produkte/.test(r.subtitle) && r.produkte === 11,
      r.subtitle + ' · tatsächlich ' + r.produkte);
    pruef('Auch der Untertitel im Assistenten nennt 11', !/12 Wochen · 12 Produkte/.test(code));
    pruef('Lexikon behauptet keine MKP-Dosis in Woche 7-9 mehr',
      !/GiDeli MKP in Woche 7-9/.test(r.lex) && /in keiner Woche mit einer Dosis/.test(r.lex),
      (r.lex.match(/.{0,60}GiDeli.{0,80}/) || [''])[0]);
  }

  // (v1.5.227) Seit v1.5.200 hat Coco einen eigenen Gießpunkt (Hebe-Test „Mittel"); unter 60 % Restgewicht
  // meldet die App „Zu trocken für Coco". Die Erd-Pläne wurden damals umgestellt, die beiden Coco-Pläne nicht —
  // sie sagten „Coco trocknen lassen — geht schneller als Erde, Vorsicht" bzw. „Trocknen lassen".
  console.log('\nC - Die Coco-Pläne kennen den Coco-Gießpunkt');
  {
    const r = JSON.parse(E(`(function(){
      const w11 = (k) => String((((FERT_PRESETS[k] || {}).weekFocus || {})[11] || {}).tip || '');
      return JSON.stringify({ coco: w11('canna_coco'), ghe: w11('ghe_flora'), erde: w11('biobizz_konservativ'),
        knopfCoco: GIESSPUNKT.coco.knopf, knopfErde: GIESSPUNKT.erde.knopf });
    })()`));
    const cocoOk = (t) => new RegExp('Hebe-Test „' + r.knopfCoco + '"').test(t) && /Zu trocken für Coco/.test(t) && !/trocknen lassen/i.test(t);
    pruef(`canna_coco Woche 11 nennt den Coco-Gießpunkt („${r.knopfCoco}")`, cocoOk(r.coco), r.coco);
    pruef(`ghe_flora Woche 11 ebenso`, cocoOk(r.ghe), r.ghe);
    pruef(`Der Erd-Plan bleibt beim Erd-Gießpunkt („${r.knopfErde}") — die Quelle unterscheidet die beiden`,
      new RegExp('Hebe-Test „' + r.knopfErde + '"').test(r.erde), r.erde);
    pruef('Im Quelltext lädt kein Plan mehr zum Trockenlaufen ein',
      !/Coco trocknen lassen/.test(code) && !/'Trocknen lassen, Ernte vorbereiten\.'/.test(code));
  }

  // (v1.5.228) Wirkungszusagen in den Plänen — dieselbe Arbeit wie v1.5.172 und v1.5.192, nur waren die
  // Vorlagen damals nicht Prüfgegenstand. Regel: Die Handlung bleibt (sie ist Patricks Planung), die
  // versprochene Wirkung geht raus. Belegtes darf bleiben — Seneszenz etwa steht in ANBAU.md 6.4.
  console.log('\nD - Keine Wirkungszusagen in den Düngeplänen');
  {
    const r = JSON.parse(E(`(function(){
      const texte = [];
      Object.entries(FERT_PRESETS).forEach(([k, p]) => {
        Object.values(p.weekFocus || {}).forEach(w => texte.push(k + ' :: ' + String((w && w.tip) || '')));
        texte.push(k + ' :: ' + String(p.drainInfo || '') + ' ' + String(p.mixInfo || '') + ' ' + String(p.subtitle || ''));
        (p.products || []).forEach(pr => texte.push(k + ' :: ' + String(pr.note || '')));
      });
      const alle = texte.join(' | ');
      const w = (k, n) => String((((FERT_PRESETS[k] || {}).weekFocus || {})[n] || {}).tip || '');
      return JSON.stringify({ alle,
        masterW9: w('biobizz_master', 9), masterW10: w('biobizz_master', 10),
        konsW9: w('biobizz_konservativ', 9), konsW12: w('biobizz_konservativ', 12),
        cupW10: String((((FERT_PRESETS.cup_sieger || {}).weekFocus || {})['10'] || {}).tip || ''),
        ripen: ((FERT_PRESETS.ghe_flora.products || []).find(x => /Ripen/.test(x.name)) || {}).note || '' });
    })()`));
    const verboten = ['trichomreiche Blüten', 'Trichom-Push', 'steinhart', 'Herbst-Stress',
      'Sonnensegeln leersaugen', 'Trichom-Produktion startet', 'Zucker-Mobilisierung',
      'Top·Max für Dichte', 'Top·Max maximal für Dichte', 'Reifebeschleuniger', 'Pitch-Black Tag 3-4'];
    verboten.forEach(v => pruef('Keine Zusage mehr: „' + v + '"', !r.alle.includes(v),
      (r.alle.split(' | ').find(t => t.includes(v)) || '').slice(0, 140)));
    pruef('Die Handlung bleibt stehen (Master Wo 9 nennt weiter P/K und den N-Stopp)',
      /P\/K/.test(r.masterW9) && /kein Stickstoff/.test(r.masterW9), r.masterW9);
    pruef('Belegtes darf bleiben: Master Wo 10 beschreibt die Seneszenz statt sie zu bebildern',
      /gleichmäßig von unten nach oben vergilben/.test(r.masterW10), r.masterW10);
    pruef('Konservativ Wo 9 behält seine Dosis-Angaben', /1\.8/.test(r.konsW9) && /Bio·Grow ist raus/.test(r.konsW9), r.konsW9);
    pruef('IceFlush trägt denselben ehrlichen Satz wie der Rest der App',
      /ein Trichom-Plus ist nicht belegt/.test(r.konsW12), r.konsW12);
    pruef('Cup-Sieger Wo 10 ohne die Zwischen-Dunkelphase, Handlung bleibt',
      /Bloom stark reduzieren/.test(r.cupW10) && !/Pitch-Black/.test(r.cupW10), r.cupW10);
    pruef('Ripen wird beschrieben statt versprochen', /Stickstoffarm, P\/K-betont/.test(r.ripen), r.ripen);
    pruef('Auch der Erklärtext zur Planwahl verspricht nichts mehr',
      !/trichomreiche Blüten ohne blättrige Buds/.test(code) && /im vegetativen Modus/.test(code));
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
