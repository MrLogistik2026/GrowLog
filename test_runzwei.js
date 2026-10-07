// Befunde aus der Run-02-Prüfung vom 07.10.2026 (UEBERGABE, „Prüfrunde 07.10.2026 vormittags").
//
//   F04 (v1.5.369)  Ein EC im Korridor der Plan-Woche löst keinen Hinweis aus; darunter heißt der Hinweis „unter dem Ziel" mit
//                   der Spanne, ohne „Dosis erhöhen".
//   F01 (v1.5.370)  Toppen bei Automatics nur vor dem Blühbeginn.
//   F03 (v1.5.371)  Der Meilenstein zum Blühbeginn rät nicht zum Stickstoff-Stopp.
//   F06 (v1.5.372)  Vor dem ersten Durchgießen nennt die Gießanleitung keine Vollsättigung und keinen Drain.
//   N8  (v1.5.373)  Nachtprüfung Punkt 8: im Sämlingstopf weder „SOFORT spülen" noch „nachgießen, bis unten etwas kommt".
//   N3  (v1.5.374)  Nachtprüfung Punkt 3: EC deutlich über dem Ziel der Plan-Woche wird gewarnt.
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
  w.customConfirm = () => Promise.resolve(true);
  return { w, errors, E: (s) => w.eval(s) };
}

(async () => {
  const fehler = [];
  let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const a = await starte();
  // Ein Rainbow-Zyklus wie Run 02: Automatic, Erde, sechs Pflanzen
  a.E(`S.cycles = []; S.entries = {}; S.fertPlans = []; S._activePlanId = null;
    S._disclaimerAcceptedAt = Date.now(); S._welcomeSeen = true; S._modeAsked = true; S._seedlingProtocolShown = true;
    const pid = _planFuerVorlage('rainbow_auto');
    addCyc({ name: 'Prüfzyklus', startDate: isoPlus(todayISO(), -50), seedType: 'auto', growType: 'indoor', medium: 'erde',
      potSize: 11, plantCount: 6, startMethod: 'direct', fertPlanId: pid }, { still: true });
    saveS();`);

  // F04 · Ein Blütetag, an dem das Ziel der Plan-Woche unter 0,8 beginnt
  const tag = JSON.parse(a.E(`(function(){ const c = S.cycles[0];
    for (let i = 0; i < 160; i++) { const iso = isoPlus(c.startDate, i); const p = phase(iso, c);
      if (!p || p.ph !== 'bloom') continue; if (getFeedWaterEffective(c, p, iso, null) === 'water') continue;
      const z = getEcTarget(c, p, iso); if (z && z.min < 0.8 && z.max > z.min) return JSON.stringify({ iso, min: z.min, max: z.max }); }
    return 'null'; })()`));
  pruefe(!!tag, 'F04-0 kein Blütetag mit EC-Ziel unter 0,8 gefunden (Prüflage greift nicht)');
  if (tag) {
    const warnungen = (ec, einsteiger) => JSON.parse(a.E(`(function(){ S.beginnerMode = ${einsteiger}; const c = S.cycles[0]; const iso = '${tag.iso}';
      const cd = { ec: '${ec}', water: '', ph: '' }; return JSON.stringify(getEntryWarnings(cd, phase(iso, c), {}, c, iso).map(w => w.text)); })()`));
    const imKorridor = Math.round(((tag.min + tag.max) / 2) * 100) / 100;
    for (const einsteiger of [false, true]) {
      const wo = einsteiger ? 'Einsteiger' : 'Profi';
      const w1 = warnungen(imKorridor, einsteiger);
      pruefe(!w1.some(t => /EC|Dünger-Wert/.test(t)), `F04-1 ${wo}: EC ${imKorridor} im Korridor ${tag.min}–${tag.max} löst einen Hinweis aus: ${w1.join(' | ')}`);
      const unter = Math.round((tag.min - 0.2) * 100) / 100;
      const w2 = warnungen(unter, einsteiger);
      pruefe(w2.some(t => /unter dem Ziel/.test(t)), `F04-2 ${wo}: EC ${unter} unter dem Korridor ohne „unter dem Ziel": ${w2.join(' | ')}`);
      pruefe(!w2.some(t => /erhöhen|mehr düngen/.test(t)), `F04-3 ${wo}: der Hinweis fordert mehr Dünger: ${w2.join(' | ')}`);
    }
  }

  // F01 · Toppen bei Automatics nur vor dem Blühbeginn; bei photoperiodischen Sorten unverändert
  {
    const r = JSON.parse(a.E(`(function(){ const c = S.cycles[0]; let bl = null, ve = null;
      for (let i = 0; i < 160; i++) { const iso = isoPlus(c.startDate, i); const p = phase(iso, c); if (!p) continue;
        if (!bl && p.ph === 'bloom' && p.week === 1) bl = iso; if (!ve && isVegiPhase(p.ph) && p.day >= 16) ve = iso; }
      const ctx = (iso) => { const k = contextFor(c, iso); return { canTop: !!k.canTop, spaet: !!k.toppingTooLate }; };
      const out = { bl, ve, ctxBl: bl && ctx(bl), ctxVe: ve && ctx(ve), fitBl: bl && (_trainingFit(c, bl, 'topping') || {}).passt,
        fitFimBl: bl && (_trainingFit(c, bl, 'fim') || {}).passt, fitLstBl: bl && (_trainingFit(c, bl, 'lst') || {}).passt };
      // Dieselbe Pflanze als photoperiodische Sorte: dort bleibt das Fenster bis Blütewoche 3
      const fem = Object.assign({}, c, { seedType: 'fem' });
      out.femFit = bl && (_trainingFit(fem, bl, 'topping') || {}).passt;
      // Der Eintrag am ersten Blütetag: kein Knopf „Jetzt Toppen"
      setDebugDate(bl); openEntry(bl); renderEntry(bl);
      out.knopf = /Jetzt Toppen/.test(document.getElementById('entry-body').textContent);
      out.textNeu = /gehört ein Schnitt vor den Blühbeginn/.test(T.topping.tooLateAuto({ week: 1 }));
      setDebugDate('');
      return JSON.stringify(out); })()`));
    pruefe(r.bl && r.ve, 'F01-0 Prüflage: kein Blüte- oder Wachstumstag gefunden');
    if (r.bl && r.ve) {
      pruefe(r.ctxVe.canTop, 'F01-1 Automatic in der Wachstumsphase (ab Tag 15): Toppen nicht angeboten');
      pruefe(!r.ctxBl.canTop && r.ctxBl.spaet, `F01-2 Automatic in Blütewoche 1: Toppen noch angeboten (${JSON.stringify(r.ctxBl)})`);
      pruefe(r.fitBl === 'vorbei' && r.fitFimBl === 'vorbei', `F01-3 Trainings-Auswahl in Blütewoche 1 bei Automatics: Topping ${r.fitBl}, FIM ${r.fitFimBl} statt „vorbei"`);
      pruefe(r.fitLstBl === 'jetzt', `F01-4 LST in Blütewoche 1 nicht mehr angeboten (${r.fitLstBl})`);
      pruefe(r.femFit === 'spaet', `F01-5 photoperiodische Sorte in Blütewoche 1 verändert (${r.femFit} statt „spaet")`);
      pruefe(!r.knopf, 'F01-6 der Eintrag am ersten Blütetag zeigt „Jetzt Toppen"');
      pruefe(r.textNeu, 'F01-7 der Hinweis nennt noch die alte Grenze „erste 3 Blüte-Wochen"');
    }
  }

  // F03 · Der Meilenstein zum Blühbeginn rät nicht zum Stickstoff-Stopp
  {
    const t = a.E(`(function(){ const c = S.cycles[0]; for (let i = 0; i < 160; i++) { const iso = isoPlus(c.startDate, i); const p = phase(iso, c);
      if (p && p.ph === 'bloom' && p.week === 1) { setDebugDate(iso); const m = (getAlerts(c) || []).find(x => x.key === 'bloom_start'); setDebugDate(''); return m ? m.text : 'kein Meilenstein'; } }
      return 'kein Blütetag'; })()`);
    pruefe(/weiter nach Plan düngen/.test(t) && !/kein Stickstoff mehr/.test(t), `F03 Meilenstein Blühbeginn: „${t}"`);
  }

  // F06 · Vor dem ersten Durchgießen nennt die Gießanleitung keine Vollsättigung und keinen Drain
  {
    const r = JSON.parse(a.E(`(function(){ S.beginnerMode = false; const c = S.cycles[0]; const out = {};
      const text = (n) => { const iso = isoPlus(c.startDate, n - 1); setDebugDate(iso); openEntry(iso); renderEntry(iso);
        const t = document.getElementById('entry-body').textContent; setDebugDate(''); return t; };
      const gießtag = (von, bis) => { for (let n = von; n <= bis; n++) { const iso = isoPlus(c.startDate, n - 1); const p = phase(iso, c);
        if (isGiessTag(iso, c) && p && getFeedWaterEffective(c, p, iso, null) !== 'water') return n; } return null; };
      const nF = gießtag(9, DRAIN_AB_TAG - 1), nS = gießtag(DRAIN_AB_TAG, DRAIN_AB_TAG + 20);
      const frueh = nF ? text(nF) : '', spaet = nS ? text(nS) : '';
      return JSON.stringify({ ab: DRAIN_AB_TAG, nF, nS,
        fruehVoll: /Vollsättigung/.test(frueh), fruehDrain: /Drain bei jedem Guss|Drain: \\d/.test(frueh), fruehHinweis: /Noch nicht durchgießen/.test(frueh),
        fruehMisch: /Mischen:/.test(frueh), spaetVoll: /Vollsättigung/.test(spaet), spaetDrain: /Drain bei jedem Guss/.test(spaet) }); })()`));
    pruefe(!r.fruehVoll && !r.fruehDrain, `F06-1 Tag ${r.nF} (vor Tag ${r.ab}): Gießanleitung nennt Vollsättigung oder Drain (${JSON.stringify(r)})`);
    pruefe(r.fruehHinweis && r.fruehMisch, `F06-2 Tag ${r.nF}: „Noch nicht durchgießen" oder die Mischen-Zeile fehlt (${JSON.stringify(r)})`);
    pruefe(r.spaetVoll && r.spaetDrain, `F06-3 ab Tag ${r.ab}: Vollsättigung und Drain fehlen (${JSON.stringify(r)})`);
  }

  // N8 (v1.5.373) · Im Sämlingstopf weder „SOFORT spülen" noch „nachgießen, bis unten etwas kommt"
  {
    const r = JSON.parse(a.E(`(function(){ const c = S.cycles[0]; const iso = (n) => isoPlus(c.startDate, n - 1);
      const w = (kat, wert, n) => (getCriticalWarning(kat, wert, phase(iso(n), c), c, 24) || {}).action || '';
      return JSON.stringify({ ec10: w('ec', 1.5, 10), ph10: w('ph', 4.0, 10), ph40: w('ph', 4.0, DRAIN_AB_TAG + 15) }); })()`));
    pruefe(!/SOFORT/i.test(r.ec10) && /nicht durchspülen/.test(r.ec10) && /verdünnen/.test(r.ec10) && !/pH 6\.4\)/.test(r.ec10), `N8-1 Sämling, EC 1,5: ${r.ec10}`);
    pruefe(/nicht nachspülen/.test(r.ph10) && !/bis unten/.test(r.ph10), `N8-2 Sämling, pH 4,0: ${r.ph10}`);
    pruefe(/bis unten/.test(r.ph40), `N8-3 nach Tag 25 bleibt das Nachgießen bis zum Drain: ${r.ph40}`);
  }

  // N3 (v1.5.374) · Deutlich über dem Ziel der Plan-Woche wird gewarnt, knapp darüber nicht, und nicht doppelt zum Notfall
  {
    const r = JSON.parse(a.E(`(function(){ S.beginnerMode = false; const c = S.cycles[0]; let hoch = null, jung = null;
      for (let i = 0; i < 160; i++) { const iso = isoPlus(c.startDate, i); const p = phase(iso, c); if (!p) continue;
        if (getFeedWaterEffective(c, p, iso, null) === 'water') continue; const z = getEcTarget(c, p, iso); if (!z) continue;
        if (!hoch && p.ph === 'bloom' && z.max >= 1.2) hoch = { iso, z }; if (!jung && p.ph === 'anzucht' && p.day <= 14 && z.max <= 0.6) jung = { iso, z }; }
      const w = (x, ec) => getEntryWarnings({ ec: String(ec), water: '', ph: '' }, phase(x.iso, c), {}, c, x.iso).map(v => v.type + ': ' + v.text);
      return JSON.stringify({ hoch, jung, h24: hoch && w(hoch, 2.4), hKnapp: hoch && w(hoch, Math.round(hoch.z.max * 1.1 * 100) / 100),
        j: jung && w(jung, Math.round(jung.z.max * 1.6 * 100) / 100), jNot: jung && w(jung, 1.5),
        jNotKrit: jung && !!getCriticalWarning('ec', 1.5, phase(jung.iso, c), c) }); })()`));
    pruefe(r.hoch && r.jung, 'N3-0 Prüflage: kein Blütetag mit Ziel ab 1,2 oder kein Sämlingstag mit Ziel bis 0,6');
    if (r.hoch && r.jung) {
      pruefe(r.h24.some(t => /^warn: .*deutlich über dem Ziel/.test(t)), `N3-1 Blüte, EC 2,4 bei Ziel ${r.hoch.z.min}–${r.hoch.z.max}: ${r.h24.join(' | ') || 'stumm'}`);
      pruefe(!r.hKnapp.some(t => /über dem Ziel/.test(t)), `N3-2 knapp über dem Ziel (10 %) schon eine Warnung: ${r.hKnapp.join(' | ')}`);
      pruefe(r.j.some(t => /deutlich über dem Ziel/.test(t)), `N3-3 Sämling, EC 1,6-fach über dem Ziel ${r.jung.z.min}–${r.jung.z.max}: ${r.j.join(' | ') || 'stumm'}`);
      pruefe(r.jNotKrit && !r.jNot.some(t => /deutlich über dem Ziel/.test(t)), `N3-4 neben dem Sämlings-Notfall (EC 1,5) zusätzlich die Ziel-Warnung: ${r.jNot.join(' | ')}`);
    }
  }

  // M (v1.5.376) · Dünger-Zeile der Startseite: Einheit des Produkts, feste Mengen nie auf 1 L, 1 L nur, wo nicht abmessbar
  {
    const r = JSON.parse(a.E(`(function(){ const c = S.cycles[0]; const plan = getPlanForCycle(c);
      plan.products.push({ id: 'tr1', name: 'TropfenTest', unit: 'Tr/L' }, { id: 'abs1', name: 'FestTest', unit: 'ml' }, { id: 'ml1', name: 'LiterTest', unit: 'ml/L' });
      const m = (paare, ml) => _mischungKurz(c, paare, ml);
      const rf = reserveFactor(c);
      const out = { tr: m([['tr1', 5]], 2100), fest: m([['abs1', 5]], 200 / rf), messbar: m([['ml1', 4]], 450 / rf),
        klein: m([['ml1', 0.3]], 200 / rf), gemischt: m([['ml1', 0.3], ['abs1', 5]], 200 / rf) };
      plan.products = plan.products.filter(p => !['tr1', 'abs1', 'ml1'].includes(p.id));
      return JSON.stringify(out); })()`));
    pruefe(/TropfenTest [\d,]+ Tr\b/.test(r.tr.text) && !/TropfenTest [\d,]+ ml/.test(r.tr.text), `M1 Tropfen heißen „ml": ${r.tr.text}`);
    pruefe(!r.fest.jeLiter && /FestTest 5 ml/.test(r.fest.text), `M2 feste Menge je Guss umgerechnet: ${r.fest.fuer}: ${r.fest.text}`);
    pruefe(!r.messbar.jeLiter && /^für 0,5 L$/.test(r.messbar.fuer) && /LiterTest 1,8 ml/.test(r.messbar.text), `M3 abmessbare Menge unter 1 L trotzdem auf 1 L: ${r.messbar.fuer}: ${r.messbar.text}`);
    pruefe(r.klein.jeLiter && /den Rest nicht aufheben/.test(r.klein.fuer) && /LiterTest 0,3 ml/.test(r.klein.text), `M4 nicht abmessbare Menge: ${r.klein.fuer}: ${r.klein.text}`);
    pruefe(!r.gemischt.jeLiter && !/ 0 ml/.test(r.gemischt.text), `M5 mit fester Menge daneben: kein 1 L und keine Null: ${r.gemischt.fuer}: ${r.gemischt.text}`);
  }

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_runzwei: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_runzwei: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_runzwei abgebrochen:', (e && e.stack) || e); process.exit(1); });
