// Eingangstore (v1.5.364): Kennungen, Schlüssel, Datums-, Zahlen-, Farb- und Auswahlfelder ohne Zeichen, mit denen eine fremde
// oder veränderte Datei Programmcode in die App bringen kann (Sicherheitsprüfung 07.10.2026).
//
//   A  Patricks Sicherung, ein frischer Assistenten-Zyklus und der Demo-Zyklus gelten als sicher; nichts wird entfernt.
//   B  Vergiftete Kennungen, Schlüssel und Daten: _standUnsicher meldet sie, _standMangel lehnt ab (auch wiederherstellung.html).
//   C  Backup-Import einer solchen Datei: abgelehnt, der Stand bleibt unverändert.
//   D  Start mit vergifteter Kennung im Speicher: der Stand kommt nicht in die Oberfläche (kein eingeschleustes Element).
//   E  Start mit vergifteten Werten (Topfgröße im Knopf-Befehl, Substrat, Messwerte, Foto): entfernt, gemeldet, nichts eingeschleust.
//   F  Eigene Vorlage aus der Zwischenablage: vergiftete Produkt-Kennung abgelehnt, Farbe gereinigt.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');
const SICHERUNG = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');
const WIEDER = fs.readFileSync(path.join(__dirname, 'wiederherstellung.html'), 'utf8');

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
    `openGallery && openGallery()`, ...tage.map(t => `setDebugDate('${t}'); openEntry('${t}')`)];
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
    for (let i = 0; i < 80 && !a.toasts.length; i++) await new Promise((r) => setTimeout(r, 25));
    pruefe(a.toasts.some(t => /wird nicht geladen/.test(t) && /Programmcode/.test(t)), `C1 Import einer unsicheren Datei nicht abgelehnt (${a.toasts.join(' | ').slice(0, 160)})`);
    pruefe(a.E(`JSON.stringify(S.cycles.map(c => c.id))`) === vorher, 'C2 der Stand hat sich nach dem abgelehnten Import verändert');
  }

  // D · Start mit vergifteter Kennung im Speicher
  {
    const d = await starte(JSON.stringify(gift['Zyklus-Kennung']));
    pruefe(!d.E(`(S.cycles || []).some(c => String(c.id).includes('__pwn'))`), 'D1 die vergiftete Kennung ist im Arbeitsstand');
    const r = await eingeschleust(d);
    pruefe(r.dom === 0 && r.js === 0, `D2 eingeschleust: ${r.dom} Elemente, ${r.js}× Programmcode`);
  }

  // E · Start mit vergifteten Werten: entfernt, gemeldet, nichts eingeschleust
  {
    const d = klon(basis);
    d.potSize = '11)+(__pwn++)+(1';
    d.cycles[0].potSize = '11)+(__pwn++)+(1';
    d.cycles[0].medium = GIFT; d.cycles[0].lightVeg = GIFT; d.cycles[0].symbol = GIFT; d.cycles[0].intBloom = GIFT; d.cycles[0].bloomDays = GIFT;
    d.cycles[0].plants[0].color = GIFT;
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

  // F · Eigene Vorlage aus der Zwischenablage
  if (hatTor) {
    const ok = { _type: 'growsmart_preset', name: 'Meine Vorlage', products: [{ id: 'p1', name: 'A', unit: 'ml', color: GIFT }], schedule: { 1: { p1: 1 } } };
    const id = a.E(`importCustomPreset(${JSON.stringify(JSON.stringify(ok))})`);
    pruefe(!!id && !JSON.stringify(a.E(`JSON.stringify(S.customPresets[${JSON.stringify(id)}])`)).includes('data-pwn'), 'F1 vergiftete Farbe einer Vorlage nicht entfernt');
    const boes = { _type: 'growsmart_preset', name: 'Böse', products: [{ id: GIFT_JS, name: 'A', unit: 'ml' }], schedule: { 1: { [GIFT_JS]: 1 } } };
    pruefe(a.E(`importCustomPreset(${JSON.stringify(JSON.stringify(boes))})`) === null, 'F2 Vorlage mit vergifteter Produkt-Kennung angenommen');
  }

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_eingangstore: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_eingangstore: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_eingangstore abgebrochen:', (e && e.stack) || e); process.exit(1); });
