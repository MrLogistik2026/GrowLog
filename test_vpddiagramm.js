/**
 * (v1.5.189) VPD-Diagramm je Phase aus einer Quelle.
 *
 * Der Fehler: buildChartsSection färbte jeden VPD-Punkt gegen fest 0,8–1,2 kPa und schrieb dazu „Grüner Bereich:
 * 0.8–1.2 kPa (Blüte optimal) · Spätblüte: gezielt 1.4–1.6 gegen Schimmel". Seit v1.5.187 gelten je Phase andere Ziele
 * (KLIMA_ZIEL): In der mittleren und späten Blüte war damit jeder Wert im Ziel orange, und die Legende nannte ein Band,
 * das es nicht mehr gibt. Jetzt kommt die Farbe jedes Punkts aus klimaStatus — derselbe Befund wie die Pille im Eintrag.
 *
 * Sichtbar ist der Bereich derzeit nicht: renderDash setzt chartsHTML = '' (in der App-Vorschau nie zuverlässig
 * dargestellt). Der Test hält den abgeschalteten Bereich im Einklang mit KLIMA_ZIEL, damit er beim Wiedereinschalten
 * nicht widerspricht.
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

// Farben der VPD-Balken in Reihenfolge der Punkte, aus dem ausgelieferten HTML gelesen.
function vpdFarben(html) {
  const re = /showChartTooltip\('vpd-[^']*', (\d+), event\)" style="[^"]*background:(var\(--[a-z]+\))/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) out[parseInt(m[1], 10)] = m[2];
  return out;
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { window, E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`S.leafOffset = 2; setDebugDate('2026-09-04')`);

  await abschnitt('A - Jeder Punkt hat die Farbe des Befunds im Eintrag (Patricks Klimatage)', async () => {
    const html = E(`buildChartsSection(S.cycles[0].id)`);
    const farben = vpdFarben(html);
    // Unabhängig vom Diagramm: die Pille, die der Tageseintrag für dieselben Werte zeigt.
    const pillen = JSON.parse(E(`(function(){ const c = S.cycles[0];
      return JSON.stringify(collectVPDSeries(c.id).map(function (p) { const e = S.entries[p.iso];
        const teile = _klimaEntryTeile(e.temp, e.humidity, [c], p.iso);
        const m = teile.vpdBox.match(/id="vpd-p"[^>]*>([^<]*)</);
        return { iso: p.iso, pille: m ? m[1] : null }; })); })()`));
    pruef(`Balken für alle ${pillen.length} Klimatage`, pillen.length > 80 && farben.filter(Boolean).length === pillen.length, `${farben.filter(Boolean).length} Balken`);
    const falsch = [];
    let gruen = 0, orange = 0;
    pillen.forEach((p, i) => {
      const imZiel = /✓$/.test(p.pille || '');
      const soll = imZiel ? 'var(--green)' : 'var(--orange)';
      if (farben[i] === 'var(--green)') gruen++; else if (farben[i] === 'var(--orange)') orange++;
      if (farben[i] !== soll) falsch.push(`${p.iso} Pille „${p.pille}" · Balken ${farben[i]}`);
    });
    pruef('Grün genau dann, wenn die Pille im Eintrag „✓" zeigt', falsch.length === 0, `${falsch.length} Abweichungen: ${falsch.slice(0, 4).join(' | ')}`);
    pruef('Beide Farben kommen vor (kein Einheitsbrei)', gruen > 20 && orange > 10, `grün ${gruen}, orange ${orange}`);
  });

  await abschnitt('B - Legende aus KLIMA_ZIEL', async () => {
    const html = E(`buildChartsSection(S.cycles[0].id)`);
    pruef('Kein festes „0.8–1.2 kPa (Blüte optimal)" und kein „1.4–1.6" mehr', !/0\.8–1\.2 kPa \(Blüte optimal\)/.test(html) && !/1\.4–1\.6/.test(html));
    pruef('Nennt die Ziele je Phase: Sämling 0,4–0,8 · Anzucht 0,8–1,2 · ab mittlerer Blüte 1,2–1,5 kPa',
      /Sämling 0,4–0,8/.test(html) && /Anzucht 0,8–1,2/.test(html) && /ab mittlerer Blüte 1,2–1,5 kPa/.test(html));
    pruef('Farberklärung unter dem Diagramm', /grün = im Ziel der Phase · orange = daneben · türkis = ohne VPD-Ziel/.test(html));
  });

  await abschnitt('C - Tipp auf einen Punkt: Stufe, Befund und Ziel', async () => {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0];
      const box = document.createElement('div'); box.innerHTML = buildChartsSection(c.id); document.body.appendChild(box);
      const pts = collectVPDSeries(c.id); const i = pts.findIndex(function (p) { return p.iso === '2026-08-11'; });
      showChartTooltip('vpd-' + c.id, i, { stopPropagation: function () {}, clientX: 10, clientY: 10 });
      const tt = document.getElementById('chart-tt-vpd-' + c.id);
      const e = S.entries['2026-08-11']; const st = klimaStatus(parseFloat(e.temp), parseFloat(e.humidity), phase('2026-08-11', c), c);
      const out = { i: i, text: tt ? tt.textContent.replace(/\\s+/g, ' ').trim() : null, pille: _klimaPille(st).label };
      box.remove(); return JSON.stringify(out); })()`));
    pruef('11.08.: Tooltip nennt „Späte Blüte", den Befund aus dem Eintrag und das Ziel 1,2–1,5 kPa',
      r.i >= 0 && !!r.text && /Späte Blüte/.test(r.text) && r.text.includes(r.pille) && /Ziel 1,2–1,5 kPa/.test(r.text), JSON.stringify(r));
  });

  await abschnitt('D - Dunkelphase und draußen: ohne VPD-Ziel', async () => {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0]; const D = '2026-09-07';
      const vorher = S.entries[D];
      S.entries[D] = Object.assign({}, vorher || {}, { temp: '18', humidity: '55' });
      const f1 = collectVPDSeries(c.id).find(function (p) { return p.iso === D; });
      S.entries[D].humidity = '62';
      const f2 = collectVPDSeries(c.id).find(function (p) { return p.iso === D; });
      const html = buildChartsSection(c.id);
      const pts = collectVPDSeries(c.id); const idx = pts.findIndex(function (p) { return p.iso === D; });
      if (vorher === undefined) delete S.entries[D]; else S.entries[D] = vorher;
      const g = c.growType; c.growType = 'outdoor';
      const htmlOut = buildChartsSection(c.id);
      c.growType = g;
      return JSON.stringify({ f1: f1, f2: f2, idx: idx, html: html, htmlOut: htmlOut }); })()`));
    const farben = vpdFarben(r.html);
    pruef('Dunkeltag 18 °C / 55 %: Punkt ohne Ziel, Etikett „Dunkelphase ✓"', !!r.f1 && r.f1.band === false && r.f1.ziel === null && r.f1.etikett === 'Dunkelphase ✓', JSON.stringify(r.f1));
    pruef('Dunkeltag 62 %: Befund Schimmel, Balken orange', !!r.f2 && r.f2.befund === 'schimmel' && farben[r.idx] === 'var(--orange)', JSON.stringify([r.f2 && r.f2.befund, farben[r.idx]]));
    const aussen = vpdFarben(r.htmlOut).filter(Boolean);
    pruef('Draußen: alle Balken türkis, Legende „nicht steuerbar"', aussen.length > 0 && aussen.every(x => x === 'var(--teal)') && /nicht steuerbar/.test(r.htmlOut),
      `${aussen.length} Balken, ${[...new Set(aussen)].join(',')}`);
  });

  await abschnitt('E - Im Quelltext', async () => {
    const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    pruef('Kein festes VPD-Band 0,8–1,2 im Diagramm mehr', !/title: 'VPD-Verlauf'[^\n]*\n[^\n]*zones: \[\{ from: 0\.8, to: 1\.2/.test(code));
    pruef('Keine Legende „gezielt 1.4–1.6"', !/gezielt 1\.4–1\.6/.test(code));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
