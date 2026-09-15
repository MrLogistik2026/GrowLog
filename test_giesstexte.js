/**
 * (v1.5.208) Die restlichen Texte der Gießmenge (Gießmengen-Prüfung, Runde 3, Schritt 11).
 *
 * Seit v1.5.205 kommt die Gießmenge aus dem Topf: höchstens V passt hinein, der Rest wird Drain. Mehrere Texte sprachen noch
 * die alte Sprache: „Ideal ~min–max" im Gieß-Fahrplan, „Bei 11L Topf = ca. 3,0–3,5 Liter" im Tipps-Leitfaden für jeden Topf,
 * eine Topfgröße ohne Hinweis auf die tatsächliche Füllung (ANBAU.md 7.4), 25–30 % Durchfluss mit drei Einordnungen
 * (ANBAU.md 5.1), kein Hinweis, dass Stofftöpfe seitlich ablaufen (Regel 2), ein Einsteiger-Satz ohne Drain-Spanne und eine
 * Warnung „Zu viel Wasser = Wurzelfäule" im Verhältnis zur Empfehlung — Staunässe kommt aber vom zu häufigen Gießen
 * (ANBAU.md 1, 13.1), deshalb jetzt „Topf war noch feucht".
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
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = function () { const c = fakeCtx(); c.canvas = this; return c; };
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:,';
      w.navigator.vibrate = () => true; w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
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

(async () => {
  console.log('TZ=' + (process.env.TZ || '(System)'));
  const { E, errors } = await load();
  pruef('Start ohne JS-Fehler', errors.length === 0, errors[0]);

  let r = null;
  try {
    r = JSON.parse(E(`(function(){ const c = S.cycles[0]; const aus = {}; const text = (id) => document.getElementById(id).textContent.replace(/\\s+/g, ' ');
      setDebugDate(isoPlus(c.startDate, 59));
      // Durchfluss
      const fl = (ml) => { const cd = { water: '1000', drainMl: String(ml) }; const f = drainFlow(cd); return { kurz: f.kurz, gueltig: f.gueltig, zeile: _runoffFlowLine({ flow: f }, cd).replace(/<[^>]+>/g, '') }; };
      aus.d22 = fl(220); aus.d27 = fl(270); aus.d35 = fl(350);
      aus.ohneMenge = _runoffFlowLine({ flow: null }, { water: '3000' }).replace(/<[^>]+>/g, '');
      // Gieß-Fahrplan im Profi-Modus
      S.beginnerMode = false; goTo('gussplan'); renderGussplan();
      const gp = text('scr-gussplan');
      const tagV = anzuchtLenFor(c) + 25;
      aus.startVoll = Math.round(startkurve(c, tagV, isoPlus(c.startDate, tagV - 1), 'bloom') / 50) * 50;
      aus.spuel = Math.round(_waterSuggestionRaw(c, { ph: 'flush' }) / 50) * 50;
      aus.gp = { ideal: /Ideal ~/.test(gp), startwerte: gp.match(/Startwert ~\\d+/g) || [], spuel: gp.match(/Spülmenge ~\\d+/g) || [] };
      // Einstellungen, Gruppe Topfgröße
      S._setUI = S._setUI || {}; S._setUI.cyc_basics = true; S._setUI.b_pot = true; selId = c.id; draft = {};
      goTo('set'); renderSet();
      const st = text('scr-set');
      aus.V = Math.round(nachfuellGrenze(c, todayISO(), null) / 50) * 50;
      aus.set = { grenze: st.includes('höchstens ~' + aus.V + ' ml je Guss'), gefuellt: st.includes('Aufgehäuft hält ein 11-L-Stofftopf 14–16 L'), zeile: (st.match(/In diesen Topf passen.{0,120}/) || [''])[0] };
      // Tipps-Leitfaden
      goTo('tips'); renderTips();
      const tp = text('scr-tips');
      const c0 = active().find(x => x.medium !== 'hydro');
      aus.V0 = c0 ? Math.round(nachfuellGrenze(c0, todayISO(), null) / 50) * 50 : null;
      aus.tips = { alt: /3,0–3,5 Liter|11L Stofftöpfe/.test(tp), neu: tp.includes('höchstens ~' + aus.V0 + ' ml'), zeile: (tp.match(/Langsam gießen, bis.{0,140}/) || [''])[0] };
      // Einsteiger-Satz an einem Blüte-Gießtag
      const satz = plainSentence('giess', c, phase(todayISO(), c), 7500);
      aus.satz = satz; aus.fett = satz.match(/<b>[^<]*\\d+ ml<\\/b>/g) || []; aus.spanne = satz.includes(DRAIN_ZIEL.min + '–' + DRAIN_ZIEL.max + ' %');
      // Warnungen zur Wassermenge (Blütetag 60, gespeicherter Eintrag im Speicher)
      const tagB = isoPlus(c.startDate, 59), pB = phase(tagB, c);
      const warn = (cdx) => { S.entries[tagB] = S.entries[tagB] || { cycleData: {} }; S.entries[tagB].cycleData = S.entries[tagB].cycleData || {};
        S.entries[tagB].cycleData[c.id] = cdx; return getEntryWarnings(cdx, pB, {}, c, tagB).map(x => x.type + ': ' + x.text); };
      const Vb = Math.round(nachfuellGrenze(c, tagB, null) / 50) * 50;
      aus.w75 = warn({ water: '3000', restPct: '75', plantsAtWatering: '1' });
      aus.w30 = warn({ water: '3000', restPct: '30', plantsAtWatering: '1' });
      aus.wViel = warn({ water: String(Math.round(Vb * 1.3)), plantsAtWatering: '1' });
      const tagS = isoPlus(c.startDate, 14), pS = phase(tagS, c);
      const sugS = waterSuggestion(c, pS, tagS);
      aus.wSaemling = getEntryWarnings({ water: String(sugS * 3) }, pS, {}, c, tagS).map(x => x.type + ': ' + x.text);
      return JSON.stringify(aus); })()`));
  } catch (e) { pruef('Prüflauf ohne Ausnahme', false, String(e && e.message || e).slice(0, 200)); }

  if (r) {
    pruef('Durchfluss 22 %: „aussagekräftig"', r.d22.kurz === 'aussagekräftig' && /aussagekräftig/.test(r.d22.zeile), JSON.stringify(r.d22));
    pruef('Durchfluss 27 %: „viel, noch gültig" und gültig (ANBAU.md 5.1)', r.d27.kurz === 'viel, noch gültig' && r.d27.gueltig === true && /viel, noch gültig/.test(r.d27.zeile), JSON.stringify(r.d27));
    pruef('Durchfluss 35 %: unverändert „viel — spült schon mit"', /viel — spült schon mit/.test(r.d35.zeile), JSON.stringify(r.d35));
    pruef('Ohne Ablaufmenge: in einer breiten Wanne auffangen', /Stofftopf oder Air-Pot: in einer breiten Wanne auffangen/.test(r.ohneMenge), r.ohneMenge);
    pruef('Gieß-Fahrplan: kein „Ideal ~", drei Startwerte, Vollblüte = Startkurve in Blütewoche 4', !r.gp.ideal && r.gp.startwerte.length === 3 && r.gp.startwerte.includes('Startwert ~' + r.startVoll), JSON.stringify(r.gp) + ' soll ' + r.startVoll);
    pruef('Gieß-Fahrplan: Spülen mit „Spülmenge"', r.gp.spuel.length === 1 && r.gp.spuel[0] === 'Spülmenge ~' + r.spuel, JSON.stringify(r.gp.spuel) + ' soll ' + r.spuel);
    pruef('Einstellungen: „höchstens ~V ml je Guss" mit V aus dem Topf', r.set.grenze, r.set.zeile + ' soll ' + r.V);
    pruef('Einstellungen: das gefüllte Volumen zählt (aufgehäuft 14–16 L)', r.set.gefuellt);
    pruef('Tipps-Leitfaden: ohne „11L Stofftöpfe"/„3,0–3,5 Liter", mit V des Zyklus', !r.tips.alt && r.tips.neu, r.tips.zeile + ' soll ' + r.V0);
    pruef('Einsteiger-Satz: eine Menge je Pflanze und die Drain-Spanne', r.fett.length === 1 && r.spanne, r.satz);
    pruef('Hebe-Test 75 % plus Guss: „Topf war noch feucht"', r.w75.some(x => /^warn: .*Topf war noch feucht \(Hebe-Test ~75 %\)/.test(x)), r.w75.join(' | '));
    pruef('Hebe-Test 30 % plus Guss: kein Hinweis', !r.w30.some(x => /noch feucht|Mehr, als/.test(x)), r.w30.join(' | '));
    pruef('1,3 × V je Pflanze: „Mehr, als in den Topf passt", keine „Wurzelfäule"', r.wViel.some(x => /^info: .*Mehr, als in den Topf passt/.test(x)) && !r.wViel.some(x => /Wurzelfäule/.test(x)), r.wViel.join(' | '));
    pruef('Sämling (Tag 15): die bisherige Warnung bleibt', r.wSaemling.some(x => /Sehr viel Wasser/.test(x)), r.wSaemling.join(' | '));
  }
  pruef('Keine JS-Fehler im Lauf', errors.length === 0, errors.slice(0, 2).join(' | '));
  console.log(`\nErgebnis: ${ok} OK, ${fail} Fehler`);
  process.exit(fail ? 1 : 0);
})();
