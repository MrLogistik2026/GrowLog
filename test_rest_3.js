// (v1.5.514) Mykorrhiza, Bacillus, PK-Booster stimmen mit ANBAU.md überein.
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
    ['Mykorrhiza: schützen vor Pathogenen', /schützen vor Pathogenen, machen Nährstoffe verfügbar/],
    ['Mykorrhiza: Schutz vor Pythium', /Schutz vor Pythium und anderen Wurzelfäule-Erregern/],
    ['Mykorrhiza: Trockenstress-Resistenz', /Trockenstress-Resistenz/],
    ['Mykorrhiza: Hyphen erreichen Wasser tiefer', /Pilz-Hyphen erreichen Wasser tiefer/],
    ['Mykorrhiza: macht robuster', /Symbiose macht robuster/],
    ['Mykorrhiza: verhindert Pythium', /verhindert dass Pythium dominant wird/],
    ['Mykorrhiza: Umtopf-Schock', /beschleunigt Wurzel-Etablierung und reduziert Schock/],
    ['Mykorrhiza: halten Erreger klein', /halten Krankheitserreger klein/],
    ['Bacillus-Blatt-Spray „wirksam“', /als Blatt-Spray gegen Mehltau wirksam/],
    ['Bacillus: fördern Wachstum und hemmen Pathogene', /welche das Pflanzenwachstum fördern und gleichzeitig Pathogene hemmen/],
    ['PK-Booster „Sehr wirksam“', /Sehr wirksam — und der Zusatz/],
    ['PK-Booster: P und K blockieren', /zu viel P und K die Aufnahme/],
  ]);
  const my = eintrag('Mykorrhiza & Bodenmikroben');
  pruefe(my.length === 1, 'Lexikon Mykorrhiza genau einmal (' + my.length + ')');
  if (my.length === 1) {
    const t = txt(my[0]);
    pruefe(/Können die Aufnahme-Fläche der Wurzel vergrößern; ein Nutzen für Cannabis ist für diese App nicht gemessen/.test(t) && !/Pathogene hemmen/.test(my[0].brief || ''), 'Mykorrhiza brief: ohne Wirkungszusage, ohne „nicht belegt“-Kürzel');
    pruefe(/ob die Symbiose dagegen hilft, ist für Cannabis nicht gemessen/.test(t) && /Pythium wird durch Dauernässe begünstigt; ein Schutz durch Mikroben ist für Cannabis nicht gemessen und ersetzt den Nass-Trocken-Zyklus nicht/.test(t) && /ob Mykorrhiza dagegen hilft, ist für Cannabis nicht gemessen; gegossen wird weiter am Gießpunkt/.test(t), 'Mykorrhiza: Outdoor, Sämling, Trockenstress abgeschwächt');
    pruefe(/Bacillus subtilis wird auch als Blatt-Spray gegen Mehltau angeboten, auch dort ist eine Wirkung für Cannabis nicht gemessen\. In der Blüte nichts auf die Blüten sprühen/.test(t), 'Bacillus-Abschnitt: Spray ohne Wirkungsbehauptung, Blüte nicht besprühen');
  }
  pruefe(JSON.stringify(lauf[0]).includes('sind Mikroorganismen-Produkte: ein Schutz vor Pythium ist für Cannabis nicht gemessen; vorbeugen heißt Nass-Trocken-Zyklus'), 'Lexikon Pythium: Mikroben ohne Schutzzusage');
  const pk = eintrag('PK-Booster (MKP, PK 13/14)');
  pruefe(pk.length === 1, 'Lexikon PK-Booster genau einmal (' + pk.length + ')');
  if (pk.length === 1) {
    const t = txt(pk[0]);
    pruefe(/Ein Nutzen für größere oder schwerere Blüten ist für Cannabis nicht gemessen\. Eine Überdosis verbrennt/.test(pk[0].brief) && !/häufigsten/.test(t), 'PK-Booster: keine Wirkungszusage, kein „am häufigsten“');
    pruefe(/Magnesium-Versorgung bisher stabil war/.test(t) && /zu viel Kalium die Aufnahme von Magnesium und Calcium verdrängt/.test(t), 'PK-Booster: K/Mg-Regel');
  }

  pruefe(errors.length === 0, 'Keine jsdom-Fehler (' + errors.slice(0, 2).join(' | ') + ')');
  console.log(n - fehler.length + ' von ' + n + ' Prüfungen grün');
  if (fehler.length) { fehler.forEach((f) => console.log('  FEHLT: ' + f)); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
