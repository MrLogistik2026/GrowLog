/**
 * (v1.5.264) Erntetag nach der Trichom-Messung — Startseite, Tageskarte, Hinweise und Tipps.
 *
 * Der Fehler (Bewertung vom 17.09.2026, am Code bestätigt, Schwere „hoch"): Am Plan-Erntetag befahl die Startseite
 * „Heute ist Erntetag! Schneide die Pflanze ab", ohne die Trichom-Messung zu lesen — auch bei 30 % klar von heute, bei einer
 * 6 Tage alten Messung oder ganz ohne Messung. Der Eintrag sagte am selben Tag „Noch zu viel klar — Geduld!". Zu früh ernten
 * ist der eine Fehler, der sich nicht zurückholen lässt (ANBAU.md 11); Trichome schlagen den Plan-Erntetag (15).
 *
 * Jetzt entscheidet ernteFreigabe(c, iso) mit derselben Regel wie die Trichom-Karte: Messung höchstens TRICH_FRISCH_TAGE alt,
 * reif ab Klar ≤ RIPE_CLEAR_DONE, das eigene Bernstein-Ziel entscheidet nur „jetzt oder später", nie „zu früh".
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
  else { fail++; console.log('  FEHL ' + name + (info !== undefined ? '  -> ' + info : '')); }
}

// Zyklus anlegen und so datieren, dass heute der Plan-Erntetag ist. trich: Liste {tageZurueck, klar, milchig, bernstein}.
const ERNTETAG = (opt) => `(function(){
  S.cycles = []; S.entries = {}; S.beginnerMode = ${opt.einsteiger !== false};
  const c = addCyc({ name: 'Ernte', seedType: 'auto', medium: '${opt.medium || 'erde'}' });
  c.potSize = 11; c.plantCount = 2; c.targetAmber = ${opt.ziel || 5};
  let gefunden = false;
  for (let d = 80; d <= 160; d++) {
    c.startDate = isoPlus(todayISO(), -(d - 1));
    if (getAction(todayISO(), c) === 'ernte') { gefunden = true; break; }
  }
  if (!gefunden) return JSON.stringify({ fehlt: true });
  const heute = todayISO();
  ${JSON.stringify(opt.trich || [])}.forEach(t => {
    const iso = isoPlus(heute, -t.tageZurueck);
    if (!S.entries[iso]) S.entries[iso] = {};
    if (!S.entries[iso].cycleData) S.entries[iso].cycleData = {};
    const cd = S.entries[iso].cycleData[c.id] || (S.entries[iso].cycleData[c.id] = {});
    cd.trichomes = t.nurBernstein ? { amber: t.bernstein } : { clear: t.klar, milky: t.milchig, amber: t.bernstein };
  });
  saveS();
  const p = phase(heute, c);
  const a = getAction(heute, c);
  const karte = getTodayAction(c, p, a, heute);
  const satz = plainSentence(a, c, p, waterSuggestion(c, p));
  renderDash();
  const dash = document.getElementById('scr-dash').textContent.replace(/\\s+/g, ' ');
  const tipp = getSmartTip(c, p);
  const hinweise = getAlerts(c).map(x => x.text).join(' | ');
  return JSON.stringify({ tag: p.day, freigabe: ernteFreigabe(c, heute), titel: karte.title, schritte: karte.steps.join(' | '),
    knoepfe: (karte.aktionen || []).map(x => x.label).join(','), satz, dash, tipp: tipp ? tipp.text : '', hinweise });
})()`;

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);
  const lauf = (opt) => JSON.parse(E(ERNTETAG(opt)));
  const schneideBefehl = /Schneide die Pflanze ab|Heute: Ernte!|Ernten! Dunkel stellen/;

  console.log('\nA - Plan-Erntetag ohne jede Trichom-Messung');
  const a = lauf({});
  pruef('Plan-Erntetag gefunden', !a.fehlt, JSON.stringify(a).slice(0, 80));
  if (!a.fehlt) {
    pruef('Freigabe: ohneMessung', a.freigabe.status === 'ohneMessung', JSON.stringify(a.freigabe));
    pruef('Kein Schnitt-Befehl in Satz, Karte, Tipp', !schneideBefehl.test(a.satz + a.titel + a.tipp), a.titel + ' · ' + a.satz.slice(0, 120));
    pruef('Satz: erst unter die Lupe, Grenze aus RIPE_CLEAR_DONE', /Schau vor dem Schnitt unter die Lupe/.test(a.satz) && /höchstens 10 %/.test(a.satz), a.satz);
    pruef('Karte: „erst Trichome prüfen" mit Knopf zur Messung statt „Erledigt"', /erst Trichome prüfen/.test(a.titel) && a.knoepfe === '🔬 Trichome eintragen', a.titel + ' / ' + a.knoepfe);
    pruef('Startseite zeigt den Knopf zur Messung', /Trichome eintragen/.test(a.dash), (a.dash.match(/Plan-Erntetag.{0,160}/) || [''])[0]);
    pruef('Bis zur Reife: gießen beim Gießpunkt der Erde („Knapp"), klares Wasser', /Hebe-Test „Knapp" zeigt — nur klares Wasser/.test(a.satz));
    pruef('Hinweis: „Vor der Ernte: Trichome prüfen" statt „Ernte naht!"', /Vor der Ernte: Trichome prüfen/.test(a.hinweise) && !/Ernte naht!/.test(a.hinweise), a.hinweise);
  }

  console.log('\nB - Messung von heute: noch 30 % klar');
  const b = lauf({ trich: [{ tageZurueck: 0, klar: 30, milchig: 68, bernstein: 2 }] });
  if (!b.fehlt) {
    pruef('Freigabe: nochNicht', b.freigabe.status === 'nochNicht' && b.freigabe.klar === 30, JSON.stringify(b.freigabe));
    pruef('Kein Schnitt-Befehl', !schneideBefehl.test(b.satz + b.titel + b.tipp), b.titel);
    pruef('Satz: „deine Trichome sagen noch nicht" und „Noch nicht schneiden"', /deine Trichome sagen noch nicht/.test(b.satz) && /Noch nicht schneiden/.test(b.satz), b.satz);
    pruef('Karte: „noch nicht schneiden", nennt 30 % klar', /noch nicht schneiden/.test(b.titel) && /30 % klar/.test(b.schritte), b.titel + ' · ' + b.schritte);
    pruef('Tipp und Hinweis sagen „noch nicht"', /noch nicht schneiden/.test(b.tipp) && /Trichome noch nicht reif \(30 % klar\)/.test(b.hinweise), b.tipp + ' / ' + b.hinweise);
  }

  console.log('\nC - Letzte Messung 5 Tage alt, damals schon reif');
  const cc = lauf({ trich: [{ tageZurueck: 5, klar: 5, milchig: 85, bernstein: 10 }] });
  if (!cc.fehlt) {
    pruef('Freigabe: veraltet (älter als TRICH_FRISCH_TAGE)', cc.freigabe.status === 'veraltet' && cc.freigabe.alterTage === 5, JSON.stringify(cc.freigabe));
    pruef('Kein Schnitt-Befehl aus einer alten Messung', !schneideBefehl.test(cc.satz + cc.titel), cc.titel);
    pruef('Satz und Karte nennen das Alter', /5 Tage alt/.test(cc.satz) && /5 Tage alt/.test(cc.schritte), cc.schritte);
  }

  console.log('\nD - Messung von gestern: reif, Bernstein-Ziel erreicht');
  const d = lauf({ trich: [{ tageZurueck: 1, klar: 5, milchig: 83, bernstein: 12 }] });
  if (!d.fehlt) {
    pruef('Freigabe: reif, Ziel erreicht', d.freigabe.status === 'reif' && d.freigabe.zielErreicht === true, JSON.stringify(d.freigabe));
    pruef('Karte: „Heute: Ernte!" mit „Erledigt"', d.titel === '✂️ Heute: Ernte!' && d.knoepfe === '' && /Erledigt/.test(d.dash), d.titel);
    pruef('Satz: schneiden, bevor das Licht angeht', /Schneide die Pflanze ab, bevor das Licht angeht/.test(d.satz), d.satz);
    pruef('Hinweis: „Ernte naht — deine Trichome sind reif"', /Ernte naht — deine Trichome sind reif/.test(d.hinweise), d.hinweise);
  }

  console.log('\nE - Reif, aber das eigene Bernstein-Ziel (15 %) ist nicht erreicht');
  const e = lauf({ ziel: 15, trich: [{ tageZurueck: 0, klar: 8, milchig: 88, bernstein: 4 }] });
  if (!e.fehlt) {
    pruef('Freigabe: reif, Ziel nicht erreicht', e.freigabe.status === 'reif' && e.freigabe.zielErreicht === false && e.freigabe.ziel === 15, JSON.stringify(e.freigabe));
    pruef('Karte: „Ernte möglich", Ziel 15 % noch nicht erreicht', e.titel === '✂️ Heute: Ernte möglich' && /dein Ziel 15 %, noch nicht erreicht/.test(e.schritte), e.titel + ' · ' + e.schritte);
    pruef('Satz: schneiden erlaubt, Warten für mehr Bernstein erklärt', /Du kannst heute schneiden/.test(e.satz) && /ruhigere, schläfrigere Wirkung/.test(e.satz), e.satz);
  }

  console.log('\nF - Nur Bernstein eingetragen, kein Klar-Wert');
  const f = lauf({ trich: [{ tageZurueck: 0, nurBernstein: true, bernstein: 20 }] });
  if (!f.fehlt) pruef('Ohne Klar-Wert keine Freigabe', f.freigabe.status === 'ohneMessung' && !schneideBefehl.test(f.satz + f.titel), JSON.stringify(f.freigabe));

  console.log('\nG - Coco: Gießpunkt „Mittel", Profi-Modus ohne Einsteiger-Satz');
  const g = lauf({ medium: 'coco', einsteiger: false, trich: [{ tageZurueck: 0, klar: 40, milchig: 58, bernstein: 2 }] });
  if (!g.fehlt) {
    pruef('Coco-Karte nennt den Coco-Gießpunkt', /Hebe-Test „Mittel" zeigt/.test(g.schritte), g.schritte);
    pruef('Profi-Startseite ohne Schnitt-Befehl, mit Knopf zur Messung', !/Schneide die Pflanze ab/.test(g.dash) && /Trichome eintragen/.test(g.dash));
  }

  console.log('\nH - Quelltext');
  {
    const q = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8').split('\n').filter(z => !/^\s*(\/\/|\*|\/\*)/.test(z)).join('\n');
    pruef('Kein bedingungsloser Schnitt-Satz mehr', !/Heute ist Erntetag! Schneide die Pflanze ab/.test(q));
    pruef('Kein Tipp „Ernten! Dunkel stellen, schneiden."', !/Ernten! Dunkel stellen, schneiden/.test(q));
    pruef('Kein „Ernte naht!" ohne Freigabe', !/text: 'Ernte naht!'/.test(q));
  }

  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
