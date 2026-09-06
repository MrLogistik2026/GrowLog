/**
 * (v1.5.115/116/117) Die Wege zwischen den Bildschirmen.
 *
 * Befund vom 06.09.2026: Fuenf Funktionen bauten `goTo` von Hand nach - `openDuenger`,
 * `openLexikon`, `openLexikonEntry`, `openHowto`, `openGallery`. Sie schalteten den
 * Bildschirm selbst um und liessen dabei alles weg, was `goTo` sonst erledigt.
 *
 * Drei messbare Folgen, alle im Browser reproduziert:
 *
 *   A  Der Lichtsensor (AmbientLightSensor, 2 Hz) wird nur in `goTo` gestoppt. Wer auf
 *      dem Tipps-Bildschirm eine Lichtmessung startet und dann auf "Lexikon" tippt - um
 *      nachzulesen, was DLI heisst -, laesst ihn weiterlaufen. Der Knopf sagt weiterhin
 *      "Stoppen", auf einem Bildschirm, den man verlassen hat.
 *   B  Die Variable `tab` blieb stehen. Die App hielt sich fuer woanders, als sie war.
 *   C  `goTo('lexikon')` zeigte einen LEEREN Bildschirm - genau die Falle, die vor
 *      v1.5.106 schon einmal bei `duenger` zugeschnappt ist.
 *
 * Dazu zwei Einzelbefunde:
 *   D  Ein angesteuerter Lexikon-Eintrag wird aufgeklappt (1000-1600 px hoch) und dann
 *      mit `block:'center'` zentriert - die Ueberschrift landet ~500 px ueber dem Rand.
 *   E  Der leere Zustand der Galerie war eine Sackgasse ohne Weg nach vorn.
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
      // scrollIntoView protokollieren - in jsdom sonst nicht beobachtbar.
      w.__scrollZiele = [];
      w.HTMLElement.prototype.scrollIntoView = function (opt) {
        w.__scrollZiele.push({ id: this.id || this.className, block: opt && opt.block });
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

  console.log('');
  console.log('A - Der Lichtsensor wird auf jedem Weg gestoppt');
  {
    // Attrappe statt echtem Sensor: jsdom kennt AmbientLightSensor nicht.
    const lauf = (oeffner) => E(`(function(){
      goTo('tips');
      var auf = true;
      _ppfdSensor = { stop: function(){ auf = false; } };
      ${oeffner};
      return JSON.stringify({ laeuftNoch: auf, tab: tab });
    })()`);
    [['goTo (Vergleich)', "goTo('dash')"],
     ['openLexikon', 'openLexikon()'],
     ['openHowto', 'openHowto()'],
     ['openGallery', 'openGallery()'],
     ['openDuenger', 'openDuenger()'],
     ['openLexikonEntry', "openLexikonEntry('IceFlush')"]].forEach(([name, code]) => {
      const r = JSON.parse(lauf(code));
      pruef(`${name} stoppt den Sensor`, r.laeuftNoch === false, JSON.stringify(r));
    });
    E('_ppfdSensor = null');
  }

  console.log('');
  console.log('B - Die App weiss, wo sie ist (tab wird mitgefuehrt)');
  {
    [['openLexikon()', 'lexikon'], ['openHowto()', 'howto'], ['openGallery()', 'gallery'],
     ['openDuenger()', 'duenger'], ["openLexikonEntry('IceFlush')", 'lexikon']].forEach(([code, erwartet]) => {
      const t = E(`(function(){ goTo('dash'); ${code}; return tab; })()`);
      pruef(`${code} setzt tab auf "${erwartet}"`, t === erwartet, 'tab=' + t);
    });
  }

  console.log('');
  console.log('C - goTo fuellt jeden Bildschirm, auch ohne Umweg ueber die Oeffner');
  {
    // Die Falle von v1.5.106: sichtbar geschaltet, nie gefuellt.
    const laenge = (z) => E(`(function(){
      goTo('${z}');
      return document.getElementById('scr-${z}').textContent.replace(/\\s+/g,' ').trim().length;
    })()`);
    pruef('Lexikon ist gefuellt', laenge('lexikon') > 50000, 'zeichen=' + laenge('lexikon'));
    pruef('Anleitung ist gefuellt', laenge('howto') > 3000, 'zeichen=' + laenge('howto'));
    pruef('Duengeplan ist gefuellt', laenge('duenger') > 500, 'zeichen=' + laenge('duenger'));
    // Die Galerie ist bei Patrick leer - geprueft wird, dass der Leer-Zustand DA ist.
    pruef('Galerie zeigt ihren Leer-Zustand', /Noch keine Fotos/.test(
      E(`(function(){ goTo('gallery'); return document.getElementById('scr-gallery').textContent; })()`)));
  }

  console.log('');
  console.log('D - Der Sprung landet am Anfang des Eintrags, nicht in seiner Mitte');
  {
    const sprung = JSON.parse(E(`(function(){
      window.__scrollZiele = [];
      goTo('dash');
      openLexikonEntry('IceFlush');
      return JSON.stringify({ sofort: window.__scrollZiele.slice() });
    })()`));
    pruef('Beim Aufruf wird noch nicht gesprungen (150 ms Verzoegerung)',
      sprung.sofort.length === 0, JSON.stringify(sprung.sofort));

    await new Promise((r) => setTimeout(r, 400));
    const ziele = JSON.parse(E('JSON.stringify(window.__scrollZiele)'));
    const treffer = ziele.find(z => /^lex-/.test(String(z.id)));
    pruef('Es wird zum Eintrag gesprungen', !!treffer, JSON.stringify(ziele));
    pruef('Und zwar an seinen ANFANG (block:start)',
      treffer && treffer.block === 'start', treffer ? 'block=' + treffer.block : '-');
  }

  console.log('');
  console.log('D2 - Der einfache Weg ins Lexikon beginnt oben');
  {
    // Ohne Titel darf `goTo` nach oben scrollen; MIT Titel nicht, sonst macht es den
    // Sprung zum Eintrag wieder zunichte.
    const r = JSON.parse(E(`(function(){
      goTo('lexikon');
      var sc = document.querySelector('#scr-lexikon .scroll');
      if (!sc) return JSON.stringify({ kein: true });
      sc.scrollTop = 900;
      goTo('tips');
      openLexikon();
      var nachEinfach = sc.scrollTop;
      sc.scrollTop = 900;
      goTo('tips');
      openLexikonEntry('IceFlush');
      var nachTitel = sc.scrollTop;
      return JSON.stringify({ nachEinfach: nachEinfach, nachTitel: nachTitel });
    })()`));
    pruef('Ohne Titel: oben angefangen', r.nachEinfach === 0, JSON.stringify(r));
    pruef('Mit Titel: nicht nach oben zurueckgerissen', r.nachTitel === 900, JSON.stringify(r));
  }

  console.log('');
  console.log('E - Der leere Zustand der Galerie zeigt einen Weg nach vorn');
  {
    const g = JSON.parse(E(`(function(){
      goTo('gallery');
      var el = document.getElementById('gallery-body');
      var t = el.textContent.replace(/\\s+/g,' ').trim();
      return JSON.stringify({
        text: t,
        knoepfe: [].slice.call(el.querySelectorAll('button')).map(function(b){ return b.textContent.trim(); }),
        hatZyklen: (S.cycles||[]).length
      });
    })()`));
    pruef('Er sagt, wo Fotos herkommen', /Tageseintrag/.test(g.text), g.text.slice(0, 90));
    pruef('Er bietet den Weg dorthin an',
      g.knoepfe.some(k => /Eintrag/.test(k)), JSON.stringify(g.knoepfe));
    pruef('Der alte Satz steht weiter da', /Noch keine Fotos/.test(g.text));

    // Ohne Zyklus darf kein Knopf erscheinen, der ins Leere fuehrt.
    const ohne = JSON.parse(E(`(function(){
      var sicherung = S.cycles;
      S.cycles = [];
      goTo('gallery');
      var el = document.getElementById('gallery-body');
      var n = el.querySelectorAll('button').length;
      var t = el.textContent.replace(/\\s+/g,' ').trim();
      S.cycles = sicherung;
      goTo('dash');
      return JSON.stringify({ knoepfe: n, erklaert: /Tageseintrag/.test(t) });
    })()`));
    pruef('Ohne Zyklus kein Knopf ins Leere', ohne.knoepfe === 0, JSON.stringify(ohne));
    pruef('Die Erklaerung bleibt trotzdem stehen', ohne.erklaert === true, JSON.stringify(ohne));
  }

  console.log('');
  console.log('F - Nichts kaputtgemacht: die Oeffner tun weiter, was sie taten');
  {
    const d = E(`(function(){
      goTo('dash');
      openDuenger();
      return document.getElementById('scr-duenger').classList.contains('active') + '|' +
             (typeof S.products !== 'undefined');
    })()`);
    pruef('openDuenger zeigt den Duengeplan und synct die Globalen', d === 'true|true', d);

    const zurueck = E(`(function(){
      goTo('gussplan');
      return document.getElementById('scr-gussplan').classList.contains('active');
    })()`);
    pruef('Der Gieß-Fahrplan ist weiter erreichbar', zurueck === true, String(zurueck));
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
