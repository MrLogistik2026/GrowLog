// (v1.5.493) Einsteiger-Tageseintrag: oben die Aufgabe von heute, darunter nur, was heute eingetragen wird; Erklär- und Nebenblöcke
// gesammelt in einem zugeklappten Bereich „Mehr eintragen und Erklärungen“. Der Profi-Eintrag bleibt unverändert.
//
// Befund (zweite Bedien-Prüfung, 30.10.2026, Befund 3; UEBERGABE.md 0c und 1): Am Gießtag hatte der Einsteiger-Eintrag 9 Felder, 33
// Knöpfe und 2623 sichtbare Zeichen — der Profi kaum mehr. Vor dem Mengenfeld standen 1799 Zeichen: Banner „Keine Panik“,
// Toppen-/Trainings-Block, Gieß-Karte mit Vorschlag, Lern-Status, Gieß-Guide und Gießanleitung — drei Mengen für einen Guss.
//
// GS_INDEX=<anderer Build> lässt den Test gegen einen alten Stand laufen; dort muss er umfallen.
// GS_BASIS=<Build vor dem Umbau> schaltet zusätzlich den Byte-Vergleich des Profi-Eintrags ein (z. B. .claude/tmp/basis488/index.html).
// (v1.5.505) Nur noch auf Wunsch: Seit v1.5.505 ändern Text-Berichtigungen nach ANBAU.md auch den Profi-Eintrag (Gießanleitung,
// Hinweise), der Vergleich mit v1.5.488 wäre damit dauerhaft rot. Für v1.5.493 hat er seinen Zweck erfüllt; die Aufbau-Prüfungen
// in Abschnitt 5 laufen weiter.
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const INDEX = process.env.GS_INDEX || path.join(__dirname, 'index.html');
const BASIS = process.env.GS_BASIS || '';
const HTML = fs.readFileSync(INDEX, 'utf8');
// (v1.5.502) Die Drain-Zeile darf seitdem umbrechen — diese eine bewusste Änderung rechnet der Vergleich heraus, alles andere bleibt
// zeichengenau gegen v1.5.488.
const norm = (h) => h.replace(/\d{13}/g, 'CID').replace(/p_[a-z0-9]{8}/g, 'PID')
  .replace(/<!-- \(v1\.5\.502\)[\s\S]*?-->\s*/g, '')
  .replace('display:flex;align-items:center;flex-wrap:wrap;gap:8px;row-gap:6px;padding:0 4px', 'display:flex;align-items:center;gap:8px;padding:0 4px')
  .replace('style="flex:1;min-width:90px;text-align:right;', 'style="flex:1;text-align:right;');

async function neu(html) {
  const errors = [];
  const vc = new VirtualConsole();
  const sammle = (m) => { if (!/Not implemented/i.test(m)) errors.push(m); };
  vc.on('jsdomError', (e) => sammle(String((e && e.message) || e)));
  vc.on('error', (...a) => sammle(a.map(String).join(' ')));
  const dom = new JSDOM(html || HTML, {
    url: 'https://growsmart.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => null; w.navigator.vibrate = () => true; w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {}; w.alert = () => {}; w.print = () => {}; },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => { w.addEventListener('load', r, { once: true }); setTimeout(r, 5000); });
  await new Promise((r) => setTimeout(r, 80));
  const toasts = [];
  w.toast = (t) => { toasts.push(String(t)); };
  return { w, E: (s) => w.eval(s), errors, toasts };
}

// Zyklus (mit Wunschaktion) anlegen: Erde, drei Pflanzen, Hebe-Test-Modus; optional eine zweite Gruppe 3 Tage jünger.
function lage(E, o) {
  return JSON.parse(E(`(function(){ S.cycles = []; S.entries = {}; S._seedlingProtocolShown = true; S.beginnerMode = ${o.beginner !== false};
    const mk = (name, t) => { const c = addCyc({ name, startDate: isoPlus(todayISO(), -(t - 1)), seedType: 'auto', growType: 'indoor', medium: 'erde',
      potSize: 11, plantCount: 3, startMethod: 'saturated' }, { still: true }); c.weightMode = 'lift'; return c; };
    const want = ${JSON.stringify(o.want || '*')};
    for (let t = ${o.min}; t <= ${o.max}; t++) {
      const c1 = mk('Test', t); S.cycles = [c1];
      ${o.zwei ? `S.cycles = [c1, mk('Zwei', t + ${o.zwei})];` : ''}
      const a = getAction(todayISO(), c1);
      if (want === '*' || a === want) return JSON.stringify({ tag: t, a: a, id: c1.id });
    }
    return 'null'; })()`));
}
// Sichtbar: nicht in einem zugeklappten <details>, nicht display:none.
function sicht(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (n.tagName === 'DETAILS' && !n.open && n !== el) return false;
    if (n.style && n.style.display === 'none') return false;
    if (n.id === 'entry-body') break;
  }
  return true;
}
function messe(w) {
  const b = w.document.getElementById('entry-body');
  const felder = [...b.querySelectorAll('input,textarea,select')].filter(sicht).length;
  const knoepfe = [...b.querySelectorAll('button')].filter(sicht).length;
  let zeichen = 0, vorWasser = 0, gesehen = false, text = '';
  const wf = b.querySelector('[id^="water-calc-"]');
  const gang = w.document.createTreeWalker(b, 4);
  let nd;
  while ((nd = gang.nextNode())) {
    const t = nd.nodeValue.replace(/\s+/g, ' ').trim();
    if (!t || !sicht(nd.parentElement)) continue;
    zeichen += t.length; text += ' ' + t;
    if (wf && !gesehen) { if (wf.compareDocumentPosition(nd) & 2) vorWasser += t.length; else gesehen = true; }
  }
  const det = b.querySelector('details[data-ez-mehr]');
  return { felder, knoepfe, zeichen, vorWasser: wf ? vorWasser : null, text, mehr: det ? det.textContent.replace(/\s+/g, ' ') : '', det };
}
const oeffne = (E) => E('openEntry(todayISO())');
const aufgabe = (w) => { const k = w.document.querySelector('[data-ez-aufgabe]'); return k ? k.textContent.replace(/\s+/g, ' ') : ''; };

(async () => {
  const fehler = []; let n = 0;
  const pruefe = (ok, text) => { n++; if (!ok) fehler.push(text); };
  const alleFehler = [];
  const lauf = async (o) => { const e = await neu(); const r = lage(e.E, o); oeffne(e.E); e.r = r; e.m = messe(e.w); alleFehler.push(...e.errors); return e; };

  // 1. Gießtag (Erde, Tag ~42): Zahlen vor und nach dem Umbau (v1.5.488: 9 Felder · 33 Knöpfe · 2623 Zeichen · 1799 Zeichen vor dem Mengenfeld)
  {
    const e = await lauf({ min: 40, max: 50, want: 'giess' });
    const { m } = e;
    pruefe(e.r && e.r.a === 'giess', 'Prüflage: Gießtag gefunden');
    pruefe(m.zeichen <= 1900, 'Gießtag: höchstens 1900 sichtbare Zeichen (v1.5.488: 2623) — ' + m.zeichen);
    pruefe(m.vorWasser !== null && m.vorWasser <= 1200, 'Gießtag: höchstens 1200 Zeichen vor dem Mengenfeld (v1.5.488: 1799) — ' + m.vorWasser);
    pruefe(m.knoepfe <= 30, 'Gießtag: höchstens 30 sichtbare Knöpfe (v1.5.488: 33) — ' + m.knoepfe);
    pruefe(m.felder >= 9, 'Gießtag: kein Eingabefeld verloren (mindestens 9 sichtbar, v1.5.488: 9) — ' + m.felder);
    const a = aufgabe(e.w);
    pruefe(/Heute zu tun/.test(a) && /Gießtag/.test(a), 'Aufgabenzeile nennt den Gießtag — „' + a.slice(0, 60) + '“');
    pruefe(/ml je Pflanze/.test(a), 'Aufgabenzeile nennt die Menge je Pflanze (wie das Mengenfeld)');
    pruefe(/Hebe-Test/.test(a), 'Aufgabenzeile schickt erst zum Hebe-Test');
    pruefe(e.w.document.querySelector('[data-ez-aufgabe]') === e.w.document.getElementById('entry-body').firstElementChild, 'Aufgabenzeile steht ganz oben');
    // eine Menge: Vorschlags-Karte, Lern-Status, Gieß-Guide, Anleitung und Banner stehen nur noch im Zuklapper
    for (const wort of ['Gieß-Guide', 'Lern-Status', 'Vorschlag:', 'Gießanleitung', 'Keine Panik', 'Training hinzufügen', 'Toppen nicht mehr empfohlen']) {
      pruefe(!m.text.includes(wort), `„${wort}“ steht nicht mehr oben`);
      pruefe(m.mehr.includes(wort), `„${wort}“ ist nicht weg, sondern im Zuklapper`);
    }
    pruefe(!/Anrühren: ~/.test(m.text) && /Anrühren: ~/.test(m.mehr), 'Anrühr-Zeile des Gieß-Guides liegt im Zuklapper');
    pruefe(!!m.det && !m.det.open, 'Der Zuklapper ist zu');
    pruefe(/Mehr eintragen und Erklärungen/.test(m.det ? m.det.querySelector('summary').textContent : ''), 'Der Zuklapper heißt „Mehr eintragen und Erklärungen“');
    const b = e.w.document.getElementById('entry-body');
    pruefe(!!m.det && m.det.nextElementSibling && m.det.nextElementSibling.classList.contains('big-save'), 'Der Zuklapper steht vor „Speichern“');
    for (const sel of ['[id^="water-calc-"]', '[id^="ph-"]', '[id^="ec-"]', '#et', '#er', '.note-ta', '.photo-add', '.big-save', '[onclick^="setLiftFeel("]']) {
      const el = b.querySelector(sel);
      pruefe(!!el && sicht(el), 'Bleibt oben sichtbar: ' + sel);
    }
    // nichts doppelt: Fortschrittszeile mit den sechs Sprung-Chips bleibt
    pruefe(b.querySelectorAll('[onclick^="jumpToEntryField("]').length === 6, 'Fortschrittszeile mit sechs Sprung-Chips bleibt');
    // Sprung in ein Feld im zugeklappten Bereich öffnet ihn (das Mengen-/Klimafeld liegt heute oben; hier wird eins hineingelegt)
    const id = e.r.id;
    const inhalt = m.det && m.det.querySelector('[data-ez-inhalt]');
    if (inhalt) {
      inhalt.appendChild(e.w.document.getElementById('et'));
      pruefe(!sicht(e.w.document.getElementById('et')), 'Prüflage: Temperaturfeld liegt im zugeklappten Bereich');
      e.E(`jumpToEntryField(${JSON.stringify(id)}, 'temp')`);
      pruefe(m.det.open === true, 'Der Sprung zum Feld im zugeklappten Bereich öffnet ihn');
    } else pruefe(false, 'Zuklapper vorhanden (Sprung-Prüfung)');
    // die echten Ziele der sechs Chips + Hebe-Test sind am Gießtag erreichbar, ohne Hinweis „gibt es nicht“
    const e2 = await lauf({ min: 40, max: 50, want: 'giess' });
    for (const was of ['water', 'ph', 'rh', 'note', 'photo', 'hebe']) { e2.E(`jumpToEntryField(${JSON.stringify(e2.r.id)}, '${was}')`); }
    pruefe(!e2.toasts.some(t => /gibt es/.test(t)), 'Alle Sprung-Chips treffen ein Feld (' + e2.toasts.join(' | ') + ')');
    // Zuklapper bleibt beim Neuzeichnen offen (Tippen löst Neuzeichnen aus)
    const d2 = e2.w.document.querySelector('details[data-ez-mehr]') || e2.w.document.createElement('details');
    d2.open = true; d2.dispatchEvent(new e2.w.Event('toggle'));
    e2.E('renderEntry(todayISO())');
    const d3 = e2.w.document.querySelector('details[data-ez-mehr]');
    pruefe(!!d3 && d3.open === true, 'Offener Zuklapper bleibt nach dem Neuzeichnen offen');
    e2.E('openEntry(isoPlus(todayISO(), 1))');
    const d4 = e2.w.document.querySelector('details[data-ez-mehr]');
    pruefe(!d4 || d4.open === false, 'Am anderen Tag startet er wieder zu');
  }

  // 2. Warnungen bleiben oben (pH kritisch, Dünger-Wert, Schimmel); Aufgabe passt zum Zustand des Topfs
  {
    const e = await lauf({ min: 40, max: 50, want: 'giess' });
    const id = e.r.id;
    e.E(`(function(){ const iso = todayISO(); S.entries[iso] = { cycleData: { [${JSON.stringify(id)}]: { water: '900', ph: '4.2', ec: '3.6' } }, temp: '25', humidity: '80' }; })()`);
    oeffne(e.E);
    const m = messe(e.w);
    pruefe(/pH 4[.,]2 ist zu sauer/.test(aufgabe(e.w)), 'Fehler-Meldung (pH) steht in der Aufgabenzeile oben');
    pruefe(/Schimmelrisiko/.test(aufgabe(e.w)), 'Klima-Warnung (Schimmel) steht in der Aufgabenzeile oben');
    pruefe(/pH 4[.,]2 ist gefährlich niedrig/.test(m.text), 'Kritische Warnung am pH-Feld bleibt sichtbar (nicht im Zuklapper)');
    pruefe(!/gefährlich niedrig|Schimmelrisiko/.test(m.mehr), 'Keine Warnung ist in den Zuklapper gewandert');
    pruefe(/Gegossen — 900 ml/.test(aufgabe(e.w)), 'Eingetragener Guss: „Gegossen — 900 ml“');
    // voller Topf
    const e3 = await lauf({ min: 40, max: 50, want: 'giess' });
    e3.E(`(function(){ const iso = todayISO(); S.entries[iso] = { cycleData: { [${JSON.stringify(e3.r.id)}]: { restPct: 100, _restPctUserSet: true } } }; })()`);
    oeffne(e3.E);
    pruefe(/nicht gießen/.test(aufgabe(e3.w)), 'Hebe-Test „Voll“: Aufgabenzeile sagt „heute nicht gießen“ — „' + aufgabe(e3.w).slice(0, 120) + '“');
    alleFehler.push(...e.errors, ...e3.errors);
  }

  // 3. Jeder Tagestyp zeigt oben seine Aufgabe
  const tage = [
    ['Sättigungsguss (Tag 1)', { min: 1, max: 1 }, /Sättigungsguss/, /je (Pflanze|Topf)/],   // (v1.5.495) die Karte nennt selbst „je Topf“
    ['Sprüh-Tag', { min: 4, max: 4 }, /sprühen/, null],
    ['Anzucht-Gießtag', { min: 12, max: 12 }, /Anzucht gießen/, /ml je Pflanze/],
    ['Tag ohne Gießen', { min: 40, max: 40 }, /Ruhiger Tag/, null],
    ['Spültag', { min: 80, max: 92, want: 'spuelen' }, /Spültag/, /je Pflanze/],
    ['IceFlush', { min: 80, max: 96, want: 'ice' }, /IceFlush/, null],
    ['Erntetag', { min: 90, max: 99, want: 'ernte' }, /Erntetag/, null],
    ['Trocknung', { min: 98, max: 98 }, /Trocknung/, null],
  ];
  const sprueh = {};
  for (const [name, o, re1, re2] of tage) {
    const e = await lauf(Object.assign({ want: '*' }, o));
    const a = aufgabe(e.w);
    pruefe(e.r !== null, name + ': Prüflage gefunden');
    pruefe(/Heute zu tun/.test(a) && re1.test(a), `${name}: Aufgabenzeile nennt die Aufgabe — „${a.slice(0, 80)}“`);
    if (re2) pruefe(re2.test(a), `${name}: Aufgabenzeile nennt die Menge je Pflanze`);
    pruefe(!!e.m.det, name + ': Zuklapper vorhanden');
    if (name === 'Sprüh-Tag') {
      sprueh.m = e.m;
      pruefe(e.m.zeichen <= 1700, 'Sprüh-Tag: höchstens 1700 sichtbare Zeichen (v1.5.488: 2561) — ' + e.m.zeichen);
      pruefe(!e.m.text.includes('wie keimst du') && e.m.mehr.includes('wie keimst du'), 'Sprüh-Tag: die Keimungs-Karte liegt im Zuklapper');
      pruefe(!e.m.text.includes('Sämling-Grundregeln') && e.m.mehr.includes('Sämling-Grundregeln'), 'Sprüh-Tag: die Sämling-Grundregeln liegen im Zuklapper');
      pruefe(e.m.text.includes('Sämlings-Pflege'), 'Sprüh-Tag: „Heute: …“ der Sämlings-Pflege bleibt oben');
    }
    if (name === 'Sättigungsguss (Tag 1)') pruefe(e.m.text.includes('wie keimst du'), 'Tag 1: die Keimungs-Karte bleibt oben');
    if (name === 'Tag ohne Gießen') pruefe(e.m.zeichen <= 1400, 'Ruhetag: höchstens 1400 sichtbare Zeichen (v1.5.488: 1484) — ' + e.m.zeichen);
    if (name === 'Spültag' || name === 'IceFlush' || name === 'Erntetag') pruefe(e.m.felder >= 8, name + ': Felder bleiben');
  }

  // 4. Zwei Gruppen: beide Aufgaben oben, beide Fortschrittszeilen bleiben
  {
    const e = await lauf({ min: 40, max: 50, want: 'giess', zwei: 3 });
    const a = aufgabe(e.w);
    pruefe(/Test/.test(a) && /Zwei/.test(a), 'Zwei Gruppen: die Aufgabenzeile nennt beide');
    pruefe((a.match(/Gießtag/g) || []).length >= 2, 'Zwei Gruppen: jede Gruppe hat ihre Aufgabe');
    pruefe(e.w.document.querySelectorAll('[data-gruppen-fortschritt] > div[style*="border-left"]').length === 2, 'Zwei Gruppen: je Gruppe eine Fortschrittszeile');
    pruefe(e.m.zeichen <= 5200, 'Zwei Gruppen: höchstens 5200 sichtbare Zeichen (v1.5.488: 7168) — ' + e.m.zeichen);
  }

  // 5. Profi-Modus: unverändert
  {
    const profi = [[1, 1], [4, 4], [12, 12], [40, 50], [86, 86], [92, 92]];
    const hatBasis = !!BASIS && fs.existsSync(BASIS);
    const basisHtml = hatBasis ? fs.readFileSync(BASIS, 'utf8') : null;
    for (const [lo, hi] of profi) {
      const o = { min: lo, max: hi, want: lo === 40 ? 'giess' : '*', beginner: false };
      const e = await lauf(o);
      const h = e.w.document.getElementById('entry-body').innerHTML;
      pruefe(!/data-ez/.test(h), `Profi Tag ${e.r && e.r.tag}: keine Marken, kein Zuklapper, keine Aufgabenzeile`);
      if (lo === 40) for (const wort of ['Gieß-Guide', 'Lern-Status', 'Gießanleitung', 'Training hinzufügen']) pruefe(h.includes(wort), `Profi: „${wort}“ bleibt in seinem Eintrag`);
      if (hatBasis) {
        const b = await neu(basisHtml);
        lage(b.E, o); oeffne(b.E);
        pruefe(norm(h) === norm(b.w.document.getElementById('entry-body').innerHTML), `Profi Tag ${e.r && e.r.tag}: Eintrag byte-gleich zu v1.5.488`);
      }
    }
    if (!hatBasis) console.log('  (Byte-Vergleich mit der Basis übersprungen — GS_BASIS nicht gesetzt)');
  }

  pruefe(alleFehler.length === 0, 'Keine Laufzeitfehler: ' + alleFehler.slice(0, 3).join(' | '));
  console.log(fehler.length ? '✗ ' + fehler.length + ' von ' + n + ' Prüfungen fehlgeschlagen:\n  - ' + fehler.join('\n  - ') : '✓ ' + n + ' Prüfungen bestanden');
  process.exit(fehler.length ? 1 : 0);
})();
