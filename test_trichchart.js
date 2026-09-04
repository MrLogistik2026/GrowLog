// Das Reife-Diagramm endet am geplanten Erntetag, nicht am fernen Bernstein-Ziel.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-09-02');
  const r = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const out = {}, fehler = [];
    c.startDate = isoPlus(todayISO(), -109); c.anzuchtDays = 21; c.bloomDays = 85;
    c.iceDays = 2; c.harvestDays = 1;
    c.flushWetDays = 4; c.iceDryDays = 3; _syncFlushPhase(c); c.flushDryDays = 0; c._flushDryOff = true;
    const bauen = (amberSchritt) => {
      S.entries = {}; let cl = 45, am = 0.6;
      for (let d = 95; d <= 110; d++) {
        if (d > 95) { cl -= 2.0; am += amberSchritt; }
        const k = Math.max(0, +cl.toFixed(1));
        S.entries[isoPlus(c.startDate, d - 1)] = { cycleData: { [c.id]: { trichomes: { clear: k, milky: +(100 - k - am).toFixed(1), amber: +am.toFixed(2) } } } };
      }
      saveS();
    };
    const messen = () => {
      const iso = isoPlus(c.startDate, 109);
      const svg = _trichChartSVG(c, iso);
      const px = {};
      svg.replace(/<text[^>]*x="([0-9.]+)"[^>]*y="([0-9.]+)"[^>]*>(Spülen|Ernte|heute)</g,
        (m, x, y, t) => { px[t] = { x: parseFloat(x), y: parseFloat(y) }; return m; });
      const note = _trichPlanNote(c, iso, _trichHistory(c.id, c, iso).slice(-1)[0], 0);
      const skala = (px['Ernte'] && px['Spülen']) ? (px['Ernte'].x - px['Spülen'].x) / (note.harvestDay - note.flushDay) : null;
      return { px, dEnd: skala ? Math.round(96 + 272 / skala) : null, fc: _trichForecast(c, iso) };
    };

    // Fall A: langsamer Bernstein — Prognose weit hinter der Ernte
    bauen(0.06);
    const a = messen();
    out.langsam = { bernsteinBis: a.fc ? a.fc.dayHi : null, dEnd: a.dEnd };
    if (!a.fc || a.fc.dayHi < 150) fehler.push('Testfall greift nicht — Bernstein-Prognose zu nah');
    if (a.dEnd > 125) fehler.push('Achse läuft bis Tag ' + a.dEnd + ' statt bis kurz nach der Ernte');
    // Marker stehen weit genug auseinander oder sind versetzt
    const paare = [['Spülen','heute'], ['heute','Ernte'], ['Spülen','Ernte']];
    paare.forEach(([p1, p2]) => {
      const A = a.px[p1], B = a.px[p2];
      if (!A || !B) return;
      if (Math.abs(A.x - B.x) < 26 && A.y === B.y) fehler.push('„' + p1 + '" und „' + p2 + '" überlagern sich');
    });
    out.marker = Object.keys(a.px).map(k => k + '@' + Math.round(a.px[k].x) + '/' + a.px[k].y).join(' · ');

    // Fall B: schneller Bernstein — Prognose innerhalb des Fensters, Achse darf mitgehen
    bauen(0.22);
    const b = messen();
    out.schnell = { bernsteinBis: b.fc ? b.fc.dayHi : null, dEnd: b.dEnd };
    if (b.dEnd > 130) fehler.push('Achse auch im schnellen Fall zu weit (' + b.dEnd + ')');
    return JSON.stringify({ out, fehler });
  })()`));
  Object.entries(r.out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(r.fehler.length ? 'FAIL\n  ' + r.fehler.join('\n  ') : 'OK trichchart');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(r.fehler.length ? 1 : 0);
})();
