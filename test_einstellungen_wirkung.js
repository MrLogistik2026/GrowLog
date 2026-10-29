// (v1.5.463) Einstellungen: Über dem Sichern-Knopf steht, was sich mit dem Sichern ändert — mit Datum und Zahl, in beiden Modi.
//
// Vorher zeigte nur „Damit ergibt sich“ die Kette, für sieben Felder und hinter dem zugeklappten Zeitplan; Topf, Substrat,
// Pflanzenzahl, Düngeplan, Spül- und IceFlush-Tage änderten Gieß-Fahrplan, Mengen und Ernte still, und eine kürzere Blüte
// schob Gießtage in die Vergangenheit, die danach als „verpasst“ gemeldet wurden. Bedien-Prüfung „Einstellungen und Kopplung“
// am 29.10.2026 (H6, die schwächste Bedien-Note); UEBERGABE Abschnitt 1, Schritt 1 („Eine Vorschau statt siebzehn Warnungen“).
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
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const zone = () => ((w.document.getElementById('cyc-save-zone') || {}).textContent || '').replace(/\s+/g, ' ');
  // Zyklus in der Blüte, jeder Guss bis gestern eingetragen (sonst meldet schon der Ausgangsstand „verpasst“)
  const neu = (beginner) => E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true; S.beginnerMode = ${beginner};
    const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -60), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
      plantCount: 2, startMethod: 'saturated' }, { still: true }); S.cycles = [c];
    for (let d = 0; d < 60; d++) { const iso = isoPlus(c.startDate, d); if (isGiessTag(iso, c)) { S.entries[iso] = { cycleData: {} }; S.entries[iso].cycleData[c.id] = { water: 1500 }; } }
    selId = c.id; draft = {}; draftTouched = {}; goTo('set'); renderSet(); return c.id; })()`);

  for (const beginner of [true, false]) {
    const modus = beginner ? 'Einsteiger' : 'Profi';
    // 1. Blüte kürzer: Ernte rückt vor
    neu(beginner);
    pruefe(/Alle Änderungen gespeichert/.test(zone()), `${modus}: ohne Änderung „Alle Änderungen gespeichert“`);
    E(`dd('bloomDays', Number(S.cycles[0].bloomDays) - 7)`);
    pruefe(/Mit dem Sichern ändert sich/.test(zone()) && /Ernte:/.test(zone()), `${modus}: Blüte −7 → „Ernte: … → …“ — ${zone().slice(0, 160)}`);
    // 2. Substrat Coco: andere Gießtage
    neu(beginner); E(`setCycleMedium('coco')`);
    pruefe(/Gießtage in den nächsten 14 Tagen/.test(zone()), `${modus}: Coco → Gießtage in 14 Tagen — ${zone().slice(0, 160)}`);
    // 3. Pflanzen 2 → 4: Menge am nächsten Gießtag (nur wenn die App nach Pflanzen skaliert)
    neu(beginner); E(`S.cycles[0].scaleByPlants = true; draft.scaleByPlants = true; dd('plantCount', 4)`);
    pruefe(/Menge am nächsten Gießtag/.test(zone()), `${modus}: 4 statt 2 Pflanzen → Menge — ${zone().slice(0, 160)}`);
  }
  // 4. Blüte deutlich kürzer: Gießtage der letzten Woche fallen weg bzw. rutschen — Hinweis „verpasst“
  neu(false);
  const vorher = E('getCatchupCandidates(S.cycles[0]).length');
  E(`dd('bloomDays', 20)`);
  pruefe(vorher === 0, 'Prüflage: vorher nichts verpasst (' + vorher + ')');
  // (nicht jede Kürzung erzeugt verpasste Tage — geprüft wird nur: wenn der Entwurf welche erzeugt, steht es da)
  const entwurfVerpasst = E(`(function(){ const neu = Object.assign({}, S.cycles[0], { bloomDays: 20 }); return getCatchupCandidates(neu).length; })()`);
  pruefe(entwurfVerpasst === 0 || /als verpasst/.test(zone()), `Verpasst im Entwurf (${entwurfVerpasst}) wird genannt — ${zone().slice(0, 200)}`);
  // 5. Nach dem Sichern: kein Wirkungsblock mehr
  E('saveDraft()'); await warte(60); E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(80);
  E('renderSet()');
  pruefe(/Alle Änderungen gespeichert/.test(zone()) && !w.document.getElementById('cyc-wirkung'), 'Nach dem Sichern: kein Wirkungsblock');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
