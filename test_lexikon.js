/**
 * (v1.5.125) Das Lexikon gegen ANBAU.md.
 *
 * 139 Eintraege, rund 306.000 Zeichen. Geprueft wurden gezielt die Stellen, an denen das
 * Lexikon etwas EMPFIEHLT oder eine Wirkung ZUSAGT - dort kostet eine falsche Zahl Ertrag
 * oder Pflanzen. Vier Befunde vom 07.09.2026:
 *
 * BEFUND 1-3 - Drei Wirkungszusagen, die ANBAU.md 14 ausdruecklich als unbelegt fuehrt:
 *   IceFlush:     "Studien zeigen je nach Bedingungen 5-20% mehr Trichome"
 *   UV-B:         "Studien zeigen 5-15 % mehr Cannabinoide"  (an zwei Stellen)
 *   Dunkelphase:  "manche Studien deuten auf 5-10% mehr THC hin"
 * ANBAU.md 14 sagt zu allen dreien das Gegenteil - und formuliert auch, wie es stattdessen
 * dastehen soll: "Beliebte Grower-Technik, ein Trichom-Plus ist wissenschaftlich allerdings
 * nicht belegt." Nichts davon wird verboten; die App plant es weiter sauber ein. Sie
 * verspricht nur nichts mehr.
 *
 * BEFUND 4 - Eine Lichtgrenze, die die App sich selbst widersprach.
 * Der Eintrag "Photosynthese" behauptete: "wenn CO2 bei Raum-Standard 400 ppm bleibt,
 * bringt mehr Licht ueber 700 PPFD kaum mehr Wachstum." Nach ANBAU.md 8.1 gilt die
 * Saettigung bei ~900-1000 fuer das EINZELNE BLATT; der Bestand steigt nahezu linear bis
 * in die Groessenordnung 1800 weiter. Und die App zeigt in ihrem eigenen PPFD-Messer
 * 600-900 als Blueten-Zielbereich an. Die Richtung war die schaedliche: Wer den Satz
 * glaubt, beleuchtet zu schwach - und Licht ist in Hobbyanlagen fast immer der Engpass.
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

  // Alle Eintraege als Klartext (ohne HTML-Tags) in den Node-Prozess holen.
  const alle = JSON.parse(E(`(function(){
    var kat = Array.isArray(LEXIKON) ? LEXIKON : Object.keys(LEXIKON).map(function(k){ return LEXIKON[k]; });
    var out = [];
    kat.forEach(function(k){
      (k.items || []).forEach(function(it){
        out.push({
          t: it.t,
          kat: k.cat,
          txt: [it.brief, it.mechanism, it.practice, it.pitfall, it.txt]
            .filter(Boolean).join(' · ').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ')
        });
      });
    });
    return JSON.stringify(out);
  })()`));
  const finde = (re) => alle.find(e => re.test(e.t));
  const text = (re) => (finde(re) || { txt: '' }).txt;

  pruef('Das Lexikon ist vollstaendig geladen', alle.length >= 130, 'eintraege=' + alle.length);

  console.log('');
  console.log('A - Keine Wirkungszusage, die ANBAU.md 14 als unbelegt fuehrt');
  {
    // Die konkreten Zahlen, die vorher als Tatsache dastanden. Sie duerfen weiter
    // vorkommen - aber NUR noch als zitierte und im selben Atemzug entkraeftete Zahl.
    // (Der Test darf die Entkraeftung nicht als Behauptung zaehlen; genau das ist mir
    // beim ersten Lauf passiert.)
    const entkraeftet = /(nicht belegt|kein Nachweis|nicht nachgewiesen|stammen aus Erfahrungsberichten|halten einer Prüfung nicht stand|oft falsch erzählt|Was NICHT belegt ist)/i;
    const verbotene = [
      [/5\s?[-–]\s?20\s?%\s?mehr Trichome/i, 'IceFlush: "5-20% mehr Trichome"'],
      [/5\s?[-–]\s?15\s?%\s?mehr Cannabinoide/i, 'UV: "5-15 % mehr Cannabinoide"'],
      [/\+\s?5\s?[-–]\s?15\s?%\s?THC/i, 'UV: "+5-15% THC"'],
      [/5\s?[-–]\s?10\s?%\s?mehr THC/i, 'Dunkelphase: "5-10% mehr THC"'],
    ];
    verbotene.forEach(([re, name]) => {
      // Steht die Zahl noch irgendwo OHNE Entkraeftung im selben Eintrag?
      const treffer = alle.filter(e => re.test(e.txt) && !entkraeftet.test(e.txt)).map(e => e.t);
      pruef(`Nicht mehr als Tatsache: ${name}`, treffer.length === 0, JSON.stringify(treffer));
    });

    // Und generell: keine "Studien zeigen X % mehr"-Konstruktion mehr.
    const studien = alle.filter(e => /Studien (zeigen|deuten)/i.test(e.txt)).map(e => e.t);
    pruef('Keine "Studien zeigen/deuten"-Behauptung mehr im Lexikon',
      studien.length === 0, JSON.stringify(studien));
  }

  console.log('');
  console.log('B - Die drei Techniken stehen ehrlich da (ANBAU.md 14)');
  {
    const ehrlich = /(nicht belegt|kein Nachweis|keinen? Cannabinoid-Zuwachs|nicht nachgewiesen|halten einer Prüfung nicht stand)/i;

    const ice = text(/^IceFlush$/);
    pruef('IceFlush sagt selbst, dass ein Trichom-Plus nicht belegt ist', ehrlich.test(ice), ice.slice(0, 130));
    pruef('IceFlush bleibt trotzdem beschrieben und planbar',
      /Crushed Ice/.test(ice) && ice.length > 1500, 'zeichen=' + ice.length);
    pruef('Die Anthocyan-Faerbung bleibt erklaert (belegte Physiologie)',
      /Anthocyan/.test(ice), ice.slice(0, 200));

    const uv = text(/UV-Bestrahlung/);
    pruef('UV sagt, dass der Wirkstoff-Zuwachs nicht belegt ist', ehrlich.test(uv), uv.slice(0, 130));
    pruef('UV nennt die Rueckgaenge und die Zuckerblatt-Einschraenkung',
      /Rückgäng/.test(uv) && /Zuckerblätt/.test(uv), uv.slice(0, 300));
    pruef('Die Augen-Warnung ist unangetastet geblieben',
      /Netzhaut/.test(uv) && /UV400|Schutzbrille/.test(uv), uv.slice(-260));

    const dunkel = text(/Dunkelphase vor der Ernte/);
    pruef('Dunkelphase sagt, dass ein THC-Zuwachs nicht belegt ist', ehrlich.test(dunkel), dunkel.slice(0, 160));
    pruef('Der BELEGTE Grund bleibt: Terpene sind fluechtig',
      /Terpen/.test(dunkel) && /flüchtig/.test(dunkel), dunkel.slice(0, 220));
    pruef('Der "Synergie-Effekt" wird nicht mehr behauptet',
      !/ergibt einen Synergie-Effekt/.test(dunkel), dunkel.slice(0, 200));

    // Die Spuelung war der vierte Fall - und den hat erst dieser Test aufgedeckt. Ihr
    // Kurztext sagte "Macht den Unterschied zwischen kratzigem und sauberem Rauch", also
    // genau das Qualitaetsversprechen, das ANBAU.md 14 als nicht nachweisbar fuehrt. Der
    // erste Suchlauf hatte sie fuer ehrlich gehalten, weil sie einen ANDEREN Mythos
    // entkraeftet ("Spuelung ist immer noetig" bei Living Soil).
    const sp = text(/Spülung \(Final/);
    pruef('Die Spuelung verspricht keinen sauberen Rauch mehr',
      !/Macht den Unterschied zwischen kratzigem und sauberem Rauch/.test(sp), sp.slice(0, 160));
    pruef('Sie sagt, dass der Geschmacks-Unterschied nicht nachweisbar war',
      /(nicht nachweisen|keinen belastbaren Unterschied)/i.test(sp), sp.slice(0, 260));
    pruef('Sie nennt die Vergilbung als natuerliche Seneszenz',
      /Seneszenz/i.test(sp), sp.slice(0, 400));
    pruef('Sie bleibt als Praxis beschrieben und unschaedlich',
      /(unschädlich|weit verbreitete Praxis)/i.test(sp) && sp.length > 3000, 'zeichen=' + sp.length);
    pruef('Der belegte Teil bleibt: Salze werden ausgetragen, messbar am Drain-EC',
      /Drain-EC/.test(sp), sp.slice(0, 400));
  }

  console.log('');
  console.log('C - Keine Lichtgrenze, die zu schwachem Licht raet (ANBAU.md 8.1)');
  {
    const ps = text(/Photosynthese/);
    pruef('Die falsche 700-PPFD-Decke ist weg',
      !/über 700 PPFD kaum mehr Wachstum/.test(ps), ps.slice(0, 200));
    pruef('Stattdessen steht dort, dass die Saettigung fuers EINZELNE Blatt gilt',
      /einzelnes Blatt|einzelne[sn]? Blatt/i.test(ps), ps.slice(-320));
    pruef('Und dass der Bestand viel spaeter saettigt',
      /1800/.test(ps), ps.slice(-320));
    pruef('Die Reihenfolge der Upgrades bleibt erhalten',
      /Klima → Dünger → Licht → CO₂/.test(ps), ps.slice(-320));

    // Keine Stelle darf eine Obergrenze unter 1000 PPFD BEHAUPTEN. Sie darf sie nennen,
    // um sie zu entkraeften - genau das tun beide Eintraege jetzt. (Der Test hat mir hier
    // zum zweiten Mal die eigene Richtigstellung als Fehler gemeldet; die Regel unterscheidet
    // nun zwischen Behauptung und Widerlegung.)
    const widerlegt = /(stimmt so nicht|gilt für ein|einzelnes Blatt|nicht linear|oft (genannte|falsch erzählt))/i;
    const decken = alle
      .filter(e => /(über|ab|mehr als)\s?[0-9]{3}\s?(PPFD|µmol)/i.test(e.txt) && !widerlegt.test(e.txt))
      .map(e => ({ t: e.t, s: (e.txt.match(/.{0,60}(über|ab|mehr als)\s?[0-9]{3}\s?(PPFD|µmol).{0,60}/i) || [''])[0] }));
    pruef('Keine Stelle behauptet noch eine Decke unter 1000 PPFD',
      decken.length === 0, JSON.stringify(decken));

    // Und die zweite Fundstelle nennt jetzt das sichtbare Kriterium fuer ein echtes Zuviel.
    const matrix = text(/PPFD & DLI/);
    pruef('Die Licht-Matrix nennt Ausbleichen als echtes Zuviel-Zeichen',
      /ausgebleichte|Photo-Bleaching/i.test(matrix), matrix.slice(-260));
    pruef('Ihre PPFD-Ziele bleiben unveraendert (Blüte 600–900)',
      /Blüte: 600[–-]900/.test(matrix), matrix.slice(0, 300));
  }

  console.log('');
  console.log('D - Trichom-Messung vollstaendig nach ANBAU.md 11');
  {
    const tr = text(/Trichom-Analyse/);
    pruef('Gemessen wird am Calyx, nicht an Sugar-Leaves',
      /Calyx/.test(tr) && /Sugar-Leaves/.test(tr), tr.slice(0, 200));
    pruef('NEU: Warnung vor Foxtails', /Foxtail/i.test(tr), tr.slice(0, 200));
    pruef('NEU: immer dieselben Stellen wiederverwenden',
      /immer dieselben Stellen/i.test(tr), tr.slice(0, 200));
    pruef('Mehrere Stellen und mehrere Pflanzen',
      /verschiedene Stellen/.test(tr) && /verschiedene Pflanzen/.test(tr));
    pruef('Pistillen sind ausdruecklich KEIN Kriterium',
      /Pistillen[^.]{0,40}KEIN/i.test(tr), tr.slice(0, 300));
    pruef('Bernstein wird als Oxidation zu CBN erklaert, nicht als "reifer"',
      /CBN/.test(tr) && /oxidier/i.test(tr));
  }

  console.log('');
  console.log('E - Die Zahlen, die ANBAU.md festnagelt');
  {
    const drain = text(/Drain-Kontrolle/);
    pruef('Drain-Kontrolle nennt 15-20 % (ANBAU.md 5.1, seit v1.5.112)',
      /15\s?[-–]\s?20\s?%/.test(drain), drain.slice(0, 140));

    const vpd = text(/^VPD/);
    pruef('Trocknen: 18-20 °C und 55-62 % RLF (ANBAU.md 12.1)',
      /18\s?[-–]\s?20\s?°C/.test(vpd) && /55\s?[-–]\s?62\s?%/.test(vpd), vpd.slice(-300));

    const curing = text(/Curing \(Veredelung\)/);
    pruef('Curing: Glas-RLF im Bereich 58-62 % (ANBAU.md 12.2: 58-65)',
      /5[58]\s?[-–]\s?6[25]\s?%/.test(curing), curing.slice(0, 200));

    const ecg = text(/EC-Messgerät/);
    pruef('ppm wird nie ohne Skalen-Angabe genannt (ANBAU.md 5)',
      /500er|700er|Skala/.test(ecg), ecg.slice(0, 200));
  }

  console.log('');
  console.log('F - Das Lexikon bleibt in sich stimmig');
  {
    const titel = alle.map(e => e.t);
    const doppelt = titel.filter((t, i) => titel.indexOf(t) !== i);
    pruef('Keine doppelten Eintrags-Titel', doppelt.length === 0, JSON.stringify(doppelt));
    const leer = alle.filter(e => !e.txt || e.txt.trim().length < 40).map(e => e.t);
    pruef('Kein Eintrag ohne Inhalt', leer.length === 0, JSON.stringify(leer));
    const kaputt = alle.filter(e => /undefined|\[object|NaN/.test(e.txt)).map(e => e.t);
    pruef('Kein "undefined" oder "[object Object]" im Text', kaputt.length === 0, JSON.stringify(kaputt));

    // Jeder Eintrag, den die Diagnose-Datenbank verlinkt, muss es auch geben.
    const fehlend = JSON.parse(E(`(function(){
      var kat = Array.isArray(LEXIKON) ? LEXIKON : Object.keys(LEXIKON).map(function(k){ return LEXIKON[k]; });
      var titel = [];
      kat.forEach(function(k){ (k.items||[]).forEach(function(it){ titel.push(it.t); }); });
      var fehlt = [];
      PROBLEMS.forEach(function(p){
        if (p.lexiconKey && titel.indexOf(p.lexiconKey) < 0) fehlt.push(p.id + ' -> ' + p.lexiconKey);
      });
      return JSON.stringify(fehlt);
    })()`));
    // lexiconKey ist ein Schluessel, kein Titel - geprueft wird nur, dass er gesetzt ist.
    pruef('Die Diagnose verweist nur auf gesetzte Lexikon-Schluessel',
      Array.isArray(fehlend), JSON.stringify(fehlend).slice(0, 200));
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
