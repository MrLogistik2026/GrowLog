/**
 * (v1.5.113) Der Giess-Fahrplan ist nach Haeufigkeit geordnet.
 *
 * Patricks Meldung vom 06.09.2026: "Der sieht mir zu unuebersichtlich und unhandlich aus.
 * Damit kann niemand so richtig arbeiten, der nicht viel rumversuchen will."
 *
 * Gemessen war er in beiden Modi zeichengleich: 4472 Zeichen, 21 Knoepfe, 9 Eingabefelder.
 * Der Einsteiger-Modus wirkte dort ueberhaupt nicht.
 *
 * Der Bildschirm beantwortete vier Fragen gleichzeitig und in der falschen Reihenfolge: ganz
 * oben die Endspurt-Kette mit acht Plus/Minus-Knoepfen - eine Terminfrage, die man ein- oder
 * zweimal im Zyklus stellt -, darunter erst "was giesse ich als Naechstes", die Frage, fuer
 * die man den Bildschirm taeglich oeffnet.
 *
 * Neu ist die Reihenfolge nach Haeufigkeit. Im Einsteiger-Modus liegt die Endspurt-Kette
 * zusaetzlich hinter einem Aufklapper, und die Rhythmus-/Mengen-Einstellungen entfallen dort:
 * Seit v1.5.112 fuehrt die App die Menge am gemessenen Ablauf selbst nach - wer sie von Hand
 * einstellt, schaltet genau diese Selbstkorrektur ab.
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

const mess = (E, anfaenger) => JSON.parse(E(`(function(){
  S.beginnerMode = ${anfaenger};
  goTo('gussplan');
  const el = document.getElementById('scr-gussplan');
  const t = el.textContent.replace(/\\s+/g,' ').trim();
  return JSON.stringify({
    zeichen: t.length,
    knoepfe: el.querySelectorAll('button').length,
    felder: el.querySelectorAll('input,select,textarea').length,
    text: t,
  });
})()`));

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const anf = mess(E, true);
  const pro = mess(E, false);

  console.log('');
  console.log('A - Der Einsteiger-Modus wirkt jetzt');
  {
    pruef('Er zeigt weniger als der Profi-Modus', anf.zeichen < pro.zeichen,
      `Einsteiger=${anf.zeichen} Profi=${pro.zeichen}`);
    pruef('Deutlich weniger, nicht nur ein bisschen', anf.zeichen < pro.zeichen * 0.8,
      `${anf.zeichen} gegen ${pro.zeichen}`);
    pruef('Weniger Knoepfe', anf.knoepfe < pro.knoepfe, `${anf.knoepfe} gegen ${pro.knoepfe}`);
    pruef('Gar keine Eingabefelder mehr', anf.felder === 0, 'felder=' + anf.felder);
  }

  console.log('');
  console.log('B - Die taegliche Frage steht zuerst');
  {
    [['Einsteiger', anf], ['Profi', pro]].forEach(([name, m]) => {
      const iNaechster = m.text.indexOf('Nächster Guss');
      const iListe = m.text.indexOf('Güsse');
      pruef(`${name}: "Nächster Guss" kommt vor der Liste`,
        iNaechster >= 0 && iNaechster < iListe, `naechster=${iNaechster} liste=${iListe}`);
    });
    pruef('Profi: der naechste Guss steht vor der Endspurt-Kette',
      pro.text.indexOf('Nächster Guss') < pro.text.indexOf('Letzter Guss'),
      `naechster=${pro.text.indexOf('Nächster Guss')} endspurt=${pro.text.indexOf('Letzter Guss')}`);
    pruef('Die Menge steht beim naechsten Guss', /etwa \d+ ml/.test(anf.text));
  }

  console.log('');
  console.log('C - Einsteiger: Termine hinter einem Aufklapper, keine Regler');
  {
    pruef('Es gibt den Aufklapper "Termine bis zur Ernte"',
      /Termine bis zur Ernte/.test(anf.text));
    // `textContent` liest auch den Inhalt zugeklappter <details>. Gepruft wird deshalb der
    // Zustand des Aufklappers, nicht ob der Text irgendwo im DOM steht.
    const zu = E(`(function(){
      S.beginnerMode = true; goTo('gussplan');
      const d = [...document.querySelectorAll('#scr-gussplan details')]
        .find(x => /Termine bis zur Ernte/.test(x.textContent));
      return d ? (d.open ? 'offen' : 'zu') : 'kein Aufklapper';
    })()`);
    pruef('Die Kette ist eingeklappt, nicht ausgebreitet', zu === 'zu', 'Zustand: ' + zu);
    pruef('Keine Rhythmus- und Mengen-Einstellungen',
      !/Rhythmus & Mengen einstellen/.test(anf.text));
    pruef('Der Listen-Text ist kurz gefasst',
      /Deine nächsten Güsse/.test(anf.text));
    pruef('Der lange Erklaertext fehlt',
      !/Gesperrte Tage/.test(anf.text));
  }

  console.log('');
  console.log('D - Profi: nichts weggenommen');
  {
    pruef('Die Endspurt-Kette steht offen da', /Letzter Guss/.test(pro.text));
    pruef('Hard-Dryback ist sichtbar', /Hard-\s?Dryback/.test(pro.text));
    pruef('Rhythmus und Mengen sind erreichbar', /Rhythmus & Mengen einstellen/.test(pro.text));
    pruef('Der ausfuehrliche Listen-Text bleibt', /Gesperrte Tage/.test(pro.text));
    pruef('Alle Eingabefelder sind noch da', pro.felder === 9, 'felder=' + pro.felder);
    pruef('Alle Knoepfe sind noch da', pro.knoepfe === 21, 'knoepfe=' + pro.knoepfe);
  }

  console.log('');
  console.log('E - Der Inhalt bleibt in beiden Modi vollstaendig');
  {
    [['Einsteiger', anf], ['Profi', pro]].forEach(([name, m]) => {
      pruef(`${name}: die Gussliste ist da`, /Tag 11\d/.test(m.text));
      pruef(`${name}: der Hinweis nach dem Iceflush steht drin`,
        /Nach dem Iceflush/.test(m.text));
    });
  }

  console.log('');
  console.log('F - (v1.5.118) Die Karte bleibt, auch wenn kein Guss mehr ansteht');
  {
    // Gefunden am 06.09.2026, weil derselbe Test in Kiritimati fehlschlug: Dort war schon
    // Tag 115, und damit lag KEIN geplanter Guss mehr in der Zukunft. `_naechster` wurde
    // null und die Karte zu einem leeren String - der Fahrplan oeffnete mit der Liste der
    // 30 vergangenen Guesse, ohne ein Wort dazu, was jetzt gilt. Ausgerechnet in den
    // letzten Tagen vor der Ernte, in denen man den Bildschirm am oeftesten aufmacht.
    //
    // Der Test setzt das Datum deshalb fest, statt sich auf die Systemzeit zu verlassen.
    const anTag = (tag) => JSON.parse(E(`(function(){
      var c = S.cycles[0];
      var echt = todayISO;
      todayISO = function(){ return isoPlus(c.startDate, ${tag - 1}); };
      try {
        S.beginnerMode = false;
        goTo('gussplan');
        var t = document.getElementById('scr-gussplan').textContent.replace(/\\s+/g,' ').trim();
        var b = document.getElementById('gussplan-body') || document.querySelector('#scr-gussplan .scroll');
        var erste = b.firstElementChild ? b.firstElementChild.textContent.replace(/\\s+/g,' ').trim() : '';
        return JSON.stringify({ hatKarte: /Nächster Guss/.test(t), obenSteht: erste.slice(0, 120), text: t.slice(0, 400) });
      } finally { todayISO = echt; }
    })()`));

    const t114 = anTag(114), t115 = anTag(115), t116 = anTag(116), t125 = anTag(125);
    pruef('Tag 114 (IceFlush): Karte da', t114.hatKarte, t114.obenSteht);
    pruef('Tag 115 (kein Guss mehr): Karte trotzdem da', t115.hatKarte, t115.obenSteht);
    pruef('Tag 115: sie nennt den Erntetag', /Ernte an Tag 116/.test(t115.text), t115.text.slice(0, 160));
    pruef('Tag 115: sie sagt, dass nicht mehr gegossen wird',
      /nicht mehr gegossen/.test(t115.text), t115.text.slice(0, 160));
    pruef('Tag 115: die Karte steht weiterhin ganz oben',
      /^Nächster Guss/.test(t115.obenSteht), t115.obenSteht);
    pruef('Tag 116 (Erntetag): Karte da', t116.hatKarte, t116.obenSteht);
    pruef('Tag 125 (Trocknen/Curing): Karte da', t125.hatKarte, t125.obenSteht);
    pruef('Tag 125: kein Erntedatum in der Zukunft behauptet',
      !/in \d+ Tagen\)/.test(t125.obenSteht), t125.obenSteht);
    pruef('Die Karte fuehrt weiter (kein toter Text)',
      /Antippen öffnet den heutigen Eintrag/.test(t115.text), t115.text.slice(0, 200));
  }

  console.log('');
  console.log('G - (v1.5.119) Die Karte zeigt den naechsten Guss ALLER Phasen, nicht nur der Bluete');
  {
    // Der schwerste Befund vom 06.09.2026. `steps` = collectBloomGusse() beginnt bei
    // `anzuchtDays + 1`. Die Karte las nur daraus - und sagte einem frisch angelegten
    // Zyklus an Tag 1 "Naechster Guss: in 23 Tagen", waehrend das Dashboard gleichzeitig
    // "Heute: Saettigungsguss (Tag 1), 700 ml" meldete. Wer dem Bildschirm glaubt, der
    // "Giess-Fahrplan" heisst, giesst seinen Saemling drei Wochen lang nicht.
    //
    // Geprueft wird gegen `isGiessTag` - die Funktion, die die App selbst als Wahrheit
    // benutzt (Saettigung, Anzucht-Guss, Guss, Spuelen, Ice zaehlen; Spruehen nicht).
    const anTag = (tag) => JSON.parse(E(`(function(){
      var c = S.cycles[0];
      var altStart = c.startDate, echt = todayISO;
      // Zyklus auf Tag ${tag} stellen, indem "heute" verschoben wird.
      todayISO = function(){ return isoPlus(c.startDate, ${tag - 1}); };
      try {
        S.beginnerMode = false;
        goTo('gussplan');
        var t = document.getElementById('scr-gussplan').textContent.replace(/\\s+/g,' ').trim();
        var m = t.match(/Nächster Guss · (heute|morgen|in \\d+ Tagen) Tag (\\d+)/);
        return JSON.stringify({
          wann: m ? m[1] : null,
          zielTag: m ? Number(m[2]) : null,
          heuteIstGuss: isGiessTag(todayISO(), c),
          aktion: getAction(todayISO(), c) || null,
          hinweisVorBluete: /Diese Liste beginnt mit der Blüte/.test(t),
          text: t.slice(0, 170)
        });
      } finally { todayISO = echt; c.startDate = altStart; }
    })()`));

    // Patricks Zyklus ist in der Endphase; fuer die Anzucht-Pruefung zaehlt die Logik,
    // nicht sein Stand. Geprueft wird deshalb ueber die ganze Spanne.
    const t1 = anTag(1);
    pruef('Tag 1: die Karte sagt "heute", nicht "in 23 Tagen"',
      t1.heuteIstGuss ? t1.wann === 'heute' : t1.wann !== null, JSON.stringify(t1));
    pruef('Tag 1: der genannte Tag ist der heutige',
      t1.heuteIstGuss ? t1.zielTag === 1 : true, JSON.stringify(t1));

    // Die eigentliche Regel: Ist heute laut isGiessTag ein Guss, MUSS die Karte "heute"
    // sagen. Ist es keiner, darf sie keinen Tag nennen, der vor dem naechsten echten liegt.
    let verletzt = [];
    for (const tag of [1, 2, 5, 8, 9, 12, 15, 18, 21, 24, 30, 45]) {
      const r = anTag(tag);
      if (r.wann === null) continue;
      if (r.heuteIstGuss && r.wann !== 'heute') verletzt.push(`Tag ${tag}: ist Gusstag (${r.aktion}), Karte sagt "${r.wann}"`);
      if (!r.heuteIstGuss && r.wann === 'heute') verletzt.push(`Tag ${tag}: kein Gusstag, Karte sagt "heute"`);
    }
    pruef('Karte und isGiessTag stimmen an allen 12 geprueften Tagen ueberein',
      verletzt.length === 0, verletzt.join(' | '));

    // Sprühen ist KEIN Guss - die Karte darf an Spruehtagen nicht "heute" sagen.
    const t2 = anTag(2);
    pruef('Tag 2 (Sprühtag): die Karte sagt NICHT "heute"',
      !(t2.aktion === 'sprueh' && t2.wann === 'heute'), JSON.stringify(t2));

    // Der Hinweis, dass die Liste erst mit der Bluete beginnt, erscheint nur solange
    // er stimmt.
    pruef('Vor der Bluete steht der Hinweis zur Liste da',
      anTag(2).hinweisVorBluete === true, JSON.stringify(anTag(2)));
    pruef('Ab dem ersten Bluete-Guss ist er wieder weg',
      anTag(30).hinweisVorBluete === false, JSON.stringify(anTag(30)));
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
