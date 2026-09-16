/**
 * (v1.5.213) Keimung: eine Zahlenbasis (KEIMUNG) statt widersprüchlicher Angaben (Keimungs-Prüfung, Schritte 1, 2, 10, 11).
 *
 * Keimungskarte, Anleitung und Lexikon nannten verschiedene Zahlen für dieselbe Sache: Keimwurzel beim Einsetzen 2–3 mm, 2–5 mm
 * oder „~0,5–1 cm", Wasserglas höchstens 32 oder 48 Stunden, der Keimling nach 3–7 Tagen, 5–10 Tagen oder „Tag 3–5", Saattiefe
 * 5 mm oder 1 cm. Belege: Geneve et al. 2022 (Keimwurzel bei 22–26 °C im Median nach 23–37 h), Lisson et al. 2000 (Auflaufen aus
 * 1 cm nach 3,3–3,9 Tagen), Pereira et al. 2018 (nach dem Durchbruch nicht mehr austrocknungsfest).
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
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  const code = quelle.split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');

  console.log('\nA - Die Zahlenbasis');
  let r = null;
  try {
    r = JSON.parse(E(`JSON.stringify({ k: KEIMUNG, t: KLIMA_ZIEL.saemling.temp, g: GERM_GUIDES, f: FIRST_GROW_STEPS.map(x => x.content || '').join(' '), lex: JSON.stringify(LEXIKON) })`));
  } catch (e) { pruef('KEIMUNG gibt es', false, String(e && e.message || e).slice(0, 120)); }
  pruef('KEIMUNG ist genau einmal deklariert', (quelle.match(/const KEIMUNG = \{/g) || []).length === 1);
  if (r) {
    const k = r.k;
    pruef('Werte: Glas 12–24 h, Keimwurzel 2–5 mm nach 1–3 Tagen, aufgeben nach 7, Tiefe 0,5–1 cm (höchstens 2), Auflaufen Tag 4–7, nachsehen ab Tag 10',
      k.glasStdVon === 12 && k.glasStdBis === 24 && k.wurzelMmVon === 2 && k.wurzelMmBis === 5 && k.wurzelTageVon === 1 && k.wurzelTageBis === 3 && k.wurzelTageAufgeben === 7
      && k.tiefeCmVon === 0.5 && k.tiefeCmBis === 1 && k.tiefeCmMax === 2 && k.auflaufenVon === 4 && k.auflaufenBis === 7 && k.nachsehenAbTag === 10, JSON.stringify(k));

    console.log('\nB - Keimungskarte');
    const g = r.g, temp = r.t[0] + '–' + r.t[1] + ' °C';
    pruef('Drei Methoden mit je vier Schritten (Plätze für die Sämlings-Pflege bleiben)', ['water', 'paper', 'direct'].every(m => g[m] && g[m].steps.length === 4));
    pruef('Wasserglas: 12–24 Stunden, nie länger', /12–24 Stunden herausnehmen — nie länger/.test(g.water.steps[1]), g.water.steps[1]);
    pruef('Tuch: Keimwurzel nach 1–3 Tagen, einsetzen bei 2–5 mm', /1–3 Tagen/.test(g.paper.steps[2]) && /2–5 mm/.test(g.paper.steps[2]), g.paper.steps[2]);
    pruef('Temperatur aus KLIMA_ZIEL.saemling (' + temp + ')', g.paper.steps[0].includes(temp) && g.direct.steps[1].includes(temp), g.paper.steps[0]);
    pruef('Direkt: 0,5–1 cm tief, Keimling Tag 4–7, nachsehen ab Tag 10', /0,5–1 cm tief/.test(g.direct.steps[0]) && /Tag 4 und 7/.test(g.direct.steps[2]) && /Tag 10/.test(g.direct.steps[3]));

    console.log('\nC - Anleitung und Lexikon');
    pruef('Anleitung: 12–24 Stunden, 0,5–1 cm, Tag 4–7', /12–24 Stunden/.test(r.f) && /0,5–1 cm tief/.test(r.f) && /Tag 4–7: Der Keimling durchbricht die Erde/.test(r.f), r.f.slice(0, 80));
    pruef('Lexikon „Keimung": Glas 12–24 h, Keimwurzel 2–5 mm, Tag 4–7, nachsehen ab Tag 10',
      /12–24 h, dann heraus/.test(r.lex) && /Keimwurzel 2–5 mm \(bis dahin im feuchten Tuch\)/.test(r.lex) && /meist Tag 4–7 — nachsehen erst ab Tag 10/.test(r.lex));
  }

  console.log('\nD - Die alten Zahlen und unbelegten Zusagen stehen nirgends mehr (Quelltext ohne Kommentare)');
  [
    [/höchstens 32 h|Nicht länger als ~32 h/, '„höchstens 32 h"'],
    [/48 h — danach|Über 48 h|Spätestens nach 48 h/, '„48 h"'],
    [/2–3 mm Wurzel|Keimwurzel 2–3 mm/, '„2–3 mm"'],
    [/Pfahlwurzel \(~0,5–1 cm\)/, '„Pfahlwurzel ~0,5–1 cm"'],
    [/5 mm — nicht tiefer/, '„5 mm — nicht tiefer"'],
    [/Tag 3–5: Erster Keimling|Tag 7: Erste echte Blätter|Samen sollten absinken/, '„Tag 3–5", „Tag 7: Erste echte Blätter", „absinken"'],
    [/Keimrate <50%|90–100% bei guter Genetik|zwischen 90% und 50% Keimrate/, 'Keimraten'],
    [/Aloe Vera-Konzentrat ~2\.5/, 'Aloe als Keim-Booster'],
    // Nur bei der Keimung falsch (Quellung) — bei der Wasseraufnahme der Wurzel ist Osmose richtig (ANBAU.md 5).
    [/Der Samen nimmt durch <b>Osmose<\/b>/, '„Osmose" bei der Keimung'],
    [/Natürlich 6\.8–7\.0|pH 6\.8–7\.0 ist ideal/, '„pH 6,8–7,0 ideal"'],
    [/Pflicht für 70–80% RLF/, '„Haube Pflicht für 70–80 %"'],
  ].forEach(([re, name]) => pruef('Nirgends: ' + name, !re.test(code)));

  // (v1.5.215) Der Sprüh-Auslöser: Der Samen liegt 0,5–1 cm tief. „Sobald die obersten 1–2 cm trocken sind"
  // heißt, dass der Samen selbst schon trocken liegt — und stand als Karte direkt unter der Keimungskarte,
  // die seit v1.5.213 „wird sie dort oben hell" sagt. Zwei Auslöser für dieselbe Handlung, untereinander.
  console.log('\nE - Der Sprüh-Auslöser steht an der Erde am Samen');
  {
    const spr = JSON.parse(E(`(function(){
      S.cycles = []; S.entries = {}; S.beginnerMode = true;
      const c = addCyc({ name: 'Keim', seedType: 'auto', medium: 'erde' });
      c.startDate = '2026-06-01'; c.startMethod = 'saturated'; c.potSize = 11; saveS();
      const tag = (n) => { const iso = isoPlus(c.startDate, n - 1); const p = phase(iso, c); const a = getAction(iso, c); return { iso, p, a }; };
      const t3 = tag(3), t9 = tag(9), t15 = tag(15);
      setDebugDate(t3.iso);
      return JSON.stringify({
        a3: t3.a,
        satz: plainSentence(t3.a, c, t3.p, waterSuggestion(c, t3.p)),
        schritte: getTodayAction(c, t3.p, t3.a, t3.iso).steps.join(' | '),
        platzhalter: getAutoFillTemplate(c, t3.p, t3.a, t3.iso).notePlaceholder || '',
        a9: t9.a, hinweis9: getTodayAction(c, t9.p, t9.a, t9.iso).hint,
        a15: t15.a, hinweis15: getTodayAction(c, t15.p, t15.a, t15.iso).hint,
      });
    })()`));
    pruef('Tag 3 ist ein Sprüh-Tag, Tag 9 und 15 sind Anzucht-Güsse', spr.a3 === 'sprueh' && spr.a9 === 'giess_anz' && spr.a15 === 'giess_anz', spr.a3 + ' / ' + spr.a9 + ' / ' + spr.a15);
    pruef('Satz auf der Startseite nennt die Stelle, nicht die Tiefe', /Erde direkt am Samen oder am Keimling oben hell wird/.test(spr.satz) && !/1–2 cm|1-2cm/.test(spr.satz), spr.satz.slice(0, 140));
    pruef('Schritt der Tageskarte ebenso', /Erde direkt über dem Samen oder um den Keimling hell/.test(spr.schritte) && !/obersten 1/.test(spr.schritte), spr.schritte.slice(0, 140));
    pruef('Vorschlagstext beim Ausfüllen ebenso', /Erde am Samen oder Keimling, sobald sie dort oben hell wird/.test(spr.platzhalter), spr.platzhalter.slice(0, 140));
    pruef('Tag 9 (Sämling steht noch): „Erde am Keimling feucht"', /Erde am Keimling feucht/.test(spr.hinweis9), spr.hinweis9);
    pruef('Tag 15 (kein Sämling mehr): wieder der Topf-Hinweis', /Obere 1–2 cm dürfen antrocknen/.test(spr.hinweis15), spr.hinweis15);
    pruef('Nirgends im Quelltext ein Sprüh-Text mit „obere 1–2 cm"',
      (code.match(/.{80}(obersten 1|obere 1-?.2 ?cm|1-2cm).{80}/g) || []).filter(t => /[Ss]prüh|besprühen/.test(t)).length === 0);
  }

  // (v1.5.216) Die Sämlings-Pflege sagte an Tag 3 „Beobachten ob Keimblätter durchbrechen" (nach KEIMUNG
  // kommt der Keimling erst Tag 4–7) und an Tag 7 „Erste richtige Blätter da!" — beides als Tatsache.
  console.log('\nF - Sämlings-Pflege Tag 3–7');
  {
    const pflege = (germ, startM, tag) => JSON.parse(E(`(function(){
      S.cycles = []; S.entries = {}; S.beginnerMode = true;
      const c = addCyc({ name: 'Keim', seedType: 'auto', medium: 'erde' });
      c.startDate = '2026-06-01'; c.startMethod = '${startM}'; c.potSize = 11; c.germMethod = '${germ}'; saveS();
      const iso = isoPlus(c.startDate, ${tag - 1}); setDebugDate(iso); openEntry(iso);
      const t = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
      const box = (t.match(/Sämlings-Pflege[^]{0,700}/) || [''])[0];
      return JSON.stringify({ box, heute: (box.match(/✅ Heute:(.*?)⛔/) || ['', ''])[1].trim() });
    })()`));
    const t3direkt = pflege('direct', 'saturated', 3), t3tuch = pflege('paper', 'saturated', 3);
    pruef('Tag 3, Direkt in Erde: „zu sehen ist noch nichts" statt „Keimblätter durchbrechen"',
      /zu sehen ist noch nichts/.test(t3direkt.heute) && !/Keimblätter durchbrechen/.test(t3direkt.heute), t3direkt.heute);
    pruef('Tag 3, Papiertuch: Keimwurzel 2–5 mm, heute einsetzen', /2–5 mm lang: heute einsetzen/.test(t3tuch.heute), t3tuch.heute);
    const t4 = pflege('direct', 'saturated', 4);
    pruef('Tag 4: noch nichts zu sehen ist normal bis Tag 7', /Normal bis Tag 7/.test(t4.heute), t4.heute);
    const t5s = pflege('direct', 'saturated', 5), t5d = pflege('direct', 'direct', 5);
    pruef('Tag 5, vorbefeuchtet: sprühen, gegossen wird ab Tag 9', /gegossen wird erst ab Tag 9/.test(t5s.heute), t5s.heute);
    pruef('Tag 5, ohne Vorbefeuchten: kein „ab Tag 9", sondern die Menge von oben', !/ab Tag 9/.test(t5d.heute) && /Ring um den Keimling/.test(t5d.heute), t5d.heute);
    const t7 = pflege('direct', 'saturated', 7);
    pruef('Tag 7: „ab Tag 10 nachsehen" statt „Erste richtige Blätter da"',
      /ab Tag 10 vorsichtig nachsehen/.test(t7.heute) && !/Erste richtige Blätter da/.test(t7.heute), t7.heute);
    pruef('Grundregeln: Klima aus KLIMA_ZIEL (22–26 °C, VPD 0.4–0.8), keine feste RLF-Zahl 65–75',
      /22–26 °C/.test(t7.box) && /VPD 0\.4–0\.8 kPa/.test(t7.box) && !/65–75% RLF/.test(t7.box), (t7.box.match(/Klima:[^•]*/) || [''])[0]);
    pruef('Grundregeln: Wassermenge steht oben im Eintrag, nicht als Faustzahl „~50–150 ml"',
      /die Menge für jeden Gießtag steht oben im Eintrag/.test(t7.box) && !/50–150 ml/.test(t7.box), (t7.box.match(/Wasser:[^•]*/) || [''])[0]);
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
