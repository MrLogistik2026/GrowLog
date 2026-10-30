// (v1.5.516) Botrytis: Zielkonflikt, Luftfeuchte aus dem Deckel stimmen mit ANBAU.md überein.
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
    ['Botrytis: 1 Woche zu früh ernten', /Lieber 1 Woche zu früh ernten/],
    ['Botrytis: früh ernten ist besser', /früh ernten<\/b> ist besser als alles verlieren/],
    ['Botrytis: Diagnose „früh ernten“ ohne Bedingung', /Bei starkem Befall: früh ernten\./],
    ['Botrytis: Schnellhilfe „lieber früher ernten“', /lieber etwas früher ernten als alles verlieren/],
    ['Botrytis: feste Luftfeuchte < 50 %', /Luftfeuchte auf < 50 %/],
  ]);
  const bo = lauf[1].filter((p) => /botrytis|bud_rot|bud rot/i.test((p.lexiconKey || '') + ' ' + (p.name || '') + ' ' + (p.id || '')));
  pruefe(bo.length >= 1 && bo.every((p) => /Notmaßnahme/.test(p.action) && /Trichom-Reife/.test(p.action)), 'Diagnose Botrytis: früh ernten nur als Notmaßnahme (' + bo.length + ' Eintrag)');
  pruefe(bo.length >= 1 && bo.every((p) => p.action.includes('Luftfeuchte unter den Deckel deiner Phase bringen (' + dM + ' % in früher und mittlerer, ' + dS + ' % in später Blüte)')), 'Diagnose Botrytis: Luftfeuchte aus dem Deckel (KLIMA_ZIEL), nicht fest');
  const boLex = lauf[0].flatMap((k) => (k.items || [])).filter((i) => /Botrytis|Bud.?Rot/i.test(i.t || ''));
  pruefe(boLex.length >= 1 && boLex.some((i) => /Zielkonflikt/.test(txt(i)) && /Ohne weiteren Befall gilt die Trichom-Reife/.test(txt(i))) && boLex.some((i) => /Notmaßnahme — sonst gilt die Trichom-Reife/.test(txt(i))), 'Lexikon Botrytis: Zielkonflikt ausgesprochen');
  pruefe(/Breitet sich der Befall trotzdem weiter aus, ist früher ernten die Notmaßnahme — sonst gilt die Trichom-Reife/.test(JSON.stringify(lauf[2]).replace(/\\"/g, '"')), 'Schnellhilfe Botrytis: Notmaßnahme');

  pruefe(errors.length === 0, 'Keine jsdom-Fehler (' + errors.slice(0, 2).join(' | ') + ')');
  console.log(n - fehler.length + ' von ' + n + ' Prüfungen grün');
  if (fehler.length) { fehler.forEach((f) => console.log('  FEHLT: ' + f)); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
