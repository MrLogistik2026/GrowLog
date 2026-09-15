/**
 * (v1.5.187) Klima je Phase aus einer Quelle — VPD Option B.
 *
 * Befund der zweiten Prüfrunde (VPD), Patricks Entscheidung vom 15.09.2026 (Option B): Temperatur-, Luftfeuchte- und
 * VPD-Fenster je Phase waren überbestimmt und widersprachen sich. An Patricks 86 Einträgen stand 44-mal eine grüne
 * VPD-Pille über oranger Zielzeile, 13-mal „✓ Luft passt" über ⚠, 40-mal Temperatur ✓ und Luftfeuchte ✓ bei VPD ⚠; die
 * Spätblüte verlangte 1,4–1,6 kPa bei 18–24 °C und 40–50 % RLF. Jetzt sind VPD-Band und Temperatur fest (KLIMA_ZIEL),
 * das Luftfeuchte-Fenster folgt bei der gemessenen Temperatur, der Schimmel-Deckel ist hart — und ein Befund
 * (klimaStatus) speist Pille, Satz, Zielzeilen, Live-Anzeige und Warnung. Die Gießmenge rechnet vorerst wie bisher.
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

// Unabhängige Physik (ANBAU.md 2): Magnus, Blatt 2 K kühler
const svp = (t) => 0.6108 * Math.exp(17.27 * t / (t + 237.3));
const rhFuer = (T, v, off) => 100 * (svp(T - off) - v) / svp(T);

const HELFER = `
  window.__pz = { saemling: { ph: 'anzucht', day: 5 }, anzucht: { ph: 'anzucht', day: 20 },
    frueh: { ph: 'bloom', bloomDay: 5, bloomLen: 60 }, mittel: { ph: 'bloom', bloomDay: 30, bloomLen: 60 },
    spaet: { ph: 'bloom', bloomDay: 50, bloomLen: 60 }, spuelen: { ph: 'flush' }, ice: { ph: 'ice' }, ernte: { ph: 'harvest' } };
  window.__befund = function (stufe, t, rh) {
    const st = klimaStatus(t, rh, __pz[stufe], { growType: 'indoor' });
    return st ? { s: st.s, tS: st.tS, level: st.level, satz: klimaSatz(st), lo: st.fenster.lo, hi: st.fenster.hi } : null;
  };
`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  E(`S.leafOffset = 2`);
  E(HELFER);

  await abschnitt('A - Die Tabelle (Option B)', async () => {
    const z = JSON.parse(E(`JSON.stringify(KLIMA_ZIEL)`));
    const gleich = (k, vpd, temp, deckel, stufe, boden) => JSON.stringify([z[k].vpd, z[k].temp, z[k].deckel, z[k].deckelStufe, z[k].boden])
      === JSON.stringify([vpd, temp, deckel, stufe, boden]);
    pruef('Späte Blüte, Spülen, IceFlush-Tag: 1,2–1,5 kPa · 22–26 °C · Deckel 60 % kritisch',
      ['spaet', 'spuelen', 'ice'].every(k => gleich(k, [1.2, 1.5], [22, 26], 60, 'critical', null)), JSON.stringify(z.spaet));
    // (v1.5.188) Bewusst angepasst: Dunkelphase und Erntetag ohne VPD-Band (ohne Licht kein Band, test_dunkelphase.js).
    pruef('Dunkelphase und Erntetag: kein Band, keine Temperatur · Deckel 60 % kritisch',
      ['dunkel', 'ernte'].every(k => gleich(k, null, null, 60, 'critical', null)), JSON.stringify([z.dunkel, z.ernte]));
    pruef('Frühe Blüte 1,0–1,3 · 23–27 °C · 65 %; mittlere 1,2–1,5 · 22–26 °C · 65 %',
      gleich('frueh', [1.0, 1.3], [23, 27], 65, 'high', null) && gleich('mittel', [1.2, 1.5], [22, 26], 65, 'high', null), JSON.stringify([z.frueh, z.mittel]));
    pruef('Anzucht 0,8–1,2 · 22–28 °C · 80 %; Sämling 0,4–0,8 · 22–26 °C · ohne Deckel, Boden 40 %',
      gleich('anzucht', [0.8, 1.2], [22, 28], 80, 'high', null) && gleich('saemling', [0.4, 0.8], [22, 26], null, null, 40), JSON.stringify([z.anzucht, z.saemling]));
  });

  await abschnitt('B - Das Luftfeuchte-Fenster folgt der Physik', async () => {
    const faelle = [['spaet', 22], ['spaet', 24], ['spaet', 26], ['frueh', 25], ['anzucht', 25], ['saemling', 24]];
    const falsch = [];
    for (const [k, T] of faelle) {
      const f = JSON.parse(E(`JSON.stringify(klimaRlfFenster(KLIMA_ZIEL['${k}'], ${T}))`));
      const zz = JSON.parse(E(`JSON.stringify(KLIMA_ZIEL['${k}'])`));
      const lo = rhFuer(T, zz.vpd[1], 2), hi = Math.min(rhFuer(T, zz.vpd[0], 2), zz.deckel == null ? 100 : zz.deckel);
      if (Math.abs(f.lo - lo) > 0.2 || Math.abs(f.hi - hi) > 0.2) falsch.push(`${k} ${T} °C: ${f.lo}–${f.hi} statt ${lo.toFixed(2)}–${hi.toFixed(2)}`);
    }
    pruef('Sechs Stufen/Temperaturen gegen eine unabhängige Magnus-Rechnung (±0,2 %)', falsch.length === 0, falsch.join(' | '));
    E(`S.leafOffset = 1`);
    const f1 = JSON.parse(E(`JSON.stringify(klimaRlfFenster(KLIMA_ZIEL.spaet, 24))`));
    E(`S.leafOffset = 2`);
    pruef('Blattabzug 1 K verschiebt das Fenster (Spätblüte 24 °C: etwa 43,9–53,9 %)',
      Math.abs(f1.lo - rhFuer(24, 1.5, 1)) <= 0.2 && Math.abs(f1.hi - rhFuer(24, 1.2, 1)) <= 0.2, JSON.stringify(f1));
  });

  await abschnitt('C - Fenster und Befund widersprechen sich nie (Raster 0,1 °C × 0,1 %)', async () => {
    const r = JSON.parse(E(`(function(){
      let n = 0, nFalsch = 0; const beispiele = [];
      for (const stufe of ['saemling', 'anzucht', 'frueh', 'mittel', 'spaet']) {
        const z = KLIMA_ZIEL[stufe], p = __pz[stufe];
        for (let t10 = z.temp[0] * 10; t10 <= z.temp[1] * 10; t10++) {
          const t = t10 / 10, f = klimaRlfFenster(z, t);
          for (let r10 = 150; r10 <= 950; r10++) {
            const rh = r10 / 10; n++;
            const st = klimaStatus(t, rh, p, { growType: 'indoor' });
            if ((rh >= f.lo && rh <= f.hi) !== (st.s === 'im_ziel')) { nFalsch++; if (beispiele.length < 4) beispiele.push(stufe + ' ' + t + '/' + rh + ' ' + st.s + ' [' + f.lo + '–' + f.hi + ']'); }
          }
        }
      }
      return JSON.stringify({ n, nFalsch, beispiele });
    })()`));
    pruef(`Luftfeuchte im Fenster genau dann, wenn der Befund „im Ziel" ist (${r.n} Rasterpunkte)`, r.n > 100000 && r.nFalsch === 0, `${r.nFalsch} Abweichungen: ${r.beispiele.join(' | ')}`);
  });

  await abschnitt('D - Befunde', async () => {
    const faelle = [
      ['spaet', 24, 45, 'im_ziel', 'ok', 'ok'], ['spaet', 24, 49, 'etwas_feucht', 'ok', 'knapp'], ['spaet', 24, 55, 'zu_feucht', 'ok', 'warn'],
      ['spaet', 24, 62, 'schimmel', 'ok', 'critical'], ['spaet', 19, 45, 'zu_feucht', 'kuehl', 'warn'], ['spaet', 28, 40, 'zu_trocken', 'warm', 'warn'],
      ['saemling', 24, 50, 'zu_trocken', 'ok', 'warn'], ['saemling', 24, 85, 'zu_feucht', 'ok', 'warn'], ['anzucht', 24, 90, 'nass', 'ok', 'critical'],
      ['frueh', 24, 66, 'schimmel', 'ok', 'high'], ['mittel', 24, 66, 'schimmel', 'ok', 'high'], ['spuelen', 24, 61, 'schimmel', 'ok', 'critical'],
    ];
    const falsch = [];
    for (const [k, t, rh, s, tS, level] of faelle) {
      const b = JSON.parse(E(`JSON.stringify(__befund('${k}', ${t}, ${rh}))`));
      if (!b || b.s !== s || b.tS !== tS || b.level !== level) falsch.push(`${k} ${t}/${rh}: ${b && [b.s, b.tS, b.level].join(' ')} statt ${s} ${tS} ${level}`);
    }
    pruef('Zwölf Lagen: im Ziel, knapp, zu feucht, Schimmel-Deckel (kritisch/hoch), zu kühl, zu warm, Sämling ohne Deckel, Nässe', falsch.length === 0, falsch.join(' | '));
  });

  await abschnitt('E - Ein Satz mit Handlung, die Zahl ist die Luftfeuchte bei der eigenen Temperatur', async () => {
    const satz = (k, t, rh) => JSON.parse(E(`JSON.stringify(__befund('${k}', ${t}, ${rh}).satz)`));
    const s1 = satz('spaet', 24, 55), s2 = satz('spaet', 19, 45), s3 = satz('spaet', 24, 62), s4 = satz('spaet', 24, 45), s5 = satz('saemling', 24, 50);
    pruef('Spätblüte 24 °C / 55 %', s1 === 'Luft zu feucht in der späten Blüte: Luftfeuchte auf 39–48 % bei 24 °C senken.', s1);
    pruef('19 °C / 45 %: erst die Temperatur, dann die Luftfeuchte bei 22 °C', s2 === 'Luft zu feucht in der späten Blüte: Temperatur auf 22–26 °C anheben, dann Luftfeuchte auf 32–43 % bei 22 °C senken.', s2);
    pruef('62 %: rot und sofort', /^🚨 Über 60 % Luftfeuchte in der späten Blüte — Schimmelgefahr: sofort/.test(s3) && /Ziel 39–48 % bei 24 °C/.test(s3), s3);
    pruef('Im Ziel: so lassen', s4 === '✓ Luft passt in der späten Blüte — so lassen.', s4);
    pruef('Sämling zu trocken: mit Haube oder Wasserschale', s5 === 'Luft zu trocken beim Sämling: Luftfeuchte auf 62–75 % bei 24 °C anheben (Haube oder Wasserschale).', s5);
  });

  await abschnitt('F - getPhaseTargets liest KLIMA_ZIEL', async () => {
    const r = JSON.parse(E(`JSON.stringify({ spaet: getPhaseTargets(__pz.spaet), flush: getPhaseTargets(__pz.spuelen), ice: getPhaseTargets(__pz.ice),
      ernte: getPhaseTargets(__pz.ernte), saemling: getPhaseTargets(__pz.saemling), dry: getPhaseTargets({ ph: 'dry' }) })`));
    const t = r.spaet;
    pruef('Späte Blüte: VPD 1,2–1,5 · 22–26 °C · RLF 39–48 % bei 24 °C · Deckel 60', t.label === 'Späte Blüte' && t.vpdMin === 1.2 && t.vpdMax === 1.5
      && t.tempMin === 22 && t.tempMax === 26 && t.rhMin === 39 && t.rhMax === 48 && t.deckel === 60, JSON.stringify(t));
    // (v1.5.188) Bewusst angepasst: Der Erntetag hat kein Band mehr, nur den Deckel.
    pruef('Spülen und IceFlush-Tag mit demselben Band, Erntetag nur mit Deckel 60 %; Sämling 0,4–0,8; Trocknen unverändert 18–20 °C / 55–62 %',
      r.flush.label === 'Spülen' && r.ice.label === 'IceFlush' && r.ernte.label === 'Ernte' && [r.flush, r.ice].every(x => x.vpdMin === 1.2 && x.vpdMax === 1.5 && x.rhMin === 39)
      && r.ernte.vpdMin === null && r.ernte.rhMin === null && r.ernte.rhMax === 60
      && r.saemling.vpdMin === 0.4 && r.saemling.vpdMax === 0.8 && r.dry.tempMin === 18 && r.dry.rhMax === 62, JSON.stringify(r));
  });

  await abschnitt('G - Die Luftfeuchte-Warnung nimmt Deckel und Fenster aus KLIMA_ZIEL', async () => {
    const r = JSON.parse(E(`(function(){ const c = { growType: 'indoor' }, o = { growType: 'outdoor' };
      const w = (p, v, cc, t) => { const x = getCriticalWarning('rlf', v, p, cc || c, t); return x ? x.level + ' ' + x.title : null; };
      return JSON.stringify({ spaet61: w(__pz.spaet, 61), spaet60: w(__pz.spaet, 60), frueh66: w(__pz.frueh, 66), frueh64: w(__pz.frueh, 64),
        mittel66: w(__pz.mittel, 66), anzucht81: w(__pz.anzucht, 81), anzucht79: w(__pz.anzucht, 79), saemling85: w(__pz.saemling, 85),
        saemling38: w(__pz.saemling, 38), outdoor70: w(__pz.spaet, 70, o), dry85: w({ ph: 'dry' }, 85),
        aktion: getCriticalWarning('rlf', 62, __pz.spaet, c, 24).action }); })()`));
    const erwartet = { spaet61: /^critical .*Schimmelgefahr/, spaet60: null, frueh66: /^high .*Schimmelrisiko/, frueh64: null, mittel66: /^high .*Schimmelrisiko/,
      anzucht81: /^high .*hohes Pilzrisiko/, anzucht79: null, saemling85: null, saemling38: /^high .*zu trocken/, outdoor70: null, dry85: /^high .*hohes Pilzrisiko/ };
    const falsch = Object.entries(erwartet).filter(([k, re]) => re === null ? r[k] !== null : !(r[k] && re.test(r[k]))).map(([k]) => `${k}: ${r[k]}`);
    pruef('Elf Lagen: 60 % kritisch am Ende, 65 % in früher und mittlerer Blüte, 80 % in der Anzucht, Sämling nur unter 40 %, draußen still', falsch.length === 0, falsch.join(' | '));
    pruef('Die Warnung nennt dasselbe Fenster wie die Zeile darüber', /Ziel 39–48 % bei 24 °C/.test(r.aktion), r.aktion);
  });

  await abschnitt('H - Tageseintrag mit Patricks Werten (11.08., Spätblüte, 23,8 °C / 44 %)', async () => {
    const D = '2026-08-11';
    E(`setDebugDate('${D}'); S.beginnerMode = false; openEntry('${D}')`);
    await warte(200);
    const txt = `const txt = (id) => { const el = document.getElementById(id); return el ? el.textContent.replace(/\\s+/g, ' ').trim() : null; };`;
    const r = JSON.parse(E(`(function(){ ${txt} const c = S.cycles[0]; const e = S.entries['${D}'];
      const st = klimaStatus(parseFloat(e.temp), parseFloat(e.humidity), phase('${D}', c), c);
      return JSON.stringify({ s: st.s, pille: txt('vpd-p'), erwartet: _klimaPille(st).label, marke: _klimaMarke(st), ziel: txt('klima-ziel'), rlf: txt('klima-rlf'),
        lo: _klimaZahl(st.fenster.lo), hi: _klimaZahl(st.fenster.hi), satz: klimaSatz(st), phR: document.getElementById('er').getAttribute('placeholder') }); })()`));
    pruef(`Profi: Pille „${r.erwartet}" aus dem Befund`, r.pille === r.erwartet, JSON.stringify(r));
    pruef('Profi: Zielzeile mit Band, Temperatur, Fenster bei 23,8 °C und Deckel', r.ziel && r.ziel.startsWith(r.marke)
      && r.ziel.includes(`Späte Blüte: VPD 1,2–1,5 kPa · 22–26 °C · bei 23,8 °C RLF ${r.lo}–${r.hi} % · Schimmel-Deckel 60 %`), r.ziel);
    pruef('Luftfeuchte-Zeile: dasselbe Fenster bei 23,8 °C', r.rlf && r.rlf.includes(`bei 23,8 °C ${r.lo}–${r.hi} % RLF`), r.rlf);
    E(`S.beginnerMode = true; openEntry('${D}')`);
    await warte(200);
    const b = JSON.parse(E(`(function(){ ${txt} return JSON.stringify({ kasten: txt('vpd-c') }); })()`));
    pruef('Einsteiger: der Satz aus demselben Befund', b.kasten === r.satz, `${b.kasten} ≠ ${r.satz}`);
    const live = JSON.parse(E(`(function(){ ${txt}
      document.getElementById('et').value = '18'; uEnv();
      const kalt = { temp: txt('klima-temp'), kasten: txt('vpd-c') };
      document.getElementById('et').value = '23.8'; document.getElementById('er').value = '62'; uEnv();
      const nass = { rlf: txt('klima-rlf'), krit: txt('klima-krit') };
      return JSON.stringify({ kalt, nass }); })()`));
    pruef('Beim Tippen von 18 °C: Temperatur-Zeile ⚠ und der Satz rät zuerst zur Temperatur', /^⚠/.test(live.kalt.temp || '') && /22–26 °C/.test(live.kalt.temp || '')
      && /Temperatur auf 22–26 °C anheben/.test(live.kalt.kasten || ''), JSON.stringify(live.kalt));
    pruef('Beim Tippen von 62 %: 🚨 in der Zeile und „Schimmelgefahr (Botrytis)" in voller Breite darunter', /^🚨/.test(live.nass.rlf || '')
      && /Schimmelgefahr \(Botrytis\)/.test(live.nass.krit || '') && !/Botrytis/.test(live.nass.rlf || ''), JSON.stringify(live.nass));
    E(`S.beginnerMode = false`);
  });

  await abschnitt('I - Keine zwei Stellen sagen Verschiedenes (Patricks Klimatage)', async () => {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0]; let n = 0; const rlf = [], zone = [];
      Object.keys(S.entries).sort().forEach(d => { const e = S.entries[d]; if (!e || !e.temp || !e.humidity) return;
        const t = parseFloat(e.temp), rh = parseFloat(e.humidity), p = phase(d, c); const st = klimaStatus(t, rh, p, c); if (!st || !st.s) return; n++;
        const teile = _klimaEntryTeile(e.temp, e.humidity, [c], d);
        const marke = (teile.rlfZeile.match(/<span>([^<]*)<\\/span>/) || [])[1];
        if (st.tS === 'ok' && ((marke === '✓') !== (st.s === 'im_ziel'))) rlf.push(d + ' ' + t + '/' + rh + ' ' + st.s + ' ' + marke);
        if (st.s !== 'schimmel') { const z = vpdZone(st.v, p, 'indoor'); if (z.lage !== st.s) zone.push(d + ' ' + st.s + ' ≠ ' + z.lage); }
      });
      return JSON.stringify({ n, rlf, zone }); })()`));
    pruef(`Luftfeuchte-Zeile ✓ genau dann, wenn die Pille „im Ziel" zeigt (${r.n} Tage, Temperatur im Fenster)`, r.n > 60 && r.rlf.length === 0, r.rlf.slice(0, 3).join(' | '));
    pruef('Tipps-Zone und Eintrag-Befund stimmen überein', r.zone.length === 0, r.zone.slice(0, 3).join(' | '));
  });

  await abschnitt('J - Die Gießmenge ändert sich nicht (Klimafaktor eingefroren)', async () => {
    const r = JSON.parse(E(`(function(){ const c = S.cycles[0];
      const altBand = (p) => { if (!p) return null; if (p.ph === 'anzucht' || p.ph === 'vorzucht') return (p.day || 1) <= 10 ? [0.4, 0.8] : [0.8, 1.2];
        if (p.ph === 'abhärten' || p.ph === 'vegi_out') return [0.8, 1.4];
        if (p.ph === 'bloom') { const s = bluetestufe(p); return s === 'frueh' ? [1.0, 1.3] : s === 'mittel' ? [1.2, 1.5] : [1.4, 1.6]; }
        if (['flush', 'ice', 'harvest'].includes(p.ph)) return [1.4, 1.6]; return null; };
      let n = 0; const falsch = [];
      Object.keys(S.entries).sort().forEach(d => { const e = S.entries[d]; if (!e || !e.temp || !e.humidity) return; n++;
        const b = altBand(phase(d, c)); let soll = 1.0;
        if (b) { const v = calcVPD(parseFloat(e.temp), parseFloat(e.humidity)); soll = v < b[0] * 0.85 ? 0.85 : v < b[0] ? 0.95 : v > b[1] * 1.25 ? 1.25 : v > b[1] ? 1.15 : 1.0; }
        const ist = _vpdFactorForDay(c, d); if (ist !== soll) falsch.push(d + ' soll ' + soll + ' ist ' + ist); });
      const giess = ['2026-06-10', '2026-06-25', '2026-07-05', '2026-07-15', '2026-07-25', '2026-08-05', '2026-08-15', '2026-08-25', '2026-08-28']
        .map(d => { setDebugDate(d); return waterSuggestion(c, phase(d, c), d); });
      return JSON.stringify({ n, falsch, giess }); })()`));
    pruef(`Klimafaktor an allen ${r.n} Klimatagen wie vor dem Umbau`, r.n > 80 && r.falsch.length === 0, r.falsch.slice(0, 3).join(' | '));
    pruef('Gießvorschläge an neun Tagen der Blüte unverändert', JSON.stringify(r.giess) === JSON.stringify([4000, 5000, 9500, 11000, 11000, 13200, 13200, 10550, 7900]), JSON.stringify(r.giess));
  });

  await abschnitt('K - Die Eintrags-Warnungen doppeln den Umgebungsblock nicht mehr', async () => {
    const r = JSON.parse(E(`(function(){ const c = { id: 'kz', growType: 'indoor', medium: 'erde' };
      const w = (p, t, rh) => getEntryWarnings({}, p, { temp: String(t), humidity: String(rh) }, c, null).map(x => x.type + ': ' + x.text);
      return JSON.stringify({ saemling74: w(__pz.saemling, 24, 74), anzucht75: w(__pz.anzucht, 24, 75), spaet18: w(__pz.spaet, 18.5, 40) }); })()`));
    pruef('Sämling unter der Haube (74 %): keine Luftfeuchte-Warnung', !r.saemling74.some(x => /RLF/.test(x)), r.saemling74.join(' | '));
    pruef('Anzucht 75 %: nur der Hinweis zum Aktivkohlefilter, als Info', r.anzucht75.filter(x => /RLF/.test(x)).length === 1 && /^info: .*Aktivkohlefilter/.test(r.anzucht75.find(x => /RLF/.test(x)) || ''), r.anzucht75.join(' | '));
    pruef('Keine „zielt auf"-Hinweise mehr neben der Zielzeile', !Object.values(r).flat().some(x => /zielt auf/.test(x)), JSON.stringify(r));
  });

  await abschnitt('L - Im Quelltext', async () => {
    const code = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    const reste = ["'Blüte ✓'", 'Luft passt für diese Phase', 'RLF zielt auf', 'Temp zielt auf', 'SOFORT RLF unter 50%', 'Mittlere Blüte braucht RLF unter 55%'].filter(s => code.includes(s));
    pruef('Keine alten Etikett-Vergleiche und Fenster-Texte', reste.length === 0, reste.join(' | '));
  });

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
