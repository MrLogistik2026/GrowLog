// (v1.5.515) Sprühmittel nur vor der Blüte stimmen mit ANBAU.md überein.
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
    ['Spinnmilben: Neem ohne Phase (Diagnose)', /Neem-Öl oder Schwefel-Spray alle 3 Tage\. Pflanze isolieren/],
    ['Spinnmilben: Neemöl ohne Phase (Schnellhilfe)', /Pflanze mit Neemöl besprühen \(Blattunterseite!\)\. Bei starkem/],
    ['Schädlinge: Neemöl ohne Phase (FAQ)', /Bei Befall: Neemöl spritzen und Pflanze isolieren/],
    ['Thripse: Neem ohne Phase', /Gelbtafeln für Monitoring, Neem-Öl oder Bacillus/],
    ['Blattläuse: Neem ohne Phase', /Kali-Seife oder Neem\. Bei starkem/],
    ['Blattläuse: Kaliseife in der Blüte', /In Blüte: Kaliseife/],
    ['Thripse: „Nur Blätter behandeln“ in der Blüte', /Nur Blätter behandeln oder auf Raubinsekten/],
  ]);
  const mil = lauf[1].filter((p) => p.lexiconKey === 'spider_mites');
  pruefe(mil.length === 1 && /Vor der Blüte: Neem-Öl oder Schwefel-Spray alle 3 Tage; in der Blüte nichts auf die Blüten sprühen/.test(mil[0].action) && mil[0].action.includes(dM + ' % in früher und mittlerer, ' + dS + ' % in später Blüte'), 'Diagnose Spinnmilben: Phasengrenze, Deckel bleibt');
  const thr = lauf[1].filter((p) => p.lexiconKey === 'thrips');
  pruefe(thr.length === 1 && /Sprühmittel \(Neem-Öl oder Bacillus thuringiensis\) nur vor der Blüte/.test(thr[0].action), 'Diagnose Thripse: alle Sprühmittel nur vor der Blüte');
  const la = lauf[1].filter((p) => /aphid|blattl/i.test((p.lexiconKey || '') + ' ' + (p.id || '') + ' ' + (p.name || '')));
  pruefe(la.length === 1 && /Vor der Blüte: Abspritzen mit Wasser, dann Kali-Seife oder Neem\. In der Blüte nichts auf die Blüten sprühen, befallene Triebspitzen entfernen/.test(la[0].action), 'Diagnose Blattläuse: Abspritzen und Mittel nur vor der Blüte');
  pruefe(/Vor der Blüte die Pflanze mit Neemöl besprühen \(Blattunterseite!\); in der Blüte nichts auf die Blüten sprühen/.test(JSON.stringify(lauf[2]).replace(/\\"/g, '"')), 'Schnellhilfe Spinnmilben: Phasengrenze');
  pruefe(/Bei Befall: Pflanze isolieren; vor der Blüte Neemöl spritzen, in der Blüte nichts auf die Blüten sprühen/.test(JSON.stringify(lauf[3])), 'FAQ Schädlinge: Phasengrenze');
  const lexBlatt = lauf[0].flatMap((k) => (k.items || [])).filter((i) => /Blattl/.test(i.t || '')).map(txt).join(' ');
  pruefe(/In der Blüte nichts auf die Blüten sprühen: befallene Triebspitzen mechanisch entfernen, ohne Wasser/.test(lexBlatt) && /Kaliseife-Lösung \(2%\) auf Blattunterseiten sprühen — nur vor der Blüte/.test(lexBlatt) && !/tötet durch Austrocknung/.test(lexBlatt), 'Lexikon Blattläuse: Blüte nicht besprühen, Kaliseife nur davor');
  const lexThr = lauf[0].flatMap((k) => (k.items || [])).filter((i) => /^Thripse/.test(i.t || '')).map(txt).join(' ');
  pruefe(/In der Blüte nichts auf die Blüten sprühen: befallene Teile entfernen oder auf Raubinsekten umsteigen/.test(lexThr), 'Lexikon Thripse: Blüte nicht besprühen');
  const lexMilbe = lauf[0].flatMap((k) => (k.items || [])).filter((i) => /Spinnmilben/.test(i.t || '')).map(txt).join(' ');
  pruefe(/NUR in Veg/.test(lexMilbe), 'Lexikon Spinnmilben nennt weiter die Phasengrenze (NUR in Veg)');

  pruefe(errors.length === 0, 'Keine jsdom-Fehler (' + errors.slice(0, 2).join(' | ') + ')');
  console.log(n - fehler.length + ' von ' + n + ' Prüfungen grün');
  if (fehler.length) { fehler.forEach((f) => console.log('  FEHLT: ' + f)); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
