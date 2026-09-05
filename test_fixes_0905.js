/**
 * Deckt die drei am 05.09.2026 bestaetigten Fehler ab (UEBERGABE Abschnitt 2).
 * Jeder Test stellt zuerst die Bedingung her, unter der der Fehler auftrat.
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

async function load(mut) {
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
      const st = JSON.parse(BACKUP);
      if (mut) mut(st);
      w.localStorage.setItem('growsmart_v4', JSON.stringify(st));
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
  else { fail++; console.log('  FEHL ' + name + (info ? '  -> ' + info : '')); }
}

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  // ---- A: Pflanzen-Zaehler darf erfasste Ernte nicht stumm loeschen ----
  console.log('');
  console.log('A - Pflanzen-Zaehler und erfasste Ernte');
  {
    const { E, errors } = await load();
    pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
    E('goTo("set")');
    pruef('Ausgangslage: 5 Pflanzen, 2 davon geerntet',
      E('S.cycles.find(c=>c.active).plants.length') === 5 &&
      E('S.cycles.find(c=>c.active).plants.filter(p=>p.harvestedAt).length') === 2);

    // Rueckfrage abfangen und ABLEHNEN
    E('window.__gefragt=[]; customConfirm=function(t,m){ window.__gefragt.push(String(t)+" "+String(m)); return Promise.resolve(false); };');
    E('dd("plantCount", 3)');
    await E('saveDraft()');
    await new Promise((r) => setTimeout(r, 150));
    pruef('Es wird ueberhaupt gefragt', E('window.__gefragt.length') === 1,
      'gefragt: ' + E('JSON.stringify(window.__gefragt.length)'));
    pruef('Rueckfrage nennt den Verlust', /Ernte/.test(E('window.__gefragt[0]||""')));
    pruef('Rueckfrage nennt den Ertrag 37 g', /37 g/.test(E('window.__gefragt[0]||""')));
    pruef('Abgelehnt -> alle 5 Pflanzen bleiben', E('S.cycles.find(c=>c.active).plants.length') === 5);
    pruef('Abgelehnt -> Ertrag bleibt erhalten', E('S.cycles.find(c=>c.active).plants.filter(p=>p.yieldDry).length') === 1);
    pruef('Abgelehnt -> plantCount steht wieder auf 5', E('S.cycles.find(c=>c.active).plantCount') === 5);

    // Jetzt ZUSTIMMEN - der bewusste Fall muss weiter funktionieren
    E('customConfirm=function(){ return Promise.resolve(true); };');
    E('dd("plantCount", 3)');
    await E('saveDraft()');
    await new Promise((r) => setTimeout(r, 150));
    pruef('Zugestimmt -> gekuerzt auf 3', E('S.cycles.find(c=>c.active).plants.length') === 3);
  }
  {
    // Ohne Ernte-Daten darf NICHT gefragt werden (sonst nervt es im Normalfall)
    const { E } = await load((st) => {
      const c = st.cycles.find((x) => x.active);
      c.plants = c.plants.map((p) => ({ id: p.id, label: p.label }));
    });
    E('goTo("set")');
    E('window.__gefragt=[]; customConfirm=function(t){ window.__gefragt.push(String(t)); return Promise.resolve(true); };');
    E('dd("plantCount", 3)');
    await E('saveDraft()');
    await new Promise((r) => setTimeout(r, 150));
    pruef('Ohne Ernte-Daten keine Rueckfrage', E('window.__gefragt.length') === 0);
    pruef('Ohne Ernte-Daten trotzdem gekuerzt', E('S.cycles.find(c=>c.active).plants.length') === 3);
  }
  {
    // Hochzaehlen bleibt unberuehrt
    const { E } = await load();
    E('goTo("set")');
    E('window.__gefragt=[]; customConfirm=function(t){ window.__gefragt.push(String(t)); return Promise.resolve(true); };');
    E('dd("plantCount", 7)');
    await E('saveDraft()');
    await new Promise((r) => setTimeout(r, 150));
    pruef('Hochzaehlen ohne Rueckfrage', E('window.__gefragt.length') === 0);
    pruef('Hochzaehlen auf 7', E('S.cycles.find(c=>c.active).plants.length') === 7);
  }

  // ---- B: Endspurt-Karte darf nicht verschwinden ----
  console.log('');
  console.log('B - Endspurt-Karte bei abweichendem Giessintervall');
  for (const iv of [3, 4, 5]) {
    const { window, E } = await load((st) => { st.cycles.find((c) => c.active).intBloom = iv; });
    E('goTo("gussplan"); renderGussplan()');
    const txt = window.document.getElementById('scr-gussplan').textContent;
    const lg = E('endspurtState(S.cycles.find(c=>c.active), todayISO()).letzterGuss');
    pruef('iv=' + iv + ': Endspurt-Karte ist da', /Endspurt/.test(txt));
    pruef('iv=' + iv + ': letzter Guss ist Tag 104', lg === 104, 'letzterGuss=' + lg);
    pruef('iv=' + iv + ': kein "Tag null"', !/Tag null|Tag undefined|Tag NaN/.test(txt));
  }
  {
    // Ohne Wassereintraege greift der Theorie-Anker aus getAction - die Kette bleibt also
    // vollstaendig. Das ist der erwuenschte Normalfall und wird hier festgehalten, damit
    // der Rueckfall aus B1 nicht versehentlich den Theorie-Anker verdraengt.
    const { window, E } = await load((st) => {
      st.cycles.find((c) => c.active).intBloom = 4;
      for (const k of Object.keys(st.entries)) {
        const cd = st.entries[k].cycleData;
        if (cd) for (const id of Object.keys(cd)) delete cd[id].water;
      }
    });
    E('goTo("gussplan"); renderGussplan()');
    const txt = window.document.getElementById('scr-gussplan').textContent;
    pruef('ohne Eintraege: Karte trotzdem da', /Endspurt/.test(txt));
    pruef('ohne Eintraege: Theorie-Anker traegt', E('endspurtState(S.cycles.find(c=>c.active), todayISO()).letzterGuss') > 0);
    pruef('ohne Eintraege: kein "Tag null"', !/Tag null|Tag undefined|Tag NaN/.test(txt));
  }
  {
    // Jetzt der echte Grenzfall: kein Eintrag UND alle Bluetetage vor dem Spuelstart
    // stummgeschaltet. Dann ist kein letzter Guss ableitbar - frueher verschwand hier
    // die ganze Karte.
    const { window, E } = await load((st) => {
      const c = st.cycles.find((x) => x.active);
      c.intBloom = 4;
      for (const k of Object.keys(st.entries)) {
        const cd = st.entries[k].cycleData;
        if (cd) for (const id of Object.keys(cd)) delete cd[id].water;
      }
      c.skippedDays = [];
      const start = new Date(c.startDate + 'T12:00:00');
      for (let d = 70; d <= 106; d++) {
        const o = new Date(start);
        o.setDate(o.getDate() + d - 1);
        const p = (n) => String(n).padStart(2, '0');
        c.skippedDays.push(o.getFullYear() + '-' + p(o.getMonth() + 1) + '-' + p(o.getDate()));
      }
    });
    E('goTo("gussplan"); renderGussplan()');
    const txt = window.document.getElementById('scr-gussplan').textContent;
    pruef('kein Anker: letzterGuss ist wirklich null',
      E('endspurtState(S.cycles.find(c=>c.active), todayISO()).letzterGuss') === null);
    pruef('kein Anker: Karte trotzdem da', /Endspurt/.test(txt));
    pruef('kein Anker: sagt "noch offen"', /noch offen/.test(txt));
    pruef('kein Anker: nennt beide Vorschlagstage', /auf Tag 99 bzw. 107/.test(txt));
    pruef('kein Anker: kein "Tag null"', !/Tag null|Tag undefined|Tag NaN/.test(txt));
    pruef('kein Anker: Rest der Kette bleibt bedienbar',
      /Spülen ab/.test(txt) && /IceFlush/.test(txt) && /Ernte/.test(txt));
    pruef('kein Anker: Ernte-Tag stimmt weiter',
      E('endspurtState(S.cycles.find(c=>c.active), todayISO()).ernteTag') === 116);
  }

  // ---- C: kein "undefined" in den Einstellungen ----
  console.log('');
  console.log('C - Phasen-Zeile ohne phaseSkeleton');
  {
    const { window, E } = await load();
    E('goTo("set")');
    const txt = window.document.getElementById('scr-set').textContent;
    pruef('aktiver Plan hat kein phaseSkeleton',
      E('getPlanForCycle(S.cycles.find(c=>c.active)).phaseSkeleton') === null);
    pruef('kein "undefined" auf dem Bildschirm', !/undefined/.test(txt),
      (txt.match(/.{0,60}undefined.{0,20}/) || [''])[0]);
    pruef('Zeile "Feste Phasen" entfaellt', !/Feste Phasen aus dem Plan/.test(txt));
    pruef('Plan-Zeile bleibt sichtbar', /Plan:/.test(txt));
  }
  {
    // Plan MIT Rueckgrat: die Zeile muss weiterhin erscheinen und Zahlen zeigen
    const { window, E } = await load((st) => {
      const p = st.fertPlans.find((x) => x.phaseSkeleton);
      st.cycles.find((x) => x.active).fertPlanId = p.id;
      st._activePlanId = p.id;
    });
    E('goTo("set")');
    const txt = window.document.getElementById('scr-set').textContent;
    pruef('mit phaseSkeleton: Zeile erscheint', /Feste Phasen aus dem Plan/.test(txt));
    pruef('mit phaseSkeleton: kein "undefined"', !/undefined/.test(txt),
      (txt.match(/.{0,60}undefined.{0,20}/) || [''])[0]);
  }

  console.log('');
  console.log(ok + ' OK - ' + fail + ' fehlgeschlagen');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
