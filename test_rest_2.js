// (v1.5.513) Spül-/IceFlush-Vorlage trägt die Menge der Karte ein stimmen mit ANBAU.md überein.
// Wächter über den ganzen ausgelieferten Quelltext (ohne Kommentarzeilen) und die Laufzeit-Daten. GS_INDEX=<anderer Build> lässt
// den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const INDEX = process.env.GS_INDEX || path.join(__dirname, 'index.html');
const HTML = fs.readFileSync(INDEX, 'utf8');

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
  const plain = (t) => String(t || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const skript = HTML.split('\n').filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n');
  const lauf = JSON.parse(E('JSON.stringify([LEXIKON, PROBLEMS, SYMPTOMS, FAQ, HOWTO, INFO_TERMS])'));
  const laufText = JSON.stringify(lauf).replace(/\\"/g, '"');
  const waechter = (liste) => {
    const t1 = liste.filter(([, re]) => re.test(skript)).map(([name]) => name);
    pruefe(t1.length === 0, 'Quelltext enthält keine verbotene Form (gefunden: ' + t1.join('; ') + ')');
    const t2 = liste.filter(([, re]) => re.test(laufText)).map(([name]) => name);
    pruefe(t2.length === 0, 'Laufzeit-Daten enthalten keine verbotene Form (gefunden: ' + t2.join('; ') + ')');
  };
  const eintrag = (t) => { const hits = []; for (const k of lauf[0]) for (const i of (k.items || [])) if (i.t === t) hits.push(i); return hits; };
  const txt = (i) => plain([i.brief, i.mechanism, i.practice, i.pitfall].join(' '));
  const ZIEL = E('DRAIN_ZIEL.min + "–" + DRAIN_ZIEL.max');
  const dM = E('KLIMA_ZIEL.mittel.deckel'), dS = E('KLIMA_ZIEL.spaet.deckel');

  waechter([
    ['Spül-Vorlage ×1,5', /waterMl \* 1\.5/],
    ['Spül-Notiz mit festem pH 6.4 und 25 %', /Klares Wasser, pH 6\.4, kein Dünger|~25% Drain auffangen/],
    ['Vorlage ohne Tag: waterSuggestion(c, p) im Spül-/IceFlush-Zweig', /waterSuggestion === 'function'\) \? waterSuggestion\(c, p\) : (200|700)/],
  ]);
  // Verhalten: Vorlage (Nachtragen/Ausfüllen) = Karte an jenem Tag, auch wenn „heute“ ein anderer Tag mit anderer Pflanzenzahl ist
  const mess = E(`(function(){
    const out = [];
    S.cycles = []; S.entries = {}; S.fertPlans = []; S._activePlanId = null; setDebugDate('2026-10-30');
    loadPreset('rainbow_auto'); if (typeof _modalResolve === 'function') _modalResolve(true);
    S._seedlingProtocolShown = true;
    const c = addCyc({ name: 'Amnesia XXL', seedType: 'auto', strain: 'Sensi Amnesia XXL Auto', medium: 'erde' }, { still: true });
    c.fertPlanId = S.fertPlans[0] ? S.fertPlans[0].id : null;
    c.startDate = isoPlus('2026-10-30', -84);
    c.anzuchtDays = 28; c.bloomDays = 77; c.flushDays = 7; c.iceDays = 2; c.harvestDays = 1; c.dryDays = 7;
    c.potSize = 11; c.weightMode = 'lift';
    for (const m of ['erde', 'coco']) for (const aktion of ['spuelen', 'ice']) {
      c.medium = m; c.potSize = 11; c.plants = []; for (let i = 0; i < 3; i++) c.plants.push({ id: 'p' + i, name: 'P' + i });
      let tag = null;
      for (let d = 0; d < 170; d++) { const iso = isoPlus(c.startDate, d); if (getAction(iso, c) === aktion) { tag = iso; break; } }
      if (!tag) { out.push({ m, aktion, fehler: 'kein Tag' }); continue; }
      c.plants[2].harvestedAt = isoPlus(tag, -3);   // am Tag stehen nur noch 2 Pflanzen, heute 3
      const P = phase(tag, c);
      const r = { m, aktion, ph: P.ph, tag };
      r.sug = Math.round(waterSuggestion(c, P, tag) || 0);
      setDebugDate(isoPlus(tag, -9)); r.tplFrueh = Number(getAutoFillTemplate(c, P, aktion, tag).water);
      setDebugDate(tag); const T = getAutoFillTemplate(c, P, aktion, tag); r.tplTag = Number(T.water); r.note = T.notePlaceholder; r.phz = T.ph;
      setDebugDate(isoPlus(tag, 6)); r.tplSpaet = Number(getAutoFillTemplate(c, P, aktion, tag).water);
      setDebugDate('2026-10-30');
      out.push(r);
    }
    return out;
  })()`);
  for (const r of mess) {
    const k = r.m + '/' + r.aktion;
    pruefe(!r.fehler, 'Tag gefunden (' + k + ')');
    if (r.fehler) continue;
    pruefe(r.sug > 0, 'Karte nennt eine Menge (' + k + ': ' + r.sug + ')');
    pruefe(r.tplFrueh === r.sug && r.tplTag === r.sug && r.tplSpaet === r.sug, 'Vorlage = Karte an jenem Tag, unabhängig vom heutigen Datum (' + k + ': Karte ' + r.sug + ', Vorlage ' + r.tplFrueh + '/' + r.tplTag + '/' + r.tplSpaet + ')');
    if (r.aktion === 'spuelen') pruefe(r.note.includes('pH ' + r.phz + ',') && r.note.includes(ZIEL + ' % unten ablaufen') && !/25 ?%/.test(r.note) && !/EC-fett/.test(r.note), 'Spül-Notiz: pH ' + r.phz + ' und ' + ZIEL + ' % aus den Quellen (' + k + ')');
  }

  pruefe(errors.length === 0, 'Keine jsdom-Fehler (' + errors.slice(0, 2).join(' | ') + ')');
  console.log(n - fehler.length + ' von ' + n + ' Prüfungen grün');
  if (fehler.length) { fehler.forEach((f) => console.log('  FEHLT: ' + f)); process.exit(1); }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
