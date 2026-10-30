// (v1.5.512) EC-Warnung und Lockout/Flushen stimmen mit ANBAU.md überein.
// Wächter über den ganzen ausgelieferten Quelltext (ohne Kommentarzeilen) und die Laufzeit-Daten. GS_INDEX=<anderer Build> lässt
// den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const INDEX = process.env.GS_INDEX || path.join(__dirname, 'index.html');
const HTML = fs.readFileSync(INDEX, 'utf8');

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
  const plain = (t) => String(t || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const skript = HTML.split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n');
  const lauf = JSON.parse(E('JSON.stringify([LEXIKON, PROBLEMS, SYMPTOMS, FAQ, HOWTO, INFO_TERMS])'));
  const laufText = JSON.stringify(lauf).replace(/\\"/g, '"');
  const waechter = (liste) => {
    const t1 = liste.filter(([, re]) => re.test(skript)).map(([name]) => name);
    pruefe(t1.length === 0, 'Quelltext enthält keine verbotene Form (gefunden: ' + t1.join('; ') + ')');
    const t2 = liste.filter(([, re]) => re.test(laufText)).map(([name]) => name);
    pruefe(t2.length === 0, 'Laufzeit-Daten enthalten keine verbotene Form (gefunden: ' + t2.join('; ') + ')');
  };
  const eintrag = (t) => { const hits = []; for (const k of lauf[0]) for (const i of (k.items || [])) if (i.t === t) hits.push(i); return hits; };
  const txt = (i) => plain([i.brief, i.mechanism, i.practice, i.pitfall].join(' '));
  const ZIEL = E('DRAIN_ZIEL.min + "–" + DRAIN_ZIEL.max');
  const dM = E('KLIMA_ZIEL.mittel.deckel'), dS = E('KLIMA_ZIEL.spaet.deckel');

  waechter([
    ['Ertragsverlust durch Zwischenspülung', /in der Blüte kostet sie Ertrag/],
    ['Lockout-Zeile: pH korrigieren und spülen', /pH korrigieren, mit pH-eingestelltem Wasser spülen, 2 Tage warten/],
    ['Flushen: „Lockout löst sich“ ohne Bedingung', /Der Drain-EC sinkt, der Lockout löst sich/],
    ['Flushen: Auslöser nur das Symptom', /Bei Überdüngung \(Blattspitzen verbrennen\)/],
  ]);
  // ecWarningHigh: kein Ertragsverlust, Handlung bleibt, Hinweis zum Nachliefern nur für Erde
  const ec = plain(E('T.runoff.ecWarningHigh({ inputEc: 0.4, runoffEc: 1.2, verhaeltnis: 3 })'));
  pruefe(!/Ertrag/.test(ec) && /mehr Volumen mit der normalen Nährlösung/.test(ec), 'ecWarningHigh: kein Ertragsverlust, Handlung bleibt');
  pruefe(/In Erde kann der Drain-EC danach wieder ansteigen, weil das Substrat nachliefert; das ist dann nicht automatisch neue Überdüngung/.test(ec) && !/gemessen wird erst wieder/.test(ec), 'ecWarningHigh: Nachliefern nur für Erde, ohne Kürzel-Satz');
  // Lockout-Zeile
  const lockout = JSON.stringify(lauf[0]).replace(/\\"/g, '"');
  pruefe(/Bei Lockout-Verdacht<\/b><\/td><td[^>]*>Zuerst den Zulauf-pH auf das Ziel deines Substrats bringen[^<]*Den Kalkpuffer von Erde spült man nicht heraus\. Nur bei gemessen zu hohem Drain-EC \(Versalzung, gültige Messung ab /.test(lockout), 'Lockout-Zeile: erst pH, Kalkpuffer, Spülen nur bei gemessener Versalzung');
  pruefe(lockout.includes('gültige Messung ab ' + E('DRAIN_ZIEL.min') + ' % Drain') && lockout.includes('bis ' + ZIEL + ' % ablaufen), danach halbe Dosis Dünger') && !/Gegen einen pH-Lockout hilft Spülen nicht/.test(lockout), 'Lockout-Zeile: Zahlen aus DRAIN_ZIEL, keine Tatsachenbehauptung „hilft nicht“');
  // Flushen
  const fl = eintrag('Flushen (Zwischenguss)');
  pruefe(fl.length === 1, 'Lexikon „Flushen“ genau einmal (' + fl.length + ')');
  if (fl.length === 1) {
    const t = txt(fl[0]);
    pruefe(/Ein Lockout durch Versalzung kann sich so lösen\. Ein erhöhter Drain-pH in gekalkter Erde ist dagegen normal \(Kalkpuffer\) und lässt sich nicht herausspülen/.test(t), 'Flushen: Lockout nur bei Versalzung, Drain-pH in Erde normal');
    pruefe(/Der Drain-EC kann dabei sinken, in Erde kann er danach wieder ansteigen/.test(t) && !/steigt er danach oft wieder/.test(t), 'Flushen: Drain-EC „kann“ statt „oft“');
    pruefe(/Bei Überdüngung, wenn eine gültige Drain-EC-Messung sie bestätigt/.test(t) && /sehen auch bei Wassermangel so aus/.test(t), 'Flushen: Überdüngung mit Drain-EC als Bestätigung');
    pruefe(!/ANBAU/.test(t), 'Flushen: kein Verweis auf die interne Fachdatei im Text');
  }

  pruefe(errors.length === 0, 'Keine jsdom-Fehler (' + errors.slice(0, 2).join(' | ') + ')');
  console.log(n - fehler.length + ' von ' + n + ' Prüfungen grün');
  if (fehler.length) { fehler.forEach((f) => console.log('  FEHLT: ' + f)); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
