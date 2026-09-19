/**
 * v1.5.288 — Die automatische Sicherungskopie wird nie still kleiner, und der Hauptstand geht vor den Kopien.
 *
 * Gemessen am 17.09.2026 (Hebel 3): Ein unlesbarer oder beschädigter Hauptstand ließ die App leer
 * starten, und der erste Speichervorgang am Folgetag ersetzte die Kopie mit 111 Einträgen durch eine
 * mit 0 — stiller Totalverlust. Dazu löschte der catch in `_autoBackup` bei vollem Speicher die
 * vorhandene Kopie, so dass danach gar keine mehr da war.
 *
 * Dieser Test stellt jede dieser Lagen her, statt nur Texte zu suchen.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

// GS_INDEX erlaubt den Lauf gegen einen anderen Build — damit lässt sich zeigen, dass dieser Test
// den alten Stand wirklich umwirft (sonst prüft er nur sich selbst).
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');
const SICHERUNG = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const SK = 'growsmart_v4', BAK = 'growsmart_v4_bak', BAK2 = 'growsmart_v4_bak2';

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

/** speicher: { schlüssel: text }. quota: jsdom-Grenze in Zeichen. datum: setDebugDate nach dem Start. */
async function load(speicher, opts = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: vc,
    ...(opts.quota ? { storageQuota: opts.quota } : {}),
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true;
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
      Object.keys(speicher).forEach(k => { if (speicher[k] !== null) w.localStorage.setItem(k, speicher[k]); });
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 80));
  const toasts = [];
  window.eval('window.__toasts = [];');
  window.toast = (t) => { toasts.push(String(t)); window.__toasts.push(String(t)); };
  if (opts.datum) window.eval(`setDebugDate('${opts.datum}')`);
  return {
    window, errors, toasts,
    E: (s) => window.eval(s),
    get: (k) => window.localStorage.getItem(k),
    beschreibe: (k) => {
      const roh = window.localStorage.getItem(k);
      if (roh === null) return 'FEHLT';
      try {
        const d = JSON.parse(roh);
        let daten = 0;
        Object.keys(d.entries || {}).forEach(x => { daten += Object.keys((d.entries[x] || {}).cycleData || {}).length; });
        return { zyklen: (d.cycles || []).length, eintraege: Object.keys(d.entries || {}).length, daten, datum: d._bakDate || null, len: roh.length };
      } catch (e) { return 'UNLESBAR len=' + roh.length; }
    },
  };
}

/** Kopie-Text aus Patricks Sicherung mit gesetztem _bakDate (wie _backupJSON: ohne Fotos). */
function kopieText(datum, mut) {
  const st = JSON.parse(SICHERUNG);
  if (mut) mut(st);
  st._bakDate = datum;
  return JSON.stringify(st, (k, v) => (k === 'photos' ? [] : v));
}
function standText(mut) {
  const st = JSON.parse(SICHERUNG);
  if (mut) mut(st);
  return JSON.stringify(st);
}
const LEER = JSON.stringify({ cycles: [], entries: {}, _disclaimerAcceptedAt: '2026-05-01' });

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + JSON.stringify(info) : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  // ================= A · Die Kopie rückt nach, statt überschrieben zu werden =================
  console.log('\nA - Tageskopie rückt nach (BAK -> BAK2)');
  {
    const a = await load({ [SK]: standText(), [BAK]: kopieText('2026-09-16') }, { datum: '2026-09-17' });
    pruef('A1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    pruef('A2 Ausgangslage: Kopie vom 16.09. mit 111 Einträgen', a.beschreibe(BAK).eintraege === 111, a.beschreibe(BAK));
    pruef('A3 vorher gibt es keine zweite Kopie', a.get(BAK2) === null);
    a.E('saveS()');
    const b2 = a.beschreibe(BAK2), b1 = a.beschreibe(BAK);
    pruef('A4 die alte Kopie steht jetzt als zweite Kopie', b2.eintraege === 111 && b2.datum === '2026-09-16', b2);
    pruef('A5 die jüngste Kopie trägt das heutige Datum', b1.datum === '2026-09-17' && b1.eintraege === 111, b1);
  }

  // ================= B · Der gemessene Verlustfall: leerer Stand frisst die Kopie =================
  console.log('\nB - Leerer Hauptstand ersetzt die Kopie nicht mehr');
  {
    const a = await load({ [SK]: LEER, [BAK]: kopieText('2026-09-16') }, { datum: '2026-09-17' });
    pruef('B1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    pruef('B2 Ausgangslage: 0 Zyklen im Hauptstand', a.E('S.cycles.length') === 0);
    a.E('saveS()');
    pruef('B3 Tag 1: die zweite Kopie hält die 111 Einträge', a.beschreibe(BAK2).eintraege === 111, a.beschreibe(BAK2));
    pruef('B4 Tag 1: die jüngste Kopie ist der leere Stand von heute', a.beschreibe(BAK).eintraege === 0, a.beschreibe(BAK));
    // Folgetage: die zweite Kopie darf NICHT nachrücken
    for (const tag of ['2026-09-18', '2026-09-19', '2026-09-22']) {
      a.E(`setDebugDate('${tag}'); saveS()`);
    }
    pruef('B5 nach vier weiteren Tagen hält die zweite Kopie weiter 111 Einträge',
      a.beschreibe(BAK2).eintraege === 111 && a.beschreibe(BAK2).datum === '2026-09-16', a.beschreibe(BAK2));
    const bi = a.E('JSON.stringify(_backupInfo())');
    const info = JSON.parse(bi);
    pruef('B6 _backupInfo nennt beide Kopien', (info.kopien || []).length === 2, (info.kopien || []).map(k => k.entries));
    pruef('B7 _backupInfo meldet die größere Kopie', !!info.groesser && info.groesser.entries === 111, info.groesser);
    a.E('goTo("set"); S._setUI = S._setUI || {}; S._setUI.data = true; renderSet()');
    const html = a.E('document.getElementById("scr-set").innerHTML');
    pruef('B8 Einstellungen bieten beide Kopien zum Laden an',
      (html.match(/restoreAutoBackup\(/g) || []).length === 2, (html.match(/restoreAutoBackup\('[^']+'\)/g) || []));
    pruef('B9 Einstellungen sagen, dass eine Kopie mehr enthält', /enthält deutlich mehr als dein jetziger Stand/.test(html));
  }

  // ================= I · Ist nur für eine Kopie Platz, bleibt die Tageskopie trotzdem frisch =================
  console.log('\nI - Platz für nur eine Kopie: die Tageskopie altert nicht ein');
  {
    const stand = standText(), kopie = kopieText('2026-09-16');
    const quota = SK.length + stand.length + BAK.length + kopie.length + 1500;
    const a = await load({ [SK]: stand, [BAK]: kopie }, { datum: '2026-09-17', quota });
    pruef('I1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    a.E('saveS()');
    pruef('I2 die zweite Kopie passt nicht in den Speicher', a.get(BAK2) === null);
    pruef('I3 die Tageskopie ist trotzdem von heute', a.beschreibe(BAK).datum === '2026-09-17', a.beschreibe(BAK));
    pruef('I4 und hat weiter alle Einträge', a.beschreibe(BAK).eintraege === 111, a.beschreibe(BAK));
  }

  // ================= C · Tagebuch weg, Datums-Schlüssel da (der Fall, der bisher durchrutschte) =================
  console.log('\nC - Verlust der cycleData zählt als deutlich kleiner');
  {
    const ohneDaten = standText(st => {
      Object.keys(st.entries || {}).forEach(d => { if (st.entries[d]) st.entries[d].cycleData = {}; });
    });
    const a = await load({ [SK]: ohneDaten, [BAK]: kopieText('2026-09-16') }, { datum: '2026-09-17' });
    pruef('C1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    pruef('C2 Ausgangslage: 111 Datums-Schlüssel, aber 0 Tagebuch-Einträge',
      a.beschreibe(SK).eintraege === 111 && a.beschreibe(SK).daten === 0, a.beschreibe(SK));
    a.E('saveS()');
    pruef('C3 Tag 1: zweite Kopie hat das Tagebuch', a.beschreibe(BAK2).daten > 100, a.beschreibe(BAK2));
    a.E("setDebugDate('2026-09-18'); _autoBackup._fehlerAm = 0; saveS()");
    pruef('C4 Tag 2: die zweite Kopie behält das Tagebuch', a.beschreibe(BAK2).daten > 100, a.beschreibe(BAK2));
    // Und die Begründung dafür direkt am Maß
    pruef('C5 _deutlichKleiner erkennt den reinen Tagebuch-Verlust',
      a.E('typeof _deutlichKleiner === "function" && _deutlichKleiner({zyklen:1,eintraege:111,daten:0},{zyklen:1,eintraege:111,daten:111})') === true);
    pruef('C6 ohne das Tagebuch-Maß wäre es nicht aufgefallen',
      a.E('typeof _deutlichKleiner === "function" && _deutlichKleiner({zyklen:1,eintraege:111,daten:111},{zyklen:1,eintraege:111,daten:111})') === false);
    pruef('C7 ein gewolltes kleines Minus gilt nicht als deutlich kleiner',
      a.E('typeof _deutlichKleiner === "function" && _deutlichKleiner({zyklen:1,eintraege:60,daten:60},{zyklen:1,eintraege:111,daten:111})') === false);
  }

  // ================= D · Scheitert die Kopie, bleibt die alte stehen =================
  console.log('\nD - Kein Platz für eine zweite Kopie und ein geschrumpfter Stand: die Kopie bleibt');
  {
    // Die schlimmste gemessene Lage in einem: Hauptstand leer (weil unlesbar geladen), Kopie von
    // gestern mit allem drin, und der Speicher hat keinen Platz für eine zweite Generation.
    const kopie = kopieText('2026-09-16');
    const quota = SK.length + LEER.length + BAK.length + kopie.length + 1500;
    const a = await load({ [SK]: LEER, [BAK]: kopie }, { datum: '2026-09-17', quota });
    pruef('D1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    a.E('saveS()');
    pruef('D2 die Kopie mit 111 Einträgen ist unberührt', a.beschreibe(BAK).eintraege === 111 && a.beschreibe(BAK).datum === '2026-09-16', a.beschreibe(BAK));
    pruef('D3 der Fehlschlag ist vermerkt', a.E('_autoBackup._fehler') === 'voll', a.E('_autoBackup._fehler'));
    a.E('goTo("set"); S._setUI = S._setUI || {}; S._setUI.data = true; renderSet()');
    const html = a.E('document.getElementById("scr-set").innerHTML');
    pruef('D4 die Einstellungen sagen es', /Zuletzt ließ sich keine neue Kopie anlegen/.test(html));
    pruef('D5 und behaupten nicht mehr, eine werde beim nächsten Speichern angelegt',
      !/wird beim nächsten Speichern angelegt/.test(html));
    pruef('D6 der Hinweis steht schon am zugeklappten Kopf', /Sicherungskopie nicht angelegt/.test(html));
  }

  // ================= E · Der Hauptstand geht vor den Kopien =================
  console.log('\nE - Bei vollem Speicher wird eine Kopie geopfert, nicht der Eintrag');
  {
    const stand = standText(), k1 = kopieText('2026-09-17'), k2 = kopieText('2026-09-16');
    // Genug für Hauptstand + zwei Kopien, aber nicht für einen deutlich größeren Hauptstand.
    const quota = SK.length + stand.length + BAK.length + k1.length + BAK2.length + k2.length + 2000;
    const a = await load({ [SK]: stand, [BAK]: k1, [BAK2]: k2 }, { datum: '2026-09-17', quota });
    pruef('E1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    const vorher = a.beschreibe(SK).len;
    // Eine große Notiz, die ohne Aufräumen nicht mehr passt
    a.E(`S.entries['2026-09-17'] = S.entries['2026-09-17'] || {}; S.entries['2026-09-17'].note = 'x'.repeat(8000); saveS()`);
    pruef('E2 der Eintrag ist gespeichert', (a.beschreibe(SK).len - vorher) > 7000, { vorher, nachher: a.beschreibe(SK).len });
    pruef('E3 die Notiz steht wirklich im Speicher', /x{8000}/.test(a.get(SK)));
    pruef('E4 dafür ist die ältere Kopie weg', a.get(BAK2) === null);
    pruef('E5 die jüngste Kopie steht noch', a.beschreibe(BAK).eintraege === 111, a.beschreibe(BAK));
    pruef('E6 der Nutzer erfährt es', a.toasts.some(t => /Platz war knapp/.test(t)), a.toasts);
    pruef('E7 es wird nicht sofort eine neue Kopie angelegt', a.get(BAK2) === null && a.E('_autoBackup._fehler') === 'voll');
  }

  // ================= F · Eine beschädigte Lage opfert die letzte Kopie nicht =================
  console.log('\nF - Ein geschrumpfter Stand verdrängt die letzte Kopie nicht');
  {
    const k1 = kopieText('2026-09-17');
    const quota = SK.length + LEER.length + BAK.length + k1.length + 200;
    const a = await load({ [SK]: LEER, [BAK]: k1 }, { datum: '2026-09-17', quota });
    pruef('F1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    a.E(`S.entries['2026-09-17'] = { note: 'y'.repeat(4000) }; saveS()`);
    pruef('F2 die Kopie mit 111 Einträgen steht noch', a.beschreibe(BAK).eintraege === 111, a.beschreibe(BAK));
    pruef('F3 und der Nutzer bekommt die Speicher-voll-Meldung',
      a.toasts.some(t => /Speicher voll/.test(t)), a.toasts);
  }

  // ================= G · Laden einer bestimmten Kopie =================
  console.log('\nG - Die zweite Kopie lässt sich gezielt laden');
  {
    const a = await load({ [SK]: LEER, [BAK]: kopieText('2026-09-17', st => { st.entries = {}; }), [BAK2]: kopieText('2026-09-16') },
      { datum: '2026-09-17' });
    pruef('G1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    let dialog = null;
    a.window.customConfirm = (titel, text) => { dialog = titel + '\n' + text; return Promise.resolve(true); };
    a.window.eval('window.__r = restoreAutoBackup("growsmart_v4_bak2")');
    await new Promise(r => setTimeout(r, 60));
    pruef('G2 der Dialog nennt Datum und Umfang der gewählten Kopie',
      !!dialog && /16\.09/.test(dialog) && /1 Zyklus und 111 Einträgen/.test(dialog), dialog);
    pruef('G3 danach steht die Kopie im Hauptstand', a.beschreibe(SK).eintraege === 111, a.beschreibe(SK));
    pruef('G4 ohne das Kopie-Datum im Stand', !/_bakDate/.test(a.get(SK)));
    pruef('G5 kein Fachwort "JSON-Backup" mehr im Dialog', !/JSON-Backup/.test(dialog));
  }

  // ================= H · Speicheranzeige =================
  console.log('\nH - Die Speicheranzeige zählt die zweite Kopie mit');
  {
    const stand = standText(), k1 = kopieText('2026-09-17'), k2 = kopieText('2026-09-16');
    const a = await load({ [SK]: stand, [BAK]: k1, [BAK2]: k2 }, { datum: '2026-09-17' });
    const own = a.E('_storageInfo().ownBytes');
    pruef('H1 ownBytes enthält alle drei Schlüssel', own >= stand.length + k1.length + k2.length, { own, soll: stand.length + k1.length + k2.length });
  }

  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  process.exit(fail ? 1 : 0);
})();
