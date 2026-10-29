// (v1.5.442) Die Maßnahmen bei hängenden Blättern beginnen mit der Gegenprobe am Topf.
//
// Bei „hängend“ stehen Überwässerung („GIESSEN STOPPEN“) und Wassermangel („Sofort gießen“) gleichauf in derselben Liste,
// beide ohne Bedingung — wer der oberen Karte folgte, tat bei der Hälfte der Fälle das Gegenteil des Richtigen. Die
// Wurzelfäule-Karte begann mit „NOTFALL. Topf umtopfen … H2O2“, der Wassermangel nannte „3 L“ und „Wurzelschock“
// (Diagnose-Prüfung vom 08.10.2026, Befund B03; Texte am 29.10.2026 gegen ANBAU.md 1, 1.1, 5, 7.3, 7.4, 9, 13.1, 14 gegengeprüft).
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

  const feld = (id, f) => E(`(PROBLEMS.find(p => p.id === ${JSON.stringify(id)}) || {})[${JSON.stringify(f)}] || ''`);
  const ueber = feld('overwatering', 'action'), unter = feld('underwatering', 'action');
  const faeule = feld('root_rot', 'action'), salz = feld('nutrient_burn', 'action'), salzBild = feld('nutrient_burn', 'description');
  const tag = String(E('DRAIN_AB_TAG')), gpErde = String(E('GIESSPUNKT.erde.bis')), ec = String(E('DRAIN_EC_VERHAELTNIS.voll')).replace('.', ',');

  // 1. Überwässerung und Wassermangel beginnen mit dem Hebe-Test
  for (const [name, t] of [['Überwässerung', ueber], ['Wassermangel', unter]]) {
    pruefe(/^Erst den Topf anheben/.test(t), `${name}: beginnt mit dem Hebe-Test — „${t.slice(0, 60)}“`);
    pruefe(t.includes('Tag ' + tag), `${name}: nennt, ab welchem Tag der Gießpunkt gilt (Tag ${tag})`);
  }
  // 2. Überwässerung: Gießpunkt aus der Konstante, die Überdüngung als dritte Ursache mit Unterscheidungskriterium
  pruefe(ueber.includes(gpErde + ' %'), `Überwässerung: Gießpunkt Erde ${gpErde} % aus GIESSPUNKT`);
  pruefe(ueber.includes(ec + '-Fachen') && /zu viel Dünger/.test(ueber), `Überwässerung: Drain-EC über dem ${ec}-Fachen = zu viel Dünger`);
  pruefe(/Nachlieferung/.test(ueber), 'Überwässerung: Ausnahme Spätblüte in Erde (ANBAU.md 5.1)');
  // 3. Wassermangel ohne „3 L“, ohne „Wurzelschock“, ohne bedingungsloses „Sofort gießen“; schwerer Topf = andere Ursachen
  pruefe(!/3 L|Wurzelschock|2–3 Gängen/.test(unter), 'Wassermangel: kein „3 L“, „Wurzelschock“ oder „2–3 Gängen“');
  pruefe(!/(^|\. )Sofort gießen/.test(unter), 'Wassermangel: kein „Sofort gießen“ vor der Gegenprobe');
  pruefe(/schwer, NICHT gießen/.test(unter) && /Überwässerung/.test(unter) && /Dünger/.test(unter), 'Wassermangel: schwerer Topf → Überwässerung oder Dünger');
  // 4. Wurzelfäule: kein Notfall-Umtopfen, kein H2O2, nennt das Erkennungsmerkmal und die Wurzelzone nach 7.3
  pruefe(!/H2O2/.test(faeule) && !/^NOTFALL/.test(faeule), `Wurzelfäule: kein „NOTFALL“, kein H2O2 — „${faeule.slice(0, 60)}“`);
  pruefe(/braun und weich/.test(faeule) && /modrig/.test(faeule), 'Wurzelfäule: nennt, woran man sie erkennt');
  pruefe(/über 26 °C/.test(faeule) && /18–24 °C/.test(faeule), 'Wurzelfäule: Wurzelzone 18–24 °C, über 26 °C (ANBAU.md 7.3)');
  pruefe(/letzte Schritt/.test(faeule), 'Wurzelfäule: Umtopfen ist der letzte Schritt');
  // 5. Überdüngung: welkt auch im nassen Topf, nicht mit derselben Lösung nachgießen
  pruefe(/welkt/.test(salzBild) && /nassen Topf/.test(salzBild), 'Überdüngung: Beschreibung nennt das Welken im nassen Topf');
  pruefe(/nicht mit derselben Nährlösung/.test(salz), 'Überdüngung: nicht mit derselben Nährlösung nachgießen');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
