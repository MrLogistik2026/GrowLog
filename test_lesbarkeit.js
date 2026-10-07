// Lesbarkeit im bisherigen Design (Neubau-Prüfung 07.10.2026: T5 Barrierefreiheit 3,0–3,5).
//
//   A (v1.5.354)  Die zwei Grautöne für Nebentext erreichen 4,5 : 1 auf den Karten — dunkles und helles Thema.
//   B (v1.5.355)  Zoomen mit zwei Fingern ist erlaubt; Felder auf Touch-Geräten haben 16 px (kein Zwangs-Zoom unter iOS).
//   C (v1.5.356)  Die Zyklus-Farbflächen folgen dem Thema — im hellen Thema war die Schrift darauf unsichtbar.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

const lum = (hex) => {
  let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const k = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
};
const kontrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// Blöcke der Theme-Variablen aus dem Stil lesen
const block = (anfang) => { const i = HTML.indexOf(anfang); if (i < 0) return ''; return HTML.slice(i, HTML.indexOf('}', i)); };
const wert = (b, name) => { const m = b.match(new RegExp(name + ':\\s*(#[0-9a-fA-F]{3,6})')); return m ? m[1] : null; };

const fehler = [];
let n = 0;
const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };

// A · Kontraste
const dunkel = block(':root {');
const hell = block(':root[data-theme="light"]');
const auto = block(':root[data-theme="auto"]');
for (const [name, b, gruende] of [['dunkel', dunkel, ['--card', '--card2', '--surface', '--bg']], ['hell', hell, ['--card', '--card2', '--bg']], ['auto-hell', auto, ['--card', '--card2', '--bg']]]) {
  for (const t of ['--text-muted', '--text-hint']) {
    const f = wert(b, t);
    for (const g of gruende) {
      const gw = wert(b, g);
      if (!f || !gw) { pruefe(false, `A ${name}: ${t} oder ${g} nicht gefunden`); continue; }
      const k = kontrast(f, gw);
      pruefe(k >= 4.5, `A ${name}: ${t} ${f} auf ${g} ${gw} hat ${k.toFixed(2)} : 1 (nötig 4,5)`);
    }
  }
}

// B · Zoom erlaubt, 16-px-Felder auf Touch-Geräten
const vp = (HTML.match(/<meta name="viewport" content="([^"]+)"/) || [])[1] || '';
pruefe(!/user-scalable\s*=\s*no/.test(vp) && !/maximum-scale\s*=\s*1(\.0)?\b/.test(vp), `B1 Zoom gesperrt („${vp}")`);
pruefe(/@media \(pointer: coarse\) \{ input, select, textarea \{ font-size: 16px !important; \} \}/.test(HTML), 'B2 16-px-Regel für Felder auf Touch-Geräten fehlt');

// C · Zyklus-Farbflächen je Thema
const colors = HTML.match(/const COLORS = \[([\s\S]*?)\];/);
const dks = colors ? [...colors[1].matchAll(/dk: '([^']+)'/g)].map((m) => m[1]) : [];
pruefe(dks.length === 8, `C0 COLORS nicht gefunden (${dks.length})`);
pruefe(dks.every((d) => /^var\(--dk-g\d\)$/.test(d)), `C1 Farbflächen fest statt je Thema: ${dks.join(', ')}`);
for (let i = 1; i <= 8; i++) {
  const dW = wert(dunkel, `--dk-g${i}`), hW = wert(hell, `--dk-g${i}`), aW = wert(auto, `--dk-g${i}`);
  pruefe(dW && hW && aW, `C2 --dk-g${i} fehlt in einem Thema (dunkel ${dW}, hell ${hW}, auto ${aW})`);
  // Die Schrift auf der Fläche muss lesbar sein
  if (hW) pruefe(kontrast(wert(hell, '--text') || '#1a1a1a', hW) >= 7, `C3 hell: Text auf --dk-g${i} ${hW} zu schwach`);
  if (dW) pruefe(kontrast(wert(dunkel, '--text') || '#e8e8e8', dW) >= 7, `C4 dunkel: Text auf --dk-g${i} ${dW} zu schwach`);
}
// Im dunklen Thema bleibt alles wie bisher
pruefe(wert(dunkel, '--dk-g1') === '#071a0c' && wert(dunkel, '--dk-g8') === '#101a04', 'C5 dunkle Farbflächen haben sich verändert');

if (fehler.length) { console.log(`test_lesbarkeit: ${fehler.length} von ${n} Prüfungen rot`); fehler.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
console.log(`test_lesbarkeit: alle ${n} Prüfungen grün`);
