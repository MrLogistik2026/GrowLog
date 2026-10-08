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

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_runzwei: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_runzwei: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_runzwei abgebrochen:', (e && e.stack) || e); process.exit(1); });
