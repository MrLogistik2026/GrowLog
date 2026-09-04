const { boot } = require('./audit_lib');
const SCREENS = [['renderDash','scr-dash'],['renderCal','scr-cal'],['renderTips','scr-tips'],['renderDuenger','scr-duenger'],['renderGussplan','scr-gussplan'],['renderSet','scr-set'],['renderLexikon','scr-lexikon'],['renderHowto','scr-howto'],['renderGallery','scr-gallery']];
(async () => {
  const { ev, runtime } = await boot('2026-08-22');
  const r = JSON.parse(ev(`(function(){
    const c = S.cycles[0];
    const probleme = [];
    [true, false].forEach(bm => {
      S.beginnerMode = bm;
      ${JSON.stringify(SCREENS)}.forEach(([fn, scr]) => {
        try { window[fn](); } catch (e) { probleme.push((bm?'A':'P') + '/' + fn + ' Absturz: ' + e.message); return; }
        const el = document.getElementById(scr);
        const txt = el ? el.textContent : '';
        if (/NaN/.test(txt)) probleme.push((bm?'A':'P') + '/' + fn + ': NaN');
        if (/undefined/.test(txt)) probleme.push((bm?'A':'P') + '/' + fn + ': undefined');
        if (/\\[object Object\\]/.test(txt)) probleme.push((bm?'A':'P') + '/' + fn + ': [object Object]');
        if (txt.length < 50) probleme.push((bm?'A':'P') + '/' + fn + ': fast leer');
      });
      [1, 25, 60, 94, 106, 113].forEach(d => {
        try {
          openEntry(isoPlus(c.startDate, d - 1));
          const t = document.getElementById('scr-entry').textContent;
          if (/NaN|undefined|\\[object Object\\]/.test(t)) probleme.push((bm?'A':'P') + '/Eintrag Tag ' + d + ': kaputter Text');
        } catch (e) { probleme.push((bm?'A':'P') + '/Eintrag Tag ' + d + ' Absturz: ' + e.message); }
      });
    });
    return JSON.stringify({ probleme });
  })()`));
  console.log('Laufzeitfehler:', runtime.length ? runtime.join(' | ') : 'keine');
  console.log(r.probleme.length ? 'Auffälligkeiten:\n  ' + r.probleme.join('\n  ') : 'keine Auffälligkeiten');
  process.exit(r.probleme.length ? 1 : 0);
})();
