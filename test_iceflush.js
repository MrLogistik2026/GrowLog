/**
 * (v1.5.110/111) Zwei Fehler rund um den IceFlush, von Patrick am 06.09.2026 gemeldet.
 *
 * A) DER VORGEZOGENE ICEFLUSH VERSCHWAND (v1.5.110)
 *    `moveGussDay` legt einen Vermerk an, der nur die AKTION verschiebt - die Phase rechnet
 *    weiter aus flushWetDays/iceDryDays. Beim IceFlush lief das doppelt schief:
 *      1. Am Zieltag griff `_dryLeadIn` mit 'ice' (Hard-Dryback vor dem IceFlush) und gab
 *         null zurueck. Die Regel soll normale Guesse aus dem Dryback halten - sie blockte
 *         aber den vorgezogenen IceFlush selbst. Die Aufgabe verschwand spurlos: kein Symbol
 *         am neuen Tag, keines am alten.
 *      2. Die Phase blieb stehen. Im Kalender stand das Wort "IceFlush" weiter am alten Tag,
 *         und der Tageseintrag zeigte dort die Spuelmenge statt der Eismenge.
 *    Der IceFlush ist kein Guss, sondern ein Phasen-Ereignis: `_moveIceFlushTo` verschiebt
 *    jetzt die Phase selbst, wie `setEndspurtIceStart` es tut.
 *
 * B) AM ICEFLUSH-TAG STAND EINE GIESSMENGE (v1.5.111)
 *    Die gruene Karte nannte "Berechnet fuer 3 Pflanzen - 3750 ml/Pflanze". Die Zahl selbst
 *    stimmt (Schmelzwasser aus 1 L Crushed Ice), beantwortet aber die falsche Frage: Am
 *    IceFlush legt man Eis an den Topfrand und giesst NICHTS dazu. Wer der Zahl folgt, macht
 *    den Hard-Dryback zunichte, auf den die Tage davor hingearbeitet haben.
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

// Datum festnageln: Der Zyklus laeuft ab 16.05.2026, Tag 113 ist der 05.09.2026.
const HEUTE = '2026-09-05';
const festesDatum = (E) => E(`todayISO = function(){ return '${HEUTE}'; };`);

const lage = (E, von, bis) => JSON.parse(E(`JSON.stringify((function(){
  const c = S.cycles[0]; const out = [];
  for (let t = ${von}; t <= ${bis}; t++) {
    const iso = isoPlus(c.startDate, t-1);
    out.push({ tag: t, aktion: getAction(iso, c), phase: (phase(iso, c)||{}).ph });
  }
  return out;
})())`));

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('');
  console.log('A - Ausgangslage: IceFlush an Tag 114');
  {
    const { E, errors } = await load();
    festesDatum(E);
    pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
    pruef('IceFlush liegt auf Tag 114',
      E("endspurtState(S.cycles[0], todayISO()).iceStart") === 114);
    const l = lage(E, 112, 116);
    pruef('Tag 114 traegt Aktion und Phase "ice"',
      l.find(x => x.tag === 114).aktion === 'ice' && l.find(x => x.tag === 114).phase === 'ice');
    pruef('Tag 113 ist Hard-Dryback (flush, keine Aktion)',
      l.find(x => x.tag === 113).aktion === null && l.find(x => x.tag === 113).phase === 'flush');
  }

  console.log('');
  console.log('B - Der IceFlush verschwindet beim Verschieben nicht mehr');
  {
    const { E } = await load();
    festesDatum(E);
    // Vorziehen von Tag 114 auf 113 - genau Patricks Fall
    const erfolg = E("moveGussDay(S.cycles[0].id, isoPlus(S.cycles[0].startDate, 113), -1)");
    pruef('Das Verschieben wird angenommen', erfolg === true);
    pruef('Es entsteht KEIN Verschiebe-Vermerk', E("(S.cycles[0].gussMoves||[]).length") === 0,
      'vermerke=' + E("(S.cycles[0].gussMoves||[]).length"));
    pruef('Der IceFlush liegt jetzt auf Tag 113',
      E("endspurtState(S.cycles[0], todayISO()).iceStart") === 113);

    const l = lage(E, 111, 116);
    const t113 = l.find(x => x.tag === 113);
    pruef('Tag 113: Aktion "ice"', t113.aktion === 'ice', 'aktion=' + t113.aktion);
    pruef('Tag 113: Phase "ice" — Symbol und Beschriftung zusammen',
      t113.phase === 'ice', 'phase=' + t113.phase);
    pruef('Tag 114 traegt keine Ice-Aktion mehr',
      l.find(x => x.tag === 114).aktion !== 'ice');
    pruef('Nirgends ist der IceFlush verlorengegangen',
      l.some(x => x.aktion === 'ice'), JSON.stringify(l));
  }

  console.log('');
  console.log('C - Nach hinten schieben geht ebenso, die Kette rueckt mit');
  {
    const { E } = await load();
    festesDatum(E);
    const vorherErnte = E("endspurtState(S.cycles[0], todayISO()).ernteTag");
    E("moveGussDay(S.cycles[0].id, isoPlus(S.cycles[0].startDate, 113), 1)");   // 114 -> 115
    pruef('IceFlush auf Tag 115',
      E("endspurtState(S.cycles[0], todayISO()).iceStart") === 115);
    pruef('Der Erntetag rueckt um einen Tag nach',
      E("endspurtState(S.cycles[0], todayISO()).ernteTag") === vorherErnte + 1,
      'vorher=' + vorherErnte + ' nachher=' + E("endspurtState(S.cycles[0], todayISO()).ernteTag"));
    const l = lage(E, 114, 117);
    pruef('Tag 115 traegt Aktion und Phase "ice"',
      l.find(x => x.tag === 115).aktion === 'ice' && l.find(x => x.tag === 115).phase === 'ice');
  }

  console.log('');
  console.log('D - Altbestand: ein alter Vermerk laesst den IceFlush nicht verschwinden');
  {
    // Genau der Zustand, der vor v1.5.110 entstand
    const { E } = await load((st) => {
      const c = st.cycles.find(x => x.active);
      c.gussMoves = [{ from: '2026-09-06', to: '2026-09-05', act: 'ice' }];
    });
    festesDatum(E);
    const l = lage(E, 112, 115);
    pruef('Der alte Vermerk steht noch da', E("(S.cycles[0].gussMoves||[]).length") === 1);
    pruef('Tag 113 zeigt trotzdem den IceFlush',
      l.find(x => x.tag === 113).aktion === 'ice', JSON.stringify(l));
    pruef('Der IceFlush ist nicht verschwunden', l.some(x => x.aktion === 'ice'));
  }

  console.log('');
  console.log('E - Am IceFlush-Tag steht die Eismenge, keine Giessmenge');
  {
    const { E } = await load();
    festesDatum(E);
    E('S.beginnerMode = false');
    E("openEntry(isoPlus(S.cycles[0].startDate, 113))");   // Tag 114 = IceFlush
    await new Promise((r) => setTimeout(r, 200));
    const txt = E("document.getElementById('scr-entry').textContent.replace(/\\s+/g,' ')");

    pruef('Die Karte spricht von Crushed Ice', /Crushed Ice für 3 Pflanzen/.test(txt),
      txt.slice(0, 90));
    pruef('Sie nennt die Eismenge je Topf', /1000 ml Eis\/Topf/.test(txt));
    pruef('Sie nennt die Gesamtmenge Eis', /3000 ml gesamt/.test(txt));
    pruef('Sie sagt ausdruecklich, dass kein Wasser dazukommt',
      /Wasser gießt du keines dazu/.test(txt));
    pruef('Sie nennt das Schmelzwasser als Folge', /Schmelzwasser/.test(txt));
    pruef('Kein "Berechnet für" mehr an diesem Tag', !/Berechnet für/.test(txt));
    pruef('Der Hinweis zum Topfrand steht dabei', /Am Rand verteilen, nicht auf den Stamm/.test(txt));
  }

  console.log('');
  console.log('F - An einem normalen Guss-Tag bleibt alles wie vorher');
  {
    const { E } = await load();
    festesDatum(E);
    E('S.beginnerMode = false');
    E("openEntry(isoPlus(S.cycles[0].startDate, 103))");   // Tag 104 = letzter Duengerguss
    await new Promise((r) => setTimeout(r, 200));
    const txt = E("document.getElementById('scr-entry').textContent.replace(/\\s+/g,' ')");
    pruef('Dort steht keine Eismenge', !/Crushed Ice für/.test(txt));
    pruef('Dort steht die gewohnte Mengenkarte',
      /Berechnet für|Anmischen mit/.test(txt), txt.slice(0, 80));
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
