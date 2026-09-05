/**
 * (v1.5.104) Sichert die Validitaetspruefung der Ablaufmessung ab.
 *
 * Grundlage ist ANBAU.md, Abschnitt 5.1: Ein Drain-EC bei 5 % Durchfluss ist keine schlechte
 * Messung, sondern gar keine. Was da unten herauslaeuft, ist eine Randfraktion - Wasser, das
 * am Topfrand entlanglief, ohne den Wurzelballen zu durchqueren. Solche Proben liegen
 * systematisch zu hoch, weil sie die konzentrierte Restloesung mitnehmen.
 *
 * Bis v1.5.103 bewertete die App jeden eingetragenen Drain-Wert gleich und konnte es auch
 * nicht anders: Die Ablaufmenge wurde nirgends erfasst.
 *
 * Zweiter Teil: In organischen Substraten hat ein hoher Drain-EC in der zweiten Bluetehaelfte
 * ZWEI moegliche Ursachen (Anreicherung oder Mineralisierung/Seneszenz), die sich am Messwert
 * nicht unterscheiden lassen. Die App darf dann nicht auf eine schliessen.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

const TAG98 = '2026-08-21';   // 12000 ml gegossen, Runoff-EC 1.15, Runoff-pH 7.21
const TAG27 = '2026-06-11';   // 3000 ml gegossen, fruehe Bluete

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

const setzeDrain = (E, iso, ml) =>
  E(`S.entries['${iso}'].cycleData[S.cycles[0].id].drainMl = ${ml === null ? 'undefined' : `'${ml}'`}`);

const analyse = (E, iso) => JSON.parse(E(`(function(){
  const c = S.cycles[0];
  const cd = S.entries['${iso}'].cycleData[c.id];
  const ra = analyzeRunoff(cd, c.medium, _ecTargetFor(c, '${iso}'), { c, iso: '${iso}' });
  return JSON.stringify({ flow: ra.flow, ecGueltig: ra.ecGueltig, warnungen: ra.warnings,
                          boxSeverity: ra.boxSeverity, ecSeverity: ra.ecSeverity, phSeverity: ra.phSeverity });
})()`));

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('');
  console.log('A - Durchfluss wird richtig berechnet und eingestuft');
  {
    const { E, errors } = await load();
    pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
    pruef('Ohne Ablaufmenge gibt es keine Einstufung',
      E(`drainFlow(S.entries['${TAG98}'].cycleData[S.cycles[0].id])`) === null);

    const faelle = [
      [600, 5, 'keine', false], [1200, 10, 'schwach', false], [1700, 14.2, 'schwach', false],
      [1800, 15, 'gut', true], [2400, 20, 'gut', true], [3600, 30, 'gut', true],
      [4800, 40, 'auswaschend', true],
    ];
    faelle.forEach(([ml, pct, guete, gueltig]) => {
      setzeDrain(E, TAG98, ml);
      const f = JSON.parse(E(`JSON.stringify(drainFlow(S.entries['${TAG98}'].cycleData[S.cycles[0].id]))`));
      pruef(`${ml} ml von 12000 = ${pct} % -> "${guete}"`,
        f && f.pct === pct && f.guete === guete && f.gueltig === gueltig,
        f ? `pct=${f.pct} guete=${f.guete} gueltig=${f.gueltig}` : 'null');
    });
  }

  console.log('');
  console.log('B - Zu wenig Durchfluss: keine Bewertung, sondern ein Hinweis');
  {
    const { E } = await load();
    setzeDrain(E, TAG98, 600);   // 5 %
    const r = analyse(E, TAG98);
    pruef('EC gilt als ungueltig', r.ecGueltig === false);
    pruef('Genau eine Meldung', r.warnungen.length === 1, 'n=' + r.warnungen.length);
    pruef('Sie nennt den Prozentsatz', /5 %/.test(r.warnungen[0]), r.warnungen[0].slice(0, 70));
    pruef('Sie nennt beide Mengen', /600 ml von 12000 ml/.test(r.warnungen[0]));
    pruef('Sie sagt, dass nicht bewertet wird', /nicht bewertet/.test(r.warnungen[0]));
    pruef('Sie nennt das Ziel in ml', /2400 ml Ablauf/.test(r.warnungen[0]));
    pruef('Keine pH-Warnung trotz Delta von +0,9', !r.warnungen.some(w => /Kalk-Puffer|driftet/.test(w)));
    pruef('Die Box ist Hinweis, nicht Alarm', r.boxSeverity !== 'warning', 'sev=' + r.boxSeverity);
  }

  console.log('');
  console.log('C - Genug Durchfluss: die Bewertung kommt zurueck');
  {
    const { E } = await load();
    setzeDrain(E, TAG98, 2400);   // 20 %
    const r = analyse(E, TAG98);
    pruef('EC gilt als gueltig', r.ecGueltig === true);
    pruef('Durchfluss ist "gut"', r.flow.guete === 'gut');
    pruef('Die pH-Bewertung ist wieder da', r.warnungen.some(w => /Kalk-Puffer/.test(w)),
      r.warnungen.map(w => w.slice(0, 40)).join(' | '));
    pruef('Kein Validitaetshinweis mehr', !r.warnungen.some(w => /nicht bewertet/.test(w)));
  }

  console.log('');
  console.log('D - Sehr viel Durchfluss ist gueltig, wird aber eingeordnet');
  {
    const { E } = await load();
    setzeDrain(E, TAG98, 4800);   // 40 %
    const r = analyse(E, TAG98);
    pruef('Gilt als gueltig', r.ecGueltig === true);
    pruef('Wird als auswaschend gekennzeichnet', r.flow.guete === 'auswaschend');
    pruef('Es gibt einen Hinweis dazu', r.warnungen.some(w => /spülst du bereits mit/.test(w)),
      r.warnungen.map(w => w.slice(0, 40)).join(' | '));
  }

  console.log('');
  console.log('E - Organische Spaetbluete: zwei Ursachen statt einer Diagnose');
  {
    // EC kuenstlich ueber den Zielbereich heben, damit die Warnung ueberhaupt greift
    const { E } = await load((st) => {
      const c = st.cycles.find(x => x.active);
      const cd = st.entries[TAG98].cycleData[c.id];
      cd.drainMl = '2400';
      cd.ec = '0.85';
      cd.runoffEc = '3.2';
    });
    const r = analyse(E, TAG98);
    pruef('Substrat ist Erde', E('S.cycles[0].medium') === 'erde');
    pruef('Es ist Spaetbluete', E(`_organischSpaetbluete(S.cycles[0], '${TAG98}')`) === true);
    const w = r.warnungen.join(' ');
    pruef('Beide Ursachen werden genannt', /zwei mögliche Ursachen/.test(w), w.slice(0, 80));
    pruef('Anreicherung wird beschrieben', /sammelt sich wirklich Salz/.test(w));
    pruef('Mineralisierung wird beschrieben', /Erde gibt nach/.test(w));
    pruef('Das Unterscheidungskriterium steht dabei', /So trennst du die beiden/.test(w));
    pruef('Es wird gesagt, dass Fall 2 normal ist', /normal und braucht nichts/.test(w));
    pruef('Kein pauschales "Salze sammeln sich an"',
      !/im Substrat sammeln sich Salze/.test(w));
  }

  console.log('');
  console.log('F - In inertem Substrat bleibt die klare Ansage');
  {
    const { E } = await load((st) => {
      const c = st.cycles.find(x => x.active);
      c.medium = 'coco';
      const cd = st.entries[TAG98].cycleData[c.id];
      cd.drainMl = '2400';
      cd.ec = '0.85';
      cd.runoffEc = '3.2';
    });
    pruef('Coco gilt nicht als organische Spaetbluete',
      E(`_organischSpaetbluete(S.cycles[0], '${TAG98}')`) === false);
    const r = analyse(E, TAG98);
    const w = r.warnungen.join(' ');
    pruef('Klare Ansage statt Differenzialdiagnose', /im Substrat sammeln sich Salze/.test(w),
      w.slice(0, 80));
    pruef('Keine zwei Ursachen', !/zwei mögliche Ursachen/.test(w));
  }

  console.log('');
  console.log('G - Fruehe Bluete ist auch in Erde eindeutig');
  {
    const { E } = await load((st) => {
      const c = st.cycles.find(x => x.active);
      const cd = st.entries[TAG27].cycleData[c.id];
      cd.drainMl = '600';   // 20 % von 3000
      cd.ec = '0.85';
      cd.runoffEc = '3.2';
    });
    pruef('Tag 27 ist nicht Spaetbluete',
      E(`_organischSpaetbluete(S.cycles[0], '${TAG27}')`) === false);
    const r = analyse(E, TAG27);
    pruef('Durchfluss 20 %', r.flow && r.flow.pct === 20, r.flow && ('pct=' + r.flow.pct));
    pruef('Keine Differenzialdiagnose', !/zwei mögliche Ursachen/.test(r.warnungen.join(' ')));
  }

  console.log('');
  console.log('H - Randfaelle stuerzen nicht ab');
  {
    const { E } = await load();
    const faelle = [
      ["'0'", 'Ablauf 0 ml'],
      ["'-100'", 'negative Menge'],
      ["'abc'", 'Buchstaben'],
      ["''", 'leer'],
      ["'99999'", 'mehr Ablauf als gegossen'],
    ];
    let fehler = [];
    faelle.forEach(([wert, name]) => {
      try {
        E(`S.entries['${TAG98}'].cycleData[S.cycles[0].id].drainMl = ${wert}`);
        const f = E(`JSON.stringify(drainFlow(S.entries['${TAG98}'].cycleData[S.cycles[0].id]))`);
        const r = analyse(E, TAG98);
        if (!Array.isArray(r.warnungen)) fehler.push(name + ': keine Warnungsliste');
      } catch (e) { fehler.push(name + ': ' + e.message); }
    });
    pruef('Alle Randfaelle laufen durch', fehler.length === 0, fehler.join(' | '));

    E(`S.entries['${TAG98}'].cycleData[S.cycles[0].id].drainMl = '0'`);
    const f0 = JSON.parse(E(`JSON.stringify(drainFlow(S.entries['${TAG98}'].cycleData[S.cycles[0].id]))`));
    pruef('0 ml Ablauf ergibt 0 % und gilt als ungueltig', f0 && f0.pct === 0 && f0.gueltig === false);

    E(`S.entries['${TAG98}'].cycleData[S.cycles[0].id].drainMl = '-100'`);
    pruef('Negative Menge wird verworfen',
      E(`drainFlow(S.entries['${TAG98}'].cycleData[S.cycles[0].id])`) === null);

    // Ohne Giessmenge kann kein Prozentsatz entstehen
    E(`S.entries['${TAG98}'].cycleData[S.cycles[0].id].drainMl = '2400'`);
    E(`S.entries['${TAG98}'].cycleData[S.cycles[0].id].water = ''`);
    pruef('Ohne Giessmenge keine Einstufung',
      E(`drainFlow(S.entries['${TAG98}'].cycleData[S.cycles[0].id])`) === null);
  }

  console.log('');
  console.log('I - Die Anzeigezeile zieht beim Tippen mit');
  {
    const { E } = await load();
    E('S.beginnerMode = false');
    E(`openEntry('${TAG98}')`);
    await new Promise((r) => setTimeout(r, 200));
    const id = E('S.cycles[0].id');
    const vorher = E(`(document.getElementById('runoff-flow-${id}')||{textContent:''}).textContent.replace(/\\s+/g,' ').trim()`);
    pruef('Ohne Menge steht der Hinweis da', /Ohne Ablaufmenge/.test(vorher), vorher.slice(0, 60));
    E(`uEF('${id}','drainMl','2400'); refreshRunoffAnalysis('${id}')`);
    await new Promise((r) => setTimeout(r, 150));
    const nachher = E(`(document.getElementById('runoff-flow-${id}')||{textContent:''}).textContent.replace(/\\s+/g,' ').trim()`);
    pruef('Nach der Eingabe steht der Durchfluss da', /Durchfluss 20 %/.test(nachher), nachher.slice(0, 60));
    pruef('Der alte Hinweis ist weg', !/Ohne Ablaufmenge/.test(nachher), nachher.slice(0, 60));
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
