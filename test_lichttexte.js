// Licht, Wärme, Wasser: Texte gegen ANBAU.md, nach der Prüfrunde vom 08.10.2026.
//
//   H (v1.5.420)  Kein Handtest als Lichtgrenze — die Hand spürt nur Wärme, nicht die Lichtmenge (ANBAU.md 8.2).
//   B (v1.5.421)  Bleich-Schwelle aus LICHT_ZIEL.bluete.bleichAb, nicht „~1200“ oder „W/m²“.
//   W (v1.5.422)  Wasserhärte: Karbonathärte (Puffer) und Gesamthärte (Ca/Mg) getrennt; „abstehen, Kalk fällt aus“ nicht als Rat (ANBAU.md 3).
//   K (v1.5.423)  Keimungs-Leitfaden Tag 4 ohne feste Lampenhöhe.
//   Z (v1.5.424)  Wurzelzone draußen: Thermometer statt Hand, Zahlen aus ANBAU.md 7.3.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

async function starte() {
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
  return { w, errors, E: (s) => w.eval(s) };
}

(async () => {
  const fehler = [];
  let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const a = await starte();
  // Alle Texte aus PROBLEMS, SYMPTOMS, LEXIKON, FAQ und INFO_TERMS, so wie die App sie anzeigt
  const T = JSON.parse(a.E(`(function(){ const out = []; const lauf = (x, p) => { if (typeof x === 'string') out.push([p, x]);
    else if (x && typeof x === 'object') for (const k of Object.keys(x)) lauf(x[k], p + '.' + k); };
    for (const n of ['PROBLEMS', 'SYMPTOMS', 'LEXIKON', 'FAQ', 'INFO_TERMS']) { try { lauf(eval(n), n); } catch (e) {} }
    return JSON.stringify(out); })()`));
  const finde = (re) => T.filter(([, s]) => re.test(s));
  const lex = (titel) => JSON.parse(a.E(`JSON.stringify(LEXIKON.flatMap(k => k.items || []).find(x => x.t === ${JSON.stringify(titel)}) || null)`));

  // H (v1.5.420) · Handtest
  {
    // Erlaubt bleibt die Abgrenzung in „Dein erster Grow“, Schritt 4 („Der Handtest zeigt nur Hitze“) — die steht nicht in diesen Listen.
    const hand = finde(/Handtest|Hand (flach|auf|in Höhe|10 Sek)|zu heiß für dich|= Abstand passt|passt der Abstand/i).filter(([, s]) => !/Handtest zeigt nur Hitze/.test(s));
    pruefe(hand.length === 0, `H1 ${hand.length} Texte empfehlen noch die Hand als Prüfung: ` + hand.slice(0, 3).map(([p, s]) => p + ' „' + (s.match(/.{0,40}(Handtest|Hand (flach|auf|in Höhe|10 Sek)|zu heiß für dich|= Abstand passt|passt der Abstand).{0,30}/i) || [''])[0] + '“').join(' | '));
    const P = JSON.parse(a.E(`JSON.stringify(Object.fromEntries(PROBLEMS.filter(p => ['light_burn','light_deficiency'].includes(p.id)).map(p => [p.id, p.action])))`));
    pruefe(/weiß/.test(P.light_deficiency || '') && /gelbbraun/.test(P.light_deficiency || ''), 'H2 „mehr Licht“ ohne beide Stoppzeichen (weiß = Licht, gelbbraun = Wärme): ' + (P.light_deficiency || '').slice(0, 160));
    pruefe(/Lufttemperatur/.test(P.light_burn || '') && /°C in der Blüte/.test(P.light_burn || ''), 'H3 Lichtbrand nennt kein Temperaturziel: ' + (P.light_burn || '').slice(0, 160));
    const abstand = lex('Lichtabstand');
    pruefe(abstand && !/\d+ W: ~\d+ cm/.test(abstand.practice) && /Lichtmenge am Blatt/.test(abstand.practice), 'H4 Lexikon „Lichtabstand“ mit Wattage-Tabelle oder ohne Lichtmenge am Blatt');
    pruefe(finde(/Lampen-Höhe anhand Wattage/).length === 0, 'H5 Verweis auf die entfallene Wattage-Tabelle steht noch');
    pruefe(finde(/unter 28–30 °C/).length === 0, 'H6 „Temperatur unter 28–30 °C“ steht noch (Ziel ist das der Phase)');
  }

  // B (v1.5.421) · Bleich-Schwelle
  {
    const b = finde(/~1200|W\/m²/);
    pruefe(b.length === 0, `B1 ${b.length} Texte mit „~1200“ oder „W/m²“: ` + b.map(([p]) => p).slice(0, 4).join(', '));
    const pb = a.E(`(PROBLEMS.find(p => p.id === 'photo_bleaching') || {}).description || ''`);
    pruefe(pb.includes(String(a.E('LICHT_ZIEL.bluete.bleichAb'))), 'B2 Photobleaching nennt die Schwelle aus LICHT_ZIEL nicht: ' + pb.slice(-120));
    pruefe(finde(/600-900 PPFD in Blüte, nicht mehr/).length === 0, 'B3 „600–900, nicht mehr“ steht noch (darüber ist kein Schaden, ANBAU.md 8.1)');
  }

  // W (v1.5.422) · Wasserhärte
  {
    const h = lex('Wasser-Härte & Umkehrosmose');
    const alles = h ? [h.brief, h.mechanism, h.practice, h.pitfall].join(' ') : '';
    pruefe(/Karbonathärte/.test(alles) && /Gesamthärte/.test(alles), 'W1 Eintrag trennt Karbonathärte und Gesamthärte nicht');
    pruefe(!/abstehen lassen \(Kalk fällt/.test(alles) && /nicht belegt/.test(alles), 'W2 „abstehen lassen, Kalk fällt aus“ als Rat oder ohne „nicht belegt“');
    pruefe(!/CalMag-Mangel fast garantiert/.test(alles) && !/300-600 €/.test(alles), 'W3 „CalMag-Mangel fast garantiert“ oder Preisangabe steht noch');
    pruefe(/Bei jedem Wasser/.test(h ? h.practice : '') && /ungepuffertes Coco/.test(h ? h.practice : ''), 'W4 Eigen-EC nicht für jedes Wasser oder Coco-Ausnahme fehlt');
    const faq = a.E(`(FAQ.find(f => f.q === 'Ist mein Wasser zu hart?') || {}).a || ''`);
    pruefe(/Karbonathärte/.test(faq) && !/auf 6\.4 korrigieren/.test(faq) && faq.includes(a.E(`phTargetFor('coco').labelComma`)), 'W5 FAQ „Ist mein Wasser zu hart?“: ' + faq.slice(0, 140));
  }

  // K (v1.5.423) · Keimung Tag 4
  pruefe(!/Licht an, gedimmt, 30–40 cm Abstand/.test(HTML), 'K1 Keimungs-Leitfaden Tag 4 nennt noch fest 30–40 cm');

  // Z (v1.5.424) · Wurzelzone draußen
  {
    const wz = lex('Wurzelzone Outdoor (Topf-Hitze)');
    const alles = wz ? [wz.brief, wz.mechanism, wz.practice].join(' ') : '';
    pruefe(!/31 °C|bis zu 95 %|Hand auf die Außenseite/.test(alles) && /Thermometer/.test(alles) && /26 °C/.test(alles), 'Z1 Wurzelzone: alte Zahlen oder Hand statt Thermometer');
  }

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_lichttexte: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_lichttexte: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_lichttexte abgebrochen:', (e && e.stack) || e); process.exit(1); });
