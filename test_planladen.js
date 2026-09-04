// Jeder Weg, einen Plan zu laden, muss das Phasen-Rückgrat mitbringen.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-09-02');
  const out = {}, fehler = [];

  // 1) Alle Presets sind unversehrt und vollständig etikettiert
  const presets = JSON.parse(ev(`(function(){
    const f = [], o = {};
    Object.keys(FERT_PRESETS).forEach(k => {
      const p = FERT_PRESETS[k];
      const w = Object.keys(p.schedule).length;
      o[k] = w;
      if (!p.products || !p.products.length) f.push(k + ': keine Produkte');
      if (!p.weekPhases || p.weekPhases.length !== w) f.push(k + ': Etiketten passen nicht zu ' + w + ' Wochen');
      // Jede Wochenzeile nennt nur Produkte, die es im Plan gibt
      const namen = p.products.map(x => x.name);
      Object.entries(p.schedule).forEach(([wk, row]) => {
        Object.keys(row || {}).forEach(nm => {
          if (nm === 'note' || nm === 'phase' || nm === 'tip') return;
          if (!namen.includes(nm)) f.push(k + ' Woche ' + wk + ': unbekanntes Produkt „' + nm + '"');
        });
      });
    });
    return JSON.stringify({ o, f });
  })()`));
  out.presets = Object.keys(presets.o).length;
  fehler.push(...presets.f);

  // 2) Das Auffrischen setzt Rückgrat und Zielwerte, ohne Dosierungen zu berühren
  const frisch = JSON.parse(ev(`(function(){
    const f = [];
    const pl = { id: 'x', name: 'alt', presetKey: 'biobizz_master',
      products: JSON.parse(JSON.stringify(FERT_PRESETS.biobizz_master.products)),
      schedule: { w4: { 'Bio·Grow': 1.2, 'Bio·Bloom': 1 } } };
    const vorher = JSON.stringify(pl.schedule);
    const ge = _planRueckgratAuffrischen(pl, FERT_PRESETS.biobizz_master);
    if (!ge) f.push('Auffrischen meldet keine Änderung');
    if (!pl.weekPhases || pl.weekPhases.length !== 12) f.push('Rückgrat nicht gesetzt (' + (pl.weekPhases ? pl.weekPhases.length : 0) + ')');
    if (JSON.stringify(pl.schedule) !== vorher) f.push('Dosierungen wurden verändert');
    // Zweiter Aufruf ändert nichts mehr
    if (_planRueckgratAuffrischen(pl, FERT_PRESETS.biobizz_master)) f.push('zweiter Aufruf meldet erneut eine Änderung');
    return JSON.stringify({ o: { phasen: pl.weekPhases.length }, f });
  })()`));
  out.auffrischen = frisch.o; fehler.push(...frisch.f);

  // 3) Beide Ladewege in loadPreset frischen auf — sonst entsteht wieder ein Plan ohne Raster
  const wege = ev(`(function(){
    const src = loadPreset.toString();
    return (src.match(/_planRueckgratAuffrischen/g) || []).length;
  })()`);
  out.ladewege = wege;
  if (wege < 2) fehler.push('loadPreset frischt nicht auf allen Wegen auf (' + wege + ')');

  // 3b) Ein Altbestand-Plan bekommt das Rückgrat beim Laden nachgetragen
  const alt = JSON.parse(ev(`(function(){
    const f = [];
    S.fertPlans.push({ id: 'alt_x', name: 'Alt', presetKey: 'hesi',
      products: JSON.parse(JSON.stringify(FERT_PRESETS.hesi.products)), schedule: {}, createdAt: 1 });
    saveS(); loadS();
    const pl = S.fertPlans.find(x => x.id === 'alt_x');
    if (!pl) f.push('Plan verschwunden beim Laden');
    else if (!pl.weekPhases || pl.weekPhases.length !== 10) f.push('Altbestand ohne Rückgrat (' + (pl.weekPhases ? pl.weekPhases.length : 0) + ')');
    return JSON.stringify({ o: { phasen: pl && pl.weekPhases ? pl.weekPhases.length : 0 }, f });
  })()`));
  out.altbestand = alt.o; fehler.push(...alt.f);

  // 4) Dosierungen bleiben beim Auffrischen unangetastet
  const dosen = JSON.parse(ev(`(function(){
    const pl = S.fertPlans.find(x => x.id === 'alt_x'); const f = [];
    pl.schedule = { w3: { 'Blüh Complex': 2.5 } };
    const key = 'w3';
    const vorher = JSON.stringify(pl.schedule[key]);
    _planRueckgratAuffrischen(pl, FERT_PRESETS.hesi);
    if (JSON.stringify(pl.schedule[key]) !== vorher) f.push('Auffrischen hat Dosierungen verändert');
    return JSON.stringify({ o: { woche: key }, f });
  })()`));
  fehler.push(...dosen.f);

  Object.entries(out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(fehler.length ? 'FAIL\n  ' + fehler.join('\n  ') : 'OK planladen');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(fehler.length ? 1 : 0);
})();
