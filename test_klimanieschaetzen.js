/**
 * (v1.5.186) „Tag automatisch ausfüllen" trägt kein Klima ein, das niemand gemessen hat.
 *
 * Befund der zweiten Prüfrunde (VPD): getAutoFillTemplate rechnete Temperatur und Luftfeuchte aus der Phasen-Tabelle
 * (mit Luft-VPD, auf das RLF-Fenster geklemmt), applyRecommended speicherte sie ohne Kennzeichen. Danach zählten sie als
 * Messung — im Klimafaktor der Gießmenge, im Diagramm, in Diagnose und Schimmel-Alarm. In Patricks Sicherung sind
 * 22 von 86 Klimawerten solche Vorlagenpaare. Ein geschätztes Klima ist keine Messung (ANBAU.md, Regel 2).
 * Dazu: „Klima-justiert" folgt jetzt dem Klimafaktor der Gießmenge statt einer eigenen Luft-VPD-Rechnung.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const HTML = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const BACKUP = fs.readFileSync(path.join(__dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

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
      w.localStorage.setItem('growsmart_v4', BACKUP);
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

const TAG1 = '2026-05-16';   // Tag 1: Sättigungsguss
const TAG3 = '2026-05-18';   // Tag 3: Sprühen
const T60 = '2026-07-14';    // Blüte, mittlere Stufe
const T104 = '2026-08-27';   // Tag 104: Düngerguss, Spätblüte
const T105 = '2026-08-28';   // kein Gießtag
const T107 = '2026-08-30';   // Tag 107: erster Spülgang

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`setDebugDate('${T104}')`);

  console.log('\nA - Die Vorlage für „Tag automatisch ausfüllen" kennt kein Klima');
  {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0]; const out = {};
      for (const iso of ['${TAG1}', '${TAG3}', '${T60}', '${T104}', '${T105}', '${T107}']) {
        const tpl = getAutoFillTemplate(c, phase(iso, c), getAction(iso, c), iso) || {};
        out[iso + ' ' + (getAction(iso, c) || 'kein Guss')] = ['temp', 'humidity'].filter(k => k in tpl);
      }
      return JSON.stringify(out); })()`));
    const mitKlima = Object.entries(r).filter(([, k]) => k.length);
    pruef('Sättigungsguss, Sprühen, Gießtage, Spülen, Tag ohne Guss: kein Temperatur- oder Luftfeuchte-Vorschlag', mitKlima.length === 0,
      mitKlima.map(([t, k]) => `${t}: ${k.join('+')}`).join(' | '));
  }

  console.log('\nB - „Empfehlung übernehmen" lässt Temperatur und Luftfeuchte leer');
  {
    E(`(function(){ const c = S.cycles[0]; const e = S.entries['${T104}'];
      delete e.temp; delete e.humidity; if (e.cycleData && e.cycleData[c.id]) delete e.cycleData[c.id].water; })()`);
    E(`S.beginnerMode = false; openEntry('${T104}')`);
    await warte(150);
    const wk = E(`fertPlanWeek(S.cycles[0], '${T104}', phase('${T104}', S.cycles[0]))`);
    await E(`applyRecommended(S.cycles[0].id, ${wk})`);
    await warte(150);
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0]; const e = S.entries['${T104}'];
      const et = document.getElementById('et'), er = document.getElementById('er');
      return JSON.stringify({ temp: e.temp || '', humidity: e.humidity || '', water: (e.cycleData[c.id] || {}).water || '',
        feldT: et ? et.value : null, feldR: er ? er.value : null, phT: et ? et.getAttribute('placeholder') : null, phR: er ? er.getAttribute('placeholder') : null }); })()`));
    pruef('Klima bleibt leer, gespeichert und im Feld', r.temp === '' && r.humidity === '' && r.feldT === '' && r.feldR === '', JSON.stringify(r));
    pruef('Das übrige Ausfüllen läuft weiter (Gießmenge eingetragen)', !!r.water, JSON.stringify(r));
    pruef('Die Zielwerte stehen als Platzhalter in den leeren Feldern', parseFloat(r.phT) > 0 && parseFloat(r.phR) > 0, `Platzhalter ${r.phT} °C / ${r.phR} %`);
  }

  console.log('\nC - „Klima-justiert" folgt dem Klimafaktor der Gießmenge');
  {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0]; const e = S.entries['${T104}']; const out = [];
      for (const [t, rh] of [[24, 50], [21, 40], [25, 62], [22, 45], [null, null]]) {
        if (t === null) { delete e.temp; delete e.humidity; } else { e.temp = String(t); e.humidity = String(rh); }
        const p = phase('${T104}', c);
        const tpl = getAutoFillTemplate(c, p, getAction('${T104}', c), '${T104}') || {};
        const g = gussMengeJePflanze(c, p, '${T104}'); const f = g ? g.klima : 1;   // (v1.5.207) Klima-Verhältnis der Gießmenge aus dem Topf
        out.push({ klima: t === null ? 'ohne' : t + '/' + rh, faktor: f, flag: !!tpl._vpdAdjusted });
      }
      return JSON.stringify(out); })()`));
    const falsch = r.filter(x => x.flag !== (Math.abs(x.faktor - 1) >= 0.02));
    pruef('Hinweis genau dann, wenn der Faktor wirkt (vier Klimawerte und ohne Klima)', falsch.length === 0,
      r.map(x => `${x.klima}: Faktor ${x.faktor}, Hinweis ${x.flag}`).join(' | '));
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
