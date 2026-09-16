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

  // (v1.5.229) Der konservative Plan erklärte die Ausfällung verkehrt herum („CalMag zuerst verhindert
  // Phosphat-Ausfällung") — nach ANBAU.md 10 ist Ca²⁺ + PO₄³⁻ genau die Paarung, die ausfällt. Und Epsom
  // (Magnesiumsulfat) stand hinter den Basisdüngern, obwohl Sulfate direkt hinter die Ca/Mg-Produkte gehören.
  console.log('\nE - Mischreihenfolge: richtiger Grund, Sulfat an der richtigen Stelle');
  {
    const r = JSON.parse(E(`(function(){
      const p = FERT_PRESETS.biobizz_konservativ;
      const mo = p.mixOrder || [];
      return JSON.stringify({ mixOrder: mo, mixInfo: p.mixInfo || '',
        idxCalMag: mo.indexOf('CalMag'), idxEpsom: mo.indexOf('Epsom'),
        idxBasis: Math.min(...['Bio·Grow', 'Bio·Bloom'].map(n => mo.indexOf(n)).filter(i => i >= 0)) });
    })()`));
    pruef('Epsom steht direkt hinter CalMag', r.idxCalMag === 0 && r.idxEpsom === 1, r.mixOrder.join(' · '));
    pruef('… und damit vor den Basisdüngern (ANBAU.md 10: Sulfate nach Ca/Mg)',
      r.idxEpsom < r.idxBasis, `Epsom ${r.idxEpsom} · Basis ${r.idxBasis}`);
    pruef('Der Grund ist nicht mehr umgedreht',
      !/verhindert Phosphat-Ausfällung/.test(r.mixInfo) && /Calcium fällt mit Phosphaten und Sulfaten aus/.test(r.mixInfo),
      (r.mixInfo.match(/Reihenfolge:[^.]*\./) || [''])[0]);
    pruef('Die Nummern im Text folgen der Liste (CalMag 1., Epsom 2.)',
      /1\. CalMag zuerst/.test(r.mixInfo) && /2\. Epsom-Salz direkt danach/.test(r.mixInfo));
    // Die zweite Fundstelle war das Lexikon „Mischreihenfolge / universelle Reihenfolge" — also genau der
    // Ort, an dem ein Anfänger die Regel nachschlägt. Gefunden hat sie erst die Wache des Patch-Skripts.
    const lex = E(`JSON.stringify(LEXIKON.flatMap(k => k.items || []).filter(i => /universelle Reihenfolge/.test(JSON.stringify(i))))`);
    pruef('Auch das Lexikon erklärt den Mechanismus richtig herum',
      !/verhindert Phosphat-Ausfällung/.test(lex) && /fällt mit Phosphaten und Sulfaten aus/.test(lex),
      (String(lex).match(/.{0,70}CalMag.{0,90}/) || [''])[0]);
    pruef('Im Quelltext steht die umgedrehte Begründung nirgends mehr', !/verhindert Phosphat-Ausfällung/.test(code));
  }

  // (v1.5.230) Die Misch-Info stand seit v1.5.52 in keinem Bildschirm: Es gibt zwei Renderer für die
  // Mischreihenfolge, und der sichtbare zeigte nur die nummerierte Liste. Gefunden beim Nachsehen der
  // eigenen Korrektur aus v1.5.229 — der Satz war im Zustand, aber nirgends zu lesen.
  console.log('\nF - Die Misch-Info steht auch wirklich auf dem Bildschirm');
  {
    // Eigener, sauberer Ausgangszustand. Die Abschnitte davor fassen S an, und `loadPreset` hat mehrere
    // frühe Rückwege: Substrat-Abgleich mit Rückfrage (presetMediumMismatch → customConfirm) und
    // „Plan existiert bereits". Erbt der Abschnitt den Zustand, lädt er still den falschen Plan —
    // genau das ist beim ersten Lauf passiert (S.mixInfo blieb leer, die Liste begann mit CalMag).
    await E(`(async () => {
      window.customConfirm = () => Promise.resolve(true); window.toast = () => {}; window.vibrate = () => {};
      S.cycles = []; S.entries = {}; S.fertPlans = []; S._activePlanId = null; saveS();
      await loadPreset('cup_sieger');
    })()`);
    await new Promise(r => setTimeout(r, 400));
    const r = JSON.parse(E(`(function(){
      goTo('duenger');
      const t = document.getElementById('scr-duenger').textContent.replace(/\\s+/g, ' ');
      return JSON.stringify({ presetKey: S.presetKey || '', imZustand: String(S.mixInfo || '').length,
        silica: /Silica Force IMMER ZUERST/.test(t),
        mischliste: /Mischreihenfolge/.test(t),
        ausschnitt: (t.match(/Mischreihenfolge.{0,120}/) || [''])[0] });
    })()`));
    pruef('Prüflage: der Cup-Sieger-Plan ist wirklich geladen', r.presetKey === 'cup_sieger', 'presetKey=' + r.presetKey);
    pruef('Prüflage: der Plan hat eine Misch-Info im Zustand', r.imZustand > 100, 'Länge ' + r.imZustand);
    pruef('Die Mischreihenfolge wird angezeigt', r.mischliste === true);
    pruef('Und die Misch-Info steht dabei — samt der Warnung „Silica Force IMMER ZUERST"',
      r.silica === true, r.ausschnitt);
  }

  // (v1.5.231) Feste pH- und Drain-Zahlen in den Plan-Texten — dieselbe Fehlerklasse wie v1.5.216/221.
  // Zwei davon waren nicht nur fest, sondern falsch: Plagron und CANNA Terra sind Erd-Pläne und nannten
  // „pH 5.5–6.5"; unter 6,0 bricht in organischem Substrat die Mikroflora ein (ANBAU.md 4).
  console.log('\nG - pH und Drain kommen aus der Quelle, nicht aus dem Text');
  {
    const r = JSON.parse(E(`(function(){
      const texte = {};
      Object.entries(FERT_PRESETS).forEach(([k, p]) => {
        texte[k] = [p.subtitle, p.mixInfo, p.drainInfo,
          ...Object.values(p.weekFocus || {}).map(w => (w && w.tip) || '')].join(' ~ ');
      });
      return JSON.stringify({ texte,
        erde: phTargetFor('erde').label, erdeK: phTargetFor('erde').labelComma,
        coco: phTargetFor('coco').label, cocoK: phTargetFor('coco').labelComma,
        cocoMid: phTargetFor('coco').mid.toFixed(1),
        drainMin: DRAIN_ZIEL.min, drainMax: DRAIN_ZIEL.max });
    })()`));
    const alle = Object.values(r.texte).join(' | ');
    pruef(`Keine Vorlage schreibt mehr „pH 5.5–6.5" (Erde ist ${r.erde})`, !/pH 5\.5–6\.5/.test(alle),
      (Object.entries(r.texte).find(([, t]) => /pH 5\.5–6\.5/.test(t)) || [''])[0]);
    pruef(`Plagron und CANNA Terra nennen jetzt das Erd-Ziel (${r.erde})`,
      r.texte.plagron.includes('pH ' + r.erde) && r.texte.canna.includes('pH ' + r.erde));
    pruef(`Master-Untertitel nennt die Spanne statt „pH 6.2"`,
      r.texte.biobizz_master.includes('pH ' + r.erde) && !/pH 6\.2 ·/.test(r.texte.biobizz_master));
    pruef(`Drain-Spanne aus DRAIN_ZIEL (${r.drainMin}–${r.drainMax} %) in Master und Light`,
      r.texte.biobizz_master.includes(r.drainMin + '–' + r.drainMax + ' % Drain')
      && r.texte.biobizz_light.includes('Drain immer ' + r.drainMin + '–' + r.drainMax + ' %'));
    pruef(`Beide Coco-Pläne nennen das Coco-Ziel (${r.coco} bzw. ${r.cocoK})`,
      r.texte.canna_coco.includes('pH ' + r.coco) && r.texte.ghe_flora.includes('pH ' + r.cocoK));
    pruef(`ghe_flora Woche 10 nimmt die Mitte des Coco-Ziels (${r.cocoMid})`,
      r.texte.ghe_flora.includes('Reines Wasser mit pH ' + r.cocoMid));
    pruef('ghe_flora nennt für Erde das Erd-Ziel, nicht eine eigene Spanne',
      r.texte.ghe_flora.includes('In Erde gehört der pH auf ' + r.erdeK) && !/6,2–6,5/.test(r.texte.ghe_flora));
  }

  // (v1.5.232) Der CalMag-Eintrag riet bei Kalium-Überschuss zu mehr Calcium. Nach ANBAU.md 6.2 ist
  // Calcium selbst ein Magnesium-Gegenspieler — der Rat verschiebt das Verhältnis ein zweites Mal in
  // dieselbe Richtung. Geprüft wird der ganze ausgelieferte Quelltext (HTML), nicht nur die
  // Datenstruktur: die Lehre aus v1.5.126, wo eine LEXIKON-Suche den Text im Code übersah.
  console.log('\nH - Lexikon und Diagnose raten bei K-Überschuss dasselbe');
  {
    pruef('Der Rat „K-Booster und CalMag immer parallel skalieren" steht nirgends mehr',
      !/parallel skalieren/.test(HTML));
    pruef('Auch die zweite Stelle in „Häufige Fehler" ist weg',
      !/K-Booster ohne CalMag-Erhöhung/.test(HTML));
    pruef('Der Eintrag nennt die Reihenfolge der Diagnose: erst den Blüte-Booster aussetzen',
      /erst den Blüte-Booster \(PK 13\/14, MKP\) aussetzen oder reduzieren/.test(HTML));
    pruef('Und begründet, warum mehr CalMag die falsche Richtung ist',
      /Calcium ist selbst ein Magnesium-Gegenspieler/.test(HTML));
    pruef('Die Fehler-Liste desselben Eintrags nennt dieselbe Reihenfolge',
      /Erst den Booster zurücknehmen, dann pH prüfen, dann gezielt Bittersalz/.test(HTML));
    pruef('Der Mechanismus-Satz ist unverändert geblieben — er war richtig',
      /Hohe K-Konzentrationen blockieren die Aufnahme von Ca und Mg/.test(HTML));
    pruef('Die Magnesium-Diagnose sagt weiterhin dasselbe (seit v1.5.107)',
      /Dann diesen zuerst aussetzen, nicht zusätzlich düngen/.test(HTML));
  }

  // (v1.5.238) Vier Befunde aus dem Rainbow-Plan, die v1.5.172 (Bernstein), v1.5.191 (Nacht-Klima),
  // v1.5.196 (Hard-Dryback) und v1.5.211 (Drain-EC) anderswo längst behoben hatten — und die genau
  // deshalb stehen geblieben sind, weil `FERT_PRESETS` in keiner dieser Runden Prüfgegenstand war
  // (UEBERGABE 0n·D). Die Wächter laufen hier über ALLE Vorlagen, nicht über eine.
  console.log('\nI - Kein Plan-Text widerspricht den Regeln der App');
  {
    const texte = JSON.parse(E(`(function(){
      const t = {};
      Object.entries(FERT_PRESETS).forEach(([k, p]) => {
        t[k] = [p.name, p.subtitle, p.mixInfo, p.drainInfo,
          ...Object.values(p.weekFocus || {}).map(w => w ? ((w.phase || '') + ' ' + (w.tip || '')) : '')].join(' ~ ');
      });
      return JSON.stringify(t);
    })()`));
    const alle = Object.entries(texte);
    const trifft = (re) => alle.filter(([, t]) => re.test(t)).map(([k]) => k);
    const keiner = (name, re) => { const w = trifft(re); pruef(name, w.length === 0, w.join(', ')); };

    keiner('Keine Vorlage setzt das Spülende über einen Drain-EC-Wert (v1.5.211)', /Ziel Drain-EC|Drain-EC (höchstens|unter)\s*[0-9]/i);
    keiner('Keine Vorlage nennt eine feste Bernstein-Spanne als Ernte-Trigger (v1.5.172)', /\d+\s*[–-]\s*\d+\s*% Bernstein/);
    keiner('Keine Vorlage schneidet ab einem festen Bernstein-Anteil (v1.5.172)', /Über \d+\s*% Bernstein/i);
    keiner('Keine Vorlage verlangt einen festen Klar-Anteil vor der Ernte', /unter \d+\s*% klar/i);
    keiner('Keine Vorlage nennt ein eigenes Hard-Dryback-Ziel neben GIESSPUNKT (v1.5.196)', /Hard Dryback \d/i);
    keiner('Keine Vorlage führt gleitende Restgewicht-Gates (ANBAU 1.2: der Gießpunkt gleitet nicht)', /Gate \d+\s*%/i);
    keiner('Keine Vorlage nennt ein eigenes Nacht-Klima neben KLIMA_ZIEL (v1.5.191)', /Nacht-RLF|Nachtabsenkung/i);

    pruef('Der Rainbow-Plan verweist stattdessen auf den Gießpunkt',
      (texte.rainbow_auto.match(/Gießpunkt/g) || []).length >= 3,
      (texte.rainbow_auto.match(/Gießpunkt/g) || []).length + ' Erwähnungen');
    pruef('… und auf das eingestellte Bernstein-Ziel des Nutzers',
      /dein(em)? eingestellte[ms] Bernstein-Ziel/.test(texte.rainbow_auto));
  }

  // (v1.5.239) Drei Vorlagen führen kein Calcium/Magnesium — und sagten es nirgends. Gebaut wurde
  // der Hinweis, nicht das Produkt: Ein Produkt ohne Dosis hätte ±-Knöpfe in der Mischliste, und ein
  // Anfänger dreht die 0 hoch — die erfundene Dosis durch die Hintertür. Geprüft wird deshalb auch,
  // dass im Hinweis selbst keine Dosis steht.
  console.log('\nJ - Pläne ohne Calcium/Magnesium sagen es');
  {
    const r = JSON.parse(E(`(function(){
      const d = {}, hatProdukt = {};
      Object.entries(FERT_PRESETS).forEach(([k, p]) => {
        d[k] = p.drainInfo || '';
        hatProdukt[k] = (p.products || []).some(pr => /CalMag|Cal-?Mag/i.test(pr.name));
      });
      return JSON.stringify({ d, hatProdukt, ohneInfo: Object.keys(FERT_PRESETS).filter(k => !(FERT_PRESETS[k].drainInfo || '').length) });
    })()`));
    const drei = ['plagron', 'canna', 'hesi'];

    pruef('Die drei Pläne führen wirklich kein Cal/Mag-Produkt',
      drei.every(k => !r.hatProdukt[k]), drei.filter(k => r.hatProdukt[k]).join(', '));
    pruef('Keine Vorlage ist mehr ganz ohne Ablauf-Info (waren dieselben drei)',
      r.ohneInfo.length === 0, r.ohneInfo.join(', '));
    pruef('Alle drei sagen, dass kein Calcium/Magnesium-Mittel dabei ist',
      drei.every(k => /kein Calcium\/Magnesium-Mittel/.test(r.d[k])));
    pruef('Die Bedingung ist mit dem eigenen Gerät prüfbar (8 °dH bzw. 0,3 mS/cm)',
      drei.every(k => /8 °dH/.test(r.d[k]) && /0,3 mS\/cm/.test(r.d[k])));
    pruef('Keine Dosis im Hinweis — die App nennt an vier Stellen vier verschiedene',
      drei.every(k => !/\d+\s*(ml|g)\s*\/\s*L/.test(r.d[k])),
      drei.filter(k => /\d+\s*(ml|g)\s*\/\s*L/.test(r.d[k])).join(', '));
    pruef('Reihenfolge wie in Diagnose und Lexikon: erst Booster, dann pH, dann Bittersalz',
      drei.every(k => /setz erst den Booster aus, prüf dann den pH, und gib erst danach gezielt Bittersalz/.test(r.d[k])));
    pruef('… samt Warnung, dass mehr Cal/Mag es verschlimmert (ANBAU 6.2)',
      drei.every(k => /noch mehr Cal\/Mag verschiebt das Verhältnis nur weiter/.test(r.d[k])));
    pruef('Jeder Plan nennt seinen eigenen Booster',
      /Green Sensation/.test(r.d.plagron) && /PK 13\/14/.test(r.d.canna) && /Phosphor Plus/.test(r.d.hesi));
    pruef('Die Mischreihenfolge steht als „vor die Basisdünger", nicht als „als Erstes"',
      drei.every(k => /vor die Basisdünger/.test(r.d[k]) && !/als Erstes ins Wasser/.test(r.d[k])));
  }

  // (v1.5.242 ff.) Anleitung und Lexikon beschreiben die Vorlagen so, wie sie heute sind. Nach v1.5.240 stand in der
  // Anleitung weiter „Official 2025 … die App teilt automatisch durch deine Gießtage" und „Wochendosis-Modus (Official)
  // … durch ca. 2.3 Güsse" — v1.5.240 hatte nach „BioBizz Official" gesucht, die Anleitung schreibt nur „Official".
  console.log('\nK - Anleitung und Lexikon beschreiben die Vorlagen, wie sie sind');
  {
    const r = JSON.parse(E(`(function(){
      const items = HOWTO.flatMap(k => k.items || []);
      const txt = (t) => ((items.find(i => i.t === t) || {}).txt) || '';
      const waehlbar = Object.keys(FERT_PRESETS).filter(k => FERT_PRESETS[k].subtitle && !FERT_PRESETS[k].abgeloest);
      return JSON.stringify({ wahl: txt('Master, Light oder Official?'), modus: txt('Per-Gieß vs. Wochen-Modus'),
        laden: txt('Plan laden'), modi: waehlbar.map(k => [k, _doseModeFor({ presetKey: k })]) });
    })()`));
    pruef('„Master, Light oder Official?" beschreibt Official 2026 je Guss',
      /Official 2026/.test(r.wahl) && /Jeder Guss/.test(r.wahl) && !/2025|Wochen-Gesamtdosen|teilt automatisch/.test(r.wahl), r.wahl.slice(-260));
    pruef('„Per-Gieß vs. Wochen-Modus" nennt Official nicht mehr als Wochendosis-Plan, keine 2,3 Güsse',
      !/\(Official\)/.test(r.modus) && !/2\.3 Güsse/.test(r.modus) && /älteren gespeicherten Plänen/.test(r.modus), r.modus);
    pruef('… und was er behauptet, stimmt: jede wählbare Vorlage rechnet je Guss',
      r.modi.length > 0 && r.modi.every(([, m]) => m === 'per-watering'), r.modi.filter(([, m]) => m !== 'per-watering').map(([k]) => k).join(', '));
    pruef('„Plan laden" warnt nicht mehr vor Überschreiben — bestehende Pläne bleiben',
      !/überschrieben/.test(r.laden) && /bestehenden Pläne bleiben erhalten/.test(r.laden), r.laden.slice(0, 200));
    pruef('… so sagt es auch der Dialog beim Laden', /Deine bestehenden Pläne bleiben erhalten/.test(code));
    const lex = JSON.parse(E(`(function(){
      const e = LEXIKON.flatMap(k => k.items || []).find(i => i.t === 'Düngepläne (Hersteller-Vergleich)') || {};
      const waehlbar = Object.keys(FERT_PRESETS).filter(_vorlageWaehlbar);
      const liste = ((e.practice || '').match(/• <b>[^<]+<\\/b> · für /g) || []).map(z => z.slice(5, z.indexOf('</b>')));
      renderDuenger();
      const dueng = document.getElementById('scr-duenger').innerHTML;
      return JSON.stringify({ text: (e.practice || '') + ' ' + (e.pitfall || ''), namen: waehlbar.map(k => FERT_PRESETS[k].name), liste,
        waehlbar, imDuenger: Object.keys(FERT_PRESETS).filter(k => dueng.includes("loadPreset('" + k + "')")) });
    })()`));
    pruef('Das Lexikon nennt die entfernte Outdoor-Vorlage nicht mehr (seit v1.5.178 weg)', !/BioBizz Outdoor/.test(lex.text));
    pruef('Seine Vorlagen-Liste ist genau die wählbare', lex.liste.length > 0 && JSON.stringify(lex.liste) === JSON.stringify(lex.namen),
      lex.liste.join(', ') + ' | ' + lex.namen.join(', '));
    pruef('… und genau die, die der Düngeplan zum Laden anbietet', JSON.stringify(lex.imDuenger) === JSON.stringify(lex.waehlbar),
      lex.imDuenger.join(', ') + ' | ' + lex.waehlbar.join(', '));
    const empf = JSON.parse(E(`(function(){
      S.fertPlans = [];
      const knopf = (html) => { const i = html.indexOf('>Empfohlen<'); if (i < 0) return null;
        const a = html.lastIndexOf("_wizAnswer('fertPresetKey','", i); return a < 0 ? null : html.slice(a + 28, html.indexOf("'", a + 28)); };
      const e = LEXIKON.flatMap(k => k.items || []).find(i => i.t === 'Düngepläne (Hersteller-Vergleich)') || {};
      const zeile = ((e.practice || '').match(/Anfänger Indoor \\(Erde\\)<\\/td><td[^>]*>([^<]+)</) || [])[1] || '';
      return JSON.stringify({ erde: knopf(_wizStepFertPlan({ medium: 'erde', growType: 'indoor' })),
        coco: knopf(_wizStepFertPlan({ medium: 'coco', growType: 'indoor' })), soll: EINSTEIGER_VORLAGE, zeile,
        name: FERT_PRESETS[EINSTEIGER_VORLAGE.erde].name });
    })()`));
    pruef('Der Assistent empfiehlt, was EINSTEIGER_VORLAGE sagt — Erde und Coco',
      empf.erde === empf.soll.erde && empf.coco === empf.soll.coco, JSON.stringify(empf));
    pruef('… und das Lexikon empfiehlt Einsteigern dieselbe Vorlage', empf.zeile === empf.name, empf.zeile + ' ≠ ' + empf.name);
    // (v1.5.246) Die Vergleichstabelle war in keiner Text-Prüfung: v1.5.228 nahm die Wirkungszusagen aus den Vorlagen,
    // nicht aus ihrer Beschreibung im Lexikon. Und Hesi (Kerkrade) ist eine niederländische Marke.
    const master = JSON.parse(E('JSON.stringify(FERT_PRESETS.biobizz_master.schedule)'));
    pruef('Plan-Vergleich: keine Wirkungszusage „terpenreich" beim Master-Plan, sondern was er tut',
      !/hoher Ertrag, terpenreich/.test(lex.text) && /Woche 7 halbiert, ab Woche 8 keiner/.test(lex.text));
    pruef('… und das stimmt mit dem Master-Plan: Bio·Grow in Woche 7 halb so viel wie in Woche 6, ab Woche 8 keiner',
      master[7]['Bio·Grow'] === master[6]['Bio·Grow'] / 2 && [8, 9, 10, 11, 12].every(w => !(master[w] || {})['Bio·Grow']));
    pruef('Hesi ist eine niederländische Marke, keine deutsche', !/Deutsche Marke/.test(lex.text) && /Niederländische Marke/.test(lex.text));
    // (v1.5.247) Die Prüfung oben suchte nur im Plan-Vergleich und mit großem „D". Im Eintrag „Bio vs. Mineralisch" stand
    // „Hesi … deutsche Marke" weiter. Deshalb jetzt über den ganzen Quelltext, ohne Groß- und Kleinschreibung.
    pruef('Nirgends im Quelltext mehr „deutsche Marke" (auch kleingeschrieben)', !/deutsche Marke/i.test(code),
      (code.match(/.{0,60}deutsche Marke.{0,20}/i) || [''])[0]);
    // K-ENDE
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
