// (v1.5.517) Echter Mehltau und Septoria stimmen mit ANBAU.md überein.
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
    ['Mehltau: Milch-Wasser-Spray', /Milch-Wasser-Spray \(1:10\)/],
    ['Mehltau: Milchsäure-Spray', /Milchsäure-Spray \(1 Teil Milch/],
    ['Mehltau: „tötet Pilz“', /tötet Pilz/],
    ['Mehltau: Bacillus als systemischer Schutz', /Bacillus subtilis \(z\.B\. Serenade\) als systemischen Schutz/],
    ['Mehltau: Bacillus in der frühen Blüte', /Nur noch Bacillus subtilis \(lebende Bakterien\)/],
    ['Mehltau: RLF aggressiv senken', /RLF aggressiv senken, Lüfter maximieren/],
    ['Septoria: Bacillus auch in früher Blüte', /biologisches Fungizid, kann auch in früher Blüte/],
  ]);
  const pm = lauf[1].filter((p) => p.lexiconKey === 'powdery_mildew');
  pruefe(pm.length === 1, 'Diagnose Echter Mehltau genau einmal (' + pm.length + ')');
  if (pm.length === 1) {
    const a = pm[0].action;
    pruefe(/Luftbewegung stark erhöhen; in der Blüte die Luftfeuchte unter dem Deckel halten/.test(a) && a.includes(dM + ' % in früher und mittlerer, ' + dS + ' % in später Blüte') && /In der Blüte nichts auf die Blüten sprühen/.test(a) && !/Milch|Bacillus/.test(a), 'Mehltau: Handgriffe, Deckel nur für die Blüte, kein Milch-Spray');
    pruefe(/Vor der Blüte ist ein Sprühmittel möglich, seine Wirkung ist für Cannabis nicht gemessen\.$/.test(a) && !/belegt wäre/.test(a), 'Mehltau: Schlusssatz ohne schiefen Bezug');
  }
  const lm = lauf[0].flatMap((k) => (k.items || [])).filter((i) => /Mehltau/.test(i.t || ''));
  const lmT = lm.map(txt).join(' ');
  pruefe(lm.length >= 1 && /Vor der Blüte sind Sprühmittel möglich \(Kaliumbicarbonat, Bacillus subtilis, Neem-Öl, Schwefel\); eine Wirkung gegen Mehltau ist für Cannabis nicht gemessen/.test(lmT), 'Lexikon Mehltau: Veg-Zeile ohne Wirkungsversprechen');
  pruefe(new RegExp('In der Blüte nichts auf die Blüten sprühen \\(Nässe fördert Schimmel.*Luftfeuchte unter dem Deckel halten \\(' + E('KLIMA_ZIEL.frueh.deckel') + ' % in früher Blüte\\)').test(lmT) && new RegExp('Luftfeuchte unter dem Deckel halten \\(' + dS + ' %\\), Luftbewegung erhöhen').test(lmT), 'Lexikon Mehltau: frühe und späte Blüte ohne Sprühen, Deckel aus KLIMA_ZIEL');
  const sept = lauf[0].flatMap((k) => (k.items || [])).filter((i) => /Septoria/.test(i.t || '')).map(txt).join(' ');
  pruefe(/Bacillus subtilis wird als biologisches Fungizid angeboten; eine Wirkung ist für Cannabis nicht gemessen\. In der Blüte nichts auf die Blüten sprühen/.test(sept), 'Lexikon Septoria: Bacillus ohne Wirkungsbehauptung, Blüte nicht besprühen');

  pruefe(errors.length === 0, 'Keine jsdom-Fehler (' + errors.slice(0, 2).join(' | ') + ')');
  console.log(n - fehler.length + ' von ' + n + ' Prüfungen grün');
  if (fehler.length) { fehler.forEach((f) => console.log('  FEHLT: ' + f)); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
