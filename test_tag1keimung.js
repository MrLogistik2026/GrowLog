/**
 * (v1.5.168) Tag 1 ist der Keimstart.
 *
 * Patricks Entscheidung vom 14.09.2026: „Tag 1 ist im Normalfall immer die Keimung." Bis v1.5.167 sagte die
 * App an verschiedenen Stellen Verschiedenes: Die Anleitung liess erst 2–5 Tage keimen und dann den Zyklus
 * anlegen („Schritt 3 — Einpflanzen · Tag 1"), die Sortendauer „Samen bis Ernte" zaehlt aber ab Keimung. Im
 * Eintrag an Tag 1 stand „Heute: Samen einpflanzen", daneben die Keimungskarte mit vorgewaehltem Papiertuch
 * („Nach 2–5 Tagen … dann in Erde setzen"). Der Assistent nannte keine Definition, und der Meilenstein
 * „Keimling sichtbar" wurde nur bis Tag 3 angeboten.
 *
 * Unveraendert bleibt das Protokoll selbst: Tag 1 Saettigungsguss, Tag 2–8 spruehen.
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
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}
const text = (html) => String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('\nA - Der Assistent sagt, was Tag 1 ist');
  {
    const t = text(E('_wizStepOutdoorTiming({})'));
    pruef('Draussen: „Tag 1 ist der Tag, an dem dein Samen keimt"', /Tag 1 ist der Tag, an dem dein Samen keimt/.test(t) && !/Wähle den Zeitpunkt/.test(t), t.slice(0, 160));
    const vor = JSON.parse(E(`JSON.stringify(_wizResolveStartDate({ startOption: 'prevegged' }))`));
    const tage = E(`isoDiff(_localISO(new Date()), '${vor.date}')`);
    pruef('„Schon vorgezogen": Text nennt drei Wochen zurück, der Code rechnet 21 Tage', /drei Wochen zurück/.test(t) && tage === 21, 'Tage=' + tage);
    const s = text(E('_wizStepStartMethod({})'));
    pruef('Sämlings-Start: „Tag 1 ist dein Keimstart" und „24h vor Tag 1"', /Tag 1 ist dein Keimstart/.test(s) && /24h vor Tag 1/.test(s), s.slice(0, 160));
    pruef('„Direkt": kein „Samen in trockene Erde" mehr', !/Samen in trockene Erde/.test(s) && /Direkt, ohne Vorbefeuchten/.test(s), s.slice(s.indexOf('Direkt'), s.indexOf('Direkt') + 140));
  }

  console.log('\nB - Die Anleitung legt den Zyklus am Keimstart an');
  {
    const r = JSON.parse(E('JSON.stringify(FIRST_GROW_STEPS.slice(1, 3).map(x => ({ t: x.title, d: x.duration, c: x.content })))'));
    pruef('Schritt 2 (Keimen) legt den Zyklus an: „Heute ist Tag 1"', /Keimen|keimen/.test(r[0].t) && /Heute ist Tag 1/.test(r[0].c) && /Zyklus/.test(r[0].c), r[0].d);
    pruef('Schritt 3 (Einpflanzen) ist nicht mehr „Tag 1" und legt keinen Zyklus an', r[1].d !== 'Tag 1' && !/neuen Zyklus anlegen mit heutigem Startdatum/.test(r[1].c), r[1].d);
  }

  console.log('\nC - Der Eintrag an Tag 1 und 2 folgt der Keimmethode');
  {
    const LAGE = (m, tag) => `(function(){
      S.cycles = []; S.entries = {}; S.beginnerMode = true;
      const c = addCyc({ name: 'Keim', seedType: 'auto', medium: 'erde' });
      c.startDate = '2026-06-01'; c.startMethod = 'saturated'; c.potSize = 11;
      ${m ? `c.germMethod = '${m}';` : 'delete c.germMethod;'}
      saveS();
      const iso = isoPlus(c.startDate, ${tag - 1}); setDebugDate(iso);
      openEntry(iso);
      const t = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
      const h = t.match(/✅ Heute:(.*?)⛔ Vermeiden:(.*?)💡/) || ['', '', ''];
      return JSON.stringify({ a: getAction(iso, c), heute: h[1].trim(), vermeiden: h[2].trim(), steps: GERM_GUIDES[${m ? `'${m}'` : "'paper'"}].steps, karte: /Keimung — wie keimst du/.test(t) });
    })()`;
    for (const m of ['paper', 'water', 'direct', null]) {
      const r1 = JSON.parse(E(LAGE(m, 1)));
      const name = m || 'keine Wahl (Papiertuch wie die Karte)';
      pruef(`${name}, Tag 1: „Keimstart" + erster Schritt der Karte, kein „einpflanzen"`,
        r1.a === 'saettigung' && r1.karte && /Keimstart/.test(r1.heute) && r1.heute.includes(r1.steps[0]) && !/einpflanzen/i.test(r1.heute),
        r1.heute);
      pruef(`${name}, Tag 1: Vermeiden ist ein echter Fehler, nicht „Kontrolliertes Gießen"`,
        !/Kontrolliertes Gießen/.test(r1.vermeiden) && r1.vermeiden.length > 10, r1.vermeiden);
      const r2 = JSON.parse(E(LAGE(m, 2)));
      const erwartet = (m === 'paper' || m === null) ? r2.steps[2] : r2.steps[1];
      pruef(`${name}, Tag 2: Schritt der Karte (${(erwartet || '').slice(0, 30)}…), weiter nur Sprühen`,
        r2.a === 'sprueh' && r2.heute.includes(erwartet), r2.heute);
    }
  }

  console.log('\nD - „Keimling sichtbar" wird angeboten, solange es passieren kann');
  {
    const chips = (tag) => JSON.parse(E(`(function(){
      const c = S.cycles[0]; const iso = isoPlus(c.startDate, ${tag - 1});
      return JSON.stringify(getSmartQuickNotes(c, phase(iso, c), {}, iso).map(x => x.label));
    })()`));
    pruef('Tag 7: „Keimling sichtbar" steht zur Wahl', chips(7).includes('Keimling sichtbar'), chips(7).join(', '));
    pruef('Tag 11: nicht mehr', !chips(11).includes('Keimling sichtbar'), chips(11).join(', '));
  }

  console.log('\nE - Lexikon und Quelltext');
  {
    const lex = JSON.parse(E(`JSON.stringify(LEXIKON.flatMap(k => k.items || []).filter(i => /^Sättigungsguss|^Vorbefeuchtet/.test(i.t)))`));
    pruef('Lexikon: Sättigungsguss und Vorbefeuchten gefunden', lex.length === 2, lex.map(i => i.t).join(', '));
    const lt = JSON.stringify(lex);
    pruef('Lexikon: beide sprechen von Tag 1, nicht vom Einpflanzen', !/Einpflanz|einpflanz/.test(lt) && /Tag 1/.test(lt), (lt.match(/.{0,60}[Ee]inpflanz.{0,40}/) || [''])[0]);
    const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    const alt = src.match(/Tag des Einpflanzens|Einpflanztag|Pflanztag|Startdatum \(Tag 1\)</g) || [];
    pruef('Quelltext: keine Stelle nennt Tag 1 noch Einpflanz- oder Pflanztag', alt.length === 0, alt.join(' | '));
    pruef('Eine Quelle für die Keimmethode (_keimMethode)', /function _keimMethode\(/.test(src) && !/c\.germMethod && GERM_GUIDES\[c\.germMethod\]\) \? c\.germMethod : 'paper'/.test(src.replace(/function _keimMethode[\s\S]*?\n\}/, '')));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
