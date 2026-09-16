/**
 * (v1.5.225 ff.) Die Texte der Düngeplan-Vorlagen gegen das, was die App selbst sagt und rechnet.
 *
 * Warum es diese Datei gibt: Die Vorlagen in `FERT_PRESETS` waren in KEINER der Text-Prüfungen
 * Prüfgegenstand — nicht in v1.5.125 (Lexikon), v1.5.172 (Bernstein), v1.5.190 (Klima), v1.5.192
 * (IceFlush) und v1.5.210 (Drain-EC). Jede Runde hat ihre Texte bereinigt und diesen Block ausgelassen.
 * Daher stammt die Hälfte der 70 Befunde aus der Plan-Prüfung vom 16.09.2026 (UEBERGABE 0n).
 *
 * Diese Datei wächst mit jedem abgearbeiteten Befund der Gruppe A.
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
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  const code = quelle.split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');

  // (v1.5.225) Der Düngeplan-Bildschirm rendert `mixOrder` als nummerierte Mischanleitung. Mykorrhiza-Pulver
  // stand dort als Schritt 10, während die Produktnotiz daneben „TROCKEN an die Wurzel, NIE ins Gießwasser"
  // sagt. Im Wasser gelöst erreichen die Sporen die Wurzelzone nicht.
  console.log('\nA - Mykorrhiza gehört nicht in die Mischanleitung');
  {
    const r = JSON.parse(E(`(function(){
      const p = FERT_PRESETS.cup_sieger;
      const myko = (p.products || []).find(x => /Mykorrhiza/.test(x.name)) || null;
      return JSON.stringify({
        mixOrder: p.mixOrder || [],
        inMixOrder: (p.mixOrder || []).some(n => /Mykorrhiza/.test(n)),
        produktDa: !!myko,
        notiz: myko ? myko.note : '',
        mixInfo: p.mixInfo || '',
        produkte: (p.products || []).length,
      });
    })()`));
    pruef('cup_sieger: Mykorrhiza steht nicht mehr in der Mischreihenfolge', r.inMixOrder === false, r.mixOrder.join(' · '));
    pruef('Das Produkt bleibt erhalten, mit seiner Anwendung', r.produktDa && /NIE ins Gießwasser/.test(r.notiz), r.notiz.slice(0, 120));
    pruef('Die Mischanleitung erklärt weiter, wohin es stattdessen gehört', /gehört NICHT in die Mischung/.test(r.mixInfo));
    pruef('Produktzahl unverändert (Fingerabdruck bleibt gültig)', r.produkte === 11, 'produkte=' + r.produkte);
    // Zweimal ist richtig, und beide Male als PRODUKT: einmal in der Vorlage, einmal in der Migration v1.1.18,
    // die das Produkt von „HomeGrow24 Granulat" umbenannt hat — sie hat damals genau diesen Fehler behoben
    // (es stand als Gießwasser-Dünger in Woche 4). Was nirgends stehen darf, ist ein Mischschritt.
    pruef('Im Quelltext steht der Name nur als Produkt, nie in einer Mischliste',
      (code.match(/'Mykorrhiza HomeGrow24'/g) || []).length === 2
      && !/mixOrder: \[[^\]]*Mykorrhiza/.test(code) && !/V34_MIXORDER = \[[^\]]*Mykorrhiza/.test(code),
      'Treffer=' + (code.match(/'Mykorrhiza HomeGrow24'/g) || []).length);

    // Die V3.4-Migration schreibt mixOrder in JEDEN gespeicherten cup_sieger-Plan. Ohne sie wäre der Fix
    // halb: Die Vorlage wäre sauber, jedes Gerät, das die App schon einmal geöffnet hat, behielte die alte Liste.
    pruef('Die V3.4-Migration schreibt die Liste ebenfalls ohne Mykorrhiza',
      /const V34_MIXORDER = \[[^\]]*\];/.test(code) && !/const V34_MIXORDER = \[[^\]]*Mykorrhiza/.test(code),
      (code.match(/const V34_MIXORDER = \[[^\]]*\]/) || [''])[0].slice(0, 140));

    // Und für Pläne, die die Migration schon hinter sich haben (_v34SchedMigrated ist dort true),
    // braucht es eine eigene einmalige Reparatur — die Falle aus v1.1.30/31.
    const rep = JSON.parse(E(`(function(){
      try {
        const st = { cycles: [], entries: {}, fertPlans: [{ id: 'fp_x', presetKey: 'cup_sieger', name: 'X',
          products: [{ id: 'p1', name: 'Mykorrhiza HomeGrow24', unit: 'g' }, { id: 'p2', name: 'CalMag', unit: 'ml/L' }],
          schedule: { w1: { p2: 0.3 } }, mixOrder: ['CalMag', 'Mykorrhiza HomeGrow24'] }],
          _v32SchedMigrated2: true, _v33ActiVera: true, _v34SchedMigrated: true, _epsomUnitFix: true };
        localStorage.setItem('growsmart_v4', JSON.stringify(st));
        loadS();
        const p = (S.fertPlans || []).find(x => x.presetKey === 'cup_sieger') || {};
        return JSON.stringify({ ok: true, mixOrder: p.mixOrder || [], flag: !!S._mykoMixFix,
          produkte: (p.products || []).length, dosen: JSON.stringify(p.schedule || {}) });
      } catch (e) { return JSON.stringify({ ok: false, fehler: String(e && e.message || e) }); }
    })()`));
    pruef('Ein schon migrierter Plan lässt sich laden', rep.ok === true, rep.fehler);
    if (rep.ok) {
      pruef('Gespeicherter Plan: Mykorrhiza wird aus der Mischanleitung entfernt',
        !rep.mixOrder.some(n => /Mykorrhiza/i.test(n)) && rep.flag === true, rep.mixOrder.join(' · ') + ' · flag=' + rep.flag);
      pruef('Dabei bleiben Produkte und Dosen unangetastet',
        rep.produkte === 2 && /"p2":0.3/.test(rep.dosen.replace(/\s/g, '')), rep.produkte + ' Produkte · ' + rep.dosen);
    }
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
