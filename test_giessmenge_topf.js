/**
 * (v1.5.205) Gießmenge aus dem Topf — Abnahmetest nach der Gießmengen-Prüfung (Runde 3, Schritte 6–8).
 *
 * Gemessen wird, was die Prüfer mit ihrem Prototyp (proto12) in beiden Zeitzonen gemessen haben:
 *   B  frische Zyklen (M10): keine fallenden Tage ab Tag 22, kein Tagessprung über 15 %, Plateau 11 L 3000 ml, 7 L 2350,
 *      20 L 4050, Coco 1000, Gießabstand 4 → 3750 (= Nachfüll-Grenze V)
 *   C  Patricks echte Blüte-Güsse (M11): Vorschlag am Morgen im Mittel höchstens 8 % neben seinem Guss (vorher 15,6 %)
 *   D  Drain nach „Erledigt" zählt: 0 % Drain → +21 %, 40 % Drain → −25 %
 *   E  Messung heute: Hebe-Test 70/50/30/20 → 1500/2500/3500/4000 ml (11 L Erde), Waage 12500/11000 g → 1800/3650 ml
 *   F  Anzeigen erklären dieselbe Zahl: Lern-Status mit Quelle und Nachfüll-Grenze, kein Regler „Sanft/Auto/Steil",
 *      Gieß-Guide „höchstens ~V ml/Guss" statt des alten Deckels
 *   G  unverändert: Sämlingsrampe bis Tag 21
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

async function load(ohneSicherung) {
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
      if (!ohneSicherung) w.localStorage.setItem('growsmart_v4', BACKUP);
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
async function abschnitt(titel, fn) {
  console.log('\n' + titel);
  try { await fn(); } catch (e) { pruef(titel + ' — lief ohne Fehler', false, String(e && e.message || e).slice(0, 200)); }
}

// Frischer Zyklus im Seiten-Kontext (wie die Messung M10).
const NEU = `function neuerZyklus(cfg) {
  S.cycles = []; S.entries = {};
  const c = addCyc({ name: 'K', seedType: cfg.seed || 'auto', medium: cfg.medium || 'erde', bloomDays: cfg.bloom || 60 });
  c.startDate = '2026-01-01'; c.potSize = cfg.pot || 11; c.anzuchtDays = cfg.anz || 21; c.bloomDays = cfg.bloom || 60;
  const n = cfg.n || 1;
  c.plants = Array.from({ length: n }, (_, i) => ({ id: 'p' + i, name: 'P' + (i + 1) })); c.plantCount = n; c.scaleByPlants = true;
  if (cfg.intBloom) c.intBloom = cfg.intBloom;
  if (cfg.bloomStartTag) c.bloomStartDate = isoPlus(c.startDate, cfg.bloomStartTag - 1);
  saveS();
  return c;
}`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  // ---------------------------------------------------------------- A, B, D, E, G: frische Zyklen
  {
    const { E, errors } = await load(true);
    E(`setDebugDate('2026-01-01')`);
    E(`window.neuerZyklus = ${NEU}`);

    await abschnitt('A - Bausteine', async () => {
      const r = JSON.parse(E(`(function(){ const aus = {};
        [['Erde 11 L', 'erde', 11], ['Erde 7 L', 'erde', 7], ['Erde 20 L', 'erde', 20], ['Coco 11 L', 'coco', 11]].forEach(function (x) {
          const c = neuerZyklus({ medium: x[1], pot: x[2] }); aus[x[0]] = Math.round(nachfuellGrenze(c, '2026-03-01', null)); });
        aus.E1 = klimaTranspiration(1);
        const reihe = [0.2, 0.5, 0.8, 1.0, 1.2, 1.5, 1.95].map(klimaTranspiration);
        aus.monoton = reihe.every(function (v, i) { return i === 0 || v > reihe[i - 1]; });
        const c = neuerZyklus({}); const pk = phase('2026-03-01', c);
        const f = function (cd) { const b = gussBefund(c, cd, pk); return b ? b.art : null; };
        aus.befund = [f({ water: '3000', drainMl: '500' }), f({ water: '3000', runoffEc: '1.4' }), f({ water: '3000', runoffEc: '1.4', _suggested: { water: true } }),
          f({ water: '3000' }), f({ water: '3000', _suggested: { water: true } })];
        S.entries['2026-02-01'] = { temp: '24', humidity: '55', cycleData: {} }; S.entries['2026-02-02'] = { temp: '26', humidity: '45', cycleData: {} };
        aus.klimaMittel = klimaMittelGemessen(c, '2026-01-31', '2026-02-02');
        aus.klima26 = klimaTranspiration(calcVPD(26, 45));
        return JSON.stringify(aus); })()`));
      pruef('Nachfüll-Grenze V: 11 L Erde 3750, 7 L 2386, 20 L 6818, Coco 11 L 2000',
        r['Erde 11 L'] === 3750 && r['Erde 7 L'] === 2386 && r['Erde 20 L'] === 6818 && r['Coco 11 L'] === 2000, JSON.stringify(r));
      pruef('Klima: E(1 kPa) = 1, steigt bis 1,95 kPa', Math.abs(r.E1 - 1) < 1e-9 && r.monoton, r.E1 + ' / ' + r.monoton);
      pruef('Befund: Drain-Menge → drain, Drain-EC → drainwerte, übernommen + Drain-EC → echo, getippt → guss, übernommen → null',
        JSON.stringify(r.befund) === JSON.stringify(['drain', 'drainwerte', 'echo', 'guss', null]), JSON.stringify(r.befund));
      pruef('Klima-Mittel zählt das Vorlagenpaar 24/55 nicht', Math.abs(r.klimaMittel - r.klima26) < 1e-9, r.klimaMittel + ' / ' + r.klima26);
    });

    await abschnitt('B - Frische Zyklen: Kennlinien (M10)', async () => {
      const cfgs = [
        { name: 'Erde 11 L Auto 42', bloom: 42, ende: 3000 }, { name: 'Erde 11 L Auto 60', bloom: 60, ende: 3000 },
        { name: 'Erde 11 L Auto 85', bloom: 85, ende: 3000 }, { name: 'Erde 11 L Auto 105', bloom: 105, ende: 3000 },
        { name: 'Coco 11 L Auto 60', medium: 'coco', bloom: 60, ende: 1000 },
        { name: 'Photo Erde Vegi 42 + Blüte 63', seed: 'fem', anz: 42, bloom: 63, ende: 3000 },
        { name: 'Photo Erde, Blütestart Tag 36', seed: 'fem', bloom: 63, bloomStartTag: 36, ende: 3000 },
        { name: 'Erde 20 L Auto 60', pot: 20, bloom: 60, ende: 4050 }, { name: 'Erde 7 L Auto 60', pot: 7, bloom: 60, ende: 2350 },
        { name: 'Erde 11 L Auto 60, 3 Pflanzen', bloom: 60, n: 3, ende: 3000 }, { name: 'Erde 11 L Auto 85, Gießabstand 4', bloom: 85, intBloom: 4, ende: 3750 },
      ];
      const fehler = [];
      for (const cfg of cfgs) {
        const r = JSON.parse(E(`(function(){ const cfg = ${JSON.stringify(cfg)}; const c = neuerZyklus(cfg);
          const rows = []; const ende = anzuchtLenFor(c) + cfg.bloom;
          for (let d = 21; d <= ende; d++) { const iso = isoPlus(c.startDate, d - 1); setDebugDate(iso); const p = phase(iso, c); if (!p) continue;
            const g = (typeof gussMengeJePflanze === 'function') ? gussMengeJePflanze(c, p, iso) : null; rows.push({ d: d, m: Math.round(waterSuggestion(c, p, iso) / (cfg.n || 1)), k: g ? startkurve(c, d, iso, p.ph) : null }); }
          return JSON.stringify(rows); })()`));
        let sprung = 0, bei = '', fallend = 0;
        for (let i = 2; i < r.length; i++) {
          const a = r[i - 1].m, b = r[i].m;
          if (b < a) fallend++;
          // Sprünge an der ungerundeten Startkurve: Gerundet auf 50 ml wirkt 650 → 750 ml wie 15,4 %, die Kurve darunter steigt um rund 10 %.
          const ka = r[i - 1].k != null ? r[i - 1].k : a, kb = r[i].k != null ? r[i].k : b;
          if (ka > 0 && kb > 0 && Math.abs(kb - ka) / ka * 100 > Math.abs(sprung)) { sprung = (kb - ka) / ka * 100; bei = 'T' + r[i].d + ' ' + Math.round(ka) + '→' + Math.round(kb); }
        }
        const last = r[r.length - 1].m;
        if (fallend > 0 || Math.abs(sprung) > 15.0001 || last !== cfg.ende) fehler.push(`${cfg.name}: fallend ${fallend}, Sprung ${sprung.toFixed(1)} % (${bei}), Ende ${last} statt ${cfg.ende}`);
        console.log(`    ${cfg.name}: fallend ${fallend} · größter Sprung ${sprung.toFixed(1)} % (${bei}) · Ende ${last}`);
      }
      pruef('Elf frische Zyklen: keine fallenden Tage, kein Sprung über 15 % (ungerundete Startkurve), Plateau wie gemessen', fehler.length === 0, fehler.join(' | '));
    });

    await abschnitt('D - Drain nach „Erledigt" zählt', async () => {
      const r = JSON.parse(E(`(function(){ const c = neuerZyklus({ bloom: 85 });
        const d0 = isoPlus(c.startDate, 89), d1 = isoPlus(c.startDate, 92);
        const lauf = function (drainAnteil) {
          S.entries = {}; const menge = 3000;
          S.entries[d0] = { cycleData: {} }; S.entries[d0].cycleData[c.id] = { water: String(menge), _suggested: { water: true } };
          if (drainAnteil != null) S.entries[d0].cycleData[c.id].drainMl = String(Math.round(menge * drainAnteil));
          setDebugDate(d1); return waterSuggestion(c, phase(d1, c), d1); };
        return JSON.stringify({ null0: lauf(0), vierzig: lauf(0.4), ziel: lauf(0.175) }); })()`));
      pruef('„Erledigt" mit 3000 ml und 0 % Drain → nächster Vorschlag 3650 ml (+21 %)', r.null0 === 3650, JSON.stringify(r));
      pruef('„Erledigt" mit 40 % Drain → 2250 ml (−25 %)', r.vierzig === 2250, JSON.stringify(r));
      pruef('„Erledigt" mit 17,5 % Drain → 3000 ml bestätigt', r.ziel === 3000, JSON.stringify(r));
    });

    await abschnitt('E - Messung heute', async () => {
      const r = JSON.parse(E(`(function(){ const c = neuerZyklus({ bloom: 85 });
        const d0 = isoPlus(c.startDate, 89), d1 = isoPlus(c.startDate, 92);
        const mit = function (feld, wert) {
          S.entries = {}; S.entries[d0] = { cycleData: {} }; S.entries[d0].cycleData[c.id] = { water: '3000' };
          S.entries[d1] = { cycleData: {} }; S.entries[d1].cycleData[c.id] = {}; if (feld) S.entries[d1].cycleData[c.id][feld] = String(wert);
          setDebugDate(d1); return waterSuggestion(c, phase(d1, c), d1); };
        const hebe = [70, 50, 30, 20].map(function (v) { return mit('restPct', v); });
        c.weightMode = 'scale'; c.saturatedWeight = 14000; c.dryWeight = 11000;
        const waage = [12500, 11000].map(function (g) { return mit('weightG', g); });
        c.weightMode = 'lift'; c.saturatedWeight = null; c.dryWeight = null; c.medium = 'coco'; c.intBloom = 1;
        // Coco wird täglich gegossen: gestern 1000 ml — unter der Nachfüll-Grenze, damit der Knopf wirken kann.
        const dC = isoPlus(d1, -1);
        const mitC = function (wert) { S.entries = {}; S.entries[dC] = { cycleData: {} }; S.entries[dC].cycleData[c.id] = { water: '1000' };
          S.entries[d1] = { cycleData: {} }; S.entries[d1].cycleData[c.id] = {}; if (wert != null) S.entries[d1].cycleData[c.id].restPct = String(wert);
          setDebugDate(d1); return waterSuggestion(c, phase(d1, c), d1); };
        const coco = { ohne: mitC(null), k70: mitC(70), k50: mitC(50) };
        return JSON.stringify({ hebe: hebe, waage: waage, coco: coco }); })()`));
      pruef('Erde, Hebe-Test 70/50/30/20 → 1500/2500/3500/4000 ml', JSON.stringify(r.hebe) === JSON.stringify([1500, 2500, 3500, 4000]), JSON.stringify(r.hebe));
      pruef('Waage voll 14000 / Gießpunkt 11000: 12500 g → 1800 ml, 11000 g → 3650 ml je Topf', JSON.stringify(r.waage) === JSON.stringify([1800, 3650]), JSON.stringify(r.waage));
      pruef('Coco, gestern 1000 ml: Knopf „Mittel" (70) ändert nichts, 50 % hebt auf 1650 ml (× 1,67)', r.coco.ohne === 1000 && r.coco.k70 === 1000 && r.coco.k50 === 1650, JSON.stringify(r.coco));
    });

    await abschnitt('G - Unverändert: Sämlingsrampe bis Tag 21', async () => {
      const r = JSON.parse(E(`(function(){ const c = neuerZyklus({ bloom: 60 }); const m = function (d) { const iso = isoPlus(c.startDate, d - 1); setDebugDate(iso); return waterSuggestion(c, phase(iso, c), iso); };
        return JSON.stringify({ t10: m(10), t21: m(21) }); })()`));
      pruef('Tag 10 150 ml, Tag 21 550 ml', r.t10 === 150 && r.t21 === 550, JSON.stringify(r));
    });
    pruef('Frische Zyklen ohne JS-Fehler', errors.length === 0, errors.slice(0, 2).join(' | '));
  }

  // ---------------------------------------------------------------- C, F: Patricks Daten
  {
    const { E, errors } = await load(false);
    await abschnitt('C - Patricks echte Blüte-Güsse (M11)', async () => {
      const r = JSON.parse(E(`(function(){ const c = S.cycles.find(function (x) { return x.active; }) || S.cycles[0]; const zeilen = [];
        Object.keys(S.entries).sort().forEach(function (iso) {
          const cd = S.entries[iso].cycleData && S.entries[iso].cycleData[c.id]; const ml = cd ? parseFloat(cd.water) : NaN;
          if (!(ml > 0)) return; const p = phase(iso, c); if (!p || p.ph !== 'bloom') return;
          if (cd._suggested && cd._suggested.water) return;
          const n = Math.min(parseInt(cd.plantsAtWatering) || getEffectivePlantCount(c, iso), _plantsCap(c)) || getEffectivePlantCount(c, iso);
          const saved = S.entries[iso].cycleData[c.id]; delete S.entries[iso].cycleData[c.id]; setDebugDate(iso);
          const vorschlag = Math.round(waterSuggestion(c, p, iso) / getEffectivePlantCount(c, iso));
          S.entries[iso].cycleData[c.id] = saved; zeilen.push({ iso: iso, ist: ml / n, v: vorschlag }); });
        return JSON.stringify(zeilen); })()`));
      const abw = r.map(z => (z.v - z.ist) / z.ist * 100);
      const mittel = abw.reduce((a, b) => a + b, 0) / abw.length, betrag = abw.map(Math.abs).reduce((a, b) => a + b, 0) / abw.length;
      console.log(`    ${r.length} echte Güsse · mittel ${mittel.toFixed(1)} % · Betrag ${betrag.toFixed(1)} %`);
      pruef('Prüflage: über 20 echte Blüte-Güsse', r.length >= 20, r.length);
      pruef('Vorschlag am Morgen im Mittel höchstens 8 % neben Patricks Guss (vorher 15,6 %)', betrag <= 8, betrag.toFixed(1) + ' %');
    });

    await abschnitt('F - Anzeigen erklären dieselbe Zahl', async () => {
      E(`S.beginnerMode = false; S._setUI = S._setUI || {}; S._setUI.entryLern = false`);
      const d = E(`(function(){ const c = S.cycles[0]; for (let i = 60; i < 100; i++) { const x = isoPlus(c.startDate, i - 1); if (getAction(x, c) === 'giess') return x; } return null; })()`);
      E(`(function(){ const c = S.cycles[0]; const cd = S.entries['${d}'] && S.entries['${d}'].cycleData[c.id]; if (cd) { delete cd.water; delete cd._suggested; } setDebugDate('${d}'); openEntry('${d}'); })()`);
      await warte(200);
      const t = E(`document.getElementById('scr-entry').textContent.replace(/\\s+/g, ' ')`);
      const g = JSON.parse(E(`JSON.stringify(gussMengeJePflanze(S.cycles[0], phase('${d}', S.cycles[0]), '${d}'))`));
      pruef('Lern-Status: Menge, Quelle und „Höchstens ~V ml — mehr passt nicht in den Topf"', !!g && t.includes(`Höchstens ~${g.V} ml — mehr passt nicht in den Topf`) && /~\d+ ml\/Pflanze aus deine/.test(t),
        (t.match(/Lern-Status.{0,260}/) || ['(fehlt)'])[0]);
      pruef('Kein Regler „Verlauf: Sanft · Auto · Steil" im Eintrag', !/Verlauf:\s*Sanft/.test(t) && !/Steil/.test(t));
      pruef('Gieß-Guide: „höchstens ~V ml/Guss" statt „max ~1500 ml/Guss"', !!g && t.includes(`höchstens ~${g.V} ml/Guss`) && !/max ~\d+ ml\/Guss/.test(t), (t.match(/11L · .{0,60}/) || ['(fehlt)'])[0]);
      E(`renderTips()`);
      const tipps = E(`document.getElementById('tips-body').textContent.replace(/\\s+/g, ' ')`);
      pruef('Tipps: „Die Menge kommt aus dem Topf", ohne Regler', /Die Menge kommt aus dem Topf/.test(tipps) && !/Sanft · Auto · Steil/.test(tipps));
      const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
      pruef('Hilfe ohne „Sanft, Auto oder Steil"', !code.includes('Sanft, Auto oder Steil') && !code.includes('Verlauf: Sanft · Auto · Steil'));
    });
    pruef('Patricks Daten ohne JS-Fehler', errors.length === 0, errors.slice(0, 2).join(' | '));
  }

  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
