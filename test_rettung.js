/**
 * v1.5.290 — Ein unbrauchbarer Hauptstand wird aufgehoben, die Sicherungskopie geladen, und die App sagt es.
 *
 * Gemessen (Hebel 3, Störfälle 1, 2 und 4): `loadS` hatte ein try um die ganze Schleife und ein leeres
 * catch. Ein abgeschnittener growsmart_v4 beendete die Suche, die Tageskopie wurde nie versucht, die App
 * startete leer — und der erste Speichervorgang (Zustimmung zum Haftungsausschluss) schrieb den leeren
 * Stand über die beschädigten Bytes.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');
const SICHERUNG = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const SK = 'growsmart_v4', BAK = 'growsmart_v4_bak', BAK2 = 'growsmart_v4_bak2';
const RET = 'growsmart_v4_rettung', RET_INFO = 'growsmart_v4_rettung_info';

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

/** opts: quota (Zeichen), antwort (was customConfirm liefert), warten (ms nach dem Start). */
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
      w.URL.createObjectURL = () => 'blob:test';
      Object.keys(speicher).forEach(k => { if (speicher[k] !== null) w.localStorage.setItem(k, speicher[k]); });
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 30));
  const dialoge = [], toasts = [], downloads = [];
  window.customConfirm = (titel, text) => { dialoge.push(String(titel) + '\n' + String(text)); return Promise.resolve(!!opts.antwort); };
  window.toast = (t) => { toasts.push(String(t)); };
  // Download abfangen: a.click() auf einem Element mit download-Attribut
  const clickOrig = window.HTMLElement.prototype.click;
  window.HTMLElement.prototype.click = function () {
    if (this.tagName === 'A' && this.getAttribute('download')) { downloads.push(this.getAttribute('download')); return; }
    return clickOrig.apply(this, arguments);
  };
  await new Promise((r) => setTimeout(r, opts.warten === undefined ? 600 : opts.warten));
  return {
    window, errors, dialoge, toasts, downloads,
    E: (s) => window.eval(s),
    get: (k) => window.localStorage.getItem(k),
    warte: (ms) => new Promise(r => setTimeout(r, ms)),
  };
}

function kopieText(datum) {
  const st = JSON.parse(SICHERUNG);
  st._bakDate = datum;
  return JSON.stringify(st, (k, v) => (k === 'photos' ? [] : v));
}
const KAPUTT = SICHERUNG.slice(0, Math.floor(SICHERUNG.length * 0.6));
const gestern = () => { const d = new Date(Date.now() - 86400000); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + JSON.stringify(info).slice(0, 300) : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  // ================= A · Unlesbarer Hauptstand, Kopie von gestern =================
  console.log('\nA - Unlesbarer Hauptstand: Kopie laden, Rohtext aufheben, es sagen');
  {
    const a = await load({ [SK]: KAPUTT, [BAK]: kopieText(gestern()) });
    pruef('A1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    pruef('A2 die Kopie ist geladen', a.E('S.cycles.length') === 1 && a.E('Object.keys(S.entries).length') === 111,
      { z: a.E('S.cycles.length'), e: a.E('Object.keys(S.entries).length') });
    pruef('A3 der beschädigte Stand liegt unverändert auf dem Rettungsplatz', a.get(RET) === KAPUTT,
      (a.get(RET) || '').length);
    const info = JSON.parse(a.get(RET_INFO) || 'null');
    pruef('A4 mit Grund und Herkunft', info && info.grund === 'nicht lesbar' && info.geladen === 'kopie' && info.aufgehoben === true, info);
    pruef('A5 das Kopie-Datum steht nicht im Arbeitsstand', a.E('S._bakDate') === undefined);
    pruef('A6 die App sagt es beim Start', a.dialoge.some(d => /Sicherungskopie geladen/.test(d)), a.dialoge[0]);
    pruef('A7 und nennt Umfang und aufgehobenen Stand',
      a.dialoge.some(d => /1 Zyklus, 111 Einträge/.test(d) && /aufgehoben/.test(d)), a.dialoge[0]);
    pruef('A8 kein Versprechen, das die App nicht hält',
      !a.dialoge.some(d => /lassen sich fehlende Einträge noch retten/.test(d)));
    pruef('A9 gespeichert wird normal weiter', a.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === false);
    a.E("S.entries['2026-09-19'] = { note: 'Pruefung' }; saveS()");
    pruef('A10 und der Hauptstand ist danach lesbar mit 111 Einträgen',
      Object.keys(JSON.parse(a.get(SK)).entries).length >= 111, (a.get(SK) || '').length);
  }

  // ================= B · Die fünf Formen eines kaputten Schlüssels =================
  console.log('\nB - Alle Formen eines unbrauchbaren Hauptstands');
  for (const [name, wert] of [['null', 'null'], ['[]', '[]'], ['{', '{'], ['Steuerzeichen', '\u0000\u0001\u0002']]) {
    const a = await load({ [SK]: wert, [BAK]: kopieText(gestern()) }, { warten: 400 });
    pruef(`B "${name}": Kopie geladen, Rohtext aufgehoben`,
      a.E('S.cycles.length') === 1 && a.get(RET) === wert && a.errors.length === 0,
      { zyklen: a.E('S.cycles.length'), ret: a.get(RET), fehler: a.errors[0] });
  }

  // ================= C · Ohne Kopie startet die App leer — sagt es aber =================
  console.log('\nC - Ohne Kopie: leer, aber nicht stumm');
  {
    const a = await load({ [SK]: KAPUTT });
    pruef('C1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    pruef('C2 0 Zyklen', a.E('S.cycles.length') === 0);
    pruef('C3 der Rohtext ist aufgehoben', a.get(RET) === KAPUTT);
    // Ohne Zyklen steht der Haftungsausschluss davor — der Hinweis wartet, bis er weg ist.
    pruef('C3b solange der Haftungsausschluss offen ist, wartet der Hinweis', a.dialoge.length === 0, a.dialoge[0]);
    a.E('_acceptDisclaimer()');
    await a.warte(900);
    pruef('C4 die App sagt, dass sie leer startet', a.dialoge.some(d => /startet leer/.test(d)), a.dialoge[0]);
    pruef('C5 und nennt den Weg über Import', a.dialoge.some(d => /Import/.test(d)));
  }

  // ================= D · Ältere Daten hinter einem kaputten Schlüssel =================
  console.log('\nD - Ältere App-Version hinter kaputtem Hauptstand');
  {
    const a = await load({ [SK]: KAPUTT, growsmart_v3: JSON.stringify(JSON.parse(SICHERUNG)) });
    pruef('D1 die älteren Daten sind geladen', a.E('S.cycles.length') === 1, a.E('S.cycles.length'));
    pruef('D2 der Hinweis nennt die frühere App-Version', a.dialoge.some(d => /Ältere Daten geladen/.test(d)), a.dialoge[0]);
    pruef('D3 der Rohtext ist aufgehoben', a.get(RET) === KAPUTT);
  }

  // ================= E · Kein Platz zum Aufheben: die App speichert nicht =================
  console.log('\nE - Ist der Stand nirgends aufgehoben, speichert die App nicht');
  {
    const fremd = JSON.stringify({ cycles: [], entries: {}, _fremd: 1 });
    const a = await load({
      [SK]: KAPUTT, [BAK]: kopieText(gestern()),
      [RET]: fremd, [RET_INFO]: JSON.stringify({ am: Date.now(), heruntergeladen: false }),
    });
    pruef('E1 der Rettungsplatz ist belegt und wird nicht verdrängt', a.get(RET) === fremd);
    pruef('E2 die Speichersperre greift', a.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === true);
    const vorher = a.get(SK);
    a.E("S.entries['2026-09-19'] = { note: 'darf nicht gespeichert werden' }; saveS()");
    pruef('E3 der beschädigte Stand wird nicht überschrieben', a.get(SK) === vorher);
    pruef('E4 und der Nutzer erfährt es', a.toasts.some(t => /Nicht gespeichert/.test(t)), a.toasts);
    const anzahl = a.toasts.filter(t => /Nicht gespeichert/.test(t)).length;
    a.E("S.entries['2026-09-19'] = { note: 'zweiter Versuch' }; saveS()");
    pruef('E5 jedes Mal, ohne Drosselung', a.toasts.filter(t => /Nicht gespeichert/.test(t)).length > anzahl,
      a.toasts.filter(t => /Nicht gespeichert/.test(t)).length);
    pruef('E6 der rote Punkt steht', a.E("(document.querySelectorAll('div')).length > 0 && typeof _rotIndicator !== 'undefined' && !!_rotIndicator && _rotIndicator.style.opacity === '1'"));
  }

  // ================= F · Herunterladen hebt die Sperre erst nach Bestätigung auf =================
  console.log('\nF - Die Sperre fällt erst, wenn die Datei wirklich da ist');
  {
    const fremd = JSON.stringify({ cycles: [], entries: {}, _fremd: 1 });
    const speicher = { [SK]: KAPUTT, [BAK]: kopieText(gestern()), [RET]: fremd, [RET_INFO]: JSON.stringify({ am: Date.now(), heruntergeladen: false }) };
    // (a) Nutzer sagt „Nein, liegt nicht vor"
    const a = await load(speicher, { antwort: false });
    a.E('_rettungHerunterladen()');
    await a.warte(80);
    pruef('F1 heruntergeladen wurde etwas', a.downloads.length === 1, a.downloads);
    pruef('F2 nach „Nein" bleibt die Sperre', a.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === true);
    // (b) Nutzer bestätigt
    const b = await load(speicher, { antwort: true });
    b.E('_rettungHerunterladen()');
    await b.warte(120);
    pruef('F3 nach „Ja" fällt die Sperre', b.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === false);
    b.E("S.entries['2026-09-19'] = { note: 'jetzt geht es' }; saveS()");
    pruef('F4 und die App speichert wieder', (b.get(SK) || '').indexOf('jetzt geht es') > 0);
  }

  // ================= G · Ein gesunder Stand merkt von alldem nichts =================
  console.log('\nG - Gesunder Stand: kein Rettungsplatz, kein Dialog, keine Sperre');
  {
    const a = await load({ [SK]: SICHERUNG, [BAK]: kopieText(gestern()) });
    pruef('G1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    pruef('G2 kein Rettungsschlüssel', a.get(RET) === null);
    pruef('G3 kein Start-Dialog', a.dialoge.length === 0, a.dialoge[0]);
    pruef('G4 keine Sperre', a.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === false);
    pruef('G5 die Daten sind da', a.E('Object.keys(S.entries).length') === 111);
  }

  // ================= H · App-Update bei bleibendem Schaden sperrt nicht neu =================
  console.log('\nH - Derselbe Schaden beim nächsten Start: keine neue Sperre');
  {
    const a = await load({
      [SK]: KAPUTT, [BAK]: kopieText(gestern()),
      [RET]: KAPUTT, [RET_INFO]: JSON.stringify({ am: Date.now(), heruntergeladen: false }),
    });
    pruef('H1 keine Sperre, der Stand liegt ja schon dort', a.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === false);
    pruef('H2 der Hinweis kommt trotzdem wieder', a.dialoge.length > 0, a.dialoge[0]);
  }

  // ================= I · Der Weg dorthin steht in den Einstellungen =================
  console.log('\nI - Einstellungen zeigen den aufgehobenen Stand');
  {
    const a = await load({ [SK]: KAPUTT, [BAK]: kopieText(gestern()) });
    a.E('goTo("set"); S._setUI = S._setUI || {}; S._setUI.data = true; renderSet()');
    const html = a.E('document.getElementById("scr-set").innerHTML');
    pruef('I1 die Karte ist da', /Alter Stand aufgehoben/.test(html));
    pruef('I2 mit Knopf zum Herunterladen', /_rettungHerunterladen\(\)/.test(html));
    pruef('I3 und der zugeklappte Kopf sagt es auch', /bitte herunterladen/.test(html));
    pruef('I4 kein falsches Versprechen in der Karte',
      !/lassen sich fehlende Einträge noch retten/.test(html) && /von Hand retten/.test(html));
  }

  // ===== J bis Q: die Befunde der Prüfer an v1.5.290 (behoben in v1.5.291) =====

  console.log('\nJ - Import unter der Sperre behauptet keinen Erfolg');
  {
    const fremd = JSON.stringify({ cycles: [], entries: {}, _fremd: 1 });
    const a = await load({ [SK]: KAPUTT, [RET]: fremd, [RET_INFO]: JSON.stringify({ am: Date.now(), heruntergeladen: false }) });
    pruef('J1 die Sperre steht', a.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === true);
    // Import nachstellen: genau der Zweig, der nach dem Lesen der Datei läuft
    a.E("S = JSON.parse(" + JSON.stringify(JSON.stringify(JSON.parse(SICHERUNG))) + "); const ok = saveS(); window.__importOk = ok;");
    pruef('J2 saveS meldet den Fehlschlag', a.E('window.__importOk') === false, a.E('window.__importOk'));
    pruef('J3 der Hauptstand ist unverändert', a.get(SK) === KAPUTT);
    pruef('J4 kein "Geladen ✓"', !a.toasts.some(t => /Geladen ✓/.test(t)), a.toasts);
    pruef('J5 die Sperre meldet sich', a.toasts.some(t => /Nicht gespeichert/.test(t)), a.toasts);
  }

  console.log('\nK - Ein Rohtext ohne Rettbares sperrt die App nicht');
  {
    const fremd = JSON.stringify({ cycles: [], entries: {}, _fremd: 1 });
    for (const [name, wert] of [['{', '{'], ['null', 'null'], ['[]', '[]']]) {
      const a = await load({ [SK]: wert, [BAK]: kopieText(gestern()), [RET]: fremd, [RET_INFO]: JSON.stringify({ am: Date.now(), heruntergeladen: false }) }, { warten: 400 });
      const gesperrt = a.E("typeof _speicherSperre !== 'undefined' && _speicherSperre");
      a.E("S.entries['2026-09-19'] = { note: 'darf gespeichert werden' }; saveS()");
      pruef(`K "${name}": keine Sperre, und es wird gespeichert`,
        gesperrt === false && (a.get(SK) || '').indexOf('darf gespeichert werden') > 0, { gesperrt, len: (a.get(SK) || '').length });
    }
    // Gegenprobe: ein Rohtext MIT Inhalt sperrt weiterhin
    const b = await load({ [SK]: KAPUTT, [BAK]: kopieText(gestern()), [RET]: fremd, [RET_INFO]: JSON.stringify({ am: Date.now(), heruntergeladen: false }) });
    pruef('K4 ein Rohtext mit Einträgen sperrt weiter', b.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === true);
  }

  console.log('\nL - Der Download stempelt nur den Stand, den er geladen hat');
  {
    const alterSchaden = '{"cycles":[],"entries":{"2026-01-01":{"cycleData":{}}},"_alt":1}' + 'x'.repeat(300);
    const a = await load({
      [SK]: KAPUTT, [BAK]: kopieText(gestern()),
      [RET]: alterSchaden, [RET_INFO]: JSON.stringify({ am: Date.now(), heruntergeladen: false }),
    });
    a.window.customConfirm = () => Promise.resolve(true);
    pruef('L1 die Sperre steht (Platz ist belegt)', a.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === true);
    a.E('_rettungHerunterladen()');
    await a.warte(150);
    pruef('L2 die Sperre ist gefallen', a.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === false);
    const info = JSON.parse(a.get(RET_INFO) || 'null');
    pruef('L3 der geparkte, andere Stand gilt weiter als NICHT heruntergeladen', info && info.heruntergeladen === false, info);
  }

  console.log('\nM - Ein stehendes Band sagt, dass nicht gespeichert wird');
  {
    const fremd = JSON.stringify({ cycles: [], entries: {}, _fremd: 1 });
    const a = await load({ [SK]: KAPUTT, [BAK]: kopieText(gestern()), [RET]: fremd, [RET_INFO]: JSON.stringify({ am: Date.now(), heruntergeladen: false }) });
    a.window.customConfirm = () => Promise.resolve(true);
    pruef('M1 das Band steht', a.E("!!document.getElementById('sperrband')"));
    pruef('M2 und sagt, was zu tun ist', /herunterzuladen/.test(a.E("(document.getElementById('sperrband')||{}).textContent || ''")));
    a.E('_rettungHerunterladen()');
    await a.warte(150);
    pruef('M3 nach dem bestätigten Download ist es weg', a.E("!document.getElementById('sperrband')"));
  }

  console.log('\nN - Beim nächsten Start ist der Vorfall Vergangenheit');
  {
    const a = await load({
      [SK]: JSON.stringify(JSON.parse(SICHERUNG)), [BAK]: kopieText(gestern()),
      [RET]: KAPUTT, [RET_INFO]: JSON.stringify({ am: Date.now() - 86400000, heruntergeladen: false, grund: 'nicht lesbar', geladen: 'kopie', zyklen: 1, eintraege: 111 }),
    });
    pruef('N1 der gesunde Hauptstand ist geladen', a.E('Object.keys(S.entries).length') === 111);
    pruef('N2 der Hinweis ist eine Wiedervorlage', a.dialoge.some(d => /liegt noch aufgehoben/.test(d)), a.dialoge[0]);
    pruef('N3 und behauptet nicht, dass heute etwas fehlt',
      !a.dialoge.some(d => /Was du danach eingetragen hast, fehlt hier/.test(d)), a.dialoge[0]);
    pruef('N4 sondern sagt, dass alles in Ordnung ist', a.dialoge.some(d => /alles in Ordnung/.test(d)));
  }

  console.log('\nO - cycles:null ist ein beschädigter Stand, kein Absturz');
  {
    const kaputtesObjekt = JSON.stringify({ cycles: null, entries: {}, _disclaimerAcceptedAt: '2026-05-01' });
    const a = await load({ [SK]: kaputtesObjekt, [BAK]: kopieText(gestern()) });
    pruef('O1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    pruef('O2 die Kopie ist geladen', a.E('S.cycles.length') === 1 && a.E('Object.keys(S.entries).length') === 111,
      { z: a.E('S.cycles.length'), e: a.E('Object.keys(S.entries).length') });
    pruef('O3 der beschädigte Stand ist aufgehoben', a.get(RET) === kaputtesObjekt);
    pruef('O4 und die App sagt es', a.dialoge.some(d => /Sicherungskopie geladen/.test(d)), a.dialoge[0]);
    // Gegenprobe: ein frischer, leerer Stand gilt NICHT als beschädigt
    const b = await load({ [SK]: JSON.stringify({ _disclaimerAcceptedAt: '2026-05-01' }) }, { warten: 300 });
    pruef('O5 ein leerer Stand ohne cycles gilt als gesund', b.get(RET) === null);
  }

  console.log('\nP - Der inhaltsreichste Ersatzstand gewinnt');
  {
    const leereKopie = JSON.stringify({ cycles: [], entries: {}, _bakDate: '2026-09-18' });
    const a = await load({ [SK]: KAPUTT, [BAK]: leereKopie, [BAK2]: kopieText('2026-09-16') });
    pruef('P1 nicht die leere Tageskopie, sondern die mit 111 Einträgen',
      a.E('Object.keys(S.entries).length') === 111, a.E('Object.keys(S.entries).length'));
    const b = await load({ [SK]: KAPUTT, [BAK]: leereKopie, growsmart_v3: JSON.stringify(JSON.parse(SICHERUNG)) });
    pruef('P2 auch ein voller alter Schlüssel schlägt die leere Kopie',
      b.E('Object.keys(S.entries).length') === 111, b.E('Object.keys(S.entries).length'));
  }

  console.log('\nQ - Die Sicherungskopie meldet unter der Sperre nicht "nicht lesbar"');
  {
    const fremd = JSON.stringify({ cycles: [], entries: {}, _fremd: 1 });
    const a = await load({ [SK]: KAPUTT, [BAK]: kopieText(gestern()), [RET]: fremd, [RET_INFO]: JSON.stringify({ am: Date.now(), heruntergeladen: false }) }, { antwort: true });
    const vorher = a.toasts.length;
    a.E("restoreAutoBackup('growsmart_v4_bak')");
    await a.warte(120);
    pruef('Q1 keine falsche Meldung über eine kaputte Kopie',
      !a.toasts.slice(vorher).some(t => /nicht gelesen werden/.test(t)), a.toasts.slice(vorher));
  }

  // ===== R bis V: die Befunde der Prüfer an v1.5.291 (behoben in v1.5.292) =====

  function standMit(zyklen, eintraege, datum) {
    const cycles = [], entries = {};
    for (let i = 0; i < zyklen; i++) cycles.push({ id: 'c' + i, name: 'Zyklus ' + i, startDate: '2026-05-16', active: i === 0, seedType: 'auto', medium: 'soil' });
    for (let i = 0; i < eintraege; i++) {
      const d = '2026-0' + (1 + (i % 9)) + '-' + String(1 + (i % 28)).padStart(2, '0');
      entries[d] = { cycleData: { c0: { note: 'x' + i } } };
    }
    const st = { cycles, entries, _disclaimerAcceptedAt: '2026-05-01' };
    if (datum) st._bakDate = datum;
    return JSON.stringify(st);
  }

  console.log('\nR - Nach gewolltem Löschen kommt der gelöschte Zyklus nicht zurück');
  {
    // Der gemessene Fall: heute 1 Zyklus mit 25 Einträgen, die vorige Generation hält den Stand
    // von vor dem Löschen (2 Zyklen, 60 Einträge). Der Hauptstand ist unlesbar.
    const a = await load({ [SK]: KAPUTT, [BAK]: standMit(1, 25, '2026-09-19'), [BAK2]: standMit(2, 60, '2026-09-17') });
    pruef('R1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    pruef('R2 geladen wird die heutige Kopie', a.E('S.cycles.length') === 1 && a.E('Object.keys(S.entries).length') === 25,
      { z: a.E('S.cycles.length'), e: a.E('Object.keys(S.entries).length') });
    pruef('R3 der gelöschte Zyklus bleibt gelöscht', a.E('S.cycles.length') === 1);
    // Gegenprobe: ist die heutige Kopie eingebrochen, gewinnt doch die vorige
    const b = await load({ [SK]: KAPUTT, [BAK]: standMit(0, 0, '2026-09-19'), [BAK2]: standMit(2, 60, '2026-09-17') });
    pruef('R4 eine eingebrochene Tageskopie verliert gegen die vorige',
      b.E('Object.keys(S.entries).length') === 60, b.E('Object.keys(S.entries).length'));
  }

  console.log('\nS - Ein alter App-Schlüssel schlägt keine Tageskopie');
  {
    const a = await load({ [BAK]: standMit(1, 25, '2026-09-19'), growsmart_v3: standMit(2, 90) });
    pruef('S1 geladen wird die Tageskopie', a.E('Object.keys(S.entries).length') === 25, a.E('Object.keys(S.entries).length'));
    pruef('S2 und der Start sagt es', a.dialoge.length > 0, a.dialoge[0]);
  }

  console.log('\nT - Ohne Kopie wird der alte Schlüssel genommen — und gemeldet');
  {
    const a = await load({ growsmart_v3: standMit(2, 90) });
    pruef('T1 die älteren Daten sind geladen', a.E('Object.keys(S.entries).length') === 90, a.E('Object.keys(S.entries).length'));
    pruef('T2 der Start meldet es, obwohl der Hauptstand nur fehlte (nicht beschädigt war)',
      a.dialoge.some(d => /Ältere Daten geladen/.test(d)), a.dialoge[0]);
  }

  console.log('\nU - Kaputte Einträge in der Zyklusliste gelten als beschädigt');
  {
    for (const [name, wert] of [['cycles:[null]', '{"cycles":[null],"entries":{}}'],
                                ['cycles:["x"]', '{"cycles":["x"],"entries":{}}'],
                                ['fertPlans als Objekt', '{"cycles":[],"entries":{},"fertPlans":{}}']]) {
      const a = await load({ [SK]: wert, [BAK]: kopieText(gestern()) }, { warten: 400 });
      pruef(`U "${name}": Kopie geladen, kein JS-Fehler`,
        a.E('S.cycles.length') === 1 && a.errors.length === 0, { z: a.E('S.cycles.length'), f: a.errors[0] });
    }
  }

  console.log('\nV - Ein gesunder Stand mit leerer Zyklusliste bleibt gültig');
  {
    const a = await load({ [SK]: JSON.stringify({ cycles: [], entries: {}, fertPlans: [], _disclaimerAcceptedAt: '2026-05-01' }), [BAK]: kopieText(gestern()) }, { warten: 400 });
    pruef('V1 kein Rettungsplatz, kein Dialog', a.get(RET) === null && a.dialoge.length === 0, a.dialoge[0]);
    pruef('V2 und die Kopie wird nicht geladen', a.E('S.cycles.length') === 0);
  }

  // ===== W bis Z: die Verfeinerungen aus der Schlussprüfung (v1.5.293) =====

  console.log('\nW - Eine Kopie mit Einträgen, aber ohne Zyklus, gilt nicht als leer');
  {
    // Nach „Zyklus löschen" bleiben Einträge mit Klimawerten stehen: 0 Zyklen, 50 Einträge.
    // delCyc räumt die cycleData mit weg — übrig bleiben Einträge mit Klimawerten, ohne cycleData.
    const _e = {}; Object.keys(JSON.parse(standMit(0, 50)).entries).forEach(k => { _e[k] = { temp: 22, humidity: 55 }; });
    const ohneZyklus = JSON.stringify({ cycles: [], entries: _e, _bakDate: '2026-09-19' });
    const a = await load({ [SK]: KAPUTT, [BAK]: ohneZyklus, [BAK2]: standMit(1, 40, '2026-09-18') });
    pruef('W1 geladen wird die jüngste Kopie mit den 50 Einträgen',
      a.E('Object.keys(S.entries).length') === 50, a.E('Object.keys(S.entries).length'));
    pruef('W2 der gelöschte Zyklus kommt nicht zurück', a.E('S.cycles.length') === 0);
    // Gegenprobe: wirklich leer (0/0/0) lässt die ältere Generation einspringen
    const b = await load({ [SK]: KAPUTT, [BAK]: JSON.stringify({ cycles: [], entries: {}, _bakDate: '2026-09-19' }), [BAK2]: standMit(1, 40, '2026-09-18') });
    pruef('W3 eine wirklich leere Kopie verliert gegen die vorige',
      b.E('Object.keys(S.entries).length') === 40, b.E('Object.keys(S.entries).length'));
  }

  console.log('\nX - Ein Datum aus der Zukunft dreht die Reihenfolge nicht um');
  {
    // Stand die Geräteuhr einen Tag falsch, trägt die zweite Generation ein Datum in der Zukunft.
    const a = await load({ [SK]: KAPUTT, [BAK]: standMit(1, 111, '2026-09-18'), [BAK2]: standMit(1, 3, '2027-01-01') });
    pruef('X1 geladen wird die jüngere Generation, nicht das größere Datum',
      a.E('Object.keys(S.entries).length') === 111, a.E('Object.keys(S.entries).length'));
    const b = await load({ [SK]: KAPUTT, [BAK]: standMit(1, 111), [BAK2]: standMit(1, 3, '2026-09-17') });
    pruef('X2 auch eine Kopie ohne Datum bleibt die jüngere Generation',
      b.E('Object.keys(S.entries).length') === 111, b.E('Object.keys(S.entries).length'));
  }

  console.log('\nY - Das Nachrücken überschreibt keine reichere zweite Generation');
  {
    const a = await load({ [SK]: KAPUTT, [BAK]: standMit(1, 50, '2026-09-18'), [BAK2]: standMit(1, 90, '2026-09-17') });
    pruef('Y1 geladen wird die jüngste Kopie', a.E('Object.keys(S.entries).length') === 50);
    a.E("setDebugDate('2026-09-19'); saveS()");
    const b2 = JSON.parse(a.get(BAK2) || 'null');
    pruef('Y2 die reichere zweite Kopie steht noch',
      b2 && Object.keys(b2.entries || {}).length === 90, b2 && Object.keys(b2.entries || {}).length);
    pruef('Y3 und die Einstellungen bieten sie an',
      a.E('(_backupInfo().kopien || []).some(k => k.entries === 90)'));
  }

  console.log('\nZ - Eine leere Kopie wird nicht als Rettung ausgegeben');
  {
    const a = await load({ [SK]: KAPUTT, [BAK]: JSON.stringify({ cycles: [], entries: {}, _bakDate: '2026-09-19' }) });
    a.E('_acceptDisclaimer()');
    await a.warte(900);
    pruef('Z1 der Hinweis sagt „startet leer", nicht „Sicherungskopie geladen"',
      a.dialoge.some(d => /startet leer/.test(d)) && !a.dialoge.some(d => /Sicherungskopie geladen/.test(d)), a.dialoge[0]);
  }

  // ===== AA bis AF: beschädigter, aber lesbarer Hauptstand (Hebel 3, Punkt 4 — v1.5.294) =====
  const haupt = (mut) => { const st = JSON.parse(SICHERUNG); mut(st); return JSON.stringify(st); };
  // Eine Kopie von gestern mit 10 Einträgen weniger — so ist sichtbar, welcher Stand geladen wurde.
  const kopie101 = (() => { const st = JSON.parse(SICHERUNG); Object.keys(st.entries).sort().slice(-10).forEach(k => delete st.entries[k]); st._bakDate = gestern(); return JSON.stringify(st, (k, v) => (k === 'photos' ? [] : v)); })();

  console.log('\nAA - Zyklus ohne Kennung: die Kennung kommt aus dem Tagebuch zurück');
  {
    const a = await load({ [SK]: haupt(st => { delete st.cycles[0].id; }), [BAK]: kopie101 });
    pruef('AA1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    pruef('AA2 der Hauptstand bleibt (111 Einträge, nicht die Kopie mit 101)', a.E('Object.keys(S.entries).length') === 111, a.E('Object.keys(S.entries).length'));
    pruef('AA3 der Zyklus hat seine Kennung zurück', a.E("S.cycles.every(c => typeof c.id === 'string' && c.id)"));
    a.E('saveS()');
    const nach = JSON.parse(a.get(SK)); let daten = 0;
    Object.values(nach.entries).forEach(e => { daten += Object.keys((e && e.cycleData) || {}).length; });
    pruef('AA4 nach dem Speichern ist das Tagebuch vollständig da', daten > 100, daten);
    pruef('AA5 der Hinweis sagt „repariert", nicht „Kopie geladen"', a.dialoge.some(d => /repariert/.test(d)) && !a.dialoge.some(d => /Sicherungskopie geladen/.test(d)), a.dialoge[0]);
    pruef('AA6 und keine Sperre', a.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === false);
  }

  console.log('\nAB - Pflanzenliste null: Pflanzen aus der Kopie, Einträge aus dem Hauptstand');
  {
    const a = await load({ [SK]: haupt(st => { st.cycles[0].plants = null; }), [BAK]: kopie101 });
    pruef('AB1 der Hauptstand bleibt (111 Einträge)', a.E('Object.keys(S.entries).length') === 111, a.E('Object.keys(S.entries).length'));
    pruef('AB2 die Einzelernten sind wieder da', a.E("S.cycles[0].plants.filter(p => p.harvestedAt || p.yieldDry || p.yieldWet).length") > 0,
      a.E("JSON.stringify(S.cycles[0].plants.map(p => Object.keys(p)))").slice(0, 200));
    pruef('AB3 der Hinweis nennt die Pflanzenliste', a.dialoge.some(d => /Pflanzenliste/.test(d)), a.dialoge[0]);
  }

  console.log('\nAC - Pflanzenliste als Text, keine Kopie: neu angelegt, Einträge bleiben');
  {
    const a = await load({ [SK]: haupt(st => { st.cycles[0].plants = 'kaputt'; }) });
    pruef('AC1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    pruef('AC2 alle Einträge da', a.E('Object.keys(S.entries).length') === 111);
    pruef('AC3 die Pflanzen sind eine Liste', a.E('Array.isArray(S.cycles[0].plants) && S.cycles[0].plants.length > 0'));
    pruef('AC4 der Hinweis sagt, dass Einzelernten fehlen', a.dialoge.some(d => /Einzelernten fehlen/.test(d)), a.dialoge[0]);
  }

  console.log('\nAD - Düngepläne als Objekt: der Hauptstand bleibt');
  {
    const a = await load({ [SK]: haupt(st => { st.fertPlans = {}; }), [BAK]: kopie101 });
    // Ein LEERES Objekt heißt: die Pläne sind weg, der Zyklus findet seinen nicht mehr — dann hat nur die Kopie sie.
    pruef('AD1 leeres Plan-Objekt: die Kopie mit den Plänen gewinnt', a.E('Object.keys(S.entries).length') === 101, a.E('Object.keys(S.entries).length'));
    pruef('AD2 und der Zyklus findet seinen Plan', a.E('(getPlanForCycle(S.cycles[0]) || {products:[]}).products.length') > 0);
  }

  console.log('\nAE - saveS räumt kein Tagebuch weg, wenn ein Zyklus seine Kennung verliert');
  {
    const a = await load({ [SK]: SICHERUNG });
    a.E('delete S.cycles[0].id; saveS._lastUndo = 0; saveS()');
    const nach = JSON.parse(a.get(SK)); let daten = 0;
    Object.values(nach.entries).forEach(e => { daten += Object.keys((e && e.cycleData) || {}).length; });
    pruef('AE1 das Tagebuch steht noch im Speicher', daten > 100, daten);
  }

  console.log('\nAF - Nicht eindeutig: zwei Zyklen ohne Kennung, zwei Tagebücher → Kopie');
  {
    const a = await load({ [SK]: haupt(st => {
      const c2 = JSON.parse(JSON.stringify(st.cycles[0])); c2.id = 'zweiter';
      st.cycles.push(c2);
      Object.values(st.entries).slice(0, 5).forEach(e => { if (e.cycleData) e.cycleData.zweiter = { note: 'x' }; });
      st.cycles.forEach(c => { delete c.id; });
    }), [BAK]: kopie101 });
    pruef('AF1 geladen wird die Kopie (101), statt Tagebücher zu raten', a.E('Object.keys(S.entries).length') === 101, a.E('Object.keys(S.entries).length'));
  }

  console.log('\nAG - Prüferbefunde vor dem Hochladen (v1.5.294)');
  {
    // Befund 2: Düngepläne als Objekt MIT den echten Plänen — ausgepackt, nicht gelöscht.
    const a = await load({ [SK]: haupt(st => { const o = {}; (st.fertPlans || []).forEach((p, i) => { o['p' + i] = p; }); st.fertPlans = o; }), [BAK]: kopie101 });
    pruef('AG1 die echten Pläne sind alle wieder da', a.E('S.fertPlans.length') === JSON.parse(SICHERUNG).fertPlans.length, a.E('S.fertPlans.length'));
    pruef('AG2 der Zyklus findet seinen Plan mit Produkten', a.E('(getPlanForCycle(S.cycles[0]) || {products:[]}).products.length') > 0);
    pruef('AG3 der Hauptstand bleibt (111)', a.E('Object.keys(S.entries).length') === 111);
    // Befund 1: an der Stelle eines echten Zyklus mit Tagebuch steht null → Kopie, nicht „repariert".
    const zwei = (st) => { const c2 = JSON.parse(JSON.stringify(st.cycles[0])); c2.id = 'zweiter'; st.cycles.push(c2);
      Object.values(st.entries).slice(0, 40).forEach(e => { if (e.cycleData) e.cycleData.zweiter = { note: 'B' }; }); };
    const kopieZwei = (() => { const st = JSON.parse(SICHERUNG); zwei(st); st._bakDate = gestern(); return JSON.stringify(st, (k, v) => (k === 'photos' ? [] : v)); })();
    const b = await load({ [SK]: haupt(st => { zwei(st); st.cycles[1] = null; }), [BAK]: kopieZwei });
    pruef('AG4 der Zyklus mit 40 Einträgen kommt aus der Kopie zurück', b.E('S.cycles.length') === 2, b.E('S.cycles.length'));
    pruef('AG5 kein „vollständig da" über einem verlorenen Zyklus', !b.dialoge.some(d => /vollständig da/.test(d)), b.dialoge[0]);
    // Befund 3: Kennung weg, Tagebuch schon geleert, Kopie hat es noch → Kopie statt neuer Kennung.
    const c = await load({ [SK]: haupt(st => { delete st.cycles[0].id; Object.values(st.entries).forEach(e => { if (e) e.cycleData = {}; }); }), [BAK]: kopie101 });
    let daten = 0; c.E('Object.values(S.entries).map(e => Object.keys((e && e.cycleData) || {}).length)').forEach(n => { daten += n; });
    pruef('AG6 das Tagebuch kommt aus der Kopie, statt eine leere Reparatur „vollständig" zu nennen', daten > 90, daten);
  }

  // ===== AH: leere Stellen in Listen (Hebel 3, Punkt 5 — v1.5.295) =====
  console.log('\nAH - Leere Stellen in Listen: entfernt, kein Absturz, kein Verlust');
  {
    const bildschirme = async (a) => {
      const vorher = a.errors.length;
      for (const s of ['dash', 'cal', 'set']) { try { a.E(`goTo('${s}')`); } catch (e) { a.errors.push(s + ': ' + e.message); } }
      try { a.E('openEntry(todayISO())'); } catch (e) { a.errors.push('eintrag: ' + e.message); }
      await a.warte(50);
      return a.errors.slice(vorher);
    };
    const faelle = [
      ['fertPlans [null, …]', st => { st.fertPlans.unshift(null); }],
      ['offsetHistory [null]', st => { st.cycles[0].offsetHistory = [null]; }],
      ['offsetHistory als Zahl', st => { st.cycles[0].offsetHistory = 5; }],
      ['plants [null, …]', st => { st.cycles[0].plants.push(null); }],
      ['skippedDays als Zahl', st => { st.cycles[0].skippedDays = 5; }],
      ['skippedDays [null, "x"]', st => { st.cycles[0].skippedDays = [null, 'x']; }],
    ];
    for (const [name, mut] of faelle) {
      const a = await load({ [SK]: haupt(mut), [BAK]: kopie101 }, { warten: 400 });
      const fehler = a.errors.concat(await bildschirme(a));
      pruef(`AH "${name}": kein JS-Fehler auf Start, Kalender, Einstellungen, Eintrag`, fehler.length === 0, fehler[0]);
      pruef(`AH "${name}": der Hauptstand bleibt (111 Einträge)`, a.E('Object.keys(S.entries).length') === 111, a.E('Object.keys(S.entries).length'));
      pruef(`AH "${name}": kein Warndialog`, a.dialoge.length === 0, a.dialoge[0]);
    }
    // Die Pflanzen mit Daten bleiben erhalten, nur die leere Stelle geht
    const b = await load({ [SK]: haupt(st => { st.cycles[0].plants.push(null); }) }, { warten: 400 });
    pruef('AH die echten Pflanzen sind alle noch da', b.E('S.cycles[0].plants.length') === JSON.parse(SICHERUNG).cycles[0].plants.length, b.E('S.cycles[0].plants.length'));
    b.E('goTo("set"); S._setUI = S._setUI || {}; S._setUI.data = true; renderSet()');
    pruef('AH die Einstellungen sagen es', /Listen (leer|waren)|leer oder falsch abgelegt|Listen leer/.test(b.E('document.getElementById("scr-set").innerHTML')));
    // Prüferbefund 1: eine leere Stelle, die der Plan des Zyklus war → Plan aus der Kopie, Hauptstand bleibt
    const c = await load({ [SK]: haupt(st => { const i = st.fertPlans.findIndex(p => p.id === st.cycles[0].fertPlanId); st.fertPlans[i] = null; }), [BAK]: kopie101 });
    pruef('AH der Plan des Zyklus kommt aus der Kopie zurück', c.E('(getPlanForCycle(S.cycles[0]) || {products:[]}).products.length') > 0);
    pruef('AH und der Hauptstand bleibt (111, nicht 101)', c.E('Object.keys(S.entries).length') === 111, c.E('Object.keys(S.entries).length'));
    // Prüferbefund 2: eine null in plants war eine echte Pflanze mit Ernte → aus der Kopie zurück
    const geerntet = (st) => st.cycles[0].plants.findIndex(p => p.yieldDry || p.yieldWet || p.harvestedAt);
    const d2 = await load({ [SK]: haupt(st => { st.cycles[0].plants[geerntet(st)] = null; }), [BAK]: kopie101 }, { warten: 400 });
    pruef('AH die geerntete Pflanze kommt aus der Kopie zurück', d2.E('S.cycles[0].plants.length') === JSON.parse(SICHERUNG).cycles[0].plants.length, d2.E('S.cycles[0].plants.length'));
    d2.E('goTo("set"); S._setUI = S._setUI || {}; S._setUI.data = true; renderSet()');
    pruef('AH die Einstellungen sagen „zurückgeholt"', /zurückgeholt/.test(d2.E('document.getElementById("scr-set").innerHTML')));
    const d3 = await load({ [SK]: haupt(st => { st.cycles[0].plants[geerntet(st)] = null; }) }, { warten: 400 });
    d3.E('goTo("set"); S._setUI = S._setUI || {}; S._setUI.data = true; renderSet()');
    const h3 = d3.E('document.getElementById("scr-set").innerHTML');
    pruef('AH ohne Kopie: kein „verloren ist nichts", sondern „Nicht mehr vorhanden"', /Nicht mehr vorhanden/.test(h3) && !/nichts verloren/.test(h3));
    // Prüferbefund 3: offsetHistory als Objekt mit einer echten Verschiebung → ausgepackt, der Erntetag bleibt
    const mitVersatz = (st) => { st.cycles[0].offsetHistory = [{ date: '2026-07-01', offset: 3 }]; };
    const ref = await load({ [SK]: haupt(mitVersatz) }, { warten: 300 });
    const soll = ref.E('harvestCountdown ? JSON.stringify(endspurtState(S.cycles[0], "2026-08-20").ernteTag) : ""');
    const e = await load({ [SK]: haupt(st => { mitVersatz(st); st.cycles[0].offsetHistory = { a: st.cycles[0].offsetHistory[0] }; }) }, { warten: 300 });
    pruef('AH Verschiebung als Objekt: ausgepackt, der Erntetag rückt nicht vor',
      e.E('JSON.stringify(endspurtState(S.cycles[0], "2026-08-20").ernteTag)') === soll, { soll, ist: e.E('JSON.stringify(endspurtState(S.cycles[0], "2026-08-20").ernteTag)') });
    // offsetHistory mit {} oder {date:null}: kein Absturz im Tageseintrag
    const f = await load({ [SK]: haupt(st => { st.cycles[0].offsetHistory = [{}, { date: null, offset: 2 }]; }) }, { warten: 300 });
    const ff = f.errors.concat(await bildschirme(f));
    pruef('AH unvollständige Verschiebungen: kein Absturz im Tageseintrag', ff.length === 0, ff[0]);
  }

  // ===== AI: eine Migration wirft (Hebel 3, Punkt 6 — v1.5.296) =====
  console.log('\nAI - Eine scheiternde Migration bricht den Start nicht ab');
  {
    const kaputtePlaene = haupt(st => { st.fertPlans[0].products = 'x'; });
    const a = await load({ [SK]: kaputtePlaene, [BAK]: kopie101 });
    pruef('AI1 Start ohne JS-Fehler', a.errors.length === 0, a.errors[0]);
    pruef('AI2 die gescheiterten Schritte sind vermerkt', a.E('_startFehler.length') > 0, a.E('JSON.stringify(_startFehler)'));
    pruef('AI3 der Hauptstand bleibt (111 Einträge, 1 Zyklus)', a.E('Object.keys(S.entries).length') === 111 && a.E('S.cycles.length') === 1,
      { e: a.E('Object.keys(S.entries).length'), z: a.E('S.cycles.length') });
    const fehler = [];
    for (const sc of ['dash', 'cal', 'set']) { try { a.E("goTo('" + sc + "')"); } catch (e) { fehler.push(sc + ': ' + e.message); } }
    try { a.E('openEntry(todayISO())'); } catch (e) { fehler.push('eintrag: ' + e.message); }
    pruef('AI4 Start, Kalender, Einstellungen und Eintrag bauen sich auf', fehler.length === 0, fehler[0]);
    pruef('AI5 die App sagt es: „Start mit Einschränkung"', a.dialoge.some(d => /Start mit Einschränkung/.test(d)), a.dialoge[0]);
    pruef('AI6 der Stand von vor dem Start ist aufgehoben', a.get(RET) === kaputtePlaene);
    pruef('AI7 und es wird nicht gesperrt', a.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === false);
    a.E("S.entries['2026-09-29'] = { note: 'geht' }; saveS()");
    pruef('AI8 Speichern funktioniert', (a.get(SK) || '').indexOf('"note":"geht"') > 0);
    // Nächster Start mit demselben Fund in derselben Version: kein zweiter Dialog
    const b = await load({ [SK]: kaputtePlaene, [RET]: a.get(RET), [RET_INFO]: a.get(RET_INFO) });
    pruef('AI9 beim nächsten Start kein erneuter Dialog', b.dialoge.length === 0, b.dialoge[0]);
    pruef('AI10 keine Sperre beim nächsten Start', b.E("typeof _speicherSperre !== 'undefined' && _speicherSperre") === false);
  }

  // Prüferbefund 4a: nach einem App-Update nennt der Hinweis die Zahlen von heute, nicht die des alten Funds
  {
    const info = JSON.stringify({ am: Date.now() - 86400000 * 30, heruntergeladen: false, geladen: 'aktualisierung', version: 'v1.5.1', zyklen: 1, eintraege: 91, grund: 'alt' });
    const a = await load({ [SK]: haupt(st => { st.fertPlans[0].products = 'x'; }), [RET]: '{"alt":1}', [RET_INFO]: info });
    pruef('AI11 nach einem Update: der Hinweis nennt 111 Einträge, nicht 91', a.dialoge.some(d => /111 Einträge/.test(d)) && !a.dialoge.some(d => /91 Einträge/.test(d)), a.dialoge[0]);
  }

  // ===== AJ: Import prüft, ersetzt erst nach Bestätigung, lädt neu (Hebel 3, Punkt 7a — v1.5.297) =====
  console.log('\nAJ - Import einer Datei');
  {
    const importiere = async (a, text, antwort) => {
      a.dialoge.length = 0; a.toasts.length = 0;
      const knoepfe = [];
      a.window.customConfirm = (titel, txt, ok, farbe) => { a.dialoge.push(titel + '\n' + txt); knoepfe.push(farbe); return Promise.resolve(antwort); };
      let inp = null;
      const orig = a.window.document.createElement.bind(a.window.document);
      a.window.document.createElement = (tag) => { const el = orig(tag); if (tag === 'input') inp = el; return el; };
      a.window.eval('importData()');
      await a.warte(20);
      a.window.document.createElement = orig;
      const datei = new a.window.File([text], 'growsmart_2026-09-29.json', { type: 'application/json' });
      Object.defineProperty(inp, 'files', { value: [datei] });
      await inp.onchange({ target: inp });
      await a.warte(200);
      return knoepfe;
    };
    const a = await load({ [SK]: SICHERUNG }, { warten: 300 });
    const vorher = a.get(SK);
    await importiere(a, '{"foo":1}', true);
    pruef('AJ1 eine fremde JSON-Datei wird abgelehnt, ohne Rückfrage', a.dialoge.length === 0 && a.toasts.some(t => /keine GrowSmart-Sicherung/.test(t)), a.toasts);
    await importiere(a, JSON.stringify({ _type: 'growsmart_preset', name: 'X', products: [], schedule: {} }), true);
    pruef('AJ2 ein Düngeplan wird als Düngeplan erkannt', a.toasts.some(t => /Düngeplan, keine Sicherung/.test(t)), a.toasts);
    await importiere(a, 'null', true);
    pruef('AJ3 eine leere Datei wird abgelehnt', a.toasts.some(t => /keine lesbare Sicherung/.test(t)), a.toasts);
    await importiere(a, JSON.stringify({ cycles: null, entries: {} }), true);
    pruef('AJ4 eine nicht reparierbare Sicherung wird abgelehnt', a.toasts.some(t => /nicht sicher reparieren/.test(t)), a.toasts);
    pruef('AJ5 nach all dem ist der Stand unverändert (Speicher und App)', a.get(SK) === vorher && a.E('Object.keys(S.entries).length') === 111);
    // Eine kleinere Sicherung: Dialog nennt beide Seiten, roter Knopf; Abbrechen ändert nichts
    const klein = JSON.stringify({ cycles: [], entries: {}, _disclaimerAcceptedAt: '2026-05-01' });
    const k1 = await importiere(a, klein, false);
    pruef('AJ6 der Dialog nennt Datei und App', a.dialoge.some(d => /In der Datei: 0 Zyklen/.test(d) && /Jetzt in der App: 1 Zyklus mit 111/.test(d)), a.dialoge[0]);
    pruef('AJ7 bei deutlich weniger Inhalt ist der Knopf rot', k1[0] === 'var(--red)', k1);
    pruef('AJ8 Abbrechen ändert nichts', a.get(SK) === vorher);
    // Eine echte Sicherung, bestätigt: geschrieben, Neuladen steht an, bis dahin schreibt nichts mehr
    const b = await load({ [SK]: klein }, { warten: 300 });
    await importiere(b, SICHERUNG, true);
    pruef('AJ9 die Sicherung ist geschrieben', Object.keys(JSON.parse(b.get(SK)).entries).length === 111);
    pruef('AJ10 die App lädt neu (dieselben Migrationen wie beim Start)', b.E('_neuladenAnsteht') === true);
    b.E('doUndo()');
    pruef('AJ11 ein ↩ vor dem Neuladen macht den Import nicht rückgängig', Object.keys(JSON.parse(b.get(SK)).entries).length === 111);
  }

  // Prüferbefund F1: Import einer inhaltsärmeren, aber größeren Datei in einen fast vollen Speicher
  // darf keine Kopie mit deutlich mehr Inhalt opfern.
  {
    const kopie = kopieText(gestern());
    const quota = SK.length + SICHERUNG.length + BAK.length + kopie.length + 3000;
    const a = await load({ [SK]: SICHERUNG, [BAK]: kopie }, { quota, warten: 300 });
    const st = JSON.parse(SICHERUNG);
    Object.keys(st.entries).slice(20).forEach(k => delete st.entries[k]);
    st._polster = 'p'.repeat(40000);   // weniger Inhalt, aber mehr Zeichen
    a.dialoge.length = 0; a.toasts.length = 0;
    a.window.customConfirm = () => Promise.resolve(true);
    let inp = null; const orig = a.window.document.createElement.bind(a.window.document);
    a.window.document.createElement = (tag) => { const el = orig(tag); if (tag === 'input') inp = el; return el; };
    a.window.eval('importData()'); await a.warte(20); a.window.document.createElement = orig;
    Object.defineProperty(inp, 'files', { value: [new a.window.File([JSON.stringify(st)], 'growsmart_x.json')] });
    await inp.onchange({ target: inp }); await a.warte(200);
    pruef('AJ12 die Kopie mit 111 Einträgen bleibt', a.get(BAK) === kopie);
    pruef('AJ13 der Hauptstand bleibt unverändert', a.get(SK) === SICHERUNG);
    pruef('AJ14 und die Meldung sagt ehrlich, dass die Datei zu groß ist', a.toasts.some(t => /zu groß für den Speicher/.test(t)), a.toasts);
  }

  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  process.exit(fail ? 1 : 0);
})();
