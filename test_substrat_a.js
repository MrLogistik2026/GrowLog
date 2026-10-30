// (v1.5.XXX) EC-Ziel nach Substrat und Vordüngung: vorgedüngte Erde ohne Dosis im Plan bekommt die Sämlings-Spanne, nicht „Vegi 0,7–1,0“.
//
// Befund (Fachprüfung 30.10.2026, ANBAU.md 13.2, 5, 7.1): Die EC-Tabelle galt für jedes Substrat und jede Woche; am Tag 12 stand im
// Eintrag „EC Ziel 0.7–1.0“ neben „Keine Dünger konfiguriert“. Light-Mix trägt die ersten Wochen von selbst. Der Hinweis in den
// Einstellungen sagte bei Coco „höhere EC“, ANBAU.md 7.1 sagt häufiger und schwächer.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');
async function lade() {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => null; w.navigator.vibrate = () => true; w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {}; w.alert = () => {}; w.print = () => {}; },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  w.toast = () => {};
  return { w, E: (s) => w.eval(s), errors };
}

// Plan und Zyklus aus einer Vorlage anlegen (wie „Vorlage laden“)
const ANLEGEN = `
  window.__anlegen = function (key, medium, startOffset) {
    const pr = FERT_PRESETS[key];
    const products = pr.products.map((p, i) => ({ id: key + '_p' + i, ...p }));
    const schedule = {};
    Object.entries(pr.schedule || {}).forEach(([w, d]) => { const m = {}; Object.entries(d || {}).forEach(([n, v]) => { const pp = products.find(x => x.name === n); if (pp) m[pp.id] = v; }); schedule['w' + w] = m; });
    const plan = { id: 'fp_' + key, name: pr.name, products, schedule, presetKey: key };
    plan.weekPhases = pr.weekPhases ? [...pr.weekPhases] : null; plan.phaseSkeleton = pr.phaseSkeleton ? { ...pr.phaseSkeleton } : null;
    plan.weekDayBounds = pr.weekDayBounds ? [...pr.weekDayBounds] : null; plan.ecTargets = pr.ecTargets ? JSON.parse(JSON.stringify(pr.ecTargets)) : null;
    if (pr.feedWaterRhythm) plan.feedWaterRhythm = { ...pr.feedWaterRhythm };
    const c = addCyc({ name: 'T ' + key, seedType: 'auto', medium: medium || pr.medium || 'erde' }, { still: true });
    S.fertPlans = (S.fertPlans || []).filter(x => x.id !== plan.id); S.fertPlans.push(plan);
    c.fertPlanId = plan.id; c.startDate = isoPlus(todayISO(), -(startOffset || 0)); c.medium = medium || pr.medium || 'erde';
    S.cycles = [c]; return c;
  };`;

(async () => {
  const { w, E, errors } = await lade();
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  E(`S._seedlingProtocolShown = true; S.cycles = []; S.entries = {}; S.beginnerMode = false;`);
  E(ANLEGEN);
  const ziel = (medium, tag, key) => JSON.parse(E(`(function(){ S.cycles = [];
    const c = ${key ? `__anlegen(${JSON.stringify(key)}, ${JSON.stringify(medium)}, ${tag - 1})` : `addCyc({ name: 'T', startDate: isoPlus(todayISO(), -${tag - 1}), seedType: 'auto', growType: 'indoor', medium: ${JSON.stringify(medium)}, potSize: 11, plantCount: 1 }, { still: true })`};
    S.cycles = [c]; return JSON.stringify(_ecTargetFor(c, todayISO())); })()`));

  // 1. Erde ohne Plan, Anzucht: Sämlings-Spanne
  const e12 = ziel('erde', 12);
  pruefe(e12 && e12.max === 0.6 && e12.min === 0 && e12.def === 0 && e12.nurObergrenze === true, 'Erde ohne Plan, Tag 12: nur Obergrenze 0,6, kein Mindestwert, Platzhalter 0 (' + JSON.stringify(e12) + ')');
  pruefe(e12 && e12.label === 'Vorgedüngte Erde — Wasser genügt', 'Das Etikett nennt Vordüngung und „Wasser genügt“ (' + (e12 && e12.label) + ')');
  const e18 = ziel('erde', 18);
  pruefe(e18 && e18.max === 0.6 && e18.nurObergrenze === true, 'Erde ohne Plan, Tag 18: ebenfalls nur Obergrenze');
  // Gültigkeit: nur die ersten 21 Tage der Anzucht; danach die normale Tabelle, auch wenn die Anzucht länger dauert
  const e21 = ziel('erde', 21), e22 = ziel('erde', 22);
  pruefe(e21 && e21.nurObergrenze === true, 'Erde ohne Plan, Tag 21: noch nurObergrenze');
  pruefe(e22 && !e22.nurObergrenze && e22.min > 0, 'Erde ohne Plan, Tag 22: normale Tabelle (' + JSON.stringify(e22) + ')');
  const e30 = JSON.parse(E(`(function(){ S.cycles = []; const c = addCyc({ name: 'T', startDate: isoPlus(todayISO(), -29), seedType: 'photo', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1 }, { still: true }); c.anzuchtDays = 40;
    S.cycles = [c]; return JSON.stringify({ p: phase(todayISO(), c).ph, z: _ecTargetFor(c, todayISO()) }); })()`));
  pruefe(e30.p === 'anzucht' && e30.z && !e30.z.nurObergrenze && e30.z.min > 0, 'Anzucht von 40 Tagen, Tag 30 (Vegi): normale Tabelle statt „Wasser genügt“ (' + JSON.stringify(e30) + ')');
  // 2. Erde mit Plan, der in dieser Woche dosiert: die Tabelle bleibt
  const p12 = ziel('erde', 12, 'biobizz_light');
  pruefe(p12 && p12.min === 0.7 && p12.max === 1, 'Erde mit BioBizz Light, Tag 12 (Dosis im Plan): 0,7–1,0 bleibt (' + JSON.stringify(p12) + ')');
  // 3. Plan mit eigenen EC-Zielen: der Plan gilt
  const r12 = ziel('erde', 12, 'rainbow_auto');
  pruefe(r12 && r12.max === 0.55, 'Rainbow (eigene EC-Ziele), Tag 12: der Plan gilt (' + JSON.stringify(r12) + ')');
  // 4. Coco hat keine Vordüngung: die Tabelle bleibt
  const c12 = ziel('coco', 12);
  pruefe(c12 && c12.min === 0.7 && c12.max === 1, 'Coco ohne Plan, Tag 12: Tabelle bleibt, keine Vordüngung (' + JSON.stringify(c12) + ')');
  // 5. Blüte unverändert
  const b30 = ziel('erde', 32);
  pruefe(b30 && b30.min >= 1, 'Erde ohne Plan, Blüte Tag 32: unverändert über 1,0 (' + JSON.stringify(b30) + ')');
  // 6. Der Eintrag nennt die Spanne
  E(`S.cycles = []; S.beginnerMode = false; const c = addCyc({ name: 'T', startDate: isoPlus(todayISO(), -11), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11, plantCount: 1 }, { still: true }); c.weightMode = 'lift'; S.cycles = [c];`);
  try { E('openEntry(todayISO())'); } catch (e) { pruefe(false, 'openEntry: ' + e.message); }
  const txt = ((w.document.getElementById('scr-entry') || w.document.body).textContent || '').replace(/\s+/g, ' ');
  pruefe(!/Ziel 0[.,]7.1[.,]0/.test(txt), 'Eintrag Tag 12 ohne Plan nennt kein „Ziel 0,7–1,0“');
  pruefe(/Ziel bis 0[.,]6/.test(txt) && !/0[.,]4.0[.,]6/.test(txt), 'Eintrag Tag 12 ohne Plan: „Ziel bis 0,6“ statt „0,4–0,6“');
  pruefe(/Wasser genügt, Light-Mix ist vorgedüngt/.test(txt), 'Eintrag (Profi) erklärt: „Wasser genügt, Light-Mix ist vorgedüngt“');
  E('S.beginnerMode = true; openEntry(todayISO())');
  const txtE = ((w.document.getElementById('scr-entry') || w.document.body).textContent || '').replace(/\s+/g, ' ');
  pruefe(/Wasser genügt — die Erde ist schon gedüngt/.test(txtE), 'Eintrag (Einsteiger): „Wasser genügt — die Erde ist schon gedüngt“');
  E('S.beginnerMode = false');
  // Bei reinem Wasser keine Mangel-Meldung, bei hartem Leitungswasser (EC 0,9, Eigen-EC) keine Überdüngungs-Warnung
  const ew = (ec) => JSON.parse(E(`(function(){ const c = S.cycles[0]; const p = phase(todayISO(), c);
    return JSON.stringify(getEntryWarnings({ ec: '${ec}', water: '300' }, p, {}, c, todayISO()).filter(function (x) { return /EC|Dünger-Wert/.test(x.text); }).map(function (x) { return x.text; })); })()`));
  pruefe(ew(0.2).length === 0, 'EC 0,2 (reines Wasser, Anzucht Tag 12): keine „zu niedrig / hochdüngen“-Meldung (' + JSON.stringify(ew(0.2)) + ')');
  pruefe(ew(0.9).length === 0, 'EC 0,9 (hartes Leitungswasser): keine Warnung „deutlich über dem Ziel“ (' + JSON.stringify(ew(0.9)) + ')');
  // Lexikon: keine Untergrenzen-Meldung
  const lex = (ecv) => String(E(`(function(){ const c = S.cycles[0]; S.entries[todayISO()] = { cycleData: { [c.id]: { ec: '${ecv}' } } };
    return lexCycleNote('EC-Wert (Osmotischer Druck)'); })()`)).replace(/<[^>]+>/g, '');
  pruefe(/bis 0[.,]6/.test(lex(0.2)) && !/hochdüngen/.test(lex(0.2)), 'Lexikon-Bewertung bei EC 0,2: „bis 0,6“, kein „hochdüngen“ (' + lex(0.2).slice(0, 160) + ')');
  // 7. Quelltext: Coco-Hinweis in den Einstellungen und im Assistenten
  const HTMLQ = require('fs').readFileSync(process.env.GS_INDEX || require('path').join(__dirname, 'index.html'), 'utf8');
  pruefe(!/Coco: häufiger gießen, pH 5\.8–6\.2, höhere EC/.test(HTMLQ), 'Einstellungs-Hinweis sagt bei Coco nicht „höhere EC“');
  pruefe(/bei jedem Guss etwas Dünger statt selten viel/.test(HTMLQ) && !/schwächer düngen/.test(HTMLQ), 'Einstellungs-Hinweis nennt: bei jedem Guss etwas Dünger statt selten viel (kein „schwächer düngen“)');
  pruefe(/jede Gabe enthält etwas weniger Dünger/.test(HTMLQ) && !/schwächer gedüngt als Erde/.test(HTMLQ), 'Assistent: „jede Gabe enthält etwas weniger Dünger“ statt „schwächer gedüngt als Erde“');
  pruefe(!/braucht etwas andere pH- und EC-Werte/.test(HTMLQ), 'Assistent sagt nicht mehr „etwas andere EC-Werte“ für Coco');
  pruefe(errors.length === 0, 'Keine JS-Fehler: ' + errors.slice(0, 2).join(' | '));

  console.log(fehler.length ? 'FEHLER (' + fehler.length + ' von ' + n + '):\n - ' + fehler.join('\n - ') : 'OK (' + n + ' Prüfungen)');
  process.exit(fehler.length ? 1 : 0);
})();
