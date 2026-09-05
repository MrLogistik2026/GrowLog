/**
 * (v1.5.101) Sichert die VPD-Rechnung und ihre Bewertung ab.
 *
 * Zwei getrennte Dinge werden geprueft:
 *
 * 1. DIE FORMEL. `_svp` ist die Magnus-Gleichung, `calcVPD` das Blatt-VPD daraus
 *    (SVP(T_Blatt) - SVP(T_Luft) * RH/100). Der Test rechnet unabhaengig nach, damit eine
 *    versehentliche Aenderung an der Formel sofort auffaellt - an ihr haengen Giessmenge,
 *    Klimabewertung und Trocknungsprognose.
 *
 * 2. DIE BEWERTUNG. Der Fehler: `vpdZone` vergab fuer -0.5, -0.36, -0.01, 0 und 0.05
 *    dasselbe Etikett "Zu feucht - Luefter an!". Ein Blatt-VPD von 0 oder darunter heisst
 *    aber, dass Wasser auf dem Blatt KONDENSIERT: stehende Naesse auf den Blueten, in der
 *    Bluete der direkte Weg zu Botrytis. Dazu wurde der Skalen-Marker mit
 *    Math.min(95, pct) positioniert - bei negativem VPD war pct negativ, der Marker rutschte
 *    aus der Skala und war ausgerechnet in der gefaehrlichsten Lage unsichtbar.
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

let ok = 0, fail = 0;
function pruef(name, bedingung, info) {
  if (bedingung) { ok++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FEHL ' + name + (info ? '  -> ' + info : '')); }
}

// Unabhaengige Referenz - bewusst hier ausgeschrieben und nicht aus der App geholt.
const svpRef = (t) => 0.6108 * Math.exp(17.27 * t / (t + 237.3));
const vpdBlattRef = (t, rh, off) => svpRef(t - off) - svpRef(t) * rh / 100;
const vpdLuftRef = (t, rh) => svpRef(t) * (1 - rh / 100);
const r2 = (x) => Math.round(x * 100) / 100;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  console.log('');
  console.log('A - Die Formel stimmt mit der Magnus-Gleichung ueberein');
  {
    const off = E('_leafOffset()');
    pruef('Blatt-Offset ist standardmaessig 2 K', off === 2, 'off=' + off);

    const faelle = [
      [25, 55], [22, 60], [28, 45], [20, 70], [26, 50], [15, 85], [32, 35],
      [25, 100], [25, 0], [0, 50], [-5, 50], [40, 20], [18, 65], [30, 60],
    ];
    let abweichungen = [];
    faelle.forEach(([t, rh]) => {
      const app = E(`calcVPD(${t}, ${rh})`);
      const ref = r2(vpdBlattRef(t, rh, off));
      if (app !== ref) abweichungen.push(`${t}C/${rh}%: App ${app} vs Referenz ${ref}`);
    });
    pruef(`Alle ${faelle.length} Wertepaare deckungsgleich`, abweichungen.length === 0,
      abweichungen.join(' | '));

    let luftAbw = [];
    faelle.forEach(([t, rh]) => {
      const app = E(`calcVPDAir(${t}, ${rh})`);
      const ref = r2(vpdLuftRef(t, rh));
      if (app !== ref) luftAbw.push(`${t}C/${rh}%: ${app} vs ${ref}`);
    });
    pruef('Luft-VPD ebenfalls deckungsgleich', luftAbw.length === 0, luftAbw.join(' | '));

    // Die Beispielwerte aus dem Codekommentar
    pruef('Kommentarbeispiel 25C/55%: Blatt 1.07 kPa', E('calcVPD(25, 55)') === 1.07);
    pruef('Kommentarbeispiel 25C/55%: Luft 1.43 kPa', E('calcVPDAir(25, 55)') === 1.43);

    // Offset 0 muss Blatt- und Luft-VPD identisch machen (steht so im Kommentar)
    E('S.leafOffset = 0');
    pruef('Bei Offset 0 sind Blatt- und Luft-VPD gleich',
      E('calcVPD(25, 55)') === E('calcVPDAir(25, 55)'));
    E('S.leafOffset = 2');
  }

  console.log('');
  console.log('B - Kondensation ist eine eigene Stufe, nicht "etwas zu feucht"');
  {
    const bloom = "{ ph:'bloom', week:9, day:100 }";
    ['-0.5', '-0.36', '-0.01', '0'].forEach(v => {
      const l = E(`vpdZone(${v}, ${bloom}, 'indoor').label`);
      pruef(`VPD ${v} wird als Schimmelgefahr ausgewiesen`, /Schimmelgefahr/.test(l), 'label=' + l);
    });
    pruef('VPD 0.05 bleibt "Zu feucht" (kein Fehlalarm)',
      E(`vpdZone(0.05, ${bloom}, 'indoor').label`) === 'Zu feucht');
    pruef('VPD 0.3 bleibt "Zu feucht"',
      E(`vpdZone(0.3, ${bloom}, 'indoor').label`) === 'Zu feucht');

    const hinweis = E(`vpdZone(-0.2, ${bloom}, 'indoor').hint`);
    pruef('Hinweis nennt die Ursache (Wasser am Blatt)', /Wasser nieder/.test(hinweis));
    pruef('Hinweis nennt konkrete Handlungen', /entfeuchten/.test(hinweis) && /Temperatur/.test(hinweis));
    pruef('Hinweis warnt in der Bluete vor Schimmel an den Blueten', /Blüten/.test(hinweis) && /Stunden/.test(hinweis));

    const drinnenVegi = E("vpdZone(-0.2, { ph:'anzucht', day:30 }, 'indoor').hint");
    pruef('Ausserhalb der Bluete ohne Blueten-Zusatz', !/Blüten/.test(drinnenVegi));

    const draussen = E(`vpdZone(-0.2, ${bloom}, 'outdoor').hint`);
    pruef('Outdoor raet nicht zu Geraeten, die es dort nicht gibt',
      !/entfeuchten/.test(draussen) && /Regen/.test(draussen), draussen.slice(0, 80));

    pruef('Die Stufe ist rot, nicht blau',
      E(`vpdZone(-0.2, ${bloom}, 'indoor').color`) === '#e06060');
  }

  console.log('');
  console.log('C - Der Skalen-Marker bleibt sichtbar');
  {
    const bloom = "{ ph:'bloom', week:9, day:100 }";
    const werte = [-2, -0.5, -0.01, 0, 0.05, 1.1, 2.5, 8];
    let raus = [];
    werte.forEach(v => {
      const pct = E(`vpdZone(${v}, ${bloom}, 'indoor').pct`);
      const links = Math.max(0, Math.min(95, pct));
      if (links < 0 || links > 95) raus.push(v + ' -> ' + links);
      if (pct < 0) raus.push('pct selbst negativ bei ' + v + ': ' + pct);
    });
    pruef('Kein Wert erzeugt eine Marker-Position ausserhalb der Skala', raus.length === 0, raus.join(' | '));
    pruef('Bei Kondensation steht der Marker ganz links (0)',
      E(`vpdZone(-0.5, ${bloom}, 'indoor').pct`) === 0);
    pruef('Bei sehr hohem VPD wird die Position gedeckelt',
      E(`vpdZone(8, ${bloom}, 'indoor').pct`) <= 97);
  }

  console.log('');
  console.log('D - Extremwerte stuerzen nicht ab');
  {
    let fehler = [];
    [[-40, 0], [60, 100], [0, 0], [100, 100], [37.5, 33.3]].forEach(([t, rh]) => {
      try {
        const v = E(`calcVPD(${t}, ${rh})`);
        if (!isFinite(v)) fehler.push(`${t}C/${rh}% -> ${v}`);
        const z = E(`vpdZone(calcVPD(${t}, ${rh}), { ph:'bloom', week:5 }, 'indoor')`);
        if (!z) fehler.push(`${t}C/${rh}% -> keine Zone`);
      } catch (e) { fehler.push(`${t}C/${rh}% Absturz: ${e.message}`); }
    });
    pruef('Alle Extremwerte liefern endliche Zahlen und eine Zone', fehler.length === 0, fehler.join(' | '));
    pruef('Ungueltige Eingaben ergeben null', E('calcVPD(NaN, 50)') === null && E('calcVPD(25, NaN)') === null);
  }

  console.log('');
  console.log(`Ergebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
