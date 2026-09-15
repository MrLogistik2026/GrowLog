/**
 * (v1.5.169) Der Sämlings-Start nennt die Tag-1-Menge, die die App an Tag 1 wirklich rechnet.
 *
 * Der Fehler (beim Abarbeiten von v1.5.168 gesehen): Seit v1.5.161 kommt die Tag-1-Menge aus Topf und
 * Substrat (waterSuggestion) — 7 L Erde 450 ml, 11 L Coco 350 ml. Assistent, Einstellungen und der
 * Sämlings-Hinweis nach dem Anlegen nannten weiter fest „~700 ml", „150ml" und „~400 ml" zum Vorbefeuchten,
 * der Hinweis dazu „48h vor Tag 1" (alle anderen Stellen: 24 h) und pH 6.2–6.5 auch bei Coco.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '',
    textBaseline: '', globalAlpha: 1, lineCap: '', lineJoin: '', shadowBlur: 0, shadowColor: '',
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, arcTo: noop,
    rect: noop, fill: noop, stroke: noop, fillRect: noop, clearRect: noop, strokeRect: noop,
    save: noop, restore: noop, translate: noop, rotate: noop, scale: noop, setTransform: noop,
    fillText: noop, strokeText: noop, drawImage: noop, clip: noop, setLineDash: noop,
    quadraticCurveTo: noop, bezierCurveTo: noop, measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}

async function load() {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true;
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.print = () => {};
    },
  });
  const window = dom.window;
  if (window.document.readyState !== 'complete') {
    await new Promise((r) => { window.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  }
  await new Promise((r) => setTimeout(r, 80));
  return { window, errors, E: (s) => window.eval(s) };
}
const warte = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}
const text = (html) => String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

// Die Referenz: ein echter Zyklus an Tag 1 — das, was Startseite und Karte an diesem Tag sagen
const ECHT = (pot, medium, methode) => `(function(){
  S.cycles = []; S.entries = {};
  const c = addCyc({ name: 'Ref', seedType: 'auto', medium: '${medium}' });
  const iso = todayISO(); c.startDate = iso; c.startMethod = '${methode}'; c.potSize = ${pot}; c.plantCount = 1; saveS();
  return waterSuggestion(c, phase(iso, c), iso);
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E('S._seedlingProtocolShown = true');   // der Hinweis wird in C gezielt ausgelöst

  console.log('\nA - Assistent: dieselbe Zahl wie später an Tag 1');
  {
    let t11 = '';
    for (const [pot, med] of [[7, 'erde'], [11, 'coco'], [11, 'erde']]) {
      const sat = E(ECHT(pot, med, 'saturated')), dir = E(ECHT(pot, med, 'direct'));
      const t = text(E(`_wizStepStartMethod({ potSize: ${pot}, medium: '${med}', seedType: 'auto', growType: 'indoor' })`));
      if (pot === 11 && med === 'erde') t11 = t;
      pruef(`${pot} L ${med}: Sättigungsguss ~${sat} ml`, t.includes(`Sättigungsguss ~${sat} ml`), (t.match(/Sättigungsguss ~\d+ ml/) || ['(keine Zahl)'])[0]);
      pruef(`${pot} L ${med}: Erstguss ~${dir} ml`, t.includes(`Erstguss ~${dir} ml`), (t.match(/Erstguss ~\d+ ml/) || ['(keine Zahl)'])[0]);
    }
    pruef('Vorbefeuchten ohne erfundene Menge, mit Kriterium „ausgewrungener Schwamm"', !/~400 ?ml/.test(t11) && /ausgewrungener Schwamm/.test(t11), t11.slice(0, 200));
  }

  console.log('\nB - Einstellungen: Umschalter „Sämlings-Start"');
  {
    const sat = E(ECHT(7, 'coco', 'saturated')), dir = E(ECHT(7, 'coco', 'direct'));
    const t = E(`(function(){
      S._setUI = Object.assign(S._setUI || {}, { cyc_basics: true, b_seedstart: true });
      goTo('set'); renderSet();
      return document.getElementById('scr-set').textContent.replace(/\\s+/g, ' ');
    })()`);
    const stelle = (t.match(/Vorbefeuchtet.{0,120}/) || ['(Umschalter nicht gefunden)'])[0];
    pruef(`7 L Coco: „${sat} ml je Topf Sättigungsguss"`, t.includes(`${sat} ml je Topf Sättigungsguss`) && !/700ml Sättigungsguss/.test(t), stelle);
    pruef(`7 L Coco: „${dir} ml je Topf Erstguss"`, t.includes(`${dir} ml je Topf Erstguss`) && !/150ml Erstguss/.test(t), stelle);
  }

  console.log('\nC - Sämlings-Hinweis nach dem Anlegen');
  {
    const hinweis = async (pot, med, methode) => {
      E(`S.cycles = []; S.entries = {}; S._seedlingProtocolShown = false;
        window._neu = addCyc({ name: 'Neu', seedType: 'auto', medium: '${med}', growType: 'indoor' });
        _neu.growType = 'indoor'; _neu.startMethod = '${methode}'; _neu.potSize = ${pot}; _neu.plantCount = 1; saveS();`);
      await warte(1100);
      const t = E(`document.body.textContent.replace(/\\s+/g, ' ')`);
      E(`typeof _modalResolve === 'function' && _modalResolve(true)`);
      await warte(80);
      return (t.match(/App-Plan für Sämlinge.*?Tipp: Sämlings-Haube/) || ['(Hinweis nicht gefunden)'])[0];
    };
    {
      const sat = E(ECHT(7, 'coco', 'saturated'));
      const ph = E(`phTargetFor('coco').label`);
      const t = await hinweis(7, 'coco', 'saturated');
      pruef(`Vorbefeuchtet, 7 L Coco: Sättigungsguss ~${sat} ml`, t.includes(`Sättigungsguss ~${sat} ml`), t.slice(0, 260));
      pruef(`Vorbefeuchtet, Coco: pH ${ph} statt 6.2–6.5`, t.includes(`pH ${ph}`) && !/6\.2–6\.5/.test(t), (t.match(/pH [\d.–]+/g) || []).join(', '));
      pruef('Vorbefeuchtet: 24h vor Tag 1, kein „48h", keine ~400 ml', /24h vor Tag 1/.test(t) && !/48h/.test(t) && !/~400 ?ml/.test(t), t.slice(0, 160));
    }
    {
      const dir = E(ECHT(11, 'erde', 'direct'));
      const t = await hinweis(11, 'erde', 'direct');
      pruef(`Direkt, 11 L Erde: Erstguss ~${dir} ml`, t.includes(`~${dir} ml pH-Wasser`), t.slice(0, 200));
      pruef('Direkt: kein „Samen in trockene Erde" mehr (Tag 1 = Keimstart)', !/Samen in trockene Erde/.test(t) && /Keimstart/.test(t), t.slice(0, 200));
    }
  }

  console.log('\nD - Quelltext');
  {
    const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    const alt = src.match(/700ml Sättigungsguss|150ml Erstguss|~400 ?ml pH-Wasser anfeuchten|48h vor Tag 1|Samen in trockene Erde|Sättigungsguss ~700 ?ml in 3 Etappen/g) || [];
    pruef('Keine feste Tag-1-Menge mehr in Assistent, Einstellungen und Hinweis', alt.length === 0, alt.join(' | '));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
