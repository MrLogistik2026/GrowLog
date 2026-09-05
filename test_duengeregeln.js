/**
 * Prueft, dass die Karte "Duenge-Regeln" (Tipps) ihre Werte aus dem eigenen Zustand
 * nimmt statt aus festen Zahlen: pH-Ziel aus dem Substrat (phTargetFor ist dafuer die
 * einzige Quelle), Mischreihenfolge aus dem aktiven Duengeplan.
 *
 * Hintergrund: Vorher stand dort fest "immer auf 6.4" — der Erde-Wert, falsch fuer jeden
 * Coco- und Hydro-Grow — und "Erst CalMag", was jedem Plan mit Silikat widerspricht.
 * Silikat ist stark alkalisch und faellt mit Calcium sofort als Calciumsilikat aus
 * (ANBAU.md 10); der cup_sieger-Plan sagt selbst "Silica Force IMMER zuerst".
 */
const { loadApp } = require('./harness.js');

(async () => {
  const { window, errors } = await loadApp();
  const w = window;
  const fail = [];
  const ok = (b, t) => { if (!b) fail.push(t); console.log((b ? '  ok   ' : '  FEHL ') + t); };
  if (errors.length) fail.push('Startfehler: ' + errors.length);

  // Zustand herstellen: ein aktiver Zyklus, dessen Substrat und Plan wir umstellen koennen.
  const karte = (medium, mixOrder) => w.eval(`
    (function () {
      var c = active()[0];
      if (!c) { c = { id: 'x', active: true, startDate: todayISO(), seedType: 'auto' };
                S.cycles = S.cycles || []; S.cycles.push(c); }
      c.medium = ${JSON.stringify(medium)};
      S.mixOrder = ${JSON.stringify(mixOrder)};
      S._tipsOpen = S._tipsOpen || {}; S._tipsOpen.duenge = true;
      renderTips();
      var t = document.getElementById('tips-body').innerText || document.getElementById('tips-body').textContent;
      var i = t.indexOf('pH-Wert');
      return t.slice(i, i + 420);
    })()
  `);

  console.log('\n--- Erde, Plan beginnt mit CalMag ---');
  const a = karte('erde', ['CalMag', 'Bio-Grow']);
  console.log('  ' + a.split('\n').slice(0, 3).join(' | '));
  ok(/6,2–6,4/.test(a), 'Erde zeigt 6,2–6,4');
  ok(/für Erde/.test(a), 'Das Substrat wird benannt');
  ok(/CalMag/.test(a), 'Die Reihenfolge nennt das erste Produkt des Plans');

  console.log('\n--- Coco, gleicher Plan ---');
  const b = karte('coco', ['CalMag', 'Coco A']);
  console.log('  ' + b.split('\n').slice(0, 3).join(' | '));
  ok(/5,8–6,2/.test(b), 'Coco zeigt 5,8–6,2 statt des Erde-Werts');
  ok(!/6,2–6,4/.test(b), 'Der Erde-Wert steht in Coco nicht mehr da');
  ok(/für Coco/.test(b), 'Coco wird benannt');

  console.log('\n--- Hydro ---');
  const c = karte('hydro', ['CalMag']);
  ok(/5,5–6,0/.test(c), 'Hydro zeigt 5,5–6,0');

  console.log('\n--- Plan mit Silikat zuerst ---');
  const d = karte('erde', ['Silica Force', 'CalMag', 'Bio-Grow']);
  console.log('  ' + d.split('\n').slice(0, 3).join(' | '));
  ok(/Silica Force/.test(d), 'Silica Force steht als erster Schritt da');
  ok(/wei(ß|ss)e Flocken|Calcium/.test(d), 'Der Grund fuer Silikat-zuerst wird genannt');
  ok(!/Erst CalMag → umrühren → dann Rest/.test(d), 'Die alte feste Reihenfolge ist weg');

  console.log('\n--- Ohne Duengeplan ---');
  const e = karte('erde', []);
  console.log('  ' + e.split('\n').slice(0, 3).join(' | '));
  ok(/Silikat/.test(e), 'Ohne Plan wird der allgemeine Hinweis gezeigt');
  ok(!/undefined|null/.test(e), 'Kein leerer Platzhalter im Text');

  console.log('\n--- Produktname nicht mehr fest verdrahtet ---');
  ok(!/Bio·Bloom um 20% reduzieren/.test(a), 'Die Ueberduengungs-Zeile nennt kein fremdes Produkt mehr');

  console.log('\n' + (fail.length ? 'FEHLGESCHLAGEN: ' + fail.length : 'ALLE PRUEFUNGEN GRUEN') + '  (TZ=' + (process.env.TZ || 'System') + ')');
  process.exit(fail.length ? 1 : 0);
})();
