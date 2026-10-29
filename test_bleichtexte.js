// (v1.5.445) Foto-Bleaching: ein Handgriff statt vier Zahlen, „Lampe NICHT näher“, kein „bis Ernte“. (v1.5.446) Dazu die Karte „Ganzes Blatt blass“.
//
// Für denselben Handgriff nannte die App vier Fassungen: „LED um 15–20 cm anheben oder Dimmer auf 60–70% bis Ernte“
// (Diagnose), „Lampe SOFORT höher hängen (mind. 20 cm), oder Dimmer auf 60–70% reduzieren bis zur Ernte“ (Schnellhilfe),
// „LED um 10–15 cm anheben, oder Dimmer auf 70%“ (Schnellhilfe Flecken), „Lampe sofort 10-15 cm höher … dimmen (-20 %)“
// (Lexikon). Feste Zentimeter und Prozent hat ANBAU.md nirgends; 8.2 sagt nur „Leistung reduzieren oder Abstand vergrößern“,
// und nach 8.1 steigt der Bestandsertrag mit dem Licht — „bis Ernte“ gedimmt kostet Ertrag ohne Beleg. „Trichome trüb-braun:
// lieber jetzt ernten“ vermischte milchig und bernstein (11). Diagnose-Prüfung vom 08.10.2026, Befund B08.
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

  const pb = JSON.parse(E(`JSON.stringify(PROBLEMS.find(p => p.id === 'photo_bleaching'))`));
  const akt = pb.action || '', bild = pb.description || '';
  pruefe(/NICHT näher/.test(akt), 'Diagnose: „Lampe NICHT näher“');
  pruefe(/immer nur einen Schritt/.test(akt), 'Diagnose: schrittweise statt fester Zahl');
  pruefe(!/60–70|15–20 cm|bis Ernte/.test(akt), 'Diagnose: keine „60–70 %“, „15–20 cm“, „bis Ernte“');
  pruefe(!/trüb-braun|lieber jetzt ernten/.test(akt), 'Diagnose: kein „Trichome trüb-braun: lieber jetzt ernten“');
  pruefe(/Trichome/.test(akt) && /zu früh/.test(akt), 'Diagnose: Ernte entscheiden die Trichome');
  pruefe(akt.includes(String(E('LICHT_ZIEL.bluete.bleichAb'))) && akt.includes(E("LICHT_ZIEL.bluete.ppfd.join('–')")), 'Diagnose: Zahlen aus LICHT_ZIEL');
  pruefe(!/Trichome werden ausgebleicht/.test(bild) && /weiß/.test(bild), 'Diagnose-Bild: weiß, ohne „Trichome werden ausgebleicht“');
  pruefe(!pb.context || !('daysToHarvestLow' in pb.context), 'Diagnose: wirkungsloses daysToHarvestLow: false entfernt');

  // Wächter über Diagnose, Schnellhilfe und Lexikon: Wo vom Bleichen die Rede ist, keine festen Zentimeter- oder Dimmer-Zahlen.
  const texte = JSON.parse(E(`JSON.stringify([].concat(
    PROBLEMS.map(p => ({ wo: 'PROBLEMS ' + p.id, t: (p.description || '') + ' ' + (p.action || '') })),
    SYMPTOMS.flatMap(s => (s.causes || []).map(c => ({ wo: 'SYMPTOMS ' + (s.id || s.title) + ' / ' + c.heading, t: (c.verdict || '') + ' ' + (c.text || '') }))),
    (Array.isArray(LEXIKON) ? LEXIKON : Object.values(LEXIKON)).flatMap(k => (k.items || []).map(it => ({ wo: 'LEXIKON ' + it.t, t: [it.brief, it.mechanism, it.practice, it.pitfall].filter(Boolean).join(' ') })))
  ))`));
  const bleich = texte.filter((x) => /bleich|Bleaching|Photoinhibition|Phototoxizität/i.test(x.t + x.wo));
  pruefe(bleich.length >= 4, `Wächter: genug Bleich-Texte gefunden (${bleich.length})`);
  const fest = bleich.filter((x) => /\d+\s*[–-]\s*\d+\s*cm (höher|anheben)|um \d+\s*[–-]\s*\d+\s*cm|Dimmer auf \d|dimmen \(-?\d|mind\. \d+ cm/.test(x.t));
  pruefe(fest.length === 0, 'Wächter: feste cm/Dimmer-Zahlen beim Bleichen — ' + fest.map((x) => x.wo).join(' · '));
  // Lexikon Lichtbrand: weiß ist Bleichen, gelb bis braun ist Hitze (ANBAU.md 8.2)
  const lb = texte.find((x) => /Lichtbrand \(Phototoxizität\)/.test(x.wo));
  pruefe(lb && !/bleichen aus \(weiß\/gelb\)/.test(lb.t), 'Lexikon Lichtbrand: nicht „weiß/gelb“ als ein Bild');

  // (v1.5.446) Schnellhilfe „Obere Buds verlieren Farbe“, Ursache 3: kein „CalMag + Schwefel über Blattdünger“; erst oben oder
  // unten (ANBAU.md 6.1), Magnesium in der Reihenfolge der Diagnose (6.2), Coco als Ausnahme (7.1), Licht als dritte Ursache.
  const k3 = JSON.parse(E(`JSON.stringify(SYMPTOMS.flatMap(s => s.causes || []).find(c => /Ganzes Blatt/.test(c.heading)) || null)`));
  const k3t = (k3 && k3.text) || '';
  pruefe(!!k3 && !/CalMag \+ Schwefel|Blattdünger/.test(k3t), 'Blass-Karte: kein „CalMag + Schwefel über Blattdünger“');
  pruefe(/oben oder unten/.test(k3t), 'Blass-Karte: Erstfrage oben oder unten');
  // „pH prüfen“ steht schon beim Eisen weiter vorn — gesucht wird die Magnesium-Reihenfolge ab dem Booster.
  const iB = k3t.indexOf('Booster'), iP = k3t.indexOf('pH', iB), iS = k3t.indexOf('Bittersalz');
  pruefe(iB >= 0 && iB < iP && iP < iS, 'Blass-Karte: Booster → pH → Bittersalz wie die Diagnose');
  pruefe(/ungepuffertem Coco/.test(k3t) && /fehlt eher Licht/.test(k3t), 'Blass-Karte: Coco-Ausnahme und Licht als Ursache');

  // (v1.5.447) Magnesium überall in derselben Reihenfolge: Booster aussetzen → pH prüfen → Bittersalz (ANBAU.md 6.2). Die Karte
  // „Adern grün, dazwischen gelb“ und das Lexikon „Magnesium“ nannten zuerst den pH, Diagnose und die übrigen Karten den Booster.
  const mgKarte = JSON.parse(E(`JSON.stringify(SYMPTOMS.flatMap(s => s.causes || []).find(c => /Untere\\/mittlere Blätter, Adern scharf grün/.test(c.heading)) || null)`));
  const mgT = (mgKarte && mgKarte.text) || '';
  pruefe(/<b>1\.<\/b> Läuft ein Kalium-Booster/.test(mgT), 'Karte „Adern grün“: Schritt 1 ist der Booster');
  const mgLex = texte.find((x) => /^LEXIKON Magnesium/.test(x.wo));
  pruefe(mgLex && /Erst den Booster aussetzen, dann den pH prüfen/.test(mgLex.t), 'Lexikon Magnesium: Booster vor pH');
  const mgTexte = texte.filter((x) => /Bittersalz/.test(x.t) && /Booster/.test(x.t) && /pH/.test(x.t));
  const verkehrt = mgTexte.filter((x) => { const b = x.t.indexOf('Booster'); return /Erst pH prüfen|1\.<\/b> pH prüfen/.test(x.t.slice(0, b)); });
  pruefe(mgTexte.length >= 3 && verkehrt.length === 0, `Magnesium-Reihenfolge in ${mgTexte.length} Texten — verkehrt: ${verkehrt.map((x) => x.wo).join(' · ')}`);

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
