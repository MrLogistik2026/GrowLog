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
  console.log('G - (v1.5.126) Die Regel gilt fuer die GANZE App, nicht nur fuers Lexikon');
  {
    // Beim ersten Durchgang hat dieser Test nur `LEXIKON` durchsucht - und dabei drei
    // Stellen ausserhalb uebersehen, darunter eine IceFlush-Karte im Tageseintrag mit
    // "Studien zeigen 10-20% mehr Trichomproduktion". Geprueft wird deshalb jetzt der
    // gesamte ausgelieferte Quelltext.
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    // Kommentarzeilen zaehlen nicht - dort steht absichtlich, was frueher dastand.
    const ohneKommentare = quelle.split('\n')
      .filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z))
      .join('\n');

    const muster = [
      [/Studien zeigen\s*\d/i, '"Studien zeigen <Zahl>"'],
      [/Trichom-?(Boost|Überproduktion|Booster)/i, '"Trichom-Boost/-Überproduktion"'],
      [/=\s*mehr Trichome/i, '"= mehr Trichome"'],
      [/\d\s?%\s?mehr (THC|Trichom|Cannabinoide)/i, '"<Zahl> % mehr THC/Trichome"'],
      // (v1.5.143) Die IceFlush-Karte auf der Startseite und die Anleitung versprachen noch
      // „Kältestress fördert Trichom-Produktion" bzw. „soll die Trichom-Produktion pushen".
      [/Kältestress\s+(soll|fördert|pusht|steigert)[^\n.]{0,60}Trichom/i, '"Kältestress fördert/pusht Trichome"'],
      // (v1.5.144) Übersehen in v1.5.126: der Finisher-Hinweis „bewusster Stress für Harzproduktion".
      [/(Stress\s+(für|triggert|fördert)\s+(die\s+)?Harz|triggert\s+Harz)/i, '"Stress für/triggert Harzproduktion"'],
      // (v1.5.151) Der Ernte-Hinweis drei Tage vorher: „milchig = bereit, bernsteinfarben = Peak". Nach
      // ANBAU.md 11 ist Bernstein Abbau (THCA → CBNA), nicht der Höhepunkt — wer darauf wartet, verliert Terpene.
      [/bernstein(farben|farbig)?\s*=\s*Peak/i, '"bernsteinfarben = Peak"'],
    ];
    // Eine Zeile, die die Zahl ZITIERT und im selben Zug entkraeftet, ist kein Verstoss —
    // im Gegenteil, sie ist das gewuenschte Ergebnis. (Diese Unterscheidung hat mir der
    // Test inzwischen dreimal beigebracht.)
    const entkraeftetZeile = /(nicht belegt|kein Nachweis|nicht nachgewiesen|Was NICHT belegt ist|stammen aus Erfahrungsberichten|halten einer Prüfung nicht stand|dünn belegt|nicht bestätigt)/i;
    muster.forEach(([re, name]) => {
      const zeilen = ohneKommentare.split('\n')
        .map((z, i) => ({ nr: i + 1, z }))
        .filter(x => re.test(x.z) && !entkraeftetZeile.test(x.z))
        .map(x => 'Zeile ~' + x.nr + ': ' + x.z.trim().slice(0, 90));
      pruef(`Nirgends als Tatsache: ${name}`, zeilen.length === 0, JSON.stringify(zeilen));
    });

    // (v1.5.190) Bewusst geaendert: Die Empfehlung selbst hat sich mit Patricks Entscheidung vom 15.09.2026 geaendert
    // (VPD Option B, KLIMA_ZIEL). Die Spaetbluete hat das Band der mittleren Bluete, der Schimmelschutz kommt ueber den
    // Deckel von 60 % — die Begruendung bleibt der Schimmelschutz, nicht das Harz.
    pruef('Der Spaetblueten-Korridor steht bei 1,2–1,5 kPa (KLIMA_ZIEL)',
      /1,2–1,5 kPa/.test(text(/^VPD/)), text(/^VPD/).slice(0, 300));
    pruef('Und der Luftfeuchte-Deckel der Spaetbluete bei 60 %',
      /höchstens 60 %/.test(text(/^VPD/)));
    pruef('Der neue Grund ist der Schimmelschutz',
      /Schimmel/.test(text(/^VPD/)), text(/^VPD/).slice(-400));
  }

  // (v1.5.248) Wie die App über Herstellermengen spricht. Neun Stellen sagten ohne Beleg, Herstellertabellen seien
  // „Maximalwerte", „50–70 %" davon robuster, „garantiertes Salzaufbau-Risiko" — und eine davon zugleich, Bio brauche
  // „das 1.5–2-fache der Maximalwerte". Seit v1.5.240 führt die App eine Vorlage mit den Herstellermengen.
  // Die Haltung jetzt: Ob eine Menge passt, zeigt die Pflanze (ANBAU.md 5, 6.3); bei Unsicherheit weniger (15).
  console.log('');
  console.log('L - (v1.5.248) Herstellermengen: eine Haltung aus der Fachgrundlage');
  {
    const q = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    [/Hersteller-Maxima/i, /Maximalwerte/i, /Maximaldosis/i, /50–70\s?% der/i, /halbe Herstellerangabe/i, /Immer mit halber Dosis/i,
      /1\.5–2-fache/i, /garantiertes Salzaufbau/i].forEach(re =>
      pruef('Nirgends mehr als Tatsache: ' + re.source, !re.test(q), (q.match(new RegExp('.{0,60}' + re.source + '.{0,30}', 'i')) || [''])[0]));
    const r = JSON.parse(E(`(function(){
      const items = LEXIKON.flatMap(k => k.items || []);
      const e = items.find(i => i.t === 'Düngepläne (Hersteller-Vergleich)') || {};
      const npk = items.find(i => i.t === 'NPK') || items.find(i => /^NPK/.test(i.t)) || {};
      return JSON.stringify({ practice: e.practice || '', pitfall: e.pitfall || '', npk: npk.pitfall || '',
        official: FERT_PRESETS.biobizz_official_2026.name, einsteiger: FERT_PRESETS[EINSTEIGER_VORLAGE.erde].name });
    })()`));
    pruef('Der Plan-Vergleich nennt beide Wege: Herstellermengen und die sanftere Einsteiger-Vorlage',
      /Herstellermenge oder sanfter\?/.test(r.practice) && r.practice.includes(r.official) && r.practice.includes(r.einsteiger), r.practice.slice(0, 200));
    pruef('… ohne Tabelle fester „konservativer" Mengen und ohne feste Drain-EC-Schwelle',
      !/Konservative Praxis/.test(r.practice) && !/Drain-EC unter/.test(r.practice));
    // (v1.5.250) Nach dem Gegencheck heißt es „zeigt die Pflanze": Braune Spitzen sind nur eines der Zeichen (Regel 3).
    pruef('Maßstab ist die Pflanze: in Plan-Vergleich, seiner Fehlerliste und im NPK-Eintrag',
      /zeigt die Pflanze/.test(r.practice) && /zeigt die Pflanze/.test(r.pitfall) && /zeigt die Pflanze/.test(r.npk), r.npk.slice(-300));
  }

  // (v1.5.249) Geschmack und Spülen. ANBAU.md 14: Kontrollierte Vergleiche fanden keinen belastbaren Unterschied in
  // Geschmack, Aschequalität oder Analytik. v1.5.125 hatte den Kurztext des Spülung-Eintrags berichtigt — seine eigene
  // Fehlerliste sagte weiter „schwarze Asche, kratziger Rauch", dazu 12 weitere Stellen in Info-Texten, Spülanleitung,
  // NPK-, Bio/Mineral-, Silizium- und Trichom-Eintrag. Und der Spülung-Eintrag setzte das Spülende noch am Drain-EC (v1.5.211).
  console.log('');
  console.log('M - (v1.5.249) Geschmack und Spülen: nichts versprechen, was ANBAU.md 14 nicht trägt');
  {
    const q = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    [/saubereren, weicheren Geschmack/i, /schmecken die Blüten oft kratzig/i, /sauberer Geschmack/i, /terpenreicher/i, /bessere Aromen/i,
      /Pflicht für sauberen Geschmack/i, /garantiert kratziger/i, /Asche, kratziger Rauch/i, /Wirkung, kratziger Rauch/i, /bitterer Geschmack/i, /Trichom-Produktion stoppt/i,
      /schmeckt dann kratziger/i, /Bio mit Long-Cure/i].forEach(re =>
      pruef('Nirgends mehr als Tatsache: ' + re.source, !re.test(q), (q.match(new RegExp('.{0,60}' + re.source + '.{0,30}', 'i')) || [''])[0]));
    const sp = JSON.parse(E(`JSON.stringify(LEXIKON.flatMap(k => k.items || []).find(i => i.t === 'Spülung (Final-Flush)') || {})`));
    pruef('Der Spülung-Eintrag widerspricht seinem eigenen Kurztext nicht mehr',
      /nicht nachweisen/.test(sp.brief || '') && !/schwarze Asche, kratziger|bitterer Geschmack/.test(sp.pitfall || ''), (sp.pitfall || '').slice(0, 300));
    pruef('… und das Spülende setzt der Plan, nicht ein Drain-EC-Wert (v1.5.211)',
      /wann Schluss ist, sagt der Plan/.test(sp.pitfall || '') && !/Drain-EC nicht gemessen/.test(sp.pitfall || ''));
    // (v1.5.252) Nach dem Gegencheck: Eine feste 14-Tage-Grenze steht nicht in ANBAU.md, und in Erde liefert das Substrat
    // weiter nach (5.1) — Spülen ist dort kein vollständiger Stickstoff-Stopp. Der Mechanismus aus 5 bleibt, ohne Grenze.
    pruef('Zu langes Spülen: der Mechanismus aus ANBAU.md 5, ohne erfundene Grenze',
      /desto eher fehlt Stickstoff/.test(sp.pitfall || '') && /Ab wann das schadet, ist nicht belegt/.test(sp.pitfall || '') && !/14 Tage/.test(sp.pitfall || ''));
  }

  // (v1.5.250) Der Fach-Gegencheck der Texte aus v1.5.248 fand Überziehungen in den NEUEN Sätzen: „braune Spitzen heißen zu
  // viel" (Trockenheit sieht nach ANBAU.md 5 genauso aus — Regel 3), „der Drain zeigt, ob sich Salz sammelt" (nur mit genug
  // Drain, in organischer Spätblüte steigt er auch so — 5.1), „steigern, solange die Spitzen grün bleiben" (ohne Obergrenze —
  // ein Überschuss zeigt sich auch als Mangelbild, 6.2) und eine Reaktionszeit, die ANBAU.md nicht nennt. Dazu zwei Reste der
  // alten Haltung in anderer Schreibweise („Maximal-Werte", „30–50 % unter der Flaschenangabe").
  console.log('');
  console.log('N - (v1.5.250) Dosis-Texte nach dem Gegencheck');
  {
    const q = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    [/heißen: weniger/i, /heißen zu viel/i, /solange die (Blatt)?spitzen grün bleiben/i, /zeigt sich erst nach Tagen/i, /fast immer Überdüngung/i,
      /Maximal-?Werte/i, /30–50\s?% (darunter|unter der Flaschenangabe)/i, /ab etwa der Hälfte ganz gestrichen/i, /heißt bei Bio nicht Mangel/i,
      /zeigen (die )?Blattspitzen und (der )?Drain/i].forEach(re =>
      pruef('Nirgends mehr: ' + re.source, !re.test(q), (q.match(new RegExp('.{0,60}' + re.source + '.{0,30}', 'i')) || [''])[0]));
    pruef('Braune Spitzen: das Unterscheidungskriterium steht dabei (Topf feucht oder trocken, ANBAU.md 5)',
      /Trockenheit sieht genauso aus/.test(q) && /bei feuchtem Topf sprechen für zu viel Dünger/.test(q));
    pruef('Der Drain-EC nur mit Bedingung (genug Drain, organische Spätblüte — ANBAU.md 5.1)',
      /wenn genug Drain kam — in Erde kann er spät in der Blüte aber auch ohne zu viel Dünger steigen/.test(q));
    pruef('Steigern hat eine Obergrenze: die Menge des Plans', (q.match(/bis zur Menge (deines|des) Plans/g) || []).length >= 5,
      (q.match(/bis zur Menge (deines|des) Plans/g) || []).length + ' Stellen');
    pruef('Stickstoff-Stopp mit dem Grund aus ANBAU.md 5, nicht „ab der Hälfte gestrichen"', /ganz gestrichen, bevor die Blüte fertig ist, kostet er Blütenmasse/.test(q));
  }

  // (v1.5.252) Nach dem Gegencheck: Spül- und Reifetexte ohne erfundene Grenzen und Zahlen, und zwei Reste der Aussagen, die
  // v1.5.249 anderswo gestrichen hatte — im Eintrag „Reife (Seneszenz)".
  console.log('');
  console.log('O - (v1.5.252) Spülen und Reife nach dem Gegencheck');
  {
    const q = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    [/triggert finale Trichom-Reife/i, /kratziger" Rauch/i, /oft um 0\.5-1\.0 Punkte/i, /Bodenleben-Vorteile \(Pufferung\)/i,
      /pH auf etwa 6\.2 einstellen und mit reichlich/i, /steigt er (nach dem Spülen|danach) wieder/i].forEach(re =>
      pruef('Nirgends mehr: ' + re.source, !re.test(q), (q.match(new RegExp('.{0,60}' + re.source + '.{0,30}', 'i')) || [''])[0]));
    pruef('Dunkelphase vor der Ernte: kein Trichom-Versprechen, der belegte Grund (Terpene, ANBAU.md 14)',
      /ein Plus an Trichomen oder THC ist nicht belegt; ein kühler, dunkler Schnitt schont die Terpene/.test(q));
    pruef('Spülende: an allen fünf Stellen „kann" wieder steigen (bei echter Anreicherung bleibt er unten, ANBAU.md 5.1)',
      (q.match(/kann er (nach dem Spülen|danach) wieder (an)?steigen/gi) || []).length === 5, (q.match(/kann er (nach dem Spülen|danach) wieder (an)?steigen/gi) || []).length + ' Stellen');
  }

  // (v1.5.253) Die Mobilität stand an drei Stellen anders als in ANBAU.md 6.1 — Schwefel und Zink als unbeweglich, Bor und
  // Kupfer fehlten —, und der NPK-Eintrag versprach Wirkungen („P macht Blüten dicht", „K macht Buds aromatisch und ölig",
  // „K für Trichom-Bildung und Reife-Push"), die nirgends belegt sind. Dazu „0-2-4" in der späten Blüte: Stickstoff auf null
  // ist der teurere Fehler (ANBAU.md 5).
  console.log('');
  console.log('P - (v1.5.253) Mobilität nach ANBAU.md 6.1, NPK ohne Wirkungszusagen');
  {
    const q = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    [/dicht macht/i, /aromatisch und ölig/i, /Zuckereinlagerung/i, /Reife-Push/i, /explosive Streckung/i, /Ca, Fe, S, Mn, Zn/, /\(Ca, Fe, S\)/,
      /Mangan-Aufnahme/i, /Mg-Mangel bei LED/i, /K-lastig \(0-2-4\)/, /Lockout häufiger als Mangel/i, /Gelbe Blattspitzen oben = Ca/i,
      /investiert in Blüten statt Blätter/i, /\*\*pH prüfen\*\*/].forEach(re =>
      pruef('Nirgends mehr: ' + re.source, !re.test(q), (q.match(new RegExp('.{0,60}' + re.source + '.{0,30}', 'i')) || [''])[0]));
    const npk = text(/^NPK$/), mm = text(/^Makro- vs\. Mikronährstoffe/), nm = text(/^Nährstoffmangel$/);
    const tab = npk.slice(npk.indexOf('Mobilität-Übersicht'), npk.indexOf('Mobilität-Übersicht') + 400);
    pruef('NPK-Tabelle: N, P, K, Mg, Mo mobil · S, Cl, Zn teilmobil · Ca, B, Fe, Mn, Cu immobil (6.1)',
      /N, P, K, Mg, Mo Mobil/.test(tab) && /S, Cl, Zn Teilmobil/.test(tab) && /Ca, B, Fe, Mn, Cu Immobil/.test(tab), tab);
    pruef('Makro/Mikro: dieselben drei Listen', /Mobil \(N, P, K, Mg, Mo\)/.test(mm) && /Teilmobil \(S, Cl, Zn\)/.test(mm) && /Immobil \(Ca, B, Fe, Mn, Cu\)/.test(mm), mm.slice(0, 500));
    pruef('Nährstoffmangel: Immobile ohne Schwefel, Schwefel und Zink dazwischen', /Immobile \(Ca, B, Fe, Mn, Cu\)/.test(nm) && /Schwefel und Zink liegen dazwischen/.test(nm), nm.slice(0, 400));
    const sen = /Vergilbung von unten ist in der späten Blüte meist normale Seneszenz, kein Mangel — sie läuft langsam und gleichmäßig von unten nach oben\. Geht es schnell, fleckig oder etagenweise, spricht das eher für einen Mangel/;
    pruef('Seneszenz mit Gegenkriterium bei allen drei Listen (6.1, 6.4, Regel 3)', sen.test(npk) && sen.test(mm) && sen.test(nm));
    pruef('Frühe Blüte: noch Streckungswachstum, Stickstoff nicht zurücknehmen (2.2, 5)', /Noch starkes Streckungswachstum — die Pflanze braucht weiter Stickstoff/.test(npk));
    pruef('Makro/Mikro: Eisen und Calcium am jungen Blatt, braune Spitzen mit Unterscheidung (4, 5, Regel 3)',
      /Junge Blätter oben hellgelb mit grünen Adern = eher Eisen/.test(mm) && /Gelbe oder braune Spitzen sind ein anderes Bild: bei feuchtem Topf eher zu viel Dünger/.test(mm));
    pruef('Calcium-„Mangel": zuerst Umluft und Luftfeuchte, dann pH (1)', /Calcium-„Mangel" zuerst Umluft und Luftfeuchte prüfen/.test(mm));
    pruef('Späte Blüte: weniger, aber Stickstoff nicht zu früh ganz streichen (5)',
      /Insgesamt weniger, Stickstoff-Anteil zurückgenommen/.test(npk) && /nicht zu früh ganz streichen, die Pflanze baut bis zuletzt Blütenmasse auf/.test(npk));
    pruef('Zu viel N: Wachstumsmodus, lockere Blüten — und nicht zu früh streichen (5)',
      /Zu viel N in der Blüte → die Pflanze bleibt im Wachstumsmodus, die Blüten bleiben locker und blattreich/.test(npk) && /das kostet Blütenmasse/.test(npk));
    pruef('P-Überschuss verdrängt Zink und Eisen (6.2)', /P-Überschuss → verdrängt Zink und Eisen/.test(npk));
    pruef('Kalium: beteiligt, nicht „macht die Buds" — und der Überschuss verdrängt Mg und Ca (6.2)',
      /am Zuckertransport in der Pflanze beteiligt/.test(npk) && /verdrängt Magnesium und Calcium an der Wurzel/.test(npk));
    pruef('CalMag von Anfang an nur mit der Bedingung weiches Wasser (3)', /Bei weichem Wasser sind Calcium und Magnesium knapp/.test(mm));
  }

  // (v1.5.254) „Bio vs. Mineralisch" behauptete Zeitangaben („Stunden", „übermorgen"), einen Puffer durchs Bodenleben, einen
  // höheren Ertrag mit Mineral, „Bio-Wirkung halbiert" in Coco und einen Boden, der „stirbt" — nichts davon trägt ANBAU.md.
  // Der Puffer ist die Austauschkapazität der Erde (7.1), der EC zeigt nur gelöste Ionen (5), und ein Überschuss sieht aus
  // wie Trockenheit, nur mit nassem Topf (5).
  console.log('');
  console.log('Q - (v1.5.254) Bio vs. Mineralisch ohne unbelegte Zusagen');
  {
    const q = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    [/Bio füttert das Bodenleben/i, /direkt<\/b> innerhalb von Stunden/i, /übermorgen verfügbar/i, /chirurgisch präzise/i, /Hoch — Bodenleben puffert/i,
      /Stunden bis 1 Tag/i, /Höher \(theoretisch\)/i, /Bio-Wirkung (halbiert|tot)/i, /Boden „stirbt", verliert/i, /kill der Mykorrhiza/i,
      /wird sofort Burn sehen/i, /spült das Bodenleben mit raus/i, /automatische pH-Stabilisierung/i, /BioBizz<\/b> \(NL\)/, /Power-User, Maximalertrag/i,
      /Inkompatible Mischungen/i].forEach(re =>
      pruef('Nirgends mehr: ' + re.source, !re.test(q), (q.match(new RegExp('.{0,60}' + re.source + '.{0,30}', 'i')) || [''])[0]));
    const bm = text(/^Bio vs\. Mineralisch$/);
    pruef('Mengenwort überall gleich: ein Teil organisch gebunden, beim Stickstoff der größte (6.2)',
      /ein Teil organisch gebunden — beim Stickstoff der größte/.test(bm) && /Ein Teil der Nährstoffe ist organisch gebunden, beim Stickstoff der größte/.test(bm), bm.slice(0, 400));
    pruef('Bio verzeiht eher — zu viel geben kann man trotzdem (5, 13.2)', /verzeiht Bio eher — zu viel geben kann man trotzdem/.test(bm));
    pruef('Der EC zeigt die Menge, nicht die Zusammensetzung (5, 6.3)', /welche Nährstoffe es sind, zeigt er nicht/.test(bm));
    pruef('Puffer mit Substrat-Bedingung: Erde puffert, Coco deutlich weniger, Hydro gar nicht (7.1, Regel 1)',
      /Erde puffert, Coco deutlich weniger, Hydro gar nicht/.test(bm) && /in Coco fehlt der Puffer der Erde/.test(bm));
    pruef('Ertrag: kein Vorsprung für Mineral, begrenzt meist von Licht und Topfgröße (8.1, 7.4)', (bm.match(/Ertrag Begrenzt meist von Licht und Topfgröße Begrenzt meist von Licht und Topfgröße/g) || []).length === 1);
    pruef('Geschmack: Trocknen und Fermentieren statt „kein belegter Unterschied" (12)', /Geschmack Trocknen und Fermentieren prägen ihn stark/.test(bm) && !/Kein belegter Unterschied/i.test(bm));
    pruef('EC im Drain nur mit genug Drain (5.1)', /nur mit genug Drain/.test(bm));
    pruef('Coco: dasselbe BioBizz-Schema, aber weniger Austauschkapazität; Cal/Mag nur bei ungepuffertem Coco Grundbedarf (7.1)',
      /BioBizz selbst gibt für Coco·Mix dasselbe Schema wie für Light·Mix/.test(bm) && /Ungepuffertes Coco zieht außerdem Calcium aus der Lösung — dort ist Cal\/Mag Grundbedarf/.test(bm));
    pruef('Living Soil: „stirbt" nicht belegt, aber der Weg über Ammonium und pH genannt (4, 6.2)',
      /ist so nicht belegt — aber ammoniumreicher Dünger senkt den pH/.test(bm));
    pruef('Zu viel Mineral sieht aus wie Trockenheit — nur mit nassem Topf (5, Regel 3)', /nur dass der Topf dabei nass ist/.test(bm));
    pruef('pH-Perfect: Herstellerangabe, nachmessen (3, 4.1)', /Laut Hersteller regelt sich der pH selbst/.test(bm) && /hängt an deinem Wasser und deinem Substrat — nachmessen/.test(bm));
    pruef('BioBizz-Herkunft nach Herstellerseite', /1992 in den Niederlanden gegründet, heute mit Sitz in Spanien/.test(bm));
  }

  // (v1.5.255) „Sauerstoff-Sog" erklärte die Belüftung mit einem „mikroskopischen Vakuum", das Luft ansaugt, und versprach,
  // Bio-Produkte funktionierten „nur in lebendigem Boden", in Coco „bringen sie nichts". ANBAU.md 1: Beim Abtrocknen werden
  // Poren frei, Luft zieht nach; dauernd nass kippt die Wurzelzone ins Anaerobe. Die Coco-Aussage widersprach dem BioBizz-Schema,
  // das für Coco·Mix dasselbe gibt wie für Light·Mix — und stand ein zweites Mal im Eintrag „Substrattypen".
  console.log('');
  console.log('R - (v1.5.255) Sauerstoff im Topf nach ANBAU.md 1, ohne Vakuum und ohne Produktversprechen');
  {
    const q = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    [/mikroskopisches Vakuum/i, /Transpiration → Vakuum/i, /funktionieren <b>nur in lebendigem Boden/i, /inertem Coco bringen sie nichts/i,
      /nicht in Coco\./i].forEach(re =>
      pruef('Nirgends mehr: ' + re.source, !re.test(q), (q.match(new RegExp('.{0,60}' + re.source + '.{0,30}', 'i')) || [''])[0]));
    const so = text(/^Sauerstoff-Sog$/), st = text(/^Substrattypen$/);
    pruef('Mechanismus: Poren werden frei, Luft zieht nach (1)', /werden Poren frei — dort zieht frische Luft/.test(so), so.slice(0, 300));
    pruef('… und dauernd nass fehlt die Luft, Wurzelspitzen sterben ab (1, 13.1)', /Bleibt der Topf dauernd nass, fehlt die Luft im Porenraum/.test(so) && /Wurzelspitzen sterben ab/.test(so));
    pruef('Abtrocknen bis zum Gießpunkt, nicht ganz trocken (1.2)', /zwischen den Güssen bis zum Gießpunkt abtrocknen zu lassen/.test(so), so.slice(-300));
    pruef('Substrattypen sagt dasselbe wie Sauerstoff-Sog', /Bio-Dünger sind zum Teil organisch gebunden und werden erst von Mikroorganismen aufgeschlossen/.test(st), st.slice(0, 600));
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
