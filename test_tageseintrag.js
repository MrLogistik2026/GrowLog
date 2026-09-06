/**
 * (v1.5.114) Der Tageseintrag: Sprungmarken oben, keine Notizfelder fuer geerntete Pflanzen.
 *
 * Gemessen am 06.09.2026 an Patricks echtem Tag 104 (Giesstag):
 * Der Eintrag ist 3486 px hoch bei 691 px Fensterhoehe - fuenf Bildschirmlaengen.
 * Das erste Eingabefeld (Wassermenge) lag bei 1144 px, Temperatur und Luftfeuchte
 * erst bei 2014 px. Oben stand die ganze Zeit "3/6 eingetragen - Wasser fehlt, RLF
 * fehlt", ohne dass man dorthin kam.
 *
 * Drei Aenderungen werden hier geprueft:
 *   A  Die Fortschrittszeile ist ein Wegweiser: sechs Knoepfe, die zum Feld springen.
 *   B  Geerntete Pflanzen bekommen kein Notizfeld mehr (Tag 104 zeigte fuenf, obwohl
 *      seit Tag 93 nur noch drei Pflanzen stehen). Der Schnitt-Tag selbst bleibt drin.
 *   C  Die Verschiebungs-Historie ist zugeklappt statt an jedem Tag aufgeschlagen.
 *
 * Wichtig fuer den Test: jsdom kennt kein echtes Layout. Geprueft wird deshalb, WAS
 * die Sprungfunktion trifft (scrollIntoView auf welchem Element, Fokus auf welchem
 * Feld), nicht wie weit gescrollt wurde. Die Pixel-Messung lief im echten Browser.
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
      // scrollIntoView protokollieren statt ignorieren: das ist der eigentliche Effekt
      // der Sprungfunktion und in jsdom sonst nicht beobachtbar.
      w.__gesprungen = [];
      w.HTMLElement.prototype.scrollIntoView = function () {
        w.__gesprungen.push(this.id || this.className || this.tagName);
      };
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

  // Tag 104 = Giesstag, der dichteste Bildschirm im ganzen Zyklus.
  const setup = (anfaenger, tag) => E(`(function(){
    S.beginnerMode = ${anfaenger};
    var c = S.cycles[0];
    openEntry(isoPlus(c.startDate, ${tag - 1}));
    return isoPlus(c.startDate, ${tag - 1});
  })()`);

  console.log('');
  console.log('A - Die Fortschrittszeile ist ein Wegweiser, kein Schild');
  {
    setup(true, 104);
    const chips = JSON.parse(E(`(function(){
      var b = document.getElementById('entry-body');
      var l = [].slice.call(b.querySelectorAll('button[onclick*="jumpToEntryField"]'));
      return JSON.stringify(l.map(function(x){
        return { text: x.textContent.trim(), ziel: (x.getAttribute('onclick').match(/,'(\\w+)'\\)/)||[])[1] };
      }));
    })()`));
    pruef('Es gibt sechs Sprung-Knoepfe', chips.length === 6, 'gefunden=' + chips.length);
    ['water', 'ph', 'temp', 'rh', 'note', 'photo'].forEach(z => {
      pruef(`Ziel "${z}" ist dabei`, chips.some(ch => ch.ziel === z), JSON.stringify(chips.map(c => c.ziel)));
    });

    // Jeder Sprung muss ein ANDERES Element treffen - sonst zeigt die Zeile zwar
    // sechs Knoepfe, landet aber immer an derselben Stelle.
    const treffer = JSON.parse(E(`(function(){
      var c = S.cycles[0]; var out = {};
      ['water','ph','temp','rh','note','photo'].forEach(function(z){
        window.__gesprungen = [];
        jumpToEntryField(c.id, z);
        out[z] = window.__gesprungen[0] || null;
      });
      return JSON.stringify(out);
    })()`));
    pruef('Wasser trifft das Wasser-Feld', /^water-calc-/.test(treffer.water || ''), treffer.water);
    pruef('pH trifft das pH-Feld', /^ph-/.test(treffer.ph || ''), treffer.ph);
    pruef('Temp trifft das Temperatur-Feld', treffer.temp === 'et', treffer.temp);
    pruef('RLF trifft das Luftfeuchte-Feld', treffer.rh === 'er', treffer.rh);
    pruef('Notiz trifft das Notizfeld', /^note-/.test(treffer.note || ''), treffer.note);
    pruef('Foto trifft den Foto-Knopf', /photo-add|photo-grid/.test(treffer.photo || ''), treffer.photo);
    const eindeutig = new Set(Object.values(treffer).filter(Boolean));
    pruef('Sechs Knoepfe, sechs verschiedene Ziele', eindeutig.size === 6, [...eindeutig].join(' | '));
  }

  console.log('');
  console.log('A2 - Die Zeile erscheint auch am leeren Tag');
  {
    // Frueher blieb sie bei 0/6 weg. Seit sie zum Feld springt, ist genau der leere
    // Tag der Moment, in dem man sie braucht.
    const leer = E(`(function(){
      S.beginnerMode = true;
      var c = S.cycles[0];
      var iso = isoPlus(todayISO(), 3);           // Zukunftstag, garantiert unbeschrieben
      openEntry(iso);
      var b = document.getElementById('entry-body');
      return b.querySelectorAll('button[onclick*="jumpToEntryField"]').length + '|' +
             (/0\\/6 eingetragen/.test(b.textContent) ? 'null' : 'nicht null');
    })()`);
    pruef('Auch am leeren Tag stehen die sechs Knoepfe da', leer.split('|')[0] === '6', leer);
    pruef('Der Zaehler steht auf 0/6', leer.split('|')[1] === 'null', leer);
  }

  console.log('');
  console.log('A3 - Kein Wegweiser ins Leere');
  {
    // An einem Tag ohne Guss gibt es kein Wasser-Feld. Der Knopf darf dann nicht
    // stumm bleiben, sondern muss sagen warum.
    const ohne = E(`(function(){
      S.beginnerMode = true;
      var c = S.cycles[0];
      openEntry(isoPlus(c.startDate, 59));        // Tag 60, kein Giesstag
      var b = document.getElementById('entry-body');
      var hatWasser = !!(document.getElementById('water-calc-' + c.id) || b.querySelector('[id^="water-calc-"]'));
      window.__gesprungen = [];
      jumpToEntryField(c.id, 'water');
      return JSON.stringify({ hatWasser: hatWasser, sprung: window.__gesprungen.length });
    })()`);
    const o = JSON.parse(ohne);
    pruef('Ohne Wasser-Feld wird nicht gesprungen',
      o.hatWasser ? o.sprung === 1 : o.sprung === 0, ohne);
  }

  console.log('');
  console.log('B - Geerntete Pflanzen bekommen kein Notizfeld mehr');
  {
    // Patricks Daten: Pflanze 5 am 16.08. geerntet (Tag 93), Pflanze 4 am 27.08. (Tag 104).
    const zaehl = (tag) => JSON.parse(E(`(function(){
      S.beginnerMode = false;
      var c = S.cycles[0];
      var iso = isoPlus(c.startDate, ${tag - 1});
      openEntry(iso);
      var box = document.getElementById('plant-notes-' + c.id + '-' + iso);
      return JSON.stringify({
        felder: box ? box.querySelectorAll('textarea').length : 0,
        effektiv: getEffectivePlantCount(c, iso),
        angelegt: (c.plants||[]).length
      });
    })()`));

    const t50 = zaehl(50), t93 = zaehl(93), t94 = zaehl(94), t104 = zaehl(104), t113 = zaehl(113);
    pruef('Tag 50: alle fuenf Pflanzen stehen noch', t50.felder === 5, JSON.stringify(t50));
    pruef('Tag 93 (Schnitt-Tag Pflanze 5): sie ist noch dabei', t93.felder === 5, JSON.stringify(t93));
    pruef('Tag 94 (Tag danach): sie ist weg', t94.felder === 4, JSON.stringify(t94));
    pruef('Tag 104 (Schnitt-Tag Pflanze 4): vier statt frueher fuenf',
      t104.felder === 4, JSON.stringify(t104));
    pruef('Tag 113: nur noch die drei stehenden', t113.felder === 3, JSON.stringify(t113));
    pruef('Tag 113 deckt sich mit getEffectivePlantCount',
      t113.felder === t113.effektiv, JSON.stringify(t113));
    pruef('Das Pflanzen-Array wurde nicht angefasst', t113.angelegt === 5, JSON.stringify(t113));

    // Kein Datenverlust: wer fuer eine geerntete Pflanze schon etwas geschrieben hat,
    // muss es weiter sehen koennen.
    const mitNotiz = E(`(function(){
      var c = S.cycles[0];
      var iso = isoPlus(c.startDate, 112);        // Tag 113
      var letzte = c.plants[c.plants.length - 1]; // Pflanze 5, laengst geerntet
      S.entries[iso] = S.entries[iso] || {};
      S.entries[iso].cycleData = S.entries[iso].cycleData || {};
      S.entries[iso].cycleData[c.id] = S.entries[iso].cycleData[c.id] || {};
      S.entries[iso].cycleData[c.id].plantNotes = { [letzte.id]: 'Nachtrag zum Trocknen' };
      openEntry(iso);
      var box = document.getElementById('plant-notes-' + c.id + '-' + iso);
      var n = box ? box.querySelectorAll('textarea').length : 0;
      var sichtbar = box ? /Nachtrag zum Trocknen/.test(box.textContent) : false;
      delete S.entries[iso].cycleData[c.id].plantNotes;
      return n + '|' + sichtbar;
    })()`);
    pruef('Eine vorhandene Notiz haelt das Feld sichtbar',
      mitNotiz === '4|true', 'ergebnis=' + mitNotiz);
  }

  console.log('');
  console.log('C - Die Verschiebungs-Historie liegt zugeklappt');
  {
    const hist = JSON.parse(E(`(function(){
      S.beginnerMode = true;
      var c = S.cycles[0];
      openEntry(isoPlus(c.startDate, 103));
      var liste = document.getElementById('offset-list-' + c.id);
      var pfeil = document.getElementById('offset-arrow-' + c.id);
      return JSON.stringify({
        anzahl: (c.offsetHistory||[]).length,
        da: !!liste,
        display: liste ? liste.style.display : null,
        pfeil: pfeil ? pfeil.textContent : null,
        kopfSichtbar: pfeil ? /Verschiebung/.test(pfeil.parentElement.textContent) : false
      });
    })()`));
    pruef('Patricks Zyklus hat Verschiebungen', hist.anzahl === 5, JSON.stringify(hist));
    pruef('Die Liste ist zugeklappt', hist.display === 'none', JSON.stringify(hist));
    pruef('Der Pfeil zeigt "zu" an', hist.pfeil === '▾', JSON.stringify(hist));
    pruef('Die Kopfzeile bleibt sichtbar', hist.kopfSichtbar === true, JSON.stringify(hist));

    const auf = E(`(function(){
      var c = S.cycles[0];
      toggleOffsetList(c.id);
      var liste = document.getElementById('offset-list-' + c.id);
      var pfeil = document.getElementById('offset-arrow-' + c.id);
      return liste.style.display + '|' + pfeil.textContent + '|' +
             liste.querySelectorAll('button').length;
    })()`);
    pruef('Ein Tipp oeffnet sie wieder', auf.split('|')[0] === 'block', auf);
    pruef('Danach zeigt der Pfeil "offen"', auf.split('|')[1] === '▴', auf);
    pruef('Alle fuenf Zuruecknehmen-Knoepfe sind drin', auf.split('|')[2] === '5', auf);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
