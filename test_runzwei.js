// Befunde aus der Run-02-Prüfung vom 07.10.2026 (UEBERGABE, „Prüfrunde 07.10.2026 vormittags").
//
//   F04 (v1.5.369)  Ein EC im Korridor der Plan-Woche löst keinen Hinweis aus; darunter heißt der Hinweis „unter dem Ziel" mit
//                   der Spanne, ohne „Dosis erhöhen".
//   F01 (v1.5.370)  Toppen bei Automatics nur vor dem Blühbeginn.
//   F03 (v1.5.371)  Der Meilenstein zum Blühbeginn rät nicht zum Stickstoff-Stopp.
//   F06 (v1.5.372)  Vor dem ersten Durchgießen nennt die Gießanleitung keine Vollsättigung und keinen Drain.
//   N8  (v1.5.373)  Nachtprüfung Punkt 8: im Sämlingstopf weder „SOFORT spülen" noch „nachgießen, bis unten etwas kommt".
//   N3  (v1.5.374)  Nachtprüfung Punkt 3: EC deutlich über dem Ziel der Plan-Woche wird gewarnt.
//   M   (v1.5.376)  Dünger-Zeile der Startseite: Einheit des Produkts, feste Mengen nie auf 1 L.
//   Z   (v1.5.378)  Ein Zyklus ohne Phase bekommt im Eintrag „✓ Fertig" statt Gieß-, pH- und Trainingsfeldern.
//   W   (v1.5.382)  „Düngen ⇄ Wasser" bei Plänen ohne Rhythmus legt Kalender und Fahrplan nicht lahm.
//   F09 (v1.5.383)  Der Name der Plan-Woche auf der Startseite kommt aus dem Plan.
//   F07 (v1.5.384)  Das Plan-Blatt markiert die Woche jeder Gruppe, die den Plan nutzt.
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
      out.textNeu = /gehört ein Schnitt vor den Blühbeginn/.test(T.topping.tooLateAuto({ week: 1 })) && !/bis Blüte Wo.3/.test(T.topping.tooLateAuto({ week: 1 }));
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
      pruefe(r.textNeu, 'F01-7 der Hinweis nennt noch die alte Grenze „erste 3 Blüte-Wochen" oder „bis Blüte Wo.3" (v1.5.378)');
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
        fruehVoll: /Vollsättigung/.test(frueh), fruehDrain: /Drain bei jedem Guss|Drain: \\d|Drain entsorgen/.test(frueh), fruehHinweis: /Noch nicht durchgießen/.test(frueh),
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

  // Z (v1.5.378) · Ein Zyklus ohne Phase (alle Phasen vorbei) bekommt im Eintrag keine Felder, sondern „✓ Fertig" mit „Abschließen"
  {
    const r = JSON.parse(a.E(`(function(){ S.beginnerMode = false;
      const alt = addCyc({ name: 'Alter Zyklus', startDate: isoPlus(todayISO(), -220), seedType: 'auto', growType: 'indoor', medium: 'erde',
        potSize: 11, plantCount: 2, startMethod: 'direct', fertPlanId: S.cycles[0].fertPlanId }, { still: true }); saveS();
      const iso = todayISO(); setDebugDate(iso); openEntry(iso); renderEntry(iso);
      const body = document.getElementById('entry-body');
      const karte = [...body.children].find(x => x.textContent.includes('Alter Zyklus'));
      const out = { phase: phase(iso, alt), karte: karte ? karte.textContent.replace(/\\s+/g, ' ').trim().slice(0, 200) : null,
        felder: !!body.querySelector('[oninput*="' + alt.id + '\\',\\'water"],[oninput*="' + alt.id + '\\',\\'ph"]'),
        training: karte ? /Training hinzufügen/.test(karte.textContent) : null, planWo: karte ? /Plan Wo\\./.test(karte.textContent) : null,
        knopf: karte ? !!karte.querySelector('[onclick*="archiveCycle"]') : false, notiz: !!document.getElementById('note-' + alt.id),
        laufend: [...body.children].some(x => x.textContent.includes('Prüfzyklus') && !/alle Phasen vorbei/.test(x.textContent)) };
      S.cycles = S.cycles.filter(c => c.id !== alt.id); saveS(); setDebugDate('');
      return JSON.stringify(out); })()`));
    pruefe(r.phase === null && r.karte && /alle Phasen vorbei/.test(r.karte) && r.knopf, `Z1 fertiger Zyklus ohne Karte „✓ Fertig" mit Abschließen: ${r.karte}`);
    pruefe(!r.felder && !r.training && !r.planWo, `Z2 fertiger Zyklus mit Gieß-/pH-Feldern, Training oder „Plan Wo.": ${JSON.stringify(r)}`);
    pruefe(r.notiz && r.laufend, `Z3 Notizfeld des fertigen Zyklus fehlt oder der laufende Zyklus ist betroffen: ${JSON.stringify(r)}`);
  }

  // W (v1.5.382) · Einen Guss „Düngen ⇄ Wasser" umschalten legt bei Plänen ohne Rhythmus nichts lahm
  {
    const r = JSON.parse(a.E(`(function(){ const vorher = S.cycles.slice(); S.beginnerMode = false;
      const pid = _planFuerVorlage('canna_coco');
      const c = addCyc({ name: 'Coco-Gruppe', startDate: isoPlus(todayISO(), -40), seedType: 'auto', growType: 'indoor', medium: 'coco',
        potSize: 11, plantCount: 2, startMethod: 'direct', fertPlanId: pid }, { still: true }); saveS();
      const tage = []; for (let i = 0; i < 160 && tage.length < 3; i++) { const iso = isoPlus(c.startDate, i); const p = phase(iso, c);
        if (p && p.ph === 'bloom' && getAction(iso, c) === 'giess') tage.push(iso); }
      const out = { tage: tage.length, fehler: [] };
      try { _gussplanZyklusId = c.id; openGussplan(); toggleFwDay(tage[0]); } catch (e) { out.fehler.push('toggle: ' + e.message); }
      out.override = !!(c.fwOverrides && Object.keys(c.fwOverrides).length);
      for (const iso of tage.slice(1)) { try { getFeedWaterType(c, phase(iso, c), iso); } catch (e) { out.fehler.push('typ: ' + e.message); } }
      try { goTo('cal'); renderCal(); } catch (e) { out.fehler.push('Kalender: ' + e.message); }
      try { openGussplan(); } catch (e) { out.fehler.push('Fahrplan: ' + e.message); }
      out.fahrplan = (document.getElementById('scr-gussplan') || {}).textContent ? document.getElementById('scr-gussplan').textContent.length : 0;
      S.cycles = vorher; saveS();
      return JSON.stringify(out); })()`));
    pruefe(r.tage >= 3 && r.override, `W0 Prüflage: ${JSON.stringify(r)}`);
    pruefe(!r.fehler.length && r.fahrplan > 200, `W1 nach dem Umschalten: ${r.fehler.join(' | ') || 'Fahrplan leer'}`);
  }

  // F09 (v1.5.383) · Der Name der Plan-Woche auf der Startseite kommt aus dem Plan
  {
    const r = JSON.parse(a.E(`(function(){ S.beginnerMode = false; const c = S.cycles[0]; const iso = todayISO(); const p = phase(iso, c);
      const wk = fertPlanWeek(c, iso, p); const soll = String((FERT_PRESETS.rainbow_auto.weekFocus[wk] || {}).phase || '').split(' · ')[0];
      goTo('dash'); renderDash(); const t = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
      const m = t.match(new RegExp('Wo' + wk + ' ([^·]{0,40})'));
      return JSON.stringify({ wk, soll, ist: m ? m[1].trim() : null }); })()`));
    pruefe(r.soll && r.ist && r.ist.startsWith(r.soll), `F09 Startseite nennt Plan-Woche ${r.wk} „${r.ist}" statt „${r.soll}"`);
  }

  // F07 (v1.5.384) · Das Plan-Blatt markiert die Woche jeder Gruppe, die den Plan nutzt
  {
    const r = JSON.parse(a.E(`(function(){ const vorher = S.cycles.slice(); S.beginnerMode = false;
      const pid = S.cycles[0].fertPlanId;
      const b = addCyc({ name: 'Gruppe B', startDate: isoPlus(todayISO(), -20), seedType: 'auto', growType: 'indoor', medium: 'erde',
        potSize: 11, plantCount: 3, startMethod: 'direct', fertPlanId: pid }, { still: true }); saveS();
      const wA = fertPlanWeek(S.cycles[0], todayISO()), wB = fertPlanWeek(b, todayISO());
      if (typeof switchFertPlan === 'function') switchFertPlan(pid); S._planAlleWochen = true; openDuenger(); renderDuenger();
      const t = document.getElementById('scr-duenger').textContent.replace(/\\s+/g, ' ');
      const out = { wA, wB, punkte: (t.match(/Wo \\d+ ●/g) || []), namen: /Prüfzyklus/.test(t) && /Gruppe B/.test(t), tipps: (t.match(/💡 Woche \\d+ \\(/g) || []).length };
      S.cycles = vorher; saveS(); return JSON.stringify(out); })()`));
    pruefe(r.wA !== r.wB && r.punkte.includes('Wo ' + r.wA + ' ●') && r.punkte.includes('Wo ' + r.wB + ' ●'), `F07-1 Plan-Blatt markiert nicht beide Wochen (${r.wA}, ${r.wB}): ${r.punkte.join(', ')}`);
    pruefe(r.namen && r.tipps === 2, `F07-2 Namen der Gruppen oder ein Tipp je Woche fehlen: ${JSON.stringify(r)}`);
  }

  // F02 (v1.5.387) · Der erste Guss nach einem eingetragenen FIM ist im Rainbow-Plan von selbst „Nur Wasser"
  {
    const r = JSON.parse(a.E(`(function(){ const vorher = S.cycles.slice(); S.beginnerMode = false;
      const lauf = (vorlage) => {
        const c = addCyc({ name: 'FIM-Probe', startDate: isoPlus(todayISO(), -10), seedType: 'auto', growType: 'indoor', medium: 'erde',
          potSize: 11, plantCount: 3, startMethod: 'direct', fertPlanId: _planFuerVorlage(vorlage) }, { still: true });
        let fim = null;
        for (let i = 0; i < 60 && !fim; i++) { const iso = isoPlus(c.startDate, i); const p = phase(iso, c);
          if (p && fertPlanWeek(c, iso, p) === 3 && getAction(iso, c) !== 'giess' && getAction(iso, c) !== 'giess_anz') fim = iso; }
        const guesse = []; for (let t = 1; t <= 20 && guesse.length < 2 && fim; t++) { const iso = isoPlus(fim, t);
          const aa = getAction(iso, c); if (aa === 'giess' || aa === 'giess_anz') guesse.push(iso); }
        const typ = (iso) => getFeedWaterEffective(c, phase(iso, c), iso, null);
        const ohne = guesse.map(typ);
        c.trainingEvents = [{ date: fim, type: 'fim', notes: '' }];
        const mit = guesse.map(typ);
        const out = { fim, guesse, ohne, mit, fest: guesse.length ? isToppingWaterGuss(c, guesse[0]) : null,
          eigeneWahl: guesse.length ? getFeedWaterEffective(c, phase(guesse[0], c), guesse[0], { waterOnly: false }) : null };
        if (vorlage === 'rainbow_auto' && guesse.length) { setDebugDate(guesse[0]); openEntry(guesse[0]);
          out.eintrag = /erster Guss nach dem FIM/.test(document.getElementById('scr-entry').textContent); setDebugDate(null); }
        S.cycles = S.cycles.filter(x => x.id !== c.id);
        return out;
      };
      const rb = lauf('rainbow_auto'), bb = lauf('biobizz_light');
      S.cycles = vorher; saveS();
      return JSON.stringify({ rb, bb }); })()`));
    const { rb, bb } = r;
    pruefe(rb.fim && rb.guesse.length === 2, `F02-0 Prüflage Rainbow: ${JSON.stringify(rb)}`);
    pruefe(rb.ohne[0] === 'feed', `F02-1 ohne FIM ist der erste Guss in Plan-Woche 3 kein Feed: ${rb.ohne.join(', ')}`);
    pruefe(rb.mit[0] === 'water', `F02-2 erster Guss nach dem FIM (${rb.guesse[0]}) ist nicht „Nur Wasser": ${rb.mit.join(', ')}`);
    pruefe(rb.mit[1] === 'feed', `F02-3 der Guss danach ist kein Feed: ${rb.mit.join(', ')}`);
    pruefe(rb.fest === true, 'F02-4 der FIM-Wasserguss ist im Gieß-Fahrplan nicht fest');
    pruefe(rb.eigeneWahl === 'feed', `F02-5 die eigene Wahl im Tageseintrag gewinnt nicht: ${rb.eigeneWahl}`);
    pruefe(rb.eintrag === true, 'F02-6 der Tageseintrag nennt den Grund („erster Guss nach dem FIM") nicht');
    pruefe(bb.fim && JSON.stringify(bb.ohne) === JSON.stringify(bb.mit) && bb.fest === false,
      `F02-7 ein Plan ohne FIM-Wasserguss ändert sich durch das FIM: ${JSON.stringify(bb)}`);
  }

  // F10 (v1.5.388) · Zwei Gruppen im Zelt: dieselbe Luft auch gegen den Sämling und den strengeren Deckel der anderen Gruppe
  {
    const r = JSON.parse(a.E(`(function(){ const vorher = S.cycles.slice(); S.beginnerMode = false; const heute = todayISO();
      const pid = S.cycles[0].fertPlanId;
      const neu = (name, tage, bloom) => { const c = addCyc({ name, startDate: isoPlus(heute, -tage), seedType: 'auto', growType: 'indoor', medium: 'erde',
        potSize: 11, plantCount: 3, startMethod: 'direct', fertPlanId: pid }, { still: true }); if (bloom) c.bloomDays = bloom; return c; };
      const stufe = (c) => { const st = klimaStatus(24, 50, phase(heute, c), c); return st ? st.stufe : null; };
      const box = (t, rh) => _klimaEntryTeile(String(t), String(rh), active(), heute).vpdBox.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ');
      const out = {};
      // 1 · Blüte + Sämling
      S.cycles = [vorher[0]]; const sa = neu('Gruppe Sämling', 3);
      out.stufen = [stufe(vorher[0]), stufe(sa)];
      out.b50 = box(24, 50); out.b35 = box(24, 35); out.b63 = box(24, 63);
      S.cycles = [vorher[0]]; out.allein = box(24, 35);
      S.cycles = [vorher[0]]; neu('Gruppe Sämling', 3);
      S.entries[heute] = { temp: '24', humidity: '35', cycleData: {} }; goTo('tips'); renderTips();
      out.tipps = (_tipsSnapshot || []).some(x => /trocknet der Sämling aus/.test(x.text));   /* die Tipps-Liste wird nur durchsucht, nicht angezeigt */ out.tippsSnap = (_tipsSnapshot || []).filter(x => x.cat === 'Umgebung').map(x => x.text.slice(0, 60));
      // 2 · Führende Gruppe in der mittleren, andere schon in der späten Blüte (kürzere Blüte)
      S.cycles = []; const fa = neu('Lange Blüte', 66, 90); const fb = neu('Kurze Blüte', 62, 42);
      out.stufen2 = [stufe(fa), stufe(fb)]; out.fuehrt2 = (_fuehrenderZyklus(active(), heute) || {}).name;
      out.d62 = box(24, 62);
      delete S.entries[heute]; S.cycles = vorher; saveS();
      return JSON.stringify(out); })()`));
    pruefe(r.stufen[0] && r.stufen[0] !== 'saemling' && r.stufen[1] === 'saemling', `F10-0 Prüflage Blüte + Sämling: ${JSON.stringify(r.stufen)}`);
    pruefe(/💡 „Gruppe Sämling“ \(🌱 Sämling\): Für den Sämling ist die Luft trockener/.test(r.b50) && /Haube/.test(r.b50), `F10-1 bei 50 % kein Sämlings-Hinweis: ${r.b50}`);
    pruefe(/⚠ „Gruppe Sämling“ \(🌱 Sämling\): Unter 40 % Luftfeuchte trocknet der Sämling aus/.test(r.b35), `F10-2 bei 35 % keine Sämlings-Warnung: ${r.b35}`);
    pruefe(!/Gruppe Sämling“ \(/.test(r.b63), `F10-3 bei 63 % (Sämling im Ziel) trotzdem eine Zeile: ${r.b63}`);
    pruefe(!/Sämling/.test(r.allein), `F10-4 ohne zweite Gruppe eine Sämlings-Zeile: ${r.allein}`);
    pruefe(r.tipps === true, 'F10-5 die Suche (Tipps) kennt die Sämlings-Warnung nicht: ' + JSON.stringify(r.tippsSnap));
    if (r.stufen2[0] !== r.stufen2[1] && r.fuehrt2 === 'Lange Blüte' && /spaet/.test(r.stufen2[1]) && !/spaet/.test(r.stufen2[0])) {
      pruefe(/„Kurze Blüte“ \(🍯 Späte Blüte\): über 60 % Luftfeuchte/.test(r.d62), `F10-6 strengerer Deckel der anderen Gruppe fehlt: ${r.d62}`);
    } else pruefe(false, `F10-6 Prüflage Deckel: ${JSON.stringify({ s: r.stufen2, f: r.fuehrt2 })}`);
  }

  // F11 (v1.5.389) · Drain nur in Aussicht stellen, wenn er bei dieser Menge entstehen kann (ANBAU.md 1.1)
  {
    const r = JSON.parse(a.E(`(function(){ const vorher = S.cycles.slice(); const eVorher = JSON.stringify(S.entries); S.beginnerMode = false;
      const c = addCyc({ name: 'Topf 15', startDate: isoPlus(todayISO(), -40), seedType: 'auto', growType: 'indoor', medium: 'erde',
        potSize: 15, plantCount: 3, startMethod: 'direct', fertPlanId: S.cycles[0].fertPlanId }, { still: true });
      S.cycles = [c];
      let tag = null; for (let i = 0; i < 40 && !tag; i++) { const iso = isoPlus(todayISO(), i); const p = phase(iso, c);
        if (p && p.day >= 26 && getAction(iso, c) === 'giess') tag = iso; }
      const lies = () => { const p = phase(tag, c); const g = gussMengeJePflanze(c, p, tag); setDebugDate(tag); openEntry(tag);
        const t = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
        const satz = plainSentence('giess', c, p, g ? g.m * 3 : 0).replace(/<[^>]+>/g, '');
        return { m: g && g.m, V: g && g.V, quelle: g && g.quelle, lern: _gussLernSatz(c, tag, g),
          guideDrain: /→ [\\d–]+ ml Drain/.test(t), guideKein: /Drain erst, wenn der Topf voll ist/.test(t), satz }; };
      const out = { tag };
      if (tag) {
        out.leer = lies();
        // Ein früherer eigener Guss mit Drain: der Topf war schon einmal voll
        const vor = isoPlus(tag, -3); S.entries[vor] = { temp: '', humidity: '', cycleData: { [c.id]: { water: '3000', drainMl: '400', doses: {}, photos: [] } } };
        out.mitDrain = lies();
        delete S.entries[vor];
        // Hebe-Test von heute: Menge aus dem heutigen Topf
        S.entries[tag] = { temp: '', humidity: '', cycleData: { [c.id]: { restPct: 30, doses: {}, photos: [] } } };
        out.hebe = lies();
      }
      setDebugDate(null); S.entries = JSON.parse(eVorher); S.cycles = vorher; saveS();
      return JSON.stringify(out); })()`));
    pruefe(r.tag && r.leer && r.leer.m > 0 && r.leer.m < r.leer.V, `F11-0 Prüflage: ${JSON.stringify(r.leer)}`);
    if (r.leer) {
      pruefe(!/Hör auf, sobald unten/.test(r.leer.lern) && /kommt bei dieser Menge unten noch nichts an/.test(r.leer.lern), `F11-1 Lern-Status verspricht Drain: ${r.leer.lern}`);
      pruefe(!r.leer.guideDrain && r.leer.guideKein, `F11-2 Gieß-Guide verspricht Drain bei ${r.leer.m} ml (Topf fasst ~${r.leer.V} ml)`);
      pruefe(!/bis unten etwas herausläuft/.test(r.leer.satz) && /unten noch nichts an/.test(r.leer.satz), `F11-3 Startseite: ${r.leer.satz}`);
      pruefe(/Hör auf, sobald unten/.test(r.mitDrain.lern) && r.mitDrain.guideDrain, `F11-4 nach einem Guss mit Drain fehlt die Drain-Menge: ${r.mitDrain.lern}`);
      pruefe(r.hebe.quelle === 'hebetest' && /Hör auf, sobald unten/.test(r.hebe.lern) && /bis unten etwas herausläuft/.test(r.hebe.satz), `F11-5 Menge aus dem Hebe-Test ohne Drain-Menge: ${JSON.stringify(r.hebe)}`);
    }
  }

  // F15 (v1.5.391) · Gießwasser-Temperatur aus einer Quelle (ANBAU.md 7.3) statt „lauwarm"
  {
    const r = JSON.parse(a.E(`(function(){ const c = S.cycles[0]; const p = phase(todayISO(), c);
      const satz = plainSentence('giess', c, p, 1500).replace(/<[^>]+>/g, '');
      const lex = LEXIKON.flatMap(k => k.items || []).find(x => x.t === 'Wassertemperatur') || {};
      return JSON.stringify({ satz, brief: lex.brief || '', practice: lex.practice || '', ziel: typeof GIESSWASSER === 'object' ? GIESSWASSER.tMin + '–' + GIESSWASSER.tMax + ' °C' : null }); })()`));
    pruefe(r.ziel === '20–22 °C', `F15-0 GIESSWASSER fehlt oder weicht von ANBAU.md 7.3 ab: ${r.ziel}`);
    pruefe(/Wasser mit 20–22 °C/.test(r.satz) && !/lauwarm/.test(r.satz), `F15-1 Startseite: ${r.satz}`);
    pruefe(/20–22 °C/.test(r.brief) && !/18-22|18–22/.test(r.brief) && !/lauwarm/.test(r.practice), `F15-2 Lexikon „Wassertemperatur": ${r.brief}`);
    const zeilen = HTML.split(/\r?\n/).filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z) && /lauwarm/.test(z));
    pruefe(zeilen.length === 0, `F15-3 „lauwarm" steht noch ${zeilen.length}× im ausgelieferten Text`);
  }

  // (v1.5.392) · Lexikon „Wassertemperatur": Wasser am Vortag bereitstellen, Dünger erst kurz vor dem Gießen (ANBAU.md 10)
  {
    const p = a.E(`(LEXIKON.flatMap(k => k.items || []).find(x => x.t === 'Wassertemperatur') || {}).practice || ''`);
    pruefe(!/am Vortag anmischen/.test(p) && /Dünger erst kurz vor dem Gießen/.test(p), `W392 Lexikon rät, Gießwasser auf Vorrat zu mischen: ${p.slice(0, 160)}`);
  }

  // F17 (v1.5.401) · Luftfeuchte-Spanne im Eintrag in ganzen Prozent, wie der Satz daneben (ANBAU.md 2.2)
  {
    const r = JSON.parse(a.E(`(function(){ S.beginnerMode = false; const c = S.cycles[0]; const iso = todayISO();
      const k = _klimaEntryTeile('25', '55', [c], iso); const txt = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      return JSON.stringify({ ziel: txt(k.vpdBox), rlf: txt(k.rlfZeile), spanne: k.st ? _klimaRlfSpanne(k.st.fenster) : null }); })()`));
    pruefe(r.spanne && r.ziel.includes('RLF ' + r.spanne) && !/RLF d+,d/.test(r.ziel), `F17-1 Zielzeile: ${r.ziel.slice(0, 200)}`);
    pruefe(r.spanne && r.rlf.includes(r.spanne + ' RLF') && !/°C d+,d+–/.test(r.rlf), `F17-2 RLF-Zeile: ${r.rlf}`);
  }

  // F13 (v1.5.402) · Vor dem Durchbruch des Keimlings fehlt kein Guss (Keim-Vorlauf, ANBAU.md 16)
  {
    const r = JSON.parse(a.E(`(function(){ const vorher = S.cycles.slice(); const eVorher = JSON.stringify(S.entries); S.beginnerMode = false;
      const heute = todayISO(); const pid = S.cycles[0].fertPlanId;
      const neu = (anz) => { const c = addCyc({ name: 'Vorlauf ' + anz, startDate: isoPlus(heute, -10), seedType: 'auto', growType: 'indoor', medium: 'erde',
        potSize: 11, plantCount: 3, startMethod: 'direct', fertPlanId: pid }, { still: true }); c.anzuchtDays = anz; return c; };
      const messe = (c) => { const tage = []; for (let i = 0; i < 10; i++) { const iso = isoPlus(c.startDate, i); if (isGiessTag(iso, c)) tage.push(i + 1); }
        const inter = intervalDryDefault(c, heute);
        return { vorlauf: _keimVorlauf(c, getPlanForCycle(c)), tage, fehlend: countMissingPastWateringDays(c),
          nachholen: getCatchupCandidates(c).map(x => x.dayNum), ziel: inter && inter.targetGussIso ? isoDiff(inter.targetGussIso, c.startDate) + 1 : null,
          luecke: !!_gussLueckeStatus(c, inter), heuteFaellig: gussFaellig(c, isoPlus(c.startDate, 0)) }; };
      S.cycles = []; const mit = neu(26); S.entries = {};
      // Setzguss an Tag 1 eingetragen
      S.entries[mit.startDate] = { temp: '', humidity: '', cycleData: { [mit.id]: { water: '50', doses: {}, photos: [] } } };
      const a1 = messe(mit);
      S.cycles = []; const ohne = neu(21); S.entries = {}; const a2 = messe(ohne);
      // Heute ist Tag 1 eines Zyklus mit Vorlauf: der Start-Guss bleibt fällig
      S.cycles = []; const frisch = addCyc({ name: 'Frisch', startDate: heute, seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 3,
        startMethod: 'direct', fertPlanId: pid }, { still: true }); frisch.anzuchtDays = 26;
      const a3 = { tag1: isGiessTag(heute, frisch), faellig: gussFaellig(frisch, heute) };
      S.entries = JSON.parse(eVorher); S.cycles = vorher; saveS();
      return JSON.stringify({ a1, a2, a3 }); })()`));
    const { a1, a2, a3 } = r;
    const vor = a1.tage.filter(t => t <= a1.vorlauf), nach = a1.tage.filter(t => t > a1.vorlauf);
    pruefe(a1.vorlauf === 5 && vor.length >= 1 && nach.length >= 1, `F13-0 Prüflage: ${JSON.stringify(a1)}`);
    pruefe(a1.fehlend === nach.length - 0 && !a1.nachholen.some(t => t <= a1.vorlauf), `F13-1 Gießtage vor dem Durchbruch gelten als fehlend: ${JSON.stringify(a1)}`);
    pruefe(a1.ziel === null || a1.ziel > a1.vorlauf, `F13-2 Hebe-Test fragt nach einem Guss vor dem Durchbruch (Tag ${a1.ziel})`);
    pruefe(a2.vorlauf === 0 && a2.fehlend === a2.tage.length, `F13-3 ohne Vorlauf zählt jeder vergangene Gießtag weiter: ${JSON.stringify(a2)}`);
    pruefe(a3.tag1 && a3.faellig, `F13-4 der Start-Guss heute an Tag 1 ist nicht mehr fällig: ${JSON.stringify(a3)}`);
  }

  // F13b (v1.5.403) · „Nachtragen" führt durch alle Gruppen mit Lücken, nicht nur durch die erste
  {
    const r = JSON.parse(a.E(`(function(){ const vorher = S.cycles.slice(); const eVorher = JSON.stringify(S.entries); const heute = todayISO();
      const pid = S.cycles[0].fertPlanId; S.cycles = []; S.entries = {};
      const neu = (name, tage) => addCyc({ name, startDate: isoPlus(heute, -tage), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
        plantCount: 3, startMethod: 'saturated', fertPlanId: pid }, { still: true });
      const ga = neu('Gruppe A', 40), gb = neu('Gruppe B', 30);
      const vor = [getCatchupCandidates(ga).length, getCatchupCandidates(gb).length];
      openCatchupWizard(ga.id); let schritte = 0;
      while (_catchupState && schritte++ < 30) catchupApply('skipped');
      const nach = [getCatchupCandidates(ga).length, getCatchupCandidates(gb).length];
      S.entries = JSON.parse(eVorher); S.cycles = vorher; saveS();
      return JSON.stringify({ vor, nach, schritte }); })()`));
    pruefe(r.vor[0] > 0 && r.vor[1] > 0, `F13b-0 Prüflage: ${JSON.stringify(r)}`);
    pruefe(r.nach[0] === 0 && r.nach[1] === 0, `F13b-1 nach „Nachtragen" bleiben Lücken in der zweiten Gruppe: ${JSON.stringify(r)}`);
  }

  // F08 (v1.5.406) · Der Gieß-Fahrplan listet die Anzucht-Güsse mit, im Einsteiger- wie im Profi-Modus — nur zum Ansehen
  {
    const lauf = (einsteiger, methode, tag) => JSON.parse(a.E(`(function(){ const vorher = S.cycles.slice(); S.beginnerMode = ${einsteiger};
      const c = addCyc({ name: 'Anzucht-Probe', startDate: isoPlus(todayISO(), -${tag - 1}), seedType: 'auto', growType: 'indoor', medium: 'erde',
        potSize: 11, plantCount: 3, startMethod: '${methode}', fertPlanId: S.cycles[0].fertPlanId }, { still: true }); saveS();
      _gussplanZyklusId = c.id; openGussplan(); const body = document.getElementById('gussplan-body');
      const tagVon = (z) => parseInt(z.textContent.match(/Tag (\\d+)/)[1], 10);
      const zeilen = [...body.querySelectorAll('div')].filter(d => /^Tag \\d+$/.test(d.textContent.trim())).map(d => d.parentElement);
      const az = anzuchtLenFor(c); const soll = [];
      for (let d = ${tag}; d <= az; d++) { const x = getAction(isoPlus(c.startDate, d - 1), c); if (x === 'giess_anz' || x === 'saettigung') soll.push(d); }
      const anz = zeilen.filter(z => tagVon(z) <= az), bluete = zeilen.find(z => tagVon(z) > az);
      const t = body.textContent.replace(/\\s+/g, ' ');
      const out = { soll, ist: anz.map(tagVon), schalter: anz.some(z => /toggleFwDay|⇄/.test(z.innerHTML)), ohneMenge: anz.filter(z => !/etwa \\d+ ml/.test(z.textContent)).length,
        blueteSchalter: !!bluete && /toggleFwDay/.test(bluete.innerHTML), altHinweis: /Diese Liste beginnt/.test(t), spruehen: /nur Sprühen, kein Guss/.test(t),
        sorte: anz.map(z => /Sättigung/.test(z.textContent) ? 'S' : /Anzucht/.test(z.textContent) ? 'A' : '?').join(''), override: !!c.fwOverrides };
      S.cycles = vorher; _gussplanZyklusId = null; saveS();
      return JSON.stringify(out); })()`));
    for (const einsteiger of [true, false]) {
      const wo = einsteiger ? 'Einsteiger' : 'Profi';
      const r = lauf(einsteiger, 'direct', 11);   // Tag 11: noch drei Anzucht-Güsse (13, 16, 19)
      pruefe(r.soll.length === 3 && JSON.stringify(r.ist) === JSON.stringify(r.soll), `F08-1 ${wo}: Anzucht-Güsse in der Liste ${JSON.stringify(r.ist)} statt ${JSON.stringify(r.soll)}`);
      pruefe(!r.schalter && !r.override, `F08-2 ${wo}: eine Anzucht-Zeile hat einen Umschalter (toggleFwDay)`);
      pruefe(r.ist.length && r.ohneMenge === 0, `F08-3 ${wo}: Anzucht-Zeile ohne Menge`);
      pruefe(r.blueteSchalter, `F08-4 ${wo}: die Blüte-Güsse haben ihren Umschalter nicht mehr`);
      pruefe(!r.altHinweis, `F08-5 ${wo}: „Diese Liste beginnt mit der Blüte" steht noch da, obwohl die Anzucht jetzt mit drin ist`);
      pruefe(!r.spruehen, `F08-6 ${wo}: Sprüh-Hinweis ohne Sprühtage (startMethod direct)`);
      const s = lauf(einsteiger, 'saturated', 4);  // Tag 4: Sprühtage bis Tag 8, erster Guss Tag 9
      pruefe(s.soll.length >= 4 && JSON.stringify(s.ist) === JSON.stringify(s.soll), `F08-7 ${wo}: Sprühstart: Liste ${JSON.stringify(s.ist)} statt ${JSON.stringify(s.soll)}`);
      pruefe(s.spruehen, `F08-8 ${wo}: Sprühstart ohne Hinweis „nur Sprühen, kein Guss"`);
      const b = lauf(einsteiger, 'direct', 40);   // Tag 40: längst Blüte, keine Anzucht-Zeile mehr
      pruefe(b.ist.length === 0 && b.blueteSchalter, `F08-9 ${wo}: Blüte-Stand zeigt Anzucht-Zeilen (${JSON.stringify(b.ist)}) oder verliert den Umschalter`);
    }
    const s1 = lauf(false, 'saturated', 1);        // Tag 1 mit Sättigungsguss
    pruefe(s1.ist[0] === 1 && s1.sorte[0] === 'S' && s1.sorte.slice(1).replace(/A/g, '') === '', `F08-10 Tag 1 beim Sprühstart: Sättigungsguss nicht als solcher gelistet (${s1.sorte})`);
  }

  // F18 (v1.5.407) · Zwei Gruppen im Kalender: Die Zelle zeigt die wichtigere Aufgabe, und Wort, Symbol, Tag-Nummer und Farbe gehören zu ihr
  {
    const RANG = { ernte: 8, ice: 7, spuelen: 6, saettigung: 5, giess: 4, giess_anz: 4, sprueh: 2, trocknen: 1 };
    const r = JSON.parse(a.E(`(function(){ const vorher = S.cycles.slice(); const eVorher = JSON.stringify(S.entries); S.beginnerMode = false;
      const pid = S.cycles[0].fertPlanId;
      const zelle = (iso) => { const [y, m, d] = iso.split('-').map(Number); calDate = new Date(y, m - 1, 1); renderCal();
        const c = [...document.querySelectorAll('#cal-body .cal-cell')].find(x => parseInt(x.querySelector('.cal-num').textContent, 10) === d);
        const ic = c.querySelector('.cal-icon'), tag = c.querySelector('.cal-tag');
        const wort = [...c.querySelectorAll('span')].filter(s => /font-size:7px/.test(s.getAttribute('style') || '')).map(s => s.textContent.trim()).join('');
        return { icon: ic ? (ic.querySelector('svg') ? 'svg' : ic.textContent.trim()) : '', tag: tag ? tag.textContent : '', farbe: tag ? tag.getAttribute('style') : '', wort }; };
      const neu = (name, tage) => addCyc({ name, startDate: isoPlus(todayISO(), -tage), seedType: 'auto', growType: 'indoor', medium: 'erde',
        potSize: 11, plantCount: 3, startMethod: 'direct', fertPlanId: pid }, { still: true });
      const lauf = (versatz) => { S.cycles = []; S.entries = {};
        const ga = neu('Gruppe A', 60), gb = neu('Gruppe B', 60 - versatz); const tage = [];
        for (let i = 0; i < 200; i++) { const iso = isoPlus(ga.startDate, i); const pa = phase(iso, ga), pb = phase(iso, gb);
          const aa = getAction(iso, ga), ba = getAction(iso, gb);
          if (pa && pb && aa && ba) tage.push({ iso, aa, ba, da: pa.day, db: pb.day, z: zelle(iso) }); }
        return { hexA: col(ga).hex, hexB: col(gb).hex, tage }; };
      const out = { v6: lauf(6), vm9: lauf(-9) };
      // Eine Gruppe allein: Der IceFlush-Tag trägt Symbol und Wort wie bisher
      S.cycles = []; const solo = neu('Solo', 60); out.solo = null;
      for (let i = 0; i < 200 && !out.solo; i++) { const iso = isoPlus(solo.startDate, i); if (getAction(iso, solo) === 'ice') out.solo = Object.assign({ iso, d: phase(iso, solo).day }, zelle(iso)); }
      S.cycles = vorher; S.entries = JSON.parse(eVorher); calDate = new Date(); saveS();
      return JSON.stringify(out); })()`));
    const finde = (lauf, aa, ba) => lauf.tage.find(t => t.aa === aa && t.ba === ba);
    const tIce = finde(r.v6, 'trocknen', 'ice'), tErnte = finde(r.v6, 'trocknen', 'ernte'), tSpuel = finde(r.vm9, 'giess', 'spuelen');
    pruefe(tIce && tErnte && tSpuel, `F18-0 Prüflage: trocknen×ice ${!!tIce}, trocknen×ernte ${!!tErnte}, giess×spuelen ${!!tSpuel}`);
    if (tIce && tErnte && tSpuel) {
      pruefe(tIce.z.icon === '🧊' && tIce.z.wort === 'IceFlush',
        `F18-1 Gruppe A trocknet, Gruppe B hat IceFlush (${tIce.iso}): Zelle zeigt Symbol „${tIce.z.icon}", Wort „${tIce.z.wort}" statt 🧊 „IceFlush"`);
      pruefe(tErnte.z.icon === 'svg' && tErnte.z.wort === 'Ernte',
        `F18-2 Gruppe A trocknet, Gruppe B hat Ernte (${tErnte.iso}): Zelle zeigt Symbol „${tErnte.z.icon}", Wort „${tErnte.z.wort}" statt Ernte-Symbol und „Ernte"`);
      pruefe(tIce.z.tag === 'T' + tIce.db && tIce.z.farbe.includes(r.v6.hexB) && tErnte.z.tag === 'T' + tErnte.db && tErnte.z.farbe.includes(r.v6.hexB),
        `F18-3 Tag-Nummer und Farbe gehören nicht zu Gruppe B: IceFlush ${tIce.z.tag} (soll T${tIce.db}), Ernte ${tErnte.z.tag} (soll T${tErnte.db})`);
      pruefe(tSpuel.z.tag === 'T' + tSpuel.db && tSpuel.z.farbe.includes(r.vm9.hexB),
        `F18-4 Gruppe A gießt, Gruppe B spült (${tSpuel.iso}): Zelle zeigt ${tSpuel.z.tag} statt Gruppe B (T${tSpuel.db}), Symbol „${tSpuel.z.icon}"`);
    }
    // Allgemein: Die Zelle folgt dem höheren Rang, bei Gleichstand der ersten Gruppe
    for (const [name, lauf] of [['Versatz 6', r.v6], ['Versatz −9', r.vm9]]) {
      const falsch = lauf.tage.filter(t => {
        const gewinnerB = (RANG[t.ba] || 0) > (RANG[t.aa] || 0);
        return t.z.tag !== 'T' + (gewinnerB ? t.db : t.da) || !t.z.farbe.includes(gewinnerB ? lauf.hexB : lauf.hexA);
      });
      pruefe(lauf.tage.length > 0 && falsch.length === 0,
        `F18-5 ${name}: ${falsch.length} von ${lauf.tage.length} Tagen mit zwei Aufgaben zeigen die falsche Gruppe: ` +
        falsch.slice(0, 3).map(t => `${t.iso} ${t.aa}/${t.ba} → ${t.z.tag}`).join(' | '));
    }
    pruefe(r.solo && r.solo.icon === '🧊' && r.solo.wort === 'IceFlush' && r.solo.tag === 'T' + r.solo.d,
      `F18-6 eine Gruppe allein: IceFlush-Zelle verändert: ${JSON.stringify(r.solo)}`);
  }

  // F12 · Zwei Wochenzählungen und kein heutiger Plan-Tag: Der Plan zählt ab dem Keimling, die App ab dem Keimstart.
  // Mit 26 Anzucht-Tagen sind das 5 Tage Vorlauf; die Rainbow-Wochen-Tipps nennen ihre Termine in Plan-Tagen („FIM-Stichtag Plan-Tag 13").
  {
    const fl = (s) => String(s || '').split(/\s+/).join(' ');
    const r = JSON.parse(a.E(`(function(){ const vorher = S.cycles.slice(); const eVorher = JSON.stringify(S.entries); const pid = S.cycles[0].fertPlanId;
      const heute = todayISO();
      const pt = (c, iso) => (typeof _planTagAbKeimling === 'function' ? _planTagAbKeimling(c, iso) : null);
      const text = (id) => { const el = document.getElementById(id); return el ? el.textContent : ''; };
      const lege = (tag, anz) => { S.cycles = []; S.entries = {};
        const c = addCyc({ name: 'Vorlauf-Zyklus', startDate: isoPlus(heute, -(tag - 1)), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
          plantCount: 3, startMethod: 'direct', fertPlanId: pid }, { still: true }); c.anzuchtDays = anz; c.bloomDays = 70; return c; };
      const lies = (tag, anz, einsteiger) => { S.beginnerMode = einsteiger; const c = lege(tag, anz);
        openEntry(heute); renderEntry(heute); const kopf = text('entry-body');
        renderDash(); const dash = text('dash-body');
        switchFertPlan(pid); goTo('duenger'); const blatt = text('duenger-body'); goTo('dash');
        return { vorlauf: _keimVorlauf(c, getPlanForCycle(c)), planTag: pt(c, heute), kopf, dash, blatt }; };
      const out = { t18p: lies(18, 26, false), t18e: lies(18, 26, true), t33p: lies(33, 26, false), ohne: lies(18, 21, false) };
      // Die Tage, die die Wochen-Tipps nennen, liegen in der Plan-Woche, die sie nennen
      const c = lege(60, 26); const am = (n) => { for (let i = 0; i < 120; i++) { const iso = isoPlus(c.startDate, i); if (pt(c, iso) === n) return iso; } return null; };
      const i13 = am(13), i22 = am(22);
      out.fim = { iso: i13, woche: i13 && fertPlanWeek(c, i13), ph: i13 && phase(i13, c).ph };
      out.blueteNull = { iso: i22, woche: i22 && fertPlanWeek(c, i22), ph: i22 && phase(i22, c).ph };
      // Vor dem Durchbruch gibt es keinen Plan-Tag; der erste ist der Tag nach dem Vorlauf
      out.davor = [pt(c, isoPlus(c.startDate, 2)), pt(c, isoPlus(c.startDate, 4)), pt(c, isoPlus(c.startDate, 5))];
      // Ab dem Spülen nennt der Plan keine Plan-Tage mehr
      let spuelen = null; for (let i = 0; i < 160 && !spuelen; i++) { const iso = isoPlus(c.startDate, i); const p = phase(iso, c); if (p && p.ph === 'flush') spuelen = iso; }
      out.spuelen = spuelen && pt(c, spuelen);
      S.beginnerMode = false; S.entries = JSON.parse(eVorher); S.cycles = vorher; saveS();
      return JSON.stringify(out); })()`));
    pruefe(r.t18p.vorlauf === 5 && r.t18p.planTag === 13, `F12-0 Prüflage: Tag 18 mit 26 Anzucht-Tagen ist Plan-Tag 13 (Vorlauf ${r.t18p.vorlauf}, Plan-Tag ${r.t18p.planTag})`);
    pruefe(/Anzucht Tag 18 · Plan-Tag 13 ab Keimling/.test(fl(r.t18p.kopf)), `F12-1 Profi: der Eintragskopf nennt an Tag 18 nicht „Plan-Tag 13": ${fl(r.t18p.kopf).slice(0, 400)}`);
    pruefe(/Anzucht Tag 18 · Plan-Tag 13 ab Keimling/.test(fl(r.t18e.kopf)), `F12-2 Einsteiger: der Eintragskopf nennt an Tag 18 nicht „Plan-Tag 13": ${fl(r.t18e.kopf).slice(0, 400)}`);
    pruefe(/Blüte Tag 33 · Plan-Tag 28 ab Keimling/.test(fl(r.t33p.kopf)), `F12-3 Blüte: der Eintragskopf nennt an Tag 33 nicht „Plan-Tag 28": ${fl(r.t33p.kopf).slice(0, 400)}`);
    pruefe(r.ohne.vorlauf === 0 && r.ohne.planTag === null && !/Plan-Tag \d+ ab Keimling/.test(fl(r.ohne.kopf)) && !/heute Plan-Tag/.test(fl(r.ohne.blatt)),
      `F12-4 ohne Vorlauf (21 Anzucht-Tage) steht kein Plan-Tag da — er wäre der Tag der App: ${fl(r.ohne.kopf).slice(0, 300)}`);
    pruefe(r.fim.woche === 2 && r.fim.ph === 'anzucht', `F12-5 Plan-Tag 13 („FIM-Stichtag … fällt in diese Woche") liegt nicht in Plan-Woche 2: ${JSON.stringify(r.fim)}`);
    pruefe(r.blueteNull.woche === 4 && r.blueteNull.ph === 'bloom', `F12-6 Plan-Tag 22 („Blütetag 0 in Woche 4") liegt nicht in Plan-Woche 4 der Blüte: ${JSON.stringify(r.blueteNull)}`);
    pruefe(r.davor[0] === null && r.davor[1] === null && r.davor[2] === 1, `F12-7 vor dem Durchbruch gibt es keinen Plan-Tag, Tag 6 ist Plan-Tag 1: ${JSON.stringify(r.davor)}`);
    pruefe(r.spuelen === null, `F12-8 im Spülen steht kein Plan-Tag mehr: ${JSON.stringify(r.spuelen)}`);
    pruefe(/Woche 2: \(heute Plan-Tag 13\)/.test(fl(r.t18p.blatt)), `F12-9 Plan-Blatt: der Wochen-Tipp nennt nicht den heutigen Plan-Tag: ${fl(r.t18p.blatt).slice(-900)}`);
    // (v1.5.409)
    // Zwei Wochenzählungen: Die Plan-Woche („Wo2 …") ist die der Startseite; die Phasen-Woche heißt in der Blüte „Blüte Wo.", in der Anzucht entfällt sie
    pruefe(/Anzucht · Tag 18 · Wo2 /.test(fl(r.t18p.dash)) && !/ · Wo\. \d+ · Tag/.test(fl(r.t18p.dash)), `F12-10 Profi, Anzucht: neben der Plan-Woche „Wo2" steht noch eine unbeschriftete „Wo. 3": ${fl(r.t18p.dash).slice(0, 600)}`);
    pruefe(/Blüte Wo\. 1 · Tag 33/.test(fl(r.t33p.dash)) && !/ · Wo\. \d+ · Tag/.test(fl(r.t33p.dash)), `F12-11 Profi, Blüte: die Phasen-Woche heißt nicht „Blüte Wo.": ${fl(r.t33p.dash).slice(0, 600)}`);
    pruefe(!/ Wo\. \d+ · Tag/.test(fl(r.t18e.dash)), `F12-12 Einsteiger sieht keine Wochenzahl auf der Zyklus-Karte: ${fl(r.t18e.dash).slice(0, 400)}`);
  }

  // F14 (v1.5.410) · Das pH-Ziel im Eintrag ist die Zahl der Plan-Woche, nicht fest das Ziel des Substrats
  {
    const eVorher = a.E('JSON.stringify(S.entries)');
    // Prüflage: ein Gießtag in Plan-Woche 6 (Rainbow: pH 6,25), erster Tag der Woche (dann steht die Wochenkarte im Eintrag)
    const L = JSON.parse(a.E(`(function(){ const c = S.cycles[0]; const out = {};
      for (let i = 0; i < 160; i++) { const iso = isoPlus(c.startDate, i); const p = phase(iso, c); if (!p) continue;
        const wk = fertPlanWeek(c, iso, p); if (wk !== 6 || out.erster) continue; out.erster = iso; }
      for (let i = 0; i < 160; i++) { const iso = isoPlus(c.startDate, i); const p = phase(iso, c); if (!p) continue;
        if (fertPlanWeek(c, iso, p) !== 6) continue; if (isGiessTag(iso, c) && getFeedWaterEffective(c, p, iso, null) !== 'water') { out.giess = iso; break; } }
      return JSON.stringify(out); })()`));
    pruefe(L.erster && L.giess, 'F14-0 Prüflage: kein Tag in Plan-Woche 6 gefunden: ' + JSON.stringify(L));

    // 1 · Daten: Jede Zahl im Feld ph steht auch im Wochen-Tipp; Woche 1–12 und 14 haben eine
    const D = JSON.parse(a.E(`(function(){ const wf = FERT_PRESETS.rainbow_auto.weekFocus; const out = [];
      for (let w = 1; w <= 15; w++) { const f = wf[w]; const m = f.tip.match(/pH(?: |-Wasser )(\\d),(\\d+)/);
        out.push({ w, ph: f.ph === undefined ? null : f.ph, im_tipp: m ? parseFloat(m[1] + '.' + m[2]) : null }); }
      return JSON.stringify(out); })()`));
    const ohne = D.filter(x => x.im_tipp !== null && x.ph !== x.im_tipp).map(x => `Wo ${x.w}: Feld ${x.ph} / Tipp ${x.im_tipp}`);
    pruefe(ohne.length === 0, 'F14-1 Plan-Woche mit pH im Tipp-Text, aber ohne dieselbe Zahl im Feld ph: ' + ohne.join(' | '));
    pruefe(D.filter(x => x.w <= 12).every(x => typeof x.ph === 'number'), 'F14-1b Woche 1–12 ohne Zahl im Feld ph: ' + JSON.stringify(D.filter(x => x.w <= 12 && typeof x.ph !== 'number').map(x => x.w)));

    // 2 · Die Funktion: Zielwert der Woche, Spanne bleibt die des Substrats
    const Z = JSON.parse(a.E(`(function(){ const c = S.cycles[0]; if (typeof phZielFuer !== 'function') return JSON.stringify({ fehlt: true });
      const z = phZielFuer(c, '${L.giess}'); const alt = phTargetFor('erde');
      return JSON.stringify({ midText: z.midText, mid: z.mid, quelle: z.quelle, label: z.label, labelComma: z.labelComma, lo: z.lo, hi: z.hi, altLabel: alt.label }); })()`));
    pruefe(!Z.fehlt && Z.midText === '6.25' && Z.mid === 6.25 && Z.quelle === 'plan', 'F14-2 phZielFuer in Plan-Woche 6: ' + JSON.stringify(Z));
    pruefe(Z.label === Z.altLabel && Z.lo === 6.2 && Z.hi === 6.4, 'F14-2b die Spanne bleibt die des Substrats: ' + JSON.stringify(Z));

    // 3 · Eintrag (Profi) am ersten Tag der Woche: Wochenkarte und Zielzeile nennen dieselbe Zahl
    const E = JSON.parse(a.E(`(function(){ S.beginnerMode = false; const c = S.cycles[0]; const out = {};
      const lies = (iso) => { setDebugDate(iso); openEntry(iso); renderEntry(iso); const t = document.getElementById('entry-body').textContent.replace(/\\s+/g, ' ');
        const f = document.getElementById('ph-' + c.id); const r = { t, platz: f ? f.getAttribute('placeholder') : null }; setDebugDate(''); return r; };
      const e1 = lies('${L.erster}'); out.karte = (e1.t.match(/Woche 6[^—]{0,80}— pH (\\d,\\d+)/) || [])[1] || null;
      out.zielE = (e1.t.match(/Ziel: pH (\\d\\.\\d+)/) || [])[1] || null;
      const e2 = lies('${L.giess}'); out.ziel = (e2.t.match(/Ziel: pH (\\d\\.\\d+)/) || [])[1] || null; out.hint = (e2.t.match(/🎯 pH: (\\d\\.\\d+)/) || [])[1] || null;
      out.mischen = (e2.t.match(/→ pH auf (\\d\\.\\d+)/) || [])[1] || null; out.platz = e2.platz;
      return JSON.stringify(out); })()`));
    pruefe(E.karte === '6,25', 'F14-3a Prüflage: Wochenkarte nennt nicht pH 6,25: ' + JSON.stringify(E));
    pruefe(E.zielE && E.zielE.replace('.', ',') === E.karte, `F14-3b Wochenkarte „pH ${E.karte}“ und Zielzeile „Ziel: pH ${E.zielE}“ im selben Eintrag verschieden`);
    pruefe(E.ziel === '6.25' && E.hint === '6.25' && E.mischen === '6.25' && E.platz === '6.25', 'F14-3c Ziel / Hinweiszeile / Mischen-Zeile / Platzhalter in Plan-Woche 6: ' + JSON.stringify(E));

    // 4 · Einsteiger: Spanne im Feld-Hinweis bleibt, die Startseite nennt die Zahl der Woche
    const S1 = JSON.parse(a.E(`(function(){ S.beginnerMode = true; const c = S.cycles[0]; const iso = '${L.giess}'; setDebugDate(iso);
      openEntry(iso); renderEntry(iso); const t = document.getElementById('entry-body').textContent.replace(/\\s+/g, ' ');
      renderDash(); const d = document.getElementById('dash-body').textContent.replace(/\\s+/g, ' '); setDebugDate(''); S.beginnerMode = false;
      return JSON.stringify({ spanne: /pH 6\\.2–6\\.4 ist optimal/.test(t), start: (d.match(/pH auf (\\d\\.\\d+) einstellen/) || [])[1] || null }); })()`));
    pruefe(S1.spanne, 'F14-4a Einsteiger: „pH 6.2–6.4 ist optimal“ (Spanne des Substrats) fehlt: ' + JSON.stringify(S1));
    pruefe(S1.start === '6.25', 'F14-4b Startseite „pH auf … einstellen“ in Plan-Woche 6: ' + JSON.stringify(S1));

    // 5 · „Tag automatisch ausfüllen“ schlägt dieselbe Zahl vor
    const T = a.E(`(function(){ const c = S.cycles[0]; const iso = '${L.giess}'; const p = phase(iso, c); const t = getAutoFillTemplate(c, p, getAction(iso, c), iso); return t ? t.ph : 'kein Template'; })()`);
    pruefe(T === '6.25', 'F14-5 Auto-Ausfüllen schlägt pH ' + T + ' vor statt 6.25');

    // 6 · Gültigkeit: Planwert nur innerhalb der Spanne des Substrats; ohne Zahl im Plan bleibt es beim Substrat-Ziel
    const G = JSON.parse(a.E(`(function(){ const c = S.cycles[0]; const out = {}; const iso = '${L.giess}'; const vorherIds = S.cycles.map(x => x.id);
      const zf = (typeof phZielFuer === 'function') ? phZielFuer : () => ({ midText: 'fehlt', quelle: 'fehlt', label: '' });
      const coco = addCyc({ name: 'Coco', startDate: c.startDate, seedType: 'auto', growType: 'indoor', medium: 'coco', potSize: 11, plantCount: 2,
        startMethod: 'direct', fertPlanId: c.fertPlanId }, { still: true });
      const z = zf(coco, iso); out.coco = { midText: z.midText, quelle: z.quelle, label: z.label };
      let tag13 = null;
      for (let i = 0; i < 160; i++) { const d = isoPlus(c.startDate, i); const p = phase(d, c); if (p && fertPlanWeek(c, d, p) === 13) { tag13 = d; break; } }
      const z13 = zf(c, tag13); out.w13 = { midText: z13.midText, quelle: z13.quelle };
      const pl = _planFuerVorlage('biobizz_light'); const bio = addCyc({ name: 'Bio', startDate: c.startDate, seedType: 'auto', growType: 'indoor', medium: 'erde',
        potSize: 11, plantCount: 2, startMethod: 'direct', fertPlanId: pl }, { still: true });
      const zb = zf(bio, iso); out.bio = { midText: zb.midText, quelle: zb.quelle };
      out.leer = (function(){ try { const x = zf(null, null); return x.midText; } catch (e) { return 'Fehler: ' + e.message; } })();
      S.cycles = S.cycles.filter(x => vorherIds.includes(x.id)); saveS();
      return JSON.stringify(out); })()`));
    pruefe(G.coco.midText === '6.0' && G.coco.quelle === 'substrat' && G.coco.label === '5.8–6.2', 'F14-6a Erd-Plan in Coco: Planwert 6,25 liegt über der Coco-Spanne und darf nicht gelten: ' + JSON.stringify(G.coco));
    pruefe(G.w13.midText === '6.4' && G.w13.quelle === 'substrat', 'F14-6b Plan-Woche 13 (Rampe) nennt im Plan kein pH: Ziel des Substrats: ' + JSON.stringify(G.w13));
    pruefe(G.bio.midText === '6.4' && G.bio.quelle === 'substrat', 'F14-6c Plan ohne pH-Zahlen (BioBizz Light) unverändert 6.4: ' + JSON.stringify(G.bio));
    pruefe(G.leer === '6.4', 'F14-6d phZielFuer(null, null) wirft nicht: ' + G.leer);

    a.E('S.entries = JSON.parse(' + JSON.stringify(eVorher) + '); saveS();');
    // 7 · Wächter: keine Anzeigestelle rechnet das Ziel mehr mit toFixed(1) (6,25 würde „6.3“)
    pruefe(!/pht\.mid\.toFixed\(1\)/.test(HTML), 'F14-7 Quelltext: pht.mid.toFixed(1) kommt noch vor (' + (HTML.match(/pht\.mid\.toFixed\(1\)/g) || []).length + ' Stellen)');
  }

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_runzwei: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_runzwei: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_runzwei abgebrochen:', (e && e.stack) || e); process.exit(1); });
