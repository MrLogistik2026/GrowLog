/**
 * (v1.5.284) Gießpunkt schlägt Kalender: Am Gießtag entscheidet der gemessene Topf (giessenLautMessung).
 *
 * Der Fehler (Bewertung vom 17.09.2026, Hebel 1 #13): Mit Hebe-Test „Mittel" drei Tage nach dem Guss sagten Karte, Satz und
 * Eintrag „heute gießen, ca. 1500 ml" — nur ein ganz voller Topf hielt die App an. ANBAU.md 1.2 und 15.
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

// Ein Zyklus, an dem heute ein Gießtag in der Blüte ist. vorher: { Tage zurück: Eintrag }; guss (Vorgabe) = ein Guss vor genau
// einem Gießabstand (dann bleibt heute über den Anker Gießtag). Liefert Karte, Satz, Startseite, Eintrag, Gieß-Fahrplan und Helfer.
const LAUF = (opt) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = ${opt.einsteiger !== false};
  const c = addCyc({ name: 'Punkt', seedType: 'auto', medium: '${opt.medium || 'erde'}', growType: '${opt.growType || 'indoor'}' });
  c.potSize = 11; c.plantCount = 1; c.weightMode = '${opt.waage ? 'scale' : 'lift'}';
  ${opt.waage ? 'c.saturatedWeight = 10000; c.dryWeight = 7000;' : ''}
  const heute = todayISO();
  let gefunden = false;
  for (let d = ${opt.tagVon || 40}; d <= ${opt.tagBis || 95}; d++) {
    c.startDate = isoPlus(heute, -(d - 1));
    if (${!!opt.topping}) c.toppingDate = heute;
    const p0 = phase(heute, c);
    if (p0 && (p0.ph === 'bloom' || ${!!opt.aktion}) && getAction(heute, c) === '${opt.aktion || 'giess'}') { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: 'kein Gießtag' });
  const h = _gussIv(c, heute, 'bloom');
  const vorher = ${JSON.stringify(opt.vorher || {})};
  if (${opt.guss !== false}) vorher[h] = Object.assign({ water: '2000' }, vorher[h] || {});
  Object.keys(vorher).forEach(k => { S.entries[isoPlus(heute, -Number(k))] = { cycleData: { [c.id]: Object.assign({}, vorher[k]) } }; });
  if (${!!opt.heute}) S.entries[heute] = { cycleData: { [c.id]: Object.assign({}, ${JSON.stringify(opt.heute || {})}) } };
  saveS();
  const p = phase(heute, c), a = getAction(heute, c);
  if (a !== '${opt.aktion || 'giess'}') return JSON.stringify({ fehlt: 'Aktion nach dem Eintragen: ' + a });
  const gm = giessenLautMessung(c, heute);
  const karte = getTodayAction(c, p, a, heute) || {};
  const satz = plainSentence(a, c, p, waterSuggestion(c, p, heute)) || '';
  const autofill = (getAutoFillTemplate(c, p, a, heute) || {}).water;
  renderDash();
  const dash = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
  openEntry(heute);
  const eb = document.getElementById('entry-body');
  const eintrag = eb ? eb.textContent.replace(/\\s+/g, ' ') : '';
  goTo('gussplan');
  const plan = document.getElementById('scr-gussplan').textContent.replace(/\\s+/g, ' ');
  const erl = _gussHeuteErledigt(c, heute);
  let erledigtWasser = null, aktionDanach = null;
  if (${!!opt.erledigt}) {
    markTodayDone(c.id, heute);
    erledigtWasser = S.entries[heute].cycleData[c.id].water;
    aktionDanach = [1, 2, 3, 4].map(i => getAction(isoPlus(heute, i), c)).join(',');
  }
  const bisTag = fmtDE(isoPlus(heute, h), { weekday: 'long', day: '2-digit', month: '2-digit' });
  return JSON.stringify({ tag: p.day, h, gm, titel: karte.title || '', schritte: (karte.steps || []).join(' | '), hinweis: karte.hint || '',
    satz, dash, eintrag, plan, autofill, erl: erl && erl.status, erledigtWasser, aktionDanach, bisTag });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (opt) => { try { return JSON.parse(E(LAUF(opt))); } catch (e) { return { fehlt: 'Ausnahme: ' + e.message }; } };
  const nichtGiessen = (x) => !!(x.gm && x.gm.giessen === false);

  console.log('\nA - Erde, Gießtag, letzter Guss vor einem Gießabstand: ab welchem Restgewicht „nicht gießen"?');
  const reihe = [];
  for (let r = 20; r <= 100; r += 5) reihe.push({ r, x: lauf({ heute: { restPct: r } }) });
  const fehlt = reihe.find(z => z.x.fehlt);
  pruef('Alle 17 Gießtage angelegt', !fehlt, fehlt && fehlt.x.fehlt);
  if (!fehlt) {
    pruef('Gießabstand der Erde in der Blüte: 3 Tage', reihe[0].x.h === 3, reihe[0].x.h);
    const nein = reihe.map(z => nichtGiessen(z.x));
    const erstesNein = nein.indexOf(true);
    pruef('Monoton: ab dem ersten „nicht gießen" bleibt es dabei', erstesNein > 0 && nein.slice(erstesNein).every(Boolean), reihe.map(z => z.r + ':' + (z.x.gm ? z.x.gm.grund : '-')).join(' '));
    // Hebe-Test mit der Untergrenze seines Bandes: „Mittel" (60–84) zählt 60, Tempo (100 − 60) / 3 → am nächsten Gießtag 20 < 40.
    // „Voll" unter 95 zählt 85: Tempo 5 je Tag → 70 ≥ 40, nicht gießen.
    pruef('Hebe-Test „Mittel" (60–80 %) am Gießtag: gießen', reihe.filter(z => z.r >= 60 && z.r < 85).every(z => z.x.gm.giessen === true),
      reihe.filter(z => z.r >= 60 && z.r < 85).map(z => z.r + ':' + z.x.gm.grund).join(' '));
    pruef('Band „Voll" unter 95 %: noch feucht, ab 95 % voll', reihe.filter(z => z.r >= 85 && z.r < 95).every(z => z.x.gm.grund === 'feucht') && reihe.filter(z => z.r >= 95).every(z => z.x.gm.grund === 'voll'));
    pruef('Unter dem Gießpunkt (40 %) immer gießen', reihe.filter(z => z.r < 40).every(z => z.x.gm.giessen === true && (z.x.gm.grund === 'giesspunkt' || z.x.gm.grund === 'trocken')));
    pruef('Jede Stufe sagt auf der Karte dasselbe wie der Helfer',
      reihe.every(z => nichtGiessen(z.x) === /der Topf ist noch (voll|feucht)/.test(z.x.titel)),
      reihe.filter(z => nichtGiessen(z.x) !== /der Topf ist noch (voll|feucht)/.test(z.x.titel)).map(z => z.r + ': ' + z.x.titel).join(' | '));
  }

  console.log('\nB - Hebe-Test 90 % („Voll", unter 95) am Gießtag: noch feucht');
  const b = lauf({ heute: { restPct: 90 } });
  pruef('Gießtag angelegt', !b.fehlt, b.fehlt);
  if (!b.fehlt) {
    pruef('Karte: „Gießtag — der Topf ist noch feucht"', b.titel === '💧 Gießtag — der Topf ist noch feucht', b.titel);
    pruef('Karte nennt den Hebe-Test und „heute nicht gießen"', /Dein Hebe-Test heute: „Voll" — <b>heute nicht gießen<\/b>/.test(b.schritte), b.schritte);
    pruef('Karte nennt den nächsten Gießtag und den Gießpunkt', b.schritte.includes('Am ' + b.bisTag + ' wird gegossen') && /Zeigt der Hebe-Test vorher „Knapp", gieß schon dann/.test(b.schritte), b.schritte);
    pruef('Karte ohne Gießmenge', !/\d+ ml/.test(b.schritte), b.schritte);
    pruef('Hinweis erklärt den Grund (Luft, nicht Wasser)', /Gießpunkt/.test(b.hinweis) && /Sauerstoff/.test(b.hinweis), b.hinweis);
    pruef('Satz: „Dein Topf ist heute noch feucht", „Heute nicht gießen", keine Menge',
      /^Dein Topf ist heute noch feucht — der Hebe-Test sagt „Voll"\. <b>Heute nicht gießen\.<\/b>/.test(b.satz) && !/\d+ ml/.test(b.satz), b.satz);
    pruef('Startseite sagt „noch feucht" und nennt keinen Guss für heute', /noch feucht/.test(b.dash) && !/Heute: Gießtag/.test(b.dash), (b.dash.match(/.{0,60}feucht.{0,60}/) || [''])[0]);
    pruef('Eintrag: „Gießtag — der Topf ist noch feucht: heute nicht gießen"', /Gießtag — der Topf ist noch feucht: heute nicht gießen/.test(b.eintrag), (b.eintrag.match(/.{0,60}feucht.{0,60}/) || [''])[0]);
    pruef('Eintrag ohne „Heute gießen — geplanter Gieß-Tag"', !/Heute gießen — geplanter Gieß-Tag/.test(b.eintrag));
    pruef('Eintrag ohne Vorschlagsmenge, mit „Topf ist noch feucht"', !/Vorschlag: ~\d+ ml/.test(b.eintrag) && /Topf ist noch feucht — heute nicht gießen/.test(b.eintrag), (b.eintrag.match(/.{0,40}Vorschlag.{0,60}/) || [''])[0]);
    pruef('Gieß-Fahrplan: Karte „Heute nicht gießen — der Topf ist noch feucht"', /Heute nicht gießen — der Topf ist noch feucht/.test(b.plan) && b.plan.includes('Am ' + b.bisTag + ' wird gegossen'), (b.plan.match(/.{0,40}nicht gießen.{0,120}/) || [''])[0]);
    pruef('Gieß-Fahrplan: die Listenzeile von heute nennt keine Menge', /heute Topf noch feucht — heute nicht gießen/.test(b.plan) && !/· heute etwa \d+ ml/.test(b.plan), (b.plan.match(/.{0,30}· heute.{0,60}/) || [''])[0]);
    pruef('„Tag automatisch ausfüllen" trägt 0 ml ein', b.autofill === '0', b.autofill);
    pruef('Guss von heute gilt als beantwortet („feucht")', b.erl === 'feucht', b.erl);
  }

  console.log('\nC - Hebe-Test „Mittel" (70 %) und „Bald" (50 %) am Gießtag: gießen');
  for (const [name, rest] of [['„Mittel"', 70], ['„Bald"', 50]]) {
    const x = lauf({ heute: { restPct: rest } });
    if (x.fehlt) { pruef(name + ' angelegt', false, x.fehlt); continue; }
    const ml = parseInt((x.satz.match(/etwa <b>(\d+) ml/) || [])[1], 10);
    pruef(name + ': normaler Gießtag mit Menge', x.titel === '💧 Heute: Gießtag' && ml > 0, x.titel + ' · ' + x.satz.slice(0, 80));
    pruef(name + ': Eintrag „Heute gießen — geplanter Gieß-Tag"', /Heute gießen — geplanter Gieß-Tag/.test(x.eintrag));
    pruef(name + ': Auto-Ausfüllen mit Menge', parseFloat(x.autofill) > 0, x.autofill);
  }

  console.log('\nD - Hebe-Test „Voll" (100 %) bleibt wie bisher');
  const d = lauf({ heute: { restPct: 100 } });
  if (!d.fehlt) {
    pruef('Karte „noch voll" mit „Voll" und „Morgen wieder anheben"', d.titel === '💧 Gießtag — der Topf ist noch voll' && /Dein Hebe-Test heute: „Voll" — <b>heute nicht gießen<\/b> \| Morgen wieder anheben: Gegossen wird, sobald er „Knapp" zeigt/.test(d.schritte), d.titel + ' · ' + d.schritte);
    pruef('Satz wie bisher', d.satz === 'Dein Topf ist heute noch voll — der Hebe-Test sagt „Voll". <b>Heute nicht gießen.</b> Heb ihn morgen wieder an: Gegossen wird, sobald er „Knapp" zeigt.', d.satz);
    pruef('Gieß-Fahrplan wie bisher, Listenzeile ohne Menge', /Heute nicht gießen — der Topf ist noch voll/.test(d.plan) && /Dein Hebe-Test heute: „Voll"\. Heb ihn morgen wieder an\./.test(d.plan) && /heute Topf noch voll — heute nicht gießen/.test(d.plan));
  }

  console.log('\nE - Coco (Gießpunkt „Mittel", jeden Tag Gießtag)');
  for (const rest of [80, 90]) {
    const x = lauf({ medium: 'coco', heute: { restPct: rest } });
    if (x.fehlt) { pruef('Coco ' + rest + ' % angelegt', false, x.fehlt); continue; }
    pruef(`Coco ${rest} %: gießen (ein Hebe-Test-Band belegt keinen Tag Reserve)`, x.gm && x.gm.giessen === true && x.titel === '💧 Heute: Gießtag', JSON.stringify(x.gm) + ' ' + x.titel);
  }

  console.log('\nF - Waage statt Hebe-Test (genauer Wert)');
  const f = lauf({ waage: true, heute: { weightG: 8929 } });
  const f65 = lauf({ waage: true, heute: { weightG: 8500 } });
  if (!f.fehlt && !f65.fehlt) {
    pruef('Waage ~75 %: bleibt bis zum nächsten Gießtag über dem Gießpunkt, nicht gießen', f.gm && f.gm.grund === 'feucht', JSON.stringify(f.gm));
    pruef('Karte und Satz nennen die Waage', /Deine Waage heute: ~75 % Restgewicht/.test(f.schritte) && /die Waage zeigt ~75 % Restgewicht/.test(f.satz) && /Zeigt die Waage vorher ~40 % Restgewicht oder weniger/.test(f.schritte), f.schritte + ' · ' + f.satz);
    pruef('Waage ~65 %: fiele unter den Gießpunkt, gießen', f65.gm && f65.gm.giessen === true && f65.gm.grund === 'reserve', JSON.stringify(f65.gm));
  } else pruef('Waage-Gießtage angelegt', false, f.fehlt || f65.fehlt);

  console.log('\nG - Ohne Grundlage gilt der Kalender, und nie zweimal auslassen');
  const g1 = lauf({});
  if (!g1.fehlt) pruef('Kein Hebe-Test heute: Gießtag', g1.gm === null && g1.titel === '💧 Heute: Gießtag', JSON.stringify(g1.gm) + ' ' + g1.titel);
  const g2 = lauf({ guss: false, heute: { restPct: 90 } });
  if (!g2.fehlt) pruef('Kein eingetragener Guss in 21 Tagen: Gießtag', g2.gm === null && g2.titel === '💧 Heute: Gießtag', JSON.stringify(g2.gm) + ' ' + g2.titel);
  const g3 = lauf({ guss: false, vorher: { 6: { water: '2000' } }, heute: { restPct: 90 } });
  if (!g3.fehlt) pruef('Letzter Guss zwei Gießabstände her (einmal ausgelassen), heute 90 %: gießen', g3.gm && g3.gm.giessen === true && g3.gm.grund === 'abstand' && g3.titel === '💧 Heute: Gießtag', JSON.stringify(g3.gm) + ' ' + g3.titel);
  else pruef('Fall „einmal ausgelassen" angelegt', false, g3.fehlt);
  const g3b = lauf({ guss: false, vorher: { 6: { water: '2000' } }, heute: { restPct: 50 } });
  if (!g3b.fehlt) pruef('… und mit „Bald": gießen', g3b.gm && g3b.gm.giessen === true && g3b.titel === '💧 Heute: Gießtag', JSON.stringify(g3b.gm));
  const g4 = lauf({ heute: { restPct: 90, water: '1500' } });
  if (!g4.fehlt) pruef('Heute schon gegossen und eingetragen: der Guss bleibt auf der Karte', g4.gm === null && g4.titel === '💧 Heute: Gießtag' && /1500 ml/.test(g4.schritte), g4.titel + ' · ' + g4.schritte);

  console.log('\nH - Gemessenes Tempo geht vor, wenn es schneller ist');
  // Vor-Messung am letzten Guss: 40 % nach 3 Tagen → 20 Punkte je Tag. 85 − 60 = 25 < 40: heute gießen.
  const hh = lauf({ vorher: { 6: { water: '2000' }, 3: { restPct: 40 } }, heute: { restPct: 90 } });
  if (!hh.fehlt) pruef('Schnell trocknender Topf bei 90 %: heute gießen (Reserve)', hh.gm && hh.gm.giessen === true && hh.gm.grund === 'reserve' && hh.titel === '💧 Heute: Gießtag', JSON.stringify(hh.gm) + ' ' + hh.titel);
  else pruef('Fall mit Vor-Messung angelegt', false, hh.fehlt);

  console.log('\nI - „Erledigt" an einem feuchten Tag');
  const i90 = lauf({ heute: { restPct: 90 }, erledigt: true });
  const i50 = lauf({ heute: { restPct: 50 }, erledigt: true });
  if (!i90.fehlt && !i50.fehlt) {
    pruef('Feucht: „Erledigt" trägt keine Gießmenge ein (0 wie am vollen Tag)', i90.erledigtWasser === '0', i90.erledigtWasser);
    pruef('Bald: „Erledigt" trägt die Vorschlagsmenge ein', parseFloat(i50.erledigtWasser) > 0, i50.erledigtWasser);
    pruef('Feucht: der nächste Gießtag bleibt einen Gießabstand später', i90.aktionDanach.split(',')[i90.h - 1] === 'giess', i90.aktionDanach);
  }

  console.log('\nJ - Spültag, Outdoor, Topping-Tag und Autos vor Tag 25 folgen dem Plan');
  const spuel = lauf({ aktion: 'spuelen', heute: { restPct: 90 } });
  if (!spuel.fehlt) pruef('Spültag, 90 %: keine Aussage, kein „noch feucht"', spuel.gm === null && !/noch feucht/.test(spuel.titel), JSON.stringify(spuel.gm) + ' ' + spuel.titel);
  else pruef('Spültag angelegt', false, spuel.fehlt);
  const drau = lauf({ growType: 'outdoor', heute: { restPct: 90 } });
  if (!drau.fehlt) pruef('Outdoor: keine Aussage', drau.gm === null && !/noch feucht/.test(drau.titel), JSON.stringify(drau.gm) + ' ' + drau.titel);
  const top = lauf({ topping: true, heute: { restPct: 90 } });
  if (!top.fehlt) pruef('Topping-Tag: keine Aussage, kein „noch feucht" auf Karte und Eintrag', top.gm === null && !/noch feucht/.test(top.titel + top.eintrag), JSON.stringify(top.gm) + ' ' + top.titel);
  else pruef('Topping-Tag angelegt', false, top.fehlt);
  const frueh = lauf({ tagVon: 22, tagBis: 24, heute: { restPct: 90 } });
  if (!frueh.fehlt) pruef('Auto in der Blüte vor Tag 25: keine Aussage', frueh.gm === null && frueh.tag < 25 && !/noch feucht/.test(frueh.titel), frueh.tag + ' ' + JSON.stringify(frueh.gm));
  else pruef('Gießtag an Tag 22–24 angelegt', false, frueh.fehlt);

  console.log('\nK - Profi-Modus');
  const k = lauf({ einsteiger: false, heute: { restPct: 90 } });
  if (!k.fehlt) pruef('Profi-Startseite: „noch feucht", kein Gießtag mit Menge', /der Topf ist noch feucht/.test(k.dash) && !/Heute: Gießtag/.test(k.dash), (k.dash.match(/.{0,60}feucht.{0,60}/) || [''])[0]);

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
