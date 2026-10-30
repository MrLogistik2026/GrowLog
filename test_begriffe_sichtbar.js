// (v1.5.483) Bedien-Prüfung „Hilfe finden“ 29.10.2026, Punkt 5: In sichtbaren Texten standen noch „Grow“, „Dryback“ und „Runoff“
// (Bewertung 17.09.2026, Hebel 10). Nomenklatur der ANWEISUNG.md: „Restgewicht“ (nie „Dryback“), „Zyklus“ (nie „Run/Grow“); „Drain“ ist der App-Begriff.
// Der Test rendert die Hauptbildschirme (Startseite, Kalender, Tipps, Einstellungen, Einträge, Gieß-Fahrplan, Düngeplan, Lexikon mit allen Einträgen,
// Anleitung, Galerie, Hilfe, Schnellhilfe-Karten, Erster-Anbau-Anleitung, FAQ, Info-Fenster, Diagnose-Assistent, Befehle) und prüft, dass im sichtbaren Text
// weder „Grow“ noch „Dryback“ noch „Runoff“ vorkommt. Ausnahmen: Produktnamen (Bio·Grow, Terra Grow, FloraGrow, HomeGrow24, GrowSmart, Grow-Shop),
// „Grower“ (die Person) und der eine erklärende Satz im Lexikon-Eintrag Restgewicht („in Foren oft „Dryback“ genannt“).
// Zweitens: Im Quelltext (ohne Kommentare) steht keins der drei Wörter mehr als Anzeigetext. Drittens: Die alten Wörter finden weiter (Lexikon-Suche, Hilfesuche).
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const INDEX = process.env.GS_INDEX || path.join(__dirname, 'index.html');
const HTML = fs.readFileSync(INDEX, 'utf8');
const BACKUP = fs.readFileSync(path.join(process.env.GS_PROJEKT || __dirname, 'growsmart-sicherung-2026-09-04.txt'), 'utf8');

const AUSNAHME = /Bio[·. -]?Grow|Terra[ -]?Grow|GrowSmart|Grow[ -]?Shop|Growshop|FloraGrow|HomeGrow24|Micro[ /+-]+Grow[ /+-]+Bloom|Grower|Growing/gi;
const ERKLAERSATZ = /in Foren oft „Dryback["“] genannt/g;

function funde(text) {
  const t = text.replace(AUSNAHME, (m) => '\u0002'.repeat(m.length)).replace(ERKLAERSATZ, (m) => '\u0002'.repeat(m.length));
  const out = []; const re = /Grow|Dryback|Runoff/gi; let m;
  while ((m = re.exec(t))) out.push(text.slice(Math.max(0, m.index - 35), m.index + 40).replace(/\s+/g, ' '));
  return out;
}

async function lade(mitSicherung) {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => null; w.navigator.vibrate = () => true; w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {}; w.alert = () => {}; w.print = () => {};
      if (mitSicherung) w.localStorage.setItem('growsmart_v4', BACKUP);
    },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  w.toast = () => {};
  return { w, E: (s) => w.eval(s), errors };
}

// Sichtbarer Text: root = Selektor eines Bildschirms; ohne root alles außer #app (Overlays, Sheets, Dialoge). Ohne script/style, plus placeholder/title/aria-label.
const sichtbarJs = (root) => `(function(){
  const roots = ${JSON.stringify(root || null)} ? [document.querySelector(${JSON.stringify(root || '')})] : Array.from(document.body.children).filter(x => x.id !== 'app');
  let t = '';
  roots.forEach(r => { if (!r || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(r.tagName)) return; t += ' ' + r.textContent;
    r.querySelectorAll('[placeholder],[title],[aria-label]').forEach(x => { ['placeholder','title','aria-label'].forEach(a => { const v = x.getAttribute(a); if (v) t += ' ' + v; }); }); });
  return t;
})()`;

// Quelltext ohne Kommentare: [Länge des Code-Teils] je Zeile (0 = ganze Zeile Kommentar)
function einteilen(ls) {
  let blk = false;
  return ls.map((l) => {
    const t = l.trim();
    if (blk) { if (t.includes('*/')) blk = false; return 0; }
    if (t.startsWith('/*')) { if (!t.includes('*/')) blk = true; return 0; }
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('<!--')) return 0;
    const bi = l.lastIndexOf('/*');
    if (bi > 0 && l.indexOf('*/', bi) === -1) { blk = true; return bi; }
    const re = /\s\/\/\s/g; let m;
    while ((m = re.exec(l))) {
      const vor = l.slice(0, m.index);
      if (/https?:$/.test(vor)) continue;
      const q = (c) => (vor.match(new RegExp('(?<!\\\\)' + c, 'g')) || []).length;
      if (q("'") % 2 === 0 && q('"') % 2 === 0 && q('`') % 2 === 0) return m.index;
    }
    return l.length;
  });
}

(async () => {
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const gesehen = new Set();
  const melde = (label, text) => funde(text).forEach((f) => { const k = f; if (gesehen.has(k)) return; gesehen.add(k); fehler.push(label + ': …' + f + '…'); });
  let erklaerStellen = 0;

  // ---- 1. Quelltext: kein Anzeigetext mit den drei Wörtern (Kommentare, Bezeichner, Produktnamen ausgenommen) ----
  const skripte = HTML.split('<script').map((s) => s.slice(s.indexOf('>') + 1));
  const groesstes = skripte.sort((a, b) => b.length - a.length)[0];
  const zl = groesstes.split('\n'); const tl = einteilen(zl);
  zl.forEach((l, i) => {
    if (!tl[i]) return;
    const code = l.slice(0, tl[i]).replace(AUSNAHME, (m) => '#'.repeat(m.length)).replace(ERKLAERSATZ, (m) => '#'.repeat(m.length));
    const re = /(?<![A-Za-z])(Grow|Dryback|Runoff)|(?<![A-Za-z])Hard[ -]Dryback|-Dryback|Untergrowth/g; let m;
    while ((m = re.exec(code))) { n++; fehler.push('Quelltext Zeile ' + (i + 1) + ': …' + l.slice(Math.max(0, m.index - 30), m.index + 40).trim() + '…'); }
  });
  pruefe(true, '');

  // ---- 2. Bildschirme rendern: zwei Datenlagen (Patricks Sicherung; frisch angelegter Beispiel-Zyklus) ----
  for (const [mitSicherung, welt] of [[true, 'Sicherung'], [false, 'Beispiel']]) {
    const { w, E, errors } = await lade(mitSicherung);
    const sicher = (label, fn, root) => {
      try { fn(); const t = E(sichtbarJs(root)); melde(welt + '/' + label, t); if (label === 'Lexikon') erklaerStellen += (t.match(ERKLAERSATZ) || []).length; n++; }
      catch (e) { n++; fehler.push(welt + '/' + label + ' Absturz: ' + e.message); }
    };
    const aufraeumen = () => {
      ['[data-symptom]', '[data-faq]', '[data-firstgrow]', '#diag-wizard'].forEach((s) => w.document.querySelectorAll(s).forEach((x) => x.remove()));
      Array.from(w.document.body.children).forEach((x) => { if (x.style && x.style.position === 'fixed' && !x.id) x.remove(); });
    };
    if (mitSicherung) {
      E(`setDebugDate('2026-08-22');`);
    } else {
      E(`S.cycles = []; S.entries = {}; S.fertPlans = []; S._activePlanId = null; setDebugDate('2026-08-22'); loadPreset('rainbow_auto');`);
      await new Promise((r) => setTimeout(r, 20)); E(`_modalResolve && _modalResolve(true);`); await new Promise((r) => setTimeout(r, 40));
      E(`S._seedlingProtocolShown = true; const _p = S.fertPlans[0]; const _c = addCyc({ name:'Amnesia XXL', seedType:'auto', strain:'Sensi Amnesia XXL Auto', medium:'erde' }); _c.fertPlanId = _p ? _p.id : null; _c.startDate = isoPlus(todayISO(), -84); _c.anzuchtDays = 28; _c.bloomDays = 77; _c.flushDays = 7; _c.iceDays = 2; _c.harvestDays = 1; _c.dryDays = 7; _c.plants = 5; _c.potSize = 11; _c.weightMode = 'lift'; saveS();`);
    }
    for (const [mn, bm] of [['Einsteiger', true], ['Profi', false]]) {
      E(`S.beginnerMode = ${bm}; saveS();`);
      const L = (s) => `${mn}/${s}`;
      for (const [t, nm] of [['dash', 'Startseite'], ['cal', 'Kalender'], ['tips', 'Tipps'], ['set', 'Einstellungen'], ['gussplan', 'Gieß-Fahrplan'], ['duenger', 'Düngeplan'], ['howto', 'Anleitung'], ['gallery', 'Galerie']]) {
        sicher(L(nm), () => { E(`goTo('${t}')`); }, '#scr-' + t);
      }
      if (mitSicherung && bm) sicher('Lexikon', () => { E(`goTo('lexikon')`); }, '#scr-lexikon'); // alle Einträge stehen im DOM (zugeklappt, aber vorhanden)
      const c0 = E(`(active()[0] || S.cycles[0]) ? (active()[0] || S.cycles[0]).startDate : null`);
      if (c0) for (const d of [0, 6, 20, 40, 70, 95, 105, 112]) sicher(L('Eintrag Tag ' + (d + 1)), () => { E(`openEntry(isoPlus(${JSON.stringify(c0)}, ${d}))`); }, '#scr-entry');
      sicher(L('Hilfe'), () => { E(`openHelp()`); });
      for (const q of ['dryback', 'runoff', 'grow', 'tag', 'restgewicht', 'drain', 'zyklus', 'abtrocknen', 'spül']) sicher(L('Hilfesuche ' + q), () => { E(`helpQuery(${JSON.stringify(q)})`); });
      E(`closeHelp && closeHelp()`); aufraeumen();
      sicher(L('Pflanzen-Check'), () => { E(`openSymptomChecker()`); });
      const nSym = E(`SYMPTOMS.length`);
      for (let i = 0; i < nSym; i++) sicher(L('Schnellhilfe-Karte ' + E(`SYMPTOMS[${i}].id`)), () => { E(`showSymptomDetail(SYMPTOMS[${i}].id)`); });
      aufraeumen();
      sicher(L('Erster Anbau Liste'), () => { E(`openFirstGrowGuide()`); });
      const nFG = E(`FIRST_GROW_STEPS.length`);
      for (let i = 0; i < nFG; i++) sicher(L('Erster Anbau Schritt ' + (i + 1)), () => { E(`showFirstGrowStep(${i})`); });
      aufraeumen();
      const nFaq = E(`FAQ.length`);
      for (let i = 0; i < nFaq; i++) sicher(L('FAQ ' + (i + 1)), () => { E(`showFAQAnswer(${i})`); });
      aufraeumen();
      for (const k of JSON.parse(E(`JSON.stringify(Object.keys(INFO_TERMS))`))) sicher(L('Info ' + k), () => { E(`showInfoPopover(${JSON.stringify(k)})`); aufraeumen(); });
      sicher(L('Diagnose-Assistent'), () => { E(`openDiagnostics(null)`); });
      for (let s = 1; s <= 4; s++) sicher(L('Diagnose Schritt ' + s), () => { E(`diagState.step = ${s}; if (${s} >= 2 && !diagState.location.length) diagState.location = ['allLeaves']; if (${s} >= 3 && !diagState.shapes.length) diagState.shapes = ['crispy']; renderDiagWizard()`); });
      aufraeumen();
      sicher(L('Befehle'), () => { }, null);
      melde(welt + '/' + L('Befehle'), E(`COMMANDS.map(c => c.t + ' ' + (c.hint || '')).join(' | ')`));
      E(`goTo('dash')`); aufraeumen();
    }

    // ---- 3. Die alten Wörter finden weiter ----
    if (mitSicherung) {
      const titel = (q) => { E(`goTo('lexikon'); renderLexikon(null, ${JSON.stringify(q)})`); return JSON.parse(E(`JSON.stringify(Array.from(document.querySelectorAll('#scr-lexikon [onclick^="toggleLexEntry"]')).map(x => x.textContent.trim().slice(0, 90)))`)); };
      const trifft = (q, teil) => titel(q).some((t) => t.includes(teil));
      pruefe(trifft('dryback', 'Restgewicht (Trocken-Nass-Zyklus)'), 'Lexikon-Suche „dryback“ findet den Eintrag Restgewicht nicht mehr');
      pruefe(trifft('runoff', 'Drain-EC (Ablauf-Messung)'), 'Lexikon-Suche „runoff“ findet den Eintrag Drain-EC nicht mehr');
      pruefe(trifft('hard dryback', 'Abtrocknen vor dem IceFlush'), 'Lexikon-Suche „hard dryback“ findet den Eintrag Abtrocknen nicht mehr');
      pruefe(trifft('hard-dryback', 'Abtrocknen vor dem IceFlush'), 'Lexikon-Suche „hard-dryback“ findet den Eintrag Abtrocknen nicht mehr');
      pruefe(trifft('restgewicht', 'Restgewicht (Trocken-Nass-Zyklus)'), 'Lexikon-Suche „restgewicht“ findet den Eintrag nicht');
      for (const q of ['dryback', 'runoff']) pruefe(E(`helpSearch(${JSON.stringify(q)}).length`) > 0, 'Hilfesuche „' + q + '“ findet nichts mehr');
      // Jedes Lexikon-Ziel (Alias, Info-Fenster, Karten) muss einen vorhandenen Eintrag treffen
      const titelAlle = new Set(JSON.parse(E(`JSON.stringify(lexAll().flatMap(c => c.items.map(i => i.t)))`)));
      // Nur die Alias-Einträge, die diese Bereinigung berührt (ein älterer Alias „super cropping“ zeigt schon vorher auf einen fehlenden Titel Supercropping).
      const kaputt = JSON.parse(E(`JSON.stringify(['dryback','hard dryback','hard-dryback','restgewicht','trocken-nass','runoff','grow-tent','grow-room'].filter(a => !LEX_ALIASES[a] || ![...new Set(lexAll().flatMap(c => c.items.map(i => i.t)))].includes(LEX_ALIASES[a])))`));
      const infoKaputt = JSON.parse(E(`JSON.stringify(Object.entries(INFO_TERMS).filter(([k, v]) => v.lex && ![...new Set(lexAll().flatMap(c => c.items.map(i => i.t)))].includes(v.lex)).map(x => x[0] + ' → ' + x[1].lex))`));
      pruefe(infoKaputt.length === 0, 'Info-Fenster verweist auf einen Lexikon-Titel, den es nicht gibt: ' + infoKaputt.slice(0, 3).join(' | '));
      pruefe(titelAlle.size > 100, 'Lexikon unerwartet klein');
    }
    if (errors.length) fehler.push(welt + ' Konsolenfehler: ' + errors.slice(0, 3).join(' | '));
    w.close();
  }
  pruefe(erklaerStellen === 1, 'Der erklärende Satz zu „Dryback“ muss genau einmal im Lexikon stehen (gefunden: ' + erklaerStellen + ')');

  console.log(fehler.length ? 'FEHL (' + fehler.length + '/' + n + ')\n' + fehler.slice(0, 40).join('\n') + (fehler.length > 40 ? '\n… und ' + (fehler.length - 40) + ' weitere' : '') : 'OK (' + n + ' Prüfungen)');
  process.exit(fehler.length ? 1 : 0);
})();
