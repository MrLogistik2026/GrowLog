/**
 * (v1.5.190) Klimazahlen in Texten aus KLIMA_ZIEL.
 *
 * Der Fehler: Seit v1.5.187 rechnet der Tageseintrag mit KLIMA_ZIEL (Patricks Entscheidung, VPD Option B). Lexikon,
 * Tipps-Karte, Diagnose-Texte, Notiz-Vorschläge und Outdoor-Hinweise nannten weiter die alten festen Fenster: Spätblüte
 * 1,4–1,6 kPa bei 18–24 °C und 40–50 % RLF, mittlere Blüte 45–55 %, frühe Blüte 22–26 °C und 50–60 %, Anzucht 55–70 %,
 * Dunkelphase 16–19 °C und 40–50 %, „Richtwert in der Blüte: 0.8–1.2 kPa", „über 1.5 kPa = trocken-Stress". Die Warnung
 * über 80 % RLF sagte „(außer in Trocknung)" — erreichbar war sie nur noch beim Trocknen und im Curing.
 *
 * Geprüft wird gegen dieselben Funktionen, mit denen der Eintrag rechnet, nicht gegen abgeschriebene Zahlen.
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

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}
async function abschnitt(titel, fn) {
  console.log('\n' + titel);
  try { await fn(); } catch (e) { pruef(titel + ' — lief ohne Fehler', false, String(e && e.message || e).slice(0, 160)); }
}
const kurz = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 260);

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`S.leafOffset = 2`);

  // Erwartete Zahlen aus denselben Funktionen, mit denen der Eintrag rechnet (2 K Blattabzug).
  const Z = JSON.parse(E(`(function(){
    const spanne = function (k, T) { const s = klimaStatus(T, 50, ({ saemling: { ph: 'anzucht', day: 5 }, anzucht: { ph: 'anzucht', day: 20 },
      frueh: { ph: 'bloom', bloomDay: 5, bloomLen: 60 }, mittel: { ph: 'bloom', bloomDay: 30, bloomLen: 60 }, spaet: { ph: 'bloom', bloomDay: 50, bloomLen: 60 } })[k], { growType: 'indoor' });
      return _klimaRlfSpanne(s.fenster); };
    return JSON.stringify({ z: KLIMA_ZIEL, saemling24: spanne('saemling', 24), anzucht25: spanne('anzucht', 25), frueh25: spanne('frueh', 25),
      mittel24: spanne('mittel', 24), spaet24: spanne('spaet', 24) }); })()`));
  const band = (k) => Z.z[k].vpd.map(x => String(Math.round(x * 10) / 10).replace('.', ',')).join('–');
  const temp = (k) => Z.z[k].temp.join('–');

  const L = JSON.parse(E(`(function(){ const alle = LEXIKON.flatMap(function (c) { return c.items; });
    const g = function (t) { const i = alle.find(function (x) { return x.t === t; }); return i ? [i.brief, i.mechanism, i.practice, i.pitfall].join(' ') : null; };
    return JSON.stringify({ temp: g('Temperatur'), rlf: g('Luftfeuchtigkeit (RLF)'), vpd: g('VPD (Vapour Pressure Deficit)'), vegi: g('Vegetationsphase'),
      bluete: g('Blüte-Phasen (früh / mittel / spät)'), dunkel: g('Dunkelphase vor der Ernte (24–72 h)'), spuel: g('Spülung (Final-Flush)'),
      botrytis: g('Schimmel (Botrytis)') }); })()`));

  await abschnitt('A - Lexikon „Temperatur"', async () => {
    pruef('Alle Einträge gefunden', Object.values(L).every(Boolean), JSON.stringify(Object.keys(L).filter(k => !L[k])));
    pruef(`Temperaturen aus KLIMA_ZIEL: Sämling ${temp('saemling')}, Anzucht ${temp('anzucht')}, frühe Blüte ${temp('frueh')}, späte Blüte ${temp('spaet')} °C`,
      ['saemling', 'anzucht', 'frueh', 'mittel', 'spaet'].every(k => L.temp.includes(temp(k) + ' °C')), kurz(L.temp));
    pruef('Keine alten Fenster (18–24 °C späte Blüte, 20–24 °C Spülen, DIF 5–8 °C „für Farben/Trichome")',
      !/18–24°C|16–20°C|20–24°C|DIF 5–8/.test(L.temp), kurz(L.temp));
    const faustregel = ['saemling', 'anzucht', 'frueh', 'mittel', 'spaet', 'spuelen', 'ice'].every(k => Z.z[k].temp[0] <= 25 && 25 <= Z.z[k].temp[1]);
    pruef('„25 °C liegt in jeder Phase mit Licht im Ziel" stimmt für die Tabelle', /25 °C liegt in jeder Phase mit Licht im Ziel/.test(L.temp) && faustregel);
  });

  await abschnitt('B - Lexikon „Luftfeuchtigkeit (RLF)" nennt dieselben Spannen wie der Eintrag', async () => {
    pruef(`Späte Blüte bei 24 °C ${Z.spaet24}, mittlere ${Z.mittel24}, frühe bei 25 °C ${Z.frueh25}, Anzucht ${Z.anzucht25}, Sämling bei 24 °C ${Z.saemling24}`,
      L.rlf.includes('bei 24 °C ' + Z.spaet24) && L.rlf.includes('bei 24 °C ' + Z.mittel24) && L.rlf.includes('bei 25 °C ' + Z.frueh25)
      && L.rlf.includes('bei 25 °C ' + Z.anzucht25) && L.rlf.includes('bei 24 °C ' + Z.saemling24), kurz(L.rlf));
    pruef('Deckel 60/65/80 % und Boden 40 % genannt', L.rlf.includes('über 60 %') && L.rlf.includes('über 65 %') && L.rlf.includes('über 80 %') && L.rlf.includes('unter 40 %'), kurz(L.rlf));
    pruef('Keine alten Fenster (65–75, 55–70, 50–60, 45–55, 40–50 % RLF)', !/65–75% RLF|55–70% RLF|50–60% RLF|45–55% RLF|40–50% RLF/.test(L.rlf), kurz(L.rlf));
  });

  await abschnitt('C - Lexikon „VPD"', async () => {
    pruef(`Bänder aus KLIMA_ZIEL: ${band('saemling')} · ${band('anzucht')} · ${band('frueh')} · ${band('mittel')} kPa`,
      ['saemling', 'anzucht', 'frueh', 'mittel', 'spaet'].every(k => L.vpd.includes('VPD ' + band(k) + ' kPa')), kurz(L.vpd));
    pruef('Späte Blüte mit Deckel „höchstens 60 %" und Luftfeuchte wie im Eintrag', L.vpd.includes('höchstens 60 %') && L.vpd.includes('bei 24 °C ' + Z.spaet24));
    pruef('Kein „1.4–1.6" und kein „gezielt auf" mehr', !/1\.4–1\.6|gezielt auf/.test(L.vpd), kurz(L.vpd));
    pruef('Dunkelphase ohne VPD-Ziel', /Dunkelphase, Erntetag:\s*<\/b>\s*kein VPD-Ziel/.test(L.vpd));
  });

  await abschnitt('D - Vegetationsphase, Blüte-Phasen, Dunkelphase, Spülung, Botrytis', async () => {
    pruef('Vegetationsphase: Anzucht-Klima aus KLIMA_ZIEL, kein „Luftfeuchte 50-70 %"',
      L.vegi.includes('Temperatur ' + temp('anzucht') + ' °C') && L.vegi.includes('bei 25 °C ' + Z.anzucht25) && !/Luftfeuchte 50-70 %/.test(L.vegi), kurz(L.vegi));
    pruef('Blüte-Phasen: frühe, mittlere und späte Blüte aus KLIMA_ZIEL, keine alten Zeilen',
      L.bluete.includes('VPD ' + band('frueh') + ' kPa') && L.bluete.includes(temp('frueh') + ' °C') && L.bluete.includes('VPD ' + band('spaet') + ' kPa')
      && !/RLF 50-60 %|VPD 1\.1-1\.4|VPD 1\.2-1\.6|20-24 °C, RLF/.test(L.bluete), kurz(L.bluete));
    pruef('Dunkelphase: kein „16–19 °C ideal", kein „40–50 % RLF", Deckel 60 %',
      !/16–19°C|40–50% RLF|Standard-Blütewerte/.test(L.dunkel) && /höchstens 60 %/.test(L.dunkel), kurz(L.dunkel));
    pruef('Spülung: Klima wie späte Blüte aus KLIMA_ZIEL, kein „20–24 °C, 40–50 % RLF"',
      !/20–24°C, 40–50% RLF/.test(L.spuel) && L.spuel.includes('Luftfeuchte bei 24 °C ' + Z.spaet24), kurz(L.spuel));
    pruef('Botrytis: Luftfeuchte über 60–65 % statt „RLF >60 % in Blüte"', !/RLF >60%/.test(L.botrytis) && /über 60–65 %/.test(L.botrytis), kurz(L.botrytis));
  });

  await abschnitt('E - Tipps-Karte, Diagnose, Outdoor-Hinweise, Warnung beim Trocknen', async () => {
    const r = JSON.parse(E(`(function(){
      const hitze = PROBLEMS.find(function (p) { return p.lexiconKey === 'heat_stress'; });
      let budrot = null;
      SYMPTOMS.forEach(function (s) { (s.causes || []).forEach(function (u) { if (/Graue, watteartige Fäule INNEN/.test(u.heading)) budrot = u; }); });
      const w = getCriticalWarning('rlf', 85, { ph: 'dry' }, { growType: 'indoor' }, 19);
      return JSON.stringify({ tipp: INFO_TERMS.vpd.tip, band: typeof _vpdBandKurz === 'function' ? _vpdBandKurz() : null, hitze: hitze && hitze.action,
        budrotWann: budrot && budrot.when, budrotText: budrot && budrot.text,
        spaetOut: vpdZone(1.0, { ph: 'bloom', bloomDay: 55, bloomLen: 60 }, 'outdoor').hint, saemlingOut: vpdZone(1.0, { ph: 'anzucht', day: 5 }, 'outdoor').hint,
        trocknen: w && w.action }); })()`));
    pruef('VPD-Infotext (INFO_TERMS): Ziele je Phase, kein „Richtwert in der Blüte: 0.8–1.2", kein „riskiert Zwitter"',
      !!r.band && r.tipp.includes(r.band) && !/0\.8–1\.2 kPa<\/b>|Richtung 1\.0–1\.2|riskiert Zwitter/.test(r.tipp), kurz(r.tipp));
    pruef('Diagnose Hitzestress: Temperatur aus KLIMA_ZIEL und Ziel-VPD statt „über 1.5 kPa = trocken-Stress"',
      !!r.hitze && r.hitze.includes(temp('mittel') + ' °C') && r.hitze.includes('1,5 kPa') && !/trocken-Stress/.test(r.hitze), kurz(r.hitze));
    pruef('Knospenfäule: „Luftfeuchte über 60–65 %" und kein „unter 50 % senken"',
      /über 60–65 %/.test(r.budrotWann || '') && !/unter 50% senken/.test(r.budrotText || ''), kurz((r.budrotWann || '') + ' | ' + (r.budrotText || '')));
    pruef('Outdoor-Hinweise: kein „1.4–1.6 kPa ideal", kein „RLF rauf auf 65–75 %"', !/1\.4–1\.6/.test(r.spaetOut) && !/65–75/.test(r.saemlingOut), kurz(r.spaetOut + ' | ' + r.saemlingOut));
    pruef('Warnung 85 % beim Trocknen: ohne „(außer in Trocknung)", mit dem Trockenklima', !!r.trocknen && !/außer in Trocknung/.test(r.trocknen) && /55–62 %/.test(r.trocknen), kurz(r.trocknen));
  });

  await abschnitt('F - Im Quelltext', async () => {
    const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    const alt = ['Tag: 22–28°C, Nacht: 18–22°C', 'über 1.5 kPa = trocken-Stress', 'RLF runter (40–45%)', 'Klima 22–26°C / 45–55% RLF', 'RLF unter 55% halten',
      'RLF rauf auf 65–75%', 'in Spätblüte OK als Premium', 'außer in Trocknung', 'Luftfeuchte unter 50% senken', 'RLF über 55%', '1.4–1.6 kPa ideal',
      'Richtwert in der Blüte: <b>0.8–1.2 kPa</b>', 'Standard-Spätblüte-Werte halten', '16–19°C ideal'].filter(s => code.includes(s));
    pruef('Keine der alten festen Klimazahlen mehr im Code', alt.length === 0, alt.join(' | '));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
