// (v1.5.484) Tageseintrag bei zwei Gruppen: je Gruppe eine Fortschrittszeile mit eigenem Zähler und eigenen Sprung-Chips.
//
// Befund (Gießtag-Prüfung 29.10.2026, Punkt 6): Zwei Zyklen am selben Tag — oben stand EINE Zeile „0/6 eingetragen“,
// die Wasser und pH beider Gruppen verrechnete; Sprung-Chips gab es nur für die erste Gruppe, und ob beide fertig sind,
// stand nirgends. Eine einzelne Gruppe darf sich nicht ändern (Gegenprobe unten).
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const HTML = fs.readFileSync(process.env.GS_INDEX || path.join(__dirname, 'index.html'), 'utf8');

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
  const body = () => w.document.getElementById('entry-body');

  // Lage: n Zyklen (Erde, Auto), alle starten am selben Tag; gesucht wird ein Tag, an dem alle heute Gießtag haben.
  const lage = (anzahl) => E(`(function(){ S.entries = {}; S._seedlingProtocolShown = true; S.beginnerMode = false;
    for (let t = 30; t <= 60; t++) {
      S.cycles = [];
      for (let i = 0; i < ${anzahl}; i++) {
        const c = addCyc({ name: 'Gruppe ' + (i + 1), startDate: isoPlus(todayISO(), -(t - 1)), seedType: 'auto', growType: 'indoor', medium: 'erde',
          potSize: 11, plantCount: 1, startMethod: 'saturated' }, { still: true });
        c.weightMode = 'lift';
      }
      if (S.cycles.every(c => { try { return gussFaellig(c, todayISO()); } catch (e) { return false; } })) { openEntry(todayISO()); return S.cycles.map(c => c.id); }
    }
    return null; })()`);

  // ---------- zwei Gruppen ----------
  const ids = lage(2);
  pruefe(!!ids && ids.length === 2, 'Prüflage: zwei Gruppen mit Gießtag heute');
  const kopf = () => body().querySelector('[data-gruppen-fortschritt]');
  pruefe(!!kopf(), 'Zwei Gruppen: Fortschritt je Gruppe (eigener Block)');
  const zeilen = () => kopf() ? [...kopf().children].filter(x => x.querySelector("button")) : [];
  pruefe(zeilen().length === 2, 'Zwei Zeilen mit eigenem Zähler (' + zeilen().length + ')');
  pruefe(zeilen().length === 2 && zeilen().every(z => /0\/6\s*eingetragen/.test(z.textContent.replace(/\s+/g, ' '))), 'Beide Zähler stehen auf 0/6');
  pruefe(zeilen().length === 2 && /Gruppe 1/.test(zeilen()[0].textContent) && /Gruppe 2/.test(zeilen()[1].textContent), 'Jede Zeile nennt den Namen ihrer Gruppe');
  pruefe(zeilen().length === 2 && zeilen().every(z => z.querySelectorAll('button').length === 6), 'Jede Zeile hat sechs Sprung-Chips');
  pruefe(!kopf() || !/Alle 2 Gruppen/.test(kopf().textContent), 'Noch nicht „alle fertig“');

  if (zeilen().length === 2) {
    // Chips der zweiten Gruppe springen in ihre Felder
    const chip = (z, label) => [...zeilen()[z].querySelectorAll('button')].find(b => b.textContent.includes(label));
    chip(1, 'Wasser').click();
    const w2 = w.document.getElementById('water-calc-' + ids[1]);
    const w1 = w.document.getElementById('water-calc-' + ids[0]);
    pruefe(!!w2 && /yellow/.test(w2.style.boxShadow), 'Wasser-Chip der Gruppe 2 markiert das Wasser-Feld der Gruppe 2');
    pruefe(!!w1 && !/yellow/.test(w1.style.boxShadow), 'und nicht das der Gruppe 1');
    chip(1, 'pH').click();
    const p2 = w.document.getElementById('ph-' + ids[1]);
    pruefe(!!p2 && /yellow/.test(p2.style.boxShadow), 'pH-Chip der Gruppe 2 springt in pH der Gruppe 2');
    chip(1, 'Notiz').click();
    const n2 = w.document.getElementById('note-' + ids[1]);
    pruefe(!!n2 && /yellow/.test(n2.style.boxShadow), 'Notiz-Chip der Gruppe 2 springt in die Notiz der Gruppe 2');
    chip(1, 'Foto').click();
    const fotos = [...body().querySelectorAll('.photo-add')];
    const f2 = fotos.find(x => (x.getAttribute('onclick') || '').includes(ids[1]));
    const f1 = fotos.find(x => (x.getAttribute('onclick') || '').includes(ids[0]));
    pruefe(!!f2 && /yellow/.test(f2.style.boxShadow) && !(f1 && /yellow/.test(f1.style.boxShadow)), 'Foto-Chip der Gruppe 2 markiert deren Foto-Feld');
    chip(0, 'Wasser').click();
    pruefe(!!w1 && /yellow/.test(w1.style.boxShadow), 'Wasser-Chip der Gruppe 1 markiert das Feld der Gruppe 1');

    // Gruppe 1 vollständig, Gruppe 2 nur Wasser: Zähler getrennt, nicht „alle fertig“
    E(`(function(){ const iso = todayISO(); const ids = ${JSON.stringify(ids)};
      S.entries[iso] = { temp: '24', humidity: '50', cycleData: {} };
      S.entries[iso].cycleData[ids[0]] = { water: '1200', ph: '6.3', notes: 'ok', photos: ['data:image/png;base64,AAAA'] };
      S.entries[iso].cycleData[ids[1]] = { water: '1100' };
      renderEntry(iso); })()`);
    const z = zeilen().map(x => x.textContent.replace(/\s+/g, ' '));
    pruefe(/6\/6\s*eingetragen/.test(z[0]), 'Gruppe 1 steht auf 6/6 (' + z[0].slice(0, 40) + ')');
    pruefe(/3\/6\s*eingetragen/.test(z[1]), 'Gruppe 2 steht auf 3/6 (Wasser, Temp, RLF) (' + z[1].slice(0, 40) + ')');
    pruefe(!/Alle 2 Gruppen/.test(kopf().textContent), 'Eine Gruppe fertig, die andere nicht: kein „alle fertig“');

    // Beide vollständig: einmal „alle fertig“
    E(`(function(){ const iso = todayISO(); const ids = ${JSON.stringify(ids)};
      S.entries[iso].cycleData[ids[1]] = { water: '1100', ph: '6.3', notes: 'auch ok', photos: ['data:image/png;base64,AAAA'] };
      renderEntry(iso); })()`);
    pruefe((kopf().textContent.match(/Alle 2 Gruppen/g) || []).length === 1, 'Beide fertig: „Alle 2 Gruppen“ steht genau einmal');
    pruefe(zeilen().every(x => /6\/6/.test(x.textContent)), 'Beide Zähler 6/6');
  }

  // Länge des Eintrags (zur Information im Bericht), frischer Tag ohne Werte
  E('S.entries = {}; renderEntry(todayISO())');
  console.log('INFO zwei Gruppen: Felder ' + body().querySelectorAll('input,select,textarea').length + ' · Knöpfe ' + body().querySelectorAll('button').length + ' · Zeichen ' + body().textContent.length);

  // ---------- eine Gruppe: unverändert ----------
  const id1 = lage(1);
  pruefe(!!id1, 'Prüflage: eine Gruppe mit Gießtag');
  pruefe(!kopf(), 'Eine Gruppe: kein Gruppen-Block');
  const alt = [...body().querySelectorAll('button')].filter(b => /jumpToEntryField\(/.test(b.getAttribute('onclick') || ''));
  pruefe(alt.length === 6, 'Eine Gruppe: genau sechs Sprung-Chips (' + alt.length + ')');
  pruefe(/0\/6\s*eingetragen/.test(body().textContent.replace(/\s+/g, ' ')), 'Eine Gruppe: „0/6 eingetragen“');
  pruefe(!/Alle \d+ Gruppen/.test(body().textContent), 'Eine Gruppe: kein „Alle … Gruppen“');
  console.log('INFO eine Gruppe: Felder ' + body().querySelectorAll('input,select,textarea').length + ' · Knöpfe ' + body().querySelectorAll('button').length + ' · Zeichen ' + body().textContent.length);
  // Kopfzeile für den Byte-Vergleich Basis gegen neu (Kennungen neutralisiert)
  if (process.env.GS_KOPF_AUS) {
    const k = alt[0] ? alt[0].parentElement.outerHTML.replace(/\s+/g, ' ').replace(/'[a-z0-9_-]{8,}'/gi, "'ID'") : '';
    fs.writeFileSync(process.env.GS_KOPF_AUS, k);
  }

  pruefe(errors.length === 0, 'Laufzeitfehler: ' + errors.slice(0, 2).join(' | '));
  console.log(`TZ=${process.env.TZ || '(System)'} · ${n - fehler.length}/${n} OK`);
  for (const f of fehler) console.log('  FEHL ' + f);
  process.exit(fehler.length ? 1 : 0);
})();
