// Eingangstore (v1.5.364): Kennungen, Schlüssel, Datums-, Zahlen-, Farb- und Auswahlfelder ohne Zeichen, mit denen eine fremde
// oder veränderte Datei Programmcode in die App bringen kann (Sicherheitsprüfung 07.10.2026).
//
//   A  Patricks Sicherung, ein frischer Assistenten-Zyklus und der Demo-Zyklus gelten als sicher; nichts wird entfernt.
//   B  Vergiftete Kennungen, Schlüssel und Daten: _standUnsicher meldet sie, _standMangel lehnt ab (auch wiederherstellung.html).
//   C  Backup-Import einer solchen Datei: abgelehnt, der Stand bleibt unverändert.
//   D  Start mit vergifteter Kennung im Speicher: der Stand kommt nicht in die Oberfläche (kein eingeschleustes Element).
//   E  Start mit vergifteten Werten (Topfgröße im Knopf-Befehl, Substrat, Messwerte, Foto): entfernt, gemeldet, nichts eingeschleust.
//   F  Eigene Vorlage aus der Zwischenablage: vergiftete Produkt-Kennung abgelehnt, Farbe gereinigt.
//   G  (v1.5.366) Freitexte — Namen, Standort, Sorte, Pflanzen, Produkte, Pläne — typografisch umgesetzt, nichts eingeschleust.
//   H  (v1.5.367) wiederherstellung.html zeigt Name und Start der Sicherung maskiert.
//   I  (v1.5.375) Eine unsichere Tageskopie wird nicht angeboten, nicht geladen und beim nächsten Speichern ersetzt.
//   P  (v1.5.385) Ein Schlüssel „__proto__" geht an keinem Tor vorbei; der Arbeitsstand erbt nichts.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');
const SICHERUNG = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const WIEDER = fs.readFileSync(process.env.GS_WIEDER || path.join(__dirname, 'wiederherstellung.html'), 'utf8');   // GS_WIEDER: alte Seite

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, arcTo: noop, rect: noop, fill: noop, stroke: noop,
    fillRect: noop, clearRect: noop, strokeRect: noop, save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    setTransform: noop, fillText: noop, strokeText: noop, drawImage: noop, clip: noop, setLineDash: noop, quadraticCurveTo: noop,
    bezierCurveTo: noop, measureText: () => ({ width: 0 }), createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}
async function starte(speicher) {
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
      w.__pwn = 0;
      // Bericht- und Kollage-Fenster (window.open + document.write) mitschreiben
      w.__gedruckt = [];
      w.open = () => ({ document: { write: (h) => { w.__gedruckt.push(String(h)); }, close() {}, open() {} }, focus() {}, print() {}, close() {} });
      if (speicher) w.localStorage.setItem('growsmart_v4', speicher);
    },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  const toasts = [];
  w.toast = (t) => toasts.push(String(t));
  return { w, errors, toasts, E: (s) => w.eval(s) };
}
const klon = (o) => JSON.parse(JSON.stringify(o));
// Bricht aus Text, Attribut (" und ') und Knopf-Befehl aus und legt ein Marker-Element an bzw. ruft PWN().
const GIFT = '"\'><i data-pwn="1"></i>';
const GIFT_JS = "x');__pwn++;//";

// Rendert die wichtigsten Bildschirme und zählt eingeschleuste Elemente und ausgeführten Programmcode.
async function eingeschleust(a) {
  const tage = a.E(`(S.cycles[0] && S.cycles[0].startDate) ? [1, 30, 60, 90, 104, 110].map(n => isoPlus(S.cycles[0].startDate, n - 1)) : [todayISO()]`);
  const schritte = [`goTo('dash')`, `goTo('cal')`, `goTo('tips')`, `goTo('set')`, `openDuenger && openDuenger()`, `openGussplan && openGussplan()`,
    `openGallery && openGallery()`, `openLexikon()`, `S._lexActiveCat = '\ud83e\uddf4 Meine Produkte'; renderLexikon(); S._lexActiveCat = null`,
    `openDuenger(); S._planEdit = true; S._planAlleWochen = true; renderDuenger(); S._planEdit = false`,
    `S.cycles[1] && openCycleCompare(S.cycles[0].id, S.cycles[1].id)`, `openPlantSheet(S.cycles[0].id, todayISO())`,
    `goTo('tips'); _onTipsSearchInput('a')`, `exportReportPDF(S.cycles[0].id)`, `exportCollage(S.cycles[0].id)`,
    ...tage.map(t => `setDebugDate('${t}'); openEntry('${t}')`)];
  let dom = 0;
  for (const s of schritte) {
    try { a.E(s); } catch (e) { /* ein Bildschirm, der nicht aufgeht, schleust auch nichts ein */ }
    await new Promise((r) => setTimeout(r, 5));
    dom += a.w.document.querySelectorAll('[data-pwn]').length;
    // Jeden Knopf-Befehl einmal auslösen, der den Marker trägt
    a.w.document.querySelectorAll('[onclick*="__pwn"],[oninput*="__pwn"],[onchange*="__pwn"]').forEach((el) => {
      for (const at of ['onclick', 'oninput', 'onchange']) { const v = el.getAttribute(at); if (v && v.includes('__pwn')) { try { new a.w.Function(v).call(el); } catch (e) {} } }
    });
  }
  try { a.E(`setDebugDate('')`); } catch (e) {}
  for (const h of a.w.__gedruckt.splice(0)) dom += new JSDOM(h).window.document.querySelectorAll('[data-pwn]').length;
  return { dom, js: a.w.__pwn };
}

(async () => {
  const fehler = [];
  let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const basis = JSON.parse(SICHERUNG);

  // A · Echte Daten gelten als sicher
  const a = await starte(SICHERUNG);
  const hatTor = a.E(`typeof _standUnsicher`) === 'function';
  pruefe(hatTor, 'A0 _standUnsicher fehlt');
  // Auf einem alten Build laufen nur C, D und E — dort zeigt sich, was ohne die Tore passiert.
  if (hatTor) {
  pruefe(a.E(`_standUnsicher(${SICHERUNG})`) === null, 'A1 Patricks Sicherung gilt als unsicher');
  pruefe(a.E(`_standEntgiften(${SICHERUNG})`) === 0, 'A2 aus Patricks Sicherung würde etwas entfernt');
  pruefe(a.E(`_giftBeimStart`) === 0, 'A3 beim Start mit Patricks Daten wurde etwas entfernt');
  pruefe(a.E(`S.cycles.length`) === basis.cycles.length, 'A4 Patricks Zyklen fehlen nach dem Start');
  // Ein frischer Zyklus aus dem Assistenten und der Demo-Zyklus
  a.E(`addCyc({ name: "Patrick's Grow „Test“ & <Zelt>", startDate: isoPlus(todayISO(), -20), seedType: 'auto', growType: 'indoor', medium: 'coco',
    potSize: 11, plantCount: 3, startMethod: 'saturated', fertPlanId: _planFuerVorlage('canna_coco') }, { still: true });`);
  pruefe(a.E(`_standUnsicher(JSON.parse(JSON.stringify(S)))`) === null, 'A5 ein neu angelegter Zyklus (Name mit Anführungszeichen) gilt als unsicher');
  pruefe(a.E(`_standEntgiften(JSON.parse(JSON.stringify(S)))`) === 0, 'A6 aus einem neu angelegten Zyklus würde etwas entfernt');
  try { a.E(`welcomeStartDemo()`); } catch (e) {}
  pruefe(a.E(`hasDemoCycle()`), 'A7a der Demo-Zyklus wurde nicht angelegt');
  pruefe(a.E(`_standUnsicher(JSON.parse(JSON.stringify(S)))`) === null && a.E(`_standEntgiften(JSON.parse(JSON.stringify(S)))`) === 0, 'A7 der Demo-Zyklus gilt als unsicher');
  }

  // B · Vergiftete Kennungen, Schlüssel, Daten
  const faelle = {
    'Zyklus-Kennung': (d) => { const alt = d.cycles[0].id; d.cycles[0].id = GIFT_JS; Object.values(d.entries).forEach(e => { if (e.cycleData && e.cycleData[alt]) { e.cycleData[GIFT_JS] = e.cycleData[alt]; delete e.cycleData[alt]; } }); },
    'Plan-Verweis': (d) => { d.cycles[0].fertPlanId = GIFT; },
    'Startdatum': (d) => { d.cycles[0].startDate = '2026-05-16' + GIFT; },
    'Pflanzen-Kennung': (d) => { d.cycles[0].plants[0].id = GIFT_JS; },
    'Ernte-Datum': (d) => { d.cycles[0].plants[0].harvestedAt = GIFT; },
    'Trainings-Datum': (d) => { d.cycles[0].trainingEvents = [{ date: GIFT, type: 'lst' }]; },
    'Produkt-Kennung': (d) => { d.fertPlans[0].products[0].id = GIFT_JS; },
    'Plan-Kennung': (d) => { d.fertPlans[0].id = GIFT_JS; },
    'Wochenplan-Schlüssel': (d) => { const w = Object.keys(d.fertPlans[0].schedule)[0]; d.fertPlans[0].schedule[w][GIFT_JS] = 1; },
    'Eintrags-Datum': (d) => { d.entries['2026-06-01' + GIFT] = { temp: '', humidity: '', cycleData: {} }; },
    'Dosen-Schlüssel': (d) => { const e = Object.values(d.entries).find(x => x.cycleData && Object.keys(x.cycleData).length); const cd = Object.values(e.cycleData)[0]; cd.doses = { [GIFT_JS]: 1 }; },
    'eigene Vorlage': (d) => { d.customPresets = { [GIFT_JS]: { name: 'x', products: [], schedule: {} } }; },
    'aktiver Plan': (d) => { d._activePlanId = GIFT_JS; },
  };
  const gift = {};
  for (const [name, fn] of Object.entries(faelle)) { const d = klon(basis); fn(d); gift[name] = d; }
  const page = new JSDOM(WIEDER, { runScripts: 'dangerously', url: 'https://growsmart.test/wiederherstellung.html' });
  if (hatTor) for (const [name, d] of Object.entries(gift)) {
    const j = JSON.stringify(d);
    pruefe(!!a.E(`_standUnsicher(${j})`), `B ${name}: nicht als unsicher erkannt`);
    pruefe(a.E(`_standMangel(${j})`) === 'unsicher', `B ${name}: _standMangel lehnt nicht ab`);
    pruefe(page.window.standMangel(JSON.parse(j)) === 'unsicher', `B ${name}: wiederherstellung.html lehnt nicht ab`);
  }
  pruefe(page.window.standMangel(basis) === null, 'B wiederherstellung.html lehnt Patricks Sicherung ab');

  // C · Backup-Import einer unsicheren Datei wird abgelehnt
  {
    const vorher = a.E(`JSON.stringify(S.cycles.map(c => c.id))`);
    a.toasts.length = 0;
    let inp = null;
    const orig = a.w.document.createElement.bind(a.w.document);
    a.w.document.createElement = (t) => { const el = orig(t); if (String(t).toLowerCase() === 'input') { inp = el; el.click = () => {}; } return el; };
    a.E(`importData()`);
    a.w.document.createElement = orig;
    const datei = new a.w.File([JSON.stringify(gift['Zyklus-Kennung'])], 'growsmart_2026-10-07.json', { type: 'application/json' });
    Object.defineProperty(inp, 'files', { value: [datei] });
    await inp.onchange({ target: inp });
    for (let i = 0; i < 120 && !a.toasts.some(t => /nicht geladen/.test(t)); i++) await new Promise((r) => setTimeout(r, 25));
    // (v1.5.377) ganzer Satz ohne Fachwort, mit Rat fürs eigene Backup
    pruefe(a.toasts.some(t => /wird nicht geladen: In der Kennung eines Zyklus stehen Zeichen/.test(t) && /fremde Befehle/.test(t) && /eigenes Backup/.test(t) && /Stand bleibt unverändert/.test(t)), `C1 Import einer unsicheren Datei nicht abgelehnt (${a.toasts.join(' | ').slice(0, 160)})`);
    pruefe(a.E(`JSON.stringify(S.cycles.map(c => c.id))`) === vorher, 'C2 der Stand hat sich nach dem abgelehnten Import verändert');
  }

  // D · Start mit vergifteter Kennung im Speicher
  {
    const d = await starte(JSON.stringify(gift['Zyklus-Kennung']));
    pruefe(!d.E(`(S.cycles || []).some(c => String(c.id).includes('__pwn'))`), 'D1 die vergiftete Kennung ist im Arbeitsstand');
    const r = await eingeschleust(d);
    pruefe(r.dom === 0 && r.js === 0, `D2 eingeschleust: ${r.dom} Elemente, ${r.js}× Programmcode`);
    // (v1.5.375/381) Der Start-Hinweis erklärt den Grund und behauptet keinen beschädigten Grow
    const hw = d.E(`(typeof _vorfallText === 'function' && _startHinweis) ? (_vorfallText(_startHinweis) || {}).text || '' : ''`);
    pruefe(hatTor ? (/Zeichen, die GrowSmart dort nie schreibt/.test(hw) && /Er ist lesbar/.test(hw) && !/nicht wieder einlesen/.test(hw)) : false, 'D3 Start-Hinweis zum unsicheren Stand: ' + String(hw).slice(0, 260));
  }

  // E · Start mit vergifteten Werten: entfernt, gemeldet, nichts eingeschleust
  {
    const d = klon(basis);
    d.potSize = '11)+(__pwn++)+(1';
    d.cycles[0].potSize = '11)+(__pwn++)+(1';
    d.cycles[0].medium = GIFT; d.cycles[0].lightVeg = GIFT; d.cycles[0].symbol = GIFT; d.cycles[0].intBloom = GIFT; d.cycles[0].bloomDays = GIFT;
    d.cycles[0].plants[0].color = GIFT;
    // (v1.5.379) verschachtelte und übersehene Felder: Gießmengen-Korridor und Samentüten-Wochen
    d.cycles[0].waterRange = { stretch: { min: GIFT, max: 900 }, flush: { min: 1000, max: GIFT } }; d.cycles[0].seedWeeksLo = GIFT; d.cycles[0].seedWeeksHi = GIFT;
    d.fertPlans.forEach(p => (p.products || []).forEach(x => { x.color = GIFT; x.unit = GIFT; }));
    const tage = Object.keys(d.entries).sort();
    tage.forEach(t => { const e = d.entries[t]; e.temp = GIFT; Object.values(e.cycleData || {}).forEach(cd => { cd.ph = GIFT; cd.water = GIFT; cd.photos = [GIFT]; }); });
    const e = await starte(JSON.stringify(d));
    pruefe(hatTor && e.E(`_giftBeimStart`) > 100, `E1 beim Start nicht entfernt (${hatTor ? e.E('_giftBeimStart') : 'kein Tor'})`);
    pruefe(e.E(`S.cycles.length`) === basis.cycles.length && e.E(`Object.keys(S.entries).length`) === Object.keys(basis.entries).length, 'E2 Zyklen oder Einträge sind verloren gegangen');
    pruefe(e.E(`S.cycles[0].name`) === basis.cycles[0].name && e.E(`S.cycles[0].startDate`) === basis.cycles[0].startDate, 'E3 Name oder Startdatum verändert');
    pruefe(!e.E(`JSON.stringify(S).includes('data-pwn') || JSON.stringify(S).includes('__pwn')`), 'E4 ein vergifteter Wert steht noch im Arbeitsstand');
    const r = await eingeschleust(e);
    pruefe(r.dom === 0 && r.js === 0, `E5 eingeschleust: ${r.dom} Elemente, ${r.js}× Programmcode`);
    e.E(`if (!S._setUI) S._setUI = {}; S._setUI.data = true; goTo('set'); renderSet();`);
    pruefe(/Zeichen, die GrowSmart dort nie schreibt/.test(e.w.document.getElementById('scr-set').textContent), 'E6 die Einstellungen nennen die entfernten Werte nicht');
  }

  // G · Freitexte (v1.5.366): typografisch umgesetzt, nichts eingeschleust — Namen, Standort, Sorte, Pflanzen, Produkte, Pläne
  const hatSauber = a.E(`typeof _freitextSauber`) === 'function';
  pruefe(hatSauber, 'G0 _freitextSauber fehlt');
  if (hatSauber) {
    const probe = `_freitextSauber(${JSON.stringify("Patrick's \"Grow\" <1> a\\b &#39; &lt; Calcium & Magnesium")})`;
    pruefe(a.E(probe) === 'Patrick’s ”Grow” ‹1› a∖b ＆#39; ＆lt; Calcium & Magnesium', 'G1 Umsetzung: ' + a.E(probe));
  }
  {
    const d = klon(basis);
    const zweiter = klon(d.cycles[0]); zweiter.id = 'zweiter_1'; zweiter.startDate = '2026-08-20'; zweiter.archived = false; zweiter.active = true;
    zweiter.plants = (zweiter.plants || []).map((p, i) => Object.assign({}, p, { id: 'zp' + i, harvestedAt: undefined }));
    d.cycles.push(zweiter);
    d.cycles.forEach(c => { c.name = GIFT + GIFT_JS; c.location = GIFT; c.strain = GIFT;
      (c.plants || []).forEach(p => { p.label = GIFT + GIFT_JS; p.strain = GIFT; });
      c.trainingEvents = [{ date: c.startDate, type: 'lst', notes: GIFT }]; });
    const allesProdukt = (x) => { x.name = GIFT + GIFT_JS; x.note = GIFT; };
    (d.products || []).forEach(allesProdukt);
    d.fertPlans.forEach(p => { p.name = GIFT + GIFT_JS; p.mixInfo = GIFT; p.drainInfo = GIFT; p.mixOrder = [GIFT, GIFT_JS];
      p.weekFocus = { 1: { phase: GIFT, tip: GIFT } }; (p.products || []).forEach(allesProdukt); });
    d.mixOrder = [GIFT]; d.mixInfo = GIFT; d.drainInfo = GIFT;
    d.customPresets = { custom_1: { name: GIFT + GIFT_JS, subtitle: GIFT, products: [], schedule: {}, weekFocus: {} } };
    const g = await starte(JSON.stringify(d));
    pruefe(g.E(`S.cycles.length`) === d.cycles.length, 'G2 der Stand mit vergifteten Namen wurde nicht geladen');
    const r = await eingeschleust(g);
    pruefe(r.dom === 0 && r.js === 0, `G3 eingeschleust über Freitexte: ${r.dom} Elemente, ${r.js}× Programmcode`);
    if (hatSauber) {
      pruefe(!g.E(`/["'<>]/.test(S.cycles[0].name + S.cycles[0].location + S.fertPlans[0].name + (S.fertPlans[0].products[0] || {}).name)`), 'G4 Freitexte nach dem Start nicht umgesetzt');
      // Was der Nutzer selbst tippt, wird beim Speichern umgesetzt
      g.E(`S.cycles[0].name = "Patrick's Grow"; saveS();`);
      pruefe(g.E(`S.cycles[0].name`) === 'Patrick’s Grow', 'G5 getippter Name nach dem Speichern nicht umgesetzt: ' + g.E(`S.cycles[0].name`));
      // Patricks echte Daten: nur Satzzeichen ändern sich, nichts geht verloren
      const p = await starte(SICHERUNG);
      pruefe(p.E(`S.cycles.length`) === basis.cycles.length && p.E(`Object.keys(S.entries).length`) === Object.keys(basis.entries).length, 'G6 mit Patricks Daten fehlt nach dem Start etwas');
      pruefe(p.E(`S.cycles.every((c, i) => c.name.replace(/[’”‹›∖＆]/g, '') === ${JSON.stringify(basis.cycles.map(c => c.name))}[i].replace(/['"<>\\&]/g, ''))`), 'G7 Zyklusnamen über die Satzzeichen hinaus verändert');
    }
  }

  // H · wiederherstellung.html (v1.5.367): Name und Start der Sicherung gehen maskiert in die Seite — gespeichert und eingefügt
  {
    const d = klon(basis);
    d.cycles.forEach(c => { c.active = true; c.archived = false; c.name = GIFT; });
    const seite = new JSDOM(WIEDER, { runScripts: 'dangerously', url: 'https://growsmart.test/wiederherstellung.html',
      beforeParse(w) { w.localStorage.setItem('growsmart_v4', JSON.stringify(d)); } });
    const doc = seite.window.document;
    pruefe(doc.querySelectorAll('[data-pwn]').length === 0 && /Aktiv:/.test(doc.getElementById('jetzt').textContent), 'H1 der gespeicherte Name schleust auf der Wiederherstellungs-Seite ein Element ein');
    doc.getElementById('feld').value = JSON.stringify(d);
    doc.getElementById('pruefen').click();
    pruefe(doc.querySelectorAll('[data-pwn]').length === 0 && /Sicherung sieht gut aus/.test(doc.getElementById('pruef').textContent), 'H2 der eingefügte Name schleust auf der Wiederherstellungs-Seite ein Element ein');
    // (v1.5.377) Eine unsichere Sicherung: ein Satz statt „(unsicher)"
    doc.getElementById('feld').value = JSON.stringify(gift['Zyklus-Kennung']);
    doc.getElementById('pruefen').click();
    const pt = doc.getElementById('pruef').textContent;
    pruefe(/in der Kennung eines Zyklus Zeichen, die GrowSmart dort nie schreibt/.test(pt) && !/(unsicher)/.test(pt), 'H3 Wiederherstellungs-Seite erklärt den unsicheren Stand nicht: ' + pt.slice(0, 160));
  }

  // I · (v1.5.375) Eine unsichere Tageskopie wird nicht angeboten, nicht geladen und beim nächsten Speichern ersetzt
  if (hatTor) {
    const unsicher = klon(gift['Zyklus-Kennung']); unsicher._bakDate = '2026-10-01';
    const i = await starte(SICHERUNG);
    i.w.localStorage.setItem('growsmart_v4_bak', JSON.stringify(unsicher));
    const kopien = i.E(`JSON.stringify((_backupInfo().kopien || []).map(k => k.key))`);
    pruefe(!/growsmart_v4_bak"/.test(kopien), `I1 die unsichere Kopie wird zum Laden angeboten (${kopien})`);
    const vorher = i.w.localStorage.getItem('growsmart_v4');
    i.toasts.length = 0;
    // Wer laden will, bestätigt — auf einem alten Stand ersetzt die Kopie dann den Hauptstand
    i.E(`window.__echtConfirm = customConfirm; customConfirm = () => Promise.resolve(true);`);
    await i.E(`restoreAutoBackup('growsmart_v4_bak')`);
    i.E(`customConfirm = window.__echtConfirm;`);
    pruefe(i.w.localStorage.getItem('growsmart_v4') === vorher, 'I2 das Laden der unsicheren Kopie hat den Hauptstand ersetzt');
    i.E(`_autoBackup._fehlerAm = 0; _autoBackup()`);
    pruefe(!String(i.w.localStorage.getItem('growsmart_v4_bak')).includes('__pwn'), 'I3 die unsichere Kopie steht nach dem nächsten Speichern noch da');
  }

  // P · (v1.5.385) Ein Schlüssel „__proto__" geht an keinem Tor vorbei: abgelehnt, und der Arbeitsstand erbt nichts
  {
    const rest = klon(basis); const plaene = rest.fertPlans; delete rest.fertPlans;
    // Wie der Angriff des Gegenprüfers: Kennungen der Zyklen sauber, das Gift nur im „geerbten" Plan
    const boes = klon(plaene); boes.forEach(p => (p.products || []).forEach(x => { x.id = x.id + GIFT_JS; x.name = GIFT; }));
    const roh = '{"__proto__":' + JSON.stringify({ fertPlans: boes }) + ',' + JSON.stringify(rest).slice(1);
    if (hatTor) pruefe(a.E(`_standUnsicher(JSON.parse(${JSON.stringify(roh)}))`) === '__proto__', 'P1 „__proto__" wird nicht als unsicher erkannt');
    const pp = await starte(roh);
    pruefe(pp.E(`Object.getPrototypeOf(S) === Object.prototype && !(S.fertPlans || []).some(p => String(p.id).includes('__pwn'))`), 'P2 der Arbeitsstand erbt Pläne über „__proto__"');
    const r = await eingeschleust(pp);
    pruefe(r.dom === 0 && r.js === 0, `P3 eingeschleust über „__proto__": ${r.dom} Elemente, ${r.js}× Programmcode`);
    const seite = new JSDOM(WIEDER, { runScripts: 'dangerously', url: 'https://growsmart.test/wiederherstellung.html' });
    seite.window.document.getElementById('feld').value = roh;
    seite.window.document.getElementById('pruefen').click();
    pruefe(/__proto__/.test(seite.window.document.getElementById('pruef').textContent), 'P4 wiederherstellung.html lehnt „__proto__" nicht ab');
  }

  // F · Eigene Vorlage aus der Zwischenablage
  if (hatTor) {
    const ok = { _type: 'growsmart_preset', name: 'Meine Vorlage', products: [{ id: 'p1', name: 'A', unit: 'ml', color: GIFT }], schedule: { 1: { p1: 1 } } };
    const id = a.E(`importCustomPreset(${JSON.stringify(JSON.stringify(ok))})`);
    pruefe(!!id && !JSON.stringify(a.E(`JSON.stringify(S.customPresets[${JSON.stringify(id)}])`)).includes('data-pwn'), 'F1 vergiftete Farbe einer Vorlage nicht entfernt');
    const boes = { _type: 'growsmart_preset', name: 'Böse', products: [{ id: GIFT_JS, name: 'A', unit: 'ml' }], schedule: { 1: { [GIFT_JS]: 1 } } };
    pruefe(a.E(`importCustomPreset(${JSON.stringify(JSON.stringify(boes))})`) === null, 'F2 Vorlage mit vergifteter Produkt-Kennung angenommen');
    // (v1.5.380) Produktnamen als Wochenplan-Schlüssel (Format der eingebauten Vorlagen) sind Freitext: angenommen, Name und Schlüssel gleich umgesetzt
    const namen = { _type: 'growsmart_preset', name: 'Namensplan', products: [{ name: "Jack's Bloom", unit: 'ml/L' }, { name: 'Calcium & Magnesium', unit: 'ml/L' }],
      schedule: { 1: { "Jack's Bloom": 2, 'Calcium & Magnesium': 0.5 } } };
    const nid = a.E(`importCustomPreset(${JSON.stringify(JSON.stringify(namen))})`);
    pruefe(!!nid, 'F3 Vorlage mit Produktnamen „Jack’s Bloom" und „Calcium & Magnesium" im Wochenplan abgelehnt: ' + a.E('importCustomPreset._grund'));
    if (nid) {
      const v = JSON.parse(a.E(`JSON.stringify(S.customPresets[${JSON.stringify(nid)}])`));
      const pn = v.products.map(p => p.name).sort().join('|'), sk = Object.keys(v.schedule[1] || v.schedule['1']).sort().join('|');
      pruefe(pn === sk && /Jack’s Bloom/.test(pn) && /Calcium & Magnesium/.test(pn), `F4 Produktnamen und Wochenplan-Schlüssel passen nicht zusammen: ${pn} / ${sk}`);
      pruefe(a.E('_standUnsicher(JSON.parse(JSON.stringify(S)))') === null, 'F5 ein Stand mit dieser Vorlage gilt als unsicher');
    }
  }

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_eingangstore: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_eingangstore: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_eingangstore abgebrochen:', (e && e.stack) || e); process.exit(1); });
