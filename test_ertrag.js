/**
 * (v1.5.99) Sichert die Zusammenfuehrung der beiden Ertrags-Speicherorte ab.
 *
 * Der Fehler: Ertraege landeten an zwei Stellen, die nichts voneinander wussten. Die
 * Einzelernte in der Pflanzenliste schreibt seit v1.5.54 `plants[].yieldWet/yieldDry`,
 * das aeltere Formular in den Einstellungen `c.plantHarvest[id].wetG/dryG`. Gelesen wurde
 * nur der aeltere Ort. Folge bei Patricks echtem Stand: 37 g trocken und 195 g nass aus
 * Pflanze 5 waren erfasst, die Einstellungen meldeten aber "noch nichts erfasst" und die
 * Zyklus-Bilanz wies gar kein Erntegewicht aus.
 *
 * Der gefaehrlichere Teil war nicht die fehlende Anzeige, sondern das Schreiben: Eine
 * Eingabe im Einstellungs-Formular haette eine ZWEITE Zahl fuer dieselbe Pflanze angelegt.
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

async function load(mut) {
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
      const st = JSON.parse(BACKUP);
      if (mut) mut(st);
      w.localStorage.setItem('growsmart_v4', JSON.stringify(st));
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

  // ---- A: Der erfasste Ertrag ist ueberall sichtbar ----
  console.log('');
  console.log('A - Erfasster Ertrag wird gefunden, egal wo er steht');
  {
    const { E, errors } = await load();
    pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
    pruef('Ausgangslage: Ertrag steht an der Pflanze',
      E('S.cycles.find(c=>c.active).plants[4].yieldDry') === 37);
    pruef('Ausgangslage: der alte Speicherort ist leer',
      E('!S.cycles.find(c=>c.active).plantHarvest'));

    const t = JSON.parse(E('JSON.stringify(getTotalHarvest(S.cycles.find(c=>c.active)))'));
    pruef('Gesamtertrag trocken = 37 g', t.totalDryG === 37, 'dry=' + t.totalDryG);
    pruef('Gesamtertrag nass = 195 g', t.totalWetG === 195, 'wet=' + t.totalWetG);
    pruef('hasPlantData ist wahr', t.hasPlantData === true);
    pruef('Eine Pflanze mit Daten gezaehlt', t.plantsWithData === 1, 'n=' + t.plantsWithData);

    const ph = JSON.parse(E('JSON.stringify(getPlantHarvest(S.cycles.find(c=>c.active), S.cycles.find(c=>c.active).plants[4].id))'));
    pruef('Einzelabruf liefert 37 g trocken', ph.dryG === 37);
    pruef('Einzelabruf liefert 195 g nass', ph.wetG === 195);

    pruef('Zyklus-Bilanz weist das Erntegewicht aus',
      E('cycleStats(S.cycles.find(c=>c.active)).harvestWeight') === 37);
  }

  // ---- B: Die Einstellungs-Zeile sagt nicht mehr "noch nichts erfasst" ----
  console.log('');
  console.log('B - Einstellungen zeigen den Ertrag');
  {
    const { E } = await load();
    E('S.beginnerMode = false'); E('renderSet()');
    const txt = E('document.getElementById("scr-set").textContent.replace(/\\s+/g," ")');
    pruef('Kein "noch nichts erfasst" mehr', !/noch nichts erfasst/.test(txt));
    pruef('37 g trocken werden genannt', /37 g trocken/.test(txt));
    pruef('195 g nass werden genannt', /195 g nass/.test(txt));
    pruef('Ueberschrift erklaert die Pflanzenzahl', /5, davon 2 schon geschnitten/.test(txt));
  }

  // ---- C: Schreiben legt keine zweite Zahl an ----
  console.log('');
  console.log('C - Eine Eingabe im Formular schreibt an die Pflanze, nicht daneben');
  {
    const { E } = await load();
    const pid = E('S.cycles.find(c=>c.active).plants[0].id');
    E(`setPlantHarvest(S.cycles.find(c=>c.active).id, '${pid}', 'dryG', '42')`);
    pruef('Wert landet an der Pflanze',
      E('S.cycles.find(c=>c.active).plants[0].yieldDry') === 42);
    pruef('Kein Eintrag im alten Speicherort',
      E(`!(S.cycles.find(c=>c.active).plantHarvest && S.cycles.find(c=>c.active).plantHarvest['${pid}'] && S.cycles.find(c=>c.active).plantHarvest['${pid}'].dryG)`));
    const t = JSON.parse(E('JSON.stringify(getTotalHarvest(S.cycles.find(c=>c.active)))'));
    pruef('Summe ist 37 + 42 = 79 g', t.totalDryG === 79, 'dry=' + t.totalDryG);
    pruef('Jetzt zwei Pflanzen mit Daten', t.plantsWithData === 2, 'n=' + t.plantsWithData);

    // Leeren muss den Wert wieder entfernen
    E(`setPlantHarvest(S.cycles.find(c=>c.active).id, '${pid}', 'dryG', '')`);
    pruef('Leere Eingabe loescht den Wert',
      E('S.cycles.find(c=>c.active).plants[0].yieldDry') === undefined);
    pruef('Summe wieder 37 g',
      JSON.parse(E('JSON.stringify(getTotalHarvest(S.cycles.find(c=>c.active)))')).totalDryG === 37);
  }

  // ---- D: Keine Doppelzaehlung, wenn beide Orte gefuellt sind ----
  console.log('');
  console.log('D - Steht dieselbe Pflanze in beiden Speichern, zaehlt sie einmal');
  {
    const { E } = await load((st) => {
      const c = st.cycles.find((x) => x.active);
      // Kuenstlich den Altzustand herstellen: dieselbe Pflanze auch im alten Speicher
      c.plantHarvest = {};
      c.plantHarvest[c.plants[4].id] = { dryG: 30, wetG: 150 };
      // und eine reine Alt-Pflanze ohne Gegenstueck an plants[]
      c.plantHarvest['fremde_id_ohne_pflanze'] = { dryG: 11 };
    });
    const t = JSON.parse(E('JSON.stringify(getTotalHarvest(S.cycles.find(c=>c.active)))'));
    pruef('Pflanze 5 zaehlt mit dem Wert von plants (37, nicht 30+37)',
      t.totalDryG === 48, 'dry=' + t.totalDryG + ' (erwartet 37 + 11)');
    pruef('Verwaister Alt-Eintrag geht nicht verloren', t.totalDryG >= 48);
    pruef('Zwei Pflanzen mit Daten gezaehlt', t.plantsWithData === 2, 'n=' + t.plantsWithData);
    const ph = JSON.parse(E('JSON.stringify(getPlantHarvest(S.cycles.find(c=>c.active), S.cycles.find(c=>c.active).plants[4].id))'));
    pruef('Einzelabruf bevorzugt den Wert an der Pflanze', ph.dryG === 37, 'dryG=' + ph.dryG);
  }

  // ---- E: Alte Zyklen ohne plants-Array funktionieren weiter ----
  console.log('');
  console.log('E - Rueckfall fuer Zyklen ohne plants-Array');
  {
    const { E } = await load((st) => {
      const c = st.cycles.find((x) => x.active);
      delete c.plants;
      c.plantHarvest = { alt1: { dryG: 55, wetG: 260 } };
    });
    const t = JSON.parse(E('JSON.stringify(getTotalHarvest(S.cycles.find(c=>c.active)))'));
    pruef('Alter Speicherort wird weiterhin gelesen', t.totalDryG === 55, 'dry=' + t.totalDryG);
    pruef('Nassgewicht ebenfalls', t.totalWetG === 260);
    const ph = JSON.parse(E("JSON.stringify(getPlantHarvest(S.cycles.find(c=>c.active), 'alt1'))"));
    pruef('Einzelabruf liest den alten Ort', ph.dryG === 55);
    E("setPlantHarvest(S.cycles.find(c=>c.active).id, 'alt1', 'dryG', '60')");
    pruef('Schreiben landet weiterhin im alten Ort, wenn es keine Pflanze gibt',
      E("S.cycles.find(c=>c.active).plantHarvest.alt1.dryG") === 60);
  }

  // ---- F: Legacy-Gesamtgewicht ----
  console.log('');
  console.log('F - Ganz altes Gesamtgewicht bleibt lesbar');
  {
    const { E } = await load((st) => {
      const c = st.cycles.find((x) => x.active);
      c.plants = (c.plants || []).map((p) => { const q = Object.assign({}, p); delete q.yieldDry; delete q.yieldWet; return q; });
      delete c.plantHarvest;
      c.harvestWeight = 210;
    });
    const t = JSON.parse(E('JSON.stringify(getTotalHarvest(S.cycles.find(c=>c.active)))'));
    pruef('harvestWeight wird als Trockengewicht gelesen', t.totalDryG === 210, 'dry=' + t.totalDryG);
    pruef('hasPlantData bleibt falsch', t.hasPlantData === false);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
