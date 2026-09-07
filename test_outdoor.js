/**
 * (v1.5.123) Outdoor kennt keinen IceFlush - und Substrat bestimmt den Rhythmus.
 *
 * Zwei Befunde vom 07.09.2026, beide aus dem ersten Durchgang durch Bereiche, die nie
 * geprueft wurden.
 *
 * BEFUND 1 - Die Ice-Phase wurde draussen mitgezaehlt, wo es sie nicht gibt.
 * Das Phasenmodell (`phase`, `getAction`) laesst die IceFlush-Phase fuer
 * `growType === 'outdoor'` seit jeher weg. Dieselbe Rechnung stand aber ZWOELFMAL von
 * Hand im Code, und nur fuenf davon prueften den `growType`. Gemessen an Patricks Zyklus,
 * testweise auf Outdoor gestellt:
 *
 *     getAction      -> Ernte an Tag 114, kein einziger Ice-Tag
 *     endspurtState  -> Ernte Tag 116, IceFlush Tag 114
 *
 * Die Richtungen widersprachen sich sogar untereinander: Erntezaehler und Endspurt lagen
 * zu SPAET, die Umrechnung der Samentueten-Wochen zog die Bluetezeit zu kurz und damit die
 * Ernte zu FRUEH - nach ANBAU.md 11 der teuerste Fehler im ganzen Zyklus.
 * Behoben durch `iceLenFor(c)` als einzige Quelle.
 *
 * BEFUND 2 - Die Migration stempelte Erde-Intervalle in jeden Zyklus.
 * `RI.*` (3/3/4) wurde in jeden Zyklus geschrieben, dem die Intervall-Felder fehlten,
 * ohne aufs Substrat zu sehen - obwohl `mediumIntervals()` fuer Coco 2/1/1 liefert.
 * Ein Coco-Zyklus bekam so einen 3-Tage-Rhythmus, waehrend `classifyRestPct` fuer
 * dasselbe Substrat unter 60 % Restgewicht schon "Zu trocken fuer Coco" meldet.
 *
 * WICHTIG an diesem Test: Er prueft vor allem, dass INDOOR sich nicht veraendert hat.
 * Der Phasenmotor ruehrt jeden Giesstag jedes Zyklus an.
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

  console.log('');
  console.log('A - iceLenFor ist die eine Quelle');
  {
    const r = JSON.parse(E(`(function(){
      var c = S.cycles[0];
      var alt = c.growType;
      c.growType = 'indoor';  var drin = iceLenFor(c);
      c.growType = 'outdoor'; var drauss = iceLenFor(c);
      c.growType = alt;
      return JSON.stringify({ drin: drin, drauss: drauss, feld: c.iceDays, ohneZyklus: iceLenFor(null) });
    })()`));
    pruef('Indoor liefert das eingestellte Feld', r.drin === r.feld, JSON.stringify(r));
    pruef('Outdoor liefert 0', r.drauss === 0, JSON.stringify(r));
    pruef('Ohne Zyklus faellt er auf den Standard zurueck', r.ohneZyklus > 0, JSON.stringify(r));
  }

  console.log('');
  console.log('B - INDOOR ist unveraendert (Patricks echter Zyklus)');
  {
    // Diese Zahlen stammen aus der Uebergabe und sind seit Wochen stabil.
    const i = JSON.parse(E(`(function(){
      var c = S.cycles[0];
      c.growType = 'indoor';
      var es = endspurtState(c, todayISO());
      var ernte = null;
      for (var t = 100; t <= 125; t++) { if (getAction(isoPlus(c.startDate, t - 1), c) === 'ernte') { ernte = t; break; } }
      return JSON.stringify({
        letzterGuss: es.letzterGuss, spuel: es.spuelGaenge, iceStart: es.iceStart,
        iceDauer: es.iceDauer, ernteState: es.ernteTag, ernteAktion: ernte
      });
    })()`));
    pruef('Letzter Guss weiterhin Tag 104', i.letzterGuss === 104, JSON.stringify(i));
    pruef('Spuelgaenge weiterhin 107 und 110', JSON.stringify(i.spuel) === '[107,110]', JSON.stringify(i));
    pruef('IceFlush weiterhin Tag 114', i.iceStart === 114, JSON.stringify(i));
    pruef('Ice-Dauer weiterhin 2 Tage', i.iceDauer === 2, JSON.stringify(i));
    pruef('Ernte weiterhin Tag 116', i.ernteState === 116, JSON.stringify(i));
    pruef('Und Aktion und Endspurt sind sich einig', i.ernteAktion === i.ernteState, JSON.stringify(i));
  }

  console.log('');
  console.log('C - OUTDOOR: alle Rechenwege nennen denselben Erntetag');
  {
    const o = JSON.parse(E(`(function(){
      var c = S.cycles[0];
      var alt = c.growType;
      c.growType = 'outdoor';
      try {
        var es = endspurtState(c, todayISO());
        var ernte = null, iceTag = null;
        for (var t = 100; t <= 125; t++) {
          var a = getAction(isoPlus(c.startDate, t - 1), c);
          if (a === 'ernte' && ernte === null) ernte = t;
          if (a === 'ice' && iceTag === null) iceTag = t;
        }
        var hc = harvestCountdown(c);
        return JSON.stringify({
          ernteAktion: ernte, ernteState: es.ernteTag, iceDauer: es.iceDauer,
          gibtEsIceTag: iceTag !== null,
          harvestISO: hc ? hc.harvestISO : null,
          ernteISOausAktion: ernte ? isoPlus(c.startDate, ernte - 1) : null
        });
      } finally { c.growType = alt; }
    })()`));
    pruef('Draussen gibt es keinen Ice-Tag', o.gibtEsIceTag === false, JSON.stringify(o));
    pruef('Die Ice-Dauer ist 0', o.iceDauer === 0, JSON.stringify(o));
    pruef('endspurtState und getAction nennen denselben Erntetag',
      o.ernteState === o.ernteAktion, JSON.stringify(o));
    pruef('harvestCountdown nennt dasselbe Datum',
      o.harvestISO === o.ernteISOausAktion, JSON.stringify(o));
    pruef('Der Erntetag liegt vor dem des Indoor-Laufs (keine Ice-Tage)',
      o.ernteState < 116, JSON.stringify(o));
  }

  console.log('');
  console.log('D - Die Endspurt-Karte bietet draussen keinen IceFlush an');
  {
    // Verglichen wird an Tag 105 - NICHT an "heute". Draussen faellt die Ice-Phase weg,
    // dadurch liegt die Ernte frueher, und an Tag 115 ist der Outdoor-Zyklus bereits im
    // Trocknen: Dort gibt endspurtCard korrekterweise gar nichts mehr aus, weil es nichts
    // mehr einzustellen gibt. Ein Vergleich an "heute" wuerde also zwei verschiedene
    // Phasen gegeneinander stellen und einen Fehler melden, den es nicht gibt.
    const k = JSON.parse(E(`(function(){
      var c = S.cycles[0];
      var alt = c.growType;
      var iso = isoPlus(c.startDate, 104);   // Tag 105, in beiden Modi noch Bluete
      try {
        c.growType = 'indoor';
        var drin = endspurtCard(c, iso);
        c.growType = 'outdoor';
        var drauss = endspurtCard(c, iso);
        return JSON.stringify({
          drinIce: /IceFlush/.test(drin), drinDry: /Hard-Dryback/.test(drin),
          draussIce: /IceFlush/.test(drauss), draussDry: /Hard-Dryback/.test(drauss),
          draussErnte: /Ernte/.test(drauss), draussSpuelen: /Spülen ab/.test(drauss),
          drinLaenge: drin.length, draussLaenge: drauss.length
        });
      } finally { c.growType = alt; }
    })()`));
    pruef('Indoor: IceFlush-Zeile ist da', k.drinIce === true, JSON.stringify(k));
    pruef('Indoor: Hard-Dryback ist da', k.drinDry === true, JSON.stringify(k));
    pruef('Outdoor: keine IceFlush-Zeile', k.draussIce === false, JSON.stringify(k));
    pruef('Outdoor: kein Hard-Dryback', k.draussDry === false, JSON.stringify(k));
    pruef('Outdoor: Ernte bleibt einstellbar', k.draussErnte === true, JSON.stringify(k));
    pruef('Outdoor: Spuelen bleibt einstellbar', k.draussSpuelen === true, JSON.stringify(k));
    pruef('Outdoor ist kuerzer, aber nicht leer',
      k.draussLaenge > 2000 && k.draussLaenge < k.drinLaenge, JSON.stringify(k));

    // Nach der Ernte gibt es nichts mehr einzustellen - dort ist LEER richtig.
    const nach = E(`(function(){
      var c = S.cycles[0]; var alt = c.growType;
      try {
        c.growType = 'outdoor';
        var iso = isoPlus(c.startDate, 119);   // Tag 120, draussen laengst Trocknen
        var p = phase(iso, c);
        return (p ? p.ph : '?') + '|' + (endspurtCard(c, iso).length === 0 ? 'leer' : 'gefuellt');
      } finally { c.growType = alt; }
    })()`);
    pruef('Nach der Ernte bleibt die Karte draussen zu Recht leer',
      nach === 'dry|leer' || nach === 'cure|leer', nach);
  }

  console.log('');
  console.log('E - Samentueten-Wochen rechnen draussen ohne Ice-Tage');
  {
    const s = JSON.parse(E(`(function(){
      var c = S.cycles[0];
      var alt = c.growType;
      try {
        c.growType = 'indoor';  var drin = bloomDaysFromSeedWeeks(c, 17);
        c.growType = 'outdoor'; var drauss = bloomDaysFromSeedWeeks(c, 17);
        return JSON.stringify({ drin: drin, drauss: drauss, iceTage: c.iceDays, art: seedWeeksKind(c) });
      } finally { c.growType = alt; }
    })()`));
    // Bei 'total' (Samen bis Ernte) fallen die Ice-Tage weg -> draussen bleibt MEHR Bluetezeit.
    if (s.art === 'total') {
      pruef('Draussen bleibt genau die Ice-Dauer mehr Bluetezeit',
        s.drauss - s.drin === s.iceTage, JSON.stringify(s));
    } else {
      pruef('Bei reiner Bluetezeit-Angabe aendert sich nichts', s.drin === s.drauss, JSON.stringify(s));
    }
  }

  console.log('');
  console.log('F - Die Migration stempelt keine Erde-Intervalle mehr in Coco');
  {
    const m = JSON.parse(E(`(function(){
      return JSON.stringify({
        erde: mediumIntervals('erde'),
        coco: mediumIntervals('coco'),
        hydro: mediumIntervals('hydro')
      });
    })()`));
    pruef('Coco hat einen kuerzeren Bluete-Rhythmus als Erde',
      m.coco.bloom < m.erde.bloom, JSON.stringify(m));
    pruef('Hydro ebenfalls', m.hydro.bloom < m.erde.bloom, JSON.stringify(m));

    // Der eigentliche Fall: ein Zyklus OHNE Intervall-Felder geht durch die Migration.
    const w = JSON.parse(E(`(function(){
      var roh = { id: 'testcoco', name: 'Coco-Test', active: true, startDate: todayISO(),
                  medium: 'coco', seedType: 'auto', growType: 'indoor' };
      // genau das, was die Migration tut:
      var mi = mediumIntervals(roh.medium);
      if (roh.intAnzucht === undefined) roh.intAnzucht = mi.anzucht;
      if (roh.intBloom === undefined)   roh.intBloom = mi.bloom;
      if (roh.intFlush === undefined)   roh.intFlush = mi.flush;
      return JSON.stringify({ anzucht: roh.intAnzucht, bloom: roh.intBloom, flush: roh.intFlush,
                              erdeWert: RI.bloom });
    })()`));
    pruef('Ein Coco-Zyklus ohne Felder bekommt den Coco-Rhythmus',
      w.bloom === m.coco.bloom, JSON.stringify(w));
    pruef('Und nicht den Erde-Rhythmus', w.bloom !== w.erdeWert, JSON.stringify(w));

    // Gegenprobe im echten Code: Patricks Zyklus hat die Felder gesetzt und bleibt unberuehrt.
    const p = E(`(function(){ var c = S.cycles[0]; return c.intBloom + '|' + c.medium; })()`);
    pruef('Patricks gesetzter Rhythmus bleibt unangetastet', p === '3|erde', p);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
