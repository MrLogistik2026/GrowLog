// (v1.5.505) Nachschlagetexte und Wirkungszusagen stimmen mit ANBAU.md überein (Hebel 1 der Bewertung vom 30.10.2026).
//
// Befund: Lexikon „Überdüngung“ und „Flushen“ nannten „2–3× Topfvolumen“, „Drain-EC unter 1,0“ und „präventiv alle 4–6 Wochen“
// (gegen ANBAU.md 1.1, 5.1, 14); die Gießanleitung ① im Eintrag sagte „bis 15–20 % ablaufen“ neben „unten noch kein Drain“; die
// Anleitung „Empfohlene Werte übernehmen“ nannte Temperatur und Luftfeuchte, die die App nicht mehr einträgt; Spinnmilben-Texte
// rieten zu 60–65 % Luftfeuchte ohne Blüte-Grenze; Drain-pH-Soll 6,0–6,5 in Erde; „Macht die Buds dichter“, „um bis zu 700 %“.
//
// Der Wächter läuft über den ganzen ausgelieferten Quelltext (ohne Kommentarzeilen) und über die Laufzeit-Daten (LEXIKON, PROBLEMS,
// SYMPTOMS, INFO_TERMS, HOWTO) — es zählt, ob KEINE verbotene Form mehr vorkommt, nicht, ob eine neue vorkommt.
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const INDEX = process.env.GS_INDEX || path.join(__dirname, 'index.html');
const HTML = fs.readFileSync(INDEX, 'utf8');

// Verbotene Formen. Jede wird gezählt, nie mit find gesucht.
const VERBOTEN = [
  ['Topfvolumen als Spülmenge (2×/2–3×)', /\d\s?[–-]?\s?\d?\s?×\s?Topfvolumen/i],
  ['Literrechnung 22-33 L', /22[-–]33 L/],
  ['Drain-EC „soll unter 1.0 sinken“', /soll unter 1[.,]0 sinken/i],
  ['Vorbeugend spülen nach Kalender', /(präventiv|vorbeugend)[^.<']{0,40}(4[-–]6 Wochen)|alle 4[-–]6 Wochen präventiv/i],
  ['Düngekürzung 30–50 %', /Dosis um 30-50\s?%/],
  ['Düngekürzung 25–30 %', /Dosis um 25-30\s?%/],
  ['Spülwasser mit festem pH 6.4 „bis Drain austritt“', /Wasser \(pH 6\.4\) bis Drain/],
  ['Drain-pH-Soll 6,0–6,5 in Erde', /(sollte|soll)[^<']{0,25}6\.0–6\.5 in Erde|im Drain wieder 6\.0–6\.5/],
  ['Zulauf-pH Erde 6,2–6,5', /Erde 6[.,]2–6[.,]5|in Erde 6,2–6,5/],
  ['„Coco und Hydro 5,5–6,0“ in einer Zeile', /Coco und Hydro 5,5–6,0/],
  ['Spülen mit festem pH 6.5', /(mit pH 6\.5 spülen|Flush mit pH 6\.5)/],
  ['Spülung als Universallösung', /Spülung als Universallösung/],
  ['Zwischenguss mit 2× Topfvolumen', /Zwischenguss mit pH-korrigiertem Wasser/],
  ['„Niemals in der Peak-Blüte flushen“', /Niemals in der Peak-Blüte flushen/],
  ['Enzym-Zugabe ohne Beleg', /Enzym-Zugabe/],
  ['„Bei zu viel Dünger ist er feucht“', /Bei zu viel Dünger ist er feucht/],
  ['Feste Ziele pH 6.2–6.4, EC 0.8–2.0 im Hilfetext', /\(pH 6\.2–6\.4, EC 0\.8–2\.0\)/],
  ['Anleitung nennt Temp 23.5 °C / RLF 60 %', /Temp 23\.5\s?°C/],
  ['Spinnmilben: RLF 60–65 %', /RLF auf 60[–-]65\s?%|60[–-]65 % hochfahren|Luftfeuchte auf 60 ?%\+/i],
  ['Hitze: Luftfeuchte „auf 65 %“ ohne Phasen-Deckel', /\(auf 65 %\) entlastet/],
  ['„Photosynthese stoppt“ bei 32 °C', /Über 32\s?°C trocknen Trichome aus/],
  ['Wirkungszusage „Macht die Buds dichter“', /Macht die Buds dichter/],
  ['Wirkungszusage „um bis zu 700 %“', /um bis zu 700\s?%/],
  ['Wirkungszusage „lebenslang wirksam“', /lebenslang wirksam/],
  ['Wirkungszusage „drastisch reduziertes Risiko“', /drastisch reduziertes Risiko/],
  ['Wirkungszusage „Reichweite vervielfachen“', /Reichweite vervielfachen/],
  ['Wirkungszusage „verdoppelt den Schaden“', /verdoppelt den Schaden/],
  ['„verlangsamt Vermehrung drastisch“', /verlangsamt Vermehrung drastisch/],
];

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => null; w.navigator.vibrate = () => true; w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {}; w.alert = () => {}; w.print = () => {}; },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  w.toast = () => {};
  const E = (s) => w.eval(s);
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };

  // 1. Wächter über den ganzen Quelltext (ohne Kommentarzeilen)
  const skript = HTML.split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n');
  const treffer = VERBOTEN.filter(([, re]) => re.test(skript)).map(([name]) => name);
  pruefe(treffer.length === 0, 'Quelltext enthält keine verbotene Form (gefunden: ' + treffer.join('; ') + ')');

  // 2. Dieselbe Liste über die Laufzeit-Daten (Zeichenketten sind dort zusammengesetzt, Zahlen aus den Quellen eingesetzt)
  const lauf = JSON.parse(E('JSON.stringify([LEXIKON, PROBLEMS, SYMPTOMS, INFO_TERMS, HOWTO])'));
  const laufText = JSON.stringify(lauf).replace(/\\"/g, '"');
  const treffer2 = VERBOTEN.filter(([, re]) => re.test(laufText)).map(([name]) => name);
  pruefe(treffer2.length === 0, 'Laufzeit-Daten enthalten keine verbotene Form (gefunden: ' + treffer2.join('; ') + ')');
  pruefe(!/\d\s?[–-]?\s?\d?\s?×\s?Topfvolumen/i.test(laufText), 'Kein „N× Topfvolumen“ in Lexikon, Diagnose, Schnellhilfe, Infotexten');

  // 3. Sichtbare Stichproben: Lexikon-Einträge
  const eintrag = (t) => { const hits = []; for (const k of lauf[0]) for (const i of (k.items || [])) if (i.t === t) hits.push(i); return hits; };
  const txt = (i) => [i.brief, i.mechanism, i.practice, i.pitfall].join(' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const ZIEL = E('DRAIN_ZIEL.min + "–" + DRAIN_ZIEL.max');
  const ueberd = eintrag('Überdüngung');
  pruefe(ueberd.length === 1, 'Lexikon „Überdüngung“ ist genau einmal da (' + ueberd.length + ')');
  if (ueberd.length === 1) {
    const t = txt(ueberd[0]);
    pruefe(/halbieren/.test(t) && !/25-30|30-50/.test(t), 'Überdüngung: eine Kürzung („halbieren“)');
    pruefe(t.includes(ZIEL + ' % der Menge unten ablaufen') && /ab Tag 25/.test(t), 'Überdüngung: Durchgießen nur ab Tag 25 und bis ' + ZIEL + ' % Drain');
    pruefe(/schwerer Topf spricht gegen Wassermangel/.test(t), 'Überdüngung: Topf anheben zuerst');
    pruefe(/mindestens 15 % Drain/.test(t), 'Überdüngung: Drain-EC nur mit Gültigkeitsbedingung');
  }
  const flush = eintrag('Flushen (Zwischenguss)');
  pruefe(flush.length === 1, 'Lexikon „Flushen“ ist genau einmal da (' + flush.length + ')');
  if (flush.length === 1) {
    const t = txt(flush[0]);
    pruefe(t.includes('Eine feste Literzahl gibt es nicht') && t.includes(ZIEL + ' % der Menge unten ablaufen'), 'Flushen: Menge über den Drain-Anteil, keine Literzahl');
    pruefe(/nicht nach Kalender, sondern nach Messung/i.test(t) && !/nicht belegt/.test(t.slice(t.indexOf('Wann flushen'))), 'Flushen: nach Messung statt Kalender, ohne ungedecktes "nicht belegt"');
    pruefe(/Eine feste Zielzahl wie „unter 1,0“ gibt es nicht/.test(t) && !/kann er nicht fallen/.test(t), 'Flushen: keine feste Drain-EC-Zielzahl, keine absolute Aussage zum Gießwasser-EC');
  }
  const lockout = JSON.stringify(lauf[0]).replace(/\\"/g, '"');
  pruefe(/in gekalkter Erde sind 6,8–7,2 normal/.test(lockout), 'Erste Maßnahme: Drain-pH in gekalkter Erde 6,8–7,2 normal');
  const pHdown = eintrag('pH-Down / pH-Up').concat(eintrag('pH-Regler')).concat(lauf[0].flatMap((k) => (k.items || []).filter((i) => /Ziel nach Substrat/.test(i.practice || ''))));
  pruefe(pHdown.some((i) => /Ziel nach Substrat: Erde 6,2–6,4 · Coco 5,8–6,2 · Hydro 5,5–6,0/.test(i.practice)), 'pH-Zusatz nennt die Ziele nach Substrat aus phTargetFor');
  const mkp = eintrag('MKP (Mono-Kalium-Phosphat)');
  pruefe(mkp.length === 1 && !/Dichte/.test(mkp[0].brief) && /Zu viel Kalium verdrängt Magnesium/.test(mkp[0].brief), 'MKP: keine Dichte-Zusage, Magnesium-Vorbehalt');

  // 4. Spinnmilben und Hitze: Luftfeuchte nur bis zum Schimmel-Deckel
  const deckelMitte = E('KLIMA_ZIEL.mittel.deckel'), deckelSpaet = E('KLIMA_ZIEL.spaet.deckel');
  const milbe = lauf[1].filter((p) => p.lexiconKey === 'spider_mites');
  pruefe(milbe.length === 1, 'Diagnose Spinnmilben ist genau einmal da');
  if (milbe.length === 1) pruefe(milbe[0].action.includes(deckelMitte + ' % in früher und mittlerer, ' + deckelSpaet + ' % in später Blüte') && !/60 %\+/.test(milbe[0].action),
    'Diagnose Spinnmilben nennt den Schimmel-Deckel (' + deckelMitte + '/' + deckelSpaet + ' %) statt 60 %+');
  const hilfeMilbe = Object.values(lauf[3]).filter((v) => v && /Spinnmilben/.test(v.title || ''));
  pruefe(hilfeMilbe.length >= 1 && hilfeMilbe.every((v) => /höchstens 65 % in früher und mittlerer, 60 % in später Blüte/.test(v.tip || '')), 'Infotext Spinnmilben nennt den Deckel');
  const heiss = E(`(function(){ try { return getCriticalWarning('temp', 33.5, { ph: 'bloom' }, null, null); } catch (e) { return { fehler: String(e) }; } })()`);
  pruefe(heiss && heiss.action && /Stomata/.test(heiss.action) && !/deutlich über dem Bereich|Photosynthese stoppt/.test(heiss.action), 'Hitze über 32 °C: Stomata-Mechanismus statt „Photosynthese stoppt“ oder „deutlich“' + (heiss && heiss.fehler ? ' [' + heiss.fehler + ']' : ''));

  // 4b. Korrekturen der Gegenprüfung: Kalkpuffer, Eingaben-Zusage, Temperatur
  const lockoutZ = JSON.stringify(lauf[0]).replace(/\\"/g, '"');
  pruefe(/den Kalkpuffer löst es nicht auf/.test(lockoutZ) && /Nur bei zu hohem Drain-EC hilft einmaliges Durchgießen/.test(lockoutZ), 'pH-Lockout: Durchgießen nur bei zu hohem Drain-EC, löst den Kalkpuffer nicht');
  pruefe(!/Nur wenn der Drain-pH über mehrere Güsse weiter steigt und Symptome dazukommen: einmal mit Wasser/.test(lockoutZ), 'pH-Lockout: kein Durchgießen allein wegen steigendem Drain-pH');
  const src = JSON.stringify(lauf[1]) + HTML;
  pruefe(!/über mehrere Güsse steigendem Drain-pH: 1× leichter Flush/.test(src) && !/Güsse weiter steigt UND die Symptome zunehmen: einmal mit Wasser im pH-Ziel (Erde [^)]*) spülen/.test(src), 'Diagnose pH-Lockout und Drain-Drift: Flush nur mit Drain-EC-Bedingung');
  const howto0 = JSON.stringify(lauf[4]);
  pruefe(!/nie überschrieben/.test(howto0) && /Düngermengen auf 0/.test(howto0), 'Empfohlene Werte: kein „nie überschrieben“, Hinweis auf Düngermengen 0');
  pruefe(/die Temperatur ins Ziel deiner Phase bringen, die Luftfeuchte nur bis zum Ziel anheben/.test(HTML) && !/Temperatur ins Ziel deiner Phase und die Luftfeuchte nur bis zum Ziel anheben/.test(HTML), 'Spinnmilben-Schnellhilfe: die Temperatur wird gebracht, nur die Luftfeuchte „angehoben“');

  // 5. Anleitung „Empfohlene Werte übernehmen“
  const alle = (x, out = []) => { if (Array.isArray(x)) x.forEach((y) => alle(y, out)); else if (x && typeof x === 'object') { out.push(x); Object.values(x).forEach((y) => alle(y, out)); } return out; };
  const howto = alle(lauf[4]).filter((h) => /Empfohlene Werte/.test(h.t || ''));
  pruefe(howto.length === 1 && /Temperatur und Luftfeuchte füllt die App nicht aus/.test(howto[0].txt) && !/23\.5|RLF\) 60/.test(howto[0].txt), 'Hilfe „Empfohlene Werte“: kein Temp/RLF-Versprechen');

  // 6. Gießanleitung ① im Eintrag folgt derselben Regel wie Startseite und Lern-Status
  const lage = (minTag, maxTag, bedingung) => E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true; S.beginnerMode = true;
    for (let t = ${minTag}; t <= ${maxTag}; t++) {
      S.cycles = []; const c = addCyc({ name: 'Test', startDate: isoPlus(todayISO(), -(t - 1)), seedType: 'auto', growType: 'indoor', medium: 'erde',
        potSize: 11, plantCount: 1, startMethod: 'saturated' }, { still: true }); S.cycles = [c];
      const a = getAction(todayISO(), c);
      if (a !== 'giess' && a !== 'giess_anz') continue;
      const p = phase(todayISO(), c); const g = gussMengeJePflanze(c, p, todayISO());
      const kommt = !g || _drainZuErwarten(c, todayISO(), g);
      if (${bedingung}) { openEntry(todayISO()); return { id: c.id, tag: t, kommt: kommt }; }
    }
    return null; })()`);
  const eintragText = () => ((w.document.getElementById('scr-entry') || w.document.body).textContent || '').replace(/\s+/g, ' ');
  const kein = lage(26, 80, '!kommt');
  pruefe(!!kein, 'Prüflage: Gießtag ab Tag 25, an dem bei der Menge kein Drain kommt');
  if (kein) {
    const t = eintragText();
    const i = t.indexOf('① Vollsättigung');
    const stueck = i >= 0 ? t.slice(i, i + 420) : '';
    pruefe(/kommt unten noch kein Drain/.test(t), 'Eintrag sagt „kommt unten noch kein Drain“ (Tag ' + kein.tag + ')');
    pruefe(i >= 0 && !new RegExp('bis ' + ZIEL + ' % unten ablaufen').test(stueck), 'Gießanleitung ① verspricht dort keine ' + ZIEL + ' % Drain: ' + stueck.slice(0, 160));
    pruefe(/① Vollsättigung: Gieß/.test(stueck), 'Gießanleitung ① nennt stattdessen die Menge ohne Drain');
  }
  const mit = lage(26, 80, 'kommt');
  if (mit) {
    const t = eintragText();
    const i = t.indexOf('① Vollsättigung');
    pruefe(i >= 0 && new RegExp('bis ' + ZIEL + ' % unten ablaufen').test(t.slice(i, i + 200)), 'Wo Drain entstehen kann, bleibt ① bei ' + ZIEL + ' % (Tag ' + mit.tag + ')');
  }
  const jung = lage(9, 20, 'true');
  pruefe(!!jung && /① Noch nicht durchgießen/.test(eintragText()), 'Vor Tag 25 bleibt ① „Noch nicht durchgießen“');

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
