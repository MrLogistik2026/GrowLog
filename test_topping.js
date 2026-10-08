// Topping und Gießplan (Prüfung vom 08.10.2026, Nachtprüfung Punkt 5).
//
//   P1 (v1.5.426)  Versprochener erster Guss nach dem Topping = erster Gießtag im Plan (Standard-Start Tag 15–21, auch „direct“).
//   P2 (v1.5.427)  Voller Topf am Topping-Tag: kein „Heute gießen — dann toppen“ / „Erst gießen“ neben „Topf ist voll“.
//   P3 (v1.5.428)  „Jetzt Toppen“ ändert den heutigen Gießtag nicht (Blütetage 28–36, 40).
//   P4 (v1.5.429)  Startseite, Anzucht-Karte: an einem Wasser-Tag laut Plan steht „Wasser-Tag“, nicht „Dünger laut Plan“.
//   P8 (v1.5.434)  Lexikon, Fehlersuche, FAQ und Demo ohne alte Topping-Aussagen (Turgor-Schnitt, Wundheilung, „Nicht bei Automatics“).
//   P7 (v1.5.433)  Topping-Tag folgt dem Plan; Wasser danach nur bei Plänen mit Eingriffs-Regel (Rainbow).
//   P6 (v1.5.432)  Ruhe nach dem Topping bis zum nächsten geplanten Guss, frühestens 48 h; am Gießpunkt „gieß trotzdem“.
//   P5 (v1.5.431)  Topping-Tag folgt der Messung (auch bei „Mittel“); Auto-Ausfüllen arbeitet dort wie an jedem Gießtag.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, arcTo: noop, rect: noop, fill: noop, stroke: noop,
    fillRect: noop, clearRect: noop, strokeRect: noop, save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    setTransform: noop, fillText: noop, strokeText: noop, drawImage: noop, clip: noop, setLineDash: noop, quadraticCurveTo: noop,
    bezierCurveTo: noop, measureText: () => ({ width: 0 }), createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}
async function starte() {
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
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  w.toast = () => {};
  w.eval('S._seedlingProtocolShown = true; customConfirm = async () => true;');
  return { w, errors, E: (s) => w.eval(s) };
}

(async () => {
  const fehler = [];
  let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const a = await starte();
  const neu = (seedType, tag, plan, start) => `(function(){ S.cycles = []; S.entries = {}; const heute = todayISO();
    const c = addCyc({ name: 'Gruppe A', startDate: isoPlus(heute, -(${tag} - 1)), seedType: '${seedType}', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: '${start || 'saturated'}', fertPlanId: _planFuerVorlage('${plan}') }, { still: true });
    S.cycles = [c]; selId = c.id; window.__c = c; return c; })()`;

  // P1 (v1.5.426) · Versprechen = Plan
  {
    const falsch = [];
    for (const start of ['saturated', 'direct']) for (const mitGuss of [true, false]) for (let T = 15; T <= 21; T++) {
      a.E(neu('auto', T, 'rainbow_auto', start));
      a.E(`(function(){ const c = window.__c; const heute = todayISO();
        for (let d = 1; d < ${T}; d++) { const iso = isoPlus(c.startDate, d - 1); const x = getAction(iso, c);
          if (x === 'giess_anz' || x === 'saettigung') S.entries[iso] = { cycleData: { [c.id]: { water: '400' } } }; }
        if (${mitGuss} && getAction(heute, c) === 'giess_anz') S.entries[heute] = { cycleData: { [c.id]: { water: '400' } } }; saveS(); })()`);
      await a.w.eval('doTopping(window.__c.id, todayISO())');
      const erster = a.E(`(function(){ const c = window.__c; for (let d = ${T} + 1; d <= ${T} + 20; d++) if (isGiessTag(isoPlus(c.startDate, d - 1), c)) return d; return null; })()`);
      const pause = a.E('window.__c.toppingPause || 2');
      if (erster !== T + pause + 1) falsch.push(`${start}${mitGuss ? '+Guss' : ''} Tag ${T}: versprochen ${T + pause + 1}, Plan ${erster}`);
    }
    pruefe(falsch.length === 0, `P1 ${falsch.length} von 28 Fällen: versprochener erster Guss ≠ Plan: ` + falsch.slice(0, 4).join(' | '));
  }

  // P2 (v1.5.427) · Voller Topf am Topping-Tag
  {
    let lage = null;
    for (let t = 25; t <= 60 && !lage; t++) {
      a.E(neu('fem', t, 'biobizz_light'));
      if (a.E(`(function(){ window.__c.anzuchtDays = 35; return getAction(todayISO(), window.__c); })()`) === 'giess_anz') lage = t;
    }
    pruefe(!!lage, 'P2-0 Prüflage: kein Anzucht-Gießtag ab Tag 25 gefunden');
    if (lage) {
      a.E(`(function(){ const c = window.__c; c.weightMode = 'lift'; S.beginnerMode = true;
        S.entries[todayISO()] = { cycleData: { [c.id]: { restPct: 100, _restPctUserSet: true } } }; saveS(); })()`);
      await a.w.eval('doTopping(window.__c.id, todayISO())');
      const e = a.E(`(function(){ const heute = todayISO(); editISO = heute; openEntry(heute); return document.getElementById('entry-body').textContent.replace(/\\s+/g, ' '); })()`);
      const voll = /Topf ist voll|heute nicht gießen/i.test(e), giessen = /dann toppen|Erst gießen/.test(e);
      pruefe(voll && !giessen, `P2-1 Topping-Tag Tag ${lage}, Hebe-Test 100 %: „voll“ ${voll}, „dann toppen/Erst gießen“ ${giessen}`);
    }
  }

  // P3 (v1.5.428) · Der Knopf ändert den heutigen Gießtag nicht
  {
    const kippt = [];
    for (const T of [28, 29, 30, 31, 32, 33, 34, 35, 36, 40]) {
      a.E(neu('fem', T, 'biobizz_light'));
      a.E(`(function(){ const c = window.__c; c.anzuchtDays = 28;
        for (let d = 9; d < ${T}; d++) { const iso = isoPlus(c.startDate, d - 1); const x = getAction(iso, c);
          if (x === 'giess_anz' || x === 'giess') S.entries[iso] = { cycleData: { [c.id]: { water: '1500' } } }; } saveS(); })()`);
      const vor = a.E('getAction(todayISO(), window.__c)');
      await a.w.eval('doTopping(window.__c.id, todayISO())');
      const nach = a.E('getAction(todayISO(), window.__c)');
      if (vor !== nach) kippt.push(`Tag ${T}: ${vor || '–'} → ${nach || '–'}`);
    }
    pruefe(kippt.length === 0, `P3 ${kippt.length} von 10 Blütetagen: „Jetzt Toppen“ ändert den heutigen Gießtag: ` + kippt.join(' | '));
  }

  // P4 (v1.5.429) · Anzucht-Karte am Wasser-Tag
  {
    a.E(neu('auto', 15, 'rainbow_auto'));
    a.E(`(function(){ const c = window.__c;
      for (let d = 1; d < 15; d++) { const iso = isoPlus(c.startDate, d - 1); const x = getAction(iso, c);
        if (x === 'giess_anz' || x === 'saettigung') S.entries[iso] = { cycleData: { [c.id]: { water: '400' } } }; } saveS(); })()`);
    // (v1.5.433) Der Wasser-Tag kommt vom FIM: erster Guss nach einem FIM ist im Rainbow-Plan reines Wasser (v1.5.387).
    a.E(`(function(){ const c = window.__c; c.trainingEvents = [{ type: 'fim', date: isoPlus(todayISO(), -1) }]; saveS(); })()`);
    const r = JSON.parse(a.E(`(function(){ const c = window.__c, heute = todayISO(), p = phase(heute, c), x = getAction(heute, c);
      const cd = (S.entries[heute] && S.entries[heute].cycleData || {})[c.id] || null;
      const k = getTodayAction(c, p, x, heute) || {};
      return JSON.stringify({ x, fw: getFeedWaterEffective(c, p, heute, cd), schritte: (k.steps || []).join(' | ').replace(/<[^>]+>/g, '') }); })()`));
    pruefe(r.x === 'giess_anz' && r.fw === 'water', 'P4-0 Prüflage (Gießtag am Tag nach dem FIM ist laut Plan Wasser-Tag): ' + JSON.stringify({ x: r.x, fw: r.fw }));
    pruefe(/Wasser-Tag laut Plan/.test(r.schritte) && !/Dünger laut Plan/.test(r.schritte), 'P4-1 Anzucht-Karte am Wasser-Tag: ' + r.schritte.slice(0, 200));
  }

  // P5 (v1.5.431) · Der Topping-Tag folgt der Messung; „Tag automatisch ausfüllen“ arbeitet dort wie an jedem Gießtag
  {
    let lage = null;
    for (let t = 30; t <= 45 && !lage; t++) {
      a.E(neu('fem', t, 'biobizz_light'));
      if (a.E(`(function(){ window.__c.anzuchtDays = 28; return getAction(todayISO(), window.__c); })()`) === 'giess') lage = t;
    }
    pruefe(!!lage, 'P5-0 Prüflage: kein Blüte-Gießtag ab Tag 30 gefunden');
    if (lage) {
      a.E(`(function(){ const c = window.__c; c.weightMode = 'lift'; S.beginnerMode = true;
        S.entries[todayISO()] = { cycleData: { [c.id]: { restPct: 70, _restPctUserSet: true } } }; saveS(); })()`);
      await a.w.eval('doTopping(window.__c.id, todayISO())');
      const r = JSON.parse(a.E(`(function(){ const c = window.__c, heute = todayISO(), p = phase(heute, c), x = getAction(heute, c);
        editISO = heute; openEntry(heute); const e = document.getElementById('entry-body').textContent.replace(/\s+/g, ' ');
        const tpl = getAutoFillTemplate(c, p, x, heute) || {};
        return JSON.stringify({ x, e: e.slice(0, 20000), tplWater: tpl.water || '', tplTyp: tpl._actionType || '' }); })()`));
      pruefe(!/dann toppen|Erst gießen|vor dem Schnitt wird gegossen/.test(r.e), `P5-1 Topping-Tag ${lage}, Hebe-Test „Mittel“: Eintrag fordert noch „erst gießen, dann toppen“`);
      pruefe(/ändert den Gießpunkt nicht|entscheidet der Topf/.test(r.e), 'P5-2 Eintrag sagt nicht, dass der Topf entscheidet');
      pruefe(r.x === 'giess' && Number(r.tplWater) > 0 && r.tplTyp !== 'topping', `P5-3 Auto-Ausfüllen am Topping-Gießtag: Wasser „${r.tplWater}“, Typ „${r.tplTyp}“`);
    }
  }

  // P6 (v1.5.432) · Ruhe als Untergrenze: bis zum nächsten geplanten Guss, aber frühestens 48 h; am Gießpunkt „gieß trotzdem“
  {
    const fall = async (seedType, tag, plan, medium, vorbereiten) => {
      a.E(neu(seedType, tag, plan));
      a.E(`(function(){ const c = window.__c; c.medium = '${medium}'; if ('${medium}' === 'coco') { c.intAnzucht = 2; c.intBloom = 2; } ${vorbereiten || ''}
        for (let d = 1; d < ${tag}; d++) { const iso = isoPlus(c.startDate, d - 1); const x = getAction(iso, c);
          if (x === 'giess_anz' || x === 'giess' || x === 'saettigung') S.entries[iso] = { cycleData: { [c.id]: { water: '400' } } }; } saveS(); })()`);
      const regulaer = a.E(`(function(){ const c = window.__c; for (let d = 1; d <= 14; d++) { const x = getAction(isoPlus(todayISO(), d), c); if (x === 'giess' || x === 'giess_anz') return d; } return null; })()`);
      const heute = a.E('getAction(todayISO(), window.__c)');
      await a.w.eval('doTopping(window.__c.id, todayISO())');
      const erster = a.E(`(function(){ const c = window.__c; for (let d = 1; d <= 14; d++) if (isGiessTag(isoPlus(todayISO(), d), c)) return d; return null; })()`);
      return { regulaer, heute, erster, pause: a.E('window.__c.toppingPause') };
    };
    // Erde, Blüte, Intervall 3: Topping am Gießtag → nächster Guss wie geplant (T+3), kein Versatz
    const r1 = await fall('fem', 30, 'biobizz_light', 'erde', 'c.anzuchtDays = 28;');
    pruefe(r1.erster === Math.max(2, r1.regulaer), `P6-1 Erde: nächster Guss ${r1.erster} statt max(48 h, regulär ${r1.regulaer}) (heute ${r1.heute}, Pause ${r1.pause})`);
    // Suche einen Tag, dessen regulärer nächster Guss T+1 wäre: dann frühestens T+2
    let r2 = null;
    for (let t = 29; t <= 40 && !r2; t++) { const r = await fall('fem', t, 'biobizz_light', 'erde', 'c.anzuchtDays = 28;'); if (r.regulaer === 1) r2 = Object.assign({ t }, r); }
    pruefe(r2 && r2.erster === 2 && r2.pause === 1, 'P6-2 regulärer Guss am Tag nach dem Schnitt: nicht frühestens 48 h danach: ' + JSON.stringify(r2));
    // Coco, Intervall 2: kein Ziehen auf T+3 mehr
    const r3 = await fall('fem', 30, 'biobizz_light', 'coco', 'c.anzuchtDays = 28;');
    pruefe(r3.erster === Math.max(2, r3.regulaer) && r3.erster <= 2, `P6-3 Coco Intervall 2: nächster Guss ${r3.erster} (regulär ${r3.regulaer}, Pause ${r3.pause})`);
    // Ruhetag mit trockenem Topf (Blüte, ab Tag 25): „gieß trotzdem“ statt „Kein Gießen“
    a.E(neu('fem', 31, 'biobizz_light')); a.E(`(function(){ const c = window.__c; c.anzuchtDays = 28; c.weightMode = 'lift'; S.beginnerMode = true; saveS(); })()`);
    await a.w.eval('doTopping(window.__c.id, isoPlus(todayISO(), -1))');
    const ruhe = a.E(`(function(){ const c = window.__c, heute = todayISO(); S.entries[heute] = { cycleData: { [c.id]: { restPct: 20, _restPctUserSet: true } } }; saveS();
      editISO = heute; openEntry(heute); return document.getElementById('entry-body').textContent.replace(/\s+/g, ' '); })()`);
    const istRuhe = /Ruhetag nach Topping/.test(ruhe);
    pruefe(!istRuhe || (/gieß trotzdem/.test(ruhe) && !/Kein Gießen/.test(ruhe)), 'P6-4 Ruhetag bei 20 % Restgewicht: ' + (ruhe.match(/Ruhetag nach Topping.{0,200}/) || [''])[0]);
    // Texte: kein Wundheilungs-Versprechen, kein „Heute gießen + toppen“, „1 Tag“ statt „1 Tage“
    const src = a.E(`[T.topping.preWaterHint({ pauseDays: 1, currentDay: 30, gp: giesspunktFor(window.__c), ab25: true, resumeDE: '01.01.' }), T.topping.preWaterHint({ pauseDays: 1, currentDay: 18, gp: giesspunktFor(window.__c), ab25: false, resumeDE: '01.01.' })].join(' ')`);
    pruefe(!/Wundheilung|turgor|2–4 Stunden/.test(src) && /nicht belegt/.test(src) && /1 Tag ohne/.test(src) && !/1 Tage/.test(src), 'P6-5 Hinweis vor dem Toppen: ' + src.slice(0, 200));
    pruefe(!/Heute gießen \+ toppen|die Schnittstelle muss|Kein Gießen<\/div>/.test(HTML), 'P6-6 Quelltext: alte Topping-Sätze („Heute gießen + toppen“, „die Schnittstelle muss … heilen“, „Kein Gießen“) stehen noch');
  }

  // P7 (v1.5.433) · Der Topping-Tag folgt dem Plan; Wasser danach nur, wo der Plan es nach einem Eingriff vorsieht (Rainbow)
  {
    a.E(neu('auto', 15, 'rainbow_auto'));
    a.E(`(function(){ const c = window.__c;
      for (let d = 1; d < 15; d++) { const iso = isoPlus(c.startDate, d - 1); const x = getAction(iso, c);
        if (x === 'giess_anz' || x === 'saettigung') S.entries[iso] = { cycleData: { [c.id]: { water: '400' } } }; } saveS(); })()`);
    await a.w.eval('doTopping(window.__c.id, todayISO())');
    const r = JSON.parse(a.E(`(function(){ const c = window.__c, heute = todayISO(); const fw = (iso) => getFeedWaterEffective(c, phase(iso, c), iso, null);
      let erster = null; for (let d = 1; d <= 14 && !erster; d++) { const iso = isoPlus(heute, d); if (isGiessTag(iso, c)) erster = iso; }
      return JSON.stringify({ heute: getAction(heute, c), fwHeute: fw(heute), erster, fwErster: erster ? fw(erster) : null, lockHeute: isToppingWaterGuss(c, heute) }); })()`));
    pruefe(r.heute === 'giess_anz' && r.fwHeute === 'feed' && !r.lockHeute, 'P7-1 Rainbow, Topping-Tag in der Anzucht: Plan sagt Feed, die App: ' + JSON.stringify(r));
    pruefe(r.fwErster === 'water', 'P7-2 Rainbow: erster Guss nach der Ruhe ist reines Wasser: ' + JSON.stringify(r));
    // Plan ohne Eingriffs-Regel: Der erste Guss danach folgt dem Plan
    let lage = null;
    for (let t = 30; t <= 45 && !lage; t++) { a.E(neu('fem', t, 'biobizz_light')); if (a.E(`(function(){ window.__c.anzuchtDays = 28; return getAction(todayISO(), window.__c); })()`) === 'giess') lage = t; }
    if (lage) {
      await a.w.eval('doTopping(window.__c.id, todayISO())');
      const b = JSON.parse(a.E(`(function(){ const c = window.__c, heute = todayISO(); let erster = null;
        for (let d = 1; d <= 14 && !erster; d++) { const iso = isoPlus(heute, d); if (isGiessTag(iso, c)) erster = iso; }
        return JSON.stringify({ lockErster: erster ? isToppingWaterGuss(c, erster) : null, lockHeute: isToppingWaterGuss(c, heute) }); })()`));
      pruefe(b.lockErster === false && b.lockHeute === false, 'P7-3 BioBizz (ohne Eingriffs-Regel): Wasserguss um das Topping trotzdem fest: ' + JSON.stringify(b));
    } else pruefe(false, 'P7-0 Prüflage: kein Blüte-Gießtag gefunden');
  }

  // P8 (v1.5.434) · Lexikon, Fehlersuche, FAQ und Demo: keine alten Topping-Aussagen ohne Beleg
  {
    const T = JSON.parse(a.E(`(function(){ const out = []; const lauf = (x, p) => { if (typeof x === 'string') out.push([p, x]);
      else if (x && typeof x === 'object') for (const k of Object.keys(x)) lauf(x[k], p + '.' + k); };
      for (const n of ['LEXIKON', 'SYMPTOMS', 'FAQ']) { try { lauf(eval(n), n); } catch (e) {} } return JSON.stringify(out); })()`));
    const alt = [/Nicht bei Automatics/, /HST nicht bei Automatics/, /Voller Turgordruck \(2-4 h/, /2-4 Stunden vorher voll gießen/, /Zweites Topping/,
      /Stress — Geduld/, /Gießen vor Topping/, /3-6 neue Haupttriebe/, /mehr Gesamtertrag/, /fehlende Photosynthese für Wundheilung/, /Kallus.{0,40}dickere Colas/];
    const treffer = T.filter(([, s]) => alt.some(re => re.test(s)));
    pruefe(treffer.length === 0, `P8-1 ${treffer.length} Texte mit alten Topping-Aussagen: ` + treffer.slice(0, 4).map(([p, s]) => p + ' „' + (s.match(new RegExp(alt.map(r => r.source).join('|'))) || [''])[0] + '“').join(' | '));
    pruefe(!/Turgordruck muss stimmen für sauberen Schnitt|Pflanze war gut hydriert/.test(HTML), 'P8-2 Demo-Notizen mit „Turgordruck muss stimmen“ / „gut hydriert“');
  }

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_topping: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_topping: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_topping abgebrochen:', (e && e.stack) || e); process.exit(1); });
