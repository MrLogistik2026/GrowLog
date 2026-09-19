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

  console.log('\n' + ok + ' OK, ' + fail + ' FEHL');
  process.exit(fail ? 1 : 0);
})();
