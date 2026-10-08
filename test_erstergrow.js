// Die Einsteiger-Anleitung „Dein erster Grow" (FIRST_GROW_STEPS) gegen ANBAU.md und gegen die App selbst.
// Die Anleitung war in keiner der Textprüfungen Prüfgegenstand (gefunden beim Bau von v1.5.390). Die Ersatztexte hat vor dem
// Einbau ein Prüfer Satz für Satz gegen ANBAU.md und den Code gehalten (08.10.2026).
//
//   S2 (v1.5.393)  Keimen und Einpflanzen folgen der Start-Methode der App: Erde vorbefeuchten, Start-Guss, Samen danach.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

function fakeCtx() {
  const noop = () => {};
  return { canvas: null, fillStyle: '', strokeStyle: '', lineWidth: 1, font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, arc: noop, arcTo: noop, rect: noop, fill: noop, stroke: noop,
    fillRect: noop, clearRect: noop, strokeRect: noop, save: noop, restore: noop, translate: noop, rotate: noop, scale: noop,
    setTransform: noop, fillText: noop, strokeText: noop, drawImage: noop, clip: noop, setLineDash: noop, quadraticCurveTo: noop,
    bezierCurveTo: noop, measureText: () => ({ width: 0 }), createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }), getImageData: () => ({ data: [] }) };
}
async function starte() {
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
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  w.toast = () => {};
  return { w, errors, E: (s) => w.eval(s) };
}

(async () => {
  const fehler = [];
  let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const a = await starte();
  // Ein Schritt so, wie der Bildschirm ihn zeigt (showFirstGrowStep), als Text.
  const schritt = (i) => a.E(`(function(){ showFirstGrowStep(${i}); const o = document.querySelector('[data-firstgrow]');
    const t = o ? o.textContent.replace(/\\s+/g, ' ') : ''; document.querySelectorAll('[data-firstgrow]').forEach(x => x.remove()); return t; })()`);
  const titel = JSON.parse(a.E(`JSON.stringify(FIRST_GROW_STEPS.map(s => s.title + ' | ' + s.duration))`));
  pruefe(titel.length === 8, `Acht Schritte erwartet: ${titel.length}`);

  // S2 (v1.5.393) · Keimen und Einpflanzen
  {
    const s2 = schritt(1), s3 = schritt(2);
    const direkt = JSON.parse(a.E(`JSON.stringify(GERM_GUIDES.direct.steps.map(x => x.replace(/<[^>]+>/g, '')))`));
    pruefe(/direkt in die Erde \(empfohlen\)/i.test(s2), `S2-1 „direkt in die Erde (empfohlen)" fehlt: ${s2.slice(0, 200)}`);
    pruefe(/ausgewrungener Schwamm/.test(s2) && /Start-Guss/.test(s2), `S2-2 Vorbefeuchten und Start-Guss fehlen: ${s2.slice(0, 300)}`);
    pruefe(direkt.every(x => s2.includes(x.replace(/\s+/g, ' ').trim())), 'S2-3 die Schritte aus GERM_GUIDES.direct stehen nicht in der Anleitung');
    pruefe(s2.indexOf('Wasserglas') > s2.indexOf('direkt in die Erde'), 'S2-4 das Wasserglas steht vor der empfohlenen Variante');
    pruefe(/nur bei Glas oder Tuch/i.test(titel[2]) || /nur bei Glas oder Tuch/i.test(s3), `S2-5 Schritt 3 sagt nicht, dass er nur für Glas und Tuch gilt: ${titel[2]}`);
    pruefe(!/ertränken/.test(s3), 'S2-6 Schritt 3: „ertränken" statt des Mechanismus');
  }

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_erstergrow: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_erstergrow: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_erstergrow abgebrochen:', (e && e.stack) || e); process.exit(1); });
