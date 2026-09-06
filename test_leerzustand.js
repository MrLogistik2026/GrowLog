/**
 * (v1.5.119-122) Der leere Zustand ist der ERSTE Zustand.
 *
 * Patricks Auftrag vom 06.09.2026: die uebrigen leeren Zustaende mit durchsehen. Geprueft
 * wurde im Browser mit geleertem Speicher - also genau das, was ein neuer Nutzer sieht.
 * Vier Befunde:
 *
 *   A  Der Giess-Fahrplan zeigte ohne Zyklus nur "Kein Zyklus aktiv." auf schwarzer
 *      Flaeche. Erreichbar ohne Umweg: Die Einstellungen laden mit der Zeile
 *      "Giess-Fahrplan - Wann duengen, wann nur waessern" ausdruecklich zum Antippen ein.
 *   B  Der Tageseintrag zeigte ohne Zyklus den Einsteiger-Banner "Die App funktioniert auch
 *      mit nur dem Wasser-Feld" ueber NULL Feldern - und ZWEI Speichern-Knoepfe, die beide
 *      stumm nichts taten. Schlimmer: Das Wegklicken des Banners setzt `_entryHelpSeen`
 *      dauerhaft, der Hinweis war danach beim ersten echten Eintrag weg.
 *   C  Der Kalender zeigte ein leeres Raster ohne Erklaerung, darunter aber "lange druecken
 *      fuer Giesstag verschieben" - ein Versprechen, das ohne Zyklus nichts tun kann.
 *   D  (in test_gussplan.js, Abschnitt G) Die Karte "Naechster Guss" las nur die
 *      Bluete-Guesse und sagte an Tag 1 "in 23 Tagen", waehrend das Dashboard
 *      "Heute: Saettigungsguss" meldete.
 *
 * Dieser Test laeuft OHNE Patricks Sicherung - der leere Speicher ist der Pruefgegenstand.
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
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true;
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
      // KEIN localStorage-Vorbefuellen: leerer Speicher ist der Pruefgegenstand.
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
  pruef('Start ohne JS-Fehler (leerer Speicher)', errors.length === 0, errors[0]);

  // Willkommen und Haftungsausschluss ueberspringen - geprueft wird die App dahinter.
  E(`S._welcomeSeen = true; S._disclaimerAcceptedAt = Date.now(); S.beginnerMode = true; saveS();`);
  pruef('Wirklich kein Zyklus vorhanden', E('(S.cycles||[]).length') === 0);

  console.log('');
  console.log('A - Der Gieß-Fahrplan ohne Zyklus zeigt einen Weg');
  {
    const g = JSON.parse(E(`(function(){
      goTo('gussplan');
      var el = document.getElementById('scr-gussplan');
      var t = el.textContent.replace(/\\s+/g,' ').trim();
      return JSON.stringify({
        text: t,
        knoepfe: [].slice.call(el.querySelectorAll('button')).map(function(b){ return b.textContent.trim(); }),
      });
    })()`));
    pruef('Er sagt, was fehlt', /Noch kein Zyklus/.test(g.text), g.text.slice(0, 100));
    pruef('Er erklaert, wozu der Bildschirm da ist',
      /rechnet aus deinem Zyklus/.test(g.text), g.text.slice(0, 140));
    pruef('Er bietet "Zyklus anlegen" an',
      g.knoepfe.some(k => /Zyklus jetzt anlegen/.test(k)), JSON.stringify(g.knoepfe));
    pruef('Er bietet den Demo-Zyklus an',
      g.knoepfe.some(k => /Demo/.test(k)), JSON.stringify(g.knoepfe));
    pruef('Der alte nackte Satz ist weg', !/^.{0,40}Kein Zyklus aktiv\.$/.test(g.text), g.text.slice(0, 60));
  }

  console.log('');
  console.log('B - Der Tageseintrag ohne Zyklus verspricht nichts und speichert nichts');
  {
    const e = JSON.parse(E(`(function(){
      openEntry(todayISO());
      var el = document.getElementById('scr-entry');
      var pille = document.querySelector('#scr-entry .save-pill');
      return JSON.stringify({
        felder: el.querySelectorAll('input,select,textarea').length,
        grosserSpeichern: el.querySelectorAll('.big-save').length,
        pilleVersteckt: pille ? pille.style.display === 'none' : null,
        bannerDa: /Keine Panik/.test(el.textContent),
        hilfeSchonVerbraucht: !!S._entryHelpSeen,
        wegVorwaerts: [].slice.call(el.querySelectorAll('button'))
          .map(function(b){ return b.textContent.trim(); })
          .filter(function(x){ return /Zyklus/.test(x); }),
      });
    })()`));
    pruef('Es gibt wirklich kein Feld', e.felder === 0, 'felder=' + e.felder);
    pruef('Kein Einsteiger-Banner ueber leerer Flaeche', e.bannerDa === false, JSON.stringify(e));
    pruef('Der einmalige Hinweis ist NICHT verbraucht', e.hilfeSchonVerbraucht === false, JSON.stringify(e));
    pruef('Kein grosser Speichern-Knopf', e.grosserSpeichern === 0, 'anzahl=' + e.grosserSpeichern);
    pruef('Die Speichern-Pille ist ausgeblendet', e.pilleVersteckt === true, JSON.stringify(e));
    pruef('Stattdessen fuehrt "Zyklus erstellen" weiter',
      e.wegVorwaerts.length > 0, JSON.stringify(e.wegVorwaerts));
  }

  console.log('');
  console.log('C - Der Kalender ohne Zyklus erklaert sich und verspricht nichts Falsches');
  {
    const k = JSON.parse(E(`(function(){
      goTo('cal');
      var el = document.getElementById('scr-cal');
      var t = el.textContent.replace(/\\s+/g,' ').trim();
      return JSON.stringify({
        text: t,
        verschiebenVersprochen: /lange drücken für Gießtag/.test(t),
        knoepfe: [].slice.call(el.querySelectorAll('button')).map(function(b){ return b.textContent.trim(); }),
      });
    })()`));
    pruef('Er sagt, dass noch kein Zyklus da ist', /Noch kein Zyklus/.test(k.text), k.text.slice(0, 110));
    pruef('Er sagt, was dann hier stehen wird',
      /Gieß-, Dünge- und Ernte-Tage/.test(k.text), k.text.slice(0, 190));
    pruef('Kein Versprechen auf "Gießtag verschieben"',
      k.verschiebenVersprochen === false, k.text.slice(0, 190));
    pruef('Ein Knopf fuehrt zum Zyklus',
      k.knoepfe.some(x => /Zyklus jetzt anlegen/.test(x)), JSON.stringify(k.knoepfe.slice(0, 6)));
    pruef('Das Monatsraster bleibt trotzdem da',
      /MoDiMiDoFrSaSo/.test(k.text.replace(/\s+/g, '')), k.text.slice(0, 120));
  }

  console.log('');
  console.log('D - Mit Zyklus ist alles wieder wie zuvor');
  {
    const m = JSON.parse(E(`(function(){
      welcomeStartDemo();
      return JSON.stringify({ zyklen: (S.cycles||[]).length });
    })()`));
    pruef('Der Demo-Zyklus laesst sich anlegen', m.zyklen === 1, JSON.stringify(m));

    const n = JSON.parse(E(`(function(){
      S.beginnerMode = true; S._entryHelpSeen = false;
      openEntry(todayISO());
      var el = document.getElementById('scr-entry');
      var pille = document.querySelector('#scr-entry .save-pill');
      return JSON.stringify({
        bannerDa: /Keine Panik/.test(el.textContent),
        grosserSpeichern: el.querySelectorAll('.big-save').length,
        pilleSichtbar: pille ? pille.style.display !== 'none' : null,
        felder: el.querySelectorAll('input,select,textarea').length,
      });
    })()`));
    pruef('Der Einsteiger-Banner ist jetzt da', n.bannerDa === true, JSON.stringify(n));
    pruef('Der grosse Speichern-Knopf ist zurueck', n.grosserSpeichern === 1, JSON.stringify(n));
    pruef('Die Speichern-Pille ist wieder sichtbar', n.pilleSichtbar === true, JSON.stringify(n));
    pruef('Und es gibt Felder zum Ausfuellen', n.felder > 0, JSON.stringify(n));

    const cal = E(`(function(){
      goTo('cal');
      var t = document.getElementById('scr-cal').textContent;
      return (/lange drücken für Gießtag/.test(t) ? 'ja' : 'nein') + '|' +
             (/Noch kein Zyklus/.test(t) ? 'leerText' : 'kein leerText');
    })()`);
    pruef('Kalender: der Verschieben-Hinweis ist zurueck', cal.split('|')[0] === 'ja', cal);
    pruef('Kalender: der Leer-Hinweis ist weg', cal.split('|')[1] === 'kein leerText', cal);

    const gp = E(`(function(){
      goTo('gussplan');
      var t = document.getElementById('scr-gussplan').textContent;
      return (/Noch kein Zyklus/.test(t) ? 'leer' : 'gefuellt') + '|' +
             (/Nächster Guss/.test(t) ? 'karte' : 'keine Karte');
    })()`);
    pruef('Gieß-Fahrplan: wieder gefuellt', gp.split('|')[0] === 'gefuellt', gp);
    pruef('Gieß-Fahrplan: die Karte steht da', gp.split('|')[1] === 'karte', gp);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
