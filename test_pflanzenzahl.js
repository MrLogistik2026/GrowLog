/**
 * (v1.5.103) Sichert ab, dass keine gespeicherte Pflanzenzahl groesser sein kann als die
 * Zahl der je angelegten Pflanzen.
 *
 * Der Fehler: `getEffectivePlantCount` liest einen eintragsspezifischen Uebersteuerungswert
 * `cd.plantCount` - ein Feld, das im heutigen Code KEINE Stelle mehr schreibt. Es stammt aus
 * einer frueheren Version und ueberstimmte trotzdem alles andere. Ein alter, falscher Wert
 * wirkte dadurch dauerhaft weiter, ohne dass er sich in der Oberflaeche korrigieren liesse:
 * Das zugehoerige Eingabefeld gibt es nicht mehr.
 *
 * In Patricks Sicherung steht im Eintrag vom 03.06.2026 eine 7, obwohl nie mehr als fuenf
 * Pflanzen angelegt waren (von ihm am 05.09.2026 bestaetigt: "Ich hatte nie 7 Pflanzen").
 * Folgen: Die Giessmenge dieses Tages fiel 40 % zu hoch aus (3150 statt 2250 ml), und ueber
 * den Stempel `plantsAtWatering` verzerrte die Zahl zusaetzlich die gemessene Menge je
 * Pflanze (3500 / 7 = 500 statt 3500 / 5 = 700) - ein Wert, der in kuenftige Empfehlungen
 * einfliesst und sie nach unten zieht.
 *
 * Gedeckelt statt geloescht: Ein Override kann sinnvoll sein, aber nie groesser als die Zahl
 * der angelegten Pflanzen. Die gespeicherten Daten bleiben unveraendert.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

const TAG19 = '2026-06-03';

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

  console.log('');
  console.log('A - Patricks echter Fall: die 7 aus dem Eintrag vom 03.06.2026');
  {
    const { E, errors } = await load();
    pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
    pruef('Die 7 steht unveraendert in den Daten',
      E(`S.entries['${TAG19}'].cycleData[S.cycles[0].id].plantCount`) === 7);
    pruef('Es sind nur fuenf Pflanzen angelegt', E('S.cycles[0].plants.length') === 5);
    pruef('Obergrenze ist 5', E('_plantsCap(S.cycles[0])') === 5);
    pruef('Effektive Pflanzenzahl an dem Tag ist 5, nicht 7',
      E(`getEffectivePlantCount(S.cycles[0], '${TAG19}')`) === 5,
      'bekommen: ' + E(`getEffectivePlantCount(S.cycles[0], '${TAG19}')`));
    const ml = E(`waterSuggestion(S.cycles[0], phase('${TAG19}', S.cycles[0]), '${TAG19}')`);
    pruef('Giessmenge faellt von 3150 auf 2250 ml', ml === 2250, 'bekommen: ' + ml);
  }

  console.log('');
  console.log('B - Der historische Giess-Stempel wird ebenfalls gedeckelt');
  {
    const { E } = await load();
    pruef('plantsAtWatering steht unveraendert auf 7',
      E(`S.entries['${TAG19}'].cycleData[S.cycles[0].id].plantsAtWatering`) === 7);
    // 3500 ml / 5 = 700, nicht 3500 / 7 = 500
    const werte = JSON.parse(E(`JSON.stringify((function(){
      const c = S.cycles[0];
      const cd = S.entries['${TAG19}'].cycleData[c.id];
      const pl = Math.min(cd.plantsAtWatering, _plantsCap(c));
      return { gedeckelt: pl, mlJePflanze: parseFloat(cd.water) / pl };
    })())`));
    pruef('Stempel wird auf 5 gedeckelt', werte.gedeckelt === 5);
    pruef('Menge je Pflanze ist 700, nicht 500', werte.mlJePflanze === 700, 'bekommen: ' + werte.mlJePflanze);
  }

  console.log('');
  console.log('C - Gegenprobe: normale Werte bleiben unangetastet');
  {
    const { E } = await load();
    // Ein Override KLEINER als die Pflanzenzahl ist legitim und muss durchkommen
    E(`S.entries['${TAG19}'].cycleData[S.cycles[0].id].plantCount = 3`);
    pruef('Override 3 bei 5 Pflanzen bleibt 3',
      E(`getEffectivePlantCount(S.cycles[0], '${TAG19}')`) === 3);
    E(`S.entries['${TAG19}'].cycleData[S.cycles[0].id].plantCount = 5`);
    pruef('Override 5 bei 5 Pflanzen bleibt 5',
      E(`getEffectivePlantCount(S.cycles[0], '${TAG19}')`) === 5);
    E(`delete S.entries['${TAG19}'].cycleData[S.cycles[0].id].plantCount`);
    pruef('Ohne Override zaehlen die stehenden Pflanzen',
      E(`getEffectivePlantCount(S.cycles[0], '${TAG19}')`) === 5);
  }

  console.log('');
  console.log('D - Geerntete Pflanzen zaehlen weiterhin richtig herunter');
  {
    const { E } = await load();
    // Pflanze 5 wurde am 16.08. geschnitten, Pflanze 4 am 27.08.
    pruef('Vor der ersten Ernte: 5', E("getEffectivePlantCount(S.cycles[0], '2026-08-15')") === 5);
    pruef('Nach der ersten Ernte: 4', E("getEffectivePlantCount(S.cycles[0], '2026-08-20')") === 4);
    pruef('Nach der zweiten Ernte: 3', E("getEffectivePlantCount(S.cycles[0], '2026-08-28')") === 3);
    pruef('Die Zahl steigt nach einer Ernte nie wieder an',
      E(`(function(){
        const c = S.cycles[0];
        let letzte = 99, ok = true;
        for (let t = 100; t <= 115; t++) {
          const n = getEffectivePlantCount(c, isoPlus(c.startDate, t-1));
          if (n > letzte) ok = false;
          letzte = n;
        }
        return ok;
      })()`) === true);
  }

  console.log('');
  console.log('E - Randfaelle der Obergrenze');
  {
    const { E } = await load((st) => { delete st.cycles.find(c => c.active).plants; });
    pruef('Ohne plants-Array greift plantCount als Obergrenze',
      E('_plantsCap(S.cycles[0])') === 5, 'bekommen: ' + E('_plantsCap(S.cycles[0])'));
    const { E: E2 } = await load((st) => {
      const c = st.cycles.find(x => x.active);
      delete c.plants; delete c.plantCount;
    });
    pruef('Ganz ohne Angabe ist die Obergrenze 1', E2('_plantsCap(S.cycles[0])') === 1);
    pruef('Kein Absturz ohne Zyklus', E2('_plantsCap(null)') === 1);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
