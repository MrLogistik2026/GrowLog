// (v1.5.346) Der Spülstart rastet beim Sichern ein, nicht erst beim nächsten Start — und eine eigene Wahl bleibt stehen.
//
// Vorher lief _snapFlushToRhythm bei jedem App-Start: Blüte 60 → 67 in den Einstellungen zeigte Ernte 17.11. (erster
// Spülguss einen Tag nach dem letzten Düngerguss), nach dem nächsten Öffnen stand still 19.11. da. Ein von Hand gesetzter
// Spülstart („Tag 80") sprang beim nächsten Öffnen auf Tag 82 zurück. Der Test startet die App wirklich neu — mit dem
// gespeicherten Stand im Browser-Speicher, so wie das Handy am nächsten Morgen.
//
// GS_INDEX=<anderer Build> lässt ihn gegen einen alten Stand laufen; dort muss er umfallen.
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

async function starte(speicher) {
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
      Object.keys(speicher || {}).forEach(k => w.localStorage.setItem(k, speicher[k]));
    },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  const toasts = [];
  w.toast = (t) => toasts.push(String(t));
  w.customConfirm = () => Promise.resolve(true);
  return {
    w, errors, toasts,
    E: (s) => w.eval(s),
    speicher: () => { const o = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; },
  };
}
const zustand = (a) => JSON.parse(a.E(`(function(){ const c = S.cycles[0]; const e = endspurtState(c, todayISO());
  return JSON.stringify({ bloom: c.bloomDays, lg: e.letzterGuss, iv: e.iv, sp: e.spuelStart, ernte: e.ernteTag, fest: !!c._spuelStartFest }); })()`));

(async () => {
  const fehler = [];
  const pruefe = (ok, text) => { if (!ok) fehler.push(text); };

  // Ausgangslage wie die Lehrbuch-Lage „bluete6": Automatic, Erde, 11 L, BioBizz Light, heute Blütetag 38.
  const a = await starte({});
  a.E(`S.cycles = []; S.entries = {}; S.fertPlans = []; S._activePlanId = null;
    S._disclaimerAcceptedAt = Date.now(); S._welcomeSeen = true; S._modeAsked = true; S._seedlingProtocolShown = true;
    const pid = _planFuerVorlage('biobizz_light');
    addCyc({ name: 'Prüfzyklus', startDate: isoPlus(todayISO(), -58), seedType: 'auto', growType: 'indoor', medium: 'erde',
      potSize: 11, plantCount: 2, startMethod: 'direct', fertPlanId: pid }, { still: true });
    saveS._lastUndo = 0; saveS();`);
  const s0 = zustand(a);
  pruefe(s0.sp === s0.lg + s0.iv, `Ausgangslage nicht im Rhythmus: letzter Guss ${s0.lg}, Spülen ${s0.sp}`);

  // A · Blüte in den Einstellungen um 7 Tage verlängern
  await a.E(`(async function(){ const c = S.cycles[0]; selId = c.id; draft = { ...c }; draftTouched = {};
    draft.bloomDays = c.bloomDays + 7; draftTouched.bloomDays = true; await saveDraft(); })()`);
  await new Promise((r) => setTimeout(r, 60));
  const sA = zustand(a);
  pruefe(sA.sp === sA.lg + sA.iv, `A1 nach dem Sichern liegt der erste Spülguss ${sA.sp - sA.lg} Tag(e) nach dem letzten Düngerguss (Rhythmus ${sA.iv})`);
  pruefe(sA.ernte > s0.ernte + 6, `A2 Ernte rückt nicht nach hinten (${s0.ernte} → ${sA.ernte})`);
  const tA = a.toasts.find(t => /gespeichert/.test(t)) || '';
  pruefe(sA.bloom === s0.bloom + 7 || /statt/.test(tA), `A3 Blüte ${sA.bloom} statt ${s0.bloom + 7}, aber die Meldung sagt es nicht: „${tA}"`);
  const b = await starte(a.speicher());
  const sB = zustand(b);
  pruefe(sB.bloom === sA.bloom && sB.sp === sA.sp && sB.ernte === sA.ernte,
    `A4 nach dem Neustart anders als nach dem Sichern: Blüte ${sA.bloom}→${sB.bloom}, Spülen ${sA.sp}→${sB.sp}, Ernte ${sA.ernte}→${sB.ernte}`);

  // B · Spülstart von Hand auf den Tag nach dem letzten Guss
  const ziel = sB.lg + 1;
  b.w.customInput = () => Promise.resolve(String(ziel));
  await b.E(`setEndspurtSpuelStart(S.cycles[0].id)`);
  await new Promise((r) => setTimeout(r, 60));
  const sB2 = zustand(b);
  pruefe(sB2.sp === ziel, `B1 Spülstart nicht auf Tag ${ziel} gesetzt (${sB2.sp})`);
  const c = await starte(b.speicher());
  const sC = zustand(c);
  pruefe(sC.sp === ziel, `B2 eigener Spülstart nach dem Neustart verschoben: Tag ${ziel} → ${sC.sp}`);
  pruefe(sC.fest, 'B3 eigene Wahl nicht gekennzeichnet (_spuelStartFest)');

  // C · Danach die Blüte in den Einstellungen ändern: die Kette ist neu, die Regel gilt wieder
  await c.E(`(async function(){ const c = S.cycles[0]; selId = c.id; draft = { ...c }; draftTouched = {};
    draft.bloomDays = c.bloomDays + 2; draftTouched.bloomDays = true; await saveDraft(); })()`);
  await new Promise((r) => setTimeout(r, 60));
  const sC2 = zustand(c);
  pruefe(!sC2.fest, 'C1 Kennzeichen bleibt nach neuer Blütedauer stehen');
  pruefe(sC2.sp === sC2.lg + sC2.iv, `C2 nach neuer Blütedauer nicht im Rhythmus (letzter Guss ${sC2.lg}, Spülen ${sC2.sp})`);

  // D · Die Regel beim Start wirkt weiter, wo niemand selbst gewählt hat (Rhythmus verschoben, ohne Kennzeichen)
  c.E(`(function(){ const c = S.cycles[0]; delete c._spuelStartFest; const e = endspurtState(c, todayISO());
    c.bloomDays = c.bloomDays - (e.spuelStart - e.letzterGuss) + 1; saveS(); })()`);
  const sD0 = zustand(c);
  pruefe(sD0.sp === sD0.lg + 1, `D0 Vorbereitung: Spülen nicht direkt nach dem Guss (${sD0.lg} / ${sD0.sp})`);
  const d = await starte(c.speicher());
  const sD = zustand(d);
  pruefe(sD.sp === sD.lg + sD.iv, `D1 Start rastet einen verschobenen Spülstart nicht mehr ein (${sD.lg} / ${sD.sp})`);

  // E · „Plan nachziehen — Ernte Tag N" bleibt nach dem Neustart bei Tag N
  const zielErnte = sD.ernte + 1;
  await d.E(`shiftPlanToDay(S.cycles[0].id, ${zielErnte}, true)`);
  await new Promise((r) => setTimeout(r, 60));
  const sE0 = zustand(d);
  pruefe(sE0.ernte === zielErnte, `E0 Ernte nicht auf Tag ${zielErnte} gesetzt (${sE0.ernte})`);
  const e = await starte(d.speicher());
  const sE = zustand(e);
  pruefe(sE.ernte === zielErnte, `E1 gewählter Erntetag nach dem Neustart verschoben: Tag ${zielErnte} → ${sE.ernte}`);

  const alle = [a, b, c, d, e].flatMap(x => x.errors);
  pruefe(!alle.length, 'Skriptfehler: ' + alle.slice(0, 3).join(' | '));
  const n = 15;
  if (fehler.length) { console.log(`test_spuelrast: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_spuelrast: alle ${n} Prüfungen grün`, JSON.stringify({ s0, sA, sB, sC, sD, sE }));
  process.exit(0);
})().catch((e) => { console.log('test_spuelrast abgebrochen:', e && e.stack || e); process.exit(1); });
