/**
 * (v1.5.142) Der Einsteiger-Satz auf der Startseite nennt die Menge je Pflanze, nicht die Summe.
 *
 * Der Fehler (Prüf-Agenten, Blickwinkel Anfänger, gegengeprüft): renderDash übergibt
 * waterSuggestion(c, p) — die Summe für alle Töpfe — an plainSentence, und der Satz lautete
 * „Gib deiner Pflanze heute … etwa X ml". Bei 3 Pflanzen stand an Tag 12 „etwa 750 ml", der
 * Gieß-Fahrplan daneben „250 ml je Pflanze × 3". An Tag 1 standen auf derselben Karte „3 Etappen
 * je ~250 ml" und „2100 ml in 3 Etappen zu je ~700 ml".
 *
 * Nach ANBAU.md 13.1 ist Überwässerung der häufigste Anfängertod, besonders bei Sämlingen.
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

// Legt einen Einsteiger-Zyklus an, sucht ab Tag `von` den ersten Tag mit der gewünschten Aktion
// und liefert den Satz auf der Startseite samt Summe und Menge je Pflanze.
const SATZ = (aktion, von, bis, pflanzen) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = true;
  const c = addCyc({ name: 'Einsteiger', seedType: 'auto', medium: 'erde' });
  c.potSize = 11; c.plantCount = ${pflanzen};
  for (let d = ${von}; d <= ${bis}; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    if (getAction(todayISO(), c) === ${JSON.stringify(aktion)}) {
      saveS();
      const p = phase(todayISO(), c);
      const summe = waterSuggestion(c, p);
      const n = getEffectivePlantCount(c, todayISO());
      renderDash();
      const t = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
      return JSON.stringify({ tag: d, summe, n, proPfl: Math.round(summe / n), text: t });
    }
  }
  return JSON.stringify({ fehlt: true });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`document.getElementById('modal-overlay') && document.getElementById('modal-overlay').classList.remove('show')`);

  console.log('\nA - Anzucht-Guss mit 3 Pflanzen');
  {
    const r = JSON.parse(E(SATZ('giess_anz', 9, 20, 3)));
    pruef('Anzucht-Gießtag gefunden', !r.fehlt, JSON.stringify(r).slice(0, 120));
    if (!r.fehlt) {
      const satz = (r.text.match(/Gib (deiner|jeder) Pflanze heute ganz vorsichtig[^—]*/) || [''])[0];
      console.log('    Tag ' + r.tag + ': „' + satz.trim() + '"  (Summe ' + r.summe + ' ml, ' + r.n + ' Pflanzen)');
      pruef('Der Satz spricht jede Pflanze an', /Gib jeder Pflanze/.test(satz), satz);
      pruef('… mit der Menge je Pflanze (' + r.proPfl + ' ml)', satz.includes('etwa ' + r.proPfl + ' ml'), satz);
      pruef('… und nennt die Summe dazu', satz.includes('zusammen ' + r.summe + ' ml für 3 Pflanzen'), satz);
      pruef('… nicht mehr die Summe als Menge „für deine Pflanze"', !new RegExp('deiner Pflanze heute ganz vorsichtig etwa ' + r.summe).test(r.text));
    }
  }

  console.log('\nB - Blüte-Guss mit 3 Pflanzen');
  {
    const r = JSON.parse(E(SATZ('giess', 22, 45, 3)));
    pruef('Blüte-Gießtag gefunden', !r.fehlt, JSON.stringify(r).slice(0, 120));
    if (!r.fehlt) {
      const satz = (r.text.match(/Gib (deiner|jeder) Pflanze heute etwa[^.]*\./) || [''])[0];
      console.log('    Tag ' + r.tag + ': „' + satz.trim() + '"');
      pruef('Menge je Pflanze und Summe', /Gib jeder Pflanze/.test(satz) && satz.includes('etwa ' + r.proPfl + ' ml') && satz.includes('zusammen ' + r.summe + ' ml'), satz);
    }
  }

  console.log('\nC - Sättigungsguss an Tag 1 mit 3 Pflanzen');
  {
    const r = JSON.parse(E(SATZ('saettigung', 1, 1, 3)));
    pruef('Tag 1 ist Sättigungsguss', !r.fehlt, JSON.stringify(r).slice(0, 120));
    if (!r.fehlt) {
      const etappe = Math.max(50, Math.round(r.proPfl / 3 / 50) * 50);
      const satz = (r.text.match(/3 Etappen je ~\d+ ml[^<]*?mit 15 min Pause/) || [''])[0];
      console.log('    „' + satz + '"  (je Topf ' + r.proPfl + ' ml)');
      pruef('Etappe aus der Menge je Topf (~' + etappe + ' ml je Topf)', satz.includes('je ~' + etappe + ' ml je Topf'), satz);
    }
  }

  console.log('\nD - Eine Pflanze: Wortlaut wie bisher');
  {
    const r = JSON.parse(E(SATZ('giess_anz', 9, 20, 1)));
    if (!r.fehlt) {
      const satz = (r.text.match(/Gib (deiner|jeder) Pflanze heute ganz vorsichtig[^—]*/) || [''])[0];
      pruef('„deiner Pflanze", die Menge, keine Summe', /Gib deiner Pflanze/.test(satz) && satz.includes('etwa ' + r.summe + ' ml') && !/zusammen/.test(satz), satz);
    } else pruef('Anzucht-Gießtag gefunden (1 Pflanze)', false);
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
