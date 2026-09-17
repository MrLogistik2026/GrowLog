/**
 * (v1.5.143) Am IceFlush-Tag sagen Startseite, Tageskarte, Eintrag und Anleitung dasselbe:
 * Crushed Ice an den Topfrand, kein Wasser dazu — und kein Trichom-Versprechen.
 *
 * Der Fehler (beim Abarbeiten der Agenten-Befunde gefunden): Drei Texte widersprachen der
 * Eintragskarte aus v1.5.111 („Wasser gießt du keines dazu"):
 *   · Einsteiger-Satz: „Heute gießt du mit Eiswasser … Langsam, etwa X ml"
 *   · Tageskarte:      „Eiskaltes Wasser (<10°C), ca. X ml" · „Kältestress fördert Trichom-Produktion"
 *                      · „Eiswürfel direkt auf die Erde legen geht auch"
 *   · Anleitung:       „Der Kältestress soll die Trichom-Produktion nochmal pushen"
 * Zusätzliches Wasser am IceFlush macht den Hard-Dryback der Tage davor zunichte; ein
 * Trichom-Effekt ist nach ANBAU.md 14 nicht belegt.
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

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

// Einsteiger-Zyklus anlegen und auf den ersten IceFlush-Tag stellen.
const EISTAG = (pflanzen) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = true;
  const c = addCyc({ name: 'Eis', seedType: 'auto', medium: 'erde' });
  c.potSize = 11; c.plantCount = ${pflanzen};
  for (let d = 70; d <= 120; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    if (getAction(todayISO(), c) === 'ice') {
      saveS();
      const iso = todayISO();
      const p = phase(iso, c);
      const karte = getTodayAction(c, p, 'ice', iso);
      renderDash();
      const dash = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
      openEntry(iso);
      const eintrag = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
      return JSON.stringify({ tag: d, n: getEffectivePlantCount(c, iso), eis: Math.round(getPotSize(c) / 11 * 1000),
        schmelz: waterSuggestion(c, p, iso), karte: karte ? (karte.steps || []).join(' | ') + ' | ' + (karte.hint || '') : '', dash, eintrag });
    }
  }
  return JSON.stringify({ fehlt: true });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('\nA - Drei Pflanzen am IceFlush-Tag');
  const r = JSON.parse(E(EISTAG(3)));
  pruef('IceFlush-Tag gefunden', !r.fehlt, JSON.stringify(r).slice(0, 100));
  if (!r.fehlt) {
    const satz = (r.dash.match(/Heute (ist IceFlush|gießt du mit Eiswasser)[^]*?(nicht belegt\.|\d+ ml\.)/) || [''])[0];
    console.log('    Satz:  „' + satz + '"');
    console.log('    Karte: „' + r.karte + '"');
    pruef('Einsteiger-Satz: Eis anlegen, nicht Eiswasser gießen', /Crushed Ice/.test(satz) && !/gießt du mit Eiswasser/.test(r.dash), satz);
    pruef('… mit der Eismenge je Topf und der Summe', satz.includes('etwa ' + r.eis + ' ml Crushed Ice') && satz.includes('zusammen ' + (r.eis * 3) + ' ml für 3 Pflanzen'), satz);
    pruef('… und „Wasser gießt du keines dazu"', /Wasser gießt du keines dazu/.test(satz), satz);
    pruef('Tageskarte: Crushed Ice je Topf, kein zusätzliches Wasser', r.karte.includes(r.eis + ' ml Crushed Ice') && /kein zusätzliches Wasser/.test(r.karte), r.karte);
    pruef('Tageskarte: kein Trichom-Versprechen, keine Eiswürfel auf die Erde', !/Kältestress fördert|Eiswürfel direkt/.test(r.karte) && !/Kältestress fördert/.test(r.dash), r.karte);
    pruef('Eintrag sagt weiter „Wasser gießt du keines dazu"', /Wasser gießt du keines dazu/.test(r.eintrag));
  }

  console.log('\nB - Eine Pflanze');
  const e1 = JSON.parse(E(EISTAG(1)));
  if (!e1.fehlt) {
    const satz = (e1.dash.match(/Heute (ist IceFlush|gießt du mit Eiswasser)[^]*?(nicht belegt\.|\d+ ml\.)/) || [''])[0];
    pruef('„Leg etwa X ml Crushed Ice", ohne Summe', satz.includes('Leg etwa ' + e1.eis + ' ml Crushed Ice') && !/zusammen/.test(satz), satz);
  } else pruef('IceFlush-Tag gefunden (1 Pflanze)', false);

  console.log('\nC - Kein Text im Quelltext empfiehlt noch Eiswasser oder verspricht Trichome');
  {
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n')
      .map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z));
    [/Eiskaltes Wasser \(<10°C\)/, /Eiswürfel direkt auf die Erde/, /gießt du mit Eiswasser/, /Kältestress\s+(soll|fördert|pusht)[^\n.]{0,60}Trichom/i].forEach(re => {
      const treffer = quelle.filter(x => re.test(x.z)).map(x => 'Zeile ' + x.nr);
      pruef('Nirgends: ' + re.source, treffer.length === 0, treffer.join(', '));
    });
  }

  // (v1.5.261) Am IceFlush-Tag stand im Eintrag „~1 L Crushed Ice pro Topf" fest, während der Kasten darunter, die Anleitung
  // und der Einsteiger-Satz die Menge aus der Topfgröße rechnen (1 L je 11-L-Topf). Beim 15-L-Topf standen „~1 L" und
  // „1364 ml" auf demselben Bildschirm. Gefunden beim Fach-Gegencheck der IceFlush-Texte.
  const EIS15 = (beginner) => `(function(){
    S.cycles = []; S.entries = {}; S.beginnerMode = ${beginner};
    const c = addCyc({ name: 'Eis15', seedType: 'auto', medium: 'erde' });
    c.potSize = 15; c.plantCount = 2; c.targetAmber = 15;
    for (let d = 70; d <= 130; d++) {
      c.startDate = isoPlus(todayISO(), -(d - 1));
      if (getAction(todayISO(), c) === 'ice') {
        saveS();
        const iso = todayISO();
        openEntry(iso);
        const eintrag = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ');
        const panel = _renderIceFlushPanel(c, iso).replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ');
        const st = endspurtState(c, iso);
        const ernteIso = isoPlus(c.startDate, st.ernteTag - 1);
        const ernteKarte = getTodayAction(c, phase(ernteIso, c), 'ernte', ernteIso);
        return JSON.stringify({ eis: Math.round(getPotSize(c) / 11 * 1000), eintrag, panel, ernteTag: st.ernteTag,
          bis: isoDiff(ernteIso, iso), datum: fmtDE(ernteIso, { weekday: 'long', day: '2-digit', month: '2-digit' }),
          amber: _targetAmber(c), klar: RIPE_CLEAR_DONE, ernteSteps: ernteKarte ? (ernteKarte.steps || []).join(' | ') : '' });
      }
    }
    return JSON.stringify({ fehlt: true });
  })()`;
  const eisProfi = JSON.parse(E(EIS15(false)));
  const eisEinst = JSON.parse(E(EIS15(true)));

  console.log('\nD - (v1.5.261) Die Eismenge im Eintrag folgt der Topfgröße');
  pruef('IceFlush-Tag mit 15-L-Topf gefunden', !eisProfi.fehlt && !eisEinst.fehlt, JSON.stringify(eisProfi).slice(0, 80));
  if (!eisProfi.fehlt && !eisEinst.fehlt) {
    const soll = '~' + eisProfi.eis + ' ml Crushed Ice pro Topf';
    pruef('Kein festes „~1 L Crushed Ice pro Topf" mehr im Eintrag (beide Modi)', !/~1 L Crushed Ice pro Topf/.test(eisProfi.eintrag + eisEinst.eintrag));
    pruef('Die Karte nennt ' + soll, eisProfi.eintrag.includes(soll) || eisEinst.eintrag.includes(soll),
      (eisProfi.eintrag.match(/.{0,40}Crushed Ice pro Topf.{0,60}/) || [''])[0]);
    const mengen = (eisProfi.eintrag.match(/(\d+) ml Crushed Ice/g) || []).map(s => parseInt(s, 10));
    pruef('Alle Eismengen je Topf im Eintrag sind dieselbe Zahl', mengen.length > 0 && mengen.every(m => m === eisProfi.eis || m === eisProfi.eis * 2), mengen.join(', '));
  }

  // (v1.5.262) Die IceFlush-Anleitung sagte „Licht aus → 24–36 h Dunkelphase" und im selben Atemzug „Ernte am Folgetag beim
  // Lichtangang" — das ist nur mit einem IceFlush-Tag richtig. Der Plan erntet `iceLenFor(c)` Tage nach dem Eis (Patrick:
  // Eis Tag 114, Ernte Tag 116). Wer der Karte folgte, schnitt einen Tag oder mehr vor dem Plan — zu früh ernten ist der
  // teuerste Fehler (ANBAU.md 11). Und geschnitten wird vor dem Lichtangang (2.2), nicht „beim"; „früh ernten = maximaler
  // Terpengehalt" ist nicht belegt — belegt ist nur, dass Terpene mit Licht und Wärme verdunsten (14).
  console.log('\nE - (v1.5.262) Die Anleitung nennt den Erntetag des Plans');
  if (!eisProfi.fehlt) {
    pruef('Kein „Folgetag" mehr in der Anleitung', !/Folgetag/.test(eisProfi.panel), (eisProfi.panel.match(/.{0,60}Folgetag.{0,40}/) || [''])[0]);
    pruef('Schritt: Ernte am Erntetag des Plans mit Tag und Datum', eisProfi.panel.includes('Ernte am Erntetag deines Plans (Tag ' + eisProfi.ernteTag + ' · ' + eisProfi.datum + '), bevor das Licht wieder angeht'),
      (eisProfi.panel.match(/.{0,20}Ernte am Erntetag.{0,90}/) || [''])[0]);
    pruef('Zeitleiste: ' + (eisProfi.bis === 1 ? 'Morgen' : 'In ' + eisProfi.bis + ' Tagen') + ' · früh', eisProfi.panel.includes((eisProfi.bis === 1 ? 'Morgen' : 'In ' + eisProfi.bis + ' Tagen') + ' · früh') && eisProfi.bis >= 1);
    pruef('Dunkelphase bis zur Ernte statt fester Stunden', /Licht ausschalten → Dunkelphase bis zur Ernte/.test(eisProfi.panel) && !/24–36 h Dunkelphase startet/.test(eisProfi.panel));
    pruef('Erntetag-Karte: vor dem Lichtangang, ohne „maximaler Terpengehalt"', /bevor das Licht angeht/.test(eisProfi.ernteSteps) && !/maximaler Terpengehalt/.test(eisProfi.ernteSteps), eisProfi.ernteSteps);
  }
  {
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    pruef('Lexikon IceFlush: Ernte am Erntetag des Plans, bevor das Licht wieder angeht', /6\. Ernte am Erntetag deines Plans, bevor das Licht wieder angeht/.test(quelle) && !/Ernte am Folgetag/.test(quelle));
    pruef('Nirgends mehr „maximaler Terpengehalt"', !/maximaler Terpengehalt/i.test(quelle));
  }

  // (v1.5.263) Checkliste vor dem IceFlush, Lexikon und Erntetag-Karte nannten „max. 10 % Bernstein" als feste Grenze. Das
  // Bernstein-Ziel stellt jeder selbst ein (`c.targetAmber`, Patrick am 16.09.2026: „manche ernten bei 15 % für den Couch
  // Lock"); v1.5.172 hat feste Bernstein-Mengen aus allen anderen Texten genommen. Die Untergrenze bleibt: klar höchstens
  // RIPE_CLEAR_DONE (ANBAU.md 11).
  console.log('\nF - (v1.5.263) Das eigene Bernstein-Ziel statt „max. 10 %"');
  if (!eisProfi.fehlt) {
    const soll = 'klar höchstens ' + eisProfi.klar + ' %, Bernstein nahe an deinem Ziel (' + eisProfi.amber + ' %)';
    pruef('Checkliste: ' + soll, eisProfi.panel.includes(soll) && eisProfi.amber === 15, (eisProfi.panel.match(/.{0,30}Trichome.{0,90}/) || [''])[0]);
    // (v1.5.264) Ohne Trichom-Messung sagt die Erntetag-Karte „erst Trichome prüfen" und nennt die Klar-Grenze als Schritt.
    pruef('Erntetag-Karte: dieselbe Klar-Grenze, ohne feste Bernstein-Menge', eisProfi.ernteSteps.includes('Höchstens ' + eisProfi.klar + ' % klar') && !/max\.? ?10\s?% (B|b)ernstein/.test(eisProfi.ernteSteps), eisProfi.ernteSteps);
  }
  {
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    pruef('Nirgends mehr „max. 10 % Bernstein" oder „90 % milchig"', !/max\.? ?10\s?% (B|b)ernstein/.test(quelle) && !/9\d\s?% milchig/.test(quelle),
      (quelle.match(/.{0,40}(max\.? ?10\s?% (B|b)ernstein|9\d\s?% milchig).{0,20}/) || [''])[0]);
    pruef('Lexikon IceFlush: Bernstein nahe an deinem eingestellten Ziel', /Bernstein nahe an deinem eingestellten Ziel/.test(quelle));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
