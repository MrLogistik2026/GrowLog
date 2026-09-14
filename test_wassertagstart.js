/**
 * (v1.5.153) Die Startseite kennt die Wasser-Tage des Plans und nennt ein Ablaufziel.
 *
 * Der Fehler (Befund der Prüf-Agenten, gegengeprüft): getTodayAction schrieb an jedem Gießtag
 * „Nährstoffe Wo. N: 7 Produkte (siehe Eintrag)" — auch an den Wasser-Tagen des Plan-Rhythmus, an
 * denen Gieß-Fahrplan und Eintrag „nur Wasser" sagen. Auf derselben Karte stand „Ca. X ml Wasser
 * bis ~10% Drain" über dem Hinweis „15–20% Drain erzeugen"; das Ablaufziel ist seit v1.5.112 15–20 %
 * (ANBAU.md 5.1). Dazu ein festes „EC im Ziel 0,8–2,0" statt des Plan-Ziels.
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

// Zyklus mit Plan-Rhythmus; alle Gießtage von Tag 22 bis 70 durchgehen.
const LAUF = (key) => `(function(){
  const plan = S.fertPlans.find(p => p.presetKey === '${key}');
  S.cycles = []; S.entries = {}; S.beginnerMode = true;
  const c = addCyc({ name: '${key}', seedType: 'auto', medium: 'erde' });
  c.startDate = '2026-06-01'; c.fertPlanId = plan.id; c.potSize = 11;
  S._activePlanId = plan.id; syncActivePlanToGlobals(); saveS();
  const tage = [];
  for (let d = 22; d <= 70; d++) {
    const iso = isoPlus(c.startDate, d - 1);
    if (getAction(iso, c) !== 'giess') continue;
    const p = phase(iso, c);
    const k = getTodayAction(c, p, 'giess', iso) || {};
    const ec = _ecTargetFor(c, iso);
    tage.push({ d, iso, typ: getFeedWaterEffective(c, p, iso, null), steps: (k.steps || []).join(' | '), hint: k.hint || '', ecMin: ec ? ecFmt(ec.min) : null, ecMax: ec ? ecFmt(ec.max) : null });
  }
  return JSON.stringify(tage);
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  for (const key of ['biobizz_official', 'biobizz_light']) {
    E(`loadPreset('${key}')`); await warte(30); E(`typeof _modalResolve === 'function' && _modalResolve(true)`); await warte(60);
    console.log('\nA - ' + key + ': Gießtage von Tag 22 bis 70');
    const tage = JSON.parse(E(LAUF(key)));
    const wasser = tage.filter(t => t.typ === 'water'), feed = tage.filter(t => t.typ === 'feed');
    console.log('    Wasser-Tage: ' + wasser.map(t => t.d).join(', ') + ' · Feed-Tage: ' + feed.length);
    if (wasser[0]) console.log('    Tag ' + wasser[0].d + ': ' + wasser[0].steps);
    pruef(key + ': Prüflage — Wasser- und Feed-Tage vorhanden', wasser.length >= 2 && feed.length >= 2, wasser.length + '/' + feed.length);
    pruef(key + ': an Wasser-Tagen kein „Nährstoffe Wo.", sondern „Wasser-Tag laut Plan"', wasser.every(t => !/Nährstoffe Wo\./.test(t.steps) && /Wasser-Tag laut Plan/.test(t.steps)), wasser.map(t => t.d + ': ' + t.steps.split(' | ').pop()).slice(0, 2).join(' || '));
    pruef(key + ': an Wasser-Tagen kein EC-Ziel', wasser.every(t => !/EC im Ziel/.test(t.steps)), wasser.map(t => t.steps).slice(0, 1).join(''));
    pruef(key + ': Gegenprobe Feed-Tage nennen die Nährstoffe', feed.every(t => /Nährstoffe Wo\./.test(t.steps)), feed.map(t => t.steps).slice(0, 1).join(''));
    pruef(key + ': Feed-Tage nennen das EC-Ziel des Plans', feed.every(t => !t.ecMin || t.steps.includes(`EC im Ziel ${t.ecMin}–${t.ecMax}`)), feed.map(t => t.steps + ' / ' + t.ecMin + '–' + t.ecMax).slice(0, 1).join(''));
    pruef(key + ': kein „~10%" in Schritt oder Hinweis', tage.every(t => !/10\s?%/.test(t.steps + t.hint)), tage.filter(t => /10\s?%/.test(t.steps + t.hint)).map(t => t.d).join(', '));
    pruef(key + ': ab Tag 25 nennen Schritt und Hinweis dasselbe Ziel 15–20 %', tage.filter(t => t.d >= 25).every(t => /15–20 % unten ablaufen/.test(t.steps) && /15–20 % Drain/.test(t.hint)), tage.filter(t => t.d >= 25).map(t => t.steps.split(' | ')[0]).slice(0, 1).join(''));
  }

  console.log('\nB - Sichtbar auf der Startseite an einem Wasser-Tag');
  {
    const r = JSON.parse(E(`(function(){
      const c = S.cycles[0];
      for (let d = 22; d <= 70; d++) {
        const iso = isoPlus(c.startDate, d - 1);
        if (getAction(iso, c) !== 'giess' || getFeedWaterEffective(c, phase(iso, c), iso, null) !== 'water') continue;
        setDebugDate(iso); renderDash();
        return JSON.stringify({ d, text: document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ') });
      }
      return JSON.stringify({ fehlt: true });
    })()`));
    pruef('Wasser-Tag gefunden', !r.fehlt);
    if (!r.fehlt) {
      console.log('    Tag ' + r.d + ': „' + (r.text.match(/Heute: Gießtag[^]{0,200}/) || [''])[0] + '"');
      pruef('Startseite: „Wasser-Tag laut Plan", kein „Nährstoffe Wo."', /Wasser-Tag laut Plan/.test(r.text) && !/Nährstoffe Wo\./.test(r.text));
    }
  }

  console.log('\nC - Die übrigen Stellen mit 10 % Ablauf');
  {
    const r = JSON.parse(E(`JSON.stringify(SYMPTOMS.flatMap(s => s.causes || []).filter(x => x.heading === 'Erde trocken, Pflanze welk').map(x => x.text))`));
    pruef('Symptom „Erde trocken, Pflanze welk" nennt 15–20 %', r.length === 1 && /15–20 %/.test(r[0]) && !/10\s?%/.test(r[0]), r[0]);
    const quelle = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n')
      .map((z, i) => ({ nr: i + 1, z })).filter(x => !/^\s*(\/\/|\*|\/\*)/.test(x.z));
    const treffer = quelle.filter(x => /~10\s?% Drain/.test(x.z)).map(x => 'Zeile ' + x.nr);
    pruef('Nirgends mehr „~10% Drain"', treffer.length === 0, treffer.join(', '));
  }

  pruef('Keine JS-Fehler', errors.length === 0, errors[0]);
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
