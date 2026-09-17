/**
 * (v1.5.265) Nach dem Plan-Erntetag ohne Schnitt — Startseite, Tipp, Gieß-Fahrplan, Eintrag und Hebe-Test-Bewertung.
 *
 * Der Fehler (Bewertung vom 17.09.2026, Hebel 1): Seit v1.5.264 sagt die Startseite am Plan-Erntetag „noch nicht schneiden",
 * solange die Trichome nicht reif sind. Am Tag danach stand dort „Trocknung läuft", der Gieß-Fahrplan sagte „Ab der Ernte
 * wird nicht mehr gegossen", und der Eintrag blendete Hebe-Test und Trichom-Karte aus — über einer stehenden Pflanze.
 *
 * Jetzt liest die App aus den Einträgen, ob die Pflanze noch steht (_stehtNochNachPlan), und ernteOffen ist die eine Regel
 * für alle Stellen. Ohne jeden Beleg bleibt es beim Kalender.
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

// Zyklus so datieren, dass heute der Plan-Erntetag + nach ist. setup: JS-Text mit eintrag(tageNachErnte) und c, ernte, heute.
const LAGE = (opt) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = ${opt.einsteiger !== false};
  const c = addCyc({ name: 'Nachernte', seedType: 'auto', medium: '${opt.medium || 'erde'}' });
  c.potSize = 11; c.plantCount = 2; c.targetAmber = ${opt.ziel || 5}; c.weightMode = 'lift';
  c.plants = [{ id: 'pa', label: 'Pflanze 1' }, { id: 'pb', label: 'Pflanze 2' }];
  let gefunden = false;
  for (let d = 80; d <= 160; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    if (getAction(todayISO(), c) === 'ernte') { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: true });
  c.startDate = isoPlus(c.startDate, -${opt.nach || 0});
  const heute = todayISO();
  const ernte = isoPlus(heute, -${opt.nach || 0});
  const eintrag = (tage) => {
    const iso = isoPlus(ernte, tage);
    if (!S.entries[iso]) S.entries[iso] = {};
    if (!S.entries[iso].cycleData) S.entries[iso].cycleData = {};
    return S.entries[iso].cycleData[c.id] || (S.entries[iso].cycleData[c.id] = {});
  };
  ${opt.setup || ''}
  saveS();
  return JSON.stringify(Object.assign(_blick(c), { id: c.id, ernte }));
})()`;

// Was die App heute über den Zyklus sagt — Startseite, Tipp, Gieß-Fahrplan, Eintrag.
const BLICK = `window._blick = function (c) {
  const heute = todayISO();
  const p = phase(heute, c);
  const a = getAction(heute, c);
  const karte = getTodayAction(c, p, a, heute) || {};
  const satz = plainSentence(a, c, p, waterSuggestion(c, p)) || '';
  renderDash();
  const dash = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
  const tipp = getSmartTip(c, p);
  goTo('gussplan');
  const plan = document.getElementById('scr-gussplan').textContent.replace(/\\s+/g, ' ');
  openEntry(heute);
  const eb = document.getElementById('entry-body');
  const eintragText = eb ? eb.textContent.replace(/\\s+/g, ' ') : '';
  const kx = contextFor(c, heute);
  return { ph: p && p.ph, steht: _stehtNochNachPlan(c, heute), offen: ernteOffen(c, heute), titel: karte.title || '', schritte: (karte.steps || []).join(' | '),
    knoepfe: (karte.aktionen || []).map(x => x.label).join(','), satz, dash, tipp: tipp ? tipp.text : '', plan,
    eintrag: eintragText, trichKarte: !!document.getElementById('trich-' + c.id), noWater: kx ? kx.noWaterPhase : 'kein Kontext' };
};`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(BLICK);
  const lauf = (opt) => JSON.parse(E(LAGE(opt)));
  const kaputt = /undefined|NaN|\[object Object\]/;

  console.log('\nA - Zwei Tage nach dem Plan-Erntetag, gegossen am Tag danach');
  const a = lauf({ nach: 2, setup: "eintrag(1).water = '1500';" });
  pruef('Lage gefunden, Kalender sagt Trocknen', !a.fehlt && a.ph === 'dry', JSON.stringify(a).slice(0, 80));
  if (!a.fehlt) {
    pruef('Steht noch, seit 2 Tagen', a.steht && a.steht.seitTagen === 2 && a.offen === true, JSON.stringify(a.steht));
    pruef('Satz: Plan-Erntetag war vor 2 Tagen, nicht „trocknet gerade"', /Dein Plan-Erntetag war vor 2 Tagen, und die Pflanze steht noch/.test(a.satz) && !/trocknet gerade/.test(a.satz), a.satz);
    pruef('Karte: „Nach dem Plan-Erntetag — erst Trichome prüfen" mit Messen und „Schon geschnitten"',
      a.titel === '🔍 Nach dem Plan-Erntetag — erst Trichome prüfen' && a.knoepfe === '🔬 Trichome eintragen,✂️ Schon geschnitten', a.titel + ' / ' + a.knoepfe);
    pruef('Startseite ohne „Trocknung läuft", Zeile sagt „Ernte offen"', !/Trocknung läuft/.test(a.dash) && /Ernte offen/.test(a.dash) && /Schon geschnitten/.test(a.dash));
    pruef('Tipp: Pflanze steht noch, kein Trocknungs-Tipp', /Die Pflanze steht nach dem Plan-Erntetag noch/.test(a.tipp), a.tipp);
    pruef('Hebe-Test-Bewertung ohne „nicht mehr gießen" (noWaterPhase null)', a.noWater === null, a.noWater);
    pruef('Gieß-Fahrplan: gießen beim Gießpunkt, nicht „Ab der Ernte wird nicht mehr gegossen"',
      /Gießen, sobald der Hebe-Test „Knapp" zeigt/.test(a.plan) && /Dein Plan-Erntetag ist vorbei, und die Pflanze steht noch/.test(a.plan) && !/Ab der Ernte wird nicht mehr gegossen/.test(a.plan),
      (a.plan.match(/Nächster Guss.{0,200}/) || [''])[0]);
    pruef('Eintrag: Trichom-Karte da, Hebe-Test nicht übersprungen, Kopf „Ernte offen"',
      a.trichKarte && !/Trocknungs-Phase — kein Hebe-Test/.test(a.eintrag) && /Ernte offen — die Pflanze steht noch/.test(a.eintrag));
    pruef('Keine kaputten Werte auf Startseite, Fahrplan und Eintrag', !kaputt.test(a.satz + a.dash + a.plan + a.eintrag),
      ((a.dash + a.plan + a.eintrag).match(/.{0,40}(undefined|NaN|\[object Object\]).{0,40}/) || [''])[0]);
  }

  console.log('\nB - Am Plan-Erntetag 30 % klar gemessen, heute Tag 2 danach');
  const b = lauf({ nach: 2, setup: 'eintrag(0).trichomes = { clear: 30, milky: 68, amber: 2 };' });
  if (!b.fehlt) {
    pruef('Unreife Messung am Erntetag zählt als „steht noch"', b.steht && b.steht.seitTagen === 2, JSON.stringify(b.steht));
    pruef('Karte: „Nach dem Plan-Erntetag — noch nicht schneiden", nennt 30 % klar',
      b.titel === '🔍 Nach dem Plan-Erntetag — noch nicht schneiden' && /30 % klar/.test(b.schritte), b.titel);
    pruef('Satz: „deine Trichome sagen noch nicht"', /Dein Plan-Erntetag war vor 2 Tagen — <b>deine Trichome sagen noch nicht<\/b>/.test(b.satz) && /Noch nicht schneiden/.test(b.satz), b.satz);
    pruef('Tipp: Plan-Erntetag vorbei, noch 30 % klar', /Plan-Erntetag vorbei, aber noch 30 % klar/.test(b.tipp), b.tipp);
  }

  console.log('\nC - Steht noch, heute reif gemessen, dann „Erledigt"');
  const cc = lauf({ nach: 3, setup: "eintrag(1).water = '1500'; eintrag(3).trichomes = { clear: 5, milky: 83, amber: 12 };" });
  if (!cc.fehlt) {
    pruef('Karte: „Heute: Ernte!" mit „Erledigt"', cc.titel === '✂️ Heute: Ernte!' && cc.knoepfe === '' && /Erledigt/.test(cc.dash), cc.titel + ' / ' + cc.knoepfe);
    pruef('Satz: schneiden, bevor das Licht angeht', /Schneide die Pflanze ab, bevor das Licht angeht/.test(cc.satz), cc.satz);
    const nachher = JSON.parse(E(`(function(){ markTodayDone('${cc.id}', todayISO()); return JSON.stringify(_blick(S.cycles.find(x => x.id === '${cc.id}'))); })()`));
    pruef('Nach „Erledigt" gilt die Trocknung', nachher.steht === null && nachher.titel === '🍂 Trocknung läuft' && nachher.noWater === 'nachErnte', nachher.titel + ' / ' + nachher.noWater);
  }

  console.log('\nD - „Erledigt" am Plan-Erntetag, danach nichts');
  const d = lauf({ nach: 2, setup: 'eintrag(0)._doneTodo = Date.now();' });
  if (!d.fehlt) pruef('Trocknung läuft wie bisher', d.steht === null && d.titel === '🍂 Trocknung läuft' && d.noWater === 'nachErnte', d.titel);

  console.log('\nE - Beide Pflanzen einzeln geerntet, auch wenn danach ein Guss eingetragen ist');
  const e = lauf({ nach: 2, setup: "eintrag(1).water = '1500'; c.plants.forEach(pl => { pl.harvestedAt = isoPlus(ernte, 1); });" });
  if (!e.fehlt) pruef('Alle geerntet schlägt den Guss', e.steht === null && e.titel === '🍂 Trocknung läuft', e.titel);

  console.log('\nF - Keine Einträge nach dem Plan-Erntetag');
  const f = lauf({ nach: 2 });
  if (!f.fehlt) {
    pruef('Ohne Beleg bleibt der Kalender: Trocknung läuft', f.steht === null && f.titel === '🍂 Trocknung läuft' && /trocknet gerade/.test(f.satz), f.titel);
    pruef('Gieß-Fahrplan „Trocknen läuft", Eintrag ohne Trichom-Karte', /Trocknen läuft/.test(f.plan) && !f.trichKarte && /Trocknungs-Phase — kein Hebe-Test/.test(f.eintrag));
    pruef('Hebe-Test-Bewertung „nachErnte"', f.noWater === 'nachErnte', f.noWater);
  }

  console.log('\nG - Am Plan-Erntetag selbst');
  const g = lauf({ nach: 0 });
  if (!g.fehlt) {
    pruef('Ohne Messung: Ernte offen, Hebe-Test bewertet normal', g.offen === true && g.noWater === null, g.noWater);
    pruef('Eintrag überspringt den Hebe-Test nicht', !/Ernte-Tag — kein Hebe-Test/.test(g.eintrag));
    pruef('Gieß-Fahrplan: geschnitten wird erst mit Freigabe, nicht „Geerntet"',
      /Heute ist dein Plan-Erntetag — geschnitten wird erst, wenn die Trichome es freigeben \(höchstens 10 % klar\)/.test(g.plan) && !/Geerntet/.test(g.plan));
  }
  const g2 = lauf({ nach: 0, setup: 'eintrag(0).trichomes = { clear: 5, milky: 83, amber: 12 };' });
  if (!g2.fehlt) {
    pruef('Reif gemessen: Erntetag ohne Gießen wie bisher', g2.offen === false && g2.noWater === 'harvest' && /Geerntet/.test(g2.plan), g2.noWater);
  }

  console.log('\nH - Neun Tage nach dem Plan-Erntetag (Kalender: Curing), am Vortag gegossen');
  const h = lauf({ nach: 9, setup: "eintrag(8).water = '1500';" });
  if (!h.fehlt) {
    pruef('Kalender sagt Curing', h.ph === 'cure', h.ph);
    pruef('Kein Curing-Tipp, sondern der Ernte-Tipp', !/Curing Tag/.test(h.tipp) && /steht nach dem Plan-Erntetag noch/.test(h.tipp), h.tipp);
    pruef('Satz nennt 9 Tage, Karte „Nach dem Plan-Erntetag"', /vor 9 Tagen/.test(h.satz) && /^🔍 Nach dem Plan-Erntetag/.test(h.titel), h.titel);
    pruef('Hebe-Test-Bewertung ohne „geerntet"', h.noWater === null, h.noWater);
  }

  console.log('\nI - Ein Hebe-Test am Tag danach zählt, ein App-Vorschlag als Guss nicht');
  const i1 = lauf({ nach: 2, setup: 'eintrag(1).restPct = 40;' });
  if (!i1.fehlt) pruef('Hebe-Test nach dem Plan-Erntetag: steht noch', !!i1.steht);
  const i2 = lauf({ nach: 2, setup: "const x = eintrag(1); x.water = '1500'; x._suggested = { water: true };" });
  if (!i2.fehlt) pruef('Vorgeschlagene Menge ohne eigene Eingabe: kein Beleg', i2.steht === null, JSON.stringify(i2.steht));

  console.log('\nJ - Klima einer stehenden Pflanze nach dem Plan-Erntetag (v1.5.266)');
  {
    const klima = (opt) => {
      const l = lauf(opt);
      if (l.fehlt) return { fehlt: true };
      return JSON.parse(E(`(function(){
        const c = S.cycles[0], heute = todayISO(), p = phase(heute, c);
        const st = klimaStatus(24, 68, p, c);
        const warn = getEntryWarnings({}, p, { temp: '33', humidity: '75' }, c, heute).map(x => x.text).join(' | ');
        const ziel = getPhaseTargets(p);
        const e = S.entries[heute] || (S.entries[heute] = {});
        e.temp = '24'; e.humidity = '68'; saveS();
        openEntry(heute);
        const eb = document.getElementById('entry-body');
        return JSON.stringify({ stufe: klimaStufe(p), s: st ? st.s : null, deckel: st ? st.ziel.deckel : null, warn,
          zielLabel: ziel ? ziel.label : null, json: JSON.stringify(p), eintrag: eb ? eb.textContent.replace(/\\s+/g, ' ') : '' });
      })()`));
    };
    const j = klima({ nach: 2, setup: "eintrag(1).water = '1500';" });
    if (!j.fehlt) {
      pruef('Stufe „späte Blüte" statt keiner', j.stufe === 'spaet' && j.zielLabel === 'Späte Blüte', j.stufe + ' / ' + j.zielLabel);
      pruef('68 % bei 24 °C: über dem Schimmel-Deckel von 60 %', j.s === 'schimmel' && j.deckel === 60, j.s);
      pruef('33 °C: Hitze-Warnung wie in der Blüte, nicht still wie beim Trocknen', /zu heiß/.test(j.warn), j.warn);
      pruef('Eintrag nennt die späte Blüte, nicht das Trockenklima', /Späte Blüte/.test(j.eintrag) && !/Trocknen: 18–20/.test(j.eintrag));
      pruef('Phase als JSON unverändert (ernteOffen nicht aufzählbar)', !/ernteOffen/.test(j.json), j.json);
    }
    const j2 = klima({ nach: 2 });
    if (!j2.fehlt) {
      pruef('Ohne Beleg: keine Blüte-Stufe, keine Hitze-Warnung wie bisher', j2.stufe === null && j2.s === null && !/zu heiß/.test(j2.warn), j2.stufe + ' / ' + j2.warn);
    }
    const j3 = klima({ nach: 0 });
    if (!j3.fehlt) pruef('Plan-Erntetag bleibt Stufe „Ernte" (Deckel 60 %)', j3.stufe === 'ernte' && j3.deckel === 60, j3.stufe);
  }

  console.log('\nK - Phasen-Name und Tag einer stehenden Pflanze (v1.5.269)');
  {
    const anzeige = (opt) => {
      const l = lauf(opt);
      if (l.fehlt) return { fehlt: true };
      return JSON.parse(E(`(function(){
        const c = S.cycles[0], heute = todayISO(), p = phase(heute, c);
        const stufe = stageForCycle(c, heute);
        renderDash();
        const dash = document.getElementById('scr-dash').textContent.replace(/\s+/g, ' ');
        openEntry(heute);
        const eb = document.getElementById('entry-body');
        return JSON.stringify({ stufe, stufenName: STAGE_NAMES[stufe], tagLabel: phaseDayLabel(p), dash,
          eintrag: eb ? eb.textContent.replace(/\s+/g, ' ') : '' });
      })()`));
    };
    const k = anzeige({ nach: 2, setup: "eintrag(1).water = '1500';" });
    if (!k.fehlt) {
      pruef('Stadium „Ernte" statt „Trocknung"', k.stufe === 8 && k.stufenName === 'Ernte', k.stufe + ' ' + k.stufenName);
      pruef('Startseite: „🔍 Ernte offen · Tag", kein „Trocknen · Tag"', /🔍 Ernte offen · Tag \d+/.test(k.dash) && !/Trocknen · Tag/.test(k.dash) && !/Trocknung · Tag/.test(k.dash),
        (k.dash.match(/.{0,30}(Trockn|Ernte offen).{0,30}/) || [''])[0]);
      pruef('Eintragskopf: „🔍 Ernte offen"', /🔍 Ernte offen/.test(k.eintrag) && !/🍂 Trocknen/.test(k.eintrag));
    }
    const k2 = anzeige({ nach: 9, setup: "eintrag(8).water = '1500';" });
    if (!k2.fehlt) pruef('Im Curing-Zeitraum: „Tag N" statt „Tag x/y Curing"', /^Tag \d+$/.test(k2.tagLabel) && /🔍 Ernte offen · Tag \d+/.test(k2.dash), k2.tagLabel);
    const k3 = anzeige({ nach: 2 });
    if (!k3.fehlt) pruef('Ohne Beleg wie bisher: Stadium „Trocknung", „🍂 Trocknen · Tag"', k3.stufe === 9 && /🍂 Trocknen · Tag \d+/.test(k3.dash), k3.stufe);
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();

