// „✓“ heißt gespeichert: Meldungen wie „✓ Erledigt!“ oder „✓ Plan angelegt“ erscheinen nur, wenn saveS() wirklich gespeichert hat.
//
//   H1 (v1.5.425)  Speicher voll: kein „✓“, und der Speicher meldet sich selbst; danach mit freiem Speicher wieder „✓“.
//   H2 (v1.5.425)  Quelltext: Keine Meldung mit „✓“ folgt mehr einem ungeprüften saveS() im selben Block
//                  (Ausnahme „Backup ✓“: Der Download hat geklappt, auch wenn das Datum dazu nicht gespeichert wurde).
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
  const toasts = [];
  w.toast = (t) => toasts.push(String(t));
  return { w, errors, toasts, E: (s) => w.eval(s) };
}

(async () => {
  const fehler = [];
  let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const a = await starte();

  // H1 · Speicher voll, dann wieder frei
  {
    a.E(`S._seedlingProtocolShown = true; S.cycles = []; S.entries = {};
      window.__c = addCyc({ name: 'Haken', startDate: isoPlus(todayISO(), -20), seedType: 'auto', growType: 'indoor', medium: 'erde', potSize: 11,
        plantCount: 1, startMethod: 'direct', fertPlanId: _planFuerVorlage('rainbow_auto') }, { still: true }); saveS(); 'ok'`);
    const vorher = a.toasts.length;
    a.E(`window.__orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function () { const e = new DOMException('voll', 'QuotaExceededError'); throw e; };
      markTodayDone(__c.id, isoPlus(todayISO(), -2)); setWeightModeFinger(__c); 'ok'`);
    const voll = a.toasts.slice(vorher);
    pruefe(!voll.some(t => /✓/.test(t)), 'H1-1 Speicher voll: trotzdem „✓“ gemeldet: ' + JSON.stringify(voll));
    pruefe(voll.some(t => /NICHT gespeichert|Nicht gespeichert|Speicher voll/i.test(t)) || a.E('!!document.querySelector("[id*=fehler i], [id*=band i]")'),
      'H1-2 Speicher voll: weder Meldung noch Band: ' + JSON.stringify(voll));
    const nachher = a.toasts.length;
    a.E(`Storage.prototype.setItem = window.__orig; markTodayDone(__c.id, isoPlus(todayISO(), -1)); 'ok'`);
    const frei = a.toasts.slice(nachher);
    pruefe(frei.some(t => /✓ Erledigt/.test(t)), 'H1-3 Speicher wieder frei: kein „✓ Erledigt“: ' + JSON.stringify(frei));
  }

  // H2 · Quelltext: kein ungeprüftes saveS() vor einer „✓“-Meldung im selben Block
  {
    const z = HTML.split(/\r?\n/);
    const einr = (l) => l.match(/^\s*/)[0].length;
    const offen = [];
    for (let i = 0; i < z.length; i++) {
      if (!/\btoast\(/.test(z[i]) || !/✓/.test(z[i]) || /^\s*\/\//.test(z[i]) || /if \(_gesichert\)|if \(saveS\(\)\)/.test(z[i])) continue;
      let j = -1;
      for (let k = i - 1; k >= Math.max(0, i - 12); k--) {
        if (/^\s*(async )?function /.test(z[k])) break;
        if (/^\s*saveS\(\);/.test(z[k])) { j = k; break; }
      }
      if (j < 0 || einr(z[i]) < einr(z[j])) continue;
      let gleicherBlock = true;
      for (let k = j + 1; k < i; k++) if (/^\s*\}/.test(z[k]) && einr(z[k]) < einr(z[j])) gleicherBlock = false;
      if (gleicherBlock && !/Backup ✓/.test(z[i])) offen.push(z[i].trim().slice(0, 80));
    }
    pruefe(offen.length === 0, `H2 ${offen.length} „✓“-Meldungen nach ungeprüftem saveS(): ` + offen.slice(0, 4).join(' | '));
  }

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_haekchen: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_haekchen: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_haekchen abgebrochen:', (e && e.stack) || e); process.exit(1); });
