// (v1.5.448) Startseiten-Hinweis zur Diagnose: „Topf schwer“ erst nach zwei Messungen, und das ✕ gilt nur für dieselben Signale.
//
// getDiagnosticHints meldete „Erde bleibt dauerhaft feucht“ nach jedem einzelnen „Voll“ oder „Mittel“ — also nach jedem
// Gießtag, obwohl ein voller Topf nach dem Guss der Normalzustand ist (ANBAU.md 1, Regel 2). Ein Tipp auf ✕ blendete den
// Hinweis für den Zyklus bis zu seinem Ende aus; ein späterer echter Befund erschien nie wieder, und der Rücksetzer aus dem
// Kommentar (resetDiagHintDismissal) gab es nicht. Diagnose-Prüfung vom 08.10.2026, Befund B06.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

(async () => {
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
  const E = (s) => w.eval(s);
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };

  // Zyklus in der Blüte (Tag 60), Erde; Messungen: { tageZurueck: restPct }, dazu optional Temperatur heute.
  const lage = (mess, temp) => JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S.dismissedDiagHints = []; S._seedlingProtocolShown = true;
    const heute = todayISO();
    const c = addCyc({ name: 'Test', startDate: isoPlus(heute, -60), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c]; selId = c.id;
    const mess = ${JSON.stringify(mess)};
    Object.keys(mess).forEach(d => { const iso = isoPlus(heute, -Number(d)); S.entries[iso] = S.entries[iso] || { cycleData: {} };
      S.entries[iso].cycleData[c.id] = { restPct: mess[d] }; });
    ${temp ? `S.entries[heute] = S.entries[heute] || { cycleData: {} }; S.entries[heute].temp = ${temp}; S.entries[heute].cycleData[c.id] = S.entries[heute].cycleData[c.id] || {};` : ''}
    const h = getDiagnosticHints(c);
    return JSON.stringify({ id: c.id, h }); })()`));
  const schwer = (r) => !!(r.h && /schwer|dauerhaft feucht/.test(r.h.text));

  // 1. Ein einzelnes „Voll“ heute: kein Hinweis „schwer“
  let r = lage({ 0: 95 });
  pruefe(!schwer(r), 'Einmal „Voll“ heute: kein Hinweis „Topf schwer“ — ' + (r.h && r.h.text));
  // 2. Gestern „Voll“ und heute „Mittel“ (Erde: beide über der Nass-Grenze): Hinweis
  r = lage({ 1: 95, 0: 70 });
  pruefe(schwer(r), 'Zweimal schwer hintereinander: Hinweis „Topf schwer“');
  // 3. Gestern „Voll“, heute „Knapp“: kein Hinweis
  r = lage({ 1: 95, 0: 30 });
  pruefe(!schwer(r), 'Gestern voll, heute am Gießpunkt: kein Hinweis');
  // 4. ✕ blendet aus — bis ein neues Signal dazukommt
  r = lage({ 1: 95, 0: 95 });
  const sicht = (h) => E(`(S.dismissedDiagHints || []).includes(${JSON.stringify(r.id)} + '|' + ${JSON.stringify((h && h.sig) || '')})`);
  pruefe(r.h && typeof r.h.sig === 'string' && r.h.sig.length > 0, 'Hinweis trägt seine Signale (sig)');
  E(`dismissDiagHint(${JSON.stringify(r.id)}, ${JSON.stringify((r.h && r.h.sig) || '')})`);
  pruefe(sicht(r.h) === true, 'Nach ✕: dieselben Signale bleiben ausgeblendet');
  const h2 = JSON.parse(E(`(function(){ const c = S.cycles[0]; S.entries[todayISO()].temp = 32; return JSON.stringify(getDiagnosticHints(c)); })()`));
  pruefe(h2 && h2.sig !== r.h.sig, 'Neues Signal (zu warm): andere Signatur');
  pruefe(E(`(S.dismissedDiagHints || []).includes(${JSON.stringify(r.id)} + '|' + ${JSON.stringify((h2 && h2.sig) || '')})`) === false, 'Neues Signal: Hinweis erscheint wieder');
  // 5. Ein alter Eintrag (nur die Zyklus-Kennung) blendet nicht mehr für immer aus und wird beim nächsten ✕ ersetzt
  E(`S.dismissedDiagHints = [${JSON.stringify(r.id)}]`);
  E(`dismissDiagHint(${JSON.stringify(r.id)}, 'nass')`);
  const liste = JSON.parse(E('JSON.stringify(S.dismissedDiagHints)'));
  pruefe(liste.length === 1 && liste[0] === r.id + '|nass', 'Alter Eintrag ersetzt — ' + JSON.stringify(liste));

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
