// (v1.5.498) Lesbarkeit (Größen) und Tippflächen — ergänzt test_lesbarkeit.js (Farben, Zoom): kein Text unter 11 px (außer Kalenderzellen), Erklärtexte ab 12 px, Tippflächen der
// häufigen Knöpfe mindestens 44 px hoch.
//
// Befund (Messung 30.10.2026, v1.5.493): Auf Startseite, Eintrag, Einstellungen standen 55–90 % des Textes auf 10–11 px, auf dem
// Eintrag bis 6 % auf 7–9 px; Hebe-Knöpfe 28 px hoch, Sprung-Chips, ‹ ›, ✕, Plan ✏ unter 44 px (UEBERGABE 0o, Hebel 9, T5 3,6).
// jsdom rechnet kein Layout: geprüft werden die wirksamen Regeln (Stilblatt-Regeln mit !important über den Inline-Stil), nicht Pixel.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

async function lauf() {
  const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');
  const dom = new JSDOM(HTML, { url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: new VirtualConsole(),
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => null; w.navigator.vibrate = () => true; w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {}; w.alert = () => {}; w.print = () => {}; } });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 100));
  const E = (s) => w.eval(s);
  const fehler = []; let n = 0;
  const pruefe = (ok, t) => { n++; if (!ok) fehler.push(t); };
  const regeln = [];
  for (const sh of w.document.styleSheets) for (const r of sh.cssRules) {
    if (!r.style) continue;
    for (const p of ['font-size', 'min-height']) if (r.style.getPropertyPriority(p) === 'important') regeln.push([r.selectorText, p, parseFloat(r.style.getPropertyValue(p))]);
  }
  const eff = (el, p, basis) => {
    let v = basis;
    for (const [sel, pp, val] of regeln) {
      if (pp !== p) continue;
      let ok = false; try { ok = el.matches(sel); } catch (e) { ok = false; }
      if (ok) v = p === 'font-size' ? val : Math.max(v, val);
    }
    return v;
  };
  const schrift = (wurzelEl) => {
    let gesamt = 0, klein = 0, mittel = 0;
    const walker = w.document.createTreeWalker(wurzelEl, 4); let nd;
    while ((nd = walker.nextNode())) {
      const t = nd.nodeValue.replace(/\s+/g, ' ').trim(); const el = nd.parentElement;
      if (!t || !el || /^(SCRIPT|STYLE)$/.test(el.tagName)) continue;
      if (el.closest('.cal-grid')) continue;
      let hid = false;
      for (let p = el; p && p !== wurzelEl; p = p.parentElement) {
        if ((p.tagName === 'DETAILS' && !p.open && el.tagName !== 'SUMMARY') || w.getComputedStyle(p).display === 'none') { hid = true; break; }
      }
      if (hid) continue;
      const f = eff(el, 'font-size', parseFloat(w.getComputedStyle(el).fontSize) || 16);
      gesamt += t.length; if (f < 11) klein += t.length; if (f < 12) mittel += t.length;
    }
    return { gesamt, klein, mittel };
  };
  const hoch = (el) => eff(el, 'min-height', 0) >= 44;

  for (const modus of ['einsteiger', 'profi']) {
    E(`(function(){ S.cycles=[]; S.entries={}; S._seedlingProtocolShown=true; S.beginnerMode=${modus === 'einsteiger'};
      for (let t=30;t<=60;t++){ S.cycles=[]; const c=addCyc({name:'Test',startDate:isoPlus(todayISO(),-(t-1)),seedType:'auto',growType:'indoor',medium:'erde',potSize:11,plantCount:1,startMethod:'saturated'},{still:true}); c.weightMode='lift'; S.cycles=[c];
        const a=getAction(todayISO(),c); if(a==='giess'||a==='giess_anz') break; } })()`);
    for (const [id, fn] of [['scr-dash', "goTo('dash')"], ['scr-entry', 'openEntry(todayISO())'], ['scr-set', "goTo('set')"], ['scr-tips', "goTo('tips')"], ['scr-cal', "goTo('cal')"]]) {
      E(fn); await new Promise((r) => setTimeout(r, 30));
      const s = schrift(w.document.getElementById(id));
      pruefe(s.gesamt > 100, `${modus} ${id}: Text gefunden (${s.gesamt})`);
      pruefe(s.klein === 0, `${modus} ${id}: kein Text unter 11 px (${s.klein} von ${s.gesamt} Zeichen)`);
      if (id === 'scr-dash' || id === 'scr-entry' || id === 'scr-set') pruefe(s.mittel / s.gesamt < 0.45, `${modus} ${id}: höchstens 45 % des Textes unter 12 px (${Math.round(100 * s.mittel / s.gesamt)} %)`);
      if (id === 'scr-dash') {
        const k = [...w.document.querySelectorAll('#scr-dash button')].filter((b) => /dashHebeTest\(/.test(b.getAttribute('onclick') || ''));
        pruefe(k.length === 5 && k.every(hoch), `${modus}: fünf Hebe-Knöpfe der Startseite mindestens 44 px hoch`);
      }
      if (id === 'scr-entry') {
        const chips = [...w.document.querySelectorAll('#scr-entry button')].filter((b) => /jumpToEntryField\(/.test(b.getAttribute('onclick') || ''));
        pruefe(chips.length > 0 && chips.every(hoch), `${modus}: Sprung-Chips mindestens 44 px hoch (${chips.length})`);
        const nav = [...w.document.querySelectorAll('#scr-entry button[onclick^="entryNav("]')];
        pruefe(nav.length === 2 && nav.every(hoch), `${modus}: Tagwechsel ‹ › mindestens 44 px hoch`);
        pruefe(eff(w.document.getElementById('entry-back'), 'min-height', 0) >= 44, `${modus}: Zurück-Pfeil mindestens 44 px hoch`);
      }
      if (id === 'scr-cal') pruefe([...w.document.querySelectorAll('#scr-cal button[onclick^="changeMonth("]')].every(hoch), `${modus}: Monatswechsel mindestens 44 px hoch`);
    }
  }
  E('openDiagnostics()'); await new Promise((r) => setTimeout(r, 30));
  const cl = [...w.document.querySelectorAll('button')].filter((b) => /closeDiagnostics/.test(b.getAttribute('onclick') || ''));
  pruefe(cl.length > 0 && cl.every(hoch), 'Diagnose: ✕ mindestens 44 px hoch');
  const css = [...w.document.querySelectorAll('style')].map((x) => x.textContent).join('\n');
  pruefe(!/font-size:\s*10px/.test(css.split('LESBARKEIT UND TIPPFLÄCHEN')[0]), 'Stilblatt: keine Klasse mit 10 px');
  pruefe(/\.nav-label \{ font-size: 11px/.test(css), 'Navigationsleiste: Beschriftung 11 px');
  pruefe(/\.cal-tag \{ font-size: 9px/.test(css) && /\.cal-tag2 \{[^}]*font-size: 9px/.test(css), 'Kalender: Tag-Nummern 9 px statt 7–7,5 px');
  // (v1.5.498) Keine unsichtbar vergrößerte ⓘ-Fläche: Sie ragte über benachbarte Knöpfe (Hebe-Test) und hätte deren Tipps abgefangen.
  pruefe(!/button\[aria-label="Info"\]::after/.test(css), 'ⓘ: keine Trefferfläche, die über Nachbarknöpfe ragt');
  console.log(`${n - fehler.length}/${n} Prüfungen`); fehler.forEach((f) => console.log('FEHLT: ' + f));
  return fehler.length;
}
if (process.env.GS_KIND) { lauf().then((f) => process.exit(f ? 1 : 0)); }
else {
  let rot = 0;
  for (const tz of ['Europe/Berlin', 'Pacific/Kiritimati']) {
    const r = spawnSync(process.execPath, [__filename], { env: { ...process.env, TZ: tz, GS_KIND: '1' }, encoding: 'utf8' });
    console.log('[' + tz + '] ' + (r.stdout || '').trim() + (r.stderr ? '\n' + r.stderr.slice(0, 300) : '')); if (r.status) rot++;
  }
  process.exit(rot ? 1 : 0);
}
