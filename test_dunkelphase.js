/**
 * (v1.5.188) Dunkelphase und Erntetag ohne VPD-Band.
 *
 * Der Fehler: KLIMA_ZIEL (v1.5.187) gab dem IceFlush und dem Erntetag das Band der späten Blüte (1,2–1,5 kPa, 22–26 °C),
 * und klimaStufe unterschied den IceFlush-Tag nicht von den Dunkeltagen danach. Im dunklen Zelt bei 18 °C / 55 % riet die
 * App deshalb „Temperatur auf 22–26 °C anheben, dann Luftfeuchte auf 32–43 % senken" — gegen die eigene Anleitung zur
 * Dunkelphase und ohne Nutzen für die Pflanze: Ohne Licht verdunstet sie nur einen kleinen Teil der Tagesmenge (nachts
 * typisch 5–15 %, Caird et al. 2007, Plant Physiol 143:4), und der Blattabzug aus Verdunstungskälte entfällt
 * (ANBAU.md 2.1). Am Erntetag wird vor dem Lichtangang geschnitten. Es bleibt der Schimmel-Deckel von 60 %.
 *
 * Gegenproben: Der IceFlush-Tag selbst und die späte Blüte rechnen wie vorher.
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
async function abschnitt(titel, fn) {
  console.log('\n' + titel);
  try { await fn(); } catch (e) { pruef(titel + ' — lief ohne Fehler', false, String(e && e.message || e).slice(0, 160)); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`S.leafOffset = 2`);

  // Die Tage aus Patricks Endspurt — aus phase() gelesen, nicht angenommen.
  const TAGE = JSON.parse(E(`(function(){ const c = S.cycles[0]; const tage = [];
    for (let i = 95; i <= 125; i++) { const d = isoPlus(c.startDate, i - 1); const p = phase(d, c);
      tage.push({ d: d, tag: i, ph: p ? p.ph : null, iceDay: (p && p.iceDay !== undefined) ? p.iceDay : null, stufe: klimaStufe(p) }); }
    return JSON.stringify(tage); })()`));
  const eis = TAGE.filter(x => x.ph === 'ice');
  const ICE = eis[0] ? eis[0].d : null, DUNKEL = eis[1] ? eis[1].d : null;
  const ernteTag = TAGE.find(x => x.ph === 'harvest') || {};
  const ERNTE = ernteTag.d || null;
  const SPAET = (TAGE.find(x => x.stufe === 'spaet') || {}).d || null;
  E(`window.__p = { ice: phase('${ICE}', S.cycles[0]), dunkel: phase('${DUNKEL}', S.cycles[0]), ernte: phase('${ERNTE}', S.cycles[0]), spaet: phase('${SPAET}', S.cycles[0]) };
    window.__befund = function (k, t, rh) { const st = klimaStatus(t, rh, __p[k], S.cycles[0]);
      return st ? { s: st.s, tS: st.tS, level: st.level, satz: klimaSatz(st) } : null; };`);

  await abschnitt('A - phase() zählt die Ice-Tage, klimaStufe trennt den IceFlush-Tag von der Dunkelphase', async () => {
    pruef('Patricks Endspurt: zwei Ice-Tage, danach der Erntetag', eis.length === 2 && !!ERNTE && !!SPAET, JSON.stringify(eis));
    pruef('IceFlush-Tag: iceDay 1, Stufe „ice"', !!eis[0] && eis[0].iceDay === 1 && eis[0].stufe === 'ice', JSON.stringify(eis[0]));
    pruef('Der Tag danach: iceDay 2, Stufe „dunkel"', !!eis[1] && eis[1].iceDay === 2 && eis[1].stufe === 'dunkel', JSON.stringify(eis[1]));
    pruef('Erntetag: Stufe „ernte"', ernteTag.stufe === 'ernte', JSON.stringify(ernteTag));
    const akt = E(`getAction('${ICE}', S.cycles[0])`);
    pruef('Am IceFlush-Tag steht die Aktion „ice" — iceDay 1 ist wirklich der Eis-Tag', akt === 'ice', String(akt));
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0];
      const cd = Object.assign({}, c, { bloomStartDate: isoPlus(c.startDate, anzuchtLenFor(c)) });
      return JSON.stringify(['${ICE}', '${DUNKEL}'].map(function (d) { const p = phase(d, cd); return p ? [p.ph, p.iceDay === undefined ? null : p.iceDay, klimaStufe(p)] : null; })); })()`));
    pruef('Mit Blütestart-Datum (datumsbasierter Pfad) dieselben Ice-Tage',
      JSON.stringify(r) === JSON.stringify([['ice', 1, 'ice'], ['ice', 2, 'dunkel']]), JSON.stringify(r));
  });

  await abschnitt('B - Die Tabelle', async () => {
    const z = JSON.parse(E(`JSON.stringify({ dunkel: KLIMA_ZIEL.dunkel || null, ernte: KLIMA_ZIEL.ernte, ice: KLIMA_ZIEL.ice })`));
    const ohne = (x) => !!x && x.vpd === null && x.temp === null && x.deckel === 60 && x.deckelStufe === 'critical';
    pruef('Dunkelphase und Erntetag: kein VPD-Band, keine Temperatur, Deckel 60 % kritisch',
      ohne(z.dunkel) && ohne(z.ernte) && z.dunkel.name === 'Dunkelphase', JSON.stringify([z.dunkel, z.ernte]));
    pruef('IceFlush-Tag unverändert: 1,2–1,5 kPa · 22–26 °C · 60 %',
      JSON.stringify([z.ice.vpd, z.ice.temp, z.ice.deckel]) === JSON.stringify([[1.2, 1.5], [22, 26], 60]), JSON.stringify(z.ice));
  });

  const befund = (k, t, rh) => JSON.parse(E(`JSON.stringify(__befund('${k}', ${t}, ${rh}))`));

  await abschnitt('C - Befund in der Dunkelphase', async () => {
    const gut = befund('dunkel', 18, 55), hoch = befund('dunkel', 18, 62), sehr = befund('dunkel', 24, 90), ice = befund('ice', 18, 55);
    pruef('18 °C / 55 % im Dunkeln: im Ziel, ohne Temperatur-Urteil', !!gut && gut.s === 'im_ziel' && gut.tS === null && gut.level === 'ok', JSON.stringify(gut));
    pruef('Der Satz rät nicht zum Heizen und nennt kein VPD',
      !!gut && /Dunkelphase/.test(gut.satz) && /höchstens 60 %/.test(gut.satz) && !/anheben|senken|kPa|22–26/.test(gut.satz), gut && gut.satz);
    pruef('62 % im Dunkeln: Schimmelgefahr, kritisch, Ziel höchstens 60 %',
      !!hoch && hoch.s === 'schimmel' && hoch.level === 'critical' && /^🚨 Über 60 % Luftfeuchte in der Dunkelphase/.test(hoch.satz) && /Ziel höchstens 60 %/.test(hoch.satz), JSON.stringify(hoch));
    pruef('90 % im Dunkeln: der Schimmel-Deckel, nicht die Nass-Stufe mit Blattabzug', !!sehr && sehr.s === 'schimmel' && sehr.level === 'critical', JSON.stringify(sehr));
    pruef('Gegenprobe IceFlush-Tag (Licht an): 18 °C / 55 % weiter „zu feucht", erst die Temperatur',
      !!ice && ice.s === 'zu_feucht' && ice.tS === 'kuehl' && /Temperatur auf 22–26 °C anheben/.test(ice.satz), JSON.stringify(ice));
  });

  await abschnitt('D - Erntetag', async () => {
    const e1 = befund('ernte', 19, 58), e2 = befund('ernte', 19, 61);
    pruef('19 °C / 58 %: im Ziel, der Satz nennt das Trockenklima nach dem Schnitt',
      !!e1 && e1.s === 'im_ziel' && /Trockenklima: 18–20 °C, 55–62 % RLF/.test(e1.satz) && !/anheben|kPa/.test(e1.satz), JSON.stringify(e1));
    pruef('61 %: kritisch', !!e2 && e2.s === 'schimmel' && e2.level === 'critical', JSON.stringify(e2));
  });

  await abschnitt('E - Zielwerte und Luftfeuchte-Warnung', async () => {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0];
      const w = function (k, v, t) { const x = getCriticalWarning('rlf', v, __p[k], c, t); return x ? { level: x.level, title: x.title, action: x.action } : null; };
      return JSON.stringify({ ptD: getPhaseTargets(__p.dunkel), ptI: getPhaseTargets(__p.ice),
        w62: w('dunkel', 62, 18), w58: w('dunkel', 58, 18), e61: w('ernte', 61, 19) }); })()`));
    pruef('getPhaseTargets Dunkelphase: nur der Deckel',
      !!r.ptD && r.ptD.vpdMin === null && r.ptD.tempMin === null && r.ptD.rhMin === null && r.ptD.rhMax === 60 && r.ptD.label === 'Dunkelphase', JSON.stringify(r.ptD));
    pruef('getPhaseTargets IceFlush-Tag unverändert (1,2 kPa, RLF ab 39 %)', !!r.ptI && r.ptI.vpdMin === 1.2 && r.ptI.rhMin === 39, JSON.stringify(r.ptI));
    pruef('62 % im Dunkeln: kritisch, „Vor der Ernte", Ziel höchstens 60 %, keine Spanne bei 18 °C',
      !!r.w62 && r.w62.level === 'critical' && /Vor der Ernte/.test(r.w62.action) && /Ziel: höchstens 60 %/.test(r.w62.action) && !/bei 18/.test(r.w62.action), JSON.stringify(r.w62));
    pruef('58 % im Dunkeln: keine Warnung · Erntetag 61 %: kritisch', r.w58 === null && !!r.e61 && r.e61.level === 'critical', JSON.stringify([r.w58, r.e61]));
  });

  await abschnitt('F - Eintrags-Warnungen zur Temperatur', async () => {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0];
      const w = function (k, t) { return getEntryWarnings({}, __p[k], { temp: String(t), humidity: '50' }, c, null).map(function (x) { return x.type + ': ' + x.text; }); };
      return JSON.stringify({ d17: w('dunkel', 17), d14: w('dunkel', 14), d30: w('dunkel', 30), s17: w('spaet', 17), s30: w('spaet', 30) }); })()`));
    pruef('Dunkelphase 17 °C und 14 °C: kein Phosphor-Lockout, kein „Heizen!"',
      !r.d17.concat(r.d14).some(x => /Phosphor|Heizen|Wachstum stoppt/.test(x)), JSON.stringify([r.d17, r.d14]));
    pruef('Dunkelphase 30 °C: Terpene statt „Ziel 22–26 °C bei Licht an"',
      r.d30.some(x => /Terpene/.test(x)) && !r.d30.some(x => /bei Licht an/.test(x)), JSON.stringify(r.d30));
    // (v1.5.191) Bewusst angepasst: Die Warnung bei 17 °C nennt seit v1.5.191 die Wurzelzone unter 16 °C statt „unter 18 °C".
    pruef('Gegenprobe späte Blüte: 17 °C warnt weiter, 30 °C nennt 22–26 °C bei Licht an',
      r.s17.some(x => /^warn: .*kühl/.test(x)) && r.s30.some(x => /22–26 °C bei Licht an/.test(x)), JSON.stringify([r.s17, r.s30]));
  });

  const txt = "const txt = function (id) { const el = document.getElementById(id); return el ? el.textContent.replace(/\\s+/g, ' ').trim() : null; };";

  await abschnitt('G - Tageseintrag in der Dunkelphase', async () => {
    E(`setDebugDate('${DUNKEL}'); S.beginnerMode = false; openEntry('${DUNKEL}')`);
    await warte(200);
    const r = JSON.parse(E(`(function(){ ${txt}
      const er = document.getElementById('er'), et = document.getElementById('et');
      const phR = er ? er.getAttribute('placeholder') : null;
      et.value = '18'; er.value = '55'; uEnv();
      const a = { ziel: txt('klima-ziel'), temp: txt('klima-temp'), rlf: txt('klima-rlf'), pille: txt('vpd-p'), krit: txt('klima-krit'), phR: phR };
      er.value = '62'; uEnv();
      const b = { rlf: txt('klima-rlf'), krit: txt('klima-krit') };
      return JSON.stringify({ a: a, b: b }); })()`));
    pruef('Zielzeile: kein VPD-Ziel ohne Licht, Luftfeuchte höchstens 60 %', !!r.a.ziel && /kein VPD-Ziel ohne Licht/.test(r.a.ziel) && /höchstens 60 %/.test(r.a.ziel), r.a.ziel);
    pruef('Temperatur-Zeile ohne ⚠ und ohne 22–26 °C', !!r.a.temp && /kein Temperaturziel/.test(r.a.temp) && !/⚠|22–26/.test(r.a.temp), r.a.temp);
    pruef('Luftfeuchte-Zeile ✓ bei 55 %', !!r.a.rlf && /^✓/.test(r.a.rlf) && /höchstens 60 % RLF/.test(r.a.rlf), r.a.rlf);
    pruef('Pille „Dunkelphase ✓", keine Warnung', r.a.pille === 'Dunkelphase ✓' && !r.a.krit, JSON.stringify(r.a));
    pruef('Platzhalter der Luftfeuchte liegt unter dem Deckel', r.a.phR !== null && parseFloat(r.a.phR) <= 60, String(r.a.phR));
    pruef('Beim Tippen von 62 %: 🚨 in der Zeile, Schimmelwarnung in voller Breite',
      /^🚨/.test(r.b.rlf || '') && /Schimmelgefahr \(Botrytis\)/.test(r.b.krit || ''), JSON.stringify(r.b));
    E(`S.beginnerMode = true; openEntry('${DUNKEL}')`);
    await warte(200);
    const k = JSON.parse(E(`(function(){ ${txt}
      document.getElementById('et').value = '18'; document.getElementById('er').value = '55'; uEnv();
      const st = klimaStatus(18, 55, phase('${DUNKEL}', S.cycles[0]), S.cycles[0]);
      return JSON.stringify({ kasten: txt('vpd-c'), satz: klimaSatz(st) }); })()`));
    pruef('Einsteiger: derselbe Satz aus dem Befund, ohne „anheben"', k.kasten === k.satz && !/anheben/.test(k.kasten || ''), JSON.stringify(k));
    E(`S.beginnerMode = false`);
  });

  await abschnitt('H - Tipps-Zone und Lexikon-Hinweis', async () => {
    const r = JSON.parse(E(`(function(){ setDebugDate('${DUNKEL}');
      const z = vpdZone(0.9, __p.dunkel, 'indoor');
      return JSON.stringify({ z: { label: z.label, hint: z.hint, lage: z.lage === undefined ? null : z.lage },
        t: lexCycleNote('Temperatur'), r: lexCycleNote('Luftfeuchtigkeit (RLF)'), v: lexCycleNote('VPD (Vapour Pressure Deficit)') }); })()`));
    pruef('Tipps-Zone: „Dunkelphase", ohne ✓ und ohne „zu feucht"', r.z.label === 'Dunkelphase' && /kein VPD-Ziel/.test(r.z.hint) && r.z.lage === 'ohne_band', JSON.stringify(r.z));
    pruef('Lexikon-Hinweise ohne „null", „undefined" oder „NaN"', [r.t, r.r, r.v].every(x => !!x && !/null|undefined|NaN/.test(x)), JSON.stringify([r.t, r.r, r.v]).slice(0, 400));
    pruef('Temperatur: kein Temperaturziel · RLF: höchstens 60 % · VPD: kein VPD-Ziel',
      /kein Temperaturziel/.test(r.t || '') && /höchstens 60 % RLF/.test(r.r || '') && /kein VPD-Ziel/.test(r.v || ''), JSON.stringify([r.t, r.r, r.v]).slice(0, 500));
  });

  await abschnitt('I - Im Quelltext', async () => {
    const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    pruef('Beide Phasen-Pfade liefern iceDay', (code.match(/ph: 'ice',\s+day: [^\n]*iceDay:/g) || []).length === 2);
    pruef('Kein ungeschütztes KLIMA_ZIEL[klimaStufe(p)].temp.join mehr', !/KLIMA_ZIEL\[klimaStufe\(p\)\]\.temp\.join/.test(code));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
