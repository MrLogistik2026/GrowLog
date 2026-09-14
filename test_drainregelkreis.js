/**
 * (v1.5.112) Die Giessmenge fuehrt sich am gemessenen Ablauf nach.
 *
 * Patricks Meldung vom 06.09.2026: "Ich bin kein Fan davon, wenn ich selbst meine
 * Wassermengen der Phasen einstellen muss. Ich weiss dies zb. nur aus Erfahrungswerten.
 * Wie will das ein User schaffen, der wenig oder noch keine Erfahrung hat?"
 *
 * Der Befund dazu, gemessen an seinen eigenen Daten: Ueber 35 selbst eingetragene Guesse lag
 * die Empfehlung im Mittel 23 % daneben, fast immer nach unten. Die Ursache war eine Falle:
 * Weil die Vorschlaege nicht passten, hatte er eigene Phasen-Korridore gesetzt - und genau
 * das schaltete die Selbstkorrektur ab. In `waterSuggestion` stand: "Ein SELBST gesetzter
 * Korridor bleibt unangetastet ... Aufgeweitet wird nur der Standard-Korridor der App."
 *
 * Die Loesung: Die Frage "wie viele ml?" kann niemand beantworten, die Frage "laeuft genug
 * unten raus?" jeder. Aus dem gemessenen Ablauf wird die Menge hergeleitet - ueber eine
 * Mengenbilanz, nicht ueber eine Faustregel:
 *
 *     aufgenommen = alt * (1 - ist)
 *     neu         = aufgenommen / (1 - ziel)
 *     Faktor      = (1 - ist) / (1 - ziel)
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

// Tag 104 = letzter Duengerguss, 9000 ml, Phase bloom
const T104 = 103;
const setDrain = (E, ml) => E(ml === null
  ? `delete S.entries[isoPlus(S.cycles[0].startDate, ${T104})].cycleData[S.cycles[0].id].drainMl; saveS();`
  : `S.entries[isoPlus(S.cycles[0].startDate, ${T104})].cycleData[S.cycles[0].id].drainMl = '${ml}'; saveS();`);
const vorschlag = (E) => E(`(function(){ const c=S.cycles[0], i=isoPlus(c.startDate,${T104}); return waterSuggestion(c, phase(i,c), i); })()`);

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));

  console.log('');
  console.log('A - Die Bilanz rechnet richtig');
  {
    const { E, errors } = await load();
    pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
    pruef('Zielfenster ist 15-20 %',
      E('DRAIN_ZIEL.min') === 15 && E('DRAIN_ZIEL.max') === 20, 'min=' + E('DRAIN_ZIEL.min'));
    pruef('Ohne Ablaufmessung gibt es keine Nachfuehrung',
      E(`drainAdjust(S.cycles[0], isoPlus(S.cycles[0].startDate, ${T104}))`) === null);

    // (1 - 0,10) / (1 - 0,175) = 1,0909…
    setDrain(E, 900);   // 10 % von 9000
    const f10 = JSON.parse(E(`JSON.stringify(drainAdjust(S.cycles[0], isoPlus(S.cycles[0].startDate, ${T104})))`));
    pruef('10 % Ablauf ergibt Faktor 1,091', Math.abs(f10.faktor - 1.0909) < 0.001, 'f=' + f10.faktor);
    pruef('Richtung ist "mehr"', f10.richtung === 'mehr');

    // (1 - 0,30) / (1 - 0,175) = 0,8484…
    setDrain(E, 2700);  // 30 %
    const f30 = JSON.parse(E(`JSON.stringify(drainAdjust(S.cycles[0], isoPlus(S.cycles[0].startDate, ${T104})))`));
    pruef('30 % Ablauf ergibt Faktor 0,848', Math.abs(f30.faktor - 0.8485) < 0.001, 'f=' + f30.faktor);
    pruef('Richtung ist "weniger"', f30.richtung === 'weniger');

    setDrain(E, 1600);  // 17,8 % - im Ziel
    const fZiel = JSON.parse(E(`JSON.stringify(drainAdjust(S.cycles[0], isoPlus(S.cycles[0].startDate, ${T104})))`));
    pruef('Im Zielfenster bleibt der Faktor 1', fZiel.faktor === 1);
    pruef('Richtung ist "passt"', fZiel.richtung === 'passt');
  }

  console.log('');
  console.log('B - Der Vorschlag folgt dem Ablauf, monoton und ohne Sprung');
  {
    const { E } = await load();
    const reihe = [];
    for (const ml of [450, 900, 1350, 1600, 1800, 2250, 2700, 3600]) {
      setDrain(E, ml);
      reihe.push({ pct: Math.round(ml / 9000 * 1000) / 10, v: vorschlag(E) });
    }
    let bruch = null;
    for (let i = 1; i < reihe.length; i++) {
      if (reihe[i].v > reihe[i - 1].v) bruch = `${reihe[i-1].pct}% (${reihe[i-1].v}) -> ${reihe[i].pct}% (${reihe[i].v})`;
    }
    pruef('Mehr Ablauf ergibt nie mehr Wasser', bruch === null, bruch);
    pruef('Bei 5 % Ablauf deutlich mehr als bei 30 %',
      reihe[0].v > reihe[6].v, JSON.stringify(reihe.map(r => r.pct + '%:' + r.v)));

    // Im Zielfenster wird die tatsaechlich gegossene Menge bestaetigt
    const imZiel = reihe.filter(r => r.pct >= 15 && r.pct <= 20).map(r => r.v);
    pruef('Im Zielfenster ist der Vorschlag stabil',
      new Set(imZiel).size === 1, 'Werte: ' + imZiel.join(', '));
    pruef('Und er entspricht der gegossenen Menge (9000 ml)',
      imZiel[0] === 9000, 'vorschlag=' + imZiel[0]);
  }

  console.log('');
  console.log('C - Der eigene Korridor sperrt die Messung nicht mehr aus');
  {
    const { E } = await load();
    // Patricks Zustand: eigene Korridore gesetzt
    pruef('Es gibt einen eigenen Korridor fuer die Reife-Phase',
      E("!!(S.cycles[0].waterRange && S.cycles[0].waterRange.reife)"));
    const ohne = vorschlag(E);
    setDrain(E, 450);   // 5 % - viel zu wenig
    const mit = vorschlag(E);
    pruef('Trotz eigenem Korridor zieht die Messung die Menge hoch',
      mit > ohne, `ohne=${ohne} mit=${mit}`);
    pruef('Die Anhebung ist spuerbar (mindestens 15 %)',
      mit >= ohne * 1.15, `ohne=${ohne} mit=${mit}`);
  }

  console.log('');
  console.log('D - Spuelen und IceFlush bleiben unberuehrt');
  {
    const { E } = await load();
    setDrain(E, 450);   // starke Nachfuehrung aktiv
    const spuelV = E(`(function(){ const c=S.cycles[0], i=isoPlus(c.startDate,109); return waterSuggestion(c, phase(i,c), i); })()`);
    const iceV = E(`(function(){ const c=S.cycles[0], i=isoPlus(c.startDate,113); return waterSuggestion(c, phase(i,c), i); })()`);
    // Ohne Nachfuehrung dieselben Tage
    setDrain(E, null);
    const spuelO = E(`(function(){ const c=S.cycles[0], i=isoPlus(c.startDate,109); return waterSuggestion(c, phase(i,c), i); })()`);
    const iceO = E(`(function(){ const c=S.cycles[0], i=isoPlus(c.startDate,113); return waterSuggestion(c, phase(i,c), i); })()`);
    pruef('Spuelmenge unveraendert', spuelV === spuelO, `mit=${spuelV} ohne=${spuelO}`);
    pruef('IceFlush-Menge unveraendert', iceV === iceO, `mit=${iceV} ohne=${iceO}`);
  }

  console.log('');
  console.log('E - Nur brauchbare Messungen zaehlen');
  {
    const { E } = await load();
    setDrain(E, 200);   // 2,2 % - fast nichts kam unten an
    // (v1.5.167) Bis v1.5.166 fiel alles unter 5 % heraus. Fuer die Menge ist "fast nichts" aber genau der Befund.
    const f2 = JSON.parse(E(`JSON.stringify(drainAdjust(S.cycles[0], isoPlus(S.cycles[0].startDate, ${T104})))`));
    pruef('2,2 % Ablauf zieht die Menge nach oben (Faktor 1,186)',
      !!f2 && f2.richtung === 'mehr' && Math.abs(f2.faktor - 1.1855) < 0.001, JSON.stringify(f2));

    // Ein von der App vorgeschlagener Guss darf nicht als Messung zaehlen
    const { E: E2 } = await load((st) => {
      const c = st.cycles.find(x => x.active);
      const iso = Object.keys(st.entries).sort().filter(k => {
        const cd = st.entries[k].cycleData && st.entries[k].cycleData[c.id];
        return cd && cd.water;
      }).pop();
      const cd = st.entries[iso].cycleData[c.id];
      cd.drainMl = '100';
      cd._suggested = Object.assign({}, cd._suggested, { water: true });
    });
    pruef('Ein von der App gefuellter Guss zaehlt nicht als Messung',
      E2(`drainAdjust(S.cycles[0], todayISO())`) === null);
  }

  console.log('');
  console.log('F - Der Lern-Status sagt, was passiert');
  {
    const { E } = await load();
    E('S.beginnerMode = false');
    setDrain(E, 900);   // 10 %
    E(`openEntry(isoPlus(S.cycles[0].startDate, ${T104}))`);
    await new Promise((r) => setTimeout(r, 200));
    const txt = E("document.getElementById('scr-entry').textContent.replace(/\\s+/g,' ')");
    pruef('Der Ablaufwert wird genannt', /10 %/.test(txt), txt.slice(0, 60));
    pruef('Es steht da, dass nach oben gegangen wird',
      /mit der Menge nach oben/.test(txt));
    pruef('Das Zielfenster wird genannt', /15–20 %/.test(txt));
  }

  console.log('');
  console.log('H - Zu wenig Ablauf hebt die Menge, aber nicht in den ersten Wochen (v1.5.167)');
  {
    // Patrick am 14.09.2026: "Wenn der Drain zu gering ist, dann sollte die Giessmenge erhoeht werden.
    // Aber beachte die ersten Wochen. Dort kann man keinen Drain erzeugen."
    const { E } = await load();
    const adj = (tag) => JSON.parse(E(`JSON.stringify(drainAdjust(S.cycles[0], isoPlus(S.cycles[0].startDate, ${tag - 1})))`));
    const setDrainTag = (tag, ml) => E(`(function(){ const c=S.cycles[0], cd=S.entries[isoPlus(c.startDate, ${tag - 1})].cycleData[c.id];
      ${ml === null ? 'delete cd.drainMl;' : `cd.drainMl='${ml}';`} saveS(); })()`);

    pruef('phase().day zaehlt ab Tag 1 (Tag 24 = Startdatum + 23)',
      E(`phase(isoPlus(S.cycles[0].startDate, 23), S.cycles[0]).day`) === 24);

    setDrain(E, 0);
    const f0 = adj(104);
    pruef('0 ml Ablauf an Tag 104: Richtung "mehr", Faktor 1,212',
      !!f0 && f0.richtung === 'mehr' && Math.abs(f0.faktor - 1.2121) < 0.001, JSON.stringify(f0));

    // Die ganze Kennlinie, nicht ein Punkt (Lehre aus v1.5.112)
    setDrain(E, null);
    const ohneMessung = vorschlag(E);
    const reihe = [];
    for (const ml of [0, 90, 200, 441, 450, 900, 1600, 2700, 3600]) {
      setDrain(E, ml);
      reihe.push({ pct: Math.round(ml / 9000 * 1000) / 10, v: vorschlag(E) });
    }
    const zeig = JSON.stringify(reihe.map(r => r.pct + '%:' + r.v)) + ' ohne=' + ohneMessung;
    let bruch = null;
    for (let i = 1; i < reihe.length; i++) {
      if (reihe[i].v > reihe[i - 1].v) bruch = `${reihe[i-1].pct}% (${reihe[i-1].v}) -> ${reihe[i].pct}% (${reihe[i].v})`;
    }
    pruef('Kennlinie 0 bis 40 % Ablauf: mehr Ablauf ergibt nie mehr Wasser', bruch === null, (bruch || '') + ' ' + zeig);
    const v49 = reihe.find(r => r.pct === 4.9).v, v5 = reihe.find(r => r.pct === 5).v;
    pruef('Kein Bruch an der alten 5-%-Grenze: 4,9 % hebt mindestens wie 5 %',
      v49 >= v5 && v49 > ohneMessung, zeig);
    pruef('0 % Ablauf hebt ueber den Vorschlag ohne Messung', reihe[0].v > ohneMessung, zeig);

    // Die ersten Wochen
    setDrain(E, null);
    setDrainTag(24, 0);
    pruef('Tag 24 (vor der Vollsaettigung): 0 ml Ablauf ist kein Befund', adj(24) === null, JSON.stringify(adj(24)));
    pruef('... und zieht auch spaeter nichts nach', adj(104) === null, JSON.stringify(adj(104)));
    setDrainTag(24, null);
    setDrainTag(27, 0);
    const f27 = adj(27);
    pruef('Tag 27 (ab Vollsaettigung): 0 ml Ablauf hebt die Menge', !!f27 && f27.richtung === 'mehr', JSON.stringify(f27));
    setDrainTag(27, null);

    // Eintrag: das Ablauf-Feld folgt derselben Grenze wie die Nachfuehrung
    E('S.beginnerMode = false');
    const feld = async (tag) => {
      E(`openEntry(isoPlus(S.cycles[0].startDate, ${tag - 1}))`);
      await new Promise((r) => setTimeout(r, 150));
      return E(`!!document.getElementById('runoff-ml-' + S.cycles[0].id)`);
    };
    // Patricks Giesstage um die Grenze: Tag 24 (davor) und Tag 27 (danach); an Tag 25 gibt es kein Wasserfeld
    const feld24 = await feld(24), feld27 = await feld(27);
    pruef('Ablauf-Feld fehlt am Giesstag 24 und steht am Giesstag 27', feld24 === false && feld27 === true, `24=${feld24} 27=${feld27}`);

    // Lern-Status bei 0 %
    setDrain(E, 0);
    E(`openEntry(isoPlus(S.cycles[0].startDate, ${T104}))`);
    await new Promise((r) => setTimeout(r, 200));
    const txt = E("document.getElementById('scr-entry').textContent.replace(/\\s+/g,' ')");
    pruef('Bei 0 % sagt der Lern-Status "kam unten nichts an" und geht nach oben',
      /kam unten nichts an/.test(txt) && /mit der Menge nach oben/.test(txt), (txt.match(/Bei deine[^.]*\./) || ['(kein Satz)'])[0]);

    // Eine Quelle fuer die Grenze
    const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
    const kopien = src.split(/\r?\n/).filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z) && /\b(day|growDay)\s*>=\s*25\b/.test(z));
    pruef('Die Tag-25-Grenze steht nur noch in DRAIN_AB_TAG', kopien.length === 0,
      kopien.map(z => z.trim().slice(0, 90)).join(' | '));
  }

  console.log('');
  console.log('G - Der Drain-Zielwert steht ueberall bei 15-20 %');
  {
    const { E } = await load();
    const alt = E(`(function(){
      const t = [];
      ['5–10% Drain','5-10% Drain','5–10 % Drain'].forEach(s => {
        if (document.documentElement.innerHTML.includes(s)) t.push(s);
      });
      return t.join(', ');
    })()`);
    pruef('Kein "5-10 % Drain" mehr im ausgelieferten HTML', alt === '', 'gefunden: ' + alt);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
