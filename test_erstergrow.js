// Die Einsteiger-Anleitung „Dein erster Grow" (FIRST_GROW_STEPS) gegen ANBAU.md und gegen die App selbst.
// Die Anleitung war in keiner der Textprüfungen Prüfgegenstand (gefunden beim Bau von v1.5.390). Die Ersatztexte hat vor dem
// Einbau ein Prüfer Satz für Satz gegen ANBAU.md und den Code gehalten (08.10.2026).
//
//   S2 (v1.5.393)  Keimen und Einpflanzen folgen der Start-Methode der App: Erde vorbefeuchten, Start-Guss, Samen danach.
//   S4 (v1.5.394)  Anzucht: Licht über die Lichtmenge, zwei Lichtschäden, Gießen nach der Start-Methode, Dünger nach Plan.
//   S5 (v1.5.395)  Wachstum: Gießen, Dünger nach Plan mit pH, Toppen wie die App, Automatics nicht umtopfen.
//   S6 (v1.5.396)  Blüte: Titel, Dunkelphase, Stickstoff, Schimmel-Deckel aus KLIMA_ZIEL.
//   S7 (v1.5.397)  Ernte: eigenes Bernstein-Ziel und Klar-Grenze aus der App, Messort, Spülen ehrlich, Schnitt im Dunkeln.
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

  // S4 (v1.5.394) · Anzucht: Licht über die Lichtmenge, zwei Lichtschäden, Gießen nach der Start-Methode, Dünger nach Plan
  {
    const s4 = schritt(3);
    pruefe(!/30–40 cm/.test(s4) && /PPFD/.test(s4) && /150–300/.test(s4) && /400–600/.test(s4), `S4-1 Lichtabstand fest statt über die Lichtmenge (ANBAU.md 8): ${s4.slice(0, 260)}`);
    pruefe(/Handtest zeigt nur Hitze/.test(s4) && /ausbleich/.test(s4) && /zu heiß/.test(s4), 'S4-2 Lichtschaden: Bleichen und Hitze nicht unterschieden (ANBAU.md 8.2)');
    pruefe(/nur sprühen/.test(s4) && /Ring um den Sämling/.test(s4) && !/Oberste Erde darf/.test(s4), 'S4-3 Gießen folgt nicht der Start-Methode der App');
    pruefe(!/KEINER/.test(s4) && /höchstens die kleinen Mengen, die dein Plan nennt/.test(s4), 'S4-4 Dünger: „KEINER" gegen die eigene Einsteiger-Vorlage');
  }

  // S5 (v1.5.395) · Wachstum: Gießen, Dünger nach Plan mit pH, Toppen wie die App, Automatics nicht umtopfen
  {
    const s5 = schritt(4);
    const ph = a.E(`phTargetFor('erde').labelComma`);
    pruefe(/Tag 25/.test(s5) && /anheben/.test(s5), 'S5-1 Gießen: Gießtage der App bis Tag 25, danach der Topf');
    pruefe(!/Halbe Dosis/i.test(s5) && /Düngeplan/.test(s5) && s5.includes(ph), `S5-2 Dünger: „Halbe Dosis" statt Plan, oder pH ${ph} fehlt`);
    pruefe(/trockenem Topf eher für Durst/.test(s5), 'S5-3 braune Spitzen ohne Unterscheidung (Regel 3)');
    pruefe(!/5–6 Blattetagen/.test(s5) && /4–5 Blattpaaren/.test(s5) && /Automatics ist das Fenster kurz/.test(s5) && /vor dem Blühbeginn/.test(s5), 'S5-4 Toppen widerspricht der App (INFO_TERMS, canTop)');
    pruefe(/Automatics gar nicht umtopfen/.test(s5) && !/Keine Umtopfung mehr ab Woche 4/.test(s5), 'S5-5 Umtopfen bei Automatics (ANBAU.md 7.4)');
  }

  // S6 (v1.5.396) · Blüte: Titel, Dunkelphase, Stickstoff, Schimmel-Deckel aus KLIMA_ZIEL
  {
    const s6 = schritt(5);
    const dk = JSON.parse(a.E(`JSON.stringify([KLIMA_ZIEL.frueh.deckel, KLIMA_ZIEL.spaet.deckel])`));
    pruefe(!/Woche 6–12/.test(titel[5]) && !/6–10 Wochen/.test(titel[5]), `S6-1 Titel/Dauer: ${titel[5]}`);
    pruefe(/wirklich dunkel/.test(s6), 'S6-2 keine Warnung vor Licht in der Dunkelphase (ANBAU.md 13.8)');
    pruefe(!/weniger Stickstoff/.test(s6) && /Stickstoff braucht die Pflanze bis weit in die Blüte/.test(s6), 'S6-3 Stickstoff zum Blühbeginn (ANBAU.md 5)');
    pruefe(s6.includes(`höchstens ${dk[0]} %`) && s6.includes(`höchstens ${dk[1]} %`) && /nachts/.test(s6) && !/Unter 60% drücken/.test(s6), `S6-4 Luftfeuchte nicht aus KLIMA_ZIEL (${dk.join('/')})`);
    pruefe(/zwischen den Blüten/.test(s6), 'S6-5 Luftbewegung an den Blüten fehlt (ANBAU.md 13.5)');
    pruefe(!/Woche 7\+/.test(s6) && !/Woche 3: Erste/.test(s6), 'S6-6 feste Wochen für Härchen und Trichome');
    const kopf = a.E(`(function(){ openFirstGrowGuide(); const o = document.querySelector('[data-firstgrow]'); const k = o ? o.textContent : '';
      document.querySelectorAll('[data-firstgrow]').forEach(x => x.remove()); return k; })()`);
    pruefe(!/~3–4 Monate/.test(kopf) && /4–6 Monate/.test(kopf), 'S6-7 Kopf der Anleitung: Gesamtdauer zu kurz (ANBAU.md 9)');
  }

  // S7 (v1.5.397) · Ernte: eigenes Bernstein-Ziel und Klar-Grenze aus der App, Messort, Spülen ehrlich, Schnitt im Dunkeln
  {
    const s7 = schritt(6);
    const z = JSON.parse(a.E(`JSON.stringify([RIPE_CLEAR_DONE, TRICH_TARGET_DEFAULT])`));
    pruefe(!/80% milchig|10–20% bernstein/.test(s7) && s7.includes(`höchstens ${z[0]} % klar`) && s7.includes(`${z[1]} %`), `S7-1 feste Bernstein-Menge statt Klar-Grenze ${z[0]} % und Ziel ${z[1]} %`);
    pruefe(/nicht auf den kleinen Blättchen/.test(s7) && /Farbe der Härchen sagt nichts/.test(s7), 'S7-2 Messort und Griffelfarbe fehlen (ANBAU.md 11)');
    pruefe(!/1 Woche vorher/.test(s7) && !/Letzten 2 Tage/.test(s7) && /nicht belegt/.test(s7), 'S7-3 Spülen fest statt nach Plan, oder ohne „nicht belegt" (ANBAU.md 14)');
    pruefe(/Vor dem Lichtangang/.test(s7) && !/größten Qualitätsunterschied/.test(s7), 'S7-4 Schnitt-Zeitpunkt oder unbelegte Qualitätsaussage');
    pruefe(/Lupe zeigt, geht vor/.test(s7), 'S7-5 Messung schlägt Kalender (ANBAU.md 15) fehlt');
  }

  pruefe(!a.errors.length, 'Skriptfehler: ' + a.errors.slice(0, 3).join(' | '));
  if (fehler.length) { console.log(`test_erstergrow: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
  console.log(`test_erstergrow: alle ${n} Prüfungen grün`);
  process.exit(0);
})().catch((e) => { console.log('test_erstergrow abgebrochen:', (e && e.stack) || e); process.exit(1); });
