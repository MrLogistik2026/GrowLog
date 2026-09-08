/**
 * (v1.5.130/131) Patricks Meldungen vom 08.09.2026 — seinem Erntetag.
 *
 * Vier Beobachtungen, alle mit seinen echten Daten reproduziert:
 *
 * BEFUND 1 — "Hier wird aus 1 L Eis, 11250 ml Wasser."
 * Exakt nachgerechnet: 11 L Topf x 341 = 3750 ml (die SPUEL-Formel), x 3 Pflanzen = 11250.
 * Die IceFlush-Karte prueft `getAction(iso) === 'ice'`, die Menge ging ueber `p.ph`.
 * Solange beides zusammenfaellt, merkt das niemand. Bei einem vorgezogenen IceFlush faellt
 * es auseinander: Aktion 'ice' an Tag 113, Phase dort noch 'flush' -> Spuelmenge auf der
 * Eis-Karte. Die Menge folgt jetzt der AKTION.
 *
 * BEFUND 2 — Zwei widersprechende Karten am selben Tag.
 * Tag 113 zeigte "Hard-Dryback-Phase · IceFlush in 1 Tag" UND darunter "IceFlush!".
 * Also "ab jetzt nicht mehr giessen, Eis kommt morgen" neben "leg jetzt Eis".
 *
 * BEFUND 3 — Symbol und Beschriftung auf verschiedenen Tagen.
 * Im Kalender trug Tag 113 das Symbol 🧊 ohne Wort, Tag 114 das Wort "IceFlush" ohne
 * Symbol. Ursache: Die Beschriftung markiert den Phasenwechsel, das Symbol die Aktion.
 * "IceFlush" und "Ernte" sind aber EREIGNISSE, keine Zeitraeume — ihre Beschriftung
 * gehoert auf den Tag, an dem sie stattfinden.
 *
 * BEFUND 4 — "Ich kann kein Gewicht der Ernte eintragen."
 * Die Felder waren da und nahmen Eingaben an; sie schrieben nach `cd.harvestLog`, und
 * diesen Ort liest ausser der Karte selbst NIEMAND. `getTotalHarvest` kennt
 * `plants[].yieldWet/yieldDry` und `c.plantHarvest` — nicht `harvestLog`. Was dort stand,
 * tauchte in keiner Auswertung auf. Das ist v1.5.99 noch einmal, mit einem dritten
 * Speicherort. Dazu Patricks Wunsch: "Eigentlich muesste ich auch jede Pflanze einzeln
 * eingeben bei der Ernte. So kann man besser vergleichen."
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

// Legt Patricks Zustand an: der alte Verschiebe-Vermerk aus der Zeit VOR v1.5.110,
// der die Aktion bewegt, die Phase aber stehen laesst.
const ALT_VERMERK = `(function(){
  var c = S.cycles[0];
  c.gussMoves = (c.gussMoves || []).concat([
    { from: isoPlus(c.startDate, 113), to: isoPlus(c.startDate, 112), act: 'ice' }
  ]);
  return true;
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('');
  console.log('A - Die Eismenge folgt der Aktion, nicht der Phase');
  {
    const sicherung = E('JSON.stringify(S.cycles[0])');
    E(ALT_VERMERK);
    const r = JSON.parse(E(`(function(){
      var c = S.cycles[0];
      var iso113 = isoPlus(c.startDate, 112);
      var iso110 = isoPlus(c.startDate, 109);
      var iso114 = isoPlus(c.startDate, 113);
      return JSON.stringify({
        t113: { aktion: getAction(iso113, c), phase: phase(iso113, c).ph,
                menge: Math.round(waterSuggestion(c, phase(iso113, c), iso113) || 0) },
        t110: { aktion: getAction(iso110, c) || null, phase: phase(iso110, c).ph,
                menge: Math.round(waterSuggestion(c, phase(iso110, c), iso110) || 0) },
        pflanzen: getEffectivePlantCount(c, iso113),
        topf: getPotSize(c)
      });
    })()`));

    pruef('Tag 113 traegt die Aktion "ice"', r.t113.aktion === 'ice', JSON.stringify(r.t113));
    pruef('Die Phase steht dort noch auf "flush" (genau der Bruch)',
      r.t113.phase === 'flush', JSON.stringify(r.t113));
    pruef('Trotzdem kommt die EISmenge, nicht die Spuelmenge',
      r.t113.menge < 4000, 'menge=' + r.t113.menge);
    pruef('Und zwar 700 ml je Topf mal Pflanzen',
      r.t113.menge === 700 * r.pflanzen, `${r.t113.menge} statt ${700 * r.pflanzen}`);
    pruef('Die alte Zahl 11250 kommt nicht mehr vor',
      r.t113.menge !== 11250, 'menge=' + r.t113.menge);
    // Gegenprobe: ein Tag in der Spuelphase OHNE Eis-Aktion behaelt die Spuelmenge.
    pruef('Ein normaler Spueltag behaelt seine grosse Menge',
      r.t110.menge > 4000, JSON.stringify(r.t110));

    E(`Object.assign(S.cycles[0], JSON.parse(${JSON.stringify(sicherung)}))`);
  }

  console.log('');
  console.log('B - Kein Hard-Dryback-Hinweis an dem Tag, an dem das Eis kommt');
  {
    const sicherung = E('JSON.stringify(S.cycles[0])');
    E(ALT_VERMERK);
    const t = E(`(function(){
      var c = S.cycles[0];
      openEntry(isoPlus(c.startDate, 112));
      return document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
    })()`);
    pruef('Die IceFlush-Karte steht da', /IceFlush!/.test(t), t.slice(0, 160));
    pruef('Der Hard-Dryback-Hinweis steht NICHT mehr daneben',
      !/Hard-Dryback-Phase/.test(t), 'beide Karten gleichzeitig');
    pruef('Die Karte nennt die Menge je Topf', /je Topf/.test(t), (t.match(/schmilzt zu.{0,60}/i) || [''])[0]);
    pruef('Und nennt 11250 nirgends', !/11250/.test(t));

    // Gegenprobe: an einem echten Dryback-Tag muss der Hinweis bleiben.
    const t2 = E(`(function(){
      var c = S.cycles[0];
      openEntry(isoPlus(c.startDate, 111));
      return document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
    })()`);
    pruef('An einem Tag ohne Eis bleibt der Dryback-Hinweis erhalten',
      /Hard-Dryback-Phase/.test(t2) || !/IceFlush!/.test(t2), t2.slice(0, 140));

    E(`Object.assign(S.cycles[0], JSON.parse(${JSON.stringify(sicherung)}))`);
  }

  console.log('');
  console.log('C - Symbol und Beschriftung stehen auf demselben Tag');
  {
    const lies = () => JSON.parse(E(`(function(){
      var c = S.cycles[0];
      calDate = new Date(2026, 8, 15);
      goTo('cal');
      var z = [].slice.call(document.querySelectorAll('#cal-body .cal-grid > *'))
        .filter(function(x){ return /calClick/.test(x.getAttribute('onclick') || ''); });
      var o = {};
      ['2026-09-05','2026-09-06','2026-09-08'].forEach(function(iso){
        var e = z.filter(function(x){ return (x.getAttribute('onclick')||'').indexOf(iso) >= 0; })[0];
        if (e) o[iso] = e.textContent.replace(/\\s+/g,' ').trim();
      });
      return JSON.stringify(o);
    })()`));

    const normal = lies();
    pruef('Ohne Verschiebung: Symbol und Wort an Tag 114',
      /🧊/.test(normal['2026-09-06']) && /IceFlush/.test(normal['2026-09-06']), JSON.stringify(normal));

    const sicherung = E('JSON.stringify(S.cycles[0])');
    E(ALT_VERMERK);
    const verschoben = lies();
    pruef('Vorgezogen: Symbol UND Wort an Tag 113',
      /🧊/.test(verschoben['2026-09-05']) && /IceFlush/.test(verschoben['2026-09-05']),
      JSON.stringify(verschoben));
    pruef('An Tag 114 steht das Wort nicht mehr allein',
      !/IceFlush/.test(verschoben['2026-09-06']), JSON.stringify(verschoben));
    pruef('Die Ernte-Beschriftung bleibt unberuehrt',
      /Ernte/.test(verschoben['2026-09-08']), JSON.stringify(verschoben));

    E(`Object.assign(S.cycles[0], JSON.parse(${JSON.stringify(sicherung)}))`);
  }

  console.log('');
  console.log('D - Das Ernte-Log schreibt dorthin, wo gezaehlt wird');
  {
    const sicherung = E('JSON.stringify(S.cycles[0])');
    const r = JSON.parse(E(`(function(){
      var c = S.cycles[0];
      openEntry(todayISO());
      var el = document.getElementById('scr-entry');
      var felder = [].slice.call(el.querySelectorAll('input[oninput*="setPlantHarvest"]'));
      var vorher = getTotalHarvest(c);
      // Wie ein Nutzer: ins erste Nassgewicht-Feld tippen
      var f = felder.filter(function(x){ return /nass/.test(x.placeholder); })[0];
      var pflanzen = (c.plants || []).length;
      if (f) { f.value = '250'; f.dispatchEvent(new window.Event('input', { bubbles: true })); }
      var nachher = getTotalHarvest(c);
      var box = document.getElementById('ernte-summe-' + c.id);
      return JSON.stringify({
        phase: phase(todayISO(), c).ph,
        felder: felder.length,
        pflanzen: pflanzen,
        vorher: vorher, nachher: nachher,
        summeText: box ? box.textContent.replace(/\\s+/g,' ').trim() : null,
        proPflanze: /je Pflanze/.test(el.textContent)
      });
    })()`));

    pruef('Heute ist der Erntetag', r.phase === 'harvest', 'phase=' + r.phase);
    pruef('Es gibt zwei Felder je Pflanze', r.felder === r.pflanzen * 2,
      `${r.felder} Felder bei ${r.pflanzen} Pflanzen`);
    pruef('Die Karte sagt, dass es je Pflanze geht', r.proPflanze === true);
    pruef('Die Eingabe erhoeht das GEZAEHLTE Gesamtgewicht',
      r.nachher.totalWetG === r.vorher.totalWetG + 250,
      `${r.vorher.totalWetG} -> ${r.nachher.totalWetG}`);
    pruef('Und die Zahl der erfassten Pflanzen steigt',
      r.nachher.plantsWithData === r.vorher.plantsWithData + 1, JSON.stringify(r.nachher));
    pruef('Die Summenzeile zieht sofort mit',
      r.summeText && r.summeText.indexOf(String(Math.round(r.nachher.totalWetG))) >= 0, r.summeText);

    E(`Object.assign(S.cycles[0], JSON.parse(${JSON.stringify(sicherung)}))`);
  }

  console.log('');
  console.log('E - Nichts geht verloren, und die Karte bleibt lange genug erreichbar');
  {
    const sicherung = E('JSON.stringify(S.cycles[0])');

    // Ein alter, nirgends gezaehlter harvestLog-Wert muss sichtbar bleiben.
    const alt = E(`(function(){
      var c = S.cycles[0];
      var iso = todayISO();
      S.entries[iso] = S.entries[iso] || {};
      S.entries[iso].cycleData = S.entries[iso].cycleData || {};
      S.entries[iso].cycleData[c.id] = S.entries[iso].cycleData[c.id] || {};
      S.entries[iso].cycleData[c.id].harvestLog = { wetWeight: 480, dryWeight: 110 };
      openEntry(iso);
      var t = document.getElementById('scr-entry').textContent.replace(/\\s+/g,' ');
      delete S.entries[iso].cycleData[c.id].harvestLog;
      return t;
    })()`);
    pruef('Ein frueher eingetragener Wert wird angezeigt', /480/.test(alt) && /110/.test(alt), alt.slice(0, 200));
    pruef('Und es steht dabei, dass er nie mitgezaehlt wurde',
      /nirgends mitgezählt/.test(alt), (alt.match(/.{0,80}mitgezählt.{0,60}/) || [''])[0]);

    // Das Trockengewicht steht erst nach dem Trocknen fest (ANBAU.md 12.1: 7-14 Tage).
    const phasen = JSON.parse(E(`(function(){
      var c = S.cycles[0], o = {};
      [116, 118, 125, 135].forEach(function(t){
        var iso = isoPlus(c.startDate, t - 1);
        openEntry(iso);
        o['T' + t] = {
          phase: phase(iso, c).ph,
          log: document.getElementById('scr-entry').querySelectorAll('input[oninput*="setPlantHarvest"]').length > 0
        };
      });
      return JSON.stringify(o);
    })()`));
    pruef('Erntetag: Log da', phasen.T116.log === true, JSON.stringify(phasen.T116));
    pruef('Trocknen: Log da', phasen.T118.log === true, JSON.stringify(phasen.T118));
    pruef('Curing: Log immer noch da — dann kennt man das Trockengewicht erst',
      phasen.T125.log === true || phasen.T125.phase !== 'cure', JSON.stringify(phasen.T125));

    E(`Object.assign(S.cycles[0], JSON.parse(${JSON.stringify(sicherung)}))`);
  }

  console.log('');
  console.log('F - (v1.5.132) Der Duengeplan-Hinweis sagt, was wirklich passiert');
  {
    // Patrick: "Die Info verwirrt selbst mich, obwohl ich die App mit baue. Eigentlich
    // muss sich der Duengeplan automatisch nach der Bluetedauer richten."
    //
    // Der alte Text behauptete, der Plan sei "fuer 49 Tage Bluete gemacht" und die App
    // fuehre "fuer die paar Extra-Tage die Duengung einfach sinnvoll weiter". Beides
    // falsch: Seit v1.5.51 verteilt planWeekBounds die Plan-Wochen ueber den ECHTEN
    // Zyklus. Und der Knopf "auf 49 angleichen" haette Patricks Ernte von Tag 116 auf
    // Tag 80 verschoben - 36 Tage in die Vergangenheit.
    const b = JSON.parse(E(`(function(){
      var c = S.cycles[0];
      var bounds = planWeekBounds(c);
      return JSON.stringify({ bounds: bounds, bloomDays: c.bloomDays });
    })()`));
    pruef('Der Plan hat ein echtes Wochenraster', Array.isArray(b.bounds) && b.bounds.length > 3,
      JSON.stringify(b.bounds));
    const wochen = b.bounds.length + 1;
    const proWoche = b.bounds[b.bounds.length - 1] / wochen;
    pruef('Es streckt sich ueber den ganzen Zyklus, nicht ueber 7-Tage-Wochen',
      proWoche > 7, `${Math.round(proWoche)} Tage je Plan-Woche`);

    const t = E(`(function(){ goTo('set'); return document.getElementById('scr-set').textContent.replace(/\\s+/g,' '); })()`);
    pruef('Die alte Behauptung ist weg', !/Das ist kein Fehler/.test(t));
    pruef('Der gefaehrliche Knopf ist weg', !/angleichen/.test(t));
    pruef('Stattdessen steht dort, dass es automatisch geht',
      /richtet sich automatisch/.test(t), (t.match(/.{0,40}richtet sich automatisch.{0,120}/) || [''])[0]);
    pruef('Und die echte Wochenlaenge wird genannt',
      new RegExp('rund ' + Math.round(proWoche) + ' Tage').test(t),
      (t.match(/rund \d+ Tage[^.]{0,30}/) || [''])[0]);
    pruef('Es steht dabei, dass man nichts umstellen muss', /nichts umstellen/.test(t));

    // Gegenprobe: Wo Plan und Zyklus ohnehin passen, soll gar nichts stehen.
    const kurz = E(`(function(){
      var c = S.cycles[0];
      var alt = c.bloomDays;
      try {
        c.bloomDays = 63;   // 12 Wochen x 7 Tage minus Anzucht -> etwa passend
        goTo('set');
        return document.getElementById('scr-set').textContent.replace(/\\s+/g,' ');
      } finally { c.bloomDays = alt; goTo('set'); }
    })()`);
    pruef('Bei passender Laenge bleibt die Karte still (oder nennt eine kleinere Zahl)',
      !/rund 9 Tage/.test(kurz), (kurz.match(/rund \d+ Tage/) || ['(keine Karte)'])[0]);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
