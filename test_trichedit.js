// Eine Zahl ändern heißt: nur diese Zahl ändert sich, der Ausgleich ist vorhersagbar.
const { boot } = require('./audit_lib');
(async () => {
  const { ev, runtime } = await boot('2026-09-02');
  const r = JSON.parse(ev(`(function(){
    const c = S.cycles[0]; const out = {}, fehler = [];
    c.startDate = isoPlus(todayISO(), -109); c.anzuchtDays = 21; c.bloomDays = 85;
    S.entries = {};
    let cl = 45, am = 0.6;
    for (let d = 95; d <= 110; d++) {
      if (d > 95) { cl -= 2.0; am += 0.22; }
      const k = Math.max(0, +cl.toFixed(1));
      S.entries[isoPlus(c.startDate, d - 1)] = { cycleData: { [c.id]: { trichomes: { clear: k, milky: +(100 - k - am).toFixed(1), amber: +am.toFixed(2) } } } };
    }
    saveS(); S.beginnerMode = false;
    const iso = isoPlus(c.startDate, 109); editISO = iso; openEntry(iso);
    const T = () => { const t = S.entries[iso].cycleData[c.id].trichomes; return { c: t.clear, m: t.milky, a: t.amber }; };
    const summe = (t) => Math.round((t.c + t.m + t.a) * 10) / 10;

    // 1) Bernstein hoch → Milchig gleicht aus, Klar bleibt (Patricks Fall)
    const v1 = T();
    uTrich(c.id, 'amber', v1.a + 1.5, iso);
    const n1 = T();
    out.bernsteinHoch = { vorher: v1, nachher: n1 };
    if (n1.c !== v1.c) fehler.push('Klar hat sich bei einer Bernstein-Änderung mitbewegt');
    if (n1.m >= v1.m) fehler.push('Milchig ist bei mehr Bernstein nicht gefallen');
    if (summe(n1) !== 100) fehler.push('Summe nicht 100 (' + summe(n1) + ')');

    // 2) Klar ändern → Milchig gleicht aus, Bernstein bleibt
    const v2 = T();
    uTrich(c.id, 'clear', v2.c - 3, iso);
    const n2 = T();
    if (n2.a !== v2.a) fehler.push('Bernstein hat sich bei einer Klar-Änderung mitbewegt');
    if (Math.abs(n2.m - (v2.m + 3)) > 0.15) fehler.push('Milchig gleicht die Klar-Änderung nicht aus');
    if (summe(n2) !== 100) fehler.push('Summe nach Klar-Änderung nicht 100');

    // 3) Milchig ändern → Klar gleicht aus, Bernstein bleibt
    const v3 = T();
    uTrich(c.id, 'milky', v3.m - 4, iso);
    const n3 = T();
    if (n3.a !== v3.a) fehler.push('Bernstein hat sich bei einer Milchig-Änderung mitbewegt');
    if (Math.abs(n3.c - (v3.c + 4)) > 0.15) fehler.push('Klar gleicht die Milchig-Änderung nicht aus');
    out.milchigRunter = { vorher: v3, nachher: n3 };

    // 4) Grenzen: kein negativer Wert, Summe bleibt 100
    uTrich(c.id, 'amber', 98, iso);
    const n4 = T();
    out.grenze = n4;
    if (n4.c < 0 || n4.m < 0) fehler.push('negativer Anteil möglich');
    if (summe(n4) !== 100) fehler.push('Summe an der Grenze nicht 100');

    // 5) Angebot erscheint nach deutlicher Bernstein-Korrektur und wirkt nur auf Tippen
    uTrich(c.id, 'clear', 15, iso);
    uTrich(c.id, 'amber', 4, iso);
    const vorAngebot = T();
    out.angebot = S._trichHint ? { klar: S._trichHint.clear, tage: S._trichHint.tage } : null;
    if (!S._trichHint) fehler.push('kein Angebot nach deutlicher Bernstein-Korrektur');
    if (S._trichHint && T().c !== vorAngebot.c) fehler.push('Angebot hat ungefragt gewirkt');
    openEntry(iso);
    if (!/nachziehen/.test(document.getElementById('scr-entry').textContent)) fehler.push('Angebot steht nicht in der Karte');
    applyTrichKlar();
    const n5 = T();
    out.nachAngebot = n5;
    if (n5.c === vorAngebot.c) fehler.push('Angebot hat beim Tippen nichts geändert');
    if (summe(n5) !== 100) fehler.push('Summe nach dem Angebot nicht 100');
    if (S._trichHint) fehler.push('Angebot bleibt nach dem Tippen stehen');

    // 6) Schritt-Knöpfe: reifer schiebt alle drei entlang des Tempos
    openEntry(iso);
    if (!/etwas reifer/.test(document.getElementById('scr-entry').textContent)) fehler.push('Schritt-Knöpfe fehlen');
    const v6 = T();
    stepTrich(c.id, 1);
    const n6 = T();
    out.reifer = { vorher: v6, nachher: n6 };
    if (n6.c >= v6.c) fehler.push('„reifer" senkt Klar nicht');
    if (n6.a <= v6.a) fehler.push('„reifer" hebt Bernstein nicht');
    if (summe(n6) !== 100) fehler.push('Summe nach „reifer" nicht 100');
    stepTrich(c.id, -1);
    const n7 = T();
    if (Math.abs(n7.c - v6.c) > 0.2) fehler.push('„klarer" macht „reifer" nicht rückgängig');
    editISO = null;
    return JSON.stringify({ out, fehler });
  })()`));
  Object.entries(r.out).forEach(([k, v]) => console.log('  ' + k + ': ' + JSON.stringify(v)));
  console.log(r.fehler.length ? 'FAIL\n  ' + r.fehler.join('\n  ') : 'OK trichedit');
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  process.exit(r.fehler.length ? 1 : 0);
})();
