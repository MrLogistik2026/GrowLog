/**
 * (v1.5.162) Der Demo-Zyklus widerspricht seinen eigenen Tagen nicht mehr.
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft): Der Toast sagte „Tag 60 von 68" — endspurtState
 * der Demo liefert Ernte an Tag 64 und Trocknen bis Tag 71, heute ist im echten Betrieb Tag 61. Die
 * Notiz an Tag 55 lautete „Flush-Woche gestartet. Nur noch Wasser.", getAction ist dort ein Blüte-Guss,
 * der erste Spülgang kommt an Tag 57. Und die Demo schrieb Ablaufwerte ohne Ablaufmenge: Seit v1.5.150
 * zeigt die App dazu „nicht bewertet" — die erste Messung, die ein Neuling sieht, taugte nichts.
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  E(`window.__toasts = []; toast = function (m) { window.__toasts.push(String(m)); };`);
  E(`S.cycles = []; S.entries = {}; saveS(); welcomeStartDemo()`);
  await warte(300);

  const r = JSON.parse(E(`(function(){
    const c = S.cycles.find(x => /Demo/.test(x.name));
    const st = endspurtState(c, todayISO());
    const eintraege = Object.keys(S.entries).sort().map(iso => ({ iso, cd: S.entries[iso].cycleData && S.entries[iso].cycleData[c.id] })).filter(x => x.cd);
    const spuelNotiz = eintraege.filter(x => /Nur noch Wasser/.test(x.cd.notes || '')).map(x => ({ tag: isoDiff(x.iso, c.startDate) + 1, a: getAction(x.iso, c) }));
    const ablauf = eintraege.filter(x => x.cd.runoffEc || x.cd.runoffPh).map(x => {
      const ra = analyzeRunoff(x.cd, c.medium, _ecTargetFor(c, x.iso), { c, iso: x.iso });
      return { iso: x.iso, menge: x.cd.drainMl || null, ecGueltig: ra.ecGueltig, flow: ra.flow && ra.flow.guete };
    });
    let eintragText = '';
    if (ablauf[0]) { S.beginnerMode = false; openEntry(ablauf[ablauf.length - 1].iso); eintragText = document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' '); }
    return JSON.stringify({ toasts: window.__toasts, heute: st.heuteTag, ernte: st.ernteTag, trockenBis: st.trockenBis, erstesSpuelen: st.spuelGaenge[0], spuelNotiz, ablauf, ohneMengeHinweis: /Ohne Ablaufmenge/.test(eintragText) });
  })()`));

  console.log(`    Demo: heute Tag ${r.heute}, erster Spülgang Tag ${r.erstesSpuelen}, Ernte Tag ${r.ernte}, trocken bis Tag ${r.trockenBis}`);
  const demoToast = r.toasts.find(t => /Demo-Zyklus angelegt/.test(t)) || '';
  console.log('    Toast: „' + demoToast + '"');

  console.log('\nA - Der Toast nennt die Tage der Demo');
  pruef('Kein festes „Tag 60 von 68"', !r.toasts.some(t => /von 68/.test(t)), demoToast);
  pruef(`Toast: heute Tag ${r.heute}, Ernte an Tag ${r.ernte}`, demoToast.includes(`Tag ${r.heute}`) && demoToast.includes(`Ernte an Tag ${r.ernte}`), demoToast);

  console.log('\nB - Die Spül-Notiz steht an einem Spültag');
  console.log('    ' + JSON.stringify(r.spuelNotiz));
  pruef('Genau eine Notiz „Nur noch Wasser"', r.spuelNotiz.length === 1, JSON.stringify(r.spuelNotiz));
  pruef('… am ersten Spülgang, wo getAction „spuelen" sagt', r.spuelNotiz[0] && r.spuelNotiz[0].a === 'spuelen' && r.spuelNotiz[0].tag === r.erstesSpuelen, JSON.stringify(r.spuelNotiz[0]));

  console.log('\nC - Die Ablaufmessungen der Demo sind gültig');
  console.log(`    ${r.ablauf.length} Ablaufmessungen · mit Menge: ${r.ablauf.filter(a => a.menge).length} · gültig: ${r.ablauf.filter(a => a.ecGueltig).length}`);
  pruef('Prüflage: die Demo hat Ablaufmessungen', r.ablauf.length > 5, r.ablauf.length);
  pruef('Jede mit Ablaufmenge und gültigem Durchfluss', r.ablauf.every(a => a.menge && a.ecGueltig !== false && (a.flow === 'gut' || a.flow === 'auswaschend')), JSON.stringify(r.ablauf.filter(a => !a.menge || a.ecGueltig === false).slice(0, 3)));
  pruef('Im Eintrag steht kein „Ohne Ablaufmenge"', r.ohneMengeHinweis === false);

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
