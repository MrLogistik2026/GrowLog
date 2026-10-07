/**
 * Zyklus-Datei: Import fügt Zyklen hinzu, statt den Stand zu ersetzen (v1.5.337, 07.10.2026).
 *
 * Prüft mit Patricks Sicherung als bestehendem Stand: was dazukommt, was unverändert bleibt, dass nichts doppelt
 * entsteht, dass jeder ungültige Wert die ganze Datei ablehnt, dass bei gesperrtem oder scheiterndem Speichern nichts
 * nur im Arbeitsspeicher landet, und dass ↩ den ganzen Import in einem Schritt zurücknimmt.
 * Bewusst neutrale Pflanzennamen — echte Bezeichnungen gehören nie in einen Test.
 * Läuft über GS_INDEX auch gegen einen älteren Build und fällt dort um.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, process.env.GS_INDEX || 'index.html'), 'utf8');
const SICHERUNG = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const SK = 'growsmart_v4';
const HEUTE = '2026-10-07';

function fakeCtx() {
  const noop = () => {};
  return new Proxy({}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 0 }) : (k === 'createLinearGradient' || k === 'createRadialGradient') ? () => ({ addColorStop: noop }) : (k === 'getImageData' ? () => ({ data: [] }) : noop)) });
}

async function load(opts = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => { const m = String((e && e.message) || e); if (!/Not implemented/i.test(m)) errors.push(m); });
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.localStorage.setItem(SK, SICHERUNG);
      w.HTMLCanvasElement.prototype.getContext = function () { return fakeCtx(); };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      const orig = w.Storage.prototype.setItem;
      w.Storage.prototype.setItem = function (k, v) { if (k === SK && w.__kaputt) { const e = new Error('kaputt'); throw e; } return orig.call(this, k, v); };
    },
  });
  const w = dom.window;
  await new Promise((r) => setTimeout(r, 1200));
  const E = (s) => w.eval(s);
  E(`setDebugDate('${HEUTE}')`);
  const dialoge = [], toasts = [];
  w.customConfirm = (t, m) => { dialoge.push(String(t) + '\n' + String(m)); return Promise.resolve(opts.antwort !== false); };
  w.toast = (t) => toasts.push(String(t));
  // Wie Patrick: Run 01 abschließen, bevor Run 02 kommt
  E("(() => { const c = S.cycles[0]; c.archived = true; c.active = false; c.endDate = '2026-09-06'; saveS._lastUndo = 0; saveS(); })()");
  return { w, E, errors, dialoge, toasts, laden: (p) => (w.eval("typeof _zyklenPaketLaden === 'function'") ? w.eval('_zyklenPaketLaden')(JSON.parse(JSON.stringify(p))) : Promise.resolve('fehlt')) };
}

const zyklus = (name, start, n, notizen) => ({
  name, startDate: start, seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 15, anzuchtDays: 26, bloomDays: 70,
  startMethod: 'direct', germMethod: 'water', lightVeg: '20/4', lightBloom: '20/4', fertPreset: 'rainbow_auto', strain: 'Sorte X',
  pflanzen: Array.from({ length: n }, (_, i) => ({ label: `${name} Pflanze ${i + 1}`, strain: 'Sorte X' })), notizen: notizen || {},
});
const PAKET = { _type: 'growsmart_zyklen', version: 1, paketId: 'test-paket', zyklen: [
  zyklus('Gruppe A', '2026-09-20', 4, { '2026-09-21': 'Gesät.', '2026-09-25': 'Durchgebrochen.' }),
  zyklus('Gruppe B', '2026-09-26', 2, { '2026-10-01': 'Durchgebrochen.' }),
] };

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + JSON.stringify(info).slice(0, 300) : '')); }
}

// Eine nicht abgefangene Ausnahme im Import (alter Stand) soll als Befund zählen, nicht den Lauf abbrechen.
process.on('unhandledRejection', (e) => { console.log('  (nicht abgefangen: ' + ((e && e.message) || e) + ')'); });

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('\nZ - Hinzufügen');
  {
    const a = await load();
    const vorher = JSON.parse(a.E('JSON.stringify({ z: S.cycles.length, e: Object.keys(S.entries).length, run01: S.cycles[0], plaene: S.fertPlans.length })'));
    const r = await a.laden(PAKET);
    const s = JSON.parse(a.E('JSON.stringify(S)'));
    const A = s.cycles.find(c => c.name === 'Gruppe A'), B = s.cycles.find(c => c.name === 'Gruppe B');
    pruef('Z1 zwei Zyklen dazu, Run 01 unverändert', r === true && s.cycles.length === vorher.z + 2 && JSON.stringify(s.cycles[0]) === JSON.stringify(vorher.run01));
    pruef('Z2 der Dialog sagt „kommen dazu", nicht „ersetzt"', a.dialoge.some(d => /Zyklen hinzufügen/.test(d) && /kommen dazu/.test(d) && !/ersetzt/.test(d)), a.dialoge);
    pruef('Z3 Einstellungen wie in der Datei', A && A.startDate === '2026-09-20' && A.anzuchtDays === 26 && A.bloomDays === 70 && A.potSize === 15 && A.medium === 'erde'
      && A.germMethod === 'water' && A.startMethod === 'direct' && A.lightVeg === '20/4' && A.plantCount === 4 && A.plants.length === 4 && B.plants.length === 2);
    pruef('Z4 Pflanzennamen und Sorten übernommen', A.plants.every((p, i) => p.label === `Gruppe A Pflanze ${i + 1}` && p.strain === 'Sorte X'));
    const plan = s.fertPlans.find(p => p.presetKey === 'rainbow_auto');
    pruef('Z5 beide am Rainbow-Plan, angelegt aus der Vorlage mit Rückgrat', plan && A.fertPlanId === plan.id && B.fertPlanId === plan.id && Array.isArray(plan.weekPhases), plan && Object.keys(plan));
    pruef('Z6 Notizen im Tagebuch, keine Messwerte', s.entries['2026-09-21'].cycleData[A.id].notes === 'Gesät.' && s.entries['2026-10-01'].cycleData[B.id].notes === 'Durchgebrochen.'
      && !Object.values(s.entries).some(e => e.cycleData && [A.id, B.id].some(id => e.cycleData[id] && (e.cycleData[id].water !== undefined || e.cycleData[id].ph !== undefined))));
    pruef('Z7 im Speicher angekommen', JSON.parse(a.w.localStorage.getItem(SK)).cycles.length === vorher.z + 2);
    pruef('Z8 Kennungen eindeutig, Herkunft vermerkt', new Set(s.cycles.map(c => c.id)).size === s.cycles.length && A.paketId === 'test-paket');
    a.toasts.length = 0;
    const r2 = await a.laden(PAKET);
    pruef('Z9 noch einmal laden: nichts doppelt, mit Hinweis', r2 === false && a.E('S.cycles.length') === vorher.z + 2 && a.toasts.some(t => /schon angelegt/.test(t)), a.toasts);
    const r3 = await a.laden({ _type: 'growsmart_zyklen', paketId: 'zweites', zyklen: [zyklus('Gruppe C', '2026-10-01', 1)] });
    pruef('Z10 ein zweites Paket nimmt den vorhandenen Rainbow-Plan, statt einen zweiten anzulegen', r3 === true && a.E("S.fertPlans.filter(p => p.presetKey === 'rainbow_auto').length") === 1);
    a.E('doUndo()');
    pruef('Z11 ↩ nimmt einen Import in einem Schritt zurück', !a.E("S.cycles.some(c => c.name === 'Gruppe C')") && a.E("S.cycles.some(c => c.name === 'Gruppe A')"));
    pruef('Z12 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  console.log('\nU - Ungültige Dateien ändern nichts');
  {
    const a = await load();
    const vorher = a.E('JSON.stringify(S)');
    const kaputt = [
      ['Startdatum ungültig', (p) => { p.zyklen[0].startDate = '2026-02-30'; }],
      ['Substrat unbekannt', (p) => { p.zyklen[0].medium = 'sand'; }],
      ['Notiz in der Zukunft', (p) => { p.zyklen[0].notizen['2026-12-24'] = 'x'; }],
      ['Notiz vor dem Start', (p) => { p.zyklen[0].notizen['2026-09-01'] = 'x'; }],
      ['keine Pflanzen', (p) => { p.zyklen[0].pflanzen = []; }],
      ['zwei gleiche Namen', (p) => { p.zyklen[1].name = 'Gruppe A'; }],
      ['Vorlage unbekannt', (p) => { p.zyklen[0].fertPreset = 'gibtsnicht'; }],
      ['abgelöste Vorlage', (p) => { p.zyklen[0].fertPreset = 'biobizz_official'; }],
      ['Anzucht unsinnig', (p) => { p.zyklen[0].anzuchtDays = 2; }],
      ['Licht unbekannt', (p) => { p.zyklen[0].lightVeg = '25/0'; }],
      ['keine Zyklen', (p) => { p.zyklen = []; }],
      // (v1.5.339) Kein HTML: Namen landen ungefiltert im Seitenaufbau
      ['Zyklusname mit HTML', (p) => { p.zyklen[0].name = 'A<img src=x onerror=alert(1)>'; }],
      ['Pflanzenname mit HTML', (p) => { p.zyklen[0].pflanzen[0].label = '<b>fett</b>'; }],
      ['Sorte mit spitzer Klammer', (p) => { p.zyklen[0].pflanzen[0].strain = 'X > Y'; }],
      ['Zyklus-Sorte mit HTML', (p) => { p.zyklen[0].strain = '<svg onload=alert(1)>'; }],
      ['Notiz mit Skript', (p) => { p.zyklen[0].notizen['2026-09-22'] = '<script>alert(1)</script>'; }],
    ];
    for (const [name, mach] of kaputt) {
      const p = JSON.parse(JSON.stringify(PAKET)); mach(p);
      a.toasts.length = 0;
      const r = await a.laden(p);
      pruef(`U ${name}: abgelehnt mit Grund, Stand unverändert`, r === false && a.E('JSON.stringify(S)') === vorher && a.toasts.some(t => /lässt sich nicht laden \(/.test(t) && /unverändert/.test(t)), a.toasts);
    }
    const p = JSON.parse(JSON.stringify(PAKET)); p.paketId = 'zeichen'; p.zyklen = [zyklus('Gruppe "A" & B · 1', '2026-09-20', 1)];
    const r = await a.laden(p);
    // (v1.5.366) Erlaubt, aber typografisch umgesetzt: das gerade Anführungszeichen wird ”, & und · bleiben.
    pruef('U Anführungszeichen, & und · sind erlaubt', r === true && a.E("S.cycles.some(c => c.name === 'Gruppe ”A” & B · 1')"), a.E("JSON.stringify(S.cycles.map(c => c.name))"));
  }

  console.log('\nH - Härtung gegen präparierte Dateien (v1.5.340)');
  {
    const a = await load();
    const vorher = a.E('JSON.stringify(S)');
    const roh = (zyk) => JSON.parse(JSON.stringify({ _type: 'growsmart_zyklen', paketId: 'h', zyklen: [zyk] }));
    const mitProto = (extra) => { const t = JSON.stringify(zyklus('Gruppe H', '2026-09-20', 1)); return JSON.parse(t.replace(/^\{/, '{"__proto__":' + JSON.stringify(extra) + ',')); };
    for (const [name, z] of [
      ['__proto__ mit Licht-Nutzlast', mitProto({ lightVeg: '<img src=x onerror=window.__pwn=1>' })],
      ['__proto__ mit unbekannter Vorlage', mitProto({ fertPreset: 'nix' })],
      ['Substrat „constructor"', Object.assign(zyklus('Gruppe H', '2026-09-20', 1), { medium: 'constructor' })],
      ['Substrat „toString"', Object.assign(zyklus('Gruppe H', '2026-09-20', 1), { medium: 'toString' })],
      ['Keimmethode „constructor"', Object.assign(zyklus('Gruppe H', '2026-09-20', 1), { germMethod: 'constructor' })],
      ['Vorlage „constructor"', Object.assign(zyklus('Gruppe H', '2026-09-20', 1), { fertPreset: 'constructor' })],
    ]) {
      a.toasts.length = 0;
      const r = await a.laden(roh(z));
      pruef(`H ${name}: abgelehnt mit Grund, Stand unverändert`, r === false && a.E('JSON.stringify(S)') === vorher && a.toasts.some(t => /lässt sich nicht laden/.test(t)), a.toasts);
    }
    pruef('H _keimMethode nimmt nur eigene Einträge', a.E("_keimMethode({ germMethod: 'constructor' })") === 'direct' && a.E("_keimMethode({ germMethod: 'water' })") === 'water');
    // Anführungszeichen im Namen: kein eingeschleustes Attribut in Einstellungen und Kalender
    const name = 'Z" data-pwn="1" onfocus="window.__pwn=1" x="';
    const r = await a.laden({ _type: 'growsmart_zyklen', paketId: 'q', zyklen: [zyklus(name, '2026-09-20', 1), zyklus('Q2', '2026-09-20', 1)] });
    // (v1.5.366) Der Name wird typografisch umgesetzt (" → ”) — gesucht wird deshalb über den Anfang „Z" und den zweiten Buchstaben.
    a.E("(() => { const c = S.cycles.find(x => /^Z[\"”]/.test(x.name)); selId = c.id; draft = { ...c }; S._setUI = S._setUI || {}; S._setUI.cyc_identity = true; goTo('set'); renderSet(); })()");
    const feld = a.w.document.getElementById('cyc-name-input');
    pruef('H Name mit Anführungszeichen: angelegt, das Namensfeld trägt keine fremden Attribute', r === true && !!feld && !feld.hasAttribute('data-pwn') && !feld.hasAttribute('onfocus') && feld.value === a.E(`typeof _freitextSauber === 'function' ? _freitextSauber(${JSON.stringify(name)}) : ${JSON.stringify(name)}`), feld && feld.outerHTML.slice(0, 160));
    a.E("goTo('cal'); renderCal()");
    pruef('H … und auch im Kalender nicht', !a.w.document.querySelector('[data-pwn], [ontouchstart*="__pwn"], [onfocus*="__pwn"]'));
    // Über den Knopf „Import": eine Datei, die beim Laden wirft, meldet sich statt still zu bleiben
    let inp = null;
    const ce = a.w.document.createElement.bind(a.w.document);
    a.w.document.createElement = (t) => { const el = ce(t); if (t === 'input') { inp = el; el.click = () => {}; } return el; };
    a.E("window.__alt = _zyklenPaketLaden; _zyklenPaketLaden = () => { throw new Error('Testfehler'); }");
    a.toasts.length = 0;
    a.E('importData()');
    await inp.onchange({ target: { files: [new a.w.File([JSON.stringify(PAKET)], 'z.json', { type: 'application/json' })] } });
    await new Promise((res) => setTimeout(res, 300));
    a.E('_zyklenPaketLaden = window.__alt');
    pruef('H wirft das Laden, sagt der Knopf „Import" es', a.toasts.some(t => /lässt sich nicht laden \(Testfehler\)/.test(t)), a.toasts);
    pruef('H keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  console.log('\nS - Kein Hinzufügen nur im Arbeitsspeicher');
  {
    const a = await load();
    const z = a.E('S.cycles.length');
    a.E('_fremdGeschrieben = true');
    const r = await a.laden(PAKET);
    pruef('S1 kann gerade nicht gespeichert werden: nichts kommt dazu, mit Hinweis', r === false && a.E('S.cycles.length') === z && a.toasts.some(t => /kann GrowSmart nicht speichern/.test(t)), a.toasts);
    const b = await load();
    const zb = b.E('S.cycles.length');
    b.w.__kaputt = true;
    const rb = await b.laden(PAKET);
    pruef('S2 Speichern scheitert: zurückgenommen, nichts nur im Arbeitsspeicher', rb === false && b.E('S.cycles.length') === zb && !b.E("S.cycles.some(c => c.name === 'Gruppe A')"));
    b.w.__kaputt = false;
    const c = await load({ antwort: false });
    const zc = c.E('S.cycles.length');
    const rc = await c.laden(PAKET);
    pruef('S3 „Abbrechen": nichts kommt dazu', rc === false && c.E('S.cycles.length') === zc);
  }

  console.log('\nR - Rückweg ohne Halbes (v1.5.341)');
  {
    // Speichern scheitert: Speicher, Arbeitsstand und Rückgängig-Stapel wie vorher
    const a = await load();
    const roh = a.w.localStorage.getItem(SK), st = a.E('JSON.stringify(S)'), stapel = a.E('undoStack.length');
    a.w.__kaputt = true;
    a.toasts.length = 0;
    const r = await a.laden(PAKET);
    a.w.__kaputt = false;
    pruef('R1 Speichern scheitert: Speicher und Arbeitsstand unverändert, Meldung „Nicht angelegt"', r === false && a.w.localStorage.getItem(SK) === roh && a.E('JSON.stringify(S)') === st && a.toasts.some(t => /Nicht angelegt/.test(t)), a.toasts);
    pruef('R2 … und keine Zwischenmeldung „… erstellt"', !a.toasts.some(t => /erstellt — Start/.test(t)), a.toasts);
    pruef('R3 … und der Rückgängig-Stapel wie vorher', a.E('undoStack.length') === stapel);
    a.E("S.entries['2026-10-06'] = { note: 'danach' }; saveS._lastUndo = 0; saveS()");
    a.E('doUndo(); doUndo()');
    pruef('R4 normal weiter, zweimal ↩: der nicht angelegte Zyklus taucht nicht auf', !a.E("S.cycles.some(c => c.name === 'Gruppe A')") && !JSON.parse(a.w.localStorage.getItem(SK)).cycles.some(c => c.name === 'Gruppe A'));
  }
  {
    // Ausnahme mitten im Anlegen
    const b = await load();
    const roh = b.w.localStorage.getItem(SK);
    b.E("window.__n = 0; window.__orig = addCyc; addCyc = (o, opt) => { if (++window.__n === 2) throw new Error('Testfehler'); return window.__orig(o, opt); }");
    const r = await b.laden(PAKET);
    b.E('addCyc = window.__orig');
    pruef('R5 Ausnahme beim zweiten Zyklus: nichts Halbes im Speicher, nichts im Arbeitsstand', r === false && b.w.localStorage.getItem(SK) === roh && !b.E("S.cycles.some(c => c.name === 'Gruppe A')"));
    const r2 = await b.laden(PAKET);
    pruef('R6 danach noch einmal laden: beide Zyklen, keiner doppelt', r2 === true && b.E("S.cycles.filter(c => c.name === 'Gruppe A').length") === 1 && b.E("S.cycles.filter(c => c.name === 'Gruppe B').length") === 1);
  }
  {
    // Langsames Gerät: jeder Zyklus „dauert" 3 Sekunden — trotzdem ein Rückgängig-Schritt
    const c = await load();
    const z = c.E('S.cycles.length');
    c.E("window.__dn = Date.now; window.__plus = 0; Date.now = () => window.__dn() + (window.__plus += 3000)");
    const r = await c.laden(PAKET);
    c.E('Date.now = window.__dn');
    c.E('doUndo()');
    pruef('R7 langsamer Import: ein ↩ nimmt ihn ganz zurück', r === true && c.E('S.cycles.length') === z, c.E('S.cycles.map(x => x.name)'));
    pruef('R8 keine JS-Fehler', c.errors.length === 0, c.errors[0]);
  }

  console.log('\nP - Plan, Substrat und Doppelte (v1.5.342)');
  {
    // Eine selbst geänderte Kopie der Vorlage liegt schon da
    const a = await load();
    a.E("(() => { const id = _planFuerVorlage('rainbow_auto'); const p = S.fertPlans.find(x => x.id === id); p.name = 'Rainbow Düngeplan (v1.0)'; const w = p.schedule.w3; const k = Object.keys(w)[0]; w[k] = 9.9; window.__kopie = id; saveS(); })()");
    pruef('P0 die geänderte Kopie gilt nicht als gleich der Vorlage, eine frische schon', a.E('_planGleichVorlage(S.fertPlans.find(x => x.id === window.__kopie))') === false
      && a.E("(() => { const id = _planFuerVorlage('rainbow_auto', { neu: true }); const r = _planGleichVorlage(S.fertPlans.find(x => x.id === id)); S.fertPlans = S.fertPlans.filter(x => x.id !== id); return r; })()") === true);
    a.dialoge.length = 0;
    const r = await a.laden(PAKET);   // customConfirm antwortet „ja" = Vorlage nehmen
    const A = JSON.parse(a.E("JSON.stringify(S.cycles.find(c => c.name === 'Gruppe A'))")), B = JSON.parse(a.E("JSON.stringify(S.cycles.find(c => c.name === 'Gruppe B'))"));
    pruef('P1 abweichende Kopie: vorher die Frage „weicht ab"', a.dialoge.some(d => /weicht ab/.test(d) && /Vorlage nehmen/.test(d) && /Meine Kopie/.test(d)), a.dialoge.map(d => d.slice(0, 60)));
    pruef('P2 „Vorlage nehmen": eine frische Kopie für beide Zyklen, die eigene bleibt', r === true && A.fertPlanId === B.fertPlanId && A.fertPlanId !== a.E('window.__kopie')
      && a.E("S.fertPlans.filter(p => p.presetKey === 'rainbow_auto').length") === 2 && a.E(`_planGleichVorlage(S.fertPlans.find(p => p.id === '${A.fertPlanId}'))`) === true);
    pruef('P3 der Dialog nennt den Plan, der genommen wird', a.dialoge.some(d => /Zyklen hinzufügen/.test(d) && /frische Kopie/.test(d)));
    const b = await load({ antwort: false });
    b.E("(() => { const id = _planFuerVorlage('rainbow_auto'); const p = S.fertPlans.find(x => x.id === id); const w = p.schedule.w3; w[Object.keys(w)[0]] = 9.9; window.__kopie = id; saveS(); })()");
    // erste Frage („weicht ab") → nein = meine Kopie; der Hinzufügen-Dialog bekäme auch nein — deshalb einzeln antworten
    let n = 0; b.w.customConfirm = (t, m) => { b.dialoge.push(t + '\n' + m); n++; return Promise.resolve(n !== 1); };
    const rb = await b.laden(PAKET);
    pruef('P4 „Meine Kopie": die neuen Zyklen bekommen die eigene Kopie, keine zweite', rb === true && b.E("S.cycles.find(c => c.name === 'Gruppe A').fertPlanId") === b.E('window.__kopie') && b.E("S.fertPlans.filter(p => p.presetKey === 'rainbow_auto').length") === 1
      && b.dialoge.some(d => /mit deinen Dosen/.test(d)));
    // Substrat passt nicht zur Vorlage
    const c = await load();
    const roh = JSON.parse(JSON.stringify(PAKET)); roh.zyklen[0].medium = 'coco';
    c.toasts.length = 0;
    const rc = await c.laden(roh);
    pruef('P5 Coco-Zyklus mit Erd-Plan: abgelehnt mit Grund', rc === false && c.toasts.some(t => /Düngeplan ist für Erde, der Zyklus läuft in Coco/.test(t)), c.toasts);
    // Von Hand angelegt, gleicher Name und Start
    c.E("addCyc({ name: 'Gruppe A', startDate: '2026-09-20', potSize: 15, plantCount: 4 })");
    const z = c.E('S.cycles.length');
    const rd = await c.laden(PAKET);
    pruef('P6 von Hand angelegter Zyklus gleichen Namens und Starts: nicht doppelt, der andere kommt dazu', rd === true && c.E('S.cycles.length') === z + 1 && c.E("S.cycles.filter(x => x.name === 'Gruppe A').length") === 1
      && c.dialoge.some(d => /Schon angelegt und übersprungen: Gruppe A/.test(d)));
    pruef('P7 keine JS-Fehler', a.errors.length === 0 && b.errors.length === 0 && c.errors.length === 0, a.errors[0] || b.errors[0] || c.errors[0]);
  }

  console.log('\nV - Mehrere Vorlagen in einer Datei (v1.5.345)');
  {
    const a = await load();
    const keys = JSON.parse(a.E("JSON.stringify(Object.keys(FERT_PRESETS).filter(k => _vorlageWaehlbar(k) && FERT_PRESETS[k].medium === 'erde' && !S.fertPlans.some(p => p.presetKey === k)).slice(0, 4))"));
    const p = { _type: 'growsmart_zyklen', paketId: 'vier', zyklen: keys.map((k, i) => Object.assign(zyklus('V' + i, '2026-09-20', 1), { fertPreset: k })) };
    a.E("window.__dn = Date.now; Date.now = () => 1791000000000");   // alle in derselben Millisekunde
    const r = await a.laden(p);
    a.E('Date.now = window.__dn');
    const ok4 = JSON.parse(a.E(`JSON.stringify(${JSON.stringify(keys)}.map((k, i) => { const c = S.cycles.find(x => x.name === 'V' + i); const pl = S.fertPlans.find(x => x.id === c.fertPlanId); return pl && pl.presetKey === k; }))`));
    pruef(`V1 ${keys.length} Vorlagen in derselben Millisekunde: jeder Zyklus am Plan seiner Vorlage`, r === true && keys.length === 4 && ok4.every(Boolean), { keys, ok4 });
    pruef('V2 alle Plan-Kennungen und Produkt-Kennungen verschieden', a.E('new Set(S.fertPlans.map(p => p.id)).size === S.fertPlans.length')
      && a.E('(() => { const ids = S.fertPlans.flatMap(p => (p.products || []).map(x => x.id)); return new Set(ids).size === ids.length; })()'));
    // Nach dem Speichern wirft nur das Zeichnen: keine Meldung „unverändert"
    const b = await load();
    b.E("window.__goTo = goTo; goTo = () => { throw new Error('Zeichenfehler'); }");
    b.toasts.length = 0;
    const rb = await b.laden(PAKET);
    b.E('goTo = window.__goTo');
    pruef('V3 scheitert nur das Zeichnen nach dem Speichern: Erfolg gemeldet, gespeichert', rb === true && !b.toasts.some(t => /unverändert/.test(t)) && JSON.parse(b.w.localStorage.getItem(SK)).cycles.some(c => c.name === 'Gruppe A'), b.toasts);
  }

  console.log('\nI - Der Knopf „Import" erkennt die Zyklus-Datei');
  {
    const a = await load();
    const z = a.E('S.cycles.length');
    let inp = null;
    const ce = a.w.document.createElement.bind(a.w.document);
    a.w.document.createElement = (t) => { const el = ce(t); if (t === 'input') { inp = el; el.click = () => {}; } return el; };
    a.E('importData()');
    const datei = new a.w.File([JSON.stringify(PAKET)], 'zyklen.json', { type: 'application/json' });
    await inp.onchange({ target: { files: [datei] } });
    await new Promise((r) => setTimeout(r, 300));
    pruef('I1 Import mit einer Zyklus-Datei fügt hinzu, ersetzt nicht', a.E('S.cycles.length') === z + 2 && !a.E('_neuladenAnsteht'), [a.E('S.cycles.length'), z]);
    pruef('I2 keine JS-Fehler', a.errors.length === 0, a.errors[0]);
  }

  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  if (fail) process.exit(1);
  process.exit(0);
})().catch((e) => { console.log('FEHLER: ' + (e && e.stack || e)); process.exit(1); });
